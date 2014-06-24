var _ = require("underscore");

/**
 * Nodejs modules
 */
var events = require('events');
var path = require("path");
var util = require('util');

var Cache = (function () {
    'use strict';

    /**
     * @private
     * Defaults cache options
     * @type {Object}
     */
    var _defaults = {
        backend: {
            engine: 'memory'
        },
        frontend: {
            caching: true,
            serialization: true,
            lifetime: 10000
        }
    };

    /**
     * @constructor
     * @param {object} options
     */
    function Cache(options) {

        // enforces new
        if (!(this instanceof Cache)) {
            return new Cache(options);
        }

        this._tags = {};
        this._options = {
            backend: {},
            frontend: {}
        };

        // Setup cache options
        this.setOptions(options || {});

        // Load backend engine
        this._loadBackend();
    }

    /**
     * Bind event emitter
     */
    util.inherits(Cache, events.EventEmitter);

    /**
     * @private
     * Instance of backend engine
     * @type {Object}
     */
    Cache.prototype._backend = null;

    /**
     * @private
     * Registred tags
     * @type {Object}
     */
    Cache.prototype._tags = {};

    /**
     * @private
     * Defaults cache options
     * @type {Object}
     */
    Cache.prototype._options = {
        backend: {},
        frontend: {}
    };

    /**
     * Setup cache options
     * @param {object} options
     */
    Cache.prototype.setOptions = function (options) {

        // Options schema
        options = _.defaults(options, {
            backend: {},
            frontend: {}
        });

        // Backend options
        this._options.backend = _.defaults(options.backend, _defaults.backend);

        // Frontend options
        this._options.frontend = _.defaults(options.frontend, _defaults.frontend);
    };

    /**
     * Returns cache options
     * @return {object}
     */
    Cache.prototype.getOptions = function () {
        return this._options;
    };

    /**
     * Save some data in a cache
     *
     * @param {string} key - Cache id
     * @param {mixed} value - Data to put in cache
     * @param {mixed} tag - Cache tags
     * @param {number} lifetime - Set a specific lifetime for this cache record
     * @param {Function} callback
     */
    Cache.prototype.set = function (key, value, tag, lifetime, callback) {

        var self = this;

        // Checking arguments
        if (typeof tag === 'function') {
            callback = tag;
            tag = null;
            lifetime = this._options.frontend.lifetime;
        }

        // Checking arguments
        if (typeof lifetime === 'function') {
            callback = lifetime;
            lifetime = this._options.frontend.lifetime;
        }

        if (this._options.frontend.caching !== true) {
            return callback(null);
        }

        // Don't handle invalid cache keys
        if (!_.isString(key)) {
            return callback(new Error('Cache key is not a String'));
        }

        // Automatic serialization
        if (this._options.frontend.serialization === true) {
            try {
                value = this._serialize(value);
            } catch (e) {
                return callback(e);
            }
        }

        // Register tags
        if (tag) {
            this._bindTag(key, tag);
        }

        // Call backend engine
        this._backend.set(key, value, lifetime, function (err) {
            self.emit('set', key);
            if (typeof callback === 'function') {
                callback(err);
            }
        });

    };

    /**
     * Test if a cache is available for the given key
     * and (if yes) return it (null else)
     *
     * @param  {string} key
     * @param  {Function} callback
     */
    Cache.prototype.get = function (key, callback) {
        var self = this;
        this._backend.get(key, function (err, data) {
            if (err) {
                self.emit('error', key);
                return callback(err);
            }
            if (data === undefined) {
                self.emit('miss', key);
                return callback(err);
            }
            if (self._options.frontend.serialization === true) {
                try {
                    data = self._unserialize(data);
                } catch (e) {
                    callback(e);
                }
            }
            self.emit('hit', key);
            callback(err, data);
        });
    };

    /**
     * Remove a cache
     *
     * @param  {string}   keys
     * @param  {Function} callback
     */
    Cache.prototype.cleanKeys = function (keys, callback) {
        var self = this;
        this._backend.clean(keys, function (err, removedKeys) {
            var response = {
                keys: removedKeys
            };
            self.emit('clean', response);
            callback(err, response);
        });
    };

    /**
     * Clean cache entries
     *
     * @param  {number}   mode - Available modes
     * @param  {array}    tags
     * @param  {Function} callback
     */
    Cache.prototype.cleanTags = function (tags, callback) {

        if (!Array.isArray(tags)) {
            tags = [tags];
        }

        var self = this;
        var keys = this.getKeysMatchingTags(tags);

        // Clean wrapper
        var clean = function (keys, removedTags) {
            self._backend.clean(keys, function (err, removedKeys) {
                var response = {
                    keys: removedKeys,
                    tags: removedTags
                };
                self.emit('clean', response);
                if (typeof callback === 'function') {
                    callback(err, response);
                }
            });
        };

        clean(keys, tags);
    };

    /**
     * Returns true if tag exists
     * @param  {string}   name
     * @param  {Function} callback
     */
    Cache.prototype.hasTag = function (name, callback) {
        callback(null, this._tags.hasOwnProperty(name));
    };

    /**
     * Returns true if key exists
     * @param  {string}   name
     * @param  {Function} callback
     */
    Cache.prototype.hasKey = function(name, callback) {
        this._backend.hasKey(name, callback);
    };

    /**
     * Return an array of stored cache keys
     * @param  {Function} callback
     */
    Cache.prototype.getKeys = function (callback) {
        this._backend.getKeys(callback);
    };

    /**
     * Return an array of stored tags
     * @return {array} array of stored tags (string)
     */
    Cache.prototype.getTags = function (callback) {
        callback(null, this._tags);
        return this._tags;
    };

    /**
     * Return stored data size
     * @param  {Function} callback
     */
    Cache.prototype.getSize = function (callback) {
        this._backend.getSize(callback);
    };

    /**
     * Return an array of stored cache keys which match given tags
     * @param  {array} tags
     * @return {array} keys - array of matching cache keys
     */
    Cache.prototype.getKeysMatchingTags = function (tags, callback) {
        var keys = [];
        if (!Array.isArray(tags)) {
            tags = [tags];
        }
        for (var i in tags) {
            if (tags.hasOwnProperty(i)) {
                if (this._tags[tags[i]] && (this._tags[tags[i]] instanceof Array)) {
                    keys = keys.concat(keys, this._tags[tags[i]]);
                }
            }
        }
        return keys;
    };

    /**
     * Backend Constructor
     * @return {object} - Backend engine
     */
    Cache.prototype._loadBackend = function () {
        var Engine = require(path.join(__dirname, 'backend', this._options.backend.engine));
        this._backend = new Engine(this._options.backend);
    };

    /**
     * Register cache tag
     * Assign cache key to tags
     *
     * @param  {mixed} tag
     * @param  {string} key
     */
    Cache.prototype._bindTag = function (key, tag) {
        if (!tag) {
            return;
        }
        if (typeof tag === 'string') {
            tag = [tag];
        }
        for (var i in tag) {
            if (tag.hasOwnProperty(i)) {
                if (Array.isArray(this._tags[tag[i]])) {
                    this._tags[tag[i]].push(key);
                } else {
                    this._tags[tag[i]] = [key];
                }
            }
        }
    };

    /**
     * Method parses a string as JSON
     *
     * @param  {mixed} data
     * @return {mixed}
     */
    Cache.prototype._unserialize = function (data) {
        if (typeof data === 'string') {
            return data;
        }
        return JSON.parse(data);
    };

    /**
     * Method parses json to string
     *
     * @param  {object} data
     * @param  {boolean} decycle (true || false)
     * @return {string}
     */
    Cache.prototype._serialize = function (data) {
        if (typeof data === 'string') {
            return data;
        }
        return JSON.stringify(data);
    };

    return Cache;

}());

module.exports = Cache;

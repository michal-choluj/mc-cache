//var Q = require('q');
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
     * Instance of backend engine
     * @type {Object}
     */
    var _backend = null;

    /**
     * @private
     * Registred plugins
     * @type {Object}
     */
    var _plugins = {};

    /**
     * @private
     * Registred tags
     * @type {Object}
     */
    var _tags = {};

    /**
     * @private
     * Defaults cache options
     * @type {Object}
     */
    var _options = {
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

        // Setup cache options
        this.setOptions(options);

        // Load backend engine
        this._loadBackend();
    }

    // Bind event emitter
    util.inherits(Cache, events.EventEmitter);

    /**
     * Setup cache options
     * @param {object} options
     */
    Cache.prototype.setOptions = function (options) {

        // Options schema
        options = _.defaults(options, _options);

        // Backend options
        _options.backend = _.defaults(options.backend, _options.backend);

        // Frontend options
        _options.frontend = _.defaults(options.frontend, _options.frontend);

    };

    /**
     * Returns cache options
     * @return {object}
     */
    Cache.prototype.getOptions = function () {
        return _options;
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

        if (_options.frontend.caching !== true) {
            return callback(null);
        }

        // Checking arguments
        if (typeof tag === 'function') {
            callback = tag;
            tag = null;
            lifetime = _options.frontend.lifetime;
        }

        // Checking arguments
        if (typeof lifetime === 'function') {
            callback = lifetime;
            lifetime = _options.frontend.lifetime;
        }

        // Don't handle invalid cache keys
        if (!_.isString(key)) {
            return callback(new Error('Cache key is not a String'));
        }

        // Automatic serialization
        if (_options.frontend.serialization === true) {
            value = this._serialize(value);
        }

        // Register tags
        if (tag) {
            this._bindTag(key, tag);
        }

        // Call backend engine
        _backend.set(key, value, lifetime, function (err) {
            self.emit('set', key);
            if (typeof callback === 'function') {
                callback(err);
            }
        });

    };

    /**
     * Test if a cache is available for the given id
     * and (if yes) return it (null else)
     *
     * @param  {string} key
     * @param  {Function} callback
     */
    Cache.prototype.get = function (key, callback) {
        var self = this;
        _backend.get(key, function (err, data) {
            if (err) {
                self.emit('error', key);
                return callback(err);
            }
            if (self._options.frontend.serialization === true) {
                data = self._unserialize(data);
            }
            self.emit('hit', key);
            callback(err, data);
        });
    };

    /**
     * Remove a cache
     *
     * @param  {string}   ids
     * @param  {Function} callback
     */
    Cache.prototype.cleanIds = function (ids, callback) {
        var self = this;
        _backend.clean(ids, function (err, removedIds) {
            var response = {
                ids: removedIds
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
        var ids = this.getIdsMatchingTags(tags);

        // Clean wrapper
        var clean = function (ids, removedTags) {
            _backend.clean(ids, function (err, removedIds) {
                var response = {
                    ids: removedIds,
                    tags: removedTags
                };
                self.emit('clean', response);
                if (typeof callback === 'function') {
                    callback(err, response);
                }
            });
        };

        clean(ids, tags);
    };

    /**
     * Return an array of stored cache ids
     * @param  {Function} callback
     */
    Cache.prototype.getIds = function (callback) {
        _backend.getIds(callback);
    };

    /**
     * Return an array of stored cache ids which match given tags
     * @param  {array} tags
     * @return {array} ids - array of matching cache ids
     */
    Cache.prototype.getIdsMatchingTags = function (tags) {
        var ids = [];
        if (!Array.isArray(tags)) {
            tags = [tags];
        }
        for (var i in tags) {
            if (tags.hasOwnProperty(i)) {
                if (_tags[tags[i]] && (_tags[tags[i]] instanceof Array)) {
                    ids = ids.concat(ids, _tags[tags[i]]);
                }
            }
        }
        return ids;
    };

    /**
     * Return an array of stored tags
     * @return {array} array of stored tags (string)
     */
    Cache.prototype.getTags = function () {
        return _tags;
    };

    /**
     * Backend Constructor
     * @return {object} - Backend engine
     */
    Cache.prototype._loadBackend = function () {
        var Engine = require(path.join(__dirname, 'backend', _options.backend.engine));
        _backend = new Engine(_options.backend);
    };

    /**
     * Register cache tag
     * Assign cache ID to tags
     *
     * @param  {mixed} tag
     * @param  {string} id
     */
    Cache.prototype._bindTag = function (id, tag) {
        if (!tag) {
            return;
        }
        if (typeof tag === 'string') {
            tag = [tag];
        }
        for (var i in tag) {
            if (tag.hasOwnProperty(i)) {
                if (Array.isArray(_tags[tag[i]])) {
                    _tags[tag[i]].push(id);
                } else {
                    _tags[tag[i]] = [id];
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
        try {
            if (data === 'string') {
                return data;
            }
            return JSON.parse(data);
        } catch (e) {
            return e;
        }
    };

    /**
     * Method parses json to string
     *
     * @param  {object} data
     * @param  {boolean} decycle (true || false)
     * @return {string}
     */
    Cache.prototype._serialize = function (data) {
        try {
            if (data === 'string') {
                return data;
            }
            return JSON.stringify(util.inspect(data, {
                showHidden: true,
                depth: 10
            }));
        } catch (e) {
            return e;
        }
    };

    return Cache;

}());

module.exports = Cache;

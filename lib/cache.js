var _ = require("underscore");
//var crypto = require('crypto');
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
     * @constructor
     * @param {object} options
     */
    function Cache(options) {

        // enforces new
        if (!(this instanceof Cache)) {
            return new Cache(options);
        }

        // Configuration
        this._options = {};

        this._options.backend = _.defaults(options.backend || {}, {
            engine: 'memory'
        });

        this._options.frontend = _.defaults(options.frontend || {}, {
            plugins: {
                callback: {
                    enabled: true,
                }
            },
            caching: true,
            serialization: true,
            lifetime: 10000
        });

        // Load backend engine
        this._loadBackend();
    }

    /**
     * Avaiable cleaning mode
     *
     * @public
     * @type {Object}
     */
    Cache.prototype.MODE = {
        ALL: 'all',
        MATCHING_TAG: 'matching_tag'
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

        if (this._options.frontend.caching !== true) {
            return callback(null);
        }

        if (typeof tag === 'function') {
            callback = tag;
            tag = null;
            lifetime = this._options.frontend.lifetime;
        }

        if (typeof lifetime === 'function') {
            callback = lifetime;
            lifetime = this._options.frontend.lifetime;
        }

        // Don't handle invalid cache keys
        if (!_.isString(key)) {
            return callback(new Error('Cache key is not a String'));
        }

        // Automatic serialization
        if (this._options.frontend.serialization === true) {
            value = this._serialize(value);
        }

        // Register tags
        if (tag) {
            this._bindTag(key, tag);
        }

        // Call backend engine
        _backend.save(key, value, lifetime, callback);

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
        _backend.load(key, function (err, data) {
            if (self._options.frontend.serialization === true) {
                data = self._unserialize(data);
            }
            callback(err, data);
        });
    };

    /**
     * Remove a cache
     *
     * @param  {string}   key
     * @param  {Function} callback
     */
    Cache.prototype.remove = function (key, callback) {
        _backend.clean(key, callback);
    };

    /**
     * Clean cache entries
     *
     * @param  {number}   mode - Available modes
     * @param  {array}    keys
     * @param  {Function} callback
     */
    Cache.prototype.clean = function (mode, keys, callback) {

        if (typeof keys === 'function') {
            callback = keys;
            keys = mode;
            mode = null;
        }

        var ids = [];

        // @TODO
        switch (mode) {
        case this.MODE.MATCHING_TAG:
            ids = this.getIdsMatchingTags(keys);
            break;
        default:
            ids = this.getIdsMatchingTags(keys);
        }

        _backend.clean(ids, callback);
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
        var Engine = require(path.join(__dirname, 'backend', this._options.backend.engine));
        _backend = new Engine(this._options.backend);
    };

    // -------------------- PLUGINS -----------------

    Cache.prototype.getPlugin = function(name) {
        return _plugins[name];
    };

    Cache.prototype.addPlugin = function(name, plugin) {
        _plugins[name] = plugin;
    };

    Cache.prototype._loadPlugins = function() {
        if (this._options.frontend.plugins) {
            var plugins = this._options.frontend.plugins;
            for (var name in plugins) {
                if (plugins.hasOwnProperty(name)) {
                    var CachePlugin = require(path.join(__dirname, name));
                    this.addPlugin(name, new CachePlugin(plugins[name]));
                }
            }
        }
    };

    // -------------------- PLUGINS ------------------

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

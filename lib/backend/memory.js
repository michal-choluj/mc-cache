var Memory = (function () {
    'use strict';

    function Memory(options) {

        // enforces new
        if (!(this instanceof Memory)) {
            return new Memory(options);
        }

        var self = this;
        this._pubsub = require('./../pubsubclient');
        this._pubsub.init(options.redis, function () {
            self._pubsub.subscribe(function (keys) {
                self._remove(keys);
            });
        });
    }

    /**
     * Stored data
     *
     * @private
     * @type {Object}
     */
    var _store = {};

    /**
     * [set description]
     * @param {[type]}   key      [description]
     * @param {[type]}   value    [description]
     * @param {[type]}   ttl      [description]
     * @param {Function} callback [description]
     */
    Memory.prototype.save = function (key, value, ttl, callback) {

        // If no TTL is defined then last as long as possible
        if (typeof ttl === 'function') {
            callback = ttl;
            ttl = 0;
        }

        _store[String(key)] = {
            value: value,
            expire: Date.now() + ttl
        };

        callback(null);
    };

    /**
     * Load data from store
     * @param  {string}   key
     * @param  {Function} callback (err, output)
     */
    Memory.prototype.load = function (key, callback) {

        if (!_store[key]) {
            callback(null, null);
            return null;
        }

        if (_store[key].expire > Date.now()) {
            callback(null, _store[key].value);
            return _store[key].value;
        }

        delete _store[key];
        callback(null, null);

    };

    /**
     * Removes stored data for key
     *
     * @param  {mixed}   key       String or Array
     * @param  {Function} callback
     */
    Memory.prototype.clean = function (key, callback) {

        if (!key) {
            return callback(null, null);
        }

        if (!Array.isArray(key)) {
            key = [key];
        }

        var self = this;
        var publish = function (keys) {
            self._pubsub.clean(keys, function (err) {
                setTimeout(function () {
                    if (typeof callback === 'function') {
                        callback(err, keys);
                    }
                }, 200);
            });
        };

        publish(key);
    };

    /**
     * Returns keys from static storage
     * @param  {Function} callback
     */
    Memory.prototype.getIds = function (callback) {
        callback(null, Object.keys(_store));
    };

    /**
     * Remove data from storage
     * @param  {mixed} key (string || array)
     * @param  {Function} callback
     */
    Memory.prototype._remove = function (key, callback) {

        if (!Array.isArray(key)) {
            key = [key];
        }

        for (var i in key) {
            if (key.hasOwnProperty(i)) {
                if (!_store[key[i]]) {
                    continue;
                }
                delete _store[key[i]];
            }
        }

        if (typeof callback === 'function') {
            callback(null);
        }

    };

    return Memory;

}());

module.exports = Memory;

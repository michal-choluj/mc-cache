var Memory = (function () {
    'use strict';

    /**
     * Stored data
     *
     * @private
     * @type {Object}
     */
    var _store = {};

    function Memory(options) {

        // enforces new
        if (!(this instanceof Memory)) {
            return new Memory(options);
        }

    }

    /**
     * Save some data in a cache
     *
     * @param {string} key - Cache id
     * @param {mixed} value - Data to put in cache
     * @param {mixed} tag - Cache tags
     * @param {number} lifetime - Set a specific lifetime for this cache record
     * @param {Function} callback
     */
    Memory.prototype.set = function (key, value, ttl, callback) {

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
    Memory.prototype.get = function (key, callback) {

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

    /**
     * Returns keys from static storage
     * @param  {Function} callback
     */
    Memory.prototype.getIds = function (callback) {
        callback(null, Object.keys(_store));
    };

    return Memory;

}());

module.exports = Memory;

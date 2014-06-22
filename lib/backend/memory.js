var events = require('events');
var util = require('util');

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

    // Bind event emitter
    util.inherits(Memory, events.EventEmitter);

    /**
     * Save some data in a cache
     *
     * @param {string} key - Cache id
     * @param {mixed} value - Data to put in cache
     * @param {number} ttl - Set a specific lifetime for this cache record
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
            callback(null);
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

        var removedKeys = [];

        if (!key) {
            return callback(null, removedKeys);
        }

        if (!Array.isArray(key)) {
            key = [key];
        }

        for (var i in key) {
            if (key.hasOwnProperty(i)) {
                if (!_store[key[i]]) {
                    continue;
                }
                removedKeys.push(key[i]);
                delete _store[key[i]];
            }
        }

        if (typeof callback === 'function') {
            callback(null, removedKeys);
        }

    };

    /**
     * Returns data size
     * @param  {Function} callback
     */
    Memory.prototype.getSize = function (callback) {
        // @TODO
        callback();
    };

    /**
     * Returns keys from static storage
     * @param  {Function} callback
     */
    Memory.prototype.getKeys = function (callback) {
        callback(null, Object.keys(_store));
    };

    return Memory;

}());

module.exports = Memory;

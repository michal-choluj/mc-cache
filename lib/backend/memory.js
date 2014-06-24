var events = require('events');
var util = require('util');

var Memory = (function () {
    'use strict';

    function Memory(options) {
        // enforces new
        if (!(this instanceof Memory)) {
            return new Memory(options);
        }
        this._store = {};
    }

    // Bind event emitter
    util.inherits(Memory, events.EventEmitter);

    /**
     * Stored data
     *
     * @private
     * @type {Object}
     */
    Memory.prototype._store = {};

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

        this._store[String(key)] = {
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

        if (!this._store[key]) {
            callback(null);
            return null;
        }

        if (this._store[key].expire > Date.now()) {
            callback(null, this._store[key].value);
            return this._store[key].value;
        }

        delete this._store[key];
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
                if (!this._store[key[i]]) {
                    continue;
                }
                removedKeys.push(key[i]);
                delete this._store[key[i]];
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
        callback(null, Object.keys(this._store));
    };

    /**
     * Returns true if key exists
     * @param  {string}   name
     * @param  {Function} callback
     */
    Memory.prototype.hasKey = function (name, callback) {
        callback(null, this._store.hasOwnProperty(name));
    };

    return Memory;

}());

module.exports = Memory;

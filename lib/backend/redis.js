var redis = require('redis');
var events = require('events');

var Redis = (function () {
    'use strict';

    function Redis(options) {

        // enforces new
        if (!(this instanceof Redis)) {
            return new Redis(options);
        }

        // initialize client
        this._client = redis.createClient();
        this._client.on('error', function (err) {
            handle.emit('error', err);
        });

    }

    // Bind event emitter
    util.inherits(Redis, events.EventEmitter);

    /**
     * Save some data in a cache
     *
     * @param {string} key - Cache id
     * @param {mixed} value - Data to put in cache
     * @param {number} ttl - Set a specific lifetime for this cache record
     * @param {Function} callback
     */
    Memory.prototype.set = function (key, value, ttl, callback) {
        if ((typeof (ttl) === 'number') && (parseInt(ttl, 10) === ttl)) {
            this._client.setex(key, ttl, value, callback);
        } else {
            this._client.set(key, value, callback);
        }
    };

    Memory.prototype.get = function (key, callback) {
        this._client.get(key, callback);
    };

    Memory.prototype.clean = function (key, callback) {
        if (Array.isArray(key)) {
            key = key.join(' ');
        }
        this._client.del(key, callback);
    };

    Redis.prototype.getSize = function (callback) {
        this._client.dbsize(callback);
    };

    Memory.prototype.getKeys = function (callback) {
        this._client.keys('*', callback);
    };

    return Redis;

}());

module.exports = Redis;
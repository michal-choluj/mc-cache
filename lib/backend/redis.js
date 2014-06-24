var redis = require('redis');
var events = require('events');
var util = require('util');

var Redis = (function () {
    'use strict';

    function Redis(options) {

        // Enforces new
        if (!(this instanceof Redis)) {
            return new Redis(options);
        }

        // Initialize redis client
        var self = this;
        this._client = redis.createClient(options.port, options.host);
        this._client.on('error', function (err) {
            self.emit('error', err);
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
    Redis.prototype.set = function (key, value, ttl, callback) {
        if ((typeof (ttl) === 'number') && (parseInt(ttl, 10) === ttl)) {
            this._client.setex(key, ttl / 1000, value, callback);
        } else {
            this._client.set(key, value, callback);
        }
    };

    /**
     * Load data from store
     * @param  {string}   key
     * @param  {Function} callback (err, output)
     */
    Redis.prototype.get = function (key, callback) {
        this._client.get(key, callback);
    };

    /**
     * Removes stored data for key
     *
     * @param  {mixed}   key       String or Array
     * @param  {Function} callback
     */
    Redis.prototype.clean = function (key, callback) {
        if (Array.isArray(key)) {
            key = key.join(' ');
        }
        this._client.del(key, function(err, count) {
            callback(err, key.split(' '));
        });
    };

    /**
     * Returns data size
     * @param  {Function} callback
     */
    Redis.prototype.getSize = function (callback) {
        this._client.dbsize(callback);
    };

    /**
     * Returns keys from static storage
     * @param  {Function} callback
     */
    Redis.prototype.getKeys = function (callback) {
        this._client.keys('*', callback);
    };

    /**
     * Returns true if key exists
     * @param  {string}   name
     * @param  {Function} callback
     */
    Redis.prototype.hasKey = function(name, callback) {
        this._client.exists(name, function (err, data) {
            callback(null, Boolean(data));
        });
    };

    return Redis;

}());

module.exports = Redis;

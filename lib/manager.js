var Manager = (function() {
    'use strict';

    var instance;

    /**
     * @constructor
     */
    Manager = function() {

        if (instance) {
            return instance;
        }

        instance = this;

        if (!(this instanceof Manager)) {
            return new Manager();
        }

    };

    /**
     * Array of caches stored by the Cache Manager instance
     * @private
     */
    var _caches = {};

    /**
     * Set a new cache for the Cache Manager to contain
     *
     * @param {string} key   Name
     * @param {object} cache Instance of cache
     */
    Manager.prototype.setCache = function(key, cache) {
        _caches[key] = cache;
        return this;
    };

    /**
     * Fetch the named cache object and return it
     *
     * @param  {string} key Name
     * @return {object}
     */
    Manager.prototype.getCache = function(key) {
        return _caches[key];
    };

    /**
     * Check if the Cache Manager contains the named cache object
     *
     * @param  {string}  key
     * @return {Boolean}
     */
    Manager.prototype.hasCache = function(key) {
        return typeof _caches[key] === 'object' ? true : false;
    };

    return Manager;

}());

module.exports = Manager;

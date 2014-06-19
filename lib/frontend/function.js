var Method = (function () {
    'use strict';

    function Method(options) {
        // enforces new
        if (!(this instanceof Method)) {
            return new Method(options);
        }
    }

    /**
     * Registred callbacks
     *
     * @private
     * @type {Array}
     */
    var _callbacks = [];

    Method.prototype.callMethod = function (scope, fn, args, tag, callback) {
        // method body
    };

    return Method;

}());

module.exports = Method;

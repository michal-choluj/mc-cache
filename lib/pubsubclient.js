var connections = libsLoader.load('redis');
module.exports = {
    callMethod: 'cachemethod.cleanTags',
    init: function (config, callback) {
        this.clientPub = connections.getConnection(config, connections.TYPE_PUB);
        this.clientSub = connections.getConnection(config, connections.TYPE_SUB);
        this.clientSub.on('ready', callback);
    },
    subscribe: function (callback) {
        var self = this;
        this.clientSub.on('pmessage', function (pattern, channel, message) {
            if (channel === self.callMethod) {
                callback(message.split(','));
            }
        });
        this.clientSub.psubscribe(this.callMethod);
    },
    clean: function (tags, callback) {
        var self = this;
        if (!(tags instanceof Array)) {
            tags = [tags];
        }
        self.clientPub.publish(this.callMethod, tags.join(','), function (channel, result) {
            if (typeof (callback) === "function") {
                callback((result === 1 ? null : true), channel);
            }
        });
    }
};

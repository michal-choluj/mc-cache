var assert = require("assert");
var should = require('should');
var cache = require("./../index.js").core;

describe('Core', function () {

    describe('Initialize', function () {

        it('Should create an instance of function with defaults options', function () {
            new cache();
        });

        it('Should create an instance of function with custom options', function () {
            new cache({
                frontend: {
                    caching: true,
                    serialization: false,
                    lifetime: 50
                }
            });
        });

    });

    describe('#set()', function () {

        it('should not set value if caching is disabled', function (done) {
            var Cache = new cache({
                frontend: {
                    caching: false
                }
            });
            Cache.set('caching-disabled', 'hello world', function (err) {
                Cache.get('caching-disabled', function (err, value) {
                    assert.equal(value, undefined);
                    done();
                });
            });
        });

        it('should not allow undefined key', function (done) {
            var Cache = new cache();
            Cache.set(undefined, null, function (err) {
                if (err) {
                    done();
                }
            });
        });

        it('should allow set value via key and tag', function (done) {
            var Cache = new cache();
            Cache.set('tagTestKey', 'hello world', 'tagExists', function (err) {
                Cache.hasTag('tagExists', function (err, isExists) {
                    true.should.equal(err === null, err && err.message);
                    assert.equal(isExists, true);
                    done();
                });
            });
        });

        it('should emit a "set" event on cache set', function (done) {
            var Cache = new cache();
            Cache.on('set', function (key) {
                assert.equal(key, 'setKey');
                done();
            });
            Cache.set('setKey', 'hello world', function () {});
        });

        it('should not allow circular values', function (done) {
            var Cache = new cache(),
                circular = [];
            circular.push(circular);
            Cache.set('circularKey', circular, function (err) {
                err.should.be.instanceOf(TypeError);
                err.should.have.property('message', 'Converting circular structure to JSON');
                Cache.get('circularKey', function (err, value) {
                    should.equal(value, undefined);
                    done();
                });
            });
        });

    });

    describe('#get()', function () {

        it('should emit a "miss" event on cache misses', function (done) {
            var Cache = new cache();
            Cache.on('miss', function (key) {
                assert.equal(key, 'undefined');
                done();
            });
            Cache.get('undefined', function () {});
        });

        it('should return undefined for a key that has not been set', function (done) {
            var Cache = new cache();
            Cache.get('undefined', function (err, value) {
                assert.equal(value, undefined);
                done();
            });
        });

        it('should return value via callback (100ms)', function (done) {
            var Cache = new cache();
            Cache.set('test', 'hello world', function (err) {
                true.should.equal(err === null, err && err.message);
                setTimeout(function () {
                    Cache.get('test', function (err, value) {
                        value.should.eql('hello world');
                        done();
                    });
                }, 100);
            });
        });

        it('should not return a value for a key that has been cleared', function (done) {
            var Cache = new cache();
            Cache.set('test', 'hello world');
            Cache.cleanKeys('test', function () {
                Cache.get('test', function (error, value) {
                    should.equal(value, undefined);
                    done();
                });
            });
        });

        it('should return a value when within the TTL', function () {
            var Cache = new cache();
            Cache.set('test', 'hello world', null, 50);
            Cache.get('test', function (error, value) {
                value.should.eql('hello world');
            });
        });

        it('should not return a value when TTL has been expired', function () {
            var Cache = new cache();
            Cache.set('test-ttl', 'hello world', null, 50);
            setTimeout(function () {
                Cache.get('test-ttl', function (error, value) {
                    value.should.eql(undefined);
                });
            }, 100);
        });

    });

    describe('#cleanKeys()', function () {

        it('should not error if key does not exist', function () {
            var Cache = new cache();
            Cache.cleanKeys('notExistsKey', function (err) {
                true.should.equal(err === null, err && err.message);
            });
        });

        it('should emit a "clean" event with removed keys', function (done) {
            var Cache = new cache();
            Cache.on('clean', function (result) {
                (result).should.eql({
                    keys: ['test']
                });
                done();
            });
            Cache.set('test', 'hello world', function () {
                Cache.cleanKeys('test', function (err) {
                    true.should.equal(err === null, err && err.message);
                });
            });
        });

    });

});

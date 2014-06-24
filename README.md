mc-cache
========

mc-cache supports multiple instances of cache engines.
It's very useful tool if your services are too slow and you want to store things in cache.

### CACHE API

* `set(key, value, tag, lifetime, callback)`
* `get(key, callback)`
* `cleanKeys(keys, callback)`
* `cleanTags(tags, callback)`
* `getSize(callback)`
* `getTags(callback)`
* `getKeys(callback)`
* `hasTag(name, callback)`
* `hasKey(name, callback)`

### EVENTS

* `set(err)`
* `miss(key)`
* `hit(key)`
* `clean({keys:[],tags:[]})`
* `error(err)`

### ENGINES

* `Memory`
* `Redis` (In progress)

### TODO

* `MongoDB`
* `getSize`
* `hasKey`
* `flushAll`
* `Namespaces`

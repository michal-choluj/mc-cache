mc-cache
========

mc-cache

### CACHE API

* `set(key, value, tag, lifetime, callback)`
* `get(key, callback)`
* `cleanKeys(keys, callback)`
* `cleanTags(tags, callback)`
* `getSize(callback)`
* `getTags(callback)`
* `getKeys(callback)`
* `hasTag(name, callback)`

### EVENTS

* `set(err)`
* `miss(key)`
* `hit(key)`
* `clean({keys:[],tags:[]})`
* `error(err)`

### ENGINES

* `Memory`
* `Redis`

### TODO

* `Mongo` engine
* `getSize` for memory engine

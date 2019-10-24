"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NEWER = Symbol('newer');
var OLDER = Symbol('older');
var CacheEntry = /** @class */ (function () {
    function CacheEntry(key, value) {
        this._key = key;
        this._value = value;
    }
    Object.defineProperty(CacheEntry.prototype, "key", {
        get: function () {
            return this._key;
        },
        set: function (k) {
            this._key = k;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CacheEntry.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (v) {
            this._value = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CacheEntry.prototype, NEWER, {
        get: function () {
            return this._newer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CacheEntry.prototype, NEWER, {
        set: function (val) {
            this._newer = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CacheEntry.prototype, OLDER, {
        get: function () {
            return this._older;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CacheEntry.prototype, OLDER, {
        set: function (val) {
            this._older = val;
        },
        enumerable: true,
        configurable: true
    });
    return CacheEntry;
}());
var EntryIterator = /** @class */ (function () {
    function EntryIterator(oldestEntry) {
        this._entry = oldestEntry;
    }
    EntryIterator.prototype[Symbol.iterator] = function () {
        return this;
    };
    EntryIterator.prototype.next = function () {
        var ent = this._entry;
        if (ent) {
            this._entry = ent[NEWER];
            return { done: false, value: [ent.key, ent.value] };
        }
        else {
            return { done: true, value: undefined };
        }
    };
    return EntryIterator;
}());
var ValueIterator = /** @class */ (function () {
    function ValueIterator(oldestEntry) {
        this._entry = oldestEntry;
    }
    ValueIterator.prototype[Symbol.iterator] = function () {
        return this;
    };
    ValueIterator.prototype.next = function () {
        var ent = this._entry;
        if (ent) {
            this._entry = ent[NEWER];
            return { done: false, value: ent.value };
        }
        else {
            return { done: true, value: undefined };
        }
    };
    return ValueIterator;
}());
var KeyIterator = /** @class */ (function () {
    function KeyIterator(oldestEntry) {
        this._entry = oldestEntry;
    }
    KeyIterator.prototype[Symbol.iterator] = function () {
        return this;
    };
    KeyIterator.prototype.next = function () {
        var ent = this._entry;
        if (ent) {
            this._entry = ent[NEWER];
            return { done: false, value: ent.key };
        }
        else {
            return { done: true, value: undefined };
        }
    };
    return KeyIterator;
}());
var LRUCache = /** @class */ (function () {
    function LRUCache(limit, entries) {
        this._limit = limit;
        // this._entries = entries;
        this._keymap = new Map();
        this._size = 0;
        this._oldest = this._newest = undefined;
        if (entries) {
            this.assign(entries);
            if (limit < 1) {
                this._limit = this._size;
            }
        }
    }
    LRUCache.prototype.assign = function (entries) {
        var entry;
        var limit = this._limit || Number.MAX_VALUE;
        this._keymap.clear();
        var it = entries[Symbol.iterator]();
        for (var itv = it.next(); !itv.done; itv = it.next()) {
            var e = new CacheEntry(itv.value[0], itv.value[1]);
            this._keymap.set(e.key, e);
            if (!entry) {
                this._oldest = e;
            }
            else {
                entry[NEWER] = e;
                e[OLDER] = entry;
            }
            entry = e;
            if (limit-- == 0) {
                throw new Error('overflow');
            }
        }
        this._newest = entry;
        this._size = this._keymap.size;
    };
    LRUCache.prototype.get = function (key) {
        var entry = this._keymap.get(key);
        if (!entry)
            return;
        this._markEntryAsUsed(entry);
        return entry.value;
    };
    LRUCache.prototype.set = function (key, value) {
        var entry = this._keymap.get(key);
        if (entry) {
            entry.value = value;
            this._markEntryAsUsed(entry);
            return this;
        }
        entry = new CacheEntry(key, value);
        this._keymap.set(key, entry);
        if (this._newest) {
            this._newest[NEWER] = entry;
            entry[OLDER] = this._newest;
        }
        else {
            this._oldest = entry;
        }
        this._newest = entry;
        ++this._size;
        if (this._size > this._limit) {
            this.shift();
        }
        return this;
    };
    LRUCache.prototype.delete = function (key) {
        var entry = this._keymap.get(key);
        if (!entry)
            return;
        this._keymap.delete(key);
        var validEntry = entry;
        if (validEntry[NEWER] && validEntry[OLDER]) {
            validEntry[OLDER][NEWER] = validEntry[NEWER];
            validEntry[NEWER][OLDER] = validEntry[OLDER];
        }
        else if (validEntry[NEWER]) {
            validEntry[NEWER][OLDER] = undefined;
            this._oldest = validEntry[NEWER];
        }
        else if (validEntry[OLDER]) {
            validEntry[OLDER][NEWER] = undefined;
            this._newest = validEntry[OLDER];
        }
        else {
            this._oldest = this._newest = undefined;
        }
        this._size--;
        return entry.value;
    };
    LRUCache.prototype.shift = function () {
        var entry = this._oldest;
        if (!entry) {
            return;
        }
        if (this._oldest[NEWER]) {
            this._oldest = this._oldest[NEWER];
            this._oldest[OLDER] = undefined;
        }
        else {
            this._oldest = undefined;
            this._newest = undefined;
        }
        var validEntry = entry;
        validEntry[NEWER] = validEntry[OLDER] = undefined;
        this._keymap.delete(validEntry.key);
        --this._size;
        return [entry.key, entry.value];
    };
    LRUCache.prototype.entries = function () {
        return this;
    };
    LRUCache.prototype.keys = function () {
        return new KeyIterator(this.oldest);
    };
    LRUCache.prototype.values = function () {
        return new ValueIterator(this._oldest);
    };
    LRUCache.prototype[Symbol.iterator] = function () {
        return new EntryIterator(this._oldest);
    };
    LRUCache.prototype.has = function (key) {
        return this._keymap.has(key);
    };
    LRUCache.prototype.clear = function () {
        this._oldest = this._newest = undefined;
        this._size = 0;
        this._keymap.clear();
    };
    LRUCache.prototype._markEntryAsUsed = function (entry) {
        if (entry === this._newest) {
            return;
        }
        var validEntry = entry;
        if (validEntry[NEWER]) {
            if (entry === this._oldest) {
                this._oldest = validEntry[NEWER];
            }
            var newerEntry = validEntry[NEWER];
            var olderEntry = undefined;
            if (newerEntry) {
                olderEntry = newerEntry[OLDER];
                olderEntry = validEntry[OLDER];
            }
        }
        if (validEntry[OLDER]) {
            validEntry[OLDER][NEWER] = validEntry[NEWER];
        }
        validEntry[NEWER] = undefined;
        validEntry[OLDER] = this._newest;
        if (this._newest) {
            this._newest[NEWER] = entry;
        }
        this._newest = entry;
    };
    Object.defineProperty(LRUCache.prototype, "oldest", {
        get: function () {
            return this._oldest;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LRUCache.prototype, "newest", {
        get: function () {
            return this._newest;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LRUCache.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LRUCache.prototype, "limit", {
        get: function () {
            return this._limit;
        },
        enumerable: true,
        configurable: true
    });
    LRUCache.prototype.toString = function () {
        var s = '';
        var entry = this._oldest;
        while (entry) {
            s += String(entry.key) + ':' + entry.value;
            entry = entry[NEWER];
            if (entry) {
                s += ' < ';
            }
        }
        return s;
    };
    return LRUCache;
}());
exports.LRUCache = LRUCache;
//# sourceMappingURL=lru_cache.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lru_cache_1 = require("../src/lib/lru_cache");
describe('test lrucache', function () {
    test('Getter & setter & delete', function () {
        var c = new lru_cache_1.LRUCache(4);
        expect(c.size).toBe(0);
        expect(c.limit).toBe(4);
        expect(c.oldest).toBe(undefined);
        expect(c.newest).toBe(undefined);
        c.set('adam', 29)
            .set('john', 26)
            .set('angela', 24)
            .set('bob', 48);
        expect(c.size).toBe(4);
        expect(c.toString()).toEqual('adam:29 < john:26 < angela:24 < bob:48');
        expect(c.get('adam')).toBe(29);
        expect(c.get('john')).toBe(26);
        expect(c.get('angela')).toBe(24);
        expect(c.get('bob')).toBe(48);
        expect(c.toString()).toEqual('adam:29 < john:26 < angela:24 < bob:48');
        c.set('angela', 22);
        expect(c.toString()).toEqual('adam:29 < john:26 < bob:48 < angela:22');
        c.set('ygwie', 88);
        expect(c.toString()).toEqual('john:26 < bob:48 < angela:22 < ygwie:88');
        expect(c.size).toEqual(4);
        expect(c.get('adam')).toEqual(undefined);
        c.set('john', 11);
        expect(c.toString()).toEqual('bob:48 < angela:22 < ygwie:88 < john:11');
        expect(c.get('john')).toEqual(11);
        expect(!c.delete('john')).toBe(false);
        expect(c.size).toBe(3);
    });
    test('constructor with iterator', function () {
        var verifyEntries = function (c) {
            expect(c.size).toBe(4);
            expect(c.limit).toBe(4);
            if (c.oldest) {
                expect(c.oldest.key).toEqual('adam');
            }
            if (c.newest) {
                expect(c.newest.key).toEqual('bob');
            }
            expect(c.get('adam')).toEqual(29);
            expect(c.get('john')).toEqual(26);
            expect(c.get('angela')).toEqual(24);
            expect(c.get('bob')).toEqual(48);
            verifyEntries(new lru_cache_1.LRUCache(4, [
                ['adam', 29],
                ['john', 26],
                ['angela', 24],
                ['bob', 48],
            ]));
        };
    });
    test('assign', function () {
        var c = new lru_cache_1.LRUCache(4, [
            ['adam', 29],
            ['john', 26],
            ['angela', 24],
            ['bob', 48],
        ]);
        var newEntries = [['mimi', 1], ['patrick', 2], ['jane', 3], ['fred', 4]];
        c.assign(newEntries);
        expect(c.size).toBe(4);
        expect(c.limit).toBe(4);
        if (c.oldest) {
            expect(c.oldest.key).toEqual('mimi');
            expect(c.oldest.value).toEqual(1);
        }
        if (c.newest) {
            expect(c.newest.key).toEqual('fred');
            expect(c.newest.value).toEqual(4);
        }
        expect(function () {
            c.assign([['adam', 29], ['john', 26], ['angela', 24], ['bob', 48], ['ken', 30]]);
        }).toThrow();
        c.assign([['adam', 29], ['john', 26], ['angela', 24]]);
        expect(c.size).toBe(3);
        expect(c.limit).toBe(4);
    });
    test('Delete', function () {
        var c = new lru_cache_1.LRUCache(4, [
            ['adam', 29],
            ['john', 26],
            ['angela', 24],
            ['bob', 48],
        ]);
        c.delete('adam');
        expect(c.size).toBe(3);
        c.delete('angela');
        expect(c.size).toBe(2);
        c.delete('bob');
        expect(c.size).toBe(1);
        c.delete('john');
        expect(c.size).toBe(0);
        if (c.oldest) {
            expect(c.oldest).toEqual(undefined);
        }
        if (c.newest) {
            expect(c.newest).toEqual(undefined);
        }
        // Test for `clear`
        c.clear();
        expect(c.size).toBe(0);
        expect(c.oldest).toEqual(undefined);
        expect(c.newest).toEqual(undefined);
    });
    test('Shift', function () {
        var c = new lru_cache_1.LRUCache(4);
        expect(c.size).toBe(0);
        c.set('a', 1);
        c.set('b', 2);
        c.set('c', 3);
        c.set('d', 4);
        expect(c.size).toBe(4);
        var e = c.shift();
        if (e) {
            expect(e[0]).toEqual('a');
            expect(e[1]).toEqual(1);
        }
        e = c.shift();
        if (e) {
            expect(e[0]).toEqual('b');
            expect(e[1]).toEqual(2);
        }
        c.shift();
        c.shift();
        // Cache should be enpty
        expect(c.size).toBe(0);
    });
    test('Set', function () {
        var c = new lru_cache_1.LRUCache(4);
        c.set('a', 1);
        c.set('a', 2);
        c.set('a', 3);
        c.set('a', 4);
        expect(c.size).toBe(1);
        expect(c.oldest).toEqual(c.newest);
        if (c.newest) {
            expect(c.newest.key).toEqual('a');
            expect(c.newest.value).toEqual(4);
        }
        c.set('b', 5);
        expect(c.size).toBe(2);
        if (c.newest && c.oldest) {
            expect(c.newest.key).toEqual('b');
            expect(c.oldest.key).toEqual('a');
        }
    });
    test('Entry iterator', function () {
        var c = new lru_cache_1.LRUCache(5, [
            ['adam', 29],
            ['john', 26],
            ['angela', 24],
            ['bob', 48],
        ]);
        var verifyEntries = function (iterable) {
            expect(typeof iterable[Symbol.iterator]).toEqual('function');
            var it = iterable[Symbol.iterator]();
            expect(it.next().value).toEqual(['adam', 29]);
            expect(it.next().value).toEqual(['john', 26]);
            expect(it.next().value).toEqual(['angela', 24]);
            expect(it.next().value).toEqual(['bob', 48]);
        };
        verifyEntries(c);
        verifyEntries(c.entries());
    });
    test('Value iterator', function () {
        var c = new lru_cache_1.LRUCache(4, [
            ['adam', 29],
            ['john', 26],
            ['angela', 24],
            ['bob', 48],
        ]);
        var kit = c.values();
        expect(kit.next().value).toBe(29);
        expect(kit.next().value).toBe(26);
        expect(kit.next().value).toBe(24);
        expect(kit.next().value).toBe(48);
        expect(kit.next().done).toBe(true);
    });
    test('Key iterator', function () {
        var c = new lru_cache_1.LRUCache(4, [
            ['adam', 29],
            ['john', 26],
            ['angela', 24],
            ['bob', 48],
        ]);
        var kit = c.keys();
        expect(kit.next().value).toEqual('adam');
        expect(kit.next().value).toEqual('john');
        expect(kit.next().value).toEqual('angela');
        expect(kit.next().value).toEqual('bob');
        expect(kit.next().done).toEqual(true);
    });
});
//# sourceMappingURL=cache.spec.js.map
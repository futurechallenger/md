const NEWER = Symbol('newer');
const OLDER = Symbol('older');

interface Entry<K, V> {
  key: K;
  value: V;
}

class CacheEntry<K, V> implements Entry<K, V> {
  private _key: K;
  private _value: V;
  private _newer: Entry<K, V> | undefined;
  private _older: Entry<K, V> | undefined;

  constructor(key: K, value: V) {
    this._key = key;
    this._value = value;
  }

  get key(): K {
    return this._key;
  }

  set key(k: K) {
    this._key = k;
  }

  get value(): V {
    return this._value;
  }

  set value(v: V) {
    this._value = v;
  }

  get [NEWER](): Entry<K, V> | undefined {
    return this._newer;
  }

  set [NEWER](val: Entry<K, V> | undefined) {
    this._newer = val;
  }

  get [OLDER](): Entry<K, V> | undefined {
    return this._older;
  }

  set [OLDER](val: Entry<K, V> | undefined) {
    this._older = val;
  }
}

class EntryIterator<K, V> {
  private _entry: Entry<K, V> | undefined;

  constructor(oldestEntry: Entry<K, V> | undefined) {
    this._entry = oldestEntry;
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    let ent = this._entry;

    if (ent) {
      this._entry = (ent as CacheEntry<K, V>)[NEWER];
      return { done: false, value: [ent.key, ent.value] };
    } else {
      return { done: true, value: undefined };
    }
  }
}

class ValueIterator<K, V> {
  private _entry: Entry<K, V> | undefined;

  constructor(oldestEntry: Entry<K, V> | undefined) {
    this._entry = oldestEntry;
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    let ent = this._entry;

    if (ent) {
      this._entry = (ent as CacheEntry<K, V>)[NEWER];
      return { done: false, value: ent.value };
    } else {
      return { done: true, value: undefined };
    }
  }
}

class KeyIterator<K, V> {
  private _entry: Entry<K, V> | undefined;

  constructor(oldestEntry: Entry<K, V> | undefined) {
    this._entry = oldestEntry;
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    let ent = this._entry;

    if (ent) {
      this._entry = (ent as CacheEntry<K, V>)[NEWER];
      return { done: false, value: ent.key };
    } else {
      return { done: true, value: undefined };
    }
  }
}

class LRUCache<K, V> {
  private _limit: number;
  private _entries: Iterable<[K, V]> | undefined;
  private _keymap: Map<K, Entry<K, V>>;
  private _size: number;
  private _oldest: Entry<K, V> | undefined;
  private _newest: Entry<K, V> | undefined;

  constructor(limit: number, entries?: Iterable<[K, V]>) {
    this._limit = limit;
    // this._entries = entries;

    this._keymap = new Map<K, Entry<K, V>>();
    this._size = 0;
    this._oldest = this._newest = undefined;

    if (entries) {
      this.assign(entries);
      if (limit < 1) {
        this._limit = this._size;
      }
    }
  }

  assign(entries: Iterable<[K, V]>) {
    let entry: CacheEntry<K, V> | undefined;
    let limit = this._limit || Number.MAX_VALUE;

    this._keymap.clear();

    let it = entries[Symbol.iterator]();
    for (let itv = it.next(); !itv.done; itv = it.next()) {
      let e = new CacheEntry<K, V>(itv.value[0], itv.value[1]);
      this._keymap.set(e.key, e);

      if (!entry) {
        this._oldest = e;
      } else {
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
  }

  get(key: K): V | undefined {
    let entry = this._keymap.get(key);
    if (!entry) return;

    this._markEntryAsUsed(entry);
    return entry.value;
  }

  set(key: K, value: V): LRUCache<K, V> {
    let entry = this._keymap.get(key) as CacheEntry<K, V>;
    if (entry) {
      entry.value = value;
      this._markEntryAsUsed(entry);
      return this;
    }

    entry = new CacheEntry(key, value);
    this._keymap.set(key, entry);

    if (this._newest) {
      (this._newest as CacheEntry<K, V>)[NEWER] = entry;
      (entry as CacheEntry<K, V>)[OLDER] = this._newest;
    } else {
      this._oldest = entry;
    }

    this._newest = entry;
    ++this._size;

    if (this._size > this._limit) {
      this.shift();
    }

    return this;
  }

  delete(key: K): V | undefined {
    let entry = this._keymap.get(key);
    if (!entry) return;

    this._keymap.delete(key);

    let validEntry = entry as CacheEntry<K, V>;
    if (validEntry[NEWER] && validEntry[OLDER]) {
      (validEntry[OLDER] as CacheEntry<K, V>)[NEWER] = validEntry[NEWER];
      (validEntry[NEWER] as CacheEntry<K, V>)[OLDER] = validEntry[OLDER];
    } else if (validEntry[NEWER]) {
      (validEntry[NEWER] as CacheEntry<K, V>)[OLDER] = undefined;
      this._oldest = validEntry[NEWER];
    } else if (validEntry[OLDER]) {
      (validEntry[OLDER] as CacheEntry<K, V>)[NEWER] = undefined;
      this._newest = validEntry[OLDER];
    } else {
      this._oldest = this._newest = undefined;
    }

    this._size--;
    return entry.value;
  }

  shift(): [K, V] | undefined {
    let entry = this._oldest;
    if (!entry) {
      return;
    }

    if ((this._oldest as CacheEntry<K, V>)[NEWER]) {
      this._oldest = (this._oldest as CacheEntry<K, V>)[NEWER];
      (this._oldest as CacheEntry<K, V>)[OLDER] = undefined;
    } else {
      this._oldest = undefined;
      this._newest = undefined;
    }

    let validEntry = entry as CacheEntry<K, V>;
    validEntry[NEWER] = validEntry[OLDER] = undefined;

    this._keymap.delete(validEntry.key);
    --this._size;

    return [entry.key, entry.value];
  }

  entries(): LRUCache<K, V> {
    return this;
  }

  keys(): KeyIterator<K, V> {
    return new KeyIterator<K, V>(this.oldest);
  }

  values(): ValueIterator<K, V> {
    return new ValueIterator<K, V>(this._oldest);
  }

  [Symbol.iterator]() {
    return new EntryIterator(this._oldest);
  }

  has(key: K): boolean {
    return this._keymap.has(key);
  }

  clear() {
    this._oldest = this._newest = undefined;
    this._size = 0;
    this._keymap.clear();
  }

  _markEntryAsUsed(entry: Entry<K, V>) {
    if (entry === this._newest) {
      return;
    }

    let validEntry = entry as CacheEntry<K, V>;
    if (validEntry[NEWER]) {
      if (entry === this._oldest) {
        this._oldest = validEntry[NEWER];
      }
      const newerEntry = validEntry[NEWER] as CacheEntry<K, V>;
      let olderEntry = undefined;
      if (newerEntry) {
        olderEntry = newerEntry[OLDER];
        olderEntry = validEntry[OLDER];
      }
    }

    if (validEntry[OLDER]) {
      (validEntry[OLDER] as CacheEntry<K, V>)[NEWER] = validEntry[NEWER];
    }

    validEntry[NEWER] = undefined;
    validEntry[OLDER] = this._newest;

    if (this._newest) {
      (this._newest as CacheEntry<K, V>)[NEWER] = entry;
    }
    this._newest = entry;
  }

  get oldest(): Entry<K, V> | undefined {
    return this._oldest;
  }

  get newest(): Entry<K, V> | undefined {
    return this._newest;
  }

  get size(): number {
    return this._size;
  }

  get limit(): number {
    return this._limit;
  }

  toString(): string {
    let s = '';
    let entry = this._oldest;

    while (entry) {
      s += String(entry.key) + ':' + entry.value;
      entry = (entry as CacheEntry<K, V>)[NEWER];
      if (entry) {
        s += ' < ';
      }
    }

    return s;
  }
}

export { LRUCache };

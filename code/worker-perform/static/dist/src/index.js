"use strict";
// TODO: try this in main thread
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var randomstring_1 = __importDefault(require("randomstring"));
var simple_worker_1 = __importDefault(require("./simple.worker"));
var cached_worker_1 = __importDefault(require("./cached.worker"));
var queue_1 = require("./lib/queue");
var reverse_string_1 = require("./lib/reverse_string");
var lru_cache_1 = require("./lib/lru_cache");
var utils_1 = require("./lib/utils");
var ITERATE_COUNT = 1000;
var STR_LEN = 3;
// const cache = new LRUCache<string, string>(ITERATE_COUNT / 10);
var queue = null;
function prepareData(count, length) {
    if (count === void 0) { count = 1000; }
    if (length === void 0) { length = 10; }
    var data = [];
    for (var i = 0; i < count; i++) {
        var item = randomstring_1.default.generate(length);
        data.push({ key: "Key - " + i, val: item });
    }
    return data;
}
exports.prepareData = prepareData;
var rawData = prepareData(ITERATE_COUNT, STR_LEN);
window.rawData = rawData;
// Demo 1: execute reverse string in ui thread
function execTaskSync() {
    var e_1, _a;
    console.time('sync task in ui thread');
    var target = rawData;
    try {
        for (var target_1 = __values(target), target_1_1 = target_1.next(); !target_1_1.done; target_1_1 = target_1.next()) {
            var el = target_1_1.value;
            var val = el.val;
            reverse_string_1.reverseString(val);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (target_1_1 && !target_1_1.done && (_a = target_1.return)) _a.call(target_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    console.timeEnd('sync task in ui thread');
}
// let customWindow = window as CustomWindow
window.execTaskSync = execTaskSync;
function execQueueTask() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.time('===>work with queue');
            // Use a queue to execute tasks asynchronously
            if (!queue)
                queue = new queue_1.TaskQueue();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    if (queue) {
                        queue.addTask(function (target) {
                            var e_2, _a;
                            try {
                                for (var target_2 = __values(target), target_2_1 = target_2.next(); !target_2_1.done; target_2_1 = target_2.next()) {
                                    var el = target_2_1.value;
                                    var val = el.val;
                                    reverse_string_1.reverseString(val);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (target_2_1 && !target_2_1.done && (_a = target_2.return)) _a.call(target_2);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            console.timeEnd('===>work with queue');
                            return 'done';
                        }, rawData, resolve, reject);
                    }
                    else {
                        reject(new Error('Queue is empty!!!'));
                    }
                })];
        });
    });
}
window.execQueueTask = execQueueTask;
var dataCache = new lru_cache_1.LRUCache(ITERATE_COUNT / 10);
function execInWorkerWithBuffer() {
    var e_3, _a;
    var data = rawData;
    var unprocessed = [];
    var flatCache = [];
    try {
        for (var _b = __values(dataCache.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var c = _c.value;
            flatCache.push(c);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    var dataStr = JSON.stringify(data);
    var dataBuff = utils_1.str2ab(dataStr);
    var worker = new cached_worker_1.default();
    worker.postMessage(dataBuff, [dataBuff]);
    worker.onmessage = function (event) {
        console.log('===>Worker value', event.data);
        console.log('===>Worker done');
        var processed = JSON.parse(utils_1.ab2str(event.data) || '[]');
        if (processed && processed.length > 0) {
            processed.forEach(function (element) {
                dataCache.set(element.key, element);
            });
        }
    };
    worker.onerror = function (event) {
        console.log('===>Worker error', event);
    };
}
window.execInWorkerWithBuffer = execInWorkerWithBuffer;
/**
 * Everytime send a object to worker to revert it.
 */
function execWorkerTask() {
    var worker = new simple_worker_1.default();
    worker.postMessage({ target: rawData });
    worker.onmessage = function (event) {
        console.log('===>Worker done', event.data);
    };
    worker.onerror = function (event) {
        console.log('===>Worker error', event);
    };
}
window.execWorkerTask = execWorkerTask;
//# sourceMappingURL=index.js.map
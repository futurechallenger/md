"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var reverse_string_1 = require("./lib/reverse_string");
var ctx = self;
ctx.onmessage = function (event) {
    var e_1, _a;
    console.log('===>Inside worker', event.data);
    console.time('worker timer');
    var target = event.data.target;
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
    console.timeEnd('worker timer');
    ctx.postMessage('done');
    // Close the worker when jobs done
    self.close();
};
ctx.onerror = function (event) {
    console.error('Error in worker', event.message);
    self.close();
};
exports.default = null;
//# sourceMappingURL=simple.worker.js.map
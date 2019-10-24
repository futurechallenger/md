"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../src/lib/utils");
describe('test util methods', function () {
    test('Array buffer from/to string', function () {
        var str = 'hello world!';
        var buf = utils_1.str2ab(str);
        var ret = utils_1.ab2str(buf);
        expect(str).toEqual(ret);
    });
});
//# sourceMappingURL=util.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../src/index");
describe('Test index', function () {
    test('Test pareparation of data', function () {
        var data = index_1.prepareData(5);
        expect(data.length).toBe(5);
        expect(data[0].val !== data[data.length - 1].val).toBe(true);
    });
});
//# sourceMappingURL=index.spec.js.map
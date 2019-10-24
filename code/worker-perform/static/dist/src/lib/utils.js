"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convert buffer to string
 * @param buff array buffer
 */
function ab2str(buff) {
    try {
        return String.fromCharCode.apply(null, new Uint16Array(buff));
    }
    catch (e) {
        console.error('Convert buff to string error', e);
    }
}
exports.ab2str = ab2str;
/**
 * Covnert string to array buffer
 * @param str A string
 */
function str2ab(str) {
    try {
        var buff = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var buffView = new Uint16Array(buff);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            buffView[i] = str.charCodeAt(i);
        }
        return buff;
    }
    catch (e) {
        console.error('Convert string to buffer error', e);
    }
}
exports.str2ab = str2ab;
//# sourceMappingURL=utils.js.map
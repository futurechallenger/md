"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Reverse a string
 */
function reverseString(input) {
    if (input === void 0) { input = 'Hello World!'; }
    return input
        .split('')
        .reverse()
        .join('');
}
exports.reverseString = reverseString;
//# sourceMappingURL=reverse_string.js.map
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./node_modules/ts-loader/index.js!./src/cached.worker.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/ts-loader/index.js!./src/cached.worker.ts":
/*!*******************************************************!*\
  !*** ./node_modules/ts-loader!./src/cached.worker.ts ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __values = (this && this.__values) || function(o) {\n    var s = typeof Symbol === \"function\" && Symbol.iterator, m = s && o[s], i = 0;\n    if (m) return m.call(o);\n    if (o && typeof o.length === \"number\") return {\n        next: function () {\n            if (o && i >= o.length) o = void 0;\n            return { value: o && o[i++], done: !o };\n        }\n    };\n    throw new TypeError(s ? \"Object is not iterable.\" : \"Symbol.iterator is not defined.\");\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\n/**\n * A worker with cache to improve performance\n */\nvar reverse_string_1 = __webpack_require__(/*! ./lib/reverse_string */ \"./src/lib/reverse_string.ts\");\nvar utils_1 = __webpack_require__(/*! ./lib/utils */ \"./src/lib/utils.ts\");\nvar ctx = self;\nctx.onmessage = function (event) {\n    var e_1, _a;\n    console.log('===>Inside worker', event.data);\n    var dataBuff = event.data.dataBuff;\n    var dataStr = utils_1.ab2str(dataBuff);\n    var target = JSON.parse(dataStr || '[]');\n    var processed = [];\n    try {\n        for (var target_1 = __values(target), target_1_1 = target_1.next(); !target_1_1.done; target_1_1 = target_1.next()) {\n            var d = target_1_1.value;\n            var key = d.key, val = d.val;\n            processed.push({ key: key, val: reverse_string_1.reverseString(val) });\n        }\n    }\n    catch (e_1_1) { e_1 = { error: e_1_1 }; }\n    finally {\n        try {\n            if (target_1_1 && !target_1_1.done && (_a = target_1.return)) _a.call(target_1);\n        }\n        finally { if (e_1) throw e_1.error; }\n    }\n    ctx.postMessage(utils_1.str2ab(JSON.stringify(processed)));\n    self.close();\n};\nctx.onerror = function (event) {\n    console.error('Error in worker', event);\n    self.close();\n};\nexports.default = null;\n\n\n//# sourceURL=webpack:///./src/cached.worker.ts?./node_modules/ts-loader");

/***/ }),

/***/ "./src/lib/reverse_string.ts":
/*!***********************************!*\
  !*** ./src/lib/reverse_string.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\n/**\n * Reverse a string\n */\nfunction reverseString(input) {\n    if (input === void 0) { input = 'Hello World!'; }\n    return input\n        .split('')\n        .reverse()\n        .join('');\n}\nexports.reverseString = reverseString;\n\n\n//# sourceURL=webpack:///./src/lib/reverse_string.ts?");

/***/ }),

/***/ "./src/lib/utils.ts":
/*!**************************!*\
  !*** ./src/lib/utils.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\n/**\n * Convert buffer to string\n * @param buff array buffer\n */\nfunction ab2str(buff) {\n    try {\n        return String.fromCharCode.apply(null, new Uint16Array(buff));\n    }\n    catch (e) {\n        console.error('Convert buff to string error', e);\n    }\n}\nexports.ab2str = ab2str;\n/**\n * Covnert string to array buffer\n * @param str A string\n */\nfunction str2ab(str) {\n    try {\n        var buff = new ArrayBuffer(str.length * 2); // 2 bytes for each char\n        var buffView = new Uint16Array(buff);\n        for (var i = 0, strLen = str.length; i < strLen; i++) {\n            buffView[i] = str.charCodeAt(i);\n        }\n        return buff;\n    }\n    catch (e) {\n        console.error('Convert string to buffer error', e);\n    }\n}\nexports.str2ab = str2ab;\n\n\n//# sourceURL=webpack:///./src/lib/utils.ts?");

/***/ })

/******/ });
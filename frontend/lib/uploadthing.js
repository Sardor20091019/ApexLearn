"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = exports.useUploadThing = exports.UploadDropzone = exports.UploadButton = void 0;
const react_1 = require("@uploadthing/react");
exports.UploadButton = (0, react_1.generateUploadButton)();
exports.UploadDropzone = (0, react_1.generateUploadDropzone)();
_a = (0, react_1.generateReactHelpers)(), exports.useUploadThing = _a.useUploadThing, exports.uploadFiles = _a.uploadFiles;
//# sourceMappingURL=uploadthing.js.map
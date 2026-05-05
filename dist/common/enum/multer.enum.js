"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store_Enum = exports.multer_enum = void 0;
exports.multer_enum = {
    image: ["image/png", "image/jpeg", "image/webp"],
    video: ["video/mp4"],
    files: ["application/pdf"]
};
var Store_Enum;
(function (Store_Enum) {
    Store_Enum["disk"] = "disk";
    Store_Enum["memory"] = "memory";
})(Store_Enum || (exports.Store_Enum = Store_Enum = {}));

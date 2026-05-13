"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const paranoid_plugin_1 = require("../plugins/paranoid.plugin");
const reactionSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, trim: true, maxlength: 32 },
}, { _id: false });
const commentSchema = new mongoose_1.default.Schema({
    post: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true, index: true },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    reactions: { type: [reactionSchema], default: [] },
    deletedAt: { type: Date },
}, { timestamps: true, strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
(0, paranoid_plugin_1.applyParanoidPlugin)(commentSchema);
const CommentModel = mongoose_1.default.models.Comment || mongoose_1.default.model("Comment", commentSchema);
exports.default = CommentModel;

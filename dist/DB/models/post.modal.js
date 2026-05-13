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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const post_enum_1 = require("../../common/enum/post.enum");
const paranoid_plugin_1 = require("../plugins/paranoid.plugin");
const comment_modal_1 = __importDefault(require("./comment.modal"));
const reactionSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, trim: true, maxlength: 32 },
}, { _id: false });
const postSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        min: 1,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    reactions: { type: [reactionSchema], default: [] },
    allow_comment: {
        type: String,
        enum: post_enum_1.Allow_Comment_Enum,
        default: post_enum_1.Allow_Comment_Enum.allow,
    },
    availability: {
        type: String,
        enum: post_enum_1.Availability_Enum,
        default: post_enum_1.Availability_Enum.public,
    },
    folderId: String,
    deletedAt: { type: Date },
}, {
    timestamps: true,
    strictQuery: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, paranoid_plugin_1.applyParanoidPlugin)(postSchema);
postSchema.post("findOneAndDelete", async function (doc) {
    if (!doc?._id)
        return;
    await comment_modal_1.default.deleteMany({ post: doc._id });
});
postSchema.post("findOneAndUpdate", async function (doc) {
    if (!doc?._id)
        return;
    const hasSoftDelete = Boolean(doc.deletedAt);
    if (!hasSoftDelete)
        return;
    await comment_modal_1.default.updateMany({ post: doc._id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } });
});
const PostModel = mongoose_1.default.models.Post || mongoose_1.default.model("Post", postSchema);
exports.default = PostModel;

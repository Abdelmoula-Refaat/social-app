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
const user_enum_1 = require("../../common/enum/user.enum");
const paranoid_plugin_1 = require("../plugins/paranoid.plugin");
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 25,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 25,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: function () {
            return this.provider == user_enum_1.ProviderEnum.local ? true : false;
        },
        trim: true,
        min: 3,
        max: 25,
    },
    age: {
        type: Number,
        required: function () {
            return this.provider == user_enum_1.ProviderEnum.local ? true : false;
        },
        trim: true,
        min: 18,
        max: 60,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: user_enum_1.GenderEnum,
        default: user_enum_1.GenderEnum.male,
    },
    role: {
        type: String,
        enum: user_enum_1.RoleEnum,
        default: user_enum_1.RoleEnum.user,
    },
    provider: {
        type: String,
        enum: user_enum_1.ProviderEnum,
        default: user_enum_1.ProviderEnum.local,
    },
    profilePic: String,
    confrimed: Boolean,
    friends: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("userName")
    .get(function () {
    return this.firstName + " " + this.lastName;
})
    .set(function (val) {
    this.set({ firstName: val.split(" ")[0], lastName: val.split(" ")[1] });
});
(0, paranoid_plugin_1.applyParanoidPlugin)(userSchema);
userSchema.post("findOneAndUpdate", async function (doc) {
    if (!doc?._id || !doc.deletedAt)
        return;
    const Post = mongoose_1.default.model("Post");
    const Comment = mongoose_1.default.model("Comment");
    const postIds = await Post.distinct("_id", {
        createdBy: doc._id,
        deletedAt: { $exists: false },
    });
    await Post.updateMany({ createdBy: doc._id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } });
    if (postIds.length) {
        await Comment.updateMany({ post: { $in: postIds }, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } });
    }
});
userSchema.post("findOneAndDelete", async function (doc) {
    if (!doc?._id)
        return;
    const Post = mongoose_1.default.model("Post");
    const Comment = mongoose_1.default.model("Comment");
    const postIds = await Post.distinct("_id", { createdBy: doc._id });
    if (postIds.length) {
        await Comment.deleteMany({ post: { $in: postIds } });
    }
    await Post.deleteMany({ createdBy: doc._id });
});
const UserModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = UserModel;

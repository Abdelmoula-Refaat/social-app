"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_enum_1 = require("../../common/enum/user.enum");
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
        min: 20,
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
    confrimed: Boolean,
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
userSchema.pre("updateOne", { document: true, query: false }, function () {
    console.log("--pre updateOne hook--");
    console.log(this);
});
const UserModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = UserModel;

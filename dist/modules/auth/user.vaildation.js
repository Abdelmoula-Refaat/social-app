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
exports.confirmEmailSchema = exports.signupSchema = exports.signinSchema = exports.reSendOtpSchema = void 0;
const z = __importStar(require("zod"));
const user_enum_1 = require("../../common/enum/user.enum");
exports.reSendOtpSchema = {
    body: z.strictObject({
        email: z.email("Invalid email address"),
    }),
};
exports.signinSchema = {
    body: exports.reSendOtpSchema.body.safeExtend({
        password: z.string().min(6),
    })
};
exports.signupSchema = {
    body: exports.signinSchema.body.safeExtend({
        firstName: z.string({ error: "firstName is required" }).min(3).max(25),
        lastName: z.string({ error: "lastName is required" }).min(3).max(25),
        cPassword: z.string().min(6),
        age: z.number().min(18).max(60),
        gender: z.enum(user_enum_1.GenderEnum).optional(),
        address: z.string().min(3).max(25).optional(),
        phone: z.string().min(3).max(25).optional()
    }).superRefine((data, ctx) => {
        if (data.password !== data.cPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["cPassword"],
                message: "Passwords do not match",
            });
        }
    })
};
exports.confirmEmailSchema = {
    body: z
        .strictObject({
        email: z.email("Invalid email address"),
        code: z.string().regex(/^\d{6}$/),
    })
};

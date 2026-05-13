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
exports.adminUpdateNotificationSchema = exports.adminBatchParams = exports.adminCreateNotificationSchema = exports.markReadBody = exports.notificationIdParams = exports.listNotificationsQuery = void 0;
const z = __importStar(require("zod"));
const generalRules_1 = require("../../common/utils/generalRules");
exports.listNotificationsQuery = {
    query: z.object({
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
    }),
};
exports.notificationIdParams = {
    params: z.strictObject({
        notificationId: generalRules_1.GeneralRules.id,
    }),
};
exports.markReadBody = {
    body: z.strictObject({
        read: z.boolean(),
    }),
    params: z.strictObject({
        notificationId: generalRules_1.GeneralRules.id,
    }),
};
exports.adminCreateNotificationSchema = {
    body: z
        .strictObject({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(4000),
        broadcast: z.boolean().optional(),
        recipientIds: z.array(generalRules_1.GeneralRules.id).optional(),
    })
        .superRefine((data, ctx) => {
        if (!data.broadcast && (!data.recipientIds || !data.recipientIds.length)) {
            ctx.addIssue({
                code: "custom",
                message: "Provide recipientIds or set broadcast to true",
                path: ["recipientIds"],
            });
        }
        if (data.broadcast && data.recipientIds?.length) {
            ctx.addIssue({
                code: "custom",
                message: "Do not pass recipientIds when broadcast is true",
                path: ["recipientIds"],
            });
        }
    }),
};
exports.adminBatchParams = {
    params: z.strictObject({
        batchId: generalRules_1.GeneralRules.id,
    }),
};
exports.adminUpdateNotificationSchema = {
    params: exports.adminBatchParams.params,
    body: z.strictObject({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(4000),
    }),
};

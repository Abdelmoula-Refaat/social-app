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
exports.adminNotificationsRouter = exports.userNotificationsRouter = void 0;
const express_1 = require("express");
const authentication_1 = require("../../common/middleware/authentication");
const adminOnly_1 = require("../../common/middleware/adminOnly");
const validation_1 = require("../../common/middleware/validation");
const notifications_service_1 = __importDefault(require("./notifications.service"));
const notificationsValidation = __importStar(require("./notifications.vaildation"));
exports.userNotificationsRouter = (0, express_1.Router)();
exports.userNotificationsRouter.get("/", authentication_1.authentication, (0, validation_1.validation)(notificationsValidation.listNotificationsQuery), notifications_service_1.default.listMine);
exports.userNotificationsRouter.patch("/:notificationId", authentication_1.authentication, (0, validation_1.validation)(notificationsValidation.markReadBody), notifications_service_1.default.markRead);
exports.userNotificationsRouter.delete("/:notificationId", authentication_1.authentication, (0, validation_1.validation)(notificationsValidation.notificationIdParams), notifications_service_1.default.deleteMine);
exports.adminNotificationsRouter = (0, express_1.Router)();
exports.adminNotificationsRouter.use(authentication_1.authentication, adminOnly_1.adminOnly);
exports.adminNotificationsRouter.get("/", (0, validation_1.validation)(notificationsValidation.listNotificationsQuery), notifications_service_1.default.adminList);
exports.adminNotificationsRouter.post("/", (0, validation_1.validation)(notificationsValidation.adminCreateNotificationSchema), notifications_service_1.default.adminCreate);
exports.adminNotificationsRouter.patch("/batch/:batchId", (0, validation_1.validation)(notificationsValidation.adminUpdateNotificationSchema), notifications_service_1.default.adminUpdateBatch);
exports.adminNotificationsRouter.delete("/batch/:batchId", (0, validation_1.validation)(notificationsValidation.adminBatchParams), notifications_service_1.default.adminDeleteBatch);

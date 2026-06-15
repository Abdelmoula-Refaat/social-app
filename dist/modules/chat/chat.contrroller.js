"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_service_1 = __importDefault(require("./chat.service"));
const authentication_1 = require("../../common/middleware/authentication");
const multer_cloud_1 = __importDefault(require("../../common/middleware/multer.cloud"));
const multer_enum_1 = require("../../common/enum/multer.enum");
const chatRouter = (0, express_1.Router)({ mergeParams: true });
chatRouter.get("/", authentication_1.authentication, chat_service_1.default.getChat);
chatRouter.post("/group", authentication_1.authentication, (0, multer_cloud_1.default)({ store_type: multer_enum_1.Store_Enum.disk }).single("attachment"), chat_service_1.default.createGroupChat);
exports.default = chatRouter;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../../common/middleware/authentication");
const adminOnly_1 = require("../../common/middleware/adminOnly");
const dashboard_service_1 = __importDefault(require("./dashboard.service"));
const dashboardRouter = (0, express_1.Router)();
dashboardRouter.get("/", authentication_1.authentication, adminOnly_1.adminOnly, dashboard_service_1.default.summary);
exports.default = dashboardRouter;

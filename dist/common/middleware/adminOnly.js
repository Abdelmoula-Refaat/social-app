"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const global_error_handler_1 = require("../utils/global-error-handler");
const user_enum_1 = require("../enum/user.enum");
const adminOnly = (req, res, next) => {
    const role = req.user?.role;
    if (role !== user_enum_1.RoleEnum.admin && role !== user_enum_1.RoleEnum.superAdmin) {
        throw new global_error_handler_1.AppError("Forbidden: admin only", 403);
    }
    next();
};
exports.adminOnly = adminOnly;

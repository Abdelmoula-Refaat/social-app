"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const response_success_1 = require("../../common/utils/security/response.success");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
class UsersService {
    _users = new user_repository_1.default();
    publicProfile = async (req, res, next) => {
        const userIdRaw = req.params.userId;
        const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
        if (!userId) {
            throw new global_error_handler_1.AppError("Missing userId", 400);
        }
        const user = await this._users.findOne({
            filter: { _id: new mongoose_1.Types.ObjectId(userId) },
            projection: {
                firstName: 1,
                lastName: 1,
                profilePic: 1,
                gender: 1,
                createdAt: 1,
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("User not found", 404);
        }
        (0, response_success_1.successResponse)({ res, data: { user } });
    };
}
exports.default = new UsersService();

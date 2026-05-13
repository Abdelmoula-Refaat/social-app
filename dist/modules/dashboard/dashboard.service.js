"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const response_success_1 = require("../../common/utils/security/response.success");
const user_modal_1 = __importDefault(require("../../DB/models/user.modal"));
const post_modal_1 = __importDefault(require("../../DB/models/post.modal"));
const comment_modal_1 = __importDefault(require("../../DB/models/comment.modal"));
const story_modal_1 = __importDefault(require("../../DB/models/story.modal"));
const notification_modal_1 = __importDefault(require("../../DB/models/notification.modal"));
class DashboardService {
    summary = async (req, res, next) => {
        const [users, posts, comments, stories, notifications] = await Promise.all([
            user_modal_1.default.countDocuments({}),
            post_modal_1.default.countDocuments({}),
            comment_modal_1.default.countDocuments({}),
            story_modal_1.default.countDocuments({ expiresAt: { $gt: new Date() } }),
            notification_modal_1.default.countDocuments({}),
        ]);
        (0, response_success_1.successResponse)({
            res,
            data: {
                users,
                posts,
                comments,
                activeStories: stories,
                notificationDeliveries: notifications,
            },
        });
    };
}
exports.default = new DashboardService();

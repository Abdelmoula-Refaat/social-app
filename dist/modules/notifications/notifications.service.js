"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const response_success_1 = require("../../common/utils/security/response.success");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const notification_repository_1 = __importDefault(require("../../DB/repositories/notification.repository"));
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const INSERT_CHUNK = 500;
const BROADCAST_CAP = 2000;
class NotificationsAppService {
    _repo = new notification_repository_1.default();
    _users = new user_repository_1.default();
    listMine = async (req, res, next) => {
        const data = await this._repo.paginate({
            page: +req.query.page,
            limit: +req.query.limit,
            sort: { createdAt: -1 },
            search: { recipientId: req.user._id },
        });
        (0, response_success_1.successResponse)({ res, data });
    };
    markRead = async (req, res, next) => {
        const { notificationId } = req.params;
        const { read } = req.body;
        const updated = await this._repo.findOneAndUpdate({
            filter: { _id: notificationId, recipientId: req.user._id },
            update: read ? { $set: { readAt: new Date() } } : { $unset: { readAt: 1 } },
        });
        if (!updated) {
            throw new global_error_handler_1.AppError("Notification not found", 404);
        }
        (0, response_success_1.successResponse)({ res, data: updated });
    };
    deleteMine = async (req, res, next) => {
        const { notificationId } = req.params;
        const deleted = await this._repo.findOneAndDelete({
            filter: { _id: notificationId, recipientId: req.user._id },
        });
        if (!deleted) {
            throw new global_error_handler_1.AppError("Notification not found", 404);
        }
        (0, response_success_1.successResponse)({ res, data: { deleted: true } });
    };
    adminList = async (req, res, next) => {
        const data = await this._repo.paginate({
            page: +req.query.page,
            limit: +req.query.limit,
            sort: { createdAt: -1 },
            search: { createdBy: req.user._id },
        });
        (0, response_success_1.successResponse)({ res, data });
    };
    adminCreate = async (req, res, next) => {
        const { title, body, broadcast, recipientIds } = req.body;
        const batchId = new mongoose_1.Types.ObjectId();
        const createdBy = req.user._id;
        let targets = [];
        if (broadcast) {
            const users = await this._users.find({
                filter: {},
                projection: { _id: 1 },
                options: { limit: BROADCAST_CAP },
            });
            targets = users.map((u) => u._id);
        }
        else {
            targets = recipientIds.map((id) => new mongoose_1.Types.ObjectId(id));
        }
        if (!targets.length) {
            throw new global_error_handler_1.AppError("No recipients resolved for this notification", 400);
        }
        const docs = targets.map((recipientId) => ({
            title,
            body,
            recipientId,
            createdBy,
            batchId,
        }));
        for (let i = 0; i < docs.length; i += INSERT_CHUNK) {
            const slice = docs.slice(i, i + INSERT_CHUNK);
            await this._repo.insertMany(slice);
        }
        const tokens = [];
        for (const id of targets) {
            const t = await redis_service_1.default.getFCMs(id);
            tokens.push(...t);
        }
        if (tokens.length) {
            await notification_service_1.default.sendNotifications({
                tokens,
                data: { title, body },
            });
        }
        (0, response_success_1.successResponse)({
            res,
            data: { batchId, recipients: targets.length },
        });
    };
    adminUpdateBatch = async (req, res, next) => {
        const batchIdRaw = req.params.batchId;
        const batchIdStr = Array.isArray(batchIdRaw) ? batchIdRaw[0] : batchIdRaw;
        if (!batchIdStr) {
            throw new global_error_handler_1.AppError("Missing batchId", 400);
        }
        const batchId = new mongoose_1.Types.ObjectId(batchIdStr);
        const { title, body } = req.body;
        const result = await this._repo.updateMany({ batchId, createdBy: req.user._id }, { $set: { title, body } });
        if (!result.matchedCount) {
            throw new global_error_handler_1.AppError("Batch not found", 404);
        }
        (0, response_success_1.successResponse)({ res, data: { modified: result.modifiedCount } });
    };
    adminDeleteBatch = async (req, res, next) => {
        const batchIdRaw = req.params.batchId;
        const batchIdStr = Array.isArray(batchIdRaw) ? batchIdRaw[0] : batchIdRaw;
        if (!batchIdStr) {
            throw new global_error_handler_1.AppError("Missing batchId", 400);
        }
        const batchId = new mongoose_1.Types.ObjectId(batchIdStr);
        const result = await this._repo.deleteMany({
            batchId,
            createdBy: req.user._id,
        });
        if (!result.deletedCount) {
            throw new global_error_handler_1.AppError("Batch not found", 404);
        }
        (0, response_success_1.successResponse)({ res, data: { deleted: result.deletedCount } });
    };
}
exports.default = new NotificationsAppService();

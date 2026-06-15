"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const chat_repository_1 = __importDefault(require("../../DB/repositories/chat.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const response_success_1 = require("../../common/utils/security/response.success");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const mongoose_1 = require("mongoose");
class ChatService {
    _userRepo = new user_repository_1.default();
    _chatRepo = new chat_repository_1.default();
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        let { page, limit = 5 } = req.query;
        if (page < 0 || !page)
            page = 1;
        page = page * 1 || 1;
        limit = limit * 1 || 5;
        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, userId]
                },
                group: { $exists: false }
            }, projection: {
                messages: {
                    $slice: [-(page * limit), limit]
                }
            },
            populate: {
                path: "participants"
            }
        });
        if (!chat) {
            throw new global_error_handler_1.AppError("Chat not found", 404);
        }
        (0, response_success_1.successResponse)({ res, message: "Done", data: chat });
    };
    createGroupChat = async (req, res) => {
        let { group, groupImage, participants } = req.body;
        const createdBy = req.user?._id;
        const dbParticipants = participants.map((participant) => mongoose_1.Types.ObjectId.createFromHexString(participant));
        const users = await this._userRepo.find({
            filter: {
                participants: {
                    $all: [req.user?._id, participants]
                },
                group: { $exists: false }
            }, projection: {
                messages: {
                    $slice: [-(page * limit), limit]
                }
            },
            populate: {
                path: "participants"
            }
        });
        if (!chat) {
            throw new global_error_handler_1.AppError("Chat not found", 404);
        }
        (0, response_success_1.successResponse)({ res, message: "Done", data: chat });
    };
    sayHi = async (data) => {
        console.log(data);
    };
    sendMessage = async (data, socket, io) => {
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id;
        const user = await this._userRepo.findOne({ filter: { _id: sendTo } });
        if (!user)
            throw new global_error_handler_1.AppError("User not exist");
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: { $all: [sendTo, createdBy] },
                group: { $exists: false }
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    },
                },
            },
        });
        if (!chat) {
            await this._chatRepo.create({
                createdBy,
                messages: [
                    {
                        content,
                        createdBy,
                    },
                ],
                participants: [sendTo, createdBy]
            });
        }
        io.to(await redis_service_1.default.getSockets(createdBy)).emit("successMessage", { content });
        io.to(await redis_service_1.default.getSockets(sendTo)).emit("newMessage", { content, from: socket.data.user });
    };
}
exports.default = new ChatService();

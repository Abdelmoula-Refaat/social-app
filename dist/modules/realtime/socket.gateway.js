"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const authentication_1 = require("../../common/middleware/authentication");
const chat_gateway_1 = __importDefault(require("../chat/realtime/chat.gateway"));
class SocketGateway {
    constructor() { }
    initIo = async (httpServer) => {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*"
            }
        });
        io.use(async (socket, next) => {
            try {
                console.log(socket.handshake.auth.authorization);
                const { user } = await (0, authentication_1.decodedToken_and_fetchUser)(socket.handshake.auth.authorization || socket.handshake.headers.authorization);
                socket.data.user = user;
                next();
            }
            catch (error) {
                next(error);
            }
        });
        io.on("connection", async (socket) => {
            redis_service_1.default.addSocket({ userId: socket.data.user._id, SocketId: socket.id });
            await chat_gateway_1.default.registerEvent(socket, io);
            console.log({ userSocketsIds: await redis_service_1.default.getSockets(socket.data.user._id) });
            socket.on("disconnect", async () => {
                await redis_service_1.default.removeSocket({ userId: socket.data.user._id, SocketId: socket.id });
                console.log({ userSocketsIdsAfterDisconnect: await redis_service_1.default.getSockets(socket.data.user._id) });
            });
        });
    };
}
exports.default = new SocketGateway();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_service_1 = __importDefault(require("../chat.service"));
class ChatEvent {
    constructor() { }
    sayHi = async (socket) => {
        socket.on("sayHi", (data) => {
            chat_service_1.default.sayHi(data);
        });
    };
    sendMessage = async (socket, io) => {
        socket.on("sendMessage", (data) => {
            chat_service_1.default.sendMessage(data, socket, io);
        });
    };
}
exports.default = new ChatEvent();

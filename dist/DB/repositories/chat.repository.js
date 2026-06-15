"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_model_1 = __importDefault(require("../models/chat.model"));
const base_repository_1 = __importDefault(require("./base.repository"));
class ChatRepository extends base_repository_1.default {
    model;
    constructor(model = chat_model_1.default) {
        super(model);
        this.model = model;
    }
}
exports.default = ChatRepository;

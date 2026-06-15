"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const post_modal_1 = __importDefault(require("../models/post.modal"));
const base_repository_1 = __importDefault(require("./base.repository"));
class PostRepository extends base_repository_1.default {
    model;
    constructor(model = post_modal_1.default) {
        super(model);
        this.model = model;
    }
}
exports.default = PostRepository;

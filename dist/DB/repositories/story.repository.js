"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const story_modal_1 = __importDefault(require("../models/story.modal"));
const base_repository_1 = __importDefault(require("./base.repository"));
class StoryRepository extends base_repository_1.default {
    model;
    constructor(model = story_modal_1.default) {
        super(model);
        this.model = model;
    }
}
exports.default = StoryRepository;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerCloud = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = require("node:os");
const multer_enum_1 = require("../enum/multer.enum");
const global_error_handler_1 = require("../utils/global-error-handler");
const multerCloud = ({ store_type = multer_enum_1.Store_Enum.memory, custom_types = multer_enum_1.multer_enum.image, max_file_size = 5 * 1024 * 1024, } = {}) => {
    const storage = store_type === multer_enum_1.Store_Enum.memory ? multer_1.default.memoryStorage() : multer_1.default.diskStorage({
        destination: (0, node_os_1.tmpdir)(),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + "__" + file.originalname);
        }
    });
    const fileFilter = (req, file, cb) => {
        if (!custom_types.includes(file.mimetype)) {
            cb(new global_error_handler_1.AppError("Invalid file type"));
        }
        else {
            cb(null, true);
        }
    };
    const upload = (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: max_file_size } });
    return upload;
};
exports.multerCloud = multerCloud;
exports.default = exports.multerCloud;

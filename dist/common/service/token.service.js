"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class TokenService {
    constructor() { }
    GenerateToken({ payload, secret_key, options }) {
        return jsonwebtoken_1.default.sign(payload, secret_key, options);
    }
    VerifyToken({ token, secret_key }) {
        return jsonwebtoken_1.default.verify(token, secret_key);
    }
}
exports.default = new TokenService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_service_1 = require("../../../config/config.service");
const sendEmail = async (mailOptions) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: config_service_1.EMAIL,
            pass: config_service_1.PASSWORD
        }
    });
    const info = await transporter.sendMail({
        from: `Social App <${config_service_1.EMAIL}>`,
        ...mailOptions
    });
    console.log("Message sent", info.messageId);
    return info.accepted.length ? true : false;
};
exports.sendEmail = sendEmail;
const generateOtp = async () => {
    return Math.floor(Math.random() * 900000 + 100000);
};
exports.generateOtp = generateOtp;

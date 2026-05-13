"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function resolveServiceAccountPath() {
    const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (envPath) {
        const abs = (0, node_path_1.resolve)(envPath);
        if ((0, node_fs_1.existsSync)(abs)) {
            return abs;
        }
    }
    return (0, node_path_1.resolve)(__dirname, "../../config/social-media-8d23b-firebase-adminsdk-fbsvc-1905b2cda2.json");
}
function getMessaging() {
    if (!firebase_admin_1.default.apps.length) {
        const path = resolveServiceAccountPath();
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    return firebase_admin_1.default.messaging();
}
class NotificationService {
    async sendNotification({ token, data, }) {
        const message = {
            token,
            notification: { title: data.title, body: data.body },
            data: { title: data.title, body: data.body },
        };
        return await getMessaging().send(message);
    }
    async sendNotifications({ tokens, data, }) {
        const unique = [...new Set(tokens)].filter(Boolean);
        await Promise.all(unique.map((token) => this.sendNotification({ token, data })));
    }
}
exports.default = new NotificationService();

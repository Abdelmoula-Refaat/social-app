import admin from "firebase-admin";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function resolveServiceAccountPath(): string {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath) {
    const abs = resolve(envPath);
    if (existsSync(abs)) {
      return abs;
    }
  }
  return resolve(__dirname, "../../config/social-media-8d23b-firebase-adminsdk-fbsvc-1905b2cda2.json");
}

function getMessaging() {
  if (!admin.apps.length) {
    const path = resolveServiceAccountPath();
    const serviceAccount = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
  return admin.messaging();
}

class NotificationService {
  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      notification: { title: data.title, body: data.body },
      data: { title: data.title, body: data.body },
    };
    return await getMessaging().send(message);
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    const unique = [...new Set(tokens)].filter(Boolean);
    await Promise.all(unique.map((token) => this.sendNotification({ token, data })));
  }
}

export default new NotificationService();

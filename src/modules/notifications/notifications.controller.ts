import { Router } from "express";
import { authentication } from "../../common/middleware/authentication";
import { adminOnly } from "../../common/middleware/adminOnly";
import { validation } from "../../common/middleware/validation";
import notificationsService from "./notifications.service";
import * as notificationsValidation from "./notifications.vaildation";

export const userNotificationsRouter = Router();

userNotificationsRouter.get(
  "/",
  authentication,
  validation(notificationsValidation.listNotificationsQuery),
  notificationsService.listMine,
);

userNotificationsRouter.patch(
  "/:notificationId",
  authentication,
  validation(notificationsValidation.markReadBody),
  notificationsService.markRead,
);

userNotificationsRouter.delete(
  "/:notificationId",
  authentication,
  validation(notificationsValidation.notificationIdParams),
  notificationsService.deleteMine,
);

export const adminNotificationsRouter = Router();

adminNotificationsRouter.use(authentication, adminOnly);

adminNotificationsRouter.get(
  "/",
  validation(notificationsValidation.listNotificationsQuery),
  notificationsService.adminList,
);

adminNotificationsRouter.post(
  "/",
  validation(notificationsValidation.adminCreateNotificationSchema),
  notificationsService.adminCreate,
);

adminNotificationsRouter.patch(
  "/batch/:batchId",
  validation(notificationsValidation.adminUpdateNotificationSchema),
  notificationsService.adminUpdateBatch,
);

adminNotificationsRouter.delete(
  "/batch/:batchId",
  validation(notificationsValidation.adminBatchParams),
  notificationsService.adminDeleteBatch,
);

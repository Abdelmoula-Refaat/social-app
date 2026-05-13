import * as z from "zod";
import { GeneralRules } from "../../common/utils/generalRules";

export const listNotificationsQuery = {
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  }),
};

export const notificationIdParams = {
  params: z.strictObject({
    notificationId: GeneralRules.id,
  }),
};

export const markReadBody = {
  body: z.strictObject({
    read: z.boolean(),
  }),
  params: z.strictObject({
    notificationId: GeneralRules.id,
  }),
};

export const adminCreateNotificationSchema = {
  body: z
    .strictObject({
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(4000),
      broadcast: z.boolean().optional(),
      recipientIds: z.array(GeneralRules.id).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.broadcast && (!data.recipientIds || !data.recipientIds.length)) {
        ctx.addIssue({
          code: "custom",
          message: "Provide recipientIds or set broadcast to true",
          path: ["recipientIds"],
        });
      }
      if (data.broadcast && data.recipientIds?.length) {
        ctx.addIssue({
          code: "custom",
          message: "Do not pass recipientIds when broadcast is true",
          path: ["recipientIds"],
        });
      }
    }),
};

export const adminBatchParams = {
  params: z.strictObject({
    batchId: GeneralRules.id,
  }),
};

export const adminUpdateNotificationSchema = {
  params: adminBatchParams.params,
  body: z.strictObject({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(4000),
  }),
};

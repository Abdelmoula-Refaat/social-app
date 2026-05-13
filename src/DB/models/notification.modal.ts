import mongoose, { Types } from "mongoose";

export interface INotification {
  title: string;
  body: string;
  recipientId: Types.ObjectId;
  createdBy: Types.ObjectId;
  batchId: Types.ObjectId;
  readAt?: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    recipientId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    batchId: { type: Types.ObjectId, required: true, index: true },
    readAt: { type: Date },
  },
  { timestamps: true, strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default NotificationModel;

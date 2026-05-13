import { Model } from "mongoose";
import NotificationModel, { INotification } from "../models/notification.modal";
import BaseRepository from "./base.repository";

class NotificationRepository extends BaseRepository<INotification> {
  constructor(protected readonly model: Model<INotification> = NotificationModel) {
    super(model);
  }
}

export default NotificationRepository;

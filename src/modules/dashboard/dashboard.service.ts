import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/security/response.success";
import UserModel from "../../DB/models/user.modal";
import PostModel from "../../DB/models/post.modal";
import CommentModel from "../../DB/models/comment.modal";
import StoryModel from "../../DB/models/story.modal";
import NotificationModel from "../../DB/models/notification.modal";

class DashboardService {
  summary = async (req: Request, res: Response, next: NextFunction) => {
    const [users, posts, comments, stories, notifications] = await Promise.all([
      UserModel.countDocuments({}),
      PostModel.countDocuments({}),
      CommentModel.countDocuments({}),
      StoryModel.countDocuments({ expiresAt: { $gt: new Date() } }),
      NotificationModel.countDocuments({}),
    ]);

    successResponse({
      res,
      data: {
        users,
        posts,
        comments,
        activeStories: stories,
        notificationDeliveries: notifications,
      },
    });
  };
}

export default new DashboardService();

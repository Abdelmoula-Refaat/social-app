import { Router } from "express";
import CommentService from "./comment.service";
import { authentication } from "../../common/middleware/authentication";
import { validation } from "../../common/middleware/validation";
import * as commentValidation from "./comment.vaildation";

const commentRouter = Router({ mergeParams: true });

commentRouter.get("/", authentication, CommentService.listComments);
commentRouter.post(
  "/",
  authentication,
  validation(commentValidation.createCommentSchema),
  CommentService.createComment,
);
commentRouter.patch(
  "/:commentId",
  authentication,
  validation(commentValidation.updateCommentSchema),
  CommentService.updateComment,
);
commentRouter.delete("/:commentId", authentication, CommentService.deleteComment);
commentRouter.patch(
  "/:commentId/reaction",
  authentication,
  validation(commentValidation.commentReactionSchema),
  CommentService.setCommentReaction,
);

export default commentRouter;

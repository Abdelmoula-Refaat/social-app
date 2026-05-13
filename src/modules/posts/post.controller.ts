import { Router } from "express";
import PostService from "./post.service";
import * as postValidation from "./post.vaildation";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import { validation } from "../../common/middleware/validation";
import commentRouter from "../comments/comment.controller";

const postRouter = Router();

postRouter.get(
  "/feed",
  authentication,
  PostService.getFeed,
);

postRouter.get(
  "/profile/:userId",
  authentication,
  PostService.getProfilePosts,
);

postRouter.use("/:postId/comments", commentRouter);

postRouter.get( "/",
    authentication,
    PostService.getPosts);

postRouter.get(
  "/:postId",
  authentication,
  PostService.getPostById,
);

postRouter.delete(
  "/:postId",
  authentication,
  validation(postValidation.deletePostSchema),
  PostService.deletePost,
);

postRouter.patch(
  "/:postId/reaction",
  authentication,
  validation(postValidation.postReactionSchema),
  PostService.setPostReaction,
);

postRouter.put( "/update/:postId",
    authentication,
    multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
    validation(postValidation.updatePostSchema),
    PostService.updatePost);

postRouter.post( "/",
    authentication,
    multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
    validation(postValidation.createPostSchema),
    PostService.createPost);

postRouter.patch( "/:postId",
    authentication,
    validation(postValidation.likePostSchema),
    PostService.likePost);

export default postRouter;

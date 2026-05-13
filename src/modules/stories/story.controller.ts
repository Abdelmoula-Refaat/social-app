import { Router } from "express";
import StoryService from "./story.service";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import { validation } from "../../common/middleware/validation";
import * as storyValidation from "./story.vaildation";

const storyRouter = Router();

storyRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  StoryService.createStory,
);

storyRouter.get("/me", authentication, StoryService.listMine);
storyRouter.get("/feed", authentication, StoryService.feed);

storyRouter.delete(
  "/:storyId",
  authentication,
  validation(storyValidation.storyIdParams),
  StoryService.deleteStory,
);

export default storyRouter;

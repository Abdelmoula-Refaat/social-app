import { Router } from "express";
import { authentication } from "../../common/middleware/authentication";
import { validation } from "../../common/middleware/validation";
import usersService from "./users.service";
import * as usersValidation from "./users.vaildation";

const usersRouter = Router();

usersRouter.get(
  "/:userId",
  authentication,
  validation(usersValidation.publicUserParams),
  usersService.publicProfile,
);

export default usersRouter;

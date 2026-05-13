import * as z from "zod";
import { GeneralRules } from "../../common/utils/generalRules";

export const createStorySchema = {
  body: z.strictObject({}).optional(),
};

export const storyIdParams = {
  params: z.strictObject({
    storyId: GeneralRules.id,
  }),
};

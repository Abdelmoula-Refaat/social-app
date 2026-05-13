import * as z from "zod";
import { GeneralRules } from "../../common/utils/generalRules";

export const publicUserParams = {
  params: z.strictObject({
    userId: GeneralRules.id,
  }),
};

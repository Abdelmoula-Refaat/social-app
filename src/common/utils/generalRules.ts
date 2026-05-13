import { Types } from "mongoose";
import * as z from "zod";


export const GeneralRules = {
    id: z.string().refine((value) => Types.ObjectId.isValid(value)
    , {
         message: "Invalid ID" 
    }),

    file: z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string(),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number()
    })
}
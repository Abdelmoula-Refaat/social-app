import { Response } from "express";

export const successResponse = (
    {
        res,
        status = 200,
        message = "done",
        data = undefined
    }: {
        res: Response,
        status?: number,
        message?: string,
        data?: any | undefined,
    }) => {
    return res.status(status).json({ message, data });
}
 




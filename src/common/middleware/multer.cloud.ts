import multer from "multer";
import { tmpdir } from "node:os";
import { Request } from "express";
import { multer_enum, Store_Enum } from "../enum/multer.enum";
import { AppError } from "../utils/global-error-handler";


export const multerCloud = ({
    store_type = Store_Enum.memory,
    custom_types = multer_enum.image,
    max_file_size = 5 * 1024 * 1024 ,
    
}: {
    store_type?: Store_Enum;
    custom_types?: string[];
    max_file_size?: number;
} = {}) => {
   const storage = store_type === Store_Enum.memory ? multer.memoryStorage() : multer.diskStorage({
    destination: tmpdir(),
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + "__" + file.originalname);
    }
   })

    const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
        if(!custom_types.includes(file.mimetype)){
            cb(new AppError ("Invalid file type"));
        }else{
            cb(null, true);
        }
    }

    const upload = multer({ storage, fileFilter, limits: { fileSize: max_file_size } });

    return upload;

}

export default multerCloud;
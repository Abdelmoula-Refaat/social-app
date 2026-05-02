import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service";

export const checkConnectionDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Database connected successfully ${MONGO_URI}`);
    } catch (error) {
        console.error(error);
    }
};

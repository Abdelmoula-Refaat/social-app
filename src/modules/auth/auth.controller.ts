import { Router } from "express";
import AuthService from "./auth.service";
import { validation } from "../../common/middleware/validation";
import * as authValidation from "./auth.vaildation";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";

const authRouter = Router();

authRouter.post( /signup/, validation(authValidation.signupSchema), AuthService.signup,);
authRouter.post("/signup/gmail/", AuthService.signUpWithGmail);
authRouter.patch( /confirm-email/, validation(authValidation.confirmEmailSchema), AuthService.confirmEmail, );
authRouter.patch( /resent-otp/, validation(authValidation.reSendOtpSchema), AuthService.resendOtp, );
authRouter.post( /forget-password/, validation(authValidation.forgetPasswordSchema), AuthService.forgetPassword, );
authRouter.patch( /reset-password/, validation(authValidation.resetPasswordSchema), AuthService.resetPassword, );
authRouter.post( /signin/, validation(authValidation.signinSchema), AuthService.signin, );
authRouter.get(/profile/, authentication, AuthService.getProfile);
authRouter.post("/upload",
    authentication,
    // multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
    AuthService.uploadImage);

export default authRouter;

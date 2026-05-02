import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../../../config/config.service";
import Mail from "nodemailer/lib/mailer";


export const sendEmail = async (mailOptions: Mail.Options) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `Social App <${EMAIL}>`,      
        ...mailOptions
    });

    console.log("Message sent", info.messageId);
    return info.accepted.length ? true : false;

}

export const generateOtp = async () => {
    return Math.floor(Math.random() * 900000 + 100000);
}
    
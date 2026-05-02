export const emailTemplate = (otp: number) => {
    return `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <h2 style="color: #333;">Email Confirmation</h2>
            <p style="color: #555;">Thank you for registering. Please use the following OTP to confirm your email address:</p>
            <div style="background-color: #fff; padding: 10px; border-radius: 5px; display: inline-block;">
                <h1 style="color: #007BFF; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #555;">This OTP is valid for 10 minutes.</p>
        </div>
    `;
}
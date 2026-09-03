// External dependencies
import nodemailer from 'nodemailer';

// Internal dependencies
import secrets from '../config/secrets';

export const sendEmail = (options: { message: string; subject: string; email: string }) => {
    const transporter = nodemailer.createTransport({
        host: secrets.email.EMAIL_HOST,
        port: secrets.email.EMAIL_PORT,
        auth: {
            user: secrets.email.EMAIL_USERNAME,
            pass: secrets.email.EMAIL_USERPASSWORD,
        },
    });

    const mailOptions = {
        from: `PrismBill <${secrets.email.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    transporter.sendMail(mailOptions);
};

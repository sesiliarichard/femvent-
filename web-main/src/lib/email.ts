import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
    html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const mailOptions = {
            from: `"${process.env.APP_NAME || 'FemVents'}" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.body,
            html: options.html || options.body.replace(/\n/g, '<br>'),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email error:', error);
        return false;
    }
}
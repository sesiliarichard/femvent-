import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
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

/**
 * Send an email using Gmail SMTP
 */
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

/**
 * Send bulk emails
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<{
    success: number;
    failed: number;
    results: Array<{ email: string; success: boolean; error?: any }>;
}> {
    const results = await Promise.all(
        emails.map(async (emailOptions) => {
            try {
                await sendEmail(emailOptions);
                return { email: emailOptions.to, success: true };
            } catch (error) {
                return { email: emailOptions.to, success: false, error };
            }
        })
    );

    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return { success, failed, results };
}

import * as nodemailer from 'nodemailer';
import * as functions from 'firebase-functions';

// Email configuration interface
export interface EmailConfig {
    user: string;
    password: string;
    from: string;
}

// Get email configuration from environment variables
const getEmailConfig = (): EmailConfig => {
    const config = functions.config();

    return {
        user: config.email?.user || process.env.EMAIL_USER || '',
        password: config.email?.password || process.env.EMAIL_PASSWORD || '',
        from: config.email?.from || process.env.EMAIL_FROM || 'KUZA Events <noreply@kuzaevents.com>',
    };
};

// Create nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

const createTransporter = (): nodemailer.Transporter => {
    if (transporter) {
        return transporter;
    }

    const config = getEmailConfig();

    // Validate configuration
    if (!config.user || !config.password) {
        throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD.');
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.user,
            pass: config.password,
        },
    });

    return transporter;
};

// Email sending options
export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        encoding?: string;
    }>;
}

/**
 * Send an email using Nodemailer
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
    try {
        const config = getEmailConfig();
        const transport = createTransporter();

        const mailOptions = {
            from: config.from,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || stripHtml(options.html),
            attachments: options.attachments,
        };

        const info = await transport.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        console.log('Recipients:', options.to);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Simple HTML to text converter
 */
const stripHtml = (html: string): string => {
    return html
        .replace(/<style[^>]*>.*<\/style>/gm, '')
        .replace(/<script[^>]*>.*<\/script>/gm, '')
        .replace(/<[^>]+>/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
    try {
        const transport = createTransporter();
        await transport.verify();
        console.log('Email configuration is valid');
        return true;
    } catch (error) {
        console.error('Email configuration verification failed:', error);
        return false;
    }
};

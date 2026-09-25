import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
        cid?: string;
    }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const { data, error } = await resend.emails.send({
            from: `${process.env.APP_NAME || 'FemVents'} <notifications@femvents.core23lab.org>`,
            to: options.to,
            subject: options.subject,
            text: options.body,
            html: options.html || options.body.replace(/\n/g, '<br>'),
            attachments: options.attachments?.map((a) => ({
                filename: a.filename,
                content: a.content,
            })),
        });

        if (error) {
            console.error('❌ Email error:', error);
            return false;
        }

        console.log('✅ Email sent:', data?.id);
        return true;
    } catch (error) {
        console.error('❌ Email error:', error);
        return false;
    }
}
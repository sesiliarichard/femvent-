import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../lib/email';
import { getTemplate, EmailTemplateData } from '../../lib/emailTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, body, templateId, templateData } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
        }

        let htmlContent: string | undefined;

        // If a template ID is provided, use that template
        if (templateId && templateId !== 'none') {
            const template = getTemplate(templateId);
            if (template) {
                const data: EmailTemplateData = {
                    recipientName: templateData?.recipientName || 'there',
                    eventTitle: templateData?.eventTitle || '',
                    eventDate: templateData?.eventDate || '',
                    eventTime: templateData?.eventTime,
                    eventLocation: templateData?.eventLocation,
                    customMessage: body,
                    organizerName: templateData?.organizerName,
                    ...templateData,
                };
                htmlContent = template.html(data);
            }
        }

        const success = await sendEmail({
            to,
            subject,
            body,
            html: htmlContent,
        });

        if (success) {
            return res.status(200).json({ success: true, message: 'Email sent successfully' });
        } else {
            return res.status(500).json({ success: false, error: 'Failed to send email' });
        }
    } catch (error: any) {
        console.error('Email API error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to send email' });
    }
}

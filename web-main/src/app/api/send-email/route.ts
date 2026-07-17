import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getTemplate, EmailTemplateData } from '@/lib/emailTemplates';

export async function POST(req: NextRequest) {
    try {
        const { to, templateId, templateData } = await req.json();

        if (!to || !templateId) {
            return NextResponse.json(
                { error: 'Missing required fields: to, templateId' },
                { status: 400 }
            );
        }

        const template = getTemplate(templateId);
        if (!template) {
            return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
        }

        const data: EmailTemplateData = {
            recipientName: templateData?.recipientName || 'there',
            eventTitle: templateData?.eventTitle || '',
            eventDate: templateData?.eventDate || '',
            ...templateData,
        };

        const success = await sendEmail({
            to,
            subject: template.subject.replace('{{eventTitle}}', data.eventTitle),
            body: `You're registered for ${data.eventTitle}`,
            html: template.html(data),
        });

        if (!success) {
            return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getTemplate, EmailTemplateData } from '@/lib/emailTemplates';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

async function generateQrPng(payload: object): Promise<Buffer> {
    return QRCode.toBuffer(JSON.stringify(payload), {
        type: 'png',
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
    });
}

async function generateTicketPdf(
    data: EmailTemplateData & { ticketId?: string },
    qrPng: Buffer
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [400, 600], margin: 0 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header band
        doc.rect(0, 0, 400, 90).fill('#667eea');
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold');
        doc.text('FemVents Ticket', 0, 32, { align: 'center', width: 400 });

        // Body
        doc.fillColor('#111111').fontSize(20).font('Helvetica-Bold');
        doc.text(data.eventTitle || 'Event', 30, 120, { width: 340 });

        doc.fillColor('#444444').fontSize(12).font('Helvetica');
        let y = 160;
        doc.text(`Attendee: ${data.recipientName}`, 30, y); y += 20;
        doc.text(`Date: ${data.eventDate}`, 30, y); y += 20;
        if (data.eventLocation) { doc.text(`Location: ${data.eventLocation}`, 30, y); y += 20; }
        if (data.ticketType) { doc.text(`Ticket type: ${data.ticketType}`, 30, y); y += 20; }
        if (data.ticketId) { doc.text(`Ticket ID: ${data.ticketId}`, 30, y); y += 20; }

        // QR code
        doc.image(qrPng, 100, y + 20, { width: 200, height: 200 });

        doc.fontSize(10).fillColor('#888888');
        doc.text('Present this QR code at check-in.', 0, y + 240, { align: 'center', width: 400 });

        doc.end();
    });
}

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

        const data: EmailTemplateData & {
            ticketId?: string;
            eventId?: string;
            userId?: string;
            qrCodeId?: string;
        } = {
            recipientName: templateData?.recipientName || 'there',
            eventTitle: templateData?.eventTitle || '',
            eventDate: templateData?.eventDate || '',
            ...templateData,
        };

        let attachments: any[] | undefined;
        let htmlBody = template.html(data);

        // Only build ticket QR/PDF when we have enough ticket info (registration confirmations)
        if (templateId === 'registration-confirmation' && data.ticketId) {
            const qrPng = await generateQrPng({
                ticketId: data.ticketId,
                eventId: data.eventId,
                userId: data.userId,
                qrCodeId: data.qrCodeId || `qr_${data.ticketId}`,
                timestamp: Date.now(),
            });

            const pdfBuffer = await generateTicketPdf(data, qrPng);

            attachments = [
                {
                    filename: 'ticket-qr.png',
                    content: qrPng,
                    contentType: 'image/png',
                    cid: 'ticketqr', // referenced in the email HTML as cid:ticketqr
                },
                {
                    filename: 'femvents-ticket.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ];

            // Inject the inline QR image into the email body, right after the event card
            htmlBody = htmlBody.replace(
                '</div>\n\n      <p><strong>To see your QR ticket',
                `</div>

      <center>
        <img src="cid:ticketqr" alt="Your ticket QR code" style="width:220px;height:220px;margin:20px 0;border:1px solid #eee;border-radius:8px;" />
      </center>

      <p><strong>To see your QR ticket`
            );
        }

        const success = await sendEmail({
            to,
            subject: template.subject.replace('{{eventTitle}}', data.eventTitle),
            body: `You're registered for ${data.eventTitle}`,
            html: htmlBody,
            attachments,
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
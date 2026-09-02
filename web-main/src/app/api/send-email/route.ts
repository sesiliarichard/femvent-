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
        const W = 420;
        const H = 680;
        const doc = new PDFDocument({ size: [W, H], margin: 0 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pad = 32;
        const stubTop = H - 300; // where the perforated divider sits

        // ---- Outer card background ----
        doc.roundedRect(10, 10, W - 20, H - 20, 18).fill('#ffffff');
        doc.roundedRect(10, 10, W - 20, H - 20, 18).lineWidth(1).stroke('#e5e7eb');

        // ---- Header gradient band ----
        const grad = doc.linearGradient(10, 10, W - 10, 150);
        grad.stop(0, '#0099ff').stop(1, '#764ba2');
        doc.save();
        doc.roundedRect(10, 10, W - 20, 150, 18).clip();
        doc.rect(10, 10, W - 20, 150).fill(grad);
        doc.restore();

        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
        doc.text('E - T I C K E T', pad, 36, { characterSpacing: 2 });
        doc.fontSize(26);
        doc.text('FemVents', pad, 56);
        doc.font('Helvetica').fontSize(11).fillColor('#e8ecff');
        doc.text('Experiences engineered for bold communities', pad, 92);

        // Status pill
        doc.roundedRect(W - 150, 36, 100, 26, 13).fill('#ffffff');
        doc.fillColor('#0099ff').font('Helvetica-Bold').fontSize(10);
        doc.text('CONFIRMED', W - 150, 44, { width: 100, align: 'center' });

        // ---- Event title ----
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(22);
        doc.text(data.eventTitle || 'Event', pad, 175, { width: W - pad * 2 });

        // ---- Detail rows ----
        const rows: Array<[string, string]> = [
            ['ATTENDEE', data.recipientName || ''],
            ['DATE', data.eventDate || ''],
        ];
        if (data.eventLocation) rows.push(['LOCATION', data.eventLocation]);
        if (data.ticketType) rows.push(['TICKET TYPE', data.ticketType]);

        let y = 225;
        for (const [label, value] of rows) {
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#94a3b8');
            doc.text(label, pad, y, { characterSpacing: 1 });
            doc.font('Helvetica').fontSize(13).fillColor('#1e293b');
            doc.text(value, pad, y + 13);
            y += 44;
        }

        // ---- Perforated divider ----
        doc.save();
        doc.circle(10, stubTop, 12).fill('#f4f4f7');
        doc.circle(W - 10, stubTop, 12).fill('#f4f4f7');
        doc.restore();

        doc.dash(4, { space: 4 });
        doc.moveTo(30, stubTop).lineTo(W - 30, stubTop).lineWidth(1.2).stroke('#cbd5e1');
        doc.undash();

        // ---- Stub section (QR) ----
        const qrSize = 190;
        const qrX = (W - qrSize) / 2;
        const qrY = stubTop + 30;

        doc.roundedRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 16).fill('#f8fafc');
        doc.image(qrPng, qrX, qrY, { width: qrSize, height: qrSize });

        doc.font('Helvetica').fontSize(9).fillColor('#94a3b8');
        doc.text('SCAN AT CHECK-IN', 0, qrY + qrSize + 22, { align: 'center', width: W, characterSpacing: 1 });

        if (data.ticketId) {
            doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1');
            doc.text(`Ticket ID: ${data.ticketId}`, 0, H - 30, { align: 'center', width: W });
        }

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
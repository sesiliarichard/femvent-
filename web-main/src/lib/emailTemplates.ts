export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    html: (data: EmailTemplateData) => string;
}

export interface EmailTemplateData {
    recipientName: string;
    eventTitle: string;
    eventDate: string;
    eventTime?: string;
    eventLocation?: string;
    ticketType?: string;
    customMessage?: string;
    actionUrl?: string;
    actionText?: string;
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FemVents</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
    .content { padding: 30px 20px; }
    .greeting { font-size: 18px; margin-bottom: 20px; color: #333; }
    .event-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .event-title { font-size: 22px; font-weight: 700; color: #667eea; margin: 0 0 10px 0; }
    .event-detail { margin: 8px 0; }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .steps { margin: 20px 0; padding-left: 0; list-style: none; }
    .steps li { margin: 10px 0; padding-left: 28px; position: relative; }
    .steps li:before {
      content: attr(data-step);
      position: absolute; left: 0; top: 0;
      width: 20px; height: 20px; border-radius: 50%;
      background: #667eea; color: white;
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .footer {
      background: #f8f9fa; padding: 20px; text-align: center;
      font-size: 14px; color: #666; border-top: 1px solid #e9ecef;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} FemVents — Experiences engineered for bold communities</p>
    </div>
  </div>
</body>
</html>
`;

export const registrationConfirmationTemplate: EmailTemplate = {
    id: 'registration-confirmation',
    name: 'Registration Confirmation',
    subject: "You're registered for {{eventTitle}}!",
    html: (data) => baseTemplate(`
    <div class="header">
      <h1>✅ You're Registered!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.recipientName},</p>
      <p>Your registration is confirmed. Here are your details:</p>

      <div class="event-card">
        <h2 class="event-title">${data.eventTitle}</h2>
        <div class="event-detail">📅 <strong>Date:</strong> ${data.eventDate}</div>
        ${data.eventLocation ? `<div class="event-detail">📍 <strong>Location:</strong> ${data.eventLocation}</div>` : ''}
        ${data.ticketType ? `<div class="event-detail">🎫 <strong>Ticket:</strong> ${data.ticketType}</div>` : ''}
      </div>

      <p><strong>To see your QR ticket and event details:</strong></p>
      <ol class="steps">
        <li data-step="1">Open the FemVents app</li>
        <li data-step="2">Log in with this same email — no need to create a new account</li>
        <li data-step="3">Your registered event will be waiting for you</li>
      </ol>

      ${data.actionUrl ? `
        <center>
          <a href="${data.actionUrl}" class="cta-button">${data.actionText || 'Open FemVents'}</a>
        </center>
      ` : ''}

      <p>See you there!</p>
      <p>— The FemVents Team</p>
    </div>
  `),
};

export const emailTemplates: EmailTemplate[] = [registrationConfirmationTemplate];

export function getTemplate(templateId: string): EmailTemplate | undefined {
    return emailTemplates.find((t) => t.id === templateId);
}
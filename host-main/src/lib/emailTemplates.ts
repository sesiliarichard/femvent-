/**
 * Email Templates with HTML formatting
 */

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
    eventDescription?: string;
    organizerName?: string;
    ticketType?: string;
    customMessage?: string;
    actionUrl?: string;
    actionText?: string;
}

// Base HTML template wrapper with styling
const baseTemplate = (content: string, footer?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from Hostdweb</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .event-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .event-title {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin: 0 0 10px 0;
    }
    .event-detail {
      margin: 8px 0;
      display: flex;
      align-items: center;
    }
    .event-detail svg {
      margin-right: 10px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #667eea, transparent);
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
    ${footer || `
      <div class="footer">
        <p>© ${new Date().getFullYear()} Hostdweb Events - Professional Event Management</p>
        <p style="font-size: 12px; color: #999;">You received this email because you registered for an event on our platform.</p>
      </div>
    `}
  </div>
</body>
</html>
`;

// Template 1: Event Reminder
export const eventReminderTemplate: EmailTemplate = {
    id: 'event-reminder',
    name: 'Event Reminder',
    subject: '🎉 Reminder: {{eventTitle}} is coming up!',
    html: (data) => baseTemplate(`
    <div class="header">
      <h1>📅 Event Reminder</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.recipientName},</p>
      <p>This is a friendly reminder about your upcoming event!</p>
      
      <div class="event-card">
        <h2 class="event-title">${data.eventTitle}</h2>
        <div class="event-detail">📅 <strong>Date:</strong> ${data.eventDate}</div>
        ${data.eventTime ? `<div class="event-detail">🕐 <strong>Time:</strong> ${data.eventTime}</div>` : ''}
        ${data.eventLocation ? `<div class="event-detail">📍 <strong>Location:</strong> ${data.eventLocation}</div>` : ''}
        ${data.ticketType ? `<div class="event-detail">🎫 <strong>Ticket:</strong> ${data.ticketType}</div>` : ''}
      </div>

      ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
      
      ${data.actionUrl ? `
        <center>
          <a href="${data.actionUrl}" class="cta-button">${data.actionText || 'View Event Details'}</a>
        </center>
      ` : ''}
      
      <p>We look forward to seeing you there!</p>
      <p>Best regards,<br><strong>${data.organizerName || 'The Hostdweb Team'}</strong></p>
    </div>
  `),
};

// Template 2: Event Update
export const eventUpdateTemplate: EmailTemplate = {
    id: 'event-update',
    name: 'Event Update',
    subject: '📢 Important Update: {{eventTitle}}',
    html: (data) => baseTemplate(`
    <div class="header">
      <h1>📢 Event Update</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${data.recipientName},</p>
      <p>We have an important update regarding <strong>${data.eventTitle}</strong>.</p>
      
      <div class="event-card">
        <h2 class="event-title">${data.eventTitle}</h2>
        ${data.customMessage ? `
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <strong>Update:</strong><br>${data.customMessage}
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="event-detail">📅 <strong>Date:</strong> ${data.eventDate}</div>
        ${data.eventLocation ? `<div class="event-detail">📍 <strong>Location:</strong> ${data.eventLocation}</div>` : ''}
      </div>

      ${data.actionUrl ? `
        <center>
          <a href="${data.actionUrl}" class="cta-button">${data.actionText || 'View Full Details'}</a>
        </center>
      ` : ''}
      
      <p>If you have any questions, please don't hesitate to reach out.</p>
      <p>Thank you for your understanding,<br><strong>${data.organizerName || 'The Hostdweb Team'}</strong></p>
    </div>
  `),
};

// Template 3: Thank You
export const thankYouTemplate: EmailTemplate = {
    id: 'thank-you',
    name: 'Thank You',
    subject: '🙏 Thank you for attending {{eventTitle}}!',
    html: (data) => baseTemplate(`
    <div class="header">
      <h1>🙏 Thank You!</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear ${data.recipientName},</p>
      <p>Thank you for attending <strong>${data.eventTitle}</strong>! We hope you had a wonderful experience.</p>
      
      <div class="event-card">
        <h2 class="event-title">${data.eventTitle}</h2>
        <p style="font-size: 16px; margin: 15px 0;">${data.customMessage || 'Your participation made this event special. We appreciate you being part of our community!'}</p>
      </div>

      ${data.actionUrl ? `
        <p>We'd love to hear your feedback:</p>
        <center>
          <a href="${data.actionUrl}" class="cta-button">${data.actionText || 'Share Your Feedback'}</a>
        </center>
      ` : ''}
      
      <p>We hope to see you at future events!</p>
      <p>With gratitude,<br><strong>${data.organizerName || 'The Hostdweb Team'}</strong></p>
    </div>
  `),
};

// Template 4: Custom Announcement
export const customAnnouncementTemplate: EmailTemplate = {
    id: 'custom-announcement',
    name: 'Custom Announcement',
    subject: '{{subject}}',
    html: (data) => baseTemplate(`
    <div class="header">
      <h1>📣 Announcement</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.recipientName},</p>
      
      ${data.customMessage ? `<div style="font-size: 16px; line-height: 1.8;">${data.customMessage.replace(/\n/g, '<br>')}</div>` : ''}
      
      ${data.eventTitle ? `
        <div class="divider"></div>
        <div class="event-card">
          <h2 class="event-title">${data.eventTitle}</h2>
          ${data.eventDate ? `<div class="event-detail">📅 ${data.eventDate}</div>` : ''}
          ${data.eventLocation ? `<div class="event-detail">📍 ${data.eventLocation}</div>` : ''}
        </div>
      ` : ''}

      ${data.actionUrl ? `
        <center>
          <a href="${data.actionUrl}" class="cta-button">${data.actionText || 'Learn More'}</a>
        </center>
      ` : ''}
      
      <p>Best regards,<br><strong>${data.organizerName || 'The Hostdweb Team'}</strong></p>
    </div>
  `),
};

// Export all templates
export const emailTemplates: EmailTemplate[] = [
    eventReminderTemplate,
    eventUpdateTemplate,
    thankYouTemplate,
    customAnnouncementTemplate,
];

// Helper function to get template by ID
export function getTemplate(templateId: string): EmailTemplate | undefined {
    return emailTemplates.find(t => t.id === templateId);
}

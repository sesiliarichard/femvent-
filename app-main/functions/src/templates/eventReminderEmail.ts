export interface EventReminderEmailData {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventImageUrl?: string;
    hoursUntilEvent: number;
}

export const generateEventReminderEmail = (data: EventReminderEmailData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 48px;">⏰</span>
                </div>
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                  Event Starting Soon!
                </h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                  Your event is in ${data.hoursUntilEvent} hours
                </p>
              </div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                Hi ${data.userName}! ⏳
              </p>
              
              <p style="margin: 0 0 25px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder that <strong>${data.eventTitle}</strong> is coming up in ${data.hoursUntilEvent} hours. Get ready for an amazing experience!
              </p>

              ${data.eventImageUrl ? `
              <div style="margin: 25px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <img src="${data.eventImageUrl}" alt="${data.eventTitle}" style="width: 100%; height: auto; display: block;" />
              </div>
              ` : ''}

              <!-- Event Quick Info -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #fbbf24;">
                <h2 style="margin: 0 0 15px; color: #78350f; font-size: 18px; font-weight: 700; text-align: center;">
                  📍 Event Details
                </h2>
                <div style="text-align: center;">
                  <div style="margin: 10px 0;">
                    <span style="color: #92400e; font-size: 14px; display: block; margin-bottom: 4px;">When</span>
                    <span style="color: #78350f; font-size: 18px; font-weight: 700; display: block;">${data.eventDate}</span>
                    <span style="color: #92400e; font-size: 16px; display: block; margin-top: 2px;">${data.eventTime}</span>
                  </div>
                  <div style="margin: 15px 0;">
                    <span style="color: #92400e; font-size: 14px; display: block; margin-bottom: 4px;">Where</span>
                    <span style="color: #78350f; font-size: 16px; font-weight: 600; display: block;">${data.eventLocation}</span>
                  </div>
                </div>
              </div>

              <!-- Checklist -->
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 16px; font-weight: 700;">
                  ✅ Before You Go
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                  <li>Have your ticket QR code ready in the app</li>
                  <li>Plan to arrive 15-30 minutes early</li>
                  <li>Check the weather and dress accordingly</li>
                  <li>Bring a valid ID if required</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); margin: 0 5px 10px;">
                  🎫 View My Ticket
                </a>
                <a href="#" style="display: inline-block; background: white; color: #667eea; border: 2px solid #667eea; text-decoration: none; padding: 14px 38px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 0 5px 10px;">
                  📍 Get Directions
                </a>
              </div>

              <div style="text-align: center; background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 5px; font-size: 24px;">🎉</p>
                <p style="margin: 0; color: #166534; font-size: 15px; font-weight: 600;">
                  We can't wait to see you there!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <div style="background: #f7fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                  Questions? <a href="mailto:support@kuzaevents.com" style="color: #667eea; text-decoration: none;">Contact Support</a>
                </p>
                <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                  © ${new Date().getFullYear()} KUZA Events. All rights reserved.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

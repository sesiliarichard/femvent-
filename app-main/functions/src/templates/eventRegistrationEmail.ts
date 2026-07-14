export interface EventRegistrationEmailData {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventImageUrl?: string;
    ticketStatus: string;
}

export const generateEventRegistrationEmail = (data: EventRegistrationEmailData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 48px;">✅</span>
                </div>
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                  Registration Confirmed!
                </h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                  You're all set for this amazing event
                </p>
              </div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                Hi ${data.userName}! 🎊
              </p>
              
              <p style="margin: 0 0 25px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Great news! Your registration for <strong>${data.eventTitle}</strong> has been confirmed. We can't wait to see you there!
              </p>

              ${data.eventImageUrl ? `
              <div style="margin: 25px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <img src="${data.eventImageUrl}" alt="${data.eventTitle}" style="width: 100%; height: auto; display: block;" />
              </div>
              ` : ''}

              <!-- Event Details Card -->
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0;">
                <h2 style="margin: 0 0 20px; color: #2d3748; font-size: 20px; font-weight: 700;">
                  📅 Event Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 20px; margin-right: 12px;">🎪</span>
                        <div>
                          <div style="color: #718096; font-size: 13px; margin-bottom: 4px;">Event</div>
                          <div style="color: #2d3748; font-size: 16px; font-weight: 600;">${data.eventTitle}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 20px; margin-right: 12px;">📆</span>
                        <div>
                          <div style="color: #718096; font-size: 13px; margin-bottom: 4px;">Date & Time</div>
                          <div style="color: #2d3748; font-size: 16px; font-weight: 600;">${data.eventDate}</div>
                          <div style="color: #4a5568; font-size: 14px; margin-top: 2px;">${data.eventTime}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 20px; margin-right: 12px;">📍</span>
                        <div>
                          <div style="color: #718096; font-size: 13px; margin-bottom: 4px;">Location</div>
                          <div style="color: #2d3748; font-size: 16px; font-weight: 600;">${data.eventLocation}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 20px; margin-right: 12px;">🎫</span>
                        <div>
                          <div style="color: #718096; font-size: 13px; margin-bottom: 4px;">Ticket Status</div>
                          <div>
                            <span style="display: inline-block; background: ${data.ticketStatus === 'confirmed' ? '#10b981' : '#f59e0b'}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: capitalize;">
                              ${data.ticketStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <div style="background: #fefce8; border-left: 4px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 12px; color: #78350f; font-size: 16px; font-weight: 700;">
                  📱 Next Steps
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
                  <li>Check your KUZA Events app for your digital ticket</li>
                  <li>You'll receive your ticket with a QR code once payment is confirmed</li>
                  <li>We'll send you a reminder 24 hours before the event</li>
                  <li>Present your QR code at the event entrance</li>
                </ol>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  📲 View Ticket in App
                </a>
              </div>

              <div style="text-align: center; margin: 25px 0 0;">
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Have questions? <a href="mailto:support@kuzaevents.com" style="color: #667eea; text-decoration: none; font-weight: 600;">Contact Support</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <div style="background: #f7fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
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

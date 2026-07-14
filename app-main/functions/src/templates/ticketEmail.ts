export interface TicketEmailData {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    ticketId: string;
    qrCodeDataUrl: string; // Base64 encoded QR code image
}

export const generateTicketEmail = (data: TicketEmailData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Ticket</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 35px 30px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                  🎫 Your Ticket is Ready!
                </h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                  You're confirmed for this event
                </p>
              </div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                Hi ${data.userName}! 🎉
              </p>
              
              <p style="margin: 0 0 25px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your payment has been confirmed and your ticket is now ready! Save this email or screenshot your QR code for event entry.
              </p>

              <!-- Ticket Card -->
              <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
                
                <!-- Decorative circles -->
                <div style="position: absolute; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%; top: -50px; right: -50px;"></div>
                <div style="position: absolute; width: 100px; height: 100px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -30px; left: -30px;"></div>
                
                <!-- Ticket content -->
                <div style="position: relative; z-index: 1;">
                  <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="margin: 0 0 8px; color: white; font-size: 22px; font-weight: 700;">
                      ${data.eventTitle}
                    </h2>
                    <div style="color: #94a3b8; font-size: 14px; margin: 5px 0;">
                      📅 ${data.eventDate} • ${data.eventTime}
                    </div>
                    <div style="color: #94a3b8; font-size: 14px;">
                      📍 ${data.eventLocation}
                    </div>
                  </div>

                  <div style="border-top: 2px dashed rgba(255,255,255,0.2); margin: 25px 0; padding-top: 25px;">
                    <!-- QR Code -->
                    <div style="text-align: center; background: white; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 280px;">
                      <img src="${data.qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
                      <div style="margin-top: 15px; color: #64748b; font-size: 13px; font-weight: 600;">
                        Ticket ID: ${data.ticketId}
                      </div>
                    </div>
                  </div>

                  <div style="text-align: center; margin-top: 20px;">
                    <div style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                      ⚡ Present this QR code at event entrance
                    </div>
                  </div>
                </div>
              </div>

              <!-- Important Information -->
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: 700;">
                  ℹ️ Important Information
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                  <li>Keep this email safe or save the QR code to your device</li>
                  <li>Arrive 15-30 minutes before the event starts</li>
                  <li>Your QR code will be scanned at the entrance</li>
                  <li>This ticket is non-transferable</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); margin: 0 5px 10px;">
                  📲 Open in App
                </a>
                <a href="#" style="display: inline-block; background: white; color: #667eea; border: 2px solid #667eea; text-decoration: none; padding: 14px 38px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 0 5px 10px;">
                  📥 Download Ticket
                </a>
              </div>

              <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                  💡 We'll send you a reminder 24 hours before the event!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <div style="background: #f7fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                  Questions about your ticket?
                </p>
                <p style="margin: 0 0 15px;">
                  <a href="mailto:support@kuzaevents.com" style="color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px;">Contact Support</a>
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

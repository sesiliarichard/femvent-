export interface WelcomeEmailData {
    userName: string;
    userEmail: string;
}

export const generateWelcomeEmail = (data: WelcomeEmailData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to KUZA Events</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                  🎉 Welcome to KUZA Events!
                </h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">
                  Your journey to amazing events starts here
                </p>
              </div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                Hi ${data.userName}! 👋
              </p>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join the KUZA Events community! Get ready to discover, register, and attend incredible events right from your mobile device.
              </p>

              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h2 style="margin: 0 0 15px; color: #2d3748; font-size: 18px; font-weight: 600;">
                  ✨ What You Can Do
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.8;">
                  <li>Browse upcoming events in your area</li>
                  <li>Register for events instantly</li>
                  <li>Get your digital tickets with QR codes</li>
                  <li>Connect with other attendees</li>
                  <li>Stay updated with event reminders</li>
                  <li>Apply to become an event host</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Ready to explore? Open your KUZA Events app and start discovering amazing events happening near you!
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                  🚀 Start Exploring Events
                </a>
              </div>

              <div style="border-top: 2px dashed #e2e8f0; margin: 35px 0; padding-top: 25px;">
                <p style="margin: 0 0 15px; color: #2d3748; font-size: 16px; font-weight: 600;">
                  💡 Quick Tip
                </p>
                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6; background: #fefce8; border-left: 4px solid #fbbf24; padding: 15px; border-radius: 4px;">
                  Complete your profile to get personalized event recommendations and connect with like-minded attendees!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                  Need help? We're here for you!
                </p>
                <p style="margin: 0 0 15px; color: #718096; font-size: 14px;">
                  Contact us at <a href="mailto:support@kuzaevents.com" style="color: #667eea; text-decoration: none;">support@kuzaevents.com</a>
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

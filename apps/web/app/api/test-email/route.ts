import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { type, email } = await request.json();

    let result = false;
    let message = '';

    switch (type) {
      case 'invitation':
        result = await emailService.sendTeamInvitation(
          email,
          'Jonathan Maria',
          'developer',
          'https://pokt.ai/accept-invitation?token=test123'
        );
        message = 'Team invitation email sent successfully!';
        break;

      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, 'Jonathan');
        message = 'Welcome email sent successfully!';
        break;

      case 'billing':
        result = await emailService.sendBillingNotification(
          email,
          99.99,
          '2024-03-15'
        );
        message = 'Billing notification email sent successfully!';
        break;

      case 'usage':
        result = await emailService.sendUsageAlert(
          email,
          85000,
          100000
        );
        message = 'Usage alert email sent successfully!';
        break;

      case 'password-reset':
        result = await emailService.sendPasswordReset(
          email,
          'https://pokt.ai/reset-password?token=test123'
        );
        message = 'Password reset email sent successfully!';
        break;

      default:
        result = await emailService.sendEmail({
          to: email,
          subject: 'Test Email from pokt.ai',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Test Email - pokt.ai</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
                .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                .content { padding: 40px 30px; }
                .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">pokt.ai</div>
                  <h1>Test Email Successful! 🎉</h1>
                </div>
                <div class="content">
                  <h2>Hello Jonathan!</h2>
                  <p>This is a test email from the pokt.ai portal to verify that our SendGrid email service is working correctly.</p>
                  
                  <p><strong>Email Service Status:</strong> ✅ Working</p>
                  <p><strong>SendGrid Integration:</strong> ✅ Connected</p>
                  <p><strong>SMTP Configuration:</strong> ✅ Configured</p>
                  
                  <p>You can now use this email service for:</p>
                  <ul>
                    <li>📧 Team member invitations</li>
                    <li>🎉 Welcome emails</li>
                    <li>💳 Billing notifications</li>
                    <li>⚠️ Usage alerts</li>
                    <li>🔐 Password reset emails</li>
                  </ul>
                  
                  <p>All email templates are beautifully designed with pokt.ai branding!</p>
                </div>
                <div class="footer">
                  <p>© 2024 pokt.ai. All rights reserved.</p>
                  <p>This is a test email - SendGrid integration working perfectly!</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        message = 'Test email sent successfully!';
        break;
    }

    if (result) {
      return NextResponse.json({ 
        success: true, 
        message,
        email,
        type 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send email',
        email,
        type 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Email service error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

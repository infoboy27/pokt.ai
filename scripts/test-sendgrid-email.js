#!/usr/bin/env node

/**
 * Test SendGrid Email Service
 * Usage: node scripts/test-sendgrid-email.js [email]
 */

const sgMail = require('@sendgrid/mail');

// Get email from command line or use default
const recipientEmail = process.argv[2] || 'jonathanmaria@gmail.com';

// Try to get API key from environment or use the one from send-documentation-email.js
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@pokt.ai';

console.log('=== SendGrid Email Test ===\n');
console.log(`Recipient: ${recipientEmail}`);
console.log(`From: ${FROM_EMAIL}`);
console.log(`API Key: ${SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
console.log('');

if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'SG.your-sendgrid-api-key') {
  console.error('❌ ERROR: SENDGRID_API_KEY not configured!');
  console.error('Please set SENDGRID_API_KEY environment variable or update the script.');
  process.exit(1);
}

// Set SendGrid API key
sgMail.setApiKey(SENDGRID_API_KEY);

// Create test email
const msg = {
  to: recipientEmail,
  from: {
    email: FROM_EMAIL,
    name: 'pokt.ai Test'
  },
  subject: 'Test Email from pokt.ai - SendGrid Configuration Test',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SendGrid Test Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .success { background: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .info { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">pokt.ai</div>
          <h1>SendGrid Test Email</h1>
        </div>
        <div class="content">
          <div class="success">
            <h2 style="margin-top: 0; color: #16a34a;">✅ Email Service Working!</h2>
            <p>This is a test email to verify that SendGrid is properly configured and working.</p>
          </div>
          
          <div class="info">
            <h3 style="margin-top: 0; color: #0284c7;">Configuration Details:</h3>
            <ul>
              <li><strong>Service:</strong> SendGrid</li>
              <li><strong>From Email:</strong> ${FROM_EMAIL}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p>If you received this email, it means:</p>
          <ul>
            <li>✅ SendGrid API key is valid</li>
            <li>✅ Email service is configured correctly</li>
            <li>✅ Emails can be sent from pokt.ai</li>
          </ul>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} pokt.ai. All rights reserved.</p>
          <p>This is an automated test email.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `SendGrid Test Email\n\nThis is a test email to verify that SendGrid is properly configured and working.\n\nIf you received this email, it means:\n- SendGrid API key is valid\n- Email service is configured correctly\n- Emails can be sent from pokt.ai\n\nTest Time: ${new Date().toLocaleString()}\n\n© ${new Date().getFullYear()} pokt.ai. All rights reserved.`
};

// Send the email
console.log('Sending test email...\n');

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ SUCCESS: Test email sent successfully!');
    console.log(`📧 Email sent to: ${recipientEmail}`);
    console.log(`📅 Sent at: ${new Date().toLocaleString()}`);
    console.log('\nPlease check the recipient inbox (and spam folder).');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ ERROR: Failed to send email\n');
    console.error('Error details:');
    if (error.response) {
      console.error('Status Code:', error.response.statusCode);
      console.error('Response Body:', JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error);
    }
    process.exit(1);
  });

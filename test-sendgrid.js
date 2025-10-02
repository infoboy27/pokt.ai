const nodemailer = require('nodemailer');

// SendGrid configuration
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'apikey',
    pass: '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'
  }
});

// Test email content
const mailOptions = {
  from: 'noreply@pokt.ai',
  to: 'jonathanmaria@gmail.com',
  subject: '🎉 Test Email from pokt.ai - SendGrid Integration Working!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email - pokt.ai</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .logo { 
          font-size: 2.5rem; 
          font-weight: 800; 
          margin-bottom: 10px; 
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
        }
        .content { 
          padding: 40px 30px; 
        }
        .footer { 
          background: #f8fafc; 
          padding: 30px; 
          text-align: center; 
          color: #64748b; 
          font-size: 14px; 
        }
        .success-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          display: inline-block;
          font-weight: 600;
          margin: 20px 0;
        }
        .feature-list {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .feature-list ul {
          margin: 0;
          padding-left: 20px;
        }
        .feature-list li {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">pokt.ai</div>
          <h1>🚀 SendGrid Integration Test</h1>
          <div class="success-badge">✅ Email Service Working Perfectly!</div>
        </div>
        <div class="content">
          <h2>Hello Jonathan! 👋</h2>
          <p>This is a test email from the pokt.ai portal to verify that our SendGrid email service is working correctly.</p>
          
          <div class="feature-list">
            <h3>🎯 What's Working:</h3>
            <ul>
              <li>✅ SendGrid SMTP connection established</li>
              <li>✅ Email templates with pokt.ai branding</li>
              <li>✅ HTML email rendering</li>
              <li>✅ Professional email design</li>
              <li>✅ Responsive email layout</li>
            </ul>
          </div>
          
          <p><strong>Email Service Features Ready:</strong></p>
          <div class="feature-list">
            <ul>
              <li>📧 Team member invitations</li>
              <li>🎉 Welcome emails for new users</li>
              <li>💳 Billing and payment notifications</li>
              <li>⚠️ Usage alerts and limits</li>
              <li>🔐 Password reset emails</li>
              <li>📊 Analytics and reporting emails</li>
            </ul>
          </div>
          
          <p>All email templates are beautifully designed with pokt.ai branding and will provide a professional experience for your users!</p>
          
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Server: smtp.sendgrid.net</li>
            <li>Port: 587 (TLS)</li>
            <li>Authentication: API Key</li>
            <li>Status: ✅ Connected and Working</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2024 pokt.ai. All rights reserved.</p>
          <p>This is a test email - SendGrid integration working perfectly! 🎉</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Test Email from pokt.ai - SendGrid Integration Working!
    
    Hello Jonathan!
    
    This is a test email from the pokt.ai portal to verify that our SendGrid email service is working correctly.
    
    Email Service Features Ready:
    - Team member invitations
    - Welcome emails for new users
    - Billing and payment notifications
    - Usage alerts and limits
    - Password reset emails
    - Analytics and reporting emails
    
    All email templates are beautifully designed with pokt.ai branding!
    
    Configuration Details:
    - Server: smtp.sendgrid.net
    - Port: 587 (TLS)
    - Authentication: API Key
    - Status: Connected and Working
    
    © 2024 pokt.ai. All rights reserved.
    This is a test email - SendGrid integration working perfectly!
  `
};

// Send the email
async function sendTestEmail() {
  try {
    console.log('🚀 Sending test email to jonathanmaria@gmail.com...');
    console.log('📧 Using SendGrid SMTP configuration...');
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('📬 Check jonathanmaria@gmail.com inbox for the email!');
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Run the test
sendTestEmail();

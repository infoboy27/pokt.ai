// Simple email test using fetch API to test SendGrid
const fetch = require('node-fetch');

async function testSendGridEmail() {
  console.log('🚀 Testing SendGrid email service...');
  console.log('📧 Target: jonathanmaria@gmail.com');
  
  const emailData = {
    personalizations: [
      {
        to: [{ email: 'jonathanmaria@gmail.com' }],
        subject: '🎉 Test Email from pokt.ai - SendGrid Integration Working!'
      }
    ],
    from: { email: 'noreply@pokt.ai', name: 'pokt.ai Portal' },
    content: [
      {
        type: 'text/html',
        value: `
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
                    <li>✅ SendGrid API connection established</li>
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
        `
      }
    ]
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('📨 Status:', response.status);
      console.log('📬 Check jonathanmaria@gmail.com inbox for the email!');
    } else {
      const errorText = await response.text();
      console.log('❌ Error sending email:');
      console.log('Status:', response.status);
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run the test
testSendGridEmail();

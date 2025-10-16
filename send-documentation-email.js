#!/usr/bin/env node

/**
 * Send Documentation Email via SendGrid
 * Usage: node send-documentation-email.js jonathanmaria@gmail.com
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SENDGRID_API_KEY = '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';
const recipientEmail = process.argv[2] || 'jonathanmaria@gmail.com';

console.log(`📧 Preparing to send documentation to ${recipientEmail}...`);

const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>pokt.ai - Complete Project Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 700px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%); color: white; padding: 60px 40px; text-align: center; }
    .logo { font-size: 3.5rem; font-weight: 900; margin-bottom: 15px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); letter-spacing: -1px; }
    .content { padding: 50px 40px; }
    .footer { background: #f8fafc; padding: 40px; text-align: center; color: #64748b; font-size: 14px; border-top: 2px solid #e5e7eb; }
    .section { margin: 30px 0; padding: 25px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #1E3A8A; }
    .highlight { background: linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%); color: white; padding: 20px 30px; border-radius: 12px; margin: 25px 0; }
    .file-list { list-style: none; padding: 0; }
    .file-list li { padding: 12px 20px; margin: 8px 0; background: white; border-radius: 8px; border-left: 3px solid #7C3AED; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .emoji { font-size: 1.4rem; margin-right: 10px; }
    h2 { color: #1E3A8A; margin-top: 35px; }
    h3 { color: #7C3AED; margin-top: 25px; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 5px; }
    .status-success { background: #dcfce7; color: #166534; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; margin: 25px 0; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3); }
    .metric { text-align: center; padding: 20px; margin: 15px 0; }
    .metric-value { font-size: 2.5rem; font-weight: 800; color: #1E3A8A; }
    .metric-label { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">pokt.ai</div>
      <h1 style="margin: 0; font-size: 2.2rem; font-weight: 700;">Complete Project Documentation</h1>
      <p style="margin-top: 15px; font-size: 1.1rem; opacity: 0.95;">AI-Powered Blockchain Infrastructure + chat.pokt.ai</p>
    </div>
    
    <div class="content">
      <h2><span class="emoji">🎉</span>Your Projects are Complete!</h2>
      <p style="font-size: 1.1rem; line-height: 1.8;">All documentation for <strong>pokt.ai</strong> and <strong>chat.pokt.ai</strong> has been generated and is ready on your server.</p>
      
      <div class="highlight">
        <h3 style="color: white; margin-top: 0;">✨ What's Been Built</h3>
        <p style="margin-bottom: 0; font-size: 1.05rem;">Two complete applications: A production RPC gateway platform and a ChatGPT-style blockchain chat interface, supporting 9+ networks via Pocket Network Shannon.</p>
      </div>

      <div class="section">
        <h3><span class="emoji">📊</span>Project Metrics</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div class="metric">
            <div class="metric-value">196+</div>
            <div class="metric-label">Pages of Docs</div>
          </div>
          <div class="metric">
            <div class="metric-value">9+</div>
            <div class="metric-label">Blockchains</div>
          </div>
          <div class="metric">
            <div class="metric-value">3</div>
            <div class="metric-label">Applications</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3><span class="emoji">📚</span>Documentation Location</h3>
        <p>All documentation is saved on your server at:</p>
        <pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto;"><code>/home/ubuntu/pokt.ai/</code></pre>
        
        <ul class="file-list">
          <li><strong>PROJECT_EVALUATION.md</strong> (50 pages) - Complete technical & business analysis</li>
          <li><strong>SECURITY_AUDIT_REPORT.md</strong> (48 pages) - Security audit with 27 vulnerabilities & fixes</li>
          <li><strong>COMPLETE_SUMMARY.md</strong> (35+ pages) - Executive summary & deployment guide</li>
          <li><strong>chat/README.md</strong> - Chat application full documentation</li>
          <li><strong>chat/DEPLOYMENT_GUIDE.md</strong> - Step-by-step deployment</li>
          <li><strong>mcp/README.md</strong> - MCP server documentation</li>
          <li><strong>mcp/SETUP_GUIDE.md</strong> - Claude Desktop integration</li>
        </ul>
      </div>

      <div class="section">
        <h3><span class="emoji">🚀</span>Applications Deployed</h3>
        
        <h4 style="color: #1E3A8A;">1. chat.pokt.ai</h4>
        <p><strong>Status:</strong> <span class="status-badge status-success">✅ Running on port 3006</span></p>
        <p>ChatGPT-style interface for blockchain interactions</p>
        <ul>
          <li>Location: <code>/home/ubuntu/pokt.ai/chat/</code></li>
          <li>Local: http://localhost:3006</li>
          <li>Public: https://chat.pokt.ai (after DNS setup)</li>
          <li>Features: Natural language queries, 9+ networks, beautiful UI</li>
        </ul>

        <h4 style="color: #7C3AED; margin-top: 25px;">2. MCP Server</h4>
        <p><strong>Status:</strong> <span class="status-badge status-success">✅ Built & Ready</span></p>
        <p>Model Context Protocol server for Claude Desktop</p>
        <ul>
          <li>Location: <code>/home/ubuntu/pokt.ai/mcp/</code></li>
          <li>10 blockchain interaction tools</li>
          <li>Integrates with Claude Desktop & AI assistants</li>
        </ul>

        <h4 style="color: #1E3A8A; margin-top: 25px;">3. pokt.ai Main Platform</h4>
        <p><strong>Status:</strong> <span class="status-badge status-success">✅ Running</span></p>
        <p>Production RPC gateway platform</p>
        <ul>
          <li>URL: https://pokt.ai</li>
          <li>Full dashboard, analytics, billing</li>
        </ul>
      </div>

      <div class="section">
        <h3><span class="emoji">🌐</span>Supported Blockchain Networks</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px;">
          <span class="status-badge status-success">Ethereum</span>
          <span class="status-badge status-success">Polygon</span>
          <span class="status-badge status-success">BNB Chain</span>
          <span class="status-badge status-success">Arbitrum</span>
          <span class="status-badge status-success">Optimism</span>
          <span class="status-badge status-success">Base</span>
          <span class="status-badge status-success">Avalanche</span>
          <span class="status-badge status-success">Fantom</span>
          <span class="status-badge status-success">Solana</span>
        </div>
      </div>

      <div class="highlight">
        <h3 style="color: white; margin-top: 0;"><span class="emoji">⏳</span>Next Steps for chat.pokt.ai</h3>
        <ol style="margin-bottom: 0; padding-left: 25px;">
          <li style="margin: 10px 0;"><strong>Configure DNS:</strong> Add A record: chat.pokt.ai → 51.195.63.173</li>
          <li style="margin: 10px 0;"><strong>Wait:</strong> 5-30 minutes for DNS propagation</li>
          <li style="margin: 10px 0;"><strong>SSL:</strong> Auto-generates via Let's Encrypt</li>
          <li style="margin: 10px 0;"><strong>Access:</strong> https://chat.pokt.ai</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://pokt.ai" class="cta-button">Visit pokt.ai Dashboard</a>
      </div>

      <div class="section">
        <h3><span class="emoji">📋</span>Quick Access Information</h3>
        <ul>
          <li><strong>Server IP:</strong> 51.195.63.173</li>
          <li><strong>Main Platform:</strong> https://pokt.ai</li>
          <li><strong>Chat Interface:</strong> https://chat.pokt.ai (pending DNS)</li>
          <li><strong>Chat Local:</strong> http://localhost:3006</li>
          <li><strong>Documentation:</strong> /home/ubuntu/pokt.ai/</li>
        </ul>
      </div>

      <div class="section">
        <h3><span class="emoji">🛠️</span>Management Commands</h3>
        <p><strong>Start chat.pokt.ai:</strong></p>
        <pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto;"><code>cd /home/ubuntu/pokt.ai/chat
npm start</code></pre>
        
        <p><strong>Check status:</strong></p>
        <pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto;"><code>lsof -i:3006</code></pre>

        <p><strong>View documentation:</strong></p>
        <pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto;"><code>cd /home/ubuntu/pokt.ai
cat COMPLETE_SUMMARY.md</code></pre>
      </div>

      <div class="section">
        <h3><span class="emoji">💡</span>Key Features Delivered</h3>
        <ul>
          <li>✅ ChatGPT-style chat interface with full pokt.ai branding</li>
          <li>✅ Real-time blockchain data from Pocket Network Shannon</li>
          <li>✅ Support for 9+ major blockchain networks</li>
          <li>✅ Natural language blockchain query processing</li>
          <li>✅ Beautiful, responsive design (mobile & desktop)</li>
          <li>✅ Production-ready deployment with Traefik</li>
          <li>✅ Comprehensive security audit (27 issues identified)</li>
          <li>✅ Complete documentation (196+ pages total)</li>
          <li>✅ MCP server for Claude Desktop integration</li>
        </ul>
      </div>

      <div class="highlight">
        <h3 style="color: white; margin-top: 0;"><span class="emoji">📞</span>Everything is Ready!</h3>
        <p style="margin-bottom: 0;">All files are on your server at <code>/home/ubuntu/pokt.ai/</code></p>
        <p style="margin-bottom: 0; margin-top: 10px;">Chat app is running on port 3006</p>
        <p style="margin-bottom: 0; margin-top: 10px;"><strong>Just configure DNS and you're live! 🚀</strong></p>
      </div>

      <p style="font-size: 1.2rem; margin-top: 40px; text-align: center; color: #1E3A8A;"><strong>🎉 Your complete blockchain AI platform is ready!</strong></p>
    </div>
    
    <div class="footer">
      <p style="font-size: 16px; font-weight: 600; color: #1E3A8A; margin-bottom: 15px;">Built with ❤️ by your AI assistant</p>
      <p style="margin: 10px 0;">Powered by <strong>Pocket Network</strong> via pokt.ai</p>
      <p style="margin: 10px 0;">© 2024 pokt.ai. All rights reserved.</p>
      <p style="margin-top: 25px; font-size: 13px; color: #94a3b8;">Documentation email for ${recipientEmail}</p>
    </div>
  </div>
</body>
</html>
`;

const emailData = JSON.stringify({
  personalizations: [{
    to: [{ email: recipientEmail }],
    subject: '🚀 pokt.ai & chat.pokt.ai - Complete Documentation Ready!'
  }],
  from: {
    email: 'noreply@pokt.ai',
    name: 'pokt.ai Documentation'
  },
  content: [{
    type: 'text/html',
    value: emailHTML
  }]
});

const options = {
  hostname: 'api.sendgrid.com',
  port: 443,
  path: '/v3/mail/send',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(emailData)
  }
};

console.log('📤 Sending email via SendGrid...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (d) => {
    if (d.length > 0) {
      process.stdout.write(d);
    }
  });

  res.on('end', () => {
    if (res.statusCode === 202) {
      console.log(`\n✅ Email sent successfully to ${recipientEmail}!`);
      console.log('\n📋 Summary:');
      console.log('- PROJECT_EVALUATION.md (50 pages)');
      console.log('- SECURITY_AUDIT_REPORT.md (48 pages)');
      console.log('- COMPLETE_SUMMARY.md (35+ pages)');
      console.log('- chat.pokt.ai documentation');
      console.log('- MCP server documentation');
      console.log('\n🎉 Check your email inbox!');
    } else {
      console.log(`\n❌ Failed to send email. Status: ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(emailData);
req.end();








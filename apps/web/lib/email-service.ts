import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: 'smtp.sendgrid.net',
      port: 587, // Use TLS port
      secure: false, // Use TLS
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY || ''
      }
    };

    this.transporter = nodemailer.createTransporter(this.config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || 'noreply@pokt.ai',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendTeamInvitation(email: string, inviterName: string, role: string, inviteLink: string): Promise<boolean> {
    const subject = `You've been invited to join the pokt.ai team`;
    const html = this.generateInvitationEmail(inviterName, role, inviteLink);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = `Welcome to pokt.ai!`;
    const html = this.generateWelcomeEmail(name);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendBillingNotification(email: string, amount: number, dueDate: string): Promise<boolean> {
    const subject = `pokt.ai Billing Notification - $${amount} due ${dueDate}`;
    const html = this.generateBillingEmail(amount, dueDate);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendUsageAlert(email: string, usage: number, limit: number): Promise<boolean> {
    const subject = `pokt.ai Usage Alert - ${usage}/${limit} requests used`;
    const html = this.generateUsageAlertEmail(usage, limit);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<boolean> {
    const subject = `pokt.ai Password Reset`;
    const html = this.generatePasswordResetEmail(resetLink);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  private generateInvitationEmail(inviterName: string, role: string, inviteLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation - pokt.ai</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          .role-badge { background: #e0f2fe; color: #0369a1; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">pokt.ai</div>
            <h1>You're Invited to Join the Team!</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p><strong>${inviterName}</strong> has invited you to join their pokt.ai team.</p>
            
            <div class="role-badge">Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</div>
            
            <p>pokt.ai is the leading RPC gateway service that provides reliable, fast, and secure access to blockchain networks. As a team member, you'll have access to:</p>
            
            <ul>
              <li>🚀 Create and manage RPC endpoints</li>
              <li>📊 Monitor usage and analytics</li>
              <li>🔑 Generate and manage API keys</li>
              <li>💳 View billing and payment information</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>This invitation will expire in 7 days.</strong></p>
            
            <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@pokt.ai">support@pokt.ai</a></p>
          </div>
          <div class="footer">
            <p>© 2024 pokt.ai. All rights reserved.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmail(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to pokt.ai</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">pokt.ai</div>
            <h1>Welcome to pokt.ai!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to pokt.ai, the most reliable RPC gateway service for blockchain applications!</p>
            
            <p>You now have access to:</p>
            <ul>
              <li>🚀 Create unlimited RPC endpoints</li>
              <li>📊 Real-time usage analytics</li>
              <li>🔑 Secure API key management</li>
              <li>💳 Transparent billing</li>
              <li>🛡️ Enterprise-grade security</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://pokt.ai/dashboard" class="button">Get Started</a>
            </div>
            
            <p>Need help getting started? Check out our <a href="https://docs.pokt.ai">documentation</a> or contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 pokt.ai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBillingEmail(amount: number, dueDate: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Billing Notification - pokt.ai</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          .amount { font-size: 2rem; font-weight: 700; color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">pokt.ai</div>
            <h1>Billing Notification</h1>
          </div>
          <div class="content">
            <h2>Payment Due</h2>
            <p>Your pokt.ai invoice is ready for payment.</p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
              <div class="amount">$${amount}</div>
              <p>Due: ${dueDate}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://pokt.ai/billing" class="button">Pay Now</a>
            </div>
            
            <p>Questions about your bill? Contact us at <a href="mailto:billing@pokt.ai">billing@pokt.ai</a></p>
          </div>
          <div class="footer">
            <p>© 2024 pokt.ai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateUsageAlertEmail(usage: number, limit: number): string {
    const percentage = Math.round((usage / limit) * 100);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Usage Alert - pokt.ai</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          .usage-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 20px 0; }
          .usage-fill { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); height: 100%; width: ${percentage}%; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">pokt.ai</div>
            <h1>Usage Alert</h1>
          </div>
          <div class="content">
            <h2>High Usage Detected</h2>
            <p>You've used <strong>${usage.toLocaleString()}</strong> out of <strong>${limit.toLocaleString()}</strong> requests this month.</p>
            
            <div class="usage-bar">
              <div class="usage-fill"></div>
            </div>
            
            <p><strong>${percentage}%</strong> of your monthly limit has been used.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://pokt.ai/usage" class="button">View Usage Details</a>
            </div>
            
            <p>Consider upgrading your plan to avoid service interruptions.</p>
          </div>
          <div class="footer">
            <p>© 2024 pokt.ai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmail(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - pokt.ai</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">pokt.ai</div>
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your pokt.ai account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 pokt.ai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();
export default EmailService;

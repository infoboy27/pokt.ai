import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.config.get<string>('FROM_EMAIL') || this.config.get<string>('EMAIL_FROM') || 'noreply@pokt.ai';
    if (apiKey && apiKey !== 'SG.your-sendgrid-api-key') {
      try {
        sgMail.setApiKey(apiKey);
        this.logger.log('SendGrid API key configured successfully');
      } catch (error) {
        this.logger.warn('Failed to set SendGrid API key', error);
      }
    } else {
      this.logger.warn('SENDGRID_API_KEY not set; email sending disabled');
    }
  }

  private isEnabled(): boolean {
    return !!this.config.get<string>('SENDGRID_API_KEY');
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.log(`[email-disabled] To: ${to} | ${subject}`);
      return;
    }
    try {
      await sgMail.send({ to, from: this.fromEmail, subject, text, html: html || text });
    } catch (error) {
      this.logger.error('Failed to send email', error as Error);
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
    try {
      const sendGridApiKey = this.config.get<string>('SENDGRID_API_KEY');
      
      if (!sendGridApiKey || sendGridApiKey === 'SG.your-sendgrid-api-key') {
        this.logger.warn('SENDGRID_API_KEY not configured, using development fallback');
        this.logger.log(`📧 VERIFICATION EMAIL for ${email}:`);
        this.logger.log(`   Code: ${verificationCode} (check console - email not sent)`);
        this.logger.log(`   Please use this code to verify your account`);
        this.logger.log(`   Note: Configure SENDGRID_API_KEY to send actual emails`);
        return true;
      }

      const msg = {
        to: email,
        from: {
          email: this.config.get<string>('FROM_EMAIL') || 'noreply@pokt.ai',
          name: 'pokt.ai',
        },
        subject: 'Verify your pokt.ai account',
        html: this.getVerificationEmailTemplate(verificationCode),
      };

      await sgMail.send(msg);
      this.logger.log(`✅ Verification email sent to ${email}`);
      this.logger.log(`📧 VERIFICATION CODE: ${verificationCode}`);
      this.logger.log(`   Use this code to verify your account`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}:`, error);
      if ((error as any).response) {
        this.logger.error(`SendGrid Error: ${JSON.stringify((error as any).response.body)}`);
      }
      return false;
    }
  }

  private getVerificationEmailTemplate(verificationCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your pokt.ai account</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1E3A8A; margin: 0;">pokt.ai</h1>
          <p style="color: #666; margin: 5px 0;">AI-powered RPC Gateway</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #1E3A8A; margin-top: 0;">Verify Your Email Address</h2>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Thank you for signing up! Please use the verification code below to complete your account setup:
          </p>
          
          <div style="background: #1E3A8A; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
            ${verificationCode}
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            © ${new Date().getFullYear()} pokt.ai. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

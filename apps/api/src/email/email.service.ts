import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
    try {
      const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
      
      if (!sendGridApiKey || sendGridApiKey === 'SG.your-sendgrid-api-key') {
        this.logger.warn('SENDGRID_API_KEY not configured, using development fallback');
        // In development, use hardcoded verification code
        const hardcodedCode = '000000';
        this.logger.log(`📧 VERIFICATION EMAIL for ${email}:`);
        this.logger.log(`   Code: ${hardcodedCode} (hardcoded for development)`);
        this.logger.log(`   Please use this code to verify your account`);
        return true;
      }

      // For now, we'll use a simple fetch to SendGrid API
      // In production, you'd use the SendGrid SDK
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email }],
              subject: 'Verify your pokt.ai account',
            },
          ],
          from: {
            email: this.configService.get<string>('FROM_EMAIL') || 'noreply@pokt.ai',
            name: 'pokt.ai',
          },
          content: [
            {
              type: 'text/html',
              value: this.getVerificationEmailTemplate(verificationCode),
            },
          ],
        }),
      });

      if (response.ok) {
        this.logger.log(`Verification email sent to ${email}`);
        return true;
      } else {
        this.logger.error(`Failed to send email to ${email}: ${response.statusText}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}:`, error);
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
            © 2024 pokt.ai. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

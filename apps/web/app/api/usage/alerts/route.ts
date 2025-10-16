import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/lib/email-service';
import { endpointQueries, usageQueries } from '@/lib/database';

const alertSchema = z.object({
  type: z.enum(['usage_limit', 'cost_threshold', 'endpoint_down', 'unusual_activity']),
  endpointId: z.string().optional(),
  threshold: z.number().optional(),
  currentValue: z.number().optional(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, endpointId, threshold, currentValue, message } = alertSchema.parse(body);

    // Get user email from headers (in real implementation, get from auth)
    const userEmail = request.headers.get('X-User-Email') || 'user@example.com';
    const userName = request.headers.get('X-User-Name') || 'User';

    let emailSent = false;

    switch (type) {
      case 'usage_limit':
        emailSent = await emailService.sendUsageAlert(
          userEmail,
          userName,
          'Usage Limit Reached',
          `You've reached ${threshold}% of your monthly usage limit. Current usage: ${currentValue} requests.`,
          'warning'
        );
        break;

      case 'cost_threshold':
        emailSent = await emailService.sendBillingAlert(
          userEmail,
          userName,
          'Cost Threshold Reached',
          `Your monthly costs have reached $${threshold}. Current cost: $${currentValue}.`,
          'warning'
        );
        break;

      case 'endpoint_down':
        if (endpointId) {
          const endpoint = await endpointQueries.findById(endpointId);
          emailSent = await emailService.sendEndpointAlert(
            userEmail,
            userName,
            'Endpoint Down',
            `Your endpoint "${endpoint?.name || endpointId}" is currently down and not responding to requests.`,
            'error'
          );
        }
        break;

      case 'unusual_activity':
        emailSent = await emailService.sendSecurityAlert(
          userEmail,
          userName,
          'Unusual Activity Detected',
          message || 'We detected unusual activity on your account. Please review your recent activity.',
          'warning'
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid alert type'
        }, { status: 400 });
    }

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        message: 'Failed to send alert email'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Alert sent successfully'
    });

  } catch (error) {
    console.error('Error sending alert:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to send alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}











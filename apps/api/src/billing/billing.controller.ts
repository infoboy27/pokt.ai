import { 
  Controller, 
  Post, 
  Body, 
  Headers, 
  HttpStatus, 
  HttpCode,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private billingService: BillingService,
    private stripeService: StripeService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Hide from Swagger docs
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(body, signature);
      
      this.logger.log(`Processing Stripe webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.billingService.handleInvoicePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.billingService.handleInvoicePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.created':
          await this.billingService.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.billingService.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.billingService.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'checkout.session.completed':
          await this.billingService.handleCheckoutSessionCompleted(event.data.object);
          break;
        
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Stripe webhook error:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  @Post('create-portal-session')
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created successfully' })
  async createBillingPortalSession(@Body() body: { orgId: string }) {
    return this.billingService.createBillingPortalSession(body.orgId);
  }

  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully' })
  async createCheckoutSession(@Body() body: { orgId: string; priceId: string }) {
    return this.billingService.createCheckoutSession(body.orgId, body.priceId);
  }
}









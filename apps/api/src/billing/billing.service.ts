import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { EmailService } from '../email/email.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private emailService: EmailService,
  ) {}

  async createBillingPortalSession(orgId: string) {
    try {
      // Get organization
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        include: { owner: true },
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      // Get or create Stripe customer
      let customerId = org.owner.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripeService.createCustomer(
          org.owner.email,
          org.owner.name || undefined
        );
        customerId = customer.id;

        // Update user with Stripe customer ID
        await this.prisma.user.update({
          where: { id: org.owner.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create billing portal session
      const session = await this.stripeService.createBillingPortalSession(
        customerId,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/billing`
      );

      return { url: session.url };
    } catch (error) {
      this.logger.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  async createCheckoutSession(orgId: string, priceId: string) {
    try {
      // Get organization
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        include: { owner: true },
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      // Get or create Stripe customer
      let customerId = org.owner.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripeService.createCustomer(
          org.owner.email,
          org.owner.name || undefined
        );
        customerId = customer.id;

        // Update user with Stripe customer ID
        await this.prisma.user.update({
          where: { id: org.owner.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await this.stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/billing?success=true`,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/billing?canceled=true`
      );

      return { url: session.url };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async getInvoices(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Webhook handlers
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
    
    // Update invoice status in database
    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: { status: 'paid' },
      create: {
        orgId: invoice.metadata?.orgId || 'unknown',
        stripeInvoiceId: invoice.id,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        amount: invoice.amount_paid,
        status: 'paid',
      },
    });

    // Notify org owner if available
    try {
      const orgId = invoice.metadata?.orgId;
      if (orgId) {
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId },
          include: { owner: true },
        });
        if (org?.owner?.email) {
          await this.emailService.send(
            org.owner.email,
            'Payment received - pokt.ai',
            `Your payment for invoice ${invoice.id} was successful. Amount: $${(invoice.amount_paid / 100).toFixed(2)}.`,
          );
        }
      }
    } catch (err) {
      this.logger.warn('Email notification failed (payment succeeded)', err as Error);
    }
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
    
    // Update invoice status in database
    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: { status: 'uncollectible' },
      create: {
        orgId: invoice.metadata?.orgId || 'unknown',
        stripeInvoiceId: invoice.id,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        amount: invoice.amount_due,
        status: 'uncollectible',
      },
    });

    // Notify org owner if available
    try {
      const orgId = invoice.metadata?.orgId;
      if (orgId) {
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId },
          include: { owner: true },
        });
        if (org?.owner?.email) {
          await this.emailService.send(
            org.owner.email,
            'Payment failed - pokt.ai',
            `Your payment for invoice ${invoice.id} failed. Please update your payment method. Amount due: $${(invoice.amount_due / 100).toFixed(2)}.`,
          );
        }
      }
    } catch (err) {
      this.logger.warn('Email notification failed (payment failed)', err as Error);
    }
  }

  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription created: ${subscription.id}`);
    // Handle subscription creation logic
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription updated: ${subscription.id}`);
    // Handle subscription update logic
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    // Handle subscription deletion logic
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout session completed: ${session.id}`);
    // Handle successful checkout
  }
}

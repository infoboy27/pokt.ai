import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createBillingPortalSession(orgId: string) {
    // TODO: Implement Stripe billing portal
    return {
      url: 'https://billing.stripe.com/session/mock',
    };
  }

  async getInvoices(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

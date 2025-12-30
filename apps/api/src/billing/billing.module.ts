import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { BillingController } from './billing.controller';
import { BillingCronService } from './billing.cron';
import { BillingRemindersService } from './billing.reminders';
import { EmailModule } from '../email/email.module';
import { NowPaymentsController } from './nowpayments.controller';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [EmailModule],
  controllers: [BillingController, NowPaymentsController, InvoiceController],
  providers: [BillingService, StripeService, BillingCronService, BillingRemindersService],
  exports: [BillingService, StripeService, BillingCronService, BillingRemindersService],
})
export class BillingModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EndpointsModule } from './endpoints/endpoints.module';
import { UsageModule } from './usage/usage.module';
import { BillingModule } from './billing/billing.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NetworksModule } from './networks/networks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    EndpointsModule,
    UsageModule,
    BillingModule,
    HealthModule,
    DashboardModule,
    NetworksModule,
  ],
})
export class AppModule {}

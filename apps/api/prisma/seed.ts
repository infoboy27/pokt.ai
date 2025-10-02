import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { auth0Sub: 'auth0|demo-user' },
    update: {},
    create: {
      email: 'demo@pokt.ai',
      name: 'Demo User',
      auth0Sub: 'auth0|demo-user',
    },
  });

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'Demo Organization',
      ownerId: user.id,
    },
  });

  // Create org membership
  await prisma.orgMember.upsert({
    where: { 
      orgId_userId: {
        orgId: org.id,
        userId: user.id,
      }
    },
    update: {},
    create: {
      orgId: org.id,
      userId: user.id,
      role: 'ORG_OWNER',
    },
  });

  // Create demo endpoints using current schema
  const endpoints = await Promise.all([
    prisma.endpoint.upsert({
      where: { id: 'endpoint-1' },
      update: {},
      create: {
        id: 'endpoint-1',
        name: 'Ethereum Mainnet',
        baseUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        healthUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        description: 'Ethereum mainnet RPC endpoint',
        isActive: true,
        orgId: org.id,
      },
    }),
    prisma.endpoint.upsert({
      where: { id: 'endpoint-2' },
      update: {},
      create: {
        id: 'endpoint-2',
        name: 'Polygon',
        baseUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
        healthUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
        description: 'Polygon mainnet RPC endpoint',
        isActive: true,
        orgId: org.id,
      },
    }),
    prisma.endpoint.upsert({
      where: { id: 'endpoint-3' },
      update: {},
      create: {
        id: 'endpoint-3',
        name: 'BSC',
        baseUrl: 'https://bsc-dataseed.binance.org',
        healthUrl: 'https://bsc-dataseed.binance.org',
        description: 'Binance Smart Chain RPC endpoint',
        isActive: true,
        orgId: org.id,
      },
    }),
    prisma.endpoint.upsert({
      where: { id: 'endpoint-4' },
      update: {},
      create: {
        id: 'endpoint-4',
        name: 'Arbitrum',
        baseUrl: 'https://arb1.arbitrum.io/rpc',
        healthUrl: 'https://arb1.arbitrum.io/rpc',
        description: 'Arbitrum One RPC endpoint',
        isActive: true,
        orgId: org.id,
      },
    }),
  ]);

  // Note: Skipping network creation for now due to schema mismatch
  // The admin tester will need to be updated to work with existing endpoint structure
  const networks = [];

  // Create sample usage data for the last 30 days
  const usageData = [];
  const today = new Date();
  const endpointIds = ['endpoint-1', 'endpoint-2', 'endpoint-3', 'endpoint-4'];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    for (const endpointId of endpointIds) {
      const baseRelays = Math.floor(Math.random() * 50000) + 10000;
      const relays = baseRelays + Math.floor(Math.random() * 20000);
      const p95ms = Math.floor(Math.random() * 30) + 30; // 30-60ms
      const errorRate = Math.random() * 0.5; // 0-0.5%
      
      usageData.push({
        endpointId,
        date,
        relays,
        p95ms,
        errorRate,
      });
    }
  }

  // Insert usage data
  for (const usage of usageData) {
    await prisma.usageDaily.upsert({
      where: {
        endpointId_date: {
          endpointId: usage.endpointId,
          date: usage.date,
        },
      },
      update: usage,
      create: usage,
    });
  }

  // Create sample invoices
  const invoices = [
    {
      id: 'invoice-1',
      orgId: org.id,
      stripeInvoiceId: 'in_mock_1',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      amount: 12500, // $125.00
      status: 'paid',
    },
    {
      id: 'invoice-2',
      orgId: org.id,
      stripeInvoiceId: 'in_mock_2',
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
      amount: 15800, // $158.00
      status: 'open',
    },
  ];

  for (const invoice of invoices) {
    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: invoice,
      create: invoice,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created user: ${user.email}`);
  console.log(`🏢 Created organization: ${org.name}`);
  console.log(`🔗 Created ${endpointIds.length} endpoints`);
  console.log(`🌐 Admin tester now uses direct RPC calls (no database networks needed)`);
  console.log(`📊 Created ${usageData.length} usage records`);
  console.log(`💰 Created ${invoices.length} invoices`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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

  // Create demo endpoints
  const endpoints = await Promise.all([
    prisma.endpoint.upsert({
      where: { id: 'endpoint-1' },
      update: {},
      create: {
        id: 'endpoint-1',
        orgId: org.id,
        name: 'Ethereum Mainnet',
        chainId: 'F003',
        rateLimit: 1000,
        tokenHash: 'mock_hash_1',
        status: 'active',
      },
    }),
    prisma.endpoint.upsert({
      where: { id: 'endpoint-2' },
      update: {},
      create: {
        id: 'endpoint-2',
        orgId: org.id,
        name: 'Polygon',
        chainId: 'F00C',
        rateLimit: 500,
        tokenHash: 'mock_hash_2',
        status: 'active',
      },
    }),
    prisma.endpoint.upsert({
      where: { id: 'endpoint-3' },
      update: {},
      create: {
        id: 'endpoint-3',
        orgId: org.id,
        name: 'BSC',
        chainId: 'F00B',
        rateLimit: 750,
        tokenHash: 'mock_hash_3',
        status: 'active',
      },
    }),
    prisma.endpoint.upsert({
      where: { id: 'endpoint-4' },
      update: {},
      create: {
        id: 'endpoint-4',
        orgId: org.id,
        name: 'Arbitrum',
        chainId: 'F00A',
        rateLimit: 300,
        tokenHash: 'mock_hash_4',
        status: 'active',
      },
    }),
  ]);

  // Create sample usage data for the last 30 days
  const usageData = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    for (const endpoint of endpoints) {
      const baseRelays = Math.floor(Math.random() * 50000) + 10000;
      const relays = baseRelays + Math.floor(Math.random() * 20000);
      const p95ms = Math.floor(Math.random() * 30) + 30; // 30-60ms
      const errorRate = Math.random() * 0.5; // 0-0.5%
      
      usageData.push({
        endpointId: endpoint.id,
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
  console.log(`🔗 Created ${endpoints.length} endpoints`);
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

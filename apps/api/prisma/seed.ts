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

  // Create demo endpoints (using legacy schema structure)
  const endpoints = await Promise.all([
    // Note: Using raw SQL to insert into the legacy endpoints table structure
    prisma.$executeRaw`
      INSERT INTO endpoints (id, org_id, name, chain_id, rate_limit, token_hash, status, created_at, updated_at)
      VALUES ('endpoint-1', ${org.id}, 'Ethereum Mainnet', 'F003', 1000, 'mock_hash_1', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
    prisma.$executeRaw`
      INSERT INTO endpoints (id, org_id, name, chain_id, rate_limit, token_hash, status, created_at, updated_at)
      VALUES ('endpoint-2', ${org.id}, 'Polygon', 'F00C', 500, 'mock_hash_2', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
    prisma.$executeRaw`
      INSERT INTO endpoints (id, org_id, name, chain_id, rate_limit, token_hash, status, created_at, updated_at)
      VALUES ('endpoint-3', ${org.id}, 'BSC', 'F00B', 750, 'mock_hash_3', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
    prisma.$executeRaw`
      INSERT INTO endpoints (id, org_id, name, chain_id, rate_limit, token_hash, status, created_at, updated_at)
      VALUES ('endpoint-4', ${org.id}, 'Arbitrum', 'F00A', 300, 'mock_hash_4', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsageData() {
  console.log('Seeding usage data...');

  // First, ensure we have some endpoints
  const endpoints = await prisma.endpoint.findMany({
    where: { orgId: 'org-1' },
    take: 3,
  });

  if (endpoints.length === 0) {
    console.log('No endpoints found. Creating sample endpoints...');
    
    // Create sample endpoints
    const sampleEndpoints = [
      {
        name: 'Ethereum Mainnet',
        baseUrl: 'https://eth-mainnet.pokt.network',
        healthUrl: 'https://eth-mainnet.pokt.network/health',
        orgId: 'org-1',
      },
      {
        name: 'Polygon',
        baseUrl: 'https://polygon-mainnet.pokt.network',
        healthUrl: 'https://polygon-mainnet.pokt.network/health',
        orgId: 'org-1',
      },
      {
        name: 'BSC',
        baseUrl: 'https://bsc-mainnet.pokt.network',
        healthUrl: 'https://bsc-mainnet.pokt.network/health',
        orgId: 'org-1',
      },
    ];

    for (const endpointData of sampleEndpoints) {
      await prisma.endpoint.create({
        data: endpointData,
      });
    }

    console.log('Sample endpoints created');
  }

  // Get the endpoints again
  const updatedEndpoints = await prisma.endpoint.findMany({
    where: { orgId: 'org-1' },
    take: 3,
  });

  // Generate usage data for the last 30 days
  const today = new Date();
  const usageData = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const endpoint of updatedEndpoints) {
      // Generate realistic usage data with some randomness
      const baseRelays = endpoint.name.includes('Ethereum') ? 120000 : 
                        endpoint.name.includes('Polygon') ? 80000 : 60000;
      
      const relays = Math.floor(baseRelays + (Math.random() - 0.5) * baseRelays * 0.3);
      const latency = Math.floor(40 + Math.random() * 20); // 40-60ms
      const errorRate = Math.random() * 0.05; // 0-5% error rate

      usageData.push({
        endpointId: endpoint.id,
        date,
        relays,
        p95ms: latency,
        errorRate,
      });
    }
  }

  // Clear existing usage data for these endpoints
  await prisma.usageDaily.deleteMany({
    where: {
      endpointId: {
        in: updatedEndpoints.map(e => e.id),
      },
    },
  });

  // Insert new usage data
  await prisma.usageDaily.createMany({
    data: usageData,
  });

  console.log(`Created ${usageData.length} usage records for ${updatedEndpoints.length} endpoints`);
  
  // Also create some Usage table records for more detailed analytics
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      endpoint: {
        orgId: 'org-1',
      },
    },
    take: 3,
  });

  if (apiKeys.length === 0) {
    console.log('Creating sample API keys...');
    for (const endpoint of updatedEndpoints) {
      await prisma.apiKey.create({
        data: {
          label: `${endpoint.name} API Key`,
          keyHash: `hash_${endpoint.id}_${Date.now()}`,
          endpointId: endpoint.id,
        },
      });
    }
  }

  console.log('Usage data seeding completed!');
}

async function main() {
  try {
    await seedUsageData();
  } catch (error) {
    console.error('Error seeding usage data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedUsageData };



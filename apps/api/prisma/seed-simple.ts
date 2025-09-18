import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin portal data...');

  try {
    // Create default admin user
    const adminUser = await prisma.adminUser.upsert({
      where: { email: 'admin@pokt.ai' },
      update: {},
      create: {
        email: 'admin@pokt.ai',
        name: 'Portal Administrator',
        role: 'owner',
        isActive: true,
      },
    });

    console.log('✅ Created admin user:', adminUser.email);

    // Create Shannon Customer Gateway endpoint
    const endpoint = await prisma.endpoint.upsert({
      where: { id: 'shannon-gateway' },
      update: {},
      create: {
        id: 'shannon-gateway',
        name: 'Shannon Customer Gateway',
        baseUrl: 'http://135.125.163.236:4000',
        healthUrl: 'http://135.125.163.236:4000/health',
        description: 'Customer-facing RPC gateway with 30+ blockchain networks',
        isActive: true,
      },
    });

    console.log('✅ Created endpoint:', endpoint.name);

    // Primary networks data
    const networks = [
      { code: 'eth', chainId: 1, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/eth', isTestnet: false, isEnabled: true },
      { code: 'avax', chainId: 43114, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/avax', isTestnet: false, isEnabled: true },
      { code: 'bsc', chainId: 56, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/bsc', isTestnet: false, isEnabled: true },
      { code: 'opt', chainId: 10, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/opt', isTestnet: false, isEnabled: true },
      { code: 'arb-one', chainId: 42161, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/arb-one', isTestnet: false, isEnabled: true },
      { code: 'base', chainId: 8453, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/base', isTestnet: false, isEnabled: true },
      { code: 'poly', chainId: 137, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/poly', isTestnet: false, isEnabled: true },
    ];

    // Create networks
    for (const networkData of networks) {
      const network = await prisma.network.create({
        data: {
          ...networkData,
          endpointId: endpoint.id,
        },
      });
      console.log(`✅ Created network: ${network.code} (${network.chainId})`);
    }

    // Create default API key
    const defaultApiKey = await prisma.apiKey.create({
      data: {
        label: 'Default API Key',
        keyHash: 'default-key-hash-123',
        headerName: 'X-API-Key',
        rpsLimit: 100,
        rpdLimit: 1000000,
        rpmLimit: 30000000,
        isActive: true,
        endpointId: endpoint.id,
      },
    });

    console.log('✅ Created default API key:', defaultApiKey.label);

    console.log('🎉 Admin portal seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



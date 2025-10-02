import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NetworksService {
  constructor(private prisma: PrismaService) {}

  async getAvailableNetworks() {
    // Return a list of available networks for endpoint creation
    const networks = [
      {
        id: 'eth',
        code: 'eth',
        name: 'Ethereum',
        chainId: 1,
        isEnabled: true,
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        wsUrl: 'wss://eth-mainnet.g.alchemy.com/v2/demo',
      },
      {
        id: 'polygon',
        code: 'polygon',
        name: 'Polygon',
        chainId: 137,
        isEnabled: true,
        rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
        wsUrl: 'wss://polygon-mainnet.g.alchemy.com/v2/demo',
      },
      {
        id: 'bsc',
        code: 'bsc',
        name: 'BSC (Binance Smart Chain)',
        chainId: 56,
        isEnabled: true,
        rpcUrl: 'https://bsc-dataseed.binance.org',
        wsUrl: 'wss://bsc-ws-node.nariox.org:443',
      },
      {
        id: 'avalanche',
        code: 'avax',
        name: 'Avalanche',
        chainId: 43114,
        isEnabled: true,
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        wsUrl: 'wss://api.avax.network/ext/bc/C/ws',
      },
      {
        id: 'arbitrum',
        code: 'arb-one',
        name: 'Arbitrum One',
        chainId: 42161,
        isEnabled: true,
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        wsUrl: 'wss://arb1.arbitrum.io/ws',
      },
      {
        id: 'optimism',
        code: 'opt',
        name: 'Optimism',
        chainId: 10,
        isEnabled: true,
        rpcUrl: 'https://mainnet.optimism.io',
        wsUrl: 'wss://mainnet.optimism.io',
      },
      {
        id: 'base',
        code: 'base',
        name: 'Base',
        chainId: 8453,
        isEnabled: true,
        rpcUrl: 'https://mainnet.base.org',
        wsUrl: 'wss://mainnet.base.org',
      },
    ];

    return { networks };
  }
}








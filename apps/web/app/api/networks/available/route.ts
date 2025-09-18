import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/networks/available - Get all available networks from Shannon Gateway
export async function GET(request: NextRequest) {
  try {
    // Get networks from Shannon Gateway endpoint
    const networks = await prisma.network.findMany({
      where: { 
        endpointId: 'shannon-gateway',
        isEnabled: true 
      },
      select: {
        id: true,
        code: true,
        chainId: true,
        isTestnet: true,
        isEnabled: true,
        rpcUrl: true
      },
      orderBy: [
        { isTestnet: 'asc' }, // Mainnet first
        { code: 'asc' }       // Then alphabetical
      ]
    });

    // Add display names
    const networkNames: Record<string, string> = {
      'eth': 'Ethereum',
      'bsc': 'BSC (Binance Smart Chain)',
      'poly': 'Polygon',
      'avax': 'Avalanche',
      'arb-one': 'Arbitrum One',
      'opt': 'Optimism',
      'base': 'Base',
      'linea': 'Linea',
      'mantle': 'Mantle',
      'bera': 'Berachain',
      'fuse': 'Fuse',
      'fraxtal': 'Fraxtal',
      'metis': 'Metis',
      'sui': 'Sui',
      'blast': 'Blast',
      'boba': 'Boba Network',
      'celo': 'Celo',
      'fantom': 'Fantom',
      'gnosis': 'Gnosis Chain',
      'ink': 'Ink',
      'kava': 'Kava',
      'oasys': 'Oasys',
      'solana': 'Solana',
      'sonic': 'Sonic',
      'anvil': 'Anvil (Local)',
      'pokt': 'Pocket Network',
      'opt-sepolia-testnet': 'Optimism Sepolia Testnet',
      'arb-sepolia-testnet': 'Arbitrum Sepolia Testnet',
      'base-sepolia-testnet': 'Base Sepolia Testnet',
      'eth-holesky-testnet': 'Ethereum Holesky Testnet',
      'eth-sepolia-testnet': 'Ethereum Sepolia Testnet',
    };

    const networksWithNames = networks.map(network => ({
      ...network,
      name: networkNames[network.code] || network.code.toUpperCase()
    }));

    return NextResponse.json({ 
      networks: networksWithNames,
      total: networks.length 
    });
  } catch (error) {
    console.error('Error fetching networks:', error);
    
    // Return fallback hardcoded networks if database fails
    const fallbackNetworks = Object.entries({
      'eth': 'Ethereum',
      'bsc': 'BSC (Binance Smart Chain)',
      'poly': 'Polygon',
      'avax': 'Avalanche',
      'arb-one': 'Arbitrum One',
      'opt': 'Optimism',
      'base': 'Base',
      'linea': 'Linea',
      'mantle': 'Mantle',
      'bera': 'Berachain',
      'fuse': 'Fuse',
      'fraxtal': 'Fraxtal',
      'metis': 'Metis',
      'sui': 'Sui',
      'blast': 'Blast',
      'boba': 'Boba Network',
      'celo': 'Celo',
      'fantom': 'Fantom',
      'gnosis': 'Gnosis Chain',
      'ink': 'Ink',
      'kava': 'Kava',
      'oasys': 'Oasys',
      'solana': 'Solana',
      'sonic': 'Sonic',
      'anvil': 'Anvil (Local)',
      'pokt': 'Pocket Network',
      'opt-sepolia-testnet': 'Optimism Sepolia Testnet',
      'arb-sepolia-testnet': 'Arbitrum Sepolia Testnet',
      'base-sepolia-testnet': 'Base Sepolia Testnet',
      'eth-holesky-testnet': 'Ethereum Holesky Testnet',
      'eth-sepolia-testnet': 'Ethereum Sepolia Testnet',
    }).map(([code, name]) => ({
      id: code,
      code,
      name,
      chainId: null,
      isTestnet: code.includes('testnet'),
      isEnabled: true,
      rpcUrl: `http://135.125.163.236:4000/v1/rpc/${code}`
    }));

    return NextResponse.json({ 
      networks: fallbackNetworks,
      total: fallbackNetworks.length,
      fallback: true
    });
  }
}


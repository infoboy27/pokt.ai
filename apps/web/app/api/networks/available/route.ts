import { NextRequest, NextResponse } from 'next/server';

// Available blockchain networks
const AVAILABLE_NETWORKS = [
  {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    symbol: 'ETH',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io',
    icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    isTestnet: false,
    isActive: true,
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon Mainnet',
    chainId: 137,
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    icon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    isTestnet: false,
    isActive: true,
  },
  {
    id: 'bsc-mainnet',
    name: 'BNB Smart Chain',
    chainId: 56,
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    isTestnet: false,
    isActive: true,
  },
  {
    id: 'avalanche-mainnet',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    icon: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    isTestnet: false,
    isActive: true,
  },
  {
    id: 'fantom-mainnet',
    name: 'Fantom Opera',
    chainId: 250,
    symbol: 'FTM',
    rpcUrl: 'https://rpc.ftm.tools',
    blockExplorer: 'https://ftmscan.com',
    icon: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
    isTestnet: false,
    isActive: true,
  },
  {
    id: 'arbitrum-mainnet',
    name: 'Arbitrum One',
    chainId: 42161,
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    icon: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
    isTestnet: false,
    isActive: true,
  },
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    chainId: 10,
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    icon: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
    isTestnet: false,
    isActive: true,
  },
  // Testnets
  {
    id: 'ethereum-goerli',
    name: 'Ethereum Goerli',
    chainId: 5,
    symbol: 'ETH',
    rpcUrl: 'https://goerli.infura.io/v3/demo',
    blockExplorer: 'https://goerli.etherscan.io',
    icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    isTestnet: true,
    isActive: true,
  },
  {
    id: 'polygon-mumbai',
    name: 'Polygon Mumbai',
    chainId: 80001,
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    icon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    isTestnet: true,
    isActive: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTestnets = searchParams.get('includeTestnets') === 'true';
    
    let networks = AVAILABLE_NETWORKS;
    
    if (!includeTestnets) {
      networks = networks.filter(network => !network.isTestnet);
    }
    
    return NextResponse.json({
      networks,
      total: networks.length,
      mainnets: networks.filter(n => !n.isTestnet).length,
      testnets: networks.filter(n => n.isTestnet).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch available networks' },
      { status: 500 }
    );
  }
}


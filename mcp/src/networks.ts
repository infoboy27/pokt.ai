/**
 * Blockchain network configuration for Pocket Network Shannon + Grove
 * Powered by pokt.ai
 */

export interface BlockchainNetwork {
  id: string;
  name: string;
  chainId: number | null;
  serviceId: string; // Pocket Network service ID
  rpcUrl: string;
  wsUrl?: string;
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  isEnabled: boolean;
  category: 'evm' | 'solana' | 'cosmos' | 'other';
}

export const BLOCKCHAIN_NETWORKS: BlockchainNetwork[] = [
  // Ethereum Ecosystem
  {
    id: 'eth',
    name: 'Ethereum Mainnet',
    chainId: 1,
    serviceId: 'F003',
    rpcUrl: process.env.ETH_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/eth',
    explorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'poly',
    name: 'Polygon',
    chainId: 137,
    serviceId: 'F00C',
    rpcUrl: process.env.POLY_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/poly',
    explorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    serviceId: 'F00B',
    rpcUrl: process.env.BSC_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/bsc',
    explorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'arb-one',
    name: 'Arbitrum One',
    chainId: 42161,
    serviceId: 'F00A',
    rpcUrl: process.env.ARB_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/arb-one',
    explorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'opt',
    name: 'Optimism',
    chainId: 10,
    serviceId: 'F00E',
    rpcUrl: process.env.OPT_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/opt',
    explorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    serviceId: 'BASE',
    rpcUrl: process.env.BASE_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/base',
    explorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'avax',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    serviceId: 'AVAX',
    rpcUrl: process.env.AVAX_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/avax',
    explorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  {
    id: 'ftm',
    name: 'Fantom Opera',
    chainId: 250,
    serviceId: 'FTM',
    rpcUrl: 'http://135.125.163.236:4000/v1/rpc/ftm',
    explorer: 'https://ftmscan.com',
    nativeCurrency: {
      name: 'FTM',
      symbol: 'FTM',
      decimals: 18,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'evm',
  },
  // Solana
  {
    id: 'solana',
    name: 'Solana Mainnet',
    chainId: null,
    serviceId: 'SOLANA',
    rpcUrl: process.env.SOLANA_RPC_URL || 'http://135.125.163.236:4000/v1/rpc/solana',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9,
    },
    isTestnet: false,
    isEnabled: true,
    category: 'solana',
  },
];

/**
 * Get network by ID
 */
export function getNetwork(networkId: string): BlockchainNetwork | undefined {
  return BLOCKCHAIN_NETWORKS.find((n) => n.id === networkId);
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): BlockchainNetwork | undefined {
  return BLOCKCHAIN_NETWORKS.find((n) => n.chainId === chainId);
}

/**
 * Get all enabled networks
 */
export function getEnabledNetworks(): BlockchainNetwork[] {
  return BLOCKCHAIN_NETWORKS.filter((n) => n.isEnabled);
}

/**
 * Get networks by category
 */
export function getNetworksByCategory(category: string): BlockchainNetwork[] {
  return BLOCKCHAIN_NETWORKS.filter((n) => n.category === category && n.isEnabled);
}








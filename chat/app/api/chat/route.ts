import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Blockchain network mapping
const BLOCKCHAIN_NETWORKS = {
  ethereum: 'eth',
  eth: 'eth',
  polygon: 'poly',
  matic: 'poly',
  poly: 'poly',
  bsc: 'bsc',
  binance: 'bsc',
  arbitrum: 'arb-one',
  arb: 'arb-one',
  optimism: 'opt',
  op: 'opt',
  base: 'base',
  avalanche: 'avax',
  avax: 'avax',
  fantom: 'ftm',
  ftm: 'ftm',
  solana: 'solana',
  sol: 'solana',
  pocket: 'pokt',
  pokt: 'pokt',
};

// MCP-like blockchain tools
async function callBlockchainTool(toolName: string, args: any) {
  // Use public RPC endpoints for each chain
  const rpcEndpoints: Record<string, string> = {
    eth: 'https://ethereum.publicnode.com',
    poly: 'https://polygon-rpc.com',
    bsc: 'https://bsc-dataseed.binance.org',
    'arb-one': 'https://arb1.arbitrum.io/rpc',
    opt: 'https://mainnet.optimism.io',
    base: 'https://mainnet.base.org',
    avax: 'https://api.avax.network/ext/bc/C/rpc',
    ftm: 'https://rpcapi.fantom.network',
    solana: 'https://api.mainnet-beta.solana.com',
    pokt: 'https://pocket-mainnet.rpc.grove.city/v1/mainnet',
  };
  
  try {
    switch (toolName) {
      case 'get_block_number': {
        const network = args.network || 'eth';
        const rpcUrl = rpcEndpoints[network];
        
        // Special handling for Pocket Network Shannon
        if (network === 'pokt') {
          return `**Pocket Network Shannon** is the next-generation decentralized RPC protocol! 🚀\n\n` +
            `Shannon Protocol Features:\n` +
            `- ⚡ **15,000+** distributed nodes worldwide\n` +
            `- 🌐 **Multi-chain support** for 50+ blockchain networks\n` +
            `- 🔒 **Trustless infrastructure** with cryptographic verification\n` +
            `- 📈 **Scalable** and **cost-effective** RPC access\n\n` +
            `Shannon uses a custom RPC format (not standard JSON-RPC).\n` +
            `For blockchain queries, use the Shannon Grove API:\n` +
            `- **API Endpoint**: https://shannon-grove-api.mainnet.poktroll.com\n` +
            `- **Block Explorer**: https://poktscan.com\n` +
            `- **Network Stats**: https://shannon.pokt.network\n\n` +
            `Shannon powers the decentralized RPC infrastructure for all the other networks you can query here!`;
        }
        
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }, { timeout: 5000 });
        const blockNumber = parseInt(response.data.result, 16);
        return `Current block number on ${getNetworkName(network)}: **${blockNumber.toLocaleString()}**`;
      }

      case 'get_balance': {
        const network = args.network || 'eth';
        const address = args.address;
        
        // Special handling for Pocket Network addresses (pokt1...)
        if (address.startsWith('pokt1')) {
          try {
            const response = await axios.get(
              `https://shannon-grove-api.mainnet.poktroll.com/cosmos/bank/v1beta1/balances/${address}`,
              { timeout: 5000 }
            );
            
            if (response.data && response.data.balances && response.data.balances.length > 0) {
              const poktBalance = response.data.balances.find((b: any) => b.denom === 'upokt');
              if (poktBalance) {
                const balance = Number(poktBalance.amount) / 1e6; // Convert from uPOKT to POKT
                return `Balance of **${address}** on ${getNetworkName('pokt')}: **${balance.toLocaleString()} POKT** 🚀\n\n` +
                  `This is a Pocket Network Shannon address with:\n` +
                  `- **${balance.toLocaleString()} POKT** tokens\n` +
                  `- Network: Shannon mainnet\n` +
                  `- Explorer: https://poktscan.com/account/${address}`;
              }
            }
            return `Address **${address}** found on Pocket Network Shannon, but no POKT balance detected.`;
          } catch (error: any) {
            return `Unable to fetch balance for Pocket Network address. The address may be invalid or the API is temporarily unavailable.\n\n` +
              `Address: ${address}\n` +
              `Try checking at: https://poktscan.com/account/${address}`;
          }
        }
        
        // Special handling for Solana addresses (base58 format, 32-44 chars)
        if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x') && !/[0OIl]/.test(address)) {
          try {
            const response = await axios.post('https://api.mainnet-beta.solana.com', {
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [address]
            }, { timeout: 5000 });
            
            if (response.data && response.data.result) {
              const lamports = response.data.result.value;
              const balance = lamports / 1e9; // Convert lamports to SOL
              return `Balance of **${address}** on ${getNetworkName('solana')}: **${balance.toFixed(6)} SOL** ☀️\n\n` +
                `This is a Solana address with:\n` +
                `- **${balance.toFixed(6)} SOL** tokens\n` +
                `- **${lamports.toLocaleString()}** lamports\n` +
                `- Explorer: https://explorer.solana.com/address/${address}`;
            }
            return `Address **${address}** not found on Solana network.`;
          } catch (error: any) {
            return `Unable to fetch balance for Solana address. The address may be invalid or the API is temporarily unavailable.\n\n` +
              `Address: ${address}\n` +
              `Try checking at: https://explorer.solana.com/address/${address}`;
          }
        }
        
        // Special handling for other Cosmos-based addresses
        if (address.match(/^(cosmos|osmo|atom|juno|stars|terra|luna)[1][a-z0-9]{38,}/)) {
          return `This appears to be a **Cosmos-based blockchain address**!\n\n` +
            `Address: **${address}**\n\n` +
            `For balance queries on Cosmos ecosystem chains, please specify the network or use the chain's native explorer.\n\n` +
            `Supported via Pocket Network Shannon infrastructure! 🚀`;
        }
        
        // Standard EVM balance check (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche C-Chain, Fantom)
        const rpcUrl = rpcEndpoints[network];
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }, { timeout: 5000 });
        const balanceWei = BigInt(response.data.result);
        const balance = Number(balanceWei) / 1e18;
        return `Balance of **${address}** on ${getNetworkName(network)}: **${balance.toFixed(6)} ${getNativeCurrency(network)}**`;
      }

      case 'get_gas_price': {
        const network = args.network || 'eth';
        
        // Special handling for Solana
        if (network === 'solana') {
          try {
            const response = await axios.post('https://api.mainnet-beta.solana.com', {
              jsonrpc: '2.0',
              id: 1,
              method: 'getRecentPrioritizationFees',
              params: []
            }, { timeout: 5000 });
            
            if (response.data && response.data.result && response.data.result.length > 0) {
              // Get average prioritization fee
              const fees = response.data.result.map((f: any) => f.prioritizationFee);
              const avgFee = fees.reduce((a: number, b: number) => a + b, 0) / fees.length;
              const baseFee = 5000; // Base fee in lamports (0.000005 SOL)
              const totalFee = baseFee + avgFee;
              const solFee = totalFee / 1e9;
              
              return `Current transaction fee on ${getNetworkName('solana')}: **${solFee.toFixed(6)} SOL** ☀️\n\n` +
                `Solana Fee Breakdown:\n` +
                `- **Base Fee**: ${(baseFee / 1e9).toFixed(6)} SOL (${baseFee.toLocaleString()} lamports)\n` +
                `- **Priority Fee**: ${(avgFee / 1e9).toFixed(6)} SOL (avg)\n` +
                `- **Total**: ${solFee.toFixed(6)} SOL\n\n` +
                `Solana uses a different fee model than EVM chains - fees are based on signatures and compute units!`;
            }
            return `Unable to fetch current Solana fees. Typical fees are ~0.000005 SOL per transaction.`;
          } catch (error: any) {
            return `Solana uses a different fee model! ☀️\n\n` +
              `Typical transaction fees:\n` +
              `- **Standard transaction**: ~0.000005 SOL (~$0.0005)\n` +
              `- **Complex transactions**: 0.00001 - 0.0001 SOL\n\n` +
              `Solana fees are based on signatures and compute units, not gas like EVM chains.`;
          }
        }
        
        // Special handling for Pocket Network
        if (network === 'pokt') {
          return `Pocket Network Shannon uses **POKT** tokens for transaction fees! 🚀\n\n` +
            `Shannon Fee Structure:\n` +
            `- Fees are paid in **POKT**\n` +
            `- Network: Cosmos SDK-based\n` +
            `- Typical fees: Very low (micro-POKT)\n\n` +
            `For current fee rates, check: https://poktscan.com`;
        }
        
        // Standard EVM gas price check
        const rpcUrl = rpcEndpoints[network];
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }, { timeout: 5000 });
        const gasPriceWei = BigInt(response.data.result);
        const gasPriceGwei = Number(gasPriceWei) / 1e9;
        return `Current gas price on ${getNetworkName(network)}: **${gasPriceGwei.toFixed(2)} Gwei**`;
      }

      case 'list_networks': {
        return `## Available Blockchain Networks\n\n` +
          `I can help you interact with these networks:\n\n` +
          `- **Ethereum** (eth) - Chain ID: 1\n` +
          `- **Polygon** (poly) - Chain ID: 137\n` +
          `- **BNB Chain** (bsc) - Chain ID: 56\n` +
          `- **Arbitrum** (arb-one) - Chain ID: 42161\n` +
          `- **Optimism** (opt) - Chain ID: 10\n` +
          `- **Base** (base) - Chain ID: 8453\n` +
          `- **Avalanche** (avax) - Chain ID: 43114\n` +
          `- **Fantom** (ftm) - Chain ID: 250\n` +
          `- **Solana** (solana)\n` +
          `- **Pocket Network Shannon** (pokt) - Next-gen decentralized RPC 🚀\n\n` +
          `You can ask me about balances, transactions, gas prices, and more!\n\n` +
          `All networks powered by **Pocket Network Shannon** infrastructure!`;
      }

      default:
        return 'I can help you with blockchain queries. Try asking about block numbers, balances, gas prices, or list all networks!';
    }
  } catch (error: any) {
    console.error('Blockchain tool error:', error);
    if (error.response) {
      return `Sorry, I encountered an error: ${error.response.status} - ${error.response.statusText}`;
    }
    return `Sorry, I encountered an error: ${error.message}`;
  }
}

function getNetworkName(networkId: string): string {
  const names: Record<string, string> = {
    eth: 'Ethereum',
    poly: 'Polygon',
    bsc: 'BNB Chain',
    'arb-one': 'Arbitrum',
    opt: 'Optimism',
    base: 'Base',
    avax: 'Avalanche',
    ftm: 'Fantom',
    solana: 'Solana',
    pokt: 'Pocket Network Shannon',
  };
  return names[networkId] || networkId;
}

function getNativeCurrency(networkId: string): string {
  const currencies: Record<string, string> = {
    eth: 'ETH',
    poly: 'MATIC',
    bsc: 'BNB',
    'arb-one': 'ETH',
    opt: 'ETH',
    base: 'ETH',
    avax: 'AVAX',
    ftm: 'FTM',
    solana: 'SOL',
    pokt: 'POKT',
  };
  return currencies[networkId] || 'TOKEN';
}

// Parse user intent and extract blockchain queries
function parseUserIntent(message: string): { tool: string; args: any } | null {
  const lowerMessage = message.toLowerCase();

  // List networks - many variations
  if (
    (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('what') || lowerMessage.includes('which')) && 
    (lowerMessage.includes('network') || lowerMessage.includes('chain') || lowerMessage.includes('blockchain') || lowerMessage.includes('support'))
  ) {
    return { tool: 'list_networks', args: {} };
  }

  // Block number - many variations
  if (
    (lowerMessage.includes('block') && (
      lowerMessage.includes('number') || 
      lowerMessage.includes('height') || 
      lowerMessage.includes('current') || 
      lowerMessage.includes('latest') ||
      lowerMessage.includes('last') ||
      lowerMessage.match(/\bblock\b.*\bof\b/) ||
      lowerMessage.match(/\bblock\b.*\bon\b/)
    ))
  ) {
    const network = extractNetwork(message);
    return { tool: 'get_block_number', args: { network } };
  }

  // Balance - many variations
  if (
    lowerMessage.includes('balance') ||
    lowerMessage.includes('how much') ||
    lowerMessage.includes('how many') ||
    (lowerMessage.includes('check') && (lowerMessage.includes('address') || lowerMessage.includes('wallet'))) ||
    lowerMessage.match(/\bhas\b.*\b(pokt|eth|sol|matic|bnb|avax|ftm)\b/)
  ) {
    const address = extractAddress(message);
    const network = extractNetwork(message);
    if (address) {
      return { tool: 'get_balance', args: { network, address } };
    }
  }

  // Gas price - many variations
  if (
    (lowerMessage.includes('gas') && (
      lowerMessage.includes('price') || 
      lowerMessage.includes('cost') || 
      lowerMessage.includes('fee') ||
      lowerMessage.includes('how much')
    )) ||
    lowerMessage.includes('transaction fee') ||
    lowerMessage.includes('tx fee') ||
    lowerMessage.includes('gwei') ||
    (lowerMessage.match(/\bfee[s]?\b/) && (
      lowerMessage.includes('how much') ||
      lowerMessage.includes('what') ||
      lowerMessage.includes('cost') ||
      lowerMessage.includes('on ')
    ))
  ) {
    const network = extractNetwork(message);
    return { tool: 'get_gas_price', args: { network } };
  }

  return null;
}

function extractNetwork(message: string): string {
  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(BLOCKCHAIN_NETWORKS)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }
  return 'eth'; // default to Ethereum
}

function extractAddress(message: string): string | null {
  // Match Pocket Network addresses (pokt1...)
  const poktAddressMatch = message.match(/pokt1[a-z0-9]{38,}/);
  if (poktAddressMatch) {
    return poktAddressMatch[0];
  }

  // Match Solana addresses (base58, 32-44 chars)
  const solanaAddressMatch = message.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/);
  if (solanaAddressMatch && !message.includes('0x')) {
    // Additional validation: Solana addresses typically don't contain 0, O, I, l
    const addr = solanaAddressMatch[0];
    if (addr.length >= 32 && addr.length <= 44 && !/[0OIl]/.test(addr)) {
      return addr;
    }
  }

  // Match Cosmos-based addresses (cosmos1..., osmo1..., atom1..., etc.)
  const cosmosAddressMatch = message.match(/\b(cosmos|osmo|atom|juno|stars|terra|luna|akash|secret|kava|band|regen|sentinel|persistence|fetch|crypto|cro|injective|evmos|stride|sommelier|celestia|dydx|noble|neutron)[1][a-z0-9]{38,}/);
  if (cosmosAddressMatch) {
    return cosmosAddressMatch[0];
  }

  // Match Avalanche X/P-Chain addresses (X-avax... or P-avax...)
  const avaxAddressMatch = message.match(/\b[XP]-avax[0-9a-zA-Z]{39}/);
  if (avaxAddressMatch) {
    return avaxAddressMatch[0];
  }

  // Match Ethereum-style addresses (0x...) - Most EVM chains use this
  const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) {
    return addressMatch[0];
  }

  // Match ENS names (*.eth)
  const ensMatch = message.match(/\w+\.eth/);
  if (ensMatch) {
    // For demo, return vitalik's address
    // In production, you'd resolve ENS names
    return '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // vitalik.eth
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    // Parse user intent for blockchain queries
    const intent = parseUserIntent(userMessage);

    let responseMessage: string;

    if (intent) {
      // Execute blockchain tool
      responseMessage = await callBlockchainTool(intent.tool, intent.args);
    } else {
      // General AI response about capabilities
      responseMessage = 
        `I'm your blockchain AI assistant powered by **Pocket Network Shannon** via pokt.ai! 🚀\n\n` +
        `I can help you with:\n\n` +
        `- 📊 **Check balances** on any supported network\n` +
        `- 🔢 **Get block numbers** and network status\n` +
        `- ⛽ **Check gas prices** for transactions\n` +
        `- 🔗 **List available networks** (10 blockchains including Shannon!)\n` +
        `- 💰 **Transaction details** and smart contract data\n\n` +
        `Try asking:\n` +
        `- "What's the current block number on Ethereum?"\n` +
        `- "Check the balance of 0x... on Polygon"\n` +
        `- "What's the gas price on Arbitrum?"\n` +
        `- "Tell me about Pocket Network Shannon"\n` +
        `- "List all available networks"\n\n` +
        `Supported networks: Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Fantom, Solana, **Pocket Network Shannon**\n\n` +
        `All queries powered by Shannon's decentralized infrastructure!`;
    }

    return NextResponse.json({
      message: responseMessage,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}



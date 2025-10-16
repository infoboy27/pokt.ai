#!/usr/bin/env node

/**
 * chat.pokt.ai MCP Server
 * 
 * Model Context Protocol server for AI-powered blockchain interactions
 * Powered by Pocket Network Shannon + Grove via pokt.ai
 * 
 * This server enables AI assistants (Claude, ChatGPT, etc.) to interact with
 * all major blockchain networks through a unified, intelligent interface.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { ethers } from 'ethers';
import { BLOCKCHAIN_NETWORKS, getNetwork, getEnabledNetworks } from './networks.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration
const SERVER_NAME = process.env.MCP_SERVER_NAME || 'chat.pokt.ai';
const SERVER_VERSION = process.env.MCP_SERVER_VERSION || '1.0.0';
const POKTAI_GATEWAY = process.env.POKTAI_GATEWAY_URL || 'https://pokt.ai/api/gateway';

/**
 * MCP Server for blockchain interactions via pokt.ai
 */
class PoktAIMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_networks':
            return await this.listNetworks();
          
          case 'get_block_number':
            return await this.getBlockNumber(args);
          
          case 'get_balance':
            return await this.getBalance(args);
          
          case 'get_transaction':
            return await this.getTransaction(args);
          
          case 'get_gas_price':
            return await this.getGasPrice(args);
          
          case 'call_contract':
            return await this.callContract(args);
          
          case 'send_rpc_request':
            return await this.sendRPCRequest(args);
          
          case 'get_token_info':
            return await this.getTokenInfo(args);
          
          case 'estimate_gas':
            return await this.estimateGas(args);

          case 'get_chain_info':
            return await this.getChainInfo(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get list of available MCP tools
   */
  private getAvailableTools(): Tool[] {
    return [
      {
        name: 'list_networks',
        description: 'List all available blockchain networks supported by Pocket Network via pokt.ai',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_block_number',
        description: 'Get the current block number for a blockchain network',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID (e.g., "eth", "poly", "bsc", "arb-one", "opt", "base", "avax", "solana")',
            },
          },
          required: ['network'],
        },
      },
      {
        name: 'get_balance',
        description: 'Get the native token balance of an address on any blockchain',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
            address: {
              type: 'string',
              description: 'Wallet address to check',
            },
          },
          required: ['network', 'address'],
        },
      },
      {
        name: 'get_transaction',
        description: 'Get transaction details by hash',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
            txHash: {
              type: 'string',
              description: 'Transaction hash',
            },
          },
          required: ['network', 'txHash'],
        },
      },
      {
        name: 'get_gas_price',
        description: 'Get current gas price for an EVM network',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID (EVM networks only)',
            },
          },
          required: ['network'],
        },
      },
      {
        name: 'call_contract',
        description: 'Call a smart contract method (read-only)',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
            contractAddress: {
              type: 'string',
              description: 'Contract address',
            },
            method: {
              type: 'string',
              description: 'Method signature (e.g., "balanceOf(address)")',
            },
            params: {
              type: 'array',
              description: 'Method parameters',
            },
            abi: {
              type: 'array',
              description: 'Contract ABI (optional, for complex calls)',
            },
          },
          required: ['network', 'contractAddress', 'method'],
        },
      },
      {
        name: 'send_rpc_request',
        description: 'Send a custom JSON-RPC request to any blockchain network',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
            method: {
              type: 'string',
              description: 'RPC method name',
            },
            params: {
              type: 'array',
              description: 'RPC parameters',
            },
          },
          required: ['network', 'method'],
        },
      },
      {
        name: 'get_token_info',
        description: 'Get ERC20/SPL token information (name, symbol, decimals, totalSupply)',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
            tokenAddress: {
              type: 'string',
              description: 'Token contract address',
            },
          },
          required: ['network', 'tokenAddress'],
        },
      },
      {
        name: 'estimate_gas',
        description: 'Estimate gas cost for a transaction',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID (EVM only)',
            },
            from: {
              type: 'string',
              description: 'Sender address',
            },
            to: {
              type: 'string',
              description: 'Recipient address',
            },
            data: {
              type: 'string',
              description: 'Transaction data (hex)',
            },
            value: {
              type: 'string',
              description: 'Value to send (in wei)',
            },
          },
          required: ['network', 'to'],
        },
      },
      {
        name: 'get_chain_info',
        description: 'Get detailed information about a blockchain network',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
          },
          required: ['network'],
        },
      },
    ];
  }

  /**
   * List all available networks
   */
  private async listNetworks() {
    const networks = getEnabledNetworks();
    
    const networkList = networks.map((n) => ({
      id: n.id,
      name: n.name,
      chainId: n.chainId,
      serviceId: n.serviceId,
      category: n.category,
      nativeCurrency: n.nativeCurrency.symbol,
      explorer: n.explorer,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(networkList, null, 2),
        },
      ],
    };
  }

  /**
   * Get current block number
   */
  private async getBlockNumber(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    const result = await this.rpcCall(network.rpcUrl, 'eth_blockNumber', []);
    const blockNumber = parseInt(result, 16);

    return {
      content: [
        {
          type: 'text',
          text: `Current block number on ${network.name}: ${blockNumber.toLocaleString()}`,
        },
      ],
    };
  }

  /**
   * Get balance
   */
  private async getBalance(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    const result = await this.rpcCall(network.rpcUrl, 'eth_getBalance', [args.address, 'latest']);
    const balanceWei = BigInt(result);
    const balance = Number(balanceWei) / Math.pow(10, network.nativeCurrency.decimals);

    return {
      content: [
        {
          type: 'text',
          text: `Balance: ${balance.toFixed(6)} ${network.nativeCurrency.symbol}`,
        },
      ],
    };
  }

  /**
   * Get transaction details
   */
  private async getTransaction(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    const result = await this.rpcCall(network.rpcUrl, 'eth_getTransactionByHash', [args.txHash]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Get gas price
   */
  private async getGasPrice(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    const result = await this.rpcCall(network.rpcUrl, 'eth_gasPrice', []);
    const gasPriceWei = BigInt(result);
    const gasPriceGwei = Number(gasPriceWei) / 1e9;

    return {
      content: [
        {
          type: 'text',
          text: `Gas price on ${network.name}: ${gasPriceGwei.toFixed(2)} Gwei`,
        },
      ],
    };
  }

  /**
   * Call smart contract
   */
  private async callContract(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Simple contract call encoding
    const methodId = ethers.id(args.method).slice(0, 10);
    const data = methodId; // Simplified - would need proper ABI encoding for params

    const result = await this.rpcCall(network.rpcUrl, 'eth_call', [
      {
        to: args.contractAddress,
        data: data,
      },
      'latest',
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Contract call result: ${result}`,
        },
      ],
    };
  }

  /**
   * Send custom RPC request
   */
  private async sendRPCRequest(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    const result = await this.rpcCall(network.rpcUrl, args.method, args.params || []);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Get token information
   */
  private async getTokenInfo(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    if (network.category !== 'evm') {
      throw new Error('Token info only available for EVM networks');
    }

    // ERC20 standard method signatures
    const nameMethod = '0x06fdde03';
    const symbolMethod = '0x95d89b41';
    const decimalsMethod = '0x313ce567';
    const totalSupplyMethod = '0x18160ddd';

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.rpcCall(network.rpcUrl, 'eth_call', [{ to: args.tokenAddress, data: nameMethod }, 'latest']),
      this.rpcCall(network.rpcUrl, 'eth_call', [{ to: args.tokenAddress, data: symbolMethod }, 'latest']),
      this.rpcCall(network.rpcUrl, 'eth_call', [{ to: args.tokenAddress, data: decimalsMethod }, 'latest']),
      this.rpcCall(network.rpcUrl, 'eth_call', [{ to: args.tokenAddress, data: totalSupplyMethod }, 'latest']),
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            address: args.tokenAddress,
            name: this.decodeString(name),
            symbol: this.decodeString(symbol),
            decimals: parseInt(decimals, 16),
            totalSupply: totalSupply,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Estimate gas
   */
  private async estimateGas(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    const txObject: any = {
      to: args.to,
    };

    if (args.from) txObject.from = args.from;
    if (args.data) txObject.data = args.data;
    if (args.value) txObject.value = args.value;

    const result = await this.rpcCall(network.rpcUrl, 'eth_estimateGas', [txObject]);
    const gasEstimate = parseInt(result, 16);

    return {
      content: [
        {
          type: 'text',
          text: `Estimated gas: ${gasEstimate.toLocaleString()} units`,
        },
      ],
    };
  }

  /**
   * Get chain information
   */
  private async getChainInfo(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: network.id,
            name: network.name,
            chainId: network.chainId,
            serviceId: network.serviceId,
            category: network.category,
            nativeCurrency: network.nativeCurrency,
            explorer: network.explorer,
            isTestnet: network.isTestnet,
            rpcUrl: network.rpcUrl,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Make RPC call via pokt.ai gateway
   */
  private async rpcCall(rpcUrl: string, method: string, params: any[]): Promise<any> {
    try {
      const response = await axios.post(
        rpcUrl,
        {
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error.message || 'RPC error');
      }

      return response.data.result;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`RPC error: ${error.response.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Decode ABI-encoded string
   */
  private decodeString(hex: string): string {
    try {
      if (!hex || hex === '0x') return '';
      // Simple string decoding - would need proper ABI decoder for production
      const data = hex.slice(2);
      let result = '';
      for (let i = 0; i < data.length; i += 2) {
        const char = String.fromCharCode(parseInt(data.substr(i, 2), 16));
        if (char.charCodeAt(0) > 31 && char.charCodeAt(0) < 127) {
          result += char;
        }
      }
      return result.trim();
    } catch {
      return hex;
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
    console.error('Powered by pokt.ai - AI-powered blockchain interactions');
    console.error(`Supporting ${getEnabledNetworks().length} blockchain networks via Pocket Network`);
  }
}

// Start the server
const server = new PoktAIMCPServer();
server.run().catch(console.error);








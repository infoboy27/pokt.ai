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
const LLAMA_API_URL = process.env.LLAMA_API_URL || 'http://localhost:8000/api/llm/query';

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

          case 'llm_query':
            return await this.llmQuery(args);

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
        description: 'Get the native token balance of one or more addresses on any blockchain. Can accept a single address (string) or multiple addresses (array of strings)',
        inputSchema: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              description: 'Network ID',
            },
            address: {
              oneOf: [
                {
                  type: 'string',
                  description: 'Single wallet address to check',
                },
                {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Multiple wallet addresses to check',
                },
              ],
              description: 'Wallet address(es) to check - can be a single address or an array of addresses',
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
      {
        name: 'llm_query',
        description: 'Query the local Llama model for blockchain-related questions. The model can answer questions about gas prices, balances, transactions, and other blockchain data.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The question or query to ask the Llama model',
            },
            network: {
              type: 'string',
              description: 'Network ID (e.g., "eth", "poly", "bsc") - optional but recommended for network-specific queries',
            },
          },
          required: ['query'],
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

    // Use Llama API for all queries
    return await this.llmQuery({
      query: `What is the current block number on ${network.name}?`,
      network: args.network,
    });
  }

  /**
   * Get balance - supports single or multiple addresses
   */
  private async getBalance(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Handle multiple addresses
    const addresses = Array.isArray(args.address) ? args.address : [args.address];

    if (addresses.length === 1) {
      // Single address - simple query
      return await this.llmQuery({
        query: `What is the balance of ${addresses[0]} on ${network.name}?`,
        network: args.network,
      });
    }

    // Multiple addresses - query each separately and combine results
    const queries = addresses.map((addr: string) =>
      this.llmQuery({
        query: `What is the balance of ${addr} on ${network.name}?`,
        network: args.network,
      })
    );

    try {
      const results = await Promise.all(queries);
      
      // Combine all responses
      const combinedResponses = results
        .map((result, index) => {
          const text = result.content[0]?.text || '';
          return `Address ${addresses[index]}: ${text}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Balances for ${addresses.length} addresses on ${network.name}:\n\n${combinedResponses}`,
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Error querying balances: ${error.message}`);
    }
  }

  /**
   * Get transaction details
   */
  private async getTransaction(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Use Llama API for all queries
    return await this.llmQuery({
      query: `Get transaction details for ${args.txHash} on ${network.name}`,
      network: args.network,
    });
  }

  /**
   * Get gas price
   */
  private async getGasPrice(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Use Llama API for all queries
    return await this.llmQuery({
      query: `What is the current gas price on ${network.name}?`,
      network: args.network,
    });
  }

  /**
   * Call smart contract
   */
  private async callContract(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Use Llama API for all queries
    const paramsStr = args.params && args.params.length > 0 
      ? ` with parameters ${JSON.stringify(args.params)}` 
      : '';
    return await this.llmQuery({
      query: `Call contract method ${args.method} on contract ${args.contractAddress}${paramsStr} on ${network.name}`,
      network: args.network,
    });
  }

  /**
   * Send custom RPC request
   */
  private async sendRPCRequest(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Use Llama API for all queries - convert RPC method to natural language
    const paramsStr = args.params && args.params.length > 0 
      ? ` with parameters ${JSON.stringify(args.params)}` 
      : '';
    return await this.llmQuery({
      query: `Execute RPC method ${args.method}${paramsStr} on ${network.name}`,
      network: args.network,
    });
  }

  /**
   * Get token information
   */
  private async getTokenInfo(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Use Llama API for all queries
    return await this.llmQuery({
      query: `Get token information (name, symbol, decimals, total supply) for token at address ${args.tokenAddress} on ${network.name}`,
      network: args.network,
    });
  }

  /**
   * Estimate gas
   */
  private async estimateGas(args: any) {
    const network = getNetwork(args.network);
    if (!network) {
      throw new Error(`Network not found: ${args.network}`);
    }

    // Use Llama API for all queries
    const txDesc = `from ${args.from || 'unknown'} to ${args.to}${args.value ? ` with value ${args.value}` : ''}${args.data ? ` with data ${args.data}` : ''}`;
    return await this.llmQuery({
      query: `Estimate gas cost for transaction ${txDesc} on ${network.name}`,
      network: args.network,
    });
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
   * Query local Llama model
   * Enhanced to handle multiple addresses by splitting into separate queries
   */
  private async llmQuery(args: any) {
    if (!args.query) {
      throw new Error('Query is required');
    }

    try {
      // Extract addresses from query if multiple are present
      // Also detect ENS names (e.g., alice.eth)
      const addressRegex = /0x[a-fA-F0-9]{40}/g;
      const ensRegex = /\b[a-zA-Z0-9-]+\.eth\b/g;
      const addresses = args.query.match(addressRegex) || [];
      const ensNames = args.query.match(ensRegex) || [];
      
      // Count total identifiers (addresses + ENS names)
      const totalIdentifiers = addresses.length + ensNames.length;
      
      // If multiple identifiers detected, split into separate queries and combine results
      if (totalIdentifiers > 1) {
        const queries: Promise<any>[] = [];
        const identifiers: string[] = [];
        
        // Helper function to create a clean single query
        const createSingleQuery = (identifier: string): string => {
          // Check if query has multiple separate clauses (e.g., "check X and check Y")
          const hasMultipleClauses = /\b(check|get|what|show|find)\b.*\b(and|,)\s*\b(check|get|what|show|find)\b/i.test(args.query);
          
          if (hasMultipleClauses) {
            // Split by "and" or comma, find the clause containing this identifier
            const clauses = args.query.split(/\s+(and|,)\s+/i);
            for (const clause of clauses) {
              if (clause.includes(identifier) || clause.match(/\b(check|get|what|show|find)\b/i)) {
                // Extract the action verb and construct query
                const actionMatch = clause.match(/\b(check|get|what|show|find|balance)\b/i);
                if (actionMatch) {
                  const action = actionMatch[0].toLowerCase();
                  // Create a clean query: "What is the balance of [identifier]"
                  return `What is the balance of ${identifier}`;
                }
              }
            }
          }
          
          // For multiple identifiers, always use simple format
          // This ensures clean, unambiguous queries for the Llama API
          return `What is the balance of ${identifier}`;
        };
        
        // Add address queries
        addresses.forEach((addr: string) => {
          identifiers.push(addr);
          const singleQuery = createSingleQuery(addr);
          
          queries.push(
            this.llmQuerySingle({
              query: singleQuery,
              network: args.network,
            })
          );
        });
        
        // Add ENS name queries - resolve ENS to address first
        // Resolve all ENS names first, then create queries to avoid closure issues
        const ensResolutions = await Promise.all(
          ensNames.map(async (ens: string) => {
            try {
              const resolvedAddress = await this.resolveENS(ens, args.network);
              return { ens, address: resolvedAddress };
            } catch (error: any) {
              return { ens, address: null };
            }
          })
        );

        // Now create queries with resolved addresses
        for (const { ens, address } of ensResolutions) {
          identifiers.push(ens);
          // Use resolved address if available, otherwise use ENS name
          const queryIdentifier = address || ens;
          const singleQuery = createSingleQuery(queryIdentifier);
          
          // Debug logging to verify correct resolution
          console.error(`[MCP] Query for ${ens}: "${singleQuery}" (resolved: ${address || 'none'})`);
          
          queries.push(
            this.llmQuerySingle({
              query: singleQuery,
              network: args.network,
            })
          );
        }

        // Execute queries sequentially with delays to prevent caching/race condition issues
        // This ensures each query is processed independently by the Llama API backend
        const results: any[] = [];
        for (let i = 0; i < queries.length; i++) {
          try {
            // Add a small delay between queries to prevent backend caching issues
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
            
            console.error(`[MCP] Executing query ${i + 1}/${queries.length} for ${identifiers[i]}`);
            const result = await queries[i];
            results.push({ status: 'fulfilled', value: result });
          } catch (error: any) {
            console.error(`[MCP] Query ${i + 1} failed for ${identifiers[i]}:`, error.message);
            results.push({ status: 'rejected', reason: error });
          }
        }
        
        const combinedText = results
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              const text = result.value.content[0]?.text || '';
              return `**${identifiers[index]}**: ${text}`;
            } else {
              // Handle error for this specific query
              return `**${identifiers[index]}**: Error - ${result.reason?.message || 'Failed to get balance'}`;
            }
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: combinedText,
            },
          ],
        };
      }

      // Single query (or no addresses detected) - use the single query method
      return await this.llmQuerySingle(args);
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Llama API error: ${error.response.data?.error || error.response.data?.message || error.message}`);
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Llama API at ${LLAMA_API_URL}. Make sure the Llama service is running.`);
      }
      throw error;
    }
  }

  /**
   * Resolve ENS name to Ethereum address
   */
  private async resolveENS(ensName: string, network: string): Promise<string | null> {
    // Only resolve ENS on Ethereum mainnet
    if (network !== 'eth') {
      return null;
    }

    try {
      // Use ethers.js to resolve ENS name
      const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      const address = await provider.resolveName(ensName);
      if (address) {
        return address;
      }
    } catch (error) {
      // ENS resolution failed, return null to use ENS name as-is
      console.error(`Failed to resolve ENS ${ensName}:`, error);
    }
    
    return null;
  }

  /**
   * Single Llama API query (internal method)
   */
  private async llmQuerySingle(args: any) {
    const requestBody: any = {
      query: args.query,
    };

    // Add network if provided
    if (args.network) {
      requestBody.network = args.network;
    }

    // Add a unique timestamp to prevent caching issues
    // This ensures each query is treated as unique by the backend
    // Add unique identifiers to prevent caching issues
    const queryId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    requestBody.timestamp = Date.now();
    requestBody.queryId = queryId;
    requestBody._uniqueId = queryId; // Additional unique field

    console.error(`[MCP] Sending query: "${args.query.substring(0, 60)}..." (id: ${queryId})`);

    const response = await axios.post(
      LLAMA_API_URL,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // Llama models can take longer
      }
    );

    // Handle different response formats
    let responseText: string;
    if (typeof response.data === 'string') {
      responseText = response.data;
    } else if (response.data.formattedResponse) {
      // Llama API returns formattedResponse field
      responseText = response.data.formattedResponse;
    } else if (response.data.response || response.data.answer || response.data.text) {
      responseText = response.data.response || response.data.answer || response.data.text;
    } else if (response.data.data) {
      responseText = typeof response.data.data === 'string' 
        ? response.data.data 
        : JSON.stringify(response.data.data, null, 2);
    } else {
      responseText = JSON.stringify(response.data, null, 2);
    }

    // Log response for debugging
    console.error(`[MCP] Received response for query "${args.query.substring(0, 50)}...": ${responseText.substring(0, 100)}...`);

    return {
      content: [
        {
          type: 'text',
          text: responseText,
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








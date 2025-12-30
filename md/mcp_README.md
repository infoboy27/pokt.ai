# chat.pokt.ai MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Pocket Network](https://img.shields.io/badge/Powered%20by-Pocket%20Network-blue)](https://www.pokt.network/)

**AI-Powered Blockchain Interactions via Pocket Network**

Model Context Protocol (MCP) server that enables AI assistants like Claude, ChatGPT, and other LLMs to interact with all major blockchain networks through Pocket Network's decentralized infrastructure.

Powered by [pokt.ai](https://pokt.ai) 🚀

---

## 🌟 Features

- **🔗 Multi-Chain Support**: Access 9+ blockchain networks (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Fantom, Solana)
- **🤖 AI-Native**: Built specifically for AI assistants using the Model Context Protocol
- **⚡ Decentralized**: Powered by Pocket Network Shannon + Grove infrastructure
- **🛡️ Production-Ready**: Enterprise-grade reliability and performance
- **📊 Rich Functionality**: Balance queries, transactions, smart contracts, gas estimation, and more
- **🎨 Simple API**: Clean, intuitive interface for blockchain interactions

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
cd /home/ubuntu/pokt.ai/mcp

# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Build the project
npm run build

# Start the server
npm start
```

### Configuration

Edit `.env` file with your settings:

```env
# Pocket Network Shannon API
POKT_API_URL=https://shannon-grove-api.mainnet.poktroll.com

# pokt.ai Gateway (optional, for enhanced features)
POKTAI_GATEWAY_URL=https://pokt.ai/api/gateway

# Network RPC endpoints (provided by pokt.ai)
ETH_RPC_URL=http://135.125.163.236:4000/v1/rpc/eth
POLY_RPC_URL=http://135.125.163.236:4000/v1/rpc/poly
# ... more networks

# Local Llama Model API (optional)
LLAMA_API_URL=http://localhost:8000/api/llm/query
```

---

## 🔧 Supported Networks

| Network | Chain ID | Category | Status |
|---------|----------|----------|--------|
| **Ethereum** | 1 | EVM | ✅ Active |
| **Polygon** | 137 | EVM | ✅ Active |
| **BNB Chain** | 56 | EVM | ✅ Active |
| **Arbitrum** | 42161 | EVM | ✅ Active |
| **Optimism** | 10 | EVM | ✅ Active |
| **Base** | 8453 | EVM | ✅ Active |
| **Avalanche** | 43114 | EVM | ✅ Active |
| **Fantom** | 250 | EVM | ✅ Active |
| **Solana** | - | Solana | ✅ Active |

**Total: 9+ networks with more coming soon!**

---

## 📚 Available Tools

### 1. **list_networks**
List all available blockchain networks

```json
{
  "name": "list_networks"
}
```

### 2. **get_block_number**
Get current block number for any network

```json
{
  "name": "get_block_number",
  "arguments": {
    "network": "eth"
  }
}
```

### 3. **get_balance**
Check wallet balance on any blockchain

```json
{
  "name": "get_balance",
  "arguments": {
    "network": "eth",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

### 4. **get_transaction**
Get transaction details by hash

```json
{
  "name": "get_transaction",
  "arguments": {
    "network": "poly",
    "txHash": "0x..."
  }
}
```

### 5. **get_gas_price**
Get current gas price (EVM networks)

```json
{
  "name": "get_gas_price",
  "arguments": {
    "network": "eth"
  }
}
```

### 6. **call_contract**
Call smart contract methods (read-only)

```json
{
  "name": "call_contract",
  "arguments": {
    "network": "eth",
    "contractAddress": "0x...",
    "method": "balanceOf(address)",
    "params": ["0x..."]
  }
}
```

### 7. **send_rpc_request**
Send custom JSON-RPC requests

```json
{
  "name": "send_rpc_request",
  "arguments": {
    "network": "arb-one",
    "method": "eth_call",
    "params": [...]
  }
}
```

### 8. **get_token_info**
Get ERC20 token information

```json
{
  "name": "get_token_info",
  "arguments": {
    "network": "eth",
    "tokenAddress": "0x..."
  }
}
```

### 9. **estimate_gas**
Estimate gas cost for transactions

```json
{
  "name": "estimate_gas",
  "arguments": {
    "network": "eth",
    "from": "0x...",
    "to": "0x...",
    "data": "0x..."
  }
}
```

### 10. **get_chain_info**
Get detailed network information

```json
{
  "name": "get_chain_info",
  "arguments": {
    "network": "base"
  }
}
```

### 11. **llm_query** 🆕
Query the local Llama model for blockchain-related questions (natural language queries)

```json
{
  "name": "llm_query",
  "arguments": {
    "query": "What is the current gas price?",
    "network": "eth"
  }
}
```

**Note:** Requires a local Llama model running at `http://localhost:8000/api/llm/query`. See [LLAMA_INTEGRATION.md](./LLAMA_INTEGRATION.md) for details.

---

## 🤖 Usage with AI Assistants

### Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "poktai": {
      "command": "node",
      "args": ["/home/ubuntu/pokt.ai/mcp/dist/index.js"],
      "env": {
        "POKT_API_URL": "https://shannon-grove-api.mainnet.poktroll.com"
      }
    }
  }
}
```

### Example AI Prompts

```
"What's the current block number on Ethereum?"
"Check the balance of 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb on Polygon"
"Get the gas price on Arbitrum"
"What are all the blockchains I can interact with?"
"Show me transaction details for 0x... on BSC"
```

---

## 🏗️ Architecture

```
AI Assistant (Claude/ChatGPT)
        │
        ↓
   MCP Protocol
        │
        ↓
 chat.pokt.ai Server
        │
        ↓
  pokt.ai Gateway
        │
        ↓
Pocket Network Shannon
        │
        ↓
  Blockchain Nodes
   (ETH, POLY, etc.)
```

---

## 🛠️ Development

### Build

```bash
npm run build
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Watch Mode

```bash
npm run watch
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

---

## 📖 API Documentation

### Network IDs

- `eth` - Ethereum Mainnet
- `poly` - Polygon
- `bsc` - BNB Smart Chain
- `arb-one` - Arbitrum One
- `opt` - Optimism
- `base` - Base
- `avax` - Avalanche C-Chain
- `ftm` - Fantom Opera
- `solana` - Solana Mainnet

### Response Format

All tools return MCP-compliant responses:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Result data here"
    }
  ]
}
```

---

## 🌐 Use Cases

### DeFi Analysis
- Check token balances across multiple chains
- Monitor gas prices for optimal transaction timing
- Analyze smart contract states

### NFT Tools
- Query NFT ownership
- Check collection metadata
- Track NFT transfers

### Portfolio Management
- Multi-chain balance aggregation
- Transaction history analysis
- Cost basis calculation

### Development Tools
- Quick blockchain queries during development
- Contract testing and debugging
- Network status monitoring

---

## 🔒 Security

- **Read-Only Operations**: All default tools are read-only
- **No Private Keys**: Never handles private keys or signing
- **Rate Limiting**: Built-in protection via pokt.ai
- **Error Handling**: Comprehensive error messages

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../README.md) for details.

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📊 Performance

- **Latency**: < 500ms average response time
- **Uptime**: 99.9% availability via Pocket Network
- **Scalability**: Handles millions of requests
- **Networks**: 9+ blockchains, growing

---

## 🔗 Links

- **pokt.ai Platform**: https://pokt.ai
- **Pocket Network**: https://www.pokt.network/
- **Shannon API**: https://shannon-grove-api.mainnet.poktroll.com/
- **Documentation**: https://docs.pokt.ai (coming soon)
- **Discord**: Join our community (coming soon)

---

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details

---

## 💡 About

**chat.pokt.ai** is built and maintained by the pokt.ai team. We're building the future of AI-powered blockchain interactions.

**Powered by:**
- 🎯 Pocket Network Shannon - Decentralized RPC infrastructure
- 🚀 pokt.ai - AI-powered blockchain gateway
- 🤖 Model Context Protocol - AI assistant integration standard

---

## 🙏 Acknowledgments

- [Pocket Network](https://www.pokt.network/) for decentralized infrastructure
- [Anthropic](https://www.anthropic.com/) for the Model Context Protocol
- [OpenAI](https://openai.com/) for advancing AI capabilities
- The blockchain community for continuous innovation

---

## 📧 Support

- **Email**: support@pokt.ai
- **Issues**: [GitHub Issues](https://github.com/infoboy27/pokt.ai/issues)
- **Documentation**: [pokt.ai/docs](https://pokt.ai/docs)

---

**Built with ❤️ by pokt.ai**

*Making blockchain accessible to AI assistants worldwide*








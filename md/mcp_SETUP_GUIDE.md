# chat.pokt.ai - Setup Guide

## Installation & Configuration

### 1. Install Dependencies

```bash
cd /home/ubuntu/pokt.ai/mcp
npm install
npm run build
```

### 2. Configure Claude Desktop

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
**Location:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
**Location:** `~/.config/Claude/claude_desktop_config.json` (Linux)

Add this configuration:

```json
{
  "mcpServers": {
    "chat.pokt.ai": {
      "command": "node",
      "args": ["/home/ubuntu/pokt.ai/mcp/dist/index.js"],
      "env": {
        "POKT_API_URL": "https://shannon-grove-api.mainnet.poktroll.com",
        "POKTAI_GATEWAY_URL": "https://pokt.ai/api/gateway"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

---

## Usage Examples

### Example 1: Check Ethereum Block Number

**Prompt:** "What's the current block number on Ethereum?"

**Response:** Claude will use the `get_block_number` tool with network "eth"

### Example 2: Check Wallet Balance

**Prompt:** "Check the ETH balance of 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

**Response:** Claude will use the `get_balance` tool

### Example 3: Multi-Chain Balance Check

**Prompt:** "Check my balance on Ethereum, Polygon, and Arbitrum for address 0x..."

**Response:** Claude will call `get_balance` three times for different networks

### Example 4: Gas Price Monitoring

**Prompt:** "What's the current gas price on Ethereum and Polygon?"

**Response:** Claude will use `get_gas_price` for both networks

### Example 5: Transaction Details

**Prompt:** "Show me details for transaction 0x... on BSC"

**Response:** Claude will use `get_transaction` tool

### Example 6: List All Networks

**Prompt:** "What blockchains can I interact with?"

**Response:** Claude will use `list_networks` to show all 9+ supported chains

### Example 7: Smart Contract Call

**Prompt:** "Call the balanceOf method on USDC contract at 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 on Ethereum"

**Response:** Claude will use `call_contract` tool

### Example 8: Token Information

**Prompt:** "Get information about the token at 0x... on Polygon"

**Response:** Claude will use `get_token_info` to fetch name, symbol, decimals, etc.

---

## Supported Networks

| ID | Network | Chain ID | Native Token |
|----|---------|----------|--------------|
| eth | Ethereum | 1 | ETH |
| poly | Polygon | 137 | MATIC |
| bsc | BNB Chain | 56 | BNB |
| arb-one | Arbitrum | 42161 | ETH |
| opt | Optimism | 10 | ETH |
| base | Base | 8453 | ETH |
| avax | Avalanche | 43114 | AVAX |
| ftm | Fantom | 250 | FTM |
| solana | Solana | - | SOL |

---

## Advanced Usage

### Custom RPC Requests

**Prompt:** "Send a custom eth_call to contract 0x... with method signature 0x..."

Claude can use the `send_rpc_request` tool for any custom JSON-RPC call.

### Gas Estimation

**Prompt:** "Estimate gas cost for sending 0.1 ETH from 0x... to 0x..."

Claude will use `estimate_gas` tool.

### Network Information

**Prompt:** "Tell me about the Base network"

Claude will use `get_chain_info` tool.

---

## Troubleshooting

### MCP Server Not Appearing

1. Check Claude Desktop config file location
2. Verify JSON syntax is correct
3. Restart Claude Desktop completely
4. Check server logs: Look for error messages in Claude Desktop developer console

### RPC Errors

If you see RPC errors:
1. Check your internet connection
2. Verify pokt.ai gateway is accessible: `curl https://pokt.ai/api/gateway`
3. Check network ID is correct

### Build Errors

```bash
cd /home/ubuntu/pokt.ai/mcp
rm -rf node_modules dist
npm install
npm run build
```

---

## Development

### Running in Development Mode

```bash
npm run dev
```

### Watching for Changes

```bash
npm run watch
```

### Adding New Networks

Edit `src/networks.ts` and add your network configuration:

```typescript
{
  id: 'mynewchain',
  name: 'My New Chain',
  chainId: 12345,
  serviceId: 'MYNEW',
  rpcUrl: 'http://...',
  explorer: 'https://...',
  nativeCurrency: {
    name: 'TOKEN',
    symbol: 'TKN',
    decimals: 18,
  },
  isTestnet: false,
  isEnabled: true,
  category: 'evm',
}
```

Rebuild: `npm run build`

---

## Performance Tips

1. **Batch Requests**: Ask Claude to check multiple networks at once
2. **Cache Results**: Information like network config can be reused
3. **Specific Queries**: Be specific about which network to query

---

## Security Best Practices

1. ✅ **Read-Only**: All default tools are read-only operations
2. ✅ **No Private Keys**: Never share private keys with AI
3. ✅ **Public Data**: Only query public blockchain data
4. ⚠️ **Rate Limits**: Be mindful of rate limits on free tier

---

## Support

- **Documentation**: https://pokt.ai/docs
- **GitHub**: https://github.com/infoboy27/pokt.ai
- **Email**: support@pokt.ai
- **Discord**: Coming soon

---

## What's Next?

### Coming Soon:
- 🔜 Support for 20+ additional networks
- 🔜 WebSocket subscriptions for real-time data
- 🔜 Enhanced Solana support
- 🔜 NFT-specific tools
- 🔜 DeFi protocol integrations

### Feature Requests:
Have an idea? Open an issue on GitHub!

---

**Built with ❤️ by pokt.ai**








# Simplified Setup - Llama API Only

This MCP server now uses **only the Llama API** for all blockchain queries. No other endpoints are required!

## Configuration

**Only one environment variable is needed:**

```bash
LLAMA_API_URL=http://localhost:8000/api/llm/query
```

That's it! All blockchain queries are automatically routed through your Llama API.

## How It Works

All MCP tools now convert their requests to natural language queries and send them to your Llama API:

- `get_block_number` → "What is the current block number on Ethereum?"
- `get_balance` → "What is the balance of 0x... on Polygon?"
- `get_gas_price` → "What is the current gas price on Arbitrum?"
- `get_transaction` → "Get transaction details for 0x... on BSC"
- `call_contract` → "Call contract method balanceOf on contract 0x..."
- And more...

The Llama API intelligently:
1. Parses the natural language query
2. Determines the appropriate RPC method
3. Makes the blockchain call
4. Formats the response in a human-readable way

## Quick Start

1. **Set the Llama API URL:**
   ```bash
   export LLAMA_API_URL=http://localhost:8000/api/llm/query
   ```

2. **Start the MCP server:**
   ```bash
   npm start
   ```

3. **That's it!** All tools will use your Llama API.

## Benefits

✅ **Simplified Configuration** - Only one URL needed  
✅ **No RPC Endpoints Required** - Llama handles everything  
✅ **Natural Language** - All queries are human-readable  
✅ **Intelligent Routing** - Llama determines the right RPC calls  
✅ **Better Responses** - Formatted, human-friendly answers  

## Testing

Test that everything works:

```bash
# Test Llama API directly
curl -X POST http://localhost:8000/api/llm/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the current gas price?","network":"eth"}'

# Test MCP server integration
node test-integration.js
```

## Claude Desktop Configuration

```json
{
  "mcpServers": {
    "chat.pokt.ai": {
      "command": "node",
      "args": ["/home/shannon/poktai/mcp/dist/index.js"],
      "env": {
        "LLAMA_API_URL": "http://localhost:8000/api/llm/query"
      }
    }
  }
}
```

---

**That's all you need!** 🚀


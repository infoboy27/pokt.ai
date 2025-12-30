# Llama Model Integration

This MCP server now includes integration with a local Llama model running on your server.

## Configuration

The Llama API endpoint is configured via environment variable:

```bash
LLAMA_API_URL=http://localhost:8000/api/llm/query
```

You can set this in your `.env` file or pass it as an environment variable when starting the server.

## New Tool: `llm_query`

The MCP server now includes a new tool called `llm_query` that allows AI assistants to query your local Llama model for blockchain-related questions.

### Tool Schema

```json
{
  "name": "llm_query",
  "description": "Query the local Llama model for blockchain-related questions. The model can answer questions about gas prices, balances, transactions, and other blockchain data.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The question or query to ask the Llama model"
      },
      "network": {
        "type": "string",
        "description": "Network ID (e.g., \"eth\", \"poly\", \"bsc\") - optional but recommended for network-specific queries"
      }
    },
    "required": ["query"]
  }
}
```

### Usage Examples

#### Example 1: Gas Price Query
```json
{
  "name": "llm_query",
  "arguments": {
    "query": "What is the current gas price?",
    "network": "eth"
  }
}
```

#### Example 2: Balance Query
```json
{
  "name": "llm_query",
  "arguments": {
    "query": "What is the balance of 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb?",
    "network": "eth"
  }
}
```

#### Example 3: Block Number Query
```json
{
  "name": "llm_query",
  "arguments": {
    "query": "What is the current block number on Ethereum?",
    "network": "eth"
  }
}
```

## Testing

### Direct API Test

Test the Llama API directly:

```bash
curl -X POST http://localhost:8000/api/llm/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the current gas price?","network":"eth"}'
```

### Integration Test

Run the integration test script:

```bash
node test-integration.js
```

This will test multiple queries and verify the integration is working correctly.

## Response Format

The Llama API returns responses in the following format:

```json
{
  "success": true,
  "query": "What is the current gas price?",
  "network": "eth",
  "rpcMethod": "eth_gasPrice",
  "rpcParams": [],
  "explanation": "Get the current gas price in ETH",
  "result": "0x199684d2",
  "formattedResponse": "The current gas price is 0.429 Gwei (429294802 wei).",
  "rawRPCResponse": {
    "id": 1,
    "jsonrpc": "2.0",
    "result": "0x199684d2"
  },
  "timings": {
    "parseTime": "35.964",
    "rpcTime": "0.087",
    "formatTime": "0.000",
    "totalTime": "36.051"
  }
}
```

The MCP server extracts the `formattedResponse` field and returns it to the AI assistant.

## Error Handling

If the Llama API is unavailable, the MCP server will return a helpful error message:

```
Cannot connect to Llama API at http://localhost:8000/api/llm/query. Make sure the Llama service is running.
```

## Use Cases

- **Natural Language Queries**: Ask questions about blockchain data in plain English
- **Gas Price Monitoring**: Query current gas prices across networks
- **Balance Checks**: Check wallet balances using natural language
- **Transaction Analysis**: Ask questions about transactions and blocks
- **Multi-Chain Queries**: Query data across different blockchain networks

## Notes

- The Llama model can take 10-30 seconds to respond, so queries have a 60-second timeout
- Network parameter is optional but recommended for network-specific queries
- The Llama model intelligently parses queries and calls the appropriate RPC methods


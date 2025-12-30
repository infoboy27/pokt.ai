# Quick Start Guide

## Start the MCP Server

**Important:** You must be in the `mcp` directory!

```bash
# Navigate to the mcp directory
cd ~/poktai/mcp

# Set the Llama API URL
export LLAMA_API_URL=http://localhost:8000/api/llm/query

# Start the server
npm start
```

## Alternative: One-liner

```bash
cd ~/poktai/mcp && export LLAMA_API_URL=http://localhost:8000/api/llm/query && npm start
```

## Verify It's Running

The server will output:
```
chat.pokt.ai v1.0.0 started
Powered by pokt.ai - AI-powered blockchain interactions
Supporting 9 blockchain networks via Pocket Network
```

**Note:** MCP servers use stdio transport, so they wait for client connections (like Claude Desktop). This is normal behavior.

## Stop the Server

Press `Ctrl+C` to stop the server.

## Troubleshooting

### "Missing script: start"
- **Problem:** You're not in the `mcp` directory
- **Solution:** Run `cd ~/poktai/mcp` first

### "Cannot find module"
- **Problem:** Dependencies not installed or not built
- **Solution:** 
  ```bash
  cd ~/poktai/mcp
  npm install
  npm run build
  npm start
  ```

### "Cannot connect to Llama API"
- **Problem:** Llama service not running on port 8000
- **Solution:** Make sure your Llama API is running at `http://localhost:8000/api/llm/query`


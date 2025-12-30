# How to Start the MCP Server

## Quick Start

```bash
cd /home/shannon/poktai/mcp
export LLAMA_API_URL=http://localhost:8000/api/llm/query
npm start
```

## Full Rebuild and Restart

```bash
cd /home/shannon/poktai/mcp

# Stop any running servers
pkill -f "node.*dist/index.js"

# Clean and rebuild
rm -rf dist
npm run build

# Start server
export LLAMA_API_URL=http://localhost:8000/api/llm/query
npm start
```

## Or Use the Restart Script

```bash
cd /home/shannon/poktai/mcp
./restart-server.sh
```

Then start manually:
```bash
export LLAMA_API_URL=http://localhost:8000/api/llm/query
npm start
```

## Running in Background

```bash
cd /home/shannon/poktai/mcp
export LLAMA_API_URL=http://localhost:8000/api/llm/query
nohup npm start > mcp.log 2>&1 &
```

View logs:
```bash
tail -f mcp.log
```

## Debug Logging

The server logs to **stderr**. To see debug output:

```bash
# When running in foreground, stderr goes to terminal
npm start

# When running in background, check the log file
tail -f mcp.log
```

You should see logs like:
```
[ENS] Resolved vitalik.eth -> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
[ENS] Resolved alice.eth -> 0xcd2E72aEBe2A203b84f46DEEC948E6465dB51c75
[MCP] Query for vitalik.eth: "What is the balance of 0xd8dA..." (resolved: 0xd8dA...)
[MCP] Query for alice.eth: "What is the balance of 0xcd2E..." (resolved: 0xcd2E...)
```

## Troubleshooting

### Server won't start
- Check if port is in use: `lsof -i :8000`
- Verify build exists: `ls -lh dist/index.js`
- Check Node.js version: `node --version` (should be >= 18)

### Not seeing debug logs
- MCP servers log to stderr, not stdout
- Check if running in background: `ps aux | grep "node.*dist/index.js"`
- View stderr: `npm start 2>&1 | tee mcp-debug.log`

### Still getting same address for different ENS names
- Check the debug logs to see what addresses are being resolved
- Verify ENS resolution is working: `node test-ens-resolution.js`
- Check if Llama API is caching responses


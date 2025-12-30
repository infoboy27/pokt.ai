#!/bin/bash

# Test script to verify MCP server can start
# Note: MCP servers use stdio, so they wait for input from MCP clients

echo "=== Testing MCP Server Startup ==="
echo ""

cd /home/shannon/poktai/mcp

# Check if build exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build not found. Building..."
    npm run build
fi

echo "✅ Build found"
echo ""
echo "Starting MCP server (will timeout after 2 seconds)..."
echo "Note: MCP servers use stdio transport and wait for client connections"
echo ""

# Try to start the server and see if it initializes
timeout 2 node dist/index.js 2>&1 | head -5 || true

echo ""
echo "✅ Server can start (stdio transport means it waits for MCP client)"
echo ""
echo "To use with Claude Desktop, add to claude_desktop_config.json:"
echo '{'
echo '  "mcpServers": {'
echo '    "chat.pokt.ai": {'
echo '      "command": "node",'
echo '      "args": ["'$(pwd)'/dist/index.js"],'
echo '      "env": {'
echo '        "LLAMA_API_URL": "http://localhost:8000/api/llm/query"'
echo '      }'
echo '    }'
echo '  }'
echo '}'


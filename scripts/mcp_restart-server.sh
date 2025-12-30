#!/bin/bash

# Script to rebuild and restart the MCP server

cd /home/shannon/poktai/mcp || exit 1

echo "=== Stopping any running MCP servers ==="
pkill -f "node.*dist/index.js" 2>/dev/null
sleep 1

echo ""
echo "=== Cleaning build ==="
rm -rf dist

echo ""
echo "=== Building project ==="
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "=== Verifying build ==="
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build file not found!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "=== Starting MCP server ==="
echo "Set LLAMA_API_URL environment variable:"
echo "  export LLAMA_API_URL=http://localhost:8000/api/llm/query"
echo ""
echo "Then start with:"
echo "  npm start"
echo ""
echo "Or run in background:"
echo "  nohup npm start > mcp.log 2>&1 &"
echo ""


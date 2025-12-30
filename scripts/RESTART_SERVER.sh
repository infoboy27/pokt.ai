#!/bin/bash
# Script to restart the Next.js dev server

echo "🛑 Stopping existing dev server..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || echo "No process on port 4000"
pkill -f "next dev" 2>/dev/null || echo "No next dev processes found"
sleep 2

echo "🧹 Clearing Next.js cache..."
cd /home/shannon/poktai/apps/web
rm -rf .next
echo "✅ Cache cleared"

echo "🚀 Starting dev server..."
export PATH="/home/shannon/.local/share/pnpm:$PATH"
pnpm dev > /tmp/nextjs-dev.log 2>&1 &
DEV_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

if ps -p $DEV_PID > /dev/null; then
    echo "✅ Dev server started successfully! (PID: $DEV_PID)"
    echo "📝 Logs: tail -f /tmp/nextjs-dev.log"
    echo "🌐 Server: http://localhost:4000"
    echo ""
    echo "To stop the server: kill $DEV_PID"
else
    echo "❌ Server failed to start. Check logs:"
    tail -20 /tmp/nextjs-dev.log
    exit 1
fi


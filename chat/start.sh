#!/bin/bash

# chat.pokt.ai - Startup Script
# Powered by pokt.ai

echo "🚀 Starting chat.pokt.ai..."

# Navigate to chat directory
cd /home/ubuntu/pokt.ai/chat

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from template..."
    cp env.example .env.local
fi

# Build if not already built
if [ ! -d ".next" ]; then
    echo "🔨 Building application..."
    npm run build
fi

# Kill any existing process on port 3006
echo "🔄 Checking for existing processes..."
lsof -ti:3006 | xargs kill -9 2>/dev/null || true

# Start the application
echo "✨ Starting chat.pokt.ai on port 3006..."
npm start &

# Wait a bit and check if it's running
sleep 5
if lsof -Pi :3006 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ chat.pokt.ai is running on http://localhost:3006"
    echo "🌐 Access via: https://chat.pokt.ai (once DNS is configured)"
    echo ""
    echo "📊 Logs: tail -f nohup.out"
    echo "🛑 Stop: killall node"
else
    echo "❌ Failed to start chat.pokt.ai"
    exit 1
fi








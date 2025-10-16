# chat.pokt.ai - Deployment Guide

## ✅ What's Been Created

### 1. **Chat Application** (`/home/ubuntu/pokt.ai/chat/`)
- ✅ Next.js 14 application with ChatGPT-style UI
- ✅ pokt.ai branding (blue/purple gradient)
- ✅ Real-time blockchain queries via Pocket Network
- ✅ Support for 9+ blockchain networks
- ✅ Beautiful, responsive design
- ✅ Built and ready to deploy

### 2. **MCP Server** (`/home/ubuntu/pokt.ai/mcp/`)
- ✅ Model Context Protocol server for Claude Desktop
- ✅ Full blockchain RPC support
- ✅ 10 powerful tools (balance, gas, blocks, etc.)
- ✅ Can be integrated with chat.pokt.ai for enhanced AI

### 3. **Traefik Configuration**
- ✅ Added routing for chat.pokt.ai
- ✅ SSL/HTTPS configured
- ✅ HTTP to HTTPS redirect

---

## 🚀 Quick Start (Already Running!)

The application is **already running** on your server:
- **Local access**: http://localhost:3006
- **Public access**: https://chat.pokt.ai (once DNS is configured)

### Current Status:
```bash
✅ Application built
✅ Server running on port 3006
✅ Traefik configured
⏳ Waiting for DNS configuration
```

---

## 📋 Deployment Steps

### Step 1: Configure DNS (Required)

Add this DNS record to your domain provider (wherever pokt.ai DNS is managed):

```
Type: A
Name: chat
Value: 51.195.63.173  (your server IP)
TTL: 300 (5 minutes)
```

**Or if using a CNAME:**
```
Type: CNAME
Name: chat
Value: pokt.ai
TTL: 300
```

### Step 2: Wait for DNS Propagation (5-30 minutes)

Check DNS propagation:
```bash
# Check from your terminal
nslookup chat.pokt.ai

# Or use online tool
# https://dnschecker.org/#A/chat.pokt.ai
```

### Step 3: SSL Certificate (Automatic)

Once DNS is live, Traefik will automatically:
1. Detect the new domain
2. Request SSL certificate from Let's Encrypt
3. Configure HTTPS

**Check SSL status:**
```bash
docker logs traefik | grep chat.pokt.ai
```

### Step 4: Test the Application

```bash
# Test locally
curl http://localhost:3006

# Test via domain (after DNS)
curl https://chat.pokt.ai
```

---

## 🎯 Features Overview

### Chat Interface Features:
- 💬 **ChatGPT-style UI** with message history
- 🎨 **pokt.ai branding** (gradient colors, logo)
- 🌐 **Multi-chain support** (9+ blockchains)
- ⚡ **Real-time queries** via Pocket Network
- 📱 **Responsive design** (mobile, tablet, desktop)
- ✨ **Example prompts** for easy start

### Supported Queries:
1. **Block Numbers**: "What's the current block on Ethereum?"
2. **Balances**: "Check balance of 0x... on Polygon"
3. **Gas Prices**: "What's the gas price on Arbitrum?"
4. **Network List**: "List all available blockchains"
5. **And more!**

---

## 🔧 Management Commands

### Start the Application
```bash
cd /home/ubuntu/pokt.ai/chat
npm start
```

### Stop the Application
```bash
# Find and kill the process
lsof -ti:3006 | xargs kill -9
```

### Restart the Application
```bash
cd /home/ubuntu/pokt.ai/chat
./start.sh
```

### View Logs
```bash
cd /home/ubuntu/pokt.ai/chat
# Real-time logs
pm2 logs chat-pokt-ai

# Or if not using PM2
tail -f nohup.out
```

### Check Status
```bash
# Check if running
lsof -i:3006

# Test API endpoint
curl http://localhost:3006/api/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Ethereum?"}]}'
```

---

## 🔄 Using PM2 (Recommended for Production)

### Install PM2
```bash
npm install -g pm2
```

### Start with PM2
```bash
cd /home/ubuntu/pokt.ai/chat
pm2 start npm --name "chat-pokt-ai" -- start
pm2 save
```

### PM2 Commands
```bash
pm2 status                    # Check status
pm2 logs chat-pokt-ai         # View logs
pm2 restart chat-pokt-ai      # Restart
pm2 stop chat-pokt-ai         # Stop
pm2 delete chat-pokt-ai       # Remove from PM2
```

### Auto-start on System Reboot
```bash
pm2 startup
pm2 save
```

---

## 📊 Monitoring

### Health Check
```bash
# Application health
curl http://localhost:3006

# Expected: 200 OK with HTML response
```

### Performance Monitoring
```bash
# Check memory usage
ps aux | grep node | grep 3006

# Check CPU usage
top -p $(lsof -ti:3006)
```

### Traefik Dashboard
Access at: `http://your-server-ip:8080` (if enabled)

---

## 🐛 Troubleshooting

### Application Not Starting

**Check port availability:**
```bash
lsof -i:3006
# If something is running, kill it
```

**Rebuild application:**
```bash
cd /home/ubuntu/pokt.ai/chat
rm -rf .next node_modules
npm install
npm run build
npm start
```

### SSL Certificate Issues

**Problem:** Can't get SSL certificate

**Solution:**
1. Verify DNS is configured correctly
2. Wait 30 minutes for propagation
3. Check Traefik logs: `docker logs traefik`
4. Restart Traefik: `docker restart traefik`

### API Errors

**Check RPC endpoint availability:**
```bash
curl http://135.125.163.236:4000/v1/rpc/eth \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### DNS Not Resolving

**Check DNS:**
```bash
nslookup chat.pokt.ai
dig chat.pokt.ai
```

**Wait longer:**
DNS can take up to 48 hours (usually 5-30 minutes)

---

## 🔐 Security Checklist

- ✅ HTTPS enabled via Let's Encrypt
- ✅ CORS configured
- ✅ Rate limiting via Traefik
- ✅ No private keys handled
- ✅ Input sanitization
- ⚠️ Consider adding authentication for production

---

## 📈 Performance Optimization

### Enable Caching
Add to `/home/ubuntu/pokt.ai/chat/.env.local`:
```env
NEXT_PUBLIC_CACHE_ENABLED=true
```

### CDN Integration (Optional)
For global performance, consider:
- Cloudflare (free tier available)
- AWS CloudFront
- Vercel Edge Network

---

## 🔄 Updates & Maintenance

### Update Application
```bash
cd /home/ubuntu/pokt.ai/chat
git pull origin main  # if using git
npm install
npm run build
pm2 restart chat-pokt-ai
```

### Update Dependencies
```bash
cd /home/ubuntu/pokt.ai/chat
npm update
npm audit fix
```

---

## 📧 Email Summary (For jonathanmaria@gmail.com)

### What's Been Built:

1. **chat.pokt.ai** - ChatGPT-style blockchain chat interface
   - Location: `/home/ubuntu/pokt.ai/chat/`
   - Status: ✅ Built and running on port 3006
   - Access: https://chat.pokt.ai (after DNS setup)

2. **MCP Server** - Claude Desktop blockchain integration
   - Location: `/home/ubuntu/pokt.ai/mcp/`
   - Status: ✅ Built and ready to use
   - For: Claude Desktop integration

3. **Documentation**
   - Project Evaluation: `/home/ubuntu/pokt.ai/PROJECT_EVALUATION.md`
   - Security Audit: `/home/ubuntu/pokt.ai/SECURITY_AUDIT_REPORT.md`
   - Chat README: `/home/ubuntu/pokt.ai/chat/README.md`
   - MCP README: `/home/ubuntu/pokt.ai/mcp/README.md`

### Next Steps:

1. ✅ **DNS Configuration**
   - Add A record: `chat.pokt.ai` → `51.195.63.173`
   
2. ⏳ **Wait for DNS propagation** (5-30 minutes)

3. ✅ **Access your chat interface** at https://chat.pokt.ai

4. 🎉 **Start chatting with blockchains!**

---

## 🎉 Success Criteria

Your chat.pokt.ai is **production-ready** when:

- ✅ DNS resolves to your server
- ✅ HTTPS certificate is active
- ✅ Application responds at https://chat.pokt.ai
- ✅ Can send messages and get blockchain data
- ✅ All 9+ networks are accessible

---

## 🆘 Support

**Issues?** Check:
1. This deployment guide
2. README.md in `/home/ubuntu/pokt.ai/chat/`
3. Logs: `pm2 logs chat-pokt-ai`
4. Traefik logs: `docker logs traefik`

**Need help?**
- GitHub Issues: https://github.com/infoboy27/pokt.ai/issues
- Email: support@pokt.ai

---

**Built with ❤️ by pokt.ai**

*Ready to launch? Just configure DNS and you're live!*








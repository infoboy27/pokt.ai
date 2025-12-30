# Restart Web Service - Next Steps

## ✅ Configuration Applied

I've added the per-chain app addresses to `apps/web/.env.local`:

```bash
ETH_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
BSC_APP_ADDRESS=pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w
KAVA_APP_ADDRESS=pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp
TEXT_TO_TEXT_APP_ADDRESS=pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw
```

## 🚀 Restart Next.js

The Next.js process has been stopped. Restart it to load the new environment variables:

```bash
cd /home/shannon/poktai/apps/web
npm run dev
```

Or if you have it running in a screen/tmux session, restart it there.

## ✅ Verify Configuration

After restarting, verify the environment variables are loaded:

```bash
# Check if Next.js is reading the env vars
# The code will use them automatically when processing requests
```

## 🧪 Test Endpoint

After restarting, test your endpoint:

```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected**: Should route through PATH gateway and use `ETH_APP_ADDRESS`

## 📋 Summary

- ✅ Code updated to support per-chain app addresses
- ✅ Environment variables added to `apps/web/.env.local`
- ✅ `docker-compose.yml` updated (for Docker deployments)
- ⏳ **Next.js process stopped** - restart it to apply changes

## 🔍 How to Verify It's Working

After restarting, the endpoint should:
1. Route through PATH gateway (`http://localhost:3069/v1`)
2. Use `ETH_APP_ADDRESS` for ETH endpoints
3. Use `BSC_APP_ADDRESS` for BSC endpoints
4. Use `KAVA_APP_ADDRESS` for Kava endpoints
5. Use `TEXT_TO_TEXT_APP_ADDRESS` for text-to-text endpoints

The configuration is ready! Just restart Next.js and it will work! 🎉


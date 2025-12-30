# Apply Chain App Address Configuration

## ✅ Configuration Complete

The per-chain app addresses have been added to `infra/docker-compose.yml`:

```yaml
ETH_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
BSC_APP_ADDRESS: pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w
KAVA_APP_ADDRESS: pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp
TEXT_TO_TEXT_APP_ADDRESS: pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw
```

## 🚀 Next Steps to Apply

### Step 1: Restart Web Service

**If using Docker Compose:**
```bash
cd /home/shannon/poktai/infra
docker compose restart web
```

**If web service is running standalone:**
```bash
# Find and restart the web container
docker ps | grep web
docker restart <web-container-name>
```

**If running Next.js directly:**
```bash
# Restart the Next.js process
# Or rebuild if needed
cd /home/shannon/poktai/apps/web
npm run build
npm run start
```

### Step 2: Verify Environment Variables

After restarting, verify the environment variables are loaded:

```bash
# If using Docker
docker exec <web-container-name> printenv | grep APP_ADDRESS

# Expected output:
# PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
# ETH_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
# BSC_APP_ADDRESS=pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w
# KAVA_APP_ADDRESS=pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp
# TEXT_TO_TEXT_APP_ADDRESS=pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw
```

### Step 3: Test Endpoint

Test that endpoints use the correct app address per chain:

```bash
# Test ETH endpoint (should use ETH_APP_ADDRESS)
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 📋 How It Works

### Priority Order

1. **`network.path_app_address`** (Database) - Customer-specific override
2. **`CHAIN_APP_ADDRESSES[chainCode]`** (Environment) - Per-chain default ✅ **NEW**
3. **`PATH_GATEWAY_APP_ADDRESS`** (Environment) - Global fallback

### Example Flow

**Customer creates ETH endpoint without app address:**
- Network: `code = 'eth'`, `path_app_address = NULL`
- Gateway uses: `ETH_APP_ADDRESS` = `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`

**Customer creates BSC endpoint without app address:**
- Network: `code = 'bsc'`, `path_app_address = NULL`
- Gateway uses: `BSC_APP_ADDRESS` = `pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`

**Customer creates endpoint with custom app address:**
- Network: `code = 'eth'`, `path_app_address = 'pokt1customer123...'`
- Gateway uses: `pokt1customer123...` (overrides default)

## ✅ Status

- ✅ Code updated to support per-chain app addresses
- ✅ Environment variables added to docker-compose.yml
- ⏳ **Web service needs restart** to load new environment variables
- ⏳ **Test endpoints** after restart

## 🔍 Troubleshooting

### If environment variables not loaded:

1. **Check docker-compose.yml** has the variables
2. **Restart container** (not just stop/start, use `restart` or `up -d`)
3. **Verify with** `docker exec <container> printenv | grep APP_ADDRESS`

### If endpoints still use wrong app address:

1. **Check logs** to see which app address is being used
2. **Verify chain code** matches environment variable name
3. **Check database** for customer overrides (`path_app_address`)

## 📝 Summary

The configuration is ready! Just restart the web service and the per-chain app addresses will be active.


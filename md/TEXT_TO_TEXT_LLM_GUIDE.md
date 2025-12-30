# Text-to-Text Service for LLM on Pocket Network Shannon

## Current Status

The `text-to-text` service is configured in your PATH gateway with:
- **Service ID**: `text-to-text`
- **App Address**: `pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw`
- **Current Fallback Endpoint**: `http://eth-weavers.eu.nodefleet.net` (Ethereum RPC endpoint)

## ⚠️ Important Note

Currently, the `text-to-text` service is using an Ethereum RPC endpoint as its fallback. This means it's **not yet configured for actual LLM functionality**. To use it for LLM requests, you'll need to:

1. **Configure an LLM endpoint** that supports text generation
2. **Update the fallback endpoint** in `gateway_config.yaml` to point to your LLM service
3. **Use appropriate LLM API methods** instead of standard JSON-RPC methods

## How Text-to-Text Works on Shannon

The `text-to-text` service on Pocket Network Shannon is designed to route requests to LLM (Large Language Model) endpoints. However, the actual LLM endpoint needs to be configured separately.

## Configuration Options

### Option 1: Use OpenAI-Compatible API

If you have an OpenAI-compatible LLM endpoint, you can configure it:

```yaml
- service_id: text-to-text
  send_all_traffic: true
  fallback_endpoints:
    - default_url: "https://your-llm-endpoint.com/v1/chat/completions"
```

### Option 2: Use Custom LLM Service

Configure your own LLM service endpoint:

```yaml
- service_id: text-to-text
  send_all_traffic: true
  fallback_endpoints:
    - default_url: "http://your-llm-service:8080/api/generate"
```

### Option 3: Use Pocket Network LLM Providers

If Pocket Network has LLM service providers on Shannon, you can:
1. Check available LLM providers in the Shannon network
2. Use protocol endpoints (if available) instead of fallback endpoints
3. Set `send_all_traffic: false` to use protocol endpoints first

## Testing Text-to-Text Service

### Current Test (Ethereum RPC methods work)

```bash
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: text-to-text" \
  -H "App-Address: pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### For LLM Usage (Once configured)

The exact format depends on your LLM endpoint. Examples:

**OpenAI-compatible:**
```bash
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: text-to-text" \
  -H "App-Address: pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, how are you?"}],
    "max_tokens": 50
  }'
```

**Custom LLM API:**
```bash
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: text-to-text" \
  -H "App-Address: pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw" \
  -d '{
    "prompt": "Hello, how are you?",
    "max_tokens": 50
  }'
```

## Next Steps

1. **Identify your LLM endpoint**: Determine which LLM service you want to use
2. **Update gateway config**: Modify `/home/shannon/shannon/gateway/config/gateway_config.yaml`
3. **Restart gateway**: `docker restart shannon-testnet-gateway`
4. **Test with LLM requests**: Use the appropriate API format for your LLM service

## App Address Mapping

For reference, here are the app addresses for each service:

- **ETH**: `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
- **BSC**: `pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`
- **Kava**: `pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp`
- **text-to-text**: `pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw`

## Resources

- [Pocket Network Shannon Documentation](https://docs.pokt.network/)
- [PATH Gateway Configuration](https://github.com/buildwithgrove/path)
- [Shannon Testnet Explorer](https://shannon.poktscan.com/)


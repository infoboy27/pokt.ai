# PATH Gateway Header Investigation

## Date: November 13, 2025

---

## Problem

PATH gateway is reporting: **"getAppAddrFromHTTPReq: no HTTP headers supplied"**

This prevents PATH gateway from working in delegated mode, causing:
- PATH gateway usage: 0.02% (should be > 50%)
- System falling back to direct `rpctest.pokt.ai` calls
- Rate limit errors (99% of failures)

---

## Investigation Findings

### 1. Headers ARE Being Sent ✅

**Evidence:**
- `customer-rpc-gateway` is sending headers correctly:
  ```javascript
  headers: {
      'Content-Type': 'application/json',
      'Target-Service-Id': network,
      'App-Address': PATH_GATEWAY_APP_ADDRESS,
      'Connection': 'keep-alive'
  }
  ```

- Direct curl tests show headers are sent:
  ```bash
  > App-Address: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd
  > Target-Service-Id: eth
  ```

### 2. PATH Gateway IS Receiving Some Headers ✅

**Evidence:**
- When using lowercase `target-service-id`, PATH gateway reports:
  ```
  "no service ID provided in 'Target-Service-Id' header"
  ```
  - This means PATH gateway IS reading headers
  - But it expects `Target-Service-Id` (Pascal-Case), not `target-service-id` (lowercase)

### 3. PATH Gateway NOT Finding App-Address Header ❌

**Evidence:**
- When using `App-Address` (Pascal-Case), PATH gateway reports:
  ```
  "getAppAddrFromHTTPReq: no HTTP headers supplied"
  ```
  - This suggests PATH gateway's HTTP parser is not seeing the `App-Address` header
  - Even though the header is being sent correctly

---

## Test Results

### Test 1: Lowercase Headers
```bash
curl -H "app-address: ..." -H "target-service-id: eth"
```
**Result:** PATH gateway finds `target-service-id` but reports error about `Target-Service-Id` (expects Pascal-Case)

### Test 2: Pascal-Case Headers (Current Format)
```bash
curl -H "App-Address: ..." -H "Target-Service-Id: eth"
```
**Result:** PATH gateway finds `Target-Service-Id` ✅ but NOT `App-Address` ❌

### Test 3: From customer-rpc-gateway Container
```bash
docker exec customer-rpc-gateway curl -H "App-Address: ..." -H "Target-Service-Id: eth"
```
**Result:** Same issue - PATH gateway not finding `App-Address` header

---

## Root Cause Analysis

### Hypothesis 1: HTTP Header Parsing Issue in PATH Gateway

PATH gateway's `getAppAddrFromHTTPReq` function may be:
- Not reading headers correctly from HTTP request
- Looking for headers in wrong location
- Case-sensitive and expecting different format
- Bug in delegated mode header parsing

### Hypothesis 2: Headers Being Stripped

Possible that:
- Docker network is stripping headers
- HTTP proxy/middleware removing headers
- PATH gateway's HTTP library not preserving headers

### Hypothesis 3: Header Name Mismatch

PATH gateway might expect:
- Different header name (e.g., `AppAddress` instead of `App-Address`)
- Header in different location (query params, body, etc.)
- Different case format

---

## PATH Gateway Source Code Clues

From PATH gateway binary strings:
- Function name: `getAppAddrFromHTTPReq`
- References to: `AppAddress`, `app_address`, `endpoint_app_address`
- Error message: "no HTTP headers supplied"

This suggests PATH gateway is looking for the header but not finding it in the HTTP request object.

---

## Current Status

### What Works ✅
- `Target-Service-Id` header is being read correctly (Pascal-Case)
- PATH gateway is receiving HTTP requests
- Headers are being sent from `customer-rpc-gateway`

### What Doesn't Work ❌
- `App-Address` header is NOT being found by PATH gateway
- PATH gateway reports "no HTTP headers supplied" even though headers are sent
- This prevents PATH gateway from working in delegated mode

---

## Next Steps

### Immediate Actions

1. **Check PATH Gateway Source Code:**
   - Find `getAppAddrFromHTTPReq` function
   - See how it reads headers from HTTP request
   - Check if there's a bug or different expected format

2. **Test Different Header Formats:**
   - Try `AppAddress` (no hyphen)
   - Try `app_address` (snake_case)
   - Try `X-App-Address` (with X- prefix)
   - Try header in query params

3. **Check PATH Gateway Version:**
   - Current version: `ghcr.io/buildwithgrove/path:main`
   - May need to check if this is a known issue
   - Consider updating to latest version

4. **Contact PATH Gateway Team:**
   - Report the issue
   - Ask about correct header format for delegated mode
   - Check if there's a configuration issue

### Alternative Solutions

1. **Use Owned Apps Mode:**
   - Instead of delegated mode, use owned apps mode
   - PATH gateway config already has `owned_apps_private_keys_hex` configured
   - This might bypass the header issue

2. **Work Around Header Issue:**
   - If PATH gateway can't be fixed, focus on improving direct `rpctest.pokt.ai` handling
   - Implement better rate limit queuing
   - Add request throttling

---

## Conclusion

The issue is clear: **PATH gateway is not finding the `App-Address` header** even though it's being sent correctly. This is likely a bug in PATH gateway's HTTP header parsing for delegated mode, or the header format is incorrect.

**Critical Blocker:** Until this is resolved, PATH gateway cannot work in delegated mode, forcing the system to use direct `rpctest.pokt.ai` calls which hit rate limits.

---

## Files Modified

None - investigation only.

---

## References

- PATH Gateway Config: `/home/shannon/shannon/gateway/config/gateway_config.yaml`
- Customer Gateway: `/home/shannon/shannon/customer-gateway-fallback.js`
- PATH Gateway Image: `ghcr.io/buildwithgrove/path:main`
- Error Function: `getAppAddrFromHTTPReq` in PATH gateway source code


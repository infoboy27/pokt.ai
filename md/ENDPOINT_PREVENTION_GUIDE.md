# Endpoint Configuration Prevention Guide

## Overview

This guide outlines prevention mechanisms to avoid endpoint configuration issues like missing networks and PATH gateway service errors.

## Prevention Mechanisms

### 1. Transaction Safety ✅ IMPLEMENTED

**What**: Endpoint and network creation are now wrapped in a database transaction.

**Location**: `apps/web/lib/database.ts:223-261`

**How It Works**:
- Uses `BEGIN` transaction before creating endpoint
- Creates endpoint and network within same transaction
- Validates network was created successfully
- Commits on success, rolls back on failure
- Ensures atomicity: either both are created or neither

**Benefits**:
- Prevents endpoints without networks
- Ensures data consistency
- Automatic rollback on errors

---

### 2. Validation After Creation ✅ IMPLEMENTED

**What**: Validates network exists after creation before committing transaction.

**Location**: `apps/web/lib/database.ts` (in transaction)

**How It Works**:
```typescript
// Validate network was created
const networkCheck = await client.query(
  'SELECT COUNT(*) as count FROM networks WHERE endpoint_id = $1',
  [endpoint.id]
);

if (parseInt(networkCheck.rows[0].count) === 0) {
  throw new Error('Network creation failed - no network record found after creation');
}
```

**Benefits**:
- Catches silent failures
- Ensures network exists before returning success
- Provides clear error messages

---

### 3. Database Health Checks ✅ CREATED

**What**: Script to check endpoint configurations and identify issues.

**Location**: `scripts/check-endpoint-config.sh`

**Usage**:
```bash
./scripts/check-endpoint-config.sh
```

**What It Does**:
- Checks if endpoints exist
- Verifies networks are configured
- Lists all orphaned endpoints (endpoints without networks)
- Provides detailed diagnostics

**When to Use**:
- After endpoint creation
- Periodic health checks
- Before deployments
- Troubleshooting issues

---

### 4. Automatic Fix Script ✅ CREATED

**What**: Script to automatically fix endpoints missing network configurations.

**Location**: `scripts/fix-missing-networks.sh`

**Usage**:
```bash
./scripts/fix-missing-networks.sh
```

**What It Does**:
- Finds all endpoints without networks
- Detects chain ID from endpoint name/ID
- Creates missing network records
- Uses proper chain mappings

**When to Use**:
- After identifying orphaned endpoints
- To fix existing broken endpoints
- As part of migration/cleanup

---

### 5. PATH Gateway Diagnostics ✅ CREATED

**What**: Script to diagnose PATH gateway service configuration issues.

**Location**: `scripts/diagnose-path-gateway.sh`

**Usage**:
```bash
PATH_GATEWAY_URL=http://localhost:3069 \
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv \
./scripts/diagnose-path-gateway.sh
```

**What It Does**:
- Tests each service ID (eth, opt, oasys, fantom, etc.)
- Identifies services with "no protocol endpoint responses" errors
- Provides troubleshooting guidance

**When to Use**:
- When PATH gateway errors occur
- Before adding new chains
- To verify service configuration
- Troubleshooting 502 errors

---

## Best Practices

### When Creating Endpoints

1. **Always use the API**: Use `/api/endpoints` or `/api/production/create-endpoint` endpoints
2. **Don't create manually**: Avoid direct database inserts for endpoints
3. **Verify after creation**: Check endpoint has network configuration
4. **Test immediately**: Test endpoint after creation

### When Adding New Chains

1. **Update chain mapping**: Add chain to `chainMapping` in `database.ts`
2. **Update service mapping**: Add service ID to `chainToServiceId` in `gateway/route.ts`
3. **Add app address**: Add default app address to `CHAIN_APP_ADDRESSES` if needed
4. **Test PATH gateway**: Verify PATH gateway has service configured
5. **Update diagnostics**: Add new chain to diagnostic scripts

### Monitoring

1. **Monitor errors**: Track "No network configuration found" errors
2. **Monitor PATH gateway**: Track "no protocol endpoint responses" errors
3. **Health checks**: Run `check-endpoint-config.sh` periodically
4. **Alert on issues**: Set up alerts for orphaned endpoints

---

## Troubleshooting

### Issue: Endpoint created but no network

**Symptoms**: 
- Endpoint exists in database
- No network records found
- Gateway returns "No network configuration found"

**Fix**:
```bash
# Check endpoint
./scripts/check-endpoint-config.sh

# Fix missing networks
./scripts/fix-missing-networks.sh
```

**Prevention**: Already fixed with transaction safety ✅

---

### Issue: PATH gateway "no protocol endpoint responses"

**Symptoms**:
- HTTP 502 errors
- Error: "no protocol endpoint responses"
- Works for some chains but not others

**Diagnosis**:
```bash
# Run diagnostics
./scripts/diagnose-path-gateway.sh
```

**Possible Causes**:
1. App address doesn't have staked services for that chain
2. PATH gateway doesn't have nodes configured for service ID
3. Service ID mismatch (e.g., `opt` vs `optimism`)

**Fix**:
1. Verify app address staking
2. Check PATH gateway configuration
3. Verify service IDs match
4. Check PATH gateway logs

---

## Future Improvements

### 1. Database Constraints (Recommended)

Add database constraint to ensure endpoints always have networks:

```sql
-- Add constraint: Endpoints must have at least one network
-- Note: This requires a trigger or application-level enforcement
-- as PostgreSQL doesn't support direct foreign key constraints for "at least one"
```

### 2. Health Check Endpoint (Recommended)

Add `/api/health/endpoints` endpoint that:
- Checks all endpoints have networks
- Verifies PATH gateway services
- Returns health status

### 3. Automated Monitoring (Recommended)

Set up automated monitoring that:
- Runs `check-endpoint-config.sh` daily
- Alerts on orphaned endpoints
- Tracks PATH gateway service availability
- Reports configuration issues

### 4. Integration Tests (Recommended)

Add integration tests that:
- Test endpoint creation with transactions
- Verify network creation on success
- Test rollback on network creation failure
- Test PATH gateway with all chains

---

## Summary

✅ **Transaction Safety**: Implemented - prevents endpoints without networks
✅ **Validation**: Implemented - validates network creation
✅ **Health Checks**: Created - `check-endpoint-config.sh`
✅ **Fix Scripts**: Created - `fix-missing-networks.sh`
✅ **PATH Diagnostics**: Created - `diagnose-path-gateway.sh`

**Next Steps**:
1. Run health check: `./scripts/check-endpoint-config.sh`
2. Fix existing issues: `./scripts/fix-missing-networks.sh`
3. Diagnose PATH gateway: `./scripts/diagnose-path-gateway.sh`
4. Monitor for future issues


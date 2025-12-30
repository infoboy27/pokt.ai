# Endpoint Issues Investigation & Fix

## Root Cause Analysis

### Issue 1: Fantom Endpoint Missing Network Configuration

**Symptom**: `fantom_1764640134244_1764640134249` returns HTTP 400 - "No network configuration found"

**Root Cause**:
1. **Transaction Safety Issue**: The `endpointQueries.create()` function in `apps/web/lib/database.ts` creates an endpoint and then creates a network record, but these operations are **not wrapped in a database transaction**.
2. **Silent Failure**: If network creation fails (e.g., database error, constraint violation, or exception), the endpoint is still created, leaving it in an invalid state.
3. **No Validation**: There's no validation after endpoint creation to ensure a network record exists.

**Code Location**: `apps/web/lib/database.ts:223-261`

```typescript
async create(endpointData: {...}) {
  // Creates endpoint
  const endpoint = result.rows[0];
  
  // Creates network - but if this fails, endpoint still exists!
  await networkQueries.create({
    endpointId: endpoint.id,
    chainId: endpointData.chainId,
    pathAppAddress: endpointData.pathAppAddress,
  });
  
  return endpoint; // Returns endpoint even if network creation failed
}
```

**Why It Happened**:
- Possible database connection issue during network creation
- Constraint violation (e.g., duplicate network code)
- Exception thrown but not caught
- Manual database manipulation that created endpoint without network

---

### Issue 2: Optimism & Oasys PATH Gateway Errors

**Symptom**: HTTP 502 - "no protocol endpoint responses" / "no-op qos service error: no responses received from any service endpoints"

**Root Cause**:
1. **Service Configuration**: PATH gateway cannot find service endpoints for `opt` (Optimism) or `oasys` (Oasys) services.
2. **App Address Staking**: The app address used may not have staked services for these chains, or the staking configuration is incorrect.
3. **Service ID Mismatch**: PATH gateway might expect different service IDs than what we're sending (`opt` vs `optimism`, `oasys` vs `oasys-mainnet`).

**Code Location**: `apps/web/app/api/gateway/route.ts:687`

```typescript
const serviceId = chainToServiceId[chainId] || chainId;
// Maps to: 'opt' for Optimism, 'oasys' for Oasys
```

**PATH Gateway Behavior**:
- PATH gateway receives request with `Target-Service-Id: opt` or `Target-Service-Id: oasys`
- PATH gateway looks up service endpoints for that service ID
- If no endpoints found (no staked nodes, wrong service ID, or service not configured), returns "no protocol endpoint responses"

**Why It Works for Ethereum**:
- Ethereum (`eth`) is the most common service and likely has proper staking/configuration
- App address `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv` likely has `eth` service staked

---

## Fixes

### Fix 1: Add Transaction Safety to Endpoint Creation

**Problem**: Endpoints can be created without networks if network creation fails.

**Solution**: Wrap endpoint and network creation in a database transaction.

**Implementation**: Update `apps/web/lib/database.ts` to use transactions.

### Fix 2: Add Validation After Endpoint Creation

**Problem**: No validation ensures network was created successfully.

**Solution**: Add validation check after creation and rollback if network is missing.

**Implementation**: Add validation in `endpointQueries.create()`.

### Fix 3: Fix Missing Network for Fantom Endpoint

**Problem**: Fantom endpoint exists but has no network record.

**Solution**: Create the missing network record manually.

**Implementation**: SQL script to create network for Fantom endpoint.

### Fix 4: Verify PATH Gateway Service Configuration

**Problem**: PATH gateway doesn't have service endpoints for Optimism/Oasys.

**Solution**: 
1. Verify app address has staked services for `opt` and `oasys`
2. Check PATH gateway configuration
3. Verify service IDs match PATH gateway expectations

**Implementation**: Diagnostic script and configuration verification.

---

## Prevention Mechanisms

### 1. Database Constraints
- Add database constraint: Endpoints MUST have at least one network
- Use foreign key with NOT NULL constraint (if possible)

### 2. Application-Level Validation
- Validate network exists after endpoint creation
- Return error if network creation fails
- Use database transactions for atomicity

### 3. Health Checks
- Add endpoint health check that verifies network configuration
- Alert when endpoints exist without networks

### 4. Monitoring
- Monitor for "No network configuration found" errors
- Track PATH gateway "no protocol endpoint responses" errors
- Alert on endpoint creation failures

### 5. Testing
- Add integration tests for endpoint creation
- Test transaction rollback on network creation failure
- Test PATH gateway with all supported chains

---

## Next Steps

1. ✅ Investigate root causes (this document)
2. ⏳ Create database check script
3. ⏳ Create fix script for missing networks
4. ⏳ Add transaction safety to endpoint creation
5. ⏳ Add validation and error handling
6. ⏳ Verify PATH gateway service configuration
7. ⏳ Add monitoring and alerts


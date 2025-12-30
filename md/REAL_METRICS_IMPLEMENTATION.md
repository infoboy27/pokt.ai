# Real Metrics Implementation Guide

## Overview

This guide explains how to fetch and display **real data** for the main page metrics:
- **99.9% Uptime** - Calculated from health checks
- **45ms Avg Latency** - Calculated from usage_daily table
- **10M+ Daily Requests** - Calculated from usage_daily table
- **50+ Countries** - Tracked from request IP geolocation

## Implementation

### 1. API Endpoint Created ✅

**File**: `apps/web/app/api/metrics/route.ts`

**Endpoint**: `GET /api/metrics`

**Returns**:
```json
{
  "uptime": "99.9%",
  "avgLatency": "45ms",
  "dailyRequests": "10M+",
  "countries": "50+",
  "raw": {
    "uptimePercent": 99.9,
    "avgLatencyMs": 45,
    "dailyRequestsCount": 10000000,
    "uniqueCountries": 50
  },
  "lastUpdated": "2025-12-03T14:00:00.000Z"
}
```

### 2. Main Page Updated ✅

**File**: `apps/web/app/page.tsx`

**Changes**:
- Added `useEffect` to fetch metrics on mount
- Metrics refresh every 5 minutes
- Displays loading state ("...") while fetching
- Falls back to defaults on error

### 3. Metrics Calculation

#### Uptime (99.9%)
- **Source**: `health_checks` table
- **Calculation**: `(successful_checks / total_checks) * 100` over last 30 days
- **Query**: Counts health checks where `ok = true` vs total checks

#### Average Latency (45ms)
- **Source**: `usage_daily` table
- **Calculation**: `AVG(p95_ms)` over last 7 days
- **Query**: Averages p95 response times from daily usage records

#### Daily Requests (10M+)
- **Source**: `usage_daily` table
- **Calculation**: `SUM(relays)` for today
- **Formatting**: 
  - `10M+` if >= 10,000,000
  - `1.2M` if >= 1,000,000
  - `5K+` if >= 1,000
  - Otherwise shows exact number

#### Countries (50+)
- **Source**: `health_checks.meta` JSONB column (country_code)
- **Calculation**: `COUNT(DISTINCT country_code)` over last 30 days
- **Tracking**: Requires IP geolocation (see below)

## IP Geolocation Tracking

### Option 1: Use Cloudflare Headers (Recommended)

If using Cloudflare CDN, the `CF-IPCountry` header is automatically available:

```typescript
// In gateway route
const countryCode = request.headers.get('cf-ipcountry');
if (countryCode && countryCode !== 'XX') {
  // Store in health_checks.meta or usage tracking
}
```

### Option 2: Track in Health Checks

Update health check worker to include country:

```typescript
// apps/api/src/workers/health-check.worker.ts
const countryCode = request.headers.get('cf-ipcountry') || 
                    request.headers.get('x-country-code');

await prisma.healthCheck.create({
  data: {
    endpointId,
    ok,
    httpStatus: response.status,
    latencyMs,
    checkedAt: new Date(),
    meta: {
      country_code: countryCode || null,
      // ... other metadata
    },
  },
});
```

### Option 3: Create Country Tracking Table

Create a separate table to track countries:

```sql
CREATE TABLE IF NOT EXISTS request_countries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  request_date DATE NOT NULL,
  request_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(endpoint_id, country_code, request_date)
);

CREATE INDEX idx_request_countries_date ON request_countries(request_date);
CREATE INDEX idx_request_countries_country ON request_countries(country_code);
```

## Daily Metrics Worker

### Script Created ✅

**File**: `scripts/daily-metrics-worker.js`

**Purpose**: Calculate metrics daily (can be run manually or via cron)

**Usage**:
```bash
# Manual run
node scripts/daily-metrics-worker.js

# Via cron (runs at 1 AM daily)
0 1 * * * cd /path/to/poktai && node scripts/daily-metrics-worker.js

# Via PM2
pm2 start scripts/daily-metrics-worker.js --cron "0 1 * * *"
```

## Setup Instructions

### Step 1: Enable IP Geolocation Tracking

If using Cloudflare, country codes are automatically available. Otherwise:

1. **Add country tracking to gateway route**:
   ```typescript
   import { getCountryFromRequest } from '@/lib/geolocation';
   
   // In POST handler
   const countryCode = getCountryFromRequest(request);
   
   // Store in health check or usage record
   ```

2. **Update health check worker** to include country code in meta

### Step 2: Test the API

```bash
# Test metrics endpoint
curl https://pokt.ai/api/metrics

# Expected response:
{
  "uptime": "99.9%",
  "avgLatency": "45ms",
  "dailyRequests": "10M+",
  "countries": "50+",
  ...
}
```

### Step 3: Verify Main Page

1. Visit `https://pokt.ai`
2. Check that metrics are loading (may show "..." briefly)
3. Verify real data appears after API call completes

### Step 4: Set Up Daily Worker (Optional)

```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 1 AM)
0 1 * * * cd /home/shannon/poktai && node scripts/daily-metrics-worker.js >> /var/log/poktai-metrics.log 2>&1
```

## Data Sources

### Uptime
- **Table**: `health_checks`
- **Field**: `ok` (boolean)
- **Timeframe**: Last 30 days
- **Formula**: `(successful / total) * 100`

### Average Latency
- **Table**: `usage_daily`
- **Field**: `p95_ms` (integer)
- **Timeframe**: Last 7 days
- **Formula**: `AVG(p95_ms)`

### Daily Requests
- **Table**: `usage_daily`
- **Field**: `relays` (integer)
- **Timeframe**: Today
- **Formula**: `SUM(relays) WHERE date = TODAY`

### Countries
- **Table**: `health_checks.meta` (JSONB)
- **Field**: `country_code` (string, 2-letter ISO code)
- **Timeframe**: Last 30 days
- **Formula**: `COUNT(DISTINCT country_code)`

## Troubleshooting

### Metrics Show Defaults

**Issue**: API returns default values instead of real data

**Check**:
1. Verify `usage_daily` table has data:
   ```sql
   SELECT COUNT(*) FROM usage_daily WHERE date = CURRENT_DATE;
   ```

2. Verify `health_checks` table has data:
   ```sql
   SELECT COUNT(*) FROM health_checks WHERE checked_at >= CURRENT_DATE - INTERVAL '30 days';
   ```

3. Check API endpoint logs for errors

### Countries Always Shows "50+"

**Issue**: Country tracking not working

**Solution**:
1. Ensure Cloudflare headers are available (if using CF)
2. Update health check worker to store country_code in meta
3. Or implement IP geolocation service

### Metrics Not Updating

**Issue**: Metrics stay the same

**Check**:
1. Verify usage logging is enabled (`DISABLE_USAGE_LOGGING=false`)
2. Verify health checks are running
3. Check if daily worker is running (if using cron)

## Performance Considerations

- **API Caching**: Consider caching metrics response for 1-5 minutes
- **Database Indexes**: Ensure indexes on `health_checks.checked_at` and `usage_daily.date`
- **Query Optimization**: Metrics queries are optimized but monitor performance

## Future Enhancements

1. **Metrics Table**: Store calculated metrics in a dedicated table for faster retrieval
2. **Historical Trends**: Track metrics over time for charts/graphs
3. **Real-time Updates**: WebSocket or SSE for live metric updates
4. **Geolocation Service**: Integrate IP geolocation API for accurate country tracking
5. **Caching Layer**: Redis cache for metrics to reduce database load

## Summary

✅ **API Endpoint**: `/api/metrics` - Fetches real metrics
✅ **Main Page**: Updated to fetch and display real data
✅ **Daily Worker**: Script to calculate metrics daily
✅ **IP Geolocation**: Utility functions for country tracking

**Next Steps**:
1. Enable IP geolocation tracking in gateway route
2. Test the metrics API endpoint
3. Verify main page displays real data
4. Set up daily worker (optional)


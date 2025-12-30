#!/bin/bash
# Refresh network cache from Shannon node
# This script should run every 12 hours via cron

LOGFILE="/tmp/network-refresh.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting network refresh..." >> "$LOGFILE"

# Call the refresh API endpoint
RESPONSE=$(curl -s -X POST http://localhost:4000/api/networks/refresh)

if echo "$RESPONSE" | grep -q '"success":true'; then
  NETWORK_COUNT=$(echo "$RESPONSE" | jq -r '.networks | length' 2>/dev/null || echo "unknown")
  echo "[$TIMESTAMP] ✅ Successfully refreshed $NETWORK_COUNT networks" >> "$LOGFILE"
else
  echo "[$TIMESTAMP] ❌ Failed to refresh networks: $RESPONSE" >> "$LOGFILE"
fi

# Keep only last 100 lines of log
tail -100 "$LOGFILE" > "$LOGFILE.tmp" && mv "$LOGFILE.tmp" "$LOGFILE"









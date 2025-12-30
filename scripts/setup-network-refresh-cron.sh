#!/bin/bash
# Setup cron job to refresh networks every 12 hours

echo "Setting up network refresh cron job..."

# Add cron job if it doesn't exist
CRON_CMD="/home/shannon/poktai/scripts/refresh-networks.sh"
CRON_SCHEDULE="0 */12 * * *"  # Every 12 hours at minute 0

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CRON_CMD"; then
    echo "✅ Cron job already exists"
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $CRON_CMD") | crontab -
    echo "✅ Added cron job: $CRON_SCHEDULE $CRON_CMD"
fi

# Show current crontab
echo ""
echo "Current cron jobs:"
crontab -l | grep -v "^#" | grep -v "^$"

echo ""
echo "✅ Network refresh will run every 12 hours"
echo "📅 Next runs: $(date -d '+12 hours' '+%Y-%m-%d %H:00:00') and $(date -d '+24 hours' '+%Y-%m-%d %H:00:00')"
echo "📝 Logs: tail -f /tmp/network-refresh.log"









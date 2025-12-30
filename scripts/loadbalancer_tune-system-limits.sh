#!/bin/bash
# System tuning script for load generator hosts
# Run this on each load generator host before testing

set -e

echo "🔧 Tuning system limits for high-load testing..."

# Backup current sysctl config
sudo cp /etc/sysctl.conf /etc/sysctl.conf.backup.$(date +%Y%m%d_%H%M%S)

# Increase ephemeral port range
echo "📊 Increasing ephemeral port range..."
echo 'net.ipv4.ip_local_port_range = 10000 65535' | sudo tee -a /etc/sysctl.conf

# Reduce TIME_WAIT timeout
echo "⏱️  Reducing TIME_WAIT timeout..."
echo 'net.ipv4.tcp_tw_reuse = 1' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_fin_timeout = 15' | sudo tee -a /etc/sysctl.conf

# Increase connection tracking
echo "🔗 Increasing connection tracking..."
echo 'net.netfilter.nf_conntrack_max = 1000000' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.ip_conntrack_max = 1000000' | sudo tee -a /etc/sysctl.conf 2>/dev/null || true

# Increase TCP connection limits
echo "📈 Increasing TCP connection limits..."
echo 'net.core.somaxconn = 65535' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' | sudo tee -a /etc/sysctl.conf

# Increase TCP buffer sizes
echo "💾 Increasing TCP buffer sizes..."
echo 'net.core.rmem_max = 134217728' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_rmem = 4096 87380 134217728' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_wmem = 4096 65536 134217728' | sudo tee -a /etc/sysctl.conf

# Apply changes
echo "✅ Applying sysctl changes..."
sudo sysctl -p

# Increase file descriptor limits
echo "📁 Increasing file descriptor limits..."
if ! grep -q "* soft nofile 1000000" /etc/security/limits.conf; then
    echo '* soft nofile 1000000' | sudo tee -a /etc/security/limits.conf
    echo '* hard nofile 1000000' | sudo tee -a /etc/security/limits.conf
    echo "⚠️  File descriptor limits updated. You may need to log out and back in."
fi

# Verify changes
echo ""
echo "📋 Verification:"
echo "Ephemeral ports: $(cat /proc/sys/net/ipv4/ip_local_port_range)"
echo "File descriptors: $(ulimit -n)"
echo "Connection tracking: $(cat /proc/sys/net/netfilter/nf_conntrack_max 2>/dev/null || echo 'N/A')"
echo ""
echo "✅ System tuning complete!"
echo ""
echo "⚠️  Note: You may need to log out and back in for file descriptor limits to take effect."


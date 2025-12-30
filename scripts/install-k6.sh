#!/bin/bash
# Install k6 Load Testing Tool
# This script installs k6 for load testing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  Install k6 Load Testing Tool"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if k6 is already installed
if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version | head -1 | awk '{print $2}' || echo "unknown")
    echo -e "${GREEN}✓${NC} k6 is already installed: $K6_VERSION"
    echo ""
    echo "k6 is ready to use!"
    echo "  k6 version"
    echo "  k6 run load-test-10m-relays.js"
    exit 0
fi

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Detected OS: $OS"
echo "Detected Architecture: $ARCH"
echo ""

# Install k6 based on OS
if [ "$OS" = "Linux" ]; then
    echo "Installing k6 for Linux..."
    
    # Download k6
    K6_VERSION="v0.47.0"
    K6_URL="https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-amd64.tar.gz"
    
    echo "Downloading k6 from: $K6_URL"
    curl -L -o /tmp/k6.tar.gz "$K6_URL"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Failed to download k6"
        exit 1
    fi
    
    # Extract k6
    echo "Extracting k6..."
    cd /tmp
    tar -xzf k6.tar.gz
    
    # Install k6
    echo "Installing k6..."
    sudo mv k6-${K6_VERSION}-linux-amd64/k6 /usr/local/bin/k6
    chmod +x /usr/local/bin/k6
    
    # Cleanup
    rm -rf k6.tar.gz k6-${K6_VERSION}-linux-amd64
    
    # Verify installation
    if command -v k6 &> /dev/null; then
        K6_VERSION=$(k6 version | head -1 | awk '{print $2}' || echo "unknown")
        echo -e "${GREEN}✓${NC} k6 installed successfully: $K6_VERSION"
        echo ""
        echo "k6 is ready to use!"
        echo "  k6 version"
        echo "  k6 run load-test-10m-relays.js"
    else
        echo -e "${RED}✗${NC} k6 installation failed"
        exit 1
    fi
    
elif [ "$OS" = "Darwin" ]; then
    echo "Installing k6 for macOS..."
    
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        echo "Installing k6 via Homebrew..."
        brew install k6
        
        if [ $? -eq 0 ]; then
            K6_VERSION=$(k6 version | head -1 | awk '{print $2}' || echo "unknown")
            echo -e "${GREEN}✓${NC} k6 installed successfully: $K6_VERSION"
            echo ""
            echo "k6 is ready to use!"
            echo "  k6 version"
            echo "  k6 run load-test-10m-relays.js"
        else
            echo -e "${RED}✗${NC} k6 installation failed"
            exit 1
        fi
    else
        echo -e "${RED}✗${NC} Homebrew not found"
        echo "Please install Homebrew first: https://brew.sh"
        echo "Or install k6 manually: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
else
    echo -e "${RED}✗${NC} Unsupported OS: $OS"
    echo "Please install k6 manually: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  k6 Installation Complete"
echo "═══════════════════════════════════════════════════════════════"
echo ""


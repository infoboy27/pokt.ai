#!/bin/bash
# Install k6 Load Testing Tool (Local Installation)
# This script installs k6 to a local directory

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  Install k6 Load Testing Tool (Local)"
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

# Local installation directory
INSTALL_DIR="$HOME/.local/bin"
K6_DIR="$HOME/.local/k6"

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$K6_DIR"

echo "Install directory: $INSTALL_DIR"
echo "k6 directory: $K6_DIR"
echo ""

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
    curl -L -o "$K6_DIR/k6.tar.gz" "$K6_URL"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Failed to download k6"
        exit 1
    fi
    
    # Extract k6
    echo "Extracting k6..."
    cd "$K6_DIR"
    tar -xzf k6.tar.gz
    
    # Install k6 to local bin
    echo "Installing k6 to $INSTALL_DIR..."
    cp k6-${K6_VERSION}-linux-amd64/k6 "$INSTALL_DIR/k6"
    chmod +x "$INSTALL_DIR/k6"
    
    # Cleanup
    rm -rf k6.tar.gz k6-${K6_VERSION}-linux-amd64
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo ""
        echo -e "${YELLOW}⚠${NC} Adding $INSTALL_DIR to PATH..."
        echo "Add this to your ~/.bashrc or ~/.zshrc:"
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo ""
        export PATH="$INSTALL_DIR:$PATH"
    fi
    
    # Verify installation
    if [ -f "$INSTALL_DIR/k6" ]; then
        K6_VERSION=$("$INSTALL_DIR/k6" version | head -1 | awk '{print $2}' || echo "unknown")
        echo -e "${GREEN}✓${NC} k6 installed successfully: $K6_VERSION"
        echo ""
        echo "k6 is ready to use!"
        echo "  $INSTALL_DIR/k6 version"
        echo "  $INSTALL_DIR/k6 run load-test-10m-relays.js"
        echo ""
        echo "Or add to PATH:"
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo "  k6 version"
    else
        echo -e "${RED}✗${NC} k6 installation failed"
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


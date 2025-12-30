#!/bin/bash

# Stripe Setup Script for pokt.ai
# This script automatically configures Stripe keys in environment files

set -e  # Exit on error

echo "🔧 Setting up Stripe Integration for pokt.ai..."
echo ""

# Stripe Keys
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"

# Base directory
BASE_DIR="/home/shannon/poktai"
WEB_DIR="$BASE_DIR/apps/web"
API_DIR="$BASE_DIR/apps/api"

# Function to create .env file from example
create_env_file() {
    local dir=$1
    local env_file="$dir/.env"
    local example_file="$dir/env.example"
    
    if [ ! -f "$example_file" ]; then
        echo "❌ Example file not found: $example_file"
        return 1
    fi
    
    if [ -f "$env_file" ]; then
        echo "⚠️  .env file already exists: $env_file"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping $env_file"
            return 0
        fi
        echo "Backing up existing file to $env_file.backup"
        cp "$env_file" "$env_file.backup"
    fi
    
    echo "Creating $env_file..."
    cp "$example_file" "$env_file"
    
    return 0
}

# Function to update Stripe keys in .env file
update_stripe_keys() {
    local env_file=$1
    local include_publishable=$2
    
    echo "Updating Stripe keys in $env_file..."
    
    # Update or add STRIPE_SECRET_KEY
    if grep -q "^STRIPE_SECRET_KEY=" "$env_file"; then
        sed -i "s|^STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\"|" "$env_file"
    else
        echo "STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\"" >> "$env_file"
    fi
    
    # Update or add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (only for web)
    if [ "$include_publishable" = "true" ]; then
        if grep -q "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" "$env_file"; then
            sed -i "s|^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\"$STRIPE_PUBLISHABLE_KEY\"|" "$env_file"
        else
            echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\"$STRIPE_PUBLISHABLE_KEY\"" >> "$env_file"
        fi
    fi
    
    echo "✅ Stripe keys updated in $env_file"
}

# Main setup
echo "📁 Setting up Web App (.env)..."
if create_env_file "$WEB_DIR"; then
    update_stripe_keys "$WEB_DIR/.env" "true"
fi

echo ""
echo "📁 Setting up API (.env)..."
if create_env_file "$API_DIR"; then
    update_stripe_keys "$API_DIR/.env" "false"
fi

echo ""
echo "✅ Stripe setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/products"
echo "2. Create a metered price for RPC requests (\$0.0001 per request)"
echo "3. Copy the Price ID and update STRIPE_PRICE_METERED in apps/api/.env"
echo "4. Go to: https://dashboard.stripe.com/test/webhooks"
echo "5. Create a webhook endpoint for: https://pokt.ai/api/billing/webhook"
echo "6. Copy the Webhook Secret and update STRIPE_WEBHOOK_SECRET in apps/api/.env"
echo "7. Restart your services:"
echo "   cd $BASE_DIR"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "📖 For detailed instructions, see: STRIPE_SETUP_GUIDE.md"
echo ""










#!/usr/bin/env node

/**
 * Helper script to guide you to get your Stripe publishable key
 * The publishable key cannot be retrieved via API for security reasons
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here');

(async () => {
  try {
    console.log('🔍 Verifying Stripe account...\n');
    
    const account = await stripe.account.retrieve();
    console.log(`✅ Account ID: ${account.id}`);
    console.log(`✅ Account email: ${account.email || 'N/A'}`);
    console.log(`✅ Account country: ${account.country || 'N/A'}\n`);
    
    console.log('📋 To get your publishable key:\n');
    console.log('1. Go to: https://dashboard.stripe.com/test/apikeys');
    console.log('2. Look for the "Publishable key" section');
    console.log('3. Find the key that starts with: pk_test_51RqvqdIZq0jtjOXp...');
    console.log('4. Click "Reveal" or copy the full key\n');
    
    console.log('💡 Expected publishable key format:');
    console.log('   pk_test_51RqvqdIZq0jtjOXp[remaining characters]\n');
    
    console.log('Once you have the publishable key, update it in:');
    console.log('  - apps/web/.env (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)');
    console.log('  - scripts/setup-stripe.sh (STRIPE_PUBLISHABLE_KEY)\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();






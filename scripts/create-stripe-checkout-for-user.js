#!/usr/bin/env node

/**
 * Script to create a Stripe checkout session for a specific user/endpoint
 * Usage: node create-stripe-checkout-for-user.js <email> <endpointId> <amount>
 * Example: node create-stripe-checkout-for-user.js jonathanmaria@gmail.com oasys_1764640848837_1764640848845 50
 */

const { Pool } = require('pg');
const stripe = require('stripe');
const path = require('path');
const fs = require('fs');

// Load environment variables from multiple possible locations
const envPaths = [
  path.join(__dirname, '../apps/web/.env.local'),
  path.join(__dirname, '../apps/web/.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../env.production.example'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📁 Loaded env from: ${envPath}`);
    break;
  }
}

// Also try loading from system environment
require('dotenv').config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gateway:gateway@localhost:5433/pokt_ai';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokt.ai';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripeClient = stripe(STRIPE_SECRET_KEY);
const pool = new Pool({ connectionString: DATABASE_URL });

async function createCheckoutSession(email, endpointId, amount) {
  try {
    console.log(`\n🔍 Looking up user: ${email}`);
    
    // Find user by email
    const userResult = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${email}`);
    }
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.name} (${user.id})`);

    // Find endpoint and its organization
    console.log(`\n🔍 Looking up endpoint: ${endpointId}`);
    const endpointResult = await pool.query(
      'SELECT id, name, org_id FROM endpoints WHERE id = $1',
      [endpointId]
    );
    
    if (endpointResult.rows.length === 0) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    const endpoint = endpointResult.rows[0];
    console.log(`✅ Found endpoint: ${endpoint.name} (org: ${endpoint.org_id})`);

    if (!endpoint.org_id) {
      throw new Error(`Endpoint has no organization ID`);
    }

    // Verify user owns or is member of the organization
    const orgResult = await pool.query(
      `SELECT o.id, o.name, o.owner_id 
       FROM organizations o 
       LEFT JOIN org_members om ON om.org_id = o.id 
       WHERE o.id = $1 AND (o.owner_id = $2 OR om.user_id = $2)`,
      [endpoint.org_id, user.id]
    );

    if (orgResult.rows.length === 0) {
      throw new Error(`User ${email} is not associated with organization ${endpoint.org_id}`);
    }
    const org = orgResult.rows[0];
    console.log(`✅ Verified organization: ${org.name} (${org.id})`);

    // Create Stripe checkout session
    console.log(`\n💳 Creating Stripe checkout session for $${amount}...`);
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100), // Convert to cents
            product_data: {
              name: 'pokt.ai RPC Services',
              description: `Payment for endpoint: ${endpoint.name} (${endpointId})`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${SITE_URL}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/billing?payment=cancelled`,
      customer_email: email, // Pre-fill email
      metadata: {
        org_id: endpoint.org_id,
        user_id: user.id,
        endpoint_id: endpointId,
        amount: amount.toString(),
        description: `Payment for endpoint: ${endpoint.name}`,
      },
    });

    console.log(`\n✅ Stripe checkout session created successfully!`);
    console.log(`\n📋 Session Details:`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Amount: $${amount}`);
    console.log(`   Organization: ${org.name} (${org.id})`);
    console.log(`   Endpoint: ${endpoint.name} (${endpointId})`);
    console.log(`   User: ${user.name} (${email})`);
    console.log(`\n🔗 Checkout URL:`);
    console.log(`   ${session.url}`);
    console.log(`\n💡 The user can now visit this URL to complete the payment.`);
    console.log(`   After payment, the webhook will automatically update the organization's balance.`);

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      amount,
      orgId: endpoint.org_id,
      endpointId,
      userId: user.id,
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Stripe error details:', error.message);
    }
    throw error;
  } finally {
    await pool.end();
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node create-stripe-checkout-for-user.js <email> <endpointId> <amount>');
  console.error('Example: node create-stripe-checkout-for-user.js jonathanmaria@gmail.com oasys_1764640848837_1764640848845 50');
  process.exit(1);
}

const [email, endpointId, amountStr] = args;
const amount = parseFloat(amountStr);

if (isNaN(amount) || amount <= 0) {
  console.error('❌ Error: Amount must be a positive number');
  process.exit(1);
}

createCheckoutSession(email, endpointId, amount)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

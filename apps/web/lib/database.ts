import { Pool } from 'pg';

// Database connection pool - optimized for high throughput (5K+ RPS)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '500'), // Increased to 500 for high load (was 200)
  min: parseInt(process.env.DB_POOL_MIN || '20'), // Increased minimum to reduce connection churn
  idleTimeoutMillis: 60000, // Increased to 60 seconds to keep connections alive longer
  connectionTimeoutMillis: 15000, // Increased to 15 seconds for better reliability under load
  // Don't set statement_timeout in pool config - let individual queries handle it
  // Disable SSL for local/internal Docker network connections
  // Only enable SSL if explicitly set via DB_SSL env var
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Log pool statistics periodically (for monitoring)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log(`[DB Pool] Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
  }, 30000); // Every 30 seconds
}

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}

// Execute a query with error handling and timeout
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    // Set a reasonable query timeout (5 seconds) - this prevents queries from hanging
    await client.query('SET statement_timeout = 5000');
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    const err = error as Error;
    // Don't log timeout/connection errors as they're expected under load
    if (!err.message.includes('timeout') && 
        !err.message.includes('canceling') && 
        !err.message.includes('connection') &&
        !err.message.includes('pool')) {
      console.error('[DB Query Error]', err.message);
      console.error('[DB Query] SQL:', text.substring(0, 200)); // Limit log length
    }
    throw error;
  } finally {
    client.release();
  }
}

// User-related queries
export const userQueries = {
  async findByEmail(email: string) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id: string) {
    console.log('[DB] Finding user by ID:', id);
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    console.log('[DB] Query result:', result.rows);
    return result.rows[0] || null;
  },

  async create(userData: {
    email: string;
    name: string;
    password: string;
    company?: string;
    plan?: string;
    id?: string; // Optional: allow specifying user ID
  }) {
    const userId = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await query(
      `INSERT INTO users (id, email, name, auth0_sub, password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        userData.email, 
        userData.name, 
        `auth0|${userId}`, // Generate auth0_sub based on user ID
        userData.password
      ]
    );
    return result.rows[0];
  },

  async verify(id: string) {
    const result = await query(
      'UPDATE users SET verified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  async getVerificationCode(email: string) {
    const result = await query(
      'SELECT verification_code, verification_code_expires_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async verifyWithCode(email: string, code: string) {
    const result = await query(
      `UPDATE users 
       SET verification_code = NULL, 
           verification_code_expires_at = NULL,
           updated_at = NOW()
       WHERE email = $1 AND verification_code = $2 AND verification_code_expires_at > NOW()
       RETURNING *`,
      [email, code]
    );
    return result.rows[0] || null;
  },

  async findByOrganizationId(organizationId: string) {
    const result = await query(
      'SELECT * FROM users WHERE organization_id = $1',
      [organizationId]
    );
    return result.rows;
  }
};

// Organization-related queries
export const organizationQueries = {
  async findById(id: string) {
    const result = await query('SELECT * FROM organizations WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: string) {
    // Get all organizations the user is a member of (including owned ones)
    const result = await query(
      `SELECT o.* FROM organizations o
       INNER JOIN org_members om ON o.id = om.org_id
       WHERE om.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async create(orgData: {
    name: string;
    plan: string;
    userId: string;
  }) {
    const orgId = `org_${Date.now()}`;
    
    // Create organization
    const result = await query(
      `INSERT INTO organizations (id, name, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [orgId, orgData.name, orgData.userId]
    );
    
    const organization = result.rows[0];
    
    // Add user as owner in org_members table
    await query(
      `INSERT INTO org_members (id, org_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [`member_${Date.now()}`, orgId, orgData.userId, 'owner']
    );
    
    return organization;
  }
};

// Endpoint-related queries
export const endpointQueries = {
  async findAll(organizationId?: string, customerId?: string, includeDeleted: boolean = false) {
    let queryText = 'SELECT * FROM endpoints';
    const params: any[] = [];
    const conditions: string[] = [];

    if (organizationId) {
      conditions.push('org_id = $' + (params.length + 1));
      params.push(organizationId);
    }

    // By default, exclude deleted endpoints (where is_active = false)
    // For billing, use findAllForBilling() which includes deleted
    if (!includeDeleted) {
      conditions.push('(is_active = true OR is_active IS NULL)');
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  },

  async findAllForBilling(organizationId?: string) {
    // Special method for billing - includes deleted endpoints to ensure all usage is billed
    return this.findAll(organizationId, undefined, true);
  },

  async findById(id: string) {
    const fs = require('fs');
    const logFile = '/tmp/endpoint-lookup.log';
    const logMsg = `[${new Date().toISOString()}] [DB] Finding endpoint by ID: ${id}\n`;
    try {
      fs.appendFileSync(logFile, logMsg);
    } catch (e) {}
    console.log(`[DB] Finding endpoint by ID: ${id}`);
    const result = await query('SELECT * FROM endpoints WHERE id = $1', [id]);
    const resultMsg = `[${new Date().toISOString()}] [DB] Endpoint query result: ${result.rows.length} rows found for ${id}\n`;
    try {
      fs.appendFileSync(logFile, resultMsg);
    } catch (e) {}
    console.log(`[DB] Endpoint query result: ${result.rows.length} rows found`);
    if (result.rows.length > 0) {
      const foundMsg = `[${new Date().toISOString()}] [DB] Found endpoint: ${result.rows[0].id}, is_active: ${result.rows[0].is_active}, deleted_at: ${result.rows[0].deleted_at}\n`;
      try {
        fs.appendFileSync(logFile, foundMsg);
      } catch (e) {}
      console.log(`[DB] Found endpoint: ${result.rows[0].id}, is_active: ${result.rows[0].is_active}, deleted_at: ${result.rows[0].deleted_at}`);
    } else {
      const notFoundMsg = `[${new Date().toISOString()}] [DB] Endpoint NOT FOUND in database: ${id}\n`;
      try {
        fs.appendFileSync(logFile, notFoundMsg);
      } catch (e) {}
    }
    return result.rows[0] || null;
  },

  async create(endpointData: {
    name: string;
    chainId: number;
    organizationId: string;
    customerId?: string;
    rpcUrl?: string;
    apiKey?: string;
    rateLimit?: number;
    pathAppAddress?: string; // Optional: Per-network PATH gateway app address (for multi-tenant support)
  }) {
    // Use transaction to ensure endpoint and network are created atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Generate endpoint ID
      const endpointId = endpointData.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
      
      // Create endpoint
      const endpointResult = await client.query(
        `INSERT INTO endpoints (id, name, base_url, health_url, description, is_active, org_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          endpointId,
          endpointData.name,
          endpointData.rpcUrl || `https://pokt.ai/api/gateway?endpoint=${endpointId}`,
          endpointData.rpcUrl || `https://pokt.ai/api/health?endpoint=${endpointId}`,
          `Ethereum ${endpointData.chainId} endpoint`,
          true,
          endpointData.organizationId
        ]
      );
      
      const endpoint = endpointResult.rows[0];
      
      // Create network record for this endpoint (within transaction)
      // Use direct query instead of networkQueries.create to stay in same transaction
      // Use local PATH gateway URL (configurable via environment variable)
      // Default to http://172.17.0.1:3070/v1 (Docker bridge IP for local PATH gateway)
      const DEFAULT_RPC_URL = process.env.DEFAULT_RPC_URL || 'http://172.17.0.1:3070/v1';
      
      const chainMapping: Record<number, { code: string; rpcUrl: string; isTestnet?: boolean }> = {
        1: { code: 'eth', rpcUrl: DEFAULT_RPC_URL },
        43114: { code: 'avax', rpcUrl: DEFAULT_RPC_URL },
        56: { code: 'bsc', rpcUrl: DEFAULT_RPC_URL },
        10: { code: 'opt', rpcUrl: DEFAULT_RPC_URL },
        42161: { code: 'arb-one', rpcUrl: DEFAULT_RPC_URL },
        8453: { code: 'base', rpcUrl: DEFAULT_RPC_URL },
        59144: { code: 'linea', rpcUrl: DEFAULT_RPC_URL },
        5000: { code: 'mantle', rpcUrl: DEFAULT_RPC_URL },
        80094: { code: 'bera', rpcUrl: DEFAULT_RPC_URL },
        122: { code: 'fuse', rpcUrl: DEFAULT_RPC_URL },
        252: { code: 'fraxtal', rpcUrl: DEFAULT_RPC_URL },
        1088: { code: 'metis', rpcUrl: DEFAULT_RPC_URL },
        81457: { code: 'blast', rpcUrl: DEFAULT_RPC_URL },
        288: { code: 'boba', rpcUrl: DEFAULT_RPC_URL },
        250: { code: 'fantom', rpcUrl: DEFAULT_RPC_URL },
        100: { code: 'gnosis', rpcUrl: DEFAULT_RPC_URL },
        57073: { code: 'ink', rpcUrl: DEFAULT_RPC_URL },
        2222: { code: 'kava', rpcUrl: DEFAULT_RPC_URL },
        248: { code: 'oasys', rpcUrl: DEFAULT_RPC_URL },
        137: { code: 'poly', rpcUrl: DEFAULT_RPC_URL },
        146: { code: 'sonic', rpcUrl: DEFAULT_RPC_URL },
        0: { code: 'solana', rpcUrl: DEFAULT_RPC_URL },
        11155420: { code: 'opt-sepolia-testnet', rpcUrl: DEFAULT_RPC_URL, isTestnet: true },
        421614: { code: 'arb-sepolia-testnet', rpcUrl: DEFAULT_RPC_URL, isTestnet: true },
        84532: { code: 'base-sepolia-testnet', rpcUrl: DEFAULT_RPC_URL, isTestnet: true },
        17000: { code: 'eth-holesky-testnet', rpcUrl: DEFAULT_RPC_URL, isTestnet: true },
        11155111: { code: 'eth-sepolia-testnet', rpcUrl: DEFAULT_RPC_URL, isTestnet: true },
        42220: { code: 'celo', rpcUrl: DEFAULT_RPC_URL },
        80085: { code: 'bera-old', rpcUrl: DEFAULT_RPC_URL },
      };
      
      const chainInfo = chainMapping[endpointData.chainId] || { 
        code: `chain_${endpointData.chainId}`, 
        rpcUrl: DEFAULT_RPC_URL, 
        isTestnet: false 
      };
      
      const networkId = `network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isTestnet = chainInfo.isTestnet !== undefined 
        ? chainInfo.isTestnet 
        : endpointData.chainId >= 1000000 || 
          endpointData.chainId === 17000 || 
          endpointData.chainId === 11155111 || 
          endpointData.chainId === 11155420 || 
          endpointData.chainId === 421614 || 
          endpointData.chainId === 84532;
      
      await client.query(
        `INSERT INTO networks (id, code, chain_id, rpc_url, ws_url, path_app_address, is_testnet, is_enabled, endpoint_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          networkId,
          chainInfo.code,
          endpointData.chainId,
          chainInfo.rpcUrl,
          null, // ws_url
          endpointData.pathAppAddress || null, // path_app_address
          isTestnet,
          true, // is_enabled
          endpoint.id,
        ]
      );
      
      // Validate network was created
      const networkCheck = await client.query(
        'SELECT COUNT(*) as count FROM networks WHERE endpoint_id = $1',
        [endpoint.id]
      );
      
      if (parseInt(networkCheck.rows[0].count) === 0) {
        throw new Error('Network creation failed - no network record found after creation');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      return endpoint;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('[ENDPOINT CREATE] Transaction failed, rolling back:', error);
      throw error;
    } finally {
      // Always release client back to pool
      client.release();
    }
  },

  async updateStatus(id: string, status: string) {
    const result = await query(
      'UPDATE endpoints SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  },

  async updateUrl(id: string, rpcUrl: string) {
    const result = await query(
      'UPDATE endpoints SET base_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [rpcUrl, id]
    );
    return result.rows[0] || null;
  },

  async delete(id: string) {
    // Soft delete: Mark as inactive instead of deleting (for billing history)
    const result = await query(
      'UPDATE endpoints SET is_active = false, deleted_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  async hardDelete(id: string) {
    // Hard delete (use with caution - loses billing history)
    const result = await query('DELETE FROM endpoints WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
};

// Network-related queries
export const networkQueries = {
  async findByEndpointId(endpointId: string) {
    console.log('[NETWORK QUERY] Finding networks for endpoint:', endpointId);
    try {
      const result = await query('SELECT * FROM networks WHERE endpoint_id = $1', [endpointId]);
      console.log('[NETWORK QUERY] Found', result.rows.length, 'networks for endpoint', endpointId);
      if (result.rows.length > 0) {
        console.log('[NETWORK QUERY] Network details:', result.rows.map(r => ({ id: r.id, code: r.code, chain_id: r.chain_id })));
      } else {
        console.log('[NETWORK QUERY] WARNING: No networks found for endpoint', endpointId);
      }
      return result.rows;
    } catch (error) {
      console.error('[NETWORK QUERY] Error querying networks for endpoint', endpointId, ':', error);
      throw error;
    }
  },

  async findById(id: string) {
    const result = await query('SELECT * FROM networks WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(networkData: {
    endpointId: string;
    chainId: number;
    pathAppAddress?: string; // Optional: Per-network PATH gateway app address (for multi-tenant support)
  }) {
    // Comprehensive chain mapping for all WeaversNodes-supported networks (27 chains)
    const chainMapping: Record<number, { code: string; rpcUrl: string; isTestnet?: boolean }> = {
      // Mainnets - WeaversNodes supported
      1: { code: 'eth', rpcUrl: 'https://rpctest.pokt.ai' },
      43114: { code: 'avax', rpcUrl: 'https://rpctest.pokt.ai' },
      56: { code: 'bsc', rpcUrl: 'https://rpctest.pokt.ai' },
      10: { code: 'opt', rpcUrl: 'https://rpctest.pokt.ai' },
      42161: { code: 'arb-one', rpcUrl: 'https://rpctest.pokt.ai' },
      8453: { code: 'base', rpcUrl: 'https://rpctest.pokt.ai' },
      59144: { code: 'linea', rpcUrl: 'https://rpctest.pokt.ai' },
      5000: { code: 'mantle', rpcUrl: 'https://rpctest.pokt.ai' },
      80094: { code: 'bera', rpcUrl: 'https://rpctest.pokt.ai' }, // Fixed: was 80085
      122: { code: 'fuse', rpcUrl: 'https://rpctest.pokt.ai' },
      252: { code: 'fraxtal', rpcUrl: 'https://rpctest.pokt.ai' },
      1088: { code: 'metis', rpcUrl: 'https://rpctest.pokt.ai' },
      81457: { code: 'blast', rpcUrl: 'https://rpctest.pokt.ai' },
      288: { code: 'boba', rpcUrl: 'https://rpctest.pokt.ai' },
      250: { code: 'fantom', rpcUrl: 'https://rpctest.pokt.ai' },
      100: { code: 'gnosis', rpcUrl: 'https://rpctest.pokt.ai' },
      57073: { code: 'ink', rpcUrl: 'https://rpctest.pokt.ai' },
      2222: { code: 'kava', rpcUrl: 'https://rpctest.pokt.ai' },
      248: { code: 'oasys', rpcUrl: 'https://rpctest.pokt.ai' },
      137: { code: 'poly', rpcUrl: 'https://rpctest.pokt.ai' },
      146: { code: 'sonic', rpcUrl: 'https://rpctest.pokt.ai' },
      // Solana (chainId 0 or special handling)
      0: { code: 'solana', rpcUrl: 'https://rpctest.pokt.ai' },
      
      // Testnets - WeaversNodes supported
      11155420: { code: 'opt-sepolia-testnet', rpcUrl: 'https://rpctest.pokt.ai', isTestnet: true },
      421614: { code: 'arb-sepolia-testnet', rpcUrl: 'https://rpctest.pokt.ai', isTestnet: true },
      84532: { code: 'base-sepolia-testnet', rpcUrl: 'https://rpctest.pokt.ai', isTestnet: true },
      17000: { code: 'eth-holesky-testnet', rpcUrl: 'https://rpctest.pokt.ai', isTestnet: true },
      11155111: { code: 'eth-sepolia-testnet', rpcUrl: 'https://rpctest.pokt.ai', isTestnet: true },
      
      // Additional chains (not in WeaversNodes but kept for compatibility)
      42220: { code: 'celo', rpcUrl: 'https://rpctest.pokt.ai' },
      80085: { code: 'bera-old', rpcUrl: 'https://rpctest.pokt.ai' }, // Old Bera chain ID
    };

    const chainInfo = chainMapping[networkData.chainId] || { code: `chain_${networkData.chainId}`, rpcUrl: 'https://rpctest.pokt.ai', isTestnet: false };
    const networkId = `network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine if testnet based on chain mapping or chain ID
    const isTestnet = chainInfo.isTestnet !== undefined 
      ? chainInfo.isTestnet 
      : networkData.chainId >= 1000000 || // Testnets typically have high chain IDs
        networkData.chainId === 17000 || // Holesky
        networkData.chainId === 11155111 || // Sepolia
        networkData.chainId === 11155420 || // Optimism Sepolia
        networkData.chainId === 421614 || // Arbitrum Sepolia
        networkData.chainId === 84532; // Base Sepolia

    const result = await query(
      `INSERT INTO networks (id, code, chain_id, rpc_url, ws_url, path_app_address, is_testnet, is_enabled, endpoint_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        networkId,
        chainInfo.code,
        networkData.chainId,
        chainInfo.rpcUrl,
        null, // ws_url
        networkData.pathAppAddress || null, // path_app_address (optional, for multi-tenant support)
        isTestnet, // is_testnet (determined from chain mapping or chain ID)
        true, // is_enabled
        networkData.endpointId,
      ]
    );
    return result.rows[0];
  },
};

// Usage-related queries
export const usageQueries = {
  async getMonthlyUsage(apiKeyId: string, month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format
    const result = await query(
      `SELECT 
         api_key_id,
         DATE_TRUNC('month', ts_minute) as month,
         SUM(count) as total_relays,
         AVG(latency_p50) as avg_response_time,
         COUNT(*) as request_count
       FROM usage 
       WHERE api_key_id = $1 AND DATE_TRUNC('month', ts_minute) = $2
       GROUP BY api_key_id, DATE_TRUNC('month', ts_minute)`,
      [apiKeyId, targetMonth]
    );
    return result.rows[0] || null;
  },

  async getUsageHistory(apiKeyId: string, days: number = 30) {
    const result = await query(
      `SELECT 
         DATE(ts_minute) as date,
         SUM(count) as relays,
         AVG(latency_p50) as avg_response_time
       FROM usage 
       WHERE api_key_id = $1 AND ts_minute >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(ts_minute)
       ORDER BY date DESC`,
      [apiKeyId]
    );
    return result.rows;
  },

  async logUsage(usageData: {
    apiKeyId: string;
    relayCount: number;
    responseTime: number;
    method?: string;
    networkId?: string;
  }) {
    const fs = require('fs');
    const logFile = '/tmp/usage-logging.log';
    try {
      const startMsg = `[${new Date().toISOString()}] [USAGE] logUsage called for endpoint: ${usageData.apiKeyId}, relayCount: ${usageData.relayCount}, responseTime: ${usageData.responseTime}\n`;
      fs.appendFileSync(logFile, startMsg);
      console.log(`[USAGE] logUsage called for endpoint: ${usageData.apiKeyId}, relayCount: ${usageData.relayCount}, responseTime: ${usageData.responseTime}`);
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Optimized UPSERT: Atomic operation that eliminates race conditions
      // This reduces database queries from 2 (SELECT + UPDATE/INSERT) to 1 (UPSERT)
      // Benefits:
      // 1. Atomic operation (no race condition)
      // 2. Reduces database load by 50%
      // 3. Eliminates lock contention on usage_daily table
      // 4. Better performance under high load (5K+ RPS, 10M relays)
      const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const errorRate = usageData.responseTime > 5000 ? 0.1 : 0;
      
      const upsertMsg = `[${new Date().toISOString()}] [USAGE] Executing UPSERT for endpoint: ${usageData.apiKeyId}, date: ${today.toISOString()}, relays: ${usageData.relayCount}, usageId: ${usageId}\n`;
      fs.appendFileSync(logFile, upsertMsg);
      console.log(`[USAGE] Executing UPSERT for endpoint: ${usageData.apiKeyId}, date: ${today.toISOString()}, relays: ${usageData.relayCount}`);
      // Calculate weighted average latency instead of just keeping max
      // Formula: new_avg = (old_avg * old_count + new_latency * new_count) / (old_count + new_count)
      // Note: Cached requests have 0 latency, which is correct (they're instant)
      // When calculating averages, we exclude 0-latency requests (cached) from the average calculation
      // This ensures we track actual upstream RPC latency, matching PATH gateway metrics
      const result = await query(
        `INSERT INTO usage_daily (id, endpoint_id, date, relays, p95_ms, error_rate, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (endpoint_id, date)
         DO UPDATE SET
           relays = usage_daily.relays + EXCLUDED.relays,
           p95_ms = CASE 
             WHEN usage_daily.relays = 0 THEN EXCLUDED.p95_ms
             WHEN EXCLUDED.p95_ms = 0 AND usage_daily.p95_ms > 0 THEN usage_daily.p95_ms  -- Don't update average if new latency is 0 (cached) and we have real data
             WHEN EXCLUDED.p95_ms = 0 AND usage_daily.p95_ms = 0 THEN 0  -- Both are 0, keep 0
             WHEN usage_daily.p95_ms = 0 THEN EXCLUDED.p95_ms  -- If old average was 0, use new value
             ELSE ROUND(
               (usage_daily.p95_ms::numeric * usage_daily.relays::numeric + 
                EXCLUDED.p95_ms::numeric * EXCLUDED.relays::numeric) / 
               (usage_daily.relays + EXCLUDED.relays)::numeric
             )
           END,
           error_rate = EXCLUDED.error_rate`,
        [
          usageId,
          usageData.apiKeyId,
          today,
          usageData.relayCount,
          usageData.responseTime,
          errorRate
        ]
      );
      
      const successMsg = `[${new Date().toISOString()}] [USAGE] Successfully logged usage for endpoint: ${usageData.apiKeyId}, result rowCount: ${result.rowCount}\n`;
      fs.appendFileSync(logFile, successMsg);
      console.log(`[USAGE] Successfully logged usage for endpoint: ${usageData.apiKeyId}, result rowCount: ${result.rowCount}`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const errorMsg = `[${new Date().toISOString()}] [USAGE] Error logging usage for endpoint ${usageData.apiKeyId}: ${err.message}, stack: ${err.stack}\n`;
      try {
        fs.appendFileSync(logFile, errorMsg);
      } catch (e) {}
      console.error(`[USAGE] Error logging usage for endpoint ${usageData.apiKeyId}:`, err.message);
      console.error(`[USAGE] Error stack:`, err.stack);
      return { success: false, error: err.message };
    }
  },

  async getUsageByEndpointId(endpointId: string) {
    try {
      // Get total relays from usage_daily table
      const result = await query(
        'SELECT SUM(relays) as total_relays, AVG(p95_ms) as avg_response_time, AVG(error_rate) as avg_error_rate FROM usage_daily WHERE endpoint_id = $1',
        [endpointId]
      );
      
      return {
        totalRelays: parseInt(result.rows[0]?.total_relays || '0'),
        avgResponseTime: Math.round(parseFloat(result.rows[0]?.avg_response_time || '0')),
        errorRate: parseFloat(result.rows[0]?.avg_error_rate || '0')
      };
    } catch (error) {
      console.error('[USAGE] Error getting usage data:', error);
      return {
        totalRelays: 0,
        avgResponseTime: 0,
        errorRate: 0
      };
    }
  }
};

export default pool;

import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

// Execute a query with error handling
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
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
  }) {
    const result = await query(
      `INSERT INTO users (id, email, name, auth0_sub, password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [
        `user_${Date.now()}`,
        userData.email, 
        userData.name, 
        `auth0|user_${Date.now()}`, // Generate auth0_sub
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
    const result = await query(
      'SELECT * FROM organizations WHERE owner_id = $1',
      [userId]
    );
    return result.rows;
  },

  async create(orgData: {
    name: string;
    plan: string;
    userId: string;
  }) {
    const result = await query(
      `INSERT INTO organizations (id, name, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [`org_${Date.now()}`, orgData.name, orgData.userId]
    );
    
    return result.rows[0];
  }
};

// Endpoint-related queries
export const endpointQueries = {
  async findAll(organizationId?: string, customerId?: string) {
    let queryText = 'SELECT * FROM endpoints';
    const params: any[] = [];
    const conditions: string[] = [];

    if (organizationId) {
      conditions.push('org_id = $' + (params.length + 1));
      params.push(organizationId);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  },

  async findById(id: string) {
    const result = await query('SELECT * FROM endpoints WHERE id = $1', [id]);
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
  }) {
    // Generate endpoint ID
    const endpointId = endpointData.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
    
    const result = await query(
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
    return result.rows[0];
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
    const result = await query('DELETE FROM endpoints WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
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
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if usage record exists for today
      const existingRecord = await query(
        'SELECT * FROM usage_daily WHERE endpoint_id = $1 AND date = $2',
        [usageData.apiKeyId, today]
      );
      
      if (existingRecord.rows.length > 0) {
        // Update existing record
        await query(
          'UPDATE usage_daily SET relays = relays + $1, p95_ms = GREATEST(p95_ms, $2), error_rate = $3 WHERE endpoint_id = $4 AND date = $5',
          [
            usageData.relayCount,
            usageData.responseTime,
            usageData.responseTime > 5000 ? 0.1 : 0, // Simple error rate calculation
            usageData.apiKeyId,
            today
          ]
        );
      } else {
        // Create new record
        const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await query(
          'INSERT INTO usage_daily (id, endpoint_id, date, relays, p95_ms, error_rate, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [
            usageId,
            usageData.apiKeyId,
            today,
            usageData.relayCount,
            usageData.responseTime,
            usageData.responseTime > 5000 ? 0.1 : 0
          ]
        );
      }
      
      console.log(`[USAGE] Logged ${usageData.relayCount} relays for endpoint ${usageData.apiKeyId}`);
      return { success: true };
    } catch (error) {
      console.error('[USAGE] Error logging usage:', error);
      return { success: false, error: error.message };
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

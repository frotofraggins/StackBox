const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute query with automatic owner_id filtering for multi-tenancy
 */
const query = async (text, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Tenant-aware query helper - automatically adds owner_id filter
 */
const tenantQuery = async (owner_id, text, params = []) => {
  // Add owner_id as first parameter
  const tenantParams = [owner_id, ...params];
  
  // Modify query to include owner_id filter if not already present
  let tenantText = text;
  if (!text.toLowerCase().includes('where')) {
    tenantText = text.replace(/FROM\s+(\w+)/i, 'FROM $1 WHERE owner_id = $1');
  } else {
    tenantText = text.replace(/WHERE/i, 'WHERE owner_id = $1 AND');
  }
  
  return query(tenantText, tenantParams);
};

module.exports = {
  query,
  tenantQuery,
  pool
};

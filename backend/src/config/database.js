const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flowstock',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Initialize database tables
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        current_quantity INTEGER DEFAULT 0,
        total_cost DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory_batches table (for FIFO tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_batches (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        remaining_quantity INTEGER NOT NULL,
        unit_price DECIMAL(15, 2) NOT NULL,
        total_cost DECIMAL(15, 2) NOT NULL,
        purchased_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster FIFO queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_batches_product_purchased 
      ON inventory_batches(product_id, purchased_at)
    `);

    // Create sales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
        quantity_sold INTEGER NOT NULL,
        total_cost DECIMAL(15, 2) NOT NULL,
        average_cost DECIMAL(15, 2) NOT NULL,
        sold_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sale_batch_details table (which batches were used)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_batch_details (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE CASCADE,
        quantity_from_batch INTEGER NOT NULL,
        unit_price DECIMAL(15, 2) NOT NULL,
        cost_from_batch DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions_log table (for ledger view)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions_log (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
        transaction_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15, 2),
        total_cost DECIMAL(15, 2),
        transaction_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default user (username: admin, password: admin123)
    // Password hash for 'admin123' using bcrypt
    await client.query(`
      INSERT INTO users (username, password)
      VALUES ('admin', '$2a$10$8K1p/a0dL3LzYWfN9X5Qs.KGZWzZb3DqU3rYxHvYGJv6YHv5L/3Oa')
      ON CONFLICT (username) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
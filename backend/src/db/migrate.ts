import { pool } from './pool';

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        phone VARCHAR(16) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS loans (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_name VARCHAR(80) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        due_date DATE NOT NULL,
        repaid_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_loans_user_created ON loans(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_loans_user_due ON loans(user_id, due_date) WHERE repaid_at IS NULL;
    `);
    console.log('MiniLedger database schema is ready.');
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error);
  process.exit(1);
});

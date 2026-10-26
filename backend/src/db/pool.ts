import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL explicitly in hosted environments by configuring your provider's
  // connection string/options rather than disabling certificate checks globally.
});

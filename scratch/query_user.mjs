import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const res = await pool.query('SELECT id, email, role FROM "User" LIMIT 5;');
  console.log('Users in DB:', res.rows);
} catch (err) {
  console.error('Error querying:', err);
} finally {
  await pool.end();
}

import mysql from 'mysql2/promise';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './schema';

let pool: mysql.Pool | null = null;
let db: MySql2Database<typeof schema> | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'jehovahs_light',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jehovahs_light',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export function getDb() {
  if (!db) {
    db = drizzle({ client: getPool(), schema, mode: 'default' });
  }
  return db;
}

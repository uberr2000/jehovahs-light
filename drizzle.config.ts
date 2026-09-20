import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit reads the same DB_* keys as the runtime pool in src/lib/db.
 * drizzle-kit loads `.env` from cwd; deploy also sources host `.env` before migrate.
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'jehovahs_light',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jehovahs_light',
  },
});

import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit reads the same DB_* keys as the runtime pool in src/lib/db.
 * drizzle-kit loads `.env` from cwd; deploy also sources host `.env` before migrate.
 */
const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'jehovahs_light';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'jehovahs_light';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  // Credential form rejects an empty password; the URL form allows a
  // passwordless local user, matching the runtime pool.
  dbCredentials: password
    ? { host, user, password, database }
    : { url: `mysql://${encodeURIComponent(user)}@${host}/${encodeURIComponent(database)}` },
});

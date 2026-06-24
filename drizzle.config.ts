import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Next.js ortamında .env.local dosyasının Drizzle Kit tarafından okunmasını sağla
dotenv.config({ path: '.env.local' });

/**
 * Drizzle Kit config (Phase 3).
 *
 * `drizzle-kit generate` reads the schema and emits SQL migrations OFFLINE — no
 * database connection is required, so migrations are produced and committed now.
 * `push`/`migrate` (which DO connect) run only at activation, once DATABASE_URL
 * (Supabase Postgres) is provisioned.
 */
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});

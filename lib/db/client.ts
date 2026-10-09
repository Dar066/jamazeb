// Server-only connection to the store's PostgreSQL database (Supabase).
// Set DATABASE_URL in Vercel to switch the store from browser demo mode to
// database mode. Leave it empty and everything keeps working as a demo.

import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { jamazebSql?: Sql };

/** True when a database is configured. */
export function databaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Shared connection pool, created on first use. Null in demo mode. */
export function db(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.jamazebSql) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    globalForDb.jamazebSql = postgres(url, {
      // Supabase's connection pooler (port 6543) doesn't support prepared statements.
      prepare: false,
      ssl: local ? false : "require",
      // A local test database takes one connection at a time; Supabase takes several.
      max: local ? 1 : 3,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb.jamazebSql;
}

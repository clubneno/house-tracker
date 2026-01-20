import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Use placeholder during build, actual connection at runtime
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder";

const sql = neon(databaseUrl);

// Regular db for non-transactional queries (HTTP - faster for single queries)
export const db = drizzleHttp(sql, { schema });

// Pool-based db for transactions (WebSocket - supports transactions)
const pool = new Pool({ connectionString: databaseUrl });
export const dbPool = drizzleServerless(pool, { schema });

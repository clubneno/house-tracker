import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use placeholder during build, actual connection at runtime
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder";

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

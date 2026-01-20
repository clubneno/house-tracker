import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Read the migration file
  const migrationPath = join(__dirname, "../src/lib/db/migrations/0001_add_indexes_and_rls.sql");
  const migrationContent = readFileSync(migrationPath, "utf-8");

  // Split by semicolon and filter empty statements
  const statements = migrationContent
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, " ") + "...";

    try {
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);
      await sql(statement);
      console.log("  ✓ Success\n");
    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}\n`);
      // Continue with other statements
    }
  }

  console.log("Migration complete!");
}

applyMigration().catch(console.error);

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(databaseUrl);

const statements = [
  // ============================================
  // ENABLE ROW LEVEL SECURITY ON ALL TABLES
  // ============================================
  "ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE areas ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE rooms ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE purchases ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE purchase_line_items ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE attachments ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE app_users ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY",

  // ============================================
  // CREATE RLS POLICIES
  // For this single-household app, authenticated users can access all data
  // The auth.user_id() function returns the current user's ID from Neon Auth JWT
  // ============================================

  // app_users: Users can view all, but only update/delete their own
  "DROP POLICY IF EXISTS app_users_select ON app_users",
  "CREATE POLICY app_users_select ON app_users FOR SELECT USING (auth.user_id() IS NOT NULL)",

  "DROP POLICY IF EXISTS app_users_insert ON app_users",
  "CREATE POLICY app_users_insert ON app_users FOR INSERT WITH CHECK (auth.user_id() IS NOT NULL)",

  "DROP POLICY IF EXISTS app_users_update ON app_users",
  "CREATE POLICY app_users_update ON app_users FOR UPDATE USING (auth.user_id() IS NOT NULL AND neon_auth_id = auth.user_id())",

  "DROP POLICY IF EXISTS app_users_delete ON app_users",
  "CREATE POLICY app_users_delete ON app_users FOR DELETE USING (auth.user_id() IS NOT NULL AND neon_auth_id = auth.user_id())",

  // user_settings: Users can only access their own settings
  "DROP POLICY IF EXISTS user_settings_all ON user_settings",
  "CREATE POLICY user_settings_all ON user_settings FOR ALL USING (auth.user_id() IS NOT NULL)",

  // suppliers: All authenticated users can access
  "DROP POLICY IF EXISTS suppliers_all ON suppliers",
  "CREATE POLICY suppliers_all ON suppliers FOR ALL USING (auth.user_id() IS NOT NULL)",

  // areas: All authenticated users can access
  "DROP POLICY IF EXISTS areas_all ON areas",
  "CREATE POLICY areas_all ON areas FOR ALL USING (auth.user_id() IS NOT NULL)",

  // rooms: All authenticated users can access
  "DROP POLICY IF EXISTS rooms_all ON rooms",
  "CREATE POLICY rooms_all ON rooms FOR ALL USING (auth.user_id() IS NOT NULL)",

  // purchases: All authenticated users can access
  "DROP POLICY IF EXISTS purchases_all ON purchases",
  "CREATE POLICY purchases_all ON purchases FOR ALL USING (auth.user_id() IS NOT NULL)",

  // purchase_line_items: All authenticated users can access
  "DROP POLICY IF EXISTS purchase_line_items_all ON purchase_line_items",
  "CREATE POLICY purchase_line_items_all ON purchase_line_items FOR ALL USING (auth.user_id() IS NOT NULL)",

  // attachments: All authenticated users can access
  "DROP POLICY IF EXISTS attachments_all ON attachments",
  "CREATE POLICY attachments_all ON attachments FOR ALL USING (auth.user_id() IS NOT NULL)",
];

async function run() {
  console.log("Enabling RLS and creating policies...\n");

  for (const stmt of statements) {
    const preview = stmt.length > 80 ? stmt.substring(0, 77) + "..." : stmt;
    try {
      await sql(stmt);
      console.log(`✓ ${preview}`);
    } catch (error) {
      console.error(`✗ ${preview}`);
      console.error(`  Error: ${error.message}\n`);
    }
  }

  console.log("\nDone!");
}

run().catch(console.error);

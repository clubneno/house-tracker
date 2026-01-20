import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(databaseUrl);

const statements = [
  // Indexes
  "CREATE INDEX IF NOT EXISTS idx_rooms_area_id ON rooms(area_id)",
  "CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id)",
  "CREATE INDEX IF NOT EXISTS idx_purchases_room_id ON purchases(room_id)",
  "CREATE INDEX IF NOT EXISTS idx_purchases_area_id ON purchases(area_id)",
  "CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date DESC)",
  "CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status)",
  "CREATE INDEX IF NOT EXISTS idx_purchases_is_deleted ON purchases(is_deleted)",
  "CREATE INDEX IF NOT EXISTS idx_purchase_line_items_purchase_id ON purchase_line_items(purchase_id)",
  "CREATE INDEX IF NOT EXISTS idx_attachments_purchase_id ON attachments(purchase_id)",
  "CREATE INDEX IF NOT EXISTS idx_attachments_line_item_id ON attachments(line_item_id)",
  "CREATE INDEX IF NOT EXISTS idx_attachments_room_id ON attachments(room_id)",
  "CREATE INDEX IF NOT EXISTS idx_app_users_neon_auth_id ON app_users(neon_auth_id)",
  "CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email)",
];

async function run() {
  console.log("Creating indexes...\n");

  for (const stmt of statements) {
    const preview = stmt.substring(0, 70) + "...";
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

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const sql = neon(process.env.DATABASE_URL);

const migrations = [
  // Homes table
  `CREATE TABLE IF NOT EXISTS homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_lt VARCHAR(255),
    address TEXT,
    purchase_date DATE,
    cover_image_url TEXT,
    description TEXT,
    description_lt TEXT,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // Home images table
  `CREATE TABLE IF NOT EXISTS home_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // Tags table
  `CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-800',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // Purchase line item tags junction table
  `CREATE TABLE IF NOT EXISTS purchase_line_item_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_item_id UUID NOT NULL REFERENCES purchase_line_items(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(line_item_id, tag_id)
  )`,

  // Add columns to areas
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'home_id') THEN
      ALTER TABLE areas ADD COLUMN home_id UUID REFERENCES homes(id);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'name_lt') THEN
      ALTER TABLE areas ADD COLUMN name_lt VARCHAR(255);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'description_lt') THEN
      ALTER TABLE areas ADD COLUMN description_lt TEXT;
    END IF;
  END $$`,

  // Add columns to rooms
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'name_lt') THEN
      ALTER TABLE rooms ADD COLUMN name_lt VARCHAR(255);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'description_lt') THEN
      ALTER TABLE rooms ADD COLUMN description_lt TEXT;
    END IF;
  END $$`,

  // Add home_id to purchases
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'home_id') THEN
      ALTER TABLE purchases ADD COLUMN home_id UUID REFERENCES homes(id);
    END IF;
  END $$`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_homes_is_deleted ON homes(is_deleted)`,
  `CREATE INDEX IF NOT EXISTS idx_areas_home_id ON areas(home_id)`,
  `CREATE INDEX IF NOT EXISTS idx_purchases_home_id ON purchases(home_id)`,
];

async function runMigrations() {
  console.log('Starting migrations...\n');

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const shortDesc = migration.substring(0, 60).replace(/\s+/g, ' ').trim();
    console.log(`[${i + 1}/${migrations.length}] Running: ${shortDesc}...`);

    try {
      await sql(migration);
      console.log(`    ✓ Success\n`);
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}\n`);
      // Continue with next migration
    }
  }

  console.log('Migrations completed!');
}

runMigrations().catch(console.error);

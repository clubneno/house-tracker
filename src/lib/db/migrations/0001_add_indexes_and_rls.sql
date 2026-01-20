-- Migration: Add Foreign Key Indexes and Row Level Security
-- Date: 2026-01-20

-- ============================================
-- PART 1: CREATE INDEXES ON FOREIGN KEYS
-- ============================================

-- rooms table
CREATE INDEX IF NOT EXISTS idx_rooms_area_id ON rooms(area_id);

-- purchases table
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_room_id ON purchases(room_id);
CREATE INDEX IF NOT EXISTS idx_purchases_area_id ON purchases(area_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_is_deleted ON purchases(is_deleted);

-- purchase_line_items table
CREATE INDEX IF NOT EXISTS idx_purchase_line_items_purchase_id ON purchase_line_items(purchase_id);

-- attachments table
CREATE INDEX IF NOT EXISTS idx_attachments_purchase_id ON attachments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_attachments_line_item_id ON attachments(line_item_id);
CREATE INDEX IF NOT EXISTS idx_attachments_room_id ON attachments(room_id);

-- app_users table
CREATE INDEX IF NOT EXISTS idx_app_users_neon_auth_id ON app_users(neon_auth_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- ============================================
-- PART 2: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: CREATE RLS POLICIES
-- ============================================

-- For this single-household app, we create policies that:
-- 1. Allow authenticated users (via Neon Auth) to access all data
-- 2. The app validates user access at the API level
-- 3. RLS provides defense-in-depth security

-- Create a function to get the current authenticated user's ID from Neon Auth JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated() RETURNS BOOLEAN AS $$
  SELECT auth.user_id() IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- app_users: Users can only see/modify their own record
DROP POLICY IF EXISTS app_users_select ON app_users;
CREATE POLICY app_users_select ON app_users
  FOR SELECT
  USING (auth.is_authenticated());

DROP POLICY IF EXISTS app_users_insert ON app_users;
CREATE POLICY app_users_insert ON app_users
  FOR INSERT
  WITH CHECK (auth.is_authenticated());

DROP POLICY IF EXISTS app_users_update ON app_users;
CREATE POLICY app_users_update ON app_users
  FOR UPDATE
  USING (auth.is_authenticated() AND neon_auth_id = auth.user_id());

DROP POLICY IF EXISTS app_users_delete ON app_users;
CREATE POLICY app_users_delete ON app_users
  FOR DELETE
  USING (auth.is_authenticated() AND neon_auth_id = auth.user_id());

-- user_settings: Users can only access their own settings
DROP POLICY IF EXISTS user_settings_all ON user_settings;
CREATE POLICY user_settings_all ON user_settings
  FOR ALL
  USING (auth.is_authenticated());

-- suppliers: All authenticated users can access
DROP POLICY IF EXISTS suppliers_all ON suppliers;
CREATE POLICY suppliers_all ON suppliers
  FOR ALL
  USING (auth.is_authenticated());

-- areas: All authenticated users can access
DROP POLICY IF EXISTS areas_all ON areas;
CREATE POLICY areas_all ON areas
  FOR ALL
  USING (auth.is_authenticated());

-- rooms: All authenticated users can access
DROP POLICY IF EXISTS rooms_all ON rooms;
CREATE POLICY rooms_all ON rooms
  FOR ALL
  USING (auth.is_authenticated());

-- purchases: All authenticated users can access
DROP POLICY IF EXISTS purchases_all ON purchases;
CREATE POLICY purchases_all ON purchases
  FOR ALL
  USING (auth.is_authenticated());

-- purchase_line_items: All authenticated users can access
DROP POLICY IF EXISTS purchase_line_items_all ON purchase_line_items;
CREATE POLICY purchase_line_items_all ON purchase_line_items
  FOR ALL
  USING (auth.is_authenticated());

-- attachments: All authenticated users can access
DROP POLICY IF EXISTS attachments_all ON attachments;
CREATE POLICY attachments_all ON attachments
  FOR ALL
  USING (auth.is_authenticated());

-- ============================================
-- PART 4: GRANT PERMISSIONS
-- ============================================

-- Grant usage on auth schema functions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_authenticated() TO authenticated;

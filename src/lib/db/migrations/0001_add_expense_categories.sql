-- Migration: Add expense_categories table and convert purchases.expense_category to varchar
-- Created: 2024-01-20

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  icon_name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  bg_color VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

-- Seed default categories
INSERT INTO expense_categories (name, label, icon_name, color, bg_color, sort_order) VALUES
  ('lighting', 'Lighting', 'Lightbulb', 'text-yellow-600', 'bg-yellow-50', 1),
  ('flooring', 'Flooring', 'LayoutGrid', 'text-amber-700', 'bg-amber-50', 2),
  ('painting', 'Painting', 'Paintbrush', 'text-pink-600', 'bg-pink-50', 3),
  ('plumbing', 'Plumbing', 'Droplets', 'text-blue-600', 'bg-blue-50', 4),
  ('electrical', 'Electrical', 'Zap', 'text-orange-600', 'bg-orange-50', 5),
  ('hvac', 'HVAC', 'Wind', 'text-cyan-600', 'bg-cyan-50', 6),
  ('carpentry', 'Carpentry', 'Hammer', 'text-stone-600', 'bg-stone-50', 7),
  ('windows_doors', 'Windows & Doors', 'DoorOpen', 'text-indigo-600', 'bg-indigo-50', 8),
  ('roofing', 'Roofing', 'Home', 'text-red-600', 'bg-red-50', 9),
  ('landscaping', 'Landscaping', 'Trees', 'text-green-600', 'bg-green-50', 10),
  ('appliances', 'Appliances', 'Refrigerator', 'text-slate-600', 'bg-slate-50', 11),
  ('furniture', 'Furniture', 'Sofa', 'text-purple-600', 'bg-purple-50', 12),
  ('fixtures', 'Fixtures', 'Bath', 'text-teal-600', 'bg-teal-50', 13),
  ('labor', 'Labor', 'HardHat', 'text-emerald-600', 'bg-emerald-50', 14),
  ('permits_fees', 'Permits & Fees', 'FileText', 'text-violet-600', 'bg-violet-50', 15),
  ('other', 'Other', 'MoreHorizontal', 'text-gray-600', 'bg-gray-50', 16)
ON CONFLICT (name) DO NOTHING;

-- Change purchases.expense_category from enum to varchar
-- Note: This preserves existing data by converting enum values to text
ALTER TABLE purchases ALTER COLUMN expense_category TYPE VARCHAR(100) USING expense_category::text;

-- Migration: Add House Documents & Expense Categories
-- Run with: psql $DATABASE_URL -f this_file.sql
-- Or use: npm run db:push (for Drizzle direct sync)

-- House document type enum
DO $$ BEGIN
  CREATE TYPE house_document_type AS ENUM (
    'purchase_agreement',
    'utility_contract',
    'insurance',
    'building_permit',
    'tax_document',
    'warranty',
    'manual',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Expense category enum
DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'lighting',
    'flooring',
    'painting',
    'plumbing',
    'electrical',
    'hvac',
    'carpentry',
    'windows_doors',
    'roofing',
    'landscaping',
    'appliances',
    'furniture',
    'fixtures',
    'labor',
    'permits_fees',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend attachments table with house document fields
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS house_document_type house_document_type;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS document_title VARCHAR(255);
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS document_description TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Add category to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS expense_category expense_category;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attachments_house_doc_type ON attachments(house_document_type)
  WHERE house_document_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_expense_category ON purchases(expense_category)
  WHERE expense_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attachments_expires_at ON attachments(expires_at)
  WHERE expires_at IS NOT NULL;

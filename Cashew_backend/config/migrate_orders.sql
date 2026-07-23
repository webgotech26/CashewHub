-- ═══════════════════════════════════════════════════════════════════
-- Migration: add address + notes columns to orders table
-- Run once against your live database.
-- Safe to re-run — uses IF NOT EXISTS logic via SHOW COLUMNS check.
-- ═══════════════════════════════════════════════════════════════════

-- Add 'address' column if it doesn't exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS address TEXT NULL AFTER status;

-- Add 'notes' column if it doesn't exist  
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER address;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM   INFORMATION_SCHEMA.COLUMNS
WHERE  TABLE_SCHEMA = DATABASE()
  AND  TABLE_NAME   = 'orders'
ORDER  BY ORDINAL_POSITION;

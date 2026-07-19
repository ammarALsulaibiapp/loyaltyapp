-- Add currency column to businesses table (if not exists)
-- Run this ONCE in Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'currency'
    ) THEN
        ALTER TABLE businesses ADD COLUMN currency TEXT DEFAULT 'OMR';
        
        COMMENT ON COLUMN businesses.currency IS 'Business currency code (OMR, SAR, AED, USD, etc.)';
        
        RAISE NOTICE 'Currency column added to businesses table';
    ELSE
        RAISE NOTICE 'Currency column already exists';
    END IF;
END $$;

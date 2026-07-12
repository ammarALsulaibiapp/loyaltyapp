-- Add currency field to businesses table
-- This allows each business to have their own currency based on country

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing businesses with appropriate currencies
-- You can manually set these based on each business's country
-- Examples:
-- UPDATE businesses SET currency = 'AED' WHERE name = 'Dubai Business';
-- UPDATE businesses SET currency = 'SAR' WHERE name = 'Saudi Business';
-- UPDATE businesses SET currency = 'OMR' WHERE name = 'Oman Business';
-- UPDATE businesses SET currency = 'QAR' WHERE name = 'Qatar Business';
-- UPDATE businesses SET currency = 'KWD' WHERE name = 'Kuwait Business';
-- UPDATE businesses SET currency = 'BHD' WHERE name = 'Bahrain Business';
-- UPDATE businesses SET currency = 'EGP' WHERE name = 'Egypt Business';

-- Set default to SAR for Saudi Arabia (most common)
UPDATE businesses 
SET currency = 'SAR' 
WHERE currency IS NULL OR currency = 'USD';

COMMENT ON COLUMN businesses.currency IS 'ISO 4217 currency code (SAR, AED, OMR, etc.)';

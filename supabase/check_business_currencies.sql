-- Check if businesses have currency set
SELECT id, name, currency FROM businesses;

-- Update all businesses to have OMR if currency is NULL
UPDATE businesses 
SET currency = 'OMR' 
WHERE currency IS NULL;

-- Verify update
SELECT id, name, currency FROM businesses;

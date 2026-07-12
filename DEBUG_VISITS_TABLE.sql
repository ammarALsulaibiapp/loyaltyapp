-- Check visits table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'visits' 
ORDER BY ordinal_position;

-- Check if there are any constraints causing issues
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'visits'::regclass;
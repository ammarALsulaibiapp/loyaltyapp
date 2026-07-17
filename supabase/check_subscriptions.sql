-- Check if subscriptions table exists and has data
SELECT * FROM subscriptions LIMIT 10;

-- Check subscription statuses
SELECT status, COUNT(*) as count 
FROM subscriptions 
GROUP BY status;

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';

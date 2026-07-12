-- ============================================================
-- DEBUG: CHECK CUSTOMER PROGRESS
-- ============================================================
-- Run this to see what's actually in the database
-- ============================================================

-- Check customer_program_progress table
SELECT 
    'PROGRESS TABLE' as table_name,
    c.phone_number,
    c.full_name,
    lp.name as program_name,
    cpp.visit_count as stamps_count,
    cpp.total_rewards_earned,
    COALESCE(lp.required_stamps, lp.visits_required, 8) as required_stamps,
    cpp.last_visit_date
FROM customer_program_progress cpp
JOIN customers c ON c.id = cpp.customer_id
JOIN loyalty_programs lp ON lp.id = cpp.loyalty_program_id
ORDER BY cpp.last_visit_date DESC
LIMIT 10;

-- Check actual visits count
SELECT 
    'ACTUAL VISITS' as table_name,
    c.phone_number,
    c.full_name,
    lp.name as program_name,
    COUNT(*) as total_visits_in_db
FROM visits v
JOIN customers c ON c.id = v.customer_id
LEFT JOIN loyalty_programs lp ON lp.id = v.loyalty_program_id
WHERE v.loyalty_program_id IS NOT NULL
GROUP BY c.phone_number, c.full_name, lp.name
ORDER BY MAX(v.visit_date) DESC
LIMIT 10;

-- Check unredeemed rewards
SELECT 
    'UNREDEEMED REWARDS' as table_name,
    c.phone_number,
    c.full_name,
    lp.name as program_name,
    COUNT(*) as unredeemed_count
FROM rewards r
JOIN customers c ON c.id = r.customer_id
JOIN loyalty_programs lp ON lp.id = r.loyalty_program_id
WHERE r.is_redeemed = false
GROUP BY c.phone_number, c.full_name, lp.name
ORDER BY unredeemed_count DESC;

-- Check if triggers exist
SELECT 
    'TRIGGERS' as info,
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname IN ('trigger_initialize_progress', 'trigger_create_reward_on_visit', 'visits_update_totals')
ORDER BY tgname;

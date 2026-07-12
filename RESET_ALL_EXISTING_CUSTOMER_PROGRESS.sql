-- ============================================================
-- RESET ALL EXISTING CUSTOMER PROGRESS
-- ============================================================
-- This initializes progress records for ALL existing customers
-- and resets their stamp counts based on actual unredeemed rewards
-- ============================================================

-- Step 1: Create progress records for all customer-program combinations
INSERT INTO customer_program_progress (
    customer_id,
    loyalty_program_id,
    visit_count,
    total_rewards_earned,
    last_visit_date
)
SELECT DISTINCT
    v.customer_id,
    v.loyalty_program_id,
    0 as visit_count,  -- Start fresh at 0
    (
        -- Count total rewards ever earned
        SELECT COUNT(*)
        FROM rewards r
        WHERE r.customer_id = v.customer_id
          AND r.loyalty_program_id = v.loyalty_program_id
    ) as total_rewards_earned,
    MAX(v.visit_date) as last_visit_date
FROM visits v
WHERE v.loyalty_program_id IS NOT NULL
GROUP BY v.customer_id, v.loyalty_program_id
ON CONFLICT (customer_id, loyalty_program_id)
DO UPDATE SET
    visit_count = 0,  -- RESET all stamps to 0
    total_rewards_earned = (
        SELECT COUNT(*)
        FROM rewards r
        WHERE r.customer_id = EXCLUDED.customer_id
          AND r.loyalty_program_id = EXCLUDED.loyalty_program_id
    ),
    updated_at = NOW();

-- Step 2: For customers with NO rewards yet, calculate current progress
-- (How many visits since their last reward or from the beginning)
UPDATE customer_program_progress cpp
SET visit_count = (
    SELECT COUNT(*)
    FROM visits v
    WHERE v.customer_id = cpp.customer_id
      AND v.loyalty_program_id = cpp.loyalty_program_id
      AND v.visit_date > COALESCE(
          (
              SELECT MAX(r.earned_date)
              FROM rewards r
              WHERE r.customer_id = cpp.customer_id
                AND r.loyalty_program_id = cpp.loyalty_program_id
          ),
          '1970-01-01'::timestamp
      )
)
WHERE visit_count = 0;

-- ============================================================
-- DONE! Now all customers have correct progress
-- ============================================================

SELECT 
    c.full_name,
    lp.name as program_name,
    cpp.visit_count,
    cpp.total_rewards_earned,
    (SELECT COUNT(*) FROM rewards r 
     WHERE r.customer_id = c.id 
       AND r.loyalty_program_id = cpp.loyalty_program_id 
       AND r.is_redeemed = false) as unredeemed_rewards
FROM customer_program_progress cpp
JOIN customers c ON c.id = cpp.customer_id
JOIN loyalty_programs lp ON lp.id = cpp.loyalty_program_id
ORDER BY c.full_name, lp.name;

SELECT '✅ All customer progress reset! Visit counts should now be correct.' as status;

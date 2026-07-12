-- =====================================================
-- CLEANUP DUPLICATE REWARDS
-- Run this in Supabase SQL Editor
-- =====================================================

-- This will remove duplicate unredeemed rewards, keeping only the oldest one

-- First, let's see how many duplicates exist (read-only query)
SELECT 
    customer_id,
    loyalty_program_id,
    COUNT(*) as duplicate_count
FROM rewards
WHERE is_redeemed = FALSE
GROUP BY customer_id, loyalty_program_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Delete duplicate rewards, keeping only the first (oldest) one
DELETE FROM rewards
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY customer_id, loyalty_program_id, is_redeemed
                ORDER BY earned_date ASC
            ) as rn
        FROM rewards
        WHERE is_redeemed = FALSE
    ) t
    WHERE rn > 1
);

-- Verify cleanup - should return no results if successful
SELECT 
    customer_id,
    loyalty_program_id,
    COUNT(*) as duplicate_count
FROM rewards
WHERE is_redeemed = FALSE
GROUP BY customer_id, loyalty_program_id
HAVING COUNT(*) > 1;

-- Success message
SELECT 'Duplicate rewards cleaned up successfully!' as message;

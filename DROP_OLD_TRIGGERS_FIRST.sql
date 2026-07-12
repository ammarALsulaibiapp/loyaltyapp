-- ============================================================
-- STEP 1: DROP OLD CONFLICTING TRIGGERS
-- ============================================================
-- Run this FIRST to remove old triggers that might be causing issues
-- ============================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS visits_update_totals ON visits;
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;
DROP TRIGGER IF EXISTS trigger_create_reward_on_visit ON visits;

-- Drop old functions
DROP FUNCTION IF EXISTS check_and_unlock_rewards(UUID, UUID);
DROP FUNCTION IF EXISTS initialize_customer_progress();
DROP FUNCTION IF EXISTS check_and_create_reward();

-- Check if old update_customer_totals exists and needs modification
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_customer_totals'
    ) THEN
        -- Drop and recreate without the reward check
        DROP FUNCTION IF EXISTS update_customer_totals();
        
        CREATE OR REPLACE FUNCTION update_customer_totals()
        RETURNS TRIGGER AS $func$
        BEGIN
            UPDATE customers
            SET 
                total_visits = total_visits + 1,
                total_points = total_points + NEW.points_earned,
                total_spent = total_spent + NEW.amount_spent,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
            
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        CREATE TRIGGER visits_update_totals
          AFTER INSERT ON visits
          FOR EACH ROW
          EXECUTE FUNCTION update_customer_totals();
          
        RAISE NOTICE 'Updated update_customer_totals to remove reward check';
    END IF;
END $$;

SELECT '✅ Old triggers removed! Now run FIX_STAMP_RESET_WITH_TABLE.sql' as status;

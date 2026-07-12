-- =====================================================
-- FIX DUPLICATE REWARDS ISSUE
-- Run this in Supabase SQL Editor
-- =====================================================

-- This fixes two issues:
-- 1. Prevents duplicate rewards for same customer/program
-- 2. Resets visits after reward earned (for stamp cards)

-- Drop the old function
DROP FUNCTION IF EXISTS check_and_unlock_rewards(UUID, UUID);

-- Create improved function with duplicate prevention
CREATE OR REPLACE FUNCTION check_and_unlock_rewards(p_customer_id UUID, p_loyalty_program_id UUID)
RETURNS VOID AS $$
DECLARE
    v_program loyalty_programs%ROWTYPE;
    v_customer customers%ROWTYPE;
    v_visit_count INTEGER;
    v_points DECIMAL;
    v_should_unlock BOOLEAN := FALSE;
    v_existing_reward_count INTEGER;
BEGIN
    -- Get loyalty program details
    SELECT * INTO v_program FROM loyalty_programs WHERE id = p_loyalty_program_id;
    
    -- Get customer details
    SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;
    
    -- Check if customer already has an unredeemed reward for this program
    SELECT COUNT(*) INTO v_existing_reward_count
    FROM rewards
    WHERE customer_id = p_customer_id
        AND loyalty_program_id = p_loyalty_program_id
        AND is_redeemed = FALSE;
    
    -- If reward already exists and is unredeemed, don't create duplicate
    IF v_existing_reward_count > 0 THEN
        RETURN;
    END IF;
    
    -- Check if reward should be unlocked based on program type
    CASE v_program.type
        WHEN 'visit_based' THEN
            SELECT COUNT(*) INTO v_visit_count
            FROM visits
            WHERE customer_id = p_customer_id
                AND loyalty_program_id = p_loyalty_program_id;
            
            IF v_visit_count >= v_program.required_visits THEN
                v_should_unlock := TRUE;
            END IF;
            
        WHEN 'points_based' THEN
            IF v_customer.total_points >= v_program.points_for_reward THEN
                v_should_unlock := TRUE;
            END IF;
            
        WHEN 'stamp_card' THEN
            -- For stamp cards, count visits (each visit = 1 stamp)
            SELECT COUNT(*) INTO v_visit_count
            FROM visits
            WHERE customer_id = p_customer_id
                AND loyalty_program_id = p_loyalty_program_id;
            
            IF v_visit_count >= v_program.required_stamps THEN
                v_should_unlock := TRUE;
            END IF;
    END CASE;
    
    -- Create reward if conditions are met
    IF v_should_unlock THEN
        -- Create the reward
        INSERT INTO rewards (
            business_id,
            customer_id,
            loyalty_program_id,
            reward_name,
            reward_description,
            reward_value
        ) VALUES (
            v_program.business_id,
            p_customer_id,
            p_loyalty_program_id,
            v_program.reward_name,
            v_program.reward_description,
            v_program.reward_value
        );
        
        -- Reset progress for repeatable rewards (delete visits to start fresh)
        IF v_program.type = 'visit_based' OR v_program.type = 'stamp_card' THEN
            DELETE FROM visits
            WHERE customer_id = p_customer_id
                AND loyalty_program_id = p_loyalty_program_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the function (optional - uncomment to test)
-- SELECT check_and_unlock_rewards('customer-uuid-here', 'program-uuid-here');

COMMENT ON FUNCTION check_and_unlock_rewards IS 
'Automatically creates rewards when customer completes loyalty program requirements. 
Prevents duplicate unredeemed rewards and resets visit counter for repeatable programs.';

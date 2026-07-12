-- =====================================================
-- AUTO RESET COUNTER AFTER REWARD REDEMPTION
-- =====================================================

-- Step 1: Create function to reset counter when reward is redeemed
CREATE OR REPLACE FUNCTION reset_program_progress_on_redemption()
RETURNS TRIGGER AS $$
DECLARE
    v_reward rewards%ROWTYPE;
BEGIN
    -- Get the reward details
    SELECT * INTO v_reward FROM rewards WHERE id = NEW.reward_id;
    
    -- Reset the visit counter for this customer-program combination
    UPDATE customer_program_progress
    SET visit_count = 0,
        last_reset_date = NOW(),
        updated_at = NOW()
    WHERE customer_id = v_reward.customer_id
        AND loyalty_program_id = v_reward.loyalty_program_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger that fires AFTER reward redemption
DROP TRIGGER IF EXISTS reset_counter_after_redemption ON reward_redemptions;
CREATE TRIGGER reset_counter_after_redemption
AFTER INSERT ON reward_redemptions
FOR EACH ROW EXECUTE FUNCTION reset_program_progress_on_redemption();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, the flow will be:
-- 1. Customer earns 8 visits -> Reward created, counter stays at 8
-- 2. Staff redeems reward -> Counter resets to 0
-- 3. Customer can start fresh stamp collection

-- ============================================================
-- FIX: STAMP RESET AFTER REWARD IS EARNED
-- ============================================================
-- This fixes the issue where stamps don't reset after earning a reward
-- Now customers can earn unlimited rewards!
--
-- CORRECT FLOW:
-- 1. Customer does 8 visits → Stamps show 8/8
-- 2. System creates reward → Stamps RESET to 0/8
-- 3. Counter shows: 🏆 1 Reward Available
-- 4. Customer continues → 3 visits → Shows 3/8
-- 5. Customer completes 8 more → Stamps RESET → Counter: 🏆 2
-- 6. Staff redeems 1 → Counter: 🏆 1
-- 7. Customer keeps earning from current stamp progress
-- ============================================================

-- Step 1: Initialize progress tracking trigger (runs BEFORE visit insert)
CREATE OR REPLACE FUNCTION initialize_customer_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure progress record exists
  INSERT INTO customer_program_progress (
    customer_id,
    loyalty_program_id,
    visit_count,
    total_rewards_earned,
    last_visit_date
  ) VALUES (
    NEW.customer_id,
    NEW.loyalty_program_id,
    0,
    0,
    NOW()
  )
  ON CONFLICT (customer_id, loyalty_program_id)
  DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;
CREATE TRIGGER trigger_initialize_progress
  BEFORE INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION initialize_customer_progress();

-- Step 2: Check and create reward with STAMP RESET (runs AFTER visit insert)
CREATE OR REPLACE FUNCTION check_and_create_reward()
RETURNS TRIGGER AS $$
DECLARE
  program_record RECORD;
  current_progress RECORD;
  visit_count INT;
  total_rewards INT;
BEGIN
  -- Get the loyalty program details
  SELECT * INTO program_record
  FROM loyalty_programs
  WHERE id = NEW.loyalty_program_id;

  -- If no program linked, exit
  IF program_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current progress
  SELECT visit_count, total_rewards_earned INTO current_progress
  FROM customer_program_progress
  WHERE customer_id = NEW.customer_id
    AND loyalty_program_id = NEW.loyalty_program_id;

  -- Calculate new visit count
  IF current_progress IS NULL THEN
    visit_count := 1;
    total_rewards := 0;
  ELSE
    visit_count := current_progress.visit_count + 1;
    total_rewards := current_progress.total_rewards_earned;
  END IF;

  -- Check if customer completed required visits
  IF visit_count >= program_record.visits_required THEN
    
    -- Create the reward
    INSERT INTO rewards (
      business_id,
      customer_id,
      loyalty_program_id,
      reward_name,
      reward_description,
      earned_date,
      is_redeemed
    ) VALUES (
      NEW.business_id,
      NEW.customer_id,
      NEW.loyalty_program_id,
      program_record.reward_name || ' - Free',
      'Earned by completing ' || program_record.visits_required || ' visits',
      NOW(),
      FALSE
    );

    -- 🔥 RESET STAMPS TO 0 and increment total rewards
    UPDATE customer_program_progress
    SET 
      visit_count = 0,
      total_rewards_earned = total_rewards + 1,
      last_visit_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '✅ Reward created! Stamps RESET to 0 for customer % on program %', NEW.customer_id, NEW.loyalty_program_id;
  ELSE
    -- Just increment the visit count
    UPDATE customer_program_progress
    SET 
      visit_count = visit_count,
      last_visit_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '📊 Visit counted: %/% stamps', visit_count, program_record.visits_required;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_reward_on_visit ON visits;
CREATE TRIGGER trigger_create_reward_on_visit
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_reward();

-- ============================================================
-- DONE! Test the flow:
-- ============================================================
-- 1. Add 8 visits for a customer
-- 2. Check customer_program_progress.visit_count → Should be 0 (RESET!)
-- 3. Check rewards table → Should have 1 unredeemed reward
-- 4. Add 3 more visits
-- 5. Check visit_count → Should be 3
-- 6. Add 5 more visits (total 8 again)
-- 7. Check visit_count → Should be 0 (RESET AGAIN!)
-- 8. Check rewards table → Should have 2 unredeemed rewards
-- 9. Redeem 1 reward
-- 10. Counter shows 🏆 1 Reward Available
-- ============================================================

SELECT '✅ Stamp reset trigger installed successfully!' as status;

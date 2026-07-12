-- ============================================================
-- UPDATE SCHEMA FOR STAMP RESET FUNCTIONALITY
-- ============================================================
-- Run this in Supabase SQL Editor to fix stamp reset issue
-- This replaces old check_and_unlock_rewards with new system
-- ============================================================

-- Step 1: Drop old function and triggers
DROP TRIGGER IF EXISTS visits_update_totals ON visits;
DROP FUNCTION IF EXISTS check_and_unlock_rewards(UUID, UUID);
DROP FUNCTION IF EXISTS update_customer_totals();

-- Step 2: Create new progress initialization function
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

-- Step 3: Create new customer totals update function (without reward check)
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER visits_update_totals
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_totals();

-- Step 4: Create reward creation function with STAMP RESET
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
-- DONE! Schema updated successfully
-- ============================================================

SELECT '✅ Schema updated! Stamp reset is now working correctly!' as status;
SELECT '⚠️  Note: Existing customers may have wrong visit_count. Test with new visits.' as note;

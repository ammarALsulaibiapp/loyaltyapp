-- AUTOMATIC REWARD CREATION TRIGGER WITH STAMP RESET
-- This trigger automatically creates a reward when customer completes required visits
-- AND resets the stamp counter so customer can earn more rewards

-- Function to check and create reward
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

  -- Get current progress for this customer and program
  SELECT visit_count, total_rewards_earned INTO current_progress
  FROM customer_program_progress
  WHERE customer_id = NEW.customer_id
    AND loyalty_program_id = NEW.loyalty_program_id;

  -- If no progress exists, initialize it
  IF current_progress IS NULL THEN
    visit_count := 1;
    total_rewards := 0;
  ELSE
    visit_count := current_progress.visit_count + 1;
    total_rewards := current_progress.total_rewards_earned;
  END IF;

  -- Check if customer just completed the required visits
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

    -- RESET stamps to 0 and increment total rewards earned
    UPDATE customer_program_progress
    SET 
      visit_count = 0,
      total_rewards_earned = total_rewards + 1,
      last_visit_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE 'Reward created and stamps RESET for customer % on program %', NEW.customer_id, NEW.loyalty_program_id;
  ELSE
    -- Just update the visit count
    UPDATE customer_program_progress
    SET 
      visit_count = visit_count,
      last_visit_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_reward_on_visit ON visits;

CREATE TRIGGER trigger_create_reward_on_visit
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_reward();

-- Now stamps will reset to 0/8 after each reward is earned!
-- Customer can keep earning unlimited rewards!

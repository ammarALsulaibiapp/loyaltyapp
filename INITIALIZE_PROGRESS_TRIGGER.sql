-- INITIALIZE CUSTOMER PROGRAM PROGRESS
-- This ensures that customer_program_progress is created/updated when visits are added

CREATE OR REPLACE FUNCTION initialize_customer_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the progress record
  INSERT INTO customer_program_progress (
    customer_id,
    loyalty_program_id,
    visit_count,
    total_rewards_earned,
    last_visit_date
  ) VALUES (
    NEW.customer_id,
    NEW.loyalty_program_id,
    0, -- Will be updated by check_and_create_reward trigger
    0,
    NOW()
  )
  ON CONFLICT (customer_id, loyalty_program_id)
  DO NOTHING; -- Let check_and_create_reward handle the counting

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs BEFORE the reward trigger
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;

CREATE TRIGGER trigger_initialize_progress
  BEFORE INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION initialize_customer_progress();

-- This runs BEFORE check_and_create_reward, ensuring progress record exists

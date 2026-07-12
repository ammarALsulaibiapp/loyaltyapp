-- ============================================================
-- COMPLETE FIX: CREATE TABLE + STAMP RESET TRIGGERS
-- ============================================================
-- This creates the missing table and sets up stamp reset system
-- ============================================================

-- Step 1: Create the customer_program_progress table
CREATE TABLE IF NOT EXISTS customer_program_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    visit_count INTEGER DEFAULT 0,
    total_rewards_earned INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    last_reset_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one progress record per customer per program
    UNIQUE(customer_id, loyalty_program_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_progress_customer_program 
ON customer_program_progress(customer_id, loyalty_program_id);

-- Step 2: Initialize progress tracking trigger (runs BEFORE visit insert)
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

-- Step 3: Check and create reward with STAMP RESET (runs AFTER visit insert)
CREATE OR REPLACE FUNCTION check_and_create_reward()
RETURNS TRIGGER AS $$
DECLARE
  program_record RECORD;
  current_progress RECORD;
  visit_count INT;
  total_rewards INT;
BEGIN
  -- Only process if loyalty_program_id is provided
  IF NEW.loyalty_program_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the loyalty program details
  SELECT * INTO program_record
  FROM loyalty_programs
  WHERE id = NEW.loyalty_program_id;

  -- If no program found, exit
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
    visit_count := COALESCE(current_progress.visit_count, 0) + 1;
    total_rewards := COALESCE(current_progress.total_rewards_earned, 0);
  END IF;

  -- Check if customer completed required visits (handle both field names)
  IF visit_count >= COALESCE(program_record.required_stamps, program_record.visits_required, 8) THEN
    
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
      'Earned by completing ' || COALESCE(program_record.required_stamps, program_record.visits_required, 8) || ' visits',
      NOW(),
      FALSE
    );

    -- RESET STAMPS TO 0 and increment total rewards
    UPDATE customer_program_progress
    SET 
      visit_count = 0,
      total_rewards_earned = total_rewards + 1,
      last_visit_date = NOW(),
      last_reset_date = NOW(),
      updated_at = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '✅ Reward created! Stamps RESET to 0 for customer % on program %', NEW.customer_id, NEW.loyalty_program_id;
  ELSE
    -- Just increment the visit count
    UPDATE customer_program_progress
    SET 
      visit_count = visit_count,
      last_visit_date = NOW(),
      updated_at = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '📊 Visit counted: %/% stamps', visit_count, COALESCE(program_record.required_stamps, program_record.visits_required, 8);
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
-- DONE! Now test:
-- ============================================================
-- 1. Add 8 visits for a customer
-- 2. Check: stamps should reset to 0/8
-- 3. Check: rewards counter should show 🏆 1
-- ============================================================

SELECT '✅ Table created and triggers installed successfully!' as status;

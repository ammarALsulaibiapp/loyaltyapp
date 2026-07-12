-- ============================================================
-- FIX STAMP TRACKING - Run this on Supabase SQL Editor
-- ============================================================

-- First ensure the customer_program_progress table exists
CREATE TABLE IF NOT EXISTS customer_program_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    visit_count INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_rewards_earned INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    last_reset_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, loyalty_program_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_progress_customer_program 
ON customer_program_progress(customer_id, loyalty_program_id);

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;
DROP TRIGGER IF EXISTS trigger_check_and_create_reward ON visits;

-- Trigger 1: Initialize progress (BEFORE INSERT)
CREATE OR REPLACE FUNCTION initialize_customer_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loyalty_program_id IS NULL THEN
    RETURN NEW;
  END IF;

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

CREATE TRIGGER trigger_initialize_progress
  BEFORE INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION initialize_customer_progress();

-- Trigger 2: Check and create reward with STAMP RESET (AFTER INSERT)  
CREATE OR REPLACE FUNCTION check_and_create_reward()
RETURNS TRIGGER AS $$
DECLARE
  program_record RECORD;
  current_visit_count INT;
  current_total_rewards INT;
  required_count INT;
BEGIN
  -- Skip if no program
  IF NEW.loyalty_program_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get program details
  SELECT * INTO program_record
  FROM loyalty_programs
  WHERE id = NEW.loyalty_program_id;

  IF program_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current progress
  SELECT 
    COALESCE(visit_count, 0),
    COALESCE(total_rewards_earned, 0)
  INTO 
    current_visit_count,
    current_total_rewards
  FROM customer_program_progress
  WHERE customer_id = NEW.customer_id
    AND loyalty_program_id = NEW.loyalty_program_id;

  -- Increment visit count
  current_visit_count := current_visit_count + 1;
  
  -- Get required stamps (try required_stamps first, then visits_required, default to 8)
  required_count := COALESCE(program_record.required_stamps, program_record.visits_required, 8);

  -- Check if customer completed required visits
  IF current_visit_count >= required_count THEN
    
    -- Create reward
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
      'Earned by completing ' || required_count || ' visits',
      NOW(),
      FALSE
    );

    -- 🔥 RESET STAMPS TO 0
    UPDATE customer_program_progress
    SET 
      visit_count = 0,
      total_rewards_earned = current_total_rewards + 1,
      last_visit_date = NOW(),
      last_reset_date = NOW(),
      updated_at = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '✅ REWARD CREATED! Stamps RESET to 0';
  ELSE
    -- Just update visit count  
    UPDATE customer_program_progress
    SET 
      visit_count = current_visit_count,
      last_visit_date = NOW(),
      updated_at = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '📊 Visit counted: %/% stamps', current_visit_count, required_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_and_create_reward
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_reward();

-- Initialize progress records for existing customers
INSERT INTO customer_program_progress (
    customer_id,
    loyalty_program_id,
    visit_count,
    total_rewards_earned,
    last_visit_date
)
SELECT DISTINCT
    c.id,
    lp.id,
    0,
    0,
    NOW()
FROM customers c
CROSS JOIN loyalty_programs lp
WHERE c.business_id = lp.business_id
  AND lp.is_active = true
ON CONFLICT (customer_id, loyalty_program_id) DO NOTHING;
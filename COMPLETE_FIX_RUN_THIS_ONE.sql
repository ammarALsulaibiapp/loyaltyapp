-- ============================================================
-- COMPLETE FIX - RUN THIS ONE FILE ONLY
-- ============================================================
-- This does EVERYTHING:
-- 1. Drops old broken triggers
-- 2. Creates customer_program_progress table
-- 3. Resets ALL existing customer stamps to 0
-- 4. Creates new working triggers
-- ============================================================

-- ============================================================
-- PART 1: CLEAN UP OLD STUFF
-- ============================================================

-- Drop ALL old triggers
DROP TRIGGER IF EXISTS visits_update_totals ON visits;
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;
DROP TRIGGER IF EXISTS trigger_create_reward_on_visit ON visits;

-- Drop ALL old functions
DROP FUNCTION IF EXISTS check_and_unlock_rewards(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS initialize_customer_progress() CASCADE;
DROP FUNCTION IF EXISTS check_and_create_reward() CASCADE;

-- Recreate update_customer_totals WITHOUT reward check
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET 
        total_visits = total_visits + 1,
        total_points = total_points + COALESCE(NEW.points_earned, 0),
        total_spent = total_spent + COALESCE(NEW.amount_spent, 0),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER visits_update_totals
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_totals();

-- ============================================================
-- PART 2: CREATE PROGRESS TABLE
-- ============================================================

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
    
    UNIQUE(customer_id, loyalty_program_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_customer_program 
ON customer_program_progress(customer_id, loyalty_program_id);

-- ============================================================
-- PART 3: RESET ALL EXISTING CUSTOMERS TO 0 STAMPS
-- ============================================================

-- Delete all existing progress (start fresh)
DELETE FROM customer_program_progress;

-- Create progress records for all customers, starting at 0 stamps
INSERT INTO customer_program_progress (
    customer_id,
    loyalty_program_id,
    visit_count,
    total_rewards_earned,
    last_visit_date
)
SELECT DISTINCT
    v.customer_id,
    v.loyalty_program_id,
    0 as visit_count,  -- START AT 0 - FRESH START
    COALESCE((
        SELECT COUNT(*)
        FROM rewards r
        WHERE r.customer_id = v.customer_id
          AND r.loyalty_program_id = v.loyalty_program_id
    ), 0) as total_rewards_earned,
    MAX(v.visit_date) as last_visit_date
FROM visits v
WHERE v.loyalty_program_id IS NOT NULL
GROUP BY v.customer_id, v.loyalty_program_id
ON CONFLICT (customer_id, loyalty_program_id) DO NOTHING;

-- ============================================================
-- PART 4: CREATE NEW TRIGGERS WITH STAMP RESET
-- ============================================================

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

    RAISE NOTICE '✅ REWARD CREATED! Stamps RESET to 0/%', required_count;
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

CREATE TRIGGER trigger_create_reward_on_visit
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_reward();

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT '✅ COMPLETE! All triggers installed and existing customers reset to 0 stamps.' as status;

-- Show current state
SELECT 
    c.full_name,
    lp.name as program,
    cpp.visit_count as stamps,
    COALESCE(lp.required_stamps, lp.visits_required, 8) as required,
    cpp.total_rewards_earned,
    (SELECT COUNT(*) FROM rewards r 
     WHERE r.customer_id = c.id 
       AND r.loyalty_program_id = cpp.loyalty_program_id 
       AND r.is_redeemed = false) as available_rewards
FROM customer_program_progress cpp
JOIN customers c ON c.id = cpp.customer_id
JOIN loyalty_programs lp ON lp.id = cpp.loyalty_program_id
ORDER BY c.full_name;

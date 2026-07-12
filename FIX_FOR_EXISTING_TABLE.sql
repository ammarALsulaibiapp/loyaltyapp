-- ============================================================
-- FIX FOR EXISTING TABLE - WORKS WITH CURRENT STRUCTURE
-- ============================================================
-- This works with the existing customer_program_progress table
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
-- PART 2: ADD MISSING COLUMNS IF NEEDED
-- ============================================================

DO $$
BEGIN
    -- Add last_visit_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_program_progress' 
        AND column_name = 'last_visit_date'
    ) THEN
        ALTER TABLE customer_program_progress 
        ADD COLUMN last_visit_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add last_reset_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_program_progress' 
        AND column_name = 'last_reset_date'
    ) THEN
        ALTER TABLE customer_program_progress 
        ADD COLUMN last_reset_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================
-- PART 3: RESET ALL EXISTING CUSTOMERS TO 0 STAMPS
-- ============================================================

-- Reset all existing progress to 0
UPDATE customer_program_progress SET visit_count = 0;

-- Or if you want to delete and recreate:
-- DELETE FROM customer_program_progress;
-- 
-- INSERT INTO customer_program_progress (
--     customer_id,
--     loyalty_program_id,
--     visit_count,
--     total_rewards_earned
-- )
-- SELECT DISTINCT
--     v.customer_id,
--     v.loyalty_program_id,
--     0,
--     COALESCE((
--         SELECT COUNT(*)
--         FROM rewards r
--         WHERE r.customer_id = v.customer_id
--           AND r.loyalty_program_id = v.loyalty_program_id
--     ), 0)
-- FROM visits v
-- WHERE v.loyalty_program_id IS NOT NULL
-- GROUP BY v.customer_id, v.loyalty_program_id;

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
    total_rewards_earned
  ) VALUES (
    NEW.customer_id,
    NEW.loyalty_program_id,
    0,
    0
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
  
  -- Get required stamps
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
      last_reset_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE '✅ REWARD CREATED! Stamps RESET to 0/%', required_count;
  ELSE
    -- Just update visit count
    UPDATE customer_program_progress
    SET 
      visit_count = current_visit_count,
      last_visit_date = NOW()
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

SELECT '✅ COMPLETE! All triggers installed.' as status;

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
ORDER BY c.full_name
LIMIT 10;

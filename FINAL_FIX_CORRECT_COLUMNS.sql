-- ============================================================
-- FINAL FIX - USING ACTUAL COLUMN NAMES FROM SCHEMA
-- ============================================================

-- ============================================================
-- PART 1: CLEAN UP OLD STUFF
-- ============================================================

DROP TRIGGER IF EXISTS visits_update_totals ON visits;
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits;
DROP TRIGGER IF EXISTS trigger_create_reward_on_visit ON visits;

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
-- PART 2: ADD MISSING COLUMNS TO PROGRESS TABLE
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_program_progress' 
        AND column_name = 'last_visit_date'
    ) THEN
        ALTER TABLE customer_program_progress 
        ADD COLUMN last_visit_date TIMESTAMP WITH TIME ZONE;
    END IF;

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
-- PART 3: RESET ALL STAMPS TO 0
-- ============================================================

UPDATE customer_program_progress SET visit_count = 0;

-- ============================================================
-- PART 4: CREATE TRIGGERS
-- ============================================================

-- Initialize progress (BEFORE INSERT)
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

-- Check and create reward with STAMP RESET (AFTER INSERT)
CREATE OR REPLACE FUNCTION check_and_create_reward()
RETURNS TRIGGER AS $$
DECLARE
  program_record RECORD;
  current_visit_count INT;
  current_total_rewards INT;
  required_count INT;
BEGIN
  IF NEW.loyalty_program_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO program_record
  FROM loyalty_programs
  WHERE id = NEW.loyalty_program_id;

  IF program_record IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT 
    COALESCE(visit_count, 0),
    COALESCE(total_rewards_earned, 0)
  INTO 
    current_visit_count,
    current_total_rewards
  FROM customer_program_progress
  WHERE customer_id = NEW.customer_id
    AND loyalty_program_id = NEW.loyalty_program_id;

  current_visit_count := current_visit_count + 1;
  
  -- Get required count based on program type
  IF program_record.type = 'stamp_card' THEN
    required_count := COALESCE(program_record.required_stamps, 8);
  ELSE
    required_count := COALESCE(program_record.required_visits, 8);
  END IF;

  IF current_visit_count >= required_count THEN
    
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

    UPDATE customer_program_progress
    SET 
      visit_count = 0,
      total_rewards_earned = current_total_rewards + 1,
      last_visit_date = NOW(),
      last_reset_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE 'REWARD CREATED! Stamps RESET to 0';
  ELSE
    UPDATE customer_program_progress
    SET 
      visit_count = current_visit_count,
      last_visit_date = NOW()
    WHERE customer_id = NEW.customer_id
      AND loyalty_program_id = NEW.loyalty_program_id;

    RAISE NOTICE 'Visit counted: %/%', current_visit_count, required_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reward_on_visit
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_reward();

-- ============================================================
-- DONE
-- ============================================================

SELECT 'COMPLETE! Triggers installed and stamps reset to 0.' as status;

-- Show results (no visits_required column)
SELECT 
    c.full_name,
    lp.name as program,
    lp.type,
    cpp.visit_count as stamps,
    CASE 
        WHEN lp.type = 'stamp_card' THEN COALESCE(lp.required_stamps, 8)
        ELSE COALESCE(lp.required_visits, 8)
    END as required,
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

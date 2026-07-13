-- Remove all triggers from visits table to prevent duplicates
DROP TRIGGER IF EXISTS trigger_update_customer_totals ON visits CASCADE;
DROP TRIGGER IF EXISTS trigger_initialize_progress ON visits CASCADE;
DROP TRIGGER IF EXISTS trigger_check_and_create_reward ON visits CASCADE;
DROP TRIGGER IF EXISTS trigger_create_reward_on_visit ON visits CASCADE;
DROP TRIGGER IF EXISTS update_customer_on_visit ON visits CASCADE;

-- Keep ONLY the customer totals trigger
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

CREATE TRIGGER trigger_update_customer_totals
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_totals();
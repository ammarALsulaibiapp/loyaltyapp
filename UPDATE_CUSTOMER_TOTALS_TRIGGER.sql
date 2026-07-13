-- Trigger to update customer total_visits, total_points, total_spent when visit is added
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer totals when visit is inserted
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

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_customer_totals ON visits;

-- Create trigger
CREATE TRIGGER trigger_update_customer_totals
  AFTER INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_totals();
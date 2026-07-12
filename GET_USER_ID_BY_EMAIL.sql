-- Create a function to get user ID by email from auth.users
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  RETURN user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO service_role;

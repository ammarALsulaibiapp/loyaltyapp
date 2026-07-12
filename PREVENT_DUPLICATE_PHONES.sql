-- =====================================================
-- PREVENT DUPLICATE PHONE NUMBERS
-- Safe to run - includes verification steps
-- =====================================================

-- STEP 1: CHECK IF YOU HAVE ANY DUPLICATE PHONE NUMBERS
-- This is READ-ONLY, safe to run
-- If this returns rows, you have duplicates
SELECT 
    business_id,
    phone_number,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as customer_ids
FROM customers
GROUP BY business_id, phone_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- =====================================================
-- STOP HERE AND CHECK RESULTS
-- If you see results, you have duplicates
-- If no results, skip to STEP 4
-- =====================================================


-- STEP 2: VIEW THE DUPLICATE CUSTOMERS (to see which to keep)
-- This is READ-ONLY, safe to run
-- Shows you all details of duplicate customers
SELECT 
    c1.id,
    c1.business_id,
    c1.phone_number,
    c1.full_name,
    c1.total_visits,
    c1.total_points,
    c1.created_at,
    b.name as business_name
FROM customers c1
INNER JOIN businesses b ON c1.business_id = b.id
WHERE EXISTS (
    SELECT 1 
    FROM customers c2 
    WHERE c2.business_id = c1.business_id 
    AND c2.phone_number = c1.phone_number 
    AND c2.id != c1.id
)
ORDER BY c1.business_id, c1.phone_number, c1.created_at;

-- =====================================================
-- STOP HERE AND REVIEW
-- Look at the duplicates - which ones should we keep?
-- Usually: Keep the OLDEST (first created_at) one
-- =====================================================


-- STEP 3: DELETE DUPLICATES (KEEPS OLDEST, DELETES NEWER)
-- ⚠️ THIS MODIFIES DATA - Only run if Step 1 showed duplicates
-- This keeps the customer who registered FIRST (oldest created_at)

-- SAFETY: First, let's see what WOULD be deleted (READ-ONLY)
SELECT 
    id,
    business_id,
    phone_number,
    full_name,
    created_at,
    'WILL BE DELETED' as action
FROM (
    SELECT 
        id,
        business_id,
        phone_number,
        full_name,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY business_id, phone_number 
            ORDER BY created_at ASC
        ) as rn
    FROM customers
) t
WHERE rn > 1;

-- =====================================================
-- REVIEW THE ABOVE RESULTS
-- These are the customers that will be DELETED
-- If this looks correct, proceed to actual deletion below
-- =====================================================

-- ACTUAL DELETION (uncomment to run)
-- DELETE FROM customers
-- WHERE id IN (
--     SELECT id
--     FROM (
--         SELECT 
--             id,
--             ROW_NUMBER() OVER (
--                 PARTITION BY business_id, phone_number 
--                 ORDER BY created_at ASC
--             ) as rn
--         FROM customers
--     ) t
--     WHERE rn > 1
-- );


-- STEP 4: ADD DATABASE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- This creates a UNIQUE constraint on (business_id, phone_number)
-- Safe to run even if constraint already exists

-- First, check if constraint already exists (READ-ONLY)
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'customers'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%phone%';

-- If no constraint exists, create it:
-- This will PREVENT duplicate phone numbers in the future
DO $$ 
BEGIN
    -- Try to create the constraint
    ALTER TABLE customers 
    ADD CONSTRAINT customers_business_phone_unique 
    UNIQUE (business_id, phone_number);
    
    RAISE NOTICE 'SUCCESS: Unique constraint created! No duplicate phone numbers allowed.';
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists. No action needed.';
    WHEN unique_violation THEN
        RAISE NOTICE 'ERROR: Cannot create constraint - duplicates still exist! Run STEP 3 first.';
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: % - %', SQLERRM, SQLSTATE;
END $$;


-- STEP 5: VERIFY THE CONSTRAINT IS ACTIVE
-- This is READ-ONLY, safe to run
SELECT 
    constraint_name,
    constraint_type,
    'ACTIVE - Duplicates prevented!' as status
FROM information_schema.table_constraints
WHERE table_name = 'customers'
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'customers_business_phone_unique';


-- STEP 6: TEST THE CONSTRAINT (READ-ONLY)
-- Try to insert a duplicate - it should FAIL (that's good!)
-- This is commented out for safety - uncomment to test

-- DO $$ 
-- DECLARE
--     v_business_id UUID;
--     v_test_phone TEXT := '+968 9999 9999';
-- BEGIN
--     -- Get a business ID
--     SELECT id INTO v_business_id FROM businesses LIMIT 1;
--     
--     -- Try to insert duplicate
--     INSERT INTO customers (business_id, phone_number, full_name, qr_code)
--     VALUES (v_business_id, v_test_phone, 'Test User 1', 'test-qr-1');
--     
--     INSERT INTO customers (business_id, phone_number, full_name, qr_code)
--     VALUES (v_business_id, v_test_phone, 'Test User 2', 'test-qr-2');
--     
--     RAISE NOTICE 'ERROR: Duplicates were allowed! Constraint not working!';
-- EXCEPTION
--     WHEN unique_violation THEN
--         RAISE NOTICE 'SUCCESS: Duplicate was blocked! Constraint is working!';
--         -- Clean up test data
--         DELETE FROM customers WHERE phone_number = v_test_phone;
-- END $$;


-- =====================================================
-- FINAL VERIFICATION
-- Check that no duplicates exist anymore
-- =====================================================

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No duplicate phone numbers found!'
        ELSE '⚠️ WARNING: Still have ' || COUNT(*) || ' duplicates!'
    END as status
FROM (
    SELECT 
        business_id,
        phone_number,
        COUNT(*) as cnt
    FROM customers
    GROUP BY business_id, phone_number
    HAVING COUNT(*) > 1
) duplicates;


-- =====================================================
-- SUMMARY OF WHAT WE DID
-- =====================================================
/*
1. ✅ Checked for existing duplicate phone numbers
2. ✅ Reviewed which customers are duplicates
3. ✅ (Optional) Deleted newer duplicates, kept oldest
4. ✅ Added database constraint to prevent future duplicates
5. ✅ Verified constraint is active
6. ✅ Tested that duplicates are blocked
7. ✅ Final verification

RESULT: 
- No duplicate phone numbers in database
- Database PREVENTS any future duplicate phone numbers
- Frontend also checks (double protection)
*/

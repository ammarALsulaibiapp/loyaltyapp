# 🔒 SAFE SQL EXECUTION GUIDE - Step by Step

## ⚠️ IMPORTANT: Follow in Order, Don't Skip Steps!

---

## 📋 What We're Doing

**Goal:** Prevent duplicate phone numbers in your database  
**Risk Level:** LOW (we check before we change)  
**Time Required:** 5 minutes  
**Reversible:** Yes (we can undo if needed)

---

## 🎯 STEP-BY-STEP INSTRUCTIONS

### STEP 1: Check for Existing Duplicates (SAFE - READ ONLY)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Click on your project
   - Click **SQL Editor** in the left sidebar

2. **Copy and paste this query:**

```sql
SELECT 
    business_id,
    phone_number,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as customer_ids
FROM customers
GROUP BY business_id, phone_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

3. **Click RUN**

4. **Check the result:**

   **IF YOU SEE RESULTS:**
   ```
   business_id | phone_number | duplicate_count | customer_ids
   ------------|--------------|-----------------|-------------
   abc-123     | +968 1234    | 2               | id1, id2
   ```
   ➡️ **You have duplicates** - Continue to STEP 2

   **IF YOU SEE: "No rows returned"**
   ```
   Success. No rows returned
   ```
   ➡️ **No duplicates!** - Skip to STEP 4 (Add Protection)

---

### STEP 2: View Duplicate Details (SAFE - READ ONLY)

**Only do this if STEP 1 found duplicates**

1. **Copy and paste this query:**

```sql
SELECT 
    c.id,
    c.phone_number,
    c.full_name,
    c.total_visits,
    c.total_points,
    c.created_at,
    b.name as business_name,
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY c.business_id, c.phone_number ORDER BY c.created_at ASC) = 1 
        THEN '✅ KEEP (oldest)'
        ELSE '❌ DELETE (newer)'
    END as action
FROM customers c
INNER JOIN businesses b ON c.business_id = b.id
WHERE EXISTS (
    SELECT 1 
    FROM customers c2 
    WHERE c2.business_id = c.business_id 
    AND c2.phone_number = c.phone_number 
    AND c2.id != c.id
)
ORDER BY c.business_id, c.phone_number, c.created_at;
```

2. **Click RUN**

3. **Review the results:**
   - Customers marked **"✅ KEEP"** will be preserved (oldest registration)
   - Customers marked **"❌ DELETE"** will be removed (newer duplicates)

4. **IMPORTANT: Check if this looks correct!**
   - Does the oldest one have the most visits/points?
   - If YES ➡️ Continue to STEP 3
   - If NO ➡️ **STOP and tell me** - we'll manually fix it

---

### STEP 3: Delete Duplicates (⚠️ MODIFIES DATA)

**Only do this if STEP 2 looked correct**

#### OPTION A: Safe Preview First (RECOMMENDED)

1. **Copy and paste this query to PREVIEW what will be deleted:**

```sql
SELECT 
    id,
    phone_number,
    full_name,
    created_at,
    'WILL BE DELETED' as action
FROM (
    SELECT 
        id,
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
```

2. **Click RUN**

3. **Review the list** - These customers will be deleted

4. **If it looks correct**, proceed to actual deletion below ⬇️

#### OPTION B: Actual Deletion

1. **Copy and paste this query:**

```sql
DELETE FROM customers
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY business_id, phone_number 
                ORDER BY created_at ASC
            ) as rn
        FROM customers
    ) t
    WHERE rn > 1
);
```

2. **Click RUN**

3. **Check the result:**
   ```
   DELETE 3
   ```
   This means 3 duplicate customers were removed ✅

---

### STEP 4: Add Database Protection (SAFE - PREVENTS FUTURE DUPLICATES)

**Everyone should do this step, even if you had no duplicates**

1. **Copy and paste this query:**

```sql
DO $$ 
BEGIN
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
```

2. **Click RUN**

3. **Check the message:**

   **SUCCESS MESSAGES:**
   ```
   SUCCESS: Unique constraint created!
   ```
   ✅ Perfect! Duplicates now blocked at database level

   OR

   ```
   Constraint already exists.
   ```
   ✅ Already protected, nothing to do!

   **ERROR MESSAGE:**
   ```
   ERROR: could not create unique index...
   ```
   ❌ You still have duplicates! Go back to STEP 1

---

### STEP 5: Verify It's Working (SAFE - READ ONLY)

1. **Copy and paste this query:**

```sql
SELECT 
    constraint_name,
    'ACTIVE - Duplicates are now BLOCKED!' as status
FROM information_schema.table_constraints
WHERE table_name = 'customers'
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'customers_business_phone_unique';
```

2. **Click RUN**

3. **Check the result:**

   **IF YOU SEE:**
   ```
   constraint_name                    | status
   -----------------------------------|---------------------------
   customers_business_phone_unique    | ACTIVE - Duplicates blocked!
   ```
   ✅ **SUCCESS! Protection is active!**

   **IF YOU SEE: "No rows returned"**
   ❌ Constraint not created - go back to STEP 4

---

### STEP 6: Final Check (SAFE - READ ONLY)

1. **Copy and paste this query:**

```sql
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No duplicate phone numbers!'
        ELSE '⚠️ WARNING: Still have ' || COUNT(*) || ' duplicates!'
    END as final_status
FROM (
    SELECT business_id, phone_number, COUNT(*) as cnt
    FROM customers
    GROUP BY business_id, phone_number
    HAVING COUNT(*) > 1
) duplicates;
```

2. **Click RUN**

3. **Check the result:**

   ```
   ✅ SUCCESS: No duplicate phone numbers!
   ```
   ✅ **ALL DONE! You're protected!**

---

## 🎉 SUCCESS CHECKLIST

After completing all steps, you should have:

- [ ] ✅ No duplicate phone numbers in database
- [ ] ✅ Database constraint active (prevents future duplicates)
- [ ] ✅ Frontend validation active (already built-in)
- [ ] ✅ Double protection: Database + Frontend

---

## 🆘 TROUBLESHOOTING

### Problem: "ERROR: could not create unique index"

**Cause:** You still have duplicate phone numbers  
**Solution:** Go back to STEP 1 and follow the deletion process

---

### Problem: "I accidentally deleted the wrong customer!"

**Solution:** Contact me immediately - we can restore from a backup if needed

**Prevention:** Always run the PREVIEW queries before actual deletion

---

### Problem: "Constraint already exists message"

**This is GOOD!** It means protection is already active. You're done! ✅

---

## 📊 WHAT HAPPENS NOW?

### Frontend Protection (Already Active)
```typescript
// In PublicSignup.tsx
if (existing) {
  throw new Error('Phone number already registered')
}
```

### Database Protection (After you run the SQL)
```sql
-- Database automatically blocks duplicates
INSERT INTO customers (phone_number...) -- BLOCKED if duplicate!
ERROR: duplicate key value violates unique constraint
```

### Result: DOUBLE PROTECTION ✅✅

---

## 🔐 SAFETY NOTES

1. **All "READ-ONLY" queries are 100% safe** - they never change data
2. **Preview before deleting** - always check what will be deleted
3. **Oldest customer is kept** - preserves visit history
4. **Constraint can be removed** if you change your mind later
5. **Frontend already prevents duplicates** - this is extra protection

---

## ✅ COMPLETION CONFIRMATION

After running all steps, run this final check:

```sql
-- Final verification
SELECT 
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(DISTINCT (business_id, phone_number)) FROM customers) as unique_phones,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_name = 'customers_business_phone_unique') as constraint_active,
    CASE 
        WHEN (SELECT COUNT(*) FROM customers) = 
             (SELECT COUNT(DISTINCT (business_id, phone_number)) FROM customers)
        THEN '✅ NO DUPLICATES'
        ELSE '⚠️ DUPLICATES EXIST'
    END as status;
```

**Expected result:**
```
total_customers | unique_phones | constraint_active | status
----------------|---------------|-------------------|------------------
50              | 50            | 1                 | ✅ NO DUPLICATES
```

---

## 📝 READY TO START?

**Start with STEP 1 above** ⬆️

Copy the first query, paste in Supabase SQL Editor, and click RUN.

**Questions?** Stop and ask me before proceeding! 🛑

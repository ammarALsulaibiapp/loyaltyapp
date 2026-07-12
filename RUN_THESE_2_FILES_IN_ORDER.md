# 🔥 FIX THE 400 ERROR + STAMP RESET

## The Problem:
- ❌ 400 error when adding visits
- ❌ Stamps not resetting
- ❌ Missing `customer_program_progress` table
- ❌ Old conflicting triggers

---

## ✅ THE SOLUTION - RUN 2 FILES IN ORDER:

### 1️⃣ FIRST: Run `DROP_OLD_TRIGGERS_FIRST.sql`

This removes old conflicting triggers that are causing the 400 error.

```sql
-- Copy and paste this in Supabase SQL Editor, then RUN:
```
*(See DROP_OLD_TRIGGERS_FIRST.sql file)*

**Wait for:** ✅ Success message

---

### 2️⃣ SECOND: Run `FIX_STAMP_RESET_WITH_TABLE.sql`

This creates the missing table and new triggers.

```sql
-- Copy and paste this in Supabase SQL Editor, then RUN:
```
*(See FIX_STAMP_RESET_WITH_TABLE.sql file)*

**Wait for:** ✅ Success message

---

## 🧪 TEST IT:

1. **Refresh your app** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Go to Staff → Customer Lookup**
3. **Pick a customer**
4. **Add 1 visit** → Should work! (no 400 error)
5. **Keep adding visits until 8 total**
6. **After 8th visit:**
   - ✅ Stamps reset to 0/8
   - ✅ Rewards counter shows 🏆 1

---

## 🎯 What Each File Does:

### File 1: DROP_OLD_TRIGGERS_FIRST.sql
- Removes `check_and_unlock_rewards` (old broken function)
- Removes conflicting triggers
- Fixes `update_customer_totals` to not call the broken function

### File 2: FIX_STAMP_RESET_WITH_TABLE.sql
- Creates `customer_program_progress` table
- Creates `initialize_customer_progress` trigger
- Creates `check_and_create_reward` trigger with stamp reset
- Handles both `required_stamps` and `visits_required` fields

---

## 🚨 If Still Getting 400 Error:

Check browser console for exact error message and share it with me!

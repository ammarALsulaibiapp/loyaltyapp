# 🎯 COMPLETE STAFF WORKFLOW GUIDE

## Overview
This guide explains **EXACTLY** how staff accounts work, where to create them, where staff login, and how they track customer purchases.

---

## 📋 THE COMPLETE FLOW

### **STEP 1: Create Staff Account** (Super Admin or Business Admin)

#### Where to Create Staff:
- **Super Admin**: Navigate to Business Admin > Sidebar > **Staff**
- **Business Admin**: Navigate to Sidebar > **Staff**

#### How to Create:
1. Click **"Add New Staff"** button (top right)
2. Fill in the form:
   - **Full Name**: Staff member's name
   - **Email**: This will be their login username
   - **Phone Number**: Optional
3. Click **"Add New"**
4. System creates account with default password (or sends invite email)

#### Current Status:
⚠️ **ISSUE FOUND**: Staff.tsx form is NOT functional yet!
- Form exists but `handleSubmit` only does `console.log()`
- Does NOT actually create staff user account
- **NEEDS FIXING** - see below for solution

---

### **STEP 2: Staff Login**

#### Where Staff Login:
- URL: `https://your-domain.com/login`
- Same login page as Business Admin and Super Admin
- Staff uses their **email + password**

#### What Happens After Login:
- System checks user role from `profiles` table
- If role = `staff` → Redirects to `/staff` (Staff Dashboard)
- Staff sees simplified sidebar with ONLY:
  - 📊 **Dashboard** - Today's activity summary
  - 🔍 **Customer Lookup** - Search and add visits

---

### **STEP 3: Track Customer Purchases** (Staff)

#### The Complete Process:

##### 1️⃣ Customer Arrives at Store
- Customer makes a purchase
- Staff asks: **"What is your phone number?"**

##### 2️⃣ Look Up Customer
1. Staff clicks **"Customer Lookup"** in sidebar
2. Enters customer's phone number: `+968 9123 4567`
3. Clicks **"Search"**

##### 3️⃣ Customer Found - View Profile
System displays:
- ✅ Customer name and phone
- ✅ Member since date
- ✅ Total visits count
- ✅ Total points balance
- ✅ Total amount spent
- ✅ Membership tier (Bronze/Silver/Gold/VIP)
- ✅ Available rewards (unlocked rewards ready to redeem)

##### 4️⃣ Add Visit (Record Purchase)
1. Click **"Add Visit"** button
2. Modal opens with form:
   - **Amount Spent**: Enter purchase amount (e.g., 5.50)
   - **Loyalty Program**: Select which program to apply (optional)
3. Click **"Add Visit"**

##### 5️⃣ What Happens Automatically:
✅ Customer's `total_visits` increases by 1
✅ Customer's `total_spent` increases by amount
✅ If loyalty program selected:
  - **Stamp Card**: Adds 1 stamp (e.g., 3/6 stamps)
  - **Visit Based**: Adds 1 visit to progress
  - **Points Based**: Adds points (1:1 ratio with amount spent)
✅ If threshold reached (e.g., 6th visit):
  - **Reward unlocked automatically**
  - Shows in "Available Rewards" section
  - Staff can redeem immediately

##### 6️⃣ Redeem Reward (When Available)
1. Staff sees reward in "Available Rewards" section
2. Clicks **"Redeem"** button next to reward
3. Reward marked as redeemed
4. Customer receives their free item/discount

---

## 🔧 WHAT NEEDS TO BE FIXED

### **Issue #1: Staff Creation Not Working**
**File**: `frontend/src/pages/business/Staff.tsx`

**Current Code** (line ~58):
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  console.log('Creating staff:', formData)
  setIsModalOpen(false)
}
```

**Problem**: Form doesn't actually create user account!

**Solution Needed**: Add mutation to:
1. Create auth user via Supabase Auth
2. Create profile with role='staff' and business_id
3. Send password/invite to staff member

---

## 📱 STAFF MOBILE USAGE

### Staff Can Use Phone/Tablet:
1. Open browser on their device
2. Go to: `https://your-domain.com/login`
3. Login with their email/password
4. Use "Customer Lookup" to search by phone
5. Add visits on-the-go

### Mobile-Friendly Features:
- ✅ Responsive design works on phones
- ✅ Large touch-friendly buttons
- ✅ Simple 2-page interface (Dashboard + Lookup)
- ✅ No complex features to confuse staff

---

## 🎯 BUSINESS SCENARIOS

### Scenario A: Coffee Shop
1. Customer buys coffee ($5)
2. Staff: "What's your phone number?"
3. Customer: "+968 9123 4567"
4. Staff enters number → Finds profile
5. Clicks "Add Visit" → Enters $5.00
6. Selects "6-Cup Coffee Card" program
7. System adds 1 stamp (now 4/6 stamps)
8. Customer sees updated card on their phone

### Scenario B: Reward Ready
1. Customer buys 6th coffee ($5)
2. Staff searches phone number
3. Clicks "Add Visit" → Enters $5.00
4. **Reward unlocks automatically** (Free Coffee)
5. Staff sees "Available Rewards" section
6. Staff says: "You earned a free coffee!"
7. Staff clicks "Redeem" immediately
8. Customer gets free coffee now

### Scenario C: No Loyalty Program
1. Customer buys item ($10)
2. Staff searches by phone
3. Clicks "Add Visit" → Enters $10.00
4. Leaves "Loyalty Program" as "Select program"
5. System still tracks:
   - Total visits +1
   - Total spent +$10
   - Points balance +10
6. No stamps/rewards involved

---

## 🔐 PERMISSIONS & ACCESS

### What Super Admin Can Do:
- ✅ Create businesses
- ✅ Create staff for ANY business
- ✅ View all customers across all businesses
- ✅ Create loyalty programs for clients
- ✅ Assign rewards
- ✅ Generate QR codes for client businesses

### What Business Admin Can Do:
- ✅ Create staff for their business only
- ✅ View their customers only
- ✅ Create loyalty programs (if self-service ON)
- ✅ View reports for their business

### What Staff Can Do:
- ✅ Search customers by phone (their business only)
- ✅ Add visits and record purchases
- ✅ Redeem available rewards
- ✅ View customer profile stats
- ❌ CANNOT create programs
- ❌ CANNOT view reports
- ❌ CANNOT access settings
- ❌ CANNOT create other staff

---

## 🗄️ DATABASE STRUCTURE

### Tables Involved:

#### `profiles` Table
```sql
- id (UUID)
- email (TEXT)
- full_name (TEXT)
- role (TEXT) -- 'super_admin' | 'business_admin' | 'staff'
- business_id (UUID) -- Which business this staff belongs to
- is_active (BOOLEAN)
```

#### `customers` Table
```sql
- id (UUID)
- business_id (UUID)
- phone_number (TEXT) -- Used for lookup
- full_name (TEXT)
- total_visits (INT)
- total_points (INT)
- total_spent (DECIMAL)
- membership_tier (TEXT)
```

#### `visits` Table
```sql
- id (UUID)
- business_id (UUID)
- customer_id (UUID)
- staff_id (UUID) -- Who recorded this visit
- loyalty_program_id (UUID) -- Which program (optional)
- amount_spent (DECIMAL)
- points_earned (INT)
- created_at (TIMESTAMP)
```

#### `rewards` Table
```sql
- id (UUID)
- customer_id (UUID)
- reward_name (TEXT)
- reward_description (TEXT)
- is_redeemed (BOOLEAN)
- earned_date (TIMESTAMP)
- redeemed_date (TIMESTAMP)
```

---

## ✅ SUMMARY: THE ANSWER TO YOUR QUESTION

### ❓ "How can business track customer purchase?"
**Answer**: Staff uses the **Customer Lookup** page to search by phone, then clicks **"Add Visit"** to record the purchase amount.

### ❓ "How staff assign 1 purchase?"
**Answer**: 
1. Search customer by phone
2. Click "Add Visit" button
3. Enter amount spent
4. Select loyalty program (optional)
5. System automatically adds stamps/points/visits

### ❓ "How to give staff the account?"
**Answer**: Super Admin or Business Admin goes to **Staff** page, clicks **"Add New Staff"**, enters email/name/phone, and system creates login account.

### ❓ "Where to login?"
**Answer**: Staff goes to `/login` URL (same login page), uses their email + password, and gets redirected to simplified Staff Dashboard.

---

## 🚨 CURRENT ISSUES TO FIX

1. ⚠️ **Staff creation form is not functional** - needs mutation to create auth user
2. ⚠️ **Staff password generation/invite system** - needs to be implemented
3. ⚠️ **Staff.tsx and CustomerLookup.tsx NOT translated to Arabic** - all text is hardcoded English
4. ⚠️ Staff cannot see QR Generator (but this might be intentional)

---

## 📸 NAVIGATION SCREENSHOTS

### Super Admin Sidebar:
```
📊 Dashboard
🏢 Businesses
👥 Customers
🎁 Loyalty Programs
🏆 Rewards
📱 QR Generator
📄 Invoices
⚙️ Settings
```

### Business Admin Sidebar:
```
📊 Dashboard
👥 Customers
🎁 Loyalty Programs
🏆 Rewards
👤 Staff  ← CREATE STAFF HERE
📊 Reports
⚙️ Settings
```

### Staff Sidebar (Simplified):
```
📊 Dashboard  ← Activity summary
🔍 Customer Lookup  ← SEARCH & ADD VISITS
```

---

## 🎯 NEXT STEPS

To make this fully functional:

1. **Fix Staff Creation** - Implement real user creation mutation
2. **Add Arabic Translations** - Translate Staff.tsx and CustomerLookup.tsx
3. **Test Complete Flow**:
   - Create staff account
   - Staff login
   - Search customer
   - Add visit
   - Verify stamps update
   - Verify rewards unlock
4. **Add Password Setup** - Email staff their login credentials


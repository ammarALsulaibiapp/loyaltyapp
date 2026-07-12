# 🧪 Complete System Testing Guide

## 🚀 Quick Start - 3 User Roles to Test

Your system has **DEMO MODE** already working! Test everything without database setup.

---

## 📋 STEP-BY-STEP TESTING

### 1️⃣ SUPER ADMIN (Platform Owner)

**Login:**
```
Email: admin@loyaltypass.com
Password: admin123
```

**What to Test:**
1. **Dashboard** - See all platform stats
   - Total businesses
   - Total customers
   - Revenue overview

2. **Businesses Management** (`/super-admin/businesses`)
   - ✅ Create new business
   - ✅ Edit business details
   - ✅ Activate/Deactivate business
   - ✅ View business stats

3. **Global Customers** (`/super-admin/customers`)
   - See all customers across all businesses

4. **Loyalty Programs** (`/super-admin/loyalty-programs`)
   - View all programs from all businesses
   - Create platform-wide programs

5. **Invoices** (`/super-admin/invoices`)
   - Generate invoices for businesses
   - Track payments

---

### 2️⃣ BUSINESS ADMIN (Coffee Shop Owner)

**Login:**
```
Email: business@coffeeparadise.com
Password: admin123
```

**Complete Business Flow:**

#### A. Setup Your Business
1. Go to **Settings** (`/business/settings`)
   - Update business name: "My Coffee Shop"
   - Set brand color
   - Upload logo

#### B. Create Loyalty Programs
2. Go to **Loyalty Programs** (`/business/loyalty-programs`)
   - Click "Create Program"
   
   **Example Programs:**
   
   **Program 1: Buy 5 Get 1 Free**
   - Name: "Coffee Stamp Card"
   - Type: Stamp Card
   - Required Stamps: 5
   - Reward: Free Coffee
   
   **Program 2: Points System**
   - Name: "Loyalty Points"
   - Type: Points Based
   - Points per $1: 10
   - Points for Reward: 100
   - Reward: $5 Off

#### C. Create Rewards
3. Go to **Rewards** (`/business/rewards`)
   - Click "Add Reward"
   
   **Example Rewards:**
   - Free Coffee (linked to Stamp Card)
   - $5 Discount (linked to Points)
   - Free Pastry
   - 20% Off Order

#### D. Add Staff
4. Go to **Staff** (`/business/staff`)
   - Add staff members
   - Give them login credentials

#### E. Add Customers
5. Go to **Customers** (`/business/customers`)
   - Click "Add Customer"
   - Phone: +966501234567
   - Name: Ahmed Ali
   - Birthday: 1990-01-15

#### F. Generate QR Codes
6. Go to **QR Generator** (`/business/qr-generator`)
   - Generate business QR code
   - Print and display at counter
   - Customers scan to join loyalty program

#### G. View Reports
7. Go to **Reports** (`/business/reports`)
   - See customer visits
   - Track rewards redeemed
   - View revenue stats

---

### 3️⃣ STAFF MEMBER (Cashier)

**Login:**
```
Email: staff@coffeeparadise.com
Password: admin123
```

**Daily Operations:**

#### A. Customer Arrives at Counter
1. Go to **Customer Lookup** (`/staff/customer-lookup`)

#### B. Search Customer
2. Enter phone number: `+966501234567`
3. Customer profile appears

#### C. Add Visit/Points
4. **Option 1: Stamp Card**
   - Click "Add Visit" on Stamp Card program
   - Customer gets 1 stamp
   - After 5 stamps → Free coffee unlocked!

5. **Option 2: Points**
   - Click "Add Points"
   - Enter amount spent: $15
   - Customer gets 150 points automatically
   - When reaches 100 points → $5 reward unlocked!

#### D. Redeem Reward
6. When reward is ready:
   - Click "Redeem" button
   - Confirm redemption
   - Reward marked as used
   - Stamps/points reset

---

## 🎯 COMPLETE CUSTOMER JOURNEY TEST

### Scenario: "Ahmed's First Visit to Coffee Shop"

#### Step 1: Customer Signs Up
1. Customer scans QR code at counter OR
2. Staff adds customer manually:
   - Phone: +966501234567
   - Name: Ahmed Ali

#### Step 2: First Purchase ($5)
1. Staff searches: `+966501234567`
2. Customer appears
3. Staff clicks "Add Visit" (Stamp Card) → **1/5 stamps**
4. Staff clicks "Add Points" → Amount: $5 → **50 points**

#### Step 3: Second Purchase ($10)
1. Staff searches customer
2. Add visit → **2/5 stamps**
3. Add points → Amount: $10 → **100 points total**
4. 🎉 **$5 Reward Unlocked!**

#### Step 4: Third Purchase ($5)
1. Add visit → **3/5 stamps**
2. Add points → Amount: $5 → **150 points**

#### Step 5: Fourth Purchase ($10)
1. Add visit → **4/5 stamps**
2. Customer has 200 points → Can redeem $5 reward twice!

#### Step 6: Fifth Purchase ($5)
1. Add visit → **5/5 stamps complete!**
2. 🎉 **Free Coffee Unlocked!**
3. Staff clicks "Redeem Free Coffee"
4. Stamps reset to 0/5
5. Customer starts earning again

---

## 📱 CUSTOMER VIEW (Public Pages)

### Customer Digital Card
Customer can view their loyalty status:

**URL:** `http://localhost:5173/card/{customer_id}`

**What Customer Sees:**
- ✅ Their name and QR code
- ✅ Points balance
- ✅ Stamp card progress (visual stamps)
- ✅ Available rewards
- ✅ Visit history
- ✅ "Add to Apple Wallet" button
- ✅ "Add to Google Wallet" button

**Test This:**
1. Go to Customers page
2. Click "View" on any customer
3. Click "Customer Card" button
4. You'll see the public customer card view

---

## 🧪 FULL TEST SCENARIOS

### Test 1: Complete Stamp Card Flow
```
1. Login as Business Admin
2. Create "Buy 5 Get 1 Free" program
3. Logout → Login as Staff
4. Add customer
5. Add 5 visits
6. Verify free coffee appears
7. Redeem reward
8. Verify stamps reset
```

### Test 2: Points System Flow
```
1. Login as Business Admin
2. Create "10 points per $1" program
3. Set reward at 100 points
4. Login as Staff
5. Add customer purchase: $10 → 100 points
6. Reward appears automatically
7. Redeem reward
8. Points deducted
```

### Test 3: Multiple Programs
```
1. Customer enrolled in BOTH programs
2. Each purchase adds:
   - 1 stamp to stamp card
   - Points to points balance
3. Can earn rewards from both simultaneously
```

### Test 4: Super Admin Control
```
1. Login as Super Admin
2. View all businesses
3. Suspend a business
4. View all customers across platform
5. Generate invoices
6. View platform analytics
```

---

## 🔍 What to Check in Each Page

### Business Dashboard
- [ ] Stats cards show correct numbers
- [ ] Charts display data
- [ ] Recent activity appears
- [ ] Quick actions work

### Customers Page
- [ ] Grid/Table view toggle works
- [ ] Search filters customers
- [ ] Add customer modal opens
- [ ] Customer cards display correctly
- [ ] QR codes generate

### Loyalty Programs Page
- [ ] All program types available
- [ ] Create program works
- [ ] Programs show active/inactive
- [ ] Edit program works

### Rewards Page
- [ ] Create reward
- [ ] Link to loyalty program
- [ ] Set reward value
- [ ] Mark as active/inactive

### Staff Customer Lookup
- [ ] Search by phone works
- [ ] Customer profile loads
- [ ] Add visit button works
- [ ] Add points button works
- [ ] Redeem reward works
- [ ] Real-time updates

### Customer Card (Public)
- [ ] QR code displays
- [ ] Stamp card shows visual stamps
- [ ] Points balance displays
- [ ] Available rewards listed
- [ ] Visit history shows
- [ ] Wallet buttons appear

---

## 🚦 QUICK TEST CHECKLIST

- [ ] **Login** works for all 3 roles
- [ ] **Super Admin** can manage businesses
- [ ] **Business Admin** can create programs
- [ ] **Staff** can add visits/points
- [ ] **Customer card** displays correctly
- [ ] **Rewards** auto-unlock at threshold
- [ ] **Redemption** works and resets counters
- [ ] **QR codes** generate correctly
- [ ] **Search** finds customers
- [ ] **Reports** show data
- [ ] **Settings** save changes
- [ ] **Mobile responsive** works

---

## 🎬 START TESTING NOW!

1. **Open:** `http://localhost:5173/login`
2. **Login as Super Admin:** `admin@loyaltypass.com / admin123`
3. **Explore the platform!**

**Or jump to specific test:**
- Business Owner: `business@coffeeparadise.com / admin123`
- Staff Member: `staff@coffeeparadise.com / admin123`

---

## 🐛 If Something Doesn't Work

Check:
1. Dev server is running
2. Browser cache cleared (Ctrl+Shift+R)
3. Demo mode is active (no Supabase URL)
4. Check browser console for errors (F12)

---

## 📊 Expected Results

After full test, you should have:
- ✅ 3+ customers
- ✅ 2+ loyalty programs
- ✅ 5+ rewards
- ✅ 10+ visits recorded
- ✅ Multiple rewards redeemed
- ✅ QR codes generated
- ✅ Customer cards viewable
- ✅ Reports showing data

**Everything working? You're ready to launch! 🚀**

# 🚀 Run LoyaltyPass NOW - Quick Start

## Step 1: Install Dependencies (2 minutes)

```bash
cd frontend
npm install
```

Wait for installation to complete...

## Step 2: Setup Supabase FREE (5 minutes)

### 2.1 Create Free Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (fastest) or email
4. Create new project:
   - Name: `loyaltypass`
   - Database Password: `YourStrongPassword123!` (save this!)
   - Region: Choose closest to you
   - Click "Create new project"
5. Wait 2 minutes for project to initialize

### 2.2 Setup Database
1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Open file `supabase/schema.sql` from this project
4. Copy ALL content
5. Paste into Supabase SQL Editor
6. Click "Run" (bottom right)
7. Wait ~10 seconds
8. Should see "Success. No rows returned"

9. Click "New query" again
10. Open file `supabase/policies.sql`
11. Copy ALL content
12. Paste into Supabase SQL Editor
13. Click "Run"
14. Should see "Success"

### 2.3 Get Your Credentials
1. Click "Settings" (bottom left sidebar)
2. Click "API"
3. Copy these TWO values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

## Step 3: Configure App (1 minute)

1. In your project, go to `frontend` folder
2. Create new file called `.env` (just .env, no extension)
3. Paste this:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...your_long_key_here
```

4. Replace with YOUR actual URL and key from Step 2.3
5. Save the file

## Step 4: Start App! (30 seconds)

```bash
npm run dev
```

You'll see:
```
  VITE v5.1.6  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

Open browser: **http://localhost:3000**

## Step 5: Create First User (1 minute)

1. Click "Register" (or go to http://localhost:3000/register)
2. Fill in:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: password123
3. Click "Register"
4. You'll be redirected to login
5. Login with same credentials

## Step 6: Make Yourself Super Admin (1 minute)

1. Go back to Supabase dashboard
2. Click "Table Editor" (left sidebar)
3. Click "profiles" table
4. Find your user (the one you just created)
5. Click the row to edit
6. Find "role" column
7. Change from `staff` to `super_admin`
8. Click "Save"

9. Go back to your app
10. Refresh page
11. You'll be redirected to `/super-admin` dashboard

🎉 **YOU'RE IN! Your app is running!**

---

## 💰 WALLET SOLUTION - NO APPLE/GOOGLE ACCOUNT NEEDED!

### Option 1: QR Code Only (FREE - RECOMMENDED)
**What it is**: Customers just use the QR code directly, no wallet needed
**Cost**: $0
**Works on**: All phones
**How it works**:
- Customer gets unique QR code
- Save QR as image to phone
- Staff scans it to identify customer
- Simple, works everywhere!

**Implementation**: Already working! Just use the QR code feature.

### Option 2: Web-Based Digital Card (FREE)
**What it is**: Customer gets a web link they can bookmark
**Cost**: $0
**Works on**: All phones
**How it works**:
- Customer visits: `yourapp.com/card/CUSTOMER_ID`
- Shows their points, visits, rewards
- Can add to home screen (acts like app!)
- No Apple/Google needed

**Want this? I can add it in 5 minutes!**

### Option 3: PWA (Progressive Web App) (FREE)
**What it is**: App installs from website, no app store
**Cost**: $0
**Works on**: All modern phones
**How it works**:
- Customer visits your website
- Browser shows "Add to Home Screen"
- Installs like a real app
- Full screen, push notifications

**Want this? I can add it in 10 minutes!**

### Option 4: Simple SMS Link (CHEAP)
**What it is**: Customer gets SMS with their loyalty info link
**Cost**: ~$0.01 per SMS
**Works on**: All phones
**How it works**:
- Customer gives phone number
- Receives SMS: "Your loyalty card: yourapp.com/card/xxx"
- Click link anytime to see status

**Want this? I can add it in 5 minutes!**

---

## 🎯 RECOMMENDED SOLUTION (FREE):

Use **QR Code + Web Card** combo:

1. **QR Code** - Already working!
   - Customer gets QR code image
   - Staff scans to identify
   - Fast, universal

2. **Web Card** - I'll add now (5 min)
   - Customer also gets web link
   - Can check status anytime
   - Bookmark or add to home screen

**This is FREE, works everywhere, no developer accounts needed!**

Want me to add the Web Card feature? Just say "yes add web card"

---

## Troubleshooting

### Error: "Missing Supabase credentials"
- Check your `.env` file exists in `frontend/` folder
- Check the values are correct
- Restart: Stop server (Ctrl+C) and run `npm run dev` again

### Error: "Cannot connect to database"
- Check your Supabase project is running
- Check the URL is correct (no trailing slash)
- Check internet connection

### Can't login after creating account
- Go to Supabase → Table Editor → profiles
- Check if your user exists
- Make sure you changed role to `super_admin`

### Port 3000 already in use
- Change port: `npm run dev -- --port 3001`

---

## What You Can Do Now

✅ **Create Businesses**
- Go to "Businesses" → "Add Business"
- Fill in details
- Click create

✅ **Create Customers**
- First create a business
- Create a business admin user
- Login as business admin
- Go to "Customers" → "Add Customer"
- Enter phone number
- Done!

✅ **Test Staff Workflow**
- Create staff user
- Login as staff
- Go to "Customer Lookup"
- Search by phone
- Add visit
- Watch points increase!

---

## Next Steps

1. ✅ Run app locally (done!)
2. ✅ Test all features
3. 📱 Choose wallet solution (QR code is FREE!)
4. 🚀 Deploy to internet (optional)
5. 💰 Start selling subscriptions!

**Need help? Ask me anything!**

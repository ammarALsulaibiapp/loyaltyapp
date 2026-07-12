# LoyaltyPass Setup Guide

Complete guide to set up and deploy your LoyaltyPass platform.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier works!)
- Netlify or Vercel account (optional, for deployment)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: loyaltypass
   - Database Password: (save this!)
   - Region: Choose closest to your users
4. Wait for project to be ready (~2 minutes)

### 1.2 Run Database Schema

1. In your Supabase project, go to "SQL Editor"
2. Create a new query
3. Copy the entire contents of `supabase/schema.sql`
4. Click "Run"
5. Wait for completion (should see "Success")

### 1.3 Apply Row Level Security

1. In SQL Editor, create another new query
2. Copy the entire contents of `supabase/policies.sql`
3. Click "Run"
4. Verify no errors

### 1.4 Create Storage Buckets

1. Go to "Storage" in Supabase dashboard
2. Create bucket: `business-logos`
   - Public: No
   - File size limit: 5MB
   - Allowed MIME types: image/*
3. Create bucket: `wallet-cards`
   - Public: No
   - File size limit: 2MB

### 1.5 Get API Credentials

1. Go to "Settings" → "API"
2. Copy:
   - Project URL
   - Project API keys → anon/public key
3. Save these for next step

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 Configure Environment

Create `.env` file in `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase credentials from Step 1.5.

### 2.3 Start Development Server

```bash
npm run dev
```

Your app should now be running at http://localhost:3000

## Step 3: Create First Super Admin

### 3.1 Register First User

1. Open http://localhost:3000/register
2. Fill in registration form:
   - Full Name: Your Name
   - Email: admin@yourdomain.com
   - Password: (secure password)
3. Click "Register"

### 3.2 Promote to Super Admin

1. Go to Supabase Dashboard → "Table Editor"
2. Open `profiles` table
3. Find your newly created user
4. Edit the row:
   - Change `role` from `staff` to `super_admin`
5. Save

### 3.3 Login as Super Admin

1. Go to http://localhost:3000/login
2. Login with your credentials
3. You should be redirected to `/super-admin` dashboard

## Step 4: Create Your First Business

### 4.1 Add Business

1. In Super Admin dashboard, click "Businesses"
2. Click "Add Business"
3. Fill in:
   - Business Name: Coffee Shop Demo
   - Slug: coffee-shop-demo (unique identifier)
   - Email: coffee@example.com
   - Phone: +968 9123 4567
   - Brand Color: #8B4513 (brown for coffee)
4. Click "Create Business"

### 4.2 Create Subscription

1. Go to Supabase → Table Editor → `subscriptions`
2. Insert new row:
   - business_id: (your business ID)
   - plan_name: Starter
   - max_customers: 500
   - max_staff: 1
   - start_date: 2024-01-01
   - expiry_date: 2024-12-31
   - status: active
   - monthly_price: 29.99
3. Save

### 4.3 Create Business Admin User

1. Register a new user at /register
2. In Supabase, edit the new profile:
   - role: business_admin
   - business_id: (your business ID from Step 4.1)
3. Login with the new business admin account
4. You should see the business dashboard

## Step 5: Test Customer Workflow

### 5.1 Create Loyalty Program

1. Login as Business Admin
2. Go to "Loyalty Programs"
3. Click "Create Program"
4. Fill in:
   - Name: Buy 5 Get 1 Free
   - Type: Visit-Based
   - Required Visits: 5
   - Reward Name: Free Coffee
5. Click "Create"

### 5.2 Add Customer

1. Go to "Customers"
2. Click "Add Customer"
3. Fill in:
   - Phone: +968 9111 1111
   - Name: John Doe
4. Click "Create"

### 5.3 Create Staff Account

1. Go to "Staff"
2. Click "Add Staff"
3. Register staff user and assign to business

### 5.4 Test Staff Workflow

1. Logout and login as Staff
2. Go to "Customer Lookup"
3. Enter phone: +968 9111 1111
4. Click "Add Visit"
5. Add 5 visits
6. Watch reward automatically unlock!

## Step 6: Deployment (Optional)

### Option A: Netlify

```bash
cd frontend
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option B: Vercel

```bash
cd frontend
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Important: Set Environment Variables

Don't forget to add your environment variables in Netlify/Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Step 7: Configure Apple/Google Wallet (Advanced)

### Apple Wallet Setup

1. Get Apple Developer Account ($99/year)
2. Create Pass Type ID
3. Generate signing certificate
4. Update wallet.ts with your credentials
5. Implement server-side signing

### Google Wallet Setup

1. Create Google Cloud Project
2. Enable Google Wallet API
3. Create Service Account
4. Update wallet.ts with credentials
5. Implement JWT signing

See `docs/WALLET_INTEGRATION.md` for detailed guide.

## Troubleshooting

### "Missing Supabase credentials" error
- Check your `.env` file exists in `frontend/` directory
- Verify credentials are correct
- Restart dev server after changing .env

### Database errors
- Ensure schema.sql ran without errors
- Check RLS policies are applied
- Verify user has correct role assigned

### Can't login after registration
- Check profiles table to see if user was created
- Verify email/password are correct
- Check browser console for errors

### Customer not found
- Ensure customer was created in correct business
- Verify phone number format matches exactly
- Check business_id is correctly assigned

## Next Steps

- Read `docs/USER_GUIDE.md` for feature overview
- Check `docs/API.md` for API documentation
- See `docs/CUSTOMIZATION.md` for branding options

## Support

For issues:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Review this guide carefully
4. Open GitHub issue with error details

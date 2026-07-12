# LoyaltyPass - Complete SaaS QR Loyalty Platform

🎯 **Production-Ready** | 📱 **Mobile-First** | 🌍 **Multi-Language** | 🔒 **Enterprise Security**

A complete multi-tenant SaaS platform for selling loyalty card subscriptions to businesses. Each business gets their own portal to manage customers, visits, rewards, and staff using phone-based identification and automatic reward calculations.

---

## ⚡ Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd loyaltypass/frontend
npm install

# 2. Create Supabase project at https://supabase.com

# 3. Run database setup
# Copy supabase/schema.sql → Supabase SQL Editor → Run
# Copy supabase/policies.sql → Supabase SQL Editor → Run

# 4. Configure environment
cp .env.example .env
# Add your Supabase URL and anon key to .env

# 5. Start development
npm run dev

# 6. Create first Super Admin
# Register at /register
# In Supabase, update profiles table: role = 'super_admin'
# Login and start creating businesses!
```

**🚀 Full setup guide:** [docs/SETUP.md](docs/SETUP.md)

---

## ✨ Features

- 🏢 Multi-tenant architecture (Super Admin + Business Admin + Staff)
- 📱 Phone-based customer identification (no login required)
- 🎁 Multiple loyalty program types (visits, points, stamps, cashback)
- 💳 Digital wallet integration (Apple Wallet + Google Wallet)
- 🔐 QR code system for customer identification
- 💰 Subscription billing system
- 📊 Analytics and reporting
- 🌍 Arabic & English with full RTL support
- 🌙 Dark mode support
- 📱 Fully responsive

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Netlify/Vercel
- **Security**: Row Level Security (RLS)

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Netlify or Vercel account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd loyaltypass
```

2. **Install dependencies**
```bash
cd frontend
npm install
```

3. **Configure Supabase**
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Create `.env` file in frontend directory:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Go to Supabase SQL Editor
   - Run the schema from `supabase/schema.sql`
   - Run the RLS policies from `supabase/policies.sql`
   - Run the functions from `supabase/functions.sql`

5. **Start development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
```

## Database Setup

The platform uses Supabase PostgreSQL with the following main tables:

- `profiles` - User accounts (Super Admin, Business Admin, Staff)
- `businesses` - Business accounts
- `subscriptions` - Subscription plans and billing
- `customers` - Customer records (phone-based)
- `loyalty_programs` - Loyalty program configurations
- `visits` - Customer visit tracking
- `rewards` - Available rewards
- `reward_redemptions` - Redemption history
- `invoices` - Billing invoices
- `wallet_cards` - Digital wallet card data
- `notification_settings` - SMS/WhatsApp/Email configuration

## User Roles

### Super Admin
- Manage all businesses
- Create/edit/suspend/delete businesses
- Assign subscription plans
- Generate invoices
- View platform-wide analytics

### Business Admin
- Manage staff
- Manage customers
- Create loyalty programs
- Manage rewards
- View business reports
- Customize branding

### Staff
- Search customers
- Add visits
- Add points
- Redeem rewards

## Loyalty Program Types

1. **Visit-Based**: Buy X, Get 1 Free
2. **Points-Based**: Earn points per spend
3. **Stamp Cards**: Collect stamps
4. **Cashback**: Percentage back on spend
5. **Membership Tiers**: Bronze, Silver, Gold, VIP

## Customer Workflow

1. Customer enters business
2. Staff asks: "What is your phone number?"
3. Staff enters phone number
4. System displays customer profile or creates new customer instantly
5. Staff adds visit/points/stamps
6. System automatically calculates and unlocks rewards

## Digital Wallet Integration

### Apple Wallet (.pkpass)
- Generates real Apple Wallet loyalty cards
- Shows business logo, QR code, points, visits
- Auto-updates when loyalty data changes

### Google Wallet
- Generates Google Wallet loyalty cards
- Shows business branding and loyalty info
- Auto-updates automatically

## Security

- Row Level Security (RLS) on all tables
- Tenant isolation (businesses only see their data)
- Secure QR codes with encryption
- Role-based access control

## Deployment

### Netlify
```bash
cd frontend
npm run build
netlify deploy --prod
```

### Vercel
```bash
cd frontend
npm run build
vercel --prod
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Support

For issues and questions, please contact support.

## License

Proprietary - All rights reserved

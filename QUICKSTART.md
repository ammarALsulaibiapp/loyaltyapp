# LoyaltyPass - Quick Start

## 1. Install Dependencies

```bash
cd frontend
npm install
```

## 2. Setup Supabase

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor and run `supabase/schema.sql`
4. Run `supabase/policies.sql`
5. Get your credentials from Settings → API

## 3. Configure Environment

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Start Development

```bash
npm run dev
```

Open http://localhost:3000

## 5. Create Super Admin

1. Register at /register
2. Go to Supabase → profiles table
3. Change your role to `super_admin`
4. Login and you're ready!

## Next Steps

- Read `docs/SETUP.md` for detailed setup
- Read `docs/USER_GUIDE.md` to learn features
- Read `docs/DEPLOYMENT.md` to deploy

## Quick Deploy

```bash
npm run build
netlify deploy --prod
```

Done! 🚀

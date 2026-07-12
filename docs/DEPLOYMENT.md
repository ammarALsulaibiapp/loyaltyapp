# LoyaltyPass Deployment Guide

Complete guide for deploying LoyaltyPass to production.

## Overview

LoyaltyPass uses a simple, cost-effective stack:
- **Frontend**: React (Static Site) → Netlify/Vercel
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Total Cost**: ~$0-50/month depending on usage

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema applied
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Super admin account created
- [ ] Environment variables documented
- [ ] Frontend builds without errors
- [ ] All features tested locally

## Deployment Options

### Option 1: Netlify (Recommended)

**Pros:**
- Simple drag-and-drop deployment
- Automatic HTTPS
- CDN included
- Great free tier
- Continuous deployment from Git

**Pricing:** Free for starter projects

#### Steps:

1. **Build the project**
```bash
cd frontend
npm run build
```

2. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

3. **Login to Netlify**
```bash
netlify login
```

4. **Deploy**
```bash
netlify deploy --prod
```

5. **Configure Environment Variables**
- Go to Netlify dashboard
- Site settings → Environment variables
- Add:
  ```
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```

6. **Setup Custom Domain (Optional)**
- Site settings → Domain management
- Add custom domain
- Configure DNS
- SSL auto-enabled

#### Continuous Deployment

1. **Connect Git Repository**
```bash
netlify init
```

2. **Configure Build Settings**
- Build command: `npm run build`
- Publish directory: `dist`
- Production branch: `main`

3. **Auto-deploy on push**
- Every push to main triggers build
- Preview deploys for PRs
- Rollback capability

### Option 2: Vercel

**Pros:**
- Excellent performance
- Automatic HTTPS
- Global CDN
- Zero config for React
- Great analytics

**Pricing:** Free for personal projects

#### Steps:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
cd frontend
vercel --prod
```

4. **Configure Environment Variables**
- Go to Vercel dashboard
- Project → Settings → Environment Variables
- Add:
  ```
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```

5. **Connect GitHub (Optional)**
- Import Git repository
- Auto-deploy on push
- Preview deployments

### Option 3: Manual Hosting

Deploy to any static host (GitHub Pages, AWS S3, DigitalOcean, etc.)

1. **Build**
```bash
cd frontend
npm run build
```

2. **Upload `dist/` folder** to your hosting provider

3. **Configure redirects** for client-side routing:

**Netlify** - Create `public/_redirects`:
```
/*    /index.html   200
```

**Vercel** - Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Apache** - Create `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx** - Configure:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Supabase Production Configuration

### Database Optimization

1. **Enable connection pooling**
   - Settings → Database → Connection Pooling
   - Use pooler mode: Transaction

2. **Set up daily backups**
   - Settings → Database → Backups
   - Enable automatic backups
   - Retention: 7 days (or more)

3. **Add database indexes** (Already in schema.sql):
   ```sql
   -- Check indexes exist
   SELECT * FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

### Security Hardening

1. **Review RLS Policies**
   - Ensure all tables have RLS enabled
   - Test policies with different roles
   - No data leaks between businesses

2. **Rotate Secrets**
   - Generate new JWT secret (if needed)
   - Update anon key (if compromised)

3. **Enable Email Verification** (Optional)
   - Settings → Authentication → Email
   - Enable "Confirm email"

4. **Configure Auth Limits**
   - Rate limiting enabled
   - Maximum connections configured

### Storage Configuration

1. **Set File Size Limits**
   - business-logos: 5MB max
   - wallet-cards: 2MB max

2. **Configure CORS** (if needed):
```sql
-- Allow your domain
INSERT INTO storage.cors (
  bucket_id,
  allowed_origins,
  allowed_methods
) VALUES (
  'business-logos',
  ARRAY['https://yourdomain.com'],
  ARRAY['GET', 'POST', 'PUT', 'DELETE']
);
```

## Performance Optimization

### Frontend Optimization

Already configured in vite.config.ts:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

### Additional Optimizations

1. **Enable Gzip/Brotli**
   - Automatically enabled on Netlify/Vercel
   - Check server compression settings

2. **Image Optimization**
   - Use WebP format for logos
   - Compress images before upload
   - Lazy load images

3. **Lazy Load Routes**
   - Already implemented in App.tsx
   - Routes load on demand

### Monitoring Performance

1. **Lighthouse Score**
```bash
npm install -g lighthouse
lighthouse https://yourdomain.com
```

Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

2. **Web Vitals**
- Monitor in production
- Use browser dev tools
- Check Vercel/Netlify analytics

## Environment Variables

### Required Variables

```env
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (for wallet integration)
VITE_APPLE_TEAM_ID=your-apple-team-id
VITE_GOOGLE_WALLET_ISSUER=your-google-issuer-id
```

### Security Best Practices

- ✅ Never commit .env files
- ✅ Use platform secret managers
- ✅ Rotate keys regularly
- ✅ Different keys per environment
- ❌ Don't expose service role key in frontend

## Domain Configuration

### Custom Domain Setup

1. **Purchase Domain** (Namecheap, GoDaddy, etc.)

2. **Configure DNS**:

**For Netlify:**
```
A Record: @ → 75.2.60.5
CNAME: www → your-site.netlify.app
```

**For Vercel:**
```
A Record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com
```

3. **Enable HTTPS**
   - Automatic on both platforms
   - SSL certificate auto-issued
   - Redirects HTTP to HTTPS

### Subdomain Setup (Optional)

```
app.yourdomain.com → your-deployment
api.yourdomain.com → Supabase (if custom)
```

## Post-Deployment Testing

### Functional Testing

Test each role:

**Super Admin:**
- [ ] Login works
- [ ] Create business
- [ ] Generate invoice
- [ ] View analytics

**Business Admin:**
- [ ] Login works
- [ ] Create customer
- [ ] Create loyalty program
- [ ] Add staff
- [ ] View reports
- [ ] Update settings

**Staff:**
- [ ] Login works
- [ ] Customer lookup
- [ ] Add visit
- [ ] Redeem reward

### Security Testing

- [ ] Cannot access other business data
- [ ] Staff cannot see admin pages
- [ ] RLS prevents data leaks
- [ ] Auth redirects work
- [ ] Session management works

### Performance Testing

- [ ] Page load < 2 seconds
- [ ] Search is instant
- [ ] Forms submit quickly
- [ ] Images load fast
- [ ] Mobile responsive

### Browser Testing

Test on:
- [ ] Chrome (desktop & mobile)
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] iOS Safari
- [ ] Android Chrome

## Maintenance

### Daily
- Monitor error logs
- Check Supabase usage
- Review new signups

### Weekly
- Review analytics
- Check subscription expirations
- Review customer support tickets
- Test critical paths

### Monthly
- Database backup verification
- Security audit
- Performance review
- Cost analysis
- Update dependencies

### Quarterly
- Feature review
- User feedback analysis
- Scaling assessment
- Security updates

## Scaling Considerations

### When to Scale

**Database:**
- >50 concurrent connections
- Query response time >500ms
- Running out of storage

**Frontend:**
- >100k monthly visitors
- High CDN costs

**Supabase Plan Upgrade Triggers:**
- Free tier limits hit
- Need more database storage
- Need more bandwidth
- Need priority support

### Scaling Strategy

1. **Optimize First**
   - Add database indexes
   - Optimize queries
   - Enable caching

2. **Vertical Scaling**
   - Upgrade Supabase plan
   - Larger database instance
   - More concurrent connections

3. **Horizontal Scaling**
   - Read replicas (Enterprise)
   - Multiple regions (Enterprise)
   - CDN optimization

## Backup Strategy

### Database Backups

**Automatic (Supabase):**
- Daily backups (Pro plan)
- 7-day retention
- Point-in-time recovery

**Manual Backups:**
```bash
# Export schema
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --schema-only > schema_backup.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --data-only > data_backup.sql
```

### Code Backups

- Git repository (GitHub/GitLab)
- Multiple branches
- Tagged releases

### Storage Backups

- Download all files from buckets
- Store in separate location
- Monthly exports

## Disaster Recovery

### Database Failure

1. Use Supabase backup restore
2. Or restore from manual backup
3. Verify data integrity
4. Test all features

### Deployment Failure

1. Rollback in Netlify/Vercel
2. Or redeploy last working version
3. Check error logs
4. Fix and redeploy

### Data Corruption

1. Identify affected records
2. Restore from backup
3. Run integrity checks
4. Notify affected businesses

## Monitoring & Alerts

### Supabase Monitoring

- Database CPU usage
- Storage usage
- API requests
- Error rates

### Application Monitoring

**Free Options:**
- Google Analytics
- Netlify/Vercel analytics
- Supabase dashboard

**Paid Options:**
- Sentry (error tracking)
- LogRocket (session replay)
- Datadog (full monitoring)

### Set Up Alerts

**Email alerts for:**
- Database >80% full
- High error rates
- Subscription expirations
- Payment failures

## Cost Estimation

### Minimal Setup (0-100 businesses)

- **Supabase**: Free tier ($0)
- **Netlify**: Free tier ($0)
- **Domain**: $10-15/year
- **Total**: ~$15/year

### Growing (100-1000 businesses)

- **Supabase**: Pro ($25/month)
- **Vercel**: Pro ($20/month)
- **Domain**: $15/year
- **Total**: ~$555/year

### Scale (1000+ businesses)

- **Supabase**: Team/Enterprise ($599+/month)
- **Vercel**: Enterprise ($custom)
- **Monitoring**: $50-200/month
- **Total**: $8000+/year

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Error tracking setup
- [ ] Analytics configured
- [ ] Backup strategy implemented
- [ ] Support email configured
- [ ] Terms of service ready
- [ ] Privacy policy ready
- [ ] Contact page created
- [ ] Super admin account secured
- [ ] Test all user flows
- [ ] Mobile tested
- [ ] Performance optimized
- [ ] SEO meta tags added

## Launch! 🚀

Once checklist complete:
1. Announce launch
2. Onboard first businesses
3. Monitor closely for 48h
4. Gather feedback
5. Iterate and improve

**Congratulations on deploying LoyaltyPass!**

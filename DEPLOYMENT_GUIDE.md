# 🚀 Complete Deployment Guide for sabaasoul.com

## ✅ What You'll Have When Done:
- `sabaasoul.com` → Landing page (Solutions center)
- `app.sabaasoul.com` → Loyalty app (full system)
- `support@sabaasoul.com` → Professional email
- `info@sabaasoul.com` → Contact email
- `admin@sabaasoul.com` → Admin email

---

## 📋 STEP 1: Setup Cloudflare Email (10 minutes)

### 1.1 Login to Cloudflare
- Go to: https://dash.cloudflare.com
- Login with your account
- Select your domain: `sabaasoul.com`

### 1.2 Enable Email Routing
1. Click **Email** in left sidebar
2. Click **Email Routing**
3. Click **Get Started**
4. Click **Enable Email Routing**

### 1.3 Add Your Gmail as Destination
1. Enter your personal Gmail address
2. Click **Send verification email**
3. Check your Gmail inbox
4. Click the verification link
5. Return to Cloudflare

### 1.4 Create Email Addresses
Add these 3 addresses (one by one):

**Address 1:**
- Custom address: `support@sabaasoul.com`
- Destination: Your Gmail
- Click **Create**

**Address 2:**
- Custom address: `info@sabaasoul.com`
- Destination: Your Gmail
- Click **Create**

**Address 3:**
- Custom address: `admin@sabaasoul.com`
- Destination: Your Gmail
- Click **Create**

### 1.5 Test Email
- Send test email from Gmail to `support@sabaasoul.com`
- Should arrive in your Gmail within 1 minute
- ✅ Email setup complete!

---

## 📋 STEP 2: Push Landing Page to GitHub (5 minutes)

### 2.1 Create Landing Folder
```bash
cd c:\Users\moaya\QR SYSTEM
git add landing/index.html
git commit -m "Add Sabaa Soul landing page"
git push origin main
```

### 2.2 Verify on GitHub
- Go to: https://github.com/ammarALsulaibiapp/loyaltyapp
- You should see `/landing` folder with `index.html`
- ✅ Landing page in GitHub!

---

## 📋 STEP 3: Deploy Landing Page to Vercel (10 minutes)

### 3.1 Sign Up for Vercel
- Go to: https://vercel.com/signup
- Click **Continue with GitHub**
- Authorize Vercel to access your GitHub

### 3.2 Import Landing Page Project
1. Click **Add New...** → **Project**
2. Find `loyaltyapp` repository
3. Click **Import**

### 3.3 Configure Landing Project
- **Project Name:** `sabaasoul-landing`
- **Framework Preset:** Other
- **Root Directory:** `landing`
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty)
- Click **Deploy**

### 3.4 Wait for Deployment
- Watch the build logs
- Should complete in 1-2 minutes
- You'll get a URL like: `sabaasoul-landing.vercel.app`
- ✅ Landing page deployed!

---

## 📋 STEP 4: Add Custom Domain to Landing (10 minutes)

### 4.1 In Vercel Dashboard
1. Go to your project: `sabaasoul-landing`
2. Click **Settings**
3. Click **Domains**
4. Click **Add**

### 4.2 Add Root Domain
1. Enter: `sabaasoul.com`
2. Click **Add**
3. Vercel will show you DNS records to add

### 4.3 Add DNS Records in Cloudflare
**Vercel will show something like:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**In Cloudflare:**
1. Go to **DNS** tab
2. Click **Add record**
3. Type: `A`
4. Name: `@`
5. IPv4 address: `76.76.21.21` (use the IP Vercel shows)
6. Proxy status: **Proxied** (orange cloud)
7. Click **Save**

**Also add CNAME for www:**
1. Click **Add record**
2. Type: `CNAME`
3. Name: `www`
4. Target: `cname.vercel-dns.com` (check what Vercel shows)
5. Proxy status: **Proxied**
6. Click **Save**

### 4.4 Verify Domain
- Go back to Vercel
- Wait 1-5 minutes
- Refresh the page
- Should show: ✅ Valid Configuration
- Open: `https://sabaasoul.com`
- ✅ Landing page live on your domain!

---

## 📋 STEP 5: Deploy Loyalty App to Vercel (15 minutes)

### 5.1 Create New Vercel Project
1. In Vercel dashboard, click **Add New...** → **Project**
2. Select `loyaltyapp` repository again
3. Click **Import**

### 5.2 Configure Loyalty App Project
- **Project Name:** `sabaasoul-loyalty`
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 5.3 Add Environment Variables
Click **Environment Variables** and add these:

```
Name: VITE_SUPABASE_URL
Value: https://uflzxfewtemiysygfwun.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbHp4ZmV3dGVtaXlzeWdmd3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjkzNjcsImV4cCI6MjA5NzEwNTM2N30.k9tkdwu6BZYeiuXxauo1mXLtmiWHDrP4CNq1uJEfC1Y
```

```
Name: VITE_BACKEND_URL
Value: https://loyaltyapp-production-0301.up.railway.app
```

```
Name: VITE_API_KEY
Value: 6b3121ed39aa6c3d35f51cc36f223b4e13460ff33d59c97b6b18173bc2d09d32
```

### 5.4 Deploy
- Click **Deploy**
- Wait 2-3 minutes for build
- You'll get: `sabaasoul-loyalty.vercel.app`
- ✅ Loyalty app deployed!

---

## 📋 STEP 6: Add Subdomain for Loyalty App (10 minutes)

### 6.1 In Vercel (loyalty project)
1. Go to `sabaasoul-loyalty` project
2. Click **Settings** → **Domains**
3. Click **Add**
4. Enter: `app.sabaasoul.com`
5. Click **Add**

### 6.2 Add DNS Record in Cloudflare
**Vercel will show:**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

**In Cloudflare:**
1. Go to **DNS** tab
2. Click **Add record**
3. Type: `CNAME`
4. Name: `app`
5. Target: `cname.vercel-dns.com` (use what Vercel shows)
6. Proxy status: **Proxied**
7. Click **Save**

### 6.3 Verify
- Wait 1-5 minutes
- Go to: `https://app.sabaasoul.com`
- Should see your loyalty system!
- ✅ Loyalty app live on subdomain!

---

## 📋 STEP 7: Update Railway Backend Domain (Optional - 10 minutes)

### 7.1 Add Custom Domain to Railway
1. Go to: https://railway.app
2. Select your backend project
3. Go to **Settings**
4. Scroll to **Networking**
5. Click **Custom Domain**
6. Enter: `api.sabaasoul.com`
7. Railway will show you DNS records

### 7.2 Add DNS in Cloudflare
1. Cloudflare → DNS
2. Add CNAME record:
   - Type: `CNAME`
   - Name: `api`
   - Target: (what Railway shows)
   - Proxy: **DNS only** (grey cloud - IMPORTANT!)
3. Save

### 7.3 Update Backend URL
After domain works, update environment variable:

**In Vercel (loyalty project):**
1. Settings → Environment Variables
2. Edit `VITE_BACKEND_URL`
3. Change to: `https://api.sabaasoul.com`
4. Save
5. Click **Redeploy**

---

## 🎉 FINAL RESULT

After all steps complete:

✅ `https://sabaasoul.com` → Landing page  
✅ `https://app.sabaasoul.com` → Loyalty system  
✅ `https://api.sabaasoul.com` → Backend API (optional)  
✅ `support@sabaasoul.com` → Your Gmail  
✅ `info@sabaasoul.com` → Your Gmail  
✅ `admin@sabaasoul.com` → Your Gmail  

---

## 🆘 TROUBLESHOOTING

### Email not working?
- Wait 10 minutes for DNS propagation
- Check Cloudflare Email Routing is enabled
- Send test from external email (not Gmail to Gmail)

### Domain not connecting?
- Wait 5-10 minutes for DNS propagation
- Check DNS records are correct in Cloudflare
- Clear browser cache (Ctrl+Shift+Delete)

### App not loading?
- Check environment variables in Vercel
- Check build logs for errors
- Verify backend is running on Railway

---

## 📞 SUPPORT

If stuck, check:
1. Cloudflare DNS records
2. Vercel deployment logs
3. Railway backend status

**Everything should work within 10-30 minutes after DNS changes!**

---

## ⏱️ TOTAL TIME: ~1 hour

**Steps 1-6 are REQUIRED**  
**Step 7 is OPTIONAL** (can use Railway default URL for now)

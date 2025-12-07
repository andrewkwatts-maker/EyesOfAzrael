# Deployment Guide - Eyes of Azrael

## Overview

This guide covers deploying your Eyes of Azrael website with Firebase integration. You have multiple deployment options, each with different benefits.

**Deployment Options:**
1. **Firebase Hosting** (Recommended) - Integrated, fast, free SSL
2. **GitHub Pages** - Free, simple, Git-based
3. **Netlify** - Easy, continuous deployment, generous free tier
4. **Vercel** - Modern, optimized for performance
5. **Custom Server** - Full control, requires setup

---

## Option 1: Firebase Hosting (Recommended)

**Why Firebase Hosting?**
- Integrated with Firebase services (Auth, Firestore, Storage)
- Fast global CDN
- Free SSL certificate
- Custom domain support
- Easy rollbacks
- Great free tier (10GB/month)

### Prerequisites

- Firebase project set up (see `FIREBASE_SETUP_GUIDE.md`)
- Node.js installed (for Firebase CLI)
- Website files ready to deploy

### Step 1: Install Firebase CLI

```bash
# Install globally using npm
npm install -g firebase-tools

# Verify installation
firebase --version
```

**Expected output:** `firebase-tools@X.X.X`

### Step 2: Login to Firebase

```bash
firebase login
```

This will:
1. Open your browser
2. Ask you to sign in with Google
3. Request permissions
4. Confirm login in terminal

**Expected output:** `✔ Success! Logged in as your-email@gmail.com`

### Step 3: Initialize Firebase Hosting

Navigate to your project directory:

```bash
cd path/to/EyesOfAzrael
```

Initialize Firebase:

```bash
firebase init hosting
```

**Interactive prompts:**

1. **"Please select an option:"**
   - Select: `Use an existing project`
   - Arrow down to your project (e.g., `eyes-of-azrael`)
   - Press Enter

2. **"What do you want to use as your public directory?"**
   - Enter: `.` (current directory, since your index.html is at root)
   - Or enter a subdirectory if your built files are elsewhere

3. **"Configure as a single-page app (rewrite all urls to /index.html)?"**
   - Enter: `N` (No) - We have multiple HTML pages

4. **"Set up automatic builds and deploys with GitHub?"**
   - Enter: `N` (No) - We'll deploy manually for now

5. **"File index.html already exists. Overwrite?"**
   - Enter: `N` (No) - Keep your existing files!

### Step 4: Configure firebase.json

Firebase created `firebase.json`. Update it with optimal settings:

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.md",
      "scripts/**",
      "test-*.html"
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=7200"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=3600"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

**What this does:**
- Sets public directory to root (`.`)
- Ignores config files, markdown docs, test files
- Caches images for 2 hours
- Caches JS/CSS for 1 hour
- Enables clean URLs (`/about` instead of `/about.html`)
- Removes trailing slashes

### Step 5: Deploy

```bash
firebase deploy --only hosting
```

**What happens:**
1. Firebase CLI packages your files
2. Uploads to Firebase CDN
3. Deploys across global edge servers
4. Provides deployment URL

**Expected output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

### Step 6: Test Deployment

1. Visit the provided URL (e.g., `https://eyes-of-azrael.web.app`)
2. Test key pages:
   - Home page loads
   - Navigation works
   - Theory submission page works
   - Google sign-in works
   - Image upload works
3. Check browser console for errors

### Step 7: Set Up Custom Domain (Optional)

#### Step 7.1: Add Domain in Firebase Console

1. Go to Firebase Console → **Hosting**
2. Click **"Add custom domain"**
3. Enter your domain: `eyesofazrael.com`
4. Click **"Continue"**

#### Step 7.2: Verify Domain Ownership

Firebase will provide a **TXT record**:
```
Type: TXT
Name: @
Value: firebase=your-project
```

Add this to your domain's DNS settings:

**For GoDaddy:**
1. Login to GoDaddy
2. Go to **My Products** → **DNS**
3. Click **"Add"** → **"TXT"**
4. Name: `@`
5. Value: Paste Firebase value
6. TTL: 600 seconds
7. Save

**For Cloudflare:**
1. Login to Cloudflare
2. Select your domain → **DNS**
3. Click **"Add record"**
4. Type: `TXT`
5. Name: `@`
6. Content: Paste Firebase value
7. Save

#### Step 7.3: Wait for Verification

- Click **"Verify"** in Firebase Console
- May take up to 24 hours (usually minutes)
- Firebase will check TXT record

#### Step 7.4: Add A Records

After verification, Firebase provides **A records**:
```
Type: A
Name: @
Value: 151.101.1.195

Type: A
Name: @
Value: 151.101.65.195
```

Add these to your DNS:

**For GoDaddy:**
1. Add both A records with Name: `@`
2. Delete any existing A records pointing elsewhere

**For Cloudflare:**
1. Add both A records
2. Enable **Orange Cloud** (proxy)
3. This gives you Cloudflare's CDN + DDoS protection

#### Step 7.5: Add www Subdomain

Also add for `www`:
```
Type: CNAME
Name: www
Value: your-project.web.app
```

#### Step 7.6: Wait for SSL Certificate

- Firebase automatically provisions SSL
- Takes 5-15 minutes
- You'll receive email when ready
- Site will be available at `https://eyesofazrael.com`

### Step 8: Continuous Deployment

**Manual Deploy:**
```bash
firebase deploy --only hosting
```

**Auto-deploy with GitHub Actions:**

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

**Setup:**
1. Generate service account key in Firebase Console
2. Add as GitHub secret: `FIREBASE_SERVICE_ACCOUNT`
3. Push to main branch → auto-deploys

---

## Option 2: GitHub Pages

**Why GitHub Pages?**
- Free hosting
- Integrated with Git workflow
- Easy to set up
- Custom domain support

**Limitations:**
- Static sites only (no server-side code)
- Build process runs on GitHub servers
- 1GB size limit

### Step 1: Create GitHub Repository

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/yourusername/EyesOfAzrael.git

# Commit files
git add .
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch
4. Click **Save**

### Step 3: Configure Custom Domain (Optional)

1. In **Pages** settings, add custom domain: `eyesofazrael.com`
2. Add CNAME record in DNS:
   ```
   Type: CNAME
   Name: www (or @)
   Value: yourusername.github.io
   ```
3. Wait for DNS propagation (up to 24 hours)
4. Enable **"Enforce HTTPS"** in GitHub Pages settings

### Step 4: Access Your Site

- GitHub Pages URL: `https://yourusername.github.io/EyesOfAzrael/`
- Custom domain: `https://eyesofazrael.com`

**Important:** Update `firebase-config.js` with production Firebase config.

---

## Option 3: Netlify

**Why Netlify?**
- Automatic deploys from Git
- Preview deployments for PRs
- Form handling
- Serverless functions
- Generous free tier

### Step 1: Sign Up for Netlify

1. Go to [netlify.com](https://www.netlify.com)
2. Click **"Sign up"** → **"GitHub"**
3. Authorize Netlify

### Step 2: Deploy from Git

1. Click **"New site from Git"**
2. Select **GitHub**
3. Choose your repository: `EyesOfAzrael`
4. Configure build settings:
   - **Build command:** (leave empty for static site)
   - **Publish directory:** `.` (root)
5. Click **"Deploy site"**

### Step 3: Configure Environment Variables

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add Firebase config as environment variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - etc.
3. Update `firebase-config.js` to use `process.env` variables

### Step 4: Custom Domain

1. Go to **Domain settings** → **Add custom domain**
2. Enter: `eyesofazrael.com`
3. Follow DNS instructions (similar to Firebase)
4. Netlify provisions SSL automatically

### Step 5: Continuous Deployment

- Push to `main` branch → auto-deploys
- Open PR → gets preview URL
- Merge PR → deploys to production

**Access:** `https://your-site.netlify.app` or custom domain

---

## Option 4: Vercel

**Why Vercel?**
- Optimized for modern frameworks
- Edge functions
- Fast deployments
- Analytics
- Free tier

### Step 1: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign up"** → **"GitHub"**

### Step 2: Import Project

1. Click **"New Project"**
2. Import from GitHub: `EyesOfAzrael`
3. Configure:
   - **Framework Preset:** Other
   - **Build Command:** (leave empty)
   - **Output Directory:** `.`
4. Click **"Deploy"**

### Step 3: Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add Firebase config variables
3. Update `firebase-config.js`

### Step 4: Custom Domain

1. Go to **Settings** → **Domains**
2. Add: `eyesofazrael.com`
3. Configure DNS (CNAME or A records)
4. SSL provisioned automatically

**Access:** `https://your-project.vercel.app` or custom domain

---

## Option 5: Custom Server

**Why Custom Server?**
- Full control
- Can run server-side code
- No vendor lock-in

**Requirements:**
- VPS (Digital Ocean, Linode, AWS EC2)
- SSH access
- Basic Linux knowledge

### Step 1: Choose Hosting Provider

**Recommended:**
- **Digital Ocean** - $5/month droplet
- **Linode** - $5/month Nanode
- **Vultr** - $5/month instance

### Step 2: Set Up Server

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Nginx
apt install nginx -y

# Install Certbot (for SSL)
apt install certbot python3-certbot-nginx -y
```

### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/eyesofazrael`:

```nginx
server {
    listen 80;
    server_name eyesofazrael.com www.eyesofazrael.com;

    root /var/www/eyesofazrael;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/eyesofazrael /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 4: Deploy Files

```bash
# On your local machine
rsync -avz --exclude='node_modules' --exclude='.git' \
  ./ root@your-server-ip:/var/www/eyesofazrael/
```

### Step 5: Enable SSL

```bash
# On server
certbot --nginx -d eyesofazrael.com -d www.eyesofazrael.com
```

Follow prompts to:
1. Enter email
2. Agree to terms
3. Redirect HTTP to HTTPS (recommended)

**Access:** `https://eyesofazrael.com`

---

## Environment Variables for Production

### Firebase Config Security

**Never commit real Firebase config to public repos!**

### Option A: Environment Variables (Build Time)

Create `.env`:
```
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

Add to `.gitignore`:
```
.env
firebase-config.js
```

Update build process to inject variables.

### Option B: Different Configs per Environment

**Development:** `firebase-config.dev.js`
```javascript
const firebaseConfig = {
  apiKey: "dev-api-key",
  // ... dev config
};
```

**Production:** `firebase-config.prod.js`
```javascript
const firebaseConfig = {
  apiKey: "prod-api-key",
  // ... prod config
};
```

Use build script to copy appropriate config.

### Option C: Runtime Environment Variables

For platforms supporting runtime env vars (Netlify, Vercel):

```javascript
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All pages load without errors
- [ ] Console shows no warnings
- [ ] Firebase integration works (auth, db, storage)
- [ ] All links are absolute or relative (not localhost URLs)
- [ ] Remove test files (`test-*.html`)

### Performance
- [ ] Images optimized (compressed, properly sized)
- [ ] CSS/JS minified (optional but recommended)
- [ ] Lazy loading implemented for images
- [ ] Caching headers configured

### Security
- [ ] Firebase security rules deployed
- [ ] API keys not exposed in public repos
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Input validation in place

### SEO
- [ ] All pages have `<title>` tags
- [ ] Meta descriptions added
- [ ] Open Graph tags for social sharing
- [ ] Sitemap.xml created
- [ ] robots.txt configured

### Firebase
- [ ] Production Firebase project created
- [ ] Security rules deployed
- [ ] Indexes created
- [ ] Authorized domains configured
- [ ] Quota alerts set up

### Testing
- [ ] Test on mobile devices
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test auth flow (sign in, sign out)
- [ ] Test theory submission
- [ ] Test image upload
- [ ] Test public viewing (incognito)

---

## Post-Deployment

### 1. Monitor Performance

Use Firebase Console to monitor:
- Authentication usage
- Firestore read/write quotas
- Storage usage
- Hosting bandwidth

### 2. Set Up Analytics (Optional)

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Create Backup Strategy

**Firestore Backup:**
```bash
# Export data
gcloud firestore export gs://your-bucket/firestore-backup

# Schedule daily backups
# Use Cloud Scheduler + Cloud Functions
```

**Storage Backup:**
- Enable versioning in Firebase Console
- Use `gsutil` to download files periodically

### 4. Set Up Monitoring Alerts

See `MONITORING_GUIDE.md` for detailed instructions.

---

## Rollback Procedure

### Firebase Hosting

**View deployment history:**
```bash
firebase hosting:channel:list
```

**Rollback to previous version:**
```bash
firebase hosting:clone your-project:live your-project:previous-version
firebase hosting:channel:deploy live --only previous-version
```

Or use Firebase Console:
1. Go to **Hosting** → **Release history**
2. Find previous version
3. Click **"Restore"**

### Git-Based Deployments

```bash
# Revert to previous commit
git revert HEAD

# Push to trigger re-deploy
git push origin main
```

---

## Troubleshooting Deployment

### Firebase Hosting: "Authorization failed"

**Solution:**
```bash
firebase login --reauth
```

### GitHub Pages: 404 errors

**Solution:**
- Check GitHub Pages is enabled
- Verify correct branch is selected
- Ensure `index.html` exists at root

### Netlify: Build failed

**Solution:**
- Check build logs in Netlify dashboard
- Verify build command is correct
- Check for missing dependencies

### Custom domain not working

**Solution:**
- Wait for DNS propagation (up to 48 hours)
- Use `dig` or online DNS checker to verify records
- Clear browser cache
- Try incognito mode

### SSL certificate not provisioned

**Solution:**
- Ensure DNS is correctly configured
- Wait 15-30 minutes for auto-provisioning
- Check domain ownership verification

---

## Cost Estimation

### Firebase Free Tier (Spark Plan)

**Hosting:**
- 10 GB storage
- 360 MB/day bandwidth
- **Cost:** FREE

**Estimate:** ~5,000 page loads/month

**If exceeded:** Upgrade to Blaze plan (pay-as-you-go)

### Paid Tier (Blaze Plan)

**Hosting:**
- $0.026/GB storage/month
- $0.15/GB bandwidth

**Firestore:**
- $0.18/GB storage/month
- $0.06 per 100K reads
- $0.18 per 100K writes

**Storage:**
- $0.026/GB storage/month
- $0.12/GB downloaded

**Example costs for 10,000 page loads/month:**
- Bandwidth: ~2GB × $0.15 = $0.30
- Firestore reads: ~200K × $0.06 = $0.12
- **Total: ~$0.50/month**

### Other Platforms

**GitHub Pages:** FREE (always)
**Netlify Free:** 100GB bandwidth/month
**Vercel Free:** 100GB bandwidth/month
**Custom Server:** $5-10/month (VPS)

---

## Next Steps

1. **Choose deployment platform** (Firebase Hosting recommended)
2. **Deploy to staging first** (test before production)
3. **Set up monitoring** (see `MONITORING_GUIDE.md`)
4. **Configure custom domain** (optional)
5. **Enable analytics** (track usage)
6. **Create backup strategy** (protect data)

---

**Deployment Complete!** Your site is now live and accessible worldwide.

For ongoing maintenance, see:
- `MONITORING_GUIDE.md` - Track usage and performance
- `API_REFERENCE.md` - Firebase API documentation
- `FIREBASE_SETUP_GUIDE.md` - Firebase configuration reference

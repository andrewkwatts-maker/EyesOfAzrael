# Deployment Instructions - Eyes of Azrael

**Production deployment guide for Phase 6 completion.**

---

## ⚡ Quick Deploy

```bash
# One command deployment
firebase deploy --only hosting
```

---

## 📋 Pre-Deployment Checklist

### 1. Create App Icons
```bash
# You need to create these icon files:
# Place in /icons/ directory:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

# Tip: Use an online tool like realfavicongenerator.net
# or create from your logo with imagemagick:
convert logo.png -resize 512x512 icons/icon-512x512.png
convert logo.png -resize 192x192 icons/icon-192x192.png
# etc...
```

### 2. Verify Firebase Configuration
```bash
# Check Firebase project is set
firebase projects:list
firebase use eyesofazrael  # or your project ID

# Verify hosting configuration
firebase hosting:sites:list
```

### 3. Test Locally
```bash
# Build and serve locally
firebase emulators:start

# Or just serve hosting
firebase serve

# Open http://localhost:5000
# Test:
# - Homepage loads
# - Service worker registers
# - Error pages (404, 500)
# - Offline mode
```

### 4. Run Lighthouse Audit
```bash
# Install Lighthouse (if not already)
npm install -g lighthouse

# Run audit on local server
lighthouse http://localhost:5000 --view

# Check scores:
# - Performance: 95+
# - Accessibility: 100
# - Best Practices: 100
# - SEO: 100
```

### 5. Validate Files
```bash
# Check all files exist
ls manifest.json
ls service-worker.js
ls 404.html
ls 500.html
ls offline.html
ls robots.txt
ls js/seo-manager.js
ls js/sitemap-generator.js
ls js/image-optimizer.js
ls js/toast-notifications.js
ls css/accessibility.css
ls css/ui-components.css
```

---

## 🚀 Deployment Steps

### Step 1: Preview Deployment (Recommended)
```bash
# Create preview channel
firebase hosting:channel:deploy preview

# You'll get a URL like:
# https://eyesofazrael--preview-abc123.web.app

# Test thoroughly on the preview URL
# - Click through all pages
# - Test offline mode
# - Check mobile view
# - Verify error pages
# - Test PWA installation
```

### Step 2: Production Deployment
```bash
# Deploy to production
firebase deploy --only hosting

# With deployment message
firebase deploy --only hosting -m "Phase 6: Production polish complete"

# You should see:
# ✔ hosting: release complete
# Hosting URL: https://eyesofazrael.web.app
```

### Step 3: Verify Deployment
```bash
# Check deployment status
firebase hosting:deployments:list

# Visit your site
# https://eyesofazrael.web.app
# or your custom domain
```

---

## 🔍 Post-Deployment Verification

### 1. Test Service Worker
```javascript
// Open browser console on your site
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers:', registrations.length);
});

// Should show 1 active service worker
```

### 2. Test Offline Mode
```
1. Open site in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Select "Offline" from throttling dropdown
5. Refresh page
6. Should see offline.html page
```

### 3. Test Error Pages
```
# 404 Page
https://eyesofazrael.web.app/nonexistent-page

# Should show beautiful 404 page with:
- Eye icon
- "404" in large text
- Search box
- Quick links
- Particle animation
```

### 4. Test PWA Installation
```
Desktop Chrome:
1. Look for install icon in address bar
2. Click to install
3. App should open in standalone window

Mobile:
1. Open site
2. Tap "Add to Home Screen" (menu)
3. App should install
4. Launch from home screen
```

### 5. Verify SEO
```bash
# Check meta tags
curl -s https://eyesofazrael.web.app | grep "meta"

# Should see:
# - description meta tag
# - og:title, og:description, og:image
# - twitter:card, twitter:title
```

### 6. Check robots.txt
```
https://eyesofazrael.web.app/robots.txt

# Should show:
# - User-agent rules
# - Sitemap references
# - Disallow rules
```

### 7. Run Production Lighthouse
```bash
# Test live site
lighthouse https://eyesofazrael.web.app --view

# Desktop test
lighthouse https://eyesofazrael.web.app --preset=desktop --view

# Mobile test
lighthouse https://eyesofazrael.web.app --preset=mobile --view

# Check all scores are 95+/100
```

---

## 🗺️ Sitemap Submission

### Generate Sitemap
```javascript
// Run in browser console on your site
const gen = new SitemapGenerator();
gen.downloadSitemap();

// Or use admin page if you created one
```

### Submit to Google
```
1. Go to Google Search Console
   https://search.google.com/search-console

2. Add your property
   - Enter: https://eyesofazrael.web.app
   - Verify ownership

3. Submit sitemap
   - Sitemaps menu
   - Add new sitemap: https://eyesofazrael.web.app/sitemap.xml
   - Submit

4. Monitor
   - Check indexing status
   - View coverage reports
```

### Submit to Bing
```
1. Go to Bing Webmaster Tools
   https://www.bing.com/webmasters

2. Add your site
3. Submit sitemap URL
4. Monitor indexing
```

---

## 📊 Analytics Setup

### Google Analytics 4
```javascript
// Add to <head> in index.html

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Firebase Analytics
```javascript
// Already integrated with Firebase SDK
// Enable in Firebase Console:
// Analytics > Dashboard > Enable
```

### Firebase Performance
```javascript
// Add to Firebase SDK includes
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-performance-compat.js"></script>

// Initialize
const perf = firebase.performance();
```

---

## 🔐 Security Verification

### SSL Certificate
```bash
# Verify HTTPS
curl -I https://eyesofazrael.web.app

# Should show:
# HTTP/2 200
# strict-transport-security header
```

### Security Headers
```bash
# Check headers
curl -I https://eyesofazrael.web.app

# Should include:
# - content-security-policy
# - x-content-type-options: nosniff
# - x-frame-options: DENY
# - x-xss-protection: 1; mode=block
# - strict-transport-security
```

### Firestore Rules
```bash
# View current rules
firebase firestore:rules:get

# Deploy rules if updated
firebase deploy --only firestore:rules
```

---

## 🎯 Custom Domain (Optional)

### Setup Custom Domain
```bash
# Add domain in Firebase Console
# Hosting > Add custom domain

# Add these DNS records:
# A record: 151.101.1.195
# A record: 151.101.65.195
# Or use provided values

# Wait for SSL certificate (can take 24-48 hours)
```

### Update URLs
```javascript
// Update in js/seo-manager.js
this.siteData = {
    url: 'https://eyesofazrael.com',  // Your custom domain
    // ...
};

// Redeploy
firebase deploy --only hosting
```

---

## 📱 PWA Verification

### Chrome DevTools
```
1. Open site
2. F12 > Application tab
3. Check:
   - Manifest loaded ✓
   - Service Worker active ✓
   - All icons load ✓
   - Cache Storage populated ✓
```

### PWA Builder Check
```
https://www.pwabuilder.com/

Enter your URL
Review PWA score
Check manifest
Test on devices
```

---

## 🐛 Troubleshooting

### Service Worker Not Registering
```javascript
// Check for errors in console
// Unregister old workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
        registration.unregister();
    });
});

// Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)
// Clear cache and reload
```

### 404 Page Not Showing
```bash
# Check firebase.json has rewrites
# Should have:
"rewrites": [{
    "source": "**",
    "destination": "/index.html"
}]

# But 404.html should load for actual 404s
# Test by going to /test-404-page
```

### Manifest Not Loading
```
Check:
1. File exists at /manifest.json
2. <link rel="manifest" href="/manifest.json"> in HTML
3. All icon files exist in /icons/
4. manifest.json is valid JSON
5. No CORS errors in console
```

### Slow Performance
```
1. Run Lighthouse audit
2. Check network tab for slow resources
3. Verify service worker caching
4. Check Firebase hosting cache headers
5. Optimize large images
6. Review Firestore query efficiency
```

---

## 📈 Monitoring

### Key Metrics to Track
```
1. Core Web Vitals
   - LCP: < 2.5s
   - FID: < 100ms
   - CLS: < 0.1

2. Page Load Time
   - Target: < 2s on 3G

3. Error Rates
   - Monitor 404 hits
   - Track 500 errors
   - Watch for console errors

4. Service Worker
   - Cache hit rate
   - Update frequency
   - Offline usage

5. PWA
   - Install rate
   - Engagement metrics
   - Retention rate
```

### Monitoring Tools
```
- Google Analytics (user behavior)
- Firebase Performance (loading speed)
- Firebase Crashlytics (errors)
- Google Search Console (SEO)
- Lighthouse CI (automated audits)
```

---

## ✅ Final Checklist

Before marking deployment complete:

- [ ] All icons created (72px-512px)
- [ ] Firebase hosting configured
- [ ] Local testing passed
- [ ] Lighthouse scores 95+/100
- [ ] Preview deployment tested
- [ ] Production deployed
- [ ] Service worker active
- [ ] Offline mode works
- [ ] Error pages accessible
- [ ] PWA installable
- [ ] SEO meta tags present
- [ ] robots.txt accessible
- [ ] Sitemap submitted to Google
- [ ] Analytics configured
- [ ] Security headers verified
- [ ] SSL certificate active
- [ ] Custom domain set (if applicable)
- [ ] Monitoring enabled

---

## 🎉 Deployment Complete!

Your site is now live at:
- **Firebase URL**: https://eyesofazrael.web.app
- **Custom Domain**: https://eyesofazrael.com (if configured)

**Status**: PRODUCTION ✅
**Performance**: Optimized ✅
**SEO**: Enhanced ✅
**Accessibility**: WCAG 2.1 AA ✅
**PWA**: Installable ✅

---

## 📞 Support

Issues during deployment?

1. Check Firebase Console logs
2. Review browser console errors
3. Check Firebase CLI version: `firebase --version`
4. Update if needed: `npm install -g firebase-tools`
5. Review error messages carefully
6. Check Firebase status: https://status.firebase.google.com/

---

**Deployment Guide - Eyes of Azrael**
**Version**: 1.0.0
**Date**: December 15, 2025
**Status**: Production Ready ✅

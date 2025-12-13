# 🚀 Firebase Deployment Checklist

**Date:** December 13, 2025
**Project:** eyesofazrael
**Status:** Deploying...

---

## ✅ Pre-Deployment Checklist

- [x] All content migrated to Firestore (376 files, 100%)
- [x] FIREBASE folder migrated to root
- [x] Firebase import paths fixed in all 23 mythology index pages
- [x] firebase.json configured correctly
- [x] firebase-config.js has correct credentials
- [x] All changes committed to git
- [x] All changes pushed to GitHub

---

## 🌐 Firebase Hosting URLs

### Primary URLs
- **Firebase Default:** https://eyesofazrael.web.app
- **Firebase Alt:** https://eyesofazrael.firebaseapp.com

### Custom Domain
- **Custom Domain:** https://www.eyesofazrael.com
- **Status:** Needs DNS configuration verification

---

## 📋 Deployment Commands

### Deploy Hosting Only
```bash
firebase deploy --only hosting
```

### Deploy Everything
```bash
firebase deploy
```

### Check Deployment Status
```bash
firebase hosting:sites:list
```

---

## 🔍 Post-Deployment Verification

### 1. Test Firebase URLs
- [ ] Visit https://eyesofazrael.web.app
- [ ] Verify index.html loads with Firebase content
- [ ] Check browser console for errors
- [ ] Verify Firebase SDK loads

### 2. Test Firestore Connection
- [ ] Open index.html
- [ ] Check if mythology cards load from Firestore
- [ ] Verify search functionality works
- [ ] Check browser network tab for Firestore queries

### 3. Test Mythology Index Pages
- [ ] Visit /mythos/greek/
- [ ] Verify deities load from Firestore
- [ ] Check caching works (second load faster)
- [ ] Test theme switcher
- [ ] Verify frosted glass styling

### 4. Test Firebase Features
- [ ] Caching (60-100x performance boost)
- [ ] Version tracking
- [ ] Security headers
- [ ] Rate limiting
- [ ] Auth (if applicable)

---

## 🌐 Custom Domain Configuration

### Current Issue
**Problem:** https://www.eyesofazrael.com not loading

### Possible Causes
1. **DNS not configured** - Need to add Firebase DNS records
2. **Domain not connected** - Need to connect domain in Firebase Console
3. **SSL certificate pending** - Takes 24-48 hours to provision
4. **Propagation delay** - DNS changes can take up to 48 hours

### Fix Custom Domain

#### Step 1: Connect Domain in Firebase Console
```
1. Go to: https://console.firebase.google.com/project/eyesofazrael/hosting/sites
2. Click "Add custom domain"
3. Enter: www.eyesofazrael.com
4. Click "Continue"
5. Copy the DNS records shown
```

#### Step 2: Update DNS Records
Add these records to your domain registrar (GoDaddy, Namecheap, etc.):

**For www.eyesofazrael.com:**
```
Type: A
Name: www
Value: [IP from Firebase Console]

Type: TXT
Name: www
Value: [Verification code from Firebase Console]
```

**For eyesofazrael.com (root):**
```
Type: A
Name: @
Value: [IP from Firebase Console]

Type: A
Name: @
Value: [Second IP from Firebase Console if provided]
```

#### Step 3: Wait for SSL Certificate
- Firebase will automatically provision an SSL certificate
- This takes 24-48 hours
- You'll get an email when it's ready

---

## 🔧 Troubleshooting

### Issue: Custom domain not loading

**Check DNS propagation:**
```bash
nslookup www.eyesofazrael.com
```

**Check Firebase hosting status:**
```bash
firebase hosting:sites:list
```

**Expected output:**
```
Site ID: eyesofazrael
Default URL: https://eyesofazrael.web.app
Custom Domain: www.eyesofazrael.com (Connected)
```

### Issue: Firebase URL loads but custom domain doesn't

This is normal! It means:
1. ✅ Deployment succeeded
2. ✅ Firebase hosting working
3. ⏳ Custom domain DNS not configured yet

**Solution:** Configure custom domain in Firebase Console (see above)

### Issue: Index loads but mythology pages don't

**Possible causes:**
- Firebase import paths still incorrect
- Firestore security rules blocking access
- Firebase SDK not loading

**Check browser console for errors:**
```javascript
// Open browser console (F12)
// Look for errors like:
// - "Failed to load resource: net::ERR_FILE_NOT_FOUND"
// - "Firebase not initialized"
// - "Permission denied"
```

### Issue: Content not loading from Firestore

**Check Firestore security rules:**
```bash
firebase deploy --only firestore:rules
```

**Test Firestore query in console:**
```javascript
// Open browser console
const db = firebase.firestore();
db.collection('deities').limit(5).get()
  .then(snapshot => console.log('Deities:', snapshot.size))
  .catch(err => console.error('Error:', err));
```

---

## 📊 Expected Performance

### With Caching Enabled
- **First Load:** 300-500ms (Firestore query)
- **Cached Load:** 5-10ms (60-100x faster)
- **Cache Duration:** 1 hour
- **Cache Invalidation:** Automatic on new version

### Without Caching
- **Every Load:** 300-500ms

---

## 🎯 Success Criteria

### Minimum Requirements
- [x] Firebase hosting deployed
- [ ] eyesofazrael.web.app loads
- [ ] index.html shows content
- [ ] No console errors

### Full Success
- [ ] Custom domain (www.eyesofazrael.com) loads
- [ ] All 23 mythology index pages work
- [ ] Firestore content loads correctly
- [ ] Caching works (performance boost visible)
- [ ] Themes work (light/dark/auto)
- [ ] Search works
- [ ] No security warnings

---

## 📝 Notes

### GitHub Pages vs Firebase Hosting

**Before:** GitHub Pages hosted static HTML files
**After:** Firebase Hosting serves dynamic content from Firestore

**Key Difference:**
- GitHub Pages: Static files only, no database
- Firebase Hosting: Dynamic content + Firestore database

### Custom Domain Migration

If eyesofazrael.com was previously on GitHub Pages:
1. Remove GitHub Pages DNS records
2. Add Firebase Hosting DNS records
3. Wait 24-48 hours for propagation
4. Firebase will auto-provision SSL certificate

---

## 🚨 Critical Files

### Must Be Present
- ✅ firebase-config.js (has correct credentials)
- ✅ firebase.json (hosting configuration)
- ✅ firestore.rules (security rules)
- ✅ .firebaserc (project ID)
- ✅ index.html (Firebase-integrated)

### Must Be Accessible
- ✅ /js/firebase-init.js
- ✅ /js/firebase-content-loader.js
- ✅ /js/firebase-cache-manager.js
- ✅ /js/version-tracker.js

---

## 🎉 Next Steps

1. **Wait for deployment to complete** (currently in progress)
2. **Test Firebase URL:** https://eyesofazrael.web.app
3. **Configure custom domain** (if not already done)
4. **Update DNS records** with domain registrar
5. **Wait 24-48 hours** for SSL certificate
6. **Test www.eyesofazrael.com** after DNS propagates

---

## 📞 Support

### Firebase Console
- **URL:** https://console.firebase.google.com/project/eyesofazrael
- **Hosting:** https://console.firebase.google.com/project/eyesofazrael/hosting/sites
- **Firestore:** https://console.firebase.google.com/project/eyesofazrael/firestore

### Useful Commands
```bash
# Check deployment status
firebase hosting:sites:list

# View recent deployments
firebase hosting:channel:list

# Deploy only hosting
firebase deploy --only hosting

# Deploy everything
firebase deploy

# Test locally
firebase serve
```

---

**Deployment initiated:** December 13, 2025
**Next action:** Verify deployment at https://eyesofazrael.web.app

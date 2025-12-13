# 🌐 Custom Domain Setup Guide - www.eyesofazrael.com

**Date:** December 13, 2025
**Issue:** `net::ERR_CERT_COMMON_NAME_INVALID` when accessing www.eyesofazrael.com
**Cause:** Custom domain not connected to Firebase Hosting
**Solution:** Follow this guide to connect your domain

---

## 🔍 Current Status

### ✅ What's Working
- **Firebase Default URL:** https://eyesofazrael.web.app ✅ LIVE
- **Firebase Alt URL:** https://eyesofazrael.firebaseapp.com ✅ LIVE
- **All content:** Deployed and accessible
- **Firebase integration:** Working correctly

### ❌ What's Not Working
- **Custom Domain:** https://www.eyesofazrael.com ❌ SSL ERROR
- **Root Domain:** https://eyesofazrael.com ❌ SSL ERROR

### 🎯 Goal
Connect www.eyesofazrael.com to Firebase Hosting with automatic SSL certificate.

---

## 📋 Step-by-Step Fix

### Step 1: Access Firebase Console

1. Go to: https://console.firebase.google.com/project/eyesofazrael/hosting/sites
2. Login with: andrewkwatts@gmail.com
3. You should see the "eyesofazrael" site

### Step 2: Add Custom Domain

1. Click **"Add custom domain"** button
2. Enter: `www.eyesofazrael.com`
3. Click **"Continue"**

### Step 3: Verify Ownership (TXT Record)

Firebase will show you a TXT record to add to your DNS:

```
Type: TXT
Name: @ (or root)
Value: [Verification code from Firebase]
TTL: 3600 (or Auto)
```

**Where to add this:**
- Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
- Find DNS settings
- Add the TXT record exactly as shown
- Save changes

**Wait 5-15 minutes for DNS propagation, then click "Verify" in Firebase Console**

### Step 4: Add A Records

After verification, Firebase will show you IP addresses to point your domain to:

```
Type: A
Name: www
Value: 151.101.1.195
TTL: 3600

Type: A
Name: www
Value: 151.101.65.195
TTL: 3600
```

**Note:** Firebase typically provides 2 IP addresses for redundancy. Add both.

**For root domain (optional):**
```
Type: A
Name: @ (or leave blank for root)
Value: 151.101.1.195
TTL: 3600

Type: A
Name: @ (or leave blank for root)
Value: 151.101.65.195
TTL: 3600
```

### Step 5: Wait for SSL Certificate

- Firebase will automatically provision an SSL certificate
- This takes **24-48 hours**
- You'll receive an email when it's ready
- Status will show "Connected" in Firebase Console

---

## 🔧 Alternative: Use Firebase URLs (Immediate Solution)

If you need the site working immediately, use the Firebase URLs:

### Update All Links To:
- **Primary:** https://eyesofazrael.web.app
- **Alt:** https://eyesofazrael.firebaseapp.com

These URLs:
- ✅ Have valid SSL certificates
- ✅ Work immediately
- ✅ Are free forever
- ✅ Support all Firebase features

### Update Repository Links:
```bash
# Update README if it references www.eyesofazrael.com
# Change to https://eyesofazrael.web.app
```

---

## 📊 DNS Configuration Examples

### Example 1: Cloudflare

```
Type    Name    Content             TTL     Proxy
TXT     @       firebase-verify...  Auto    DNS only
A       www     151.101.1.195       Auto    DNS only
A       www     151.101.65.195      Auto    DNS only
A       @       151.101.1.195       Auto    DNS only
A       @       151.101.65.195      Auto    DNS only
```

**Important:** Set Proxy to "DNS only" (gray cloud icon), not "Proxied" (orange cloud).

### Example 2: GoDaddy

```
Type    Name    Value               TTL
TXT     @       firebase-verify...  1 Hour
A       www     151.101.1.195       1 Hour
A       www     151.101.65.195      1 Hour
A       @       151.101.1.195       1 Hour
A       @       151.101.65.195      1 Hour
```

### Example 3: Namecheap

```
Type        Host    Value               TTL
TXT Record  @       firebase-verify...  Automatic
A Record    www     151.101.1.195       Automatic
A Record    www     151.101.65.195      Automatic
A Record    @       151.101.1.195       Automatic
A Record    @       151.101.65.195      Automatic
```

---

## 🕐 Timeline

### Immediate (0-5 minutes)
- ✅ Firebase URLs work: eyesofazrael.web.app
- ⏳ Custom domain shows SSL error

### After DNS Update (5-60 minutes)
- ⏳ DNS propagation in progress
- ⏳ TXT record verified
- ⏳ A records propagating

### After 1-24 hours
- ✅ DNS fully propagated worldwide
- ⏳ SSL certificate provisioning started

### After 24-48 hours
- ✅ SSL certificate issued
- ✅ Custom domain works: www.eyesofazrael.com
- ✅ HTTPS enabled automatically

---

## 🔍 Verification Commands

### Check DNS Propagation (Windows)
```bash
# Check TXT record
nslookup -type=TXT eyesofazrael.com

# Check A record for www
nslookup www.eyesofazrael.com

# Check A record for root
nslookup eyesofazrael.com
```

### Check DNS Propagation (Online)
- https://dnschecker.org - Check worldwide propagation
- https://www.whatsmydns.net - Check from multiple locations

### Expected Results After Setup
```bash
# TXT Record
eyesofazrael.com    TXT    "firebase-verify=ABC123..."

# A Records (www)
www.eyesofazrael.com    A    151.101.1.195
www.eyesofazrael.com    A    151.101.65.195

# A Records (root)
eyesofazrael.com    A    151.101.1.195
eyesofazrael.com    A    151.101.65.195
```

---

## ⚠️ Common Issues

### Issue 1: "Domain already in use"
**Cause:** Domain connected to another Firebase project or GitHub Pages
**Solution:**
1. Remove domain from old project/service
2. Wait 24 hours
3. Try adding to Firebase again

### Issue 2: TXT record not verifying
**Cause:** DNS not propagated yet
**Solution:**
1. Wait 15-30 minutes
2. Clear DNS cache: `ipconfig /flushdns` (Windows)
3. Try verification again

### Issue 3: SSL certificate stuck on "Pending"
**Cause:** Normal - certificate provisioning can take 24-48 hours
**Solution:** Wait and check email for confirmation

### Issue 4: Mixed content warnings
**Cause:** HTTP resources loaded on HTTPS page
**Solution:** Update all resource URLs to HTTPS

---

## 🚀 Quick Start (Fastest Path to Working Site)

### Option A: Use Firebase URLs (Works Immediately)

**No DNS changes needed. Works in 0 minutes.**

1. Share this URL: https://eyesofazrael.web.app
2. Update social media links
3. Update README/documentation
4. Site is live and working NOW

### Option B: Setup Custom Domain (Takes 24-48 hours)

**Requires DNS changes. Full setup in 1-2 days.**

1. Follow Steps 1-5 above
2. Wait for SSL certificate
3. Site works at www.eyesofazrael.com in 24-48 hours

---

## 📝 Recommended Actions

### Immediate (Do Now)
1. ✅ Use Firebase URL: https://eyesofazrael.web.app
2. ✅ Test all features work on Firebase URL
3. ✅ Update any external links to Firebase URL

### This Week (When You Have Time)
1. ⏭️ Add custom domain in Firebase Console
2. ⏭️ Update DNS records
3. ⏭️ Wait for SSL certificate
4. ⏭️ Test custom domain when ready

---

## 🎯 Current Live URLs

### ✅ Working URLs (Use These Now)
- **Main:** https://eyesofazrael.web.app
- **Alt:** https://eyesofazrael.firebaseapp.com
- **Example:** https://eyesofazrael.web.app/example-editable-deity-page.html
- **Greek:** https://eyesofazrael.web.app/mythos/greek/
- **Norse:** https://eyesofazrael.web.app/mythos/norse/

### ⏳ Not Working Yet (Needs DNS Setup)
- **Custom:** https://www.eyesofazrael.com
- **Root:** https://eyesofazrael.com

---

## 📞 Support Resources

### Firebase Documentation
- **Custom Domain Setup:** https://firebase.google.com/docs/hosting/custom-domain
- **Troubleshooting:** https://firebase.google.com/docs/hosting/troubleshooting

### Firebase Console
- **Hosting Dashboard:** https://console.firebase.google.com/project/eyesofazrael/hosting/sites
- **Custom Domains:** https://console.firebase.google.com/project/eyesofazrael/hosting/sites (click site → Domains tab)

### DNS Registrars
- **GoDaddy DNS:** https://dcc.godaddy.com/manage/dns
- **Namecheap DNS:** https://ap.www.namecheap.com/domains/list/
- **Cloudflare DNS:** https://dash.cloudflare.com

---

## ✅ Success Checklist

### Pre-Setup
- [x] Firebase project created
- [x] Site deployed to Firebase Hosting
- [x] Content accessible at eyesofazrael.web.app

### DNS Configuration
- [ ] Custom domain added in Firebase Console
- [ ] TXT record added to DNS
- [ ] TXT record verified
- [ ] A records added to DNS
- [ ] DNS propagation complete (check with nslookup)

### SSL Certificate
- [ ] SSL certificate provisioning started
- [ ] Received email confirmation
- [ ] Custom domain shows "Connected" in Firebase Console
- [ ] Site accessible at www.eyesofazrael.com with HTTPS

### Testing
- [ ] HTTPS works (green padlock in browser)
- [ ] No SSL errors
- [ ] All pages load correctly
- [ ] Firebase features work
- [ ] Redirects work (http → https, root → www)

---

## 🎉 Summary

### The Problem
- www.eyesofazrael.com shows SSL error because custom domain not connected

### The Solution
1. **Immediate:** Use https://eyesofazrael.web.app (works now)
2. **Long-term:** Setup custom domain (takes 24-48 hours)

### Current Status
- ✅ Firebase URLs working perfectly
- ⏳ Custom domain needs DNS configuration
- ✅ All content deployed and accessible
- ✅ No code changes needed

**Your site is LIVE and working at: https://eyesofazrael.web.app**

---

**Last Updated:** December 13, 2025
**Status:** Firebase URLs working, custom domain pending DNS setup

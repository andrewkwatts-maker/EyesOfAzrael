# 🔧 Squarespace DNS Configuration for GitHub Pages

**Domain:** eyesofazrael.com
**Current Issue:** `net::ERR_CERT_COMMON_NAME_INVALID`
**Managed By:** Squarespace
**Target:** GitHub Pages

---

## 🎯 The Problem

Your domain is managed by Squarespace, but the current DNS records are incorrect for GitHub Pages.

**Current (Wrong):**
```
_domainconnect → _domainconnect.domains.squarespace.com
```

**Needed for GitHub Pages:**
```
www → andrewkwatts-maker.github.io
@ → GitHub Pages A records (4 IPs)
```

---

## ✅ Complete Fix for Squarespace DNS

### Step 1: Access Squarespace DNS Settings

1. Go to: https://account.squarespace.com/domains/managed/eyesofazrael.com/dns/dns-settings
2. You should see the DNS management page

### Step 2: Add CNAME Record for www

**Click "Add Record" and enter:**
```
Type: CNAME
Host: www
Data: andrewkwatts-maker.github.io
TTL: 3600 (or 1 hour)
```

**This makes www.eyesofazrael.com point to your GitHub Pages site.**

### Step 3: Add A Records for Root Domain

**Click "Add Record" 4 times and add these A records:**

**Record 1:**
```
Type: A
Host: @ (or leave blank for root)
Data: 185.199.108.153
TTL: 3600
```

**Record 2:**
```
Type: A
Host: @ (or leave blank for root)
Data: 185.199.109.153
TTL: 3600
```

**Record 3:**
```
Type: A
Host: @ (or leave blank for root)
Data: 185.199.110.153
TTL: 3600
```

**Record 4:**
```
Type: A
Host: @ (or leave blank for root)
Data: 185.199.111.153
TTL: 3600
```

**This makes eyesofazrael.com (root) point to GitHub Pages.**

### Step 4: Remove Old Records (Optional)

If there are conflicting records, remove:
- Old A records pointing to other IPs
- CNAME records for @ or www pointing elsewhere
- The `_domainconnect` record is fine to keep

### Step 5: Save Changes

Click **"Save"** or **"Apply Changes"** in Squarespace DNS settings.

---

## 📊 Final DNS Configuration Should Look Like:

```
TYPE    HOST    DATA                            TTL
CNAME   www     andrewkwatts-maker.github.io    3600
A       @       185.199.108.153                 3600
A       @       185.199.109.153                 3600
A       @       185.199.110.153                 3600
A       @       185.199.111.153                 3600
CNAME   _domainconnect  _domainconnect.domains.squarespace.com  (keep this)
```

---

## 🕐 Timeline

### After Saving DNS Changes (5-60 minutes)
- DNS propagation begins
- Changes spread worldwide

### After DNS Propagates (30-60 minutes)
- Test with: `nslookup www.eyesofazrael.com`
- Should return: `andrewkwatts-maker.github.io`

### After GitHub Detects DNS (1-24 hours)
- GitHub Pages provisions SSL certificate
- Site becomes accessible with HTTPS

---

## 🔍 Verify DNS Configuration

### Windows Command Prompt
```bash
# Check www subdomain
nslookup www.eyesofazrael.com

# Expected output:
# www.eyesofazrael.com
# canonical name = andrewkwatts-maker.github.io

# Check root domain
nslookup eyesofazrael.com

# Expected output:
# Non-authoritative answer:
# Name:    eyesofazrael.com
# Addresses:  185.199.108.153
#             185.199.109.153
#             185.199.110.153
#             185.199.111.153
```

### Online DNS Checker
- **Global Check:** https://dnschecker.org
- **Multiple Locations:** https://www.whatsmydns.net

Enter: `www.eyesofazrael.com`
Type: `CNAME`
Should show: `andrewkwatts-maker.github.io`

---

## ⚙️ GitHub Pages Configuration

### Step 1: Enable GitHub Pages

1. Go to: https://github.com/andrewkwatts-maker/EyesOfAzrael/settings/pages
2. Under "Source":
   - Branch: **main**
   - Folder: **/ (root)**
3. Click **"Save"**

### Step 2: Add Custom Domain

1. Under "Custom domain":
   - Enter: `www.eyesofazrael.com`
2. Click **"Save"**
3. Wait for DNS check (may take a few minutes)

### Step 3: Enable HTTPS

1. Once DNS check passes (green checkmark)
2. Check the box: ☑ **"Enforce HTTPS"**
3. GitHub will provision SSL certificate automatically

**Note:** SSL certificate provisioning can take up to 24 hours.

---

## 🚨 Important: Squarespace-Specific Notes

### Domain Connection Feature
The `_domainconnect` CNAME is for Squarespace's automatic domain connection. You can keep it, it won't interfere with GitHub Pages.

### Squarespace Site Settings
If you were using this domain with a Squarespace website:
1. Go to your Squarespace site settings
2. Disconnect the custom domain from Squarespace
3. This prevents conflicts

### DNS Propagation
Squarespace DNS changes typically propagate in 15-30 minutes, but can take up to 48 hours.

---

## 🎯 Quick Reference: Required DNS Records

### Minimum Setup (www only)
```
CNAME   www   andrewkwatts-maker.github.io
```

### Full Setup (www + root domain redirect)
```
CNAME   www   andrewkwatts-maker.github.io
A       @     185.199.108.153
A       @     185.199.109.153
A       @     185.199.110.153
A       @     185.199.111.153
```

---

## ⚠️ Common Squarespace DNS Issues

### Issue 1: "CNAME already exists"
**Cause:** Another CNAME record for www exists
**Solution:** Delete the old CNAME record first, then add the new one

### Issue 2: "Domain is connected to another service"
**Cause:** Domain still connected to a Squarespace site
**Solution:** Disconnect domain from Squarespace site settings

### Issue 3: Changes not taking effect
**Cause:** DNS cache or propagation delay
**Solution:**
```bash
# Clear DNS cache (Windows)
ipconfig /flushdns

# Wait 15-30 minutes and try again
```

### Issue 4: GitHub says "DNS check failed"
**Cause:** DNS not propagated yet, or records incorrect
**Solution:**
1. Verify records with `nslookup`
2. Wait longer (up to 24 hours)
3. Remove and re-add custom domain in GitHub

---

## 📝 Step-by-Step Checklist

### Squarespace DNS (Do This First)
- [ ] Login to Squarespace account
- [ ] Go to DNS settings for eyesofazrael.com
- [ ] Add CNAME: www → andrewkwatts-maker.github.io
- [ ] Add 4 A records: @ → GitHub IPs
- [ ] Save changes
- [ ] Wait 15-30 minutes

### DNS Verification
- [ ] Run: `nslookup www.eyesofazrael.com`
- [ ] Check: Returns andrewkwatts-maker.github.io
- [ ] Use dnschecker.org to verify worldwide propagation

### GitHub Pages Configuration
- [ ] Go to repository Settings → Pages
- [ ] Enable GitHub Pages (main branch, root folder)
- [ ] Add custom domain: www.eyesofazrael.com
- [ ] Wait for DNS check to pass
- [ ] Enable "Enforce HTTPS"

### SSL Certificate
- [ ] Wait for GitHub to provision certificate (up to 24 hours)
- [ ] Check: https://www.eyesofazrael.com
- [ ] Verify: Green padlock appears
- [ ] Test: All pages load correctly

---

## 🌐 Alternative: Use Squarespace Forwarding (Quick Fix)

If you want an immediate solution while DNS propagates:

### Option 1: Domain Forwarding
1. In Squarespace domain settings
2. Set up domain forwarding
3. Forward www.eyesofazrael.com to: https://andrewkwatts-maker.github.io/EyesOfAzrael/

**Pros:** Works immediately
**Cons:** URL changes in browser, not ideal for SEO

### Option 2: Use GitHub Default URL
Just use: https://andrewkwatts-maker.github.io/EyesOfAzrael/

**Pros:** Works now, no DNS changes needed
**Cons:** Longer URL

---

## 📞 Support Resources

### Squarespace DNS Documentation
- **Custom DNS:** https://support.squarespace.com/hc/en-us/articles/360002101888-Advanced-DNS-settings
- **CNAME Records:** https://support.squarespace.com/hc/en-us/articles/205812378-Using-a-custom-domain-with-your-Squarespace-site

### GitHub Pages Documentation
- **Custom Domain:** https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- **Troubleshooting:** https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages

### Squarespace Support
- **Help Center:** https://support.squarespace.com
- **Contact:** Use live chat in account dashboard

---

## ✅ Expected Result

### Before Fix
```
https://www.eyesofazrael.com
❌ net::ERR_CERT_COMMON_NAME_INVALID
```

### After Fix (24-48 hours)
```
https://www.eyesofazrael.com
✅ Your connection is secure
✅ Valid SSL certificate
✅ Site loads correctly
✅ All features working
```

---

## 🎯 Summary

### What You Need to Do:

1. **In Squarespace DNS:**
   - Add CNAME: `www` → `andrewkwatts-maker.github.io`
   - Add 4 A records: `@` → GitHub IPs (185.199.108-111.153)

2. **In GitHub Pages Settings:**
   - Enable GitHub Pages
   - Add custom domain: `www.eyesofazrael.com`
   - Enable "Enforce HTTPS"

3. **Wait:**
   - DNS propagation: 15-60 minutes
   - SSL certificate: 1-24 hours

### Current Status:
- ✅ All code pushed to GitHub
- ⏳ DNS needs Squarespace configuration
- ⏳ GitHub Pages needs manual enable
- ⏳ SSL certificate will auto-provision

---

**Last Updated:** December 13, 2025
**Domain Registrar:** Squarespace
**Target:** GitHub Pages
**Action Required:** Update DNS records in Squarespace

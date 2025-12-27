# Monitoring and Maintenance Guide

## Overview

This guide covers monitoring, optimization, and ongoing maintenance for your Firebase-powered Eyes of Azrael website. Proper monitoring helps you:

- Stay within free tier limits
- Optimize performance and costs
- Identify and fix issues quickly
- Ensure great user experience
- Plan for scaling

---

## Table of Contents

1. [Firebase Console Overview](#firebase-console-overview)
2. [Setting Up Alerts](#setting-up-alerts)
3. [Monitoring Usage](#monitoring-usage)
4. [Optimization Tips](#optimization-tips)
5. [Troubleshooting Common Issues](#troubleshooting-common-issues)
6. [Backup Strategy](#backup-strategy)
7. [Security Monitoring](#security-monitoring)
8. [Performance Monitoring](#performance-monitoring)

---

## Firebase Console Overview

### Accessing the Console

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project: "Eyes of Azrael"
3. Navigate using the left sidebar

### Key Dashboard Sections

#### 1. Project Overview
**Path:** Home (top of sidebar)

**What to monitor:**
- Quick health check of all services
- Recent activities
- Project settings access

**Action items:**
- Check daily for anomalies
- Review recent deployments
- Monitor error spikes

#### 2. Authentication
**Path:** Build → Authentication

**Usage tab shows:**
- Daily/monthly active users
- Sign-in methods usage
- User growth over time

**What to monitor:**
- Daily active users trend
- Failed sign-in attempts (potential security issue)
- New user registrations

**[Screenshot: Authentication usage dashboard]**

#### 3. Firestore Database
**Path:** Build → Firestore Database

**Usage tab shows:**
- Document reads/writes/deletes per day
- Storage used
- Network bandwidth

**What to monitor:**
- **Reads:** Should be < 50,000/day (free tier)
- **Writes:** Should be < 20,000/day (free tier)
- **Storage:** Should be < 1GB (free tier)

**[Screenshot: Firestore usage dashboard with graphs]**

**Key metrics:**
```
Daily Reads:     15,234 / 50,000  (30% used)  ✓ Healthy
Daily Writes:     2,156 / 20,000  (11% used)  ✓ Healthy
Storage:          234MB / 1GB     (23% used)  ✓ Healthy
```

#### 4. Storage
**Path:** Build → Storage

**Usage tab shows:**
- Total storage used
- Daily downloads (bandwidth)
- Upload/download operations

**What to monitor:**
- **Storage:** Should be < 5GB (free tier)
- **Downloads:** Should be < 1GB/day (free tier)
- **Operations:** Should be < 20,000/day (free tier)

**[Screenshot: Storage usage dashboard]**

#### 5. Hosting
**Path:** Build → Hosting

**Usage tab shows:**
- Bandwidth used per month
- Storage used
- Request count

**What to monitor:**
- **Bandwidth:** Should be < 10GB/month (free tier)
- **Requests:** Unlimited on free tier
- **Build time:** For deployment efficiency

---

## Setting Up Alerts

### Enable Budget Alerts

Prevent unexpected charges by setting up quota alerts.

#### Step 1: Upgrade to Blaze Plan (Optional but Recommended)

**Note:** You can stay on free tier and get alerted when approaching limits.

1. Go to **Spark Plan** (top left, near project name)
2. Click **"Modify"** or **"Upgrade"**
3. Select **"Blaze Plan"** (pay-as-you-go)
4. Set spending limit: **$0** (stays free unless you change)
5. Click **"Purchase"**

**Why upgrade to Blaze with $0 limit?**
- Enables alerts
- No charges unless you raise limit
- More control over usage

#### Step 2: Set Up Firestore Alerts

1. Go to **Firestore Database** → **Usage**
2. Click **"Set alert"** (or go to Cloud Console)
3. In Google Cloud Console:
   - Navigate to **Monitoring** → **Alerting**
   - Click **"Create Policy"**
4. Configure alert:

**Alert for Firestore Reads:**
```
Metric: firestore.googleapis.com/document/read_count
Condition: Above 40,000 per day (80% of free tier)
Notification: Email to your address
```

**Alert for Firestore Writes:**
```
Metric: firestore.googleapis.com/document/write_count
Condition: Above 16,000 per day (80% of free tier)
Notification: Email to your address
```

**Alert for Storage:**
```
Metric: storage.googleapis.com/network/sent_bytes_count
Condition: Above 800MB per day (80% of free tier)
Notification: Email to your address
```

#### Step 3: Email Notifications

1. In Cloud Console → **Monitoring** → **Alerting**
2. Click **"Edit Notification Channels"**
3. Add email address
4. Verify email (check inbox for verification)

**You'll receive alerts when:**
- Approaching 80% of daily quota
- Quota exceeded
- Service errors detected
- Unusual traffic spikes

### Firebase App Check (Optional)

Protect against abuse and quota exhaustion.

1. Go to **Build** → **App Check**
2. Click **"Get started"**
3. Select **reCAPTCHA v3** or **reCAPTCHA Enterprise**
4. Register site with reCAPTCHA
5. Add App Check SDK to your site

**Benefits:**
- Blocks bots and scrapers
- Prevents quota abuse
- Reduces unauthorized access

---

## Monitoring Usage

### Daily Monitoring Routine

**Quick Check (2 minutes/day):**

1. **Authentication:**
   - Any failed sign-in spikes?
   - User growth normal?

2. **Firestore:**
   - Read/write counts within limits?
   - Any slow queries?

3. **Storage:**
   - Download bandwidth normal?
   - Storage growing as expected?

4. **Errors:**
   - Check Console logs for errors
   - Review recent activities

### Weekly Monitoring Routine

**Deeper Analysis (15 minutes/week):**

1. **Trends:**
   - User growth rate
   - Content creation rate
   - Engagement metrics (votes, comments)

2. **Performance:**
   - Page load times
   - Query performance
   - Image load times

3. **Costs:**
   - Project free tier usage
   - Approaching any limits?
   - Optimization opportunities?

4. **Security:**
   - Review security rules
   - Check for suspicious activity
   - Update security rules if needed

### Monthly Monitoring Routine

**Strategic Review (30 minutes/month):**

1. **Growth:**
   - User growth trends
   - Content growth trends
   - Storage growth projection

2. **Optimization:**
   - Identify bottlenecks
   - Implement caching strategies
   - Optimize expensive queries

3. **Planning:**
   - Will you exceed free tier next month?
   - Need to upgrade to Blaze plan?
   - Budget planning if scaling

4. **Backups:**
   - Export Firestore data
   - Verify backup integrity
   - Test restore process

---

## Optimization Tips

### Reduce Firestore Reads

**Problem:** Each page load reads from Firestore, quickly consuming quota.

**Solutions:**

#### 1. Implement Client-Side Caching

```javascript
// Cache theories in memory for 5 minutes
class TheoryCache {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }
}

const theoryCache = new TheoryCache();

async function getCachedTheory(id) {
  // Check cache first
  const cached = theoryCache.get(id);
  if (cached) {
    console.log('Cache hit!');
    return cached;
  }

  // Cache miss - fetch from Firestore
  console.log('Cache miss - fetching from Firestore');
  const result = await window.firebaseDB.getTheory(id);

  if (result.success) {
    theoryCache.set(id, result.theory);
  }

  return result.theory;
}
```

**Impact:** Reduces reads by 80-90% for repeat visitors.

#### 2. Use localStorage for Browse Page

```javascript
// Cache browse results in localStorage
const CACHE_KEY = 'theories_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getCachedTheories(filters) {
  const cacheKey = CACHE_KEY + JSON.stringify(filters);
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const { theories, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      console.log('Using cached theories');
      return theories;
    }
  }

  // Fetch fresh data
  const result = await window.firebaseDB.getAllTheories(filters);

  if (result.success) {
    localStorage.setItem(cacheKey, JSON.stringify({
      theories: result.theories,
      timestamp: Date.now()
    }));
  }

  return result.theories;
}
```

**Impact:** Reduces browse page reads by 90%.

#### 3. Paginate Results

```javascript
// Load 20 theories at a time instead of all
const THEORIES_PER_PAGE = 20;

async function loadTheoriesPage(pageNum = 0) {
  const result = await window.firebaseDB.getAllTheories({
    limit: THEORIES_PER_PAGE,
    startAfter: pageNum > 0 ? lastDocSnapshot : null
  });

  displayTheories(result.theories);
}

// Add "Load More" button instead of loading everything
document.getElementById('load-more-btn').onclick = () => {
  currentPage++;
  loadTheoriesPage(currentPage);
};
```

**Impact:** Reduces initial page reads by 80%.

#### 4. Use Firestore Offline Persistence

```javascript
// Enable offline persistence
firebase.firestore().enablePersistence()
  .then(() => {
    console.log('Offline persistence enabled');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported in this browser');
    }
  });
```

**Impact:** Data cached locally, reduces reads on repeat visits.

### Optimize Images (Reduce Storage & Bandwidth)

**Problem:** Large images consume storage and bandwidth quickly.

**Solutions:**

#### 1. Compress Images Before Upload

```javascript
async function compressAndUpload(file, theoryId) {
  // Compress image to under 1MB
  const compressed = await compressImage(file, 1);

  // Upload compressed version
  const result = await window.firebaseStorage.uploadImage(compressed, theoryId);

  return result;
}

async function compressImage(file, maxSizeMB) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      // Calculate resize ratio
      const targetSize = maxSizeMB * 1024 * 1024;
      const ratio = file.size > targetSize ? Math.sqrt(targetSize / file.size) : 1;

      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw resized image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85); // 85% quality
    };

    img.src = URL.createObjectURL(file);
  });
}
```

**Impact:** Reduces storage by 70-80%, bandwidth by similar amount.

#### 2. Lazy Load Images

```html
<!-- Use loading="lazy" attribute -->
<img src="theory-image.jpg" loading="lazy" alt="Theory illustration">
```

```javascript
// Or use Intersection Observer for more control
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.add('loaded');
      imageObserver.unobserve(img);
    }
  });
}, {
  rootMargin: '50px' // Start loading 50px before visible
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

**Impact:** Reduces initial bandwidth by 60-70%.

#### 3. Generate Thumbnails

For browse page, use smaller thumbnail versions:

```javascript
// Create thumbnail when uploading
async function uploadWithThumbnail(file, theoryId) {
  // Upload full-size image
  const fullSize = await window.firebaseStorage.uploadImage(file, theoryId);

  // Create and upload thumbnail (300px width)
  const thumbnail = await createThumbnail(file, 300);
  const thumbResult = await window.firebaseStorage.uploadImage(
    thumbnail,
    theoryId,
    null,
    'thumb_' + file.name
  );

  return {
    fullSize: fullSize.url,
    thumbnail: thumbResult.url
  };
}

async function createThumbnail(file, maxWidth) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(new File([blob], 'thumb_' + file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.8);
    };

    img.src = URL.createObjectURL(file);
  });
}
```

**Impact:** Reduces browse page bandwidth by 90%.

### Optimize Queries

**Problem:** Complex queries consume more reads.

**Solutions:**

#### 1. Use Indexes for Common Queries

Create indexes for frequently used queries:

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "theories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "theories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "topic", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

#### 2. Denormalize Data

Instead of:
```javascript
// Multiple reads for author info
const theory = await getTheory(id);
const author = await getUser(theory.authorId);
```

Store author info in theory:
```javascript
// Single read
const theory = await getTheory(id);
// theory.authorName, theory.authorAvatar already included
```

**Impact:** Reduces reads by 50% on view pages.

### Implement Rate Limiting

Prevent abuse by limiting actions:

```javascript
// Rate limit theory submissions (max 1 per hour per user)
class RateLimiter {
  constructor(maxActions, windowMs) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
    this.actions = new Map();
  }

  canPerformAction(userId) {
    const now = Date.now();
    const userActions = this.actions.get(userId) || [];

    // Remove old actions outside window
    const recentActions = userActions.filter(timestamp =>
      now - timestamp < this.windowMs
    );

    if (recentActions.length >= this.maxActions) {
      return false;
    }

    recentActions.push(now);
    this.actions.set(userId, recentActions);
    return true;
  }

  getTimeUntilNextAction(userId) {
    const now = Date.now();
    const userActions = this.actions.get(userId) || [];

    if (userActions.length === 0) return 0;

    const oldestAction = Math.min(...userActions);
    const timeLeft = this.windowMs - (now - oldestAction);

    return Math.max(0, timeLeft);
  }
}

// Usage
const theorySubmissionLimiter = new RateLimiter(1, 60 * 60 * 1000); // 1 per hour

async function submitTheory(data) {
  const user = window.firebaseAuth.getCurrentUser();

  if (!theorySubmissionLimiter.canPerformAction(user.uid)) {
    const minutesLeft = Math.ceil(
      theorySubmissionLimiter.getTimeUntilNextAction(user.uid) / 1000 / 60
    );
    alert(`Please wait ${minutesLeft} minutes before submitting another theory`);
    return;
  }

  // Proceed with submission
  const result = await window.firebaseDB.createTheory(data);
}
```

**Impact:** Prevents abuse, protects quota.

---

## Troubleshooting Common Issues

### Issue 1: "Permission Denied" Errors

**Symptoms:**
- Users can't create/edit theories
- Console shows Firestore permission errors

**Causes:**
- Security rules not deployed
- User not authenticated
- Rules too restrictive

**Solutions:**

1. **Check security rules are deployed:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verify user is authenticated:**
   ```javascript
   const user = window.firebaseAuth.getCurrentUser();
   console.log('Current user:', user);
   ```

3. **Test rules in Firebase Console:**
   - Go to Firestore → Rules
   - Click "Rules Playground"
   - Simulate requests to test rules

4. **Check rule logic:**
   ```javascript
   // Ensure rule allows authenticated users
   allow create: if request.auth != null
                 && request.resource.data.authorId == request.auth.uid;
   ```

### Issue 2: Quota Exceeded

**Symptoms:**
- "Quota exceeded" errors
- Services stop working
- Email alerts about quota

**Causes:**
- Inefficient queries
- Missing caching
- Traffic spike
- Abuse/bots

**Solutions:**

1. **Immediate: Upgrade to Blaze plan (temporarily):**
   - Go to Spark Plan → Upgrade
   - Set spending limit to prevent runaway costs

2. **Short-term: Implement caching:**
   - Add client-side caching (see Optimization section)
   - Enable Firestore persistence

3. **Long-term: Optimize queries:**
   - Add pagination
   - Reduce unnecessary reads
   - Implement rate limiting

4. **Monitor: Set up alerts:**
   - Alert at 80% quota
   - Investigate spikes immediately

### Issue 3: Slow Query Performance

**Symptoms:**
- Pages load slowly
- Firestore queries take >3 seconds
- User complaints about speed

**Causes:**
- Missing indexes
- Large result sets
- No caching

**Solutions:**

1. **Create composite indexes:**
   - Check browser console for index creation URLs
   - Click URL to auto-create index
   - Or manually create in Firestore Console

2. **Add pagination:**
   ```javascript
   // Load 20 at a time instead of all
   const result = await window.firebaseDB.getAllTheories({ limit: 20 });
   ```

3. **Implement caching:**
   - Cache queries for 5-10 minutes
   - Use localStorage or memory cache

4. **Optimize query:**
   - Reduce number of filters
   - Use simple queries where possible

### Issue 4: Image Upload Failures

**Symptoms:**
- Images fail to upload
- "Upload failed" errors
- Console shows storage errors

**Causes:**
- File too large (>5MB)
- Wrong file type
- Storage rules blocking upload
- User not authenticated
- Storage quota exceeded

**Solutions:**

1. **Validate file before upload:**
   ```javascript
   if (file.size > 5 * 1024 * 1024) {
     alert('Image must be under 5MB');
     return;
   }

   if (!file.type.startsWith('image/')) {
     alert('File must be an image');
     return;
   }
   ```

2. **Compress large images:**
   ```javascript
   const compressed = await compressImage(file, 5); // Max 5MB
   ```

3. **Check storage rules:**
   ```bash
   firebase deploy --only storage
   ```

4. **Verify authentication:**
   ```javascript
   if (!window.firebaseAuth.isLoggedIn()) {
     alert('Please sign in to upload images');
     return;
   }
   ```

### Issue 5: Real-Time Updates Not Working

**Symptoms:**
- Comments don't appear immediately
- Votes don't update in real-time
- Changes not syncing across tabs

**Causes:**
- Not using Firestore listeners
- Listener not attached properly
- Browser tab inactive (resource throttling)

**Solutions:**

1. **Use Firestore onSnapshot listeners:**
   ```javascript
   // Listen for new comments
   firebase.firestore()
     .collection('theories')
     .doc(theoryId)
     .collection('comments')
     .orderBy('createdAt', 'desc')
     .onSnapshot((snapshot) => {
       snapshot.docChanges().forEach((change) => {
         if (change.type === 'added') {
           displayComment(change.doc.data());
         }
       });
     });
   ```

2. **Keep listeners active:**
   - Don't unsubscribe prematurely
   - Store unsubscribe functions for cleanup

3. **Handle tab visibility:**
   ```javascript
   document.addEventListener('visibilitychange', () => {
     if (!document.hidden) {
       // Refresh data when tab becomes visible
       refreshComments();
     }
   });
   ```

---

## Backup Strategy

### Why Backup?

- Protect against accidental deletion
- Recover from data corruption
- Migration to another platform
- Compliance requirements

### Firestore Backup

#### Option 1: Manual Export (Free)

**Using gcloud CLI:**

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project your-project-id

# Export Firestore data
gcloud firestore export gs://your-bucket-name/firestore-backup-$(date +%Y%m%d)
```

**Create backup script (backup-firestore.sh):**

```bash
#!/bin/bash

# Configuration
PROJECT_ID="your-project-id"
BUCKET_NAME="your-backup-bucket"
DATE=$(date +%Y%m%d-%H%M%S)

# Export
echo "Exporting Firestore data..."
gcloud firestore export \
  --project=$PROJECT_ID \
  gs://$BUCKET_NAME/firestore-backup-$DATE

echo "Backup complete: gs://$BUCKET_NAME/firestore-backup-$DATE"
```

**Schedule with cron (Linux/Mac):**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-firestore.sh
```

#### Option 2: Automated Backups (Cloud Functions)

**Create Cloud Function for daily backups:**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

exports.scheduledFirestoreBackup = functions.pubsub
  .schedule('every 24 hours')
  .onRun((context) => {
    const projectId = process.env.GCP_PROJECT;
    const databaseName = client.databasePath(projectId, '(default)');
    const bucket = `gs://${projectId}-firestore-backups`;

    return client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucket,
      collectionIds: []
    })
    .then(responses => {
      const response = responses[0];
      console.log(`Operation Name: ${response['name']}`);
      return response;
    })
    .catch(err => {
      console.error(err);
      throw new Error('Export operation failed');
    });
  });
```

**Deploy:**
```bash
firebase deploy --only functions
```

#### Option 3: Third-Party Backup Services

**Services:**
- **Firestore Backup** (Firebase Extension)
- **Backupify for Firebase**
- **Google Cloud Scheduler + Cloud Functions**

### Storage Backup

**Download all files:**

```bash
# Install gsutil
# Included with gcloud SDK

# Download all files from Storage
gsutil -m cp -r gs://your-bucket-name/theory-images ./backups/storage-$(date +%Y%m%d)

# Compress
tar -czf storage-backup-$(date +%Y%m%d).tar.gz ./backups/storage-$(date +%Y%m%d)
```

**Automate with script:**

```bash
#!/bin/bash

BUCKET="your-project-id.appspot.com"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Download files
gsutil -m cp -r gs://$BUCKET/theory-images $BACKUP_DIR/storage-$DATE

# Compress
tar -czf $BACKUP_DIR/storage-backup-$DATE.tar.gz $BACKUP_DIR/storage-$DATE

# Remove uncompressed files
rm -rf $BACKUP_DIR/storage-$DATE

echo "Storage backup complete: $BACKUP_DIR/storage-backup-$DATE.tar.gz"
```

### Restore from Backup

**Restore Firestore:**

```bash
# Import from backup
gcloud firestore import gs://your-bucket-name/firestore-backup-20240115
```

**Restore Storage:**

```bash
# Upload files back to Storage
gsutil -m cp -r ./backups/storage-20240115/* gs://your-bucket-name/
```

### Backup Retention Policy

**Recommended:**
- Daily backups for last 7 days
- Weekly backups for last 4 weeks
- Monthly backups for last 12 months

**Implement in backup script:**

```bash
#!/bin/bash

# Keep only last 7 daily backups
find ./backups -name "firestore-backup-*" -mtime +7 -delete

# Archive weekly backups (every Sunday)
if [ $(date +%u) -eq 7 ]; then
  mv ./backups/firestore-backup-$(date +%Y%m%d) ./backups/weekly/
fi

# Keep only last 4 weekly backups
find ./backups/weekly -name "firestore-backup-*" -mtime +28 -delete
```

---

## Security Monitoring

### Review Security Rules Regularly

**Monthly security audit:**

1. **Review Firestore rules:**
   - Are rules still appropriate?
   - Any new attack vectors?
   - Need to tighten restrictions?

2. **Review Storage rules:**
   - File size limits appropriate?
   - File types properly restricted?

3. **Test rules:**
   - Use Rules Playground in Console
   - Test edge cases
   - Verify ownership checks work

### Monitor for Suspicious Activity

**Red flags:**

- Sudden spike in failed authentication attempts
- Unusual traffic patterns (e.g., 1000 requests in 1 minute)
- Excessive writes from single user
- Large file uploads from new accounts
- Queries from unexpected regions

**Monitor in Firebase Console:**

1. **Authentication failures:**
   - Go to Authentication → Users
   - Look for patterns in failed sign-ins

2. **Firestore usage spikes:**
   - Go to Firestore → Usage
   - Check for unusual activity

3. **Storage uploads:**
   - Go to Storage → Files
   - Review recent uploads
   - Check file sizes

### Enable App Check (Recommended)

**Protects against:**
- Bots and scrapers
- Quota abuse
- Unauthorized access
- API key misuse

**Setup:**

1. Go to **Build** → **App Check**
2. Click **"Get started"**
3. Select **reCAPTCHA v3**
4. Add to your site:

```html
<!-- App Check SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check-compat.js"></script>

<script>
  // Initialize App Check
  const appCheck = firebase.appCheck();
  appCheck.activate(
    'YOUR_RECAPTCHA_SITE_KEY',
    true // Use reCAPTCHA v3
  );
</script>
```

---

## Performance Monitoring

### Firebase Performance Monitoring

**Enable Performance Monitoring:**

```html
<!-- Performance Monitoring SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-performance-compat.js"></script>

<script>
  // Initialize Performance Monitoring
  const perf = firebase.performance();

  // Custom traces
  const trace = perf.trace('loadTheoryPage');
  trace.start();

  // ... load theory data ...

  trace.stop();
</script>
```

**Metrics collected:**
- Page load times
- Network requests
- Resource loading
- Custom traces

**View in Console:**
- Go to **Release & Monitor** → **Performance**
- See metrics, trends, percentiles

### Google Analytics (Optional)

**Setup:**

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');

  // Custom events
  gtag('event', 'theory_created', {
    'event_category': 'engagement',
    'event_label': 'user_content'
  });
</script>
```

**Track:**
- Page views
- User interactions (theory views, votes, comments)
- Conversion funnels
- User demographics

---

## Summary Checklist

### Daily Tasks (2 minutes)
- [ ] Check Firebase Console for errors
- [ ] Verify all services operational
- [ ] Review quota usage (quick glance)

### Weekly Tasks (15 minutes)
- [ ] Review usage trends
- [ ] Check for performance issues
- [ ] Monitor storage growth
- [ ] Review security logs

### Monthly Tasks (30 minutes)
- [ ] Full quota review
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup verification
- [ ] Cost projection (if on paid plan)

### Quarterly Tasks (1 hour)
- [ ] Comprehensive security review
- [ ] Optimize expensive queries
- [ ] Review and update security rules
- [ ] Test disaster recovery
- [ ] Plan for scaling if needed

---

**Monitoring Complete!** With proper monitoring and maintenance, your Firebase backend will run smoothly and efficiently.

**Next steps:**
- Set up alerts today
- Implement caching for optimization
- Schedule regular backups
- Review security rules monthly

For more information, see:
- `FIREBASE_SETUP_GUIDE.md` - Initial setup
- `API_REFERENCE.md` - API documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

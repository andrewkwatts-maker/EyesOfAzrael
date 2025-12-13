# Rate Limiting Guide
**Eyes of Azrael - API Abuse Prevention**

This guide explains how to implement, use, monitor, and adjust the rate limiting system for Eyes of Azrael.

---

## Table of Contents

1. [What is Rate Limiting?](#what-is-rate-limiting)
2. [Current Rate Limits](#current-rate-limits)
3. [How It Works](#how-it-works)
4. [Implementation Guide](#implementation-guide)
5. [Monitoring Rate Limits](#monitoring-rate-limits)
6. [Adjusting Rate Limits](#adjusting-rate-limits)
7. [Handling Rate Limit Errors](#handling-rate-limit-errors)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## What is Rate Limiting?

Rate limiting controls how many requests a user or IP address can make within a time window. This prevents:

- **DDoS attacks:** Overwhelming your server with requests
- **API abuse:** Scraping all your data
- **Excessive costs:** Firestore charges per read/write
- **Poor user experience:** One user hogging all resources

### Types of Rate Limiting

**1. Per-User Rate Limiting**
- Tracks authenticated users by UID
- Higher limits for registered users
- Survives IP changes

**2. Per-IP Rate Limiting**
- Tracks anonymous users by IP address (hashed)
- Lower limits
- Prevents unauthenticated abuse

**3. Per-Endpoint Rate Limiting**
- Different limits for reads vs writes
- Higher limits for lightweight operations

---

## Current Rate Limits

### Default Thresholds

| User Type | Reads/Hour | Writes/Hour | Time Window | Enforcement |
|-----------|-----------|-------------|-------------|------------|
| **Anonymous** | 50 | 10 | 1 hour | Cloud Functions |
| **Authenticated** | 500 | 100 | 1 hour | Cloud Functions |
| **Admin** | Unlimited | Unlimited | - | Bypassed |

### Additional Limits

**Query Size Limits (Firestore Rules):**
- Maximum 100 results per list query
- No limit on single document reads (get)

**Auto-Block Thresholds:**
- 5 violations within 1 hour → 24-hour IP block (anonymous only)

---

## How It Works

### Request Flow

```
┌──────────────────────────────────────────────┐
│ 1. User Makes Request                        │
│    (Read deity, create theory, etc.)         │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 2. Cloud Function Intercepts                 │
│    - Get user identifier (UID or IP hash)    │
│    - Determine user type                     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 3. Check Rate Limit                          │
│    - Query /system/rate_limits/{identifier}  │
│    - Count requests in time window           │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 4. Decision                                  │
│    ┌─────────────────┬──────────────────┐   │
│    │ Within Limit    │ Exceeded Limit   │   │
│    │ ✅ Allow         │ ❌ Block          │   │
│    │ Update counter  │ Log violation    │   │
│    └─────────────────┴──────────────────┘   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 5. Return Response                           │
│    - Success: Return data                    │
│    - Rate limited: Error + retry-after       │
└──────────────────────────────────────────────┘
```

### Data Structure

#### Rate Limit Document
```javascript
// /system/rate_limits/requests/{identifier}
{
  requests: [
    {
      timestamp: Timestamp(2025-12-13T10:30:00Z),
      type: 'read'
    },
    {
      timestamp: Timestamp(2025-12-13T10:31:00Z),
      type: 'read'
    }
    // ... up to limit
  ],
  lastUpdated: Timestamp(2025-12-13T10:31:00Z)
}
```

#### Blocked IP Document
```javascript
// /system/blocked_ips/ips/{ipHash}
{
  blockedAt: Timestamp(2025-12-13T10:00:00Z),
  expiresAt: Timestamp(2025-12-14T10:00:00Z),
  reason: 'Multiple rate limit violations',
  autoExpire: true
}
```

---

## Implementation Guide

### Step 1: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd H:\Github\EyesOfAzrael\FIREBASE\functions

# Install dependencies
npm install

# Deploy to Firebase
firebase deploy --only functions
```

**Deployed Functions:**
- `checkRateLimit` - Check current limit status
- `cleanupRateLimits` - Scheduled cleanup (every hour)
- `adminBlockIP` - Manually block IP
- `adminUnblockIP` - Unblock IP
- `getSecurityLogs` - View security events

### Step 2: Integrate with Client

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Check rate limit before expensive operation
async function fetchDeities() {
  try {
    // Check rate limit
    const checkLimit = httpsCallable(functions, 'checkRateLimit');
    const limitStatus = await checkLimit({ operationType: 'read' });

    if (!limitStatus.data.allowed) {
      alert(`Rate limit exceeded. ${limitStatus.data.remaining} requests remaining.`);
      return;
    }

    // Proceed with request
    const db = getFirestore();
    const snapshot = await getDocs(collection(db, 'deities'));
    // ... process data

  } catch (error) {
    if (error.code === 'resource-exhausted') {
      console.error('Rate limit exceeded:', error.message);
      // Show user-friendly message
    }
  }
}
```

### Step 3: Handle Rate Limit Errors

```javascript
async function makeRequest(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 'resource-exhausted') {
      // Extract retry-after from error details
      const retryAfter = error.details?.retryAfter || 3600; // default 1 hour

      // Show user message
      showRateLimitMessage(retryAfter);

      // Optional: Auto-retry after delay
      setTimeout(() => {
        makeRequest(operation);
      }, retryAfter * 1000);
    }
    throw error;
  }
}

function showRateLimitMessage(retryAfter) {
  const minutes = Math.ceil(retryAfter / 60);
  alert(`You've made too many requests. Please try again in ${minutes} minutes.`);
}
```

### Step 4: Add Rate Limit Indicator (UI)

```javascript
// Show rate limit status to users
async function displayRateLimitStatus() {
  const checkLimit = httpsCallable(functions, 'checkRateLimit');
  const status = await checkLimit({ operationType: 'read' });

  const statusDiv = document.getElementById('rate-limit-status');
  statusDiv.innerHTML = `
    <div class="rate-limit-info">
      <p>Requests remaining: ${status.data.remaining} / ${status.data.limit}</p>
      <p>User type: ${status.data.userType}</p>
      <div class="progress-bar">
        <div class="progress" style="width: ${(status.data.remaining / status.data.limit) * 100}%"></div>
      </div>
    </div>
  `;
}
```

---

## Monitoring Rate Limits

### 1. Firebase Console

**View Rate Limit Documents:**
```
Firestore > system > rate_limits > requests
```

Each document shows:
- User identifier (UID or IP hash)
- Request timestamps
- Last updated time

**View Blocked IPs:**
```
Firestore > system > blocked_ips > ips
```

### 2. Cloud Functions Logs

```bash
# View all function logs
firebase functions:log

# View specific function
firebase functions:log --only checkRateLimit

# Follow logs in real-time
firebase functions:log --only checkRateLimit --limit 100
```

### 3. Security Logs (Admin Only)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getSecurityLogs = httpsCallable(functions, 'getSecurityLogs');

// Get all security events
const allLogs = await getSecurityLogs({ limit: 100 });

// Filter by event type
const rateLimitViolations = await getSecurityLogs({
  limit: 100,
  eventType: 'rate_limit_exceeded'
});

console.log('Security events:', allLogs.data.logs);
```

**Event Types:**
- `rate_limit_exceeded` - User exceeded rate limit
- `ip_blocked` - IP automatically blocked
- `blocked_access_attempt` - Blocked IP tried to access
- `admin_ip_block` - Admin manually blocked IP
- `admin_ip_unblock` - Admin unblocked IP

### 4. Monitoring Dashboard (Custom)

Create a simple admin dashboard:

```html
<!-- admin-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Rate Limit Dashboard</title>
  <style>
    .stat { padding: 20px; border: 1px solid #ddd; margin: 10px; }
    .violation { background: #fee; }
    .blocked { background: #fdd; }
  </style>
</head>
<body>
  <h1>Rate Limit Monitoring</h1>

  <div id="stats">
    <div class="stat">
      <h3>Active Rate Limits</h3>
      <p id="active-limits">Loading...</p>
    </div>

    <div class="stat violation">
      <h3>Recent Violations</h3>
      <p id="violations">Loading...</p>
    </div>

    <div class="stat blocked">
      <h3>Blocked IPs</h3>
      <p id="blocked-ips">Loading...</p>
    </div>
  </div>

  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
    import { getFirestore, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
    import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';

    // Initialize Firebase
    const app = initializeApp({ /* your config */ });
    const db = getFirestore(app);
    const functions = getFunctions(app);

    // Load stats
    async function loadStats() {
      // Active rate limits
      const rateLimitsSnap = await getDocs(collection(db, 'system', 'rate_limits', 'requests'));
      document.getElementById('active-limits').textContent = `${rateLimitsSnap.size} active users`;

      // Blocked IPs
      const blockedIPsSnap = await getDocs(collection(db, 'system', 'blocked_ips', 'ips'));
      document.getElementById('blocked-ips').textContent = `${blockedIPsSnap.size} blocked IPs`;

      // Recent violations
      const getSecurityLogs = httpsCallable(functions, 'getSecurityLogs');
      const logs = await getSecurityLogs({ limit: 10, eventType: 'rate_limit_exceeded' });
      document.getElementById('violations').textContent = `${logs.data.logs.length} recent violations`;
    }

    loadStats();
    setInterval(loadStats, 60000); // Refresh every minute
  </script>
</body>
</html>
```

---

## Adjusting Rate Limits

### Changing Thresholds

Edit `FIREBASE/functions/rateLimiter.js`:

```javascript
// Find this section
const RATE_LIMITS = {
  anonymous: {
    reads: 50,      // Change this
    writes: 10,     // Change this
    window: 3600    // Keep as 1 hour (or change)
  },
  authenticated: {
    reads: 500,     // Change this
    writes: 100,    // Change this
    window: 3600
  },
  admin: {
    reads: Infinity,
    writes: Infinity,
    window: 3600
  }
};
```

**Recommendations:**

| Scenario | Anonymous Reads | Authenticated Reads | Reason |
|----------|----------------|-------------------|--------|
| High traffic site | 100 | 1000 | More generous limits |
| Low traffic site | 20 | 200 | Stricter protection |
| Under attack | 10 | 100 | Emergency lockdown |
| Testing | Infinity | Infinity | Disable temporarily |

### Changing Auto-Block Threshold

```javascript
// Find this section in rateLimitMiddleware()

// Block after 5 violations (change this number)
if (violations >= 5) {
  await blockIP(ipHash, 'Multiple rate limit violations');
}
```

### Changing Block Duration

```javascript
// Find this constant
const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Change to:
const BLOCK_DURATION = 12 * 60 * 60 * 1000; // 12 hours
// or
const BLOCK_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Deploy Changes

```bash
firebase deploy --only functions
```

---

## Handling Rate Limit Errors

### Client-Side Error Handling

```javascript
class RateLimitHandler {
  constructor() {
    this.retryQueue = [];
  }

  async makeRequest(operation, options = {}) {
    const { maxRetries = 3, backoff = true } = options;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (error.code === 'resource-exhausted') {
          const retryAfter = error.details?.retryAfter || 3600;

          // Show user message
          this.showRateLimitMessage(retryAfter);

          // Calculate backoff delay
          const delay = backoff
            ? Math.min(retryAfter * 1000, 60000 * Math.pow(2, attempt))
            : retryAfter * 1000;

          // Wait and retry
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  showRateLimitMessage(retryAfter) {
    const minutes = Math.ceil(retryAfter / 60);
    const message = `Rate limit exceeded. Please wait ${minutes} minutes.`;

    // Show toast notification
    this.showToast(message, 'warning');

    // Optional: Update UI
    document.getElementById('rate-limit-warning')?.classList.add('visible');
  }

  showToast(message, type = 'info') {
    // Your toast notification implementation
    console.log(`[${type}] ${message}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const rateLimitHandler = new RateLimitHandler();

await rateLimitHandler.makeRequest(
  () => getDocs(collection(db, 'deities')),
  { maxRetries: 3, backoff: true }
);
```

### Server-Side Error Responses

In Cloud Functions:

```javascript
exports.myFunction = functions.https.onCall(async (data, context) => {
  const rateLimit = await rateLimitMiddleware(context, 'read');

  if (!rateLimit.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Rate limit exceeded. You have 0 of ${rateLimit.limit} requests remaining.`,
      {
        retryAfter: rateLimit.retryAfter,
        limit: rateLimit.limit,
        remaining: 0,
        resetAt: Date.now() + (rateLimit.retryAfter * 1000)
      }
    );
  }

  // Your function logic
});
```

---

## Best Practices

### 1. Inform Users About Limits

```html
<!-- Show limits on signup page -->
<div class="rate-limit-info">
  <h3>API Limits</h3>
  <p>Anonymous users: 50 requests/hour</p>
  <p>Registered users: 500 requests/hour</p>
  <p><a href="/signup">Sign up</a> for higher limits!</p>
</div>
```

### 2. Implement Graceful Degradation

```javascript
async function fetchData() {
  try {
    // Try full data fetch
    return await getDocs(query(collection(db, 'deities'), limit(100)));
  } catch (error) {
    if (error.code === 'resource-exhausted') {
      // Fall back to cached data
      return getCachedData();
    }
    throw error;
  }
}
```

### 3. Use Client-Side Caching

```javascript
class CachedDataStore {
  constructor(ttl = 3600000) { // 1 hour default
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetcher) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    // Cache miss or expired - fetch new data
    const data = await fetcher();

    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });

    return data;
  }

  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const dataStore = new CachedDataStore(3600000); // 1 hour cache

const deities = await dataStore.get('deities', async () => {
  const snapshot = await getDocs(collection(db, 'deities'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
```

### 4. Batch Requests

Instead of:
```javascript
// BAD - 10 separate requests
for (const id of deityIds) {
  await getDoc(doc(db, 'deities', id));
}
```

Do this:
```javascript
// GOOD - 1 batched request
const snapshot = await getDocs(
  query(collection(db, 'deities'), where('__name__', 'in', deityIds))
);
```

### 5. Implement Request Queuing

```javascript
class RequestQueue {
  constructor(maxConcurrent = 5, delayBetween = 100) {
    this.queue = [];
    this.maxConcurrent = maxConcurrent;
    this.delayBetween = delayBetween;
    this.running = 0;
  }

  async add(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { operation, resolve, reject } = this.queue.shift();

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      await this.sleep(this.delayBetween);
      this.process();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const queue = new RequestQueue(5, 100); // 5 concurrent, 100ms delay

const results = await Promise.all(
  deityIds.map(id => queue.add(() => getDoc(doc(db, 'deities', id))))
);
```

---

## Troubleshooting

### Issue: Rate Limit Triggered Too Easily

**Symptoms:**
- Users report frequent rate limit errors
- Legitimate users getting blocked

**Solutions:**
1. Increase rate limits (see [Adjusting Rate Limits](#adjusting-rate-limits))
2. Check if user is making unnecessary requests (use caching)
3. Review security logs for patterns
4. Consider per-endpoint limits instead of global

### Issue: Rate Limits Not Working

**Symptoms:**
- Users can make unlimited requests
- No rate limit errors

**Solutions:**
1. Verify Cloud Functions are deployed:
   ```bash
   firebase functions:list
   ```

2. Check function logs for errors:
   ```bash
   firebase functions:log --only checkRateLimit
   ```

3. Verify rateLimitMiddleware is called in your functions

4. Check Firestore rules don't bypass rate limiting

### Issue: Blocked IP Not Auto-Expiring

**Symptoms:**
- IP blocked over 24 hours ago still blocked
- expiresAt in past but IP still in collection

**Solutions:**
1. Check if cleanup function is running:
   ```bash
   firebase functions:log --only cleanupRateLimits
   ```

2. Manually trigger cleanup or delete expired blocks:
   ```javascript
   // Admin function to clean up manually
   const now = Date.now();
   const snapshot = await getDocs(
     query(
       collection(db, 'system', 'blocked_ips', 'ips'),
       where('expiresAt', '<', Timestamp.fromMillis(now))
     )
   );

   const batch = writeBatch(db);
   snapshot.forEach(doc => batch.delete(doc.ref));
   await batch.commit();
   ```

### Issue: Admin Still Rate Limited

**Symptoms:**
- Admin email getting rate limit errors

**Solutions:**
1. Verify admin email in code matches authenticated user:
   ```javascript
   const ADMIN_EMAIL = 'andrewkwatts@gmail.com';
   console.log('Authenticated as:', context.auth.token.email);
   ```

2. Check if authentication token includes email claim

3. Manually bypass for testing:
   ```javascript
   if (context.auth.token.email === 'andrewkwatts@gmail.com') {
     return { allowed: true, remaining: Infinity };
   }
   ```

---

## Quick Reference

### Deploy Rate Limiting
```bash
cd FIREBASE/functions
npm install
firebase deploy --only functions
```

### Check User's Rate Limit
```javascript
const status = await checkRateLimit({ operationType: 'read' });
console.log('Remaining:', status.data.remaining);
```

### Block IP (Admin)
```javascript
await adminBlockIP({
  ip: '1.2.3.4',
  reason: 'Abuse',
  duration: 86400000 // 24 hours
});
```

### Unblock IP (Admin)
```javascript
await adminUnblockIP({ ip: '1.2.3.4' });
```

### View Security Logs (Admin)
```javascript
const logs = await getSecurityLogs({
  limit: 100,
  eventType: 'rate_limit_exceeded'
});
```

### Update Rate Limits
1. Edit `FIREBASE/functions/rateLimiter.js`
2. Change `RATE_LIMITS` constants
3. Deploy: `firebase deploy --only functions`

---

## Additional Resources

- [SECURITY_CONFIGURATION.md](./SECURITY_CONFIGURATION.md) - Full security setup
- [FIREBASE_APP_CHECK_SETUP.md](./FIREBASE_APP_CHECK_SETUP.md) - DDoS protection
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Last Updated:** December 13, 2025
**Version:** 1.0.0
**Maintained By:** Andrew Watts

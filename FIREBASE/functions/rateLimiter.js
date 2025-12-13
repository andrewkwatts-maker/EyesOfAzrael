/**
 * Firebase Cloud Functions - Rate Limiter
 * Eyes of Azrael - DDoS Protection & Spam Prevention
 *
 * FEATURES:
 * - Track request counts per IP and user
 * - Block IPs exceeding thresholds
 * - Auto-expire blocks after 24 hours
 * - Log all blocked attempts
 * - Admin bypass
 *
 * THRESHOLDS:
 * - Anonymous users: 50 reads/hour, 10 writes/hour
 * - Authenticated users: 500 reads/hour, 100 writes/hour
 * - Admin (andrewkwatts@gmail.com): Unlimited
 *
 * DEPLOYMENT:
 *   firebase deploy --only functions
 *
 * REQUIREMENTS:
 *   - Firebase Blaze (pay-as-you-go) plan
 *   - npm install firebase-functions firebase-admin
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configuration
const RATE_LIMITS = {
  anonymous: {
    reads: 50,      // reads per hour
    writes: 10,     // writes per hour
    window: 3600    // 1 hour in seconds
  },
  authenticated: {
    reads: 500,     // reads per hour
    writes: 100,    // writes per hour
    window: 3600    // 1 hour in seconds
  },
  admin: {
    reads: Infinity,
    writes: Infinity,
    window: 3600
  }
};

const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const ADMIN_EMAIL = 'andrewkwatts@gmail.com';

/**
 * Hash IP address for privacy
 * @param {string} ip - IP address
 * @returns {string} Hashed IP
 */
function hashIP(ip) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Get user identifier (UID or hashed IP)
 * @param {object} context - Firebase function context
 * @param {string} ip - Request IP address
 * @returns {string} User identifier
 */
function getUserIdentifier(context, ip) {
  if (context.auth && context.auth.uid) {
    return `user:${context.auth.uid}`;
  }
  return `ip:${hashIP(ip)}`;
}

/**
 * Get user type (admin, authenticated, anonymous)
 * @param {object} context - Firebase function context
 * @returns {string} User type
 */
function getUserType(context) {
  if (context.auth && context.auth.token && context.auth.token.email === ADMIN_EMAIL) {
    return 'admin';
  }
  if (context.auth && context.auth.uid) {
    return 'authenticated';
  }
  return 'anonymous';
}

/**
 * Check if IP is blocked
 * @param {string} ipHash - Hashed IP address
 * @returns {Promise<boolean>} True if blocked
 */
async function isIPBlocked(ipHash) {
  try {
    const blockDoc = await db.collection('system').doc('blocked_ips').collection('ips').doc(ipHash).get();

    if (!blockDoc.exists) {
      return false;
    }

    const blockData = blockDoc.data();
    const now = Date.now();

    // Check if block has expired
    if (blockData.expiresAt && blockData.expiresAt.toMillis() < now) {
      // Remove expired block
      await blockDoc.ref.delete();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking IP block:', error);
    return false; // Fail open - don't block on error
  }
}

/**
 * Block an IP address
 * @param {string} ipHash - Hashed IP address
 * @param {string} reason - Reason for blocking
 */
async function blockIP(ipHash, reason) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + BLOCK_DURATION);

  await db.collection('system').doc('blocked_ips').collection('ips').doc(ipHash).set({
    blockedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    reason: reason,
    autoExpire: true
  });

  // Log the block
  await logSecurityEvent('ip_blocked', {
    ipHash: ipHash,
    reason: reason,
    expiresAt: expiresAt.toISOString()
  });
}

/**
 * Check rate limit for a user/IP
 * @param {string} identifier - User identifier (UID or hashed IP)
 * @param {string} userType - User type (admin, authenticated, anonymous)
 * @param {string} operationType - Operation type (read, write)
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
async function checkRateLimit(identifier, userType, operationType) {
  // Admin has no limits
  if (userType === 'admin') {
    return { allowed: true, remaining: Infinity };
  }

  const limits = RATE_LIMITS[userType];
  const maxRequests = operationType === 'read' ? limits.reads : limits.writes;
  const windowSeconds = limits.window;

  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Get rate limit document
  const rateLimitRef = db.collection('system').doc('rate_limits').collection('requests').doc(identifier);
  const rateLimitDoc = await rateLimitRef.get();

  if (!rateLimitDoc.exists) {
    // First request - create document
    await rateLimitRef.set({
      requests: [{
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: operationType
      }],
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Filter requests within time window
  const data = rateLimitDoc.data();
  const requests = (data.requests || []).filter(req => {
    const reqTime = req.timestamp.toMillis();
    return reqTime > windowStart && req.type === operationType;
  });

  // Check if limit exceeded
  if (requests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Add new request
  requests.push({
    timestamp: admin.firestore.Timestamp.fromDate(new Date(now)),
    type: operationType
  });

  // Update document (keep only requests in window)
  await rateLimitRef.update({
    requests: requests,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });

  return { allowed: true, remaining: maxRequests - requests.length };
}

/**
 * Log security event
 * @param {string} eventType - Type of event
 * @param {object} details - Event details
 */
async function logSecurityEvent(eventType, details) {
  try {
    await db.collection('system').doc('security_logs').collection('events').add({
      type: eventType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: details
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Rate Limiting Middleware
 * Call this from other Cloud Functions to enforce rate limits
 *
 * @example
 * const { rateLimitMiddleware } = require('./rateLimiter');
 *
 * exports.myFunction = functions.https.onCall(async (data, context) => {
 *   const rateLimit = await rateLimitMiddleware(context, 'read');
 *   if (!rateLimit.allowed) {
 *     throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
 *   }
 *   // ... rest of function
 * });
 */
async function rateLimitMiddleware(context, operationType = 'read') {
  // Get IP from context (may not be available in all environments)
  const ip = context.rawRequest ? context.rawRequest.ip : 'unknown';
  const identifier = getUserIdentifier(context, ip);
  const userType = getUserType(context);
  const ipHash = ip !== 'unknown' ? hashIP(ip) : null;

  // Check if IP is blocked
  if (ipHash && await isIPBlocked(ipHash)) {
    await logSecurityEvent('blocked_access_attempt', {
      identifier: identifier,
      ipHash: ipHash,
      userType: userType,
      operationType: operationType
    });

    return {
      allowed: false,
      remaining: 0,
      reason: 'IP blocked',
      retryAfter: BLOCK_DURATION / 1000
    };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(identifier, userType, operationType);

  if (!rateLimit.allowed) {
    // Log rate limit violation
    await logSecurityEvent('rate_limit_exceeded', {
      identifier: identifier,
      userType: userType,
      operationType: operationType,
      timestamp: new Date().toISOString()
    });

    // Block IP after multiple violations (only for anonymous users)
    if (userType === 'anonymous' && ipHash) {
      const violationsRef = db.collection('system').doc('violations').collection('ips').doc(ipHash);
      const violationsDoc = await violationsRef.get();

      const violations = violationsDoc.exists ? (violationsDoc.data().count || 0) + 1 : 1;
      await violationsRef.set({
        count: violations,
        lastViolation: admin.firestore.FieldValue.serverTimestamp()
      });

      // Block after 5 violations
      if (violations >= 5) {
        await blockIP(ipHash, 'Multiple rate limit violations');
      }
    }

    return {
      allowed: false,
      remaining: 0,
      reason: 'Rate limit exceeded',
      retryAfter: RATE_LIMITS[userType].window
    };
  }

  return rateLimit;
}

/**
 * HTTP Cloud Function - Check Rate Limit
 * Callable from client apps to check remaining quota
 */
exports.checkRateLimit = functions.https.onCall(async (data, context) => {
  const operationType = data.operationType || 'read';
  const ip = context.rawRequest ? context.rawRequest.ip : 'unknown';
  const identifier = getUserIdentifier(context, ip);
  const userType = getUserType(context);

  const rateLimit = await checkRateLimit(identifier, userType, operationType);

  return {
    allowed: rateLimit.allowed,
    remaining: rateLimit.remaining,
    limit: userType === 'admin' ? Infinity : (operationType === 'read' ? RATE_LIMITS[userType].reads : RATE_LIMITS[userType].writes),
    window: RATE_LIMITS[userType].window,
    userType: userType
  };
});

/**
 * Scheduled Function - Clean up expired rate limit documents
 * Runs every hour
 */
exports.cleanupRateLimits = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const now = Date.now();
  const cutoff = now - (2 * 60 * 60 * 1000); // 2 hours ago

  try {
    // Clean up old rate limit documents
    const rateLimitsSnapshot = await db.collection('system').doc('rate_limits').collection('requests')
      .where('lastUpdated', '<', new Date(cutoff))
      .limit(500)
      .get();

    const batch = db.batch();
    let count = 0;

    rateLimitsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Cleaned up ${count} old rate limit documents`);
    }

    // Clean up expired IP blocks
    const blockedIPsSnapshot = await db.collection('system').doc('blocked_ips').collection('ips')
      .where('expiresAt', '<', admin.firestore.Timestamp.fromDate(new Date(now)))
      .limit(500)
      .get();

    const blockBatch = db.batch();
    let blockCount = 0;

    blockedIPsSnapshot.forEach(doc => {
      blockBatch.delete(doc.ref);
      blockCount++;
    });

    if (blockCount > 0) {
      await blockBatch.commit();
      console.log(`Cleaned up ${blockCount} expired IP blocks`);
    }

    return null;
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    return null;
  }
});

/**
 * Admin Function - Manually Block IP
 * Callable only by admin
 */
exports.adminBlockIP = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || context.auth.token.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', 'Only admin can block IPs');
  }

  const { ip, reason, duration } = data;

  if (!ip) {
    throw new functions.https.HttpsError('invalid-argument', 'IP address is required');
  }

  const ipHash = hashIP(ip);
  const blockDuration = duration || BLOCK_DURATION;
  const expiresAt = new Date(Date.now() + blockDuration);

  await db.collection('system').doc('blocked_ips').collection('ips').doc(ipHash).set({
    blockedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    reason: reason || 'Manually blocked by admin',
    autoExpire: true,
    blockedBy: context.auth.uid
  });

  await logSecurityEvent('admin_ip_block', {
    ipHash: ipHash,
    reason: reason,
    duration: blockDuration,
    blockedBy: context.auth.uid
  });

  return { success: true, ipHash: ipHash, expiresAt: expiresAt.toISOString() };
});

/**
 * Admin Function - Unblock IP
 * Callable only by admin
 */
exports.adminUnblockIP = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || context.auth.token.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', 'Only admin can unblock IPs');
  }

  const { ip } = data;

  if (!ip) {
    throw new functions.https.HttpsError('invalid-argument', 'IP address is required');
  }

  const ipHash = hashIP(ip);

  await db.collection('system').doc('blocked_ips').collection('ips').doc(ipHash).delete();

  await logSecurityEvent('admin_ip_unblock', {
    ipHash: ipHash,
    unblockedBy: context.auth.uid
  });

  return { success: true, ipHash: ipHash };
});

/**
 * Admin Function - Get Security Logs
 * Callable only by admin
 */
exports.getSecurityLogs = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || context.auth.token.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', 'Only admin can view security logs');
  }

  const { limit = 100, eventType } = data;

  let query = db.collection('system').doc('security_logs').collection('events')
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (eventType) {
    query = query.where('type', '==', eventType);
  }

  const snapshot = await query.get();
  const logs = [];

  snapshot.forEach(doc => {
    logs.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return { logs: logs };
});

// Export middleware for use in other functions
module.exports = {
  rateLimitMiddleware,
  checkRateLimit,
  isIPBlocked,
  blockIP,
  logSecurityEvent
};

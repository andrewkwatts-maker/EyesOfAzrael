/**
 * Firebase Cloud Functions - Entry Point
 * Eyes of Azrael
 *
 * This file exports all Cloud Functions for the project.
 * Import and use in other functions as needed.
 */

// Rate Limiter Functions
const rateLimiter = require('./rateLimiter');

// Export all rate limiter functions
exports.checkRateLimit = rateLimiter.checkRateLimit;
exports.cleanupRateLimits = rateLimiter.cleanupRateLimits;
exports.adminBlockIP = rateLimiter.adminBlockIP;
exports.adminUnblockIP = rateLimiter.adminUnblockIP;
exports.getSecurityLogs = rateLimiter.getSecurityLogs;

// Export middleware for use in other functions
exports.rateLimitMiddleware = rateLimiter.rateLimitMiddleware;

/**
 * Example: Using rate limiter in a custom function
 *
 * const functions = require('firebase-functions');
 * const { rateLimitMiddleware } = require('./index');
 *
 * exports.myCustomFunction = functions.https.onCall(async (data, context) => {
 *   // Check rate limit
 *   const rateLimit = await rateLimitMiddleware(context, 'read');
 *
 *   if (!rateLimit.allowed) {
 *     throw new functions.https.HttpsError(
 *       'resource-exhausted',
 *       'Rate limit exceeded. Please try again later.',
 *       { retryAfter: rateLimit.retryAfter }
 *     );
 *   }
 *
 *   // Your function logic here
 *   return { success: true };
 * });
 */

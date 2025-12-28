/**
 * Security Helper Utilities
 * Provides reusable security functions for sanitization, validation, and protection
 */

class SecurityHelpers {
    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    static escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Sanitize HTML by removing dangerous tags and attributes
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    static sanitizeHtml(html) {
        if (!html || typeof html !== 'string') return '';

        // Remove script tags
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove event handlers
        html = html.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
        html = html.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

        // Remove javascript: URLs
        html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
        html = html.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

        // Remove data: URLs for scripts
        html = html.replace(/src\s*=\s*["']data:text\/javascript[^"']*["']/gi, '');

        return html;
    }

    /**
     * Validate and sanitize file name
     * @param {string} fileName - File name to sanitize
     * @returns {string} Sanitized file name
     */
    static sanitizeFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') return '';

        // Remove path traversal attempts
        fileName = fileName.replace(/\.\./g, '');
        fileName = fileName.replace(/[/\\]/g, '');

        // Remove special characters except dots, hyphens, and underscores
        fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Prevent starting with dot (hidden files)
        if (fileName.startsWith('.')) {
            fileName = fileName.substring(1);
        }

        return fileName;
    }

    /**
     * Validate email format
     * @param {string} email - Email address to validate
     * @returns {boolean} True if valid email
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @param {boolean} allowJavaScript - Allow javascript: URLs (default: false)
     * @returns {boolean} True if valid URL
     */
    static isValidUrl(url, allowJavaScript = false) {
        if (!url || typeof url !== 'string') return false;

        // Block javascript: URLs unless explicitly allowed
        if (!allowJavaScript && url.toLowerCase().startsWith('javascript:')) {
            return false;
        }

        // Block data: URLs for scripts
        if (url.toLowerCase().startsWith('data:text/javascript')) {
            return false;
        }

        try {
            const urlObj = new URL(url);
            return ['http:', 'https:', 'data:', 'blob:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Validate entity ID format
     * @param {string} id - Entity ID to validate
     * @returns {boolean} True if valid ID
     */
    static isValidEntityId(id) {
        if (!id || typeof id !== 'string') return false;

        // Allow alphanumeric, hyphens, and underscores
        const idRegex = /^[a-zA-Z0-9_-]+$/;
        return idRegex.test(id) && id.length <= 100;
    }

    /**
     * Validate collection name
     * @param {string} collection - Collection name to validate
     * @returns {boolean} True if valid collection name
     */
    static isValidCollection(collection) {
        const validCollections = [
            'deities', 'heroes', 'creatures', 'items', 'places',
            'concepts', 'rituals', 'herbs', 'texts', 'symbols',
            'magic', 'user_theories', 'users', 'mythologies'
        ];

        return validCollections.includes(collection);
    }

    /**
     * Sanitize search query
     * @param {string} query - Search query to sanitize
     * @returns {string} Sanitized query
     */
    static sanitizeSearchQuery(query) {
        if (!query || typeof query !== 'string') return '';

        // Remove NoSQL operators
        query = query.replace(/\$/g, '');

        // Limit length
        query = query.substring(0, 200);

        // Trim whitespace
        query = query.trim();

        return query;
    }

    /**
     * Generate CSRF token
     * @returns {string} CSRF token
     */
    static generateCsrfToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate CSRF token
     * @param {string} token - Token to validate
     * @param {string} sessionToken - Session CSRF token
     * @returns {boolean} True if valid
     */
    static validateCsrfToken(token, sessionToken) {
        if (!token || !sessionToken) return false;
        if (typeof token !== 'string' || typeof sessionToken !== 'string') return false;

        // Use constant-time comparison to prevent timing attacks
        if (token.length !== sessionToken.length) return false;

        let result = 0;
        for (let i = 0; i < token.length; i++) {
            result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Validate file upload
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result { valid: boolean, error: string }
     */
    static validateFileUpload(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
            allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
        } = options;

        // Check file exists
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file size
        if (file.size > maxSize) {
            const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            return { valid: false, error: `File too large. Maximum size: ${sizeMB}MB` };
        }

        // Check MIME type
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
        }

        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            return { valid: false, error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}` };
        }

        // Check for double extensions
        const parts = file.name.split('.');
        if (parts.length > 2) {
            const suspiciousExtensions = ['php', 'exe', 'sh', 'bat', 'cmd'];
            for (let i = 1; i < parts.length - 1; i++) {
                if (suspiciousExtensions.includes(parts[i].toLowerCase())) {
                    return { valid: false, error: 'Suspicious file extension detected' };
                }
            }
        }

        return { valid: true };
    }

    /**
     * Sanitize for use in regular expression
     * @param {string} str - String to sanitize
     * @returns {string} Escaped string
     */
    static escapeRegex(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Check if request is from allowed origin (CORS)
     * @param {string} origin - Request origin
     * @param {Array<string>} allowedOrigins - List of allowed origins
     * @returns {boolean} True if allowed
     */
    static isAllowedOrigin(origin, allowedOrigins = []) {
        if (!origin) return false;

        // Default allowed origins
        const defaultAllowed = [
            'https://eyesofazrael.com',
            'https://www.eyesofazrael.com',
            'http://localhost:3000',
            'http://localhost:5000'
        ];

        const allowed = [...defaultAllowed, ...allowedOrigins];

        return allowed.includes(origin);
    }

    /**
     * Rate limit checker
     * @param {string} key - Rate limit key (e.g., user ID or IP)
     * @param {number} maxAttempts - Maximum attempts allowed
     * @param {number} windowMs - Time window in milliseconds
     * @param {Map} store - Storage for rate limit data
     * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
     */
    static checkRateLimit(key, maxAttempts = 5, windowMs = 5 * 60 * 1000, store = new Map()) {
        const now = Date.now();
        const record = store.get(key) || { attempts: [], firstAttempt: now };

        // Remove attempts outside the time window
        record.attempts = record.attempts.filter(timestamp => now - timestamp < windowMs);

        // Check if rate limit exceeded
        if (record.attempts.length >= maxAttempts) {
            const oldestAttempt = Math.min(...record.attempts);
            const resetAt = oldestAttempt + windowMs;

            return {
                allowed: false,
                remaining: 0,
                resetAt: resetAt,
                retryAfter: Math.ceil((resetAt - now) / 1000) // seconds
            };
        }

        // Record this attempt
        record.attempts.push(now);
        store.set(key, record);

        return {
            allowed: true,
            remaining: maxAttempts - record.attempts.length,
            resetAt: now + windowMs
        };
    }

    /**
     * Hash sensitive data (simple hash for client-side)
     * @param {string} data - Data to hash
     * @returns {Promise<string>} Hashed data
     */
    static async hashData(data) {
        if (!data || typeof data !== 'string') return '';

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Anonymize user data for logging/analytics
     * @param {Object} data - Data to anonymize
     * @returns {Object} Anonymized data
     */
    static anonymizeUserData(data) {
        if (!data || typeof data !== 'object') return {};

        const sensitiveFields = ['email', 'password', 'token', 'apiKey', 'secret'];
        const anonymized = { ...data };

        // Remove sensitive fields
        sensitiveFields.forEach(field => {
            if (field in anonymized) {
                delete anonymized[field];
            }
        });

        // Partially mask user ID
        if (anonymized.userId && typeof anonymized.userId === 'string') {
            const masked = anonymized.userId.substring(0, 4) + '***';
            anonymized.userId = masked;
        }

        // Partially mask IP address
        if (anonymized.ipAddress && typeof anonymized.ipAddress === 'string') {
            const parts = anonymized.ipAddress.split('.');
            if (parts.length === 4) {
                anonymized.ipAddress = `${parts[0]}.${parts[1]}.***.**`;
            }
        }

        return anonymized;
    }

    /**
     * Sanitize error message for user display
     * @param {Error|string} error - Error to sanitize
     * @returns {string} User-friendly error message
     */
    static sanitizeErrorMessage(error) {
        const message = error instanceof Error ? error.message : String(error);

        // Remove sensitive information
        let sanitized = message;

        // Remove IP addresses
        sanitized = sanitized.replace(/\d+\.\d+\.\d+\.\d+/g, '[IP]');

        // Remove file paths
        sanitized = sanitized.replace(/[A-Za-z]:\\[^:\n]+/g, '[PATH]');
        sanitized = sanitized.replace(/\/[^\s:]+/g, '[PATH]');

        // Remove passwords and tokens
        sanitized = sanitized.replace(/password[=:]\s*[^\s]+/gi, 'password=***');
        sanitized = sanitized.replace(/token[=:]\s*[^\s]+/gi, 'token=***');
        sanitized = sanitized.replace(/key[=:]\s*[^\s]+/gi, 'key=***');

        // Remove email addresses
        sanitized = sanitized.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[EMAIL]');

        return sanitized;
    }

    /**
     * Check if user has Do Not Track enabled
     * @returns {boolean} True if DNT is enabled
     */
    static isDNTEnabled() {
        return navigator.doNotTrack === '1' ||
               navigator.doNotTrack === 'yes' ||
               window.doNotTrack === '1';
    }

    /**
     * Validate content length
     * @param {string} content - Content to validate
     * @param {number} maxLength - Maximum length
     * @returns {Object} Validation result
     */
    static validateContentLength(content, maxLength = 10000) {
        if (!content || typeof content !== 'string') {
            return { valid: false, error: 'Content is required' };
        }

        if (content.length > maxLength) {
            return {
                valid: false,
                error: `Content too long. Maximum ${maxLength} characters, got ${content.length}`
            };
        }

        return { valid: true };
    }

    /**
     * Create Content Security Policy header value
     * @returns {string} CSP header value
     */
    static getCSPHeader() {
        return [
            "default-src 'self'",
            "script-src 'self' https://www.gstatic.com https://www.google.com https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net",
            "frame-src 'self' https://www.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ].join('; ');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityHelpers;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SecurityHelpers = SecurityHelpers;
}

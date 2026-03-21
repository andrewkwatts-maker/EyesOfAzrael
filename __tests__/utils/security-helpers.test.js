/**
 * Security Helpers Tests
 * Tests for js/utils/security-helpers.js
 */

describe('SecurityHelpers', () => {
    let SecurityHelpers;

    beforeEach(() => {
        // Mock crypto.subtle for hashData
        if (!global.crypto) {
            global.crypto = {};
        }
        if (!global.crypto.subtle) {
            global.crypto.subtle = {
                digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
            };
        }
        global.crypto.getRandomValues = jest.fn((arr) => {
            for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
            return arr;
        });

        // Mock navigator.doNotTrack
        Object.defineProperty(navigator, 'doNotTrack', {
            value: '0',
            writable: true,
            configurable: true
        });

        SecurityHelpers = require('../../js/utils/security-helpers.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    describe('escapeHtml', () => {
        test('should escape HTML special characters', () => {
            const result = SecurityHelpers.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;');
        });

        test('should return empty string for null/undefined', () => {
            expect(SecurityHelpers.escapeHtml(null)).toBe('');
            expect(SecurityHelpers.escapeHtml(undefined)).toBe('');
            expect(SecurityHelpers.escapeHtml('')).toBe('');
        });

        test('should return empty string for non-string input', () => {
            expect(SecurityHelpers.escapeHtml(123)).toBe('');
        });

        test('should pass through safe text unchanged', () => {
            expect(SecurityHelpers.escapeHtml('Hello World')).toBe('Hello World');
        });
    });

    describe('sanitizeHtml', () => {
        test('should remove script tags', () => {
            const result = SecurityHelpers.sanitizeHtml('<div>Safe</div><script>alert("bad")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('Safe');
        });

        test('should remove event handlers', () => {
            const result = SecurityHelpers.sanitizeHtml('<div onclick="alert(1)">Click</div>');
            expect(result).not.toContain('onclick');
        });

        test('should remove javascript: URLs', () => {
            const result = SecurityHelpers.sanitizeHtml('<a href="javascript:alert(1)">Link</a>');
            expect(result).not.toContain('javascript:');
        });

        test('should return empty string for null/undefined', () => {
            expect(SecurityHelpers.sanitizeHtml(null)).toBe('');
            expect(SecurityHelpers.sanitizeHtml(undefined)).toBe('');
        });
    });

    describe('sanitizeFileName', () => {
        test('should remove path traversal attempts', () => {
            expect(SecurityHelpers.sanitizeFileName('../../etc/passwd')).not.toContain('..');
        });

        test('should remove slashes', () => {
            const result = SecurityHelpers.sanitizeFileName('path/to/file.txt');
            expect(result).not.toContain('/');
        });

        test('should replace special characters with underscores', () => {
            const result = SecurityHelpers.sanitizeFileName('file name!@#.txt');
            expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
        });

        test('should prevent hidden files (dot prefix)', () => {
            const result = SecurityHelpers.sanitizeFileName('.hidden');
            expect(result).not.toMatch(/^\./);
        });

        test('should return empty string for null/undefined', () => {
            expect(SecurityHelpers.sanitizeFileName(null)).toBe('');
        });
    });

    describe('isValidEmail', () => {
        test('should validate correct emails', () => {
            expect(SecurityHelpers.isValidEmail('user@example.com')).toBe(true);
            expect(SecurityHelpers.isValidEmail('name.surname@domain.co.uk')).toBe(true);
        });

        test('should reject invalid emails', () => {
            expect(SecurityHelpers.isValidEmail('not-an-email')).toBe(false);
            expect(SecurityHelpers.isValidEmail('@domain.com')).toBe(false);
            expect(SecurityHelpers.isValidEmail('user@')).toBe(false);
        });

        test('should return false for null/undefined', () => {
            expect(SecurityHelpers.isValidEmail(null)).toBe(false);
            expect(SecurityHelpers.isValidEmail(undefined)).toBe(false);
        });
    });

    describe('isValidUrl', () => {
        test('should validate http/https URLs', () => {
            expect(SecurityHelpers.isValidUrl('https://example.com')).toBe(true);
            expect(SecurityHelpers.isValidUrl('http://localhost:3000')).toBe(true);
        });

        test('should block javascript: URLs by default', () => {
            expect(SecurityHelpers.isValidUrl('javascript:alert(1)')).toBe(false);
        });

        test('should block data:text/javascript URLs', () => {
            expect(SecurityHelpers.isValidUrl('data:text/javascript,alert(1)')).toBe(false);
        });

        test('should return false for null/undefined', () => {
            expect(SecurityHelpers.isValidUrl(null)).toBe(false);
        });

        test('should return false for invalid URLs', () => {
            expect(SecurityHelpers.isValidUrl('not a url')).toBe(false);
        });
    });

    describe('isValidEntityId', () => {
        test('should validate proper IDs', () => {
            expect(SecurityHelpers.isValidEntityId('zeus')).toBe(true);
            expect(SecurityHelpers.isValidEntityId('greek-zeus')).toBe(true);
            expect(SecurityHelpers.isValidEntityId('entity_123')).toBe(true);
        });

        test('should reject invalid IDs', () => {
            expect(SecurityHelpers.isValidEntityId('')).toBe(false);
            expect(SecurityHelpers.isValidEntityId(null)).toBe(false);
            expect(SecurityHelpers.isValidEntityId('has spaces')).toBe(false);
            expect(SecurityHelpers.isValidEntityId('<script>')).toBe(false);
        });

        test('should reject IDs over 100 chars', () => {
            expect(SecurityHelpers.isValidEntityId('a'.repeat(101))).toBe(false);
        });
    });

    describe('isValidCollection', () => {
        test('should accept valid collections', () => {
            expect(SecurityHelpers.isValidCollection('deities')).toBe(true);
            expect(SecurityHelpers.isValidCollection('heroes')).toBe(true);
            expect(SecurityHelpers.isValidCollection('creatures')).toBe(true);
        });

        test('should reject invalid collections', () => {
            expect(SecurityHelpers.isValidCollection('invalid')).toBe(false);
            expect(SecurityHelpers.isValidCollection('')).toBe(false);
        });
    });

    describe('sanitizeSearchQuery', () => {
        test('should remove NoSQL operators', () => {
            const result = SecurityHelpers.sanitizeSearchQuery('$gt: 5');
            expect(result).not.toContain('$');
        });

        test('should limit length to 200 chars', () => {
            const longQuery = 'a'.repeat(300);
            expect(SecurityHelpers.sanitizeSearchQuery(longQuery).length).toBeLessThanOrEqual(200);
        });

        test('should trim whitespace', () => {
            expect(SecurityHelpers.sanitizeSearchQuery('  hello  ')).toBe('hello');
        });

        test('should return empty string for null/undefined', () => {
            expect(SecurityHelpers.sanitizeSearchQuery(null)).toBe('');
        });
    });

    describe('generateCsrfToken', () => {
        test('should generate a 64-character hex string', () => {
            const token = SecurityHelpers.generateCsrfToken();
            expect(token).toMatch(/^[0-9a-f]{64}$/);
        });
    });

    describe('validateCsrfToken', () => {
        test('should return true for matching tokens', () => {
            expect(SecurityHelpers.validateCsrfToken('abc123', 'abc123')).toBe(true);
        });

        test('should return false for non-matching tokens', () => {
            expect(SecurityHelpers.validateCsrfToken('abc123', 'xyz789')).toBe(false);
        });

        test('should return false for different length tokens', () => {
            expect(SecurityHelpers.validateCsrfToken('short', 'muchlonger')).toBe(false);
        });

        test('should return false for null tokens', () => {
            expect(SecurityHelpers.validateCsrfToken(null, 'token')).toBe(false);
            expect(SecurityHelpers.validateCsrfToken('token', null)).toBe(false);
        });
    });

    describe('validateFileUpload', () => {
        test('should accept valid files', () => {
            const file = { name: 'photo.jpg', size: 1024, type: 'image/jpeg' };
            expect(SecurityHelpers.validateFileUpload(file).valid).toBe(true);
        });

        test('should reject files over size limit', () => {
            const file = { name: 'big.jpg', size: 10 * 1024 * 1024, type: 'image/jpeg' };
            const result = SecurityHelpers.validateFileUpload(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too large');
        });

        test('should reject invalid MIME types', () => {
            const file = { name: 'script.js', size: 100, type: 'text/javascript' };
            expect(SecurityHelpers.validateFileUpload(file).valid).toBe(false);
        });

        test('should reject suspicious double extensions', () => {
            const file = { name: 'image.php.jpg', size: 100, type: 'image/jpeg' };
            expect(SecurityHelpers.validateFileUpload(file).valid).toBe(false);
        });

        test('should return error for no file', () => {
            expect(SecurityHelpers.validateFileUpload(null).valid).toBe(false);
        });
    });

    describe('escapeRegex', () => {
        test('should escape regex special characters', () => {
            const result = SecurityHelpers.escapeRegex('hello.world*');
            expect(result).toBe('hello\\.world\\*');
        });

        test('should return empty string for null', () => {
            expect(SecurityHelpers.escapeRegex(null)).toBe('');
        });
    });

    describe('isAllowedOrigin', () => {
        test('should allow default origins', () => {
            expect(SecurityHelpers.isAllowedOrigin('https://eyesofazrael.com')).toBe(true);
            expect(SecurityHelpers.isAllowedOrigin('http://localhost:3000')).toBe(true);
        });

        test('should allow custom origins', () => {
            expect(SecurityHelpers.isAllowedOrigin('https://custom.com', ['https://custom.com'])).toBe(true);
        });

        test('should reject unknown origins', () => {
            expect(SecurityHelpers.isAllowedOrigin('https://evil.com')).toBe(false);
        });

        test('should return false for null origin', () => {
            expect(SecurityHelpers.isAllowedOrigin(null)).toBe(false);
        });
    });

    describe('checkRateLimit', () => {
        test('should allow requests under the limit', () => {
            const store = new Map();
            const result = SecurityHelpers.checkRateLimit('user1', 5, 60000, store);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
        });

        test('should block after exceeding limit', () => {
            const store = new Map();
            for (let i = 0; i < 5; i++) {
                SecurityHelpers.checkRateLimit('user1', 5, 60000, store);
            }
            const result = SecurityHelpers.checkRateLimit('user1', 5, 60000, store);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    describe('anonymizeUserData', () => {
        test('should remove sensitive fields', () => {
            const data = { email: 'user@test.com', password: 'secret', name: 'John' };
            const result = SecurityHelpers.anonymizeUserData(data);
            expect(result.email).toBeUndefined();
            expect(result.password).toBeUndefined();
            expect(result.name).toBe('John');
        });

        test('should mask user ID', () => {
            const result = SecurityHelpers.anonymizeUserData({ userId: 'abc123456' });
            expect(result.userId).toBe('abc1***');
        });

        test('should return empty object for null', () => {
            expect(SecurityHelpers.anonymizeUserData(null)).toEqual({});
        });
    });

    describe('sanitizeErrorMessage', () => {
        test('should mask IP addresses', () => {
            const result = SecurityHelpers.sanitizeErrorMessage('Error at 192.168.1.1');
            expect(result).toContain('[IP]');
            expect(result).not.toContain('192.168.1.1');
        });

        test('should mask passwords', () => {
            const result = SecurityHelpers.sanitizeErrorMessage('password=secret123');
            expect(result).toContain('***');
        });

        test('should handle Error objects', () => {
            const result = SecurityHelpers.sanitizeErrorMessage(new Error('Something failed'));
            expect(result).toContain('Something failed');
        });
    });

    describe('validateContentLength', () => {
        test('should accept content within limits', () => {
            expect(SecurityHelpers.validateContentLength('Hello', 100).valid).toBe(true);
        });

        test('should reject content over limit', () => {
            const result = SecurityHelpers.validateContentLength('a'.repeat(200), 100);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too long');
        });

        test('should reject null/empty content', () => {
            expect(SecurityHelpers.validateContentLength(null).valid).toBe(false);
            expect(SecurityHelpers.validateContentLength('').valid).toBe(false);
        });
    });

    describe('getCSPHeader', () => {
        test('should return a valid CSP string', () => {
            const csp = SecurityHelpers.getCSPHeader();
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain('script-src');
            expect(csp).toContain('object-src');
        });
    });
});

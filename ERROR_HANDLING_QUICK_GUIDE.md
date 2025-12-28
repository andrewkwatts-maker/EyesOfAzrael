# Error Handling Quick Reference Guide
**Eyes of Azrael Project - For Developers**

---

## Quick Error Handling Patterns

### 1. Basic Try-Catch Pattern

```javascript
async function fetchEntity(id) {
    try {
        const doc = await db.collection('deities').doc(id).get();
        return doc.data();
    } catch (error) {
        // Log for debugging
        console.error('[ERROR] Failed to fetch entity:', error);

        // Show user-friendly message
        showToast(getUserFriendlyMessage(error), 'error');

        // Return safe default or re-throw
        return null;
    }
}
```

### 2. Retry with Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            const delay = initialDelay * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Usage
const data = await retryWithBackoff(() => fetchEntity('zeus'));
```

### 3. User-Friendly Error Messages

```javascript
function getUserFriendlyMessage(error) {
    const errorMap = {
        'permission-denied': 'You do not have permission to perform this action',
        'not-found': 'The requested item could not be found',
        'unavailable': 'Service temporarily unavailable. Please try again',
        'unauthenticated': 'Please sign in to continue',
        'network-error': 'Please check your internet connection'
    };

    const code = error.code || error.message;
    return errorMap[code] || 'An error occurred. Please try again.';
}
```

### 4. Form Validation

```javascript
function validateForm(data) {
    const errors = {};

    // Required field
    if (!data.name?.trim()) {
        errors.name = 'Name is required';
    }

    // Minimum length
    if (data.name && data.name.length < 2) {
        errors.name = 'Name must be at least 2 characters';
    }

    // Email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Please enter a valid email address';
    }

    // URL format
    if (data.url && !/^https?:\/\/.+/.test(data.url)) {
        errors.url = 'Please enter a valid URL starting with http:// or https://';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}
```

### 5. Network Error Detection

```javascript
function isNetworkError(error) {
    return (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('network') ||
        !navigator.onLine
    );
}

// Handle network errors gracefully
try {
    await saveData();
} catch (error) {
    if (isNetworkError(error)) {
        // Queue for retry when online
        queueForRetry(saveData);
        showToast('Saved locally. Will sync when online.', 'info');
    } else {
        throw error;
    }
}
```

### 6. Firestore Error Handling

```javascript
async function firestoreOperation() {
    try {
        await db.collection('entities').doc('id').get();
    } catch (error) {
        switch (error.code) {
            case 'permission-denied':
                showToast('Permission denied', 'error');
                redirectToLogin();
                break;

            case 'not-found':
                showToast('Entity not found', 'error');
                break;

            case 'unavailable':
                // Retry with backoff
                return await retryWithBackoff(firestoreOperation);

            case 'unauthenticated':
                showToast('Please sign in', 'error');
                redirectToLogin();
                break;

            default:
                console.error('Firestore error:', error);
                showToast('An error occurred', 'error');
        }
    }
}
```

### 7. Optimistic Updates with Rollback

```javascript
async function saveEntityOptimistically(entity) {
    // Save snapshot for rollback
    const snapshot = { ...entity };

    // Update UI immediately
    updateUI(entity);

    try {
        // Save to server
        await db.collection('entities').doc(entity.id).set(entity);
    } catch (error) {
        // Rollback on error
        updateUI(snapshot);
        showToast('Failed to save. Changes reverted.', 'error');
        throw error;
    }
}
```

### 8. Circuit Breaker Pattern

```javascript
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }

    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }
}

// Usage
const breaker = new CircuitBreaker();
const data = await breaker.execute(() => fetchData());
```

### 9. Error Logging with Context

```javascript
function logError(error, context = {}) {
    console.error('[ERROR]', error.message, {
        userId: getCurrentUser()?.id,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        ...context,
        stack: error.stack
    });

    // Track in analytics
    if (window.AnalyticsManager) {
        window.AnalyticsManager.trackError(error.message, context);
    }
}

// Usage
try {
    await dangerousOperation();
} catch (error) {
    logError(error, {
        operation: 'dangerousOperation',
        entityId: 'zeus-123',
        collection: 'deities'
    });
}
```

### 10. Input Sanitization (XSS Prevention)

```javascript
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Usage
element.innerHTML = `<p>${escapeHtml(userInput)}</p>`;
```

---

## Firestore Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `permission-denied` | No permission | Show auth prompt |
| `not-found` | Document doesn't exist | Handle gracefully |
| `unavailable` | Service down | Retry with backoff |
| `unauthenticated` | Not logged in | Redirect to login |
| `already-exists` | Duplicate | Update instead |
| `resource-exhausted` | Quota exceeded | Show maintenance message |
| `deadline-exceeded` | Timeout | Retry |
| `cancelled` | User cancelled | Clean up |
| `invalid-argument` | Bad data | Validate input |
| `aborted` | Transaction failed | Retry |

---

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Validate input |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Handle gracefully |
| 429 | Rate Limit | Retry after delay |
| 500 | Server Error | Retry or show error |
| 503 | Unavailable | Retry with backoff |

---

## Testing Error Handling

### Test Template

```javascript
describe('Error Handling', () => {
    test('should handle [error scenario]', async () => {
        // Arrange
        const mockError = new Error('[error message]');
        mockError.code = '[error-code]';
        mockService.method.mockRejectedValue(mockError);

        // Act
        await component.performAction();

        // Assert
        expect(console.error).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(
            expect.stringContaining('[user message]'),
            'error'
        );
    });
});
```

---

## Best Practices

### ✅ DO

- Always use try-catch for async operations
- Show user-friendly error messages
- Log errors with context for debugging
- Implement retry logic for transient errors
- Clean up resources in finally blocks
- Validate user input before submission
- Sanitize user input to prevent XSS
- Track errors in analytics
- Test error scenarios thoroughly

### ❌ DON'T

- Show technical error messages to users
- Expose stack traces in production
- Ignore errors silently
- Use empty catch blocks
- Let errors crash the app
- Trust user input
- Leave event listeners attached after errors
- Skip error logging
- Forget to test error paths

---

## Error Recovery Checklist

- [ ] Try-catch around async operations
- [ ] User-friendly error message shown
- [ ] Error logged with context
- [ ] Retry logic for transient errors
- [ ] Fallback behavior implemented
- [ ] State restored after error
- [ ] Resources cleaned up
- [ ] User can recover without reload
- [ ] Analytics event tracked
- [ ] Tests cover error scenario

---

## Common Patterns

### 1. Fetch with Timeout

```javascript
function fetchWithTimeout(url, timeout = 5000) {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}
```

### 2. Safe JSON Parse

```javascript
function safeJsonParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.warn('JSON parse failed:', error);
        return defaultValue;
    }
}
```

### 3. Debounced Error Handler

```javascript
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const debouncedError = debounce((error) => {
    showToast(error.message, 'error');
}, 300);
```

### 4. Offline Queue

```javascript
class OfflineQueue {
    constructor() {
        this.queue = [];
        window.addEventListener('online', () => this.process());
    }

    add(fn) {
        this.queue.push(fn);
    }

    async process() {
        while (this.queue.length > 0) {
            const fn = this.queue.shift();
            try {
                await fn();
            } catch (error) {
                this.queue.unshift(fn); // Re-queue on failure
                break;
            }
        }
    }
}
```

---

## Resources

- **Test File:** `__tests__/error-handling-comprehensive.test.js`
- **Full Report:** `ERROR_HANDLING_TEST_REPORT.md`
- **Firebase Docs:** https://firebase.google.com/docs/reference/js/firebase.firestore
- **MDN Error Reference:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

---

**Last Updated:** December 28, 2025
**Maintained by:** Test Polish Agent 3

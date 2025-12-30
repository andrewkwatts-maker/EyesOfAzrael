/**
 * Loading Spinner Utility
 * Provides consistent loading states across all Firebase data fetches
 */

class LoadingSpinnerManager {
    constructor() {
        this.activeSpinners = new Map(); // Track all active spinners by ID
        this.timeouts = new Map(); // Track timeouts for auto-cleanup
    }

    /**
     * Show a loading spinner in a container
     * @param {string} containerId - ID of container element
     * @param {Object} options - Configuration options
     * @returns {string} - Spinner ID for later removal
     */
    show(containerId, options = {}) {
        const {
            message = 'Loading...',
            size = 'medium', // 'small', 'medium', 'large'
            timeout = 10000, // 10 seconds default
            onTimeout = null,
            inline = false, // If true, adds spinner inline instead of replacing content
            className = ''
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[LoadingSpinner] Container not found: ${containerId}`);
            return null;
        }

        const spinnerId = `spinner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Store original content if not inline
        const originalContent = inline ? null : container.innerHTML;

        // Create spinner HTML
        const spinnerHTML = this.getSpinnerHTML(message, size, spinnerId, className);

        // Insert spinner
        if (inline) {
            const spinnerWrapper = document.createElement('div');
            spinnerWrapper.className = 'loading-spinner-inline';
            spinnerWrapper.innerHTML = spinnerHTML;
            container.appendChild(spinnerWrapper);
        } else {
            container.innerHTML = spinnerHTML;
        }

        // Track spinner
        this.activeSpinners.set(spinnerId, {
            containerId,
            originalContent,
            inline,
            startTime: Date.now()
        });

        // Set timeout for auto-cleanup
        if (timeout > 0) {
            const timeoutId = setTimeout(() => {
                console.warn(`[LoadingSpinner] Timeout reached for ${containerId} (${timeout}ms)`);
                this.hide(spinnerId);
                if (onTimeout) {
                    onTimeout();
                }
            }, timeout);
            this.timeouts.set(spinnerId, timeoutId);
        }

        return spinnerId;
    }

    /**
     * Hide a loading spinner with smooth fade-out transition
     * @param {string} spinnerId - Spinner ID returned from show()
     * @param {string|null} replacementHTML - Optional HTML to replace spinner with
     * @param {Object} options - Transition options
     */
    hide(spinnerId, replacementHTML = null, options = {}) {
        const { fadeOut = true, fadeOutDuration = 300 } = options;

        if (!this.activeSpinners.has(spinnerId)) {
            console.warn(`[LoadingSpinner] Spinner not found: ${spinnerId}`);
            return;
        }

        const spinner = this.activeSpinners.get(spinnerId);
        const container = document.getElementById(spinner.containerId);

        if (!container) {
            console.warn(`[LoadingSpinner] Container no longer exists: ${spinner.containerId}`);
            this.activeSpinners.delete(spinnerId);
            return;
        }

        // Clear timeout
        if (this.timeouts.has(spinnerId)) {
            clearTimeout(this.timeouts.get(spinnerId));
            this.timeouts.delete(spinnerId);
        }

        // Calculate load time
        const loadTime = Date.now() - spinner.startTime;
        console.log(`[LoadingSpinner] Loaded ${spinner.containerId} in ${loadTime}ms`);

        // Get the spinner element
        const spinnerElement = container.querySelector(`[data-spinner-id="${spinnerId}"]`);

        // Helper function to replace content
        const replaceContent = () => {
            if (spinner.inline) {
                // Remove inline spinner element
                if (spinnerElement) {
                    spinnerElement.remove();
                }
            } else {
                // Replace entire content
                if (replacementHTML) {
                    container.innerHTML = replacementHTML;
                } else if (spinner.originalContent) {
                    container.innerHTML = spinner.originalContent;
                } else {
                    container.innerHTML = '';
                }
                // Add fade-in class to new content
                container.classList.add('content-loaded');
            }
            this.activeSpinners.delete(spinnerId);
        };

        // Apply fade-out transition if enabled
        if (fadeOut && spinnerElement) {
            spinnerElement.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
            spinnerElement.style.opacity = '0';
            setTimeout(replaceContent, fadeOutDuration);
        } else {
            replaceContent();
        }
    }

    /**
     * Update spinner message
     * @param {string} spinnerId - Spinner ID
     * @param {string} message - New message
     */
    updateMessage(spinnerId, message) {
        if (!this.activeSpinners.has(spinnerId)) {
            return;
        }

        const spinner = this.activeSpinners.get(spinnerId);
        const container = document.getElementById(spinner.containerId);
        if (!container) return;

        const messageElement = container.querySelector(`[data-spinner-id="${spinnerId}"] .spinner-message`);
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    /**
     * Get spinner HTML - Uses sacred geometry for mystical loading experience
     * @param {string} message - Loading message
     * @param {string} size - Spinner size
     * @param {string} spinnerId - Unique spinner ID
     * @param {string} className - Additional CSS classes
     * @returns {string} - Spinner HTML
     */
    getSpinnerHTML(message, size, spinnerId, className = '') {
        const sizeClass = `spinner-${size}`;

        // Use sacred geometry loader for the mystical mythology experience
        return `
            <div class="loading-spinner-wrapper ${className}" data-spinner-id="${spinnerId}">
                <div class="sacred-loader ${sizeClass}" role="status" aria-label="Loading">
                    <div class="sacred-loader-ring"></div>
                    <div class="sacred-loader-ring"></div>
                    <div class="sacred-loader-ring"></div>
                    <div class="sacred-loader-center"></div>
                </div>
                ${message ? `<p class="spinner-message">${this.getAtmosphericMessage(message)}</p>` : ''}
            </div>
        `;
    }

    /**
     * Transform a standard loading message into something more atmospheric
     * @param {string} message - Original message
     * @returns {string} - Atmospheric message
     */
    getAtmosphericMessage(message) {
        // Map standard messages to more mystical alternatives
        const atmosphericMessages = {
            'Loading...': 'Summoning ancient wisdom...',
            'Loading': 'Summoning ancient wisdom...',
            'loading...': 'Summoning ancient wisdom...',
            'Loading entities...': 'Awakening the old gods...',
            'Loading entity...': 'Invoking the spirit...',
            'Searching...': 'Consulting the oracles...',
            'Please wait...': 'The veil parts slowly...',
            'Fetching data...': 'Reading the sacred texts...'
        };

        return atmosphericMessages[message] || message;
    }

    /**
     * Wrap a Promise with a loading spinner
     * @param {string} containerId - Container element ID
     * @param {Promise} promise - Promise to wrap
     * @param {Object} options - Spinner options
     * @returns {Promise} - Original promise (spinner auto-hides on resolve/reject)
     */
    async wrapPromise(containerId, promise, options = {}) {
        const spinnerId = this.show(containerId, options);

        try {
            const result = await promise;
            this.hide(spinnerId);
            return result;
        } catch (error) {
            this.hide(spinnerId);
            throw error;
        }
    }

    /**
     * Show spinner for multiple parallel operations
     * @param {string} containerId - Container element ID
     * @param {Array<Promise>} promises - Array of promises
     * @param {Object} options - Spinner options
     * @returns {Promise<Array>} - Results from Promise.all()
     */
    async wrapAll(containerId, promises, options = {}) {
        const {
            message = 'Loading...',
            progressUpdates = false // If true, updates message with progress
        } = options;

        const spinnerId = this.show(containerId, { ...options, message });

        if (progressUpdates) {
            let completed = 0;
            const total = promises.length;

            const wrappedPromises = promises.map(async (promise) => {
                const result = await promise;
                completed++;
                this.updateMessage(spinnerId, `Loading... (${completed}/${total})`);
                return result;
            });

            try {
                const results = await Promise.all(wrappedPromises);
                this.hide(spinnerId);
                return results;
            } catch (error) {
                this.hide(spinnerId);
                throw error;
            }
        } else {
            try {
                const results = await Promise.all(promises);
                this.hide(spinnerId);
                return results;
            } catch (error) {
                this.hide(spinnerId);
                throw error;
            }
        }
    }

    /**
     * Clear all active spinners
     */
    clearAll() {
        for (const spinnerId of this.activeSpinners.keys()) {
            this.hide(spinnerId);
        }
    }

    /**
     * Get count of active spinners
     * @returns {number}
     */
    getActiveCount() {
        return this.activeSpinners.size;
    }
}

// Global singleton instance
const loadingSpinner = new LoadingSpinnerManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = loadingSpinner;
}

// Make available globally
window.loadingSpinner = loadingSpinner;

console.log('[LoadingSpinner] Utility loaded');

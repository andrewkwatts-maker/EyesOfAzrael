/**
 * Transition Manager Module
 * Handles page transition animations
 *
 * Usage:
 *   await TransitionManager.applyExitTransition(element);
 *   // ... render new content ...
 *   await TransitionManager.applyEnterTransition(element);
 */

const TransitionManager = {
    _enabled: true,
    _exitDuration: 200,
    _enterDuration: 300,

    /**
     * Enable or disable transitions
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
    },

    /**
     * Check if transitions are enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this._enabled;
    },

    /**
     * Apply exit transition to element
     * @param {HTMLElement} element - Element to transition
     * @returns {Promise} Resolves when transition completes
     */
    applyExitTransition(element) {
        if (!this._enabled || !element) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            element.classList.add('spa-transition-exit');

            requestAnimationFrame(() => {
                element.classList.add('spa-transition-exit-active');

                setTimeout(() => {
                    element.classList.remove('spa-transition-exit', 'spa-transition-exit-active');
                    resolve();
                }, this._exitDuration);
            });
        });
    },

    /**
     * Apply enter transition to element
     * @param {HTMLElement} element - Element to transition
     * @returns {Promise} Resolves when transition completes
     */
    applyEnterTransition(element) {
        if (!this._enabled || !element) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            element.classList.add('spa-transition-enter');

            requestAnimationFrame(() => {
                element.classList.add('spa-transition-enter-active');

                setTimeout(() => {
                    element.classList.remove('spa-transition-enter', 'spa-transition-enter-active');
                    resolve();
                }, this._enterDuration);
            });
        });
    },

    /**
     * Set transition durations
     * @param {Object} options - Duration options
     */
    setDurations({ exit, enter }) {
        if (typeof exit === 'number') this._exitDuration = exit;
        if (typeof enter === 'number') this._enterDuration = enter;
    },

    /**
     * Get current durations
     * @returns {Object}
     */
    getDurations() {
        return {
            exit: this._exitDuration,
            enter: this._enterDuration
        };
    },

    /**
     * Apply fade out effect
     * @param {HTMLElement} element
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    fadeOut(element, duration = 200) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    },

    /**
     * Apply fade in effect
     * @param {HTMLElement} element
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease-in`;

            requestAnimationFrame(() => {
                element.style.opacity = '1';

                setTimeout(() => {
                    element.style.transition = '';
                    resolve();
                }, duration);
            });
        });
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransitionManager;
}

// Export to window for browser usage
window.TransitionManager = TransitionManager;

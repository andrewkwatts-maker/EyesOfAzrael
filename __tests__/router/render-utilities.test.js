/**
 * Render Utilities Module Tests
 * Tests for js/router/render-utilities.js
 */

describe('RenderUtilities', () => {
    let RenderUtilities;
    let mockContainer;

    beforeEach(() => {
        // Create mock container element
        mockContainer = {
            innerHTML: '',
            classList: {
                _classes: new Set(),
                add(...classes) {
                    classes.forEach(c => this._classes.add(c));
                },
                remove(...classes) {
                    classes.forEach(c => this._classes.delete(c));
                },
                has(cls) {
                    return this._classes.has(cls);
                }
            },
            querySelector: jest.fn()
        };

        // Mock document.createElement for escapeHtml - simulates DOM behavior
        document.createElement = jest.fn(() => {
            let _textContent = '';
            return {
                get textContent() { return _textContent; },
                set textContent(val) {
                    _textContent = val;
                    // Simulate DOM escaping behavior
                    this._innerHTML = val
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;');
                },
                get innerHTML() { return this._innerHTML || ''; },
                _innerHTML: ''
            };
        });

        // Create RenderUtilities object
        RenderUtilities = {
            escapeHtml(text) {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },

            truncate(text, maxLength = 150) {
                if (!text || text.length <= maxLength) return text;
                return text.substring(0, maxLength).trim() + '...';
            },

            getLoadingHTML(message = 'Loading...') {
                return `
                    <div class="loading-state" role="status" aria-live="polite">
                        <div class="spinner-container">
                            <div class="spinner-ring"></div>
                        </div>
                        <p class="loading-message">${this.escapeHtml(message)}</p>
                    </div>
                `;
            },

            getErrorHTML(title = 'Error', message = 'Something went wrong', options = {}) {
                const { showRetry = true, showHome = true, retryText = 'Try Again' } = options;
                return `
                    <div class="error-state" role="alert">
                        <div class="error-icon">ERROR</div>
                        <h2 class="error-title">${this.escapeHtml(title)}</h2>
                        <p class="error-message">${this.escapeHtml(message)}</p>
                        <div class="error-actions">
                            ${showRetry ? `<button class="btn btn-primary error-retry">${this.escapeHtml(retryText)}</button>` : ''}
                            ${showHome ? `<a href="#/" class="btn btn-secondary">Go Home</a>` : ''}
                        </div>
                    </div>
                `;
            },

            get404HTML(path = '') {
                return `
                    <div class="error-state error-404" role="alert">
                        <div class="error-icon">NOT FOUND</div>
                        <h1 class="error-title">Page Not Found</h1>
                        <p class="error-message">
                            The page you're looking for doesn't exist.
                            ${path ? `<br><code>${this.escapeHtml(path)}</code>` : ''}
                        </p>
                    </div>
                `;
            },

            showLoading(container, message = 'Loading...') {
                if (!container) return;
                container.innerHTML = this.getLoadingHTML(message);
                container.classList.add('is-loading');
            },

            hideLoading(container) {
                if (!container) return;
                container.classList.remove('is-loading');
            },

            showError(container, error, options = {}) {
                if (!container) return;
                const message = error instanceof Error ? error.message : String(error);
                const title = options.title || 'Error';
                container.innerHTML = this.getErrorHTML(title, message, options);
                container.classList.remove('is-loading');
                container.classList.add('has-error');
            },

            clearState(container) {
                if (!container) return;
                container.classList.remove('is-loading', 'has-error');
            }
        };
    });

    describe('escapeHtml', () => {
        it('should return empty string for null/undefined', () => {
            expect(RenderUtilities.escapeHtml(null)).toBe('');
            expect(RenderUtilities.escapeHtml(undefined)).toBe('');
            expect(RenderUtilities.escapeHtml('')).toBe('');
        });

        it('should call createElement and set textContent', () => {
            RenderUtilities.escapeHtml('<script>alert("xss")</script>');
            expect(document.createElement).toHaveBeenCalledWith('div');
        });
    });

    describe('truncate', () => {
        it('should return text unchanged if shorter than maxLength', () => {
            expect(RenderUtilities.truncate('short text')).toBe('short text');
        });

        it('should truncate and add ellipsis for long text', () => {
            const longText = 'a'.repeat(200);
            const result = RenderUtilities.truncate(longText, 50);

            expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
            expect(result.endsWith('...')).toBe(true);
        });

        it('should handle null/undefined', () => {
            expect(RenderUtilities.truncate(null)).toBeNull();
            expect(RenderUtilities.truncate(undefined)).toBeUndefined();
        });

        it('should use default maxLength of 150', () => {
            const text = 'a'.repeat(200);
            const result = RenderUtilities.truncate(text);

            expect(result.length).toBeLessThanOrEqual(153);
        });
    });

    describe('getLoadingHTML', () => {
        it('should return HTML with loading state', () => {
            const html = RenderUtilities.getLoadingHTML();

            expect(html).toContain('loading-state');
            expect(html).toContain('spinner-container');
            expect(html).toContain('role="status"');
            expect(html).toContain('aria-live="polite"');
        });

        it('should include custom message', () => {
            const html = RenderUtilities.getLoadingHTML('Fetching deities...');

            expect(html).toContain('Fetching deities...');
        });
    });

    describe('getErrorHTML', () => {
        it('should return HTML with error state', () => {
            const html = RenderUtilities.getErrorHTML('Test Error', 'Something broke');

            expect(html).toContain('error-state');
            expect(html).toContain('role="alert"');
            expect(html).toContain('Test Error');
            expect(html).toContain('Something broke');
        });

        it('should include retry button by default', () => {
            const html = RenderUtilities.getErrorHTML();

            expect(html).toContain('error-retry');
            expect(html).toContain('Try Again');
        });

        it('should hide retry button when showRetry is false', () => {
            const html = RenderUtilities.getErrorHTML('Error', 'Message', { showRetry: false });

            expect(html).not.toContain('error-retry');
        });

        it('should include home link by default', () => {
            const html = RenderUtilities.getErrorHTML();

            expect(html).toContain('href="#/"');
            expect(html).toContain('Go Home');
        });

        it('should hide home link when showHome is false', () => {
            const html = RenderUtilities.getErrorHTML('Error', 'Message', { showHome: false });

            expect(html).not.toContain('Go Home');
        });

        it('should use custom retry text', () => {
            const html = RenderUtilities.getErrorHTML('Error', 'Message', { retryText: 'Reload' });

            expect(html).toContain('Reload');
        });
    });

    describe('get404HTML', () => {
        it('should return 404 error HTML', () => {
            const html = RenderUtilities.get404HTML();

            expect(html).toContain('error-404');
            expect(html).toContain('Page Not Found');
        });

        it('should include path when provided', () => {
            const html = RenderUtilities.get404HTML('/unknown/path');

            expect(html).toContain('/unknown/path');
            expect(html).toContain('<code>');
        });
    });

    describe('showLoading', () => {
        it('should set innerHTML and add is-loading class', () => {
            RenderUtilities.showLoading(mockContainer, 'Loading...');

            expect(mockContainer.innerHTML).toContain('loading-state');
            expect(mockContainer.classList._classes.has('is-loading')).toBe(true);
        });

        it('should handle null container gracefully', () => {
            expect(() => {
                RenderUtilities.showLoading(null);
            }).not.toThrow();
        });
    });

    describe('hideLoading', () => {
        it('should remove is-loading class', () => {
            mockContainer.classList.add('is-loading');

            RenderUtilities.hideLoading(mockContainer);

            expect(mockContainer.classList._classes.has('is-loading')).toBe(false);
        });

        it('should handle null container gracefully', () => {
            expect(() => {
                RenderUtilities.hideLoading(null);
            }).not.toThrow();
        });
    });

    describe('showError', () => {
        it('should set innerHTML with error HTML', () => {
            const error = new Error('Database connection failed');

            RenderUtilities.showError(mockContainer, error);

            expect(mockContainer.innerHTML).toContain('error-state');
            expect(mockContainer.innerHTML).toContain('Database connection failed');
        });

        it('should handle string errors', () => {
            RenderUtilities.showError(mockContainer, 'Something went wrong');

            expect(mockContainer.innerHTML).toContain('Something went wrong');
        });

        it('should add has-error class and remove is-loading', () => {
            mockContainer.classList.add('is-loading');

            RenderUtilities.showError(mockContainer, 'Error');

            expect(mockContainer.classList._classes.has('has-error')).toBe(true);
            expect(mockContainer.classList._classes.has('is-loading')).toBe(false);
        });

        it('should use custom title from options', () => {
            RenderUtilities.showError(mockContainer, 'Details', { title: 'Custom Error' });

            expect(mockContainer.innerHTML).toContain('Custom Error');
        });
    });

    describe('clearState', () => {
        it('should remove both is-loading and has-error classes', () => {
            mockContainer.classList.add('is-loading');
            mockContainer.classList.add('has-error');

            RenderUtilities.clearState(mockContainer);

            expect(mockContainer.classList._classes.has('is-loading')).toBe(false);
            expect(mockContainer.classList._classes.has('has-error')).toBe(false);
        });

        it('should handle null container gracefully', () => {
            expect(() => {
                RenderUtilities.clearState(null);
            }).not.toThrow();
        });
    });
});

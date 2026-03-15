/**
 * Accessibility Manager Tests
 * Tests for js/router/accessibility-manager.js
 */

describe('RouterAccessibilityManager', () => {
    let AccessibilityManager;

    beforeEach(() => {
        document.body.innerHTML = '';
        delete window.RouterAccessibilityManager;
        delete window.AccessibilityManager;

        // Mock requestAnimationFrame
        window.requestAnimationFrame = jest.fn(cb => cb());

        AccessibilityManager = require('../../js/router/accessibility-manager.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        AccessibilityManager._initialized = false;
    });

    describe('init()', () => {
        test('should create route announcer element', () => {
            AccessibilityManager.init();
            const announcer = document.getElementById('spa-route-announcer');
            expect(announcer).not.toBeNull();
            expect(announcer.getAttribute('role')).toBe('status');
            expect(announcer.getAttribute('aria-live')).toBe('polite');
            expect(announcer.getAttribute('aria-atomic')).toBe('true');
        });

        test('should create loading announcer element', () => {
            AccessibilityManager.init();
            const announcer = document.getElementById('spa-loading-announcer');
            expect(announcer).not.toBeNull();
            expect(announcer.getAttribute('role')).toBe('status');
            expect(announcer.getAttribute('aria-live')).toBe('assertive');
        });

        test('should be idempotent', () => {
            AccessibilityManager.init();
            AccessibilityManager.init();
            const announcers = document.querySelectorAll('#spa-route-announcer');
            expect(announcers.length).toBe(1);
        });

        test('should set initialized flag', () => {
            AccessibilityManager.init();
            expect(AccessibilityManager._initialized).toBe(true);
        });
    });

    describe('announceRouteChange()', () => {
        beforeEach(() => {
            AccessibilityManager.init();
        });

        test('should set route announcer text', () => {
            AccessibilityManager.announceRouteChange('Home');
            const announcer = document.getElementById('spa-route-announcer');
            expect(announcer.textContent).toBe('Navigated to Home');
        });

        test('should handle missing announcer gracefully', () => {
            document.getElementById('spa-route-announcer').remove();
            expect(() => AccessibilityManager.announceRouteChange('Test')).not.toThrow();
        });
    });

    describe('announceLoading()', () => {
        beforeEach(() => {
            AccessibilityManager.init();
        });

        test('should announce loading state', () => {
            AccessibilityManager.announceLoading(true, 'Loading content');
            const announcer = document.getElementById('spa-loading-announcer');
            expect(announcer.textContent).toBe('Loading content');
        });

        test('should clear announcement when not loading', () => {
            AccessibilityManager.announceLoading(true, 'Loading');
            AccessibilityManager.announceLoading(false);
            const announcer = document.getElementById('spa-loading-announcer');
            expect(announcer.textContent).toBe('');
        });

        test('should use default message', () => {
            AccessibilityManager.announceLoading(true);
            const announcer = document.getElementById('spa-loading-announcer');
            expect(announcer.textContent).toBe('Loading page');
        });

        test('should handle missing announcer gracefully', () => {
            document.getElementById('spa-loading-announcer').remove();
            expect(() => AccessibilityManager.announceLoading(true)).not.toThrow();
        });
    });

    describe('announce()', () => {
        beforeEach(() => {
            AccessibilityManager.init();
        });

        test('should announce with polite priority by default', () => {
            AccessibilityManager.announce('Test message');
            const announcer = document.getElementById('spa-route-announcer');
            expect(announcer.textContent).toBe('Test message');
        });

        test('should use assertive announcer for assertive priority', () => {
            AccessibilityManager.announce('Urgent message', 'assertive');
            const announcer = document.getElementById('spa-loading-announcer');
            expect(announcer.textContent).toBe('Urgent message');
        });

        test('should handle missing announcer gracefully', () => {
            document.body.innerHTML = '';
            expect(() => AccessibilityManager.announce('Test')).not.toThrow();
        });
    });

    describe('manageFocus()', () => {
        beforeEach(() => {
            AccessibilityManager.init();
        });

        test('should focus on heading in main content', () => {
            const main = document.createElement('div');
            main.id = 'main-content';
            const h1 = document.createElement('h1');
            h1.textContent = 'Page Title';
            h1.focus = jest.fn();
            main.appendChild(h1);
            document.body.appendChild(main);

            AccessibilityManager.manageFocus();
            expect(h1.getAttribute('tabindex')).toBe('-1');
            expect(h1.focus).toHaveBeenCalled();
        });

        test('should handle missing main content', () => {
            expect(() => AccessibilityManager.manageFocus()).not.toThrow();
        });

        test('should handle custom container ID', () => {
            const custom = document.createElement('div');
            custom.id = 'custom-content';
            const btn = document.createElement('button');
            btn.textContent = 'Click me';
            btn.focus = jest.fn();
            custom.appendChild(btn);
            document.body.appendChild(custom);

            AccessibilityManager.manageFocus('custom-content');
            expect(btn.focus).toHaveBeenCalled();
        });
    });

    describe('setFocus()', () => {
        test('should focus on element by selector', () => {
            const btn = document.createElement('button');
            btn.id = 'test-btn';
            btn.focus = jest.fn();
            document.body.appendChild(btn);

            AccessibilityManager.setFocus('#test-btn');
            expect(btn.focus).toHaveBeenCalled();
        });

        test('should focus on element reference', () => {
            const el = document.createElement('div');
            el.focus = jest.fn();
            document.body.appendChild(el);

            AccessibilityManager.setFocus(el);
            expect(el.getAttribute('tabindex')).toBe('-1');
            expect(el.focus).toHaveBeenCalled();
        });

        test('should handle non-existent selector', () => {
            expect(() => AccessibilityManager.setFocus('#nonexistent')).not.toThrow();
        });

        test('should not add tabindex to natively focusable elements', () => {
            const input = document.createElement('input');
            input.focus = jest.fn();
            document.body.appendChild(input);

            AccessibilityManager.setFocus(input);
            expect(input.hasAttribute('tabindex')).toBe(false);
        });
    });

    describe('createSkipLink()', () => {
        test('should create a skip link', () => {
            AccessibilityManager.createSkipLink('main-content');
            const skipLink = document.querySelector('.skip-link');
            expect(skipLink).not.toBeNull();
            expect(skipLink.textContent).toBe('Skip to main content');
            expect(skipLink.href).toContain('#main-content');
        });

        test('should accept custom text', () => {
            AccessibilityManager.createSkipLink('content', 'Jump to content');
            const skipLink = document.querySelector('.skip-link');
            expect(skipLink.textContent).toBe('Jump to content');
        });

        test('should not create duplicate skip links', () => {
            AccessibilityManager.createSkipLink('main-content');
            AccessibilityManager.createSkipLink('main-content');
            const skipLinks = document.querySelectorAll('.skip-link');
            expect(skipLinks.length).toBe(1);
        });
    });
});

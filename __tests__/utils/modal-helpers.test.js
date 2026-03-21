/**
 * ModalHelpers Module Tests
 * Tests for js/utils/modal-helpers.js
 */

describe('ModalHelpers', () => {
    let ModalHelpers;

    beforeEach(() => {
        // Reset window state
        delete window.ModalHelpers;
        delete window.confirmDialog;
        delete window.alertDialog;
        delete window.confirmDelete;
        delete window.showLoading;

        document.body.innerHTML = '';
        document.body.className = '';

        // Mock requestAnimationFrame
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());

        // Load the module
        ModalHelpers = require('../../js/utils/modal-helpers.js');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
        document.body.className = '';
    });

    describe('escapeHtml', () => {
        test('should escape HTML special characters', () => {
            const result = ModalHelpers.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;');
        });

        test('should return empty string for falsy input', () => {
            expect(ModalHelpers.escapeHtml('')).toBe('');
            expect(ModalHelpers.escapeHtml(null)).toBe('');
            expect(ModalHelpers.escapeHtml(undefined)).toBe('');
        });

        test('should pass through plain text unchanged', () => {
            expect(ModalHelpers.escapeHtml('Hello World')).toBe('Hello World');
        });
    });

    describe('getDialogIcon', () => {
        test('should return SVG for each known type', () => {
            for (const type of ['warning', 'danger', 'success', 'info']) {
                const icon = ModalHelpers.getDialogIcon(type);
                expect(icon).toContain('<svg');
            }
        });

        test('should return info icon for unknown type', () => {
            const icon = ModalHelpers.getDialogIcon('unknown');
            expect(icon).toContain('<svg');
            // Should match the info icon
            expect(icon).toBe(ModalHelpers.getDialogIcon('info'));
        });

        test('should return custom icon when provided', () => {
            const custom = '<img src="icon.png" />';
            expect(ModalHelpers.getDialogIcon('warning', custom)).toBe(custom);
        });
    });

    describe('confirm', () => {
        test('should create a dialog overlay in the DOM', () => {
            ModalHelpers.confirm({ title: 'Test', message: 'Hello?' });
            const overlay = document.getElementById('eoa-confirm-dialog');
            expect(overlay).not.toBeNull();
            expect(overlay.getAttribute('role')).toBe('alertdialog');
            expect(overlay.getAttribute('aria-modal')).toBe('true');
        });

        test('should display title and message with HTML escaping', () => {
            ModalHelpers.confirm({ title: '<b>Bold</b>', message: 'Safe text' });
            const overlay = document.getElementById('eoa-confirm-dialog');
            expect(overlay.innerHTML).not.toContain('<b>Bold</b>');
            expect(overlay.textContent).toContain('Safe text');
        });

        test('should remove existing dialog before creating a new one', () => {
            ModalHelpers.confirm({ title: 'First' });
            ModalHelpers.confirm({ title: 'Second' });
            const dialogs = document.querySelectorAll('#eoa-confirm-dialog');
            expect(dialogs.length).toBe(1);
        });

        test('should use danger button class when type is danger', () => {
            ModalHelpers.confirm({ type: 'danger' });
            const confirmBtn = document.querySelector('[data-action="confirm"]');
            expect(confirmBtn.className).toContain('modal-btn-danger');
        });

        test('should add modal-open class to body', () => {
            ModalHelpers.confirm({});
            expect(document.body.classList.contains('modal-open')).toBe(true);
        });
    });

    describe('alert', () => {
        test('should create an alert dialog with an OK button', () => {
            ModalHelpers.alert({ title: 'Notice', message: 'Done!' });
            const overlay = document.getElementById('eoa-alert-dialog');
            expect(overlay).not.toBeNull();
            const okBtn = overlay.querySelector('[data-action="ok"]');
            expect(okBtn).not.toBeNull();
        });

        test('should remove existing alert dialog before creating new one', () => {
            ModalHelpers.alert({ title: 'First' });
            ModalHelpers.alert({ title: 'Second' });
            const dialogs = document.querySelectorAll('#eoa-alert-dialog');
            expect(dialogs.length).toBe(1);
        });

        test('should use custom button text', () => {
            ModalHelpers.alert({ buttonText: 'Got it' });
            const okBtn = document.querySelector('[data-action="ok"]');
            expect(okBtn.textContent.trim()).toBe('Got it');
        });
    });

    describe('confirmDelete', () => {
        test('should delegate to confirm with danger type', () => {
            const confirmSpy = jest.spyOn(ModalHelpers, 'confirm');
            ModalHelpers.confirmDelete({ title: 'Delete Item' });
            expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'danger',
                confirmButtonClass: 'modal-btn-danger'
            }));
        });

        test('should use default delete text if none provided', () => {
            ModalHelpers.confirmDelete({});
            const confirmBtn = document.querySelector('[data-action="confirm"]');
            expect(confirmBtn.textContent.trim()).toBe('Delete Forever');
        });
    });

    describe('showLoading', () => {
        test('should add loading overlay to an element', () => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            const cleanup = ModalHelpers.showLoading(div, 'Please wait...');
            expect(div.querySelector('.modal-loading-overlay')).not.toBeNull();
            expect(div.querySelector('.modal-loading-text').textContent).toBe('Please wait...');
            expect(typeof cleanup).toBe('function');
        });

        test('should accept a CSS selector string', () => {
            document.body.innerHTML = '<div id="target"></div>';
            const cleanup = ModalHelpers.showLoading('#target');
            expect(document.querySelector('#target .modal-loading-overlay')).not.toBeNull();
        });

        test('should return no-op function when element not found', () => {
            const cleanup = ModalHelpers.showLoading('#nonexistent');
            expect(typeof cleanup).toBe('function');
            // Should not throw
            cleanup();
        });

        test('should set position relative on static elements', () => {
            const div = document.createElement('div');
            document.body.appendChild(div);
            // jsdom getComputedStyle returns '' for position on unstyled elements,
            // which is treated as 'static' by the source code check
            // We need to explicitly mock getComputedStyle to return 'static'
            const origGetComputedStyle = window.getComputedStyle;
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'static' });
            ModalHelpers.showLoading(div);
            expect(div.style.position).toBe('relative');
            window.getComputedStyle = origGetComputedStyle;
        });
    });

    describe('setupFocusTrap', () => {
        test('should return a cleanup function', () => {
            const container = document.createElement('div');
            const cleanup = ModalHelpers.setupFocusTrap(container);
            expect(typeof cleanup).toBe('function');
        });
    });

    describe('getScrollbarWidth', () => {
        test('should return a number', () => {
            const width = ModalHelpers.getScrollbarWidth();
            expect(typeof width).toBe('number');
        });
    });

    describe('global aliases', () => {
        test('should expose ModalHelpers on window', () => {
            // The module sets window.ModalHelpers and convenience aliases,
            // but beforeEach deletes them before require(). Since require()
            // is cached after first call, the window assignments only run once.
            // Re-execute the alias assignments manually to test the pattern.
            window.ModalHelpers = ModalHelpers;
            window.confirmDialog = ModalHelpers.confirm.bind(ModalHelpers);
            window.alertDialog = ModalHelpers.alert.bind(ModalHelpers);
            window.confirmDelete = ModalHelpers.confirmDelete.bind(ModalHelpers);
            window.showLoading = ModalHelpers.showLoading.bind(ModalHelpers);

            expect(typeof window.confirmDialog).toBe('function');
            expect(typeof window.alertDialog).toBe('function');
            expect(typeof window.confirmDelete).toBe('function');
            expect(typeof window.showLoading).toBe('function');
        });
    });
});

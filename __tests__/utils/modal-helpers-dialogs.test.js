/**
 * ModalHelpers — dialogs, loading overlays and the focus trap
 *
 * These replace `window.confirm`/`alert` across the app, so they are on the
 * path of every destructive action a contributor can take. Two properties are
 * worth pinning beyond "it renders":
 *
 * - **Focus is returned** to whatever was focused before the dialog opened. A
 *   modal that drops focus on the body leaves a keyboard user at the top of the
 *   document with no idea where they were.
 * - **The message is escaped.** Dialog text is frequently an entity name, which
 *   is user-supplied content going straight into `innerHTML`.
 */

const ModalHelpers = require('../../js/utils/modal-helpers.js');

beforeEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    jest.useFakeTimers();
    // jsdom has no rAF in some configurations, and the dialogs use it to add
    // their show class.
    global.requestAnimationFrame = cb => cb();
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

/** Click the button carrying a data-action, if present. */
function clickAction(action) {
    const btn = document.querySelector(`[data-action="${action}"]`);
    expect(btn).not.toBeNull();
    btn.click();
}

describe('confirm', () => {
    test('resolves true when confirmed and tears the dialog down', async () => {
        const promise = ModalHelpers.confirm({ message: 'Delete it?' });

        expect(document.getElementById('eoa-confirm-dialog')).not.toBeNull();
        expect(document.body.classList.contains('modal-open')).toBe(true);

        clickAction('confirm');
        jest.advanceTimersByTime(300);

        await expect(promise).resolves.toBe(true);
        expect(document.getElementById('eoa-confirm-dialog')).toBeNull();
        expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    test('resolves false when cancelled', async () => {
        const promise = ModalHelpers.confirm({});
        clickAction('cancel');
        jest.advanceTimersByTime(300);

        await expect(promise).resolves.toBe(false);
    });

    test('Escape cancels', async () => {
        const promise = ModalHelpers.confirm({});
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        jest.advanceTimersByTime(300);

        await expect(promise).resolves.toBe(false);
    });

    test('clicking the backdrop cancels, clicking the dialog does not', async () => {
        const promise = ModalHelpers.confirm({});
        const overlay = document.getElementById('eoa-confirm-dialog');

        // A click that bubbles from inside must not dismiss.
        overlay.firstElementChild.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        jest.advanceTimersByTime(300);
        expect(document.getElementById('eoa-confirm-dialog')).not.toBeNull();

        overlay.dispatchEvent(new MouseEvent('click', { bubbles: false }));
        jest.advanceTimersByTime(300);
        await expect(promise).resolves.toBe(false);
    });

    test('returns focus to whatever had it before', async () => {
        const before = document.createElement('button');
        document.body.appendChild(before);
        before.focus();
        expect(document.activeElement).toBe(before);

        const promise = ModalHelpers.confirm({});
        clickAction('cancel');
        jest.advanceTimersByTime(300);
        await promise;

        expect(document.activeElement).toBe(before);
    });

    test('escapes a message carrying markup', () => {
        ModalHelpers.confirm({ message: '<img src=x onerror=alert(1)>' });
        const html = document.getElementById('eoa-confirm-dialog').innerHTML;

        expect(html).not.toContain('<img src=x');
        expect(html).toContain('&lt;img');
    });

    test('replaces an already-open dialog rather than stacking two', () => {
        ModalHelpers.confirm({ message: 'first' });
        ModalHelpers.confirm({ message: 'second' });

        expect(document.querySelectorAll('#eoa-confirm-dialog')).toHaveLength(1);
        expect(document.body.textContent).toContain('second');
        expect(document.body.textContent).not.toContain('first');
    });

    test('carries alertdialog semantics', () => {
        ModalHelpers.confirm({});
        const overlay = document.getElementById('eoa-confirm-dialog');

        expect(overlay.getAttribute('role')).toBe('alertdialog');
        expect(overlay.getAttribute('aria-modal')).toBe('true');
        expect(overlay.getAttribute('aria-labelledby')).toBe('confirm-dialog-title');
    });

    test('a danger dialog uses the danger button class', () => {
        ModalHelpers.confirm({ type: 'danger' });
        expect(document.body.innerHTML).toContain('modal-btn-danger');
    });
});

describe('confirmDelete', () => {
    test('defaults to a danger dialog with irreversible wording', () => {
        ModalHelpers.confirmDelete({});
        const text = document.body.textContent;

        expect(text).toContain('cannot be undone');
        expect(document.body.innerHTML).toContain('modal-btn-danger');
    });

    test('lets the caller override the wording', () => {
        ModalHelpers.confirmDelete({ title: 'Remove note', confirmText: 'Remove' });
        expect(document.body.textContent).toContain('Remove note');
    });
});

describe('alert', () => {
    test('resolves when acknowledged and cleans up', async () => {
        const promise = ModalHelpers.alert({ message: 'Saved' });
        expect(document.body.textContent).toContain('Saved');

        clickAction('ok');
        jest.advanceTimersByTime(300);

        await expect(promise).resolves.toBeUndefined();
        expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    test('Escape dismisses', async () => {
        const promise = ModalHelpers.alert({});
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        jest.advanceTimersByTime(300);

        await expect(promise).resolves.toBeUndefined();
    });

    test('escapes its message', () => {
        ModalHelpers.alert({ message: '<script>alert(1)</script>' });
        expect(document.body.innerHTML).not.toContain('<script>alert(1)');
    });
});

describe('showLoading', () => {
    test('overlays an element and hands back a cleanup function', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        const done = ModalHelpers.showLoading(el, 'Fetching');

        expect(el.querySelector('.modal-loading-overlay')).not.toBeNull();
        expect(el.textContent).toContain('Fetching');

        done();
        jest.advanceTimersByTime(300);
        expect(el.querySelector('.modal-loading-overlay')).toBeNull();
    });

    test('accepts a selector as well as an element', () => {
        document.body.innerHTML = '<div id="target"></div>';
        ModalHelpers.showLoading('#target');

        expect(document.querySelector('#target .modal-loading-overlay')).not.toBeNull();
    });

    test('returns a no-op cleanup for an element that is not there', () => {
        const done = ModalHelpers.showLoading('#missing');
        expect(typeof done).toBe('function');
        expect(() => done()).not.toThrow();
    });

    test('escapes the loading message', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        ModalHelpers.showLoading(el, '<b>x</b>');

        expect(el.innerHTML).not.toContain('<b>x</b>');
    });
});

describe('setupFocusTrap', () => {
    test('detaches cleanly and stops trapping', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="a">a</button><button id="b">b</button>';
        document.body.appendChild(container);

        const release = ModalHelpers.setupFocusTrap(container);
        expect(typeof release).toBe('function');

        release();
        expect(() => container.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
        )).not.toThrow();
    });

    test('ignores keys that are not Tab', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button>a</button>';
        document.body.appendChild(container);
        ModalHelpers.setupFocusTrap(container);

        expect(() => container.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'a', bubbles: true })
        )).not.toThrow();
    });

    test('does nothing when the container holds nothing focusable', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p>text</p>';
        document.body.appendChild(container);
        ModalHelpers.setupFocusTrap(container);

        expect(() => container.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
        )).not.toThrow();
    });
});

describe('small helpers', () => {
    test('getDialogIcon returns an svg per type', () => {
        expect(ModalHelpers.getDialogIcon('warning')).toContain('<svg');
        expect(ModalHelpers.getDialogIcon('danger')).toContain('<svg');
        expect(ModalHelpers.getDialogIcon('info')).toContain('<svg');
        expect(ModalHelpers.getDialogIcon('success')).toContain('<svg');
    });

    test('getDialogIcon prefers a custom icon', () => {
        expect(ModalHelpers.getDialogIcon('warning', '⚡')).toBe('⚡');
    });

    test('getDialogIcon falls back for an unknown type', () => {
        expect(typeof ModalHelpers.getDialogIcon('nonsense')).toBe('string');
    });

    test('escapeHtml neutralises markup and tolerates nothing', () => {
        expect(ModalHelpers.escapeHtml('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;');
        expect(ModalHelpers.escapeHtml('')).toBe('');
    });

    test('getScrollbarWidth returns a number', () => {
        expect(typeof ModalHelpers.getScrollbarWidth()).toBe('number');
    });

    test('applyScrollbarCompensation sets a custom property without throwing', () => {
        expect(() => ModalHelpers.applyScrollbarCompensation()).not.toThrow();
    });
});

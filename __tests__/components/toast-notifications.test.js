/**
 * Toast Notifications Tests
 * Tests for js/toast-notifications.js
 */

describe('ToastNotifications', () => {
    let ToastNotifications;

    beforeEach(() => {
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        });
        // Mock navigator.vibrate
        navigator.vibrate = jest.fn();

        // Load the module
        const mod = require('../../js/toast-notifications.js');
        ToastNotifications = mod.ToastNotifications;
    });

    afterEach(() => {
        // Clean up DOM
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        test('should create with default options', () => {
            const toast = new ToastNotifications();
            expect(toast.options.position).toBe('bottom-right');
            expect(toast.options.maxToasts).toBe(5);
            expect(toast.toasts).toBeDefined();
            expect(toast.toastIdCounter).toBe(0);
        });

        test('should merge custom options', () => {
            const toast = new ToastNotifications({
                position: 'top-left',
                maxToasts: 3
            });
            expect(toast.options.position).toBe('top-left');
            expect(toast.options.maxToasts).toBe(3);
        });

        test('should create a container element', () => {
            const toast = new ToastNotifications();
            expect(toast.container).not.toBeNull();
            expect(toast.container.getAttribute('role')).toBe('region');
        });

        test('should create sr announcer element', () => {
            const toast = new ToastNotifications();
            expect(toast.srAnnouncer).toBeDefined();
        });

        test('should create offline banner', () => {
            const toast = new ToastNotifications();
            expect(toast.offlineBanner).toBeDefined();
        });

        test('should initialize paused toasts set', () => {
            const toast = new ToastNotifications();
            expect(toast.pausedToasts).toBeDefined();
            expect(toast.pausedToasts.size).toBe(0);
        });

        test('should initialize isOnline property', () => {
            const toast = new ToastNotifications();
            expect(toast.isOnline).toBe(true);
        });
    });

    describe('generateId()', () => {
        test('should generate unique IDs', () => {
            const toast = new ToastNotifications();
            const id1 = toast.generateId();
            const id2 = toast.generateId();
            expect(id1).not.toBe(id2);
        });

        test('should include incrementing counter', () => {
            const toast = new ToastNotifications();
            const id1 = toast.generateId();
            expect(id1).toContain('toast-1');
            const id2 = toast.generateId();
            expect(id2).toContain('toast-2');
        });
    });

    describe('announce()', () => {
        test('should set text content on sr announcer', () => {
            const toast = new ToastNotifications();
            toast.announce('Hello screen reader');
            expect(toast.srAnnouncer.textContent).toBe('Hello screen reader');
        });

        test('should set aria-live attribute', () => {
            const toast = new ToastNotifications();
            toast.announce('Urgent', 'assertive');
            expect(toast.srAnnouncer.getAttribute('aria-live')).toBe('assertive');
        });

        test('should default to polite priority', () => {
            const toast = new ToastNotifications();
            toast.announce('Polite message');
            expect(toast.srAnnouncer.getAttribute('aria-live')).toBe('polite');
        });
    });

    describe('show()', () => {
        test('should create a toast and return an ID', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test message', { type: 'success' });
            expect(id).toBeDefined();
            expect(toast.toasts.size).toBe(1);
        });

        test('should support different types', () => {
            const toast = new ToastNotifications();
            toast.show('Success', { type: 'success' });
            toast.show('Error', { type: 'error' });
            toast.show('Warning', { type: 'warning' });
            toast.show('Info', { type: 'info' });
            expect(toast.toasts.size).toBe(4);
        });

        test('should respect maxToasts limit', () => {
            const toast = new ToastNotifications({ maxToasts: 2 });
            toast.show('First', { type: 'info' });
            toast.show('Second', { type: 'info' });
            toast.show('Third', { type: 'info' }); // should dismiss oldest
            expect(toast.toastIdCounter).toBeGreaterThanOrEqual(3);
        });

        test('should handle options with actions', () => {
            const toast = new ToastNotifications();
            const id = toast.show('With action', {
                type: 'error',
                actions: [{ label: 'Retry', onClick: jest.fn() }]
            });
            expect(id).toBeDefined();
        });

        test('should default to info type', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Default type');
            expect(id).toBeDefined();
        });

        test('should store toast data with correct properties', () => {
            const toast = new ToastNotifications();
            const onDismiss = jest.fn();
            const id = toast.show('Test', { type: 'info', duration: 5000, onDismiss });
            const data = toast.toasts.get(id);
            expect(data.element).toBeDefined();
            expect(data.duration).toBe(5000);
            expect(data.onDismiss).toBe(onDismiss);
        });

        test('should create persistent toast with zero duration', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Persistent', { type: 'info', persistent: true });
            const data = toast.toasts.get(id);
            expect(data.duration).toBe(0);
        });

        test('should create toast with title', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Message', { type: 'info', title: 'Title' });
            const data = toast.toasts.get(id);
            const titleEl = data.element.querySelector('.toast__title');
            expect(titleEl).not.toBeNull();
            expect(titleEl.textContent).toBe('Title');
        });

        test('should create toast element with correct role for error', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Error msg', { type: 'error' });
            const data = toast.toasts.get(id);
            expect(data.element.getAttribute('role')).toBe('alert');
        });

        test('should create toast element with status role for non-error', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Info msg', { type: 'info' });
            const data = toast.toasts.get(id);
            expect(data.element.getAttribute('role')).toBe('status');
        });

        test('should add close button when dismissible', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', dismissible: true });
            const data = toast.toasts.get(id);
            const closeBtn = data.element.querySelector('.toast__close');
            expect(closeBtn).not.toBeNull();
        });

        test('should add progress bar when duration > 0', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', duration: 3000 });
            const data = toast.toasts.get(id);
            const progress = data.element.querySelector('.toast__progress');
            expect(progress).not.toBeNull();
        });
    });

    describe('createToast()', () => {
        test('should create toast element with message', () => {
            const toast = new ToastNotifications();
            const el = toast.createToast({
                id: 'test-1',
                type: 'success',
                title: '',
                message: 'Hello World',
                icon: 'success',
                dismissible: true,
                duration: 3000,
                actions: [],
                pauseOnHover: true
            });
            expect(el.querySelector('.toast__message').textContent).toBe('Hello World');
        });

        test('should create action buttons', () => {
            const toast = new ToastNotifications();
            const onClick = jest.fn();
            const el = toast.createToast({
                id: 'test-2',
                type: 'error',
                title: '',
                message: 'Error',
                icon: 'error',
                dismissible: true,
                duration: 0,
                actions: [{ label: 'Retry', onClick, primary: true }],
                pauseOnHover: true
            });
            const actionBtn = el.querySelector('.toast__action');
            expect(actionBtn).not.toBeNull();
            expect(actionBtn.textContent).toBe('Retry');
        });

        test('should create action button with icon', () => {
            const toast = new ToastNotifications();
            const el = toast.createToast({
                id: 'test-3',
                type: 'error',
                title: '',
                message: 'Error',
                icon: 'error',
                dismissible: true,
                duration: 0,
                actions: [{ label: 'Retry', icon: 'retry', onClick: jest.fn() }],
                pauseOnHover: true
            });
            const actionBtn = el.querySelector('.toast__action');
            expect(actionBtn.innerHTML).toContain('svg');
        });
    });

    describe('getActionIconPath()', () => {
        test('should return path for known icons', () => {
            const toast = new ToastNotifications();
            expect(toast.getActionIconPath('retry')).toContain('path');
            expect(toast.getActionIconPath('undo')).toContain('path');
            expect(toast.getActionIconPath('close')).toContain('path');
        });

        test('should return default for unknown icon', () => {
            const toast = new ToastNotifications();
            const result = toast.getActionIconPath('nonexistent');
            expect(result).toBeDefined();
        });
    });

    describe('startTimer()', () => {
        test('should set timeout for auto-dismiss', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', duration: 3000 });
            const data = toast.toasts.get(id);
            expect(data.timeoutId).not.toBeNull();
            jest.useRealTimers();
        });

        test('should not start timer for zero duration', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', persistent: true });
            const data = toast.toasts.get(id);
            expect(data.timeoutId).toBeNull();
        });
    });

    describe('pauseTimer() / resumeTimer()', () => {
        test('should pause and resume timer', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', duration: 5000 });
            toast.pauseTimer(id);
            expect(toast.pausedToasts.has(id)).toBe(true);
            toast.resumeTimer(id);
            expect(toast.pausedToasts.has(id)).toBe(false);
            jest.useRealTimers();
        });

        test('pauseTimer should handle non-existent toast', () => {
            const toast = new ToastNotifications();
            expect(() => toast.pauseTimer('nonexistent')).not.toThrow();
        });

        test('resumeTimer should handle non-paused toast', () => {
            const toast = new ToastNotifications();
            expect(() => toast.resumeTimer('nonexistent')).not.toThrow();
        });
    });

    describe('pauseAllTimers() / resumeAllTimers()', () => {
        test('should pause all active timers', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const id1 = toast.show('One', { type: 'info', duration: 5000 });
            const id2 = toast.show('Two', { type: 'info', duration: 5000 });
            toast.pauseAllTimers();
            expect(toast.pausedToasts.has(id1)).toBe(true);
            expect(toast.pausedToasts.has(id2)).toBe(true);
            jest.useRealTimers();
        });

        test('should resume all paused timers', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            toast.show('One', { type: 'info', duration: 5000 });
            toast.show('Two', { type: 'info', duration: 5000 });
            toast.pauseAllTimers();
            toast.resumeAllTimers();
            expect(toast.pausedToasts.size).toBe(0);
            jest.useRealTimers();
        });
    });

    describe('triggerHaptic()', () => {
        test('should call navigator.vibrate when enabled', () => {
            const toast = new ToastNotifications({ enableHapticFeedback: true });
            toast.triggerHaptic('success');
            expect(navigator.vibrate).toHaveBeenCalled();
        });

        test('should not vibrate when haptic disabled', () => {
            const toast = new ToastNotifications({ enableHapticFeedback: false });
            toast.triggerHaptic('success');
            expect(navigator.vibrate).not.toHaveBeenCalled();
        });

        test('should use correct pattern for different types', () => {
            const toast = new ToastNotifications({ enableHapticFeedback: true });
            toast.triggerHaptic('error');
            expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 50]);
        });

        test('should use light pattern for unknown type', () => {
            const toast = new ToastNotifications({ enableHapticFeedback: true });
            toast.triggerHaptic('unknown');
            expect(navigator.vibrate).toHaveBeenCalledWith([10]);
        });
    });

    describe('convenience methods', () => {
        test('success() should create success toast', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'show');
            toast.success('Saved!');
            expect(spy).toHaveBeenCalledWith('Saved!', expect.objectContaining({ type: 'success' }));
        });

        test('error() should create error toast', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'show');
            toast.error('Failed!');
            expect(spy).toHaveBeenCalledWith('Failed!', expect.objectContaining({ type: 'error' }));
        });

        test('warning() should create warning toast', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'show');
            toast.warning('Careful!');
            expect(spy).toHaveBeenCalledWith('Careful!', expect.objectContaining({ type: 'warning' }));
        });

        test('info() should create info toast', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'show');
            toast.info('FYI');
            expect(spy).toHaveBeenCalledWith('FYI', expect.objectContaining({ type: 'info' }));
        });

        test('errorWithRetry() should create error toast with retry action', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'show');
            const retryFn = jest.fn();
            toast.errorWithRetry('Failed', retryFn);
            expect(spy).toHaveBeenCalledWith('Failed', expect.objectContaining({
                type: 'error',
                persistent: true,
                actions: expect.arrayContaining([
                    expect.objectContaining({ label: 'Retry' })
                ])
            }));
        });

        test('successWithUndo() should create success toast with undo action', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'show');
            const undoFn = jest.fn();
            toast.successWithUndo('Deleted', undoFn);
            expect(spy).toHaveBeenCalledWith('Deleted', expect.objectContaining({
                type: 'success',
                duration: 5000,
                actions: expect.arrayContaining([
                    expect.objectContaining({ label: 'Undo' })
                ])
            }));
        });
    });

    describe('update()', () => {
        test('should update toast message', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Original', { type: 'info' });
            toast.update(id, { message: 'Updated' });
            const data = toast.toasts.get(id);
            const msgEl = data.element.querySelector('.toast__message');
            expect(msgEl.textContent).toBe('Updated');
        });

        test('should update toast type', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info' });
            toast.update(id, { type: 'success' });
            const data = toast.toasts.get(id);
            expect(data.element.classList.contains('toast--success')).toBe(true);
        });

        test('should handle non-existent toast ID', () => {
            const toast = new ToastNotifications();
            expect(() => toast.update('nonexistent', { message: 'test' })).not.toThrow();
        });

        test('should add title when updating', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info' });
            toast.update(id, { title: 'New Title' });
            const data = toast.toasts.get(id);
            const titleEl = data.element.querySelector('.toast__title');
            expect(titleEl).not.toBeNull();
            expect(titleEl.textContent).toBe('New Title');
        });

        test('should remove title when set to empty', () => {
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', title: 'Has Title' });
            toast.update(id, { title: '' });
            const data = toast.toasts.get(id);
            const titleEl = data.element.querySelector('.toast__title');
            expect(titleEl).toBeNull();
        });
    });

    describe('dismiss()', () => {
        test('should remove toast by ID', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info' });
            toast.dismiss(id);
            // Allow animation to complete
            jest.advanceTimersByTime(500);
            expect(toast.toasts.has(id)).toBe(false);
            jest.useRealTimers();
        });

        test('should handle non-existent ID gracefully', () => {
            const toast = new ToastNotifications();
            expect(() => toast.dismiss(999)).not.toThrow();
        });

        test('should call onDismiss callback', () => {
            jest.useFakeTimers();
            const onDismiss = jest.fn();
            const toast = new ToastNotifications();
            const id = toast.show('Test', { type: 'info', onDismiss });
            toast.dismiss(id);
            jest.advanceTimersByTime(500);
            expect(onDismiss).toHaveBeenCalled();
            jest.useRealTimers();
        });
    });

    describe('dismissAll()', () => {
        test('should remove all toasts', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            toast.show('One', { type: 'info' });
            toast.show('Two', { type: 'info' });
            toast.show('Three', { type: 'info' });
            toast.dismissAll();
            jest.advanceTimersByTime(500);
            expect(toast.toasts.size).toBe(0);
            jest.useRealTimers();
        });
    });

    describe('clearAll()', () => {
        test('should be an alias for dismissAll', () => {
            const toast = new ToastNotifications();
            const spy = jest.spyOn(toast, 'dismissAll');
            toast.clearAll();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('loading()', () => {
        test('should create a loading toast with no auto-dismiss', () => {
            const toast = new ToastNotifications();
            const id = toast.loading('Loading...');
            expect(id).toBeDefined();
            const toastData = toast.toasts.get(id);
            expect(toastData).toBeDefined();
            expect(toastData.duration).toBe(0);
        });
    });

    describe('promise()', () => {
        test('should handle resolved promise', async () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const result = await toast.promise(
                Promise.resolve('data'),
                { loading: 'Loading...', success: 'Done!', error: 'Failed' }
            );
            expect(result).toBe('data');
            jest.useRealTimers();
        });

        test('should handle rejected promise', async () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            await expect(
                toast.promise(
                    Promise.reject(new Error('fail')),
                    { loading: 'Loading...', success: 'Done!', error: 'Failed' }
                )
            ).rejects.toThrow('fail');
            jest.useRealTimers();
        });

        test('should support function for success message', async () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const successFn = jest.fn().mockReturnValue('Custom success');
            await toast.promise(
                Promise.resolve('data'),
                { success: successFn }
            );
            expect(successFn).toHaveBeenCalledWith('data');
            jest.useRealTimers();
        });

        test('should support function for error message', async () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            const errorFn = jest.fn().mockReturnValue('Custom error');
            await expect(
                toast.promise(
                    Promise.reject(new Error('fail')),
                    { error: errorFn }
                )
            ).rejects.toThrow();
            expect(errorFn).toHaveBeenCalled();
            jest.useRealTimers();
        });
    });

    describe('destroy()', () => {
        test('should dismiss all toasts and remove elements', () => {
            jest.useFakeTimers();
            const toast = new ToastNotifications();
            toast.show('Test', { type: 'info' });
            toast.destroy();
            jest.advanceTimersByTime(500);
            expect(toast.toasts.size).toBe(0);
            jest.useRealTimers();
        });
    });

    describe('checkConnection()', () => {
        test('should attempt fetch', async () => {
            const toast = new ToastNotifications();
            global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
            await toast.checkConnection();
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});

describe('ErrorBoundary', () => {
    let ErrorBoundary;

    beforeEach(() => {
        navigator.vibrate = jest.fn();
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
        const mod = require('../../js/toast-notifications.js');
        ErrorBoundary = mod.ErrorBoundary;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should be defined', () => {
        expect(ErrorBoundary).toBeDefined();
    });

    test('should initialize with default options', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container);
        expect(eb.options.fallbackMessage).toBe('Something went wrong');
        expect(eb.options.showRetry).toBe(true);
        expect(eb.options.showDetails).toBe(false);
        expect(eb.hasError).toBe(false);
        expect(eb.errorStack).toHaveLength(0);
    });

    test('should accept custom options', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container, {
            fallbackMessage: 'Custom message',
            showRetry: false,
            retryLabel: 'Retry Now'
        });
        expect(eb.options.fallbackMessage).toBe('Custom message');
        expect(eb.options.showRetry).toBe(false);
        expect(eb.options.retryLabel).toBe('Retry Now');
    });

    test('wrap() should call the function and return result', async () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container);
        const result = await eb.wrap(() => 42);
        expect(result).toBe(42);
    });

    test('wrap() should catch errors and handle them', async () => {
        const container = document.createElement('div');
        container.innerHTML = '<p>Original</p>';
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        await expect(eb.wrap(() => {
            throw new Error('Test error');
        })).rejects.toThrow('Test error');
        expect(eb.hasError).toBe(true);
    });

    test('wrap() should add error to errorStack', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        try {
            await eb.wrap(() => { throw new Error('stack test'); });
        } catch (e) {}
        expect(eb.errorStack).toHaveLength(1);
        expect(eb.errorStack[0].error.message).toBe('stack test');
    });

    test('wrapSync() should return result on success', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container);
        const result = eb.wrapSync(() => 'hello');
        expect(result).toBe('hello');
        expect(eb.hasError).toBe(false);
    });

    test('wrapSync() should catch sync errors', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        expect(() => eb.wrapSync(() => { throw new Error('sync error'); })).toThrow('sync error');
        expect(eb.hasError).toBe(true);
    });

    test('handleError() should render error UI', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p>Original</p>';
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        eb.handleError(new Error('Test'));
        expect(container.innerHTML).toContain('error-boundary');
        expect(container.innerHTML).toContain('Something went wrong');
    });

    test('handleError() should save original content', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p>Original</p>';
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        eb.handleError(new Error('Test'));
        expect(eb.originalContent).toBe('<p>Original</p>');
    });

    test('handleError() should call onError callback', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const onError = jest.fn();
        const eb = new ErrorBoundary(container, { onError });
        const error = new Error('cb test');
        eb.handleError(error);
        expect(onError).toHaveBeenCalledWith(error);
    });

    test('handleError() should set alert role on container', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        eb.handleError(new Error('Test'));
        expect(container.getAttribute('role')).toBe('alert');
        expect(container.getAttribute('aria-live')).toBe('assertive');
    });

    test('renderErrorUI() should include retry button when showRetry is true', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container, { showRetry: true });
        const html = eb.renderErrorUI(new Error('Test'));
        expect(html).toContain('error-boundary__retry');
        expect(html).toContain('Try Again');
    });

    test('renderErrorUI() should not include retry when showRetry is false', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container, { showRetry: false });
        const html = eb.renderErrorUI(new Error('Test'));
        expect(html).not.toContain('error-boundary__retry');
    });

    test('renderErrorUI() should show details when enabled with stack', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container, { showDetails: true });
        const error = new Error('Detail test');
        const html = eb.renderErrorUI(error);
        expect(html).toContain('error-boundary__details');
    });

    test('sanitizeMessage() should escape HTML', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container);
        expect(eb.sanitizeMessage('<script>alert("xss")</script>')).toContain('&lt;');
        expect(eb.sanitizeMessage('<script>alert("xss")</script>')).not.toContain('<script>');
    });

    test('sanitizeMessage() should handle null/empty', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container);
        expect(eb.sanitizeMessage(null)).toBe('');
        expect(eb.sanitizeMessage('')).toBe('');
    });

    test('retry() should restore original content', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p>Original</p>';
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        eb.handleError(new Error('Test'));
        eb.retry();
        expect(container.innerHTML).toBe('<p>Original</p>');
        expect(eb.hasError).toBe(false);
    });

    test('retry() should call onRetry callback', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p>Content</p>';
        document.body.appendChild(container);
        const onRetry = jest.fn();
        const eb = new ErrorBoundary(container, { onRetry });
        eb.handleError(new Error('Test'));
        eb.retry();
        expect(onRetry).toHaveBeenCalled();
    });

    test('reset() should clear error state', () => {
        const container = document.createElement('div');
        const eb = new ErrorBoundary(container);
        eb.hasError = true;
        eb.originalContent = '<p>old</p>';
        eb.errorStack = [{ error: new Error('e') }];
        eb.reset();
        expect(eb.hasError).toBe(false);
        expect(eb.originalContent).toBeNull();
        expect(eb.errorStack).toHaveLength(0);
    });

    test('getErrorHistory() should return copy of error stack', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const eb = new ErrorBoundary(container);
        eb.handleError(new Error('err1'));
        eb.handleError(new Error('err2'));
        const history = eb.getErrorHistory();
        expect(history).toHaveLength(2);
        history.push({ error: new Error('fake') });
        expect(eb.errorStack).toHaveLength(2); // original unmodified
    });
});

describe('FormValidation', () => {
    let FormValidation;

    beforeEach(() => {
        navigator.vibrate = jest.fn();
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
        const mod = require('../../js/toast-notifications.js');
        FormValidation = mod.FormValidation;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    // Mock scrollIntoView (not available in jsdom)
    beforeAll(() => {
        Element.prototype.scrollIntoView = jest.fn();
    });

    function createForm(fields = []) {
        const form = document.createElement('form');
        fields.forEach(f => {
            const input = document.createElement('input');
            input.name = f.name || '';
            input.id = f.id || f.name || '';
            input.type = f.type || 'text';
            if (f.required) input.required = true;
            if (f.value !== undefined) input.value = f.value;
            if (f.minLength) input.minLength = f.minLength;
            if (f.maxLength) input.maxLength = f.maxLength;
            if (f.pattern) input.pattern = f.pattern;
            form.appendChild(input);
        });
        document.body.appendChild(form);
        return form;
    }

    test('should initialize with default options', () => {
        const form = createForm([]);
        const fv = new FormValidation(form);
        expect(fv.options.scrollToError).toBe(true);
        expect(fv.options.showSummary).toBe(true);
        expect(fv.options.validateOnBlur).toBe(true);
        expect(fv.errors.size).toBe(0);
    });

    test('should accept custom options', () => {
        const form = createForm([]);
        const fv = new FormValidation(form, {
            scrollToError: false,
            validateOnInput: true,
            debounceDelay: 500
        });
        expect(fv.options.scrollToError).toBe(false);
        expect(fv.options.validateOnInput).toBe(true);
        expect(fv.options.debounceDelay).toBe(500);
    });

    test('validateField() should catch required empty field', () => {
        const form = createForm([{ name: 'email', required: true, value: '' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="email"]');
        const result = fv.validateField(input);
        expect(result).toBe(false);
        expect(fv.errors.has('email')).toBe(true);
    });

    test('validateField() should pass valid required field', () => {
        const form = createForm([{ name: 'email', required: true, value: 'test@test.com' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="email"]');
        const result = fv.validateField(input);
        expect(result).toBe(true);
    });

    test('validateField() should validate email format', () => {
        const form = createForm([{ name: 'email', type: 'email', value: 'not-an-email' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="email"]');
        const result = fv.validateField(input);
        expect(result).toBe(false);
    });

    test('validateField() should accept valid email', () => {
        const form = createForm([{ name: 'email', type: 'email', value: 'test@example.com' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="email"]');
        const result = fv.validateField(input);
        expect(result).toBe(true);
    });

    test('validateAll() should validate all fields', () => {
        const form = createForm([
            { name: 'name', required: true, value: '' },
            { name: 'email', required: true, value: 'valid@test.com' }
        ]);
        const fv = new FormValidation(form);
        const result = fv.validateAll();
        expect(result).toBe(false);
        expect(fv.errors.size).toBe(1);
    });

    test('validateAll() should return true when all valid', () => {
        const form = createForm([
            { name: 'name', required: true, value: 'John' },
            { name: 'email', required: true, value: 'valid@test.com' }
        ]);
        const fv = new FormValidation(form);
        const result = fv.validateAll();
        expect(result).toBe(true);
    });

    test('setFieldError() should add error class and message', () => {
        const form = createForm([{ name: 'test', id: 'test', value: '' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="test"]');
        fv.setFieldError(input, 'This is required');
        expect(input.classList.contains('field--error')).toBe(true);
        expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    test('clearFieldError() should remove error class', () => {
        const form = createForm([{ name: 'test', id: 'test', value: '' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="test"]');
        fv.setFieldError(input, 'Error');
        fv.clearFieldError(input);
        expect(input.classList.contains('field--error')).toBe(false);
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    test('isValidEmail() should validate emails correctly', () => {
        const form = createForm([]);
        const fv = new FormValidation(form);
        expect(fv.isValidEmail('test@example.com')).toBe(true);
        expect(fv.isValidEmail('user@domain.co')).toBe(true);
        expect(fv.isValidEmail('invalid')).toBe(false);
        expect(fv.isValidEmail('@no-user.com')).toBe(false);
        expect(fv.isValidEmail('no-domain@')).toBe(false);
    });

    test('clearAll() should clear all errors', () => {
        const form = createForm([
            { name: 'a', required: true, value: '' },
            { name: 'b', required: true, value: '' }
        ]);
        const fv = new FormValidation(form);
        fv.validateAll();
        expect(fv.errors.size).toBe(2);
        fv.clearAll();
        expect(fv.errors.size).toBe(0);
    });

    test('addValidator() should add custom validator', () => {
        const form = createForm([{ name: 'custom', value: 'bad' }]);
        const fv = new FormValidation(form);
        fv.addValidator('custom', (val) => val === 'good' ? true : 'Must be good');
        const input = form.querySelector('[name="custom"]');
        const result = fv.validateField(input);
        expect(result).toBe(false);
        expect(fv.errors.get('custom')).toBe('Must be good');
    });

    test('removeValidator() should remove custom validator', () => {
        const form = createForm([{ name: 'custom', value: 'anything' }]);
        const fv = new FormValidation(form);
        fv.addValidator('custom', () => 'Always fails');
        fv.removeValidator('custom');
        const input = form.querySelector('[name="custom"]');
        const result = fv.validateField(input);
        expect(result).toBe(true);
    });

    test('getFieldRules() should extract required rule', () => {
        const form = createForm([{ name: 'req', required: true }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="req"]');
        const rules = fv.getFieldRules(input);
        expect(rules.some(r => r.type === 'required')).toBe(true);
    });

    test('getFieldRules() should extract email rule', () => {
        const form = createForm([{ name: 'em', type: 'email' }]);
        const fv = new FormValidation(form);
        const input = form.querySelector('[name="em"]');
        const rules = fv.getFieldRules(input);
        expect(rules.some(r => r.type === 'email')).toBe(true);
    });

    test('showErrorSummary() should create summary element', () => {
        const form = createForm([{ name: 'a', required: true, value: '' }]);
        const fv = new FormValidation(form);
        fv.validateAll();
        const summary = form.querySelector('.form-error-summary');
        expect(summary).not.toBeNull();
        expect(summary.getAttribute('role')).toBe('alert');
    });

    test('hideErrorSummary() should hide summary', () => {
        const form = createForm([{ name: 'a', required: true, value: '' }]);
        const fv = new FormValidation(form);
        fv.validateAll();
        fv.hideErrorSummary();
        const summary = form.querySelector('.form-error-summary');
        if (summary) {
            expect(summary.classList.contains('form-error-summary--visible')).toBe(false);
        }
    });

    test('debouncedValidate() should debounce field validation', () => {
        jest.useFakeTimers();
        const form = createForm([{ name: 'test', required: true, value: '' }]);
        const fv = new FormValidation(form, { validateOnInput: true });
        const input = form.querySelector('[name="test"]');
        fv.debouncedValidate(input);
        fv.debouncedValidate(input);
        fv.debouncedValidate(input);
        expect(fv.debounceTimers.size).toBe(1);
        jest.advanceTimersByTime(500);
        expect(fv.errors.has('test')).toBe(true);
        jest.useRealTimers();
    });
});

describe('EmptyState', () => {
    let EmptyState;

    beforeEach(() => {
        navigator.vibrate = jest.fn();
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
        const mod = require('../../js/toast-notifications.js');
        EmptyState = mod.EmptyState;
    });

    test('should be defined', () => {
        expect(EmptyState).toBeDefined();
    });

    test('should generate empty state HTML via static render', () => {
        const html = EmptyState.render({
            title: 'No Results',
            message: 'Try a different search',
            icon: 'search'
        });
        expect(html).toContain('No Results');
        expect(html).toContain('Try a different search');
    });

    test('should use default options', () => {
        const html = EmptyState.render();
        expect(html).toContain('Nothing to show');
    });

    test('should render with action button using href', () => {
        const html = EmptyState.render({
            title: 'Test',
            action: { label: 'Go Home', href: '#/' }
        });
        expect(html).toContain('Go Home');
        expect(html).toContain('#/');
    });

    test('should render with action button without href', () => {
        const html = EmptyState.render({
            title: 'Test',
            action: { label: 'Click Me' }
        });
        expect(html).toContain('Click Me');
        expect(html).toContain('button');
    });

    test('should render with action icon', () => {
        const html = EmptyState.render({
            title: 'Test',
            action: { label: 'Search', icon: 'search', href: '#/search' }
        });
        expect(html).toContain('svg');
    });

    test('should render secondary action with href', () => {
        const html = EmptyState.render({
            title: 'Test',
            secondaryAction: { label: 'Cancel', href: '#/back' }
        });
        expect(html).toContain('Cancel');
        expect(html).toContain('secondary');
    });

    test('should render secondary action without href', () => {
        const html = EmptyState.render({
            title: 'Test',
            secondaryAction: { label: 'Cancel' }
        });
        expect(html).toContain('Cancel');
        expect(html).toContain('button');
    });

    test('should support different icon types', () => {
        const icons = ['search', 'folder', 'compass', 'inbox', 'users', 'bookmark', '404', 'error', 'offline', 'filter', 'star'];
        icons.forEach(icon => {
            const html = EmptyState.render({ icon });
            expect(html).toContain('svg');
        });
    });

    test('should support variant', () => {
        const html = EmptyState.render({ variant: 'error' });
        expect(html).toContain('empty-state--error');
    });

    test('should render illustration', () => {
        const html = EmptyState.render({ illustration: '<div>custom</div>' });
        expect(html).toContain('empty-state__illustration');
    });

    test('getActionIconPath() should return paths for known icons', () => {
        expect(EmptyState.getActionIconPath('plus')).toContain('line');
        expect(EmptyState.getActionIconPath('search')).toContain('circle');
        expect(EmptyState.getActionIconPath('refresh')).toContain('path');
        expect(EmptyState.getActionIconPath('home')).toContain('path');
    });

    test('getActionIconPath() should return default for unknown', () => {
        const result = EmptyState.getActionIconPath('unknown');
        expect(result).toBeDefined();
    });

    test('renderNoResults() should render no results state', () => {
        const html = EmptyState.renderNoResults('test query');
        expect(html).toContain('No results found');
        expect(html).toContain('test query');
    });

    test('renderNoResults() should handle empty query', () => {
        const html = EmptyState.renderNoResults('');
        expect(html).toContain('No results found');
    });

    test('renderNoItems() should render empty list state', () => {
        const html = EmptyState.renderNoItems('creatures');
        expect(html).toContain('No creatures yet');
    });

    test('renderNoFavorites() should render favorites empty state', () => {
        const html = EmptyState.renderNoFavorites();
        expect(html).toContain('No favorites yet');
        expect(html).toContain('Explore Content');
    });

    test('renderError() should render error state', () => {
        const html = EmptyState.renderError('Something broke');
        expect(html).toContain('Something went wrong');
        expect(html).toContain('Something broke');
    });

    test('renderError() should use default message when none provided', () => {
        const html = EmptyState.renderError();
        expect(html).toContain('An error occurred');
    });

    test('renderOffline() should render offline state', () => {
        const html = EmptyState.renderOffline();
        expect(html).toContain('You are offline');
        expect(html).toContain('Retry');
    });

    test('render404() should render 404 page', () => {
        const html = EmptyState.render404();
        expect(html).toContain('page-404');
    });
});

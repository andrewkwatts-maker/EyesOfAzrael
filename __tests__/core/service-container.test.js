/**
 * ServiceContainer Module Tests
 * Tests for js/core/service-container.js
 */

describe('ServiceContainer', () => {
    let ServiceContainer, container;

    beforeEach(() => {
        // Reset window state
        delete window.ServiceContainer;
        delete window.container;

        // Load the module fresh
        const mod = require('../../js/core/service-container.js');
        ServiceContainer = mod.ServiceContainer;

        // Create a fresh container for each test
        container = new ServiceContainer();
    });

    describe('constructor', () => {
        test('should initialize with empty services and instances', () => {
            expect(container.getRegisteredServices()).toEqual([]);
            expect(container._instances.size).toBe(0);
        });

        test('should register default interfaces', () => {
            expect(container._interfaces.has('db')).toBe(true);
            expect(container._interfaces.has('auth')).toBe(true);
            expect(container._interfaces.has('renderer')).toBe(true);
            expect(container._interfaces.has('navigation')).toBe(true);
            expect(container._interfaces.has('search')).toBe(true);
        });
    });

    describe('register', () => {
        test('should register a service factory', () => {
            container.register('myService', () => ({ value: 42 }));
            expect(container.has('myService')).toBe(true);
        });

        test('should return container for chaining', () => {
            const result = container.register('a', () => 1);
            expect(result).toBe(container);
        });

        test('should store interface definition when provided', () => {
            container.register('db', () => ({}), { interface: ['query', 'insert'] });
            expect(container._interfaces.get('db')).toEqual(['query', 'insert']);
        });

        test('should default singleton to true', () => {
            container.register('svc', () => ({ rand: Math.random() }));
            const first = container.resolve('svc');
            const second = container.resolve('svc');
            expect(first).toBe(second);
        });
    });

    describe('instance', () => {
        test('should register a pre-created instance', () => {
            const obj = { name: 'firebase' };
            container.instance('firebase', obj);
            expect(container.resolve('firebase')).toBe(obj);
        });

        test('should return container for chaining', () => {
            const result = container.instance('x', {});
            expect(result).toBe(container);
        });
    });

    describe('alias', () => {
        test('should allow resolving service by alias', () => {
            const obj = { type: 'database' };
            container.instance('db', obj);
            container.alias('database', 'db');
            expect(container.resolve('database')).toBe(obj);
        });

        test('should report alias as existing via has()', () => {
            container.instance('db', {});
            container.alias('database', 'db');
            expect(container.has('database')).toBe(true);
        });

        test('should return container for chaining', () => {
            const result = container.alias('a', 'b');
            expect(result).toBe(container);
        });
    });

    describe('resolve', () => {
        test('should create instance via factory', () => {
            container.register('svc', () => ({ created: true }));
            const result = container.resolve('svc');
            expect(result.created).toBe(true);
        });

        test('should pass container to factory function', () => {
            const factorySpy = jest.fn(() => ({}));
            container.register('svc', factorySpy);
            container.resolve('svc');
            expect(factorySpy).toHaveBeenCalledWith(container);
        });

        test('should throw for unregistered service', () => {
            expect(() => container.resolve('nonexistent'))
                .toThrow('Service "nonexistent" not registered');
        });

        test('should detect circular dependencies', () => {
            container.register('a', (c) => c.resolve('b'), { singleton: false });
            container.register('b', (c) => c.resolve('a'), { singleton: false });
            expect(() => container.resolve('a'))
                .toThrow(/Circular dependency detected/);
        });

        test('should cache singleton instances', () => {
            let callCount = 0;
            container.register('svc', () => ({ id: ++callCount }), { singleton: true });
            const first = container.resolve('svc');
            const second = container.resolve('svc');
            expect(first).toBe(second);
            expect(callCount).toBe(1);
        });

        test('should create new instances when singleton is false', () => {
            let callCount = 0;
            container.register('svc', () => ({ id: ++callCount }), { singleton: false });
            const first = container.resolve('svc');
            const second = container.resolve('svc');
            expect(first).not.toBe(second);
            expect(callCount).toBe(2);
        });

        test('should use fallback when factory fails and service is optional', () => {
            const fallback = { fallback: true };
            container.register('svc', () => { throw new Error('boom'); }, {
                optional: true,
                fallback
            });
            expect(container.resolve('svc')).toBe(fallback);
        });

        test('should throw when factory fails and service is not optional', () => {
            container.register('svc', () => { throw new Error('boom'); });
            expect(() => container.resolve('svc')).toThrow('boom');
        });

        test('should validate interface methods when specified', () => {
            container.register('renderer', () => ({ render: () => {} }), {
                interface: ['render', 'renderGrid']
            });
            expect(() => container.resolve('renderer'))
                .toThrow(/Missing methods: renderGrid/);
        });

        test('should pass interface validation when all methods are present', () => {
            container.register('renderer', () => ({
                render: () => {},
                renderGrid: () => {}
            }), {
                interface: ['render', 'renderGrid']
            });
            expect(() => container.resolve('renderer')).not.toThrow();
        });
    });

    describe('has', () => {
        test('should return false for unregistered service', () => {
            expect(container.has('nope')).toBe(false);
        });

        test('should return true for registered service', () => {
            container.register('svc', () => ({}));
            expect(container.has('svc')).toBe(true);
        });
    });

    describe('tryResolve', () => {
        test('should return service when available', () => {
            container.instance('svc', { ok: true });
            expect(container.tryResolve('svc')).toEqual({ ok: true });
        });

        test('should return null for unregistered service', () => {
            expect(container.tryResolve('nope')).toBeNull();
        });

        test('should return null when resolution fails', () => {
            container.register('svc', () => { throw new Error('boom'); });
            expect(container.tryResolve('svc')).toBeNull();
        });
    });

    describe('getRegisteredServices', () => {
        test('should return all registered service names', () => {
            container.register('a', () => 1);
            container.register('b', () => 2);
            expect(container.getRegisteredServices()).toEqual(['a', 'b']);
        });
    });

    describe('validateAll', () => {
        test('should return valid when all services resolve', () => {
            container.register('a', () => ({}));
            container.register('b', () => ({}));
            const result = container.validateAll();
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should collect errors for services that fail to resolve', () => {
            container.register('good', () => ({}));
            container.register('bad', () => { throw new Error('fail'); });
            const result = container.validateAll();
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('bad');
        });
    });

    describe('clearInstances', () => {
        test('should clear cached singleton instances', () => {
            let callCount = 0;
            container.register('svc', () => ({ id: ++callCount }));
            container.resolve('svc');
            expect(callCount).toBe(1);

            container.clearInstances();
            container.resolve('svc');
            expect(callCount).toBe(2);
        });
    });

    describe('reset', () => {
        test('should clear all state', () => {
            container.register('svc', () => ({}));
            container.instance('inst', {});
            container.alias('a', 'svc');

            container.reset();

            expect(container.has('svc')).toBe(false);
            expect(container.has('inst')).toBe(false);
            expect(container.has('a')).toBe(false);
            expect(container._interfaces.size).toBe(0);
        });
    });
});

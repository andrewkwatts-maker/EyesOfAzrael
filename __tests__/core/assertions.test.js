/**
 * Assertions Module Tests
 * Tests for js/core/assertions.js
 */

describe('Assertions', () => {
    let Assertions;

    beforeEach(() => {
        // Reset window state
        delete window.Assertions;

        // Load the module fresh
        Assertions = require('../../js/core/assertions.js');

        // Reset config and failures for isolation
        Assertions.config.throwOnFailure = true;
        Assertions.config.logLevel = 'error';
        Assertions.config.collectFailures = true;
        Assertions.clearFailures();
    });

    describe('assertNonNull', () => {
        test('should return value when it is not null or undefined', () => {
            expect(Assertions.assertNonNull('hello', 'test')).toBe('hello');
            expect(Assertions.assertNonNull(0, 'test')).toBe(0);
            expect(Assertions.assertNonNull(false, 'test')).toBe(false);
            expect(Assertions.assertNonNull('', 'test')).toBe('');
        });

        test('should throw when value is null', () => {
            expect(() => Assertions.assertNonNull(null, 'MyVar'))
                .toThrow('Expected MyVar to be non-null, got null');
        });

        test('should throw when value is undefined', () => {
            expect(() => Assertions.assertNonNull(undefined, 'MyVar'))
                .toThrow('Expected MyVar to be non-null, got undefined');
        });
    });

    describe('assertType', () => {
        test('should return value when type matches', () => {
            expect(Assertions.assertType('hello', 'string', 'ctx')).toBe('hello');
            expect(Assertions.assertType(42, 'number', 'ctx')).toBe(42);
            expect(Assertions.assertType(true, 'boolean', 'ctx')).toBe(true);
            expect(Assertions.assertType(() => {}, 'function', 'ctx')).toBeInstanceOf(Function);
        });

        test('should distinguish array from object', () => {
            expect(Assertions.assertType([1, 2], 'array', 'ctx')).toEqual([1, 2]);
            expect(Assertions.assertType({a: 1}, 'object', 'ctx')).toEqual({a: 1});
        });

        test('should throw when type does not match', () => {
            expect(() => Assertions.assertType('hello', 'number', 'myField'))
                .toThrow('Expected myField to be number, got string');
        });

        test('should handle null and undefined types', () => {
            expect(() => Assertions.assertType(null, 'object', 'ctx'))
                .toThrow('Expected ctx to be object, got null');
            expect(() => Assertions.assertType(undefined, 'string', 'ctx'))
                .toThrow('Expected ctx to be string, got undefined');
        });
    });

    describe('assertHasProperties', () => {
        test('should return object when all properties exist', () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Assertions.assertHasProperties(obj, ['a', 'b'], 'config')).toBe(obj);
        });

        test('should throw when properties are missing', () => {
            const obj = { a: 1 };
            expect(() => Assertions.assertHasProperties(obj, ['a', 'b', 'c'], 'config'))
                .toThrow('config is missing required properties: b, c');
        });

        test('should throw when object is null', () => {
            expect(() => Assertions.assertHasProperties(null, ['a'], 'config'))
                .toThrow('Expected config to be non-null');
        });
    });

    describe('assertDependency', () => {
        test('should return instance when all required methods exist', () => {
            const svc = { init: () => {}, destroy: () => {} };
            expect(Assertions.assertDependency('MySvc', svc, ['init', 'destroy'])).toBe(svc);
        });

        test('should throw when dependency is null', () => {
            expect(() => Assertions.assertDependency('SPANavigation', null, []))
                .toThrow('Dependency "SPANavigation" not found');
        });

        test('should throw when required methods are missing', () => {
            const svc = { init: () => {} };
            expect(() => Assertions.assertDependency('MySvc', svc, ['init', 'missing']))
                .toThrow('missing required methods: missing');
        });

        test('should check prototype methods for class constructors', () => {
            class MyClass {
                doWork() {}
            }
            expect(Assertions.assertDependency('MyClass', MyClass, ['doWork'])).toBe(MyClass);
        });

        test('should include guidance for known dependencies', () => {
            expect(() => Assertions.assertDependency('firebase', null, []))
                .toThrow(/Firebase SDK/);
        });
    });

    describe('assert', () => {
        test('should return true when condition is true', () => {
            expect(Assertions.assert(true, 'should pass')).toBe(true);
        });

        test('should throw when condition is false', () => {
            expect(() => Assertions.assert(false, 'Items must not be empty'))
                .toThrow('Items must not be empty');
        });
    });

    describe('assertOneOf', () => {
        test('should return value when it is in allowed list', () => {
            expect(Assertions.assertOneOf('dark', ['light', 'dark'], 'theme')).toBe('dark');
        });

        test('should throw when value is not in allowed list', () => {
            expect(() => Assertions.assertOneOf('neon', ['light', 'dark'], 'theme'))
                .toThrow('Expected theme to be one of [light, dark], got "neon"');
        });
    });

    describe('assertNonEmptyArray', () => {
        test('should return array when non-empty', () => {
            expect(Assertions.assertNonEmptyArray([1], 'items')).toEqual([1]);
        });

        test('should throw when array is empty', () => {
            expect(() => Assertions.assertNonEmptyArray([], 'items'))
                .toThrow('Expected items to be a non-empty array');
        });

        test('should throw when value is not an array', () => {
            expect(() => Assertions.assertNonEmptyArray('not array', 'items'))
                .toThrow('Expected items to be array, got string');
        });
    });

    describe('assertMatches', () => {
        test('should return string when it matches the pattern', () => {
            expect(Assertions.assertMatches('abc123', /^[a-z]+\d+$/, 'code')).toBe('abc123');
        });

        test('should throw when string does not match', () => {
            expect(() => Assertions.assertMatches('NOPE', /^[a-z]+$/, 'code'))
                .toThrow('Expected code to match pattern');
        });

        test('should throw when value is not a string', () => {
            expect(() => Assertions.assertMatches(123, /\d+/, 'code'))
                .toThrow('Expected code to be string, got number');
        });
    });

    describe('failure collection and config', () => {
        test('should collect failures when collectFailures is true', () => {
            Assertions.config.throwOnFailure = false;
            Assertions.assertNonNull(null, 'X');
            Assertions.assertNonNull(undefined, 'Y');

            expect(Assertions.hasFailures()).toBe(true);
            const failures = Assertions.getFailures();
            expect(failures).toHaveLength(2);
            expect(failures[0].context).toBe('X');
            expect(failures[1].context).toBe('Y');
        });

        test('should clear failures', () => {
            Assertions.config.throwOnFailure = false;
            Assertions.assertNonNull(null, 'X');
            expect(Assertions.hasFailures()).toBe(true);
            Assertions.clearFailures();
            expect(Assertions.hasFailures()).toBe(false);
            expect(Assertions.getFailures()).toHaveLength(0);
        });

        test('should return undefined instead of throwing when throwOnFailure is false', () => {
            Assertions.config.throwOnFailure = false;
            expect(Assertions.assertNonNull(null, 'X')).toBeUndefined();
        });

        test('should log with console.warn when logLevel is warn', () => {
            Assertions.config.throwOnFailure = false;
            Assertions.config.logLevel = 'warn';
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

            Assertions.assertNonNull(null, 'X');
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[Assertion Failed]'));

            warnSpy.mockRestore();
        });
    });
});

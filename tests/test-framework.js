/**
 * Simple Test Framework for Eyes of Azrael
 * Inspired by Mocha/Jest but lightweight and browser-friendly
 */

class TestFramework {
    constructor() {
        this.tests = [];
        this.suites = [];
        this.currentSuite = null;
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0
        };
        this.beforeEachHandlers = [];
        this.afterEachHandlers = [];
        this.beforeAllHandlers = [];
        this.afterAllHandlers = [];
    }

    /**
     * Define a test suite
     */
    describe(name, fn) {
        const suite = {
            name,
            tests: [],
            beforeEach: [],
            afterEach: [],
            beforeAll: [],
            afterAll: []
        };

        this.suites.push(suite);
        const previousSuite = this.currentSuite;
        this.currentSuite = suite;

        fn();

        this.currentSuite = previousSuite;
    }

    /**
     * Define a test
     */
    it(description, fn) {
        const test = {
            description,
            fn,
            suite: this.currentSuite?.name || 'Global',
            status: 'pending'
        };

        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        }

        this.tests.push(test);
    }

    /**
     * Skip a test
     */
    xit(description, fn) {
        const test = {
            description,
            fn,
            suite: this.currentSuite?.name || 'Global',
            status: 'skipped'
        };

        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        }

        this.tests.push(test);
    }

    /**
     * Before each test
     */
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach.push(fn);
        } else {
            this.beforeEachHandlers.push(fn);
        }
    }

    /**
     * After each test
     */
    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach.push(fn);
        } else {
            this.afterEachHandlers.push(fn);
        }
    }

    /**
     * Before all tests in suite
     */
    beforeAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll.push(fn);
        } else {
            this.beforeAllHandlers.push(fn);
        }
    }

    /**
     * After all tests in suite
     */
    afterAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterAll.push(fn);
        } else {
            this.afterAllHandlers.push(fn);
        }
    }

    /**
     * Run all tests
     */
    async run() {
        console.log('🧪 Starting test run...\n');
        const startTime = performance.now();

        // Run global beforeAll
        for (const handler of this.beforeAllHandlers) {
            await handler();
        }

        // Run each suite
        for (const suite of this.suites) {
            console.log(`\n📦 ${suite.name}`);

            // Run suite beforeAll
            for (const handler of suite.beforeAll) {
                await handler();
            }

            // Run suite tests
            for (const test of suite.tests) {
                await this.runTest(test, suite);
            }

            // Run suite afterAll
            for (const handler of suite.afterAll) {
                await handler();
            }
        }

        // Run global afterAll
        for (const handler of this.afterAllHandlers) {
            await handler();
        }

        this.results.duration = performance.now() - startTime;
        this.printResults();

        return this.results;
    }

    /**
     * Run a single test
     */
    async runTest(test, suite) {
        if (test.status === 'skipped') {
            this.results.skipped++;
            this.results.total++;
            console.log(`  ⊘ ${test.description} (skipped)`);
            return;
        }

        const startTime = performance.now();

        try {
            // Run beforeEach handlers
            for (const handler of this.beforeEachHandlers) {
                await handler();
            }
            if (suite) {
                for (const handler of suite.beforeEach) {
                    await handler();
                }
            }

            // Run test
            await test.fn();

            // Run afterEach handlers
            for (const handler of this.afterEachHandlers) {
                await handler();
            }
            if (suite) {
                for (const handler of suite.afterEach) {
                    await handler();
                }
            }

            const duration = performance.now() - startTime;
            test.status = 'passed';
            test.duration = duration;
            this.results.passed++;
            this.results.total++;

            console.log(`  ✓ ${test.description} (${duration.toFixed(2)}ms)`);

        } catch (error) {
            const duration = performance.now() - startTime;
            test.status = 'failed';
            test.error = error;
            test.duration = duration;
            this.results.failed++;
            this.results.total++;

            console.error(`  ✗ ${test.description}`);
            console.error(`    ${error.message}`);
            if (error.stack) {
                console.error(`    ${error.stack.split('\n')[1]?.trim()}`);
            }
        }
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Results');
        console.log('='.repeat(60));
        console.log(`Total:   ${this.results.total}`);
        console.log(`✓ Passed: ${this.results.passed}`);
        console.log(`✗ Failed: ${this.results.failed}`);
        console.log(`⊘ Skipped: ${this.results.skipped}`);
        console.log(`Duration: ${this.results.duration.toFixed(2)}ms`);
        console.log('='.repeat(60));

        if (this.results.failed === 0) {
            console.log('✅ All tests passed!');
        } else {
            console.log(`❌ ${this.results.failed} test(s) failed`);
        }
    }

    /**
     * Clear all tests and results
     */
    reset() {
        this.tests = [];
        this.suites = [];
        this.currentSuite = null;
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0
        };
        this.beforeEachHandlers = [];
        this.afterEachHandlers = [];
        this.beforeAllHandlers = [];
        this.afterAllHandlers = [];
    }
}

/**
 * Assertion Library
 */
class Expect {
    constructor(actual) {
        this.actual = actual;
        this.isNot = false;
    }

    get not() {
        this.isNot = true;
        return this;
    }

    toBe(expected) {
        const pass = this.actual === expected;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be ${JSON.stringify(expected)}`
            );
        }
    }

    toEqual(expected) {
        const pass = JSON.stringify(this.actual) === JSON.stringify(expected);
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to equal ${JSON.stringify(expected)}`
            );
        }
    }

    toBeTruthy() {
        const pass = !!this.actual;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be truthy`
            );
        }
    }

    toBeFalsy() {
        const pass = !this.actual;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be falsy`
            );
        }
    }

    toBeNull() {
        const pass = this.actual === null;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be null`
            );
        }
    }

    toBeUndefined() {
        const pass = this.actual === undefined;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be undefined`
            );
        }
    }

    toBeDefined() {
        const pass = this.actual !== undefined;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be defined`
            );
        }
    }

    toContain(item) {
        const pass = Array.isArray(this.actual)
            ? this.actual.includes(item)
            : this.actual.indexOf(item) !== -1;

        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to contain ${JSON.stringify(item)}`
            );
        }
    }

    toHaveLength(length) {
        const pass = this.actual.length === length;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to have length ${length}, but got ${this.actual.length}`
            );
        }
    }

    toBeInstanceOf(constructor) {
        const pass = this.actual instanceof constructor;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to be instance of ${constructor.name}`
            );
        }
    }

    toHaveProperty(property) {
        const pass = property in this.actual;
        if (this.isNot ? pass : !pass) {
            throw new Error(
                `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to have property "${property}"`
            );
        }
    }

    toThrow(expectedError) {
        let didThrow = false;
        let thrownError = null;

        try {
            this.actual();
        } catch (error) {
            didThrow = true;
            thrownError = error;
        }

        if (this.isNot) {
            if (didThrow) {
                throw new Error(`Expected function not to throw, but it threw: ${thrownError.message}`);
            }
        } else {
            if (!didThrow) {
                throw new Error('Expected function to throw, but it did not');
            }
            if (expectedError && thrownError.message !== expectedError) {
                throw new Error(
                    `Expected function to throw "${expectedError}", but it threw "${thrownError.message}"`
                );
            }
        }
    }

    async toResolve() {
        try {
            await this.actual;
            if (this.isNot) {
                throw new Error('Expected promise not to resolve, but it did');
            }
        } catch (error) {
            if (!this.isNot) {
                throw new Error(`Expected promise to resolve, but it rejected with: ${error.message}`);
            }
        }
    }

    async toReject() {
        try {
            await this.actual;
            if (!this.isNot) {
                throw new Error('Expected promise to reject, but it resolved');
            }
        } catch (error) {
            if (this.isNot) {
                throw new Error(`Expected promise not to reject, but it rejected with: ${error.message}`);
            }
        }
    }
}

// Global test functions
const testFramework = new TestFramework();
const describe = testFramework.describe.bind(testFramework);
const it = testFramework.it.bind(testFramework);
const xit = testFramework.xit.bind(testFramework);
const beforeEach = testFramework.beforeEach.bind(testFramework);
const afterEach = testFramework.afterEach.bind(testFramework);
const beforeAll = testFramework.beforeAll.bind(testFramework);
const afterAll = testFramework.afterAll.bind(testFramework);
const expect = (actual) => new Expect(actual);

// Export
if (typeof window !== 'undefined') {
    window.TestFramework = TestFramework;
    window.Expect = Expect;
    window.testFramework = testFramework;
    window.describe = describe;
    window.it = it;
    window.xit = xit;
    window.beforeEach = beforeEach;
    window.afterEach = afterEach;
    window.beforeAll = beforeAll;
    window.afterAll = afterAll;
    window.expect = expect;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TestFramework,
        Expect,
        testFramework,
        describe,
        it,
        xit,
        beforeEach,
        afterEach,
        beforeAll,
        afterAll,
        expect
    };
}

/**
 * Unit Tests for Corpus Search System
 * Tests: fetch, cache, read, display, and filtering functionality
 *
 * Run with: node tests/corpus-search.test.js
 * Or in browser: Open tests/corpus-search.test.html
 */

// Test framework (simple assertion library)
const TestRunner = {
    tests: [],
    passed: 0,
    failed: 0,
    errors: [],

    test(name, fn) {
        this.tests.push({ name, fn });
    },

    async run() {
        console.log('Starting Corpus Search Tests...\n');
        console.log('='.repeat(60));

        for (const test of this.tests) {
            try {
                await test.fn();
                this.passed++;
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.failed++;
                this.errors.push({ name: test.name, error });
                console.error(`✗ ${test.name}`);
                console.error(`  Error: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Results: ${this.passed} passed, ${this.failed} failed`);

        if (this.errors.length > 0) {
            console.log('\nFailed Tests:');
            this.errors.forEach(({ name, error }) => {
                console.log(`  - ${name}: ${error.message}`);
            });
        }

        return { passed: this.passed, failed: this.failed, errors: this.errors };
    },

    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    },

    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected} but got ${actual}`);
        }
    },

    assertDeepEqual(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(message || `Deep equality failed:\nExpected: ${expectedStr}\nActual: ${actualStr}`);
        }
    },

    assertThrows(fn, message = 'Expected function to throw') {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message);
        }
    },

    async assertRejects(promise, message = 'Expected promise to reject') {
        try {
            await promise;
            throw new Error(message);
        } catch (e) {
            if (e.message === message) throw e;
            // Expected rejection occurred
        }
    }
};

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
    global.localStorage = {
        store: {},
        getItem(key) { return this.store[key] || null; },
        setItem(key, value) { this.store[key] = value; },
        removeItem(key) { delete this.store[key]; },
        clear() { this.store = {}; },
        get length() { return Object.keys(this.store).length; },
        key(i) { return Object.keys(this.store)[i]; }
    };
}

// Mock fetch for testing
const mockFetch = (responses = {}) => {
    return (url) => {
        const response = responses[url] || { ok: false, status: 404 };
        return Promise.resolve({
            ok: response.ok !== false,
            status: response.status || 200,
            json: () => Promise.resolve(response.data),
            text: () => Promise.resolve(response.text || JSON.stringify(response.data)),
            headers: {
                get: (name) => response.headers?.[name] || null
            }
        });
    };
};

// ============================================
// CACHE TESTS
// ============================================

TestRunner.test('CorpusCache - should store and retrieve data', () => {
    const cache = new CorpusCache('test_');
    cache.set('key1', { value: 'test' }, 60000);

    const result = cache.get('key1');
    TestRunner.assertDeepEqual(result, { value: 'test' });
});

TestRunner.test('CorpusCache - should return null for missing keys', () => {
    const cache = new CorpusCache('test_');
    const result = cache.get('nonexistent');
    TestRunner.assertEqual(result, null);
});

TestRunner.test('CorpusCache - should expire items after TTL', async () => {
    const cache = new CorpusCache('test_');
    cache.set('expiring', 'data', 50); // 50ms TTL

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = cache.get('expiring');
    TestRunner.assertEqual(result, null, 'Item should be expired');
});

TestRunner.test('CorpusCache - should clear all items with prefix', () => {
    const cache = new CorpusCache('test_prefix_');
    cache.set('a', 1, 60000);
    cache.set('b', 2, 60000);
    cache.set('c', 3, 60000);

    cache.clear();

    TestRunner.assertEqual(cache.get('a'), null);
    TestRunner.assertEqual(cache.get('b'), null);
    TestRunner.assertEqual(cache.get('c'), null);
});

TestRunner.test('CorpusCache - should cleanup expired items', async () => {
    const cache = new CorpusCache('cleanup_');
    cache.set('valid', 'data', 60000);
    cache.set('expired1', 'old', 1);
    cache.set('expired2', 'old', 1);

    await new Promise(resolve => setTimeout(resolve, 50));

    const cleaned = cache.cleanup();
    TestRunner.assertEqual(cleaned, 2, 'Should clean 2 expired items');
    TestRunner.assertDeepEqual(cache.get('valid'), 'data', 'Valid item should remain');
});

TestRunner.test('CorpusCache - should report correct stats', () => {
    localStorage.clear();
    const cache = new CorpusCache('stats_');
    cache.set('item1', 'a'.repeat(100), 60000);
    cache.set('item2', 'b'.repeat(200), 60000);

    const stats = cache.getStats();
    TestRunner.assertEqual(stats.itemCount, 2);
    TestRunner.assert(stats.totalSizeKB >= 0, 'Should have positive size');
});

TestRunner.test('CorpusCache - has() should check existence correctly', () => {
    const cache = new CorpusCache('has_');
    cache.set('exists', 'value', 60000);

    TestRunner.assertEqual(cache.has('exists'), true);
    TestRunner.assertEqual(cache.has('notexists'), false);
});

// ============================================
// GITHUB BROWSER TESTS
// ============================================

TestRunner.test('GitHubBrowser - should parse repo URLs correctly', () => {
    const browser = new GitHubBrowserUI('test-container', null);

    const tests = [
        { input: 'owner/repo', expected: { owner: 'owner', repo: 'repo' } },
        { input: 'https://github.com/owner/repo', expected: { owner: 'owner', repo: 'repo' } },
        { input: 'https://github.com/owner/repo.git', expected: { owner: 'owner', repo: 'repo' } },
        { input: 'https://github.com/owner/repo/tree/main', expected: { owner: 'owner', repo: 'repo' } },
        { input: 'invalid', expected: null }
    ];

    tests.forEach(({ input, expected }) => {
        const result = browser.parseRepoInput(input);
        TestRunner.assertDeepEqual(result, expected, `Failed for input: ${input}`);
    });
});

TestRunner.test('GitHubBrowser - should construct correct raw URLs', () => {
    const browser = new GitHubBrowser();

    // Test building raw GitHub URL
    const repo = {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main',
        path: 'data'
    };

    const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${repo.path}/file.json`;
    TestRunner.assertEqual(
        url,
        'https://raw.githubusercontent.com/test-owner/test-repo/main/data/file.json'
    );
});

TestRunner.test('GitHubBrowser - should emit events on fetch', async () => {
    const browser = new GitHubBrowser();
    let cacheHitEmitted = false;

    browser.on('cacheHit', () => { cacheHitEmitted = true; });

    // Pre-populate cache
    browser.cache.set('contents_owner_repo_main_', [{ name: 'test' }], 60000);

    await browser.fetchContents('owner', 'repo', '', 'main');

    TestRunner.assert(cacheHitEmitted, 'Should emit cacheHit event');
});

// ============================================
// PARSER TESTS
// ============================================

TestRunner.test('JSONBibleParser - should parse Bible format correctly', () => {
    const parser = new JSONBibleParser();
    const content = JSON.stringify({
        'Genesis': {
            '1': {
                '1': 'In the beginning God created the heaven and the earth.',
                '2': 'And the earth was without form, and void.'
            }
        }
    });

    const results = parser.search(content, ['beginning'], {
        caseSensitive: false,
        maxResults: 10,
        contextWords: 5,
        matchAll: false,
        corpusName: 'KJV'
    });

    TestRunner.assertEqual(results.length, 1);
    TestRunner.assertEqual(results[0].book, 'Genesis');
    TestRunner.assertEqual(results[0].chapter, '1');
    TestRunner.assertEqual(results[0].verse, '1');
});

TestRunner.test('JSONBibleParser - should respect maxResults limit', () => {
    const parser = new JSONBibleParser();
    const content = JSON.stringify({
        'Book': {
            '1': {
                '1': 'Test verse one',
                '2': 'Test verse two',
                '3': 'Test verse three'
            }
        }
    });

    const results = parser.search(content, ['test'], {
        caseSensitive: false,
        maxResults: 2,
        contextWords: 5,
        corpusName: 'Test'
    });

    TestRunner.assertEqual(results.length, 2, 'Should limit to maxResults');
});

TestRunner.test('JSONBibleParser - should handle case sensitivity', () => {
    const parser = new JSONBibleParser();
    const content = JSON.stringify({
        'Book': { '1': { '1': 'GOD said let there be light' } }
    });

    const resultsInsensitive = parser.search(content, ['god'], {
        caseSensitive: false,
        maxResults: 10,
        contextWords: 5
    });

    const resultsSensitive = parser.search(content, ['god'], {
        caseSensitive: true,
        maxResults: 10,
        contextWords: 5
    });

    TestRunner.assertEqual(resultsInsensitive.length, 1, 'Should find case-insensitive');
    TestRunner.assertEqual(resultsSensitive.length, 0, 'Should not find case-sensitive');
});

TestRunner.test('PlainTextParser - should parse line-based content', () => {
    const parser = new PlainTextParser();
    const content = `Line one with keyword
Line two without
Line three with keyword again`;

    const results = parser.search(content, ['keyword'], {
        caseSensitive: false,
        maxResults: 10,
        contextWords: 5,
        corpusName: 'Test'
    });

    TestRunner.assertEqual(results.length, 2);
    TestRunner.assertEqual(results[0].verse, '1');
    TestRunner.assertEqual(results[1].verse, '3');
});

TestRunner.test('BaseParser - matches() should handle matchAll option', () => {
    const parser = new BaseParser();

    const matchAny = parser.matches('The quick brown fox', ['quick', 'slow'], false, false);
    const matchAll = parser.matches('The quick brown fox', ['quick', 'slow'], false, true);

    TestRunner.assertEqual(matchAny, true, 'Should match any term');
    TestRunner.assertEqual(matchAll, false, 'Should require all terms');
});

TestRunner.test('BaseParser - extractContext() should include surrounding words', () => {
    const parser = new BaseParser();
    const text = 'one two three KEYWORD four five six seven eight nine ten';

    const context = parser.extractContext(text, 'keyword', 2);

    TestRunner.assert(context.includes('KEYWORD'), 'Should include keyword');
    TestRunner.assert(context.includes('three'), 'Should include before context');
    TestRunner.assert(context.includes('four'), 'Should include after context');
});

// ============================================
// CORPUS SEARCH CORE TESTS
// ============================================

TestRunner.test('CorpusSearch - should initialize with config', async () => {
    // This test requires mocking fetch
    const originalFetch = global.fetch;
    global.fetch = mockFetch({
        'corpus-config.json': {
            ok: true,
            data: {
                repositories: [{ id: 'test', name: 'Test Repo', files: [] }],
                cache_duration_minutes: 60,
                max_concurrent_fetches: 3
            }
        }
    });

    try {
        const search = new CorpusSearch('corpus-config.json');
        await search.init();

        const repos = search.getRepositories();
        TestRunner.assertEqual(repos.length, 1);
        TestRunner.assertEqual(repos[0].id, 'test');
    } finally {
        global.fetch = originalFetch;
    }
});

TestRunner.test('CorpusSearch - should build correct raw URLs', () => {
    const search = new CorpusSearch('config.json');

    const repo = {
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'data'
    };

    const url = search.buildRawURL(repo, 'file.json');
    TestRunner.assertEqual(url, 'https://raw.githubusercontent.com/owner/repo/main/data/file.json');
});

TestRunner.test('CorpusSearch - should handle empty path in URL', () => {
    const search = new CorpusSearch('config.json');

    const repo = {
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: ''
    };

    const url = search.buildRawURL(repo, 'file.json');
    TestRunner.assertEqual(url, 'https://raw.githubusercontent.com/owner/repo/main/file.json');
});

TestRunner.test('CorpusSearch - getParser() should return correct parser type', () => {
    const search = new CorpusSearch('config.json');

    const jsonParser = search.getParser('json', 'test');
    const xmlParser = search.getParser('xml', 'test');
    const txtParser = search.getParser('txt', 'test');

    TestRunner.assert(jsonParser instanceof JSONBibleParser, 'Should return JSON parser');
    TestRunner.assert(xmlParser instanceof XMLParser, 'Should return XML parser');
    TestRunner.assert(txtParser instanceof PlainTextParser, 'Should return PlainText parser');
});

TestRunner.test('CorpusSearch - should support custom parsers', () => {
    class CustomParser extends BaseParser {
        search() { return [{ custom: true }]; }
    }

    const search = new CorpusSearch('config.json', {
        'custom-format': new CustomParser()
    });

    const parser = search.getParser('custom-format', 'test');
    TestRunner.assert(parser instanceof CustomParser, 'Should return custom parser');
});

TestRunner.test('CorpusSearch - should throw error when searching with no loaded texts', async () => {
    const search = new CorpusSearch('config.json');
    search.config = { repositories: [] };

    await TestRunner.assertRejects(
        search.search('term'),
        'Should throw when no texts loaded'
    );
});

TestRunner.test('CorpusSearch - getStats() should return cache info', () => {
    const search = new CorpusSearch('config.json');
    search.config = { repositories: [1, 2, 3] };

    const stats = search.getStats();

    TestRunner.assertEqual(stats.loadedTexts, 0);
    TestRunner.assertEqual(stats.repositories, 3);
    TestRunner.assert(typeof stats.cacheSize === 'number');
});

// ============================================
// FILTER FUNCTIONALITY TESTS
// ============================================

TestRunner.test('GitHubBrowser - should filter by extension', async () => {
    const browser = new GitHubBrowser();

    // Mock the fetchContents to return test data
    browser.fetchContents = async () => [
        { name: 'file1.json', type: 'file', path: 'file1.json', size: 100 },
        { name: 'file2.xml', type: 'file', path: 'file2.xml', size: 200 },
        { name: 'file3.txt', type: 'file', path: 'file3.txt', size: 300 },
        { name: 'file4.md', type: 'file', path: 'file4.md', size: 400 }
    ];

    browser.fetchTree = async () => ({
        path: '',
        items: [
            { name: 'file1.json', type: 'file', path: 'file1.json', size: 100 },
            { name: 'file2.xml', type: 'file', path: 'file2.xml', size: 200 },
            { name: 'file3.txt', type: 'file', path: 'file3.txt', size: 300 },
            { name: 'file4.md', type: 'file', path: 'file4.md', size: 400 }
        ]
    });

    const jsonFiles = await browser.getFilteredFiles('owner', 'repo', 'main', {
        extensions: ['json']
    });

    TestRunner.assertEqual(jsonFiles.length, 1);
    TestRunner.assertEqual(jsonFiles[0].name, 'file1.json');
});

TestRunner.test('GitHubBrowser - should filter by size', async () => {
    const browser = new GitHubBrowser();

    browser.fetchTree = async () => ({
        path: '',
        items: [
            { name: 'small.json', type: 'file', path: 'small.json', size: 100 },
            { name: 'medium.json', type: 'file', path: 'medium.json', size: 500 },
            { name: 'large.json', type: 'file', path: 'large.json', size: 1000 }
        ]
    });

    const filteredFiles = await browser.getFilteredFiles('owner', 'repo', 'main', {
        minSize: 200,
        maxSize: 800
    });

    TestRunner.assertEqual(filteredFiles.length, 1);
    TestRunner.assertEqual(filteredFiles[0].name, 'medium.json');
});

TestRunner.test('GitHubBrowser - should exclude paths', async () => {
    const browser = new GitHubBrowser();

    browser.fetchTree = async () => ({
        path: '',
        items: [
            { name: 'good.json', type: 'file', path: 'src/good.json', size: 100 },
            { name: 'bad.json', type: 'file', path: 'test/bad.json', size: 100 },
            { name: 'also-bad.json', type: 'file', path: 'node_modules/also-bad.json', size: 100 }
        ]
    });

    const filteredFiles = await browser.getFilteredFiles('owner', 'repo', 'main', {
        excludePaths: ['test/', 'node_modules/']
    });

    TestRunner.assertEqual(filteredFiles.length, 1);
    TestRunner.assertEqual(filteredFiles[0].name, 'good.json');
});

// ============================================
// INTEGRATION TESTS
// ============================================

TestRunner.test('Integration - full search flow simulation', async () => {
    // Simulate complete search flow
    const cache = new CorpusCache('integration_');
    cache.clear();

    // 1. Store content in cache (simulating fetch)
    const testContent = JSON.stringify({
        'TestBook': {
            '1': {
                '1': 'This is a test verse with searchable content.',
                '2': 'Another verse without the target word.'
            }
        }
    });

    cache.set('file_content', testContent, 60000);

    // 2. Parse and search
    const parser = new JSONBibleParser();
    const content = cache.get('file_content');
    const results = parser.search(content, ['searchable'], {
        caseSensitive: false,
        maxResults: 100,
        contextWords: 5,
        corpusName: 'Test Corpus'
    });

    // 3. Verify results
    TestRunner.assertEqual(results.length, 1);
    TestRunner.assertEqual(results[0].book, 'TestBook');
    TestRunner.assertEqual(results[0].matched_term, 'searchable');

    // 4. Verify cache persistence
    const cachedContent = cache.get('file_content');
    TestRunner.assertEqual(cachedContent, testContent, 'Cache should persist');
});

// ============================================
// RUN TESTS
// ============================================

// Check if we're in a browser or Node environment
if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('DOMContentLoaded', async () => {
        const results = await TestRunner.run();

        // Display results in page
        const resultsDiv = document.getElementById('test-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <h2>Test Results</h2>
                <p class="${results.failed > 0 ? 'failed' : 'passed'}">
                    ${results.passed} passed, ${results.failed} failed
                </p>
                ${results.errors.length > 0 ? `
                    <h3>Failed Tests:</h3>
                    <ul>
                        ${results.errors.map(e => `<li><strong>${e.name}:</strong> ${e.error.message}</li>`).join('')}
                    </ul>
                ` : ''}
            `;
        }
    });
} else {
    // Node environment - auto-run
    (async () => {
        await TestRunner.run();
        process.exit(TestRunner.failed > 0 ? 1 : 0);
    })();
}

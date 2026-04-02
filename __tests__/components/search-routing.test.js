/**
 * Search Routing Tests - Sprint 1
 *
 * Tests:
 * - Search route regex matches with and without query params
 * - Query param extraction (q, mode)
 * - Header search navigation format
 */

describe('Search Route Regex', () => {
    // Mirrors the regex in spa-navigation.js routes.search
    const searchRoute = /^#?\/search\/?(\?.*)?$/;

    test('matches bare /search', () => {
        expect(searchRoute.test('/search')).toBe(true);
    });

    test('matches /search/', () => {
        expect(searchRoute.test('/search/')).toBe(true);
    });

    test('matches #/search', () => {
        expect(searchRoute.test('#/search')).toBe(true);
    });

    test('matches #/search?q=zeus', () => {
        expect(searchRoute.test('#/search?q=zeus')).toBe(true);
    });

    test('matches #/search?mode=corpus', () => {
        expect(searchRoute.test('#/search?mode=corpus')).toBe(true);
    });

    test('matches #/search?q=zeus&mode=corpus', () => {
        expect(searchRoute.test('#/search?q=zeus&mode=corpus')).toBe(true);
    });

    test('matches /search?q=odin', () => {
        expect(searchRoute.test('/search?q=odin')).toBe(true);
    });

    test('does NOT match /search/sub-path', () => {
        // Sub-paths after /search/ are not part of the route
        expect(searchRoute.test('/search/something')).toBe(false);
    });

    test('does NOT match /searching', () => {
        expect(searchRoute.test('/searching')).toBe(false);
    });

    test('does NOT match /searchresults', () => {
        expect(searchRoute.test('/searchresults')).toBe(false);
    });
});

describe('Query Param Extraction', () => {
    // Mirrors the extraction logic added to spa-navigation.js
    function extractSearchParams(path) {
        const queryStr = path.includes('?') ? path.split('?')[1] : '';
        return new URLSearchParams(queryStr);
    }

    test('extracts q param from #/search?q=zeus', () => {
        const params = extractSearchParams('#/search?q=zeus');
        expect(params.get('q')).toBe('zeus');
    });

    test('extracts mode param from #/search?mode=corpus', () => {
        const params = extractSearchParams('#/search?mode=corpus');
        expect(params.get('mode')).toBe('corpus');
    });

    test('extracts both q and mode from #/search?q=zeus&mode=corpus', () => {
        const params = extractSearchParams('#/search?q=zeus&mode=corpus');
        expect(params.get('q')).toBe('zeus');
        expect(params.get('mode')).toBe('corpus');
    });

    test('returns null for missing q param on bare /search', () => {
        const params = extractSearchParams('/search');
        expect(params.get('q')).toBeNull();
    });

    test('returns null for missing mode param on bare /search', () => {
        const params = extractSearchParams('/search');
        expect(params.get('mode')).toBeNull();
    });

    test('handles URL-encoded query values', () => {
        const params = extractSearchParams('#/search?q=sun%20god');
        expect(params.get('q')).toBe('sun god');
    });

    test('handles empty query string after ?', () => {
        const params = extractSearchParams('#/search?');
        expect(params.get('q')).toBeNull();
        expect(params.get('mode')).toBeNull();
    });
});

describe('Header Search Navigation Format', () => {
    // Mirrors the navigation logic in header-nav.js setupHeaderSearch()
    function buildSearchHash(query, mode) {
        const encoded = encodeURIComponent(query.trim());
        const modeStr = mode === 'corpus' ? '&mode=corpus' : '';
        return `#/search?q=${encoded}${modeStr}`;
    }

    test('basic search produces correct hash', () => {
        expect(buildSearchHash('zeus', '')).toBe('#/search?q=zeus');
    });

    test('corpus search appends mode=corpus', () => {
        expect(buildSearchHash('odin', 'corpus')).toBe('#/search?q=odin&mode=corpus');
    });

    test('encodes special characters in query', () => {
        expect(buildSearchHash('sun god', '')).toBe('#/search?q=sun%20god');
    });

    test('trims whitespace from query', () => {
        expect(buildSearchHash('  zeus  ', '')).toBe('#/search?q=zeus');
    });

    test('search hash is matched by route regex', () => {
        const searchRoute = /^#?\/search(\?.*)?$/;
        const hash = buildSearchHash('zeus', 'corpus');
        expect(searchRoute.test(hash)).toBe(true);
    });
});

describe('Guidelines Route', () => {
    const guidelinesRoute = /^#?\/guidelines\/?$/;

    test('matches /guidelines', () => {
        expect(guidelinesRoute.test('/guidelines')).toBe(true);
    });

    test('matches #/guidelines', () => {
        expect(guidelinesRoute.test('#/guidelines')).toBe(true);
    });

    test('matches /guidelines/', () => {
        expect(guidelinesRoute.test('/guidelines/')).toBe(true);
    });

    test('does NOT match /guidelinesfoo', () => {
        expect(guidelinesRoute.test('/guidelinesfoo')).toBe(false);
    });
});

describe('Corpus Explorer Route', () => {
    const corpusExplorerRoute = /^#?\/corpus-explorer\/?$/;

    test('matches /corpus-explorer', () => {
        expect(corpusExplorerRoute.test('/corpus-explorer')).toBe(true);
    });

    test('matches #/corpus-explorer', () => {
        expect(corpusExplorerRoute.test('#/corpus-explorer')).toBe(true);
    });

    test('does NOT match /corpus-explorer?q=test (no query params supported)', () => {
        // corpus-explorer redirects to separate HTML page, no query params needed
        expect(corpusExplorerRoute.test('/corpus-explorer?q=test')).toBe(false);
    });
});

/**
 * EntityBaseLoader unit tests
 *
 * Covers:
 *  1. getManifest — fetches and caches manifest on first call
 *  2. getManifest — returns in-memory cache on second call (no second fetch)
 *  3. getManifest — serves from localStorage when TTL is fresh
 *  4. getManifest — ignores stale localStorage and re-fetches
 *  5. getManifest — concurrent callers share one in-flight fetch
 *  6. load — returns Map from CDN for known collection
 *  7. load — returns null when collection not in manifest
 *  8. load — returns empty Map when mythology not exported
 *  9. load — serves from localStorage on second call (no second CDN fetch)
 * 10. load — concurrent callers for same key share one in-flight fetch
 * 11. load — returns null on CDN fetch failure (caller falls back)
 * 12. _purgeOldVersions — removes stale version entries for collection
 * 13. invalidateManifest — clears in-memory manifest and localStorage key
 * 14. getVersion / getGeneratedAt — delegates to getManifest
 * 15. hasCollection — returns true/false based on manifest
 */

const consoleLog  = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
afterAll(() => { consoleLog.mockRestore(); consoleWarn.mockRestore(); });

// ── helpers ───────────────────────────────────────────────────────────────────

function makeManifest(overrides = {}) {
    return {
        version: 'abc123',
        generatedAt: '2026-05-15T00:00:00.000Z',
        collections: {
            deities: { total: 3, mythologies: ['greek', 'norse'], mythologyCounts: { greek: 2, norse: 1 } },
            herbs:   { total: 2, mythologies: ['general'],        mythologyCounts: { general: 2 } },
        },
        ...overrides,
    };
}

function makeEntities(ids) {
    return ids.map(id => ({ id, name: id }));
}

function mockFetch(responses) {
    global.fetch = jest.fn(async (url) => {
        for (const r of responses) {
            if (url.includes(r.url)) {
                const status = r.status || 200;
                return { ok: status < 400, status, json: async () => r.data };
            }
        }
        return { ok: false, status: 404, json: async () => null };
    });
}

// ── module load ───────────────────────────────────────────────────────────────

global.window = global.window || {};
global.firebase = { firestore: jest.fn() };

const EntityBaseLoader = require('../../js/services/entity-base-loader.js');

// ── tests ─────────────────────────────────────────────────────────────────────

describe('EntityBaseLoader.getManifest()', () => {
    let loader;

    beforeEach(() => {
        loader = new EntityBaseLoader();
        localStorage.clear();
    });

    test('1. fetches manifest from CDN on first call', async () => {
        mockFetch([{ url: 'manifest.json', data: makeManifest() }]);

        const result = await loader.getManifest();

        expect(result.version).toBe('abc123');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('2. returns in-memory cache on second call without re-fetching', async () => {
        mockFetch([{ url: 'manifest.json', data: makeManifest() }]);

        await loader.getManifest();
        await loader.getManifest();

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('3. serves fresh manifest from localStorage without fetching', async () => {
        const manifest = makeManifest();
        localStorage.setItem('eoa_base_manifest', JSON.stringify({ data: manifest, ts: Date.now() - 1000 }));
        mockFetch([{ url: 'manifest.json', data: makeManifest({ version: 'other' }) }]);

        const result = await loader.getManifest();

        expect(result.version).toBe('abc123');
        expect(fetch).not.toHaveBeenCalled();
    });

    test('4. re-fetches when localStorage entry is stale (> MANIFEST_TTL)', async () => {
        const stale = makeManifest({ version: 'stale' });
        localStorage.setItem('eoa_base_manifest', JSON.stringify({ data: stale, ts: Date.now() - 10 * 60 * 1000 }));
        const fresh = makeManifest({ version: 'fresh' });
        mockFetch([{ url: 'manifest.json', data: fresh }]);

        const result = await loader.getManifest();

        expect(result.version).toBe('fresh');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('5. concurrent callers share one in-flight fetch', async () => {
        mockFetch([{ url: 'manifest.json', data: makeManifest() }]);

        const [a, b, c] = await Promise.all([
            loader.getManifest(),
            loader.getManifest(),
            loader.getManifest(),
        ]);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(a.version).toBe(b.version);
        expect(b.version).toBe(c.version);
    });
});

describe('EntityBaseLoader.load()', () => {
    let loader;

    beforeEach(() => {
        loader = new EntityBaseLoader();
        localStorage.clear();
    });

    test('6. returns Map from CDN for known collection+mythology', async () => {
        loader._manifest = makeManifest();
        const entities = makeEntities(['zeus', 'athena']);
        mockFetch([{ url: 'deities/greek.json', data: entities }]);

        const result = await loader.load('deities', 'greek');

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(2);
        expect(result.get('zeus').name).toBe('zeus');
    });

    test('7. returns null when collection not in manifest', async () => {
        loader._manifest = makeManifest();

        const result = await loader.load('unknown-collection', 'greek');

        expect(result).toBeNull();
    });

    test('8. returns empty Map when mythology not exported for that collection', async () => {
        loader._manifest = makeManifest();
        mockFetch([]); // no CDN calls expected

        const result = await loader.load('deities', 'aztec'); // not in manifest

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
    });

    test('9. serves entities from localStorage on second call (no extra CDN fetch)', async () => {
        loader._manifest = makeManifest();
        const entities = makeEntities(['zeus']);
        mockFetch([{ url: 'deities/greek.json', data: entities }]);

        await loader.load('deities', 'greek');

        // Second loader reuses same localStorage; manifest pre-set
        const loader2 = new EntityBaseLoader();
        loader2._manifest = makeManifest();
        const result = await loader2.load('deities', 'greek');

        expect(result.size).toBe(1);
        // Only one CDN fetch for entities (first loader only)
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('10. concurrent callers for same key share one in-flight fetch', async () => {
        loader._manifest = makeManifest();
        const entities = makeEntities(['thor']);
        mockFetch([{ url: 'deities/norse.json', data: entities }]);

        const [a, b] = await Promise.all([
            loader.load('deities', 'norse'),
            loader.load('deities', 'norse'),
        ]);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(a.size).toBe(b.size);
    });

    test('11. returns null on CDN fetch failure so caller can fall back', async () => {
        loader._manifest = makeManifest();
        mockFetch([{ url: 'deities/greek.json', status: 503, data: null }]);

        const result = await loader.load('deities', 'greek');

        expect(result).toBeNull();
    });
});

describe('EntityBaseLoader._purgeOldVersions()', () => {
    test('12. removes entries for same collection with different version', () => {
        localStorage.setItem('eoa_base_OLD_deities_greek',   'stale');
        localStorage.setItem('eoa_base_abc123_deities_greek', 'current');
        localStorage.setItem('eoa_base_OLD_herbs_general',   'keep — different collection');

        const loader = new EntityBaseLoader();
        loader._purgeOldVersions('deities', 'abc123');

        expect(localStorage.getItem('eoa_base_OLD_deities_greek')).toBeNull();
        expect(localStorage.getItem('eoa_base_abc123_deities_greek')).toBe('current');
        expect(localStorage.getItem('eoa_base_OLD_herbs_general')).toBe('keep — different collection');
    });
});

describe('EntityBaseLoader.invalidateManifest()', () => {
    test('13. clears in-memory manifest and removes localStorage key', () => {
        const loader = new EntityBaseLoader();
        loader._manifest = makeManifest();
        localStorage.setItem('eoa_base_manifest', JSON.stringify({ data: makeManifest(), ts: Date.now() }));

        loader.invalidateManifest();

        expect(loader._manifest).toBeNull();
        expect(localStorage.getItem('eoa_base_manifest')).toBeNull();
    });
});

describe('EntityBaseLoader convenience methods', () => {
    test('14. getVersion and getGeneratedAt delegate to getManifest', async () => {
        const loader = new EntityBaseLoader();
        loader._manifest = makeManifest();

        expect(await loader.getVersion()).toBe('abc123');
        expect(await loader.getGeneratedAt()).toBe('2026-05-15T00:00:00.000Z');
    });

    test('15. hasCollection returns true/false based on manifest', async () => {
        const loader = new EntityBaseLoader();
        loader._manifest = makeManifest();

        expect(await loader.hasCollection('deities')).toBe(true);
        expect(await loader.hasCollection('missing')).toBe(false);
    });
});

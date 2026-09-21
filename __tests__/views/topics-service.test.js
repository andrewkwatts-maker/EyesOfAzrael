/**
 * TopicsService - static/topics.json / static/topics/<collection>.json split
 *
 * static/topics.json used to hold every collection's full topic rows
 * (members included) and prominence map, so any page that touched topics at
 * all downloaded the whole ~725KB file regardless of which one collection it
 * actually needed. The file is now split: static/topics.json carries only
 * header-only topic rows (no `members`) plus the small cross-collection
 * tables (regions, shadowed, traditionCounts, otherTraditions), and each
 * collection's full rows + prominence map live in their own
 * static/topics/<collection>.json.
 *
 * These tests guard the contract between the two: that a caller asking for
 * one collection's data only ever fetches that collection's file (never the
 * whole corpus), and that the shared index never regains a `members` array.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

function loadFixture(relPath) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

describe('TopicsService', () => {
    let sharedIndex;
    let deitiesFile;
    let fetchMock;

    beforeAll(() => {
        sharedIndex = loadFixture('static/topics.json');
        deitiesFile = loadFixture('static/topics/deities.json');
    });

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = '';

        fetchMock = jest.fn((url) => {
            if (url === '/static/topics.json') {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(sharedIndex) });
            }
            const match = /^\/static\/topics\/([^/]+)\.json$/.exec(url);
            if (match) {
                const file = path.join(ROOT, 'static/topics', `${match[1]}.json`);
                if (!fs.existsSync(file)) return Promise.resolve({ ok: false });
                return Promise.resolve({ ok: true, json: () => Promise.resolve(loadFixture(`static/topics/${match[1]}.json`)) });
            }
            return Promise.resolve({ ok: false });
        });
        global.fetch = fetchMock;

        require('../../js/views/topics-view.js');
        // Static per-run caches must not leak between tests.
        TopicsService._loadPromise = null;
        TopicsService._collectionPromises = new Map();
        TopicsService._reverseIndexByCollection = new Map();
    });

    afterEach(() => {
        delete global.fetch;
    });

    describe('shared index (static/topics.json)', () => {
        test('never carries a `members` array on any topic header', () => {
            for (const topics of Object.values(sharedIndex.topicsIndex)) {
                for (const topic of topics) {
                    expect(topic.members).toBeUndefined();
                }
            }
        });

        test('is small: fetching it costs nowhere near a whole collection file', () => {
            const sharedBytes = Buffer.byteLength(JSON.stringify(sharedIndex));
            const deitiesBytes = Buffer.byteLength(JSON.stringify(deitiesFile));
            expect(sharedBytes).toBeLessThan(deitiesBytes);
        });

        test('allTopics() reads the shared index and fetches no collection file', async () => {
            const topics = await TopicsService.allTopics();

            expect(topics.length).toBeGreaterThan(0);
            expect(topics.every((t) => t.members === undefined)).toBe(true);
            expect(fetchMock).toHaveBeenCalledWith('/static/topics.json');
            expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/^\/static\/topics\//));
        });

        test('regions(), shadowed() and traditionCounts() come from the shared file alone', async () => {
            const regions = await TopicsService.regions();
            expect(regions).toEqual(sharedIndex.regions);

            const shadowed = await TopicsService.shadowed('deities');
            expect(shadowed).toEqual(new Set(sharedIndex.shadowed.deities || []));

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith('/static/topics.json');
        });

        test('collections() returns the shared collections map', async () => {
            expect(await TopicsService.collections()).toEqual(sharedIndex.collections);
        });

        test('otherTraditions() returns the shared leftover-traditions list', async () => {
            expect(await TopicsService.otherTraditions()).toEqual(sharedIndex.otherTraditions);
        });

        test('traditionCounts() looks up a tradition case- and separator-insensitively', async () => {
            const [key] = Object.keys(sharedIndex.traditionCounts);
            const expected = sharedIndex.traditionCounts[key];

            expect(await TopicsService.traditionCounts(key)).toEqual(expected);
            expect(await TopicsService.traditionCounts(key.toUpperCase())).toEqual(expected);
            expect(await TopicsService.traditionCounts(key.replace(/ /g, '_'))).toEqual(expected);
        });

        test('traditionCounts() returns null for a tradition with no recorded counts', async () => {
            expect(await TopicsService.traditionCounts('no-such-tradition-at-all')).toBeNull();
        });

        test('collections()/otherTraditions()/traditionCounts() all share one fetch of the shared index', async () => {
            await TopicsService.collections();
            await TopicsService.otherTraditions();
            await TopicsService.traditionCounts('greek');
            expect(fetchMock.mock.calls.filter(([url]) => url === '/static/topics.json').length).toBe(1);
        });
    });

    describe('per-collection files (static/topics/<collection>.json)', () => {
        test('topicsFor(collection) fetches only that collection, with members intact', async () => {
            const topics = await TopicsService.topicsFor('deities');

            expect(topics).toEqual(deitiesFile.topics);
            expect(topics.some((t) => (t.members || []).length > 0)).toBe(true);
            expect(fetchMock).toHaveBeenCalledWith('/static/topics/deities.json');
            expect(fetchMock).not.toHaveBeenCalledWith('/static/topics.json');
        });

        test('prominence(collection) returns that collection\'s score map from its own file', async () => {
            const scores = await TopicsService.prominence('deities');
            expect(scores).toEqual(deitiesFile.prominent);
        });

        test('a second call for the same collection reuses the cached promise (fetched once)', async () => {
            await TopicsService.topicsFor('deities');
            await TopicsService.prominence('deities');
            await TopicsService.topic('deities', deitiesFile.topics[0].slug);

            const collectionFetches = fetchMock.mock.calls.filter(([url]) => url === '/static/topics/deities.json');
            expect(collectionFetches.length).toBe(1);
        });

        test('browsing a second collection fetches only that collection, not the first again', async () => {
            await TopicsService.topicsFor('deities');
            await TopicsService.topicsFor('creatures');

            expect(fetchMock).toHaveBeenCalledWith('/static/topics/deities.json');
            expect(fetchMock).toHaveBeenCalledWith('/static/topics/creatures.json');
            const deityFetches = fetchMock.mock.calls.filter(([url]) => url === '/static/topics/deities.json');
            expect(deityFetches.length).toBe(1);
        });
    });

    describe('topicsForEntity()', () => {
        test('finds a real member\'s topics using only its own collection\'s file', async () => {
            const [topicWithMembers] = deitiesFile.topics.filter((t) => (t.members || []).length > 0);
            const [memberId] = topicWithMembers.members[0];

            const hits = await TopicsService.topicsForEntity('deities', memberId);

            expect(hits.some((h) => h.slug === topicWithMembers.slug)).toBe(true);
            expect(hits.every((h) => h.collection === 'deities')).toBe(true);
            expect(fetchMock).toHaveBeenCalledWith('/static/topics/deities.json');
            expect(fetchMock).not.toHaveBeenCalledWith('/static/topics/creatures.json');
        });

        test('an id with no assignments returns an empty list, not an error', async () => {
            const hits = await TopicsService.topicsForEntity('deities', 'no-such-entity-id');
            expect(hits).toEqual([]);
        });
    });
});

/**
 * TopicsUI rendering helpers and TopicsService.resolve()
 *
 * Topic pages are assembled entirely from these five helpers, and every one of
 * them interpolates entity-supplied text straight into an HTML string -- names,
 * blurbs, icons and ids that reach the site through submissions. The escaping
 * is therefore the only thing between a submitted name and script execution on
 * a topic page, and none of it was covered.
 *
 * resolve() is the step where a topic's member ids become renderable records.
 * Its contract distinguishes null ("could not consult the base", retryable)
 * from [] ("consulted, nothing there", a real answer) -- a distinction its
 * callers act on, and which is easy to collapse by accident.
 */

const { TopicsService, TopicsUI } = require('../../js/views/topics-view.js');

describe('TopicsUI.escape', () => {
    test('escapes every character that could break out of markup or an attribute', () => {
        expect(TopicsUI.escape('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    test('neutralises a script tag rather than passing it through', () => {
        expect(TopicsUI.escape('<script>alert(1)</script>'))
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('escapes the ampersand first, so an entity cannot be reassembled', () => {
        // Naive sequential replacement turns &lt; into &amp;lt; only if & is
        // handled first; getting this backwards would re-create a live `<`.
        expect(TopicsUI.escape('&lt;')).toBe('&amp;lt;');
    });

    test('null and undefined render as empty, not as the words "null"/"undefined"', () => {
        expect(TopicsUI.escape(null)).toBe('');
        expect(TopicsUI.escape(undefined)).toBe('');
    });

    test('zero and false are kept, since they are real values', () => {
        expect(TopicsUI.escape(0)).toBe('0');
        expect(TopicsUI.escape(false)).toBe('false');
    });

    test('leaves text with nothing to escape untouched', () => {
        expect(TopicsUI.escape('Zeus of Olympus')).toBe('Zeus of Olympus');
    });
});

describe('TopicsUI.titleCase', () => {
    test('turns slug separators into spaced words', () => {
        expect(TopicsUI.titleCase('greek_mythology')).toBe('Greek Mythology');
        expect(TopicsUI.titleCase('near-eastern')).toBe('Near Eastern');
    });

    test('collapses runs of separators rather than leaving gaps', () => {
        expect(TopicsUI.titleCase('a__b--c')).toBe('A B C');
    });

    test('empty, null and undefined all produce an empty string', () => {
        expect(TopicsUI.titleCase('')).toBe('');
        expect(TopicsUI.titleCase(null)).toBe('');
        expect(TopicsUI.titleCase(undefined)).toBe('');
    });
});

describe('TopicsUI.entityCard', () => {
    test('escapes a name carrying markup instead of emitting it', () => {
        const html = TopicsUI.entityCard(
            { id: 'x', name: '<img src=x onerror=alert(1)>' },
            'deities'
        );
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    test('percent-encodes the collection and id into the href', () => {
        const html = TopicsUI.entityCard({ id: 'a b/c', name: 'A' }, 'de ities');
        expect(html).toContain('href="#/entity/de%20ities/a%20b%2Fc"');
    });

    test('an id containing a quote cannot terminate the href attribute', () => {
        const html = TopicsUI.entityCard({ id: 'a"b', name: 'A' }, 'deities');
        expect(html).toContain('href="#/entity/deities/a%22b"');
    });

    test('falls back to the id when the entity has no name', () => {
        expect(TopicsUI.entityCard({ id: 'zeus' }, 'deities')).toContain('>zeus<');
    });

    test('uses a diamond placeholder when no icon is supplied', () => {
        expect(TopicsUI.entityCard({ id: 'zeus', name: 'Zeus' }, 'deities')).toContain('◆');
    });

    test('renders the tradition as a title-cased label', () => {
        const html = TopicsUI.entityCard(
            { id: 'zeus', name: 'Zeus', mythology: 'greek' },
            'deities'
        );
        expect(html).toContain('topic-entity-tradition');
        expect(html).toContain('Greek');
    });

    test('omits the tradition and blurb elements entirely when absent', () => {
        const html = TopicsUI.entityCard({ id: 'zeus', name: 'Zeus' }, 'deities');
        expect(html).not.toContain('topic-entity-tradition');
        expect(html).not.toContain('topic-entity-blurb');
    });

    test('takes the blurb from whichever description field is present', () => {
        const short = TopicsUI.entityCard({ id: 'a', name: 'A', shortDescription: 'from-short' }, 'c');
        const sub = TopicsUI.entityCard({ id: 'a', name: 'A', subtitle: 'from-subtitle' }, 'c');
        const desc = TopicsUI.entityCard({ id: 'a', name: 'A', description: 'from-description' }, 'c');
        expect(short).toContain('from-short');
        expect(sub).toContain('from-subtitle');
        expect(desc).toContain('from-description');
    });

    test('prefers shortDescription over the longer fields', () => {
        const html = TopicsUI.entityCard(
            { id: 'a', name: 'A', shortDescription: 'chosen', description: 'ignored' },
            'c'
        );
        expect(html).toContain('chosen');
        expect(html).not.toContain('ignored');
    });

    test('collapses newlines and runs of spaces in the blurb to single spaces', () => {
        const html = TopicsUI.entityCard(
            { id: 'a', name: 'A', description: 'one\n\ttwo   three' },
            'c'
        );
        expect(html).toContain('one two three');
    });

    test('truncates the blurb to 130 characters', () => {
        const html = TopicsUI.entityCard({ id: 'a', name: 'A', description: 'x'.repeat(500) }, 'c');
        const blurb = html.match(/topic-entity-blurb">([^<]*)</)[1];
        expect(blurb).toHaveLength(130);
    });
});

describe('TopicsUI.topicTile', () => {
    const topic = { collection: 'deities', slug: 'gods-of-the-dead', name: 'Gods of the Dead', total: 42 };

    test('links to the topic route with collection and slug encoded', () => {
        expect(TopicsUI.topicTile(topic))
            .toContain('href="#/topic/deities/gods-of-the-dead"');
    });

    test('encodes a slug containing a slash rather than forging a deeper route', () => {
        const html = TopicsUI.topicTile({ ...topic, slug: 'a/b' });
        expect(html).toContain('href="#/topic/deities/a%2Fb"');
    });

    test('shows the member count', () => {
        expect(TopicsUI.topicTile(topic)).toContain('>42<');
    });

    test('renders a count of zero rather than dropping it', () => {
        expect(TopicsUI.topicTile({ ...topic, total: 0 })).toContain('>0<');
    });

    test('escapes a name carrying markup', () => {
        const html = TopicsUI.topicTile({ ...topic, name: '<b>x</b>' });
        expect(html).not.toContain('<b>');
        expect(html).toContain('&lt;b&gt;');
    });

    test('includes the blurb only when there is one', () => {
        expect(TopicsUI.topicTile(topic)).not.toContain('topic-tile-blurb');
        expect(TopicsUI.topicTile({ ...topic, blurb: 'Psychopomps' }))
            .toContain('Psychopomps');
    });
});

describe('TopicsUI.regionTile', () => {
    const region = { slug: 'mediterranean', name: 'Mediterranean', total: 900, traditions: [] };

    test('links to the region route with the slug encoded', () => {
        expect(TopicsUI.regionTile(region)).toContain('href="#/region/mediterranean"');
    });

    test('reports the entry count and the number of traditions', () => {
        const html = TopicsUI.regionTile({
            ...region,
            traditions: [{ name: 'greek' }, { name: 'roman' }]
        });
        expect(html).toContain('900 entries · 2 traditions');
    });

    test('treats a missing traditions list as none rather than failing', () => {
        const html = TopicsUI.regionTile({ slug: 'x', name: 'X', total: 1 });
        expect(html).toContain('1 entries · 0 traditions');
        expect(html).not.toContain('region-tile-traditions');
    });

    test('title-cases the tradition names it lists', () => {
        const html = TopicsUI.regionTile({
            ...region,
            traditions: [{ name: 'near_eastern' }]
        });
        expect(html).toContain('Near Eastern');
    });

    test('lists at most five traditions, however many there are', () => {
        const html = TopicsUI.regionTile({
            ...region,
            traditions: 'abcdefgh'.split('').map((n) => ({ name: n }))
        });
        const listed = html.match(/region-tile-traditions">([^<]*)</)[1];
        expect(listed.split(' · ')).toHaveLength(5);
        // The count still reports the true total, not the truncated list.
        expect(html).toContain('8 traditions');
    });

    test('escapes a tradition name carrying markup', () => {
        const html = TopicsUI.regionTile({
            ...region,
            traditions: [{ name: '<i>x</i>' }]
        });
        expect(html).not.toContain('<i>');
    });
});

describe('TopicsUI.empty', () => {
    test('always carries an h1, because this state replaces the whole view', () => {
        // Without it the document has no heading at all: nothing for a screen
        // reader to orient by and nothing for the route announcer to read.
        expect(TopicsUI.empty('No entries.')).toContain('<h1>');
    });

    test('uses a default heading when none is given', () => {
        expect(TopicsUI.empty('No entries.')).toContain('<h1>Nothing here</h1>');
    });

    test('uses the heading it is given', () => {
        expect(TopicsUI.empty('No entries.', 'Topic not found'))
            .toContain('<h1>Topic not found</h1>');
    });

    test('escapes both the message and the heading', () => {
        const html = TopicsUI.empty('<script>m</script>', '<script>h</script>');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });

    test('offers a way out of the dead end', () => {
        const html = TopicsUI.empty('No entries.');
        expect(html).toContain('href="#/explore"');
        expect(html).toContain('href="#/mythologies"');
    });
});

describe('TopicsService.resolve', () => {
    const members = [['zeus', 'greek'], ['odin', 'norse']];

    afterEach(() => {
        delete window.entityBaseLoader;
        jest.restoreAllMocks();
    });

    test('returns null when the entity base never arrives', async () => {
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue(null);
        await expect(TopicsService.resolve('deities', members)).resolves.toBeNull();
    });

    test('returns null when the base throws, so the caller can retry', async () => {
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue({
            load: () => Promise.reject(new Error('network'))
        });
        await expect(TopicsService.resolve('deities', members)).resolves.toBeNull();
    });

    test('returns an empty array when the base is consulted and holds nothing', async () => {
        // A real answer, distinct from null: there is nothing to retry.
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue({
            load: () => Promise.resolve(null)
        });
        await expect(TopicsService.resolve('deities', members)).resolves.toEqual([]);
    });

    test('maps member ids to their records, in the order the topic lists them', async () => {
        const base = new Map([
            ['zeus', { id: 'zeus', name: 'Zeus' }],
            ['odin', { id: 'odin', name: 'Odin' }]
        ]);
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue({
            load: () => Promise.resolve(base)
        });
        const out = await TopicsService.resolve('deities', members);
        expect(out.map((r) => r.name)).toEqual(['Zeus', 'Odin']);
    });

    test('accepts members given as objects as well as [id, tradition] pairs', async () => {
        const base = new Map([['zeus', { id: 'zeus', name: 'Zeus' }]]);
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue({
            load: () => Promise.resolve(base)
        });
        const out = await TopicsService.resolve('deities', [{ id: 'zeus' }]);
        expect(out).toHaveLength(1);
        expect(out[0].name).toBe('Zeus');
    });

    test('drops ids the base does not know rather than rendering them blank', async () => {
        const base = new Map([['zeus', { id: 'zeus', name: 'Zeus' }]]);
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue({
            load: () => Promise.resolve(base)
        });
        const out = await TopicsService.resolve('deities', [['zeus'], ['nobody']]);
        expect(out).toHaveLength(1);
        expect(out[0].id).toBe('zeus');
    });

    test('an empty member list resolves to an empty array', async () => {
        jest.spyOn(TopicsService, '_waitForLoader').mockResolvedValue({
            load: () => Promise.resolve(new Map())
        });
        await expect(TopicsService.resolve('deities', [])).resolves.toEqual([]);
    });
});

describe('TopicsService._waitForLoader', () => {
    afterEach(() => { delete window.entityBaseLoader; });

    test('returns the loader as soon as it is present', async () => {
        const loader = { load: jest.fn() };
        window.entityBaseLoader = loader;
        await expect(TopicsService._waitForLoader(1000)).resolves.toBe(loader);
    });

    test('gives up after the timeout rather than waiting forever', async () => {
        await expect(TopicsService._waitForLoader(0)).resolves.toBeNull();
    });

    test('waits for a loader that arrives late, instead of failing immediately', async () => {
        // A topic page opened directly renders before entity-base-loader.js has
        // run; giving up at once showed "no entries" for a topic with hundreds.
        const loader = { load: jest.fn() };
        setTimeout(() => { window.entityBaseLoader = loader; }, 150);
        await expect(TopicsService._waitForLoader(5000)).resolves.toBe(loader);
    });
});

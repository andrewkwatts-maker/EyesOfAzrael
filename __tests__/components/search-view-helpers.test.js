/**
 * SearchViewComplete — the pure helpers behind the results list
 *
 * Escaping, highlighting, truncation, filtering and the static HTML blocks.
 * None of these need Firestore or the DOM lifecycle, and they were the least
 * covered part of the most user-facing component in the app.
 *
 * The escaping tests matter most: search renders a user-supplied query and
 * entity text straight into markup, and `highlightMatch` builds a RegExp out of
 * the query, so both an XSS payload and a regex metacharacter reach code paths
 * a reader controls.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

window.DOMAINS = require('../../js/config/domains.js');
const SearchViewComplete = require('../../js/components/search-view-complete.js');

function makeView() {
    return new SearchViewComplete({ collection: () => ({}) });
}

describe('escaping and highlighting', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('escapeHtml neutralises markup', () => {
        expect(view.escapeHtml('<script>alert(1)</script>'))
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('escapeHtml returns empty for falsy input', () => {
        expect(view.escapeHtml('')).toBe('');
        expect(view.escapeHtml(null)).toBe('');
        expect(view.escapeHtml(undefined)).toBe('');
    });

    test('escapeRegex neutralises metacharacters', () => {
        expect(view.escapeRegex('a.b*c')).toBe('a\\.b\\*c');
        expect(view.escapeRegex('(x)[y]')).toBe('\\(x\\)\\[y\\]');
    });

    test('highlightMatch wraps the matched run', () => {
        expect(view.highlightMatch('Zeus the King', 'zeus'))
            .toBe('<mark class="search-highlight">Zeus</mark> the King');
    });

    test('highlightMatch is case-insensitive and marks every occurrence', () => {
        const out = view.highlightMatch('Ra and ra', 'ra');
        expect(out.match(/<mark/g)).toHaveLength(2);
    });

    test('highlightMatch escapes the text before marking it', () => {
        const out = view.highlightMatch('<b>Zeus</b>', 'zeus');
        expect(out).not.toContain('<b>');
        expect(out).toContain('&lt;b&gt;');
    });

    test('a regex metacharacter in the query does not throw', () => {
        // The query becomes a RegExp. An unescaped '(' would be a syntax error
        // and would blank the entire results list.
        expect(() => view.highlightMatch('a(b', '(')).not.toThrow();
        expect(() => view.highlightMatch('a*b', '*')).not.toThrow();
        expect(() => view.highlightMatch('a[b', '[')).not.toThrow();
    });

    test('highlightMatch passes through when there is nothing to match', () => {
        expect(view.highlightMatch('Zeus', '')).toBe('Zeus');
        expect(view.highlightMatch('', 'zeus')).toBe('');
    });
});

describe('description highlighting', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('returns empty for no text', () => {
        expect(view.highlightMatchInDescription('', 'x')).toBe('');
        expect(view.highlightMatchInDescription(null, 'x')).toBe('');
    });

    test('truncates a long description', () => {
        const out = view.highlightMatchInDescription('x'.repeat(400), '');
        expect(out.length).toBeLessThan(400);
        expect(out).toContain('...');
    });

    test('windows around a match that appears late in the text', () => {
        const text = `${'a'.repeat(100)} needle tail`;
        const out = view.highlightMatchInDescription(text, 'needle');

        expect(out.startsWith('...')).toBe(true);
        expect(out).toContain('<mark');
    });

    test('does not window a match near the start', () => {
        const out = view.highlightMatchInDescription('needle in the text', 'needle');
        expect(out.startsWith('...')).toBe(false);
    });
});

describe('path truncation', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('leaves a short path alone', () => {
        expect(view.truncatePath('Greek / Deities')).toBe('Greek / Deities');
    });

    test('shortens the facet half of a long two-part path', () => {
        const out = view.truncatePath(`${'A'.repeat(60)} / Deities`);
        expect(out).toContain('... / Deities');
        expect(out.length).toBeLessThan(80);
    });

    test('escapes as it truncates', () => {
        expect(view.truncatePath('<b>Greek</b> / Deities')).not.toContain('<b>');
    });

    test('falls back to a plain cut when the path is not two parts', () => {
        const out = view.truncatePath('x'.repeat(80));
        expect(out.endsWith('...')).toBe(true);
    });
});

describe('small helpers', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('getDefaultIcon knows the common types and has a fallback', () => {
        expect(view.getDefaultIcon('deities')).toBe('✨');
        expect(view.getDefaultIcon('creatures')).toBe('\u{1F432}');
        expect(view.getDefaultIcon('hist_figures')).toBe('\u{1F4D6}');
    });

    test('formatEntityType capitalises', () => {
        expect(view.formatEntityType('deities')).toBe('Deities');
    });

    test('getItemHeight differs by display mode', () => {
        expect(view.getItemHeight('grid')).toBe(320);
        expect(view.getItemHeight('list')).toBe(120);
    });

    test('getSpellingHint corrects a known misspelling and is case-insensitive', () => {
        expect(view.getSpellingHint('zues')).toBe('Zeus');
        expect(view.getSpellingHint('ZUES')).toBe('Zeus');
        expect(view.getSpellingHint('posieden')).toBe('Poseidon');
    });

    test('getSpellingHint returns null for a query it does not know', () => {
        expect(view.getSpellingHint('cerberus')).toBeNull();
    });

    test('getSuggestions omits anything containing the current query', () => {
        view.state.query = 'zeu';
        expect(view.getSuggestions()).not.toContain('zeus');
        expect(view.getSuggestions().length).toBeLessThanOrEqual(4);
    });

    test('getRelatedMythologies caps at five', () => {
        view.mythologies = Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, name: `M${i}` }));
        expect(view.getRelatedMythologies('anything')).toHaveLength(5);
    });

    test('renderVirtualItem picks the renderer matching the mode', () => {
        const entity = { id: 'zeus', name: 'Zeus', collection: 'deities', mythology: 'greek' };

        expect(view.renderVirtualItem(entity, 0, 'grid')).toContain('grid-card');
        expect(view.renderVirtualItem(entity, 0, 'list')).toContain('entity-list-item');
    });

    test('destroyVirtualScroller is safe with nothing to destroy', () => {
        expect(() => view.destroyVirtualScroller()).not.toThrow();

        const destroy = jest.fn();
        view.virtualScroller = { destroy };
        view.destroyVirtualScroller();

        expect(destroy).toHaveBeenCalled();
        expect(view.virtualScroller).toBeNull();
    });
});

describe('applyClientFilters', () => {
    let view;
    beforeEach(() => {
        view = makeView();
        // A narrowed type filter, which is the branch that actually filters.
        view.state.filters.entityTypes = ['deities'];
        view.state.filters.importance = [1, 5];
        view.state.filters.hasImage = null;
    });

    test('keeps only the selected entity types', () => {
        const out = view.applyClientFilters([
            { id: 'a', type: 'deities' },
            { id: 'b', type: 'heroes' },
        ]);

        expect(out.map(e => e.id)).toEqual(['a']);
    });

    test('reads the collection when a hit has no type', () => {
        const out = view.applyClientFilters([{ id: 'a', collection: 'deities' }]);
        expect(out).toHaveLength(1);
    });

    test('drops entities below the importance floor', () => {
        view.state.filters.importance = [3, 5];   // floor of 60
        const out = view.applyClientFilters([
            { id: 'a', type: 'deities', importance: 80 },
            { id: 'b', type: 'deities', importance: 40 },
        ]);

        expect(out.map(e => e.id)).toEqual(['a']);
    });

    test('treats a missing importance as 50', () => {
        view.state.filters.importance = [3, 5];   // floor of 60
        expect(view.applyClientFilters([{ id: 'a', type: 'deities' }])).toHaveLength(0);
    });

    test('filters on presence of an image when asked', () => {
        view.state.filters.hasImage = true;
        const out = view.applyClientFilters([
            { id: 'a', type: 'deities', image: 'x.png' },
            { id: 'b', type: 'deities' },
            { id: 'c', type: 'deities', gridDisplay: { image: 'y.png' } },
        ]);

        expect(out.map(e => e.id)).toEqual(['a', 'c']);
    });

    test('filters on absence of an image when asked', () => {
        view.state.filters.hasImage = false;
        const out = view.applyClientFilters([
            { id: 'a', type: 'deities', image: 'x.png' },
            { id: 'b', type: 'deities' },
        ]);

        expect(out.map(e => e.id)).toEqual(['b']);
    });
});

describe('static markup blocks', () => {
    let view;
    beforeEach(() => { view = makeView(); });

    test('the empty state invites a search', () => {
        const html = view.getEmptyStateHTML();
        expect(html).toContain('search-placeholder');
        expect(html).toContain('data-query="zeus"');
    });

    test('the loading state renders skeleton cards', () => {
        const html = view.getLoadingHTML();
        expect(html.match(/skeleton-card/g).length).toBeGreaterThan(1);
    });

    test('the filter chips mark exactly one active', () => {
        const html = view.getFilterChipsHTML();
        expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    });

    test('the no-results block escapes the query it echoes', () => {
        view.state.query = '<img src=x onerror=alert(1)>';
        const html = view.getNoResultsHTML();

        expect(html).not.toContain('<img src=x');
        expect(html).toContain('&lt;img');
    });

    test('the no-results block offers a correction for a known misspelling', () => {
        view.state.query = 'zues';
        expect(view.getNoResultsHTML()).toContain('spelling-suggestion');
    });

    test('the no-results block omits the correction when there is none', () => {
        view.state.query = 'cerberus';
        expect(view.getNoResultsHTML()).not.toContain('spelling-suggestion');
    });

    test('the shell renders a search input', () => {
        const html = view.getHTML();
        expect(html).toContain('search-view');
        expect(html).toContain('mythology-filters-container');
    });
});

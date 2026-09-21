/**
 * corpus-explorer.html's ?q=/?term= URL contract.
 *
 * Every keyword chip a reader can click on an entity page - renderCorpusSearch()
 * in js/components/schema-section-renderer.js, and the "Show more" links in
 * js/components/asset-corpus-search.js - opens this page with `?term=<word>`.
 * handleURLParameters() only ever read `q`, so clicking any of those chips
 * landed on an empty, unfilled search box: the pre-fill silently did nothing.
 * These tests hold the fix (accept `term` as an alias for `q`) in place.
 */

require('../setup');

document.body.innerHTML = `
    <input id="corpus-search-input" />
    <select id="mythology-filter"><option value=""></option><option value="greek">Greek</option></select>
    <select id="collection-filter"><option value=""></option><option value="texts">Texts</option></select>
`;

require('../../js/pages/corpus-explorer.js');

/**
 * jsdom's real Location object attempts an actual (unimplemented) navigation
 * when its `.search` setter is assigned a value that changes the URL, which
 * fails the test with "Not implemented: navigation" rather than exercising
 * the code under test. Replacing the whole `window.location` property with a
 * plain, writable object - once, here - sidesteps that; each test then just
 * mutates `.search` on this stand-in, which is a plain property write.
 */
Object.defineProperty(window, 'location', {
    writable: true,
    value: { search: '' }
});

describe('CorpusExplorerPage.handleURLParameters()', () => {
    let page;

    beforeEach(() => {
        page = new window.CorpusExplorerPage();
        page.performSearch = jest.fn();
        document.getElementById('corpus-search-input').value = '';
        window.location.search = '';
    });

    test('pre-fills and searches from ?q= (existing contract, must keep working)', () => {
        window.location.search = '?q=zeus';
        page.handleURLParameters();

        expect(document.getElementById('corpus-search-input').value).toBe('zeus');
        expect(page.performSearch).toHaveBeenCalledWith('zeus');
    });

    test('pre-fills and searches from ?term= (the alias every entity-page chip actually links with)', () => {
        window.location.search = '?term=amaterasu';
        page.handleURLParameters();

        expect(document.getElementById('corpus-search-input').value).toBe('amaterasu');
        expect(page.performSearch).toHaveBeenCalledWith('amaterasu');
    });

    test('?q= wins if a link somehow supplies both', () => {
        window.location.search = '?q=zeus&term=hera';
        page.handleURLParameters();

        expect(page.performSearch).toHaveBeenCalledWith('zeus');
        expect(page.performSearch).not.toHaveBeenCalledWith('hera');
    });

    test('does not call performSearch when neither param is present', () => {
        window.location.search = '?mythology=greek';
        page.handleURLParameters();

        expect(page.performSearch).not.toHaveBeenCalled();
        expect(page.currentFilters.mythology).toBe('greek');
    });

    test('still applies collection and mythology filters alongside a term search', () => {
        window.location.search = '?term=osiris&mythology=egyptian&collection=texts';
        page.handleURLParameters();

        expect(page.performSearch).toHaveBeenCalledWith('osiris');
        expect(page.currentFilters.mythology).toBe('egyptian');
        expect(page.currentFilters.collection).toBe('texts');
    });
});

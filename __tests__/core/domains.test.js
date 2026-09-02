/**
 * Domain Registry Tests
 * Tests for js/config/domains.js
 *
 * The registry is what lets one interface serve four datasets. Most of these
 * tests pin invariants that, if broken, fail silently in production rather than
 * throwing — a wrong facet field returns "no results" that looks identical to
 * "nothing changed", and a collection claimed by two domains serves one domain's
 * documents as the other's.
 */

describe('Domain registry', () => {
    let DOMAINS;

    beforeEach(() => {
        delete window.DOMAINS;
        jest.resetModules();
        DOMAINS = require('../../js/config/domains.js');
    });

    describe('structure', () => {
        test('exposes the four datasets in tab order', () => {
            expect(DOMAINS.list().map(d => d.id))
                .toEqual(['mythology', 'esoteric', 'history', 'conspiracy']);
        });

        test('defaults to mythology, which is the only domain with substantial data', () => {
            expect(DOMAINS.default().id).toBe('mythology');
        });

        test('every domain declares the fields consumers depend on', () => {
            for (const domain of DOMAINS.list()) {
                expect(typeof domain.label).toBe('string');
                expect(domain.label.length).toBeGreaterThan(0);
                expect(typeof domain.facetField).toBe('string');
                expect(typeof domain.facetLabel).toBe('string');
                expect(Array.isArray(domain.collections)).toBe(true);
                expect(domain.collections.length).toBeGreaterThan(0);
            }
        });
    });

    describe('collection uniqueness', () => {
        // This is the invariant the whole prefix scheme exists to protect. All four
        // domains share one Firestore project, and `events`, `figures`, `concepts`
        // and `artifacts` each appear in more than one domain's source package. If
        // two domains ever claim one collection name, one domain's documents get
        // served as the other's.
        test('no collection is claimed by two domains', () => {
            const seen = new Map();
            for (const domain of DOMAINS.list()) {
                for (const collection of domain.collections) {
                    expect(seen.has(collection)).toBe(false);
                    seen.set(collection, domain.id);
                }
            }
        });

        test('history and conspiracy collections are prefixed', () => {
            for (const c of DOMAINS.collectionsFor('history')) {
                expect(c.startsWith('hist_')).toBe(true);
            }
            for (const c of DOMAINS.collectionsFor('conspiracy')) {
                expect(c.startsWith('con_')).toBe(true);
            }
        });

        test('the colliding names are never claimed unprefixed by history or conspiracy', () => {
            const collidingNames = ['events', 'figures', 'concepts', 'artifacts'];
            const newDomainCollections = [
                ...DOMAINS.collectionsFor('history'),
                ...DOMAINS.collectionsFor('conspiracy'),
            ];
            for (const name of collidingNames) {
                expect(newDomainCollections).not.toContain(name);
            }
        });
    });

    describe('facet resolution', () => {
        test('maps each collection to its owning domain', () => {
            expect(DOMAINS.domainForCollection('deities').id).toBe('mythology');
            expect(DOMAINS.domainForCollection('herbs').id).toBe('esoteric');
            expect(DOMAINS.domainForCollection('hist_figures').id).toBe('history');
            expect(DOMAINS.domainForCollection('con_theories').id).toBe('conspiracy');
        });

        test('mythology and esoteric keep the existing `mythology` field', () => {
            // Their live documents, static base and all 47 composite indexes use it.
            expect(DOMAINS.facetFieldFor('deities')).toBe('mythology');
            expect(DOMAINS.facetFieldFor('herbs')).toBe('mythology');
        });

        test('history shards on era and conspiracy on category', () => {
            expect(DOMAINS.facetFieldFor('hist_events')).toBe('era');
            expect(DOMAINS.facetFieldFor('con_theories')).toBe('category');
        });

        test('esoteric labels the shared field differently from mythology', () => {
            expect(DOMAINS.facetLabelFor('deities')).toBe('Mythology');
            expect(DOMAINS.facetLabelFor('herbs')).toBe('Tradition');
            expect(DOMAINS.facetLabelFor('hist_events')).toBe('Era');
        });

        test('an unregistered collection falls back to mythology, preserving old behaviour', () => {
            // Collections outside the registry (spiritual-items, magic-systems, pages)
            // predate it and must keep working exactly as before.
            expect(DOMAINS.domainForCollection('spiritual-items')).toBeNull();
            expect(DOMAINS.facetFieldFor('spiritual-items')).toBe('mythology');
            expect(DOMAINS.facetLabelFor('spiritual-items')).toBe('Mythology');
        });
    });

    describe('cross-domain references', () => {
        test('builds and parses a reference round-trip', () => {
            const ref = DOMAINS.makeRef('deities', 'zeus');
            expect(ref).toBe('deities/zeus');

            const parsed = DOMAINS.parseRef(ref);
            expect(parsed.collection).toBe('deities');
            expect(parsed.id).toBe('zeus');
            expect(parsed.domain.id).toBe('mythology');
        });

        test('a reference resolves to its domain, so a link knows which tab to open', () => {
            expect(DOMAINS.parseRef('hist_figures/napoleon').domain.id).toBe('history');
            expect(DOMAINS.parseRef('con_theories/roswell').domain.id).toBe('conspiracy');
        });

        test('ids containing slashes survive parsing', () => {
            const parsed = DOMAINS.parseRef('texts/vedas/rigveda');
            expect(parsed.collection).toBe('texts');
            expect(parsed.id).toBe('vedas/rigveda');
        });

        test('malformed references return null rather than throwing', () => {
            expect(DOMAINS.parseRef('')).toBeNull();
            expect(DOMAINS.parseRef('nosuchseparator')).toBeNull();
            expect(DOMAINS.parseRef('/leadingslash')).toBeNull();
            expect(DOMAINS.parseRef('trailingslash/')).toBeNull();
            expect(DOMAINS.parseRef(null)).toBeNull();
            expect(DOMAINS.parseRef(42)).toBeNull();
        });

        test('a well-formed reference to an unknown collection is a broken link, not a crash', () => {
            // Content outlives config: a ref may name a collection that has been
            // renamed or retired. Callers need to detect that, not catch an error.
            const parsed = DOMAINS.parseRef('retired_collection/thing');
            expect(parsed).not.toBeNull();
            expect(parsed.domain).toBeNull();
            expect(DOMAINS.isKnownRef('retired_collection/thing')).toBe(false);
            expect(DOMAINS.isKnownRef('deities/zeus')).toBe(true);
        });

        test('detects when following a link leaves the current dataset', () => {
            expect(DOMAINS.isCrossDomainRef('hist_figures/napoleon', 'mythology')).toBe(true);
            expect(DOMAINS.isCrossDomainRef('deities/zeus', 'mythology')).toBe(false);
            // Mythology and esoteric are distinct tabs even though they share a
            // Firestore namespace and a facet field.
            expect(DOMAINS.isCrossDomainRef('herbs/mugwort', 'mythology')).toBe(true);
        });

        test('an unresolvable ref is not reported as cross-domain', () => {
            expect(DOMAINS.isCrossDomainRef('retired_collection/thing', 'mythology')).toBe(false);
            expect(DOMAINS.isCrossDomainRef('garbage', 'mythology')).toBe(false);
        });
    });

    test('registers itself on window for non-module consumers', () => {
        expect(window.DOMAINS).toBeDefined();
        expect(window.DOMAINS.facetFieldFor('hist_events')).toBe('era');
    });
});

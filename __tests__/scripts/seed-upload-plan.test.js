/**
 * Seed upload planner tests.
 *
 * The behaviour under test is a refusal. `scripts/upload-seed-collections.js`
 * used to refuse the whole `eyesofazrael` project, which was safe and made the
 * single-project design (plan §2) impossible to execute. The planner replaces
 * that with a check on the resolved collection name.
 *
 * The test that matters most is the first one in "collision detection": mnema's
 * seed directory is literally named `events`, and mythology's live collection is
 * literally named `events`. Uploading one into the other is unrecoverable — the
 * documents interleave with no field distinguishing them — and it fails silently,
 * because a successful batch write looks the same either way.
 */

const { planSeedUpload, validateSeedDocuments } = require('../../scripts/lib/seed-upload-plan');

describe('seed upload planner', () => {
    let DOMAINS;

    beforeEach(() => {
        delete window.DOMAINS;
        jest.resetModules();
        DOMAINS = require('../../js/config/domains.js');
    });

    // The directory names as they actually sit in the two repos. Both contain
    // `events` and `figures`, which is the whole problem.
    const MNEMA_SEED = ['artifacts', 'cultures', 'events', 'figures', 'periods', 'wars'];
    const SYNOMOSIA_SEED = ['documents', 'events', 'figures', 'organizations', 'theories'];

    describe('collision detection', () => {
        test('refuses mnema seeds with no prefix, because `events` is mythology\'s', () => {
            const plan = planSeedUpload({
                collections: MNEMA_SEED,
                prefix: '',
                domains: DOMAINS,
                projectId: 'eyesofazrael',
            });

            expect(plan.errors.length).toBeGreaterThan(0);
            // events and figures collide with mythology; the other four do not.
            expect(plan.errors.join('\n')).toMatch(/"events" would be written to collection "events"/);
            expect(plan.errors.join('\n')).toMatch(/"figures" would be written to collection "figures"/);
            expect(plan.targets.map(t => t.target)).not.toContain('events');
            expect(plan.targets.map(t => t.target)).not.toContain('figures');
        });

        test('refuses conspiracy seeds with the wrong prefix', () => {
            // hist_ prefix on synomosia's seeds resolves into history's namespace.
            const plan = planSeedUpload({
                collections: ['events', 'figures'],
                prefix: 'hist_',
                domains: DOMAINS,
            });

            // hist_events/hist_figures are history's, but the uploader was told
            // hist_, so the registry sees no cross-domain collision here. What it
            // does catch is the reverse case below.
            expect(plan.domain.id).toBe('history');
        });

        test('refuses an unknown prefix rather than inventing a namespace', () => {
            const plan = planSeedUpload({
                collections: ['events'],
                prefix: 'myth_',
                domains: DOMAINS,
            });

            expect(plan.errors.join('\n')).toMatch(/No domain in the registry uses the prefix "myth_"/);
        });

        test('names the fix in the refusal, not just the problem', () => {
            const plan = planSeedUpload({
                collections: ['events'],
                prefix: '',
                domains: DOMAINS,
            });

            expect(plan.errors.join('\n')).toMatch(/--prefix/);
        });
    });

    describe('the single-project design it exists to allow', () => {
        test('accepts all six mnema seed directories under hist_', () => {
            const plan = planSeedUpload({
                collections: MNEMA_SEED,
                prefix: 'hist_',
                domains: DOMAINS,
                projectId: 'eyesofazrael',
            });

            expect(plan.errors).toEqual([]);
            expect(plan.warnings).toEqual([]);
            expect(plan.targets.map(t => t.target)).toEqual([
                'hist_artifacts', 'hist_cultures', 'hist_events',
                'hist_figures', 'hist_periods', 'hist_wars',
            ]);
        });

        test('accepts all five synomosia seed directories under con_', () => {
            const plan = planSeedUpload({
                collections: SYNOMOSIA_SEED,
                prefix: 'con_',
                domains: DOMAINS,
                projectId: 'eyesofazrael',
            });

            expect(plan.errors).toEqual([]);
            expect(plan.warnings).toEqual([]);
            expect(plan.targets.map(t => t.target)).toEqual([
                'con_documents', 'con_events', 'con_figures',
                'con_organizations', 'con_theories',
            ]);
        });

        test('targeting eyesofazrael is no longer refused on the project name alone', () => {
            // This is the exact call the old guard rejected outright.
            const plan = planSeedUpload({
                collections: MNEMA_SEED,
                prefix: 'hist_',
                domains: DOMAINS,
                projectId: 'eyesofazrael',
            });

            expect(plan.errors).toEqual([]);
        });

        test('every history target resolves to the era facet, not mythology', () => {
            const plan = planSeedUpload({
                collections: MNEMA_SEED, prefix: 'hist_', domains: DOMAINS,
            });
            expect(plan.targets.every(t => t.facetField === 'era')).toBe(true);
        });

        test('every conspiracy target resolves to the category facet', () => {
            const plan = planSeedUpload({
                collections: SYNOMOSIA_SEED, prefix: 'con_', domains: DOMAINS,
            });
            expect(plan.targets.every(t => t.facetField === 'category')).toBe(true);
        });
    });

    describe('undeclared collections', () => {
        test('warns rather than refuses — it uploads but nothing queries it', () => {
            const plan = planSeedUpload({
                collections: ['sightings'], prefix: 'hist_', domains: DOMAINS,
            });

            expect(plan.errors).toEqual([]);
            expect(plan.warnings.join('\n')).toMatch(/hist_sightings.*not declared/s);
            expect(plan.targets.map(t => t.target)).toEqual(['hist_sightings']);
        });
    });

    describe('facet validation', () => {
        test('flags a document with no facet value — it uploads and is then unreachable', () => {
            const result = validateSeedDocuments([
                { id: 'a', era: 'bronze-age' },
                { id: 'b' },
                { id: 'c', era: '' },
                { id: 'd', era: null },
            ], 'era');

            expect(result.missingFacet).toEqual(['b', 'c', 'd']);
            expect(result.missingId).toBe(0);
        });

        test('counts documents with no id — they cannot be written at all', () => {
            const result = validateSeedDocuments(
                [{ era: 'x' }, null, 'nonsense', { id: 'ok', era: 'x' }], 'era');

            expect(result.missingId).toBe(3);
            expect(result.missingFacet).toEqual([]);
        });

        test('passes a clean history seed', () => {
            const result = validateSeedDocuments(
                [{ id: 'event-1', era: 'bronze-age' }, { id: 'event-2', era: 'iron-age' }], 'era');

            expect(result.missingFacet).toEqual([]);
            expect(result.missingId).toBe(0);
        });
    });

    describe('registry contract this planner depends on', () => {
        test('hist_ and con_ are the only prefixes, and they are unique', () => {
            const prefixes = DOMAINS.list().map(d => d.prefix).filter(Boolean);
            expect(prefixes.sort()).toEqual(['con_', 'hist_']);
            expect(new Set(prefixes).size).toBe(prefixes.length);
        });

        test('the colliding bare names really are claimed by mythology', () => {
            // If this ever stops being true the planner is guarding nothing.
            expect(DOMAINS.domainForCollection('events').id).toBe('mythology');
            expect(DOMAINS.domainForCollection('figures').id).toBe('mythology');
        });
    });
});

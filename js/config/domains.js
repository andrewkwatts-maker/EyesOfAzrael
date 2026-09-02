/**
 * Domain registry.
 *
 * The site presents four datasets — mythology, esoteric, history and conspiracy —
 * through one interface, selected by a top-level tab. Everything below the tab
 * (browse grids, entity detail, search, submissions, notes, votes, moderation) is
 * the same code operating on a different dataset.
 *
 * This file is the single place that knows which collections belong to which
 * domain and which field each domain shards by. Before it existed, `mythology`
 * was hardcoded as the shard axis in four separate layers — the manifest shape,
 * the base loader's file resolution, the Firestore delta filter, and every
 * composite index. Adding a domain meant editing all four and hoping none was
 * missed. Consumers should now ask this registry instead of assuming a field name.
 *
 *   const facet = DOMAINS.facetFieldFor('hist_events');  // 'era'
 *   const label = DOMAINS.facetLabelFor('hist_events');  // 'Era'
 *   const dom   = DOMAINS.domainForCollection('deities'); // the mythology domain
 *
 * ── On facet field names ─────────────────────────────────────────────────────
 * Mythology and esoteric both shard on the literal field `mythology`, because
 * that is what their live documents, their static base and all 47 existing
 * composite indexes already use. Renaming it would be a migration of production
 * data for no functional gain, so it stays. Esoteric merely *labels* it
 * "Tradition" in the UI.
 *
 * History and conspiracy are new collections with no data and no indexes yet, so
 * they use honest field names — `era` and `category`. Writing a renaissance
 * period into a field called `mythology` would be a lie the codebase had to keep
 * telling, and it would still need migrating later.
 *
 * The underlying packages (mnema, synomosia) store these values in a column
 * named `mythology` in their baked SQLite, because all four domains share one
 * schema. The export and upload steps map that column to the field named here.
 */

const DOMAIN_LIST = [
    {
        id: 'mythology',
        label: 'Mythology',
        blurb: 'Deities, heroes, creatures and cosmologies across world mythologies.',
        package: 'azrael',
        prefix: '',
        facetField: 'mythology',
        facetLabel: 'Mythology',
        collections: [
            'deities', 'creatures', 'heroes', 'places', 'items', 'concepts',
            'symbols', 'archetypes', 'cosmology', 'texts', 'mythologies',
            'beings', 'events',
        ],
    },
    {
        id: 'esoteric',
        label: 'Esoteric',
        blurb: 'Rituals, herbs and magical traditions.',
        package: 'esoterica',
        prefix: '',
        // Shares the `mythology` field with the mythology domain — see header note.
        facetField: 'mythology',
        facetLabel: 'Tradition',
        collections: [
            'rituals', 'herbs', 'magic',
            // Declared by the esoterica package but not yet present in the base:
            'spells', 'traditions', 'grimoires', 'ingredients', 'practitioners',
        ],
    },
    {
        id: 'history',
        label: 'History',
        blurb: 'Figures, events, periods and cultures.',
        package: 'mnema',
        prefix: 'hist_',
        facetField: 'era',
        facetLabel: 'Era',
        collections: [
            'hist_events', 'hist_figures', 'hist_periods', 'hist_cultures',
            'hist_wars', 'hist_discoveries', 'hist_artifacts',
        ],
    },
    {
        id: 'conspiracy',
        label: 'Conspiracy',
        blurb: 'Theories, organizations and documents.',
        package: 'synomosia',
        prefix: 'con_',
        facetField: 'category',
        facetLabel: 'Category',
        collections: [
            'con_theories', 'con_figures', 'con_organizations',
            'con_events', 'con_documents', 'con_concepts',
        ],
    },
];

const DEFAULT_DOMAIN_ID = 'mythology';

// collection name → domain, built once. Collections are unique across domains by
// construction: history and conspiracy are prefixed precisely because `events`,
// `figures`, `concepts` and `artifacts` would otherwise collide with mythology
// and esoteric in the shared Firestore project.
const _BY_COLLECTION = new Map();
for (const domain of DOMAIN_LIST) {
    for (const collection of domain.collections) {
        if (_BY_COLLECTION.has(collection)) {
            // A collision here means two domains claim one collection, which in a
            // single Firestore project means one domain's documents would be
            // served as the other's. Fail loudly rather than pick a winner.
            throw new Error(
                `[domains] Collection "${collection}" is claimed by both ` +
                `"${_BY_COLLECTION.get(collection).id}" and "${domain.id}". ` +
                `Collections must be unique across domains — prefix one of them.`
            );
        }
        _BY_COLLECTION.set(collection, domain);
    }
}

const _BY_ID = new Map(DOMAIN_LIST.map(d => [d.id, d]));

const DOMAINS = {
    /** All domains, in tab order. */
    list() {
        return DOMAIN_LIST.slice();
    },

    /** The domain shown when none is specified. */
    default() {
        return _BY_ID.get(DEFAULT_DOMAIN_ID);
    },

    /** @returns {object|null} domain by id, or null. */
    byId(id) {
        return _BY_ID.get(id) || null;
    },

    /** @returns {object|null} the domain owning a collection, or null if unknown. */
    domainForCollection(collection) {
        return _BY_COLLECTION.get(collection) || null;
    },

    /**
     * The document field a collection shards and filters on.
     * Falls back to 'mythology' for collections not in the registry, which keeps
     * pre-existing collections (spiritual-items, magic-systems, pages…) working
     * exactly as they did before this registry was introduced.
     */
    facetFieldFor(collection) {
        const domain = _BY_COLLECTION.get(collection);
        return domain ? domain.facetField : 'mythology';
    },

    /** Human-readable name for the facet, for UI labels. */
    facetLabelFor(collection) {
        const domain = _BY_COLLECTION.get(collection);
        return domain ? domain.facetLabel : 'Mythology';
    },

    /** @returns {string[]} collections belonging to a domain id. */
    collectionsFor(domainId) {
        const domain = _BY_ID.get(domainId);
        return domain ? domain.collections.slice() : [];
    },

    /** Every collection across every domain. */
    allCollections() {
        return Array.from(_BY_COLLECTION.keys());
    },

    // ── Cross-domain references ──────────────────────────────────────────────
    //
    // Entities link to each other wiki-style, and those links cross domains: a
    // history figure cites a mythological archetype, a conspiracy theory cites a
    // historical event. That requires a reference that is unique across the whole
    // site, not just within one collection.
    //
    // The prefix scheme gives this for free. Because `hist_` and `con_` make every
    // collection name globally unique (enforced by the collision check above),
    // "collection/id" is already a globally unique key — no separate namespace, no
    // uuid, no domain segment to keep in sync. `deities/zeus` and
    // `hist_figures/napoleon` cannot collide.
    //
    // A ref also resolves to its domain, which is what lets a link know which tab
    // to open. Following a link out of the current dataset switches tabs rather
    // than dead-ending, because the ref carries enough to find its home.

    /** Build a canonical reference. @returns {string} e.g. 'deities/zeus' */
    makeRef(collection, id) {
        return `${collection}/${id}`;
    },

    /**
     * Parse a canonical reference.
     * @returns {{collection: string, id: string, domain: object|null}|null}
     *   null if malformed. `domain` is null for a well-formed ref naming a
     *   collection this registry does not know — callers should treat that as a
     *   broken link rather than a crash, since content outlives config.
     */
    parseRef(ref) {
        if (typeof ref !== 'string') return null;
        const slash = ref.indexOf('/');
        if (slash <= 0 || slash === ref.length - 1) return null;

        const collection = ref.slice(0, slash);
        const id = ref.slice(slash + 1);
        // Ids may themselves contain slashes; only the first separates the two.
        return { collection, id, domain: _BY_COLLECTION.get(collection) || null };
    },

    /** @returns {boolean} whether a ref names a collection this registry knows. */
    isKnownRef(ref) {
        const parsed = this.parseRef(ref);
        return Boolean(parsed && parsed.domain);
    },

    /**
     * Whether following this ref leaves the domain currently being viewed.
     * The UI uses this to mark a link as crossing datasets, so a reader is not
     * silently teleported between tabs.
     */
    isCrossDomainRef(ref, fromDomainId) {
        const parsed = this.parseRef(ref);
        if (!parsed || !parsed.domain) return false;
        return parsed.domain.id !== fromDomainId;
    },

    DEFAULT_DOMAIN_ID,
};

if (typeof window !== 'undefined') {
    window.DOMAINS = DOMAINS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMAINS;
}

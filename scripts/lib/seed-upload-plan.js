/**
 * Plan a seed upload: resolve source directories to target collections and
 * decide whether writing them is safe.
 *
 * This is the guard that stands between the curated history/conspiracy seeds and
 * the live mythology data. It is pure — no Firestore, no filesystem — so the
 * decision it makes can be tested without credentials, which matters because the
 * failure it prevents is unrecoverable: writing mnema's `events` into the
 * mythology `events` collection merges two corpora into one with no way to tell
 * afterwards which document came from where.
 *
 * The previous guard refused the `eyesofazrael` project outright. That was right
 * about the danger and too blunt to allow the correct design: the single-project
 * decision (plan §2) requires uploading *into* eyesofazrael, under prefixed
 * names. So the check moves from the project to the resolved collection name.
 *
 * A target is unsafe when the collection it resolves to is already claimed by a
 * different domain — that, and only that, is a real collision. `events` with no
 * prefix resolves to mythology's `events` and is refused; `hist_events` resolves
 * to history's own collection and is allowed.
 */

/**
 * @param {object} options
 * @param {string[]} options.collections - source directory names from the seed dir
 * @param {string} options.prefix - collection prefix for the target domain, e.g. 'hist_'
 * @param {object} options.domains - the domain registry (js/config/domains.js)
 * @param {string} [options.projectId] - target project, for message context only
 * @returns {{targets: Array, errors: string[], warnings: string[], domain: object|null}}
 *   `targets` is [{ source, target, domain, facetField }]. Callers must treat a
 *   non-empty `errors` as fatal and write nothing — a partial upload is worse
 *   than none, because the collision it creates is silent.
 */
function planSeedUpload({ collections, prefix = '', domains, projectId = '' }) {
    if (!domains) throw new Error('planSeedUpload requires the domain registry');

    const errors = [];
    const warnings = [];
    const targets = [];

    // Which domain does this prefix name? Derived from the registry rather than
    // passed in, so the prefix and the collection list cannot disagree.
    const owningDomain = domains.list().find(d => d.prefix === prefix && d.prefix !== '') || null;

    if (prefix && !owningDomain) {
        errors.push(
            `No domain in the registry uses the prefix "${prefix}". ` +
            `Known prefixes: ${domains.list().filter(d => d.prefix).map(d => d.prefix).join(', ')}.`
        );
    }

    for (const source of collections) {
        const target = `${prefix}${source}`;
        const claimedBy = domains.domainForCollection(target);

        if (claimedBy && owningDomain && claimedBy.id !== owningDomain.id) {
            // The real collision. Writing here would merge two domains' documents
            // into one collection inside a single project.
            errors.push(
                `"${source}" resolves to collection "${target}", which already belongs to ` +
                `the "${claimedBy.id}" domain${projectId ? ` in project ${projectId}` : ''}. ` +
                `Uploading would merge ${owningDomain.id} documents into ${claimedBy.id} content. ` +
                `Use --prefix ${owningDomain.prefix} so it resolves to "${owningDomain.prefix}${source}".`
            );
            continue;
        }

        if (claimedBy && !owningDomain) {
            // No prefix given at all, and the bare name hits a live collection.
            errors.push(
                `"${source}" would be written to collection "${target}", which belongs to ` +
                `the "${claimedBy.id}" domain. Pass --prefix to namespace this seed ` +
                `(e.g. --prefix hist_ for history, --prefix con_ for conspiracy).`
            );
            continue;
        }

        if (!claimedBy) {
            // Not a collision — nothing is there to collide with — but nothing on
            // the site queries a collection the registry does not declare, so the
            // documents would upload and then be invisible. Worth saying out loud.
            warnings.push(
                `"${target}" is not declared in the domain registry, so no part of the ` +
                `site will query it. Add it to js/config/domains.js or check the --prefix.`
            );
        }

        targets.push({
            source,
            target,
            domain: claimedBy || owningDomain || null,
            facetField: domains.facetFieldFor(target),
        });
    }

    return { targets, errors, warnings, domain: owningDomain };
}

/**
 * Check that every document carries the facet field its domain shards on.
 *
 * A history document with no `era` is not a crash — it uploads cleanly and then
 * cannot be reached. The static base shards by facet value, so it lands in no
 * shard, and the delta query filters `where(facetField, '==', ...)`, so it
 * matches nothing. It is present in Firestore and absent from the site.
 *
 * @param {Array<object>} entities
 * @param {string} facetField
 * @returns {{missingFacet: string[], missingId: number}} ids lacking the facet
 */
function validateSeedDocuments(entities, facetField) {
    const missingFacet = [];
    let missingId = 0;

    for (const entity of entities) {
        if (!entity || typeof entity !== 'object') { missingId += 1; continue; }
        if (!entity.id) { missingId += 1; continue; }
        const value = entity[facetField];
        if (value === undefined || value === null || value === '') {
            missingFacet.push(String(entity.id));
        }
    }

    return { missingFacet, missingId };
}

module.exports = { planSeedUpload, validateSeedDocuments };

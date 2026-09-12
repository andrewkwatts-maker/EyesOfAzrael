#!/usr/bin/env node

/**
 * Guarantee a category page for every tradition-and-category that has entities.
 *
 * The site offers several routes to a topic — through a tradition, through a
 * category, through both — and the tradition/category tier is the hinge of most
 * of them. It was only 58 pages deep against 184 pairs that actually hold
 * entities, so most of those routes passed through a tier that did not exist:
 * #/mythology/japanese/creatures lists 127 creatures under a heading generated
 * from a template, with nothing written about the subject and no cross-links to
 * its siblings.
 *
 * This fills the gap so the tier is complete, which is what makes the navigation
 * shapes dependable rather than conditional on which pages happen to exist.
 *
 * WHAT IT WRITES, AND WHAT IT WILL NOT INVENT
 *
 * Where a hand-written overview already exists — the 58 ported from the legacy
 * site — it is left exactly as it is. This never overwrites prose.
 *
 * For the rest it writes a factual description built from what the database
 * knows: the tradition, the category and the number of entities. It does not
 * generate mythological claims. A sentence saying how many Japanese creatures
 * are catalogued is true and useful; a paragraph inventing what they signify
 * would be neither, and there is no way for a reader to tell the two apart once
 * they are on the same page in the same position.
 *
 * entityCount is stamped on every page so the sibling links can skip categories
 * that would open onto an empty grid.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/ensure-category-pages.js
 *   node scripts/ensure-category-pages.js --confirm
 */

const admin = require('firebase-admin');

const CONFIRM = process.argv.includes('--confirm');

/** Reader-facing names; the collection id is not always presentable. */
const CATEGORY_LABEL = {
    deities: 'Deities', heroes: 'Heroes', creatures: 'Creatures', places: 'Places',
    items: 'Items', texts: 'Texts', concepts: 'Concepts', symbols: 'Symbols',
    rituals: 'Rituals', herbs: 'Herbs', archetypes: 'Archetypes', magic: 'Magic',
    magic_systems: 'Magic Systems', cosmology: 'Cosmology', events: 'Events',
    myths: 'Myths', beings: 'Beings', tarot: 'Tarot', figures: 'Figures'
};

const CATEGORY_NOUN = {
    deities: 'deities and divine beings', heroes: 'heroes and legendary figures',
    creatures: 'creatures and mythical beings', places: 'sacred places and realms',
    items: 'artifacts and sacred objects', texts: 'sacred texts and writings',
    concepts: 'concepts and ideas', symbols: 'symbols and icons',
    rituals: 'rituals and observances', herbs: 'sacred plants and herbs',
    archetypes: 'archetypes', magic: 'magical practices',
    magic_systems: 'magical systems', cosmology: 'cosmological accounts',
    events: 'events', myths: 'myths and stories', beings: 'beings',
    tarot: 'tarot correspondences', figures: 'figures'
};

const ICON = {
    deities: '⚡', heroes: '⚔', creatures: '🐉', places: '🏛', items: '📿',
    texts: '📜', concepts: '💭', symbols: '☯', rituals: '🕯', herbs: '🌿',
    archetypes: '🎭', magic: '✨', magic_systems: '🔮', cosmology: '🌌',
    events: '📅', myths: '📖', beings: '👁', tarot: '🃏', figures: '👤'
};

const titleCase = (s) => String(s || '')
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });
    const db = admin.firestore();

    const [mythSnap, overviewSnap] = await Promise.all([
        db.collection('mythologies').select('entityCounts', 'name', 'displayName').get(),
        db.collection('mythology_categories').get()
    ]);

    const existing = new Map();
    overviewSnap.docs.forEach((d) => existing.set(d.id, d.data()));

    const toCreate = [];
    const toStamp = [];
    let leftAlone = 0;

    for (const mythDoc of mythSnap.docs) {
        const data = mythDoc.data();
        const counts = data.entityCounts || {};
        const mythId = mythDoc.id;
        // displayName is usually "Greek Mythology", which makes "Greek Mythology
        // Heroes" once a category is appended. The tradition's bare name is what
        // reads correctly in front of a category.
        const mythName = String(data.displayName || data.name || titleCase(mythId))
            .replace(/\s+mythology$/i, '')
            .trim() || titleCase(mythId);

        for (const [category, count] of Object.entries(counts)) {
            if (!count || count < 1) continue;

            const id = `${mythId}_${category}`;
            const prior = existing.get(id);

            if (prior) {
                // Never touch imported prose; only keep the count current so the
                // sibling links know which categories are worth offering.
                if (prior.entityCount !== count) {
                    toStamp.push({ id, count });
                } else {
                    leftAlone++;
                }
                continue;
            }

            const label = CATEGORY_LABEL[category] || titleCase(category);
            const noun = CATEGORY_NOUN[category] || titleCase(category).toLowerCase();

            toCreate.push({
                id,
                mythology: mythId,
                category,
                name: `${mythName} ${label}`,
                // Factual, and visibly so. No claims about the subject matter.
                description: `${count} ${noun} catalogued in the ${mythName} tradition.`,
                longDescription: '',
                sections: [],
                icon: ICON[category] || '',
                entityCount: count,
                route: `#/mythology/${mythId}/${category}`,
                status: 'published',
                visibility: 'public',
                generated: true,
                generatedAt: new Date().toISOString(),
                _generatedBy: 'scripts/ensure-category-pages.js'
            });
        }
    }

    // Pages whose pair no longer holds entities: these open onto an empty grid,
    // so they are marked rather than deleted — the entities may return, and the
    // prose on the imported ones is worth keeping either way.
    const orphans = [];
    for (const [id, doc] of existing) {
        const mythDoc = mythSnap.docs.find((m) => m.id === doc.mythology);
        const count = mythDoc ? (mythDoc.data().entityCounts || {})[doc.category] : 0;
        if (!count) orphans.push(id);
    }

    console.log(`tradition x category pairs with entities : ${toCreate.length + toStamp.length + leftAlone}`);
    console.log(`  existing pages, prose preserved        : ${toStamp.length + leftAlone}`);
    console.log(`  new pages to create                    : ${toCreate.length}`);
    console.log(`  counts to refresh                      : ${toStamp.length}`);
    console.log(`  pages with no entities, to flag        : ${orphans.length}`);

    console.log('\nlargest new pages:');
    toCreate.slice().sort((a, b) => b.entityCount - a.entityCount).slice(0, 10)
        .forEach((c) => console.log(`  ${String(c.entityCount).padStart(5)}  ${c.id.padEnd(28)} "${c.name}"`));

    if (!CONFIRM) {
        console.log('\nDry run — nothing written. Re-run with --confirm.');
        return;
    }

    let written = 0;
    const CHUNK = 400;
    const all = [
        ...toCreate.map((doc) => ({ id: doc.id, data: doc })),
        ...toStamp.map((s) => ({ id: s.id, data: { entityCount: s.count } })),
        ...orphans.map((id) => ({ id, data: { entityCount: 0 } }))
    ];

    for (let i = 0; i < all.length; i += CHUNK) {
        const batch = db.batch();
        for (const { id, data } of all.slice(i, i + CHUNK)) {
            batch.set(db.collection('mythology_categories').doc(id), data, { merge: true });
            written++;
        }
        await batch.commit();
    }

    console.log(`\n${written} category pages written. The tier is now complete.`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});

/**
 * The tier between a category and an entity.
 *
 * WHY THIS EXISTS
 *
 * #/mythology/greek/deities loaded 500 records ordered by name and showed 24 of
 * them. Every visible entry began with A - Aceso, Achelous, Aeolus, Asopus -
 * and Zeus was ten "load more" clicks away with no way to ask for him. A
 * fourteen-thousand-entity encyclopedia read as a few hundred entities starting
 * with A.
 *
 * Alphabetical order is an index. It answers "where is the name I already
 * know", which is the one question a reader browsing an encyclopedia is not
 * asking. This adds the two tiers that answer the others:
 *
 *   Regions   - fourteen culture groups over the tradition list, because the
 *               tradition list is 270 values of which 142 hold three entities
 *               or fewer, and a flat list of those is not navigation.
 *   Topics    - fifty-seven curated themes that cut across traditions, so
 *               "Gods of War" collects Athena, Odin, Ishtar and Ares on one
 *               page regardless of where they came from.
 *
 * An entity sits in as many topics as it belongs to, which is what gives the
 * site more than one route to the same page: by tradition, by category, or by
 * theme.
 *
 * COST
 *
 * static/topics.json is one CDN fetch of about 400 KB, cached for the session,
 * and holds ids rather than records - the entity base is already in memory and
 * has every field the cards need. No Firestore document is read to render any
 * page in this file.
 */

class TopicsService {
    /**
     * Promise-cached, not value-cached.
     *
     * Two panels ask for this in the same frame on the topic index. Caching the
     * value would let both see an empty cache and fetch the file twice; caching
     * the promise means the second await joins the first request.
     */
    static _loadPromise = null;

    static load() {
        if (!TopicsService._loadPromise) {
            TopicsService._loadPromise = fetch('/static/topics.json')
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null);
        }
        return TopicsService._loadPromise;
    }

    static async regions() {
        const data = await TopicsService.load();
        return (data && data.regions) || [];
    }

    static async region(slug) {
        const regions = await TopicsService.regions();
        return regions.find((r) => r.slug === slug) || null;
    }

    static async topicsFor(collection) {
        const data = await TopicsService.load();
        return (data && data.topics && data.topics[collection]) || [];
    }

    static async allTopics() {
        const data = await TopicsService.load();
        if (!data || !data.topics) return [];
        return Object.values(data.topics).flat();
    }

    static async topic(collection, slug) {
        const topics = await TopicsService.topicsFor(collection);
        return topics.find((t) => t.slug === slug) || null;
    }

    /** id -> prominence score, for ordering a listing by something other than the alphabet. */
    static async prominence(collection) {
        const data = await TopicsService.load();
        return (data && data.prominent && data.prominent[collection]) || {};
    }

    /**
     * Ids a listing should hide: a record whose name and tradition match a
     * better-scored one. Three "Ishtar" records survive in the data because none
     * is marked `duplicateOf`; showing all three makes a curated page look broken.
     */
    static async shadowed(collection) {
        const data = await TopicsService.load();
        const list = (data && data.shadowed && data.shadowed[collection]) || [];
        return new Set(list);
    }

    static async collections() {
        const data = await TopicsService.load();
        return (data && data.collections) || {};
    }

    /**
     * Per-collection entity counts for one tradition, or null when unknown.
     *
     * The single source for every count a tradition page shows. Keys tolerate
     * the spelling differences in the data, so `native_american` and
     * `native american` resolve to the same tradition.
     */
    static async traditionCounts(tradition) {
        const data = await TopicsService.load();
        const all = (data && data.traditionCounts) || {};
        const key = String(tradition || '').toLowerCase().trim().replace(/[\s_-]+/g, ' ');
        return all[key] || null;
    }

    static async otherTraditions() {
        const data = await TopicsService.load();
        return (data && data.otherTraditions) || [];
    }

    /**
     * Resolve member ids against the static entity base.
     *
     * topics.json deliberately stores no record fields, so this is where a
     * member becomes something renderable. Ids with no record in the base are
     * dropped rather than rendered blank.
     */
    static async resolve(collection, members) {
        const loader = (typeof window !== 'undefined') ? window.entityBaseLoader : null;
        if (!loader) return [];
        let baseMap;
        try {
            baseMap = await loader.load(collection, null);
        } catch (error) {
            return [];
        }
        if (!baseMap) return [];

        const out = [];
        for (const member of members) {
            const id = Array.isArray(member) ? member[0] : member.id;
            const record = baseMap.get(id);
            if (record) out.push(record);
        }
        return out;
    }
}

/** Shared rendering helpers, so the three views below look like one site. */
class TopicsUI {
    static escape(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    static titleCase(value) {
        return String(value || '')
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    static entityCard(entity, collection) {
        const name = TopicsUI.escape(entity.name || entity.id);
        const icon = TopicsUI.escape(entity.icon || '');
        const tradition = entity.mythology ? TopicsUI.titleCase(entity.mythology) : '';
        const blurb = TopicsUI.escape(
            String(entity.shortDescription || entity.subtitle || entity.description || '')
                .replace(/\s+/g, ' ')
                .slice(0, 130)
        );
        const href = `#/entity/${encodeURIComponent(collection)}/${encodeURIComponent(entity.id)}`;

        return `
            <a class="topic-entity-card" href="${href}">
                <span class="topic-entity-icon" aria-hidden="true">${icon || '◆'}</span>
                <span class="topic-entity-body">
                    <span class="topic-entity-name">${name}</span>
                    ${tradition ? `<span class="topic-entity-tradition">${TopicsUI.escape(tradition)}</span>` : ''}
                    ${blurb ? `<span class="topic-entity-blurb">${blurb}</span>` : ''}
                </span>
            </a>`;
    }

    static topicTile(topic) {
        return `
            <a class="topic-tile" href="#/topic/${encodeURIComponent(topic.collection)}/${encodeURIComponent(topic.slug)}">
                <span class="topic-tile-icon" aria-hidden="true">${TopicsUI.escape(topic.icon || '◆')}</span>
                <span class="topic-tile-name">${TopicsUI.escape(topic.name)}</span>
                <span class="topic-tile-count">${topic.total}</span>
                ${topic.blurb ? `<span class="topic-tile-blurb">${TopicsUI.escape(topic.blurb)}</span>` : ''}
            </a>`;
    }

    static regionTile(region) {
        const traditions = (region.traditions || []).slice(0, 5)
            .map((t) => TopicsUI.escape(TopicsUI.titleCase(t.name)))
            .join(' · ');
        return `
            <a class="region-tile" href="#/region/${encodeURIComponent(region.slug)}">
                <span class="region-tile-icon" aria-hidden="true">${TopicsUI.escape(region.icon || '◆')}</span>
                <span class="region-tile-head">
                    <span class="region-tile-name">${TopicsUI.escape(region.name)}</span>
                    <span class="region-tile-count">${region.total} entries · ${(region.traditions || []).length} traditions</span>
                </span>
                ${region.blurb ? `<span class="region-tile-blurb">${TopicsUI.escape(region.blurb)}</span>` : ''}
                ${traditions ? `<span class="region-tile-traditions">${traditions}</span>` : ''}
            </a>`;
    }

    static empty(message) {
        return `<div class="topic-empty"><p>${TopicsUI.escape(message)}</p>
            <p><a href="#/mythologies">Browse traditions instead</a></p></div>`;
    }
}

/**
 * #/explore - the way in.
 *
 * Offers the two structures side by side: culture regions for a reader who
 * thinks "I want Egyptian things", topics for one who thinks "I want gods of
 * the dead". Neither requires knowing a name in advance, which is what the
 * alphabetical listing required.
 */
class ExploreView {
    async render(container) {
        container.innerHTML = '<div class="topic-loading">Loading…</div>';

        const [regions, collections, data] = await Promise.all([
            TopicsService.regions(),
            TopicsService.collections(),
            TopicsService.load()
        ]);

        if (!regions.length && !data) {
            container.innerHTML = TopicsUI.empty('The topic index is not available yet.');
            return;
        }

        const topicsByCollection = (data && data.topics) || {};
        const sections = Object.entries(topicsByCollection).map(([collection, topics]) => {
            const label = (collections[collection] && collections[collection].label) || TopicsUI.titleCase(collection);
            return `
                <section class="topic-section">
                    <h3 class="topic-section-head">
                        ${TopicsUI.escape(label)}
                        <a class="topic-section-all" href="#/browse/${encodeURIComponent(collection)}">All ${collections[collection] ? collections[collection].total : ''} →</a>
                    </h3>
                    <div class="topic-tile-grid">${topics.map(TopicsUI.topicTile).join('')}</div>
                </section>`;
        }).join('');

        container.innerHTML = `
            <div class="explore-view">
                <header class="explore-header">
                    <h1>Explore</h1>
                    <p class="explore-standfirst">
                        Two ways through the collection: by where a tradition comes from,
                        or by what a story is about.
                    </p>
                </header>

                <section class="topic-section">
                    <h3 class="topic-section-head">
                        By region
                        <a class="topic-section-all" href="#/mythologies">All traditions →</a>
                    </h3>
                    <div class="region-tile-grid">${regions.map(TopicsUI.regionTile).join('')}</div>
                </section>

                ${sections}
            </div>`;
    }
}

/**
 * #/topic/:collection/:slug - one theme, grouped by tradition.
 *
 * Grouped rather than listed flat because the cross-cultural comparison is the
 * point: seeing Greek, Norse and Egyptian war gods under separate headings on
 * one page is the thing a flat alphabetical grid could never show.
 */
class TopicView {
    async render(container, collection, slug) {
        container.innerHTML = '<div class="topic-loading">Loading…</div>';

        const topic = await TopicsService.topic(collection, slug);
        if (!topic) {
            container.innerHTML = TopicsUI.empty('That topic does not exist.');
            return;
        }

        const entities = await TopicsService.resolve(collection, topic.members || []);
        if (!entities.length) {
            container.innerHTML = TopicsUI.empty(`No entries resolved for ${topic.name}.`);
            return;
        }

        // Members arrive in prominence order; grouping preserves it within each
        // tradition, so the best-known name heads every group.
        const groups = new Map();
        for (const entity of entities) {
            const key = String(entity.mythology || 'other').toLowerCase();
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(entity);
        }

        // War & Battle spans 45 traditions, 17 of them holding a single entity.
        // A section heading per tradition turned the page into a list of
        // one-line sections, which is the fragmentation equivalent of the
        // alphabetical wall this tier replaces. The traditions with enough
        // entries to be worth comparing get their own group; the tail is pooled
        // so nothing is lost but nothing is given a heading it cannot fill.
        const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
        const MAJOR_GROUPS = 10;
        const MIN_FOR_OWN_GROUP = 3;

        const major = ranked.filter((g, i) => i < MAJOR_GROUPS && g[1].length >= MIN_FOR_OWN_GROUP);
        const tail = ranked.filter((g) => !major.includes(g));
        const ordered = [...major];
        if (tail.length) {
            const pooled = tail.flatMap(([, list]) => list);
            ordered.push([`${tail.length} more traditions`, pooled, true]);
        }

        const siblings = (await TopicsService.topicsFor(collection))
            .filter((t) => t.slug !== slug)
            .slice(0, 8);

        container.innerHTML = `
            <div class="topic-view">
                <nav class="topic-breadcrumb" aria-label="Breadcrumb">
                    <a href="#/explore">Explore</a> ›
                    <a href="#/browse/${encodeURIComponent(collection)}">${TopicsUI.escape(TopicsUI.titleCase(collection))}</a> ›
                    <span>${TopicsUI.escape(topic.name)}</span>
                </nav>

                <header class="topic-header">
                    <span class="topic-header-icon" aria-hidden="true">${TopicsUI.escape(topic.icon || '◆')}</span>
                    <div>
                        <h1>${TopicsUI.escape(topic.name)}</h1>
                        <p class="topic-standfirst">${TopicsUI.escape(topic.blurb || '')}</p>
                        <p class="topic-meta">${
                            // Say what is on the page, not what exists. The
                            // member list is capped, and a header promising 522
                            // above a grid of 400 is the page telling the reader
                            // something they can check and find untrue.
                            entities.length < topic.total
                                ? `Showing ${entities.length} of ${topic.total} entries across ${groups.size} traditions`
                                : `${topic.total} entries across ${groups.size} traditions`
                        }</p>
                    </div>
                </header>

                <div class="topic-tradition-jump">
                    ${ordered.map(([key, list, pooled], i) => `
                        <a href="#topic-group-${i}">${TopicsUI.escape(pooled ? key : TopicsUI.titleCase(key))} <span>${list.length}</span></a>
                    `).join('')}
                </div>

                ${ordered.map(([key, list, pooled], i) => `
                    <section class="topic-group" id="topic-group-${i}">
                        <h2 class="topic-group-head">
                            ${TopicsUI.escape(pooled ? key : TopicsUI.titleCase(key))}
                            ${pooled
                                ? ''
                                : `<a class="topic-group-all" href="#/mythology/${encodeURIComponent(key)}">Tradition →</a>`}
                        </h2>
                        <div class="topic-entity-grid">
                            ${list.map((e) => TopicsUI.entityCard(e, collection)).join('')}
                        </div>
                    </section>
                `).join('')}

                ${siblings.length ? `
                    <section class="topic-section topic-siblings">
                        <h3 class="topic-section-head">Related topics</h3>
                        <div class="topic-tile-grid">${siblings.map(TopicsUI.topicTile).join('')}</div>
                    </section>` : ''}
            </div>`;
    }
}

/**
 * #/region/:slug - the traditions inside one culture group.
 */
class RegionView {
    async render(container, slug) {
        container.innerHTML = '<div class="topic-loading">Loading…</div>';

        const region = await TopicsService.region(slug);
        if (!region) {
            container.innerHTML = TopicsUI.empty('That region does not exist.');
            return;
        }

        const regions = await TopicsService.regions();
        const others = regions.filter((r) => r.slug !== slug);

        container.innerHTML = `
            <div class="region-view">
                <nav class="topic-breadcrumb" aria-label="Breadcrumb">
                    <a href="#/explore">Explore</a> › <span>${TopicsUI.escape(region.name)}</span>
                </nav>

                <header class="topic-header">
                    <span class="topic-header-icon" aria-hidden="true">${TopicsUI.escape(region.icon || '◆')}</span>
                    <div>
                        <h1>${TopicsUI.escape(region.name)}</h1>
                        <p class="topic-standfirst">${TopicsUI.escape(region.blurb || '')}</p>
                        <p class="topic-meta">${region.total} entries across ${(region.traditions || []).length} traditions</p>
                    </div>
                </header>

                <div class="region-tradition-grid">
                    ${(region.traditions || []).map((t) => `
                        <a class="region-tradition" href="#/mythology/${encodeURIComponent(t.id)}">
                            <span class="region-tradition-name">${TopicsUI.escape(TopicsUI.titleCase(t.name))}</span>
                            <span class="region-tradition-count">${t.total}</span>
                        </a>
                    `).join('')}
                </div>

                <section class="topic-section">
                    <h3 class="topic-section-head">Other regions</h3>
                    <div class="region-tile-grid">${others.map(TopicsUI.regionTile).join('')}</div>
                </section>
            </div>`;
    }
}

if (typeof window !== 'undefined') {
    window.TopicsService = TopicsService;
    window.TopicsUI = TopicsUI;
    window.ExploreView = ExploreView;
    window.TopicView = TopicView;
    window.RegionView = RegionView;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TopicsService, TopicsUI, ExploreView, TopicView, RegionView };
}

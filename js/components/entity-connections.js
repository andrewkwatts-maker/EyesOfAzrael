/**
 * EntityConnections
 *
 * Renders an entity's place in the link graph: what it points at, and what
 * points at it. Both directions cross datasets — a history figure cites a
 * mythological archetype, a conspiracy theory cites a historical event — so a
 * link leaving the current dataset is marked as doing so rather than silently
 * teleporting the reader to a different tab.
 *
 * Two data sources, deliberately asymmetric:
 *
 * - **Outbound** comes from `entity.relatedEntities`, shaped
 *   `{ collectionName: [{ id, name, relationship }] }`. It lives on the entity,
 *   so it travels through both the static base and the delta layer with no
 *   extra read.
 * - **Inbound** comes from `entity._backlinks`, an array of
 *   `{ ref, name, collection, domain?, relationship? }` computed at export time
 *   by `scripts/export-static-base.js`. "What links here" as a live query would
 *   be an array-contains against every collection in every domain on every page
 *   view; the bake already walks every entity, so it inverts the graph once.
 *
 * An entity with neither renders nothing at all — an empty "Connections"
 * heading is worse than no heading.
 *
 * Usage:
 *   const html = new EntityConnections().render(entity, 'hist_figures');
 */

class EntityConnections {
    constructor(options = {}) {
        this.registry = options.registry
            || (typeof window !== 'undefined' ? window.DOMAINS : null);
        // How many links to show per direction before collapsing the remainder.
        this.limit = options.limit || 24;
    }

    // ── data ─────────────────────────────────────────────────────────────────

    /**
     * Links this entity points at.
     *
     * @param {object} entity
     * @param {string} fromCollection the entity's own collection
     * @returns {Array<{ref, collection, id, name, relationship, crossDomain, known, domainLabel}>}
     */
    outbound(entity, fromCollection) {
        const related = entity && entity.relatedEntities;
        if (!related || typeof related !== 'object' || Array.isArray(related)) return [];

        const fromDomain = this._domainOf(fromCollection);
        const out = [];
        const seen = new Set();

        for (const [collection, refs] of Object.entries(related)) {
            if (!Array.isArray(refs)) continue;

            for (const raw of refs) {
                // A ref is either a bare id string or an object carrying a name
                // and a relationship label.
                const id = typeof raw === 'string' ? raw : (raw && raw.id);
                if (!id) continue;

                const ref = `${collection}/${id}`;
                if (seen.has(ref)) continue;
                seen.add(ref);

                out.push(this._describe(ref, {
                    name: (raw && raw.name) || id,
                    relationship: (raw && raw.relationship) || '',
                }, fromDomain));
            }
        }

        return out;
    }

    /**
     * Links pointing at this entity, from `_backlinks` written at export time.
     *
     * @returns {Array} same shape as {@link outbound}
     */
    inbound(entity, fromCollection) {
        const links = entity && entity._backlinks;
        if (!Array.isArray(links)) return [];

        const fromDomain = this._domainOf(fromCollection);
        const out = [];
        const seen = new Set();

        for (const link of links) {
            const ref = link && (typeof link === 'string' ? link : link.ref);
            if (!ref || seen.has(ref)) continue;
            seen.add(ref);

            out.push(this._describe(ref, {
                name: (link && link.name) || ref,
                relationship: (link && link.relationship) || '',
            }, fromDomain));
        }

        return out;
    }

    /** The domain id owning a collection, or null. */
    _domainOf(collection) {
        if (!this.registry) return null;
        const domain = this.registry.domainForCollection(collection);
        return domain ? domain.id : null;
    }

    /**
     * Resolve one reference into everything the template needs.
     *
     * A ref naming a collection the registry does not know is not an error:
     * content outlives config, and a retired collection must render as a broken
     * link rather than throw. `known: false` drives that rendering.
     */
    _describe(ref, meta, fromDomainId) {
        const parsed = this.registry ? this.registry.parseRef(ref) : null;
        const known = Boolean(parsed && parsed.domain);
        const crossDomain = Boolean(
            known && fromDomainId && parsed.domain.id !== fromDomainId
        );

        return {
            ref,
            collection: parsed ? parsed.collection : '',
            id: parsed ? parsed.id : '',
            name: meta.name,
            relationship: meta.relationship,
            known,
            crossDomain,
            domainLabel: crossDomain ? parsed.domain.label : '',
        };
    }

    /**
     * Where a reference points.
     *
     * `#/entity/{collection}/{id}` is the two-segment entity route, which needs
     * no facet value — and a reference does not carry one. The router already
     * accepts it, and because prefixing makes collection names globally unique
     * the collection alone identifies the domain, so the tab bar follows.
     */
    hrefFor(link) {
        if (!link.known) return '';
        return `#/entity/${encodeURIComponent(link.collection)}/${encodeURIComponent(link.id)}`;
    }

    // ── rendering ────────────────────────────────────────────────────────────

    /**
     * @param {object} entity
     * @param {string} collection the entity's own collection
     * @returns {string} HTML, or '' when there is nothing to show
     */
    render(entity, collection) {
        const out = this.outbound(entity, collection);
        const back = this.inbound(entity, collection);
        if (!out.length && !back.length) return '';

        const sections = [];

        if (out.length) {
            sections.push(this._section(
                'Connections',
                'entity-connections__outbound',
                out,
                `${out.length} entit${out.length === 1 ? 'y' : 'ies'} referenced by this one`
            ));
        }

        if (back.length) {
            sections.push(this._section(
                'What links here',
                'entity-connections__inbound',
                back,
                `${back.length} entit${back.length === 1 ? 'y' : 'ies'} referencing this one`
            ));
        }

        return `<section class="entity-connections" aria-label="Connections">${sections.join('')}</section>`;
    }

    _section(heading, className, links, summary) {
        const headingId = `ec-${className}`;
        const shown = links.slice(0, this.limit);
        const hidden = links.length - shown.length;

        const items = shown.map(link => this._item(link)).join('');

        return `
            <div class="${className}">
                <h2 class="entity-connections__heading" id="${headingId}">${this._escape(heading)}</h2>
                <p class="entity-connections__summary">${this._escape(summary)}</p>
                <ul class="entity-connections__list" aria-labelledby="${headingId}">${items}</ul>
                ${hidden > 0 ? `<p class="entity-connections__more">and ${hidden} more</p>` : ''}
            </div>
        `;
    }

    _item(link) {
        const name = this._escape(link.name);
        const rel = link.relationship
            ? `<span class="entity-connections__relationship">${this._escape(link.relationship)}</span>`
            : '';

        // A link into another dataset is marked in text, not by colour alone —
        // the badge carries the destination's name so the cue survives for a
        // reader who cannot distinguish the styling.
        const badge = link.crossDomain
            ? `<span class="entity-connections__domain" title="Opens the ${this._escape(link.domainLabel)} dataset">${this._escape(link.domainLabel)}</span>`
            : '';

        if (!link.known) {
            return `
                <li class="entity-connections__item entity-connections__item--broken">
                    <span class="entity-connections__name" title="This reference points at a collection that no longer exists">${name}</span>
                    <span class="entity-connections__broken-note">unresolved reference</span>
                    ${rel}
                </li>`;
        }

        const crossClass = link.crossDomain ? ' entity-connections__item--cross-domain' : '';
        const ariaSuffix = link.crossDomain ? ` (in the ${this._escape(link.domainLabel)} dataset)` : '';

        return `
            <li class="entity-connections__item${crossClass}">
                <a class="entity-connections__link"
                   href="${this._escape(this.hrefFor(link))}"
                   data-collection="${this._escape(link.collection)}"
                   data-cross-domain="${link.crossDomain ? 'true' : 'false'}"
                   aria-label="${name}${ariaSuffix}">${name}</a>
                ${badge}
                ${rel}
            </li>`;
    }

    _escape(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

if (typeof window !== 'undefined') {
    window.EntityConnections = EntityConnections;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityConnections;
}

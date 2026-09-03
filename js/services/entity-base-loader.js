/**
 * EntityBaseLoader
 *
 * Loads static entity JSON files served from /static/entities/ (Firebase Hosting CDN)
 * and caches them in localStorage, keyed by the manifest version so stale entries
 * are automatically replaced when a new base is deployed.
 *
 * Request flow per call to load(collection, mythology):
 *   1. GET /static/entities/manifest.json
 *      → cached in localStorage for MANIFEST_TTL (5 min), re-checked on expiry
 *   2. If localStorage has a fresh entry for this version+collection+mythology, return it
 *   3. Otherwise GET /static/entities/{collection}/{mythology}.json
 *      → parse, cache in localStorage, return as Map<id, entity>
 *
 * An unfiltered load (no facet) reads `_cards.json` when the manifest declares
 * it, and `_all.json` otherwise. Cards carry every field the browse grid reads,
 * in full, at roughly a quarter of the bytes — `_all.json` for concepts is
 * 38.7 MB against 9.0 MB of cards, to draw a grid that then slices to 500. A
 * caller needing whole entities should read them from Firestore by id, which is
 * what the entity detail page already does.
 *
 * Returns null on any fetch failure so callers can fall back to Firestore.
 *
 * Usage:
 *   const loader = window.entityBaseLoader;
 *   const baseMap = await loader.load('deities', 'greek'); // Map<id, entity> | null
 *   const version = await loader.getVersion();
 *   const since   = await loader.getGeneratedAt();         // ISO string
 */

class EntityBaseLoader {
    constructor() {
        this._manifest        = null;
        this._manifestPromise = null;
        this._loadPromises    = new Map();

        this.BASE_URL           = '/static/entities';
        this.CACHE_PREFIX       = 'eoa_base_';
        this.MANIFEST_CACHE_KEY = 'eoa_base_manifest';
        this.MANIFEST_TTL       = 5 * 60 * 1000;        // 5 min — checks for new deploy
        this.ENTITY_TTL         = 24 * 60 * 60 * 1000;  // 24 h  — entity files rarely change

        // localStorage is ~5 MB total across the whole origin. Cap a single entry
        // well below that so one large shard cannot evict everything else; larger
        // shards are served from the HTTP cache instead. See _tryCache.
        this.MAX_CACHE_BYTES    = 2 * 1024 * 1024;
    }

    // ── Manifest ─────────────────────────────────────────────────────────────

    /** Returns the current manifest, fetching it if needed. */
    async getManifest() {
        if (this._manifest) return this._manifest;
        if (this._manifestPromise) return this._manifestPromise;

        this._manifestPromise = this._fetchManifest()
            .then(m  => { this._manifest = m; return m; })
            .finally(() => { this._manifestPromise = null; });

        return this._manifestPromise;
    }

    async _fetchManifest() {
        // Serve from localStorage while fresh
        try {
            const raw = localStorage.getItem(this.MANIFEST_CACHE_KEY);
            if (raw) {
                const { data, ts } = JSON.parse(raw);
                if (Date.now() - ts < this.MANIFEST_TTL) {
                    console.log('[BaseLoader] Manifest from localStorage');
                    return data;
                }
            }
        } catch (_) {}

        const resp = await fetch(`${this.BASE_URL}/manifest.json`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`Manifest HTTP ${resp.status}`);
        const data = await resp.json();

        try {
            localStorage.setItem(
                this.MANIFEST_CACHE_KEY,
                JSON.stringify({ data, ts: Date.now() })
            );
        } catch (_) {}

        console.log(`[BaseLoader] Manifest loaded — version ${data.version}, generated ${data.generatedAt}`);
        return data;
    }

    // ── Entity loading ────────────────────────────────────────────────────────

    /**
     * Load entities for a collection, optionally filtered to one mythology.
     *
     * @param {string}      collection  e.g. 'deities', 'creatures'
     * @param {string|null} mythology   e.g. 'greek', or null for all
     * @returns {Promise<Map<string,object>|null>}
     *   Map keyed by entity id, or null if the static base is unavailable.
     */
    async load(collection, mythology = null) {
        const key = `${collection}:${mythology || '_all'}`;
        if (this._loadPromises.has(key)) return this._loadPromises.get(key);

        const p = this._load(collection, mythology)
            .finally(() => this._loadPromises.delete(key));
        this._loadPromises.set(key, p);
        return p;
    }

    async _load(collection, mythology) {
        let manifest;
        try {
            manifest = await this.getManifest();
        } catch (err) {
            console.warn('[BaseLoader] Manifest unavailable — skipping static base:', err.message);
            return null;
        }

        if (!manifest.collections[collection]) {
            return null; // collection not exported
        }

        const collMeta = manifest.collections[collection];

        // Which facet values this collection is sharded by. Newer manifests write
        // `facets` (the domain-neutral name, since history shards by era and
        // conspiracy by category); older ones only have `mythologies`. Read both so
        // a deployed base generated before the domain registry still resolves.
        const facetValues = collMeta.facets || collMeta.mythologies || [];

        // Decide which static file covers this request
        let fileName;
        if (!mythology) {
            // An unfiltered list wants cards, not whole entities: the browse grid
            // renders cards and slices to 500, so `_all.json` meant downloading
            // 38.7 MB of concepts to draw 500 of them. `_cards.json` carries every
            // field the grid reads, in full, at 9.0 MB.
            //
            // Gated on the manifest rather than attempted optimistically. A base
            // deployed before this export has no `_cards.json`, and requesting one
            // would cost every visitor a 404 before the real fetch.
            fileName = collMeta.cards ? '_cards' : '_all';
        } else {
            const facetKey = mythology.toLowerCase().trim();
            fileName = facetValues.includes(facetKey) ? facetKey : null;
        }

        if (fileName === null) {
            // The requested facet is not in the static base. This is the likely
            // shape of a rollout mistake — content published to Firestore before a
            // re-bake — and returning an empty Map renders a blank page with no
            // error anywhere. Say so, so it is diagnosable from the console.
            console.warn(
                `[BaseLoader] "${mythology}" is not a known ${collection} shard ` +
                `(base has ${facetValues.length}). Returning empty; a re-bake may be needed.`
            );
            return new Map();
        }

        const cacheKey = `${this.CACHE_PREFIX}${manifest.version}_${collection}_${fileName}`;

        // Check localStorage
        try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
                const { data, ts } = JSON.parse(raw);
                if (Date.now() - ts < this.ENTITY_TTL) {
                    console.log(`[BaseLoader] localStorage hit: ${collection}/${fileName} (${data.length})`);
                    return this._toMap(data);
                }
            }
        } catch (_) {}

        // Fetch from CDN
        try {
            const url = `${this.BASE_URL}/${collection}/${fileName}.json`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const entities = await resp.json();

            // Persist, pruning previous versions for this collection to save space
            this._tryCache(cacheKey, collection, manifest.version, entities);

            console.log(`[BaseLoader] Fetched ${entities.length} ${collection}/${fileName}`);
            return this._toMap(entities);

        } catch (err) {
            console.warn(`[BaseLoader] Fetch failed for ${collection}/${fileName}:`, err.message);
            return null; // caller will fall back to Firestore
        }
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    /**
     * Cache a payload, skipping it when it cannot fit.
     *
     * This used to be a bare `try { setItem(...) } catch (_) {}`. localStorage
     * holds about 5 MB and the largest shards are far bigger than that —
     * concepts/_all.json is 39 MB, deities/greek.json is 4.6 MB — so setItem threw
     * QuotaExceededError, the empty catch swallowed it, and the 24-hour cache this
     * class advertises silently never populated for exactly the collections where
     * it mattered most. Every page view re-downloaded multi-megabyte JSON with
     * nothing logged to say why.
     *
     * Oversized payloads are now skipped deliberately and quietly-but-visibly,
     * rather than attempted and silently failed. Small shards still cache.
     */
    _tryCache(cacheKey, collection, version, entities) {
        let serialized;
        try {
            serialized = JSON.stringify({ data: entities, ts: Date.now() });
        } catch (err) {
            console.warn(`[BaseLoader] Could not serialize ${collection} for cache:`, err.message);
            return false;
        }

        // Rough byte estimate; UTF-16 in most engines, so length is a floor.
        if (serialized.length > this.MAX_CACHE_BYTES) {
            console.debug(
                `[BaseLoader] Not caching ${cacheKey} — ${(serialized.length / 1048576).toFixed(1)} MB ` +
                `exceeds the ${(this.MAX_CACHE_BYTES / 1048576).toFixed(1)} MB budget. ` +
                `It will be re-fetched (and served from the HTTP cache) each load.`
            );
            return false;
        }

        try {
            this._purgeOldVersions(collection, version);
            localStorage.setItem(cacheKey, serialized);
            return true;
        } catch (err) {
            // Quota can still be exceeded by the sum of entries even when this one
            // fits. Drop other base entries and retry once before giving up.
            console.debug(`[BaseLoader] Cache write failed for ${cacheKey} (${err.name}); pruning and retrying`);
            try {
                this._purgeAllBaseEntries();
                localStorage.setItem(cacheKey, serialized);
                return true;
            } catch (retryErr) {
                console.warn(
                    `[BaseLoader] Caching disabled for ${cacheKey}: ${retryErr.name}. ` +
                    `Static base will be re-fetched every load.`
                );
                return false;
            }
        }
    }

    /** Remove every cached base entry, whatever its version or collection. */
    _purgeAllBaseEntries() {
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(this.CACHE_PREFIX) && key !== this.MANIFEST_CACHE_KEY) {
                localStorage.removeItem(key);
            }
        }
    }

    _toMap(entities) {
        const map = new Map();
        for (const e of entities) {
            if (e && e.id) map.set(String(e.id), e);
        }
        return map;
    }

    _purgeOldVersions(collection, currentVersion) {
        const collectionFragment = `_${collection}_`;
        const currentPrefix      = `${this.CACHE_PREFIX}${currentVersion}`;
        try {
            for (const key of Object.keys(localStorage)) {
                if (
                    key.startsWith(this.CACHE_PREFIX) &&
                    key.includes(collectionFragment) &&
                    !key.startsWith(currentPrefix)
                ) {
                    localStorage.removeItem(key);
                }
            }
        } catch (_) {}
    }

    /** Force-expire the manifest so it is re-fetched on next getManifest() call. */
    invalidateManifest() {
        this._manifest = null;
        try { localStorage.removeItem(this.MANIFEST_CACHE_KEY); } catch (_) {}
    }

    /** @returns {Promise<string|null>} Current base version hash, or null. */
    async getVersion() {
        try { return (await this.getManifest()).version; } catch (_) { return null; }
    }

    /** @returns {Promise<string|null>} ISO timestamp when base was generated, or null. */
    async getGeneratedAt() {
        try { return (await this.getManifest()).generatedAt; } catch (_) { return null; }
    }

    /** @returns {Promise<boolean>} Whether a collection is present in the static base. */
    async hasCollection(collection) {
        try { return Boolean((await this.getManifest()).collections[collection]); }
        catch (_) { return false; }
    }
}

// ── global registration ───────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.EntityBaseLoader = EntityBaseLoader;
    window.entityBaseLoader = window.entityBaseLoader || new EntityBaseLoader();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityBaseLoader;
}

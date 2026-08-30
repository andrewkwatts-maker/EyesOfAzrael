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
 *   3. Otherwise GET /static/entities/{collection}/{mythology}.json (or _all.json)
 *      → parse, cache in localStorage, return as Map<id, entity>
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

        // Decide which static file covers this request
        let fileName;
        if (!mythology) {
            fileName = '_all';
        } else {
            const mythKey = mythology.toLowerCase().trim();
            fileName = collMeta.mythologies.includes(mythKey) ? mythKey : null;
        }

        if (fileName === null) {
            // Mythology not present in static base — return empty map (no entities, not an error)
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
            try {
                this._purgeOldVersions(collection, manifest.version);
                localStorage.setItem(cacheKey, JSON.stringify({ data: entities, ts: Date.now() }));
            } catch (_) {}

            console.log(`[BaseLoader] Fetched ${entities.length} ${collection}/${fileName}`);
            return this._toMap(entities);

        } catch (err) {
            console.warn(`[BaseLoader] Fetch failed for ${collection}/${fileName}:`, err.message);
            return null; // caller will fall back to Firestore
        }
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

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

/**
 * Dynamic XML Sitemap Generator
 * Generates sitemap.xml from Firebase Firestore data
 */

class SitemapGenerator {
    constructor() {
        this.baseUrl = 'https://eyesofazrael.com';
        this.db = firebase.firestore();
    }

    /**
     * Generate complete sitemap
     */
    async generateSitemap() {
        const urls = [];

        // Static pages
        urls.push(...this.getStaticPages());

        // Dynamic content from Firestore
        urls.push(...await this.getMythologyPages());
        urls.push(...await this.getDeityPages());
        urls.push(...await this.getArchetypePages());
        urls.push(...await this.getHerbPages());
        urls.push(...await this.getMagicSystemPages());
        urls.push(...await this.getSpiritualItemPages());
        urls.push(...await this.getSpiritualPlacePages());

        return this.formatSitemap(urls);
    }

    /**
     * Get static page URLs
     */
    getStaticPages() {
        return [
            {
                loc: this.baseUrl + '/',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'daily',
                priority: 1.0
            },
            {
                loc: this.baseUrl + '/about.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'monthly',
                priority: 0.8
            },
            {
                loc: this.baseUrl + '/mythos/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: 0.9
            },
            {
                loc: this.baseUrl + '/magic/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: 0.8
            },
            {
                loc: this.baseUrl + '/herbalism/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: 0.8
            },
            {
                loc: this.baseUrl + '/spiritual-items/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: 0.7
            },
            {
                loc: this.baseUrl + '/spiritual-places/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: 0.7
            },
            {
                loc: this.baseUrl + '/theories/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'daily',
                priority: 0.7
            }
        ];
    }

    // ── shared helper ─────────────────────────────────────────────────────────

    /**
     * Load entities for sitemap — prefers static base (zero Firestore reads),
     * falls back to a direct Firestore fetch.
     */
    async _loadEntities(collection) {
        const loader = typeof window !== 'undefined' ? window.entityBaseLoader : null;
        if (loader) {
            try {
                const baseMap = await loader.load(collection, null);
                if (baseMap && baseMap.size > 0) return Array.from(baseMap.values());
            } catch (_) {}
        }
        const snapshot = await this.db.collection(collection).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    _lastmod(data) {
        try { return data.updatedAt?.toDate().toISOString().split('T')[0]; } catch (_) {}
        return new Date().toISOString().split('T')[0];
    }

    // ── page-list methods ──────────────────────────────────────────────────────

    /**
     * Get mythology pages from Firestore
     */
    async getMythologyPages() {
        try {
            const snapshot = await this.db.collection('mythologies').get();
            const excluded = new Set(['comparative', 'herbalism', 'themes', 'freemasons', 'tarot']);
            return snapshot.docs
                .filter(doc => !excluded.has(doc.id))
                .map(doc => ({
                    loc: `${this.baseUrl}/mythos/${doc.id}/index.html`,
                    lastmod: this._lastmod(doc.data()),
                    changefreq: 'weekly',
                    priority: 0.8
                }));
        } catch (error) {
            console.error('Error fetching mythology pages:', error);
            return [];
        }
    }

    /**
     * Get deity pages — uses static base when available
     */
    async getDeityPages() {
        try {
            const entities = await this._loadEntities('deities');
            return entities.map(data => ({
                loc: `${this.baseUrl}/mythos/${(data.mythology || 'unknown').toLowerCase()}/deities/${data.id}.html`,
                lastmod: this._lastmod(data),
                changefreq: 'monthly',
                priority: 0.7
            }));
        } catch (error) {
            console.error('Error fetching deity pages:', error);
            return [];
        }
    }

    /**
     * Get archetype pages — uses static base when available
     */
    async getArchetypePages() {
        try {
            const entities = await this._loadEntities('archetypes');
            return entities.map(data => ({
                loc: `${this.baseUrl}/archetypes/${(data.category || 'general').toLowerCase()}/${data.id}/index.html`,
                lastmod: this._lastmod(data),
                changefreq: 'monthly',
                priority: 0.6
            }));
        } catch (error) {
            console.error('Error fetching archetype pages:', error);
            return [];
        }
    }

    /**
     * Get herb pages — uses static base when available
     */
    async getHerbPages() {
        try {
            const entities = await this._loadEntities('herbs');
            return entities.map(data => ({
                loc: `${this.baseUrl}/herbalism/${data.id}.html`,
                lastmod: this._lastmod(data),
                changefreq: 'monthly',
                priority: 0.6
            }));
        } catch (error) {
            console.error('Error fetching herb pages:', error);
            return [];
        }
    }

    /**
     * Get magic system pages from Firestore
     */
    async getMagicSystemPages() {
        try {
            const snapshot = await this.db.collection('magic-systems').get();
            return snapshot.docs.map(doc => ({
                loc: `${this.baseUrl}/magic/${doc.id}.html`,
                lastmod: this._lastmod(doc.data()),
                changefreq: 'monthly',
                priority: 0.6
            }));
        } catch (error) {
            console.error('Error fetching magic system pages:', error);
            return [];
        }
    }

    /**
     * Get spiritual item pages from Firestore
     */
    async getSpiritualItemPages() {
        try {
            const snapshot = await this.db.collection('spiritual-items').get();
            return snapshot.docs.map(doc => ({
                loc: `${this.baseUrl}/spiritual-items/${doc.id}.html`,
                lastmod: this._lastmod(doc.data()),
                changefreq: 'monthly',
                priority: 0.5
            }));
        } catch (error) {
            console.error('Error fetching spiritual item pages:', error);
            return [];
        }
    }

    /**
     * Get spiritual place pages from Firestore
     */
    async getSpiritualPlacePages() {
        try {
            const snapshot = await this.db.collection('spiritual-places').get();
            return snapshot.docs.map(doc => ({
                loc: `${this.baseUrl}/spiritual-places/${doc.id}.html`,
                lastmod: this._lastmod(doc.data()),
                changefreq: 'monthly',
                priority: 0.5
            }));
        } catch (error) {
            console.error('Error fetching spiritual place pages:', error);
            return [];
        }
    }

    /**
     * Format URLs as XML sitemap
     */
    formatSitemap(urls) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        urls.forEach(url => {
            xml += '  <url>\n';
            xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
            if (url.lastmod) {
                xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
            }
            if (url.changefreq) {
                xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
            }
            if (url.priority) {
                xml += `    <priority>${url.priority}</priority>\n`;
            }
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        return xml;
    }

    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Download sitemap as file
     */
    async downloadSitemap() {
        const xml = await this.generateSitemap();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Save sitemap to Firebase Storage (for admin use)
     */
    async saveSitemap() {
        try {
            const xml = await this.generateSitemap();
            const storage = firebase.storage();
            const ref = storage.ref('sitemap.xml');
            await ref.putString(xml, 'raw', { contentType: 'application/xml' });
            console.log('Sitemap saved to Firebase Storage');
            return true;
        } catch (error) {
            console.error('Error saving sitemap:', error);
            return false;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SitemapGenerator;
}

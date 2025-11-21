/**
 * Data API Layer for 288 Sparks
 * Provides abstraction for loading data from multiple sources:
 * - Local JSON files
 * - External APIs
 * - Database endpoints
 * - CSV/Excel imports
 */

class SparksDataAPI {
    constructor() {
        this.cache = new Map();
        this.dataSource = 'local'; // 'local', 'api', 'hybrid'
        this.apiEndpoint = null;
        this.updateHandlers = [];
    }

    /**
     * Configure the data source
     * @param {Object} config - Configuration object
     * @param {string} config.source - 'local', 'api', or 'hybrid'
     * @param {string} config.endpoint - API endpoint URL (if using API)
     * @param {Object} config.headers - Custom headers for API requests
     */
    configure(config) {
        this.dataSource = config.source || 'local';
        this.apiEndpoint = config.endpoint || null;
        this.headers = config.headers || {};
        console.log(`[SparksDataAPI] Configured: ${this.dataSource}`);
    }

    /**
     * Register a handler to be called when data updates
     * @param {Function} handler - Callback function
     */
    onDataUpdate(handler) {
        this.updateHandlers.push(handler);
    }

    /**
     * Trigger all update handlers
     */
    triggerUpdate(dataType, data) {
        this.updateHandlers.forEach(handler => handler(dataType, data));
    }

    /**
     * Fetch all Sefirot data
     * @returns {Promise<Array>} Array of Sefirot objects
     */
    async getSefirot() {
        const cacheKey = 'sefirot';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI('/sefirot');
                break;
            case 'hybrid':
                data = await this.fetchHybrid('/sefirot', SEFIROT);
                break;
            case 'local':
            default:
                data = SEFIROT;
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch specific Sefirah by ID
     * @param {string} sefirahId - ID of the Sefirah
     * @returns {Promise<Object>} Sefirah object
     */
    async getSefirah(sefirahId) {
        const cacheKey = `sefirah_${sefirahId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI(`/sefirot/${sefirahId}`);
                break;
            case 'hybrid':
            case 'local':
            default:
                const sefirot = await this.getSefirot();
                data = sefirot.find(s => s.id === sefirahId);
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch all Worlds data
     * @returns {Promise<Array>} Array of World objects
     */
    async getWorlds() {
        const cacheKey = 'worlds';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI('/worlds');
                break;
            case 'hybrid':
                data = await this.fetchHybrid('/worlds', WORLDS);
                break;
            case 'local':
            default:
                data = WORLDS;
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch specific World by ID
     * @param {string} worldId - ID of the World
     * @returns {Promise<Object>} World object
     */
    async getWorld(worldId) {
        const cacheKey = `world_${worldId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI(`/worlds/${worldId}`);
                break;
            case 'hybrid':
            case 'local':
            default:
                const worlds = await this.getWorlds();
                data = worlds.find(w => w.id === worldId);
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch all 72 Names
     * @returns {Promise<Array>} Array of Name objects
     */
    async getNames() {
        const cacheKey = 'names';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI('/names');
                break;
            case 'hybrid':
                data = await this.fetchHybrid('/names', NAMES_72);
                break;
            case 'local':
            default:
                data = NAMES_72;
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch specific Name by ID
     * @param {number} nameId - ID of the Name (1-72)
     * @returns {Promise<Object>} Name object
     */
    async getName(nameId) {
        const cacheKey = `name_${nameId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI(`/names/${nameId}`);
                break;
            case 'hybrid':
            case 'local':
            default:
                const names = await this.getNames();
                data = names.find(n => n.id === nameId);
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch all Sparks or filtered subset
     * @param {Object} filters - Optional filters
     * @param {string} filters.world - Filter by world ID
     * @param {string} filters.sefirah - Filter by sefirah ID
     * @param {number} filters.nameId - Filter by name ID
     * @returns {Promise<Array>} Array of Spark objects
     */
    async getSparks(filters = {}) {
        let cacheKey = 'sparks';
        if (Object.keys(filters).length > 0) {
            cacheKey += '_' + JSON.stringify(filters);
        }

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                const queryString = new URLSearchParams(filters).toString();
                data = await this.fetchFromAPI(`/sparks${queryString ? '?' + queryString : ''}`);
                break;
            case 'hybrid':
            case 'local':
            default:
                // Generate sparks from combination of Names × Worlds if not explicitly defined
                data = this.generateSparks(filters);
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Fetch specific Spark by ID
     * @param {string} sparkId - ID of the Spark (e.g., 'vehu-atziluth')
     * @returns {Promise<Object>} Spark object
     */
    async getSpark(sparkId) {
        const cacheKey = `spark_${sparkId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data;

        switch (this.dataSource) {
            case 'api':
                data = await this.fetchFromAPI(`/sparks/${sparkId}`);
                break;
            case 'hybrid':
            case 'local':
            default:
                const sparks = await this.getSparks();
                data = sparks.find(s => s.id === sparkId);
                break;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Search across all data
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results organized by type
     */
    async search(query, options = {}) {
        const results = {
            sefirot: [],
            worlds: [],
            names: [],
            sparks: []
        };

        const lowerQuery = query.toLowerCase();

        // Search Sefirot
        const sefirot = await this.getSefirot();
        results.sefirot = sefirot.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.meaning.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery) ||
            s.attributes.some(attr => attr.toLowerCase().includes(lowerQuery))
        );

        // Search Worlds
        const worlds = await this.getWorlds();
        results.worlds = worlds.filter(w =>
            w.name.toLowerCase().includes(lowerQuery) ||
            w.meaning.toLowerCase().includes(lowerQuery) ||
            w.description.toLowerCase().includes(lowerQuery)
        );

        // Search Names
        const names = await this.getNames();
        results.names = names.filter(n =>
            n.transliteration.toLowerCase().includes(lowerQuery) ||
            n.meaning.toLowerCase().includes(lowerQuery) ||
            n.attribute.toLowerCase().includes(lowerQuery) ||
            n.hebrew.includes(query) // Exact match for Hebrew
        );

        // Search Sparks (if implemented)
        if (options.includeS parks) {
            const sparks = await this.getSparks();
            results.sparks = sparks.filter(s =>
                s.name?.toLowerCase().includes(lowerQuery) ||
                s.title?.toLowerCase().includes(lowerQuery) ||
                s.description?.toLowerCase().includes(lowerQuery)
            );
        }

        return results;
    }

    /**
     * Import data from external source
     * @param {string} source - Source type ('json', 'csv', 'api')
     * @param {string|Object} data - Data or URL to fetch from
     * @param {string} dataType - Type of data ('sefirot', 'worlds', 'names', 'sparks')
     */
    async importData(source, data, dataType) {
        let parsedData;

        switch (source) {
            case 'json':
                if (typeof data === 'string') {
                    // Assume it's a URL
                    const response = await fetch(data);
                    parsedData = await response.json();
                } else {
                    parsedData = data;
                }
                break;

            case 'csv':
                parsedData = await this.parseCSV(data);
                break;

            case 'api':
                parsedData = await this.fetchFromAPI(data);
                break;

            default:
                throw new Error(`Unknown import source: ${source}`);
        }

        // Validate and cache the data
        this.cache.set(dataType, parsedData);
        this.triggerUpdate(dataType, parsedData);

        return parsedData;
    }

    /**
     * Export data to various formats
     * @param {string} dataType - Type of data to export
     * @param {string} format - Export format ('json', 'csv')
     * @returns {Promise<string>} Exported data as string
     */
    async exportData(dataType, format = 'json') {
        let data;

        switch (dataType) {
            case 'sefirot':
                data = await this.getSefirot();
                break;
            case 'worlds':
                data = await this.getWorlds();
                break;
            case 'names':
                data = await this.getNames();
                break;
            case 'sparks':
                data = await this.getSparks();
                break;
            default:
                throw new Error(`Unknown data type: ${dataType}`);
        }

        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);

            case 'csv':
                return this.convertToCSV(data);

            default:
                throw new Error(`Unknown export format: ${format}`);
        }
    }

    /**
     * Clear cache (force refresh)
     * @param {string} key - Optional specific cache key to clear
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
            console.log(`[SparksDataAPI] Cleared cache for: ${key}`);
        } else {
            this.cache.clear();
            console.log('[SparksDataAPI] Cleared all cache');
        }
    }

    // ==================== Private Helper Methods ====================

    /**
     * Fetch data from API endpoint
     * @private
     */
    async fetchFromAPI(path) {
        if (!this.apiEndpoint) {
            throw new Error('API endpoint not configured');
        }

        const url = `${this.apiEndpoint}${path}`;
        console.log(`[SparksDataAPI] Fetching from: ${url}`);

        try {
            const response = await fetch(url, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[SparksDataAPI] API fetch error:', error);
            throw error;
        }
    }

    /**
     * Hybrid fetch: Try API first, fallback to local
     * @private
     */
    async fetchHybrid(path, fallbackData) {
        try {
            return await this.fetchFromAPI(path);
        } catch (error) {
            console.warn('[SparksDataAPI] API fetch failed, using local data');
            return fallbackData;
        }
    }

    /**
     * Generate Sparks from Names × Worlds combination
     * @private
     */
    generateSparks(filters = {}) {
        const sparks = [];
        const names = filters.nameId ? [NAMES_72.find(n => n.id === filters.nameId)] : NAMES_72;
        const worlds = filters.world ? [WORLDS.find(w => w.id === filters.world)] : WORLDS;

        names.forEach(name => {
            worlds.forEach((world, worldIndex) => {
                const sparkNumber = (name.id - 1) * 4 + worldIndex + 1;
                const sparkId = `${name.transliteration.toLowerCase()}-${world.id}`;

                sparks.push({
                    id: sparkId,
                    sparkNumber: sparkNumber,
                    name: `${name.transliteration} of ${world.name}`,
                    nameId: name.id,
                    worldId: world.id,
                    sefirahId: filters.sefirah || this.determineSefirahForSpark(sparkNumber),
                    title: `The ${name.attribute} in ${world.name}`,
                    description: `${name.meaning} manifested in the ${world.meaning}`,
                    powers: [name.attribute],
                    domain: world.element,
                    relatedSparks: [],
                    opposingSparks: [],
                    complementarySparks: [],
                    primaryColor: world.element,
                    secondaryColor: '',
                    symbol: name.hebrew,
                    visualDescription: `Embodies ${name.attribute} with ${world.element} elemental nature`,
                    sources: [name.citation, world.citation],
                    gameRole: 'Character',
                    abilities: []
                });
            });
        });

        return sparks;
    }

    /**
     * Determine which Sefirah a spark number belongs to
     * @private
     */
    determineSefirahForSpark(sparkNumber) {
        // 288 sparks / 10 sefirot ≈ 28.8 sparks per sefirah
        const sparksPerSefirah = 288 / 10;
        const sefirahIndex = Math.floor((sparkNumber - 1) / sparksPerSefirah);
        return SEFIROT[Math.min(sefirahIndex, 9)]?.id || 'keter';
    }

    /**
     * Parse CSV data
     * @private
     */
    async parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',').map(v => v.trim());
            const obj = {};

            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });

            data.push(obj);
        }

        return data;
    }

    /**
     * Convert data to CSV format
     * @private
     */
    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvLines = [headers.join(',')];

        data.forEach(item => {
            const values = headers.map(header => {
                const value = item[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });

        return csvLines.join('\n');
    }
}

// Create global instance
window.sparksAPI = new SparksDataAPI();

// Example usage and configuration
console.log('[SparksDataAPI] Initialized');

// Example: Configure to use external API
// sparksAPI.configure({
//     source: 'api',
//     endpoint: 'https://your-api.com/api',
//     headers: {
//         'Authorization': 'Bearer YOUR_TOKEN'
//     }
// });

// Example: Configure hybrid mode (API with local fallback)
// sparksAPI.configure({
//     source: 'hybrid',
//     endpoint: 'https://your-api.com/api'
// });

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SparksDataAPI;
}

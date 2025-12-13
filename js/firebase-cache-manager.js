/**
 * Firebase Cache Manager - Eyes of Azrael
 *
 * Comprehensive client-side caching system for Firebase queries with:
 * - Hourly cache invalidation
 * - Version-based invalidation
 * - TTL management
 * - Size limits
 * - Metrics tracking
 *
 * @module FirebaseCacheManager
 */

class FirebaseCacheManager {
  /**
   * Initialize the cache manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      storage: options.storage || 'localStorage', // 'localStorage' or 'sessionStorage'
      maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB default
      defaultTTL: options.defaultTTL || 3600000, // 1 hour in milliseconds
      keyPrefix: options.keyPrefix || 'eoa_cache_',
      versionKey: options.versionKey || 'eoa_cache_version',
      statsKey: options.statsKey || 'eoa_cache_stats',
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging || false,
      hourlyInvalidation: options.hourlyInvalidation !== false
    };

    // Get storage interface
    this.storage = this.options.storage === 'sessionStorage'
      ? window.sessionStorage
      : window.localStorage;

    // Initialize metrics
    this.stats = this.loadStats();

    // Initialize version tracker
    this.currentVersion = null;

    // Cleanup expired entries on initialization
    this.cleanupExpired();

    // Setup hourly invalidation
    if (this.options.hourlyInvalidation) {
      this.setupHourlyInvalidation();
    }

    this.log('Cache manager initialized', this.options);
  }

  /**
   * Get data from cache or execute query function
   * @param {string} cacheKey - Unique cache key
   * @param {Function} queryFn - Async function to execute if cache miss
   * @param {Object} options - Cache options
   * @returns {Promise<*>} Cached or fresh data
   */
  async get(cacheKey, queryFn, options = {}) {
    const fullKey = this.options.keyPrefix + cacheKey;
    const ttl = options.ttl || this.options.defaultTTL;
    const bypassCache = options.bypassCache || false;
    const tags = options.tags || [];

    this.log(`Cache GET: ${cacheKey}`, { bypassCache, ttl });

    // Check version first
    if (!bypassCache && !(await this.isVersionValid())) {
      this.log('Version mismatch detected, invalidating all caches');
      this.invalidateAll();
    }

    // Try to get from cache
    if (!bypassCache) {
      const cached = this.getFromCache(fullKey);
      if (cached !== null) {
        this.recordHit();
        this.log(`Cache HIT: ${cacheKey}`);
        return cached.data;
      }
    }

    // Cache miss - execute query
    this.recordMiss();
    this.log(`Cache MISS: ${cacheKey}`);

    try {
      const data = await queryFn();

      // Store in cache
      this.setInCache(fullKey, data, ttl, tags);

      return data;
    } catch (error) {
      this.log(`Query error for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Get item from cache with expiry check
   * @param {string} key - Cache key
   * @returns {Object|null} Cached item or null
   */
  getFromCache(key) {
    try {
      const item = this.storage.getItem(key);
      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);

      // Check expiry
      if (Date.now() > parsed.expiry) {
        this.log(`Cache expired: ${key}`);
        this.storage.removeItem(key);
        return null;
      }

      return parsed;
    } catch (error) {
      this.log(`Error reading cache ${key}:`, error);
      return null;
    }
  }

  /**
   * Store item in cache with expiry
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @param {Array<string>} tags - Tags for categorization
   */
  setInCache(key, data, ttl, tags = []) {
    try {
      // Calculate expiry time
      const expiry = this.options.hourlyInvalidation
        ? this.getNextHourTimestamp()
        : Date.now() + ttl;

      const cacheItem = {
        data,
        expiry,
        created: Date.now(),
        ttl,
        tags,
        version: this.currentVersion
      };

      const serialized = JSON.stringify(cacheItem);

      // Check size before storing
      if (!this.canStore(serialized.length)) {
        this.log('Cache full, cleaning up...');
        this.cleanupLRU();
      }

      this.storage.setItem(key, serialized);
      this.log(`Cache SET: ${key} (expires: ${new Date(expiry).toISOString()})`);

      // Update stats
      this.updateStorageSize();
    } catch (error) {
      this.log(`Error setting cache ${key}:`, error);

      // Try to free up space if quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.cleanupLRU();
        try {
          this.storage.setItem(key, JSON.stringify({ data, expiry, created: Date.now(), ttl, tags }));
        } catch (retryError) {
          this.log('Failed to cache after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Calculate next hour boundary timestamp
   * @returns {number} Timestamp of next hour
   */
  getNextHourTimestamp() {
    const now = new Date();
    const nextHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() + 1,
      0, 0, 0
    );
    return nextHour.getTime();
  }

  /**
   * Setup automatic hourly cache invalidation
   */
  setupHourlyInvalidation() {
    const scheduleNextCleanup = () => {
      const now = Date.now();
      const nextHour = this.getNextHourTimestamp();
      const delay = nextHour - now;

      this.log(`Next hourly cleanup scheduled in ${Math.round(delay / 60000)} minutes`);

      setTimeout(() => {
        this.log('Hourly cache cleanup triggered');
        this.cleanupExpired();
        scheduleNextCleanup(); // Schedule next cleanup
      }, delay);
    };

    scheduleNextCleanup();
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   */
  invalidate(pattern) {
    const regex = pattern instanceof RegExp
      ? pattern
      : new RegExp(pattern.replace(/\*/g, '.*'));

    let count = 0;
    const keys = this.getAllCacheKeys();

    keys.forEach(key => {
      const shortKey = key.replace(this.options.keyPrefix, '');
      if (regex.test(shortKey)) {
        this.storage.removeItem(key);
        count++;
      }
    });

    this.log(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
    this.updateStorageSize();
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll() {
    const keys = this.getAllCacheKeys();
    keys.forEach(key => this.storage.removeItem(key));

    this.log(`Invalidated all ${keys.length} cache entries`);
    this.updateStorageSize();
  }

  /**
   * Invalidate cache entries by tag
   * @param {string} tag - Tag to match
   */
  invalidateByTag(tag) {
    let count = 0;
    const keys = this.getAllCacheKeys();

    keys.forEach(key => {
      try {
        const item = this.storage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.tags && parsed.tags.includes(tag)) {
            this.storage.removeItem(key);
            count++;
          }
        }
      } catch (error) {
        this.log(`Error checking tags for ${key}:`, error);
      }
    });

    this.log(`Invalidated ${count} cache entries with tag: ${tag}`);
    this.updateStorageSize();
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpired() {
    const now = Date.now();
    let count = 0;
    const keys = this.getAllCacheKeys();

    keys.forEach(key => {
      try {
        const item = this.storage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (now > parsed.expiry) {
            this.storage.removeItem(key);
            count++;
          }
        }
      } catch (error) {
        this.log(`Error cleaning up ${key}:`, error);
        // Remove corrupted entries
        this.storage.removeItem(key);
        count++;
      }
    });

    if (count > 0) {
      this.log(`Cleaned up ${count} expired cache entries`);
      this.updateStorageSize();
    }
  }

  /**
   * Clean up using LRU (Least Recently Used) strategy
   * @param {number} targetSize - Target size in bytes (optional)
   */
  cleanupLRU(targetSize = null) {
    const keys = this.getAllCacheKeys();
    const items = [];

    // Collect all cache items with their access time
    keys.forEach(key => {
      try {
        const item = this.storage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          items.push({
            key,
            created: parsed.created || 0,
            size: item.length
          });
        }
      } catch (error) {
        this.log(`Error in LRU cleanup for ${key}:`, error);
      }
    });

    // Sort by creation time (oldest first)
    items.sort((a, b) => a.created - b.created);

    // Remove oldest items until we reach target
    const target = targetSize || (this.options.maxSize * 0.7); // Clean to 70% capacity
    let currentSize = this.getCurrentSize();
    let removed = 0;

    for (const item of items) {
      if (currentSize <= target) {
        break;
      }
      this.storage.removeItem(item.key);
      currentSize -= item.size;
      removed++;
    }

    this.log(`LRU cleanup removed ${removed} entries`);
    this.updateStorageSize();
  }

  /**
   * Check if we can store data of given size
   * @param {number} size - Size in bytes
   * @returns {boolean} Whether we can store
   */
  canStore(size) {
    return (this.getCurrentSize() + size) <= this.options.maxSize;
  }

  /**
   * Get current cache size in bytes
   * @returns {number} Size in bytes
   */
  getCurrentSize() {
    let size = 0;
    const keys = this.getAllCacheKeys();

    keys.forEach(key => {
      const item = this.storage.getItem(key);
      if (item) {
        size += item.length;
      }
    });

    return size;
  }

  /**
   * Get all cache keys
   * @returns {Array<string>} Array of cache keys
   */
  getAllCacheKeys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.options.keyPrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Check if cached version matches current version
   * @returns {Promise<boolean>} Whether version is valid
   */
  async isVersionValid() {
    // If no version tracking, always valid
    if (!this.currentVersion) {
      return true;
    }

    // Get stored version
    const storedVersion = this.storage.getItem(this.options.versionKey);

    if (!storedVersion) {
      // First time - store current version
      this.storage.setItem(this.options.versionKey, String(this.currentVersion));
      return true;
    }

    return String(this.currentVersion) === storedVersion;
  }

  /**
   * Update cached version
   * @param {number|string} version - New version
   */
  setVersion(version) {
    this.currentVersion = version;
    this.storage.setItem(this.options.versionKey, String(version));
    this.log(`Cache version updated to: ${version}`);
  }

  /**
   * Record cache hit
   */
  recordHit() {
    if (!this.options.enableMetrics) return;
    this.stats.hits++;
    this.stats.lastHit = Date.now();
    this.saveStats();
  }

  /**
   * Record cache miss
   */
  recordMiss() {
    if (!this.options.enableMetrics) return;
    this.stats.misses++;
    this.stats.lastMiss = Date.now();
    this.saveStats();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    const size = this.getCurrentSize();
    const keys = this.getAllCacheKeys();

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      total,
      hitRate: `${hitRate}%`,
      size,
      sizeFormatted: this.formatBytes(size),
      maxSize: this.options.maxSize,
      maxSizeFormatted: this.formatBytes(this.options.maxSize),
      utilization: `${(size / this.options.maxSize * 100).toFixed(2)}%`,
      entries: keys.length,
      lastHit: this.stats.lastHit ? new Date(this.stats.lastHit).toISOString() : null,
      lastMiss: this.stats.lastMiss ? new Date(this.stats.lastMiss).toISOString() : null,
      version: this.currentVersion,
      storage: this.options.storage
    };
  }

  /**
   * Get detailed cache entries info
   * @returns {Array<Object>} Array of cache entry details
   */
  getCacheEntries() {
    const keys = this.getAllCacheKeys();
    const entries = [];

    keys.forEach(key => {
      try {
        const item = this.storage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          entries.push({
            key: key.replace(this.options.keyPrefix, ''),
            size: item.length,
            sizeFormatted: this.formatBytes(item.length),
            created: new Date(parsed.created).toISOString(),
            expiry: new Date(parsed.expiry).toISOString(),
            ttl: parsed.ttl,
            tags: parsed.tags || [],
            version: parsed.version
          });
        }
      } catch (error) {
        this.log(`Error getting entry info for ${key}:`, error);
      }
    });

    // Sort by creation time (newest first)
    entries.sort((a, b) => new Date(b.created) - new Date(a.created));

    return entries;
  }

  /**
   * Load statistics from storage
   * @returns {Object} Stats object
   */
  loadStats() {
    try {
      const stats = this.storage.getItem(this.options.statsKey);
      if (stats) {
        return JSON.parse(stats);
      }
    } catch (error) {
      this.log('Error loading stats:', error);
    }

    return {
      hits: 0,
      misses: 0,
      lastHit: null,
      lastMiss: null,
      created: Date.now()
    };
  }

  /**
   * Save statistics to storage
   */
  saveStats() {
    try {
      this.storage.setItem(this.options.statsKey, JSON.stringify(this.stats));
    } catch (error) {
      this.log('Error saving stats:', error);
    }
  }

  /**
   * Update storage size in stats
   */
  updateStorageSize() {
    this.stats.currentSize = this.getCurrentSize();
    this.saveStats();
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      lastHit: null,
      lastMiss: null,
      created: Date.now(),
      currentSize: this.getCurrentSize()
    };
    this.saveStats();
    this.log('Statistics reset');
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate cache key from query parameters
   * @param {string} collection - Collection name
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   */
  static generateKey(collection, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    const paramString = JSON.stringify(sortedParams);
    return `${collection}_${this.hashString(paramString)}`;
  }

  /**
   * Simple string hash function
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Log message if logging enabled
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (this.options.enableLogging) {
      console.log('[CacheManager]', ...args);
    }
  }

  /**
   * Clear all cache data and reset
   */
  destroy() {
    this.invalidateAll();
    this.storage.removeItem(this.options.versionKey);
    this.storage.removeItem(this.options.statsKey);
    this.log('Cache manager destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseCacheManager;
}

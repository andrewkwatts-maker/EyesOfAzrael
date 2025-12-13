/**
 * Firebase Content Loader - Eyes of Azrael
 *
 * Universal content loader for ALL content types from Firestore.
 * Handles loading, rendering, filtering, and error states with
 * glassmorphism UI design.
 *
 * @module FirebaseContentLoader
 */

class FirebaseContentLoader {
  /**
   * Initialize the content loader
   * @param {Object} firebaseApp - Firebase app instance
   * @param {Object} options - Configuration options
   */
  constructor(firebaseApp = null, options = {}) {
    this.db = firebaseApp ? firebase.firestore(firebaseApp) : null;
    this.currentCollection = null;
    this.currentData = [];
    this.filteredData = [];
    this.filters = {
      search: '',
      mythology: 'all',
      sortBy: 'name'
    };

    // Cache configuration
    this.options = {
      enableCache: options.enableCache !== false,
      cacheOptions: options.cacheOptions || {},
      bypassCache: options.bypassCache || false,
      enableLogging: options.enableLogging || false
    };

    // Initialize cache manager if enabled
    this.cacheManager = null;
    this.versionTracker = null;

    if (this.options.enableCache && typeof FirebaseCacheManager !== 'undefined') {
      this.cacheManager = new FirebaseCacheManager({
        enableLogging: this.options.enableLogging,
        ...this.options.cacheOptions
      });
      console.log('[ContentLoader] Cache manager initialized');
    }

    // Initialize version tracker if available
    if (firebaseApp && typeof VersionTracker !== 'undefined') {
      this.versionTracker = new VersionTracker(firebaseApp, {
        enableLogging: this.options.enableLogging,
        onVersionChange: (newVersion) => {
          console.log('[ContentLoader] Version changed:', newVersion);
          if (this.cacheManager) {
            this.cacheManager.setVersion(newVersion);
          }
        }
      });
    }

    // Content type configurations
    this.contentTypes = {
      deities: {
        collection: 'deities',
        title: 'Deities',
        fields: ['name', 'mythology', 'domain', 'description', 'attributes'],
        badge: 'mythology'
      },
      heroes: {
        collection: 'heroes',
        title: 'Heroes',
        fields: ['name', 'mythology', 'legend', 'description', 'achievements'],
        badge: 'mythology'
      },
      creatures: {
        collection: 'creatures',
        title: 'Mythical Creatures',
        fields: ['name', 'mythology', 'type', 'description', 'abilities'],
        badge: 'type'
      },
      cosmology: {
        collection: 'cosmology',
        title: 'Cosmology',
        fields: ['name', 'mythology', 'realm', 'description', 'significance'],
        badge: 'realm'
      },
      herbs: {
        collection: 'herbs',
        title: 'Sacred Herbs',
        fields: ['name', 'mythology', 'uses', 'description', 'properties'],
        badge: 'mythology'
      },
      rituals: {
        collection: 'rituals',
        title: 'Rituals',
        fields: ['name', 'mythology', 'purpose', 'description', 'steps'],
        badge: 'purpose'
      },
      texts: {
        collection: 'texts',
        title: 'Sacred Texts',
        fields: ['name', 'mythology', 'type', 'description', 'significance'],
        badge: 'type'
      },
      myths: {
        collection: 'myths',
        title: 'Myths & Legends',
        fields: ['name', 'mythology', 'summary', 'description', 'characters'],
        badge: 'mythology'
      },
      concepts: {
        collection: 'concepts',
        title: 'Mystical Concepts',
        fields: ['name', 'mythology', 'category', 'description', 'examples'],
        badge: 'category'
      },
      symbols: {
        collection: 'symbols',
        title: 'Sacred Symbols',
        fields: ['name', 'mythology', 'meaning', 'description', 'usage'],
        badge: 'mythology'
      }
    };
  }

  /**
   * Initialize Firestore connection
   * @param {Object} firebaseApp - Firebase app instance
   */
  initFirestore(firebaseApp) {
    this.db = firebase.firestore(firebaseApp);
    console.log('[ContentLoader] Firestore initialized');

    // Initialize version tracker if not already done
    if (!this.versionTracker && typeof VersionTracker !== 'undefined') {
      this.versionTracker = new VersionTracker(firebaseApp, {
        enableLogging: this.options.enableLogging,
        onVersionChange: (newVersion) => {
          console.log('[ContentLoader] Version changed:', newVersion);
          if (this.cacheManager) {
            this.cacheManager.setVersion(newVersion);
          }
        }
      });
      // Initialize and get current version
      this.versionTracker.initialize().then(version => {
        if (this.cacheManager) {
          this.cacheManager.setVersion(version);
        }
      }).catch(error => {
        console.error('[ContentLoader] Error initializing version tracker:', error);
      });
    }
  }

  /**
   * Load content from Firestore collection
   * @param {string} contentType - Type of content to load
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Array of content items
   */
  async loadContent(contentType, options = {}) {
    if (!this.db) {
      throw new Error('Firestore not initialized. Call initFirestore() first.');
    }

    const config = this.contentTypes[contentType];
    if (!config) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    this.currentCollection = config.collection;
    console.log(`[ContentLoader] Loading ${contentType} from ${config.collection}`);

    try {
      // Show loading state
      this.showLoadingState();

      // Determine if we should use cache
      const useCache = this.options.enableCache &&
                      this.cacheManager &&
                      !this.options.bypassCache &&
                      !options.bypassCache;

      let data;

      if (useCache) {
        // Generate cache key
        const cacheKey = FirebaseCacheManager.generateKey(config.collection, {
          mythology: options.mythology,
          limit: options.limit
        });

        // Try to get from cache or execute query
        data = await this.cacheManager.get(
          cacheKey,
          async () => {
            return await this.executeQuery(config.collection, options);
          },
          {
            ttl: options.cacheTTL || 3600000, // 1 hour default
            tags: [contentType, config.collection]
          }
        );
      } else {
        // Execute query directly
        data = await this.executeQuery(config.collection, options);
      }

      this.currentData = data;
      this.filteredData = data;

      console.log(`[ContentLoader] Loaded ${data.length} items${useCache ? ' (cache-enabled)' : ''}`);

      // Apply initial filters and sort
      this.applyFilters();

      return this.filteredData;

    } catch (error) {
      console.error('[ContentLoader] Error loading content:', error);
      this.showErrorState(error.message);
      throw error;
    }
  }

  /**
   * Execute Firestore query
   * @param {string} collection - Collection name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async executeQuery(collection, options = {}) {
    // Build query
    let query = this.db.collection(collection);

    // Apply filters if provided
    if (options.mythology && options.mythology !== 'all') {
      query = query.where('mythology', '==', options.mythology);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Execute query
    const snapshot = await query.get();

    // Process results
    const data = [];
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return data;
  }

  /**
   * Render content to container
   * @param {string} containerId - ID of container element
   * @param {string} contentType - Type of content being rendered
   */
  renderContent(containerId, contentType) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[ContentLoader] Container not found: ${containerId}`);
      return;
    }

    const config = this.contentTypes[contentType];
    if (!config) {
      console.error(`[ContentLoader] Unknown content type: ${contentType}`);
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Check if we have data
    if (this.filteredData.length === 0) {
      this.showEmptyState(container);
      return;
    }

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'content-grid';

    // Render each item
    this.filteredData.forEach((item, index) => {
      const card = this.createContentCard(item, config);
      card.style.animationDelay = `${index * 0.1}s`;
      grid.appendChild(card);
    });

    // Add "+" card at the end for logged-in users to add new content
    const addCard = this.createAddCard(contentType, config);
    if (addCard) {
      grid.appendChild(addCard);
    }

    container.appendChild(grid);

    console.log(`[ContentLoader] Rendered ${this.filteredData.length} items`);
  }

  /**
   * Create a content card element
   * @param {Object} item - Content item data
   * @param {Object} config - Content type configuration
   * @returns {HTMLElement} Card element
   */
  createContentCard(item, config) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.setAttribute('data-id', item.id);

    // Card Header
    const header = document.createElement('div');
    header.className = 'card-header';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.name || item.title || 'Untitled';

    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = item[config.badge] || 'Unknown';

    header.appendChild(title);
    header.appendChild(badge);

    // Card Body
    const body = document.createElement('div');
    body.className = 'card-body';

    const description = document.createElement('p');
    description.textContent = this.truncateText(
      item.description || item.summary || 'No description available.',
      200
    );

    body.appendChild(description);

    // Note: Mythology field removed as it's redundant on mythology-specific pages

    // Card Footer (Tags)
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    // Add tags based on content type
    this.addCardTags(footer, item, config);

    // Assemble card
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    // Add click handler
    card.addEventListener('click', () => {
      this.onCardClick(item, config);
    });

    return card;
  }

  /**
   * Add tags to card footer
   * @param {HTMLElement} footer - Footer element
   * @param {Object} item - Content item data
   * @param {Object} config - Content type configuration
   */
  addCardTags(footer, item, config) {
    const tagFields = ['domain', 'type', 'category', 'realm', 'purpose'];

    tagFields.forEach(field => {
      if (item[field]) {
        const value = item[field];

        if (Array.isArray(value)) {
          value.slice(0, 3).forEach(v => {
            footer.appendChild(this.createTag(v));
          });
        } else {
          footer.appendChild(this.createTag(value));
        }
      }
    });

    // Limit to max 5 tags
    while (footer.children.length > 5) {
      footer.removeChild(footer.lastChild);
    }
  }

  /**
   * Create a tag element
   * @param {string} text - Tag text
   * @returns {HTMLElement} Tag element
   */
  createTag(text) {
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = text;
    return tag;
  }

  /**
   * Create an "Add New" card for logged-in users
   * @param {string} contentType - Type of content
   * @param {Object} config - Content type configuration
   * @returns {HTMLElement|null} Add card element or null if user not logged in
   */
  createAddCard(contentType, config) {
    // Check if user is logged in via Firebase Auth
    const user = firebase.auth().currentUser;
    if (!user) {
      return null; // Don't show add card if not logged in
    }

    const card = document.createElement('div');
    card.className = 'content-card add-content-card';
    card.setAttribute('data-type', 'add-new');

    card.innerHTML = `
      <div class="add-card-content">
        <div class="add-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div class="add-card-title">Add New ${config.title.slice(0, -1)}</div>
        <div class="add-card-description">Submit your own ${contentType.slice(0, -1)} to the collection</div>
      </div>
    `;

    // Add click handler to open submission form
    card.addEventListener('click', () => {
      this.onAddCardClick(contentType, config);
    });

    return card;
  }

  /**
   * Handle add card click event
   * @param {string} contentType - Type of content
   * @param {Object} config - Content type configuration
   */
  onAddCardClick(contentType, config) {
    console.log('[ContentLoader] Add card clicked for:', contentType);

    // Dispatch custom event that editable-panel-system can listen to
    const event = new CustomEvent('addContentClicked', {
      detail: { contentType, config }
    });
    document.dispatchEvent(event);

    // If editable system is available, use it
    if (window.editableSystem) {
      const dummyPanel = document.createElement('div');
      window.editableSystem.openSubmissionModal(dummyPanel, {
        contentType: contentType.slice(0, -1), // Remove plural 's'
        collection: config.collection
      });
    }
  }

  /**
   * Handle card click event
   * @param {Object} item - Content item data
   * @param {Object} config - Content type configuration
   */
  onCardClick(item, config) {
    console.log('[ContentLoader] Card clicked:', item);

    // Dispatch custom event
    const event = new CustomEvent('contentItemClicked', {
      detail: { item, config }
    });
    document.dispatchEvent(event);

    // Auto-detect and apply theme if themeManager is available
    if (typeof themeManager !== 'undefined' && item.mythology) {
      themeManager.setThemeFromContent(item);
    }
  }

  /**
   * Apply filters to current data
   */
  applyFilters() {
    let filtered = [...this.currentData];

    // Search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(searchLower)) ||
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          (item.summary && item.summary.toLowerCase().includes(searchLower))
        );
      });
    }

    // Mythology filter
    if (this.filters.mythology && this.filters.mythology !== 'all') {
      filtered = filtered.filter(item =>
        item.mythology === this.filters.mythology
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const sortBy = this.filters.sortBy || 'name';

      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';

      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal);
      }

      return aVal - bVal;
    });

    this.filteredData = filtered;
    console.log(`[ContentLoader] Filtered to ${filtered.length} items`);
  }

  /**
   * Set search filter
   * @param {string} searchText - Search query
   */
  setSearchFilter(searchText) {
    this.filters.search = searchText;
    this.applyFilters();
  }

  /**
   * Set mythology filter
   * @param {string} mythology - Mythology type
   */
  setMythologyFilter(mythology) {
    this.filters.mythology = mythology;
    this.applyFilters();
  }

  /**
   * Set sort order
   * @param {string} sortBy - Field to sort by
   */
  setSortOrder(sortBy) {
    this.filters.sortBy = sortBy;
    this.applyFilters();
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const containers = document.querySelectorAll('[data-content-container]');

    containers.forEach(container => {
      container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading content...</div>
        </div>
      `;
    });
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showErrorState(message) {
    const containers = document.querySelectorAll('[data-content-container]');

    containers.forEach(container => {
      container.innerHTML = `
        <div class="error-container">
          <div class="error-title">Error Loading Content</div>
          <div class="error-message">${this.escapeHtml(message)}</div>
          <button class="glass-btn glass-btn-primary mt-3" onclick="location.reload()">
            Retry
          </button>
        </div>
      `;
    });
  }

  /**
   * Show empty state
   * @param {HTMLElement} container - Container element
   */
  showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📜</div>
        <div class="empty-state-title">No Content Found</div>
        <div class="empty-state-message">
          Try adjusting your filters or search terms.
        </div>
      </div>
    `;
  }

  /**
   * Show skeleton loading cards
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of skeleton cards
   */
  showSkeletonCards(container, count = 6) {
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'content-grid';

    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'content-card';
      card.innerHTML = `
        <div class="card-header">
          <div class="skeleton skeleton-title"></div>
        </div>
        <div class="card-body">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      `;
      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  /**
   * Setup filter controls
   * @param {Object} options - Filter setup options
   */
  setupFilters(options = {}) {
    // Search input
    if (options.searchInputId) {
      const searchInput = document.getElementById(options.searchInputId);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.setSearchFilter(e.target.value);
          this.renderContent(options.containerId, options.contentType);
        });
      }
    }

    // Mythology select
    if (options.mythologySelectId) {
      const mythologySelect = document.getElementById(options.mythologySelectId);
      if (mythologySelect) {
        mythologySelect.addEventListener('change', (e) => {
          this.setMythologyFilter(e.target.value);
          this.renderContent(options.containerId, options.contentType);
        });
      }
    }

    // Sort select
    if (options.sortSelectId) {
      const sortSelect = document.getElementById(options.sortSelectId);
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.setSortOrder(e.target.value);
          this.renderContent(options.containerId, options.contentType);
        });
      }
    }

    console.log('[ContentLoader] Filters setup complete');
  }

  /**
   * Create filter controls UI
   * @param {string} contentType - Content type
   * @returns {HTMLElement} Filter controls element
   */
  createFilterControls(contentType) {
    const controls = document.createElement('div');
    controls.className = 'controls-bar';

    // Search
    const searchGroup = document.createElement('div');
    searchGroup.className = 'filter-group';
    searchGroup.innerHTML = `
      <label class="filter-label" for="search-input">Search:</label>
      <input
        type="text"
        id="search-input"
        class="glass-input"
        placeholder="Search ${this.contentTypes[contentType]?.title || 'content'}..."
      />
    `;

    // Mythology filter
    const mythologyGroup = document.createElement('div');
    mythologyGroup.className = 'filter-group';
    mythologyGroup.innerHTML = `
      <label class="filter-label" for="mythology-select">Mythology:</label>
      <select id="mythology-select" class="glass-select">
        <option value="all">All Mythologies</option>
        <option value="greek">Greek</option>
        <option value="egyptian">Egyptian</option>
        <option value="norse">Norse</option>
        <option value="hindu">Hindu</option>
        <option value="buddhist">Buddhist</option>
        <option value="christian">Christian</option>
        <option value="islamic">Islamic</option>
        <option value="celtic">Celtic</option>
      </select>
    `;

    // Sort
    const sortGroup = document.createElement('div');
    sortGroup.className = 'filter-group';
    sortGroup.innerHTML = `
      <label class="filter-label" for="sort-select">Sort By:</label>
      <select id="sort-select" class="glass-select">
        <option value="name">Name</option>
        <option value="mythology">Mythology</option>
      </select>
    `;

    controls.appendChild(searchGroup);
    controls.appendChild(mythologyGroup);
    controls.appendChild(sortGroup);

    return controls;
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get current filtered data
   * @returns {Array} Filtered data array
   */
  getData() {
    return this.filteredData;
  }

  /**
   * Get content count
   * @returns {Object} Count information
   */
  getCount() {
    return {
      total: this.currentData.length,
      filtered: this.filteredData.length
    };
  }

  /**
   * Clear all data and filters
   */
  clear() {
    this.currentData = [];
    this.filteredData = [];
    this.filters = {
      search: '',
      mythology: 'all',
      sortBy: 'name'
    };
    console.log('[ContentLoader] Data cleared');
  }

  /**
   * Enable cache bypass for next query
   * @param {boolean} bypass - Whether to bypass cache
   */
  setBypassCache(bypass = true) {
    this.options.bypassCache = bypass;
    console.log(`[ContentLoader] Cache bypass ${bypass ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get cache statistics
   * @returns {Object|null} Cache statistics
   */
  getCacheStats() {
    if (!this.cacheManager) {
      return null;
    }
    return this.cacheManager.getStats();
  }

  /**
   * Get cache entries
   * @returns {Array|null} Cache entries
   */
  getCacheEntries() {
    if (!this.cacheManager) {
      return null;
    }
    return this.cacheManager.getCacheEntries();
  }

  /**
   * Clear cache for specific content type
   * @param {string} contentType - Content type to clear
   */
  clearCache(contentType = null) {
    if (!this.cacheManager) {
      console.warn('[ContentLoader] Cache manager not available');
      return;
    }

    if (contentType) {
      this.cacheManager.invalidateByTag(contentType);
      console.log(`[ContentLoader] Cache cleared for: ${contentType}`);
    } else {
      this.cacheManager.invalidateAll();
      console.log('[ContentLoader] All cache cleared');
    }
  }

  /**
   * Get version information
   * @returns {Promise<Object|null>} Version stats
   */
  async getVersionInfo() {
    if (!this.versionTracker) {
      return null;
    }
    return await this.versionTracker.getStats();
  }

  /**
   * Force version check
   * @returns {Promise<boolean>} Whether version changed
   */
  async checkVersion() {
    if (!this.versionTracker) {
      return false;
    }
    return await this.versionTracker.checkForUpdates();
  }

  /**
   * Increment version (admin use)
   * @param {Object} metadata - Update metadata
   * @returns {Promise<number>} New version
   */
  async incrementVersion(metadata = {}) {
    if (!this.versionTracker) {
      throw new Error('Version tracker not available');
    }
    return await this.versionTracker.incrementVersion(metadata);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseContentLoader;
}

// ES6 export for use with import statements
if (typeof window !== 'undefined') {
  window.FirebaseContentLoader = FirebaseContentLoader;
}

export { FirebaseContentLoader };

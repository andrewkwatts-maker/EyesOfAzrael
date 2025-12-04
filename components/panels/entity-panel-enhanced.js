/**
 * Enhanced Entity Panel Component with Corpus Search Integration
 *
 * Extends the basic entity panel with:
 * - Integrated corpus search for contextual references
 * - Collapsible corpus sections
 * - Multilingual translation support
 * - Automatic entity name translation for non-English corpus texts
 */

class EnhancedEntityPanel {
  constructor(config) {
    this.entityId = config.entityId;
    this.entityType = config.entityType;
    this.displayMode = config.displayMode || 'full'; // 'full', 'compact', 'mini'
    this.mythology = config.mythology;
    this.container = config.container;
    this.showCorpusIntegration = config.showCorpusIntegration !== false; // default true
    this.autoLoadCorpus = config.autoLoadCorpus === true; // default false

    this.data = null;
    this.corpusResults = null;
    this.corpusLoading = false;
    this.translationCache = new Map();
  }

  /**
   * Load entity data and optionally corpus references
   */
  async load() {
    try {
      // Load entity data
      const entityPath = `/data/entities/${this.entityType}/${this.entityId}.json`;
      const response = await fetch(entityPath);

      if (!response.ok) {
        throw new Error(`Entity not found: ${this.entityId}`);
      }

      this.data = await response.json();

      // Render the panel
      this.render();

      // Auto-load corpus if requested
      if (this.autoLoadCorpus && this.showCorpusIntegration) {
        await this.loadCorpusReferences();
      }
    } catch (error) {
      console.error('Error loading entity:', error);
      this.renderError(error);
    }
  }

  /**
   * Render the entity panel
   */
  render() {
    if (!this.container) {
      console.error('No container specified for entity panel');
      return;
    }

    const element = typeof this.container === 'string'
      ? document.querySelector(this.container)
      : this.container;

    if (!element) {
      console.error('Container element not found:', this.container);
      return;
    }

    // Filter data by mythology if specified
    let contextData = this.data;
    if (this.mythology && this.data.mythologyContexts) {
      const mythContext = this.data.mythologyContexts.find(
        ctx => ctx.mythology === this.mythology
      );
      if (mythContext) {
        contextData = { ...this.data, mythologyContext: mythContext };
      }
    }

    // Render based on display mode
    let html = '';
    switch (this.displayMode) {
      case 'mini':
        html = this.renderMini(contextData);
        break;
      case 'compact':
        html = this.renderCompact(contextData);
        break;
      case 'full':
      default:
        html = this.renderFull(contextData);
        break;
    }

    element.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners(element);
  }

  /**
   * Render mini display (inline reference)
   */
  renderMini(data) {
    return `
      <span class="entity-mini" data-entity-id="${this.entityId}">
        <span class="entity-icon">${data.icon || '📖'}</span>
        <span class="entity-name">${data.name}</span>
      </span>
    `;
  }

  /**
   * Render compact display (card view)
   */
  renderCompact(data) {
    const mythology = data.primaryMythology || (data.mythologies && data.mythologies[0]);

    return `
      <div class="entity-card entity-card-compact" data-entity-id="${this.entityId}">
        <div class="entity-card-header">
          <span class="entity-icon">${data.icon || '📖'}</span>
          <h3 class="entity-name">${data.name}</h3>
          ${mythology ? `<span class="entity-badge mythology-${mythology}">${mythology}</span>` : ''}
        </div>
        <p class="entity-description">${data.shortDescription || data.longDescription?.substring(0, 150) + '...' || ''}</p>
        ${this.showCorpusIntegration ? `
          <button class="corpus-toggle-btn" data-entity-id="${this.entityId}">
            <span class="icon">📚</span> Show Ancient References
          </button>
          <div class="corpus-section" id="corpus-${this.entityId}" style="display: none;"></div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render full display (detailed page)
   */
  renderFull(data) {
    const context = data.mythologyContext || (data.mythologyContexts && data.mythologyContexts[0]);

    return `
      <article class="entity-panel entity-panel-full" data-entity-id="${this.entityId}">
        <!-- Header -->
        <header class="entity-header">
          <div class="entity-header-content">
            <span class="entity-icon-large">${data.icon || '📖'}</span>
            <div>
              <h1 class="entity-title">${data.name}</h1>
              <div class="entity-meta">
                ${this.renderMythologyBadges(data.mythologies)}
                ${data.category ? `<span class="category-badge">${data.category}</span>` : ''}
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <div class="entity-content">
          ${data.shortDescription ? `
            <div class="entity-section">
              <p class="entity-lead">${data.shortDescription}</p>
            </div>
          ` : ''}

          ${data.longDescription ? `
            <div class="entity-section">
              <p>${data.longDescription}</p>
            </div>
          ` : ''}

          ${context ? this.renderMythologyContext(context) : ''}
          ${data.characteristics ? this.renderCharacteristics(data.characteristics) : ''}
          ${data.metaphysicalProperties ? this.renderMetaphysicalProperties(data.metaphysicalProperties) : ''}
          ${data.archetypes && data.archetypes.length > 0 ? this.renderArchetypes(data.archetypes) : ''}
          ${data.relatedEntities ? this.renderRelatedEntities(data.relatedEntities) : ''}
          ${data.crossCulturalParallels ? this.renderCrossParallels(data.crossCulturalParallels) : ''}

          <!-- Corpus Integration Section -->
          ${this.showCorpusIntegration ? this.renderCorpusSection() : ''}
        </div>
      </article>
    `;
  }

  /**
   * Render mythology badges
   */
  renderMythologyBadges(mythologies) {
    if (!mythologies || !Array.isArray(mythologies)) return '';

    return mythologies.map(myth =>
      `<span class="entity-badge mythology-${myth}">${myth}</span>`
    ).join('');
  }

  /**
   * Render mythology context section
   */
  renderMythologyContext(context) {
    return `
      <div class="entity-section mythology-context">
        <h2>Cultural Context - ${context.mythology.charAt(0).toUpperCase() + context.mythology.slice(1)}</h2>
        ${context.culturalSignificance ? `
          <div class="context-item">
            <h3>Cultural Significance</h3>
            <p>${context.culturalSignificance}</p>
          </div>
        ` : ''}
        ${context.usage ? `
          <div class="context-item">
            <h3>Usage</h3>
            <p>${context.usage}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render characteristics section
   */
  renderCharacteristics(characteristics) {
    let html = '<div class="entity-section characteristics"><h2>Characteristics</h2>';

    for (const [key, value] of Object.entries(characteristics)) {
      if (Array.isArray(value)) {
        html += `
          <div class="characteristic-item">
            <h3>${this.formatLabel(key)}</h3>
            <ul>${value.map(v => `<li>${v}</li>`).join('')}</ul>
          </div>
        `;
      } else {
        html += `
          <div class="characteristic-item">
            <h3>${this.formatLabel(key)}</h3>
            <p>${value}</p>
          </div>
        `;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render metaphysical properties
   */
  renderMetaphysicalProperties(props) {
    return `
      <div class="entity-section metaphysical-properties">
        <h2>Metaphysical Properties</h2>
        ${props.primaryElement ? `<p><strong>Element:</strong> ${props.primaryElement}</p>` : ''}
        ${props.secondaryElements ? `<p><strong>Secondary Elements:</strong> ${props.secondaryElements.join(', ')}</p>` : ''}
        ${props.sefirot ? `<p><strong>Sefirot:</strong> ${props.sefirot.join(', ')}</p>` : ''}
        ${props.world ? `<p><strong>World:</strong> ${props.world}</p>` : ''}
        ${props.polarity ? `<p><strong>Polarity:</strong> ${props.polarity}</p>` : ''}
      </div>
    `;
  }

  /**
   * Render archetypes section
   */
  renderArchetypes(archetypes) {
    return `
      <div class="entity-section archetypes">
        <h2>Universal Archetypes</h2>
        <div class="archetype-grid">
          ${archetypes.map(arch => `
            <div class="archetype-card">
              <div class="archetype-header">
                <h3>${this.formatLabel(arch.category)}</h3>
                <span class="archetype-score score-${arch.strength}">${arch.score}/100</span>
              </div>
              ${arch.analysis ? `<p class="archetype-analysis">${arch.analysis.substring(0, 200)}...</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render related entities
   */
  renderRelatedEntities(related) {
    let html = '<div class="entity-section related-entities"><h2>Related Entities</h2>';

    for (const [category, entities] of Object.entries(related)) {
      if (entities && entities.length > 0) {
        html += `
          <div class="related-category">
            <h3>${this.formatLabel(category)}</h3>
            <ul class="related-list">
              ${entities.map(entity => `
                <li>
                  <a href="/data/entities/${category}/${entity.id}.html" class="entity-link">
                    ${entity.name || entity.id}
                  </a>
                  ${entity.relationship ? `<span class="relationship-note">- ${entity.relationship}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render cross-cultural parallels
   */
  renderCrossParallels(parallels) {
    return `
      <div class="entity-section cross-parallels">
        <h2>Cross-Cultural Parallels</h2>
        <div class="parallels-grid">
          ${parallels.map(parallel => `
            <div class="parallel-card">
              <h3>${parallel.tradition} - ${parallel.entity}</h3>
              <p><strong>Similarity:</strong> ${parallel.similarity}</p>
              ${parallel.difference ? `<p><strong>Difference:</strong> ${parallel.difference}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render corpus integration section
   */
  renderCorpusSection() {
    return `
      <div class="entity-section corpus-integration">
        <div class="corpus-header">
          <h2>📚 Ancient Text References</h2>
          <button class="corpus-load-btn" data-entity-id="${this.entityId}">
            Load References from Ancient Texts
          </button>
        </div>
        <div class="corpus-results" id="corpus-results-${this.entityId}">
          <div class="corpus-placeholder">
            <p>Click above to search ancient texts for references to <strong>${this.data?.name}</strong></p>
            <p class="corpus-note">Searches will automatically translate entity names to the original language of each text.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for interactive elements
   */
  attachEventListeners(element) {
    // Corpus toggle buttons (compact mode)
    const toggleBtns = element.querySelectorAll('.corpus-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const entityId = btn.dataset.entityId;
        const corpusSection = element.querySelector(`#corpus-${entityId}`);

        if (corpusSection.style.display === 'none') {
          corpusSection.style.display = 'block';
          btn.textContent = '📚 Hide Ancient References';

          if (!this.corpusResults) {
            await this.loadCorpusReferences(corpusSection);
          }
        } else {
          corpusSection.style.display = 'none';
          btn.innerHTML = '<span class="icon">📚</span> Show Ancient References';
        }
      });
    });

    // Corpus load button (full mode)
    const loadBtns = element.querySelectorAll('.corpus-load-btn');
    loadBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const entityId = btn.dataset.entityId;
        const resultsContainer = element.querySelector(`#corpus-results-${entityId}`);

        btn.disabled = true;
        btn.textContent = 'Loading...';

        await this.loadCorpusReferences(resultsContainer);

        btn.style.display = 'none';
      });
    });
  }

  /**
   * Load corpus references for this entity
   */
  async loadCorpusReferences(targetContainer) {
    if (this.corpusLoading) return;

    this.corpusLoading = true;
    const container = targetContainer || document.querySelector(`#corpus-results-${this.entityId}`);

    if (!container) {
      console.error('Corpus results container not found');
      this.corpusLoading = false;
      return;
    }

    try {
      // Show loading state
      container.innerHTML = `
        <div class="corpus-loading">
          <div class="loading-spinner"></div>
          <p>Searching ancient texts...</p>
          <p class="loading-note">Translating entity name and searching across ${this.data.mythologies?.length || 1} tradition(s)</p>
        </div>
      `;

      // Get search terms (entity name + aliases)
      const searchTerms = this.getSearchTerms();

      // Load corpus configuration for mythology
      const corpusConfig = await this.loadCorpusConfig();

      // Perform search with translation
      const results = await this.searchCorpusWithTranslation(searchTerms, corpusConfig);

      // Render results
      this.corpusResults = results;
      this.renderCorpusResults(container, results);

    } catch (error) {
      console.error('Error loading corpus references:', error);
      container.innerHTML = `
        <div class="corpus-error">
          <p>⚠️ Could not load references: ${error.message}</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    } finally {
      this.corpusLoading = false;
    }
  }

  /**
   * Get search terms for corpus search
   */
  getSearchTerms() {
    const terms = [this.data.name];

    // Add alternative names
    if (this.data.alternativeNames) {
      terms.push(...this.data.alternativeNames);
    }

    // Add context-specific names
    if (this.mythology && this.data.mythologyContexts) {
      const context = this.data.mythologyContexts.find(c => c.mythology === this.mythology);
      if (context && context.localName) {
        terms.push(context.localName);
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Load corpus configuration for mythology
   */
  async loadCorpusConfig() {
    const mythology = this.mythology || this.data.primaryMythology;

    if (!mythology) {
      throw new Error('No mythology specified for corpus search');
    }

    const configPath = `/mythos/${mythology}/corpus-config.json`;
    const response = await fetch(configPath);

    if (!response.ok) {
      throw new Error(`Corpus config not found for ${mythology}`);
    }

    return await response.json();
  }

  /**
   * Search corpus with automatic translation
   */
  async searchCorpusWithTranslation(searchTerms, corpusConfig) {
    const results = {
      total: 0,
      bySource: []
    };

    // Get enabled repositories
    const enabledRepos = corpusConfig.repositories.filter(
      repo => repo.enabled_by_default !== false
    );

    for (const repo of enabledRepos) {
      for (const file of repo.files) {
        const fileLanguage = file.language;

        // Translate search terms to file language if needed
        let translatedTerms = searchTerms;
        if (fileLanguage !== 'en' && corpusConfig.translation_settings?.enabled) {
          translatedTerms = await this.translateSearchTerms(
            searchTerms,
            fileLanguage,
            corpusConfig.translation_settings
          );
        }

        // Search in corpus (mock implementation - replace with actual search)
        const fileResults = await this.searchInCorpusFile(
          repo,
          file,
          translatedTerms,
          searchTerms // Keep original for display
        );

        if (fileResults && fileResults.matches > 0) {
          results.bySource.push(fileResults);
          results.total += fileResults.matches;
        }
      }
    }

    return results;
  }

  /**
   * Translate search terms to target language
   */
  async translateSearchTerms(terms, targetLanguage, translationSettings) {
    const cacheKey = `${terms.join('|')}:${targetLanguage}`;

    // Check cache
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    const translated = [];

    for (const term of terms) {
      try {
        // Use MyMemory Translation API
        const url = `${translationSettings.api_url}?q=${encodeURIComponent(term)}&langpair=en|${targetLanguage}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData) {
          translated.push(data.responseData.translatedText);
        } else {
          // Fallback to original term
          translated.push(term);
        }
      } catch (error) {
        console.warn(`Translation failed for ${term}:`, error);
        translated.push(term);
      }
    }

    // Cache results
    this.translationCache.set(cacheKey, translated);
    return translated;
  }

  /**
   * Search in a specific corpus file (mock implementation)
   */
  async searchInCorpusFile(repo, file, translatedTerms, originalTerms) {
    // This is a mock implementation
    // In production, this would fetch and search the actual corpus file

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock results (0-10 random matches)
    const matches = Math.floor(Math.random() * 11);

    if (matches === 0) return null;

    return {
      repository: repo.name,
      file: file.display,
      language: file.language,
      matches: matches,
      searchedTerms: translatedTerms,
      originalTerms: originalTerms,
      excerpts: Array(Math.min(matches, 3)).fill(null).map((_, i) => ({
        text: `Mock excerpt ${i + 1} containing references to ${originalTerms[0]}...`,
        reference: `Book ${i + 1}, Chapter ${Math.floor(Math.random() * 20) + 1}`
      }))
    };
  }

  /**
   * Render corpus search results
   */
  renderCorpusResults(container, results) {
    if (results.total === 0) {
      container.innerHTML = `
        <div class="corpus-no-results">
          <p>No references found in the enabled ancient texts.</p>
          <p class="note">Try searching manually in the <a href="./corpus-search.html">corpus search tool</a>.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="corpus-results-summary">
        <p><strong>${results.total} references</strong> found across <strong>${results.bySource.length} ancient texts</strong></p>
      </div>
      <div class="corpus-results-list">
    `;

    results.bySource.forEach(source => {
      html += `
        <details class="corpus-source-result" open>
          <summary class="corpus-source-header">
            <strong>${source.file}</strong>
            <span class="match-count">${source.matches} ${source.matches === 1 ? 'reference' : 'references'}</span>
          </summary>
          <div class="corpus-source-content">
            ${source.language !== 'en' ? `
              <p class="translation-note">
                <span class="icon">🌐</span> Searched for: ${source.searchedTerms.join(', ')} (auto-translated to ${source.language})
              </p>
            ` : ''}
            <div class="corpus-excerpts">
              ${source.excerpts.map(excerpt => `
                <div class="corpus-excerpt">
                  <p class="excerpt-text">"${excerpt.text}"</p>
                  <p class="excerpt-ref">— ${excerpt.reference}</p>
                </div>
              `).join('')}
            </div>
            <a href="./corpus-search.html?term=${encodeURIComponent(source.originalTerms[0])}&source=${source.repository}" class="view-all-link">
              View all ${source.matches} references →
            </a>
          </div>
        </details>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Render error state
   */
  renderError(error) {
    const element = typeof this.container === 'string'
      ? document.querySelector(this.container)
      : this.container;

    if (element) {
      element.innerHTML = `
        <div class="entity-error">
          <p class="error-message">Error loading entity: ${error.message}</p>
        </div>
      `;
    }
  }

  /**
   * Format label (camelCase to Title Case)
   */
  formatLabel(label) {
    return label
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/-/g, ' ');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedEntityPanel;
}

/**
 * Generic Corpus Search UI
 * Reusable across all mythos corpus search pages
 */

let corpusSearch;
let metadataIntegration;
const CONFIG_PATH = 'corpus-config.json';

// Check for URL parameters (deep linking)
const urlParams = new URLSearchParams(window.location.search);
const autoSearchTerm = urlParams.get('term');
const autoRepo = urlParams.get('repo');

// Allow custom parsers to be set before initialization
window.CUSTOM_CORPUS_PARSERS = window.CUSTOM_CORPUS_PARSERS || {};

// Metadata integration settings
window.ENABLE_METADATA_SEARCH = window.ENABLE_METADATA_SEARCH !== false; // Default enabled

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Use custom parsers if available (set by page-specific scripts)
        const customParsers = window.CUSTOM_CORPUS_PARSERS || {};
        corpusSearch = new CorpusSearch(CONFIG_PATH, customParsers);
        await corpusSearch.init();

        // Initialize metadata integration if enabled and available
        if (window.ENABLE_METADATA_SEARCH &&
            typeof CorpusMetadataIntegration !== 'undefined' &&
            typeof AlternateNameIndex !== 'undefined') {
            try {
                metadataIntegration = await corpusSearch.enableMetadataIntegration({
                    loadCrossCulturalMap: true
                });
                if (metadataIntegration) {
                    console.log('Metadata integration enabled:', metadataIntegration.getStats());
                    showMetadataToggle();
                }
            } catch (e) {
                console.warn('Metadata integration failed:', e);
            }
        }

        renderRepositories();
        setupEventListeners();

        // Auto-load if URL parameters present
        if (autoSearchTerm && autoRepo) {
            autoLoadAndSearch();
        }
    } catch (error) {
        showError('Initialization Failed', error.message);
    }
});

// Auto-load and search from URL parameters
async function autoLoadAndSearch() {
    const checkbox = document.querySelector(`input[data-repo-id="${autoRepo}"]`);
    if (checkbox) {
        checkbox.checked = true;
        updateSelectedState();
        await loadRepositories();
        document.getElementById('search-term').value = autoSearchTerm;
        setTimeout(() => performSearch(), 500);
    }
}

// Render repository checkboxes (with category support)
function renderRepositories() {
    const repoList = document.getElementById('repo-list');
    const repos = corpusSearch.getRepositories();

    // Group repositories by category
    const categorized = {};
    const uncategorized = [];

    repos.forEach(repo => {
        if (repo.category) {
            if (!categorized[repo.category]) {
                categorized[repo.category] = [];
            }
            categorized[repo.category].push(repo);
        } else {
            uncategorized.push(repo);
        }
    });

    // Render categorized repositories
    Object.keys(categorized).sort().forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'repo-category';

        const categoryHeader = document.createElement('h4');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category;
        categorySection.appendChild(categoryHeader);

        categorized[category].forEach(repo => {
            categorySection.appendChild(createRepoItem(repo));
        });

        repoList.appendChild(categorySection);
    });

    // Render uncategorized repositories
    uncategorized.forEach(repo => {
        repoList.appendChild(createRepoItem(repo));
    });

    updateSelectedState();
}

// Create repository item element
function createRepoItem(repo) {
    const file = repo.files[0];
    const repoItem = document.createElement('div');
    repoItem.className = 'repo-item';
    repoItem.innerHTML = `
        <input
            type="checkbox"
            id="repo-${repo.id}"
            data-repo-id="${repo.id}"
            ${repo.enabled_by_default ? 'checked' : ''}
        >
        <label for="repo-${repo.id}">
            <strong>${file.display}</strong>
            <span class="repo-details">
                ${file.description} <span class="separator">•</span> ${file.language.toUpperCase()}
                ${file.size_mb ? ` <span class="separator">•</span> <span class="repo-size">${file.size_mb} MB</span>` : ''}
            </span>
        </label>
    `;

    const checkbox = repoItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', updateSelectedState);
    repoItem.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            updateSelectedState();
        }
    });

    return repoItem;
}

// Update UI based on selection
function updateSelectedState() {
    const checkboxes = document.querySelectorAll('.repo-list input[type="checkbox"]');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const loadBtn = document.getElementById('load-repos-btn');

    loadBtn.disabled = selectedCount === 0;
    loadBtn.textContent = selectedCount > 0
        ? `Load ${selectedCount} Text${selectedCount > 1 ? 's' : ''}`
        : 'Load Selected Texts';

    checkboxes.forEach(cb => {
        const repoItem = cb.closest('.repo-item');
        if (cb.checked) {
            repoItem.classList.add('selected');
        } else {
            repoItem.classList.remove('selected');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('load-repos-btn').addEventListener('click', loadRepositories);

    document.getElementById('select-all-btn').addEventListener('click', () => {
        document.querySelectorAll('.repo-list input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        updateSelectedState();
    });

    document.getElementById('clear-selection-btn').addEventListener('click', () => {
        document.querySelectorAll('.repo-list input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        updateSelectedState();
    });

    document.getElementById('search-btn').addEventListener('click', performSearch);

    document.getElementById('search-term').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Load selected repositories
async function loadRepositories() {
    const selectedIds = Array.from(
        document.querySelectorAll('.repo-list input[type="checkbox"]:checked')
    ).map(cb => cb.dataset.repoId);

    if (selectedIds.length === 0) {
        showError('No Selection', 'Please select at least one text to load.');
        return;
    }

    const loadingStatus = document.getElementById('loading-status');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const statusText = document.getElementById('status-text');
    const loadBtn = document.getElementById('load-repos-btn');

    loadingStatus.classList.remove('hidden');
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';

    try {
        await corpusSearch.loadSelectedRepos(selectedIds, {
            onProgress: (progress) => {
                const percent = progress.percentage;
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
                statusText.textContent = `Loading ${progress.fileName}... (${progress.current + 1}/${progress.total})`;
            },
            onComplete: (result) => {
                loadingStatus.classList.add('hidden');
                document.getElementById('search-interface').classList.remove('hidden');
                updateStats();
                showSuccess(`Successfully loaded ${result.totalLoaded} text${result.totalLoaded > 1 ? 's' : ''}!`);
                document.getElementById('search-interface').scrollIntoView({ behavior: 'smooth' });
            },
            onError: (error) => {
                console.error('Load error:', error);
            }
        });
    } catch (error) {
        loadingStatus.classList.add('hidden');
        loadBtn.disabled = false;
        loadBtn.textContent = `Load ${selectedIds.length} Text${selectedIds.length > 1 ? 's' : ''}`;
        showError('Loading Failed', error.message);
    }
}

// Perform search
async function performSearch() {
    const searchTerm = document.getElementById('search-term').value.trim();
    if (!searchTerm) {
        showError('Empty Search', 'Please enter a search term.');
        return;
    }

    const caseSensitive = document.getElementById('case-sensitive').checked;
    const maxResults = parseInt(document.getElementById('max-results').value) || 100;
    const useMetadata = document.getElementById('use-metadata')?.checked || false;
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('search-results');
    const resultsSummary = document.getElementById('results-summary');

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    resultsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">Searching...</p>';

    try {
        const results = await corpusSearch.search(searchTerm, {
            caseSensitive,
            maxResults,
            useMetadata
        });

        resultsContainer.innerHTML = '';
        resultsSummary.classList.remove('hidden');

        // Show expanded terms if metadata was used
        let summaryText = `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${searchTerm}"`;
        if (useMetadata && metadataIntegration && results.length > 0) {
            const annotation = results[0].metadata?.entityAnnotation;
            if (annotation && annotation.expandedTerms && annotation.expandedTerms.length > 1) {
                const otherTerms = annotation.expandedTerms.filter(t => t !== searchTerm);
                if (otherTerms.length > 0) {
                    summaryText += ` <span class="expanded-terms">(including: ${otherTerms.join(', ')})</span>`;
                }
            }
        }
        resultsSummary.innerHTML = summaryText;

        if (results.length === 0) {
            let noResultsHtml = `
                <p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
                    No results found. Try a different search term or load more texts.
                </p>
            `;

            // Show alternate suggestions if metadata is available
            if (useMetadata && metadataIntegration) {
                const suggestions = metadataIntegration.getAlternateSuggestions(searchTerm, { limit: 5 });
                if (suggestions.length > 0) {
                    noResultsHtml += '<div class="suggestions-box">';
                    noResultsHtml += '<h4>Try searching for:</h4><ul>';
                    suggestions.forEach(sug => {
                        noResultsHtml += `<li><a href="#" onclick="searchSuggestion('${sug.term.replace(/'/g, "\\'")}'); return false;">${sug.term}</a>`;
                        if (sug.entity) {
                            noResultsHtml += ` <span class="suggestion-context">(${sug.type}: ${sug.entity})</span>`;
                        }
                        noResultsHtml += '</li>';
                    });
                    noResultsHtml += '</ul></div>';
                }
            }

            resultsContainer.innerHTML = noResultsHtml;
        } else {
            results.forEach(result => {
                const resultEl = createResultElement(result, searchTerm, useMetadata);
                resultsContainer.appendChild(resultEl);
            });
        }

        document.getElementById('stat-last-search').textContent = results.length;

    } catch (error) {
        showError('Search Failed', error.message);
        resultsContainer.innerHTML = '';
        resultsSummary.classList.add('hidden');
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
    }
}

// Search for a suggested term
function searchSuggestion(term) {
    document.getElementById('search-term').value = term;
    performSearch();
}

// Create result element
function createResultElement(result, searchTerm, useMetadata = false) {
    const div = document.createElement('div');
    div.className = 'search-result-item';

    const highlightedText = highlightTerm(result.full_verse, result.matched_term);

    let metadataHtml = '';

    // Add metadata annotation if available
    if (useMetadata && result.metadata?.entityAnnotation) {
        const annotation = result.metadata.entityAnnotation;

        // Show if matched via alternate name
        if (annotation.matchedViaAlternate) {
            metadataHtml += `<div class="result-metadata">
                <span class="metadata-badge">Matched: "${result.matched_term}"</span>`;

            if (annotation.entityMetadata) {
                const entity = annotation.entityMetadata;
                metadataHtml += ` <span class="metadata-entity">Entity: ${entity.primaryName}</span>`;

                if (entity.mythology) {
                    metadataHtml += ` <span class="metadata-mythology">${entity.mythology}</span>`;
                }

                // Show alternate names
                if (entity.matchedVariants && entity.matchedVariants.length > 0) {
                    const altNames = entity.matchedVariants
                        .filter(v => v.name !== entity.primaryName)
                        .map(v => v.name)
                        .slice(0, 3);
                    if (altNames.length > 0) {
                        metadataHtml += ` <span class="metadata-alternates">Also: ${altNames.join(', ')}</span>`;
                    }
                }
            }

            metadataHtml += '</div>';
        }

        // Show cross-cultural equivalents
        if (annotation.crossCulturalEquivalents && annotation.crossCulturalEquivalents.length > 0) {
            metadataHtml += `<div class="result-cross-cultural">
                <span class="cross-cultural-label">Cross-cultural equivalents:</span>
                ${annotation.crossCulturalEquivalents.map(eq => `<span class="cross-cultural-name">${eq}</span>`).join(' ')}
            </div>`;
        }
    }

    div.innerHTML = `
        <div class="result-header">
            <span class="result-citation">${result.text_name}</span>
            <span class="result-corpus">[${result.corpus_name}]</span>
        </div>
        <div class="result-text">${highlightedText}</div>
        ${metadataHtml}
        ${result.url ? `<div class="result-link"><a href="${result.url}" target="_blank" rel="noopener">View source →</a></div>` : ''}
    `;

    return div;
}

// Highlight search term
function highlightTerm(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Update statistics
function updateStats() {
    const stats = corpusSearch.getStats();
    document.getElementById('stat-loaded-texts').textContent = stats.loadedTexts;
    document.getElementById('stat-cache-size').textContent = `${stats.cacheSize} KB`;

    // Update additional stats if elements exist
    const cacheHitEl = document.getElementById('stat-cache-hits');
    const cacheRateEl = document.getElementById('stat-cache-rate');
    const localStorageEl = document.getElementById('stat-localStorage');
    const sessionStorageEl = document.getElementById('stat-sessionStorage');

    if (cacheHitEl) cacheHitEl.textContent = stats.cacheHits;
    if (cacheRateEl) cacheRateEl.textContent = `${stats.cacheHitRate}%`;
    if (localStorageEl) localStorageEl.textContent = `${stats.localStorageUsed} KB`;
    if (sessionStorageEl) sessionStorageEl.textContent = `${stats.sessionStorageUsed} KB`;
}

// Clear cache function (exposed globally)
function clearCorpusCache() {
    if (corpusSearch) {
        corpusSearch.clearCache();
        updateStats();
        showSuccess('Cache cleared successfully! Files will be re-downloaded on next search.');
    }
}

// Show error message
function showError(title, message) {
    const errorContainer = document.getElementById('error-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-content">
            <strong>${title}</strong>
            <p>${message}</p>
            <button onclick="this.closest('.error-message').remove()">Dismiss</button>
        </div>
    `;
    errorContainer.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 10000);
}

// Show success message
function showSuccess(message) {
    const errorContainer = document.getElementById('error-container');
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.background = 'rgba(0, 255, 0, 0.1)';
    successDiv.style.borderColor = 'rgba(0, 255, 0, 0.3)';
    successDiv.innerHTML = `
        <div class="error-icon">✓</div>
        <div class="error-content">
            <strong style="color: #44ff44;">Success</strong>
            <p>${message}</p>
            <button onclick="this.closest('.error-message').remove()">Dismiss</button>
        </div>
    `;
    errorContainer.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

// Show metadata toggle if available
function showMetadataToggle() {
    const searchInterface = document.getElementById('search-interface');
    if (!searchInterface) return;

    const optionsArea = searchInterface.querySelector('.search-options') ||
                       searchInterface.querySelector('.search-controls');
    if (!optionsArea) return;

    // Check if toggle already exists
    if (document.getElementById('use-metadata')) return;

    const toggleHtml = `
        <label class="metadata-toggle">
            <input type="checkbox" id="use-metadata" checked>
            <span>Enhanced search (alternate names & cross-cultural)</span>
        </label>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = toggleHtml;
    optionsArea.appendChild(tempDiv.firstElementChild);
}

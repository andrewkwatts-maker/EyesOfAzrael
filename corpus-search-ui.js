/**
 * Generic Corpus Search UI
 * Reusable across all mythos corpus search pages
 */

let corpusSearch;
const CONFIG_PATH = 'corpus-config.json';

// Check for URL parameters (deep linking)
const urlParams = new URLSearchParams(window.location.search);
const autoSearchTerm = urlParams.get('term');
const autoRepo = urlParams.get('repo');

// Allow custom parsers to be set before initialization
window.CUSTOM_CORPUS_PARSERS = window.CUSTOM_CORPUS_PARSERS || {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Use custom parsers if available (set by page-specific scripts)
        const customParsers = window.CUSTOM_CORPUS_PARSERS || {};
        corpusSearch = new CorpusSearch(CONFIG_PATH, customParsers);
        await corpusSearch.init();
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
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('search-results');
    const resultsSummary = document.getElementById('results-summary');

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    resultsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">Searching...</p>';

    try {
        const results = await corpusSearch.search(searchTerm, {
            caseSensitive,
            maxResults
        });

        resultsContainer.innerHTML = '';
        resultsSummary.classList.remove('hidden');
        resultsSummary.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${searchTerm}"`;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
                    No results found. Try a different search term or load more texts.
                </p>
            `;
        } else {
            results.forEach(result => {
                const resultEl = createResultElement(result, searchTerm);
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

// Create result element
function createResultElement(result, searchTerm) {
    const div = document.createElement('div');
    div.className = 'search-result-item';

    const highlightedText = highlightTerm(result.full_verse, searchTerm);

    div.innerHTML = `
        <div class="result-header">
            <span class="result-citation">${result.text_name}</span>
            <span class="result-corpus">[${result.corpus_name}]</span>
        </div>
        <div class="result-text">${highlightedText}</div>
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

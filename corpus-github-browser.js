/**
 * GitHub Repository Browser for Corpus Search
 * Fetches and caches folder/file structure from GitHub repos
 * Allows dynamic selection of files to search
 */

class GitHubBrowser {
    constructor(options = {}) {
        this.cache = new CorpusCache(options.cachePrefix || 'github_browser_');
        this.cacheDuration = options.cacheDuration || 60 * 60 * 1000; // 1 hour default
        this.token = options.token || null;
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 30000;
        this.listeners = {};
    }

    /**
     * Fetch repository contents from GitHub API
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Path within repository (empty for root)
     * @param {string} branch - Branch name (default: main)
     * @returns {Promise<Array>} - Array of file/folder objects
     */
    async fetchContents(owner, repo, path = '', branch = 'main') {
        const cacheKey = `contents_${owner}_${repo}_${branch}_${path}`;

        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
            this.emit('cacheHit', { key: cacheKey, data: cached });
            return cached;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`Repository or path not found: ${owner}/${repo}/${path}`);
                    }
                    if (response.status === 403) {
                        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                        throw new Error(`GitHub API rate limit exceeded. Resets at: ${new Date(rateLimitReset * 1000).toLocaleString()}`);
                    }
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const data = await response.json();
                const contents = Array.isArray(data) ? data : [data];

                // Cache the result
                this.cache.set(cacheKey, contents, this.cacheDuration);
                this.emit('fetchSuccess', { url, contents });

                return contents;
            } catch (error) {
                if (attempt === this.maxRetries - 1) {
                    this.emit('fetchError', { url, error, attempts: attempt + 1 });
                    throw error;
                }
                await this.sleep(1000 * Math.pow(2, attempt));
            }
        }
    }

    /**
     * Recursively fetch entire folder structure
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Starting path
     * @param {string} branch - Branch name
     * @param {number} depth - Maximum depth to traverse (0 = unlimited)
     * @returns {Promise<Object>} - Tree structure of repo contents
     */
    async fetchTree(owner, repo, path = '', branch = 'main', depth = 3) {
        const cacheKey = `tree_${owner}_${repo}_${branch}_${path}_${depth}`;

        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const buildTree = async (currentPath, currentDepth) => {
            if (depth > 0 && currentDepth >= depth) {
                return null;
            }

            const contents = await this.fetchContents(owner, repo, currentPath, branch);
            const tree = {
                path: currentPath,
                items: []
            };

            for (const item of contents) {
                const node = {
                    name: item.name,
                    path: item.path,
                    type: item.type,
                    size: item.size,
                    sha: item.sha,
                    download_url: item.download_url
                };

                if (item.type === 'dir') {
                    const children = await buildTree(item.path, currentDepth + 1);
                    node.children = children ? children.items : [];
                }

                tree.items.push(node);
            }

            return tree;
        };

        const tree = await buildTree(path, 0);
        this.cache.set(cacheKey, tree, this.cacheDuration);
        return tree;
    }

    /**
     * Get available files matching patterns
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branch - Branch name
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Filtered file list
     */
    async getFilteredFiles(owner, repo, branch = 'main', filters = {}) {
        const {
            extensions = [],
            path = '',
            excludePaths = [],
            maxSize = Infinity,
            minSize = 0
        } = filters;

        const tree = await this.fetchTree(owner, repo, path, branch);
        const files = [];

        const collectFiles = (node) => {
            if (!node || !node.items) return;

            for (const item of node.items) {
                if (item.type === 'file') {
                    // Check extension filter
                    if (extensions.length > 0) {
                        const ext = item.name.split('.').pop().toLowerCase();
                        if (!extensions.includes(ext)) continue;
                    }

                    // Check path exclusions
                    if (excludePaths.some(exc => item.path.includes(exc))) continue;

                    // Check size filters
                    if (item.size < minSize || item.size > maxSize) continue;

                    files.push(item);
                } else if (item.type === 'dir' && item.children) {
                    collectFiles({ items: item.children });
                }
            }
        };

        collectFiles(tree);
        return files;
    }

    /**
     * Fetch raw file content with caching
     * @param {string} url - Raw GitHub URL
     * @param {string} cacheKey - Cache key for the file
     * @returns {Promise<string>} - File content
     */
    async fetchFileContent(url, cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await this.fetchWithTimeout(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }

        const content = await response.text();
        this.cache.set(cacheKey, content, this.cacheDuration);
        return content;
    }

    /**
     * Fetch with timeout support
     */
    async fetchWithTimeout(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // Event emitter methods
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get rate limit status
    async getRateLimitStatus() {
        const response = await this.fetchWithTimeout('https://api.github.com/rate_limit');
        return response.json();
    }
}


/**
 * Persistent Cache using localStorage with TTL support
 */
class CorpusCache {
    constructor(prefix = 'corpus_cache_') {
        this.prefix = prefix;
        this.memoryCache = new Map(); // In-memory cache for faster access
    }

    /**
     * Get item from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if expired/missing
     */
    get(key) {
        const fullKey = this.prefix + key;

        // Check memory cache first
        if (this.memoryCache.has(fullKey)) {
            const item = this.memoryCache.get(fullKey);
            if (Date.now() < item.expires) {
                return item.data;
            }
            this.memoryCache.delete(fullKey);
        }

        // Check localStorage
        try {
            const stored = localStorage.getItem(fullKey);
            if (!stored) return null;

            const item = JSON.parse(stored);
            if (Date.now() < item.expires) {
                // Restore to memory cache
                this.memoryCache.set(fullKey, item);
                return item.data;
            }

            // Expired - remove it
            localStorage.removeItem(fullKey);
            return null;
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    }

    /**
     * Set item in cache
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, data, ttl) {
        const fullKey = this.prefix + key;
        const item = {
            data,
            expires: Date.now() + ttl,
            created: Date.now()
        };

        // Store in memory
        this.memoryCache.set(fullKey, item);

        // Store in localStorage
        try {
            localStorage.setItem(fullKey, JSON.stringify(item));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // Clear old items and try again
                this.cleanup();
                try {
                    localStorage.setItem(fullKey, JSON.stringify(item));
                } catch (e2) {
                    console.warn('Cache quota exceeded, using memory only');
                }
            }
        }
    }

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     */
    remove(key) {
        const fullKey = this.prefix + key;
        this.memoryCache.delete(fullKey);
        localStorage.removeItem(fullKey);
    }

    /**
     * Clear all items with this prefix
     */
    clear() {
        // Clear memory cache
        this.memoryCache.clear();

        // Clear localStorage items with our prefix
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Cleanup expired items
     */
    cleanup() {
        const now = Date.now();
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item.expires < now) {
                        keysToRemove.push(key);
                    }
                } catch (e) {
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            this.memoryCache.delete(key);
        });

        return keysToRemove.length;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        let totalSize = 0;
        let itemCount = 0;
        let expiredCount = 0;
        const now = Date.now();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                const value = localStorage.getItem(key);
                totalSize += value.length;
                itemCount++;

                try {
                    const item = JSON.parse(value);
                    if (item.expires < now) {
                        expiredCount++;
                    }
                } catch (e) {
                    expiredCount++;
                }
            }
        }

        return {
            itemCount,
            expiredCount,
            totalSizeKB: Math.round(totalSize / 1024),
            memoryItems: this.memoryCache.size
        };
    }

    /**
     * Check if key exists and is valid
     */
    has(key) {
        return this.get(key) !== null;
    }
}


/**
 * UI Component for GitHub Repository Browser
 */
class GitHubBrowserUI {
    constructor(containerId, browser, options = {}) {
        this.container = document.getElementById(containerId);
        this.browser = browser;
        this.options = options;
        this.selectedFiles = new Set();
        this.currentRepo = null;
        this.onSelectionChange = options.onSelectionChange || (() => {});
    }

    /**
     * Initialize the browser UI
     */
    async init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the browser UI
     */
    render() {
        this.container.innerHTML = `
            <div class="github-browser">
                <div class="browser-header">
                    <h3>GitHub Repository Browser</h3>
                    <div class="browser-controls">
                        <input type="text" id="repo-url-input" placeholder="Enter GitHub repo URL or owner/repo" class="repo-input">
                        <button id="browse-repo-btn" class="browse-btn">Browse</button>
                    </div>
                </div>

                <div class="browser-filters">
                    <label>
                        <span>File types:</span>
                        <input type="text" id="file-extensions" placeholder="json,xml,txt" value="json,xml,txt">
                    </label>
                    <label>
                        <span>Path filter:</span>
                        <input type="text" id="path-filter" placeholder="texts/">
                    </label>
                </div>

                <div id="browser-loading" class="browser-loading hidden">
                    <div class="spinner"></div>
                    <span>Loading repository structure...</span>
                </div>

                <div id="browser-error" class="browser-error hidden"></div>

                <div id="browser-tree" class="browser-tree"></div>

                <div class="browser-actions">
                    <button id="select-all-files" class="action-btn" disabled>Select All</button>
                    <button id="clear-selection" class="action-btn" disabled>Clear Selection</button>
                    <span id="selection-count">0 files selected</span>
                </div>

                <div class="cache-info">
                    <span id="cache-stats"></span>
                    <button id="clear-cache-btn" class="small-btn">Clear Cache</button>
                </div>
            </div>
        `;

        this.updateCacheStats();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const browseBtn = this.container.querySelector('#browse-repo-btn');
        const repoInput = this.container.querySelector('#repo-url-input');
        const selectAllBtn = this.container.querySelector('#select-all-files');
        const clearSelectionBtn = this.container.querySelector('#clear-selection');
        const clearCacheBtn = this.container.querySelector('#clear-cache-btn');

        browseBtn.addEventListener('click', () => this.browseRepository());
        repoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.browseRepository();
        });

        selectAllBtn.addEventListener('click', () => this.selectAllFiles());
        clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        clearCacheBtn.addEventListener('click', () => this.clearCache());
    }

    /**
     * Parse repository URL/string
     */
    parseRepoInput(input) {
        // Handle full GitHub URLs
        const urlMatch = input.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
        if (urlMatch) {
            return { owner: urlMatch[1], repo: urlMatch[2].replace('.git', '') };
        }

        // Handle owner/repo format
        const slashMatch = input.match(/^([^\/]+)\/([^\/]+)$/);
        if (slashMatch) {
            return { owner: slashMatch[1], repo: slashMatch[2] };
        }

        return null;
    }

    /**
     * Browse a repository
     */
    async browseRepository() {
        const input = this.container.querySelector('#repo-url-input').value.trim();
        const parsed = this.parseRepoInput(input);

        if (!parsed) {
            this.showError('Invalid repository format. Use "owner/repo" or full GitHub URL.');
            return;
        }

        const extensions = this.container.querySelector('#file-extensions').value
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(e => e);

        const pathFilter = this.container.querySelector('#path-filter').value.trim();

        this.showLoading(true);
        this.hideError();

        try {
            const files = await this.browser.getFilteredFiles(
                parsed.owner,
                parsed.repo,
                'main',
                { extensions, path: pathFilter }
            );

            // Try 'master' branch if 'main' fails
            if (files.length === 0) {
                const masterFiles = await this.browser.getFilteredFiles(
                    parsed.owner,
                    parsed.repo,
                    'master',
                    { extensions, path: pathFilter }
                );
                if (masterFiles.length > 0) {
                    this.renderFileTree(masterFiles, { ...parsed, branch: 'master' });
                    this.currentRepo = { ...parsed, branch: 'master' };
                } else {
                    this.showError('No matching files found in repository.');
                }
            } else {
                this.renderFileTree(files, { ...parsed, branch: 'main' });
                this.currentRepo = { ...parsed, branch: 'main' };
            }

            this.enableActions(true);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render file tree
     */
    renderFileTree(files, repoInfo) {
        const treeContainer = this.container.querySelector('#browser-tree');

        // Group files by directory
        const grouped = {};
        files.forEach(file => {
            const dir = file.path.split('/').slice(0, -1).join('/') || '/';
            if (!grouped[dir]) grouped[dir] = [];
            grouped[dir].push(file);
        });

        let html = `<div class="repo-info">
            <strong>${repoInfo.owner}/${repoInfo.repo}</strong> (${repoInfo.branch})
            <span class="file-count">${files.length} files found</span>
        </div>`;

        Object.keys(grouped).sort().forEach(dir => {
            html += `
                <div class="tree-folder">
                    <div class="folder-header" data-path="${dir}">
                        <span class="folder-icon">📁</span>
                        <span class="folder-name">${dir || '/'}</span>
                        <span class="folder-count">(${grouped[dir].length} files)</span>
                        <button class="select-folder-btn" data-path="${dir}">Select All</button>
                    </div>
                    <div class="folder-contents">
            `;

            grouped[dir].forEach(file => {
                const ext = file.name.split('.').pop().toLowerCase();
                const icon = this.getFileIcon(ext);
                const sizeKB = Math.round(file.size / 1024);
                const isSelected = this.selectedFiles.has(file.path);

                html += `
                    <div class="tree-file ${isSelected ? 'selected' : ''}" data-path="${file.path}">
                        <input type="checkbox" class="file-checkbox" data-path="${file.path}" ${isSelected ? 'checked' : ''}>
                        <span class="file-icon">${icon}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${sizeKB} KB</span>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        treeContainer.innerHTML = html;

        // Attach file selection listeners
        treeContainer.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const path = e.target.dataset.path;
                if (e.target.checked) {
                    this.selectedFiles.add(path);
                } else {
                    this.selectedFiles.delete(path);
                }
                this.updateSelectionUI();
                this.onSelectionChange(Array.from(this.selectedFiles));
            });
        });

        // Attach folder selection listeners
        treeContainer.querySelectorAll('.select-folder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderPath = e.target.dataset.path;
                const folder = e.target.closest('.tree-folder');
                const checkboxes = folder.querySelectorAll('.file-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);

                checkboxes.forEach(cb => {
                    cb.checked = !allChecked;
                    const path = cb.dataset.path;
                    if (cb.checked) {
                        this.selectedFiles.add(path);
                    } else {
                        this.selectedFiles.delete(path);
                    }
                });

                this.updateSelectionUI();
                this.onSelectionChange(Array.from(this.selectedFiles));
            });
        });

        // Folder toggle
        treeContainer.querySelectorAll('.folder-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.classList.contains('select-folder-btn')) return;
                const folder = header.closest('.tree-folder');
                folder.classList.toggle('collapsed');
            });
        });
    }

    /**
     * Get file icon based on extension
     */
    getFileIcon(ext) {
        const icons = {
            'json': '📄',
            'xml': '📜',
            'txt': '📝',
            'md': '📋',
            'html': '🌐',
            'csv': '📊'
        };
        return icons[ext] || '📄';
    }

    /**
     * Update selection UI
     */
    updateSelectionUI() {
        const count = this.selectedFiles.size;
        this.container.querySelector('#selection-count').textContent =
            `${count} file${count !== 1 ? 's' : ''} selected`;

        // Update visual state
        this.container.querySelectorAll('.tree-file').forEach(fileEl => {
            const path = fileEl.dataset.path;
            if (this.selectedFiles.has(path)) {
                fileEl.classList.add('selected');
            } else {
                fileEl.classList.remove('selected');
            }
        });
    }

    /**
     * Select all visible files
     */
    selectAllFiles() {
        this.container.querySelectorAll('.file-checkbox').forEach(cb => {
            cb.checked = true;
            this.selectedFiles.add(cb.dataset.path);
        });
        this.updateSelectionUI();
        this.onSelectionChange(Array.from(this.selectedFiles));
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedFiles.clear();
        this.container.querySelectorAll('.file-checkbox').forEach(cb => {
            cb.checked = false;
        });
        this.updateSelectionUI();
        this.onSelectionChange([]);
    }

    /**
     * Get selected files with full info
     */
    getSelectedFiles() {
        return Array.from(this.selectedFiles).map(path => {
            return {
                path,
                repo: this.currentRepo,
                url: `https://raw.githubusercontent.com/${this.currentRepo.owner}/${this.currentRepo.repo}/${this.currentRepo.branch}/${path}`
            };
        });
    }

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        this.container.querySelector('#browser-loading').classList.toggle('hidden', !show);
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = this.container.querySelector('#browser-error');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.container.querySelector('#browser-error').classList.add('hidden');
    }

    /**
     * Enable/disable action buttons
     */
    enableActions(enabled) {
        this.container.querySelector('#select-all-files').disabled = !enabled;
        this.container.querySelector('#clear-selection').disabled = !enabled;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.browser.cache.clear();
        this.updateCacheStats();
        this.showError('Cache cleared successfully!');
        setTimeout(() => this.hideError(), 3000);
    }

    /**
     * Update cache statistics display
     */
    updateCacheStats() {
        const stats = this.browser.cache.getStats();
        this.container.querySelector('#cache-stats').textContent =
            `Cache: ${stats.itemCount} items (${stats.totalSizeKB} KB)`;
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GitHubBrowser, CorpusCache, GitHubBrowserUI };
}

/**
 * Generic GitHub Corpus Search System
 * Standardized core for all mythology corpus search interfaces
 *
 * Usage:
 *   const search = new CorpusSearch('config.json', customParsers);
 *   await search.init();
 *   const results = await search.search('term');
 */

class CorpusSearch {
  constructor(configPath, customParsers = {}) {
    this.config = null;
    this.loadedTexts = new Map();
    this.configPath = configPath;
    this.customParsers = customParsers; // Repo-specific parsers
    this.loadingCallbacks = {};
  }

  async init() {
    try {
      const response = await fetch(this.configPath);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      this.config = await response.json();
      return true;
    } catch (error) {
      console.error('Failed to initialize CorpusSearch:', error);
      throw error;
    }
  }

  getRepositories() {
    return this.config?.repositories || [];
  }

  buildRawURL(repo, filename) {
    const path = repo.path ? `${repo.path}/` : '';
    return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${path}${filename}`;
  }

  async fetchWithCache(url, repoId, filename, options = {}) {
    const cacheKey = `corpus_${repoId}_${filename}`;
    const maxRetries = options.maxRetries || 3;
    const maxAge = this.config.cache_duration_minutes * 60 * 1000;

    // Check localStorage first (persistent), then sessionStorage (fallback)
    const checkCache = (storage) => {
      const cached = storage.getItem(cacheKey);
      if (cached && !options.bypassCache) {
        try {
          const { content, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < maxAge) {
            return content;
          }
          storage.removeItem(cacheKey);
        } catch (e) {
          storage.removeItem(cacheKey);
        }
      }
      return null;
    };

    // Try localStorage first (persistent across sessions)
    let cachedContent = checkCache(localStorage);
    if (cachedContent) {
      this.cacheHits = (this.cacheHits || 0) + 1;
      return cachedContent;
    }

    // Fallback to sessionStorage
    cachedContent = checkCache(sessionStorage);
    if (cachedContent) {
      this.cacheHits = (this.cacheHits || 0) + 1;
      return cachedContent;
    }

    // Fetch with retry
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          (this.config.api_settings?.timeout_seconds || 30) * 1000
        );

        const response = await fetch(url, {
          signal: controller.signal,
          headers: this.config.api_settings?.github_token
            ? { 'Authorization': `token ${this.config.api_settings.github_token}` }
            : {}
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const content = await response.text();

        // Cache to localStorage (persistent) with fallback to sessionStorage
        const cacheData = JSON.stringify({
          content,
          timestamp: Date.now(),
          url: url
        });

        try {
          localStorage.setItem(cacheKey, cacheData);
        } catch (e) {
          // localStorage full, try sessionStorage
          try {
            sessionStorage.setItem(cacheKey, cacheData);
          } catch (e2) {
            console.warn('Both caches full, clearing old entries...');
            this.cleanupOldCache();
            try {
              localStorage.setItem(cacheKey, cacheData);
            } catch (e3) {
              console.warn('Cache quota exceeded, content will not be cached');
            }
          }
        }

        this.cacheMisses = (this.cacheMisses || 0) + 1;
        return content;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw new Error(`Failed to fetch after ${maxRetries} attempts: ${error.message}`);
        }
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  cleanupOldCache() {
    const now = Date.now();
    const maxAge = (this.config?.cache_duration_minutes || 60) * 60 * 1000;
    const storages = [localStorage, sessionStorage];

    storages.forEach(storage => {
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith('corpus_')) {
          try {
            const { timestamp } = JSON.parse(storage.getItem(key));
            if (now - timestamp > maxAge) {
              keysToRemove.push(key);
            }
          } catch (e) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => storage.removeItem(key));
    });
  }

  async loadSelectedRepos(selectedRepoIds, callbacks = {}) {
    this.loadingCallbacks = callbacks;
    const selectedRepos = this.config.repositories.filter(r => selectedRepoIds.includes(r.id));

    if (selectedRepos.length === 0) {
      throw new Error('No repositories selected');
    }

    const totalFiles = selectedRepos.reduce((sum, repo) => sum + repo.files.length, 0);
    let loadedCount = 0;
    const maxConcurrent = this.config.max_concurrent_fetches || 5;
    const allTasks = [];

    for (const repo of selectedRepos) {
      for (const file of repo.files) {
        allTasks.push({ repo, file });
      }
    }

    // Process in batches
    for (let i = 0; i < allTasks.length; i += maxConcurrent) {
      const batch = allTasks.slice(i, i + maxConcurrent);

      await Promise.all(batch.map(async ({ repo, file }) => {
        try {
          const url = this.buildRawURL(repo, file.name);

          if (this.loadingCallbacks.onProgress) {
            this.loadingCallbacks.onProgress({
              current: loadedCount,
              total: totalFiles,
              repoName: repo.name,
              fileName: file.display || file.name,
              percentage: Math.round((loadedCount / totalFiles) * 100)
            });
          }

          const content = await this.fetchWithCache(url, repo.id, file.name);

          this.loadedTexts.set(`${repo.id}:${file.name}`, {
            content,
            metadata: {
              repoId: repo.id,
              repoName: repo.name,
              fileName: file.name,
              fileDisplay: file.display || file.name,
              language: file.language || 'en',
              format: file.format || 'json',
              description: file.description || '',
              parserType: file.parser || file.format // Allow custom parser specification
            }
          });

          loadedCount++;
        } catch (error) {
          console.error(`Failed to load ${repo.name}/${file.name}:`, error);
          if (this.loadingCallbacks.onError) {
            this.loadingCallbacks.onError({
              repo: repo.name,
              file: file.name,
              error: error.message
            });
          }
        }
      }));
    }

    if (this.loadingCallbacks.onComplete) {
      this.loadingCallbacks.onComplete({
        totalLoaded: loadedCount,
        totalFiles: totalFiles,
        loadedTexts: Array.from(this.loadedTexts.keys())
      });
    }

    return loadedCount;
  }

  async search(term, options = {}) {
    if (this.loadedTexts.size === 0) {
      throw new Error('No texts loaded. Please load repositories first.');
    }

    const {
      caseSensitive = false,
      maxResults = 100,
      contextWords = 10,
      matchAll = false,
      terms = null
    } = options;

    const searchTerms = terms || [term];
    const results = [];

    for (const [key, data] of this.loadedTexts) {
      const parser = this.getParser(data.metadata.parserType || data.metadata.format, data.metadata.repoId);

      try {
        const textResults = parser.search(
          data.content,
          searchTerms,
          {
            caseSensitive,
            maxResults: maxResults - results.length,
            contextWords,
            matchAll,
            corpusName: data.metadata.fileDisplay,
            metadata: data.metadata
          }
        );

        results.push(...textResults);

        if (results.length >= maxResults) {
          break;
        }
      } catch (error) {
        console.error(`Search error in ${key}:`, error);
      }
    }

    return results;
  }

  getParser(format, repoId) {
    // Check for custom parsers first (repo-specific)
    const customKey = `${repoId}:${format}`;
    if (this.customParsers[customKey]) {
      return this.customParsers[customKey];
    }
    if (this.customParsers[format]) {
      return this.customParsers[format];
    }

    // Fall back to standard parsers
    switch (format?.toLowerCase()) {
      case 'json':
        return new JSONBibleParser();
      case 'xml':
      case 'tei':
        return new XMLParser();
      case 'txt':
      case 'text':
        return new PlainTextParser();
      default:
        return new JSONBibleParser();
    }
  }

  clearCache() {
    this.loadedTexts.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;

    // Clear both localStorage and sessionStorage
    [localStorage, sessionStorage].forEach(storage => {
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith('corpus_')) {
          keys.push(key);
        }
      }
      keys.forEach(key => storage.removeItem(key));
    });
  }

  getStats() {
    const cacheInfo = this.getCacheInfo();
    return {
      loadedTexts: this.loadedTexts.size,
      cacheSize: cacheInfo.totalSizeKB,
      cacheItems: cacheInfo.itemCount,
      cacheHits: this.cacheHits || 0,
      cacheMisses: this.cacheMisses || 0,
      cacheHitRate: this.cacheHits && this.cacheMisses
        ? Math.round((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100)
        : 0,
      repositories: this.config?.repositories.length || 0,
      localStorageUsed: cacheInfo.localStorageKB,
      sessionStorageUsed: cacheInfo.sessionStorageKB
    };
  }

  getCacheSize() {
    return this.getCacheInfo().totalSizeKB;
  }

  getCacheInfo() {
    let localStorageSize = 0;
    let sessionStorageSize = 0;
    let itemCount = 0;

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('corpus_')) {
        localStorageSize += localStorage.getItem(key).length;
        itemCount++;
      }
    }

    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('corpus_')) {
        sessionStorageSize += sessionStorage.getItem(key).length;
        itemCount++;
      }
    }

    return {
      itemCount,
      totalSizeKB: Math.round((localStorageSize + sessionStorageSize) / 1024),
      localStorageKB: Math.round(localStorageSize / 1024),
      sessionStorageKB: Math.round(sessionStorageSize / 1024)
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Base Parser Class
class BaseParser {
  matches(text, searchTerms, caseSensitive, matchAll) {
    const textToSearch = caseSensitive ? text : text.toLowerCase();
    const terms = searchTerms.map(t => caseSensitive ? t : t.toLowerCase());

    if (matchAll) {
      return terms.every(term => textToSearch.includes(term));
    } else {
      return terms.some(term => textToSearch.includes(term));
    }
  }

  extractContext(text, searchTerm, contextWords) {
    const words = text.split(/\s+/);
    const searchLower = searchTerm.toLowerCase();

    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase().includes(searchLower)) {
        const start = Math.max(0, i - contextWords);
        const end = Math.min(words.length, i + contextWords + 1);
        let context = words.slice(start, end).join(' ');

        if (start > 0) context = '...' + context;
        if (end < words.length) context = context + '...';

        return context;
      }
    }

    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }

  findMatchedTerm(text, searchTerms, caseSensitive) {
    const textToSearch = caseSensitive ? text : text.toLowerCase();
    for (const term of searchTerms) {
      const searchTerm = caseSensitive ? term : term.toLowerCase();
      if (textToSearch.includes(searchTerm)) {
        return term;
      }
    }
    return searchTerms[0];
  }
}

// Standard Parsers
class JSONBibleParser extends BaseParser {
  search(jsonContent, searchTerms, options) {
    const data = JSON.parse(jsonContent);
    const results = [];

    for (const [book, chapters] of Object.entries(data)) {
      if (typeof chapters !== 'object') continue;

      for (const [chapter, verses] of Object.entries(chapters)) {
        if (typeof verses !== 'object') continue;

        for (const [verse, text] of Object.entries(verses)) {
          if (typeof text !== 'string') continue;

          if (this.matches(text, searchTerms, options.caseSensitive, options.matchAll)) {
            const matchedTerm = this.findMatchedTerm(text, searchTerms, options.caseSensitive);

            results.push({
              corpus_name: options.corpusName || 'Bible',
              text_id: `${book}:${chapter}:${verse}`,
              text_name: `${book} ${chapter}:${verse}`,
              matched_term: matchedTerm,
              context: this.extractContext(text, matchedTerm, options.contextWords),
              full_verse: text,
              book,
              chapter,
              verse,
              language: options.metadata.language || 'en',
              translation: null,
              metadata: options.metadata,
              url: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(book)}+${chapter}:${verse}`
            });

            if (results.length >= options.maxResults) {
              return results;
            }
          }
        }
      }
    }

    return results;
  }
}

class XMLParser extends BaseParser {
  search(xmlContent, searchTerms, options) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    const results = [];

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }

    const textNodes = this.extractTextNodes(doc);

    textNodes.forEach((node, index) => {
      const text = node.textContent.trim();
      if (!text) return;

      if (this.matches(text, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(text, searchTerms, options.caseSensitive);

        results.push({
          corpus_name: options.corpusName || 'Corpus',
          text_id: `node_${index}`,
          text_name: this.getNodeContext(node) || `Entry ${index + 1}`,
          matched_term: matchedTerm,
          context: this.extractContext(text, matchedTerm, options.contextWords),
          full_verse: text,
          book: null,
          chapter: null,
          verse: null,
          language: options.metadata.language || 'en',
          translation: null,
          metadata: { ...options.metadata, nodeIndex: index },
          url: null
        });

        if (results.length >= options.maxResults) {
          return;
        }
      }
    });

    return results;
  }

  extractTextNodes(doc) {
    const textElements = doc.querySelectorAll('p, ab, l, div, seg, w');
    return Array.from(textElements);
  }

  getNodeContext(node) {
    let current = node;
    while (current && current.parentElement) {
      if (current.id) return `Section ${current.id}`;
      if (current.getAttribute('n')) return `Part ${current.getAttribute('n')}`;
      current = current.parentElement;
    }
    return null;
  }
}

class PlainTextParser extends BaseParser {
  search(textContent, searchTerms, options) {
    const lines = textContent.split('\n');
    const results = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (this.matches(trimmedLine, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(trimmedLine, searchTerms, options.caseSensitive);

        results.push({
          corpus_name: options.corpusName || 'Text Corpus',
          text_id: `line_${index + 1}`,
          text_name: `Line ${index + 1}`,
          matched_term: matchedTerm,
          context: this.extractContextLines(lines, index, 2),
          full_verse: trimmedLine,
          book: null,
          chapter: null,
          verse: String(index + 1),
          language: options.metadata.language || 'en',
          translation: null,
          metadata: { ...options.metadata, lineNumber: index + 1 },
          url: null
        });

        if (results.length >= options.maxResults) {
          return;
        }
      }
    });

    return results;
  }

  extractContextLines(lines, centerIndex, contextLines) {
    const start = Math.max(0, centerIndex - contextLines);
    const end = Math.min(lines.length, centerIndex + contextLines + 1);
    let context = lines.slice(start, end)
      .map(l => l.trim())
      .filter(l => l)
      .join(' ');

    if (start > 0) context = '...' + context;
    if (end < lines.length) context = context + '...';

    return context;
  }
}

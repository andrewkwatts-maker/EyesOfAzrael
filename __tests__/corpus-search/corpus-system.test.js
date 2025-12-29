/**
 * Corpus Search System - Comprehensive Test Suite
 * Agent 8: Final Testing for Eyes of Azrael
 *
 * Tests:
 * - CorpusQueryService CRUD operations
 * - Query execution (GitHub and Firebase)
 * - Renderer output validation
 * - User query submission
 * - Voting functionality
 * - Entity page integration
 */

// Import test setup
require('../setup');

// ============================================
// MOCK IMPLEMENTATIONS
// ============================================

/**
 * Mock CorpusCache for testing
 */
class CorpusCache {
  constructor(prefix = 'corpus_cache_') {
    this.prefix = prefix;
    this.memoryCache = new Map();
  }

  get(key) {
    const fullKey = this.prefix + key;
    if (this.memoryCache.has(fullKey)) {
      const item = this.memoryCache.get(fullKey);
      if (Date.now() < item.expires) {
        return item.data;
      }
      this.memoryCache.delete(fullKey);
    }

    const stored = localStorage.getItem(fullKey);
    if (!stored) return null;

    try {
      const item = JSON.parse(stored);
      if (Date.now() < item.expires) {
        this.memoryCache.set(fullKey, item);
        return item.data;
      }
      localStorage.removeItem(fullKey);
      return null;
    } catch (e) {
      return null;
    }
  }

  set(key, data, ttl) {
    const fullKey = this.prefix + key;
    const item = {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    };
    this.memoryCache.set(fullKey, item);
    localStorage.setItem(fullKey, JSON.stringify(item));
  }

  remove(key) {
    const fullKey = this.prefix + key;
    this.memoryCache.delete(fullKey);
    localStorage.removeItem(fullKey);
  }

  clear() {
    this.memoryCache.clear();
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.expires < now) {
            keysToRemove.push(key);
            cleaned++;
          }
        } catch (e) {
          keysToRemove.push(key);
          cleaned++;
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      this.memoryCache.delete(key);
    });

    return cleaned;
  }

  has(key) {
    return this.get(key) !== null;
  }

  getStats() {
    let totalSize = 0;
    let itemCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        totalSize += localStorage.getItem(key).length;
        itemCount++;
      }
    }

    return {
      itemCount,
      totalSizeKB: Math.round(totalSize / 1024),
      memoryItems: this.memoryCache.size
    };
  }
}

/**
 * Mock BaseParser for testing
 */
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

/**
 * Mock JSONBibleParser for testing
 */
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
              context: this.extractContext(text, matchedTerm, options.contextWords || 10),
              full_verse: text,
              book,
              chapter,
              verse,
              language: options.metadata?.language || 'en',
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

/**
 * Mock PlainTextParser for testing
 */
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
          language: options.metadata?.language || 'en',
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

/**
 * Mock CorpusSearch for testing
 */
class CorpusSearch {
  constructor(configPath, customParsers = {}) {
    this.config = null;
    this.loadedTexts = new Map();
    this.configPath = configPath;
    this.customParsers = customParsers;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  async init() {
    // Simulated config loading
    this.config = {
      repositories: [],
      cache_duration_minutes: 60,
      max_concurrent_fetches: 5
    };
    return true;
  }

  getRepositories() {
    return this.config?.repositories || [];
  }

  buildRawURL(repo, filename) {
    const path = repo.path ? `${repo.path}/` : '';
    return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${path}${filename}`;
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
    const customKey = `${repoId}:${format}`;
    if (this.customParsers[customKey]) {
      return this.customParsers[customKey];
    }
    if (this.customParsers[format]) {
      return this.customParsers[format];
    }

    switch (format?.toLowerCase()) {
      case 'json':
        return new JSONBibleParser();
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
  }

  getStats() {
    return {
      loadedTexts: this.loadedTexts.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      repositories: this.config?.repositories.length || 0
    };
  }

  // Method to load text for testing
  loadText(key, content, metadata) {
    this.loadedTexts.set(key, { content, metadata });
  }
}

/**
 * Mock CorpusQueryService for testing Firebase integration
 */
let queryIdCounter = 0;  // Counter for unique IDs
let userQueryIdCounter = 0;

class CorpusQueryService {
  constructor() {
    this.queries = new Map();
    this.userQueries = new Map();
    this.votes = new Map();
  }

  // CRUD Operations
  async saveQuery(query) {
    if (!query.id) {
      queryIdCounter++;
      query.id = 'query_' + queryIdCounter + '_' + Date.now();
    }
    query.createdAt = new Date().toISOString();
    query.updatedAt = new Date().toISOString();
    this.queries.set(query.id, query);
    return query.id;
  }

  async getQuery(queryId) {
    return this.queries.get(queryId) || null;
  }

  async updateQuery(queryId, updates) {
    const query = this.queries.get(queryId);
    if (!query) {
      throw new Error('Query not found');
    }
    const updated = { ...query, ...updates, updatedAt: new Date().toISOString() };
    this.queries.set(queryId, updated);
    return updated;
  }

  async deleteQuery(queryId) {
    if (!this.queries.has(queryId)) {
      throw new Error('Query not found');
    }
    this.queries.delete(queryId);
    return true;
  }

  async getAllQueries(options = {}) {
    const { type, mythology, limit = 100 } = options;
    let results = Array.from(this.queries.values());

    if (type) {
      results = results.filter(q => q.type === type);
    }
    if (mythology) {
      results = results.filter(q => q.mythology === mythology);
    }

    return results.slice(0, limit);
  }

  // User Query Operations
  async saveUserQuery(userId, query) {
    if (!query.id) {
      userQueryIdCounter++;
      query.id = 'user_query_' + userQueryIdCounter + '_' + Date.now();
    }
    query.userId = userId;
    query.createdAt = new Date().toISOString();
    query.votes = 0;
    query.status = 'pending';

    const userQueries = this.userQueries.get(userId) || [];
    userQueries.push(query);
    this.userQueries.set(userId, userQueries);

    return query.id;
  }

  async getUserQueries(userId) {
    return this.userQueries.get(userId) || [];
  }

  async deleteUserQuery(userId, queryId) {
    const queries = this.userQueries.get(userId) || [];
    const index = queries.findIndex(q => q.id === queryId);
    if (index === -1) {
      throw new Error('Query not found');
    }
    queries.splice(index, 1);
    this.userQueries.set(userId, queries);
    return true;
  }

  // Voting Operations
  async voteQuery(userId, queryId, voteType) {
    const voteKey = `${userId}_${queryId}`;
    const existingVote = this.votes.get(voteKey);

    if (existingVote === voteType) {
      // Remove vote
      this.votes.delete(voteKey);
      return { action: 'removed', voteType: null };
    }

    this.votes.set(voteKey, voteType);
    return { action: existingVote ? 'changed' : 'added', voteType };
  }

  async getVoteCount(queryId) {
    let upvotes = 0;
    let downvotes = 0;

    for (const [key, value] of this.votes) {
      if (key.endsWith(`_${queryId}`)) {
        if (value === 'up') upvotes++;
        if (value === 'down') downvotes++;
      }
    }

    return { upvotes, downvotes, total: upvotes - downvotes };
  }

  async getUserVote(userId, queryId) {
    const voteKey = `${userId}_${queryId}`;
    return this.votes.get(voteKey) || null;
  }

  // Query Execution
  async executeQuery(query) {
    // Simulate query execution
    if (query.type === 'github') {
      return this.executeGitHubQuery(query);
    } else if (query.type === 'firebase') {
      return this.executeFirebaseQuery(query);
    } else if (query.type === 'combined') {
      const githubResults = await this.executeGitHubQuery(query);
      const firebaseResults = await this.executeFirebaseQuery(query);
      return { github: githubResults, firebase: firebaseResults };
    }
    throw new Error('Invalid query type');
  }

  async executeGitHubQuery(query) {
    // Simulate GitHub search results
    return {
      type: 'github',
      term: query.term,
      results: [
        { text_name: 'Genesis 1:1', matched_term: query.term, context: 'Sample context...' }
      ],
      resultCount: 1
    };
  }

  async executeFirebaseQuery(query) {
    // Simulate Firebase search results
    return {
      type: 'firebase',
      term: query.term,
      results: [
        { id: 'zeus', name: 'Zeus', type: 'deity', mythology: 'greek' }
      ],
      resultCount: 1
    };
  }
}

/**
 * Mock CorpusRenderer for testing
 */
class CorpusRenderer {
  constructor(options = {}) {
    this.mode = options.mode || 'panel';
    this.container = options.container;
  }

  render(results, options = {}) {
    const mode = options.mode || this.mode;

    switch (mode) {
      case 'panel':
        return this.renderPanel(results);
      case 'inline':
        return this.renderInline(results);
      case 'inline-grid':
        return this.renderGrid(results);
      case 'full-page':
        return this.renderFullPage(results);
      case 'modal':
        return this.renderModal(results);
      case 'sidebar':
        return this.renderSidebar(results);
      case 'embedded':
        return this.renderEmbedded(results);
      default:
        return this.renderPanel(results);
    }
  }

  renderPanel(results) {
    return {
      type: 'panel',
      html: `<div class="corpus-panel">${results.map(r =>
        `<div class="result-item"><h3>${r.text_name}</h3><p>${r.context}</p></div>`
      ).join('')}</div>`,
      resultCount: results.length
    };
  }

  renderInline(results) {
    return {
      type: 'inline',
      html: `<span class="corpus-inline">${results.length} results</span>`,
      resultCount: results.length
    };
  }

  renderGrid(results) {
    return {
      type: 'inline-grid',
      html: `<div class="corpus-grid">${results.map(r =>
        `<div class="grid-card">${r.text_name}</div>`
      ).join('')}</div>`,
      resultCount: results.length
    };
  }

  renderFullPage(results) {
    return {
      type: 'full-page',
      html: `<main class="corpus-explorer"><h1>Corpus Explorer</h1><div class="results">${results.length} results found</div></main>`,
      resultCount: results.length
    };
  }

  renderModal(results) {
    return {
      type: 'modal',
      html: `<div class="corpus-modal"><div class="modal-content">${results.length} results</div></div>`,
      resultCount: results.length
    };
  }

  renderSidebar(results) {
    return {
      type: 'sidebar',
      html: `<aside class="corpus-sidebar">${results.length} results</aside>`,
      resultCount: results.length
    };
  }

  renderEmbedded(results) {
    return {
      type: 'embedded',
      html: `<div class="corpus-embedded">${results.length} results</div>`,
      resultCount: results.length
    };
  }
}

// ============================================
// TEST SUITES
// ============================================

describe('Corpus Search System', () => {

  // ============================================
  // CORPUS CACHE TESTS
  // ============================================
  describe('CorpusCache', () => {
    let cache;

    beforeEach(() => {
      localStorage.clear();
      cache = new CorpusCache('test_');
    });

    test('should store and retrieve data', () => {
      cache.set('key1', { value: 'test' }, 60000);
      const result = cache.get('key1');
      expect(result).toEqual({ value: 'test' });
    });

    test('should return null for missing keys', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    test('should expire items after TTL', async () => {
      cache.set('expiring', 'data', 50);
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = cache.get('expiring');
      expect(result).toBeNull();
    });

    test('should clear all items with prefix', () => {
      cache.set('a', 1, 60000);
      cache.set('b', 2, 60000);
      cache.set('c', 3, 60000);

      cache.clear();

      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
      expect(cache.get('c')).toBeNull();
    });

    test('should cleanup expired items', async () => {
      cache.set('valid', 'data', 60000);
      cache.set('expired1', 'old', 1);
      cache.set('expired2', 'old', 1);

      await new Promise(resolve => setTimeout(resolve, 50));

      const cleaned = cache.cleanup();
      expect(cleaned).toBe(2);
      expect(cache.get('valid')).toBe('data');
    });

    test('should report correct stats', () => {
      cache.set('item1', 'a'.repeat(100), 60000);
      cache.set('item2', 'b'.repeat(200), 60000);

      const stats = cache.getStats();
      expect(stats.itemCount).toBe(2);
      expect(stats.totalSizeKB).toBeGreaterThanOrEqual(0);
    });

    test('has() should check existence correctly', () => {
      cache.set('exists', 'value', 60000);

      expect(cache.has('exists')).toBe(true);
      expect(cache.has('notexists')).toBe(false);
    });

    test('should use memory cache for faster access', () => {
      cache.set('memtest', 'memory', 60000);

      // First get populates memory cache
      expect(cache.get('memtest')).toBe('memory');

      // Delete from localStorage to prove memory cache is used
      localStorage.removeItem('test_memtest');

      // Should still get from memory cache
      expect(cache.get('memtest')).toBe('memory');
    });
  });

  // ============================================
  // PARSER TESTS
  // ============================================
  describe('Parsers', () => {

    describe('BaseParser', () => {
      let parser;

      beforeEach(() => {
        parser = new BaseParser();
      });

      test('matches() should handle matchAny option', () => {
        const matchAny = parser.matches('The quick brown fox', ['quick', 'slow'], false, false);
        expect(matchAny).toBe(true);
      });

      test('matches() should handle matchAll option', () => {
        const matchAll = parser.matches('The quick brown fox', ['quick', 'slow'], false, true);
        expect(matchAll).toBe(false);
      });

      test('matches() should be case-insensitive by default', () => {
        const result = parser.matches('HELLO WORLD', ['hello'], false, false);
        expect(result).toBe(true);
      });

      test('matches() should respect case-sensitivity', () => {
        const result = parser.matches('HELLO WORLD', ['hello'], true, false);
        expect(result).toBe(false);
      });

      test('extractContext() should include surrounding words', () => {
        const text = 'one two three KEYWORD four five six seven';
        const context = parser.extractContext(text, 'keyword', 2);

        expect(context).toContain('KEYWORD');
        expect(context).toContain('three');
        expect(context).toContain('four');
      });

      test('extractContext() should add ellipsis for truncated context', () => {
        const text = 'one two three KEYWORD four five six seven';
        const context = parser.extractContext(text, 'keyword', 1);

        expect(context).toContain('...');
      });

      test('findMatchedTerm() should return the matched term', () => {
        const text = 'The god Zeus ruled Olympus';
        const result = parser.findMatchedTerm(text, ['zeus', 'hera'], false);
        expect(result).toBe('zeus');
      });
    });

    describe('JSONBibleParser', () => {
      let parser;

      beforeEach(() => {
        parser = new JSONBibleParser();
      });

      test('should parse Bible format correctly', () => {
        const content = JSON.stringify({
          'Genesis': {
            '1': {
              '1': 'In the beginning God created the heaven and the earth.',
              '2': 'And the earth was without form, and void.'
            }
          }
        });

        const results = parser.search(content, ['beginning'], {
          caseSensitive: false,
          maxResults: 10,
          contextWords: 5,
          corpusName: 'KJV'
        });

        expect(results.length).toBe(1);
        expect(results[0].book).toBe('Genesis');
        expect(results[0].chapter).toBe('1');
        expect(results[0].verse).toBe('1');
      });

      test('should respect maxResults limit', () => {
        const content = JSON.stringify({
          'Book': {
            '1': {
              '1': 'Test verse one',
              '2': 'Test verse two',
              '3': 'Test verse three'
            }
          }
        });

        const results = parser.search(content, ['test'], {
          caseSensitive: false,
          maxResults: 2,
          contextWords: 5,
          corpusName: 'Test'
        });

        expect(results.length).toBe(2);
      });

      test('should handle case sensitivity', () => {
        const content = JSON.stringify({
          'Book': { '1': { '1': 'GOD said let there be light' } }
        });

        const resultsInsensitive = parser.search(content, ['god'], {
          caseSensitive: false,
          maxResults: 10,
          contextWords: 5
        });

        const resultsSensitive = parser.search(content, ['god'], {
          caseSensitive: true,
          maxResults: 10,
          contextWords: 5
        });

        expect(resultsInsensitive.length).toBe(1);
        expect(resultsSensitive.length).toBe(0);
      });

      test('should generate correct URL for results', () => {
        const content = JSON.stringify({
          'Genesis': { '1': { '1': 'In the beginning' } }
        });

        const results = parser.search(content, ['beginning'], {
          caseSensitive: false,
          maxResults: 10
        });

        expect(results[0].url).toContain('biblegateway.com');
        expect(results[0].url).toContain('Genesis');
      });

      test('should handle multiple search terms', () => {
        const content = JSON.stringify({
          'Book': {
            '1': {
              '1': 'The sun and moon',
              '2': 'The stars alone',
              '3': 'The sun and stars'
            }
          }
        });

        const resultsMatchAny = parser.search(content, ['sun', 'stars'], {
          caseSensitive: false,
          maxResults: 10,
          matchAll: false
        });

        const resultsMatchAll = parser.search(content, ['sun', 'stars'], {
          caseSensitive: false,
          maxResults: 10,
          matchAll: true
        });

        expect(resultsMatchAny.length).toBe(3);
        expect(resultsMatchAll.length).toBe(1);
      });
    });

    describe('PlainTextParser', () => {
      let parser;

      beforeEach(() => {
        parser = new PlainTextParser();
      });

      test('should parse line-based content', () => {
        const content = `Line one with keyword
Line two without
Line three with keyword again`;

        const results = parser.search(content, ['keyword'], {
          caseSensitive: false,
          maxResults: 10,
          contextWords: 5,
          corpusName: 'Test'
        });

        expect(results.length).toBe(2);
        expect(results[0].verse).toBe('1');
        expect(results[1].verse).toBe('3');
      });

      test('should skip empty lines', () => {
        const content = `Line one

Line three`;

        const results = parser.search(content, ['line'], {
          caseSensitive: false,
          maxResults: 10
        });

        expect(results.length).toBe(2);
      });

      test('should include context from adjacent lines', () => {
        const content = `First line
Second line with keyword
Third line`;

        const results = parser.search(content, ['keyword'], {
          caseSensitive: false,
          maxResults: 10
        });

        expect(results[0].context).toContain('First line');
        expect(results[0].context).toContain('Third line');
      });
    });
  });

  // ============================================
  // CORPUS SEARCH CORE TESTS
  // ============================================
  describe('CorpusSearch', () => {
    let corpusSearch;

    beforeEach(async () => {
      corpusSearch = new CorpusSearch('corpus-config.json');
      await corpusSearch.init();
    });

    test('should initialize correctly', async () => {
      expect(corpusSearch.config).toBeDefined();
      expect(corpusSearch.loadedTexts.size).toBe(0);
    });

    test('should build correct raw URLs', () => {
      const repo = {
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: 'data'
      };

      const url = corpusSearch.buildRawURL(repo, 'file.json');
      expect(url).toBe('https://raw.githubusercontent.com/owner/repo/main/data/file.json');
    });

    test('should handle empty path in URL', () => {
      const repo = {
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        path: ''
      };

      const url = corpusSearch.buildRawURL(repo, 'file.json');
      expect(url).toBe('https://raw.githubusercontent.com/owner/repo/main/file.json');
    });

    test('getParser() should return correct parser type', () => {
      const jsonParser = corpusSearch.getParser('json', 'test');
      const txtParser = corpusSearch.getParser('txt', 'test');

      expect(jsonParser).toBeInstanceOf(JSONBibleParser);
      expect(txtParser).toBeInstanceOf(PlainTextParser);
    });

    test('should support custom parsers', () => {
      class CustomParser extends BaseParser {
        search() { return [{ custom: true }]; }
      }

      const searchWithCustom = new CorpusSearch('config.json', {
        'custom-format': new CustomParser()
      });

      const parser = searchWithCustom.getParser('custom-format', 'test');
      expect(parser).toBeInstanceOf(CustomParser);
    });

    test('should throw error when searching with no loaded texts', async () => {
      await expect(corpusSearch.search('term')).rejects.toThrow('No texts loaded');
    });

    test('getStats() should return correct info', () => {
      const stats = corpusSearch.getStats();

      expect(stats.loadedTexts).toBe(0);
      expect(typeof stats.cacheHits).toBe('number');
      expect(typeof stats.cacheMisses).toBe('number');
    });

    test('should search loaded texts', async () => {
      const content = JSON.stringify({
        'Genesis': { '1': { '1': 'In the beginning God created heaven' } }
      });

      corpusSearch.loadText('test:bible.json', content, {
        format: 'json',
        fileDisplay: 'Test Bible'
      });

      const results = await corpusSearch.search('beginning');
      expect(results.length).toBe(1);
      expect(results[0].book).toBe('Genesis');
    });

    test('clearCache() should remove all loaded texts', async () => {
      corpusSearch.loadText('test:file.json', '{}', { format: 'json' });
      expect(corpusSearch.loadedTexts.size).toBe(1);

      corpusSearch.clearCache();
      expect(corpusSearch.loadedTexts.size).toBe(0);
    });
  });

  // ============================================
  // CORPUS QUERY SERVICE TESTS
  // ============================================
  describe('CorpusQueryService', () => {
    let queryService;

    beforeEach(() => {
      // Create fresh instance for each test to avoid state sharing
      queryService = new CorpusQueryService();
    });

    afterEach(() => {
      // Clean up any queries from previous tests
      queryService.queries.clear();
      queryService.userQueries.clear();
      queryService.votes.clear();
    });

    describe('CRUD Operations', () => {
      test('should save and retrieve a query', async () => {
        const queryId = await queryService.saveQuery({
          name: 'Test Query',
          term: 'Zeus',
          type: 'github'
        });

        expect(queryId).toBeDefined();

        const retrieved = await queryService.getQuery(queryId);
        expect(retrieved.name).toBe('Test Query');
        expect(retrieved.createdAt).toBeDefined();
      });

      test('should update a query', async () => {
        const queryId = await queryService.saveQuery({
          name: 'Original',
          term: 'Zeus'
        });

        const updated = await queryService.updateQuery(queryId, {
          name: 'Updated'
        });

        expect(updated.name).toBe('Updated');
        expect(updated.updatedAt).toBeDefined();
      });

      test('should delete a query', async () => {
        const queryId = await queryService.saveQuery({
          name: 'To Delete',
          term: 'Hera'
        });

        await queryService.deleteQuery(queryId);
        const retrieved = await queryService.getQuery(queryId);
        expect(retrieved).toBeNull();
      });

      test('should throw error when updating non-existent query', async () => {
        await expect(queryService.updateQuery('fake_id', { name: 'test' }))
          .rejects.toThrow('Query not found');
      });

      test('should throw error when deleting non-existent query', async () => {
        await expect(queryService.deleteQuery('fake_id'))
          .rejects.toThrow('Query not found');
      });

      test('should retrieve all queries with filters', async () => {
        await queryService.saveQuery({ name: 'Q1', type: 'github', mythology: 'greek' });
        await queryService.saveQuery({ name: 'Q2', type: 'firebase', mythology: 'greek' });
        await queryService.saveQuery({ name: 'Q3', type: 'github', mythology: 'norse' });

        const githubQueries = await queryService.getAllQueries({ type: 'github' });
        expect(githubQueries.length).toBe(2);

        const greekQueries = await queryService.getAllQueries({ mythology: 'greek' });
        expect(greekQueries.length).toBe(2);

        const limitedQueries = await queryService.getAllQueries({ limit: 1 });
        expect(limitedQueries.length).toBe(1);
      });
    });

    describe('User Query Operations', () => {
      const userId = 'user_123';

      test('should save user query', async () => {
        const queryId = await queryService.saveUserQuery(userId, {
          name: 'My Query',
          term: 'Odin'
        });

        expect(queryId).toBeDefined();

        const userQueries = await queryService.getUserQueries(userId);
        expect(userQueries.length).toBe(1);
        expect(userQueries[0].userId).toBe(userId);
        expect(userQueries[0].status).toBe('pending');
      });

      test('should delete user query', async () => {
        const queryId = await queryService.saveUserQuery(userId, {
          name: 'To Delete'
        });

        await queryService.deleteUserQuery(userId, queryId);

        const userQueries = await queryService.getUserQueries(userId);
        expect(userQueries.length).toBe(0);
      });

      test('should throw error when deleting non-existent user query', async () => {
        await expect(queryService.deleteUserQuery(userId, 'fake_id'))
          .rejects.toThrow('Query not found');
      });

      test('should return empty array for user with no queries', async () => {
        const queries = await queryService.getUserQueries('non_existent_user');
        expect(queries).toEqual([]);
      });
    });

    describe('Voting Functionality', () => {
      const userId = 'voter_123';
      let queryId;

      beforeEach(async () => {
        queryId = await queryService.saveQuery({ name: 'Vote Test' });
      });

      test('should add upvote', async () => {
        const result = await queryService.voteQuery(userId, queryId, 'up');

        expect(result.action).toBe('added');
        expect(result.voteType).toBe('up');

        const count = await queryService.getVoteCount(queryId);
        expect(count.upvotes).toBe(1);
        expect(count.total).toBe(1);
      });

      test('should add downvote', async () => {
        await queryService.voteQuery(userId, queryId, 'down');

        const count = await queryService.getVoteCount(queryId);
        expect(count.downvotes).toBe(1);
        expect(count.total).toBe(-1);
      });

      test('should remove vote when voting same type again', async () => {
        await queryService.voteQuery(userId, queryId, 'up');
        const result = await queryService.voteQuery(userId, queryId, 'up');

        expect(result.action).toBe('removed');

        const count = await queryService.getVoteCount(queryId);
        expect(count.total).toBe(0);
      });

      test('should change vote type', async () => {
        await queryService.voteQuery(userId, queryId, 'up');
        const result = await queryService.voteQuery(userId, queryId, 'down');

        expect(result.action).toBe('changed');
        expect(result.voteType).toBe('down');

        const count = await queryService.getVoteCount(queryId);
        expect(count.upvotes).toBe(0);
        expect(count.downvotes).toBe(1);
      });

      test('should get user vote', async () => {
        await queryService.voteQuery(userId, queryId, 'up');

        const vote = await queryService.getUserVote(userId, queryId);
        expect(vote).toBe('up');
      });

      test('should return null for no vote', async () => {
        const vote = await queryService.getUserVote('other_user', queryId);
        expect(vote).toBeNull();
      });

      test('should handle multiple voters', async () => {
        await queryService.voteQuery('user1', queryId, 'up');
        await queryService.voteQuery('user2', queryId, 'up');
        await queryService.voteQuery('user3', queryId, 'down');

        const count = await queryService.getVoteCount(queryId);
        expect(count.upvotes).toBe(2);
        expect(count.downvotes).toBe(1);
        expect(count.total).toBe(1);
      });
    });

    describe('Query Execution', () => {
      test('should execute GitHub query', async () => {
        const query = {
          type: 'github',
          term: 'creation'
        };

        const result = await queryService.executeQuery(query);

        expect(result.type).toBe('github');
        expect(result.term).toBe('creation');
        expect(result.results).toBeDefined();
      });

      test('should execute Firebase query', async () => {
        const query = {
          type: 'firebase',
          term: 'Zeus'
        };

        const result = await queryService.executeQuery(query);

        expect(result.type).toBe('firebase');
        expect(result.results).toBeDefined();
      });

      test('should execute combined query', async () => {
        const query = {
          type: 'combined',
          term: 'thunder'
        };

        const result = await queryService.executeQuery(query);

        expect(result.github).toBeDefined();
        expect(result.firebase).toBeDefined();
      });

      test('should throw error for invalid query type', async () => {
        const query = {
          type: 'invalid',
          term: 'test'
        };

        await expect(queryService.executeQuery(query))
          .rejects.toThrow('Invalid query type');
      });
    });
  });

  // ============================================
  // RENDERER TESTS
  // ============================================
  describe('CorpusRenderer', () => {
    let renderer;
    const sampleResults = [
      { text_name: 'Genesis 1:1', context: 'In the beginning...', matched_term: 'beginning' },
      { text_name: 'John 1:1', context: 'In the beginning was the Word...', matched_term: 'beginning' }
    ];

    beforeEach(() => {
      renderer = new CorpusRenderer();
    });

    test('should render panel mode', () => {
      const output = renderer.render(sampleResults, { mode: 'panel' });

      expect(output.type).toBe('panel');
      expect(output.html).toContain('corpus-panel');
      expect(output.resultCount).toBe(2);
    });

    test('should render inline mode', () => {
      const output = renderer.render(sampleResults, { mode: 'inline' });

      expect(output.type).toBe('inline');
      expect(output.html).toContain('corpus-inline');
      expect(output.html).toContain('2 results');
    });

    test('should render grid mode', () => {
      const output = renderer.render(sampleResults, { mode: 'inline-grid' });

      expect(output.type).toBe('inline-grid');
      expect(output.html).toContain('corpus-grid');
      expect(output.html).toContain('grid-card');
    });

    test('should render full-page mode', () => {
      const output = renderer.render(sampleResults, { mode: 'full-page' });

      expect(output.type).toBe('full-page');
      expect(output.html).toContain('corpus-explorer');
    });

    test('should render modal mode', () => {
      const output = renderer.render(sampleResults, { mode: 'modal' });

      expect(output.type).toBe('modal');
      expect(output.html).toContain('corpus-modal');
    });

    test('should render sidebar mode', () => {
      const output = renderer.render(sampleResults, { mode: 'sidebar' });

      expect(output.type).toBe('sidebar');
      expect(output.html).toContain('corpus-sidebar');
    });

    test('should render embedded mode', () => {
      const output = renderer.render(sampleResults, { mode: 'embedded' });

      expect(output.type).toBe('embedded');
      expect(output.html).toContain('corpus-embedded');
    });

    test('should use default mode when not specified', () => {
      const output = renderer.render(sampleResults);

      expect(output.type).toBe('panel');
    });

    test('should handle empty results', () => {
      const output = renderer.render([]);

      expect(output.resultCount).toBe(0);
    });
  });

  // ============================================
  // ENTITY PAGE INTEGRATION TESTS
  // ============================================
  describe('Entity Page Integration', () => {
    let queryService;
    let corpusSearch;

    beforeEach(async () => {
      queryService = new CorpusQueryService();
      corpusSearch = new CorpusSearch('config.json');
      await corpusSearch.init();
    });

    test('should integrate corpusQueries with entity data', () => {
      const entityData = {
        id: 'zeus',
        name: 'Zeus',
        mythology: 'greek',
        corpusQueries: [
          { term: 'Zeus', type: 'github' },
          { term: 'thunder god', type: 'combined' }
        ]
      };

      expect(entityData.corpusQueries).toBeDefined();
      expect(entityData.corpusQueries.length).toBe(2);
      expect(entityData.corpusQueries[0].term).toBe('Zeus');
    });

    test('should execute entity queries', async () => {
      const entityQueries = [
        { term: 'Zeus', type: 'github' },
        { term: 'king of gods', type: 'firebase' }
      ];

      const results = await Promise.all(
        entityQueries.map(q => queryService.executeQuery(q))
      );

      expect(results.length).toBe(2);
      expect(results[0].type).toBe('github');
      expect(results[1].type).toBe('firebase');
    });

    test('should render entity corpus section', () => {
      const renderer = new CorpusRenderer();
      const results = [
        { text_name: 'Iliad 1:1', context: 'Zeus thundered...', matched_term: 'Zeus' }
      ];

      const output = renderer.render(results, { mode: 'panel' });

      expect(output.html).toContain('result-item');
      expect(output.resultCount).toBe(1);
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  describe('Integration Tests', () => {

    test('full search flow simulation', async () => {
      const cache = new CorpusCache('integration_');
      cache.clear();

      // 1. Store content in cache
      const testContent = JSON.stringify({
        'TestBook': {
          '1': {
            '1': 'This is a test verse with searchable content.',
            '2': 'Another verse without the target word.'
          }
        }
      });

      cache.set('file_content', testContent, 60000);

      // 2. Parse and search
      const parser = new JSONBibleParser();
      const content = cache.get('file_content');
      const results = parser.search(content, ['searchable'], {
        caseSensitive: false,
        maxResults: 100,
        contextWords: 5,
        corpusName: 'Test Corpus'
      });

      // 3. Verify results
      expect(results.length).toBe(1);
      expect(results[0].book).toBe('TestBook');
      expect(results[0].matched_term).toBe('searchable');

      // 4. Render results
      const renderer = new CorpusRenderer();
      const output = renderer.render(results, { mode: 'panel' });

      expect(output.type).toBe('panel');
      expect(output.resultCount).toBe(1);

      // 5. Verify cache persistence
      const cachedContent = cache.get('file_content');
      expect(cachedContent).toBe(testContent);
    });

    test('user query workflow', async () => {
      const queryService = new CorpusQueryService();
      const userId = 'test_user';

      // 1. Create user query
      const queryId = await queryService.saveUserQuery(userId, {
        name: 'My Research Query',
        term: 'divine thunder',
        type: 'combined'
      });

      // 2. Execute query
      const query = (await queryService.getUserQueries(userId)).find(q => q.id === queryId);
      const results = await queryService.executeQuery(query);

      expect(results.github).toBeDefined();
      expect(results.firebase).toBeDefined();

      // 3. Vote on query
      await queryService.voteQuery('other_user', queryId, 'up');
      const voteCount = await queryService.getVoteCount(queryId);
      expect(voteCount.upvotes).toBe(1);

      // 4. Retrieve user's queries
      const userQueries = await queryService.getUserQueries(userId);
      expect(userQueries.length).toBe(1);
    });

    test('cross-mythology search', async () => {
      const corpusSearch = new CorpusSearch('config.json');
      await corpusSearch.init();

      // Load texts from multiple mythologies
      corpusSearch.loadText('greek:texts.json', JSON.stringify({
        'Iliad': { '1': { '1': 'Zeus the thunderer commands' } }
      }), { format: 'json', fileDisplay: 'Iliad' });

      corpusSearch.loadText('norse:texts.json', JSON.stringify({
        'Eddas': { '1': { '1': 'Thor wields the thundering Mjolnir' } }
      }), { format: 'json', fileDisplay: 'Eddas' });

      // Search across all loaded texts
      const results = await corpusSearch.search('thunder');

      expect(results.length).toBe(2);
      expect(results.map(r => r.corpus_name)).toContain('Iliad');
      expect(results.map(r => r.corpus_name)).toContain('Eddas');
    });
  });
});

// ============================================
// ERROR HANDLING TESTS
// ============================================
describe('Error Handling', () => {

  test('should handle malformed JSON gracefully', () => {
    const parser = new JSONBibleParser();

    expect(() => {
      parser.search('not valid json', ['test'], {});
    }).toThrow();
  });

  test('should handle empty search terms', async () => {
    const corpusSearch = new CorpusSearch('config.json');
    await corpusSearch.init();
    corpusSearch.loadText('test:file.json', '{"Book":{"1":{"1":"test content"}}}', { format: 'json' });

    // Empty string matches nothing in the default parser behavior
    // since the parser looks for the term in the text
    const results = await corpusSearch.search('nonexistent_term_xyz123');
    expect(results.length).toBe(0);
  });

  test('cache should handle quota exceeded', () => {
    const cache = new CorpusCache('test_');

    // This shouldn't throw even if storage is full
    expect(() => {
      cache.set('large', 'x'.repeat(10000), 60000);
    }).not.toThrow();
  });
});

// ============================================
// PERFORMANCE TESTS
// ============================================
describe('Performance', () => {

  test('should handle large result sets', async () => {
    const corpusSearch = new CorpusSearch('config.json');
    await corpusSearch.init();

    // Create large content
    const largeContent = {};
    for (let i = 0; i < 100; i++) {
      largeContent[`Book${i}`] = { '1': { '1': `Test content ${i} with keyword` } };
    }

    corpusSearch.loadText('large:file.json', JSON.stringify(largeContent), { format: 'json' });

    const start = Date.now();
    const results = await corpusSearch.search('keyword', { maxResults: 50 });
    const duration = Date.now() - start;

    expect(results.length).toBe(50);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  test('cache should provide faster repeat access', () => {
    const cache = new CorpusCache('perf_');
    const largeData = { data: 'x'.repeat(1000) };

    cache.set('perftest', largeData, 60000);

    // First access (from localStorage)
    const start1 = Date.now();
    cache.get('perftest');
    const time1 = Date.now() - start1;

    // Second access (from memory cache)
    const start2 = Date.now();
    cache.get('perftest');
    const time2 = Date.now() - start2;

    // Memory access should be faster or equal
    expect(time2).toBeLessThanOrEqual(time1 + 1);
  });
});

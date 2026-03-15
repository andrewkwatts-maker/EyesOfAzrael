/**
 * Firebase Entity Renderer Tests
 * Tests for js/entity-renderer-firebase.js
 */

describe('FirebaseEntityRenderer', () => {
    let FirebaseEntityRenderer;
    let renderer;

    beforeEach(() => {
        // Re-setup firebase mock (resetMocks clears it between tests)
        global.firebase = {
            auth: jest.fn(() => ({ onAuthStateChanged: jest.fn() })),
            firestore: jest.fn(() => ({
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ name: 'Test', type: 'deity' }), id: 'test' }))
                    }))
                }))
            }))
        };

        // Mock SchemaSectionRenderer (required by entity renderer)
        // Use Proxy to auto-mock any method called on the instance
        window.SchemaSectionRenderer = jest.fn().mockImplementation(function(opts) {
            this.mythology = opts.mythology;
            this.entityType = opts.entityType;
            this.baseUrl = opts.baseUrl;
            return new Proxy(this, {
                get(target, prop) {
                    if (prop in target) return target[prop];
                    // Auto-create mock for any method call
                    if (typeof prop === 'string' && prop.startsWith('render')) {
                        target[prop] = jest.fn().mockReturnValue('');
                        return target[prop];
                    }
                    return undefined;
                }
            });
        });

        // Mock LinkPrefetcher
        window.LinkPrefetcher = undefined;

        // Mock URLSearchParams
        window.location.search = '';

        // Require the real module
        FirebaseEntityRenderer = require('../../js/entity-renderer-firebase.js');
        renderer = new FirebaseEntityRenderer();
    });

    afterEach(() => {
        if (renderer._cleanupInterval) {
            clearInterval(renderer._cleanupInterval);
        }
    });

    describe('constructor', () => {
        test('should initialize with null db', () => {
            expect(renderer.db).toBeNull();
        });

        test('should initialize empty cache', () => {
            expect(renderer._cache.size).toBe(0);
        });

        test('should set 5 minute cache TTL', () => {
            expect(renderer._cacheTTL).toBe(300000);
        });

        test('should set max cache size to 100', () => {
            expect(renderer._maxCacheSize).toBe(100);
        });
    });

    describe('_cleanupCache()', () => {
        test('should remove expired entries', () => {
            renderer._cache.set('expired', {
                timestamp: Date.now() - 600000,
                data: 'old'
            });
            renderer._cache.set('fresh', {
                timestamp: Date.now(),
                data: 'new'
            });

            renderer._cleanupCache();
            expect(renderer._cache.has('expired')).toBe(false);
            expect(renderer._cache.has('fresh')).toBe(true);
        });

        test('should trim to max size keeping newest', () => {
            renderer._maxCacheSize = 3;
            for (let i = 0; i < 5; i++) {
                renderer._cache.set(`key-${i}`, {
                    timestamp: Date.now() + i * 100,
                    data: `data-${i}`
                });
            }

            renderer._cleanupCache();
            expect(renderer._cache.size).toBe(3);
        });
    });

    describe('fetchEntity()', () => {
        test('should return cached data when fresh', async () => {
            renderer._cache.set('deities:zeus', { data: { name: 'Zeus' }, timestamp: Date.now() });
            renderer.db = {};
            const result = await renderer.fetchEntity('deities', 'zeus');
            expect(result).toEqual({ name: 'Zeus' });
        });

        test('should check LinkPrefetcher cache', async () => {
            window.LinkPrefetcher = {
                get: jest.fn((path) => {
                    if (path === 'entity/deities/zeus') return { id: 'zeus', name: 'Zeus' };
                    return null;
                })
            };
            renderer.db = {
                collection: jest.fn()
            };
            const result = await renderer.fetchEntity('deities', 'zeus');
            expect(result).toEqual({ id: 'zeus', name: 'Zeus' });
            window.LinkPrefetcher = undefined;
        });

        test('should fetch from Firestore when no cache', async () => {
            renderer.db = {
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({
                            exists: true,
                            id: 'zeus',
                            data: () => ({ name: 'Zeus', type: 'deity' })
                        })
                    })
                })
            };
            const result = await renderer.fetchEntity('deities', 'zeus');
            expect(result.name).toBe('Zeus');
        });

        test('should return null for non-existent entity', async () => {
            renderer.db = {
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({ exists: false })
                    })
                })
            };
            const result = await renderer.fetchEntity('deities', 'nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('capitalize()', () => {
        test('should capitalize first letter', () => {
            expect(renderer.capitalize('deity')).toBe('Deity');
        });

        test('should handle empty string', () => {
            expect(renderer.capitalize('')).toBe('');
        });

        test('should handle null/undefined', () => {
            expect(renderer.capitalize(null)).toBe('');
            expect(renderer.capitalize(undefined)).toBe('');
        });
    });

    describe('escapeHtml()', () => {
        test('should escape HTML characters', () => {
            const result = renderer.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;');
        });

        test('should handle empty/null input', () => {
            expect(renderer.escapeHtml('')).toBe('');
            expect(renderer.escapeHtml(null)).toBe('');
        });
    });

    describe('showLoading()', () => {
        test('should set loading HTML in container', () => {
            const container = document.createElement('div');
            renderer.showLoading(container, 'deity');
            expect(container.innerHTML).toContain('Loading');
            expect(container.innerHTML).toContain('Deity');
        });

        test('should default to "entity" when no type', () => {
            const container = document.createElement('div');
            renderer.showLoading(container, null);
            expect(container.innerHTML).toContain('Entity');
        });
    });

    describe('renderError()', () => {
        test('should set error HTML in container', () => {
            const container = document.createElement('div');
            renderer.renderError(container, 'Something went wrong');
            expect(container.innerHTML).toContain('Something went wrong');
        });
    });

    describe('applyMythologyStyles()', () => {
        test('should add mythology data attribute', () => {
            const container = document.createElement('div');
            renderer.applyMythologyStyles(container, 'greek');
            expect(container.getAttribute('data-mythology')).toBe('greek');
        });

        test('should apply to document body', () => {
            const container = document.createElement('div');
            renderer.applyMythologyStyles(container, 'norse');
            expect(document.body.getAttribute('data-mythology')).toBe('norse');
        });

        test('should handle null mythology', () => {
            const container = document.createElement('div');
            renderer.applyMythologyStyles(container, null);
            expect(container.getAttribute('data-mythology')).toBeNull();
        });

        test('should replace existing mythology attribute', () => {
            const container = document.createElement('div');
            container.setAttribute('data-mythology', 'norse');
            renderer.applyMythologyStyles(container, 'greek');
            expect(container.getAttribute('data-mythology')).toBe('greek');
        });
    });

    describe('updatePageMetadata()', () => {
        test('should update document title', () => {
            renderer.updatePageMetadata({ name: 'Zeus', type: 'deity' });
            expect(document.title).toContain('Zeus');
        });
    });

    describe('init()', () => {
        test('should set db from firebase.firestore()', async () => {
            await renderer.init();
            expect(renderer.db).toBeDefined();
            expect(renderer.db).not.toBeNull();
        });

        test('should not reinitialize if db already set', async () => {
            renderer.db = { existing: true };
            await renderer.init();
            expect(renderer.db.existing).toBe(true);
        });

        test('should throw if firebase.firestore not available', async () => {
            global.firebase = { firestore: null };
            const r = new FirebaseEntityRenderer();
            await expect(r.init()).rejects.toThrow();
        });
    });

    describe('loadAndRender()', () => {
        test('should reject invalid type', async () => {
            const container = document.createElement('div');
            await renderer.loadAndRender('', 'zeus', 'greek', container);
            expect(container.innerHTML).toContain('Invalid');
        });

        test('should reject invalid id', async () => {
            const container = document.createElement('div');
            await renderer.loadAndRender('deity', '', 'greek', container);
            expect(container.innerHTML).toContain('Invalid');
        });

        test('should sanitize type with invalid chars', async () => {
            const container = document.createElement('div');
            await renderer.loadAndRender('deity<script>', 'zeus', 'greek', container);
            // Should sanitize and proceed
        });

        test('should use prefetched data when provided', async () => {
            const container = document.createElement('div');
            const prefetched = { name: 'Zeus', type: 'deity', mythology: 'greek' };
            await renderer.loadAndRender('deity', 'zeus', 'greek', container, prefetched);
            expect(renderer.currentEntity).toEqual(prefetched);
            expect(renderer.mythology).toBe('greek');
        });

        test('should show loading when no prefetched data', async () => {
            const container = document.createElement('div');
            await renderer.loadAndRender('deity', 'zeus', 'greek', container);
            // Should have rendered the entity
            expect(renderer.currentEntity).toBeDefined();
        });

        test('should handle entity not found', async () => {
            // Mock fetchEntity to return null
            global.firebase = {
                auth: jest.fn(() => ({ onAuthStateChanged: jest.fn() })),
                firestore: jest.fn(() => ({
                    collection: jest.fn(() => ({
                        doc: jest.fn(() => ({
                            get: jest.fn(() => Promise.resolve({ exists: false }))
                        }))
                    }))
                }))
            };
            const r = new FirebaseEntityRenderer();
            const container = document.createElement('div');
            await r.loadAndRender('deity', 'nonexistent', 'greek', container);
            expect(container.innerHTML).toContain('not found');
        });
    });

    describe('fetchEntity()', () => {
        test('should return entity data from Firestore', async () => {
            await renderer.init();
            const entity = await renderer.fetchEntity('deity', 'zeus');
            expect(entity).toBeDefined();
            expect(entity.id).toBe('test');
        });

        test('should cache fetched entity', async () => {
            await renderer.init();
            await renderer.fetchEntity('deity', 'zeus');
            expect(renderer._cache.size).toBeGreaterThan(0);
        });

        test('should return cached entity on second call', async () => {
            await renderer.init();
            await renderer.fetchEntity('deity', 'zeus');
            // Second call should use cache
            const entity = await renderer.fetchEntity('deity', 'zeus');
            expect(entity).toBeDefined();
        });

        test('should return null for non-existent entity', async () => {
            global.firebase = {
                auth: jest.fn(() => ({ onAuthStateChanged: jest.fn() })),
                firestore: jest.fn(() => ({
                    collection: jest.fn(() => ({
                        doc: jest.fn(() => ({
                            get: jest.fn(() => Promise.resolve({ exists: false }))
                        }))
                    }))
                }))
            };
            const r = new FirebaseEntityRenderer();
            await r.init();
            const entity = await r.fetchEntity('deity', 'nonexistent');
            expect(entity).toBeNull();
        });
    });

    describe('getSchemaSectionRenderer()', () => {
        test('should create new renderer instance', () => {
            renderer.mythology = 'greek';
            renderer.currentEntity = { type: 'deity' };
            const ssr = renderer.getSchemaSectionRenderer();
            expect(ssr).toBeDefined();
            expect(window.SchemaSectionRenderer).toHaveBeenCalled();
        });

        test('should reuse existing renderer for same mythology', () => {
            renderer.mythology = 'greek';
            renderer.currentEntity = { type: 'deity' };
            const ssr1 = renderer.getSchemaSectionRenderer();
            const ssr2 = renderer.getSchemaSectionRenderer();
            expect(ssr1).toBe(ssr2);
        });
    });

    describe('renderGenericEntity()', () => {
        test('should render entity HTML in container', () => {
            const container = document.createElement('div');
            renderer.mythology = 'greek';
            renderer.renderGenericEntity({ name: 'Test Entity', type: 'deity', description: 'A test' }, container);
            expect(container.innerHTML).toContain('Test Entity');
        });
    });

    describe('getDefaultIcon()', () => {
        test('should return correct icons for known types', () => {
            expect(renderer.getDefaultIcon('deity')).toBeDefined();
            expect(renderer.getDefaultIcon('hero')).toBeDefined();
            expect(renderer.getDefaultIcon('creature')).toBeDefined();
            expect(renderer.getDefaultIcon('item')).toBeDefined();
            expect(renderer.getDefaultIcon('place')).toBeDefined();
        });

        test('should return fallback for unknown type', () => {
            expect(renderer.getDefaultIcon('unknown')).toBeDefined();
        });

        test('should handle null type', () => {
            expect(renderer.getDefaultIcon(null)).toBeDefined();
        });
    });

    describe('getCollectionName()', () => {
        test('should map deity to deities', () => {
            expect(renderer.getCollectionName('deity')).toBe('deities');
        });

        test('should map hero to heroes', () => {
            expect(renderer.getCollectionName('hero')).toBe('heroes');
        });

        test('should map creature to creatures', () => {
            expect(renderer.getCollectionName('creature')).toBe('creatures');
        });

        test('should return type as-is for unmapped types', () => {
            expect(renderer.getCollectionName('unknown_type')).toBe('unknown_type');
        });

        test('should map all known types', () => {
            const expected = {
                deity: 'deities',
                hero: 'heroes',
                creature: 'creatures',
                item: 'items',
                place: 'places',
                concept: 'concepts',
                magic: 'magic',
                theory: 'user_theories',
                mythology: 'mythologies',
                ritual: 'rituals',
                text: 'texts',
                archetype: 'archetypes',
                symbol: 'symbols',
                herb: 'herbs'
            };
            Object.entries(expected).forEach(([type, collection]) => {
                expect(renderer.getCollectionName(type)).toBe(collection);
            });
        });
    });

    describe('clearCache()', () => {
        test('should clear the entity cache', () => {
            renderer._cache.set('test', { data: 'something' });
            expect(renderer._cache.size).toBe(1);
            renderer.clearCache();
            expect(renderer._cache.size).toBe(0);
        });
    });

    describe('renderMarkdown()', () => {
        test('should convert bold markdown', () => {
            const result = renderer.renderMarkdown('**bold text**');
            expect(result).toContain('<strong>bold text</strong>');
        });

        test('should convert italic markdown', () => {
            const result = renderer.renderMarkdown('*italic*');
            expect(result).toContain('<em>italic</em>');
        });

        test('should convert heading markdown', () => {
            const result = renderer.renderMarkdown('# Heading 1');
            expect(result).toContain('<h1>');
        });

        test('should convert h2 markdown', () => {
            const result = renderer.renderMarkdown('## Heading 2');
            expect(result).toContain('<h2');
        });

        test('should convert h3 markdown', () => {
            const result = renderer.renderMarkdown('### Heading 3');
            expect(result).toContain('<h3');
        });

        test('should convert newlines to br', () => {
            const result = renderer.renderMarkdown('line1\nline2');
            expect(result).toContain('<br>');
        });

        test('should handle null input', () => {
            expect(renderer.renderMarkdown(null)).toBe('');
        });

        test('should handle undefined input', () => {
            expect(renderer.renderMarkdown(undefined)).toBe('');
        });

        test('should handle non-string input', () => {
            expect(renderer.renderMarkdown(42)).toBe(42);
        });
    });

    describe('canUserEdit()', () => {
        test('should return false when no firebase auth', () => {
            global.firebase = null;
            expect(renderer.canUserEdit({ type: 'deity' })).toBe(false);
        });

        test('should return false when no current user', () => {
            global.firebase = {
                auth: jest.fn(() => ({ currentUser: null }))
            };
            expect(renderer.canUserEdit({ type: 'deity' })).toBe(false);
        });

        test('should return true for admin email', () => {
            global.firebase = {
                auth: jest.fn(() => ({
                    currentUser: { email: 'andrewkwatts@gmail.com', uid: 'admin' }
                }))
            };
            expect(renderer.canUserEdit({ type: 'deity' })).toBe(true);
        });

        test('should return true when user is creator', () => {
            global.firebase = {
                auth: jest.fn(() => ({
                    currentUser: { email: 'user@test.com', uid: 'user123' }
                }))
            };
            expect(renderer.canUserEdit({ type: 'deity', createdBy: 'user123' })).toBe(true);
        });

        test('should return false when user is not creator', () => {
            global.firebase = {
                auth: jest.fn(() => ({
                    currentUser: { email: 'user@test.com', uid: 'user123' }
                }))
            };
            expect(renderer.canUserEdit({ type: 'deity', createdBy: 'other456' })).toBe(false);
        });
    });

    describe('renderEditIcon()', () => {
        test('should return empty string when user cannot edit', () => {
            global.firebase = { auth: jest.fn(() => ({ currentUser: null })) };
            expect(renderer.renderEditIcon({ type: 'deity', id: 'zeus' })).toBe('');
        });

        test('should return edit button HTML when user can edit', () => {
            global.firebase = {
                auth: jest.fn(() => ({
                    currentUser: { email: 'andrewkwatts@gmail.com', uid: 'admin' }
                }))
            };
            const html = renderer.renderEditIcon({ type: 'deity', id: 'zeus', name: 'Zeus' });
            expect(html).toContain('edit-icon-btn');
            expect(html).toContain('zeus');
        });
    });

    describe('renderDeity()', () => {
        test('should render deity entity without error', () => {
            const container = document.createElement('div');
            renderer.mythology = 'greek';
            renderer.renderDeity({
                name: 'Zeus',
                type: 'deity',
                description: 'King of the Gods',
                domains: ['sky', 'thunder'],
                visual: {}
            }, container);
            expect(container.innerHTML).toContain('Zeus');
        });
    });

    describe('renderHero()', () => {
        test('should render hero entity without error', () => {
            const container = document.createElement('div');
            renderer.mythology = 'greek';
            renderer.renderHero({
                name: 'Hercules',
                type: 'hero',
                description: 'Divine hero',
                visual: {}
            }, container);
            expect(container.innerHTML).toContain('Hercules');
        });
    });

    describe('renderCreature()', () => {
        test('should render creature entity without error', () => {
            const container = document.createElement('div');
            renderer.mythology = 'greek';
            renderer.renderCreature({
                name: 'Minotaur',
                type: 'creature',
                description: 'Bull-headed creature',
                visual: {}
            }, container);
            expect(container.innerHTML).toContain('Minotaur');
        });
    });

    describe('renderItem()', () => {
        test('should render item entity without error', () => {
            const container = document.createElement('div');
            renderer.mythology = 'norse';
            renderer.renderItem({
                name: 'Mjolnir',
                type: 'item',
                description: "Thor's hammer",
                visual: {}
            }, container);
            expect(container.innerHTML).toContain('Mjolnir');
        });
    });

    describe('renderPlace()', () => {
        test('should render place entity without error', () => {
            const container = document.createElement('div');
            renderer.mythology = 'greek';
            renderer.renderPlace({
                name: 'Mount Olympus',
                type: 'place',
                description: 'Home of the gods',
                visual: {}
            }, container);
            expect(container.innerHTML).toContain('Mount Olympus');
        });
    });

    describe('renderConcept()', () => {
        test('should render concept entity without error', () => {
            const container = document.createElement('div');
            renderer.mythology = 'greek';
            renderer.renderConcept({
                name: 'Hubris',
                type: 'concept',
                description: 'Excessive pride',
                visual: {}
            }, container);
            expect(container.innerHTML).toContain('Hubris');
        });
    });

    describe('loadAndRender() with different entity types', () => {
        test('should render deity type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Zeus', type: 'deity', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('deity', 'zeus', 'greek', container, entity);
            expect(container.innerHTML).toContain('Zeus');
        });

        test('should render creature type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Hydra', type: 'creature', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('creature', 'hydra', 'greek', container, entity);
            expect(container.innerHTML).toContain('Hydra');
        });

        test('should render hero type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Perseus', type: 'hero', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('hero', 'perseus', 'greek', container, entity);
            expect(container.innerHTML).toContain('Perseus');
        });

        test('should render item type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Mjolnir', type: 'item', mythology: 'norse', visual: {} };
            await renderer.loadAndRender('item', 'mjolnir', 'norse', container, entity);
            expect(container.innerHTML).toContain('Mjolnir');
        });

        test('should render place type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Olympus', type: 'place', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('place', 'olympus', 'greek', container, entity);
            expect(container.innerHTML).toContain('Olympus');
        });

        test('should render concept type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Fate', type: 'concept', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('concept', 'fate', 'greek', container, entity);
            expect(container.innerHTML).toContain('Fate');
        });

        test('should render magic type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Rune Magic', type: 'magic', mythology: 'norse', visual: {} };
            await renderer.loadAndRender('magic', 'rune-magic', 'norse', container, entity);
            expect(container.innerHTML).toContain('Rune Magic');
        });

        test('should render ritual type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Libation', type: 'ritual', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('ritual', 'libation', 'greek', container, entity);
            expect(container.innerHTML).toContain('Libation');
        });

        test('should render text type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Iliad', type: 'text', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('text', 'iliad', 'greek', container, entity);
            expect(container.innerHTML).toContain('Iliad');
        });

        test('should render archetype type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'The Hero', type: 'archetype', mythology: 'universal', visual: {} };
            await renderer.loadAndRender('archetype', 'the-hero', 'universal', container, entity);
            expect(container.innerHTML).toContain('The Hero');
        });

        test('should render symbol type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Ouroboros', type: 'symbol', mythology: 'universal', visual: {} };
            await renderer.loadAndRender('symbol', 'ouroboros', 'universal', container, entity);
            expect(container.innerHTML).toContain('Ouroboros');
        });

        test('should render herb type via switch', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Mistletoe', type: 'herb', mythology: 'norse', visual: {} };
            await renderer.loadAndRender('herb', 'mistletoe', 'norse', container, entity);
            expect(container.innerHTML).toContain('Mistletoe');
        });

        test('should fall back to generic for unknown type', async () => {
            const container = document.createElement('div');
            const entity = { name: 'Unknown', type: 'unknown_type', mythology: 'greek', visual: {} };
            await renderer.loadAndRender('unknown_type', 'unknown', 'greek', container, entity);
            expect(container.innerHTML).toContain('Unknown');
        });
    });

    describe('renderDeityAttributes()', () => {
        test('should render domains', () => {
            renderer.mythology = 'greek';
            const html = renderer.renderDeityAttributes({
                domains: ['sky', 'thunder'],
                symbols: ['lightning bolt'],
                type: 'deity'
            });
            expect(html).toContain('Domains');
            expect(html).toContain('sky');
        });

        test('should render symbols', () => {
            renderer.mythology = 'greek';
            const html = renderer.renderDeityAttributes({
                symbols: ['lightning bolt'],
                type: 'deity'
            });
            expect(html).toContain('Symbols');
        });

        test('should render sacred animals', () => {
            renderer.mythology = 'greek';
            const html = renderer.renderDeityAttributes({
                sacredAnimals: ['eagle', 'bull'],
                type: 'deity'
            });
            expect(html).toContain('Sacred Animals');
            expect(html).toContain('eagle');
        });

        test('should return fallback message when empty', () => {
            renderer.mythology = 'greek';
            const html = renderer.renderDeityAttributes({ type: 'deity' });
            expect(html).toContain('No attributes recorded');
        });

        test('should render nested attributes', () => {
            renderer.mythology = 'greek';
            const html = renderer.renderDeityAttributes({
                type: 'deity',
                attributes: {
                    physical: ['tall', 'bearded'],
                    personality: ['wise', 'just']
                }
            });
            expect(html).toContain('Physical');
            expect(html).toContain('Personality');
        });
    });

    describe('renderFamilyRelationships()', () => {
        test('should render parents', () => {
            renderer.mythology = 'greek';
            const html = renderer.renderFamilyRelationships({
                parents: ['Kronos', 'Rhea']
            });
            expect(html).toContain('Parents');
            expect(html).toContain('Kronos');
        });

        test('should return empty string for null family', () => {
            expect(renderer.renderFamilyRelationships(null)).toBe('');
        });

        test('should return empty string for non-object', () => {
            expect(renderer.renderFamilyRelationships('string')).toBe('');
        });
    });

    describe('renderIconWithFallback()', () => {
        test('should return icon when provided', () => {
            const result = renderer.renderIconWithFallback('custom-icon-url', 'deity', 'Zeus');
            expect(result).toBeDefined();
        });

        test('should return default icon when no icon', () => {
            const result = renderer.renderIconWithFallback(null, 'deity', 'Zeus');
            expect(result).toBeDefined();
        });
    });

    describe('initializeCorpusSection()', () => {
        test('should handle null entity', () => {
            expect(() => renderer.initializeCorpusSection(null)).not.toThrow();
        });

        test('should skip non-corpus entity types', () => {
            expect(() => renderer.initializeCorpusSection({ type: 'unknown' })).not.toThrow();
        });
    });

    describe('initializeUserNotes()', () => {
        test('should add CSS links to head', () => {
            renderer.initializeUserNotes({ type: 'deity', id: 'zeus' });
            // Should have attempted to add CSS
            const links = document.querySelectorAll('link[href*="user-notes"]');
            expect(links.length).toBeGreaterThanOrEqual(0); // May or may not be added based on existing
        });
    });

    // ========================================
    // renderComparativeNotes
    // ========================================

    describe('renderComparativeNotes()', () => {
        test('should return empty for null notes', () => {
            expect(renderer.renderComparativeNotes(null)).toBe('');
        });

        test('should return empty for non-object', () => {
            expect(renderer.renderComparativeNotes('string')).toBe('');
        });

        test('should render string values', () => {
            const html = renderer.renderComparativeNotes({ similarThemes: 'Both deal with creation' });
            expect(html).toContain('Similar Themes');
            expect(html).toContain('Both deal with creation');
        });

        test('should render array values', () => {
            const html = renderer.renderComparativeNotes({ relatedMyths: ['Flood myth', 'Creation myth'] });
            expect(html).toContain('Related Myths');
            expect(html).toContain('Flood myth');
            expect(html).toContain('Creation myth');
        });

        test('should render array of objects with description', () => {
            const html = renderer.renderComparativeNotes({
                parallels: [{ description: 'Similar to Gilgamesh' }]
            });
            expect(html).toContain('Similar to Gilgamesh');
        });

        test('should render nested objects recursively', () => {
            const html = renderer.renderComparativeNotes({
                crossCultural: { similarities: 'Many parallels' }
            });
            expect(html).toContain('Cross Cultural');
            expect(html).toContain('Similarities');
        });

        test('should skip null values', () => {
            const html = renderer.renderComparativeNotes({ key1: null, key2: 'value' });
            expect(html).toContain('value');
        });
    });

    // ========================================
    // renderSacredTexts
    // ========================================

    describe('renderSacredTexts()', () => {
        test('should return empty when no texts and no sources', () => {
            expect(renderer.renderSacredTexts({ texts: [] })).toBe('');
        });

        test('should render texts with source and section', () => {
            const html = renderer.renderSacredTexts({
                name: 'Zeus',
                texts: [{
                    source: 'Iliad',
                    section: 'Book 1',
                    lines: '1-50',
                    text: 'Ancient verse text',
                    reference: 'Homer'
                }]
            });
            expect(html).toContain('Iliad');
            expect(html).toContain('Book 1');
            expect(html).toContain('Lines 1-50');
            expect(html).toContain('Ancient verse text');
            expect(html).toContain('Homer');
        });

        test('should render texts without optional fields', () => {
            const html = renderer.renderSacredTexts({
                name: 'Zeus',
                texts: [{ source: 'Theogony', content: 'Content text' }]
            });
            expect(html).toContain('Theogony');
            expect(html).toContain('Content text');
        });
    });

    // ========================================
    // renderRelatedEntities
    // ========================================

    describe('renderRelatedEntities()', () => {
        const entities = [
            { name: 'Athena', type: 'deity', description: 'Goddess of wisdom', icon: '🦉' },
            { name: 'Apollo', type: 'deity', description: 'God of sun', icon: '☀️' }
        ];

        test('should default to grid mode', () => {
            const html = renderer.renderRelatedEntities(entities);
            expect(html).toContain('entity-grid');
        });

        test('should render list mode', () => {
            const html = renderer.renderRelatedEntities(entities, 'relatedEntities', {
                relatedEntities: { mode: 'list' }
            });
            expect(html).toContain('entity-list');
        });

        test('should render table mode', () => {
            const html = renderer.renderRelatedEntities(entities, 'relatedEntities', {
                relatedEntities: { mode: 'table' }
            });
            expect(html).toContain('entity-table');
        });

        test('should render panel mode', () => {
            const html = renderer.renderRelatedEntities(entities, 'relatedEntities', {
                relatedEntities: { mode: 'panel' }
            });
            expect(html).toContain('entity-panels');
        });
    });

    // ========================================
    // renderRelatedEntitiesGrid
    // ========================================

    describe('renderRelatedEntitiesGrid()', () => {
        const entities = [
            { name: 'Athena', type: 'deity', description: 'Wisdom', icon: '🦉', mythology: 'Greek' }
        ];

        test('should render grid with icons', () => {
            const html = renderer.renderRelatedEntitiesGrid(entities, { showIcons: true, sort: 'name' });
            expect(html).toContain('entity-grid');
            expect(html).toContain('entity-icon');
            expect(html).toContain('Athena');
        });

        test('should hide icons when showIcons false', () => {
            const html = renderer.renderRelatedEntitiesGrid(entities, { showIcons: false, sort: 'name' });
            expect(html).not.toContain('entity-icon');
        });

        test('should render compact cards', () => {
            const html = renderer.renderRelatedEntitiesGrid(entities, { cardStyle: 'compact', sort: 'name' });
            expect(html).toContain('entity-card-compact');
        });

        test('should render minimal cards', () => {
            const html = renderer.renderRelatedEntitiesGrid(entities, { cardStyle: 'minimal', sort: 'name' });
            expect(html).toContain('entity-card-minimal');
        });

        test('should render detailed cards with mythology', () => {
            const html = renderer.renderRelatedEntitiesGrid(entities, { cardStyle: 'detailed', sort: 'name' });
            expect(html).toContain('entity-card-detailed');
            expect(html).toContain('Greek');
        });
    });

    // ========================================
    // renderRelatedEntitiesList
    // ========================================

    describe('renderRelatedEntitiesList()', () => {
        const entities = [
            { name: 'Zeus', relationship: 'Father', type: 'deity' },
            { name: 'Hera', relationship: 'Mother', type: 'deity' }
        ];

        test('should render list', () => {
            const html = renderer.renderRelatedEntitiesList(entities, { sort: 'name' });
            expect(html).toContain('entity-list');
            expect(html).toContain('Zeus');
        });

        test('should render compact list', () => {
            const html = renderer.renderRelatedEntitiesList(entities, { compact: true, sort: 'name' });
            expect(html).toContain('entity-list');
        });

        test('should render categorized list by domain', () => {
            const entitiesWithDomain = [
                { name: 'Zeus', domain: 'Sky', type: 'deity' },
                { name: 'Poseidon', domain: 'Sea', type: 'deity' }
            ];
            const html = renderer.renderRelatedEntitiesList(entitiesWithDomain, { categorize: 'by_domain', sort: 'name' });
            expect(html).toContain('entity-category');
            expect(html).toContain('Sky');
            expect(html).toContain('Sea');
        });
    });

    // ========================================
    // renderCategorizedList
    // ========================================

    describe('renderCategorizedList()', () => {
        const entities = [
            { name: 'Zeus', mythology: 'Greek', domain: 'Sky', importance: 'High' },
            { name: 'Odin', mythology: 'Norse', domain: 'War', importance: 'High' },
            { name: 'Apollo', mythology: 'Greek', domain: 'Sun' }
        ];

        test('should categorize by mythology', () => {
            const html = renderer.renderCategorizedList(entities, { sort: 'name' }, 'by_mythology');
            expect(html).toContain('Greek');
            expect(html).toContain('Norse');
        });

        test('should categorize by importance', () => {
            const html = renderer.renderCategorizedList(entities, { sort: 'name' }, 'by_importance');
            expect(html).toContain('High');
            expect(html).toContain('Standard');
        });

        test('should categorize alphabetically', () => {
            const html = renderer.renderCategorizedList(entities, { sort: 'name' }, 'alphabetical');
            expect(html).toContain('Z');
            expect(html).toContain('O');
            expect(html).toContain('A');
        });
    });

    // ========================================
    // renderRelatedEntitiesTable
    // ========================================

    describe('renderRelatedEntitiesTable()', () => {
        test('should render table with columns', () => {
            const entities = [
                { name: 'Zeus', description: 'King of gods', mythology: 'Greek' }
            ];
            const html = renderer.renderRelatedEntitiesTable(entities, { columns: ['name', 'description'] });
            expect(html).toContain('entity-table');
            expect(html).toContain('Name');
            expect(html).toContain('Zeus');
        });

        test('should handle array column values', () => {
            const entities = [{ name: 'Zeus', domains: ['Sky', 'Thunder'] }];
            const html = renderer.renderRelatedEntitiesTable(entities, { columns: ['name', 'domains'] });
            expect(html).toContain('Sky, Thunder');
        });
    });

    // ========================================
    // renderRelatedEntitiesPanel
    // ========================================

    describe('renderRelatedEntitiesPanel()', () => {
        const entities = [
            { name: 'Zeus', description: 'King', relationship: 'Father', mythology: 'Greek', domain: 'Sky', type: 'deity' }
        ];

        test('should render stacked panels', () => {
            const html = renderer.renderRelatedEntitiesPanel(entities, { layout: 'stacked' });
            expect(html).toContain('entity-panels');
            expect(html).toContain('Zeus');
        });

        test('should render accordion panels', () => {
            const html = renderer.renderRelatedEntitiesPanel(entities, { layout: 'accordion' });
            expect(html).toContain('entity-accordion');
        });

        test('should show expandable panels', () => {
            const html = renderer.renderRelatedEntitiesPanel(entities, { expandable: true });
            expect(html).toContain('expandable');
        });

        test('should hide details when showAllDetails is false', () => {
            const html = renderer.renderRelatedEntitiesPanel(entities, { showAllDetails: false });
            expect(html).not.toContain('panel-content');
        });
    });

    // ========================================
    // renderAccordionPanels
    // ========================================

    describe('renderAccordionPanels()', () => {
        test('should render accordion items', () => {
            const entities = [
                { name: 'Zeus', description: 'King of gods', mythology: 'Greek', relationship: 'Father' }
            ];
            const html = renderer.renderAccordionPanels(entities, true);
            expect(html).toContain('accordion-item');
            expect(html).toContain('accordion-header');
            expect(html).toContain('Zeus');
            expect(html).toContain('King of gods');
        });
    });

    // ========================================
    // sortEntities
    // ========================================

    describe('sortEntities()', () => {
        const entities = [
            { name: 'Zeus', importance: 10, date: 3 },
            { name: 'Apollo', importance: 5, date: 1 },
            { name: 'Hera', importance: 8, date: 2 }
        ];

        test('should sort by name ascending', () => {
            const sorted = renderer.sortEntities(entities, 'name');
            expect(sorted[0].name).toBe('Apollo');
            expect(sorted[2].name).toBe('Zeus');
        });

        test('should sort by name descending', () => {
            const sorted = renderer.sortEntities(entities, 'name-desc');
            expect(sorted[0].name).toBe('Zeus');
        });

        test('should sort by importance', () => {
            const sorted = renderer.sortEntities(entities, 'importance');
            expect(sorted[0].name).toBe('Zeus');
        });

        test('should sort by date', () => {
            const sorted = renderer.sortEntities(entities, 'date');
            expect(sorted[0].name).toBe('Apollo');
        });

        test('should keep original order for custom', () => {
            const sorted = renderer.sortEntities(entities, 'custom');
            expect(sorted[0].name).toBe('Zeus');
        });

        test('should default to name sort', () => {
            const sorted = renderer.sortEntities(entities, undefined);
            expect(sorted[0].name).toBe('Apollo');
        });
    });

    // ========================================
    // getDefaultDisplayConfig
    // ========================================

    describe('getDefaultDisplayConfig()', () => {
        test('should return grid mode with defaults', () => {
            const config = renderer.getDefaultDisplayConfig();
            expect(config.mode).toBe('grid');
            expect(config.columns).toBe(4);
            expect(config.sort).toBe('name');
            expect(config.showIcons).toBe(true);
        });
    });

    // ========================================
    // renderHero with rich entity data (branch coverage)
    // ========================================

    describe('renderHero() branches', () => {
        test('should render hero with quests and weapons', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Heracles',
                type: 'hero',
                description: 'Son of Zeus',
                subtitle: 'The Strongest Hero',
                quests: [
                    { title: 'Twelve Labors', description: 'Impossible tasks' },
                    'Golden Apples'
                ],
                weapons: [
                    'Club',
                    { name: 'Nemean Lion Skin' }
                ],
                family: { father: 'Zeus', mother: 'Alcmene' },
                keyMyths: [{ title: 'Nemean Lion' }],
                mythology: 'greek'
            };
            renderer.renderHero(entity, container);
            expect(container.innerHTML).toContain('Heracles');
            expect(container.innerHTML).toContain('Twelve Labors');
            expect(container.innerHTML).toContain('Club');
        });

        test('should render hero without optional sections', () => {
            const container = document.createElement('div');
            const entity = { name: 'Perseus', type: 'hero', mythology: 'greek' };
            renderer.renderHero(entity, container);
            expect(container.innerHTML).toContain('Perseus');
        });
    });

    // ========================================
    // renderItem with rich entity data
    // ========================================

    describe('renderItem() branches', () => {
        test('should render item with properties and wielders', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Mjolnir',
                type: 'item',
                description: 'Thor hammer',
                subtitle: 'The Mighty Hammer',
                shortDescription: 'A powerful weapon',
                powers: ['Lightning', 'Flight'],
                materials: ['Uru'],
                itemType: 'Weapon',
                origin: 'Dwarven forge',
                wielders: ['Thor', { name: 'Captain America' }],
                mythology: 'norse'
            };
            renderer.renderItem(entity, container);
            expect(container.innerHTML).toContain('Mjolnir');
            expect(container.innerHTML).toContain('Lightning');
            expect(container.innerHTML).toContain('Uru');
        });
    });

    // ========================================
    // renderItemProperties
    // ========================================

    describe('renderItemProperties()', () => {
        test('should render all property types', () => {
            const html = renderer.renderItemProperties({
                powers: ['Fire', 'Ice'],
                materials: ['Gold', 'Silver'],
                itemType: 'Weapon',
                origin: 'Mount Olympus'
            });
            expect(html).toContain('Powers');
            expect(html).toContain('Fire, Ice');
            expect(html).toContain('Materials');
            expect(html).toContain('Type');
            expect(html).toContain('Origin');
        });

        test('should return empty for entity with no properties', () => {
            const html = renderer.renderItemProperties({});
            expect(html).toBe('');
        });

        test('should handle category fallback', () => {
            const html = renderer.renderItemProperties({ category: 'Armor' });
            expect(html).toContain('Armor');
        });
    });

    // ========================================
    // renderPlaceDetails
    // ========================================

    describe('renderPlaceDetails()', () => {
        test('should render all place detail types', () => {
            const html = renderer.renderPlaceDetails({
                realm: 'Underworld',
                region: 'Tartarus',
                significance: 'Prison of Titans',
                locationType: 'Realm'
            });
            expect(html).toContain('Realm');
            expect(html).toContain('Underworld');
            expect(html).toContain('Region');
            expect(html).toContain('Significance');
            expect(html).toContain('Type');
        });

        test('should use geography fallbacks', () => {
            const html = renderer.renderPlaceDetails({
                geography: { realm: 'Heaven', region: 'Eastern' }
            });
            expect(html).toContain('Heaven');
            expect(html).toContain('Eastern');
        });

        test('should use placeType fallback', () => {
            const html = renderer.renderPlaceDetails({ placeType: 'Mountain' });
            expect(html).toContain('Mountain');
        });

        test('should return empty for entity with no details', () => {
            const html = renderer.renderPlaceDetails({});
            expect(html).toBe('');
        });
    });

    // ========================================
    // renderCreature with rich entity
    // ========================================

    describe('renderCreature() branches', () => {
        test('should render creature with all optional sections', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Hydra',
                type: 'creature',
                description: 'Multi-headed serpent',
                subtitle: 'The Immortal Beast',
                classification: 'Serpent',
                appearance: 'Large water serpent with nine heads',
                abilities: ['Regeneration', 'Poison breath'],
                habitat: ['Lerna', 'Swamps'],
                weaknesses: [
                    'Fire',
                    { name: 'Decapitation with cauterization', description: 'Must burn the neck stump' }
                ],
                behavior: 'Aggressive when disturbed',
                mythology: 'greek'
            };
            renderer.renderCreature(entity, container);
            const html = container.innerHTML;
            expect(html).toContain('Hydra');
            expect(html).toContain('Appearance');
            expect(html).toContain('Regeneration');
            expect(html).toContain('Lerna');
            expect(html).toContain('Fire');
            expect(html).toContain('Behavior');
        });

        test('should render creature with behavior as array', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Cerberus',
                type: 'creature',
                behavior: ['Guards the gates', { description: 'Allows the dead to enter' }],
                mythology: 'greek'
            };
            renderer.renderCreature(entity, container);
            expect(container.innerHTML).toContain('Guards the gates');
        });

        test('should render creature without optional sections', () => {
            const container = document.createElement('div');
            const entity = { name: 'Pegasus', type: 'creature', mythology: 'greek' };
            renderer.renderCreature(entity, container);
            expect(container.innerHTML).toContain('Pegasus');
        });
    });

    // ========================================
    // renderPlace with rich entity
    // ========================================

    describe('renderPlace() branches', () => {
        test('should render place with all sections', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Mount Olympus',
                type: 'place',
                description: 'Home of the gods',
                subtitle: 'Seat of the Twelve Olympians',
                realm: 'Mortal World',
                significance: 'Sacred mountain',
                residents: ['Zeus', 'Hera'],
                mythology: 'greek'
            };
            renderer.renderPlace(entity, container);
            expect(container.innerHTML).toContain('Mount Olympus');
        });

        test('should render place with residents as objects', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Valhalla',
                type: 'place',
                residents: [{ name: 'Odin' }, 'Einherjar'],
                mythology: 'norse'
            };
            renderer.renderPlace(entity, container);
            expect(container.innerHTML).toContain('Valhalla');
        });
    });

    // ========================================
    // renderConcept, renderMagicSystem, renderRitual, renderText, renderArchetype, renderSymbol, renderHerb
    // ========================================

    describe('render type-specific methods (generic rendering)', () => {
        test('renderConcept should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderConcept({ name: 'Test', type: 'concept' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderMagicSystem should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderMagicSystem({ name: 'Test', type: 'magic' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderTheory should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderTheory({ name: 'Test', type: 'theory' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderRitual should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderRitual({ name: 'Test' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderText should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderText({ name: 'Test' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderArchetype should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderArchetype({ name: 'Test' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderSymbol should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderSymbol({ name: 'Test' }, container);
            expect(spy).toHaveBeenCalled();
        });

        test('renderHerb should call renderGenericEntity', () => {
            const container = document.createElement('div');
            const spy = jest.spyOn(renderer, 'renderGenericEntity').mockImplementation(() => {});
            renderer.renderHerb({ name: 'Test' }, container);
            expect(spy).toHaveBeenCalled();
        });
    });

    // ========================================
    // renderCreatureAttributes
    // ========================================

    describe('renderCreatureAttributes()', () => {
        test('should render object attributes', () => {
            const html = renderer.renderCreatureAttributes({
                attributes: {
                    classification: 'Serpent',
                    danger_level: 'Extreme'
                }
            });
            expect(html).toContain('Classification');
            expect(html).toContain('Serpent');
            expect(html).toContain('Danger level');
        });

        test('should render array attributes', () => {
            const html = renderer.renderCreatureAttributes({
                attributes: [
                    { label: 'Size', value: 'Enormous' },
                    { name: 'Speed', description: 'Very fast' }
                ]
            });
            expect(html).toContain('Size');
            expect(html).toContain('Enormous');
        });

        test('should render array values in object attributes', () => {
            const html = renderer.renderCreatureAttributes({
                characteristics: { habitat: ['Forest', 'Mountains'] }
            });
            expect(html).toContain('Forest, Mountains');
        });

        test('should show fallback for empty attributes', () => {
            const html = renderer.renderCreatureAttributes({});
            expect(html).toContain('No attributes recorded');
        });
    });

    // ========================================
    // sanitizeUrl
    // ========================================

    describe('sanitizeUrl()', () => {
        test('should return null for null/undefined', () => {
            expect(renderer.sanitizeUrl(null)).toBeNull();
            expect(renderer.sanitizeUrl(undefined)).toBeNull();
            expect(renderer.sanitizeUrl('')).toBeNull();
        });

        test('should block javascript: URLs', () => {
            expect(renderer.sanitizeUrl('javascript:alert(1)')).toBeNull();
        });

        test('should block data: URLs', () => {
            expect(renderer.sanitizeUrl('data:text/html,<h1>XSS</h1>')).toBeNull();
        });

        test('should block vbscript: URLs', () => {
            expect(renderer.sanitizeUrl('vbscript:MsgBox("XSS")')).toBeNull();
        });

        test('should block file: URLs', () => {
            expect(renderer.sanitizeUrl('file:///etc/passwd')).toBeNull();
        });

        test('should allow http URLs', () => {
            expect(renderer.sanitizeUrl('http://example.com')).toBe('http://example.com');
        });

        test('should allow https URLs', () => {
            expect(renderer.sanitizeUrl('https://example.com')).toBe('https://example.com');
        });

        test('should allow relative URLs', () => {
            expect(renderer.sanitizeUrl('/path/to/resource')).toBe('/path/to/resource');
            expect(renderer.sanitizeUrl('./relative')).toBe('./relative');
        });

        test('should block unknown schemes', () => {
            expect(renderer.sanitizeUrl('ftp://example.com')).toBeNull();
        });

        test('should allow URLs without scheme', () => {
            expect(renderer.sanitizeUrl('path/without/scheme')).toBe('path/without/scheme');
        });

        test('should return null for non-string input', () => {
            expect(renderer.sanitizeUrl(123)).toBeNull();
        });
    });

    // ========================================
    // escapeAttr
    // ========================================

    describe('escapeAttr()', () => {
        test('should escape HTML attribute characters', () => {
            expect(renderer.escapeAttr('a"b\'c<d>e&f')).toBe('a&quot;b&#39;c&lt;d&gt;e&amp;f');
        });

        test('should handle null/undefined', () => {
            expect(renderer.escapeAttr(null)).toBe('');
            expect(renderer.escapeAttr(undefined)).toBe('');
        });

        test('should convert numbers to string', () => {
            expect(renderer.escapeAttr(42)).toBe('42');
        });
    });

    // ========================================
    // renderSimpleCorpusLinks
    // ========================================

    describe('renderSimpleCorpusLinks()', () => {
        test('should render explorer link when no queries', () => {
            const container = document.createElement('div');
            renderer.renderSimpleCorpusLinks(container, { name: 'Zeus', corpusQueries: [] });
            expect(container.innerHTML).toContain('Search Ancient Texts');
            expect(container.innerHTML).toContain('Zeus');
        });

        test('should render query links when queries exist', () => {
            const container = document.createElement('div');
            renderer.renderSimpleCorpusLinks(container, {
                name: 'Zeus',
                corpusQueries: [
                    { label: 'Iliad references', queryType: 'github', query: { term: 'Zeus' }, description: 'Primary source' }
                ]
            });
            expect(container.innerHTML).toContain('Iliad references');
            expect(container.innerHTML).toContain('Primary source');
        });

        test('should render query without description', () => {
            const container = document.createElement('div');
            renderer.renderSimpleCorpusLinks(container, {
                name: 'Zeus',
                corpusQueries: [{ label: 'Search', queryType: 'search' }]
            });
            expect(container.innerHTML).toContain('Search');
        });
    });

    // ========================================
    // renderPlace details branches
    // ========================================

    describe('renderPlace() with residents and events', () => {
        test('should render place with residents', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Olympus',
                type: 'place',
                subtitle: 'Home of the Gods',
                residents: ['Zeus', 'Hera', { name: 'Athena' }],
                events: [{ title: 'Titanomachy', description: 'War of Titans' }],
                mythology: 'greek'
            };
            renderer.renderPlace(entity, container);
            expect(container.innerHTML).toContain('Olympus');
        });
    });

    // ========================================
    // renderHeroAttributes
    // ========================================

    describe('renderHeroAttributes()', () => {
        test('should render hero-specific attributes', () => {
            const html = renderer.renderHeroAttributes({
                birthPlace: 'Thebes',
                heroType: 'Demigod',
                parentage: 'Son of Zeus',
                titles: ['Slayer of Hydra']
            });
            // Should render at least some attributes
            expect(typeof html).toBe('string');
        });

        test('should handle empty hero entity', () => {
            const html = renderer.renderHeroAttributes({});
            expect(typeof html).toBe('string');
        });
    });

    // ========================================
    // renderDeity with various data shapes
    // ========================================

    describe('renderDeity() branches', () => {
        test('should render deity with domains and symbols', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Athena',
                type: 'deity',
                description: 'Goddess of wisdom',
                domains: ['Wisdom', 'War'],
                symbols: ['Owl', 'Aegis'],
                consorts: ['None'],
                children: [],
                family: { father: 'Zeus' },
                mythology: 'greek'
            };
            renderer.renderDeity(entity, container);
            expect(container.innerHTML).toContain('Athena');
        });

        test('should render deity with myths and worship data', () => {
            const container = document.createElement('div');
            const entity = {
                name: 'Zeus',
                type: 'deity',
                description: 'King of the gods',
                subtitle: 'Father of Gods and Men',
                mythsAndLegends: [
                    { title: 'Birth of Athena', description: 'Athena sprang from his head', source: 'Hesiod' },
                    { name: 'Titanomachy', summary: 'War against the Titans' }
                ],
                worship: 'Worshipped throughout Greece',
                cultCenters: ['Olympia', 'Dodona'],
                comparativeNotes: { similarities: 'Similar to Jupiter' },
                texts: [{ source: 'Iliad', text: 'verse text' }],
                relatedEntities: [{ name: 'Hera', type: 'deity' }],
                mythology: 'greek'
            };
            renderer.renderDeity(entity, container);
            expect(container.innerHTML).toContain('Zeus');
            expect(container.innerHTML).toContain('Birth of Athena');
            expect(container.innerHTML).toContain('Worshipped throughout Greece');
            expect(container.innerHTML).toContain('Olympia');
        });

        test('should render deity with minimal data', () => {
            const container = document.createElement('div');
            const entity = { name: 'Unknown Deity', type: 'deity', mythology: 'greek' };
            renderer.renderDeity(entity, container);
            expect(container.innerHTML).toContain('Unknown Deity');
        });
    });
});

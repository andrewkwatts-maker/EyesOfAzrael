/**
 * Unit Tests for FirebaseEntityRenderer
 */

describe('FirebaseEntityRenderer', () => {
    let renderer;
    let mockDb;
    let container;

    beforeEach(() => {
        // Create mock database
        mockDb = new MockFirestore();
        mockDb.queryDelay = 10;

        // Seed test data
        mockDb.seed('deities', {
            'zeus': {
                id: 'zeus',
                name: 'Zeus',
                type: 'deity',
                mythology: 'greek',
                description: 'King of the gods',
                domains: ['sky', 'thunder', 'justice'],
                symbols: ['thunderbolt', 'eagle'],
                family: {
                    parents: ['Kronos', 'Rhea'],
                    consorts: ['Hera'],
                    children: ['Athena', 'Apollo', 'Artemis']
                },
                importance: 100
            }
        });

        // Mock Firebase global
        window.firebase = {
            firestore: () => mockDb
        };

        // Create container
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // Create renderer
        renderer = new FirebaseEntityRenderer();
    });

    afterEach(() => {
        container.remove();
        delete window.firebase;
    });

    describe('Initialization', () => {
        it('should initialize without errors', () => {
            expect(renderer).toBeDefined();
            expect(renderer.db).toBeNull();
            expect(renderer.currentEntity).toBeNull();
        });

        it('should initialize database on init()', async () => {
            await renderer.init();
            expect(renderer.db).toBeDefined();
        });
    });

    describe('Entity Loading', () => {
        beforeEach(async () => {
            await renderer.init();
        });

        it('should fetch entity from database', async () => {
            const entity = await renderer.fetchEntity('deity', 'zeus');

            expect(entity).toBeDefined();
            expect(entity.id).toBe('zeus');
            expect(entity.name).toBe('Zeus');
        });

        it('should return null for non-existent entity', async () => {
            const entity = await renderer.fetchEntity('deity', 'nonexistent');
            expect(entity).toBeNull();
        });

        it('should load and render deity', async () => {
            await renderer.loadAndRender('deity', 'zeus', 'greek', container);

            expect(container.innerHTML).toContain('Zeus');
            expect(container.innerHTML).toContain('King of the gods');
        });

        it('should handle errors gracefully', async () => {
            await renderer.loadAndRender('deity', 'nonexistent', 'greek', container);

            expect(container.innerHTML).toContain('Error');
            expect(container.innerHTML).toContain('not found');
        });
    });

    describe('Deity Rendering', () => {
        let zeusEntity;

        beforeEach(async () => {
            await renderer.init();
            zeusEntity = await renderer.fetchEntity('deity', 'zeus');
        });

        it('should render deity header', () => {
            renderer.renderDeity(zeusEntity, container);

            expect(container.innerHTML).toContain('Zeus');
            expect(container.innerHTML).toContain('King of the gods');
        });

        it('should render deity attributes', () => {
            renderer.renderDeity(zeusEntity, container);

            expect(container.innerHTML).toContain('Domains');
            expect(container.innerHTML).toContain('sky');
            expect(container.innerHTML).toContain('Symbols');
            expect(container.innerHTML).toContain('thunderbolt');
        });

        it('should render family relationships', () => {
            renderer.renderDeity(zeusEntity, container);

            expect(container.innerHTML).toContain('Family');
            expect(container.innerHTML).toContain('Kronos');
            expect(container.innerHTML).toContain('Hera');
            expect(container.innerHTML).toContain('Athena');
        });

        it('should escape HTML to prevent XSS', () => {
            zeusEntity.name = '<script>alert("xss")</script>';
            renderer.renderDeity(zeusEntity, container);

            expect(container.innerHTML).not.toContain('<script>');
            expect(container.innerHTML).toContain('&lt;script&gt;');
        });
    });

    describe('Related Entities Rendering', () => {
        const relatedEntities = [
            { id: '1', name: 'Entity 1', icon: '⚡', mythology: 'greek' },
            { id: '2', name: 'Entity 2', icon: '🏛️', mythology: 'greek' },
            { id: '3', name: 'Entity 3', icon: '⚔️', mythology: 'greek' }
        ];

        beforeEach(async () => {
            await renderer.init();
        });

        it('should render grid mode by default', () => {
            const html = renderer.renderRelatedEntities(relatedEntities);
            expect(html).toContain('entity-grid');
            expect(html).toContain('Entity 1');
        });

        it('should render list mode', () => {
            const config = { mode: 'list' };
            const html = renderer.renderRelatedEntities(relatedEntities, 'relatedEntities', { relatedEntities: config });

            expect(html).toContain('entity-list');
        });

        it('should render table mode', () => {
            const config = { mode: 'table' };
            const html = renderer.renderRelatedEntities(relatedEntities, 'relatedEntities', { relatedEntities: config });

            expect(html).toContain('entity-table');
        });

        it('should render panel mode', () => {
            const config = { mode: 'panel' };
            const html = renderer.renderRelatedEntities(relatedEntities, 'relatedEntities', { relatedEntities: config });

            expect(html).toContain('entity-panel');
        });

        it('should sort entities by name', () => {
            const unsorted = [
                { name: 'Zeta' },
                { name: 'Alpha' },
                { name: 'Beta' }
            ];

            const sorted = renderer.sortEntities(unsorted, 'name');
            expect(sorted[0].name).toBe('Alpha');
            expect(sorted[2].name).toBe('Zeta');
        });

        it('should sort entities by importance', () => {
            const entities = [
                { name: 'Low', importance: 50 },
                { name: 'High', importance: 100 },
                { name: 'Medium', importance: 75 }
            ];

            const sorted = renderer.sortEntities(entities, 'importance');
            expect(sorted[0].name).toBe('High');
            expect(sorted[2].name).toBe('Low');
        });
    });

    describe('Mythology Styling', () => {
        beforeEach(async () => {
            await renderer.init();
        });

        it('should apply mythology attribute to container', () => {
            renderer.applyMythologyStyles(container, 'greek');
            expect(container.getAttribute('data-mythology')).toBe('greek');
        });

        it('should load mythology colors CSS', () => {
            renderer.applyMythologyStyles(container, 'norse');

            const link = document.querySelector('link[href*="mythology-colors.css"]');
            expect(link).toBeDefined();
        });
    });

    describe('Markdown Rendering', () => {
        beforeEach(async () => {
            await renderer.init();
        });

        it('should render headings', () => {
            const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
            const html = renderer.renderMarkdown(markdown);

            expect(html).toContain('<h1>Heading 1</h1>');
            expect(html).toContain('<h2');
            expect(html).toContain('<h3');
        });

        it('should render bold text', () => {
            const markdown = '**bold text**';
            const html = renderer.renderMarkdown(markdown);

            expect(html).toContain('<strong>bold text</strong>');
        });

        it('should render italic text', () => {
            const markdown = '*italic text*';
            const html = renderer.renderMarkdown(markdown);

            expect(html).toContain('<em>italic text</em>');
        });

        it('should convert newlines to breaks', () => {
            const markdown = 'Line 1\nLine 2';
            const html = renderer.renderMarkdown(markdown);

            expect(html).toContain('<br>');
        });
    });

    describe('Helper Methods', () => {
        it('should get correct collection name', () => {
            expect(renderer.getCollectionName('deity')).toBe('deities');
            expect(renderer.getCollectionName('hero')).toBe('heroes');
            expect(renderer.getCollectionName('creature')).toBe('creatures');
        });

        it('should capitalize strings', () => {
            expect(renderer.capitalize('greek')).toBe('Greek');
            expect(renderer.capitalize('NORSE')).toBe('NORSE');
            expect(renderer.capitalize('')).toBe('');
        });

        it('should escape HTML', () => {
            const html = '<script>alert("xss")</script>';
            const escaped = renderer.escapeHtml(html);

            expect(escaped).not.toContain('<script>');
            expect(escaped).toContain('&lt;');
        });

        it('should get default icons', () => {
            expect(renderer.getDefaultIcon('deity')).toBe('⚡');
            expect(renderer.getDefaultIcon('hero')).toBe('🗡️');
            expect(renderer.getDefaultIcon('creature')).toBe('🐉');
        });
    });

    describe('Page Metadata', () => {
        beforeEach(async () => {
            await renderer.init();
        });

        it('should update page title', () => {
            const entity = { name: 'Zeus', type: 'deity' };
            renderer.mythology = 'greek';
            renderer.updatePageMetadata(entity);

            expect(document.title).toContain('Zeus');
            expect(document.title).toContain('Greek');
        });

        it('should update meta description', () => {
            const entity = {
                name: 'Zeus',
                description: 'King of the gods'
            };
            renderer.mythology = 'greek';
            renderer.updatePageMetadata(entity);

            const metaDesc = document.querySelector('meta[name="description"]');
            expect(metaDesc.content).toContain('King of the gods');
        });
    });
});

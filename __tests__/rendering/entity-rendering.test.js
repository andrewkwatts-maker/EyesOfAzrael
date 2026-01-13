/**
 * Entity Rendering Tests
 * Comprehensive tests for entity rendering logic
 * Validates that all metadata fields are properly rendered
 */

describe('Entity Rendering', () => {
    let mockEntity;
    let mockContainer;

    beforeEach(() => {
        // Create comprehensive mock entity with all possible metadata
        mockEntity = {
            id: 'zeus',
            name: 'Zeus',
            type: 'deity',
            mythology: 'greek',
            title: 'King of the Gods',
            description: 'Zeus is the sky and thunder god in ancient Greek religion.',
            icon: '\u26A1', // Lightning bolt
            domains: ['sky', 'thunder', 'lightning', 'justice'],
            epithets: ['Cloud-Gatherer', 'Father of Gods and Men', 'Thunderer'],
            symbols: ['thunderbolt', 'eagle', 'oak'],
            attributes: {
                primaryAttribute: 'Power over sky and storms',
                secondaryAttribute: 'Divine justice'
            },
            family: {
                parents: [
                    { id: 'cronos', name: 'Cronos', type: 'deity' },
                    { id: 'rhea', name: 'Rhea', type: 'deity' }
                ],
                consorts: [
                    { id: 'hera', name: 'Hera', type: 'deity' }
                ],
                children: [
                    { id: 'athena', name: 'Athena', type: 'deity' },
                    { id: 'apollo', name: 'Apollo', type: 'deity' },
                    { id: 'hermes', name: 'Hermes', type: 'deity' }
                ]
            },
            relatedEntities: [
                { id: 'poseidon', name: 'Poseidon', type: 'deity', relationship: 'brother' },
                { id: 'hades', name: 'Hades', type: 'deity', relationship: 'brother' }
            ],
            crossCulturalParallels: [
                { id: 'jupiter', name: 'Jupiter', mythology: 'roman' },
                { id: 'odin', name: 'Odin', mythology: 'norse' }
            ],
            sources: [
                { title: 'Theogony', author: 'Hesiod' },
                { title: 'Iliad', author: 'Homer' }
            ],
            notes: 'Primary deity of the Greek pantheon',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
        };

        // Create mock container
        mockContainer = document.createElement('div');
        mockContainer.id = 'test-container';
        document.body.appendChild(mockContainer);
    });

    afterEach(() => {
        if (mockContainer.parentNode) {
            mockContainer.parentNode.removeChild(mockContainer);
        }
    });

    describe('Basic Metadata Rendering', () => {
        it('should render entity name correctly', () => {
            const html = renderEntityBasic(mockEntity);
            expect(html).toContain('Zeus');
        });

        it('should render entity title if present', () => {
            const html = renderEntityBasic(mockEntity);
            expect(html).toContain('King of the Gods');
        });

        it('should render description', () => {
            const html = renderEntityBasic(mockEntity);
            expect(html).toContain('sky and thunder god');
        });

        it('should render icon/emoji', () => {
            const html = renderEntityBasic(mockEntity);
            expect(html).toContain('\u26A1'); // Lightning bolt
        });

        it('should handle missing optional fields gracefully', () => {
            const minimalEntity = {
                id: 'test',
                name: 'Test Entity',
                type: 'deity'
            };
            const html = renderEntityBasic(minimalEntity);
            expect(html).toContain('Test Entity');
            expect(html).not.toContain('undefined');
            expect(html).not.toContain('null');
        });
    });

    describe('Domains and Attributes Rendering', () => {
        it('should render all domains as tags', () => {
            const html = renderEntityDetails(mockEntity);

            expect(html).toContain('sky');
            expect(html).toContain('thunder');
            expect(html).toContain('lightning');
            expect(html).toContain('justice');
        });

        it('should render epithets', () => {
            const html = renderEntityDetails(mockEntity);

            expect(html).toContain('Cloud-Gatherer');
            expect(html).toContain('Father of Gods and Men');
            expect(html).toContain('Thunderer');
        });

        it('should render symbols', () => {
            const html = renderEntityDetails(mockEntity);

            expect(html).toContain('thunderbolt');
            expect(html).toContain('eagle');
            expect(html).toContain('oak');
        });
    });

    describe('Family Relationships Rendering', () => {
        it('should render parents', () => {
            const html = renderEntityFamily(mockEntity);

            expect(html).toContain('Cronos');
            expect(html).toContain('Rhea');
        });

        it('should render consorts', () => {
            const html = renderEntityFamily(mockEntity);
            expect(html).toContain('Hera');
        });

        it('should render children', () => {
            const html = renderEntityFamily(mockEntity);

            expect(html).toContain('Athena');
            expect(html).toContain('Apollo');
            expect(html).toContain('Hermes');
        });

        it('should create proper links for family members', () => {
            const html = renderEntityFamily(mockEntity);

            expect(html).toContain('href="#');
            expect(html).toContain('cronos');
        });

        it('should handle empty family gracefully', () => {
            const entityNoFamily = { ...mockEntity, family: {} };
            const html = renderEntityFamily(entityNoFamily);

            expect(html).not.toContain('undefined');
            expect(html).not.toContain('null');
        });
    });

    describe('Related Entities Rendering', () => {
        it('should render related entities with relationships', () => {
            const html = renderEntityRelations(mockEntity);

            expect(html).toContain('Poseidon');
            expect(html).toContain('brother');
            expect(html).toContain('Hades');
        });

        it('should render cross-cultural parallels', () => {
            const html = renderEntityRelations(mockEntity);

            expect(html).toContain('Jupiter');
            expect(html).toContain('roman');
            expect(html).toContain('Odin');
            expect(html).toContain('norse');
        });
    });

    describe('Sources Rendering', () => {
        it('should render source titles', () => {
            const html = renderEntitySources(mockEntity);

            expect(html).toContain('Theogony');
            expect(html).toContain('Iliad');
        });

        it('should render source authors', () => {
            const html = renderEntitySources(mockEntity);

            expect(html).toContain('Hesiod');
            expect(html).toContain('Homer');
        });

        it('should handle sources without authors', () => {
            const entityPartialSources = {
                ...mockEntity,
                sources: [{ title: 'Unknown Source' }]
            };
            const html = renderEntitySources(entityPartialSources);

            expect(html).toContain('Unknown Source');
            expect(html).not.toContain('undefined');
        });
    });

    describe('HTML Escaping', () => {
        it('should escape HTML in name', () => {
            const maliciousEntity = {
                ...mockEntity,
                name: '<script>alert("xss")</script>Zeus'
            };
            const html = renderEntityBasic(maliciousEntity);

            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
        });

        it('should escape HTML in description', () => {
            const maliciousEntity = {
                ...mockEntity,
                description: 'Test <img src=x onerror=alert(1)> description'
            };
            const html = renderEntityBasic(maliciousEntity);

            // Should escape < and > so the tag doesn't execute
            expect(html).toContain('&lt;img');
            expect(html).toContain('&gt;');
            // The raw < should not appear (would be executable)
            expect(html).not.toContain('<img');
        });

        it('should escape HTML in domains', () => {
            const maliciousEntity = {
                ...mockEntity,
                domains: ['<script>evil</script>']
            };
            const html = renderEntityDetails(maliciousEntity);

            expect(html).not.toContain('<script>evil</script>');
        });
    });

    describe('Edge Cases', () => {
        it('should handle entity with no optional fields', () => {
            const minimalEntity = {
                id: 'minimal',
                name: 'Minimal Entity',
                type: 'concept'
            };

            const html = renderEntityBasic(minimalEntity);
            expect(html).toContain('Minimal Entity');
        });

        it('should handle empty arrays gracefully', () => {
            const emptyArraysEntity = {
                ...mockEntity,
                domains: [],
                epithets: [],
                symbols: [],
                sources: []
            };

            const html = renderEntityDetails(emptyArraysEntity);
            expect(html).not.toContain('undefined');
        });

        it('should handle null values in nested objects', () => {
            const nullNestedEntity = {
                ...mockEntity,
                family: {
                    parents: null,
                    children: null
                }
            };

            expect(() => renderEntityFamily(nullNestedEntity)).not.toThrow();
        });

        it('should handle very long text content', () => {
            const longDescription = 'A'.repeat(10000);
            const longEntity = {
                ...mockEntity,
                description: longDescription
            };

            const html = renderEntityBasic(longEntity);
            expect(html.length).toBeGreaterThan(0);
        });
    });
});

// Helper render functions that simulate actual rendering logic
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderEntityBasic(entity) {
    return `
        <div class="entity-header">
            <span class="entity-icon">${escapeHtml(entity.icon || '')}</span>
            <h1 class="entity-name">${escapeHtml(entity.name)}</h1>
            ${entity.title ? `<p class="entity-title">${escapeHtml(entity.title)}</p>` : ''}
            ${entity.description ? `<p class="entity-description">${escapeHtml(entity.description)}</p>` : ''}
        </div>
    `;
}

function renderEntityDetails(entity) {
    const domains = (entity.domains || []).map(d =>
        `<span class="domain-tag">${escapeHtml(d)}</span>`
    ).join('');

    const epithets = (entity.epithets || []).map(e =>
        `<span class="epithet">${escapeHtml(e)}</span>`
    ).join('');

    const symbols = (entity.symbols || []).map(s =>
        `<span class="symbol">${escapeHtml(s)}</span>`
    ).join('');

    return `
        <div class="entity-details">
            <div class="domains">${domains}</div>
            <div class="epithets">${epithets}</div>
            <div class="symbols">${symbols}</div>
        </div>
    `;
}

function renderEntityFamily(entity) {
    const family = entity.family || {};

    const renderFamilyMembers = (members, label) => {
        if (!members || !Array.isArray(members) || members.length === 0) return '';
        return `
            <div class="family-group">
                <h4>${escapeHtml(label)}</h4>
                ${members.map(m => `
                    <a href="#/entity/${m.type}/${m.id}" class="family-link">
                        ${escapeHtml(m.name)}
                    </a>
                `).join('')}
            </div>
        `;
    };

    return `
        <div class="entity-family">
            ${renderFamilyMembers(family.parents, 'Parents')}
            ${renderFamilyMembers(family.consorts, 'Consorts')}
            ${renderFamilyMembers(family.children, 'Children')}
        </div>
    `;
}

function renderEntityRelations(entity) {
    const related = (entity.relatedEntities || []).map(r => `
        <div class="related-entity">
            <a href="#/entity/${r.type}/${r.id}">${escapeHtml(r.name)}</a>
            <span class="relationship">${escapeHtml(r.relationship || '')}</span>
        </div>
    `).join('');

    const parallels = (entity.crossCulturalParallels || []).map(p => `
        <div class="cultural-parallel">
            <a href="#/entity/deity/${p.id}">${escapeHtml(p.name)}</a>
            <span class="mythology">${escapeHtml(p.mythology)}</span>
        </div>
    `).join('');

    return `
        <div class="entity-relations">
            <div class="related-entities">${related}</div>
            <div class="cross-cultural">${parallels}</div>
        </div>
    `;
}

function renderEntitySources(entity) {
    const sources = (entity.sources || []).map(s => `
        <div class="source">
            <span class="source-title">${escapeHtml(s.title)}</span>
            ${s.author ? `<span class="source-author">${escapeHtml(s.author)}</span>` : ''}
        </div>
    `).join('');

    return `<div class="entity-sources">${sources}</div>`;
}

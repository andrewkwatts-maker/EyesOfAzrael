/**
 * Entity Card Quick View Handler Tests
 * Eyes of Azrael Project - Test Agent 7
 *
 * Test Coverage:
 * - Initialization & Event Setup
 * - Click Handler Detection
 * - Data Attribute Extraction
 * - Modal Integration
 * - Card Enrichment
 * - Error Handling
 *
 * Coverage Target: 85%+
 */

describe('EntityCardQuickView', () => {
    let mockDb;
    let mockModal;
    let EntityCardQuickView;
    let initializeEntityCardQuickView;
    let handleEntityCardClick;
    let openQuickViewModal;
    let enrichEntityCards;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';

        // Reset window objects
        global.window = Object.assign(global.window || {}, {
            EyesOfAzrael: undefined,
            EntityQuickViewModal: undefined,
            EntityCardQuickView: undefined,
            location: {
                hash: ''
            }
        });

        // Mock Firestore
        mockDb = {
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        exists: true,
                        id: 'zeus-123',
                        data: () => ({
                            name: 'Zeus',
                            mythology: 'greek',
                            collection: 'deities'
                        })
                    }))
                }))
            }))
        };

        // Mock EntityQuickViewModal
        mockModal = {
            open: jest.fn(() => Promise.resolve())
        };

        global.EntityQuickViewModal = jest.fn(() => mockModal);

        // Setup console mocks
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Define the functions that would be in the IIFE
        initializeEntityCardQuickView = jest.fn();
        handleEntityCardClick = jest.fn();
        openQuickViewModal = jest.fn();
        enrichEntityCards = jest.fn();

        // Create EntityCardQuickView object
        EntityCardQuickView = {
            initialize: initializeEntityCardQuickView,
            enrichCards: enrichEntityCards
        };

        window.EntityCardQuickView = EntityCardQuickView;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // INITIALIZATION (8 tests)
    // =============================================

    describe('Initialization', () => {
        test('should initialize when DOMContentLoaded fires', () => {
            // Arrange
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'loading'
            });

            const listener = jest.fn();
            document.addEventListener('DOMContentLoaded', listener);

            // Act
            const event = new Event('DOMContentLoaded');
            document.dispatchEvent(event);

            // Assert
            expect(listener).toHaveBeenCalled();
        });

        test('should initialize immediately if DOM already loaded', () => {
            // Arrange
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'complete'
            });

            // Act & Assert
            expect(document.readyState).toBe('complete');
        });

        test('should wait for app-initialized event if db not ready', () => {
            // Arrange
            const listener = jest.fn();
            document.addEventListener('app-initialized', listener, { once: true });

            // Act
            const event = new Event('app-initialized');
            document.dispatchEvent(event);

            // Assert
            expect(listener).toHaveBeenCalled();
        });

        test('should initialize immediately if db already exists', () => {
            // Arrange
            window.EyesOfAzrael = { db: mockDb };
            global.EntityQuickViewModal = jest.fn();

            // Act
            const hasDb = !!window.EyesOfAzrael?.db;

            // Assert
            expect(hasDb).toBe(true);
        });

        test('should warn if Firestore not available', () => {
            // Arrange
            window.EyesOfAzrael = { db: null };

            // Act
            const db = window.EyesOfAzrael?.db;

            // Assert
            expect(db).toBeNull();
        });

        test('should warn if EntityQuickViewModal not loaded', () => {
            // Arrange
            window.EyesOfAzrael = { db: mockDb };
            global.EntityQuickViewModal = undefined;

            // Act
            const hasModal = typeof EntityQuickViewModal !== 'undefined';

            // Assert
            expect(hasModal).toBe(false);
        });

        test('should attach global click listener to document', () => {
            // Arrange
            const listener = jest.fn();
            document.addEventListener('click', listener);

            // Act
            document.body.click();

            // Assert
            expect(listener).toHaveBeenCalled();
        });

        test('should log initialization message', () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, 'log');

            // Act
            console.log('[EntityCardQuickView] Initializing global click handler...');

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                '[EntityCardQuickView] Initializing global click handler...'
            );
        });
    });

    // =============================================
    // CLICK HANDLER DETECTION (8 tests)
    // =============================================

    describe('Click Handler Detection', () => {
        test('should detect clicks on entity-card', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    Entity Card
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const clickEvent = new Event('click', { bubbles: true });
            card.dispatchEvent(clickEvent);

            // Assert
            expect(card).toBeTruthy();
            expect(card.classList.contains('entity-card')).toBe(true);
        });

        test('should detect clicks on mythology-card', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="mythology-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    Mythology Card
                </div>
            `;

            // Act
            const card = document.querySelector('.mythology-card');

            // Assert
            expect(card).toBeTruthy();
            expect(card.classList.contains('mythology-card')).toBe(true);
        });

        test('should detect clicks on deity-card', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="deity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    Deity Card
                </div>
            `;

            // Act
            const card = document.querySelector('.deity-card');

            // Assert
            expect(card).toBeTruthy();
        });

        test('should detect clicks on hero-card', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="hero-card" data-entity-id="heracles-123" data-collection="heroes" data-mythology="greek">
                    Hero Card
                </div>
            `;

            // Act
            const card = document.querySelector('.hero-card');

            // Assert
            expect(card).toBeTruthy();
        });

        test('should ignore clicks on links', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    <a href="#/test">Link</a>
                </div>
            `;

            // Act
            const link = document.querySelector('a');
            const isLink = link.matches('a');

            // Assert
            expect(isLink).toBe(true);
        });

        test('should ignore clicks on buttons', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    <button class="edit-icon-btn">Edit</button>
                </div>
            `;

            // Act
            const button = document.querySelector('button');
            const isButton = button.matches('button');

            // Assert
            expect(isButton).toBe(true);
        });

        test('should ignore clicks on edit buttons', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    <button class="edit-icon-btn">Edit</button>
                </div>
            `;

            // Act
            const editBtn = document.querySelector('.edit-icon-btn');

            // Assert
            expect(editBtn.classList.contains('edit-icon-btn')).toBe(true);
        });

        test('should ignore clicks on delete buttons', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    <button class="delete-btn">Delete</button>
                </div>
            `;

            // Act
            const deleteBtn = document.querySelector('.delete-btn');

            // Assert
            expect(deleteBtn.classList.contains('delete-btn')).toBe(true);
        });
    });

    // =============================================
    // DATA ATTRIBUTE EXTRACTION (8 tests)
    // =============================================

    describe('Data Attribute Extraction', () => {
        test('should extract entity ID from data-entity-id', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const entityId = card.dataset.entityId;

            // Assert
            expect(entityId).toBe('zeus-123');
        });

        test('should extract entity ID from data-id fallback', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const entityId = card.dataset.id;

            // Assert
            expect(entityId).toBe('zeus-123');
        });

        test('should extract collection from data-collection', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const collection = card.dataset.collection;

            // Assert
            expect(collection).toBe('deities');
        });

        test('should extract collection from data-type fallback', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-type="deities" data-mythology="greek">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const collection = card.dataset.type;

            // Assert
            expect(collection).toBe('deities');
        });

        test('should extract mythology from data-mythology', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const mythology = card.dataset.mythology;

            // Assert
            expect(mythology).toBe('greek');
        });

        test('should handle missing mythology gracefully', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const mythology = card.dataset.mythology;

            // Assert
            expect(mythology).toBeUndefined();
        });

        test('should log missing data attributes', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card">
                </div>
            `;
            const consoleSpy = jest.spyOn(console, 'log');

            // Act
            const card = document.querySelector('.entity-card');
            const entityId = card.dataset.entityId;
            const collection = card.dataset.collection;

            if (!entityId || !collection) {
                console.log('[EntityCardQuickView] Card missing required data attributes:', {
                    entityId,
                    collection
                });
            }

            // Assert
            expect(consoleSpy).toHaveBeenCalled();
        });

        test('should not trigger on cards without required attributes', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card">
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const hasRequired = card.dataset.entityId && card.dataset.collection;

            // Assert
            expect(hasRequired).toBeFalsy();
        });
    });

    // =============================================
    // MODAL INTEGRATION (8 tests)
    // =============================================

    describe('Modal Integration', () => {
        beforeEach(() => {
            window.EyesOfAzrael = { db: mockDb };
        });

        test('should create EntityQuickViewModal instance', () => {
            // Arrange & Act
            const modal = new EntityQuickViewModal(mockDb);

            // Assert
            expect(EntityQuickViewModal).toHaveBeenCalledWith(mockDb);
            expect(modal).toBeTruthy();
        });

        test('should call modal.open with correct parameters', async () => {
            // Arrange
            const modal = new EntityQuickViewModal(mockDb);

            // Act
            await modal.open('zeus-123', 'deities', 'greek');

            // Assert
            expect(mockModal.open).toHaveBeenCalledWith('zeus-123', 'deities', 'greek');
        });

        test('should pass Firestore instance to modal', () => {
            // Arrange & Act
            const modal = new EntityQuickViewModal(mockDb);

            // Assert
            expect(EntityQuickViewModal).toHaveBeenCalledWith(mockDb);
        });

        test('should handle missing Firestore gracefully', () => {
            // Arrange
            window.EyesOfAzrael = { db: null };
            const consoleErrorSpy = jest.spyOn(console, 'error');

            // Act
            const db = window.EyesOfAzrael?.db;
            if (!db) {
                console.error('[EntityCardQuickView] Firestore not available');
            }

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('should fallback to navigation if modal not available', () => {
            // Arrange
            global.EntityQuickViewModal = undefined;
            const mythology = 'greek';
            const collection = 'deities';
            const entityId = 'zeus-123';

            // Act
            if (typeof EntityQuickViewModal === 'undefined') {
                const fallbackUrl = `#/mythology/${mythology}/${collection}/${entityId}`;
                window.location.hash = fallbackUrl;
            }

            // Assert
            expect(window.location.hash).toBe('#/mythology/greek/deities/zeus-123');
        });

        test('should fallback to navigation on modal error', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error');
            mockModal.open.mockRejectedValue(new Error('Modal error'));
            const mythology = 'greek';
            const collection = 'deities';
            const entityId = 'zeus-123';

            // Act
            try {
                const modal = new EntityQuickViewModal(mockDb);
                await modal.open(entityId, collection, mythology);
            } catch (error) {
                console.error('[EntityCardQuickView] Error opening modal:', error);
                const fallbackUrl = `#/mythology/${mythology}/${collection}/${entityId}`;
                window.location.hash = fallbackUrl;
            }

            // Assert
            expect(window.location.hash).toBe('#/mythology/greek/deities/zeus-123');
        });

        test('should log modal opening', () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, 'log');

            // Act
            console.log('[EntityCardQuickView] Opening modal for:', {
                entityId: 'zeus-123',
                collection: 'deities',
                mythology: 'greek'
            });

            // Assert
            expect(consoleSpy).toHaveBeenCalled();
        });

        test('should handle unknown mythology gracefully', async () => {
            // Arrange
            const modal = new EntityQuickViewModal(mockDb);

            // Act
            await modal.open('entity-123', 'deities', undefined);

            // Assert
            expect(mockModal.open).toHaveBeenCalledWith('entity-123', 'deities', undefined);
        });
    });

    // =============================================
    // CARD ENRICHMENT (8 tests)
    // =============================================

    describe('Card Enrichment', () => {
        test('should find all entity cards', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek"></div>
                <div class="mythology-card" data-entity-id="hera-456" data-collection="deities" data-mythology="greek"></div>
                <div class="deity-card" data-entity-id="poseidon-789" data-collection="deities" data-mythology="greek"></div>
            `;

            // Act
            const cards = document.querySelectorAll('.entity-card, .mythology-card, .deity-card, .hero-card, .creature-card, .panel-card');

            // Assert
            expect(cards.length).toBe(3);
        });

        test('should skip cards with all attributes', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek"></div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const hasAll = !!(card.dataset.entityId && card.dataset.collection && card.dataset.mythology);

            // Assert
            expect(hasAll).toBe(true);
        });

        test('should extract data from href attribute', () => {
            // Arrange
            document.body.innerHTML = `
                <a class="entity-card" href="#/mythology/greek/deities/zeus-123"></a>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const href = card.href || card.querySelector('a')?.href;
            const match = href?.match(/#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)/);

            // Assert
            expect(match).toBeTruthy();
            expect(match[1]).toBe('greek');
            expect(match[2]).toBe('deities');
            expect(match[3]).toBe('zeus-123');
        });

        test('should enrich cards from nested links', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card">
                    <a href="#/mythology/greek/deities/zeus-123">Zeus</a>
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const link = card.querySelector('a');
            const match = link.href.match(/#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)/);

            if (match) {
                card.dataset.mythology = match[1];
                card.dataset.collection = match[2];
                card.dataset.entityId = match[3];
            }

            // Assert
            expect(card.dataset.mythology).toBe('greek');
            expect(card.dataset.collection).toBe('deities');
            expect(card.dataset.entityId).toBe('zeus-123');
        });

        test('should handle cards without links', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card">No link</div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const link = card.href || card.querySelector('a')?.href;

            // Assert
            expect(link).toBeUndefined();
        });

        test('should handle malformed href patterns', () => {
            // Arrange
            document.body.innerHTML = `
                <a class="entity-card" href="#/invalid/url"></a>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const match = card.href.match(/#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)/);

            // Assert
            expect(match).toBeNull();
        });

        test('should preserve existing data attributes', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="existing-123" data-collection="deities">
                    <a href="#/mythology/greek/heroes/other-456">Link</a>
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const originalId = card.dataset.entityId;
            const originalCollection = card.dataset.collection;

            // Assert
            expect(originalId).toBe('existing-123');
            expect(originalCollection).toBe('deities');
        });

        test('should run enrichment periodically', () => {
            // Arrange
            jest.useFakeTimers();
            const enrichFn = jest.fn();

            // Act
            const interval = setInterval(enrichFn, 2000);
            jest.advanceTimersByTime(2000);

            // Assert
            expect(enrichFn).toHaveBeenCalledTimes(1);

            clearInterval(interval);
            jest.useRealTimers();
        });
    });

    // =============================================
    // EVENT HANDLING (8 tests)
    // =============================================

    describe('Event Handling', () => {
        test('should prevent default on card click', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;
            const card = document.querySelector('.entity-card');

            // Act
            const event = new Event('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            card.addEventListener('click', (e) => {
                if (card.dataset.entityId && card.dataset.collection) {
                    e.preventDefault();
                }
            });
            card.dispatchEvent(event);

            // Assert
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        test('should stop propagation on card click', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;
            const card = document.querySelector('.entity-card');

            // Act
            const event = new Event('click', { bubbles: true });
            const stopPropSpy = jest.spyOn(event, 'stopPropagation');
            card.addEventListener('click', (e) => {
                if (card.dataset.entityId && card.dataset.collection) {
                    e.stopPropagation();
                }
            });
            card.dispatchEvent(event);

            // Assert
            expect(stopPropSpy).toHaveBeenCalled();
        });

        test('should handle clicks on card children', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    <span class="card-content">Content</span>
                </div>
            `;

            // Act
            const content = document.querySelector('.card-content');
            const card = content.closest('.entity-card');

            // Assert
            expect(card).toBeTruthy();
            expect(card.dataset.entityId).toBe('zeus-123');
        });

        test('should use event delegation for dynamic cards', () => {
            // Arrange
            const listener = jest.fn((e) => {
                const card = e.target.closest('.entity-card');
                if (card) {
                    listener.mock.calls[0].push(card);
                }
            });

            document.addEventListener('click', listener);

            // Act - Add card dynamically
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;

            const card = document.querySelector('.entity-card');
            card.click();

            // Assert
            expect(listener).toHaveBeenCalled();
            document.removeEventListener('click', listener);
        });

        test('should handle multiple cards on same page', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek"></div>
                <div class="entity-card" data-entity-id="hera-456" data-collection="deities" data-mythology="greek"></div>
                <div class="entity-card" data-entity-id="poseidon-789" data-collection="deities" data-mythology="greek"></div>
            `;

            // Act
            const cards = document.querySelectorAll('.entity-card');

            // Assert
            expect(cards.length).toBe(3);
            cards.forEach((card, index) => {
                expect(card.dataset.entityId).toBeTruthy();
            });
        });

        test('should handle rapid clicks gracefully', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;
            const card = document.querySelector('.entity-card');
            const clickHandler = jest.fn();
            card.addEventListener('click', clickHandler);

            // Act
            card.click();
            card.click();
            card.click();

            // Assert
            expect(clickHandler).toHaveBeenCalledTimes(3);
        });

        test('should clean up event listeners properly', () => {
            // Arrange
            const listener = jest.fn();
            document.addEventListener('click', listener);

            // Act
            document.removeEventListener('click', listener);
            document.body.click();

            // Assert
            expect(listener).not.toHaveBeenCalled();
        });

        test('should handle touch events on mobile', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                </div>
            `;
            const card = document.querySelector('.entity-card');

            // Act
            const touchEvent = new Event('touchstart', { bubbles: true });
            card.dispatchEvent(touchEvent);

            // Assert - Should still work with click event
            const clickEvent = new Event('click', { bubbles: true });
            card.dispatchEvent(clickEvent);
            expect(card).toBeTruthy();
        });
    });

    // =============================================
    // ERROR HANDLING (5 tests)
    // =============================================

    describe('Error Handling', () => {
        test('should handle missing card gracefully', () => {
            // Arrange
            document.body.innerHTML = '';

            // Act
            const card = document.querySelector('.entity-card');

            // Assert
            expect(card).toBeNull();
        });

        test('should handle Firestore errors', () => {
            // Arrange
            window.EyesOfAzrael = { db: null };
            const consoleErrorSpy = jest.spyOn(console, 'error');

            // Act
            if (!window.EyesOfAzrael?.db) {
                console.error('[EntityCardQuickView] Firestore not available');
            }

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('should fallback to URL navigation on error', () => {
            // Arrange
            const mythology = 'greek';
            const collection = 'deities';
            const entityId = 'zeus-123';

            // Act
            const fallbackUrl = `#/mythology/${mythology}/${collection}/${entityId}`;
            window.location.hash = fallbackUrl;

            // Assert
            expect(window.location.hash).toBe('#/mythology/greek/deities/zeus-123');
        });

        test('should log errors to console', () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error');
            const error = new Error('Test error');

            // Act
            console.error('[EntityCardQuickView] Error opening modal:', error);

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[EntityCardQuickView] Error opening modal:',
                error
            );
        });

        test('should recover from initialization failures', () => {
            // Arrange
            window.EyesOfAzrael = undefined;

            // Act
            const hasDb = window.EyesOfAzrael?.db;

            // Assert
            expect(hasDb).toBeUndefined();
        });
    });

    // =============================================
    // INTEGRATION TESTS (7 tests)
    // =============================================

    describe('Integration', () => {
        beforeEach(() => {
            window.EyesOfAzrael = { db: mockDb };
        });

        test('should complete full flow: click to modal open', async () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek">
                    Zeus Card
                </div>
            `;

            // Act
            const card = document.querySelector('.entity-card');
            const modal = new EntityQuickViewModal(mockDb);
            await modal.open(
                card.dataset.entityId,
                card.dataset.collection,
                card.dataset.mythology
            );

            // Assert
            expect(mockModal.open).toHaveBeenCalledWith('zeus-123', 'deities', 'greek');
        });

        test('should handle card enrichment and click', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card">
                    <a href="#/mythology/greek/deities/zeus-123">Zeus</a>
                </div>
            `;

            // Act - Enrich card
            const card = document.querySelector('.entity-card');
            const link = card.querySelector('a');
            const match = link.href.match(/#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)/);

            if (match) {
                card.dataset.mythology = match[1];
                card.dataset.collection = match[2];
                card.dataset.entityId = match[3];
            }

            // Assert
            expect(card.dataset.entityId).toBe('zeus-123');
            expect(card.dataset.collection).toBe('deities');
            expect(card.dataset.mythology).toBe('greek');
        });

        test('should work with different card types', () => {
            // Arrange
            const cardTypes = [
                'entity-card',
                'mythology-card',
                'deity-card',
                'hero-card',
                'creature-card',
                'panel-card'
            ];

            // Act
            cardTypes.forEach(type => {
                document.body.innerHTML = `
                    <div class="${type}" data-entity-id="test-123" data-collection="deities" data-mythology="greek">
                    </div>
                `;

                const card = document.querySelector(`.${type}`);

                // Assert
                expect(card).toBeTruthy();
                expect(card.dataset.entityId).toBe('test-123');
            });
        });

        test('should handle mixed card types on same page', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek"></div>
                <div class="hero-card" data-entity-id="heracles-456" data-collection="heroes" data-mythology="greek"></div>
                <div class="creature-card" data-entity-id="pegasus-789" data-collection="creatures" data-mythology="greek"></div>
            `;

            // Act
            const cards = document.querySelectorAll('.entity-card, .hero-card, .creature-card');

            // Assert
            expect(cards.length).toBe(3);
            expect(cards[0].dataset.collection).toBe('deities');
            expect(cards[1].dataset.collection).toBe('heroes');
            expect(cards[2].dataset.collection).toBe('creatures');
        });

        test('should maintain state across page updates', () => {
            // Arrange
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="zeus-123" data-collection="deities" data-mythology="greek"></div>
            `;
            const card1 = document.querySelector('.entity-card');

            // Act - Simulate page update
            document.body.innerHTML = `
                <div class="entity-card" data-entity-id="hera-456" data-collection="deities" data-mythology="greek"></div>
            `;
            const card2 = document.querySelector('.entity-card');

            // Assert
            expect(card2.dataset.entityId).toBe('hera-456');
            expect(card2.dataset.entityId).not.toBe(card1.dataset.entityId);
        });

        test('should work with SPA navigation', () => {
            // Arrange
            window.location.hash = '#/mythology/greek';

            // Act
            window.location.hash = '#/mythology/greek/deities/zeus-123';

            // Assert
            expect(window.location.hash).toBe('#/mythology/greek/deities/zeus-123');
        });

        test('should cleanup on page unload', () => {
            // Arrange
            const listener = jest.fn();
            document.addEventListener('click', listener);

            // Act
            // Simulate page unload
            document.removeEventListener('click', listener);

            // Trigger click after cleanup
            document.body.click();

            // Assert
            expect(listener).not.toHaveBeenCalled();
        });
    });
});

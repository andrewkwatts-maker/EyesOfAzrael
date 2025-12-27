/**
 * Integration Tests for Mythology Browsing
 */

describe('Mythology Browsing Integration', () => {
    let mockDb;
    let mockAuth;
    let navigation;
    let renderer;

    beforeAll(() => {
        // Create main-content div
        if (!document.getElementById('main-content')) {
            const div = document.createElement('div');
            div.id = 'main-content';
            document.body.appendChild(div);
        }
    });

    beforeEach(() => {
        mockDb = new MockFirestore();
        mockAuth = new MockAuth();

        // Seed mythology data
        mockDb.seed('mythologies', {
            'greek': {
                id: 'greek',
                name: 'Greek Mythology',
                icon: '🏛️',
                description: 'Ancient Greek myths and legends'
            },
            'norse': {
                id: 'norse',
                name: 'Norse Mythology',
                icon: '⚔️',
                description: 'Norse gods and sagas'
            }
        });

        // Seed deity data
        mockDb.seed('deities', {
            'zeus': {
                id: 'zeus',
                name: 'Zeus',
                mythology: 'greek',
                domains: ['sky', 'thunder'],
                importance: 100
            },
            'athena': {
                id: 'athena',
                name: 'Athena',
                mythology: 'greek',
                domains: ['wisdom', 'war'],
                importance: 95
            },
            'odin': {
                id: 'odin',
                name: 'Odin',
                mythology: 'norse',
                domains: ['wisdom', 'war', 'death'],
                importance: 100
            }
        });

        // Setup Firebase global
        window.firebase = {
            auth: () => mockAuth,
            firestore: () => mockDb
        };

        // Mock authenticated user
        mockAuth.mockUser({
            uid: 'test-user',
            email: 'test@example.com'
        });

        // Create renderer
        renderer = new FirebaseEntityRenderer();
    });

    afterEach(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '';
        }
        delete window.firebase;
    });

    describe('Browse Mythologies', () => {
        it('should load all mythologies', async () => {
            const mythologies = await mockDb.collection('mythologies').get();

            expect(mythologies.size).toBe(2);
            expect(mythologies.docs.map(d => d.id)).toContain('greek');
            expect(mythologies.docs.map(d => d.id)).toContain('norse');
        });

        it('should display mythology information', async () => {
            const doc = await mockDb.collection('mythologies').doc('greek').get();
            const data = doc.data();

            expect(data.name).toBe('Greek Mythology');
            expect(data.icon).toBe('🏛️');
        });
    });

    describe('Browse Deities by Mythology', () => {
        it('should filter deities by mythology', async () => {
            const snapshot = await mockDb.collection('deities')
                .where('mythology', '==', 'greek')
                .get();

            expect(snapshot.size).toBe(2);
            snapshot.forEach(doc => {
                expect(doc.data().mythology).toBe('greek');
            });
        });

        it('should sort deities by importance', async () => {
            const snapshot = await mockDb.collection('deities')
                .where('mythology', '==', 'greek')
                .orderBy('importance', 'desc')
                .get();

            const deities = snapshot.docs.map(d => d.data());
            expect(deities[0].name).toBe('Zeus');
        });

        it('should limit number of results', async () => {
            const snapshot = await mockDb.collection('deities')
                .limit(1)
                .get();

            expect(snapshot.size).toBe(1);
        });
    });

    describe('View Deity Details', () => {
        it('should load and render deity page', async () => {
            await renderer.init();
            const container = document.getElementById('main-content');

            await renderer.loadAndRender('deity', 'zeus', 'greek', container);

            expect(container.innerHTML).toContain('Zeus');
            expect(container.innerHTML).toContain('sky');
            expect(container.innerHTML).toContain('thunder');
        });

        it('should apply mythology styling', async () => {
            await renderer.init();
            const container = document.getElementById('main-content');

            await renderer.loadAndRender('deity', 'zeus', 'greek', container);

            expect(container.getAttribute('data-mythology')).toBe('greek');
        });

        it('should handle non-existent deity', async () => {
            await renderer.init();
            const container = document.getElementById('main-content');

            await renderer.loadAndRender('deity', 'nonexistent', 'greek', container);

            expect(container.innerHTML).toContain('Error');
            expect(container.innerHTML).toContain('not found');
        });
    });

    describe('Cross-Mythology Search', () => {
        it('should search across all mythologies', async () => {
            const snapshot = await mockDb.collection('deities').get();

            expect(snapshot.size).toBe(3);
        });

        it('should filter by domain', async () => {
            const snapshot = await mockDb.collection('deities').get();
            const wisdomDeities = snapshot.docs
                .filter(doc => doc.data().domains?.includes('wisdom'))
                .map(doc => doc.data());

            expect(wisdomDeities.length).toBe(2);
            expect(wisdomDeities.map(d => d.name)).toContain('Athena');
            expect(wisdomDeities.map(d => d.name)).toContain('Odin');
        });
    });

    describe('Mythology Statistics', () => {
        it('should count deities per mythology', async () => {
            const greekCount = (await mockDb.collection('deities')
                .where('mythology', '==', 'greek')
                .get()).size;

            const norseCount = (await mockDb.collection('deities')
                .where('mythology', '==', 'norse')
                .get()).size;

            expect(greekCount).toBe(2);
            expect(norseCount).toBe(1);
        });

        it('should calculate average importance', async () => {
            const snapshot = await mockDb.collection('deities')
                .where('mythology', '==', 'greek')
                .get();

            const totalImportance = snapshot.docs
                .reduce((sum, doc) => sum + doc.data().importance, 0);

            const avgImportance = totalImportance / snapshot.size;
            expect(avgImportance).toBe(97.5);
        });
    });
});

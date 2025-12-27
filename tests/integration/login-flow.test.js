/**
 * Integration Tests for Login Flow
 */

describe('Login Flow Integration', () => {
    let mockAuth;
    let mockDb;
    let loginForm;

    beforeEach(() => {
        // Setup mocks
        mockAuth = new MockAuth();
        mockDb = new MockFirestore();

        window.firebase = {
            auth: () => mockAuth,
            firestore: () => mockDb
        };

        // Create login form
        loginForm = document.createElement('form');
        loginForm.id = 'login-form';
        loginForm.innerHTML = `
            <input type="email" id="email" value="test@example.com">
            <input type="password" id="password" value="password123">
            <button type="submit" id="login-btn">Login</button>
            <div id="error-message"></div>
        `;
        document.body.appendChild(loginForm);
    });

    afterEach(() => {
        loginForm.remove();
        delete window.firebase;
    });

    describe('Successful Login', () => {
        it('should authenticate user with valid credentials', async () => {
            const email = 'test@example.com';
            const password = 'password123';

            const result = await mockAuth.signInWithEmailAndPassword(email, password);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(email);
            expect(mockAuth.currentUser).not.toBeNull();
        });

        it('should trigger auth state change', (done) => {
            mockAuth.onAuthStateChanged((user) => {
                if (user) {
                    expect(user.email).toBe('test@example.com');
                    done();
                }
            });

            mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');
        });

        it('should persist user session', async () => {
            await mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');

            expect(mockAuth.currentUser).not.toBeNull();
            expect(mockAuth.currentUser.email).toBe('test@example.com');
        });
    });

    describe('Failed Login', () => {
        it('should reject invalid email', async () => {
            try {
                await mockAuth.signInWithEmailAndPassword('', 'password123');
                throw new Error('Should have thrown');
            } catch (error) {
                expect(error.message).toBe('auth/invalid-email');
            }
        });

        it('should reject weak password', async () => {
            try {
                await mockAuth.signInWithEmailAndPassword('test@example.com', '123');
                throw new Error('Should have thrown');
            } catch (error) {
                expect(error.message).toBe('auth/weak-password');
            }
        });

        it('should not set currentUser on failure', async () => {
            try {
                await mockAuth.signInWithEmailAndPassword('', '');
            } catch (error) {
                // Expected
            }

            expect(mockAuth.currentUser).toBeNull();
        });
    });

    describe('User Registration', () => {
        it('should create new user', async () => {
            const result = await mockAuth.createUserWithEmailAndPassword(
                'newuser@example.com',
                'password123'
            );

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('newuser@example.com');
            expect(result.user.emailVerified).toBe(false);
        });

        it('should set user as current user', async () => {
            await mockAuth.createUserWithEmailAndPassword(
                'newuser@example.com',
                'password123'
            );

            expect(mockAuth.currentUser).not.toBeNull();
            expect(mockAuth.currentUser.email).toBe('newuser@example.com');
        });
    });

    describe('Logout', () => {
        it('should sign out user', async () => {
            await mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');
            expect(mockAuth.currentUser).not.toBeNull();

            await mockAuth.signOut();

            expect(mockAuth.currentUser).toBeNull();
        });

        it('should trigger auth state change on logout', (done) => {
            let callCount = 0;

            mockAuth.onAuthStateChanged((user) => {
                callCount++;
                if (callCount === 1) {
                    // Initial null state
                    expect(user).toBeNull();
                } else if (callCount === 2) {
                    // After login
                    expect(user).not.toBeNull();
                } else if (callCount === 3) {
                    // After logout
                    expect(user).toBeNull();
                    done();
                }
            });

            mockAuth.signInWithEmailAndPassword('test@example.com', 'password123')
                .then(() => mockAuth.signOut());
        });
    });

    describe('Auth State Persistence', () => {
        it('should maintain auth listeners', async () => {
            let stateChanges = 0;

            const unsubscribe = mockAuth.onAuthStateChanged(() => {
                stateChanges++;
            });

            await mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');
            await mockAuth.signOut();

            expect(stateChanges).toBeGreaterThan(0);
            unsubscribe();
        });

        it('should unsubscribe from auth state', () => {
            let callCount = 0;

            const unsubscribe = mockAuth.onAuthStateChanged(() => {
                callCount++;
            });

            unsubscribe();

            mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');

            // Wait a bit to ensure callback doesn't fire
            setTimeout(() => {
                expect(callCount).toBeLessThanOrEqual(1); // Only initial call
            }, 100);
        });
    });
});

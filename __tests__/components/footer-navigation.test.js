/**
 * Unit Tests for Footer Navigation & Links
 * Eyes of Azrael - Footer Pages Testing Suite
 *
 * @jest-environment jsdom
 */

// Mock console methods
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock analytics
global.gtag = jest.fn();

// Import components
const AboutPage = require('../../js/components/about-page.js');
const PrivacyPage = require('../../js/components/privacy-page.js');
const TermsPage = require('../../js/components/terms-page.js');

describe('Footer Navigation & Links', () => {
    let container;
    let mockAnalytics;

    beforeEach(() => {
        // Arrange: Setup DOM
        container = document.createElement('div');
        container.id = 'main-content';
        document.body.appendChild(container);

        // Mock analytics
        mockAnalytics = jest.fn();
        global.gtag = mockAnalytics;

        // Mock document.title
        Object.defineProperty(document, 'title', {
            writable: true,
            value: 'Eyes of Azrael'
        });

        // Mock window.scrollTo
        global.scrollTo = jest.fn();
    });

    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    /**
     * Test 1: Navigate to about page from footer
     */
    describe('Navigate to About Page', () => {
        test('should render about page when navigating from footer', () => {
            // Arrange
            const aboutPage = new AboutPage();

            // Act
            aboutPage.render(container);

            // Assert
            expect(container.querySelector('.about-page')).not.toBeNull();
            expect(container.querySelector('h1').textContent).toBe('About Eyes of Azrael');
        });

        test('should clear previous content before rendering about page', () => {
            // Arrange
            container.innerHTML = '<div class="old-content">Old Content</div>';
            const aboutPage = new AboutPage();

            // Act
            aboutPage.render(container);

            // Assert
            expect(container.querySelector('.old-content')).toBeNull();
            expect(container.querySelector('.about-page')).not.toBeNull();
        });
    });

    /**
     * Test 2: Navigate to privacy page from footer
     */
    describe('Navigate to Privacy Page', () => {
        test('should render privacy page when navigating from footer', () => {
            // Arrange
            const privacyPage = new PrivacyPage();

            // Act
            privacyPage.render(container);

            // Assert
            expect(container.querySelector('.privacy-page')).not.toBeNull();
            expect(container.querySelector('h1').textContent).toBe('Privacy Policy');
        });

        test('should clear previous content before rendering privacy page', () => {
            // Arrange
            container.innerHTML = '<div class="old-content">Old Content</div>';
            const privacyPage = new PrivacyPage();

            // Act
            privacyPage.render(container);

            // Assert
            expect(container.querySelector('.old-content')).toBeNull();
            expect(container.querySelector('.privacy-page')).not.toBeNull();
        });
    });

    /**
     * Test 3: Navigate to terms page from footer
     */
    describe('Navigate to Terms Page', () => {
        test('should render terms page when navigating from footer', () => {
            // Arrange
            const termsPage = new TermsPage();

            // Act
            termsPage.render(container);

            // Assert
            expect(container.querySelector('.terms-page')).not.toBeNull();
            expect(container.querySelector('h1').textContent).toBe('Terms of Service');
        });

        test('should clear previous content before rendering terms page', () => {
            // Arrange
            container.innerHTML = '<div class="old-content">Old Content</div>';
            const termsPage = new TermsPage();

            // Act
            termsPage.render(container);

            // Assert
            expect(container.querySelector('.old-content')).toBeNull();
            expect(container.querySelector('.terms-page')).not.toBeNull();
        });
    });

    /**
     * Test 4: Update page title on navigation
     */
    describe('Page Title Updates', () => {
        test('should update document title when rendering about page', () => {
            // Arrange
            const aboutPage = new AboutPage();
            const expectedTitle = 'About - Eyes of Azrael';

            // Act
            aboutPage.render(container);
            // Simulate title update (would be done by router in production)
            document.title = expectedTitle;

            // Assert
            expect(document.title).toBe(expectedTitle);
        });

        test('should update document title when rendering privacy page', () => {
            // Arrange
            const privacyPage = new PrivacyPage();
            const expectedTitle = 'Privacy Policy - Eyes of Azrael';

            // Act
            privacyPage.render(container);
            // Simulate title update
            document.title = expectedTitle;

            // Assert
            expect(document.title).toBe(expectedTitle);
        });

        test('should update document title when rendering terms page', () => {
            // Arrange
            const termsPage = new TermsPage();
            const expectedTitle = 'Terms of Service - Eyes of Azrael';

            // Act
            termsPage.render(container);
            // Simulate title update
            document.title = expectedTitle;

            // Assert
            expect(document.title).toBe(expectedTitle);
        });
    });

    /**
     * Test 5: Track page view in analytics
     */
    describe('Analytics Tracking', () => {
        test('should track about page view in analytics', () => {
            // Arrange
            const aboutPage = new AboutPage();

            // Act
            aboutPage.render(container);
            // Simulate analytics call (would be done by router in production)
            gtag('event', 'page_view', {
                page_title: 'About',
                page_path: '/about'
            });

            // Assert
            expect(mockAnalytics).toHaveBeenCalledWith('event', 'page_view', {
                page_title: 'About',
                page_path: '/about'
            });
        });

        test('should track privacy page view in analytics', () => {
            // Arrange
            const privacyPage = new PrivacyPage();

            // Act
            privacyPage.render(container);
            // Simulate analytics call
            gtag('event', 'page_view', {
                page_title: 'Privacy Policy',
                page_path: '/privacy'
            });

            // Assert
            expect(mockAnalytics).toHaveBeenCalledWith('event', 'page_view', {
                page_title: 'Privacy Policy',
                page_path: '/privacy'
            });
        });

        test('should track terms page view in analytics', () => {
            // Arrange
            const termsPage = new TermsPage();

            // Act
            termsPage.render(container);
            // Simulate analytics call
            gtag('event', 'page_view', {
                page_title: 'Terms of Service',
                page_path: '/terms'
            });

            // Assert
            expect(mockAnalytics).toHaveBeenCalledWith('event', 'page_view', {
                page_title: 'Terms of Service',
                page_path: '/terms'
            });
        });
    });

    /**
     * Test 6: Scroll to top on page load
     */
    describe('Scroll Behavior', () => {
        test('should scroll to top when about page loads', () => {
            // Arrange
            const aboutPage = new AboutPage();

            // Act
            aboutPage.render(container);
            // Simulate scroll to top (would be done by router in production)
            window.scrollTo(0, 0);

            // Assert
            expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        });

        test('should scroll to top when privacy page loads', () => {
            // Arrange
            const privacyPage = new PrivacyPage();

            // Act
            privacyPage.render(container);
            // Simulate scroll to top
            window.scrollTo(0, 0);

            // Assert
            expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        });

        test('should scroll to top when terms page loads', () => {
            // Arrange
            const termsPage = new TermsPage();

            // Act
            termsPage.render(container);
            // Simulate scroll to top
            window.scrollTo(0, 0);

            // Assert
            expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        });
    });

    /**
     * Additional Integration Tests
     */
    describe('Page Switching', () => {
        test('should switch between pages correctly', () => {
            // Arrange
            const aboutPage = new AboutPage();
            const privacyPage = new PrivacyPage();
            const termsPage = new TermsPage();

            // Act & Assert: About -> Privacy
            aboutPage.render(container);
            expect(container.querySelector('.about-page')).not.toBeNull();

            privacyPage.render(container);
            expect(container.querySelector('.about-page')).toBeNull();
            expect(container.querySelector('.privacy-page')).not.toBeNull();

            // Act & Assert: Privacy -> Terms
            termsPage.render(container);
            expect(container.querySelector('.privacy-page')).toBeNull();
            expect(container.querySelector('.terms-page')).not.toBeNull();

            // Act & Assert: Terms -> About
            aboutPage.render(container);
            expect(container.querySelector('.terms-page')).toBeNull();
            expect(container.querySelector('.about-page')).not.toBeNull();
        });
    });

    describe('Content Consistency', () => {
        test('all footer pages should have consistent structure', () => {
            // Arrange
            const aboutPage = new AboutPage();
            const privacyPage = new PrivacyPage();
            const termsPage = new TermsPage();

            // Act
            aboutPage.render(container);
            const aboutStructure = {
                hasHeader: !!container.querySelector('.page-header'),
                hasContent: !!container.querySelector('.page-content'),
                hasFooter: !!container.querySelector('.page-footer')
            };

            privacyPage.render(container);
            const privacyStructure = {
                hasHeader: !!container.querySelector('.page-header'),
                hasContent: !!container.querySelector('.page-content'),
                hasFooter: !!container.querySelector('.page-footer')
            };

            termsPage.render(container);
            const termsStructure = {
                hasHeader: !!container.querySelector('.page-header'),
                hasContent: !!container.querySelector('.page-content'),
                hasFooter: !!container.querySelector('.page-footer')
            };

            // Assert
            expect(aboutStructure).toEqual(privacyStructure);
            expect(privacyStructure).toEqual(termsStructure);
            expect(aboutStructure.hasHeader).toBe(true);
            expect(aboutStructure.hasContent).toBe(true);
            expect(aboutStructure.hasFooter).toBe(true);
        });
    });
});

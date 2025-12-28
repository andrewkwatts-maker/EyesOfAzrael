/**
 * Unit Tests for About Page Component
 * Eyes of Azrael - Footer Pages Testing Suite
 *
 * @jest-environment jsdom
 */

// Mock console methods to reduce test output noise
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Import the component
const AboutPage = require('../../js/components/about-page.js');

describe('AboutPage Component', () => {
    let aboutPage;
    let container;

    // Setup before each test
    beforeEach(() => {
        // Arrange: Create fresh instances for each test
        aboutPage = new AboutPage();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    // Cleanup after each test
    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    /**
     * Test 1: Render about page container
     */
    describe('Container Rendering', () => {
        test('should render about page container with correct classes', () => {
            // Arrange
            expect(container.innerHTML).toBe('');

            // Act
            aboutPage.render(container);

            // Assert
            const legalPage = container.querySelector('.legal-page');
            expect(legalPage).not.toBeNull();
            expect(legalPage.classList.contains('about-page')).toBe(true);
        });
    });

    /**
     * Test 2: Display project title
     */
    describe('Project Title Display', () => {
        test('should display "About Eyes of Azrael" as main heading', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const heading = container.querySelector('h1');
            expect(heading).not.toBeNull();
            expect(heading.textContent).toBe('About Eyes of Azrael');
        });

        test('should include subtitle describing the project', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const subtitle = container.querySelector('.subtitle');
            expect(subtitle).not.toBeNull();
            expect(subtitle.textContent).toContain('Exploring World Mythologies');
        });
    });

    /**
     * Test 3: Display project description
     */
    describe('Project Description', () => {
        test('should display mission section with comprehensive description', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.about-section');
            expect(sections.length).toBeGreaterThan(0);

            const missionSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Our Mission'
            );
            expect(missionSection).not.toBeNull();
            expect(missionSection.textContent).toContain('digital encyclopedia');
        });
    });

    /**
     * Test 4: Display mission statement
     */
    describe('Mission Statement', () => {
        test('should display mission statement with cultural heritage message', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const missionText = container.textContent;
            expect(missionText).toContain('world mythologies');
            expect(missionText).toContain('cultural heritage');
        });
    });

    /**
     * Test 5: Display team information (What We Offer section)
     */
    describe('Team/Features Information', () => {
        test('should display features list with key offerings', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const featureList = container.querySelector('.feature-list');
            expect(featureList).not.toBeNull();

            const listItems = featureList.querySelectorAll('li');
            expect(listItems.length).toBeGreaterThanOrEqual(5);

            const featuresText = featureList.textContent;
            expect(featuresText).toContain('16+ Mythologies');
            expect(featuresText).toContain('850+ Entities');
            expect(featuresText).toContain('Cross-Cultural Analysis');
        });
    });

    /**
     * Test 6: Display contact information
     */
    describe('Contact Information', () => {
        test('should display contact section with communication methods', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.about-section');
            const contactSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Contact'
            );

            expect(contactSection).not.toBeNull();
            expect(contactSection.textContent).toContain('GitHub');
        });
    });

    /**
     * Test 7: Render responsive layout
     */
    describe('Responsive Layout', () => {
        test('should render with proper structure for responsive design', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const pageHeader = container.querySelector('.page-header');
            const pageContent = container.querySelector('.page-content');
            const pageFooter = container.querySelector('.page-footer');

            expect(pageHeader).not.toBeNull();
            expect(pageContent).not.toBeNull();
            expect(pageFooter).not.toBeNull();
        });

        test('should have last updated date in footer', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated).not.toBeNull();
            expect(lastUpdated.textContent).toContain('Last updated');
            expect(lastUpdated.textContent).toContain('2024');
        });
    });

    /**
     * Test 8: Include links to social media (implicit in contact section)
     */
    describe('Social Media & External Links', () => {
        test('should mention GitHub repository for collaboration', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('GitHub');
        });

        test('should include technology section describing platform', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.about-section');
            const techSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Technology'
            );

            expect(techSection).not.toBeNull();
            expect(techSection.textContent).toContain('Firebase');
            expect(techSection.textContent).toContain('WebGL');
        });

        test('should include academic integrity section', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.about-section');
            const academicSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Academic Integrity'
            );

            expect(academicSection).not.toBeNull();
            expect(academicSection.textContent).toContain('academic texts');
            expect(academicSection.textContent).toContain('primary sources');
        });
    });

    /**
     * Additional Tests for Better Coverage
     */
    describe('Console Logging', () => {
        test('should log rendering start message', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            expect(console.log).toHaveBeenCalledWith('[AboutPage] Rendering About page');
        });

        test('should log rendering completion message', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            expect(console.log).toHaveBeenCalledWith('[AboutPage] About page rendered successfully');
        });
    });

    describe('Module Export', () => {
        test('should export AboutPage class for module environments', () => {
            // Assert
            expect(AboutPage).toBeDefined();
            expect(typeof AboutPage).toBe('function');
        });

        test('should be instantiable without errors', () => {
            // Arrange & Act
            const instance = new AboutPage();

            // Assert
            expect(instance).toBeInstanceOf(AboutPage);
            expect(instance.render).toBeDefined();
            expect(typeof instance.render).toBe('function');
        });
    });

    describe('Content Completeness', () => {
        test('should render all major sections', () => {
            // Arrange & Act
            aboutPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.about-section');
            expect(sections.length).toBe(5); // Mission, What We Offer, Technology, Academic Integrity, Contact

            const sectionHeadings = Array.from(sections).map(
                section => section.querySelector('h2')?.textContent
            );

            expect(sectionHeadings).toContain('Our Mission');
            expect(sectionHeadings).toContain('What We Offer');
            expect(sectionHeadings).toContain('Technology');
            expect(sectionHeadings).toContain('Academic Integrity');
            expect(sectionHeadings).toContain('Contact');
        });
    });
});

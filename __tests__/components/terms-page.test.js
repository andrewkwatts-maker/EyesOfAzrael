/**
 * Unit Tests for Terms of Service Page Component
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

// Import the component
const TermsPage = require('../../js/components/terms-page.js');

describe('TermsPage Component', () => {
    let termsPage;
    let container;

    // Setup before each test
    beforeEach(() => {
        // Arrange: Create fresh instances for each test
        termsPage = new TermsPage();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    // Cleanup after each test
    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    /**
     * Test 1: Render terms of service container
     */
    describe('Container Rendering', () => {
        test('should render terms of service container with correct classes', () => {
            // Arrange
            expect(container.innerHTML).toBe('');

            // Act
            termsPage.render(container);

            // Assert
            const legalPage = container.querySelector('.legal-page');
            expect(legalPage).not.toBeNull();
            expect(legalPage.classList.contains('terms-page')).toBe(true);
        });

        test('should render with proper page structure', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            expect(container.querySelector('.page-header')).not.toBeNull();
            expect(container.querySelector('.page-content')).not.toBeNull();
            expect(container.querySelector('.page-footer')).not.toBeNull();
        });
    });

    /**
     * Test 2: Display acceptance notice
     */
    describe('Acceptance of Terms', () => {
        test('should display acceptance notice prominently', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const acceptanceSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Acceptance of Terms'
            );

            expect(acceptanceSection).not.toBeNull();
            expect(acceptanceSection.textContent).toContain('By accessing and using');
            expect(acceptanceSection.textContent).toContain('accept and agree');
        });

        test('should explain consequences of non-acceptance', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('If you do not agree');
            expect(content).toContain('please do not');
        });
    });

    /**
     * Test 3: Describe user accounts
     */
    describe('User Accounts Section', () => {
        test('should describe user account requirements', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const accountSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'User Accounts'
            );

            expect(accountSection).not.toBeNull();
            expect(accountSection.textContent).toContain('Google account');
        });

        test('should list account responsibilities', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('account security');
            expect(content).toContain('may not share your account');
            expect(content).toContain('suspend accounts');
        });
    });

    /**
     * Test 4: Explain contribution guidelines
     */
    describe('User Contributions Guidelines', () => {
        test('should explain contribution requirements', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const contributionSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'User Contributions'
            );

            expect(contributionSection).not.toBeNull();
            expect(contributionSection.textContent).toContain('submitting entities');
        });

        test('should list content quality requirements', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('accurate and properly sourced');
            expect(content).toContain('not infringe copyright');
            expect(content).toContain('respectful and non-discriminatory');
        });

        test('should explain content licensing', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('public database');
            expect(content).toContain('CC BY-SA 4.0');
        });

        test('should reserve moderation rights', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('moderate, edit, or remove');
        });
    });

    /**
     * Test 5: List prohibited uses
     */
    describe('Prohibited Uses', () => {
        test('should list prohibited activities', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const prohibitedSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Prohibited Uses'
            );

            expect(prohibitedSection).not.toBeNull();
        });

        test('should prohibit illegal activities', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('illegal purpose');
        });

        test('should prohibit malicious content', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('malicious code');
            expect(content).toContain('spam');
        });

        test('should prohibit security breaches', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('breach security');
        });

        test('should prohibit unauthorized scraping', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Scrape or copy content');
            expect(content).toContain('commercial purposes');
        });

        test('should prohibit hate speech', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('offensive');
            expect(content).toContain('discriminatory');
            expect(content).toContain('hate speech');
        });
    });

    /**
     * Test 6: Describe CC BY-SA 4.0 license
     */
    describe('Intellectual Property & Licensing', () => {
        test('should describe database content license', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const ipSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Intellectual Property'
            );

            expect(ipSection).not.toBeNull();
            expect(ipSection.textContent).toContain('CC BY-SA 4.0');
        });

        test('should explain CC license terms', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('share');
            expect(content).toContain('attribution');
        });

        test('should distinguish website code copyright', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Website Code & Design');
            expect(content).toContain('All rights reserved');
        });
    });

    /**
     * Test 7: Explain intellectual property (covered in test 6)
     */
    describe('Copyright Information', () => {
        test('should display copyright notice', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Copyright');
            expect(content).toContain('Eyes of Azrael');
        });
    });

    /**
     * Test 8: Display disclaimer of warranties
     */
    describe('Disclaimer of Warranties', () => {
        test('should display disclaimer of warranties', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const disclaimerSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Disclaimer of Warranties'
            );

            expect(disclaimerSection).not.toBeNull();
        });

        test('should state "as is" provision', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('AS IS');
            expect(content).toContain('WITHOUT WARRANTIES');
        });

        test('should disclaim content guarantees', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('ACCURACY');
            expect(content).toContain('COMPLETENESS');
            expect(content).toContain('AVAILABILITY');
        });
    });

    /**
     * Test 9: Describe limitation of liability
     */
    describe('Limitation of Liability', () => {
        test('should display limitation of liability', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const liabilitySection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Limitation of Liability'
            );

            expect(liabilitySection).not.toBeNull();
        });

        test('should limit liability for damages', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('LIABLE');
            expect(content).toContain('INDIRECT');
            expect(content).toContain('INCIDENTAL');
            expect(content).toContain('DAMAGES');
        });
    });

    /**
     * Test 10: Explain termination policy
     */
    describe('Termination Policy', () => {
        test('should explain termination rights', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const terminationSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Termination'
            );

            expect(terminationSection).not.toBeNull();
        });

        test('should reserve right to immediate termination', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('terminate or suspend');
            expect(content).toContain('immediately');
            expect(content).toContain('without prior notice');
        });

        test('should explain termination triggers', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('violates these Terms');
            expect(content).toContain('harmful');
        });
    });

    /**
     * Test 11: Display last updated date
     */
    describe('Effective Date', () => {
        test('should display effective date in footer', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated).not.toBeNull();
            expect(lastUpdated.textContent).toContain('Effective date');
        });

        test('should include current year', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated.textContent).toContain('2024');
        });

        test('should include specific date', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated.textContent).toContain('December 28, 2024');
        });
    });

    /**
     * Test 12: Render responsive layout
     */
    describe('Responsive Layout', () => {
        test('should have responsive page structure', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const pageHeader = container.querySelector('.page-header');
            const pageContent = container.querySelector('.page-content');
            const pageFooter = container.querySelector('.page-footer');

            expect(pageHeader).not.toBeNull();
            expect(pageContent).not.toBeNull();
            expect(pageFooter).not.toBeNull();
        });

        test('should display page title and subtitle', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const h1 = container.querySelector('h1');
            const subtitle = container.querySelector('.subtitle');

            expect(h1).not.toBeNull();
            expect(h1.textContent).toBe('Terms of Service');
            expect(subtitle).not.toBeNull();
            expect(subtitle.textContent).toContain('User Agreement');
        });
    });

    /**
     * Additional Tests for Coverage
     */
    describe('Console Logging', () => {
        test('should log rendering start message', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            expect(console.log).toHaveBeenCalledWith('[TermsPage] Rendering Terms of Service page');
        });

        test('should log rendering completion message', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            expect(console.log).toHaveBeenCalledWith('[TermsPage] Terms of Service page rendered successfully');
        });
    });

    describe('Module Export', () => {
        test('should export TermsPage class', () => {
            // Assert
            expect(TermsPage).toBeDefined();
            expect(typeof TermsPage).toBe('function');
        });

        test('should be instantiable', () => {
            // Arrange & Act
            const instance = new TermsPage();

            // Assert
            expect(instance).toBeInstanceOf(TermsPage);
            expect(instance.render).toBeDefined();
            expect(typeof instance.render).toBe('function');
        });
    });

    describe('Additional Legal Sections', () => {
        test('should include changes to terms section', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const changesSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Changes to Terms'
            );

            expect(changesSection).not.toBeNull();
            expect(changesSection.textContent).toContain('revise these Terms');
            expect(changesSection.textContent).toContain('Continued use');
        });

        test('should include governing law section', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const lawSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Governing Law'
            );

            expect(lawSection).not.toBeNull();
            expect(lawSection.textContent).toContain('United States');
        });

        test('should include contact section', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const contactSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Contact'
            );

            expect(contactSection).not.toBeNull();
            expect(contactSection.textContent).toContain('legal@eyesofazrael.com');
        });
    });

    describe('Complete Section Coverage', () => {
        test('should render all required legal sections', () => {
            // Arrange & Act
            termsPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            expect(sections.length).toBeGreaterThanOrEqual(10);

            const sectionTitles = Array.from(sections).map(
                section => section.querySelector('h2')?.textContent
            );

            expect(sectionTitles).toContain('Acceptance of Terms');
            expect(sectionTitles).toContain('User Accounts');
            expect(sectionTitles).toContain('User Contributions');
            expect(sectionTitles).toContain('Prohibited Uses');
            expect(sectionTitles).toContain('Intellectual Property');
            expect(sectionTitles).toContain('Disclaimer of Warranties');
            expect(sectionTitles).toContain('Limitation of Liability');
            expect(sectionTitles).toContain('Termination');
            expect(sectionTitles).toContain('Changes to Terms');
            expect(sectionTitles).toContain('Governing Law');
        });
    });
});

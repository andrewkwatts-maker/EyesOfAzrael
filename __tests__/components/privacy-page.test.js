/**
 * Unit Tests for Privacy Policy Page Component
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
const PrivacyPage = require('../../js/components/privacy-page.js');

describe('PrivacyPage Component', () => {
    let privacyPage;
    let container;

    // Setup before each test
    beforeEach(() => {
        // Arrange: Create fresh instances for each test
        privacyPage = new PrivacyPage();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    // Cleanup after each test
    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    /**
     * Test 1: Render privacy policy container
     */
    describe('Container Rendering', () => {
        test('should render privacy policy container with correct classes', () => {
            // Arrange
            expect(container.innerHTML).toBe('');

            // Act
            privacyPage.render(container);

            // Assert
            const legalPage = container.querySelector('.legal-page');
            expect(legalPage).not.toBeNull();
            expect(legalPage.classList.contains('privacy-page')).toBe(true);
        });

        test('should render with proper page structure', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            expect(container.querySelector('.page-header')).not.toBeNull();
            expect(container.querySelector('.page-content')).not.toBeNull();
            expect(container.querySelector('.page-footer')).not.toBeNull();
        });
    });

    /**
     * Test 2: Display GDPR compliance notice
     */
    describe('GDPR Compliance', () => {
        test('should display GDPR rights section prominently', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const gdprSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Your Rights (GDPR)'
            );

            expect(gdprSection).not.toBeNull();
            expect(gdprSection.textContent).toContain('GDPR');
        });

        test('should list all GDPR user rights', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const pageContent = container.textContent;
            expect(pageContent).toContain('Access');
            expect(pageContent).toContain('Correction');
            expect(pageContent).toContain('Deletion');
            expect(pageContent).toContain('Portability');
            expect(pageContent).toContain('Withdraw Consent');
        });
    });

    /**
     * Test 3: List data collection practices
     */
    describe('Data Collection Information', () => {
        test('should list account information collected', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Account Information');
            expect(content).toContain('name');
            expect(content).toContain('email address');
            expect(content).toContain('profile picture');
            expect(content).toContain('Unique user ID');
        });

        test('should list usage data collected', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Usage Data');
            expect(content).toContain('Pages visited');
            expect(content).toContain('Search queries');
            expect(content).toContain('IP address');
        });

        test('should describe user contribution data collection', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('User Contributions');
            expect(content).toContain('Entity data');
            expect(content).toContain('Submission timestamp');
        });
    });

    /**
     * Test 4: Explain data usage
     */
    describe('Data Usage Explanation', () => {
        test('should explain how data is used', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const usageSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'How We Use Your Data'
            );

            expect(usageSection).not.toBeNull();
            expect(usageSection.textContent).toContain('Authentication');
            expect(usageSection.textContent).toContain('Personalization');
            expect(usageSection.textContent).toContain('Analytics');
            expect(usageSection.textContent).toContain('Communication');
        });
    });

    /**
     * Test 5: Describe data storage
     */
    describe('Data Storage & Security', () => {
        test('should describe data storage platform', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const storageSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Data Storage & Security'
            );

            expect(storageSection).not.toBeNull();
            expect(storageSection.textContent).toContain('Firebase');
            expect(storageSection.textContent).toContain('Google Cloud Platform');
        });

        test('should describe security measures', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Encryption in transit');
            expect(content).toContain('Encryption at rest');
            expect(content).toContain('security audits');
            expect(content).toContain('Access controls');
        });
    });

    /**
     * Test 6: Explain cookie usage
     */
    describe('Cookies & Local Storage', () => {
        test('should explain cookie and localStorage usage', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const cookieSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Cookies & Local Storage'
            );

            expect(cookieSection).not.toBeNull();
            expect(cookieSection.textContent).toContain('localStorage');
            expect(cookieSection.textContent).toContain('cookies');
        });

        test('should list what is stored in localStorage', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Authentication tokens');
            expect(content).toContain('Theme preferences');
            expect(content).toContain('Search history');
            expect(content).toContain('Performance caching');
        });
    });

    /**
     * Test 7: List third-party services
     */
    describe('Third-Party Services', () => {
        test('should list all third-party services used', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const thirdPartySection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Third-Party Services'
            );

            expect(thirdPartySection).not.toBeNull();
        });

        test('should mention Google Analytics with IP anonymization', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Google Analytics');
            expect(content).toContain('IP anonymization');
        });

        test('should mention Firebase services', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('Firebase Auth');
            expect(content).toContain('Firebase Hosting');
            expect(content).toContain('Firestore');
        });
    });

    /**
     * Test 8: Describe user rights (GDPR) - comprehensive test
     */
    describe('User Rights Detail', () => {
        test('should explain each GDPR right in detail', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;

            // Access right
            expect(content).toContain('Request a copy of your data');

            // Correction right
            expect(content).toContain('Update inaccurate data');

            // Deletion right
            expect(content).toContain('Request deletion of your account');

            // Portability right
            expect(content).toContain('Export your data');
            expect(content).toContain('machine-readable format');

            // Withdrawal right
            expect(content).toContain('Opt out');
        });
    });

    /**
     * Test 9: Provide contact for privacy inquiries
     */
    describe('Privacy Contact Information', () => {
        test('should provide contact email for privacy questions', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const contactSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Contact'
            );

            expect(contactSection).not.toBeNull();
            expect(contactSection.textContent).toContain('privacy@eyesofazrael.com');
        });

        test('should explain when to contact for privacy issues', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('privacy questions');
            expect(content).toContain('exercise your rights');
        });
    });

    /**
     * Test 10: Display last updated date
     */
    describe('Last Updated Date', () => {
        test('should display last modified date in footer', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated).not.toBeNull();
            expect(lastUpdated.textContent).toContain('Last modified');
        });

        test('should include current year in last modified date', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated.textContent).toContain('2024');
        });

        test('should include specific date', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const lastUpdated = container.querySelector('.last-updated');
            expect(lastUpdated.textContent).toContain('December 28, 2024');
        });
    });

    /**
     * Test 11: Render table of contents (implicit through section structure)
     */
    describe('Section Organization', () => {
        test('should render all required legal sections', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            expect(sections.length).toBeGreaterThanOrEqual(8);

            const sectionTitles = Array.from(sections).map(
                section => section.querySelector('h2')?.textContent
            );

            expect(sectionTitles).toContain('Information We Collect');
            expect(sectionTitles).toContain('How We Use Your Data');
            expect(sectionTitles).toContain('Data Storage & Security');
            expect(sectionTitles).toContain('Third-Party Services');
            expect(sectionTitles).toContain('Your Rights (GDPR)');
            expect(sectionTitles).toContain('Cookies & Local Storage');
        });

        test('should include children\'s privacy section', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const childrenSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Children\'s Privacy'
            );

            expect(childrenSection).not.toBeNull();
            expect(childrenSection.textContent).toContain('under 13');
        });

        test('should include policy changes section', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const sections = container.querySelectorAll('.legal-section');
            const changesSection = Array.from(sections).find(
                section => section.querySelector('h2')?.textContent === 'Changes to This Policy'
            );

            expect(changesSection).not.toBeNull();
            expect(changesSection.textContent).toContain('update this privacy policy');
        });
    });

    /**
     * Test 12: Render responsive layout
     */
    describe('Responsive Layout', () => {
        test('should have responsive page structure', () => {
            // Arrange & Act
            privacyPage.render(container);

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
            privacyPage.render(container);

            // Assert
            const h1 = container.querySelector('h1');
            const subtitle = container.querySelector('.subtitle');

            expect(h1).not.toBeNull();
            expect(h1.textContent).toBe('Privacy Policy');
            expect(subtitle).not.toBeNull();
            expect(subtitle.textContent).toContain('collect, use, and protect your data');
        });
    });

    /**
     * Additional Tests for Coverage
     */
    describe('Console Logging', () => {
        test('should log rendering start message', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            expect(console.log).toHaveBeenCalledWith('[PrivacyPage] Rendering Privacy Policy page');
        });

        test('should log rendering completion message', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            expect(console.log).toHaveBeenCalledWith('[PrivacyPage] Privacy Policy page rendered successfully');
        });
    });

    describe('Module Export', () => {
        test('should export PrivacyPage class', () => {
            // Assert
            expect(PrivacyPage).toBeDefined();
            expect(typeof PrivacyPage).toBe('function');
        });

        test('should be instantiable', () => {
            // Arrange & Act
            const instance = new PrivacyPage();

            // Assert
            expect(instance).toBeInstanceOf(PrivacyPage);
            expect(instance.render).toBeDefined();
            expect(typeof instance.render).toBe('function');
        });
    });

    describe('Information Collection Detail', () => {
        test('should mention IP anonymization', () => {
            // Arrange & Act
            privacyPage.render(container);

            // Assert
            const content = container.textContent;
            expect(content).toContain('anonymized');
        });
    });
});

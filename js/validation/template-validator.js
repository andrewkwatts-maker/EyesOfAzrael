/**
 * Template Validator
 * Validates site templates and ensures Firebase asset compatibility
 */

class TemplateValidator {
    constructor() {
        this.requiredTemplateElements = {
            'deity-detail': [
                '.entity-header',
                '.entity-content',
                '[data-firebase-source]',
                '[data-entity-type="deity"]'
            ],
            'hero-detail': [
                '.entity-header',
                '.entity-content',
                '[data-firebase-source]',
                '[data-entity-type="hero"]'
            ],
            'creature-detail': [
                '.entity-header',
                '.entity-content',
                '[data-firebase-source]',
                '[data-entity-type="creature"]'
            ],
            'list-page': [
                '.entity-grid',
                '[data-firebase-collection]'
            ],
            'index-page': [
                '[data-dynamic-nav]',
                '.mythology-section'
            ]
        };

        this.requiredScripts = [
            '/js/firebase-asset-loader.js',
            '/js/entity-renderer-firebase.js',
            '/js/components/universal-display-renderer.js'
        ];

        this.requiredStyles = [
            '/themes/theme-base.css',
            '/css/entity-cards.css'
        ];
    }

    /**
     * Validate HTML template
     * @param {string} html - HTML content to validate
     * @param {string} templateType - Type of template (deity-detail, list-page, etc.)
     */
    validateTemplate(html, templateType) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const errors = [];
        const warnings = [];

        // Check for required elements
        const requiredElements = this.requiredTemplateElements[templateType] || [];

        for (const selector of requiredElements) {
            const element = doc.querySelector(selector);
            if (!element) {
                errors.push({
                    type: 'missing-element',
                    message: `Required element missing: ${selector}`,
                    severity: 'error',
                    selector
                });
            }
        }

        // Check for required scripts
        const scripts = Array.from(doc.querySelectorAll('script[src]'))
            .map(s => s.getAttribute('src'));

        for (const requiredScript of this.requiredScripts) {
            if (!scripts.some(s => s && s.includes(requiredScript))) {
                warnings.push({
                    type: 'missing-script',
                    message: `Recommended script missing: ${requiredScript}`,
                    severity: 'warning',
                    script: requiredScript
                });
            }
        }

        // Check for required styles
        const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => l.getAttribute('href'));

        for (const requiredStyle of this.requiredStyles) {
            if (!styles.some(s => s && s.includes(requiredStyle))) {
                warnings.push({
                    type: 'missing-style',
                    message: `Recommended stylesheet missing: ${requiredStyle}`,
                    severity: 'warning',
                    stylesheet: requiredStyle
                });
            }
        }

        // Check for Firebase data attributes
        this.validateFirebaseAttributes(doc, errors, warnings);

        // Check for proper encoding
        const metaCharset = doc.querySelector('meta[charset]');
        if (!metaCharset || metaCharset.getAttribute('charset').toLowerCase() !== 'utf-8') {
            warnings.push({
                type: 'charset',
                message: 'Template should specify UTF-8 charset',
                severity: 'warning'
            });
        }

        // Check for viewport meta tag
        const viewport = doc.querySelector('meta[name="viewport"]');
        if (!viewport) {
            warnings.push({
                type: 'viewport',
                message: 'Template should include viewport meta tag for responsive design',
                severity: 'warning'
            });
        }

        return {
            isValid: errors.length === 0,
            templateType,
            errors,
            warnings,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate Firebase data attributes
     */
    validateFirebaseAttributes(doc, errors, warnings) {
        // Check for firebase-source attributes
        const firebaseSources = doc.querySelectorAll('[data-firebase-source]');

        if (firebaseSources.length === 0) {
            warnings.push({
                type: 'firebase-integration',
                message: 'No Firebase data sources found. Template may not load dynamic content.',
                severity: 'warning'
            });
        }

        // Validate each firebase-source
        firebaseSources.forEach((element, index) => {
            const source = element.getAttribute('data-firebase-source');
            const entityType = element.getAttribute('data-entity-type');

            if (!source) {
                errors.push({
                    type: 'invalid-attribute',
                    message: `Element ${index + 1} has empty data-firebase-source`,
                    severity: 'error',
                    element: element.outerHTML.substring(0, 100)
                });
            }

            if (!entityType) {
                warnings.push({
                    type: 'missing-attribute',
                    message: `Element ${index + 1} missing data-entity-type attribute`,
                    severity: 'warning'
                });
            }
        });

        // Check for firebase-collection attributes
        const collections = doc.querySelectorAll('[data-firebase-collection]');

        collections.forEach((element, index) => {
            const collection = element.getAttribute('data-firebase-collection');

            if (!collection) {
                errors.push({
                    type: 'invalid-attribute',
                    message: `Element ${index + 1} has empty data-firebase-collection`,
                    severity: 'error',
                    element: element.outerHTML.substring(0, 100)
                });
            }
        });
    }

    /**
     * Validate template file structure
     */
    async validateTemplateFile(file) {
        try {
            const content = await this.readFile(file);

            // Detect template type from filename or content
            const templateType = this.detectTemplateType(file.name, content);

            // Validate template
            const validation = this.validateTemplate(content, templateType);

            return {
                filename: file.name,
                fileSize: file.size,
                ...validation
            };

        } catch (error) {
            return {
                isValid: false,
                filename: file.name,
                errors: [{
                    type: 'file-error',
                    message: 'Failed to read or parse template file: ' + error.message,
                    severity: 'error'
                }],
                warnings: []
            };
        }
    }

    /**
     * Detect template type from filename or content
     */
    detectTemplateType(filename, content) {
        // Check filename patterns
        if (filename.includes('deity') || filename.includes('deities')) {
            return 'deity-detail';
        } else if (filename.includes('hero') || filename.includes('heroes')) {
            return 'hero-detail';
        } else if (filename.includes('creature')) {
            return 'creature-detail';
        } else if (filename.includes('index')) {
            return 'index-page';
        }

        // Check content for data attributes
        if (content.includes('data-entity-type="deity"')) {
            return 'deity-detail';
        } else if (content.includes('data-entity-type="hero"')) {
            return 'hero-detail';
        } else if (content.includes('data-entity-type="creature"')) {
            return 'creature-detail';
        } else if (content.includes('entity-grid')) {
            return 'list-page';
        }

        return 'unknown';
    }

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Generate template compliance report
     */
    generateComplianceReport(validation) {
        const { isValid, templateType, errors, warnings, filename } = validation;

        return {
            template: filename || 'unknown',
            type: templateType,
            compliant: isValid,
            errorCount: errors.length,
            warningCount: warnings.length,
            errors: errors.map(e => ({
                type: e.type,
                message: e.message,
                severity: e.severity
            })),
            warnings: warnings.map(w => ({
                type: w.type,
                message: w.message,
                severity: w.severity
            })),
            recommendations: this.generateRecommendations(errors, warnings),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations(errors, warnings) {
        const recommendations = [];

        // Check for common issues
        const missingScripts = errors.filter(e => e.type === 'missing-script');
        if (missingScripts.length > 0) {
            recommendations.push({
                title: 'Add Required Scripts',
                description: 'Include all required JavaScript files for Firebase integration',
                priority: 'high',
                scripts: missingScripts.map(e => e.script)
            });
        }

        const missingElements = errors.filter(e => e.type === 'missing-element');
        if (missingElements.length > 0) {
            recommendations.push({
                title: 'Add Required Elements',
                description: 'Template is missing required HTML elements',
                priority: 'high',
                elements: missingElements.map(e => e.selector)
            });
        }

        const firebaseIssues = warnings.filter(w => w.type === 'firebase-integration');
        if (firebaseIssues.length > 0) {
            recommendations.push({
                title: 'Add Firebase Data Attributes',
                description: 'Add data-firebase-source attributes to enable dynamic content loading',
                priority: 'medium',
                example: '<div data-firebase-source="deities/zeus" data-entity-type="deity"></div>'
            });
        }

        return recommendations;
    }

    /**
     * Validate multiple templates in batch
     */
    async validateBatch(files) {
        const results = [];

        for (const file of files) {
            const validation = await this.validateTemplateFile(file);
            results.push(validation);
        }

        const validCount = results.filter(r => r.isValid).length;
        const invalidCount = results.length - validCount;

        return {
            totalTemplates: files.length,
            validCount,
            invalidCount,
            results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Auto-fix common template issues
     */
    autoFixTemplate(html, templateType) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const fixes = [];

        // Add missing charset
        if (!doc.querySelector('meta[charset="UTF-8"]')) {
            const charset = doc.createElement('meta');
            charset.setAttribute('charset', 'UTF-8');
            doc.head.insertBefore(charset, doc.head.firstChild);
            fixes.push('Added UTF-8 charset meta tag');
        }

        // Add missing viewport
        if (!doc.querySelector('meta[name="viewport"]')) {
            const viewport = doc.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            doc.head.appendChild(viewport);
            fixes.push('Added viewport meta tag');
        }

        // Add missing stylesheets
        const existingStyles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => l.getAttribute('href'));

        for (const requiredStyle of this.requiredStyles) {
            if (!existingStyles.some(s => s && s.includes(requiredStyle))) {
                const link = doc.createElement('link');
                link.setAttribute('rel', 'stylesheet');
                link.setAttribute('href', requiredStyle);
                doc.head.appendChild(link);
                fixes.push(`Added stylesheet: ${requiredStyle}`);
            }
        }

        const fixedHtml = new XMLSerializer().serializeToString(doc);

        return {
            html: fixedHtml,
            fixes,
            fixCount: fixes.length
        };
    }
}

// Export for both module and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateValidator;
}

if (typeof window !== 'undefined') {
    window.TemplateValidator = TemplateValidator;
}

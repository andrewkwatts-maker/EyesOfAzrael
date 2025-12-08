/**
 * Content Migration Tool
 * Extracts content from HTML files and uploads to Firestore
 * Supports all content types: deities, heroes, creatures, places, etc.
 */

class ContentExtractor {
    constructor() {
        this.parser = new DOMParser();
    }

    /**
     * Extract metadata from file path
     * Example: mythos/greek/deities/zeus.html
     * Returns: { mythology: 'greek', section: 'deities', filename: 'zeus' }
     */
    extractMetadataFromPath(filePath) {
        const parts = filePath.split('/').filter(p => p && p !== '.');

        let mythology = '';
        let section = '';
        let filename = '';

        // Find mythology (should be after 'mythos')
        const mythosIndex = parts.findIndex(p => p === 'mythos');
        if (mythosIndex >= 0 && mythosIndex + 1 < parts.length) {
            mythology = parts[mythosIndex + 1];
        }

        // Find section (should be after mythology)
        if (mythosIndex >= 0 && mythosIndex + 2 < parts.length) {
            section = parts[mythosIndex + 2];
        }

        // Get filename without extension
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.endsWith('.html')) {
            filename = lastPart.replace('.html', '');
        }

        // Infer content type from section
        const contentType = this.inferContentType(section);

        return {
            mythology,
            section,
            filename,
            contentType,
            filePath
        };
    }

    /**
     * Infer content type from section path
     */
    inferContentType(section) {
        const typeMap = {
            'deities': 'deity',
            'heroes': 'hero',
            'creatures': 'creature',
            'places': 'place',
            'cosmology': 'cosmology',
            'concepts': 'concept',
            'rituals': 'ritual',
            'magic': 'magic',
            'herbs': 'herb',
            'symbols': 'symbol',
            'texts': 'text',
            'archetypes': 'archetype',
            'lineage': 'lineage',
            'events': 'event',
            'teachings': 'concept',
            'theology': 'concept'
        };

        return typeMap[section] || 'concept';
    }

    /**
     * Extract content from HTML string
     */
    extractContent(htmlString, metadata) {
        const doc = this.parser.parseFromString(htmlString, 'text/html');

        const content = {
            title: this.extractTitle(doc),
            subtitle: this.extractSubtitle(doc),
            icon: this.extractIcon(doc),
            summary: this.extractSummary(doc),
            attributes: this.extractAttributes(doc, metadata.contentType),
            richContent: this.extractRichContent(doc),
            sources: this.extractSources(doc),
            relatedContent: this.extractRelatedContent(doc),
            ...metadata
        };

        return content;
    }

    /**
     * Extract title from HTML
     */
    extractTitle(doc) {
        // Try header h1 first
        let title = doc.querySelector('header h1')?.textContent?.trim();

        // Try deity/hero/creature header h2
        if (!title) {
            title = doc.querySelector('.deity-header h2, .hero-header h2, .hero-section h2')?.textContent?.trim();
        }

        // Try main h1/h2
        if (!title) {
            title = doc.querySelector('main h1, main h2')?.textContent?.trim();
        }

        // Try page title
        if (!title) {
            const pageTitle = doc.querySelector('title')?.textContent?.trim();
            if (pageTitle) {
                // Extract from "Greek - Zeus" format
                const parts = pageTitle.split('-').map(p => p.trim());
                title = parts[parts.length - 1];
            }
        }

        // Clean up corpus links and extra whitespace
        if (title) {
            title = title.replace(/[⚡🏛️👑🔱🦉💀🌊🔥🌙☀️⚔️🦅🐍💪🏹🌿]/g, '').trim();
        }

        return title || 'Untitled';
    }

    /**
     * Extract subtitle from HTML
     */
    extractSubtitle(doc) {
        // Look for subtitle class
        let subtitle = doc.querySelector('.subtitle')?.textContent?.trim();

        // Look for header paragraphs with specific font sizes
        if (!subtitle) {
            const headerP = doc.querySelector('.deity-header p[style*="1.5rem"], .hero-header p[style*="1.5rem"]');
            if (headerP) {
                subtitle = headerP.textContent.trim();
            }
        }

        return subtitle || '';
    }

    /**
     * Extract icon/emoji from HTML
     */
    extractIcon(doc) {
        // Try deity/hero icon
        let icon = doc.querySelector('.deity-icon, .hero-icon, .hero-icon-display')?.textContent?.trim();

        // Try header h1 emoji
        if (!icon) {
            const headerH1 = doc.querySelector('header h1')?.textContent;
            if (headerH1) {
                const emojiMatch = headerH1.match(/[⚡🏛️👑🔱🦉💀🌊🔥🌙☀️⚔️🦅🐍💪🏹🌿🐲🦁🦋🌸🗡️⚖️📚🎭🎨🎵]/);
                if (emojiMatch) {
                    icon = emojiMatch[0];
                }
            }
        }

        return icon || '';
    }

    /**
     * Extract summary from HTML
     */
    extractSummary(doc) {
        // Try header description paragraph
        let summary = doc.querySelector('.deity-header > p:not(.subtitle), .hero-header > p:not(.subtitle), .hero-description')?.textContent?.trim();

        // Try first section paragraph
        if (!summary) {
            summary = doc.querySelector('main section:first-of-type > p:first-of-type')?.textContent?.trim();
        }

        // Limit to reasonable length for summary (1-3 sentences)
        if (summary && summary.length > 500) {
            const sentences = summary.match(/[^.!?]+[.!?]+/g) || [];
            summary = sentences.slice(0, 2).join(' ').trim();
        }

        return summary || '';
    }

    /**
     * Extract deity attributes
     */
    extractDeityAttributes(doc) {
        const attributes = {
            titles: [],
            domains: [],
            symbols: [],
            sacredAnimals: [],
            sacredPlants: [],
            colors: [],
            consorts: [],
            children: [],
            parents: [],
            siblings: []
        };

        // Extract from attribute cards
        doc.querySelectorAll('.attribute-card').forEach(card => {
            const label = card.querySelector('.attribute-label')?.textContent?.toLowerCase().trim();
            const value = card.querySelector('.attribute-value')?.textContent?.trim();

            if (!label || !value) return;

            if (label.includes('title')) {
                attributes.titles = this.splitAttributeValue(value);
            } else if (label.includes('domain')) {
                attributes.domains = this.splitAttributeValue(value);
            } else if (label.includes('symbol')) {
                attributes.symbols = this.splitAttributeValue(value);
            } else if (label.includes('sacred') && label.includes('animal')) {
                attributes.sacredAnimals = this.splitAttributeValue(value);
            } else if (label.includes('sacred') && label.includes('plant')) {
                attributes.sacredPlants = this.splitAttributeValue(value);
            } else if (label.includes('color')) {
                attributes.colors = this.splitAttributeValue(value);
            }
        });

        // Extract family relationships
        const relationshipSection = this.findSectionByHeading(doc, 'relationships', 'family');
        if (relationshipSection) {
            const lists = relationshipSection.querySelectorAll('ul li');
            lists.forEach(li => {
                const text = li.textContent;
                if (text.toLowerCase().includes('parent')) {
                    attributes.parents = this.extractNames(text);
                } else if (text.toLowerCase().includes('consort')) {
                    attributes.consorts = this.extractNames(text);
                } else if (text.toLowerCase().includes('children')) {
                    attributes.children = this.extractNames(text);
                } else if (text.toLowerCase().includes('sibling')) {
                    attributes.siblings = this.extractNames(text);
                }
            });
        }

        return attributes;
    }

    /**
     * Extract hero attributes
     */
    extractHeroAttributes(doc) {
        const attributes = {
            epithet: '',
            parentage: [],
            notableDeeds: [],
            weapons: [],
            companions: [],
            fateOrDeath: ''
        };

        // Extract from attribute cards
        doc.querySelectorAll('.attribute-card').forEach(card => {
            const label = card.querySelector('.attribute-label')?.textContent?.toLowerCase().trim();
            const value = card.querySelector('.attribute-value')?.textContent?.trim();

            if (!label || !value) return;

            if (label.includes('title') || label.includes('epithet')) {
                attributes.epithet = value;
            } else if (label.includes('weapon') || label.includes('item')) {
                attributes.weapons = this.splitAttributeValue(value);
            }
        });

        // Extract parentage from relationship section
        const relationshipSection = this.findSectionByHeading(doc, 'relationships', 'family');
        if (relationshipSection) {
            const lists = relationshipSection.querySelectorAll('ul li');
            lists.forEach(li => {
                const text = li.textContent;
                if (text.toLowerCase().includes('parent')) {
                    attributes.parentage = this.extractNames(text);
                }
            });
        }

        // Extract notable deeds from mythology section
        const mythologySection = this.findSectionByHeading(doc, 'mythology', 'stories', 'labors', 'deeds');
        if (mythologySection) {
            const listItems = mythologySection.querySelectorAll('ul li, .labor-card');
            listItems.forEach(li => {
                const deed = li.querySelector('.labor-title')?.textContent?.trim() ||
                           li.textContent.split(':')[0]?.trim();
                if (deed && deed.length > 5) {
                    attributes.notableDeeds.push(deed);
                }
            });
        }

        return attributes;
    }

    /**
     * Extract creature attributes
     */
    extractCreatureAttributes(doc) {
        const attributes = {
            species: '',
            appearance: '',
            abilities: [],
            weaknesses: [],
            habitat: '',
            origin: '',
            slainBy: ''
        };

        // Extract from glass-card sections
        doc.querySelectorAll('.glass-card').forEach(card => {
            const heading = card.querySelector('h3')?.textContent?.toLowerCase().trim();
            const content = card.textContent.trim();

            if (heading?.includes('feature') || heading?.includes('description')) {
                attributes.appearance = content.substring(0, 500);
            } else if (heading?.includes('origin') || heading?.includes('curse')) {
                attributes.origin = content.substring(0, 500);
            }

            // Extract abilities from lists
            card.querySelectorAll('ul li').forEach(li => {
                const text = li.textContent.trim();
                if (text.includes(':')) {
                    const ability = text.split(':')[0].trim();
                    if (ability.length > 0) {
                        attributes.abilities.push(ability);
                    }
                }
            });
        });

        // Look for slain by information
        const questSection = this.findSectionByHeading(doc, 'quest', 'perseus', 'heracles', 'hero');
        if (questSection) {
            const text = questSection.textContent;
            const heroMatch = text.match(/([A-Z][a-z]+)\s+(slew|killed|defeated|beheaded)/i);
            if (heroMatch) {
                attributes.slainBy = heroMatch[1];
            }
        }

        return attributes;
    }

    /**
     * Extract attributes based on content type
     */
    extractAttributes(doc, contentType) {
        switch (contentType) {
            case 'deity':
                return this.extractDeityAttributes(doc);
            case 'hero':
                return this.extractHeroAttributes(doc);
            case 'creature':
                return this.extractCreatureAttributes(doc);
            default:
                return {};
        }
    }

    /**
     * Extract rich content panels
     */
    extractRichContent(doc) {
        const panels = [];

        // Extract main content sections (skip header and navigation)
        const sections = doc.querySelectorAll('main > section:not(.deity-header):not(.hero-header):not(.hero-section):not(.interlink-panel)');

        sections.forEach(section => {
            const heading = section.querySelector('h2, h3')?.textContent?.trim();
            if (!heading) return;

            // Skip attribute sections (already extracted)
            if (heading.toLowerCase().includes('attribute')) return;

            // Get section content
            const contentHtml = section.innerHTML;

            panels.push({
                type: 'text',
                title: heading,
                content: this.cleanHtmlForPanel(contentHtml),
                style: 'default'
            });
        });

        return { panels };
    }

    /**
     * Clean HTML content for storage in panels
     */
    cleanHtmlForPanel(html) {
        // Remove class and style attributes for cleaner storage
        let cleaned = html.replace(/\s+class="[^"]*"/g, '');
        cleaned = cleaned.replace(/\s+style="[^"]*"/g, '');

        // Keep basic formatting tags
        cleaned = cleaned.replace(/<(h[1-6]|p|ul|ol|li|strong|em|a)([^>]*)>/gi, '<$1>');

        // Limit length
        if (cleaned.length > 10000) {
            cleaned = cleaned.substring(0, 10000) + '...';
        }

        return cleaned;
    }

    /**
     * Extract sources/citations
     */
    extractSources(doc) {
        const citationDiv = doc.querySelector('.citation, .sources');
        if (citationDiv) {
            return citationDiv.textContent.replace('Sources:', '').trim();
        }
        return '';
    }

    /**
     * Extract related content links
     */
    extractRelatedContent(doc) {
        const related = [];

        // Extract from "See Also" section
        const seeAlsoLinks = doc.querySelectorAll('.see-also-link');
        seeAlsoLinks.forEach(link => {
            const text = link.textContent.trim().replace(/^[⚡👑🔱🦉💀🌊🔥🌙☀️⚔️🦅🐍💪🏹🌿🐲🦁🦋🌸🗡️⚖️📚🎭🎨🎵]\s*/, '');
            if (text && text.length > 0) {
                related.push(text);
            }
        });

        return related;
    }

    /**
     * Find section by heading text
     */
    findSectionByHeading(doc, ...keywords) {
        const sections = doc.querySelectorAll('section');
        for (const section of sections) {
            const heading = section.querySelector('h2, h3')?.textContent?.toLowerCase().trim();
            if (heading && keywords.some(keyword => heading.includes(keyword))) {
                return section;
            }
        }
        return null;
    }

    /**
     * Split attribute value by commas/semicolons
     */
    splitAttributeValue(value) {
        return value
            .split(/[,;]/)
            .map(v => v.trim())
            .filter(v => v.length > 0 && !v.toLowerCase().includes('(disputed)'))
            .map(v => v.replace(/\([^)]*\)/g, '').trim()); // Remove parenthetical notes
    }

    /**
     * Extract names from text (handles "X, Y, and Z" format)
     */
    extractNames(text) {
        // Remove the label part (e.g., "Parents: ")
        const colonIndex = text.indexOf(':');
        if (colonIndex > 0) {
            text = text.substring(colonIndex + 1);
        }

        // Split by commas and 'and'
        return text
            .split(/,|\sand\s/)
            .map(name => name.trim())
            .map(name => name.replace(/\([^)]*\)/g, '').trim()) // Remove parenthetical notes
            .filter(name => name.length > 0 && name.length < 50); // Reasonable name length
    }
}

/**
 * Content Migration Tool
 * Manages the migration process from HTML to Firestore
 */
class ContentMigrationTool {
    constructor() {
        this.extractor = new ContentExtractor();
        this.extractedContent = [];
        this.failedExtractions = [];
        this.stats = {
            totalFiles: 0,
            successful: 0,
            failed: 0,
            byType: {},
            byMythology: {}
        };
    }

    /**
     * Process single HTML file
     */
    async processFile(filePath, htmlContent) {
        try {
            // Extract metadata from path
            const metadata = this.extractor.extractMetadataFromPath(filePath);

            // Skip index files
            if (metadata.filename === 'index' || metadata.filename === 'corpus-search') {
                console.log(`Skipping index file: ${filePath}`);
                return null;
            }

            // Extract content from HTML
            const content = this.extractor.extractContent(htmlContent, metadata);

            // Validate
            if (!content.title || content.title === 'Untitled') {
                throw new Error('Could not extract title');
            }

            // Update stats
            this.stats.successful++;
            this.stats.byType[content.contentType] = (this.stats.byType[content.contentType] || 0) + 1;
            this.stats.byMythology[content.mythology] = (this.stats.byMythology[content.mythology] || 0) + 1;

            console.log(`✓ Extracted: ${content.title} (${content.contentType} - ${content.mythology})`);
            return content;
        } catch (error) {
            this.stats.failed++;
            this.failedExtractions.push({
                filePath,
                error: error.message
            });
            console.error(`✗ Failed to extract ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Process multiple files
     */
    async processFiles(fileDataArray) {
        this.stats.totalFiles = fileDataArray.length;
        this.extractedContent = [];
        this.failedExtractions = [];

        console.log(`Processing ${fileDataArray.length} files...`);

        for (const fileData of fileDataArray) {
            const content = await this.processFile(fileData.path, fileData.html);
            if (content) {
                this.extractedContent.push(content);
            }
        }

        console.log(`\nExtraction complete:`);
        console.log(`  Total: ${this.stats.totalFiles}`);
        console.log(`  Successful: ${this.stats.successful}`);
        console.log(`  Failed: ${this.stats.failed}`);
        console.log(`\nBy Type:`, this.stats.byType);
        console.log(`By Mythology:`, this.stats.byMythology);

        return {
            extracted: this.extractedContent,
            failed: this.failedExtractions,
            stats: this.stats
        };
    }

    /**
     * Validate extracted content
     */
    validateExtracted() {
        const validationResults = {
            valid: [],
            warnings: [],
            errors: []
        };

        for (const content of this.extractedContent) {
            const issues = [];

            // Check required fields
            if (!content.title) issues.push('Missing title');
            if (!content.summary || content.summary.length < 10) issues.push('Summary too short or missing');
            if (!content.mythology) issues.push('Missing mythology');
            if (!content.contentType) issues.push('Missing content type');

            // Check attributes
            if (content.contentType === 'deity' && (!content.attributes.domains || content.attributes.domains.length === 0)) {
                issues.push('Deity missing domains');
            }

            if (issues.length > 0) {
                validationResults.warnings.push({
                    title: content.title,
                    filePath: content.filePath,
                    issues
                });
            } else {
                validationResults.valid.push(content.title);
            }
        }

        console.log(`\nValidation Results:`);
        console.log(`  Valid: ${validationResults.valid.length}`);
        console.log(`  Warnings: ${validationResults.warnings.length}`);
        console.log(`  Errors: ${validationResults.errors.length}`);

        return validationResults;
    }

    /**
     * Generate preview report
     */
    generatePreviewReport() {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            sample: this.extractedContent.slice(0, 5),
            failed: this.failedExtractions
        };

        return report;
    }

    /**
     * Upload to Firestore
     */
    async uploadToFirestore(options = {}) {
        if (!window.firebaseContentDB) {
            throw new Error('FirebaseContentDB not available');
        }

        console.log(`\nUploading ${this.extractedContent.length} items to Firestore...`);

        const results = await window.firebaseContentDB.batchCreateContent(
            this.extractedContent,
            { isDefault: true, ...options }
        );

        console.log(`\nUpload Results:`);
        console.log(`  Successful: ${results.successful.length}`);
        console.log(`  Failed: ${results.failed.length}`);

        return results;
    }

    /**
     * Generate migration report
     */
    generateMigrationReport(uploadResults) {
        const report = {
            timestamp: new Date().toISOString(),
            extraction: {
                total: this.stats.totalFiles,
                successful: this.stats.successful,
                failed: this.stats.failed,
                byType: this.stats.byType,
                byMythology: this.stats.byMythology
            },
            upload: {
                successful: uploadResults.successful.length,
                failed: uploadResults.failed.length,
                items: uploadResults.successful
            },
            failures: {
                extraction: this.failedExtractions,
                upload: uploadResults.failed
            }
        };

        return report;
    }

    /**
     * Reset tool state
     */
    reset() {
        this.extractedContent = [];
        this.failedExtractions = [];
        this.stats = {
            totalFiles: 0,
            successful: 0,
            failed: 0,
            byType: {},
            byMythology: {}
        };
    }
}

// Create global instance
window.contentMigrationTool = new ContentMigrationTool();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContentExtractor, ContentMigrationTool };
}

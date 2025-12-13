#!/usr/bin/env node

/**
 * Hindu Mythology Content Scanner and Migration Analyzer
 *
 * This script:
 * 1. Scans all HTML files in the old Hindu mythology directory
 * 2. Extracts entity data from each file
 * 3. Compares with Firebase structure
 * 4. Generates comprehensive migration report
 * 5. Creates JSON files ready for Firebase import
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // For HTML parsing - install with: npm install cheerio

// Configuration
const OLD_REPO_PATH = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\hindu';
const CURRENT_REPO_PATH = 'H:\\Github\\EyesOfAzrael';
const OUTPUT_DIR = path.join(CURRENT_REPO_PATH, 'scripts', 'reports');

// Initialize tracking
const inventory = {
    deities: [],
    heroes: [],
    creatures: [],
    beings: [],
    cosmology: [],
    texts: [],
    herbs: [],
    symbols: [],
    rituals: [],
    magic: [],
    paths: [],
    figures: []
};

const stats = {
    totalFiles: 0,
    processedFiles: 0,
    errors: [],
    categories: {}
};

/**
 * Extract entity data from HTML file
 */
function extractEntityData(filePath, category) {
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);

        // Extract basic information
        const title = $('h1').first().text().trim() || $('title').text().replace(' - Hindu Mythology', '').replace('Hindu - ', '').trim();
        const heroDescription = $('.hero-description').first().text().trim();
        const mainDescription = $('section.hero-section p').last().text().trim() || heroDescription;

        // Extract attributes
        const attributes = {};
        $('.attribute-card').each((i, elem) => {
            const label = $(elem).find('.attribute-label').text().trim();
            const value = $(elem).find('.attribute-value').text().trim();
            if (label && value) {
                attributes[label.toLowerCase()] = value;
            }
        });

        // Extract mythology content
        const mythologySection = $('section').filter((i, el) => {
            const h2 = $(el).find('h2').first().text();
            return h2.includes('Mythology') || h2.includes('Stories') || h2.includes('Life of');
        });

        const myths = [];
        mythologySection.find('li').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.length > 50) {
                const strongText = $(elem).find('strong').first().text().trim();
                myths.push({
                    title: strongText || `Myth ${i + 1}`,
                    content: text
                });
            }
        });

        // Extract relationships
        const relationships = {};
        $('section').filter((i, el) => {
            return $(el).find('h2').text().includes('Relationships');
        }).find('li').each((i, elem) => {
            const text = $(elem).text().trim();
            const strongText = $(elem).find('strong').first().text().replace(':', '').trim();
            if (strongText) {
                relationships[strongText.toLowerCase()] = text.replace(strongText + ':', '').trim();
            }
        });

        // Extract worship information
        const worship = {};
        $('section').filter((i, el) => {
            return $(el).find('h2').text().includes('Worship');
        }).each((i, section) => {
            $(section).find('h3').each((j, h3) => {
                const heading = $(h3).text().trim().toLowerCase();
                const content = $(h3).next('p, ul').text().trim();
                if (content) {
                    worship[heading] = content;
                }
            });
        });

        // Extract primary sources
        const sources = [];
        $('.citation').each((i, elem) => {
            sources.push($(elem).text().trim());
        });

        // Determine entity ID from filename
        const fileName = path.basename(filePath, '.html');
        const entityId = fileName.toLowerCase().replace(/\s+/g, '-');

        // Create entity object
        const entity = {
            id: entityId,
            name: title.replace(/[^\w\s-]/g, '').trim(),
            displayName: title,
            mythology: 'hindu',
            category: category,
            description: mainDescription || heroDescription,
            attributes: attributes,
            myths: myths,
            relationships: relationships,
            worship: worship,
            sources: sources,

            // Metadata
            metadata: {
                sourceFile: filePath,
                extractedAt: new Date().toISOString(),
                verified: false,
                needsReview: myths.length === 0 || !mainDescription
            }
        };

        // Clean up icon characters from name
        entity.name = entity.name.replace(/^[^\w\s]+\s*/, '');

        return entity;

    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        stats.errors.push({
            file: filePath,
            error: error.message
        });
        return null;
    }
}

/**
 * Recursively scan directory for HTML files
 */
function scanDirectory(dirPath, category = null) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            // Determine category from directory name
            const subCategory = entry.name;
            scanDirectory(fullPath, subCategory);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            // Skip index and utility files
            if (entry.name === 'index.html' || entry.name === 'corpus-search.html') {
                continue;
            }

            stats.totalFiles++;

            // Extract entity data
            const entity = extractEntityData(fullPath, category);
            if (entity) {
                stats.processedFiles++;

                // Add to appropriate category
                if (inventory[category]) {
                    inventory[category].push(entity);
                } else {
                    inventory[category] = [entity];
                }

                // Update category stats
                if (!stats.categories[category]) {
                    stats.categories[category] = 0;
                }
                stats.categories[category]++;

                console.log(`✓ Processed: ${entity.name} (${category})`);
            }
        }
    }
}

/**
 * Generate Firebase import format
 */
function generateFirebaseImport() {
    const firebaseData = {
        deities: {},
        heroes: {},
        creatures: {},
        concepts: {},
        texts: {},
        rituals: {},
        places: {}
    };

    // Map categories to Firebase collections
    const categoryMapping = {
        'deities': 'deities',
        'heroes': 'heroes',
        'creatures': 'creatures',
        'beings': 'creatures',
        'cosmology': 'concepts',
        'texts': 'texts',
        'herbs': 'items',
        'symbols': 'symbols',
        'rituals': 'rituals',
        'magic': 'concepts',
        'path': 'concepts',
        'figures': 'heroes'
    };

    for (const [category, entities] of Object.entries(inventory)) {
        const firebaseCollection = categoryMapping[category] || 'miscellaneous';

        if (!firebaseData[firebaseCollection]) {
            firebaseData[firebaseCollection] = {};
        }

        for (const entity of entities) {
            const docId = entity.id;

            // Transform to Firebase document format
            firebaseData[firebaseCollection][docId] = {
                name: entity.name,
                displayName: entity.displayName,
                mythology: 'hindu',
                category: category,

                // Description and content
                description: entity.description,

                // Attributes
                domains: entity.attributes.domains ?
                    entity.attributes.domains.split(',').map(d => d.trim()) : [],
                symbols: entity.attributes.symbols ?
                    entity.attributes.symbols.split(',').map(s => s.trim()) : [],
                titles: entity.attributes.titles ?
                    entity.attributes.titles.split(',').map(t => t.trim()) : [],

                // Mythology content
                myths: entity.myths,

                // Relationships
                relationships: entity.relationships,

                // Worship
                worship: entity.worship,

                // Sources
                sources: entity.sources,

                // Metadata
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                verified: false,
                migrationSource: 'html_extraction',
                needsReview: entity.metadata.needsReview
            };
        }
    }

    return firebaseData;
}

/**
 * Generate comprehensive report
 */
function generateReport(firebaseData) {
    const report = {
        summary: {
            scanDate: new Date().toISOString(),
            totalFilesFound: stats.totalFiles,
            filesProcessed: stats.processedFiles,
            filesFailed: stats.errors.length,
            totalEntities: Object.values(inventory).reduce((sum, arr) => sum + arr.length, 0)
        },

        categoryBreakdown: stats.categories,

        entities: inventory,

        firebaseReadyData: firebaseData,

        errors: stats.errors,

        recommendations: []
    };

    // Generate recommendations
    for (const [category, entities] of Object.entries(inventory)) {
        const needsReview = entities.filter(e => e.metadata.needsReview);
        if (needsReview.length > 0) {
            report.recommendations.push({
                type: 'needs_review',
                category: category,
                count: needsReview.length,
                message: `${needsReview.length} ${category} entities need manual review for missing content`
            });
        }
    }

    // Check for entities with minimal data
    for (const [category, entities] of Object.entries(inventory)) {
        const minimal = entities.filter(e => {
            return !e.description || e.description.length < 50 || e.myths.length === 0;
        });

        if (minimal.length > 0) {
            report.recommendations.push({
                type: 'minimal_content',
                category: category,
                count: minimal.length,
                entities: minimal.map(e => e.name),
                message: `${minimal.length} ${category} entities have minimal content and should be enriched`
            });
        }
    }

    return report;
}

/**
 * Main execution
 */
async function main() {
    console.log('🔍 Starting Hindu mythology content scan...\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Check if old repository exists
    if (!fs.existsSync(OLD_REPO_PATH)) {
        console.error(`❌ Error: Old repository not found at ${OLD_REPO_PATH}`);
        console.error('Please ensure the path is correct and the repository is accessible.');
        process.exit(1);
    }

    console.log(`📂 Scanning: ${OLD_REPO_PATH}\n`);

    // Scan the directory
    scanDirectory(OLD_REPO_PATH);

    console.log('\n📊 Generating Firebase import data...\n');

    // Generate Firebase import format
    const firebaseData = generateFirebaseImport();

    console.log('📝 Generating comprehensive report...\n');

    // Generate report
    const report = generateReport(firebaseData);

    // Save outputs
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    // Save full report
    const reportPath = path.join(OUTPUT_DIR, `hindu-migration-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved: ${reportPath}`);

    // Save Firebase import data
    const firebasePath = path.join(OUTPUT_DIR, `hindu-firebase-import-${timestamp}.json`);
    fs.writeFileSync(firebasePath, JSON.stringify(firebaseData, null, 2));
    console.log(`✅ Firebase data saved: ${firebasePath}`);

    // Save entity inventory
    const inventoryPath = path.join(OUTPUT_DIR, `hindu-entity-inventory-${timestamp}.json`);
    fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
    console.log(`✅ Entity inventory saved: ${inventoryPath}`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 HINDU MYTHOLOGY MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total HTML files found: ${stats.totalFiles}`);
    console.log(`Files successfully processed: ${stats.processedFiles}`);
    console.log(`Files with errors: ${stats.errors.length}`);
    console.log(`Total entities extracted: ${report.summary.totalEntities}`);
    console.log('\n📁 Category Breakdown:');
    for (const [category, count] of Object.entries(stats.categories)) {
        console.log(`  - ${category}: ${count} entities`);
    }

    if (report.recommendations.length > 0) {
        console.log('\n⚠️  Recommendations:');
        for (const rec of report.recommendations) {
            console.log(`  - ${rec.message}`);
        }
    }

    if (stats.errors.length > 0) {
        console.log('\n❌ Errors:');
        for (const error of stats.errors.slice(0, 5)) {
            console.log(`  - ${path.basename(error.file)}: ${error.error}`);
        }
        if (stats.errors.length > 5) {
            console.log(`  ... and ${stats.errors.length - 5} more errors (see full report)`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Scan complete! Check the reports directory for detailed output.');
    console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    extractEntityData,
    scanDirectory,
    generateFirebaseImport,
    generateReport
};

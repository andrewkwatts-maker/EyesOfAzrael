/**
 * Migration Script: Egyptian Deities from HTML to Firebase JSON
 *
 * This script extracts deity information from the old HTML files in
 * H:\Github\EyesOfAzrael2\EyesOfAzrael\mythos\egyptian\deities\
 * and creates properly formatted JSON entities for Firebase.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const OLD_REPO_PATH = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\egyptian';
const NEW_REPO_PATH = 'H:\\Github\\EyesOfAzrael';
const OUTPUT_DIR = path.join(NEW_REPO_PATH, 'data', 'entities', 'deity');

// Deity icon mapping
const DEITY_ICONS = {
    'ra': '☀️',
    'isis': '✨',
    'osiris': '👑',
    'anubis': '🐺',
    'horus': '🦅',
    'set': '⚡',
    'thoth': '📜',
    'hathor': '🐄',
    'bastet': '🐱',
    'sekhmet': '🦁',
    'ptah': '🔨',
    'maat': '⚖️',
    'nut': '🌌',
    'geb': '🌍',
    'tefnut': '💧',
    'nephthys': '🕊️',
    'neith': '🏹',
    'sobek': '🐊',
    'amun-ra': '👁️',
    'atum': '🌅',
    'anhur': '🗡️',
    'apep': '🐍',
    'imhotep': '🏛️',
    'montu': '🐂',
    'satis': '💦'
};

/**
 * Parse HTML file and extract deity information
 */
function parseDeityHTML(filePath, deityId) {
    try {
        const html = fs.readFileSync(filePath, 'utf-8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Extract basic information
        const title = doc.querySelector('title')?.textContent?.split(' - ')[0]?.trim() || deityId;
        const header = doc.querySelector('.deity-header');

        // Extract subtitle/role
        let subtitle = '';
        const subtitleEl = header?.querySelector('.subtitle');
        if (subtitleEl) {
            subtitle = subtitleEl.textContent.trim();
        }

        // Extract summary from header paragraph
        let summary = '';
        const summaryP = header?.querySelector('p:not(.subtitle)');
        if (summaryP) {
            summary = summaryP.textContent.trim();
            // Clean up corpus links
            summary = summary.replace(/\s+/g, ' ');
        }

        // Extract attributes
        const attributes = {};
        const attributeCards = doc.querySelectorAll('.attribute-card');
        attributeCards.forEach(card => {
            const label = card.querySelector('.attribute-label')?.textContent?.trim();
            const value = card.querySelector('.attribute-value')?.textContent?.trim();
            if (label && value) {
                const key = label.toLowerCase().replace(/\s+/g, '');
                attributes[key] = value;
            }
        });

        // Extract mythology section
        let mythologyContent = '';
        const mythologySection = doc.querySelector('#mythology');
        if (mythologySection) {
            const keyMyths = mythologySection.querySelector('ul');
            if (keyMyths) {
                const myths = Array.from(keyMyths.querySelectorAll('li')).map(li => {
                    return li.textContent.trim().replace(/\s+/g, ' ');
                });
                mythologyContent = myths.join('\n\n');
            }
        }

        // Extract relationships
        const relationships = { family: {}, allies: [], enemies: [] };
        const relationshipsSection = doc.querySelector('#relationships');
        if (relationshipsSection) {
            const familyItems = relationshipsSection.querySelectorAll('ul li');
            familyItems.forEach(li => {
                const text = li.textContent.trim();
                if (text.startsWith('Parents:')) {
                    relationships.family.parents = text.replace('Parents:', '').trim();
                } else if (text.startsWith('Consort')) {
                    relationships.family.consort = text.replace(/Consort\(s\)?:/, '').trim();
                } else if (text.startsWith('Children:')) {
                    relationships.family.children = text.replace('Children:', '').trim();
                } else if (text.startsWith('Siblings:')) {
                    relationships.family.siblings = text.replace('Siblings:', '').trim();
                } else if (text.startsWith('Allies:')) {
                    relationships.allies = text.replace('Allies:', '').trim().split(',').map(s => s.trim());
                } else if (text.startsWith('Enemies:')) {
                    relationships.enemies = text.replace('Enemies:', '').trim().split(',').map(s => s.trim());
                }
            });
        }

        // Extract worship info
        let sacredSites = '';
        let festivals = [];
        let offerings = '';
        const worshipSection = doc.querySelector('#worship');
        if (worshipSection) {
            const sacredSitesP = worshipSection.querySelector('h3:nth-of-type(1) + p, h3:nth-of-type(1) + ul + p');
            if (sacredSitesP) {
                sacredSites = sacredSitesP.textContent.trim();
            }

            const festivalsUl = worshipSection.querySelector('h3:nth-of-type(2) + ul');
            if (festivalsUl) {
                festivals = Array.from(festivalsUl.querySelectorAll('li')).map(li => {
                    return li.textContent.trim().replace(/\s+/g, ' ');
                });
            }

            const offeringsP = Array.from(worshipSection.querySelectorAll('h3')).find(h3 =>
                h3.textContent.includes('Offerings')
            )?.nextElementSibling;
            if (offeringsP && offeringsP.tagName === 'P') {
                offerings = offeringsP.textContent.trim();
            }
        }

        return {
            id: deityId,
            title,
            subtitle,
            summary,
            attributes,
            mythology: mythologyContent,
            relationships,
            worship: {
                sacredSites,
                festivals,
                offerings
            }
        };
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Convert parsed data to Firebase entity format
 */
function createFirebaseEntity(parsedData) {
    const { id, title, subtitle, summary, attributes, mythology, relationships, worship } = parsedData;

    // Parse domains
    const domains = attributes.domains ?
        attributes.domains.split(',').map(d => d.trim()) : [];

    // Parse symbols
    const symbols = attributes.symbols ?
        attributes.symbols.split(',').map(s => s.trim()) : [];

    // Parse sacred animals
    const sacredAnimals = attributes.sacredanimals ?
        attributes.sacredanimals.split(',').map(a => a.trim()) : [];

    // Parse sacred plants
    const sacredPlants = attributes.sacredplants ?
        attributes.sacredplants.split(',').map(p => p.trim()) : [];

    // Parse colors
    const colors = attributes.colors ?
        attributes.colors.split(',').map(c => c.trim()) : [];

    // Create rich content panels
    const panels = [];

    // Attributes panel
    if (attributes.titles || domains.length > 0) {
        panels.push({
            type: 'attributes',
            title: 'Divine Attributes',
            content: {
                titles: attributes.titles || '',
                domains: domains,
                symbols: symbols,
                sacredAnimals: sacredAnimals,
                sacredPlants: sacredPlants,
                colors: colors
            }
        });
    }

    // Mythology panel
    if (mythology) {
        panels.push({
            type: 'text',
            title: 'Mythology & Stories',
            content: mythology
        });
    }

    // Relationships panel
    if (relationships.family || relationships.allies.length > 0) {
        panels.push({
            type: 'relationships',
            title: 'Divine Relationships',
            content: relationships
        });
    }

    // Worship panel
    if (worship.sacredSites || worship.festivals.length > 0) {
        panels.push({
            type: 'worship',
            title: 'Worship & Rituals',
            content: worship
        });
    }

    // Create the Firebase entity
    return {
        id: id,
        displayName: title,
        category: 'deity',
        mythology: 'egyptian',
        mythologyName: 'Egyptian Mythology',

        // Core content
        subtitle: subtitle || '',
        summary: summary || `${title} is an important deity in Egyptian mythology.`,

        // Rich content
        richContent: {
            panels: panels
        },

        // Icon
        icon: DEITY_ICONS[id] || '⭐',

        // Deity-specific attributes
        attributes: {
            titles: attributes.titles || '',
            domains: domains,
            symbols: symbols,
            sacredAnimals: sacredAnimals,
            sacredPlants: sacredPlants,
            colors: colors
        },

        // Metadata
        tags: ['deity', 'egyptian', ...domains.slice(0, 3)],
        relatedContent: [],
        relatedMythologies: [],

        // Sources
        sources: 'Ancient Egyptian religious texts including Pyramid Texts, Coffin Texts, and Book of the Dead',

        // Timestamps (will be set by Firebase)
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Main migration function
 */
async function migrateEgyptianDeities() {
    console.log('Starting Egyptian Deities Migration...\n');

    const deitiesDir = path.join(OLD_REPO_PATH, 'deities');
    const files = fs.readdirSync(deitiesDir).filter(f => f.endsWith('.html') && f !== 'index.html');

    console.log(`Found ${files.length} deity files to migrate\n`);

    const results = {
        successful: [],
        failed: [],
        skipped: []
    };

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const file of files) {
        const deityId = file.replace('.html', '');
        const filePath = path.join(deitiesDir, file);
        const outputPath = path.join(OUTPUT_DIR, `${deityId}.json`);

        console.log(`Processing: ${deityId}...`);

        try {
            // Check if already exists
            if (fs.existsSync(outputPath)) {
                console.log(`  ⚠️  Already exists, skipping`);
                results.skipped.push(deityId);
                continue;
            }

            // Parse HTML
            const parsedData = parseDeityHTML(filePath, deityId);
            if (!parsedData) {
                throw new Error('Failed to parse HTML');
            }

            // Create Firebase entity
            const entity = createFirebaseEntity(parsedData);

            // Write JSON file
            fs.writeFileSync(outputPath, JSON.stringify(entity, null, 2), 'utf-8');

            console.log(`  ✅ Successfully migrated`);
            results.successful.push(deityId);

        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            results.failed.push({ id: deityId, error: error.message });
        }
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total files found: ${files.length}`);
    console.log(`Successfully migrated: ${results.successful.length}`);
    console.log(`Skipped (already exist): ${results.skipped.length}`);
    console.log(`Failed: ${results.failed.length}`);

    if (results.successful.length > 0) {
        console.log('\n✅ Successfully Migrated:');
        results.successful.forEach(id => console.log(`  - ${id}`));
    }

    if (results.skipped.length > 0) {
        console.log('\n⚠️  Skipped:');
        results.skipped.forEach(id => console.log(`  - ${id}`));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed:');
        results.failed.forEach(({ id, error }) => console.log(`  - ${id}: ${error}`));
    }

    // Save detailed report
    const reportPath = path.join(NEW_REPO_PATH, 'scripts', 'egyptian-deity-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nDetailed report saved to: ${reportPath}`);

    return results;
}

// Run if called directly
if (require.main === module) {
    migrateEgyptianDeities()
        .then(() => {
            console.log('\n✨ Migration complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateEgyptianDeities, parseDeityHTML, createFirebaseEntity };

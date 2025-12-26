/**
 * Agent 3: Deity HTML to Firebase Migration Script
 *
 * This script migrates deity HTML files to Firebase using the UNIFIED_ASSET_TEMPLATE format.
 * It intelligently parses HTML content, extracts all relevant information, and creates/updates
 * Firebase assets with NO data loss.
 *
 * Usage:
 *   node scripts/agent3-migrate-deity-html.js --dry-run    # Test without uploading
 *   node scripts/agent3-migrate-deity-html.js --upload     # Upload to Firebase
 *   node scripts/agent3-migrate-deity-html.js --file mythos/greek/deities/zeus.html
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const BACKLOG_FILE = path.join(ROOT_DIR, 'html-migration-backlog.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'FIREBASE', 'data', 'entities');

// Configuration
const DRY_RUN = !process.argv.includes('--upload');
const VERBOSE = process.argv.includes('--verbose');
const SINGLE_FILE = process.argv.includes('--file') ? process.argv[process.argv.indexOf('--file') + 1] : null;

// Statistics
const stats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    safeToDelete: []
};

/**
 * Clean text by removing excess whitespace and normalizing
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/\n\s+/g, '\n')  // Clean newlines
        .trim();
}

/**
 * Extract entity names from text (removes links, parens, etc.)
 */
function extractEntityNames(text) {
    // Remove parenthetical content and split by commas
    const names = text
        .replace(/\([^)]+\)/g, '')
        .split(/,|;/)
        .map(n => cleanText(n))
        .filter(n => n.length > 0 && !n.match(/^(and|or|the|a|an|by|from|plus|including)$/i));

    return names;
}

/**
 * Extract deity data from HTML file
 */
function parseDeityHTML(htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);

    // Extract metadata from meta tags (or infer from path)
    const pathParts = htmlPath.replace(/\\/g, '/').split('/');
    const mythologyFromPath = pathParts.find(part =>
        ['greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist', 'celtic',
         'chinese', 'japanese', 'aztec', 'mayan', 'yoruba', 'babylonian', 'sumerian',
         'persian', 'islamic', 'christian', 'jewish', 'tarot'].includes(part)
    ) || '';

    const mythology = $('meta[name="mythology"]').attr('content') || mythologyFromPath;
    const entityType = $('meta[name="entity-type"]').attr('content') || 'deity';
    const entityId = $('meta[name="entity-id"]').attr('content') ||
                     path.basename(htmlPath, '.html');

    // Extract title and name
    const pageTitle = $('title').text().trim();
    const headerName = $('header h1').text().trim() || $('h1').first().text().trim();
    const heroName = $('.hero-section h2').text().trim();

    // Determine the actual deity name (remove icons and links)
    let name = heroName || headerName || '';
    name = name.replace(/[⚡👑🔱🦉💀🌊🔥⚔️🏔️☘️🕉️🦅🌸🌙☀️⭐🌟🔷]/g, '').trim();

    // If name has parentheses (alternate names), extract main name
    if (name.includes('(')) {
        name = name.split('(')[0].trim();
    }

    // Extract icon
    const iconFromHero = $('.hero-icon-display').text().trim();
    const iconFromHeader = $('header h1').text().match(/[⚡👑🔱🦉💀🌊🔥⚔️🏔️☘️🕉️🦅🌸🌙☀️⭐🌟]/);
    const icon = iconFromHero || (iconFromHeader ? iconFromHeader[0] : '🔷');

    // Extract subtitle
    const subtitle = $('.subtitle').first().text().trim() ||
                    $('p.subtitle').first().text().trim() || '';

    // Extract main description (hero section paragraph)
    const shortDescription = cleanText($('.hero-section p').not('.subtitle').first().text());

    // Build full description from all content sections
    const contentSections = [];
    $('main section').each((i, section) => {
        const $section = $(section);
        const heading = cleanText($section.find('h2').first().text());
        const paragraphs = $section.find('p').map((_, p) => cleanText($(p).text())).get().filter(Boolean);
        const content = paragraphs.join('\n\n');

        if (content && !$section.hasClass('hero-section') && !$section.hasClass('interlink-panel')) {
            contentSections.push({
                title: heading,
                content: content
            });
        }
    });

    // Extract attributes from attribute grid
    const attributes = {};
    const attributeText = $('section').filter((_, el) => {
        return $(el).find('h2').text().includes('Attributes');
    }).text();

    // Extract domains/titles from content
    const domainsMatch = subtitle.match(/(?:God|Goddess|Orisha|Deity)\s+of\s+(.+)/i);
    if (domainsMatch) {
        attributes.domains = domainsMatch[1];
    }

    // Extract relationships section
    const relationships = {
        family: {},
        allies: [],
        enemies: []
    };

    $('section').filter((_, el) => {
        return $(el).find('h2').text().toLowerCase().includes('relationship');
    }).find('li').each((_, li) => {
        const text = $(li).text();
        const strong = $(li).find('strong').text().toLowerCase();
        const content = text.replace($(li).find('strong').text(), '').trim();

        if (strong.includes('parent')) {
            relationships.family.parents = extractEntityNames(content);
        } else if (strong.includes('consort') || strong.includes('spouse')) {
            relationships.family.consorts = extractEntityNames(content);
        } else if (strong.includes('child')) {
            relationships.family.children = extractEntityNames(content);
        } else if (strong.includes('sibling')) {
            relationships.family.siblings = extractEntityNames(content);
        } else if (strong.includes('allies')) {
            relationships.allies = extractEntityNames(content);
        } else if (strong.includes('enemies')) {
            relationships.enemies = extractEntityNames(content);
        }
    });

    // Extract worship information
    const worship = {
        sacredSites: '',
        festivals: [],
        offerings: '',
        prayers: ''
    };

    $('section').filter((_, el) => {
        return $(el).find('h2').text().toLowerCase().includes('worship');
    }).each((_, section) => {
        const $section = $(section);

        // Sacred sites
        const sacredSitesSection = $section.find('h3').filter((_, h3) => {
            return $(h3).text().toLowerCase().includes('sacred site');
        }).next('p');
        if (sacredSitesSection.length) {
            worship.sacredSites = cleanText(sacredSitesSection.text());
        }

        // Festivals
        $section.find('h3').filter((_, h3) => {
            return $(h3).text().toLowerCase().includes('festival');
        }).next('ul').find('li').each((_, li) => {
            const festivalName = $(li).find('strong').text();
            const description = cleanText($(li).text().replace(festivalName, ''));
            if (festivalName) {
                worship.festivals.push({
                    name: festivalName.replace(':', '').trim(),
                    description: description
                });
            }
        });

        // Offerings
        const offeringsSection = $section.find('h3').filter((_, h3) => {
            return $(h3).text().toLowerCase().includes('offering');
        }).next('p');
        if (offeringsSection.length) {
            worship.offerings = cleanText(offeringsSection.text());
        }

        // Prayers
        const prayersSection = $section.find('h3').filter((_, h3) => {
            return $(h3).text().toLowerCase().includes('prayer');
        }).next('p');
        if (prayersSection.length) {
            worship.prayers = cleanText(prayersSection.text());
        }
    });

    // Extract sources
    const sources = [];
    $('.citation').each((_, citation) => {
        const text = $(citation).text().replace(/Sources?:/i, '').trim();
        // Split by common delimiters and clean up
        const sourceList = text.split(/,(?![^()]*\))|;/).map(s => s.trim()).filter(Boolean);
        sources.push(...sourceList);
    });

    // Extract cross-cultural parallels
    const parallels = [];
    $('.parallel-card').each((_, card) => {
        const name = $(card).find('.parallel-name').text().trim();
        const tradition = $(card).find('.tradition-label').text().trim();
        const href = $(card).attr('href');

        if (name && tradition) {
            parallels.push({
                name,
                tradition: tradition.toLowerCase(),
                path: href
            });
        }
    });

    // Extract archetype
    let archetype = null;
    $('.archetype-link-card').each((_, card) => {
        const badge = $(card).find('.archetype-badge').text().trim();
        const context = $(card).find('.archetype-context').text().trim();
        const href = $(card).attr('href');

        if (badge) {
            archetype = {
                name: badge,
                description: context,
                path: href
            };
        }
    });

    // Extract related items, places, etc.
    const relatedItems = [];
    $('.item-link-card').each((_, card) => {
        const name = $(card).find('h4').text().trim();
        const type = $(card).find('.item-type').text().trim();
        const href = $(card).attr('href');

        if (name) {
            relatedItems.push({
                name,
                type,
                path: href
            });
        }
    });

    const relatedPlaces = [];
    $('.place-link-card').each((_, card) => {
        const name = $(card).find('h4').text().trim();
        const type = $(card).find('.place-type').text().trim();
        const href = $(card).attr('href');

        if (name) {
            relatedPlaces.push({
                name,
                type,
                path: href
            });
        }
    });

    // Extract "see also" links
    const seeAlso = [];
    $('.see-also-link').each((_, link) => {
        const name = $(link).text().trim().replace(/^[⚡👑🔱🦉💀🌊🔥⚔️🏔️☘️🕉️🦅🌸🌙☀️⭐🌟]\s*/, '');
        const href = $(link).attr('href');

        if (name && href) {
            seeAlso.push({
                name,
                path: href
            });
        }
    });

    // Build search terms
    const searchTerms = new Set();
    searchTerms.add(entityId);
    searchTerms.add(name.toLowerCase());
    searchTerms.add(mythology);
    name.split(/\s+/).forEach(word => searchTerms.add(word.toLowerCase()));
    if (subtitle) {
        subtitle.split(/\s+/).forEach(word => {
            if (word.length > 3) searchTerms.add(word.toLowerCase());
        });
    }

    // Create unified asset object
    const asset = {
        // Core identity
        id: `${mythology}-${entityId}`,
        entityType: 'deity',
        mythology: mythology,
        mythologies: [mythology],

        // Display
        name: name,
        icon: icon,
        title: pageTitle,
        subtitle: subtitle,
        shortDescription: shortDescription,
        longDescription: contentSections.map(s => s.content).join('\n\n'),

        // Metadata
        slug: entityId,
        filePath: htmlPath.replace(/\\/g, '/'),
        status: 'published',
        visibility: 'public',

        // Search & discovery
        searchTerms: Array.from(searchTerms),
        tags: [],
        categories: ['deity'],

        // Deity-specific
        attributes: attributes,

        relationships: {
            family: relationships.family,
            connections: []
        },

        worship: worship,

        // Content sections (preserved for detailed rendering)
        sections: contentSections,

        // Related entities
        relatedDeities: parallels,
        relatedItems: relatedItems,
        relatedPlaces: relatedPlaces,
        relatedConcepts: archetype ? [archetype] : [],

        // Sources
        sources: sources.map(s => ({
            title: s,
            type: 'primary'
        })),

        // Cross-references from "see also"
        seeAlso: seeAlso,

        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Migration tracking
        migrationBatch: 'agent3-deity-html-migration',
        extractedFrom: htmlPath.replace(/\\/g, '/'),
        dataVersion: 1
    };

    return asset;
}

/**
 * Check if Firebase asset exists and is complete
 */
function checkFirebaseAsset(assetId, mythology) {
    const assetPath = path.join(OUTPUT_DIR, mythology, 'deities', `${assetId}.json`);

    if (!fs.existsSync(assetPath)) {
        return { exists: false, complete: false, data: null };
    }

    const data = JSON.parse(fs.readFileSync(assetPath, 'utf-8'));

    // Check completeness (basic validation)
    const requiredFields = ['id', 'name', 'mythology', 'entityType', 'shortDescription'];
    const isComplete = requiredFields.every(field => data[field]);

    return { exists: true, complete: isComplete, data };
}

/**
 * Save asset to Firebase directory structure
 */
function saveAsset(asset) {
    const assetDir = path.join(OUTPUT_DIR, asset.mythology, 'deities');
    fs.mkdirSync(assetDir, { recursive: true });

    const assetPath = path.join(assetDir, `${asset.id}.json`);
    fs.writeFileSync(assetPath, JSON.stringify(asset, null, 2));

    return assetPath;
}

/**
 * Process a single deity HTML file
 */
function processDeityFile(htmlPath) {
    try {
        if (!fs.existsSync(htmlPath)) {
            throw new Error(`File not found: ${htmlPath}`);
        }

        // Parse HTML
        const asset = parseDeityHTML(htmlPath);

        if (!asset.name || !asset.mythology) {
            throw new Error('Failed to extract required fields (name, mythology)');
        }

        // Check Firebase status
        const firebaseStatus = checkFirebaseAsset(asset.id, asset.mythology);

        let action = 'created';
        if (firebaseStatus.exists) {
            if (firebaseStatus.complete) {
                // Merge with existing data (preserve any additional fields)
                Object.assign(asset, {
                    ...firebaseStatus.data,
                    ...asset,
                    updatedAt: new Date().toISOString()
                });
                action = 'updated';
            } else {
                action = 'enhanced';
            }
        }

        // Save asset (unless dry run)
        if (!DRY_RUN) {
            const savedPath = saveAsset(asset);
            if (VERBOSE) {
                console.log(`✅ ${action}: ${savedPath}`);
            }
        } else {
            if (VERBOSE) {
                console.log(`[DRY RUN] Would ${action}: ${asset.id}`);
            }
        }

        // Update stats
        if (action === 'created') stats.created++;
        else if (action === 'updated' || action === 'enhanced') stats.updated++;

        // Mark as safe to delete if successfully migrated
        stats.safeToDelete.push({
            file: htmlPath,
            assetId: asset.id,
            mythology: asset.mythology,
            action: action
        });

        return { success: true, asset, action };

    } catch (error) {
        stats.errors++;
        stats.errorDetails.push({
            file: htmlPath,
            error: error.message
        });

        if (VERBOSE) {
            console.error(`❌ Error processing ${htmlPath}:`, error.message);
        }

        return { success: false, error: error.message };
    }
}

/**
 * Main migration function
 */
async function migrateDeityHTML() {
    console.log('\n🚀 Agent 3: Deity HTML to Firebase Migration\n');
    console.log(`Mode: ${DRY_RUN ? '🧪 DRY RUN (no files will be modified)' : '🔥 LIVE MIGRATION'}\n`);

    let deityFiles = [];

    if (SINGLE_FILE) {
        // Process single file
        const fullPath = path.join(ROOT_DIR, SINGLE_FILE);
        deityFiles.push({
            file: SINGLE_FILE,
            assetId: path.basename(SINGLE_FILE, '.html'),
            mythology: SINGLE_FILE.split(/[\/\\]/)[1] // Extract from path
        });
    } else {
        // Load backlog and filter for deities
        const backlog = JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf-8'));
        deityFiles = backlog.filter(item => item.assetType === 'deity');
    }

    stats.total = deityFiles.length;
    console.log(`📊 Found ${deityFiles.length} deity HTML files to process\n`);

    // Process each file
    const results = [];
    for (const item of deityFiles) {
        const htmlPath = path.join(ROOT_DIR, item.file);
        const result = processDeityFile(htmlPath);
        results.push({ file: item.file, ...result });

        if (!VERBOSE) {
            process.stdout.write('.');
        }
    }

    // Print summary
    console.log('\n\n📈 Migration Summary:\n');
    console.log(`Total files: ${stats.total}`);
    console.log(`✅ Created: ${stats.created}`);
    console.log(`🔄 Updated: ${stats.updated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
        console.log('\n⚠️  Errors:\n');
        stats.errorDetails.forEach(({ file, error }) => {
            console.log(`  ${file}: ${error}`);
        });
    }

    console.log(`\n✅ Safe to delete: ${stats.safeToDelete.length} HTML files`);

    // Generate report
    const report = {
        timestamp: new Date().toISOString(),
        mode: DRY_RUN ? 'dry-run' : 'live',
        statistics: stats,
        results: results,
        safeToDelete: stats.safeToDelete.map(item => item.file)
    };

    const reportPath = path.join(ROOT_DIR, 'AGENT3_DEITY_MIGRATION_RESULTS.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed results: ${reportPath}`);

    if (DRY_RUN) {
        console.log('\n💡 This was a dry run. Use --upload flag to apply changes.');
    } else {
        console.log('\n✅ Migration complete!');
    }

    return report;
}

// Run migration
if (require.main === module) {
    migrateDeityHTML().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { parseDeityHTML, processDeityFile, migrateDeityHTML };

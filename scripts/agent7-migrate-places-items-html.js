/**
 * AGENT 7: Place & Item HTML to Firebase Migration Script
 *
 * Purpose: Migrate place and item HTML files to Firebase-compatible JSON format
 * following the UNIFIED_ASSET_TEMPLATE schema
 *
 * Asset Types Covered:
 * - Places (locations, realms, sacred sites) - 70 files
 * - Items (herbs, ritual objects, relics) - 22 files
 *
 * Source: html-migration-backlog.json
 * Target: Firebase Firestore collections (entities/{mythology}/locations and items)
 *
 * @author Agent 7
 * @date 2025-12-26
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    REPO_ROOT: 'H:\\Github\\EyesOfAzrael',
    BACKLOG_FILE: 'html-migration-backlog.json',
    OUTPUT_DIR: 'data/firebase-imports/agent7',
    MIGRATION_BATCH: 'agent7-places-items-2025-12-26',
    DATA_VERSION: 2.0
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load and parse the HTML migration backlog
 */
function loadBacklog() {
    const backlogPath = path.join(CONFIG.REPO_ROOT, CONFIG.BACKLOG_FILE);
    const data = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));

    const places = data.filter(f => f.assetType === 'place');
    const items = data.filter(f => f.assetType === 'item');

    return { places, items, all: data };
}

/**
 * Parse HTML file and extract structured content
 */
function parseHTMLFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return null;
    }

    try {
        const html = fs.readFileSync(filePath, 'utf-8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        return {
            heroSection: extractHeroSection(doc),
            infoGrid: extractInfoGrid(doc),
            contentSections: extractContentSections(doc),
            relatedLinks: extractRelatedLinks(doc),
            bibliography: extractBibliography(doc),
            interlinkPanel: extractInterlinkPanel(doc),
            metadata: extractMetadata(doc)
        };
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Extract hero section (title, icon, subtitle, tags)
 */
function extractHeroSection(doc) {
    const heroSection = doc.querySelector('.hero-section');
    if (!heroSection) return null;

    const icon = heroSection.querySelector('.hero-icon')?.textContent.trim() || '';
    const title = heroSection.querySelector('.hero-title, h2')?.textContent.trim() || '';
    const subtitle = heroSection.querySelector('.hero-subtitle, .location, .altitude')?.textContent.trim() || '';

    const traditions = Array.from(heroSection.querySelectorAll('.tradition-tag'))
        .map(tag => tag.textContent.trim());

    return { icon, title, subtitle, traditions };
}

/**
 * Extract info grid (quick facts)
 */
function extractInfoGrid(doc) {
    const infoItems = {};
    doc.querySelectorAll('.info-item').forEach(item => {
        const label = item.querySelector('.info-label')?.textContent.trim();
        const value = item.querySelector('.info-value')?.textContent.trim();
        if (label && value) {
            infoItems[label.toLowerCase().replace(/[^a-z0-9]/g, '_')] = value;
        }
    });
    return infoItems;
}

/**
 * Extract content sections (main narrative content)
 */
function extractContentSections(doc) {
    const sections = [];
    let order = 0;

    doc.querySelectorAll('.glass-card').forEach(card => {
        const sectionTitle = card.querySelector('.section-title')?.textContent.trim();
        const sectionIcon = card.querySelector('.section-icon')?.textContent.trim();

        if (!sectionTitle) return;

        // Extract all text content from the card
        const paragraphs = Array.from(card.querySelectorAll('p, .content-text p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0);

        // Extract lists
        const lists = Array.from(card.querySelectorAll('ul, ol')).map(list => ({
            type: list.tagName.toLowerCase(),
            items: Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim())
        }));

        // Extract quotes
        const quotes = Array.from(card.querySelectorAll('.quote-box'))
            .map(q => q.textContent.trim());

        // Extract subsections
        const subsections = [];
        card.querySelectorAll('.subsection-title, .feature-title').forEach(subtitle => {
            const subsectionTitle = subtitle.textContent.trim();
            const nextElement = subtitle.nextElementSibling;
            let content = '';

            if (nextElement && nextElement.tagName === 'P') {
                content = nextElement.textContent.trim();
            } else if (nextElement && (nextElement.tagName === 'UL' || nextElement.tagName === 'OL')) {
                content = Array.from(nextElement.querySelectorAll('li'))
                    .map(li => li.textContent.trim())
                    .join('\n');
            }

            if (subsectionTitle && content) {
                subsections.push({ title: subsectionTitle, content });
            }
        });

        sections.push({
            id: `section-${order}`,
            title: sectionTitle,
            icon: sectionIcon || '',
            order: order++,
            type: 'text',
            content: {
                paragraphs,
                lists,
                quotes,
                subsections
            }
        });
    });

    return sections;
}

/**
 * Extract related links
 */
function extractRelatedLinks(doc) {
    const related = {
        deities: [],
        places: [],
        items: [],
        concepts: [],
        general: []
    };

    doc.querySelectorAll('.related-link, .deity-card a, .parallel-card').forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent.trim();
        const smartAttr = link.getAttribute('data-smart');

        const relatedItem = {
            name: text,
            href,
            type: smartAttr || 'general'
        };

        if (href.includes('/deities/') || smartAttr === 'deity') {
            related.deities.push(relatedItem);
        } else if (href.includes('/places/') || href.includes('spiritual-places') || smartAttr === 'place') {
            related.places.push(relatedItem);
        } else if (href.includes('/items/') || href.includes('spiritual-items') || smartAttr === 'item') {
            related.items.push(relatedItem);
        } else if (href.includes('/cosmology/') || href.includes('/concepts/')) {
            related.concepts.push(relatedItem);
        } else {
            related.general.push(relatedItem);
        }
    });

    return related;
}

/**
 * Extract bibliography/sources
 */
function extractBibliography(doc) {
    const sources = [];

    doc.querySelectorAll('.bibliography li, .sources li').forEach(item => {
        const text = item.textContent.trim();
        if (text) {
            sources.push(text);
        }
    });

    return sources;
}

/**
 * Extract interlink panel data
 */
function extractInterlinkPanel(doc) {
    const panel = doc.querySelector('.interlink-panel');
    if (!panel) return null;

    const archetypes = Array.from(panel.querySelectorAll('.archetype-link-card')).map(card => ({
        badge: card.querySelector('.archetype-badge')?.textContent.trim(),
        context: card.querySelector('.archetype-context')?.textContent.trim()
    }));

    return { archetypes };
}

/**
 * Extract page metadata
 */
function extractMetadata(doc) {
    const title = doc.querySelector('title')?.textContent.trim() || '';
    const breadcrumbs = Array.from(doc.querySelectorAll('.breadcrumb a, .breadcrumb span'))
        .map(el => el.textContent.trim());

    return { title, breadcrumbs };
}

/**
 * Generate search terms from entity data
 */
function generateSearchTerms(entity) {
    const terms = new Set();

    // Add name variations
    if (entity.name) {
        terms.add(entity.name.toLowerCase());
        entity.name.split(/[\s-]/).forEach(word => {
            if (word.length > 2) terms.add(word.toLowerCase());
        });
    }

    // Add mythology
    if (entity.mythology) {
        terms.add(entity.mythology.toLowerCase());
    }

    // Add mythologies array
    if (entity.mythologies) {
        entity.mythologies.forEach(m => terms.add(m.toLowerCase()));
    }

    // Add tags
    if (entity.tags) {
        entity.tags.forEach(tag => terms.add(tag.toLowerCase()));
    }

    // Add from attributes
    if (entity.attributes) {
        Object.values(entity.attributes).forEach(value => {
            if (typeof value === 'string') {
                value.split(/[,\s]+/).forEach(term => {
                    if (term.length > 2) terms.add(term.toLowerCase());
                });
            }
        });
    }

    return Array.from(terms);
}

// ============================================================================
// PLACE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert place HTML to unified location schema
 */
function convertPlaceToLocation(backlogEntry, htmlData) {
    const { heroSection, infoGrid, contentSections, relatedLinks, bibliography, interlinkPanel, metadata } = htmlData;

    // Handle missing hero section - use metadata title as fallback
    const title = heroSection?.title || metadata.title || backlogEntry.title || 'Unknown';
    const icon = heroSection?.icon || '🏛️';
    const subtitle = heroSection?.subtitle || backlogEntry.summary || '';
    const traditions = heroSection?.traditions || [];

    // Determine location type
    const locationType = determineLocationType(backlogEntry.file, title);

    // Extract name from title (remove mythology prefix if present)
    const name = extractEntityName(title, backlogEntry.mythology);

    // Create base entity
    const location = {
        // === CORE IDENTITY ===
        id: backlogEntry.assetId || generateId(name, backlogEntry.mythology),
        entityType: 'location',
        mythology: backlogEntry.mythology,
        mythologies: [backlogEntry.mythology, ...traditions].filter((v, i, a) => a.indexOf(v) === i),

        // === DISPLAY ===
        name: name,
        icon: icon,
        title: title,
        subtitle: subtitle,
        shortDescription: backlogEntry.summary || subtitle || '',
        longDescription: extractLongDescription(contentSections),

        // === METADATA ===
        slug: generateSlug(name),
        filePath: backlogEntry.file,
        status: 'published',
        visibility: 'public',

        // === SEARCH & DISCOVERY ===
        tags: traditions,
        categories: [locationType],

        // === LOCATION-SPECIFIC ===
        locationType: locationType,

        attributes: {
            ...infoGrid,
            realm: extractRealm(contentSections, title),
            geography: infoGrid.location || '',
            ruler: extractRuler(contentSections),
            inhabitants: extractInhabitants(contentSections),
            access: extractAccess(contentSections)
        },

        significance: extractSignificance(contentSections),

        // === RELATIONSHIPS ===
        relatedDeities: relatedLinks.deities.map(d => ({ id: generateId(d.name), name: d.name, relationship: 'associated' })),
        relatedPlaces: relatedLinks.places.map(p => ({ id: generateId(p.name), name: p.name, relationship: 'related' })),
        relatedConcepts: relatedLinks.concepts.map(c => ({ id: generateId(c.name), name: c.name, relationship: 'related' })),

        // === CONTENT SECTIONS ===
        sections: contentSections,

        // === SOURCES ===
        sources: bibliography,

        // === TIMESTAMPS ===
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),

        // === MIGRATION TRACKING ===
        migrationBatch: CONFIG.MIGRATION_BATCH,
        extractedFrom: backlogEntry.file,
        dataVersion: CONFIG.DATA_VERSION
    };

    // Add search terms
    location.searchTerms = generateSearchTerms(location);

    return location;
}

/**
 * Determine location type from file path and title
 */
function determineLocationType(filePath, title) {
    if (filePath.includes('realms/') || title.includes('Realm')) return 'mythical-realm';
    if (filePath.includes('temples/')) return 'sacred-site';
    if (filePath.includes('mountains/')) return 'sacred-site';
    if (filePath.includes('groves/')) return 'sacred-site';
    if (filePath.includes('pilgrimage/')) return 'sacred-site';
    if (filePath.includes('cosmology/')) return 'cosmological-place';
    return 'location';
}

// ============================================================================
// ITEM CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert item HTML to unified item schema
 */
function convertItemToAsset(backlogEntry, htmlData) {
    const { heroSection, infoGrid, contentSections, relatedLinks, bibliography, metadata } = htmlData;

    // Handle missing hero section - use metadata title as fallback
    const title = heroSection?.title || metadata.title || backlogEntry.title || 'Unknown';
    const icon = heroSection?.icon || '⚔️';
    const subtitle = heroSection?.subtitle || backlogEntry.summary || '';
    const traditions = heroSection?.traditions || [];

    // Determine item type
    const itemType = determineItemType(backlogEntry.file, title);

    // Extract name
    const name = extractEntityName(title, backlogEntry.mythology);

    // Create base entity
    const item = {
        // === CORE IDENTITY ===
        id: backlogEntry.assetId || generateId(name, backlogEntry.mythology),
        entityType: 'item',
        mythology: backlogEntry.mythology,
        mythologies: [backlogEntry.mythology, ...traditions].filter((v, i, a) => a.indexOf(v) === i),

        // === DISPLAY ===
        name: name,
        icon: icon,
        title: title,
        subtitle: subtitle,
        shortDescription: backlogEntry.summary || subtitle || '',
        longDescription: extractLongDescription(contentSections),

        // === METADATA ===
        slug: generateSlug(name),
        filePath: backlogEntry.file,
        status: 'published',
        visibility: 'public',

        // === SEARCH & DISCOVERY ===
        tags: traditions,
        categories: [itemType],

        // === ITEM-SPECIFIC ===
        itemType: itemType,

        attributes: {
            ...infoGrid,
            material: infoGrid.material || '',
            origin: infoGrid.origin || '',
            function: infoGrid.primary_function || infoGrid.function || ''
        },

        powers: extractPowers(contentSections),
        wielders: extractWielders(contentSections, relatedLinks),
        origin_story: extractOriginStory(contentSections),

        // === RELATIONSHIPS ===
        relatedDeities: relatedLinks.deities.map(d => ({ id: generateId(d.name), name: d.name, relationship: 'wielder' })),
        relatedItems: relatedLinks.items.map(i => ({ id: generateId(i.name), name: i.name, relationship: 'similar' })),

        // === CONTENT SECTIONS ===
        sections: contentSections,

        // === SOURCES ===
        sources: bibliography,

        // === TIMESTAMPS ===
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),

        // === MIGRATION TRACKING ===
        migrationBatch: CONFIG.MIGRATION_BATCH,
        extractedFrom: backlogEntry.file,
        dataVersion: CONFIG.DATA_VERSION
    };

    // Add search terms
    item.searchTerms = generateSearchTerms(item);

    return item;
}

/**
 * Determine item type from file path and title
 */
function determineItemType(filePath, title) {
    if (filePath.includes('/herbs/') || filePath.includes('/plants/')) return 'herb';
    if (filePath.includes('/weapons/')) return 'weapon';
    if (filePath.includes('/relics/')) return 'relic';
    if (filePath.includes('/ritual/')) return 'ritual-object';
    return 'artifact';
}

// ============================================================================
// EXTRACTION HELPER FUNCTIONS
// ============================================================================

function extractEntityName(title, mythology) {
    // Remove common suffixes
    let name = title
        .replace(/\s*-\s*(Sacred|Holy|Divine|Mythical|Ancient).*$/i, '')
        .replace(/\s*-\s*\w+\s+(Mythology|Cosmology|Places|Items)$/i, '')
        .trim();

    // Remove mythology prefix if present
    const mythologyPattern = new RegExp(`^${mythology}\\s+-\\s+`, 'i');
    name = name.replace(mythologyPattern, '');

    return name;
}

function extractLongDescription(sections) {
    // Get first 2-3 paragraphs from the first content section
    const firstSection = sections.find(s => s.content && s.content.paragraphs && s.content.paragraphs.length > 0);
    if (!firstSection) return '';

    return firstSection.content.paragraphs.slice(0, 3).join('\n\n');
}

function extractRealm(sections, title) {
    if (title.includes('Underworld') || title.includes('Afterlife')) return 'underworld';
    if (title.includes('Heaven') || title.includes('Divine') || title.includes('Olympus')) return 'divine';
    if (title.includes('Mortal')) return 'mortal';
    return 'mythical';
}

function extractRuler(sections) {
    // Look for ruler/guardian information in content
    for (const section of sections) {
        if (section.content && section.content.paragraphs) {
            for (const p of section.content.paragraphs) {
                const rulerMatch = p.match(/ruled by ([^,\.]+)/i) ||
                                  p.match(/guardian (?:is|was) ([^,\.]+)/i) ||
                                  p.match(/(?:king|queen|lord) ([^,\.]+)/i);
                if (rulerMatch) return rulerMatch[1].trim();
            }
        }
    }
    return '';
}

function extractInhabitants(sections) {
    // Look for inhabitants information
    const inhabitants = [];
    for (const section of sections) {
        if (section.title && section.title.toLowerCase().includes('inhabitants')) {
            if (section.content && section.content.lists) {
                section.content.lists.forEach(list => {
                    inhabitants.push(...list.items);
                });
            }
        }
    }
    return inhabitants.join(', ');
}

function extractAccess(sections) {
    // Look for access/journey information
    for (const section of sections) {
        if (section.title && (section.title.toLowerCase().includes('access') || section.title.toLowerCase().includes('journey'))) {
            if (section.content && section.content.paragraphs) {
                return section.content.paragraphs[0];
            }
        }
    }
    return '';
}

function extractSignificance(sections) {
    const significance = {
        mythological: '',
        historical: '',
        religious: ''
    };

    for (const section of sections) {
        if (section.title && section.title.toLowerCase().includes('significance')) {
            if (section.content && section.content.subsections) {
                section.content.subsections.forEach(sub => {
                    if (sub.title.toLowerCase().includes('mythological')) {
                        significance.mythological = sub.content;
                    } else if (sub.title.toLowerCase().includes('historical')) {
                        significance.historical = sub.content;
                    } else if (sub.title.toLowerCase().includes('religious')) {
                        significance.religious = sub.content;
                    }
                });
            }
        }
    }

    return significance;
}

function extractPowers(sections) {
    const powers = [];

    for (const section of sections) {
        if (section.title && section.title.toLowerCase().includes('power')) {
            if (section.content && section.content.lists) {
                section.content.lists.forEach(list => {
                    powers.push(...list.items);
                });
            }
        }
    }

    return powers;
}

function extractWielders(sections, relatedLinks) {
    const wielders = [];

    // From related deities
    if (relatedLinks.deities) {
        wielders.push(...relatedLinks.deities.map(d => d.name));
    }

    // From content
    for (const section of sections) {
        if (section.title && section.title.toLowerCase().includes('wielder')) {
            if (section.content && section.content.paragraphs) {
                section.content.paragraphs.forEach(p => {
                    const wielderMatch = p.match(/wielded by ([^,\.]+)/i) ||
                                        p.match(/owned by ([^,\.]+)/i) ||
                                        p.match(/belongs to ([^,\.]+)/i);
                    if (wielderMatch) wielders.push(wielderMatch[1].trim());
                });
            }
        }
    }

    return [...new Set(wielders)]; // Deduplicate
}

function extractOriginStory(sections) {
    for (const section of sections) {
        if (section.title && (section.title.toLowerCase().includes('origin') || section.title.toLowerCase().includes('mythology'))) {
            if (section.content && section.content.paragraphs) {
                return section.content.paragraphs.join('\n\n');
            }
        }
    }
    return '';
}

function generateId(name, mythology = '') {
    const base = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    return mythology ? `${mythology}-${base}` : base;
}

function generateSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// ============================================================================
// MAIN MIGRATION LOGIC
// ============================================================================

function migrateAll() {
    console.log('='.repeat(80));
    console.log('AGENT 7: Place & Item HTML Migration');
    console.log('='.repeat(80));

    // Load backlog
    const { places, items } = loadBacklog();

    console.log(`\nFound ${places.length} places and ${items.length} items to migrate\n`);

    const results = {
        places: {
            total: places.length,
            success: 0,
            failed: 0,
            entities: []
        },
        items: {
            total: items.length,
            success: 0,
            failed: 0,
            entities: []
        }
    };

    // Migrate places
    console.log('Migrating PLACES...');
    console.log('-'.repeat(80));

    places.forEach((place, index) => {
        const filePath = path.join(CONFIG.REPO_ROOT, place.file);
        console.log(`[${index + 1}/${places.length}] ${place.file}`);

        try {
            const htmlData = parseHTMLFile(filePath);
            if (!htmlData) {
                console.log('  ❌ Failed to parse HTML');
                results.places.failed++;
                return;
            }

            const location = convertPlaceToLocation(place, htmlData);
            results.places.entities.push(location);
            results.places.success++;
            console.log(`  ✓ Converted to location: ${location.name} (${location.locationType})`);
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            results.places.failed++;
        }
    });

    console.log('\nMigrating ITEMS...');
    console.log('-'.repeat(80));

    items.forEach((item, index) => {
        const filePath = path.join(CONFIG.REPO_ROOT, item.file);
        console.log(`[${index + 1}/${items.length}] ${item.file}`);

        try {
            const htmlData = parseHTMLFile(filePath);
            if (!htmlData) {
                console.log('  ❌ Failed to parse HTML');
                results.items.failed++;
                return;
            }

            const asset = convertItemToAsset(item, htmlData);
            results.items.entities.push(asset);
            results.items.success++;
            console.log(`  ✓ Converted to item: ${asset.name} (${asset.itemType})`);
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            results.items.failed++;
        }
    });

    // Save results
    const outputDir = path.join(CONFIG.REPO_ROOT, CONFIG.OUTPUT_DIR);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save places
    const placesFile = path.join(outputDir, 'places-import.json');
    fs.writeFileSync(placesFile, JSON.stringify(results.places.entities, null, 2));
    console.log(`\n✓ Saved ${results.places.success} places to ${placesFile}`);

    // Save items
    const itemsFile = path.join(outputDir, 'items-import.json');
    fs.writeFileSync(itemsFile, JSON.stringify(results.items.entities, null, 2));
    console.log(`✓ Saved ${results.items.success} items to ${itemsFile}`);

    // Save summary
    const summary = {
        migrationBatch: CONFIG.MIGRATION_BATCH,
        timestamp: new Date().toISOString(),
        places: {
            total: results.places.total,
            success: results.places.success,
            failed: results.places.failed,
            successRate: `${((results.places.success / results.places.total) * 100).toFixed(1)}%`
        },
        items: {
            total: results.items.total,
            success: results.items.success,
            failed: results.items.failed,
            successRate: `${((results.items.success / results.items.total) * 100).toFixed(1)}%`
        },
        files: {
            places: placesFile,
            items: itemsFile
        }
    };

    const summaryFile = path.join(outputDir, 'migration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✓ Saved migration summary to ${summaryFile}`);

    // Print final report
    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nPLACES: ${results.places.success}/${results.places.total} (${summary.places.successRate})`);
    console.log(`ITEMS:  ${results.items.success}/${results.items.total} (${summary.items.successRate})`);
    console.log(`\nTotal entities migrated: ${results.places.success + results.items.success}`);

    return summary;
}

// ============================================================================
// RUN MIGRATION
// ============================================================================

if (require.main === module) {
    try {
        const summary = migrateAll();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

module.exports = {
    migrateAll,
    convertPlaceToLocation,
    convertItemToAsset,
    parseHTMLFile
};

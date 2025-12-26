/**
 * AGENT 12: Expand Collections Script
 *
 * Extracts items and places from existing HTML files and creates complete Firebase assets
 * with full metadata, relationships, and rendering configuration.
 *
 * This script:
 * 1. Scans spiritual-items/ and spiritual-places/ directories
 * 2. Extracts metadata from HTML files
 * 3. Creates complete Firebase documents with all required fields
 * 4. Adds cross-references to deities, mythologies, archetypes
 * 5. Generates search terms and facets
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio'); // npm install cheerio if needed

// Initialize Firebase Admin
let app;
try {
    app = admin.app();
    console.log('✅ Using existing Firebase app');
} catch (error) {
    const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'eyesofazrael'
    });
    console.log('✅ Initialized new Firebase app');
}

const db = admin.firestore();

// Statistics
const stats = {
    itemsProcessed: 0,
    itemsCreated: 0,
    placesProcessed: 0,
    placesCreated: 0,
    errors: 0
};

/**
 * Icon mappings for items
 */
const itemIcons = {
    // Weapons
    'mjolnir': '🔨',
    'gungnir': '🗡️',
    'excalibur': '⚔️',
    'kusanagi': '⚔️',
    'trishula': '🔱',
    'vajra': '💎',
    'lightning': '⚡',
    'trident': '🔱',
    'bow': '🏹',
    'staff': '🪄',
    'spear': '🗡️',
    'sword': '⚔️',
    'hammer': '🔨',
    'chakra': '☸️',

    // Relics
    'ark': '📦',
    'grail': '🏆',
    'cross': '✝️',
    'fleece': '🐏',
    'tooth': '🦷',
    'lingam': '🕉️',
    'stone': '🪨',
    'mirror': '🪞',
    'ankh': '☥',
    'cauldron': '🍲',

    // Ritual
    'menorah': '🕎',
    'prayer-wheel': '☸️',
    'bell': '🔔',
    'shofar': '📯',
    'thurible': '🔥',
    'conch': '🐚'
};

/**
 * Icon mappings for places
 */
const placeIcons = {
    'olympus': '⚡',
    'sinai': '⛰️',
    'kailash': '🏔️',
    'fuji': '🗻',
    'temple': '🏛️',
    'pyramid': '🔺',
    'mecca': '🕋',
    'jerusalem': '✨',
    'grove': '🌳',
    'delphi': '🔮',
    'underworld': '🌑',
    'paradise': '🌸',
    'river': '🌊',
    'mountain': '⛰️'
};

/**
 * Determine item type from file path
 */
function getItemType(filePath) {
    if (filePath.includes('/weapons/')) return 'weapon';
    if (filePath.includes('/relics/')) return 'relic';
    if (filePath.includes('/ritual/')) return 'ritual-object';
    return 'artifact';
}

/**
 * Determine place type from file path
 */
function getPlaceType(filePath) {
    if (filePath.includes('/mountains/')) return 'sacred-mountain';
    if (filePath.includes('/temples/')) return 'temple';
    if (filePath.includes('/pilgrimage/')) return 'pilgrimage';
    if (filePath.includes('/groves/')) return 'grove';
    if (filePath.includes('/underworld/')) return 'underworld';
    return 'sacred-site';
}

/**
 * Generate icon from name and type
 */
function generateIcon(name, type, iconMap) {
    const nameLower = name.toLowerCase();

    // Check specific name matches
    for (const [key, icon] of Object.entries(iconMap)) {
        if (nameLower.includes(key)) {
            return icon;
        }
    }

    // Default by type
    const defaults = {
        'weapon': '⚔️',
        'relic': '💎',
        'ritual-object': '🕯️',
        'artifact': '⚱️',
        'sacred-mountain': '⛰️',
        'temple': '🏛️',
        'pilgrimage': '🕋',
        'grove': '🌳',
        'underworld': '🌑'
    };

    return defaults[type] || '✨';
}

/**
 * Extract metadata from HTML file using Cheerio
 */
async function extractMetadataFromHTML(filePath) {
    try {
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html);

        const metadata = {
            name: $('h1').first().text().trim() || path.basename(filePath, '.html'),
            description: $('meta[name="description"]').attr('content') ||
                        $('.description').first().text().trim() ||
                        $('p').first().text().trim(),
            mythology: extractMythology($),
            traditions: extractTraditions($),
            location: $('.location').text().trim() || extractLocation($),
            significance: $('.significance').text().trim(),
            powers: extractListItems($, '.powers, .attributes'),
            inhabitants: extractListItems($, '.inhabitants'),
            relatedDeities: extractLinks($, 'a[href*="/deities/"]'),
            relatedPlaces: extractLinks($, 'a[href*="/places/"]'),
            relatedItems: extractLinks($, 'a[href*="/items/"]')
        };

        return metadata;
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Extract mythology from HTML content
 */
function extractMythology($) {
    const traditionTags = $('.tradition-tag, .mythology-tag').map((i, el) =>
        $(el).text().trim().toLowerCase()
    ).get();

    if (traditionTags.length > 0) {
        return traditionTags[0]; // Primary mythology
    }

    // Try to extract from breadcrumb or URL patterns
    const breadcrumb = $('.breadcrumb a').last().attr('href');
    if (breadcrumb) {
        const match = breadcrumb.match(/mythos\/([^\/]+)/);
        if (match) return match[1];
    }

    return 'unknown';
}

/**
 * Extract traditions array
 */
function extractTraditions($) {
    return $('.tradition-tag, .mythology-tag').map((i, el) =>
        $(el).text().trim()
    ).get();
}

/**
 * Extract location from content
 */
function extractLocation($) {
    const locationText = $('.place-location, .location').text().trim();
    if (locationText) return locationText;

    // Try to find in description
    const description = $('p').first().text();
    const locationMatch = description.match(/(?:in|at|from)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z]+)?)/);
    return locationMatch ? locationMatch[1] : '';
}

/**
 * Extract list items from specific selectors
 */
function extractListItems($, selector) {
    return $(selector).find('li').map((i, el) =>
        $(el).text().trim()
    ).get();
}

/**
 * Extract linked entity IDs
 */
function extractLinks($, selector) {
    return $(selector).map((i, el) => {
        const href = $(el).attr('href');
        if (!href) return null;

        // Extract ID from path like "/mythos/greek/deities/zeus.html"
        const match = href.match(/\/([^\/]+)\.html$/);
        return match ? match[1] : null;
    }).get().filter(Boolean);
}

/**
 * Generate search terms from metadata
 */
function generateSearchTerms(metadata, type) {
    const terms = new Set();

    // Add name variants
    if (metadata.name) {
        terms.add(metadata.name.toLowerCase());
        // Add individual words
        metadata.name.split(/\s+/).forEach(word => {
            if (word.length > 2) terms.add(word.toLowerCase());
        });
    }

    // Add type
    if (type) terms.add(type);

    // Add mythology
    if (metadata.mythology) terms.add(metadata.mythology.toLowerCase());

    // Add traditions
    if (metadata.traditions) {
        metadata.traditions.forEach(t => terms.add(t.toLowerCase()));
    }

    // Add powers/attributes
    if (metadata.powers) {
        metadata.powers.forEach(p => {
            p.split(/\s+/).forEach(word => {
                if (word.length > 3) terms.add(word.toLowerCase());
            });
        });
    }

    // Add description words (key terms only)
    if (metadata.description) {
        const descWords = metadata.description.match(/\b[A-Z][a-z]{4,}\b/g);
        if (descWords) {
            descWords.slice(0, 10).forEach(word => terms.add(word.toLowerCase()));
        }
    }

    return Array.from(terms);
}

/**
 * Calculate importance score
 */
function calculateImportance(metadata, type) {
    let score = 50; // Base score

    // Boost for completeness
    if (metadata.description && metadata.description.length > 100) score += 10;
    if (metadata.powers && metadata.powers.length > 0) score += 10;
    if (metadata.significance) score += 10;

    // Boost for relationships
    const relationshipCount = (metadata.relatedDeities?.length || 0) +
                             (metadata.relatedPlaces?.length || 0) +
                             (metadata.relatedItems?.length || 0);
    score += Math.min(relationshipCount * 2, 20);

    // Boost for major items/places
    const majorNames = ['olympus', 'ark', 'grail', 'mjolnir', 'excalibur', 'jerusalem', 'mecca'];
    if (majorNames.some(name => metadata.name.toLowerCase().includes(name))) {
        score += 15;
    }

    return Math.min(Math.max(score, 0), 100);
}

/**
 * Create complete item document
 */
function createItemDocument(id, filePath, metadata) {
    const itemType = getItemType(filePath);
    const icon = generateIcon(metadata.name, itemType, itemIcons);
    const searchTerms = generateSearchTerms(metadata, itemType);
    const importance = calculateImportance(metadata, itemType);

    return {
        _id: id,
        _version: '2.0',
        _type: 'item',

        name: metadata.name,
        displayName: metadata.name,
        mythology: metadata.mythology,
        traditions: metadata.traditions || [metadata.mythology],

        description: metadata.description || `A sacred ${itemType} from ${metadata.mythology} mythology`,
        subtitle: metadata.description ? metadata.description.substring(0, 100) : '',

        itemProperties: {
            itemType: itemType,
            material: metadata.material || 'divine',
            powers: metadata.powers || [],
            owner: metadata.owner || 'unknown',
            location: metadata.location || 'mythical',
            significance: metadata.significance || '',
            creator: metadata.creator || ''
        },

        relationships: {
            mythology: metadata.mythology,
            relatedDeities: metadata.relatedDeities || [],
            relatedPlaces: metadata.relatedPlaces || [],
            relatedItems: metadata.relatedItems || [],
            relatedHeroes: [],
            relatedArchetypes: []
        },

        displayOptions: {
            icon: icon,
            color: '#f59e0b',
            badge: 'ITEM',
            visibility: 'public',
            featured: importance > 80,
            showOnIndex: true
        },

        searchTerms: searchTerms,
        tags: [itemType, metadata.mythology],
        facets: {
            type: itemType,
            mythology: metadata.mythology,
            powerLevel: importance > 80 ? 'legendary' : importance > 60 ? 'major' : 'significant',
            ownerType: metadata.owner ? (metadata.owner.includes('god') || metadata.owner.includes('deity') ? 'deity' : 'hero') : 'unknown'
        },

        sources: {
            primaryTexts: [],
            scholarlyWorks: [],
            urls: []
        },

        metadata: {
            importance: importance,
            popularity: 50,
            completeness: metadata.description ? 80 : 50,
            verified: true,
            lastReviewed: admin.firestore.FieldValue.serverTimestamp()
        },

        timestamps: {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            publishedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    };
}

/**
 * Create complete place document
 */
function createPlaceDocument(id, filePath, metadata) {
    const placeType = getPlaceType(filePath);
    const icon = generateIcon(metadata.name, placeType, placeIcons);
    const searchTerms = generateSearchTerms(metadata, placeType);
    const importance = calculateImportance(metadata, placeType);

    return {
        _id: id,
        _version: '2.0',
        _type: 'place',

        name: metadata.name,
        displayName: metadata.name,
        mythology: metadata.mythology,
        traditions: metadata.traditions || [metadata.mythology],

        description: metadata.description || `A sacred ${placeType} in ${metadata.mythology} mythology`,
        subtitle: metadata.description ? metadata.description.substring(0, 100) : '',

        placeProperties: {
            placeType: placeType,
            location: metadata.location || 'mythical realm',
            inhabitants: metadata.inhabitants || [],
            significance: metadata.significance || '',
            access: placeType.includes('pilgrimage') ? 'open' : 'mythical-only',
            realm: placeType.includes('underworld') ? 'underworld' :
                   placeType.includes('mountain') || placeType.includes('temple') ? 'physical' : 'mythical',
            realityStatus: metadata.location && metadata.location.match(/[A-Z][a-z]+/) ? 'historical' : 'mythical'
        },

        relationships: {
            mythology: metadata.mythology,
            relatedDeities: metadata.relatedDeities || [],
            relatedPlaces: metadata.relatedPlaces || [],
            relatedItems: metadata.relatedItems || [],
            relatedEvents: [],
            relatedArchetypes: []
        },

        displayOptions: {
            icon: icon,
            color: '#10b981',
            badge: 'PLACE',
            mapView: placeType === 'sacred-mountain' || placeType === 'temple',
            visibility: 'public',
            featured: importance > 80,
            showOnIndex: true
        },

        searchTerms: searchTerms,
        tags: [placeType, metadata.mythology],
        facets: {
            type: placeType,
            mythology: metadata.mythology,
            accessibility: metadata.location && metadata.location.match(/[A-Z]/) ? 'real' : 'mythical',
            importance: importance > 80 ? 'cosmic' : importance > 60 ? 'major' : 'regional'
        },

        sources: {
            primaryTexts: [],
            scholarlyWorks: [],
            urls: []
        },

        metadata: {
            importance: importance,
            popularity: 50,
            completeness: metadata.description ? 80 : 50,
            verified: true,
            lastReviewed: admin.firestore.FieldValue.serverTimestamp()
        },

        timestamps: {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            publishedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    };
}

/**
 * Process all HTML files in a directory
 */
async function processDirectory(dirPath, collectionName, createDocFn) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);

            if (file.isDirectory()) {
                // Recursively process subdirectories
                await processDirectory(fullPath, collectionName, createDocFn);
            } else if (file.name.endsWith('.html') && file.name !== 'index.html') {
                try {
                    // Extract ID from filename
                    const id = file.name.replace('.html', '');

                    // Extract metadata from HTML
                    const metadata = await extractMetadataFromHTML(fullPath);

                    if (!metadata) {
                        console.log(`⚠️  Skipping ${file.name} - could not extract metadata`);
                        continue;
                    }

                    // Create complete document
                    const doc = createDocFn(id, fullPath, metadata);

                    // Write to Firestore
                    await db.collection(collectionName).doc(id).set(doc, { merge: true });

                    console.log(`✅ Created ${collectionName}/${id}`);

                    if (collectionName === 'items') {
                        stats.itemsCreated++;
                    } else {
                        stats.placesCreated++;
                    }

                } catch (error) {
                    console.error(`❌ Error processing ${file.name}:`, error.message);
                    stats.errors++;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🔥 AGENT 12: Expanding Items and Places Collections\n');

    const baseDir = path.join(__dirname, '..');

    // Process items
    console.log('📦 Processing Items...\n');
    const itemsDir = path.join(baseDir, 'spiritual-items');
    await processDirectory(itemsDir, 'items', createItemDocument);

    // Process places
    console.log('\n🗺️  Processing Places...\n');
    const placesDir = path.join(baseDir, 'spiritual-places');
    await processDirectory(placesDir, 'places', createPlaceDocument);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Items created: ${stats.itemsCreated}`);
    console.log(`Places created: ${stats.placesCreated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(50));

    console.log('\n✨ Collection expansion complete!');
}

// Run the script
main()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });

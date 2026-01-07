/**
 * Enrich Firebase Places and Items with HTML Content
 *
 * This script reads HTML files from spiritual-places and spiritual-items directories,
 * parses the content, and enriches the corresponding Firebase JSON files with:
 * - mythology: Associated myths and legends
 * - history: Historical/archaeological information
 * - significance: Spiritual meaning and importance
 * - extendedContent: Full structured content from HTML
 */

const fs = require('fs');
const path = require('path');

// Paths
const HTML_PLACES_DIR = path.join(__dirname, '..', '_recovered-html', 'FIREBASE', 'spiritual-places');
const HTML_ITEMS_DIR = path.join(__dirname, '..', '_recovered-html', 'FIREBASE', 'spiritual-items');
const FIREBASE_PLACES_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'places');
const FIREBASE_ITEMS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'items');

// Tracking
let enrichedPlaces = 0;
let enrichedItems = 0;
let skippedPlaces = 0;
let skippedItems = 0;
const enrichmentReport = {
    places: [],
    items: [],
    errors: []
};

/**
 * Parse HTML content to extract structured data
 */
function parseHTMLContent(htmlContent, filename) {
    const result = {
        mythology: '',
        history: '',
        significance: '',
        extendedContent: [],
        traditions: [],
        powers: [],
        relatedItems: [],
        bibliography: []
    };

    try {
        // Extract section content using regex patterns

        // Extract tradition tags
        const traditionTagsMatch = htmlContent.match(/<span class="tradition-tag">([^<]+)<\/span>/g);
        if (traditionTagsMatch) {
            result.traditions = traditionTagsMatch.map(tag =>
                tag.replace(/<span class="tradition-tag">/, '').replace(/<\/span>/, '').trim()
            );
        }

        // Extract mythology/origin sections
        const mythologyPatterns = [
            /Origin and Mythology.*?<\/div>\s*<\/div>/is,
            /Mythology and Origin.*?<\/div>\s*<\/div>/is,
            /Creation Myth.*?<\/div>\s*<\/div>/is,
            /Origin Story.*?<\/div>\s*<\/div>/is,
            /Associated Deity and Myths.*?<\/div>\s*<\/div>/is,
            /Associated Deities and Myths.*?<\/div>\s*<\/div>/is
        ];

        for (const pattern of mythologyPatterns) {
            const match = htmlContent.match(pattern);
            if (match) {
                result.mythology = cleanHTMLText(match[0]);
                break;
            }
        }

        // Extract history sections
        const historyPatterns = [
            /Historical.*?Background.*?<\/div>\s*<\/div>/is,
            /Historical Accounts.*?<\/div>\s*<\/div>/is,
            /Archaeological.*?<\/div>\s*<\/div>/is,
            /History and.*?<\/div>\s*<\/div>/is
        ];

        for (const pattern of historyPatterns) {
            const match = htmlContent.match(pattern);
            if (match) {
                result.history = cleanHTMLText(match[0]);
                break;
            }
        }

        // Extract significance/symbolism sections
        const significancePatterns = [
            /Symbolism and Spiritual Meaning.*?<\/div>\s*<\/div>/is,
            /Significance.*?<\/div>\s*<\/div>/is,
            /Powers and Significance.*?<\/div>\s*<\/div>/is,
            /Symbolic Meaning.*?<\/div>\s*<\/div>/is,
            /Spiritual Significance.*?<\/div>\s*<\/div>/is
        ];

        for (const pattern of significancePatterns) {
            const match = htmlContent.match(pattern);
            if (match) {
                result.significance = cleanHTMLText(match[0]);
                break;
            }
        }

        // Extract powers
        const powersMatch = htmlContent.match(/<div class="power-item">.*?<\/div>/gs);
        if (powersMatch) {
            result.powers = powersMatch.map(power => cleanHTMLText(power)).filter(p => p.length > 0);
        }

        // Extract all glass-card sections for extended content
        const sectionMatches = htmlContent.match(/<div class="glass-card">.*?<h3 class="section-title">([^<]+)<\/h3>.*?<\/div>\s*<\/div>/gs);
        if (sectionMatches) {
            for (const section of sectionMatches) {
                const titleMatch = section.match(/<h3 class="section-title">([^<]+)<\/h3>/);
                if (titleMatch) {
                    const title = titleMatch[1].trim();
                    const content = cleanHTMLText(section);
                    if (content.length > 50) {
                        result.extendedContent.push({
                            title: title,
                            content: content
                        });
                    }
                }
            }
        }

        // Extract bibliography
        const bibliographyMatch = htmlContent.match(/<div class="bibliography.*?>.*?<ol>(.*?)<\/ol>/is);
        if (bibliographyMatch) {
            const bibItems = bibliographyMatch[1].match(/<li>.*?<\/li>/gs);
            if (bibItems) {
                result.bibliography = bibItems.map(item => cleanHTMLText(item));
            }
        }

        // Extract hero subtitle for quick description
        const subtitleMatch = htmlContent.match(/<p class="hero-subtitle">([^<]+)<\/p>/);
        if (subtitleMatch) {
            result.heroSubtitle = subtitleMatch[1].trim();
        }

        // Extract info-grid items
        const infoItems = htmlContent.match(/<div class="info-item">.*?<div class="info-label">([^<]+)<\/div>.*?<div class="info-value">([^<]+)<\/div>.*?<\/div>/gs);
        if (infoItems) {
            result.infoGrid = {};
            for (const item of infoItems) {
                const labelMatch = item.match(/<div class="info-label">([^<]+)<\/div>/);
                const valueMatch = item.match(/<div class="info-value">([^<]+)<\/div>/);
                if (labelMatch && valueMatch) {
                    result.infoGrid[labelMatch[1].trim().toLowerCase()] = valueMatch[1].trim();
                }
            }
        }

    } catch (error) {
        console.error(`Error parsing ${filename}:`, error.message);
    }

    return result;
}

/**
 * Clean HTML text by removing tags and normalizing whitespace
 */
function cleanHTMLText(html) {
    if (!html) return '';

    return html
        // Remove HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Decode HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Get all HTML files recursively from a directory
 */
function getHTMLFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        return files;
    }

    function walkDir(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
                files.push(fullPath);
            }
        }
    }

    walkDir(dir);
    return files;
}

/**
 * Convert HTML filename to JSON filename
 */
function htmlToJsonFilename(htmlPath, type) {
    const basename = path.basename(htmlPath, '.html');
    // Handle different naming conventions
    const possibleNames = [
        basename,
        basename.replace(/-/g, '_'),
        basename.replace(/_/g, '-'),
        // Handle places with location prefixes
        `${basename}`,
    ];
    return possibleNames;
}

/**
 * Find matching JSON file for an HTML file
 */
function findMatchingJson(htmlPath, jsonDir) {
    const basename = path.basename(htmlPath, '.html');
    const possibleNames = [
        basename,
        basename.replace(/-/g, '_'),
        basename.replace(/_/g, '-'),
    ];

    for (const name of possibleNames) {
        const jsonPath = path.join(jsonDir, `${name}.json`);
        if (fs.existsSync(jsonPath)) {
            return jsonPath;
        }
    }

    // Try to find by partial match
    if (fs.existsSync(jsonDir)) {
        const files = fs.readdirSync(jsonDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const jsonBasename = file.replace('.json', '');
                if (jsonBasename.includes(basename) || basename.includes(jsonBasename)) {
                    return path.join(jsonDir, file);
                }
            }
        }
    }

    return null;
}

/**
 * Enrich a JSON file with parsed HTML content
 */
function enrichJsonFile(jsonPath, parsedContent, htmlPath) {
    try {
        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let wasEnriched = false;

        // Add mythology if not present or empty
        if (parsedContent.mythology && (!jsonContent.mythology || jsonContent.mythology.length < 100)) {
            jsonContent.mythology = parsedContent.mythology;
            wasEnriched = true;
        }

        // Add history if not present or empty
        if (parsedContent.history && (!jsonContent.history || jsonContent.history.length < 100)) {
            jsonContent.history = parsedContent.history;
            wasEnriched = true;
        }

        // Add significance if not present or short
        if (parsedContent.significance && (!jsonContent.significance || jsonContent.significance.length < 50)) {
            jsonContent.significance = parsedContent.significance;
            wasEnriched = true;
        }

        // Add traditions if present
        if (parsedContent.traditions && parsedContent.traditions.length > 0) {
            if (!jsonContent.traditions) {
                jsonContent.traditions = parsedContent.traditions;
                wasEnriched = true;
            }
        }

        // Add powers if present and not already there
        if (parsedContent.powers && parsedContent.powers.length > 0) {
            if (!jsonContent.powers || jsonContent.powers.length === 0) {
                jsonContent.powers = parsedContent.powers;
                wasEnriched = true;
            }
        }

        // Add or merge extended content
        if (parsedContent.extendedContent && parsedContent.extendedContent.length > 0) {
            if (!jsonContent.extendedContent) {
                jsonContent.extendedContent = parsedContent.extendedContent;
                wasEnriched = true;
            } else {
                // Merge, avoiding duplicates
                const existingTitles = new Set(jsonContent.extendedContent.map(e => e.title));
                for (const section of parsedContent.extendedContent) {
                    if (!existingTitles.has(section.title)) {
                        jsonContent.extendedContent.push(section);
                        wasEnriched = true;
                    }
                }
            }
        }

        // Add bibliography if present
        if (parsedContent.bibliography && parsedContent.bibliography.length > 0) {
            if (!jsonContent.bibliography) {
                jsonContent.bibliography = parsedContent.bibliography;
                wasEnriched = true;
            }
        }

        // Add info grid data
        if (parsedContent.infoGrid) {
            if (parsedContent.infoGrid.wielder && !jsonContent.wielder) {
                jsonContent.wielder = parsedContent.infoGrid.wielder;
                wasEnriched = true;
            }
            if (parsedContent.infoGrid.origin && !jsonContent.origin) {
                jsonContent.origin = parsedContent.infoGrid.origin;
                wasEnriched = true;
            }
            if (parsedContent.infoGrid.owner && !jsonContent.owner) {
                jsonContent.owner = parsedContent.infoGrid.owner;
                wasEnriched = true;
            }
            if (parsedContent.infoGrid.type && !jsonContent.itemType) {
                jsonContent.itemType = parsedContent.infoGrid.type;
                wasEnriched = true;
            }
            if (parsedContent.infoGrid.location && !jsonContent.location) {
                jsonContent.location = parsedContent.infoGrid.location;
                wasEnriched = true;
            }
            if (parsedContent.infoGrid['crafted by'] && !jsonContent.craftedBy) {
                jsonContent.craftedBy = parsedContent.infoGrid['crafted by'];
                wasEnriched = true;
            }
        }

        // Update metadata
        if (wasEnriched) {
            jsonContent._htmlEnrichment = {
                enrichedAt: new Date().toISOString(),
                sourceFile: path.relative(path.join(__dirname, '..'), htmlPath),
                enrichmentVersion: '1.0'
            };

            // Write back
            fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf8');
            return true;
        }

        return false;
    } catch (error) {
        console.error(`Error enriching ${jsonPath}:`, error.message);
        enrichmentReport.errors.push({
            file: jsonPath,
            error: error.message
        });
        return false;
    }
}

/**
 * Process all HTML files and enrich corresponding JSON files
 */
function processEnrichment() {
    console.log('='.repeat(60));
    console.log('Firebase Places & Items HTML Enrichment');
    console.log('='.repeat(60));
    console.log('');

    // Process Places
    console.log('Processing Spiritual Places...');
    console.log('-'.repeat(40));

    const placesHtmlFiles = getHTMLFiles(HTML_PLACES_DIR);
    console.log(`Found ${placesHtmlFiles.length} HTML files in spiritual-places`);

    for (const htmlPath of placesHtmlFiles) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const parsedContent = parseHTMLContent(htmlContent, path.basename(htmlPath));

        const jsonPath = findMatchingJson(htmlPath, FIREBASE_PLACES_DIR);

        if (jsonPath) {
            const enriched = enrichJsonFile(jsonPath, parsedContent, htmlPath);
            if (enriched) {
                enrichedPlaces++;
                enrichmentReport.places.push({
                    html: path.basename(htmlPath),
                    json: path.basename(jsonPath),
                    status: 'enriched'
                });
                console.log(`  [+] Enriched: ${path.basename(jsonPath)}`);
            } else {
                skippedPlaces++;
                enrichmentReport.places.push({
                    html: path.basename(htmlPath),
                    json: path.basename(jsonPath),
                    status: 'skipped (already enriched)'
                });
            }
        } else {
            skippedPlaces++;
            enrichmentReport.places.push({
                html: path.basename(htmlPath),
                json: null,
                status: 'no matching JSON'
            });
            console.log(`  [-] No match: ${path.basename(htmlPath)}`);
        }
    }

    console.log('');
    console.log('Processing Spiritual Items...');
    console.log('-'.repeat(40));

    // Process Items
    const itemsHtmlFiles = getHTMLFiles(HTML_ITEMS_DIR);
    console.log(`Found ${itemsHtmlFiles.length} HTML files in spiritual-items`);

    for (const htmlPath of itemsHtmlFiles) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const parsedContent = parseHTMLContent(htmlContent, path.basename(htmlPath));

        const jsonPath = findMatchingJson(htmlPath, FIREBASE_ITEMS_DIR);

        if (jsonPath) {
            const enriched = enrichJsonFile(jsonPath, parsedContent, htmlPath);
            if (enriched) {
                enrichedItems++;
                enrichmentReport.items.push({
                    html: path.basename(htmlPath),
                    json: path.basename(jsonPath),
                    status: 'enriched'
                });
                console.log(`  [+] Enriched: ${path.basename(jsonPath)}`);
            } else {
                skippedItems++;
                enrichmentReport.items.push({
                    html: path.basename(htmlPath),
                    json: path.basename(jsonPath),
                    status: 'skipped (already enriched)'
                });
            }
        } else {
            skippedItems++;
            enrichmentReport.items.push({
                html: path.basename(htmlPath),
                json: null,
                status: 'no matching JSON'
            });
            console.log(`  [-] No match: ${path.basename(htmlPath)}`);
        }
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('ENRICHMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Places enriched: ${enrichedPlaces}`);
    console.log(`Places skipped:  ${skippedPlaces}`);
    console.log(`Items enriched:  ${enrichedItems}`);
    console.log(`Items skipped:   ${skippedItems}`);
    console.log(`Total enriched:  ${enrichedPlaces + enrichedItems}`);
    console.log(`Errors:          ${enrichmentReport.errors.length}`);
    console.log('='.repeat(60));

    // Write report
    const reportPath = path.join(__dirname, '..', 'PLACES_ITEMS_ENRICHMENT_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            placesEnriched: enrichedPlaces,
            placesSkipped: skippedPlaces,
            itemsEnriched: enrichedItems,
            itemsSkipped: skippedItems,
            totalEnriched: enrichedPlaces + enrichedItems,
            errors: enrichmentReport.errors.length
        },
        details: enrichmentReport
    }, null, 2), 'utf8');

    console.log(`\nReport saved to: ${reportPath}`);
}

// Run the enrichment
processEnrichment();

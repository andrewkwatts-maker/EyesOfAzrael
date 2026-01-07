/**
 * Egyptian Deities Enrichment Script
 *
 * Parses HTML content from recovered files and enriches Firebase JSON assets
 * with mythology, relationships, worship, key myths, and sources.
 */

const fs = require('fs');
const path = require('path');

// Paths
const HTML_DIR = 'H:/Github/EyesOfAzrael/_recovered-html/FIREBASE/mythos/egyptian/deities';
const JSON_FILE = 'H:/Github/EyesOfAzrael/firebase-assets-downloaded/deities/egyptian.json';
const OUTPUT_FILE = 'H:/Github/EyesOfAzrael/firebase-assets-downloaded/deities/egyptian.json';

/**
 * Extract text content from HTML, stripping tags but preserving text
 */
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract section content between HTML section markers
 */
function extractSection(html, sectionId) {
    // Try to find section by id
    const sectionRegex = new RegExp(
        `<section[^>]*id=["']${sectionId}["'][^>]*>([\\s\\S]*?)<\\/section>`,
        'i'
    );
    const match = html.match(sectionRegex);
    return match ? match[1] : null;
}

/**
 * Extract all list items from HTML content
 */
function extractListItems(html) {
    const items = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = liRegex.exec(html)) !== null) {
        const cleanText = stripHtml(match[1]);
        if (cleanText) {
            items.push(cleanText);
        }
    }
    return items;
}

/**
 * Parse mythology section from HTML
 */
function parseMythologySection(html) {
    const section = extractSection(html, 'mythology');
    if (!section) return null;

    const mythology = {
        overview: '',
        keyMyths: [],
        sources: []
    };

    // Extract overview (first paragraph after h2)
    const overviewMatch = section.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (overviewMatch) {
        mythology.overview = stripHtml(overviewMatch[1]);
    }

    // Extract key myths from list items
    const mythsList = extractListItems(section);
    mythology.keyMyths = mythsList.map(item => {
        // Try to extract myth title and description
        const titleMatch = item.match(/^([^:]+):/);
        if (titleMatch) {
            return {
                title: titleMatch[1].trim(),
                description: item.substring(titleMatch[0].length).trim()
            };
        }
        return { title: '', description: item };
    });

    // Extract sources from citation div
    const sourcesMatch = section.match(/Sources:[^<]*([\s\S]*?)(?:<\/div>|$)/i);
    if (sourcesMatch) {
        const sourcesText = stripHtml(sourcesMatch[1]);
        mythology.sources = sourcesText.split(',').map(s => s.trim()).filter(s => s);
    }

    return mythology;
}

/**
 * Parse relationships/family section from HTML
 */
function parseRelationshipsSection(html) {
    const section = extractSection(html, 'relationships');
    if (!section) return null;

    const family = {
        parents: [],
        consorts: [],
        children: [],
        siblings: [],
        allies: [],
        enemies: []
    };

    const content = section.toLowerCase();

    // Extract family members
    const items = extractListItems(section);
    items.forEach(item => {
        const lowerItem = item.toLowerCase();
        if (lowerItem.includes('parents:') || lowerItem.includes('parent:')) {
            family.parents.push(item.replace(/parents?:/i, '').trim());
        } else if (lowerItem.includes('consort')) {
            family.consorts.push(item.replace(/consorts?(\(s\))?:/i, '').trim());
        } else if (lowerItem.includes('children:') || lowerItem.includes('child:')) {
            family.children.push(item.replace(/children?:/i, '').trim());
        } else if (lowerItem.includes('siblings:') || lowerItem.includes('sibling:')) {
            family.siblings.push(item.replace(/siblings?:/i, '').trim());
        } else if (lowerItem.includes('allies:') || lowerItem.includes('ally:')) {
            family.allies.push(item.replace(/all(y|ies):/i, '').trim());
        } else if (lowerItem.includes('enemies:') || lowerItem.includes('enemy:')) {
            family.enemies.push(item.replace(/enem(y|ies):/i, '').trim());
        }
    });

    return family;
}

/**
 * Parse worship section from HTML
 */
function parseWorshipSection(html) {
    const section = extractSection(html, 'worship');
    if (!section) return null;

    const worship = {
        sacredSites: [],
        festivals: [],
        offerings: [],
        prayers: ''
    };

    // Extract sacred sites
    const sitesMatch = section.match(/Sacred Sites[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    if (sitesMatch) {
        worship.sacredSites.push(stripHtml(sitesMatch[1]));
    }

    // Extract festivals from list
    const festivalsSection = section.match(/Festivals[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (festivalsSection) {
        worship.festivals = extractListItems(festivalsSection[1]).map(f => {
            const titleMatch = f.match(/^([^:]+):/);
            if (titleMatch) {
                return {
                    name: titleMatch[1].trim(),
                    description: f.substring(titleMatch[0].length).trim()
                };
            }
            return { name: f, description: '' };
        });
    }

    // Extract offerings
    const offeringsMatch = section.match(/Offerings[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    if (offeringsMatch) {
        worship.offerings.push(stripHtml(offeringsMatch[1]));
    }

    // Extract prayers
    const prayersMatch = section.match(/Prayers[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    if (prayersMatch) {
        worship.prayers = stripHtml(prayersMatch[1]);
    }

    return worship;
}

/**
 * Parse attributes section from HTML
 */
function parseAttributesSection(html) {
    const section = extractSection(html, 'attributes');
    if (!section) return null;

    const attributes = {
        titles: [],
        domains: [],
        symbols: [],
        sacredAnimals: [],
        sacredPlants: [],
        colors: []
    };

    // Extract attribute cards
    const cardRegex = /<div class="attribute-card">([\s\S]*?)<\/div>\s*<\/div>/gi;
    let match;
    while ((match = cardRegex.exec(section)) !== null) {
        const card = match[1];
        const labelMatch = card.match(/attribute-label[^>]*>([^<]+)/i);
        const valueMatch = card.match(/attribute-value[^>]*>([\s\S]*?)<\/div>/i);

        if (labelMatch && valueMatch) {
            const label = labelMatch[1].toLowerCase().trim();
            const value = stripHtml(valueMatch[1]);

            if (label.includes('title')) {
                attributes.titles = value.split(',').map(t => t.trim()).filter(t => t);
            } else if (label.includes('domain')) {
                attributes.domains = value.split(',').map(d => d.trim()).filter(d => d);
            } else if (label.includes('symbol')) {
                attributes.symbols = value.split(',').map(s => s.trim()).filter(s => s);
            } else if (label.includes('animal')) {
                attributes.sacredAnimals = value.split(',').map(a => a.trim()).filter(a => a);
            } else if (label.includes('plant')) {
                attributes.sacredPlants = value.split(',').map(p => p.trim()).filter(p => p);
            } else if (label.includes('color')) {
                attributes.colors = value.split(',').map(c => c.trim()).filter(c => c);
            }
        }
    }

    return attributes;
}

/**
 * Extract extended content/description from deity header
 */
function extractExtendedContent(html) {
    // Find deity-header section and extract the main description
    const headerMatch = html.match(/<section class="deity-header">([\s\S]*?)<\/section>/i);
    if (!headerMatch) return null;

    const header = headerMatch[1];

    // Get the main paragraph description (after the subtitle)
    const descMatches = header.match(/<p[^>]*style="font-size: 1\.1rem[^>]*>([\s\S]*?)<\/p>/gi);
    if (descMatches && descMatches.length > 0) {
        return stripHtml(descMatches[descMatches.length - 1]);
    }

    return null;
}

/**
 * Parse an HTML file and extract enrichment data
 */
function parseHtmlFile(filePath) {
    try {
        const html = fs.readFileSync(filePath, 'utf-8');

        // Extract deity name from title (e.g., "Isis - Goddess of Magic...")
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        let name = '';
        if (titleMatch) {
            // Extract the deity name before the dash
            const titleParts = titleMatch[1].split(' - ');
            name = stripHtml(titleParts[0]).trim();
        }

        // Alternative: Try to extract from h2 in deity-header
        if (!name) {
            const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
            if (h2Match) {
                // Strip all HTML tags and get the first word/name
                const h2Text = stripHtml(h2Match[1]);
                const nameMatch = h2Text.match(/^([^(]+)/);
                name = nameMatch ? nameMatch[1].trim() : h2Text.split(' ')[0];
            }
        }

        // Also try getting name from filename
        const fileName = path.basename(filePath, '.html');
        if (!name || name.length < 2) {
            name = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        }

        // Get alternative names from h2 parentheses
        const h2Content = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        let altNames = [];
        if (h2Content) {
            const h2Text = stripHtml(h2Content[1]);
            const altMatch = h2Text.match(/\(([^)]+)\)/);
            if (altMatch) {
                altNames = altMatch[1].split(',').map(n => n.trim()).filter(n => n);
            }
        }

        const enrichment = {
            name: name,
            alternativeNames: altNames,
            extendedContent: extractExtendedContent(html),
            mythology: parseMythologySection(html),
            family: parseRelationshipsSection(html),
            worship: parseWorshipSection(html),
            attributes: parseAttributesSection(html)
        };

        return enrichment;
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Find matching deity in JSON by name
 */
function findMatchingDeity(deities, name, fileName) {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const fileBase = path.basename(fileName, '.html').toLowerCase().replace(/[^a-z-]/g, '');

    // First try exact matches
    let match = deities.find(d => {
        const dName = (d.name || d.displayName || '').toLowerCase().replace(/[^a-z]/g, '');
        const dId = (d.id || '').toLowerCase().replace(/[^a-z-]/g, '');

        return dName === cleanName ||
               dId === cleanName ||
               dId === fileBase ||
               dName === fileBase;
    });

    if (match) return match;

    // Try partial matches
    match = deities.find(d => {
        const dName = (d.name || d.displayName || '').toLowerCase().replace(/[^a-z]/g, '');
        const dId = (d.id || '').toLowerCase().replace(/[^a-z-]/g, '');
        const dTitle = (d.title || '').toLowerCase();

        return dName.includes(cleanName) ||
               cleanName.includes(dName) ||
               dId.includes(fileBase) ||
               fileBase.includes(dId) ||
               dTitle.includes(cleanName);
    });

    return match;
}

/**
 * Main enrichment function
 */
function enrichEgyptianDeities() {
    console.log('Starting Egyptian Deities Enrichment...\n');

    // Load existing JSON
    let deities;
    try {
        const jsonContent = fs.readFileSync(JSON_FILE, 'utf-8');
        deities = JSON.parse(jsonContent);
        console.log(`Loaded ${deities.length} deities from JSON file.`);
    } catch (error) {
        console.error('Error loading JSON file:', error.message);
        return;
    }

    // Get list of HTML files
    let htmlFiles;
    try {
        htmlFiles = fs.readdirSync(HTML_DIR)
            .filter(f => f.endsWith('.html') && f !== 'index.html');
        console.log(`Found ${htmlFiles.length} HTML files to process.\n`);
    } catch (error) {
        console.error('Error reading HTML directory:', error.message);
        return;
    }

    let enrichedCount = 0;
    const enrichmentReport = [];

    // Process each HTML file
    for (const htmlFile of htmlFiles) {
        const filePath = path.join(HTML_DIR, htmlFile);
        console.log(`Processing: ${htmlFile}`);

        const enrichment = parseHtmlFile(filePath);
        if (!enrichment || !enrichment.name) {
            console.log(`  - Skipped: Could not parse enrichment data`);
            continue;
        }

        // Find matching deity in JSON
        const deity = findMatchingDeity(deities, enrichment.name, htmlFile);
        if (!deity) {
            console.log(`  - No match found for "${enrichment.name}"`);
            enrichmentReport.push({
                file: htmlFile,
                name: enrichment.name,
                status: 'no_match'
            });
            continue;
        }

        // Apply enrichment
        let fieldsAdded = 0;

        // Add mythology
        if (enrichment.mythology && enrichment.mythology.keyMyths.length > 0) {
            deity.mythology = enrichment.mythology;
            fieldsAdded++;
        }

        // Add family/relationships
        if (enrichment.family) {
            deity.family = enrichment.family;
            fieldsAdded++;
        }

        // Add worship
        if (enrichment.worship) {
            deity.worship = enrichment.worship;
            fieldsAdded++;
        }

        // Add key myths as top-level array
        if (enrichment.mythology && enrichment.mythology.keyMyths.length > 0) {
            deity.keyMyths = enrichment.mythology.keyMyths;
            fieldsAdded++;
        }

        // Add sources
        if (enrichment.mythology && enrichment.mythology.sources.length > 0) {
            deity.sources = enrichment.mythology.sources;
            fieldsAdded++;
        }

        // Add extended content
        if (enrichment.extendedContent) {
            deity.extendedContent = enrichment.extendedContent;
            fieldsAdded++;
        }

        // Add alternative names
        if (enrichment.alternativeNames.length > 0) {
            deity.alternativeNames = enrichment.alternativeNames;
            fieldsAdded++;
        }

        // Enrich attributes if available
        if (enrichment.attributes) {
            if (enrichment.attributes.titles.length > 0) {
                deity.titles = enrichment.attributes.titles;
            }
            if (enrichment.attributes.sacredAnimals.length > 0) {
                deity.sacredAnimals = enrichment.attributes.sacredAnimals;
            }
            if (enrichment.attributes.sacredPlants.length > 0) {
                deity.sacredPlants = enrichment.attributes.sacredPlants;
            }
            if (enrichment.attributes.colors.length > 0) {
                deity.colors = enrichment.attributes.colors;
            }
            fieldsAdded++;
        }

        // Mark as enriched
        deity._enrichedFromHtml = true;
        deity._enrichmentDate = new Date().toISOString();

        enrichedCount++;
        console.log(`  - Enriched "${deity.name || deity.displayName}" with ${fieldsAdded} field groups`);

        enrichmentReport.push({
            file: htmlFile,
            name: enrichment.name,
            matchedId: deity.id,
            status: 'enriched',
            fieldsAdded: fieldsAdded
        });
    }

    // Save enriched JSON
    try {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(deities, null, 2), 'utf-8');
        console.log(`\nSaved enriched data to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Error saving JSON file:', error.message);
    }

    // Print summary
    console.log('\n========================================');
    console.log('ENRICHMENT SUMMARY');
    console.log('========================================');
    console.log(`Total HTML files processed: ${htmlFiles.length}`);
    console.log(`Successfully enriched: ${enrichedCount}`);
    console.log(`No match found: ${enrichmentReport.filter(r => r.status === 'no_match').length}`);
    console.log('========================================\n');

    // Save report
    const reportPath = path.join(path.dirname(OUTPUT_FILE), 'egyptian-enrichment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(enrichmentReport, null, 2), 'utf-8');
    console.log(`Report saved to: ${reportPath}`);

    return enrichedCount;
}

// Run the enrichment
enrichEgyptianDeities();

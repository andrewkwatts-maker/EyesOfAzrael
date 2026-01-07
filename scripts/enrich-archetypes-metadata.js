/**
 * Archetype Metadata Enrichment Script
 *
 * Parses HTML archetype files and generates enriched JSON files with:
 * - mythology: cross-cultural comparisons
 * - examples: array of deities fitting this archetype
 * - symbolism: universal meanings
 * - extendedContent: detailed descriptions and sources
 */

const fs = require('fs');
const path = require('path');

const HTML_SOURCE_DIR = 'H:\\Github\\EyesOfAzrael\\_recovered-html\\FIREBASE\\archetypes';
const JSON_OUTPUT_DIR = 'H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\archetypes';

// Ensure output directory exists
if (!fs.existsSync(JSON_OUTPUT_DIR)) {
    fs.mkdirSync(JSON_OUTPUT_DIR, { recursive: true });
}

/**
 * Extract text content from HTML, stripping tags
 */
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract characteristics from HTML
 */
function extractCharacteristics(html) {
    const characteristics = [];
    const charSection = html.match(/<section[^>]*class="characteristics"[^>]*>([\s\S]*?)<\/section>/i);
    if (charSection) {
        const liMatches = charSection[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        for (const match of liMatches) {
            const text = stripHtml(match[1]);
            if (text) {
                const colonIndex = text.indexOf(':');
                if (colonIndex > 0) {
                    characteristics.push({
                        name: text.substring(0, colonIndex).trim(),
                        description: text.substring(colonIndex + 1).trim()
                    });
                } else {
                    characteristics.push({ name: text, description: '' });
                }
            }
        }
    }
    return characteristics;
}

/**
 * Extract deity examples from the deities table
 */
function extractDeityExamples(html) {
    const examples = [];
    const tableMatch = html.match(/<section[^>]*class="cross-tradition-table"[^>]*>([\s\S]*?)<\/section>/i);
    if (tableMatch) {
        const tbody = tableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
        if (tbody) {
            const rowMatches = tbody[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
            for (const rowMatch of rowMatches) {
                const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
                if (cells.length >= 4) {
                    const tradition = stripHtml(cells[0][1]);
                    const deityCell = cells[1][1];
                    const deityName = stripHtml(deityCell);
                    const deityLink = deityCell.match(/href="([^"]+)"/)?.[1] || '';

                    // Check if there's a match percentage
                    const matchCell = cells[2]?.[1] || '';
                    const matchPercent = matchCell.match(/(\d+)%/)?.[1];

                    // Determine attributes and domains based on table structure
                    let attributes = '';
                    let domains = '';

                    if (matchPercent) {
                        attributes = stripHtml(cells[3]?.[1] || '');
                        domains = stripHtml(cells[4]?.[1] || '');
                    } else {
                        attributes = stripHtml(cells[2]?.[1] || '');
                        domains = stripHtml(cells[3]?.[1] || '');
                    }

                    if (tradition && deityName) {
                        examples.push({
                            tradition,
                            name: deityName,
                            link: deityLink,
                            matchPercent: matchPercent ? parseInt(matchPercent) : null,
                            attributes,
                            domains
                        });
                    }
                }
            }
        }
    }
    return examples;
}

/**
 * Extract primary sources and citations
 */
function extractPrimarySources(html) {
    const sources = [];
    const sourceMatches = html.matchAll(/<div class="search-result-item"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi);
    for (const match of sourceMatches) {
        const citationMatch = match[1].match(/<div class="citation"[^>]*>([\s\S]*?)<\/div>/i);
        const verseMatch = match[1].match(/<div class="verse-text"[^>]*>([\s\S]*?)<\/div>/i);
        const bookMatch = match[1].match(/<div class="book-reference"[^>]*>([\s\S]*?)<\/div>/i);

        if (citationMatch) {
            sources.push({
                citation: stripHtml(citationMatch[1]),
                text: verseMatch ? stripHtml(verseMatch[1]) : '',
                source: bookMatch ? stripHtml(bookMatch[1]) : ''
            });
        }
    }
    return sources;
}

/**
 * Extract symbolic analysis content
 */
function extractSymbolicAnalysis(html) {
    const symbolism = {};

    // Look for sections with h3 headers containing symbolic content
    const h3Sections = html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<h2|<\/section)/gi);
    for (const match of h3Sections) {
        const title = stripHtml(match[1]);
        const content = match[2];

        if (title && content) {
            const listItems = [];
            const liMatches = content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
            for (const li of liMatches) {
                const text = stripHtml(li[1]);
                if (text) listItems.push(text);
            }

            const paragraphs = [];
            const pMatches = content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
            for (const p of pMatches) {
                const text = stripHtml(p[1]);
                if (text) paragraphs.push(text);
            }

            if (listItems.length > 0 || paragraphs.length > 0) {
                symbolism[title.toLowerCase().replace(/[^a-z0-9]+/g, '_')] = {
                    title,
                    description: paragraphs.join(' '),
                    points: listItems
                };
            }
        }
    }
    return symbolism;
}

/**
 * Extract related archetypes from interlink panel
 */
function extractRelatedArchetypes(html) {
    const related = [];
    const interlinkMatch = html.match(/<section class="interlink-panel"[^>]*>([\s\S]*?)<\/section>/i);
    if (interlinkMatch) {
        const linkMatches = interlinkMatch[1].matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
        for (const match of linkMatches) {
            const href = match[1];
            const text = stripHtml(match[2]);
            if (href.includes('/index.html') && text) {
                const name = text.split(' - ')[0].trim();
                const description = text.includes(' - ') ? text.split(' - ')[1].trim() : '';
                related.push({ name, link: href, description });
            }
        }
    }
    return related;
}

/**
 * Extract the archetype title from the page
 */
function extractTitle(html) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        return stripHtml(h1Match[1]).replace(/^[^\w]+/, '').trim();
    }
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
        return stripHtml(titleMatch[1]).replace(/ - Universal Archetype$/i, '').trim();
    }
    return '';
}

/**
 * Extract definition/description
 */
function extractDefinition(html) {
    const defMatch = html.match(/<div class="archetype-definition"[^>]*>([\s\S]*?)<\/div>/i);
    if (defMatch) {
        return stripHtml(defMatch[1]);
    }
    return '';
}

/**
 * Process a single HTML file and generate JSON
 */
function processArchetypeHtml(htmlPath, outputDir) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const fileName = path.basename(path.dirname(htmlPath));

    const archetype = {
        id: fileName,
        type: 'archetype',
        name: extractTitle(html),
        definition: extractDefinition(html),
        mythology: {
            crossCulturalComparisons: [],
            universalPatterns: [],
            traditions: []
        },
        examples: extractDeityExamples(html),
        characteristics: extractCharacteristics(html),
        symbolism: extractSymbolicAnalysis(html),
        primarySources: extractPrimarySources(html),
        relatedArchetypes: extractRelatedArchetypes(html),
        extendedContent: {
            sources: extractPrimarySources(html),
            analysis: []
        },
        metadata: {
            enrichedAt: new Date().toISOString(),
            sourceFile: htmlPath.replace(/\\/g, '/')
        }
    };

    // Build cross-cultural comparisons from examples
    const traditions = new Set();
    for (const ex of archetype.examples) {
        traditions.add(ex.tradition);
    }
    archetype.mythology.traditions = [...traditions];

    // Build universal patterns from characteristics
    archetype.mythology.universalPatterns = archetype.characteristics.map(c => c.name);

    // Build cross-cultural comparisons
    archetype.mythology.crossCulturalComparisons = archetype.examples.map(ex => ({
        tradition: ex.tradition,
        deity: ex.name,
        attributes: ex.attributes,
        matchPercent: ex.matchPercent
    }));

    // Write JSON file
    const outputPath = path.join(outputDir, `${fileName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(archetype, null, 2), 'utf8');

    return archetype;
}

/**
 * Find all archetype HTML files
 */
function findArchetypeFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const indexPath = path.join(fullPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                files.push(indexPath);
            }
            // Recurse into subdirectories
            files.push(...findArchetypeFiles(fullPath));
        } else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Main function
 */
function main() {
    console.log('Starting archetype enrichment...');
    console.log(`Source directory: ${HTML_SOURCE_DIR}`);
    console.log(`Output directory: ${JSON_OUTPUT_DIR}`);

    const htmlFiles = findArchetypeFiles(HTML_SOURCE_DIR);
    console.log(`Found ${htmlFiles.length} archetype HTML files`);

    let enrichedCount = 0;
    const results = [];

    for (const htmlFile of htmlFiles) {
        try {
            const archetype = processArchetypeHtml(htmlFile, JSON_OUTPUT_DIR);
            console.log(`Enriched: ${archetype.name} (${archetype.id})`);
            enrichedCount++;
            results.push({
                id: archetype.id,
                name: archetype.name,
                examples: archetype.examples.length,
                characteristics: archetype.characteristics.length,
                sources: archetype.primarySources.length
            });
        } catch (error) {
            console.error(`Error processing ${htmlFile}: ${error.message}`);
        }
    }

    // Write summary report
    const report = {
        enrichedAt: new Date().toISOString(),
        totalFiles: htmlFiles.length,
        enrichedCount,
        archetypes: results
    };

    fs.writeFileSync(
        path.join(JSON_OUTPUT_DIR, '_enrichment-report.json'),
        JSON.stringify(report, null, 2),
        'utf8'
    );

    console.log('\n=== ENRICHMENT COMPLETE ===');
    console.log(`Total HTML files found: ${htmlFiles.length}`);
    console.log(`Successfully enriched: ${enrichedCount}`);
    console.log(`Output directory: ${JSON_OUTPUT_DIR}`);

    return report;
}

main();

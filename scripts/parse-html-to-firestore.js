#!/usr/bin/env node

/**
 * Comprehensive HTML Parser for Mythology Content
 *
 * This script parses all HTML files in the mythology system and extracts
 * structured data for migration to Firebase Firestore.
 *
 * Usage:
 *   node parse-html-to-firestore.js --mythology=greek
 *   node parse-html-to-firestore.js --all
 *   node parse-html-to-firestore.js --validate-only
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const BASE_DIR = path.join(__dirname, '..');
const MYTHOS_DIR = path.join(BASE_DIR, 'mythos');

/**
 * Extract mythology metadata from index.html
 */
function parseMythologyIndex(mythologyId) {
    const indexPath = path.join(MYTHOS_DIR, mythologyId, 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.warn(`⚠️  No index.html found for ${mythologyId}`);
        return null;
    }

    const html = fs.readFileSync(indexPath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract title and icon
    const title = doc.querySelector('title')?.textContent || '';
    const heroIcon = doc.querySelector('.hero-icon-display')?.textContent?.trim() || '';
    const heroTitle = doc.querySelector('.hero-section h2')?.textContent || '';
    const heroDescription = doc.querySelector('.hero-description')?.textContent || '';

    // Extract breadcrumb for context
    const breadcrumb = doc.querySelector('.breadcrumb')?.textContent || '';

    // Extract deity links
    const deities = [];
    const deityLinks = doc.querySelectorAll('a[href*="/deities/"]');
    deityLinks.forEach(link => {
        const href = link.getAttribute('href');
        const name = link.textContent.trim();
        const deityId = href.match(/deities\/([^.]+)\.html/)?.[1];

        if (deityId && name) {
            deities.push({
                id: deityId,
                name: name.replace(/^[⚡🌊🔱🏹⚔️🍷🌾🏛️⚖️💘🔥🌟🦉👑🕊️]+\s*/, ''), // Remove emoji prefix
                link: href
            });
        }
    });

    // Extract section headers for structure
    const sections = [];
    const sectionHeaders = doc.querySelectorAll('.section-header, h2, h3');
    sectionHeaders.forEach(header => {
        const text = header.textContent.trim();
        if (text && text.length > 0) {
            sections.push({
                level: header.tagName.toLowerCase(),
                text: text.replace(/^[⚡🌊🔱🏹⚔️]+\s*/, ''),
                type: detectSectionType(text)
            });
        }
    });

    return {
        id: mythologyId,
        title: title.replace(' - World Mythos Explorer', '').trim(),
        icon: heroIcon,
        heroTitle: heroTitle,
        description: heroDescription.trim(),
        breadcrumb: breadcrumb.trim(),
        deities: deities,
        sections: sections,
        stats: {
            deityCount: deities.length,
            sectionCount: sections.length
        }
    };
}

/**
 * Detect section type from header text
 */
function detectSectionType(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('olympian') || lowerText.includes('pantheon')) return 'pantheon';
    if (lowerText.includes('cosmolog')) return 'cosmology';
    if (lowerText.includes('deit') || lowerText.includes('god')) return 'deities';
    if (lowerText.includes('hero')) return 'heroes';
    if (lowerText.includes('creature') || lowerText.includes('monster')) return 'creatures';
    if (lowerText.includes('text') || lowerText.includes('scripture')) return 'texts';
    if (lowerText.includes('ritual') || lowerText.includes('practice')) return 'rituals';
    if (lowerText.includes('symbol')) return 'symbols';
    if (lowerText.includes('magic')) return 'magic';
    if (lowerText.includes('herb') || lowerText.includes('plant')) return 'herbs';
    if (lowerText.includes('path') || lowerText.includes('spiritual')) return 'spiritual_path';

    return 'general';
}

/**
 * Parse individual deity page
 */
function parseDeityPage(mythologyId, deityId) {
    const deityPath = path.join(MYTHOS_DIR, mythologyId, 'deities', `${deityId}.html`);

    if (!fs.existsSync(deityPath)) {
        console.warn(`⚠️  Deity file not found: ${deityPath}`);
        return null;
    }

    const html = fs.readFileSync(deityPath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract basic info
    const title = doc.querySelector('title')?.textContent || '';
    // FIX Bug #1: Extract deity name correctly (part after '-', not before)
    const name = title.split('-').length > 1
        ? title.split('-')[1].trim()  // Get deity name (e.g., "Zeus" from "Greek - Zeus")
        : title.split('-')[0].trim(); // Fallback if no '-'
    const heroTitle = doc.querySelector('.hero-section h2, h1')?.textContent || '';
    // FIX Bug #3: Add more fallback selectors for descriptions
    const heroDescription =
        doc.querySelector('.hero-description')?.textContent ||
        doc.querySelector('.hero-section p')?.textContent ||
        doc.querySelector('.deity-header p')?.textContent ||
        doc.querySelector('.subtitle')?.textContent ||
        doc.querySelector('main > p')?.textContent || '';

    // Extract metadata from structured sections
    const metadata = extractMetadataFromSections(doc);

    // Extract corpus links for primary sources
    const corpusLinks = [];
    doc.querySelectorAll('.corpus-link').forEach(link => {
        corpusLinks.push({
            term: link.getAttribute('data-term') || link.textContent.trim(),
            tradition: link.getAttribute('data-tradition'),
            href: link.getAttribute('href')
        });
    });

    // Extract related links
    const relatedLinks = [];
    doc.querySelectorAll('a[href*="/deities/"], a[href*="/heroes/"], a[href*="/cosmology/"]').forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();

        if (href && text && !href.includes('index.html')) {
            relatedLinks.push({
                type: href.includes('/deities/') ? 'deity' :
                      href.includes('/heroes/') ? 'hero' :
                      href.includes('/cosmology/') ? 'cosmology' : 'other',
                name: text,
                link: href
            });
        }
    });

    return {
        id: deityId,
        mythology: mythologyId,
        name: name,
        displayName: metadata.displayName || heroTitle || name,
        title: title,
        description: heroDescription.trim(),
        archetypes: metadata.archetypes || [],
        domains: metadata.domains || [],
        symbols: metadata.symbols || [],
        epithets: metadata.epithets || [],
        attributes: metadata.attributes || [],
        relationships: metadata.relationships || {},
        primarySources: corpusLinks,
        relatedEntities: relatedLinks,
        rawMetadata: metadata
    };
}

/**
 * Extract metadata from structured HTML sections
 */
function extractMetadataFromSections(doc) {
    const metadata = {
        archetypes: [],
        domains: [],
        symbols: [],
        epithets: [],
        attributes: [],
        relationships: {},
        displayName: null
    };

    // Look for common metadata patterns
    // FIX Bug #2: Add .attribute-card and .attribute-grid for Hindu/Norse HTML structure
    const sections = doc.querySelectorAll('.glass-card, section, .card, .attribute-card, .attribute-grid');

    sections.forEach(section => {
        const headerText = section.querySelector('h2, h3, .card-title, .attribute-label')?.textContent?.toLowerCase() || '';
        const content = section.textContent;

        // Archetypes
        if (headerText.includes('archetype')) {
            const links = section.querySelectorAll('a');
            links.forEach(link => {
                const archetype = link.textContent.trim();
                if (archetype) metadata.archetypes.push(archetype);
            });
        }

        // Domains/Roles
        // FIX Bug #4: Support .attribute-value divs for Hindu/Norse structure
        if (headerText.includes('domain') || headerText.includes('role') || headerText.includes('sphere')) {
            // Try attribute-value first (Hindu/Norse structure)
            const attributeValue = section.querySelector('.attribute-value');
            if (attributeValue) {
                const text = attributeValue.textContent.trim();
                // Split on commas for multi-value attributes
                const items = text.split(',').map(item => item.trim()).filter(item => item.length > 0 && item.length < 100);
                metadata.domains.push(...items);
            } else {
                // Fallback to badges/li structure (Greek structure)
                const badges = section.querySelectorAll('.badge, .meta-badge, li');
                badges.forEach(badge => {
                    const domain = badge.textContent.trim().replace(/^[•\-→]\s*/, '');
                    if (domain && domain.length < 50) metadata.domains.push(domain);
                });
            }
        }

        // Symbols
        if (headerText.includes('symbol') || headerText.includes('sacred')) {
            // Try attribute-value first
            const attributeValue = section.querySelector('.attribute-value');
            if (attributeValue) {
                const text = attributeValue.textContent.trim();
                const items = text.split(',').map(item => item.trim()).filter(item => item.length > 0 && item.length < 100);
                metadata.symbols.push(...items);
            } else {
                const items = section.querySelectorAll('li, .badge');
                items.forEach(item => {
                    const symbol = item.textContent.trim();
                    if (symbol && symbol.length < 50) metadata.symbols.push(symbol);
                });
            }
        }

        // Epithets/Titles
        if (headerText.includes('epithet') || headerText.includes('title') || headerText.includes('name')) {
            // Try attribute-value first
            const attributeValue = section.querySelector('.attribute-value');
            if (attributeValue) {
                const text = attributeValue.textContent.trim();
                const items = text.split(',').map(item => item.trim()).filter(item => item.length > 0 && item.length < 100);
                metadata.epithets.push(...items);
            } else {
                const items = section.querySelectorAll('li, em, strong');
                items.forEach(item => {
                    const epithet = item.textContent.trim();
                    if (epithet && epithet.length < 100 && !epithet.includes('\n')) {
                        metadata.epithets.push(epithet);
                    }
                });
            }
        }

        // Relationships
        if (headerText.includes('family') || headerText.includes('relationship') || headerText.includes('genealogy')) {
            const text = section.textContent.toLowerCase();

            // Extract family relationships
            const fatherMatch = text.match(/father[:\s]+([^,\n]+)/i);
            const motherMatch = text.match(/mother[:\s]+([^,\n]+)/i);
            const consortMatch = text.match(/(?:consort|spouse|wife|husband)[:\s]+([^,\n]+)/i);
            const childrenMatch = text.match(/children[:\s]+([^\.]+)/i);

            if (fatherMatch) metadata.relationships.father = fatherMatch[1].trim();
            if (motherMatch) metadata.relationships.mother = motherMatch[1].trim();
            if (consortMatch) metadata.relationships.consort = consortMatch[1].trim();
            if (childrenMatch) {
                metadata.relationships.children = childrenMatch[1]
                    .split(/,|and/)
                    .map(c => c.trim())
                    .filter(c => c && c.length < 50);
            }
        }

        // Display name (with transliteration)
        const nameHeader = section.querySelector('h1, h2, .hero-title');
        if (nameHeader && !metadata.displayName) {
            const fullName = nameHeader.textContent.trim();
            if (fullName.includes('(') || fullName.includes('[')) {
                metadata.displayName = fullName;
            }
        }
    });

    // Clean up duplicates
    metadata.archetypes = [...new Set(metadata.archetypes)];
    metadata.domains = [...new Set(metadata.domains)];
    metadata.symbols = [...new Set(metadata.symbols)];
    metadata.epithets = [...new Set(metadata.epithets)];

    return metadata;
}

/**
 * Parse all deities for a mythology
 */
function parseAllDeities(mythologyId) {
    const deitiesDir = path.join(MYTHOS_DIR, mythologyId, 'deities');

    if (!fs.existsSync(deitiesDir)) {
        console.warn(`⚠️  No deities directory for ${mythologyId}`);
        return [];
    }

    const deityFiles = fs.readdirSync(deitiesDir)
        .filter(file => file.endsWith('.html') && file !== 'index.html');

    const deities = [];

    deityFiles.forEach(file => {
        const deityId = file.replace('.html', '');
        const deity = parseDeityPage(mythologyId, deityId);

        if (deity) {
            deities.push(deity);
        }
    });

    return deities;
}

/**
 * Get list of all mythologies
 */
function getAllMythologies() {
    const mythologies = fs.readdirSync(MYTHOS_DIR)
        .filter(name => {
            const stat = fs.statSync(path.join(MYTHOS_DIR, name));
            return stat.isDirectory();
        });

    return mythologies;
}

/**
 * Generate comprehensive report for a mythology
 */
function generateMythologyReport(mythologyId) {
    console.log(`\n📖 Processing: ${mythologyId}`);
    console.log('━'.repeat(60));

    // Parse index
    const index = parseMythologyIndex(mythologyId);
    if (!index) {
        console.log(`❌ No index.html found`);
        return null;
    }

    console.log(`✅ Title: ${index.title}`);
    console.log(`✅ Icon: ${index.icon}`);
    console.log(`✅ Deities found in index: ${index.stats.deityCount}`);

    // Parse all deity pages
    const deities = parseAllDeities(mythologyId);
    console.log(`✅ Deity pages parsed: ${deities.length}`);

    // Generate summary
    const summary = {
        mythology: index,
        deities: deities,
        stats: {
            totalDeities: deities.length,
            deitiesWithArchetypes: deities.filter(d => d.archetypes.length > 0).length,
            deitiesWithDomains: deities.filter(d => d.domains.length > 0).length,
            deitiesWithSymbols: deities.filter(d => d.symbols.length > 0).length,
            deitiesWithRelationships: deities.filter(d => Object.keys(d.relationships).length > 0).length,
            totalArchetypes: [...new Set(deities.flatMap(d => d.archetypes))].length,
            totalDomains: [...new Set(deities.flatMap(d => d.domains))].length,
            totalSymbols: [...new Set(deities.flatMap(d => d.symbols))].length
        }
    };

    // Display stats
    console.log('\n📊 Statistics:');
    console.log(`   - Deities with archetypes: ${summary.stats.deitiesWithArchetypes}`);
    console.log(`   - Deities with domains: ${summary.stats.deitiesWithDomains}`);
    console.log(`   - Deities with symbols: ${summary.stats.deitiesWithSymbols}`);
    console.log(`   - Deities with relationships: ${summary.stats.deitiesWithRelationships}`);
    console.log(`   - Unique archetypes: ${summary.stats.totalArchetypes}`);
    console.log(`   - Unique domains: ${summary.stats.totalDomains}`);
    console.log(`   - Unique symbols: ${summary.stats.totalSymbols}`);

    return summary;
}

/**
 * Generate reports for all mythologies
 */
function generateAllReports() {
    const mythologies = getAllMythologies();
    console.log(`\n🚀 Found ${mythologies.length} mythologies to process\n`);

    const allReports = {};
    const allStats = {
        totalMythologies: 0,
        totalDeities: 0,
        mythologiesProcessed: 0,
        mythologiesFailed: 0
    };

    mythologies.forEach(mythId => {
        try {
            const report = generateMythologyReport(mythId);
            if (report) {
                allReports[mythId] = report;
                allStats.totalDeities += report.stats.totalDeities;
                allStats.mythologiesProcessed++;
            } else {
                allStats.mythologiesFailed++;
            }
        } catch (error) {
            console.error(`❌ Error processing ${mythId}:`, error.message);
            allStats.mythologiesFailed++;
        }
    });

    allStats.totalMythologies = mythologies.length;

    return { reports: allReports, stats: allStats };
}

/**
 * Save reports to JSON files
 */
function saveReports(reports, stats) {
    const outputDir = path.join(BASE_DIR, 'parsed_data');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save individual mythology reports
    Object.entries(reports).forEach(([mythId, report]) => {
        const filename = path.join(outputDir, `${mythId}_parsed.json`);
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`💾 Saved: ${filename}`);
    });

    // Save combined report
    const combinedPath = path.join(outputDir, 'all_mythologies_parsed.json');
    fs.writeFileSync(combinedPath, JSON.stringify(reports, null, 2));
    console.log(`💾 Saved: ${combinedPath}`);

    // Save stats
    const statsPath = path.join(outputDir, 'parsing_stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`💾 Saved: ${statsPath}`);

    return outputDir;
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const mythologyArg = args.find(arg => arg.startsWith('--mythology='));
    const validateOnly = args.includes('--validate-only');
    const processAll = args.includes('--all');

    console.log('🔍 HTML to Firestore Parser');
    console.log('━'.repeat(60));

    if (validateOnly) {
        console.log('Running in validation mode...\n');
        const { reports, stats } = generateAllReports();

        console.log('\n📈 Overall Statistics:');
        console.log(`   - Total mythologies: ${stats.totalMythologies}`);
        console.log(`   - Successfully processed: ${stats.mythologiesProcessed}`);
        console.log(`   - Failed: ${stats.mythologiesFailed}`);
        console.log(`   - Total deities: ${stats.totalDeities}`);

        return;
    }

    if (mythologyArg) {
        const mythId = mythologyArg.split('=')[1];
        const report = generateMythologyReport(mythId);

        if (report) {
            const outputDir = path.join(BASE_DIR, 'parsed_data');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const filename = path.join(outputDir, `${mythId}_parsed.json`);
            fs.writeFileSync(filename, JSON.stringify(report, null, 2));
            console.log(`\n💾 Saved to: ${filename}`);
        }

        return;
    }

    if (processAll) {
        const { reports, stats } = generateAllReports();

        console.log('\n━'.repeat(60));
        console.log('📈 Final Statistics:');
        console.log(`   - Total mythologies: ${stats.totalMythologies}`);
        console.log(`   - Successfully processed: ${stats.mythologiesProcessed}`);
        console.log(`   - Failed: ${stats.mythologiesFailed}`);
        console.log(`   - Total deities: ${stats.totalDeities}`);

        const outputDir = saveReports(reports, stats);

        console.log('\n✅ Parsing complete!');
        console.log(`📁 Output directory: ${outputDir}`);
        console.log('\n📝 Next step: Run upload script to push to Firestore');

        return;
    }

    // Default: show usage
    console.log('\nUsage:');
    console.log('  node parse-html-to-firestore.js --mythology=greek');
    console.log('  node parse-html-to-firestore.js --all');
    console.log('  node parse-html-to-firestore.js --validate-only');
}

// Run if called directly
if (require.main === module) {
    // Check for jsdom dependency
    try {
        require('jsdom');
    } catch (error) {
        console.error('❌ Missing dependency: jsdom');
        console.error('   Install with: npm install jsdom');
        process.exit(1);
    }

    main();
}

module.exports = {
    parseMythologyIndex,
    parseDeityPage,
    parseAllDeities,
    generateMythologyReport,
    generateAllReports
};

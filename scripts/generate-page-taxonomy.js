/**
 * Generate Page Taxonomy from Site Structure
 * Scans the mythos directory and builds a comprehensive taxonomy
 * Structure: Page → Section (optional) → Topic (optional)
 */

const fs = require('fs');
const path = require('path');

// Page categories based on your directory structure
const CATEGORIES = {
    'apocryphal': 'Apocryphal Texts',
    'aztec': 'Aztec Mythology',
    'babylonian': 'Babylonian Mythology',
    'buddhist': 'Buddhist Tradition',
    'celtic': 'Celtic Mythology',
    'christian': 'Christian Tradition',
    'egyptian': 'Egyptian Mythology',
    'greek': 'Greek Mythology',
    'hindu': 'Hindu Tradition',
    'jewish': 'Jewish Tradition',
    'norse': 'Norse Mythology',
    'roman': 'Roman Mythology',
    'sumerian': 'Sumerian Mythology',
    'comparative': 'Comparative Studies'
};

// Section types within each page category
const SECTION_TYPES = {
    'deities': 'Deities',
    'creatures': 'Creatures',
    'heroes': 'Heroes',
    'cosmology': 'Cosmology',
    'magic': 'Magic & Mysticism',
    'texts': 'Sacred Texts',
    'kabbalah': 'Kabbalah',
    'angels': 'Angels',
    'demons': 'Demons',
    'items': 'Sacred Items',
    'places': 'Sacred Places',
    'sefirot': 'Sefirot',
    'worlds': 'Worlds',
    'names': 'Divine Names',
    'concepts': 'Concepts',
    'teachings': 'Teachings',
    'theology': 'Theology',
    'lineage': 'Lineage',
    'practices': 'Spiritual Practices',
    'path': 'Spiritual Path',
    'herbs': 'Sacred Plants'
};

function scanDirectory(dir, baseDir = 'mythos') {
    const taxonomy = {};

    function scan(currentPath, category = null, section = null) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                const dirName = item;

                // First level: Category (e.g., "greek", "jewish")
                if (!category && CATEGORIES[dirName]) {
                    if (!taxonomy[dirName]) {
                        taxonomy[dirName] = {
                            name: CATEGORIES[dirName],
                            path: `/${baseDir}/${dirName}/`,
                            sections: {}
                        };
                    }
                    scan(fullPath, dirName);
                }
                // Second level: Section (e.g., "deities", "heroes")
                else if (category && !section && SECTION_TYPES[dirName]) {
                    if (!taxonomy[category].sections[dirName]) {
                        taxonomy[category].sections[dirName] = {
                            name: SECTION_TYPES[dirName],
                            path: `/${baseDir}/${category}/${dirName}/`,
                            topics: {}
                        };
                    }
                    scan(fullPath, category, dirName);
                }
                // Third level: Topic (specific pages within section)
                else if (category && section) {
                    scan(fullPath, category, section);
                }
            }
            else if (stat.isFile() && item.endsWith('.html') && item !== 'index.html') {
                // This is a topic page
                const topicId = item.replace('.html', '');
                const topicName = topicId
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                if (category && section) {
                    // Topic within a section
                    taxonomy[category].sections[section].topics[topicId] = {
                        name: topicName,
                        path: `/${baseDir}/${category}/${section}/${item}`
                    };
                } else if (category && !section) {
                    // Topic directly under category (no section)
                    if (!taxonomy[category].topics) {
                        taxonomy[category].topics = {};
                    }
                    taxonomy[category].topics[topicId] = {
                        name: topicName,
                        path: `/${baseDir}/${category}/${item}`
                    };
                }
            }
        }
    }

    scan(dir);
    return taxonomy;
}

// Generate the taxonomy
const mythosPath = path.join(__dirname, '..', 'mythos');
const taxonomy = scanDirectory(mythosPath);

// Write to JSON file
const outputPath = path.join(__dirname, '..', 'data', 'page-taxonomy.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(taxonomy, null, 2));

console.log(`✅ Generated taxonomy with ${Object.keys(taxonomy).length} categories`);
console.log(`📄 Output: ${outputPath}`);

// Print summary
let totalSections = 0;
let totalTopics = 0;
for (const [catId, cat] of Object.entries(taxonomy)) {
    const sectionCount = Object.keys(cat.sections || {}).length;
    totalSections += sectionCount;

    let topicCount = Object.keys(cat.topics || {}).length;
    for (const section of Object.values(cat.sections || {})) {
        topicCount += Object.keys(section.topics || {}).length;
    }
    totalTopics += topicCount;

    console.log(`  ${cat.name}: ${sectionCount} sections, ${topicCount} topics`);
}

console.log(`\n📊 Total: ${Object.keys(taxonomy).length} categories, ${totalSections} sections, ${totalTopics} topics`);

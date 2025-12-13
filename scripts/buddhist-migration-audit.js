const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const OLD_REPO_PATH = 'H:/Github/EyesOfAzrael2/EyesOfAzrael/mythos/buddhist';
const CURRENT_REPO_PATH = 'H:/Github/EyesOfAzrael/mythos/buddhist';
const DATA_ENTITIES_PATH = 'H:/Github/EyesOfAzrael/data/entities';
const INDICES_PATH = 'H:/Github/EyesOfAzrael/data/indices';

// Results object
const results = {
    oldRepository: {
        deities: [],
        heroes: [],
        creatures: [],
        concepts: [],
        cosmology: [],
        herbs: [],
        rituals: [],
        symbols: [],
        texts: [],
        magic: []
    },
    currentEntities: {
        deities: [],
        heroes: [],
        creatures: [],
        concepts: [],
        items: [],
        places: [],
        magic: []
    },
    missing: [],
    present: [],
    summary: {}
};

// Helper: Extract entity info from HTML file
function extractEntityInfo(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(content);

        const title = $('h1').first().text().trim() ||
                     $('h2').first().text().trim() ||
                     path.basename(filePath, '.html');

        const description = $('p.subtitle').first().text().trim() ||
                          $('p.hero-description').first().text().trim() ||
                          $('p').first().text().trim();

        return {
            file: path.basename(filePath),
            title: title,
            description: description.substring(0, 200),
            path: filePath
        };
    } catch (error) {
        return {
            file: path.basename(filePath),
            title: path.basename(filePath, '.html'),
            description: '',
            path: filePath,
            error: error.message
        };
    }
}

// Helper: Get all HTML files in a directory
function getHtmlFiles(dir) {
    const files = [];
    try {
        if (!fs.existsSync(dir)) return files;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...getHtmlFiles(fullPath));
            } else if (item.endsWith('.html') && !item.includes('index')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
    }
    return files;
}

// Helper: Get JSON entities by mythology
function getEntitiesByMythology(entityType, mythology) {
    const entities = [];
    const entityDir = path.join(DATA_ENTITIES_PATH, entityType);

    try {
        if (!fs.existsSync(entityDir)) return entities;

        const files = fs.readdirSync(entityDir);
        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(entityDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (content.mythologies && content.mythologies.includes(mythology)) {
                entities.push({
                    id: content.id,
                    name: content.name,
                    displayName: content.displayName,
                    type: entityType,
                    mythologies: content.mythologies,
                    primaryMythology: content.primaryMythology,
                    description: content.description || content.shortDescription,
                    file: file
                });
            }
        }
    } catch (error) {
        console.error(`Error reading ${entityType}:`, error.message);
    }

    return entities;
}

// Scan old repository
console.log('Scanning old repository...');
const categories = ['deities', 'heroes', 'creatures', 'concepts', 'cosmology', 'herbs', 'rituals', 'symbols', 'texts', 'magic'];

for (const category of categories) {
    const categoryPath = path.join(OLD_REPO_PATH, category);
    const htmlFiles = getHtmlFiles(categoryPath);

    results.oldRepository[category] = htmlFiles.map(f => extractEntityInfo(f));
    console.log(`  ${category}: ${htmlFiles.length} files`);
}

// Scan current entity database
console.log('\nScanning current entity database...');
const entityTypes = ['deity', 'hero', 'creature', 'concept', 'item', 'place', 'magic'];

for (const type of entityTypes) {
    const entities = getEntitiesByMythology(type, 'buddhist');
    results.currentEntities[type + 's'] = entities;
    console.log(`  ${type}s: ${entities.length} entities`);
}

// Compare and find missing
console.log('\nComparing content...');

// Check deities
for (const oldDeity of results.oldRepository.deities) {
    const name = oldDeity.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const found = results.currentEntities.deities.some(d => {
        const dName = (d.name || d.displayName || '').toLowerCase();
        return dName.includes(name) || name.includes(dName);
    });

    if (found) {
        results.present.push({
            category: 'deity',
            name: oldDeity.title,
            file: oldDeity.file
        });
    } else {
        results.missing.push({
            category: 'deity',
            name: oldDeity.title,
            description: oldDeity.description,
            file: oldDeity.file,
            path: oldDeity.path
        });
    }
}

// Check heroes
for (const oldHero of results.oldRepository.heroes) {
    const name = oldHero.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const found = results.currentEntities.heroes.some(h => {
        const hName = (h.name || h.displayName || '').toLowerCase();
        return hName.includes(name) || name.includes(hName);
    });

    if (found) {
        results.present.push({
            category: 'hero',
            name: oldHero.title,
            file: oldHero.file
        });
    } else {
        results.missing.push({
            category: 'hero',
            name: oldHero.title,
            description: oldHero.description,
            file: oldHero.file,
            path: oldHero.path
        });
    }
}

// Check creatures
for (const oldCreature of results.oldRepository.creatures) {
    const name = oldCreature.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const found = results.currentEntities.creatures.some(c => {
        const cName = (c.name || c.displayName || '').toLowerCase();
        return cName.includes(name) || name.includes(cName);
    });

    if (found) {
        results.present.push({
            category: 'creature',
            name: oldCreature.title,
            file: oldCreature.file
        });
    } else {
        results.missing.push({
            category: 'creature',
            name: oldCreature.title,
            description: oldCreature.description,
            file: oldCreature.file,
            path: oldCreature.path
        });
    }
}

// Check concepts
for (const oldConcept of results.oldRepository.concepts) {
    const name = oldConcept.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const found = results.currentEntities.concepts.some(c => {
        const cName = (c.name || c.displayName || '').toLowerCase();
        return cName.includes(name) || name.includes(cName);
    });

    if (found) {
        results.present.push({
            category: 'concept',
            name: oldConcept.title,
            file: oldConcept.file
        });
    } else {
        results.missing.push({
            category: 'concept',
            name: oldConcept.title,
            description: oldConcept.description,
            file: oldConcept.file,
            path: oldConcept.path
        });
    }
}

// Check cosmology (may be concepts or places)
for (const oldCosmo of results.oldRepository.cosmology) {
    const name = oldCosmo.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const found = results.currentEntities.concepts.some(c => {
        const cName = (c.name || c.displayName || '').toLowerCase();
        return cName.includes(name) || name.includes(cName);
    }) || results.currentEntities.places.some(p => {
        const pName = (p.name || p.displayName || '').toLowerCase();
        return pName.includes(name) || name.includes(pName);
    });

    if (found) {
        results.present.push({
            category: 'cosmology',
            name: oldCosmo.title,
            file: oldCosmo.file
        });
    } else {
        results.missing.push({
            category: 'cosmology',
            name: oldCosmo.title,
            description: oldCosmo.description,
            file: oldCosmo.file,
            path: oldCosmo.path
        });
    }
}

// Check herbs (should be items)
for (const oldHerb of results.oldRepository.herbs) {
    const name = oldHerb.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const found = results.currentEntities.items.some(i => {
        const iName = (i.name || i.displayName || '').toLowerCase();
        return iName.includes(name) || name.includes(iName);
    });

    if (found) {
        results.present.push({
            category: 'herb/item',
            name: oldHerb.title,
            file: oldHerb.file
        });
    } else {
        results.missing.push({
            category: 'herb/item',
            name: oldHerb.title,
            description: oldHerb.description,
            file: oldHerb.file,
            path: oldHerb.path
        });
    }
}

// Generate summary
results.summary = {
    oldRepositoryTotal: categories.reduce((sum, cat) => sum + results.oldRepository[cat].length, 0),
    currentEntitiesTotal: entityTypes.reduce((sum, type) => sum + results.currentEntities[type + 's'].length, 0),
    missingCount: results.missing.length,
    presentCount: results.present.length,
    migrationPercentage: Math.round((results.present.length /
        categories.reduce((sum, cat) => sum + results.oldRepository[cat].length, 0)) * 100)
};

// Output results
console.log('\n=== MIGRATION AUDIT SUMMARY ===');
console.log(`Old Repository Total: ${results.summary.oldRepositoryTotal}`);
console.log(`Current Entities Total: ${results.summary.currentEntitiesTotal}`);
console.log(`Missing: ${results.summary.missingCount}`);
console.log(`Present: ${results.summary.presentCount}`);
console.log(`Migration Coverage: ${results.summary.migrationPercentage}%`);

console.log('\n=== MISSING ITEMS ===');
results.missing.forEach((item, i) => {
    console.log(`${i + 1}. [${item.category}] ${item.name}`);
    if (item.description) {
        console.log(`   ${item.description.substring(0, 100)}...`);
    }
});

// Save results to file
const outputPath = 'H:/Github/EyesOfAzrael/scripts/buddhist-migration-audit-report.json';
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nFull report saved to: ${outputPath}`);

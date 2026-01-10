/**
 * Fix string references in Firebase asset files
 * Converts string references to proper object format
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded';
const FOLDERS_TO_PROCESS = ['deities', 'items', 'places', 'creatures'];

let totalFixes = 0;
let filesFixed = 0;
const fixReport = [];

/**
 * Generate a simple ID from a name
 */
function generateId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Convert a string to an object with id, name, and relationship
 */
function convertStringToObject(str, relationship = 'related') {
    const name = str.trim();
    const id = generateId(name);
    return {
        id: id,
        name: name,
        relationship: relationship
    };
}

/**
 * Process an array - convert any string elements to objects
 */
function processArray(arr, relationship = 'related') {
    if (!Array.isArray(arr)) return { changed: false, data: arr };

    let changed = false;
    const processed = arr.map(item => {
        if (typeof item === 'string') {
            changed = true;
            return convertStringToObject(item, relationship);
        }
        return item;
    });

    return { changed, data: processed };
}

/**
 * Parse a combined string like "Zeus and Hera" into multiple entities
 */
function parseMultipleEntities(str, relationship) {
    // Split by " and ", ",", or "/"
    const parts = str.split(/\s+and\s+|,\s*|\//).map(p => p.trim()).filter(p => p);
    return parts.map(part => convertStringToObject(part, relationship));
}

/**
 * Convert a string family field (like parents: "Zeus and Hera") to array of objects
 */
function convertFamilyString(str, relationship) {
    if (typeof str !== 'string') return { changed: false, data: str };
    return { changed: true, data: parseMultipleEntities(str, relationship) };
}

/**
 * Process the family object
 */
function processFamily(family) {
    if (!family || typeof family !== 'object') return { changed: false, data: family };

    let changed = false;
    const processed = { ...family };

    // Process parents - could be string, object with father/mother, or array
    if (processed.parents) {
        if (typeof processed.parents === 'string') {
            const result = convertFamilyString(processed.parents, 'parent');
            if (result.changed) {
                processed.parents = result.data;
                changed = true;
            }
        } else if (typeof processed.parents === 'object' && !Array.isArray(processed.parents)) {
            // Object with father/mother strings - leave as is for now, that's a valid format
        } else if (Array.isArray(processed.parents)) {
            const result = processArray(processed.parents, 'parent');
            if (result.changed) {
                processed.parents = result.data;
                changed = true;
            }
        }
    }

    // Process children
    if (processed.children) {
        if (typeof processed.children === 'string') {
            const result = convertFamilyString(processed.children, 'child');
            if (result.changed) {
                processed.children = result.data;
                changed = true;
            }
        } else if (Array.isArray(processed.children)) {
            const result = processArray(processed.children, 'child');
            if (result.changed) {
                processed.children = result.data;
                changed = true;
            }
        }
    }

    // Process siblings
    if (processed.siblings) {
        if (typeof processed.siblings === 'string') {
            const result = convertFamilyString(processed.siblings, 'sibling');
            if (result.changed) {
                processed.siblings = result.data;
                changed = true;
            }
        } else if (Array.isArray(processed.siblings)) {
            const result = processArray(processed.siblings, 'sibling');
            if (result.changed) {
                processed.siblings = result.data;
                changed = true;
            }
        }
    }

    // Process consorts
    if (processed.consorts) {
        if (typeof processed.consorts === 'string') {
            const result = convertFamilyString(processed.consorts, 'consort');
            if (result.changed) {
                processed.consorts = result.data;
                changed = true;
            }
        } else if (Array.isArray(processed.consorts)) {
            const result = processArray(processed.consorts, 'consort');
            if (result.changed) {
                processed.consorts = result.data;
                changed = true;
            }
        }
    }

    // Process consort (singular) if it's an array of strings
    if (processed.consort && Array.isArray(processed.consort)) {
        const result = processArray(processed.consort, 'consort');
        if (result.changed) {
            processed.consort = result.data;
            changed = true;
        }
    }

    // Process allies inside family
    if (processed.allies && Array.isArray(processed.allies)) {
        const result = processArray(processed.allies, 'ally');
        if (result.changed) {
            processed.allies = result.data;
            changed = true;
        }
    }

    // Process enemies inside family
    if (processed.enemies && Array.isArray(processed.enemies)) {
        const result = processArray(processed.enemies, 'enemy');
        if (result.changed) {
            processed.enemies = result.data;
            changed = true;
        }
    }

    return { changed, data: processed };
}

/**
 * Process relationships object
 */
function processRelationships(relationships) {
    if (!relationships || typeof relationships !== 'object') return { changed: false, data: relationships };

    let changed = false;
    const processed = { ...relationships };

    // Process parents array
    if (processed.parents && Array.isArray(processed.parents)) {
        const result = processArray(processed.parents, 'parent');
        if (result.changed) {
            processed.parents = result.data;
            changed = true;
        }
    }

    // Process children array
    if (processed.children && Array.isArray(processed.children)) {
        const result = processArray(processed.children, 'child');
        if (result.changed) {
            processed.children = result.data;
            changed = true;
        }
    }

    // Process siblings array
    if (processed.siblings && Array.isArray(processed.siblings)) {
        const result = processArray(processed.siblings, 'sibling');
        if (result.changed) {
            processed.siblings = result.data;
            changed = true;
        }
    }

    // Process consort array
    if (processed.consort && Array.isArray(processed.consort)) {
        const result = processArray(processed.consort, 'consort');
        if (result.changed) {
            processed.consort = result.data;
            changed = true;
        }
    }

    // Process allies array
    if (processed.allies && Array.isArray(processed.allies)) {
        const result = processArray(processed.allies, 'ally');
        if (result.changed) {
            processed.allies = result.data;
            changed = true;
        }
    }

    // Process enemies array
    if (processed.enemies && Array.isArray(processed.enemies)) {
        const result = processArray(processed.enemies, 'enemy');
        if (result.changed) {
            processed.enemies = result.data;
            changed = true;
        }
    }

    return { changed, data: processed };
}

/**
 * Process relatedEntities array
 */
function processRelatedEntities(relatedEntities) {
    if (!Array.isArray(relatedEntities)) return { changed: false, data: relatedEntities };

    let changed = false;
    const processed = relatedEntities.map(item => {
        if (typeof item === 'string') {
            changed = true;
            return convertStringToObject(item, 'related');
        }
        return item;
    });

    return { changed, data: processed };
}

/**
 * Process top-level allies array
 */
function processAllies(allies) {
    if (!Array.isArray(allies)) return { changed: false, data: allies };
    return processArray(allies, 'ally');
}

/**
 * Process top-level enemies array
 */
function processEnemies(enemies) {
    if (!Array.isArray(enemies)) return { changed: false, data: enemies };
    return processArray(enemies, 'enemy');
}

/**
 * Process a single JSON file
 */
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let data;

        try {
            data = JSON.parse(content);
        } catch (parseError) {
            console.log(`  Skipping ${filePath} - invalid JSON`);
            return 0;
        }

        // Skip non-entity files (reports, etc.)
        if (filePath.includes('_report') || filePath.includes('_all.json')) {
            return 0;
        }

        let fileChanged = false;
        let fixCount = 0;

        // Process family
        if (data.family) {
            const result = processFamily(data.family);
            if (result.changed) {
                data.family = result.data;
                fileChanged = true;
                fixCount++;
            }
        }

        // Process relationships
        if (data.relationships) {
            const result = processRelationships(data.relationships);
            if (result.changed) {
                data.relationships = result.data;
                fileChanged = true;
                fixCount++;
            }
        }

        // Process relatedEntities
        if (data.relatedEntities) {
            const result = processRelatedEntities(data.relatedEntities);
            if (result.changed) {
                data.relatedEntities = result.data;
                fileChanged = true;
                fixCount++;
            }
        }

        // Process top-level allies
        if (data.allies) {
            const result = processAllies(data.allies);
            if (result.changed) {
                data.allies = result.data;
                fileChanged = true;
                fixCount++;
            }
        }

        // Process top-level enemies
        if (data.enemies) {
            const result = processEnemies(data.enemies);
            if (result.changed) {
                data.enemies = result.data;
                fileChanged = true;
                fixCount++;
            }
        }

        if (fileChanged) {
            // Write the updated file
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            fixReport.push({
                file: path.basename(filePath),
                fixes: fixCount
            });
            return fixCount;
        }

        return 0;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return 0;
    }
}

/**
 * Process all JSON files in a folder
 */
function processFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    let folderFixes = 0;
    let folderFilesFixed = 0;

    for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(folderPath, file);
        const fixes = processFile(filePath);

        if (fixes > 0) {
            folderFixes += fixes;
            folderFilesFixed++;
        }
    }

    return { fixes: folderFixes, filesFixed: folderFilesFixed };
}

/**
 * Main function
 */
function main() {
    console.log('Starting string reference fix...\n');

    for (const folder of FOLDERS_TO_PROCESS) {
        const folderPath = path.join(BASE_DIR, folder);

        if (!fs.existsSync(folderPath)) {
            console.log(`Folder not found: ${folder}`);
            continue;
        }

        console.log(`Processing ${folder}...`);
        const result = processFolder(folderPath);
        totalFixes += result.fixes;
        filesFixed += result.filesFixed;
        console.log(`  Fixed ${result.fixes} issues in ${result.filesFixed} files\n`);
    }

    console.log('='.repeat(50));
    console.log(`TOTAL: ${totalFixes} fixes in ${filesFixed} files`);
    console.log('='.repeat(50));

    // Write report
    const reportPath = path.join(BASE_DIR, '_string_references_fix_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalFixes,
        filesFixed,
        details: fixReport
    }, null, 2));

    console.log(`\nReport saved to: ${reportPath}`);
}

main();

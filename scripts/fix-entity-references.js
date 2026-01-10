/**
 * Fix Entity Reference Formats
 *
 * Converts string references to proper entityReference objects and
 * extracts IDs from link paths for objects missing 'id' field.
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded';
const FOLDERS_TO_PROCESS = ['deities', 'items', 'places'];

let totalFixes = 0;
let fixesByFolder = {};
let fixesByType = {
  stringToObject: 0,
  linkToId: 0
};

/**
 * Extract ID from a link path
 * Example: "../../greek/deities/zeus.html" -> "zeus"
 * Example: "/mythos/greek/deities/zeus.html" -> "zeus"
 */
function extractIdFromLink(link) {
  if (!link) return null;
  // Remove .html extension and get the last part of the path
  const cleanedLink = link.replace(/\.html$/, '');
  const parts = cleanedLink.split('/');
  const id = parts[parts.length - 1];
  return id && id !== '' ? id : null;
}

/**
 * Clean up a name that may have emoji and whitespace formatting issues
 * Example: "🦅\n                Jupiter\n                Roman" -> "Jupiter"
 */
function cleanName(name) {
  if (!name || typeof name !== 'string') return name;
  // Remove emojis at the start
  let cleaned = name.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+\s*/gu, '');
  // Remove newlines and excessive whitespace
  cleaned = cleaned.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  // If the name contains mythology info at the end (e.g., "Jupiter Roman"), extract just the name
  const parts = cleaned.split(' ');
  if (parts.length >= 2) {
    // Check if last part is a mythology name
    const mythologies = ['Greek', 'Roman', 'Norse', 'Egyptian', 'Hindu', 'Celtic', 'Mesopotamian', 'Japanese', 'Chinese', 'Slavic', 'Aztec', 'Maya', 'Persian', 'Zoroastrian'];
    if (mythologies.includes(parts[parts.length - 1])) {
      return parts.slice(0, -1).join(' ');
    }
  }
  return cleaned;
}

/**
 * Convert a string reference to an entityReference object
 */
function stringToEntityRef(str) {
  const id = str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: id,
    name: str,
    relationship: 'related'
  };
}

/**
 * Fix an entity reference object that has 'link' but no 'id'
 */
function fixEntityRefWithLink(ref) {
  const fixed = { ...ref };

  // Extract ID from link if missing
  if (!fixed.id && fixed.link) {
    fixed.id = extractIdFromLink(fixed.link);
  }

  // Clean up name if it has formatting issues
  if (fixed.name) {
    const cleanedName = cleanName(fixed.name);
    if (cleanedName !== fixed.name) {
      fixed.name = cleanedName;
    }
  }

  // Add relationship if missing
  if (!fixed.relationship) {
    fixed.relationship = 'related';
  }

  // Remove link property (we're using id now)
  if (fixed.link) {
    delete fixed.link;
  }

  return fixed;
}

/**
 * Process an array of entity references
 */
function processEntityRefArray(arr, fieldName) {
  if (!Array.isArray(arr)) return { arr, fixes: 0 };

  let fixes = 0;
  const processed = arr.map(item => {
    // If it's a string, convert to object
    if (typeof item === 'string') {
      fixes++;
      fixesByType.stringToObject++;
      return stringToEntityRef(item);
    }

    // If it's an object with 'link' but no 'id', fix it
    if (typeof item === 'object' && item !== null) {
      if (item.link && !item.id) {
        fixes++;
        fixesByType.linkToId++;
        return fixEntityRefWithLink(item);
      }
      // Also clean up names with formatting issues
      if (item.name && item.name.includes('\n')) {
        fixes++;
        return fixEntityRefWithLink(item);
      }
    }

    return item;
  });

  return { arr: processed, fixes };
}

/**
 * Process the relatedEntities field
 */
function processRelatedEntities(relatedEntities) {
  if (!relatedEntities) return { relatedEntities, fixes: 0 };

  let totalFixes = 0;

  // If relatedEntities is an array (flat structure)
  if (Array.isArray(relatedEntities)) {
    const { arr, fixes } = processEntityRefArray(relatedEntities, 'relatedEntities');
    return { relatedEntities: arr, fixes };
  }

  // If relatedEntities is an object with category arrays
  if (typeof relatedEntities === 'object') {
    const processed = {};
    for (const [category, refs] of Object.entries(relatedEntities)) {
      if (Array.isArray(refs)) {
        const { arr, fixes } = processEntityRefArray(refs, `relatedEntities.${category}`);
        processed[category] = arr;
        totalFixes += fixes;
      } else {
        processed[category] = refs;
      }
    }
    return { relatedEntities: processed, fixes: totalFixes };
  }

  return { relatedEntities, fixes: 0 };
}

/**
 * Process the family field
 */
function processFamily(family) {
  if (!family || typeof family !== 'object') return { family, fixes: 0 };

  let totalFixes = 0;
  const processed = { ...family };

  const arrayFields = ['parents', 'children', 'siblings', 'consorts'];

  for (const field of arrayFields) {
    if (Array.isArray(processed[field])) {
      const { arr, fixes } = processEntityRefArray(processed[field], `family.${field}`);
      processed[field] = arr;
      totalFixes += fixes;
    }
  }

  return { family: processed, fixes: totalFixes };
}

/**
 * Process allies and enemies arrays
 */
function processAlliesEnemies(data) {
  let totalFixes = 0;
  const processed = { ...data };

  if (Array.isArray(processed.allies)) {
    const { arr, fixes } = processEntityRefArray(processed.allies, 'allies');
    processed.allies = arr;
    totalFixes += fixes;
  }

  if (Array.isArray(processed.enemies)) {
    const { arr, fixes } = processEntityRefArray(processed.enemies, 'enemies');
    processed.enemies = arr;
    totalFixes += fixes;
  }

  return { data: processed, fixes: totalFixes };
}

/**
 * Process a single entity object
 */
function processEntity(data) {
  let assetFixes = 0;
  let modified = { ...data };

  // Process relatedEntities
  if (modified.relatedEntities) {
    const { relatedEntities, fixes } = processRelatedEntities(modified.relatedEntities);
    modified.relatedEntities = relatedEntities;
    assetFixes += fixes;
  }

  // Process family
  if (modified.family) {
    const { family, fixes } = processFamily(modified.family);
    modified.family = family;
    assetFixes += fixes;
  }

  // Process allies and enemies
  const { data: processedData, fixes: aeFixs } = processAlliesEnemies(modified);
  modified = processedData;
  assetFixes += aeFixs;

  return { entity: modified, fixes: assetFixes };
}

/**
 * Process a single asset file (handles both single entities and arrays)
 */
function processAssetFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    let assetFixes = 0;
    let modified;

    // Check if the file contains an array of entities (like greek.json, norse.json)
    if (Array.isArray(data)) {
      modified = data.map(entity => {
        if (typeof entity === 'object' && entity !== null) {
          const { entity: processedEntity, fixes } = processEntity(entity);
          assetFixes += fixes;
          return processedEntity;
        }
        return entity;
      });
    } else {
      // Single entity file
      const { entity, fixes } = processEntity(data);
      modified = entity;
      assetFixes = fixes;
    }

    // If fixes were made, write the file back
    if (assetFixes > 0) {
      fs.writeFileSync(filePath, JSON.stringify(modified, null, 2), 'utf8');
    }

    return assetFixes;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Process all files in a folder
 */
function processFolder(folderName) {
  const folderPath = path.join(BASE_DIR, folderName);

  if (!fs.existsSync(folderPath)) {
    console.log(`Folder not found: ${folderPath}`);
    return 0;
  }

  let folderFixes = 0;
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    // Only process JSON files (include _all.json but not other underscore files like _download_report.json)
    if (!file.endsWith('.json')) continue;
    if (file.startsWith('_') && file !== '_all.json') continue;

    const filePath = path.join(folderPath, file);
    const fixes = processAssetFile(filePath);
    folderFixes += fixes;

    if (fixes > 0) {
      console.log(`  Fixed ${fixes} issue(s) in ${file}`);
    }
  }

  return folderFixes;
}

/**
 * Main execution
 */
function main() {
  console.log('Entity Reference Format Fixer');
  console.log('=============================\n');

  for (const folder of FOLDERS_TO_PROCESS) {
    console.log(`Processing ${folder}...`);
    const fixes = processFolder(folder);
    fixesByFolder[folder] = fixes;
    totalFixes += fixes;
    console.log(`  Total: ${fixes} fixes in ${folder}\n`);
  }

  console.log('\n=============================');
  console.log('Summary:');
  console.log('=============================');
  for (const [folder, fixes] of Object.entries(fixesByFolder)) {
    console.log(`  ${folder}: ${fixes} fixes`);
  }
  console.log('-----------------------------');
  console.log(`  String to Object: ${fixesByType.stringToObject}`);
  console.log(`  Link to ID: ${fixesByType.linkToId}`);
  console.log('-----------------------------');
  console.log(`  TOTAL: ${totalFixes} fixes`);
}

main();

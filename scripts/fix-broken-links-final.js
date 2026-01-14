/**
 * Final Broken Links Cleanup
 * Handles remaining edge cases including spaces, capitals with commas, etc.
 */

const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Specific IDs to remove (clearly malformed)
const SPECIFIC_REMOVE = new Set([
  'Physicians, healers, Ayurvedic practitioners',
  'contrasting-with-his-heroic-vedic-portrayal',
  'None—as primordial deity she predates theEnneadand other divine generations',
  'antaeus-giant-wrestler-defeated-by-heracles',
  'set-defender-against-apep-during-night-journey',
  'ganesha-elephant-headed-remover-of-obstacles',
  'devoted-sin-worshipper-servants-astrologers',
  'falsehood-through-wisdom-rather-than-combat',
  'Autolycus, blessed thief favored by Hermes',
  'Angels including Uriel, Raphael, Michael, Gabriel',
  'Twenty-four elders who worship at seal openings',
  'Cerberus, Hydra, Orthrus, Sphinx, Nemean Lion',
  'ali-ibn-abi-talib-cousin-of-prophet-muhammad',
  'religious-communities-jewish-christian-muslim',
]);

// Patterns
const BAD_PATTERNS = [
  /^[A-Z].*,\s/, // Starts with capital, contains comma + space
  /—/, // Contains em-dash
  /\s{2,}/, // Multiple spaces
  /^None/, // Starts with None
  /^Angels/, // Starts with Angels
  /^Twenty/, // Starts with Twenty
  /^Cerberus,/, // List of creatures
  /-worshipper-/, /-wrestler-/, /-elephant-headed-/,
  /-defender-against-/, /-remover-of-/,
  /-favored-by-/, /-rather-than-/,
  /-cousin-of-prophet-/, /-communities-/,
];

function isBadId(id) {
  if (!id || typeof id !== 'string') return false;
  
  if (SPECIFIC_REMOVE.has(id)) return true;
  
  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(id)) return true;
  }
  
  // Contains regular space (not hyphen)
  if (/[A-Z].*\s/.test(id)) return true;
  
  return false;
}

function cleanArray(arr, stats) {
  if (!Array.isArray(arr)) return arr;
  
  return arr.filter(item => {
    const id = typeof item === 'string' ? item : item?.id;
    if (id && isBadId(id)) {
      stats.removed++;
      stats.removedIds.add(id);
      return false;
    }
    return true;
  });
}

function cleanObject(obj, stats) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return cleanArray(obj, stats);
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      const cleanedArr = cleanArray(value, stats);
      if (cleanedArr.length > 0) {
        cleaned[key] = cleanedArr;
      }
    } else if (value && typeof value === 'object') {
      const cleanedObj = cleanObject(value, stats);
      if (Object.keys(cleanedObj).length > 0) {
        cleaned[key] = cleanedObj;
      }
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function processFile(filePath, stats) {
  const content = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(content);
  const fileStats = { removed: 0, removedIds: new Set() };
  
  const originalStr = JSON.stringify(data);
  
  if (data.relatedEntities) {
    data.relatedEntities = cleanObject(data.relatedEntities, fileStats);
  }
  if (data.relationships) {
    data.relationships = cleanObject(data.relationships, fileStats);
  }
  if (data.family) {
    data.family = cleanObject(data.family, fileStats);
  }
  
  if (JSON.stringify(data) !== originalStr) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    stats.filesModified++;
    stats.totalRemoved += fileStats.removed;
    for (const id of fileStats.removedIds) stats.removedIds.add(id);
    return true;
  }
  return false;
}

async function main() {
  console.log('FINAL BROKEN LINKS CLEANUP\n');
  
  const stats = { filesProcessed: 0, filesModified: 0, totalRemoved: 0, removedIds: new Set() };
  
  const categories = await fs.readdir(ASSETS_DIR);
  for (const category of categories) {
    const categoryPath = path.join(ASSETS_DIR, category);
    const stat = await fs.stat(categoryPath);
    if (!stat.isDirectory()) continue;
    
    const files = await fs.readdir(categoryPath);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        await processFile(path.join(categoryPath, file), stats);
        stats.filesProcessed++;
      } catch (err) {
        console.log('Error: ' + file);
      }
    }
  }
  
  console.log('Files processed: ' + stats.filesProcessed);
  console.log('Files modified: ' + stats.filesModified);
  console.log('References removed: ' + stats.totalRemoved);
  console.log('\nRemoved IDs:');
  [...stats.removedIds].forEach(id => console.log('  - ' + id));
}

main().catch(console.error);

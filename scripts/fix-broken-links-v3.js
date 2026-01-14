/**
 * Fix Broken Links v3
 * More aggressive cleanup of malformed and garbage references
 */

const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Patterns indicating malformed IDs
const MALFORMED_PATTERNS = [
  /-lord-/, /-goddess-of-/, /-god-of-/, /-sent-to-/,
  /-some-traditions$/, /-strength-kami$/, /^s-opposite-/,
  /-who-/, /-whose-/, /-those-who-/, /-though-he-/,
  /^the-accumulated-/, /^the-asuras-/, /-defines-/,
  /-challenge-/, /-threatens-/, /^in-some-/, /-in-some-/,
  /-performed-/, /-conceived-/, /-combats-/, /-contrasting-/,
  /-dismembered-/, /-devoted-/, /-rivals?-/, /-siblings-/,
  /-opposed-/, /-aided-/, /-allied-/, /-enemies-/,
  /^none[—-]/, /-predates-/, /^possibly-/,
  /physicians/i, /healers/i, /practitioners/i,
];

// Known garbage patterns
const GARBAGE_PATTERNS = [
  /^of /, /\)$/, /^\(/, /^-/, /-$/, /^[A-Z].*—/, // Starts with "of ", ends with ), etc
  /^places$/, /^items$/, /^deities$/, /^heroes$/,
  /^creatures$/, /^rituals$/, /^texts$/, /^symbols$/,
];

// Generic terms that aren't actual entities
const GENERIC_TERMS = new Set([
  'pilgrims', 'spiritual-beings', 'devotees', 'divine-guardian',
  'protective-spirit', 'html', 'mythos', 'etc', 'unknown',
  'general', 'various', 'multiple', 'others', 'followers',
  'worshippers', 'believers', 'practitioners', 'places',
  'items', 'deities', 'heroes', 'creatures',
]);

function isMalformedId(id) {
  if (!id || typeof id !== 'string') return true;
  
  const idLower = id.toLowerCase();
  
  for (const pattern of MALFORMED_PATTERNS) {
    if (pattern.test(id) || pattern.test(idLower)) return true;
  }
  
  for (const pattern of GARBAGE_PATTERNS) {
    if (pattern.test(id)) return true;
  }
  
  if (GENERIC_TERMS.has(idLower)) return true;
  if (id.length > 50) return true;
  if (/[(),']/.test(id)) return true;
  if (/\s/.test(id)) return true; // Contains spaces
  
  return false;
}

function cleanArray(arr, stats) {
  if (!Array.isArray(arr)) return arr;
  
  const cleaned = [];
  for (const item of arr) {
    const id = typeof item === 'string' ? item : item?.id;
    
    if (!id) {
      cleaned.push(item);
      continue;
    }
    
    if (isMalformedId(id)) {
      stats.removed++;
      stats.removedIds.add(id);
    } else {
      cleaned.push(item);
    }
  }
  return cleaned;
}

function cleanValue(val, stats) {
  if (typeof val === 'string' && isMalformedId(val)) {
    stats.removed++;
    stats.removedIds.add(val);
    return null;
  }
  return val;
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
    } else if (typeof value === 'string' && ['mother', 'father'].includes(key)) {
      // Special handling for mother/father fields that might have garbage
      const cleanedVal = cleanValue(value, stats);
      if (cleanedVal) cleaned[key] = cleanedVal;
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
  
  const newStr = JSON.stringify(data);
  
  if (newStr !== originalStr) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    stats.filesModified++;
    stats.totalRemoved += fileStats.removed;
    for (const id of fileStats.removedIds) {
      stats.removedIds.add(id);
    }
    return true;
  }
  
  return false;
}

async function main() {
  console.log('FIX BROKEN LINKS v3 - Aggressive cleanup\n');
  
  const stats = {
    filesProcessed: 0,
    filesModified: 0,
    totalRemoved: 0,
    removedIds: new Set()
  };
  
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
        console.log('Error: ' + file + ' - ' + err.message);
      }
    }
  }
  
  console.log('Files processed: ' + stats.filesProcessed);
  console.log('Files modified: ' + stats.filesModified);
  console.log('References removed: ' + stats.totalRemoved);
  console.log('Unique IDs removed: ' + stats.removedIds.size);
  
  if (stats.removedIds.size > 0) {
    console.log('\nSample removed IDs:');
    [...stats.removedIds].sort().slice(0, 30).forEach(id => console.log('  - ' + id));
  }
}

main().catch(console.error);

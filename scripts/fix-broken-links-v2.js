/**
 * Fix Broken Links v2
 * 
 * Removes malformed entity references and generic non-entity terms
 * from relatedEntities and relationships fields
 */

const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Patterns indicating malformed IDs (descriptions turned into IDs)
const MALFORMED_PATTERNS = [
  /-lord-/,
  /-goddess-of-/,
  /-god-of-/,
  /-sent-to-/,
  /-some-traditions$/,
  /-strength-kami$/,
  /^s-opposite-/,
  /-who-/,
  /-whose-/,
  /-those-who-/,
  /^the-accumulated-/,
  /^the-asuras-/,
  /physicians,-healers/i,
  /-defines-/,
  /-challenge-/,
  /-threatens-/,
  /^in-some-/,
  /-in-some-traditions$/,
];

// Generic terms that aren't actual entities
const GENERIC_TERMS = new Set([
  'pilgrims', 'spiritual-beings', 'devotees', 'divine-guardian',
  'protective-spirit', 'html', 'mythos', 'etc', 'of gods)',
  'unknown', 'general', 'various', 'multiple', 'others',
  'followers', 'worshippers', 'believers', 'practitioners',
]);

// Known valid entities that might look suspicious
const VALID_ENTITIES = new Set([
  'yhwh', 'aaron', 'charon', 'dharma', 'qi', 'wyrd', 'xian',
]);

function isMalformedId(id) {
  if (!id || typeof id !== 'string') return true;
  
  // Check against malformed patterns
  for (const pattern of MALFORMED_PATTERNS) {
    if (pattern.test(id)) return true;
  }
  
  // Check if it's a generic term
  if (GENERIC_TERMS.has(id.toLowerCase())) return true;
  
  // Very long IDs are likely malformed descriptions
  if (id.length > 50) return true;
  
  // IDs with unusual characters
  if (/[(),']/.test(id)) return true;
  
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

function cleanObject(obj, stats) {
  if (!obj || typeof obj !== 'object') return obj;
  
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
  
  let modified = false;
  
  // Clean relatedEntities
  if (data.relatedEntities) {
    const before = JSON.stringify(data.relatedEntities);
    data.relatedEntities = cleanObject(data.relatedEntities, fileStats);
    if (JSON.stringify(data.relatedEntities) !== before) {
      modified = true;
    }
  }
  
  // Clean relationships
  if (data.relationships) {
    const before = JSON.stringify(data.relationships);
    data.relationships = cleanObject(data.relationships, fileStats);
    if (JSON.stringify(data.relationships) !== before) {
      modified = true;
    }
  }
  
  // Clean family fields
  for (const field of ['parents', 'children', 'siblings', 'consorts', 'enemies']) {
    if (data.family && data.family[field]) {
      const before = JSON.stringify(data.family[field]);
      data.family[field] = cleanArray(data.family[field], fileStats);
      if (JSON.stringify(data.family[field]) !== before) {
        modified = true;
      }
    }
  }
  
  if (modified) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    stats.filesModified++;
    stats.totalRemoved += fileStats.removed;
    for (const id of fileStats.removedIds) {
      stats.removedIds.add(id);
    }
  }
  
  return modified;
}

async function main() {
  console.log('='.repeat(60));
  console.log('FIX BROKEN LINKS v2');
  console.log('='.repeat(60));
  console.log('\nThis will remove malformed and generic entity references.\n');
  
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
      
      const filePath = path.join(categoryPath, file);
      try {
        await processFile(filePath, stats);
        stats.filesProcessed++;
      } catch (err) {
        console.log('  Error processing ' + file + ': ' + err.message);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('Files processed: ' + stats.filesProcessed);
  console.log('Files modified: ' + stats.filesModified);
  console.log('References removed: ' + stats.totalRemoved);
  console.log('Unique malformed IDs removed: ' + stats.removedIds.size);
  
  if (stats.removedIds.size > 0 && stats.removedIds.size <= 100) {
    console.log('\nRemoved IDs:');
    for (const id of [...stats.removedIds].sort().slice(0, 50)) {
      console.log('  - ' + id);
    }
    if (stats.removedIds.size > 50) {
      console.log('  ... and ' + (stats.removedIds.size - 50) + ' more');
    }
  }
}

main().catch(console.error);

const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

const BAD_IDS = new Set([
  'Physicians, healers, Ayurvedic practitioners',
  'None—as primordial deity she predates theEnneadand other divine generations',
  'Autolycus, blessed thief favored by Hermes',
  'Angels including Uriel, Raphael, Michael, Gabriel',
  'Twenty-four elders who worship at seal openings',
  'Cerberus, Hydra, Orthrus, Sphinx, Nemean Lion',
]);

function cleanArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(item => {
    const id = typeof item === 'string' ? item : item?.id;
    return !id || !BAD_IDS.has(id);
  });
}

function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return cleanArray(obj);
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      const c = cleanArray(value);
      if (c.length > 0) cleaned[key] = c;
    } else if (value && typeof value === 'object') {
      const c = cleanObject(value);
      if (Object.keys(c).length > 0) cleaned[key] = c;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function main() {
  let modified = 0;
  const categories = await fs.readdir(ASSETS_DIR);
  
  for (const category of categories) {
    const catPath = path.join(ASSETS_DIR, category);
    const stat = await fs.stat(catPath);
    if (!stat.isDirectory()) continue;
    
    const files = await fs.readdir(catPath);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(catPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      const orig = JSON.stringify(data);
      
      if (data.relatedEntities) data.relatedEntities = cleanObject(data.relatedEntities);
      if (data.relationships) data.relationships = cleanObject(data.relationships);
      if (data.family) data.family = cleanObject(data.family);
      
      if (JSON.stringify(data) !== orig) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        modified++;
        console.log('Fixed: ' + file);
      }
    }
  }
  console.log('\nTotal files modified: ' + modified);
}

main().catch(console.error);

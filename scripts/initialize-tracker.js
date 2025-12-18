/**
 * Migration Tracker Initialization Script
 * Parses CONTENT_INVENTORY.csv and creates MIGRATION_TRACKER.json
 */

const fs = require('fs');
const path = require('path');

// Read the inventory CSV
const inventoryPath = path.join(__dirname, '..', 'CONTENT_INVENTORY.csv');
const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');

// Parse CSV
const lines = inventoryContent.split('\n');
const headers = lines[0].split(',');

// Initialize tracking structure
const tracker = {
  totalFiles: 0,
  stages: {
    extracted: 0,
    validated: 0,
    uploaded: 0,
    converted: 0,
    tested: 0,
    deployed: 0
  },
  byMythology: {},
  byEntityType: {},
  files: [],
  startTime: new Date().toISOString(),
  lastUpdate: new Date().toISOString()
};

// Process each file
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Parse CSV line (handle quoted values)
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());

  const filePath = values[0];
  const entityType = values[1];
  const entityName = values[2];
  const mythology = values[3];

  // Skip template and special files
  if (!filePath || filePath.includes('template') || filePath.includes('index.html')) {
    continue;
  }

  // Extract entity ID from path
  const pathParts = filePath.split('/');
  const fileName = pathParts[pathParts.length - 1].replace('.html', '');
  const entityId = fileName;

  // Add file to tracker
  const fileEntry = {
    path: filePath,
    entity: entityId,
    entityName: entityName,
    mythology: mythology,
    type: entityType,
    stages: {
      extracted: false,
      validated: false,
      uploaded: false,
      converted: false,
      tested: false,
      deployed: false
    },
    issues: []
  };

  tracker.files.push(fileEntry);
  tracker.totalFiles++;

  // Update mythology stats
  if (!tracker.byMythology[mythology]) {
    tracker.byMythology[mythology] = {
      total: 0,
      extracted: 0,
      validated: 0,
      uploaded: 0,
      converted: 0,
      tested: 0,
      deployed: 0
    };
  }
  tracker.byMythology[mythology].total++;

  // Update entity type stats
  if (!tracker.byEntityType[entityType]) {
    tracker.byEntityType[entityType] = {
      total: 0,
      extracted: 0,
      validated: 0,
      uploaded: 0,
      converted: 0,
      tested: 0,
      deployed: 0
    };
  }
  tracker.byEntityType[entityType].total++;
}

// Write tracker JSON
const trackerPath = path.join(__dirname, '..', 'MIGRATION_TRACKER.json');
fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));

console.log(`Migration tracker initialized with ${tracker.totalFiles} files`);
console.log(`Mythologies: ${Object.keys(tracker.byMythology).length}`);
console.log(`Entity types: ${Object.keys(tracker.byEntityType).length}`);
console.log('Tracker saved to MIGRATION_TRACKER.json');

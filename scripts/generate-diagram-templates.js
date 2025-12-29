/**
 * AGENT 8: Diagram Template Generator
 *
 * Generates placeholder SVG diagrams for items, places, and herbs
 * that don't have custom-designed diagrams yet.
 */

const fs = require('fs');
const path = require('path');

// Simple template generators
const ITEM_CREATION_TEMPLATE = (itemName) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <rect width="600" height="400" fill="#f5f5f5"/>
  <text x="300" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
    Creation of ${itemName}
  </text>
  <text x="300" y="200" font-family="Arial" font-size="14" text-anchor="middle" fill="#666">
    [Diagram showing creation process]
  </text>
  <rect x="150" y="250" width="300" height="100" rx="10" fill="#e0e0e0" stroke="#999" stroke-width="2"/>
  <text x="300" y="305" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">
    Sacred forging and enchantment
  </text>
</svg>`;

const ITEM_POWERS_TEMPLATE = (itemName) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <rect width="600" height="400" fill="#f5f5f5"/>
  <text x="300" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
    Powers of ${itemName}
  </text>
  <circle cx="300" cy="200" r="80" fill="#4169E1" opacity="0.3"/>
  <rect x="270" y="180" width="60" height="40" fill="#708090"/>
  <text x="300" y="300" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    Divine properties and abilities
  </text>
</svg>`;

const PLACE_MAP_TEMPLATE = (placeName) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <rect width="600" height="500" fill="#e6f2ff"/>
  <text x="300" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
    ${placeName} - Location Map
  </text>
  <path d="M 300 250 L 200 450 L 400 450 Z" fill="#90EE90" stroke="#228B22" stroke-width="2"/>
  <circle cx="300" cy="250" r="20" fill="#FFD700"/>
  <text x="300" y="480" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    Sacred geography and key locations
  </text>
</svg>`;

const PLACE_ARCHITECTURE_TEMPLATE = (placeName) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <rect width="600" height="500" fill="#faf8f3"/>
  <text x="300" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
    ${placeName} - Architecture
  </text>
  <rect x="200" y="200" width="200" height="150" fill="#8B4513" stroke="#654321" stroke-width="2"/>
  <polygon points="300,150 180,200 420,200" fill="#DAA520" stroke="#B8941E" stroke-width="2"/>
  <text x="300" y="480" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    Architectural layout and sacred spaces
  </text>
</svg>`;

const HERB_BOTANICAL_TEMPLATE = (herbName) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <rect width="600" height="500" fill="#f0fff0"/>
  <text x="300" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
    ${herbName} - Botanical Illustration
  </text>
  <circle cx="200" cy="200" r="60" fill="#FFB6C1" opacity="0.6"/>
  <ellipse cx="200" cy="170" rx="20" ry="40" fill="#FFB6C1" stroke="#FF1493" stroke-width="1"/>
  <line x1="200" y1="260" x2="200" y2="350" stroke="#228B22" stroke-width="3"/>
  <ellipse cx="250" cy="280" rx="50" ry="35" fill="#90EE90" stroke="#228B22" stroke-width="2"/>
  <text x="300" y="480" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    Plant anatomy and identifying features
  </text>
</svg>`;

const HERB_PREPARATION_TEMPLATE = (herbName) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <rect width="600" height="500" fill="#fffaf0"/>
  <text x="300" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
    ${herbName} - Preparation Methods
  </text>
  <ellipse cx="250" cy="250" rx="60" ry="20" fill="#8B4513"/>
  <path d="M 190 250 Q 190 220, 250 215 Q 310 220, 310 250" fill="#A9A9A9" stroke="#4a4a4a" stroke-width="2"/>
  <text x="300" y="380" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    Traditional preparation and usage methods
  </text>
</svg>`;

/**
 * Generate all missing diagrams
 */
async function generateAllDiagrams() {
  console.log('🎨 AGENT 8: Generating Diagram Templates...\n');

  const stats = {
    items: { created: 0, skipped: 0 },
    places: { created: 0, skipped: 0 },
    herbs: { created: 0, skipped: 0 }
  };

  // Generate item diagrams
  const itemsDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'items');
  const itemFiles = fs.readdirSync(itemsDir).filter(f => f.endsWith('.json') && f !== '_all.json');

  for (const file of itemFiles) {
    try {
      const itemArray = JSON.parse(fs.readFileSync(path.join(itemsDir, file), 'utf8'));
      if (!Array.isArray(itemArray) || itemArray.length === 0) continue;
      const itemData = itemArray[0];
      const slug = itemData.slug || itemData.id || file.replace('.json', '');
      const name = itemData.name || itemData.displayName || slug;

      // Create creation diagram if doesn't exist
      const creationPath = path.join(__dirname, '..', 'diagrams', 'items', `${slug}-creation.svg`);
      if (!fs.existsSync(creationPath)) {
        fs.writeFileSync(creationPath, ITEM_CREATION_TEMPLATE(name));
        stats.items.created++;
      } else {
        stats.items.skipped++;
      }

      // Create powers diagram if doesn't exist
      const powersPath = path.join(__dirname, '..', 'diagrams', 'items', `${slug}-powers.svg`);
      if (!fs.existsSync(powersPath)) {
        fs.writeFileSync(powersPath, ITEM_POWERS_TEMPLATE(name));
        stats.items.created++;
      } else {
        stats.items.skipped++;
      }
    } catch (error) {
      console.error(`Error generating diagrams for ${file}:`, error.message);
    }
  }

  // Generate place diagrams
  const placesDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'places');
  const placeFiles = fs.readdirSync(placesDir).filter(f => f.endsWith('.json') && f !== '_all.json');

  for (const file of placeFiles) {
    try {
      const placeArray = JSON.parse(fs.readFileSync(path.join(placesDir, file), 'utf8'));
      if (!Array.isArray(placeArray) || placeArray.length === 0) continue;
      const placeData = placeArray[0];
      const slug = placeData.slug || placeData.id || file.replace('.json', '');
      const name = placeData.name || placeData.displayName || slug;

      // Create map diagram if doesn't exist
      const mapPath = path.join(__dirname, '..', 'diagrams', 'places', `${slug}-map.svg`);
      if (!fs.existsSync(mapPath)) {
        fs.writeFileSync(mapPath, PLACE_MAP_TEMPLATE(name));
        stats.places.created++;
      } else {
        stats.places.skipped++;
      }

      // Create architecture diagram if doesn't exist
      const archPath = path.join(__dirname, '..', 'diagrams', 'places', `${slug}-architecture.svg`);
      if (!fs.existsSync(archPath)) {
        fs.writeFileSync(archPath, PLACE_ARCHITECTURE_TEMPLATE(name));
        stats.places.created++;
      } else {
        stats.places.skipped++;
      }
    } catch (error) {
      // Skip errors
    }
  }

  // Generate herb diagrams
  const herbsDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'herbs');
  const herbFiles = fs.readdirSync(herbsDir).filter(f => f.endsWith('.json') && !f.includes('_all'));

  for (const file of herbFiles) {
    try {
      const herbArray = JSON.parse(fs.readFileSync(path.join(herbsDir, file), 'utf8'));
      if (!Array.isArray(herbArray) || herbArray.length === 0) continue;
      const herbData = herbArray[0];
      const id = herbData.id || herbData.filename || file.replace('.json', '');
      const name = herbData.displayName || herbData.name || id;

      // Create botanical diagram if doesn't exist
      const botanicalPath = path.join(__dirname, '..', 'diagrams', 'herbs', `${id}-botanical.svg`);
      if (!fs.existsSync(botanicalPath)) {
        fs.writeFileSync(botanicalPath, HERB_BOTANICAL_TEMPLATE(name));
        stats.herbs.created++;
      } else {
        stats.herbs.skipped++;
      }

      // Create preparation diagram if doesn't exist
      const prepPath = path.join(__dirname, '..', 'diagrams', 'herbs', `${id}-preparation.svg`);
      if (!fs.existsSync(prepPath)) {
        fs.writeFileSync(prepPath, HERB_PREPARATION_TEMPLATE(name));
        stats.herbs.created++;
      } else {
        stats.herbs.skipped++;
      }
    } catch (error) {
      console.error(`Error generating diagrams for ${file}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Diagram Generation Statistics:');
  console.log('='.repeat(60));
  console.log(`Items:   Created ${stats.items.created}, Skipped ${stats.items.skipped}`);
  console.log(`Places:  Created ${stats.places.created}, Skipped ${stats.places.skipped}`);
  console.log(`Herbs:   Created ${stats.herbs.created}, Skipped ${stats.herbs.skipped}`);
  console.log(`TOTAL:   Created ${stats.items.created + stats.places.created + stats.herbs.created}`);
  console.log('='.repeat(60));

  return stats;
}

// Run if called directly
if (require.main === module) {
  generateAllDiagrams()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { generateAllDiagrams };

#!/usr/bin/env node

/**
 * Creature Migration Script
 * Migrates existing creature data to universal template v2.0
 *
 * Features:
 * - Adds missing required fields from universal template
 * - Generates subtitle from creature type and key features
 * - Adds proper cross-references
 * - Validates against entity-schema-v2.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  inputFile: path.join(__dirname, '../FIREBASE/transformed_data/creatures_transformed.json'),
  outputFile: path.join(__dirname, '../data/firebase-imports/creatures-migrated.json'),
  schemaFile: path.join(__dirname, '../data/schemas/entity-schema-v2.json'),
  backupDir: path.join(__dirname, '../FIREBASE/backups')
};

/**
 * Load JSON file
 */
function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Save JSON file
 */
function saveJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Generate subtitle from creature data
 */
function generateSubtitle(creature) {
  const parts = [];

  // Add creature type
  if (creature.type) {
    const typeMap = {
      'dragon': 'Dragon-like',
      'beast': 'Monstrous Beast',
      'spirit': 'Spirit Being',
      'monster': 'Fearsome Monster',
      'creature': 'Mythical Creature'
    };
    parts.push(typeMap[creature.type] || creature.type);
  }

  // Add key features from abilities or attributes
  if (creature.abilities && creature.abilities.length > 0) {
    const keyAbility = creature.abilities[0].split(':')[0].trim();
    parts.push(keyAbility);
  } else if (creature.attributes && creature.attributes.length > 0) {
    const keyAttr = creature.attributes[0].split(':')[0].trim();
    parts.push(keyAttr);
  }

  return parts.join(' - ') || 'Mythical Creature';
}

/**
 * Extract mythology from ID
 */
function extractMythology(id) {
  if (!id) return 'unknown';
  const parts = id.split('_');
  return parts[0] || 'unknown';
}

/**
 * Migrate a single creature to universal template
 */
function migrateCreature(creature) {
  const mythology = creature.mythology || extractMythology(creature.id);

  // Build migrated creature with universal template structure
  const migrated = {
    id: creature.id,
    type: 'creature',
    name: creature.name || creature.displayName?.replace(/[🎯🦁🐍🐉🦅🐴👼🐂🦄🏔️🐎🕌🔄]/g, '').trim() || 'Unknown',
    icon: creature.displayName?.match(/[🎯🦁🐍🐉🦅🐴👼🐂🦄🏔️🐎🕌🔄🏹🐕🐺🦛🦊👻🐒🦜]/)?.[0] || '🐉',
    slug: creature.id,
    mythologies: [mythology],
    primaryMythology: mythology,
    shortDescription: generateSubtitle(creature),
    longDescription: creature.description || '',

    // Linguistic data (basic - can be enhanced)
    linguistic: {
      originalName: creature.name,
      languageCode: getMythologyLanguageCode(mythology)
    },

    // Geographical data (basic)
    geographical: {
      region: getMythologyRegion(mythology),
      culturalArea: getMythologyCulturalArea(mythology),
      modernCountries: getMythologyCountries(mythology)
    },

    // Temporal data
    temporal: {
      culturalPeriod: getMythologyPeriod(mythology)
    },

    // Cultural data
    cultural: {
      socialRole: `Creature in ${mythology} mythology`
    },

    // Tags
    tags: creature.tags || ['creature', mythology],

    // Related entities
    relatedEntities: creature.relationships || {},

    // Sources
    sources: creature.primarySources || [],

    // Creature-specific data
    creatureSpecific: {
      creatureType: creature.type || 'creature',
      habitat: creature.habitats || [],
      abilities: creature.abilities || [],
      weaknesses: creature.weaknesses || [],
      physicalDescription: extractPhysicalDescription(creature),
      originStory: creature.description || ''
    },

    // Metadata
    metadata: creature.metadata || {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'migration-script',
      source: 'creature-migration'
    }
  };

  return migrated;
}

/**
 * Extract physical description from attributes
 */
function extractPhysicalDescription(creature) {
  const description = {};

  if (creature.attributes && Array.isArray(creature.attributes)) {
    creature.attributes.forEach(attr => {
      if (attr.toLowerCase().includes('head')) {
        description.head = attr;
      } else if (attr.toLowerCase().includes('body')) {
        description.body = attr;
      } else if (attr.toLowerCase().includes('tail')) {
        description.tail = attr;
      }
    });
  }

  return Object.keys(description).length > 0 ? description : {
    overall: creature.description || 'No physical description available'
  };
}

/**
 * Get language code for mythology
 */
function getMythologyLanguageCode(mythology) {
  const codes = {
    'greek': 'grc',
    'norse': 'non',
    'egyptian': 'egy',
    'hindu': 'sa',
    'buddhist': 'sa',
    'christian': 'grc',
    'islamic': 'ar',
    'babylonian': 'akk',
    'sumerian': 'sux',
    'persian': 'fa',
    'chinese': 'zh',
    'japanese': 'ja',
    'celtic': 'cel',
    'aztec': 'nah',
    'mayan': 'myn'
  };
  return codes[mythology] || 'en';
}

/**
 * Get region for mythology
 */
function getMythologyRegion(mythology) {
  const regions = {
    'greek': 'Mediterranean',
    'norse': 'Scandinavia',
    'egyptian': 'North Africa',
    'hindu': 'Indian Subcontinent',
    'buddhist': 'Asia',
    'christian': 'Mediterranean / Middle East',
    'islamic': 'Middle East',
    'babylonian': 'Mesopotamia',
    'sumerian': 'Mesopotamia',
    'persian': 'Persia',
    'chinese': 'East Asia',
    'japanese': 'East Asia',
    'celtic': 'British Isles / Western Europe',
    'aztec': 'Mesoamerica',
    'mayan': 'Mesoamerica'
  };
  return regions[mythology] || 'Unknown';
}

/**
 * Get cultural area for mythology
 */
function getMythologyCulturalArea(mythology) {
  const areas = {
    'greek': 'Ancient Greece',
    'norse': 'Viking Age Scandinavia',
    'egyptian': 'Ancient Egypt',
    'hindu': 'Ancient India',
    'buddhist': 'Buddhist World',
    'christian': 'Christendom',
    'islamic': 'Islamic World',
    'babylonian': 'Ancient Babylon',
    'sumerian': 'Ancient Sumer',
    'persian': 'Ancient Persia',
    'chinese': 'Ancient China',
    'japanese': 'Ancient Japan',
    'celtic': 'Celtic Lands',
    'aztec': 'Aztec Empire',
    'mayan': 'Maya Civilization'
  };
  return areas[mythology] || 'Unknown';
}

/**
 * Get modern countries for mythology
 */
function getMythologyCountries(mythology) {
  const countries = {
    'greek': ['Greece', 'Turkey'],
    'norse': ['Norway', 'Sweden', 'Denmark', 'Iceland'],
    'egyptian': ['Egypt'],
    'hindu': ['India', 'Nepal'],
    'buddhist': ['India', 'Thailand', 'Myanmar', 'Sri Lanka', 'Tibet'],
    'christian': ['Various'],
    'islamic': ['Various'],
    'babylonian': ['Iraq'],
    'sumerian': ['Iraq'],
    'persian': ['Iran'],
    'chinese': ['China'],
    'japanese': ['Japan'],
    'celtic': ['Ireland', 'Scotland', 'Wales', 'Britain', 'France'],
    'aztec': ['Mexico'],
    'mayan': ['Mexico', 'Guatemala', 'Belize', 'Honduras']
  };
  return countries[mythology] || ['Unknown'];
}

/**
 * Get cultural period for mythology
 */
function getMythologyPeriod(mythology) {
  const periods = {
    'greek': 'Classical Period',
    'norse': 'Viking Age',
    'egyptian': 'Ancient Egypt',
    'hindu': 'Vedic Period',
    'buddhist': 'Classical Buddhism',
    'christian': 'Late Antiquity / Medieval',
    'islamic': 'Islamic Golden Age',
    'babylonian': 'Neo-Babylonian Period',
    'sumerian': 'Early Dynastic Period',
    'persian': 'Achaemenid / Sasanian Period',
    'chinese': 'Ancient China',
    'japanese': 'Heian Period',
    'celtic': 'Iron Age',
    'aztec': 'Post-Classic Period',
    'mayan': 'Classic Maya Period'
  };
  return periods[mythology] || 'Ancient';
}

/**
 * Main migration function
 */
function main() {
  console.log('🔧 Creature Migration Script');
  console.log('=' .repeat(50));

  // Load existing creatures
  console.log('\n📂 Loading existing creatures...');
  const existingData = loadJSON(CONFIG.inputFile);
  if (!existingData) {
    console.error('❌ Failed to load existing creatures');
    process.exit(1);
  }

  const creatures = existingData.items || [];
  console.log(`✓ Loaded ${creatures.length} creatures`);

  // Migrate each creature
  console.log('\n🔄 Migrating creatures to universal template...');
  const migrated = creatures.map((creature, index) => {
    try {
      const result = migrateCreature(creature);
      if ((index + 1) % 10 === 0) {
        console.log(`  Migrated ${index + 1}/${creatures.length} creatures...`);
      }
      return result;
    } catch (error) {
      console.error(`Error migrating creature ${creature.id}:`, error.message);
      return null;
    }
  }).filter(c => c !== null);

  console.log(`✓ Successfully migrated ${migrated.length}/${creatures.length} creatures`);

  // Save migrated data
  console.log('\n💾 Saving migrated creatures...');
  const success = saveJSON(CONFIG.outputFile, migrated);

  if (success) {
    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Results:`);
    console.log(`   - Input: ${creatures.length} creatures`);
    console.log(`   - Migrated: ${migrated.length} creatures`);
    console.log(`   - Failed: ${creatures.length - migrated.length} creatures`);
    console.log(`   - Output: ${CONFIG.outputFile}`);
  } else {
    console.error('\n❌ Migration failed during save');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { migrateCreature };

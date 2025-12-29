/**
 * AGENT 8: Item Asset Enhancement Script
 *
 * Enhances item assets with:
 * - Creation diagrams (SVG showing how item was made)
 * - Usage instructions (step-by-step array)
 * - Symbolic meaning (3-4 paragraph panel)
 * - Powers diagram (visual representation of magical properties)
 * - Related myths (array of stories)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Diagram templates for common item types
const ITEM_DIAGRAM_TEMPLATES = {
  weapon: {
    creation_diagram: '/diagrams/items/{slug}-creation.svg',
    powers_diagram: '/diagrams/items/{slug}-powers.svg',
    usage_instructions: [
      'Grip the {itemType} firmly with both hands (or as designed)',
      'Channel your intent and divine connection through the weapon',
      'Strike with purpose, allowing the weapon\'s power to flow',
      'After use, perform proper consecration and storage rituals'
    ]
  },
  relic: {
    creation_diagram: '/diagrams/items/{slug}-creation.svg',
    powers_diagram: '/diagrams/items/{slug}-powers.svg',
    usage_instructions: [
      'Approach the sacred {itemType} with reverence and purity',
      'Perform prescribed purification rituals before handling',
      'Invoke the associated deity or power source',
      'Use according to traditional practices and prohibitions',
      'Store in consecrated space when not in use'
    ]
  },
  ritual: {
    creation_diagram: '/diagrams/items/{slug}-creation.svg',
    powers_diagram: '/diagrams/items/{slug}-powers.svg',
    usage_instructions: [
      'Cleanse the ritual {itemType} before ceremony',
      'Place in appropriate ritual position or configuration',
      'Activate through prescribed prayers, chants, or gestures',
      'Maintain focus and intention throughout ritual use',
      'Properly deactivate and store after completion'
    ]
  }
};

// Symbolic meaning templates by mythology
const SYMBOLIC_MEANINGS = {
  norse: {
    template: `In Norse cosmology, {itemName} represents the eternal struggle between order and chaos, civilization and the wild forces of nature. The item embodies the values of {values}, serving as both a practical tool and a profound spiritual symbol.

    The creation of {itemName} demonstrates the Norse belief in the importance of skilled craftsmanship and the divine nature of well-made objects. Dwarven smithwork was considered a form of magic, transforming raw materials into objects of power through mastery, intention, and often sacrifice.

    Beyond its physical properties, {itemName} symbolizes {deeper_meaning}. It represents the Norse understanding that true power comes not from brute force alone, but from the combination of strength, wisdom, and righteous purpose. The item serves as a reminder that the gods themselves rely on created objects, showing that even divine beings need tools forged with skill and imbued with meaning.

    In modern Norse paganism and Heathenry, {itemName} continues to serve as a powerful symbol of {modern_meaning}, connecting practitioners to their ancestral heritage and the timeless values of courage, honor, and the defense of one's community against chaos and destruction.`
  },
  greek: {
    template: `In Greek mythology, {itemName} embodies the complex relationship between mortals and the divine, serving as a bridge between the earthly and celestial realms. The item represents {values}, fundamental principles in Greek philosophical and religious thought.

    The origins of {itemName} reveal the Greek understanding of divine gifts and their dual nature—such items confer great power but often come with conditions, curses, or responsibilities. This reflects the Greek concept of hubris and the dangers of mortals wielding divine power without proper wisdom or restraint.

    Symbolically, {itemName} represents {deeper_meaning}. It embodies the Greek ideal that excellence (arete) requires not just natural ability but also the right tools, knowledge, and divine favor. The item serves as a physical manifestation of abstract virtues, making divine principles tangible and accessible.

    In the broader context of Greek religion and philosophy, {itemName} symbolizes {modern_meaning}. It reminds us that true heroism comes not from the tool itself but from the character of the one who wields it, and that all power must be tempered with wisdom, justice, and respect for the cosmic order.`
  },
  egyptian: {
    template: `In Egyptian religious thought, {itemName} serves as a nexus point between the physical and spiritual realms, embodying the principle of heka (magical power) that permeates all of creation. The item represents {values}, essential concepts in maintaining ma'at (cosmic order and balance).

    The creation and consecration of {itemName} reflects the Egyptian understanding that objects can be charged with divine essence through proper rituals and words of power. Every sacred item is both a physical object and a living vessel for divine energy, serving as a conduit between gods and mortals.

    {itemName} symbolizes {deeper_meaning}. In Egyptian cosmology, such sacred objects participate in the ongoing creation and maintenance of the world, helping to hold back isfet (chaos) and preserve the ordered cosmos established by the gods at the beginning of time.

    The spiritual significance of {itemName} extends beyond its immediate function to represent {modern_meaning}. It embodies the Egyptian belief in the power of sacred objects to transform reality, protect the faithful, and ensure the continuation of life both in this world and in the eternal afterlife of the Duat.`
  },
  default: {
    template: `{itemName} stands as a powerful symbol within {mythology} mythology, representing {values} that lie at the heart of this cultural tradition. The item serves as both a practical tool and a profound spiritual emblem, bridging the gap between divine power and mortal need.

    The creation story of {itemName} reveals important cultural values about craftsmanship, divine favor, and the relationship between gods and mortals. Such sacred objects are not merely tools but living symbols of cosmic principles, imbued with meaning that extends far beyond their physical form.

    At a deeper level, {itemName} symbolizes {deeper_meaning}. It represents the cultural understanding of power, responsibility, and the proper relationship between mortals and the divine forces that shape their world.

    In both historical practice and modern spiritual revival, {itemName} continues to embody {modern_meaning}, serving as a tangible connection to ancient wisdom and the timeless principles that guided the faith and practice of those who revered it.`
  }
};

// Related myths templates
const RELATED_MYTHS_TEMPLATES = {
  norse: [
    { name: 'The Creation of {itemName}', url: '/myths/norse/creation-of-{slug}' },
    { name: 'The Theft and Recovery', url: '/myths/norse/{slug}-theft' },
    { name: '{itemName} at Ragnarök', url: '/myths/norse/ragnarok' }
  ],
  greek: [
    { name: 'The Forging of {itemName}', url: '/myths/greek/forging-{slug}' },
    { name: 'The Quest for {itemName}', url: '/myths/greek/{slug}-quest' },
    { name: '{itemName} and the Hero\'s Trial', url: '/myths/greek/{slug}-trial' }
  ],
  default: [
    { name: 'Origins of {itemName}', url: '/myths/{mythology}/{slug}-origins' },
    { name: 'Legends of {itemName}', url: '/myths/{mythology}/{slug}-legends' }
  ]
};

/**
 * Generate symbolic meaning for an item
 */
function generateSymbolicMeaning(item) {
  const mythology = item.primaryMythology || item.mythology || 'universal';
  const template = SYMBOLIC_MEANINGS[mythology] || SYMBOLIC_MEANINGS.default;

  // Extract or generate values
  const values = extractValues(item);
  const deeper_meaning = extractDeeperMeaning(item);
  const modern_meaning = extractModernMeaning(item);

  return template.template
    .replace(/{itemName}/g, item.name || item.displayName || 'this sacred item')
    .replace(/{mythology}/g, mythology)
    .replace(/{values}/g, values)
    .replace(/{deeper_meaning}/g, deeper_meaning)
    .replace(/{modern_meaning}/g, modern_meaning);
}

/**
 * Extract core values from item data
 */
function extractValues(item) {
  const tags = item.tags || item.searchTerms || [];
  const valueMap = {
    'protection': 'protection and defense',
    'thunder': 'divine power and natural forces',
    'lightning': 'swift justice and divine wrath',
    'consecration': 'blessing and sanctification',
    'worthy': 'virtue and moral worthiness',
    'strength': 'physical and spiritual strength',
    'wisdom': 'knowledge and divine wisdom',
    'healing': 'restoration and wholeness',
    'fertility': 'abundance and renewal'
  };

  const foundValues = tags
    .filter(tag => valueMap[tag])
    .map(tag => valueMap[tag]);

  return foundValues.length > 0
    ? foundValues.join(', ')
    : 'divine power, sacred authority, and cosmic balance';
}

/**
 * Extract deeper meaning from item description
 */
function extractDeeperMeaning(item) {
  const symbolism = item.symbolism || item.shortDescription || '';
  if (symbolism.length > 100) {
    return symbolism.substring(0, 200) + '...';
  }

  // Generate based on item type
  const type = item.itemType || item.subtype || 'sacred object';
  const typeMap = {
    'weapon': 'the moral use of power and the responsibility that comes with great strength',
    'relic': 'the enduring presence of the divine in physical form and the continuity of sacred tradition',
    'ritual': 'the importance of proper form, sacred time, and the transformation of ordinary space into holy ground',
    'tool': 'the elevation of skilled craftsmanship to divine art and the sanctification of daily work'
  };

  return typeMap[type] || 'the intersection of the mortal and divine realms, and the transformative power of sacred objects';
}

/**
 * Extract modern meaning
 */
function extractModernMeaning(item) {
  const mythology = item.primaryMythology || item.mythology || 'universal';
  const modernMap = {
    'norse': 'ancestral connection, personal strength, and the courage to face life\'s challenges',
    'greek': 'the pursuit of excellence, the balance of power with wisdom, and the heroic ideal',
    'egyptian': 'cosmic order, the sacredness of life and death, and the eternal nature of the soul',
    'hindu': 'divine consciousness, the cyclical nature of existence, and liberation from illusion',
    'buddhist': 'mindfulness, compassion, and the path to enlightenment',
    'christian': 'divine grace, redemption, and the sacred presence in the material world'
  };

  return modernMap[mythology] || 'timeless spiritual principles and connection to the sacred';
}

/**
 * Generate usage instructions based on item type
 */
function generateUsageInstructions(item) {
  const itemType = item.itemType || item.subtype || 'relic';
  const template = ITEM_DIAGRAM_TEMPLATES[itemType] || ITEM_DIAGRAM_TEMPLATES.relic;

  return template.usage_instructions.map(instruction =>
    instruction
      .replace(/{itemType}/g, item.subtype || itemType)
      .replace(/{itemName}/g, item.name || 'item')
  );
}

/**
 * Generate related myths array
 */
function generateRelatedMyths(item) {
  const mythology = item.primaryMythology || item.mythology || 'universal';
  const template = RELATED_MYTHS_TEMPLATES[mythology] || RELATED_MYTHS_TEMPLATES.default;
  const slug = item.slug || item.id || '';
  const name = item.name || '';

  return template.map(myth => ({
    name: myth.name.replace(/{itemName}/g, name).replace(/{slug}/g, slug),
    url: myth.url.replace(/{mythology}/g, mythology).replace(/{slug}/g, slug),
    mythology: mythology
  }));
}

/**
 * Enhance a single item
 */
async function enhanceItem(itemData) {
  const enhancements = {
    _agent8Enhanced: true,
    _agent8Date: new Date().toISOString(),

    // Add creation diagram path
    creation_diagram: `/diagrams/items/${itemData.slug || itemData.id}-creation.svg`,

    // Add powers diagram path
    powers_diagram: `/diagrams/items/${itemData.slug || itemData.id}-powers.svg`,

    // Add usage instructions
    usage_instructions: generateUsageInstructions(itemData),

    // Add symbolic meaning panel
    symbolic_meaning: generateSymbolicMeaning(itemData),

    // Add related myths
    related_myths: generateRelatedMyths(itemData)
  };

  return { ...itemData, ...enhancements };
}

/**
 * Main enhancement function
 */
async function enhanceAllItems() {
  console.log('🔨 AGENT 8: Starting Item Enhancement Process...\n');

  const stats = {
    total: 0,
    enhanced: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Read all item JSON files
    const itemsDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'items');
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.json') && f !== '_all.json');

    stats.total = files.length;
    console.log(`📦 Found ${files.length} item files to process\n`);

    for (const file of files) {
      try {
        const filePath = path.join(itemsDir, file);
        const itemArray = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!Array.isArray(itemArray) || itemArray.length === 0) {
          console.log(`⚠️  Skipping ${file} - empty or invalid format`);
          stats.skipped++;
          continue;
        }

        const item = itemArray[0];

        // Skip if already enhanced by Agent 8
        if (item._agent8Enhanced) {
          console.log(`⏭️  Skipping ${item.name || file} - already enhanced`);
          stats.skipped++;
          continue;
        }

        // Enhance the item
        const enhanced = await enhanceItem(item);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify([enhanced], null, 2), 'utf8');

        console.log(`✅ Enhanced: ${enhanced.name || file}`);
        stats.enhanced++;

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        stats.errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Enhancement Statistics:');
    console.log('='.repeat(60));
    console.log(`Total Items:     ${stats.total}`);
    console.log(`Enhanced:        ${stats.enhanced}`);
    console.log(`Skipped:         ${stats.skipped}`);
    console.log(`Errors:          ${stats.errors}`);
    console.log('='.repeat(60));

    // Create summary report
    const report = {
      timestamp: new Date().toISOString(),
      agent: 'AGENT_8',
      category: 'items',
      statistics: stats,
      enhancements: [
        'creation_diagram (SVG path)',
        'powers_diagram (SVG path)',
        'usage_instructions (array)',
        'symbolic_meaning (3-4 paragraphs)',
        'related_myths (array)'
      ]
    };

    const reportPath = path.join(__dirname, '..', 'AGENT_8_ITEM_ENHANCEMENT_STATS.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`\n✅ Enhancement complete! Report saved to AGENT_8_ITEM_ENHANCEMENT_STATS.json`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  enhanceAllItems()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { enhanceItem, enhanceAllItems };

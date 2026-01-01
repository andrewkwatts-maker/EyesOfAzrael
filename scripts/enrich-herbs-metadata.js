/**
 * Enrichment Script for Sacred Herb Entities
 * Populates rich metadata for herb entities in Firebase
 *
 * Usage:
 *   node scripts/enrich-herbs-metadata.js
 *
 * This script reads herb data from firebase-assets-downloaded/herbs/
 * and enriches with standardized metadata fields.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at ${serviceAccountPath}`);
  console.error('Set FIREBASE_SERVICE_ACCOUNT environment variable or place serviceAccountKey.json in root');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://eyes-of-azrael.firebaseio.com'
});

const db = admin.firestore();

/**
 * Standard metadata template for herbs
 */
const HERB_METADATA_TEMPLATE = {
  properties: {
    magical: [],      // Magical/spiritual properties
    medicinal: [],    // Health benefits and uses
    spiritual: []     // Spiritual/ritual properties
  },
  preparations: {
    primary: [],      // Main preparation methods
    alternative: [],  // Alternative methods
    dosage: null      // Recommended dosage info
  },
  associations: {
    deities: [],      // Associated gods/goddesses
    concepts: [],     // Linked concepts/ideas
    elements: [],     // Elemental associations
    chakras: []       // Chakra associations
  },
  harvesting: {
    season: null,     // Best harvesting season
    method: null,     // How to harvest
    conditions: null  // Optimal growing conditions
  },
  dangers: {
    toxicity: null,   // Toxicity level
    warnings: [],     // Safety warnings
    contraindications: [] // Medical contraindications
  },
  substitutes: [
    // { name: string, reason: string, tradition: string }
  ],
  botanicalInfo: {
    scientificName: null,
    family: null,
    nativeRegion: null,
    commonNames: []
  },
  usesAcrossTraditions: {
    // tradition: [uses]
  }
};

/**
 * Herb-specific enrichment data
 * Maps herb IDs to enrichment metadata
 */
const HERB_ENRICHMENT_DATA = {
  // Buddhist Herbs
  buddhist_lotus: {
    properties: {
      magical: ['purity', 'spiritual awakening', 'enlightenment', 'rebirth', 'divine beauty'],
      medicinal: ['adaptogenic', 'sedative', 'astringent', 'nutritive', 'aphrodisiac'],
      spiritual: ["Buddha's seat", 'dharma symbol', 'emergence from suffering', 'unstained purity', 'chakra awakening']
    },
    preparations: {
      primary: [
        'Lotus seed tea: simmer dried seeds for calming nervousness',
        'Lotus root: slice and cook for nutrition and lung health',
        'Lotus petal tea: steep dried petals for aromatic calming tea',
        'Stamens: dry and use in tea blends for heart health',
        'Seed paste: grind seeds for mooncake filling (spiritual festivals)'
      ],
      alternative: [
        'Fresh lotus flowers as offerings',
        'Lotus leaf wraps for steaming food',
        'Lotus root juice for nosebleeds'
      ],
      dosage: '6-15g dried seeds, 3-10g dried leaf'
    },
    associations: {
      deities: ['gautama_buddha', 'avalokiteshvara', 'tara', 'manjushri', 'lakshmi'],
      concepts: ['enlightenment', 'purity', 'compassion', 'wisdom', 'rebirth'],
      elements: ['water', 'earth'],
      chakras: ['heart', 'crown']
    },
    harvesting: {
      season: 'Summer (July-September for flowers and seeds)',
      method: 'Hand-harvest fully opened flowers and mature seed pods',
      conditions: 'Shallow ponds, marshes, 6-18 inches water depth, full sun'
    },
    dangers: {
      toxicity: 'Non-toxic',
      warnings: ['Ensure clean water source if wild-harvesting'],
      contraindications: ['Generally safe as food and tea']
    },
    substitutes: [
      { name: 'Water Lily', reason: 'Similar aquatic flower, some shared properties', tradition: 'multiple' },
      { name: 'Lotus Seed', reason: 'Different part, concentrated properties', tradition: 'buddhist' }
    ],
    botanicalInfo: {
      scientificName: 'Nelumbo nucifera',
      family: 'Nelumbonaceae',
      nativeRegion: 'Asia (India to Japan, Australia)',
      commonNames: ['Sacred Lotus', 'Indian Lotus', 'Padma', 'Kamala']
    }
  },

  buddhist_sandalwood: {
    properties: {
      magical: ['purification', 'meditation', 'spiritual elevation', 'protection', 'tranquility'],
      medicinal: ['cooling', 'astringent', 'antiseptic', 'sedative', 'immune support'],
      spiritual: ['prayer', 'ritual', 'temple incense', 'moksha path', 'inner peace']
    },
    preparations: {
      primary: [
        'Incense: burn sandalwood chips or powder during meditation',
        'Paste (chandan): mix powder with water for tilaka marking',
        'Tea: steep small amounts for contemplative drink',
        'Powder: apply topically or add to bathing water',
        'Oil: diffuse essence during spiritual practice'
      ],
      alternative: [
        'Sandalwood beads for prayer counting',
        'Wood chips in spiritual spaces',
        'Paste for ceremonial marking'
      ],
      dosage: 'Incense: burn small amount (1-3g), tea: light infusion only'
    },
    associations: {
      deities: ['shiva', 'shakti', 'buddha', 'krishna'],
      concepts: ['meditation', 'purification', 'transcendence', 'grace'],
      elements: ['air', 'space'],
      chakras: ['third eye', 'crown']
    },
    harvesting: {
      season: 'Year-round (mature heartwood preferred)',
      method: 'Harvest mature heartwood, allow to age and cure',
      conditions: 'Tropical and subtropical climates'
    },
    dangers: {
      toxicity: 'Low toxicity',
      warnings: [
        'Use sparingly in teas',
        'Overuse may cause cooling imbalance',
        'Avoid large doses during kapha imbalance'
      ],
      contraindications: ['Pregnancy: use limited amount only']
    },
    substitutes: [
      { name: 'Agarwood', reason: 'Similar aromatic properties', tradition: 'multiple' },
      { name: 'Frankincense', reason: 'Alternative meditation incense', tradition: 'universal' },
      { name: 'Myrrh', reason: 'Similar purifying properties', tradition: 'universal' }
    ],
    botanicalInfo: {
      scientificName: 'Santalum album',
      family: 'Santalaceae',
      nativeRegion: 'India (endemic to Western Ghats)',
      commonNames: ['White Sandalwood', 'Indian Sandalwood', 'Chandan']
    }
  },

  buddhist_bodhi: {
    properties: {
      magical: ['enlightenment', 'wisdom', 'awakening', 'spiritual attainment', 'liberation'],
      medicinal: ['bitter tonic', 'digestive support', 'immune boost', 'cooling'],
      spiritual: ['Buddha\'s seat', 'meditation anchor', 'bodhi mind', 'sacred shelter']
    },
    preparations: {
      primary: [
        'Leaf infusion: steep fresh or dried leaves for meditation tea',
        'Meditation focus: sit beneath living tree for practice',
        'Prayer beads: seed pods used for counting',
        'Paste: bark powder mixed with water for preparation'
      ],
      alternative: [
        'Leaf decoration for altars',
        'Bark decoction for ceremonial purposes',
        'Seeds for mala beads'
      ],
      dosage: 'Tea: light infusion, 1-3 leaves per cup'
    },
    associations: {
      deities: ['gautama_buddha', 'tara', 'manjushri'],
      concepts: ['bodhi mind', 'enlightenment', 'awakening', 'compassion'],
      elements: ['earth', 'wood'],
      chakras: ['root', 'heart']
    },
    harvesting: {
      season: 'Spring (new leaves), autumn (mature leaves)',
      method: 'Respectfully gather fallen leaves, propagate from seeds',
      conditions: 'Temperate and tropical climates, requires reverent care'
    },
    dangers: {
      toxicity: 'Non-toxic',
      warnings: ['Use only sustainably sourced leaves', 'Respect sacred trees'],
      contraindications: ['Generally safe']
    },
    substitutes: [
      { name: 'Pipal Leaves', reason: 'Same tree species, alternative preparation', tradition: 'hindu' },
      { name: 'Bodhi Bark', reason: 'Different part, stronger properties', tradition: 'buddhist' }
    ],
    botanicalInfo: {
      scientificName: 'Ficus religiosa',
      family: 'Moraceae',
      nativeRegion: 'South Asia (India, Nepal)',
      commonNames: ['Sacred Fig', 'Peepul Tree', 'Pipal', 'Ashwattha']
    }
  },

  // Hindu Herbs
  hindu_tulsi: {
    properties: {
      magical: ['devotion', 'purity', 'divine protection', 'spiritual elevation', 'grace'],
      medicinal: ['adaptogen', 'immune support', 'respiratory health', 'stress reduction', 'anti-inflammatory'],
      spiritual: ['puja offerings', 'Vishnu worship', 'household shrine', 'daily worship']
    },
    preparations: {
      primary: [
        'Tulsi tea: 5-7 fresh leaves or 1 tsp dried, simmer 5-10 minutes',
        'Fresh leaves: chewed directly or added to water',
        'Dried leaves: added to daily worship rituals',
        'Tulsi-honey remedy: crush leaves, mix with honey and black pepper'
      ],
      alternative: [
        'Tulsi powder (churna): 1/4-1/2 tsp with warm water',
        'Fresh plant: worship and water daily',
        'Prasad: blessed leaves distributed after worship'
      ],
      dosage: '5-7 fresh leaves daily or 1-2 cups tea'
    },
    associations: {
      deities: ['vishnu', 'krishna', 'lakshmi', 'vrinda'],
      concepts: ['devotion', 'prosperity', 'protection', 'love'],
      elements: ['fire', 'water'],
      chakras: ['heart', 'throat']
    },
    harvesting: {
      season: 'Spring-Autumn (year-round in tropical climates)',
      method: 'Pinch leaves respectfully, leave main plant intact',
      conditions: 'Grows well in pots, full sun, well-drained soil'
    },
    dangers: {
      toxicity: 'Generally safe',
      warnings: [
        'Avoid large medicinal doses during pregnancy',
        'May have mild blood-thinning effect',
        'Consult practitioner for ongoing use'
      ],
      contraindications: ['Pregnancy: culinary amounts safe, medicinal doses should be limited']
    },
    substitutes: [
      { name: 'Basil', reason: 'Culinary and some medicinal properties', tradition: 'western' },
      { name: 'Mint', reason: 'Similar calming and digestive support', tradition: 'ayurvedic' }
    ],
    botanicalInfo: {
      scientificName: 'Ocimum sanctum (Ocimum tenuiflorum)',
      family: 'Lamiaceae',
      nativeRegion: 'Indian subcontinent',
      commonNames: ['Holy Basil', 'Sacred Basil', 'Vrinda', 'Lakshmi Plant']
    }
  },

  hindu_soma: {
    properties: {
      magical: ['immortality', 'divine ecstasy', 'cosmic consciousness', 'god-contact', 'eternal bliss'],
      medicinal: ['nourishing', 'rejuvenating', 'nerve tonic', 'brain support', 'longevity'],
      spiritual: ['Vedic ritual', 'sacrifice', 'immortality quest', 'god-descent']
    },
    preparations: {
      primary: [
        'Ritual beverage: prepared and consumed in sacred ceremonies only',
        'Pressed juice: extracted from identified soma plant',
        'Fermented drink: aged soma with specific timing'
      ],
      alternative: [],
      dosage: 'Ceremonial amounts in authorized Vedic rituals only'
    },
    associations: {
      deities: ['indra', 'agni', 'surya', 'soma_deity'],
      concepts: ['immortality', 'sacrifice', 'cosmic order', 'divine contact'],
      elements: ['fire', 'space'],
      chakras: ['crown', 'third eye']
    },
    harvesting: {
      season: 'Specific lunar and stellar timing (Vedic calendar)',
      method: 'Ritual extraction by initiated priests',
      conditions: 'Sacred mountain regions, specific geographical locations'
    },
    dangers: {
      toxicity: 'Unknown (identity disputed by scholars)',
      warnings: [
        'Preparation restricted to authorized Vedic practitioners',
        'Modern recreations experimental and potentially dangerous',
        'Historical identity remains scholarly debate'
      ],
      contraindications: ['Unauthorized use not recommended']
    },
    substitutes: [
      { name: 'Sarcostemma brevistigma', reason: 'Proposed scholarly identification', tradition: 'hindu' },
      { name: 'Ephedra', reason: 'Alternative scholarly identification', tradition: 'hindu' }
    ],
    botanicalInfo: {
      scientificName: 'Unknown (scholarly debate)',
      family: 'Unknown',
      nativeRegion: 'Indian subcontinent (Himalayas, sacred mountains)',
      commonNames: ['Soma', 'Amrita Plant', 'Nectar of Gods']
    }
  },

  // Islamic Herbs
  islamic_black_seed: {
    properties: {
      magical: ['blessing', 'protection', 'healing', 'prophetic wisdom', 'divine gift'],
      medicinal: ['immune support', 'anti-inflammatory', 'antimicrobial', 'respiratory support', 'digestive health'],
      spiritual: ['Sunnah practice', 'divine remedy', 'barakah', 'reliance on Allah']
    },
    preparations: {
      primary: [
        'Raw seeds: chew 3-7 seeds directly or grind and mix with honey',
        'Black seed oil: take 1 teaspoon daily, preferably on empty stomach',
        'With honey: mix crushed seeds with raw honey for enhanced healing',
        'Herbal tea: steep crushed seeds in hot water for 10-15 minutes'
      ],
      alternative: [
        'Topical: apply oil externally for skin conditions, joint pain',
        'With milk: mix powder in warm milk for respiratory issues',
        'Ruqyah enhancement: consume while reciting Quranic verses'
      ],
      dosage: '3-7 seeds daily or 1 teaspoon oil'
    },
    associations: {
      deities: ['allah'],
      concepts: ['healing', 'blessing', 'mercy', 'divine remedy', 'sunnah'],
      elements: ['earth', 'fire'],
      chakras: ['solar plexus', 'heart']
    },
    harvesting: {
      season: 'Summer (July-August for seed maturation)',
      method: 'Harvest mature seed pods when brown, dry thoroughly',
      conditions: 'Warm temperate climate, well-drained soil, full sun'
    },
    dangers: {
      toxicity: 'Low (very safe)',
      warnings: [
        'Generally recognized as safe by WHO and traditional medicine',
        'High doses may cause digestive upset',
        'Quality control important for commercial products'
      ],
      contraindications: ['Pregnancy: consult practitioner for large medicinal doses']
    },
    substitutes: [
      { name: 'Fennel Seeds', reason: 'Similar digestive and warming properties', tradition: 'islamic' },
      { name: 'Fenugreek', reason: 'Alternative immune and metabolic support', tradition: 'ayurvedic' }
    ],
    botanicalInfo: {
      scientificName: 'Nigella sativa',
      family: 'Ranunculaceae',
      nativeRegion: 'Mediterranean and South Asian regions',
      commonNames: ['Nigella', 'Kalonji', 'Habba al-Sawda', 'Black Cumin']
    }
  },

  // Greek Herbs
  greek_laurel: {
    properties: {
      magical: ['victory', 'prophecy', 'purification', 'protection', 'poetic inspiration'],
      medicinal: ['aromatic', 'digestive support', 'antiseptic', 'warming', 'stimulating'],
      spiritual: ['Apollo\'s plant', 'victory crown', 'temple decoration', 'divine favor']
    },
    preparations: {
      primary: [
        'Incense: burn leaves for purification and prophecy',
        'Tea: light infusion of fresh or dried leaves',
        'Crown: fresh branches woven into wreaths for honor',
        'Oil: infuse leaves in oil for ritual anointing'
      ],
      alternative: [
        'Fresh branches for temples and altars',
        'Chewing leaves for prophetic practices',
        'Smoke for cleansing spaces'
      ],
      dosage: 'Tea: 1-2 leaves per cup, burn sparingly'
    },
    associations: {
      deities: ['apollo', 'athena', 'heracles'],
      concepts: ['victory', 'prophecy', 'wisdom', 'protection'],
      elements: ['fire', 'air'],
      chakras: ['solar plexus', 'throat']
    },
    harvesting: {
      season: 'Spring-Summer (fresh leaves), autumn (mature leaves)',
      method: 'Pinch leaves gently, leave plant for regrowth',
      conditions: 'Mediterranean climate, well-drained soil, full sun'
    },
    dangers: {
      toxicity: 'Low (generally safe)',
      warnings: [
        'Use only culinary or sacred amounts',
        'Avoid excessive tea consumption',
        'Some individuals sensitive to volatile oils'
      ],
      contraindications: ['Pregnancy: culinary amounts safe']
    },
    substitutes: [
      { name: 'Bay Leaf', reason: 'Same plant, common culinary substitute', tradition: 'universal' },
      { name: 'Rosemary', reason: 'Similar Mediterranean herb properties', tradition: 'greek' },
      { name: 'Sage', reason: 'Similar prophetic and purifying properties', tradition: 'western' }
    ],
    botanicalInfo: {
      scientificName: 'Laurus nobilis',
      family: 'Lauraceae',
      nativeRegion: 'Mediterranean basin',
      commonNames: ['Bay Laurel', 'Noble Laurel', 'Greek Laurel', 'Sweet Laurel']
    }
  }
};

/**
 * Merge enrichment data with existing herb record
 */
async function enrichHerbRecord(herbId, existingData, enrichmentData) {
  const enriched = { ...existingData };

  if (enrichmentData) {
    // Deep merge metadata sections
    enriched.properties = {
      ...enriched.properties,
      ...enrichmentData.properties
    };

    enriched.preparations = {
      ...enriched.preparations,
      ...enrichmentData.preparations
    };

    enriched.associations = {
      ...enriched.associations,
      ...enrichmentData.associations
    };

    enriched.harvesting = enrichmentData.harvesting;
    enriched.dangers = enrichmentData.dangers;
    enriched.substitutes = enrichmentData.substitutes;
    enriched.botanicalInfo = enrichmentData.botanicalInfo;

    // Add metadata tracking
    enriched.metadata = enriched.metadata || {};
    enriched.metadata.enrichedWithMetadata = true;
    enriched.metadata.enrichmentDate = new Date().toISOString();
    enriched.metadata.enrichmentVersion = '2.0';
  }

  return enriched;
}

/**
 * Read local herb files
 */
async function readLocalHerbs() {
  const herbDir = './firebase-assets-downloaded/herbs';
  const herbs = {};

  const files = fs.readdirSync(herbDir).filter(f => f.endsWith('.json') && f !== '_all.json');

  for (const file of files) {
    const filePath = path.join(herbDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const herbData = JSON.parse(content);
    herbs[herbData.id] = herbData;
  }

  return herbs;
}

/**
 * Main enrichment process
 */
async function enrichHerbs() {
  try {
    console.log('Starting herb metadata enrichment...\n');

    // Read local herbs
    const localHerbs = await readLocalHerbs();
    console.log(`Found ${Object.keys(localHerbs).length} herb records locally\n`);

    let enrichedCount = 0;
    let skippedCount = 0;

    // Process each herb
    for (const [herbId, herbData] of Object.entries(localHerbs)) {
      const enrichmentData = HERB_ENRICHMENT_DATA[herbId];

      if (enrichmentData) {
        const enrichedHerb = await enrichHerbRecord(herbId, herbData, enrichmentData);

        // Update Firebase
        try {
          await db.collection('herbs').doc(herbId).set(enrichedHerb, { merge: true });
          console.log(`✓ Enriched: ${herbId}`);
          enrichedCount++;
        } catch (error) {
          console.error(`✗ Failed to update ${herbId}: ${error.message}`);
        }
      } else {
        console.log(`⊘ No enrichment data for: ${herbId}`);
        skippedCount++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Enrichment Complete`);
    console.log(`========================================`);
    console.log(`Enriched: ${enrichedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${enrichedCount + skippedCount}`);

  } catch (error) {
    console.error('Error during enrichment:', error);
    process.exit(1);
  } finally {
    admin.app().delete();
  }
}

// Run enrichment
enrichHerbs().then(() => {
  console.log('\nEnrichment process complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

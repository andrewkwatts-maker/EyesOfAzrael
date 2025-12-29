/**
 * AGENT 8: Herb Asset Enhancement Script
 *
 * Enhances herb assets with:
 * - Plant diagram (SVG botanical illustration)
 * - Preparation diagram (SVG showing preparation methods)
 * - Medicinal uses (array)
 * - Ritual uses (array)
 * - Effects timeline (when effects occur)
 * - Cultivation info
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (only if not already initialized)
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Cultivation templates by herb type
const CULTIVATION_TEMPLATES = {
  tree: {
    difficulty: 'moderate to difficult',
    soil: 'well-drained, nutrient-rich soil',
    sunlight: 'full sun to partial shade',
    water: 'regular watering, avoid waterlogging',
    climate: 'temperate to subtropical',
    propagation: 'seeds or cuttings',
    harvest_time: 'varies by species - often leaves in spring/summer, bark year-round',
    sacred_considerations: 'Plant with reverence, offer prayers during harvest'
  },
  flower: {
    difficulty: 'easy to moderate',
    soil: 'fertile, well-drained soil',
    sunlight: 'full sun',
    water: 'moderate, regular watering',
    climate: 'varies by species',
    propagation: 'seeds or division',
    harvest_time: 'blooming season',
    sacred_considerations: 'Harvest at dawn for maximum potency, offer thanks to plant spirits'
  },
  herb: {
    difficulty: 'easy',
    soil: 'average to rich soil',
    sunlight: 'full sun to partial shade',
    water: 'regular watering',
    climate: 'adaptable',
    propagation: 'seeds, cuttings, or division',
    harvest_time: 'before flowering for leaves, seeds when mature',
    sacred_considerations: 'Never harvest more than one-third, leave offerings'
  },
  root: {
    difficulty: 'moderate',
    soil: 'loose, deep soil',
    sunlight: 'partial shade to full sun',
    water: 'consistent moisture',
    climate: 'temperate',
    propagation: 'seeds or root division',
    harvest_time: 'autumn after first frost',
    sacred_considerations: 'Ask permission before harvesting, replant portions'
  },
  sacred: {
    difficulty: 'varies - requires spiritual preparation',
    soil: 'sacred ground or specially prepared soil',
    sunlight: 'as directed by tradition',
    water: 'blessed or natural spring water preferred',
    climate: 'specific to the plant',
    propagation: 'only by initiated practitioners',
    harvest_time: 'during sacred times or astrological alignments',
    sacred_considerations: 'Requires ritual purity, prayers, and proper offerings. Not all may cultivate.'
  }
};

// Medicinal uses templates
const MEDICINAL_USES_TEMPLATES = {
  healing: [
    'Wound healing and tissue repair',
    'Anti-inflammatory properties',
    'Pain relief',
    'Immune system support'
  ],
  purification: [
    'Blood purification',
    'Detoxification',
    'Digestive cleansing',
    'Respiratory clearing'
  ],
  calming: [
    'Anxiety and stress reduction',
    'Sleep aid',
    'Nervous system calming',
    'Emotional balance'
  ],
  strengthening: [
    'Energy and vitality enhancement',
    'Immune boosting',
    'Physical endurance',
    'Mental clarity'
  ],
  spiritual: [
    'Consciousness expansion',
    'Psychic enhancement',
    'Spiritual purification',
    'Divine connection'
  ]
};

// Effects timeline template
const EFFECTS_TIMELINE_TEMPLATE = {
  immediate: '0-15 minutes: Initial energetic effects, spiritual attunement',
  short_term: '15-60 minutes: Primary effects manifest, consciousness shifts',
  medium_term: '1-4 hours: Peak effects, full medicinal/spiritual impact',
  long_term: '4-24 hours: Effects gradually diminish, integration begins',
  lasting: '24+ hours: Subtle energetic changes, spiritual insights integrate'
};

/**
 * Generate cultivation information
 */
function generateCultivationInfo(herb) {
  const herbName = herb.displayName || herb.name || '';
  let herbType = 'herb'; // default

  // Determine herb type from name or properties
  if (herbName.toLowerCase().includes('tree') || herbName.toLowerCase().includes('oak') ||
      herbName.toLowerCase().includes('yew') || herbName.toLowerCase().includes('ash')) {
    herbType = 'tree';
  } else if (herbName.toLowerCase().includes('lotus') || herbName.toLowerCase().includes('flower')) {
    herbType = 'flower';
  } else if (herbName.toLowerCase().includes('root') || herbName.toLowerCase().includes('ginger')) {
    herbType = 'root';
  } else if (herbName.toLowerCase().includes('sacred') || herbName.toLowerCase().includes('soma') ||
             herbName.toLowerCase().includes('ambrosia')) {
    herbType = 'sacred';
  }

  const template = CULTIVATION_TEMPLATES[herbType];

  return {
    plant_type: herbType,
    difficulty: template.difficulty,
    growing_conditions: {
      soil: template.soil,
      sunlight: template.sunlight,
      water: template.water,
      climate: template.climate
    },
    propagation: template.propagation,
    harvest_time: template.harvest_time,
    sacred_considerations: template.sacred_considerations
  };
}

/**
 * Generate medicinal uses array
 */
function generateMedicinalUses(herb) {
  const uses = herb.uses || herb.rituals || [];
  const properties = herb.properties || [];

  let category = 'healing'; // default

  // Determine category from existing data
  const text = JSON.stringify(uses).toLowerCase() + JSON.stringify(properties).toLowerCase();

  if (text.includes('purif') || text.includes('cleans')) category = 'purification';
  else if (text.includes('calm') || text.includes('sleep') || text.includes('peace')) category = 'calming';
  else if (text.includes('strength') || text.includes('energy') || text.includes('vital')) category = 'strengthening';
  else if (text.includes('spirit') || text.includes('divine') || text.includes('sacred')) category = 'spiritual';

  const template = MEDICINAL_USES_TEMPLATES[category] || MEDICINAL_USES_TEMPLATES.healing;

  // Combine template with existing uses
  const existingMedicinal = uses.filter(use =>
    use.toLowerCase().includes('heal') ||
    use.toLowerCase().includes('medicin') ||
    use.toLowerCase().includes('cure') ||
    use.toLowerCase().includes('treat')
  );

  return [...new Set([...existingMedicinal, ...template])];
}

/**
 * Generate ritual uses array
 */
function generateRitualUses(herb) {
  const uses = herb.uses || herb.rituals || [];

  // Extract ritual uses from existing data
  const ritualUses = uses.filter(use =>
    use.toLowerCase().includes('ritual') ||
    use.toLowerCase().includes('ceremony') ||
    use.toLowerCase().includes('offering') ||
    use.toLowerCase().includes('temple') ||
    use.toLowerCase().includes('worship') ||
    use.toLowerCase().includes('sacred')
  );

  // Add default ritual uses if none found
  if (ritualUses.length === 0) {
    const mythology = herb.mythology || 'universal';
    return [
      `Sacred offerings in ${mythology} rituals`,
      'Incense for purification and blessing',
      'Anointing oils for consecration',
      'Ritual beverages for communion',
      'Temple decorations and garlands'
    ];
  }

  return ritualUses;
}

/**
 * Generate effects timeline
 */
function generateEffectsTimeline(herb) {
  const herbName = (herb.displayName || herb.name || '').toLowerCase();

  // Customize based on herb type
  if (herbName.includes('soma') || herbName.includes('ambrosia') || herbName.includes('haoma')) {
    return {
      immediate: '0-15 minutes: Divine energy begins to flow, consciousness expands',
      short_term: '15-60 minutes: Visions may appear, connection to divine realm strengthens',
      medium_term: '1-4 hours: Peak spiritual state, communion with deities possible',
      long_term: '4-24 hours: Gradual return to normal consciousness, wisdom integrates',
      lasting: '24+ hours to lifetime: Permanent spiritual insights, enhanced divine connection'
    };
  } else if (herbName.includes('lotus') || herbName.includes('sacred')) {
    return {
      immediate: '0-15 minutes: Calming energy, spiritual opening',
      short_term: '15-60 minutes: Mental clarity increases, meditation deepens',
      medium_term: '1-4 hours: Full contemplative state, spiritual insights arise',
      long_term: '4-24 hours: Peace and clarity persist',
      lasting: '24+ hours: Enhanced spiritual awareness, lasting tranquility'
    };
  } else {
    return EFFECTS_TIMELINE_TEMPLATE;
  }
}

/**
 * Generate preparation methods array
 */
function generatePreparationMethods(herb) {
  const prep = herb.preparation || [];

  if (prep.length > 0) {
    return prep;
  }

  // Default preparation methods
  return [
    'Infusion: Steep in hot water for 10-15 minutes',
    'Decoction: Boil root or bark for 20-30 minutes',
    'Tincture: Macerate in alcohol for 2-4 weeks',
    'Powder: Grind dried plant material finely',
    'Incense: Burn dried leaves or resin on charcoal',
    'Oil: Infuse in carrier oil for topical use'
  ];
}

/**
 * Enhance a single herb
 */
async function enhanceHerb(herbData) {
  const enhancements = {
    _agent8Enhanced: true,
    _agent8Date: new Date().toISOString(),

    // Add plant diagram
    plant_diagram: `/diagrams/herbs/${herbData.id || herbData.filename}-botanical.svg`,

    // Add preparation diagram
    preparation_diagram: `/diagrams/herbs/${herbData.id || herbData.filename}-preparation.svg`,

    // Add medicinal uses
    medicinal_uses: generateMedicinalUses(herbData),

    // Add ritual uses (keep existing if present)
    ritual_uses: herbData.ritual_uses || generateRitualUses(herbData),

    // Add effects timeline
    effects_timeline: generateEffectsTimeline(herbData),

    // Add cultivation info
    cultivation_info: generateCultivationInfo(herbData),

    // Add preparation methods
    preparation_methods: generatePreparationMethods(herbData)
  };

  return { ...herbData, ...enhancements };
}

/**
 * Main enhancement function
 */
async function enhanceAllHerbs() {
  console.log('🌿 AGENT 8: Starting Herb Enhancement Process...\n');

  const stats = {
    total: 0,
    enhanced: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Read all herb JSON files
    const herbsDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'herbs');
    const files = fs.readdirSync(herbsDir).filter(f => f.endsWith('.json') && !f.includes('_all'));

    stats.total = files.length;
    console.log(`📦 Found ${files.length} herb files to process\n`);

    for (const file of files) {
      try {
        const filePath = path.join(herbsDir, file);
        const herbArray = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!Array.isArray(herbArray) || herbArray.length === 0) {
          console.log(`⚠️  Skipping ${file} - empty or invalid format`);
          stats.skipped++;
          continue;
        }

        const herb = herbArray[0];

        // Skip if already enhanced by Agent 8
        if (herb._agent8Enhanced) {
          console.log(`⏭️  Skipping ${herb.displayName || herb.name || file} - already enhanced`);
          stats.skipped++;
          continue;
        }

        // Enhance the herb
        const enhanced = await enhanceHerb(herb);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify([enhanced], null, 2), 'utf8');

        console.log(`✅ Enhanced: ${enhanced.displayName || enhanced.name || file}`);
        stats.enhanced++;

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        stats.errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Enhancement Statistics:');
    console.log('='.repeat(60));
    console.log(`Total Herbs:     ${stats.total}`);
    console.log(`Enhanced:        ${stats.enhanced}`);
    console.log(`Skipped:         ${stats.skipped}`);
    console.log(`Errors:          ${stats.errors}`);
    console.log('='.repeat(60));

    // Create summary report
    const report = {
      timestamp: new Date().toISOString(),
      agent: 'AGENT_8',
      category: 'herbs',
      statistics: stats,
      enhancements: [
        'plant_diagram (SVG botanical illustration)',
        'preparation_diagram (SVG preparation methods)',
        'medicinal_uses (array)',
        'ritual_uses (array)',
        'effects_timeline (temporal progression)',
        'cultivation_info (growing requirements)',
        'preparation_methods (array)'
      ]
    };

    const reportPath = path.join(__dirname, '..', 'AGENT_8_HERB_ENHANCEMENT_STATS.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`\n✅ Enhancement complete! Report saved to AGENT_8_HERB_ENHANCEMENT_STATS.json`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  enhanceAllHerbs()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { enhanceHerb, enhanceAllHerbs };

#!/usr/bin/env node

/**
 * Creature Metadata Enrichment Script
 *
 * Enriches creature entities with rich metadata:
 * - abilities: Powers and supernatural skills
 * - weaknesses: Vulnerabilities and exploitable traits
 * - habitat: Where the creature dwells
 * - behavior: Typical actions and temperament
 * - classification: Type of creature (dragon, spirit, beast, etc.)
 * - physicalDescription: Appearance details
 *
 * This script reads from local JSON files and updates Firebase with enriched data.
 *
 * Usage:
 *   node scripts/enrich-creatures-metadata.js [--dry-run] [--upload]
 *
 * Options:
 *   --dry-run   : Preview changes without updating Firebase
 *   --upload    : Upload changes to Firebase (requires credentials)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UPLOAD = args.includes('--upload');
const CREATURES_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'creatures');
const OUTPUT_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'creatures-enriched');

console.log('Creature Metadata Enrichment Script');
console.log('===================================');
console.log('Mode:', DRY_RUN ? 'DRY RUN (preview only)' : 'LOCAL UPDATE (JSON files)');
console.log('Firebase Upload:', UPLOAD ? 'YES' : 'NO');
console.log('');

// ============================================================================
// CREATURE METADATA DEFINITIONS
// ============================================================================

/**
 * Rich creature metadata by creature ID or pattern
 * These define the baseline enrichment for each creature type
 */
const CREATURE_METADATA = {
  'babylonian_mushussu': {
    classification: 'Dragon',
    habitat: 'Temples of Babylon, sacred grounds of Marduk',
    behavior: 'Guardian and protector, loyal to Marduk, stands vigilant against chaos',
    abilities: [
      'Venomous Bite: Fangs dripping with lethal poison, killing with a single strike',
      'Impenetrable Scales: Armor-like hide that deflects weapons and spells',
      'Divine Radiance: Surrounded by a terrifying aura that causes enemies to collapse in fear',
      'Hybrid Strength: Combining lion\'s power, serpent\'s flexibility, and eagle\'s speed',
      'Sacred Authority: As Marduk\'s mount, commands respect from lesser spirits and demons',
      'Guardian Magic: Presence wards off evil and protects sacred spaces'
    ],
    weaknesses: [
      'Sacred Weapons: Only weapons blessed by Marduk can truly harm it',
      'Counter-Magic: Divine magic opposing Marduk\'s authority can bind it',
      'Spiritual Exhaustion: Can be weakened by prolonged exposure to chaotic forces'
    ]
  },

  'babylonian_scorpion-men': {
    classification: 'Hybrid Beast',
    habitat: 'Mountains and deserts of Mesopotamia, gates between worlds',
    behavior: 'Sentinel guardians, emotionless but not evil, follow strict protocols',
    abilities: [
      'Scorpion Sting: Venomous tail capable of delivering instant death',
      'Composite Strength: Human intelligence combined with scorpion ferocity',
      'Portal Sensing: Can detect and defend dimensional passages',
      'Armor-like Hide: Chitinous exoskeleton provides natural protection'
    ],
    weaknesses: [
      'Fire: Particularly vulnerable to intense heat and flames',
      'Sonic Attacks: High-frequency sounds can disorient them',
      'Mutual Combat: Vulnerable in direct physical confrontation with matched foes'
    ]
  },

  'greek_creature_medusa': {
    classification: 'Gorgon',
    habitat: 'Solitary caves and temples, places of desolation',
    behavior: 'Victim turned protector, vengeful yet sympathetic, isolation-driven',
    abilities: [
      'Petrifying Gaze: Anyone who looks directly at her face turns instantly to stone',
      'Serpent Hair: Living, venomous snakes that writhe and strike independently',
      'Flight: Golden wings enable swift aerial movement',
      'Enhanced Strength: Superhuman physical power'
    ],
    weaknesses: [
      'Mirrors: Cannot see her own reflection without petrifying herself',
      'Indirect Vision: Can be fought by reflecting her gaze or using periphery',
      'Mortal Body: Despite her powers, her physical form can be wounded',
      'Emotional Vulnerability: Attachment can cloud her judgment'
    ]
  },

  'greek_creature_hydra': {
    classification: 'Hydra',
    habitat: 'Lake Lerna in the Argolid, believed to be an entrance to the Underworld',
    behavior: 'Destructive, territorial, regenerative compulsion, born to cause suffering',
    abilities: [
      'Deadly Venom (breath and blood): Toxic breath or contact can kill instantly',
      'Regenerating Heads: Cut one head off, two grow back stronger',
      'Immortal Head: One central head impervious to all harm and mortal weapons',
      'Aquatic Dominance: Perfect command of water environments',
      'Size Alteration: Can grow to massive, devastating proportions'
    ],
    weaknesses: [
      'Fire-based Attacks: Cauterizing wounds prevents regeneration',
      'The Immortal Head: Is the true heart of the creature, must be destroyed last',
      'Single Combat: Vulnerable if attacked systematically one head at a time',
      'Lerna Entrance: Cannot cross the barrier between worlds easily'
    ]
  },

  'greek_creature_pegasus': {
    classification: 'Divine Steed',
    habitat: 'Mount Helicon, springs sacred to the Muses, high mountain peaks',
    behavior: 'Noble, wise, protective of sacred spaces, bonds with worthy heroes',
    abilities: [
      'Flight: Unlimited aerial movement and speed',
      'Divine Grace: Born from divine blood, radiates sacred power',
      'Stamina: Can fly for impossibly long distances without rest',
      'Springwater Creation: Where Pegasus strikes the ground, magical springs emerge',
      'Hero Companionship: Can form telepathic bonds with pure-hearted individuals'
    ],
    weaknesses: [
      'Moral Judgment: Refuses service to those with impure intentions',
      'Sacred Bonds: If bonded, vulnerable through emotional connection',
      'Mortality: While divine, can still be physically harmed by determined foes'
    ]
  },

  'greek_creature_minotaur': {
    classification: 'Hybrid Monster',
    habitat: 'The Labyrinth of Daedalus, dark maze beneath Crete',
    behavior: 'Savage and instinctive, but capable of reason, lonely and bitter',
    abilities: [
      'Supernatural Strength: Vastly stronger than any human',
      'Labyrinth Mastery: Perfect navigation of complex mazes',
      'Horns: Devastating goring attacks and tossing power',
      'Endurance: Can subsist in darkness for indefinite periods',
      'Intimidation Aura: Mere presence strikes fear in hearts'
    ],
    weaknesses: [
      'Linear Thinking: Can be confused by complex strategic plans',
      'The Thread: Can be tracked and led back out via Ariadne\'s thread',
      'Mortal Vulnerability: Despite strength, can be slain by a determined hero',
      'Isolation: Separated from potential allies by the Labyrinth'
    ]
  },

  'buddhist_nagas': {
    classification: 'Dragon Deity',
    habitat: 'Underwater palaces in oceans, lakes, rivers, springs, wells, sacred bathing pools',
    behavior: 'Protective of waters, guardians of wisdom, can be benevolent or vengeful',
    abilities: [
      'Weather Control: Summon rain, cause drought, create storms or calm waters',
      'Shape-shifting: Transform between serpent, semi-human, and human forms',
      'Treasure Guardianship: Possess and protect vast hoards of jewels and sacred objects',
      'Venom: Deadly poison breath or bite',
      'Longevity: Live for thousands of years, witnessing ages pass',
      'Size Alteration: Shrink to human size or expand to mountain-filling proportions',
      'Water Dominion: Complete control over water in their domain'
    ],
    weaknesses: [
      'Mongoose Attacks: Particularly vulnerable to mongoose predators',
      'Iron: Cold iron can harm and repel them',
      'Sacred Insults: Desecration of their sacred waters enrages them',
      'Human Compassion: Can be moved by acts of kindness and redemption'
    ]
  },

  'islamic_jinn': {
    classification: 'Spirit Entity',
    habitat: 'Dimensions beyond normal perception, deserts, hidden places, between worlds',
    behavior: 'Intelligent and willful, can be righteous or malevolent, respect free will',
    abilities: [
      'Shapeshifting: Take various forms including animals, humans, and abstract shapes',
      'Invisibility: Normally invisible to humans unless they choose to appear',
      'Great Speed: Travel vast distances instantaneously',
      'Strength: Physically stronger than humans in many cases',
      'Longevity: Live for centuries, possibly millennia',
      'Dimensional Phasing: Move between physical and spiritual realms',
      'Possess Great Wisdom: Capable of profound knowledge and foresight'
    ],
    weaknesses: [
      'Fire: Created from smokeless fire, can be repelled by natural fire',
      'Blessed Salt and Sacred Words: Religious symbols and verses can banish them',
      'Iron: Cold iron disrupts their form',
      'Free Will: Cannot completely override human agency or divine protection',
      'Binding: Can be bound by knowledge of their true names or through divine command'
    ]
  },

  'norse_jotnar': {
    classification: 'Giant',
    habitat: 'Jotunheim (realm of giants), mountains, frozen wastelands, dark forests',
    behavior: 'Chaotic, powerful, often hostile to Asgard, driven by primal forces',
    abilities: [
      'Titanic Strength: Can crush mountains and reshape landscapes',
      'Elemental Affinity: Command over fire, ice, or earth depending on type',
      'Immortality: Cannot age or die of natural causes',
      'Regeneration (Some): Certain giants can regrow lost limbs',
      'Curse Magic: Can place powerful curses on heroes and lands',
      'Size Alteration: Can adjust their massive size'
    ],
    weaknesses: [
      'Prophecy: Fate is sealed by the Norns and cannot be escaped',
      'Divine Weapons: Only the weapons of gods can truly harm them',
      'Trickery: Can be outwitted through cunning and misdirection',
      'Isolation: Vulnerable if separated from their home realm'
    ]
  },

  'sumerian_lamassu': {
    classification: 'Divine Guardian',
    habitat: 'Gates of cities and temples, thresholds between worlds, palaces',
    behavior: 'Protective and wise, judges worthiness, symbol of divine authority',
    abilities: [
      'Divine Authority: Commands respect from lesser beings',
      'Threshold Guardianship: Can seal or open passages between worlds',
      'Judgment: Perceives truth and cannot be deceived',
      'Protective Aura: Shields sacred spaces from harm',
      'Celestial Strength: Combines human intellect with animal power'
    ],
    weaknesses: [
      'Divine Will: Subject to higher divine commands',
      'Sacred Protocol: Cannot abandon their designated post',
      'Paradox: Confusion about worthy/unworthy can temporarily immobilize them'
    ]
  },

  'egyptian_sphinx': {
    classification: 'Hybrid Guardian',
    habitat: 'Desert plateaus, temple approaches, monuments guarding sacred knowledge',
    behavior: 'Enigmatic, riddler, guardian of secrets, divine authority, patient',
    abilities: [
      'Riddle Mastery: Proposes riddles of impossible complexity',
      'Predatory Strength: Lion body provides immense physical power',
      'Divine Insight: Perceives secrets and hidden truths',
      'Sand Manipulation: Controls deserts and sand around it',
      'Immortality: Cannot be killed through normal means',
      'Curse Placement: Can curse those who fail the riddle'
    ],
    weaknesses: [
      'The Correct Answer: True knowledge of the answer breaks the riddle\'s power',
      'Humiliation: Being bested in a riddle can render them powerless',
      'Sacred Violation: Desecrating their monument weakens them'
    ]
  },

  'christian_seraphim': {
    classification: 'Celestial Being',
    habitat: 'Throne of God, highest heavens, divine presence',
    behavior: 'Devoted to divine will, burning with holy love, awe-inspiring and terrifying',
    abilities: [
      'Divine Glory: Presence fills observers with awe and terror',
      'Six Wings: For rapid divine service and absolute obedience',
      'Holy Fire: Consume sin and impurity',
      'Prophetic Vision: Perceive divine will and future events',
      'Celestial Strength: Immense divine power for executing God\'s will',
      'Immunity: Protected by divine sanctity'
    ],
    weaknesses: [
      'Divine Submission: Bound absolutely to God\'s will',
      'Holiness Paradox: Their nature prevents them from manifesting among the unholy',
      'Singularity: Cannot act independently of divine directive'
    ]
  },

  'hindu_garuda': {
    classification: 'Divine Eagle',
    habitat: 'Heavens, sacred mountains, temples dedicated to Vishnu',
    behavior: 'Noble and righteous, devoted to Vishnu, protector of dharma (cosmic order)',
    abilities: [
      'Divine Flight: Unlimited speed and mobility in all realms',
      'Strength: Capable of carrying mountains and gods',
      'Serpent Dominion: Can perceive and combat serpent creatures',
      'Immortality: Divine nature prevents death',
      'Vitality Transfer: Can grant or restore vital energy',
      'Multi-realm Travel: Can traverse physical and spiritual worlds'
    ],
    weaknesses: [
      'Devotion: Bound by loyalty to Vishnu',
      'Serpent Curse: Ancient enmity with nagas makes those encounters volatile',
      'Dharmic Restriction: Cannot act against cosmic order'
    ]
  },

  'hindu_makara': {
    classification: 'Composite Aquatic Beast',
    habitat: 'Seas and rivers, underwater palaces, sacred waters',
    behavior: 'Majestic and powerful, associated with fertility and prosperity',
    abilities: [
      'Aquatic Dominion: Complete control over water and sea creatures',
      'Size Alteration: Can grow to enormous proportions or diminish',
      'Enhanced Strength: Powerful enough to pull celestial bodies',
      'Composite Nature: Combines elephant trunk flexibility with fish finesse',
      'Artistic Prowess: Associated with aesthetics and creative power',
      'Prosperity Manifestation: Brings abundance to those who honor it'
    ],
    weaknesses: [
      'Sacred Restrictions: Cannot harm those under divine protection',
      'Depletion: Extended time away from water weakens it',
      'Respect Required: Loses power if treated without proper reverence'
    ]
  }
};

// ============================================================================
// CREATURE DATA EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract abilities from various possible fields in creature data
 */
function extractAbilities(creature, enrichment) {
  const abilities = [];

  // Use enriched abilities if provided
  if (enrichment && enrichment.abilities && Array.isArray(enrichment.abilities)) {
    return enrichment.abilities;
  }

  // Otherwise, extract from existing data
  if (creature.abilities && Array.isArray(creature.abilities)) {
    abilities.push(...creature.abilities.filter(a => typeof a === 'string'));
  }

  // From attributes
  if (creature.attributes && creature.attributes.abilities) {
    const attrs = creature.attributes.abilities;
    if (Array.isArray(attrs)) {
      abilities.push(...attrs.filter(a => typeof a === 'string'));
    }
  }

  return [...new Set(abilities)]; // Remove duplicates
}

/**
 * Extract weaknesses from creature data
 */
function extractWeaknesses(creature, enrichment) {
  const weaknesses = [];

  // Use enriched weaknesses if provided
  if (enrichment && enrichment.weaknesses && Array.isArray(enrichment.weaknesses)) {
    return enrichment.weaknesses;
  }

  // Otherwise, extract from existing data
  if (creature.weaknesses && Array.isArray(creature.weaknesses)) {
    weaknesses.push(...creature.weaknesses.filter(w => typeof w === 'string' && w.trim().length > 0));
  }

  return weaknesses.length > 0 ? weaknesses : [];
}

/**
 * Extract or generate habitat information
 */
function extractHabitat(creature, enrichment) {
  // Use enriched habitat if provided
  if (enrichment && enrichment.habitat && typeof enrichment.habitat === 'string') {
    return enrichment.habitat;
  }

  // Try to extract from existing data
  if (creature.habitats && Array.isArray(creature.habitats) && creature.habitats.length > 0) {
    return creature.habitats[0];
  }

  if (creature.lair && Array.isArray(creature.lair) && creature.lair.length > 0) {
    return creature.lair[0];
  }

  if (creature.habitat && typeof creature.habitat === 'string') {
    return creature.habitat;
  }

  return '';
}

/**
 * Extract or generate behavior information
 */
function extractBehavior(creature, enrichment) {
  // Use enriched behavior if provided
  if (enrichment && enrichment.behavior && typeof enrichment.behavior === 'string') {
    return enrichment.behavior;
  }

  // Try to extract from description
  if (creature.description && typeof creature.description === 'string') {
    const desc = creature.description;
    if (desc.length > 200) {
      return desc.substring(0, 200) + '...';
    }
    return desc;
  }

  if (creature.mythology_story && typeof creature.mythology_story === 'string') {
    const story = creature.mythology_story;
    if (story.length > 200) {
      return story.substring(0, 200) + '...';
    }
    return story;
  }

  return '';
}

/**
 * Extract or determine classification
 */
function extractClassification(creature, enrichment) {
  // Use enriched classification if provided
  if (enrichment && enrichment.classification && typeof enrichment.classification === 'string') {
    return enrichment.classification;
  }

  // Try subType field
  if (creature.subType && typeof creature.subType === 'string') {
    return creature.subType.charAt(0).toUpperCase() + creature.subType.slice(1);
  }

  // Try to infer from name or filename
  const id = creature.id || creature.filename || '';
  const lowerCase = id.toLowerCase();

  if (lowerCase.includes('dragon') || lowerCase.includes('naga') || lowerCase.includes('wyrm')) {
    return 'Dragon';
  }
  if (lowerCase.includes('spirit') || lowerCase.includes('jinn') || lowerCase.includes('demon')) {
    return 'Spirit Entity';
  }
  if (lowerCase.includes('angel') || lowerCase.includes('seraph')) {
    return 'Celestial Being';
  }
  if (lowerCase.includes('giant') || lowerCase.includes('jotun')) {
    return 'Giant';
  }
  if (lowerCase.includes('beast') || lowerCase.includes('creature')) {
    return 'Beast';
  }

  return 'Mythical Creature';
}

/**
 * Get physical description
 */
function getPhysicalDescription(creature) {
  if (creature.physicalDescription && typeof creature.physicalDescription === 'string') {
    return creature.physicalDescription;
  }

  if (creature.nature && typeof creature.nature === 'string') {
    return creature.nature;
  }

  return '';
}

// ============================================================================
// FILE PROCESSING
// ============================================================================

/**
 * Enrich a single creature file
 */
function enrichCreature(creature, filePath) {
  // Find enrichment metadata by ID or pattern
  let enrichment = CREATURE_METADATA[creature.id];

  // If no exact match, try pattern matching
  if (!enrichment) {
    const id = creature.id || '';
    for (const [key, value] of Object.entries(CREATURE_METADATA)) {
      if (id.includes(key) || key.includes(id.split('_')[0])) {
        enrichment = value;
        break;
      }
    }
  }

  // Build enriched creature data
  const enriched = { ...creature };

  // Add/update metadata fields
  enriched.abilities = extractAbilities(creature, enrichment);
  enriched.weaknesses = extractWeaknesses(creature, enrichment);
  enriched.habitat = extractHabitat(creature, enrichment);
  enriched.behavior = extractBehavior(creature, enrichment);
  enriched.classification = extractClassification(creature, enrichment);
  enriched.physicalDescription = getPhysicalDescription(creature);

  // Add enrichment metadata
  if (!enriched.metadata) {
    enriched.metadata = {};
  }
  enriched.metadata.creaturesMetadataEnriched = true;
  enriched.metadata.enrichedAt = new Date().toISOString();
  enriched.metadata.enrichmentSource = 'enrich-creatures-metadata.js';

  return enriched;
}

/**
 * Process all creature files
 */
function processCreatures() {
  if (!fs.existsSync(CREATURES_DIR)) {
    console.error(`ERROR: Creatures directory not found: ${CREATURES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CREATURES_DIR)
    .filter(f => f.endsWith('.json') && f !== '_all.json')
    .sort();

  console.log(`Found ${files.length} creature files\n`);

  const stats = {
    total: files.length,
    processed: 0,
    withAbilities: 0,
    withWeaknesses: 0,
    withHabitat: 0,
    withBehavior: 0,
    enriched: 0,
    errors: []
  };

  const enrichedCreatures = [];

  for (const file of files) {
    try {
      const filePath = path.join(CREATURES_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const creature = JSON.parse(content);

      // Enrich the creature
      const enrichedCreature = enrichCreature(creature, filePath);
      enrichedCreatures.push({
        id: creature.id || file.replace('.json', ''),
        file,
        original: creature,
        enriched: enrichedCreature
      });

      // Update stats
      stats.processed++;
      if (enrichedCreature.abilities && enrichedCreature.abilities.length > 0) stats.withAbilities++;
      if (enrichedCreature.weaknesses && enrichedCreature.weaknesses.length > 0) stats.withWeaknesses++;
      if (enrichedCreature.habitat && enrichedCreature.habitat.length > 0) stats.withHabitat++;
      if (enrichedCreature.behavior && enrichedCreature.behavior.length > 0) stats.withBehavior++;
      stats.enriched++;

    } catch (error) {
      stats.errors.push({
        file,
        error: error.message
      });
      console.error(`✗ Error processing ${file}: ${error.message}`);
    }
  }

  return { creatures: enrichedCreatures, stats };
}

// ============================================================================
// OUTPUT & REPORT GENERATION
// ============================================================================

/**
 * Generate a detailed enrichment report
 */
function generateReport(result) {
  const { creatures, stats } = result;

  console.log('\n' + '='.repeat(80));
  console.log('CREATURE METADATA ENRICHMENT REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('STATISTICS:');
  console.log(`  Total creatures: ${stats.total}`);
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  With abilities: ${stats.withAbilities} (${Math.round(stats.withAbilities/stats.processed*100)}%)`);
  console.log(`  With weaknesses: ${stats.withWeaknesses} (${Math.round(stats.withWeaknesses/stats.processed*100)}%)`);
  console.log(`  With habitat: ${stats.withHabitat} (${Math.round(stats.withHabitat/stats.processed*100)}%)`);
  console.log(`  With behavior: ${stats.withBehavior} (${Math.round(stats.withBehavior/stats.processed*100)}%)`);
  console.log(`  Successfully enriched: ${stats.enriched}`);

  if (stats.errors.length > 0) {
    console.log(`\n  ERRORS: ${stats.errors.length}`);
    stats.errors.slice(0, 5).forEach(err => {
      console.log(`    - ${err.file}: ${err.error}`);
    });
    if (stats.errors.length > 5) {
      console.log(`    ... and ${stats.errors.length - 5} more errors`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE ENRICHMENTS (First 5):');
  console.log('='.repeat(80) + '\n');

  creatures.slice(0, 5).forEach(({ id, enriched }) => {
    console.log(`ID: ${id}`);
    console.log(`  Classification: ${enriched.classification || '(not set)'}`);
    console.log(`  Abilities: ${enriched.abilities ? enriched.abilities.length : 0}`);
    if (enriched.abilities && enriched.abilities.length > 0) {
      console.log(`    - ${enriched.abilities[0]}`);
    }
    console.log(`  Weaknesses: ${enriched.weaknesses ? enriched.weaknesses.length : 0}`);
    if (enriched.weaknesses && enriched.weaknesses.length > 0) {
      console.log(`    - ${enriched.weaknesses[0]}`);
    }
    console.log(`  Habitat: ${enriched.habitat ? enriched.habitat.substring(0, 60) + '...' : '(not set)'}`);
    console.log(`  Behavior: ${enriched.behavior ? enriched.behavior.substring(0, 60) + '...' : '(not set)'}`);
    console.log('');
  });

  return {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry-run' : 'update',
    statistics: stats,
    sampleCreatures: creatures.slice(0, 10).map(c => ({
      id: c.id,
      file: c.file,
      abilities: c.enriched.abilities ? c.enriched.abilities.length : 0,
      weaknesses: c.enriched.weaknesses ? c.enriched.weaknesses.length : 0,
      hasHabitat: !!c.enriched.habitat,
      hasBehavior: !!c.enriched.behavior,
      classification: c.enriched.classification
    }))
  };
}

/**
 * Update local JSON files with enriched data
 */
function updateLocalFiles(creatures) {
  console.log('\nUpdating local JSON files...\n');

  let updated = 0;
  let errors = 0;

  for (const { file, enriched } of creatures) {
    try {
      const filePath = path.join(CREATURES_DIR, file);
      fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2));
      updated++;

      if (updated % 10 === 0) {
        console.log(`  Updated ${updated}/${creatures.length} files...`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to update ${file}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n✓ Updated ${updated} files (${errors} errors)`);
  return updated;
}

// ============================================================================
// FIREBASE UPLOAD (Optional)
// ============================================================================

/**
 * Upload enriched creatures to Firebase
 */
async function uploadToFirebase(creatures) {
  if (!UPLOAD) {
    console.log('\nFirebase upload skipped (use --upload flag to enable)');
    return;
  }

  console.log('\nInitializing Firebase...');

  try {
    const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'eyesofazrael'
    });

    const db = admin.firestore();

    console.log(`Uploading ${creatures.length} creatures to Firebase...\n`);

    let uploaded = 0;
    let errors = 0;
    const batch = db.batch();

    for (const { id, enriched } of creatures) {
      try {
        const ref = db.collection('creatures').doc(id);
        batch.set(ref, enriched, { merge: true });
        uploaded++;

        if (uploaded % 50 === 0) {
          await batch.commit();
          console.log(`  Uploaded ${uploaded}/${creatures.length}...`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to upload ${id}: ${error.message}`);
        errors++;
      }
    }

    // Final commit
    if (uploaded > 0) {
      await batch.commit();
      console.log(`\n✓ Uploaded ${uploaded} creatures to Firebase (${errors} errors)`);
    }

    await admin.app().delete();

  } catch (error) {
    console.error(`\n✗ Firebase upload failed: ${error.message}`);
    console.log('Make sure you have the service account credentials file.');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');

  // Process creatures
  const result = processCreatures();

  // Generate report
  const report = generateReport(result);

  // Save report
  const reportPath = path.join(__dirname, '..', 'CREATURES_ENRICHMENT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No files were modified');
    console.log('Run without --dry-run to update local files');
  } else {
    // Update local files
    updateLocalFiles(result.creatures);

    // Optional: Upload to Firebase
    if (UPLOAD) {
      await uploadToFirebase(result.creatures);
    }

    console.log('\n✓ Creature metadata enrichment complete!');
  }

  console.log('');
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * AGENT 6: Creature Enhancement Script
 *
 * Enhances creature assets with:
 * - Detailed appearance descriptions
 * - Anatomy diagrams (SVG paths)
 * - Habitat/behavior panels
 * - Mythology cross-references
 * - Encounter stories
 * - Size comparison data
 */

const fs = require('fs');
const path = require('path');

// Creature enhancement templates by category
const CREATURE_TEMPLATES = {
  serpent: {
    anatomy_features: ['heads', 'scales', 'fangs', 'venom glands', 'tail'],
    behavior_traits: ['ambush predator', 'territorial', 'regenerative'],
    habitat_type: 'aquatic/swamp'
  },
  beast: {
    anatomy_features: ['head', 'body', 'limbs', 'tail', 'wings'],
    behavior_traits: ['aggressive', 'territorial', 'guardian'],
    habitat_type: 'terrestrial'
  },
  spirit: {
    anatomy_features: ['ethereal form', 'wings', 'manifestation'],
    behavior_traits: ['intelligent', 'divine messenger', 'protector'],
    habitat_type: 'celestial/spiritual'
  },
  hybrid: {
    anatomy_features: ['composite parts', 'wings', 'multiple heads'],
    behavior_traits: ['unpredictable', 'chaotic', 'guardian'],
    habitat_type: 'varied'
  }
};

// Major creatures that need hand-crafted enhancements
const MAJOR_CREATURES = [
  // Greek
  'greek_creature_cerberus', 'greek_creature_hydra', 'greek_creature_medusa',
  'greek_creature_minotaur', 'greek_creature_chimera', 'greek_creature_pegasus',
  'greek_creature_sphinx', 'greek_creature_stymphalian-birds',
  // Norse
  'norse_fenrir', 'norse_jormungandr', 'norse_sleipnir', 'norse_jotnar',
  // Hindu
  'hindu_garuda', 'hindu_nagas', 'hindu_makara',
  // Egyptian
  'egyptian_sphinx',
  // Babylonian
  'babylonian_mushussu', 'babylonian_scorpion-men',
  // Sumerian
  'sumerian_lamassu',
  // Buddhist
  'buddhist_nagas',
  // Islamic
  'islamic_jinn',
  // Christian
  'christian_seraphim', 'christian_angels'
];

// Size comparison data (height in meters, relative to human at 1.8m)
const SIZE_DATA = {
  // Greek creatures
  greek_creature_cerberus: { height: 3, length: 4, human_scale: 1.67 },
  greek_creature_hydra: { height: 6, length: 15, human_scale: 3.33 },
  greek_creature_medusa: { height: 1.8, length: null, human_scale: 1.0 },
  greek_creature_minotaur: { height: 2.5, length: null, human_scale: 1.39 },
  greek_creature_chimera: { height: 2, length: 3.5, human_scale: 1.11 },
  greek_creature_pegasus: { height: 1.8, length: 2.5, human_scale: 1.0 },
  greek_creature_sphinx: { height: 2, length: 4, human_scale: 1.11 },

  // Norse creatures
  norse_fenrir: { height: 5, length: 10, human_scale: 2.78 },
  norse_jormungandr: { height: 20, length: 1000, human_scale: 11.11 },
  norse_sleipnir: { height: 2, length: 3, human_scale: 1.11 },
  norse_jotnar: { height: 8, length: null, human_scale: 4.44 },

  // Hindu creatures
  hindu_garuda: { height: 10, length: 15, human_scale: 5.56 },
  hindu_nagas: { height: 3, length: 8, human_scale: 1.67 },
  hindu_makara: { height: 2, length: 6, human_scale: 1.11 },

  // Egyptian creatures
  egyptian_sphinx: { height: 3, length: 8, human_scale: 1.67 },

  // Babylonian creatures
  babylonian_mushussu: { height: 2.5, length: 5, human_scale: 1.39 },
  babylonian_scorpion_men: { height: 2.5, length: null, human_scale: 1.39 },

  // Sumerian creatures
  sumerian_lamassu: { height: 4, length: 5, human_scale: 2.22 },

  // Buddhist creatures
  buddhist_nagas: { height: 3, length: 10, human_scale: 1.67 },

  // Islamic creatures
  islamic_jinn: { height: 2, length: null, human_scale: 1.11 },

  // Christian creatures
  christian_seraphim: { height: 5, length: null, human_scale: 2.78 },
  christian_angels: { height: 2.5, length: null, human_scale: 1.39 }
};

// Detailed appearance descriptions for major creatures
const APPEARANCE_DESCRIPTIONS = {
  greek_creature_hydra: {
    detailed_appearance: `The Lernaean Hydra presents a nightmarish spectacle of serpentine horror. Its primary body is that of a massive water serpent, covered in dark green-black scales that gleam with a sickly sheen when wet. The scales are thick and overlapping, providing natural armor against most weapons.

What makes the Hydra truly terrifying is its multiple heads - typically nine in number, though some accounts suggest more. Each head is as large as a horse, with massive jaws lined with rows of needle-sharp fangs. The heads move independently, writhing and snapping at different targets simultaneously. The central head is the immortal one, slightly larger and more intelligent than the others, with golden eyes that burn with malevolent awareness.

From the creature's neck stumps, where heads have been severed, twin growths emerge, creating an ever-increasing forest of serpentine horror. The Hydra's breath is poisonous, capable of killing with its mere exhalation, and its blood is so venomous that even its scent can cause death. The creature's tail is thick and powerful, capable of crushing stone, and it moves through water with terrifying speed.`,
    anatomy_diagram: 'diagrams/creatures/hydra_anatomy.svg',
    habitat_info: {
      primary: 'The swamps and marshes of Lake Lerna in the Argolid',
      description: 'The Hydra makes its lair in the poisonous swamps near Lake Lerna, believed to be one of the entrances to the Underworld. The toxic waters and fetid air suit its venomous nature perfectly.',
      behavior: 'Highly territorial and aggressive, the Hydra attacks anything that approaches its swamp. It can remain submerged for extended periods, emerging to drag victims into the poisoned waters.'
    },
    behavior_traits: [
      'Highly aggressive and territorial',
      'Ambush predator that emerges from water',
      'Regenerative - grows two heads for each one severed',
      'Venomous breath and blood',
      'One immortal head that cannot be destroyed by conventional means'
    ],
    mythology_encounters: [
      {
        story: 'The Second Labor of Heracles',
        source: 'Greek Mythology',
        description: 'Heracles was sent to destroy the Hydra as his second labor. With the help of his nephew Iolaus, who cauterized each neck stump with fire to prevent regeneration, Heracles finally defeated the beast by burying the immortal head under a massive boulder.'
      },
      {
        story: 'Hera\'s Crab',
        source: 'Greek Mythology',
        description: 'During the battle, Hera sent a giant crab to aid the Hydra by pinching Heracles\' feet. Heracles crushed it, and Hera placed it in the stars as the constellation Cancer.'
      }
    ]
  },

  greek_creature_medusa: {
    detailed_appearance: `Medusa's appearance is a tragic transformation of beauty into horror. Once a stunning maiden, her cursed form combines elements of serpent and humanoid in a nightmarish fusion.

Her most distinctive feature is her hair - what were once flowing locks are now hundreds of living, venomous serpents. These snakes are constantly in motion, hissing and writhing, their scales ranging from emerald green to obsidian black. They strike at anything that comes near, their fangs dripping with deadly venom.

Her face retains a ghostly echo of her former beauty, but twisted into something terrible. Her skin has taken on a pallid, corpse-like quality with a faint greenish tinge. Her eyes, the source of her petrifying power, glow with an eerie light - some accounts describe them as bronze, others as burning gold. To meet her gaze is to be turned instantly to stone.

Her hands have been transformed into bronze claws, sharp and metallic. Great golden wings sprout from her shoulders, resembling those of a dragon or massive bird. Some traditions give her boar-like tusks protruding from her mouth, and a serpentine lower body instead of human legs. Every aspect of her form speaks to the cruelty of her transformation - beauty corrupted into monstrosity.`,
    anatomy_diagram: 'diagrams/creatures/medusa_anatomy.svg',
    habitat_info: {
      primary: 'Remote island at the edge of the world',
      description: 'Medusa dwells in a desolate place far from civilization, surrounded by a garden of stone statues - the petrified remains of those who looked upon her face.',
      behavior: 'Isolated and tragic, Medusa does not actively hunt but petrifies any who approach. Her lair is filled with the stone forms of failed heroes and warriors.'
    },
    behavior_traits: [
      'Petrifying gaze - turns onlookers to stone instantly',
      'Venomous serpent hair that strikes independently',
      'Flight capable with golden wings',
      'Defensive rather than aggressive',
      'Tragic victim of divine punishment'
    ],
    mythology_encounters: [
      {
        story: 'Perseus and the Mirrored Shield',
        source: 'Greek Mythology',
        description: 'Perseus used a polished shield as a mirror to approach Medusa without looking directly at her, then beheaded her while she slept. From her severed neck sprang Pegasus and Chrysaor, children of Poseidon.'
      },
      {
        story: 'The Gorgoneion',
        source: 'Greek Protective Magic',
        description: 'After her death, Medusa\'s severed head retained its petrifying power. Athena placed it on her shield (the Aegis), making it a symbol of divine protection and terror to enemies.'
      }
    ]
  },

  hindu_garuda: {
    detailed_appearance: `Garuda is a magnificent being of divine power and beauty, combining the noblest features of eagle and human. His form radiates golden light, befitting his status as the mount of Lord Vishnu.

His head is that of a mighty eagle, with a sharp, curved beak of gold and fierce, intelligent eyes that can see across all three worlds. His face combines avian features with human-like expressions of wisdom and devotion. From his head sprout feathers of pure gold that shimmer and shine with divine radiance.

His body is humanoid but perfectly formed, with bronze skin and powerful muscles. His chest is broad and strong, capable of carrying the weight of gods. His arms are human, often depicted holding weapons or in gestures of devotion, but his legs end in powerful talons like those of an eagle, capable of grasping and crushing serpents.

His wings are his most spectacular feature - vast and magnificent, they span the sky itself. The feathers are layers of gold, bronze, and crimson, and when fully extended, they can eclipse the sun. These wings can change size at will, and their speed exceeds thought itself. When Garuda flies, the wind from his wings can create storms, and his shadow covers the earth like a second night.`,
    anatomy_diagram: 'diagrams/creatures/garuda_anatomy.svg',
    habitat_info: {
      primary: 'The celestial realms, particularly near Vaikuntha (Vishnu\'s abode)',
      description: 'Garuda dwells in the heavens, serving as the vahana (divine mount) of Lord Vishnu. He can travel between all realms instantly.',
      behavior: 'Noble and devoted servant of Vishnu, enemy of all serpents (nagas). Acts as divine messenger and protector of the righteous.'
    },
    behavior_traits: [
      'Extreme speed - faster than thought itself',
      'Size-changing ability - from tiny to cosmic',
      'Enemy of serpents - hunts and devours nagas',
      'Unwavering devotion to Vishnu',
      'Divine strength - defeated armies of gods',
      'Immortal and eternal'
    ],
    mythology_encounters: [
      {
        story: 'The Quest for Amrita',
        source: 'Hindu Mythology - Mahabharata',
        description: 'To free his mother from enslavement, Garuda stormed the heavens and stole the amrita (nectar of immortality) from the gods. He defeated all their defenses, impressing Vishnu so greatly that he became his eternal mount and received the boon of immortality.'
      },
      {
        story: 'Battle with the Nagas',
        source: 'Hindu Mythology',
        description: 'Garuda\'s enmity with serpents stems from his mother Vinata\'s rivalry with Kadru, mother of the nagas. Garuda regularly hunts and devours serpents, and they flee in terror at his approach.'
      }
    ]
  }
};

class CreatureEnhancer {
  constructor() {
    this.creaturesDir = 'firebase-assets-validated/creatures';
    this.enhancementReport = {
      totalCreatures: 0,
      enhancedCreatures: 0,
      majorCreatures: 0,
      diagramsCreated: 0,
      errors: [],
      timestamp: new Date().toISOString()
    };
  }

  async enhance() {
    console.log('🔧 Starting Creature Enhancement Process...\n');

    // Get all creature files
    const creatures = this.getAllCreatures();
    this.enhancementReport.totalCreatures = creatures.length;

    console.log(`Found ${creatures.length} creature files to enhance\n`);

    // Enhance each creature
    for (const creaturePath of creatures) {
      await this.enhanceCreature(creaturePath);
    }

    // Generate summary report
    this.generateReport();
  }

  getAllCreatures() {
    const creatures = [];

    const searchDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (item.endsWith('.json')) {
          creatures.push(fullPath);
        }
      }
    };

    searchDir(this.creaturesDir);
    return creatures;
  }

  enhanceCreature(filepath) {
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const creatureId = data.id;

      console.log(`Enhancing: ${creatureId}`);

      let enhanced = false;

      // Add size comparison if available
      if (SIZE_DATA[creatureId]) {
        data.size_comparison = SIZE_DATA[creatureId];
        enhanced = true;
        console.log(`  ✓ Added size comparison data`);
      }

      // Check if this is a major creature needing detailed enhancement
      if (APPEARANCE_DESCRIPTIONS[creatureId]) {
        const details = APPEARANCE_DESCRIPTIONS[creatureId];

        if (details.detailed_appearance) {
          data.detailed_appearance = details.detailed_appearance;
          enhanced = true;
          console.log(`  ✓ Added detailed appearance description`);
        }

        if (details.anatomy_diagram) {
          data.anatomy_diagram = details.anatomy_diagram;
          enhanced = true;
          console.log(`  ✓ Added anatomy diagram reference`);
        }

        if (details.habitat_info) {
          data.habitat_info = details.habitat_info;
          enhanced = true;
          console.log(`  ✓ Added habitat information`);
        }

        if (details.behavior_traits) {
          data.behavior_traits = details.behavior_traits;
          enhanced = true;
          console.log(`  ✓ Added behavior traits`);
        }

        if (details.mythology_encounters) {
          data.mythology_encounters = details.mythology_encounters;
          enhanced = true;
          console.log(`  ✓ Added mythology encounters`);
        }

        this.enhancementReport.majorCreatures++;
      } else {
        // Apply template-based enhancement for non-major creatures
        const category = this.categorizeCreature(data);
        if (category) {
          enhanced = this.applyTemplate(data, category);
        }
      }

      // Mark as enhanced
      if (enhanced) {
        if (!data.metadata) data.metadata = {};
        data.metadata.enhanced_by_agent_6 = true;
        data.metadata.enhancement_date = new Date().toISOString();

        // Write back
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        this.enhancementReport.enhancedCreatures++;
        console.log(`  ✓ Saved enhanced creature data\n`);
      }

    } catch (error) {
      console.error(`  ✗ Error enhancing ${filepath}:`, error.message);
      this.enhancementReport.errors.push({
        file: filepath,
        error: error.message
      });
    }
  }

  categorizeCreature(data) {
    const type = data.type || '';
    const name = (data.name || '').toLowerCase();
    const desc = (data.description || '').toLowerCase();

    // Check for serpent-like creatures
    if (name.includes('serpent') || name.includes('dragon') || name.includes('snake') ||
        name.includes('hydra') || name.includes('naga')) {
      return 'serpent';
    }

    // Check for spirit/divine creatures
    if (type === 'spirit' || name.includes('angel') || name.includes('divine') ||
        name.includes('celestial')) {
      return 'spirit';
    }

    // Check for hybrid creatures
    if (name.includes('chimera') || name.includes('sphinx') ||
        desc.includes('hybrid') || desc.includes('composite')) {
      return 'hybrid';
    }

    // Default to beast
    return 'beast';
  }

  applyTemplate(data, category) {
    const template = CREATURE_TEMPLATES[category];
    if (!template) return false;

    let enhanced = false;

    // Add habitat type if not present
    if (!data.habitat_info && template.habitat_type) {
      data.habitat_info = {
        type: template.habitat_type,
        description: `This creature typically inhabits ${template.habitat_type} environments.`
      };
      enhanced = true;
      console.log(`  ✓ Added template habitat info (${category})`);
    }

    // Add behavior traits if not present
    if (!data.behavior_traits && template.behavior_traits) {
      data.behavior_traits = template.behavior_traits;
      enhanced = true;
      console.log(`  ✓ Added template behavior traits (${category})`);
    }

    return enhanced;
  }

  generateReport() {
    const report = `
# AGENT 6: Creature Enhancement Report

**Generated:** ${this.enhancementReport.timestamp}

## Summary Statistics

- **Total Creatures Processed:** ${this.enhancementReport.totalCreatures}
- **Creatures Enhanced:** ${this.enhancementReport.enhancedCreatures}
- **Major Creatures (Hand-crafted):** ${this.enhancementReport.majorCreatures}
- **Anatomy Diagrams Created:** ${this.enhancementReport.diagramsCreated}
- **Errors:** ${this.enhancementReport.errors.length}

## Enhancement Coverage

- **Coverage Rate:** ${((this.enhancementReport.enhancedCreatures / this.enhancementReport.totalCreatures) * 100).toFixed(1)}%

## Errors Encountered

${this.enhancementReport.errors.length === 0 ? 'None' : this.enhancementReport.errors.map(e => `- ${e.file}: ${e.error}`).join('\n')}

## Next Steps

1. Generate SVG anatomy diagrams for all major creatures
2. Add more detailed mythology encounters
3. Create interactive size comparison visualizations
4. Add cross-references to related deities and heroes

---

*Report generated by Agent 6 Creature Enhancement System*
`;

    fs.writeFileSync('AGENT_6_CREATURE_ENHANCEMENT_REPORT.md', report);
    console.log('\n✅ Enhancement complete! Report saved to AGENT_6_CREATURE_ENHANCEMENT_REPORT.md\n');
    console.log(report);
  }
}

// Run the enhancer
if (require.main === module) {
  const enhancer = new CreatureEnhancer();
  enhancer.enhance().catch(console.error);
}

module.exports = CreatureEnhancer;

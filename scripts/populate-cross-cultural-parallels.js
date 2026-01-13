const fs = require('fs').promises;
const path = require('path');

/**
 * Populate Cross-Cultural Parallels
 *
 * Automatically populates cross_cultural_parallels field for deities
 * based on archetype matching and domain analysis.
 */

class CrossCulturalPopulator {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.deities = new Map();
    this.stats = {
      totalDeities: 0,
      alreadyHasParallels: 0,
      parallelAdded: 0,
      noArchetypeMatch: 0,
      filesModified: 0
    };

    // Archetype definitions (from mythology-comparisons.js)
    this.archetypes = {
      'sky-father': {
        name: 'Sky Father',
        attributes: ['sky', 'thunder', 'lightning', 'king', 'father', 'ruler', 'supreme', 'heavens', 'sovereignty'],
        domains: ['sky', 'weather', 'leadership', 'justice', 'kingship', 'sovereignty'],
        examples: {
          greek: ['zeus'],
          norse: ['odin', 'thor'],
          roman: ['jupiter'],
          hindu: ['indra', 'dyaus'],
          egyptian: ['amun-ra', 'amun', 'ra'],
          sumerian: ['an', 'anu'],
          babylonian: ['marduk'],
          celtic: ['dagda'],
          chinese: ['jade-emperor', 'chinese_jade-emperor'],
          slavic: ['perun']
        }
      },
      'earth-mother': {
        name: 'Earth Mother',
        attributes: ['earth', 'mother', 'fertility', 'nature', 'creation', 'life', 'nurture', 'goddess'],
        domains: ['earth', 'fertility', 'agriculture', 'motherhood', 'nature'],
        examples: {
          greek: ['gaia', 'demeter', 'rhea'],
          norse: ['frigg', 'freyja', 'jord'],
          roman: ['terra', 'ceres'],
          hindu: ['prithvi', 'parvati'],
          egyptian: ['isis', 'nut', 'hathor'],
          sumerian: ['ki', 'ninhursag'],
          celtic: ['danu', 'brigid'],
          aztec: ['coatlicue', 'tlazolteotl']
        }
      },
      'trickster': {
        name: 'Trickster',
        attributes: ['cunning', 'mischief', 'clever', 'shapeshifter', 'deceit', 'wit', 'chaos', 'trickery'],
        domains: ['trickery', 'cunning', 'transformation', 'chaos', 'mischief'],
        examples: {
          norse: ['loki'],
          greek: ['hermes', 'prometheus'],
          celtic: ['anansi'],
          yoruba: ['eshu', 'elegua'],
          native_american: ['coyote'],
          egyptian: ['set'],
          japanese: ['susanoo'],
          polynesian: ['maui']
        }
      },
      'war-god': {
        name: 'War God',
        attributes: ['war', 'battle', 'warrior', 'strength', 'combat', 'violence', 'courage', 'military'],
        domains: ['war', 'battle', 'combat', 'strategy', 'warriors', 'victory'],
        examples: {
          greek: ['ares', 'athena'],
          roman: ['mars', 'bellona'],
          norse: ['tyr', 'odin'],
          aztec: ['huitzilopochtli'],
          hindu: ['kartikeya', 'durga'],
          egyptian: ['montu', 'sekhmet'],
          celtic: ['morrigan', 'nuada'],
          japanese: ['hachiman', 'bishamonten']
        }
      },
      'underworld-ruler': {
        name: 'Underworld Ruler',
        attributes: ['death', 'underworld', 'afterlife', 'dead', 'souls', 'judgment', 'darkness', 'netherworld'],
        domains: ['death', 'underworld', 'afterlife', 'judgment', 'souls'],
        examples: {
          greek: ['hades', 'persephone'],
          egyptian: ['osiris', 'anubis'],
          norse: ['hel'],
          hindu: ['yama'],
          aztec: ['mictlantecuhtli', 'mictecacihuatl'],
          sumerian: ['ereshkigal', 'nergal'],
          japanese: ['izanami', 'emma-o'],
          celtic: ['arawn']
        }
      },
      'love-goddess': {
        name: 'Love Deity',
        attributes: ['love', 'beauty', 'desire', 'passion', 'romance', 'attraction', 'pleasure', 'fertility'],
        domains: ['love', 'beauty', 'desire', 'sexuality', 'fertility'],
        examples: {
          greek: ['aphrodite', 'eros'],
          roman: ['venus', 'cupid'],
          norse: ['freyja'],
          hindu: ['rati', 'kama'],
          mesopotamian: ['ishtar', 'inanna'],
          egyptian: ['hathor', 'bastet'],
          aztec: ['xochiquetzal'],
          celtic: ['aine']
        }
      },
      'sun-deity': {
        name: 'Sun Deity',
        attributes: ['sun', 'light', 'day', 'solar', 'radiance', 'illumination', 'heat', 'dawn'],
        domains: ['sun', 'light', 'day', 'time', 'dawn'],
        examples: {
          greek: ['helios', 'apollo'],
          egyptian: ['ra', 'aten', 'khepri'],
          norse: ['sol'],
          hindu: ['surya', 'savitri'],
          aztec: ['tonatiuh'],
          japanese: ['amaterasu'],
          inca: ['inti'],
          persian: ['mithra']
        }
      },
      'wisdom-deity': {
        name: 'Wisdom Deity',
        attributes: ['wisdom', 'knowledge', 'learning', 'intelligence', 'craft', 'strategy', 'skill', 'magic'],
        domains: ['wisdom', 'knowledge', 'crafts', 'strategy', 'writing', 'magic'],
        examples: {
          greek: ['athena', 'hermes'],
          norse: ['odin', 'mimir'],
          egyptian: ['thoth', 'imhotep'],
          hindu: ['saraswati', 'ganesha'],
          mesopotamian: ['nabu', 'enki'],
          celtic: ['ogma'],
          mayan: ['itzamna']
        }
      },
      'sea-god': {
        name: 'Sea God',
        attributes: ['sea', 'ocean', 'water', 'storms', 'waves', 'maritime', 'depths', 'sailors'],
        domains: ['sea', 'ocean', 'water', 'storms', 'sailors'],
        examples: {
          greek: ['poseidon'],
          roman: ['neptune'],
          norse: ['aegir', 'njord'],
          hindu: ['varuna'],
          celtic: ['manannan', 'lir'],
          japanese: ['watatsumi', 'ryujin'],
          polynesian: ['tangaroa'],
          african: ['yemoja', 'olokun']
        }
      },
      'moon-deity': {
        name: 'Moon Deity',
        attributes: ['moon', 'lunar', 'night', 'cycles', 'tides', 'dreams', 'mystery'],
        domains: ['moon', 'night', 'cycles', 'dreams', 'divination'],
        examples: {
          greek: ['selene', 'artemis', 'hecate'],
          roman: ['luna', 'diana'],
          egyptian: ['khonsu', 'thoth'],
          hindu: ['chandra', 'soma'],
          japanese: ['tsukuyomi'],
          aztec: ['coyolxauhqui'],
          sumerian: ['nanna', 'sin']
        }
      },
      'forge-god': {
        name: 'Forge God',
        attributes: ['forge', 'smith', 'craft', 'metalwork', 'fire', 'creation', 'tools', 'weapons'],
        domains: ['smithing', 'crafts', 'metalwork', 'fire', 'weapons'],
        examples: {
          greek: ['hephaestus'],
          roman: ['vulcan'],
          norse: ['brokkr', 'sindri'],
          celtic: ['goibniu', 'credne'],
          slavic: ['svarog'],
          hindu: ['vishvakarman']
        }
      },
      'harvest-deity': {
        name: 'Harvest Deity',
        attributes: ['harvest', 'agriculture', 'grain', 'crops', 'seasons', 'abundance', 'farming'],
        domains: ['agriculture', 'harvest', 'seasons', 'abundance'],
        examples: {
          greek: ['demeter'],
          roman: ['ceres'],
          egyptian: ['osiris', 'renenutet'],
          aztec: ['chicomecoatl', 'centeotl'],
          celtic: ['cernunnos'],
          chinese: ['shennong']
        }
      }
    };
  }

  async loadDeities() {
    console.log('Loading deity assets...');
    const deitiesPath = path.join(this.assetsPath, 'deities');

    const entries = await fs.readdir(deitiesPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      if (!entry.name.endsWith('.json')) continue;

      const filePath = path.join(deitiesPath, entry.name);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          for (const deity of data) {
            if (deity?.id) {
              this.deities.set(deity.id, { deity, filePath, isArray: true });
            }
          }
        } else if (data.id) {
          this.deities.set(data.id, { deity: data, filePath, isArray: false });
        }
      } catch (error) {
        // Skip invalid files
      }
    }

    console.log(`Loaded ${this.deities.size} deities`);
  }

  matchArchetype(deity) {
    const deityDomains = (deity.domains || []).map(d => d.toLowerCase());
    const deityEpithets = (deity.epithets || []).map(e => e.toLowerCase());
    const deityDescription = (deity.description || '').toLowerCase();
    let deityAttributes = [];
    if (Array.isArray(deity.attributes)) {
      deityAttributes = deity.attributes.map(a =>
        typeof a === 'string' ? a.toLowerCase() : (a.name || '').toLowerCase()
      );
    } else if (typeof deity.attributes === 'object' && deity.attributes !== null) {
      // Handle object-based attributes
      deityAttributes = Object.keys(deity.attributes).map(k => k.toLowerCase());
    }

    const allAttributes = [...deityDomains, ...deityEpithets, ...deityAttributes];

    let bestMatch = null;
    let bestScore = 0;

    for (const [archetypeId, archetype] of Object.entries(this.archetypes)) {
      let score = 0;

      // Check domain overlap
      for (const domain of archetype.domains) {
        if (allAttributes.some(a => a.includes(domain))) {
          score += 2;
        }
        if (deityDescription.includes(domain)) {
          score += 1;
        }
      }

      // Check attribute overlap
      for (const attr of archetype.attributes) {
        if (allAttributes.some(a => a.includes(attr))) {
          score += 1;
        }
        if (deityDescription.includes(attr)) {
          score += 0.5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { archetypeId, archetype, score };
      }
    }

    return bestScore >= 2 ? bestMatch : null;
  }

  getMythology(deity) {
    // Try to determine mythology from various fields
    if (deity.mythology && typeof deity.mythology === 'string') {
      return deity.mythology.toLowerCase();
    }

    // Try to extract from ID
    const idParts = deity.id.split(/[_-]/);
    const mythologies = ['greek', 'norse', 'roman', 'hindu', 'egyptian', 'celtic',
                        'aztec', 'mayan', 'japanese', 'chinese', 'sumerian', 'babylonian',
                        'persian', 'slavic', 'yoruba', 'polynesian', 'buddhist', 'christian'];

    for (const myth of mythologies) {
      if (idParts[0].toLowerCase() === myth) {
        return myth;
      }
    }

    return null;
  }

  async populateParallels() {
    await this.loadDeities();

    console.log('\nPopulating cross-cultural parallels...\n');

    const modifiedFiles = new Map(); // filePath → modified deity data

    for (const [deityId, data] of this.deities) {
      const { deity, filePath } = data;
      this.stats.totalDeities++;

      // Skip if already has parallels
      if (deity.cross_cultural_parallels && deity.cross_cultural_parallels.length > 0) {
        this.stats.alreadyHasParallels++;
        continue;
      }

      // Match to archetype
      const match = this.matchArchetype(deity);
      if (!match) {
        this.stats.noArchetypeMatch++;
        continue;
      }

      const { archetype, score } = match;
      const mythology = this.getMythology(deity);

      // Build parallels from archetype examples
      const parallels = [];

      for (const [tradition, examples] of Object.entries(archetype.examples)) {
        // Skip own mythology
        if (tradition === mythology) continue;

        for (const example of examples) {
          // Check if this deity exists in our database
          if (this.deities.has(example) || this.deities.has(`${tradition}_${example}`)) {
            const actualId = this.deities.has(example) ? example : `${tradition}_${example}`;
            const parallelDeity = this.deities.get(actualId)?.deity;

            parallels.push({
              id: actualId,
              name: parallelDeity?.name || this.formatName(example),
              tradition: tradition.charAt(0).toUpperCase() + tradition.slice(1),
              archetype: archetype.name,
              relationship: 'parallel'
            });
          }
        }
      }

      if (parallels.length > 0) {
        deity.cross_cultural_parallels = parallels;
        this.stats.parallelAdded++;
        console.log(`  ${deityId}: Added ${parallels.length} parallels (${archetype.name})`);

        // Track modified file
        if (!modifiedFiles.has(filePath)) {
          modifiedFiles.set(filePath, []);
        }
        modifiedFiles.get(filePath).push(deity);
      }
    }

    // Save modified files
    if (!this.dryRun) {
      for (const [filePath, deities] of modifiedFiles) {
        // Read original file to check if it's an array or single object
        const content = await fs.readFile(filePath, 'utf8');
        const originalData = JSON.parse(content);

        if (Array.isArray(originalData)) {
          // Update deities in the array
          for (const modifiedDeity of deities) {
            const idx = originalData.findIndex(d => d.id === modifiedDeity.id);
            if (idx >= 0) {
              originalData[idx] = modifiedDeity;
            }
          }
          await fs.writeFile(filePath, JSON.stringify(originalData, null, 2));
        } else {
          // Single deity file - just save the modified deity
          await fs.writeFile(filePath, JSON.stringify(deities[0], null, 2));
        }
        this.stats.filesModified++;
      }
    } else {
      this.stats.filesModified = modifiedFiles.size;
    }

    this.printReport();
  }

  formatName(id) {
    return id
      .replace(/^[a-z]+_/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('CROSS-CULTURAL PARALLELS REPORT');
    console.log('='.repeat(60));
    console.log(`\nDeities Processed:`);
    console.log(`  Total deities: ${this.stats.totalDeities}`);
    console.log(`  Already had parallels: ${this.stats.alreadyHasParallels}`);
    console.log(`  Parallels added: ${this.stats.parallelAdded}`);
    console.log(`  No archetype match: ${this.stats.noArchetypeMatch}`);
    console.log(`  Files modified: ${this.stats.filesModified}`);

    const coverage = ((this.stats.alreadyHasParallels + this.stats.parallelAdded) /
                     this.stats.totalDeities * 100).toFixed(1);
    console.log(`\nCoverage: ${coverage}%`);
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to apply changes');
    }
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const populator = new CrossCulturalPopulator(assetsPath, dryRun);

  try {
    await populator.populateParallels();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CrossCulturalPopulator };

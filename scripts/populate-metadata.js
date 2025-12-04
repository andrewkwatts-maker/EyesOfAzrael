#!/usr/bin/env node

/**
 * Metadata Population Tool
 *
 * Helps populate temporal, geographical, and influence metadata for entities.
 * Can work in interactive mode or batch mode.
 *
 * Usage:
 *   node scripts/populate-metadata.js --interactive
 *   node scripts/populate-metadata.js --entity deity/zeus
 *   node scripts/populate-metadata.js --batch --category place
 *   node scripts/populate-metadata.js --audit
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Known geographical centers for mythologies (for entities without specific locations)
const MYTHOLOGY_CENTERS = {
  greek: { lat: 38.0, lon: 23.0, name: 'Greece', radius: 500 },
  norse: { lat: 60.0, lon: 10.0, name: 'Scandinavia', radius: 600 },
  egyptian: { lat: 26.0, lon: 32.0, name: 'Egypt', radius: 400 },
  hindu: { lat: 20.0, lon: 78.0, name: 'India', radius: 800 },
  celtic: { lat: 53.0, lon: -8.0, name: 'Ireland/Britain', radius: 500 },
  chinese: { lat: 35.0, lon: 105.0, name: 'China', radius: 1000 },
  japanese: { lat: 36.0, lon: 138.0, name: 'Japan', radius: 300 },
  jewish: { lat: 31.5, lon: 35.0, name: 'Israel/Judea', radius: 300 },
  roman: { lat: 41.9, lon: 12.5, name: 'Rome/Italy', radius: 600 },
  mesopotamian: { lat: 33.0, lon: 44.0, name: 'Mesopotamia', radius: 500 },
  persian: { lat: 32.0, lon: 53.0, name: 'Persia/Iran', radius: 700 }
};

// Typical date ranges for mythologies (for first attestation estimates)
const MYTHOLOGY_DATE_RANGES = {
  greek: { start: -800, peak: -450, end: 400, literary: -750 },
  norse: { start: -500, peak: 900, end: 1100, literary: 1200 },
  egyptian: { start: -3000, peak: -1500, end: 400, literary: -2500 },
  hindu: { start: -1500, peak: -500, end: 1500, literary: -1200 },
  celtic: { start: -500, peak: 100, end: 500, literary: -300 },
  chinese: { start: -1500, peak: -500, end: 1500, literary: -1000 },
  japanese: { start: -300, peak: 700, end: 1500, literary: 700 },
  jewish: { start: -1200, peak: -500, end: 70, literary: -800 },
  roman: { start: -500, peak: 100, end: 400, literary: -100 },
  mesopotamian: { start: -3000, peak: -2000, end: -500, literary: -2500 },
  persian: { start: -1000, peak: -500, end: 600, literary: -600 }
};

class MetadataPopulator {
  constructor() {
    this.entityDir = path.join(__dirname, '..', 'data', 'entities');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Load an entity
  loadEntity(category, id) {
    const filePath = path.join(this.entityDir, category, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Entity not found: ${category}/${id}`);
    }
    return {
      data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
      path: filePath,
      category,
      id
    };
  }

  // Save an entity
  saveEntity(entity) {
    const backup = entity.path + '.backup-' + Date.now();
    fs.copyFileSync(entity.path, backup);
    fs.writeFileSync(entity.path, JSON.stringify(entity.data, null, 2));
    console.log(`✅ Saved ${entity.category}/${entity.id}`);
    console.log(`   Backup: ${path.basename(backup)}`);
  }

  // Audit metadata completeness
  audit() {
    console.log('📊 METADATA COMPLETENESS AUDIT\n');

    const categories = fs.readdirSync(this.entityDir).filter(f =>
      fs.statSync(path.join(this.entityDir, f)).isDirectory()
    );

    const stats = {
      total: 0,
      withLinguistic: 0,
      withGeographical: 0,
      withTemporal: 0,
      withInfluences: 0,
      byCategory: {},
      missing: {
        linguistic: [],
        geographical: [],
        temporal: [],
        influences: []
      }
    };

    categories.forEach(cat => {
      stats.byCategory[cat] = {
        total: 0,
        withLinguistic: 0,
        withGeographical: 0,
        withTemporal: 0,
        withInfluences: 0
      };

      const files = fs.readdirSync(path.join(this.entityDir, cat))
        .filter(f => f.endsWith('.json'));

      files.forEach(file => {
        const entity = JSON.parse(
          fs.readFileSync(path.join(this.entityDir, cat, file), 'utf8')
        );

        stats.total++;
        stats.byCategory[cat].total++;

        const hasLinguistic = entity.linguistic?.originalName ||
                             entity.linguistic?.transliteration;
        const hasGeographical = entity.geographical?.originPoint ||
                               entity.geographical?.region;
        const hasTemporal = entity.temporal?.firstAttestation ||
                           entity.temporal?.historicalDate;
        const hasInfluences = entity.influences?.influencedBy?.length > 0 ||
                             entity.influences?.influenced?.length > 0;

        if (hasLinguistic) {
          stats.withLinguistic++;
          stats.byCategory[cat].withLinguistic++;
        } else if (stats.missing.linguistic.length < 10) {
          stats.missing.linguistic.push(`${cat}/${entity.id || file.replace('.json', '')}`);
        }

        if (hasGeographical) {
          stats.withGeographical++;
          stats.byCategory[cat].withGeographical++;
        } else if (stats.missing.geographical.length < 10) {
          stats.missing.geographical.push(`${cat}/${entity.id || file.replace('.json', '')}`);
        }

        if (hasTemporal) {
          stats.withTemporal++;
          stats.byCategory[cat].withTemporal++;
        } else if (stats.missing.temporal.length < 10) {
          stats.missing.temporal.push(`${cat}/${entity.id || file.replace('.json', '')}`);
        }

        if (hasInfluences) {
          stats.withInfluences++;
          stats.byCategory[cat].withInfluences++;
        } else if (stats.missing.influences.length < 10) {
          stats.missing.influences.push(`${cat}/${entity.id || file.replace('.json', '')}`);
        }
      });
    });

    console.log(`Total Entities: ${stats.total}\n`);
    console.log(`Linguistic Data:    ${stats.withLinguistic.toString().padStart(4)} (${Math.round(stats.withLinguistic/stats.total*100)}%)`);
    console.log(`Geographical Data:  ${stats.withGeographical.toString().padStart(4)} (${Math.round(stats.withGeographical/stats.total*100)}%)`);
    console.log(`Temporal Data:      ${stats.withTemporal.toString().padStart(4)} (${Math.round(stats.withTemporal/stats.total*100)}%)`);
    console.log(`Influence Data:     ${stats.withInfluences.toString().padStart(4)} (${Math.round(stats.withInfluences/stats.total*100)}%)`);

    console.log('\n📂 BY CATEGORY:\n');
    Object.keys(stats.byCategory).sort().forEach(cat => {
      const s = stats.byCategory[cat];
      console.log(`${cat.padEnd(12)} ${s.total.toString().padStart(3)} entities | ` +
        `Ling:${Math.round(s.withLinguistic/s.total*100)}% ` +
        `Geo:${Math.round(s.withGeographical/s.total*100)}% ` +
        `Temp:${Math.round(s.withTemporal/s.total*100)}% ` +
        `Infl:${Math.round(s.withInfluences/s.total*100)}%`);
    });

    console.log('\n❌ SAMPLE ENTITIES MISSING DATA:\n');
    console.log('Linguistic:', stats.missing.linguistic.slice(0, 5).join(', '));
    console.log('Geographical:', stats.missing.geographical.slice(0, 5).join(', '));
    console.log('Temporal:', stats.missing.temporal.slice(0, 5).join(', '));
    console.log('Influences:', stats.missing.influences.slice(0, 5).join(', '));

    return stats;
  }

  // Generate default metadata based on entity type and mythology
  generateDefaults(entity) {
    const data = entity.data;
    const mythology = data.primaryMythology || data.mythologies?.[0];

    if (!mythology) {
      console.log('⚠️  No mythology found, cannot generate defaults');
      return null;
    }

    const defaults = {
      linguistic: {},
      geographical: {},
      temporal: {},
      influences: {}
    };

    // Linguistic defaults
    if (!data.linguistic?.originalName) {
      defaults.linguistic.originalName = data.name;
      defaults.linguistic.transliteration = data.name;
      defaults.linguistic.needsResearch = true;
    }

    // Geographical defaults
    if (!data.geographical?.region) {
      const center = MYTHOLOGY_CENTERS[mythology];
      if (center) {
        defaults.geographical.region = center.name;
        defaults.geographical.culturalArea = this.getCulturalArea(mythology);

        if (entity.category === 'place') {
          defaults.geographical.originPoint = {
            name: data.name,
            coordinates: {
              latitude: center.lat,
              longitude: center.lon,
              accuracy: 'regional'
            },
            description: `Location within ${center.name} region`,
            needsResearch: true
          };
        }
      }
    }

    // Temporal defaults
    if (!data.temporal?.firstAttestation) {
      const dates = MYTHOLOGY_DATE_RANGES[mythology];
      if (dates) {
        defaults.temporal.firstAttestation = {
          date: {
            year: dates.literary,
            circa: true,
            uncertainty: 100,
            display: `c. ${Math.abs(dates.literary)} ${dates.literary < 0 ? 'BCE' : 'CE'}`,
            confidence: 'speculative'
          },
          type: 'literary',
          description: 'Estimated based on mythology literary tradition',
          needsResearch: true
        };

        defaults.temporal.historicalDate = {
          start: {
            year: dates.start,
            circa: true,
            uncertainty: 200,
            display: `c. ${Math.abs(dates.start)} BCE`
          },
          end: {
            year: dates.end,
            circa: true,
            uncertainty: 100,
            display: `c. ${Math.abs(dates.end)} ${dates.end < 0 ? 'BCE' : 'CE'}`
          },
          display: `${Math.abs(dates.start)} BCE - ${Math.abs(dates.end)} ${dates.end < 0 ? 'BCE' : 'CE'}`,
          needsResearch: true
        };
      }
    }

    return defaults;
  }

  getCulturalArea(mythology) {
    const areas = {
      greek: 'Hellenic World',
      roman: 'Roman Empire',
      norse: 'Germanic/Scandinavian',
      celtic: 'Celtic Europe',
      egyptian: 'Ancient Near East',
      mesopotamian: 'Ancient Near East',
      persian: 'Iranian Plateau',
      hindu: 'Indian Subcontinent',
      chinese: 'East Asia',
      japanese: 'East Asia',
      jewish: 'Ancient Near East'
    };
    return areas[mythology] || 'Unknown';
  }

  // Interactive mode
  async interactive() {
    console.log('🔧 INTERACTIVE METADATA POPULATOR\n');
    console.log('Commands:');
    console.log('  load <category>/<id>  - Load an entity');
    console.log('  show                  - Show current entity');
    console.log('  defaults              - Generate default metadata');
    console.log('  save                  - Save current entity');
    console.log('  audit                 - Run audit');
    console.log('  quit                  - Exit\n');

    let currentEntity = null;

    const processCommand = async (line) => {
      const [cmd, ...args] = line.trim().split(' ');

      try {
        switch (cmd) {
          case 'load':
            if (!args[0] || !args[0].includes('/')) {
              console.log('Usage: load <category>/<id>');
              break;
            }
            const [category, id] = args[0].split('/');
            currentEntity = this.loadEntity(category, id);
            console.log(`✅ Loaded ${currentEntity.data.name}`);
            console.log(`   Type: ${currentEntity.data.type}`);
            console.log(`   Mythology: ${currentEntity.data.primaryMythology || currentEntity.data.mythologies?.join(', ')}`);
            break;

          case 'show':
            if (!currentEntity) {
              console.log('No entity loaded');
              break;
            }
            console.log(JSON.stringify(currentEntity.data, null, 2));
            break;

          case 'defaults':
            if (!currentEntity) {
              console.log('No entity loaded');
              break;
            }
            const defaults = this.generateDefaults(currentEntity);
            console.log('Generated defaults:');
            console.log(JSON.stringify(defaults, null, 2));

            // Merge defaults
            currentEntity.data.linguistic = {
              ...defaults.linguistic,
              ...currentEntity.data.linguistic
            };
            currentEntity.data.geographical = {
              ...defaults.geographical,
              ...currentEntity.data.geographical
            };
            currentEntity.data.temporal = {
              ...defaults.temporal,
              ...currentEntity.data.temporal
            };
            currentEntity.data.influences = {
              ...defaults.influences,
              ...currentEntity.data.influences
            };
            console.log('✅ Merged defaults into entity');
            break;

          case 'save':
            if (!currentEntity) {
              console.log('No entity loaded');
              break;
            }
            this.saveEntity(currentEntity);
            break;

          case 'audit':
            this.audit();
            break;

          case 'quit':
          case 'exit':
            this.rl.close();
            process.exit(0);
            break;

          default:
            console.log('Unknown command');
        }
      } catch (error) {
        console.error('Error:', error.message);
      }

      this.rl.prompt();
    };

    this.rl.prompt();
    this.rl.on('line', processCommand);
  }

  // Batch mode - generate defaults for all entities in a category
  async batchGenerateDefaults(category) {
    console.log(`🔄 Batch generating defaults for category: ${category}\n`);

    const catPath = path.join(this.entityDir, category);
    if (!fs.existsSync(catPath)) {
      console.log(`Category not found: ${category}`);
      return;
    }

    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} entities\n`);

    let processed = 0;
    let updated = 0;

    for (const file of files) {
      const id = file.replace('.json', '');
      try {
        const entity = this.loadEntity(category, id);
        const defaults = this.generateDefaults(entity);

        if (defaults) {
          // Only update if there's missing data
          let hasUpdates = false;

          if (defaults.linguistic.needsResearch && !entity.data.linguistic) {
            entity.data.linguistic = defaults.linguistic;
            hasUpdates = true;
          }

          if (defaults.geographical.needsResearch || !entity.data.geographical?.region) {
            entity.data.geographical = {
              ...defaults.geographical,
              ...entity.data.geographical
            };
            hasUpdates = true;
          }

          if (defaults.temporal.firstAttestation?.needsResearch && !entity.data.temporal?.firstAttestation) {
            entity.data.temporal = {
              ...defaults.temporal,
              ...entity.data.temporal
            };
            hasUpdates = true;
          }

          if (hasUpdates) {
            this.saveEntity(entity);
            updated++;
          }
        }

        processed++;
        process.stdout.write(`\rProcessed: ${processed}/${files.length} | Updated: ${updated}`);
      } catch (error) {
        console.error(`\n❌ Error processing ${id}:`, error.message);
      }
    }

    console.log(`\n\n✅ Batch complete: ${updated}/${processed} entities updated`);
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const populator = new MetadataPopulator();

  if (args.includes('--audit')) {
    populator.audit();
  } else if (args.includes('--interactive')) {
    await populator.interactive();
  } else if (args.includes('--batch')) {
    const categoryIdx = args.indexOf('--category');
    if (categoryIdx === -1 || !args[categoryIdx + 1]) {
      console.error('Error: --batch requires --category <name>');
      process.exit(1);
    }
    await populator.batchGenerateDefaults(args[categoryIdx + 1]);
  } else if (args.includes('--entity')) {
    const entityIdx = args.indexOf('--entity');
    if (entityIdx === -1 || !args[entityIdx + 1]) {
      console.error('Error: --entity requires <category>/<id>');
      process.exit(1);
    }
    const [category, id] = args[entityIdx + 1].split('/');
    const entity = populator.loadEntity(category, id);
    const defaults = populator.generateDefaults(entity);
    console.log(JSON.stringify(defaults, null, 2));
  } else {
    console.log('Usage:');
    console.log('  node populate-metadata.js --audit');
    console.log('  node populate-metadata.js --interactive');
    console.log('  node populate-metadata.js --batch --category <category>');
    console.log('  node populate-metadata.js --entity <category>/<id>');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MetadataPopulator };

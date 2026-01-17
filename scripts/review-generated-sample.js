/**
 * Review Generated Sample
 *
 * Displays a random sample of generated entities for manual review.
 * Helps verify quality before committing to the database.
 *
 * Usage:
 *   node scripts/review-generated-sample.js [--count=10]
 */

const fs = require('fs').promises;
const path = require('path');

const PREVIEW_DIR = path.join(__dirname, '..', 'generated-entities-preview');

class SampleReviewer {
  constructor(sampleCount = 10) {
    this.sampleCount = sampleCount;
    this.entities = [];
  }

  async loadEntities() {
    try {
      const categories = await fs.readdir(PREVIEW_DIR);
      for (const category of categories) {
        const categoryPath = path.join(PREVIEW_DIR, category);
        try {
          const stat = await fs.stat(categoryPath);
          if (!stat.isDirectory()) continue;

          const files = await fs.readdir(categoryPath);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(categoryPath, file);
              try {
                const content = await fs.readFile(filePath, 'utf8');
                const entity = JSON.parse(content);
                this.entities.push({
                  entity,
                  category,
                  fileName: file
                });
              } catch (error) {
                // Skip parse errors
              }
            }
          }
        } catch {
          continue;
        }
      }
      console.log('Loaded ' + this.entities.length + ' generated entities\n');
    } catch (error) {
      console.error('Error loading entities: ' + error.message);
    }
  }

  selectRandomSample() {
    const shuffled = [...this.entities].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, this.sampleCount);
  }

  displayEntity(item, index) {
    const { entity, category, fileName } = item;
    const separator = '='.repeat(70);
    const subSeparator = '-'.repeat(50);

    console.log('\n' + separator);
    console.log('SAMPLE ' + (index + 1) + '/' + this.sampleCount + ': ' + category + '/' + fileName);
    console.log(separator);

    console.log('\nBASIC INFO:');
    console.log('  ID: ' + entity.id);
    console.log('  Name: ' + entity.name);
    console.log('  Type: ' + entity.type);
    console.log('  Mythology: ' + entity.mythology);

    console.log('\nSHORT DESCRIPTION:');
    console.log('  ' + (entity.shortDescription || 'N/A'));

    console.log('\nDESCRIPTION (' + (entity.description || '').length + ' chars):');
    const desc = entity.description || 'N/A';
    // Word wrap at 70 chars
    const words = desc.split(' ');
    let line = '  ';
    for (const word of words) {
      if (line.length + word.length > 72) {
        console.log(line);
        line = '  ' + word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) console.log(line);

    // Type-specific fields
    console.log('\n' + subSeparator);
    console.log('TYPE-SPECIFIC FIELDS:');

    if (entity.domains && entity.domains.length) {
      console.log('  Domains: ' + entity.domains.join(', '));
    }
    if (entity.symbols && entity.symbols.length) {
      console.log('  Symbols: ' + entity.symbols.join(', '));
    }
    if (entity.epithets && entity.epithets.length) {
      console.log('  Epithets: ' + entity.epithets.join(', '));
    }
    if (entity.quests && entity.quests.length) {
      console.log('  Quests:');
      entity.quests.slice(0, 3).forEach(q => console.log('    - ' + q));
    }
    if (entity.abilities && entity.abilities.length) {
      console.log('  Abilities: ' + entity.abilities.join(', '));
    }
    if (entity.classification) {
      console.log('  Classification: ' + entity.classification);
    }
    if (entity.category) {
      console.log('  Category: ' + entity.category);
    }
    if (entity.gender) {
      console.log('  Gender: ' + entity.gender);
    }

    // Related entities
    if (entity.relatedEntities) {
      console.log('\n' + subSeparator);
      console.log('RELATED ENTITIES:');
      for (const [cat, entities] of Object.entries(entity.relatedEntities)) {
        if (Array.isArray(entities) && entities.length > 0) {
          console.log('  ' + cat + ':');
          entities.slice(0, 3).forEach(e => {
            console.log('    - ' + e.name + ' (' + e.id + ') [' + (e.relationship || 'associated') + ']');
          });
        }
      }
    }

    // Sources
    if (entity.sources && entity.sources.length) {
      console.log('\n' + subSeparator);
      console.log('SOURCES:');
      entity.sources.slice(0, 3).forEach(s => {
        console.log('  - "' + s.title + '"' + (s.author ? ' by ' + s.author : ''));
      });
    }

    // Quality indicators
    console.log('\n' + subSeparator);
    console.log('QUALITY CHECKS:');

    const issues = [];
    const warnings = [];

    if (!entity.description || entity.description.length < 200) {
      issues.push('Description too short');
    } else if (entity.description.length < 500) {
      warnings.push('Description below 500 chars');
    }

    if (!entity.sources || entity.sources.length === 0) {
      warnings.push('No sources');
    }

    if (!entity.relatedEntities || Object.keys(entity.relatedEntities).length === 0) {
      warnings.push('No related entities');
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('  [PASS] All quality checks passed');
    } else {
      if (issues.length > 0) {
        console.log('  [ERROR] ' + issues.join(', '));
      }
      if (warnings.length > 0) {
        console.log('  [WARN] ' + warnings.join(', '));
      }
    }
  }

  async review() {
    await this.loadEntities();

    if (this.entities.length === 0) {
      console.log('No generated entities found in ' + PREVIEW_DIR);
      return;
    }

    const sample = this.selectRandomSample();

    console.log('Showing ' + sample.length + ' random samples from ' + this.entities.length + ' generated entities');
    console.log('Use this to verify content quality before committing.\n');

    for (let i = 0; i < sample.length; i++) {
      this.displayEntity(sample[i], i);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('REVIEW SUMMARY');
    console.log('='.repeat(70));
    console.log('Reviewed: ' + sample.length + ' entities');
    console.log('Total generated: ' + this.entities.length);

    // Type distribution in sample
    const types = {};
    for (const item of sample) {
      types[item.entity.type] = (types[item.entity.type] || 0) + 1;
    }
    console.log('\nTypes in sample:');
    for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
      console.log('  ' + type + ': ' + count);
    }

    // Mythology distribution in sample
    const myths = {};
    for (const item of sample) {
      myths[item.entity.mythology] = (myths[item.entity.mythology] || 0) + 1;
    }
    console.log('\nMythologies in sample:');
    for (const [myth, count] of Object.entries(myths).sort((a, b) => b[1] - a[1])) {
      console.log('  ' + myth + ': ' + count);
    }

    console.log('\nTo commit these entities to the database, run:');
    console.log('  node scripts/commit-generated-entities.js');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const countArg = args.find(a => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1]) : 10;

  const reviewer = new SampleReviewer(count);
  await reviewer.review();
}

main().catch(console.error);

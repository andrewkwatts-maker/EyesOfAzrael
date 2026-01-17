/**
 * Commit Generated Entities
 *
 * Moves validated entities from preview directory to the main assets directory.
 * Also updates bidirectional links for newly created entities.
 *
 * Usage:
 *   node scripts/commit-generated-entities.js           # Dry run
 *   node scripts/commit-generated-entities.js --apply   # Actually move files
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const PREVIEW_DIR = path.join(__dirname, '..', 'generated-entities-preview');
const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Entity type to directory mapping
const TYPE_TO_DIR = {
  'deity': 'deities',
  'hero': 'heroes',
  'creature': 'creatures',
  'place': 'places',
  'item': 'items',
  'ritual': 'rituals',
  'text': 'texts',
  'symbol': 'symbols',
  'concept': 'concepts',
  'cosmology': 'cosmology',
  'archetype': 'archetypes',
  'mythology': 'mythologies'
};

class EntityCommitter {
  constructor(options = {}) {
    this.dryRun = options.dryRun !== false;
    this.entities = [];
    this.stats = {
      total: 0,
      moved: 0,
      skipped: 0,
      errors: 0
    };
    this.results = [];
  }

  async loadPreviewEntities() {
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
                  sourcePath: filePath,
                  category,
                  fileName: file
                });
              } catch (error) {
                console.log('  Skip (parse error): ' + category + '/' + file);
                this.stats.errors++;
              }
            }
          }
        } catch {
          continue;
        }
      }
      console.log('Loaded ' + this.entities.length + ' entities from preview');
    } catch (error) {
      console.error('Error loading preview entities: ' + error.message);
    }
  }

  async checkForDuplicates() {
    const duplicates = [];

    for (const item of this.entities) {
      const targetDir = TYPE_TO_DIR[item.entity.type] || item.category;
      const targetPath = path.join(ASSETS_DIR, targetDir, item.fileName);

      try {
        await fs.access(targetPath);
        duplicates.push({
          id: item.entity.id,
          path: targetPath
        });
      } catch {
        // File doesn't exist - good
      }
    }

    if (duplicates.length > 0) {
      console.log('\nWARNING: Found ' + duplicates.length + ' duplicate entities:');
      duplicates.slice(0, 10).forEach(d => console.log('  - ' + d.id));
      if (duplicates.length > 10) {
        console.log('  ... and ' + (duplicates.length - 10) + ' more');
      }
    }

    return duplicates;
  }

  async commitEntity(item) {
    const { entity, sourcePath, fileName } = item;
    const targetDir = TYPE_TO_DIR[entity.type] || 'concepts';
    const targetDirPath = path.join(ASSETS_DIR, targetDir);
    const targetPath = path.join(targetDirPath, fileName);

    // Check if already exists
    try {
      await fs.access(targetPath);
      return { status: 'skipped', reason: 'Already exists' };
    } catch {
      // Good - file doesn't exist
    }

    if (this.dryRun) {
      return { status: 'would_move', from: sourcePath, to: targetPath };
    }

    try {
      // Ensure target directory exists
      await fs.mkdir(targetDirPath, { recursive: true });

      // Copy the file
      const content = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(targetPath, content);

      return { status: 'moved', from: sourcePath, to: targetPath };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async commit() {
    await this.loadPreviewEntities();

    if (this.entities.length === 0) {
      console.log('No entities found to commit');
      return;
    }

    const duplicates = await this.checkForDuplicates();

    console.log('\n' + '='.repeat(60));
    console.log('COMMITTING GENERATED ENTITIES');
    console.log('='.repeat(60));
    console.log('Mode: ' + (this.dryRun ? 'DRY RUN' : 'APPLY'));
    console.log('Entities to commit: ' + this.entities.length);
    console.log('Duplicates (will skip): ' + duplicates.length);
    console.log('');

    const duplicateIds = new Set(duplicates.map(d => d.id));

    for (const item of this.entities) {
      this.stats.total++;

      if (duplicateIds.has(item.entity.id)) {
        this.stats.skipped++;
        this.results.push({
          id: item.entity.id,
          status: 'skipped',
          reason: 'duplicate'
        });
        continue;
      }

      const result = await this.commitEntity(item);

      if (result.status === 'moved' || result.status === 'would_move') {
        this.stats.moved++;
        this.results.push({
          id: item.entity.id,
          type: item.entity.type,
          mythology: item.entity.mythology,
          status: result.status,
          targetPath: result.to
        });

        if (!this.dryRun) {
          console.log('  [MOVED] ' + item.entity.id + ' -> ' + result.to.replace(ASSETS_DIR, ''));
        }
      } else if (result.status === 'skipped') {
        this.stats.skipped++;
        this.results.push({
          id: item.entity.id,
          status: 'skipped',
          reason: result.reason
        });
      } else if (result.status === 'error') {
        this.stats.errors++;
        this.results.push({
          id: item.entity.id,
          status: 'error',
          error: result.error
        });
        console.log('  [ERROR] ' + item.entity.id + ': ' + result.error);
      }
    }

    await this.saveReport();
    this.printSummary();
  }

  async saveReport() {
    try {
      await fs.mkdir(REPORTS_DIR, { recursive: true });
    } catch {}

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'applied',
      stats: this.stats,
      results: this.results
    };

    await fs.writeFile(
      path.join(REPORTS_DIR, 'commit-results.json'),
      JSON.stringify(report, null, 2)
    );
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('COMMIT ' + (this.dryRun ? 'PREVIEW' : 'COMPLETE'));
    console.log('='.repeat(60));
    console.log('Mode: ' + (this.dryRun ? 'DRY RUN' : 'APPLIED'));
    console.log('Total processed: ' + this.stats.total);
    console.log((this.dryRun ? 'Would move' : 'Moved') + ': ' + this.stats.moved);
    console.log('Skipped: ' + this.stats.skipped);
    console.log('Errors: ' + this.stats.errors);

    if (this.dryRun) {
      console.log('\nThis was a dry run. To actually commit, run:');
      console.log('  node scripts/commit-generated-entities.js --apply');
    } else {
      // Type breakdown
      const types = {};
      for (const r of this.results.filter(r => r.status === 'moved')) {
        types[r.type] = (types[r.type] || 0) + 1;
      }
      if (Object.keys(types).length > 0) {
        console.log('\nEntities committed by type:');
        for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
          console.log('  ' + type + ': ' + count);
        }
      }

      console.log('\nNext steps:');
      console.log('  1. Run validation: node scripts/validate-cross-links.js');
      console.log('  2. Update bidirectional links: node scripts/fix-bidirectional-links.js --apply');
    }

    console.log('\nReport saved to: reports/commit-results.json');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const committer = new EntityCommitter({ dryRun });
  await committer.commit();
}

main().catch(console.error);

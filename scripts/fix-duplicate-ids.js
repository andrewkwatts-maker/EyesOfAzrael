/**
 * Fix Duplicate IDs Script
 *
 * This script resolves duplicate entity IDs by:
 * 1. Identifying the correct type for each duplicate
 * 2. Renaming or removing duplicates based on content analysis
 * 3. Updating relationships if necessary
 */

const fs = require('fs');
const path = require('path');

/**
 * Duplicate ID resolution strategy
 *
 * For each duplicate, we determine which file should be kept
 * and how to rename the others
 */
const RESOLUTION_STRATEGY = {
  'titans': {
    keep: 'concept', // The Titans are primarily a concept (race/group)
    action: 'rename',
    rename: {
      'creature': 'titans-creatures' // Rename creature version
    }
  },
  'maat': {
    keep: 'deity', // Maat is primarily a deity
    action: 'rename',
    rename: {
      'concept': 'maat-concept' // Rename concept version
    }
  },
  'book-of-thoth': {
    keep: 'magic', // Magical text is primary
    action: 'delete',
    delete: ['item'] // Delete duplicate item entry
  },
  'emerald-tablet': {
    keep: 'magic', // Magical text is primary
    action: 'delete',
    delete: ['item'] // Delete duplicate item entry
  },
  'mummification': {
    keep: 'magic', // Magical practice
    action: 'delete',
    delete: ['magi'] // Delete duplicate from magi folder
  },
  'opet-festival': {
    keep: 'magic', // Ritual/festival is magical practice
    action: 'delete',
    delete: ['magi'] // Delete duplicate from magi folder
  },
  'seidr': {
    keep: 'magic', // Seidr is primarily a magical practice
    action: 'delete',
    delete: ['concept'] // Delete concept version
  },
  'duat': {
    keep: 'place', // Duat is primarily a place
    action: 'delete',
    delete: ['concept'] // Delete concept version
  },
  'mount-olympus': {
    keep: 'place', // Mount Olympus is primarily a place
    action: 'delete',
    delete: ['concept'] // Delete concept version
  },
  'underworld': {
    keep: 'place', // Underworld is primarily a place
    action: 'delete',
    delete: ['concept'] // Delete concept version
  }
};

function fixDuplicates(dryRun = true) {
  console.log(dryRun ? '=== DRY RUN MODE ===' : '=== APPLYING FIXES ===');
  console.log();

  const results = {
    renamed: [],
    deleted: [],
    errors: []
  };

  for (const [id, strategy] of Object.entries(RESOLUTION_STRATEGY)) {
    console.log(`Processing: ${id}`);
    console.log(`  Strategy: Keep ${strategy.keep}, ${strategy.action}`);

    if (strategy.action === 'rename') {
      for (const [type, newId] of Object.entries(strategy.rename)) {
        const filePath = path.join(__dirname, '../data/entities', type, `${id}.json`);
        const newPath = path.join(__dirname, '../data/entities', type, `${newId}.json`);

        if (!fs.existsSync(filePath)) {
          console.log(`  ⚠️  File not found: ${filePath}`);
          continue;
        }

        try {
          const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          entity.id = newId;

          if (!dryRun) {
            fs.writeFileSync(newPath, JSON.stringify(entity, null, 2));
            fs.unlinkSync(filePath);
          }

          console.log(`  ✓ Renamed ${type}/${id}.json → ${type}/${newId}.json`);
          results.renamed.push({ from: `${type}/${id}.json`, to: `${type}/${newId}.json` });
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
          results.errors.push({ file: filePath, error: error.message });
        }
      }
    } else if (strategy.action === 'delete') {
      for (const type of strategy.delete) {
        const filePath = path.join(__dirname, '../data/entities', type, `${id}.json`);

        if (!fs.existsSync(filePath)) {
          console.log(`  ⚠️  File not found: ${filePath}`);
          continue;
        }

        if (!dryRun) {
          fs.unlinkSync(filePath);
        }

        console.log(`  ✓ Deleted ${type}/${id}.json`);
        results.deleted.push(`${type}/${id}.json`);
      }
    }

    console.log();
  }

  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Renamed: ${results.renamed.length}`);
  console.log(`Deleted: ${results.deleted.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. Use --apply to actually make changes.');
  }

  return results;
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

fixDuplicates(dryRun);

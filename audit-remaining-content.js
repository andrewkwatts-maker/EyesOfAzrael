#!/usr/bin/env node

/**
 * Audit Remaining Content for Entity Migration
 * Scans all mythology directories to find items, places, magic systems, etc.
 * that haven't been migrated to the entity system yet
 */

const fs = require('fs');
const path = require('path');

const MYTHOS_DIR = './mythos';
const ENTITIES_DIR = './data/entities';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load existing entities to track what's already migrated
function loadExistingEntities() {
  const existing = {
    items: new Set(),
    places: new Set(),
    concepts: new Set(),
    magic: new Set(),
    archetypes: new Set(),
    creatures: new Set(),
    deities: new Set()
  };

  const entityTypes = ['item', 'place', 'concept', 'magic', 'archetype', 'creature', 'deity'];

  entityTypes.forEach(type => {
    const typePath = path.join(ENTITIES_DIR, type);
    if (fs.existsSync(typePath)) {
      const files = fs.readdirSync(typePath).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const id = file.replace('.json', '');
        // Map type to plural form used in existing object
        let pluralType;
        if (type === 'magic') {
          pluralType = 'magic';
        } else if (type === 'deity') {
          pluralType = 'deities';
        } else {
          pluralType = type + 's';
        }
        existing[pluralType].add(id);
      });
    }
  });

  return existing;
}

// Scan a mythology directory for content
function scanMythology(mythologyName, existing) {
  const mythPath = path.join(MYTHOS_DIR, mythologyName);

  if (!fs.existsSync(mythPath)) {
    return null;
  }

  const results = {
    items: { total: 0, migrated: 0, remaining: [] },
    places: { total: 0, migrated: 0, remaining: [] },
    herbs: { total: 0, migrated: 0, remaining: [] },
    magic: { total: 0, migrated: 0, remaining: [] },
    rituals: { total: 0, migrated: 0, remaining: [] },
    concepts: { total: 0, migrated: 0, remaining: [] },
    creatures: { total: 0, migrated: 0, remaining: [] }
  };

  const directories = ['items', 'places', 'herbs', 'magic', 'rituals', 'concepts', 'creatures'];

  directories.forEach(dir => {
    const dirPath = path.join(mythPath, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => {
        if (!f.endsWith('.html') || f === 'index.html') return false;

        // Check if it's a redirect file (very small file with meta refresh)
        const filePath = path.join(dirPath, f);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('meta http-equiv="refresh"') && content.length < 1000) {
            return false; // Skip redirect files
          }
        } catch (e) {
          // If we can't read it, include it
        }
        return true;
      });

      results[dir].total = files.length;

      files.forEach(file => {
        const id = file.replace('.html', '').toLowerCase();

        // Try variations of the ID for naming mismatches
        const idVariations = [
          id,
          `${mythologyName}-${id}`, // e.g., greek-offerings, sphinx-greek
          `${id}-${mythologyName}`,  // e.g., offerings-greek, sphinx-egyptian
        ];

        // Map content directories to entity types
        let lookupDir = dir;
        let found = false;

        if (dir === 'herbs' || dir === 'rituals') {
          // Check both items and magic (rituals are magic, some herbs might be items)
          for (const variation of idVariations) {
            const inItems = existing.items && existing.items.has(variation);
            const inMagic = existing.magic && existing.magic.has(variation);
            const inPlaces = existing.places && existing.places.has(variation);
            if (inItems || inMagic || inPlaces) {
              results[dir].migrated++;
              found = true;
              break;
            }
          }
          if (found) return;
          lookupDir = 'items'; // fallback
        } else if (dir === 'creatures') {
          // Check creatures, deities, and items
          for (const variation of idVariations) {
            const inCreatures = existing.creatures && existing.creatures.has(variation);
            const inDeities = existing.deities && existing.deities.has(variation);
            const inItems = existing.items && existing.items.has(variation);
            if (inCreatures || inDeities || inItems) {
              results[dir].migrated++;
              found = true;
              break;
            }
          }
          if (found) return;
          lookupDir = 'creatures'; // fallback
        } else {
          // For other types, check variations
          for (const variation of idVariations) {
            if (existing[lookupDir] && existing[lookupDir].has(variation)) {
              results[dir].migrated++;
              found = true;
              break;
            }
          }
          if (found) return;
        }

        // If still not found, add to remaining
        if (!found) {
          results[dir].remaining.push({
            file: file,
            path: path.relative('.', path.join(dirPath, file)),
            id: id
          });
        }
      });
    }
  });

  return results;
}

// Main audit function
function auditAllContent() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║   CONTENT AUDIT - Entity Migration Status                ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝\n', 'cyan');

  const existing = loadExistingEntities();

  log('Current Entity Counts:', 'blue');
  log(`  Items:     ${existing.items.size}`, 'green');
  log(`  Places:    ${existing.places.size}`, 'green');
  log(`  Concepts:  ${existing.concepts.size}`, 'green');
  log(`  Magic:     ${existing.magic.size}`, 'green');
  log(`  Creatures: ${existing.creatures.size}`, 'green');
  log(`  Deities:   ${existing.deities.size}`, 'green');
  const total = existing.items.size + existing.places.size + existing.concepts.size +
                existing.magic.size + existing.creatures.size + existing.deities.size;
  log(`  Total:     ${total}\n`, 'green');

  const mythologies = ['greek', 'norse', 'egyptian', 'jewish', 'hindu', 'chinese', 'celtic', 'japanese'];

  const totalStats = {
    items: { total: 0, migrated: 0, remaining: 0 },
    places: { total: 0, migrated: 0, remaining: 0 },
    herbs: { total: 0, migrated: 0, remaining: 0 },
    magic: { total: 0, migrated: 0, remaining: 0 },
    rituals: { total: 0, migrated: 0, remaining: 0 },
    concepts: { total: 0, migrated: 0, remaining: 0 },
    creatures: { total: 0, migrated: 0, remaining: 0 }
  };

  const allRemaining = [];

  mythologies.forEach(myth => {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`${myth.toUpperCase()} MYTHOLOGY`, 'cyan');
    log('='.repeat(60), 'cyan');

    const results = scanMythology(myth, existing);

    if (!results) {
      log(`  Directory not found: ${myth}`, 'yellow');
      return;
    }

    let hasContent = false;

    Object.entries(results).forEach(([category, data]) => {
      if (data.total > 0) {
        hasContent = true;
        totalStats[category].total += data.total;
        totalStats[category].migrated += data.migrated;
        totalStats[category].remaining += data.remaining.length;

        const percentage = data.total > 0 ? Math.round((data.migrated / data.total) * 100) : 0;
        const color = percentage === 100 ? 'green' : percentage > 50 ? 'yellow' : 'red';

        log(`\n  ${category.toUpperCase()}:`, 'blue');
        log(`    Total:     ${data.total}`, 'reset');
        log(`    Migrated:  ${data.migrated} (${percentage}%)`, color);
        log(`    Remaining: ${data.remaining.length}`, data.remaining.length > 0 ? 'yellow' : 'green');

        if (data.remaining.length > 0 && data.remaining.length <= 10) {
          data.remaining.forEach(item => {
            log(`      - ${item.file} (${item.id})`, 'yellow');
            allRemaining.push({
              mythology: myth,
              category: category,
              file: item.file,
              path: item.path,
              id: item.id
            });
          });
        } else if (data.remaining.length > 10) {
          log(`      ... ${data.remaining.length} files need migration`, 'yellow');
          data.remaining.forEach(item => {
            allRemaining.push({
              mythology: myth,
              category: category,
              file: item.file,
              path: item.path,
              id: item.id
            });
          });
        }
      }
    });

    if (!hasContent) {
      log('  No content directories found', 'yellow');
    }
  });

  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  log('OVERALL SUMMARY', 'cyan');
  log('═'.repeat(60), 'cyan');

  Object.entries(totalStats).forEach(([category, data]) => {
    if (data.total > 0) {
      const percentage = Math.round((data.migrated / data.total) * 100);
      const color = percentage === 100 ? 'green' : percentage > 50 ? 'yellow' : 'red';

      log(`\n${category.toUpperCase()}:`, 'blue');
      log(`  Total:     ${data.total}`, 'reset');
      log(`  Migrated:  ${data.migrated} (${percentage}%)`, color);
      log(`  Remaining: ${data.remaining}`, data.remaining > 0 ? 'yellow' : 'green');
    }
  });

  const grandTotal = Object.values(totalStats).reduce((sum, cat) => sum + cat.total, 0);
  const grandMigrated = Object.values(totalStats).reduce((sum, cat) => sum + cat.migrated, 0);
  const grandRemaining = Object.values(totalStats).reduce((sum, cat) => sum + cat.remaining, 0);
  const overallPercentage = Math.round((grandMigrated / grandTotal) * 100);

  log('\n' + '═'.repeat(60), 'magenta');
  log('GRAND TOTAL:', 'magenta');
  log(`  Total Files:    ${grandTotal}`, 'reset');
  log(`  Migrated:       ${grandMigrated} (${overallPercentage}%)`, overallPercentage === 100 ? 'green' : 'yellow');
  log(`  Remaining:      ${grandRemaining}`, grandRemaining > 0 ? 'yellow' : 'green');
  log('═'.repeat(60) + '\n', 'magenta');

  // Export detailed list
  if (allRemaining.length > 0) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: grandTotal,
        migrated: grandMigrated,
        remaining: grandRemaining,
        percentage: overallPercentage
      },
      byCategory: totalStats,
      remainingFiles: allRemaining
    };

    fs.writeFileSync('remaining-content-report.json', JSON.stringify(report, null, 2));
    log(`Detailed report saved to: remaining-content-report.json`, 'green');

    // Create CSV for easy import
    const csv = ['Mythology,Category,File,Path,ID\n'];
    allRemaining.forEach(item => {
      csv.push(`${item.mythology},${item.category},${item.file},${item.path},${item.id}\n`);
    });
    fs.writeFileSync('remaining-content.csv', csv.join(''));
    log(`CSV export saved to: remaining-content.csv\n`, 'green');
  } else {
    log('✨ All content has been migrated! ✨\n', 'green');
  }

  return {
    total: grandTotal,
    migrated: grandMigrated,
    remaining: grandRemaining,
    allRemaining: allRemaining
  };
}

// Run audit
const results = auditAllContent();

// Exit code based on completion
process.exit(results.remaining > 0 ? 1 : 0);

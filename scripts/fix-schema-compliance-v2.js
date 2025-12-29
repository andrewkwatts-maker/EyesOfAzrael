#!/usr/bin/env node

/**
 * Firebase Assets Schema Compliance Fixer V2
 *
 * Handles both single objects and arrays of entities
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', `schema-fix-v2-${Date.now()}`);
const REPORT_FILE = path.join(__dirname, 'AGENT_1_SCHEMA_COMPLIANCE_REPORT_V2.md');

// Type mapping based on directory structure
const TYPE_MAPPINGS = {
  'deities': 'deity',
  'creatures': 'creature',
  'heroes': 'hero',
  'items': 'item',
  'places': 'place',
  'cosmology': 'cosmology',
  'rituals': 'ritual',
  'symbols': 'symbol',
  'texts': 'text',
  'concepts': 'concept',
  'herbs': 'herb',
  'magic-systems': 'magic'
};

// Stats tracking
const stats = {
  totalFilesProcessed: 0,
  filesModified: 0,
  typeAdded: 0,
  idAdded: 0,
  nameAdded: 0,
  arrayFilesFixed: 0,
  singleObjectFilesFixed: 0,
  errors: [],
  modifications: []
};

// Parse arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CREATE_BACKUP = args.includes('--backup') || !DRY_RUN;

function filenameToId(filename, parentDir) {
  let id = filename.replace('.json', '');

  if (id.startsWith('_all') || id.includes('_enhanced') || id.includes('_items') ||
      id.includes('_places') || id.includes('_symbols') || id.includes('summary')) {
    const parts = parentDir.split(path.sep);
    const mythology = parts[parts.length - 1];
    id = `${mythology}-${id}`;
  }

  id = id
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return id;
}

function extractName(data, id, type) {
  if (data.name && typeof data.name === 'string') return data.name;
  if (data.displayName) return data.displayName;
  if (data.title) return data.title;
  if (data.mythology && id) return `${capitalize(data.mythology)} - ${idToTitle(id)}`;
  return idToTitle(id);
}

function idToTitle(id) {
  return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTypeFromPath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  for (const [dir, type] of Object.entries(TYPE_MAPPINGS)) {
    if (normalizedPath.includes(`/${dir}/`)) {
      return type;
    }
  }
  return null;
}

/**
 * Fix a single entity object
 */
function fixEntity(entity, filePath, filename) {
  const changes = [];

  if (!entity.type) {
    const type = getTypeFromPath(filePath);
    if (type) {
      entity.type = type;
      changes.push(`type: "${type}"`);
      stats.typeAdded++;
    }
  }

  if (!entity.id) {
    const parentDir = path.dirname(filePath);
    const id = filenameToId(filename, parentDir);
    entity.id = id;
    changes.push(`id: "${id}"`);
    stats.idAdded++;
  }

  if (!entity.name) {
    const name = extractName(entity, entity.id, entity.type);
    entity.name = name;
    changes.push(`name: "${name}"`);
    stats.nameAdded++;
  }

  return changes;
}

/**
 * Fix a single JSON file (handles both objects and arrays)
 */
function fixFile(filePath) {
  stats.totalFilesProcessed++;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    let modified = false;
    const allChanges = [];
    const relPath = path.relative(BASE_DIR, filePath);
    const filename = path.basename(filePath);

    // Handle arrays of entities
    if (Array.isArray(data)) {
      console.log(`📋 ${relPath} (array with ${data.length} entities)`);

      data.forEach((entity, index) => {
        const changes = fixEntity(entity, filePath, filename);
        if (changes.length > 0) {
          modified = true;
          allChanges.push(`  [${index}]: ${changes.join(', ')}`);
        }
      });

      if (allChanges.length > 0) {
        stats.arrayFilesFixed++;
        console.log(`   ✅ Fixed ${allChanges.length} entities`);
        allChanges.forEach(c => console.log(c));
      }
    } else {
      // Handle single entity object
      const changes = fixEntity(data, filePath, filename);
      if (changes.length > 0) {
        modified = true;
        stats.singleObjectFilesFixed++;
        console.log(`✅ ${relPath}`);
        console.log(`   - ${changes.join(', ')}`);
        allChanges.push(changes.join(', '));
      }
    }

    // Save modifications
    if (modified) {
      stats.filesModified++;
      stats.modifications.push({
        file: relPath,
        isArray: Array.isArray(data),
        changes: allChanges
      });

      if (!DRY_RUN) {
        if (CREATE_BACKUP) {
          const backupPath = path.join(BACKUP_DIR, relPath);
          fs.mkdirSync(path.dirname(backupPath), { recursive: true });
          fs.copyFileSync(filePath, backupPath);
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      }
    }

  } catch (error) {
    stats.errors.push({
      file: path.relative(BASE_DIR, filePath),
      error: error.message
    });
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.json') &&
               !file.includes('report') &&
               file !== 'package.json' &&
               file !== 'package-lock.json') {
      fixFile(filePath);
    }
  });
}

function main() {
  console.log('🔧 Firebase Assets Schema Compliance Fixer V2\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✏️  LIVE'}`);
  console.log(`Backup: ${CREATE_BACKUP ? '✅ Enabled' : '❌ Disabled'}\n`);
  console.log('─'.repeat(80) + '\n');

  if (CREATE_BACKUP && !DRY_RUN) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📦 Backup directory created: ${BACKUP_DIR}\n`);
  }

  console.log('Processing files...\n');
  walkDir(BASE_DIR);

  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 SUMMARY\n');
  console.log(`Total files processed: ${stats.totalFilesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`  - Single objects: ${stats.singleObjectFilesFixed}`);
  console.log(`  - Arrays: ${stats.arrayFilesFixed}`);
  console.log(`  - Added 'type': ${stats.typeAdded}`);
  console.log(`  - Added 'id': ${stats.idAdded}`);
  console.log(`  - Added 'name': ${stats.nameAdded}`);
  console.log(`Errors: ${stats.errors.length}`);

  const report = `# Schema Compliance Fix Report V2

**Generated**: ${new Date().toISOString()}
**Mode**: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}
**Backup**: ${CREATE_BACKUP ? `Yes (${BACKUP_DIR})` : 'No'}

## Summary

- Total Files: ${stats.totalFilesProcessed}
- Modified: ${stats.filesModified}
  - Single Objects: ${stats.singleObjectFilesFixed}
  - Arrays: ${stats.arrayFilesFixed}
- Added 'type': ${stats.typeAdded}
- Added 'id': ${stats.idAdded}
- Added 'name': ${stats.nameAdded}
- Errors: ${stats.errors.length}

## Status

${stats.errors.length === 0 ? '✅ All files processed successfully!' : '⚠️ Some errors occurred'}

${stats.errors.length > 0 ? `## Errors\n\n${stats.errors.map(e => `- ${e.file}: ${e.error}`).join('\n')}` : ''}
`;

  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`\n📄 Report saved to: ${REPORT_FILE}`);

  if (stats.errors.length > 0) {
    process.exit(1);
  } else {
    console.log('\n✅ Schema compliance fix completed successfully!');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, fixEntity };

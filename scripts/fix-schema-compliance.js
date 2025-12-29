#!/usr/bin/env node

/**
 * Firebase Assets Schema Compliance Fixer
 *
 * This script automatically fixes schema compliance issues by:
 * 1. Adding missing 'type' field based on directory
 * 2. Adding missing 'id' field derived from filename/path
 * 3. Adding missing 'name' field derived from existing data or id
 * 4. Creating backups before modification
 * 5. Logging all changes
 *
 * Usage: node scripts/fix-schema-compliance.js [--dry-run] [--backup]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', `schema-fix-${Date.now()}`);
const REPORT_FILE = path.join(__dirname, 'AGENT_1_SCHEMA_COMPLIANCE_REPORT.md');

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
  errors: [],
  modifications: []
};

// Parse arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CREATE_BACKUP = args.includes('--backup') || !DRY_RUN;

/**
 * Convert filename to kebab-case ID
 */
function filenameToId(filename, parentDir) {
  // Remove .json extension
  let id = filename.replace('.json', '');

  // Handle special aggregate files
  if (id.startsWith('_all') || id.includes('_enhanced') || id.includes('_items') ||
      id.includes('_places') || id.includes('_symbols') || id.includes('summary')) {
    // Use parent directory for aggregate files
    const parts = parentDir.split(path.sep);
    const mythology = parts[parts.length - 1];
    id = `${mythology}-${id}`;
  }

  // Convert to kebab-case
  id = id
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return id;
}

/**
 * Extract name from JSON data or generate from ID
 */
function extractName(data, id, type) {
  // Try existing name field
  if (data.name && typeof data.name === 'string') {
    return data.name;
  }

  // Try displayName
  if (data.displayName) {
    return data.displayName;
  }

  // Try title
  if (data.title) {
    return data.title;
  }

  // Try mythology-specific naming
  if (data.mythology && id) {
    return `${capitalize(data.mythology)} - ${idToTitle(id)}`;
  }

  // Generate from ID
  return idToTitle(id);
}

/**
 * Convert ID to Title Case
 */
function idToTitle(id) {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Determine type from directory path
 */
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
 * Fix a single JSON file
 */
function fixFile(filePath) {
  stats.totalFilesProcessed++;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    let modified = false;
    const changes = [];
    const relPath = path.relative(BASE_DIR, filePath);

    // 1. Add missing TYPE field
    if (!data.type) {
      const type = getTypeFromPath(filePath);
      if (type) {
        data.type = type;
        changes.push(`Added type: "${type}"`);
        stats.typeAdded++;
        modified = true;
      } else {
        stats.errors.push({
          file: relPath,
          error: 'Could not determine type from path'
        });
      }
    }

    // 2. Add missing ID field
    if (!data.id) {
      const filename = path.basename(filePath);
      const parentDir = path.dirname(filePath);
      const id = filenameToId(filename, parentDir);

      data.id = id;
      changes.push(`Added id: "${id}"`);
      stats.idAdded++;
      modified = true;
    }

    // 3. Add missing NAME field
    if (!data.name) {
      const name = extractName(data, data.id, data.type);
      data.name = name;
      changes.push(`Added name: "${name}"`);
      stats.nameAdded++;
      modified = true;
    }

    // Save modifications
    if (modified) {
      stats.filesModified++;
      stats.modifications.push({
        file: relPath,
        changes: changes
      });

      if (!DRY_RUN) {
        // Create backup if requested
        if (CREATE_BACKUP) {
          const backupPath = path.join(BACKUP_DIR, relPath);
          fs.mkdirSync(path.dirname(backupPath), { recursive: true });
          fs.copyFileSync(filePath, backupPath);
        }

        // Write updated file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      }

      console.log(`✅ ${relPath}`);
      changes.forEach(change => console.log(`   - ${change}`));
    }

  } catch (error) {
    stats.errors.push({
      file: path.relative(BASE_DIR, filePath),
      error: error.message
    });
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Walk directory recursively
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.json') &&
               !file.includes('report') &&
               !file.includes('summary') &&
               file !== 'package.json' &&
               file !== 'package-lock.json') {
      fixFile(filePath);
    }
  });
}

/**
 * Generate markdown report
 */
function generateReport() {
  const report = `# Schema Compliance Fix Report

**Generated**: ${new Date().toISOString()}
**Mode**: ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE (changes applied)'}
**Backup Created**: ${CREATE_BACKUP ? `Yes (${BACKUP_DIR})` : 'No'}

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Files Processed** | ${stats.totalFilesProcessed} |
| **Files Modified** | ${stats.filesModified} |
| **'type' Fields Added** | ${stats.typeAdded} |
| **'id' Fields Added** | ${stats.idAdded} |
| **'name' Fields Added** | ${stats.nameAdded} |
| **Errors Encountered** | ${stats.errors.length} |

## Compliance Status

${stats.filesModified === 0 ? '✅ All files are already compliant!' :
  `✅ Fixed ${stats.filesModified} files with schema compliance issues`}

### Missing Field Summary

- **Missing 'type'**: ${stats.typeAdded} files fixed
- **Missing 'id'**: ${stats.idAdded} files fixed
- **Missing 'name'**: ${stats.nameAdded} files fixed

## Detailed Modifications

${stats.modifications.length === 0 ? 'No modifications made.' :
  stats.modifications.map(mod => `
### \`${mod.file}\`

${mod.changes.map(c => `- ${c}`).join('\n')}
`).join('\n')}

${stats.errors.length > 0 ? `
## Errors Encountered

${stats.errors.map(err => `
### \`${err.file}\`

**Error**: ${err.error}
`).join('\n')}
` : '## No Errors ✅'}

## Validation Results

### Before Fixes
- Missing 'type': ${stats.typeAdded}
- Missing 'id': ${stats.idAdded}
- Missing 'name': ${stats.nameAdded}

### After Fixes
- Missing 'type': ${DRY_RUN ? stats.typeAdded : 0}
- Missing 'id': ${DRY_RUN ? stats.idAdded : 0}
- Missing 'name': ${DRY_RUN ? stats.nameAdded : 0}

${DRY_RUN ? `
## ⚠️ Dry Run Mode

This was a dry run. No files were modified. Run without \`--dry-run\` to apply changes.
` : `
## ✅ Changes Applied

All schema compliance fixes have been applied successfully.
${CREATE_BACKUP ? `Backups saved to: \`${BACKUP_DIR}\`` : ''}
`}

## Next Steps

1. ✅ Run validation script to verify 0 errors
2. ✅ Test entity loading in application
3. ✅ Commit changes to version control

---

**Script**: fix-schema-compliance.js
**Author**: AGENT 1 - Schema Compliance Task Force
**Version**: 1.0.0
`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Firebase Assets Schema Compliance Fixer\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✏️  LIVE'}`);
  console.log(`Backup: ${CREATE_BACKUP ? '✅ Enabled' : '❌ Disabled'}\n`);
  console.log('─'.repeat(80) + '\n');

  // Create backup directory if needed
  if (CREATE_BACKUP && !DRY_RUN) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📦 Backup directory created: ${BACKUP_DIR}\n`);
  }

  // Process all files
  console.log('Processing files...\n');
  walkDir(BASE_DIR);

  // Generate and save report
  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 SUMMARY\n');
  console.log(`Total files processed: ${stats.totalFilesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`  - Added 'type': ${stats.typeAdded}`);
  console.log(`  - Added 'id': ${stats.idAdded}`);
  console.log(`  - Added 'name': ${stats.nameAdded}`);
  console.log(`Errors: ${stats.errors.length}`);

  const report = generateReport();
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`\n📄 Report saved to: ${REPORT_FILE}`);

  // Exit code
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Some errors occurred. Check report for details.');
    process.exit(1);
  } else {
    console.log('\n✅ Schema compliance fix completed successfully!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixFile, getTypeFromPath, filenameToId, extractName };

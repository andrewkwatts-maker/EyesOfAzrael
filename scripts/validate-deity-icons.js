#!/usr/bin/env node

/**
 * Validate Deity Icon Assignments
 *
 * Verifies that all deity documents have proper icon assignments
 * and checks for consistency across display fields.
 */

const fs = require('fs');
const path = require('path');

/**
 * Find all deity JSON files
 */
function findDeityFiles(baseDir) {
  const deityFiles = [];

  function traverse(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.json') && !item.includes('agent') && !item.includes('summary')) {
        deityFiles.push(fullPath);
      }
    }
  }

  traverse(baseDir);
  return deityFiles;
}

/**
 * Validate a single deity document
 */
function validateDeity(filePath) {
  const deity = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const issues = [];

  // Check main icon field
  if (!deity.icon) {
    issues.push('Missing icon field');
  } else if (typeof deity.icon !== 'string') {
    issues.push('Icon field is not a string');
  } else if (!deity.icon.endsWith('.svg')) {
    issues.push(`Icon is not SVG: ${deity.icon}`);
  }

  // Check gridDisplay consistency
  if (deity.gridDisplay) {
    if (deity.gridDisplay.image !== deity.icon) {
      issues.push(`gridDisplay.image (${deity.gridDisplay.image}) != icon (${deity.icon})`);
    }
  } else {
    issues.push('Missing gridDisplay');
  }

  // Check listDisplay consistency
  if (deity.listDisplay) {
    if (deity.listDisplay.icon !== deity.icon) {
      issues.push(`listDisplay.icon (${deity.listDisplay.icon}) != icon (${deity.icon})`);
    }
  } else {
    issues.push('Missing listDisplay');
  }

  // Check metadata
  if (deity.metadata && deity.metadata.iconAssignedBy) {
    // Has assignment metadata
  } else {
    issues.push('Missing icon assignment metadata');
  }

  return {
    name: deity.name || deity.id || path.basename(filePath),
    icon: deity.icon,
    issues: issues,
    valid: issues.length === 0
  };
}

/**
 * Main validation
 */
function main() {
  const baseDir = path.join(__dirname, '..', 'firebase-assets-enhanced', 'deities');

  console.log('🔍 Deity Icon Validation Report');
  console.log('================================\n');

  const deityFiles = findDeityFiles(baseDir);
  console.log(`📊 Validating ${deityFiles.length} deity files...\n`);

  const results = {
    total: 0,
    valid: 0,
    invalid: 0,
    issues: [],
    iconTypes: {
      domain: 0,
      generic: 0,
      emoji: 0,
      missing: 0
    }
  };

  for (const filePath of deityFiles) {
    try {
      const validation = validateDeity(filePath);
      results.total++;

      if (validation.valid) {
        results.valid++;
      } else {
        results.invalid++;
        results.issues.push({
          file: path.relative(baseDir, filePath),
          name: validation.name,
          issues: validation.issues
        });
      }

      // Categorize icon type
      if (!validation.icon) {
        results.iconTypes.missing++;
      } else if (validation.icon.includes('deity-domains/')) {
        results.iconTypes.domain++;
      } else if (validation.icon.includes('generic-deity')) {
        results.iconTypes.generic++;
      } else {
        results.iconTypes.emoji++;
      }

    } catch (error) {
      console.error(`✗ Error validating ${filePath}:`, error.message);
      results.invalid++;
    }
  }

  // Print summary
  console.log('================================');
  console.log('📊 Validation Summary');
  console.log('================================\n');
  console.log(`Total deities: ${results.total}`);
  console.log(`Valid: ${results.valid} (${(results.valid / results.total * 100).toFixed(1)}%)`);
  console.log(`Invalid: ${results.invalid} (${(results.invalid / results.total * 100).toFixed(1)}%)`);

  console.log(`\n🎨 Icon Type Distribution:`);
  console.log(`  Domain-based icons: ${results.iconTypes.domain} (${(results.iconTypes.domain / results.total * 100).toFixed(1)}%)`);
  console.log(`  Generic deity icons: ${results.iconTypes.generic} (${(results.iconTypes.generic / results.total * 100).toFixed(1)}%)`);
  console.log(`  Emoji icons: ${results.iconTypes.emoji} (${(results.iconTypes.emoji / results.total * 100).toFixed(1)}%)`);
  console.log(`  Missing icons: ${results.iconTypes.missing} (${(results.iconTypes.missing / results.total * 100).toFixed(1)}%)`);

  if (results.issues.length > 0) {
    console.log(`\n⚠️  Issues Found (${results.issues.length}):`);
    console.log('================================\n');

    for (const issue of results.issues.slice(0, 20)) { // Show first 20
      console.log(`${issue.name} (${issue.file})`);
      for (const msg of issue.issues) {
        console.log(`  - ${msg}`);
      }
      console.log('');
    }

    if (results.issues.length > 20) {
      console.log(`... and ${results.issues.length - 20} more issues\n`);
    }
  }

  console.log('✓ Validation complete!\n');

  return results;
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, validateDeity };

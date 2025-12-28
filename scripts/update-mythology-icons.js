#!/usr/bin/env node

/**
 * Update Mythology Icons Script
 *
 * Updates all mythology JSON files in firebase-assets-enhanced/mythologies/
 * to use SVG icon paths instead of emoji icons.
 *
 * Usage: node scripts/update-mythology-icons.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  mythologyIconsFile: path.join(__dirname, '..', 'mythology-icons-historic.json'),
  mythologiesDir: path.join(__dirname, '..', 'firebase-assets-enhanced', 'mythologies'),
  iconsDir: path.join(__dirname, '..', 'icons', 'mythologies'),
  backupDir: path.join(__dirname, '..', 'firebase-assets-enhanced', 'mythologies', 'backup-pre-svg-update')
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

/**
 * Load mythology icons mapping
 */
function loadMythologyIcons() {
  try {
    const data = fs.readFileSync(CONFIG.mythologyIconsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`${colors.red}Error loading mythology-icons-historic.json:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(`${colors.cyan}Created backup directory: ${CONFIG.backupDir}${colors.reset}`);
  }
}

/**
 * Verify SVG icon file exists
 */
function verifySvgExists(svgPath) {
  const fullPath = path.join(__dirname, '..', svgPath);
  return fs.existsSync(fullPath);
}

/**
 * Update a single mythology JSON file
 */
function updateMythologyFile(filePath, mythologyId, iconData) {
  try {
    // Read the JSON file
    const data = fs.readFileSync(filePath, 'utf8');
    const mythology = JSON.parse(data);

    // Backup original file
    const backupPath = path.join(CONFIG.backupDir, path.basename(filePath));
    fs.writeFileSync(backupPath, data, 'utf8');

    // Store original icon for logging
    const originalIcon = mythology.icon;

    // Update icon field
    if (iconData.svg) {
      mythology.icon = iconData.svg;
    }

    // Add metadata about the update
    if (!mythology.metadata) {
      mythology.metadata = {};
    }

    mythology.metadata.iconUpdated = new Date().toISOString();
    mythology.metadata.previousIcon = iconData.icon; // Store emoji for reference
    mythology.metadata.updatedAt = new Date().toISOString();

    // Write updated JSON back to file
    fs.writeFileSync(filePath, JSON.stringify(mythology, null, 2) + '\n', 'utf8');

    return {
      success: true,
      mythologyId,
      originalIcon,
      newIcon: iconData.svg,
      verified: verifySvgExists(iconData.svg)
    };

  } catch (error) {
    return {
      success: false,
      mythologyId,
      error: error.message
    };
  }
}

/**
 * Get mythology ID from filename
 */
function getMythologyIdFromFilename(filename) {
  // Remove .json extension
  const id = filename.replace('.json', '');

  // Map underscore filenames to icon keys
  const filenameMap = {
    'native_american': 'native_american'
  };

  return filenameMap[id] || id;
}

/**
 * Main function
 */
function main() {
  console.log(`\n${colors.bright}${colors.blue}=== Mythology Icons Update Script ===${colors.reset}\n`);

  // Load mythology icons data
  console.log(`${colors.cyan}Loading mythology icons mapping...${colors.reset}`);
  const iconsData = loadMythologyIcons();
  const mythologies = Object.keys(iconsData).filter(key => !key.startsWith('_'));
  console.log(`${colors.green}Found ${mythologies.length} mythology icon definitions${colors.reset}\n`);

  // Ensure backup directory exists
  ensureBackupDir();

  // Get all JSON files in mythologies directory
  const files = fs.readdirSync(CONFIG.mythologiesDir)
    .filter(file => file.endsWith('.json'));

  console.log(`${colors.cyan}Found ${files.length} mythology JSON files to update${colors.reset}\n`);

  // Track results
  const results = {
    updated: [],
    notFound: [],
    errors: [],
    missingIcons: []
  };

  // Update each file
  files.forEach(filename => {
    const mythologyId = getMythologyIdFromFilename(filename);
    const filePath = path.join(CONFIG.mythologiesDir, filename);

    // Check if we have icon data for this mythology
    const iconData = iconsData[mythologyId];

    if (!iconData) {
      console.log(`${colors.yellow}⚠ No icon mapping found for: ${mythologyId}${colors.reset}`);
      results.notFound.push(mythologyId);
      return;
    }

    // Update the file
    console.log(`${colors.cyan}Updating ${mythologyId}...${colors.reset}`);
    const result = updateMythologyFile(filePath, mythologyId, iconData);

    if (result.success) {
      const status = result.verified ? '✓' : '⚠';
      const statusColor = result.verified ? colors.green : colors.yellow;
      console.log(`  ${statusColor}${status} ${result.originalIcon} → ${result.newIcon}${colors.reset}`);

      results.updated.push(result);

      if (!result.verified) {
        results.missingIcons.push(result.newIcon);
      }
    } else {
      console.log(`  ${colors.red}✗ Error: ${result.error}${colors.reset}`);
      results.errors.push(result);
    }
  });

  // Print summary
  console.log(`\n${colors.bright}${colors.blue}=== Update Summary ===${colors.reset}\n`);
  console.log(`${colors.green}Successfully updated: ${results.updated.length}${colors.reset}`);
  console.log(`${colors.yellow}No icon mapping found: ${results.notFound.length}${colors.reset}`);
  console.log(`${colors.red}Errors: ${results.errors.length}${colors.reset}`);
  console.log(`${colors.yellow}Missing SVG files: ${results.missingIcons.length}${colors.reset}`);

  if (results.notFound.length > 0) {
    console.log(`\n${colors.yellow}Mythologies without icon mapping:${colors.reset}`);
    results.notFound.forEach(id => console.log(`  - ${id}`));
  }

  if (results.missingIcons.length > 0) {
    console.log(`\n${colors.yellow}Missing SVG files:${colors.reset}`);
    results.missingIcons.forEach(icon => console.log(`  - ${icon}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    results.errors.forEach(err => console.log(`  - ${err.mythologyId}: ${err.error}`));
  }

  // Write detailed log
  const logPath = path.join(__dirname, '..', 'MYTHOLOGY_ICONS_UPDATE_LOG.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      updated: results.updated.length,
      notFound: results.notFound.length,
      errors: results.errors.length,
      missingIcons: results.missingIcons.length
    },
    results
  }, null, 2), 'utf8');

  console.log(`\n${colors.cyan}Detailed log written to: ${logPath}${colors.reset}`);
  console.log(`${colors.cyan}Backups saved to: ${CONFIG.backupDir}${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(results.errors.length > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateMythologyFile, verifySvgExists };

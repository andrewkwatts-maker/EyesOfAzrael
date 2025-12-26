/**
 * Add Missing Type Field Script
 *
 * Many files are missing the required 'type' field but have 'entityType' or
 * can have type inferred from their directory path.
 *
 * This script:
 * 1. Checks for missing 'type' field
 * 2. Copies from 'entityType' if available
 * 3. Infers from file path (deities/, heroes/, etc.)
 * 4. Sets appropriate default
 */

const fs = require('fs').promises;
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const stats = {
  totalFiles: 0,
  fixed: 0,
  alreadyHasType: 0,
  failed: 0
};

/**
 * Infer type from file path
 */
function getTypeFromPath(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  const typePatterns = {
    'deities': 'deity',
    'heroes': 'hero',
    'creatures': 'creature',
    'locations': 'location',
    'places': 'location',
    'artifacts': 'artifact',
    'items': 'artifact',
    'concepts': 'concept',
    'texts': 'text',
    'rituals': 'ritual',
    'symbols': 'symbol',
    'herbs': 'herb',
    'magic': 'magic'
  };

  for (const [pathSegment, type] of Object.entries(typePatterns)) {
    if (normalized.includes(`/${pathSegment}/`) || normalized.includes(`\\${pathSegment}\\`)) {
      return type;
    }
  }

  return null;
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const entity = JSON.parse(content);

    // Check if already has type field
    if (entity.type) {
      stats.alreadyHasType++;
      return { status: 'skip', reason: 'already has type' };
    }

    let inferredType = null;

    // Try to get from entityType
    if (entity.entityType) {
      inferredType = entity.entityType;
    }

    // Try to infer from path
    if (!inferredType) {
      inferredType = getTypeFromPath(filePath);
    }

    // Default to 'entity' if still no type
    if (!inferredType) {
      inferredType = 'entity';
    }

    // Add type field
    entity.type = inferredType;
    entity._modified = new Date().toISOString();
    entity._typeAdded = true;
    entity._typeAddedAt = new Date().toISOString();

    // Save updated file
    await fs.writeFile(filePath, JSON.stringify(entity, null, 2), 'utf8');

    stats.fixed++;
    return {
      status: 'fixed',
      type: inferredType,
      source: entity.entityType ? 'entityType' : 'path',
      entity: entity.name || entity.id
    };

  } catch (error) {
    stats.failed++;
    return { status: 'error', error: error.message };
  }
}

/**
 * Find all JSON files
 */
async function findJsonFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}Add Missing Type Field Script${colors.reset}\n`);

  const assetsDir = path.join(process.cwd(), 'firebase-assets-validated');

  try {
    await fs.access(assetsDir);
  } catch (error) {
    console.error(`${colors.red}Error: Directory not found: ${assetsDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.yellow}Assets Directory:${colors.reset} ${assetsDir}\n`);

  // Find all JSON files
  console.log(`${colors.cyan}Finding JSON files...${colors.reset}`);
  const jsonFiles = await findJsonFiles(assetsDir);
  stats.totalFiles = jsonFiles.length;
  console.log(`${colors.green}Found ${stats.totalFiles} JSON files${colors.reset}\n`);

  // Process files
  console.log(`${colors.cyan}Processing files...${colors.reset}`);
  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < jsonFiles.length; i++) {
    const file = jsonFiles[i];
    const result = await processFile(file);
    results.push({ file, ...result });

    if ((i + 1) % 50 === 0 || i === jsonFiles.length - 1) {
      const percent = ((i + 1) / jsonFiles.length * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${percent}% (${i + 1}/${jsonFiles.length}) - Fixed: ${colors.green}${stats.fixed}${colors.reset}`);
    }
  }

  console.log('\n');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Files: ${colors.cyan}${stats.totalFiles}${colors.reset}`);
  console.log(`  Already Had Type: ${colors.yellow}${stats.alreadyHasType}${colors.reset}`);
  console.log(`  Type Added: ${colors.green}${stats.fixed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${stats.failed}${colors.reset}`);
  console.log(`  Duration: ${duration}s\n`);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    statistics: stats,
    fixedEntities: results.filter(r => r.status === 'fixed')
  };

  const reportPath = path.join(process.cwd(), 'scripts', 'add-type-field-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`${colors.green}${colors.bright}Done!${colors.reset}`);
  console.log(`${colors.cyan}Report saved to: scripts/add-type-field-report.json${colors.reset}\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}${colors.bright}Fatal Error:${colors.reset} ${error.message}`);
    process.exit(1);
  });
}

module.exports = { processFile, getTypeFromPath };

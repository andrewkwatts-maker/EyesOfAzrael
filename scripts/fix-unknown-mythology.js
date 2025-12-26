/**
 * Fix Unknown Mythology Script
 *
 * This script identifies and fixes entities with mythology: "unknown"
 * by inferring the correct mythology from:
 * 1. File path structure
 * 2. Entity names and prefixes
 * 3. Description content
 * 4. Related entities
 */

const fs = require('fs').promises;
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Known mythology patterns
const mythologyPatterns = {
  aztec: ['aztec', 'tezcatlipoca', 'quetzalcoatl', 'huitzilopochtli', 'coatlicue', 'tlaloc'],
  babylonian: ['babylonian', 'marduk', 'ishtar', 'ea', 'tiamat', 'nabu', 'nergal', 'shamash'],
  buddhist: ['buddhist', 'buddha', 'avalokiteshvara', 'manjushri', 'guanyin', 'yamantaka'],
  celtic: ['celtic', 'dagda', 'brigid', 'lugh', 'morrigan', 'cernunnos', 'danu', 'aengus'],
  chinese: ['chinese', 'jade emperor', 'guanyin', 'dragon kings', 'nezha', 'erlang shen', 'guan yu'],
  christian: ['christian', 'jesus', 'christ', 'god', 'gabriel', 'michael', 'raphael', 'mary'],
  egyptian: ['egyptian', 'ra', 'osiris', 'isis', 'horus', 'anubis', 'thoth', 'amun', 'bastet'],
  greek: ['greek', 'zeus', 'athena', 'apollo', 'artemis', 'ares', 'aphrodite', 'poseidon', 'hades'],
  hindu: ['hindu', 'brahma', 'vishnu', 'shiva', 'durga', 'kali', 'ganesha', 'hanuman', 'lakshmi'],
  islamic: ['islamic', 'allah', 'muhammad', 'jibril', 'gabriel'],
  mayan: ['mayan', 'kukulkan', 'chaac', 'ixchel', 'ah puch', 'itzamna'],
  norse: ['norse', 'odin', 'thor', 'loki', 'freya', 'freyja', 'baldr', 'heimdall', 'tyr'],
  persian: ['persian', 'ahura mazda', 'angra mainyu', 'mithra', 'anahita', 'amesha spentas'],
  roman: ['roman', 'jupiter', 'juno', 'mars', 'venus', 'neptune', 'minerva', 'diana', 'bacchus'],
  sumerian: ['sumerian', 'enlil', 'enki', 'inanna', 'utu', 'ereshkigal', 'dumuzi'],
  yoruba: ['yoruba', 'olodumare', 'eshu', 'shango', 'oshun', 'yemoja', 'ogun']
};

// Statistics tracker
const stats = {
  totalFiles: 0,
  unknownFound: 0,
  fixed: 0,
  failed: 0,
  byMythology: {}
};

/**
 * Extract mythology from file path
 */
function getMythologyFromPath(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  // Check each mythology in the path
  for (const [mythology, patterns] of Object.entries(mythologyPatterns)) {
    if (normalized.includes(`/${mythology}/`) || normalized.includes(`\\${mythology}\\`)) {
      return mythology;
    }
  }

  return null;
}

/**
 * Infer mythology from entity name and content
 */
function inferMythologyFromContent(entity) {
  const searchText = [
    entity.name || '',
    entity.displayName || '',
    entity.id || '',
    entity.description || '',
    entity.subtitle || '',
    JSON.stringify(entity.searchTerms || [])
  ].join(' ').toLowerCase();

  const matches = {};

  // Count pattern matches for each mythology
  for (const [mythology, patterns] of Object.entries(mythologyPatterns)) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (searchText.includes(pattern.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      matches[mythology] = matchCount;
    }
  }

  // Return mythology with most matches
  if (Object.keys(matches).length > 0) {
    return Object.entries(matches).sort((a, b) => b[1] - a[1])[0][0];
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

    // Check if mythology is unknown
    if (entity.mythology !== 'unknown') {
      return { status: 'skip', reason: 'already has mythology' };
    }

    stats.unknownFound++;

    // Try to infer mythology
    let inferredMythology = getMythologyFromPath(filePath);

    if (!inferredMythology) {
      inferredMythology = inferMythologyFromContent(entity);
    }

    if (!inferredMythology) {
      return { status: 'failed', reason: 'could not infer mythology' };
    }

    // Update entity
    entity.mythology = inferredMythology;
    entity._modified = new Date().toISOString();
    entity._fixedMythology = true;
    entity._fixedAt = new Date().toISOString();

    // Update display components if they exist
    if (entity.gridDisplay && entity.gridDisplay.badge) {
      entity.gridDisplay.badge = inferredMythology.charAt(0).toUpperCase() + inferredMythology.slice(1);
    }

    if (entity.listDisplay && entity.listDisplay.meta) {
      entity.listDisplay.meta = `${inferredMythology.charAt(0).toUpperCase() + inferredMythology.slice(1)} Mythology`;
    }

    // Save updated file
    await fs.writeFile(filePath, JSON.stringify(entity, null, 2), 'utf8');

    stats.fixed++;
    if (!stats.byMythology[inferredMythology]) {
      stats.byMythology[inferredMythology] = 0;
    }
    stats.byMythology[inferredMythology]++;

    return {
      status: 'fixed',
      mythology: inferredMythology,
      entity: entity.name || entity.id
    };

  } catch (error) {
    stats.failed++;
    return { status: 'error', error: error.message };
  }
}

/**
 * Recursively find all JSON files
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
 * Create backup of the directory
 */
async function createBackup(sourceDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `${sourceDir}-backup-${timestamp}`;

  console.log(`${colors.cyan}Creating backup: ${backupDir}${colors.reset}`);

  try {
    await fs.cp(sourceDir, backupDir, { recursive: true });
    console.log(`${colors.green}Backup created successfully${colors.reset}\n`);
    return backupDir;
  } catch (error) {
    console.error(`${colors.red}Failed to create backup: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Generate detailed report
 */
function generateReport(results, duration) {
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${(duration / 1000).toFixed(2)}s`,
    statistics: stats,
    details: results.filter(r => r.status === 'fixed' || r.status === 'failed'),
    summary: {
      totalProcessed: stats.totalFiles,
      unknownFound: stats.unknownFound,
      successfullyFixed: stats.fixed,
      failed: stats.failed,
      fixedByMythology: stats.byMythology
    }
  };

  return report;
}

/**
 * Print report to console
 */
function printReport(report) {
  console.log(`\n${colors.bright}${colors.cyan}=== FIX UNKNOWN MYTHOLOGY REPORT ===${colors.reset}\n`);
  console.log(`${colors.yellow}Timestamp:${colors.reset} ${report.timestamp}`);
  console.log(`${colors.yellow}Duration:${colors.reset} ${report.duration}\n`);

  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Files Processed: ${colors.cyan}${report.summary.totalProcessed}${colors.reset}`);
  console.log(`  Unknown Mythology Found: ${colors.yellow}${report.summary.unknownFound}${colors.reset}`);
  console.log(`  Successfully Fixed: ${colors.green}${report.summary.successfullyFixed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${report.summary.failed}${colors.reset}\n`);

  if (Object.keys(report.summary.fixedByMythology).length > 0) {
    console.log(`${colors.bright}Fixed by Mythology:${colors.reset}`);
    for (const [mythology, count] of Object.entries(report.summary.fixedByMythology).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${mythology.padEnd(15)}: ${colors.green}${count}${colors.reset}`);
    }
  }

  console.log(`\n${colors.cyan}Report saved to: scripts/fix-unknown-mythology-report.json${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}Fix Unknown Mythology Script${colors.reset}\n`);

  const assetsDir = path.join(process.cwd(), 'firebase-assets-validated');

  // Check if directory exists
  try {
    await fs.access(assetsDir);
  } catch (error) {
    console.error(`${colors.red}Error: Directory not found: ${assetsDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.yellow}Assets Directory:${colors.reset} ${assetsDir}\n`);

  // Create backup
  const backupDir = await createBackup(assetsDir);

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

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === jsonFiles.length - 1) {
      const percent = ((i + 1) / jsonFiles.length * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${percent}% (${i + 1}/${jsonFiles.length}) - Fixed: ${colors.green}${stats.fixed}${colors.reset}, Failed: ${colors.red}${stats.failed}${colors.reset}`);
    }
  }

  console.log('\n');

  const duration = Date.now() - startTime;

  // Generate and save report
  const report = generateReport(results, duration);
  const reportPath = path.join(process.cwd(), 'scripts', 'fix-unknown-mythology-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // Print report
  printReport(report);

  console.log(`${colors.green}${colors.bright}Done!${colors.reset}`);
  console.log(`${colors.yellow}Backup location:${colors.reset} ${backupDir}\n`);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}${colors.bright}Fatal Error:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { processFile, getMythologyFromPath, inferMythologyFromContent };

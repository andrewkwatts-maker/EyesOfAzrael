/**
 * Add Missing Metadata Script
 *
 * This script enhances entities by adding missing metadata fields:
 * - icon: Generate appropriate emoji based on entity type/name
 * - subtitle: Extract from description or generate
 * - searchTerms: Extract from name, description, alternate names
 * - sortName: Clean version of name for sorting
 * - importance: Calculate based on content length, references, etc. (0-100)
 * - popularity: Set reasonable default (50) or calculate
 * - _version: Set to "2.0"
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

// Icon mappings by entity type and mythology
const iconMappings = {
  deity: {
    default: '✨',
    egyptian: '𓂀',
    greek: '⚡',
    roman: '🏛️',
    norse: '⚔️',
    hindu: '🕉️',
    buddhist: '☸️',
    celtic: '🌿',
    chinese: '🐉',
    japanese: '⛩️',
    aztec: '🐍',
    mayan: '🌞',
    babylonian: '🌙',
    sumerian: '⭐',
    persian: '🔥',
    christian: '✝️',
    islamic: '☪️',
    yoruba: '🥁'
  },
  hero: {
    default: '⚔️',
    greek: '🏺',
    norse: '🛡️',
    celtic: '🗡️',
    hindu: '🏹',
    chinese: '🥋',
    sumerian: '👑'
  },
  creature: {
    default: '🐉',
    greek: '🦁',
    norse: '🐺',
    egyptian: '🦅',
    chinese: '🐲'
  },
  location: {
    default: '🗺️',
    greek: '🏛️',
    norse: '🏔️',
    egyptian: '🏺',
    celtic: '🌳'
  },
  artifact: {
    default: '💎',
    norse: '🔨',
    greek: '⚱️',
    egyptian: '👁️',
    hindu: '🪷'
  },
  concept: {
    default: '💫',
    buddhist: '☸️',
    hindu: '🕉️',
    christian: '✝️',
    islamic: '☪️'
  },
  text: {
    default: '📜',
    christian: '📖',
    buddhist: '📿',
    hindu: '🕉️',
    egyptian: '𓂀'
  },
  ritual: {
    default: '🕯️',
    egyptian: '🔱',
    greek: '🍇',
    hindu: '🔥',
    buddhist: '🙏'
  },
  symbol: {
    default: '⚡',
    egyptian: '☥',
    norse: 'ᚦ',
    celtic: '☘️',
    buddhist: '☸️'
  }
};

// Statistics tracker
const stats = {
  totalFiles: 0,
  processed: 0,
  enhanced: 0,
  failed: 0,
  fieldsAdded: {
    icon: 0,
    subtitle: 0,
    searchTerms: 0,
    sortName: 0,
    importance: 0,
    popularity: 0,
    version: 0
  }
};

/**
 * Generate appropriate icon for entity
 */
function generateIcon(entity) {
  if (entity.icon && entity.icon !== '🔱' && entity.icon !== '✨') {
    return entity.icon; // Keep existing meaningful icon
  }

  const entityType = (entity.entityType || entity.type || 'deity').toLowerCase();
  const mythology = (entity.mythology || 'unknown').toLowerCase();

  // Try specific mythology icon first
  if (iconMappings[entityType] && iconMappings[entityType][mythology]) {
    return iconMappings[entityType][mythology];
  }

  // Fall back to default for entity type
  if (iconMappings[entityType]) {
    return iconMappings[entityType].default;
  }

  // Ultimate fallback
  return '✨';
}

/**
 * Generate subtitle from description or entity data
 */
function generateSubtitle(entity) {
  if (entity.subtitle && entity.subtitle.trim().length > 0) {
    return entity.subtitle;
  }

  // Try to extract from description
  if (entity.description) {
    const desc = entity.description.trim();
    // Take first sentence or first 100 chars
    const firstSentence = desc.match(/^[^.!?]+[.!?]/);
    if (firstSentence) {
      return firstSentence[0].trim();
    }
    return desc.substring(0, 100) + (desc.length > 100 ? '...' : '');
  }

  // Try to generate from domains/attributes
  if (entity.domains && entity.domains.length > 0) {
    const domains = entity.domains.filter(d => d !== 'unknown').join(', ');
    if (domains) {
      return `Associated with ${domains}`;
    }
  }

  // Try epithets
  if (entity.epithets && entity.epithets.length > 0) {
    return entity.epithets[0];
  }

  // Try display name or title
  if (entity.displayName && entity.displayName !== entity.name) {
    return entity.displayName;
  }

  if (entity.title) {
    return entity.title;
  }

  return `${entity.mythology || 'Ancient'} ${entity.entityType || entity.type || 'Entity'}`;
}

/**
 * Generate search terms from entity data
 */
function generateSearchTerms(entity) {
  if (entity.searchTerms && entity.searchTerms.length > 5) {
    return entity.searchTerms; // Already has good search terms
  }

  const terms = new Set();

  // Add name variations
  if (entity.name) {
    terms.add(entity.name.toLowerCase());
    // Remove emojis for search
    terms.add(entity.name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase());
  }

  if (entity.displayName) {
    terms.add(entity.displayName.toLowerCase());
  }

  if (entity.id) {
    terms.add(entity.id.toLowerCase().replace(/_/g, ' '));
  }

  // Add mythology
  if (entity.mythology && entity.mythology !== 'unknown') {
    terms.add(entity.mythology.toLowerCase());
  }

  // Add entity type
  if (entity.entityType || entity.type) {
    terms.add((entity.entityType || entity.type).toLowerCase());
  }

  // Add alternate names
  if (entity.alternate_names && Array.isArray(entity.alternate_names)) {
    entity.alternate_names.forEach(name => terms.add(name.toLowerCase()));
  }

  // Add epithets
  if (entity.epithets && Array.isArray(entity.epithets)) {
    entity.epithets.forEach(epithet => terms.add(epithet.toLowerCase()));
  }

  // Add domains
  if (entity.domains && Array.isArray(entity.domains)) {
    entity.domains.filter(d => d !== 'unknown').forEach(domain => terms.add(domain.toLowerCase()));
  }

  // Extract key words from description
  if (entity.description) {
    const words = entity.description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4) // Only meaningful words
      .filter(word => !['about', 'their', 'which', 'would', 'could', 'should', 'known', 'these', 'those'].includes(word));

    // Add most common words
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([word]) => terms.add(word));
  }

  return Array.from(terms).filter(t => t.length > 0);
}

/**
 * Generate sort name (clean name for alphabetical sorting)
 */
function generateSortName(entity) {
  if (entity.sortName) {
    return entity.sortName;
  }

  let name = entity.name || entity.id || 'unknown';

  // Remove emojis
  name = name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');

  // Remove special characters
  name = name.replace(/[^\w\s-]/g, '');

  // Remove common prefixes
  name = name.replace(/^(the|a|an)\s+/i, '');

  // Convert to lowercase and remove extra spaces
  name = name.toLowerCase().trim().replace(/\s+/g, '');

  return name || 'unknown';
}

/**
 * Calculate importance score (0-100)
 */
function calculateImportance(entity) {
  if (entity.importance && entity.importance > 0) {
    return entity.importance; // Keep existing if reasonable
  }

  let score = 50; // Base score

  // Boost based on content richness
  if (entity.description) {
    const descLength = entity.description.length;
    if (descLength > 1000) score += 20;
    else if (descLength > 500) score += 15;
    else if (descLength > 200) score += 10;
    else if (descLength > 100) score += 5;
  }

  // Boost for relationships
  if (entity.family) {
    const familyMembers = Object.values(entity.family).join('').length;
    if (familyMembers > 200) score += 10;
    else if (familyMembers > 100) score += 5;
  }

  if (entity.relationships) {
    const relCount = Object.keys(entity.relationships).length;
    score += Math.min(relCount * 2, 10);
  }

  // Boost for multiple domains/attributes
  if (entity.domains && entity.domains.length > 3) score += 5;
  if (entity.attributes && entity.attributes.length > 3) score += 5;
  if (entity.epithets && entity.epithets.length > 2) score += 5;

  // Boost for primary sources
  if (entity.primarySources && entity.primarySources.length > 5) {
    score += 10;
  }

  // Boost for symbols
  if (entity.symbols && entity.symbols.length > 2) score += 5;

  // Boost for sacred sites
  if (entity.sacred_sites && entity.sacred_sites.length > 0) score += 5;

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Calculate popularity score (0-100)
 */
function calculatePopularity(entity) {
  if (entity.popularity && entity.popularity > 0) {
    return entity.popularity; // Keep existing
  }

  let score = 50; // Default

  // Well-known deities get boost
  const wellKnown = [
    'zeus', 'odin', 'thor', 'ra', 'osiris', 'isis', 'shiva', 'vishnu',
    'jesus', 'buddha', 'krishna', 'athena', 'apollo', 'artemis',
    'quetzalcoatl', 'anubis', 'horus', 'loki', 'freya'
  ];

  const entityName = (entity.name || entity.id || '').toLowerCase();
  if (wellKnown.some(name => entityName.includes(name))) {
    score = 80;
  }

  return score;
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const entity = JSON.parse(content);

    let modified = false;
    const fieldsAdded = [];

    // Add icon if missing
    if (!entity.icon || entity.icon === '🔱' || entity.icon === '✨') {
      const newIcon = generateIcon(entity);
      if (newIcon !== entity.icon) {
        entity.icon = newIcon;
        modified = true;
        fieldsAdded.push('icon');
        stats.fieldsAdded.icon++;

        // Update display components
        if (entity.gridDisplay) entity.gridDisplay.image = newIcon;
        if (entity.listDisplay) entity.listDisplay.icon = newIcon;
      }
    }

    // Add subtitle if missing or generic
    const newSubtitle = generateSubtitle(entity);
    if (!entity.subtitle || entity.subtitle.trim().length === 0) {
      entity.subtitle = newSubtitle;
      modified = true;
      fieldsAdded.push('subtitle');
      stats.fieldsAdded.subtitle++;

      // Update display components
      if (entity.gridDisplay) entity.gridDisplay.subtitle = newSubtitle;
    }

    // Add/enhance search terms
    const newSearchTerms = generateSearchTerms(entity);
    if (!entity.searchTerms || entity.searchTerms.length < 5) {
      entity.searchTerms = newSearchTerms;
      modified = true;
      fieldsAdded.push('searchTerms');
      stats.fieldsAdded.searchTerms++;
    }

    // Add sort name if missing
    if (!entity.sortName) {
      entity.sortName = generateSortName(entity);
      modified = true;
      fieldsAdded.push('sortName');
      stats.fieldsAdded.sortName++;
    }

    // Add/calculate importance
    const newImportance = calculateImportance(entity);
    if (!entity.importance || entity.importance === 0 || entity.importance === 50) {
      entity.importance = newImportance;
      modified = true;
      fieldsAdded.push('importance');
      stats.fieldsAdded.importance++;
    }

    // Add/calculate popularity
    const newPopularity = calculatePopularity(entity);
    if (!entity.popularity || entity.popularity === 0) {
      entity.popularity = newPopularity;
      modified = true;
      fieldsAdded.push('popularity');
      stats.fieldsAdded.popularity++;
    }

    // Set version to 2.0
    if (entity._version !== '2.0') {
      entity._version = '2.0';
      modified = true;
      fieldsAdded.push('_version');
      stats.fieldsAdded.version++;
    }

    // Update modification timestamp if changed
    if (modified) {
      entity._modified = new Date().toISOString();
      entity._metadataEnhanced = true;
      entity._enhancedAt = new Date().toISOString();

      await fs.writeFile(filePath, JSON.stringify(entity, null, 2), 'utf8');
      stats.enhanced++;

      return {
        status: 'enhanced',
        fieldsAdded,
        entity: entity.name || entity.id
      };
    }

    return { status: 'skip', reason: 'no changes needed' };

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
  const backupDir = `${sourceDir}-backup-metadata-${timestamp}`;

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
    details: results.filter(r => r.status === 'enhanced'),
    summary: {
      totalProcessed: stats.totalFiles,
      enhanced: stats.enhanced,
      failed: stats.failed,
      fieldsAdded: stats.fieldsAdded,
      totalFieldsAdded: Object.values(stats.fieldsAdded).reduce((a, b) => a + b, 0)
    }
  };

  return report;
}

/**
 * Print report to console
 */
function printReport(report) {
  console.log(`\n${colors.bright}${colors.cyan}=== ADD MISSING METADATA REPORT ===${colors.reset}\n`);
  console.log(`${colors.yellow}Timestamp:${colors.reset} ${report.timestamp}`);
  console.log(`${colors.yellow}Duration:${colors.reset} ${report.duration}\n`);

  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Files Processed: ${colors.cyan}${report.summary.totalProcessed}${colors.reset}`);
  console.log(`  Files Enhanced: ${colors.green}${report.summary.enhanced}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${report.summary.failed}${colors.reset}`);
  console.log(`  Total Fields Added: ${colors.green}${report.summary.totalFieldsAdded}${colors.reset}\n`);

  console.log(`${colors.bright}Fields Added:${colors.reset}`);
  for (const [field, count] of Object.entries(report.summary.fieldsAdded)) {
    if (count > 0) {
      console.log(`  ${field.padEnd(15)}: ${colors.green}${count}${colors.reset}`);
    }
  }

  console.log(`\n${colors.cyan}Report saved to: scripts/add-missing-metadata-report.json${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}Add Missing Metadata Script${colors.reset}\n`);

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
    stats.processed++;

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === jsonFiles.length - 1) {
      const percent = ((i + 1) / jsonFiles.length * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${percent}% (${i + 1}/${jsonFiles.length}) - Enhanced: ${colors.green}${stats.enhanced}${colors.reset}, Failed: ${colors.red}${stats.failed}${colors.reset}`);
    }
  }

  console.log('\n');

  const duration = Date.now() - startTime;

  // Generate and save report
  const report = generateReport(results, duration);
  const reportPath = path.join(process.cwd(), 'scripts', 'add-missing-metadata-report.json');
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

module.exports = {
  processFile,
  generateIcon,
  generateSubtitle,
  generateSearchTerms,
  generateSortName,
  calculateImportance,
  calculatePopularity
};

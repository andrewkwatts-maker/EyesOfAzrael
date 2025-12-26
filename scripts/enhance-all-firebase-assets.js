#!/usr/bin/env node

/**
 * Firebase Assets Metadata Enhancement Script
 * Version: 2.0
 * Date: December 25, 2025
 *
 * Adds all required metadata according to ASSET_METADATA_STANDARDS.md:
 * - Core required fields (id, name, entityType, mythology, description, etc.)
 * - searchTerms array
 * - sortName
 * - importance and popularity scores
 * - gridDisplay, tableDisplay, listDisplay, panelDisplay metadata
 * - corpusSearch metadata
 * - _version: "2.0"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ENHANCED_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced');
const STATS = {
  total: 0,
  enhanced: 0,
  idsFixed: 0,
  searchTermsAdded: 0,
  displayMetadataAdded: 0,
  corpusSearchAdded: 0,
  errors: []
};

/**
 * Generate ID from file path
 */
function generateIdFromPath(filePath) {
  const parts = filePath.split(path.sep);
  const mythology = parts[parts.length - 2]; // parent directory
  const filename = path.basename(filePath, '.json');

  // Clean filename
  const cleanName = filename
    .replace(/^(greek_deity_|norse_|egyptian_|babylonian_|sumerian_)/, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase();

  return `${mythology}_${cleanName}`;
}

/**
 * Extract search terms from entity data
 */
function generateSearchTerms(entity) {
  const terms = new Set();

  // Add name variations
  if (entity.name) terms.add(entity.name.toLowerCase());
  if (entity.displayName) terms.add(entity.displayName.toLowerCase());

  // Add epithets
  if (entity.epithets) {
    entity.epithets.forEach(e => terms.add(e.toLowerCase()));
  }

  // Add domains
  if (entity.domains) {
    entity.domains.forEach(d => terms.add(d.toLowerCase()));
  }
  if (entity.deity?.domains) {
    entity.deity.domains.forEach(d => terms.add(d.toLowerCase()));
  }

  // Add symbols
  if (entity.symbols) {
    entity.symbols.forEach(s => terms.add(s.toLowerCase()));
  }
  if (entity.deity?.symbols) {
    entity.deity.symbols.forEach(s => terms.add(s.toLowerCase()));
  }

  // Add mythology
  if (entity.mythology) terms.add(entity.mythology.toLowerCase());

  // Add from description
  if (entity.description) {
    const words = entity.description.toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    words.forEach(w => terms.add(w));
  }

  // Add from subtitle
  if (entity.subtitle) {
    const words = entity.subtitle.toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    words.forEach(w => terms.add(w));
  }

  return Array.from(terms).slice(0, 50); // Limit to 50 terms
}

/**
 * Generate sort name
 */
function generateSortName(name) {
  return name
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Estimate importance score
 */
function estimateImportance(entity) {
  let score = 50; // Base score

  // Higher importance for certain roles/domains
  const highImportanceDomains = ['king', 'queen', 'chief', 'supreme', 'creator', 'father', 'mother'];
  const domains = (entity.domains || []).concat(entity.deity?.domains || []);

  if (domains.some(d => highImportanceDomains.some(h => d.toLowerCase().includes(h)))) {
    score += 30;
  }

  // Bonus for rich content
  if (entity.description && entity.description.length > 200) score += 10;
  if (entity.longDescription) score += 5;
  if (entity.relationships) score += 5;
  if (entity.primarySources && entity.primarySources.length > 5) score += 5;

  return Math.min(100, score);
}

/**
 * Estimate popularity score
 */
function estimatePopularity(entity) {
  let score = 40; // Base score

  // Well-known deities get higher scores
  const popularNames = ['zeus', 'odin', 'thor', 'isis', 'ra', 'vishnu', 'shiva', 'apollo'];
  const name = (entity.name || '').toLowerCase();

  if (popularNames.some(p => name.includes(p))) {
    score += 40;
  }

  // Bonus for related entities
  if (entity.relatedEntities && entity.relatedEntities.length > 3) score += 10;

  // Bonus for symbols (visual appeal)
  if (entity.symbols && entity.symbols.length > 3) score += 5;

  return Math.min(100, score);
}

/**
 * Generate grid display metadata
 */
function generateGridDisplay(entity) {
  const domains = entity.domains || entity.deity?.domains || [];
  const symbols = entity.symbols || entity.deity?.symbols || [];

  return {
    title: entity.name || 'Unknown',
    subtitle: entity.subtitle || (domains[0] || 'Deity'),
    image: entity.icon || '🔱',
    badge: entity.mythology ? entity.mythology.charAt(0).toUpperCase() + entity.mythology.slice(1) : '',
    stats: [
      { label: 'Domain', value: domains[0] || 'Unknown' },
      { label: 'Symbol', value: symbols[0] || entity.icon || '?' }
    ],
    hoverInfo: {
      quick: entity.description ? entity.description.substring(0, 100) + '...' : '',
      domains: domains.slice(0, 3)
    }
  };
}

/**
 * Generate table display metadata
 */
function generateTableDisplay(entity) {
  return {
    columns: {
      name: { label: 'Name', sortable: true },
      mythology: { label: 'Mythology', sortable: true },
      domains: { label: 'Domains', sortable: false },
      importance: { label: 'Importance', sortable: true }
    },
    defaultSort: 'importance',
    defaultOrder: 'desc'
  };
}

/**
 * Generate list display metadata
 */
function generateListDisplay(entity) {
  const domains = entity.domains || entity.deity?.domains || [];

  return {
    icon: entity.icon || '🔱',
    primary: `${entity.name || 'Unknown'} - ${entity.subtitle || domains[0] || 'Deity'}`,
    secondary: entity.description ? entity.description.substring(0, 100) + '...' : '',
    meta: entity.mythology ? `${entity.mythology.charAt(0).toUpperCase() + entity.mythology.slice(1)} Mythology` : '',
    expandable: !!(entity.description && entity.description.length > 100),
    expandedContent: entity.description || ''
  };
}

/**
 * Generate panel display metadata
 */
function generatePanelDisplay(entity) {
  const sections = [];

  // Attributes section
  const attrs = {};
  if (entity.domains || entity.deity?.domains) {
    attrs.domain = entity.domains || entity.deity.domains;
  }
  if (entity.symbols || entity.deity?.symbols) {
    attrs.symbol = entity.symbols || entity.deity.symbols;
  }
  if (entity.epithets) {
    attrs.epithets = entity.epithets;
  }

  if (Object.keys(attrs).length > 0) {
    sections.push({
      type: 'attributes',
      title: 'Attributes',
      data: attrs
    });
  }

  // Description section
  if (entity.description) {
    sections.push({
      type: 'text',
      title: 'Description',
      content: entity.description
    });
  }

  // Family section
  if (entity.relationships) {
    const familyItems = [];
    if (entity.relationships.mother) familyItems.push(`Mother: ${entity.relationships.mother}`);
    if (entity.relationships.father) familyItems.push(`Father: ${entity.relationships.father}`);
    if (entity.relationships.children) {
      familyItems.push(`Children: ${Array.isArray(entity.relationships.children) ? entity.relationships.children.join(', ') : entity.relationships.children}`);
    }

    if (familyItems.length > 0) {
      sections.push({
        type: 'list',
        title: 'Family',
        items: familyItems
      });
    }
  }

  return {
    layout: 'hero',
    sections
  };
}

/**
 * Generate corpus search metadata
 */
function generateCorpusSearch(entity) {
  const canonical = (entity.name || '').toLowerCase().replace(/[^a-z0-9]/gi, '');

  // Variants
  const variants = new Set([canonical]);
  if (entity.displayName) variants.add(entity.displayName.toLowerCase());
  if (entity.name) variants.add(entity.name.toLowerCase());

  // Epithets
  const epithets = entity.epithets || [];

  // Domains
  const domains = (entity.domains || []).concat(entity.deity?.domains || []);

  // Symbols
  const symbols = (entity.symbols || []).concat(entity.deity?.symbols || []);

  // Places (extract from content)
  const places = [];

  // Concepts
  const concepts = [];

  return {
    canonical,
    variants: Array.from(variants),
    epithets: epithets.slice(0, 10),
    domains: domains.slice(0, 10),
    symbols: symbols.slice(0, 10),
    places,
    concepts
  };
}

/**
 * Enhance a single entity file
 */
function enhanceEntity(filePath) {
  try {
    STATS.total++;

    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(content);

    // Determine entity type
    const entityType = data.entityType || data.type ||
                       (filePath.includes('/deities/') ? 'deity' :
                        filePath.includes('/heroes/') ? 'hero' :
                        filePath.includes('/creatures/') ? 'creature' :
                        filePath.includes('/cosmology/') ? 'cosmology' :
                        filePath.includes('/rituals/') ? 'ritual' :
                        filePath.includes('/texts/') ? 'text' :
                        filePath.includes('/herbs/') ? 'herb' : 'unknown');

    // Extract entity object (handle different structures)
    let entity = data.entity || data;

    // Fix missing ID
    if (!entity.id) {
      entity.id = generateIdFromPath(filePath);
      STATS.idsFixed++;
    }

    // Add core required fields
    if (!entity.name && entity.entity?.name) entity.name = entity.entity.name;
    if (!entity.entityType) entity.entityType = entityType;
    if (!entity.mythology && entity.entity?.mythology) entity.mythology = entity.entity.mythology;
    if (!entity.description && entity.entity?.description) entity.description = entity.entity.description;

    // Add icon if missing
    if (!entity.icon) {
      entity.icon = entity.entity?.icon || '🔱';
    }

    // Add subtitle if missing
    if (!entity.subtitle && entity.entity?.subtitle) {
      entity.subtitle = entity.entity.subtitle;
    }

    // Generate and add searchTerms
    if (!entity.searchTerms || entity.searchTerms.length === 0) {
      entity.searchTerms = generateSearchTerms(entity);
      STATS.searchTermsAdded++;
    }

    // Generate and add sortName
    if (!entity.sortName && entity.name) {
      entity.sortName = generateSortName(entity.name);
    }

    // Add importance score
    if (typeof entity.importance !== 'number') {
      entity.importance = estimateImportance(entity);
    }

    // Add popularity score
    if (typeof entity.popularity !== 'number') {
      entity.popularity = estimatePopularity(entity);
    }

    // Add display metadata
    if (!entity.gridDisplay) {
      entity.gridDisplay = generateGridDisplay(entity);
      STATS.displayMetadataAdded++;
    }

    if (!entity.tableDisplay) {
      entity.tableDisplay = generateTableDisplay(entity);
    }

    if (!entity.listDisplay) {
      entity.listDisplay = generateListDisplay(entity);
    }

    if (!entity.panelDisplay) {
      entity.panelDisplay = generatePanelDisplay(entity);
    }

    // Add corpus search metadata
    if (!entity.corpusSearch) {
      entity.corpusSearch = generateCorpusSearch(entity);
      STATS.corpusSearchAdded++;
    }

    // Add timestamps if missing
    const now = new Date().toISOString();
    if (!entity._created) entity._created = now;
    if (!entity._modified) entity._modified = now;

    // Mark as enhanced
    entity._enhanced = true;
    entity._version = '2.0';

    // Save enhanced file
    fs.writeFileSync(filePath, JSON.stringify(entity, null, 2), 'utf8');
    STATS.enhanced++;

    return true;
  } catch (error) {
    STATS.errors.push({
      file: filePath,
      error: error.message
    });
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Firebase Assets Metadata Enhancement Script v2.0');
  console.log('================================================\n');

  console.log(`Looking for files in: ${ENHANCED_DIR}`);

  // Find all JSON files
  const pattern = '**/*.json';
  const files = glob.sync(pattern, {
    cwd: ENHANCED_DIR,
    absolute: true,
    nodir: true
  });

  console.log(`Found ${files.length} JSON files\n`);
  console.log('Processing files...\n');

  // Process each file
  files.forEach((file, index) => {
    if (index % 10 === 0) {
      console.log(`Progress: ${index}/${files.length}`);
    }
    enhanceEntity(file);
  });

  // Print summary
  console.log('\n================================================');
  console.log('ENHANCEMENT COMPLETE');
  console.log('================================================\n');
  console.log(`Total files processed: ${STATS.total}`);
  console.log(`Successfully enhanced: ${STATS.enhanced}`);
  console.log(`IDs fixed: ${STATS.idsFixed}`);
  console.log(`Search terms added: ${STATS.searchTermsAdded}`);
  console.log(`Display metadata added: ${STATS.displayMetadataAdded}`);
  console.log(`Corpus search metadata added: ${STATS.corpusSearchAdded}`);
  console.log(`Errors: ${STATS.errors.length}\n`);

  if (STATS.errors.length > 0) {
    console.log('ERRORS:');
    STATS.errors.slice(0, 10).forEach(err => {
      console.log(`  ${err.file}: ${err.error}`);
    });
    if (STATS.errors.length > 10) {
      console.log(`  ... and ${STATS.errors.length - 10} more errors`);
    }
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    stats: STATS,
    summary: {
      total_files: STATS.total,
      enhanced_files: STATS.enhanced,
      success_rate: `${((STATS.enhanced / STATS.total) * 100).toFixed(2)}%`
    }
  };

  const reportPath = path.join(__dirname, '..', 'METADATA_ENHANCEMENT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { enhanceEntity, generateSearchTerms, generateCorpusSearch };

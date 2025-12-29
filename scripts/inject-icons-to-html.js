#!/usr/bin/env node

/**
 * Icon Injection Script for Eyes of Azrael
 *
 * Injects SVG icons into HTML files based on entity type and metadata
 * Part of AGENT 3: Icon System Deployment
 *
 * Usage:
 *   node scripts/inject-icons-to-html.js --dry-run          # Preview changes
 *   node scripts/inject-icons-to-html.js --execute          # Apply changes
 *   node scripts/inject-icons-to-html.js --file path.html   # Process single file
 *
 * Created: 2025-12-29
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  mythosDir: path.join(__dirname, '..', 'mythos'),
  iconsDir: path.join(__dirname, '..', 'icons'),
  iconRegistryPath: path.join(__dirname, '..', 'icons', 'icon-type-registry.json'),
  cssPath: '/css/entity-icons.css',

  // Entity type to icon category mapping
  entityTypeMapping: {
    'deity': 'deity-domains',
    'deities': 'deity-domains',
    'creature': 'creatures',
    'creatures': 'creatures',
    'hero': 'heroes',
    'heroes': 'heroes',
    'item': 'items',
    'items': 'items',
    'place': 'places',
    'places': 'places',
    'text': 'texts',
    'texts': 'texts',
    'ritual': 'rituals',
    'rituals': 'rituals',
    'symbol': 'symbols',
    'symbols': 'symbols',
    'herb': 'herbs',
    'herbs': 'herbs',
    'cosmology': 'places',
    'magic': 'symbols',
    'path': 'rituals'
  },

  // Default icons by entity type
  defaultIcons: {
    'deity': '/icons/deity-icon.svg',
    'deities': '/icons/deity-icon.svg',
    'creature': '/icons/creature-icon.svg',
    'creatures': '/icons/creature-icon.svg',
    'hero': '/icons/hero-icon.svg',
    'heroes': '/icons/hero-icon.svg',
    'item': '/icons/item-icon.svg',
    'items': '/icons/item-icon.svg',
    'place': '/icons/place-icon.svg',
    'places': '/icons/place-icon.svg',
    'text': '/icons/texts/book.svg',
    'texts': '/icons/texts/book.svg',
    'ritual': '/icons/rituals/offering.svg',
    'rituals': '/icons/rituals/offering.svg',
    'symbol': '/icons/symbols/star.svg',
    'symbols': '/icons/symbols/star.svg',
    'herb': '/icons/herbs/leaf.svg',
    'herbs': '/icons/herbs/leaf.svg',
    'cosmology': '/icons/places/realm.svg',
    'magic': '/icons/magic-icon.svg'
  }
};

// ============================================================================
// Icon Registry
// ============================================================================

let iconRegistry = null;

function loadIconRegistry() {
  try {
    const registryContent = fs.readFileSync(CONFIG.iconRegistryPath, 'utf8');
    iconRegistry = JSON.parse(registryContent);
    console.log('✓ Loaded icon registry with', iconRegistry.metadata.totalIcons, 'icons');
    return iconRegistry;
  } catch (error) {
    console.error('✗ Failed to load icon registry:', error.message);
    return null;
  }
}

// ============================================================================
// Icon Selection Logic
// ============================================================================

/**
 * Determines the best icon for an entity based on metadata
 */
function selectIcon(entityMetadata, filePath) {
  const entityType = entityMetadata.entityType || entityMetadata.type;
  const mythology = entityMetadata.mythology;
  const entityId = entityMetadata.entityId || entityMetadata.id;

  // Try to get a specific icon based on entity attributes
  const specificIcon = findSpecificIcon(entityType, entityId, mythology, filePath);
  if (specificIcon) {
    return specificIcon;
  }

  // Fall back to default icon for entity type
  const defaultIcon = CONFIG.defaultIcons[entityType];
  if (defaultIcon) {
    return defaultIcon;
  }

  // Ultimate fallback
  return '/icons/app-icon.svg';
}

/**
 * Find a specific icon based on entity attributes and keywords
 */
function findSpecificIcon(entityType, entityId, mythology, filePath) {
  if (!iconRegistry) return null;

  const category = CONFIG.entityTypeMapping[entityType];
  if (!category || !iconRegistry.categories[category]) {
    return null;
  }

  const icons = iconRegistry.categories[category].icons;

  // Extract keywords from file path and entity ID
  const pathLower = filePath.toLowerCase();
  const idLower = (entityId || '').toLowerCase();

  // Check each icon in the category
  for (const [iconName, iconData] of Object.entries(icons)) {
    const keywords = iconData.keywords || [];

    // Check if any keyword matches the entity ID or path
    for (const keyword of keywords) {
      if (idLower.includes(keyword.toLowerCase()) ||
          pathLower.includes(keyword.toLowerCase())) {
        return '/' + iconData.path;
      }
    }
  }

  // For deities, try to match domain
  if (category === 'deity-domains') {
    const deityDomains = ['war', 'wisdom', 'love', 'death', 'sky', 'earth', 'sea',
                          'sun', 'moon', 'trickster', 'healing', 'fertility',
                          'fire', 'creator', 'justice'];

    for (const domain of deityDomains) {
      if (idLower.includes(domain) || pathLower.includes(domain)) {
        return `/icons/deity-domains/${domain}.svg`;
      }
    }
  }

  return null;
}

// ============================================================================
// HTML Extraction and Injection
// ============================================================================

/**
 * Extract metadata from HTML file
 */
function extractMetadata(htmlContent) {
  const metadata = {};

  // Try to parse with JSDOM for more reliable extraction
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Extract from meta tags
    const mythologyMeta = document.querySelector('meta[name="mythology"]');
    const entityTypeMeta = document.querySelector('meta[name="entity-type"]');
    const entityIdMeta = document.querySelector('meta[name="entity-id"]');

    if (mythologyMeta) metadata.mythology = mythologyMeta.getAttribute('content');
    if (entityTypeMeta) metadata.entityType = entityTypeMeta.getAttribute('content');
    if (entityIdMeta) metadata.entityId = entityIdMeta.getAttribute('content');

    // Extract from data attributes on main or body
    const main = document.querySelector('main');
    if (main) {
      const dataMyth = main.getAttribute('data-mythology');
      if (dataMyth) metadata.mythology = dataMyth;
    }

    return metadata;
  } catch (error) {
    console.warn('Failed to parse HTML with JSDOM, using regex fallback');
  }

  // Regex fallback
  const mythologyMatch = htmlContent.match(/name="mythology"[^>]*content="([^"]+)"/i) ||
                        htmlContent.match(/data-mythology="([^"]+)"/i);
  const entityTypeMatch = htmlContent.match(/name="entity-type"[^>]*content="([^"]+)"/i);
  const entityIdMatch = htmlContent.match(/name="entity-id"[^>]*content="([^"]+)"/i);

  if (mythologyMatch) metadata.mythology = mythologyMatch[1];
  if (entityTypeMatch) metadata.entityType = entityTypeMatch[1];
  if (entityIdMatch) metadata.entityId = entityIdMatch[1];

  return metadata;
}

/**
 * Extract entity type from file path
 */
function extractEntityTypeFromPath(filePath) {
  const parts = filePath.split(path.sep);

  // Look for entity type in path (e.g., /mythos/greek/deities/zeus.html)
  const entityTypes = ['deities', 'creatures', 'heroes', 'items', 'places',
                      'texts', 'rituals', 'symbols', 'herbs', 'cosmology',
                      'magic', 'path'];

  for (const type of entityTypes) {
    if (parts.includes(type)) {
      return type;
    }
  }

  return null;
}

/**
 * Inject icon into HTML content
 */
function injectIcon(htmlContent, iconPath, metadata) {
  // Check if CSS is already linked
  const cssLinkPattern = /<link[^>]*href=["'][^"']*entity-icons\.css["']/i;
  let modifiedHtml = htmlContent;

  if (!cssLinkPattern.test(htmlContent)) {
    // Add CSS link in the head section
    const headEndPattern = /<\/head>/i;
    const cssLink = `  <link href="${CONFIG.cssPath}" rel="stylesheet"/>\n</head>`;
    modifiedHtml = modifiedHtml.replace(headEndPattern, cssLink);
  }

  // Create icon HTML
  const entityName = metadata.entityId || 'Entity';
  const iconHtml = `
    <div class="entity-icon-container">
      <img src="${iconPath}"
           alt="${entityName} icon"
           class="entity-icon hero-size"
           loading="lazy" />
    </div>`;

  // Try to inject into hero-icon-display div
  const heroIconPattern = /<div class="hero-icon-display"[^>]*>([\s\S]*?)<\/div>/i;

  if (heroIconPattern.test(modifiedHtml)) {
    // Replace content of existing hero-icon-display
    modifiedHtml = modifiedHtml.replace(heroIconPattern, (match, content) => {
      // Keep emoji as fallback, but add icon
      const trimmedContent = content.trim();
      if (trimmedContent && !trimmedContent.includes('<img')) {
        return `<div class="hero-icon-display has-icon">${iconHtml}\n     ${trimmedContent}\n    </div>`;
      } else if (!trimmedContent.includes('<img')) {
        return `<div class="hero-icon-display has-icon">${iconHtml}\n    </div>`;
      }
      return match; // Already has an icon
    });
  } else {
    // Try to inject after hero-section opening or before h2
    const heroSectionPattern = /(<section class="hero-section"[^>]*>)/i;
    if (heroSectionPattern.test(modifiedHtml)) {
      modifiedHtml = modifiedHtml.replace(heroSectionPattern, `$1
    <div class="hero-icon-display has-icon">${iconHtml}
    </div>`);
    }
  }

  return modifiedHtml;
}

// ============================================================================
// File Processing
// ============================================================================

/**
 * Process a single HTML file
 */
function processHtmlFile(filePath, dryRun = true) {
  try {
    // Read file
    const htmlContent = fs.readFileSync(filePath, 'utf8');

    // Check if already has icon
    if (htmlContent.includes('entity-icon-container') ||
        htmlContent.includes('class="entity-icon"')) {
      return { status: 'skipped', reason: 'already has icon' };
    }

    // Extract metadata
    let metadata = extractMetadata(htmlContent);

    // If no metadata, try to infer from path
    if (!metadata.entityType) {
      metadata.entityType = extractEntityTypeFromPath(filePath);
    }

    // If still no entity type, skip
    if (!metadata.entityType) {
      return { status: 'skipped', reason: 'no entity type found' };
    }

    // Select appropriate icon
    const iconPath = selectIcon(metadata, filePath);

    // Inject icon
    const modifiedHtml = injectIcon(htmlContent, iconPath, metadata);

    // Write file (if not dry run)
    if (!dryRun) {
      fs.writeFileSync(filePath, modifiedHtml, 'utf8');
      return {
        status: 'success',
        iconPath,
        metadata,
        changes: {
          cssAdded: !htmlContent.includes('entity-icons.css'),
          iconInjected: true
        }
      };
    }

    return {
      status: 'preview',
      iconPath,
      metadata,
      changes: {
        cssAdded: !htmlContent.includes('entity-icons.css'),
        iconInjected: true
      }
    };

  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

/**
 * Recursively find all HTML files in a directory
 */
function findHtmlFiles(dir) {
  const files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findHtmlFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

/**
 * Process all HTML files in the mythos directory
 */
function processAllFiles(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log('ICON INJECTION PROCESS');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'EXECUTE (will modify files)'}`);
  console.log('='.repeat(80) + '\n');

  // Load icon registry
  loadIconRegistry();

  // Find all HTML files
  console.log('Searching for HTML files in:', CONFIG.mythosDir);
  const htmlFiles = findHtmlFiles(CONFIG.mythosDir);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  // Process each file
  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
    preview: 0,
    details: []
  };

  for (const filePath of htmlFiles) {
    const relativePath = path.relative(CONFIG.rootDir, filePath);
    const result = processHtmlFile(filePath, dryRun);

    results.details.push({
      file: relativePath,
      ...result
    });

    if (result.status === 'success') {
      results.success++;
      console.log(`✓ ${relativePath}`);
      console.log(`  Icon: ${result.iconPath}`);
    } else if (result.status === 'preview') {
      results.preview++;
      console.log(`○ ${relativePath}`);
      console.log(`  Would inject: ${result.iconPath}`);
    } else if (result.status === 'skipped') {
      results.skipped++;
      // console.log(`- ${relativePath} (${result.reason})`);
    } else if (result.status === 'error') {
      results.errors++;
      console.log(`✗ ${relativePath}`);
      console.log(`  Error: ${result.error}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total files processed: ${htmlFiles.length}`);
  console.log(`${dryRun ? 'Would inject' : 'Injected'}: ${dryRun ? results.preview : results.success}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Errors: ${results.errors}`);
  console.log('='.repeat(80) + '\n');

  return results;
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Icon Injection Script for Eyes of Azrael

Usage:
  node scripts/inject-icons-to-html.js --dry-run          # Preview changes
  node scripts/inject-icons-to-html.js --execute          # Apply changes
  node scripts/inject-icons-to-html.js --file path.html   # Process single file

Options:
  --dry-run       Preview changes without modifying files (default)
  --execute       Apply changes to files
  --file <path>   Process a single file
  --help          Show this help message
    `);
    return;
  }

  if (args.includes('--file')) {
    // Process single file
    const fileIndex = args.indexOf('--file') + 1;
    const filePath = args[fileIndex];
    const dryRun = !args.includes('--execute');

    if (!filePath) {
      console.error('Error: --file requires a path argument');
      process.exit(1);
    }

    loadIconRegistry();
    const result = processHtmlFile(path.resolve(filePath), dryRun);
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Process all files
    const dryRun = !args.includes('--execute');
    const results = processAllFiles(dryRun);

    // Save results to JSON file
    const resultsPath = path.join(CONFIG.rootDir, 'ICON_INJECTION_RESULTS.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nDetailed results saved to: ${resultsPath}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  processHtmlFile,
  selectIcon,
  extractMetadata,
  findHtmlFiles,
  processAllFiles
};

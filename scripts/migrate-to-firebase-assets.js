#!/usr/bin/env node

/**
 * Firebase Asset Migration Script
 *
 * Migrates HTML mythology content to Firebase assets collection.
 * Parses 802+ HTML pages and converts them to structured asset documents.
 *
 * Usage:
 *   node migrate-to-firebase-assets.js --dry-run
 *   node migrate-to-firebase-assets.js --page mythos/greek/deities/zeus.html
 *   node migrate-to-firebase-assets.js --mythology greek
 *   node migrate-to-firebase-assets.js --all
 *   node migrate-to-firebase-assets.js --all --resume
 */

const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const cliProgress = require('cli-progress');
const { glob } = require('glob');
const config = require('./migration-config');

// Command line arguments
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  page: args.includes('--page') ? args[args.indexOf('--page') + 1] : null,
  mythology: args.includes('--mythology') ? args[args.indexOf('--mythology') + 1] : null,
  all: args.includes('--all'),
  resume: args.includes('--resume'),
  verbose: args.includes('--verbose') || args.includes('-v')
};

// Statistics tracking
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Processed files tracker for resume functionality
const processedFiles = new Set();
const PROGRESS_FILE = 'migration-progress.json';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = require('../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    return admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    console.log('\n📝 Make sure you have firebase-service-account.json in the project root.');
    console.log('   Download it from Firebase Console → Project Settings → Service Accounts');
    process.exit(1);
  }
}

/**
 * Load progress from previous run
 */
async function loadProgress() {
  if (!flags.resume) return;

  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const { processed } = JSON.parse(data);
    processed.forEach(file => processedFiles.add(file));
    console.log(`📂 Resumed: ${processedFiles.size} files already processed`);
  } catch (error) {
    // File doesn't exist, starting fresh
  }
}

/**
 * Save progress for resume capability
 */
async function saveProgress() {
  const data = {
    timestamp: new Date().toISOString(),
    processed: Array.from(processedFiles),
    stats
  };
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Detect asset type from URL path
 */
function detectAssetType(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const [assetType, patterns] of Object.entries(config.assetTypePatterns)) {
    if (patterns.some(pattern => normalizedPath.includes(pattern))) {
      return assetType;
    }
  }

  // Default to concept if can't determine
  return 'concept';
}

/**
 * Detect mythology from URL path
 */
function detectMythology(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const [mythology, pattern] of Object.entries(config.mythologyPatterns)) {
    if (pattern.test(normalizedPath)) {
      return mythology;
    }
  }

  return null;
}

/**
 * Generate asset ID from file path
 */
function generateAssetId(filePath, mythology) {
  const fileName = path.basename(filePath, '.html');
  const slug = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return mythology ? `${mythology}-${slug}` : slug;
}

/**
 * Auto-assign icon based on title keywords
 */
function assignIcon(title) {
  if (!title) return '📄';

  const lowerTitle = title.toLowerCase();

  for (const [icon, keywords] of Object.entries(config.iconKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return icon;
    }
  }

  return '📄'; // Default icon
}

/**
 * Clean and normalize text content
 */
function cleanText(text) {
  if (!text) return '';

  let cleaned = text;

  if (config.contentCleanup.trimWhitespace) {
    cleaned = cleaned.trim();
  }

  if (config.contentCleanup.normalizeSpaces) {
    cleaned = cleaned.replace(/\s+/g, ' ');
  }

  return cleaned;
}

/**
 * Extract metadata from attribute cards
 */
function extractMetadata($, assetType) {
  const metadata = {};

  $('.attribute-card').each((i, card) => {
    const $card = $(card);
    const label = cleanText($card.find('.attribute-label').text());
    const value = cleanText($card.find('.attribute-value').text());

    if (!label || !value) return;

    // Map to metadata fields
    const lowerLabel = label.toLowerCase();

    for (const [field, pattern] of Object.entries(config.metadataPatterns)) {
      if (pattern.labels.some(l => lowerLabel.includes(l.toLowerCase()))) {
        metadata[field] = value.split(',').map(v => v.trim()).filter(Boolean);
        break;
      }
    }
  });

  return metadata;
}

/**
 * Extract relationships from page
 */
function extractRelationships($) {
  const relationships = {};

  // Find relationship section
  const $relationshipSection = $('h2, h3').filter((i, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes('relationship') || text.includes('family');
  }).parent();

  if ($relationshipSection.length === 0) return relationships;

  // Extract from lists
  $relationshipSection.find('li').each((i, li) => {
    const text = $(li).text();
    const strongText = $(li).find('strong').text();

    for (const [relType, labels] of Object.entries(config.relationshipPatterns)) {
      if (labels.some(label => strongText.includes(label))) {
        const content = text.replace(strongText, '').replace(':', '').trim();
        relationships[relType] = content;
        break;
      }
    }
  });

  return relationships;
}

/**
 * Parse HTML section into panel
 */
function parseSection($, section, index) {
  const $section = $(section);

  // Get section title
  const $title = $section.find('h2, h3').first();
  const title = cleanText($title.text());

  // Assign icon
  const titleIcon = assignIcon(title);

  // Check for grid structure
  const $grid = $section.find(config.panelTypes.grid);
  if ($grid.length > 0) {
    return parseGridPanel($, $grid, title, titleIcon, index);
  }

  // Regular text panel
  return parseTextPanel($, $section, title, titleIcon, index);
}

/**
 * Parse grid panel
 */
function parseGridPanel($, $grid, title, titleIcon, order) {
  const children = [];

  // Detect grid width
  let gridWidth = config.defaults.gridWidth;
  const gridClass = $grid.attr('class') || '';
  for (const [width, patterns] of Object.entries(config.gridWidthPatterns)) {
    if (patterns.some(pattern => gridClass.includes(pattern))) {
      gridWidth = parseInt(width);
      break;
    }
  }

  // Extract grid items
  $grid.find('.deity-card, .attribute-card, .glass-card, .gnostic-topic-card').each((i, card) => {
    const $card = $(card);
    const itemTitle = cleanText($card.find('h3, h4').first().text());
    const itemContent = cleanText($card.find('p').text());
    const itemUrl = $card.attr('href') || $card.find('a').first().attr('href');

    if (itemUrl) {
      children.push({
        type: 'link',
        title: itemTitle,
        url: itemUrl,
        description: itemContent || undefined
      });
    } else {
      children.push({
        type: 'card',
        title: itemTitle,
        content: itemContent
      });
    }
  });

  return {
    type: 'grid',
    title: title || 'Related',
    titleIcon,
    gridWidth,
    children,
    order
  };
}

/**
 * Parse text panel
 */
function parseTextPanel($, $section, title, titleIcon, order) {
  // Extract all text content
  const paragraphs = [];

  $section.find('p').each((i, p) => {
    const text = cleanText($(p).text());
    if (text && text.length > 10) {
      paragraphs.push(text);
    }
  });

  // Extract lists
  const lists = [];
  $section.find('ul, ol').each((i, list) => {
    const items = [];
    $(list).find('li').each((j, li) => {
      const text = cleanText($(li).text());
      if (text) items.push(text);
    });
    if (items.length > 0) {
      lists.push(items);
    }
  });

  // Combine content
  let content = paragraphs.join('\n\n');
  if (lists.length > 0) {
    lists.forEach(list => {
      content += '\n\n' + list.map(item => `• ${item}`).join('\n');
    });
  }

  return {
    type: 'panel',
    title: title || 'Overview',
    titleIcon,
    content: cleanText(content),
    order
  };
}

/**
 * Extract summary from first paragraph or deity header
 */
function extractSummary($) {
  // Try deity header subtitle
  const $subtitle = $('.deity-header .subtitle, .deity-header p').first();
  if ($subtitle.length > 0) {
    return cleanText($subtitle.text());
  }

  // Try first main paragraph
  const $firstP = $('main p, section p').first();
  if ($firstP.length > 0) {
    return cleanText($firstP.text());
  }

  return '';
}

/**
 * Parse HTML file into asset document
 */
async function parseHtmlFile(filePath) {
  try {
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Detect type and mythology
    const assetType = detectAssetType(filePath);
    const mythology = detectMythology(filePath);

    if (!mythology) {
      throw new Error('Could not detect mythology from path');
    }

    // Generate ID
    const assetId = generateAssetId(filePath, mythology);

    // Extract name from title or h1
    const pageTitle = $('title').text() || $('h1').first().text();
    const name = cleanText(pageTitle.split('-').pop().trim());

    // Extract summary
    const summary = extractSummary($);

    // Extract metadata
    const metadata = extractMetadata($, assetType);

    // Extract relationships
    const relationships = extractRelationships($);

    // Parse sections into panels
    const panels = [];
    let order = 0;

    // Find main content sections
    $('main section, main > div.glass-card').each((i, section) => {
      // Skip special elements
      const $section = $(section);
      const shouldSkip = config.skipElements.some(selector => {
        return $section.is(selector) || $section.find(selector).length > 0;
      });

      if (shouldSkip) return;

      const panel = parseSection($, section, order);
      if (panel && panel.content && panel.content.length > 20) {
        panels.push(panel);
        order++;
      }
    });

    // Build asset document
    const asset = {
      id: assetId,
      assetType,
      mythology,
      name,
      summary: summary || name,
      richContent: { panels },
      isOfficial: config.defaults.isOfficial,
      status: config.defaults.status,
      contributedBy: config.defaults.contributedBy,
      sourcePath: filePath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add type-specific data
    if (assetType === 'deity' && Object.keys(metadata).length > 0) {
      asset.deityData = {
        domain: metadata.domains || [],
        symbols: metadata.symbols || [],
        epithets: metadata.titles || [],
        sacredAnimals: metadata.sacredAnimals || [],
        sacredPlants: metadata.sacredPlants || []
      };
    }

    // Add relationships if found
    if (Object.keys(relationships).length > 0) {
      asset.relationships = relationships;
    }

    // Add alternate names if found in metadata
    if (metadata.titles && metadata.titles.length > 0) {
      asset.alternateNames = metadata.titles;
    }

    return asset;

  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error.message}`);
  }
}

/**
 * Validate asset document
 */
function validateAsset(asset) {
  const errors = [];

  // Check required fields
  const required = config.validation.required[asset.assetType] || [];
  required.forEach(field => {
    if (!asset[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check summary length
  if (asset.summary && asset.summary.length < config.validation.minSummaryLength) {
    errors.push(`Summary too short (${asset.summary.length} chars, min ${config.validation.minSummaryLength})`);
  }

  // Check panel count
  const panelCount = asset.richContent?.panels?.length || 0;
  if (panelCount < config.validation.minPanelsPerAsset) {
    errors.push(`Too few panels (${panelCount}, min ${config.validation.minPanelsPerAsset})`);
  }

  if (panelCount > config.validation.maxPanelsPerAsset) {
    errors.push(`Too many panels (${panelCount}, max ${config.validation.maxPanelsPerAsset})`);
  }

  return errors;
}

/**
 * Write asset to Firestore
 */
async function writeAsset(db, asset) {
  if (flags.dryRun) {
    console.log('  [DRY RUN] Would write:', asset.id);
    return;
  }

  const docRef = db.collection('assets').doc(asset.id);
  await docRef.set(asset);
}

/**
 * Process single file
 */
async function processFile(db, filePath) {
  try {
    // Check if already processed
    if (processedFiles.has(filePath)) {
      stats.skipped++;
      return { success: true, skipped: true };
    }

    if (flags.verbose) {
      console.log(`\n📄 Processing: ${filePath}`);
    }

    // Parse HTML
    const asset = await parseHtmlFile(filePath);

    // Validate
    const validationErrors = validateAsset(asset);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed:\n  ${validationErrors.join('\n  ')}`);
    }

    // Write to Firestore
    await writeAsset(db, asset);

    // Track success
    processedFiles.add(filePath);
    stats.successful++;

    if (flags.verbose) {
      console.log(`  ✅ Success: ${asset.name} (${asset.assetType})`);
      console.log(`     Panels: ${asset.richContent.panels.length}`);
    }

    return { success: true, asset };

  } catch (error) {
    stats.failed++;
    stats.errors.push({ file: filePath, error: error.message });

    console.error(`  ❌ Error: ${error.message}`);

    return { success: false, error: error.message };
  }
}

/**
 * Find files to migrate
 */
async function findFiles() {
  const baseDir = path.join(__dirname, '..');

  if (flags.page) {
    // Single page
    const filePath = path.join(baseDir, flags.page);
    return [filePath];
  }

  // Pattern for finding HTML files
  let pattern = 'mythos/**/*.html';

  if (flags.mythology) {
    pattern = `mythos/${flags.mythology}/**/*.html`;
  }

  const files = await glob(pattern, {
    cwd: baseDir,
    absolute: true,
    ignore: config.excludePatterns.map(p => `**/${p}`)
  });

  return files;
}

/**
 * Generate migration report
 */
async function generateReport() {
  const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migration Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
        }
        h1 { color: #1a73e8; }
        .summary {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            margin: 2rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat {
            display: inline-block;
            margin: 1rem 2rem 1rem 0;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #1a73e8;
        }
        .errors {
            background: #fff3cd;
            padding: 1rem;
            border-left: 4px solid #ffc107;
            margin: 1rem 0;
        }
        .error-item {
            margin: 0.5rem 0;
            font-family: monospace;
            font-size: 0.9rem;
        }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
    </style>
</head>
<body>
    <h1>🔄 Firebase Migration Report</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Mode:</strong> ${flags.dryRun ? 'DRY RUN (no data written)' : 'LIVE MIGRATION'}</p>

    <div class="summary">
        <h2>📊 Summary Statistics</h2>
        <div class="stat">
            <div class="stat-label">Total Files</div>
            <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat">
            <div class="stat-label success">Successful</div>
            <div class="stat-value success">${stats.successful}</div>
        </div>
        <div class="stat">
            <div class="stat-label failure">Failed</div>
            <div class="stat-value failure">${stats.failed}</div>
        </div>
        <div class="stat">
            <div class="stat-label">Skipped</div>
            <div class="stat-value">${stats.skipped}</div>
        </div>
    </div>

    ${stats.errors.length > 0 ? `
    <div class="errors">
        <h3>⚠️ Errors (${stats.errors.length})</h3>
        ${stats.errors.slice(0, 50).map(e => `
            <div class="error-item">
                <strong>${e.file}</strong><br>
                ${e.error}
            </div>
        `).join('')}
        ${stats.errors.length > 50 ? `<p><em>... and ${stats.errors.length - 50} more errors</em></p>` : ''}
    </div>
    ` : '<p class="success">✅ No errors!</p>'}

    <p style="margin-top: 2rem; color: #666; font-size: 0.9rem;">
        Generated by migrate-to-firebase-assets.js
    </p>
</body>
</html>
  `;

  const reportPath = path.join(__dirname, `migration-report-${Date.now()}.html`);
  await fs.writeFile(reportPath, reportHtml);
  console.log(`\n📄 Report saved: ${reportPath}`);
}

/**
 * Save errors to log file
 */
async function saveErrorLog() {
  if (stats.errors.length === 0) return;

  const logContent = stats.errors.map(e => {
    return `File: ${e.file}\nError: ${e.error}\n${'='.repeat(80)}`;
  }).join('\n\n');

  const logPath = path.join(__dirname, '..', config.reporting.errorLogPath);
  await fs.writeFile(logPath, logContent);
  console.log(`\n📝 Error log saved: ${logPath}`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🔄 Firebase Asset Migration\n');
  console.log(`Mode: ${flags.dryRun ? 'DRY RUN ⚠️' : 'LIVE MIGRATION ✅'}\n`);

  // Load previous progress
  await loadProgress();

  // Initialize Firebase (skip if dry run)
  const db = flags.dryRun ? null : initializeFirebase();

  // Find files
  console.log('🔍 Finding files...');
  const files = await findFiles();
  stats.total = files.length;

  console.log(`\n📚 Found ${files.length} files to process\n`);

  if (files.length === 0) {
    console.log('❌ No files found matching criteria');
    return;
  }

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% | {value}/{total} | {filename}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  progressBar.start(files.length, 0, { filename: '' });

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = path.basename(file);

    progressBar.update(i + 1, { filename });

    await processFile(db, file);

    // Save progress periodically
    if ((i + 1) % config.reporting.progressInterval === 0) {
      await saveProgress();
    }
  }

  progressBar.stop();

  // Final save
  await saveProgress();

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Complete\n');
  console.log(`Total:      ${stats.total}`);
  console.log(`Successful: ${stats.successful} ✅`);
  console.log(`Failed:     ${stats.failed} ❌`);
  console.log(`Skipped:    ${stats.skipped} ⏭️`);
  console.log('='.repeat(60) + '\n');

  // Generate reports
  await generateReport();
  if (config.reporting.saveErrorLog) {
    await saveErrorLog();
  }

  // Exit with appropriate code
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Run migration
migrate().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

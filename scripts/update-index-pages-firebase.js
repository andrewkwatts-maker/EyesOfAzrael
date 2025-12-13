/**
 * Batch Update Index Pages with Firebase Integration
 *
 * This script automatically updates all mythology index pages to load
 * content dynamically from Firebase Firestore instead of static HTML.
 *
 * REQUIREMENTS:
 * - Data must already be migrated to Firestore
 * - Firebase infrastructure must be in place
 * - Index pages must have container divs for content
 *
 * USAGE:
 *   node scripts/update-index-pages-firebase.js
 *
 * WHAT IT DOES:
 * 1. Adds Firebase SDK scripts to <head>
 * 2. Sets data-theme and data-mythology on <body>
 * 3. Adds FirebaseContentLoader initialization script
 * 4. Creates backup of original files
 *
 * @author Claude (Eyes of Azrael Project)
 * @date 2024-12-13
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ROOT_DIR = path.join(__dirname, '..');
const MYTHOS_DIR = path.join(ROOT_DIR, 'mythos');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', `index-pages-${Date.now()}`);

// All mythologies to process
const MYTHOLOGIES = [
  'greek', 'norse', 'egyptian', 'hindu', 'buddhist',
  'christian', 'islamic', 'celtic', 'roman', 'aztec',
  'mayan', 'chinese', 'japanese', 'persian', 'sumerian',
  'babylonian', 'yoruba', 'native_american', 'jewish',
  'tarot', 'freemasons', 'comparative', 'apocryphal'
];

// Content types to load for each mythology
const CONTENT_TYPES = [
  'deities', 'heroes', 'creatures', 'cosmology',
  'texts', 'herbs', 'rituals', 'symbols',
  'concepts', 'myths'
];

// ============================================================================
// TEMPLATES
// ============================================================================

const FIREBASE_SDK = `
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<!-- Firebase Config -->
<script src="/firebase-config.js"></script>

<!-- Theme System -->
<link rel="stylesheet" href="/FIREBASE/css/firebase-themes.css">
<script src="/FIREBASE/js/theme-manager.js"></script>
`;

function generateLoaderScript(mythology) {
  const loadPromises = CONTENT_TYPES
    .map(type => `        loader.loadContent('${type}', { mythology })`)
    .join(',\n');

  const renderCalls = CONTENT_TYPES
    .map(type => `      loader.renderContent('${type}-container', '${type}');`)
    .join('\n');

  return `
<!-- Firebase Content Loader -->
<script type="module">
  import { FirebaseContentLoader } from '/FIREBASE/js/firebase-content-loader.js';

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Initialize content loader
      const loader = new FirebaseContentLoader(firebaseApp);
      loader.initFirestore(firebaseApp);

      const mythology = '${mythology}';

      console.log('[${mythology}] Loading content from Firebase...');

      // Load all content types for this mythology
      await Promise.all([
${loadPromises}
      ]);

      console.log('[${mythology}] Content loaded successfully');

      // Render each content type to its container
${renderCalls}

      console.log('[${mythology}] All content rendered');

    } catch (error) {
      console.error('[${mythology}] Error loading content:', error);

      // Show user-friendly error message
      const containers = document.querySelectorAll('[data-content-container]');
      containers.forEach(container => {
        container.innerHTML = \`
          <div style="padding: 2rem; text-align: center; color: var(--color-error);">
            <h3>Unable to load content</h3>
            <p>Please check your connection and try again.</p>
            <button onclick="location.reload()" class="glass-btn glass-btn-primary">
              Retry
            </button>
          </div>
        \`;
      });
    }
  });
</script>
`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupFile(filePath, mythology) {
  const backupPath = path.join(BACKUP_DIR, `${mythology}_index.html`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`  📋 Backup created: ${path.relative(ROOT_DIR, backupPath)}`);
}

function hasFirebaseSDK(html) {
  return html.includes('firebase-app-compat.js') ||
         html.includes('firebase-content-loader.js');
}

function addFirebaseSDK(html) {
  // Add Firebase SDK before </head>
  if (!html.includes('firebase-app-compat.js')) {
    html = html.replace('</head>', `${FIREBASE_SDK}\n</head>`);
  }
  return html;
}

function setBodyAttributes(html, mythology) {
  // Add data-theme and data-mythology to body tag
  // Handle various body tag formats
  const bodyRegex = /<body([^>]*)>/i;
  const match = html.match(bodyRegex);

  if (!match) {
    console.warn(`  ⚠️  Could not find <body> tag`);
    return html;
  }

  const existingAttrs = match[1];

  // Check if attributes already exist
  if (existingAttrs.includes('data-theme=')) {
    return html; // Already has attributes
  }

  // Add attributes
  html = html.replace(
    bodyRegex,
    `<body${existingAttrs} data-theme="${mythology}" data-mythology="${mythology}">`
  );

  return html;
}

function addLoaderScript(html, mythology) {
  // Add content loader script before </body>
  if (html.includes('FirebaseContentLoader')) {
    return html; // Already has loader
  }

  const loaderScript = generateLoaderScript(mythology);
  html = html.replace('</body>', `${loaderScript}\n</body>`);

  return html;
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

function processIndexPage(mythology) {
  const indexPath = path.join(MYTHOS_DIR, mythology, 'index.html');

  // Check if file exists
  if (!fs.existsSync(indexPath)) {
    console.log(`⏭️  Skip: ${mythology} (file not found)`);
    return { success: false, reason: 'not_found' };
  }

  try {
    // Read original HTML
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Check if already updated
    if (hasFirebaseSDK(html)) {
      console.log(`⏭️  Skip: ${mythology} (already has Firebase SDK)`);
      return { success: false, reason: 'already_updated' };
    }

    // Create backup
    backupFile(indexPath, mythology);

    // Apply transformations
    console.log(`  🔧 Adding Firebase SDK...`);
    html = addFirebaseSDK(html);

    console.log(`  🔧 Setting body attributes...`);
    html = setBodyAttributes(html, mythology);

    console.log(`  🔧 Adding content loader script...`);
    html = addLoaderScript(html, mythology);

    // Save updated file
    fs.writeFileSync(indexPath, html, 'utf-8');

    console.log(`✅ Updated: ${mythology}/index.html`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Error processing ${mythology}:`, error.message);
    return { success: false, reason: 'error', error: error.message };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Firebase Index Pages Batch Update                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log(`Processing ${MYTHOLOGIES.length} mythology index pages...\n`);

  // Ensure backup directory exists
  ensureBackupDir();
  console.log(`📁 Backups will be saved to: ${path.relative(ROOT_DIR, BACKUP_DIR)}\n`);

  // Process each mythology
  const results = {
    total: MYTHOLOGIES.length,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  MYTHOLOGIES.forEach((mythology, index) => {
    console.log(`\n[${index + 1}/${MYTHOLOGIES.length}] Processing: ${mythology}`);

    const result = processIndexPage(mythology);
    result.mythology = mythology;
    results.details.push(result);

    if (result.success) {
      results.updated++;
    } else if (result.reason === 'already_updated') {
      results.skipped++;
    } else {
      results.errors++;
    }
  });

  // Print summary
  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Pages:    ${results.total}`);
  console.log(`Updated:        ${results.updated} ✅`);
  console.log(`Skipped:        ${results.skipped} ⏭️`);
  console.log(`Errors:         ${results.errors} ❌`);
  console.log('═'.repeat(70));

  // Show errors if any
  if (results.errors > 0) {
    console.log('\n⚠️  ERRORS:');
    results.details
      .filter(r => !r.success && r.reason === 'error')
      .forEach(r => {
        console.log(`  - ${r.mythology}: ${r.error}`);
      });
  }

  // Show skipped if any
  if (results.skipped > 0) {
    console.log('\nℹ️  SKIPPED (already updated):');
    results.details
      .filter(r => r.reason === 'already_updated')
      .forEach(r => {
        console.log(`  - ${r.mythology}`);
      });
  }

  // Save results JSON
  const resultsPath = path.join(ROOT_DIR, 'INDEX_PAGES_UPDATE_RESULTS.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${path.relative(ROOT_DIR, resultsPath)}`);

  console.log('\n✨ Done!\n');
  console.log('NEXT STEPS:');
  console.log('1. Test updated pages in browser');
  console.log('2. Check browser console for errors');
  console.log('3. Verify content loads from Firebase');
  console.log('4. Check theme switching works');
  console.log('5. Test on mobile devices');
  console.log('\nIf issues occur, restore from backups at:');
  console.log(`   ${path.relative(ROOT_DIR, BACKUP_DIR)}\n`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  processIndexPage,
  MYTHOLOGIES,
  CONTENT_TYPES
};

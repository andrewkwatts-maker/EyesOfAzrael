/**
 * Batch Update Script - Mythology Index Pages
 *
 * This script updates all 23 mythology index pages to use Firebase
 * with standardized formatting and templates.
 *
 * Features:
 * - Finds all mythology index pages
 * - Creates backups before modification
 * - Applies Firebase integration
 * - Generates update report
 * - Verifies no syntax errors
 *
 * Usage:
 *   node FIREBASE/scripts/update-all-index-pages.js [--dry-run] [--mythology=greek]
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  rootDir: path.join(__dirname, '../..'),
  mythosDir: path.join(__dirname, '../../mythos'),
  templatePath: path.join(__dirname, '../templates/mythology-index-template.html'),
  backupDir: path.join(__dirname, '../backups/index-pages'),
  reportPath: path.join(__dirname, '../reports/index-update-report.json'),

  // Mythology configurations
  mythologies: {
    greek: {
      name: 'Greek',
      icon: '⚡',
      theme: 'greek',
      heroDescription: 'Explore the rich tapestry of Greek mythology, from the heights of Mount Olympus to the depths of Tartarus. Discover the twelve Olympians, legendary heroes, fearsome creatures, and the mysteries that shaped Western civilization for over a millennium.'
    },
    roman: {
      name: 'Roman',
      icon: '🦅',
      theme: 'roman',
      heroDescription: 'Discover the gods and heroes of Rome, from Jupiter and Mars to Romulus and Aeneas. Explore the foundation myths, divine pantheon, and legendary tales that built the greatest empire in ancient history.'
    },
    norse: {
      name: 'Norse',
      icon: '⚔️',
      theme: 'norse',
      heroDescription: 'Journey through the nine realms of Norse mythology, from Asgard to Midgard to Hel. Meet the Aesir and Vanir gods, brave heroes, and fearsome giants in tales of honor, fate, and the inevitable Ragnarök.'
    },
    egyptian: {
      name: 'Egyptian',
      icon: '𓂀',
      theme: 'egyptian',
      heroDescription: 'Uncover the mysteries of ancient Egypt, where gods walk as animals and the afterlife awaits all. From Ra\'s solar barque to Osiris\' judgment, explore the divine magic and eternal wisdom of the Nile valley.'
    },
    hindu: {
      name: 'Hindu',
      icon: '🕉️',
      theme: 'hindu',
      heroDescription: 'Explore the vast cosmos of Hindu mythology, where gods have countless forms and avatars. From the Trimurti to the epic tales of Ramayana and Mahabharata, discover the eternal dance of creation, preservation, and destruction.'
    },
    buddhist: {
      name: 'Buddhist',
      icon: '☸️',
      theme: 'buddhist',
      heroDescription: 'Walk the path of enlightenment through Buddhist cosmology and wisdom. From the Buddha\'s teachings to celestial bodhisattvas, explore the journey from suffering to liberation across countless realms.'
    },
    christian: {
      name: 'Christian',
      icon: '✝️',
      theme: 'christian',
      heroDescription: 'Discover the sacred narratives of Christianity, from Genesis creation to Revelation apocalypse. Explore angels and saints, prophets and apostles, and the divine mysteries of faith, redemption, and eternal life.'
    },
    islamic: {
      name: 'Islamic',
      icon: '☪️',
      theme: 'islamic',
      heroDescription: 'Explore the divine wisdom and sacred traditions of Islam, from the revelations to Prophet Muhammad to the stories of prophets throughout history. Discover angels, jinn, and the journey of the faithful soul.'
    },
    jewish: {
      name: 'Jewish',
      icon: '✡️',
      theme: 'jewish',
      heroDescription: 'Journey through Jewish sacred history and mystical traditions, from the patriarchs to the prophets. Explore Kabbalah wisdom, angelic hierarchies, and the eternal covenant between God and the chosen people.'
    },
    celtic: {
      name: 'Celtic',
      icon: '☘️',
      theme: 'celtic',
      heroDescription: 'Step into the enchanted otherworld of Celtic mythology, where druids channel ancient magic and heroes quest through mystical lands. From the Tuatha Dé Danann to the legendary warriors of Ireland and Wales.'
    },
    aztec: {
      name: 'Aztec',
      icon: '🌞',
      theme: 'aztec',
      heroDescription: 'Enter the world of Aztec gods and cosmic cycles, where sacrifice sustains the sun and divine warriors ascend to paradise. Explore Tenochtitlan\'s pantheon and the sacred calendar that governs all existence.'
    },
    mayan: {
      name: 'Mayan',
      icon: '🌽',
      theme: 'mayan',
      heroDescription: 'Discover the sophisticated cosmology of the Maya, where time is sacred and gods descend from the heavens. From the Hero Twins to the cosmic tree, explore one of humanity\'s most advanced spiritual systems.'
    },
    sumerian: {
      name: 'Sumerian',
      icon: '𒀭',
      theme: 'sumerian',
      heroDescription: 'Unearth the oldest written mythology in human history, where gods created humanity to serve and heroes sought immortality. From Gilgamesh\'s quest to Inanna\'s descent, discover civilization\'s first divine tales.'
    },
    babylonian: {
      name: 'Babylonian',
      icon: '🏺',
      theme: 'babylonian',
      heroDescription: 'Explore the epic cosmology of Babylon, where Marduk slew Tiamat to create the world. Discover the divine order, astrological wisdom, and mythic cycles that influenced all Near Eastern cultures.'
    },
    persian: {
      name: 'Persian',
      icon: '🔥',
      theme: 'persian',
      heroDescription: 'Journey through Zoroastrian cosmic dualism, where light and darkness wage eternal war. From Ahura Mazda to the fire temples, explore the ancient wisdom that shaped empires and influenced world religions.'
    },
    chinese: {
      name: 'Chinese',
      icon: '🐉',
      theme: 'chinese',
      heroDescription: 'Discover the celestial bureaucracy and cosmic harmony of Chinese mythology. From Pangu\'s creation to the Jade Emperor\'s court, explore dragons, immortals, and the eternal balance of yin and yang.'
    },
    japanese: {
      name: 'Japanese',
      icon: '⛩️',
      theme: 'japanese',
      heroDescription: 'Enter the sacred realm of kami spirits and divine ancestors. From Amaterasu\'s sun to the underworld of Yomi, explore Shinto mythology and the supernatural beings that dwell in every aspect of nature.'
    },
    native_american: {
      name: 'Native American',
      icon: '🦅',
      theme: 'native_american',
      heroDescription: 'Honor the diverse spiritual traditions of indigenous North America, from Coyote trickster tales to creation from turtle island. Explore the sacred connection between land, spirit, and all living beings.'
    },
    yoruba: {
      name: 'Yoruba',
      icon: '👑',
      theme: 'yoruba',
      heroDescription: 'Discover the powerful Orishas and divine wisdom of Yoruba tradition. From Olodumare\'s creation to the sacred crossroads, explore the rich spiritual heritage that spread across the Atlantic to the Americas.'
    },
    apocryphal: {
      name: 'Apocryphal',
      icon: '📜',
      theme: 'apocryphal',
      heroDescription: 'Explore the hidden texts and alternative scriptures excluded from canonical Bibles. From the Book of Enoch to Gnostic gospels, uncover the mysterious teachings and divine secrets known only to the initiated.'
    },
    freemasons: {
      name: 'Freemasons',
      icon: '🔺',
      theme: 'freemasons',
      heroDescription: 'Unveil the symbols, rituals, and esoteric wisdom of Freemasonry. From Solomon\'s Temple to the mysteries of sacred geometry, explore the traditions that have shaped modern secret societies.'
    },
    tarot: {
      name: 'Tarot',
      icon: '🃏',
      theme: 'tarot',
      heroDescription: 'Journey through the archetypal wisdom of the Tarot, from the Fool\'s journey to the World\'s completion. Explore the Major and Minor Arcana, symbolic systems, and the divinatory arts that reveal hidden truths.'
    },
    comparative: {
      name: 'Comparative',
      icon: '🌍',
      theme: 'comparative',
      heroDescription: 'Discover the universal patterns that unite world mythologies. From flood myths to creation stories, hero journeys to underworld descents, explore the shared archetypes that reveal humanity\'s common spiritual heritage.'
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
    success: '[SUCCESS]'
  }[level] || '[INFO]';

  console.log(`${timestamp} ${prefix} ${message}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
}

function findIndexPages() {
  const pages = [];
  const mythosDir = CONFIG.mythosDir;

  if (!fs.existsSync(mythosDir)) {
    throw new Error(`Mythos directory not found: ${mythosDir}`);
  }

  const subdirs = fs.readdirSync(mythosDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const subdir of subdirs) {
    const indexPath = path.join(mythosDir, subdir, 'index.html');
    if (fs.existsSync(indexPath)) {
      pages.push({
        mythology: subdir,
        path: indexPath,
        backupPath: path.join(CONFIG.backupDir, `${subdir}-index-backup-${Date.now()}.html`)
      });
    }
  }

  return pages;
}

function createBackup(sourcePath, backupPath) {
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(sourcePath, backupPath);
  log(`Backup created: ${backupPath}`);
  return backupPath;
}

function loadTemplate() {
  if (!fs.existsSync(CONFIG.templatePath)) {
    throw new Error(`Template not found: ${CONFIG.templatePath}`);
  }

  const template = fs.readFileSync(CONFIG.templatePath, 'utf8');
  log('Template loaded successfully');
  return template;
}

function applyTemplate(template, mythology, mythologyConfig) {
  let html = template;

  // Replace placeholders
  const replacements = {
    '{{MYTHOLOGY_NAME}}': mythologyConfig.name,
    '{{MYTHOLOGY_ID}}': mythology,
    '{{MYTHOLOGY_THEME}}': mythologyConfig.theme,
    '{{ICON}}': mythologyConfig.icon,
    '{{HERO_DESCRIPTION}}': mythologyConfig.heroDescription,
    '{{CUSTOM_STATIC_CONTENT}}': '<!-- Add custom static content here -->',
    '{{CROSS_CULTURAL_DESCRIPTION}}': `Explore how ${mythologyConfig.name} mythology connects with other world traditions through shared themes and archetypes.`,
    '{{PARALLEL_LINKS}}': '<!-- Parallel mythology links will be added here -->'
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.split(placeholder).join(value);
  }

  return html;
}

function validateHTML(html) {
  // Basic validation checks
  const errors = [];

  // Check for essential elements
  if (!html.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
  }

  if (!html.includes('<html')) {
    errors.push('Missing <html> tag');
  }

  if (!html.includes('<head>')) {
    errors.push('Missing <head> tag');
  }

  if (!html.includes('<body')) {
    errors.push('Missing <body> tag');
  }

  // Check for closing tags
  if (!html.includes('</head>')) {
    errors.push('Missing </head> closing tag');
  }

  if (!html.includes('</body>')) {
    errors.push('Missing </body> closing tag');
  }

  if (!html.includes('</html>')) {
    errors.push('Missing </html> closing tag');
  }

  // Check for Firebase scripts
  if (!html.includes('firebase-app-compat.js')) {
    errors.push('Missing Firebase app script');
  }

  if (!html.includes('firebase-config.js')) {
    errors.push('Missing Firebase config script');
  }

  if (!html.includes('FirebaseContentLoader')) {
    errors.push('Missing Firebase content loader');
  }

  return errors;
}

function updateIndexPage(page, template, dryRun = false) {
  const mythologyConfig = CONFIG.mythologies[page.mythology];

  if (!mythologyConfig) {
    log(`No configuration found for mythology: ${page.mythology}`, 'warn');
    return {
      success: false,
      error: 'No configuration found'
    };
  }

  try {
    // Create backup
    if (!dryRun) {
      createBackup(page.path, page.backupPath);
    }

    // Apply template
    const newHTML = applyTemplate(template, page.mythology, mythologyConfig);

    // Validate
    const validationErrors = validateHTML(newHTML);

    if (validationErrors.length > 0) {
      log(`Validation errors for ${page.mythology}:`, 'warn');
      validationErrors.forEach(error => log(`  - ${error}`, 'warn'));

      return {
        success: false,
        errors: validationErrors
      };
    }

    // Write new file
    if (!dryRun) {
      fs.writeFileSync(page.path, newHTML, 'utf8');
      log(`Updated: ${page.path}`, 'success');
    } else {
      log(`[DRY RUN] Would update: ${page.path}`, 'info');
    }

    return {
      success: true,
      backup: page.backupPath,
      validationErrors: []
    };

  } catch (error) {
    log(`Error updating ${page.mythology}: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results,
    summary: {}
  };

  // Generate summary
  for (const result of results) {
    report.summary[result.mythology] = {
      success: result.success,
      backup: result.backup || null,
      errors: result.errors || []
    };
  }

  return report;
}

function saveReport(report) {
  ensureDir(path.dirname(CONFIG.reportPath));
  fs.writeFileSync(
    CONFIG.reportPath,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  log(`Report saved: ${CONFIG.reportPath}`, 'success');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  MYTHOLOGY INDEX PAGES - FIREBASE INTEGRATION UPDATE     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const specificMythology = args.find(arg => arg.startsWith('--mythology='))?.split('=')[1];

  if (dryRun) {
    log('Running in DRY RUN mode - no files will be modified', 'warn');
  }

  try {
    // Find all index pages
    log('Finding mythology index pages...');
    let pages = findIndexPages();

    // Filter by specific mythology if requested
    if (specificMythology) {
      pages = pages.filter(p => p.mythology === specificMythology);
      log(`Filtered to mythology: ${specificMythology}`);
    }

    log(`Found ${pages.length} index pages`);

    if (pages.length === 0) {
      log('No index pages found to update', 'warn');
      return;
    }

    // Load template
    log('Loading template...');
    const template = loadTemplate();

    // Update each page
    log('\nUpdating index pages...\n');
    const results = [];

    for (const page of pages) {
      log(`\nProcessing: ${page.mythology}...`);
      const result = updateIndexPage(page, template, dryRun);
      results.push({
        mythology: page.mythology,
        path: page.path,
        ...result
      });
    }

    // Generate and save report
    log('\n\nGenerating update report...');
    const report = generateReport(results);

    if (!dryRun) {
      saveReport(report);
    }

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                     UPDATE SUMMARY                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log(`Total pages processed: ${report.total}`);
    console.log(`✓ Successful: ${report.successful}`);
    console.log(`✗ Failed: ${report.failed}`);

    if (report.failed > 0) {
      console.log('\nFailed updates:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.mythology}: ${r.error || 'Unknown error'}`);
      });
    }

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    UPDATE COMPLETE                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    if (dryRun) {
      console.log('This was a DRY RUN. No files were actually modified.');
      console.log('Run without --dry-run to apply changes.\n');
    }

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, updateIndexPage, findIndexPages };

#!/usr/bin/env node

/**
 * Convert Mythology Index Pages to Auto-Populate System
 * Converts category index pages (items, places, herbs, rituals, etc.) to use dynamic entity loading
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Mythology configuration
const MYTHOLOGIES = {
  greek: {
    name: 'Greek',
    primaryColor: '#4169E1',
    secondaryColor: '#FFD700',
    flag: '🏛️'
  },
  norse: {
    name: 'Norse',
    primaryColor: '#4682B4',
    secondaryColor: '#B0C4DE',
    flag: '⚔️'
  },
  egyptian: {
    name: 'Egyptian',
    primaryColor: '#DAA520',
    secondaryColor: '#FFA500',
    flag: '𓂀'
  },
  hindu: {
    name: 'Hindu',
    primaryColor: '#FF6B35',
    secondaryColor: '#FFD23F',
    flag: '🕉️'
  },
  jewish: {
    name: 'Jewish',
    primaryColor: '#0047AB',
    secondaryColor: '#FFFFFF',
    flag: '✡️'
  },
  chinese: {
    name: 'Chinese',
    primaryColor: '#DC143C',
    secondaryColor: '#FFD700',
    flag: '🐉'
  },
  celtic: {
    name: 'Celtic',
    primaryColor: '#228B22',
    secondaryColor: '#90EE90',
    flag: '☘️'
  },
  japanese: {
    name: 'Japanese',
    primaryColor: '#DC143C',
    secondaryColor: '#FFFFFF',
    flag: '⛩️'
  },
  roman: {
    name: 'Roman',
    primaryColor: '#8B0000',
    secondaryColor: '#FFD700',
    flag: '🦅'
  }
};

// Category configuration
const CATEGORIES = {
  items: {
    title: 'Items',
    icon: '🗡️',
    heroTitle: 'Sacred Items & Artifacts',
    heroDescription: 'Explore the legendary items, weapons, and artifacts that shaped mythology.',
    categoryId: 'item'
  },
  places: {
    title: 'Places',
    icon: '📍',
    heroTitle: 'Sacred Places & Realms',
    heroDescription: 'Journey through the legendary locations, temples, and mystical realms.',
    categoryId: 'place'
  },
  herbs: {
    title: 'Herbs',
    icon: '🌿',
    heroTitle: 'Sacred Plants & Herbs',
    heroDescription: 'Discover the sacred plants, herbs, and botanical wonders used in ancient practices.',
    categoryId: 'herb'  // Note: 'herb' category doesn't exist yet in data - these pages will be empty until herbs are added
  },
  rituals: {
    title: 'Rituals',
    icon: '🕯️',
    heroTitle: 'Sacred Ceremonies & Rituals',
    heroDescription: 'Understanding the ceremonial practices, rites, and sacred observances.',
    categoryId: 'magics'  // Fixed: was 'magic', but data uses 'magics' (plural)
  },
  magic: {
    title: 'Magic',
    icon: '✨',
    heroTitle: 'Magical Practices & Systems',
    heroDescription: 'Explore the magical traditions, spells, and mystical practices.',
    categoryId: 'magics'  // Fixed: was 'magic', but data uses 'magics' (plural)
  },
  concepts: {
    title: 'Concepts',
    icon: '💭',
    heroTitle: 'Philosophical Concepts & Ideas',
    heroDescription: 'Understanding the core philosophical and spiritual concepts.',
    categoryId: 'concept'
  },
  creatures: {
    title: 'Creatures',
    icon: '🐉',
    heroTitle: 'Mythical Creatures & Beings',
    heroDescription: 'Encounter the legendary creatures, monsters, and divine beasts.',
    categoryId: 'creature'
  }
};

function findIndexPages() {
  const pages = [];
  const mythosDir = path.join(process.cwd(), 'mythos');

  Object.keys(MYTHOLOGIES).forEach(mythId => {
    const mythDir = path.join(mythosDir, mythId);
    if (!fs.existsSync(mythDir)) return;

    Object.keys(CATEGORIES).forEach(catKey => {
      const catDir = path.join(mythDir, catKey);
      const indexPath = path.join(catDir, 'index.html');

      if (fs.existsSync(indexPath)) {
        pages.push({
          mythology: mythId,
          category: catKey,
          path: indexPath,
          relativePath: path.relative(mythosDir, indexPath)
        });
      }
    });
  });

  return pages;
}

function generateCrossLinks(mythology, category) {
  const otherMyths = Object.keys(MYTHOLOGIES).filter(m => m !== mythology).slice(0, 4);

  return otherMyths.map(mythId => {
    const myth = MYTHOLOGIES[mythId];
    return `
                    <a href="../../${mythId}/${category}/index.html" class="parallel-card">
                        <span class="tradition-flag">${myth.flag}</span>
                        <span class="parallel-name">${myth.name} ${CATEGORIES[category].title}</span>
                        <span class="tradition-label">${myth.name}</span>
                    </a>`;
  }).join('');
}

function generateIndexPage(mythologyId, categoryKey) {
  const mythology = MYTHOLOGIES[mythologyId];
  const category = CATEGORIES[categoryKey];
  const templatePath = path.join(process.cwd(), 'templates', 'category-index-template.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error('Template file not found: ' + templatePath);
  }

  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace all template variables
  const replacements = {
    '{{CATEGORY_TITLE}}': category.title,
    '{{MYTHOLOGY_NAME}}': mythology.name,
    '{{MYTHOLOGY_ID}}': mythologyId,
    '{{CATEGORY_ID}}': category.categoryId,
    '{{ICON}}': category.icon,
    '{{PRIMARY_COLOR}}': mythology.primaryColor,
    '{{SECONDARY_COLOR}}': mythology.secondaryColor,
    '{{HERO_TITLE}}': category.heroTitle,
    '{{HERO_DESCRIPTION}}': category.heroDescription,
    '{{CROSS_MYTHOLOGY_LINKS}}': generateCrossLinks(mythologyId, categoryKey)
  };

  Object.entries(replacements).forEach(([key, value]) => {
    template = template.replace(new RegExp(key, 'g'), value);
  });

  return template;
}

function convertPage(pageInfo, dryRun = false) {
  const { mythology, category, path: pagePath, relativePath } = pageInfo;

  try {
    // Check if page exists and is not empty
    if (!fs.existsSync(pagePath)) {
      log(`⚠️  File not found: ${relativePath}`, 'yellow');
      return { success: false, error: 'File not found' };
    }

    const currentContent = fs.readFileSync(pagePath, 'utf8');

    // Check if already converted (has data-auto-populate)
    if (currentContent.includes('data-auto-populate')) {
      log(`✓ Already converted: ${relativePath}`, 'green');
      return { success: true, skipped: true, reason: 'already_converted' };
    }

    // Generate new content
    const newContent = generateIndexPage(mythology, category);

    if (!dryRun) {
      // Backup original file
      const backupPath = pagePath + '.bak';
      fs.writeFileSync(backupPath, currentContent);

      // Write new content
      fs.writeFileSync(pagePath, newContent);

      log(`✅ Converted: ${relativePath}`, 'green');
      log(`   Backup saved: ${path.basename(backupPath)}`, 'blue');
    } else {
      log(`🔍 Would convert: ${relativePath}`, 'cyan');
    }

    return { success: true, converted: true };
  } catch (error) {
    log(`❌ Error converting ${relativePath}: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const mythFilter = args.find(arg => !arg.startsWith('-'));

  if (dryRun) {
    log('\n🔍 DRY RUN MODE - No files will be modified\n', 'yellow');
  }

  log('\n📝 Converting mythology index pages to auto-populate system...\n', 'cyan');

  const pages = findIndexPages();

  // Filter by mythology if specified
  const filteredPages = mythFilter
    ? pages.filter(p => p.mythology === mythFilter)
    : pages;

  if (filteredPages.length === 0) {
    log('❌ No index pages found!', 'red');
    if (mythFilter) {
      log(`   Mythology filter: ${mythFilter}`, 'yellow');
    }
    process.exit(1);
  }

  log(`Found ${filteredPages.length} index pages`, 'blue');
  if (mythFilter) {
    log(`Filtered to mythology: ${mythFilter}\n`, 'blue');
  }

  const results = {
    total: filteredPages.length,
    converted: 0,
    skipped: 0,
    errors: 0
  };

  // Group by mythology for better output
  const byMythology = {};
  filteredPages.forEach(page => {
    if (!byMythology[page.mythology]) {
      byMythology[page.mythology] = [];
    }
    byMythology[page.mythology].push(page);
  });

  // Convert pages grouped by mythology
  Object.entries(byMythology).forEach(([mythId, mythPages]) => {
    log(`\n${MYTHOLOGIES[mythId].flag} ${MYTHOLOGIES[mythId].name.toUpperCase()}`, 'bright');
    log('─'.repeat(60), 'cyan');

    mythPages.forEach(page => {
      const result = convertPage(page, dryRun);
      if (result.converted) results.converted++;
      if (result.skipped) results.skipped++;
      if (!result.success) results.errors++;
    });
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Pages:  ${results.total}`, 'blue');
  log(`Converted:    ${results.converted}`, results.converted > 0 ? 'green' : 'yellow');
  log(`Skipped:      ${results.skipped}`, 'yellow');
  log(`Errors:       ${results.errors}`, results.errors > 0 ? 'red' : 'green');
  log('='.repeat(60) + '\n', 'cyan');

  if (dryRun && results.converted === 0 && results.skipped === 0) {
    log('Would convert ' + filteredPages.length + ' pages', 'cyan');
    log('Run without --dry-run to apply changes\n', 'yellow');
  }

  if (!dryRun && results.converted > 0) {
    log('✅ Conversion complete!', 'green');
    log('   Original files backed up with .bak extension\n', 'blue');
  }

  process.exit(results.errors > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { generateIndexPage, convertPage };

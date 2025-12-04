#!/usr/bin/env node

/**
 * Fix Category Names in Converted Index Pages
 *
 * Problem: The converted pages use 'magic' but the data uses 'magics' (plural)
 * Solution: Update all data-category="magic" to data-category="magics"
 */

const fs = require('fs');
const path = require('path');

const mythosDir = path.join(__dirname, '..', 'mythos');

// Find all index.html files in magic and rituals directories
function findPagesToFix() {
  const pages = [];
  const mythologies = fs.readdirSync(mythosDir).filter(f => {
    const fullPath = path.join(mythosDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  mythologies.forEach(myth => {
    ['magic', 'rituals'].forEach(category => {
      const indexPath = path.join(mythosDir, myth, category, 'index.html');
      if (fs.existsSync(indexPath)) {
        pages.push({ mythology: myth, category, path: indexPath });
      }
    });
  });

  return pages;
}

// Fix a single page
function fixPage(pageInfo, dryRun = false) {
  const { mythology, category, path: pagePath } = pageInfo;

  try {
    let content = fs.readFileSync(pagePath, 'utf8');

    // Check if page needs fixing
    if (!content.includes('data-category="magic"')) {
      return { success: true, skipped: true, reason: 'Already fixed or not using magic category' };
    }

    // Replace data-category="magic" with data-category="magics"
    const newContent = content.replace(/data-category="magic"/g, 'data-category="magics"');

    // Count replacements
    const replacements = (content.match(/data-category="magic"/g) || []).length;

    if (!dryRun) {
      // Backup original
      fs.writeFileSync(pagePath + '.fix.bak', content);

      // Write fixed content
      fs.writeFileSync(pagePath, newContent);
    }

    return {
      success: true,
      skipped: false,
      replacements,
      path: pagePath.replace(mythosDir + path.sep, '')
    };
  } catch (error) {
    return { success: false, error: error.message, path: pagePath };
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🔍 Finding pages to fix...\n');
  const pages = findPagesToFix();
  console.log(`Found ${pages.length} magic/ritual pages\n`);

  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No files will be modified\n');
  }

  const results = {
    fixed: [],
    skipped: [],
    errors: []
  };

  pages.forEach(pageInfo => {
    const result = fixPage(pageInfo, dryRun);

    if (!result.success) {
      results.errors.push(result);
      console.log(`❌ ${result.path}: ${result.error}`);
    } else if (result.skipped) {
      results.skipped.push(result);
      console.log(`⏭️  ${pageInfo.mythology}/${pageInfo.category}: ${result.reason}`);
    } else {
      results.fixed.push(result);
      const mode = dryRun ? 'Would fix' : 'Fixed';
      console.log(`✅ ${mode} ${result.path} (${result.replacements} replacement${result.replacements !== 1 ? 's' : ''})`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total pages found:    ${pages.length}`);
  console.log(`Pages fixed:          ${results.fixed.length}`);
  console.log(`Pages skipped:        ${results.skipped.length}`);
  console.log(`Errors:               ${results.errors.length}`);

  if (!dryRun && results.fixed.length > 0) {
    console.log(`\n✨ Successfully fixed ${results.fixed.length} pages`);
    console.log(`   Backup files created with .fix.bak extension`);
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors occurred:');
    results.errors.forEach(err => {
      console.log(`   - ${err.path}: ${err.error}`);
    });
    process.exit(1);
  }
}

main();

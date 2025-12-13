#!/usr/bin/env node

/**
 * Fix Mythology Index Firebase Imports
 *
 * Updates all 23 mythology index pages to import Firebase scripts from
 * the correct location (/js/ instead of /FIREBASE/js/)
 */

const fs = require('fs');
const path = require('path');

const MYTHOS_DIR = path.join(__dirname, '../mythos');

const MYTHOLOGIES = [
  'apocryphal',
  'aztec',
  'babylonian',
  'buddhist',
  'celtic',
  'chinese',
  'christian',
  'comparative',
  'egyptian',
  'freemasons',
  'greek',
  'hindu',
  'islamic',
  'japanese',
  'jewish',
  'mayan',
  'native_american',
  'norse',
  'persian',
  'roman',
  'sumerian',
  'tarot',
  'yoruba'
];

// Path replacements to fix
const REPLACEMENTS = [
  {
    old: "../../FIREBASE/js/firebase-content-loader.js",
    new: "/js/firebase-content-loader.js"
  },
  {
    old: "../../FIREBASE/js/firebase-cache-manager.js",
    new: "/js/firebase-cache-manager.js"
  },
  {
    old: "../../FIREBASE/js/version-tracker.js",
    new: "/js/version-tracker.js"
  },
  {
    old: "../../FIREBASE/js/firebase-auth.js",
    new: "/js/firebase-auth.js"
  },
  {
    old: "../../FIREBASE/css/firebase-themes.css",
    new: "/css/firebase-themes.css"
  }
];

/**
 * Fix imports in a single file
 */
function fixImports(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⏭️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  REPLACEMENTS.forEach(({ old, new: newPath }) => {
    if (content.includes(old)) {
      content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Fix Mythology Index Firebase Imports');
  console.log('═══════════════════════════════════════════════════════\n');

  let fixedCount = 0;
  let skippedCount = 0;

  MYTHOLOGIES.forEach(mythology => {
    const indexPath = path.join(MYTHOS_DIR, mythology, 'index.html');
    const fixed = fixImports(indexPath);

    if (fixed) {
      console.log(`  ✓ Fixed: ${mythology}/index.html`);
      fixedCount++;
    } else {
      console.log(`  ⏭️  Skipped: ${mythology}/index.html (no changes needed)`);
      skippedCount++;
    }
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`✅ COMPLETE: Fixed ${fixedCount} files, skipped ${skippedCount}`);
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(0);
}

main();

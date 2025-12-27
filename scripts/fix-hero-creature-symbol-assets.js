const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Initialize Firebase
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://eyesofazrael-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

// Load failed IDs
const failedIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'failed-ids.json'), 'utf8'));

const stats = {
  heroes: { processed: 0, updated: 0, errors: 0 },
  creatures: { processed: 0, updated: 0, errors: 0 },
  symbols: { processed: 0, updated: 0, errors: 0 }
};

const errorLog = [];

// Helper function to extract text content from HTML
function extractTextContent(html, selector) {
  try {
    const dom = new JSDOM(html);
    const element = dom.window.document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  } catch (error) {
    return '';
  }
}

// Helper function to extract all paragraphs
function extractParagraphs(html) {
  try {
    const dom = new JSDOM(html);
    const paragraphs = Array.from(dom.window.document.querySelectorAll('p'));
    return paragraphs.map(p => p.textContent.trim()).filter(t => t.length > 0);
  } catch (error) {
    return [];
  }
}

// Helper function to extract lists
function extractLists(html) {
  try {
    const dom = new JSDOM(html);
    const listItems = Array.from(dom.window.document.querySelectorAll('li'));
    return listItems.map(li => li.textContent.trim()).filter(t => t.length > 0);
  } catch (error) {
    return [];
  }
}

// Helper function to build description from HTML
function buildDescription(html) {
  const paragraphs = extractParagraphs(html);
  const filteredParagraphs = paragraphs.filter(p =>
    !p.includes('This page is under construction') &&
    !p.includes('For related information') &&
    !p.includes('For more information') &&
    p.length > 30
  );

  // Take first 2-3 good paragraphs
  return filteredParagraphs.slice(0, 3).join('\n\n');
}

// Extract hero data from HTML file
async function extractHeroData(heroId, dryRun = false) {
  try {
    stats.heroes.processed++;

    // Parse ID: format is {mythology}_{hero}
    const parts = heroId.split('_');
    const mythology = parts[0];
    const heroName = parts.slice(1).join('_');

    // Try to find the HTML file
    const possiblePaths = [
      `h:/Github/EyesOfAzrael/mythos/${mythology}/heroes/${heroName}.html`,
      `h:/Github/EyesOfAzrael/mythos/${mythology}/heroes/index.html`
    ];

    let htmlPath = null;
    let html = '';

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        htmlPath = p;
        html = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!htmlPath) {
      console.log(`[HEROES] ⚠️  No HTML file found for ${heroId}`);
      errorLog.push({ collection: 'heroes', id: heroId, error: 'No HTML file found' });
      stats.heroes.errors++;
      return null;
    }

    // Extract data
    const description = buildDescription(html);
    const lists = extractLists(html);

    // Build update object
    const updates = {};

    // Add description if better than current
    if (description && description.length > 50) {
      updates.description = description;
    }

    // Add type
    updates.type = 'hero';

    // Extract deeds/heroic acts from lists
    const deeds = lists.filter(item =>
      item.length > 20 &&
      !item.includes('This page is under construction') &&
      !item.includes('For related information')
    );

    if (deeds.length > 0) {
      updates.deeds = deeds.slice(0, 10); // Limit to 10 deeds
    }

    // Add icon if missing
    if (!updates.icon) {
      updates.icon = '🦸';
    }

    // Update metadata
    updates['metadata.polishedBy'] = 'Agent_8_HeroFixer';
    updates['metadata.updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    updates['metadata.finalEnrichment'] = true;

    console.log(`[HEROES] ${dryRun ? '[DRY-RUN] ' : ''}Processing ${heroId}`);
    console.log(`  Description length: ${description.length}`);
    console.log(`  Deeds found: ${deeds.length}`);

    if (!dryRun && Object.keys(updates).length > 0) {
      await db.collection('heroes').doc(heroId).update(updates);
      stats.heroes.updated++;
      console.log(`  ✅ Updated`);
    }

    return updates;

  } catch (error) {
    console.error(`[HEROES] ❌ Error processing ${heroId}:`, error.message);
    errorLog.push({ collection: 'heroes', id: heroId, error: error.message });
    stats.heroes.errors++;
    return null;
  }
}

// Extract creature data from HTML file
async function extractCreatureData(creatureId, dryRun = false) {
  try {
    stats.creatures.processed++;

    // Parse ID: format is {mythology}_creature_{creature}
    const parts = creatureId.split('_');
    const mythology = parts[0];
    // Remove 'creature' from the middle
    const creatureName = parts.filter(p => p !== 'creature').slice(1).join('_');

    // Try to find the HTML file
    const possiblePaths = [
      `h:/Github/EyesOfAzrael/mythos/${mythology}/creatures/${creatureName}.html`,
      `h:/Github/EyesOfAzrael/mythos/${mythology}/creatures/index.html`
    ];

    let htmlPath = null;
    let html = '';

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        htmlPath = p;
        html = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!htmlPath) {
      console.log(`[CREATURES] ⚠️  No HTML file found for ${creatureId}`);
      errorLog.push({ collection: 'creatures', id: creatureId, error: 'No HTML file found' });
      stats.creatures.errors++;
      return null;
    }

    // Extract data
    const description = buildDescription(html);
    const lists = extractLists(html);

    // Build update object
    const updates = {};

    // Add description if better than current
    if (description && description.length > 50) {
      updates.description = description;
    }

    // Extract abilities from lists
    const abilities = lists.filter(item =>
      item.length > 20 &&
      !item.includes('This page is under construction') &&
      !item.includes('For related information')
    );

    if (abilities.length > 0) {
      updates.abilities = abilities.slice(0, 10); // Limit to 10 abilities
    }

    // Update metadata
    updates['metadata.polishedBy'] = 'Agent_8_CreatureFixer';
    updates['metadata.updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    updates['metadata.finalEnrichment'] = true;

    console.log(`[CREATURES] ${dryRun ? '[DRY-RUN] ' : ''}Processing ${creatureId}`);
    console.log(`  Description length: ${description.length}`);
    console.log(`  Abilities found: ${abilities.length}`);

    if (!dryRun && Object.keys(updates).length > 0) {
      await db.collection('creatures').doc(creatureId).update(updates);
      stats.creatures.updated++;
      console.log(`  ✅ Updated`);
    }

    return updates;

  } catch (error) {
    console.error(`[CREATURES] ❌ Error processing ${creatureId}:`, error.message);
    errorLog.push({ collection: 'creatures', id: creatureId, error: error.message });
    stats.creatures.errors++;
    return null;
  }
}

// Extract symbol data from HTML file
async function extractSymbolData(symbolId, dryRun = false) {
  try {
    stats.symbols.processed++;

    // Parse ID: format is {mythology}_{symbol}
    const parts = symbolId.split('_');
    const mythology = parts[0];
    const symbolName = parts.slice(1).join('_');

    // Try to find the HTML file
    const possiblePaths = [
      `h:/Github/EyesOfAzrael/mythos/${mythology}/symbols/${symbolName}.html`,
      `h:/Github/EyesOfAzrael/mythos/${mythology}/symbols/index.html`
    ];

    let htmlPath = null;
    let html = '';

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        htmlPath = p;
        html = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!htmlPath) {
      console.log(`[SYMBOLS] ⚠️  No HTML file found for ${symbolId}`);
      errorLog.push({ collection: 'symbols', id: symbolId, error: 'No HTML file found' });
      stats.symbols.errors++;
      return null;
    }

    // Extract data
    const description = buildDescription(html);
    const paragraphs = extractParagraphs(html);

    // Build update object
    const updates = {};

    // Add description if better than current
    if (description && description.length > 50) {
      updates.description = description;
    }

    // Add type
    updates.type = 'symbol';

    // Extract meaning from paragraphs (usually the second or third paragraph explains meaning)
    const meaningParagraphs = paragraphs.filter(p =>
      p.length > 50 &&
      (p.toLowerCase().includes('represent') ||
       p.toLowerCase().includes('symbol') ||
       p.toLowerCase().includes('meaning') ||
       p.toLowerCase().includes('signif'))
    );

    if (meaningParagraphs.length > 0) {
      updates.meaning = meaningParagraphs[0];
    } else if (paragraphs.length > 1) {
      // Fallback to second paragraph
      updates.meaning = paragraphs[1];
    }

    // Add icon if missing
    if (!updates.icon) {
      updates.icon = '⚜️';
    }

    // Update metadata
    updates['metadata.polishedBy'] = 'Agent_8_SymbolFixer';
    updates['metadata.updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    updates['metadata.finalEnrichment'] = true;

    console.log(`[SYMBOLS] ${dryRun ? '[DRY-RUN] ' : ''}Processing ${symbolId}`);
    console.log(`  Description length: ${description.length}`);
    console.log(`  Meaning length: ${updates.meaning ? updates.meaning.length : 0}`);

    if (!dryRun && Object.keys(updates).length > 0) {
      await db.collection('symbols').doc(symbolId).update(updates);
      stats.symbols.updated++;
      console.log(`  ✅ Updated`);
    }

    return updates;

  } catch (error) {
    console.error(`[SYMBOLS] ❌ Error processing ${symbolId}:`, error.message);
    errorLog.push({ collection: 'symbols', id: symbolId, error: error.message });
    stats.symbols.errors++;
    return null;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('\n🔧 AGENT 8: FIXING HEROES, CREATURES, AND SYMBOLS');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}\n`);

  console.log(`📊 Collections to fix:`);
  console.log(`  Heroes: ${failedIds.heroes.length}`);
  console.log(`  Creatures: ${failedIds.creatures.length}`);
  console.log(`  Symbols: ${failedIds.symbols.length}\n`);

  // Process Heroes
  console.log('\n═══════════════════════════════════════');
  console.log('🦸 PROCESSING HEROES');
  console.log('═══════════════════════════════════════\n');

  for (const heroId of failedIds.heroes) {
    await extractHeroData(heroId, dryRun);
  }

  // Process Creatures
  console.log('\n═══════════════════════════════════════');
  console.log('🐉 PROCESSING CREATURES');
  console.log('═══════════════════════════════════════\n');

  for (const creatureId of failedIds.creatures) {
    await extractCreatureData(creatureId, dryRun);
  }

  // Process Symbols
  console.log('\n═══════════════════════════════════════');
  console.log('⚜️  PROCESSING SYMBOLS');
  console.log('═══════════════════════════════════════\n');

  for (const symbolId of failedIds.symbols) {
    await extractSymbolData(symbolId, dryRun);
  }

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 FINAL STATISTICS');
  console.log('═══════════════════════════════════════\n');

  console.log('Heroes:');
  console.log(`  Processed: ${stats.heroes.processed}`);
  console.log(`  Updated: ${stats.heroes.updated}`);
  console.log(`  Errors: ${stats.heroes.errors}`);
  console.log(`  Success Rate: ${((stats.heroes.updated / stats.heroes.processed) * 100).toFixed(1)}%\n`);

  console.log('Creatures:');
  console.log(`  Processed: ${stats.creatures.processed}`);
  console.log(`  Updated: ${stats.creatures.updated}`);
  console.log(`  Errors: ${stats.creatures.errors}`);
  console.log(`  Success Rate: ${((stats.creatures.updated / stats.creatures.processed) * 100).toFixed(1)}%\n`);

  console.log('Symbols:');
  console.log(`  Processed: ${stats.symbols.processed}`);
  console.log(`  Updated: ${stats.symbols.updated}`);
  console.log(`  Errors: ${stats.symbols.errors}`);
  console.log(`  Success Rate: ${((stats.symbols.updated / stats.symbols.processed) * 100).toFixed(1)}%\n`);

  // Save stats and error log
  const report = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'live',
    statistics: stats,
    errors: errorLog
  };

  fs.writeFileSync(
    path.join(__dirname, 'hero-creature-symbol-fix-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('📄 Report saved to: scripts/hero-creature-symbol-fix-report.json\n');

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

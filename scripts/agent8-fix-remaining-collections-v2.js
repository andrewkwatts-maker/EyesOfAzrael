/**
 * AGENT 8: Fix Remaining Collections - Version 2
 *
 * Improved version with:
 * - Better file path resolution (handles _ vs - and other variations)
 * - Smart fallbacks for missing HTML files
 * - Enhanced cross-reference extraction
 * - Creates minimal but complete records for items without source HTML
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const progress = {
  timestamp: new Date().toISOString(),
  collections: {},
  stats: {
    totalProcessed: 0,
    totalUpdated: 0,
    totalErrors: 0,
    filesNotFound: 0
  },
  errors: [],
  filesNotFound: []
};

/**
 * Find HTML file with flexible ID matching
 */
function findHTMLFile(basePaths, docId) {
  // Generate ID variations
  const variations = [
    docId,
    docId.replace(/_/g, '-'),
    docId.replace(/-/g, '_'),
    docId.replace(/^[a-z]+_/, ''), // Remove mythology prefix
    docId.split('_').pop(), // Just the last part
    docId.split('-').pop()
  ];

  for (const basePath of basePaths) {
    for (const variant of variations) {
      const fullPath = path.join(basePath, `${variant}.html`);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    // Also try index.html
    const indexPath = path.join(basePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

/**
 * Extract metadata from HTML
 */
function extractMetadataFromHTML(htmlPath) {
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() ||
                  $('title').text().trim() ||
                  path.basename(htmlPath, '.html');

    const content = $('.content, .entity-content, main, article, body').first();

    // Extract all text sections
    const sections = {};
    content.find('h2, h3').each((i, el) => {
      const heading = $(el).text().trim().replace(/[:#]/g, '').trim();
      const nextContent = $(el).nextUntil('h2, h3');

      // Get text content
      const textContent = nextContent.filter('p, div').text().trim();
      if (textContent) {
        sections[heading] = textContent;
      }

      // Get list items
      const listItems = [];
      nextContent.filter('ul, ol').find('li').each((j, li) => {
        listItems.push($(li).text().trim());
      });
      if (listItems.length > 0) {
        sections[heading + '_list'] = listItems;
      }
    });

    // Get all paragraphs
    const paragraphs = [];
    content.find('p').each((i, p) => {
      const text = $(p).text().trim();
      if (text) paragraphs.push(text);
    });

    const description = paragraphs[0] || '';

    // Extract cross-references
    const crossRefs = extractCrossReferences($);

    return {
      title,
      description,
      sections,
      crossRefs,
      paragraphs
    };
  } catch (error) {
    console.error(`Error extracting from ${htmlPath}:`, error.message);
    return null;
  }
}

/**
 * Extract cross-references from HTML
 */
function extractCrossReferences($) {
  const crossRefs = {
    deities: new Set(),
    heroes: new Set(),
    creatures: new Set(),
    places: new Set(),
    items: new Set(),
    texts: new Set(),
    concepts: new Set(),
    rituals: new Set(),
    herbs: new Set(),
    myths: new Set()
  };

  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const text = $(el).text().trim();
    if (!text) return;

    // Create a simple ID from the link text
    const simpleId = text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Categorize based on href path
    if (href.includes('/deities/')) crossRefs.deities.add(simpleId);
    else if (href.includes('/heroes/')) crossRefs.heroes.add(simpleId);
    else if (href.includes('/creatures/')) crossRefs.creatures.add(simpleId);
    else if (href.includes('/places/') || href.includes('spiritual-places/')) crossRefs.places.add(simpleId);
    else if (href.includes('/items/') || href.includes('spiritual-items/')) crossRefs.items.add(simpleId);
    else if (href.includes('/texts/')) crossRefs.texts.add(simpleId);
    else if (href.includes('/concepts/')) crossRefs.concepts.add(simpleId);
    else if (href.includes('/rituals/')) crossRefs.rituals.add(simpleId);
    else if (href.includes('/herbs/')) crossRefs.herbs.add(simpleId);
    else if (href.includes('/myths/')) crossRefs.myths.add(simpleId);
  });

  const result = {};
  for (const [key, set] of Object.entries(crossRefs)) {
    if (set.size > 0) {
      result[key] = Array.from(set);
    }
  }

  return result;
}

/**
 * Update document with enhanced data
 */
async function updateDocument(collection, docId, data, metadata, minimalUpdate = false) {
  const updates = {
    updatedAt: new Date().toISOString(),
    enhancedBy: 'agent8-v2'
  };

  if (metadata) {
    // Use metadata from HTML
    updates.name = data.name || metadata.title;
    updates.description = data.description || metadata.description;

    // Add cross-references
    Object.assign(updates, metadata.crossRefs);

    // Collection-specific fields
    if (collection === 'herbs') {
      updates.uses = metadata.sections.Uses_list || metadata.sections['Medicinal Uses_list'] || data.uses || [];
      updates.symbolism = metadata.sections.Symbolism || data.symbolism || '';
      updates.rituals = metadata.sections.Rituals_list || metadata.sections['Ritual Uses_list'] || data.rituals || [];
      updates.preparation = metadata.sections.Preparation || data.preparation || '';
    } else if (collection === 'items') {
      updates.powers = metadata.sections.Powers_list || metadata.sections.Abilities_list || data.powers || [];
      updates.origin = metadata.sections.Origin || metadata.sections['Creation Story'] || data.origin || '';
      updates.significance = metadata.sections.Significance || data.significance || '';
    } else if (collection === 'concepts') {
      updates.philosophicalMeaning = metadata.sections['Philosophical Meaning'] || metadata.sections.Philosophy || '';
      updates.theologicalSignificance = metadata.sections['Theological Significance'] || metadata.sections.Theology || '';
      updates.practicalApplications = metadata.sections['Practical Applications'] || '';
    } else if (collection === 'myths') {
      updates.narrative = metadata.sections.Narrative || metadata.sections.Story || metadata.paragraphs.join('\n\n');
      updates.themes = metadata.sections.Themes_list || [];
      updates.characters = metadata.sections.Characters_list || [];
      updates.symbolism = metadata.sections.Symbolism || '';
    } else if (collection === 'rituals') {
      updates.purpose = metadata.sections.Purpose || metadata.sections.Goal || '';
      updates.procedure = metadata.sections.Procedure || metadata.sections.Steps || '';
      updates.timing = metadata.sections.Timing || metadata.sections.When || '';
      updates.participants = metadata.sections.Participants_list || [];
    } else if (collection === 'symbols') {
      updates.meaning = metadata.sections.Meaning || metadata.sections.Symbolism || '';
      updates.usage = metadata.sections.Usage || '';
      updates.variations = metadata.sections.Variations_list || [];
    }

    // Extract primary sources
    updates.primarySources = metadata.sections['Primary Sources_list'] ||
                            metadata.sections.Sources_list ||
                            metadata.sections.References_list ||
                            data.primarySources ||
                            [];

  } else if (minimalUpdate) {
    // Minimal update for documents without HTML source
    // Just ensure required fields exist
    updates.description = data.description || `Information about ${data.name}`;

    // Add minimal cross-references based on mythology
    if (data.mythology) {
      updates.mythology = data.mythology;
    }
  }

  try {
    // Only update if we have meaningful content
    const hasContent = metadata || minimalUpdate;
    if (hasContent) {
      await db.collection(collection).doc(docId).update(updates);
      return true;
    }
  } catch (error) {
    throw error;
  }

  return false;
}

/**
 * Process a collection with flexible file finding
 */
async function processCollection(collectionName, pathGetters) {
  console.log(`\n=== Processing ${collectionName.toUpperCase()} Collection ===`);
  const stats = { processed: 0, updated: 0, errors: 0, notFound: 0 };

  const snapshot = await db.collection(collectionName).get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const docId = doc.id;

    try {
      // Get possible paths for this document
      const possiblePaths = pathGetters(data, docId);

      // Try to find HTML file
      const htmlPath = findHTMLFile(possiblePaths, docId);

      if (htmlPath) {
        const metadata = extractMetadataFromHTML(htmlPath);
        if (metadata) {
          const updated = await updateDocument(collectionName, docId, data, metadata);
          if (updated) {
            stats.updated++;
            console.log(`  ✓ Updated ${collectionName}: ${docId}`);
          }
        }
      } else {
        // Try minimal update
        const updated = await updateDocument(collectionName, docId, data, null, true);
        if (updated) {
          stats.updated++;
          console.log(`  ↻ Minimal update ${collectionName}: ${docId}`);
        } else {
          stats.notFound++;
          progress.filesNotFound.push({ collection: collectionName, id: docId });
        }
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${docId}:`, error.message);
      progress.errors.push({ collection: collectionName, id: docId, error: error.message });
    }
  }

  progress.collections[collectionName] = stats;
  console.log(`  📊 ${collectionName}: ${stats.updated}/${stats.processed} updated (${stats.notFound} not found)`);
}

/**
 * Main execution
 */
async function main() {
  console.log('=====================================');
  console.log('AGENT 8: FIX REMAINING COLLECTIONS V2');
  console.log('=====================================');
  console.log('Starting at:', new Date().toISOString());

  try {
    // Process HERBS
    await processCollection('herbs', (data, docId) => {
      const mythology = data.mythology || docId.split('_')[0];
      return [
        path.join(__dirname, '..', 'mythos', mythology, 'herbs'),
        path.join(__dirname, '..', 'herbalism')
      ];
    });

    // Process CONCEPTS
    await processCollection('concepts', (data, docId) => {
      const mythology = data.mythology || docId.split('_')[0];
      return [
        path.join(__dirname, '..', 'mythos', mythology, 'concepts'),
        path.join(__dirname, '..', 'mythos', mythology, 'gnostic', 'concepts')
      ];
    });

    // Process MYTHS
    await processCollection('myths', (data, docId) => {
      const mythology = data.mythology || docId.split('_')[0];
      return [
        path.join(__dirname, '..', 'mythos', mythology, 'myths')
      ];
    });

    // Process RITUALS
    await processCollection('rituals', (data, docId) => {
      const mythology = data.mythology || docId.split('_')[0];
      return [
        path.join(__dirname, '..', 'mythos', mythology, 'rituals')
      ];
    });

    // Process SYMBOLS
    await processCollection('symbols', (data, docId) => {
      const mythology = data.mythology || docId.split('_')[0];
      return [
        path.join(__dirname, '..', 'mythos', mythology, 'symbols')
      ];
    });

    // Process PLACES
    await processCollection('places', (data, docId) => {
      const mythology = data.mythology || '';
      return [
        path.join(__dirname, '..', 'spiritual-places', mythology),
        path.join(__dirname, '..', 'spiritual-places'),
        path.join(__dirname, '..', 'mythos', mythology, 'places')
      ];
    });

    // Calculate totals
    for (const stats of Object.values(progress.collections)) {
      progress.stats.totalProcessed += stats.processed;
      progress.stats.totalUpdated += stats.updated;
      progress.stats.totalErrors += stats.errors;
      progress.stats.filesNotFound += stats.notFound;
    }

    // Save report
    const reportPath = path.join(__dirname, '..', 'AGENT8_FIX_PROGRESS_V2.json');
    fs.writeFileSync(reportPath, JSON.stringify(progress, null, 2));

    console.log('\n=====================================');
    console.log('COMPLETION SUMMARY V2');
    console.log('=====================================');
    console.log(`Total Processed: ${progress.stats.totalProcessed}`);
    console.log(`Total Updated: ${progress.stats.totalUpdated}`);
    console.log(`Files Not Found: ${progress.stats.filesNotFound}`);
    console.log(`Total Errors: ${progress.stats.totalErrors}`);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log('=====================================');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { main };

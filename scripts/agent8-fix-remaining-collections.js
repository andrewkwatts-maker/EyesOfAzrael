/**
 * AGENT 8: Fix All Remaining Collections
 *
 * This script systematically fixes all incomplete collections by:
 * 1. Extracting data from HTML files
 * 2. Enriching with proper metadata
 * 3. Adding cross-references
 * 4. Uploading to Firebase
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

// Track progress
const progress = {
  timestamp: new Date().toISOString(),
  collections: {},
  stats: {
    totalProcessed: 0,
    totalUpdated: 0,
    totalErrors: 0
  },
  errors: []
};

/**
 * Extract text content from HTML, removing tags
 */
function extractText($, selector) {
  const element = $(selector);
  if (!element.length) return '';
  return element.text().trim().replace(/\s+/g, ' ');
}

/**
 * Extract list items from HTML
 */
function extractList($, selector) {
  const items = [];
  $(selector).find('li').each((i, el) => {
    const text = $(el).text().trim();
    if (text) items.push(text);
  });
  return items;
}

/**
 * Extract sections from content
 */
function extractSections($, content) {
  const sections = {};

  // Common section headers
  const sectionHeaders = [
    'Overview', 'Description', 'Content', 'Summary',
    'Themes', 'Historical Context', 'Significance',
    'Key Passages', 'Structure', 'Influence',
    'Uses', 'Symbolism', 'Preparation', 'Rituals',
    'Powers', 'Origin', 'Meaning', 'Purpose',
    'Procedure', 'Participants', 'Evidence'
  ];

  content.find('h2, h3').each((i, el) => {
    const heading = $(el).text().trim();
    const nextContent = $(el).nextUntil('h2, h3').text().trim();

    if (nextContent) {
      // Normalize heading
      const normalized = heading.replace(/[:#]/g, '').trim();
      sections[normalized] = nextContent;
    }
  });

  return sections;
}

/**
 * Extract links and create cross-references
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
    rituals: new Set()
  };

  // Find all internal links
  $('a[href*="mythos/"], a[href*="spiritual-"]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Parse link to determine type
    if (href.includes('/deities/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.deities.add(id);
    } else if (href.includes('/heroes/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.heroes.add(id);
    } else if (href.includes('/creatures/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.creatures.add(id);
    } else if (href.includes('/places/') || href.includes('spiritual-places/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.places.add(id);
    } else if (href.includes('/items/') || href.includes('spiritual-items/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.items.add(id);
    } else if (href.includes('/texts/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.texts.add(id);
    } else if (href.includes('/concepts/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.concepts.add(id);
    } else if (href.includes('/rituals/')) {
      const id = href.split('/').pop().replace('.html', '');
      crossRefs.rituals.add(id);
    }
  });

  // Convert sets to arrays
  const result = {};
  for (const [key, set] of Object.entries(crossRefs)) {
    if (set.size > 0) {
      result[key] = Array.from(set);
    }
  }

  return result;
}

/**
 * Extract metadata from HTML file
 */
function extractMetadataFromHTML(htmlPath) {
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    // Extract basic info
    const title = $('h1').first().text().trim() ||
                  $('title').text().trim() ||
                  path.basename(htmlPath, '.html');

    // Get main content area
    const content = $('.content, .entity-content, main, article').first();

    // Extract sections
    const sections = extractSections($, content);

    // Extract lists
    const lists = {};
    content.find('ul, ol').each((i, el) => {
      const prevHeading = $(el).prevAll('h2, h3').first().text().trim();
      if (prevHeading) {
        const items = [];
        $(el).find('li').each((j, li) => {
          items.push($(li).text().trim());
        });
        if (items.length > 0) {
          lists[prevHeading.replace(/[:#]/g, '').trim()] = items;
        }
      }
    });

    // Extract cross-references
    const crossRefs = extractCrossReferences($);

    // Get description
    const description = sections.Description ||
                       sections.Overview ||
                       sections.Summary ||
                       content.find('p').first().text().trim();

    return {
      title,
      description,
      sections,
      lists,
      crossRefs,
      fullText: content.text().trim().substring(0, 5000) // Limit length
    };
  } catch (error) {
    console.error(`Error extracting from ${htmlPath}:`, error.message);
    return null;
  }
}

/**
 * Process TEXTS collection
 */
async function processTexts() {
  console.log('\n=== Processing TEXTS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  // Get all text documents from Firebase
  const snapshot = await db.collection('texts').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const textId = doc.id;

    try {
      // Find corresponding HTML file
      const mythology = data.mythology || '';
      const possiblePaths = [
        path.join(__dirname, '..', 'mythos', mythology, 'texts', `${textId}.html`),
        path.join(__dirname, '..', 'mythos', mythology, 'texts', 'index.html')
      ];

      let htmlPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          htmlPath = p;
          break;
        }
      }

      if (!htmlPath) {
        console.log(`  ⚠️ No HTML found for text: ${textId}`);
        continue;
      }

      // Extract metadata
      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      // Build update object
      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Add recommended fields
        summary: metadata.sections.Summary || metadata.sections.Overview || metadata.description,
        themes: metadata.lists.Themes || metadata.lists['Key Themes'] || [],
        historicalContext: metadata.sections['Historical Context'] || metadata.sections.Context || '',
        influence: metadata.sections.Influence || metadata.sections.Legacy || '',
        keyPassages: metadata.lists['Key Passages'] || metadata.lists['Important Passages'] || [],
        structure: metadata.sections.Structure || metadata.sections.Organization || '',

        // Cross-references
        ...metadata.crossRefs,

        // Primary sources (extract citations)
        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       metadata.lists.References ||
                       []
      };

      // Only update if we're adding significant content
      if (updates.summary || updates.themes.length > 0 || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('texts').doc(textId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated text: ${textId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${textId}:`, error.message);
      progress.errors.push({ collection: 'texts', id: textId, error: error.message });
    }
  }

  progress.collections.texts = stats;
  console.log(`  📊 Texts: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process HERBS collection
 */
async function processHerbs() {
  console.log('\n=== Processing HERBS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('herbs').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const herbId = doc.id;

    try {
      const mythology = data.mythology || '';
      const possiblePaths = [
        path.join(__dirname, '..', 'mythos', mythology, 'herbs', `${herbId}.html`),
        path.join(__dirname, '..', 'herbalism', `${herbId}.html`)
      ];

      let htmlPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          htmlPath = p;
          break;
        }
      }

      if (!htmlPath) {
        console.log(`  ⚠️ No HTML found for herb: ${herbId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Herb-specific fields
        uses: metadata.lists.Uses || metadata.lists['Medicinal Uses'] || [],
        symbolism: metadata.sections.Symbolism || metadata.sections.Meaning || '',
        rituals: metadata.lists.Rituals || metadata.lists['Ritual Uses'] || [],
        preparation: metadata.sections.Preparation || metadata.sections['How to Use'] || '',

        // Cross-references
        ...metadata.crossRefs,
        relatedHerbs: metadata.lists['Related Herbs'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.uses.length > 0 || updates.symbolism || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('herbs').doc(herbId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated herb: ${herbId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${herbId}:`, error.message);
      progress.errors.push({ collection: 'herbs', id: herbId, error: error.message });
    }
  }

  progress.collections.herbs = stats;
  console.log(`  📊 Herbs: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process ITEMS collection
 */
async function processItems() {
  console.log('\n=== Processing ITEMS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('items').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const itemId = doc.id;

    try {
      const possiblePaths = [
        path.join(__dirname, '..', 'spiritual-items', 'weapons', `${itemId}.html`),
        path.join(__dirname, '..', 'spiritual-items', 'relics', `${itemId}.html`),
        path.join(__dirname, '..', 'spiritual-items', 'ritual', `${itemId}.html`),
        path.join(__dirname, '..', 'spiritual-items', `${itemId}.html`)
      ];

      let htmlPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          htmlPath = p;
          break;
        }
      }

      if (!htmlPath) {
        // Try with common name variations
        const variations = [
          itemId.replace(/-/g, '_'),
          itemId.replace(/_/g, '-'),
          itemId.replace(/\d+/g, '')
        ];

        for (const variant of variations) {
          for (const basePath of possiblePaths) {
            const p = basePath.replace(itemId, variant);
            if (fs.existsSync(p)) {
              htmlPath = p;
              break;
            }
          }
          if (htmlPath) break;
        }
      }

      if (!htmlPath) {
        console.log(`  ⚠️ No HTML found for item: ${itemId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Item-specific fields
        powers: metadata.lists.Powers || metadata.lists.Abilities || data.powers || [],
        owner: metadata.sections.Owner || data.owner || '',
        origin: metadata.sections.Origin || metadata.sections['Creation Story'] || '',
        significance: metadata.sections.Significance || metadata.sections.Importance || '',

        // Cross-references
        ...metadata.crossRefs,
        relatedItems: metadata.lists['Related Items'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.powers.length > 0 || updates.origin || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('items').doc(itemId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated item: ${itemId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${itemId}:`, error.message);
      progress.errors.push({ collection: 'items', id: itemId, error: error.message });
    }
  }

  progress.collections.items = stats;
  console.log(`  📊 Items: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process PLACES collection
 */
async function processPlaces() {
  console.log('\n=== Processing PLACES Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('places').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const placeId = doc.id;

    try {
      const mythology = data.mythology || '';
      const possiblePaths = [
        path.join(__dirname, '..', 'spiritual-places', mythology, `${placeId}.html`),
        path.join(__dirname, '..', 'spiritual-places', `${placeId}.html`),
        path.join(__dirname, '..', 'mythos', mythology, 'places', `${placeId}.html`)
      ];

      let htmlPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          htmlPath = p;
          break;
        }
      }

      if (!htmlPath) {
        console.log(`  ⚠️ No HTML found for place: ${placeId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Place-specific fields
        significance: metadata.sections.Significance || metadata.sections.Importance || '',
        inhabitants: metadata.lists.Inhabitants || metadata.lists['Who Lives Here'] || [],
        features: metadata.lists.Features || metadata.lists.Characteristics || [],
        access: metadata.sections.Access || metadata.sections['How to Reach'] || '',

        // Cross-references
        ...metadata.crossRefs,
        relatedPlaces: metadata.lists['Related Places'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.significance || updates.inhabitants.length > 0 || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('places').doc(placeId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated place: ${placeId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${placeId}:`, error.message);
      progress.errors.push({ collection: 'places', id: placeId, error: error.message });
    }
  }

  progress.collections.places = stats;
  console.log(`  📊 Places: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process CONCEPTS collection
 */
async function processConcepts() {
  console.log('\n=== Processing CONCEPTS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('concepts').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const conceptId = doc.id;

    try {
      const mythology = data.mythology || '';
      const htmlPath = path.join(__dirname, '..', 'mythos', mythology, 'concepts', `${conceptId}.html`);

      if (!fs.existsSync(htmlPath)) {
        console.log(`  ⚠️ No HTML found for concept: ${conceptId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Concept-specific fields
        philosophicalMeaning: metadata.sections['Philosophical Meaning'] ||
                             metadata.sections.Philosophy || '',
        theologicalSignificance: metadata.sections['Theological Significance'] ||
                                metadata.sections.Theology || '',
        practicalApplications: metadata.sections['Practical Applications'] ||
                              metadata.sections.Practice || '',

        // Cross-references
        ...metadata.crossRefs,
        relatedConcepts: metadata.lists['Related Concepts'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.philosophicalMeaning || updates.theologicalSignificance || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('concepts').doc(conceptId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated concept: ${conceptId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${conceptId}:`, error.message);
      progress.errors.push({ collection: 'concepts', id: conceptId, error: error.message });
    }
  }

  progress.collections.concepts = stats;
  console.log(`  📊 Concepts: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process MYTHS collection
 */
async function processMyths() {
  console.log('\n=== Processing MYTHS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('myths').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const mythId = doc.id;

    try {
      const mythology = data.mythology || '';
      const htmlPath = path.join(__dirname, '..', 'mythos', mythology, 'myths', `${mythId}.html`);

      if (!fs.existsSync(htmlPath)) {
        console.log(`  ⚠️ No HTML found for myth: ${mythId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        summary: data.summary || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Myth-specific fields
        narrative: metadata.sections.Narrative || metadata.sections.Story || metadata.fullText,
        themes: metadata.lists.Themes || metadata.lists['Key Themes'] || [],
        characters: metadata.lists.Characters || metadata.lists.Participants || [],
        symbolism: metadata.sections.Symbolism || metadata.sections.Meaning || '',

        // Cross-references
        ...metadata.crossRefs,
        relatedMyths: metadata.lists['Related Myths'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.narrative || updates.themes.length > 0 || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('myths').doc(mythId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated myth: ${mythId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${mythId}:`, error.message);
      progress.errors.push({ collection: 'myths', id: mythId, error: error.message });
    }
  }

  progress.collections.myths = stats;
  console.log(`  📊 Myths: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process RITUALS collection
 */
async function processRituals() {
  console.log('\n=== Processing RITUALS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('rituals').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const ritualId = doc.id;

    try {
      const mythology = data.mythology || '';
      const htmlPath = path.join(__dirname, '..', 'mythos', mythology, 'rituals', `${ritualId}.html`);

      if (!fs.existsSync(htmlPath)) {
        console.log(`  ⚠️ No HTML found for ritual: ${ritualId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Ritual-specific fields
        purpose: metadata.sections.Purpose || metadata.sections.Goal || '',
        procedure: metadata.sections.Procedure || metadata.sections.Steps || metadata.sections['How to Perform'] || '',
        timing: metadata.sections.Timing || metadata.sections.When || '',
        participants: metadata.lists.Participants || metadata.lists['Who Performs'] || [],
        materials: metadata.lists.Materials || metadata.lists.Requirements || [],

        // Cross-references
        ...metadata.crossRefs,
        relatedRituals: metadata.lists['Related Rituals'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.purpose || updates.procedure || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('rituals').doc(ritualId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated ritual: ${ritualId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${ritualId}:`, error.message);
      progress.errors.push({ collection: 'rituals', id: ritualId, error: error.message });
    }
  }

  progress.collections.rituals = stats;
  console.log(`  📊 Rituals: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process SYMBOLS collection
 */
async function processSymbols() {
  console.log('\n=== Processing SYMBOLS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('symbols').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const symbolId = doc.id;

    try {
      const mythology = data.mythology || '';
      const htmlPath = path.join(__dirname, '..', 'mythos', mythology, 'symbols', `${symbolId}.html`);

      if (!fs.existsSync(htmlPath)) {
        console.log(`  ⚠️ No HTML found for symbol: ${symbolId}`);
        continue;
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Symbol-specific fields
        meaning: metadata.sections.Meaning || metadata.sections.Symbolism || '',
        usage: metadata.sections.Usage || metadata.sections['How Used'] || '',
        variations: metadata.lists.Variations || metadata.lists.Forms || [],

        // Cross-references
        ...metadata.crossRefs,
        relatedSymbols: metadata.lists['Related Symbols'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.meaning || updates.usage || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('symbols').doc(symbolId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated symbol: ${symbolId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${symbolId}:`, error.message);
      progress.errors.push({ collection: 'symbols', id: symbolId, error: error.message });
    }
  }

  progress.collections.symbols = stats;
  console.log(`  📊 Symbols: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Process MAGIC_SYSTEMS collection
 */
async function processMagicSystems() {
  console.log('\n=== Processing MAGIC_SYSTEMS Collection ===');
  const stats = { processed: 0, updated: 0, errors: 0 };

  const snapshot = await db.collection('magic_systems').get();

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();
    const magicId = doc.id;

    try {
      const mythology = data.mythology || '';
      const htmlPath = path.join(__dirname, '..', 'mythos', mythology, 'magic', `${magicId}.html`);

      if (!fs.existsSync(htmlPath)) {
        // Try index page
        const indexPath = path.join(__dirname, '..', 'mythos', mythology, 'magic', 'index.html');
        if (!fs.existsSync(indexPath)) {
          console.log(`  ⚠️ No HTML found for magic system: ${magicId}`);
          continue;
        }
      }

      const metadata = extractMetadataFromHTML(htmlPath);
      if (!metadata) continue;

      const updates = {
        name: data.name || metadata.title,
        description: data.description || metadata.description,
        updatedAt: new Date().toISOString(),
        enhancedBy: 'agent8',

        // Magic system-specific fields
        practitioners: metadata.lists.Practitioners || metadata.lists['Who Practices'] || [],
        methods: metadata.lists.Methods || metadata.lists.Techniques || [],
        purposes: metadata.lists.Purposes || metadata.lists.Uses || [],

        // Cross-references
        ...metadata.crossRefs,
        relatedSystems: metadata.lists['Related Systems'] || [],

        primarySources: metadata.lists['Primary Sources'] ||
                       metadata.lists.Sources ||
                       []
      };

      if (updates.practitioners.length > 0 || updates.methods.length > 0 || Object.keys(metadata.crossRefs).length > 0) {
        await db.collection('magic_systems').doc(magicId).update(updates);
        stats.updated++;
        console.log(`  ✓ Updated magic system: ${magicId}`);
      }

    } catch (error) {
      stats.errors++;
      console.error(`  ❌ Error processing ${magicId}:`, error.message);
      progress.errors.push({ collection: 'magic_systems', id: magicId, error: error.message });
    }
  }

  progress.collections.magic_systems = stats;
  console.log(`  📊 Magic Systems: ${stats.updated}/${stats.processed} updated`);
}

/**
 * Main execution
 */
async function main() {
  console.log('=====================================');
  console.log('AGENT 8: FIX REMAINING COLLECTIONS');
  console.log('=====================================');
  console.log('Starting at:', new Date().toISOString());
  console.log('');

  try {
    await processTexts();
    await processHerbs();
    await processItems();
    await processPlaces();
    await processConcepts();
    await processMyths();
    await processRituals();
    await processSymbols();
    await processMagicSystems();

    // Calculate totals
    for (const stats of Object.values(progress.collections)) {
      progress.stats.totalProcessed += stats.processed;
      progress.stats.totalUpdated += stats.updated;
      progress.stats.totalErrors += stats.errors;
    }

    // Save progress report
    const reportPath = path.join(__dirname, '..', 'AGENT8_FIX_PROGRESS.json');
    fs.writeFileSync(reportPath, JSON.stringify(progress, null, 2));

    console.log('\n=====================================');
    console.log('COMPLETION SUMMARY');
    console.log('=====================================');
    console.log(`Total Processed: ${progress.stats.totalProcessed}`);
    console.log(`Total Updated: ${progress.stats.totalUpdated}`);
    console.log(`Total Errors: ${progress.stats.totalErrors}`);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log('=====================================');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

#!/usr/bin/env node

/**
 * Sacred Texts Metadata Enrichment Script
 *
 * Populates rich metadata for sacred text entities including:
 * - author: Who wrote/authored the text
 * - period: Historical period when written
 * - language: Original language of composition
 * - themes: Major topics and concepts
 * - structure: How the text is organized
 * - influence: Impact on later works and traditions
 *
 * Usage:
 *   node ENRICH_SACRED_TEXTS_METADATA.js [--dry-run] [--collection texts]
 *
 * Options:
 *   --dry-run       Preview changes without writing
 *   --collection    Specify collection to process (default: texts)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TEXTS_DIR = path.join(__dirname, '../../firebase-assets-downloaded/texts');
const DRY_RUN = process.argv.includes('--dry-run');
const COLLECTION = process.argv.find(arg => arg.startsWith('--collection='))?.split('=')[1] || 'texts';

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  textsEnriched: 0,
  fieldsAdded: 0,
  errors: [],
  summary: {}
};

/**
 * Comprehensive metadata for sacred texts across traditions
 */
const SACRED_TEXTS_METADATA = {
  // CHRISTIAN TEXTS
  'christian_144000': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Sealing and Protection',
      'Divine Election',
      'End Times',
      'Spiritual Completeness',
      'Salvation'
    ],
    structure: 'Apocalyptic Vision - Part of the Book of Revelation describing divine sealing',
    influence: 'Influenced Christian theology on predestination, eschatology, and the number symbolism',
    alternateNames: ['The Sealed', 'Revelation 7, 14', '144,000 Servants']
  },
  'christian_babylon-fall-detailed': {
    author: 'Multiple - Isaiah, Jeremiah, John (Apostle)',
    period: '8th century BCE - 95 CE',
    language: 'Hebrew (Isaiah/Jeremiah), Koine Greek (Revelation)',
    themes: [
      'Imperial Fall',
      'Divine Justice',
      'Parallel Prophecy',
      'Judgment of Kingdoms',
      'Redemption'
    ],
    structure: 'Comparative Analysis - Phrase-by-phrase parallels across three prophetic texts',
    influence: 'Demonstrates continuity in prophetic tradition; influenced messianic interpretation',
    alternateNames: ['Babylon Parallels', 'Babel Prophecies']
  },
  'christian_babylon-falls': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Apocalyptic Justice',
      'Fall of Empire',
      'Divine Wrath',
      'End Times',
      'Spiritual Warfare'
    ],
    structure: 'Apocalyptic Vision - Detailed account of Babylon\'s destruction in Revelation',
    influence: 'Shaped Christian eschatology and political theology throughout history',
    alternateNames: ['Fall of Babylon', 'Revelation 17']
  },
  'christian_beast-kingdoms-progression': {
    author: 'Daniel (Prophet), John (Apostle)',
    period: '165 BCE - 95 CE',
    language: 'Aramaic/Hebrew (Daniel), Koine Greek (Revelation)',
    themes: [
      'Empire Succession',
      'Prophetic Continuity',
      'Beast Symbolism',
      'Apocalyptic Vision',
      'Historical Progression'
    ],
    structure: 'Comparative Framework - Linking Daniel\'s beasts to Revelation\'s imagery',
    influence: 'Central to Christian interpretations of world history and eschatological timelines',
    alternateNames: ['Four Beasts', 'Kingdoms Vision']
  },
  'christian_christ-returns': {
    author: 'John (Apostle), Paul (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Second Coming',
      'Parousia',
      'Resurrection',
      'Final Judgment',
      'Cosmic Renewal'
    ],
    structure: 'Apocalyptic Narrative - Vision of Christ\'s return and its implications',
    influence: 'Foundational to Christian hope, liturgy, and eschatological expectation',
    alternateNames: ['Parousia', 'Second Advent', 'Revelation 19']
  },
  'christian_covenant-formulas': {
    author: 'Multiple - Prophetic Tradition',
    period: '8th-6th century BCE',
    language: 'Hebrew',
    themes: [
      'Covenant Structure',
      'Divine Promise',
      'Conditional Blessing',
      'Prophetic Formula',
      'Relationship with God'
    ],
    structure: 'Formulaic Analysis - Recurring patterns in covenant statements',
    influence: 'Influenced understanding of divine-human relationship in Abrahamic traditions',
    alternateNames: ['Covenant Formulation', 'Treaty Language']
  },
  'christian_daniel-parallels': {
    author: 'Daniel (Prophet), John (Apostle)',
    period: '165 BCE - 95 CE',
    language: 'Aramaic/Hebrew (Daniel), Koine Greek (Revelation)',
    themes: [
      'Prophetic Continuity',
      'Apocalyptic Symbolism',
      'Divine Foreknowledge',
      'Time Prophecy',
      'Sovereignty'
    ],
    structure: 'Intertextual Study - Linking Daniel\'s prophecies to Revelation\'s fulfillment',
    influence: 'Shaped Christian interpretation of Old Testament prophecy',
    alternateNames: ['Daniel-Revelation Connection', 'Prophetic Echo']
  },
  'christian_exodus-parallels': {
    author: 'Moses (Traditional), John (Apostle)',
    period: '13th century BCE - 95 CE',
    language: 'Hebrew (Exodus), Koine Greek (Revelation)',
    themes: [
      'Redemption Typology',
      'Divine Liberation',
      'Plague Symbolism',
      'Eschatological Exodus',
      'Salvation History'
    ],
    structure: 'Typological Analysis - Exodus patterns applied to end times',
    influence: 'Developed Christian typological hermeneutics and exodus theology',
    alternateNames: ['Exodus Typology', 'Liberation Parallels']
  },
  'christian_ezekiel-parallels': {
    author: 'Ezekiel (Prophet), John (Apostle)',
    period: '593-571 BCE - 95 CE',
    language: 'Hebrew (Ezekiel), Koine Greek (Revelation)',
    themes: [
      'Divine Throne',
      'Four Living Creatures',
      'Temple Vision',
      'Glory of God',
      'Prophetic Calling'
    ],
    structure: 'Visionary Parallel - Linking Ezekiel\'s throne vision to Revelation\'s imagery',
    influence: 'Influenced Christian mysticism and throne theology',
    alternateNames: ['Ezekiel-Revelation Connection', 'Throne Vision']
  },
  'christian_four-horsemen': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Apocalyptic Judgment',
      'Four Horsemen',
      'Conquest and War',
      'Famine and Death',
      'Divine Justice'
    ],
    structure: 'Apocalyptic Vision - Sequential opening of seals revealing divine judgment',
    influence: 'Most iconic Christian end-times imagery; shaped eschatological expectations',
    alternateNames: ['Four Horsemen of the Apocalypse', 'Revelation 6']
  },
  'christian_four-living-creatures': {
    author: 'Ezekiel (Prophet), John (Apostle)',
    period: '593-571 BCE - 95 CE',
    language: 'Hebrew (Ezekiel), Koine Greek (Revelation)',
    themes: [
      'Divine Representation',
      'Symbolic Animals',
      'Gospel Symbols',
      'Cosmic Order',
      'Heavenly Liturgy'
    ],
    structure: 'Visionary Description - Four creatures surrounding the divine throne',
    influence: 'Linked to four gospels in Christian tradition; central to liturgical imagery',
    alternateNames: ['Tetramorphs', 'Divine Creatures', 'Four Beasts']
  },
  'christian_furnace-and-fire-judgments': {
    author: 'Daniel (Prophet), John (Apostle)',
    period: '165 BCE - 95 CE',
    language: 'Aramaic/Hebrew (Daniel), Koine Greek (Revelation)',
    themes: [
      'Divine Testing',
      'Fire Judgment',
      'Refinement',
      'Divine Protection',
      'Persecution'
    ],
    structure: 'Judgment Typology - From historical furnace to eschatological judgment',
    influence: 'Shaped Christian understanding of trial, persecution, and divine refining',
    alternateNames: ['Fire Judgment', 'Testing and Refinement']
  },
  'christian_gog-magog': {
    author: 'Ezekiel (Prophet), John (Apostle)',
    period: '593-571 BCE - 95 CE',
    language: 'Hebrew (Ezekiel), Koine Greek (Revelation)',
    themes: [
      'Final Battle',
      'Demonic Forces',
      'Cosmic Conflict',
      'Divine Victory',
      'End Times'
    ],
    structure: 'Apocalyptic Prophecy - End-times invasion and ultimate divine triumph',
    influence: 'Central to Christian eschatology and end-times theology',
    alternateNames: ['Gog and Magog', 'Final Conflict', 'Revelation 20']
  },
  'christian_heavenly-throne': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Divine Majesty',
      'Heavenly Court',
      'Celestial Liturgy',
      'Throne Vision',
      'Worship'
    ],
    structure: 'Mystical Vision - Description of God\'s throne and heavenly worship',
    influence: 'Shaped Christian mysticism, liturgy, and understanding of heaven',
    alternateNames: ['God\'s Throne', 'Heavenly Vision', 'Revelation 4']
  },
  'christian_isaiah-parallels': {
    author: 'Isaiah (Prophet), John (Apostle)',
    period: '8th century BCE - 95 CE',
    language: 'Hebrew (Isaiah), Koine Greek (Revelation)',
    themes: [
      'Suffering Servant',
      'Restoration',
      'New Creation',
      'Divine Redemption',
      'Messianic Hope'
    ],
    structure: 'Prophetic Continuation - Isaiah\'s restoration prophecy fulfilled in Revelation',
    influence: 'Linked Christ\'s sufferings to prophecy and final restoration',
    alternateNames: ['Isaiah Connection', 'Messianic Prophecy']
  },
  'christian_joel-parallels': {
    author: 'Joel (Prophet), John (Apostle), Peter (Apostle)',
    period: '5th century BCE - 95 CE',
    language: 'Hebrew (Joel), Koine Greek (Revelation)',
    themes: [
      'Spirit Outpouring',
      'Day of the Lord',
      'Cosmic Signs',
      'Salvation',
      'Judgment'
    ],
    structure: 'Prophetic Development - Joel\'s Day of the Lord in Revelation\'s apocalypse',
    influence: 'Connected Pentecost to end times; shaped eschatological theology',
    alternateNames: ['Joel Connection', 'Day of the Lord']
  },
  'christian_mark-of-beast': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Beast Worship',
      'Economic Control',
      'Spiritual Resistance',
      'Divine Mark',
      'Eschatological Conflict'
    ],
    structure: 'Apocalyptic Narrative - The mark as sign of allegiance to the beast',
    influence: 'Generated extensive theological and popular interpretation; central to eschatology',
    alternateNames: ['666', 'Number of the Beast', 'Revelation 13']
  },
  'christian_millennium': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Thousand Years',
      'Christ\'s Reign',
      'Messianic Kingdom',
      'Divine Peace',
      'Eschatological Timeline'
    ],
    structure: 'Eschatological Vision - Christ\'s millennial kingdom and ultimate restoration',
    influence: 'Generated multiple Christian eschatological systems (premillennialism, amillennialism, postmillennialism)',
    alternateNames: ['Millennial Kingdom', 'Thousand Year Reign', 'Revelation 20']
  },
  'christian_names-and-titles': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Christological Names',
      'Divine Identity',
      'Symbolic Titles',
      'Incarnation',
      'Lordship'
    ],
    structure: 'Theological Study - Multiple names and titles of Christ in Revelation',
    influence: 'Shaped Christian Christology and understanding of Christ\'s nature',
    alternateNames: ['Christ\'s Names', 'Titles of Jesus']
  },
  'christian_new-creation': {
    author: 'John (Apostle), Paul (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Cosmic Restoration',
      'New Heaven and Earth',
      'Divine Renewal',
      'Eternal State',
      'Transformed Reality'
    ],
    structure: 'Eschatological Vision - The ultimate renewal of creation',
    influence: 'Shaped Christian hope and understanding of redemption\'s cosmic scope',
    alternateNames: ['New Heavens and New Earth', 'Eternal State', 'Revelation 21']
  },
  'christian_new-jerusalem': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Heavenly City',
      'God\'s Dwelling',
      'Bride of Christ',
      'Eternal Home',
      'Divine Presence'
    ],
    structure: 'Eschatological Vision - Detailed description of the eternal city',
    influence: 'Inspired Christian longing for heaven and understanding of eternal communion with God',
    alternateNames: ['Heavenly Jerusalem', 'Holy City', 'Revelation 21']
  },
  'christian_seven-bowls': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Divine Wrath',
      'Final Plagues',
      'Judgment Sequence',
      'Divine Justice',
      'Cosmic Cataclysm'
    ],
    structure: 'Apocalyptic Vision - Seven bowls of God\'s wrath poured out',
    influence: 'Completes judgment narrative; shaped understanding of final divine judgment',
    alternateNames: ['Seven Vials', 'Bowls of Wrath', 'Revelation 15-16']
  },
  'christian_seven-churches': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Ecclesiology',
      'Church Strength and Weakness',
      'Spiritual Condition',
      'Divine Critique',
      'Prophetic Message'
    ],
    structure: 'Prophetic Letters - Seven messages to churches in Asia Minor',
    influence: 'First section of Revelation; shaped understanding of church health and growth',
    alternateNames: ['Letters to the Seven Churches', 'Seven Churches of Asia']
  },
  'christian_seven-patterns': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Symbolic Number',
      'Completeness',
      'Divine Pattern',
      'Sacred Numerology',
      'Structural Principle'
    ],
    structure: 'Numerological Framework - The sevenfold pattern throughout Revelation',
    influence: 'Shaped biblical numerology and understanding of prophetic structure',
    alternateNames: ['Sevenfold Pattern', 'Sacred Seven']
  },
  'christian_seven-seals': {
    author: 'John (Apostle)',
    period: '95-96 BCE',
    language: 'Koine Greek',
    themes: [
      'Progressive Revelation',
      'Divine Will',
      'Sealed Mystery',
      'Unveiling Truth',
      'Apocalyptic Timeline'
    ],
    structure: 'Apocalyptic Vision - Seven seals progressively opened revealing divine plan',
    influence: 'Central to Christian eschatology; initiates Revelation\'s prophetic progression',
    alternateNames: ['Sealed Scroll', 'Revelation 5-8']
  },
  'christian_seven-trumpets': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Divine Announcement',
      'Plague Judgments',
      'Warning Judgments',
      'Escalating Crisis',
      'Apocalyptic Warning'
    ],
    structure: 'Apocalyptic Vision - Seven trumpet judgments with escalating severity',
    influence: 'Bridges seal and bowl judgments; shaped understanding of progressive judgment',
    alternateNames: ['Trumpet Judgments', 'Revelation 8-11']
  },
  'christian_structure': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Literary Structure',
      'Apocalyptic Form',
      'Theological Organization',
      'Narrative Pattern',
      'Symbolic Framework'
    ],
    structure: 'Analytical Study - Overall structure and organization of Revelation',
    influence: 'Enables deeper understanding of Revelation\'s theological intent',
    alternateNames: ['Revelation\'s Structure', 'Apocalyptic Form']
  },
  'christian_symbolism': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Symbolic Language',
      'Apocalyptic Imagery',
      'Numerological Meaning',
      'Prophetic Symbol',
      'Divine Communication'
    ],
    structure: 'Interpretive Framework - Key symbols and their meanings in Revelation',
    influence: 'Central to understanding apocalyptic literature and prophetic interpretation',
    alternateNames: ['Revelation Symbols', 'Apocalyptic Imagery']
  },
  'christian_two-beasts': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Political Power',
      'Religious Deception',
      'Antichrist System',
      'Beast Empire',
      'False Prophet'
    ],
    structure: 'Apocalyptic Vision - Two beasts representing political and religious evil',
    influence: 'Shaped Christian understanding of antichrist, false prophet, and end-times deception',
    alternateNames: ['Beast from the Sea', 'Beast from the Earth', 'Revelation 13']
  },
  'christian_woman-and-dragon': {
    author: 'John (Apostle)',
    period: '95-96 CE',
    language: 'Koine Greek',
    themes: [
      'Messianic Birth',
      'Cosmic Conflict',
      'Divine Protection',
      'Evil Opposition',
      'Spiritual Warfare'
    ],
    structure: 'Apocalyptic Vision - Woman and dragon representing Christ and Satan',
    influence: 'Shaped Christian Mariology and understanding of cosmic spiritual conflict',
    alternateNames: ['Woman Clothed with Sun', 'Red Dragon', 'Revelation 12']
  },
  'christian_zechariah-parallels': {
    author: 'Zechariah (Prophet), John (Apostle)',
    period: '520-518 BCE - 95 CE',
    language: 'Hebrew (Zechariah), Koine Greek (Revelation)',
    themes: [
      'Eschatological Vision',
      'Messianic Expectation',
      'Apocalyptic Imagery',
      'Divine Restoration',
      'Future Hope'
    ],
    structure: 'Prophetic Parallel - Zechariah\'s apocalyptic themes in Revelation',
    influence: 'Connected Old Testament prophecy to New Testament fulfillment',
    alternateNames: ['Zechariah Connection', 'Prophetic Continuity']
  },

  // EGYPTIAN TEXTS
  'egyptian_amduat': {
    author: 'Egyptian Priesthood (Anonymous)',
    period: '1570-1069 BCE (New Kingdom)',
    language: 'Egyptian (Hieroglyphic)',
    themes: [
      'Underworld Journey',
      'Solar Cycle',
      'Rebirth and Resurrection',
      'Divine Transformation',
      'Eternal Life'
    ],
    structure: 'Guidebook - Divided into twelve hours depicting the sun god\'s nocturnal journey',
    influence: 'Foundation of Egyptian afterlife beliefs; influenced later Jewish and Christian eschatology',
    alternateNames: ['Book of What is in the Duat', 'Funerary Text', 'Pharaonic Cosmology']
  },

  // JEWISH TEXTS
  'jewish_flood-myths-ane': {
    author: 'Moses (Traditional), Mesopotamian Sources',
    period: '2100-1800 BCE (Gilgamesh), 13th century BCE (Genesis)',
    language: 'Sumerian/Akkadian (Gilgamesh), Hebrew (Genesis), Akkadian (Atrahasis)',
    themes: [
      'Universal Destruction',
      'Divine Judgment',
      'Covenant Renewal',
      'Human Sinfulness',
      'Salvation and Preservation'
    ],
    structure: 'Comparative Mythology - Three ancient Near Eastern flood narratives',
    influence: 'Shows cultural borrowing and theological adaptation in early Jewish thought',
    alternateNames: ['Flood Narratives', 'Mesopotamian Flood Parallels', 'Genesis Flood']
  },
  'jewish_potter-and-clay': {
    author: 'Jeremiah (Prophet), Mesopotamian Tradition',
    period: '7th-6th century BCE',
    language: 'Hebrew',
    themes: [
      'Divine Sovereignty',
      'Human Pliability',
      'Creator-Creation Relationship',
      'Divine Will',
      'Redemptive Purpose'
    ],
    structure: 'Prophetic Metaphor - Pottery metaphor for God\'s relationship with humanity',
    influence: 'Shaped Jewish and Christian understanding of divine predestination and free will',
    alternateNames: ['Clay Metaphor', 'Potter\'s Hand', 'Divine Crafting']
  },
  'jewish_tiamat-and-tehom': {
    author: 'Mesopotamian Sources, Moses (Traditional)',
    period: '1800-1600 BCE (Enuma Elish), 13th century BCE (Genesis)',
    language: 'Akkadian (Enuma Elish), Hebrew (Genesis)',
    themes: [
      'Creation from Chaos',
      'Water Symbolism',
      'Divine Victory',
      'Cosmic Order',
      'Primordial Conflict'
    ],
    structure: 'Mythological Parallel - Tiamat myth connected to Genesis creation account',
    influence: 'Demonstrates theological parallels and unique Israelite monotheistic adaptation',
    alternateNames: ['Chaos Waters', 'Creation Myth Comparison', 'Tehom and Tiamat']
  }
};

/**
 * Load all text files from directory
 */
function loadAllTexts() {
  console.log(`Loading text files from ${TEXTS_DIR}...`);

  if (!fs.existsSync(TEXTS_DIR)) {
    console.error(`Error: Texts directory not found at ${TEXTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TEXTS_DIR);
  const textFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Found ${textFiles.length} text files`);
  return textFiles;
}

/**
 * Enrich a single text entity with metadata
 */
function enrichTextEntity(text) {
  if (!text || typeof text !== 'object') {
    return { modified: false, changes: [] };
  }

  const changes = [];
  const textId = text.id || '';

  // Get metadata for this text
  const metadata = SACRED_TEXTS_METADATA[textId];

  if (!metadata) {
    return { modified: false, changes: [] };
  }

  // Enrich author
  if (!text.author || text.author === '') {
    text.author = metadata.author;
    changes.push('author');
  }

  // Enrich period
  if (!text.period || text.period === '') {
    text.period = metadata.period;
    changes.push('period');
  }

  // Enrich language
  if (!text.language || text.language === '') {
    text.language = metadata.language;
    changes.push('language');
  }

  // Enrich themes (merge with existing)
  if (!text.themes || !Array.isArray(text.themes) || text.themes.length === 0) {
    text.themes = metadata.themes;
    changes.push('themes');
  } else if (text.themes.length < metadata.themes.length) {
    // Only add missing themes
    const existingThemes = new Set(text.themes);
    const newThemes = metadata.themes.filter(t => !existingThemes.has(t));
    if (newThemes.length > 0) {
      text.themes = [...text.themes, ...newThemes];
      changes.push('themes_expanded');
    }
  }

  // Enrich structure
  if (!text.structure || text.structure === '') {
    text.structure = metadata.structure;
    changes.push('structure');
  }

  // Enrich influence
  if (!text.influence || text.influence === '') {
    text.influence = metadata.influence;
    changes.push('influence');
  }

  // Add alternate names if not present
  if (!text.alternateNames && metadata.alternateNames) {
    text.alternateNames = metadata.alternateNames;
    changes.push('alternateNames');
  }

  return {
    modified: changes.length > 0,
    changes: changes
  };
}

/**
 * Process a single JSON file
 */
function processTextFile(filename) {
  const filePath = path.join(TEXTS_DIR, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    let texts = [];

    // Handle both array format and single object format
    if (Array.isArray(data)) {
      texts = data;
    } else if (typeof data === 'object' && data.id) {
      texts = [data];
    } else {
      stats.errors.push({
        file: filename,
        error: 'File does not contain valid text entity/entities'
      });
      return;
    }

    let fileModified = false;
    const fileStats = {
      processed: 0,
      enriched: 0,
      changes: []
    };

    // Enrich each text in the file
    texts.forEach((text, index) => {
      const result = enrichTextEntity(text);

      if (result.modified) {
        fileModified = true;
        fileStats.enriched++;
        fileStats.changes.push({
          id: text.id,
          changes: result.changes
        });
      }
      fileStats.processed++;
    });

    // Write back if modified and not in dry-run mode
    if (fileModified && !DRY_RUN) {
      // Write back in the same format
      const outputData = Array.isArray(data) ? texts : texts[0];
      fs.writeFileSync(filePath, JSON.stringify(outputData, null, 2));
      stats.filesModified++;
      console.log(`✓ Updated: ${filename} (${fileStats.enriched}/${fileStats.processed} texts enriched)`);
    } else if (fileModified && DRY_RUN) {
      console.log(`[DRY RUN] Would update: ${filename} (${fileStats.enriched}/${fileStats.processed} texts enriched)`);
    }

    stats.filesProcessed++;
    stats.textsEnriched += fileStats.enriched;

    if (!stats.summary[filename]) {
      stats.summary[filename] = fileStats;
    }

    // Log detailed changes if any
    if (fileStats.changes.length > 0 && !DRY_RUN) {
      console.log(`  Changes in ${filename}:`);
      fileStats.changes.forEach(change => {
        console.log(`    - ${change.id}: ${change.changes.join(', ')}`);
      });
    }

  } catch (error) {
    stats.errors.push({
      file: filename,
      error: error.message
    });
    console.error(`✗ Error processing ${filename}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(70));
  console.log('Sacred Texts Metadata Enrichment Script');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log(`Collection: ${COLLECTION}`);
  console.log();

  const textFiles = loadAllTexts();

  if (textFiles.length === 0) {
    console.log('No text files to process.');
    process.exit(0);
  }

  console.log('Processing files...\n');

  textFiles.forEach(file => {
    processTextFile(file);
  });

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('Summary');
  console.log('='.repeat(70));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Texts enriched: ${stats.textsEnriched}`);
  console.log(`Fields added: ${Object.values(stats.summary).reduce((sum, f) => sum + f.changes.length, 0)}`);

  if (stats.errors.length > 0) {
    console.log(`\nErrors: ${stats.errors.length}`);
    stats.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }

  if (DRY_RUN) {
    console.log('\nNo changes were made (dry-run mode).');
    console.log('Run without --dry-run flag to apply changes.');
  } else {
    console.log('\nChanges applied successfully!');
  }

  console.log('='.repeat(70));
  console.log();
}

// Run the script
main();

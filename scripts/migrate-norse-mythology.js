/**
 * Norse Mythology Migration Script
 * Migrates all Norse content from old repository to new entity-schema-v2.0 format
 *
 * Usage:
 *   node scripts/migrate-norse-mythology.js --mode <enhance|migrate|validate>
 */

const fs = require('fs');
const path = require('path');

// Paths
const OLD_REPO = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\norse';
const NEW_REPO = 'H:\\Github\\EyesOfAzrael\\data\\entities';
const SCHEMA_PATH = path.join(__dirname, '../data/schemas/entity-schema-v2.json');

// Load schema
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

// Migration statistics
const stats = {
  deities: { total: 0, enhanced: 0, created: 0 },
  places: { total: 0, enhanced: 0, created: 0 },
  items: { total: 0, enhanced: 0, created: 0 },
  creatures: { total: 0, enhanced: 0, created: 0 },
  magic: { total: 0, enhanced: 0, created: 0 },
  concepts: { total: 0, enhanced: 0, created: 0 },
  errors: []
};

/**
 * Old Norse names and runic data for Norse entities
 */
const OLD_NORSE_DATA = {
  // Deities
  odin: {
    originalName: 'Óðinn',
    runes: 'ᚢᚦᛁᚾ',
    pronunciation: '/ˈoːðinː/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'fury, rage, inspiration', derivation: '*Wōdanaz' },
    alternativeNames: [
      { name: 'Allfather', language: 'English', context: 'Supreme father of gods', meaning: 'Father of all' },
      { name: 'Valföðr', language: 'Old Norse', context: 'Father of the slain', meaning: 'Father of those chosen for Valhalla' },
      { name: 'Hár', language: 'Old Norse', context: 'The High One', meaning: 'High' },
      { name: 'Grimnir', language: 'Old Norse', context: 'The Masked One', meaning: 'Masked' },
      { name: 'Gangleri', language: 'Old Norse', context: 'The Wanderer', meaning: 'Weary walker' }
    ]
  },
  thor: {
    originalName: 'Þórr',
    runes: 'ᚦᚢᚱ',
    pronunciation: '/θoːrː/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'thunder', derivation: '*Þunraz' },
    alternativeNames: [
      { name: 'Donar', language: 'Old High German', context: 'Continental Germanic', meaning: 'Thunder' },
      { name: 'Þunor', language: 'Old English', context: 'Anglo-Saxon', meaning: 'Thunder' },
      { name: 'Vingthor', language: 'Old Norse', context: 'The Hallower', meaning: 'Battle Thor' }
    ]
  },
  freyja: {
    originalName: 'Freyja',
    runes: 'ᚠᚱᛁᚢᛁᛅ',
    pronunciation: '/ˈfrøy.jɑ/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'lady, mistress', derivation: '*Frawjōn' },
    alternativeNames: [
      { name: 'Vanadís', language: 'Old Norse', context: 'Dís of the Vanir', meaning: 'Goddess of the Vanir' },
      { name: 'Mardöll', language: 'Old Norse', context: 'Sea-bright', meaning: 'Shining over the sea' },
      { name: 'Gefn', language: 'Old Norse', context: 'The Giver', meaning: 'Generous one' }
    ]
  },
  loki: {
    originalName: 'Loki',
    runes: 'ᛚᚢᚴᛁ',
    pronunciation: '/ˈloki/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'knot, lock, close, end', derivation: 'lúka (to close)' },
    alternativeNames: [
      { name: 'Loptr', language: 'Old Norse', context: 'Air traveler', meaning: 'Sky walker' },
      { name: 'Hveðrungr', language: 'Old Norse', context: 'Roarer', meaning: 'Storm bringer' }
    ]
  },
  freyr: {
    originalName: 'Freyr',
    runes: 'ᚠᚱᛁᚢᛦ',
    pronunciation: '/frøyr/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'lord, master', derivation: '*Fraujaz' },
    alternativeNames: [
      { name: 'Yngvi', language: 'Old Norse', context: 'Ancestor of Ynglings', meaning: 'Ancestor' },
      { name: 'Fróði', language: 'Old Norse', context: 'The Wise', meaning: 'Wise, learned' }
    ]
  },
  tyr: {
    originalName: 'Týr',
    runes: 'ᛏᛁᚱ',
    pronunciation: '/tyːr/',
    etymology: { rootLanguage: 'Proto-Indo-European', meaning: 'god, deity', derivation: '*Deywos' },
    alternativeNames: [
      { name: 'Tiw', language: 'Old English', context: 'Anglo-Saxon', meaning: 'God' },
      { name: 'Ziu', language: 'Old High German', context: 'Continental Germanic', meaning: 'God' }
    ]
  },
  baldr: {
    originalName: 'Baldr',
    runes: 'ᛒᛅᛚᛏᚱ',
    pronunciation: '/ˈbɑldz̠/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'brave, bold, lord', derivation: '*Balðraz' },
    alternativeNames: [
      { name: 'Balder', language: 'English', context: 'Modern anglicized', meaning: 'Bold one' }
    ]
  },
  heimdall: {
    originalName: 'Heimdallr',
    runes: 'ᚼᛁᛘᛏᛅᛚᛦ',
    pronunciation: '/ˈhɛimˌdɑlːz̠/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'world brightener', derivation: 'heimr (world) + dallr (bright)' },
    alternativeNames: [
      { name: 'Hallinskíði', language: 'Old Norse', context: 'Ram with crooked horns', meaning: 'Slanting staff' },
      { name: 'Gullintanni', language: 'Old Norse', context: 'Golden-toothed', meaning: 'Gold-teeth' }
    ]
  },
  frigg: {
    originalName: 'Frigg',
    runes: 'ᚠᚱᛁᚴ',
    pronunciation: '/frɪɡː/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'beloved, wife', derivation: '*Frijjō' },
    alternativeNames: [
      { name: 'Fricka', language: 'Old High German', context: 'Continental Germanic', meaning: 'Beloved' }
    ]
  },
  hel: {
    originalName: 'Hel',
    runes: 'ᚼᛁᛚ',
    pronunciation: '/hɛl/',
    etymology: { rootLanguage: 'Proto-Germanic', meaning: 'hidden, concealed', derivation: '*Haljō' },
    alternativeNames: []
  },
  // Places
  yggdrasil: {
    originalName: 'Yggdrasill',
    runes: 'ᛁᚴᛏᚱᛅᛋᛁᛚ',
    pronunciation: '/ˈyɡːˌdrɑsilː/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'Ygg\'s (Odin\'s) horse', derivation: 'Yggr (Odin) + drasill (horse)' },
    alternativeNames: [
      { name: 'Worldtree', language: 'English', context: 'Cosmological center', meaning: 'Tree connecting all realms' },
      { name: 'Mimameidr', language: 'Old Norse', context: 'Mimir\'s tree', meaning: 'Tree of Mimir' }
    ]
  },
  valhalla: {
    originalName: 'Valhöll',
    runes: 'ᚢᛅᛚᚼᚢᛚ',
    pronunciation: '/ˈwɑlˌhœlː/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'hall of the slain', derivation: 'valr (slain) + höll (hall)' },
    alternativeNames: [
      { name: 'Hall of the Slain', language: 'English', context: 'Translation', meaning: 'Place of honored dead' }
    ]
  },
  asgard: {
    originalName: 'Ásgarðr',
    runes: 'ᛅᛋᚴᛅᚱᚦᚱ',
    pronunciation: '/ˈɑːsˌɡɑrðz̠/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'enclosure of the Aesir', derivation: 'Áss (god) + garðr (enclosure)' },
    alternativeNames: []
  },
  bifrost: {
    originalName: 'Bifröst',
    runes: 'ᛒᛁᚠᚱᚢᛋᛏ',
    pronunciation: '/ˈbivˌrøst/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'shaking path', derivation: 'bifa (shake) + röst (path)' },
    alternativeNames: [
      { name: 'Rainbow Bridge', language: 'English', context: 'Translation', meaning: 'Bridge connecting realms' },
      { name: 'Ásbrú', language: 'Old Norse', context: 'Bridge of the Aesir', meaning: 'Gods\' bridge' }
    ]
  },
  helheim: {
    originalName: 'Helheimr',
    runes: 'ᚼᛁᛚᚼᛁᛘᚱ',
    pronunciation: '/ˈhɛlˌhɛimz̠/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'home of Hel', derivation: 'Hel + heimr (home)' },
    alternativeNames: [
      { name: 'Niflhel', language: 'Old Norse', context: 'Misty Hel', meaning: 'Dark realm of the dead' }
    ]
  },
  midgard: {
    originalName: 'Miðgarðr',
    runes: 'ᛘᛁᚦᚴᛅᚱᚦᚱ',
    pronunciation: '/ˈmiðˌɡɑrðz̠/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'middle enclosure', derivation: 'miðr (middle) + garðr (enclosure)' },
    alternativeNames: [
      { name: 'Middle-earth', language: 'English', context: 'Translation', meaning: 'World of humans' }
    ]
  },
  // Items
  mjolnir: {
    originalName: 'Mjölnir',
    runes: 'ᛘᛁᚢᛚᚾᛁᚱ',
    pronunciation: '/ˈmjœlnir/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'crusher, grinder', derivation: 'mala (to grind)' },
    alternativeNames: []
  },
  gungnir: {
    originalName: 'Gungnir',
    runes: 'ᚴᚢᚾᚴᚾᛁᚱ',
    pronunciation: '/ˈɡuŋɡnir/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'swaying one', derivation: 'gunga (to sway)' },
    alternativeNames: []
  },
  draupnir: {
    originalName: 'Draupnir',
    runes: 'ᛏᚱᛅᚢᛒᚾᛁᚱ',
    pronunciation: '/ˈdrɔupnir/',
    etymology: { rootLanguage: 'Old Norse', meaning: 'dripper', derivation: 'drjúpa (to drip)' },
    alternativeNames: []
  }
};

/**
 * Scandinavian geographical data
 */
const SCANDINAVIAN_LOCATIONS = {
  uppsala: {
    name: 'Uppsala',
    modernName: 'Uppsala, Sweden',
    coordinates: { latitude: 59.8586, longitude: 17.6389, accuracy: 'exact' },
    type: 'temple',
    significance: 'Major cult center for Norse worship, especially Odin, Thor, and Freyr'
  },
  iceland: {
    name: 'Iceland',
    coordinates: { latitude: 64.9631, longitude: -19.0208, accuracy: 'general_area' },
    type: 'region'
  },
  norway: {
    name: 'Norway',
    coordinates: { latitude: 60.4720, longitude: 8.4689, accuracy: 'general_area' },
    type: 'region'
  },
  sweden: {
    name: 'Sweden',
    coordinates: { latitude: 60.1282, longitude: 18.6435, accuracy: 'general_area' },
    type: 'region'
  },
  denmark: {
    name: 'Denmark',
    coordinates: { latitude: 56.2639, longitude: 9.5018, accuracy: 'general_area' },
    type: 'region'
  }
};

/**
 * Viking Age temporal data
 */
const VIKING_AGE_PERIOD = {
  start: { year: 793, display: '793 CE' },
  end: { year: 1066, display: '1066 CE' },
  display: '793-1066 CE (Viking Age)'
};

const EDDA_ATTESTATIONS = {
  poeticEdda: {
    date: { year: 1270, circa: true, display: 'c. 1270 CE' },
    source: 'Poetic Edda (Codex Regius)',
    type: 'literary',
    confidence: 'certain'
  },
  proseEdda: {
    date: { year: 1220, circa: true, display: 'c. 1220 CE' },
    source: 'Prose Edda (Snorri Sturluson)',
    type: 'literary',
    confidence: 'certain'
  }
};

/**
 * Enhance existing Norse deity with v2.0 schema data
 */
function enhanceNorseDeity(deityId) {
  const entityPath = path.join(NEW_REPO, 'deity', `${deityId}.json`);

  if (!fs.existsSync(entityPath)) {
    stats.errors.push(`Deity ${deityId} not found at ${entityPath}`);
    return null;
  }

  try {
    const entity = JSON.parse(fs.readFileSync(entityPath, 'utf-8'));
    const oldNorseData = OLD_NORSE_DATA[deityId];

    // Convert old format to v2.0
    const enhanced = {
      id: entity.id || deityId,
      type: 'deity',
      name: entity.displayName || entity.name,
      mythologies: ['norse'],
      primaryMythology: 'norse',
      shortDescription: entity.subtitle || entity.summary?.substring(0, 200),
      fullDescription: entity.summary || '',
      icon: entity.icon || '⚡',
      slug: entity.id || deityId,
      tags: entity.tags || [deityId, 'norse', 'deity'],
      colors: {
        primary: '#4A90E2', // Norse blue
        secondary: '#FFD700', // Gold
        accent: '#8B4513' // Norse brown
      }
    };

    // Add linguistic data if available
    if (oldNorseData) {
      enhanced.linguistic = {
        originalName: oldNorseData.originalName,
        originalScript: 'runic',
        transliteration: oldNorseData.originalName,
        pronunciation: oldNorseData.pronunciation,
        alternativeNames: oldNorseData.alternativeNames,
        etymology: oldNorseData.etymology,
        languageCode: 'non', // Old Norse ISO code
        runicScript: oldNorseData.runes
      };
    }

    // Add geographical data (Scandinavia)
    enhanced.geographical = {
      region: 'Scandinavia',
      culturalArea: 'Viking Age Scandinavia',
      modernCountries: ['Norway', 'Sweden', 'Denmark', 'Iceland'],
      primaryLocation: SCANDINAVIAN_LOCATIONS.uppsala,
      associatedLocations: [
        SCANDINAVIAN_LOCATIONS.iceland,
        SCANDINAVIAN_LOCATIONS.norway,
        SCANDINAVIAN_LOCATIONS.sweden,
        SCANDINAVIAN_LOCATIONS.denmark
      ],
      mapVisualization: {
        center: { latitude: 60.0, longitude: 10.0 },
        zoom: 4,
        bounds: {
          north: 71.1,
          south: 55.0,
          east: 31.0,
          west: -25.0
        }
      }
    };

    // Add temporal data
    enhanced.temporal = {
      historicalDate: VIKING_AGE_PERIOD,
      firstAttestation: EDDA_ATTESTATIONS.poeticEdda,
      culturalPeriod: 'Viking Age',
      literaryReferences: [
        {
          work: 'Poetic Edda',
          author: 'Unknown (collected works)',
          date: { year: 1270, circa: true },
          significance: 'Primary source for Norse mythology'
        },
        {
          work: 'Prose Edda',
          author: 'Snorri Sturluson',
          date: { year: 1220, circa: true },
          significance: 'Comprehensive mythological handbook'
        }
      ]
    };

    // Extract cultural data from rich content
    if (entity.richContent?.panels) {
      const worshipPanel = entity.richContent.panels.find(p => p.type === 'worship');
      if (worshipPanel?.content) {
        enhanced.cultural = {
          worshipPractices: extractWorshipPractices(worshipPanel.content),
          festivals: extractFestivals(worshipPanel.content),
          socialRole: entity.subtitle || '',
          demographicAppeal: extractDemographicAppeal(entity)
        };
      }
    }

    // Add sources
    enhanced.sources = [
      {
        title: 'Poetic Edda',
        author: 'Unknown',
        date: { year: 1270, circa: true },
        type: 'primary',
        relevance: 'comprehensive'
      },
      {
        title: 'Prose Edda',
        author: 'Snorri Sturluson',
        date: { year: 1220, circa: true },
        type: 'primary',
        relevance: 'comprehensive'
      }
    ];

    // Add metadata
    enhanced.metadata = {
      created: entity.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '2.0',
      completeness: calculateCompleteness(enhanced),
      migrationSource: 'norse-mythology-migration-v2.0'
    };

    // Add Firebase fields
    enhanced.searchTerms = generateSearchTerms(enhanced);
    enhanced.visibility = 'public';
    enhanced.status = 'published';

    stats.deities.enhanced++;
    return enhanced;

  } catch (error) {
    stats.errors.push(`Error enhancing deity ${deityId}: ${error.message}`);
    return null;
  }
}

/**
 * Extract worship practices from content
 */
function extractWorshipPractices(content) {
  const practices = [];
  if (content.offerings) practices.push(content.offerings);
  if (content.sacredSites) practices.push(content.sacredSites);
  return practices;
}

/**
 * Extract festivals from content
 */
function extractFestivals(content) {
  if (typeof content.festivals === 'string') {
    return content.festivals.split(/\n\n/).map(f => {
      const match = f.match(/^(.+?):/);
      return {
        name: match ? match[1] : 'Unknown',
        description: f
      };
    });
  }
  return [];
}

/**
 * Extract demographic appeal
 */
function extractDemographicAppeal(entity) {
  const appeal = [];
  const content = JSON.stringify(entity).toLowerCase();

  if (content.includes('warrior') || content.includes('battle')) appeal.push('warriors');
  if (content.includes('farmer') || content.includes('agriculture')) appeal.push('farmers');
  if (content.includes('king') || content.includes('noble')) appeal.push('nobility');
  if (content.includes('poet') || content.includes('skald')) appeal.push('poets');
  if (content.includes('women') || content.includes('fertility')) appeal.push('women');
  if (content.includes('sailor') || content.includes('sea')) appeal.push('sailors');

  return appeal;
}

/**
 * Calculate completeness percentage
 */
function calculateCompleteness(entity) {
  let score = 0;
  const fields = [
    'id', 'type', 'name', 'mythologies', 'shortDescription', 'fullDescription',
    'icon', 'colors', 'linguistic', 'geographical', 'temporal', 'cultural',
    'sources', 'tags', 'metadata'
  ];

  fields.forEach(field => {
    if (entity[field]) {
      if (typeof entity[field] === 'object' && Object.keys(entity[field]).length > 0) {
        score++;
      } else if (typeof entity[field] === 'string' && entity[field].length > 0) {
        score++;
      } else if (Array.isArray(entity[field]) && entity[field].length > 0) {
        score++;
      }
    }
  });

  return Math.round((score / fields.length) * 100);
}

/**
 * Generate search terms for Firebase
 */
function generateSearchTerms(entity) {
  const terms = [
    entity.id,
    entity.name.toLowerCase(),
    'norse',
    'viking',
    'scandinavian'
  ];

  if (entity.linguistic?.originalName) {
    terms.push(entity.linguistic.originalName.toLowerCase());
  }

  if (entity.linguistic?.alternativeNames) {
    entity.linguistic.alternativeNames.forEach(alt => {
      terms.push(alt.name.toLowerCase());
    });
  }

  if (entity.tags) {
    terms.push(...entity.tags.map(t => t.toLowerCase()));
  }

  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Enhance existing Norse place with v2.0 schema data
 */
function enhanceNorsePlace(placeId) {
  const entityPath = path.join(NEW_REPO, 'place', `${placeId}.json`);

  if (!fs.existsSync(entityPath)) {
    stats.errors.push(`Place ${placeId} not found at ${entityPath}`);
    return null;
  }

  try {
    const entity = JSON.parse(fs.readFileSync(entityPath, 'utf-8'));
    const oldNorseData = OLD_NORSE_DATA[placeId];

    // Keep existing data and enhance with v2.0 additions
    const enhanced = {
      ...entity,
      mythologies: entity.mythologies || ['norse'],
      primaryMythology: entity.primaryMythology || 'norse'
    };

    // Add runic script to linguistic data if available
    if (oldNorseData && enhanced.linguistic) {
      enhanced.linguistic.runicScript = oldNorseData.runes;
      // Update pronunciation if we have better data
      if (oldNorseData.pronunciation) {
        enhanced.linguistic.pronunciation = oldNorseData.pronunciation;
      }
      // Add alternative names if not present
      if (oldNorseData.alternativeNames && oldNorseData.alternativeNames.length > 0) {
        enhanced.linguistic.alternativeNames = oldNorseData.alternativeNames;
      }
    }

    // Update temporal data with standardized Viking Age dates
    if (enhanced.temporal) {
      enhanced.temporal.literaryReferences = [
        {
          work: 'Poetic Edda',
          author: 'Unknown (collected works)',
          date: { year: 1270, circa: true },
          significance: 'Primary source for Norse mythology'
        },
        {
          work: 'Prose Edda',
          author: 'Snorri Sturluson',
          date: { year: 1220, circa: true },
          significance: 'Comprehensive mythological handbook'
        }
      ];
    }

    // Add metadata if not present
    if (!enhanced.metadata) {
      enhanced.metadata = {
        created: entity.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '2.0',
        completeness: calculateCompleteness(enhanced),
        migrationSource: 'norse-mythology-migration-v2.0'
      };
    } else {
      enhanced.metadata.lastModified = new Date().toISOString();
      enhanced.metadata.version = '2.0';
      enhanced.metadata.completeness = calculateCompleteness(enhanced);
    }

    // Add Firebase fields
    enhanced.searchTerms = generateSearchTerms(enhanced);
    enhanced.visibility = 'public';
    enhanced.status = 'published';

    stats.places.enhanced++;
    return enhanced;

  } catch (error) {
    stats.errors.push(`Error enhancing place ${placeId}: ${error.message}`);
    return null;
  }
}

/**
 * Main migration function
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'enhance';

  console.log('\n=== Norse Mythology Migration v2.0 ===\n');
  console.log(`Mode: ${mode}\n`);

  // Get all existing Norse deities
  const deityDir = path.join(NEW_REPO, 'deity');
  const deityFiles = fs.readdirSync(deityDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  const norseDeities = deityFiles.filter(id => {
    const content = fs.readFileSync(path.join(deityDir, `${id}.json`), 'utf-8');
    return content.includes('"norse"');
  });

  console.log(`Found ${norseDeities.length} Norse deities to enhance:\n`);

  stats.deities.total = norseDeities.length;

  // Enhance each deity
  norseDeities.forEach(deityId => {
    console.log(`Processing: ${deityId}`);
    const enhanced = enhanceNorseDeity(deityId);

    if (enhanced) {
      // Save enhanced version
      const outputPath = path.join(NEW_REPO, 'deity', `${deityId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));
      console.log(`  ✓ Enhanced (${enhanced.metadata.completeness}% complete)`);
    } else {
      console.log(`  ✗ Failed to enhance`);
    }
  });

  // Get all existing Norse places
  const placeDir = path.join(NEW_REPO, 'place');
  const placeFiles = fs.readdirSync(placeDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  const norsePlaces = placeFiles.filter(id => {
    const content = fs.readFileSync(path.join(placeDir, `${id}.json`), 'utf-8');
    return content.includes('"norse"');
  });

  console.log(`\nFound ${norsePlaces.length} Norse places to enhance:\n`);

  stats.places.total = norsePlaces.length;

  // Enhance each place
  norsePlaces.forEach(placeId => {
    console.log(`Processing: ${placeId}`);
    const enhanced = enhanceNorsePlace(placeId);

    if (enhanced) {
      // Save enhanced version
      const outputPath = path.join(NEW_REPO, 'place', `${placeId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));
      console.log(`  ✓ Enhanced (${enhanced.metadata.completeness}% complete)`);
    } else {
      console.log(`  ✗ Failed to enhance`);
    }
  });

  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Deities: ${stats.deities.enhanced}/${stats.deities.total} enhanced`);
  console.log(`Places: ${stats.places.enhanced}/${stats.places.total} enhanced`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(err => console.log(`  - ${err}`));
  }

  // Save report
  const reportPath = path.join(__dirname, '../NORSE_MIGRATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: stats,
    mode: mode
  }, null, 2));

  console.log(`\nReport saved: ${reportPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { enhanceNorseDeity, enhanceNorsePlace, OLD_NORSE_DATA, SCANDINAVIAN_LOCATIONS };

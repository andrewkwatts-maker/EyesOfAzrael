/**
 * Migrate Egyptian Entities to v2.0 Schema
 * Converts old format to new entity-schema-v2.0 format
 */

const fs = require('fs');
const path = require('path');

const DEITY_DIR = path.join(__dirname, '../data/entities/deity');
const EGYPTIAN_DEITIES = [
  'amun-ra', 'anhur', 'anubis', 'apep', 'atum', 'bastet', 'geb', 'hathor',
  'horus', 'imhotep', 'isis', 'maat', 'montu', 'neith', 'nephthys', 'nut',
  'osiris', 'ptah', 'ra', 'satis', 'sekhmet', 'set', 'sobek', 'tefnut', 'thoth'
];

// Hieroglyphic data for major Egyptian deities
const HIEROGLYPHIC_DATA = {
  'ra': {
    originalName: '𓁛𓏺',
    transliteration: 'rꜥ',
    pronunciation: '/ɾaʕ/',
    meaning: 'sun'
  },
  'isis': {
    originalName: '𓊨𓁐',
    transliteration: 'ꜣst',
    pronunciation: '/ˈaːsit/',
    meaning: 'throne'
  },
  'osiris': {
    originalName: '𓊨𓁹𓁛',
    transliteration: 'wsjr',
    pronunciation: '/wəˈsiːrə/',
    meaning: 'mighty one'
  },
  'anubis': {
    originalName: '𓇋𓈖𓊪𓅱',
    transliteration: 'jnpw',
    pronunciation: '/ɪnˈpuː/',
    meaning: 'royal child'
  },
  'horus': {
    originalName: '𓅃𓏺',
    transliteration: 'ḥrw',
    pronunciation: '/ˈħaːɾuw/',
    meaning: 'the distant one'
  },
  'thoth': {
    originalName: '𓅤𓅿',
    transliteration: 'ḏḥwty',
    pronunciation: '/dʒeħuːtiː/',
    meaning: 'he who is like the ibis'
  },
  'set': {
    originalName: '𓃩',
    transliteration: 'stẖ',
    pronunciation: '/ˈsuːtəx/',
    meaning: 'one who dazzles'
  },
  'hathor': {
    originalName: '𓉡𓏏𓁐',
    transliteration: 'ḥwt-ḥr',
    pronunciation: '/ˈħatħar/',
    meaning: 'house of Horus'
  },
  'bastet': {
    originalName: '𓎟𓏏𓁐',
    transliteration: 'bꜣstt',
    pronunciation: '/ˈbaːstet/',
    meaning: 'she of the ointment jar'
  },
  'ptah': {
    originalName: '𓁛𓏏𓁧',
    transliteration: 'ptḥ',
    pronunciation: '/pəˈtaħ/',
    meaning: 'opener'
  },
  'maat': {
    originalName: '𓁦𓏏',
    transliteration: 'mꜣꜥt',
    pronunciation: '/ˈmaʕat/',
    meaning: 'truth, order'
  },
  'amun-ra': {
    originalName: '𓇋𓏠𓈖𓁛𓏺',
    transliteration: 'jmn-rꜥ',
    pronunciation: '/ʔaˈmaːn ɾaʕ/',
    meaning: 'hidden one - sun'
  },
  'sekhmet': {
    originalName: '𓌂𓏏𓁐',
    transliteration: 'sḫmt',
    pronunciation: '/ˈsexmet/',
    meaning: 'the powerful one'
  },
  'nephthys': {
    originalName: '𓎞𓏏𓁐',
    transliteration: 'nbt-ḥwt',
    pronunciation: '/nebˈteħwet/',
    meaning: 'lady of the house'
  },
  'geb': {
    originalName: '𓎿𓂋𓃀',
    transliteration: 'gb',
    pronunciation: '/ɡeːb/',
    meaning: 'earth'
  },
  'nut': {
    originalName: '𓊖𓏏𓏺',
    transliteration: 'nwt',
    pronunciation: '/nuːt/',
    meaning: 'sky'
  },
  'tefnut': {
    originalName: '𓏏𓆑𓈖𓏏',
    transliteration: 'tfnt',
    pronunciation: '/tefˈnuːt/',
    meaning: 'moisture'
  },
  'atum': {
    originalName: '𓄤𓏏𓐀',
    transliteration: 'jtm',
    pronunciation: '/ʔaˈtuːm/',
    meaning: 'the complete one'
  },
  'sobek': {
    originalName: '𓏴𓃀𓎡',
    transliteration: 'sbk',
    pronunciation: '/ˈsoːbek/',
    meaning: 'crocodile god'
  },
  'neith': {
    originalName: '𓈖𓏏',
    transliteration: 'nt',
    pronunciation: '/neːθ/',
    meaning: 'the terrifying one'
  },
  'montu': {
    originalName: '𓏠𓈖𓏏𓅱',
    transliteration: 'mntw',
    pronunciation: '/ˈmɔntu/',
    meaning: 'nomad'
  },
  'anhur': {
    originalName: '𓇋𓈖𓎛𓅱𓂋',
    transliteration: 'jn-ḥr.t',
    pronunciation: '/ʔanˈħuːr/',
    meaning: 'he who leads back the distant one'
  },
  'imhotep': {
    originalName: '𓂝𓁷𓀁',
    transliteration: 'jj-m-ḥtp',
    pronunciation: '/ɪjɪmˈħoːtəp/',
    meaning: 'he who comes in peace'
  },
  'apep': {
    originalName: '𓆙',
    transliteration: 'ꜥpp',
    pronunciation: '/ˈʕapap/',
    meaning: 'serpent'
  },
  'satis': {
    originalName: '𓎼𓏏𓁐',
    transliteration: 'sṯt',
    pronunciation: '/ˈsaːtet/',
    meaning: 'she who shoots forth'
  }
};

// Temple locations for major deities
const TEMPLE_LOCATIONS = {
  'ra': { name: 'Heliopolis', lat: 30.1213, lon: 31.3037, modernName: 'Cairo, Egypt' },
  'isis': { name: 'Philae', lat: 24.0236, lon: 32.8842, modernName: 'Aswan, Egypt' },
  'osiris': { name: 'Abydos', lat: 26.1843, lon: 31.9205, modernName: 'Abydos, Egypt' },
  'anubis': { name: 'Cynopolis', lat: 27.8042, lon: 30.8422, modernName: 'el-Kes, Egypt' },
  'horus': { name: 'Edfu', lat: 24.9778, lon: 32.8742, modernName: 'Edfu, Egypt' },
  'thoth': { name: 'Hermopolis', lat: 27.7911, lon: 30.8081, modernName: 'el-Ashmunein, Egypt' },
  'hathor': { name: 'Dendera', lat: 26.1417, lon: 32.6708, modernName: 'Dendera, Egypt' },
  'ptah': { name: 'Memphis', lat: 29.8467, lon: 31.2539, modernName: 'Mit Rahina, Egypt' },
  'bastet': { name: 'Bubastis', lat: 30.5772, lon: 31.5117, modernName: 'Zagazig, Egypt' },
  'amun-ra': { name: 'Karnak', lat: 25.7188, lon: 32.6573, modernName: 'Luxor, Egypt' },
  'sekhmet': { name: 'Memphis', lat: 29.8467, lon: 31.2539, modernName: 'Mit Rahina, Egypt' },
  'sobek': { name: 'Kom Ombo', lat: 24.4511, lon: 32.9277, modernName: 'Kom Ombo, Egypt' },
  'neith': { name: 'Sais', lat: 30.9700, lon: 30.8500, modernName: 'Sa el-Hagar, Egypt' }
};

function migrateDeity(id) {
  const oldPath = path.join(DEITY_DIR, `${id}.json`);

  if (!fs.existsSync(oldPath)) {
    console.log(`⚠️  ${id}.json not found, skipping`);
    return null;
  }

  const oldData = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));

  // Extract colors from attributes
  let primaryColor = '#D4AF37'; // Default gold
  let secondaryColor = '#8B4513'; // Default brown

  if (oldData.attributes?.colors) {
    const colors = oldData.attributes.colors;
    if (colors.includes('Gold') || colors.includes('gold')) primaryColor = '#FFD700';
    if (colors.includes('Blue') || colors.includes('blue')) primaryColor = '#4169E1';
    if (colors.includes('Red') || colors.includes('red')) primaryColor = '#DC143C';
    if (colors.includes('Green') || colors.includes('green')) primaryColor = '#228B22';
    if (colors.includes('Black') || colors.includes('black')) primaryColor = '#000000';
    if (colors.includes('White') || colors.includes('white')) primaryColor = '#FFFFFF';
  }

  // Extract mythology text
  let mythologyText = '';
  if (oldData.richContent?.panels) {
    const mythPanel = oldData.richContent.panels.find(p => p.title === 'Mythology & Stories');
    if (mythPanel) {
      mythologyText = mythPanel.content;
    }
  }

  // Build new v2.0 entity
  const newEntity = {
    id: oldData.id,
    type: 'deity',
    name: oldData.displayName,
    icon: oldData.icon || '👤',
    mythologies: ['egyptian'],
    primaryMythology: 'egyptian',
    shortDescription: oldData.subtitle || oldData.summary?.substring(0, 200) || '',
    longDescription: oldData.summary + '\n\n' + mythologyText,
    tags: Array.from(new Set([
      id,
      'egyptian',
      'deity',
      ...(oldData.attributes?.domains || []).map(d => d.toLowerCase().replace(/\s+/g, '-'))
    ])),
    colors: {
      primary: primaryColor,
      secondary: secondaryColor
    }
  };

  // Add linguistic data if available
  if (HIEROGLYPHIC_DATA[id]) {
    const hierData = HIEROGLYPHIC_DATA[id];
    newEntity.linguistic = {
      originalName: hierData.originalName,
      originalScript: 'hieroglyphic',
      transliteration: hierData.transliteration,
      pronunciation: hierData.pronunciation,
      etymology: {
        rootLanguage: 'Ancient Egyptian',
        meaning: hierData.meaning,
        derivation: `Middle Egyptian hieroglyphic: ${hierData.transliteration}`
      },
      languageCode: 'egy'
    };
  }

  // Add geographical data if available
  if (TEMPLE_LOCATIONS[id]) {
    const temple = TEMPLE_LOCATIONS[id];
    newEntity.geographical = {
      primaryLocation: {
        name: temple.name,
        coordinates: {
          latitude: temple.lat,
          longitude: temple.lon,
          accuracy: 'exact'
        },
        modernName: temple.modernName,
        type: 'temple',
        significance: `Primary cult center of ${newEntity.name}`
      },
      region: 'Nile Valley',
      culturalArea: 'Ancient Egypt',
      modernCountries: ['Egypt']
    };
  }

  // Add temporal data
  newEntity.temporal = {
    historicalDate: {
      start: { year: -3000, circa: true, display: 'c. 3000 BCE' },
      end: { year: 400, circa: true, display: 'c. 400 CE' },
      display: 'c. 3000 BCE - 400 CE'
    },
    culturalPeriod: 'Ancient Egyptian civilization'
  };

  // Add sources
  newEntity.sources = [
    {
      title: 'Pyramid Texts',
      type: 'primary',
      relevance: 'comprehensive',
      date: { year: -2400, circa: true, display: 'c. 2400 BCE' }
    },
    {
      title: 'Coffin Texts',
      type: 'primary',
      relevance: 'comprehensive',
      date: { year: -2000, circa: true, display: 'c. 2000 BCE' }
    },
    {
      title: 'Book of the Dead',
      type: 'primary',
      relevance: 'comprehensive',
      date: { year: -1550, circa: true, display: 'c. 1550 BCE' }
    }
  ];

  // Add metadata
  newEntity.metadata = {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '2.0',
    completeness: 'enhanced'
  };

  return newEntity;
}

function main() {
  console.log('\n=== Migrating Egyptian Deities to v2.0 Schema ===\n');

  let migrated = 0;
  let failed = 0;

  EGYPTIAN_DEITIES.forEach(id => {
    try {
      const newEntity = migrateDeity(id);
      if (newEntity) {
        const outputPath = path.join(DEITY_DIR, `${id}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(newEntity, null, 2));
        console.log(`✅ Migrated ${id}`);
        migrated++;
      }
    } catch (error) {
      console.error(`❌ Failed to migrate ${id}:`, error.message);
      failed++;
    }
  });

  console.log(`\n=== Migration Summary ===`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${EGYPTIAN_DEITIES.length}`);
}

main();

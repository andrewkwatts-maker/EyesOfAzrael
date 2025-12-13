/**
 * Comprehensive Egyptian Mythology Migration Script
 * Migrates all Egyptian content from old repo to v2.0 schema
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ENTITIES_DIR = path.join(__dirname, '../data/entities');
const OLD_REPO = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\egyptian';

// Hierarchic data for all entities
const HIEROGLYPHIC_DATA = {
  'maat': {
    originalName: '𓁦𓏏',
    transliteration: 'mꜣꜥt',
    pronunciation: '/ˈmaʕat/',
    meaning: 'truth, order, justice'
  },
  'nun': {
    originalName: '𓈖𓈖𓈖',
    transliteration: 'nwn',
    pronunciation: '/nuːn/',
    meaning: 'primordial waters'
  },
  'duat': {
    originalName: '𓇼𓄿𓏏',
    transliteration: 'dwꜣt',
    pronunciation: '/dwaːt/',
    meaning: 'underworld, netherworld'
  },
  'sphinx': {
    originalName: '𓎛𓅱𓃭',
    transliteration: 'šsp-ꜥnḫ',
    pronunciation: '/ʃəspˈʕanx/',
    meaning: 'living image'
  },
  'nile': {
    originalName: '𓇋𓏏𓂋𓅱',
    transliteration: 'ḥꜥpy',
    pronunciation: '/ħaːpɪ/',
    meaning: 'the river'
  },
  'lotus': {
    originalName: '𓆸',
    transliteration: 'sšn',
    pronunciation: '/ˈseʃen/',
    meaning: 'lotus flower'
  }
};

// Entity definitions
const ENTITIES = {
  concepts: [
    {
      id: 'maat',
      name: 'Ma\'at',
      summary: 'Ancient Egyptian concept of truth, balance, order, harmony, law, morality, and justice',
      icon: '⚖️',
      color: '#4169E1'
    },
    {
      id: 'nun',
      name: 'Nun',
      summary: 'The primordial waters of chaos from which all creation emerged',
      icon: '🌊',
      color: '#000080'
    },
    {
      id: 'duat',
      name: 'Duat',
      summary: 'The Egyptian underworld realm of the dead, traversed by Ra each night',
      icon: '🌑',
      color: '#1A1A2E'
    },
    {
      id: 'ennead',
      name: 'The Ennead',
      summary: 'The nine great gods of Heliopolis: Atum, Shu, Tefnut, Geb, Nut, Osiris, Isis, Set, and Nephthys',
      icon: '9️⃣',
      color: '#CD853F'
    },
    {
      id: 'afterlife',
      name: 'Egyptian Afterlife',
      summary: 'Complex Egyptian beliefs about death, judgment, and eternal existence in the Field of Reeds',
      icon: '☥',
      color: '#DAA520'
    },
    {
      id: 'creation',
      name: 'Egyptian Creation',
      summary: 'Multiple Egyptian creation myths describing the emergence of gods and cosmos from primordial chaos',
      icon: '🌅',
      color: '#FF6347'
    }
  ],
  places: [
    {
      id: 'nile',
      name: 'The Nile',
      summary: 'Sacred river of Egypt, source of life, fertility, and the annual inundation',
      icon: '🏞️',
      color: '#4682B4',
      lat: 26.8206,
      lon: 30.8025
    }
  ],
  creatures: [
    {
      id: 'sphinx',
      name: 'The Sphinx',
      summary: 'Mythical creature with a lion\'s body and human head, guardian of sacred sites and keeper of riddles',
      icon: '🦁',
      color: '#D2691E'
    }
  ],
  magic: [
    {
      id: 'mummification',
      name: 'Mummification',
      summary: 'Sacred Egyptian funerary practice of preserving the body for the afterlife through embalming and wrapping',
      icon: '🏺',
      color: '#8B4513'
    },
    {
      id: 'opet-festival',
      name: 'Opet Festival',
      summary: 'Annual Egyptian festival celebrating the rejuvenation of kingship and the flooding of the Nile',
      icon: '🎊',
      color: '#FFD700'
    }
  ],
  items: [
    {
      id: 'lotus',
      name: 'Sacred Lotus',
      summary: 'The blue lotus (Nymphaea caerulea), symbol of rebirth, the sun, and creation in Egyptian mythology',
      icon: '🪷',
      color: '#4169E1'
    }
  ]
};

function readOldHtmlContent(filepath) {
  try {
    if (!fs.existsSync(filepath)) {
      return { title: '', content: '', sections: [] };
    }

    const html = fs.readFileSync(filepath, 'utf-8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract title
    const title = doc.querySelector('h1')?.textContent.trim() || '';

    // Extract all paragraphs and sections
    const sections = [];
    const sectionElements = doc.querySelectorAll('section');

    sectionElements.forEach(section => {
      const h2 = section.querySelector('h2');
      const sectionTitle = h2?.textContent.trim() || '';
      const paragraphs = Array.from(section.querySelectorAll('p')).map(p => p.textContent.trim());
      const lists = Array.from(section.querySelectorAll('ul li')).map(li => li.textContent.trim());

      sections.push({
        title: sectionTitle,
        paragraphs: paragraphs.join('\n\n'),
        lists: lists
      });
    });

    return { title, sections };
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error.message);
    return { title: '', sections: [] };
  }
}

function createEntity(type, entityDef) {
  const entity = {
    id: entityDef.id,
    type: type,
    name: entityDef.name,
    icon: entityDef.icon,
    mythologies: ['egyptian'],
    primaryMythology: 'egyptian',
    shortDescription: entityDef.summary,
    longDescription: '',
    tags: [
      entityDef.id,
      'egyptian',
      type,
      ...entityDef.name.toLowerCase().split(' ').map(w => w.replace(/'/g, ''))
    ],
    colors: {
      primary: entityDef.color,
      secondary: '#8B4513'
    },
    sources: [
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
    ],
    relatedEntities: {},
    temporal: {
      historicalDate: {
        start: { year: -3000, circa: true, display: 'c. 3000 BCE' },
        end: { year: 400, circa: true, display: 'c. 400 CE' },
        display: 'c. 3000 BCE - 400 CE'
      },
      culturalPeriod: 'Ancient Egyptian civilization'
    },
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '2.0',
      completeness: 'enhanced'
    },
    category: type,
    mythology: 'egyptian',
    displayName: entityDef.name,
    searchTerms: [entityDef.id, 'egyptian', entityDef.name.toLowerCase()],
    visibility: 'public',
    status: 'published',
    contributors: []
  };

  // Add linguistic data if available
  if (HIEROGLYPHIC_DATA[entityDef.id]) {
    const hierData = HIEROGLYPHIC_DATA[entityDef.id];
    entity.linguistic = {
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

  // Add geographical data for places
  if (type === 'place' && entityDef.lat) {
    entity.geographical = {
      primaryLocation: {
        name: entityDef.name,
        coordinates: {
          latitude: entityDef.lat,
          longitude: entityDef.lon,
          accuracy: 'exact'
        },
        type: 'river',
        significance: `Sacred ${entityDef.name}`,
        modernName: entityDef.name
      },
      region: 'Nile Valley',
      culturalArea: 'Ancient Egypt',
      modernCountries: ['Egypt']
    };
  }

  return entity;
}

function migrateEntities() {
  console.log('\n=== Migrating All Egyptian Entities ===\n');

  let totalMigrated = 0;
  let totalFailed = 0;

  // Migrate each entity type
  for (const [type, entities] of Object.entries(ENTITIES)) {
    console.log(`\n--- Migrating ${type} ---`);

    entities.forEach(entityDef => {
      try {
        // Create entity
        const entity = createEntity(type.slice(0, -1), entityDef); // Remove plural 's'

        // Try to read old HTML content
        const oldPath = path.join(OLD_REPO, type, `${entityDef.id}.html`);
        const oldContent = readOldHtmlContent(oldPath);

        if (oldContent.sections.length > 0) {
          // Build full description from sections
          entity.longDescription = oldContent.sections.map(section => {
            let text = `## ${section.title}\n\n${section.paragraphs}`;
            if (section.lists.length > 0) {
              text += '\n\n' + section.lists.map(item => `- ${item}`).join('\n');
            }
            return text;
          }).join('\n\n');
        }

        // Save entity
        const typeDir = path.join(ENTITIES_DIR, type.slice(0, -1));
        if (!fs.existsSync(typeDir)) {
          fs.mkdirSync(typeDir, { recursive: true });
        }

        const outputPath = path.join(typeDir, `${entityDef.id}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(entity, null, 2));

        console.log(`✅ ${entityDef.id}`);
        totalMigrated++;
      } catch (error) {
        console.error(`❌ ${entityDef.id}: ${error.message}`);
        totalFailed++;
      }
    });
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Total migrated: ${totalMigrated}`);
  console.log(`Total failed: ${totalFailed}`);
}

// Check if jsdom is available
try {
  require.resolve('jsdom');
  migrateEntities();
} catch {
  console.log('Warning: jsdom not available, using simplified migration');

  // Simplified migration without HTML parsing
  let totalMigrated = 0;

  for (const [type, entities] of Object.entries(ENTITIES)) {
    console.log(`\n--- Migrating ${type} ---`);

    entities.forEach(entityDef => {
      try {
        const entity = createEntity(type.slice(0, -1), entityDef);

        const typeDir = path.join(ENTITIES_DIR, type.slice(0, -1));
        if (!fs.existsSync(typeDir)) {
          fs.mkdirSync(typeDir, { recursive: true });
        }

        const outputPath = path.join(typeDir, `${entityDef.id}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(entity, null, 2));

        console.log(`✅ ${entityDef.id}`);
        totalMigrated++;
      } catch (error) {
        console.error(`❌ ${entityDef.id}: ${error.message}`);
      }
    });
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Total migrated: ${totalMigrated}`);
}

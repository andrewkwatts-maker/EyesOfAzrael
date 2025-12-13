/**
 * Hindu Entity Migration Script
 * Migrates all Hindu mythology content from old HTML/JSON to entity-schema-v2.0
 *
 * Usage:
 *   node scripts/migrate-hindu-entities.js --type deities
 *   node scripts/migrate-hindu-entities.js --type all
 *   node scripts/migrate-hindu-entities.js --validate
 */

const fs = require('fs');
const path = require('path');

// Deity data mappings from old HTML files
const HINDU_DEITIES = {
  vishnu: {
    icon: '🦚',
    shortDescription: 'The Preserver of the Trimurti, sustainer who maintains cosmic order and descends in avatars to protect dharma',
    devanagari: 'विष्णु',
    transliteration: 'Viṣṇu',
    pronunciation: '/ʋɪʂɳʊ/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'All-pervading', derivation: 'From viṣ (to pervade, enter)' },
    alternativeNames: ['Narayana', 'Hari', 'Madhava', 'Vasudeva'],
    chakras: ['anahata', 'vishuddha'],
    element: 'water',
    planet: 'Jupiter',
    colors: { primary: '#4169E1', secondary: '#FFD700', accent: '#87CEEB' }
  },
  ganesha: {
    icon: '🐘',
    shortDescription: 'Elephant-headed remover of obstacles, lord of beginnings, wisdom, and success',
    devanagari: 'गणेश',
    transliteration: 'Gaṇeśa',
    pronunciation: '/gəɳeːɕə/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Lord of the multitudes', derivation: 'From gaṇa (group) + īśa (lord)' },
    alternativeNames: ['Ganapati', 'Vighneshvara', 'Ekadanta', 'Lambodara'],
    chakras: ['muladhara', 'svadhisthana'],
    element: 'earth',
    planet: 'Mercury',
    colors: { primary: '#FF6B35', secondary: '#F7C745', accent: '#8B4513' }
  },
  durga: {
    icon: '⚔️',
    shortDescription: 'Fierce warrior goddess who defeats demons, embodiment of divine feminine power (Shakti)',
    devanagari: 'दुर्गा',
    transliteration: 'Durgā',
    pronunciation: '/d̪ʊrgaː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Invincible', derivation: 'From durga (fort, difficult to access)' },
    alternativeNames: ['Mahishasuramardini', 'Bhavani', 'Chandika', 'Ambika'],
    chakras: ['manipura', 'anahata'],
    element: 'fire',
    planet: 'Mars',
    colors: { primary: '#DC143C', secondary: '#FFD700', accent: '#FF69B4' }
  },
  kali: {
    icon: '🗡️',
    shortDescription: 'Dark goddess of time, death, and transformation; fierce form of Parvati who destroys evil',
    devanagari: 'काली',
    transliteration: 'Kālī',
    pronunciation: '/kaːliː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'The black one, time', derivation: 'Feminine form of kāla (time, black)' },
    alternativeNames: ['Mahakali', 'Bhadrakali', 'Kalika', 'Shyama'],
    chakras: ['muladhara', 'ajna'],
    element: 'aether',
    planet: 'Saturn',
    colors: { primary: '#000000', secondary: '#DC143C', accent: '#FFD700' }
  },
  lakshmi: {
    icon: '🪷',
    shortDescription: 'Goddess of wealth, prosperity, fortune, and beauty; consort of Vishnu',
    devanagari: 'लक्ष्मी',
    transliteration: 'Lakṣmī',
    pronunciation: '/ləkʂmiː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Goal, aim, fortune', derivation: 'From lakṣya (goal, target)' },
    alternativeNames: ['Sri', 'Padma', 'Kamala', 'Ramaa'],
    chakras: ['svadhisthana', 'anahata'],
    element: 'water',
    planet: 'Venus',
    colors: { primary: '#FFD700', secondary: '#FF69B4', accent: '#FF6347' }
  },
  saraswati: {
    icon: '🎼',
    shortDescription: 'Goddess of knowledge, music, arts, wisdom, and learning; consort of Brahma',
    devanagari: 'सरस्वती',
    transliteration: 'Sarasvatī',
    pronunciation: '/səɾəsʋət̪iː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Flowing water, eloquent', derivation: 'From saras (flowing water)' },
    alternativeNames: ['Vak', 'Vagdevi', 'Bharati', 'Sharada'],
    chakras: ['vishuddha', 'ajna'],
    element: 'air',
    planet: 'Mercury',
    colors: { primary: '#FFFFFF', secondary: '#FFD700', accent: '#87CEEB' }
  },
  parvati: {
    icon: '🌺',
    shortDescription: 'Divine mother goddess, consort of Shiva, embodiment of love, fertility, and devotion',
    devanagari: 'पार्वती',
    transliteration: 'Pārvatī',
    pronunciation: '/paːɾʋət̪iː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Daughter of the mountain', derivation: 'From parvata (mountain)' },
    alternativeNames: ['Uma', 'Gauri', 'Shakti', 'Aparna'],
    chakras: ['svadhisthana', 'anahata', 'ajna'],
    element: 'earth',
    planet: 'Moon',
    colors: { primary: '#FF69B4', secondary: '#32CD32', accent: '#FFD700' }
  },
  hanuman: {
    icon: '🐒',
    shortDescription: 'Monkey god of strength, devotion, and selfless service; devoted servant of Rama',
    devanagari: 'हनुमान',
    transliteration: 'Hanumān',
    pronunciation: '/hənʊmaːn/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Having a (disfigured) jaw', derivation: 'From hanu (jaw)' },
    alternativeNames: ['Anjaneya', 'Maruti', 'Bajrangbali', 'Pavanputra'],
    chakras: ['manipura', 'anahata'],
    element: 'air',
    planet: 'Sun',
    colors: { primary: '#FF6347', secondary: '#FFD700', accent: '#8B4513' }
  },
  indra: {
    icon: '⚡',
    shortDescription: 'King of the gods, lord of heaven (Svarga), god of rain, thunderstorms, and war',
    devanagari: 'इन्द्र',
    transliteration: 'Indra',
    pronunciation: '/ɪnd̪ɾə/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Possessor of drops of rain', derivation: 'From indu (raindrop)' },
    alternativeNames: ['Shakra', 'Devendra', 'Surendra', 'Meghavahana'],
    chakras: ['manipura', 'vishuddha'],
    element: 'air',
    planet: 'Jupiter',
    colors: { primary: '#4169E1', secondary: '#FFD700', accent: '#FFFFFF' }
  },
  yama: {
    icon: '⚰️',
    shortDescription: 'God of death and justice, lord of dharma who judges souls in the afterlife',
    devanagari: 'यम',
    transliteration: 'Yama',
    pronunciation: '/jəmə/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Twin, restrainer', derivation: 'From yam (to restrain, control)' },
    alternativeNames: ['Yamaraja', 'Dharmaraja', 'Kala', 'Antaka'],
    chakras: ['muladhara'],
    element: 'earth',
    planet: 'Saturn',
    colors: { primary: '#000000', secondary: '#8B0000', accent: '#696969' }
  },
  kartikeya: {
    icon: '🦚',
    shortDescription: 'God of war and victory, commander of the divine armies, son of Shiva and Parvati',
    devanagari: 'कार्तिकेय',
    transliteration: 'Kārtikeya',
    pronunciation: '/kaːɾt̪ɪkeːjə/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Son of the Krittikas', derivation: 'From Krittika (Pleiades constellation)' },
    alternativeNames: ['Skanda', 'Murugan', 'Subrahmanya', 'Kumara'],
    chakras: ['manipura', 'ajna'],
    element: 'fire',
    planet: 'Mars',
    colors: { primary: '#FF4500', secondary: '#32CD32', accent: '#FFD700' }
  },
  dhanvantari: {
    icon: '⚕️',
    shortDescription: 'God of Ayurveda and medicine, physician of the gods who emerged during cosmic churning',
    devanagari: 'धन्वन्तरि',
    transliteration: 'Dhanvantari',
    pronunciation: '/d̪ʰənʋən̪t̪əɾɪ/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Moving in a curve (healing)', derivation: 'From dhanus (bow, arc)' },
    alternativeNames: ['Sudhapani', 'Amritacharya'],
    chakras: ['anahata'],
    element: 'water',
    planet: 'Sun',
    colors: { primary: '#32CD32', secondary: '#FFD700', accent: '#4169E1' }
  },
  dyaus: {
    icon: '☀️',
    shortDescription: 'Ancient Vedic sky father god, consort of Prithvi (Earth), father of many deities',
    devanagari: 'द्यौस',
    transliteration: 'Dyaus',
    pronunciation: '/d̪jaʊs/',
    etymology: { rootLanguage: 'Proto-Indo-European', meaning: 'Sky, heaven', derivation: 'From *dyḗws (sky father)' },
    alternativeNames: ['Dyaus Pita'],
    chakras: ['sahasrara'],
    element: 'air',
    planet: 'Sun',
    colors: { primary: '#87CEEB', secondary: '#FFD700', accent: '#FFFFFF' }
  },
  prithvi: {
    icon: '🌍',
    shortDescription: 'Earth mother goddess, consort of Dyaus, personification of the earth',
    devanagari: 'पृथ्वी',
    transliteration: 'Pṛthvī',
    pronunciation: '/pɾɪt̪ʰʋiː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Broad, wide earth', derivation: 'From pṛthu (broad, wide)' },
    alternativeNames: ['Bhumi', 'Dharti', 'Vasundhara'],
    chakras: ['muladhara'],
    element: 'earth',
    planet: 'Earth',
    colors: { primary: '#2E8B57', secondary: '#8B4513', accent: '#32CD32' }
  },
  rati: {
    icon: '💘',
    shortDescription: 'Goddess of love, passion, and desire; consort of Kamadeva',
    devanagari: 'रति',
    transliteration: 'Rati',
    pronunciation: '/ɾət̪ɪ/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Pleasure, delight, passion', derivation: 'From ram (to delight in)' },
    alternativeNames: ['Revati', 'Kamadevi', 'Mayavati'],
    chakras: ['svadhisthana'],
    element: 'water',
    planet: 'Venus',
    colors: { primary: '#FF1493', secondary: '#FFB6C1', accent: '#FFD700' }
  },
  vritra: {
    icon: '🐉',
    shortDescription: 'Vedic serpent/dragon demon who hoarded waters, slain by Indra',
    devanagari: 'वृत्र',
    transliteration: 'Vṛtra',
    pronunciation: '/ʋɾɪt̪ɾə/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Obstacle, obstructor', derivation: 'From vṛ (to cover, obstruct)' },
    alternativeNames: ['Ahi Vritra'],
    chakras: ['muladhara'],
    element: 'water',
    planet: 'Saturn',
    colors: { primary: '#2F4F4F', secondary: '#000000', accent: '#4682B4' }
  },
  yami: {
    icon: '🌙',
    shortDescription: 'Twin sister of Yama, goddess associated with the underworld',
    devanagari: 'यमी',
    transliteration: 'Yamī',
    pronunciation: '/jəmiː/',
    etymology: { rootLanguage: 'Sanskrit', meaning: 'Twin (feminine)', derivation: 'Feminine form of yama (twin)' },
    alternativeNames: ['Yamuna'],
    chakras: ['svadhisthana'],
    element: 'water',
    planet: 'Moon',
    colors: { primary: '#4682B4', secondary: '#000000', accent: '#C0C0C0' }
  }
};

// Hero data
const HINDU_HEROES = {
  krishna: {
    icon: '🪈',
    shortDescription: 'Divine prince and eighth avatar of Vishnu, teacher of the Bhagavad Gita',
    devanagari: 'कृष्ण',
    transliteration: 'Kṛṣṇa',
    colors: { primary: '#000080', secondary: '#FFD700', accent: '#FF6347' }
  },
  rama: {
    icon: '🏹',
    shortDescription: 'Perfect king and seventh avatar of Vishnu, hero of the Ramayana',
    devanagari: 'राम',
    transliteration: 'Rāma',
    colors: { primary: '#228B22', secondary: '#FFD700', accent: '#4169E1' }
  }
};

const OLD_REPO = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael';
const NEW_REPO = 'H:\\Github\\EyesOfAzrael';

/**
 * Generate full deity entity from template data
 */
function generateDeityEntity(id, data) {
  const now = new Date().toISOString();

  return {
    id: id,
    type: 'deity',
    name: capitalize(id),
    mythologies: ['hindu'],
    primaryMythology: 'hindu',
    icon: data.icon,
    shortDescription: data.shortDescription,
    fullDescription: '', // To be filled from HTML parsing
    tags: [id, 'hindu', 'deity'],
    colors: data.colors,
    linguistic: {
      originalName: data.devanagari,
      originalScript: 'devanagari',
      transliteration: data.transliteration,
      pronunciation: data.pronunciation,
      alternativeNames: (data.alternativeNames || []).map(name => ({
        name: name,
        language: 'Sanskrit',
        context: ''
      })),
      etymology: data.etymology,
      languageCode: 'sa'
    },
    geographical: {
      primaryLocation: {
        name: 'Indian Subcontinent',
        coordinates: {
          latitude: 25.3176,
          longitude: 82.9739,
          accuracy: 'approximate'
        },
        type: 'region'
      },
      region: 'Indian Subcontinent',
      culturalArea: 'Vedic India',
      modernCountries: ['India', 'Nepal', 'Sri Lanka', 'Bangladesh']
    },
    temporal: {
      mythologicalDate: {
        display: 'Timeless - exists in all cosmic cycles'
      },
      historicalDate: {
        start: { year: -1500, circa: true, display: 'c. 1500 BCE' },
        end: { year: 2025, display: 'Present' },
        display: 'c. 1500 BCE - Present'
      },
      firstAttestation: {
        date: { year: -1200, circa: true, uncertainty: 200, display: 'c. 1200 BCE' },
        source: 'Vedic texts',
        type: 'literary',
        confidence: 'probable'
      },
      culturalPeriod: 'Vedic Period onwards'
    },
    cultural: {
      worshipPractices: [],
      festivals: [],
      socialRole: '',
      demographicAppeal: []
    },
    metaphysicalProperties: {
      primaryElement: data.element,
      planets: [data.planet],
      chakras: data.chakras,
      yinYang: 'balanced',
      polarity: 'positive'
    },
    relatedEntities: {
      deities: [],
      items: [],
      places: [],
      concepts: []
    },
    archetypes: [],
    sources: [
      {
        title: 'Rigveda',
        author: 'Various rishis',
        type: 'primary',
        relevance: 'significant'
      }
    ],
    category: 'deity',
    mythology: 'hindu',
    displayName: capitalize(id),
    searchTerms: [id, 'hindu', data.devanagari, ...( data.alternativeNames || [])],
    visibility: 'public',
    status: 'draft',
    contributors: ['Claude'],
    metadata: {
      created: now,
      lastModified: now,
      version: '2.0',
      completeness: 'partial',
      schemaVersion: '2.0.0'
    }
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Main migration function
 */
function migrateDeities() {
  console.log('=== Hindu Deity Migration ===\n');

  const outputDir = path.join(NEW_REPO, 'data', 'entities', 'deity');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const [id, data] of Object.entries(HINDU_DEITIES)) {
    const outputPath = path.join(outputDir, `${id}.json`);

    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${id} (already exists)`);
      skipped++;
      continue;
    }

    const entity = generateDeityEntity(id, data);
    fs.writeFileSync(outputPath, JSON.stringify(entity, null, 2));
    console.log(`✅ Created ${id}.json`);
    created++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${created + skipped}`);
}

/**
 * Validate all created entities
 */
function validateAll() {
  console.log('\n=== Validating All Hindu Entities ===\n');
  const { execSync } = require('child_process');

  try {
    const result = execSync('node scripts/validate-entity.js --all', {
      cwd: NEW_REPO,
      encoding: 'utf-8'
    });
    console.log(result);
  } catch (error) {
    console.error('Validation errors:', error.message);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--validate')) {
  validateAll();
} else if (args.includes('--deities') || args.includes('--all')) {
  migrateDeities();
  if (args.includes('--validate')) {
    validateAll();
  }
} else {
  console.log('Usage:');
  console.log('  node migrate-hindu-entities.js --deities     # Migrate all deities');
  console.log('  node migrate-hindu-entities.js --all         # Migrate everything');
  console.log('  node migrate-hindu-entities.js --validate    # Validate all entities');
  process.exit(1);
}

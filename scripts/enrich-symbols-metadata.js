#!/usr/bin/env node

/**
 * Sacred Symbol Metadata Enrichment Script
 * Eyes of Azrael - Symbol Enhancement
 *
 * Populates rich metadata for all sacred symbol entities in Firebase:
 * - meaning: What the symbol represents
 * - origins: Where it came from
 * - usage: How it's used
 * - variations: Different forms and representations
 * - associations: Related symbols, deities, concepts
 * - prohibitions: Improper uses and warnings
 *
 * Features:
 * - Reads symbols from firebase-assets-downloaded/symbols/
 * - Enriches each symbol with comprehensive metadata
 * - Validates against required fields
 * - Generates Firebase update batches
 * - Supports both local file updates and Firebase upload
 * - Comprehensive error handling and progress tracking
 *
 * Usage:
 *   node scripts/enrich-symbols-metadata.js --local
 *   node scripts/enrich-symbols-metadata.js --firebase
 *   node scripts/enrich-symbols-metadata.js --validate
 *   node scripts/enrich-symbols-metadata.js --dry-run
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SYMBOLS_DIR = path.join(__dirname, '../firebase-assets-downloaded/symbols');
const BACKUP_DIR = path.join(__dirname, '../firebase-assets-downloaded/symbols-backup');
const OUTPUT_DIR = path.join(__dirname, '../FIREBASE/enriched_symbols');
const LOG_PATH = path.join(__dirname, '../symbol-enrichment.log');
const BATCH_SIZE = 50; // Documents per batch
const RATE_LIMIT_DELAY = 100; // ms between batches

// Required metadata fields
const REQUIRED_FIELDS = [
  'meaning',
  'origins',
  'usage',
  'variations',
  'associations',
  'prohibitions'
];

// ============================================================================
// SYMBOL ENRICHMENT DATABASE
// ============================================================================

/**
 * Comprehensive enrichment data for all symbols
 * Provides fallback data when local files lack necessary metadata
 */
const SYMBOL_ENRICHMENT_DATA = {
  'buddhist_dharma-wheel': {
    meaning: 'Represents the Buddha\'s teachings (Dharma) and the path to enlightenment through the Noble Eightfold Path',
    origins: 'Ancient Buddhist tradition; the wheel predates Buddhism in Indian culture (associated with Chakravartin kings)',
    usage: 'Central symbol in Buddhist temples, prayer wheels, meditation, ordination ceremonies; represents the first sermon at Sarnath',
    variations: [
      'Eight-spoked wheel (Noble Eightfold Path)',
      'Thousand-spoked wheel (countless aspects of teaching)',
      'Ashoka Chakra (24 spokes on Indian flag)',
      'Wheel with flanking deer (Deer Park sermon)',
      'Prayer wheel form (Mani wheels)',
      'Tibetan ornate style with jewels and ribbons'
    ],
    associations: {
      symbols: ['Ashtamangala (Eight Auspicious Symbols)', 'Endless Knot', 'Lotus', 'Conch Shell'],
      deities: ['Buddha Shakyamuni', 'Vairocana Buddha', 'Avalokiteshvara'],
      concepts: ['Four Noble Truths', 'Noble Eightfold Path', 'Dependent Origination', 'Three Turnings of the Wheel']
    },
    prohibitions: [
      'Not to be used as mere decoration without understanding its spiritual significance',
      'Should not be turned clockwise (counterclockwise is traditional)',
      'Respect required when depicted in prayer wheels or temple settings',
      'Avoid depiction on disrespectful or trivial items'
    ]
  },

  'egyptian_ankh': {
    meaning: 'Symbolizes eternal life, divine immortality, the breath of life, and the key to unlocking the mysteries of the afterlife',
    origins: 'Ancient Egypt (Early Dynastic Period, c. 3150 BCE); origins debated - possibly evolved from sandal strap, ceremonial knot, or union of masculine/feminine',
    usage: 'Worn as protective amulet; held by deities blessing pharaohs; adorned temples, sarcophagi, jewelry; used in funerary rites and Opening of the Mouth ceremony',
    variations: [
      'Mirror Ankh (with reflective surface, associated with Hathor)',
      'Djed-Ankh combination (stability and life)',
      'Was-Ankh-Djed triad (power, stability, and life)',
      'Floral Ankh (with lotus or papyrus motifs)',
      'Coptic Ankh / Crux Ansata (Christian adaptation)',
      'Winged Ankh (with divine protection symbolism)',
      'Tyet / Knot of Isis (related symbol with folded arms)'
    ],
    associations: {
      symbols: ['Djed pillar (stability)', 'Was scepter (power)', 'Eye of Horus (protection)', 'Scarab (transformation)', 'Shen ring (eternity)'],
      deities: ['Isis', 'Osiris', 'Ra', 'Hathor', 'Anubis', 'Thoth', 'Atum', 'Sekhmet', 'Ptah'],
      concepts: ['Ma\'at (cosmic order)', 'Ka (spirit)', 'Ba (soul)', 'Resurrection and rebirth', 'Sacred kingship', 'The afterlife (Duat)']
    },
    prohibitions: [
      'In modern Western contexts, respect Egyptian religious significance',
      'Not to be used disrespectfully or in trivializing contexts',
      'Avoid combining with non-Egyptian religious symbols inappropriately',
      'Respect in archaeological contexts - original artifacts require proper handling'
    ]
  },

  'hindu_om': {
    meaning: 'The primordial sound representing Brahman (ultimate reality), the essence of the universe, and the foundation of all existence and consciousness',
    origins: 'Vedic period (1500-500 BCE or earlier); mentioned in Rigveda; extensively elaborated in Upanishads, especially Mandukya Upanishad',
    usage: 'Chanted in meditation and prayer; begins and ends all Hindu rituals; foundation of all mantras; used in yoga practice; basis of spiritual discipline',
    variations: [
      'Vocal chanting (Japa)',
      'Pranava Dhyana (deep meditation on Om)',
      'Ajapa Japa (effortless breath awareness)',
      'Written symbol in Devanagari script',
      'Embedded in lotus flowers (artistic)',
      'Surrounded by rays of light',
      'Combined with deity images',
      'Inscribed within mandalas'
    ],
    associations: {
      symbols: ['Swastika (auspicious symbol)', 'Sri Yantra (geometric meditation form)', 'Trishula (trident with threefold aspects)'],
      deities: ['Brahman (ultimate reality)', 'Trimurti (Brahma, Vishnu, Shiva)', 'Ganesha', 'Shakti/Devi'],
      concepts: ['Nada Brahman (sound as reality)', 'Shabda (divine word)', 'Bija Mantras (seed syllables)', 'Spanda (divine pulsation)']
    },
    prohibitions: [
      'Should not be chanted irreverently or mockingly',
      'Proper pronunciation is essential - approximate chanting is disrespectful',
      'Not to be used trivially in commercial contexts',
      'Avoid tattooing Om disrespectfully or placing it on lower body',
      'Traditional practice requires proper lineage and guidance for advanced techniques'
    ]
  },

  'celtic_triquetra': {
    meaning: 'Represents the Trinity (Celtic: Maiden-Mother-Crone, or Christian: Father-Son-Holy Spirit); symbolizes endless cycles, eternal unity, and sacred interconnectedness',
    origins: 'Pre-Christian Celtic era (Bronze Age or earlier); evolved from triple-spiral motifs; reached artistic apex in Insular art (6th-9th centuries CE)',
    usage: 'Adorned Celtic Christian manuscripts (Book of Kells); featured on church metalwork, crosses, grave markers; modern use in Wiccan ritual and jewelry',
    variations: [
      'Simple Triquetra (pure form without additional elements)',
      'Triquetra with Circle (emphasizing unity and eternity)',
      'Knotwork Triquetra (elaborated with Celtic interlace)',
      'Double Triquetra (two interlocked, six-pointed design)',
      'Triquetra with Serpents (arcs formed by intertwining serpents)',
      'Manuscript illuminated versions (Book of Kells style)'
    ],
    associations: {
      symbols: ['Triskelion (three-spiral symbol)', 'Celtic Knotwork (artistic tradition)', 'Vesica Piscis (geometric basis)', 'Valknut (Norse equivalent)'],
      deities: ['Brigid (triple goddess)', 'The Morrigan (triple war goddess)', 'Hecate (Greek triple goddess)', 'The Norns (Norse triple fate-weavers)'],
      concepts: ['Triple Goddess (Maiden-Mother-Crone)', 'Holy Trinity (Christian)', 'Land-Sea-Sky (Celtic realms)', 'Past-Present-Future (temporal aspects)']
    },
    prohibitions: [
      'Respect the religious significance to both Celtic and Christian traditions',
      'Not to be used as generic Celtic symbol without understanding its meaning',
      'Avoid trivializing the triple goddess concept',
      'In Christian contexts, acknowledge its theological significance',
      'Avoid cultural appropriation without learning the traditions'
    ]
  },

  'chinese_yin-yang': {
    meaning: 'Represents the dynamic balance and interdependence of opposing forces; symbolizes cosmic equilibrium, complementarity, and universal harmony',
    origins: 'Ancient Chinese philosophy (pre-5th century BCE); central to Taoism and Confucianism; philosophical rather than strictly religious',
    usage: 'Philosophical meditation symbol; used in feng shui and martial arts; represents the principle of complementary opposites in all aspects of existence',
    variations: [
      'Simple two-circle form (black and white)',
      'With eyes (dots representing contained opposites)',
      'Multiple color variations (red/gold, blue/white)',
      'Stylized calligraphic forms',
      'Integrated with trigrams (I Ching)',
      'In motion (representing dynamic change)'
    ],
    associations: {
      symbols: ['Trigrams (I Ching)', 'Tai Chi symbol', 'Chinese characters for yin and yang'],
      concepts: ['Tao (the Way)', 'Wu (emptiness)', 'Chi (vital force)', 'Five elements (Wu Xing)', 'Feng Shui', 'Complementary opposites'],
      deities: ['Various Taoist deities', 'The Immortals']
    },
    prohibitions: [
      'Not to be misused as decoration without understanding philosophical principles',
      'Avoid reducing complex philosophy to simplistic interpretation',
      'Should not be used mockingly or disrespectfully',
      'Respect its origin in Chinese philosophical tradition'
    ]
  },

  'egyptian_eye-of-horus': {
    meaning: 'Represents protection, royal power, wholeness, and restoration after loss; symbolizes the eye (witness consciousness) and healing',
    origins: 'Ancient Egyptian mythology; based on myth of Horus regaining his eye after battle with Set; appears in Pyramid Texts and throughout Egyptian history',
    usage: 'Worn as protective amulet; used in funerary contexts; represented mathematical fractions in Egyptian arithmetic; depicted in tomb paintings and temple reliefs',
    variations: [
      'Right Eye of Horus (Wedjat - solar eye)',
      'Left Eye of Horus (Wedjat - lunar eye)',
      'Wadjet Eye (variant spelling and form)',
      'With decorative lines (artistic enhancement)',
      'In fresco paintings (tomb and temple)',
      'On amulets and jewelry (protective function)'
    ],
    associations: {
      symbols: ['Ankh (life)', 'Scarab (transformation)', 'Solar disk', 'Lunar crescent'],
      deities: ['Horus (sky god, son of Osiris and Isis)', 'Ra (sun god)', 'Thoth (recording and healing)', 'Isis (mother and healer)'],
      concepts: ['Restoration and healing', 'Royal legitimacy', 'Divine protection', 'Mathematical fractions (Horus-eye fractions)', 'Sight and wisdom']
    },
    prohibitions: [
      'Respect its sacred and protective significance',
      'Not to be depicted carelessly or disrespectfully',
      'Should maintain proper orientation when worn or displayed',
      'Avoid reducing mythological meaning to mere decoration'
    ]
  },

  'greek_caduceus': {
    meaning: 'Represents commerce, negotiation, eloquence, and divine authority; symbolizes balance and the intertwining of opposing forces; emblem of safe passage',
    origins: 'Ancient Greek mythology; given by Apollo to Hermes (Mercury in Roman tradition); predates Greek culture with roots in Near Eastern traditions',
    usage: 'Hermes\' sacred staff carried during divine missions; used in commerce and negotiation; modern symbol of medicine (often confused with Rod of Asclepius)',
    variations: [
      'Two serpents (Caduceus proper)',
      'Two serpents with wings (winged caduceus)',
      'With central rod of various designs',
      'Golden or ornate versions',
      'With additional symbols (ribbons, etc.)',
      'Simplified modern adaptations'
    ],
    associations: {
      symbols: ['Rod of Asclepius (medical symbol)', 'Caduceus variants'],
      deities: ['Hermes/Mercury (messenger god)', 'Apollo (who granted it)', 'Asclepius (medical god)', 'Athena (wisdom and authority)'],
      concepts: ['Commerce and trade', 'Eloquence and persuasion', 'Safe passage and protection', 'Balance of opposites', 'Divine authority']
    },
    prohibitions: [
      'Not to be confused with the Rod of Asclepius in medical contexts (different symbol)',
      'Should respect its association with deception (Hermes also god of thieves)',
      'Avoid casual use without understanding mythological significance',
      'Not appropriate for medical symbols (use Rod of Asclepius instead)'
    ]
  },

  'greek_ouroboros': {
    meaning: 'Represents eternity, cyclic time, self-renewal, and the infinite cycle of creation and destruction; symbolizes the universe consuming and regenerating itself',
    origins: 'Ancient Egyptian origins; adopted by Greeks and later Hermeticists; extensive use in alchemy and esoteric traditions',
    usage: 'Alchemical and esoteric meditation; represents eternal return and cycles; used in magical traditions and mystical philosophy',
    variations: [
      'Single serpent eating its tail',
      'Two serpents intertwined (relating to caduceus)',
      'With alchemical symbols',
      'In circular mandalas',
      'With eyes open or closed',
      'With decorative elements'
    ],
    associations: {
      symbols: ['Caduceus (intertwined serpents)', 'Yin-Yang (cyclical balance)', 'Eternal knot', 'Wheel of becoming'],
      concepts: ['Eternal return', 'Ouroboric cycle', 'Self-consumption and renewal', 'Time and infinity', 'Alchemy and transmutation']
    },
    prohibitions: [
      'Not to be misinterpreted as symbol of evil or darkness',
      'Should respect its philosophical and esoteric significance',
      'Avoid casual use in trivial contexts',
      'In alchemy, maintain understanding of its transformative meaning'
    ]
  },

  'hermetic_pentagram': {
    meaning: 'Represents the five elements united with spirit; symbolizes human potential, protection, and the divine in material form; emblem of harmony and cosmic order',
    origins: 'Ancient origins (Mesopotamia, Egypt); extensively used in Pythagorean philosophy; central to Hermetic and Western esoteric traditions',
    usage: 'Protective symbol in magic circles; meditation focus for element balancing; represents initiatic degrees; used in ceremonial magic',
    variations: [
      'Five-pointed star (point up - divine)',
      'Inverted pentagram (point down - varied interpretations)',
      'With circle (pentacle - protection)',
      'With elemental symbols at points',
      'With deity representations',
      'In various artistic styles and colors'
    ],
    associations: {
      symbols: ['Pentacle (pentagram with circle)', 'Elements (earth, water, fire, air, spirit)', 'Golden ratio proportions'],
      concepts: ['Five elements', 'Human form (arms, legs, head)', 'Harmony and balance', 'Protection and invocation', 'Sacred geometry']
    },
    prohibitions: [
      'Inverted pentagram has different meanings - understand context',
      'Not to be used as symbol of evil (common misconception)',
      'Requires proper training for magical applications',
      'Should not be worn casually without understanding',
      'Respect varies by tradition - clarify context of use'
    ]
  },

  'hindu_sri-yantra': {
    meaning: 'Represents the divine feminine (Shakti) and the union of masculine and feminine principles; symbolizes the structure of the universe and divine creation',
    origins: 'Hindu tantra tradition (medieval period); represents Shiva and Shakti union; used in Devi worship and tantric practice',
    usage: 'Meditation focus for tantric practice; enhances spiritual development and divine union; represents the path of kundalini activation',
    variations: [
      'Nine interlocking triangles (basic form)',
      'With outer circuits (layers of creation)',
      'With chakra points marked',
      'Simplified versions (six-pointed form)',
      'With lotus petals and bindu',
      'In various artistic and colored forms'
    ],
    associations: {
      symbols: ['Chakra diagrams', 'Lotus (spiritual unfolding)', 'Bindu (point of creation)', 'Yoni-Lingam'],
      deities: ['Devi/Shakti (divine feminine)', 'Shiva (masculine principle)', 'Various goddesses'],
      concepts: ['Kundalini awakening', 'Tantra', 'Sacred union', 'Creation and cosmos', 'Shakti (divine energy)']
    },
    prohibitions: [
      'Requires proper initiation and guidance for tantric practice',
      'Not to be used casually or for entertainment',
      'Should maintain purity of practice and intention',
      'Respect the sacred and powerful nature of the symbol',
      'Not appropriate to display disrespectfully'
    ]
  },

  'jewish_menorah': {
    meaning: 'Represents the seven days of creation; symbolizes divine light, the presence of God, and spiritual illumination; central to Jewish identity and faith',
    origins: 'Biblical origin (Exodus 25); originally placed in the Tabernacle and Second Temple; ancient symbol from 1st century BCE onward',
    usage: 'Lit during Jewish holidays and Shabbat (Friday evening); Hanukkah menorah (eight branches plus shamas); symbol of Jewish continuity and faith',
    variations: [
      'Temple Menorah (original seven-branched)',
      'Hanukkiah (eight-branched Hanukkah menorah)',
      'With various decorative styles',
      'Modern and ancient artistic interpretations',
      'In various materials (gold, silver, brass)',
      'As architectural or artistic element'
    ],
    associations: {
      symbols: ['Star of David', 'Torah', 'Ark of Covenant'],
      concepts: ['Divine light', 'Creation', 'Hanukkah (rededication)', 'Shabbat (weekly rest)', 'Jewish continuity', 'Spiritual illumination']
    },
    prohibitions: [
      'Should be treated with reverence as sacred Jewish symbol',
      'Not to be used mockingly or disrespectfully',
      'Proper lighting and maintenance protocols for ritual use',
      'In Holocaust contexts, requires sensitive handling',
      'Respect the deep historical and religious significance'
    ]
  },

  'norse_valknut': {
    meaning: 'Represents the unity of life and death, the warrior\'s path, and the binding power of Odin; symbolizes transition between worlds and divine mystery',
    origins: 'Ancient Norse/Germanic tradition; found on runestones, jewelry, and artifacts; associated with Odin and shamanic practice',
    usage: 'Warrior\'s symbol; meditation on life and death cycles; shamanic journey tool; represents the fallen warriors bound to Odin in Valhalla',
    variations: [
      'Three interlocked triangles (closed form)',
      'Open version (more flowing design)',
      'With knotwork decoration',
      'On runestones (various artistic styles)',
      'In modern Norse reconstructionist practice',
      'Integrated with other Norse symbols'
    ],
    associations: {
      symbols: ['Triquetra (Celtic equivalent)', 'Triskelion', 'Runes (especially Othala)'],
      deities: ['Odin (god of war, death, wisdom)', 'Valkyries (choosers of slain)', 'Norns (fate-weavers)'],
      concepts: ['Valhalla', 'Shamanic journey', 'Life and death cycles', 'Warrior culture', 'Fate (Wyrd)']
    },
    prohibitions: [
      'Respect its association with death and the afterlife',
      'Modern misuse by hate groups - but symbol itself is ancient and legitimate',
      'Should be used with understanding of Norse spiritual traditions',
      'Not to be appropriated without cultural context',
      'Avoid trivial or disrespectful use'
    ]
  },

  'persian_faravahar': {
    meaning: 'Represents the guardian spirit and conscience; symbolizes the soul\'s aspiration toward enlightenment and the good path; emblem of Zoroastrian philosophy',
    origins: 'Zoroastrianism (ancient Persian religion, c. 1500-600 BCE); represents the divine Fravashi (guardian spirit)',
    usage: 'Spiritual protection and guidance; represents the path of good versus evil; used in Zoroastrian worship and personal devotion',
    variations: [
      'Winged figure form (classic representation)',
      'With human form ascending',
      'With variations in artistic style',
      'With Zoroastrian inscriptions',
      'In modern and ancient artistic forms',
      'As protective amulet'
    ],
    associations: {
      symbols: ['Sacred fire (Atar)', 'Ahura Mazda symbol'],
      deities: ['Ahura Mazda (Supreme God)', 'Amesha Spentas (divine beings)'],
      concepts: ['Good versus evil (Asha vs. Druj)', 'Guardian spirits', 'Spiritual enlightenment', 'Good deeds and righteousness', 'Divine wisdom']
    },
    prohibitions: [
      'Respect the sacred Zoroastrian religious tradition',
      'Not to be used mockingly or disrespectfully',
      'Should maintain understanding of its spiritual function',
      'Avoid trivializing the guardian spirit concept',
      'Respect minority religious traditions'
    ]
  },

  'persian_sacred-fire': {
    meaning: 'Represents the divine presence, purity, and the eternal light of Ahura Mazda; symbolizes truth, wisdom, and the illumination of consciousness',
    origins: 'Central to Zoroastrianism; fire considered the physical manifestation of divine wisdom; eternal fires maintained in fire temples',
    usage: 'Ritual focus in Zoroastrian temples; meditation on divine light; represents the purification of soul and spirit',
    variations: [
      'Eternal temple fires (primary form)',
      'Stylized flame representations',
      'With urns (fire vessels)',
      'In artistic and symbolic forms',
      'As focus for meditation practice',
      'In various artistic interpretations'
    ],
    associations: {
      symbols: ['Faravahar (guardian spirit)', 'Divine light', 'Asha (truth and order)'],
      deities: ['Ahura Mazda (Supreme God)', 'Atar (fire spirit)', 'Amesha Spentas (divine beings)'],
      concepts: ['Divine wisdom', 'Truth and order (Asha)', 'Spiritual purification', 'Eternal light', 'Divine presence']
    },
    prohibitions: [
      'Should be treated with reverence - not as mere symbol',
      'Not to be used frivolously or mockingly',
      'Respect the sacred nature of Zoroastrian practice',
      'Fire symbolism should honor its divine association',
      'Avoid disrespectful artistic or commercial use'
    ]
  },

  'greek_caduceus': {
    meaning: 'Represents commerce, negotiation, eloquence, and divine authority; symbolizes balance and the intertwining of opposing forces; emblem of safe passage',
    origins: 'Ancient Greek mythology; given by Apollo to Hermes (Mercury in Roman tradition); predates Greek culture with roots in Near Eastern traditions',
    usage: 'Hermes\' sacred staff carried during divine missions; used in commerce and negotiation; modern symbol of medicine (often confused with Rod of Asclepius)',
    variations: [
      'Two serpents (Caduceus proper)',
      'Two serpents with wings (winged caduceus)',
      'With central rod of various designs',
      'Golden or ornate versions',
      'With additional symbols (ribbons, etc.)',
      'Simplified modern adaptations'
    ],
    associations: {
      symbols: ['Rod of Asclepius (medical symbol)', 'Caduceus variants'],
      deities: ['Hermes/Mercury (messenger god)', 'Apollo (who granted it)', 'Asclepius (medical god)', 'Athena (wisdom and authority)'],
      concepts: ['Commerce and trade', 'Eloquence and persuasion', 'Safe passage and protection', 'Balance of opposites', 'Divine authority']
    },
    prohibitions: [
      'Not to be confused with the Rod of Asclepius in medical contexts (different symbol)',
      'Should respect its association with deception (Hermes also god of thieves)',
      'Avoid casual use without understanding mythological significance',
      'Not appropriate for medical symbols (use Rod of Asclepius instead)'
    ]
  },

  'greek_ouroboros': {
    meaning: 'Represents eternity, cyclic time, self-renewal, and the infinite cycle of creation and destruction; symbolizes the universe consuming and regenerating itself',
    origins: 'Ancient Egyptian origins; adopted by Greeks and later Hermeticists; extensive use in alchemy and esoteric traditions',
    usage: 'Alchemical and esoteric meditation; represents eternal return and cycles; used in magical traditions and mystical philosophy',
    variations: [
      'Single serpent eating its tail',
      'Two serpents intertwined (relating to caduceus)',
      'With alchemical symbols',
      'In circular mandalas',
      'With eyes open or closed',
      'With decorative elements'
    ],
    associations: {
      symbols: ['Caduceus (intertwined serpents)', 'Yin-Yang (cyclical balance)', 'Eternal knot', 'Wheel of becoming'],
      concepts: ['Eternal return', 'Ouroboric cycle', 'Self-consumption and renewal', 'Time and infinity', 'Alchemy and transmutation']
    },
    prohibitions: [
      'Not to be misinterpreted as symbol of evil or darkness',
      'Should respect its philosophical and esoteric significance',
      'Avoid casual use in trivial contexts',
      'In alchemy, maintain understanding of its transformative meaning'
    ]
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Log message with timestamp
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  try {
    fs.appendFileSync(LOG_PATH, logMessage + '\n');
  } catch (err) {
    console.error('Error writing to log:', err.message);
  }
}

/**
 * Check if symbol has all required metadata fields
 */
function validateSymbolMetadata(symbol) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!symbol[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Enrich symbol with missing metadata from enrichment database
 */
function enrichSymbol(symbol) {
  const enrichmentData = SYMBOL_ENRICHMENT_DATA[symbol.id];

  if (!enrichmentData) {
    log(`⚠ No enrichment data found for ${symbol.id}`);
    return symbol;
  }

  const enriched = { ...symbol };

  // Add or update required fields
  for (const field of REQUIRED_FIELDS) {
    if (!enriched[field] || enriched[field].length === 0) {
      enriched[field] = enrichmentData[field] || [];
    }
  }

  // Add associations if missing
  if (!enriched.associations) {
    enriched.associations = enrichmentData.associations || {};
  }

  // Add enrichment metadata
  enriched._enriched = true;
  enriched._enrichedAt = new Date().toISOString();
  enriched._enrichedBy = 'symbol-enrichment-script';

  return enriched;
}

/**
 * Read all symbol files from directory
 */
function readSymbolFiles() {
  const symbols = [];
  const files = fs.readdirSync(SYMBOLS_DIR);

  for (const file of files) {
    if (file === '_all.json' || !file.endsWith('.json')) continue;

    try {
      const filePath = path.join(SYMBOLS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      let parsed = JSON.parse(content);

      // Handle array format (some files like persian.json)
      if (Array.isArray(parsed)) {
        symbols.push(...parsed);
      } else {
        symbols.push(parsed);
      }
    } catch (err) {
      log(`❌ Error reading ${file}: ${err.message}`);
    }
  }

  return symbols;
}

/**
 * Backup original symbol files
 */
function backupSymbols(symbols) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    for (const symbol of symbols) {
      const backupPath = path.join(BACKUP_DIR, `${symbol.id}.json`);
      const originalPath = path.join(SYMBOLS_DIR, `${symbol.id}.json`);

      if (fs.existsSync(originalPath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(originalPath, backupPath);
      }
    }

    log(`✅ Backed up ${symbols.length} symbol files to ${BACKUP_DIR}`);
  } catch (err) {
    log(`❌ Backup error: ${err.message}`);
  }
}

/**
 * Validate metadata for all symbols
 */
function validateAllSymbols(symbols) {
  const validation = {
    total: symbols.length,
    valid: 0,
    invalid: 0,
    issues: []
  };

  for (const symbol of symbols) {
    const result = validateSymbolMetadata(symbol);
    if (result.isValid) {
      validation.valid++;
    } else {
      validation.invalid++;
      validation.issues.push({
        id: symbol.id,
        errors: result.errors
      });
    }
  }

  return validation;
}

/**
 * Generate Firebase batch operations
 */
function generateFirebaseBatch(symbols) {
  const batches = [];
  let currentBatch = [];

  for (const symbol of symbols) {
    currentBatch.push({
      type: 'set',
      collection: 'symbols',
      document: symbol.id,
      data: symbol
    });

    if (currentBatch.length >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * Upload batch to Firebase
 */
async function uploadBatchToFirebase(db, batch, batchIndex, totalBatches) {
  try {
    const batchRef = db.batch();
    const startIndex = batchIndex * BATCH_SIZE;

    for (let i = 0; i < batch.length; i++) {
      const operation = batch[i];
      const docRef = db.collection(operation.collection).doc(operation.document);
      batchRef.set(docRef, operation.data, { merge: true });
    }

    await batchRef.commit();
    log(`✅ Batch ${batchIndex + 1}/${totalBatches} uploaded successfully (${batch.length} documents)`);

    return true;
  } catch (err) {
    log(`❌ Batch ${batchIndex + 1} upload error: ${err.message}`);
    return false;
  }
}

/**
 * Write enriched symbols to local files
 */
function writeEnrichedSymbols(symbols) {
  try {
    if (!fs.existsSync(SYMBOLS_DIR)) {
      fs.mkdirSync(SYMBOLS_DIR, { recursive: true });
    }

    for (const symbol of symbols) {
      const filePath = path.join(SYMBOLS_DIR, `${symbol.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(symbol, null, 2));
    }

    log(`✅ Wrote ${symbols.length} enriched symbol files to ${SYMBOLS_DIR}`);
    return true;
  } catch (err) {
    log(`❌ Error writing symbol files: ${err.message}`);
    return false;
  }
}

/**
 * Generate enrichment report
 */
function generateReport(symbols, validation) {
  const report = [];
  report.push('# Symbol Metadata Enrichment Report');
  report.push(`\nGenerated: ${new Date().toISOString()}`);
  report.push(`\n## Summary\n`);
  report.push(`- Total symbols processed: ${validation.total}`);
  report.push(`- Symbols with valid metadata: ${validation.valid}`);
  report.push(`- Symbols needing enrichment: ${validation.invalid}`);

  if (validation.issues.length > 0) {
    report.push(`\n## Issues Found\n`);
    for (const issue of validation.issues) {
      report.push(`\n### ${issue.id}`);
      for (const error of issue.errors) {
        report.push(`- ${error}`);
      }
    }
  }

  report.push(`\n## Enriched Symbols\n`);
  for (const symbol of symbols) {
    report.push(`\n### ${symbol.displayName || symbol.name} (${symbol.id})`);
    report.push(`- Mythology: ${symbol.mythology}`);
    report.push(`- Meaning: ${symbol.meaning?.substring(0, 100)}...`);
    report.push(`- Variations: ${Array.isArray(symbol.variations) ? symbol.variations.length : 0}`);
    report.push(`- Prohibitions: ${Array.isArray(symbol.prohibitions) ? symbol.prohibitions.length : 0}`);
  }

  return report.join('\n');
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

function initializeFirebase() {
  try {
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

    if (!fs.existsSync(serviceAccountPath)) {
      log('⚠ firebase-service-account.json not found - Firebase upload disabled');
      log('   To enable upload: download from Firebase Console > Project Settings > Service Accounts');
      return null;
    }

    const serviceAccount = require(serviceAccountPath);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    return admin.firestore();
  } catch (err) {
    log(`⚠ Firebase initialization error: ${err.message}`);
    return null;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n🔮 Sacred Symbol Metadata Enrichment Script');
  console.log('==========================================\n');

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const validateOnly = args.includes('--validate');
  const localOnly = args.includes('--local');
  const firebaseOnly = args.includes('--firebase');

  log(`Starting enrichment process (dry-run: ${dryRun})`);

  try {
    // Read symbols
    log('Reading symbol files...');
    const symbols = readSymbolFiles();
    log(`✅ Found ${symbols.length} symbol files`);

    if (symbols.length === 0) {
      log('❌ No symbol files found!');
      process.exit(1);
    }

    // Backup originals
    if (!dryRun && !validateOnly) {
      log('Backing up original files...');
      backupSymbols(symbols);
    }

    // Enrich symbols
    log('Enriching symbol metadata...');
    const enrichedSymbols = symbols.map(symbol => enrichSymbol(symbol));
    log(`✅ Enriched ${enrichedSymbols.length} symbols`);

    // Validate
    log('Validating metadata...');
    const validation = validateAllSymbols(enrichedSymbols);

    if (validation.invalid > 0) {
      log(`⚠ ${validation.invalid} symbols have incomplete metadata`);
      for (const issue of validation.issues) {
        log(`  - ${issue.id}: ${issue.errors.join(', ')}`);
      }
    } else {
      log(`✅ All ${validation.valid} symbols have valid metadata`);
    }

    // Generate report
    const report = generateReport(enrichedSymbols, validation);
    const reportPath = path.join(__dirname, '../symbol-enrichment-report.md');
    fs.writeFileSync(reportPath, report);
    log(`✅ Report written to ${reportPath}`);

    if (validateOnly) {
      log('Validation complete. Exiting.');
      process.exit(0);
    }

    // Write to local files
    if (!firebaseOnly && !dryRun) {
      log('Writing enriched symbols to local files...');
      writeEnrichedSymbols(enrichedSymbols);
    }

    // Upload to Firebase
    if (!localOnly) {
      const db = initializeFirebase();
      if (db && !dryRun) {
        log('Generating Firebase batches...');
        const batches = generateFirebaseBatch(enrichedSymbols);
        log(`✅ Generated ${batches.length} batches`);

        log('Uploading to Firebase...');
        let successCount = 0;
        for (let i = 0; i < batches.length; i++) {
          const success = await uploadBatchToFirebase(db, batches[i], i, batches.length);
          if (success) successCount++;

          // Rate limiting
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
          }
        }

        log(`✅ Firebase upload complete: ${successCount}/${batches.length} batches successful`);
      } else if (dryRun) {
        log('🔍 DRY RUN - Skipping Firebase upload');
      }
    }

    log('\n✅ Enrichment process complete!');
    console.log('\nSummary:');
    console.log(`- Symbols processed: ${enrichedSymbols.length}`);
    console.log(`- Valid metadata: ${validation.valid}`);
    console.log(`- Issues found: ${validation.invalid}`);
    console.log(`- Report: ${reportPath}`);

  } catch (error) {
    log(`❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  enrichSymbol,
  validateSymbolMetadata,
  SYMBOL_ENRICHMENT_DATA,
  REQUIRED_FIELDS
};

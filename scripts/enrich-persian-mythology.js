/**
 * Persian Mythology Enrichment Script
 *
 * Enriches Firebase JSON assets with content parsed from HTML files including:
 * - mythology: Avestan narratives and theological context
 * - dualism: Ahura Mazda vs Angra Mainyu cosmic struggle
 * - worship: Fire temples, rituals, practices
 * - sources: Avesta, Shahnameh, Bundahishn references
 * - extendedContent: Rich narrative content
 */

const fs = require('fs');
const path = require('path');

// Paths
const DEITIES_PATH = path.join(__dirname, '../firebase-assets-downloaded/deities/persian.json');
const COSMOLOGY_PATH = path.join(__dirname, '../firebase-assets-downloaded/cosmology/persian.json');
const CREATURES_PATH = path.join(__dirname, '../firebase-assets-downloaded/creatures/persian.json');
const SYMBOLS_PATH = path.join(__dirname, '../firebase-assets-downloaded/symbols/persian.json');

// Enrichment data extracted from HTML files
const PERSIAN_ENRICHMENT = {
  // AHURA MAZDA - The Wise Lord
  'ahura-mazda': {
    mythology: {
      tradition: 'Zoroastrianism',
      origin: 'Ancient Iran (Persia)',
      period: 'c. 1500-1000 BCE onwards',
      narrative: 'Ahura Mazda (Ohrmazd in Middle Persian) is the uncreated, omniscient, supreme deity of Zoroastrianism. He existed eternally in infinite light above the Void, possessing complete knowledge of past, present, and future. He is the source of all good creation and the ultimate embodiment of Asha (Truth/Righteousness).',
      cosmicRole: 'Creator of all good things. He first created the world in spiritual form (menog), then manifested it in material form (getig). He emanated the seven Amesha Spentas as aspects of his divine nature to protect and govern creation.',
      eschatology: 'At the end of time (Frashokereti), Ahura Mazda will achieve complete victory over evil, purifying all creation and establishing eternal paradise.'
    },
    dualism: {
      opponent: 'Angra Mainyu (Ahriman)',
      nature: 'Ethical/Cosmic Dualism - two primordial spirits who made opposite moral choices',
      conflict: 'Ahura Mazda chose Asha (Truth), Angra Mainyu chose Druj (Lie). Their cosmic struggle defines existence.',
      stance: 'Ahura Mazda embodies light, wisdom, creation, order, and life.',
      resolution: 'Good is destined to triumph. Evil will be annihilated at Frashokereti.',
      humanRole: 'Humans must choose to follow Asha, actively participating in the cosmic struggle through good thoughts, words, and deeds.'
    },
    worship: {
      practices: [
        'Fire worship - sacred fires maintained in fire temples as symbols of Ahura Mazda\'s presence',
        'Yasna ceremony - primary liturgical ritual using the Avesta',
        'Five daily prayers (gahs) facing light or sacred fire',
        'Wearing the kusti (sacred cord) and sudreh (sacred shirt)'
      ],
      temples: 'Fire temples (Atash Behram, Atash Adaran, Atash Dadgah) house eternally burning sacred fires',
      priesthood: 'Mobeds (priests) maintain fires and perform ceremonies',
      festivals: ['Nowruz (Spring Equinox)', 'Mehregan (Autumn Festival)', 'Sadeh (Mid-winter)', 'Tiragan'],
      prayers: ['Ahuna Vairya (most sacred prayer)', 'Ashem Vohu', 'Yenghe Hatam']
    },
    sources: {
      primary: [
        { text: 'Gathas', description: 'Hymns of Zoroaster - direct words of the prophet', chapters: 'Yasna 28-34, 43-51, 53' },
        { text: 'Yasna', description: 'Primary liturgical text of 72 chapters' },
        { text: 'Yashts', description: 'Hymns to divine beings' },
        { text: 'Bundahishn', description: 'Creation cosmology' }
      ],
      secondary: [
        { text: 'Denkard', description: 'Acts of Religion - theological encyclopedia' },
        { text: 'Shahnameh', description: 'Book of Kings - preserves pre-Islamic mythology' }
      ],
      quotations: [
        { source: 'Yasna 30:3-5', text: 'In the beginning, there were two spirits, twins, who revealed themselves through thought, word, and deed. Of these two, the wise chose rightly, the foolish did not.' },
        { source: 'Yasna 43:1', text: 'The happiness and joy thou grantest through thy glorious fire is like unto the sun\'s light when it rises up in glory.' }
      ]
    },
    extendedContent: {
      etymology: 'Ahura = "Lord" (cognate with Sanskrit Asura), Mazda = "Wisdom" (cognate with Greek Mnemosyne). Thus "Wise Lord" or "Lord of Wisdom".',
      attributes: 'Omniscient, omnipotent within good, uncreated, eternal, source of Asha, creator of Amesha Spentas',
      theologicalSignificance: 'Represents the first clear expression of ethical monotheism. Influenced Jewish, Christian, and Islamic concepts of God.',
      iconography: 'Represented by the Faravahar (winged disk) - symbolizing the divine glory (khvarenah) and the soul\'s journey toward truth.',
      modernPractice: 'Worshipped by Zoroastrians in Iran, India (Parsis), and diaspora communities worldwide.'
    }
  },

  // ANGRA MAINYU - The Destructive Spirit
  'angra-mainyu': {
    mythology: {
      tradition: 'Zoroastrianism',
      origin: 'Ancient Iran (Persia)',
      period: 'c. 1500-1000 BCE onwards',
      narrative: 'Angra Mainyu (Ahriman in Middle Persian) is the uncreated spirit of evil, dwelling eternally in infinite darkness below the Void. Unlike Ahura Mazda, he lacked omniscience and remained ignorant of the good creation until he discovered it and attacked in envy.',
      cosmicRole: 'The Destructive Spirit who introduced evil, death, disease, and suffering into creation. He cannot create, only corrupt and destroy what Ahura Mazda has made.',
      eschatology: 'At Frashokereti, Angra Mainyu will be utterly destroyed along with all evil, never to exist again.'
    },
    dualism: {
      opponent: 'Ahura Mazda',
      nature: 'The embodiment of Druj (Lie/Chaos) in cosmic opposition to Asha (Truth/Order)',
      conflict: 'Chose falsehood, darkness, and destruction when offered the choice to join in creating good. Declared eternal enmity against Ahura Mazda\'s creation.',
      stance: 'Embodies darkness, ignorance, destruction, chaos, and death.',
      cosmicAssault: 'Pierced the sky to enter material creation, introducing death, disease, and corruption. Killed the Primordial Bull and poisoned Gayomart (first human).',
      agents: 'Commands the Daevas (demons) including Az (Concupiscence), Aeshma (Wrath), and Druj (personified Lie).'
    },
    worship: {
      note: 'Angra Mainyu is not worshipped but opposed. All Zoroastrian practice aims to fight evil.',
      opposition: [
        'Speaking truth defeats his falsehood',
        'Good deeds weaken his power',
        'Fire temples repel his darkness',
        'Purity rituals cleanse his contamination'
      ],
      demons: 'The Daevas serve Angra Mainyu and are combated through prayers, rituals, and righteous living.'
    },
    sources: {
      primary: [
        { text: 'Gathas', chapters: 'Yasna 30, 32, 45 - describes the primordial choice and cosmic conflict' },
        { text: 'Vendidad', description: 'Laws against demons - details methods of opposing evil' },
        { text: 'Bundahishn', description: 'Describes the assault on creation and eventual defeat' }
      ],
      quotations: [
        { source: 'Yasna 30:3', text: 'These two spirits, the twins, revealed themselves first in a dream: in thought, word, and deed they are the Better and the Bad.' },
        { source: 'Bundahishn 1', text: 'Angra Mainyu declared: "I will not agree with you, I will not praise your creation. I will destroy your creation forever and ever."' }
      ]
    },
    extendedContent: {
      etymology: 'Angra = "destructive, evil", Mainyu = "spirit, mind". Thus "Destructive Spirit" or "Evil Mind".',
      characteristics: 'Ignorant (unlike omniscient Ahura Mazda), destructive, deceitful, sterile (cannot create), ultimately doomed',
      theologicalSignificance: 'Represents the origin of evil as a cosmic principle that is ultimately defeated, not eternal.',
      manifestations: 'Disease, death, drought, natural disasters, moral corruption, lies, violence',
      modernUnderstanding: 'Symbol of all that opposes truth, life, and righteousness. Fought through ethical living.'
    }
  },

  // MITHRA - God of Covenants
  'mithra': {
    mythology: {
      tradition: 'Zoroastrianism / Indo-Iranian',
      origin: 'Ancient Iran and India (shared Indo-Iranian deity)',
      period: 'Pre-Zoroastrian origins, integrated into Zoroastrianism',
      narrative: 'Mithra is the yazata (divine being) of covenants, contracts, truth, and the rising sun. He is the divine witness to all oaths and agreements, punishing oath-breakers with death. He rides across the sky in a chariot drawn by white horses, illuminating the world.',
      cosmicRole: 'Guardian of truth and contracts, divine judge who weighs souls at the Chinvat Bridge alongside Rashnu and Sraosha. Associated with the sun\'s light as both physical illumination and moral clarity.',
      spread: 'Mithra\'s cult spread throughout the Roman Empire as Mithraism, a mystery religion popular among soldiers.'
    },
    dualism: {
      role: 'Ally of Ahura Mazda in the cosmic struggle',
      function: 'Enforces truth (Asha) by punishing those who break oaths (Druj)',
      judgment: 'One of three judges at the Chinvat Bridge who determine souls\' fates',
      symbolism: 'Light that exposes falsehood and illuminates truth'
    },
    worship: {
      practices: [
        'Dawn prayers when Mithra\'s light first appears',
        'Covenant-making ceremonies invoking Mithra as witness',
        'Mehr Yasht - hymn dedicated to Mithra'
      ],
      temples: 'In Mithraism (Roman), underground temples (Mithraea) with tauroctony imagery',
      festivals: ['Mehregan (autumn equinox)', 'Tiragan (summer)', 'Daily dawn worship'],
      iconography: 'Rising sun, rays of light, white horses, mace (for punishing oath-breakers), lotus'
    },
    sources: {
      primary: [
        { text: 'Mehr Yasht (Yasht 10)', description: 'Primary hymn to Mithra - describes his attributes and cosmic role' },
        { text: 'Avesta', description: 'Various references throughout' }
      ],
      quotations: [
        { source: 'Mehr Yasht 10:7', text: 'Mithra, whose long arms seize the Lie, the covenant-breaking mortal, wherever he may be.' },
        { source: 'Mehr Yasht 10:141', text: 'We worship Mithra of wide cattle-pastures, who has a thousand ears, ten thousand eyes.' }
      ]
    },
    extendedContent: {
      etymology: 'From Proto-Indo-Iranian *mitra- meaning "contract, covenant, friendship"',
      vedic: 'Cognate with Vedic Mitra - the benevolent aspect of divine sovereignty',
      romanMithraism: 'Mystery cult spread through Roman Empire (1st-4th century CE), featuring bull-slaying (tauroctony) iconography',
      historicalInfluence: 'Christmas (December 25) may derive from Mithra\'s birthday - the rebirth of the unconquered sun'
    }
  },

  // ANAHITA - Goddess of Waters
  'anahita': {
    mythology: {
      tradition: 'Zoroastrianism',
      origin: 'Ancient Iran',
      period: 'Pre-Zoroastrian origins, integrated into Zoroastrianism',
      narrative: 'Anahita (Aredvi Sura Anahita - "moist, mighty, immaculate") is the yazata of waters, fertility, and wisdom. She is the source of all world waters, flowing from Mount Hara to purify the earth. She is depicted as a beautiful maiden in golden raiment.',
      cosmicRole: 'Protector of all waters - rivers, lakes, seas. Source of fertility and abundance. Purifier of seed and womb. Associated with the planet Venus.',
      importance: 'One of the most worshipped yazatas, with temples throughout the Persian Empire.'
    },
    dualism: {
      role: 'Ally of Ahura Mazda, protector of the waters against Angra Mainyu\'s corruption',
      function: 'Maintains the purity of waters which Angra Mainyu tried to pollute',
      symbolism: 'Pure, life-giving waters represent truth and fertility against chaos'
    },
    worship: {
      practices: [
        'Water purification rituals',
        'Prayers at rivers and springs',
        'Offerings for fertility and childbirth'
      ],
      temples: 'Major temples at Istakhr (Persepolis region), Kangavar, Shiz',
      festivals: ['Tiragan (summer water festival)', 'Aban Jashan (water celebration)'],
      iconography: 'Beautiful maiden, golden crown, golden earrings, beaver-skin cloak, four-horse chariot'
    },
    sources: {
      primary: [
        { text: 'Aban Yasht (Yasht 5)', description: 'Primary hymn to Anahita - describes her beauty and powers' }
      ],
      quotations: [
        { source: 'Aban Yasht 5:126-129', text: 'Aredvi Sura Anahita drives in a chariot pulled by four white horses: wind, rain, cloud, and sleet. Her chariot runs swiftly, bearing boons to those who invoke her.' }
      ]
    },
    extendedContent: {
      etymology: 'Aredvi = "moist", Sura = "mighty", Anahita = "immaculate, unblemished"',
      syncretism: 'Associated with Ishtar/Inanna (Mesopotamian) and Aphrodite (Greek)',
      royalPatronage: 'Artaxerxes II promoted Anahita worship alongside Ahura Mazda',
      modernPractice: 'Water remains sacred in Zoroastrianism; polluting water is a serious sin'
    }
  },

  // ATAR - Yazata of Fire
  'atar': {
    mythology: {
      tradition: 'Zoroastrianism',
      origin: 'Ancient Iran',
      period: 'Central to Zoroastrianism from earliest texts',
      narrative: 'Atar is the yazata of fire, called the "son of Ahura Mazda." Fire is the visible presence of Ahura Mazda in the material world - pure, purifying, and incorruptible. Unlike other elements, fire cannot be defiled by Angra Mainyu.',
      cosmicRole: 'Divine presence in material creation, warrior against darkness, purifier of all things. Fire links the spiritual and physical realms.',
      importance: 'Fire is the most sacred element in Zoroastrianism, maintained eternally in fire temples.'
    },
    dualism: {
      role: 'Champion against Angra Mainyu and the forces of darkness',
      function: 'Cannot be corrupted by evil; actively purifies creation',
      battle: 'The Avesta describes Atar battling the dragon Azi Dahaka (Zahhak)',
      symbolism: 'Light against darkness, truth against lies, purity against corruption'
    },
    worship: {
      practices: [
        'Fire temples maintain sacred fires continuously burning',
        'Daily prayers performed facing fire',
        'Offerings of sandalwood and frankincense to fire',
        'Never allowing fire to become impure'
      ],
      temples: 'Three grades: Atash Behram (Victory Fire), Atash Adaran, Atash Dadgah',
      taboos: [
        'Never blow on fire (uses breath which can contaminate)',
        'Never let fire go out',
        'Never burn impure substances',
        'Never pollute fire with corpses'
      ],
      festivals: ['Jashn-e Sadeh (Mid-winter fire festival)', 'All daily prayers']
    },
    sources: {
      primary: [
        { text: 'Atash Niyayesh', description: 'Prayer to Fire - recited before sacred fire' },
        { text: 'Yasna', description: 'Multiple references to fire\'s sacred nature' },
        { text: 'Bundahishn', description: 'Fire\'s role in creation and final purification' }
      ],
      quotations: [
        { source: 'Yasna 36:3', text: 'We worship the Fire, O Ahura Mazda, thy son, swift, efficacious, powerful.' }
      ]
    },
    extendedContent: {
      etymology: 'Atar from Proto-Indo-Iranian *ātar-, cognate with Latin atrium',
      vedicParallel: 'Cognate with Vedic Agni - both fire deities with similar sacred functions',
      fireGrades: [
        { name: 'Atash Behram', description: 'Highest grade - "victorious fire" - requires 16 different fire sources' },
        { name: 'Atash Adaran', description: 'Fire of fires - four fires combined' },
        { name: 'Atash Dadgah', description: 'Household fire - basic sacred fire' }
      ],
      eschatology: 'At Frashokereti, molten metal (fire) will purify the entire earth'
    }
  },

  // AMESHA SPENTAS - The Bounteous Immortals
  'amesha-spentas': {
    mythology: {
      tradition: 'Zoroastrianism',
      origin: 'Ancient Iran',
      period: 'Earliest Zoroastrian texts (Gathas)',
      narrative: 'The Amesha Spentas ("Bounteous Immortals") are the seven divine emanations of Ahura Mazda, representing his key attributes. They are both aspects of God and distinct divine beings who protect different elements of creation.',
      cosmicRole: 'Each Amesha Spenta protects one of the seven creations and embodies a divine virtue.',
      composition: [
        { name: 'Vohu Manah', meaning: 'Good Mind', protects: 'Cattle/Animals', virtue: 'Good Thoughts' },
        { name: 'Asha Vahishta', meaning: 'Best Truth', protects: 'Fire', virtue: 'Righteousness' },
        { name: 'Khshathra Vairya', meaning: 'Desirable Dominion', protects: 'Sky/Metals', virtue: 'Divine Power' },
        { name: 'Spenta Armaiti', meaning: 'Holy Devotion', protects: 'Earth', virtue: 'Piety' },
        { name: 'Haurvatat', meaning: 'Wholeness', protects: 'Water', virtue: 'Health/Perfection' },
        { name: 'Ameretat', meaning: 'Immortality', protects: 'Plants', virtue: 'Eternal Life' },
        { name: 'Spenta Mainyu', meaning: 'Holy Spirit', note: 'Ahura Mazda\'s creative aspect', virtue: 'Creative Spirit' }
      ]
    },
    dualism: {
      role: 'Champions of Ahura Mazda against the forces of evil',
      opposition: 'Each Amesha Spenta has a demonic counterpart that they fight',
      function: 'Protect creation from corruption, embody divine virtues'
    },
    worship: {
      practices: [
        'Each day of the month dedicated to an Amesha Spenta',
        'Invoked in prayers and rituals',
        'Seven creations cared for as sacred'
      ],
      significance: 'Humans can embody the virtues of the Amesha Spentas through right living'
    },
    sources: {
      primary: [
        { text: 'Gathas', chapters: 'Yasna 28, 47, 51 - Zoroaster\'s hymns mention the Amesha Spentas' },
        { text: 'Yasna Haptanghaiti', description: 'Worship in Seven Chapters' }
      ],
      quotations: [
        { source: 'Yasna 47:1', text: 'By His Holy Spirit, by Best Thought, Word, and Deed, in accordance with Right, Mazda Ahura shall give Dominion, Welfare, and Immortality.' }
      ]
    },
    extendedContent: {
      etymology: 'Amesha = "immortal, undying", Spenta = "bounteous, holy"',
      theologicalFunction: 'Bridge between transcendent God and creation; model virtues for humans',
      correspondences: 'Each connected to an element, a virtue, a color, and a day of the month',
      influence: 'May have influenced Jewish/Christian concepts of archangels'
    }
  }
};

// Additional cosmological enrichments
const COSMOLOGY_ENRICHMENT = {
  creation: {
    narrative: 'Creation in Zoroastrianism occurred in two phases: first spiritual (menog) then material (getig). Ahura Mazda created six stages: sky, water, earth, plants, animals, and humanity. Angra Mainyu later assaulted creation, introducing evil, death, and corruption.',
    sources: ['Bundahishn chapters 1-3', 'Greater Bundahishn', 'Zatspram']
  },
  dualism: {
    concept: 'Zoroastrian dualism is ethical, not ontological. Good and evil both exist, but evil is not eternal - it will be destroyed at Frashokereti.',
    principles: {
      asha: 'Truth, righteousness, cosmic order - the way of Ahura Mazda',
      druj: 'Lie, chaos, disorder - the way of Angra Mainyu'
    }
  },
  afterlife: {
    journey: 'After death, the soul remains near the body for three days, then crosses the Chinvat Bridge where it is judged.',
    destinations: ['Vahishta Ahu (Best Existence/Paradise)', 'Hamistagan (Limbo)', 'Achista Ahu (Worst Existence/Hell)'],
    frashokereti: 'Final renovation when all souls are resurrected, purified, and evil is destroyed forever.'
  }
};

/**
 * Apply enrichment to a deity object
 */
function enrichDeity(deity, enrichmentData) {
  if (!enrichmentData) return deity;

  const enriched = { ...deity };

  // Add new fields
  if (enrichmentData.mythology) {
    enriched.mythologyNarrative = enrichmentData.mythology;
  }

  if (enrichmentData.dualism) {
    enriched.dualism = enrichmentData.dualism;
  }

  if (enrichmentData.worship) {
    enriched.worship = enrichmentData.worship;
  }

  if (enrichmentData.sources) {
    enriched.sacredSources = enrichmentData.sources;
  }

  if (enrichmentData.extendedContent) {
    enriched.extendedContent = enrichmentData.extendedContent;
  }

  // Update metadata
  enriched.metadata = enriched.metadata || {};
  enriched.metadata.persianMythologyEnriched = true;
  enriched.metadata.enrichedAt = new Date().toISOString();
  enriched.metadata.enrichmentSource = 'enrich-persian-mythology.js';
  enriched.metadata.enrichmentVersion = '1.0';

  return enriched;
}

/**
 * Main enrichment function
 */
function enrichPersianAssets() {
  console.log('Starting Persian Mythology Enrichment...\n');

  let totalEnriched = 0;

  // Process deities
  if (fs.existsSync(DEITIES_PATH)) {
    console.log('Processing deities...');
    const deitiesRaw = fs.readFileSync(DEITIES_PATH, 'utf-8');
    let deities = JSON.parse(deitiesRaw);

    // Handle both array and object formats
    const isArray = Array.isArray(deities);
    const deitiesArray = isArray ? deities : Object.values(deities);

    let deitiesEnriched = 0;
    const enrichedDeities = deitiesArray.map(deity => {
      const id = deity.id || '';
      const enrichment = PERSIAN_ENRICHMENT[id];

      if (enrichment) {
        deitiesEnriched++;
        console.log(`  Enriched: ${deity.name || id}`);
        return enrichDeity(deity, enrichment);
      }
      return deity;
    });

    // Write back
    const output = isArray ? enrichedDeities : Object.fromEntries(
      enrichedDeities.map((d, i) => [Object.keys(deities)[i], d])
    );

    fs.writeFileSync(DEITIES_PATH, JSON.stringify(output, null, 2));
    console.log(`  Total deities enriched: ${deitiesEnriched}\n`);
    totalEnriched += deitiesEnriched;
  }

  // Process cosmology
  if (fs.existsSync(COSMOLOGY_PATH)) {
    console.log('Processing cosmology...');
    const cosmologyRaw = fs.readFileSync(COSMOLOGY_PATH, 'utf-8');
    let cosmology = JSON.parse(cosmologyRaw);

    const isArray = Array.isArray(cosmology);
    const cosmologyArray = isArray ? cosmology : Object.values(cosmology);

    let cosmologyEnriched = 0;
    const enrichedCosmology = cosmologyArray.map(item => {
      const enriched = { ...item };

      // Add dualism context to all Persian cosmology
      if (!enriched.dualismContext) {
        enriched.dualismContext = COSMOLOGY_ENRICHMENT.dualism;
        enriched.metadata = enriched.metadata || {};
        enriched.metadata.persianMythologyEnriched = true;
        enriched.metadata.enrichedAt = new Date().toISOString();
        cosmologyEnriched++;
        console.log(`  Enriched: ${item.name || item.id}`);
      }

      return enriched;
    });

    const output = isArray ? enrichedCosmology : Object.fromEntries(
      enrichedCosmology.map((d, i) => [Object.keys(cosmology)[i], d])
    );

    fs.writeFileSync(COSMOLOGY_PATH, JSON.stringify(output, null, 2));
    console.log(`  Total cosmology items enriched: ${cosmologyEnriched}\n`);
    totalEnriched += cosmologyEnriched;
  }

  console.log('='.repeat(50));
  console.log(`Persian Mythology Enrichment Complete!`);
  console.log(`Total items enriched: ${totalEnriched}`);
  console.log('='.repeat(50));

  return totalEnriched;
}

// Run enrichment
const count = enrichPersianAssets();
console.log(`\nEnrichment finished. ${count} items enriched.`);

/**
 * Enrich Japanese Mythology - Add Historical Context
 *
 * This script enriches Japanese mythology entities with historical metadata including:
 * - Shrine Sites: Major shrines associated with each deity
 * - Festival Associations: Matsuri and ritual celebrations
 * - Buddhist Equivalents: Honji suijaku (original essence) connections
 * - Imperial Connections: Ties to imperial family and state Shinto
 * - Historical Periods: Kojiki/Nihon Shoki references
 *
 * Sources:
 * - Kojiki (712 CE) - Oldest Japanese mythology record
 * - Nihon Shoki (720 CE) - First official history
 * - Buddhist-Shinto syncretism (8th-19th centuries)
 * - State Shinto period (1868-1945)
 */

const fs = require('fs');
const path = require('path');

// Historical metadata for Japanese deities
const historicalMetadata = {
  'japanese_amaterasu': {
    historicalPeriod: 'Kojiki (712 CE) and Nihon Shoki (720 CE)',
    sourceText: 'Kojiki - Book 1: Divine Origin; Nihon Shoki - First Chronicle',
    shrineSites: [
      {
        name: 'Ise Grand Shrine (Ise Jingu)',
        location: 'Ise, Mie Prefecture',
        founded: '4 BCE (traditional)',
        significance: 'Most sacred Shinto shrine, home to Sacred Mirror (Yata no Kagami)',
        importance: 'highest',
        notes: 'Imperial pilgrimage site; Architectural style: Shinmei-zukuri'
      },
      {
        name: 'Tsurugaoka Hachimangu',
        location: 'Kamakura, Kanagawa Prefecture',
        founded: '1180 CE',
        significance: 'Important secondary shrine; reflects syncretism with Buddhist Hachiman',
        importance: 'high'
      }
    ],
    festivalAssociations: [
      {
        name: 'Oharaimatsuri (Great Purification Festival)',
        period: 'June 30 and December 31',
        location: 'Ise Grand Shrine',
        significance: 'Ritual purification of the realm'
      },
      {
        name: 'Kanname Festival (Kannamesai)',
        period: 'October 15-17',
        location: 'Ise Grand Shrine',
        significance: 'Harvest gratitude to Amaterasu'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Dainichi Nyorai (Vairocana Buddha)',
        connection: 'Honji suijaku: Amaterasu as manifestation of Dainichi',
        period: 'Heian period (794-1185 CE)',
        significance: 'Peak of Buddhist-Shinto syncretism'
      }
    ],
    imperialConnections: {
      ancestress: true,
      imperialLegitimacy: 'Source of imperial divine descent (Tenshin)',
      yataNoKagami: 'One of Three Sacred Treasures (Imperial Regalia)',
      stateShinto: 'Venerated under State Shinto (1868-1945)',
      modernStatus: 'Central to emperor worship and national identity'
    },
    historicalNotes: [
      'Central to Yamato expansion and imperial ideology',
      'Cave mythology (Iwato) - cosmological significance',
      'Influenced imperial succession legitimacy',
      'Pivot of female goddess prominence in East Asian mythology',
      'Her retreat created cosmic darkness - archetype of withdrawal narrative'
    ]
  },

  'japanese_izanagi': {
    historicalPeriod: 'Kojiki (712 CE) and Nihon Shoki (720 CE)',
    sourceText: 'Kojiki - Book 1: Creation myth; Nihon Shoki - Primordial deities',
    shrineSites: [
      {
        name: 'Izanagi Shrine (Izanagi-jingu)',
        location: 'Awaji Island, Hyogo Prefecture',
        founded: 'Pre-historical (traditional)',
        significance: 'Mythological birthplace of Japan (Onogoro Island)',
        importance: 'highest',
        notes: 'One of the oldest shrines in Japan'
      }
    ],
    festivalAssociations: [
      {
        name: 'Izanagi Matsuri',
        period: 'Annually (varying dates)',
        location: 'Izanagi-jingu',
        significance: 'Celebration of creation and primordial deity'
      }
    ],
    imperialConnections: {
      creatorDeity: true,
      imperialLegitimacy: 'Grandfather of Amaterasu - grandfather of imperial line',
      createJapan: 'Mythological creator of Japanese islands',
      stateShinto: 'Key figure in nationalist mythology'
    },
    historicalNotes: [
      'Creation myth parallels: Mesopotamian, Polynesian traditions',
      'Male-female cosmic pair principle (yin-yang precursor)',
      'Shinto concept of purification (misogi) originating from his purification',
      'Yomi (underworld) visit establishes death realm mythology',
      'Post-death form influenced later Buddhist concepts of hell'
    ]
  },

  'japanese_izanami': {
    historicalPeriod: 'Kojiki (712 CE) and Nihon Shoki (720 CE)',
    sourceText: 'Kojiki - Book 1: Creation and death; Nihon Shoki - First creators',
    shrineSites: [
      {
        name: 'Izanami Shrine (parts of Izanagi-jingu complex)',
        location: 'Awaji Island, Hyogo Prefecture',
        founded: 'Pre-historical (traditional)',
        significance: 'Associated with creation and regeneration cycles',
        importance: 'high'
      }
    ],
    festivalAssociations: [
      {
        name: 'Creation Festival (part of Izanagi Matsuri)',
        period: 'Annually',
        location: 'Izanagi-jingu',
        significance: 'Honors both creators'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Kannon (Avalokiteshvara) - compassionate form',
        connection: 'Death and regeneration parallels',
        period: 'Heian period onwards',
        significance: 'Maternal compassion archetype'
      }
    ],
    imperialConnections: {
      creatorDeity: true,
      imperialLegitimacy: 'Grandmother of imperial line through Amaterasu',
      motherOfJapan: 'Mythological mother of Japanese islands'
    },
    historicalNotes: [
      'Death narrative central to Shinto underworld (Yomi) concept',
      'Precursor to Buddhist hell imagery',
      'Female creator archetype - unique in patriarchal traditions',
      'Death and pollution (kegare) concepts - foundational to purification rituals',
      'Her death paradox: brings death but also regeneration'
    ]
  },

  'japanese_susanoo': {
    historicalPeriod: 'Kojiki (712 CE) and Nihon Shoki (720 CE)',
    sourceText: 'Kojiki - Books 1-2: Storm god and hero narrative',
    shrineSites: [
      {
        name: 'Izumo Taisha',
        location: 'Izumo, Shimane Prefecture',
        founded: 'Pre-historical (traditional)',
        significance: 'Primary shrine; associated with Susanoo\'s dragon-slaying',
        importance: 'highest',
        notes: 'Second most important shrine after Ise Grand Shrine in Shinto hierarchy'
      },
      {
        name: 'Kumano Nachi Taisha',
        location: 'Kumano, Wakayama Prefecture',
        founded: '1000 BCE (traditional)',
        significance: 'Kumano shrine complex - Susanoo associated with mountain spirituality',
        importance: 'high'
      },
      {
        name: 'Atsuta Shrine',
        location: 'Nagoya, Aichi Prefecture',
        founded: '5 BCE (traditional)',
        significance: 'Houses one of Three Sacred Treasures (Kusanagi sword)',
        importance: 'high'
      }
    ],
    festivalAssociations: [
      {
        name: 'Izumo Festival (Izumo Matsuri)',
        period: 'November 23',
        location: 'Izumo Taisha',
        significance: 'Honors Susanoo and kami gathering'
      },
      {
        name: 'Gion Matsuri',
        period: 'July 17',
        location: 'Kyoto',
        significance: 'Dragon deity worship; storm and purification themes'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Gozu Tenno (Ox-headed King)',
        connection: 'Honji suijaku - Susanoo as manifestation',
        period: 'Heian period (794-1185 CE)',
        significance: 'Plague prevention deity fusion'
      }
    ],
    imperialConnections: {
      kusanagi: 'One of Three Sacred Treasures (Imperial Regalia)',
      yakumo: 'Associated with poetic establishment of domain',
      heroNarrative: 'Hero archetype - demon-slaying legitimizes rule',
      stateShinto: 'Important in nationalist mythology'
    },
    historicalNotes: [
      'Yamata no Orochi (eight-headed dragon) mythology',
      'Likely reflects historical conflicts: Yamato vs Izumo peoples',
      'Chaos deity subdued: represents imperial control of chaos',
      'Rainfall/agriculture significance - farmer concerns',
      'Duality: chaos and culture-bringing (sword, mirror, agriculture)',
      'Storm god archetype across Indo-European traditions (comparison: Thor, Zeus)'
    ]
  },

  'japanese_tsukuyomi': {
    historicalPeriod: 'Kojiki (712 CE) and Nihon Shoki (720 CE)',
    sourceText: 'Kojiki - Book 1: Cosmological separation of day/night',
    shrineSites: [
      {
        name: 'Tsukiyomi Shrine',
        location: 'Ise, Mie Prefecture',
        founded: 'Pre-historical (traditional)',
        significance: 'Part of Ise Shrine complex but separate from Amaterasu',
        importance: 'high',
        notes: 'Architectural arrangement reflects day/night separation myth'
      }
    ],
    festivalAssociations: [
      {
        name: 'Tsukimi (Moon Viewing Festival)',
        period: 'Mid-autumn (August/September lunar calendar)',
        location: 'Throughout Japan',
        significance: 'Popular observance; poetic moon appreciation'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Gakkō Bosatsu (Moon Bodhisattva)',
        connection: 'Buddhist lunar deity parallel',
        period: 'Heian period onwards',
        significance: 'Part of trinities (with solar deities)'
      }
    ],
    imperialConnections: {
      cosmological: true,
      balance: 'Complementary to Amaterasu - sun/moon duality',
      minorStatus: 'Less prominent in imperial cult than Amaterasu'
    },
    historicalNotes: [
      'Gender ambiguity - sometimes male, sometimes female depending on source',
      'Mythological explanation for day-night separation',
      'Food scandal (Kuchinanashi) - explains sun-moon distance',
      'Lesser prominence reflects gendered power dynamics',
      'Influenced by lunar calendar agricultural society needs'
    ]
  },

  'japanese_amaterasu': {
    // (continued from first entry)
  },

  'japanese_raijin': {
    historicalPeriod: 'Kojiki and Nihon Shoki (early references); Developed in Heian period',
    sourceText: 'Raijin imagery elaborated in Heian Buddhist texts and art',
    shrineSites: [
      {
        name: 'Kasuga Taisha',
        location: 'Nara, Nara Prefecture',
        founded: '768 CE',
        significance: 'Associated with thunder and weather deities',
        importance: 'high'
      },
      {
        name: 'Thunder Shrine shrines',
        location: 'Throughout Japan',
        founded: 'Various (Heian onwards)',
        significance: 'Local shrines for thunder/crop protection',
        importance: 'medium'
      }
    ],
    festivalAssociations: [
      {
        name: 'Gion Matsuri (festival component)',
        period: 'July',
        location: 'Kyoto',
        significance: 'Thunder and plague prevention element'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Raijin (adopted into Buddhist pantheon)',
        connection: 'Direct adoption - retains name and iconography',
        period: 'Heian period (794-1185 CE)',
        significance: 'Shows extent of syncretism'
      },
      {
        buddhistName: 'Taishakuten (Indra)',
        connection: 'Buddhist thunder deity influence',
        period: 'Overlapping traditions',
        significance: 'Hindu-Buddhist-Shinto triple influence'
      }
    ],
    historicalNotes: [
      'Agricultural significance - rainfall for crops',
      'Elaborated in Heian period art and literature',
      'Iconography: drum, naked man, aggressive posture',
      'Often paired with Fujin (wind) - natural forces pairing',
      'Plague prevention association (thunder = purification)',
      'Represents human desire to control natural forces'
    ]
  },

  'japanese_fujin': {
    historicalPeriod: 'Developed in Heian period (794-1185 CE)',
    sourceText: 'Raijin and Fujin depicted in Heian mandala art',
    shrineSites: [
      {
        name: 'Wind shrines (local)',
        location: 'Throughout Japan',
        founded: 'Heian period onwards',
        significance: 'Local worship for wind/weather control',
        importance: 'medium'
      }
    ],
    festivalAssociations: [
      {
        name: 'Wind festivals (local variations)',
        period: 'Seasonal',
        location: 'Throughout Japan',
        significance: 'Agricultural wind control and safety'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Vayu (Hindu wind god)',
        connection: 'Buddhist philosophical influence',
        period: 'Heian period',
        significance: 'Hindu-Buddhist syncretism'
      }
    ],
    historicalNotes: [
      'Later development compared to primordial deities',
      'Paired with Raijin - natural forces duality',
      'Wind control for agriculture - farmer spirituality',
      'Wind bag iconography - breath and life force',
      'Less prominent in state ideology than Amaterasu'
    ]
  },

  'japanese_inari': {
    historicalPeriod: 'Early Heian period (8th-9th century CE)',
    sourceText: 'References in Heian Buddhist texts; Mass devotion from medieval period',
    shrineSites: [
      {
        name: 'Fushimi Inari Taisha',
        location: 'Kyoto, Kyoto Prefecture',
        founded: '711 CE',
        significance: 'Largest Inari shrine; thousands of vermillion torii gates',
        importance: 'highest',
        notes: 'Most visited Shinto shrine in Japan'
      },
      {
        name: 'Inari shrines (thousands of branch shrines)',
        location: 'Throughout Japan',
        founded: 'Heian period onwards',
        significance: 'Most ubiquitous kami worship in Japan',
        importance: 'high',
        notes: 'More popular locally than central shrines'
      }
    ],
    festivalAssociations: [
      {
        name: 'Hatsuuma Festival (First Horse Festival)',
        period: 'February 1-7 (traditional); varied modern dates',
        location: 'Fushimi Inari Taisha',
        significance: 'Major festival; petition for good harvest and prosperity'
      },
      {
        name: 'Omagatoki (Twilight) Festival',
        period: 'August',
        location: 'Local Inari shrines',
        significance: 'Evening kami worship'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Dakiniten (female fox deity)',
        connection: 'Honji suijaku - Inari as Buddhist manifestation',
        period: 'Medieval period (1185-1603 CE)',
        significance: 'Tantric Buddhism influence'
      }
    ],
    imperialConnections: {
      patronage: 'Imperial patronage despite folk origins',
      prosperity: 'Associated with imperial abundance and longevity',
      merchant: 'Popular with merchant class'
    },
    historicalNotes: [
      'Originally grain/agriculture deity - rice cultivation',
      'Fox association (kitsune) - shapeshifter mythology',
      'Highest female kami popularity (exceeds Amaterasu in local devotion)',
      'Medieval syncretism: Buddhist tantra influence',
      'Merchant adoption - prosperity god for commerce',
      'Gender ambiguity - sometimes male, female, or genderless',
      'Most egalitarian shrine access - ubiquitous folk worship'
    ]
  },

  'japanese_okuninushi': {
    historicalPeriod: 'Kojiki (712 CE) and Nihon Shoki (720 CE) - Izumo mythology cycle',
    sourceText: 'Kojiki - Books 1-2: Izumo traditions; Mythological justification for Yamato rule',
    shrineSites: [
      {
        name: 'Izumo Taisha',
        location: 'Izumo, Shimane Prefecture',
        founded: 'Pre-historical (traditional)',
        significance: 'Primary shrine; Okuninushi\'s palace (mythology)',
        importance: 'highest',
        notes: 'Second highest rank in official Shinto hierarchy'
      },
      {
        name: 'Sada Shrine',
        location: 'Izumo, Shimane Prefecture',
        founded: '1667 CE',
        significance: 'Related to Okuninushi\'s consort mythology',
        importance: 'high'
      }
    ],
    festivalAssociations: [
      {
        name: 'Izumo Festival (Izumo Matsuri)',
        period: 'November 23',
        location: 'Izumo Taisha',
        significance: 'Kami gathering from across Japan (Kamiarizuki - Month of Kami)'
      },
      {
        name: 'Kamaasobi (Kami sports)',
        period: 'November (Kamiarizuki)',
        location: 'Izumo',
        significance: 'Entertainment for gathered kami - unique ritual'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Daikokuten (Great Black/Wealth deity)',
        connection: 'Honji suijaku - Okuninushi as Daikokuten manifestation',
        period: 'Heian period (794-1185 CE)',
        significance: 'Wealth and prosperity fusion'
      }
    ],
    imperialConnections: {
      challenged: 'Yamato conquest myth - peaceful submission',
      izumoTradition: 'Represents pre-Yamato Izumo kingdom',
      reconciliation: 'Mythological reconciliation with Amaterasu descent',
      politicalSignificance: 'Legitimizes Yamato rule over former Izumo'
    },
    historicalNotes: [
      'Represents Izumo indigenous beliefs absorbed by Yamato',
      'Land division myth: Okuninushi underground, Amaterasu heavens',
      'Eighty-one trials - shaman initiation narrative pattern',
      'Most successful local kami to maintain prominence after unification',
      'Benevolent ruler archetype - contrasts with Amaterasu imperialism',
      'Medical/healing associations - deer god legend',
      'Enactment/re-enactment (Kagurasai) central to worship',
      'Represents alternative cosmological vision (before Yamato dominance)'
    ]
  },

  'japanese_hachiman': {
    historicalPeriod: 'Medieval development (11th-16th centuries); Syncretism peak',
    sourceText: 'Hachiman worship elaborated in medieval military culture and Buddhist texts',
    shrineSites: [
      {
        name: 'Tsurugaoka Hachimangu',
        location: 'Kamakura, Kanagawa Prefecture',
        founded: '1180 CE',
        significance: 'Samurai patron shrine; Kamakura shogunate connection',
        importance: 'highest',
        notes: 'Central to samurai culture and bushido ideology'
      },
      {
        name: 'Usa Shrine (Usa Jingu)',
        location: 'Usa, Oita Prefecture',
        founded: '725 CE',
        significance: 'Original Hachiman shrine; military deity tradition',
        importance: 'high'
      },
      {
        name: 'Hachiman shrines (throughout Japan)',
        location: 'Throughout Japan',
        founded: 'Medieval period onwards',
        significance: 'Second most ubiquitous shrines after Inari',
        importance: 'high'
      }
    ],
    festivalAssociations: [
      {
        name: 'Hachiman Matsuri (Yabusame Archery)',
        period: 'Varies by shrine; September 15 (Tsurugaoka)',
        location: 'Tsurugaoka Hachimangu',
        significance: 'Mounted archery ritual - samurai martial culture'
      },
      {
        name: 'Reitaisai (Grand Festival)',
        period: 'September',
        location: 'Usa Shrine',
        significance: 'Ancient tradition; martial ceremony'
      }
    ],
    buddhistEquivalents: [
      {
        buddhistName: 'Hachiman (direct adoption)',
        connection: 'Complete Buddhist integration - renamed deity',
        period: 'Heian period peak syncretism (794-1185 CE)',
        significance: 'Exemplifies Shinbutsu-shugo (Buddhist-Shinto unity)'
      },
      {
        buddhistName: 'Bodhisattva manifestation',
        connection: 'Viewed as Buddhist enlightened being',
        period: 'Medieval period',
        significance: 'Military class patronage'
      }
    ],
    imperialConnections: {
      military: 'War god - adopted by samurai class',
      shogunate: 'Tokugawa shogunate patronage',
      state: 'State Shinto militarism period (1868-1945)'
    },
    historicalNotes: [
      'Originally Emperor Ojin deification (military leader)',
      'Medieval militarization - warrior class patron',
      'Peak syncretism: Hachiman as Bodhisattva and kami simultaneously',
      'Yabusame (mounted archery) - ritualized samurai martial practice',
      'Bushido ideology connection - loyalty and martial virtue',
      'Decline after WWII - association with militarism',
      'Modern recovery in martial arts and cultural traditions',
      'Second-order kami - derived from historical emperor'
    ]
  }
};

/**
 * Update individual deity files with historical metadata
 */
function enrichJapaneseMythology() {
  const deityDirectory = path.join(__dirname, '../firebase-assets-downloaded/deities');

  // Japanese deity files to update
  const japaneseDeities = [
    'japanese_amaterasu.json',
    'japanese_izanagi.json',
    'japanese_izanami.json',
    'japanese_susanoo.json',
    'japanese_tsukuyomi.json',
    'japanese_raijin.json',
    'japanese_fujin.json',
    'japanese_inari.json',
    'japanese_okuninushi.json',
    'japanese_hachiman.json'
  ];

  const results = {
    updated: [],
    failed: [],
    total: japaneseDeities.length
  };

  japaneseDeities.forEach(filename => {
    const filepath = path.join(deityDirectory, filename);
    const deityId = filename.replace('.json', '');

    try {
      // Read the file
      const fileContent = fs.readFileSync(filepath, 'utf8');
      let deity = JSON.parse(fileContent);

      // Get historical metadata
      const metadata = historicalMetadata[deityId];
      if (!metadata) {
        console.log(`No metadata for ${deityId}, skipping...`);
        return;
      }

      // Add historical context section
      if (!deity.historicalContext) {
        deity.historicalContext = {};
      }

      // Merge historical metadata
      Object.assign(deity.historicalContext, {
        historicalPeriod: metadata.historicalPeriod,
        sourceText: metadata.sourceText,
        shrineSites: metadata.shrineSites || [],
        festivalAssociations: metadata.festivalAssociations || [],
        buddhistEquivalents: metadata.buddhistEquivalents || [],
        imperialConnections: metadata.imperialConnections || {},
        historicalNotes: metadata.historicalNotes || []
      });

      // Update searchTerms and corpusSearch to include historical info
      if (metadata.historicalNotes && metadata.historicalNotes.length > 0) {
        if (!deity.corpusSearch) {
          deity.corpusSearch = {};
        }
        deity.corpusSearch.historicalContext = metadata.historicalNotes[0];
      }

      // Add metadata flag
      deity._historicalEnhanced = true;
      deity._enhancedAt = new Date().toISOString();

      // Write updated file
      fs.writeFileSync(filepath, JSON.stringify(deity, null, 2));
      results.updated.push({
        file: filename,
        id: deityId,
        shrineSites: metadata.shrineSites?.length || 0,
        festivals: metadata.festivalAssociations?.length || 0,
        notes: metadata.historicalNotes?.length || 0
      });

      console.log(`✓ Enhanced ${deityId}`);
    } catch (error) {
      results.failed.push({
        file: filename,
        error: error.message
      });
      console.error(`✗ Failed to enhance ${filename}: ${error.message}`);
    }
  });

  return results;
}

/**
 * Generate analysis report
 */
function generateAnalysisReport() {
  const report = {
    title: 'Japanese Mythology Historical Analysis',
    date: new Date().toISOString(),
    overview: {
      mythologyOrigins: 'Kojiki (712 CE) and Nihon Shoki (720 CE)',
      historicalPeriods: [
        'Primordial period (creation myths)',
        'Ancient period (Imperial court)',
        'Buddhist-Shinto syncretism (8th-19th centuries)',
        'Medieval militarization (11th-16th centuries)',
        'Edo period formalization (1603-1868)',
        'State Shinto (1868-1945)',
        'Post-war revival (1945-present)'
      ]
    },
    keyConcepts: {
      shinbutsuShugo: {
        name: 'Buddhist-Shinto Syncretism',
        period: '8th-19th centuries',
        significance: 'Integration of Buddhist philosophy and Shinto worship',
        example: 'Kami viewed as bodhisattva manifestations (honji suijaku)',
        notes: 'Officially ended during Meiji Restoration but practices persist'
      },
      honjiSuijaku: {
        name: 'Original Essence, Local Manifestation',
        meaning: 'Kami as local manifestations of Buddhist deities',
        significance: 'Theological framework for syncretism',
        examples: [
          'Amaterasu = Dainichi Nyorai (Vairocana Buddha)',
          'Inari = Dakiniten (Buddhist wealth deity)',
          'Hachiman = Buddhist Bodhisattva'
        ]
      },
      stateShinto: {
        name: 'State Shinto (Kokka Shinto)',
        period: '1868-1945',
        significance: 'Imperial nationalism ideology',
        focus: 'Amaterasu and imperial divinity',
        notes: 'Separated from Buddhism to establish state religion'
      }
    },
    deityAnalysis: {
      primordialDeities: {
        names: ['Izanagi', 'Izanami'],
        significance: 'Creation deities - cosmological foundation',
        source: 'Kojiki primordial myth cycle',
        characteristics: 'Paired masculine-feminine, life-death duality'
      },
      celestialDeities: {
        names: ['Amaterasu', 'Tsukuyomi'],
        significance: 'Solar-lunar cosmology; celestial order',
        source: 'Kojiki sky realm narrative',
        characteristics: 'Sun-moon separation myth explains day-night cycle'
      },
      stormDeities: {
        names: ['Susanoo', 'Raijin', 'Fujin'],
        significance: 'Natural forces control; agricultural fertility',
        characteristics: 'Chaos/order balance; precipitation control',
        notes: 'Raijin and Fujin developed later, elaborate in Heian period art'
      },
      agriculturalDeities: {
        names: ['Inari', 'Okuninushi'],
        significance: 'Food production and prosperity',
        characteristics: 'Widespread folk devotion; merchant patronage',
        notes: 'Inari highest popular shrine visitation'
      },
      militaryDeities: {
        names: ['Hachiman'],
        significance: 'Medieval samurai patronage',
        characteristics: 'War god; bushido ideology',
        notes: 'Modern association with militarism declining'
      }
    },
    shrinePriority: [
      {
        rank: 1,
        name: 'Ise Grand Shrine (Ise Jingu)',
        deity: 'Amaterasu',
        significance: 'Highest in official Shinto hierarchy; Imperial cult center'
      },
      {
        rank: 2,
        name: 'Izumo Taisha',
        deity: 'Susanoo, Okuninushi',
        significance: 'Second rank; represents pre-Yamato traditions'
      },
      {
        rank: 3,
        name: 'Kasuga Taisha',
        deity: 'Multiple (Raijin)',
        significance: 'Nara imperial connections; Buddhist syncretism'
      },
      {
        rank: 4,
        name: 'Fushimi Inari Taisha',
        deity: 'Inari',
        significance: 'Most popular by visitor numbers; folk worship prominence'
      }
    ],
    bibliography: [
      'Kojiki (712 CE) - "Records of Ancient Matters"',
      'Nihon Shoki (720 CE) - "Chronicles of Japan"',
      'Engi Shiki (927 CE) - "Procedures of the Engi Era"',
      'Shoku Nihongi (797 CE) - "Continued Chronicles of Japan"',
      'Jinnō Shōtōki (1339 CE) - "Record of the Legitimate Succession of Divine Emperors"',
      'Buddhist-Shinto syncretism texts (Heian period)',
      'State Shinto documents (Meiji period, 1868-1912)',
      'Modern scholarship on Japanese mythology and religious history'
    ]
  };

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(70));
  console.log('Japanese Mythology Historical Enrichment Script');
  console.log('='.repeat(70));
  console.log();

  // Generate report
  console.log('Generating analysis report...');
  const report = generateAnalysisReport();
  const reportPath = path.join(__dirname, '../docs/japanese-mythology-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ Report saved to ${reportPath}`);
  console.log();

  // Enrich deity files
  console.log('Enriching Japanese mythology deity files...');
  const results = enrichJapaneseMythology();
  console.log();

  // Summary
  console.log('='.repeat(70));
  console.log('ENRICHMENT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total files: ${results.total}`);
  console.log(`Successfully enhanced: ${results.updated.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log();

  if (results.updated.length > 0) {
    console.log('Enhanced deities:');
    results.updated.forEach(item => {
      console.log(`  - ${item.id}`);
      console.log(`    Shrine sites: ${item.shrineSites}`);
      console.log(`    Festival associations: ${item.festivals}`);
      console.log(`    Historical notes: ${item.notes}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\nFailed files:');
    results.failed.forEach(item => {
      console.log(`  - ${item.file}: ${item.error}`);
    });
  }

  console.log();
  console.log('='.repeat(70));
  console.log('Enhancement complete!');
  console.log('='.repeat(70));

  return results;
}

// Execute
if (require.main === module) {
  main();
}

module.exports = {
  historicalMetadata,
  enrichJapaneseMythology,
  generateAnalysisReport
};

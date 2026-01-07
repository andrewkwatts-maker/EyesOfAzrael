#!/usr/bin/env node

/**
 * Mesopotamian Historical Enhancement Script
 *
 * Adds comprehensive historical metadata to Mesopotamian deities:
 * - Cuneiform source references (tablets and texts)
 * - Temple names (E-names) and locations
 * - Astrological/celestial associations
 * - City patronage and cult centers
 * - Historical period developments
 * - Akkadian/Babylonian/Assyrian transformation data
 */

const fs = require('fs');
const path = require('path');

// Historical metadata for Mesopotamian deities
const MESOPOTAMIAN_HISTORICAL_DATA = {
  enki: {
    cuneiformSources: [
      {
        text: "Enuma Elish (Babylonian Creation Myth)",
        tablet: "Multiple tablets",
        period: "Late Babylonian (1200 BCE)",
        content: "Father of Marduk; god of wisdom and fresh water; keeper of the Me"
      },
      {
        text: "Atrahasis (Creation Epic)",
        tablet: "Tablets I-III",
        period: "Old Babylonian (1700 BCE)",
        content: "Creates humans to labor for the gods; represents wisdom and cunning"
      },
      {
        text: "Inanna's Descent to the Underworld",
        tablet: "Sumerian poetry cycle",
        period: "Late 3rd Dynasty of Ur (c. 2100 BCE)",
        content: "Grants the Me (divine decrees) to Inanna; represents divine knowledge"
      },
      {
        text: "The Sumerian King List",
        tablet: "Various fragmentary copies",
        period: "Late 3rd Dynasty of Ur (c. 2100 BCE)",
        content: "Associated with Eridu, first city where kingship descended from heaven"
      }
    ],
    templeNames: [
      {
        name: "E-engur",
        meaning: "House of the Abzu (Deep Waters)",
        location: "Eridu",
        period: "Early Sumerian to Late Babylonian",
        significance: "Oldest sacred site in Mesopotamian tradition; built above underground water chambers",
        archaeological: "Settlements date to c. 5400 BCE, making it the earliest known city"
      },
      {
        name: "E-kur",
        meaning: "Mountain House",
        location: "Nippur",
        period: "Sumerian through Assyrian",
        significance: "Shared temple; Enki sometimes worshipped here alongside Enlil",
        archaeological: "One of the most important religious centers in all Mesopotamia"
      }
    ],
    astralAssociations: [
      {
        celestial: "Jupiter",
        association: "God of wisdom, prophecy, and divine knowledge",
        babylonianName: "Marduk-star",
        role: "Controls fate and destiny"
      },
      {
        celestial: "Water element/freshwater sources",
        association: "Tigris and Euphrates rivers flow from his Abzu",
        significance: "Not a planet; rather the cosmic waters beneath the earth"
      }
    ],
    cityPatronage: [
      {
        city: "Eridu",
        region: "Southern Mesopotamia (Sumer)",
        period: "5400-2000 BCE",
        role: "Tutelary god; first city where kingship descended",
        importance: "Sacred center of divine knowledge and magical practice"
      },
      {
        city: "Babylon",
        region: "Central Mesopotamia",
        period: "1900-539 BCE",
        role: "Father of Marduk; honored in Akitu festival",
        importance: "Secondary cult; Enki's wisdom legitimizes Marduk's supremacy"
      }
    ],
    historicalDevelopment: {
      sumerianPeriod: {
        era: "Early Sumerian (3500-2334 BCE)",
        role: "One of the great triad: An (sky), Enlil (air), Enki (water)",
        characteristics: "God of fresh water, wisdom, magic, and healing",
        temples: "E-engur at Eridu",
        texts: "Sumerian poetry and incantations"
      },
      akkadianAssimilation: {
        era: "Akkadian Period (2334-2154 BCE)",
        changes: "Syncretized with Akkadian water gods",
        role: "Maintained wisdom aspect; associated with magical knowledge",
        influence: "Akkadian priests called themselves 'sons of Enki/Ea'"
      },
      babylonianDevelopment: {
        era: "Old Babylonian (1900-1600 BCE)",
        role: "Father of Marduk; keeper of the Me until Inanna/Ishtar takes them",
        transformation: "Becomes secondary god after Marduk's rise",
        significance: "Represents primordial wisdom; Marduk builds upon his knowledge",
        texts: "Enuma Elish acknowledges Ea's original supremacy"
      },
      neoBabylonian: {
        era: "Neo-Babylonian (626-539 BCE)",
        status: "Honored but secondary; Marduk completely dominant",
        role: "Remembered as wise ancestor and Marduk's creator",
        festivals: "Akitu festival acknowledges Ea's ancient wisdom"
      }
    },
    culturalTransformation: {
      name: "Enki to Ea",
      akkadianForm: "Ea (possibly meaning 'house of water')",
      babylonianForm: "Ea or sometimes Enki (Sumerianized)",
      assyrianForm: "Ea or sometimes Ninurta parallels",
      syncretism: "Enki's attributes gradually transferred to Marduk and his son Nabu"
    },
    priestlyTradition: {
      role: "god of āšipu (incantation priests)",
      practice: "Medical and magical practitioners invoked Ea's wisdom",
      invocation: "Spells and incantations often began 'By the command of Ea!'",
      legacy: "Medical practitioners identified as 'sons of Enki/Ea'"
    }
  },

  marduk: {
    cuneiformSources: [
      {
        text: "Enuma Elish (The Babylonian Creation Myth)",
        tablets: "Seven tablets",
        period: "Late Babylonian (c. 1200 BCE), composed during New Year festival",
        content: "Marduk defeats Tiamat, creates humanity, receives fifty names of power"
      },
      {
        text: "Atrahasis",
        tablet: "Tablets I-III",
        period: "Old Babylonian (1700 BCE)",
        content: "Marduk sometimes appears as solution to divine labor crisis"
      },
      {
        text: "Atra-Hasis",
        tablet: "Babylonian flood narrative",
        period: "Old Babylonian",
        content: "Marduk or other gods determine humanity's fate"
      },
      {
        text: "Enuma Elish Recitation",
        tablets: "Temple records",
        period: "Neo-Babylonian (626-539 BCE)",
        content: "Recited during Akitu (New Year) festival in Babylon"
      }
    ],
    templeNames: [
      {
        name: "Esagila",
        meaning: "House of the High Head",
        location: "Babylon",
        period: "Old Babylonian (1900 BCE) to Neo-Babylonian (539 BCE)",
        significance: "Most important temple in Babylon; center of Marduk's cult",
        architectural: "Contained famous ziggurat Etemenanki (possibly Tower of Babel)"
      },
      {
        name: "Etemenanki",
        meaning: "House of the Foundation of Heaven and Earth",
        location: "Babylon (adjacent to Esagila)",
        period: "Neo-Babylonian (626-539 BCE)",
        significance: "Ziggurat dedicated to Marduk; 91 meters tall; one of ancient world's wonders",
        historical: "Built by Nebuchadnezzar II; possibly 'Tower of Babel' of Bible"
      }
    ],
    astralAssociations: [
      {
        celestial: "Jupiter (Marduk-star)",
        babylonianName: "MUL.APIN 'Marduk's star'",
        association: "King of the planets; symbol of divine kingship and cosmic order",
        astronomical: "Brightest planet; represents supremacy and authority"
      },
      {
        celestial: "50 Names of Marduk",
        association: "Each name represents aspect of cosmos or divine function",
        significance: "Akitu festival recitation of 50 names invokes all aspects of creation"
      }
    ],
    cityPatronage: [
      {
        city: "Babylon",
        region: "Central Mesopotamia",
        period: "1900 BCE onwards (but supremacy achieved c. 1600 BCE)",
        role: "Tutelary god; supreme deity",
        importance: "Marduk's rise parallels Babylon's political ascendancy"
      },
      {
        city: "Kutha",
        region: "Central Mesopotamia",
        period: "Various periods",
        role: "Secondary cult center",
        importance: "Associated with underworld aspects (Nergal also worshipped there)"
      }
    ],
    historicalDevelopment: {
      earlyHistory: {
        era: "Old Babylonian Period (1900-1600 BCE)",
        status: "Minor god; local deity of Babylon",
        role: "Son of Ea; warrior god",
        significance: "Gradually gains importance as Babylon's political power grows"
      },
      firstSupremacy: {
        era: "Old Babylonian (c. 1600 BCE)",
        event: "Hammurabi's reign; Marduk elevated to supreme status",
        change: "Replaces Enlil as king of the gods",
        composition: "Enuma Elish composed to legitimize this theological change"
      },
      middleAssyrian: {
        era: "Middle Assyrian (1365-934 BCE)",
        status: "Overshadowed by Assyrian imperial deities (Ashur)",
        role: "Still honored in Babylon; secondary position",
        significance: "Represents conquered Babylonian tradition"
      },
      neoBabylonian: {
        era: "Neo-Babylonian (626-539 BCE)",
        restoration: "Marduk worship fully restored under Nabopolassar and Nebuchadnezzar II",
        grandeur: "Esagila and Etemenanki rebuilt; Akitu festival reaches peak importance",
        significance: "Marduk represents Neo-Babylonian resurgence and cultural pride"
      },
      persianPeriod: {
        era: "Persian (539-331 BCE)",
        status: "Honored by Persians; Cyrus II pays respects to Marduk",
        continuity: "Cult continues; temples maintained",
        significance: "Represents continuity despite imperial change"
      }
    },
    culturalTransformation: {
      origin: "Possibly Amoritic origin (from Mari region)",
      akkadianAdoption: "Adopted and elevated during Akkadian period",
      babylonianSupremacy: "Achieves supreme status during Old Babylonian period",
      theological: "Enuma Elish created to explain his rise to supremacy",
      nameEvolution: "Also known as Bel ('Lord') in later periods"
    },
    politicalAllegory: {
      theory: "Enuma Elish as political mythology",
      interpretation: "Tiamat represents old gods/traditions; Marduk represents Babylon",
      significance: "Divine victory in myth reflects historical political conquest",
      impact: "Marduk worship becomes vehicle for Babylonian identity"
    },
    fiftyNames: {
      significance: "Each name represents cosmic function and divine authority",
      festival: "All fifty names recited during Akitu (New Year) festival",
      period: "Festival occurs at spring equinox; celebrates cosmos renewal",
      theology: "Names encompass: creation, kingship, justice, storm, healing, etc."
    }
  },

  inanna: {
    cuneiformSources: [
      {
        text: "Inanna's Descent to the Underworld",
        tablet: "Sumerian poetry (90 lines)",
        period: "Late 3rd Dynasty of Ur (c. 2100 BCE)",
        content: "Inanna journeys to underworld; stripped of power; threatened with death; rescued",
        significance: "Oldest known myth featuring descent to underworld; influences later traditions"
      },
      {
        text: "Enuma Elish",
        tablet: "Babylonian creation myth",
        period: "Late Babylonian (c. 1200 BCE)",
        content: "Inanna/Ishtar appears as powerful goddess; receives divine powers (Me)"
      },
      {
        text: "The Exaltation of Inanna",
        tablet: "Sumerian hymn",
        period: "Sumerian (3rd millennium BCE)",
        content: "Celebrates Inanna's power and authority; her rise to supremacy"
      },
      {
        text: "Inanna and Ebih",
        tablet: "Sumerian myth",
        period: "Sumerian (3rd millennium BCE)",
        content: "Inanna destroys mountain that refuses to bow to her; displays power"
      }
    ],
    templeNames: [
      {
        name: "Eanna",
        meaning: "House of Heaven",
        location: "Uruk",
        period: "Early Sumerian (3200 BCE) to Persian period",
        significance: "Most important temple of Inanna; one of oldest temples in world",
        architectural: "White Temple; ziggurat dedicated to An and Inanna",
        archaeological: "Archaeological evidence dates to 3200 BCE"
      },
      {
        name: "Ishtar Gate",
        meaning: "Gate of Ishtar",
        location: "Babylon",
        period: "Neo-Babylonian (626-539 BCE)",
        significance: "Magnificent decorated gate; Ishtar's processional route during Akitu",
        architectural: "Blue-glazed bricks with bulls and dragons; one of Seven Wonders",
        historical: "Built by Nebuchadnezzar II; dedicated to Ishtar"
      }
    ],
    astralAssociations: [
      {
        celestial: "Venus",
        babylonianName: "Dilbat (Venus) / Inanna-star",
        association: "Brightest star; visible as morning and evening star",
        significance: "Dual nature mirrors Inanna's dual nature (love and war)"
      },
      {
        celestial: "Lion",
        significance: "Sacred animal; Inanna depicted with lion; represents power and ferocity"
      },
      {
        celestial: "Eight-pointed star",
        meaning: "Inanna's primary symbol; represents her cosmic authority"
      }
    ],
    cityPatronage: [
      {
        city: "Uruk",
        region: "Southern Mesopotamia (Sumer)",
        period: "3200 BCE onwards",
        role: "Tutelary goddess; supreme goddess of Uruk",
        importance: "Eanna temple; center of her worship; Gilgamesh cycle mentions her"
      },
      {
        city: "Erech",
        region: "Southern Mesopotamia",
        period: "Later designation for Uruk",
        role: "Same as Uruk under different name",
        importance: "Bible refers to Erech (Uruk) as city of Inanna/Ishtar"
      },
      {
        city: "Babylon",
        region: "Central Mesopotamia",
        period: "Old Babylonian onwards",
        role: "Ishtar worshipped prominently; Ishtar Gate marks major entrance",
        importance: "Processional route during Akitu festival"
      }
    ],
    historicalDevelopment: {
      sumerianPeriod: {
        era: "Early Sumerian (3200-2334 BCE)",
        role: "Inanna (Sumerian name); goddess of love, war, fertility, and power",
        temples: "Eanna at Uruk; primary cult center",
        characteristics: "Ambitious; demands worship; punishes those who refuse honor",
        mythology: "Descent to underworld; conflicts with Enlil and others"
      },
      akkadianAssimilation: {
        era: "Akkadian Period (2334-2154 BCE)",
        name: "Ishtar (Akkadian form)",
        changes: "Syncretized with Akkadian goddess of same domains",
        expansion: "Worship spreads throughout Akkadian territories",
        characteristics: "Becomes more warlike; military protection role emphasized"
      },
      oldBabylonian: {
        era: "Old Babylonian (1900-1600 BCE)",
        role: "Ishtar/Inanna remains major goddess despite Marduk's rise",
        temples: "Eanna at Uruk; temples throughout Mesopotamia",
        significance: "Less threatened by Marduk's supremacy than male gods",
        mythology: "Her power over fertility and war remains undiminished"
      },
      assyrianEmpire: {
        era: "Middle and Neo-Assyrian (1365-612 BCE)",
        name: "Ishtar (Akkadian designation)",
        role: "Military goddess; protector of Assyrian armies",
        significance: "Major goddess in Assyrian religion; distinct from other Mesopotamian traditions",
        temples: "Dedicated in Ashur, Nineveh, and other major cities"
      },
      neoBabylonian: {
        era: "Neo-Babylonian (626-539 BCE)",
        status: "Prominent goddess; Ishtar Gate represents her importance",
        festivals: "Akitu festival includes Ishtar procession",
        significance: "Represents Mesopotamian cultural continuity and pride"
      }
    },
    dualNature: {
      love: "Goddess of love, sexuality, fertility, and sexual power",
      war: "Goddess of war, battle, weapons, and military victory",
      paradox: "Same goddess embodies these contradictory powers",
      mythology: "Her descent shows limits of even her power; must submit to death temporarily",
      symbolism: "Represents life-giving force and destructive power in same entity"
    },
    priestessClass: {
      name: "Priestesses of Ishtar",
      role: "Religious and administrative authorities",
      significance: "Elevated women's status in Mesopotamian society",
      temple: "Operated from temples; controlled significant wealth and land"
    }
  },

  enlil: {
    cuneiformSources: [
      {
        text: "Atrahasis (The Flood Narrative)",
        tablet: "Tablets I-III",
        period: "Old Babylonian (c. 1700 BCE)",
        content: "Enlil decrees flood to eliminate humanity; represents divine authority over fate"
      },
      {
        text: "Enuma Elish",
        tablet: "Babylonian creation myth",
        period: "Late Babylonian (c. 1200 BCE)",
        content: "Enlil loses supremacy to Marduk; represents older divine order"
      },
      {
        text: "Enlil and the World Order",
        tablet: "Sumerian myth",
        period: "Sumerian (3rd millennium BCE)",
        content: "Establishes principles of cosmic order; delegates responsibilities"
      },
      {
        text: "The Sumerian King List",
        tablet: "Various fragmentary copies",
        period: "Late 3rd Dynasty of Ur (c. 2100 BCE)",
        content: "Enlil grants and withdraws kingship; controls political legitimacy"
      }
    ],
    templeNames: [
      {
        name: "E-kur",
        meaning: "Mountain House' or 'House of the Mountain'",
        location: "Nippur",
        period: "Sumerian through Assyrian (3000 BCE - 612 BCE)",
        significance: "Most important temple in Mesopotamia (not Babylon); Enlil's primary seat",
        religious: "Religious center of Sumer; control of Nippur legitimized political power",
        architectural: "Contained ziggurat Ekur; massive temple complex"
      },
      {
        name: "E-lil",
        meaning: "House of the Wind",
        location: "Nippur",
        period: "Alternative designation for E-kur",
        significance: "Same as E-kur; emphasizes wind/air aspect"
      }
    ],
    astralAssociations: [
      {
        celestial: "Saturn (sometimes)",
        association: "Old age, distance, authority; fits Enlil's role as most powerful ancient god",
        note: "Not definitive; Enlil's astral identity less standardized than others"
      },
      {
        celestial: "Tablets of Destiny",
        significance: "Divine power of fate and kingship; Enlil's primary possession",
        mythology: "Control of tablets = control of world order; later stolen by Anzu and others"
      }
    ],
    cityPatronage: [
      {
        city: "Nippur",
        region: "Central Mesopotamia (Sumer-Akkad border)",
        period: "3000 BCE onwards",
        role: "Tutelary god; supreme religious authority",
        importance: "Religious center of Mesopotamia; control of Nippur = political legitimacy",
        political: "Even non-Nippur rulers had to acknowledge Enlil's supremacy"
      },
      {
        city: "Mesopotamia (general)",
        region: "All of Mesopotamia",
        period: "3rd millennium BCE",
        role: "Supreme god acknowledged throughout region",
        importance: "Represented divine authority over all kings and kingdoms"
      }
    ],
    historicalDevelopment: {
      sumerianPeriod: {
        era: "Early Sumerian (3500-2334 BCE)",
        role: "Supreme god; king of the gods; second only to An",
        status: "Most important deity in Sumerian pantheon",
        functions: "Lord of wind, storms, agriculture; controls fate and kingship",
        temples: "E-kur at Nippur; religious center of Sumer"
      },
      akkadianAdaptation: {
        era: "Akkadian Period (2334-2154 BCE)",
        status: "Maintains supremacy under Akkadian rule",
        role: "Akkadians adopt Enlil worship from Sumer",
        significance: "Enlil remains most powerful god despite Akkadian presence"
      },
      oldBabylonian: {
        era: "Old Babylonian (1900-1600 BCE)",
        status: "Still supreme until Marduk's rise",
        challenge: "Marduk gradually accumulates power; Enuma Elish marks transition",
        theology: "Enlil represents older order; Marduk represents new Babylonian supremacy"
      },
      babylonianSupremacy: {
        era: "New Kingdom Babylon (1600-1200 BCE)",
        displacement: "Marduk replaces Enlil as supreme god",
        status: "Enlil becomes secondary figure in theological hierarchy",
        mythology: "Enuma Elish explicitly describes this replacement"
      },
      neoBabylonian: {
        era: "Neo-Babylonian (626-539 BCE)",
        status: "Remembered as former supreme god; still honored",
        role: "Represents ancient power; Marduk acknowledged as his successor",
        significance: "Enlil's former supremacy legitimizes cosmic order"
      }
    },
    culturalSignificance: {
      supremacy: "Most powerful god until Marduk's rise",
      authority: "Controls fate through Tablets of Destiny",
      kingship: "Grants legitimacy to earthly kings",
      weather: "Controls winds, storms, and weather; agricultural importance",
      decline: "His decline mirrors Babylon's rise and Sumerian cultural eclipse"
    }
  },

  tiamat: {
    cuneiformSources: [
      {
        text: "Enuma Elish (The Babylonian Creation Myth)",
        tablets: "Tablets I-VII (complete composition)",
        period: "Late Babylonian (c. 1200 BCE), but contains older material",
        content: "Primordial chaos goddess; defeated by Marduk; body used to create cosmos",
        composition: "Created or compiled during New Year (Akitu) festival preparations"
      },
      {
        text: "Apsu narrative",
        tablet: "Parts of Enuma Elish",
        period: "Late Babylonian",
        content: "Tiamat's consort; killed by Ea; represents sweet water chaos"
      }
    ],
    templeNames: [
      {
        name: "No direct temples",
        significance: "Tiamat is not worshipped; she represents chaos to be defeated",
        theological: "Her story functions as theological explanation, not divine cult"
      }
    ],
    astralAssociations: [
      {
        celestial: "Primordial salt waters",
        significance: "Represents undifferentiated chaos before creation",
        mythology: "Her body parts become earth, sky, and waters after defeat"
      },
      {
        celestial: "Dragon constellation",
        association: "Represents serpent form; connected to chaos",
        astronomical: "Not a specific constellation; rather a mythological creature"
      }
    ],
    cosmologicalRole: [
      {
        role: "Primordial Mother",
        significance: "Birth-mother of all gods; chaos from which order emerges"
      },
      {
        role: "Chaos Principle",
        significance: "Represents undifferentiated state before creation; must be overcome"
      },
      {
        role: "Political Allegory",
        significance: "May represent displaced traditions or rival cities defeated by Babylon"
      }
    ],
    historicalDevelopment: {
      originsAndDate: {
        origin: "Sumerian origins; Nammu as primordial sea goddess",
        akkadianAdaptation: "Merged with Akkadian chaos concepts",
        babylonianComposition: "Enuma Elish written to explain Babylonian supremacy"
      },
      theologicalPurpose: {
        primary: "Justifies Marduk's supremacy through cosmic victory narrative",
        secondary: "Explains transition from chaos to ordered cosmos",
        political: "Reflects Babylon's conquest of rival cities and absorption of traditions"
      },
      textualHistory: {
        composition: "Likely composed or compiled during Kassite period (1600-1200 BCE)",
        transmission: "Recited during Akitu festival annually",
        preservation: "Preserved in Assyrian library of Ashurbanipal (7th century BCE)"
      }
    },
    mythologicalSignificance: {
      creationMyth: "Enuma Elish explains origin of cosmos from primordial conflict",
      orderVsChaos: "Fundamental cosmic struggle between chaos and organized order",
      defeatRequired: "Creation requires Tiamat's death; order emerges from destruction",
      humanCreation: "Humans created from Tiamat's blood after her defeat"
    },
    crossCulturalParallels: [
      {
        culture: "Egyptian",
        parallel: "Apep (chaos serpent defeated by Ra daily)",
        similarity: "Primordial chaos requiring eternal vigilance"
      },
      {
        culture: "Greek",
        parallel: "Typhon (primordial monster defeated by Zeus)",
        similarity: "Chaos principle defeated by new divine order"
      },
      {
        culture: "Norse",
        parallel: "Jörmungandr (world serpent battled at Ragnarok)",
        similarity: "Serpent representing cosmic chaos"
      },
      {
        culture: "Hindu",
        parallel: "Vritra (dragon defeated by Indra)",
        similarity: "Chaos dragon defeated to restore cosmic order"
      }
    ]
  },

  utu: {
    cuneiformSources: [
      {
        text: "Sumerian temple hymns",
        tablet: "Hymn texts",
        period: "Sumerian (3rd millennium BCE)",
        content: "Praises Utu as just judge and dispenser of light"
      },
      {
        text: "The Exaltation of Utu",
        tablet: "Sumerian poetry",
        period: "Sumerian",
        content: "Celebrates Utu's role as sun god and divine judge"
      },
      {
        text: "Sumerian mythology cycles",
        tablet: "Various texts",
        period: "Sumerian",
        content: "References to Utu in various myths and stories"
      }
    ],
    templeNames: [
      {
        name: "E-babbar",
        meaning: "House of the Bright' or 'House of Light'",
        location: "Sippar",
        period: "Sumerian through Assyrian",
        significance: "Major temple of Utu/Shamash; important religious center",
        religious: "Center of sun god worship; connected to healing and justice"
      },
      {
        name: "E-dim-gal",
        meaning: "House of the Great Judgment",
        location: "Larsa",
        period: "Old Babylonian period",
        significance: "Temple emphasizing Shamash's role as divine judge"
      }
    ],
    astralAssociations: [
      {
        celestial: "The Sun",
        significance: "Utu/Shamash is the sun itself; god of daylight and heat",
        theological: "Each day represents Utu's journey across sky"
      },
      {
        celestial: "Scorpio (in some traditions)",
        association: "Evening sun position; relates to judgment and underworld"
      }
    ],
    cityPatronage: [
      {
        city: "Sippar",
        region: "Central Mesopotamia",
        period: "Sumerian through Sassanid",
        role: "Tutelary god; major cult center",
        importance: "E-babbar temple; important religious and legal center"
      },
      {
        city: "Larsa",
        region: "Southern Mesopotamia",
        period: "Old Babylonian (1900-1763 BCE)",
        role: "Shamash worship prominent",
        importance: "E-dim-gal temple; emphasized justice and judgment"
      }
    ],
    historicalDevelopment: {
      sumerianPeriod: {
        era: "Early Sumerian (3500-2334 BCE)",
        name: "Utu (Sumerian)",
        role: "Sun god; bringer of light; dispenser of justice",
        functions: "Daily journey across sky; judges mortals and gods",
        temples: "E-babbar at Sippar; primary cult center"
      },
      akkadianForm: {
        era: "Akkadian Period (2334-2154 BCE)",
        name: "Shamash (Akkadian form)",
        changes: "Syncretized with Akkadian sun god",
        expanded: "Worship spreads throughout Akkadian territories"
      },
      babylonianContinuity: {
        era: "Old Babylonian (1900-1600 BCE) onwards",
        name: "Shamash (continues)",
        role: "Major deity; associated with law and justice",
        significance: "Code of Hammurabi placed under Shamash's authority",
        legal: "Judges and legal scribes invoke Shamash as divine authority"
      },
      assyrianEmpire: {
        era: "Assyrian periods (1365-612 BCE)",
        status: "Important deity in Assyrian religion",
        role: "Military god; brings light to Assyrian victories",
        temples: "Dedicated in major Assyrian cities"
      }
    },
    culturalSignificance: {
      justice: "Primary association with justice and law",
      light: "Dispels darkness; brings order to cosmos",
      healing: "Associated with medicine and healing through divine knowledge",
      authority: "Legitimates earthly judges and legal codes",
      daily_cycle: "Represents daily renewal and cosmic order"
    }
  },

  sin: {
    cuneiformSources: [
      {
        text: "Sumerian temple hymns",
        tablet: "Hymn texts",
        period: "Sumerian (3rd millennium BCE)",
        content: "Celebrates Sin's role as moon god and measurer of time"
      },
      {
        text: "Various Sumerian myths",
        tablet: "Mythological texts",
        period: "Sumerian",
        content: "Sin appears as father of Utu and Inanna in genealogies"
      }
    ],
    templeNames: [
      {
        name: "E-kish-nu-gal",
        meaning: "House of the Great Light'",
        location: "Ur",
        period: "Sumerian through Neo-Babylonian",
        significance: "Major temple of Sin; primary cult center in southern Mesopotamia",
        religious: "One of most important temples; controlled significant resources",
        restoration: "Rebuilt and restored multiple times; important to Neo-Babylonian rulers"
      },
      {
        name: "E-namtila",
        meaning: "House of the Abundance of Life",
        location: "Harran",
        period: "Old Babylonian through Neo-Babylonian",
        significance: "Major temple in northern Syria-Mesopotamia; important cult center"
      }
    ],
    astralAssociations: [
      {
        celestial: "The Moon",
        significance: "Sin is the moon itself; god of night and lunar cycles",
        theological: "Each lunar month represents one of Sin's cycles"
      },
      {
        celestial: "Taurus (in some traditions)",
        association: "Bull symbolism; represents strength and fertility"
      }
    ],
    cityPatronage: [
      {
        city: "Ur",
        region: "Southern Mesopotamia (Sumer)",
        period: "Early Sumerian through Neo-Babylonian",
        role: "Tutelary god; supreme god of Ur",
        importance: "E-kish-nu-gal temple; major religious and political center",
        historical: "Ur-Nammu built famous ziggurat of Ur for Sin"
      },
      {
        city: "Harran",
        region: "Northern Syria-Mesopotamia",
        period: "Old Babylonian onwards",
        role: "Major cult center; important trade city",
        importance: "Connected to Abraham traditions in later texts"
      }
    ],
    historicalDevelopment: {
      sumerianPeriod: {
        era: "Early Sumerian (3500-2334 BCE)",
        name: "Sin or Nanna (Sumerian)",
        role: "Moon god; measurer of time; father of Utu",
        functions: "Controls lunar cycles; enables calendar-keeping",
        temples: "E-kish-nu-gal at Ur; major religious center"
      },
      akkadianForm: {
        era: "Akkadian Period (2334-2154 BCE)",
        name: "Sin or Nanna-Sin",
        changes: "Syncretized with Akkadian moon god",
        significance: "Maintains importance in Akkadian pantheon"
      },
      oldBabylonian: {
        era: "Old Babylonian (1900-1600 BCE) onwards",
        name: "Sin (standard form)",
        role: "Major deity; controller of time and seasons",
        significance: "Moon god remains important despite Marduk's rise",
        temples: "E-kish-nu-gal at Ur; E-namtila at Harran"
      },
      neoBabylonian: {
        era: "Neo-Babylonian (626-539 BCE)",
        status: "Honored and restored; Sin worship important",
        ruler: "Nabonidus showed special devotion to Sin",
        significance: "Represents cultural continuity with ancient Sumerian tradition"
      }
    },
    specialRole: {
      calendar: "Enables accurate timekeeping and calendar calculations",
      timekeeper: "Measures months and years",
      healer: "Associated with healing and medicine",
      wisdom: "Provides divine wisdom and prophecy"
    }
  },

  ishtar: {
    cuneiformSources: [
      {
        text: "Descent of Inanna",
        tablet: "Sumerian and Akkadian versions",
        period: "Sumerian (3rd millennium) and Babylonian adaptations",
        content: "Ishtar's descent to underworld; death and resurrection"
      },
      {
        text: "Enuma Elish",
        tablet: "Babylonian creation myth",
        period: "Late Babylonian (c. 1200 BCE)",
        content: "Ishtar appears as powerful goddess in assembly of gods"
      },
      {
        text: "Gilgamesh Epic",
        tablet: "Tablets I, VI",
        period: "Standard Babylonian (c. 1200 BCE)",
        content: "Ishtar's propositions to Gilgamesh; her rejected advances"
      }
    ],
    templeNames: [
      {
        name: "Eanna",
        meaning: "House of Heaven",
        location: "Uruk",
        period: "Early Sumerian (3200 BCE) onwards",
        significance: "Primary temple; one of oldest temples in world",
        architectural: "Ziggurat complex; religious and administrative center"
      },
      {
        name: "Ishtar Gate",
        meaning: "Gate of Ishtar",
        location: "Babylon",
        period: "Neo-Babylonian (626-539 BCE)",
        significance: "Magnificent entrance to Babylon; Ishtar's processional route",
        architectural: "Blue-glazed brick; decorated with bulls and dragons",
        historical: "Built by Nebuchadnezzar II; visible remains survive"
      }
    ],
    astralAssociations: [
      {
        celestial: "Venus",
        significance: "Brightest planet; visible as morning and evening star",
        duality: "Mirrors Ishtar's dual nature (love and war)"
      },
      {
        celestial: "Eight-pointed star",
        significance: "Ishtar's primary symbol; represents cosmic authority"
      }
    ],
    cityPatronage: [
      {
        city: "Uruk",
        region: "Southern Mesopotamia (Sumer)",
        period: "3200 BCE onwards",
        role: "Tutelary goddess; equal or supreme authority"
      },
      {
        city: "Babylon",
        region: "Central Mesopotamia",
        period: "Old Babylonian onwards",
        role: "Important goddess; Ishtar Gate marks her significance"
      },
      {
        city: "Nineveh",
        region: "Northern Mesopotamia (Assyria)",
        period: "Assyrian periods",
        role: "Military goddess; protector of Assyrian armies"
      }
    ],
    historicalDevelopment: {
      akkadianTransition: {
        era: "Akkadian adoption of Sumerian Inanna",
        name: "Akkadian: Ishtar; equivalent to Sumerian Inanna",
        expansion: "Worship spreads throughout Akkadian territories",
        syncretism: "Merges characteristics of various regional goddesses"
      },
      babylonianAdaptation: {
        era: "Old Babylonian (1900-1600 BCE) onwards",
        role: "Maintains prominence despite Marduk's rise",
        significance: "Less threatened than male gods by theological changes",
        temples: "Eanna in Uruk; temples throughout Mesopotamia"
      },
      assyrianRole: {
        era: "Assyrian periods (1365-612 BCE)",
        name: "Ishtar (Akkadian designation)",
        adaptation: "Becomes military goddess; protects Assyrian armies",
        significance: "Represents connection between Mesopotamian and Assyrian traditions",
        temples: "Dedicated in Ashur, Nineveh, and other cities"
      },
      neoBabylonian: {
        era: "Neo-Babylonian (626-539 BCE)",
        status: "Prominent goddess; Ishtar Gate represents importance",
        festivals: "Akitu festival includes Ishtar procession",
        significance: "Represents continuity with Mesopotamian past"
      }
    }
  },

  enlilNineveh: {
    note: "Enlil worship continues in Assyrian empire but with different emphasis",
    assyrianRole: "Wind and storm god; maintains importance",
    theological: "Gradually subordinated to Ashur as Assyrian supremacy god",
    significance: "Represents Mesopotamian theological foundations of Assyrian religion"
  }
};

/**
 * Update a deity file with historical metadata
 * @param {string} filePath - Path to deity JSON file
 * @param {string} deityId - Deity ID key in MESOPOTAMIAN_HISTORICAL_DATA
 */
function updateDeityFile(filePath, deityId) {
  try {
    // Read existing file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const deity = JSON.parse(fileContent);

    // Get historical data
    const historicalData = MESOPOTAMIAN_HISTORICAL_DATA[deityId];
    if (!historicalData) {
      console.warn(`No historical data found for deity: ${deityId}`);
      return false;
    }

    // Merge historical data into deity object
    Object.assign(deity, historicalData);

    // Add metadata
    deity._historicallyEnhanced = true;
    deity._enhancedDate = new Date().toISOString();
    deity._enhancementVersion = "1.0";
    deity._dataSource = "Mesopotamian Historical Enhancement - Cuneiform Sources, Archaeological Evidence, and Academic Assyriology";

    // Write updated file
    fs.writeFileSync(filePath, JSON.stringify(deity, null, 2));
    console.log(`✓ Updated ${deityId}: ${filePath}`);
    return true;

  } catch (error) {
    console.error(`✗ Error updating ${deityId}: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Mesopotamian Historical Enhancement Script');
  console.log('==========================================\n');

  const baseDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'deities');
  const deities = Object.keys(MESOPOTAMIAN_HISTORICAL_DATA);

  let successCount = 0;
  let failureCount = 0;

  for (const deityId of deities) {
    const filePath = path.join(baseDir, `${deityId}.json`);

    if (fs.existsSync(filePath)) {
      if (updateDeityFile(filePath, deityId)) {
        successCount++;
      } else {
        failureCount++;
      }
    } else {
      console.warn(`⚠ File not found: ${filePath}`);
      failureCount++;
    }
  }

  console.log('\n==========================================');
  console.log(`Enhancement Complete`);
  console.log(`✓ Successfully updated: ${successCount} deities`);
  console.log(`✗ Failed or missing: ${failureCount} deities`);
  console.log('\nHistorical metadata added:');
  console.log('  - Cuneiform source references (tablets and texts)');
  console.log('  - Temple names and locations (E-names)');
  console.log('  - Astral/celestial associations');
  console.log('  - City patronage and cult centers');
  console.log('  - Historical period development');
  console.log('  - Cultural transformation (Sumerian → Akkadian → Babylonian)');
}

main();

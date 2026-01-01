#!/usr/bin/env node

/**
 * Ritual Metadata Enrichment Script
 *
 * Populates rich metadata for ritual entities in Firebase with:
 * - purpose: Goal of the ritual
 * - participants: Who performs it
 * - timing: When it's performed
 * - materials: Required items/offerings
 * - steps: Key procedural elements
 * - prohibitions: What must be avoided
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Rich metadata templates for different ritual types and mythologies
const ritualMetadataDatabase = {
  // Babylonian rituals
  babylonian_akitu: {
    purpose: "Celebrate the Babylonian New Year, renew cosmic order, and confirm the king's divine legitimacy",
    participants: ["King", "High Priest", "Priests of Marduk", "Citizens", "Temple attendants"],
    timing: "12 days at the spring equinox (Nisan 1-12 in Babylonian calendar)",
    materials: [
      "Royal insignia (crown, scepter, ring, mace)",
      "Cult statues of deities",
      "Enuma Elish tablets",
      "1,000 talents of frankincense",
      "Golden altar and tables",
      "Sacred garments",
      "Animals for sacrifice",
      "Processional barges"
    ],
    steps: [
      "Temple purification and daily offerings (Days 1-4)",
      "Recitation of Enuma Elish creation myth (Day 4)",
      "King's humiliation and striping of insignia (Day 5)",
      "King's negative confession and restoration (Day 5)",
      "Arrival of gods from surrounding cities (Days 6-7)",
      "Divine assembly to determine fates (Day 8)",
      "Great processional to Bit Akitu (Days 9-11)",
      "Sacred marriage ritual (Day 11)",
      "Battle reenactment against chaos (Day 11)",
      "Return to city and final celebrations (Day 12)"
    ],
    prohibitions: [
      "King must not be absent from the city",
      "Festival cannot be omitted without grave consequences",
      "Improper pronunciation of divine names forbidden",
      "Unclean persons cannot approach the temple",
      "The processional way must remain unobstructed"
    ]
  },

  babylonian_divination: {
    purpose: "Divine the will of the gods and predict future events through augury",
    participants: ["Priests", "Diviners", "King's advisors", "Astrologers"],
    timing: "As needed, often before important decisions or military campaigns",
    materials: [
      "Sheep or goat livers (haruspicy)",
      "Clear oil for examination",
      "Observation tablets",
      "Astronomical records",
      "Ritual vessels"
    ],
    steps: [
      "Selection and examination of animal",
      "Careful observation of liver marks and patterns",
      "Recording of specific features (blood color, vein patterns)",
      "Interpretation according to established precedents",
      "Astronomical observation if applicable",
      "Formal pronouncement of divine will"
    ],
    prohibitions: [
      "Must not use diseased animals",
      "False divination results invoke divine punishment",
      "Cannot overturn previously declared will of gods without divine sign",
      "Diviner must be in state of ritual purity"
    ]
  },

  // Buddhist rituals
  buddhist_calendar: {
    purpose: "Mark sacred times in the Buddhist year through observance and meditation",
    participants: ["Monks", "Nuns", "Lay practitioners", "Communities"],
    timing: "Throughout the lunar calendar year (Vesak, Bodhi Day, Loy Krathong, etc.)",
    materials: [
      "Incense and candles",
      "Flowers and fruit offerings",
      "Prayer wheels",
      "Meditation cushions",
      "Sacred texts"
    ],
    steps: [
      "Preparation and purification before observance",
      "Lighting of lamps and incense",
      "Chanting of sutras or mantras",
      "Meditation and mindfulness practice",
      "Circumambulation of stupas or sacred sites",
      "Communal feasting on festival days"
    ],
    prohibitions: [
      "Killing or harming sentient beings",
      "Consuming intoxicants",
      "Engaging in sexual activity on holy days",
      "Disrespect toward the Three Jewels",
      "Speaking false teachings"
    ]
  },

  buddhist_offerings: {
    purpose: "Generate merit and demonstrate devotion to the Buddha and teachings",
    participants: ["Lay practitioners", "Monks", "Nuns", "Families"],
    timing: "Daily, at temples or home altars",
    materials: [
      "Flowers (symbolizing impermanence)",
      "Incense (symbolizing virtue spreading)",
      "Lights/candles (symbolizing wisdom)",
      "Water (symbolizing purity)",
      "Fruit and rice",
      "Monetary donations"
    ],
    steps: [
      "Approach altar or shrine with respectful demeanor",
      "Arrange offerings in proper order",
      "Prostrate or bow in veneration",
      "Chant or recite prayers of intention",
      "Dedicate merit to all sentient beings",
      "Sit in meditation if possible"
    ],
    prohibitions: [
      "Never make offerings with negative intentions",
      "Cannot use stolen or dishonestly gained items",
      "Meat offerings are traditionally avoided",
      "Must not offer alcohol or intoxicants",
      "Offerings must be given with purity of heart"
    ]
  },

  // Christian rituals
  christian_baptism: {
    purpose: "Initiate believers into the Christian faith and cleanse original sin",
    participants: ["Priest or ordained minister", "Baptismal candidate", "Godparents", "Community"],
    timing: "After profession of faith, can occur any time; typically Easter Vigil, Pentecost, or scheduled services",
    materials: [
      "Holy water",
      "Baptismal font or immersion pool",
      "Holy oils (chrism)",
      "White garments",
      "Candle",
      "Prayer book"
    ],
    steps: [
      "Candidate approaches font or immersion pool",
      "Renunciation of sin and Satan (triple or single)",
      "Profession of faith (Trinitarian creed)",
      "Anointing with chrism oil (pre-baptism)",
      "Water immersion or pouring (in Trinitarian formula)",
      "Post-baptism anointing with sacred chrism",
      "Clothing in white garment",
      "Reception of baptismal candle",
      "Chrismation or confirmation (in some traditions)"
    ],
    prohibitions: [
      "Cannot use non-consecrated water",
      "Must be performed by authorized minister",
      "Single immersion or infusion only",
      "Cannot repeat baptism (once baptized, always baptized)",
      "Requires sincere intention and faith"
    ]
  },

  christian_sacraments: {
    purpose: "Transmit God's grace through sacred acts of the church",
    participants: ["Priest", "Deacon", "Believers", "Faithful community"],
    timing: "Varies by sacrament (Eucharist weekly, Penance as needed, Extreme Unction near death)",
    materials: [
      "Bread and wine (Eucharist)",
      "Holy oil (Extreme Unction)",
      "Chrism (Confirmation)",
      "Sacred vestments",
      "Altar",
      "Sacramental oils"
    ],
    steps: [
      "Proper preparation and intention",
      "Administration by authorized minister",
      "Use of correct matter and form",
      "Invocation of the Holy Trinity",
      "Reception by the faithful",
      "Post-sacramental thanksgiving"
    ],
    prohibitions: [
      "Laypeople cannot administer most sacraments",
      "Must use valid matter (bread, wine, oil)",
      "Cannot be performed in state of grave sin (for minister)",
      "Desecration of sacrament is grave offense",
      "Sacraments require proper intention"
    ]
  },

  // Egyptian rituals
  egyptian_mummification: {
    purpose: "Preserve the body for the afterlife and ensure safe passage to the Field of Reeds",
    participants: ["Embalmers", "Priests", "Family members", "Professional mourners"],
    timing: "Upon death, taking 70 days total",
    materials: [
      "Natron salt (drying agent)",
      "Linen wrappings",
      "Canopic jars",
      "Amulets and charms",
      "Oils and perfumes",
      "Resin and pitch",
      "Scarab seals"
    ],
    steps: [
      "Body washing and purification",
      "Removal of internal organs (placement in canopic jars)",
      "Drying with natron salt (40 days)",
      "Wrapping in linen strips and amulets",
      "Application of oils and resin",
      "Placement of amulets and spells",
      "Sealing in sarcophagus",
      "Funerary rites and tomb placement"
    ],
    prohibitions: [
      "Heart must never be removed (seat of soul)",
      "Bodies of enemies could be denied mummification as punishment",
      "Sacred spells must not be mispronounced",
      "Improper handling brings curse",
      "Tomb violation brings divine retribution"
    ]
  },

  egyptian_opet_festival: {
    purpose: "Celebrate the flooding of the Nile and confirm pharaonic rule through divine regeneration",
    participants: ["Pharaoh", "Priests", "Citizens", "Nobles"],
    timing: "During the Nile flood season (Inundation, approximately July-October)",
    materials: [
      "Cult statues of Amun, Mut, Khonsu",
      "Processional barges",
      "Incense and offerings",
      "Royal regalia",
      "Festival food and wine",
      "Sacred vessels"
    ],
    steps: [
      "Opening of temple sanctuaries",
      "Ritual bathing and purification of statues",
      "Procession of divine statues through Luxor",
      "Journey southward by sacred barge",
      "Celebration and feasting",
      "Return procession northward",
      "Renewal of pharaonic covenant",
      "Closing of sanctuaries"
    ],
    prohibitions: [
      "Cannot be held without pharaoh present",
      "Must occur during proper season",
      "Improper incense forbidden",
      "Unclean persons cannot participate",
      "Festival interruption signals broken covenant"
    ]
  },

  // Greek rituals
  greek_offerings: {
    purpose: "Maintain reciprocal relationships with the gods through gifts and sacrifices",
    participants: ["Worshippers", "Priests", "Citizens", "Supplicants"],
    timing: "As needed for thanks, requests, or vows; also during festivals and public ceremonies",
    materials: [
      "Animals (bulls, sheep, goats, birds)",
      "Grain and flour",
      "Wine and libations",
      "Incense and frankincense",
      "Votive gifts (small sculptures, tablets)",
      "Food offerings"
    ],
    steps: [
      "Approach altar with proper intent",
      "Purification of self and animal",
      "Garland the victim if animal sacrifice",
      "Ritual slaughter (if applicable)",
      "Burning of choice portions",
      "Pouring of libations",
      "Shared feast with community",
      "Prayers of thanksgiving or petition"
    ],
    prohibitions: [
      "Cannot offer defective or unhealthy animals",
      "Must not waste the god's portion",
      "Improper invocation brings wrath",
      "Unclean persons cannot approach altar",
      "Oath-breaking after sacrifice brings curse"
    ]
  },

  greek_dionysian_rites: {
    purpose: "Honor Dionysus through ecstatic revelry and transformation of consciousness",
    participants: ["Maenads", "Satyrs", "Citizens", "Slaves", "Women"],
    timing: "Anthesteria (February/March) and other Dionysian festivals throughout year",
    materials: [
      "Wine and grapes",
      "Ivy wreaths and thyrsus wands",
      "Animal victims",
      "Masks and costumes",
      "Musical instruments",
      "Torch fires"
    ],
    steps: [
      "Donning of masks and costumes",
      "Consumption of wine in ritual context",
      "Ecstatic dancing and movement",
      "Theatrical performance and mockery",
      "Temporary inversion of social hierarchies",
      "Animal sacrifice (goat traditional)",
      "Communal feasting",
      "Return to normal consciousness"
    ],
    prohibitions: [
      "Cannot participate in unworthy manner",
      "Ritual must not descend into chaos without control",
      "Sacred madness must be honored, not mocked",
      "Must respect the god's transformative power",
      "Violation brings real madness and punishment"
    ]
  },

  greek_eleusinian_mysteries: {
    purpose: "Initiate into secret mysteries of Demeter and Persephone, promising blessed afterlife",
    participants: ["Initiates of various levels", "Priests", "Chosen few"],
    timing: "Annual Greater Mysteries in Boedromion (September/October)",
    materials: [
      "Kykeon (barley and mint drink)",
      "Sacred items revealed only to initiates",
      "Torches for night ceremony",
      "Procession vestments",
      "Temple of Eleusis"
    ],
    steps: [
      "Purification at sea",
      "Sacrifice of piglets",
      "Procession to Eleusis",
      "Night vigil with fasting",
      "Drinking of kykeon",
      "Viewing of sacred items (anaktoron)",
      "Witnessing of sacred drama",
      "Revelation of mysteries",
      "Celebration and feasting"
    ],
    prohibitions: [
      "Absolute secrecy required - death penalty for revelation",
      "Only those who speak Greek and are free from murder can attend",
      "Slaves and non-citizens excluded",
      "Cannot reveal what is witnessed to uninitiated",
      "Breaking oath brings curse and divine punishment"
    ]
  },

  greek_offerings: {
    purpose: "Maintain reciprocal relationships with the gods through gifts and sacrifices",
    participants: ["Worshippers", "Priests", "Citizens", "Supplicants"],
    timing: "As needed for thanks, requests, or vows; also during festivals and public ceremonies",
    materials: [
      "Animals (bulls, sheep, goats, birds)",
      "Grain and flour",
      "Wine and libations",
      "Incense and frankincense",
      "Votive gifts (small sculptures, tablets)",
      "Food offerings"
    ],
    steps: [
      "Approach altar with proper intent",
      "Purification of self and animal",
      "Garland the victim if animal sacrifice",
      "Ritual slaughter (if applicable)",
      "Burning of choice portions",
      "Pouring of libations",
      "Shared feast with community",
      "Prayers of thanksgiving or petition"
    ],
    prohibitions: [
      "Cannot offer defective or unhealthy animals",
      "Must not waste the god's portion",
      "Improper invocation brings wrath",
      "Unclean persons cannot approach altar",
      "Oath-breaking after sacrifice brings curse"
    ]
  },

  greek_olympic_games: {
    purpose: "Honor Zeus and demonstrate physical excellence through athletic competition",
    participants: ["Athletes (male, freeborn)", "Spectators from across Greece", "Judges", "Priests"],
    timing: "Every four years at Olympia during summer",
    materials: [
      "Athletic equipment (discus, javelin, weights)",
      "Olive wreath crowns",
      "Olympic flame",
      "Sacrifice animals",
      "Stadium facilities",
      "Religious vessels"
    ],
    steps: [
      "Opening procession and oaths",
      "Sacrifice to Zeus",
      "Various athletic competitions over 5 days",
      "Crowning of victors with olive wreaths",
      "Victory processions",
      "Celebration and feasting",
      "Closing ceremony"
    ],
    prohibitions: [
      "Women cannot compete (though separate games exist)",
      "Must be freeborn and Greek",
      "No slaves or non-Greeks allowed",
      "War must cease - Olympic truce (ekecheiria)",
      "Cheating or bribery brings heavy penalties and curses"
    ]
  },

  // Hindu rituals
  hindu_diwali: {
    purpose: "Celebrate the victory of good over evil and the return of Rama to Ayodhya",
    participants: ["Families", "Communities", "All castes", "Devotees"],
    timing: "Five days during Kartik month (October-November), specifically on new moon (Amavasya)",
    materials: [
      "Oil lamps (diyas)",
      "Fireworks",
      "Sweets and confections",
      "New clothes",
      "Rangoli (colored patterns)",
      "Flowers and garlands",
      "Lakshmi statues"
    ],
    steps: [
      "Ritual bathing and dressing in new clothes",
      "Cleaning and decorating homes",
      "Creating rangoli designs",
      "Lighting diyas and lamps",
      "Worship of Lakshmi (goddess of wealth and prosperity)",
      "Exchange of sweets and gifts",
      "Setting off fireworks",
      "Visiting family and friends",
      "Feasting and celebration"
    ],
    prohibitions: [
      "Cannot engage in violence or killing",
      "Gambling traditionally warned against (though widespread)",
      "Must extend goodwill even to enemies",
      "Should not eat meat or drinking alcohol on main day",
      "Must maintain purity and positive thoughts"
    ]
  },

  // Islamic rituals
  islamic_salat: {
    purpose: "Establish direct connection with Allah through prescribed prayer",
    participants: ["All Muslims (five times daily individually or in congregation)", "Imam leads community prayers"],
    timing: "Five times daily (Fajr, Dhuhr, Asr, Maghrib, Isha) at specific times based on sun position",
    materials: [
      "Prayer mat or clean surface",
      "Facing direction of Mecca",
      "Ritual water for ablution",
      "Modest clothing"
    ],
    steps: [
      "Ritual ablution (wudu) - washing of hands, face, arms, feet",
      "Niyyah (intention) to pray",
      "Standing and facing Qibla (Mecca direction)",
      "Takbir (saying 'Allahu Akbar' - God is Greatest)",
      "Recitation of Quran (Al-Fatiha and other surahs)",
      "Ruku (bowing position)",
      "Sujud (prostration with forehead touching ground)",
      "Tashahhud (sitting and testifying)",
      "Taslim (saying peace be upon you - ending prayer)"
    ],
    prohibitions: [
      "Cannot pray with impurity (must perform wudu)",
      "Cannot pray toward direction other than Mecca",
      "Impure thoughts or distractions break focus",
      "Cannot speak during prayer",
      "Women must maintain modesty; some traditions exclude during menses",
      "Must not pray in inappropriate locations"
    ]
  },

  // Norse rituals
  norse_blot: {
    purpose: "Honor the gods and spirits of the land, ensuring fertility, prosperity, and victory",
    participants: ["Chieftain/Gothi", "Community members", "Warriors", "Entire tribe"],
    timing: "Seasonal - Winter nights (Vetrnætr), Midsummer, spring planting, autumn harvest, and as needed",
    materials: [
      "Animals for sacrifice (oxen, pigs, horses, sheep)",
      "Mead or ale",
      "Sacred pole (stallr)",
      "Ritual vessels",
      "Evergreen branches",
      "Fire for roasting meat"
    ],
    steps: [
      "Purification of participants and sacred space",
      "Preparation and blessing of animals",
      "Ritual slaughter of animals",
      "Collection of blood in ritual vessel",
      "Anointing of altar, participants, and witnesses with blood",
      "Burning of choice portions for gods",
      "Roasting of remaining meat",
      "Ritual drinking of mead/ale",
      "Communal feasting and celebration",
      "Skalds reciting poetry and prophecy"
    ],
    prohibitions: [
      "Wounded or deformed animals cannot be sacrificed",
      "Participants must be in right spiritual state",
      "Mockery of the gods brings curse",
      "Blood cannot be wasted",
      "Must not break oath sworn at blot",
      "Ritual must not be interrupted"
    ]
  },

  // Persian rituals
  persian_fire_worship: {
    purpose: "Honor Ahura Mazda and the sacred principle of Asha (truth/order) through fire ceremony",
    participants: ["Zoroastrian priests (Magi)", "Faithful", "Families"],
    timing: "Daily at sacred fire temples; also during seasonal festivals (Gahanbars)",
    materials: [
      "Sacred fire (kept burning continuously)",
      "Sandalwood and other precious woods",
      "Incense and aromatic oils",
      "Sacred ash (from fire)",
      "Ritual robes for priests",
      "Metal fire vessels (braziers)"
    ],
    steps: [
      "Approach fire temple with reverence",
      "Ritual purification with sacred ash",
      "Adding sacred wood to perpetual flame",
      "Prayers of praise to Ahura Mazda",
      "Meditation on Asha (cosmic order)",
      "Receiving ash on forehead as blessing",
      "Optional circumambulation of fire",
      "Communal prayers and declarations of faith"
    ],
    prohibitions: [
      "Fire must never be extinguished (profane death)",
      "Cannot allow saliva, blood, or waste near fire",
      "Must not speak falsehoods in presence of fire",
      "Unclean persons cannot approach temple",
      "Cannot use fire for destructive purposes",
      "Must maintain truthfulness in all dealings"
    ]
  },

  // Roman rituals
  roman_sacrifice: {
    purpose: "Maintain pax deorum (peace with gods) and seek divine favor through offerings",
    participants: ["Pontifex Maximus", "Magistrates", "Priests", "Citizens"],
    timing: "Regular calendar dates; also extraordinary occasions",
    materials: [
      "Animals (cattle, sheep, pigs, birds)",
      "Wine and oil",
      "Grain and produce",
      "Incense and aromatic herbs",
      "Sacred vessels",
      "Altar"
    ],
    steps: [
      "Purification of altar and participants",
      "Examination of animal for defects (auspices)",
      "Invocation of deity with proper titles",
      "Ritual killing of animal",
      "Burning of choice portions",
      "Inspection of entrails for omens",
      "Cooking and feasting on remaining meat",
      "Prayers of petition or thanksgiving"
    ],
    prohibitions: [
      "Cannot use defective animals",
      "Must follow proper ritual procedures exactly",
      "Bad omens require sacrifice to be repeated",
      "Cannot deviate from established precedent",
      "Unclean persons cannot approach",
      "Improper procedure brings divine wrath"
    ]
  }
};

/**
 * Generate metadata for a ritual based on its ID and current data
 */
function generateRitualMetadata(ritualId, currentData) {
  // Check if we have predefined metadata
  if (ritualMetadataDatabase[ritualId]) {
    return ritualMetadataDatabase[ritualId];
  }

  // Generate basic metadata if not predefined
  return {
    purpose: currentData.description || "Unknown",
    participants: currentData.participants || [],
    timing: currentData.timing || "",
    materials: currentData.tools ? currentData.tools.map(t => t.item) : [],
    steps: currentData.steps ? currentData.steps.map(s => s.action) : [],
    prohibitions: []
  };
}

/**
 * Enrich a single ritual document
 */
function enrichRitual(ritualData, ritualId) {
  const metadata = generateRitualMetadata(ritualId, ritualData);

  return {
    ...ritualData,
    // Ensure all required metadata fields exist
    purpose: ritualData.purpose || metadata.purpose,
    participants: ritualData.participants && ritualData.participants.length > 0
      ? ritualData.participants
      : metadata.participants,
    timing: ritualData.timing || metadata.timing,
    materials: ritualData.materials || metadata.materials || (ritualData.tools ? ritualData.tools.map(t => t.item) : []),
    steps: ritualData.steps && ritualData.steps.length > 0
      ? ritualData.steps
      : metadata.steps,
    prohibitions: ritualData.prohibitions || metadata.prohibitions,

    // Update metadata timestamp
    metadata: {
      ...(ritualData.metadata || {}),
      enrichedAt: new Date().toISOString(),
      enrichmentVersion: "2.0",
      completeness: calculateCompleteness(ritualData, metadata)
    },

    // Update modification timestamp
    updatedAt: new Date().toISOString(),
    _modified: new Date().toISOString()
  };
}

/**
 * Calculate data completeness percentage
 */
function calculateCompleteness(ritualData, metadata) {
  const fields = ['purpose', 'participants', 'timing', 'materials', 'steps', 'prohibitions'];
  let completedFields = 0;

  for (const field of fields) {
    const value = ritualData[field] || metadata[field];
    if (value) {
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else if (typeof value === 'string' && value.trim()) {
        completedFields++;
      }
    }
  }

  const percentage = Math.round((completedFields / fields.length) * 100);
  return percentage >= 80 ? 'comprehensive' : percentage >= 50 ? 'substantial' : 'basic';
}

/**
 * Process all ritual files in a directory
 */
async function enrichAllRituals(dirPath, options = {}) {
  const { dryRun = false, verbose = false, apply = false } = options;

  try {
    // Get all JSON files
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json') && file !== '_all.json')
      .sort();

    console.log(`${colors.cyan}Found ${files.length} ritual files${colors.reset}\n`);

    let enrichedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const ritualId = path.basename(file, '.json');

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Check if enrichment is needed
        const needsEnrichment = !data.prohibitions ||
                               data.participants.length === 0 ||
                               !data.purpose ||
                               !data.timing;

        if (needsEnrichment) {
          const enrichedData = enrichRitual(data, ritualId);

          if (!dryRun) {
            fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2));
          }

          enrichedCount++;
          const completeness = enrichedData.metadata.completeness;

          if (verbose) {
            console.log(`${colors.green}✓${colors.reset} Enriched: ${ritualId}`);
            console.log(`  Purpose: ${enrichedData.purpose.substring(0, 60)}...`);
            console.log(`  Participants: ${enrichedData.participants.length}`);
            console.log(`  Materials: ${enrichedData.materials.length}`);
            console.log(`  Prohibitions: ${enrichedData.prohibitions.length}`);
            console.log(`  Completeness: ${completeness}\n`);
          }

          results.push({
            id: ritualId,
            status: 'enriched',
            completeness,
            fields: {
              purpose: !!enrichedData.purpose,
              participants: enrichedData.participants.length,
              timing: !!enrichedData.timing,
              materials: enrichedData.materials.length,
              steps: enrichedData.steps ? enrichedData.steps.length : 0,
              prohibitions: enrichedData.prohibitions.length
            }
          });
        } else {
          skippedCount++;
          if (verbose) {
            console.log(`${colors.yellow}⊘${colors.reset} Already enriched: ${ritualId}\n`);
          }
          results.push({
            id: ritualId,
            status: 'already_enriched'
          });
        }
      } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Error processing ${file}: ${error.message}`);
        results.push({
          id: ritualId,
          status: 'error',
          error: error.message
        });
      }
    }

    // Print summary
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}Enrichment Summary${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    console.log(`Total rituals processed: ${files.length}`);
    console.log(`${colors.green}Enriched: ${enrichedCount}${colors.reset}`);
    console.log(`${colors.yellow}Already complete: ${skippedCount}${colors.reset}`);

    // Completeness breakdown
    const completenessBreakdown = {};
    results.forEach(r => {
      if (r.completeness) {
        completenessBreakdown[r.completeness] = (completenessBreakdown[r.completeness] || 0) + 1;
      }
    });

    if (Object.keys(completenessBreakdown).length > 0) {
      console.log(`\nCompleteness Breakdown:`);
      Object.entries(completenessBreakdown).forEach(([level, count]) => {
        console.log(`  ${level}: ${count}`);
      });
    }

    if (dryRun) {
      console.log(`\n${colors.yellow}DRY RUN MODE: No files were modified${colors.reset}`);
      console.log(`Run with --apply flag to write changes to disk`);
    } else {
      console.log(`\n${colors.green}Files updated successfully${colors.reset}`);
    }

    return {
      total: files.length,
      enriched: enrichedCount,
      skipped: skippedCount,
      results
    };

  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Upload enriched data to Firebase (optional)
 */
async function uploadToFirebase(dirPath, options = {}) {
  const { dryRun = false, verbose = false } = options;

  if (dryRun) {
    console.log(`${colors.yellow}Skipping Firebase upload in dry-run mode${colors.reset}`);
    return;
  }

  try {
    // Initialize Firebase Admin
    const serviceAccountPath = process.env.FIREBASE_KEY_PATH ||
      path.join(__dirname, '../firebase-key.json');

    if (!fs.existsSync(serviceAccountPath)) {
      console.log(`${colors.yellow}Note: Firebase credentials not found at ${serviceAccountPath}${colors.reset}`);
      console.log(`Set FIREBASE_KEY_PATH environment variable to enable Firebase uploads\n`);
      return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json') && file !== '_all.json');

    console.log(`${colors.blue}Uploading ${files.length} rituals to Firebase...${colors.reset}\n`);

    let uploadedCount = 0;
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const docId = path.basename(file, '.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      await db.collection('rituals').doc(docId).set(data, { merge: true });
      uploadedCount++;

      if (verbose) {
        console.log(`${colors.green}✓${colors.reset} Uploaded: ${docId}`);
      }
    }

    console.log(`\n${colors.green}Successfully uploaded ${uploadedCount} rituals to Firebase${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Firebase upload error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--apply'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    firebase: args.includes('--firebase')
  };

  const ritualsDir = path.join(__dirname, '../firebase-assets-downloaded/rituals');

  if (!fs.existsSync(ritualsDir)) {
    console.error(`${colors.red}Error: Rituals directory not found: ${ritualsDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Ritual Metadata Enrichment Script${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Enrich local files
  const result = await enrichAllRituals(ritualsDir, options);

  // Optionally upload to Firebase
  if (options.firebase) {
    console.log();
    await uploadToFirebase(ritualsDir, options);
  }

  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  enrichRitual,
  enrichAllRituals,
  uploadToFirebase,
  ritualMetadataDatabase
};

/**
 * Migrate Missing Herbs to Firebase
 *
 * This script migrates the 6+ remaining herb entries from the old HTML structure
 * to Firebase Firestore using the entity-schema-v2.0 format.
 *
 * Target herbs identified as missing from Firebase:
 * 1. Buddhist Tea (Camellia sinensis)
 * 2. Hindu Tulsi (Ocimum sanctum)
 * 3. Jewish Hyssop (Origanum syriacum)
 * 4. Jewish Mandrake (Mandragora officinarum)
 * 5. Universal Frankincense (Boswellia sacra)
 * 6. Universal Myrrh (Commiphora myrrha)
 * 7. Universal Cedar
 * 8. Universal Sage
 * 9. Universal Mistletoe
 * 10. Universal Mugwort
 * 11. Norse Barley-Hops
 * 12. Universal Blue Lotus
 */

const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Herb data extracted from HTML files
const herbs = [
  {
    id: "buddhist_tea",
    type: "herb",
    name: "Tea (Cha)",
    mythologies: ["buddhist", "chinese", "japanese"],
    primaryMythology: "buddhist",
    linguistic: {
      originalName: "茶",
      transliteration: "Chá (Chinese), Cha (Japanese)",
      pronunciation: "/tʃɑː/",
      etymology: {
        rootLanguage: "Chinese",
        meaning: "tea plant",
        derivation: "Chinese 茶 (chá)"
      }
    },
    botanicalName: "Camellia sinensis",
    properties: {
      medicinal: ["mental clarity", "alertness", "antioxidant", "cardiovascular health", "metabolism boost"],
      magical: ["meditation enhancement", "mindfulness", "calm alertness", "spiritual awakening"],
      spiritual: ["zen practice", "tea ceremony", "presence", "contemplation"]
    },
    uses: [
      "Meditation aid - enhances alertness during zazen",
      "Tea ceremony (Chanoyu) - Way of Tea spiritual practice",
      "Daily monastic practice - consumed throughout day in temples",
      "L-theanine + caffeine = calm focus perfect for meditation",
      "Green tea (matcha) for ceremonial use"
    ],
    associatedDeities: ["bodhidharma", "buddha"],
    sacredSignificance: "Tea and Zen are 'one taste' (Cha Zen Ichimi). Bodhidharma legend: his eyelids became first tea plants to aid meditation. Essential to Zen Buddhist practice.",
    preparationMethods: [
      "Matcha: whisk powder in hot water (70-80°C) until frothy",
      "Sencha: steep loose leaves 1-2 minutes",
      "Gongfu cha: multiple short steeps in small teapot",
      "Temple style: large pot of light green tea served communally"
    ],
    safetyWarnings: ["generally safe", "caffeine sensitive individuals use caution", "excessive caffeine may cause jitters"],
    traditions: {
      buddhist: {
        usage: "Central to Zen/Chan practice. Japanese tea ceremony (Chado) is spiritual discipline. Every Zen temple has tea practice.",
        significance: "Symbolizes mindfulness, impermanence, simplicity. Meditation and tea inseparable."
      },
      chinese: {
        usage: "Chan Buddhist temples, Gongfu tea ceremony",
        significance: "Aid to meditation, represents middle way between sleep and agitation"
      },
      tibetan: {
        usage: "Butter tea (po cha) with salt and yak butter",
        significance: "Daily staple in monasteries, warming and energizing"
      }
    },
    searchTerms: ["tea", "cha", "matcha", "green tea", "camellia sinensis", "zen tea", "buddhist tea", "tea ceremony"],
    visibility: "public",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "hindu_tulsi",
    type: "herb",
    name: "Tulsi (Holy Basil)",
    mythologies: ["hindu"],
    primaryMythology: "hindu",
    linguistic: {
      originalName: "तुलसी",
      transliteration: "Tulsi",
      pronunciation: "/ˈtʊlsiː/",
      etymology: {
        rootLanguage: "Sanskrit",
        meaning: "the incomparable one",
        derivation: "Sanskrit tulasī"
      }
    },
    botanicalName: "Ocimum sanctum (Ocimum tenuiflorum)",
    properties: {
      medicinal: ["adaptogen", "immune support", "respiratory health", "stress reduction", "anti-inflammatory"],
      magical: ["devotion", "purity", "divine protection", "spiritual elevation"],
      spiritual: ["puja offerings", "Vishnu worship", "household shrine", "daily worship"]
    },
    uses: [
      "Daily worship (nitya puja) - watered and circumambulated every morning",
      "Tulsi Vivah - ceremonial marriage to Shaligram/Vishnu",
      "Puja offerings - essential to Vishnu/Krishna worship",
      "Tulsi tea - Ayurvedic adaptogen for stress and immunity",
      "Sacred tulsi leaves in prasad and holy water"
    ],
    associatedDeities: ["vishnu", "krishna", "lakshmi", "vrinda"],
    sacredSignificance: "Most sacred plant in Hinduism. Living manifestation of Lakshmi. Vrinda Devi transformed into Tulsi. Every Hindu household worships Tulsi plant daily. No Vishnu puja complete without Tulsi leaves.",
    preparationMethods: [
      "Tulsi tea: 5-7 fresh leaves or 1 tsp dried, simmer 5-10 minutes",
      "Tulsi-honey remedy: crush leaves, mix with honey and black pepper for colds",
      "Tulsi powder (churna): 1/4-1/2 tsp with warm water daily",
      "Fresh leaves: chewed directly or added to water"
    ],
    safetyWarnings: ["generally safe", "avoid large medicinal doses during pregnancy", "may have mild blood-thinning effect"],
    traditions: {
      hindu: {
        usage: "Daily worship in household shrine (tulsi vrindavan). Tulsi Vivah festival. Essential puja offering.",
        significance: "Goddess Lakshmi resides in Tulsi. Purifies home, brings prosperity, spiritual protection. Beloved of Krishna."
      },
      ayurvedic: {
        usage: "Rasayana (rejuvenative), adaptogen, immune tonic, respiratory support",
        significance: "Balances all three doshas. Promotes longevity and spiritual vitality."
      }
    },
    searchTerms: ["tulsi", "holy basil", "ocimum sanctum", "sacred basil", "vrinda", "lakshmi plant", "vishnu tulsi"],
    visibility: "public",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "jewish_hyssop",
    type: "herb",
    name: "Hyssop (Ezov)",
    mythologies: ["jewish", "christian"],
    primaryMythology: "jewish",
    linguistic: {
      originalName: "אזוב",
      transliteration: "Ezov",
      pronunciation: "/ˈhɪsəp/",
      etymology: {
        rootLanguage: "Hebrew",
        meaning: "to leave/forsake (sin forsaken through use)",
        derivation: "Hebrew ezov (אזוב)"
      }
    },
    botanicalName: "Origanum syriacum (Syrian oregano/Bible hyssop)",
    properties: {
      medicinal: ["antiseptic", "expectorant", "digestive aid", "antimicrobial"],
      magical: ["purification", "spiritual cleansing", "humility", "divine forgiveness"],
      spiritual: ["temple purification", "Passover ritual", "ritual cleansing"]
    },
    uses: [
      "Passover - applied lamb's blood to doorposts with hyssop bunch",
      "Red Heifer purification - essential in creating purification waters",
      "Tzaraat cleansing - ritual purification from spiritual impurity",
      "Temple incense (Ketoret) - component of sacred incense blend",
      "Psalm 51:7 - 'Purge me with hyssop and I shall be clean'"
    ],
    associatedDeities: ["yahweh"],
    sacredSignificance: "Biblical purification plant. Used in most important Jewish purification rituals. Symbolizes humility (grows from walls). Essential to Temple service. Represents divine cleansing and forgiveness.",
    preparationMethods: [
      "Biblical bundle: tied together, dipped in blood or purification water",
      "Hyssop tea: 1-2 tsp dried leaves per cup, steep 10 minutes",
      "Za'atar blend: primary ingredient in Middle Eastern spice mix",
      "Not used ritually since Temple destruction (70 CE)"
    ],
    safetyWarnings: ["generally safe", "essential oil toxic - do not ingest", "consult herbalist for medicinal use"],
    traditions: {
      jewish: {
        usage: "Temple purification, red heifer ritual, Passover blood application, tzaraat cleansing",
        significance: "Symbol of humility and divine purification. Contrasted with cedar (pride) in rituals."
      },
      christian: {
        usage: "Vinegar offered to Jesus on hyssop branch at crucifixion",
        significance: "Connects to Passover lamb imagery, baptismal purification symbolism"
      },
      kabbalistic: {
        usage: "Meditation on humility, repentance practices",
        significance: "Associated with Chesed (loving-kindness) and divine mercy washing away sin"
      }
    },
    searchTerms: ["hyssop", "ezov", "origanum syriacum", "bible hyssop", "purification", "temple purification"],
    visibility: "public",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "jewish_mandrake",
    type: "herb",
    name: "Mandrake (Dudaim)",
    mythologies: ["jewish", "greek"],
    primaryMythology: "jewish",
    linguistic: {
      originalName: "דודאים",
      transliteration: "Dudaim",
      pronunciation: "/ˈmænˌdreɪk/",
      etymology: {
        rootLanguage: "Hebrew",
        meaning: "love plants (from dod = beloved/love)",
        derivation: "Hebrew dudaim (דודאים)"
      }
    },
    botanicalName: "Mandragora officinarum",
    properties: {
      medicinal: ["HIGHLY TOXIC - DO NOT USE"],
      magical: ["fertility", "love magic", "aphrodisiac (DANGEROUS)"],
      spiritual: ["divine fertility lessons", "human vs divine will"]
    },
    uses: [
      "HISTORICAL STUDY ONLY - DO NOT USE",
      "Genesis 30: Rachel and Leah bargain for mandrakes",
      "Song of Solomon: erotic imagery with mandrakes",
      "Historical (dangerous): fertility charm, love magic, anesthetic"
    ],
    associatedDeities: ["yahweh"],
    sacredSignificance: "Biblical love and fertility plant. Rachel desperately wanted mandrakes for fertility, but Leah (not Rachel) conceived instead - teaching that fertility comes from God, not herbs. Symbolizes human desire vs divine will.",
    preparationMethods: [
      "DO NOT PREPARE - HIGHLY TOXIC",
      "Contains tropane alkaloids (scopolamine, atropine, hyoscyamine)",
      "Can cause delirium, hallucinations, seizures, coma, death",
      "This entry is for HISTORICAL and MYTHOLOGICAL study ONLY"
    ],
    safetyWarnings: [
      "EXTREMELY DANGEROUS - NEVER INGEST",
      "Poisonous - contains toxic tropane alkaloids",
      "No safe dose - can be fatal",
      "Accidental poisonings still occur",
      "Keep away from children and pets"
    ],
    traditions: {
      jewish: {
        usage: "Biblical narrative (Genesis 30, Song of Solomon). Not used in practice.",
        significance: "Lesson that fertility is divine gift, not magical result. Symbol of love and desire."
      },
      greek: {
        usage: "Myth of Myrrha/Adonis. Historical surgical anesthetic (dangerous).",
        significance: "Transformation, tears of sorrow becoming healing (mythology)"
      },
      folklore: {
        usage: "Screaming root legend, dog harvesting method, anthropomorphic root",
        significance: "Dangerous power requiring special knowledge to harvest"
      }
    },
    searchTerms: ["mandrake", "dudaim", "mandragora", "love root", "genesis mandrake", "rachel leah"],
    visibility: "public",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "universal_frankincense",
    type: "herb",
    name: "Frankincense (Olibanum)",
    mythologies: ["universal", "egyptian", "jewish", "christian", "islamic", "hindu", "buddhist"],
    primaryMythology: "universal",
    linguistic: {
      originalName: "لبان / Levonah / Libanos",
      transliteration: "Al-Luban (Arabic), Levonah (Hebrew), Libanos (Greek)",
      pronunciation: "/ˈfræŋkɪnˌsɛns/",
      etymology: {
        rootLanguage: "Old French",
        meaning: "pure incense / high-quality incense",
        derivation: "Old French 'franc encens'"
      }
    },
    botanicalName: "Boswellia sacra (Boswellia carterii, Boswellia serrata)",
    properties: {
      medicinal: ["anti-inflammatory", "immune support", "arthritis relief", "wound healing", "neuroprotective"],
      magical: ["purification", "consecration", "divine connection", "prayer carrier", "protection"],
      spiritual: ["temple offerings", "meditation", "prayer", "spiritual elevation", "crown chakra activation"]
    },
    uses: [
      "Temple incense - burned daily in Egyptian, Jewish, Christian temples",
      "Gift of the Magi - presented to infant Jesus (symbolizing divinity)",
      "Meditation and prayer - elevates consciousness, deepens practice",
      "Arthritis treatment - boswellic acids reduce inflammation",
      "Consecration - purifies ritual tools and sacred spaces"
    ],
    associatedDeities: ["ra", "yahweh", "jesus", "allah", "vishnu", "buddha", "zeus"],
    sacredSignificance: "Most sacred incense across world religions. Carries prayers to heaven. Symbolizes divinity, purity, worship. Essential to temple service in Judaism, Christianity, Hinduism, Buddhism. One of three gifts to Christ.",
    preparationMethods: [
      "Incense: burn resin on charcoal disc",
      "Essential oil: diffuse 5-10 drops for aromatherapy",
      "Topical: dilute essential oil 2-5% in carrier oil",
      "Internal: standardized extract 300-500mg boswellic acids 2-3x daily",
      "Tincture: alcohol extract of resin"
    ],
    safetyWarnings: ["generally safe", "avoid large internal doses during pregnancy", "may interact with blood thinners"],
    traditions: {
      egyptian: {
        usage: "Daily temple offerings to Ra, Isis, Osiris. Mummification. Kyphi incense blend.",
        significance: "Divine fragrance, preserves bodies and souls, connects to solar deity"
      },
      jewish: {
        usage: "Ketoret (sacred temple incense). Showbread offering. Daily altar incense.",
        significance: "Ascending smoke represents prayers rising to God. Pure frankincense symbolizes purity."
      },
      christian: {
        usage: "Gift of Magi (divinity). Catholic/Orthodox Mass. Consecration ceremonies.",
        significance: "Christ's divine nature, priestly role. Prayer and worship ascending."
      },
      islamic: {
        usage: "Mosque fumigation, Ramadan, wedding ceremonies, Quranic recitation",
        significance: "Purification, blessing, sacred atmosphere"
      },
      ayurvedic: {
        usage: "Salai guggul (Boswellia serrata) - anti-inflammatory, rasayana",
        significance: "Balances doshas, rejuvenates, promotes longevity"
      }
    },
    searchTerms: ["frankincense", "boswellia", "olibanum", "luban", "levonah", "temple incense", "gift of magi"],
    visibility: "public",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "universal_myrrh",
    type: "herb",
    name: "Myrrh",
    mythologies: ["universal", "egyptian", "jewish", "christian", "islamic", "greek", "chinese"],
    primaryMythology: "universal",
    linguistic: {
      originalName: "מור / مر / Smyrna",
      transliteration: "Mor (Hebrew), Murr (Arabic), Smyrna (Greek)",
      pronunciation: "/mɜːr/",
      etymology: {
        rootLanguage: "Arabic",
        meaning: "bitter",
        derivation: "Arabic murr (مر) = bitter"
      }
    },
    botanicalName: "Commiphora myrrha (Commiphora molmol)",
    properties: {
      medicinal: ["antimicrobial", "wound healing", "oral health", "anti-inflammatory", "astringent"],
      magical: ["death work", "protection", "transformation", "shadow work", "ancestral connection"],
      spiritual: ["embalming", "anointing", "purification", "suffering transformation"]
    },
    uses: [
      "Egyptian mummification - primary preservative resin",
      "Holy Anointing Oil - main ingredient (Exodus 30:23)",
      "Gift of Magi - symbolized Christ's mortality and sacrifice",
      "Burial of Jesus - Nicodemus brought 75 pounds myrrh and aloes",
      "Wound healing - powerful antiseptic and tissue regenerator",
      "Oral health - mouthwash for gingivitis and periodontitis"
    ],
    associatedDeities: ["osiris", "isis", "jesus", "anubis", "hecate", "persephone"],
    sacredSignificance: "Sacred resin of death and healing. Bridges life and death, suffering and transformation. Third gift to Christ (mortality). Essential to mummification. Bitter medicine that heals. Death leading to rebirth.",
    preparationMethods: [
      "Tincture: 1/3 cup crushed resin in 1 cup high-proof alcohol, 4-6 weeks",
      "Mouthwash: 5-10 drops tincture in 1/4 cup water, swish and gargle",
      "Incense: burn resin on charcoal for death work, protection, ancestor veneration",
      "Topical: dilute essential oil 1-5% in carrier oil for wounds",
      "Salve: infused oil + beeswax for wound healing"
    ],
    safetyWarnings: [
      "AVOID DURING PREGNANCY - uterine stimulant, can cause miscarriage",
      "Not for children under 12 (internal)",
      "May interact with blood thinners",
      "Discontinue 2 weeks before surgery"
    ],
    traditions: {
      egyptian: {
        usage: "Mummification (body cavities, wrapping). Temple incense. Cosmetics.",
        significance: "Preserves bodies for afterlife. Protects soul's journey through underworld."
      },
      jewish: {
        usage: "Holy Anointing Oil (primary ingredient). Wedding perfume. Esther's beauty treatment.",
        significance: "Sacred consecration. Anoints kings, priests, prophets. Song of Solomon love imagery."
      },
      christian: {
        usage: "Gift of Magi (mortality). Wine+myrrh offered at crucifixion. Burial preparation.",
        significance: "Prophesied suffering and death. Bitter cup of sacrifice. Death transformed to resurrection."
      },
      chinese: {
        usage: "Mo Yao (没药) - invigorates blood, dispels stasis, relieves pain",
        significance: "Treats traumatic injury, blood stagnation, chest/abdominal pain"
      },
      greek: {
        usage: "Myth of Myrrha (transformed to myrrh tree, wept resin tears). Medicine for wounds.",
        significance: "Suffering transformed to healing. Beauty (Adonis) born from tears of shame."
      }
    },
    searchTerms: ["myrrh", "commiphora", "mor", "murr", "bitter resin", "mummification", "gift of magi"],
    visibility: "public",
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Main migration function
async function migrateHerbs() {
  console.log('🌿 Starting migration of missing herbs to Firebase...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const herb of herbs) {
    try {
      console.log(`Migrating: ${herb.name} (${herb.id})...`);

      // Check if herb already exists
      const docRef = db.collection('herbs').doc(herb.id);
      const doc = await docRef.get();

      if (doc.exists) {
        console.log(`  ⚠️  Already exists - SKIPPING`);
        continue;
      }

      // Upload to Firebase
      await docRef.set(herb);
      console.log(`  ✅ Successfully migrated`);
      successCount++;

    } catch (error) {
      console.error(`  ❌ Error migrating ${herb.name}:`, error.message);
      errors.push({ herb: herb.name, error: error.message });
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total herbs processed: ${herbs.length}`);
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(err => {
      console.log(`  - ${err.herb}: ${err.error}`);
    });
  }

  // Verify total count
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION');
  console.log('='.repeat(60));

  const snapshot = await db.collection('herbs').get();
  console.log(`Total herbs now in Firebase: ${snapshot.size}`);
  console.log('\nAll herbs in collection:');
  snapshot.forEach(doc => {
    console.log(`  - ${doc.id}: ${doc.data().name}`);
  });

  console.log('\n🎉 Migration complete!\n');
  process.exit(0);
}

// Run migration
migrateHerbs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

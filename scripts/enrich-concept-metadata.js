#!/usr/bin/env node

/**
 * Concept Metadata Enrichment Script
 *
 * Populates rich metadata for concept entities in Firebase with:
 * - definition: Clear explanations
 * - examples: Concrete instances
 * - relatedConcepts: Connected ideas
 * - practitioners: Who follows/uses it
 * - texts: Source materials
 * - applications: How it's applied
 *
 * Usage:
 *   node scripts/enrich-concept-metadata.js --dry-run
 *   node scripts/enrich-concept-metadata.js --apply
 *   node scripts/enrich-concept-metadata.js --concept buddhist_bodhisattva
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase (requires GOOGLE_APPLICATION_CREDENTIALS env var)
let db = null;

try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  db = admin.firestore();
} catch (err) {
  console.log('ℹ Firebase admin not available - working with local files only');
}

// Rich metadata enrichment data for concepts
const CONCEPT_ENRICHMENTS = {
  'buddhist_bodhisattva': {
    definition: 'An enlightened being in Mahayana Buddhism who postpones final Nirvana to help all sentient beings achieve liberation, embodying the ideal of compassionate self-sacrifice and unlimited service.',
    examples: [
      'Avalokiteshvara (Goddess of Compassion)',
      'Manjushri (Embodiment of Wisdom)',
      'Ksitigarbha (Guardian of Hell Realms)',
      'Samantabhadra (Universal Virtue)'
    ],
    practitioners: [
      'Mahayana Buddhist monks and nuns',
      'Tibetan Buddhist practitioners',
      'Chinese and Japanese Buddhism traditions',
      'All followers of the Bodhisattva path'
    ],
    texts: [
      'Bodhisattva Vow (core scriptural commitment)',
      'Lotus Sutra (Saddharmapundarika Sutra)',
      'Jataka Tales (Bodhisattva birth stories)',
      'Shantideva\'s Bodhisattva Way of Life (Bodhicharyavatara)',
      'Tibetan Buddhist canonical texts'
    ],
    applications: [
      'Spiritual development through compassion',
      'Meditation on universal suffering and its cessation',
      'Ethical cultivation and moral perfection',
      'Service-oriented practice and teaching',
      'Transformation of enlightenment for communal benefit'
    ],
    relatedConcepts: [
      'Compassion (Karuna)',
      'Enlightenment (Bodhi)',
      'Nirvana',
      'Mahayana Buddhism',
      'Avalokiteshvara',
      'Bodhisattva Vow',
      'Altruism and Self-sacrifice'
    ]
  },
  'buddhist_compassion': {
    definition: 'Karuna - the Buddhist virtue of wishing all beings freedom from suffering, paired with wisdom (prajna) as the fundamental basis for enlightenment and ethical conduct.',
    examples: [
      'Avalokiteshvara embodying infinite compassion',
      'Compassionate witnessing of suffering without turning away',
      'Extending loving-kindness equally to enemies and loved ones',
      'Working to relieve hunger, disease, and ignorance'
    ],
    practitioners: [
      'All Buddhist practitioners across traditions',
      'Bodhisattvas dedicated to universal liberation',
      'Meditation practitioners in Vipassana (insight) traditions',
      'Buddhist social workers and healers'
    ],
    texts: [
      'Dhammapada (sayings of the Buddha)',
      'Metta Sutta (Discourse on Loving-kindness)',
      'Shantideva\'s Bodhisattva Way of Life',
      'Visuddhimagga (Path of Purification)',
      'Tibetan Buddhist meditation manuals'
    ],
    applications: [
      'Metta (loving-kindness) meditation practice',
      'Compassionate listening and spiritual counseling',
      'Conflict resolution and peacemaking',
      'Social activism and humanitarian service',
      'Healing trauma through compassionate awareness'
    ],
    relatedConcepts: [
      'Bodhisattva Path',
      'Loving-kindness (Metta)',
      'Wisdom (Prajna)',
      'Mindfulness',
      'Enlightenment',
      'Buddhist Ethics',
      'Equanimity'
    ]
  },
  'egyptian_maat': {
    definition: 'Ancient Egyptian concept of cosmic order, truth, justice, and balance - the fundamental principle maintaining the universe\'s integrity and governing both divine and human conduct.',
    examples: [
      'Judgment of the dead against the feather of Ma\'at in the afterlife',
      'Pharaoh\'s duty to maintain Ma\'at through proper rituals and governance',
      'Proper conduct in commerce, law, and daily relationships',
      'Seasonal flooding of the Nile as expression of cosmic order'
    ],
    practitioners: [
      'Egyptian pharaohs and nobility',
      'Priests and temple officials',
      'Judges and legal authorities',
      'All Egyptians maintaining ethical conduct'
    ],
    texts: [
      'Pyramid Texts (earliest religious literature)',
      'Egyptian Book of the Dead',
      'Instruction of Ptahhotep (wisdom literature)',
      'Declarations of Innocence (ethical codes)',
      'Temple inscriptions and royal decrees'
    ],
    applications: [
      'Legal judgments and justice administration',
      'Ethical codes for conduct and virtue',
      'Maintaining social order through law',
      'Ritual practices ensuring cosmic balance',
      'Personal moral development and virtue'
    ],
    relatedConcepts: [
      'Divine Justice',
      'Cosmic Order',
      'Dharma (Hindu parallel)',
      'Asha (Zoroastrian parallel)',
      'Ma\'at Goddess',
      'The Afterlife',
      'Sacred Duality (Order vs. Chaos)'
    ]
  },
  'greek_judgment-of-paris': {
    definition: 'The mythological beauty contest among three goddesses (Hera, Athena, Aphrodite) whose outcome - Paris choosing Aphrodite - triggered the Trojan War, illustrating the tragic consequences of desiring beauty over wisdom or power.',
    examples: [
      'The three goddesses offering different prizes (kingship, wisdom, love)',
      'Paris abducting Helen, the most beautiful woman in the world',
      'The subsequent ten-year Trojan War and fall of Troy',
      'Paris\'s fatal choice revealing his human weakness'
    ],
    practitioners: [
      'Greek dramatists and poets retelling the myth',
      'Philosophers reflecting on human choice and fate',
      'Artists depicting the judgment scene',
      'Spiritual teachers using myth to teach ethics'
    ],
    texts: [
      'Homer\'s Iliad',
      'Cypria (lost epic by Stasinus)',
      'Euripides\' Iphigenia at Aulis and Helen',
      'Ovid\'s Metamorphoses',
      'Lucian\'s Dialogues of the Gods'
    ],
    applications: [
      'Teaching about consequences of moral choices',
      'Exploring conflicts between beauty, wisdom, and power',
      'Understanding divine jealousy and human mortality',
      'Artistic inspiration for Renaissance and Baroque art',
      'Psychological exploration of desire and fate'
    ],
    relatedConcepts: [
      'Aphrodite',
      'Hera',
      'Athena',
      'Divine Justice',
      'Human Limitation',
      'Fate and Prophecy',
      'The Trojan War'
    ]
  },
  'greek_orpheus': {
    definition: 'The myth of the legendary musician whose art transcends mortal boundaries and can even move Hades, yet whose failure to trust triggers loss, illustrating the limits of human power and the irreversibility of death.',
    examples: [
      'Orpheus\'s music charming stones and wild beasts',
      'His descent to the underworld to reclaim Eurydice',
      'The condition: not looking back until reaching upper world',
      'His fatal backward glance causing her eternal loss'
    ],
    practitioners: [
      'Musicians and artists seeking inspiration',
      'Spiritual seekers exploring death and transformation',
      'Poets and writers interpreting the myth',
      'Mystics in Orphic mystery traditions'
    ],
    texts: [
      'Virgil\'s Georgics (Book IV)',
      'Ovid\'s Metamorphoses (Book X-XI)',
      'Orphic Hymns',
      'Plato\'s Symposium and Republic',
      'Ovid\'s Heroides'
    ],
    applications: [
      'Exploring grief and loss in literature and art',
      'Understanding limits of human power and knowledge',
      'Meditation on faith and doubt in spiritual practice',
      'Music therapy and healing through art',
      'Psychological work on acceptance and surrender'
    ],
    relatedConcepts: [
      'Eurydice',
      'Hades and Persephone',
      'The Underworld',
      'Artistic Power',
      'Forbidden Knowledge',
      'Transformation',
      'Death and Rebirth'
    ]
  },
  'greek_persephone': {
    definition: 'The goddess of spring and Queen of the Underworld whose seasonal descent and return explain the cycle of agricultural death and rebirth, symbolizing transformation through loss and the duality of maiden and queen.',
    examples: [
      'Persephone gathering flowers when Hades abducts her',
      'Demeter\'s grief causing global crop failure and winter',
      'Pomegranate seeds binding Persephone to underworld for half the year',
      'Her dual role as spring maiden and underworld queen'
    ],
    practitioners: [
      'Ancient Greek mystery cultists (Eleusinian Mysteries)',
      'Agricultural communities honoring seasonal cycles',
      'Feminine spirituality practitioners',
      'Contemporary earth-based spiritual traditions'
    ],
    texts: [
      'Homeric Hymn to Demeter',
      'Ovid\'s Metamorphoses',
      'Orphic fragments and hymns',
      'Plato\'s references to Eleusinian Mysteries',
      'Apuleius\' Metamorphoses'
    ],
    applications: [
      'Understanding seasonal agricultural cycles',
      'Feminine initiation and transformation mythology',
      'Exploring dual nature and integration of opposites',
      'Death and rebirth symbolism in spiritual practice',
      'Psychological shadow work and growth through adversity'
    ],
    relatedConcepts: [
      'Demeter',
      'Hades',
      'Eleusinian Mysteries',
      'The Underworld',
      'Spring and Renewal',
      'Death and Rebirth',
      'Abduction Myths'
    ]
  },
  'japanese_amaterasu-cave': {
    definition: 'The myth of the sun goddess Amaterasu\'s withdrawal into a heavenly rock cave, plunging the world into darkness until coaxed out by sacred ceremony, illustrating the power of community ritual and the danger of isolating divine light.',
    examples: [
      'Susanoo\'s violent rampage desecrating sacred spaces',
      'Amaterasu sealing herself in cave, stopping the sun',
      'Ame-no-Uzume\'s ecstatic sacred dance attracting the goddess',
      'Mirrors, jewels, and roosters as sacred ritual implements'
    ],
    practitioners: [
      'Shinto priests and shrine keepers',
      'Kagura (sacred dance) performers',
      'Japanese spiritual practitioners',
      'Shamanic practitioners'
    ],
    texts: [
      'Kojiki (712 CE) - Record of Ancient Matters',
      'Nihon Shoki (720 CE) - Chronicles of Japan',
      'Shinto liturgical texts and invocations',
      'Japanese mythological commentaries'
    ],
    applications: [
      'Performance of Kagura sacred dance rituals',
      'Community gathering and celebration practices',
      'Shamanic extraction and restoration work',
      'Understanding ritual as transformative technology',
      'Restoring divine presence through proper ceremony'
    ],
    relatedConcepts: [
      'Amaterasu',
      'Susanoo',
      'Sacred Dance (Kagura)',
      'Three Sacred Treasures',
      'Kami and Divine Presence',
      'Shinto Ritual',
      'Sacred Isolation and Return'
    ]
  },
  'japanese_creation-of-japan': {
    definition: 'The foundational Shinto creation myth where the divine couple Izanagi and Izanami create the Japanese islands and the myriad kami through sacred ritual, establishing the divine origin and sanctity of Japan.',
    examples: [
      'The Heavenly Jeweled Spear stirring primordial ocean',
      'Brine dripping from the spear creating the first island',
      'The divine couple\'s sacred circumambulation ritual',
      'Birth of eight major islands and countless kami'
    ],
    practitioners: [
      'Shinto priests and shrine custodians',
      'Japanese imperial lineage (descendants of Izanagi/Izanami)',
      'Japanese spiritual practitioners',
      'Communities maintaining kami veneration'
    ],
    texts: [
      'Kojiki (712 CE)',
      'Nihon Shoki (720 CE)',
      'Shinto norito (liturgical prayers)',
      'Japanese commentaries on creation'
    ],
    applications: [
      'Establishing sacred geography and land sanctity',
      'Imperial legitimation through divine descent',
      'Marriage and partnership rituals honoring divine couple',
      'Understanding natural features as kami-inhabited',
      'National identity and spiritual connection to landscape'
    ],
    relatedConcepts: [
      'Izanagi',
      'Izanami',
      'Kami Creation',
      'Shinto Cosmology',
      'Sacred Geography',
      'Divine Marriage',
      'Land Sanctification'
    ]
  },
  'japanese_izanagi-yomi': {
    definition: 'The journey of Izanagi to the underworld realm of Yomi to retrieve his deceased wife Izanami, revealing the absolute boundary between life and death and establishing concepts of death pollution and purification rituals.',
    examples: [
      'Izanami dying in childbirth to fire god Kagutsuchi',
      'Izanagi descending to Yomi despite prohibition',
      'The forbidden gaze revealing Izanami\'s rotting corpse',
      'Izanagi\'s purification creating major kami (Amaterasu, Tsukuyomi, Susanoo)'
    ],
    practitioners: [
      'Shinto priests performing misogi (purification)',
      'Spiritual practitioners understanding death boundaries',
      'Mourners following death rituals',
      'Shamanic workers with the dead'
    ],
    texts: [
      'Kojiki (712 CE)',
      'Nihon Shoki (720 CE)',
      'Shinto purification texts (Norito)',
      'Japanese spiritual literature'
    ],
    applications: [
      'Death rituals and mourning practices',
      'Misogi (water purification) ceremonies',
      'Understanding kegare (death pollution)',
      'Spiritual boundary maintenance practices',
      'Psychological work with grief and acceptance'
    ],
    relatedConcepts: [
      'Yomi (Underworld)',
      'Kegare (Death Pollution)',
      'Misogi (Purification)',
      'Death Irreversibility',
      'Forbidden Knowledge',
      'Boundary Between Worlds',
      'Transformation Through Purification'
    ]
  },
  'japanese_susanoo-orochi': {
    definition: 'The hero myth of Susanoo slaying the eight-headed dragon Yamata-no-Orochi, rescuing a maiden, and discovering the sacred sword Kusanagi, representing redemption through heroic action and the discovery of imperial legitimacy.',
    examples: [
      'The dragon\'s consumption of seven daughters',
      'Susanoo\'s clever trap using sake to intoxicate the dragon',
      'Discovery of Kusanagi sword in the dragon\'s fourth tail',
      'Rescue and marriage to Kushinadahime'
    ],
    practitioners: [
      'Samurai and martial artists honoring the warrior code',
      'Shinto priests maintaining sacred sword veneration',
      'Japanese spiritual seekers',
      'Those engaging redemption and transformation stories'
    ],
    texts: [
      'Kojiki (712 CE)',
      'Nihon Shoki (720 CE)',
      'Shinto sacred texts',
      'Samurai code and philosophy'
    ],
    applications: [
      'Warrior training and spiritual discipline',
      'Understanding redemption through heroic action',
      'Dragon-slaying as psychological shadow work',
      'Sacred item veneration (Imperial Regalia)',
      'Martial virtue and protection of the vulnerable'
    ],
    relatedConcepts: [
      'Yamata-no-Orochi (Eight-headed Dragon)',
      'Kusanagi-no-Tsurugi (Sacred Sword)',
      'Three Sacred Treasures',
      'Hero\'s Journey',
      'Dragon-slaying myths',
      'Redemption',
      'Kushinadahime'
    ]
  },
  'norse_aesir': {
    definition: 'The Aesir are the primary pantheon of Norse gods associated with order, governance, and war - including Odin, Thor, and Frigg - distinguished from the Vanir (fertility gods) in Norse cosmology.',
    examples: [
      'Odin - Chief god of wisdom and war',
      'Thor - Protector god with mighty hammer Mjolnir',
      'Frigg - Queen of the gods',
      'Tyr - God of war and justice'
    ],
    practitioners: [
      'Norse and Germanic peoples (historical)',
      'Modern Norse pagan practitioners (Asatru)',
      'Germanic spiritual traditions',
      'Academic scholars of Norse mythology'
    ],
    texts: [
      'Poetic Edda (Eddic poems)',
      'Prose Edda (Snorri Sturluson)',
      'The Sagas',
      'Archaeological and linguistic sources'
    ],
    applications: [
      'Understanding Norse cosmology and worldview',
      'Spiritual practices in modern heathenry',
      'Warrior training and martial values',
      'Understanding divine hierarchy and governance',
      'Connecting with ancestral Norse traditions'
    ],
    relatedConcepts: [
      'Odin',
      'Thor',
      'Frigg',
      'Vanir',
      'Asgard',
      'Ragnarok',
      'Norse Cosmology'
    ]
  },
  'norse_ragnarok': {
    definition: 'The prophesied apocalyptic end of the Norse cosmos - when the sun darkens, stars disappear, ice covers the earth, and gods battle giants - followed by renewal and rebirth, expressing Norse cyclical time philosophy.',
    examples: [
      'Fenrir wolf breaking chains and devouring Odin',
      'Surtr the fire giant bringing flames to destroy the world',
      'Yggdrasil world tree trembling and some stars vanishing',
      'Midgard sinking into the sea'
    ],
    practitioners: [
      'Norse pagan practitioners',
      'Warrior cultures honoring fate and courage',
      'Meditation on apocalypse and renewal',
      'Academic students of Norse religion'
    ],
    texts: [
      'Völuspá (Prophecy of the Völva)',
      'Gylfaginning (Snorri\'s Prose Edda)',
      'Vafþrúðnismál',
      'Various Eddic poems'
    ],
    applications: [
      'Understanding cyclic vs. linear time concepts',
      'Courage facing inevitable doom and fate',
      'Ecological renewal after destruction',
      'Meditation on impermanence and transformation',
      'Understanding warrior ethos and acceptance'
    ],
    relatedConcepts: [
      'Fenrir',
      'Yggdrasil',
      'Valhalla',
      'Odin',
      'Surtr',
      'Cyclical Time',
      'Apocalypse and Renewal'
    ]
  },
  'sumerian_gilgamesh': {
    definition: 'The Epic of Gilgamesh - the world\'s oldest literature - tells of a tyrannical king\'s transformation through friendship and his quest for immortality, exploring universal themes of mortality, legacy, and companionship.',
    examples: [
      'Gilgamesh and Enkidu\'s epic friendship',
      'Slaying Humbaba and the Bull of Heaven',
      'Enkidu\'s death spurring Gilgamesh\'s quest for immortality',
      'Meeting Utnapishtim to learn immortality\'s secret'
    ],
    practitioners: [
      'Scholars and literary analysts',
      'Spiritual seekers exploring mortality',
      'Poets and writers drawing on the epic',
      'Those studying ancient wisdom'
    ],
    texts: [
      'Standard Babylonian Version (Sin-leqi-unninni)',
      'Old Babylonian tablets',
      'Sumerian Gilgamesh poems',
      'Nineveh library tablets',
      'Modern translations by Andrew George, N.K. Sandars'
    ],
    applications: [
      'Understanding grief and loss in spiritual practice',
      'Exploring mortality and legacy',
      'Artistic inspiration for literature and music',
      'Historical understanding of ancient Mesopotamia',
      'Psychological work on friendship and transformation'
    ],
    relatedConcepts: [
      'Death and Mortality',
      'Hero\'s Journey',
      'Friendship',
      'Legacy',
      'The Flood',
      'Sumerian Deities',
      'Immortality Quest'
    ]
  },
  'sumerian_inanna-descent': {
    definition: 'The Sumerian descent of Inanna to the underworld realm of Kur where she is stripped of all divine powers and regalia, dies, and is resurrected - expressing transformation through vulnerability and descent as initiatory experience.',
    examples: [
      'Inanna adorning herself with seven me (divine powers)',
      'At each of seven gates, one power being removed',
      'Inanna judged by seven Anunnaki and killed',
      'Her body hung on a hook in the underworld',
      'Resurrection through food and water of life'
    ],
    practitioners: [
      'Sumerian and Mesopotamian priests',
      'Mystery initiates learning sacred mysteries',
      'Feminine spirituality practitioners',
      'Shamanic death-and-rebirth workers'
    ],
    texts: [
      'Sumerian cuneiform tablets (c. 1900-1600 BCE)',
      'Samuel Noah Kramer translations',
      'Diane Wolkstein\'s translations and interpretations',
      'Akkadian Ishtar\'s Descent (parallel version)'
    ],
    applications: [
      'Initiatory death-and-rebirth spiritual practices',
      'Shamanic descent and healing work',
      'Feminine power and transformation mythology',
      'Understanding death as initiatory passage',
      'Vulnerability as gateway to authentic power'
    ],
    relatedConcepts: [
      'Kur (Underworld)',
      'Ereshkigal',
      'Death and Rebirth',
      'Initiatory Mystery',
      'Divine Transformation',
      'Feminine Power',
      'Dumuzi'
    ]
  }
};

class ConceptEnricher {
  constructor(dryRun = false, firebase = null) {
    this.dryRun = dryRun;
    this.firebase = firebase;
    this.localPath = path.join(__dirname, '..', 'firebase-assets-downloaded', 'concepts');
    this.stats = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Load local concept file
   */
  loadLocalConcept(filename) {
    const filePath = path.join(this.localPath, `${filename}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  /**
   * Merge enrichment data into concept
   */
  enrichConcept(concept, enrichment) {
    const enriched = { ...concept };

    // Add or update enrichment fields
    enriched.definition = enrichment.definition || concept.definition || '';
    enriched.examples = enrichment.examples || [];
    enriched.practitioners = enrichment.practitioners || [];
    enriched.texts = enrichment.texts || [];
    enriched.applications = enrichment.applications || [];

    // Merge with existing relatedConcepts
    const existingConcepts = new Set(concept.relatedConcepts || []);
    enrichment.relatedConcepts?.forEach(c => existingConcepts.add(c));
    enriched.relatedConcepts = Array.from(existingConcepts);

    // Update metadata
    enriched.metadata = enriched.metadata || {};
    enriched.metadata.enrichedAt = new Date().toISOString();
    enriched.metadata.enrichedBy = 'concept-enrichment-script';
    enriched.metadata.enrichmentVersion = '1.0';

    // Mark as enriched
    enriched.isEnriched = true;

    // Update timestamp
    enriched.updatedAt = new Date().toISOString();

    return enriched;
  }

  /**
   * Process a single concept
   */
  async processConcept(filename, enrichment) {
    try {
      const concept = this.loadLocalConcept(filename);
      if (!concept) {
        console.log(`⚠️  Concept not found: ${filename}`);
        this.stats.skipped++;
        return;
      }

      const enriched = this.enrichConcept(concept, enrichment);

      if (this.dryRun) {
        console.log(`📋 [DRY RUN] Would enrich: ${filename}`);
        console.log(`    - Definition: ${enriched.definition?.substring(0, 60)}...`);
        console.log(`    - Examples: ${enriched.examples?.length || 0} items`);
        console.log(`    - Practitioners: ${enriched.practitioners?.length || 0} items`);
        console.log(`    - Texts: ${enriched.texts?.length || 0} items`);
        console.log(`    - Applications: ${enriched.applications?.length || 0} items`);
        console.log(`    - Related Concepts: ${enriched.relatedConcepts?.length || 0} items`);
      } else {
        // Save to local file
        const filePath = path.join(this.localPath, `${filename}.json`);
        fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2));
        console.log(`✅ Enriched: ${filename}`);

        // Upload to Firebase if available
        if (this.firebase) {
          try {
            const conceptId = concept.id || filename;
            await this.firebase.collection('concepts').doc(conceptId).update(enriched);
            console.log(`   ☁️  Uploaded to Firebase: ${conceptId}`);
          } catch (firebaseErr) {
            console.log(`   ⚠️  Firebase update failed: ${firebaseErr.message}`);
          }
        }
      }

      this.stats.updated++;
    } catch (err) {
      console.error(`❌ Error processing ${filename}: ${err.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Process all concepts
   */
  async enrichAll() {
    console.log('📚 Concept Metadata Enrichment');
    console.log('=' .repeat(50));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY'}`);
    console.log(`Concepts to enrich: ${Object.keys(CONCEPT_ENRICHMENTS).length}`);
    console.log('=' .repeat(50));
    console.log('');

    for (const [filename, enrichment] of Object.entries(CONCEPT_ENRICHMENTS)) {
      this.stats.processed++;
      await this.processConcept(filename, enrichment);
    }

    this.printStats();
  }

  /**
   * Process a specific concept
   */
  async enrichOne(filename) {
    if (!CONCEPT_ENRICHMENTS[filename]) {
      console.error(`❌ No enrichment data for: ${filename}`);
      return;
    }

    console.log(`📚 Enriching Concept: ${filename}`);
    console.log('=' .repeat(50));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY'}`);
    console.log('=' .repeat(50));
    console.log('');

    this.stats.processed++;
    await this.processConcept(filename, CONCEPT_ENRICHMENTS[filename]);

    this.printStats();
  }

  /**
   * Print statistics
   */
  printStats() {
    console.log('');
    console.log('=' .repeat(50));
    console.log('📊 Summary');
    console.log('=' .repeat(50));
    console.log(`Processed: ${this.stats.processed}`);
    console.log(`Updated: ${this.stats.updated}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);

    if (!this.dryRun && this.stats.updated > 0) {
      console.log('');
      console.log('✨ Enrichment complete!');
      console.log('Use the Firebase Console to verify changes.');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('--dry');
  const applyChanges = args.includes('--apply');
  const specificConcept = args.find(arg => !arg.startsWith('--'))?.replace('.json', '');

  // Determine actual mode
  const mode = dryRun ? 'dry-run' : (applyChanges ? 'apply' : 'dry-run');

  if (!dryRun && !applyChanges && !specificConcept) {
    console.log('🔄 Concept Metadata Enrichment Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/enrich-concept-metadata.js --dry-run');
    console.log('  node scripts/enrich-concept-metadata.js --apply');
    console.log('  node scripts/enrich-concept-metadata.js --concept buddhist_bodhisattva --apply');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run        Preview changes without applying');
    console.log('  --apply          Apply enrichment to local files and Firebase');
    console.log('  --concept NAME   Enrich specific concept');
    console.log('');
    console.log('Available concepts:');
    Object.keys(CONCEPT_ENRICHMENTS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(0);
  }

  // Create enricher
  const enricher = new ConceptEnricher(mode === 'dry-run', db);

  try {
    if (specificConcept) {
      await enricher.enrichOne(specificConcept);
    } else {
      await enrichAll();
    }
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }

  process.exit(0);
}

main();

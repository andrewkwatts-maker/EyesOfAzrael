#!/usr/bin/env node

/**
 * Cosmology Metadata Enrichment Script
 * Populates rich metadata for cosmology entities in Firebase
 *
 * Required fields for each entity:
 * - structure: How it's organized
 * - inhabitants: Beings that dwell there
 * - connections: Links to other realms
 * - significance: Spiritual/philosophical meaning
 * - parallels: Similar concepts in other traditions
 * - sources: Primary texts describing it
 */

const fs = require('fs');
const path = require('path');

// Metadata enrichment database
const cosmologyEnrichment = {
  greek_mount_olympus: {
    structure: "A celestial mountain realm with 12 Olympian halls arranged in hierarchical order, connected by golden roads and surrounded by clouds",
    inhabitants: [
      "Zeus and the 12 Olympian gods",
      "Hestia",
      "Hera",
      "Poseidon",
      "Demeter",
      "Athena",
      "Apollo",
      "Artemis",
      "Ares",
      "Aphrodite",
      "Hephaestus",
      "Hermes",
      "Hades (occasional visitor)",
      "Nike (Goddess of Victory)",
      "Divine retinue and servants"
    ],
    connections: [
      "Underworld/Hades - connected by the path souls travel",
      "Earth/Mortals - gods intervene and descend regularly",
      "Sea realm - Poseidon's domain",
      "Tartarus - imprisoned Titans",
      "River Styx - boundary between worlds"
    ],
    significance: "The supreme seat of divine power in Greek cosmology, representing perfection, immortality, and the ordering principle (cosmos) that opposes chaos (Tartarus). Mount Olympus embodies the idealization of both physical and moral perfection.",
    parallels: [
      "Hindu Mount Meru - axis mundi and divine abode",
      "Norse Asgard - celestial realm of gods",
      "Egyptian Heliopolis - sacred center of creation",
      "Christian Heaven - eternal divine dwelling",
      "Mesopotamian Dilmun - pure primordial place"
    ],
    sources: [
      "Hesiod's Theogony",
      "Homer's Iliad and Odyssey",
      "Ovid's Metamorphoses",
      "Pausanias's Description of Greece"
    ]
  },

  egyptian_duat: {
    structure: "The Duat is organized as a vertical journey through 12 hours of night, each hour presenting distinct challenges, gates, and landscapes. Ra's solar barque travels eastward through four main divisions: entry halls, water realms, dangerous passages, and transformation chambers.",
    inhabitants: [
      "Ra in his solar barque (day)",
      "Deceased pharaohs and souls",
      "Apophis - chaos serpent",
      "Guardians at each hour's gate",
      "Demons and spirits",
      "The Twelve Hours' deities",
      "Sokar - god of the deep",
      "Osiris - lord of the dead",
      "Nut - sky goddess overlooking the journey"
    ],
    connections: [
      "Nile River - above-world counterpart (mirrors Duat structure)",
      "Nun - primordial waters surrounding the journey",
      "Heliopolis - Ra's origin point",
      "Fields of Aaru - final destination for blessed",
      "Lake of Fire - place of judgment and purification"
    ],
    significance: "The Duat represents the cyclical regeneration of life through death. It embodies the principle of transformation and daily resurrection, essential to Egyptian beliefs about immortality and the eternal return. The journey ensures cosmic order (Ma'at) is maintained.",
    parallels: [
      "Sumerian descent of Inanna - underworld journey",
      "Greek Underworld - realm of the dead",
      "Mesopotamian Irkalla - land of no return",
      "Hindu Hell realms - karmic consequences",
      "Tibetan Bardo Thodol - post-death journey"
    ],
    sources: [
      "Book of the Dead (Pert em Hru)",
      "Amduat (Book of the Hidden Chamber)",
      "Book of Gates",
      "Book of Caverns",
      "Coffin Texts"
    ]
  },

  buddhist_realms: {
    structure: "Six realms arranged in a wheel (Bhavachakra) representing different states of rebirth. Organized hierarchically from heavenly realms (gods/demi-gods) through human and animal realms to hellish and hungry-ghost realms. Each realm populated according to karma.",
    inhabitants: [
      "Devas (gods) - heavenly realm",
      "Asuras (demi-gods/titans) - jealous realm",
      "Humans - middle realm",
      "Animals - animal realm",
      "Pretas (hungry ghosts) - tormented realm",
      "Naraka beings (hell-dwellers) - punishment realm"
    ],
    connections: [
      "Samsara - the cycle of existence binding all realms",
      "Nirvana - escape from the six realms",
      "Bodhisattva realms - enlightened beings aiding others",
      "Pure Lands - celestial realms of buddhas",
      "Three Jewels - enlightenment path"
    ],
    significance: "The six realms illustrate the consequences of karma and the Three Poisons (greed, hatred, ignorance). Fundamental to Buddhist understanding of suffering and the path to enlightenment. All beings cycle through realms according to their actions and mental state.",
    parallels: [
      "Hindu cosmology - multiple realms of existence",
      "Pythagorean transmigration - soul movement between states",
      "Christian judgment - souls assigned to levels",
      "Zoroastrian judgments - placement by morality",
      "Taoist cosmology - spirit realms"
    ],
    sources: [
      "Bhavachakra (Wheel of Life) visual tradition",
      "Buddhist Sutras on realm descriptions",
      "Tibetan Book of the Dead (Bardo Thodol)",
      "Jataka Tales",
      "Abhidhamma Pitaka"
    ]
  },

  norse_asgard: {
    structure: "One of Nine Realms located at the top of Yggdrasil. Asgard itself is a fortress containing Aesir halls including Gladsheim, Idavoll plain, and Valhalla. Connected to other realms via Bifrost (rainbow bridge) and Yggdrasil's trunk.",
    inhabitants: [
      "Odin - All-Father",
      "Thor - Thunder god",
      "Freyja - Love and war",
      "Frigg - Queen of heaven",
      "Tyr - War god",
      "Heimdall - Guardian of Bifrost",
      "Loki - Trickster",
      "12 Aesir gods total",
      "Valkyries - warrior maidens",
      "Einherjar - honored slain warriors in Valhalla",
      "Giants and their servants"
    ],
    connections: [
      "Midgard - human realm below",
      "Jotunheim - realm of giants",
      "Muspelheim - fire realm",
      "Niflheim - ice realm",
      "Vanaheim - realm of Vanir gods",
      "Svartalfheim - dark elves",
      "Helheim - realm of the dead (Hel's domain)",
      "Bifrost rainbow bridge - connection between realms"
    ],
    significance: "Asgard represents the eternal struggle against entropy and chaos. Unlike heavens in other traditions, Asgard is not eternal—it will fall during Ragnarok. This reflects the Norse view that even gods must face inevitable fate, emphasizing honor and brave action over salvation.",
    parallels: [
      "Greek Olympus - dwelling of gods",
      "Hindu Indraloka - celestial realm of gods",
      "Celtic Tír na nÓg - divine otherworld",
      "Sumerian heaven - halls of gods",
      "Christian Heaven - eternal divine domain"
    ],
    sources: [
      "Prose Edda by Snorri Sturluson",
      "Poetic Edda",
      "Völuspá - prophecy of the end",
      "Gylfaginning - deception of the king"
    ]
  },

  christian_heaven: {
    structure: "A hierarchical realm with distinct regions: the throne of God at the center, encircled by concentric levels of heavenly hosts (seraphim, cherubim, thrones, dominions, virtues, powers, principalities, archangels, angels), and the outer region of eternal communion with the divine.",
    inhabitants: [
      "God (Trinity)",
      "Jesus Christ",
      "Holy Spirit",
      "Angels - nine orders",
      "Archangels (Michael, Gabriel, Raphael, Uriel)",
      "Saints and redeemed souls",
      "Virgin Mary (Catholic/Orthodox)",
      "Prophets and patriarchs",
      "Martyrs",
      "Four Living Creatures (apocalyptic imagery)"
    ],
    connections: [
      "Hell - eternal separation from God",
      "Purgatory (Catholic) - intermediate state",
      "Earth - from which souls ascend",
      "New Jerusalem - heaven descending to Earth",
      "Abraham's Bosom - pre-resurrection holding place",
      "Paradise (inner circle) - closest to God"
    ],
    significance: "Heaven represents the ultimate goal of Christian faith—eternal union with the divine and freedom from suffering. It embodies perfection, holiness, and the reward for faith and righteous living. The hierarchical structure reflects divine order and cosmic harmony.",
    parallels: [
      "Islamic Jannah - paradise gardens",
      "Hindu Svarga - heavenly realm",
      "Norse Valhalla - hall of the honored dead",
      "Greek Elysium - blessed realm for virtuous",
      "Jewish Olam Ha-Ba - world to come"
    ],
    sources: [
      "Bible - Revelation 21-22 (vision of heaven)",
      "Dante's Paradiso - medieval cosmology",
      "Paul's letters - teachings on heaven",
      "Gospel accounts - 'my father's house has many rooms'",
      "Summa Theologiae by Thomas Aquinas"
    ]
  },

  hindu_karma: {
    structure: "Karma is not a realm but a cosmic principle organizing existence across multiple planes and lifetimes. It functions as a self-executing moral law where actions (karma) generate consequences through universal cause-effect chains across infinite rebirths in Samsara.",
    inhabitants: [
      "All sentient beings subject to karma",
      "Brahman - ultimate reality governing karma",
      "Devatas - gods executing karmic justice",
      "Yama - lord of karma and death",
      "The accumulated karmic impressions (samskaras)",
      "Each being carrying their karmic debt and potential"
    ],
    connections: [
      "Samsara - cycle of rebirth driven by karma",
      "Dharma - righteous duty related to karma",
      "Moksha - liberation from karmic cycle",
      "Svarga - heavenly realms earned through positive karma",
      "Naraka - hellish realms as karmic punishment",
      "Guna - three qualities (sattva, rajas, tamas) shaping karma"
    ],
    significance: "Karma represents universal moral causality and the principle of personal responsibility. It explains suffering and inequality as consequences of past actions, offering hope that all beings can improve their state through right action. Central to Hindu understanding of justice and cosmic order.",
    parallels: [
      "Buddhist karma - similar moral causality",
      "Zoroastrian moral balance - good vs evil",
      "Pythagorean metempsychosis - rebirth by merit",
      "Jewish concept of measure-for-measure justice",
      "Taoist karmic balance in Five Elements"
    ],
    sources: [
      "Upanishads - early karma teachings",
      "Bhagavad Gita - Krishna's teachings on karma yoga",
      "Manusmriti (Laws of Manu)",
      "Yoga Sutras of Patanjali",
      "Various Puranas"
    ]
  },

  tarot_tree_of_life: {
    structure: "A geometric diagram with 10 Sephiroth (spheres/emanations) arranged in three pillars (Severity, Mildness, Equilibrium). Connected by 22 paths corresponding to Hebrew letters and Tarot arcana. Represents the emanation of divine reality into material existence.",
    inhabitants: [
      "Kether - Crown (God/infinite potential)",
      "Chokmah - Wisdom (original impulse)",
      "Binah - Understanding (receiving womb)",
      "Chesed - Mercy (expansion)",
      "Geburah - Severity (contraction)",
      "Tiphareth - Beauty (integration/heart)",
      "Netzach - Victory (emotion/desire)",
      "Hod - Splendor (intellect/reason)",
      "Yesod - Foundation (subconscious/dreams)",
      "Malkhuth - Kingdom (material world)",
      "Archangels and planetary spirits corresponding to each"
    ],
    connections: [
      "Ain (Nothingness) - above all sephiroth",
      "Ain Soph (Infinite) - boundless light",
      "Ain Soph Aur (Infinite Light) - luminous source",
      "Abyss - the void between supernal and lower",
      "Pathworking - mystical journeys between sephiroth"
    ],
    significance: "The Tree of Life is a map of consciousness and creation itself. It shows the descent of divine energy into material reality and the ascent of the soul back to God. Each path represents psychological development and spiritual transformation. Central to Hermetic and Kabbalistic mysticism.",
    parallels: [
      "Hindu chakra system - energy centers",
      "Buddhist cosmology - levels of existence",
      "Christian Ladder of Divine Ascent - spiritual progression",
      "Neoplatonic emanation - levels of reality",
      "Alchemical Great Work - transformation stages"
    ],
    sources: [
      "Sefer Yetzirah (Book of Formation)",
      "Zohar (Book of Splendor)",
      "Dion Fortune's writings",
      "Tarot card correspondences",
      "Golden Dawn system texts"
    ]
  },

  sumerian_anunnaki: {
    structure: "The Anunnaki are organized hierarchically under Anu (sky god). They inhabit multiple levels: high Anunnaki (council in heaven), middle Anunnaki (executive functions), and lower Anunnaki (workers). They gather in Nippur and convene in divine assembly (Ekur) for cosmic decisions.",
    inhabitants: [
      "Anu - sky god, father of all",
      "Enlil - lord of wind and storms",
      "Enki - god of waters and wisdom",
      "Ninhursag - mother goddess",
      "Inanna - queen of heaven",
      "Utu - sun god and judge",
      "Nanna - moon god",
      "300 Anunnaki of heaven",
      "600 Anunnaki of earth",
      "Demons and servants of the gods"
    ],
    connections: [
      "Irkalla (Underworld) - ruled by Ereshkigal",
      "Kur - primordial underworld",
      "Heaven (An) - realm of Anu",
      "Earth (Ki) - created for humans",
      "Abzu - fresh water abyss beneath earth"
    ],
    significance: "The Anunnaki represent divine bureaucracy and cosmic administration. They created humans to serve them and maintain cosmic order. Their existence illustrates Sumerian understanding of divine hierarchy, duty, and the interplay between celestial and terrestrial realms. The Anunnaki embody the principle of divine work and governance.",
    parallels: [
      "Egyptian divine council of Ra",
      "Greek Olympian hierarchy",
      "Hindu Deva assembly",
      "Norse Aesir council",
      "Jewish angels and heavenly hosts"
    ],
    sources: [
      "Enuma Elish - creation myth",
      "Atrahasis - flood account",
      "Descent of Inanna - journey through realms",
      "Lugale - Enlil's power",
      "Cuneiform texts from Nippur and Sumeria"
    ]
  },

  greek_underworld: {
    structure: "The Greek Underworld is divided into distinct regions: The Rivers (Styx, Acheron, Lethe, Phlegethon), Tartarus (lowest prison), Elysium (blessed fields), and the Asphodel Meadows (neutral realm). Hades rules from his throne in the deepest point.",
    inhabitants: [
      "Hades - king of the underworld",
      "Persephone - queen",
      "Charon - ferryman",
      "The Furies/Erinyes - avengers",
      "Cerberus - three-headed guard dog",
      "Thanatos - personification of death",
      "Hypnos - god of sleep",
      "Shades/ghosts - all deceased",
      "Tartareans - punished souls"
    ],
    connections: [
      "Mount Olympus - entry point through Hades quest",
      "Earth - mortals descend after death",
      "River Styx - boundary crossing",
      "Tartarus - deepest imprisonment",
      "Elysium - honored dead destination",
      "Oracle of the Dead (Necromanteion)"
    ],
    significance: "The Greek Underworld represents the inevitable fate of all mortals—death and the afterlife. It reflects Greek values of honor, justice, and the importance of proper burial rites. The Underworld is not primarily a place of punishment but of final rest and memory.",
    parallels: [
      "Egyptian Duat - underworld journey",
      "Mesopotamian Irkalla - land of the dead",
      "Judeo-Christian Hell - realm of punishment",
      "Norse Niflheim - misty realm",
      "Hindu Yamaloka - lord of death's domain"
    ],
    sources: [
      "Homer's Odyssey (Book 11)",
      "Virgil's Aeneid (Book 6)",
      "Hesiod's Theogony",
      "Greek mythology collections",
      "Plato's descriptions in dialogues"
    ]
  },

  egyptian_nun: {
    structure: "The Nun is not a localized realm but the primordial ocean state—undifferentiated, formless water surrounding and underlying all existence. It contains infinite potential and cycles eternally around the structured cosmos like an ocean encasing islands.",
    inhabitants: [
      "Aten/Ra - divine spark within Nun",
      "Atum - emerged from Nun",
      "Potential forms awaiting manifestation",
      "Serpents and chaos creatures",
      "The force itself (impersonal)"
    ],
    connections: [
      "Cosmos - island of creation floating in Nun",
      "Duat - underworld realm within Nun",
      "Nile River - earthly manifestation of Nun",
      "Primordial waters - the source",
      "Chaos - the state before creation"
    ],
    significance: "The Nun represents infinite potential, chaos, and the source of all being in Egyptian cosmology. It embodies both danger (dissolution) and creative possibility. The maintenance of cosmic order (Ma'at) requires constant vigilance against the Nun's dissolving chaos.",
    parallels: [
      "Hindu Brahman - ultimate reality",
      "Babylonian Apsu - primordial waters",
      "Taoist Wu (non-being) - formless source",
      "Kabbalistic Ein Soph - infinite nothingness",
      "Gnostic Pleroma - fullness of potential"
    ],
    sources: [
      "Pyramid Texts",
      "Coffin Texts",
      "Memphite Theology",
      "Atum creation accounts",
      "Heliopolitan creation mythology"
    ]
  },

  norse_yggdrasil: {
    structure: "Yggdrasil is an immense ash tree with three main roots extending to different realms and three wells beneath them. Nine Realms hang from its branches and trunk, connected by Yggdrasil. It suffers constant damage but remains eternal, supporting all existence.",
    inhabitants: [
      "Asgard - realm of Aesir gods (branch)",
      "Vanaheim - realm of Vanir gods (branch)",
      "Jotunheim - realm of giants (branch)",
      "Midgard - realm of humans (branch)",
      "Muspelheim - realm of fire (branch)",
      "Niflheim - realm of ice (branch)",
      "Svartalfheim - realm of dark elves (branch)",
      "Alfheim - realm of light elves (branch)",
      "Helheim - realm of dishonored dead (roots)",
      "Ratatosk - squirrel running messages between creatures"
    ],
    connections: [
      "Nine Realms - all hang from Yggdrasil",
      "Bifrost bridge - connects some realms",
      "Three Wells - Hvergelmir, Mimir's Well, Urd's Well",
      "Mimir - guardian of wisdom at roots",
      "Norns - fate-weavers at roots",
      "Nidhogg - dragon at bottom gnawing roots"
    ],
    significance: "Yggdrasil is the axis mundi—the center and support of all existence in Norse cosmology. It represents the interconnectedness of all realms, the eternal struggle against destruction, and the cycle of death and renewal. Even in Ragnarok's destruction, Yggdrasil survives to seed new creation.",
    parallels: [
      "Hindu Mount Meru - world axis",
      "Kabbalistic Tree of Life - cosmic structure",
      "Mesoamerican World Tree - axis mundi",
      "Shamanistic axis mundi - connection of worlds",
      "Celtic Crann Bethadh - tree of life"
    ],
    sources: [
      "Prose Edda - Gylfaginning",
      "Poetic Edda - Völuspá",
      "Hávamál - wisdom texts",
      "Völva prophecy",
      "Norse cosmology texts"
    ]
  },

  christian_trinity: {
    structure: "The Trinity is the paradoxical unity of three persons (Father, Son, Holy Spirit) in one substance (God). Theologically organized as: God the Father (source/creator), God the Son (incarnation/redemption), God the Holy Spirit (presence/sanctification). All co-eternal and co-equal.",
    inhabitants: [
      "God the Father - creator and sustainer",
      "Jesus Christ - incarnate Son",
      "Holy Spirit - divine presence",
      "Created from Trinity: all beings"
    ],
    connections: [
      "Creation - made through Word (Son)",
      "Incarnation - God becoming human",
      "Salvation - work of all three persons",
      "Church - body of Christ",
      "Grace - work of the Spirit",
      "Heaven and Earth - sustenance of Trinity"
    ],
    significance: "The Trinity is the fundamental mystery of Christian theology, expressing the nature of God as simultaneously one and three. It encompasses creation, redemption, and sanctification. The Trinity reveals God's internal relationality and explains how God can be both transcendent and intimate.",
    parallels: [
      "Hindu Trimurti - Brahma, Vishnu, Shiva",
      "Neoplatonic emanations - One, Intellect, Soul",
      "Egyptian Atum-Shu-Tefnut - primary emanations",
      "Kabbalistic Sephiroth triad - unity in multiplicity",
      "Taoist three aspects of Tao"
    ],
    sources: [
      "Gospel accounts - especially John 1",
      "Pauline epistles",
      "Athanasian Creed",
      "Nicene Creed",
      "Theological works of Augustine, Aquinas, Calvin"
    ]
  },

  hindu_karma: {
    structure: "Karma operates as a self-executing universal law of moral causality across infinite timescales and rebirths. Actions generate impressions (samskaras) that shape future circumstances, destiny, and rebirth placement. Three types: Sanchita (accumulated), Prarabdha (ripening), Kriyamana (new).",
    inhabitants: [
      "All sentient beings",
      "Brahman - source and regulator",
      "Devatas - cosmic administrators",
      "Yama - lord of justice and death",
      "The Gunas - three qualities shaping karma"
    ],
    connections: [
      "Samsara - eternal cycle driven by karma",
      "Dharma - righteous duty balancing karma",
      "Moksha - freedom from karmic cycle",
      "Bhagavad Gita - Krishna's teachings on karma yoga",
      "Caste system - understood through karma",
      "Rebirth destiny - determined by karma"
    ],
    significance: "Karma embodies personal responsibility and justice. It explains suffering as consequence of past actions rather than divine punishment. Offers hope through the possibility of improving one's situation through right action. Central to Hindu ethics and understanding of universal order (Rta).",
    parallels: [
      "Buddhist karma - similar causality principle",
      "Confucian cause and effect",
      "Zoroastrian judgment and reward",
      "Islamic divine justice and human choice",
      "Greek concept of divine retribution"
    ],
    sources: [
      "Upanishads",
      "Bhagavad Gita - especially chapters 2-3",
      "Manusmriti",
      "Yoga Sutras of Patanjali",
      "Samkhya philosophy texts"
    ]
  }
};

/**
 * Enrich a cosmology entity with metadata
 */
function enrichCosmologyEntity(entityPath, enrichmentData) {
  try {
    const content = fs.readFileSync(entityPath, 'utf8');
    let entity = JSON.parse(content);

    if (enrichmentData) {
      // Add rich metadata fields
      entity.richMetadata = {
        structure: enrichmentData.structure,
        inhabitants: enrichmentData.inhabitants,
        connections: enrichmentData.connections,
        significance: enrichmentData.significance,
        parallels: enrichmentData.parallels,
        sources: enrichmentData.sources,
        enrichedAt: new Date().toISOString(),
        enrichmentVersion: "2.0"
      };

      // If there's detailed realm info, incorporate it
      if (!entity.realmDetails) {
        entity.realmDetails = {};
      }

      // Merge inhabitants and connections if not already present
      if (!entity.inhabitants || entity.inhabitants.length === 0) {
        entity.inhabitants = enrichmentData.inhabitants.slice(0, 5); // Top 5
      }

      if (!entity.connections || entity.connections.length === 0) {
        entity.connections = enrichmentData.connections.slice(0, 5); // Top 5
      }
    }

    return entity;
  } catch (error) {
    console.error(`Error enriching ${entityPath}: ${error.message}`);
    return null;
  }
}

/**
 * Process all cosmology files
 */
function processCosmologyFiles() {
  const cosmologyDir = path.join(__dirname, '../firebase-assets-downloaded/cosmology');

  if (!fs.existsSync(cosmologyDir)) {
    console.error(`Cosmology directory not found: ${cosmologyDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(cosmologyDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  console.log(`Found ${files.length} cosmology files to process\n`);

  let enriched = 0;
  let skipped = 0;
  const updates = [];

  for (const file of files) {
    const filePath = path.join(cosmologyDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const entity = JSON.parse(content);
    const entityId = entity.id || path.basename(file, '.json');

    // Check if we have enrichment data for this entity
    const enrichmentKey = Object.keys(cosmologyEnrichment).find(key =>
      entityId.includes(key) || key.includes(entityId.split('_').slice(1).join('_'))
    );

    if (enrichmentKey && cosmologyEnrichment[enrichmentKey]) {
      console.log(`Enriching: ${entityId}`);
      const enrichedEntity = enrichCosmologyEntity(filePath, cosmologyEnrichment[enrichmentKey]);

      if (enrichedEntity) {
        fs.writeFileSync(filePath, JSON.stringify(enrichedEntity, null, 2), 'utf8');
        updates.push({
          id: entityId,
          path: filePath,
          fields: Object.keys(cosmologyEnrichment[enrichmentKey])
        });
        enriched++;
      }
    } else {
      console.log(`Skipped: ${entityId} (no enrichment template)`);
      skipped++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Enrichment Complete`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Enriched: ${enriched}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${files.length}`);
  console.log(`\nUpdates applied to:`);
  updates.forEach(update => {
    console.log(`  - ${update.id}`);
    console.log(`    Fields: ${update.fields.join(', ')}`);
  });

  // Generate Firebase update script
  generateFirebaseUpdateScript(updates);
}

/**
 * Generate a script for updating Firebase
 */
function generateFirebaseUpdateScript(updates) {
  const scriptPath = path.join(__dirname, 'firebase-cosmology-update.js');

  const script = `#!/usr/bin/env node

/**
 * Firebase Cosmology Metadata Update Script
 * Auto-generated from enrich-cosmology-metadata.js
 *
 * Usage: node firebase-cosmology-update.js
 *
 * Prerequisites:
 * 1. Initialize Firebase Admin SDK with credentials
 * 2. Ensure you have write permissions to firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase (configure with your credentials)
// const serviceAccount = require('./path/to/service-account-key.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://your-project.firebaseio.com"
// });

const db = admin.firestore();

// Entities to update
const entitiesToUpdate = ${JSON.stringify(updates.map(u => ({
  id: u.id,
  localPath: u.path
})), null, 2)};

/**
 * Update a single cosmology entity in Firebase
 */
async function updateCosmologyEntity(entityId, localPath) {
  try {
    const content = fs.readFileSync(localPath, 'utf8');
    const entity = JSON.parse(content);

    await db.collection('cosmology').doc(entityId).set(entity, { merge: true });
    console.log(\`✓ Updated: \${entityId}\`);
    return true;
  } catch (error) {
    console.error(\`✗ Failed to update \${entityId}: \${error.message}\`);
    return false;
  }
}

/**
 * Batch update all entities
 */
async function batchUpdateCosmology() {
  console.log(\`Updating \${entitiesToUpdate.length} cosmology entities...\n\`);

  let success = 0;
  let failed = 0;

  for (const entity of entitiesToUpdate) {
    const updated = await updateCosmologyEntity(entity.id, entity.localPath);
    if (updated) {
      success++;
    } else {
      failed++;
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(\`\n\${'='.repeat(60)}\`);
  console.log(\`Firebase Update Complete\`);
  console.log(\`\${'='.repeat(60)}\`);
  console.log(\`Success: \${success}\`);
  console.log(\`Failed: \${failed}\`);
  console.log(\`Total: \${entitiesToUpdate.length}\`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run updates
batchUpdateCosmology().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
`;

  fs.writeFileSync(scriptPath, script, 'utf8');
  console.log(`\nGenerated Firebase update script: ${scriptPath}`);
  console.log('Run with: node scripts/firebase-cosmology-update.js');
}

// Run the enrichment
processCosmologyFiles();

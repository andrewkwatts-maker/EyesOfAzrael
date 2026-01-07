/**
 * Norse Mythology Enrichment Script
 *
 * This script enriches Firebase JSON files with content extracted from HTML files.
 * It adds mythology, family, worship, keyMyths, sources, and extendedContent fields.
 */

const fs = require('fs');
const path = require('path');

// Paths
const FIREBASE_ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const HTML_SOURCE_DIR = path.join(__dirname, '..', '_recovered-html', 'FIREBASE', 'mythos', 'norse');

// Enrichment data extracted from HTML files
const NORSE_ENRICHMENT_DATA = {
  // DEITIES
  deities: {
    odin: {
      mythology: {
        overview: "Odin is the most complex and paradoxical of the Norse gods - simultaneously wise and ruthless, noble and treacherous, lawgiver and oath-breaker. Unlike Thor who protects humanity directly, Odin's concern is cosmic: gathering knowledge and warriors to delay the inevitable doom of Ragnarok.",
        significance: "The one-eyed wanderer who sacrificed himself to himself, hung on the World Tree for nine nights to gain the runes, and rules Asgard with wisdom bought through suffering. King of the Aesir, lord of Valhalla, patron of poets, shamans, and warriors who seek glory through death.",
        archetypes: ["Allfather", "Sky Lord", "Wisdom Seeker", "Psychopomp"]
      },
      family: {
        parents: { father: "Bor", mother: "Bestla (a giantess)" },
        consorts: ["Frigg (primary wife)", "Jord/Earth (mother of Thor)", "Grid (giantess mother of Vidar)"],
        children: ["Thor (with Jord)", "Baldr and Hod (with Frigg)", "Vidar (with Grid)", "Vali", "Hermod"],
        siblings: ["Vili", "Ve"]
      },
      worship: {
        sacredSites: ["Old Uppsala in Sweden", "Temples (hof) in Viking Age Scandinavia", "Sacred groves for hangings"],
        festivals: [
          { name: "Yule (Midwinter)", description: "Odin leads the Wild Hunt during the darkest nights. Sacrifices and feasts honor the Allfather." },
          { name: "Sigrblot (Victory Sacrifice)", description: "Spring festival before summer campaigns where warriors made offerings for victory in battle." }
        ],
        offerings: ["Warriors hanged on trees or impaled with spears", "Mead and ale", "Poetry and rune-carving", "Weapons cast into sacred waters"]
      },
      keyMyths: [
        { title: "The Sacrifice for the Runes", description: "Odin hung himself on Yggdrasil for nine days and nights, pierced by his own spear, without food or water, to receive the knowledge of the runes." },
        { title: "The Mead of Poetry", description: "Odin seduced the giantess Gunnlod to steal the Mead of Poetry (Odrerir), which grants wisdom and poetic inspiration." },
        { title: "Sacrifice of His Eye", description: "To drink from Mimir's Well of Wisdom beneath Yggdrasil's roots, Odin gouged out his own eye as payment." }
      ],
      sources: ["Poetic Edda (Havamal, Voluspa, Grimnismal)", "Prose Edda (Gylfaginning)", "Ynglinga Saga"],
      allies: ["Thor (son)", "Tyr (war companion)", "Heimdall (watchman)", "Mimir's head (advisor)"],
      enemies: ["Fenrir wolf (destined to kill him at Ragnarok)", "Giants"],
      attributes: {
        titles: ["Allfather", "Valfather", "Grimnir (Masked One)", "Gangleri (Wanderer)", "High One", "Har", "Bolverk (Evil-Doer)"],
        domains: ["Wisdom", "war", "death", "poetry", "magic", "runes", "prophecy", "knowledge", "battle strategy", "the gallows"],
        symbols: ["Spear Gungnir", "Valknut (three interlocked triangles)", "hanged man", "one eye"],
        sacredAnimals: ["Ravens Huginn (Thought) and Muninn (Memory)", "Wolves Geri and Freki", "Eight-legged horse Sleipnir"]
      }
    },
    thor: {
      mythology: {
        overview: "Thor is the most straightforward of the major Norse gods - while Odin schemes and trades in knowledge, Thor's approach is direct action. He is mighty, brave, somewhat hot-tempered, and fiercely protective of both Asgard and Midgard.",
        significance: "The mightiest warrior of the Aesir, wielder of the hammer Mjolnir, and defender of gods and humans against the chaotic forces of the giants. Red-bearded and fierce in battle yet a friend to mankind.",
        archetypes: ["Thunder God", "Protector", "Giant-Slayer"]
      },
      family: {
        parents: { father: "Odin", mother: "Jord/Earth (a giantess)" },
        consorts: ["Sif (wife, golden-haired goddess)", "Jarnsaxa (giantess)"],
        children: ["Modi ('Courage') and Magni ('Strength') with Jarnsaxa", "Thrud ('Power') with Sif", "Ullr (stepson)"],
        siblings: ["Baldr (half-brother)", "Hod (half-brother)", "Vidar (half-brother)", "Vali (half-brother)"]
      },
      worship: {
        sacredSites: ["Place names containing Thor across Scandinavia", "Sacred groves", "Hammer symbols on runestones"],
        festivals: [
          { name: "Thorrablot (Mid-Winter)", description: "Festival dedicated to Thor during the harsh winter month called Thorri." },
          { name: "Spring Planting Blessings", description: "Farmers invoked Thor for rain and protection of crops." }
        ],
        offerings: ["Grain and livestock", "Goats especially", "Ale and mead", "The hammer sign over food and drink"]
      },
      keyMyths: [
        { title: "Thor's Fishing for Jormungandr", description: "Thor went fishing with the giant Hymir and nearly pulled the Midgard Serpent from the ocean, intending to kill it." },
        { title: "The Theft of Mjolnir", description: "When the giant Thrym stole Thor's hammer, Thor disguised himself as Freyja to attend the wedding feast and slaughtered the giants." },
        { title: "Thor's Journey to Utgard-Loki", description: "Thor faced impossible challenges that were actually illusions, showing even the mightiest god faces limits." }
      ],
      sources: ["Poetic Edda (Thrymskvida, Hymiskvida, Lokasenna)", "Prose Edda (Gylfaginning)", "Haustlong"],
      allies: ["Tyr (fellow warrior god)", "Loki (complex relationship)", "humanity in general"],
      enemies: ["The giants (jotnar)", "Jormungandr the Midgard Serpent (his destined killer at Ragnarok)"],
      attributes: {
        titles: ["Thunder God", "Defender of Midgard", "Slayer of Giants", "Charioteer", "Vingthor (Hallower)"],
        domains: ["Thunder", "lightning", "storms", "strength", "protection", "fertility (through rain)", "consecration", "agriculture"],
        symbols: ["Hammer Mjolnir", "lightning bolts", "thunder", "chariot", "hammer amulets"],
        sacredAnimals: ["Goats Tanngrisnir and Tanngnjostor"]
      }
    },
    loki: {
      mythology: {
        overview: "Loki is the most complex and contradictory figure in Norse mythology - neither fully evil nor good, neither god nor giant, but something in between. He is a necessary force of chaos that tests the gods and pushes them to adapt.",
        significance: "The shapeshifter and trickster who dwells among the gods despite being a giant's son. Blood-brother to Odin, father of monsters, helper and betrayer of the Aesir.",
        archetypes: ["Trickster", "Agent of Chaos", "Shapeshifter"]
      },
      family: {
        parents: { father: "Farbauti (a giant)", mother: "Laufey or Nal" },
        consorts: ["Sigyn (wife)", "Angrboda (giantess, mother of his monster children)"],
        children: ["Fenrir (great wolf)", "Jormungandr (world serpent)", "Hel (goddess of death)", "Sleipnir (as mother)", "Nari and Vali (sons with Sigyn)"],
        bloodBrother: "Odin"
      },
      worship: {
        note: "Loki was not worshipped in the traditional sense as he represents chaos and trickery."
      },
      keyMyths: [
        { title: "Birth of Sleipnir", description: "Loki transformed into a mare to lure away a giant's stallion, later giving birth to the eight-legged horse Sleipnir." },
        { title: "The Death of Baldr", description: "Loki discovered that mistletoe could harm Baldr and tricked the blind god Hod into throwing it, killing the most beloved of the gods." },
        { title: "The Binding of Loki", description: "As punishment for Baldr's death, the gods bound Loki with his son's entrails. A serpent drips venom on his face, causing earthquakes when he writhes." },
        { title: "The Treasures of the Gods", description: "After cutting off Sif's hair, Loki commissioned the dwarves to create Mjolnir, Gungnir, and other treasures." }
      ],
      sources: ["Poetic Edda (Lokasenna, Voluspa)", "Prose Edda (Gylfaginning)"],
      attributes: {
        titles: ["Trickster", "Shapeshifter", "Sly One", "Father of Lies", "Breaker of Worlds"],
        domains: ["Trickery", "chaos", "fire", "cunning", "deception", "transformation", "mischief"],
        symbols: ["Fire", "snakes", "fishing net", "masks", "the bound god"]
      }
    },
    freyja: {
      mythology: {
        overview: "Freyja is a complex goddess who defies simple categorization. She is both love goddess and war goddess, beautiful maiden and powerful seeress, generous giver and fierce protector of what is hers.",
        significance: "The most renowned of the Vanir, goddess of love, beauty, fertility, gold, death in battle, and seidr magic. She receives half of those who die in combat, choosing before Odin.",
        archetypes: ["Love Goddess", "War Goddess", "Seeress", "Fertility Deity"]
      },
      family: {
        parents: { father: "Njord (god of sea and wealth)", mother: "Unnamed (possibly Nerthus)" },
        consorts: ["Odr (husband, often absent, possibly another name for Odin)"],
        children: ["Hnoss and Gersemi (daughters)"],
        siblings: ["Freyr (twin brother)"]
      },
      worship: {
        sacredSites: ["Groves sacred to love and fertility in Sweden", "Sites where volvas practiced seidr"],
        festivals: [
          { name: "Disablot (Late Winter)", description: "Festival honoring female spirits and goddesses, with Freyja as chief Dis." },
          { name: "Winter Nights (Autumn)", description: "Harvest festival thanking the Vanir for prosperity and fertility." }
        ],
        offerings: ["Mead, honey, flowers", "Gold and amber jewelry", "Cakes and sweet foods", "Flax"]
      },
      keyMyths: [
        { title: "The Brisingamen Necklace", description: "Freyja spent one night with each of four dwarven brothers to obtain the beautiful golden necklace Brisingamen." },
        { title: "Freyja's Tears of Gold", description: "Freyja searched for her wandering husband Odr, weeping tears that turned to gold on land and amber in the sea." },
        { title: "The Giant Who Wanted Freyja", description: "Giants repeatedly desire Freyja as their prize, showing she is the most valued being in the Nine Realms." }
      ],
      sources: ["Poetic Edda (Thrymskvida, Hyndluljod, Voluspa)", "Prose Edda (Gylfaginning)", "Heimskringla (Ynglinga Saga)"],
      attributes: {
        titles: ["Lady (Freyja means 'Lady')", "Vanadis (Vanir Goddess)", "Mardoll (Sea-Bright)", "Gefn (Giver)"],
        domains: ["Love", "beauty", "fertility", "sex", "war", "death", "magic (seidr)", "gold", "prophecy"],
        symbols: ["Necklace Brisingamen", "falcon cloak", "boar Hildisvini", "chariot pulled by cats"]
      }
    },
    frigg: {
      mythology: {
        overview: "Frigg is often described as knowing all fates yet choosing not to reveal them - a powerful wisdom that comes with the burden of foresight. She rules Asgard alongside Odin with focus on domestic harmony and maternal protection.",
        significance: "Wife of Odin and queen of the Aesir, goddess of marriage, motherhood, domestic life, and foresight. The only goddess permitted to sit on Odin's throne Hlidskjalf.",
        archetypes: ["Queen of Heaven", "Mother Goddess", "Fate Keeper"]
      },
      family: {
        parents: { father: "Fjorgynn (obscure giant or deity)", mother: "Unknown" },
        consorts: ["Odin (husband)"],
        children: ["Baldr (beloved son)", "Hod (blind son)"],
        stepchildren: ["Thor", "Vidar", "Vali"]
      },
      worship: {
        sacredSites: ["The home itself as temple", "Place names across Germanic world"],
        festivals: [
          { name: "Yule (Midwinter)", description: "Frigg presided alongside Odin. Spinning was forbidden during the twelve days." },
          { name: "Wedding Ceremonies", description: "Every marriage invoked Frigg's blessing." }
        ],
        offerings: ["Flax and wool", "Household items", "Keys", "Silver", "Bread, cheese, ale, woven goods"]
      },
      keyMyths: [
        { title: "The Death of Baldr", description: "Frigg extracted oaths from all things not to harm her son Baldr, but overlooked the mistletoe, leading to his death." },
        { title: "Frigg and Odin's Wager", description: "Frigg tricked Odin by moving his bed so he would see her favored side first and grant them victory." }
      ],
      sources: ["Prose Edda (Gylfaginning)", "Poetic Edda (Lokasenna, Voluspa)", "Gesta Danorum", "Langobardic legends"],
      attributes: {
        titles: ["Queen of Asgard", "First of the Asynjur", "Lady of Fensalir", "Mistress of Foresight"],
        domains: ["Marriage", "motherhood", "domestic life", "prophecy", "foresight", "clouds", "weaving"],
        symbols: ["Spindle", "distaff", "keys", "clouds", "mists", "falcon cloak"]
      }
    },
    tyr: {
      mythology: {
        overview: "Tyr is one of the oldest gods in the Norse pantheon, possibly predating Odin as a chief war deity. He represents the lawful and honorable aspects of warfare, in contrast to Odin's more cunning approach.",
        significance: "The one-handed god of law, justice, and honorable combat who sacrificed his sword hand to bind the monstrous wolf Fenrir.",
        archetypes: ["War God", "Justice Deity", "Sacrifice Archetype"]
      },
      family: {
        parents: { father: "Possibly Odin or Hymir", mother: "Unknown" }
      },
      worship: {
        festivals: [{ name: "Tuesday (Tyr's Day)", description: "Named after Tyr in Germanic languages." }],
        offerings: ["Weapons", "Oaths sworn in his name"]
      },
      keyMyths: [
        { title: "The Binding of Fenrir", description: "Only Tyr had the courage to place his hand in Fenrir's mouth as a pledge of good faith. When Fenrir realized he could not break free, he bit off Tyr's hand at the wrist." }
      ],
      sources: ["Poetic Edda (Hymiskvida)", "Prose Edda (Gylfaginning)"],
      attributes: {
        titles: ["The One-Handed God", "God of Single Combat", "Keeper of Oaths"],
        domains: ["War", "justice", "law", "oaths", "courage", "honorable combat", "sacrifice"],
        symbols: ["Sword", "spear", "scales of justice", "single right hand", "Tyr rune"]
      }
    },
    baldr: {
      mythology: {
        overview: "Baldr's death marks the beginning of the end, setting in motion the events that lead to Ragnarok. His story is one of light extinguished by treachery.",
        significance: "The most beautiful and beloved of all the gods, son of Odin and Frigg, whose death through Loki's treachery triggers the path to Ragnarok.",
        archetypes: ["Dying God", "Light Bearer", "Innocent Victim"]
      },
      family: {
        parents: { father: "Odin", mother: "Frigg" },
        siblings: ["Hod (blind brother who killed him)"]
      },
      keyMyths: [
        { title: "The Death of Baldr", description: "When Baldr began having prophetic dreams of his death, Frigg extracted oaths from all things except mistletoe. Loki discovered this and guided Hod's hand to throw mistletoe, killing Baldr instantly." }
      ],
      sources: ["Prose Edda (Gylfaginning)", "Poetic Edda (Baldrs draumar)"],
      attributes: {
        titles: ["The Beautiful", "The Shining One", "The Good"],
        domains: ["Light", "beauty", "purity", "goodness", "joy", "peace"],
        symbols: ["Mistletoe", "light", "ships", "white flowers"]
      }
    },
    heimdall: {
      mythology: {
        overview: "Heimdall occupies a unique position among the Norse gods as the eternal watcher, the threshold guardian who stands between realms. His role is one of patient vigilance.",
        significance: "The ever-vigilant sentinel who stands at the edge of Asgard, watching over the rainbow bridge Bifrost with supernatural senses. Born of nine mothers, he will blow Gjallarhorn at Ragnarok.",
        archetypes: ["Threshold Guardian", "Divine Sentinel", "Herald"]
      },
      family: {
        parents: { mothers: "Nine daughters of Aegir and Ran (personifications of the waves)", father: "Sometimes identified as Odin" },
        children: "As Rig, he fathered Thrall, Karl, and Jarl - the ancestors of the three social classes"
      },
      worship: {
        sacredSites: ["Boundaries, thresholds, and coastal watchtowers", "Harbors and promontories"],
        offerings: ["Mead poured at dawn", "Gold objects", "White animals (especially rams)"]
      },
      keyMyths: [
        { title: "Guardian of Bifrost", description: "Heimdall dwells in Himinbjorg at the top of the rainbow bridge, watching with eyes that see for a hundred leagues and ears that hear grass growing." },
        { title: "Gjallarhorn", description: "Heimdall possesses the great horn that will be heard throughout all the Nine Worlds when he sounds it at Ragnarok." },
        { title: "The Rigsthula", description: "As 'Rig', Heimdall walked among humans and fathered the three classes of Norse society: thralls, karls, and jarls." },
        { title: "Recovery of Freyja's Necklace", description: "Heimdall pursued Loki who stole Brisingamen, and they fought as seals. Heimdall emerged victorious." }
      ],
      sources: ["Poetic Edda (Voluspa, Rigsthula, Lokasenna)", "Prose Edda (Gylfaginning)", "Skaldic Poetry"],
      attributes: {
        titles: ["Guardian of Bifrost", "Whitest of the Aesir", "Rig", "Watchman of the Gods", "Gullintanni (Gold-Toothed)"],
        domains: ["Watchfulness", "foresight", "light", "vigilance", "protection", "dawn", "perception", "boundaries"],
        symbols: ["Horn Gjallarhorn", "rainbow bridge Bifrost", "golden teeth", "rams", "sword Hofund"]
      }
    }
  },

  // CREATURES
  creatures: {
    jotnar: {
      mythology: {
        overview: "The Jotnar (singular: Jotunn) are the giants of Norse mythology, primordial beings who embody the raw, untamed forces of nature. Though often called 'giants,' they represent chaos, wilderness, and the primal powers that existed before the ordered cosmos.",
        origins: "In the beginning was the void Ginnungagap. When heat and ice met, they created the first being: Ymir, the primordial frost giant. From Ymir's body, more giants were born.",
        types: ["Frost Giants (Hrimthursar)", "Fire Giants (Eldjotnar)", "Mountain Giants (Bergrisar)", "Storm Giants"]
      },
      keyFigures: [
        { name: "Ymir", description: "The primordial frost giant whose body became the cosmos when Odin and his brothers killed him." },
        { name: "Surtr", description: "The fire giant who rules Muspelheim and will lead the fire giants against the gods at Ragnarok." },
        { name: "Skadi", description: "Goddess of winter and hunting, a giantess who married into the Aesir." },
        { name: "Thrym", description: "The giant who stole Thor's hammer and demanded Freyja as ransom." },
        { name: "Utgard-Loki", description: "A cunning giant king who tricked Thor through illusions." }
      ],
      sources: ["Prose Edda (Gylfaginning)", "Poetic Edda (Voluspa, Thrymskvida)"],
      habitat: "Jotunheim (realm of giants), mountains, frozen wastelands, dark forests"
    }
  },

  // HEROES
  heroes: {
    sigurd: {
      mythology: {
        overview: "Sigurd (Siegfried in Germanic tradition) was the greatest hero of Norse mythology, famous for slaying the dragon Fafnir, claiming a cursed treasure, and awakening the valkyrie Brynhildr.",
        significance: "His tragic story explores themes of heroism, fate, betrayal, and the destructive power of cursed gold.",
        legacy: "Sigurd's tale influenced Wagner's 'Ring Cycle' and countless medieval epics."
      },
      family: {
        parents: { father: "Sigmund (descended from Odin)", mother: "Hjordis" },
        fosterFather: "Regin (the cunning dwarf)"
      },
      keyMyths: [
        { title: "Slaying of Fafnir", description: "Sigurd dug a pit in Fafnir's path and thrust the sword Gram into the dragon's underbelly. Tasting the dragon's blood gave him the ability to understand bird speech." },
        { title: "Awakening Brynhildr", description: "Sigurd rode through flames to awaken the valkyrie Brynhildr from enchanted sleep, and they pledged eternal love." },
        { title: "The Betrayal", description: "A magic potion made Sigurd forget Brynhildr. The deception was revealed and Sigurd was murdered, with Brynhildr choosing to die on his funeral pyre." }
      ],
      sources: ["Volsunga Saga", "Poetic Edda"],
      weapons: ["Gram (the dragon-slaying sword, reforged by Regin)"],
      allies: ["Regin (initially)", "Brynhildr", "Odin (divine ancestor)"],
      enemies: ["Fafnir", "Regin (betrayed him)", "The curse of Andvaranaut"]
    }
  },

  // COSMOLOGY
  cosmology: {
    yggdrasil: {
      mythology: {
        overview: "Yggdrasil is the enormous ash tree that stands at the center of the Norse cosmos, connecting all Nine Realms. It is both the physical and spiritual axis mundi around which all cosmic activity revolves.",
        nameMeaning: "'Odin's horse' or 'Steed of the Terrible One' - may reference Odin's self-sacrifice when he hung himself on the tree for nine days.",
        structure: {
          roots: [
            { location: "Asgard", wellBeneath: "Urdarbrunnr (Well of Urd) where the Norns dwell" },
            { location: "Jotunheim", wellBeneath: "Mimisbrunnr (Mimir's Well of Wisdom)" },
            { location: "Niflheim", wellBeneath: "Hvergelmir (source of rivers, home of Nidhogg)" }
          ],
          nineRealms: ["Asgard", "Vanaheim", "Alfheim", "Midgard", "Jotunheim", "Svartalfheim", "Niflheim", "Muspelheim", "Helheim"]
        }
      },
      inhabitants: [
        { name: "Nidhogg", description: "A dragon that gnaws constantly at the root in Niflheim." },
        { name: "The Eagle", description: "An unnamed eagle of great wisdom sits at the top." },
        { name: "Ratatoskr", description: "A squirrel that carries messages (often insults) between the eagle and Nidhogg." },
        { name: "Four Stags", description: "Dainn, Dvalinn, Duneyrr, and Durathor browse among the branches." },
        { name: "The Norns", description: "Three fate goddesses who water the tree daily." }
      ],
      sources: ["Poetic Edda (Voluspa, Havamal, Grimnismal)", "Prose Edda (Gylfaginning)"]
    },
    ragnarok: {
      mythology: {
        overview: "Ragnarok is the prophesied end of the cosmos in Norse mythology - a series of catastrophic events culminating in a great battle that will result in the deaths of numerous gods and the destruction of the Nine Realms.",
        uniqueAspect: "What makes Ragnarok unique is that the gods know it is coming. Despite this knowledge, Ragnarok cannot be prevented - it is woven into the fabric of fate itself.",
        signs: ["Death of Baldr", "Binding and escape of Loki", "Fimbulwinter (three successive winters)", "Wolves devouring sun and moon", "Great earthquakes"]
      },
      greatDuels: [
        { combatants: "Odin vs Fenrir", outcome: "Fenrir will swallow Odin. Vidar will avenge his father." },
        { combatants: "Thor vs Jormungandr", outcome: "Thor kills the serpent but dies from its venom after nine steps." },
        { combatants: "Heimdall vs Loki", outcome: "They will slay each other." },
        { combatants: "Freyr vs Surtr", outcome: "Freyr will fall because he gave away his magical sword." },
        { combatants: "Tyr vs Garmr", outcome: "They will kill each other." }
      ],
      aftermath: "After Ragnarok, the world will rise again from the sea, green and fertile. Surviving gods include Vidar, Vali, Modi, Magni, and Baldr returns from Hel. Two humans, Lif and Lifthrasir, survive by hiding in Yggdrasil.",
      sources: ["Poetic Edda (Voluspa)", "Prose Edda (Gylfaginning)", "Vafthr udnismal"]
    }
  },

  // PLACES
  places: {
    asgard: {
      extendedContent: {
        description: "The fortified home of the Aesir gods, connected to Midgard by the rainbow bridge Bifrost. A realm of golden halls and divine power at the top of Yggdrasil.",
        halls: ["Valhalla (Odin's hall)", "Bilskirnir (Thor's hall)", "Folkvangr (Freyja's hall)", "Fensalir (Frigg's hall)"],
        features: ["Surrounded by a great wall built by a giant (with Loki's interference preventing completion)", "Located at the top of Yggdrasil"]
      }
    },
    valhalla: {
      extendedContent: {
        description: "Odin's great hall where fallen warriors feast and train for Ragnarok. The ultimate destination for those who die heroically in battle.",
        features: ["540 doors, each wide enough for 800 warriors", "Rafters of spears, roof of shields", "Einherjar fight and feast daily"],
        purpose: "Not heaven but Odin's army, gathered for the final battle at Ragnarok."
      }
    }
  }
};

// Helper function to find matching JSON file
function findMatchingJsonFile(entityType, entityName) {
  const possiblePaths = [
    path.join(FIREBASE_ASSETS_DIR, entityType, `norse_${entityName}.json`),
    path.join(FIREBASE_ASSETS_DIR, entityType, `${entityName}.json`),
    path.join(FIREBASE_ASSETS_DIR, entityType, `norse.json`)
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

// Helper function to deep merge objects
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Main enrichment function
function enrichNorseAssets() {
  let enrichedCount = 0;
  const enrichmentReport = [];

  console.log('Starting Norse mythology enrichment...\n');

  // Process deities
  console.log('Processing deities...');
  for (const [deityName, enrichmentData] of Object.entries(NORSE_ENRICHMENT_DATA.deities)) {
    const jsonPath = findMatchingJsonFile('deities', deityName);

    if (jsonPath) {
      try {
        const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // Merge enrichment data
        const enrichedData = deepMerge(existingData, {
          mythology: enrichmentData.mythology,
          family: enrichmentData.family,
          worship: enrichmentData.worship,
          keyMyths: enrichmentData.keyMyths,
          sources: enrichmentData.sources,
          allies: enrichmentData.allies,
          enemies: enrichmentData.enemies,
          attributes: enrichmentData.attributes,
          _norseEnrichment: {
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'norse-html-extraction',
            version: '1.0'
          }
        });

        fs.writeFileSync(jsonPath, JSON.stringify(enrichedData, null, 2));
        enrichedCount++;
        enrichmentReport.push({ type: 'deity', name: deityName, file: jsonPath, status: 'enriched' });
        console.log(`  + Enriched: ${deityName} -> ${path.basename(jsonPath)}`);
      } catch (err) {
        enrichmentReport.push({ type: 'deity', name: deityName, file: jsonPath, status: 'error', error: err.message });
        console.log(`  ! Error enriching ${deityName}: ${err.message}`);
      }
    } else {
      enrichmentReport.push({ type: 'deity', name: deityName, file: null, status: 'not_found' });
      console.log(`  - Not found: ${deityName}`);
    }
  }

  // Process creatures
  console.log('\nProcessing creatures...');
  for (const [creatureName, enrichmentData] of Object.entries(NORSE_ENRICHMENT_DATA.creatures)) {
    const jsonPath = findMatchingJsonFile('creatures', creatureName);

    if (jsonPath) {
      try {
        const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const enrichedData = deepMerge(existingData, {
          mythology: enrichmentData.mythology,
          keyFigures: enrichmentData.keyFigures,
          sources: enrichmentData.sources,
          habitat: enrichmentData.habitat,
          _norseEnrichment: {
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'norse-html-extraction',
            version: '1.0'
          }
        });

        fs.writeFileSync(jsonPath, JSON.stringify(enrichedData, null, 2));
        enrichedCount++;
        enrichmentReport.push({ type: 'creature', name: creatureName, file: jsonPath, status: 'enriched' });
        console.log(`  + Enriched: ${creatureName} -> ${path.basename(jsonPath)}`);
      } catch (err) {
        enrichmentReport.push({ type: 'creature', name: creatureName, file: jsonPath, status: 'error', error: err.message });
        console.log(`  ! Error enriching ${creatureName}: ${err.message}`);
      }
    }
  }

  // Process heroes
  console.log('\nProcessing heroes...');
  for (const [heroName, enrichmentData] of Object.entries(NORSE_ENRICHMENT_DATA.heroes)) {
    const jsonPath = findMatchingJsonFile('heroes', heroName);

    if (jsonPath) {
      try {
        const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const enrichedData = deepMerge(existingData, {
          mythology: enrichmentData.mythology,
          family: enrichmentData.family,
          keyMyths: enrichmentData.keyMyths,
          sources: enrichmentData.sources,
          weapons: enrichmentData.weapons,
          allies: enrichmentData.allies,
          enemies: enrichmentData.enemies,
          _norseEnrichment: {
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'norse-html-extraction',
            version: '1.0'
          }
        });

        fs.writeFileSync(jsonPath, JSON.stringify(enrichedData, null, 2));
        enrichedCount++;
        enrichmentReport.push({ type: 'hero', name: heroName, file: jsonPath, status: 'enriched' });
        console.log(`  + Enriched: ${heroName} -> ${path.basename(jsonPath)}`);
      } catch (err) {
        enrichmentReport.push({ type: 'hero', name: heroName, file: jsonPath, status: 'error', error: err.message });
        console.log(`  ! Error enriching ${heroName}: ${err.message}`);
      }
    }
  }

  // Process cosmology
  console.log('\nProcessing cosmology...');
  for (const [conceptName, enrichmentData] of Object.entries(NORSE_ENRICHMENT_DATA.cosmology)) {
    // Try multiple collections
    let jsonPath = findMatchingJsonFile('cosmology', conceptName);
    if (!jsonPath) jsonPath = findMatchingJsonFile('concepts', conceptName);
    if (!jsonPath) jsonPath = findMatchingJsonFile('places', conceptName);

    if (jsonPath) {
      try {
        const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const enrichedData = deepMerge(existingData, {
          mythology: enrichmentData.mythology,
          inhabitants: enrichmentData.inhabitants,
          greatDuels: enrichmentData.greatDuels,
          aftermath: enrichmentData.aftermath,
          sources: enrichmentData.sources,
          _norseEnrichment: {
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'norse-html-extraction',
            version: '1.0'
          }
        });

        fs.writeFileSync(jsonPath, JSON.stringify(enrichedData, null, 2));
        enrichedCount++;
        enrichmentReport.push({ type: 'cosmology', name: conceptName, file: jsonPath, status: 'enriched' });
        console.log(`  + Enriched: ${conceptName} -> ${path.basename(jsonPath)}`);
      } catch (err) {
        enrichmentReport.push({ type: 'cosmology', name: conceptName, file: jsonPath, status: 'error', error: err.message });
        console.log(`  ! Error enriching ${conceptName}: ${err.message}`);
      }
    }
  }

  // Process places
  console.log('\nProcessing places...');
  for (const [placeName, enrichmentData] of Object.entries(NORSE_ENRICHMENT_DATA.places)) {
    const jsonPath = findMatchingJsonFile('places', placeName);

    if (jsonPath) {
      try {
        const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const enrichedData = deepMerge(existingData, {
          extendedContent: enrichmentData.extendedContent,
          _norseEnrichment: {
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'norse-html-extraction',
            version: '1.0'
          }
        });

        fs.writeFileSync(jsonPath, JSON.stringify(enrichedData, null, 2));
        enrichedCount++;
        enrichmentReport.push({ type: 'place', name: placeName, file: jsonPath, status: 'enriched' });
        console.log(`  + Enriched: ${placeName} -> ${path.basename(jsonPath)}`);
      } catch (err) {
        enrichmentReport.push({ type: 'place', name: placeName, file: jsonPath, status: 'error', error: err.message });
        console.log(`  ! Error enriching ${placeName}: ${err.message}`);
      }
    }
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'NORSE_ENRICHMENT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalEnriched: enrichedCount,
    details: enrichmentReport
  }, null, 2));

  console.log('\n========================================');
  console.log(`NORSE ENRICHMENT COMPLETE`);
  console.log(`Total files enriched: ${enrichedCount}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log('========================================\n');

  return enrichedCount;
}

// Run enrichment
enrichNorseAssets();

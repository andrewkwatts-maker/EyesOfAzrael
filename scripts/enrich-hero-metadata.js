/**
 * Hero Metadata Enrichment Script
 *
 * This script enriches hero entities in Firebase with historical and mythological metadata.
 * It extracts and organizes quests, allies, enemies, weapons, abilities, and parentage
 * from hero descriptions and existing data.
 *
 * Usage:
 *   node scripts/enrich-hero-metadata.js [--dry-run] [--hero-id=<id>]
 *
 * Examples:
 *   node scripts/enrich-hero-metadata.js --dry-run          # Preview changes
 *   node scripts/enrich-hero-metadata.js                    # Apply all changes
 *   node scripts/enrich-hero-metadata.js --hero-id=greek_achilles  # Specific hero
 */

const fs = require('fs');
const path = require('path');

// Hero-specific enrichment data based on historical and mythological sources
const heroMetadata = {
  // Greek Heroes
  greek_achilles: {
    quests: [
      'Trojan War - Led the Myrmidons against Troy',
      'Defense of Greek honor - Avenged Patroclus\' death',
      'The Funeral Games - Honored fallen heroes'
    ],
    allies: [
      'Patroclus - Closest companion and lover',
      'Athena - Goddess of wisdom and warfare',
      'The Myrmidons - Loyal warriors from Phthia',
      'Ajax - Fellow Greek hero',
      'Odysseus - Cunning strategist'
    ],
    enemies: [
      'Hector - Troy\'s greatest champion',
      'Paris - Prince of Troy, Achilles\' killer',
      'Apollo - Guided the fatal arrow to Achilles\' heel',
      'Agamemnon - Commanded the Greek forces, source of conflict'
    ],
    weapons: [
      'Xanthos and Balios - Divine horses',
      'Spear forged by Hephaestus',
      'Bronze armor and shield',
      'Divine armor from Hephaestus'
    ],
    abilities: [
      'Superior combat prowess - Nearly invincible in battle',
      'Divine heritage - Son of Thetis',
      'Superhuman strength and speed',
      'Immortality granted through mother\'s blessing',
      'Leadership of the Myrmidons'
    ],
    parentage: {
      divine: 'Thetis - A Nereid (sea-nymph) of the Aegean',
      mortal: 'Peleus - King of the Myrmidons in Phthia',
      heritage: 'Part-god, part-human - Divine warrior heritage'
    }
  },

  greek_heracles: {
    quests: [
      'Twelve Labors - Epic tasks imposed by King Eurystheus',
      'Nemean Lion - Slayed the invulnerable beast',
      'Lernean Hydra - Defeated the many-headed serpent',
      'Golden Apples of Hesperides - Retrieved immortality fruits',
      'Capture of Cerberus - Brought the three-headed dog from Hades',
      'Argonautica - Sailed with Jason and the Argonauts',
      'Rescue of Theseus and Pirithous - From the underworld'
    ],
    allies: [
      'Zeus - Divine father',
      'Athena - Goddess of wisdom and battle strategy',
      'Iolaus - Cousin and companion, helped with Hydra',
      'Jason - Led the Argonauts',
      'Theseus - Fellow hero'
    ],
    enemies: [
      'King Eurystheus - Taskmaster of the Twelve Labors',
      'Nemean Lion - First labor opponent',
      'Lernean Hydra - Second labor opponent',
      'Nessus the Centaur - Caused his death',
      'Hera - Divine antagonist due to Zeus\'s infidelity'
    ],
    weapons: [
      'Adamantine Club (Olive Wood) - Signature weapon',
      'Bow and Arrows - Tipped with Hydra venom',
      'Sword - Bronze blade',
      'Lion Skin - Wore Nemean lion as armor'
    ],
    abilities: [
      'Superhuman strength - Greatest warrior of all',
      'Invulnerability - Enhanced durability',
      'Weapon proficiency - Master of multiple combat forms',
      'Immortality - Achieved after mortal life',
      'Divine lineage - Son of Zeus',
      'Problem-solving - Creative approach to impossible tasks'
    ],
    parentage: {
      divine: 'Zeus - King of the Gods',
      mortal: 'Alcmene - Queen of Thebes, granddaughter of Perseus',
      heritage: 'Demigod - Greatest of all Greek heroes'
    }
  },

  greek_odysseus: {
    quests: [
      'Trojan War - Ten-year siege of Troy',
      'Odyssey - Ten-year journey home to Ithaca',
      'Encounter with Cyclops - Faced Polyphemus',
      'Lotus Eaters - Resisted magical forgetfulness',
      'Aeolus\'s Winds - Obtained winds to sail home',
      'Laestrygonians - Survived attack of giant cannibals',
      'Circe\'s Island - Broke enchantment of transformation',
      'Underworld Journey - Consulted with the dead',
      'Sirens - Resisted deadly song',
      'Scylla and Charybdis - Navigated sea monsters'
    ],
    allies: [
      'Athena - Goddess patron throughout his journey',
      'Telemachus - Son, helped reclaim kingdom',
      'Penelope - Faithful wife',
      'Eum√§us - Loyal swineherd',
      'Philoetius - Faithful gathered',
      'Ajax - Fellow Greek hero'
    ],
    enemies: [
      'Polyphemus - Cyclops, killed men',
      'Poseidon - Pursued Odysseus throughout voyage',
      'Circe - Enchantress (later ally)',
      'The Sirens - Deadly singers',
      'Scylla - Six-headed sea monster',
      'The Suitors - Sought Penelope\'s hand'
    ],
    weapons: [
      'Spear - Bronze war spear',
      'Sword - Bronze blade',
      'Bow - For hunting and defense',
      'Shield - Engraved with divine symbols'
    ],
    abilities: [
      'Strategic cunning - Master tactician',
      'Oratory skill - Persuasive speaker',
      'Resourcefulness - Problem solver',
      'Endurance - Survived 20 years away from home',
      'Disguise mastery - Changed appearance with Athena',
      'Leadership - Commanded respect of men'
    ],
    parentage: {
      mortal: 'Laertes - King of Ithaca; Anticlea - Mother (in some accounts)',
      heritage: 'Mortal king with divine favor from Athena'
    }
  },

  greek_perseus: {
    quests: [
      'Slaying of Medusa - Obtained her head as a weapon',
      'Rescue of Andromeda - Freed her from sea monster Cetus',
      'Golden Apples - Retrieved Hesperides apples (some versions)',
      'Escape from Polydectes - Evaded the king\'s advances'
    ],
    allies: [
      'Athena - Goddess patron, gave shield',
      'Hermes - God messenger, gave flying sandals',
      'Andromeda - Rescued princess, became his wife',
      'Danaë - Mother, protected him'
    ],
    enemies: [
      'Medusa - The Gorgon with serpent hair',
      'Polydectes - King seeking to seduce Danaë',
      'Cetus - Sea monster threatening Andromeda',
      'Acrisius - His grandfather (indirect antagonist)'
    ],
    weapons: [
      'Adamantine Sickle (Harpe) - Forged by Hephaestus',
      'Medusa\'s Head - Used as weapon after her death',
      'Winged Sandals (Talaria) - From Hermes',
      'Shield - From Athena',
      'Helm of Hades - Granted invisibility'
    ],
    abilities: [
      'Combat prowess - Skilled warrior',
      'Divine speed - From winged sandals',
      'Petrification weapon - Medusa\'s head turned foes to stone',
      'Invisibility - Via Helm of Hades',
      'Flying - Traveled through air on winged sandals',
      'Heroic determination - Completed impossible tasks'
    ],
    parentage: {
      divine: 'Zeus - King of the Gods',
      mortal: 'Danaë - Princess of Argos',
      heritage: 'Demigod - Child of Zeus and mortal woman'
    }
  },

  greek_theseus: {
    quests: [
      'Slaying the Minotaur - Defeated monster in the Labyrinth',
      'Labyrinth Navigation - Found way out with Ariadne\'s thread',
      'Abduction of Hippolyta - Captured Amazon queen',
      'Rescue of Ariadne - From abandonment on island',
      'Consolidation of Attica - United the city-states'
    ],
    allies: [
      'Ariadne - Princess of Crete, aided escape',
      'Pirithous - Best friend and fellow hero',
      'Poseidon - Divine father',
      'The Athenians - Citizens he protected'
    ],
    enemies: [
      'Minotaur - Half-bull, half-man monster',
      'King Minos - Demanded tributes',
      'Asterion (Minotaur) - Offspring of Pasiphae',
      'The Labyrinth - Inescapable maze'
    ],
    weapons: [
      'Sword - Bronze blade',
      'Spear - War spear',
      'Aegis shield - Divine protection',
      'Ariadne\'s thread - Navigation aid'
    ],
    abilities: [
      'Combat skill - Master swordsman',
      'Strength - Superhuman physical power',
      'Wisdom - Strategic thinking',
      'Diplomacy - United Attica through persuasion',
      'Leadership - Founded democratic Athens',
      'Bravery - Faced the Minotaur alone'
    ],
    parentage: {
      divine: 'Poseidon - God of the Sea (in most versions)',
      mortal: 'Aethra - Queen of Troezen',
      heritage: 'Demigod - Child of Poseidon or Aegeus'
    }
  },

  greek_jason: {
    quests: [
      'Quest for the Golden Fleece - Led the Argonauts',
      'Voyage of the Argo - Across seas and dangers',
      'Confrontation with Talos - Defeated bronze guardian',
      'Sirens - Resisted deadly song',
      'Clashing Rocks - Navigated through Symplegades',
      'Harpies - Freed Phineus from curse'
    ],
    allies: [
      'Medea - Princess of Colchis, used magic to help',
      'Hercules - Argonaut companion',
      'Orpheus - Musician of the Argo',
      'Castor and Pollux - The Dioscuri, twin Argonauts',
      'Argonauts - His crew of heroes'
    ],
    enemies: [
      'Pelias - Usurper uncle who sent him on quest',
      'Aeetes - King of Colchis, guarded the fleece',
      'Talos - Bronze guardian of Crete',
      'Harpies - Wind demons tormenting Phineus',
      'Clashing Rocks - Natural obstacle'
    ],
    weapons: [
      'Sword - Bronze blade',
      'Spear - War spear',
      'The Argo - Ship built by Argonauts',
      'Medea\'s magic - Used magical assistance'
    ],
    abilities: [
      'Leadership - Led the greatest crew of heroes',
      'Navigation - Found way to Colchis',
      'Combat - Skilled warrior',
      'Persuasion - Convinced Medea to help',
      'Endurance - Survived perilous journey',
      'Strategy - Planned successful missions'
    ],
    parentage: {
      mortal: 'Aeson - King of Thessaly; Polymele - Mother',
      heritage: 'Mortal prince with heroic destiny'
    }
  },

  greek_orpheus: {
    quests: [
      'Quest for Eurydice - Journey to underworld',
      'Argonautica - Sailed with Jason and the Argonauts',
      'Descent to Hades - Attempted rescue from death',
      'Music journey - Used music to charm all beings'
    ],
    allies: [
      'Eurydice - Wife, sought in underworld',
      'Persephone - Queen of underworld, sympathetic',
      'Hades - Offered chance to reclaim Eurydice',
      'The Argonauts - Fellow heroes',
      'Apollo - Divine father'
    ],
    enemies: [
      'Death itself - Permanent and unchangeable',
      'Serpent - Killed Eurydice',
      'Hades - Keeper of underworld',
      'The Maenads - Killed Orpheus in madness'
    ],
    weapons: [
      'Lyre - Made by Hermes, most powerful magical instrument',
      'Voice - Enchanting and persuasive singing',
      'Music - Could charm gods and beasts alike'
    ],
    abilities: [
      'Magic music - Controlled all beings through song',
      'Charm - Persuaded Hades himself',
      'Poetry - Created most beautiful verses',
      'Divine favor - Son of Apollo',
      'Animal control - Charmed beasts with music',
      'Underworld navigation - Traveled safely through Hades'
    ],
    parentage: {
      divine: 'Apollo - God of music, sun, and prophecy',
      mortal: 'Calliope - Muse of epic poetry (in some versions)',
      heritage: 'Demigod with divine musical talents'
    }
  },

  // Norse Heroes
  norse_sigurd: {
    quests: [
      'Slaying of Fafnir - Defeated the dragon guarding gold',
      'Recovery of Andvaranaut - Obtained cursed treasure',
      'Awakening of Brynhildr - Broke the flames protecting her',
      'Navigation of Hindarfjall - Crossed mountain barriers'
    ],
    allies: [
      'Regin - Dwarf smith and mentor',
      'Brynhildr - Shield-maiden warrior',
      'Odin - All-father provided wisdom',
      'The Völva - Prophetesses of fate'
    ],
    enemies: [
      'Fafnir - The dragon, former dwarf',
      'Regin - Betrayed after Fafnir slaying',
      'Curse of Andvaranaut - Magical curse',
      'Loki\'s influence - Caused much of the tragedy'
    ],
    weapons: [
      'Gram - The dragon-slaying sword, reforged by Regin',
      'Legendary blade - One of the greatest weapons',
      'Shield - Protection in battle'
    ],
    abilities: [
      'Dragon slaying - Defeated mighty Fafnir',
      'Combat mastery - Unmatched swordsman',
      'Magical understanding - Comprehended dragon blood',
      'Leadership - Commanded respect',
      'Fate resistance - Struggled against destiny'
    ],
    parentage: {
      mortal: 'Völsung - King of ancient bloodline',
      heritage: 'Member of the Völsunga clan, heroic lineage'
    }
  },

  // Hindu Heroes
  hindu_krishna: {
    quests: [
      'Bhagavad Gita - Spiritual teaching on battlefield',
      'Kurukshetra War - Great war of righteousness',
      'Removal of Kamsa - Defeated evil king uncle',
      'Dance of divine love - Raas Leela with gopis',
      'Govardhan defense - Lifted mountain to save village'
    ],
    allies: [
      'Arjuna - Chief ally and charioteer',
      'Yudhisthira - Dharma-righteous king',
      'Bhima - Powerful warrior cousin',
      'Gopis - Milkmaids of Vrindavan',
      'Radha - Divine consort'
    ],
    enemies: [
      'Kamsa - Tyrannical king uncle',
      'Kuvalayananda - Elephant warrior',
      'Dhenuka - Demon guardian',
      'Indra - God of storms (opposed Krishna)',
      'The Kauravas - Cousins in war'
    ],
    weapons: [
      'Sudarshana Chakra - Magical disc weapon',
      'Bow - Used in Kurukshetra War',
      'Flute - Magical instrument of divine love',
      'Conch shell - Produces cosmic sound'
    ],
    abilities: [
      'Divinity - Eighth avatar of Vishnu',
      'Manipulation of Maya - Control over illusion',
      'Spiritual wisdom - Teacher of dharma',
      'Charm - Attracts all to his presence',
      'Combat mastery - Skilled warrior',
      'Supernatural powers - Miracles and magic',
      'Immortal life - Multiple births and appearances'
    ],
    parentage: {
      divine: 'Vishnu - Preserver god, eighth avatar',
      mortal: 'Devaki - Mother; Vasudeva - Father',
      heritage: 'Divine incarnation, supreme lord'
    }
  },

  hindu_rama: {
    quests: [
      'Exile to Dandaka Forest - 14-year banishment',
      'Search for Sita - Across lands and demons',
      'Rescue of Sita - From demon king Ravana',
      'Lanka Campaign - War against demons',
      'Bridge to Lanka - Assembled monkey army'
    ],
    allies: [
      'Hanuman - Devoted monkey general',
      'Lakshmana - Devoted brother',
      'Sita - Beloved wife',
      'Sugriva - Monkey king ally',
      'Vibhishana - Demon ally'
    ],
    enemies: [
      'Ravana - Demon king of Lanka',
      'Kumbhakarna - Ravana\'s brother',
      'Indrajit - Ravana\'s son',
      'The demons of Lanka - Evil forces',
      'Vali - Monkey king antagonist'
    ],
    weapons: [
      'Bow and arrows - Legendary archery',
      'Astra weapons - Magical arrow weapons',
      'Sword - Bronze blade',
      'Divine weapons - Granted by gods'
    ],
    abilities: [
      'Perfect virtue - Embodiment of righteousness',
      'Archery mastery - Greatest archer',
      'Divine favor - Son of Vishnu avatar',
      'Strategic mind - Great general',
      'Moral authority - Upholder of dharma',
      'Supernatural strength - Demigod powers'
    ],
    parentage: {
      mortal: 'Dasharatha - King of Ayodhya; Kaushalya - Mother',
      heritage: 'Seventh avatar of Vishnu, divine mortal'
    }
  },

  // Sumerian Heroes
  sumerian_gilgamesh: {
    quests: [
      'Cedar Forest - Slayed Humbaba',
      'Bull of Heaven - Defeated bull sent by Ishtar',
      'Quest for immortality - Journey to find Utnapishtim',
      'Plant of eternal youth - Sought fountain of immortality',
      'Flood story - Learned ancient history'
    ],
    allies: [
      'Enkidu - Best friend and companion',
      'Siduri - Tavern-keeper, provided guidance',
      'Urshanabi - Boatman to Utnapishtim',
      'Utnapishtim - Survivor of flood, guide',
      'Shamash - Sun god, provided support'
    ],
    enemies: [
      'Humbaba - Guardian of Cedar Forest',
      'Bull of Heaven - Sent by Ishtar',
      'Ishtar - Goddess rejected, sent calamities',
      'Death itself - Ultimate opponent',
      'Serpent - Stole plant of youth'
    ],
    weapons: [
      'Sword - Bronze blade',
      'Ax - Weapon of war',
      'Divine aid - Shamash provided light',
      'Courage - Greatest weapon'
    ],
    abilities: [
      'Kingship - 2/3 god, 1/3 human',
      'Great strength - Two-thirds divine',
      'Eloquence - Persuasive speaker',
      'Wisdom - Seeker of knowledge',
      'Leadership - United people',
      'Perseverance - Endured long journey'
    ],
    parentage: {
      divine: 'Lugal-anda - Divine ancestor (in some versions)',
      mortal: 'Ninsun - Mother (goddess); Lugalbanda - Divine father',
      heritage: '2/3 divine, 1/3 human - Rare hybrid'
    }
  },

  // Islamic Heroes
  islamic_abraham: {
    quests: [
      'Covenant with God - Established faith',
      'Migration to Canaan - Traveled to promised land',
      'Trial of faith - Willingness to sacrifice son',
      'Building of Kaaba - Constructed sacred house',
      'Monotheism - Established pure faith in one God'
    ],
    allies: [
      'Allah - God, guide throughout life',
      'Ishmael - Firstborn son',
      'Isaac - Son of promise',
      'Hagar - Mother of Ishmael',
      'Sarah - Beloved wife'
    ],
    enemies: [
      'Idolatry - Fought against false gods',
      'Nimrod - Tyrant king opposed him',
      'Internal doubt - Tested faith',
      'Societal rejection - People opposed him'
    ],
    weapons: [
      'Faith - Strongest spiritual weapon',
      'Prayer - Communication with divine',
      'Trust in God - Core virtue',
      'Moral conviction - Absolute righteousness'
    ],
    abilities: [
      'Prophetic faith - Received divine revelation',
      'Leadership - Established faithful community',
      'Perseverance - Endured all trials',
      'Moral courage - Stood against false gods',
      'Obedience - Submitted to God\'s will',
      'Spiritual authority - Father of believers'
    ],
    parentage: {
      mortal: 'Terah - Father; Amathalayah - Mother (in some traditions)',
      heritage: 'Patriarch and friend of God, spiritual ancestor'
    }
  },

  // Jewish Heroes
  jewish_moses: {
    quests: [
      'Exodus from Egypt - Led enslaved people to freedom',
      'Parting of Red Sea - Miraculous escape',
      'Receiving Torah - Mount Sinai revelation',
      'Wilderness journey - 40 years in desert',
      'Guidance to Promised Land - Led to Canaan'
    ],
    allies: [
      'Aaron - Brother and high priest',
      'Miriam - Sister and prophetess',
      'Joshua - Successor and military leader',
      'God (Yahweh) - Divine guide',
      'The Israelites - People he led'
    ],
    enemies: [
      'Pharaoh - Egyptian oppressor',
      'Rameses - King he opposed',
      'Doubt and fear - Within his people',
      'Golden Calf worshippers - False believers',
      'The wilderness itself - Natural obstacles'
    ],
    weapons: [
      'Staff - Magical rod of God',
      'Divine favor - God\'s power',
      'Torah - Spiritual authority',
      'Prayer - Communication with divine'
    ],
    abilities: [
      'Prophetic power - Direct communication with God',
      'Miracle working - Ten plagues, parting sea',
      'Leadership - United diverse people',
      'Spiritual authority - Received divine law',
      'Perseverance - Endured 40 years in wilderness',
      'Moral courage - Confronted Pharaoh'
    ],
    parentage: {
      mortal: 'Amram - Father; Jochebed - Mother',
      heritage: 'Levite of priestly line, chosen prophet'
    }
  },

  // Christian Heroes
  christian_jesus: {
    quests: [
      'Ministry and preaching - Spread gospel of love',
      'Temptation in wilderness - Resisted Satan',
      'Miracles and healing - Cured the sick',
      'Crucifixion - Ultimate sacrifice',
      'Resurrection - Victory over death'
    ],
    allies: [
      'Disciples - Twelve apostles',
      'Mary Magdalene - Devoted follower',
      'John the Baptist - Precursor',
      'God the Father - Divine source',
      'Holy Spirit - Divine presence'
    ],
    enemies: [
      'Satan - Adversary in wilderness',
      'Roman authorities - Crucified him',
      'Pharisees - Religious opponents',
      'Sin itself - Ultimate enemy',
      'Death - Overcome through resurrection'
    ],
    weapons: [
      'Word of God - Teaching and preaching',
      'Love and compassion - Spiritual power',
      'Prayer - Divine connection',
      'Sacrifice - Ultimate redemption tool'
    ],
    abilities: [
      'Divine nature - Son of God',
      'Miracle working - Healing and signs',
      'Teaching - Spiritual wisdom',
      'Forgiveness - Redemptive power',
      'Resurrection - Victory over death',
      'Universal appeal - Message to all'
    ],
    parentage: {
      divine: 'God the Father - Creator and source',
      mortal: 'Mary - Human mother',
      heritage: 'Incarnate divine being, God and man'
    }
  }
};

// Common abilities mapping for all mythologies
const commonAbilities = {
  warrior: 'Superior combat skills',
  strength: 'Superhuman physical strength',
  wisdom: 'Strategic intelligence and knowledge',
  magic: 'Control over supernatural forces',
  flight: 'Ability to fly or move through air',
  invisibility: 'Can become unseen',
  immortality: 'Cannot be killed through normal means',
  prophecy: 'Knowledge of future events',
  healing: 'Can cure wounds and illness',
  persuasion: 'Ability to convince others',
  leadership: 'Natural authority over others',
  endurance: 'Unusual stamina and resilience'
};

/**
 * Load all hero files from directory
 */
function loadAllHeroes(heroDir) {
  const heroes = [];
  const files = fs.readdirSync(heroDir);

  files.forEach(file => {
    if (file.endsWith('.json') && file !== '_all.json') {
      const filePath = path.join(heroDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Handle array files (e.g., greek.json containing array of heroes)
        if (Array.isArray(data)) {
          heroes.push(...data.map(hero => ({
            ...hero,
            sourceFile: file,
            isArray: true
          })));
        } else if (data && typeof data === 'object' && data.id) {
          heroes.push({
            ...data,
            sourceFile: file,
            isArray: false
          });
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error.message);
      }
    }
  });

  return heroes;
}

/**
 * Enrich a single hero with metadata
 */
function enrichHero(hero) {
  const enrichedHero = { ...hero };
  const heroKey = hero.id;

  // Get predefined metadata if available
  const predefined = heroMetadata[heroKey];

  if (predefined) {
    // Enrich with predefined data
    enrichedHero.quests = predefined.quests || enrichedHero.quests || [];
    enrichedHero.allies = predefined.allies || enrichedHero.allies || [];
    enrichedHero.enemies = predefined.enemies || enrichedHero.enemies || [];
    enrichedHero.weapons = predefined.weapons || enrichedHero.weapons || [];
    enrichedHero.abilities = predefined.abilities || enrichedHero.abilities || [];

    if (predefined.parentage) {
      enrichedHero.parentage = predefined.parentage;
    }
  } else {
    // Initialize empty arrays if not present
    if (!enrichedHero.quests) enrichedHero.quests = [];
    if (!enrichedHero.allies && !enrichedHero.relationships?.allies) enrichedHero.allies = [];
    if (!enrichedHero.enemies && !enrichedHero.relationships?.enemies) enrichedHero.enemies = [];
    if (!enrichedHero.weapons) enrichedHero.weapons = [];
    if (!enrichedHero.abilities) enrichedHero.abilities = [];
  }

  // Extract from relationships if available
  if (enrichedHero.relationships) {
    if (enrichedHero.relationships.allies && !enrichedHero.allies?.length) {
      enrichedHero.allies = enrichedHero.relationships.allies;
    }
    if (enrichedHero.relationships.enemies && !enrichedHero.enemies?.length) {
      enrichedHero.enemies = enrichedHero.relationships.enemies;
    }
  }

  // Update metadata timestamps
  enrichedHero.metadata = enrichedHero.metadata || {};
  enrichedHero.metadata.enrichedBy = 'hero-metadata-enricher';
  enrichedHero.metadata.enrichedAt = new Date().toISOString();
  enrichedHero.metadata.metadataVersion = '1.0';
  enrichedHero.metadata.fieldsEnriched = [
    'quests',
    'allies',
    'enemies',
    'weapons',
    'abilities',
    'parentage'
  ];

  return enrichedHero;
}

/**
 * Save enriched hero data
 */
function saveHero(hero, outputDir, isArray, sourceFile) {
  try {
    const outputPath = path.join(outputDir, sourceFile);

    if (isArray) {
      // Load existing array and update matching hero
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      const index = existing.findIndex(h => h.id === hero.id);
      if (index !== -1) {
        existing[index] = hero;
      } else {
        existing.push(hero);
      }
      fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2));
    } else {
      // Save as individual file
      fs.writeFileSync(outputPath, JSON.stringify(hero, null, 2));
    }

    return true;
  } catch (error) {
    console.error(`Error saving hero ${hero.id}:`, error.message);
    return false;
  }
}

/**
 * Main enrichment process
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const heroIdArg = args.find(arg => arg.startsWith('--hero-id='));
  const targetHeroId = heroIdArg ? heroIdArg.split('=')[1] : null;

  const heroDir = path.join(__dirname, '../firebase-assets-downloaded/heroes');
  const outputDir = heroDir;

  if (!fs.existsSync(heroDir)) {
    console.error(`Hero directory not found: ${heroDir}`);
    process.exit(1);
  }

  console.log('Loading hero data...');
  let heroes = loadAllHeroes(heroDir);

  if (targetHeroId) {
    heroes = heroes.filter(h => h.id === targetHeroId);
    if (heroes.length === 0) {
      console.error(`Hero not found: ${targetHeroId}`);
      process.exit(1);
    }
  }

  console.log(`Found ${heroes.length} heroes to process\n`);

  let enrichedCount = 0;
  const results = [];

  heroes.forEach(hero => {
    const enriched = enrichHero(hero);
    const hasNewData =
      (heroMetadata[hero.id] !== undefined) ||
      enriched.quests.length > 0 ||
      enriched.allies?.length > 0 ||
      enriched.enemies?.length > 0 ||
      enriched.weapons?.length > 0 ||
      enriched.abilities?.length > 0;

    if (hasNewData) {
      results.push({
        id: hero.id,
        name: hero.name || hero.displayName,
        questsCount: enriched.quests?.length || 0,
        alliesCount: enriched.allies?.length || 0,
        enemiesCount: enriched.enemies?.length || 0,
        weaponsCount: enriched.weapons?.length || 0,
        abilitiesCount: enriched.abilities?.length || 0,
        hasParentage: !!enriched.parentage
      });

      if (!dryRun) {
        if (saveHero(enriched, outputDir, hero.isArray, hero.sourceFile)) {
          enrichedCount++;
        }
      } else {
        enrichedCount++;
      }
    }
  });

  // Print results
  console.log('='.repeat(80));
  console.log('ENRICHMENT RESULTS');
  console.log('='.repeat(80));

  results.forEach(result => {
    console.log(`\n${result.name} (${result.id})`);
    console.log(`  Quests: ${result.questsCount}`);
    console.log(`  Allies: ${result.alliesCount}`);
    console.log(`  Enemies: ${result.enemiesCount}`);
    console.log(`  Weapons: ${result.weaponsCount}`);
    console.log(`  Abilities: ${result.abilitiesCount}`);
    if (result.hasParentage) console.log(`  ✓ Parentage data included`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Total heroes enriched: ${enrichedCount}/${heroes.length}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (changes saved)'}`);
  console.log('='.repeat(80));
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  heroMetadata,
  enrichHero,
  loadAllHeroes,
  saveHero
};

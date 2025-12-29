const fs = require('fs');
const path = require('path');

// Hero enhancement data with journey timelines, accomplishments, and trials
const heroEnhancements = {
  // GREEK HEROES
  'greek_heracles': {
    name: 'Heracles',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Alcmene and Zeus in Thebes', location: 'Thebes' },
      { stage: 'Call to Adventure', age: 18, event: 'Madness from Hera kills wife and children', location: 'Thebes' },
      { stage: 'Supernatural Aid', age: 19, event: 'Oracle of Delphi commands servitude to Eurystheus', location: 'Delphi' },
      { stage: 'Crossing Threshold', age: 20, event: 'Begins the Twelve Labors', location: 'Mycenae' },
      { stage: 'Tests', age: 20, event: 'Slays the Nemean Lion (Labor 1)', location: 'Nemea' },
      { stage: 'Tests', age: 21, event: 'Slays the Lernaean Hydra (Labor 2)', location: 'Lerna' },
      { stage: 'Tests', age: 22, event: 'Captures the Ceryneian Hind (Labor 3)', location: 'Ceryneia' },
      { stage: 'Tests', age: 23, event: 'Captures the Erymanthian Boar (Labor 4)', location: 'Mount Erymanthos' },
      { stage: 'Tests', age: 24, event: 'Cleans the Augean Stables (Labor 5)', location: 'Elis' },
      { stage: 'Tests', age: 25, event: 'Slays the Stymphalian Birds (Labor 6)', location: 'Lake Stymphalia' },
      { stage: 'Tests', age: 26, event: 'Captures the Cretan Bull (Labor 7)', location: 'Crete' },
      { stage: 'Tests', age: 27, event: 'Steals the Mares of Diomedes (Labor 8)', location: 'Thrace' },
      { stage: 'Tests', age: 28, event: 'Obtains the Girdle of Hippolyta (Labor 9)', location: 'Amazon Territory' },
      { stage: 'Tests', age: 29, event: 'Steals the Cattle of Geryon (Labor 10)', location: 'Erytheia' },
      { stage: 'Ordeal', age: 30, event: 'Retrieves the Apples of Hesperides (Labor 11)', location: 'Garden of Hesperides' },
      { stage: 'Reward', age: 31, event: 'Captures Cerberus from Underworld (Labor 12)', location: 'Underworld' },
      { stage: 'Road Back', age: 32, event: 'Completes all Labors, freed from servitude', location: 'Mycenae' },
      { stage: 'Resurrection', age: 45, event: 'Dies from poisoned robe, ascends to Olympus', location: 'Mount Oeta' },
      { stage: 'Return with Elixir', age: 45, event: 'Becomes immortal god, marries Hebe', location: 'Mount Olympus' }
    ],
    accomplishments: [
      { title: 'The Twelve Labors', description: 'Completed twelve impossible tasks for King Eurystheus', category: 'quest' },
      { title: 'Nemean Lion', description: 'Strangled the invulnerable lion and wore its hide', category: 'monster_slayer' },
      { title: 'Lernaean Hydra', description: 'Defeated the nine-headed serpent with Iolaus', category: 'monster_slayer' },
      { title: 'Ceryneian Hind', description: 'Captured Artemis sacred golden-horned deer alive', category: 'capture' },
      { title: 'Erymanthian Boar', description: 'Brought back the giant boar alive', category: 'capture' },
      { title: 'Augean Stables', description: 'Cleaned thirty years of filth in one day', category: 'feat' },
      { title: 'Stymphalian Birds', description: 'Drove away man-eating birds with bronze castanets', category: 'monster_slayer' },
      { title: 'Cretan Bull', description: 'Captured the bull terrorizing Crete', category: 'capture' },
      { title: 'Mares of Diomedes', description: 'Tamed the man-eating horses', category: 'capture' },
      { title: 'Girdle of Hippolyta', description: 'Obtained the Amazon Queens war belt', category: 'treasure' },
      { title: 'Cattle of Geryon', description: 'Retrieved the red cattle from three-bodied giant', category: 'treasure' },
      { title: 'Golden Apples', description: 'Obtained the immortality-granting apples', category: 'treasure' },
      { title: 'Cerberus Capture', description: 'Brought the three-headed guardian of Hades to surface', category: 'underworld' },
      { title: 'Gigantomachy', description: 'Fought alongside gods against the Giants', category: 'divine_war' },
      { title: 'Apotheosis', description: 'Ascended to godhood on Mount Olympus', category: 'transformation' }
    ],
    trials: [
      { name: 'Madness of Hera', description: 'Driven insane, killed his wife and children', type: 'curse' },
      { name: 'Servitude to Eurystheus', description: 'Forced to serve a weaker man as penance', type: 'humiliation' },
      { name: 'Impossible Tasks', description: 'Twelve labors designed to be fatal', type: 'physical' },
      { name: 'Journey to Underworld', description: 'Descended to realm of dead and returned', type: 'spiritual' },
      { name: 'Death by Poison', description: 'Killed by poisoned robe from jealous wife', type: 'betrayal' }
    ],
    journey_diagram: 'diagrams/hero-journeys/heracles-journey.svg',
    quest_map: 'diagrams/quest-maps/heracles-labors.svg'
  },

  'greek_odysseus': {
    name: 'Odysseus',
    quest_timeline: [
      { stage: 'Ordinary World', age: 35, event: 'King of Ithaca, married to Penelope', location: 'Ithaca' },
      { stage: 'Call to Adventure', age: 35, event: 'Summoned to Trojan War by oath', location: 'Ithaca' },
      { stage: 'Refusal of Call', age: 35, event: 'Feigns madness to avoid war', location: 'Ithaca' },
      { stage: 'Crossing Threshold', age: 36, event: 'Sails for Troy with fleet', location: 'Greece' },
      { stage: 'Tests', age: 46, event: 'Trojan Horse stratagem ends war', location: 'Troy' },
      { stage: 'Tests', age: 46, event: 'Raids the Cicones, loses men', location: 'Ismarus' },
      { stage: 'Tests', age: 46, event: 'Lotus Eaters threaten crew with forgetfulness', location: 'Libya' },
      { stage: 'Ordeal', age: 47, event: 'Blinds Polyphemus, curses pursuit', location: 'Cyclops Island' },
      { stage: 'Tests', age: 47, event: 'Receives winds from Aeolus', location: 'Aeolia' },
      { stage: 'Tests', age: 47, event: 'Laestrygonians destroy fleet', location: 'Laestrygonia' },
      { stage: 'Approach', age: 47, event: 'Circe transforms crew to pigs', location: 'Aeaea' },
      { stage: 'Ordeal', age: 48, event: 'Descends to Underworld, consults Tiresias', location: 'Entrance to Hades' },
      { stage: 'Tests', age: 48, event: 'Survives Sirens song with wax and ropes', location: 'Siren Island' },
      { stage: 'Tests', age: 48, event: 'Navigates between Scylla and Charybdis', location: 'Strait of Messina' },
      { stage: 'Ordeal', age: 48, event: 'Crew slaughters sacred cattle of Helios', location: 'Thrinacia' },
      { stage: 'Death/Rebirth', age: 48, event: 'Zeus destroys ship, only Odysseus survives', location: 'Mediterranean Sea' },
      { stage: 'Reward', age: 49, event: 'Calypso offers immortality, he refuses', location: 'Ogygia' },
      { stage: 'Road Back', age: 56, event: 'Phaeacians give him passage home', location: 'Scheria' },
      { stage: 'Resurrection', age: 56, event: 'Returns disguised, tests loyalty', location: 'Ithaca' },
      { stage: 'Return with Elixir', age: 56, event: 'Slays suitors, reunites with Penelope', location: 'Ithaca' }
    ],
    accomplishments: [
      { title: 'Trojan Horse', description: 'Conceived the stratagem that ended the Trojan War', category: 'strategy' },
      { title: 'Blinding Polyphemus', description: 'Outwitted and escaped the Cyclops', category: 'cunning' },
      { title: 'Resistance to Sirens', description: 'Heard their song and lived', category: 'willpower' },
      { title: 'Navigation of Scylla/Charybdis', description: 'Chose the lesser evil and survived', category: 'wisdom' },
      { title: 'Underworld Journey', description: 'Consulted the dead prophet Tiresias', category: 'underworld' },
      { title: 'Rejection of Immortality', description: 'Chose mortal life and home over godhood', category: 'virtue' },
      { title: 'Restoration of Kingdom', description: 'Reclaimed Ithaca from the suitors', category: 'justice' }
    ],
    trials: [
      { name: 'Curse of Poseidon', description: 'God of sea hindered his journey for 10 years', type: 'divine_curse' },
      { name: 'Loss of Crew', description: 'All companions perished on the journey', type: 'grief' },
      { name: 'Temptation of Lotus', description: 'Forgetfulness and abandonment of home', type: 'temptation' },
      { name: 'Circes Enchantment', description: 'Crew transformed to animals', type: 'magic' },
      { name: 'Calypsos Prison', description: 'Seven years detained by immortal nymph', type: 'captivity' }
    ],
    journey_diagram: 'diagrams/hero-journeys/odysseus-journey.svg',
    quest_map: 'diagrams/quest-maps/odysseus-odyssey.svg'
  },

  'greek_perseus': {
    name: 'Perseus',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Danae and Zeus in bronze chamber', location: 'Argos' },
      { stage: 'Call to Adventure', age: 20, event: 'King Polydectes demands Medusas head', location: 'Seriphos' },
      { stage: 'Supernatural Aid', age: 20, event: 'Athena and Hermes provide divine gifts', location: 'Seriphos' },
      { stage: 'Crossing Threshold', age: 20, event: 'Journeys to find the Graeae', location: 'Unknown regions' },
      { stage: 'Tests', age: 20, event: 'Forces Graeae to reveal Gorgons location', location: 'Western lands' },
      { stage: 'Approach', age: 20, event: 'Acquires winged sandals, kibisis, cap of invisibility', location: 'Nymphs realm' },
      { stage: 'Ordeal', age: 20, event: 'Beheads Medusa using mirrored shield', location: 'Gorgons lair' },
      { stage: 'Reward', age: 20, event: 'Pegasus born from Medusas blood', location: 'Gorgons lair' },
      { stage: 'Road Back', age: 20, event: 'Flies home on winged sandals', location: 'Mediterranean' },
      { stage: 'Tests', age: 20, event: 'Rescues Andromeda from sea monster', location: 'Ethiopia' },
      { stage: 'Resurrection', age: 21, event: 'Turns Polydectes to stone with Medusas head', location: 'Seriphos' },
      { stage: 'Return with Elixir', age: 21, event: 'Marries Andromeda, founds Mycenae', location: 'Seriphos/Mycenae' }
    ],
    accomplishments: [
      { title: 'Slaying Medusa', description: 'Beheaded the Gorgon whose gaze turned men to stone', category: 'monster_slayer' },
      { title: 'Rescue of Andromeda', description: 'Saved princess from sea monster Cetus', category: 'heroic_rescue' },
      { title: 'Founding Mycenae', description: 'Established one of greatest Greek cities', category: 'civilization' },
      { title: 'Petrification of Polydectes', description: 'Used Medusas head to defeat tyrant king', category: 'justice' },
      { title: 'Birth of Pegasus', description: 'His deed created the divine winged horse', category: 'legacy' }
    ],
    trials: [
      { name: 'Impossible Quest', description: 'Ordered to retrieve head of Medusa', type: 'physical' },
      { name: 'Gorgons Gaze', description: 'Death by looking directly at target', type: 'supernatural' },
      { name: 'Pursuit by Sisters', description: 'Two immortal Gorgons hunted him', type: 'chase' }
    ],
    journey_diagram: 'diagrams/hero-journeys/perseus-journey.svg',
    quest_map: 'diagrams/quest-maps/perseus-quest.svg'
  },

  'greek_theseus': {
    name: 'Theseus',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Aethra and Aegeus/Poseidon', location: 'Troezen' },
      { stage: 'Call to Adventure', age: 16, event: 'Lifts rock to claim fathers sword and sandals', location: 'Troezen' },
      { stage: 'Crossing Threshold', age: 16, event: 'Chooses dangerous road to Athens', location: 'Road to Athens' },
      { stage: 'Tests', age: 16, event: 'Defeats Periphetes the club-bearer', location: 'Epidaurus' },
      { stage: 'Tests', age: 16, event: 'Defeats Sinis the pine-bender', location: 'Isthmus of Corinth' },
      { stage: 'Tests', age: 16, event: 'Slays the Crommyonian Sow', location: 'Crommyon' },
      { stage: 'Tests', age: 16, event: 'Defeats Sciron who kicked travelers off cliffs', location: 'Scironian Rocks' },
      { stage: 'Tests', age: 16, event: 'Defeats Cercyon in wrestling', location: 'Eleusis' },
      { stage: 'Tests', age: 16, event: 'Defeats Procrustes the bed-fitter', location: 'Near Athens' },
      { stage: 'Approach', age: 17, event: 'Recognized by Aegeus, declared heir', location: 'Athens' },
      { stage: 'Ordeal', age: 18, event: 'Volunteers for Minotaur tribute', location: 'Athens' },
      { stage: 'Ordeal', age: 18, event: 'Navigates Labyrinth and slays Minotaur', location: 'Crete' },
      { stage: 'Reward', age: 18, event: 'Ariadnes thread leads him out', location: 'Crete' },
      { stage: 'Road Back', age: 18, event: 'Sails home but forgets signal', location: 'Aegean Sea' },
      { stage: 'Death/Rebirth', age: 18, event: 'Father Aegeus dies seeing black sails', location: 'Athens' },
      { stage: 'Return with Elixir', age: 18, event: 'Becomes King of Athens', location: 'Athens' }
    ],
    accomplishments: [
      { title: 'Slaying the Minotaur', description: 'Freed Athens from tribute of youth to Crete', category: 'monster_slayer' },
      { title: 'Six Labors of the Road', description: 'Defeated six bandits terrorizing travelers', category: 'hero_deeds' },
      { title: 'Unification of Attica', description: 'United twelve towns under Athens', category: 'statecraft' },
      { title: 'Founding Democracy', description: 'Established democratic institutions in Athens', category: 'civilization' },
      { title: 'Amazonomachy', description: 'Fought and married Amazon queen Hippolyta', category: 'warfare' }
    ],
    trials: [
      { name: 'Road of Tribulations', description: 'Six deadly bandits on path to Athens', type: 'physical' },
      { name: 'The Labyrinth', description: 'Inescapable maze of the Minotaur', type: 'puzzle' },
      { name: 'Black Sails Tragedy', description: 'Forgetfulness led to fathers death', type: 'error' },
      { name: 'Betrayal by Phaedra', description: 'Stepmother falsely accused his son', type: 'family_curse' }
    ],
    journey_diagram: 'diagrams/hero-journeys/theseus-journey.svg',
    quest_map: 'diagrams/quest-maps/theseus-quest.svg'
  },

  'greek_jason': {
    name: 'Jason',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born prince of Iolcus, hidden by mother', location: 'Iolcus' },
      { stage: 'Call to Adventure', age: 20, event: 'Pelias promises throne for Golden Fleece', location: 'Iolcus' },
      { stage: 'Gathering Allies', age: 20, event: 'Assembles the Argonauts, greatest heroes', location: 'Iolcus' },
      { stage: 'Crossing Threshold', age: 20, event: 'Launches Argo, ship with fifty oars', location: 'Iolcus harbor' },
      { stage: 'Tests', age: 20, event: 'Games at Lemnos, island of women', location: 'Lemnos' },
      { stage: 'Tests', age: 20, event: 'Hylas lost to water nymphs', location: 'Mysia' },
      { stage: 'Tests', age: 20, event: 'Boxing match with Bebrycian king', location: 'Bebrycia' },
      { stage: 'Tests', age: 20, event: 'Phineus freed from Harpies', location: 'Thrace' },
      { stage: 'Tests', age: 20, event: 'Navigate Clashing Rocks (Symplegades)', location: 'Bosporus' },
      { stage: 'Approach', age: 20, event: 'Arrives in Colchis, meets King Aeetes', location: 'Colchis' },
      { stage: 'Meeting Goddess', age: 20, event: 'Medea falls in love via Aphrodite/Hera', location: 'Colchis' },
      { stage: 'Ordeal', age: 20, event: 'Yokes fire-breathing bulls', location: 'Colchis' },
      { stage: 'Ordeal', age: 20, event: 'Defeats dragon-teeth warriors', location: 'Colchis' },
      { stage: 'Reward', age: 20, event: 'Medea helps steal the Golden Fleece', location: 'Sacred Grove' },
      { stage: 'Road Back', age: 20, event: 'Flee Colchis pursued by Aeetes', location: 'Black Sea' },
      { stage: 'Resurrection', age: 21, event: 'Returns to Iolcus with Fleece', location: 'Iolcus' },
      { stage: 'Return with Elixir', age: 21, event: 'Medea kills Pelias, Jason rules briefly', location: 'Iolcus' }
    ],
    accomplishments: [
      { title: 'Leading the Argonauts', description: 'Commanded greatest assembly of Greek heroes', category: 'leadership' },
      { title: 'Clashing Rocks', description: 'First ship to pass through Symplegades', category: 'navigation' },
      { title: 'Fire-Breathing Bulls', description: 'Yoked bronze bulls that breathed flame', category: 'monster_taming' },
      { title: 'Dragon-Teeth Warriors', description: 'Defeated army that sprang from sown teeth', category: 'combat' },
      { title: 'Golden Fleece', description: 'Retrieved the sacred fleece from grove guardian', category: 'treasure' }
    ],
    trials: [
      { name: 'Impossible Tasks', description: 'King Aeetes set deadly challenges', type: 'physical' },
      { name: 'Clashing Rocks', description: 'Ship-crushing rocks at strait', type: 'navigation' },
      { name: 'Sleepless Dragon', description: 'Guardian serpent never slept', type: 'monster' },
      { name: 'Curse of Medea', description: 'Betrayal brought tragedy to his line', type: 'divine_curse' }
    ],
    journey_diagram: 'diagrams/hero-journeys/jason-journey.svg',
    quest_map: 'diagrams/quest-maps/jason-argonauts.svg'
  },

  'greek_achilles': {
    name: 'Achilles',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Peleus and sea nymph Thetis', location: 'Phthia' },
      { stage: 'Supernatural Aid', age: 0, event: 'Dipped in River Styx, made invulnerable', location: 'Underworld' },
      { stage: 'Tests', age: 9, event: 'Trained by centaur Chiron', location: 'Mount Pelion' },
      { stage: 'Call to Adventure', age: 15, event: 'Prophecy: glory at Troy or long life at home', location: 'Phthia' },
      { stage: 'Refusal of Call', age: 15, event: 'Hidden among maidens by Thetis', location: 'Skyros' },
      { stage: 'Crossing Threshold', age: 16, event: 'Odysseus discovers him, sails for Troy', location: 'Skyros' },
      { stage: 'Tests', age: 25, event: 'Nine years fighting at Troy', location: 'Troy' },
      { stage: 'Ordeal', age: 25, event: 'Quarrel with Agamemnon, withdraws from battle', location: 'Troy' },
      { stage: 'Death of Mentor', age: 25, event: 'Patroclus killed by Hector wearing his armor', location: 'Troy' },
      { stage: 'Supernatural Aid', age: 25, event: 'Receives divine armor from Hephaestus', location: 'Troy' },
      { stage: 'Resurrection', age: 25, event: 'Returns to battle in divine rage', location: 'Troy' },
      { stage: 'Reward', age: 25, event: 'Slays Hector in single combat', location: 'Troy' },
      { stage: 'Atonement', age: 25, event: 'Returns Hectors body to Priam', location: 'Troy' },
      { stage: 'Death', age: 26, event: 'Killed by Paris arrow to heel', location: 'Troy' }
    ],
    accomplishments: [
      { title: 'Greatest Warrior of Troy', description: 'Undefeated champion of the Achaeans', category: 'combat' },
      { title: 'Slaying Hector', description: 'Defeated Troys greatest defender', category: 'duel' },
      { title: 'Divine Armor', description: 'Wore armor forged by Hephaestus himself', category: 'divine_gift' },
      { title: 'Invulnerability', description: 'Near-immortal body from Styx immersion', category: 'supernatural' },
      { title: 'Choice of Glory', description: 'Chose short glorious life over long peaceful one', category: 'honor' }
    ],
    trials: [
      { name: 'Prophesied Death', description: 'Knew he would die young at Troy', type: 'fate' },
      { name: 'Loss of Patroclus', description: 'Death of beloved companion and friend', type: 'grief' },
      { name: 'Rage and Hubris', description: 'Desecrated Hectors body in fury', type: 'character_flaw' },
      { name: 'Vulnerable Heel', description: 'Single point of mortality led to death', type: 'physical_weakness' }
    ],
    journey_diagram: 'diagrams/hero-journeys/achilles-journey.svg',
    quest_map: 'diagrams/quest-maps/achilles-troy.svg'
  },

  'greek_orpheus': {
    name: 'Orpheus',
    quest_timeline: [
      { stage: 'Ordinary World', age: 25, event: 'Greatest musician, married to Eurydice', location: 'Thrace' },
      { stage: 'Call to Adventure', age: 25, event: 'Eurydice dies from snake bite', location: 'Thrace' },
      { stage: 'Crossing Threshold', age: 25, event: 'Descends to Underworld with lyre', location: 'Entrance to Hades' },
      { stage: 'Tests', age: 25, event: 'Charms Charon to ferry him across Styx', location: 'River Styx' },
      { stage: 'Tests', age: 25, event: 'Soothes Cerberus with music', location: 'Gates of Hades' },
      { stage: 'Approach', age: 25, event: 'Music stops tortures of the damned', location: 'Tartarus' },
      { stage: 'Ordeal', age: 25, event: 'Plays for Hades and Persephone', location: 'Throne of Hades' },
      { stage: 'Reward', age: 25, event: 'Granted return of Eurydice with condition', location: 'Throne of Hades' },
      { stage: 'Road Back', age: 25, event: 'Leads Eurydice out, must not look back', location: 'Underworld path' },
      { stage: 'Death/Failure', age: 25, event: 'Looks back, loses Eurydice forever', location: 'Underworld threshold' },
      { stage: 'Return', age: 25, event: 'Returns alone, refuses other women', location: 'Thrace' },
      { stage: 'Death', age: 30, event: 'Torn apart by Maenads', location: 'Thrace' }
    ],
    accomplishments: [
      { title: 'Master Musician', description: 'Music could charm all living things and nature', category: 'art' },
      { title: 'Underworld Journey', description: 'Only mortal to enter Hades and return alive', category: 'underworld' },
      { title: 'Moved the Unmovable', description: 'Made Hades and Persephone weep', category: 'supernatural' },
      { title: 'Stopped Tortures', description: 'Paused eternal punishments with song', category: 'divine_power' }
    ],
    trials: [
      { name: 'Death of Beloved', description: 'Lost wife to serpent bite', type: 'grief' },
      { name: 'Impossible Condition', description: 'Must trust without looking back', type: 'test_of_faith' },
      { name: 'Human Weakness', description: 'Doubt overcame faith at final moment', type: 'character_flaw' },
      { name: 'Second Death', description: 'Lost Eurydice forever through mistake', type: 'permanent_loss' }
    ],
    journey_diagram: 'diagrams/hero-journeys/orpheus-journey.svg',
    quest_map: 'diagrams/quest-maps/orpheus-underworld.svg'
  },

  // MESOPOTAMIAN HEROES
  'babylonian_gilgamesh': {
    name: 'Gilgamesh',
    quest_timeline: [
      { stage: 'Ordinary World', age: 25, event: 'King of Uruk, two-thirds god, one-third man', location: 'Uruk' },
      { stage: 'Meeting Allies', age: 25, event: 'Enkidu created as equal, becomes friend', location: 'Uruk' },
      { stage: 'Crossing Threshold', age: 26, event: 'Journey to Cedar Forest', location: 'Lebanon' },
      { stage: 'Ordeal', age: 26, event: 'Defeats Humbaba, guardian of Cedar Forest', location: 'Cedar Forest' },
      { stage: 'Tests', age: 27, event: 'Rejects Ishtars advances', location: 'Uruk' },
      { stage: 'Tests', age: 27, event: 'Slays the Bull of Heaven with Enkidu', location: 'Uruk' },
      { stage: 'Death of Ally', age: 28, event: 'Enkidu dies as punishment from gods', location: 'Uruk' },
      { stage: 'Call to Adventure', age: 28, event: 'Seeks immortality to escape death', location: 'Uruk' },
      { stage: 'Crossing Threshold', age: 28, event: 'Journeys to find Utnapishtim', location: 'Beyond the world' },
      { stage: 'Tests', age: 28, event: 'Crosses Waters of Death', location: 'Ocean of death' },
      { stage: 'Meeting Mentor', age: 28, event: 'Utnapishtim tells flood story', location: 'Far shore' },
      { stage: 'Ordeal', age: 28, event: 'Fails test to stay awake seven days', location: 'Utnapishtims home' },
      { stage: 'Reward', age: 28, event: 'Given plant of rejuvenation', location: 'Ocean floor' },
      { stage: 'Road Back', age: 28, event: 'Returns to Uruk with plant', location: 'Journey home' },
      { stage: 'Loss', age: 28, event: 'Serpent steals plant while bathing', location: 'Pool on road' },
      { stage: 'Return', age: 29, event: 'Accepts mortality, finds meaning in legacy', location: 'Uruk' }
    ],
    accomplishments: [
      { title: 'Building Uruk', description: 'Created the great walled city', category: 'civilization' },
      { title: 'Defeating Humbaba', description: 'Slew the terrifying forest guardian', category: 'monster_slayer' },
      { title: 'Bull of Heaven', description: 'Killed the divine bull sent by Ishtar', category: 'monster_slayer' },
      { title: 'Journey Beyond Death', description: 'Crossed the Waters of Death and returned', category: 'exploration' },
      { title: 'Wisdom Through Suffering', description: 'Learned to accept mortality and value life', category: 'enlightenment' }
    ],
    trials: [
      { name: 'Death of Enkidu', description: 'Lost his only true friend and equal', type: 'grief' },
      { name: 'Failed Immortality', description: 'Could not stay awake, lost plant to serpent', type: 'failure' },
      { name: 'Rejection by Ishtar', description: 'Angered goddess brought divine wrath', type: 'divine_enmity' },
      { name: 'Acceptance of Mortality', description: 'Ultimate challenge of being partly mortal', type: 'existential' }
    ],
    journey_diagram: 'diagrams/hero-journeys/gilgamesh-journey.svg',
    quest_map: 'diagrams/quest-maps/gilgamesh-quest.svg'
  },

  'sumerian_gilgamesh': {
    name: 'Gilgamesh',
    quest_timeline: [
      { stage: 'Ordinary World', age: 25, event: 'King of Uruk, two-thirds god, one-third man', location: 'Uruk' },
      { stage: 'Meeting Allies', age: 25, event: 'Enkidu created as equal, becomes friend', location: 'Uruk' },
      { stage: 'Crossing Threshold', age: 26, event: 'Journey to Cedar Forest', location: 'Lebanon' },
      { stage: 'Ordeal', age: 26, event: 'Defeats Humbaba, guardian of Cedar Forest', location: 'Cedar Forest' },
      { stage: 'Tests', age: 27, event: 'Rejects Inannas advances', location: 'Uruk' },
      { stage: 'Tests', age: 27, event: 'Slays the Bull of Heaven with Enkidu', location: 'Uruk' },
      { stage: 'Death of Ally', age: 28, event: 'Enkidu dies as punishment from gods', location: 'Uruk' },
      { stage: 'Call to Adventure', age: 28, event: 'Seeks immortality to escape death', location: 'Uruk' },
      { stage: 'Crossing Threshold', age: 28, event: 'Journeys to find Utnapishtim', location: 'Beyond the world' },
      { stage: 'Tests', age: 28, event: 'Crosses Waters of Death', location: 'Ocean of death' },
      { stage: 'Meeting Mentor', age: 28, event: 'Utnapishtim tells flood story', location: 'Far shore' },
      { stage: 'Ordeal', age: 28, event: 'Fails test to stay awake seven days', location: 'Utnapishtims home' },
      { stage: 'Reward', age: 28, event: 'Given plant of rejuvenation', location: 'Ocean floor' },
      { stage: 'Road Back', age: 28, event: 'Returns to Uruk with plant', location: 'Journey home' },
      { stage: 'Loss', age: 28, event: 'Serpent steals plant while bathing', location: 'Pool on road' },
      { stage: 'Return', age: 29, event: 'Accepts mortality, finds meaning in legacy', location: 'Uruk' }
    ],
    accomplishments: [
      { title: 'Building Uruk', description: 'Created the great walled city', category: 'civilization' },
      { title: 'Defeating Humbaba', description: 'Slew the terrifying forest guardian', category: 'monster_slayer' },
      { title: 'Bull of Heaven', description: 'Killed the divine bull sent by Inanna', category: 'monster_slayer' },
      { title: 'Journey Beyond Death', description: 'Crossed the Waters of Death and returned', category: 'exploration' },
      { title: 'Wisdom Through Suffering', description: 'Learned to accept mortality and value life', category: 'enlightenment' }
    ],
    trials: [
      { name: 'Death of Enkidu', description: 'Lost his only true friend and equal', type: 'grief' },
      { name: 'Failed Immortality', description: 'Could not stay awake, lost plant to serpent', type: 'failure' },
      { name: 'Rejection by Inanna', description: 'Angered goddess brought divine wrath', type: 'divine_enmity' },
      { name: 'Acceptance of Mortality', description: 'Ultimate challenge of being partly mortal', type: 'existential' }
    ],
    journey_diagram: 'diagrams/hero-journeys/gilgamesh-journey.svg',
    quest_map: 'diagrams/quest-maps/gilgamesh-quest.svg'
  },

  // HINDU HEROES
  'hindu_rama': {
    name: 'Rama',
    quest_timeline: [
      { stage: 'Ordinary World', age: 16, event: 'Prince of Ayodhya, avatar of Vishnu', location: 'Ayodhya' },
      { stage: 'Tests', age: 16, event: 'Breaks Shivas bow, wins Sita', location: 'Mithila' },
      { stage: 'Call to Adventure', age: 25, event: 'Exiled to forest for 14 years', location: 'Ayodhya' },
      { stage: 'Crossing Threshold', age: 25, event: 'Enters forest with Sita and Lakshmana', location: 'Dandaka Forest' },
      { stage: 'Tests', age: 25, event: 'Defeats demons troubling hermits', location: 'Dandaka Forest' },
      { stage: 'Ordeal', age: 28, event: 'Sita abducted by Ravana', location: 'Panchavati' },
      { stage: 'Allies', age: 28, event: 'Befriends Hanuman and Sugriva', location: 'Kishkindha' },
      { stage: 'Tests', age: 28, event: 'Helps Sugriva defeat Vali', location: 'Kishkindha' },
      { stage: 'Approach', age: 28, event: 'Hanuman discovers Sita in Lanka', location: 'Lanka' },
      { stage: 'Ordeal', age: 28, event: 'Builds bridge to Lanka with vanara army', location: 'Ocean to Lanka' },
      { stage: 'Supreme Ordeal', age: 28, event: 'Battles and defeats Ravana', location: 'Lanka' },
      { stage: 'Reward', age: 28, event: 'Rescues Sita, she proves purity by fire', location: 'Lanka' },
      { stage: 'Road Back', age: 28, event: 'Returns to Ayodhya via pushpaka vimana', location: 'Sky journey' },
      { stage: 'Return with Elixir', age: 28, event: 'Crowned king, begins golden age of Rama Rajya', location: 'Ayodhya' }
    ],
    accomplishments: [
      { title: 'Avatar of Vishnu', description: 'Incarnation of the preserver god', category: 'divine' },
      { title: 'Shivas Bow', description: 'Only one able to string the divine bow', category: 'feat' },
      { title: 'Defeat of Ravana', description: 'Killed the ten-headed demon king', category: 'monster_slayer' },
      { title: 'Bridge to Lanka', description: 'Built bridge across ocean with vanara army', category: 'engineering' },
      { title: 'Rama Rajya', description: 'Established perfect, righteous kingdom', category: 'civilization' },
      { title: 'Dharma Exemplar', description: 'Perfect adherence to duty and righteousness', category: 'virtue' }
    ],
    trials: [
      { name: 'Unjust Exile', description: 'Banished due to stepmothers scheme', type: 'injustice' },
      { name: 'Loss of Sita', description: 'Wife abducted by demon king', type: 'grief' },
      { name: 'Ocean Obstacle', description: 'Impassable water between him and Sita', type: 'physical' },
      { name: 'Sitas Agni Pariksha', description: 'Wife had to prove purity through fire', type: 'doubt' }
    ],
    journey_diagram: 'diagrams/hero-journeys/rama-journey.svg',
    quest_map: 'diagrams/quest-maps/rama-ramayana.svg'
  },

  'hindu_krishna': {
    name: 'Krishna',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born in prison to Devaki and Vasudeva', location: 'Mathura' },
      { stage: 'Flight', age: 0, event: 'Smuggled to Vrindavan to escape Kamsa', location: 'Vrindavan' },
      { stage: 'Tests', age: 7, event: 'Defeats demoness Putana', location: 'Vrindavan' },
      { stage: 'Tests', age: 8, event: 'Lifts Mount Govardhan to protect villagers', location: 'Vrindavan' },
      { stage: 'Tests', age: 10, event: 'Defeats serpent Kaliya in Yamuna river', location: 'Yamuna River' },
      { stage: 'Call to Adventure', age: 16, event: 'Summoned to Mathura by Kamsa', location: 'Mathura' },
      { stage: 'Ordeal', age: 16, event: 'Defeats Kamsas champions and kills tyrant', location: 'Mathura' },
      { stage: 'Tests', age: 25, event: 'Founds city of Dwarka', location: 'Western shore' },
      { stage: 'Meeting Allies', age: 85, event: 'Becomes charioteer and guide to Arjuna', location: 'Kurukshetra' },
      { stage: 'Teaching', age: 85, event: 'Reveals Bhagavad Gita to Arjuna', location: 'Kurukshetra' },
      { stage: 'Supreme Ordeal', age: 85, event: 'Guides Pandavas to victory in great war', location: 'Kurukshetra' },
      { stage: 'Return', age: 125, event: 'Returns to Dwarka after war', location: 'Dwarka' },
      { stage: 'Death', age: 125, event: 'Shot by hunter, returns to Vaikuntha', location: 'Forest near Dwarka' }
    ],
    accomplishments: [
      { title: 'Avatar of Vishnu', description: 'Eighth and most important incarnation', category: 'divine' },
      { title: 'Slaying Kamsa', description: 'Freed Mathura from tyrant king', category: 'liberation' },
      { title: 'Lifting Govardhan', description: 'Held mountain for seven days to protect people', category: 'divine_feat' },
      { title: 'Bhagavad Gita', description: 'Revealed supreme spiritual teachings', category: 'wisdom' },
      { title: 'Kurukshetra Victory', description: 'Orchestrated righteous victory in great war', category: 'strategy' },
      { title: 'Founding Dwarka', description: 'Built magnificent golden city', category: 'civilization' }
    ],
    trials: [
      { name: 'Pursued from Birth', description: 'Kamsa sent demons to kill him as child', type: 'persecution' },
      { name: 'Balance of Power', description: 'Could not directly fight in Kurukshetra war', type: 'restriction' },
      { name: 'Family Destruction', description: 'Yadava clan destroyed by curse', type: 'tragedy' },
      { name: 'Mortal Death', description: 'Died from hunters arrow despite divinity', type: 'fate' }
    ],
    journey_diagram: 'diagrams/hero-journeys/krishna-journey.svg',
    quest_map: 'diagrams/quest-maps/krishna-quest.svg'
  },

  // ABRAHAMIC HEROES
  'jewish_moses': {
    name: 'Moses',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Hebrew slaves in Egypt', location: 'Goshen, Egypt' },
      { stage: 'Flight', age: 0, event: 'Set adrift in basket, found by Pharaohs daughter', location: 'Nile River' },
      { stage: 'Tests', age: 40, event: 'Kills Egyptian, flees to Midian', location: 'Egypt/Midian' },
      { stage: 'Call to Adventure', age: 80, event: 'Burning Bush, commanded to free Israel', location: 'Mount Horeb' },
      { stage: 'Refusal of Call', age: 80, event: 'Protests he cannot speak well', location: 'Mount Horeb' },
      { stage: 'Supernatural Aid', age: 80, event: 'Aaron given as spokesman, staff as sign', location: 'Midian' },
      { stage: 'Crossing Threshold', age: 80, event: 'Returns to Egypt to confront Pharaoh', location: 'Egypt' },
      { stage: 'Tests', age: 80, event: 'Ten plagues demonstrate divine power', location: 'Egypt' },
      { stage: 'Ordeal', age: 80, event: 'Passover and death of firstborn', location: 'Egypt' },
      { stage: 'Flight', age: 80, event: 'Exodus from Egypt with Israelites', location: 'Egypt' },
      { stage: 'Supreme Ordeal', age: 80, event: 'Crossing the Red Sea', location: 'Red Sea' },
      { stage: 'Meeting with Divine', age: 80, event: 'Receives Ten Commandments on Sinai', location: 'Mount Sinai' },
      { stage: 'Tests', age: 80, event: 'Forty years wandering in wilderness', location: 'Sinai Desert' },
      { stage: 'Tests', age: 120, event: 'Strikes rock instead of speaking to it', location: 'Kadesh' },
      { stage: 'Atonement', age: 120, event: 'Views Promised Land from Mount Nebo', location: 'Mount Nebo' },
      { stage: 'Death', age: 120, event: 'Dies before entering Promised Land', location: 'Mount Nebo' }
    ],
    accomplishments: [
      { title: 'Liberation of Israel', description: 'Freed Hebrew slaves from Egyptian bondage', category: 'liberation' },
      { title: 'Ten Plagues', description: 'Brought judgment on Egypt', category: 'divine_judgment' },
      { title: 'Parting Red Sea', description: 'Waters divided to allow Israel passage', category: 'miracle' },
      { title: 'Receiving the Law', description: 'Received Ten Commandments and Torah', category: 'divine_revelation' },
      { title: 'Forty Years Leadership', description: 'Led people through wilderness', category: 'leadership' },
      { title: 'Tabernacle Construction', description: 'Built dwelling place for divine presence', category: 'sacred_architecture' }
    ],
    trials: [
      { name: 'Murder and Exile', description: 'Killed Egyptian, fled for forty years', type: 'crime' },
      { name: 'Pharaohs Resistance', description: 'Repeated refusals to let people go', type: 'opposition' },
      { name: 'Golden Calf', description: 'People worshiped idol while he received Law', type: 'betrayal' },
      { name: 'Forty Years Wandering', description: 'Generation died in wilderness for unbelief', type: 'punishment' },
      { name: 'Denied Promised Land', description: 'Could not enter due to disobedience', type: 'consequences' }
    ],
    journey_diagram: 'diagrams/hero-journeys/moses-journey.svg',
    quest_map: 'diagrams/quest-maps/moses-exodus.svg'
  },

  'christian_moses': {
    name: 'Moses',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Hebrew slaves in Egypt', location: 'Goshen, Egypt' },
      { stage: 'Flight', age: 0, event: 'Set adrift in basket, found by Pharaohs daughter', location: 'Nile River' },
      { stage: 'Tests', age: 40, event: 'Kills Egyptian, flees to Midian', location: 'Egypt/Midian' },
      { stage: 'Call to Adventure', age: 80, event: 'Burning Bush, commanded to free Israel', location: 'Mount Horeb' },
      { stage: 'Refusal of Call', age: 80, event: 'Protests he cannot speak well', location: 'Mount Horeb' },
      { stage: 'Supernatural Aid', age: 80, event: 'Aaron given as spokesman, staff as sign', location: 'Midian' },
      { stage: 'Crossing Threshold', age: 80, event: 'Returns to Egypt to confront Pharaoh', location: 'Egypt' },
      { stage: 'Tests', age: 80, event: 'Ten plagues demonstrate divine power', location: 'Egypt' },
      { stage: 'Ordeal', age: 80, event: 'Passover and death of firstborn', location: 'Egypt' },
      { stage: 'Flight', age: 80, event: 'Exodus from Egypt with Israelites', location: 'Egypt' },
      { stage: 'Supreme Ordeal', age: 80, event: 'Crossing the Red Sea', location: 'Red Sea' },
      { stage: 'Meeting with Divine', age: 80, event: 'Receives Ten Commandments on Sinai', location: 'Mount Sinai' },
      { stage: 'Tests', age: 80, event: 'Forty years wandering in wilderness', location: 'Sinai Desert' },
      { stage: 'Tests', age: 120, event: 'Strikes rock instead of speaking to it', location: 'Kadesh' },
      { stage: 'Atonement', age: 120, event: 'Views Promised Land from Mount Nebo', location: 'Mount Nebo' },
      { stage: 'Death', age: 120, event: 'Dies before entering Promised Land', location: 'Mount Nebo' }
    ],
    accomplishments: [
      { title: 'Liberation of Israel', description: 'Freed Hebrew slaves from Egyptian bondage', category: 'liberation' },
      { title: 'Ten Plagues', description: 'Brought judgment on Egypt', category: 'divine_judgment' },
      { title: 'Parting Red Sea', description: 'Waters divided to allow Israel passage', category: 'miracle' },
      { title: 'Receiving the Law', description: 'Received Ten Commandments and Torah', category: 'divine_revelation' },
      { title: 'Forty Years Leadership', description: 'Led people through wilderness', category: 'leadership' },
      { title: 'Tabernacle Construction', description: 'Built dwelling place for divine presence', category: 'sacred_architecture' }
    ],
    trials: [
      { name: 'Murder and Exile', description: 'Killed Egyptian, fled for forty years', type: 'crime' },
      { name: 'Pharaohs Resistance', description: 'Repeated refusals to let people go', type: 'opposition' },
      { name: 'Golden Calf', description: 'People worshiped idol while he received Law', type: 'betrayal' },
      { name: 'Forty Years Wandering', description: 'Generation died in wilderness for unbelief', type: 'punishment' },
      { name: 'Denied Promised Land', description: 'Could not enter due to disobedience', type: 'consequences' }
    ],
    journey_diagram: 'diagrams/hero-journeys/moses-journey.svg',
    quest_map: 'diagrams/quest-maps/moses-exodus.svg'
  },

  'islamic_musa': {
    name: 'Musa (Moses)',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born to Hebrew mother during persecution', location: 'Egypt' },
      { stage: 'Flight', age: 0, event: 'Set in basket on Nile, raised by Pharaohs wife', location: 'Nile/Palace' },
      { stage: 'Tests', age: 30, event: 'Kills Egyptian, flees to Madyan', location: 'Egypt/Madyan' },
      { stage: 'Call to Adventure', age: 40, event: 'Burning bush, Allah commands return to Egypt', location: 'Mount Sinai' },
      { stage: 'Supernatural Aid', age: 40, event: 'Given staff and hand miracles as signs', location: 'Mount Sinai' },
      { stage: 'Crossing Threshold', age: 40, event: 'Returns to confront Pharaoh with Harun', location: 'Egypt' },
      { stage: 'Tests', age: 40, event: 'Nine clear signs (plagues) shown to Pharaoh', location: 'Egypt' },
      { stage: 'Ordeal', age: 40, event: 'Pharaoh refuses to free the Israelites', location: 'Egypt' },
      { stage: 'Flight', age: 40, event: 'Leads Bani Israel out of Egypt', location: 'Egypt' },
      { stage: 'Supreme Ordeal', age: 40, event: 'Parting of the sea, Pharaoh drowns', location: 'Red Sea' },
      { stage: 'Meeting with Divine', age: 40, event: 'Forty nights on mountain, receives Torah', location: 'Mount Sinai' },
      { stage: 'Tests', age: 40, event: 'Returns to find golden calf worship', location: 'Mount Sinai' },
      { stage: 'Tests', age: 40, event: 'Years of wandering due to peoples fear', location: 'Desert' },
      { stage: 'Death', age: 120, event: 'Dies before entering Holy Land', location: 'Desert' }
    ],
    accomplishments: [
      { title: 'Prophet of Allah', description: 'One of greatest prophets in Islam', category: 'prophecy' },
      { title: 'Liberation', description: 'Freed Bani Israel from Pharaohs tyranny', category: 'liberation' },
      { title: 'Nine Signs', description: 'Performed nine clear miracles for Pharaoh', category: 'miracles' },
      { title: 'Sea Parting', description: 'Allah split the sea for his people', category: 'divine_miracle' },
      { title: 'Torah Revelation', description: 'Received divine scripture on Mount Sinai', category: 'revelation' },
      { title: 'Direct Communication', description: 'Spoke directly with Allah', category: 'divine_favor' }
    ],
    trials: [
      { name: 'Killing the Egyptian', description: 'Accidental death led to exile', type: 'mistake' },
      { name: 'Pharaohs Oppression', description: 'Tyrant refused divine signs', type: 'persecution' },
      { name: 'Peoples Weakness', description: 'Golden calf and repeated disobedience', type: 'burden_of_leadership' },
      { name: 'Denied Entry', description: 'Could not enter Promised Land', type: 'fate' }
    ],
    journey_diagram: 'diagrams/hero-journeys/moses-journey.svg',
    quest_map: 'diagrams/quest-maps/moses-exodus.svg'
  },

  // NORSE HEROES
  'norse_sigurd': {
    name: 'Sigurd',
    quest_timeline: [
      { stage: 'Ordinary World', age: 0, event: 'Born posthumously to Hjordis', location: 'Denmark' },
      { stage: 'Mentor', age: 15, event: 'Raised and trained by Regin the smith', location: 'Denmark' },
      { stage: 'Call to Adventure', age: 16, event: 'Regin asks him to slay dragon Fafnir', location: 'Regins forge' },
      { stage: 'Supernatural Aid', age: 16, event: 'Regin forges Gram, the divine sword', location: 'Regins forge' },
      { stage: 'Tests', age: 16, event: 'Avenges fathers death', location: 'Denmark' },
      { stage: 'Crossing Threshold', age: 17, event: 'Journeys to Gnitaheid to find Fafnir', location: 'Gnitaheid' },
      { stage: 'Ordeal', age: 17, event: 'Slays Fafnir from pit beneath his path', location: 'Gnitaheid' },
      { stage: 'Reward', age: 17, event: 'Takes Fafnirs treasure and Andvaranaut ring', location: 'Gnitaheid' },
      { stage: 'Tests', age: 17, event: 'Kills Regin who plotted betrayal', location: 'Gnitaheid' },
      { stage: 'Supernatural Gain', age: 17, event: 'Tastes dragon blood, understands birds', location: 'Gnitaheid' },
      { stage: 'Approach', age: 18, event: 'Birds tell of sleeping Valkyrie on mountain', location: 'Hindarfjall' },
      { stage: 'Reward', age: 18, event: 'Awakens Brynhild from enchanted sleep', location: 'Hindarfjall' },
      { stage: 'Tests', age: 20, event: 'Tricked by magic potion, forgets Brynhild', location: 'Gjukungs hall' },
      { stage: 'Betrayal', age: 21, event: 'Marries Gudrun, helps Gunnar win Brynhild', location: 'Gjukungs hall' },
      { stage: 'Death', age: 22, event: 'Murdered in bed by Gutthorm', location: 'Gjukungs hall' }
    ],
    accomplishments: [
      { title: 'Slaying Fafnir', description: 'Killed the dragon guarding cursed gold', category: 'monster_slayer' },
      { title: 'Reforging Gram', description: 'Wielded the legendary sword of his father', category: 'divine_weapon' },
      { title: 'Dragon Blood Wisdom', description: 'Understood language of birds and nature', category: 'supernatural_gift' },
      { title: 'Awakening Brynhild', description: 'Freed Valkyrie from Odins curse', category: 'heroic_deed' },
      { title: 'Fafnirs Hoard', description: 'Claimed the vast treasure and magic ring', category: 'treasure' }
    ],
    trials: [
      { name: 'Orphaned at Birth', description: 'Father Sigmund died before his birth', type: 'loss' },
      { name: 'Cursed Gold', description: 'Andvaranaut ring brought doom', type: 'curse' },
      { name: 'Magical Deception', description: 'Potion made him forget true love', type: 'enchantment' },
      { name: 'Betrayal and Murder', description: 'Killed by those he served', type: 'treachery' }
    ],
    journey_diagram: 'diagrams/hero-journeys/sigurd-journey.svg',
    quest_map: 'diagrams/quest-maps/sigurd-quest.svg'
  },

  // ROMAN HEROES
  'roman_aeneas': {
    name: 'Aeneas',
    quest_timeline: [
      { stage: 'Ordinary World', age: 35, event: 'Prince of Troy, son of Anchises and Venus', location: 'Troy' },
      { stage: 'Call to Adventure', age: 35, event: 'Troy falls to Greeks, commanded to found new city', location: 'Troy' },
      { stage: 'Crossing Threshold', age: 35, event: 'Flees burning Troy with father and son', location: 'Troy' },
      { stage: 'Tests', age: 35, event: 'Fleet scattered by Junos storm', location: 'Mediterranean Sea' },
      { stage: 'Temptation', age: 36, event: 'Love affair with Queen Dido of Carthage', location: 'Carthage' },
      { stage: 'Call Renewed', age: 37, event: 'Mercury reminds of duty to found Rome', location: 'Carthage' },
      { stage: 'Road Back', age: 37, event: 'Leaves Carthage, Dido curses and dies', location: 'Carthage' },
      { stage: 'Tests', age: 37, event: 'Funeral games for Anchises in Sicily', location: 'Sicily' },
      { stage: 'Ordeal', age: 37, event: 'Descends to Underworld with Sibyl', location: 'Cumae' },
      { stage: 'Meeting Father', age: 37, event: 'Anchises shows future glory of Rome', location: 'Elysium' },
      { stage: 'Resurrection', age: 37, event: 'Returns from Underworld with purpose', location: 'Cumae' },
      { stage: 'Arrival', age: 38, event: 'Reaches Latium, promised land', location: 'Italy' },
      { stage: 'Tests', age: 38, event: 'War with Rutulians led by Turnus', location: 'Latium' },
      { stage: 'Supreme Ordeal', age: 39, event: 'Single combat with Turnus', location: 'Latium' },
      { stage: 'Return with Elixir', age: 39, event: 'Wins Lavinia, founds Alba Longa', location: 'Latium' }
    ],
    accomplishments: [
      { title: 'Pius Aeneas', description: 'Exemplar of Roman piety and duty', category: 'virtue' },
      { title: 'Rescue of Penates', description: 'Saved Troys sacred household gods', category: 'sacred_duty' },
      { title: 'Underworld Journey', description: 'Descended to meet father and see future', category: 'underworld' },
      { title: 'Founding Alba Longa', description: 'Established predecessor city of Rome', category: 'civilization' },
      { title: 'Divine Ancestry', description: 'Son of Venus, ancestor of Romulus', category: 'divine_lineage' }
    ],
    trials: [
      { name: 'Fall of Troy', description: 'Lost his homeland and kingdom', type: 'catastrophic_loss' },
      { name: 'Junos Hatred', description: 'Goddess opposed his destiny', type: 'divine_opposition' },
      { name: 'Didos Love', description: 'Nearly abandoned mission for love', type: 'temptation' },
      { name: 'Didos Curse', description: 'Her suicide cursed Rome and Carthage to war', type: 'curse' },
      { name: 'War in Italy', description: 'Had to fight for promised land', type: 'warfare' }
    ],
    journey_diagram: 'diagrams/hero-journeys/aeneas-journey.svg',
    quest_map: 'diagrams/quest-maps/aeneas-journey.svg'
  }
};

// Enhancement function
function enhanceHeroData(heroId, backupData) {
  const enhancement = heroEnhancements[heroId];
  if (!enhancement) return null;

  const hero = backupData.find(h => h.id === heroId);
  if (!hero) return null;

  // Enhance the hero data
  hero.data.quest_timeline = enhancement.quest_timeline;
  hero.data.accomplishments = enhancement.accomplishments;
  hero.data.trials = enhancement.trials;
  hero.data.journey_diagram = enhancement.journey_diagram;
  hero.data.quest_map = enhancement.quest_map;

  // Update metadata
  hero.data.metadata.updatedAt = new Date().toISOString();
  hero.data.metadata.enhancedBy = 'agent_7';
  hero.data.metadata.hasJourneyDiagram = true;
  hero.data.metadata.hasQuestMap = true;

  return hero;
}

// Main execution
async function main() {
  console.log('Starting hero enhancement process...\n');

  // Load backup data
  const backupPath = path.join(__dirname, '../FIREBASE/backups/backup-2025-12-13T03-51-50-305Z/heroes.json');
  const heroData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  console.log(`Loaded ${heroData.length} heroes from backup\n`);

  let enhancedCount = 0;
  const enhancedHeroes = [];

  // Enhance heroes
  for (const [heroId, enhancement] of Object.entries(heroEnhancements)) {
    const enhanced = enhanceHeroData(heroId, heroData);
    if (enhanced) {
      enhancedHeroes.push(enhanced);
      enhancedCount++;
      console.log(`✓ Enhanced ${heroId} - ${enhancement.name}`);
    }
  }

  console.log(`\n${enhancedCount} heroes enhanced with journey data`);
  console.log(`${enhancedCount} journey diagrams to be created`);
  console.log(`${enhancedCount} quest maps to be created\n`);

  // Save enhanced data back
  fs.writeFileSync(backupPath, JSON.stringify(heroData, null, 2));
  console.log(`✓ Saved enhanced hero data to backup file\n`);

  // Generate statistics
  const stats = {
    totalHeroesInDatabase: heroData.length,
    heroesWithEnhancements: enhancedCount,
    heroesWithTimelines: enhancedCount,
    heroesWithJourneyDiagrams: enhancedCount,
    heroesWithQuestMaps: enhancedCount,
    heroesWithAccomplishments: enhancedCount,
    heroesWithTrials: enhancedCount,
    byMythology: {}
  };

  enhancedHeroes.forEach(hero => {
    const myth = hero.data.mythology;
    if (!stats.byMythology[myth]) {
      stats.byMythology[myth] = 0;
    }
    stats.byMythology[myth]++;
  });

  console.log('Enhancement Statistics:');
  console.log(JSON.stringify(stats, null, 2));

  return {
    stats,
    enhancedHeroes: enhancedHeroes.map(h => ({
      id: h.id,
      name: h.data.name,
      mythology: h.data.mythology,
      timelineLength: h.data.quest_timeline?.length || 0,
      accomplishmentsCount: h.data.accomplishments?.length || 0,
      trialsCount: h.data.trials?.length || 0
    }))
  };
}

if (require.main === module) {
  main().then(result => {
    console.log('\n✓ Hero enhancement complete!');
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { enhanceHeroData, heroEnhancements };

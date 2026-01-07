#!/usr/bin/env node

/**
 * Sacred Places Metadata Enrichment Tool
 *
 * Populates rich metadata for sacred place entities in Firebase including:
 * - inhabitants: Who lives/lived there
 * - significance: Religious/cultural importance
 * - geography: Physical description
 * - relatedEvents: Historical/mythological events
 * - accessibility: How to reach it (mythologically or physically)
 * - guardians: Protectors of the place
 *
 * Usage:
 *   node scripts/enrich-places-metadata.js --audit
 *   node scripts/enrich-places-metadata.js --place mount-olympus
 *   node scripts/enrich-places-metadata.js --batch --output enriched-places.json
 *   node scripts/enrich-places-metadata.js --firebase --update
 */

const fs = require('fs');
const path = require('path');

// Knowledge base for rich place metadata
const PLACES_KNOWLEDGE_BASE = {
  'angkor-wat': {
    inhabitants: ['Buddhist monks', 'Hindu priests (historical)', 'Celestial devas', 'Divine guardians'],
    guardians: ['Vishnu (original dedication)', 'Buddha (later Buddhist tradition)', 'Apsaras (celestial dancers)', 'Devas of the cardinal directions'],
    significance: 'Largest religious monument in the world; represents the pinnacle of Khmer architecture; sacred to both Hinduism and Buddhism; symbol of Cambodia; represents the cosmic mandala and Mount Meru in stone',
    geography: 'Located in Siem Reap Province, Cambodia. Covers 162.6 hectares (402 acres). Built 1113-1150 CE. Three concentric rectangular walls and central temple tower; surrounded by moat representing cosmic ocean; architecture mirrors Mount Meru cosmology',
    relatedEvents: ['King Suryavarman II\'s construction as Hindu temple', 'Transformation into Buddhist temple', 'Gradual abandonment and reclamation by jungle', 'Modern restoration and UNESCO World Heritage designation', 'Daily ritual ceremonies and pilgrimages'],
    accessibility: 'physical - Accessible via road from Siem Reap; visitor center and guided tours available; sunrise viewing is popular pilgrimage practice'
  },
  'mount-olympus': {
    inhabitants: ['Zeus', 'Hera', 'Poseidon', 'Athena', 'Apollo', 'Artemis', 'Aphrodite', 'Ares', 'Hephaestus', 'Hermes', 'Demeter', 'Hestia'],
    guardians: ['The Titans', 'Nike (Victory)', 'The Olympian Guard'],
    significance: 'Home of the twelve Olympian gods; center of divine authority and cosmic order in Greek cosmology; where divine councils convene to decide mortal and divine fates',
    geography: 'Located in Thessaly & Macedonia, Greece. Elevation: 2,917 meters (9,570 feet) - Mytikas Peak. Snow-capped mountain visible from far distances; considered the "roof of the world" in Greek mythology',
    relatedEvents: ['Titanomachy - War between Titans and Olympians', 'Council of Gods regarding Trojan War', 'Prometheus receiving punishment for stealing fire', 'Hercules ascending to Olympus'],
    accessibility: 'mythical - Accessible only to immortals; requires divine status or direct divine invitation. In later periods, heroes like Heracles ascend through apotheosis. Physically accessible via mountain climbing'
  },
  'asgard': {
    inhabitants: ['Odin', 'Thor', 'Frigg', 'Tyr', 'Bragi', 'Idun', 'Loki', 'Heimdall', 'Freyja', 'Freyja\'s companions'],
    guardians: ['Heimdall (guardian of Bifrost)', 'The Aesir collective', 'Garmr (watchdog of Ragnarok)'],
    significance: 'The mightiest of the Nine Realms; home to the Aesir gods; represents divine authority and cosmic order in Norse cosmology. The realm that will survive Ragnarok\'s destruction',
    geography: 'Located at the top of Yggdrasil (World Tree); accessible via Bifrost rainbow bridge from Midgard. Contains golden halls (Valhalla for Odin, Bilskirnir for Thor, Folkvangr for Freyja); surrounded by great wall',
    relatedEvents: ['Ragnarok - the prophesied end of Asgard', 'Bifrost breaking under weight of Surtr during apocalypse', 'Asgardians\' final stand against Frost Giants', 'Building of Bifrost rainbow bridge'],
    accessibility: 'mythical - Accessible via Bifrost bridge; for mortals, only slain warriors reach Valhalla through honorable death'
  },
  'avalon': {
    inhabitants: ['King Arthur (in later life)', 'Morgan le Fay', 'The Lady of the Lake', 'Otherworldly beings', 'The Priestesses of Avalon'],
    guardians: ['Morgan le Fay', 'The Lady of the Lake', 'Otherworldly forces'],
    significance: 'The mystical Isle of Apples; realm where Arthurian legend concludes; represents the intersection of mortal and Otherworldly realms; place of healing and transformation. Central to Grail mythology',
    geography: 'A hidden island shrouded in mist; located somewhere beyond the mundane world (often associated with Glastonbury Tor); contains healing apples and Otherworldly abundance',
    relatedEvents: ['Arthur\'s wounding at Camlann and journey to Avalon', 'Merlin\'s departure to Avalon', 'Lady of the Lake delivering Excalibur', 'Sleeping King Arthur awaiting return during Britain\'s greatest need', 'Binding of the Grail at Avalon'],
    accessibility: 'mythical - Accessible through magical means; hidden from ordinary sight by enchantment; requires otherworldly knowledge or death (as in Arthur\'s case)'
  },
  'mount-kailash': {
    inhabitants: ['Shiva', 'Parvati', 'Ganesha', 'Hanuman', 'Tibetan Buddhist deities', 'The Celestial Bodhisattvas'],
    guardians: ['Shiva as supreme guardian', 'The Four Lokapalas (Directional Guardians)', 'Celestial beings and protectors'],
    significance: 'Axis Mundi - center of the universe in Hindu, Buddhist, Jain and Bon cosmologies; Mount Mandara in Hindu tradition; sacred to multiple traditions; pilgrimage site of immense spiritual importance; believed to be the abode of Shiva',
    geography: 'Ngari Prefecture, Tibet Autonomous Region, China. Elevation: 6,638 meters (21,778 feet). Four-sided pyramid shape with snow-covered peaks; considered the most sacred mountain in multiple Asian traditions. Lake Manasarovar at its base',
    relatedEvents: ['Shiva\'s meditation on the mountain', 'Parvati\'s tapasya (austerity) to win Shiva\'s love', 'Shiva\'s cosmic dances (Tandava)', 'The churning of the cosmic ocean (Mount Mandara role)', 'Buddhist pilgrimage traditions spanning centuries'],
    accessibility: 'physical/mythical - Sacred circumambulation (parikrama) is performed by pilgrims; actual summit climbing is forbidden in many traditions; spiritually accessible through pilgrimage and meditation'
  },
  'mecca-and-the-kaaba': {
    inhabitants: ['Prophet Muhammad (birthplace)', 'Muslim pilgrims during Hajj', 'Guardians of the Kaaba'],
    guardians: ['The Mutawwif (Hajj guides)', 'The Haram security', 'The spiritual protection of Allah'],
    significance: 'The holiest city in Islam; birthplace of Prophet Muhammad; center of Islamic faith and practice; destination of the Hajj pilgrimage (one of Five Pillars); the Kaaba is the qibla (direction of prayer) for all Muslims worldwide',
    geography: 'Located in Hejaz region of western Saudi Arabia, approximately 70 kilometers inland from Red Sea port of Jeddah. Center: the Masjid al-Haram (Sacred Mosque) containing the Kaaba - a cubic structure draped in black silk. City at elevation ~330m; surrounded by mountains',
    relatedEvents: ['Prophet Muhammad\'s birth', 'Migration (Hijra) from Mecca', 'Conquest of Mecca', 'First Hajj led by Prophet Muhammad', 'Revelation of the Quran (began in Mecca)', 'Annual Hajj pilgrimage for 1400+ years'],
    accessibility: 'physical/spiritual - Physically accessible; Hajj pilgrimage required for all able-bodied Muslims; Umrah (minor pilgrimage) open year-round; requires ritual purification and specific dress'
  },
  'valhalla': {
    inhabitants: ['Fallen warriors (Einherjar)', 'Odin', 'Valkyries', 'Bragi (god of poetry)', 'Idun (goddess of youth)'],
    guardians: ['Valkyries', 'Odin (primary guardian and host)', 'Heimdall'],
    significance: 'The great hall in Asgard; heaven for slain warriors who died in battle; ultimate reward for Norse warriors; represents honor, valor, and eternal glory; where Einherjar train for Ragnarok',
    geography: 'Located within Asgard; characterized as a golden hall with 540 doors; each door wide enough for 800 warriors to pass through; contains roasted boar Saehrimnir and mead from Heidrún the goat; eternally feasting and training grounds',
    relatedEvents: ['Valkyries selecting honored dead from battlefields', 'Warriors\' eternal feasting and combat training', 'Preparation for final battle at Ragnarok', 'Odin\'s governance and wisdom-sharing with Einherjar'],
    accessibility: 'mythical - Accessible only to warriors who die in battle; selected by Valkyries; status symbol in Norse culture driving honorable warfare'
  },
  'duat': {
    inhabitants: ['Osiris (supreme judge)', 'Anubis (guardian)', 'Thoth (divine scribe)', 'Ammit (soul-eater)', 'Deceased pharaohs and worthy souls', 'Various demon guardians'],
    guardians: ['Anubis (god of mummification and the dead)', 'Osiris (judge of the dead)', 'Thoth (keeper of cosmic order)', 'The Forty-Two Divine Judges'],
    significance: 'Egyptian underworld and realm of the dead; where souls are judged by weighing the heart against the feather of Ma\'at (truth/justice); essential to Egyptian afterlife belief; place of resurrection and eternal life for the worthy',
    geography: 'Described as a vast underground realm with multiple levels and chambers; contains the Hall of Two Truths where judgement occurs; filled with obstacles, demon guardians, and dangerous passages; also contains fields (Aaru) where the righteous dwell eternally',
    relatedEvents: ['Opening of the Mouth ceremony enabling entry', 'Weighing of the Heart against feather of Ma\'at', 'Journey through 12 hours of night (Book of the Dead)', 'Osiris\'s resurrection and reign as judge of the dead', 'Soul\'s transformation and eternal dwelling'],
    accessibility: 'mythical - Accessible only after death with proper burial rites and magical knowledge (Book of the Dead); requires passing trials and proving virtue before Forty-Two Judges'
  },
  'river-styx': {
    inhabitants: ['Charon (ferryman)', 'Deceased souls awaiting passage', 'Hades\' domain inhabitants'],
    guardians: ['Charon (enforcer of the crossing requirement)', 'Cerberus (guardian of the underworld)', 'Hades (lord of the underworld)'],
    significance: 'The boundary between living world and Greek underworld; symbolic separation between life and death; represents the irreversible passage into death; sacred oath by Styx water was binding even for gods',
    geography: 'A river in the Greek underworld; described as dark, murky, and fearsome; must be crossed to reach Hades proper; Charon\'s ferry is the only means of passage; the water itself has binding magical properties',
    relatedEvents: ['Hercules dragging Cerberus across and negotiating with Charon', 'Orpheus\'s descent to rescue Eurydice', 'Odysseus crossing to consult dead spirits', 'Achilles\' mother bathing him in Styx (Iliad)', 'Numerous heroes\' underworld journeys'],
    accessibility: 'mythical - Accessible only to the dead; requires a coin (obol) for Charon\'s ferry; living heroes who crossed did so through extraordinary heroic deeds or divine assistance'
  },
  'mount-sinai': {
    inhabitants: ['Moses (received the Law)', 'The Israelite nation (at the base)', 'God/Allah', 'Angels and celestial beings'],
    guardians: ['God/Allah (the mountain itself is sacred)', 'Prophets and holy figures in religious tradition'],
    significance: 'Sacred mountain where Moses received the Ten Commandments from God; considered one of the most holy sites in Judaism, Christianity, and Islam; represents divine revelation and the covenant between God and humanity; site of intense spiritual transformation',
    geography: 'Located in the Sinai Peninsula, Egypt (also claimed in Saudi Arabia and disputed); the traditional site is Jebel Musa (2,285m); characterized by rocky peaks and sparse vegetation; remote and formidable landscape; surrounded by desert',
    relatedEvents: ['Moses receiving the Ten Commandments', 'Theophany (appearance of God in fire and smoke)', 'Israelites\' covenant with God', 'The Golden Calf incident at the base', 'Elijah\'s pilgrimage to Sinai to meet God', 'Prophet Muhammad\'s alleged vision at Sinai (Islamic tradition)'],
    accessibility: 'physical/spiritual - Pilgrims climb the mountain on foot (traditionally overnight) to see the sunrise; accessible to all faiths; St. Catherine\'s Monastery at the base; requires physical endurance for ascent'
  },
  'the-oracle-of-delphi': {
    inhabitants: ['The Pythia (priestess oracle)', 'Apollo (the god)', 'Priests of Apollo', 'Suppliants and pilgrims'],
    guardians: ['Apollo (primary guardian)', 'The priestesses serving Apollo'],
    significance: 'The most important oracle in ancient Greece; center of Greek religious authority; Apollo\'s primary shrine; consulted by kings and common people alike; site of prophecy that shaped Greek history and mythology; repository of sacred wisdom',
    geography: 'Located at Delphi on the slopes of Mount Parnassus in central Greece; sits at 580m elevation; characterized by dramatic cliffs and the Castalian Spring; the chasm where toxic vapors allegedly rose (chasm itself no longer visible)',
    relatedEvents: ['Pythia\'s prophecies to kings and heroes', 'Foundation of colonies on Oracle\'s advice', 'Consultation before Trojan War', 'Pythia\'s prophecy of Socrates\' wisdom', 'The god Apollo slaying the Python and claiming the sanctuary', 'Amphictyonic Council meetings'],
    accessibility: 'physical - Open to pilgrims; required consultation process and fees; Pythia only gave prophecies on certain days of the month; required ritual purification before entering the temple'
  },
  'varanasi-the-city-of-light': {
    inhabitants: ['Hindu pilgrims and devotees', 'Sadhus (holy men)', 'Thousands of resident monks and priests', 'Deceased awaiting cremation'],
    guardians: ['Shiva (primary divine guardian)', 'The Mahakal (eternal time)', 'Ganga (the river goddess)'],
    significance: 'One of the holiest cities in Hinduism; believed to be the cosmic center and eternal abode of Shiva; city of liberation (Moksha); place where souls are freed from cycle of reincarnation; represents the intersection of the divine and material worlds',
    geography: 'Located on the banks of the Ganges River in Uttar Pradesh, India; characterized by steep ghats (steps) leading down to the sacred river; ancient winding streets; temples perched on hillsides overlooking the Ganges; the river itself is considered sacred',
    relatedEvents: ['Pilgrimage to bathe in sacred Ganges', 'Cremation ceremonies on the ghats', 'Devotional practices and worship at temples', 'Kashi Vishwanath Temple rituals', 'Souls achieving Moksha through death in Varanasi', 'Daily aarti (fire offerings) to the Ganges'],
    accessibility: 'physical/spiritual - Openly accessible to all; pilgrimage to bathe in Ganges (Ganga Snaan) considered spiritually purifying; dying in Varanasi believed to grant direct liberation from samsara'
  },
  'yggdrasil': {
    inhabitants: ['Ratatosk (squirrel)', 'Heidrun (goat)', 'Nidhog (dragon)', 'Eagles and various mythical creatures', 'The Nine Realms\' inhabitants'],
    guardians: ['Yggdrasil itself (the cosmic tree)', 'Heidrun (nourishment guardian)', 'Norns (fate weavers at the base)', 'The wells at the roots'],
    significance: 'The World Tree; axis mundi of Norse cosmology; connects all Nine Realms; represents cosmic order and eternal cycle of life and death; survives Ragnarok and gives birth to new creation; embodies the structure of existence itself',
    geography: 'A cosmic ash tree of immense size; roots extend to nine different realms (Asgard, Midgard, Muspelheim, etc.); trunk is so vast it supports multiple worlds; three roots reach down to wells (Aesir\'s well, Mimir\'s well, Niflheim\'s spring); eagle perches on top',
    relatedEvents: ['Ragnarok - tree shakes and trembles as cosmos ends', 'Rebirth of new world from Yggdrasil\'s branches', 'Continuous battle between squirrel Ratatosk and eagle', 'Nidhog gnawing at the roots (entropy)', 'Warriors climbing up and down the tree realms', 'Norns weaving fate at the base'],
    accessibility: 'mythical - Accessible to gods and creatures of the Nine Realms; mortals can access through their realm (Midgard); shamanic journeys in Norse spirituality involve travel via Yggdrasil'
  },
  'mount-meru': {
    inhabitants: ['Brahma (the creator)', 'Indra', 'Celestial beings', 'Devas and asuras', 'Divine and semi-divine creatures'],
    guardians: ['Brahma', 'Indra (king of devas)', 'The Four Lokapalas (directional guardians)', 'Celestial guardians'],
    significance: 'Cosmic axis and center of the universe in Hindu and Buddhist cosmology; home of Brahma the creator; represents the highest point of spiritual achievement; central to cosmological understanding; axis mundi connecting all realms',
    geography: 'Described as an immense mountain with four sides (each facing different directions); golden peaks reaching beyond the highest heavens; surrounded by rings of mountains and oceans; at the center of the disc-shaped universe (Chakravala)',
    relatedEvents: ['The churning of the cosmic ocean with Mount Mandara as churning staff', 'Brahma\'s cosmic creation', 'Devas and asuras fighting on its slopes', 'Gods\' descent and ascent along the mountain', 'Indra\'s palace atop the mountain'],
    accessibility: 'mythical - Accessible only to celestial beings and enlightened beings; represents the goal of spiritual practice in Buddhist traditions; symbolically climbed through meditation'
  },
  'borobudur': {
    inhabitants: ['Buddhist monks and pilgrims', 'Celestial Buddhas', 'Bodhisattvas', 'Devas and protective deities'],
    guardians: ['Vairocana Buddha (supreme)', 'The Five Celestial Buddhas', 'Buddhist protective deities'],
    significance: 'One of the largest Buddhist monuments in the world; UNESCO World Heritage Site; represents the structure of the Buddhist universe; the pilgrimage route through the temple embodies the path to enlightenment',
    geography: 'Located in Central Java, Indonesia (Magelang Regency). Covers approximately 2.5 hectares. Built in the 8th century. Nine-tiered structure (five square bases and four circular terraces); 506 Buddha statues and 2,672 relief panels; mandala-shaped when viewed from above',
    relatedEvents: ['Construction under Sailendra dynasty (8th century)', 'Gradual abandonment due to volcanic eruptions', 'Rediscovery and restoration in modern times', 'UNESCO World Heritage designation', 'Annual pilgrimages and Vesak (Buddha\'s Birthday) celebrations'],
    accessibility: 'physical - Accessible via car or bus from Yogyakarta; accessible to all visitors; circumambulation (pilgrimage walk) is encouraged; accessible for pilgrims with varying physical abilities'
  },
  'glastonbury-tor': {
    inhabitants: ['Arthur and the Once and Future King (legend)', 'Tor residents and hermits', 'Local pilgrims', 'Mythological Avalonian beings'],
    guardians: ['St. Michael (Christian tradition)', 'Avalonian spirits (pagan tradition)', 'The Goddess'],
    significance: 'Sacred to both Christian and pagan traditions; identified by some as the Isle of Avalon from Arthurian legend; represents the thin place between worlds; associated with the Holy Grail quest; pilgrimage destination',
    geography: 'Located in Somerset, England. A distinctive conical hill rising 158.5 meters (520 feet) above the Somerset Levels. Archaeological evidence of Iron Age settlement. St. Michael\'s Tower (14th century church) crowns the summit. Former marshland surroundings support Avalon identification',
    relatedEvents: ['Arthur\'s legendary connection to Avalon', 'Early Christian settlement and hermitage', 'Discovery of supposed Arthur and Guinevere burial site (1191)', 'St. Michael\'s Church construction', 'Ongoing pilgrimage and spiritual seeking'],
    accessibility: 'physical - Located near Glastonbury town in Somerset; accessible via footpath; requires modest hill climb to reach summit; popular pilgrimage site with visitor facilities'
  },
  'jerusalem-city-of-peace-city-of-conflict': {
    inhabitants: ['Religious communities (Jewish, Christian, Muslim)', 'Historical inhabitants across millennia', 'Pilgrims from all traditions'],
    guardians: ['God/Allah (spiritual)', 'Modern political authorities'],
    significance: 'Holiest city in Judaism, Christianity, and Islam; center of three major world religions; represents the connection between earthly and divine; site of redemption and divine judgment; sacred history spanning 3000+ years',
    geography: 'Located in the West Bank, Eastern Mediterranean, approximately 750m elevation. Old City contains Western Wall, Church of the Holy Sepulchre, and Dome of the Rock. Built on hills with ancient water systems. Strategic position on trade routes',
    relatedEvents: ['King David\'s establishment as capital', 'Solomon\'s Temple construction and destruction', 'Jesus\' life, death, and resurrection', 'Islamic conquest and establishment of sanctuaries', 'Crusades', 'Multiple destructions and rebuildings', 'Modern religious and political significance'],
    accessibility: 'physical - Accessible to visitors of all faiths; pilgrimage to key sites for each religion; some areas have restricted access based on faith and time'
  },
  'the-oracle-of-delphi': {
    inhabitants: ['The Pythia (priestess oracle)', 'Apollo (the god)', 'Priests and temple attendants', 'Pilgrims seeking prophecy'],
    guardians: ['Apollo (primary guardian)', 'The priestesses and priests serving Apollo'],
    significance: 'Most important oracle in ancient Greece; center of Greek religious and political authority; consulted before major decisions; Apollo\'s primary shrine; repository of Greek wisdom and prophecy',
    geography: 'Located at Delphi on slopes of Mount Parnassus in central Greece. Elevation ~580m. Dramatic cliff-side location. Features Castalian Spring (sacred water source). Olympic sanctuary with stadium and treasury buildings. Theatre overlooking plain',
    relatedEvents: ['Pythia\'s famous prophecies', 'Foundation of colonies on Oracle\'s advice', 'Consultation before Trojan War', 'Apollo\'s slaying of the Python', 'Socrates deemed wisest man in Greece', 'Multiple sacred wars over control'],
    accessibility: 'physical - Archaeological site open to visitors; ruins of temple, stadium, and treasury visible; accessible via scenic location on Mount Parnassus slopes; guided tours available'
  },
  'the-parthenon': {
    inhabitants: ['Athena (primary deity)', 'Priests and priestesses', 'Pilgrims and devotees', 'Historical residents and visitors'],
    guardians: ['Athena (goddess of wisdom and war)', 'The priesthood of Athena'],
    significance: 'Most important temple of Athena in ancient Greece; symbol of ancient Greek civilization and democracy; represents the height of Classical Greek architecture and artistic achievement; cultural beacon of Western civilization',
    geography: 'Located on the Acropolis in Athens, Greece. Elevation ~156m above sea level. Doric temple with 46 columns. Built 447-432 BCE. Overlooks the city with commanding view. Sacred precinct with smaller shrines and monuments',
    relatedEvents: ['Pericles\' commissioning of the temple', 'Phidias\' creation of the gold and ivory Athena Parthenos', 'Use as Christian church in Byzantine period', 'Use as mosque during Ottoman occupation', 'Modern restoration and UNESCO World Heritage status', 'Symbol of Greek cultural identity'],
    accessibility: 'physical - Located on accessible Acropolis; requires modest climb; archaeological site open to tourists; crowded during peak seasons; museum nearby contains famous sculptures'
  },
  'the-oracle-of-dodona': {
    inhabitants: ['Priests interpreting divine signs', 'Zeus (primary deity)', 'Priestesses of Dione', 'Pilgrims seeking guidance'],
    guardians: ['Zeus (god of sky and justice)', 'The priests and priestesses of Dodona'],
    significance: 'Oldest oracle in Greece; center of Zeus worship; unique method of divination through sacred oak tree and dove priestesses; represents connection between divine will and human understanding',
    geography: 'Located in Epirus in northwest Greece. Features a sacred oak grove (nearly destroyed but still present). Sanctuary with temple to Zeus and nearby temple to Dione. Surrounded by mountains and natural springs',
    relatedEvents: ['Jason and the Argonauts consulting the oracle', 'Ancient divination through oak rustling and dove calls', 'Priestesses interpreting divine messages', 'Continuous religious use from Bronze Age through Roman period'],
    accessibility: 'physical - Archaeological site accessible by car; modest infrastructure; less crowded than Delphi; requires some hiking to see sacred oak grove'
  },
  'the-tao-te-ching-location-mount-kunlun': {
    inhabitants: ['Immortal beings and Taoist sages', 'Xi Wangmu (Queen Mother of the West)', 'Celestial deities', 'Spiritual adepts'],
    guardians: ['Xi Wangmu (primary guardian)', 'Taoist celestial bureaucracy', 'Divine protectors'],
    significance: 'Legendary sacred mountain of Chinese mythology; axis mundi connecting heaven and earth; source of immortality elixir; paradise on earth; represents the harmony of Taoism and cosmic order',
    geography: 'Mythological location in western China (possibly Mount Muztagh or the Kunlun mountain range). Described as surrounded by mountains, with nine gates, jade buildings, and crystal palaces. Contains the Peaches of Immortality.',
    relatedEvents: ['Xi Wangmu\'s reign over immortals', 'Seekers of immortality journeying there', 'Taoist pilgrimages and spiritual quests', 'Integration with Daoist philosophy', 'Appearances in classical Chinese literature'],
    accessibility: 'mythical - Accessible through spiritual cultivation and meditation in Daoist practice; physical location disputed; legendary pilgrims undertake journey seeking immortality'
  },
  'temple-of-heaven': {
    inhabitants: ['Emperors performing rituals', 'Priests and ceremonial attendants', 'Pilgrims', 'Celestial deities (spiritual)'],
    guardians: ['Heaven itself (spiritual concept)', 'Imperial authorities (historical)'],
    significance: 'Most sacred temple in imperial China; center of imperial religious practice; connection between heaven and earth; represents cosmic harmony and emperor\'s role as intermediary between heaven and humanity',
    geography: 'Located in Beijing, China. Covers 273 hectares (675 acres). Contains the Circular Mound Altar (Hall of Heaven) and Hall of Prayer for Good Harvests. Built in Ming Dynasty (1406). Designed based on cosmological principles with circular (heaven) and square (earth) forms',
    relatedEvents: ['Winter solstice sacrifices by emperors', 'Prayers for good harvests and blessing', 'Imperial ceremonies and rituals', 'Preservation as UNESCO World Heritage Site', 'Modern pilgrimages and ritual practices'],
    accessibility: 'physical - Open to public as museum/heritage site; large grounds allow walking paths; accessible from Beijing city center; visitor facilities available'
  },
  'mecca-and-the-kaaba': {
    inhabitants: ['Prophet Muhammad (birthplace)', 'Muslim pilgrims during Hajj', 'Guardians of the Kaaba', 'Resident Muslim community'],
    guardians: ['The Mutawwif (Hajj guides)', 'The Haram security', 'The spiritual protection of Allah'],
    significance: 'The holiest city in Islam; birthplace of Prophet Muhammad; center of Islamic faith and practice; destination of the Hajj pilgrimage (one of Five Pillars); the Kaaba is the qibla (direction of prayer) for all Muslims worldwide',
    geography: 'Located in Hejaz region of western Saudi Arabia, approximately 70 kilometers inland from Red Sea port of Jeddah. Center: the Masjid al-Haram (Sacred Mosque) containing the Kaaba - a cubic structure draped in black silk. City at elevation ~330m; surrounded by mountains',
    relatedEvents: ['Prophet Muhammad\'s birth', 'Migration (Hijra) from Mecca', 'Conquest of Mecca', 'First Hajj led by Prophet Muhammad', 'Revelation of the Quran (began in Mecca)', 'Annual Hajj pilgrimage for 1400+ years'],
    accessibility: 'physical/spiritual - Physically accessible; Hajj pilgrimage required for all able-bodied Muslims; Umrah (minor pilgrimage) open year-round; requires ritual purification and specific dress'
  },
  'fatima': {
    inhabitants: ['Pilgrims', 'Marian apparition witnesses', 'Priests and religious community', 'The Virgin Mary (spiritual)'],
    guardians: ['The Virgin Mary (spiritual protector)', 'The Catholic Church (institutional)', 'Divine protection'],
    significance: 'One of Catholicism\'s most important pilgrimage sites; location of Marian apparitions to three shepherd children; represents hope, peace, and divine intervention; focus of Marian devotion and prayer',
    geography: 'Located in central Portugal, approximately 120 kilometers north of Lisbon. Shrine of Our Lady of Fátima (Santuário de Nossa Senhora de Fátima). Open plaza surrounded by basilicas. Natural spring water believed to have healing properties.',
    relatedEvents: ['Marian apparitions on May 13, 1917', 'Three secrets revealed to the children', 'Miracle of the dancing sun (October 1917)', 'Beatification and canonization of the shepherd children', 'Annual pilgrimage on May 12-13', 'Papal visits confirming significance'],
    accessibility: 'physical - Accessible by car, bus, or train from Lisbon; visitor facilities including hotels and restaurants; open year-round; wheelchair accessible in basilica'
  },
  'lourdes': {
    inhabitants: ['Bernadette Soubirous (visionary)', 'Pilgrims seeking healing', 'Priests and religious community', 'The Virgin Mary (spiritual)'],
    guardians: ['The Virgin Mary (spiritual protector)', 'The Catholic Church', 'Divine healing power'],
    significance: 'One of Catholicism\'s most visited pilgrimage sites; location of Marian apparitions in 1858; associated with healing miracles; represents faith, healing, and divine compassion; center of international pilgrimage',
    geography: 'Located in southern France near Pyrenees Mountains. Sanctuary built around the Grotto of Our Lady. Natural spring water believed to have miraculous healing properties. Candlelit ceremonies in cave sanctuary.',
    relatedEvents: ['Marian apparitions to Bernadette (1858)', 'Discovery of healing spring water', 'Canonization of Bernadette Soubirous', 'Recognition of medical miracles by Church', 'Annual International Pilgrimages and processions', 'Night vigils with thousands of candles'],
    accessibility: 'physical - Accessible by train or car from major European cities; extensive facilities for pilgrims; organized tours available; accessible for disabled visitors'
  },
  'mount-fuji': {
    inhabitants: ['Pilgrims', 'Buddhist and Shinto practitioners', 'Celestial beings (spiritual)', 'Sengen Sama (mountain goddess)'],
    guardians: ['Sengen Sama (goddess of Mount Fuji)', 'Buddhist and Shinto deities', 'The mountain itself'],
    significance: 'Japan\'s highest and most sacred mountain; symbol of Japanese culture and identity; sacred to Shinto and Buddhism; site of spiritual transformation and pilgrimage; represents the interface between physical and spiritual worlds',
    geography: 'Located on Honshu Island, Japan (Yamanashi Prefecture). Height: 3,776 meters (12,388 feet). Stratovolcano with distinctive symmetric cone shape. Last eruption 1707-1708. Visible from Tokyo on clear days. Surrounded by five lakes sacred in Japanese tradition.',
    relatedEvents: ['Ancient Shinto worship and shrine practices', 'Buddhist integration of mountain pilgrimage', 'Traditional climbing route with mountain huts', 'Artistic representations in ukiyo-e and literature', 'Modern outdoor recreation and pilgrimage', 'UNESCO World Heritage designation'],
    accessibility: 'physical - Climbing season: July-September; multiple ascent trails with varying difficulty; mountain huts provide accommodation; requires physical fitness'
  }
};

// Geographic and cultural context for places without specific entries
const PLACE_TYPE_TEMPLATES = {
  'mountain': {
    significance_base: 'Sacred mountain revered as a spiritual center and gathering place for divine or mythical beings',
    geography_base: 'Elevated terrain with commanding views; often snow-capped or shrouded in mist, symbolizing proximity to the divine',
    accessibility_base: 'Physically challenging pilgrimage route; often requires ritual purification and spiritual preparation'
  },
  'temple': {
    significance_base: 'Sacred structure dedicated to divine worship; center of ritual practice and spiritual community',
    geography_base: 'Architectural structure; often positioned at cosmically significant locations; contains sanctum sanctorum and ceremonial chambers',
    accessibility_base: 'Physically accessible to pilgrims; may require specific dress or ritual preparation; open during designated times'
  },
  'pillocation_site': {
    significance_base: 'Sacred destination for pilgrims seeking spiritual transformation and divine blessing',
    geography_base: 'Often features natural sacred elements (water, mountains, caves); marked by shrines and ceremonial structures',
    accessibility_base: 'Pilgrimage routes well-established; accommodations available for pilgrims; seasonal variations in accessibility'
  },
  'mythical_realm': {
    significance_base: 'Otherworldly realm existing in mythological or spiritual dimensions; represents divine order or alternative reality',
    geography_base: 'Described in mythological texts; exists beyond ordinary perception; accessible through magical or spiritual means',
    accessibility_base: 'Mythical accessibility - requires death, divine intervention, or spiritual transcendence'
  },
  'sacred_site': {
    significance_base: 'Location of sacred events, divine manifestations, or spiritual power',
    geography_base: 'Often features distinctive natural formations associated with sacred narratives',
    accessibility_base: 'Varies by tradition; physical or spiritual accessibility depending on religious practice'
  }
};

class PlacesMetadataEnricher {
  constructor() {
    this.placesDir = path.join(__dirname, '..', 'firebase-assets-downloaded', 'places');
    this.stats = {
      total: 0,
      enriched: 0,
      missing: 0,
      errors: []
    };
  }

  // Load a place file
  loadPlace(filename) {
    const filePath = path.join(this.placesDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Place not found: ${filename}`);
    }
    return {
      data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
      path: filePath,
      filename
    };
  }

  // Save a place file
  savePlace(place) {
    const backup = place.path + '.backup-' + Date.now();
    fs.copyFileSync(place.path, backup);
    fs.writeFileSync(place.path, JSON.stringify(place.data, null, 2));
    console.log(`✅ Saved ${place.filename}`);
  }

  // Generate rich metadata for a place
  generateMetadata(place) {
    const data = place.data;
    const id = data.id;

    // Use knowledge base if available
    if (PLACES_KNOWLEDGE_BASE[id]) {
      return {
        ...PLACES_KNOWLEDGE_BASE[id],
        source: 'knowledge-base',
        enriched: true,
        enrichedAt: new Date().toISOString()
      };
    }

    // Generate from template based on place type
    const placeType = data.placeType || 'sacred_site';
    const template = PLACE_TYPE_TEMPLATES[placeType] || PLACE_TYPE_TEMPLATES['sacred_site'];

    return {
      inhabitants: data.inhabitants || ['Spiritual beings', 'Pilgrims', 'Devotees'],
      guardians: data.guardians || ['Divine guardian', 'Protective spirit'],
      significance: data.significance || template.significance_base,
      geography: data.geography || template.geography_base,
      relatedEvents: data.associatedEvents || data.relatedEvents || ['Spiritual practices', 'Pilgrimage', 'Sacred rituals'],
      accessibility: data.accessibility || template.accessibility_base,
      source: 'generated-template',
      enriched: true,
      enrichedAt: new Date().toISOString(),
      needsReview: true
    };
  }

  // Enrich a single place
  enrichPlace(place) {
    const metadata = this.generateMetadata(place);

    // Merge with existing metadata
    place.data.inhabitants = place.data.inhabitants || metadata.inhabitants;
    place.data.guardians = place.data.guardians || metadata.guardians;
    place.data.significance = place.data.significance || metadata.significance;
    place.data.geography = place.data.geography || metadata.geography;
    place.data.relatedEvents = place.data.relatedEvents || metadata.relatedEvents;
    place.data.accessibility = place.data.accessibility || metadata.accessibility;

    // Add enrichment metadata
    if (!place.data._metadata) {
      place.data._metadata = {};
    }
    place.data._metadata.enriched = true;
    place.data._metadata.enrichedAt = new Date().toISOString();
    place.data._metadata.enrichmentSource = metadata.source;

    return place;
  }

  // Audit metadata completeness
  audit() {
    console.log('📊 PLACES METADATA COMPLETENESS AUDIT\n');

    const files = fs.readdirSync(this.placesDir)
      .filter(f => f.endsWith('.json') && f !== '_all.json');

    const stats = {
      total: files.length,
      withInhabitants: 0,
      withGuardians: 0,
      withSignificance: 0,
      withGeography: 0,
      withEvents: 0,
      withAccessibility: 0,
      fullyEnriched: 0,
      needsWork: []
    };

    files.forEach(file => {
      const place = this.loadPlace(file);
      const data = place.data;

      stats.withInhabitants += (data.inhabitants?.length > 0) ? 1 : 0;
      stats.withGuardians += (data.guardians?.length > 0) ? 1 : 0;
      stats.withSignificance += (data.significance && data.significance.length > 20) ? 1 : 0;
      stats.withGeography += (data.geography && data.geography.length > 20) ? 1 : 0;
      stats.withEvents += (data.relatedEvents?.length > 0 || data.associatedEvents?.length > 0) ? 1 : 0;
      stats.withAccessibility += (data.accessibility && data.accessibility.length > 5) ? 1 : 0;

      const hasAll = (data.inhabitants?.length > 0) &&
                     (data.guardians?.length > 0) &&
                     (data.significance?.length > 20) &&
                     (data.geography?.length > 20) &&
                     ((data.relatedEvents?.length > 0) || (data.associatedEvents?.length > 0)) &&
                     (data.accessibility && data.accessibility.length > 5);

      if (hasAll) {
        stats.fullyEnriched++;
      } else {
        stats.needsWork.push({
          id: data.id,
          missing: {
            inhabitants: data.inhabitants?.length === 0,
            guardians: data.guardians?.length === 0,
            significance: !data.significance || data.significance.length < 20,
            geography: !data.geography || data.geography.length < 20,
            events: (data.relatedEvents?.length === 0) && (data.associatedEvents?.length === 0),
            accessibility: !data.accessibility || data.accessibility.length < 5
          }
        });
      }
    });

    console.log(`Total Places: ${stats.total}`);
    console.log(`With Inhabitants:    ${stats.withInhabitants} (${this.percentage(stats.withInhabitants, stats.total)}%)`);
    console.log(`With Guardians:      ${stats.withGuardians} (${this.percentage(stats.withGuardians, stats.total)}%)`);
    console.log(`With Significance:   ${stats.withSignificance} (${this.percentage(stats.withSignificance, stats.total)}%)`);
    console.log(`With Geography:      ${stats.withGeography} (${this.percentage(stats.withGeography, stats.total)}%)`);
    console.log(`With Events:         ${stats.withEvents} (${this.percentage(stats.withEvents, stats.total)}%)`);
    console.log(`With Accessibility:  ${stats.withAccessibility} (${this.percentage(stats.withAccessibility, stats.total)}%)`);
    console.log(`\nFully Enriched: ${stats.fullyEnriched} (${this.percentage(stats.fullyEnriched, stats.total)}%)\n`);

    if (stats.needsWork.length > 0) {
      console.log('📋 PLACES NEEDING ENRICHMENT:\n');
      stats.needsWork.slice(0, 10).forEach(place => {
        const missing = Object.keys(place.missing).filter(k => place.missing[k]);
        console.log(`${place.id}: ${missing.join(', ')}`);
      });
      if (stats.needsWork.length > 10) {
        console.log(`... and ${stats.needsWork.length - 10} more`);
      }
    }

    return stats;
  }

  // Batch enrich all places
  async batchEnrich() {
    console.log('🔄 Batch enriching all places...\n');

    const files = fs.readdirSync(this.placesDir)
      .filter(f => f.endsWith('.json') && f !== '_all.json');

    console.log(`Found ${files.length} places\n`);

    let processed = 0;
    let enriched = 0;

    for (const file of files) {
      try {
        const place = this.loadPlace(file);
        const data = place.data;

        // Check if already has substantial metadata
        const hasSubstantialMetadata =
          (data.inhabitants?.length > 0) &&
          (data.guardians?.length > 0) &&
          (data.significance && data.significance.length > 100) &&
          (data.geography && data.geography.length > 100);

        if (!hasSubstantialMetadata) {
          this.enrichPlace(place);
          this.savePlace(place);
          enriched++;
        }

        processed++;
        process.stdout.write(`\rProcessed: ${processed}/${files.length} | Enriched: ${enriched}`);
      } catch (error) {
        console.error(`\n❌ Error processing ${file}:`, error.message);
        this.stats.errors.push({ file, error: error.message });
      }
    }

    console.log(`\n\n✅ Batch complete: ${enriched}/${processed} places enriched`);
    return { processed, enriched };
  }

  // Get detailed view of a place
  viewPlace(id) {
    const files = fs.readdirSync(this.placesDir)
      .filter(f => f.endsWith('.json') && f !== '_all.json');

    const filename = files.find(f => {
      const data = JSON.parse(fs.readFileSync(path.join(this.placesDir, f), 'utf8'));
      return data.id === id;
    });

    if (!filename) {
      console.log(`Place not found: ${id}`);
      return null;
    }

    const place = this.loadPlace(filename);
    return place.data;
  }

  percentage(num, total) {
    return Math.round((num / total) * 100);
  }

  // Generate enrichment report
  generateReport() {
    console.log('\n📊 ENRICHMENT REPORT\n');
    console.log('Enrichment sources:');
    console.log('  - Knowledge Base: Hand-crafted detailed metadata for major places');
    console.log('  - Generated Templates: Auto-generated from place type templates');
    console.log('\nMetadata fields enriched:');
    console.log('  ✓ inhabitants: Who lives/lived there');
    console.log('  ✓ guardians: Protectors and divine guardians');
    console.log('  ✓ significance: Religious and cultural importance');
    console.log('  ✓ geography: Physical and mythological description');
    console.log('  ✓ relatedEvents: Historical and mythological events');
    console.log('  ✓ accessibility: How to reach it physically or mythologically');
    console.log('\nUsage recommendations:');
    console.log('  1. Run audit to identify gaps: node scripts/enrich-places-metadata.js --audit');
    console.log('  2. Batch enrich: node scripts/enrich-places-metadata.js --batch');
    console.log('  3. Review Firebase exports for quality');
    console.log('  4. Manual review of template-generated entries');
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const enricher = new PlacesMetadataEnricher();

  if (args.includes('--audit')) {
    enricher.audit();
    enricher.generateReport();
  } else if (args.includes('--batch')) {
    await enricher.batchEnrich();
  } else if (args.includes('--place')) {
    const placeIdx = args.indexOf('--place');
    if (placeIdx === -1 || !args[placeIdx + 1]) {
      console.error('Error: --place requires <place-id>');
      process.exit(1);
    }
    const id = args[placeIdx + 1];
    const place = enricher.viewPlace(id);
    if (place) {
      console.log(JSON.stringify(place, null, 2));
    }
  } else {
    console.log('Sacred Places Metadata Enrichment Tool\n');
    console.log('Usage:');
    console.log('  node scripts/enrich-places-metadata.js --audit');
    console.log('  node scripts/enrich-places-metadata.js --batch');
    console.log('  node scripts/enrich-places-metadata.js --place <place-id>');
    console.log('\nThis tool enriches place metadata with:');
    console.log('  - inhabitants: Divine and mortal inhabitants');
    console.log('  - guardians: Protective figures');
    console.log('  - significance: Religious/cultural importance');
    console.log('  - geography: Physical description');
    console.log('  - relatedEvents: Associated events');
    console.log('  - accessibility: How to reach it');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PlacesMetadataEnricher };

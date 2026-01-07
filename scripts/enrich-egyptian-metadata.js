#!/usr/bin/env node

/**
 * Egyptian Mythology Enrichment Script
 *
 * Adds comprehensive historical metadata to Egyptian deity files including:
 * - Dynastic period affiliations
 * - Temple cult centers
 * - Hieroglyphic names
 * - Ancient text references
 * - Theological frameworks
 * - Syncretism relationships
 */

const fs = require('fs');
const path = require('path');

// Historical metadata database
const egyptianDeityMetadata = {
  'amun-ra': {
    dynasticPeriods: [
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Supreme god during imperial expansion' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued supremacy with priestly dominance' },
      { period: 'Ptolemaic Period', dynasties: 'Hellenistic', dateRange: '323-30 BCE', significance: 'Syncretism with Greek Zeus' }
    ],
    templeLocations: [
      { name: 'Karnak Temple Complex', location: 'Thebes (Luxor)', region: 'Upper Egypt', description: 'Largest temple complex of ancient world' },
      { name: 'Luxor Temple', location: 'Thebes', region: 'Upper Egypt', description: 'Secondary temple for Amun ritual' },
      { name: 'Medinet Habu', location: 'Thebes West Bank', region: 'Upper Egypt', description: 'Mortuary temple with Amun-Ra imagery' }
    ],
    hieroglyphicName: {
      translit: 'Imn-Rʿ',
      meaning: 'Hidden One - Ra (fusion of Amun and Ra)',
      glyph: '𓇍𓁛'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [217, 227, 355], description: 'Early solar theology' },
      { source: 'Coffin Texts', spells: [76, 148, 260], description: 'Middle Kingdom Amun development' },
      { source: 'Book of the Dead', spells: [125, 148], description: 'Negative Confession before Amun-Ra' },
      { source: 'Litany of Ra', chapters: 'All 75 forms', description: 'Detailed manifestations of Amun-Ra' },
      { source: 'Great Hymn to Amun', reference: 'Papyrus Leiden I 350', description: 'New Kingdom theological synthesis' }
    ],
    syncretismWith: [
      { deity: 'Amun', nature: 'Complete fusion - Hidden creative force + Solar manifest energy' },
      { deity: 'Ra', nature: 'Complete fusion - Hidden power given solar form' },
      { deity: 'Khepri', nature: 'Morning form of sun god' },
      { deity: 'Atum', nature: 'Evening form in daily cycle' }
    ],
    theologicalFramework: {
      period: 'Theban Theology',
      concept: 'Universal creative force manifest as sun god',
      role: 'King of gods, supreme creator',
      cosmoGonicRole: 'Daily regeneration through solar journey'
    },
    priestlyOrders: ['High Priest of Amun (Karnak)', 'Solar Priests'],
    majorFestivals: [
      { name: 'Opet Festival', month: 'Second month of inundation', description: 'Annual journey of Amun-Ra from Karnak to Luxor' },
      { name: 'Beautiful Feast of the Valley', month: 'First month of summer', description: 'Amun-Ra visits western necropolis' }
    ],
    dynasticEvolution: {
      oldKingdom: 'Not yet unified; Amun minor local god at Thebes',
      middleKingdom: 'Gradual rise as Thebes gains political power',
      newKingdom: 'Elevation to supreme god during Dynasty 18 Theban dominance',
      ptolemaic: 'Continued as Zeus-Ammon in Greco-Egyptian synthesis'
    }
  },

  'isis': {
    dynasticPeriods: [
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Initial mythology development and priesthood' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Rise to prominence as supreme goddess' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued expansion of worship' },
      { period: 'Ptolemaic Period', dynasties: 'Hellenistic', dateRange: '323-30 BCE', significance: 'Spread throughout Mediterranean world' }
    ],
    templeLocations: [
      { name: 'Philae Temple', location: 'Island near Aswan', region: 'Upper Egypt (Nubia border)', description: 'Major cult center, last functioning pagan temple (closed 550 CE)' },
      { name: 'Dendera Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Shared temple with Hathor' },
      { name: 'Abydos Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Osiris mystery center where Isis worship integrated' },
      { name: 'Giza Temple', location: 'Near Great Pyramids', region: 'Lower Egypt', description: 'Temple of Isis near Khafre pyramid' },
      { name: 'Behbeit el-Hagar', location: 'Nile Delta', region: 'Lower Egypt', description: 'Reputed birthplace of Isis' },
      { name: 'Rome - Iseum temples', location: 'Throughout Roman Empire', region: 'Mediterranean/European', description: 'Spread during Ptolemaic and Roman periods' }
    ],
    hieroglyphicName: {
      translit: 'Aset / Iset / Eset',
      meaning: 'Possibly from "throne" (Aset seat/throne icon)',
      glyph: '𓊨𓏏𓁐'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [364, 508, 577], description: 'Early references to Isis roles' },
      { source: 'Coffin Texts', spells: [25, 80, 148-161], description: 'Major expansion of Isis mythology' },
      { source: 'Book of the Dead', spells: [125, 148, 156], description: 'Isis as protective and wise guide' },
      { source: 'Hymn of Isis', reference: 'Philae Temple inscriptions', description: 'Worship hymns from cult center' },
      { source: 'Aretalogies of Isis', reference: 'Greek adaptations', description: 'Greco-Roman theological expansions' },
      { source: 'The Golden Ass', author: 'Apuleius (2nd century CE)', description: 'Roman literary account of Isis worship' }
    ],
    syncretismWith: [
      { deity: 'Hathor', nature: 'Often merged or identified; both sky/cosmic goddesses' },
      { deity: 'Nephthys', nature: 'Sister deity; complementary mourning roles' },
      { deity: 'Bastet', nature: 'Protective feminine forms of divine power' },
      { deity: 'Sekhmet', nature: 'Eye of Ra goddesses with different aspects' }
    ],
    theologicalFramework: {
      period: 'Osiriac Theology & Magic Philosophy',
      concept: 'Devoted love and magical knowledge overcome death itself',
      role: 'Supreme magician, Divine Mother, Queen of Heaven',
      cosmoGonicRole: 'Resurrection and restoration of order through heka'
    },
    priestlyOrders: ['Priestesses of Isis', 'Mystery cult initiates', 'Roman Iseum priesthood'],
    majorFestivals: [
      { name: 'The Isia', month: 'October 28 - November 3 (Roman)', description: 'Search for Osiris, mourning, resurrection celebration' },
      { name: 'The Navigium Isidis', month: 'March 5 (Roman)', description: 'Blessing of ships and opening of sailing season' },
      { name: 'The Lychnapsia', month: 'August 12 (Roman)', description: 'Festival of Lights - thousands of oil lamps lit' }
    ],
    dynasticEvolution: {
      oldKingdom: 'Minor mentions in Pyramid Texts',
      middleKingdom: 'Major development of Osiris-Isis mythology in Coffin Texts',
      newKingdom: 'Rise to prominence as supreme goddess during New Kingdom',
      ptolemaic: 'Spread throughout Mediterranean, syncretism with Greek goddesses, peak expansion'
    },
    magicalSignificance: {
      hekaType: 'Supreme practitioner of transformative magic',
      keyPowers: ['Resurrection', 'Protection', 'Shape-shifting', 'Knowledge of secret names'],
      symbolism: 'Throne headdress = cosmic kingship; tyet knot = life force'
    }
  },

  'osiris': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '3-6', dateRange: '2686-2181 BCE', significance: 'Minor god, referenced in Pyramid Texts' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Major development and democratic afterlife theology' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Peak worship as lord of resurrection' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued centrality to funerary practices' },
      { period: 'Ptolemaic Period', dynasties: 'Hellenistic', dateRange: '323-30 BCE', significance: 'Merged with Serapis in Greco-Egyptian form' }
    ],
    templeLocations: [
      { name: 'Abydos Temple (Seti I)', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Major pilgrimage center and mystery cult site' },
      { name: 'Dendera Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Shared with Hathor' },
      { name: 'Temple of Osiris at Karnak', location: 'Thebes', region: 'Upper Egypt', description: 'Integration with Amun-Ra theology' },
      { name: 'Philae Island temples', location: 'Aswan region', region: 'Upper Egypt (Nubia)', description: 'Continued worship in Greco-Roman period' }
    ],
    hieroglyphicName: {
      translit: 'Wsir',
      meaning: 'From "wsr" (mighty/powerful) - Lord of the Powerful',
      glyph: '𓊙𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 368, 440-450], description: 'Early underworld theology' },
      { source: 'Coffin Texts', spells: [330-342], description: 'Osiris resurrection narratives' },
      { source: 'Book of the Dead', spells: [1, 125, 148], description: 'Journey through Duat and judgment' },
      { source: 'Plutarch De Iside et Osiride', author: 'Greek historian (2nd century CE)', description: 'Account of Osiris myth' },
      { source: 'Abydos Mystery Drama', reference: 'Temple inscriptions', description: 'Ritual reenactment of resurrection' }
    ],
    syncretismWith: [
      { deity: 'Khenti-Amenti', nature: 'Earlier underworld god absorbed into Osiris mythology' },
      { deity: 'Ptah-Sokar-Osiris', nature: 'Syncretic form emphasizing mummification' },
      { deity: 'Hades', nature: 'Greek underworld god association' },
      { deity: 'Serapis', nature: 'Ptolemaic fusion creating universal god' }
    ],
    theologicalFramework: {
      period: 'Osiriac Theology & Afterlife Philosophy',
      concept: 'Death and resurrection are cyclical; ethical conduct determines afterlife quality',
      role: 'King of the Dead, Judge of souls, Guarantor of resurrection',
      cosmoGonicRole: 'Agricultural regeneration tied to Nile inundation cycles'
    },
    priestlyOrders: ['Priesthood of Osiris (Abydos)', 'Mummification specialists', 'Mystery cult initiates'],
    majorFestivals: [
      { name: 'Festival of Sokar', month: 'Month 3 of Inundation', description: 'Underground procession of god' },
      { name: 'Abydos Mystery Drama', month: 'Annual reenactment', description: 'Ritual death and resurrection of Osiris' },
      { name: 'Wag Festival', month: 'Month 1 of Inundation', description: 'Osiris judgment and resurrection' }
    ],
    dynasticEvolution: {
      oldKingdom: 'References in Pyramid Texts but not major focus',
      middleKingdom: 'Major expansion - became central to all Egyptian afterlife belief',
      newKingdom: 'Integration with other systems; peak worship and complexity',
      ptolemaic: 'Merged with Serapis; maintained centrality for two millennia'
    },
    underwordAspect: {
      domain: 'Duat (Egyptian underworld)',
      trials: ['Negative Confession (125 declarations)', 'Weighing of Heart against Ma\'at\'s feather', 'Navigation of 12 Hours'],
      guardians: ['Anubis (embalmer)', 'Thoth (scribe/judge)', 'Ma\'at (justice)']
    }
  },

  'thoth': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '3-6', dateRange: '2686-2181 BCE', significance: 'Early wisdom god in Pyramid Texts' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Developer of writing and divine scribe' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Supreme wisdom and magic authority' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Hermes Trismegistus identification' },
      { period: 'Greco-Roman', dynasties: 'Hellenistic to Roman', dateRange: '323 BCE-400 CE', significance: 'Merged with Hermes; Hermetic philosophy' }
    ],
    templeLocations: [
      { name: 'Hermopolis Magna (Khemenu)', location: 'Middle Egypt', region: 'Middle Egypt', description: 'Major cult center of Thoth' },
      { name: 'Karnak Temple', location: 'Thebes', region: 'Upper Egypt', description: 'Thoth sanctuary within Amun complex' },
      { name: 'Temple of Thoth at Khemenu', location: 'Middle Egypt', region: 'Middle Egypt', description: 'Center of Hermopolitan theology' }
    ],
    hieroglyphicName: {
      translit: 'Djehuty / Tehuti',
      meaning: 'Unknown etymology; possibly sound imitation of ibis call',
      glyph: '𓁿𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [307, 365, 442], description: 'Thoth as cosmic principle' },
      { source: 'Coffin Texts', spells: [33, 80, 261], description: 'Thoth as voice of Ra and divine scribe' },
      { source: 'Book of the Dead', spells: [64, 125, 148], description: 'Thoth as judge and guide' },
      { source: 'Emerald Tablet', reference: 'Hellenistic hermetic text', description: 'Attributed to Thoth/Hermes' },
      { source: 'Hermetic Corpus', author: 'Various (1-3 century CE)', description: 'Theurgic and magical practices attributed to Thoth' }
    ],
    syncretismWith: [
      { deity: 'Hermes', nature: 'Complete fusion in Greco-Roman period as Hermes Trismegistus' },
      { deity: 'Hapi', nature: 'Both knowledge/wisdom principles' },
      { deity: 'Seshat', nature: 'Thoth\'s female counterpart in writing/record-keeping' }
    ],
    theologicalFramework: {
      period: 'Hermopolitan Theology & Hermetic Philosophy',
      concept: 'Knowledge, writing, and magic are divine principles governing reality',
      role: 'Divine scribe, keeper of cosmic knowledge, judge of gods',
      cosmoGonicRole: 'Thoth\'s knowledge maintains cosmic order and mathematical harmony'
    },
    priestlyOrders: ['Priests of Thoth', 'Scribal orders', 'Later Hermetic philosophers'],
    majorFestivals: [
      { name: 'Festival of Ibis', month: 'Seasonal', description: 'Honoring Thoth\'s sacred animal form' }
    ],
    magicalSignificance: {
      expertise: 'Master of heka and divine names',
      knowledge: ['41 divine names', 'Mathematical principles', 'Cosmic cycles', 'Underworld navigation'],
      symbolism: 'Ibis (sacred bird), Moon crescent, Scales of justice'
    },
    dynasticEvolution: {
      oldKingdom: 'Cosmic principle in Pyramid Texts',
      middleKingdom: 'Developer of writing and record-keeper of gods',
      newKingdom: 'Integration with Amun system and judgment processes',
      ptolemaic: 'Hermes Trismegistus - Hermetic philosophy and magic'
    }
  },

  'ptah': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '1-6', dateRange: '3150-2181 BCE', significance: 'Creator god of Memphis from earliest dynasty' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Continued Memphis theology dominance' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Integration with Amun-Ra system' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued prominence at Memphis' }
    ],
    templeLocations: [
      { name: 'Ptah Temple Memphis', location: 'Memphis (ancient capital)', region: 'Lower Egypt', description: 'Primary temple of creator god' },
      { name: 'Ptah-Sokar-Osiris complex', location: 'Memphis', region: 'Lower Egypt', description: 'Syncretic temple combining three gods' },
      { name: 'Karnak Temple (Ptah Sanctuary)', location: 'Thebes', region: 'Upper Egypt', description: 'Secondary sanctuary in New Kingdom' }
    ],
    hieroglyphicName: {
      translit: 'Ptḥ',
      meaning: 'Unknown etymology; possibly "to open" (ptah = to unfold)',
      glyph: '𓊪𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [218, 222, 600-619], description: 'Ptah\'s primordial role' },
      { source: 'Coffin Texts', spells: [20, 25, 80], description: 'Memphis theology expansion' },
      { source: 'Memphis Creation Theology', reference: 'Various temple texts', description: 'Creation through thought/word doctrine' },
      { source: 'Shabaka Stone', reference: 'Dynasty 25 copy of Old Kingdom text', description: 'Ptah creation philosophy' }
    ],
    syncretismWith: [
      { deity: 'Ptah-Sokar-Osiris', nature: 'Triple form combining creation, underworld, and resurrection' },
      { deity: 'Apis bull', nature: 'Sacred manifestation of Ptah\'s power' },
      { deity: 'Atum', nature: 'Competing creation theologies from Heliopolis' }
    ],
    theologicalFramework: {
      period: 'Memphis Theology & Intellectual Creation',
      concept: 'Creation through divine thought, speech, and will',
      role: 'Creator god, Divine architect, Patron of craftsmen',
      cosmoGonicRole: 'Primordial creation by speaking things into existence'
    },
    priestlyOrders: ['High Priest of Ptah (Memphis)', 'Craftsmen guilds'],
    majorFestivals: [
      { name: 'Ptah Festival', month: 'Monthly ritual', description: 'Celebration of creation and craft' }
    ],
    dynasticEvolution: {
      oldKingdom: 'Supreme creator god at Memphis during Old Kingdom',
      middleKingdom: 'Maintained Memphis prominence; theological expansion',
      newKingdom: 'Integrated into broader systems under Amun-Ra',
      ptolemaic: 'Continued Memphis cult but reduced prominence'
    },
    creativeAspect: {
      methodOfCreation: 'Through divine thought (heka) and word',
      hekaType: 'Intellectual/philosophical magic',
      symbolism: 'Craftsman tools, Ptah-Sokar-Osiris mummies'
    }
  },

  'anubis': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '1-6', dateRange: '3150-2181 BCE', significance: 'Earliest mummification god' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Continued funerary god role' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Integrated into Osiris resurrection system' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued funerary priesthood prominence' }
    ],
    templeLocations: [
      { name: 'Anubis Temple Cynopolis', location: 'Upper Egypt (Hardai)', region: 'Upper Egypt', description: 'Major cult center' },
      { name: 'Abydos Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Anubis mummification rituals' },
      { name: 'Valley of Kings temples', location: 'Thebes West Bank', region: 'Upper Egypt', description: 'Tomb guarding and mummification' }
    ],
    hieroglyphicName: {
      translit: 'Inpu / Anpu',
      meaning: 'Possibly "to decay" or "disintegration of corpse"',
      glyph: '𓋴𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [217, 364, 405], description: 'Anubis as mummification god' },
      { source: 'Coffin Texts', spells: [32, 80, 404], description: 'Anubis in resurrection narrative' },
      { source: 'Book of the Dead', spells: [1, 125, 151], description: 'Anubis as guide and protector' },
      { source: 'Funerary Inscriptions', reference: 'Tomb texts', description: 'Invocations for Anubis protection' }
    ],
    syncretismWith: [
      { deity: 'Osiris', nature: 'Anubis as mummifier of Osiris; subordinate but essential role' },
      { deity: 'Wepwawet', nature: 'Both canine-form funerary gods; Wepwawet as "opener of ways"' },
      { deity: 'Sebek', nature: 'Both guardians of sacred spaces' }
    ],
    theologicalFramework: {
      period: 'Funerary Theology & Resurrection System',
      concept: 'Mummification preserves body for eternal life; Anubis ensures proper transformation',
      role: 'God of mummification, embalming, and cemetery protection',
      cosmoGonicRole: 'Guardian of transition from death to afterlife'
    },
    priestlyOrders: ['Priests of Anubis', 'Mummification specialists', 'Embalmers guild'],
    majorFestivals: [
      { name: 'Festival of Anubis', month: 'Seasonal', description: 'Cemetery blessings and mummification rituals' }
    ],
    mortaryAspect: {
      domain: 'Duat cemetery and transitions',
      rituals: ['Mummification process', 'Opening of Mouth ceremony', 'Protection spells'],
      symbolism: 'Black jackal/dog, mummy wrappings, ankh symbol'
    },
    dynasticEvolution: {
      oldKingdom: 'Original funerary god, predates Osiris mythology',
      middleKingdom: 'Integrated into Osiris system but maintains mummification role',
      newKingdom: 'Essential component of afterlife theology',
      ptolemaic: 'Continued importance in Greco-Roman mortuary practices'
    }
  },

  'hathor': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '4-6', dateRange: '2589-2181 BCE', significance: 'Sky goddess and mother of Horus' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Expanded love and music roles' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Peak worship and syncretism with Isis' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued prominence in female worship' }
    ],
    templeLocations: [
      { name: 'Dendera Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Major cult center and pilgrimage site' },
      { name: 'Serabit el-Khadim', location: 'Sinai', region: 'Eastern Desert', description: 'Turquoise mining temple' },
      { name: 'Temple of Hathor Abu Simbel', location: 'Abu Simbel', region: 'Nubia', description: 'Ramesses II temple' }
    ],
    hieroglyphicName: {
      translit: 'Ḥwt-Ḥr',
      meaning: '"House of Horus" - Mother of Horus',
      glyph: '𓁼𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 217, 367], description: 'Hathor as sky goddess' },
      { source: 'Coffin Texts', spells: [80, 148, 168], description: 'Hathor in cosmic narratives' },
      { source: 'Book of the Dead', spells: [125, 148], description: 'Hathor protection and guidance' },
      { source: 'Dendera Inscriptions', reference: 'Temple walls', description: 'Hathor worship and festival descriptions' }
    ],
    syncretismWith: [
      { deity: 'Isis', nature: 'Often merged; both cosmic goddesses and mothers' },
      { deity: 'Sekhmet', nature: 'Both "Eye of Ra" with different emphasis' },
      { deity: 'Bastet', nature: 'Multiple protective feminine forms' }
    ],
    theologicalFramework: {
      period: 'Feminine Divine Principle & Sky Theology',
      concept: 'Sky vault arching over creation; Mother of all life; Eye of Ra protection',
      role: 'Sky goddess, Love and music, Divine mother, Eye of Ra',
      cosmoGonicRole: 'Celestial vault and cosmic harmony'
    },
    priestlyOrders: ['Priestesses of Hathor', 'Musicians and dancers', 'Dendera priesthood'],
    majorFestivals: [
      { name: 'Festival of Hathor', month: 'Month of Tybi (Jan-Feb)', description: 'Music, dance, and celebration' },
      { name: 'Beautiful Feast of the Valley', month: 'Shemu', description: 'Hathor visits necropolis' }
    ],
    culturalSignificance: {
      domains: ['Love', 'Beauty', 'Music', 'Dance', 'Wine', 'Celebration'],
      rituals: ['Musical celebrations', 'Sistrum rituals', 'Ecstatic dances'],
      symbolism: 'Cow with solar disk, mirror (sistrum), cosmetic oils'
    },
    dynasticEvolution: {
      oldKingdom: 'Sky goddess and divine mother in Pyramid Texts',
      middleKingdom: 'Expansion to love, music, and pleasure domains',
      newKingdom: 'Merger with Isis in many cult functions',
      ptolemaic: 'Integration with Greek Aphrodite'
    }
  },

  'horus': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '1-6', dateRange: '3150-2181 BCE', significance: 'Falcon god and royal symbol' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Developed as Osiris-Horus mythology' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Pharaonic identification primary role' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued royal theology importance' }
    ],
    templeLocations: [
      { name: 'Temple of Horus Edfu', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Most complete preserved temple' },
      { name: 'Kom Ombo', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Shared with Sobek' },
      { name: 'Dendera Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Horus of Edfu sanctuary' }
    ],
    hieroglyphicName: {
      translit: 'Ḥr',
      meaning: '"Distant one" or "Heights" (sky god falcon)',
      glyph: '𓅊𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [217, 219, 220], description: 'Horus as sky god' },
      { source: 'Coffin Texts', spells: [25, 80, 148-161], description: 'Horus-Osiris mythology development' },
      { source: 'Book of the Dead', spells: [125, 145-146], description: 'Living Horus/Pharaoh identification' },
      { source: 'Edfu Temple texts', reference: 'Horus-Set conflict drama', description: 'Seasonal reenactment narrative' }
    ],
    syncretismWith: [
      { deity: 'Ra', nature: 'Ra-Horakhty - unified solar and falcon god' },
      { deity: 'Osiris', nature: 'Son in resurrection mythology' },
      { deity: 'Pharaoh (living)', nature: 'Pharaoh as living Horus on earth' }
    ],
    theologicalFramework: {
      period: 'Pharaonic Theology & Sky Mythology',
      concept: 'Divine legitimacy of kingship; Horus archetype for all pharaohs',
      role: 'Sky god, Divine heir, Rightful king, Avenger of father',
      cosmoGonicRole: 'Celestial surveillance and royal authority'
    },
    priestlyOrders: ['Priests of Horus', 'Royal temple priesthood'],
    majorFestivals: [
      { name: 'Festival of Horus Victory', month: 'Tybi', description: 'Reenactment of Horus-Set conflict' },
      { name: 'Coronation of Horus', month: 'Variable', description: 'New pharaoh identified as Horus' }
    ],
    royalSignificance: {
      pharaonicIdentification: 'Every living pharaoh = Horus incarnate',
      enemies: 'Set (chaos) defeated by rightful Horus (order)',
      symbolism: 'Falcon, royal crook and flail, double crown'
    },
    dynasticEvolution: {
      oldKingdom: 'Falcon god and royal emblem',
      middleKingdom: 'Integration into Osiris-Horus cycle mythology',
      newKingdom: 'Peak importance as pharaonic identification',
      ptolemaic: 'Continued in Greek Ptolemy identification'
    }
  },

  'sekhmet': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '4-6', dateRange: '2589-2181 BCE', significance: 'War goddess and divine retribution' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Expanded healing roles' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Peak prominence during military expansion' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued healing priesthood expansion' }
    ],
    templeLocations: [
      { name: 'Temple of Sekhmet Memphis', location: 'Memphis', region: 'Lower Egypt', description: 'Primary temple adjacent to Ptah' },
      { name: 'Karnak Temple (Sekhmet Sanctuary)', location: 'Thebes', region: 'Upper Egypt', description: 'War goddess during imperial expansion' },
      { name: 'Temple of Mut Karnak', location: 'Thebes', region: 'Upper Egypt', description: 'Sekhmet-Mut forms' }
    ],
    hieroglyphicName: {
      translit: 'Sḫmt',
      meaning: '"Powerful" - The Powerful One',
      glyph: '𓌙𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 230, 308], description: 'Sekhmet as divine warrior' },
      { source: 'Coffin Texts', spells: [80, 148, 330], description: 'Sekhmet\'s dual healing role' },
      { source: 'Book of the Dead', spells: [125, 148], description: 'Sekhmet as protection against chaos' },
      { source: 'Myth of Sekhmet\'s Rampage', reference: 'Various mythological texts', description: 'Divine punishment narrative' }
    ],
    syncretismWith: [
      { deity: 'Hathor', nature: 'Both "Eye of Ra" with different manifestations' },
      { deity: 'Bastet', nature: 'Feline forms of divine power (lion vs. cat)' },
      { deity: 'Mut', nature: 'Merged in Sekhmet-Mut form' }
    ],
    theologicalFramework: {
      period: 'Divine Warrior & Healing Magic Theology',
      concept: 'Destruction is necessary for regeneration; disease and healing are interconnected',
      role: 'Warrior goddess, Healer, Eye of Ra, Divine retribution',
      cosmoGonicRole: 'Necessary violence maintaining cosmic order'
    },
    priestlyOrders: ['Priests of Sekhmet', 'Physicians and healers', 'War priesthood'],
    majorFestivals: [
      { name: 'Festival of Sekhmet', month: 'Thoth', description: 'Celebration of healing and protection' }
    ],
    dualNature: {
      destruction: 'Divine warrior; plague and pestilence bringer',
      healing: 'Patroness of physicians and healers',
      symbolism: 'Lioness, solar disk, uraeus serpent, Eye of Ra'
    },
    dynasticEvolution: {
      oldKingdom: 'War and divine retribution emphasis',
      middleKingdom: 'Expansion of healing and protective roles',
      newKingdom: 'Military prominence during imperial conquests',
      ptolemaic: 'Integration with Greek Ares and Asclepius'
    }
  },

  'bastet': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '4-6', dateRange: '2589-2181 BCE', significance: 'Lioness war goddess (early form)' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Transition to cat goddess' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Feline form domestication and pleasure' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Peak popularity and cult expansion' }
    ],
    templeLocations: [
      { name: 'Temple of Bastet Bubastis', location: 'Delta (Tell Basta)', region: 'Lower Egypt', description: 'Major pilgrimage center and festival site' },
      { name: 'Memphis Temple', location: 'Memphis', region: 'Lower Egypt', description: 'Bastet-Sekhmet form' }
    ],
    hieroglyphicName: {
      translit: 'Bst',
      meaning: 'From "Bas" - ointment/perfume (protective essence)',
      glyph: '𓃭𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 308], description: 'Early lioness form' },
      { source: 'Coffin Texts', spells: [80, 148], description: 'Protective and pleasure roles' },
      { source: 'Book of the Dead', spells: [125, 148], description: 'Bastet as protector' },
      { source: 'Herodotus Histories', author: 'Greek historian (5th century BCE)', description: 'Account of Bastet festival' }
    ],
    syncretismWith: [
      { deity: 'Sekhmet', nature: 'Same divine force in different manifestations (fierce lion/gentle cat)' },
      { deity: 'Hathor', nature: 'Both pleasure and music goddesses' },
      { deity: 'Diana', nature: 'Greek hunting goddess association' }
    ],
    theologicalFramework: {
      period: 'Protective Pleasure & Domestic Magic Theology',
      concept: 'Protection and pleasure are sacred; domesticated power maintains home',
      role: 'Protective goddess, Cat mother, Goddess of joy and music',
      cosmoGonicRole: 'Domestic harmony and fertility'
    },
    priestlyOrders: ['Priestesses of Bastet', 'Musicians and dancers', 'Bubastis priesthood'],
    majorFestivals: [
      { name: 'Bastet Festival Bubastis', month: 'Month of Paophi', description: 'Thousands gathered; music, dance, celebration - largest festival' },
      { name: 'Feast of Bastet', month: 'Month of Paophi', description: 'Monthly celebrations' }
    ],
    culturalSignificance: {
      domestication: 'Evolution from wild lioness to tame cat protector',
      domains: ['Music', 'Dance', 'Joy', 'Protection', 'Motherhood'],
      dailyDevotion: 'Cats as sacred animals in households'
    },
    dynasticEvolution: {
      oldKingdom: 'Fierce lioness war deity form',
      middleKingdom: 'Gradual transformation to cat form',
      newKingdom: 'Domestic cat goddess; pleasure and music emphasis',
      ptolemaic: 'Peak popularity; integration with Greek Artemis'
    }
  },

  'set': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '2-6', dateRange: '2890-2181 BCE', significance: 'Storm and chaos god feared' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Integrated into cosmic balance' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Protector of Ra\'s solar boat' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Demonized during Persian occupation' }
    ],
    templeLocations: [
      { name: 'Temple of Set Avaris', location: 'Delta', region: 'Lower Egypt', description: 'Hyksos period prominence' },
      { name: 'Karnak Temple (Set Sanctuary)', location: 'Thebes', region: 'Upper Egypt', description: 'Integration into solar theology' }
    ],
    hieroglyphicName: {
      translit: 'Stẖ / Swtẖ',
      meaning: 'Possibly "to set apart" or "inserted" - Insertion into cosmic system',
      glyph: '𓋞𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 217, 225], description: 'Set as chaos but necessary force' },
      { source: 'Coffin Texts', spells: [25, 80, 148-161], description: 'Horus-Set cosmic conflict' },
      { source: 'Book of the Dead', spells: [125, 148'], description: 'Set as obstacle to overcome' },
      { source: 'Edfu Temple texts', reference: 'Horus-Set conflict drama', description: 'Seasonal reenactment narrative' },
      { source: 'Plutarch De Iside et Osiride', author: 'Greek historian', description: 'Account of Set mythology' }
    ],
    syncretismWith: [
      { deity: 'Typhon', nature: 'Greek chaos/storm association' },
      { deity: 'Apep', nature: 'Both forces of chaos requiring defeat' },
      { deity: 'Ares', nature: 'War and storm god identification' }
    ],
    theologicalFramework: {
      period: 'Chaos-Order Balance Theology',
      concept: 'Chaos is necessary counterpoint; Set\'s role in maintaining Ra\'s journey',
      role: 'God of chaos, storms, desert; Protector of Ra; Murderer of Osiris; Eternal adversary of Horus',
      cosmoGonicRole: 'Necessary opposing force to maintain cosmic equilibrium'
    },
    priestlyOrders: ['Priests of Set (limited by late period)', 'Desert guardians'],
    conflictMythology: {
      primaryConflict: 'Eternal struggle with Horus over pharaonic legitimacy',
      victim: 'Osiris (whom Set murdered)',
      protectorRole: 'Protects Ra\'s solar barque from Apep attacks nightly',
      symbolism: 'Red desert, chaos serpent, pig, hippopotamus'
    },
    dynasticEvolution: {
      oldKingdom: 'Feared chaos god but part of cosmic system',
      middleKingdom: 'Integration into balance; necessary opposing force',
      newKingdom: 'Protector of Ra; legitimate cosmic role established',
      ptolemaic: 'Demonization; associated with foreign invasions'
    }
  },

  'apep': {
    dynasticPeriods: [
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Emergence as chaos serpent' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Peak mythology development' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Continued daily ritual combat' }
    ],
    templeLocations: [
      { name: 'Karnak Temple (Daily Rituals)', location: 'Thebes', region: 'Upper Egypt', description: 'Daily re-enactment of Ra vs. Apep' },
      { name: 'Memphis Temple (Apep Binding)', location: 'Memphis', region: 'Lower Egypt', description: 'Magical neutralization rituals' }
    ],
    hieroglyphicName: {
      translit: 'ʿppy / ʿpp',
      meaning: 'Unknown etymology; possibly "who-is-to-be-overthrown"',
      glyph: '𓋟𓏏𓇯'
    },
    textualSources: [
      { source: 'Coffin Texts', spells: [80, 149, 261], description: 'Apep as eternal enemy' },
      { source: 'Book of the Dead', spells: [7, 39, 125], description: 'Spells against Apep' },
      { source: 'Litany of Ra', all_hours: 'Present in each hour of Duat', description: 'Nightly combat narrative' },
      { source: 'Book of Amduat', reference: '12-hour underworld journey', description: 'Apep encounters in underworld' }
    ],
    syncretismWith: [
      { deity: 'Soko', nature: 'Different snake chaos manifestations' },
      { deity: 'Typhon', nature: 'Greek chaos/storm association' }
    ],
    theologicalFramework: {
      period: 'Cosmic Order vs. Chaos Theology',
      concept: 'Eternal struggle between order (ma\'at) and chaos (isfet); chaos must be perpetually defeated',
      role: 'Primordial chaos serpent; Eternal enemy of order; Nightly challenger of Ra',
      cosmoGonicRole: 'Represents entropy and disorder requiring constant vigilance'
    },
    priestlyOrders: ['Priests of Ra (who combat Apep)', 'Magical specialists'],
    cosmicRole: {
      nightly_threat: 'Attempts to devour Ra\'s solar barque during night journey',
      magical_opposition: 'Spells and rituals executed daily to bind and weaken Apep',
      inevitable_return: 'Apep cannot be permanently destroyed; returns each night',
      symbolism: 'Massive serpent (sometimes multiple heads), chaos waters'
    }
  },

  'geb': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '3-6', dateRange: '2686-2181 BCE', significance: 'Primordial earth god in creation myths' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Continued cosmological importance' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Integration into cosmic theology' }
    ],
    templeLocations: [
      { name: 'Heliopolis Temple', location: 'Heliopolis (On)', region: 'Lower Egypt', description: 'Center of Geb-Nut mythology' }
    ],
    hieroglyphicName: {
      translit: 'Ggb / Gb',
      meaning: 'Possibly "to swell" (earth emerging from waters)',
      glyph: '𓇍𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [217-219, 355], description: 'Geb as earth personification' },
      { source: 'Coffin Texts', spells: [25, 80, 148], description: 'Geb in cosmological system' },
      { source: 'Heliopolitan Ennead texts', reference: 'Creation theology', description: 'Geb as primordial layer' }
    ],
    theologicalFramework: {
      period: 'Cosmological Personification Theology',
      concept: 'Earth itself is divine body; landmass personified as reclining god',
      role: 'Personification of earth; Father of Osiris and Isis',
      cosmoGonicRole: 'Physical earth plane of existence'
    }
  },

  'nut': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '3-6', dateRange: '2686-2181 BCE', significance: 'Primordial sky goddess in creation myths' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Continued cosmological importance' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Integration into cosmic theology' }
    ],
    templeLocations: [
      { name: 'Heliopolis Temple', location: 'Heliopolis (On)', region: 'Lower Egypt', description: 'Center of Geb-Nut mythology' }
    ],
    hieroglyphicName: {
      translit: 'Nwt',
      meaning: 'Possibly "void" or "sky" - The Void/Sky',
      glyph: '𓇯𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [217-219, 355], description: 'Nut as sky vault' },
      { source: 'Coffin Texts', spells: [25, 80, 148'], description: 'Nut in cosmological system' },
      { source: 'Heliopolitan Ennead texts', reference: 'Creation theology', description: 'Nut as sky element' }
    ],
    theologicalFramework: {
      period: 'Cosmological Personification Theology',
      concept: 'Sky itself is divine body; arched vault personified as nude goddess',
      role: 'Personification of sky vault; Mother of Osiris and Isis',
      cosmoGonicRole: 'Upper celestial plane of existence'
    }
  },

  'nephthys': {
    dynasticPeriods: [
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Developed in Osiris mythology' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Integrated as mourning goddess' }
    ],
    templeLocations: [
      { name: 'Abydos Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Osiris mysteries with Isis' },
      { name: 'Dendera Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Shared goddess worship' }
    ],
    hieroglyphicName: {
      translit: 'Nbṯ-hwt',
      meaning: '"Lady of the House" - Divine Housewife',
      glyph: '𓊪𓏏𓇯'
    },
    textualSources: [
      { source: 'Coffin Texts', spells: [25, 80, 148-161], description: 'Nephthys in Osiris mythology' },
      { source: 'Book of the Dead', spells: [125, 148], description: 'Nephthys as protector and mourner' },
      { source: 'Funerary inscriptions', reference: 'Tomb texts', description: 'Invocations for protection' }
    ],
    theologicalFramework: {
      period: 'Protective Mourning Theology',
      concept: 'Grief and protection are sacred; sister loves transcend family conflict',
      role: 'Goddess of mourning, Night, Protection, Childbirth',
      cosmoGonicRole: 'Protective darkness and restoration through grief'
    }
  },

  'neith': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '1-6', dateRange: '3150-2181 BCE', significance: 'Hunting and weaving goddess from earliest times' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Continued prominence' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Creator goddess emphasis' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Philosophical reinterpretation' }
    ],
    templeLocations: [
      { name: 'Temple of Neith Sais', location: 'Delta', region: 'Lower Egypt', description: 'Ancient cult center' },
      { name: 'Esna Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Creation theology focus' }
    ],
    hieroglyphicName: {
      translit: 'Nit',
      meaning: 'Possibly from weaving or creation imagery',
      glyph: '𓁕𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 217, 366'], description: 'Neith as weaver and creator' },
      { source: 'Coffin Texts', spells: [80, 261], description: 'Neith in creation mythology' },
      { source: 'Esna Temple texts', reference: 'Creation theology inscriptions', description: 'Neith as primordial weaver' }
    ],
    theologicalFramework: {
      period: 'Weaver Goddess & Primordial Creation Theology',
      concept: 'Creation through weaving cosmic threads; divine craftsmanship',
      role: 'Creator goddess, Hunter goddess, Weaver of destiny',
      cosmoGonicRole: 'Primordial weaver creating reality from chaos'
    }
  },

  'maat': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '3-6', dateRange: '2686-2181 BCE', significance: 'Concept of cosmic order emerging' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Formalization as judgment principle' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Peak theological importance' }
    ],
    templeLocations: [
      { name: 'All temples', location: 'Throughout Egypt', region: 'Pan-Egyptian', description: 'Ma\'at principle central to all temples' }
    ],
    hieroglyphicName: {
      translit: 'Mʿat',
      meaning: '"Truth" or "Rightness" - Cosmic Order',
      glyph: '𓂞𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 217, 355], description: 'Ma\'at as cosmic principle' },
      { source: 'Coffin Texts', spells: [25, 80], description: 'Ma\'at and justice ethics' },
      { source: 'Book of the Dead', spell: '125', description: 'Negative Confession - 42 declarations of ma\'at' },
      { source: 'Royal inscriptions', reference: 'All pharaonic records', description: 'Pharaoh as upholder of ma\'at' }
    ],
    theologicalFramework: {
      period: 'Ethical-Cosmic Order Theology',
      concept: 'Universe operates on principle of balance, truth, and justice; chaos threatens existence',
      role: 'Goddess of truth, justice, cosmic order, equilibrium',
      cosmoGonicRole: 'Underlying principle maintaining all existence'
    },
    ritualSignificance: {
      judgmentProcess: 'Heart weighed against feather of Ma\'at in Duat',
      moralFramework: 'Negative Confession lists 42 ethical requirements',
      symbolism: 'Single ostrich feather, scales of justice, personified woman'
    }
  },

  'sobek': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '4-6', dateRange: '2589-2181 BCE', significance: 'Crocodile god of Nile worship' },
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'Creator god emphasis' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Expanded creator theology' }
    ],
    templeLocations: [
      { name: 'Kom Ombo Temple', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Shared with Horus' },
      { name: 'Crocodilopolis', location: 'Faiyum', region: 'Middle Egypt', description: 'Major cult center' }
    ],
    hieroglyphicName: {
      translit: 'Sbk / Sokhos',
      meaning: 'Possibly from crocodile sounds or appearance',
      glyph: '𓎲𓏏𓇯'
    },
    textualSources: [
      { source: 'Pyramid Texts', spells: [213, 217, 219'], description: 'Sobek as creator' },
      { source: 'Coffin Texts', spells: [75, 80'], description: 'Sobek\'s power and fertility' }
    ],
    theologicalFramework: {
      period: 'Nile Fertility & Creator Theology',
      concept: 'Crocodile represents dangerous yet generative Nile power',
      role: 'Crocodile god, Creator god, Guardian of Nile',
      cosmoGonicRole: 'Primordial waters and fertility cycles'
    }
  },

  'montu': {
    dynasticPeriods: [
      { period: 'Middle Kingdom', dynasties: '11-13', dateRange: '2055-1650 BCE', significance: 'War god of Thebes rise' },
      { period: 'New Kingdom', dynasties: '18-20', dateRange: '1550-1070 BCE', significance: 'Imperial war god during military expansion' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Declining prominence as Amun-Ra ascendant' }
    ],
    templeLocations: [
      { name: 'Montu Temple Armant', location: 'Upper Egypt', region: 'Upper Egypt', description: 'Primary cult center' },
      { name: 'Karnak Temple (Montu Sanctuary)', location: 'Thebes', region: 'Upper Egypt', description: 'War god aspect' }
    ],
    hieroglyphicName: {
      translit: 'Mnt',
      meaning: 'Possibly "to circle" (sky/battle)',
      glyph: '𓌀𓏏𓇯'
    },
    textualSources: [
      { source: 'Coffin Texts', spells: [75, 148'], description: 'Montu as warrior deity' },
      { source: 'New Kingdom military inscriptions', reference: 'Battle records', description: 'Invocations for military victory' }
    ],
    theologicalFramework: {
      period: 'War & Celestial Combat Theology',
      concept: 'War god assisting pharaoh in cosmic and earthly battles',
      role: 'God of war, Warrior falcon, Protector of pharaoh',
      cosmoGonicRole: 'Divine warrior in cosmic struggles'
    }
  },

  'imhotep': {
    dynasticPeriods: [
      { period: 'Old Kingdom', dynasties: '3', dateRange: '2670-2650 BCE', significance: 'Historical architect deified' },
      { period: 'Late Period', dynasties: '21-26', dateRange: '1070-525 BCE', significance: 'Cult prominence as healing god' },
      { period: 'Ptolemaic Period', dynasties: 'Hellenistic', dateRange: '323-30 BCE', significance: 'Merged with Greek Asclepius' }
    ],
    templeLocations: [
      { name: 'Saqqara Temple', location: 'Memphis region', region: 'Lower Egypt', description: 'Associated with Step Pyramid' },
      { name: 'Philae Temple', location: 'Aswan', region: 'Upper Egypt', description: 'Late period expansion' }
    ],
    hieroglyphicName: {
      translit: 'Imḥtp',
      meaning: '"He who comes in peace" - Divine Architect',
      glyph: '𓊖𓏏𓇯'
    },
    textualSources: [
      { source: 'Saqqara inscriptions', reference: 'Pyramid texts and dedications', description: 'Historical architect records' },
      { source: 'Healing papyri', reference: 'Medical texts', description: 'Imhotep as healing authority' },
      { source: 'Late period dedications', reference: 'Votive texts', description: 'Worship as healing god' }
    ],
    theologicalFramework: {
      period: 'Deification of Historical Figure Theology',
      concept: 'Exceptional mortals can achieve divinity through works and wisdom',
      role: 'God of medicine, Healing, Wisdom, Architecture',
      cosmoGonicRole: 'Human excellence achieving divine status'
    },
    uniqueStatus: {
      historical_basis: 'Only major Egyptian god based on actual historical person',
      architect: 'Designed Step Pyramid of Djoser (first stone structure)',
      deification: 'Elevated to god status long after death (millennium later)'
    }
  }
};

// Function to enrich a single deity file
function enrichDeityFile(filePath, deityId, metadata) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    let deityData = JSON.parse(content);

    // Add or update historical metadata
    if (!deityData.historicalContext) {
      deityData.historicalContext = {};
    }

    deityData.historicalContext.dynasticPeriods = metadata.dynasticPeriods || [];
    deityData.historicalContext.templeLocations = metadata.templeLocations || [];

    if (metadata.hieroglyphicName) {
      deityData.hieroglyphicName = metadata.hieroglyphicName;
    }

    if (metadata.textualSources) {
      deityData.ancientTexts = metadata.textualSources;
    }

    if (metadata.syncretismWith) {
      deityData.syncretism = {
        syncretizedDeities: metadata.syncretismWith,
        framework: metadata.theologicalFramework
      };
    }

    if (metadata.priestlyOrders) {
      deityData.priestlyTradition = {
        orders: metadata.priestlyOrders,
        majorFestivals: metadata.majorFestivals || []
      };
    }

    if (metadata.theologicalFramework) {
      deityData.theology = metadata.theologicalFramework;
    }

    // Add dynasty-specific evolution
    if (metadata.dynasticEvolution) {
      deityData.historicalEvolution = metadata.dynasticEvolution;
    }

    // Add special attributes if present
    if (metadata.magicalSignificance) {
      deityData.magicalPowers = metadata.magicalSignificance;
    }
    if (metadata.cosmicRole) {
      deityData.cosmicRole = metadata.cosmicRole;
    }
    if (metadata.royalSignificance) {
      deityData.royalSignificance = metadata.royalSignificance;
    }
    if (metadata.mortaryAspect) {
      deityData.mortaryAspect = metadata.mortaryAspect;
    }
    if (metadata.dualNature) {
      deityData.dualNature = metadata.dualNature;
    }
    if (metadata.domestication) {
      deityData.culturalSignificance = metadata.culturalSignificance;
    }
    if (metadata.underwordAspect) {
      deityData.underworld = metadata.underwordAspect;
    }
    if (metadata.creativeAspect) {
      deityData.creativeAspect = metadata.creativeAspect;
    }

    // Add metadata about enrichment
    if (!deityData.metadata) {
      deityData.metadata = {};
    }
    deityData.metadata.enrichedWith = 'egyptian-historical-analysis';
    deityData.metadata.enrichedAt = new Date().toISOString();

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(deityData, null, 2), 'utf8');
    console.log(`✓ Enriched: ${deityId}`);
    return true;

  } catch (error) {
    console.error(`✗ Error enriching ${deityId}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const deityDir = path.join(__dirname, '../firebase-assets-downloaded/deities');
  let successCount = 0;
  let errorCount = 0;

  console.log('=== Egyptian Mythology Historical Enrichment ===\n');
  console.log(`Processing ${Object.keys(egyptianDeityMetadata).length} deities...\n`);

  // Process each deity in metadata
  for (const [deityId, metadata] of Object.entries(egyptianDeityMetadata)) {
    const filePath = path.join(deityDir, `${deityId}.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`✗ File not found: ${filePath}`);
      errorCount++;
      continue;
    }

    // Enrich the file
    if (enrichDeityFile(filePath, deityId, metadata)) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n=== Results ===');
  console.log(`Successfully enriched: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nEnrichment metadata added:`);
  console.log('- Dynastic periods and evolution');
  console.log('- Temple locations and cult centers');
  console.log('- Hieroglyphic names and meanings');
  console.log('- Ancient textual sources and references');
  console.log('- Syncretism and theological frameworks');
  console.log('- Priestly orders and major festivals');
  console.log('- Special attributes and cosmic roles');
}

// Run the script
main();

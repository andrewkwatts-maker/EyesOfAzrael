#!/usr/bin/env node

/**
 * Greek Mythology Historical Enrichment Script
 *
 * This script enriches Greek mythology entities with comprehensive historical context:
 * - Historical periods of worship and transformation
 * - Primary ancient sources
 * - Archaeological evidence and findings
 * - Historiographic evolution of understanding
 *
 * Run: node scripts/enrich-greek-mythology-historical.js
 */

const fs = require('fs');
const path = require('path');

// Historical enrichment data for Greek deities and mythological entities
const GREEK_HISTORICAL_DATA = {
  'greek_deity_zeus': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean Period',
        dates: '1600-1100 BCE',
        description: 'Worship of sky god Dyeus (Proto-Indo-European), evidenced in Linear B tablets mentioning "di-we" (Zeus). Early form associated with weather phenomena and kingly authority in Mycenaean palaces.',
        sources: ['Linear B tablets from Knossos and Pylos']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Zeus cult crystallizes with Homeric epics. Becomes supreme deity of Olympian pantheon. Establishment of major sanctuaries at Olympia (Olympic Games) and Dodona.',
        sources: ['Homer\'s Iliad and Odyssey', 'Hesiod\'s Theogony']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Peak of Zeus veneration. Multiple cult sites active (Olympia, Dodona, Delphi). Integration with political authority in democratic Athens and Sparta. Philosophical reinterpretations begin.',
        sources: ['Aeschylus\' Oresteia', 'Sophocles\' plays', 'Plato\'s dialogues']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Syncretism with Near Eastern deities. Zeus Ammon fusion in Egypt. Continued philosophical discourse on Zeus as cosmic principle. Decline in traditional sacrificial practices.',
        sources: ['Ptolemaic Egyptian records', 'Hellenistic philosophical texts']
      },
      {
        name: 'Roman Period',
        dates: '31 BCE - 4th century CE',
        description: 'Identification with Jupiter. Continued worship in Greek-speaking regions. Integration into Roman state religion. Philosophical interpretations emphasize universal principle.',
        sources: ['Ovid\'s Metamorphoses', 'Pausanias\' Description of Greece']
      }
    ],
    primarySources: [
      {
        work: 'Linear B Tablets',
        author: 'Unknown (Mycenaean scribes)',
        period: '14th-13th century BCE',
        significance: 'Earliest written evidence of Zeus worship, mentions di-we (Zeus) as receiving offerings'
      },
      {
        work: 'Theogony',
        author: 'Hesiod',
        period: '8th century BCE',
        significance: 'Genealogy of gods and Zeus\' rise to power after defeating Titans'
      },
      {
        work: 'Iliad',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Zeus as king of gods, detailed scenes of sacrifices and divine politics'
      },
      {
        work: 'Odyssey',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Zeus as upholder of cosmic justice, protector of guests and suppliants'
      },
      {
        work: 'Oresteia',
        author: 'Aeschylus',
        period: '5th century BCE',
        significance: 'Philosophical exploration of Zeus as embodiment of justice and necessity'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Olympia Sanctuary',
        location: 'Elis, Greece',
        finds: 'Massive temple (5th century BCE), chryselephantine statue by Phidias, votive offerings, sacrificial remains',
        significance: 'Most important sanctuary; Olympic Games held every 4 years for nearly 1000 years'
      },
      {
        site: 'Dodona Sanctuary',
        location: 'Epirus, Greece',
        finds: 'Oracle site with lead tablets containing questions to Zeus, temple remains, votive deposits',
        significance: 'One of oldest Greek oracles; famous for oak tree rustling interpreted as Zeus\' voice'
      },
      {
        site: 'Knossos Palace',
        location: 'Crete, Greece',
        finds: 'Linear B tablets mentioning di-we, religious frescoes, offering tables',
        significance: 'Evidence of Mycenaean worship practices and proto-Zeus cult'
      },
      {
        site: 'Akrotiri',
        location: 'Santorini, Greece',
        finds: 'Thera eruption deposits (1600 BCE), religious frescoes showing ritual practices',
        significance: 'Glimpses into Bronze Age religious practices contemporary with early Zeus worship'
      }
    ],
    historiographicNotes: [
      'Early 20th century: Scholars emphasized Greek rationalism and saw mythology as primitive cosmology that rational philosophy overcome',
      'Mid-20th century: Discovery and decipherment of Linear B (1952) showed Zeus worship in Mycenaean Bronze Age, supporting Indoeuropean migration theory',
      'Late 20th century: Archaeological evidence from Olympia and Dodona revealed complex sacrificial systems and oracle practices; mythological narratives understood as reflecting historical political structures',
      'Contemporary: Scholars recognize syncretism between Indoeuropean sky god tradition and pre-Hellenic Mediterranean fertility/earth god traditions, accounting for Zeus\' complex portfolio',
      'Recent: Analysis of dedicatory inscriptions reveals regional variations in Zeus worship across Greek world; emphasis on lived religion vs. literary tradition'
    ]
  },

  'greek_deity_aphrodite': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'Possible worship of Near Eastern love/fertility goddess Astarte. Evidence unclear; goddess figure appears in Mycenaean frescoes and seal stones, but specific identity uncertain.',
        sources: ['Mycenaean seals', 'Fragmentary references in later sources']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Aphrodite cult emerges with possible syncretism of Greek and Near Eastern (Syrian, Phoenician) elements. Worship particularly strong in Cyprus and coastal regions. Homer describes her in Iliad.',
        sources: ['Homer\'s Iliad', 'Hesiod\'s Theogony', 'Homeric Hymn to Aphrodite']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Established cult sites in Athens, Corinth, and throughout Mediterranean. Specialized functions: protector of sailors, patron of prostitutes, goddess of marriage. Philosophical questions about love vs. lust.',
        sources: ['Plato\'s Symposium', 'Greek dramatic works', 'Inscriptional evidence']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Continued importance; fusion with Egyptian Hathor and other love goddesses in cosmopolitan centers. Philosophical reinterpretations as cosmic principle of attraction.',
        sources: ['Hellenistic poetry', 'Egyptian temple records']
      },
      {
        name: 'Roman Period',
        dates: '31 BCE - 4th century CE',
        description: 'Identification with Venus. Jupiter\'s mother in Aeneid narrative. Elevated status in Roman state religion; associated with Roman imperial family ancestry.'
      }
    ],
    primarySources: [
      {
        work: 'Theogony',
        author: 'Hesiod',
        period: '8th century BCE',
        significance: 'Birth story: sprung from sea foam after Cronos\' castration; represents alternative version of divine succession'
      },
      {
        work: 'Homeric Hymn to Aphrodite',
        author: 'Unknown',
        period: '7th century BCE',
        significance: 'Detailed narrative of Aphrodite seducing Trojan prince Anchises; reveals her power over gods and mortals'
      },
      {
        work: 'Iliad Book 5, Book 14',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Scenes of Aphrodite in Trojan War, her relationship to other deities, her dual nature'
      },
      {
        work: 'Symposium',
        author: 'Plato',
        period: '4th century BCE',
        significance: 'Philosophical dialogue distinguishing heavenly Aphrodite (pure love) from common Aphrodite (base desire)'
      },
      {
        work: 'Aeneid Book 1',
        author: 'Virgil',
        period: '1st century BCE',
        significance: 'Roman adaptation: Venus as ancestor of Roman people through Aeneas'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Sanctuary of Aphrodite, Paphos',
        location: 'Cyprus',
        finds: 'Temple remains (12th-11th century BCE continuous worship), votive figurines, inscriptions',
        significance: 'Major sanctuary; evidence suggests Mycenaean continuity with Near Eastern goddess worship'
      },
      {
        site: 'Sanctuary of Aphrodite, Athens',
        location: 'Slopes of Acropolis',
        finds: 'Temple remains, dedicatory reliefs, votive deposits from Classical period',
        significance: 'Urban cult site showing integration into Athenian civic religion'
      },
      {
        site: 'Corinth Sanctuary',
        location: 'Ancient Corinth, Greece',
        finds: 'Temple of Aphrodite (7th century BCE), commercial votive artifacts, evidence of sacred prostitution economics',
        significance: 'Demonstrates economic significance of Aphrodite cult in trade city'
      },
      {
        site: 'Cesnola Collection Artifacts',
        location: 'Cyprus',
        finds: 'Bronze and terracotta figurines dated to Late Bronze Age showing goddess imagery',
        significance: 'Shows continuity of female deity worship from Mycenaean period through Classical era'
      }
    ],
    historiographicNotes: [
      '19th-20th century: Scholars viewed Aphrodite as "primitive" fertility goddess, emphasizing sacred prostitution aspect',
      'Mid-20th century: Discovery of Cypriot sanctuary evidence suggested Near Eastern syncretism (Astarte/Inanna); feminist scholars began reexamining sexual aspects of worship',
      'Late 20th century: Papyri evidence and inscriptions revealed complex theological frameworks; Platonic distinctions between heavenly and common Aphrodite had historical impact',
      'Contemporary: Scholars emphasize syncretism of Mediterranean traditions; economic analysis of temple institutions; gender studies examining priestess roles and sacred sexuality',
      'Recent: DNA analysis and settlement patterns suggest Cypriot sanctuary continuous worship from LBA through historical periods; rethinking of "syncretism" as dynamic exchange rather than one-way influence'
    ]
  },

  'greek_deity_apollo': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'Apollo appears in Linear B tablets as pa-ja-wo (Paean). Young warrior god associated with plague arrows and healing. Possibly influenced by or syncretic with Anatolian sun god Apaliuna.',
        sources: ['Linear B tablets', 'Hittite records']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Apollo cult expands dramatically. Conquest of Delphi oracle from earlier chthonic goddess tradition. Establishment as god of prophecy, music, and healing. Homeric Hymn to Apollo describes temple at Delphi.',
        sources: ['Homer\'s epics', 'Homeric Hymn to Apollo', 'Hesiod\'s Theogony']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Delphi becomes pan-Hellenic religious authority. Apollo as embodiment of Greek civilization and Apollonian rationalism vs. Dionysian chaos. Major role in Delphic oracle influencing political decisions.',
        sources: ['Tragedia plays', 'Philosophical texts', 'Historical accounts']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Syncretism with Egyptian Horus and other sun deities. Continued philosophical importance. Oracle gradually loses political influence but maintains cultural prestige.',
        sources: ['Hellenistic texts', 'Egyptian syncretism records']
      },
      {
        name: 'Roman Period',
        dates: '31 BCE - 4th century CE',
        description: 'One of few Greek gods adopted directly by Romans without new name. Associated with Augustus as patron. Oracle continues functioning; eventually suppressed by Christian authorities.'
      }
    ],
    primarySources: [
      {
        work: 'Homeric Hymn to Apollo',
        author: 'Unknown',
        period: '7th century BCE',
        significance: 'Detailed narrative of Apollo\'s birth and founding of Delphi sanctuary; describes slaying of serpent Python'
      },
      {
        work: 'Iliad',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Apollo as archer god, plague bringer, and healer; his role in Trojan War from divine perspective'
      },
      {
        work: 'Pythian Odes',
        author: 'Pindar',
        period: '5th century BCE',
        significance: 'Praise of Apollo; celebration of Pythian Games dedicated to god; theological interpretations'
      },
      {
        work: 'Ion',
        author: 'Euripides',
        period: '4th century BCE',
        significance: 'Dramatic exploration of Apollo\'s justice and his relationship to humankind'
      },
      {
        work: 'Pausanias\' Description of Greece',
        author: 'Pausanias',
        period: '2nd century CE',
        significance: 'Detailed descriptions of Apollo temples and archaeological remains visible to ancient travelers'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Delphi Sanctuary',
        location: 'Mount Parnassus, Greece',
        finds: 'Temple of Apollo (4th century BCE), Treasury structures, oracle chamber (adyton), thousands of votive offerings',
        significance: 'Premier sanctuary; archaeological layers show religious continuity from Mycenaean period; oracle chamber reveals geological features (ethylene emissions?) that may explain prophetic experiences'
      },
      {
        site: 'Abae Sanctuary',
        location: 'Phocis, Greece',
        finds: 'Temple remains (7th-5th century BCE), dedicatory inscriptions, votive deposits',
        significance: 'Regional cult center; demonstrates network of Apollo sanctuaries across Greece'
      },
      {
        site: 'Delos Sanctuary',
        location: 'Aegean island',
        finds: 'Temple remains claiming to be Apollo\'s birthplace, treasury, votive objects from archaic period onward',
        significance: 'Important maritime trade sanctuary; evidence of international religious commerce'
      },
      {
        site: 'Temple of Apollo at Corinth',
        location: 'Ancient Corinth',
        finds: '7th century BCE Doric temple structure, dedicatory reliefs, sanctuary complex',
        significance: 'One of oldest Greek temple structures; demonstrates Apollo\'s importance in early polis religion'
      },
      {
        site: 'Kalapodi Sanctuary',
        location: 'Central Greece',
        finds: 'Continuous occupation from Mycenaean period (1400 BCE) through Classical era; multiple temple phases, thousands of votives',
        significance: 'Unique evidence of unbroken worship tradition of Apollonic figure from Bronze Age through Classical periods'
      }
    ],
    historiographicNotes: [
      '19th century: Scholars saw Apollo as Indo-European sun god superimposed on earlier chthonic oracle tradition at Delphi',
      'Early 20th century: Nietzsche\'s Apollonian/Dionysian distinction became influential framework for understanding Greek culture',
      'Mid-20th century: Linear B decipherment revealed pa-ja-wo in Mycenaean period; archaeological work at Delphi showed religious continuity from early Bronze Age',
      'Late 20th century: Geological/chemical analysis of Delphi proposed ethylene gas emissions as explanation for oracle\'s prophetic states; inscriptional evidence revealed Apollo\'s multi-faceted nature beyond solar associations',
      'Contemporary: Reinterpretation of syncretism with Anatolian deities; emphasis on Apollo\'s role in maintaining cosmological order (cosmic harmony); recent scholarship connects oracle practices to contemporary medical knowledge'
    ]
  },

  'greek_deity_athena': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'a-ta-na appears in Linear B as goddess. Possibly warrior maiden form inherited from pre-Hellenic or Indoeuropean traditions. Evidence of worship at palace sites.',
        sources: ['Linear B tablets from Knossos and Pylos']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Athena emerges as wisdom goddess with warrior aspects. Homeric Hymn describes her birth from Zeus\' head. Becomes patron of Athens; integration into civic religion.',
        sources: ['Homer\'s Iliad and Odyssey', 'Homeric Hymn to Athena']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Athena becomes central to Athenian identity after Persian Wars. Parthenon construction (447-432 BCE) makes her primary patron. Chryselephantine statue symbolizes Athenian cultural and military power.',
        sources: ['Athenian inscriptions', 'Plutarch\'s Life of Pericles', 'Pausanias']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Continued veneration; some syncretism with Egyptian Neith. Philosophical interpretations emphasize wisdom and cosmic intelligence.',
        sources: ['Hellenistic philosophical texts']
      }
    ],
    primarySources: [
      {
        work: 'Theogony',
        author: 'Hesiod',
        period: '8th century BCE',
        significance: 'First literary account of Athena\'s birth from Zeus\' head, establishing her as embodiment of divine wisdom'
      },
      {
        work: 'Iliad',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Detailed scenes of Athena as warrior goddess, counselor, and protector; her relationship with Achilles and Diomedes'
      },
      {
        work: 'Odyssey',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Athena as Odysseus\' divine patron throughout his trials; emphasizes wisdom and craft mastery'
      },
      {
        work: 'Oresteia',
        author: 'Aeschylus',
        period: '5th century BCE',
        significance: 'Athena\'s judgment of Orestes; establishment of legal justice system; civic governance'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Parthenon',
        location: 'Athenian Acropolis',
        finds: 'Iconic temple (447-432 BCE), sculptural remains, foundation deposits, chryselephantine statue base',
        significance: 'Monument expressing Athenian democratic power and Athena\'s role as patron goddess; architectural refinements influenced Western civilization'
      },
      {
        site: 'Erechtheion Temple',
        location: 'Athenian Acropolis',
        finds: 'Complex temple with archaic olive tree reference, Athena Nike shrine, votive deposits',
        significance: 'Houses older cult objects; demonstrates Athena\'s integration with Mycenaean religion through claimed connection to Erechtheus'
      },
      {
        site: 'Linear B deposits at Pylos',
        location: 'Messenia, Greece',
        finds: 'Tablets mentioning a-ta-na with offerings; religious frescoes',
        significance: 'Evidence of Bronze Age worship predating Classical Athenian dominance'
      },
      {
        site: 'Various sanctuary deposits',
        location: 'Throughout Greece',
        finds: 'Votive loom weights, spindle whorls, crafting tools dedicated to Athena',
        significance: 'Archaeological evidence of Athena\'s role as patroness of weaving and crafts across Greek world'
      }
    ],
    historiographicNotes: [
      '19th century: Scholars viewed Athena as purely Indo-European warrior goddess, dismissing craft/wisdom aspects as secondary',
      'Early 20th century: Mycenaean civilization\'s discovery created debate about Mycenaean vs. later layers in Athena mythology',
      'Mid-20th century: Linear B decipherment revealed a-ta-na in Bronze Age; debate intensified over Indoeuropean vs. Mediterranean substrate elements',
      'Late 20th century: Archaeological evidence from Acropolis and Erechtheion revealed religious continuity from LBA through Classical period; emphasis on Athena\'s multiple, non-contradictory roles',
      'Contemporary: Scholars examine Athena\'s unique position as virgin warrior-goddess; reinterpretation of gender and power relationships; analysis of Parthenon sculptures as embodying democratic values'
    ]
  },

  'greek_deity_hades': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'Hades (Zeus of the underworld) possibly appears in Linear B as underworld god. Chthonic deities worshipped in Mycenaean religion; specific identity of Hades in this period debated.',
        sources: ['Linear B tablets', 'Fragmentary evidence']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Hades emerges as lord of the dead. Homeric epics establish his role. Cult worship limited compared to other Olympians; often called by euphemisms (Pluto, Dis). Mystery religions at Eleusis incorporate Hades lore.',
        sources: ['Homer\'s Odyssey', 'Homeric Hymn to Demeter', 'Hesiod']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Hades central to Eleusinian Mysteries. Hades and Persephone cult reaches peak importance in religious and philosophical thought. Philosophical interpretations explore justice in afterlife.',
        sources: ['Plato\'s Republic and Phaedo', 'Athenian inscriptions', 'Pausanias']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Continued importance in mystery religions; syncretism with Egyptian Osiris. Philosophical speculation on underworld ethics.',
        sources: ['Hellenistic philosophical texts']
      }
    ],
    primarySources: [
      {
        work: 'Homeric Hymn to Demeter',
        author: 'Unknown',
        period: '7th century BCE',
        significance: 'Narrative of Hades abducting Persephone; establishment of seasonal cycle; foundation myth for Eleusinian Mysteries'
      },
      {
        work: 'Odyssey Book 10-11',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Odysseus\' nekuia (descent to underworld); detailed descriptions of Hades\' realm and inhabitants'
      },
      {
        work: 'Theogony',
        author: 'Hesiod',
        period: '8th century BCE',
        significance: 'Genealogy placing Hades as Zeus\' brother; his role in cosmic division of domains'
      },
      {
        work: 'Republic Book 10',
        author: 'Plato',
        period: '4th century BCE',
        significance: 'Myth of Er describing underworld justice systems and Hades\' role in human moral accountability'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Sanctuary at Eleusis',
        location: 'Attica, Greece',
        finds: 'Telesterion (initiation hall) remains, votive deposits, inscriptional evidence of mystery rites',
        significance: 'Premier mystery religion sanctuary; Hades and Persephone central to rites; continuous worship from Mycenaean period through Roman era'
      },
      {
        site: 'Nekromanteion (Oracle of the Dead)',
        location: 'Ephyra, Greece',
        finds: 'Underground structures, copper vessels, ritual deposits, inscriptional evidence',
        significance: 'Archaeological evidence of necromantic practices; Hades\' role as mediator between living and dead'
      },
      {
        site: 'Antheia Sanctuary',
        location: 'Achaia',
        finds: 'Hermes and Hades joint shrine remains, votive offerings, Roman period modifications',
        significance: 'Regional cult demonstrating Hades worship patterns outside major centers'
      },
      {
        site: 'Various grave goods deposits',
        location: 'Throughout Greece',
        finds: 'Charon coins, funerary vessels, underworld imagery, votive plaques',
        significance: 'Widespread evidence of Hades cult in funerary context; beliefs about underworld journey'
      }
    ],
    historiographicNotes: [
      '19th century: Scholars saw Hades worship as "primitive death cult," less civilized than Olympian religion',
      'Early 20th century: Discovery of Eleusis sanctuary remains elevated understanding of mystery religion importance to Greek civilization',
      'Mid-20th century: Detailed excavation of Eleusis and Nekromanteion revealed complex philosophical and ritual systems; reassessment of Hades\' central role',
      'Late 20th century: Linear B evidence suggested Bronze Age underworld god traditions; analysis of Homeric descriptions vs. Orphic traditions revealed evolution of beliefs',
      'Contemporary: Scholars examine underworld beliefs\' relationship to social order and justice systems; interdisciplinary approaches combining archaeology, philology, and theology'
    ]
  },

  'greek_deity_poseidon': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'Po-se-da-o appears in Linear B as major deity, possibly originally earth-shaker earthquake god. Worship at palace sites; warrior god associations suggest Indo-European origin.',
        sources: ['Linear B tablets', 'Mycenaean inscriptions']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Poseidon transitions to sea god in Classical tradition. Homeric epics emphasize maritime aspects. Worship becomes important in maritime communities and naval powers.',
        sources: ['Homer\'s Odyssey', 'Homeric Hymn to Poseidon', 'Hesiod']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Poseidon\'s cult expands with Athenian naval dominance. Temples at coastal sites proliferate. Hippocampal (horse) cult aspects continue. Earthquake phenomena attributed to Poseidon.',
        sources: ['Athenian inscriptions', 'Plutarch', 'Pausanias']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Continued importance for maritime trade. Syncretism with Near Eastern sea deities.'
      }
    ],
    primarySources: [
      {
        work: 'Odyssey Books 1, 5, 13',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Poseidon\'s anger at Odysseus; detailed descriptions of sea god\'s power over maritime events'
      },
      {
        work: 'Homeric Hymn to Poseidon',
        author: 'Unknown',
        period: '7th century BCE',
        significance: 'Poseidon as earth-shaker, sea god, and horse-raiser; cosmic significance'
      },
      {
        work: 'Theogony',
        author: 'Hesiod',
        period: '8th century BCE',
        significance: 'Poseidon as Zeus\' brother; division of cosmic domains; genealogies of sea beings'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Sanctuary at Cape Sunium',
        location: 'Attica, Greece',
        finds: 'Temple of Poseidon (5th century BCE), votive deposits, maritime context',
        significance: 'Prominent coastal sanctuary; position at strategic maritime location'
      },
      {
        site: 'Isthmia Sanctuary',
        location: 'Corinth area',
        finds: 'Temple remains, Isthmian Games venue, votive offerings',
        significance: 'Pan-Hellenic religious site demonstrating Poseidon\'s civic importance'
      },
      {
        site: 'Linear B deposits',
        location: 'Pylos',
        finds: 'Tablets mentioning po-se-da-o with offerings, palace religious context',
        significance: 'Evidence of high status Mycenaean deity, originally non-maritime function suggested'
      }
    ],
    historiographicNotes: [
      '19th century: Linear B still undeciphered; scholars developed sea-god mythology theories',
      'Mid-20th century: Linear B decipherment revealed po-se-da-o as Mycenaean deity; debate over original function (earthquake god vs. water deity)',
      'Late 20th century: Archaeological evidence suggested Poseidon as warrior earth-shaker in Bronze Age, transformed into sea god in Classical Greek tradition',
      'Contemporary: Scholars examine syncretism and functional evolution of deities; Poseidon\'s role in connecting underworld, earth, and sea in cosmological systems'
    ]
  },

  'greek_deity_demeter': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'Possible worship of grain/fertility goddess in Mycenaean religion, though specific identification with Demeter unclear. Chthonic earth goddess traditions evident.',
        sources: ['Fragmentary Linear B references', 'Archaeological evidence']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Demeter emerges as grain goddess and mother figure. Homeric Hymn to Demeter establishes Eleusinian Mysteries mythology. Cult spreads throughout Mediterranean.',
        sources: ['Homeric Hymn to Demeter', 'Hesiod', 'Inscriptions']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Eleusinian Mysteries reach peak significance. Demeter\'s cult among most important in Greek world; emphasized agricultural prosperity, seasonal cycles, and afterlife assurances.',
        sources: ['Inscriptions at Eleusis', 'Athenian records', 'Pausanias']
      },
      {
        name: 'Hellenistic Period',
        dates: '323-31 BCE',
        description: 'Syncretism with Egyptian Isis and grain deities. Continued importance in agricultural societies.'
      }
    ],
    primarySources: [
      {
        work: 'Homeric Hymn to Demeter',
        author: 'Unknown',
        period: '7th century BCE',
        significance: 'Core mythology of Persephone\'s abduction and seasonal return; establishment of Eleusinian rites; explains grain cultivation and seasonal cycles'
      },
      {
        work: 'Theogony',
        author: 'Hesiod',
        period: '8th century BCE',
        significance: 'Demeter\'s genealogy; role in cosmic order'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Sanctuary at Eleusis',
        location: 'Attica, Greece',
        finds: 'Telesterion hall, treasury, temple remains, thousands of votive deposits, initiatory inscriptions',
        significance: 'Foremost Demeter sanctuary; evidence of continuous religious practice from Mycenaean period through Late Antiquity'
      },
      {
        site: 'Kore sanctuary deposits',
        location: 'Throughout Greek world',
        finds: 'Terracotta figurines of Kore (Persephone), grain imagery, votive plaques',
        significance: 'Widespread evidence of Demeter-Kore cult popularity among women and agricultural communities'
      }
    ],
    historiographicNotes: [
      '19th century: Demeter understood as primitive fertility goddess myth',
      'Early 20th century: Discovery of Eleusis sanctuary complex revealed sophisticated mystery religion theology',
      'Mid-20th century: Excavations of Telesterion revealed initiation practices; scholarly debate over psychological and spiritual dimensions of mysteries',
      'Late 20th century: Analysis of Homeric Hymn reveals theological sophistication; Demeter understood as embodying maternal power and death-rebirth cycles',
      'Contemporary: Feminist scholarship examines female-centered cult; environmental historians study relationship between grain agriculture and religious practice'
    ]
  },

  'greek_deity_hermes': {
    historicalPeriods: [
      {
        name: 'Bronze Age / Mycenaean',
        dates: '1600-1100 BCE',
        description: 'Possible proto-form as boundary-marker and messenger figure. Limited evidence of specific Mycenaean worship; Hermes may have emerged later than other Olympians.',
        sources: ['Fragmentary references', 'Archaeological hints']
      },
      {
        name: 'Archaic Period',
        dates: '800-480 BCE',
        description: 'Hermes emerges as god of boundaries, travelers, merchants, and thieves. Homeric Hymn depicts him as trickster. Pillars (herms) mark property boundaries; worship spreads throughout Greece.',
        sources: ['Homeric Hymn to Hermes', 'Homer\'s epics', 'Hesiod']
      },
      {
        name: 'Classical Period',
        dates: '480-323 BCE',
        description: 'Hermes becomes essential to Athenian democracy (herald of assemblies) and commerce (patron of merchants). Herm statues ubiquitous in public spaces. Psychopomp role emphasized.',
        sources: ['Athenian inscriptions', 'Aristophanes', 'Pausanias']
      }
    ],
    primarySources: [
      {
        work: 'Homeric Hymn to Hermes',
        author: 'Unknown',
        period: '6th century BCE',
        significance: 'Detailed birth narrative; theft of Apollo\'s cattle; invention of lyre; establishes Hermes as divine trickster'
      },
      {
        work: 'Iliad',
        author: 'Homer',
        period: '8th century BCE',
        significance: 'Hermes as messenger god, guide, and divine herald'
      }
    ],
    archaeologicalEvidence: [
      {
        site: 'Herms throughout Athens',
        location: 'Attica',
        finds: 'Limestone and marble pillar statues with Hermes head, genitalia, often defaced in 5th century BCE',
        significance: 'Famous mutilation of herms in 415 BCE (Hermocopidae incident) documented historically; thousands of herms indicate ubiquitous worship'
      },
      {
        site: 'Various sanctuary sites',
        location: 'Boundary locations, market areas',
        finds: 'Herm bases, dedicatory inscriptions, votive offerings',
        significance: 'Evidence of Hermes\' role in protecting boundaries and commercial transactions'
      }
    ],
    historiographicNotes: [
      '19th century: Hermes viewed as "trickster god" figure, primitive communication deity',
      'Early-mid 20th century: Herms understood as apotropaic (protective) objects; psychological interpretations of Hermes as mediator figure',
      'Late 20th century: Analysis of herms and boundary marking in social/political context; Hermes as embodying liminality and transition',
      'Contemporary: Scholars examine Hermes\' role in democracy, commerce, and communication; interdisciplinary approaches combining archaeology with social history'
    ]
  }
};

// Helper function to read JSON file
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Helper function to write JSON file
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

// Main enrichment function
function enrichGreekMythology() {
  const deityDir = path.join(__dirname, '../firebase-assets-downloaded/deities');

  let enrichedCount = 0;
  let errorCount = 0;

  console.log('\nGreek Mythology Historical Enrichment Script');
  console.log('='.repeat(60));
  console.log(`Enriching entities in: ${deityDir}\n`);

  // Process each deity with historical data
  for (const [entityId, historicalData] of Object.entries(GREEK_HISTORICAL_DATA)) {
    const filePath = path.join(deityDir, `${entityId}.json`);

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      errorCount++;
      continue;
    }

    const entity = readJSON(filePath);
    if (!entity) {
      errorCount++;
      continue;
    }

    // Add historical enrichment to entity
    if (!entity.historical) {
      entity.historical = {};
    }

    entity.historical.periods = historicalData.historicalPeriods;
    entity.historical.primarySources = historicalData.primarySources;
    entity.historical.archaeologicalEvidence = historicalData.archaeologicalEvidence;
    entity.historical.historiographicNotes = historicalData.historiographicNotes;

    // Update metadata
    if (!entity.metadata) {
      entity.metadata = {};
    }
    entity.metadata.historicalEnrichment = {
      enrichedAt: new Date().toISOString(),
      enrichedBy: 'enrich-greek-mythology-historical-script',
      enrichmentVersion: '1.0'
    };

    // Write back to file
    if (writeJSON(filePath, entity)) {
      console.log(`✓ Enriched: ${entityId}`);
      enrichedCount++;
    } else {
      errorCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Enrichment Summary:`);
  console.log(`  Enriched: ${enrichedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${enrichedCount + errorCount}`);
  console.log(`\nEnrichment fields added:`);
  console.log(`  - historical.periods: Time periods of worship and worship transformation`);
  console.log(`  - historical.primarySources: Ancient texts mentioning the entity`);
  console.log(`  - historical.archaeologicalEvidence: Known artifacts and sites`);
  console.log(`  - historical.historiographicNotes: Evolution of scholarly understanding`);
  console.log(`\nMetadata tracking:`);
  console.log(`  - metadata.historicalEnrichment.enrichedAt: Timestamp of enrichment`);
  console.log(`  - metadata.historicalEnrichment.enrichedBy: Script identifier`);
  console.log(`  - metadata.historicalEnrichment.enrichmentVersion: Version number\n`);
}

// Run enrichment
enrichGreekMythology();

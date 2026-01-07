#!/usr/bin/env node
/**
 * Deity Enrichment Script - Christian Scholarly Perspective
 *
 * This script enriches deity entries with:
 * - Scholarly accuracy and primary sources
 * - Historical context and archaeological evidence
 * - Christian engagement (patristic commentary, typological connections)
 * - Comparative religion notes
 */

const fs = require('fs');
const path = require('path');

const DEITIES_DIR = path.join(__dirname, '../firebase-assets-downloaded/deities');

// Christian scholarly enrichment data for various deities
const enrichmentData = {
  // GREEK DEITIES
  'greek_deity_zeus': {
    christianEngagement: {
      apostolicEncounter: {
        description: "Paul's address at the Areopagus (Acts 17:22-34) represents the pivotal Christian engagement with Greek religion. Standing before the altar to the 'Unknown God,' Paul proclaimed that the Creator whom the Athenians worshipped in ignorance was the God revealed in Christ. He quoted the Greek poets Epimenides ('in him we live and move and have our being') and Aratus ('we are his offspring'), using language originally applied to Zeus to point toward the true God.",
        significance: "This encounter established the Christian theological method of finding preparatio evangelica (preparation for the Gospel) within pagan philosophy while critiquing idolatry.",
        scriptureReference: "Acts 17:22-34"
      },
      patristicCommentary: [
        {
          author: "Justin Martyr",
          dates: "c. 100-165 CE",
          work: "First Apology",
          commentary: "Justin argued that Greek philosophers had glimpsed divine truth through the logos spermatikos (seminal word), but their attribution of divine qualities to Zeus represented a demonic distortion."
        },
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement critiqued Zeus worship, noting the contradiction between philosophical conceptions of a supreme deity and mythological accounts of Zeus's immoralities."
        },
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine analyzed Roman religion (including Jupiter/Zeus), arguing that pagan philosophers recognized the absurdity of mythological gods yet maintained civic religion for social order."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Sovereignty",
          observation: "Zeus's role as supreme ruler reflects universal human intuition about divine sovereignty.",
          distinction: "Unlike Zeus who gained power by overthrowing Kronos, the biblical God is eternal and uncreated."
        },
        {
          theme: "Divine Justice",
          observation: "Zeus Xenios (protector of guests) and Zeus Horkios (guardian of oaths) reflect moral intuitions about divine justice also found in Scripture.",
          distinction: "Biblical justice is grounded in God's holy character, not arbitrary divine whim."
        }
      ],
      missionaryContext: {
        lystraIncident: "At Lystra (Acts 14:8-18), Paul and Barnabas were mistaken for Zeus and Hermes after healing a lame man.",
        scriptureReference: "Acts 14:8-18"
      }
    },
    comparativeNotes: {
      indoEuropeanConnections: {
        description: "Zeus derives from Proto-Indo-European *Dyeus (sky), cognate with Sanskrit Dyaus Pita, Latin Jupiter, and Germanic Tiwaz/Tyr.",
        significance: "The wide distribution of sky-father worship supports the biblical teaching that God has not left Himself without witness (Acts 14:17)."
      },
      philosophicalDevelopment: {
        stoicZeus: "Stoic philosophers reinterpreted Zeus as cosmic reason (logos) pervading all reality.",
        platonicCritique: "Plato criticized mythological portrayals of Zeus as unworthy of divinity, anticipating Christian critiques."
      }
    }
  },

  'greek_deity_apollo': {
    christianEngagement: {
      apostolicEncounter: {
        description: "The Delphic Oracle, Apollo's most famous sanctuary, was consulted by countless Greeks seeking divine guidance. When Christianity spread through Greece, Apollo's prophetic role was directly challenged. The oracle's decline coincided with Christianity's rise, with the last recorded response occurring during Julian the Apostate's reign (361-363 CE).",
        significance: "Christian apologists saw the silencing of pagan oracles as evidence of demonic powers being overcome by Christ.",
        historicalNote: "Eusebius records that the Delphic priestess declared 'the oracle has fallen silent' when consulted by Julian."
      },
      patristicCommentary: [
        {
          author: "Eusebius of Caesarea",
          dates: "c. 260-340 CE",
          work: "Praeparatio Evangelica",
          commentary: "Eusebius extensively documented the cessation of oracles, interpreting this as evidence that demonic powers had fled before Christ's victory."
        },
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement acknowledged Apollo's association with light and reason while critiquing the moral failings in his mythology (Daphne, Hyacinthus)."
        },
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine discussed pagan divination practices, including Apollo's oracles, as demonic deception mixed with occasional true predictions to ensnare worshippers."
        }
      ],
      typologicalConnections: [
        {
          theme: "Light and Truth",
          observation: "Apollo as 'Phoebus' (bright one) embodies Greek aspirations toward illumination and truth. This resonates with John 1:9 describing Christ as 'the true light that gives light to everyone.'",
          distinction: "Apollo's light is created and limited; Christ is 'the light of the world' (John 8:12) who is himself uncreated Light."
        },
        {
          theme: "Prophecy and Divine Communication",
          observation: "Apollo's oracular function reflects humanity's desire to know divine will, fulfilled ultimately in Christ who reveals the Father (John 14:9).",
          distinction: "Apollo's prophecies were ambiguous riddles; biblical prophecy is God's clear self-revelation culminating in Christ."
        },
        {
          theme: "Healing",
          observation: "Apollo as 'Paean' (healer) prefigures Christ the Great Physician who heals both body and soul.",
          distinction: "Apollo could send plague as well as healing (Iliad Book 1); Christ's healing is pure grace without capriciousness."
        }
      ]
    },
    comparativeNotes: {
      nearEasternConnections: {
        description: "Apollo's origins may include Anatolian influences (Apaliuna/Appaliunas from Hittite texts). His connection to plague and healing parallels Mesopotamian deities like Nergal.",
        significance: "These connections illustrate the cultural exchange in the ancient Mediterranean that the Gospel would later transcend."
      },
      apollonianDionysian: {
        description: "Nietzsche's contrast between Apollonian (order, reason) and Dionysian (chaos, ecstasy) principles influenced modern understanding of Greek religion.",
        theologicalNote: "Christianity transcends this dichotomy, offering both divine order (logos) and transformative spiritual experience (the Holy Spirit)."
      }
    }
  },

  'greek_deity_athena': {
    christianEngagement: {
      apostolicEncounter: {
        description: "Paul's visit to Athens (Acts 17) occurred in a city dominated by Athena's cult. The Parthenon crowned the Acropolis, and her massive chryselephantine statue by Phidias stood in its inner chamber. Paul's declaration that God 'does not live in temples made by human hands' (Acts 17:24) directly addressed this magnificent temple culture.",
        significance: "The contrast between Athena's localized presence in her temple and the omnipresent God proclaimed by Paul illustrates fundamental theological differences.",
        scriptureReference: "Acts 17:24-25"
      },
      patristicCommentary: [
        {
          author: "Justin Martyr",
          dates: "c. 100-165 CE",
          work: "First Apology",
          commentary: "Justin noted that Athena's birth from Zeus's head was a demonic parody of the Logos proceeding from the Father, designed to confuse the truth."
        },
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement praised Greek appreciation for wisdom (sophia) while arguing that true Wisdom is Christ, the Logos of God (1 Corinthians 1:24)."
        },
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine analyzed the philosophical interpretations of Athena as divine wisdom while noting the absurdity of mythological accounts of her birth and actions."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Wisdom",
          observation: "Athena as goddess of wisdom (sophia) parallels the Hebrew personification of Wisdom in Proverbs 8 and the identification of Christ as 'the wisdom of God' (1 Corinthians 1:24).",
          distinction: "Athena is a created goddess with a birth story; Christ as Wisdom 'was with God in the beginning' (John 1:2) and is himself God."
        },
        {
          theme: "Virgin Goddess",
          observation: "Athena Parthenos (virgin) maintained perpetual virginity, paralleling Mary's virginity in Christian tradition.",
          distinction: "Athena's virginity was self-chosen to maintain independence; Mary's virginity was consecrated to God's purposes in the Incarnation."
        },
        {
          theme: "Protector and Advocate",
          observation: "Athena's role as protector of heroes (Odysseus, Perseus) anticipates Christ as advocate (parakletos) for believers.",
          distinction: "Athena chose favorites capriciously; Christ died for all and advocates for all who come to the Father through him (1 John 2:1)."
        }
      ]
    },
    comparativeNotes: {
      preHellenicOrigins: {
        description: "Linear B tablets show 'a-ta-na' worshipped in Mycenaean times. Her origins may include pre-Greek palace goddess traditions, possibly connected to Minoan snake goddess figures.",
        significance: "The antiquity of Athena worship demonstrates the depth of religious longing that Christianity addressed."
      },
      nearEasternParallels: {
        description: "Athena has been compared to Near Eastern wisdom goddesses (Ishtar's warrior aspect, Egyptian Neith). Her aegis with Gorgon head parallels apotropaic traditions across the Mediterranean.",
        theologicalNote: "These parallels illustrate how different cultures sought divine wisdom and protection, needs ultimately met in Christ."
      }
    }
  },

  'greek_deity_poseidon': {
    christianEngagement: {
      apostolicEncounter: {
        description: "Early Christians in maritime cities throughout the Mediterranean encountered Poseidon worship. Corinth, where Paul spent eighteen months (Acts 18:11), was a major port city with significant Poseidon veneration. The Isthmian Games, held near Corinth in Poseidon's honor, provided Paul with athletic metaphors (1 Corinthians 9:24-27).",
        significance: "Paul's use of Isthmian Games imagery demonstrates the Christian method of engaging cultural contexts while redirecting attention to eternal prizes.",
        scriptureReference: "1 Corinthians 9:24-27"
      },
      patristicCommentary: [
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement critiqued the worship of Poseidon and other nature gods, arguing that worshipping elements of creation rather than the Creator was fundamental idolatry (cf. Romans 1:25)."
        },
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine analyzed Roman Neptune/Poseidon worship as part of his broader critique of paganism's fragmentation of divine attributes among multiple deities."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Power Over Waters",
          observation: "Poseidon's command over seas parallels the biblical God's sovereignty over waters (Genesis 1:2, Psalm 89:9), and Christ's calming of the storm (Mark 4:35-41).",
          distinction: "Poseidon is himself part of the created order, subject to Zeus; the God of Scripture creates and controls all waters as their Maker."
        },
        {
          theme: "Earth-Shaker",
          observation: "Poseidon as 'Ennosigaios' (earth-shaker) reflects ancient recognition of divine power in earthquakes, which Scripture attributes to God's presence (Psalm 18:7, Matthew 27:51).",
          distinction: "Scripture presents earthquakes as signs of God's judgment or presence, not the tantrums of an emotional deity."
        }
      ]
    },
    comparativeNotes: {
      mycenaeanOrigins: {
        description: "Linear B tablets reveal 'po-se-da-o' as a major Mycenaean deity, possibly originally an earthquake/underworld god before his marine associations.",
        significance: "This evolution from chthonic to maritime deity illustrates how pagan religious concepts shifted over time, unlike the unchanging God of Scripture."
      },
      nearEasternParallels: {
        description: "Poseidon has been compared to Mesopotamian Enki/Ea (god of waters and wisdom) and Canaanite Yam (sea god defeated by Baal). The trident may derive from fishing implements or lightning symbols.",
        theologicalNote: "The widespread reverence for water deities reflects humanity's dependence on water and desire to propitiate its unpredictable power."
      }
    }
  },

  // NORSE DEITIES
  'odin': {
    christianEngagement: {
      missionaryEncounter: {
        description: "Christian missionaries to Scandinavia (8th-11th centuries) encountered Odin worship as the dominant cult among warrior aristocracy. Missionaries like Ansgar (801-865 CE), the 'Apostle of the North,' engaged a culture where Odin represented the highest religious aspirations of wisdom-seeking through sacrifice.",
        significance: "The conversion of Scandinavia required addressing Odin's appeal to those seeking wisdom, victory, and life after death - needs Christianity claimed to fulfill more perfectly.",
        historicalNote: "Iceland's conversion (1000 CE) and Norway's Christianization under Olaf Tryggvason demonstrate how Christian faith replaced Odin worship."
      },
      patristicAndMedievalCommentary: [
        {
          author: "Adam of Bremen",
          dates: "c. 1050-1085 CE",
          work: "Gesta Hammaburgensis Ecclesiae Pontificum",
          commentary: "Adam described the temple at Uppsala where Odin was worshipped alongside Thor and Freyr, documenting pagan practices that Christian missionaries sought to replace."
        },
        {
          author: "Snorri Sturluson",
          dates: "1179-1241 CE",
          work: "Prose Edda",
          commentary: "Though a Christian, Snorri preserved Norse mythology in his Edda, presenting Odin and other gods through a euhemeristic lens as deified human kings from Troy."
        }
      ],
      typologicalConnections: [
        {
          theme: "Self-Sacrifice for Wisdom",
          observation: "Odin's self-hanging on Yggdrasil, pierced by his own spear, to gain the runes has been compared to Christ's crucifixion. C.S. Lewis and other scholars saw this as a dim pagan intuition of sacrificial atonement.",
          distinction: "Odin sacrificed himself to himself for personal gain of magical knowledge; Christ sacrificed himself to the Father for humanity's salvation. Odin's sacrifice was self-serving; Christ's was self-giving love."
        },
        {
          theme: "The Hanged God",
          observation: "Both Odin and Christ are associated with hanging on a tree. The 'Havamal' describes Odin hanging 'on that windy tree' for nine nights.",
          distinction: "Christ's death was once-for-all atonement for sin (Hebrews 9:28); Odin's hanging was a shamanic ordeal for personal power. Christ rose bodily; Odin merely gained knowledge."
        },
        {
          theme: "Divine Wisdom",
          observation: "Odin's pursuit of wisdom through suffering (sacrificing his eye for knowledge) reflects humanity's recognition that wisdom comes through cost.",
          distinction: "Biblical wisdom is gift from God (James 1:5), not seized through self-mutilation. Christ offers wisdom freely to those who ask."
        },
        {
          theme: "Father of All",
          observation: "Odin as 'Allfather' parallels God the Father, ruling over divine beings and receiving the worthy dead.",
          distinction: "Odin's fatherhood is limited to Norse cosmos and fails at Ragnarok; God the Father's sovereignty is eternal and absolute."
        }
      ],
      eschatologicalComparison: {
        ragnarokAndApocalypse: "Ragnarok presents a cyclical cosmic battle where gods die; Christian eschatology presents final victory where Christ returns in glory. Odin is devoured by Fenrir; Christ conquers death forever.",
        valhallaAndHeaven: "Valhalla prepares warriors for a losing battle; Heaven is eternal rest in God's presence. The Einherjar fight and die daily; the saints enjoy everlasting peace."
      }
    },
    comparativeNotes: {
      indoEuropeanConnections: {
        description: "Odin (Woden, Wotan) derives from Proto-Germanic *Wodanaz, connected to fury, poetry, and shamanic ecstasy. His functions parallel both sky-father deities (as chief god) and trickster/wisdom figures.",
        significance: "Odin's complexity shows Norse religion's development, combining Indo-European inheritance with shamanic traditions."
      },
      wednesdayEtymology: {
        description: "Wednesday (Wodensday) preserves Odin's name in English, showing how deeply pagan Norse religion influenced Germanic culture.",
        theologicalNote: "The persistence of pagan day-names illustrates Christianity's strategy of gradually transforming rather than immediately eliminating cultural forms."
      }
    }
  },

  'thor': {
    christianEngagement: {
      missionaryEncounter: {
        description: "Thor was the most popular deity among Scandinavian farmers and common folk. Christian missionaries found Thor worship particularly entrenched because of his role as protector against chaos and guarantor of harvests. Conversion often involved dramatic confrontations with Thor's symbols.",
        significance: "The destruction of Thor's idols and groves without divine retribution demonstrated to Norse converts that Thor lacked real power.",
        historicalNote: "Olaf Tryggvason and other missionary kings often destroyed Thor images to prove Christian God's supremacy."
      },
      patristicAndMedievalCommentary: [
        {
          author: "Adam of Bremen",
          dates: "c. 1050-1085 CE",
          work: "Gesta Hammaburgensis",
          commentary: "Adam described Thor's central position in the Uppsala temple, noting he was considered mightiest of the gods and ruled over thunder, winds, rain, and crops."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Warrior",
          observation: "Thor as cosmic warrior against chaos (giants, Jormungandr) parallels Christ as warrior against evil (Colossians 2:15, Revelation 19:11-16).",
          distinction: "Thor fights for his own existence against enemies he cannot ultimately defeat; Christ has already conquered and his victory is assured."
        },
        {
          theme: "Defender of Humanity",
          observation: "Thor protects Midgard (human realm) from giant-kind, showing protective divine concern for humanity.",
          distinction: "Thor's protection is physical and temporary; Christ offers eternal salvation. Thor himself dies at Ragnarok after killing Jormungandr."
        },
        {
          theme: "Thunder and Divine Power",
          observation: "Thunder theophany appears in both traditions (Thor's hammer, God's voice in Psalm 29). Both traditions associate thunder with divine power.",
          distinction: "Thor is thunder; the God of Scripture uses thunder as instrument of revelation. Thor is a creature; God is Creator."
        }
      ]
    },
    comparativeNotes: {
      indoEuropeanConnections: {
        description: "Thor (Donar, Thunor) derives from Proto-Germanic *Thunraz, cognate with Celtic Taranis and related to Indo-European thunder god traditions. His name means 'Thunder.'",
        significance: "Thursday (Thor's day) preserves his name, showing cultural persistence that Christianity gradually transformed."
      },
      mjolnirAndCross: {
        description: "Archaeological evidence shows Thor's hammer (Mjolnir) pendants worn alongside Christian crosses during the conversion period, indicating religious syncretism before full Christianization.",
        theologicalNote: "This transitional period illustrates the gradual process of conversion as old religious symbols were replaced by new."
      }
    }
  },

  // HINDU DEITIES
  'vishnu': {
    christianEngagement: {
      historicalEncounter: {
        description: "Christian engagement with Hindu traditions began with early Eastern Christianity (Thomas Christians in India, traditionally dated to 52 CE) and intensified during European colonial missions. Modern interreligious dialogue has produced sophisticated theological exchanges between Christian and Vaishnava scholars.",
        significance: "Hindu concepts of divine preservation, avatara (incarnation), and devotional love (bhakti) have prompted both comparative study and clarifying distinctions.",
        historicalNote: "Roberto de Nobili (1577-1656) pioneered inculturated Christian mission in India, engaging seriously with Hindu philosophy while maintaining Christian distinctives."
      },
      patristicAndModernCommentary: [
        {
          author: "Thomas Christians (Mar Thoma)",
          dates: "Traditional: 1st century CE",
          context: "Indian Christianity",
          commentary: "The ancient Thomas Christian community in India developed alongside Hindu culture, maintaining Christian faith while engaging local religious concepts."
        },
        {
          author: "Roberto de Nobili",
          dates: "1577-1656 CE",
          work: "Various apologetic works",
          commentary: "De Nobili argued that Christian faith could be expressed through Indian cultural forms while maintaining doctrinal purity, engaging Hindu concepts like avatara and moksha."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Incarnation (Avatara)",
          observation: "Vishnu's ten avataras, especially Krishna and Rama, reflect Hindu belief in divine descent for cosmic restoration. This has been compared to Christ's Incarnation.",
          distinction: "Christian Incarnation is unique, unrepeatable, and fully human and fully divine (hypostatic union). Avataras are multiple, cyclical, and typically maintain divine transcendence. Christ came to save from sin; avataras restore cosmic order."
        },
        {
          theme: "Divine Preservation",
          observation: "Vishnu as Preserver maintains cosmic order (dharma), paralleling God's providential sustenance of creation (Colossians 1:17, Hebrews 1:3).",
          distinction: "Vishnu is one of three gods in the Trimurti; the Christian God is one God in three Persons. Vishnu's preservation is within cyclical time; God sustains creation toward eschatological completion."
        },
        {
          theme: "Devotional Love (Bhakti)",
          observation: "Vaishnava bhakti (devotion) emphasizes loving relationship with the divine, paralleling Christian emphasis on love for God and God's love for humanity.",
          distinction: "Christian love is response to God's prior love revealed in Christ's sacrifice (1 John 4:19); bhakti seeks divine grace through devotional practices. Salvation is by grace through faith, not accumulated devotional merit."
        },
        {
          theme: "Cosmic Sleep and Rest",
          observation: "Vishnu resting on Shesha between cosmic cycles has been compared to God's sabbath rest after creation.",
          distinction: "God's rest is completed work of good creation; Vishnu's sleep precedes cyclical dissolution and recreation. Biblical creation is linear, not cyclical."
        }
      ]
    },
    comparativeNotes: {
      vedicOrigins: {
        description: "Vishnu appears in the Rigveda as a minor solar deity who crosses the universe in three strides. His elevation to supreme deity occurs in the Puranas (c. 300-1000 CE), showing Hindu theological development.",
        significance: "This evolution from minor to supreme deity illustrates Hindu religion's capacity for theological development and synthesis."
      },
      trimurti: {
        description: "The Trimurti (Brahma-Vishnu-Shiva as Creator-Preserver-Destroyer) has been compared to the Christian Trinity, but the structures differ fundamentally.",
        distinction: "The Trinity is one God in three co-equal, co-eternal Persons; the Trimurti is three gods with distinct functions, often with Vishnu or Shiva as supreme depending on sectarian perspective."
      }
    }
  },

  'shiva': {
    christianEngagement: {
      historicalEncounter: {
        description: "Christian missionaries and scholars have engaged Shaivite traditions throughout India's history. The ascetic and mystical dimensions of Shiva worship have prompted comparisons with Christian contemplative traditions.",
        significance: "Shaivite emphasis on divine transcendence, destruction of ego, and transformative encounter with the divine have been studied comparatively with Christian mysticism.",
        historicalNote: "Modern scholars like Rudolf Otto ('The Idea of the Holy') have compared the mysterium tremendum in Shaivite experience with similar phenomena in Christian mysticism."
      },
      typologicalConnections: [
        {
          theme: "Divine Destruction and Transformation",
          observation: "Shiva as Destroyer dissolves the cosmos for renewal, which has been compared to biblical eschatological themes (2 Peter 3:10-13).",
          distinction: "Biblical destruction is once-for-all judgment leading to new creation; Shiva's destruction is cyclical, endlessly repeated. Christian eschatology is teleological; Hindu cosmology is cyclical."
        },
        {
          theme: "Asceticism and Renunciation",
          observation: "Shiva as supreme yogi models renunciation and meditation, paralleling Christian monastic ideals.",
          distinction: "Christian asceticism is for the sake of love and service (1 Corinthians 9:27); Shaivite asceticism often aims at power (siddhi) or liberation from rebirth. Christ models self-giving love, not withdrawal."
        },
        {
          theme: "Divine Dance (Nataraja)",
          observation: "Shiva's cosmic dance of creation and destruction expresses divine creativity and sovereignty.",
          distinction: "Christian creation is ex nihilo by a transcendent God who enters creation through Incarnation; Shiva's dance is continuous divine activity within cosmic process."
        },
        {
          theme: "The Third Eye",
          observation: "Shiva's third eye represents spiritual insight and the capacity to destroy ignorance, comparable to spiritual enlightenment themes.",
          distinction: "Christian enlightenment comes through revelation in Christ and Scripture, not esoteric knowledge or yogic attainment."
        }
      ]
    },
    comparativeNotes: {
      vedicOrigins: {
        description: "Shiva developed from the Vedic deity Rudra, a fearsome storm god. The synthesis with ascetic and yogic traditions produced the complex Shiva of classical Hinduism.",
        significance: "This synthesis of Aryan and indigenous traditions shows the composite nature of Hindu deity formation."
      },
      lingamWorship: {
        description: "Shiva worship often centers on the lingam (phallic symbol), representing creative power and the union of masculine/feminine principles.",
        theologicalNote: "Christian theology maintains God is beyond gender while using masculine language analogically; sexuality is creaturely, not divine."
      }
    }
  },

  // EGYPTIAN DEITIES
  'egyptian': {
    christianEngagement: {
      biblicalBackground: {
        description: "Egypt appears throughout Scripture as the land of bondage from which God delivered Israel. The Exodus narrative (Exodus 7-12) includes explicit confrontation with Egyptian gods, with each plague targeting specific deities (Hapi/Nile, Ra/sun, etc.).",
        significance: "The Exodus establishes God's supremacy over all other gods and serves as the paradigmatic salvation event in the Old Testament.",
        scriptureReference: "Exodus 12:12 - 'I will bring judgment on all the gods of Egypt. I am the LORD.'"
      },
      patristicCommentary: [
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement, himself from Alexandria, extensively critiqued Egyptian religion, particularly animal worship, while acknowledging Egyptian contributions to philosophy and theology."
        },
        {
          author: "Athanasius of Alexandria",
          dates: "c. 296-373 CE",
          work: "Contra Gentes",
          commentary: "Athanasius critiqued pagan worship including Egyptian traditions, arguing that idolatry arose from humanity's fall from contemplation of the true God."
        },
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine discussed Egyptian religion in his broader analysis of paganism, noting both Egyptian priestly learning and the error of identifying gods with natural phenomena."
        }
      ]
    }
  },

  // MESOPOTAMIAN DEITIES
  'marduk': {
    christianEngagement: {
      biblicalBackground: {
        description: "Marduk, chief god of Babylon, is addressed in prophetic literature. Isaiah 46:1-2 describes Bel (Marduk) and Nebo being carried into captivity, demonstrating their powerlessness before YHWH. Jeremiah 50:2 prophesies Babylon's fall and Marduk's disgrace.",
        significance: "The biblical prophets directly confronted Babylonian religion, declaring YHWH's supremacy over the gods of the empire that conquered Judah.",
        scriptureReference: "Isaiah 46:1-2; Jeremiah 50:2"
      },
      patristicCommentary: [
        {
          author: "Eusebius of Caesarea",
          dates: "c. 260-340 CE",
          work: "Praeparatio Evangelica",
          commentary: "Eusebius documented Babylonian religion, arguing that whatever truth it contained was borrowed from Moses and the prophets or represented demonic deception."
        }
      ],
      typologicalConnections: [
        {
          theme: "Creation Through Combat",
          observation: "Marduk's defeat of Tiamat and creation of world from her body (Enuma Elish) has been compared to God's ordering of primordial chaos (Genesis 1:2, tehom).",
          distinction: "God creates by divine word, not combat. Creation in Genesis is effortless sovereignty, not cosmic battle. God is not threatened by chaos but utterly transcends it."
        },
        {
          theme: "Divine Kingship",
          observation: "Marduk's kingship over gods parallels divine sovereignty themes, and Babylon's akitu festival renewed cosmic order through ritual.",
          distinction: "YHWH's kingship is eternal and unchallenged; Marduk's must be ritually renewed. God does not depend on human ceremony for his rule."
        }
      ]
    },
    comparativeNotes: {
      enumaElishAndGenesis: {
        description: "The Enuma Elish creation epic presents Marduk's rise to supremacy and creation of cosmos. Scholarly comparison with Genesis 1 reveals both parallels and profound differences.",
        distinction: "Genesis presents creation by one sovereign God through speech; Enuma Elish presents creation through divine combat among many gods. Genesis emphasizes human dignity; Enuma Elish presents humans as slave-labor for gods."
      }
    }
  },

  // PERSIAN/ZOROASTRIAN
  'ahura-mazda': {
    christianEngagement: {
      historicalEncounter: {
        description: "Zoroastrianism's monotheistic and dualistic elements made it a significant point of comparison for Jewish and Christian thought. Scholars have debated Persian influence on post-exilic Judaism (angelology, eschatology) and early Christianity.",
        significance: "While avoiding simple borrowing theories, scholars recognize Zoroastrian contributions to religious vocabulary (heaven/hell imagery, angelology) that influenced Second Temple Judaism.",
        historicalNote: "The Magi who visited Jesus (Matthew 2) were likely Zoroastrian priests, representing Persian religion's encounter with Christianity from its beginning."
      },
      typologicalConnections: [
        {
          theme: "Monotheism and Supreme Deity",
          observation: "Ahura Mazda as supreme creator god represents Zoroastrian monotheism (or dualistic monotheism), the closest parallel to biblical monotheism in ancient religion.",
          distinction: "Biblical monotheism is absolute; Zoroastrian dualism grants significant power to Angra Mainyu. God creates evil's possibility but is not opposed by an equal power."
        },
        {
          theme: "Cosmic Dualism",
          observation: "The Zoroastrian battle between Ahura Mazda (good) and Angra Mainyu (evil) parallels Christian spiritual warfare themes.",
          distinction: "In Christianity, Satan is a fallen creature, not an eternal principle. Evil is parasitic on good, not co-eternal with it. Christ's victory is assured from the foundation of the world."
        },
        {
          theme: "Eschatological Judgment",
          observation: "Zoroastrian eschatology includes resurrection, final judgment, and cosmic renewal, remarkably paralleling Christian eschatology.",
          distinction: "Whether Zoroastrianism influenced Judaism or both reflect common intuitions remains debated. Christian eschatology is Christ-centered; Zoroastrian eschatology is dualistic resolution."
        }
      ]
    },
    comparativeNotes: {
      magiAndChristianity: {
        description: "The Magi (Matthew 2:1-12) were probably Zoroastrian priests. Their recognition of Christ's birth suggests divine guidance of sincere seekers toward the truth.",
        theologicalNote: "The Magi narrative illustrates Acts 17:27 - God so arranged the world 'that they would seek him and perhaps reach out for him and find him.'"
      },
      cyrusAndMessiah: {
        description: "Cyrus the Great, likely a Zoroastrian, is called God's 'messiah' (anointed one) in Isaiah 45:1, the only non-Israelite so designated. His decree freed the Jews from Babylonian exile.",
        significance: "This demonstrates God's sovereign use of foreign rulers and religions within his purposes."
      }
    }
  }
};

function enrichDeity(filePath, enrichment) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const deity = JSON.parse(content);

    // Add Christian engagement
    if (enrichment.christianEngagement) {
      deity.historical = deity.historical || {};
      deity.historical.christianEngagement = enrichment.christianEngagement;
    }

    // Add comparative notes
    if (enrichment.comparativeNotes) {
      deity.comparativeNotes = enrichment.comparativeNotes;
    }

    // Add scholarly enrichment metadata
    deity.scholarlyEnrichment = {
      enrichedAt: new Date().toISOString(),
      enrichedBy: "christian-scholarly-perspective-enhancement",
      enrichmentVersion: "1.0",
      methodology: "Comparative religion from Christian scholarly perspective, incorporating patristic sources and typological analysis"
    };

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(deity, null, 2), 'utf8');
    console.log(`Enriched: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Error enriching ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('Starting deity enrichment with Christian scholarly perspective...\n');

  let enriched = 0;
  let failed = 0;

  for (const [deityId, enrichment] of Object.entries(enrichmentData)) {
    const filePath = path.join(DEITIES_DIR, `${deityId}.json`);

    if (fs.existsSync(filePath)) {
      if (enrichDeity(filePath, enrichment)) {
        enriched++;
      } else {
        failed++;
      }
    } else {
      console.log(`File not found: ${deityId}.json`);
      failed++;
    }
  }

  console.log(`\nEnrichment complete: ${enriched} enriched, ${failed} failed`);
}

main();

#!/usr/bin/env node
/**
 * Deity Enrichment Script - Christian Scholarly Perspective (Part 2)
 * Covers: Egyptian, Roman, Celtic, Buddhist, Mesoamerican, and remaining deities
 */

const fs = require('fs');
const path = require('path');

const DEITIES_DIR = path.join(__dirname, '../firebase-assets-downloaded/deities');

const enrichmentData = {
  // EGYPTIAN DEITIES
  'osiris': {
    christianEngagement: {
      biblicalBackground: {
        description: "While Osiris is not named in Scripture, Egypt's gods are collectively judged in the Exodus narrative (Exodus 12:12). The Nile's importance to Osiris mythology connects to the first plague (Exodus 7:14-25).",
        significance: "Early Christian writers in Egypt engaged extensively with Osiris mythology, finding both points of contact and fundamental contrasts.",
        scriptureReference: "Exodus 12:12"
      },
      patristicCommentary: [
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement critiqued the Osiris myth while acknowledging Egyptian religious sophistication. He noted the death and resurrection pattern but distinguished it sharply from Christ's resurrection."
        },
        {
          author: "Athanasius of Alexandria",
          dates: "c. 296-373 CE",
          work: "De Incarnatione",
          commentary: "Writing from Egypt, Athanasius argued that pagan dying-rising god myths were dim shadows or demonic counterfeits of the true resurrection in Christ."
        }
      ],
      typologicalConnections: [
        {
          theme: "Death and Resurrection",
          observation: "Osiris's death at Seth's hands and reconstitution by Isis has been compared to Christ's death and resurrection. Some scholars (e.g., James Frazer) saw pagan parallels as sources for Christian belief.",
          distinction: "Osiris remains in the underworld as lord of the dead; Christ rises bodily and ascends to heaven. Osiris's 'resurrection' is reconstitution for afterlife rule, not victory over death itself. Christ's resurrection is historical event; Osiris myth is cyclical nature symbolism."
        },
        {
          theme: "Judge of the Dead",
          observation: "Osiris as judge in the Hall of Two Truths (heart-weighing scene) parallels Christ as judge of living and dead (2 Timothy 4:1).",
          distinction: "Osiris judges by weighing hearts against Ma'at's feather (moral balance); Christ judges with grace for those in him and justice for those who reject him. Egyptian judgment is works-based; Christian judgment accounts for faith."
        },
        {
          theme: "King of the Underworld",
          observation: "Osiris's rule over the blessed dead parallels Christ's authority over death and Hades (Revelation 1:18).",
          distinction: "Christ descended to Hades to conquer death and rise again; Osiris descended to remain. Christ is Lord of life; Osiris is lord of death."
        }
      ]
    },
    comparativeNotes: {
      dynasticEvolution: {
        description: "Osiris worship evolved from local fertility god to national deity of the afterlife over Egyptian history. His prominence increased as Egypt's afterlife theology developed.",
        significance: "This evolution demonstrates how religious concepts develop within cultures, unlike the revealed and consistent character of the biblical God."
      },
      isiacMysteries: {
        description: "The Isis-Osiris cult spread throughout the Roman Empire as mystery religion, becoming a significant competitor to early Christianity. Temples of Isis were found throughout the Mediterranean.",
        theologicalNote: "The Church Fathers addressed this competition directly, distinguishing Christian resurrection from Isiac initiation rites."
      }
    }
  },

  'isis': {
    christianEngagement: {
      historicalEncounter: {
        description: "The cult of Isis spread throughout the Roman Empire and was one of Christianity's main competitors in the 1st-4th centuries CE. Her role as divine mother and her mysteries attracted many devotees.",
        significance: "Some scholars have compared Isis iconography (mother with child Horus) to later Madonna and Child images, though direct influence is debated.",
        historicalNote: "Several Isis temples were converted to churches dedicated to the Virgin Mary, suggesting both continuity and transformation."
      },
      patristicCommentary: [
        {
          author: "Epiphanius of Salamis",
          dates: "c. 310-403 CE",
          work: "Panarion",
          commentary: "Epiphanius noted pagan parallels to Christian devotion but argued these were either demonic counterfeits or distorted memories of original revelation."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Mother",
          observation: "Isis as loving mother of Horus has been compared to Mary as Mother of Jesus. Both are depicted nursing their divine sons.",
          distinction: "Mary is human mother of the divine-human Christ; Isis is herself goddess. Marian devotion honors Mary's role in salvation history; Isis worship treats her as salvific deity. Christian theology never worships Mary as goddess."
        },
        {
          theme: "Faithful Wife",
          observation: "Isis's devotion to Osiris, seeking and reconstituting his body, illustrates marital fidelity praised in all cultures.",
          distinction: "This parallel is cultural rather than theological; many traditions honor faithful spouses."
        }
      ]
    }
  },

  'ra': {
    christianEngagement: {
      biblicalBackground: {
        description: "The ninth plague of darkness over Egypt (Exodus 10:21-29) directly challenged Ra, the sun god. For three days, 'thick darkness' covered Egypt while Israel had light, demonstrating YHWH's supremacy over Egypt's chief deity.",
        significance: "This plague was a theological statement: the God of Israel controls the very sun that Egypt worshipped.",
        scriptureReference: "Exodus 10:21-29"
      },
      typologicalConnections: [
        {
          theme: "Light and Sun",
          observation: "Ra as sun god embodied light, life, and truth. This parallels Christ as 'light of the world' (John 8:12) and 'sun of righteousness' (Malachi 4:2).",
          distinction: "Ra is the physical sun deified; Christ is Creator of the sun. Ra's light is natural; Christ is uncreated Light (1 John 1:5). The sun will cease; Christ's light is eternal."
        },
        {
          theme: "Daily Journey",
          observation: "Ra's daily voyage through sky and underworld (Duat) represents cosmic order and renewal.",
          distinction: "Biblical cosmology is not cyclical but linear, moving toward eschatological completion. Christ's victory is once-for-all, not daily renewed."
        }
      ]
    }
  },

  'horus': {
    christianEngagement: {
      scholarlyContext: {
        description: "Popular claims about extensive parallels between Horus and Jesus (virgin birth, twelve disciples, crucifixion) are largely modern inventions without support in Egyptological sources. Responsible scholarship distinguishes genuine parallels from fabricated ones.",
        significance: "Christian scholars engage carefully with Egyptian sources, neither minimizing genuine parallels nor accepting unfounded claims.",
        caution: "Many 'Horus-Jesus parallels' circulating online derive from Gerald Massey's 19th-century works, which Egyptologists have thoroughly discredited."
      },
      typologicalConnections: [
        {
          theme: "Divine Kingship",
          observation: "Horus as archetypal divine king, son of Osiris, represents legitimate rulership. This concept of divine sonship has been compared to Christ's royal identity.",
          distinction: "Christ's divine sonship is unique and eternal (John 1:1-14); Horus's divine sonship is mythological and cyclical. Christ is Son by nature; pharaohs were 'sons of Ra' by adoption/identification."
        },
        {
          theme: "Victory over Evil",
          observation: "Horus's battles with Seth represent order overcoming chaos, good defeating evil.",
          distinction: "Christ's victory is over sin, death, and Satan through sacrificial love, not military combat. Horus and Seth remain in eternal conflict; Christ has definitively conquered."
        }
      ]
    }
  },

  'anubis': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Psychopomp/Guide of Souls",
          observation: "Anubis's role guiding souls to judgment parallels angels accompanying souls (Luke 16:22) and Christ as 'the way' to the Father (John 14:6).",
          distinction: "Anubis is a god among gods; Christ is the unique mediator (1 Timothy 2:5). Anubis guides to judgment; Christ saves from judgment."
        },
        {
          theme: "Embalming and Death Rites",
          observation: "Anubis's association with mummification reflects universal human concern for death and afterlife.",
          distinction: "Christianity offers resurrection of the body, not mere preservation. The tomb is empty; Egyptian tombs were meant to be permanent."
        }
      ]
    }
  },

  'thoth': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Divine Wisdom",
          observation: "Thoth as god of wisdom, writing, and magic parallels biblical Wisdom personified (Proverbs 8) and Christ as Wisdom of God (1 Corinthians 1:24).",
          distinction: "Thoth is a created god with origin story; Christ as Logos is eternal. Thoth invents writing; Christ is the Word (Logos) himself (John 1:1)."
        },
        {
          theme: "Divine Scribe",
          observation: "Thoth recording judgments parallels the 'books' opened at final judgment (Revelation 20:12).",
          distinction: "This is imagery, not identity. God judges; Thoth records. Christian imagery uses scribal metaphors without deifying the scribe function."
        }
      ]
    }
  },

  // ROMAN DEITIES
  'jupiter': {
    christianEngagement: {
      apostolicEncounter: {
        description: "Jupiter/Zeus worship was directly encountered by Paul at Lystra (Acts 14:8-18), where the crowd identified Barnabas as Zeus and Paul as Hermes. Paul's vigorous rejection of this identification while affirming God's witness to all nations exemplifies the apostolic approach.",
        significance: "This incident demonstrates early Christian insistence on exclusive worship of the true God while acknowledging God's general revelation in creation.",
        scriptureReference: "Acts 14:8-18"
      },
      patristicCommentary: [
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God (Books 4-7)",
          commentary: "Augustine devoted extensive analysis to Roman religion, exposing contradictions between philosophical theology (which sometimes approached monotheism) and popular polytheism. He demonstrated Jupiter's mythological immorality as unworthy of true deity."
        },
        {
          author: "Tertullian",
          dates: "c. 155-220 CE",
          work: "Apologeticum",
          commentary: "Tertullian argued that Jupiter and other Roman gods were either deified humans (euhemerist interpretation) or demons deceiving humanity. He contrasted Roman religious pragmatism with Christian conviction."
        },
        {
          author: "Lactantius",
          dates: "c. 250-325 CE",
          work: "Divine Institutes",
          commentary: "Lactantius systematically critiqued Roman religion while affirming that God had not left pagans without witness to truth."
        }
      ],
      martyrdomContext: {
        description: "Refusal to sacrifice to Jupiter and the Roman gods was a primary cause of Christian martyrdom. Confessing Christ while rejecting Jupiter defined Christian identity in the Roman world.",
        significance: "The martyrs' courage demonstrated Christianity's incompatibility with polytheism and its confidence in Christ's supremacy over all powers."
      }
    },
    comparativeNotes: {
      romanAdaptation: {
        description: "Romans adapted Greek Zeus as Jupiter (from Iuppiter, 'Sky Father'), integrating him into Roman state religion. Jupiter Optimus Maximus ('Best and Greatest') was protector of Rome.",
        significance: "This cultural adaptation shows how religious concepts travel across cultures, unlike the revealed character of Israel's God."
      },
      capitolineTriad: {
        description: "Jupiter, Juno, and Minerva formed the Capitoline Triad, Rome's supreme divine protectors. This structure has been incorrectly compared to the Christian Trinity.",
        distinction: "The Capitoline Triad is three separate deities; the Trinity is one God in three Persons. No real parallel exists."
      }
    }
  },

  'mars': {
    christianEngagement: {
      patristicCommentary: [
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine critiqued Mars worship as glorifying violence, contrasting Roman militarism with the Prince of Peace. He argued that Rome's military success came from God's providence, not Mars's favor."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Warrior",
          observation: "Mars as war god parallels biblical imagery of God as warrior (Exodus 15:3, Revelation 19:11-16).",
          distinction: "God's warfare is righteous judgment and salvation; Mars represents violent conquest. Christ conquers through self-sacrifice, not military power."
        }
      ]
    }
  },

  // CELTIC DEITIES
  'brigid': {
    christianEngagement: {
      conversionContext: {
        description: "St. Brigid of Kildare (c. 451-525 CE), one of Ireland's patron saints, shares the name and some attributes of the goddess Brigid. This has generated scholarly debate about Christian inculturation versus syncretism.",
        significance: "The Brigid case illustrates complex dynamics of Christianization in Celtic lands, where Christian saints sometimes took on roles previously attributed to pagan deities.",
        historicalNote: "Kildare's perpetual flame, tended by St. Brigid's community, may reflect pre-Christian fire keeping associated with the goddess."
      },
      patristicAndMedievalCommentary: [
        {
          author: "Cogitosus",
          dates: "c. 650 CE",
          work: "Vita Sanctae Brigidae",
          commentary: "The earliest biography of St. Brigid presents her as a Christian holy woman without explicitly addressing the goddess tradition, demonstrating early medieval approach to inculturation."
        }
      ],
      typologicalConnections: [
        {
          theme: "Healing and Inspiration",
          observation: "Brigid's associations with healing, poetry, and crafts reflect valued attributes that Christianity could sanctify rather than suppress.",
          distinction: "Christian saints intercede and exemplify holiness; they do not possess divine power independently. St. Brigid's miracles flow from Christ."
        },
        {
          theme: "Sacred Fire",
          observation: "Fire imagery connects to the Holy Spirit (Acts 2:3) and Christian traditions of perpetual flames.",
          distinction: "Christian flame imagery points to God's presence; pagan fire was often the deity itself or its manifestation."
        }
      ]
    }
  },

  'dagda': {
    christianEngagement: {
      conversionContext: {
        description: "The Dagda ('Good God') was a chief figure in Irish mythology. Christian Ireland preserved Dagda myths in medieval manuscripts while framing them as pre-Christian history rather than active religion.",
        significance: "Irish monks' preservation of mythology demonstrates a particular Christian approach: recording cultural heritage while denying its religious validity."
      },
      typologicalConnections: [
        {
          theme: "Divine Father",
          observation: "The Dagda's role as 'Father of All' parallels Father-god imagery in many traditions.",
          distinction: "Celtic father gods are part of pantheons; the biblical Father is one God with Son and Spirit."
        },
        {
          theme: "Abundance and Provision",
          observation: "The Dagda's cauldron of plenty parallels God's providential care and Eucharistic imagery.",
          distinction: "The cauldron is a magical object; Christian provision comes from God's gracious action. The Eucharist commemorates Christ's sacrifice, not magical abundance."
        }
      ]
    }
  },

  'lugh': {
    christianEngagement: {
      historicalContext: {
        description: "The festival Lughnasadh (August 1) was Christianized as Lammas ('Loaf-Mass'), a harvest thanksgiving. This illustrates Christian transformation of pagan festivals.",
        significance: "Rather than simply suppressing Lughnasadh, Christianity redirected its harvest thanksgiving toward the true Provider.",
        historicalNote: "Place names like Lyon (Lugdunum) preserve Lugh's memory, showing the extent of his ancient worship."
      },
      typologicalConnections: [
        {
          theme: "Divine Skill/Mastery",
          observation: "Lugh Samildanach ('Skilled in All Arts') embodies excellence in every craft, paralleling Christ through whom all things were made (John 1:3).",
          distinction: "Lugh acquired skills; Christ is the Creator. Lugh is skilled creature; Christ is sovereign Creator."
        }
      ]
    }
  },

  // BUDDHIST FIGURES
  'buddha': {
    christianEngagement: {
      historicalEncounter: {
        description: "Christian engagement with Buddhism began with ancient trade routes (possible Buddhist influence on Gnostic texts) and intensified with missionary contact in Asia. Modern interreligious dialogue has produced sophisticated exchanges between Buddhist and Christian scholars.",
        significance: "Buddhist emphases on suffering, compassion, and liberation from worldly attachment have prompted both comparative study and clarifying distinctions.",
        historicalNote: "Early Christian legends of 'Barlaam and Josaphat' are adaptations of the Buddha's story, showing ancient awareness of Buddhist traditions."
      },
      patristicAndModernCommentary: [
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Stromata",
          commentary: "Clement briefly mentions Indian philosophers (likely including Buddhists) as examples of pagan wisdom, suggesting early awareness of Eastern traditions."
        },
        {
          author: "Thomas Merton",
          dates: "1915-1968 CE",
          work: "Zen and the Birds of Appetite",
          commentary: "Merton engaged deeply with Buddhist contemplative traditions, finding points of contact with Christian mysticism while maintaining doctrinal distinctions."
        }
      ],
      typologicalConnections: [
        {
          theme: "Enlightenment and Liberation",
          observation: "Buddha's enlightenment (bodhi) and the Christian 'light of the world' share vocabulary of illumination. Both traditions offer liberation from suffering.",
          distinction: "Buddhist enlightenment is insight into no-self (anatta) and dependent origination; Christian salvation preserves and transforms the self into Christ's image. Buddhist liberation is from samsara (cycle of rebirth); Christian salvation is for eternal life with God."
        },
        {
          theme: "Compassion",
          observation: "Buddha's karuna (compassion) parallels Christian love (agape). Both traditions emphasize compassionate action.",
          distinction: "Buddhist compassion arises from wisdom about suffering; Christian love responds to God's prior love in Christ (1 John 4:19). Buddhist compassion aims at ending suffering; Christian love includes but transcends this, aiming at communion with God."
        },
        {
          theme: "Teacher and Way",
          observation: "Buddha as supreme teacher parallels Christ as teacher. Both are called 'the Way' in their traditions.",
          distinction: "Buddha points to a path; Christ says 'I am the way' (John 14:6). Buddha discovers truth; Christ is Truth. Buddha shows the way to enlightenment; Christ saves by his person and work."
        },
        {
          theme: "Renunciation",
          observation: "Buddha's renunciation of princely life parallels Christ's 'emptying himself' (Philippians 2:7).",
          distinction: "Buddha renounced to seek enlightenment for himself first; Christ descended to save others. Buddha's kenosis was departure from palace; Christ's was incarnation from divine glory."
        }
      ]
    },
    comparativeNotes: {
      theravadaVsMahayana: {
        description: "Theravada Buddhism emphasizes Buddha as human teacher who discovered the path; Mahayana Buddhism developed Buddha into cosmic principle with multiple Buddha-forms.",
        significance: "These internal Buddhist developments created different dialogue partners for Christianity. Mahayana's cosmic Buddha and bodhisattva devotion bear more surface resemblance to Christian patterns."
      },
      emptinessAndCreation: {
        description: "Buddhist sunyata (emptiness) and Christian creation ex nihilo represent fundamentally different metaphysics. Buddhism denies substantial existence; Christianity affirms created being dependent on God.",
        distinction: "These differences mean 'salvation' in each tradition aims at fundamentally different goals: release from illusion versus transformation into divine likeness."
      }
    }
  },

  'avalokiteshvara': {
    christianEngagement: {
      historicalContext: {
        description: "Avalokiteshvara, the Bodhisattva of Compassion, became feminized in East Asian Buddhism as Guanyin/Kannon. Some scholars have suggested interaction with Christian Marian devotion, though this remains debated.",
        significance: "The development of compassionate divine/semi-divine figures across traditions illustrates universal human longing for divine mercy."
      },
      typologicalConnections: [
        {
          theme: "Divine Compassion",
          observation: "Avalokiteshvara embodies compassion that hears the cries of the suffering world. This parallels God who hears prayer (Psalm 34:15) and Christ who has compassion on the multitudes (Matthew 9:36).",
          distinction: "Avalokiteshvara is a bodhisattva who delays enlightenment; Christ is God incarnate who definitively saves. Bodhisattva compassion is merit-transferring; Christ's compassion is substitutionary atonement."
        },
        {
          theme: "Many Forms to Save",
          observation: "Avalokiteshvara appears in countless forms to save beings. This has been compared to God's accommodation in revelation.",
          distinction: "Christian incarnation is unique and unrepeatable (Hebrews 9:28); Avalokiteshvara's manifestations are ongoing and multiple."
        }
      ]
    }
  },

  'guanyin': {
    christianEngagement: {
      historicalContext: {
        description: "Guanyin (Kuan Yin) is the East Asian feminine form of Avalokiteshvara. Catholic missionaries in China noted parallels with Mary and sometimes encountered confusion or syncretism.",
        significance: "The development of compassionate goddess-like figures in non-Christian traditions illustrates both universal religious needs and the uniqueness of Christian revelation."
      },
      typologicalConnections: [
        {
          theme: "Divine Mercy",
          observation: "Guanyin's popular devotion as 'Goddess of Mercy' parallels Marian titles like 'Mother of Mercy.'",
          distinction: "Mary is human intercessor, not goddess; Guanyin is divine bodhisattva. Christian mercy flows from Christ through Mary's prayers; Buddhist merit comes from Guanyin's bodhisattva vows."
        }
      ]
    }
  },

  // MESOAMERICAN DEITIES
  'quetzalcoatl': {
    christianEngagement: {
      conquestContext: {
        description: "Spanish missionaries encountered Quetzalcoatl traditions and debated their significance. Some (like Fray Diego Duran) proposed Quetzalcoatl represented St. Thomas the Apostle's ancient mission to the Americas. Most scholars now reject this theory.",
        significance: "Early missionaries' attempts to find Christian connections in Quetzalcoatl illustrate both the desire to find preparatio evangelica and the dangers of over-interpretation.",
        historicalNote: "The legend that Aztecs mistook Cortes for returning Quetzalcoatl is now considered largely post-conquest elaboration."
      },
      typologicalConnections: [
        {
          theme: "Dying and Rising God",
          observation: "Quetzalcoatl's departure and promised return has been compared to Christ's ascension and second coming.",
          distinction: "Quetzalcoatl's return is mythical expectation within cyclical time; Christ's return is eschatological hope within linear history. Christ historically died and rose; Quetzalcoatl's 'death' is departure."
        },
        {
          theme: "Culture-Bringer",
          observation: "Quetzalcoatl as giver of corn, calendar, and arts parallels wisdom-bringer themes in many cultures.",
          distinction: "These parallels are cultural, not theological. Quetzalcoatl provides material and cultural goods; Christ offers spiritual salvation."
        }
      ]
    },
    comparativeNotes: {
      humanSacrifice: {
        description: "While Quetzalcoatl is sometimes portrayed as opposing human sacrifice, Mesoamerican religion generally demanded it. Christian missionaries universally condemned this practice.",
        theologicalNote: "Christianity proclaims Christ's once-for-all sacrifice ending all need for blood sacrifice (Hebrews 10:1-18). This was perhaps Christianity's most direct challenge to Mesoamerican religion."
      }
    }
  },

  'huitzilopochtli': {
    christianEngagement: {
      conquestContext: {
        description: "Huitzilopochtli, Aztec god of war and sun, demanded constant human sacrifice to sustain the sun. Spanish missionaries saw this as demonic religion requiring complete transformation.",
        significance: "The human sacrifice complex presented Christianity's starkest challenge to an indigenous religion, with no possibility of syncretistic accommodation."
      },
      typologicalConnections: [
        {
          theme: "Sacrifice for Cosmic Order",
          observation: "Aztec belief that human sacrifice sustained the cosmos reflects (in distorted form) universal religious intuition about sacrifice's necessity.",
          distinction: "Christ's once-for-all sacrifice fulfills and ends the need for sacrifice. Christian sacrifice is eucharistic thanksgiving, not repeated slaughter. The victim is divine, not human captives."
        }
      ]
    }
  },

  // ADDITIONAL GREEK
  'hermes': {
    christianEngagement: {
      apostolicEncounter: {
        description: "At Lystra (Acts 14:12), Paul was identified as Hermes 'because he was the chief speaker.' This incident reveals how Greek religious categories shaped perception of the apostolic mission.",
        significance: "Paul's rejection of divine honors while affirming the living God's universal witness illustrates apostolic method.",
        scriptureReference: "Acts 14:8-18"
      },
      patristicCommentary: [
        {
          author: "Justin Martyr",
          dates: "c. 100-165 CE",
          work: "First Apology",
          commentary: "Justin noted that Hermes was called 'the Word' (logos) by Greeks, seeing this as demonic anticipation/distortion of John's Gospel."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Messenger/Logos",
          observation: "Hermes as messenger of gods and 'the Word' (Hermes Logios) parallels Christ as God's ultimate Word (John 1:1).",
          distinction: "Christ is the eternal Logos, God himself; Hermes is subordinate messenger deity. Christ is the message; Hermes merely carries messages."
        },
        {
          theme: "Psychopomp",
          observation: "Hermes guiding souls to Hades parallels Christ's authority over death and the grave.",
          distinction: "Hermes guides to a shadowy afterlife; Christ leads to resurrection life."
        }
      ]
    }
  },

  'hades': {
    christianEngagement: {
      biblicalUsage: {
        description: "Hades (Greek) translates Hebrew Sheol in the Septuagint and New Testament, becoming biblical vocabulary for the realm of the dead. This semantic borrowing transformed the term's meaning.",
        significance: "Christianity adopted and transformed Greek terminology while fundamentally changing its content.",
        scriptureReference: "Luke 16:23; Revelation 1:18; Acts 2:27"
      },
      typologicalConnections: [
        {
          theme: "Realm of Dead",
          observation: "Hades as underworld lord reflects universal human recognition of death's reality and mystery.",
          distinction: "Christ holds 'the keys of death and Hades' (Revelation 1:18). The Greek Hades is fate; the biblical Hades is subject to Christ. Hades rules; Christ conquers."
        }
      ]
    }
  },

  'dionysus': {
    christianEngagement: {
      patristicCommentary: [
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement sharply critiqued Dionysiac mysteries and their association with drunkenness and sexual excess, while noting that wine imagery appears positively in Scripture."
        },
        {
          author: "Justin Martyr",
          dates: "c. 100-165 CE",
          work: "First Apology",
          commentary: "Justin saw Dionysiac myths (miraculous birth, persecution, wine) as demonic parodies designed to confuse people about Christ."
        }
      ],
      typologicalConnections: [
        {
          theme: "Divine Wine",
          observation: "Dionysus as god of wine has been compared to Christ's miracle at Cana (John 2:1-11) and Eucharistic wine.",
          distinction: "Christ transforms water to wine as sign of his glory; Dionysus is wine deified. Eucharistic wine represents Christ's blood for salvation; Dionysiac wine represents intoxication and frenzy."
        },
        {
          theme: "Twice-Born",
          observation: "Dionysus's double birth (from Semele, then from Zeus's thigh) has been compared to virgin birth and resurrection.",
          distinction: "Christ's virgin birth is historical incarnation; Dionysus's second birth is mythological rescue. Christ's resurrection is bodily victory; Dionysus's is mythical preservation."
        },
        {
          theme: "Suffering God",
          observation: "Dionysus Zagreus (torn apart by Titans) is a dying-rising god pattern that has been compared to Christ.",
          distinction: "Christ suffered once for sins (1 Peter 3:18) for human salvation; Dionysus's suffering is cosmic myth without salvific purpose for humanity."
        }
      ]
    }
  },

  // ADDITIONAL NORSE
  'loki': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Trickster and Deceiver",
          observation: "Loki's role as deceiver who brings about Ragnarok has been compared to Satan's role as deceiver whose actions lead to cosmic conflict.",
          distinction: "Satan is fallen creature in rebellion against God; Loki is ambiguous figure who is both helper and destroyer. Loki is bound to release at Ragnarok; Satan is bound to be finally defeated."
        },
        {
          theme: "Bound Until End Times",
          observation: "Loki's binding until Ragnarok parallels Satan bound for a thousand years (Revelation 20:2-3).",
          distinction: "The parallels are structural rather than theological. Satan's binding is Christ's victory; Loki's binding is punishment for Baldr's death."
        }
      ]
    }
  },

  'baldr': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Beautiful Dying God",
          observation: "Baldr as beautiful, innocent god who dies and will return after Ragnarok has been compared to Christ's death and resurrection.",
          distinction: "Christ died for sins; Baldr dies by accident/trickery. Christ's resurrection is historical; Baldr's return is after cyclical cosmic destruction. Christ saves; Baldr is simply restored."
        },
        {
          theme: "Universal Mourning",
          observation: "All creation weeping for Baldr parallels prophetic expectations of universal mourning for the one pierced (Zechariah 12:10).",
          distinction: "Christian mourning is for sin's consequences and then joy for resurrection; Norse mourning is for tragedy without redemption (until post-Ragnarok)."
        }
      ]
    }
  },

  'frigg': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Divine Queen/Mother",
          observation: "Frigg as queen of the gods and mother of Baldr reflects mother-goddess archetypes present across cultures.",
          distinction: "Frigg is goddess; Mary is human mother of Jesus. The Virgin Mary does not replace goddess figures but demonstrates new creation through a human vessel."
        }
      ]
    }
  },

  'heimdall': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Watchman and Herald",
          observation: "Heimdall's role as watchman who will blow Gjallarhorn at Ragnarok parallels angelic trumpets announcing Christ's return (1 Thessalonians 4:16).",
          distinction: "Heimdall announces destruction; angels announce Christ's victory. Heimdall guards against inevitable doom; Christian heralds announce assured hope."
        }
      ]
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
      deity.comparativeNotes = deity.comparativeNotes || {};
      Object.assign(deity.comparativeNotes, enrichment.comparativeNotes);
    }

    // Update scholarly enrichment metadata
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
  console.log('Starting deity enrichment with Christian scholarly perspective (Part 2)...\n');

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

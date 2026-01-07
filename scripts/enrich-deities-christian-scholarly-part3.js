#!/usr/bin/env node
/**
 * Deity Enrichment Script - Christian Scholarly Perspective (Part 3)
 * Covers: Remaining Hindu, Greek, Japanese, Chinese, Mesopotamian deities
 */

const fs = require('fs');
const path = require('path');

const DEITIES_DIR = path.join(__dirname, '../firebase-assets-downloaded/deities');

const enrichmentData = {
  // REMAINING HINDU DEITIES
  'brahma': {
    christianEngagement: {
      historicalEncounter: {
        description: "Christian missionaries engaged with Hindu creator theology from early Portuguese contact in India. The concept of Brahma as creator within the Trimurti invited comparison with Christian creation theology.",
        significance: "Brahma's relatively minor role in Hindu worship (despite his creator function) contrasts with Christian emphasis on the Creator-creature relationship."
      },
      typologicalConnections: [
        {
          theme: "Creator Deity",
          observation: "Brahma as creator parallels the biblical God as Creator of heaven and earth (Genesis 1:1).",
          distinction: "Brahma creates from pre-existing material (prakriti) or emanates reality; God creates ex nihilo (from nothing). Brahma is one of three gods; God is the only Creator. Brahma's creative role diminishes after creation; God sustains creation continuously."
        },
        {
          theme: "Divine Word/Speech",
          observation: "Brahma creates through sacred speech (Vac/Saraswati), paralleling God's creation by Word (Genesis 1, John 1:1-3).",
          distinction: "In Christianity, the Word (Logos) is God himself; in Hindu thought, Vac/Saraswati is Brahma's consort/power."
        }
      ]
    },
    comparativeNotes: {
      trimurti: {
        description: "The Trimurti (Brahma-Vishnu-Shiva) assigns creation, preservation, and destruction to separate deities. This differs fundamentally from Christian theology where one God creates, sustains, and judges.",
        distinction: "The Trinity is one God in three Persons, not three gods with different functions."
      }
    }
  },

  'krishna': {
    christianEngagement: {
      historicalEncounter: {
        description: "The devotional (bhakti) traditions surrounding Krishna attracted comparative study with Christian devotion to Christ. The Bhagavad Gita's spiritual counsel has been compared to New Testament ethics.",
        significance: "Krishna's role as divine teacher and friend to Arjuna has prompted comparisons with Christ as teacher and friend to disciples."
      },
      typologicalConnections: [
        {
          theme: "Divine Incarnation",
          observation: "Krishna as Vishnu's eighth avatar represents divine descent to restore dharma. This has been compared to Christ's Incarnation.",
          distinction: "Christ's Incarnation is unique, permanent, and fully human/divine (hypostatic union). Krishna's avatar is one of many, and Hindu theology debates the nature of avatar embodiment. Christ came to save from sin; Krishna came to restore cosmic order."
        },
        {
          theme: "Divine Teacher",
          observation: "The Bhagavad Gita's Krishna teaches Arjuna about duty, devotion, and divine nature. This parallels Christ's teaching ministry.",
          distinction: "Krishna teaches dharmic duty including violence in just war; Christ teaches love of enemies. The Gita's spiritual teaching occurs before battle; the Gospels culminate in cross and resurrection."
        },
        {
          theme: "Divine Lover (Bhakti)",
          observation: "Krishna's relationship with the gopis (cowherd women), especially Radha, represents divine-human love. This has been compared to the Song of Solomon and bridal mysticism.",
          distinction: "Krishna's love play (rasa lila) is mythological and erotic in character; Christian bridal mysticism is metaphorical for the soul's union with God. The eroticism is understood differently in each tradition."
        },
        {
          theme: "Cosmic Revelation (Vishvarupa)",
          observation: "Krishna revealing his cosmic form to Arjuna (Gita 11) parallels theophanies in Scripture (Isaiah 6, Revelation 1).",
          distinction: "Divine self-revelation in Scripture emphasizes holiness and calls for worship; Krishna's revelation demonstrates power. Both evoke awe, but theological context differs."
        }
      ]
    },
    comparativeNotes: {
      bhagavadGitaAndGospels: {
        description: "The Bhagavad Gita and Gospels represent their traditions' central texts about divine incarnation's teaching. Comparative study reveals both parallels and fundamental differences.",
        significance: "Both traditions offer salvation through devotion to the incarnate deity, but understand salvation differently (moksha vs. eternal life with God)."
      }
    }
  },

  'lakshmi': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Divine Blessing/Providence",
          observation: "Lakshmi as goddess of prosperity and good fortune reflects universal human recognition of blessing as divine gift.",
          distinction: "Biblical blessing comes from relationship with God, not appeasement of a separate prosperity deity. Prosperity is not ultimate good in Christian thought (Matthew 6:19-21)."
        },
        {
          theme: "Divine Consort",
          observation: "Lakshmi's relationship with Vishnu as his eternal consort parallels theological imagery of the Church as bride of Christ (Ephesians 5:25-27).",
          distinction: "The Church is created community, not goddess. Bridal imagery is metaphorical, describing relationship rather than divine marriage."
        }
      ]
    }
  },

  'ganesha': {
    christianEngagement: {
      historicalEncounter: {
        description: "Ganesha, one of Hinduism's most popular deities, is invoked at beginnings of undertakings. His distinctive elephant-headed form made him particularly notable to Western observers.",
        significance: "Ganesha's role as remover of obstacles and lord of beginnings reflects universal human desire for divine help in new ventures."
      },
      typologicalConnections: [
        {
          theme: "Divine Help in New Beginnings",
          observation: "Invoking Ganesha at the start of endeavors parallels Christian prayers for God's blessing on new undertakings.",
          distinction: "Christians pray to God directly through Christ (John 14:13-14), not to specialized deities. God's help is personal relationship, not ritual appeasement."
        },
        {
          theme: "Wisdom and Learning",
          observation: "Ganesha as patron of wisdom and learning parallels the Spirit of wisdom (Isaiah 11:2) and prayers for understanding (James 1:5).",
          distinction: "Biblical wisdom is gift from the one God, not domain of a separate deity."
        }
      ]
    }
  },

  'kali': {
    christianEngagement: {
      historicalEncounter: {
        description: "Kali's fierce iconography and association with death made her particularly challenging for Western observers. Christian missionaries confronted Kali worship, especially practices associated with the Thuggee cult.",
        significance: "Kali represents aspects of Hindu theology emphasizing divine power in its terrible aspect, which Christian theology addresses through doctrines of divine judgment."
      },
      typologicalConnections: [
        {
          theme: "Divine Wrath",
          observation: "Kali embodies destructive divine power, which has parallels in biblical descriptions of God's wrath (Romans 1:18, Revelation 6:16-17).",
          distinction: "Biblical wrath is holy response to sin, leading to salvation for those who repent; Kali's destruction is cosmic power beyond moral categories. God's wrath serves redemptive purpose; Kali's destruction is part of cosmic cycle."
        },
        {
          theme: "Death and Time",
          observation: "Kali as 'Black One' associated with death and time (Kala) addresses human mortality.",
          distinction: "Christianity proclaims victory over death through resurrection (1 Corinthians 15:55-57). Death is 'last enemy' defeated by Christ, not eternal goddess."
        }
      ]
    }
  },

  'durga': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Divine Warrior",
          observation: "Durga's defeat of the buffalo demon Mahishasura represents divine victory over evil, paralleling cosmic battle themes in Scripture.",
          distinction: "Christ conquers through sacrifice and resurrection, not military combat. The cross is victory over evil powers (Colossians 2:15)."
        },
        {
          theme: "Divine Feminine Power",
          observation: "Durga embodies shakti (divine feminine power), presenting goddess worship absent from Christian theology.",
          distinction: "Christianity affirms that God is spirit, beyond gender, though using masculine language. The Church, not a goddess, is feminine in relation to Christ."
        }
      ]
    }
  },

  'hanuman': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Divine Servant/Devotion",
          observation: "Hanuman's devoted service to Rama represents ideal bhakti (devotion), comparable to Christian ideals of service to Christ.",
          distinction: "Hanuman is deity worshipped; Christian servants are creatures. Christ calls disciples friends (John 15:15), not merely servants."
        },
        {
          theme: "Miraculous Abilities",
          observation: "Hanuman's supernatural powers (flight, size-changing, strength) parallel angelic and miraculous biblical narratives.",
          distinction: "Biblical miracles serve God's redemptive purposes; Hanuman's powers serve his divine devotee's mission."
        }
      ]
    }
  },

  // REMAINING GREEK
  'demeter': {
    christianEngagement: {
      patristicCommentary: [
        {
          author: "Clement of Alexandria",
          dates: "c. 150-215 CE",
          work: "Protrepticus",
          commentary: "Clement critiqued the Eleusinian Mysteries associated with Demeter while acknowledging Greek longing for hope beyond death that Christianity fulfills."
        }
      ],
      typologicalConnections: [
        {
          theme: "Grain and Death/Resurrection",
          observation: "The Demeter-Persephone myth (grain buried in earth, returning in spring) illustrates the agricultural cycle used by Jesus for resurrection teaching (John 12:24).",
          distinction: "Jesus uses grain imagery illustratively; Demeter mythology makes the cycle itself divine. Christ's resurrection is unique historical event, not cyclical nature worship."
        },
        {
          theme: "Mystery and Initiation",
          observation: "The Eleusinian Mysteries promised blessed afterlife to initiates. This prepared Greco-Roman world for Christianity's offer of eternal life.",
          distinction: "Christian salvation is by grace through faith (Ephesians 2:8-9), not secret initiation. The Gospel is public proclamation, not mystery cult."
        }
      ]
    }
  },

  'ares': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "God of War",
          observation: "Ares as god of war represents divine sanction for violence, which biblical tradition addresses through complex just war and holy war traditions.",
          distinction: "The biblical God uses war instrumentally for judgment; Ares embodies war itself. Christ is 'Prince of Peace' (Isaiah 9:6); ultimate Christian hope is swords beaten into plowshares (Isaiah 2:4)."
        }
      ],
      patristicCommentary: [
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine critiqued Roman glorification of war (Mars/Ares) while developing Christian just war theory that subordinates violence to justice and peace."
        }
      ]
    }
  },

  'artemis': {
    christianEngagement: {
      apostolicEncounter: {
        description: "The Artemis of Ephesus (Acts 19:23-41) represents Paul's most dramatic confrontation with pagan religion. The riot stirred by silversmiths fearing loss of business from Artemis statue sales demonstrates religious-economic tensions.",
        significance: "This incident shows Christianity's economic as well as religious impact, and the violence pagan religion could muster against the Gospel.",
        scriptureReference: "Acts 19:23-41"
      },
      typologicalConnections: [
        {
          theme: "Virgin Goddess",
          observation: "Artemis's perpetual virginity parallels Marian tradition, though Ephesian Artemis was specifically a fertility goddess (many-breasted iconography).",
          distinction: "Mary's virginity is historical fact for Christian faith; Artemis's is mythological attribute. Mary is human; Artemis is goddess."
        },
        {
          theme: "Protector of Women",
          observation: "Artemis as protector of women in childbirth reflects universal concerns Christianity addresses through prayer and community care.",
          distinction: "Christian women pray to God through Christ; ancient women sought specialized deities."
        }
      ]
    }
  },

  'hera': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Divine Queen",
          observation: "Hera as queen of Olympus and goddess of marriage reflects universal valuation of marriage and queenly dignity.",
          distinction: "Marriage in Christianity is between creatures blessed by God, not protected by goddess. Mary is honored as Queen of Heaven in Catholic tradition, but as human exalted by grace."
        }
      ],
      patristicCommentary: [
        {
          author: "Augustine of Hippo",
          dates: "354-430 CE",
          work: "City of God",
          commentary: "Augustine noted the contradiction between Hera/Juno as goddess of marriage and her mythological rage and jealousy, showing mythology's moral inadequacy."
        }
      ]
    }
  },

  // JAPANESE DEITIES
  'japanese_amaterasu': {
    christianEngagement: {
      historicalEncounter: {
        description: "Jesuit missionaries (16th-17th century) and later Protestant missionaries encountered Amaterasu worship as central to Japanese religious identity. The sun goddess's role in imperial ideology complicated Christian mission.",
        significance: "The association of Amaterasu with the Japanese imperial line created political dimensions to Christian proclamation of Christ as sole Lord."
      },
      typologicalConnections: [
        {
          theme: "Divine Light",
          observation: "Amaterasu as sun goddess embodies light and life, paralleling Christ as 'light of the world' (John 8:12).",
          distinction: "Amaterasu is the physical sun deified; Christ is Creator of sun and uncreated Light. The sun is created (Genesis 1:16); Christ is eternal."
        },
        {
          theme: "Divine Ancestry",
          observation: "The imperial line's claimed descent from Amaterasu sacralized Japanese political authority.",
          distinction: "Christian theology separates divine and human spheres. No human lineage is divine, though rulers receive authority from God (Romans 13:1)."
        }
      ]
    }
  },

  'japanese_susanoo': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Storm/Sea Deity",
          observation: "Susanoo as storm god parallels storm theophany in Scripture (Psalm 29, Job 38).",
          distinction: "The God of Scripture commands storms (Mark 4:39); Susanoo is storm personified."
        },
        {
          theme: "Dragon-Slayer",
          observation: "Susanoo's slaying of Yamata-no-Orochi parallels dragon-slaying myths and Revelation's dragon imagery (Revelation 12).",
          distinction: "Christ's victory over the dragon/Satan is cosmic and definitive; Susanoo's is localized heroic myth."
        }
      ]
    }
  },

  // CHINESE DEITIES
  'chinese_jade-emperor': {
    christianEngagement: {
      historicalEncounter: {
        description: "Jesuit missionaries in China (Matteo Ricci and others) debated whether terms like Shangdi or Tianzhu could be used for the Christian God. The Jade Emperor's role in popular religion complicated these discussions.",
        significance: "The Chinese Rites Controversy illustrates challenges of Christian inculturation in sophisticated non-Western religious cultures."
      },
      typologicalConnections: [
        {
          theme: "Heavenly Ruler",
          observation: "The Jade Emperor as supreme deity ruling heaven parallels imagery of God's heavenly throne (Revelation 4-5).",
          distinction: "The Jade Emperor is part of complex bureaucratic pantheon; the biblical God is sole sovereign. The Jade Emperor rose to power; God is eternally supreme."
        }
      ]
    }
  },

  // MESOPOTAMIAN
  'ishtar': {
    christianEngagement: {
      biblicalBackground: {
        description: "Ishtar (Inanna) is referenced indirectly in Scripture through her title 'Queen of Heaven' (Jeremiah 7:18, 44:17-25), condemned as idolatrous worship by Jeremiah.",
        significance: "Jeremiah's condemnation of 'Queen of Heaven' worship shows prophetic opposition to goddess cults in Israel.",
        scriptureReference: "Jeremiah 7:18; 44:17-25"
      },
      typologicalConnections: [
        {
          theme: "Descent and Return",
          observation: "Ishtar's descent to the underworld and return has been compared to Christ's descent and resurrection.",
          distinction: "Ishtar descends to conquer her sister and is trapped; Christ descends victoriously to proclaim triumph (1 Peter 3:18-19). Ishtar needs rescue; Christ rescues."
        },
        {
          theme: "Love and War",
          observation: "Ishtar combines love and war domains in ways that shocked even ancient observers.",
          distinction: "God's love is holy and self-giving; Ishtar's is capricious. God's warfare is righteous judgment; Ishtar's is destructive passion."
        }
      ]
    }
  },

  'tiamat': {
    christianEngagement: {
      biblicalConnection: {
        description: "The Hebrew word tehom (deep, Genesis 1:2) is cognate with Tiamat, suggesting cultural awareness. However, Genesis radically demythologizes: tehom is not a deity but simply the deep over which God's Spirit hovers.",
        significance: "The contrast between Marduk's combat with Tiamat and God's peaceful command over the waters demonstrates fundamental differences between Babylonian and biblical creation theology.",
        scriptureReference: "Genesis 1:2"
      },
      typologicalConnections: [
        {
          theme: "Primordial Chaos",
          observation: "Tiamat as chaos dragon parallels biblical chaos imagery (Leviathan, Rahab, the sea).",
          distinction: "God does not battle chaos; he commands it. Leviathan and Rahab are creatures under God's control (Job 41, Psalm 89:10), not rival powers."
        }
      ]
    }
  },

  'enki': {
    christianEngagement: {
      biblicalParallels: {
        description: "Enki (Ea) as god of wisdom and fresh waters has been compared to various biblical themes. The Adapa myth (wisdom offered then withheld) has been compared to the Garden of Eden narrative.",
        significance: "Scholars note parallels and contrasts between Mesopotamian and biblical traditions, suggesting shared cultural milieu with distinctive theological developments."
      },
      typologicalConnections: [
        {
          theme: "Divine Wisdom",
          observation: "Enki as god of wisdom parallels biblical Wisdom tradition.",
          distinction: "Biblical wisdom is personified attribute of God, not separate deity. Christ is Wisdom of God (1 Corinthians 1:24)."
        },
        {
          theme: "Life-Giving Waters",
          observation: "Enki's association with the Apsu (fresh water) connects to life-giving water imagery in Scripture (John 4:14, 7:38).",
          distinction: "Christ gives living water as spiritual gift; Enki is fresh water deified."
        }
      ]
    }
  },

  // PERSIAN
  'mithra': {
    christianEngagement: {
      historicalCompetition: {
        description: "Mithraism was one of Christianity's main competitors in the Roman Empire (1st-4th centuries CE). Mystery initiations, communal meals, December 25 celebrations, and other parallels generated extensive scholarly debate about influence.",
        significance: "While some parallels exist, most scholars now recognize these developed independently or Christianity influenced Mithraism, not vice versa. December 25 adoption post-dates Christian Christmas celebration.",
        caution: "Popular claims about extensive Mithra-Jesus parallels often rely on outdated or unreliable sources."
      },
      patristicCommentary: [
        {
          author: "Justin Martyr",
          dates: "c. 100-165 CE",
          work: "First Apology",
          commentary: "Justin acknowledged Mithraic meal practices resembling Eucharist but attributed these to demonic imitation of Christian sacraments."
        },
        {
          author: "Tertullian",
          dates: "c. 155-220 CE",
          work: "De Praescriptione Haereticorum",
          commentary: "Tertullian noted Mithraic practices paralleling Christian rituals, attributing these to Satan's counterfeiting of Christian truth."
        }
      ],
      typologicalConnections: [
        {
          theme: "Sacrifice and Cosmic Order",
          observation: "Mithra's tauroctony (bull-slaying) establishes cosmic order, compared to Christ's sacrifice establishing new covenant.",
          distinction: "Mithras slays an animal; Christ is himself the sacrifice. Mithraic sacrifice is cosmic myth; Christ's is historical event."
        },
        {
          theme: "Sol Invictus",
          observation: "Mithra's association with Sol Invictus (Unconquered Sun) and December 25 celebrations preceded Christian Christmas date adoption.",
          distinction: "Christians adopted the date to proclaim Christ as true 'Sun of Righteousness' (Malachi 4:2), superseding pagan solar worship."
        }
      ]
    }
  },

  'angra-mainyu': {
    christianEngagement: {
      typologicalConnections: [
        {
          theme: "Cosmic Evil",
          observation: "Angra Mainyu (Ahriman) as source of evil in cosmic battle parallels Satan in Christian theology.",
          distinction: "Satan is fallen creature, not eternal evil principle. Zoroastrian dualism grants evil ontological status; Christianity maintains God's ultimate sovereignty over all, including evil permitted for mysterious purposes."
        },
        {
          theme: "Eschatological Defeat",
          observation: "Zoroastrian expectation of Angra Mainyu's final defeat parallels Christian expectation of Satan's end (Revelation 20:10).",
          distinction: "In Christianity, evil's defeat is assured from the foundation of the world (Revelation 13:8); Zoroastrian cosmic battle is more evenly matched."
        }
      ]
    },
    comparativeNotes: {
      dualismDebate: {
        description: "Scholars debate Zoroastrian influence on Jewish and Christian angelology/demonology, especially during the post-exilic period.",
        caution: "While cultural exchange occurred, direct borrowing is difficult to prove. Each tradition developed distinctive theology."
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
  console.log('Starting deity enrichment with Christian scholarly perspective (Part 3)...\n');

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

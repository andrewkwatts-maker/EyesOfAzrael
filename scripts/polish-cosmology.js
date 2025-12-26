/**
 * Agent 10: Cosmology Asset Polishing Script
 *
 * Enhances cosmology entities with:
 * - Creation myths and world structure
 * - Realms, planes, dimensions
 * - Afterlife descriptions
 * - Cosmological cycles
 * - Sacred geography
 * - Philosophical concepts
 */

const fs = require('fs');
const path = require('path');

// Load cosmology data
const cosmologyPath = path.join(__dirname, '../firebase-assets-downloaded/cosmology/_all.json');
const cosmologyData = JSON.parse(fs.readFileSync(cosmologyPath, 'utf8'));

console.log(`\n🌌 COSMOLOGY ASSET POLISHING\n`);
console.log(`Total entities to polish: ${cosmologyData.length}\n`);

// Categorize by mythology
const byMythology = {};
cosmologyData.forEach(entity => {
    const myth = entity.mythology || 'unknown';
    if (!byMythology[myth]) byMythology[myth] = [];
    byMythology[myth].push(entity);
});

console.log('📊 Distribution by Mythology:');
Object.keys(byMythology).sort().forEach(myth => {
    console.log(`   ${myth}: ${byMythology[myth].length} entities`);
});

// Enrichment mappings for different cosmology types
const creationMythEnrichments = {
    babylonian_creation: {
        stages: [
            'Primordial Waters (Apsu & Tiamat)',
            'Birth of Younger Gods',
            'Conflict: Apsu\'s Death',
            'Tiamat\'s Vengeance',
            'Marduk\'s Victory',
            'Creation from Tiamat\'s Corpse',
            'Creation of Humanity'
        ],
        primaryText: 'Enuma Elish',
        worldStructure: {
            heaven: 'Created from upper half of Tiamat',
            earth: 'Created from lower half of Tiamat',
            underworld: 'Irkalla, realm of the dead'
        },
        keyFigures: ['Marduk', 'Tiamat', 'Apsu', 'Ea', 'Kingu'],
        themes: ['Order from Chaos', 'Divine Kingship', 'Cosmic Battle']
    },

    egyptian_creation: {
        traditions: {
            heliopolitan: {
                primordial: 'Nun (primordial waters)',
                creator: 'Atum',
                method: 'Self-creation, speech, masturbation',
                offspring: 'Shu (air) and Tefnut (moisture)',
                ennead: ['Atum', 'Shu', 'Tefnut', 'Geb', 'Nut', 'Osiris', 'Isis', 'Set', 'Nephthys']
            },
            hermopolitan: {
                primordial: 'Ogdoad (eight primordial deities)',
                creation: 'Cosmic egg or lotus',
                result: 'Ra emerges from primordial mound'
            },
            memphite: {
                creator: 'Ptah',
                method: 'Divine thought and speech',
                theology: 'Ptah creates through his heart and tongue'
            }
        },
        worldStructure: {
            sky: 'Nut (sky goddess)',
            earth: 'Geb (earth god)',
            underworld: 'Duat',
            primordial: 'Nun'
        },
        themes: ['Ma\'at (cosmic order)', 'Cyclical renewal', 'Divine speech']
    },

    greek_creation: {
        stages: [
            'Chaos (primordial void)',
            'Gaia, Tartarus, Eros emerge',
            'Gaia births Uranus (sky)',
            'Titans born from Gaia & Uranus',
            'Kronos overthrows Uranus',
            'Zeus overthrows Kronos',
            'Olympians establish order'
        ],
        generations: {
            primordial: ['Chaos', 'Gaia', 'Tartarus', 'Eros', 'Erebus', 'Nyx'],
            titans: ['Kronos', 'Rhea', 'Oceanus', 'Tethys', 'Hyperion', 'Theia'],
            olympians: ['Zeus', 'Hera', 'Poseidon', 'Hades', 'Demeter', 'Hestia']
        },
        worldStructure: {
            olympus: 'Home of the gods',
            earth: 'Realm of mortals',
            underworld: 'Hades\' domain',
            tartarus: 'Prison of the Titans'
        },
        themes: ['Generational conflict', 'Order vs Chaos', 'Divine succession']
    },

    norse_creation: {
        stages: [
            'Ginnungagap (primordial void)',
            'Niflheim (ice) and Muspelheim (fire)',
            'Ymir (first giant) emerges from melting ice',
            'Audhumla (primordial cow) licks Buri free',
            'Odin, Vili, Ve slay Ymir',
            'World created from Ymir\'s body',
            'Ask and Embla (first humans) created'
        ],
        worldStructure: {
            nineRealms: [
                'Asgard (Aesir gods)',
                'Vanaheim (Vanir gods)',
                'Alfheim (light elves)',
                'Midgard (humans)',
                'Jotunheim (giants)',
                'Svartalfheim (dark elves/dwarves)',
                'Nidavellir (dwarves)',
                'Helheim (dishonored dead)',
                'Niflheim (ice/mist)'
            ],
            axis: 'Yggdrasil (World Tree)',
            bridge: 'Bifrost (rainbow bridge)'
        },
        fromYmir: {
            earth: 'Ymir\'s flesh',
            mountains: 'Ymir\'s bones',
            sea: 'Ymir\'s blood',
            sky: 'Ymir\'s skull',
            clouds: 'Ymir\'s brains'
        },
        themes: ['Ice and Fire', 'Sacrifice and Creation', 'Inevitable Doom (Ragnarok)']
    },

    hindu_creation: {
        cycles: {
            kalpa: 'Day of Brahma (4.32 billion years)',
            manvantara: '14 per kalpa',
            yuga: 'Satya, Treta, Dvapara, Kali (current age)'
        },
        cosmicEgg: {
            hiranyagarbha: 'Golden embryo',
            brahma: 'Emerges from lotus from Vishnu\'s navel',
            creation: 'Brahma creates from cosmic egg'
        },
        purushaHymn: {
            source: 'Rig Veda 10.90',
            concept: 'Universe created from cosmic being Purusha',
            sacrifice: 'Gods sacrifice Purusha to create world'
        },
        worldStructure: {
            lokas: [
                'Satya-loka (Brahma)',
                'Tapa-loka',
                'Jana-loka',
                'Mahar-loka',
                'Svar-loka (heaven)',
                'Bhuvar-loka (atmosphere)',
                'Bhur-loka (earth)'
            ],
            underworlds: ['Atala', 'Vitala', 'Sutala', 'Talatala', 'Mahatala', 'Rasatala', 'Patala']
        },
        themes: ['Eternal cycles', 'Trimurti (Brahma-Vishnu-Shiva)', 'Maya (illusion)']
    },

    buddhist_creation: {
        uniqueView: 'No creator god - dependent origination',
        pratityasamutpada: {
            concept: 'All phenomena arise from causes and conditions',
            twelveLinks: [
                'Ignorance',
                'Formations',
                'Consciousness',
                'Name-and-form',
                'Six sense bases',
                'Contact',
                'Feeling',
                'Craving',
                'Clinging',
                'Becoming',
                'Birth',
                'Aging and death'
            ]
        },
        cosmology: {
            samsara: 'Cycle of rebirth',
            sixRealms: ['Deva (gods)', 'Asura (demigods)', 'Human', 'Animal', 'Preta (hungry ghosts)', 'Naraka (hell)'],
            mountMeru: 'Cosmic mountain at center'
        },
        themes: ['No beginning', 'Causality', 'Liberation through enlightenment']
    },

    chinese_creation: {
        pangu: {
            cosmicEgg: 'Pangu emerges from primordial egg',
            separation: 'Separates yin (earth) and yang (heaven)',
            growth: 'Grows 10 feet daily for 18,000 years',
            death: 'Body becomes world features',
            legacy: {
                sun: 'Left eye',
                moon: 'Right eye',
                rivers: 'Blood',
                mountains: 'Body',
                vegetation: 'Hair'
            }
        },
        nuwaAndFuxi: {
            nuwa: 'Creates humanity from yellow clay',
            fuxi: 'Culture hero, created Ba Gua (trigrams)'
        },
        worldStructure: {
            heaven: 'Yang, ruled by Jade Emperor',
            earth: 'Balance of yin and yang',
            underworld: 'Diyu (18 levels)',
            axis: 'Mount Kunlun'
        },
        themes: ['Yin-Yang duality', 'Cosmic harmony', 'Five elements']
    },

    christian_creation: {
        genesis: {
            source: 'Genesis 1-2',
            days: [
                'Light and darkness',
                'Sky and waters',
                'Land, seas, vegetation',
                'Sun, moon, stars',
                'Sea creatures and birds',
                'Land animals and humanity',
                'Rest (Sabbath)'
            ],
            humanity: 'Made in image of God (Imago Dei)',
            garden: 'Eden - paradise lost through Fall'
        },
        theology: {
            exNihilo: 'Creation from nothing',
            divine: 'God speaks creation into being',
            trinity: 'Father, Word (Logos), Spirit involved',
            purpose: 'To reflect God\'s glory'
        },
        worldview: {
            heaven: 'God\'s dwelling',
            earth: 'Human realm',
            sheol: 'Underworld/grave'
        },
        themes: ['Divine sovereignty', 'Creatio ex nihilo', 'Fall and redemption']
    }
};

const afterlifeEnrichments = {
    egyptian_afterlife: {
        journey: {
            death: 'Soul separates into Ka (life force) and Ba (personality)',
            embalming: 'Mummification preserves body',
            burial: 'Book of the Dead, amulets, provisions',
            duat: 'Navigate 12 hours of night through underworld'
        },
        judgment: {
            hall: 'Hall of Two Truths',
            weighing: 'Heart weighed against feather of Ma\'at',
            judges: '42 divine judges',
            declaration: 'Negative Confession (42 declarations of innocence)',
            outcome: {
                justified: 'Become Akh (blessed spirit), dwell in Field of Reeds',
                condemned: 'Heart devoured by Ammit, cease to exist'
            }
        },
        fieldOfReeds: {
            description: 'Paradise mirroring ideal Egypt',
            activities: 'Farming, feasting, pleasure',
            eternal: 'Life continues forever in perfection'
        },
        guardians: ['Anubis (embalming)', 'Thoth (recording)', 'Osiris (judge)', 'Ammit (devourer)'],
        texts: ['Book of the Dead', 'Pyramid Texts', 'Coffin Texts', 'Amduat', 'Book of Gates']
    },

    greek_afterlife: {
        journey: {
            death: 'Psyche (soul/shade) separates from body',
            burial: 'Coin (obol) placed for Charon',
            rivers: ['Styx', 'Acheron', 'Cocytus', 'Phlegethon', 'Lethe'],
            ferryman: 'Charon crosses souls over Styx',
            guardian: 'Cerberus prevents escape'
        },
        judgment: {
            judges: ['Minos', 'Rhadamanthus', 'Aeacus'],
            criteria: 'Deeds in life'
        },
        destinations: {
            elysium: {
                description: 'Paradise for heroes and righteous',
                also: 'Elysian Fields, Islands of the Blessed',
                experience: 'Eternal peace, feasting, recreation'
            },
            asphodel: {
                description: 'Neutral realm for average souls',
                experience: 'Dim, shadowy existence - neither joy nor torment',
                population: 'Vast majority of dead'
            },
            tartarus: {
                description: 'Prison of the damned',
                depth: 'As far below Hades as heaven is above earth',
                inmates: ['Titans', 'Serious offenders against gods'],
                punishments: 'Eternal torments (Sisyphus, Tantalus, etc.)'
            }
        },
        specialCases: [
            'Orpheus - retrieved Eurydice (failed)',
            'Heracles - captured Cerberus',
            'Odysseus - consulted dead',
            'Aeneas - visited father'
        ]
    },

    norse_afterlife: {
        destinations: {
            valhalla: {
                ruler: 'Odin',
                residents: 'Warriors who died in battle (chosen by Valkyries)',
                activities: 'Daily combat, feasting, preparation for Ragnarok',
                hall: '540 doors, shields for roof, spears for rafters'
            },
            folkvangr: {
                ruler: 'Freyja',
                residents: 'Half of those who die in battle',
                description: 'Field of the Host'
            },
            helheim: {
                ruler: 'Hel (daughter of Loki)',
                residents: 'Those who die of sickness, old age, not in battle',
                description: 'Cold, misty, neither reward nor punishment',
                special: 'Nastrond (shore of corpses) for oath-breakers'
            },
            ran: {
                ruler: 'Ran (sea goddess)',
                residents: 'Those who die at sea',
                realm: 'Beneath the waves'
            }
        },
        journey: {
            bridge: 'Gjallarbru (bridge to Hel)',
            guardian: 'Modgud (maiden guarding bridge)',
            gates: 'Helgrind (gates of Hel)'
        },
        eschatology: {
            ragnarok: 'Twilight of gods - end and rebirth of world',
            survival: 'Few gods and humans survive to new world'
        }
    },

    buddhist_afterlife: {
        bardo: {
            description: 'Intermediate state between death and rebirth',
            duration: 'Up to 49 days',
            stages: [
                'Chikhai Bardo (moment of death) - clear light',
                'Chonyid Bardo (visions based on karma)',
                'Sidpa Bardo (seeking rebirth)'
            ],
            text: 'Bardo Thodol (Tibetan Book of the Dead)'
        },
        sixRealms: {
            deva: 'Gods - long life, pleasure, but still in samsara',
            asura: 'Demigods - jealousy and conflict',
            human: 'Best for achieving enlightenment',
            animal: 'Ignorance and instinct',
            preta: 'Hungry ghosts - unfulfilled craving',
            naraka: 'Hell realms - intense suffering'
        },
        karma: {
            determinant: 'Intentional actions determine rebirth',
            types: 'Good karma → higher realms; Bad karma → lower realms',
            liberation: 'Only through enlightenment'
        },
        nirvana: {
            description: 'Liberation from samsara',
            meaning: 'Extinction of greed, hatred, delusion',
            state: 'Beyond description, not annihilation, not heaven'
        }
    },

    christian_afterlife: {
        death: {
            separation: 'Soul separates from body',
            sleep: 'Some traditions: soul sleeps until resurrection',
            immediate: 'Catholic/Orthodox: particular judgment immediately'
        },
        destinations: {
            heaven: {
                description: 'Eternal communion with God',
                beatificVision: 'Direct experience of God\'s presence',
                newJerusalem: 'Revelation 21-22 imagery',
                characteristics: 'No death, pain, tears'
            },
            hell: {
                description: 'Eternal separation from God',
                punishment: 'Varies by tradition (literal fire vs metaphorical)',
                eternity: 'Permanent state',
                inhabitants: 'Those who reject God'
            },
            purgatory: {
                tradition: 'Catholic/Orthodox',
                purpose: 'Purification before heaven',
                temporary: 'Not eternal',
                prayers: 'Living can pray for souls in purgatory'
            }
        },
        resurrection: {
            general: 'All will be bodily resurrected',
            judgment: 'Final judgment at Christ\'s return',
            newCreation: 'New heaven and new earth',
            eternal: 'Final state for all'
        },
        eschatology: {
            secondComing: 'Christ returns',
            millennialViews: 'Pre/Post/Amillennialism',
            finalBattle: 'Satan\'s defeat',
            consummation: 'God\'s kingdom fully realized'
        }
    },

    babylonian_afterlife: {
        underworld: {
            name: 'Irkalla or Kur',
            rulers: 'Ereshkigal and Nergal',
            description: 'Dark, dreary, dusty',
            equality: 'All dead go here regardless of deeds'
        },
        journey: {
            descent: 'Through seven gates',
            gates: 'Must remove items at each gate',
            noReturn: 'Dead cannot return (except in myths)'
        },
        existence: {
            appearance: 'Shadowy, clothed in feathers like birds',
            sustenance: 'Eat dust and clay',
            activities: 'Diminished existence',
            comfort: 'Only through offerings from living'
        },
        texts: ['Descent of Ishtar', 'Gilgamesh\'s journey'],
        themes: ['Equality in death', 'No reward/punishment', 'Bleak existence']
    },

    hindu_afterlife: {
        death: {
            atman: 'Eternal soul continues',
            departure: 'Soul exits body through chakras'
        },
        judgment: {
            yama: 'Lord of death',
            chitragupta: 'Keeps record of karma',
            assessment: 'Review of life\'s karma'
        },
        temporary: {
            swarga: 'Heavenly realm for good karma',
            naraka: 'Hell realms for bad karma',
            duration: 'Finite stay based on karma balance'
        },
        rebirth: {
            samsara: 'Cycle of birth, death, rebirth',
            karma: 'Determines next birth',
            castes: 'Can be born in different stations',
            forms: 'Can be human, animal, divine, etc.'
        },
        liberation: {
            moksha: 'Freedom from samsara',
            methods: 'Jnana (knowledge), Bhakti (devotion), Karma (action), Raja (meditation)',
            result: 'Union with Brahman, end of rebirth'
        }
    },

    chinese_afterlife: {
        diyu: {
            description: '18 levels of hell',
            king: 'King Yama (Yanluo)',
            judges: '10 Kings of Hell',
            punishment: 'Based on sins committed',
            duration: 'Temporary, then rebirth'
        },
        journey: {
            bridge: 'Naihe Bridge',
            drink: 'Meng Po\'s soup (forgets past life)',
            bureaucracy: 'Underworld mirrors earthly government'
        },
        ancestorWorship: {
            importance: 'Maintain relationship with dead',
            offerings: 'Food, joss paper, incense',
            festivals: 'Qingming, Ghost Festival',
            filialPiety: 'Care for ancestors\' spirits'
        },
        realms: {
            heaven: 'Various celestial bureaucracies',
            earth: 'Living realm',
            underworld: 'Diyu',
            immortality: 'Through cultivation, become xian (immortal)'
        }
    },

    islamic_afterlife: {
        death: {
            extraction: 'Angel of death (Azrael) extracts soul',
            questioning: 'Munkar and Nakir question in grave',
            barzakh: 'Intermediate realm until Day of Judgment'
        },
        resurrection: {
            yawm: 'Day of Judgment (Yawm al-Qiyamah)',
            trumpet: 'Israfil blows trumpet',
            gathering: 'All resurrected for judgment'
        },
        judgment: {
            scales: 'Deeds weighed (Mizan)',
            book: 'Book of deeds given (right hand = saved, left = damned)',
            intercession: 'Prophet Muhammad may intercede',
            bridge: 'Sirat bridge over hell - sharp as sword'
        },
        destinations: {
            jannah: {
                description: 'Paradise gardens',
                levels: 'Seven levels, highest is Firdaus',
                pleasures: 'Rivers, fruits, spouses, God\'s presence',
                eternal: 'Forever'
            },
            jahannam: {
                description: 'Hell fire',
                levels: 'Seven levels of varying severity',
                punishments: 'Fire, boiling water, scorching wind',
                duration: 'Eternal for unbelievers, temporary for sinful Muslims (debated)'
            }
        }
    },

    persian_afterlife: {
        death: {
            soul: 'Urvan (soul) lingers three days',
            consciousness: 'Remains aware'
        },
        journey: {
            bridge: 'Chinvat Bridge (Bridge of Judgment)',
            width: 'Widens for righteous, narrows for wicked',
            crossing: 'Guided by conscience (Daena)',
            judgment: 'Rashnu weighs deeds'
        },
        destinations: {
            bestExistence: {
                description: 'Heaven for followers of Asha',
                ruler: 'Ahura Mazda',
                experience: 'Bliss, light, proximity to God'
            },
            houseOfLies: {
                description: 'Hell for followers of Druj',
                experience: 'Darkness, suffering, bad food',
                isolation: 'Separated from God'
            },
            hamistagan: {
                description: 'Purgatory for those balanced',
                duration: 'Until final renovation'
            }
        },
        frashokereti: {
            description: 'Final renovation of world',
            resurrection: 'All resurrected bodily',
            purification: 'Molten metal purifies all',
            victory: 'Evil finally defeated',
            paradise: 'Earth becomes paradise forever'
        }
    }
};

// Realm/cosmological structure enrichments
const realmEnrichments = {
    egyptian_duat: {
        description: 'The Egyptian underworld through which the sun god Ra travels nightly and souls of the dead must navigate',
        structure: {
            hours: '12 hours of night, each with challenges',
            regions: [
                'First Hour: Entrance, meeting gods',
                'Second Hour: Waters of Osiris',
                'Third Hour: Stream of Osiris',
                'Fourth Hour: Difficult paths',
                'Fifth Hour: Chamber of Sokar',
                'Sixth Hour: Deep dark',
                'Seventh Hour: Serpent Apophis attacks',
                'Eighth Hour: Clothing for blessed',
                'Ninth Hour: Boat rowers',
                'Tenth Hour: Preparation',
                'Eleventh Hour: Judgment preparation',
                'Twelfth Hour: Rebirth/Resurrection'
            ]
        },
        inhabitants: ['Ra in solar barque', 'Deceased souls', 'Gods and demons', 'Apophis (chaos serpent)'],
        dangers: ['Demons', 'Gates with guardians', 'Apophis', 'Fire lakes', 'Darkness'],
        texts: ['Amduat', 'Book of Gates', 'Book of Caverns']
    },

    greek_underworld: {
        geography: {
            rivers: {
                styx: 'River of hatred - boundary, oath river',
                acheron: 'River of woe',
                cocytus: 'River of lamentation',
                phlegethon: 'River of fire',
                lethe: 'River of forgetfulness'
            },
            regions: {
                elysium: 'Paradise for heroes',
                asphodel: 'Fields for ordinary souls',
                tartarus: 'Deep pit for punishment',
                erebus: 'Darkness, primordial region'
            },
            features: {
                gate: 'Guarded by Cerberus',
                palace: 'Hades and Persephone\'s throne',
                judges: 'Three judges determine fate'
            }
        },
        inhabitants: {
            rulers: ['Hades', 'Persephone'],
            guardians: ['Cerberus', 'Charon'],
            judges: ['Minos', 'Rhadamanthus', 'Aeacus'],
            residents: 'All human souls (shades)'
        }
    },

    norse_yggdrasil: {
        description: 'The World Tree, cosmic ash connecting all nine realms',
        structure: {
            roots: [
                'One to Asgard (well of Urd)',
                'One to Jotunheim (well of Mimir)',
                'One to Niflheim (well of Hvergelmir)'
            ],
            trunk: 'Supports all realms',
            branches: 'Reach into heavens'
        },
        inhabitants: {
            ratatosk: 'Squirrel running up and down, carrying insults',
            nidhogg: 'Dragon gnawing at roots',
            stags: 'Four stags eating leaves',
            eagle: 'Unnamed eagle in branches',
            norns: 'Three fate goddesses at Urd\'s well'
        },
        wells: {
            urd: 'Well of fate - Norns water tree here',
            mimir: 'Well of wisdom - Odin sacrificed eye',
            hvergelmir: 'Bubbling cauldron - source of rivers'
        },
        symbolism: ['Axis mundi', 'Connection of realms', 'Cosmic order', 'Life and death'],
        fate: 'Will survive Ragnarok, shelter survivors'
    },

    buddhist_samsara: {
        description: 'The cycle of birth, death, and rebirth driven by karma',
        mechanism: {
            karma: 'Intentional actions create consequences',
            rebirth: 'Consciousness continues in new form',
            ignorance: 'Root cause of perpetuation',
            craving: 'Attachment drives rebirth'
        },
        sixRealms: {
            structure: 'Wheel of existence (Bhavachakra)',
            movement: 'Beings move between realms',
            impermanence: 'All realms subject to change'
        },
        escape: {
            nirvana: 'Liberation from cycle',
            enlightenment: 'Seeing true nature of reality',
            cessation: 'End of craving and ignorance'
        },
        depiction: {
            wheel: 'Held by Yama (death)',
            center: 'Three poisons: greed, hatred, ignorance',
            sixSections: 'Six realms of rebirth'
        }
    },

    persian_chinvat_bridge: {
        description: 'The Bridge of Judgment that all souls must cross',
        location: 'Between earth and afterlife realms',
        mechanism: {
            appearance: 'Changes based on soul\'s deeds',
            righteous: 'Widens to broad path, maiden (Daena) guides',
            wicked: 'Narrows to razor edge, old hag appears',
            result: 'Crossing = heaven, falling = hell'
        },
        judgment: {
            judges: ['Mithra (covenant)', 'Sraosha (obedience)', 'Rashnu (justice)'],
            weighing: 'Deeds weighed on scales',
            criteria: 'Adherence to Asha vs Druj'
        },
        eschatology: {
            temporary: 'All souls cross until Frashokereti',
            final: 'After renovation, all purified and saved'
        }
    },

    hindu_kshira_sagara: {
        description: 'The cosmic ocean of milk',
        churning: {
            event: 'Samudra Manthan (churning of ocean)',
            participants: 'Devas (gods) and Asuras (demons)',
            tool: 'Mount Mandara as churning rod, Vasuki serpent as rope',
            support: 'Vishnu as Kurma (tortoise) avatar supports mountain'
        },
        products: [
            'Amrita (nectar of immortality)',
            'Lakshmi (goddess of wealth)',
            'Various treasures and beings',
            'Halahala (deadly poison - swallowed by Shiva)'
        ],
        symbolism: ['Cosmic cooperation', 'Churning of consciousness', 'Hidden treasures within'],
        vishnu: {
            abode: 'Vishnu reclines on Shesha',
            creation: 'Brahma emerges from lotus from Vishnu\'s navel',
            preservation: 'Vishnu maintains cosmic order from here'
        }
    }
};

// Philosophical concept enrichments
const philosophicalEnrichments = {
    buddhist_dependent_origination: {
        sanskrit: 'Pratityasamutpada',
        meaning: 'All phenomena arise dependent on causes and conditions',
        twelveLinks: [
            { name: 'Ignorance (Avidya)', causes: 'Formations' },
            { name: 'Formations (Samskara)', causes: 'Consciousness' },
            { name: 'Consciousness (Vijnana)', causes: 'Name-and-form' },
            { name: 'Name-and-form (Namarupa)', causes: 'Six sense bases' },
            { name: 'Six sense bases (Salayatana)', causes: 'Contact' },
            { name: 'Contact (Sparsha)', causes: 'Feeling' },
            { name: 'Feeling (Vedana)', causes: 'Craving' },
            { name: 'Craving (Trishna)', causes: 'Clinging' },
            { name: 'Clinging (Upadana)', causes: 'Becoming' },
            { name: 'Becoming (Bhava)', causes: 'Birth' },
            { name: 'Birth (Jati)', causes: 'Aging and death' },
            { name: 'Aging and death (Jaramarana)', causes: 'Suffering' }
        ],
        implications: {
            noCreator: 'No first cause or creator needed',
            impermanence: 'All is subject to change',
            noSelf: 'No independent self (anatta)',
            liberation: 'Breaking chain leads to freedom'
        }
    },

    buddhist_karma: {
        definition: 'Intentional action that shapes future',
        types: {
            mental: 'Thoughts and intentions',
            verbal: 'Speech',
            physical: 'Bodily actions'
        },
        quality: {
            kusala: 'Wholesome karma - leads to happiness',
            akusala: 'Unwholesome karma - leads to suffering',
            neutral: 'Neither wholesome nor unwholesome'
        },
        results: {
            rebirth: 'Determines realm of rebirth',
            circumstances: 'Shapes life conditions',
            tendencies: 'Creates habitual patterns'
        },
        liberation: {
            exhaustion: 'Past karma must be exhausted',
            noNew: 'Cease creating new karma',
            wisdom: 'See karmic process clearly',
            nirvana: 'Beyond karma'
        }
    },

    buddhist_nirvana: {
        etymology: 'Extinction, blowing out',
        meaning: 'Extinction of greed, hatred, delusion',
        notions: {
            negative: 'End of suffering, end of rebirth',
            positive: 'Peace, freedom, truth',
            ineffable: 'Beyond concepts and words'
        },
        types: {
            sopadhishesa: 'With remainder - enlightened while alive',
            nirupadhishesa: 'Without remainder - at death of enlightened one'
        },
        mahayana: {
            twoKayas: 'Dharmakaya and Nirmanakaya',
            bodhisattva: 'Delay final nirvana to help others',
            sunyata: 'Emptiness - nirvana and samsara not different'
        }
    },

    persian_asha: {
        meaning: 'Truth, order, righteousness',
        opposite: 'Druj (lie, chaos, disorder)',
        cosmic: {
            principle: 'Cosmic order and natural law',
            alignment: 'Universe operates on Asha',
            divine: 'Ahura Mazda embodies Asha'
        },
        ethical: {
            truthfulness: 'Speak and live truth',
            righteousness: 'Right action and thought',
            justice: 'Fair dealing'
        },
        ritual: {
            fire: 'Fire represents Asha',
            purity: 'Maintain ritual purity',
            prayers: 'Yasna - worship of Asha'
        },
        eschatology: {
            judgment: 'Judged by adherence to Asha',
            victory: 'Asha ultimately defeats Druj',
            paradise: 'Those who follow Asha reach paradise'
        }
    },

    persian_druj: {
        meaning: 'Lie, chaos, disorder, deceit',
        opposite: 'Asha (truth)',
        cosmicEvil: {
            principle: 'Active force of chaos',
            angra_mainyu: 'Embodied by Angra Mainyu (Ahriman)',
            pollution: 'Corrupts and pollutes'
        },
        manifestations: {
            lies: 'Falsehood in speech',
            disorder: 'Social and cosmic chaos',
            impurity: 'Ritual and physical defilement',
            death: 'Corpses are druj'
        },
        combat: {
            avoidance: 'Shun druj in thought, word, deed',
            purification: 'Cleanse from druj',
            fire: 'Fire purifies from druj',
            judgment: 'Those following druj condemned'
        }
    },

    christian_grace: {
        definition: 'Unmerited favor and empowerment from God',
        types: {
            common: 'Given to all humanity (rain, sun, conscience)',
            saving: 'Enables salvation',
            sanctifying: 'Transforms believer',
            actual: 'Moment-by-moment help'
        },
        theology: {
            protestant: 'Sola gratia - grace alone saves',
            catholic: 'Grace and cooperation',
            orthodox: 'Theosis - becoming like God through grace'
        },
        means: {
            sacraments: 'Channels of grace (Catholic/Orthodox)',
            word: 'Scripture conveys grace',
            prayer: 'Communion with God',
            faith: 'Received through faith'
        },
        transformation: {
            justification: 'Declared righteous',
            sanctification: 'Made holy',
            glorification: 'Future perfection'
        }
    },

    christian_trinity: {
        definition: 'One God in three persons',
        persons: {
            father: 'Source, creator, sender',
            son: 'Word, savior, image of God',
            spirit: 'Sanctifier, presence, power'
        },
        oneness: {
            essence: 'One divine nature/essence',
            unity: 'Perfect unity of will and purpose',
            monotheism: 'Not three gods but one'
        },
        distinctions: {
            persons: 'Three distinct persons',
            relations: 'Father begets Son, Spirit proceeds',
            roles: 'Distinct functions (economy of salvation)'
        },
        heresies: {
            modalism: 'Rejected - not just modes',
            arianism: 'Rejected - Son fully divine',
            tritheism: 'Rejected - not three gods'
        },
        mystery: {
            ineffable: 'Beyond full comprehension',
            revealed: 'Known through revelation',
            analogies: 'Water/ice/steam, sun/light/heat (limited)'
        }
    },

    sumerian_me: {
        definition: 'Divine powers, decrees, fundamental attributes of civilization',
        nature: {
            divine: 'Belong to gods',
            transferable: 'Can be stolen or given',
            powerful: 'Grant authority and ability',
            numerous: 'Over 100 different me'
        },
        examples: [
            'Kingship',
            'Priestly office',
            'Truth',
            'Descent into underworld',
            'Sexual intercourse',
            'Prostitution',
            'Art',
            'Music',
            'Craftsmanship',
            'Wisdom',
            'Victory',
            'Judgment'
        ],
        myths: {
            inanna: 'Inanna receives/steals me from Enki',
            transfer: 'Brought to Uruk',
            power: 'Makes Uruk great city'
        },
        significance: {
            civilization: 'Foundation of civilized life',
            divine_order: 'Structure of reality',
            authority: 'Source of legitimate power'
        }
    },

    egyptian_maat: {
        definition: 'Truth, justice, order, balance, harmony',
        goddess: 'Personified as goddess Ma\'at',
        cosmic: {
            principle: 'Fundamental cosmic order',
            creation: 'Established at creation',
            maintenance: 'Must be constantly maintained',
            opposite: 'Isfet (chaos, disorder)'
        },
        ethical: {
            truth: 'Speak and live truth',
            justice: 'Fair dealing',
            reciprocity: 'Give and receive fairly',
            balance: 'Maintain equilibrium'
        },
        royal: {
            pharaoh: 'King upholds Ma\'at',
            duty: 'Maintain order in realm',
            offerings: 'King offers Ma\'at to gods',
            legitimacy: 'Rule justified by Ma\'at'
        },
        afterlife: {
            judgment: 'Heart weighed against feather of Ma\'at',
            declaration: 'Declare adherence to Ma\'at',
            requirement: 'Must have lived in Ma\'at to pass'
        }
    }
};

// Function to enrich entity based on type and ID
function enrichEntity(entity) {
    const enriched = { ...entity };
    const id = entity.id;

    // Enrich creation myths
    if (id.includes('creation')) {
        const key = id;
        if (creationMythEnrichments[key]) {
            enriched.cosmologicalType = 'creation_myth';
            enriched.creationDetails = creationMythEnrichments[key];
        }
    }

    // Enrich afterlife concepts
    if (id.includes('afterlife')) {
        const key = id;
        if (afterlifeEnrichments[key]) {
            enriched.cosmologicalType = 'afterlife';
            enriched.afterlifeDetails = afterlifeEnrichments[key];
        }
    }

    // Enrich realms
    if (realmEnrichments[id]) {
        enriched.cosmologicalType = 'realm';
        enriched.realmDetails = realmEnrichments[id];
    }

    // Enrich philosophical concepts
    if (philosophicalEnrichments[id]) {
        enriched.cosmologicalType = 'philosophical_concept';
        enriched.philosophicalDetails = philosophicalEnrichments[id];
    }

    // Add general cosmological categorization
    if (!enriched.cosmologicalType) {
        if (entity.type === 'concept') {
            if (id.includes('creation')) enriched.cosmologicalType = 'creation_myth';
            else if (id.includes('afterlife')) enriched.cosmologicalType = 'afterlife';
            else enriched.cosmologicalType = 'cosmological_concept';
        } else if (entity.type === 'realm') {
            enriched.cosmologicalType = 'realm_or_plane';
        } else if (entity.type === 'place') {
            enriched.cosmologicalType = 'sacred_place';
        }
    }

    // Add enrichment metadata
    enriched.metadata = {
        ...enriched.metadata,
        polishedBy: 'agent_10_cosmology',
        polishedAt: new Date().toISOString(),
        enrichmentVersion: '1.0'
    };

    return enriched;
}

// Process and organize entities
const enhanced = {
    babylonian: [],
    buddhist: [],
    celtic: [],
    chinese: [],
    christian: [],
    egyptian: [],
    greek: [],
    hindu: [],
    islamic: [],
    norse: [],
    persian: [],
    roman: [],
    sumerian: [],
    tarot: [],
    other: []
};

let totalEnriched = 0;
cosmologyData.forEach(entity => {
    const enriched = enrichEntity(entity);
    const myth = entity.mythology || 'other';

    if (enhanced[myth]) {
        enhanced[myth].push(enriched);
        totalEnriched++;
    } else {
        enhanced.other.push(enriched);
        totalEnriched++;
    }
});

// Save enhanced entities by mythology
const outputDir = path.join(__dirname, '../firebase-assets-enhanced/cosmology');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('\n💾 Saving enhanced cosmology assets...\n');

Object.keys(enhanced).forEach(mythology => {
    if (enhanced[mythology].length > 0) {
        const mythDir = path.join(outputDir, mythology);
        if (!fs.existsSync(mythDir)) {
            fs.mkdirSync(mythDir, { recursive: true });
        }

        const filePath = path.join(mythDir, 'cosmology.json');
        fs.writeFileSync(filePath, JSON.stringify(enhanced[mythology], null, 2));
        console.log(`   ✓ ${mythology}: ${enhanced[mythology].length} entities`);
    }
});

// Save combined file
const allEnhanced = cosmologyData.map(enrichEntity);
fs.writeFileSync(
    path.join(outputDir, '_all_enhanced.json'),
    JSON.stringify(allEnhanced, null, 2)
);

console.log(`\n✅ Enhanced ${totalEnriched} cosmology entities\n`);

// Generate summary statistics
const stats = {
    total: totalEnriched,
    byMythology: {},
    byType: {},
    byCosmologicalType: {}
};

Object.keys(enhanced).forEach(myth => {
    if (enhanced[myth].length > 0) {
        stats.byMythology[myth] = enhanced[myth].length;

        enhanced[myth].forEach(entity => {
            const type = entity.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            const cosmoType = entity.cosmologicalType || 'uncategorized';
            stats.byCosmologicalType[cosmoType] = (stats.byCosmologicalType[cosmoType] || 0) + 1;
        });
    }
});

console.log('📊 Summary Statistics:\n');
console.log('By Cosmological Type:');
Object.entries(stats.byCosmologicalType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
});

console.log('\n🎯 Polishing complete!\n');

// Save summary
fs.writeFileSync(
    path.join(outputDir, 'polishing-summary.json'),
    JSON.stringify(stats, null, 2)
);

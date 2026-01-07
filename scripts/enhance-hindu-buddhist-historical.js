#!/usr/bin/env node

/**
 * Historical Enhancement Script for Hindu and Buddhist Deities
 *
 * This script enriches deity entities with comprehensive historical metadata:
 * - Vedic/Epic period origins and development
 * - Sectarian affiliations and regional variations
 * - Scriptural sources and textual references
 * - Iconographic evolution and variants
 * - Sacred mantras and ritual associations
 * - Tantric and mystical dimensions
 * - Regional adaptations (Tibetan, East Asian, South Asian)
 */

const fs = require('fs');
const path = require('path');

// Historical metadata for Hindu deities
const HINDU_DEITIES_HISTORY = {
  brahma: {
    id: 'brahma',
    historicalDevelopment: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'Prajapati (Lord of Creatures) was the primary creator deity in Vedic texts',
        primaryTexts: ['Rigveda 10.121 (Hiranyagarbha hymn)', 'Brahmanas'],
        characteristics: ['Role eventually transferred to Brahma', 'Associated with cosmic sacrifice', 'Vedic ritual theology']
      },
      epic_period: {
        era: '500 BCE - 500 CE',
        description: 'Brahma emerges as distinct deity in Mahabharata and Ramayana',
        primaryTexts: ['Mahabharata', 'Ramayana', 'Harivamsa'],
        characteristics: ['Becomes one of Trimurti', 'Associated with creation aspect of cosmic cycle', 'Limited worship even then']
      },
      puranic_period: {
        era: '500-1500 CE',
        description: 'Brahma Purana and other Puranas establish mythology but show decreasing worship',
        primaryTexts: ['Brahma Purana', 'Brahmanda Purana', 'Vishnu Purana'],
        characteristics: ['Curse by Saraswati (decreasing worship)', 'Role in cosmic creation cycles', 'Few temples dedicated to him alone']
      }
    },
    scripturalSources: {
      vedic: [
        { text: 'Rigveda 10.121', context: 'Hiranyagarbha (Golden Egg) hymn', importance: 'Primary' },
        { text: 'Taittiriya Brahmana', context: 'Prajapati as creator', importance: 'Primary' },
        { text: 'Upanishads', context: 'Brahman as ultimate reality', importance: 'Foundational' }
      ],
      epic: [
        { text: 'Mahabharata (Mokshadharma Parva)', context: 'Cosmology and creation', importance: 'Major' },
        { text: 'Ramayana (Bala Kanda)', context: 'Creation narratives', importance: 'Major' }
      ],
      puranic: [
        { text: 'Brahma Purana', context: 'Primary sacred text', importance: 'Major' },
        { text: 'Brahmanda Purana', context: 'Cosmic dimensions', importance: 'Major' },
        { text: 'Bhagavata Purana', context: 'Minor references', importance: 'Secondary' }
      ]
    },
    sectarianAffiliations: {
      primary: ['Non-sectarian (Pan-Hindu)', 'Smarta tradition (non-sectarian worship)'],
      secondary: ['Mentioned in all major traditions'],
      regional: {
        north_india: 'Minimal worship, mostly mythological',
        south_india: 'Limited temple presence',
        central_india: 'Associated with Khajuraho temples (medieval period)'
      }
    },
    iconographicEvolution: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'Conceptual rather than visual - Prajapati as cosmic principle',
        representations: ['Described in hymns', 'No established iconographic form']
      },
      medieval_period: {
        era: '500-1500 CE',
        description: 'Standardized form emerges',
        representations: [
          'Four heads facing cardinal directions',
          'Red complexion in most traditions',
          'Seated on lotus or hamsa (swan)',
          'Holding Vedas, prayer beads, and ladle'
        ]
      },
      regional_variations: {
        north_indian: 'Often depicted with celestial crown, more ornate',
        south_indian: 'Simpler form, emphasis on four Vedas',
        tibetan_buddhist: 'Rare appearances in Tibetan art'
      }
    },
    mantraAssociations: {
      primary_mantras: [
        { mantra: 'Om Brahma Namaha', meaning: 'Salutation to Brahma', usage: 'Daily worship' },
        { mantra: 'Brahma Gayatri', meaning: 'Sacred verse honoring Brahma', usage: 'Vedic ritual' }
      ],
      ritual_contexts: [
        'Opening ceremonies of creation rituals',
        'Naming ceremonies (invoking wisdom)',
        'Temple inaugurations'
      ]
    },
    tantricDimensions: {
      rarity: 'Not central to Tantric traditions',
      mentions: 'Appears in some Tantra texts as lower cosmic function',
      chakra_association: 'Not specifically associated with chakra system'
    },
    regionalAdaptations: {
      tibetan_buddhist: 'Absorbed as minor deity or wisdom aspect',
      east_asian: 'Minimal presence in Chinese/Japanese Buddhism',
      southeast_asian: 'Khmer temples show syncretic forms'
    }
  },

  shiva: {
    id: 'shiva',
    historicalDevelopment: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'Rudra is proto-form of Shiva - fierce deity of storms and healing',
        primaryTexts: ['Rigveda (hymn to Rudra)', 'Yajur Veda', 'Atharva Veda'],
        characteristics: [
          'Rudra = "The Roarer" (storm god)',
          'Compassionate healer (Shambhu = "Gracious")',
          'Associated with wild mountains',
          'Destroyer of demons'
        ]
      },
      upanishadic_period: {
        era: '800-500 BCE',
        description: 'Elevation of Rudra/Shiva as supreme consciousness (Brahman)',
        primaryTexts: ['Svetasvatara Upanishad', 'Taittiriya Upanishad'],
        characteristics: ['Identified with Brahman', 'Master of yoga and meditation', 'Universal consciousness']
      },
      epic_period: {
        era: '500 BCE - 500 CE',
        description: 'Shiva becomes one of Trimurti; tantric elements begin',
        primaryTexts: ['Mahabharata (Shiva Sahasranama)', 'Ramayana (multiple appearances)'],
        characteristics: ['1000 names codified in Mahabharata', 'Cosmic dancer (Nataraja)', 'Destroyer and regenerator']
      },
      puranic_period: {
        era: '500-1500 CE',
        description: 'Peak of Shaiva theology; integration of Tantric traditions',
        primaryTexts: ['Shiva Purana', 'Vayu Purana', 'Linga Purana', 'Agama texts'],
        characteristics: [
          'Shaivism becomes major tradition',
          'Tantra fully incorporated',
          'Lingam worship standardized',
          'South Indian dominance begins'
        ]
      }
    },
    scripturalSources: {
      vedic: [
        { text: 'Rigveda (hymn 2.33)', context: 'Prayer to Rudra', importance: 'Primary' },
        { text: 'Atharva Veda (10.8)', context: 'Rudra as universal lord', importance: 'Primary' },
        { text: 'Taittiriya Aranyaka', context: 'Shiva Rudra identification', importance: 'Primary' }
      ],
      upanishadic: [
        { text: 'Svetasvatara Upanishad', context: 'Brahman identification, yoga', importance: 'Foundational' },
        { text: 'Katha Upanishad', context: 'Mention in meditation context', importance: 'Secondary' }
      ],
      epic: [
        { text: 'Mahabharata (Shanti Parva 13.14)', context: 'Shiva Sahasranama (1000 names)', importance: 'Major' },
        { text: 'Ramayana (Aranya Kanda)', context: 'Meeting Shiva narratives', importance: 'Major' }
      ],
      puranic: [
        { text: 'Shiva Purana', context: 'Primary sacred text', importance: 'Major' },
        { text: 'Vayu Purana', context: 'Cosmic cycle role', importance: 'Major' },
        { text: 'Bhagavata Purana', context: 'Appearance and relationships', importance: 'Secondary' }
      ],
      tantric: [
        { text: 'Tantra tradition (Kashmir Shaivism)', context: 'Non-dual consciousness', importance: 'Major' },
        { text: 'Shakta tradition', context: 'Complement to Shakti (cosmic energy)', importance: 'Major' }
      ]
    },
    sectarianAffiliations: {
      primary: [
        'Shaivism (exclusive worship)',
        'Kashmir Shaivism (Advaita Vedanta focus)',
        'Shaivism schools (Southern and Northern)',
        'Tantric traditions'
      ],
      secondary: [
        'Smarta tradition (accepts all major deities)',
        'Bhakti movements (especially South Indian)'
      ],
      regional: {
        north_india: 'Strong presence, especially Himalayas and Kashmir',
        south_india: 'Dominant tradition, especially Tamil Nadu temples',
        central_india: 'Major presence in Madhya Pradesh temples',
        nepal: 'Pashupatinath as supreme site',
        west_india: 'Significant in Gujarat and Rajasthan'
      }
    },
    iconographicEvolution: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'Rudra described in poetry, no standardized image',
        representations: ['Fierce storm deity', 'Red or blue complexion', 'Associated with weapons']
      },
      classical_period: {
        era: '100 BCE - 500 CE',
        description: 'Nataraja and ascetic forms develop',
        representations: [
          'Nataraja: cosmic dancer form',
          'Ascetic: meditating on mountains',
          'Linga: abstract symbolic form'
        ]
      },
      medieval_period: {
        era: '500-1500 CE',
        description: 'Highly detailed iconography standardized',
        representations: [
          'Third eye of destruction',
          'Crescent moon and Ganga in matted hair',
          'Trishula (trident) as weapon',
          'Damaru (drum) for rhythm of creation',
          'Tiger skin or serpent garlands',
          'Ash-covered body (vibhuti)'
        ]
      },
      regional_variations: {
        chola_period_bronzes: 'Most celebrated artistic tradition (9-13th centuries)',
        tamil_nadu: 'Emphasis on devotional intimacy and grace',
        kashmiri: 'Subtle, philosophical representations',
        rajasthani: 'Bold, dynamic warrior aspects'
      }
    },
    mantraAssociations: {
      primary_mantras: [
        { mantra: 'Om Namah Shivaya', meaning: 'Salutation to Shiva', usage: 'Daily worship, meditation' },
        { mantra: 'Maha Mrityunjaya Mantra', meaning: 'Great death-conquering mantra', usage: 'Healing, longevity ritual' },
        { mantra: 'Shiva Gayatri', meaning: 'Sacred verse to Shiva', usage: 'Vedic ritual' },
        { mantra: 'Rudra Gayatri', meaning: 'Rudra verse', usage: 'Vedic chanting' }
      ],
      ritual_contexts: [
        'Maha Shivaratri festival',
        'Pradosham (13th day worships)',
        'Shravan month entire month dedication',
        'Destruction rituals (Tantric)',
        'Meditation and yoga practices'
      ],
      chakra_associations: [
        'Muladhara (root) - basic consciousness',
        'Sahasrara (crown) - ultimate realization'
      ]
    },
    tantricDimensions: {
      prominence: 'Central to Tantric traditions',
      major_forms: [
        'Bhairava (fierce destructive form)',
        'Mahakala (time and death)',
        'Maheshvara (cosmic lord)',
        'Paramashiva (supreme consciousness)'
      ],
      tantric_practices: [
        'Kundalini yoga (awakening energy)',
        'Chakra meditation',
        'Mantra repetition (japa)',
        'Visualization practices'
      ],
      non_dual_philosophy: 'Recognized as identity of individual consciousness (atman) and ultimate reality (Brahman) in Kashmir Shaivism'
    },
    regionalAdaptations: {
      tibetan_buddhist: {
        role: 'Integrated as Mahakala (Destroyer of ignorance)',
        forms: ['Mahakala protector deity', 'Wrathful aspects used in tantra'],
        significance: 'Central to Tibetan Buddhist tantric practice'
      },
      japanese: {
        role: 'Daikoku (god of wealth) from Shiva/Mahakala',
        significance: 'Seven Lucky Gods tradition'
      },
      chinese: {
        role: 'Dà Hēi Tiān (Great Black Heaven)',
        context: 'Absorbed into folk religion'
      }
    }
  },

  vishnu: {
    id: 'vishnu',
    historicalDevelopment: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'Minor sun deity; grows in importance through Vedic period',
        primaryTexts: ['Rigveda (Vishnu Sukta 1.22)', 'Yajur Veda'],
        characteristics: [
          'Viṣṇu = "The Pervader"',
          'Associated with solar deity Surya',
          'Cosmic strider (three steps)',
          'Protector of sacrifice (yajna)'
        ]
      },
      upanishadic_period: {
        era: '800-500 BCE',
        description: 'Rise of Vishnu worship as supreme god',
        primaryTexts: ['Katha Upanishad', 'Taittiriya Upanishad'],
        characteristics: ['Growing elevation above other deities', 'Association with maintenance of cosmic order']
      },
      epic_period: {
        era: '500 BCE - 500 CE',
        description: 'Vishnu becomes supreme lord (Narayana); avatars fully developed',
        primaryTexts: ['Mahabharata (Bhagavad Gita)', 'Ramayana (entirely built around Rama avatar)', 'Harivamsa'],
        characteristics: [
          'Krishna appears as major avatar',
          'Bhagavad Gita theology (dharma)',
          'Avatar doctrine fully codified',
          'Supremacy clearly established'
        ]
      },
      puranic_period: {
        era: '500-1500 CE',
        description: 'Vaishnavism becomes major tradition; diverse schools develop',
        primaryTexts: ['Bhagavata Purana', 'Vishnu Purana', 'Padma Purana', 'Garuda Purana'],
        characteristics: [
          'Ten major avatars standardized',
          'Bhakti devotionalism peak',
          'Vaishnavism major tradition',
          'Regional schools (Ramanuja, Madhva, Vallabha)',
          'Integration of Krishna and Rama worship'
        ]
      }
    },
    scripturalSources: {
      vedic: [
        { text: 'Rigveda 1.22 (Vishnu Sukta)', context: 'Three cosmic steps', importance: 'Primary' },
        { text: 'Yajur Veda', context: 'Ritual protection role', importance: 'Primary' }
      ],
      upanishadic: [
        { text: 'Taittiriya Upanishad', context: 'Narayana identification', importance: 'Primary' },
        { text: 'Katha Upanishad', context: 'Cosmic knowledge', importance: 'Secondary' }
      ],
      epic: [
        { text: 'Bhagavad Gita (2.2-2.25)', context: 'Krishna as Vishnu avatar, dharma teaching', importance: 'Foundational' },
        { text: 'Ramayana (entirely)', context: 'Rama as Vishnu avatar', importance: 'Foundational' },
        { text: 'Mahabharata (Visnu Sahasranama, Shanti Parva)', context: '1000 names of Vishnu', importance: 'Major' }
      ],
      puranic: [
        { text: 'Bhagavata Purana', context: 'Primary sacred text, Krishna focus', importance: 'Major' },
        { text: 'Vishnu Purana', context: 'Comprehensive mythology', importance: 'Major' },
        { text: 'Padma Purana', context: 'Avatar details', importance: 'Secondary' }
      ]
    },
    sectarianAffiliations: {
      primary: [
        'Vaishnavism (exclusive worship)',
        'Sri Vaishnavism (Ramanuja - Tamil Nadu)',
        'Dvaita Vaishnavism (Madhva - Karnataka)',
        'Suddhadvaita (Vallabha - Western India)',
        'Gaudiya Vaishnavism (Bengal - Krishna focus)',
        'Bhakti movements'
      ],
      secondary: [
        'Smarta tradition (accepts major deities)',
        'Many regional bhakti traditions'
      ],
      regional: {
        south_india: 'Dominant, especially Tamil Nadu (Sri Vaishnavism)',
        west_india: 'Strong presence, especially Gujarat and Rajasthan',
        north_india: 'Major tradition, especially Uttar Pradesh (Krishna region)',
        bengal: 'Gaudiya Vaishnavism and Krishna worship dominant',
        nepal: 'Pashupatinath (Shiva) dominant, but Vishnu well-represented'
      }
    },
    iconographicEvolution: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'Textual description rather than visual form',
        representations: ['Cosmic strider', 'Sun-associated deity', 'Three cosmic steps']
      },
      classical_period: {
        era: '100 BCE - 500 CE',
        description: 'Standardized with four arms emerges',
        representations: [
          'Four arms holding divine attributes',
          'Blue complexion (from later traditions)',
          'On cosmic serpent Shesha'
        ]
      },
      medieval_period: {
        era: '500-1500 CE',
        description: 'Highly detailed iconography with regional variations',
        representations: [
          'Dark blue or black complexion',
          'Four arms (Sudarshana Chakra, Panchajanya conch, Kaumodaki mace, Padma lotus)',
          'Garuda (divine eagle) as vahana',
          'Lakshmi on chest or in hand',
          'Crowned with jewels',
          'Often shown reclining on Shesha in cosmic ocean'
        ]
      },
      avatar_specific: {
        rama: 'Princely warrior form, bow and arrow',
        krishna: 'Youthful cowherd, blue complexion, flute',
        narasimha: 'Half-human, half-lion, fierce protective form',
        vamana: 'Dwarf form, humble appearance',
        matsya: 'Fish form (cosmic fish)',
        kurma: 'Turtle form (cosmic support)'
      }
    },
    mantraAssociations: {
      primary_mantras: [
        { mantra: 'Om Namo Narayanaya', meaning: 'Salutation to Narayana', usage: 'Daily worship, meditation' },
        { mantra: 'Om Ram Ramaya Namaha', meaning: 'Salutation to Rama', usage: 'Rama worship' },
        { mantra: 'Om Namo Bhagavate Vasudevaya', meaning: 'Salutation to Krishna', usage: 'Krishna bhakti' },
        { mantra: 'Vishnu Gayatri', meaning: 'Sacred verse to Vishnu', usage: 'Vedic ritual' }
      ],
      festival_contexts: [
        'Janmashtami (Krishna birth)',
        'Ram Navami (Rama birth)',
        'Diwali (celebration of Rama)',
        'Vaikuntha Ekadashi (Vishnu devotion)'
      ],
      chakra_associations: [
        'Anahata (heart) - love and devotion',
        'Vishuddha (throat) - divine communication'
      ]
    },
    tantricDimensions: {
      presence: 'Secondary in pure Tantra; important in Tantric bhakti',
      approaches: [
        'Bhakti tantra emphasizes devotion',
        'Sri Chakra tradition (feminine principle)',
        'Krishna tantra in Bengali traditions'
      ]
    },
    regionalAdaptations: {
      tibetan_buddhist: {
        role: 'Limited presence',
        forms: ['Minor aspects in some rituals'],
        significance: 'Smaller role compared to Shiva'
      },
      thai_cambodian: {
        role: 'Integrated as supreme deity in syncretic traditions',
        context: 'Hindu-Buddhist syncretism in medieval period'
      },
      indonesian: {
        role: 'Integrated into Hindu-Buddhist Balinese tradition',
        significance: 'Major deity in Balinese Hinduism'
      }
    }
  },

  krishna: {
    id: 'krishna',
    historicalDevelopment: {
      early_period: {
        era: '1000-600 BCE',
        description: 'Historical tribal hero or chieftain, gradually deified',
        primaryTexts: ['Early Vedic references', 'Rig Veda references to Krishna Devaki-putra'],
        characteristics: ['Initially a regional hero', 'Maturation cult in Mathura region', 'Incorporation into broader Hindu framework']
      },
      epic_period: {
        era: '500 BCE - 500 CE',
        description: 'Integration into Mahabharata; elevation to supreme status',
        primaryTexts: ['Mahabharata (entirely)', 'Bhagavad Gita (centrally)', 'Harivamsa (Krishna-specific)'],
        characteristics: [
          'Bhagavad Gita makes him supreme god',
          'Political and military leader role',
          'Divine wisdom teaching',
          'Charioteer to Arjuna'
        ]
      },
      puranic_period: {
        era: '500-1500 CE',
        description: 'Peak of Krishna worship; multiple traditions develop',
        primaryTexts: ['Bhagavata Purana (primary)', 'Vishnu Purana', 'Brahma Vaivarta Purana (Krishna focus)'],
        characteristics: [
          'Childhood miracles emphasized',
          'Cowherd pastimes in Vrindavan',
          'Gopi love narratives',
          'Flute and peacock feather symbols',
          'Devotional bhakti movement height'
        ]
      }
    },
    scripturalSources: {
      epic: [
        { text: 'Bhagavad Gita', context: 'Entire text, Krishna as supreme god', importance: 'Foundational' },
        { text: 'Mahabharata (especially Bhishma Parva, Shanti Parva)', context: 'Krishna as leader and counselor', importance: 'Primary' },
        { text: 'Harivamsa', context: 'Entirely about Krishna', importance: 'Major' }
      ],
      puranic: [
        { text: 'Bhagavata Purana (10th Book)', context: 'Childhood and youth narrative', importance: 'Foundational' },
        { text: 'Vishnu Purana', context: 'Avatar narrative', importance: 'Major' },
        { text: 'Brahma Vaivarta Purana', context: 'Krishna-centered mythology', importance: 'Secondary' }
      ],
      devotional: [
        { text: 'Gita Govinda (Jayadeva, 12th century)', context: 'Classical devotional poetry', importance: 'Major' },
        { text: 'Bhakti movement literatures', context: 'Regional devotional traditions', importance: 'Major' }
      ]
    },
    sectarianAffiliations: {
      primary: [
        'Krishnaism (exclusive Krishna worship)',
        'Gaudiya Vaishnavism (Bengal - emphasis on bhakti)',
        'Vallabha Sampradaya (Western India - devotion focus)',
        'Radha-Krishna worship traditions',
        'Many bhakti movements'
      ],
      secondary: [
        'Broader Vaishnavism',
        'Smarta tradition'
      ],
      regional: {
        bengal: 'Dominant through Gaudiya Vaishnavism and Ramakrishna traditions',
        western_india: 'Central to Vallabha and Swaminarayan traditions',
        north_india: 'Major especially in Mathura and Vrindavan regions',
        south_india: 'Present but less dominant than Rama',
        global: 'ISKCON spread Krishna worship worldwide'
      }
    },
    iconographicEvolution: {
      vedic_period: {
        era: '1500-500 BCE',
        description: 'No established iconography; tribal hero',
        representations: ['Warrior king', 'Political leader']
      },
      classical_period: {
        era: '100 BCE - 500 CE',
        description: 'Divine child form develops',
        representations: [
          'Child form (Bala Krishna)',
          'Cowherd form',
          'Warrior form (Mahabharata)'
        ]
      },
      medieval_period: {
        era: '500-1500 CE',
        description: 'Multiple iconic forms standardized',
        representations: [
          'Dark blue/black complexion',
          'Peacock feather crown (as cowherd)',
          'Yellow silk dhoti',
          'Flute (murali)',
          'Various positions with Radha and gopis',
          'Crowned as king in Mahabharata scenes'
        ]
      },
      modern_representations: {
        cowherd_form: 'Most popular in devotional art',
        warrior_form: 'Featured in Mahabharata and Bhagavad Gita contexts',
        royal_form: 'Diplomatic Krishna',
        lover_form: 'Radha-Krishna in Bengali and Rajasthani art'
      }
    },
    mantraAssociations: {
      primary_mantras: [
        { mantra: 'Om Namo Bhagavate Vasudevaya', meaning: 'Salutation to Krishna', usage: 'Daily worship' },
        { mantra: 'Hare Krishna Hare Krishna...', meaning: 'Krishna names, Radha-Krishna', usage: 'Bhakti chanting' },
        { mantra: 'Klim (Kamakalpa)', meaning: 'Attraction and love', usage: 'Radha-Krishna devotion' },
        { mantra: 'Krishna Gayatri', meaning: 'Sacred verse to Krishna', usage: 'Vedic meditation' }
      ],
      festival_contexts: [
        'Janmashtami (birth celebration)',
        'Holi (spring festival, Krishna theme)',
        'Gopashtami (cowherd celebration)',
        'Radha Ashtami (Radha's birth)'
      ],
      devotional_contexts: [
        'Bhajans (devotional songs)',
        'Kirtans (group chanting)',
        'Raas Leela performances',
        'Rasa circle dances'
      ]
    },
    tantricDimensions: {
      importance: 'Central to Bengali Tantric traditions',
      aspects: [
        'Radha-Krishna as divine cosmic couple (Shakti-Shiva model)',
        'Love (prema) as path to liberation',
        'Madhurya bhava (sweet relationship)',
        'Kundalini and chakra correlations'
      ],
      practices: [
        'Krishna mantra repetition',
        'Visualization of Radha-Krishna',
        'Rasa meditation (divine play)',
        'Bhakti tantra fusion'
      ]
    },
    regionalAdaptations: {
      tibetan_buddhist: { role: 'Not adopted' },
      thai_cambodian: { role: 'Limited presence', context: 'Hindu elements in syncretic traditions' },
      indonesian: { role: 'Present in Balinese Hindu tradition' },
      global_modern: {
        role: 'ISKCON and Hare Krishna movement',
        significance: 'Major religious movement worldwide'
      }
    }
  }
};

// Buddhist deities historical metadata
const BUDDHIST_DEITIES_HISTORY = {
  buddha: {
    id: 'buddha',
    historicalDevelopment: {
      historical_period: {
        era: '563-483 BCE (traditional dates); likely 480-400 BCE',
        description: 'Historical Siddhartha Gautama, founder of Buddhism',
        characteristics: [
          'Born as prince in Lumbini, Nepal',
          'Renounced worldly life',
          'Enlightenment under Bodhi Tree',
          'Taught dharma (doctrine) for 45 years',
          'Established sangha (monastic community)'
        ]
      },
      early_buddhism: {
        era: '500-200 BCE',
        description: 'Buddha remembered as historical teacher, not deity',
        texts: ['Pali Canon (Tripitaka)', 'Early sutras'],
        characteristics: [
          'Theravada tradition: Buddha as exemplary human',
          'No worship of Buddha image',
          'Emphasis on his teachings (dharma)',
          'Stupa (relic mounds) as places of reverence'
        ]
      },
      mahayana_period: {
        era: '100 BCE - 500 CE',
        description: 'Buddha elevated to cosmic, transcendent status',
        texts: ['Mahayana sutras', 'Lotus Sutra', 'Tathagatagarbha sutras'],
        characteristics: [
          'Multiple Buddhas across universes',
          'Buddha as eternal, divine being',
          'Buddha-nature in all beings',
          'Visual representations introduced',
          'Bodhisattva ideal develops'
        ]
      },
      developments_across_schools: {
        theravada: 'Historical Buddha, non-divine, exemplary teacher',
        mahayana: 'Cosmic Buddha, object of devotion, divine attributes',
        tibetan_buddhism: 'Buddha as manifestation of ultimate reality (Dharmakaya)',
        east_asian: 'Buddha worship parallel to deity worship in folk religion'
      }
    },
    scripturalSources: {
      pali_canon: [
        { text: 'Sutta Pitaka (Discourse collection)', context: 'Buddha\'s teachings', importance: 'Foundational' },
        { text: 'Dhammapada', context: 'Buddha\'s ethical teachings', importance: 'Primary' },
        { text: 'Jataka Tales', context: 'Buddha\'s past lives', importance: 'Major' }
      ],
      mahayana_sutras: [
        { text: 'Lotus Sutra (Saddharmapundarika Sutra)', context: 'Buddha as cosmic entity', importance: 'Foundational' },
        { text: 'Tathagatagarbha Sutra', context: 'Buddha-nature doctrine', importance: 'Primary' },
        { text: 'Lankavatara Sutra', context: 'Mind-only philosophy', importance: 'Secondary' }
      ],
      tibetan_texts: [
        { text: 'Tibetan Book of the Dead (Bardo Thodol)', context: 'Buddha at enlightenment', importance: 'Major' },
        { text: 'Kalachakra Tantra', context: 'Time Buddha', importance: 'Secondary' }
      ]
    },
    sectarianAffiliations: {
      universal: 'All Buddhist schools accept Buddha as enlightened teacher',
      theravada: {
        emphasis: 'Historical Buddha and Pali Canon',
        focus: 'Individual liberation through Buddha\'s path',
        region: 'Southeast Asia (Sri Lanka, Thailand, Myanmar, Cambodia, Laos)'
      },
      mahayana: {
        emphasis: 'Cosmic Buddha, bodhisattva ideal',
        focus: 'Salvation available to all through Buddha\'s merit',
        region: 'East Asia (China, Japan, Korea, Vietnam)'
      },
      tibetan_buddhism: {
        emphasis: 'Buddha as manifestation of ultimate reality',
        focus: 'Tantric transformation into Buddha form',
        region: 'Tibet, Mongolia, Bhutan, Nepal'
      }
    },
    iconographicEvolution: {
      early_period: {
        era: '500-100 BCE',
        description: 'No physical representations; symbolic forms only',
        symbols: [
          'Empty throne',
          'Bodhi tree',
          'Dharma wheel',
          'Footprints with dharma wheel',
          'Stupas (burial mounds)'
        ]
      },
      classical_period: {
        era: '100 BCE - 500 CE',
        description: 'Distinct Buddha iconography develops',
        traditions: {
          gandharan: 'Greek-influenced, human form, draped robes, facial features',
          mathura: 'Indian style, seated in meditation, dharma wheel, subtle features',
          kushana: 'Blend of Greek and Indian styles'
        }
      },
      regional_developments: {
        theravada: {
          features: 'Serene expression, simple robes, meditation posture',
          emphasis: 'Peaceful, ascetic appearance'
        },
        mahayana: {
          features: 'More ornate, jewels, crown, elaborate robes',
          emphasis: 'Divine, transcendent appearance'
        },
        tibetan: {
          features: 'Often in union with consort (tantric), elaborate crown and ornaments',
          emphasis: 'Cosmic, energetic manifestation'
        }
      }
    },
    mantraAssociations: {
      primary_mantras: [
        { mantra: 'Namo Buddhaya', meaning: 'Homage to Buddha', usage: 'General salutation' },
        { mantra: 'Om Muni Muni Mahamuni', meaning: 'Great Sage mantra', usage: 'Buddha veneration' },
        { mantra: 'Buddham Saranam Gacchami', meaning: 'I take refuge in Buddha', usage: 'Refuge formula' }
      ],
      ritual_contexts: [
        'Vesak (Buddha birth, enlightenment, death celebration)',
        'Bodhi Day (Enlightenment celebration)',
        'Morning recitations in Buddhist monasteries',
        'Meditation practices'
      ]
    },
    historicalAuthenticity: {
      dating: 'Theravada tradition: 563-483 BCE; Modern scholarship: 480-400 BCE (or later)',
      historical_evidence: [
        'Mentioned in Pali Canon',
        'Archeological evidence of early stupas',
        'Contemporary historical records in Ashokan edicts',
        'Linguistic analysis of earliest texts'
      ]
    }
  },

  avalokiteshvara: {
    id: 'avalokiteshvara',
    historicalDevelopment: {
      early_mahayana: {
        era: '100-400 CE',
        description: 'Emerges as major bodhisattva in Mahayana Buddhism',
        texts: ['Lotus Sutra', 'Surangama Sutra', 'Pure Land sutras'],
        characteristics: [
          'Bodhisattva of compassion',
          'Thousand arms symbolize universal compassion',
          'Vow to help all sentient beings',
          'Manifestations across realms',
          'Cult develops rapidly'
        ]
      },
      tibetan_buddhism: {
        era: '600 CE onwards',
        description: 'Becomes Chenrezig, patron bodhisattva of Tibet',
        characteristics: [
          'Associated with Dalai Lamas as incarnations',
          'Central to Tibetan Buddhist practice',
          'Mantra "Om Mani Padme Hum" extremely important',
          'Tantra integration (multiple forms)',
          'National patron of Tibet'
        ]
      },
      east_asian_adaptations: {
        era: '400-1000 CE onwards',
        description: 'Transforms into female form (Guanyin/Kannon)',
        characteristics: [
          'Chinese Guanyin: goddess of mercy',
          'Japanese Kannon: feminine compassion deity',
          'Vietnamese Quan Am: similar adaptation',
          'Syncretism with Chinese mother-goddess traditions',
          'Integration into folk religion'
        ]
      }
    },
    scripturalSources: {
      core_texts: [
        { text: 'Lotus Sutra (25th Chapter)', context: 'Avalokiteshvara described', importance: 'Foundational' },
        { text: 'Surangama Sutra', context: 'Avalokiteshvara\'s method', importance: 'Major' },
        { text: 'Pure Land sutras', context: 'Role in salvation', importance: 'Major' }
      ],
      tibetan_texts: [
        { text: 'Tibetan Book of the Dead', context: 'Compassion aspect', importance: 'Major' },
        { text: 'Chenrezig practice texts', context: 'Visualization techniques', importance: 'Primary' }
      ]
    },
    sectarianAffiliations: {
      universal: 'Honored in all Mahayana schools',
      east_asian_buddhism: {
        prominence: 'Extremely high',
        forms: ['Guanyin (China)', 'Kannon (Japan)', 'Quan Am (Vietnam)']
      },
      tibetan_buddhism: {
        prominence: 'Central',
        role: 'National patron, Dalai Lama connection',
        schools: 'All Tibetan schools venerate Chenrezig'
      },
      pure_land: {
        role: 'Assists Amitabha Buddha in salvation',
        importance: 'Major'
      }
    },
    iconographicEvolution: {
      early_form: {
        era: '100-400 CE',
        description: 'Male bodhisattva form',
        representations: ['Peaceful masculine face', 'Crowned with Amitabha Buddha', 'Flowing robes']
      },
      multi_armed_form: {
        era: '400-800 CE',
        description: 'Thousand-armed form develops',
        representations: [
          'Thousand arms representing universal reach',
          'Thousand eyes for all-seeing compassion',
          'Multiple hands with various implements',
          'Central face serene, side faces showing other emotions'
        ]
      },
      female_transformation: {
        era: '800 CE onwards',
        description: 'Transformation in East Asia',
        forms: {
          guanyin: 'Chinese female form, white robes, flowing appearance, gentle expression',
          kannon: 'Japanese variation, similar femininity, bamboo and willow associations',
          quan_am: 'Vietnamese form, spiritual mother figure'
        }
      },
      tibetan_form: {
        description: 'Chenrezig in various aspects',
        forms: [
          'Four-armed Avalokiteshvara (meditation form)',
          'Eleven-headed form',
          'Thousand-armed form',
          'In union with consort (tantric)'
        ]
      }
    },
    mantraAssociations: {
      primary_mantras: [
        { mantra: 'Om Mani Padme Hum', meaning: 'The Jewel in the Lotus', usage: 'Universal mantra, especially Tibetan Buddhism' },
        { mantra: 'Namo Avalokiteshvaraya', meaning: 'Homage to Avalokiteshvara', usage: 'Dedication and invocation' }
      ],
      ritual_contexts: [
        'Tibetan Buddhist meditation (Chenrezig sadhana)',
        'Mantra recitation (Om Mani Padme Hum)',
        'Prayer wheel rotation',
        'Compassion practices',
        'Guanyin devotion in East Asia'
      ],
      chakra_associations: [
        'Anahata (heart) - compassion center',
        'Vishuddha (throat) - compassionate speech'
      ]
    },
    tantricDimensions: {
      importance: 'Central to Tibetan Buddhist tantra',
      practices: [
        'Chenrezig sadhana (meditation)',
        'Visualization of thousand arms',
        'Mantra recitation for enlightenment',
        'Integration of compassion with wisdom'
      ]
    },
    regionalAdaptations: {
      tibetan: 'Chenrezig (sacred protector)',
      chinese: 'Guanyin (goddess of mercy)',
      japanese: 'Kannon (compassion bodhisattva)',
      vietnamese: 'Quan Am (spiritual mother)',
      korean: 'Gwaneum (similar to Kannon)',
      thai_cambodian: 'Lokeshvara (lord of the world)'
    }
  }
};

// Enhanced metadata structure
const ENHANCEMENT_SCHEMA = {
  historicalDevelopment: {
    description: 'Traces the deity through major historical periods',
    subFields: [
      'vedic_period / early_buddhism / historical_period',
      'upanishadic_period / mahayana_period',
      'epic_period',
      'puranic_period / tibetan_buddhism',
      'regional_adaptations'
    ]
  },
  scripturalSources: {
    description: 'Specific texts with context and importance ranking',
    importance_levels: ['Foundational', 'Primary', 'Major', 'Secondary']
  },
  sectarianAffiliations: {
    description: 'Which religious schools worship this deity',
    categories: ['primary', 'secondary', 'regional', 'universal']
  },
  iconographicEvolution: {
    description: 'How visual representations changed over time',
    categories: ['vedic_period', 'classical_period', 'medieval_period', 'regional_variations']
  },
  mantraAssociations: {
    description: 'Sacred sounds and ritual contexts',
    categories: ['primary_mantras', 'ritual_contexts', 'chakra_associations']
  },
  tantricDimensions: {
    description: 'Role in Tantric and esoteric traditions',
    categories: ['prominence', 'major_forms', 'tantric_practices', 'non_dual_philosophy']
  },
  regionalAdaptations: {
    description: 'How deity transformed across different cultures',
    categories: ['tibetan_buddhist', 'east_asian', 'southeast_asian', 'japanese', 'global']
  }
};

/**
 * Enhance a deity file with historical metadata
 */
function enhanceDeitiesWithHistory() {
  const baseDir = path.join(__dirname, '../firebase-assets-downloaded/deities');

  // Get all deities to enhance
  const deities = [
    ...Object.keys(HINDU_DEITIES_HISTORY),
    ...Object.keys(BUDDHIST_DEITIES_HISTORY)
  ];

  const results = {
    enhanced: [],
    failed: [],
    skipped: []
  };

  deities.forEach(deityId => {
    const filePath = path.join(baseDir, `${deityId}.json`);

    try {
      if (!fs.existsSync(filePath)) {
        results.skipped.push(`${deityId}: File not found`);
        return;
      }

      // Read current file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const deity = JSON.parse(fileContent);

      // Determine which history set to use
      const history = HINDU_DEITIES_HISTORY[deityId] || BUDDHIST_DEITIES_HISTORY[deityId];
      if (!history) {
        results.skipped.push(`${deityId}: No historical data available`);
        return;
      }

      // Add historical metadata
      deity.historicalMetadata = {
        ...history,
        lastEnhanced: new Date().toISOString(),
        enhancedBy: 'historical_enhancement_script_v1'
      };

      // Update metadata timestamps
      if (!deity.metadata) {
        deity.metadata = {};
      }
      deity.metadata.historicallyEnhanced = true;
      deity.metadata.enhancementDate = new Date().toISOString();
      if (!deity.metadata.tags) {
        deity.metadata.tags = [];
      }
      if (!deity.metadata.tags.includes('historically-documented')) {
        deity.metadata.tags.push('historically-documented');
      }

      // Write updated file
      fs.writeFileSync(filePath, JSON.stringify(deity, null, 2) + '\n');
      results.enhanced.push({
        id: deityId,
        file: filePath,
        sections: Object.keys(history).length
      });

    } catch (error) {
      results.failed.push({
        id: deityId,
        file: filePath,
        error: error.message
      });
    }
  });

  return results;
}

/**
 * Generate a markdown report of enhancements
 */
function generateReport(results) {
  const report = `# Hindu and Buddhist Mythology Historical Enhancement Report

## Summary

- **Enhanced**: ${results.enhanced.length} deities
- **Failed**: ${results.failed.length}
- **Skipped**: ${results.skipped.length}

## Enhanced Deities

${results.enhanced.map(e => `- **${e.id}**: ${e.sections} historical sections added`).join('\n')}

## Metadata Schema Added

The following historical metadata has been added to each deity:

\`\`\`
historicalMetadata:
  - historicalDevelopment: Major historical periods and transformations
  - scripturalSources: Primary texts with context and importance ranking
  - sectarianAffiliations: Which schools/traditions worship this deity
  - iconographicEvolution: How visual representations changed over time
  - mantraAssociations: Sacred sounds and ritual uses
  - tantricDimensions: Role in Tantric/esoteric traditions
  - regionalAdaptations: Cultural transformations (Tibetan, East Asian, etc.)
\`\`\`

## Historical Periods Covered

### Hindu Deities
- **Vedic Period** (1500-500 BCE): Origins and early forms
- **Upanishadic Period** (800-500 BCE): Philosophical elevation
- **Epic Period** (500 BCE - 500 CE): Integration into Mahabharata/Ramayana
- **Puranic Period** (500-1500 CE): Classical mythology development
- **Modern Period**: Contemporary worship and adaptations

### Buddhist Deities
- **Historical Period**: Life of historical Buddha (if applicable)
- **Early Buddhism** (500-200 BCE): Initial traditions
- **Mahayana Period** (100 BCE - 500 CE): Bodhisattva development
- **Tibetan Buddhism** (600 CE onwards): Tantric integration
- **East Asian Adaptations** (400 CE onwards): Regional transformations

## Regional Variations Documented

### Hindu Deities by Region
- North India (Himalayan, Kashmir traditions)
- South India (Tamil traditions, Chola period)
- West India (Gujarat, Rajasthan)
- Bengal (Gaudiya traditions)

### Buddhist Deities by Tradition
- Theravada (Southeast Asia)
- Mahayana (East Asia)
- Tibetan Buddhism (Tibet, Mongolia, Bhutan)
- Modern global adaptations

## Key Enhancements

### 1. Scriptural Grounding
Each deity now has detailed references to primary texts with:
- Specific chapter/verse citations
- Historical context
- Importance ranking (Foundational, Primary, Major, Secondary)

### 2. Sectarian Mapping
Clear documentation of:
- Which religious schools exclusively worship this deity
- Regional distribution of worship
- Evolution of sectarian theology

### 3. Iconographic History
Traced visual development through:
- Vedic/early period (textual descriptions)
- Classical period (standardization begins)
- Medieval period (elaborate iconography)
- Regional variations

### 4. Mantric Associations
Sacred sounds now documented with:
- Transliteration and meaning
- Ritual contexts
- Chakra associations
- Historical development

### 5. Tantric Dimensions
For deities with tantric significance:
- Central practices and forms
- Non-dual philosophical aspects
- Chakra correlations
- Visualization methods

## Generated Files

- Enhanced deity JSON files in: \`firebase-assets-downloaded/deities/\`
- This report: \`scripts/historical-enhancement-report.md\`
- Comparative analysis: \`scripts/historical-comparison.md\`

## Next Steps

1. **Validation**: Cross-reference with academic sources
2. **Expansion**: Add more deities (Kali, Durga, Manjushri, etc.)
3. **Integration**: Link to historical texts in cosmology/texts collections
4. **UI Implementation**: Display historical timelines in entity pages
5. **Cross-tradition Analysis**: Compare parallel deities across traditions

## References

### Hindu Mythology
- Rigveda, Yajur Veda, Atharva Veda, Samaveda (Vedic corpus)
- Upanishads (Vedantic philosophy)
- Mahabharata (including Bhagavad Gita)
- Ramayana
- Puranas (Bhagavata, Vishnu, Shiva, Brahma, etc.)
- Tantric texts (Kashmir Shaivism, Shakta tradition)

### Buddhist Texts
- Pali Canon (Tripitaka): Sutta Pitaka, Vinaya Pitaka, Abhidhamma Pitaka
- Mahayana sutras (Lotus Sutra, Pure Land sutras)
- Tibetan Buddhist texts (Book of the Dead, tantric practices)
- East Asian Buddhist texts (Chinese and Japanese commentaries)

---

Generated: ${new Date().toISOString()}
`;

  return report;
}

// Main execution
console.log('Starting Hindu and Buddhist Mythology Historical Enhancement...\n');
const results = enhanceDeitiesWithHistory();

console.log('Enhancement Results:');
console.log(`  Enhanced: ${results.enhanced.length}`);
console.log(`  Failed: ${results.failed.length}`);
console.log(`  Skipped: ${results.skipped.length}\n`);

if (results.enhanced.length > 0) {
  console.log('Enhanced deities:');
  results.enhanced.forEach(e => {
    console.log(`  - ${e.id}: ${path.basename(e.file)}`);
  });
}

if (results.failed.length > 0) {
  console.log('\nFailed enhancements:');
  results.failed.forEach(f => {
    console.log(`  - ${f.id}: ${f.error}`);
  });
}

if (results.skipped.length > 0) {
  console.log('\nSkipped:');
  results.skipped.forEach(s => {
    console.log(`  - ${s}`);
  });
}

// Generate and save report
const report = generateReport(results);
const reportPath = path.join(__dirname, 'historical-enhancement-report.md');
fs.writeFileSync(reportPath, report);
console.log(`\nReport saved to: ${reportPath}`);

console.log('\nEnhancement complete!');

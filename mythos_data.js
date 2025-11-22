// Mythos Explorer - Comprehensive Mythology Data Structure
// Covers 15+ mythological traditions with cross-referencing

const MYTHOLOGY_BRANCHES = [
    {
        id: 'jewish',
        name: 'Jewish/Kabbalistic',
        displayName: 'Jewish Mysticism & Kabbalah',
        color: '#8b7fff',
        icon: '✡️',
        description: 'Ancient Hebrew mysticism, Kabbalah, and the 288 Sparks system',
        regions: ['Middle East', 'Global'],
        era: '~1200 BCE - Present',
        keyTexts: ['Torah', 'Zohar', 'Sefer Yetzirah', 'Talmud'],
        coreConcepts: ['Sefirot', 'Ein Sof', 'Tzimtzum', 'Tikkun Olam', 'Qlippot', '72 Names']
    },
    {
        id: 'christian',
        name: 'Christian',
        displayName: 'Christian Mysticism & Angelology',
        color: '#ffd700',
        icon: '✝️',
        description: 'Christian theology, angelology, saints, and mystical traditions',
        regions: ['Global'],
        era: '~30 CE - Present',
        keyTexts: ['Bible', 'Apocrypha', 'Gnostic Gospels', 'Church Fathers'],
        coreConcepts: ['Trinity', 'Angels', 'Saints', 'Sacraments', 'Heaven/Hell', 'Resurrection']
    },
    {
        id: 'buddhist',
        name: 'Buddhist',
        displayName: 'Buddhist Philosophy & Cosmology',
        color: '#ff8c00',
        icon: '☸️',
        description: 'Buddhist teachings, realms, deities, and enlightenment paths',
        regions: ['Asia', 'Global'],
        era: '~500 BCE - Present',
        keyTexts: ['Tripitaka', 'Sutras', 'Tantras', 'Abhidhamma'],
        coreConcepts: ['Four Noble Truths', 'Eightfold Path', 'Nirvana', 'Karma', 'Bodhisattvas', 'Six Realms']
    },
    {
        id: 'hindu',
        name: 'Hindu',
        displayName: 'Hindu Mythology & Vedic Tradition',
        color: '#ff6347',
        icon: '🕉️',
        description: 'Vedic gods, cosmic cycles, yoga, and dharma',
        regions: ['India', 'Southeast Asia'],
        era: '~1500 BCE - Present',
        keyTexts: ['Vedas', 'Upanishads', 'Bhagavad Gita', 'Puranas', 'Mahabharata', 'Ramayana'],
        coreConcepts: ['Brahman', 'Atman', 'Dharma', 'Karma', 'Moksha', 'Trimurti', 'Chakras']
    },
    {
        id: 'sumerian',
        name: 'Sumerian',
        displayName: 'Sumerian Mythology',
        color: '#daa520',
        icon: '𒀭',
        description: 'Ancient Mesopotamian gods, creation myths, and epic tales',
        regions: ['Mesopotamia'],
        era: '~4000 - 2000 BCE',
        keyTexts: ['Enuma Elish', 'Epic of Gilgamesh', 'Cuneiform Tablets'],
        coreConcepts: ['Anunnaki', 'Me (Divine Powers)', 'Underworld', 'Ziggurats', 'Divine Kingship']
    },
    {
        id: 'egyptian',
        name: 'Egyptian',
        displayName: 'Ancient Egyptian Mythology',
        color: '#cd853f',
        icon: '𓂀',
        description: 'Egyptian gods, afterlife journey, and magical practices',
        regions: ['Egypt', 'North Africa'],
        era: '~3100 BCE - 30 BCE',
        keyTexts: ['Book of the Dead', 'Pyramid Texts', 'Coffin Texts', 'Amduat'],
        coreConcepts: ['Ma\'at', 'Ka/Ba/Akh', 'Duat', 'Divine Pharaoh', 'Ennead', 'Weighing of Heart']
    },
    {
        id: 'babylonian',
        name: 'Babylonian',
        displayName: 'Babylonian Mythology',
        color: '#b8860b',
        icon: '🏛️',
        description: 'Babylonian pantheon, astrology, and cosmic order',
        regions: ['Mesopotamia'],
        era: '~1900 - 539 BCE',
        keyTexts: ['Enuma Elish', 'Code of Hammurabi', 'Omen Texts'],
        coreConcepts: ['Marduk Supremacy', 'Tiamat Chaos', 'Astral Divination', 'Temple Worship']
    },
    {
        id: 'persian',
        name: 'Persian',
        displayName: 'Persian/Zoroastrian Mythology',
        color: '#9370db',
        icon: '🔥',
        description: 'Zoroastrian dualism, fire worship, and cosmic battle',
        regions: ['Persia', 'Central Asia'],
        era: '~1500 BCE - Present',
        keyTexts: ['Avesta', 'Gathas', 'Bundahishn'],
        coreConcepts: ['Ahura Mazda', 'Angra Mainyu', 'Amesha Spentas', 'Cosmic Dualism', 'Fire Sacred']
    },
    {
        id: 'greek',
        name: 'Greek',
        displayName: 'Greek Mythology',
        color: '#4169e1',
        icon: '⚡',
        description: 'Olympian gods, heroes, mysteries, and philosophical traditions',
        regions: ['Greece', 'Mediterranean'],
        era: '~800 BCE - 400 CE',
        keyTexts: ['Iliad', 'Odyssey', 'Theogony', 'Homeric Hymns', 'Orphic Hymns'],
        coreConcepts: ['Olympian Gods', 'Heroes', 'Fates', 'Underworld', 'Mystery Cults', 'Titans']
    },
    {
        id: 'roman',
        name: 'Roman',
        displayName: 'Roman Mythology',
        color: '#dc143c',
        icon: '🏛️',
        description: 'Roman gods, imperial cult, and Greco-Roman syncretism',
        regions: ['Rome', 'Mediterranean', 'Europe'],
        era: '~753 BCE - 476 CE',
        keyTexts: ['Aeneid', 'Metamorphoses', 'Fasti'],
        coreConcepts: ['Capitoline Triad', 'Lares/Penates', 'Imperial Divinity', 'Syncretism']
    },
    {
        id: 'norse',
        name: 'Norse',
        displayName: 'Norse/Germanic Mythology',
        color: '#708090',
        icon: '🔨',
        description: 'Norse gods, Ragnarök, runes, and Viking cosmology',
        regions: ['Scandinavia', 'Northern Europe'],
        era: '~200 - 1300 CE',
        keyTexts: ['Poetic Edda', 'Prose Edda', 'Sagas'],
        coreConcepts: ['Yggdrasil', 'Nine Realms', 'Ragnarök', 'Runes', 'Æsir/Vanir', 'Valhalla']
    },
    {
        id: 'islamic',
        name: 'Islamic',
        displayName: 'Islamic Mysticism & Cosmology',
        color: '#228b22',
        icon: '☪️',
        description: 'Islamic theology, Sufism, angels, and djinn',
        regions: ['Middle East', 'Global'],
        era: '~610 CE - Present',
        keyTexts: ['Quran', 'Hadith', 'Sufi Poetry', 'Al-Ghazali'],
        coreConcepts: ['Tawhid', 'Angels', 'Djinn', 'Prophets', 'Paradise/Hell', 'Sufism', '99 Names']
    },
    {
        id: 'chinese',
        name: 'Chinese',
        displayName: 'Chinese Mythology & Philosophy',
        color: '#ff4500',
        icon: '☯️',
        description: 'Taoism, Confucianism, Buddhist synthesis, and celestial bureaucracy',
        regions: ['China', 'East Asia'],
        era: '~2000 BCE - Present',
        keyTexts: ['Tao Te Ching', 'I Ching', 'Journey to the West', 'Shan Hai Jing'],
        coreConcepts: ['Tao', 'Yin-Yang', 'Wu Xing', 'Qi', 'Immortals', 'Jade Emperor', 'Dragons']
    },
    {
        id: 'tarot',
        name: 'Tarot',
        displayName: 'Tarot & Hermetic Tradition',
        color: '#9932cc',
        icon: '🃏',
        description: 'Tarot symbolism, Hermetic Qabalah, and Western esotericism',
        regions: ['Europe', 'Global'],
        era: '~1400 CE - Present',
        keyTexts: ['Tarot de Marseille', 'Rider-Waite', 'Thoth Tarot', 'Hermetic Texts'],
        coreConcepts: ['Major Arcana', 'Minor Arcana', 'Tree of Life', 'As Above So Below', 'Elements']
    },
    {
        id: 'celtic',
        name: 'Celtic',
        displayName: 'Celtic Mythology & Druidism',
        color: '#2e8b57',
        icon: '🍀',
        description: 'Celtic gods, Druids, Otherworld, and nature spirits',
        regions: ['British Isles', 'Western Europe'],
        era: '~1200 BCE - 400 CE',
        keyTexts: ['Mabinogion', 'Ulster Cycle', 'Táin Bó Cúailnge'],
        coreConcepts: ['Tuatha Dé Danann', 'Otherworld', 'Druids', 'Sacred Groves', 'Threefold Death']
    }
];

// Magic Systems Classification (from Wikipedia & Academic Research)
const MAGIC_SYSTEMS = {
    byPractice: [
        {
            name: 'Theurgy',
            description: 'Divine magic, invoking higher powers for spiritual union',
            traditions: ['jewish', 'christian', 'greek', 'egyptian', 'tarot'],
            aka: ['High Magic', 'Ceremonial Magic', 'Ritual Magic']
        },
        {
            name: 'Thaumaturgy',
            description: 'Wonder-working, miracle magic',
            traditions: ['christian', 'jewish', 'islamic'],
            aka: ['Miracle Working']
        },
        {
            name: 'Necromancy',
            description: 'Communication with the dead',
            traditions: ['greek', 'roman', 'norse', 'sumerian', 'egyptian'],
            aka: ['Calling the Dead']
        },
        {
            name: 'Divination',
            description: 'Foretelling the future, scrying, augury',
            traditions: ['babylonian', 'chinese', 'greek', 'tarot', 'norse', 'roman', 'sumerian'],
            aka: ['Geomancy', 'Hydromancy', 'Aeromancy', 'Pyromancy', 'Augury', 'Soothsaying'],
            subtypes: ['Geomancy (Earth)', 'Hydromancy (Water)', 'Aeromancy (Air)', 'Pyromancy (Fire)', 'Astrology', 'Casting Lots', 'Bird Flight', 'Dream Interpretation']
        },
        {
            name: 'Alchemy',
            description: 'Transmutation of matter and spiritual transformation',
            traditions: ['chinese', 'islamic', 'egyptian', 'tarot', 'greek'],
            aka: ['Hermetic Art', 'Spiritual Chemistry']
        },
        {
            name: 'Shamanism',
            description: 'Spirit journey, trance, ecstatic healing',
            traditions: ['norse', 'celtic', 'sumerian', 'buddhist', 'chinese'],
            aka: ['Spirit Walking', 'Soul Journey']
        },
        {
            name: 'Sorcery',
            description: 'Manipulation of natural/supernatural forces',
            traditions: ['greek', 'roman', 'norse', 'egyptian', 'celtic'],
            aka: ['Low Magic', 'Folk Magic']
        },
        {
            name: 'Witchcraft',
            description: 'Natural magic, herbalism, folk practices',
            traditions: ['celtic', 'norse', 'greek', 'roman', 'christian'],
            aka: ['Wicca', 'Cunning Folk', 'Wise Women/Men']
        },
        {
            name: 'Enchantment',
            description: 'Binding spells, charms, amulets, talismans',
            traditions: ['jewish', 'islamic', 'egyptian', 'celtic', 'norse'],
            aka: ['Charm Making', 'Amulet Crafting']
        },
        {
            name: 'Invocation/Evocation',
            description: 'Calling spirits or entities (inside/outside)',
            traditions: ['jewish', 'christian', 'islamic', 'greek', 'egyptian'],
            aka: ['Spirit Summoning', 'Calling Angels/Demons']
        },
        {
            name: 'Goetia',
            description: 'Evocation of demons and lesser spirits',
            traditions: ['greek', 'jewish', 'christian', 'islamic'],
            aka: ['Demonic Magic', 'Solomonic Magic']
        },
        {
            name: 'Astrology',
            description: 'Celestial influence, planetary magic',
            traditions: ['babylonian', 'greek', 'hindu', 'chinese', 'islamic', 'egyptian'],
            aka: ['Star Divination', 'Planetary Magic']
        },
        {
            name: 'Sex Magic',
            description: 'Sexual energy for magical/spiritual purposes',
            traditions: ['hindu', 'buddhist', 'tarot', 'chinese'],
            aka: ['Tantra', 'Sacred Sexuality']
        },
        {
            name: 'Natural Magic (Magia Naturalis)',
            description: 'Working with natural forces and correspondences',
            traditions: ['tarot', 'celtic', 'chinese', 'greek'],
            aka: ['Sympathetic Magic', 'Correspondence Magic']
        },
        {
            name: 'Chaos Magic',
            description: 'Pragmatic, belief-as-tool modern practice',
            traditions: ['tarot'],
            aka: ['Paradigm Shifting', 'Results Magic']
        }
    ],
    bySource: [
        {
            name: 'Divine Magic',
            description: 'Power from gods or God',
            traditions: ['christian', 'jewish', 'islamic', 'hindu', 'egyptian']
        },
        {
            name: 'Natural Magic',
            description: 'Power from natural forces',
            traditions: ['tarot', 'celtic', 'chinese', 'norse']
        },
        {
            name: 'Demonic Magic',
            description: 'Power from demons or dark entities',
            traditions: ['jewish', 'christian', 'islamic', 'persian']
        },
        {
            name: 'Ancestral Magic',
            description: 'Power from ancestors or spirits',
            traditions: ['roman', 'chinese', 'egyptian', 'norse']
        },
        {
            name: 'Internal Cultivation',
            description: 'Power from within, chi/prana work',
            traditions: ['chinese', 'hindu', 'buddhist']
        }
    ],
    byPurpose: [
        {name: 'Protective', description: 'Wards, shields, amulets'},
        {name: 'Healing', description: 'Medicine, restoration'},
        {name: 'Destructive', description: 'Curses, hexes, battle magic'},
        {name: 'Transformative', description: 'Change self or others'},
        {name: 'Divinatory', description: 'Knowledge and prophecy'},
        {name: 'Communicative', description: 'Speaking with entities'},
        {name: 'Creative', description: 'Manifestation, conjuring'}
    ]
};

// Cross-reference concepts that appear in multiple traditions
const UNIVERSAL_CONCEPTS = {
    creation: {
        name: 'Creation Myth',
        occurrences: {
            jewish: 'Bereshit (Genesis)',
            christian: 'Genesis',
            sumerian: 'Enuma Elish',
            egyptian: 'Atum/Ra creation',
            babylonian: 'Marduk vs Tiamat',
            greek: 'Chaos to Cosmos',
            norse: 'Ymir and the Void',
            hindu: 'Brahma\'s dream',
            chinese: 'Pangu separation'
        }
    },
    flood: {
        name: 'Great Flood',
        occurrences: {
            jewish: 'Noah\'s Ark',
            christian: 'Noah\'s Ark',
            sumerian: 'Epic of Gilgamesh (Utnapishtim)',
            babylonian: 'Atrahasis Epic',
            hindu: 'Manu and the Fish',
            greek: 'Deucalion\'s Flood'
        }
    },
    afterlife: {
        name: 'Afterlife/Underworld',
        occurrences: {
            egyptian: 'Duat (Field of Reeds)',
            greek: 'Hades/Elysium',
            norse: 'Hel/Valhalla',
            christian: 'Heaven/Hell/Purgatory',
            jewish: 'Sheol/Gan Eden',
            islamic: 'Jannah/Jahannam',
            sumerian: 'Kur',
            buddhist: 'Bardo/Six Realms'
        }
    },
    cosmicTree: {
        name: 'World Tree/Axis Mundi',
        occurrences: {
            norse: 'Yggdrasil',
            jewish: 'Etz Chaim (Tree of Life)',
            hindu: 'Ashvattha',
            buddhist: 'Bodhi Tree',
            sumerian: 'Huluppu Tree',
            christian: 'Tree of Knowledge/Life'
        }
    },
    divineNumber: {
        name: 'Sacred Numbers',
        occurrences: {
            jewish: '10 (Sefirot), 72 (Names)',
            christian: '3 (Trinity), 7 (Virtues), 12 (Apostles)',
            buddhist: '4 (Noble Truths), 8 (Path)',
            hindu: '3 (Trimurti), 7 (Chakras)',
            chinese: '5 (Wu Xing), 8 (Trigrams)',
            islamic: '99 (Names of Allah)',
            tarot: '22 (Major Arcana), 78 (Total)'
        }
    },
    apocalypse: {
        name: 'End Times/Apocalypse',
        occurrences: {
            norse: 'Ragnarök',
            christian: 'Revelation',
            jewish: 'Messianic Age',
            islamic: 'Yawm al-Qiyāmah',
            hindu: 'Kali Yuga End',
            persian: 'Frashokereti'
        }
    },
    hero: {
        name: 'Divine/Epic Hero',
        occurrences: {
            greek: 'Heracles, Perseus, Achilles',
            roman: 'Aeneas',
            norse: 'Sigurd/Siegfried',
            sumerian: 'Gilgamesh',
            hindu: 'Rama, Krishna',
            celtic: 'Cú Chulainn',
            chinese: 'Sun Wukong'
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MYTHOLOGY_BRANCHES, MAGIC_SYSTEMS, UNIVERSAL_CONCEPTS };
}

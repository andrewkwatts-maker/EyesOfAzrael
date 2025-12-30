/**
 * Mythology Whispers - Atmospheric quotes from primary sources
 * These ephemeral fragments make entities feel alive
 */

const MythologyWhispers = {
    // Greek/Roman whispers
    greek: [
        { text: "Sing, O Muse, of the rage...", source: "Homer, Iliad" },
        { text: "Tell me, Muse, of the man of many ways...", source: "Homer, Odyssey" },
        { text: "In the beginning there was only Chaos...", source: "Hesiod, Theogony" },
        { text: "Know thyself.", source: "Delphic Maxim" },
        { text: "Nothing in excess.", source: "Delphic Maxim" },
        { text: "The dice of Zeus always fall luckily.", source: "Sophocles" },
        { text: "Call no man happy until he is dead.", source: "Solon" },
        { text: "Even the gods cannot change the past.", source: "Agathon" },
        { text: "Time is the wisest of all counselors.", source: "Pericles" },
        { text: "The only true wisdom is in knowing you know nothing.", source: "Socrates" }
    ],

    // Norse whispers
    norse: [
        { text: "From the south, Sun, companion of Moon, cast her right hand round the rim of heaven...", source: "Voluspa" },
        { text: "I know that I hung on a wind-swept tree, nine long nights...", source: "Havamal" },
        { text: "Cattle die, kinsmen die, you yourself will die...", source: "Havamal" },
        { text: "An axe age, a sword age, shields are riven...", source: "Voluspa" },
        { text: "Better to fight and fall than to live without hope.", source: "Norse Proverb" },
        { text: "The wolf shall howl at the moon...", source: "Eddic Poetry" },
        { text: "Fate is inexorable.", source: "Norse Wisdom" },
        { text: "Wisdom is welcome wherever it comes from.", source: "Bandamanna Saga" },
        { text: "The brave man well shall fight and win, though dull his blade may be.", source: "Fafnismal" },
        { text: "Against the ruin of the world, there is only one defense: the creative act.", source: "Northern Spirit" }
    ],

    // Egyptian whispers
    egyptian: [
        { text: "I am yesterday, today, and tomorrow...", source: "Book of the Dead" },
        { text: "As above, so below; as within, so without.", source: "Hermetic Wisdom" },
        { text: "The lips of wisdom are closed, except to the ears of understanding.", source: "Thoth" },
        { text: "To speak the name of the dead is to make them live again.", source: "Egyptian Saying" },
        { text: "Truth is the daughter of Ra.", source: "Maxims of Ptahhotep" },
        { text: "The heart is weighed against the feather of Ma'at...", source: "Book of the Dead" },
        { text: "I have not done falsehood against men...", source: "Negative Confession" },
        { text: "The river rises. The fields are green.", source: "Hymn to the Nile" },
        { text: "May your ka live, may you spend millions of years...", source: "Offering Formula" },
        { text: "A man's heart is his own god.", source: "Instructions of Amenemope" }
    ],

    // Hindu whispers
    hindu: [
        { text: "In the beginning was Brahman, with whom was the Word...", source: "Rig Veda" },
        { text: "Thou art That.", source: "Upanishads" },
        { text: "The Self is hidden in the hearts of all...", source: "Katha Upanishad" },
        { text: "As a man acts, so does he become.", source: "Brihadaranyaka Upanishad" },
        { text: "From the unreal lead me to the real; from darkness lead me to light...", source: "Brihadaranyaka Upanishad" },
        { text: "The soul is neither born, nor does it die.", source: "Bhagavad Gita" },
        { text: "Action alone is your domain, never the fruits thereof.", source: "Bhagavad Gita" },
        { text: "The mind is restless, turbulent, strong and unyielding...", source: "Bhagavad Gita" },
        { text: "Truth alone triumphs.", source: "Mundaka Upanishad" },
        { text: "All this is Brahman.", source: "Chandogya Upanishad" }
    ],

    // Japanese whispers
    japanese: [
        { text: "The nail that sticks up gets hammered down.", source: "Japanese Proverb" },
        { text: "Even monkeys fall from trees.", source: "Japanese Proverb" },
        { text: "The bamboo that bends is stronger than the oak that resists.", source: "Japanese Wisdom" },
        { text: "Fall seven times, stand up eight.", source: "Japanese Proverb" },
        { text: "In the land of the rising sun...", source: "Nihon Shoki" },
        { text: "The way of the warrior is death.", source: "Hagakure" },
        { text: "One who knows the enemy and knows himself will not be endangered.", source: "Art of War" },
        { text: "Even dust, if piled up, can become a mountain.", source: "Japanese Proverb" },
        { text: "The flower that blooms in adversity is the rarest and most beautiful of all.", source: "Japanese Wisdom" },
        { text: "Kami dwell in all things.", source: "Shinto Teaching" }
    ],

    // Celtic whispers
    celtic: [
        { text: "I am the wind that blows across the sea...", source: "Amergin's Song" },
        { text: "Better is the soul than the world.", source: "Celtic Triad" },
        { text: "Three candles illuminate every darkness: truth, nature, knowledge.", source: "Celtic Triad" },
        { text: "The salmon knows all things.", source: "Irish Mythology" },
        { text: "In the thin places, the veil grows thin...", source: "Celtic Belief" },
        { text: "Every oak was once an acorn.", source: "Druidic Wisdom" },
        { text: "The land does not belong to us; we belong to the land.", source: "Celtic Teaching" },
        { text: "Listen to the voice of nature, for it speaks wisdom.", source: "Druidic Teaching" },
        { text: "The Well of Wisdom lies at the heart of the world.", source: "Irish Mythology" },
        { text: "May the road rise to meet you...", source: "Celtic Blessing" }
    ],

    // Chinese whispers
    chinese: [
        { text: "The Tao that can be told is not the eternal Tao.", source: "Tao Te Ching" },
        { text: "A journey of a thousand miles begins with a single step.", source: "Lao Tzu" },
        { text: "He who knows does not speak; he who speaks does not know.", source: "Lao Tzu" },
        { text: "When the student is ready, the teacher will appear.", source: "Taoist Saying" },
        { text: "The dragon rises from the depths.", source: "Chinese Mythology" },
        { text: "Heaven and earth were formed from chaos.", source: "Pangu Creation Myth" },
        { text: "Know the white, keep to the black.", source: "Tao Te Ching" },
        { text: "Nature does not hurry, yet everything is accomplished.", source: "Lao Tzu" },
        { text: "The five elements cycle eternally.", source: "Wuxing Philosophy" },
        { text: "When I let go of what I am, I become what I might be.", source: "Lao Tzu" }
    ],

    // Mesopotamian whispers
    mesopotamian: [
        { text: "He who saw the Deep, the foundation of the land...", source: "Epic of Gilgamesh" },
        { text: "The life that you seek you will never find.", source: "Epic of Gilgamesh" },
        { text: "When the gods created mankind, death they dispensed to mankind...", source: "Epic of Gilgamesh" },
        { text: "From the Great Above she set her mind toward the Great Below.", source: "Inanna's Descent" },
        { text: "The Tablet of Destinies holds all fates.", source: "Babylonian Myth" },
        { text: "In those days, in those far-off days...", source: "Sumerian Poetry" },
        { text: "The laws are eternal, carved in stone.", source: "Code of Hammurabi" },
        { text: "Let the rivers carry you to the sea.", source: "Mesopotamian Proverb" },
        { text: "The gods weave the fates of men.", source: "Babylonian Wisdom" },
        { text: "Friendship lasts forever.", source: "Gilgamesh to Enkidu" }
    ],

    // African whispers
    african: [
        { text: "The child who is not embraced by the village will burn it down to feel its warmth.", source: "African Proverb" },
        { text: "Until the lion tells his side of the story, the tale of the hunt will always glorify the hunter.", source: "African Proverb" },
        { text: "It takes a village to raise a child.", source: "African Proverb" },
        { text: "If you want to go fast, go alone. If you want to go far, go together.", source: "African Proverb" },
        { text: "The ancestors are watching.", source: "African Belief" },
        { text: "Anansi wove the first stories.", source: "Akan Mythology" },
        { text: "When the moon is not full, the stars shine more brightly.", source: "African Proverb" },
        { text: "Smooth seas do not make skillful sailors.", source: "African Proverb" },
        { text: "The spider's web catches the fly but not the eagle.", source: "African Wisdom" },
        { text: "Every river knows its source.", source: "African Proverb" }
    ],

    // Mesoamerican whispers
    mesoamerican: [
        { text: "We are but flowers; we are only dreaming.", source: "Aztec Poetry" },
        { text: "In the time before time, there was nothing but the sea and sky.", source: "Popol Vuh" },
        { text: "The serpent devours itself.", source: "Aztec Philosophy" },
        { text: "We do not inherit the earth from our ancestors; we borrow it from our children.", source: "Indigenous Wisdom" },
        { text: "Quetzalcoatl shall return.", source: "Aztec Prophecy" },
        { text: "The fifth sun rises.", source: "Aztec Creation Myth" },
        { text: "Blood feeds the sun.", source: "Aztec Belief" },
        { text: "In Xibalba, the lords of death await.", source: "Mayan Mythology" },
        { text: "The calendar speaks in stone.", source: "Mayan Wisdom" },
        { text: "The Hero Twins descend to the underworld.", source: "Popol Vuh" }
    ],

    // Polynesian whispers
    polynesian: [
        { text: "The sea is our highway.", source: "Polynesian Saying" },
        { text: "Maui pulled up the islands from the sea.", source: "Polynesian Mythology" },
        { text: "The stars guide us home.", source: "Polynesian Navigation" },
        { text: "We are the ocean's children.", source: "Polynesian Belief" },
        { text: "Mana flows through all things.", source: "Polynesian Philosophy" },
        { text: "The ancestors speak through the waves.", source: "Polynesian Tradition" },
        { text: "What is past is prologue.", source: "Polynesian Wisdom" },
        { text: "The canoe cannot go forward if we paddle in different directions.", source: "Polynesian Proverb" },
        { text: "Honor your elders, teach your young.", source: "Polynesian Teaching" },
        { text: "We are voyagers, not settlers.", source: "Polynesian Identity" }
    ],

    // Universal/Archetypal whispers (for unknown mythologies)
    universal: [
        { text: "In the beginning...", source: "Universal" },
        { text: "Once upon a time...", source: "Universal" },
        { text: "As it was, so it shall be.", source: "Universal" },
        { text: "The hero answers the call.", source: "Mythic Pattern" },
        { text: "From darkness, light emerges.", source: "Universal" },
        { text: "The cycle continues.", source: "Universal" },
        { text: "Names hold power.", source: "Universal Belief" },
        { text: "The threshold beckons.", source: "Mythic Pattern" },
        { text: "What we seek, we shall find.", source: "Universal" },
        { text: "The story remembers.", source: "Universal" }
    ],

    /**
     * Get a random whisper for a mythology
     * @param {string} mythology - The mythology name
     * @returns {Object} A whisper object with text and source
     */
    getWhisper(mythology) {
        const normalizedMythology = mythology?.toLowerCase() || 'universal';

        // Map common variations to our keys
        const mythologyMap = {
            'greek': 'greek',
            'roman': 'greek',
            'greco-roman': 'greek',
            'norse': 'norse',
            'scandinavian': 'norse',
            'viking': 'norse',
            'egyptian': 'egyptian',
            'hindu': 'hindu',
            'vedic': 'hindu',
            'indian': 'hindu',
            'japanese': 'japanese',
            'shinto': 'japanese',
            'celtic': 'celtic',
            'irish': 'celtic',
            'welsh': 'celtic',
            'scottish': 'celtic',
            'chinese': 'chinese',
            'taoist': 'chinese',
            'mesopotamian': 'mesopotamian',
            'sumerian': 'mesopotamian',
            'babylonian': 'mesopotamian',
            'akkadian': 'mesopotamian',
            'african': 'african',
            'yoruba': 'african',
            'akan': 'african',
            'mesoamerican': 'mesoamerican',
            'aztec': 'mesoamerican',
            'mayan': 'mesoamerican',
            'polynesian': 'polynesian',
            'hawaiian': 'polynesian',
            'maori': 'polynesian'
        };

        const key = mythologyMap[normalizedMythology] || 'universal';
        const whispers = this[key] || this.universal;

        // Return random whisper
        return whispers[Math.floor(Math.random() * whispers.length)];
    },

    /**
     * Get multiple whispers (for entity detail pages)
     * @param {string} mythology - The mythology name
     * @param {number} count - Number of whispers to return
     * @returns {Array} Array of whisper objects
     */
    getWhispers(mythology, count = 3) {
        const normalizedMythology = mythology?.toLowerCase() || 'universal';
        const mythologyMap = {
            'greek': 'greek', 'roman': 'greek', 'greco-roman': 'greek',
            'norse': 'norse', 'scandinavian': 'norse',
            'egyptian': 'egyptian',
            'hindu': 'hindu', 'vedic': 'hindu',
            'japanese': 'japanese', 'shinto': 'japanese',
            'celtic': 'celtic', 'irish': 'celtic',
            'chinese': 'chinese', 'taoist': 'chinese',
            'mesopotamian': 'mesopotamian', 'sumerian': 'mesopotamian',
            'african': 'african',
            'mesoamerican': 'mesoamerican', 'aztec': 'mesoamerican',
            'polynesian': 'polynesian'
        };

        const key = mythologyMap[normalizedMythology] || 'universal';
        const whispers = [...(this[key] || this.universal)];

        // Shuffle and return requested count
        for (let i = whispers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [whispers[i], whispers[j]] = [whispers[j], whispers[i]];
        }

        return whispers.slice(0, count);
    }
};

// Export for module systems and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MythologyWhispers;
}
if (typeof window !== 'undefined') {
    window.MythologyWhispers = MythologyWhispers;
}

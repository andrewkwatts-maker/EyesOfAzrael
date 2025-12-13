// 288 Sparks Data Structure
// Based on Kabbalistic framework: 10 Sefirot × 4 Worlds × 7.2 (approximation for 72 Names)
// Organization: 72 Names of God × 4 Worlds = 288 Sparks

const SEFIROT = [
    {
        id: 'keter',
        name: 'Keter',
        meaning: 'Crown',
        position: 1,
        description: 'The supreme crown, divine will, nothingness',
        attributes: ['Divine Will', 'Transcendence', 'Nothingness', 'Unity'],
        color: 'White/Brilliant',
        citation: 'Zohar I:15a, Sefer Yetzirah 1:9'
    },
    {
        id: 'chokmah',
        name: 'Chokmah',
        meaning: 'Wisdom',
        position: 2,
        description: 'Primordial wisdom, flash of insight, beginning point',
        attributes: ['Wisdom', 'Intuition', 'Beginning', 'Father Principle'],
        color: 'Grey/Blue',
        citation: 'Zohar I:2a, Proverbs 8:22-31'
    },
    {
        id: 'binah',
        name: 'Binah',
        meaning: 'Understanding',
        position: 3,
        description: 'Divine understanding, analytical thought, mother principle',
        attributes: ['Understanding', 'Analysis', 'Formation', 'Mother Principle'],
        color: 'Black/Green',
        citation: 'Zohar I:19b, Isaiah 6:3'
    },
    {
        id: 'chesed',
        name: 'Chesed',
        meaning: 'Mercy/Loving-kindness',
        position: 4,
        description: 'Unlimited love, grace, expansion',
        attributes: ['Love', 'Kindness', 'Grace', 'Expansion'],
        color: 'White/Silver',
        citation: 'Zohar II:176a, Micah 7:18'
    },
    {
        id: 'gevurah',
        name: 'Gevurah',
        meaning: 'Strength/Judgment',
        position: 5,
        description: 'Divine judgment, restriction, discipline',
        attributes: ['Strength', 'Judgment', 'Restriction', 'Discipline'],
        color: 'Red',
        citation: 'Zohar I:27b, Deuteronomy 3:24'
    },
    {
        id: 'tiferet',
        name: 'Tiferet',
        meaning: 'Beauty/Harmony',
        position: 6,
        description: 'Balance, beauty, harmony between mercy and judgment',
        attributes: ['Beauty', 'Balance', 'Compassion', 'Harmony'],
        color: 'Yellow/Gold',
        citation: 'Zohar II:216b, Psalm 104:1'
    },
    {
        id: 'netzach',
        name: 'Netzach',
        meaning: 'Victory/Eternity',
        position: 7,
        description: 'Endurance, victory, persistence',
        attributes: ['Victory', 'Endurance', 'Persistence', 'Prophecy'],
        color: 'Green',
        citation: 'Zohar III:128a, 1 Chronicles 29:11'
    },
    {
        id: 'hod',
        name: 'Hod',
        meaning: 'Glory/Splendor',
        position: 8,
        description: 'Majesty, glory, reverberation',
        attributes: ['Glory', 'Humility', 'Splendor', 'Intellect'],
        color: 'Orange',
        citation: 'Zohar I:31a, 1 Chronicles 29:11'
    },
    {
        id: 'yesod',
        name: 'Yesod',
        meaning: 'Foundation',
        position: 9,
        description: 'Foundation, connection, transmission',
        attributes: ['Foundation', 'Connection', 'Righteousness', 'Truth'],
        color: 'Purple/Violet',
        citation: 'Zohar I:231a, Proverbs 10:25'
    },
    {
        id: 'malkhut',
        name: 'Malkhut',
        meaning: 'Kingdom/Sovereignty',
        position: 10,
        description: 'Physical manifestation, sovereignty, divine presence',
        attributes: ['Kingdom', 'Manifestation', 'Speech', 'Presence'],
        color: 'Indigo/Earth tones',
        citation: 'Zohar III:290a, Exodus 15:18'
    }
];

const WORLDS = [
    {
        id: 'atziluth',
        name: 'Atziluth',
        meaning: 'World of Emanation',
        level: 1,
        description: 'Archetypal/Divine world, closest to Ein Sof',
        element: 'Fire',
        divine_name: 'YHVH (Yod-Heh-Vav-Heh)',
        attributes: ['Pure Divinity', 'Archetypes', 'Unity', 'Divine Will'],
        citation: 'Zohar II:42b, Pardes Rimonim 23:10'
    },
    {
        id: 'beriah',
        name: 'Beriah',
        meaning: 'World of Creation',
        level: 2,
        description: 'World of the Throne, creative intellect',
        element: 'Air',
        divine_name: 'Elohim',
        attributes: ['Creation', 'Archangels', 'Intellect', 'Separation'],
        citation: 'Zohar I:15a, Etz Chaim, Shaar 47'
    },
    {
        id: 'yetzirah',
        name: 'Yetzirah',
        meaning: 'World of Formation',
        level: 3,
        description: 'World of angels, emotional/astral realm',
        element: 'Water',
        divine_name: 'YHVH Elohim',
        attributes: ['Formation', 'Angels', 'Emotion', 'Transformation'],
        citation: 'Sefer Yetzirah, Zohar III:290b'
    },
    {
        id: 'assiah',
        name: 'Assiah',
        meaning: 'World of Action',
        level: 4,
        description: 'Physical world, manifestation and action',
        element: 'Earth',
        divine_name: 'Adonai',
        attributes: ['Physical', 'Material', 'Action', 'Manifestation'],
        citation: 'Zohar I:38a, Shaar HaGilgulim, Introduction 38'
    }
];

// 72 Names of God (Shemhamphorasch) - derived from Exodus 14:19-21
// Each verse has 72 Hebrew letters, creating 72 three-letter combinations
// Citation: Zohar II:51a-52b, Sefer HaBahir, Raziel HaMalach
const NAMES_72 = [
    { id: 1, hebrew: 'והו', transliteration: 'Vehu', meaning: 'God Exalted', attribute: 'Miraculous Cures', citation: 'Exodus 14:19' },
    { id: 2, hebrew: 'ילי', transliteration: 'Yeli', meaning: 'God Helper', attribute: 'Mental Lucidity', citation: 'Exodus 14:19' },
    { id: 3, hebrew: 'סית', transliteration: 'Sit', meaning: 'God Hope', attribute: 'Confounding the Wicked', citation: 'Exodus 14:19' },
    { id: 4, hebrew: 'עלם', transliteration: 'Elem', meaning: 'God Hidden', attribute: 'Success through Effort', citation: 'Exodus 14:19' },
    { id: 5, hebrew: 'מהש', transliteration: 'Mahash', meaning: 'God Savior', attribute: 'Peace and Harmony', citation: 'Exodus 14:19' },
    { id: 6, hebrew: 'ללה', transliteration: 'Lelah', meaning: 'God Praiseworthy', attribute: 'Healing Power', citation: 'Exodus 14:19' },
    { id: 7, hebrew: 'אכא', transliteration: 'Aka', meaning: 'God Gracious', attribute: 'Discovery of Hidden', citation: 'Exodus 14:20' },
    { id: 8, hebrew: 'כהת', transliteration: 'Kahet', meaning: 'God Adorable', attribute: 'Overcoming Adversity', citation: 'Exodus 14:20' },
    { id: 9, hebrew: 'הזי', transliteration: 'Hazi', meaning: 'God of Mercy', attribute: 'Divine Grace', citation: 'Exodus 14:20' },
    { id: 10, hebrew: 'אלד', transliteration: 'Elad', meaning: 'God Propitious', attribute: 'Protection', citation: 'Exodus 14:20' },
    { id: 11, hebrew: 'לאו', transliteration: 'Lav', meaning: 'God Admirable', attribute: 'Victory and Wisdom', citation: 'Exodus 14:20' },
    { id: 12, hebrew: 'ההע', transliteration: 'Haha', meaning: 'God Refuge', attribute: 'Understanding Dreams', citation: 'Exodus 14:20' },
    { id: 13, hebrew: 'יזל', transliteration: 'Yezel', meaning: 'God Glorified', attribute: 'Fidelity and Loyalty', citation: 'Exodus 14:20' },
    { id: 14, hebrew: 'מבה', transliteration: 'Mebah', meaning: 'God Eternal', attribute: 'Liberation', citation: 'Exodus 14:20' },
    { id: 15, hebrew: 'הרי', transliteration: 'Hari', meaning: 'God Creator', attribute: 'Purification', citation: 'Exodus 14:20' },
    { id: 16, hebrew: 'הקם', transliteration: 'Haqam', meaning: 'God Who Raises', attribute: 'Breaking Negative Cycles', citation: 'Exodus 14:20' },
    { id: 17, hebrew: 'לאו', transliteration: 'Lau', meaning: 'God Wonderful', attribute: 'Revelations', citation: 'Exodus 14:20' },
    { id: 18, hebrew: 'כלי', transliteration: 'Keli', meaning: 'God Invoking', attribute: 'Divine Support', citation: 'Exodus 14:21' },
    { id: 19, hebrew: 'לוו', transliteration: 'Levu', meaning: 'God Praiseworthy', attribute: 'Intellectual Enlightenment', citation: 'Exodus 14:21' },
    { id: 20, hebrew: 'פהל', transliteration: 'Pahal', meaning: 'God Redeemer', attribute: 'Spiritual Redemption', citation: 'Exodus 14:21' },
    { id: 21, hebrew: 'נלך', transliteration: 'Nelka', meaning: 'God Alone', attribute: 'Long-term Vision', citation: 'Exodus 14:21' },
    { id: 22, hebrew: 'ייי', transliteration: 'Yeye', meaning: 'God Right Hand', attribute: 'Renown and Fame', citation: 'Exodus 14:21' },
    { id: 23, hebrew: 'מלה', transliteration: 'Melah', meaning: 'God Who Delivers', attribute: 'Overcoming Trials', citation: 'Exodus 14:21' },
    { id: 24, hebrew: 'חהו', transliteration: 'Hahu', meaning: 'God in Himself', attribute: 'Protection from Evil', citation: 'Exodus 14:21' },
    { id: 25, hebrew: 'נתה', transliteration: 'Netah', meaning: 'God of Wisdom', attribute: 'Truth and Enlightenment', citation: 'Exodus 14:21' },
    { id: 26, hebrew: 'האא', transliteration: 'Haa', meaning: 'God Hidden', attribute: 'Seeking the Divine', citation: 'Exodus 14:21' },
    { id: 27, hebrew: 'ירת', transliteration: 'Yeret', meaning: 'God Who Punishes', attribute: 'Justice', citation: 'Exodus 14:21' },
    { id: 28, hebrew: 'שאה', transliteration: 'Shaah', meaning: 'God Helper', attribute: 'Recovery and Healing', citation: 'Exodus 14:21' },
    { id: 29, hebrew: 'ריי', transliteration: 'Reyi', meaning: 'God Who Sees', attribute: 'Spiritual Vision', citation: 'Exodus 14:21' },
    { id: 30, hebrew: 'אום', transliteration: 'Aum', meaning: 'God Patient', attribute: 'Patience and Perseverance', citation: 'Exodus 14:21' },
    { id: 31, hebrew: 'לכב', transliteration: 'Lekab', meaning: 'God Inspires', attribute: 'Inspiration', citation: 'Exodus 14:21' },
    { id: 32, hebrew: 'ושר', transliteration: 'Vesher', meaning: 'God Just', attribute: 'Fairness', citation: 'Exodus 14:21' },
    { id: 33, hebrew: 'יחו', transliteration: 'Yehu', meaning: 'God Universal', attribute: 'Knowledge of All', citation: 'Exodus 14:21' },
    { id: 34, hebrew: 'להח', transliteration: 'Lehah', meaning: 'God Clement', attribute: 'Mercy', citation: 'Exodus 14:21' },
    { id: 35, hebrew: 'כוק', transliteration: 'Kavak', meaning: 'God Who Elevates', attribute: 'Spiritual Ascension', citation: 'Exodus 14:21' },
    { id: 36, hebrew: 'מנד', transliteration: 'Menad', meaning: 'God Venerable', attribute: 'Wisdom Through Age', citation: 'Exodus 14:21' },
    { id: 37, hebrew: 'אני', transliteration: 'Ani', meaning: 'God of Virtues', attribute: 'Breaking Stagnation', citation: 'Exodus 14:21' },
    { id: 38, hebrew: 'חעם', transliteration: 'Haam', meaning: 'God of Hope', attribute: 'Hope and Faith', citation: 'Exodus 14:21' },
    { id: 39, hebrew: 'רהע', transliteration: 'Raha', meaning: 'God Who Sees', attribute: 'Finding Lost Things', citation: 'Exodus 14:21' },
    { id: 40, hebrew: 'ייז', transliteration: 'Yeiz', meaning: 'God Joy', attribute: 'Deliverance', citation: 'Exodus 14:21' },
    { id: 41, hebrew: 'ההה', transliteration: 'Hahah', meaning: 'God Secret', attribute: 'Inner Refuge', citation: 'Exodus 14:21' },
    { id: 42, hebrew: 'מיך', transliteration: 'Mikael', meaning: 'God Virtue', attribute: 'Political Success', citation: 'Exodus 14:21' },
    { id: 43, hebrew: 'וול', transliteration: 'Veul', meaning: 'King Dominant', attribute: 'Breaking Chains', citation: 'Exodus 14:21' },
    { id: 44, hebrew: 'ילה', transliteration: 'Yelah', meaning: 'God Who Helps', attribute: 'Success in Battle', citation: 'Exodus 14:21' },
    { id: 45, hebrew: 'סאל', transliteration: 'Sael', meaning: 'God Motivator', attribute: 'Motivation and Drive', citation: 'Exodus 14:21' },
    { id: 46, hebrew: 'ערי', transliteration: 'Ari', meaning: 'God Revealer', attribute: 'Discovering Truth', citation: 'Exodus 14:21' },
    { id: 47, hebrew: 'עשל', transliteration: 'Ashal', meaning: 'God Upright', attribute: 'Righteous Path', citation: 'Exodus 14:21' },
    { id: 48, hebrew: 'מיה', transliteration: 'Mihah', meaning: 'God Father', attribute: 'Fertility and Longevity', citation: 'Exodus 14:21' },
    { id: 49, hebrew: 'והו', transliteration: 'Vahu', meaning: 'God Great', attribute: 'Magnification', citation: 'Exodus 14:21' },
    { id: 50, hebrew: 'דני', transliteration: 'Dani', meaning: 'God of Judgment', attribute: 'Mercy in Judgment', citation: 'Exodus 14:21' },
    { id: 51, hebrew: 'הזש', transliteration: 'Hachash', meaning: 'God Infinite', attribute: 'Divine Elevation', citation: 'Exodus 14:21' },
    { id: 52, hebrew: 'עמם', transliteration: 'Amam', meaning: 'God Above All', attribute: 'Universal Knowledge', citation: 'Exodus 14:21' },
    { id: 53, hebrew: 'ננא', transliteration: 'Nena', meaning: 'God Exalted', attribute: 'Solitude and Meditation', citation: 'Exodus 14:21' },
    { id: 54, hebrew: 'נית', transliteration: 'Nit', meaning: 'King of Heaven', attribute: 'Immortal Kingdom', citation: 'Exodus 14:21' },
    { id: 55, hebrew: 'מבה', transliteration: 'Mebah', meaning: 'God Eternal', attribute: 'Consolation', citation: 'Exodus 14:21' },
    { id: 56, hebrew: 'פוי', transliteration: 'Pui', meaning: 'God Who Supports', attribute: 'Material Support', citation: 'Exodus 14:21' },
    { id: 57, hebrew: 'נמם', transliteration: 'Nemem', meaning: 'God Praiseworthy', attribute: 'Liberation from Oppression', citation: 'Exodus 14:21' },
    { id: 58, hebrew: 'ייל', transliteration: 'Yeil', meaning: 'God Hearkening', attribute: 'Psychic Abilities', citation: 'Exodus 14:21' },
    { id: 59, hebrew: 'הרח', transliteration: 'Harach', meaning: 'God Universal', attribute: 'Intellectual Riches', citation: 'Exodus 14:21' },
    { id: 60, hebrew: 'מצר', transliteration: 'Metzar', meaning: 'God Preserver', attribute: 'Healing Illness', citation: 'Exodus 14:21' },
    { id: 61, hebrew: 'ומב', transliteration: 'Vamab', meaning: 'God Above All', attribute: 'Joy and Happiness', citation: 'Exodus 14:21' },
    { id: 62, hebrew: 'יהה', transliteration: 'Yehah', meaning: 'God Supreme', attribute: 'Knowledge and Understanding', citation: 'Exodus 14:21' },
    { id: 63, hebrew: 'ענו', transliteration: 'Anu', meaning: 'God Infinitely Good', attribute: 'Business Success', citation: 'Exodus 14:21' },
    { id: 64, hebrew: 'מחי', transliteration: 'Mehi', meaning: 'God Vivifying', attribute: 'Vivification', citation: 'Exodus 14:21' },
    { id: 65, hebrew: 'דמב', transliteration: 'Damab', meaning: 'God Fountain', attribute: 'Source of Wisdom', citation: 'Exodus 14:21' },
    { id: 66, hebrew: 'מנק', transliteration: 'Menak', meaning: 'God Who Maintains', attribute: 'Preservation', citation: 'Exodus 14:21' },
    { id: 67, hebrew: 'איע', transliteration: 'Aia', meaning: 'God of Ages', attribute: 'Longevity', citation: 'Exodus 14:21' },
    { id: 68, hebrew: 'חבו', transliteration: 'Habu', meaning: 'God Most High', attribute: 'Favorable Outcomes', citation: 'Exodus 14:21' },
    { id: 69, hebrew: 'רעה', transliteration: 'Raah', meaning: 'God Who Sees', attribute: 'Recovery of Stolen', citation: 'Exodus 14:21' },
    { id: 70, hebrew: 'יבם', transliteration: 'Yabam', meaning: 'God Producing', attribute: 'Regeneration', citation: 'Exodus 14:21' },
    { id: 71, hebrew: 'היי', transliteration: 'Hayi', meaning: 'God Universal', attribute: 'Universal Knowledge', citation: 'Exodus 14:21' },
    { id: 72, hebrew: 'מום', transliteration: 'Mum', meaning: 'God End of All', attribute: 'Ending and Beginning', citation: 'Exodus 14:21' }
];

// Data structure for individual sparks
// Each spark is one of 72 Names manifested in one of 4 Worlds = 288 total
// Each also corresponds to a Sefirah (10 Sefirot × 28.8 ≈ 288)
const SPARKS_TEMPLATE = {
    id: '', // unique identifier: e.g., "vehu-atziluth-1"
    sparkNumber: 0, // 1-288
    name: '', // e.g., "Vehu of Atziluth"
    nameId: 0, // 1-72 reference to NAMES_72
    worldId: '', // atziluth, beriah, yetzirah, assiah
    sefirahId: '', // keter, chokmah, binah, etc.

    // Core attributes
    title: '', // e.g., "The Divine Healer"
    description: '',
    powers: [],
    domain: '', // area of influence

    // Relationships
    relatedSparks: [], // IDs of related sparks
    opposingSparks: [], // IDs of opposing sparks
    complementarySparks: [], // IDs of complementary sparks

    // Visual
    primaryColor: '',
    secondaryColor: '',
    symbol: '',
    visualDescription: '',

    // Citations
    sources: [],

    // Game mechanics (if applicable)
    gameRole: '',
    abilities: []
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SEFIROT, WORLDS, NAMES_72, SPARKS_TEMPLATE };
}

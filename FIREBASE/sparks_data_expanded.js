/**
 * Expanded Jewish Mythology Data
 * Includes: Sefirot, Qlippot, Angels, Demons, Partzufim, Mythological Concepts
 */

// === QLIPPOT (SHADOW TREE) ===
// The inverse/evil mirror of the Sefirot
const QLIPPOT = [
    {
        id: 1,
        name: "Thaumiel",
        hebrew: "תאומיאל",
        meaning: "The Twins of God",
        oppositeSefirah: "Keter",
        description: "Dual contending forces, division of unity. Two-headed demon representing opposition to divine will.",
        demon: "Satan and Moloch",
        element: "Division",
        color: "Black",
        manifestation: "Egomania, tyranny, false gods, split consciousness",
        citation: "Zohar references to husks (Qlippot) covering divine light"
    },
    {
        id: 2,
        name: "Ghagiel",
        hebrew: "עגאיאל",
        meaning: "The Hinderers",
        oppositeSefirah: "Chokmah",
        description: "Obscurers of wisdom, confusers of truth. Black heads that obscure the light of insight.",
        demon: "Beelzebub",
        element: "Confusion",
        color: "Grey",
        manifestation: "Intellectual arrogance, false wisdom, conspiracy theories, sophistry",
        citation: "Kabbalah teaches of shells that block divine wisdom"
    },
    {
        id: 3,
        name: "Satariel",
        hebrew: "סתריאל",
        meaning: "The Concealers",
        oppositeSefirah: "Binah",
        description: "Hiders of understanding, veilers of truth. Black veils obscuring comprehension.",
        demon: "Lucifuge",
        element: "Concealment",
        color: "Black",
        manifestation: "Willful ignorance, hiding truth, secrets used for harm, obscurantism",
        citation: "Referenced in later Kabbalistic texts on impure emanations"
    },
    {
        id: 4,
        name: "Gha'agsheblah",
        hebrew: "געגשבלה",
        meaning: "The Breakers",
        oppositeSefirah: "Chesed",
        description: "Destroyers of love, breakers of bonds. Smashes vessels of loving-kindness.",
        demon: "Astaroth",
        element: "Destruction",
        color: "Dark Blue",
        manifestation: "Cruelty masked as kindness, enabling, co-dependency, destructive generosity",
        citation: "Qlippot of the left side oppose the emanations of mercy"
    },
    {
        id: 5,
        name: "Golachab",
        hebrew: "גלאכב",
        meaning: "The Burners",
        oppositeSefirah: "Gevurah",
        description: "Arsonists, unrestrained destruction. Fire without purpose, cruelty for its own sake.",
        demon: "Asmodeus",
        element: "Destructive Fire",
        color: "Blood Red",
        manifestation: "Cruelty, sadism, violence, wrath, vindictiveness, tyranny",
        citation: "The burning ones of the left side"
    },
    {
        id: 6,
        name: "Thagirion",
        hebrew: "תגיריון",
        meaning: "The Disputers",
        oppositeSefirah: "Tiferet",
        description: "Those who create discord where there should be harmony. False beauty, superficial balance.",
        demon: "Belphegor",
        element: "Discord",
        color: "Dark Yellow",
        manifestation: "Vanity, false appearance, superficial harmony, people-pleasing, narcissism",
        citation: "Mentioned in Lurianic Kabbalah as shells of discord"
    },
    {
        id: 7,
        name: "A'arab Zaraq",
        hebrew: "ערב זרק",
        meaning: "The Dispersing Ravens",
        oppositeSefirah: "Netzach",
        description: "Ravens that scatter and disperse. Opposite of enduring victory - dissolution and failure.",
        demon: "Baal",
        element: "Dispersion",
        color: "Dark Green",
        manifestation: "Lust, obsession, inability to persist, giving up, scattered energy",
        citation: "The ravens of dispersion oppose eternal endurance"
    },
    {
        id: 8,
        name: "Samael",
        hebrew: "סמאל",
        meaning: "The Poison of God / The Blind God",
        oppositeSefirah: "Hod",
        description: "The accuser, adversary. False splendor, lies made to look like truth.",
        demon: "Samael (Archangel of Death)",
        element: "Deception",
        color: "Orange-Red",
        manifestation: "Lies, propaganda, manipulation, false logic, sophistry, legalism",
        citation: "Samael as prince of demons in various rabbinic sources"
    },
    {
        id: 9,
        name: "Gamaliel",
        hebrew: "גמליאל",
        meaning: "The Obscene Ones",
        oppositeSefirah: "Yesod",
        description: "Polluters of the foundation. Corruption of the generative/sexual force.",
        demon: "Lilith",
        element: "Corruption",
        color: "Dark Purple",
        manifestation: "Sexual perversion, abuse of power, manipulation, corruption of foundations",
        citation: "Lilith as queen of demons, opposing the sacred union"
    },
    {
        id: 10,
        name: "Nehemoth",
        hebrew: "נהמות",
        meaning: "The Whisperers / The Groaners",
        oppositeSefirah: "Malkhut",
        description: "Those who whisper complaints and despair. The shells surrounding physical reality.",
        demon: "Nahemah",
        element: "Despair",
        color: "Black-Brown",
        manifestation: "Materialism, despair, cynicism, nihilism, attachment to illusion",
        citation: "The lowest Qlippah, closest to physical matter"
    }
];

// === ARCHANGELS & MAJOR ANGELS ===
const ARCHANGELS = [
    {
        name: "Metatron",
        hebrew: "מטטרון",
        title: "Prince of the Presence",
        sphere: "Keter",
        role: "Scribe of Heaven, Voice of God",
        description: "The highest angel, often identified with the transformed Enoch. Sits at God's throne and records deeds.",
        powers: ["Divine scribe", "Teacher of souls", "Guardian of heavenly knowledge"],
        associated: "The transformed Enoch",
        citation: "3 Enoch, Babylonian Talmud"
    },
    {
        name: "Raziel",
        hebrew: "רזיאל",
        title: "Angel of Mysteries",
        sphere: "Chokmah",
        role: "Keeper of Divine Secrets",
        description: "Guards the secrets of the universe. Gave the 'Sefer Raziel' book of mysteries to Adam.",
        powers: ["Divine secrets", "Mystical knowledge", "Heavenly wisdom"],
        associated: "The Book of Raziel",
        citation: "Sefer Raziel HaMalakh"
    },
    {
        name: "Tzaphkiel",
        hebrew: "צפקיאל",
        title: "Contemplation of God",
        sphere: "Binah",
        role: "Angel of Understanding",
        description: "Archangel presiding over contemplation, understanding, and the supernal mother.",
        powers: ["Deep understanding", "Contemplation", "Structural thought"],
        associated: "The Aralim (Thrones)",
        citation: "Traditional Kabbalistic correspondences"
    },
    {
        name: "Tzadkiel",
        hebrew: "צדקיאל",
        title: "Righteousness of God",
        sphere: "Chesed",
        role: "Angel of Mercy and Justice",
        description: "Presides over acts of loving-kindness and mercy. Stopped Abraham from sacrificing Isaac.",
        powers: ["Mercy", "Forgiveness", "Benevolence", "Divine grace"],
        associated: "The Binding of Isaac",
        citation: "Genesis 22, Kabbalistic tradition"
    },
    {
        name: "Kamael",
        hebrew: "כמאל",
        title: "Severity of God",
        sphere: "Gevurah",
        role: "Angel of Strength and War",
        description: "Archangel of strength, courage, and war. Punishes wickedness but also gives strength to the righteous.",
        powers: ["Divine strength", "Courage", "Righteous warfare", "Boundaries"],
        associated: "The Seraphim",
        citation: "Kabbalistic tradition"
    },
    {
        name: "Michael",
        hebrew: "מיכאל",
        title: "Who is Like God",
        sphere: "Tiferet",
        role: "Prince of Angels, Protector of Israel",
        description: "Chief of archangels, warrior against evil, protector and advocate for Israel.",
        powers: ["Divine protection", "Battle against evil", "Balance", "Truth"],
        associated: "Israel's guardian angel",
        citation: "Daniel 10:13, Revelation 12:7"
    },
    {
        name: "Haniel",
        hebrew: "האניאל",
        title: "Grace of God",
        sphere: "Netzach",
        role: "Angel of Love and Harmony",
        description: "Archangel of grace, beauty, and  harmony. Aids in developing intuition and finding inner peace.",
        powers: ["Grace", "Beauty", "Endurance", "Harmony"],
        associated: "Venus, beauty",
        citation: "Kabbalistic tradition"
    },
    {
        name: "Raphael",
        hebrew: "רפאל",
        title: "God Heals",
        sphere: "Hod",
        role: "Angel of Healing",
        description: "The divine physician, healer of earth and mankind. Guided Tobias and healed his father.",
        powers: ["Healing", "Science", "Knowledge", "Communication"],
        associated: "Book of Tobit, healing",
        citation: "Tobit 12:15, rabbinic tradition"
    },
    {
        name: "Gabriel",
        hebrew: "גבריאל",
        title: "Strength of God / God is My Strength",
        sphere: "Yesod",
        role: "Messenger Angel",
        description: "Divine messenger, announcer of prophecies. Revealed visions to Daniel and announced births.",
        powers: ["Messages", "Prophecy", "Dreams", "Revelation"],
        associated: "Annunciation, prophecy",
        citation: "Daniel 8:16, Luke 1:26"
    },
    {
        name: "Sandalphon",
        hebrew: "סנדלפון",
        title: "Co-Brother",
        sphere: "Malkhut",
        role: "Angel of Prayer",
        description: "Twin brother of Metatron. Gathers and weaves prayers into garlands for God. Very tall angel.",
        powers: ["Prayer transmission", "Earthly connection", "Protection"],
        associated: "The transformed Elijah",
        citation: "Talmudic and Kabbalistic tradition"
    }
];

// === DEMONS & MAJOR ADVERSARIES ===
const DEMONS = [
    {
        name: "Satan",
        hebrew: "שטן",
        title: "The Adversary / The Accuser",
        role: "Tester and Accuser",
        description: "In Jewish tradition, Satan is not a rebel but God's prosecuting attorney who tests humans and accuses them before the heavenly court.",
        powers: ["Testing faith", "Accusation", "Temptation"],
        opposes: "Humanity's righteousness",
        citation: "Job 1-2, Zechariah 3:1-2"
    },
    {
        name: "Lilith",
        hebrew: "לילית",
        title: "Queen of Demons / Night Hag",
        role: "Seductress and Child-Stealer",
        description: "Adam's first wife who refused submission and became queen of demons. Seduces men, harms children, rules the night.",
        powers: ["Seduction", "Child harm", "Night terrors", "Independence taken to extreme"],
        opposes: "Sacred marriage, children",
        citation: "Alphabet of Ben Sira, Talmudic references, Isaiah 34:14"
    },
    {
        name: "Asmodeus",
        hebrew: "אשמדאי",
        title: "King of Demons",
        role: "Demon of Lust and Wrath",
        description: "King of demons, master of lust, rage, and destruction. Killed Sarah's seven husbands in Book of Tobit.",
        powers: ["Lust", "Wrath", "Destruction of marriages", "Gambling"],
        opposes: "Holy marriage",
        citation: "Book of Tobit, Talmud"
    },
    {
        name: "Azazel",
        hebrew: "עזאזל",
        title: "The Scapegoat Demon",
        role: "Receiver of Sins",
        description: "Demon to whom the scapegoat is sent on Yom Kippur bearing Israel's sins. One of the fallen angels who taught forbidden knowledge.",
        powers: ["Bearing sins", "Forbidden knowledge", "Corruption"],
        opposes: "Purity, innocence",
        citation: "Leviticus 16, Book of Enoch"
    },
    {
        name: "Samael",
        hebrew: "סמאל",
        title: "Poison of God / Angel of Death",
        role: "Seducer and Destroyer",
        description: "Angel of Death and prince of demons. Rides a serpent, seduced Eve, accuser of Israel. Paradoxically serves God.",
        powers: ["Death", "Seduction", "Accusation", "Poison"],
        opposes: "Life, innocence",
        citation: "Talmud, Pirke de-Rabbi Eliezer"
    },
    {
        name: "Mastema",
        hebrew: "משטמה",
        title: "Angel of Hostility",
        role: "Adversary and Punisher",
        description: "Leader of demons who carries out God's punishment. Tests and tempts humans with divine permission.",
        powers: ["Testing", "Punishment", "Hostility"],
        opposes: "Human faithfulness",
        citation: "Book of Jubilees"
    }
];

// === PARTZUFIM (DIVINE FACES/PERSONAS) ===
const PARTZUFIM = [
    {
        name: "Atik Yomin",
        hebrew: "עתיק יומין",
        meaning: "Ancient of Days",
        location: "Keter",
        description: "The most concealed divine persona, representing God's infinite patience and endurance through time. The Ancient One who contains all ages.",
        gender: "Beyond gender",
        relationship: "Source of all other Partzufim",
        citation: "Daniel 7:9, Zohar"
    },
    {
        name: "Arikh Anpin",
        hebrew: "אריך אנפין",
        meaning: "Long Face / Vast Countenance",
        location: "Keter (lower)",
        description: "The patient one, representing God's infinite mercy and long-suffering nature. Contains all  divine attributes in potential.",
        gender: "Masculine",
        relationship: "Father of Abba and Imma",
        citation: "Zohar, Idra Rabba"
    },
    {
        name: "Abba",
        hebrew: "אבא",
        meaning: "Father",
        location: "Chokmah",
        description: "The Supernal Father, source of wisdom and creative insight. The masculine generative principle.",
        gender: "Masculine",
        relationship: "Husband of Imma, Father of Ze'ir Anpin and Nukva",
        citation: "Zohar extensively"
    },
    {
        name: "Imma",
        hebrew: "אמא",
        meaning: "Mother",
        location: "Binah",
        description: "The Supernal Mother, source of understanding and form. Gestates the seed of wisdom into structure.",
        gender: "Feminine",
        relationship: "Wife of Abba, Mother of Ze'ir Anpin and Nukva",
        citation: "Zohar extensively"
    },
    {
        name: "Ze'ir Anpin",
        hebrew: "זעיר אנפין",
        meaning: "Small Face / Short Countenance / Impatient",
        location: "Tiferet (+ Chesed, Gevurah, Netzach, Hod, Yesod)",
        description: "The main personality of God that interacts with creation. Contains 6 Sefirot. Can be merciful or judging. The divine masculine in relationship to creation.",
        gender: "Masculine",
        relationship: "Son of Abba and Imma, Husband of Nukva",
        attributes: "Compassion, Beauty, Truth, but also judgment",
        citation: "Zohar, Etz Chaim"
    },
    {
        name: "Nukva",
        hebrew: "נוקבא",
        meaning: "Female / Feminine",
        location: "Malkhut",
        description: "Also called the Shekhinah - the Divine Feminine presence in creation. The Bride who will ultimately reunite with Ze'ir Anpin (the Groom) in the messianic age.",
        gender: "Feminine",
        relationship: "Daughter of Abba and Imma, Wife of Ze'ir Anpin",
        attributes: "Sovereignty, Kingdom, the Shekhinah in exile",
        citation: "Zohar, Kabbalah literature"
    }
];

// === MYTHOLOGICAL CONCEPTS ===
const CONCEPTS = [
    {
        id: "shekhinah",
        name: "Shekhinah",
        hebrew: "שכינה",
        category: "Divine Presence",
        description: "The Divine Presence, feminine aspect of God dwelling in creation. Went into exile with Israel and will return in messianic times.",
        relatedSefirah: "Malkhut",
        keyIdeas: ["Divine immanence", "God's presence in the world", "Exile and return"],
        citation: "Throughout Talmud and Kabbalah"
    },
    {
        id: "messiah",
        name: "Mashiach",
        hebrew: "משיח",
        category: "Eschatology",
        description: "The anointed one who will bring redemption, gather exiles, rebuild the Temple, and usher in the messianic age of peace.",
        relatedSefirah: "Tiferet",
        keyIdeas: ["Redemption", "Davidic lineage", "World peace", "End of exile"],
        citation: "Isaiah, Talmud, extensive rabbinic literature"
    },
    {
        id: "tikkun",
        name: "Tikkun Olam",
        hebrew: "תיקון עולם",
        category: "Cosmic Repair",
        description: "Repairing/perfecting the world. After the Breaking of Vessels, humanity's task is to elevate the 288 fallen sparks and restore creation.",
        relatedSefirah: "All",
        keyIdeas: ["Repairing broken vessels", "Elevating sparks", "Human responsibility for perfecting creation"],
        citation: "Lurianic Kabbalah"
    },
    {
        id: "shevirah",
        name: "Shevirat HaKelim",
        hebrew: "שבירת הכלים",
        category: "Cosmic Catastrophe",
        description: "The Breaking of the Vessels - primordial catastrophe where divine vessels couldn't contain the light and shattered, scattering 288 sparks.",
        relatedSefirah: "All",
        keyIdeas: ["Primordial catastrophe", "288 sparks", "Origin of evil", "Need for redemption"],
        citation: "Isaac Luria's Kabbalah"
    },
    {
        id: "tzimtzum",
        name: "Tzimtzum",
        hebrew: "צמצום",
        category: "Divine Contraction",
        description: "God's 'withdrawal' or 'contraction' to create space for creation. The infinite light contracted to make room for finite existence.",
        relatedSefirah: "Keter/Binah",
        keyIdeas: ["Divine self-limitation", "Creation of space", "Making room for free will"],
        citation: "Lurianic Kabbalah"
    },
    {
        id: "adam-kadmon",
        name: "Adam Kadmon",
        hebrew: "אדם קדמון",
        category: "Primordial Being",
        description: "Primordial Man - the first configuration of divine light, blueprint for all creation including humans.",
        relatedSefirah: "All (as template)",
        keyIdeas: ["Divine blueprint", "Cosmic anthropomorphism", "Humans as microcosm"],
        citation: "Lurianic Kabbalah"
    },
    {
        id: "yetzer",
        name: "Yetzer HaRa & Yetzer HaTov",
        hebrew: "יצר הרע ויצר הטוב",
        category: "Human Nature",
        description: "The evil inclination and good inclination - two drives within every person. Evil inclination not inherently evil but can be channeled.",
        relatedSefirah: "Gevurah (Yetzer HaRa), Chesed (Yetzer HaTov)",
        keyIdeas: ["Human duality", "Free will", "Transformation of drives"],
        citation: "Talmud extensively"
    },
    {
        id: "gilgul",
        name: "Gilgul Neshamot",
        hebrew: "גלגול נשמות",
        category: "Reincarnation",
        description: "Transmigration of souls - souls reincarnate to complete their tikkun (rectification) and fulfill their purpose.",
        relatedSefirah: "Yesod (as channel)",
        keyIdeas: ["Reincarnation", "Soul correction", "Multiple lifetimes"],
        citation: "Kabbalistic texts, Zohar"
    }
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QLIPPOT,
        ARCHANGELS,
        DEMONS,
        PARTZUFIM,
        CONCEPTS
    };
}

/**
 * Generate Asset Manifest for 10,000 Mythology Assets
 *
 * Creates comprehensive lists of entities to generate across all mythologies.
 * Outputs manifest files that can be fed to the generation script.
 *
 * Usage:
 *   node scripts/generate-asset-manifest.js
 *
 * Output:
 *   scripts/manifests/deities-manifest.json
 *   scripts/manifests/creatures-manifest.json
 *   scripts/manifests/heroes-manifest.json
 *   etc.
 */

const fs = require('fs');
const path = require('path');

const MANIFESTS_DIR = path.join(__dirname, 'manifests');

// Ensure manifests directory exists
if (!fs.existsSync(MANIFESTS_DIR)) {
    fs.mkdirSync(MANIFESTS_DIR, { recursive: true });
}

// Load existing assets to avoid duplicates
function loadExistingIds() {
    const ids = new Set();
    const assetsDir = path.join(__dirname, '..', 'firebase-assets-downloaded');

    const collections = fs.readdirSync(assetsDir).filter(f =>
        fs.statSync(path.join(assetsDir, f)).isDirectory()
    );

    for (const coll of collections) {
        const files = fs.readdirSync(path.join(assetsDir, coll))
            .filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(assetsDir, coll, file)));
                if (data.id) ids.add(data.id.toLowerCase());
                if (data.name) ids.add(data.name.toLowerCase());
            } catch (e) {}
        }
    }
    return ids;
}

// =====================================================
// DEITY MANIFESTS BY MYTHOLOGY
// =====================================================

const DEITIES = {
    greek: [
        // Olympians (existing: Zeus, Athena, Apollo, etc.)
        'Hecate', 'Pan', 'Eris', 'Nemesis', 'Tyche', 'Nike', 'Eros', 'Hypnos', 'Thanatos',
        'Morpheus', 'Helios', 'Selene', 'Eos', 'Iris', 'Eileithyia', 'Enyo', 'Phobos', 'Deimos',
        'Asclepius', 'Hygieia', 'Panacea', 'Telesphorus', 'Aceso', 'Iaso',
        // Titans
        'Kronos', 'Rhea', 'Hyperion', 'Theia', 'Coeus', 'Phoebe', 'Oceanus', 'Tethys',
        'Mnemosyne', 'Themis', 'Crius', 'Iapetus', 'Atlas', 'Prometheus', 'Epimetheus',
        // Primordials
        'Chaos', 'Gaia', 'Tartarus', 'Erebus', 'Nyx', 'Aether', 'Hemera', 'Pontus', 'Ouranos',
        // River gods and nymphs
        'Achelous', 'Alpheus', 'Peneus', 'Scamander', 'Styx', 'Acheron', 'Lethe', 'Phlegethon',
        // Muses
        'Calliope', 'Clio', 'Erato', 'Euterpe', 'Melpomene', 'Polyhymnia', 'Terpsichore', 'Thalia', 'Urania',
        // Graces and Fates
        'Aglaea', 'Euphrosyne', 'Clotho', 'Lachesis', 'Atropos',
        // Winds
        'Boreas', 'Notus', 'Eurus', 'Zephyrus', 'Aeolus'
    ],

    roman: [
        'Jupiter', 'Juno', 'Neptune', 'Pluto', 'Mars', 'Venus', 'Mercury', 'Minerva',
        'Diana', 'Vulcan', 'Vesta', 'Ceres', 'Bacchus', 'Cupid', 'Aurora', 'Luna', 'Sol',
        'Janus', 'Saturn', 'Ops', 'Bellona', 'Victoria', 'Fortuna', 'Faunus', 'Flora',
        'Pomona', 'Terminus', 'Silvanus', 'Quirinus', 'Liber', 'Libera', 'Proserpina',
        'Dis Pater', 'Orcus', 'Manes', 'Lares', 'Penates', 'Genius', 'Parcae', 'Furies'
    ],

    norse: [
        // Aesir
        'Frigg', 'Baldur', 'Tyr', 'Heimdall', 'Bragi', 'Idunn', 'Hodr', 'Vidar', 'Vali',
        'Forseti', 'Ull', 'Hoenir', 'Lodur', 'Mimir', 'Saga', 'Eir', 'Gefjon', 'Fulla', 'Snotra',
        // Vanir
        'Freya', 'Freyr', 'Njord', 'Nerthus', 'Kvasir', 'Gerd',
        // Loki family
        'Loki', 'Sigyn', 'Angrboda', 'Fenrir', 'Hel', 'Jormungandr', 'Narfi', 'Vali',
        // Giants
        'Ymir', 'Surt', 'Thrym', 'Skadi', 'Aegir', 'Ran', 'Hymir', 'Thiazi', 'Utgard-Loki',
        // Dwarves
        'Brokk', 'Sindri', 'Dvalin', 'Alviss'
    ],

    egyptian: [
        // Major deities
        'Ra', 'Osiris', 'Isis', 'Horus', 'Set', 'Nephthys', 'Anubis', 'Thoth', 'Hathor',
        'Sekhmet', 'Bastet', 'Ptah', 'Atum', 'Khnum', 'Sobek', 'Khonsu', 'Nut', 'Geb', 'Shu', 'Tefnut',
        // Lesser deities
        'Maat', 'Seshat', 'Serket', 'Neith', 'Wadjet', 'Nekhbet', 'Renenutet', 'Taweret', 'Bes',
        'Khepri', 'Aten', 'Amun', 'Mut', 'Montu', 'Min', 'Hapi', 'Qetesh', 'Resheph', 'Anuket',
        'Satis', 'Heqet', 'Meskhenet', 'Shed', 'Wepwawet', 'Duamutef', 'Hapy', 'Imsety', 'Qebehsenuef',
        'Ammit', 'Apep', 'Bennu', 'Medjed'
    ],

    hindu: [
        // Trimurti and consorts
        'Brahma', 'Vishnu', 'Shiva', 'Saraswati', 'Lakshmi', 'Parvati',
        // Major deities
        'Ganesha', 'Kartikeya', 'Krishna', 'Rama', 'Hanuman', 'Indra', 'Agni', 'Vayu', 'Varuna',
        'Surya', 'Chandra', 'Yama', 'Kubera', 'Kama', 'Durga', 'Kali', 'Radha',
        // Avatars of Vishnu
        'Matsya', 'Kurma', 'Varaha', 'Narasimha', 'Vamana', 'Parashurama', 'Balarama', 'Buddha', 'Kalki',
        // Vedic deities
        'Rudra', 'Pushan', 'Mitra', 'Aryaman', 'Bhaga', 'Daksha', 'Aditi', 'Diti', 'Ushas',
        'Ratri', 'Prithvi', 'Dyaus', 'Tvashtar', 'Savitar', 'Vishvakarma', 'Brihaspati', 'Soma',
        // Asuras
        'Vritra', 'Bali', 'Ravana', 'Mahishasura', 'Hiranyakashipu', 'Hiranyaksha',
        // Yakshas, Gandharvas, Apsaras
        'Chitraratha', 'Urvashi', 'Menaka', 'Rambha', 'Tilottama'
    ],

    chinese: [
        // Heavenly deities
        'Jade Emperor', 'Queen Mother of the West', 'Guan Yin', 'Nezha', 'Erlang Shen',
        // Eight Immortals
        'Lu Dongbin', 'Zhang Guolao', 'Han Xiangzi', 'Li Tieguai', 'He Xiangu', 'Lan Caihe', 'Cao Guojiu', 'Zhongli Quan',
        // Dragons
        'Azure Dragon', 'Dragon Kings', 'Ao Guang', 'Ao Qin', 'Ao Run', 'Ao Shun',
        // Star deities
        'Wenchang Wang', 'Kui Xing', 'Tai Sui', 'Zhenwu', 'Beiji Dadi',
        // Earth deities
        'Tu Di Gong', 'Cheng Huang', 'Zao Jun', 'Men Shen', 'Cai Shen', 'Fu Lu Shou',
        // Underworld
        'Yanluo Wang', 'Dizang', 'Ox-Head', 'Horse-Face', 'Heibai Wuchang',
        // Nature spirits
        'Leigong', 'Dianmu', 'Feng Bo', 'Yu Shi', 'Houyi', 'Chang\'e'
    ],

    japanese: [
        // Major Kami
        'Amaterasu', 'Tsukuyomi', 'Susanoo', 'Izanagi', 'Izanami', 'Inari', 'Raijin', 'Fujin',
        'Hachiman', 'Tenjin', 'Benzaiten', 'Bishamon', 'Daikoku', 'Ebisu', 'Fukurokuju', 'Hotei', 'Jurojin',
        // Shinto deities
        'Okuninushi', 'Sarutahiko', 'Ame-no-Uzume', 'Takemikazuchi', 'Futsunushi', 'Oyamatsumi',
        'Konohanasakuya-hime', 'Iwanaga-hime', 'Ninigi', 'Hoori', 'Hoderi', 'Ugayafukiaezu',
        // Buddhist-Shinto syncretism
        'Fudo Myoo', 'Kannon', 'Jizo', 'Emma-O', 'Dainichi Nyorai', 'Yakushi Nyorai',
        // Nature Kami
        'Suijin', 'Kagutsuchi', 'Uka no Mitama', 'Wakahirume', 'Hiruko'
    ],

    mesopotamian: [
        // Sumerian
        'An', 'Ki', 'Enlil', 'Enki', 'Ninhursag', 'Inanna', 'Utu', 'Nanna', 'Ereshkigal',
        'Nergal', 'Dumuzi', 'Ninurta', 'Nammu', 'Ningal', 'Ningishzida', 'Geshtinanna',
        // Babylonian
        'Marduk', 'Ea', 'Ishtar', 'Shamash', 'Sin', 'Nabu', 'Nergal', 'Tiamat', 'Apsu',
        'Kingu', 'Anshar', 'Kishar', 'Anu', 'Adad', 'Girra', 'Nanshe', 'Nisaba',
        // Assyrian
        'Ashur', 'Ishtar of Arbela', 'Nusku', 'Ninurta'
    ],

    celtic: [
        // Irish
        'Dagda', 'Morrigan', 'Brigid', 'Lugh', 'Nuada', 'Danu', 'Ogma', 'Dian Cecht',
        'Goibniu', 'Credne', 'Luchta', 'Manannan mac Lir', 'Aengus', 'Boann', 'Midir',
        'Etain', 'Flidais', 'Cernunnos', 'Epona', 'Taranis', 'Teutates', 'Esus',
        // Welsh
        'Arawn', 'Pwyll', 'Rhiannon', 'Pryderi', 'Bran', 'Branwen', 'Manawydan', 'Math',
        'Gwydion', 'Arianrhod', 'Lleu', 'Dylan', 'Blodeuwedd', 'Gronw Pebr',
        // Gaulish
        'Belenos', 'Grannus', 'Sequana', 'Sulis', 'Nehalennia', 'Rosmerta'
    ],

    african: [
        // Yoruba/West African
        'Olorun', 'Obatala', 'Ogun', 'Shango', 'Yemoja', 'Oshun', 'Oya', 'Eshu', 'Orunmila',
        'Shopona', 'Osanyin', 'Oko', 'Nana Buruku', 'Aganju', 'Olokun', 'Egungun',
        // Egyptian (already listed above)
        // Dahomey/Fon
        'Mawu-Lisa', 'Da', 'Gu', 'Age', 'Legba', 'Sakpata', 'Sogbo',
        // Akan
        'Nyame', 'Asase Ya', 'Bia', 'Tano', 'Anansi',
        // Zulu
        'Unkulunkulu', 'Nomkhubulwane', 'Mamlambo',
        // San
        'Cagn', 'Mantis'
    ],

    polynesian: [
        // Hawaiian
        'Kane', 'Ku', 'Lono', 'Kanaloa', 'Pele', 'Hi\'iaka', 'Namaka', 'Poliahu', 'Maui',
        'Papa', 'Wakea', 'Laka', 'Kapo',
        // Maori
        'Rangi', 'Tu', 'Tane', 'Rongo', 'Tangaroa', 'Tawhiri', 'Ruaumoko', 'Hine-nui-te-po',
        'Maui', 'Papatuanuku',
        // Tahitian/Samoan/Tongan
        'Ta\'aroa', 'Oro', 'Tiki', 'Tangaloa', 'Nafanua'
    ],

    mesoamerican: [
        // Aztec
        'Quetzalcoatl', 'Tezcatlipoca', 'Huitzilopochtli', 'Tlaloc', 'Xipe Totec', 'Coatlicue',
        'Coyolxauhqui', 'Tonatiuh', 'Mictlantecuhtli', 'Mictecacihuatl', 'Chalchiuhtlicue',
        'Tlazolteotl', 'Xochiquetzal', 'Xochipilli', 'Ehecatl', 'Centeotl', 'Chicomecoatl',
        // Mayan
        'Itzamna', 'Ix Chel', 'Chaac', 'Kukulkan', 'Kinich Ahau', 'Ah Puch', 'Hun Hunahpu',
        'Xbalanque', 'Hunahpu', 'Camazotz', 'Ixtab', 'Ek Chuaj', 'Buluc Chabtan',
        // Inca
        'Inti', 'Mama Quilla', 'Pachamama', 'Viracocha', 'Illapa', 'Mama Cocha', 'Supay'
    ],

    slavic: [
        'Perun', 'Veles', 'Svarog', 'Dazhbog', 'Stribog', 'Mokosh', 'Rod', 'Lada',
        'Marzanna', 'Jarilo', 'Kupala', 'Svarozhich', 'Triglav', 'Chernobog', 'Belobog',
        'Simargl', 'Zorya', 'Devana', 'Radegast'
    ],

    finnish: [
        'Ukko', 'Akka', 'Tapio', 'Mielikki', 'Ahti', 'Vellamo', 'Tuoni', 'Tuonetar',
        'Ilmatar', 'Vainamoinen', 'Lemminkainen', 'Louhi', 'Kalma', 'Surma', 'Pekko'
    ],

    persian: [
        'Ahura Mazda', 'Angra Mainyu', 'Mithra', 'Anahita', 'Atar', 'Vohu Manah', 'Asha Vahishta',
        'Khshathra Vairya', 'Spenta Armaiti', 'Haurvatat', 'Ameretat', 'Sraosha', 'Rashnu',
        'Verethragna', 'Tishtrya', 'Daena', 'Ashi', 'Haoma', 'Zarich', 'Taurvi'
    ],

    abrahamic: [
        // Angels
        'Michael', 'Gabriel', 'Raphael', 'Uriel', 'Metatron', 'Sandalphon', 'Azrael',
        'Chamuel', 'Jophiel', 'Zadkiel', 'Raziel', 'Haniel', 'Cassiel', 'Sachiel',
        'Samael', 'Sariel', 'Raguel', 'Remiel', 'Phanuel',
        // Archangels and Seraphim
        'Seraphim', 'Cherubim', 'Thrones', 'Dominions', 'Virtues', 'Powers', 'Principalities',
        // Islamic angels
        'Jibrail', 'Mikail', 'Israfil', 'Azrael', 'Munkar', 'Nakir', 'Harut', 'Marut',
        // Demons/Fallen
        'Lucifer', 'Beelzebub', 'Asmodeus', 'Belphegor', 'Mammon', 'Leviathan', 'Satan',
        'Azazel', 'Belial', 'Abaddon', 'Mephistopheles', 'Lilith'
    ]
};

// =====================================================
// CREATURES MANIFEST
// =====================================================

const CREATURES = {
    dragons: [
        'Fafnir', 'Ladon', 'Nidhogg', 'Yamata no Orochi', 'Vritra', 'Typhon', 'Tiamat',
        'Jormungandr', 'Quetzalcoatl', 'Apophis', 'Zu', 'Mushussu', 'Kur', 'Leviathan',
        'Behemoth', 'Wyvern', 'Drake', 'Basilisk', 'Cockatrice', 'Hydra', 'Lindworm',
        'Amphisbaena', 'Guivre', 'Knucker', 'Tarasque', 'Loong', 'Yinglong', 'Tianlong',
        'Shenlong', 'Fucanglong', 'Dilong', 'Ryujin', 'Imugi', 'Naga King', 'Zilant'
    ],

    giants: [
        'Cyclopes', 'Hecatoncheires', 'Antaeus', 'Polyphemus', 'Alcyoneus', 'Enceladus',
        'Porphyrion', 'Argus Panoptes', 'Geryon', 'Cacus', 'Laestrygonians',
        'Frost Giants', 'Fire Giants', 'Mountain Giants', 'Fornjotr', 'Bergelmir',
        'Hrungnir', 'Geirrod', 'Bestla', 'Bolthur', 'Fomorians', 'Balor', 'Bres',
        'Daityas', 'Asuras', 'Rakshasas', 'Oni', 'Gashadokuro', 'Daidarabotchi',
        'Quinotaur', 'Nephilim', 'Anakim', 'Rephaim', 'Goliath', 'Og of Bashan'
    ],

    undead: [
        'Vampire', 'Strigoi', 'Nosferatu', 'Dhampir', 'Jiang Shi', 'Penanggalan',
        'Manananggal', 'Aswang', 'Vetala', 'Pishacha', 'Ghoul', 'Revenant', 'Draugr',
        'Haugbui', 'Wiederganger', 'Nachzehrer', 'Strix', 'Lamia', 'Empusa', 'Moroi',
        'Vrykolakas', 'Banshee', 'Dullahan', 'Wraith', 'Spectre', 'Poltergeist',
        'Yurei', 'Onryo', 'Funayurei', 'Jikininki', 'Gaki', 'Hungry Ghost'
    ],

    shapeshifters: [
        'Werewolf', 'Lycanthrope', 'Loup-garou', 'Skinwalker', 'Nagual', 'Berserker',
        'Ulfhednar', 'Kitsune', 'Tanuki', 'Bakeneko', 'Nekomata', 'Inugami',
        'Selkie', 'Roane', 'Swan Maiden', 'Huldra', 'Nymph', 'Dryad', 'Naiad',
        'Nereid', 'Oceanid', 'Oread', 'Satyr', 'Faun', 'Centaur', 'Minotaur',
        'Púca', 'Kelpie', 'Each-uisge', 'Nuckelavee', 'Encantado'
    ],

    chimeras: [
        'Chimera', 'Griffin', 'Hippogriff', 'Manticore', 'Sphinx', 'Lamassu',
        'Shedu', 'Anzu', 'Simurgh', 'Huma', 'Garuda', 'Qilin', 'Pixiu', 'Baku',
        'Nue', 'Ammit', 'Criosphinx', 'Hieracosphinx', 'Androsphinx', 'Echidna',
        'Orthrus', 'Cerberus', 'Crocotta', 'Leucrotta', 'Peryton', 'Yale',
        'Bonnacon', 'Catoblepas', 'Aqrabuamelu'
    ],

    water_creatures: [
        'Mermaid', 'Merman', 'Triton', 'Siren', 'Ningyo', 'Rusalka', 'Vodyanoy',
        'Kraken', 'Scylla', 'Charybdis', 'Cetus', 'Kappa', 'Kelpie', 'Hippocampus',
        'Capricorn', 'Makara', 'Isonade', 'Umi Bozu', 'Ayakashi', 'Funayurei',
        'Jengu', 'Mami Wata', 'Yacuruna', 'Encantado', 'Iara', 'Boiuna',
        'Taniwha', 'Bunyip', 'Rainbow Serpent', 'Mokele-mbembe', 'Lusca'
    ],

    flying_creatures: [
        'Phoenix', 'Roc', 'Thunderbird', 'Ziz', 'Fenghuang', 'Vermillion Bird',
        'Suzaku', 'Garuda', 'Harpies', 'Stymphalian Birds', 'Alkonost', 'Sirin',
        'Gamayun', 'Caladrius', 'Cinnabar Bird', 'Hraesvelgr', 'Cockatrice',
        'Peng', 'Perytons', 'Pegasus', 'Hippogriff', 'Winged Horse', 'Sleipnir'
    ],

    fey_spirits: [
        'Sidhe', 'Tuatha De Danann', 'Aos Si', 'Pixie', 'Sprite', 'Brownie',
        'Leprechaun', 'Clurichaun', 'Far Darrig', 'Pooka', 'Changeling', 'Fetch',
        'Banshee', 'Bean Nighe', 'Leanan Sidhe', 'Dearg Due', 'Dullahan',
        'Will-o\'-the-wisp', 'Jack-o\'-lantern', 'Corpse Candle', 'Hinky Punk',
        'Kobold', 'Nisse', 'Tomte', 'Domovoi', 'Leshy', 'Vodyanoy', 'Rusalka',
        'Vila', 'Samodiva', 'Iele', 'Zana', 'Xana', 'Anjana'
    ],

    demons: [
        'Demon', 'Devil', 'Incubus', 'Succubus', 'Imp', 'Hellhound',
        'Oni', 'Tengu', 'Jorōgumo', 'Yuki-onna', 'Yamauba', 'Shikome',
        'Rakshasa', 'Vetala', 'Preta', 'Asura', 'Yaksha', 'Pishacha',
        'Div', 'Daeva', 'Druj', 'Aeshma', 'Aka Manah', 'Nasu',
        'Djinn', 'Ifrit', 'Marid', 'Ghul', 'Shaytan', 'Iblis',
        'Dybbuk', 'Shedim', 'Se\'irim', 'Mazzikim', 'Lilin'
    ],

    guardians: [
        'Cerberus', 'Lamassu', 'Shedu', 'Sphinx', 'Fu Dog', 'Komainu',
        'Shisa', 'Pixiu', 'Qilin', 'Dragon Turtle', 'Temple Guardian',
        'Bennu', 'Ba', 'Ka', 'Akh', 'Seraph', 'Cherub', 'Throne'
    ]
};

// =====================================================
// HEROES MANIFEST
// =====================================================

const HEROES = {
    greek: [
        'Achilles', 'Odysseus', 'Ajax', 'Diomedes', 'Patroclus', 'Hector', 'Paris',
        'Theseus', 'Jason', 'Bellerophon', 'Cadmus', 'Oedipus', 'Peleus', 'Telamon',
        'Atalanta', 'Meleager', 'Castor', 'Pollux', 'Pelops', 'Tantalus', 'Sisyphus',
        'Ixion', 'Pirithous', 'Hippolyta', 'Penthesilea', 'Antiope', 'Deucalion', 'Pyrrha'
    ],

    norse: [
        'Sigurd', 'Ragnar Lothbrok', 'Beowulf', 'Starkad', 'Hadding', 'Helgi',
        'Hrolf Kraki', 'Bodvar Bjarki', 'Sigmund', 'Sinfjotli', 'Gudrun', 'Brynhild',
        'Volund', 'Egil', 'Aslaug', 'Lagertha', 'Ivar the Boneless', 'Bjorn Ironside'
    ],

    celtic: [
        'Cu Chulainn', 'Finn mac Cumhaill', 'Oisin', 'Oscar', 'Diarmuid', 'Goll mac Morna',
        'Cormac mac Airt', 'Niall of the Nine Hostages', 'Conchobar mac Nessa',
        'Fergus mac Roich', 'Medb', 'Scathach', 'Aoife', 'Deirdre', 'Grainne',
        'Taliesin', 'Myrddin', 'Arthur', 'Lancelot', 'Gawain', 'Percival', 'Galahad'
    ],

    hindu: [
        'Arjuna', 'Bhima', 'Yudhishthira', 'Nakula', 'Sahadeva', 'Karna', 'Abhimanyu',
        'Bhishma', 'Drona', 'Ashwatthama', 'Ekalavya', 'Ghatotkacha',
        'Rama', 'Lakshmana', 'Bharata', 'Shatrughna', 'Sita', 'Hanuman', 'Sugriva',
        'Savitri', 'Nala', 'Damayanti', 'Harishchandra', 'Prahlada'
    ],

    chinese: [
        'Sun Wukong', 'Guan Yu', 'Zhang Fei', 'Liu Bei', 'Cao Cao', 'Zhuge Liang',
        'Lu Bu', 'Zhao Yun', 'Hua Mulan', 'Yue Fei', 'Bao Zheng', 'Di Renjie',
        'Ne Zha', 'Erlang Shen', 'Hou Yi', 'Wu Song', 'Lin Chong', 'Song Jiang'
    ],

    japanese: [
        'Yamato Takeru', 'Minamoto no Yoshitsune', 'Benkei', 'Abe no Seimei',
        'Momotaro', 'Kintaro', 'Urashima Taro', 'Issun-boshi', 'Susanoo',
        'Jimmu', 'Takeuchi no Sukune', 'Empress Jingu', 'Tomoe Gozen', 'Miyamoto Musashi'
    ],

    mesopotamian: [
        'Gilgamesh', 'Enkidu', 'Etana', 'Adapa', 'Lugalbanda', 'Ziusudra',
        'Sargon of Akkad', 'Naram-Sin'
    ],

    persian: [
        'Rostam', 'Sohrab', 'Esfandiar', 'Zal', 'Rudaba', 'Siavash', 'Kay Khosrow',
        'Bahram Gur', 'Fereydun', 'Kaveh', 'Arash', 'Gordafarid'
    ],

    african: [
        'Sundiata Keita', 'Shaka Zulu', 'Mansa Musa', 'Anansi', 'Mwindo',
        'Liongo', 'Ozidi', 'Sunjata', 'Gassire'
    ]
};

// =====================================================
// SACRED ITEMS MANIFEST
// =====================================================

const ITEMS = {
    weapons: [
        // Swords
        'Excalibur', 'Clarent', 'Carnwennan', 'Dyrnwyn', 'Caladbolg', 'Fragarach',
        'Gram', 'Tyrfing', 'Dainsleif', 'Hofud', 'Ridill', 'Hrotti',
        'Kusanagi', 'Ama-no-Murakumo', 'Totsuka-no-Tsurugi', 'Futsu-no-Mitama',
        'Harpe', 'Sword of Damocles', 'Crocea Mors', 'Joyeuse', 'Durandal', 'Curtana',
        // Spears/Lances
        'Gungnir', 'Gae Bolg', 'Gae Buide', 'Gae Dearg', 'Rhongomyniad', 'Amenonuhoko',
        'Lance of Longinus', 'Spear of Lugh', 'Trident of Poseidon', 'Vel',
        // Hammers/Clubs
        'Mjolnir', 'Vajra', 'Ruyi Jingu Bang', 'Club of Dagda', 'Gada',
        // Bows
        'Gandiva', 'Vijaya', 'Pinaka', 'Sharanga', 'Kodanda', 'Apollo\'s Bow',
        // Axes
        'Parashu', 'Labrys', 'Axe of Perun'
    ],

    armor: [
        'Aegis', 'Golden Fleece', 'Armor of Achilles', 'Armor of Beowulf',
        'Shirt of Nessus', 'Cap of Invisibility', 'Tarnkappe', 'Helm of Awe',
        'Draupnir', 'Ring of Gyges', 'Andvaranaut', 'Brisingamen', 'Megingjord',
        'Girdle of Hippolyta', 'Talaria', 'Winged Sandals', 'Caduceus'
    ],

    vessels: [
        'Holy Grail', 'Cauldron of Dagda', 'Cauldron of Cerridwen', 'Cauldron of Rebirth',
        'Cornucopia', 'Horn of Plenty', 'Drinking Horn of Thor', 'Gjallarhorn',
        'Pandora\'s Box', 'Ark of the Covenant', 'Canopic Jars'
    ],

    instruments: [
        'Lyre of Orpheus', 'Lyre of Apollo', 'Harp of Dagda', 'Horn of Roland',
        'Pipes of Pan', 'Conch of Triton', 'Drums of the Underworld'
    ]
};

// =====================================================
// SACRED PLACES MANIFEST
// =====================================================

const PLACES = {
    mountains: [
        'Mount Olympus', 'Mount Meru', 'Mount Kunlun', 'Mount Fuji', 'Mount Sinai',
        'Mount Kailash', 'Mount Ida', 'Mount Parnassus', 'Mount Helicon',
        'Ayers Rock', 'Devils Tower', 'Mount Shasta', 'Glastonbury Tor'
    ],

    underworlds: [
        'Hades', 'Tartarus', 'Elysium', 'Asphodel Meadows', 'Fields of Punishment',
        'Helheim', 'Niflheim', 'Duat', 'Diyu', 'Yomi', 'Naraka', 'Sheol', 'Gehenna',
        'Xibalba', 'Mictlan', 'Annwn'
    ],

    heavens: [
        'Valhalla', 'Asgard', 'Tian', 'Takamagahara', 'Svarga', 'Brahmaloka',
        'Mount Olympus', 'Elysium', 'Garden of Eden', 'Paradise', 'Jannah',
        'Pure Land', 'Nirvana'
    ],

    mystical: [
        'Avalon', 'Atlantis', 'Lemuria', 'Mu', 'Hyperborea', 'Thule', 'Shambhala',
        'El Dorado', 'Hy-Brasil', 'Tir na nOg', 'Mag Mell', 'Lyonesse', 'Ys'
    ],

    temples: [
        'Delphi', 'Dodona', 'Temple of Artemis', 'Parthenon', 'Oracle of Delphi',
        'Temple of Solomon', 'Karnak', 'Abu Simbel', 'Angkor Wat', 'Borobudur'
    ]
};

// =====================================================
// MAIN EXECUTION
// =====================================================

function generateManifest(name, data, existingIds) {
    const items = [];

    for (const [category, entities] of Object.entries(data)) {
        for (const entity of entities) {
            const id = entity.toLowerCase().replace(/[^a-z0-9]+/g, '_');

            // Skip if already exists
            if (existingIds.has(id) || existingIds.has(entity.toLowerCase())) {
                continue;
            }

            items.push({
                name: entity,
                id: id,
                category: category,
                type: name.replace('-manifest', '').replace('s$', ''),
                status: 'pending'
            });
        }
    }

    return items;
}

function main() {
    console.log('Loading existing assets...');
    const existingIds = loadExistingIds();
    console.log(`Found ${existingIds.size} existing entity names/IDs`);

    const manifests = {
        deities: DEITIES,
        creatures: CREATURES,
        heroes: HEROES,
        items: ITEMS,
        places: PLACES
    };

    let totalNew = 0;

    for (const [name, data] of Object.entries(manifests)) {
        const items = generateManifest(name, data, existingIds);
        const outputFile = path.join(MANIFESTS_DIR, `${name}-manifest.json`);

        fs.writeFileSync(outputFile, JSON.stringify({
            type: name,
            generated: new Date().toISOString(),
            count: items.length,
            items: items
        }, null, 2));

        console.log(`${name}: ${items.length} new entities → ${outputFile}`);
        totalNew += items.length;
    }

    console.log(`\nTotal new entities to generate: ${totalNew}`);
    console.log('\nManifests saved to scripts/manifests/');
}

main();

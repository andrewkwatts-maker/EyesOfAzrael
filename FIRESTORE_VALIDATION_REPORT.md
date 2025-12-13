# Firestore Content Validation Report

**Generated:** 2025-12-13T04:45:50.188Z

---

## Executive Summary

### Validation Status: ❌ FAIL

| Metric | Count |
|--------|-------|
| **Local Content Files** | 376 |
| **Firestore Documents** | 1328 |
| **Matching Content** | 354 |
| **Missing in Firestore** | 22 |
| **Extra in Firestore** | 134 |
| **Metadata Mismatches** | 193 |
| **Completeness** | 94.15% |

### Quality Metrics

| Metric | Count |
|--------|-------|
| **Missing Mythology Field** | 0 |
| **Missing ContentType Field** | 282 |
| **Missing Name/Title Field** | 4 |
| **Empty/Short Descriptions** | 547 |

**Average Quality Score:** 58.88/100

---

## 1. Content Distribution by Mythology

| Mythology | Local Files | Firestore Docs | Missing | Extra | Status |
|-----------|-------------|----------------|---------|-------|--------|
| **apocryphal** | 0 | 0 | 0 | 0 | ✅ |
| **aztec** | 5 | 10 | 0 | 0 | ✅ |
| **babylonian** | 17 | 29 | 2 | 2 | ⚠️ |
| **buddhist** | 31 | 50 | 0 | 0 | ✅ |
| **celtic** | 12 | 22 | 1 | 1 | ⚠️ |
| **chinese** | 10 | 18 | 1 | 1 | ⚠️ |
| **christian** | 25 | 108 | 0 | 68 | ✅ |
| **egyptian** | 37 | 66 | 2 | 4 | ⚠️ |
| **greek** | 60 | 96 | 7 | 3 | ⚠️ |
| **hindu** | 36 | 59 | 1 | 0 | ⚠️ |
| **islamic** | 15 | 26 | 0 | 0 | ✅ |
| **japanese** | 10 | 16 | 4 | 4 | ⚠️ |
| **jewish** | 2 | 42 | 0 | 38 | ✅ |
| **mayan** | 5 | 10 | 0 | 0 | ✅ |
| **norse** | 34 | 59 | 1 | 1 | ⚠️ |
| **persian** | 22 | 34 | 1 | 0 | ⚠️ |
| **roman** | 25 | 48 | 0 | 0 | ✅ |
| **sumerian** | 15 | 23 | 2 | 2 | ⚠️ |
| **tarot** | 15 | 22 | 0 | 0 | ✅ |

---

## 2. Content Distribution by Type

| Content Type | Local Files | Firestore Docs | Missing | Extra | Matching | Status |
|--------------|-------------|----------------|---------|-------|----------|--------|
| **deities** | 185 | 380 | 2 | 14 | 183 | ⚠️ |
| **heroes** | 32 | 100 | 0 | 36 | 32 | ✅ |
| **creatures** | 29 | 30 | 1 | 2 | 28 | ⚠️ |
| **cosmology** | 65 | 65 | 4 | 4 | 61 | ⚠️ |
| **texts** | 1 | 70 | 0 | 68 | 1 | ✅ |
| **herbs** | 22 | 44 | 0 | 0 | 22 | ✅ |
| **rituals** | 20 | 40 | 0 | 0 | 20 | ✅ |
| **symbols** | 2 | 4 | 0 | 0 | 2 | ✅ |
| **concepts** | 5 | 15 | 0 | 10 | 5 | ✅ |
| **myths** | 9 | 0 | 9 | 0 | 0 | ⚠️ |
| **magic** | 1 | 0 | 1 | 0 | 0 | ⚠️ |
| **angels** | 0 | 0 | 0 | 0 | 0 | ✅ |
| **figures** | 5 | 0 | 5 | 0 | 0 | ⚠️ |

---

## 3. Content Missing in Firestore

❌ **22 files** found locally but NOT in Firestore:

### babylonian

#### cosmology (1)

- **Babylonian Creation Myth -**
  - File: `creation.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\babylonian\cosmology\creation.html`
  - Description: The Babylonian creation epic describes how the ordered cosmos emerged from primordial waters through...

#### creatures (1)

- **Babylonian Creatures**
  - File: `scorpion-men.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\babylonian\creatures\scorpion-men.html`
  - Description: The Scorpion-Men (Girtablilu in Akkadian, from girtablû "scorpion" + lû "man")
                are h...

### celtic

#### cosmology (1)

- **Celtic Afterlife -**
  - File: `afterlife.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\celtic\cosmology\afterlife.html`
  - Description: Celtic concepts of death and the afterlife differ profoundly from many other traditions. There is no...

### chinese

#### cosmology (1)

- **Chinese Creation Myth -**
  - File: `creation.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\chinese\cosmology\creation.html`
  - Description: In the beginning, there was only chaos—a swirling, formless void where Yin and Yang were inseparable...

### egyptian

#### deities (2)

- **King of the Gods | Egyptian Mythology**
  - File: `amun-ra.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\egyptian\deities\amun-ra.html`
  - Description: King of the Gods, The Hidden Sun...
- **The Self-Created God | Egyptian Mythology**
  - File: `atum.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\egyptian\deities\atum.html`
  - Description: The Complete One, First God, Setting Sun...

### greek

#### figures (4)

- **Greek Mythology**
  - File: `aeacus.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\figures\aeacus.html`
  - Description: Judge of the dead in the underworld....
- **Greek Mythology**
  - File: `charon.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\figures\charon.html`
  - Description: Ferryman who transports souls across the River Styx....
- **Greek Mythology**
  - File: `minos.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\figures\minos.html`
  - Description: King of Crete, judge of the dead in the underworld....
- **Greek Mythology**
  - File: `rhadamanthys.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\figures\rhadamanthys.html`
  - Description: Judge of the dead in the underworld....

#### myths (3)

- **Greek Mythology**
  - File: `judgment-of-paris.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\myths\judgment-of-paris.html`
  - Description: The Judgment of Paris
is one of Greek mythology's most consequential tales - a beauty contest among ...
- **Greek Mythology**
  - File: `orpheus.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\myths\orpheus.html`
  - Description: The tragic tale of Orpheus's journey to the underworld to retrieve his wife....
- **Greek Mythology**
  - File: `persephone.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\greek\myths\persephone.html`
  - Description: The myth of Persephone's abduction by Hades and the origin of the seasons....

### hindu

#### figures (1)

- **Hindu Mythology**
  - File: `chitragupta.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\hindu\figures\chitragupta.html`
  - Description: The divine accountant who maintains the book of karma, recording all deeds of every soul. Assists Ya...

### japanese

#### myths (4)

- **Japanese Mythology**
  - File: `amaterasu-cave.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\japanese\myths\amaterasu-cave.html`
  - Description: The myth of Amaterasu hiding in the Heavenly Rock Cave
is one of the most celebrated stories in Japa...
- **Japanese Mythology**
  - File: `creation-of-japan.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\japanese\myths\creation-of-japan.html`
  - Description: The Creation of Japan
is the foundational myth of Japanese cosmology, recorded in the Kojiki (712 CE...
- **Japanese Mythology**
  - File: `izanagi-yomi.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\japanese\myths\izanagi-yomi.html`
  - Description: The Journey of Izanagi to Yomi
is one of the foundational myths of Japanese Shinto tradition, record...
- **Japanese Mythology**
  - File: `susanoo-orochi.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\japanese\myths\susanoo-orochi.html`
  - Description: The myth of Susanoo slaying Yamata-no-Orochi
is one of the most celebrated hero tales in Japanese my...

### norse

#### cosmology (1)

- **Norse Afterlife -**
  - File: `afterlife.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\norse\cosmology\afterlife.html`
  - Description: In Norse belief, death was not the end but a transformation - a journey to one of several possible d...

### persian

#### magic (1)

- **Persian Mythology**
  - File: `protective-prayers.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\persian\magic\protective-prayers.html`
  - Description: Ashem Vohu, Ahuna Vairya...

### sumerian

#### myths (2)

- **Sumerian/Babylonian Mythology**
  - File: `gilgamesh.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\sumerian\myths\gilgamesh.html`
  - Description: The Epic of Gilgamesh
is the oldest known work of epic literature, originating in ancient Mesopotami...
- **Sumerian Mythology**
  - File: `inanna-descent.html`
  - Path: `H:\Github\EyesOfAzrael\mythos\sumerian\myths\inanna-descent.html`
  - Description: The Descent of Inanna
is one of the oldest recorded myths in human history, preserved on cuneiform t...

---

## 4. Content in Firestore but NOT in Local Files

⚠️ **134 documents** found in Firestore but NOT in local files:

### babylonian

#### cosmology (1)

- **cosmology_babylonian_creation** (ID: `cosmology_babylonian_creation`)
  - Collection: `search_index`

#### creatures (1)

- **Men** (ID: `creatures_babylonian_scorpion-men`)
  - Collection: `search_index`

### celtic

#### cosmology (1)

- **cosmology_celtic_afterlife** (ID: `cosmology_celtic_afterlife`)
  - Collection: `search_index`

### chinese

#### cosmology (1)

- **cosmology_chinese_creation** (ID: `cosmology_chinese_creation`)
  - Collection: `search_index`

### christian

#### concepts (1)

- **The False God and the True Father in Gnostic Christianity** (ID: `concepts_christian_demiurge-vs-monad`)
  - Collection: `search_index`

#### creatures (1)

- **The Nine Choirs** (ID: `creatures_christian_hierarchy`)
  - Collection: `search_index`

#### heroes (4)

- **The First Called** (ID: `christian_andrew`)
  - Collection: `heroes`
  - Description: Brother of Peter, first disciple to follow Jesus, evangelist who brought others to Christ. Martyred ...
- **Son of Thunder** (ID: `christian_james-son-of-zebedee`)
  - Collection: `heroes`
  - Description: Son of Zebedee, brother of John, member of Christ's inner circle. The first apostle martyred, behead...
- **The First Called** (ID: `heroes_christian_andrew`)
  - Collection: `search_index`
- **Son of Thunder** (ID: `heroes_christian_james-son-of-zebedee`)
  - Collection: `search_index`

#### texts (62)

- **Revelation 7, 14** (ID: `texts_christian_144000`)
  - Collection: `search_index`
- **Isaiah, Jeremiah, and Revelation Phrase** (ID: `texts_christian_babylon-fall-detailed`)
  - Collection: `search_index`
- **Revelation 17** (ID: `texts_christian_babylon-falls`)
  - Collection: `search_index`
- **Daniel's Statue and Beasts to Revelation's Composite Beast** (ID: `texts_christian_beast-kingdoms-progression`)
  - Collection: `search_index`
- **Revelation 19** (ID: `texts_christian_christ-returns`)
  - Collection: `search_index`
- **"I Will Be Their God, They Will Be My People"** (ID: `texts_christian_covenant-formulas`)
  - Collection: `search_index`
- **Beast Kingdoms and Son of Man** (ID: `texts_christian_daniel-parallels`)
  - Collection: `search_index`
- **Plagues and New Exodus** (ID: `texts_christian_exodus-parallels`)
  - Collection: `search_index`
- **Throne Vision and Temple** (ID: `texts_christian_ezekiel-parallels`)
  - Collection: `search_index`
- **Revelation 6** (ID: `texts_christian_four-horsemen`)
  - Collection: `search_index`
- **Revelation 4** (ID: `texts_christian_four-living-creatures`)
  - Collection: `search_index`
- **Daniel to Revelation** (ID: `texts_christian_furnace-and-fire-judgments`)
  - Collection: `search_index`
- **Revelation 20:8** (ID: `texts_christian_gog-magog`)
  - Collection: `search_index`
- **Revelation 4** (ID: `texts_christian_heavenly-throne`)
  - Collection: `search_index`
- **New Creation** (ID: `texts_christian_isaiah-parallels`)
  - Collection: `search_index`
- **Day of the Lord** (ID: `texts_christian_joel-parallels`)
  - Collection: `search_index`
- **666** (ID: `texts_christian_mark-of-beast`)
  - Collection: `search_index`
- **Revelation 20** (ID: `texts_christian_millennium`)
  - Collection: `search_index`
- **From OT to Revelation** (ID: `texts_christian_names-and-titles`)
  - Collection: `search_index`
- **Revelation 21** (ID: `texts_christian_new-creation`)
  - Collection: `search_index`
- **Revelation 21** (ID: `texts_christian_new-jerusalem`)
  - Collection: `search_index`
- **Revelation 16** (ID: `texts_christian_seven-bowls`)
  - Collection: `search_index`
- **Revelation 2** (ID: `texts_christian_seven-churches`)
  - Collection: `search_index`
- **From Genesis to Revelation** (ID: `texts_christian_seven-patterns`)
  - Collection: `search_index`
- **Revelation 6** (ID: `texts_christian_seven-seals`)
  - Collection: `search_index`
- **Revelation 8** (ID: `texts_christian_seven-trumpets`)
  - Collection: `search_index`
- **Seven** (ID: `texts_christian_structure`)
  - Collection: `search_index`
- **Key Symbols Guide** (ID: `texts_christian_symbolism`)
  - Collection: `search_index`
- **Revelation 13** (ID: `texts_christian_two-beasts`)
  - Collection: `search_index`
- **Revelation 12** (ID: `texts_christian_woman-and-dragon`)
  - Collection: `search_index`
- **Zechariah and Revelation Parallels** (ID: `texts_christian_zechariah-parallels`)
  - Collection: `search_index`
- **Revelation 7, 14** (ID: `christian_144000`)
  - Collection: `texts`
- **Isaiah, Jeremiah, and Revelation Phrase** (ID: `christian_babylon-fall-detailed`)
  - Collection: `texts`
- **Revelation 17** (ID: `christian_babylon-falls`)
  - Collection: `texts`
- **Daniel's Statue and Beasts to Revelation's Composite Beast** (ID: `christian_beast-kingdoms-progression`)
  - Collection: `texts`
- **Revelation 19** (ID: `christian_christ-returns`)
  - Collection: `texts`
- **"I Will Be Their God, They Will Be My People"** (ID: `christian_covenant-formulas`)
  - Collection: `texts`
- **Beast Kingdoms and Son of Man** (ID: `christian_daniel-parallels`)
  - Collection: `texts`
- **Plagues and New Exodus** (ID: `christian_exodus-parallels`)
  - Collection: `texts`
- **Throne Vision and Temple** (ID: `christian_ezekiel-parallels`)
  - Collection: `texts`
- **Revelation 6** (ID: `christian_four-horsemen`)
  - Collection: `texts`
- **Revelation 4** (ID: `christian_four-living-creatures`)
  - Collection: `texts`
- **Daniel to Revelation** (ID: `christian_furnace-and-fire-judgments`)
  - Collection: `texts`
- **Revelation 20:8** (ID: `christian_gog-magog`)
  - Collection: `texts`
- **Revelation 4** (ID: `christian_heavenly-throne`)
  - Collection: `texts`
- **New Creation** (ID: `christian_isaiah-parallels`)
  - Collection: `texts`
- **Day of the Lord** (ID: `christian_joel-parallels`)
  - Collection: `texts`
- **666** (ID: `christian_mark-of-beast`)
  - Collection: `texts`
- **Revelation 20** (ID: `christian_millennium`)
  - Collection: `texts`
- **From OT to Revelation** (ID: `christian_names-and-titles`)
  - Collection: `texts`
- **Revelation 21** (ID: `christian_new-creation`)
  - Collection: `texts`
- **Revelation 21** (ID: `christian_new-jerusalem`)
  - Collection: `texts`
- **Revelation 16** (ID: `christian_seven-bowls`)
  - Collection: `texts`
- **Revelation 2** (ID: `christian_seven-churches`)
  - Collection: `texts`
- **From Genesis to Revelation** (ID: `christian_seven-patterns`)
  - Collection: `texts`
- **Revelation 6** (ID: `christian_seven-seals`)
  - Collection: `texts`
- **Revelation 8** (ID: `christian_seven-trumpets`)
  - Collection: `texts`
- **Seven** (ID: `christian_structure`)
  - Collection: `texts`
- **Key Symbols Guide** (ID: `christian_symbolism`)
  - Collection: `texts`
- **Revelation 13** (ID: `christian_two-beasts`)
  - Collection: `texts`
- **Revelation 12** (ID: `christian_woman-and-dragon`)
  - Collection: `texts`
- **Zechariah and Revelation Parallels** (ID: `christian_zechariah-parallels`)
  - Collection: `texts`

### egyptian

#### deities (4)

- **Ra** (ID: `egyptian_amun-ra`)
  - Collection: `deities`
  - Description: King of the Gods, The Hidden Sun...
- **The Self** (ID: `egyptian_atum`)
  - Collection: `deities`
  - Description: The Complete One, First God, Setting Sun...
- **Ra** (ID: `deities_egyptian_amun-ra`)
  - Collection: `search_index`
- **The Self** (ID: `deities_egyptian_atum`)
  - Collection: `search_index`

### greek

#### concepts (3)

- **Greek Mythology** (ID: `concepts_greek_judgment-of-paris`)
  - Collection: `search_index`
- **Greek Mythology** (ID: `concepts_greek_orpheus`)
  - Collection: `search_index`
- **Greek Mythology** (ID: `concepts_greek_persephone`)
  - Collection: `search_index`

### japanese

#### concepts (4)

- **Japanese Mythology** (ID: `concepts_japanese_amaterasu-cave`)
  - Collection: `search_index`
- **Japanese Mythology** (ID: `concepts_japanese_creation-of-japan`)
  - Collection: `search_index`
- **Japanese Mythology** (ID: `concepts_japanese_izanagi-yomi`)
  - Collection: `search_index`
- **Headed Serpent** (ID: `concepts_japanese_susanoo-orochi`)
  - Collection: `search_index`

### jewish

#### heroes (32)

- **Eyes of Azrael** (ID: `jewish_1-enoch-heavenly-journeys`)
  - Collection: `heroes`
- **Eyes of Azrael** (ID: `jewish_assumption-tradition`)
  - Collection: `heroes`
- **Circumcision Parallels: Egyptian Ritual Purity and Israelite Covenant | Eyes of Azrael** (ID: `jewish_circumcision-parallels`)
  - Collection: `heroes`
  - Description: Egyptian Ritual Purity vs. Israelite Covenant Sign: The Flint Knife Connection...
- **Akhenaten and Yahwism: Egyptian Monotheism and Moses | Eyes of Azrael** (ID: `jewish_egyptian-monotheism`)
  - Collection: `heroes`
  - Description: Egyptian Monotheism, Moses, and the Question of Aten's Influence on Israelite Religion...
- **Day Solar Calendar vs 354** (ID: `jewish_enoch-calendar`)
  - Collection: `heroes`
- **Hermes** (ID: `jewish_enoch-hermes-thoth`)
  - Collection: `heroes`
- **Eyes of Azrael** (ID: `jewish_enoch-islam`)
  - Collection: `heroes`
- **Eyes of Azrael** (ID: `jewish_enoch-pseudepigrapha`)
  - Collection: `heroes`
- **24** (ID: `jewish_genesis-enoch`)
  - Collection: `heroes`
- **The Magician Showdown: Moses vs. Pharaoh's Sorcerers | Eyes of Azrael** (ID: `jewish_magician-showdown`)
  - Collection: `heroes`
  - Description: Moses and Aaron vs. Pharaoh's Sorcerers: Divine Power vs. Egyptian Magic...
- **Eyes of Azrael** (ID: `jewish_metatron-transformation`)
  - Collection: `heroes`
- **Moses and Horus: Parallel Birth Narratives and Deliverer Archetypes | Eyes of Azrael** (ID: `jewish_moses-horus-parallels`)
  - Collection: `heroes`
  - Description: Comparative Analysis of Egyptian and Israelite Deliverer Archetypes...
- **The Ten Plagues: Systematic Defeat of the Egyptian Pantheon | Eyes of Azrael** (ID: `jewish_plagues-egyptian-gods`)
  - Collection: `heroes`
  - Description: Systematic Defeat of the Egyptian Pantheon: Yahweh vs. the Gods of Egypt...
- **Reed Symbolism: Nile Reeds, Rebirth, and Baptismal Imagery | Eyes of Azrael** (ID: `jewish_reed-symbolism`)
  - Collection: `heroes`
  - Description: From Egyptian Papyrus Marshes to Israelite Sea of Reeds to Christian Baptism...
- **Eyes of Azrael** (ID: `jewish_seven-seals`)
  - Collection: `heroes`
- **Horus and Mary** (ID: `jewish_virgin-births`)
  - Collection: `heroes`
  - Description: Comparative Analysis: Isis-Horus, Mary-Jesus, and Ancient Near Eastern Divine Birth Narratives...
- **Eyes of Azrael** (ID: `heroes_jewish_1-enoch-heavenly-journeys`)
  - Collection: `search_index`
- **Eyes of Azrael** (ID: `heroes_jewish_assumption-tradition`)
  - Collection: `search_index`
- **Circumcision Parallels: Egyptian Ritual Purity and Israelite Covenant | Eyes of Azrael** (ID: `heroes_jewish_circumcision-parallels`)
  - Collection: `search_index`
- **Akhenaten and Yahwism: Egyptian Monotheism and Moses | Eyes of Azrael** (ID: `heroes_jewish_egyptian-monotheism`)
  - Collection: `search_index`
- **Day Solar Calendar vs 354** (ID: `heroes_jewish_enoch-calendar`)
  - Collection: `search_index`
- **Hermes** (ID: `heroes_jewish_enoch-hermes-thoth`)
  - Collection: `search_index`
- **Eyes of Azrael** (ID: `heroes_jewish_enoch-islam`)
  - Collection: `search_index`
- **Eyes of Azrael** (ID: `heroes_jewish_enoch-pseudepigrapha`)
  - Collection: `search_index`
- **24** (ID: `heroes_jewish_genesis-enoch`)
  - Collection: `search_index`
- **The Magician Showdown: Moses vs. Pharaoh's Sorcerers | Eyes of Azrael** (ID: `heroes_jewish_magician-showdown`)
  - Collection: `search_index`
- **Eyes of Azrael** (ID: `heroes_jewish_metatron-transformation`)
  - Collection: `search_index`
- **Moses and Horus: Parallel Birth Narratives and Deliverer Archetypes | Eyes of Azrael** (ID: `heroes_jewish_moses-horus-parallels`)
  - Collection: `search_index`
- **The Ten Plagues: Systematic Defeat of the Egyptian Pantheon | Eyes of Azrael** (ID: `heroes_jewish_plagues-egyptian-gods`)
  - Collection: `search_index`
- **Reed Symbolism: Nile Reeds, Rebirth, and Baptismal Imagery | Eyes of Azrael** (ID: `heroes_jewish_reed-symbolism`)
  - Collection: `search_index`
- **Eyes of Azrael** (ID: `heroes_jewish_seven-seals`)
  - Collection: `search_index`
- **Horus and Mary** (ID: `heroes_jewish_virgin-births`)
  - Collection: `search_index`

#### texts (6)

- **The Great Flood: Gilgamesh, Atrahasis, and Genesis | Eyes of Azrael** (ID: `texts_jewish_flood-myths-ane`)
  - Collection: `search_index`
- **Potter and Clay: Divine Craftsman Creating Humanity | Eyes of Azrael** (ID: `texts_jewish_potter-and-clay`)
  - Collection: `search_index`
- **Tiamat and Tehom: Enuma Elish and Genesis 1 | Eyes of Azrael** (ID: `texts_jewish_tiamat-and-tehom`)
  - Collection: `search_index`
- **The Great Flood: Gilgamesh, Atrahasis, and Genesis | Eyes of Azrael** (ID: `jewish_flood-myths-ane`)
  - Collection: `texts`
- **Potter and Clay: Divine Craftsman Creating Humanity | Eyes of Azrael** (ID: `jewish_potter-and-clay`)
  - Collection: `texts`
- **Tiamat and Tehom: Enuma Elish and Genesis 1 | Eyes of Azrael** (ID: `jewish_tiamat-and-tehom`)
  - Collection: `texts`
  - Description: The Chaos Waters: From Combat Myth to Sovereign Creation...

### norse

#### cosmology (1)

- **cosmology_norse_afterlife** (ID: `cosmology_norse_afterlife`)
  - Collection: `search_index`

### sumerian

#### concepts (2)

- **Sumerian/Babylonian Mythology** (ID: `concepts_sumerian_gilgamesh`)
  - Collection: `search_index`
- **Sumerian Mythology** (ID: `concepts_sumerian_inanna-descent`)
  - Collection: `search_index`

### yoruba

#### deities (10)

- **Eshu** (ID: `yoruba_eshu`)
  - Collection: `deities`
  - Description: Orisha of Crossroads, Messenger of the Gods, Divine Trickster...
- **Ogun** (ID: `yoruba_ogun`)
  - Collection: `deities`
  - Description: Orisha of Iron, War, Labor, and Technology...
- **Oshun** (ID: `yoruba_oshun`)
  - Collection: `deities`
  - Description: Orisha of Fresh Water, Love, Fertility, Beauty, and Prosperity...
- **Shango** (ID: `yoruba_shango`)
  - Collection: `deities`
  - Description: Orisha of Thunder, Lightning, Fire, and Divine Justice...
- **Yemoja** (ID: `yoruba_yemoja`)
  - Collection: `deities`
  - Description: Great Mother Orisha of the Ocean, Rivers, Fertility, and Motherhood...
- **Eshu** (ID: `deities_yoruba_eshu`)
  - Collection: `search_index`
- **Ogun** (ID: `deities_yoruba_ogun`)
  - Collection: `search_index`
- **Oshun** (ID: `deities_yoruba_oshun`)
  - Collection: `search_index`
- **Shango** (ID: `deities_yoruba_shango`)
  - Collection: `search_index`
- **Yemoja** (ID: `deities_yoruba_yemoja`)
  - Collection: `search_index`

---

## 5. Metadata Mismatches

⚠️ Found 193 metadata mismatches:

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The Enlightened One, Teacher of Liberation...
- **Firestore:** The Lord Who Looks Down with Compassion...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The Awakened One, Teacher of the Dharma...
- **Firestore:** The Lord Who Looks Down with Compassion...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Goddess of Mercy and Compassion...
- **Firestore:** The Lord Who Looks Down with Compassion...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Bodhisattva of Transcendent Wisdom...
- **Firestore:** The Lord Who Looks Down with Compassion...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Wrathful Deity, Conqueror of Death...
- **Firestore:** The Lord Who Looks Down with Compassion...

### The (celtic)

- **Field:** description
- **Local:** Phantom Queen, Goddess of War and Fate...
- **Firestore:** The Good God, Father of All...

### Dragon Kings (chinese)

- **Field:** description
- **Local:** 四海龙王 (Si Hai Long Wang) - Lords of the Four Seas...
- **Firestore:** The Four Dragon Kings are the divine rulers of the seas who control weather, rainfall, and all bodie...

### Erlang Shen (chinese)

- **Field:** description
- **Local:** 二郎神 (Er Lang Shen) - The Three-Eyed Warrior God...
- **Firestore:** Erlang Shen is the formidable three-eyed warrior god of Chinese mythology, nephew of the Jade Empero...

### Jade Emperor (chinese)

- **Field:** description
- **Local:** 玉皇大帝 (Yù Huáng Dàdì) - The Supreme Sovereign of Heaven...
- **Firestore:** The Jade Emperor is the supreme ruler of heaven and earth in Chinese mythology, presiding over the c...

### Nezha (chinese)

- **Field:** description
- **Local:** 哪吒 (Né Zhā) - The Third Lotus Prince...
- **Firestore:** Nezha is the rebellious child-god of Chinese mythology, a fierce protector deity born from a lotus f...

### Xi Wangmu (chinese)

- **Field:** description
- **Local:** 西王母 (Xi Wang Mu) - Queen Mother of the West...
- **Firestore:** Xi Wangmu is one of the oldest and most powerful goddesses in Chinese mythology, the immortal Queen ...

### Zao Jun (chinese)

- **Field:** description
- **Local:** 灶君 / 灶神 (Zao Jun / Zao Shen) - The Kitchen God...
- **Firestore:** Zao Jun is the domestic deity who watches over every Chinese household from his seat by the stove. A...

### Jesus Christ (christian)

- **Field:** description
- **Local:** ...
- **Firestore:** The Second Person of the Holy Trinity - God Incarnate...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** God of War and Hunting...
- **Firestore:** Goddess of War, Weaving, Wisdom, and Primordial Creation...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** Deified Sage, Architect, and Physician...
- **Firestore:** Goddess of War, Weaving, Wisdom, and Primordial Creation...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** God of War and the Bull...
- **Firestore:** Goddess of War, Weaving, Wisdom, and Primordial Creation...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** Goddess of War, Healing, and Divine Vengeance...
- **Firestore:** Goddess of War, Weaving, Wisdom, and Primordial Creation...

### Cronos (greek)

- **Field:** description
- **Local:** Cronos (also spelled Kronos or Cronus) was the youngest and most powerful of the twelve Titans, ruli...
- **Firestore:** Cronos (also spelled Kronos or Cronus) was the youngest and most powerful of the twelve Titans, ruli...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Primordial Force of Desire and God of Love...
- **Firestore:** Queen of the Underworld, Goddess of Spring and Vegetation...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Primordial Earth Mother, Foundation of All Life...
- **Firestore:** Queen of the Underworld, Goddess of Spring and Vegetation...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Virgin Goddess of the Hearth, Home, and Sacred Fire...
- **Firestore:** Queen of the Underworld, Goddess of Spring and Vegetation...

### Pluto (greek)

- **Field:** description
- **Local:** Roman name for Hades, emphasizing his role as god of wealth....
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Personification of death, psychopomp who guides souls to the underworld....
- **Firestore:** Queen of the Underworld, Goddess of Spring and Vegetation...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Primordial Sky Father, First King of the Cosmos...
- **Firestore:** Queen of the Underworld, Goddess of Spring and Vegetation...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** God of Ayurveda and Divine Physician...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** The Invincible Mother, Slayer of Mahishasura...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Sky Father...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** God of War...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Earth Mother...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Goddess of Love and Desire...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Drought Demon...
- **Firestore:** The Creator, Lord of the Vedas...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Goddess of the Yamuna River, Twin Sister of Yama...
- **Firestore:** The Creator, Lord of the Vedas...

### Norse Mythology (norse)

- **Field:** description
- **Local:** The Blind God...
- **Firestore:** Goddess of Healing...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Goddess of the Earth...
- **Firestore:** Goddess of Healing...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Mother of Loki...
- **Firestore:** Goddess of Healing...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Son of Loki...
- **Firestore:** Goddess of Healing...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Goddess of Winter, Hunting, and Mountains...
- **Firestore:** Goddess of Healing...

### Norse Mythology (norse)

- **Field:** description
- **Local:** God of Vengeance...
- **Firestore:** Goddess of Healing...

### Gilgamesh (babylonian)

- **Field:** description
- **Local:** Gilgamesh is the protagonist of the Epic of Gilgamesh, one of the earliest known works of literary f...
- **Firestore:** ...

### Hammurabi (babylonian)

- **Field:** description
- **Local:** Hammurabi was the sixth king of the First Dynasty of Babylon, who transformed a minor city-state int...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The spiritual leader of Tibetan Buddhism, believed to be the reincarnation of Avalokiteshvara, the B...
- **Firestore:** The spiritual leader of Tibetan Buddhism, believed to be the reincarnation of Avalokiteshvara, the B...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Tibetan king (7th century CE) who introduced Buddhism to Tibet. Considered an emanation of Avalokite...
- **Firestore:** The spiritual leader of Tibetan Buddhism, believed to be the reincarnation of Avalokiteshvara, the B...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** 8th century Indian Buddhist monk and scholar, author of the Bodhicharyavatara (Guide to the Bodhisat...
- **Firestore:** The spiritual leader of Tibetan Buddhism, believed to be the reincarnation of Avalokiteshvara, the B...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Great Tibetan Buddhist teacher (1357-1419) and founder of the Gelug school of Tibetan Buddhism. Cons...
- **Firestore:** The spiritual leader of Tibetan Buddhism, believed to be the reincarnation of Avalokiteshvara, the B...

### Daniel the Prophet (christian)

- **Field:** description
- **Local:** Name Meaning: "God is my Judge" (Hebrew: דָּנִיֵּאל)
Role: Prophet, royal advisor, dream interpreter...
- **Firestore:** ...

### Elijah the Prophet (christian)

- **Field:** description
- **Local:** Name Meaning: "My God is Yahweh" (Hebrew: אֵלִיָּהוּ)
Role: Prophet, miracle worker, champion of mon...
- **Firestore:** ...

### Saint John the Apostle (christian)

- **Field:** description
- **Local:** John was one of the Twelve Apostles and is traditionally identified as the author of the Gospel of J...
- **Firestore:** ...

### Saint Peter the Apostle (christian)

- **Field:** description
- **Local:** Peter, originally named Simon, was the foremost of the Twelve Apostles and the leader of the early C...
- **Firestore:** ...

### Achilles (greek)

- **Field:** description
- **Local:** The Invincible Warrior of the Trojan War...
- **Firestore:** ...

### Eros and Psyche (greek)

- **Field:** description
- **Local:** The myth of Eros (Cupid in Roman tradition) and Psyche tells the story of a mortal woman whose beaut...
- **Firestore:** ...

### Heracles (greek)

- **Field:** description
- **Local:** The Divine Hero - Champion of Olympus...
- **Firestore:** ...

### Odysseus (greek)

- **Field:** description
- **Local:** The Cunning Hero of the Long Journey Home...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The Divine Musician, Prophet of the Mysteries...
- **Firestore:** ...

### Perseus (greek)

- **Field:** description
- **Local:** Slayer of Medusa, Founder of Mycenae...
- **Firestore:** ...

### Theseus (greek)

- **Field:** description
- **Local:** Founding Hero of Athens and Slayer of the Minotaur...
- **Firestore:** ...

### Rama (hindu)

- **Field:** description
- **Local:** Maryada Purushottama - The Perfect Man...
- **Firestore:** ...

### Prophet (islamic)

- **Field:** description
- **Local:** إبراهيم - Khalilullah (Friend of Allah)...
- **Firestore:** ...

### Isa (Jesus) (islamic)

- **Field:** description
- **Local:** In Islamic tradition, Isa (Jesus) is one of the greatest prophets of Allah, born miraculously to the...
- **Firestore:** ...

### Prophet (islamic)

- **Field:** description
- **Local:** موسى - Kalimullah (One Who Spoke to Allah)...
- **Firestore:** ...

### Nuh (Noah) (islamic)

- **Field:** description
- **Local:** Nuh (Noah) is one of the five greatest prophets in Islam (ulul-azm, those of great resolve), sent to...
- **Firestore:** ...

### Avraham Avinu | Jewish Heroes (jewish)

- **Field:** description
- **Local:** Abraham (Hebrew: Avraham) is the founding patriarch of the Jewish people, the first Hebrew, and the ...
- **Firestore:** Abraham (Hebrew: Avraham) is the founding patriarch of the Jewish people, the first Hebrew, and the ...

### Moshe Rabbeinu | Jewish Heroes (jewish)

- **Field:** description
- **Local:** Moses (Moshe in Hebrew) is the greatest prophet in Jewish tradition, the lawgiver who received the T...
- **Firestore:** Moses (Moshe in Hebrew) is the greatest prophet in Jewish tradition, the lawgiver who received the T...

### Sigurd (norse)

- **Field:** description
- **Local:** Sigurd (Siegfried in Germanic tradition) was the greatest hero of Norse mythology, famous for slayin...
- **Firestore:** ...

### Zoroaster (persian)

- **Field:** description
- **Local:** The Prophet, Revealer of Truth...
- **Firestore:** ...

### Aeneas (roman)

- **Field:** description
- **Local:** Aeneas was a Trojan hero and the legendary ancestor of the Roman people. Son of the goddess Venus (A...
- **Firestore:** ...

### Gilgamesh (sumerian)

- **Field:** description
- **Local:** The King Who Sought Immortality...
- **Firestore:** ...

### Babylonian Mythology (babylonian)

- **Field:** description
- **Local:** The Dragon-Serpent - Sacred Beast of Marduk...
- **Firestore:** ...

### Serpent Deities of Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Serpent Deities, Guardians of Waters and Wisdom...
- **Firestore:** ...

### Christian Creatures (christian)

- **Field:** description
- **Local:** Divine spiritual beings created by God to serve as messengers, guardians, and agents of His will.
  ...
- **Firestore:** ...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** The sphinx is a legendary creature with the body of a lion and the head of a human, symbolizing the ...
- **Firestore:** ...

### Chimera (greek)

- **Field:** description
- **Local:** Fire-breathing hybrid monster....
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The Many-Headed Serpent...
- **Firestore:** ...

### Medusa (greek)

- **Field:** description
- **Local:** Medusa was the most famous of the three Gorgon sisters, cursed with a monstrous form and the power t...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The Bull of Minos...
- **Firestore:** ...

### Pegasus (greek)

- **Field:** description
- **Local:** Winged divine horse born from Medusa's blood....
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Riddling monster with woman's head and lion's body....
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Man-eating birds with bronze beaks....
- **Firestore:** ...

### Hindu Creatures (hindu)

- **Field:** description
- **Local:** King of Birds, Vahana of Vishnu [View in Corpus →]...
- **Firestore:** ...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Mythical sea creature combining features of crocodile, elephant, fish, and dolphin. Guardian of wate...
- **Firestore:** ...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Semi-divine serpent beings inhabiting Patala, guardians of treasures and sacred waters. Major nagas ...
- **Firestore:** ...

### The (islamic)

- **Field:** description
- **Local:** Beings Created from Smokeless Fire...
- **Firestore:** ...

### Norse Creatures (norse)

- **Field:** description
- **Local:** The Jotnar (singular: Jötunn; Old Norse for "devourers") are the giants of Norse mythology,
        ...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** The powerful stallion whose strength nearly cost the gods their bargain. Father of Sleipnir through ...
- **Firestore:** ...

### Persian Creatures (persian)

- **Field:** description
- **Local:** The Divs (Persian: دیو, also called Daevas) are malevolent supernatural beings in Persian mythology,...
- **Firestore:** ...

### Lamassu (sumerian)

- **Field:** description
- **Local:** Guardian Spirit...
- **Firestore:** ...

### Tarot Symbolic Creatures (tarot)

- **Field:** description
- **Local:** The angel (or human figure) appears in Tarot as a symbol of higher consciousness, humanitarian
     ...
- **Firestore:** ...

### Tarot Symbolic Creatures (tarot)

- **Field:** description
- **Local:** The bull appears in Tarot as a symbol of material stability, strength, fertility, and perseverance.
...
- **Firestore:** ...

### Tarot Symbolic Creatures (tarot)

- **Field:** description
- **Local:** The eagle appears in Tarot as a symbol of spiritual vision, transformation, and regeneration.
      ...
- **Firestore:** ...

### Tarot Symbolic Creatures (tarot)

- **Field:** description
- **Local:** The four Kerubim (also called the Four Living Creatures or the Four Holy Creatures) are the sacred
 ...
- **Firestore:** ...

### Tarot Symbolic Creatures (tarot)

- **Field:** description
- **Local:** The lion appears throughout Tarot as a symbol of courage, sovereignty, primal strength, and solar po...
- **Firestore:** ...

### The (babylonian)

- **Field:** description
- **Local:** The Babylonian underworld was a dark, dreary realm beneath the earth where all the dead dwelled
    ...
- **Firestore:** ...

### Apsu (babylonian)

- **Field:** description
- **Local:** The Primordial Fresh Water Abyss...
- **Firestore:** ...

### Bardo, Rebirth & Nirvana" (buddhist)

- **Field:** description
- **Local:** In Buddhism, death is not an ending but a transition. The consciousness exits the dying body and
   ...
- **Firestore:** ...

### Interdependent Origination (buddhist)

- **Field:** description
- **Local:** Buddhism uniquely teaches that there is no creation by a supreme deity. Instead, all phenomena arise...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The fundamental Buddhist doctrine that all phenomena arise in dependence upon multiple causes and co...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The principle that all intentional actions have consequences that determine future conditions. In Bu...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The three poisons or mental afflictions: greed (raga), hatred (dvesha), and delusion (moha). These a...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The ultimate goal of Buddhist practice, the state of liberation from suffering, desire, and the cycl...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The sacred abode of Avalokiteshvara and historic residence of the Dalai Lama in Lhasa, Tibet. Named ...
- **Firestore:** ...

### Buddhist Cosmology (buddhist)

- **Field:** description
- **Local:** The six realms of existence (Sanskrit: gati or bhava) are the destinations for rebirth in Buddhist c...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The Cycle of Conditioned Existence...
- **Firestore:** ...

### The Coming of the Gods (celtic)

- **Field:** description
- **Local:** Celtic creation mythology, particularly in Ireland, is unique in that it focuses not on the creation...
- **Firestore:** ...

### Diyu and Ancestor Worship (chinese)

- **Field:** description
- **Local:** Chinese afterlife beliefs blend Buddhist reincarnation, Taoist immortality, and Confucian ancestor w...
- **Firestore:** ...

### Christian Mythology (christian)

- **Field:** description
- **Local:** Christian teaching describes the soul's journey from physical death through judgment to eternal
    ...
- **Firestore:** ...

### Christian Mythology (christian)

- **Field:** description
- **Local:** The Genesis creation narrative reveals God speaking the universe into existence through His word,
  ...
- **Firestore:** ...

### Christian Cosmology (christian)

- **Field:** description
- **Local:** Grace (from Latin gratia, Greek charis) is the fundamental principle of God's dealings with humanity...
- **Firestore:** ...

### Christian Cosmology (christian)

- **Field:** description
- **Local:** The eternal dwelling place of God where the redeemed experience perfect joy, worship, and communion ...
- **Firestore:** ...

### Christian Cosmology (christian)

- **Field:** description
- **Local:** The incarnation (from Latin incarnatio, "to make flesh") is the Christian doctrine that God the Son,...
- **Firestore:** ...

### Christian Cosmology (christian)

- **Field:** description
- **Local:** The resurrection of Jesus Christ is the cornerstone of Christian faith. Three days after His crucifi...
- **Firestore:** ...

### Christian Cosmology (christian)

- **Field:** description
- **Local:** Christian theology teaches that all humanity stands in need of salvation because of sin. Since the f...
- **Firestore:** ...

### The Journey to Paradise (egyptian)

- **Field:** description
- **Local:** The ancient Egyptians developed the most elaborate afterlife beliefs in human history. Death was not...
- **Firestore:** ...

### Egyptian Cosmology (egyptian)

- **Field:** description
- **Local:** Ancient Egypt developed several distinct creation myths, each centered in different cult centers. Ra...
- **Firestore:** ...

### From Nun to the Ennead (egyptian)

- **Field:** description
- **Local:** Egyptian creation mythology is not a single narrative but multiple accounts from different theologic...
- **Firestore:** ...

### Egyptian Underworld Journey (egyptian)

- **Field:** description
- **Local:** The Duat is the Egyptian underworld, a realm of darkness, danger, and transformation that must be tr...
- **Firestore:** ...

### Nine Gods of Creation (egyptian)

- **Field:** description
- **Local:** The Ennead (from Greek "ennea" meaning nine) refers to the nine primordial gods of Heliopolis who em...
- **Firestore:** ...

### Egyptian Cosmology (egyptian)

- **Field:** description
- **Local:** Nun (also Nu, Nuu) represents the primordial waters of chaos that existed before creation. Neither f...
- **Firestore:** ...

### The Journey to Hades (greek)

- **Field:** description
- **Local:** When mortals die in Greek mythology, their psyche (soul/shade) descends to the Underworld ruled by H...
- **Firestore:** ...

### From Chaos to Cosmos (greek)

- **Field:** description
- **Local:** The Greek creation myth describes reality's emergence from primordial Chaos through successive gener...
- **Firestore:** ...

### Mount (greek)

- **Field:** description
- **Local:** Home of the twelve Olympian gods....
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The first beings to emerge from Chaos....
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The generation of gods before the Olympians....
- **Firestore:** ...

### The Greek (greek)

- **Field:** description
- **Local:** Beneath the earth lies the vast, shadowy kingdom of Hades—the inevitable destination for all mortal ...
- **Firestore:** ...

### World Mythos Explorer (hindu)

- **Field:** description
- **Local:** In Hindu cosmology, death is not an ending but a transition. The eternal soul (Atman) migrates throu...
- **Firestore:** ...

### World Mythos Explorer (hindu)

- **Field:** description
- **Local:** Hindu creation is not a single event but an eternal cycle. The universe emerges from the cosmic
    ...
- **Firestore:** ...

### Hindu Cosmology (hindu)

- **Field:** description
- **Local:** The Law of Action and Consequence...
- **Firestore:** ...

### Hindu Cosmology (hindu)

- **Field:** description
- **Local:** The cosmic ocean of milk that was churned by gods and demons to obtain the nectar of immortality (am...
- **Firestore:** ...

### Islamic Cosmology (islamic)

- **Field:** description
- **Local:** Islamic eschatology presents a comprehensive journey of the soul: from the moment of death through
 ...
- **Firestore:** ...

### Islamic Cosmology (islamic)

- **Field:** description
- **Local:** Islamic cosmology describes how Allah created the heavens and earth through His command "Kun!" (Be!)...
- **Firestore:** ...

### Tawhid (islamic)

- **Field:** description
- **Local:** The Absolute Oneness and Uniqueness of Allah...
- **Firestore:** ...

### Norse Cosmology (norse)

- **Field:** description
- **Local:** Asgard (Old Norse: Ásgarðr, "enclosure of the Æsir") is the celestial realm of the Aesir gods in Nor...
- **Firestore:** ...

### From Ginnungagap to the First Humans (norse)

- **Field:** description
- **Local:** The Norse creation story begins not with divine will but with elemental forces - ice and fire meetin...
- **Firestore:** ...

### Norse Cosmology (norse)

- **Field:** description
- **Local:** Ragnarok (Old Norse: Ragnarök or Ragnarøkkr) is the prophesied end of the cosmos in Norse mythology—...
- **Firestore:** ...

### Norse Cosmology (norse)

- **Field:** description
- **Local:** Yggdrasil (Old Norse: Yggdrasill) is the enormous ash tree that stands at the center of the Norse co...
- **Firestore:** ...

### Persian Mythology (persian)

- **Field:** description
- **Local:** In Zoroastrian belief, death is not the end but a transition. The soul (urvan) separates from the
  ...
- **Firestore:** ...

### Asha (persian)

- **Field:** description
- **Local:** Truth, Righteousness, Cosmic Order...
- **Firestore:** ...

### Chinvat Bridge (persian)

- **Field:** description
- **Local:** The Bridge of the Separator, Bridge of Judgment...
- **Firestore:** ...

### Persian Mythology (persian)

- **Field:** description
- **Local:** In the beginning, there existed only two uncreated spiritual entities dwelling in separate realms:
 ...
- **Firestore:** ...

### Druj (persian)

- **Field:** description
- **Local:** The Lie, Falsehood, Cosmic Chaos...
- **Firestore:** ...

### Frashokereti (persian)

- **Field:** description
- **Local:** The Final Renovation, Making Wonderful...
- **Firestore:** ...

### Persian Mythology (persian)

- **Field:** description
- **Local:** Humata, Hukhta, Hvarshta - Good Thoughts, Good Words, Good Deeds...
- **Firestore:** ...

### Roman Mythology (roman)

- **Field:** description
- **Local:** Death, judgment, and eternal destinations in the Roman underworld...
- **Firestore:** ...

### Roman Mythology (roman)

- **Field:** description
- **Local:** How the universe emerged from primordial confusion and achieved divine structure...
- **Firestore:** ...

### The (sumerian)

- **Field:** description
- **Local:** The Sumerian view of the afterlife is stark and sobering. Unlike Egyptian paradise or Greek rewards,...
- **Firestore:** ...

### The (sumerian)

- **Field:** description
- **Local:** The Anunnaki (Sumerian: "offspring of An," Akkadian: Anunnaku) were the principal deities of the Sum...
- **Firestore:** ...

### From Nammu to Humanity (sumerian)

- **Field:** description
- **Local:** Sumerian creation mythology describes the emergence of order from the primordial sea and the
       ...
- **Firestore:** ...

### Me (Divine Powers) (sumerian)

- **Field:** description
- **Local:** The Fundamental Forces of Civilization...
- **Firestore:** ...

### The Hermetic Path of Return (tarot)

- **Field:** description
- **Local:** If the Lightning Flash describes the soul's descent into matter, the Serpent Path (or Path of Return...
- **Firestore:** ...

### The Lightning Flash of Emanation (tarot)

- **Field:** description
- **Local:** In Hermetic cosmology, creation is not a single event but an ongoing process of divine emanation—
  ...
- **Firestore:** ...

### Hermetic Cosmology (tarot)

- **Field:** description
- **Local:** The central diagram of Kabbalah
                and Hermetic cosmology, the Tree of Life maps the pr...
- **Firestore:** ...

### Journey Through the Underworld | Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** The Amduat (meaning "That Which Is in the Underworld") is one of ancient Egypt's most important fune...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** The lotus flower symbolizes purity, enlightenment, and spiritual awakening. It grows from mud yet re...
- **Firestore:** The sacred fig tree (Ficus religiosa) under which Siddhartha Gautama attained enlightenment and beca...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Traditional methods of preparing sacred herbs, incense, and medicines used in Buddhist rituals, medi...
- **Firestore:** The sacred fig tree (Ficus religiosa) under which Siddhartha Gautama attained enlightenment and beca...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** Sacred fragrant wood used in incense, meditation, and rituals. Its calming scent aids concentration ...
- **Firestore:** The sacred fig tree (Ficus religiosa) under which Siddhartha Gautama attained enlightenment and beca...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** The blue lotus (Nymphaea caerulea), also called the blue water lily, was the most sacred flower in a...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Ambrosia (Greek: ἀμβροσία, meaning "immortal" or "not mortal") is the divine food of the Olympian go...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The laurel (bay tree) was the most sacred plant of Apollo, god of prophecy, music, and poetry. This ...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** Myrtle was the sacred plant of Aphrodite, goddess of love and beauty. This fragrant evergreen shrub ...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The oak tree was sacred to Zeus, king of the gods, and symbolized strength, endurance, and divine au...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The olive tree was sacred to Athena, goddess of wisdom and strategic warfare, and stood as the supre...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The pomegranate holds profound significance in Greek mythology, serving as the fateful fruit that bo...
- **Firestore:** ...

### Hindu Mythology (hindu)

- **Field:** description
- **Local:** Soma stands as the most enigmatic and celebrated substance in Vedic literature, occupying a unique p...
- **Firestore:** ...

### Islamic Tradition (islamic)

- **Field:** description
- **Local:** Black seed, known in Arabic as Habbat al-Barakah (حبة البركة - "Seed of Blessing") or Habbat al-Saud...
- **Firestore:** ...

### Islamic Tradition (islamic)

- **Field:** description
- **Local:** The miswak (also spelled siwak, سواك in Arabic) is a teeth-cleaning twig made from the Salvadora per...
- **Firestore:** ...

### Islamic Tradition (islamic)

- **Field:** description
- **Local:** Senna, known in Arabic as Sana Makki (سنا مكي - "Senna from Makkah"), is a powerful cleansing herb h...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** The ash tree stands as the most sacred tree in Norse mythology, embodying cosmic structure, human or...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** The elder tree was sacred to Freya, goddess of love, beauty, and magic. This powerful tree held deep...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Mugwort was a powerful magical herb in Norse tradition, sacred to both Odin and Freya. This aromatic...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Yarrow was one of the most powerful and versatile magical herbs in Norse tradition, revered for its ...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** The yew tree was sacred to Odin, the Allfather, embodying the mysteries of death, rebirth, and hidde...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** Yggdrasil (Old Norse: "Odin's horse" or "terrible steed") is the immense cosmic ash tree standing at...
- **Firestore:** ...

### Persian Mythology (persian)

- **Field:** description
- **Local:** Haoma (Avestan: haoma; Sanskrit cognate: Soma) stands as the most sacred plant in Zoroastrianism, oc...
- **Firestore:** ...

### World Mythos Explorer (babylonian)

- **Field:** description
- **Local:** Divination was central to Babylonian religious practice,
serving as the primary means of communicati...
- **Firestore:** Divination was central to Babylonian religious practice,
serving as the primary means of communicati...

### Christian Tradition (christian)

- **Field:** description
- **Local:** The sacraments
are sacred rites instituted by Christ through which divine grace
is conveyed to belie...
- **Firestore:** The sacraments
are sacred rites instituted by Christ through which divine grace
is conveyed to belie...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** Mummification was the sacred process of preserving the dead body to ensure eternal life. The Egyptia...
- **Firestore:** ...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** The Opet Festival was Thebes's most important annual celebration, held during the second month of th...
- **Firestore:** ...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The Dionysian Mysteries
were secret religious rites dedicated to Dionysus, god of wine, fertility, a...
- **Firestore:** The Dionysian Mysteries
were secret religious rites dedicated to Dionysus, god of wine, fertility, a...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The Eleusinian Mysteries
were the most famous and revered secret religious rites of ancient Greece, ...
- **Firestore:** The Dionysian Mysteries
were secret religious rites dedicated to Dionysus, god of wine, fertility, a...

### World Mythos Explorer (greek)

- **Field:** description
- **Local:** At the heart of Greek religious practice
stood the offering - the fundamental transaction between mo...
- **Firestore:** At the heart of Greek religious practice
stood the offering - the fundamental transaction between mo...

### Greek Mythology (greek)

- **Field:** description
- **Local:** The Olympic Games
were far more than athletic competitions - they were a sacred festival honoring Ze...
- **Firestore:** The Dionysian Mysteries
were secret religious rites dedicated to Dionysus, god of wine, fertility, a...

### Salat (islamic)

- **Field:** description
- **Local:** The Five Daily Prayers...
- **Firestore:** ...

### Norse Ritual Sacrifice (norse)

- **Field:** description
- **Local:** The blót
(Old Norse "blessing" or "sacrifice") was the central ritual of Norse religion, a communal ...
- **Firestore:** The blót
(Old Norse "blessing" or "sacrifice") was the central ritual of Norse religion, a communal ...

### Persian Mythology (persian)

- **Field:** description
- **Local:** Atash Bahram, Fire Temples...
- **Firestore:** ...

### Roman Mythology (roman)

- **Field:** description
- **Local:** Festivals, Celebrations, and Sacred Days...
- **Firestore:** ...

### Roman Mythology (roman)

- **Field:** description
- **Local:** Ritual Practices and Worship...
- **Firestore:** ...

### Roman Mythology (roman)

- **Field:** description
- **Local:** Military and Religious Victory Celebration...
- **Firestore:** ...

### Tarot Rituals (tarot)

- **Field:** description
- **Local:** The most famous and comprehensive tarot spread, the Celtic Cross provides deep insight into a situat...
- **Firestore:** ...

### Persian Mythology (persian)

- **Field:** description
- **Local:** The Winged Disk, Symbol of Divine Glory...
- **Firestore:** ...

### Sacred Fire (persian)

- **Field:** description
- **Local:** Divine Light, Son of Ahura Mazda...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** An enlightened being who delays entry into final nirvana in order to help all sentient beings achiev...
- **Firestore:** ...

### Buddhist Mythology (buddhist)

- **Field:** description
- **Local:** One of the central virtues in Buddhism, the wish for all beings to be free from suffering. Combined ...
- **Firestore:** ...

### Egyptian Mythology (egyptian)

- **Field:** description
- **Local:** Ma'at is the fundamental concept of truth, justice, balance, order, harmony, law, morality, and cosm...
- **Firestore:** ...

### Norse Mythology (norse)

- **Field:** description
- **Local:** The principal tribe of Norse gods, dwelling in Asgard. Gods of war, sovereignty, law, and cosmic ord...
- **Firestore:** ...

### Ragnarok (norse)

- **Field:** description
- **Local:** The prophesied end of the world when the gods will fall in battle against the forces of chaos, and t...
- **Firestore:** ...

---

## 6. Quality Validation Issues

### Missing ContentType Field (282)

- **Coatlicue** (ID: `aztec_coatlicue`, Collection: `deities`)
- **Huitzilopochtli** (ID: `aztec_huitzilopochtli`, Collection: `deities`)
- **Quetzalcoatl** (ID: `aztec_quetzalcoatl`, Collection: `deities`)
- **Tezcatlipoca** (ID: `aztec_tezcatlipoca`, Collection: `deities`)
- **Tlaloc** (ID: `aztec_tlaloc`, Collection: `deities`)
- **Ea** (ID: `babylonian_ea`, Collection: `deities`)
- **Ishtar** (ID: `babylonian_ishtar`, Collection: `deities`)
- **Marduk** (ID: `babylonian_marduk`, Collection: `deities`)
- **Nabu** (ID: `babylonian_nabu`, Collection: `deities`)
- **Nergal** (ID: `babylonian_nergal`, Collection: `deities`)
- **Shamash** (ID: `babylonian_shamash`, Collection: `deities`)
- **Sin** (ID: `babylonian_sin`, Collection: `deities`)
- **Tiamat** (ID: `babylonian_tiamat`, Collection: `deities`)
- **Buddhist Mythology** (ID: `buddhist_avalokiteshvara`, Collection: `deities`)
- **Redirecting to Avalokiteshvara** (ID: `buddhist_avalokiteshvara_detailed`, Collection: `deities`)
- **Buddhist Mythology** (ID: `buddhist_buddha`, Collection: `deities`)
- **Buddhist Mythology** (ID: `buddhist_gautama_buddha`, Collection: `deities`)
- **Buddhist Mythology** (ID: `buddhist_guanyin`, Collection: `deities`)
- **Buddhist Mythology** (ID: `buddhist_manjushri`, Collection: `deities`)
- **Redirecting to Manjushri** (ID: `buddhist_manjushri_detailed`, Collection: `deities`)

... and 262 more

### Empty or Short Descriptions (547)

- **Redirecting to Avalokiteshvara** (buddhist)
- **Redirecting to Manjushri** (buddhist)
- **Jesus Christ** (christian)
- **Raphael** (christian)
- **Virgin** (christian)
- **God of the Earth | Egyptian Mythology** (egyptian)
- **Pluto** (greek)
- **Greek Mythology** (greek)
- **Hindu Mythology** (hindu)
- **Hindu Mythology** (hindu)
- **Krishna** (hindu)
- **Hindu Mythology** (hindu)
- **Hindu Mythology** (hindu)
- **Norse Mythology** (norse)
- **Norse Mythology** (norse)
- **Norse Mythology** (norse)
- **Norse Mythology** (norse)
- **Norse Mythology** (norse)
- **Atar** (persian)
- **The Innocent Seeker** (tarot)

... and 527 more

---

## 7. Quality Scores

### Documents with Quality Score < 80 (746)

#### cosmology_babylonian_creation (babylonian) - Score: 25/100

**Issues:**
- Missing name/title field
- Description missing or too short
- Missing search index
- Missing version number

#### cosmology_celtic_afterlife (celtic) - Score: 25/100

**Issues:**
- Missing name/title field
- Description missing or too short
- Missing search index
- Missing version number

#### cosmology_chinese_creation (chinese) - Score: 25/100

**Issues:**
- Missing name/title field
- Description missing or too short
- Missing search index
- Missing version number

#### cosmology_norse_afterlife (norse) - Score: 25/100

**Issues:**
- Missing name/title field
- Description missing or too short
- Missing search index
- Missing version number

#### Redirecting to Avalokiteshvara (buddhist) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Redirecting to Manjushri (buddhist) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Jesus Christ (christian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Raphael (christian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Virgin (christian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### God of the Earth | Egyptian Mythology (egyptian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Pluto (greek) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Greek Mythology (greek) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Hindu Mythology (hindu) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Hindu Mythology (hindu) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Hindu Mythology (hindu) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Hindu Mythology (hindu) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Norse Mythology (norse) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Norse Mythology (norse) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Norse Mythology (norse) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Norse Mythology (norse) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Norse Mythology (norse) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Atar (persian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### The Innocent Seeker (tarot) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Sacred Union (tarot) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### As Above, So Below (tarot) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Cosmic Completion (tarot) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Gilgamesh (babylonian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Hammurabi (babylonian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Daniel the Prophet (christian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number

#### Elijah the Prophet (christian) - Score: 35/100

**Issues:**
- Missing contentType field
- Description missing or too short
- Missing search index
- Missing version number


... and 716 more

---

## 8. Action Items

### 🔴 HIGH PRIORITY

1. **Upload 22 missing files to Firestore**
   - See section 3 for complete list
   - Use migration script to upload missing content

### 🟡 MEDIUM PRIORITY

3. **Review 134 extra Firestore documents**
   - Either create local HTML files or remove from Firestore
   - See section 4 for complete list

4. **Add descriptions to 547 documents**
   - Improve search and user experience

### 🟢 LOW PRIORITY

5. **Sync 193 metadata mismatches**
   - Decide which is canonical (local or Firestore)
   - Update accordingly

---

## 9. Firestore Collections

Found 18 collections:

- `archetypes`
- `christian`
- `concepts`
- `cosmology`
- `creatures`
- `cross_references`
- `deities`
- `herbs`
- `heroes`
- `islamic`
- `mythologies`
- `rituals`
- `search_index`
- `symbols`
- `tarot`
- `texts`
- `users`
- `yoruba`

---

*End of Validation Report*

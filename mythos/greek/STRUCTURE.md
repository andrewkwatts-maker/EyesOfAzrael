# Greek Mythology - Structure & Data Guidelines

**Tradition Color:** #DAA520 (Goldenrod)
**Icon:** ⚡ (Lightning Bolt)
**Status:** In Development - Ready for Parallel Work

## 📁 Required Folder Structure

```
mythos/greek/
├── index.html                  # Main Greek hub (TO UPDATE)
├── STRUCTURE.md               # This file
│
├── deities/                   # Olympian gods & goddesses
│   ├── index.html             # Pantheon overview (TO CREATE)
│   ├── zeus.html              # King of gods (PRIORITY)
│   ├── hera.html              # Queen of gods
│   ├── poseidon.html          # Sea god
│   ├── hades.html             # Underworld god
│   ├── athena.html            # Wisdom goddess (PRIORITY)
│   ├── apollo.html            # Sun, music, prophecy (PRIORITY)
│   ├── artemis.html           # Hunt goddess
│   ├── aphrodite.html         # Love goddess
│   ├── ares.html              # War god
│   ├── hephaestus.html        # Forge god
│   ├── hermes.html            # Messenger god
│   ├── dionysus.html          # Wine & ecstasy
│   ├── demeter.html           # Harvest goddess
│   └── hestia.html            # Hearth goddess
│
├── cosmology/                 # Universe structure
│   ├── index.html             # Cosmology overview
│   ├── creation.html          # Chaos → Gaia → Titans → Olympians (STANDARDIZED)
│   ├── afterlife.html         # Elysium, Asphodel, Tartarus (STANDARDIZED)
│   ├── mount-olympus.html     # Home of gods
│   ├── underworld.html        # Hades realm
│   ├── titans.html            # Elder gods
│   └── primordials.html       # Chaos, Gaia, Eros, etc.
│
├── heroes/                    # Legendary mortals
│   ├── index.html             # Heroes overview
│   ├── heracles.html          # 12 labors
│   ├── perseus.html           # Medusa slayer
│   ├── theseus.html           # Minotaur slayer
│   ├── odysseus.html          # Cunning hero
│   ├── achilles.html          # Greatest warrior
│   ├── jason.html             # Argonauts leader
│   └── orpheus.html           # Musician
│
├── creatures/                 # Mythical beings
│   ├── index.html             # Bestiary
│   ├── medusa.html            # Gorgon
│   ├── minotaur.html          # Bull-man
│   ├── chimera.html           # Lion-goat-serpent
│   ├── hydra.html             # Many-headed serpent
│   ├── pegasus.html           # Winged horse
│   ├── sphinx.html            # Riddle creature
│   ├── cyclopes.html          # One-eyed giants
│   └── centaurs.html          # Horse-men
│
├── herbs/                     # Sacred plants
│   ├── index.html             # Herbalism overview
│   ├── laurel.html            # Apollo's sacred bay (PRIORITY)
│   ├── olive.html             # Athena's gift (PRIORITY)
│   ├── myrtle.html            # Aphrodite's plant
│   ├── pomegranate.html       # Persephone's fruit
│   ├── asphodel.html          # Underworld flower
│   ├── narcissus.html         # Self-love
│   ├── hellebore.html         # Madness cure
│   ├── hemlock.html           # Socrates' poison
│   └── preparations.html      # Methods (STANDARDIZED)
│
├── rituals/                   # Ceremonies & mysteries
│   ├── index.html             # Rituals overview
│   ├── eleusinian-mysteries.html  # Demeter/Persephone rites
│   ├── dionysian-rites.html   # Bacchic mysteries
│   ├── olympic-games.html     # Athletic worship
│   ├── oracle-delphi.html     # Pythia prophecies
│   ├── calendar.html          # Festivals (STANDARDIZED)
│   └── offerings.html         # Hecatombs, libations (STANDARDIZED)
│
├── magic/                     # Magical practices
│   ├── index.html             # Magic overview
│   ├── orphic-magic.html      # Orphic traditions
│   ├── hermeticism.html       # Hermetic arts
│   ├── necromancy.html        # Death magic
│   └── pharmakeia.html        # Herb magic
│
├── path/                      # Mystery initiation (STANDARDIZED 6 STAGES)
│   ├── index.html             # Path overview
│   ├── initiate.html          # Stage 1: Mystes (Initiate) - 0-1 year
│   ├── apprentice.html        # Stage 2: Neophyte - 1-3 years
│   ├── adept.html             # Stage 3: Epoptes (Seer) - 3-7 years
│   ├── priest.html            # Stage 4: Hiereus (Priest) - 7-12 years
│   ├── master.html            # Stage 5: Hierophantes (Revealer) - 12-20 years
│   └── arch-master.html       # Stage 6: Mystagogos (Guide) - 20+ years
│
├── texts/                     # Literary sources
│   ├── index.html             # Texts overview
│   ├── iliad.html             # Homer's epic
│   ├── odyssey.html           # Homer's epic
│   ├── theogony.html          # Hesiod's genealogy
│   ├── works-and-days.html    # Hesiod's wisdom
│   └── orphic-hymns.html      # Mystery texts
│
└── symbols/                   # Sacred symbols
    ├── index.html             # Symbols overview
    ├── thunderbolt.html       # Zeus symbol
    ├── trident.html           # Poseidon symbol
    ├── owl.html               # Athena symbol
    ├── lyre.html              # Apollo symbol
    └── caduceus.html          # Hermes symbol
```

## 🎨 Styling Variables

```css
:root {
    --mythos-primary: #DAA520;      /* Goldenrod */
    --mythos-secondary: #FFD700;    /* Gold */
    --mythos-primary-rgb: 218, 165, 32;
}
```

## 📝 Key Greek-Specific Data

### Deity Template Fields

**Zeus Example:**
```
DEITY_NAME: "Zeus"
DEITY_ICON: ⚡
DEITY_TITLE: "King of the Gods, God of Sky and Thunder"
DEITY_DOMAINS: "Sky, thunder, lightning, law, order, justice"
DEITY_SYMBOLS: "Thunderbolt, eagle, oak tree, bull"
DEITY_ANIMALS: "Eagle, bull"
DEITY_PLANTS: "Oak" (link to oak.html)
DEITY_COLORS: "Gold, white, sky blue"
DEITY_PARENTS: "Kronos, Rhea"
DEITY_CONSORTS: "Hera (wife), many others"
DEITY_CHILDREN: "Athena, Apollo, Artemis, Ares, Dionysus, Heracles, Perseus..."
PRIMARY_COLOR: #DAA520
SECONDARY_COLOR: #FFD700
```

### Cross-Tradition Deity Mappings

**Zeus → Similar to:**
- Odin (Norse) - King of gods
- Jupiter (Roman) - Direct equivalent
- Dagda (Celtic) - Father god
- Indra (Hindu) - Thunder king

**Athena → Similar to:**
- Thoth (Egyptian) - Wisdom
- Odin (Norse) - Wisdom aspect
- Saraswati (Hindu) - Knowledge

**Apollo → Similar to:**
- Ra (Egyptian) - Sun god
- Lugh (Celtic) - Many-skilled god
- Surya (Hindu) - Sun deity

### Herb Template Fields

**Laurel/Bay Example:**
```
HERB_NAME: "Laurel (Bay Laurel)"
HERB_SCIENTIFIC_NAME: "Laurus nobilis"
HERB_MYTHOLOGY: "Sacred to Apollo. Daphne transformed into laurel tree..."
DEITY_1: "Apollo" (link to apollo.html)
HERB_SYMBOLISM: "Victory, prophecy, purification, protection"
MEDICINAL_USE_1: "Digestive aid, reduces inflammation"
RITUAL_USE_1: "Burned at Delphi for prophetic visions"
RITUAL_USE_2: "Victory crowns (Olympic/Pythian games)"
RITUAL_USE_3: "Purification and warding"
```

## 🔗 Required Cross-Links

### Within Greek Tradition:
- Zeus page links to: Olympus, thunderbolt, Hera, eagle, oak, Olympic games
- Athena page links to: Wisdom, warfare, olive tree, owl, Parthenon, crafts
- Laurel page links to: Apollo, Delphi oracle, prophecy, victory crowns

### Cross-Tradition Links:

**Creation myth links to:**
- jewish/cosmology/creation.html (Bereshit)
- norse/cosmology/creation.html (Ginnungagap)
- egyptian/cosmology/creation.html (Atum/Aten)

**Afterlife links to:**
- egyptian/cosmology/afterlife.html (Duat)
- norse/cosmology/afterlife.html (Valhalla/Hel)
- jewish/cosmology/afterlife.html (Sheol/Gan Eden)

**Mystery initiations (path) links to:**
- jewish/kabbalah/ascension.html (6 stages)
- egyptian/path/index.html (Priestly progression)
- All other tradition paths

## 📊 Priority Implementation Order

### Phase 1: Core Olympians (Week 1)
1. Update index.html with modular navigation
2. Create deities/index.html (12 Olympians overview)
3. Create Zeus, Athena, Apollo pages (priority)
4. Create cosmology/creation.html (Chaos → Gaia → Titans → Olympians)
5. Create cosmology/afterlife.html (Elysium, Tartarus)

### Phase 2: Heroes & Herbalism (Week 2)
1. Create heroes/index.html (major heroes)
2. Create 3 hero pages: Heracles, Perseus, Odysseus
3. Create herbs/index.html
4. Create laurel.html, olive.html, myrtle.html
5. Create herbs/preparations.html (standardized)

### Phase 3: Mysteries & Path (Week 3)
1. Create rituals/index.html
2. Create rituals/eleusinian-mysteries.html
3. Create rituals/calendar.html (standardized)
4. Create rituals/offerings.html (standardized)
5. Create path/index.html and all 6 stages

### Phase 4: Expansion (Week 4+)
1. Complete remaining Olympians (9 more)
2. Add creatures (Medusa, Minotaur, etc.)
3. Add magic systems (Hermeticism, Orphic)
4. Add texts (Iliad, Odyssey, Theogony)

## 📚 Source Material

### Primary Sources:
- **Homer** - Iliad, Odyssey (8th century BCE)
- **Hesiod** - Theogony, Works and Days (7th century BCE)
- **Homeric Hymns** - Various dates
- **Orphic Hymns** - Hellenistic period
- **Pausanias** - Description of Greece (2nd century CE)
- **Apollodorus** - Bibliotheca (1st-2nd century CE)

### Archaeological Evidence:
- Temple inscriptions, vase paintings
- Cult statues, votive offerings
- Mystery cult sites (Eleusis, Samothrace)

### Modern Scholarship:
- Walter Burkert - "Greek Religion"
- Robert Graves - "The Greek Myths"
- Karl Kerényi - "The Gods of the Greeks"

## ⚠️ Important Notes

### Historical Complexity:
- Greek religion evolved over 1000+ years
- Regional variations (Attic, Doric, Ionian)
- Mystery cults vs. public religion
- Philosophical interpretations (Plato, Stoics)

### Cultural Context:
- Polytheistic system with no central authority
- Gods have human flaws and passions
- Hubris (pride) as cardinal sin
- Xenia (guest-friendship) sacred obligation

### Game Design Gold:
- Rich hero's journey templates (Heracles, Perseus, Odysseus)
- Epic monster catalog (Medusa, Hydra, Minotaur)
- Legendary weapons (Zeus's thunderbolt, Poseidon's trident)
- Quest structures (12 labors, Odyssey's trials)
- Tragic flaws as character mechanics

## ✅ Quality Checklist

- [ ] Uses gold color scheme (#DAA520, #FFD700)
- [ ] Has breadcrumb navigation
- [ ] Includes "Related Concepts" with cross-tradition links
- [ ] Cites ancient sources (Homer, Hesiod, etc.)
- [ ] Has practical applications section
- [ ] Links to similar concepts in other traditions
- [ ] Uses standardized templates
- [ ] Clear, engaging writing (500-1500 words)

---

**Status:** Structure Defined - Ready for Development
**Next Steps:** Begin Phase 1 - Update index.html and create Olympian pages
**Estimated Completion:** 4-6 weeks for core, 3-4 months for full completion

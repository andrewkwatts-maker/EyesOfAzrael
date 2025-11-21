# Norse Mythology - Structure & Data Guidelines

**Tradition Color:** #708090 (Slate Gray)
**Icon:** 🔨 (Mjölnir)
**Status:** In Development - Ready for Parallel Work

## 📁 Required Folder Structure

```
mythos/norse/
├── index.html                  # Main Norse hub (TO UPDATE)
├── STRUCTURE.md               # This file
│
├── deities/                   # Norse gods & goddesses
│   ├── index.html             # Pantheon overview (TO CREATE)
│   ├── odin.html              # Allfather (PRIORITY)
│   ├── thor.html              # Thunder god (PRIORITY)
│   ├── freya.html             # Goddess of love (PRIORITY)
│   ├── frigg.html             # Queen of Asgard
│   ├── loki.html              # Trickster
│   ├── tyr.html               # War & justice
│   ├── baldr.html             # Light & purity
│   ├── freyr.html             # Fertility
│   ├── hel.html               # Goddess of underworld
│   ├── njord.html             # Sea god
│   ├── heimdall.html          # Guardian
│   └── skadi.html             # Winter & hunting
│
├── cosmology/                 # Realms & creation
│   ├── index.html             # Cosmology overview
│   ├── nine-realms.html       # Yggdrasil's realms
│   ├── asgard.html            # Realm of Æsir
│   ├── midgard.html           # Human realm
│   ├── vanaheim.html          # Realm of Vanir
│   ├── jotunheim.html         # Giant realm
│   ├── helheim.html           # Realm of the dead
│   ├── creation.html          # Creation myth (STANDARDIZED)
│   ├── afterlife.html         # Valhalla, Hel (STANDARDIZED)
│   └── ragnarok.html          # End times
│
├── heroes/                    # Legendary figures
│   ├── index.html             # Heroes overview
│   ├── sigurd.html            # Dragon slayer
│   └── beowulf.html           # Monster slayer
│
├── creatures/                 # Mythical beings
│   ├── index.html             # Bestiary
│   ├── jotnar.html            # Giants
│   ├── dwarves.html           # Craftsmen
│   ├── elves.html             # Light & dark elves
│   ├── valkyries.html         # Choosers of the slain
│   ├── norns.html             # Fate weavers
│   └── fenrir.html            # Great wolf
│
├── herbs/                     # Sacred plants
│   ├── index.html             # Herbalism overview
│   ├── yew.html               # Yggdrasil (PRIORITY)
│   ├── ash.html               # Sacred tree (PRIORITY)
│   ├── mugwort.html           # Seiðr visions
│   ├── elder.html             # Protection
│   ├── yarrow.html            # Healing & divination
│   ├── fly-agaric.html        # Berserker mushroom
│   ├── juniper.html           # Purification
│   └── preparations.html      # Methods (STANDARDIZED)
│
├── rituals/                   # Ceremonies
│   ├── index.html             # Rituals overview
│   ├── blot.html              # Blood sacrifice
│   ├── seidr.html             # Shamanic magic
│   ├── galdr.html             # Rune magic
│   ├── utiseta.html           # Vision quest
│   ├── calendar.html          # Sacred days (STANDARDIZED)
│   └── offerings.html         # What to offer (STANDARDIZED)
│
├── magic/                     # Magical systems
│   ├── index.html             # Magic overview
│   ├── runes.html             # Elder Futhark
│   ├── seidr-system.html      # Shamanic practice
│   ├── galdr-system.html      # Incantations
│   └── bind-runes.html        # Rune combinations
│
├── path/                      # Spiritual progression (STANDARDIZED 6 STAGES)
│   ├── index.html             # Path overview
│   ├── initiate.html          # Stage 1: Nýnemi (Newcomer) - 0-6 months
│   ├── apprentice.html        # Stage 2: Þegn (Thane) - 6 months-3 years
│   ├── adept.html             # Stage 3: Goði/Gyðja (Priest/Priestess) - 3-8 years
│   ├── priest.html            # Stage 4: Vitki (Sorcerer) - 8-15 years
│   ├── master.html            # Stage 5: Völva (Seeress) - 15-20 years
│   └── arch-master.html       # Stage 6: Allsherjargodi (High Priest) - 20+ years
│
├── texts/                     # Sacred writings
│   ├── index.html             # Texts overview
│   ├── poetic-edda.html       # Elder poems
│   ├── prose-edda.html        # Snorri's work
│   └── sagas.html             # Family sagas
│
└── symbols/                   # Sacred symbols
    ├── index.html             # Symbols overview
    ├── mjolnir.html           # Thor's hammer
    ├── valknut.html           # Odin's knot
    ├── yggdrasil-symbol.html  # World tree
    └── elder-futhark.html     # Rune system
```

## 🎨 Styling Variables

```css
:root {
    --mythos-primary: #708090;      /* Slate gray */
    --mythos-secondary: #4682B4;    /* Steel blue */
    --mythos-primary-rgb: 112, 128, 144;
}
```

## 📝 Data Structure Templates

### Deity Template
Use: `_scripts/TEMPLATE_deity.html`

**Key Norse-Specific Fields:**
```
DEITY_NAME: "Odin" / "Thor" / etc.
DEITY_ICON: 🧙 / 🔨 / 💖 (appropriate emoji)
DEITY_TITLE: "The Allfather" / "God of Thunder" / etc.
DEITY_DOMAINS: "Wisdom, war, death, poetry, magic"
DEITY_SYMBOLS: "Spear (Gungnir), ravens (Huginn & Muninn), wolves"
DEITY_ANIMALS: "Ravens, wolves, eight-legged horse (Sleipnir)"
DEITY_PLANTS: Link to yew.html, ash.html
PRIMARY_COLOR: #708090
SECONDARY_COLOR: #4682B4
```

### Cross-Tradition Deity Mappings

Link Norse deities to similar figures:

**Odin → Similar to:**
- Zeus (Greek) - King of gods
- Jupiter (Roman) - King of gods
- Dagda (Celtic) - Father god
- Yahweh (Jewish) - Supreme deity

**Thor → Similar to:**
- Zeus (Greek) - Thunder god
- Indra (Hindu) - Storm god
- Perun (Slavic) - Thunder god

**Freya → Similar to:**
- Aphrodite (Greek) - Love goddess
- Venus (Roman) - Love goddess
- Inanna (Sumerian) - Love & war

### Herb Template
Use: `_scripts/TEMPLATE_herb.html`

**Key Fields for Yew (Example):**
```
HERB_NAME: "Yew"
HERB_SCIENTIFIC_NAME: "Taxus baccata"
HERB_COMMON_NAMES: "European Yew, Common Yew"
HERB_MYTHOLOGY: "Sacred to Odin, represents Yggdrasil..."
DEITY_1: "Odin" (link to odin.html)
DEITY_2: "Hel" (link to hel.html)
HERB_SAFETY_WARNINGS: "EXTREMELY TOXIC. All parts except aril are deadly poison..."
```

**Priority Herbs:**
1. **Yew** - Yggdrasil, death/rebirth, toxic
2. **Ash** - Sacred tree, protection, wands
3. **Mugwort** - Visions, seiðr, dream magic

### Standardized Topics

These must exist in EVERY mythology for cross-linking:

#### cosmology/creation.html
- **Theme:** Creation from void (Ginnungagap)
- **Key Figures:** Ymir, Odin & brothers
- **Link to:** jewish/cosmology/creation.html, greek/cosmology/creation.html, etc.

#### cosmology/afterlife.html
- **Theme:** Valhalla, Hel, Fólkvangr
- **Key Figures:** Odin, Hel, Freya, Valkyries
- **Link to:** jewish/cosmology/afterlife.html, egyptian/cosmology/afterlife.html, etc.

#### rituals/calendar.html
- **Festivals:** Yule, Ostara, Midsummer, Winternights
- **Link to:** All other calendar.html pages for comparison

#### rituals/offerings.html
- **Offerings:** Mead, animal sacrifice, weapons, food
- **Link to:** All other offerings.html pages

#### herbs/preparations.html
- **Methods:** Tea, tincture, oil, incense, poultice, salve, bath, charm
- **Link to:** Universal herbalism page

#### path/[stage].html (6 stages)
- Must follow universal 6-stage progression
- Norse-specific titles: Nýnemi → Þegn → Goði/Gyðja → Vitki → Völva → Allsherjargodi
- Link to: All other tradition paths for comparison

## 🔗 Required Cross-Links

### Within Norse Tradition:
- Odin page links to: Yggdrasil, ravens, Valhalla, runes, seiðr, Gungnir spear
- Thor page links to: Mjölnir, giants, storms, oak tree
- Yew page links to: Odin, Hel, death symbolism, wands

### Cross-Tradition Links:
Every Norse page should link to similar concepts:

**Odin links to:**
- jewish/kabbalah/sefirot/keter.html (supreme consciousness)
- greek/deities/zeus.html (king of gods)
- egyptian/deities/ra.html (supreme god)

**Nine Realms links to:**
- jewish/kabbalah/worlds/index.html (4 Worlds)
- buddhist/cosmology/realms.html (31 Realms)
- hindu/cosmology/lokas.html (7 Lokas)

## 📊 Priority Implementation Order

### Phase 1: Core Structure (Week 1)
1. ✅ Update index.html with modular navigation
2. Create deities/index.html (pantheon overview)
3. Create 3 priority deity pages: Odin, Thor, Freya
4. Create cosmology/index.html
5. Create cosmology/creation.html (standardized)
6. Create cosmology/afterlife.html (standardized)

### Phase 2: Herbalism (Week 2)
1. Create herbs/index.html
2. Create 3 priority herb pages: Yew, Ash, Mugwort
3. Create herbs/preparations.html (standardized)

### Phase 3: Rituals & Path (Week 3)
1. Create rituals/index.html
2. Create rituals/calendar.html (standardized)
3. Create rituals/offerings.html (standardized)
4. Create path/index.html
5. Create all 6 path stage pages (standardized)

### Phase 4: Expansion (Week 4+)
1. Complete remaining deity pages (9 more)
2. Complete cosmology pages (realms)
3. Add heroes, creatures, magic systems
4. Add texts and symbols

## 📚 Source Material

### Primary Sources:
- **Poetic Edda** (Elder Edda) - 13th century compilation of Norse poems
- **Prose Edda** - Snorri Sturluson, 1220 CE
- **Sagas** - Icelandic family sagas, 13th-14th century
- **Gesta Danorum** - Saxo Grammaticus, 12th century

### Modern Scholarship:
- H.R. Ellis Davidson - "Gods and Myths of Northern Europe"
- Rudolf Simek - "Dictionary of Northern Mythology"
- Jackson Crawford - Norse mythology translations

### Archaeological Evidence:
- Rune stones, ship burials, temple sites
- Weapon deposits, bog sacrifices
- Viking Age artifacts

## ⚠️ Important Notes

### Historical Accuracy:
- Most sources written centuries after Christianization
- Distinguish between Viking Age practice and later romanticization
- Note regional variations (Norwegian, Swedish, Danish, Icelandic)

### Cultural Sensitivity:
- Modern Ásatrú/Heathenry is a living religion
- Avoid conflating Norse paganism with white supremacist appropriation
- Respect contemporary practitioners

### Game Design Considerations:
- Norse mythology heavily used in games (God of War, Assassin's Creed, etc.)
- Rich combat system (berserkers, shield walls, weapon lore)
- Strong cosmology for world-building (Nine Realms)
- Rune system for magic mechanics
- Fate/Wyrd concept for narrative

## ✅ Quality Checklist

Before marking any page as complete:

- [ ] Uses correct color scheme (#708090, #4682B4)
- [ ] Has breadcrumb navigation (Home → Norse → Category → Page)
- [ ] Includes "Related Concepts" section with internal AND cross-tradition links
- [ ] Cites sources (Eddas, sagas, archaeological evidence)
- [ ] Has practical applications section (game design, character archetypes)
- [ ] Links to at least 2 similar concepts in other traditions
- [ ] Uses standardized template (_scripts/TEMPLATE_[type].html)
- [ ] Includes proper safety warnings (for herbs)
- [ ] Has clear, engaging writing (500-1500 words)

## 🎯 Success Criteria

Norse mythology section will be complete when:

- [ ] All deity pages created (12 minimum)
- [ ] All standardized pages exist (creation, afterlife, calendar, offerings, preparations, 6 path stages)
- [ ] At least 8 herb pages
- [ ] At least 5 ritual pages
- [ ] Cosmology section complete (Nine Realms)
- [ ] All pages properly cross-linked
- [ ] Game design applications throughout

---

**Status:** Structure Defined - Ready for Development
**Next Steps:** Begin Phase 1 - Update index.html and create priority deity pages
**Estimated Completion:** 4-6 weeks for core structure, 3-4 months for full completion

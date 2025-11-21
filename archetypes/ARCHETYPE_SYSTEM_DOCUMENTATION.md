# Universal Archetype System Documentation

## Overview

This archetype system creates a comprehensive cross-referencing framework that connects deities across all world mythologies through universal archetypal patterns. It enables exploration of how different cultures express the same fundamental divine forces through their unique traditions.

## System Components

### 1. Main Archetype Index
**File:** `H:\DaedalusSVN\PlayTow\EOAPlot\docs\archetypes\index.html`

**Purpose:** Central hub for exploring all universal archetypes

**Features:**
- Grid layout displaying all major archetype categories
- Search functionality filtering by:
  - Deity name
  - Archetype category
  - Keywords (war, wisdom, creation, death, etc.)
  - Tradition (Greek, Hindu, Norse, etc.)
- Category filters: Power & Authority, Creation & Life, Knowledge & Wisdom, Death & Transition, Chaos & Trickery
- Direct links to all 14 mythology traditions
- Visual card-based interface with icons and deity examples

**Navigation:**
- Links to individual archetype pages
- Links to cross-reference matrix
- Links to all mythology index pages

---

### 2. Individual Archetype Pages

Each archetype has a dedicated page with comprehensive analysis and expandable codex search sections.

#### Currently Implemented:

**A. Sky Father Archetype**
- **File:** `H:\DaedalusSVN\PlayTow\EOAPlot\docs\archetypes\sky-father\index.html`
- **Deities:** Zeus, Jupiter, Odin, Dyaus Pita, Indra, Jade Emperor, Ahura Mazda, Baal Hadad, Perun, Taranis
- **Expandable Sections:**
  - Zeus's Birth and Rise to Power (Hesiod, Theogony)
  - Thunder as Divine Authority (Homer, Iliad)
  - Zeus as Upholder of Justice (Hesiod, Works and Days)
  - Indra Slays Vritra (Rigveda)
  - Indra's Thunderbolt (Rigveda)
- **Analysis:** Indo-European linguistic connections, psychological significance, universal attributes

**B. Trickster Archetype**
- **File:** `H:\DaedalusSVN\PlayTow\EOAPlot\docs\archetypes\trickster\index.html`
- **Deities:** Loki, Hermes, Anansi, Coyote, Sun Wukong, Kitsune/Tanuki, Krishna, Set, Maui, Eshu/Elegba
- **Expandable Sections:**
  - Loki's Gender-Shifting and Birth of Sleipnir (Prose Edda)
  - Loki's Theft and Death of Baldr (Prose Edda)
  - Loki's Punishment (Prose Edda)
  - Infant Hermes Steals Apollo's Cattle (Homeric Hymn)
  - Sun Wukong Rebels Against Heaven (Journey to the West)
- **Analysis:** Why cultures need tricksters, trickster as cultural hero, necessary chaos

**C. Wisdom Goddess Archetype**
- **File:** `H:\DaedalusSVN\PlayTow\EOAPlot\docs\archetypes\wisdom\wisdom-goddess.html` (existing)
- **Deities:** Athena, Saraswati, Neith, Minerva, Sophia, Brigid, Odin (male variant), Nisaba, Benzaiten, Chokhmah, Nabu
- **Features:** Comprehensive analysis of birth myths, strategic warfare, inventions, symbols

#### Planned Archetypes (Template Structure):

**D. Earth Mother**
- **Path:** `earth-mother/index.html`
- **Deities:** Gaia, Prithvi, Ninhursag, Tiamat, Pachamama

**E. Death God**
- **Path:** `death/index.html`
- **Deities:** Hades, Yama, Anubis, Hel, Osiris, Nergal

**F. Love Goddess**
- **Path:** `love/index.html`
- **Deities:** Aphrodite, Venus, Inanna, Ishtar, Freya

**G. War God**
- **Path:** `war/index.html`
- **Deities:** Ares, Mars, Tyr, Indra, Marduk

**H. Healing Deity**
- **Path:** `healing/index.html`
- **Deities:** Asclepius, Dhanvantari, Imhotep, Brigid

**I. Cosmic Creator**
- **Path:** `cosmic-creator/index.html`
- **Deities:** Brahma, Ptah, Atum, An

**J. Celestial Beings**
- **Path:** `celestial/index.html`
- **Entities:** Angels (Christian), Devas (Hindu/Buddhist), Amesha Spentas (Zoroastrian), Apsaras

---

### 3. Cross-Reference Matrix
**File:** `H:\DaedalusSVN\PlayTow\EOAPlot\docs\archetypes\cross-reference-matrix.html`

**Purpose:** Interactive table mapping ALL deities to ALL archetypes

**Features:**
- Scrollable matrix with deity rows and archetype columns
- Color-coded match quality:
  - **Excellent Match (90-100%):** Green highlighting
  - **Good Match (70-89%):** Gold highlighting
  - **Partial Match (50-69%):** Orange highlighting
  - **Minimal/No Match (<50%):** Gray
- Percentage indicators showing archetype alignment strength
- Clickable cells that open modals with detailed manifestation analysis
- Filter by tradition (Greek, Roman, Norse, Egyptian, Hindu, etc.)
- Filter by archetype type

**Modal Content:**
When clicking a matrix cell, displays:
- Primary characteristics of how that deity embodies the archetype
- Primary sources with Book:Chapter:Verse citations
- Symbolic elements and cultural function
- Direct links to both deity page and archetype page

**Currently Mapped Deities:**
1. Zeus (Greek) - Sky Father 98%, War God 75%, Trickster 55%
2. Jupiter (Roman) - Sky Father 97%, War God 70%
3. Odin (Norse) - Wisdom 95%, War God 92%, Sky Father 85%, Death God 78%, Trickster 70%
4. Athena (Greek) - Wisdom 98%, War God 90%
5. Brahma (Hindu) - Cosmic Creator 96%, Wisdom 75%
6. Loki (Norse) - Trickster 99%, Death God 60%, War God 55%
7. Hades (Greek) - Death God 94%
8. Aphrodite (Greek) - Love 98%, Trickster 72%
9. Indra (Hindu) - War God 95%, Sky Father 93%
10. Saraswati (Hindu) - Wisdom 98%
11. Osiris (Egyptian) - Death God 96%, Earth Mother 75%, Cosmic Creator 72%

---

### 4. Expandable Codex Search Sections

**Template:** `H:\DaedalusSVN\PlayTow\EOAPlot\templates\codex_search_template.html`

**Purpose:** Provides collapsible sections with primary source citations in Book:Chapter:Verse format

**Structure:**
```html
<div class="codex-search-section">
    <div class="codex-search-header" onclick="toggleCodexSearch(this)">
        <h3>📚 Primary Sources: [TERM]</h3>
        <span class="expand-icon">▼</span>
    </div>
    <div class="codex-search-content">
        <div class="search-result-item">
            <div class="citation" onclick="toggleVerse(this)">
                [Book Name]:[Chapter]:[Verse]
            </div>
            <div class="verse-text">
                [Verse text content...]
            </div>
            <div class="book-reference">
                Source: [Full Book Title], [Date/Edition]
            </div>
        </div>
    </div>
</div>
```

**Features:**
- Click header to expand/collapse entire section
- Click individual citations to show/hide verse text
- Nested expandability for organized information architecture
- Color-coded by archetype theme
- Maintains reading context while allowing selective deep-dives

**JavaScript Functions:**
- `toggleCodexSearch(header)` - Expands/collapses section
- `toggleVerse(citation)` - Shows/hides individual verse text
- `scrollToVerse(bookRef)` - Deep links to specific citations

**Citation Format Examples:**
- **Greek:** `Hesiod, Theogony:453-467`
- **Hindu:** `Rigveda:1.32.1-5`
- **Norse:** `Prose Edda, Gylfaginning:42`
- **Chinese:** `Journey to the West:Chapter 5`
- **Egyptian:** `Book of the Dead:Spell 125:1-5`

---

### 5. Bidirectional Linking System

**Purpose:** Connect deity pages to archetype pages AND archetype pages back to deity pages

**Implementation:**

#### A. Deity Pages → Archetype Pages

Each deity page now includes an "Archetypal Patterns" section showing which archetypes they embody:

**Example: Zeus (H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\greek\deities\zeus.html)**
```html
<section style="margin-top: 2rem;">
    <h2 style="color: var(--mythos-primary);">Archetypal Patterns</h2>
    <p>Zeus embodies several universal archetypes found across world mythologies:</p>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
        <div style="background: rgba(218, 165, 32, 0.1); padding: 1.5rem; border-radius: 10px;">
            <h3>⚡ Sky Father (98%)</h3>
            <p>Zeus is the quintessential Sky Father—supreme patriarch, thunder wielder, cosmic law upholder.</p>
            <a href="../../../archetypes/sky-father/index.html">→ Explore Sky Father Archetype</a>
        </div>
        <!-- Additional archetype cards -->
    </div>
    <a href="../../../archetypes/cross-reference-matrix.html">📊 View Complete Archetype Matrix</a>
</section>
```

**Updated Deity Pages:**
1. ✅ Zeus - Sky Father (98%), War God (75%), Trickster (55%)
2. ✅ Brahma - Cosmic Creator (96%), Wisdom (75%)
3. Athena - Wisdom (98%), War God (90%) [Needs update]
4. Osiris - Death God (96%), Earth Mother (75%), Cosmic Creator (72%) [Needs update]
5. Loki - Trickster (99%), Death God (60%), War God (55%) [Needs update]

**Pattern to Apply to Remaining Deities:**
- Add section after "Practical Applications" and before "Related Concepts"
- Display 2-4 archetype cards showing best matches
- Include percentage match quality
- Brief description of how deity embodies archetype
- Link to archetype page
- Link to cross-reference matrix

#### B. Archetype Pages → Deity Pages

Each archetype page contains:
- **Comparison Table:** Lists all deities embodying the archetype with links to their pages
- **Detailed Analysis:** Deep-dives into 2-3 exemplar deities with primary sources
- **Cross-Tradition Parallels:** Comparative analysis showing connections

**Example Table Structure:**
```html
<table>
    <thead>
        <tr>
            <th>Tradition</th>
            <th>Deity</th>
            <th>Key Attributes</th>
            <th>Primary Domain</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Greek</td>
            <td><a href="../../mythos/greek/deities/zeus.html">Zeus</a></td>
            <td>King of Olympus, sky god, thunderbolt wielder</td>
            <td>Sky, justice, hospitality, oaths</td>
        </tr>
        <!-- More rows -->
    </tbody>
</table>
```

---

## Color Schemes

Each archetype category has distinct color theming for visual differentiation:

- **Sky Father:** Sky blue (#87ceeb) / Steel blue (#4682b4)
- **Trickster:** Hot pink (#ff69b4) / Medium violet red (#c71585)
- **Wisdom Goddess:** Gold (#ffd700) / Dark goldenrod (#daa520)
- **Death God:** Dark purple (#4B0082) / Dim gray (#696969)
- **Earth Mother:** Forest green (#228B22) / Olive drab (#6B8E23)
- **Love Goddess:** Deep pink (#FF1493) / Hot pink (#FF69B4)
- **War God:** Crimson (#DC143C) / Dark red (#8B0000)
- **Healing Deity:** Medium sea green (#3CB371) / Light sea green (#20B2AA)
- **Cosmic Creator:** Dark slate blue (#483D8B) / Slate blue (#6A5ACD)
- **Celestial Beings:** Light sky blue (#87CEFA) / Powder blue (#B0E0E6)
- **Universal Archetypes (index):** Purple gradient (#8a2be2, #ba55d3, #9370db)

---

## Directory Structure

```
H:\DaedalusSVN\PlayTow\EOAPlot\docs\archetypes\
│
├── index.html                          # Main archetype index
├── cross-reference-matrix.html         # Interactive matrix
├── ARCHETYPE_SYSTEM_DOCUMENTATION.md   # This file
│
├── sky-father\
│   └── index.html                      # Sky Father archetype page
│
├── earth-mother\
│   └── index.html                      # Earth Mother archetype page
│
├── trickster\
│   └── index.html                      # Trickster archetype page
│
├── death\
│   └── index.html                      # Death God archetype page
│
├── love\
│   └── index.html                      # Love Goddess archetype page
│
├── war\
│   └── index.html                      # War God archetype page
│
├── wisdom\
│   ├── index.html                      # Wisdom overview
│   └── wisdom-goddess.html             # Specific wisdom goddess analysis
│
├── healing\
│   └── index.html                      # Healing Deity archetype page
│
├── cosmic-creator\
│   └── index.html                      # Cosmic Creator archetype page
│
└── celestial\
    └── index.html                      # Celestial Beings archetype page
```

---

## Usage Instructions

### For Content Creators

**Adding a New Deity to the System:**

1. **Create/Update Deity Page:**
   - Add "Archetypal Patterns" section showing which archetypes they embody
   - Use grid layout with archetype cards
   - Include percentage match quality
   - Link to specific archetype pages
   - Link to cross-reference matrix

2. **Update Archetype Pages:**
   - Add deity to comparison table
   - If deity is exemplary, create expandable codex section with primary sources
   - Update cross-tradition analysis if relevant

3. **Update Cross-Reference Matrix:**
   - Add new row to matrix table
   - Fill in match percentages for all archetypes
   - Create modal content for high-quality matches

**Adding a New Archetype:**

1. **Create Archetype Page:**
   - Use existing archetype page as template
   - Include: Universal Characteristics, Deity Comparison Table, Primary Sources (2-3 exemplars), Cross-Cultural Analysis, Symbolic Elements
   - Implement expandable codex search sections for key myths
   - Add bidirectional links to related archetypes

2. **Update Main Index:**
   - Add archetype card to grid
   - Include icon, title, description, deity examples
   - Add data-category and data-keywords for filtering

3. **Update Cross-Reference Matrix:**
   - Add new column header
   - Fill in all deity rows with match percentages

### For Researchers

**Finding Archetype Connections:**

1. **Start at Main Index** (`archetypes/index.html`)
   - Browse by category or search by keyword
   - Click archetype card to view full analysis

2. **Explore Archetype Page**
   - Review universal characteristics
   - Check deity comparison table for your tradition of interest
   - Expand primary source sections to read original texts
   - Follow links to related archetypes

3. **Use Cross-Reference Matrix** (`cross-reference-matrix.html`)
   - Filter by tradition to see all deities from one culture
   - Filter by archetype to see all manifestations of one pattern
   - Click cells to read detailed manifestation analysis
   - Note percentage matches to understand archetype strength

**Deep Research Path:**
1. Main Index → Specific Archetype → Primary Sources (Expandable)
2. Cross-Reference Matrix → Modal Analysis → Deity Page → Full Mythology Context
3. Archetype Page → Related Archetypes → Cross-Cultural Patterns

---

## Search Functionality

### Main Index Search
- **Text Search:** Filters by deity name, archetype name, description text, and keywords
- **Category Filter:** Power & Authority, Creation & Life, Knowledge & Wisdom, Death & Transition, Chaos & Trickery
- **Combined Filtering:** Text search + category filter work together

### Cross-Reference Matrix Filters
- **Tradition Filter:** Greek, Roman, Norse, Egyptian, Hindu, Chinese, Sumerian, Babylonian, Persian
- **Archetype Filter:** Sky Father, Earth Mother, Trickster, Death God, Love Goddess, War God, Wisdom Goddess, Healing Deity, Cosmic Creator, Celestial Beings
- **Combined Filtering:** Both filters work together to narrow results

---

## Technical Implementation

### CSS Classes

**Codex Search Sections:**
- `.codex-search-section` - Container for expandable section
- `.codex-search-header` - Clickable header bar
- `.codex-search-content` - Hidden content (display: none by default)
- `.codex-search-content.show` - Visible content
- `.search-result-item` - Individual citation block
- `.citation` - Book:Chapter:Verse reference
- `.verse-text` - Hidden verse content
- `.verse-text.show` - Visible verse text
- `.book-reference` - Source attribution

**Matrix Styling:**
- `.match-excellent` - Green background, 90-100% match
- `.match-good` - Gold background, 70-89% match
- `.match-partial` - Orange background, 50-69% match
- `.match-none` - Gray background, <50% match

### JavaScript Functions

**Codex Search:**
```javascript
function toggleCodexSearch(header) {
    const section = header.parentElement;
    const content = section.querySelector('.codex-search-content');
    section.classList.toggle('expanded');
    content.classList.toggle('show');
}

function toggleVerse(citation) {
    const verseText = citation.nextElementSibling;
    verseText.classList.toggle('show');
}
```

**Matrix Interactions:**
```javascript
function showManifestation(deity, archetype, matchType) {
    // Opens modal with detailed analysis
    // Populates with primary sources and characteristics
}

function closeModal() {
    // Closes manifestation modal
}
```

---

## Future Expansion

### Additional Archetypes to Implement

1. **Divine Child** - Krishna, Horus, Jesus, Dionysus
2. **Fertility God** - Dionysus, Osiris, Freyr, Tammuz
3. **Sun God** - Ra, Helios, Surya, Inti, Amaterasu
4. **Moon Goddess** - Selene, Luna, Chandra, Tsukuyomi
5. **Underworld Queen** - Persephone, Ereshkigal, Hel
6. **Divine Craftsman** - Hephaestus, Ptah, Wayland, Tvashtri
7. **Divine Messenger** - Hermes, Iris, Garuda, Narada
8. **Storm God** - Set, Susanoo, Tlaloc, Tezcatlipoca
9. **Sacred King** - Osiris, Arthur, Odin (as Wanderer)
10. **Mother Goddess** - Demeter, Isis, Parvati

### Potential Enhancements

1. **Primary Source Database:** Searchable repository of all citations
2. **Symbolic Element Index:** Cross-reference symbols (eagle, owl, serpent, etc.)
3. **Interactive Genealogy:** Family tree visualizations showing divine relationships
4. **Attribute Tag System:** Tag-based filtering (shapeshifter, virgin goddess, culture hero, etc.)
5. **Ritual Correlation:** Map similar rituals across traditions
6. **Timeline Visualization:** Show chronological development of archetypes
7. **Regional Mapping:** Geographic visualization of archetype distribution

---

## Maintenance Guidelines

### Regular Updates

1. **Add New Deities:** When adding mythology content, remember to:
   - Update deity page with archetype links
   - Add deity to relevant archetype pages
   - Update cross-reference matrix
   - Test all bidirectional links

2. **Verify Citations:** Periodically check that all Book:Chapter:Verse citations are accurate

3. **Link Integrity:** Test internal links between pages monthly

4. **Search Functionality:** Test filters and search on main index and matrix

### Quality Standards

- **Match Percentages:** Base on number of universal characteristics exhibited (8+ characteristics = 80%+)
- **Primary Sources:** Always cite original texts with specific references
- **Bidirectional Links:** Every archetype→deity link must have corresponding deity→archetype link
- **Expandable Sections:** All primary sources should use codex search template
- **Color Consistency:** Maintain archetype color schemes across all pages

---

## Key Features Summary

✅ **Main Archetype Index** - Central hub with search and category filtering
✅ **Individual Archetype Pages** - Deep analysis with primary sources
✅ **Expandable Codex Search** - Collapsible sections with Book:Chapter:Verse citations
✅ **Cross-Reference Matrix** - Interactive table mapping all deity-archetype relationships
✅ **Bidirectional Linking** - Deity pages link to archetypes, archetypes link to deities
✅ **Universal Characteristics** - Consistent framework for comparing manifestations
✅ **Primary Source Integration** - Citations from Vedas, Homer, Eddas, etc.
✅ **Cross-Cultural Analysis** - Comparative mythology across all traditions
✅ **Match Quality Indicators** - Percentage-based archetype alignment strength
✅ **Color-Coded System** - Visual differentiation by archetype category
✅ **Responsive Design** - Mobile-friendly layouts

---

## Contact & Contributions

This archetype system is designed to be extensible and collaborative. When adding new content:
- Follow the established citation format
- Maintain bidirectional links
- Use expandable codex search template
- Update all three components (index, archetype page, matrix)
- Test filtering and search functionality

The goal is to create the most comprehensive cross-mythological archetype reference system, grounded in primary sources and enabling deep comparative analysis.

---

**Last Updated:** 2025-11-13
**Version:** 1.0
**Primary Author:** EOAPlot Archetype System

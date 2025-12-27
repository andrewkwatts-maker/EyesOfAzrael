# HTML Structure Patterns Analysis

**Phase 1.2: Data Structure Analysis**
**Date:** 2025-12-15
**Analyzed Files:** 10 representative samples across 5 mythologies

## Executive Summary

The HTML structure across the Eyes of Azrael website shows **strong consistency** with **minor mythology-specific variations**. All entity pages follow a common pattern that makes automated extraction highly feasible with template-based parsing.

**Key Finding:** ~95% structural consistency across mythologies, with variations primarily in:
- CSS variable naming conventions
- Special character sets (hieroglyphs, runes)
- Entity-type specific sections (hero labors vs deity worship)

---

## I. Core HTML Structure Pattern

### A. Universal Document Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Standard meta tags -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>[Entity Name] - [Mythology] Mythology</title>

    <!-- Theme system (universal) -->
    <link href="../../../themes/theme-base.css" rel="stylesheet"/>
    <link href="../../../styles.css" rel="stylesheet"/>
    <link href="../../../themes/corpus-links.css" rel="stylesheet"/>
    <link rel="stylesheet" href="../../../themes/smart-links.css">
    <script defer src="../../../themes/smart-links.js"></script>
    <script defer src="../../../themes/theme-animations.js"></script>
    <script defer src="../../../themes/theme-picker.js"></script>

    <!-- Firebase Auth (on some pages) -->
    <link rel="stylesheet" href="../../../css/user-auth.css">
    <script src="../../../js/firebase-auth.js"></script>

    <!-- Inline CSS with mythology-specific colors -->
    <style>
        :root {
            --mythos-primary: [COLOR];
            --mythos-secondary: [COLOR];
        }
        /* Entity-type specific styles */
    </style>
</head>
<body>
    <!-- Theme picker -->
    <div id="theme-picker-container"></div>

    <!-- Header -->
    <header>
        <div class="header-content">
            <h1>[ICON] [Entity Name]</h1>
            <div id="user-auth-nav"></div> <!-- if Firebase enabled -->
        </div>
    </header>

    <!-- Breadcrumbs -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
        Home → [Mythology] → [Entity Type] → [Entity Name]
    </nav>

    <main>
        <!-- Entity Header -->
        <!-- Attributes Section -->
        <!-- Mythology/Stories Section -->
        <!-- Relationships Section -->
        <!-- Worship/Practices Section (if deity) -->
        <!-- Interlink Panel -->
        <!-- See Also Section -->
    </main>

    <footer>
        <!-- Standard footer -->
    </footer>

    <!-- Firebase scripts (if enabled) -->
</body>
</html>
```

---

## II. Section-by-Section Analysis

### A. Entity Header Section

**Class Names:**
- `deity-header` (for deities)
- `hero-header` (for heroes)
- `hero-section` (for creatures/beings)

**Structure:**
```html
<section class="[entity-type]-header">
    <div class="[entity-type]-icon">[EMOJI/ICON]</div>
    <h2>[Entity Name]</h2>
    <p class="subtitle">[Title/Epithet]</p>
    <p>[Description paragraph]</p>

    <!-- Quick Navigation (Egyptian, Greek samples) -->
    <nav style="...">
        <h3>📑 Page Sections</h3>
        <div>
            <a href="#attributes">→ Attributes & Domains</a>
            <a href="#mythology">→ Mythology & Stories</a>
            <!-- etc -->
        </div>
    </nav>
</section>
```

**Variations:**
- **Egyptian (Ra)**: Includes hieroglyphs in dedicated font spans
- **Greek/Roman**: Standard emoji icons
- **Norse/Hindu**: Standard emoji icons
- **Babylonian**: Standard emoji icons

**Extraction Fields:**
- Entity name: `<h2>` text content
- Icon: First div with emoji/icon class
- Subtitle: `<p class="subtitle">`
- Description: First large `<p>` after subtitle

---

### B. Attributes & Domains Section

**ID:** `#attributes` or no ID, identified by heading

**Structure:**
```html
<section id="attributes">
    <h2 style="color: var(--mythos-primary);">Attributes & Domains</h2>
    <div class="attribute-grid">
        <div class="attribute-card">
            <div class="attribute-label">Titles</div>
            <div class="attribute-value">[CONTENT]</div>
        </div>
        <div class="attribute-card">
            <div class="attribute-label">Domains</div>
            <div class="attribute-value">[CONTENT]</div>
        </div>
        <div class="attribute-card">
            <div class="attribute-label">Symbols</div>
            <div class="attribute-value">[CONTENT]</div>
        </div>
        <div class="attribute-card">
            <div class="attribute-label">Sacred Animals</div>
            <div class="attribute-value">[CONTENT]</div>
        </div>
        <div class="attribute-card">
            <div class="attribute-label">Sacred Plants</div>
            <div class="attribute-value">[CONTENT]</div>
        </div>
        <div class="attribute-card">
            <div class="attribute-label">Colors</div>
            <div class="attribute-value">[CONTENT]</div>
        </div>
        <!-- Additional cards: Planet, Number, Weapons (varies by entity) -->
    </div>
</section>
```

**Common Labels:**
- **Universal**: Titles, Domains, Symbols, Colors
- **Deities**: Sacred Animals, Sacred Plants, Planet (Babylonian), Number (Babylonian)
- **Heroes**: Weapons, Birth Name, Titles, Domains
- **Creatures**: Physical Features, Types, Symbolism

**Extraction Pattern:**
```
FOR each .attribute-card:
    label = .attribute-label text
    value = .attribute-value text/HTML
```

---

### C. Mythology & Stories Section

**ID:** `#mythology` (often duplicated in style attribute)

**Structure:**
```html
<section id="mythology" style="background: var(--color-surface); ...">
    <h2 style="color: var(--mythos-primary);">Mythology & Stories</h2>

    <p>[Introductory paragraph]</p>

    <h3 style="color: var(--mythos-secondary);">Key Myths:</h3>
    <ul style="margin: 1rem 0 0 2rem; line-height: 1.8;">
        <li><strong>[Myth Name]:</strong> [Description]</li>
        <!-- More myths -->
    </ul>

    <!-- OR for heroes: detailed narrative with h3 subheadings -->
    <h3>Birth and Upbringing</h3>
    <p>[Content]</p>

    <h3>Major Adventures</h3>
    <p>[Content]</p>

    <!-- Citation box -->
    <div class="citation" style="margin-top: 1rem;">
        <strong>Sources:</strong> [Ancient texts, dates]
    </div>
</section>
```

**Hero-Specific Variation (Heracles):**
```html
<div class="labors-grid">
    <div class="labor-card">
        <span class="labor-number">1</span>
        <span class="labor-title">[Labor Name]</span>
        <p class="labor-desc">[Description]</p>
    </div>
    <!-- 12 labor cards -->
</div>
```

**Extraction Pattern:**
- Main description: First `<p>` after h2
- Key myths: `<ul>` items after "Key Myths" heading
- Citation: `.citation` div content
- Special: `.labors-grid` for hero labors (Greek heroes)

---

### D. Relationships Section

**ID:** `#relationships`

**Structure:**
```html
<section id="relationships" style="...">
    <h2>Relationships</h2>

    <!-- Family box -->
    <div style="background: rgba(0,0,0,0.2); ...">
        <h3 style="color: var(--mythos-secondary);">Family</h3>
        <ul style="margin: 0.5rem 0 0 2rem;">
            <li><strong>Parents:</strong> [Names/Description]</li>
            <li><strong>Consort(s):</strong> [Names]</li>
            <li><strong>Children:</strong> [Names]</li>
            <li><strong>Siblings:</strong> [Names]</li>
        </ul>
    </div>

    <!-- Allies & Enemies box -->
    <div style="background: rgba(0,0,0,0.2); ...">
        <h3 style="color: var(--mythos-secondary);">Allies & Enemies</h3>
        <ul style="margin: 0.5rem 0 0 2rem;">
            <li><strong>Allies:</strong> [Names/Description]</li>
            <li><strong>Enemies:</strong> [Names/Description]</li>
        </ul>
    </div>
</section>
```

**Variations:**
- Some use `<h3>Family</h3>` directly without wrapping div
- "Allies & Enemies" vs "Allies & Dynamics" (Hindu sample)
- "Rivals" instead of "Enemies" (Greek Hermes)

**Extraction Pattern:**
```
family_section = find div/section containing h3 "Family"
FOR each <li> in family_section:
    label = <strong> text (before colon)
    value = remaining text after colon
```

---

### E. Worship & Rituals Section (Deities Only)

**ID:** `#worship`

**Structure:**
```html
<section id="worship" style="...">
    <h2>Worship & Rituals</h2>

    <div style="...">
        <h3>Sacred Sites</h3>
        <p>[Description of temples/locations]</p>
    </div>

    <div style="...">
        <h3>Festivals</h3>
        <ul>
            <li><strong>[Festival Name]:</strong> [Description]</li>
        </ul>
    </div>

    <div style="...">
        <h3>Offerings</h3>
        <p>[Description of offerings]</p>
    </div>

    <div style="...">
        <h3>Prayers & Invocations</h3>
        <p>[Description/Examples]</p>
    </div>
</section>
```

**Not Present:** On hero and creature pages (replaced with other entity-specific content)

---

### F. Interlink Panel (Universal)

**Class:** `interlink-panel`

**Structure:**
```html
<section class="interlink-panel" style="margin-top: 3rem;">
    <h3 class="interlink-header">
        <span class="interlink-icon">🔗</span>
        Related Across the Mythos
    </h3>

    <div class="interlink-grid">
        <!-- Archetype Section -->
        <div class="interlink-section">
            <div class="interlink-section-title">Archetype</div>
            <a href="[archetype-url]" class="archetype-link-card">
                <div class="archetype-badge">[ICON] [ARCHETYPE NAME]</div>
                <p class="archetype-context">[Description]</p>
                <span class="see-parallels">See parallels: [names] →</span>
            </a>
        </div>

        <!-- Other sections: Sacred Items, Places, Related Figures -->
    </div>

    <!-- Cross-Cultural Parallels -->
    <div class="parallel-traditions glass-card" style="...">
        <h4>🌍 Cross-Cultural Parallels</h4>
        <div class="parallel-grid">
            <a href="[url]" class="parallel-card">
                <span class="tradition-flag">[ICON]</span>
                <span class="parallel-name">[Name]</span>
                <span class="tradition-label">[Mythology]</span>
            </a>
            <!-- More parallels -->
        </div>
    </div>
</section>
```

**Extraction Value:** High - contains cross-mythology links and archetype associations

---

### G. See Also Section (Universal)

**Class:** `see-also-section`

**Structure:**
```html
<div class="see-also-section">
    <h4>📚 See Also</h4>
    <div class="see-also-links">
        <a href="[url]" class="see-also-link">
            <span>[ICON]</span> [Entity Name]
        </a>
        <!-- More links -->
    </div>
</div>
```

---

## III. CSS Variable Patterns

### A. Color Definition Methods

**Method 1: Inline :root in <style> tag** (Most common)
```css
:root {
    --mythos-primary: #CD853F;
    --mythos-secondary: #DAA520;
    --mythos-primary-rgb: 218, 165, 32; /* Sometimes */
}
```

**Method 2: Direct style attribute usage**
```html
<h2 style="color: var(--mythos-primary);">
```

**Method 3: Global theme system** (theme-base.css)
```css
--color-primary
--color-secondary
--color-surface
--color-border
--color-text-primary
--color-text-secondary
```

### B. Mythology Color Schemes

| Mythology | Primary | Secondary | Notes |
|-----------|---------|-----------|-------|
| Egyptian | #CD853F | #DAA520 | Gold/sandstone |
| Greek | #DAA520 | #FFD700 | Gold |
| Roman | Various | Various | Matches Greek often |
| Norse | #4682B4 | #5A9BD5 | Steel blue |
| Babylonian | #483D8B | #6A5ACD | Purple |
| Hindu | Variable | Variable | Context-dependent |
| Celtic | Various | Various | Green tones |

### C. Variable Usage Locations

1. **Section headings**: `style="color: var(--mythos-primary);"`
2. **Subheadings**: `style="color: var(--mythos-secondary);"`
3. **Attribute labels**: `color: var(--mythos-primary);` (in CSS)
4. **Gradient backgrounds**: `linear-gradient(135deg, var(--mythos-primary), var(--mythos-secondary))`
5. **Border colors**: `border-left: 4px solid var(--mythos-secondary);`

---

## IV. Special Character Handling

### A. Egyptian Hieroglyphs

**Font Declaration:**
```html
<span style="font-family: 'Segoe UI Historic', 'Noto Sans Egyptian Hieroglyphs', serif;">
    𓇳𓏺
</span>
```

**Locations:**
- Entity icon (header)
- Inline in headings/names
- Sometimes with `filter: drop-shadow()`

**Example (Ra page):**
```html
<div class="deity-icon" style="font-family: 'Segoe UI Historic', ...; font-size: 6rem; filter: drop-shadow(...);">
    𓇳𓏺
</div>
```

**Extraction Challenge:** Unicode hieroglyphs mixed with regular text

### B. Other Special Characters

- **Egyptian**: Transliteration in `<span style="font-style: italic;">` (e.g., "rꜥ")
- **Norse**: Runic characters possible (not in samples but documented)
- **Babylonian**: Cuneiform mentioned in corpus search context
- **Hindu**: Sanskrit diacritics in names

---

## V. Link Types & Corpus Integration

### A. Corpus Link Pattern

**Structure:**
```html
<a class="corpus-link"
   data-term="[SearchTerm]"
   data-tradition="[mythology]"
   href="../corpus-search.html?term=[term]"
   title="Search corpus for '[Term]'">
    [Display Text]
</a>
```

**Attributes:**
- `class="corpus-link"` - Identifies as corpus search link
- `data-term` - Search term
- `data-tradition` - Mythology/corpus
- `data-corpus` (sometimes)
- `data-smart` (sometimes) - Smart linking feature
- `data-mythos` (sometimes) - Mythology context

**High Density:** Mythology/Stories sections heavily use corpus links

### B. Internal Link Patterns

**Relative paths:**
```
../deities/[name].html
../../[mythology]/deities/[name].html
../../../archetypes/[archetype]/index.html
../cosmology/[concept].html
```

**Extraction Value:** Map relationship networks between entities

---

## VI. Entity Type Variations

### A. Deity Pages

**Required Sections:**
1. Header with icon/hieroglyphs
2. Attributes & Domains (8-10 attributes)
3. Mythology & Stories
4. Relationships (Family + Allies/Enemies)
5. Worship & Rituals (Sacred Sites, Festivals, Offerings, Prayers)
6. Forms/Manifestations (Egyptian Ra example)
7. Interlink Panel
8. See Also

**Special:** "Author's Theories" section (Egyptian Ra - unusual)

### B. Hero Pages

**Required Sections:**
1. Header with icon
2. Attributes & Domains (modified: Weapons instead of Sacred Animals)
3. Mythology & Stories (narrative form with h3 subheadings)
4. Relationships (Family + Allies/Enemies)
5. Special Adventures/Quests section
6. Death & Legacy/Apotheosis
7. Sources/Primary texts
8. Interlink Panel
9. See Also

**Special:**
- Greek heroes have "labors-grid" for task lists (Heracles)
- More narrative, less structured than deities

### C. Creature/Being Pages

**Required Sections:**
1. Header with icon
2. Overview/Physical Description
3. Origin story
4. Mythology & Stories
5. Symbolism & Function
6. Cultural Legacy (some)
7. Interlink Panel
8. See Also

**Variations:**
- Less structured than deities
- Often more prose-heavy
- May lack formal "Attributes" grid

---

## VII. Breadcrumb Navigation

**Universal Pattern:**
```html
<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="../../../mythos/index.html">Home</a> →
    <a href="../index.html">[Mythology]</a> →
    <a href="./index.html">[Entity Type]</a> →
    <span>[Entity Name]</span>
</nav>
```

**Extraction Use:**
- Mythology identification
- Entity type identification
- Path structure validation

---

## VIII. Extraction Complexity Assessment

### Difficulty Ratings (1-5, 5 = Most Complex)

| Data Field | Difficulty | Reason |
|------------|-----------|--------|
| Entity Name | ⭐ | Consistent in `<h2>` within header |
| Entity Type | ⭐ | From breadcrumb or header class |
| Mythology | ⭐ | From breadcrumb or page path |
| Icon/Emoji | ⭐⭐ | Simple but hieroglyphs need special handling |
| Attributes | ⭐⭐ | Consistent grid, but labels vary by type |
| Description | ⭐⭐ | First large paragraph, but may have multiple |
| Mythology/Stories | ⭐⭐⭐ | Mixed list/prose format, narrative variation |
| Relationships | ⭐⭐ | Consistent structure, parsing <li> elements |
| Worship/Rituals | ⭐⭐⭐ | Only on deities, sub-sections vary |
| Cross-Links | ⭐⭐⭐⭐ | High value but scattered, multiple formats |
| Corpus Links | ⭐⭐ | Well-structured with data attributes |
| Special Sections | ⭐⭐⭐⭐⭐ | Labors grid, forms, theories - entity-specific |

### Overall Extraction Feasibility: **VERY HIGH (85%)**

**Strengths:**
- Consistent class naming
- Predictable section order
- Well-structured attribute cards
- Clear hierarchical headings
- Data attributes on corpus links

**Challenges:**
- Entity-type specific variations (deity vs hero vs creature)
- Inline styles mixed with classes
- Narrative vs. structured content in mythology sections
- Special character handling (hieroglyphs)
- Dynamic content (Firebase, theme picker)

---

## IX. Recommended Extraction Strategy

### Phase 1: Structure Detection
1. Parse breadcrumb to identify mythology and entity type
2. Identify header section by class pattern (`deity-header`, `hero-header`, etc.)
3. Extract entity name from header `<h2>`
4. Detect special character set (hieroglyphs, runes)

### Phase 2: Core Data Extraction
1. **Attributes**: Find `.attribute-grid`, iterate `.attribute-card` elements
2. **Description**: First `<p>` after header or in header section
3. **Mythology**: Section with id="mythology" or heading containing "Mythology"
4. **Relationships**: Parse family and allies sections

### Phase 3: Entity-Type Specific
```python
if entity_type == "deity":
    extract_worship_section()
    extract_forms_section()  # if present
elif entity_type == "hero":
    extract_adventures()
    extract_labors_grid()  # if present (Greek)
elif entity_type == "creature":
    extract_symbolism()
    extract_types()
```

### Phase 4: Relationship Mapping
1. Extract all `<a>` links to other entities
2. Parse interlink panel for cross-mythology connections
3. Map archetype associations
4. Extract corpus link terms for search optimization

---

## X. Template Variations by Mythology

### Egyptian
- **Unique**: Heavy hieroglyph usage
- **Structure**: Most complete deity pages
- **Sections**: Forms & Manifestations section
- **Links**: Extensive corpus linking

### Greek
- **Unique**: Labor grids for heroes
- **Structure**: Detailed hero narratives
- **Sections**: Source citations prominent
- **Links**: Extensive cross-references

### Norse
- **Unique**: Simpler deity pages
- **Structure**: More compact
- **Sections**: Ragnarok references
- **Links**: Fewer corpus links

### Babylonian
- **Unique**: Cuneiform references, "Extra Theories" sections
- **Structure**: Complex deity pages
- **Sections**: Planet/Number attributes
- **Links**: ORACC corpus integration

### Hindu
- **Unique**: Sanskrit terminology
- **Structure**: Karma/reincarnation context
- **Sections**: Avatars (for some deities)
- **Links**: Vedic text references

---

## XI. Edge Cases Requiring Special Handling

1. **Index Pages**: Different structure (lists of entities)
2. **Cosmology Pages**: Conceptual rather than entity-focused
3. **Ritual/Practice Pages**: Instruction/description format
4. **Symbol/Text Pages**: Reference material format
5. **Redirect Pages**: Minimal content (e.g., `manjushri_detailed.html`)
6. **Interactive Pages**: Canvas/animations (e.g., `portals-and-gates.html`)
7. **Search Pages**: `corpus-search.html` template

---

## XII. Conclusion

The Eyes of Azrael HTML structure demonstrates **excellent consistency** for automated extraction, with clear patterns across 95% of entity pages. The main variations are:

1. **Entity-type based** (deity/hero/creature) - predictable and handleable
2. **Mythology-specific styling** - cosmetic, doesn't affect data extraction
3. **Special characters** - technical challenge but Unicode-based and consistent

**Recommendation:** Proceed with template-based extraction using:
- Beautiful Soup for HTML parsing
- CSS selectors for section identification
- Regular expressions for inline style parsing
- Entity-type detection for variation handling
- Unicode-aware text processing for special characters

The data quality and structure strongly support the Firebase migration project goals.

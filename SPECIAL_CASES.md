# Special Cases & Edge Cases Documentation

**Phase 1.2: Data Structure Analysis - Special Cases**
**Date:** 2025-12-15

## Purpose

This document identifies edge cases, anomalies, and special handling requirements discovered during HTML structure analysis. These cases require custom logic or special attention during automated extraction.

---

## I. File Type Edge Cases

### A. Index/List Pages

**Pattern:** `*/index.html` files in entity directories

**Characteristics:**
- List multiple entities rather than single entity details
- Grid or card layout instead of detailed sections
- Shorter content, navigation-focused
- May have interactive features (deity archetype selector)

**Examples:**
```
H:\Github\EyesOfAzrael\mythos\egyptian\deities\index.html
H:\Github\EyesOfAzrael\mythos\greek\heroes\index.html
H:\Github\EyesOfAzrael\mythos\buddhist\creatures\index.html
```

**Extraction Strategy:**
- **Skip** individual entity extraction
- **Extract** for site navigation mapping
- **Use** for entity discovery/inventory

**Detection Pattern:**
```python
if file_path.endswith('/index.html'):
    extraction_type = 'navigation_index'
else:
    extraction_type = 'entity_detail'
```

---

### B. Redirect Pages

**Pattern:** Files with minimal content, meta refresh tags

**Characteristics:**
- Very short HTML
- `<meta http-equiv="refresh">` tag present
- Redirects to "detailed" or canonical version
- Often stub-level content

**Examples:**
```
H:\Github\EyesOfAzrael\mythos\buddhist\deities\avalokiteshvara_detailed.html
H:\Github\EyesOfAzrael\mythos\buddhist\deities\manjushri_detailed.html
```

**Content:**
```html
<title>🔄 Redirecting...</title>
<meta http-equiv="refresh" content="0; url=avalokiteshvara.html">
```

**Extraction Strategy:**
- **Detect** meta refresh tag
- **Log** redirect mapping
- **Skip** content extraction
- **Follow** redirect for actual content

**Detection Pattern:**
```python
if soup.find('meta', {'http-equiv': 'refresh'}):
    extraction_type = 'redirect'
    target_url = extract_redirect_url(soup)
```

---

### C. Search/Corpus Pages

**Pattern:** `corpus-search.html`, `*-search.html`

**Characteristics:**
- Interactive search interface
- JavaScript-heavy
- No entity content
- Form inputs for queries

**Examples:**
```
H:\Github\EyesOfAzrael\mythos\babylonian\corpus-search.html
H:\Github\EyesOfAzrael\mythos\buddhist\corpus-search.html
H:\Github\EyesOfAzrael\mythos\_corpus-search-template.html
```

**Extraction Strategy:**
- **Skip** entity extraction entirely
- **Document** as infrastructure/tool page
- **May extract** corpus configuration data for future use

---

### D. Interactive/Visualization Pages

**Pattern:** Pages with `<canvas>` elements, animation scripts

**Characteristics:**
- Heavy JavaScript usage
- Canvas-based graphics
- Interactive features (sliders, buttons)
- Often cosmology or diagram pages

**Examples:**
```
H:\Github\EyesOfAzrael\mythos\apocryphal\cosmology-map.html
H:\Github\EyesOfAzrael\mythos\apocryphal\portals-and-gates.html
H:\Github\EyesOfAzrael\mythos\apocryphal\enoch-visualizations.html
```

**Extraction Strategy:**
- **Extract** textual descriptions
- **Skip** canvas/interactive content
- **Note** special feature flag in metadata
- **Preserve** page classification for Firebase

**Detection Pattern:**
```python
if soup.find('canvas') or 'interactive' in file_features:
    extraction_type = 'interactive_visualization'
    extract_text_only = True
```

---

## II. Content Structure Anomalies

### A. "Author's Theories" Sections

**Location:** Egyptian deity pages (e.g., Ra)

**Characteristics:**
- Clearly marked as **speculative**
- Purple/alternative styling
- `<details>` expandable element
- Link to separate theory page

**Example Structure:**
```html
<section style="...">
    <details style="background: rgba(147, 51, 234, 0.1); ...">
        <summary>💡 Author's Theories & Extended Analysis</summary>
        <div style="...">
            <p>The author has developed extensive theories connecting Ra's mythology
               to scientific concepts, particularly Radium-228 (²²⁸Ra)...</p>
            <p><strong>⚠️ Please Note:</strong> These are <em>speculative personal theories</em>...</p>
            <a href="../../../theories/user-submissions/egyptian-scientific-encoding.html">
                📖 Read Full Theory & Analysis →
            </a>
        </div>
    </details>
</section>
```

**Extraction Strategy:**
- **Flag** as "author_theories" metadata
- **Extract** summary and link
- **Mark** content as speculative
- **Do not** merge with canonical mythology data

**Firebase Handling:**
- Store in separate `theories` subcollection
- Link to entity but don't include in main entity doc
- Flag for user preference filtering

---

### B. "Extra Theories" Sections (Babylonian)

**Location:** Babylonian deity pages (e.g., Marduk, Tiamat)

**Characteristics:**
- Section class: `extra-theories`
- Multiple theory cards
- Attributed to external sources (Sitchin, Farrell)
- Academic disclaimer included

**Example Structure:**
```html
<section class="extra-theories glass-card" style="...">
    <h2>🔬 Extra Theories: Marduk as Nibiru</h2>
    <p style="font-style: italic;">Alternative interpretations propose that...</p>

    <div class="theory-card" style="...">
        <h3>🪐 Marduk as Planet Nibiru</h3>
        <p><strong>Primary Proponent:</strong> Zecharia Sitchin</p>
        <p><strong>Key Works:</strong> <em>The 12th Planet</em>...</p>
        <h4>The Theory</h4>
        <ul>...</ul>
    </div>

    <div style="...">
        <h4>⚠️ Academic Perspective</h4>
        <p>Mainstream Assyriology views...</p>
        <p><strong>These alternative theories are presented for exploration, not as established fact.</strong></p>
    </div>
</section>
```

**Extraction Strategy:**
- **Detect** `.extra-theories` class
- **Extract** as separate data structure
- **Include** proponent, sources, disclaimers
- **Flag** in metadata as alternative_interpretation

**Handling:**
```json
{
  "alternative_theories": [
    {
      "title": "Marduk as Planet Nibiru",
      "proponent": "Zecharia Sitchin",
      "sources": ["The 12th Planet", "The Cosmic Code"],
      "content": "...",
      "disclaimer": "Academic perspective differs..."
    }
  ]
}
```

---

### C. Labor/Task Grids (Greek Heroes)

**Location:** Greek hero pages (Heracles, etc.)

**Characteristics:**
- `.labors-grid` class
- Numbered cards (1-12 for Heracles)
- `.labor-card` elements
- `.labor-number`, `.labor-title`, `.labor-desc`

**Example Structure:**
```html
<div class="labors-grid">
    <div class="labor-card">
        <span class="labor-number">1</span>
        <span class="labor-title">The Nemean Lion</span>
        <p class="labor-desc">Slew the invulnerable lion whose golden fur...</p>
    </div>
    <!-- More labor cards -->
</div>
```

**Extraction Strategy:**
- **Detect** `.labors-grid` presence
- **Extract** as structured array
- **Preserve** numbering
- **Store** as separate field: `labors: []`

**Firebase Structure:**
```json
{
  "labors": [
    {
      "number": 1,
      "title": "The Nemean Lion",
      "description": "Slew the invulnerable lion..."
    }
  ]
}
```

---

### D. Forms & Manifestations (Egyptian)

**Location:** Egyptian deity pages (Ra, etc.)

**Characteristics:**
- Section ID: `#forms`
- Grid of manifestation cards
- Time-based forms (morning, noon, evening, night)
- Syncretic forms (Amun-Ra, etc.)

**Example Structure:**
```html
<section id="forms" style="...">
    <h2>Forms and Manifestations</h2>
    <div style="display: grid; ...">
        <div style="...">
            <strong>Khepri (Morning)</strong>
            <p>Scarab beetle form, the rising sun...</p>
        </div>
        <div style="...">
            <strong>Ra-Horakhty (Noon)</strong>
            <p>Falcon-headed form, "Ra, Horus of the Horizon"...</p>
        </div>
    </div>
</section>
```

**Extraction Strategy:**
- **Detect** section with "Forms" heading
- **Extract** each manifestation
- **Parse** time/context from headings
- **Store** as array

**Firebase Structure:**
```json
{
  "forms": [
    {
      "name": "Khepri",
      "context": "Morning",
      "description": "Scarab beetle form, the rising sun..."
    }
  ]
}
```

---

## III. Special Character Handling

### A. Egyptian Hieroglyphs

**Unicode Blocks:**
- Egyptian Hieroglyphs: U+13000–U+1342F
- Egyptian Hieroglyph Format Controls: U+13430–U+1343F

**Font Requirements:**
```css
font-family: 'Segoe UI Historic', 'Noto Sans Egyptian Hieroglyphs', serif;
```

**Locations:**
- Entity icons
- Inline in names/titles
- Occasionally in body text

**Examples:**
- Ra: 𓇳𓏺
- Ankh symbol references
- Transliterations: rꜥ, mꜣꜥt

**Extraction Challenges:**
1. **Rendering:** Not all systems have hieroglyph fonts
2. **Storage:** UTF-8 encoding required
3. **Display:** Firebase/web app must support Unicode
4. **Search:** May need transliteration index

**Handling Strategy:**
```python
def extract_hieroglyphs(element):
    """Extract hieroglyph text with metadata"""
    hieroglyph_span = element.find('span', style=re.compile(r'Segoe UI Historic|Noto Sans Egyptian'))
    if hieroglyph_span:
        return {
            'text': hieroglyph_span.get_text(),
            'encoding': 'unicode_hieroglyphs',
            'font_required': 'Noto Sans Egyptian Hieroglyphs',
            'fallback_available': False  # May need emoji fallback
        }
```

**Firebase Storage:**
```json
{
  "icon": {
    "display": "𓇳𓏺",
    "type": "hieroglyph",
    "fallback": "☀️",
    "unicode_block": "U+13000-U+1342F"
  }
}
```

---

### B. Transliterations

**Pattern:** Italic spans with special diacritics

**Examples:**
- Egyptian: rꜥ, mꜣꜥt, ḏḥwty
- Sanskrit: ṛ, ṣ, ṭ, ḍ

**Location:** Usually in parentheses after main name

**Example:**
```html
<h2>Ra (Re, Atum-Ra) <span style="font-size: 1.2rem; opacity: 0.8; font-style: italic;">– rꜥ</span></h2>
```

**Extraction Strategy:**
- **Preserve** exact Unicode characters
- **Store** as separate field: `transliteration`
- **Index** for search purposes

---

### C. Cuneiform References (Babylonian)

**Status:** Mentioned but not directly embedded (unlike hieroglyphs)

**Location:** Corpus search references, text descriptions

**Example:**
```html
<p>Search the ORACC corpus to explore original Akkadian texts mentioning Marduk.</p>
<a href="../corpus-search.html?term=marduk&language=akkadian">
    🔍 Search "Marduk" in Cuneiform Corpus →
</a>
```

**Handling:**
- **Extract** corpus search links
- **Note** language parameter (Akkadian)
- **Don't** expect embedded cuneiform (external corpus)

---

## IV. Link Anomalies

### A. Nested Corpus Links

**Issue:** Links within links, confusing href extraction

**Example:**
```html
<h1><a class="corpus-link" data-term="Ra" href="../corpus-search.html?term=ra">
    Ra
</a></h1>
```

**Problem:** BeautifulSoup may extract inner or outer link

**Solution:**
```python
def extract_corpus_link_data(element):
    """Extract corpus link data, handling nesting"""
    corpus_link = element.find('a', class_='corpus-link')
    if corpus_link:
        return {
            'term': corpus_link.get('data-term'),
            'tradition': corpus_link.get('data-tradition'),
            'display_text': corpus_link.get_text(strip=True)
        }
    return None
```

---

### B. Smart Links

**Pattern:** Links with `data-smart` attribute

**Purpose:** JavaScript-enhanced linking behavior

**Example:**
```html
<a href="apollo.html" data-smart data-term="Apollo">Apollo</a>
```

**Extraction:**
- **Preserve** data attributes
- **Note** smart link capability
- **Extract** as regular link for static migration

---

### C. Relative Path Variations

**Patterns Observed:**
```
../deities/name.html                    (same mythology, entity list to entity)
../../mythology/deities/name.html       (cross-mythology)
../../../archetypes/type/index.html     (to archetype pages)
../cosmology/concept.html               (within mythology)
./index.html                            (to current directory index)
index.html                              (to current directory index)
```

**Firebase Migration Challenge:**
- Need to convert relative to absolute or Firebase paths
- Preserve link structure for navigation

**Solution:**
```python
def resolve_relative_path(current_file, link_href):
    """Convert relative path to absolute for Firebase"""
    # Calculate absolute path from current file and link
    # Return Firebase-compatible path
    pass
```

---

## V. Content Completeness Variations

### A. Stub Pages

**Characteristics:**
- Very short content (< 500 words)
- Missing major sections
- Often just Overview + See Also
- Inventory marks as "stub"

**Example:**
```
H:\Github\EyesOfAzrael\mythos\buddhist\deities\yamantaka.html
```

**Content:**
```html
<section class="hero-section">
    <div class="hero-icon-display">⚔️</div>
    <h2>Yamantaka</h2>
    <p class="hero-description">[Brief description - 140 chars]</p>
</section>

<section>
    <!-- No detailed content -->
</section>
```

**Extraction Strategy:**
- **Extract** available fields
- **Flag** as `completeness: stub`
- **Score** < 25 on completeness scale
- **Priority** for future content development

---

### B. Partial Pages

**Characteristics:**
- Has 2-4 major sections
- Missing worship/rituals or relationships
- 500-1500 words
- Inventory marks as "partial"

**Extraction Strategy:**
- **Extract** all present sections
- **Score** 25-75 on completeness
- **Note** missing sections in metadata

---

### C. Complete Pages

**Characteristics:**
- All expected sections present
- 1500+ words
- Multiple myths/stories
- Full relationship data
- Inventory marks as "complete"

**Extraction Strategy:**
- **Extract** all sections
- **Score** 75-100 on completeness
- **High quality** flag

---

## VI. Mythology-Specific Quirks

### A. Egyptian

**Special Features:**
1. **Hieroglyphs everywhere** - headers, icons, inline text
2. **Forms sections** - time-based manifestations common
3. **Syncretic deities** - multiple merged forms (Amun-Ra, etc.)
4. **Author theories** - scientific reinterpretations
5. **Extensive corpus linking** - heavy use of corpus-search

**Extraction Priorities:**
- Preserve hieroglyphs with fallbacks
- Extract all forms/manifestations
- Separate canonical from speculative content

---

### B. Greek

**Special Features:**
1. **Hero labor grids** - numbered task cards
2. **Extensive source citations** - ancient literature heavily referenced
3. **Roman parallels** - often cross-referenced
4. **Detailed narratives** - longer prose sections

**Extraction Priorities:**
- Parse labor grids as structured data
- Extract source citations carefully
- Map Greek-Roman deity equivalents

---

### C. Norse

**Special Features:**
1. **Simpler structure** - fewer sections per page
2. **Ragnarok connections** - end-times prophecy common
3. **Compact pages** - shorter content overall
4. **Rune potential** - not in samples, but documented

**Extraction Priorities:**
- Handle briefer content gracefully
- Extract Ragnarok role references
- Prepare for runic characters (future)

---

### D. Babylonian

**Special Features:**
1. **Extra theories sections** - ancient astronaut theories
2. **Cuneiform references** - ORACC corpus links
3. **Planet/Number attributes** - astrological associations
4. **Academic disclaimers** - clear marking of speculation

**Extraction Priorities:**
- Separate theories from canonical content
- Extract corpus search configurations
- Preserve planet/number metadata

---

### E. Hindu/Buddhist

**Special Features:**
1. **Sanskrit terminology** - heavy use of transliterated terms
2. **Karma/reincarnation context** - theological framework
3. **Avatar sections** - multiple forms for Vishnu, etc.
4. **Vedic text references** - ancient scripture citations

**Extraction Priorities:**
- Preserve Sanskrit diacritics
- Extract avatar/form variations
- Map scripture references

---

## VII. Firebase Migration Specific Concerns

### A. File Paths to Document IDs

**Challenge:** Convert file paths to Firestore document IDs

**Current:**
```
H:\Github\EyesOfAzrael\mythos\egyptian\deities\ra.html
```

**Firebase:**
```
/mythologies/egyptian/entities/ra
```

**Strategy:**
```python
def path_to_doc_id(file_path):
    """Convert file path to Firebase document ID"""
    # Remove extension
    # Extract mythology, entity_type, entity_name
    # Create hierarchical path
    pass
```

---

### B. Relative Links to References

**Challenge:** HTML relative links won't work in Firebase

**Options:**
1. **Convert to absolute paths** - Full URLs
2. **Convert to Firebase refs** - `/mythologies/egyptian/entities/osiris`
3. **Store both** - Original href + Firebase ref

**Recommended:**
```json
{
  "links": [
    {
      "text": "Osiris",
      "original_href": "../deities/osiris.html",
      "firebase_ref": "/mythologies/egyptian/entities/osiris",
      "entity_id": "osiris",
      "mythology": "egyptian",
      "type": "deity"
    }
  ]
}
```

---

### C. Embedded Styles to Theme System

**Challenge:** Inline styles throughout HTML

**Current:**
```html
<h2 style="color: var(--mythos-primary);">Attributes</h2>
```

**Firebase Strategy:**
- **Extract** color values to entity metadata
- **Remove** inline styles in stored HTML
- **Apply** colors dynamically in web app

```json
{
  "theme": {
    "primary_color": "#CD853F",
    "secondary_color": "#DAA520"
  }
}
```

---

### D. Large HTML Content

**Challenge:** Some entity pages are 50-90KB

**Firestore Limits:**
- Max document size: 1MB
- Max field size: 1MB

**Strategy:**
- **Split** large sections into subcollections
- **Store** full HTML separately if needed
- **Use** Cloud Storage for archived full pages

```
/mythologies/egyptian/entities/ra/
  - main (document - core data)
  - sections/mythology (subcollection)
  - sections/worship (subcollection)
  - fullpage (Cloud Storage reference)
```

---

## VIII. Extraction Error Scenarios

### A. Missing Required Fields

**Scenario:** Entity name or type not extractable

**Cause:**
- Malformed HTML
- Unexpected structure
- Corrupt file

**Handling:**
```python
if not entity_name or not entity_type:
    log_error(f"Missing required fields: {file_path}")
    return {
        'status': 'extraction_failed',
        'error': 'missing_required_fields',
        'file': file_path
    }
```

---

### B. Character Encoding Issues

**Scenario:** Special characters display as �

**Cause:**
- Wrong encoding assumption
- Byte order mark (BOM) issues
- Mixed encodings

**Handling:**
```python
def robust_file_read(file_path):
    """Try multiple encodings"""
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1']:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise Exception(f"Cannot decode {file_path}")
```

---

### C. Infinite Nesting in Links

**Scenario:** Circular or deeply nested link structures

**Cause:** Page editing errors, template issues

**Handling:**
```python
def extract_links(element, depth=0, max_depth=5):
    """Prevent infinite recursion"""
    if depth > max_depth:
        log_warning("Max link depth exceeded")
        return []
    # Extract links with depth limiting
```

---

## IX. Testing Requirements

### Test Cases Needed

1. **Standard deity page** (Egyptian Ra)
2. **Standard hero page** (Greek Heracles)
3. **Standard creature page** (Egyptian Sphinx)
4. **Stub page** (Buddhist Yamantaka)
5. **Page with hieroglyphs** (Egyptian any)
6. **Page with labor grid** (Greek Heracles)
7. **Page with theories** (Egyptian Ra, Babylonian Marduk)
8. **Page with forms section** (Egyptian Ra)
9. **Index/list page** (Any mythology index.html)
10. **Redirect page** (Buddhist manjushri_detailed.html)
11. **Interactive page** (Apocryphal cosmology-map.html)
12. **Corpus search page** (Babylonian corpus-search.html)

### Validation Checks

```python
def validate_extraction(extracted_data):
    """Validate extracted entity data"""
    checks = {
        'has_name': bool(extracted_data.get('name')),
        'has_type': extracted_data.get('type') in VALID_TYPES,
        'has_mythology': extracted_data.get('mythology') in VALID_MYTHOLOGIES,
        'has_description': len(extracted_data.get('description', '')) > 50,
        'completeness_valid': 0 <= extracted_data.get('completeness_score', 0) <= 100,
        'links_valid': all(validate_link(l) for l in extracted_data.get('links', []))
    }
    return all(checks.values()), checks
```

---

## X. Priority Handling Order

### Extraction Priority

1. **Required Fields** (name, type, mythology, description)
2. **Attributes** (domains, symbols, etc.)
3. **Mythology/Stories** (main content)
4. **Relationships** (family, allies)
5. **Type-specific sections** (worship, labors, etc.)
6. **Interlinks** (cross-references, archetypes)
7. **See Also** (navigation)
8. **Special content** (theories, forms)

### Error Recovery Strategy

```python
def extract_with_fallbacks(file_path):
    """Extract with graceful degradation"""
    data = {
        'metadata': {'extraction_warnings': []}
    }

    try:
        data['name'] = extract_name(soup)
    except Exception as e:
        data['name'] = extract_name_fallback(soup, file_path)
        data['metadata']['extraction_warnings'].append(f"Name extraction fallback used: {e}")

    # Continue with other fields even if some fail
    # Always return valid JSON, even if partially extracted
```

---

## XI. Summary

**Total Special Cases Identified:** 30+

**Critical for Handling:**
1. Egyptian hieroglyphs (encoding, fonts, fallbacks)
2. Greek hero labor grids (structured data)
3. Theory sections (separate from canonical)
4. Index vs. detail pages (different templates)
5. Redirect pages (skip or follow)
6. Character encoding (UTF-8 required)

**Recommended Approach:**
- **Detect** page type before extraction
- **Use** entity-type specific templates
- **Preserve** special characters with fallbacks
- **Separate** canonical from speculative content
- **Log** all warnings/errors
- **Continue** extraction even if sections fail
- **Score** completeness for prioritization

This systematic handling of edge cases will ensure robust extraction across the entire site (2000+ pages) with minimal manual intervention required.

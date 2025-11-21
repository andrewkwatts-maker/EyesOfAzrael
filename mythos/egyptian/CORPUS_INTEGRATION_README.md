# Egyptian Mythology Corpus Search Integration

## Overview

This integration connects Egyptian deity pages to the Ancient Egyptian Dictionary (AED-TEI) corpus, allowing users to explore ancient Egyptian texts that mention the gods and concepts they're reading about.

## Implementation Approach

### Architecture: Static JSON Index

We chose a **static JSON index** approach rather than a live backend API for the following reasons:

1. **Simplicity**: No server infrastructure required
2. **Performance**: Instant search results without database queries
3. **Reliability**: No backend downtime or API dependencies
4. **Portability**: Works with static file hosting (GitHub Pages, etc.)

### Files Created

#### 1. Corpus Search Page
- **Location**: `H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\egyptian\corpus-search.html`
- **Purpose**: Display search results for Egyptian deity names and concepts
- **Features**:
  - URL parameter-based search (`?term=osiris`)
  - Egyptian-themed glass-morphism design
  - Expandable result cards with:
    - Text name and ID
    - Citation (source text reference)
    - Egyptian transliteration excerpt with highlighted search terms
    - German translation
    - Metadata (date range, text type, source book)
    - Link to TLA (Thesaurus Linguae Aegyptiae) database
  - Suggested search links for common deities
  - New search input for exploring related terms

#### 2. Static JSON Index
- **Location**: `H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\egyptian\corpus-index.json`
- **Format**:
  ```json
  {
    "deity_name": [
      {
        "text_id": "...",
        "text_name": "...",
        "citation": "...",
        "context": "...",
        "translation": "...",
        "metadata": {...},
        "url": "..."
      }
    ]
  }
  ```
- **Current Status**: Contains **demo data** for 11 search terms
- **Indexed Terms**: ra, re, osiris, isis, horus, anubis, thoth, maat, duat, ankh, neith

#### 3. Index Generator Script
- **Location**: `H:\DaedalusSVN\PlayTow\EOAPlot\aed-tei-interface\generate_egyptian_index.py`
- **Purpose**: Generate static JSON index from AED-TEI corpus
- **Status**: Script is complete but needs corpus data investigation (see Limitations)

#### 4. Updated Deity Pages
The following deity pages now have inline corpus search links:
- `H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\egyptian\deities\osiris.html`
- `H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\egyptian\deities\isis.html`
- `H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\egyptian\deities\ra.html`
- `H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\egyptian\deities\neith.html`

**Linked Terms**: deity names (Osiris, Isis, Ra, Set, Horus, Anubis, Thoth, Ma'at), key concepts (Duat, ankh, djed, was)

## User Experience

### From Deity Pages
1. User reads about Osiris on the deity page
2. Clicks on highlighted links like "Osiris", "Duat", "Ma'at"
3. Taken to corpus search page showing ancient texts mentioning that term
4. Can explore actual Egyptian texts, see translations, and click through to TLA database

### Direct Search
1. User navigates to `corpus-search.html?term=<searchTerm>`
2. Results load instantly from JSON index
3. Can search for new terms using the search box
4. Suggested searches help discover related concepts

## Current Limitations & Future Work

### Limitation 1: Demo Data Only

**Current State**: The `corpus-index.json` contains **demo/mock data** rather than real corpus search results.

**Why**:
- The AED-TEI corpus contains 11,000+ texts in **hieroglyphic transliteration** format
- Deity names are in **ancient Egyptian** (e.g., "Wsjr" for Osiris, "Ꜣs.t" for Isis)
- English names like "Osiris" don't appear in the transliterated Egyptian texts
- German translations exist but weren't loading during initial testing (XML parsing issue)

**Example**:
- Searching for "Osiris" (English) returns 0 results in actual corpus
- Need to search for "Wsjr" or other Egyptian spellings
- But users expect to search for "Osiris", not Egyptian transliterations

**Solution Options**:

1. **Name Mapping Approach** (Recommended):
   - Create a mapping file: `{"Osiris": ["Wsjr", "Wsir", "Osiris"], ...}`
   - When user searches "Osiris", search corpus for all Egyptian variants
   - Update `generate_egyptian_index.py` to use this mapping

2. **Translation Layer**:
   - Fix German translation parsing in `AedTeiInterface.py`
   - Search German translations for deity names
   - Requires investigating XML entity handling (&#039; etc.)

3. **Hybrid Approach**:
   - Search both Egyptian transliterations AND German translations
   - Aggregate results from both sources

### Limitation 2: Translation Parsing

**Issue**: The AED-TEI interface loads 0 translations despite 13,949 `*_st.xml` files being present.

**Investigation Needed**:
- German translations exist in `<s xml:lang="de">` elements
- May need to handle XML entities (&#039; for apostrophe, etc.)
- XPath query in `AedTeiInterface.py` line 133 may need adjustment

**To Fix**:
1. Examine sample `*_st.xml` files more closely
2. Verify XPath namespace handling
3. Test with sample file to ensure extraction works
4. May need to decode XML entities: `html.unescape()` or similar

### Limitation 3: Search Performance

**Current**: Small demo index (< 1 KB) loads instantly

**At Scale**:
- 50 terms × 50 results × ~1KB each = ~2.5 MB JSON file
- Still acceptable for static hosting
- May want to implement:
  - Lazy loading (only load results for searched term)
  - Compression (gzip)
  - Separate JSON files per term

### Limitation 4: Limited Coverage

**Currently Indexed**: 11 terms (ra, osiris, isis, horus, anubis, thoth, maat, duat, ankh, neith)

**Should Index**: 50+ terms including:
- All major deities (30+)
- Key concepts (ka, ba, ankh, djed, was, duat)
- Common words (ntr/god, nsw/king, htp/offering)
- Place names (Abydos, Heliopolis)

## Next Steps to Complete Implementation

### Step 1: Investigate Transliteration Patterns
```bash
# Examine actual Egyptian spellings in corpus
cd H:\DaedalusSVN\PlayTow\EOAPlot\aed-tei\files
grep -r "Wsjr" *.xml | head -5  # Check for Osiris variants
grep -r "Ꜣs.t" *.xml | head -5  # Check for Isis variants
```

### Step 2: Create Deity Name Mapping
```python
# deity_name_mapping.json
{
  "ra": ["Rꜥ", "Rꜥw", "Ra", "Re"],
  "osiris": ["Wsjr", "Wsir", "Asar"],
  "isis": ["Ꜣs.t", "Aset", "Iset"],
  # ... etc
}
```

### Step 3: Fix Translation Parsing
- Debug `AedTeiInterface.py` line 133
- Test with sample `*_st.xml` file
- Handle XML entities properly

### Step 4: Generate Real Index
```bash
cd H:\DaedalusSVN\PlayTow\EOAPlot\aed-tei-interface
python generate_egyptian_index.py
```

### Step 5: Test & Validate
- Search for each indexed term
- Verify results are relevant
- Check translations appear correctly
- Validate TLA URLs work

## API Reference

### URL Parameters

**corpus-search.html**:
- `?term=<searchTerm>` - Search term (case-insensitive)
- Example: `corpus-search.html?term=osiris`

### JSON Index Structure

```json
{
  "search_term_lowercase": [
    {
      "text_id": "UNIQUE_ID",           // 26-char AED identifier
      "text_name": "Text Title",         // Modern title
      "citation": "Source Reference",    // e.g., "Pyramid Text 217"
      "context": "...excerpt...",        // Context with search term
      "full_verse": "Full passage",      // Complete text (truncated to 500 chars)
      "translation": "German translation", // German translation (if available)
      "language": "egyptian",            // Language of primary text
      "metadata": {
        "date_earliest": "-2400",       // BCE year (negative)
        "date_latest": "-2300",
        "text_type": "Hymne",           // German text type
        "book": "Pyramid Texts"          // Source collection
      },
      "url": "https://aaew.bbaw.de/tla/..."  // Link to TLA database
    }
  ]
}
```

## Technical Details

### Corpus Information
- **Name**: Ancient Egyptian Dictionary (AED-TEI)
- **Size**: 11,000+ texts, 13,750 loaded by interface
- **Format**: TEI XML with stand-off annotation
- **Languages**: Egyptian (transliterated), German (translations)
- **Time Period**: Old Kingdom through Greco-Roman period
- **License**: CC-BY-SA 4.0
- **Source**: [Thesaurus Linguae Aegyptiae](https://aaew.bbaw.de/tla/)

### File Structure
```
aed-tei/
├── concordance_name_text_id.csv    # Maps names to IDs
├── dictionary.xml                  # 30,000+ word entries
├── thesaurus.xml                   # Controlled vocabulary
└── files/
    ├── [ID].xml                    # Base text (transliteration)
    ├── [ID]_st.xml                 # Sentence translations (German)
    ├── [ID]_wt.xml                 # Word translations
    └── [ID]_hiero.xml              # Hieroglyphic encoding
```

### Dependencies
- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Backend**: Python 3.x (for index generation)
  - `lxml` - XML parsing
  - `AedTeiInterface` - Corpus interface (already implemented)

## Testing

### Manual Test Cases

1. **Search for Osiris**:
   - Navigate to `corpus-search.html?term=osiris`
   - Verify 2 demo results appear
   - Check German translations display
   - Click TLA link (should open in new tab)

2. **Search from Deity Page**:
   - Open `deities/osiris.html`
   - Click "Osiris" link in header
   - Verify redirects to search page with results

3. **New Search**:
   - On corpus search page, type "isis" and press Enter
   - Verify results update

4. **No Results**:
   - Search for "xyz123" (non-existent term)
   - Verify "No Results Found" message appears

5. **Suggested Searches**:
   - Click suggested search links
   - Verify each one loads appropriate results

## Maintenance

### Adding New Search Terms

1. Edit `generate_egyptian_index.py`:
   ```python
   SEARCH_TERMS = [
       # Add new deity or concept
       'Ptah', 'Sekhmet', 'Nephthys',
       # ...
   ]
   ```

2. Add to name mapping (once implemented):
   ```json
   {
     "ptah": ["Ptḥ", "Ptah"],
     "sekhmet": ["Sḫm.t", "Sekhmet"]
   }
   ```

3. Regenerate index:
   ```bash
   python generate_egyptian_index.py
   ```

4. Add to suggested searches in `corpus-search.html`:
   ```html
   <a href="?term=ptah">Ptah</a>
   ```

### Updating Deity Pages

To add corpus links to a deity page:

```html
<!-- Link deity names and concepts -->
<a href="../corpus-search.html?term=osiris">Osiris</a>
<a href="../corpus-search.html?term=duat">Duat</a>
<a href="../corpus-search.html?term=ankh">ankh</a>
```

Keep links contextual - only link the first or most significant mentions.

## Summary

**What Works**:
- ✅ Corpus search page with Egyptian-themed design
- ✅ Static JSON index architecture
- ✅ Deity page integration with inline links
- ✅ Demo data for testing UI/UX
- ✅ Index generator script framework

**What Needs Work**:
- ❌ Real corpus data (currently demo/mock data)
- ❌ Egyptian name to English name mapping
- ❌ German translation parsing fix
- ❌ Comprehensive search term coverage (50+ terms)

**Estimated Time to Complete**:
- Name mapping: 2-3 hours
- Translation parsing fix: 1-2 hours
- Index generation: 30 minutes (once above working)
- Testing & validation: 1-2 hours
- **Total: 5-8 hours**

The foundation is solid, but corpus data integration needs additional investigation into Egyptian transliteration patterns and translation XML parsing.

# HTML to JSON Extraction Script Documentation

**Version:** 1.0.0
**Date:** 2025-12-15
**Author:** Eyes of Azrael Migration Team

## Overview

The `html-to-json-extractor.py` script is a robust Python tool that extracts structured entity data from HTML files and converts them to JSON format matching the universal entity schema v2.0. This script is a critical component of the Firebase migration project.

## Features

### Core Capabilities

- **Multi-format Input**: Single file, directory, or mythology-based extraction
- **Intelligent Detection**: Automatically detects entity type, mythology, and page structure
- **Template-Based Parsing**: Uses `extraction-templates.json` for consistent extraction patterns
- **Special Character Support**: Preserves Egyptian hieroglyphs, Sanskrit diacritics, and other Unicode characters
- **Edge Case Handling**: Gracefully handles stubs, redirects, index pages, and special sections
- **Quality Scoring**: Calculates completeness score (0-100) for each extraction
- **Error Recovery**: Continues extraction even if sections fail, logs warnings
- **Validation**: Built-in validation of required fields and data types

### Extracted Data

#### Universal Fields
- `id` - Generated kebab-case identifier
- `type` - Entity type (deity, hero, creature, etc.)
- `name` - Primary entity name
- `mythology` - Primary mythology
- `icon` - Emoji or hieroglyph with metadata
- `subtitle` - Title/epithet
- `description` - Full HTML description
- `colors` - Mythology-specific theme colors

#### Deity-Specific
- `attributes` - Titles, domains, symbols, sacred animals/plants
- `mythology_stories` - Key myths, narratives, sources
- `relationships` - Family, allies, enemies
- `worship` - Sacred sites, festivals, offerings, prayers
- `forms` - Manifestations (Egyptian deities)
- `alternative_theories` - Author theories, speculative content

#### Hero-Specific
- `labors` - Numbered task grid (Greek heroes like Heracles)
- `adventures` - Narrative structure with sections
- `mythology_stories` - Birth, quest, death narratives

#### Creature-Specific
- `mythology_stories` - Origin, symbolism, types
- `attributes` - Physical features, types

#### Common to All
- `interlinks` - Archetypes, cross-cultural parallels
- `see_also` - Related entity links
- `links` - Internal, external, and corpus links
- `extraction_metadata` - Source file, timestamp, completeness score, warnings

## Installation

### Requirements

```bash
pip install beautifulsoup4
```

**Python Version:** 3.7+

### Files Needed

Place these files in your project root:

1. `scripts/html-to-json-extractor.py` - Main extraction script
2. `extraction-templates.json` - Extraction patterns and templates
3. `STRUCTURE_PATTERNS.md` - HTML structure documentation
4. `SPECIAL_CASES.md` - Edge cases and special handling

## Usage

### Command Line Interface

#### 1. Extract Single File

```bash
python scripts/html-to-json-extractor.py input.html output.json
```

**Example:**
```bash
python scripts/html-to-json-extractor.py mythos/greek/deities/zeus.html extracted/zeus.json
```

**Output:**
```
Extracting: mythos/greek/deities/zeus.html
Output: extracted/zeus.json
Completeness: 87%
```

#### 2. Extract Directory

```bash
python scripts/html-to-json-extractor.py --dir INPUT_DIR --output OUTPUT_DIR
```

**Example:**
```bash
python scripts/html-to-json-extractor.py --dir mythos/greek/deities/ --output extracted/greek/
```

**Output:**
```
Found 25 HTML files in mythos/greek/deities/
Extracting: mythos/greek/deities/zeus.html
Output: extracted/greek/zeus.json
Completeness: 87%

Extracting: mythos/greek/deities/hera.html
Output: extracted/greek/hera.json
Completeness: 82%

...

Extraction complete!
Success: 23
Skipped: 1
Failed: 1
```

#### 3. Extract by Mythology

```bash
python scripts/html-to-json-extractor.py --mythology MYTHOLOGY --output OUTPUT_DIR
```

**Example:**
```bash
python scripts/html-to-json-extractor.py --mythology egyptian --output extracted/
```

This will extract all entities from `mythos/egyptian/` including deities, heroes, creatures, etc.

#### 4. Extract All Mythologies

```bash
python scripts/html-to-json-extractor.py --all --output extracted/
```

**Warning:** This processes ALL mythologies (can be 2000+ files). Use with caution.

### Python API

You can also use the extractor programmatically:

```python
from html_to_json_extractor import HTMLToJSONExtractor

# Initialize extractor
extractor = HTMLToJSONExtractor("extraction-templates.json")

# Extract single file
result = extractor.extract_from_file("mythos/greek/deities/zeus.html")

# Access data
print(f"Name: {result['name']}")
print(f"Type: {result['type']}")
print(f"Mythology: {result['mythology']}")
print(f"Completeness: {result['extraction_metadata']['completeness_score']}%")

# Save to JSON
import json
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
```

## Output Format

### Successful Extraction

```json
{
  "id": "zeus",
  "type": "deity",
  "name": "Zeus",
  "mythology": "greek",
  "icon": "⚡",
  "subtitle": "King of the Gods",
  "description": "<p>Zeus is the supreme god of Mount Olympus...</p>",
  "colors": {
    "primary": "#DAA520",
    "secondary": "#FFD700"
  },
  "attributes": {
    "titles": "King of the Gods, Lord of the Sky",
    "domains": "Sky, thunder, lightning, law, order",
    "symbols": "Thunderbolt, eagle, oak tree",
    "sacredAnimals": "Eagle, bull",
    "sacredPlants": "Oak tree"
  },
  "mythology_stories": {
    "intro": "<p>Zeus is the youngest son of Cronus and Rhea...</p>",
    "key_myths": [
      {
        "title": "Overthrow of the Titans",
        "summary": "Zeus led the Olympians in the Titanomachy..."
      }
    ],
    "sources": "Hesiod's Theogony, Homer's Iliad"
  },
  "relationships": {
    "family": {
      "parents": "Cronus and Rhea",
      "consorts": "Hera (wife), numerous affairs",
      "children": "Athena, Apollo, Artemis, Hermes..."
    },
    "allies_enemies": {
      "allies": "Athena, Apollo, other Olympians",
      "enemies": "Titans, Typhon"
    }
  },
  "interlinks": {
    "archetype": {
      "name": "⚡ Sky Father",
      "description": "Supreme ruler deity associated with sky and thunder",
      "url": "../../../archetypes/sky-father/index.html"
    },
    "cross_cultural_parallels": [
      {
        "name": "Jupiter",
        "mythology": "Roman",
        "flag": "🏛️",
        "url": "../../roman/deities/jupiter.html"
      }
    ]
  },
  "see_also": [
    {
      "icon": "👑",
      "name": "Hera",
      "url": "../deities/hera.html"
    }
  ],
  "links": {
    "internal": [...],
    "external": [...],
    "corpus": [...]
  },
  "extraction_metadata": {
    "source_file": "mythos/greek/deities/zeus.html",
    "extracted_at": "2025-12-15T10:30:00Z",
    "extractor_version": "1.0.0",
    "completeness_score": 87,
    "warnings": []
  }
}
```

### Skipped Pages

```json
{
  "status": "skipped",
  "page_type": "index",
  "reason": "Not an entity detail page (type: index)"
}
```

### Failed Extraction

```json
{
  "status": "extraction_failed",
  "error": "Cannot decode file: mythos/example.html",
  "file": "mythos/example.html",
  "warnings": []
}
```

## Completeness Scoring

The script calculates a completeness score (0-100) based on:

| Component | Points | Details |
|-----------|--------|---------|
| **Core Fields** | 40 | Name (10), Type (10), Mythology (10), Description (10) |
| **Attributes** | 20 | 3 points per attribute, max 20 |
| **Mythology Section** | 25 | Intro (10), Key Myths (15) |
| **Relationships** | 15 | Family (10), Allies/Enemies (5) |

**Score Interpretation:**
- **90-100**: Complete - All major sections present
- **70-89**: Good - Most sections present, minor gaps
- **50-69**: Partial - Several sections missing
- **25-49**: Stub - Minimal content
- **0-24**: Incomplete - Major data missing

## Special Character Handling

### Egyptian Hieroglyphs

The script preserves Egyptian hieroglyphs with metadata:

```json
{
  "icon": {
    "display": "𓇳𓏺",
    "type": "hieroglyph",
    "font_required": "Noto Sans Egyptian Hieroglyphs"
  }
}
```

**Fonts Detected:**
- Segoe UI Historic
- Noto Sans Egyptian Hieroglyphs

### Transliterations

Italic spans with special diacritics are extracted:

```json
{
  "name": "Ra",
  "transliteration": "rꜥ"
}
```

### Sanskrit Diacritics

Hindu/Buddhist entity names preserve Sanskrit characters:
- ṛ, ṣ, ṭ, ḍ, ṃ, ḥ

## Edge Cases & Special Handling

### 1. Index/List Pages

**Detection:** File ends with `/index.html`

**Action:** Skipped (not entity pages)

**Output:**
```json
{
  "status": "skipped",
  "page_type": "index",
  "reason": "Not an entity detail page (type: index)"
}
```

### 2. Redirect Pages

**Detection:** Meta refresh tag present

**Action:** Skipped, redirect URL logged

### 3. Greek Hero Labors

**Detection:** `.labors-grid` class in mythology section

**Extraction:**
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

### 4. Egyptian Forms & Manifestations

**Detection:** Section with id `#forms`

**Extraction:**
```json
{
  "forms": [
    {
      "name": "Khepri (Morning)",
      "description": "Scarab beetle form, the rising sun..."
    }
  ]
}
```

### 5. Alternative Theories

**Detection:**
- `<details>` with purple styling (Author's theories)
- `.extra-theories` section (Babylonian speculative content)

**Extraction:**
```json
{
  "alternative_theories": [
    {
      "type": "author_theory",
      "title": "Author's Theories & Extended Analysis",
      "content": "...",
      "note": "Speculative personal theory"
    }
  ]
}
```

### 6. Corpus Search Pages

**Detection:** Filename contains `corpus-search`

**Action:** Skipped

### 7. Interactive/Visualization Pages

**Detection:** `<canvas>` element present

**Action:** Skipped or text-only extraction

## Error Handling

### File Reading Errors

The script tries multiple encodings:
1. UTF-8
2. UTF-8-sig (with BOM)
3. Latin-1
4. CP1252

If all fail, returns extraction failure.

### Missing Sections

- Script continues extraction even if sections fail
- Missing sections logged as warnings
- Partial data always returned

### Malformed HTML

- BeautifulSoup handles most malformed HTML
- Critical errors (no entity name) return failure status
- Non-critical errors logged as warnings

## Testing

### Running Tests

```bash
python scripts/test-extraction.py
```

This runs extraction on 10 diverse sample files:
1. Egyptian deity with hieroglyphs (Ra)
2. Greek deity (Zeus)
3. Greek hero with labors (Heracles)
4. Greek hero (Perseus)
5. Norse deity (Odin)
6. Hindu deity (Shiva)
7. Babylonian deity with theories (Marduk)
8. Buddhist deity (Avalokiteshvara)
9. Egyptian deity (Anubis)
10. Greek hero (Odysseus)

### Test Output

```
================================================================================
HTML TO JSON EXTRACTION - TEST SUITE
================================================================================
Testing 10 sample files

================================================================================
Testing: mythos/egyptian/deities/ra.html
================================================================================
✓ Extraction completed
✓ All required fields present
✓ Type: deity
✓ Mythology: egyptian
✓ Hieroglyphs preserved
✓ Forms extracted: 4 forms
✓ Theories extracted: 1
✓ Sections: Attributes (6), Mythology, Relationships, Worship
✓ Completeness: 92%

...

================================================================================
TEST SUMMARY
================================================================================

Total Tests: 10
Passed: 9 ✓
Failed: 1 ❌
Success Rate: 90.0%

✓ Results saved to: test-extraction-results/
✓ Test report: test-extraction-results/test-report.json
```

### Test Output Files

Tests generate:
- Individual JSON files: `test-extraction-results/ra.json`
- Summary report: `test-extraction-results/test-report.json`

## Integration with Migration Tracker

### Update Tracker After Extraction

To mark files as extracted in `MIGRATION_TRACKER.json`:

```python
import json

# Load tracker
with open('MIGRATION_TRACKER.json', 'r') as f:
    tracker = json.load(f)

# Update status
file_path = 'mythos/greek/deities/zeus.html'
if file_path in tracker['files']:
    tracker['files'][file_path]['status'] = 'extracted'
    tracker['files'][file_path]['extracted_at'] = '2025-12-15T10:30:00Z'

# Save tracker
with open('MIGRATION_TRACKER.json', 'w') as f:
    json.dump(tracker, f, indent=2)
```

### Log Activity

Append to `MIGRATION_LOG.md`:

```markdown
### 2025-12-15 - Batch Extraction

**Action:** Extracted Greek mythology entities
**Files Processed:** 25
**Success:** 23
**Failed:** 2
**Script:** html-to-json-extractor.py v1.0.0
```

## Troubleshooting

### Common Issues

#### 1. "Cannot decode file"

**Cause:** File encoding issues

**Solution:** Check file encoding, ensure UTF-8

#### 2. "No header section found"

**Cause:** Unexpected HTML structure

**Solution:** Verify file is entity detail page, not index/list page

#### 3. Low completeness score

**Cause:** Missing sections or stub page

**Solution:** Check source HTML, may need manual enhancement

#### 4. Hieroglyphs display as boxes

**Cause:** Font not installed

**Solution:** Install "Noto Sans Egyptian Hieroglyphs" font

#### 5. Import errors in test script

**Cause:** Script path issues

**Solution:** Run from project root: `python scripts/test-extraction.py`

### Debug Mode

For detailed extraction debugging, modify the script:

```python
# In HTMLToJSONExtractor.__init__
self.debug = True  # Enable debug output

# Then run with verbose output
python scripts/html-to-json-extractor.py input.html output.json --verbose
```

## Performance

### Speed

- **Single file:** ~0.5-2 seconds per file
- **Directory (100 files):** ~1-3 minutes
- **Full mythology (500 files):** ~5-10 minutes

### Optimization Tips

1. **Process in parallel** for large batches
2. **Skip index pages** with pre-filtering
3. **Cache templates** for repeated runs
4. **Use SSD** for I/O-heavy operations

## Next Steps After Extraction

1. **Validate JSON** against `entity-schema-v2.0.json`
2. **Enrich data** with manual corrections
3. **Upload to Firebase** using migration scripts
4. **Update tracker** and log activity
5. **Run quality checks** on extracted data

## Advanced Usage

### Custom Templates

Create custom extraction templates:

```json
{
  "custom_section": {
    "selector": "section#custom",
    "extract": {
      "field": ".custom-class"
    }
  }
}
```

Load custom templates:

```python
extractor = HTMLToJSONExtractor("custom-templates.json")
```

### Batch Processing with Progress

```python
from tqdm import tqdm
import glob

extractor = HTMLToJSONExtractor()
html_files = glob.glob("mythos/**/*.html", recursive=True)

for html_file in tqdm(html_files, desc="Extracting"):
    result = extractor.extract_from_file(html_file)
    output_file = html_file.replace('.html', '.json')
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
```

### Filtering Results

```python
# Extract only high-quality pages
result = extractor.extract_from_file(html_file)
if result['extraction_metadata']['completeness_score'] >= 70:
    # Process high-quality extraction
    save_to_firebase(result)
else:
    # Flag for manual review
    flag_for_review(result)
```

## Version History

### v1.0.0 (2025-12-15)
- Initial release
- Support for deity, hero, creature pages
- Special character handling (hieroglyphs, Sanskrit)
- Edge case handling (redirects, index pages, theories)
- Completeness scoring
- Quality validation
- Test suite with 10 sample files

## Support & Contact

**Issues:** Submit to GitHub Issues
**Documentation:** See `STRUCTURE_PATTERNS.md` and `SPECIAL_CASES.md`
**Migration Team:** Eyes of Azrael Firebase Migration Project

---

**Last Updated:** 2025-12-15
**Script Version:** 1.0.0

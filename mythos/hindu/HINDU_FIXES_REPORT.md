# Hindu Mythology Section - Issues and Fixes Report

## Executive Summary

The Hindu mythology section has severe HTML corruption affecting multiple files, primarily related to:
1. Recursive corpus-link tag nesting in title elements
2. Malformed href attributes with embedded HTML tags
3. Broken internal links to missing files
4. Self-referencing and duplicate path issues

## Critical Issues

### 1. Corrupted Title Tags (SEVERE)

**Affected Files:**
- `cosmology/karma.html` - Title tag has 20+ levels of nested corpus-link tags
- `deities/brahma.html` - Title tag has 20+ levels of nested corpus-link tags
- `deities/durga.html` - Title tag has similar corruption
- `deities/krishna.html`, `deities/saraswati.html`, `deities/shiva.html`, `deities/vishnu.html` - All likely affected

**Problem:** The `<title>` tag contains recursively nested `<a class="corpus-link">` tags instead of plain text.

**Example of Corruption:**
```html
<title><a class="corpus-link" corpus-results="" data-term="Karma" data-tradition="hindu" hindu="" karma.html"="" href="../../../corpus-results/hindu/karma.html" title="Search corpus for 'Karma'">Karma</a>" data-tradition="hindu" hindu="" <a class="corpus-link" data-term="Karma"... [continues for thousands of characters]
```

**Correct Format:**
```html
<title>Karma - Hindu Cosmology</title>
```

**Fix Required:** Replace entire title tag with plain text format.

### 2. Broken Internal Links

**cosmology/afterlife.html** - Links to non-existent files:
- `vishnu.html` (should be `../deities/vishnu.html`)
- `shiva.html` (should be `../deities/shiva.html`)
- `brahma.html` (should be `../deities/brahma.html`)
- `deities/index.html` (should be `../deities/index.html`)
- `creatures/garuda.html` (should be `../creatures/garuda.html`)

**cosmology/creation.html** - Same issues as afterlife.html

**cosmology/index.html** - Links to:
- `brahma.html`, `vishnu.html`, `shiva.html` (should point to `../deities/`)
- `heroes/rama.html` (should be `../heroes/rama.html`)
- `creatures/garuda.html` (should be `../creatures/garuda.html`)

**cosmology/karma.html** - Links to non-existent files:
- `../texts/bhagavad_gita.html` (file doesn't exist, only `texts/index.html` exists)
- `../heroes/arjuna.html` (file doesn't exist)
- `gunas.html` (file doesn't exist in cosmology/)
- ` karma.html` (malformed - has leading space)

**creatures/garuda.html** - Links to:
- `vishnu.html` (should be `../deities/vishnu.html`)
- `creatures/garuda.html` (self-reference should be just `garuda.html` or removed)
- `naga.html` (should check if this exists in creatures/)

**creatures/index.html** - Multiple broken links:
- `vishnu.html`, `shiva.html`, `brahma.html`, `durga.html` (should point to `../deities/`)
- `karma.html` (should be `../cosmology/karma.html`)
- `deities/index.html` (should be `../deities/index.html`)
- `creatures/index.html` (self-reference, should be `index.html`)
- `heroes/rama.html` (should be `../heroes/rama.html`)

### 3. Malformed Corpus-Search Links

**cosmology/karma.html** - Malformed query parameters:
- `../corpus-search.html?term=&lt;a href=` (has embedded HTML in query string)
- Line 85 has a completely broken link with nested HTML tags

**corpus-search.html** - Malformed onclick attributes:
- Lines 43-46: `onclick="quickSearch('<a href="deities/vishnu.html"...')"`
- Should be: `onclick="quickSearch('Vishnu')"`

### 4. Cross-Reference Issues

**deities/brahma.html** - Malformed corpus-search links:
- Multiple `href="../../../corpus-results/hindu/<a class=` (has embedded tags in href)
- Should be properly formed corpus-results URLs

**deities/durga.html** - Same corruption pattern as brahma.html

## Missing Files Referenced

These files are referenced but don't exist:
- `cosmology/vishnu.html` - Should use `../deities/vishnu.html`
- `cosmology/shiva.html` - Should use `../deities/shiva.html`
- `cosmology/brahma.html` - Should use `../deities/brahma.html`
- `cosmology/gunas.html` - File doesn't exist, remove link or create stub
- `cosmology/shakti.html` - File doesn't exist
- `cosmology/dharma.html` - File doesn't exist
- `creatures/vishnu.html` - Should use `../deities/vishnu.html`
- `creatures/durga.html` - Should use `../deities/durga.html`
- `creatures/shiva.html` - Should use `../deities/shiva.html`
- `creatures/brahma.html` - Should use `../deities/brahma.html`
- `creatures/karma.html` - Should use `../cosmology/karma.html`
- `creatures/deities/index.html` - Should use `../deities/index.html`
- `creatures/creatures/garuda.html` - Duplicate path, should be just `garuda.html`
- `creatures/creatures/index.html` - Should be `index.html`
- `creatures/lion.html` - File doesn't exist, referenced in durga.html
- `creatures/naga.html` - Check if exists or if should be `nagas.html`
- `texts/bhagavad_gita.html` - Only `texts/index.html` exists
- `heroes/arjuna.html` - File doesn't exist
- Various cross-mythology links (buddhist, jain, chinese, greek, jewish) - All missing

## Recommendations

### Immediate Actions (Priority 1)

1. **Fix Corrupted Title Tags** - Use sed or manual editing to replace corrupted title tags:
   ```bash
   # For karma.html
   sed -i '6s|.*|<title>Karma - Hindu Cosmology</title>|' cosmology/karma.html

   # For brahma.html
   sed -i '6s|.*|<title>Brahma - Hindu Mythology</title>|' deities/brahma.html
   ```

2. **Fix Internal Deity Links** - Update all links in cosmology/ and creatures/ folders:
   - Search: `href="(vishnu|shiva|brahma|durga)\.html"`
   - Replace: `href="../deities/\1.html"`

3. **Fix Self-Referencing Paths** - Remove duplicate path segments:
   - Search: `href="creatures/garuda\.html"` in garuda.html
   - Replace: `href="garuda.html"` or remove if self-link

### Secondary Actions (Priority 2)

4. **Fix Corpus-Search Links** - Clean up malformed query parameters in karma.html line 85:
   - Remove embedded HTML tags from href attributes
   - Fix onclick attributes in corpus-search.html

5. **Fix Cross-References** - Update links to missing files:
   - Either create stub files for gunas.html, shakti.html, dharma.html
   - Or remove/comment out links to non-existent files

6. **Document Missing Files** - Create a comprehensive list of files that should be created:
   - `cosmology/gunas.html` - The Three Gunas
   - `cosmology/shakti.html` - Divine Feminine Energy
   - `cosmology/dharma.html` - Cosmic Order and Duty
   - `texts/bhagavad_gita.html` - The Bhagavad Gita
   - `heroes/arjuna.html` - The Pandava Prince
   - `creatures/naga.html` or verify `nagas.html` is correct

### Long-term Actions (Priority 3)

7. **Validate All HTML** - Run HTML validator on all fixed files

8. **Create Missing Stub Files** - For all referenced but missing files

9. **Cross-Mythology Links** - Create placeholder pages or remove broken cross-tradition links

10. **Implement Quality Controls** - Add pre-commit hooks to prevent corpus-link corruption

## Fix Commands

### Quick Fixes (Bash)

```bash
cd H:\\DaedalusSVN\\PlayTow\\EOAPlot\\docs\\mythos\\hindu

# Fix karma.html title
sed -i '6s|<title>.*</title>|<title>Karma - Hindu Cosmology</title>|' cosmology/karma.html

# Fix brahma.html title
sed -i '6s|<title>.*</title>|<title>Brahma - Hindu Mythology</title>|' deities/brahma.html

# Fix durga.html title
sed -i '6s|<title>.*</title>|<title>Durga - Hindu Mythology</title>|' deities/durga.html

# Fix internal deity links in cosmology files
cd cosmology
for file in *.html; do
    sed -i 's|href="vishnu\.html"|href="../deities/vishnu.html"|g' "$file"
    sed -i 's|href="shiva\.html"|href="../deities/shiva.html"|g' "$file"
    sed -i 's|href="brahma\.html"|href="../deities/brahma.html"|g' "$file"
done

# Fix creatures folder links
cd ../creatures
for file in *.html; do
    sed -i 's|href="vishnu\.html"|href="../deities/vishnu.html"|g' "$file"
    sed -i 's|href="shiva\.html"|href="../deities/shiva.html"|g' "$file"
    sed -i 's|href="brahma\.html"|href="../deities/brahma.html"|g' "$file"
    sed -i 's|href="durga\.html"|href="../deities/durga.html"|g' "$file"
done
```

## Files Status

### Severely Corrupted (Require Manual Intervention)
- `cosmology/karma.html` - Title tag and line 85
- `deities/brahma.html` - Title tag
- `deities/durga.html` - Title tag
- `deities/krishna.html` - Title tag (likely)
- `deities/saraswati.html` - Title tag (likely)
- `deities/shiva.html` - Title tag (likely)
- `deities/vishnu.html` - Title tag (likely)

### Broken Links (Fixable with sed)
- `cosmology/afterlife.html`
- `cosmology/creation.html`
- `cosmology/index.html`
- `creatures/garuda.html`
- `creatures/index.html`

### Minor Issues
- `corpus-search.html` - onclick attributes
- `cosmology/kshira-sagara.html` - theme links only
- `beings/yamadutas.html` - theme links only

### OK (No Critical Issues)
- Most files in `deities/`, `heroes/`, `creatures/` subfolders
- Index pages
- Ritual and symbol pages

## Next Steps

1. Run the provided bash commands to fix titles and links
2. Manually inspect and fix line 85 in karma.html
3. Verify all fixed files render correctly in a browser
4. Create stub files for missing referenced pages
5. Re-run link checker to verify all fixes

---

Generated: 2025-11-16
Location: H:\\DaedalusSVN\\PlayTow\\EOAPlot\\docs\\mythos\\hindu\\

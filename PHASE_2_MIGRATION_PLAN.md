# Phase 2 Migration Plan - Firebase Asset Migration

**Project:** Eyes of Azrael Firebase Migration
**Document Version:** 1.0
**Date:** December 13, 2024
**Status:** Phase 1 Complete (382 items migrated, 70%)

---

## Executive Summary

**Remaining Work:** 420 HTML files (30%) need migration to Firebase assets collection
**Estimated Time:** 8-12 hours of execution + 4-6 hours of testing
**Complexity:** Medium-High (requires specialized parsers for nested structures)
**Risk Level:** Medium (complex HTML structures, SVG extraction)

### Key Challenges
1. **Gnostic Christian content** - Deeply nested theological concepts (53 files)
2. **Jewish Kabbalah content** - Specialized mystical structures (31 files)
3. **Sacred Texts** - Scripture references and parallel structures (35 files)
4. **SVG Graphics** - Embedded diagrams requiring extraction (minimal: 1-2 files)
5. **Unknown categorization** - 291 files need type classification

---

## Phase 1 Recap - What's Already Migrated

### Completed (382 items, 70%)
- ✅ **Greek Mythology:** Deities, heroes, creatures, places (64+ files)
- ✅ **Norse Mythology:** Full pantheon and entities
- ✅ **Egyptian Mythology:** Complete mythology
- ✅ **Hindu Mythology:** Major deities and concepts
- ✅ **Japanese Mythology:** Kami and entities
- ✅ **Roman, Babylonian, Sumerian:** Major entities
- ✅ **Core infrastructure:** Universal parser, validation, upload system

### Working Systems
- ✅ Universal HTML parser (`migrate-to-firebase-assets.js`)
- ✅ Validation framework (required fields, content quality)
- ✅ Batch upload system (500 docs per batch)
- ✅ Progress tracking and resume capability
- ✅ Error logging and reporting

---

## Remaining Content Analysis

### Total Remaining: 420 files

#### By Content Type

| Category | Count | Complexity | Parser Needed |
|----------|-------|------------|---------------|
| **Sacred Texts** | 55 | High | Specialized |
| **Christian Gnostic** | 37 | Very High | Specialized |
| **Jewish Kabbalah** | 36 | Very High | Specialized |
| **Concepts/Events** | 43 | Medium | Universal + tweaks |
| **Unknown/Mixed** | 291 | Medium | Universal |
| **Symbols/Items** | 3 | Low | Universal |
| **SVG Graphics** | 1-2 | Medium | Extraction script |

#### By Mythology

| Mythology | Remaining Files | Priority |
|-----------|----------------|----------|
| Christian | ~150 (texts + gnostic) | High |
| Jewish | ~40 (kabbalah) | High |
| Apocryphal | ~30 | Medium |
| Mixed/Cross-mythology | ~200 | Low |

---

## Priority Order & Batching Strategy

### Batch 1: Universal Parser - Simple Content (Priority: HIGHEST)
**Files:** ~200 files
**Time Estimate:** 2-3 hours
**Description:** Files that work with existing universal parser

#### Content Types:
- Concepts (non-theological)
- Events
- Myths
- Symbols
- Simple ritual/practice pages
- Cross-mythology comparison pages

#### Migration Command:
```bash
# Test first
node scripts/migrate-to-firebase-assets.js --dry-run --mythology apocryphal
node scripts/migrate-to-firebase-assets.js --dry-run --mythology aztec
node scripts/migrate-to-firebase-assets.js --dry-run --mythology celtic

# Live migration
node scripts/migrate-to-firebase-assets.js --mythology apocryphal
node scripts/migrate-to-firebase-assets.js --mythology celtic
node scripts/migrate-to-firebase-assets.js --mythology aztec
node scripts/migrate-to-firebase-assets.js --mythology mayan
```

#### Success Criteria:
- 90%+ parse success rate
- All assets have name, summary, mythology
- At least 1 panel per asset
- No critical validation errors

---

### Batch 2: Sacred Texts Parser (Priority: HIGH)
**Files:** 55 text files
**Time Estimate:** 4-5 hours (2h parser dev + 2h migration + 1h testing)
**Complexity:** High

#### Files Included:
- `mythos/christian/texts/revelation/**/*.html` (35+ files)
- `mythos/jewish/texts/**/*.html`
- `mythos/hindu/texts/**/*.html`
- Other scripture/text files

#### Special Requirements:
1. **Scripture References** - Parse verse citations (Rev 7:1-8)
2. **Parallel Structures** - Link OT/NT parallels
3. **Cross-references** - "See Also" sections
4. **Nested Chapters** - revelation/parallels/* subdirectories

#### Parser Modifications Needed:

**File:** `scripts/parse-sacred-texts.js` (NEW)

```javascript
// Specialized parser for sacred texts
function parseScriptureReferences($) {
  // Extract verse citations (e.g., "Revelation 7:1-8")
  const citations = [];
  $('p, li').each((i, el) => {
    const text = $(el).text();
    const matches = text.match(/([A-Z][a-z]+)\s+(\d+):(\d+)(-(\d+))?/g);
    if (matches) citations.push(...matches);
  });
  return citations;
}

function extractParallels($) {
  // Find "OT Background", "Parallels", "See Also" sections
  const parallels = {};
  $('h3, h4').each((i, heading) => {
    const text = $(heading).text().toLowerCase();
    if (text.includes('parallel') || text.includes('background')) {
      const content = $(heading).next('p, ul').text();
      parallels[text] = content;
    }
  });
  return parallels;
}

function parseSacredText(filePath) {
  const asset = parseHtmlFile(filePath); // Use universal parser

  // Add text-specific data
  asset.textData = {
    scriptures: parseScriptureReferences($),
    parallels: extractParallels($),
    chapter: extractChapter(filePath),
    testament: detectTestament(filePath)
  };

  return asset;
}
```

#### Migration Steps:
1. Create specialized parser
2. Test on 5 sample files
3. Validate structure
4. Run batch migration
5. Verify cross-references

#### Testing:
```bash
# Test parser
node scripts/parse-sacred-texts.js --dry-run --page mythos/christian/texts/revelation/144000.html

# Validate output
node scripts/validate-parsed-data.js

# Full migration
node scripts/parse-sacred-texts.js --all
```

---

### Batch 3: Christian Gnostic Parser (Priority: HIGH)
**Files:** 37 files in `mythos/christian/gnostic/`
**Time Estimate:** 5-6 hours (3h parser dev + 2h migration + 1h testing)
**Complexity:** Very High

#### Files Included:
- `aeons.html` - Divine emanations
- `demiurge.html` - Creator deity
- `sophia.html` - Divine wisdom
- `pleroma.html` - Fullness of divinity
- 30+ theological concept files

#### Special Requirements:
1. **Aeon Cards** - Paired divine beings (syzygy structure)
2. **Theological Hierarchies** - Monad → Pleroma → Aeons → Material
3. **Quote Cards** - Nag Hammadi scripture quotations
4. **Cross-References** - Heavy interlinking between concepts
5. **Custom Card Structures** - `.aeon-card`, `.gnostic-topic-card`

#### Parser Modifications Needed:

**File:** `scripts/parse-gnostic-content.js` (NEW)

```javascript
// Specialized parser for Gnostic theology
function parseAeonCards($) {
  const aeons = [];
  $('.aeon-card').each((i, card) => {
    const $card = $(card);
    aeons.push({
      name: cleanText($card.find('h3').text()),
      greekName: cleanText($card.find('.greek-name').text()),
      meaning: cleanText($card.find('.meaning').text()),
      pair: cleanText($card.find('.syzygy-pair').text()),
      description: cleanText($card.find('p').text())
    });
  });
  return aeons;
}

function parseQuoteCards($) {
  const quotes = [];
  $('.quote-card').each((i, card) => {
    const $card = $(card);
    quotes.push({
      text: cleanText($card.contents().not('cite').text()),
      source: cleanText($card.find('cite').text())
    });
  });
  return quotes;
}

function parseGnosticHierarchy($) {
  // Extract theological hierarchy from structured sections
  const hierarchy = {
    monad: null,
    pleroma: [],
    aeons: [],
    sophia: null,
    demiurge: null
  };

  // Parse based on section headings and content
  $('h2, h3').each((i, heading) => {
    const title = $(heading).text().toLowerCase();
    const content = $(heading).nextUntil('h2, h3').text();

    if (title.includes('monad')) hierarchy.monad = content;
    if (title.includes('pleroma')) hierarchy.pleroma.push(content);
    if (title.includes('aeon')) hierarchy.aeons.push(content);
  });

  return hierarchy;
}

function parseGnosticConcept(filePath) {
  const asset = parseHtmlFile(filePath); // Universal parser

  // Add Gnostic-specific data
  asset.gnosticData = {
    aeons: parseAeonCards($),
    quotes: parseQuoteCards($),
    hierarchy: parseGnosticHierarchy($),
    theology: extractTheologicalThemes($)
  };

  // Override asset type
  asset.assetType = 'concept';
  asset.subType = 'gnostic-theology';

  return asset;
}
```

#### Migration Steps:
1. Analyze HTML structure of 3-5 sample files
2. Create specialized parser with Gnostic-specific extractors
3. Test on `aeons.html`, `demiurge.html`, `sophia.html`
4. Validate aeon card extraction
5. Run batch migration
6. Verify theological hierarchy preservation

#### Testing:
```bash
# Test individual files
node scripts/parse-gnostic-content.js --dry-run --page mythos/christian/gnostic/aeons.html
node scripts/parse-gnostic-content.js --dry-run --page mythos/christian/gnostic/demiurge.html

# Validate structure
node scripts/validate-parsed-data.js --verbose

# Full migration
node scripts/parse-gnostic-content.js --mythology christian --path gnostic
```

---

### Batch 4: Jewish Kabbalah Parser (Priority: HIGH)
**Files:** 36 files in `mythos/jewish/kabbalah/`
**Time Estimate:** 5-6 hours (3h parser dev + 2h migration + 1h testing)
**Complexity:** Very High

#### Files Included:
- `sefiroth/` - Tree of Life structures
- `names/` - Divine name permutations
- `physics/` - Kabbalah-physics correlations
- `angels.html` - 288 Sparks angelology
- `concepts.html` - Mystical concepts

#### Special Requirements:
1. **Sefirot Cards** - 10 divine emanations with Hebrew names
2. **Hebrew Text** - Right-to-left (RTL) text handling
3. **Tree of Life Structure** - Hierarchical relationships
4. **Divine Names** - Tetragrammaton variations
5. **Physics Correlations** - Modern physics mappings
6. **288 Sparks** - Angel/demon grid structures

#### Parser Modifications Needed:

**File:** `scripts/parse-kabbalah-content.js` (NEW)

```javascript
// Specialized parser for Kabbalah mysticism
function parseSefirotCards($) {
  const sefiroth = [];
  $('.sefirah-card, .celestial-card').each((i, card) => {
    const $card = $(card);
    sefiroth.push({
      name: cleanText($card.find('h3').text()),
      hebrewName: cleanText($card.find('.hebrew').text()),
      title: cleanText($card.find('.title-badge').text()),
      meaning: cleanText($card.find('.meaning').text()),
      sphere: cleanText($card.find('.sphere').text()),
      description: cleanText($card.find('p').text()),
      order: i + 1
    });
  });
  return sefiroth;
}

function parseDivineNames($) {
  const names = [];
  $('.name-card').each((i, card) => {
    const $card = $(card);
    names.push({
      name: cleanText($card.find('h3').text()),
      hebrew: cleanText($card.find('.hebrew').text()),
      transliteration: cleanText($card.find('.transliteration').text()),
      gematria: cleanText($card.find('.gematria').text()),
      meaning: cleanText($card.find('.meaning').text())
    });
  });
  return names;
}

function parseAngelGrid($) {
  // Parse 288 Sparks structure
  const angels = [];
  const demons = [];

  $('.angel-card').each((i, card) => {
    angels.push(parseAngelCard($(card)));
  });

  $('.demon-card').each((i, card) => {
    demons.push(parseDemonCard($(card)));
  });

  return { angels, demons, total: angels.length + demons.length };
}

function parsePhysicsCorrelations($) {
  // Extract Kabbalah-physics mappings
  const correlations = [];
  $('.correlation-card, .physics-card').each((i, card) => {
    const $card = $(card);
    correlations.push({
      kabbalistic: cleanText($card.find('.kabbalah-concept').text()),
      physics: cleanText($card.find('.physics-concept').text()),
      mapping: cleanText($card.find('.mapping-description').text())
    });
  });
  return correlations;
}

function parseKabbalahConcept(filePath) {
  const asset = parseHtmlFile(filePath); // Universal parser

  // Add Kabbalah-specific data
  asset.kabbalisticData = {
    sefiroth: parseSefirotCards($),
    divineNames: parseDivineNames($),
    angels: parseAngelGrid($),
    physicsCorrelations: parsePhysicsCorrelations($),
    treeOfLife: extractTreeStructure($)
  };

  // Override asset type
  asset.assetType = 'concept';
  asset.subType = 'kabbalah-mysticism';

  return asset;
}
```

#### Migration Steps:
1. Analyze Sefirot/angel card structures
2. Test Hebrew text extraction (RTL handling)
3. Create specialized parser
4. Test on `angels.html`, `sefiroth/*.html`
5. Validate hierarchical relationships
6. Run batch migration

#### Testing:
```bash
# Test key files
node scripts/parse-kabbalah-content.js --dry-run --page mythos/jewish/kabbalah/angels.html
node scripts/parse-kabbalah-content.js --dry-run --page mythos/jewish/kabbalah/concepts.html

# Validate Hebrew text
node scripts/validate-parsed-data.js --check-encoding

# Full migration
node scripts/parse-kabbalah-content.js --mythology jewish --path kabbalah
```

---

### Batch 5: SVG Graphics Extraction (Priority: MEDIUM)
**Files:** 1-2 SVG files + embedded SVGs in HTML
**Time Estimate:** 2-3 hours
**Complexity:** Medium

#### Files Included:
- `mythos/egyptian/theories/thorium_decay_chain.svg`
- `mythos/jewish/kabbalah/physics-integration.html` (may contain SVG)
- Any HTML with embedded `<svg>` tags

#### Strategy:

1. **Direct SVG Files** - Copy to Firebase Storage
2. **Embedded SVGs** - Extract and store separately
3. **Reference Linking** - Update asset documents with SVG URLs

#### Script Needed:

**File:** `scripts/extract-svg-graphics.js` (NEW)

```javascript
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

async function extractAndUploadSVG(filePath) {
  // Read HTML file
  const html = await fs.readFile(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const svgs = [];

  // Find embedded SVG elements
  $('svg').each((i, svg) => {
    const svgContent = $.html(svg);
    const svgId = `${path.basename(filePath, '.html')}-svg-${i}`;
    svgs.push({ id: svgId, content: svgContent });
  });

  // Upload to Firebase Storage
  for (const svg of svgs) {
    const bucket = storage.bucket('eyes-of-azrael.appspot.com');
    const file = bucket.file(`graphics/${svg.id}.svg`);
    await file.save(svg.content);
    console.log(`Uploaded: graphics/${svg.id}.svg`);
  }

  return svgs.map(s => s.id);
}

async function processSVGFiles() {
  // Find all SVG files
  const svgFiles = await glob('mythos/**/*.svg', { absolute: true });

  for (const file of svgFiles) {
    // Upload directly to Storage
    const bucket = storage.bucket('eyes-of-azrael.appspot.com');
    const destination = `graphics/${path.basename(file)}`;
    await bucket.upload(file, { destination });
    console.log(`Uploaded: ${destination}`);
  }

  // Find HTML files with embedded SVGs
  const htmlFiles = await glob('mythos/**/*.html', { absolute: true });

  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf-8');
    if (html.includes('<svg')) {
      const svgIds = await extractAndUploadSVG(file);
      console.log(`${file}: Extracted ${svgIds.length} SVGs`);
    }
  }
}
```

#### Migration Steps:
1. Scan for all `.svg` files
2. Scan for embedded `<svg>` tags in HTML
3. Upload to Firebase Storage (`/graphics/`)
4. Update asset documents with SVG URLs
5. Verify rendering in frontend

---

## Specialized Parser Implementation Guide

### Universal Parser Enhancements

**File:** `scripts/migration-config.js` (UPDATE)

Add specialized selectors:

```javascript
// Add to panelTypes
panelTypes: {
  text: 'p, ul, ol, blockquote',
  grid: '.deity-grid, .attribute-grid, .grid-2col, .panel-grid',
  card: '.deity-card, .attribute-card, .glass-card',
  link: 'a[href]',
  // NEW: Specialized card types
  aeon: '.aeon-card',
  gnostic: '.gnostic-topic-card',
  sefirah: '.sefirah-card',
  celestial: '.celestial-card',
  quote: '.quote-card'
},

// Add to assetTypePatterns
assetTypePatterns: {
  // ... existing patterns ...
  text: ['/texts/', '/scriptures/', '/books/', '/revelation/'],
  concept: ['/concepts/', '/teachings/', '/theology/', '/practices/', '/rituals/', '/magic/', '/gnostic/', '/kabbalah/']
}
```

### Parser Selection Logic

**File:** `scripts/migrate-to-firebase-assets.js` (UPDATE)

```javascript
function selectParser(filePath) {
  // Determine which parser to use based on file path
  if (filePath.includes('/gnostic/')) {
    return require('./parse-gnostic-content.js');
  }
  if (filePath.includes('/kabbalah/')) {
    return require('./parse-kabbalah-content.js');
  }
  if (filePath.includes('/texts/') || filePath.includes('/revelation/')) {
    return require('./parse-sacred-texts.js');
  }
  // Default to universal parser
  return parseHtmlFile;
}

async function processFile(db, filePath) {
  const parser = selectParser(filePath);
  const asset = await parser(filePath);
  // ... validation and upload ...
}
```

---

## Risk Assessment & Mitigation

### High-Risk Areas

#### 1. Hebrew Text Encoding (Kabbalah)
**Risk:** RTL text corruption during parsing
**Impact:** High - Loss of sacred text integrity
**Mitigation:**
- Use UTF-8 encoding exclusively
- Test RTL display in Firestore
- Validate Hebrew characters in test suite
- Keep original HTML as backup

#### 2. Complex Nested Structures (Gnostic)
**Risk:** Loss of theological hierarchy relationships
**Impact:** Medium - Incorrect concept representation
**Mitigation:**
- Preserve HTML structure in richContent
- Use relationship fields for hierarchies
- Manual validation of 5 sample files
- Create rollback snapshots

#### 3. Scripture Cross-References (Sacred Texts)
**Risk:** Broken links between related passages
**Impact:** Medium - Degraded user experience
**Mitigation:**
- Extract all "See Also" references
- Create reference validation script
- Build cross-reference index
- Test navigation paths

#### 4. SVG Extraction Quality
**Risk:** SVG rendering issues after extraction
**Impact:** Low - Affects only 1-2 files
**Mitigation:**
- Test SVG display before/after
- Preserve viewBox and dimensions
- Store original SVG files
- Use Firebase Storage CDN URLs

#### 5. Unknown File Categorization
**Risk:** 291 files may have unexpected structures
**Impact:** Medium - Parsing failures
**Mitigation:**
- Run dry-run first on all files
- Group by error patterns
- Create custom parsers as needed
- Use universal parser as fallback

### Medium-Risk Areas

#### 1. Validation Failures
**Risk:** Files fail minimum content requirements
**Mitigation:**
- Adjust validation thresholds (currently 50 char min summary)
- Add fallback summary extraction methods
- Manual review of failed files

#### 2. Performance/Timeout
**Risk:** Large batch processing times out
**Mitigation:**
- Process in smaller batches (50-100 files)
- Use resume capability
- Monitor Firebase quota limits

#### 3. Data Quality Degradation
**Risk:** Parsed content loses formatting/meaning
**Mitigation:**
- Sample validation (10% manual review)
- Before/after screenshots
- User acceptance testing

---

## Testing Strategy

### Phase 1: Parser Development Testing

#### For Each Specialized Parser:

**1. Unit Testing (Sample Files)**
```bash
# Test parser on 3-5 representative files
node scripts/parse-[type]-content.js --dry-run --page [sample-file-1]
node scripts/parse-[type]-content.js --dry-run --page [sample-file-2]
node scripts/parse-[type]-content.js --dry-run --page [sample-file-3]
```

**2. Structure Validation**
- Verify all fields populated
- Check special card extraction (aeons, sefiroth, etc.)
- Validate cross-references
- Test Unicode/Hebrew characters

**3. Output Inspection**
```bash
# Generate JSON output
node scripts/parse-[type]-content.js --page [file] --output test-output.json

# Manual review of JSON structure
cat test-output.json | jq '.richContent.panels'
```

### Phase 2: Batch Testing

**1. Dry Run on Category**
```bash
# Test entire category without writing
node scripts/migrate-to-firebase-assets.js --dry-run --mythology christian --path gnostic
```

**2. Quality Metrics**
- Parse success rate (target: 95%+)
- Validation pass rate (target: 90%+)
- Average panels per asset (target: 3+)
- Average summary length (target: 100+ chars)

**3. Error Analysis**
```bash
# Review error log
cat migration-errors.log | grep "Validation failed"
```

### Phase 3: Upload Testing

**1. Small Batch Upload**
```bash
# Upload 10-20 files first
node scripts/migrate-to-firebase-assets.js --mythology christian --path gnostic --limit 20
```

**2. Firestore Verification**
- Check document count in Firebase Console
- Query sample documents
- Verify field population
- Test search functionality

**3. Frontend Testing**
- Display asset in UI
- Test panel rendering
- Verify links/cross-references
- Check SVG display

### Phase 4: Full Migration Validation

**1. Completeness Check**
```bash
# Count migrated vs remaining
find mythos -name "*.html" | wc -l  # Total
# Compare with Firestore document count
```

**2. Data Quality Audit**
- Random sample 50 assets
- Manual review for accuracy
- Check for missing data
- Verify relationships

**3. User Acceptance Testing**
- Browse multiple mythologies
- Search for content
- Follow cross-references
- Test SVG graphics

---

## Execution Timeline

### Week 1: Preparation & Simple Content (8 hours)

**Day 1-2: Simple Content Migration (3 hours)**
- Run universal parser on non-specialized content
- Migrate apocryphal, aztec, celtic mythologies
- Validate and review errors

**Day 3: Sacred Texts Parser (5 hours)**
- Develop scripture reference parser
- Test on Revelation files
- Migrate all sacred text files

### Week 2: Specialized Content (12 hours)

**Day 1-2: Gnostic Parser (6 hours)**
- Analyze Gnostic HTML structures
- Develop aeon/quote card parsers
- Test and migrate 37 files

**Day 3-4: Kabbalah Parser (6 hours)**
- Analyze Kabbalah structures
- Develop sefirot/angel parsers
- Handle Hebrew text encoding
- Test and migrate 36 files

### Week 3: Graphics & Cleanup (6 hours)

**Day 1: SVG Extraction (3 hours)**
- Extract and upload SVG files
- Update asset references
- Test rendering

**Day 2: Unknown Files (2 hours)**
- Categorize remaining files
- Run universal parser
- Fix validation failures

**Day 3: Final Testing (1 hour)**
- Comprehensive validation
- User acceptance testing
- Documentation updates

**Total Estimated Time:** 26 hours (including testing)

---

## Quality Metrics & Success Criteria

### Completion Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Parse Success Rate** | 95%+ | Files successfully parsed / Total files |
| **Validation Pass Rate** | 90%+ | Assets passing validation / Total parsed |
| **Data Completeness** | 85%+ | Assets with all required fields / Total |
| **Average Panels/Asset** | 3+ | Total panels / Total assets |
| **Cross-Reference Integrity** | 95%+ | Valid links / Total links |

### Quality Checks

**Required Fields (100% required):**
- ✅ `id` - Unique identifier
- ✅ `name` - Asset name
- ✅ `mythology` - Source mythology
- ✅ `assetType` - deity/hero/concept/text/etc.
- ✅ `summary` - Minimum 50 characters
- ✅ `richContent.panels` - At least 1 panel

**Optional Fields (70%+ recommended):**
- `deityData` - For deity assets
- `textData` - For sacred text assets
- `gnosticData` - For Gnostic concepts
- `kabbalisticData` - For Kabbalah concepts
- `relationships` - Family/connections
- `alternateNames` - Other names

### Validation Tests

**Pre-Upload Tests:**
```bash
# Run validation on parsed data
node scripts/validate-parsed-data.js --strict

# Check for required fields
node scripts/validate-parsed-data.js --check-required

# Verify relationships
node scripts/validate-parsed-data.js --check-links
```

**Post-Upload Tests:**
```javascript
// Firestore query tests
const assets = await db.collection('assets')
  .where('mythology', '==', 'christian')
  .where('assetType', '==', 'concept')
  .get();

console.log(`Christian concepts: ${assets.size}`);

// Verify specific assets
const aeons = await db.collection('assets').doc('christian-aeons').get();
assert(aeons.exists);
assert(aeons.data().gnosticData.aeons.length > 0);
```

---

## Rollback & Recovery Plan

### Backup Strategy

**Before Each Batch:**
```bash
# Export current Firestore data
gcloud firestore export gs://eyes-of-azrael-backups/backup-$(date +%Y%m%d)

# Create local backup of parsed data
cp -r parsed_data/ backups/parsed_data-$(date +%Y%m%d)/
```

### Rollback Procedure

**If migration fails:**

1. **Stop migration immediately**
   ```bash
   # Kill running process
   pkill -f migrate-to-firebase
   ```

2. **Assess damage**
   ```bash
   # Check error log
   cat migration-errors.log

   # Count affected documents
   node scripts/count-assets.js --mythology christian --since [timestamp]
   ```

3. **Delete bad data**
   ```javascript
   // Delete assets created after failed batch
   const batch = db.batch();
   const badAssets = await db.collection('assets')
     .where('migratedAt', '>', failureTimestamp)
     .get();

   badAssets.forEach(doc => batch.delete(doc.ref));
   await batch.commit();
   ```

4. **Restore from backup**
   ```bash
   # Restore Firestore backup
   gcloud firestore import gs://eyes-of-azrael-backups/backup-[timestamp]
   ```

5. **Fix parser bugs**
   - Review error patterns
   - Update parser code
   - Re-test on sample files

6. **Resume migration**
   ```bash
   # Use resume flag to skip already-migrated
   node scripts/migrate-to-firebase-assets.js --resume --mythology christian
   ```

---

## Dependencies & Prerequisites

### Software Requirements

**Node.js Packages:**
- ✅ `cheerio` - HTML parsing
- ✅ `firebase-admin` - Firestore access
- ✅ `cli-progress` - Progress bars
- ✅ `glob` - File pattern matching
- ⚠️ `@google-cloud/storage` - SVG upload (NEW - need to install)

**Install missing packages:**
```bash
npm install @google-cloud/storage --save
```

### Firebase Configuration

**Required Setup:**
- ✅ Firebase project created
- ✅ Firestore database enabled
- ✅ Service account key downloaded
- ✅ Firebase Storage bucket created
- ⚠️ Storage rules configured (NEW)

**Storage Rules (update):**
```javascript
// firebase.storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /graphics/{filename} {
      allow read: if true;  // Public read for SVGs
      allow write: if request.auth != null;  // Authenticated write
    }
  }
}
```

### File System

**Required Directories:**
```bash
# Ensure these exist
mkdir -p scripts/
mkdir -p parsed_data/
mkdir -p backups/
mkdir -p logs/
```

---

## Monitoring & Progress Tracking

### Real-Time Monitoring

**Progress Tracking:**
```bash
# Watch progress file
watch -n 5 'cat migration-progress.json | jq ".stats"'

# Monitor error log
tail -f migration-errors.log

# Check Firestore document count
watch -n 10 'gcloud firestore databases describe | grep documentCount'
```

### Reporting

**Daily Reports:**
- Files processed today
- Success/failure rates
- Errors by category
- Estimated completion time

**Report Generation:**
```bash
# Generate HTML report
node scripts/migrate-to-firebase-assets.js --report-only

# View in browser
open migration-report-[timestamp].html
```

---

## Post-Migration Tasks

### Immediate (Day 1)

1. **Verify Document Counts**
   - Firestore Console check
   - Compare with expected totals

2. **Spot-Check Quality**
   - Random sample 50 assets
   - Verify data integrity

3. **Test Frontend**
   - Browse all mythologies
   - Test search functionality
   - Verify cross-references

### Week 1

1. **Create Indexes**
   - Compound indexes for common queries
   - Full-text search indexes

2. **Update Search System**
   - Re-index all new content
   - Test search relevance

3. **User Documentation**
   - Update content guide
   - Document new asset types

### Week 2

1. **Performance Optimization**
   - Analyze query performance
   - Add caching where needed
   - Optimize slow queries

2. **Analytics Setup**
   - Track asset views
   - Monitor search queries
   - User engagement metrics

---

## Appendix A: File Counts by Category

### Detailed Breakdown

**Christian Mythology:**
- Gnostic concepts: 37 files
- Revelation texts: 35+ files
- Other Christian: ~80 files
- **Total:** ~150 files

**Jewish Mythology:**
- Kabbalah (main): 10 files
- Kabbalah physics: 8 files
- Kabbalah names: 5 files
- Other Jewish: ~17 files
- **Total:** ~40 files

**Sacred Texts:**
- Christian texts: 40 files
- Jewish texts: 8 files
- Hindu texts: 5 files
- Buddhist texts: 2 files
- **Total:** ~55 files

**Other/Unknown:**
- Apocryphal: ~30 files
- Celtic: ~20 files
- Aztec: ~15 files
- Mayan: ~10 files
- Mixed/Uncategorized: ~216 files
- **Total:** ~291 files

**Graphics:**
- SVG files: 1 confirmed
- Embedded SVGs: 1-5 estimated
- **Total:** ~2-6 files

---

## Appendix B: Command Reference

### Quick Commands

**Dry Run (Test Without Writing):**
```bash
node scripts/migrate-to-firebase-assets.js --dry-run --mythology [name]
```

**Single File Test:**
```bash
node scripts/migrate-to-firebase-assets.js --dry-run --page mythos/[path]/[file].html
```

**Batch Migration:**
```bash
node scripts/migrate-to-firebase-assets.js --mythology [name]
```

**Resume After Interruption:**
```bash
node scripts/migrate-to-firebase-assets.js --resume --mythology [name]
```

**Verbose Output:**
```bash
node scripts/migrate-to-firebase-assets.js --verbose --mythology [name]
```

**Generate Report Only:**
```bash
node scripts/migrate-to-firebase-assets.js --report-only
```

---

## Appendix C: Sample Asset Structures

### Gnostic Concept Asset

```json
{
  "id": "christian-aeons",
  "assetType": "concept",
  "subType": "gnostic-theology",
  "mythology": "christian",
  "name": "The Aeons",
  "summary": "Divine beings emanated in syzygy pairs, embodying aspects of divine perfection within the Pleroma",
  "richContent": {
    "panels": [
      {
        "type": "panel",
        "title": "Overview",
        "titleIcon": "📋",
        "content": "In Gnostic theology, Aeons are divine emanations...",
        "order": 0
      },
      {
        "type": "grid",
        "title": "Major Aeons",
        "titleIcon": "✨",
        "gridWidth": 2,
        "children": [
          {
            "type": "card",
            "title": "Nous (Mind)",
            "content": "First emanation from Monad, paired with Aletheia (Truth)"
          }
        ],
        "order": 1
      }
    ]
  },
  "gnosticData": {
    "aeons": [
      {
        "name": "Nous",
        "greekName": "Νοῦς",
        "meaning": "Mind/Intellect",
        "pair": "Aletheia (Truth)",
        "description": "First emanation from the Monad..."
      }
    ],
    "quotes": [
      {
        "text": "The Aeons are the fullness of the Father...",
        "source": "Gospel of Truth, Nag Hammadi"
      }
    ],
    "hierarchy": {
      "monad": "The One, unknowable source",
      "pleroma": ["Fullness of divine emanations"],
      "aeons": ["Nous", "Logos", "Sophia", "..."]
    }
  },
  "isOfficial": true,
  "status": "published",
  "createdAt": "2024-12-13T...",
  "migratedAt": "2024-12-13T..."
}
```

### Kabbalah Concept Asset

```json
{
  "id": "jewish-sefiroth",
  "assetType": "concept",
  "subType": "kabbalah-mysticism",
  "mythology": "jewish",
  "name": "The Sefiroth",
  "summary": "The ten divine emanations or attributes through which God reveals Himself and continuously creates the physical and metaphysical realms",
  "richContent": {
    "panels": [...]
  },
  "kabbalisticData": {
    "sefiroth": [
      {
        "name": "Keter",
        "hebrewName": "כֶּתֶר",
        "title": "Crown",
        "meaning": "Divine Will",
        "sphere": "First emanation",
        "description": "The supreme crown, closest to Ein Sof...",
        "order": 1
      }
    ],
    "divineNames": [
      {
        "name": "YHVH",
        "hebrew": "יהוה",
        "transliteration": "Yod-Heh-Vav-Heh",
        "gematria": 26,
        "meaning": "I AM THAT I AM"
      }
    ],
    "treeOfLife": {
      "pillars": ["Severity", "Mercy", "Balance"],
      "paths": 22,
      "worlds": ["Atziluth", "Beriah", "Yetzirah", "Assiah"]
    }
  },
  "isOfficial": true,
  "status": "published",
  "createdAt": "2024-12-13T...",
  "migratedAt": "2024-12-13T..."
}
```

### Sacred Text Asset

```json
{
  "id": "christian-144000",
  "assetType": "text",
  "subType": "scripture",
  "mythology": "christian",
  "name": "The 144,000 Sealed",
  "summary": "Before the seventh seal is opened, 144,000 servants of God are sealed on their foreheads—12,000 from each of the 12 tribes of Israel",
  "richContent": {
    "panels": [...]
  },
  "textData": {
    "scriptures": [
      "Revelation 7:1-8",
      "Revelation 14:1-5",
      "Ezekiel 9:4"
    ],
    "parallels": {
      "ot background": "Ezekiel 9:4 - mark on foreheads of the faithful before judgment",
      "contrast": "Sealed by God (144,000) vs. marked by beast (666)"
    },
    "chapter": "revelation",
    "testament": "new"
  },
  "isOfficial": true,
  "status": "published",
  "createdAt": "2024-12-13T...",
  "migratedAt": "2024-12-13T..."
}
```

---

## Conclusion

Phase 2 migration requires **8-12 hours of execution time** plus **4-6 hours of testing** to complete the remaining 420 files. The plan prioritizes:

1. **Simple content first** - Get quick wins with universal parser
2. **Sacred texts** - High-value content with moderate complexity
3. **Gnostic & Kabbalah** - Complex theological content requiring specialized parsers
4. **Graphics extraction** - Low-volume, specialized task
5. **Cleanup** - Handle edge cases and unknowns

**Success depends on:**
- Thorough testing of specialized parsers
- Incremental migration with validation
- Rollback capability for each batch
- Quality metrics monitoring

**Next Steps:**
1. Review and approve this plan
2. Install missing dependencies (`@google-cloud/storage`)
3. Begin Batch 1 with simple content
4. Develop specialized parsers in parallel
5. Execute batches 2-5 sequentially with testing

**Expected Completion:** 2-3 weeks with careful testing and validation.

---

**Document Status:** READY FOR REVIEW
**Prepared by:** Migration Planning Agent
**Date:** December 13, 2024

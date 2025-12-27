# Batches 1 & 2 Manual Migration Guide

**Date:** 2025-12-27
**Total Files Analyzed:** 208 (Batch 1: 104, Batch 2: 104)
**Purpose:** Provide clear migration path for salvageable content from halted batches

---

## Executive Summary

After analyzing all 208 files from Batches 1 and 2, they have been categorized into three groups:

| Category | Count | Action Required |
|----------|-------|----------------|
| **DO NOT MIGRATE** | 156 (75%) | Preserve as-is - unique content or system files |
| **NEEDS REVIEW** | 38 (18%) | Manual verification required |
| **SAFE TO MIGRATE** | 14 (7%) | Already Firebase-enabled, can be deprecated |

**Key Finding:** The vast majority of files should NOT be migrated. Most contain unique content with no Firebase equivalent, or are essential system files.

---

## Category 1: DO NOT MIGRATE (156 files)

These files should be preserved as-is and excluded from all future migration batches.

### 1.1 System & Administrative Files (13 files)

**WHY:** Essential functionality, templates, or backup files.

```
admin-upload.html
admin/review-queue.html
auth-modal-template.html
auth-modal-firebase.html
index-dynamic.html
index-old-backup.html
index-old-system.html
index-before-crud.html
index-old-final-backup.html
edit.html
create-wizard.html
visualizations/globe-timeline.html
visualizations/visualizations.html
visualizations/timeline-tree.html
```

**Action:** Add these patterns to migration exclusion filters:
- `admin/**/*`
- `*-template.html`
- `*-backup.html`
- `index-*.html`
- `visualizations/**/*`
- `edit.html`
- `create-wizard.html`

---

### 1.2 Unique Theoretical & Analysis Content (24 files)

**WHY:** Educational content with no Firebase structure. These are essays, not entity descriptions.

```
theories/ai-analysis/wildest-theories.html (1,435 words)
theories/ai-analysis/consciousness-shamanism.html (1,306 words)
theories/ai-analysis/sky-gods-ancient-technology.html (1,542 words)
mythos/christian/resources/tim-ward-biblical-studies.html (3,236 words)
archetypes/cross-reference-matrix.html (interactive tool)
```

**Action:** Create new Firebase collection for theories:
```javascript
// Proposed structure
{
  collection: "theories",
  documents: {
    "sky-gods-ancient-technology": {
      title: "Sky Gods and Ancient Technology",
      category: "ai-analysis",
      wordCount: 1542,
      content: "...",
      mythology: ["cross-cultural"],
      tags: ["ancient-astronauts", "comparative"]
    }
  }
}
```

---

### 1.3 Jewish Kabbalah Framework (27 files)

**WHY:** Interconnected system that functions as a unit. Breaking it apart would destroy the educational value.

```
mythos/jewish/kabbalah/concepts.html
mythos/jewish/kabbalah/concepts-physics-integration.html
mythos/jewish/kabbalah/sefirot_overview.html
mythos/jewish/kabbalah/worlds_overview.html
mythos/jewish/kabbalah/names_overview.html
mythos/jewish/kabbalah/qlippot.html
mythos/jewish/kabbalah/angels.html

Worlds:
mythos/jewish/kabbalah/worlds/atziluth.html
mythos/jewish/kabbalah/worlds/beriah.html (1,194 words)
mythos/jewish/kabbalah/worlds/yetzirah.html
mythos/jewish/kabbalah/worlds/assiah.html
mythos/jewish/kabbalah/worlds/physics-integration.html

Sefirot:
mythos/jewish/kabbalah/sefirot/keter.html
mythos/jewish/kabbalah/sefirot/physics-integration.html

Physics Integration:
mythos/jewish/kabbalah/physics/4-worlds.html
mythos/jewish/kabbalah/physics/10-sefirot.html
mythos/jewish/kabbalah/physics/72-names.html
mythos/jewish/kabbalah/physics/288-sparks.html

Names:
mythos/jewish/kabbalah/names/1.html

Sparks:
mythos/jewish/kabbalah/sparks/vehu-atziluth.html
```

**Action:** Create specialized Kabbalah collection:
```javascript
{
  collection: "kabbalah",
  subcollections: ["worlds", "sefirot", "names", "sparks", "physics"],
  preserveInterlinks: true
}
```

---

### 1.4 Christian Gnostic Theology (18 files)

**WHY:** Extensive theological analysis (2,000-3,800 words each). No Firebase equivalents exist.

```
mythos/christian/gnostic/demiurge.html (1,640 words)
mythos/christian/gnostic/divine-pursuit.html (1,124 words)
mythos/christian/gnostic/grace-not-works.html (794 words)
mythos/christian/gnostic/irresistible-love.html (862 words)
mythos/christian/gnostic/lost-sheep.html (761 words)
mythos/christian/gnostic/daniels-kingdom.html (2,686 words)
mythos/christian/gnostic/prodigal-son.html (2,002 words)
mythos/christian/gnostic/god-is-spirit.html (3,445 words)
mythos/christian/gnostic/refining-fire.html (3,368 words)
mythos/christian/gnostic/judge-not.html (2,752 words)
mythos/christian/gnostic/female-disciples.html (2,872 words)
mythos/christian/gnostic/gender-transcendence.html (2,974 words)
mythos/christian/gnostic/love-enemies.html (3,096 words)
mythos/christian/gnostic/jesus-core-teachings.html (3,800 words)
mythos/christian/gnostic/sermon-on-mount.html (2,333 words)
```

**Action:** These represent unique theological perspectives. Keep as HTML or create `gnostic_texts` collection.

---

### 1.5 Sermon on the Mount Analysis (9 files)

**WHY:** Detailed verse-by-verse teaching analysis. Educational framework, not entity data.

```
mythos/christian/teachings/sermon-on-mount/structure.html
mythos/christian/teachings/sermon-on-mount/context.html
mythos/christian/teachings/sermon-on-mount/beatitudes-overview.html
mythos/christian/teachings/sermon-on-mount/blessed-poor-in-spirit.html
mythos/christian/teachings/sermon-on-mount/blessed-mourn.html
mythos/christian/teachings/sermon-on-mount/impossible-standard.html
mythos/christian/teachings/sermon-on-mount/love-enemies.html
mythos/christian/teachings/sermon-on-mount/lords-prayer.html
mythos/christian/teachings/parables/mustard-seed.html
```

---

### 1.6 Book of Revelation Analysis (26 files)

**WHY:** Structured biblical text analysis with cross-references. Educational framework.

```
mythos/christian/texts/revelation/structure.html
mythos/christian/texts/revelation/symbolism.html
mythos/christian/texts/revelation/144000.html
mythos/christian/texts/revelation/seven-seals.html
mythos/christian/texts/revelation/seven-trumpets.html
mythos/christian/texts/revelation/seven-churches.html
mythos/christian/texts/revelation/four-horsemen.html
mythos/christian/texts/revelation/four-living-creatures.html
mythos/christian/texts/revelation/heavenly-throne.html
mythos/christian/texts/revelation/mark-of-beast.html
mythos/christian/texts/revelation/woman-and-dragon.html
mythos/christian/texts/revelation/two-beasts.html
mythos/christian/texts/revelation/christ-returns.html
mythos/christian/texts/revelation/millennium.html
mythos/christian/texts/revelation/gog-magog.html
mythos/christian/texts/revelation/new-creation.html
mythos/christian/texts/revelation/new-jerusalem.html

Parallels:
mythos/christian/texts/revelation/parallels/daniel-parallels.html
mythos/christian/texts/revelation/parallels/exodus-parallels.html
mythos/christian/texts/revelation/parallels/ezekiel-parallels.html
mythos/christian/texts/revelation/parallels/isaiah-parallels.html
mythos/christian/texts/revelation/parallels/joel-parallels.html
mythos/christian/texts/revelation/parallels/zechariah-parallels.html
mythos/christian/texts/revelation/parallels/seven-patterns.html
mythos/christian/texts/revelation/parallels/names-and-titles.html
mythos/christian/texts/revelation/parallels/covenant-formulas.html
mythos/christian/texts/revelation/parallels/furnace-and-fire-judgments.html
```

---

### 1.7 Jesus's Lineage Pages (6 files)

**WHY:** Genealogical framework content, not individual entity pages.

```
mythos/christian/lineage/davidic-line.html
mythos/christian/lineage/luke-genealogy.html
mythos/christian/lineage/matthew-genealogy.html
mythos/christian/lineage/key-ancestors.html
mythos/christian/lineage/women-in-lineage.html
mythos/christian/lineage/ancestors/abraham.html
mythos/christian/lineage/ancestors/david.html
```

---

### 1.8 Comparative Mythology Studies (15 files)

**WHY:** Multi-mythology comparative analysis. No single Firebase entity fits this content.

```
Gilgamesh-Biblical Parallels:
mythos/comparative/gilgamesh-biblical/comprehensive-parallels.html (2,941 words)
mythos/comparative/gilgamesh-biblical/creation-parallels.html (2,082 words)
mythos/comparative/gilgamesh-biblical/friendship-covenant.html (2,157 words)
mythos/comparative/gilgamesh-biblical/gilgamesh-nephilim.html (1,588 words)
mythos/comparative/gilgamesh-biblical/hero-quest.html (1,997 words)
mythos/comparative/gilgamesh-biblical/immortality-quest.html (2,346 words)
mythos/comparative/gilgamesh-biblical/temple-prostitution.html (1,677 words)
mythos/comparative/gilgamesh-biblical/underworld-journey.html
mythos/comparative/gilgamesh-biblical/whore-of-babylon.html (2,203 words)

Flood Myths:
mythos/comparative/flood-myths/comparative-flood-chart.html
mythos/comparative/flood-myths/atrahasis-flood.html
mythos/comparative/flood-myths/genesis-flood.html (3,863 words)
mythos/comparative/flood-myths/gilgamesh-flood.html (1,898 words)
mythos/comparative/flood-myths/enoch-flood.html (3,380 words)
mythos/comparative/flood-myths/enoch-watchers-nephilim.html (2,651 words)
mythos/comparative/flood-myths/flood-typology.html (2,192 words)
mythos/comparative/flood-myths/flood-geology.html (1,331 words)
mythos/comparative/flood-myths/global-flood-myths.html (1,261 words)
```

**Action:** Create `comparative_studies` collection with cross-mythology references.

---

### 1.9 Enoch Tradition Pages (5 files)

**WHY:** Specialized framework for Enoch's assumption tradition across religions.

```
mythos/jewish/heroes/enoch/metatron-transformation.html (1,681 words)
mythos/jewish/heroes/enoch/enoch-calendar.html (784 words)
mythos/jewish/heroes/enoch/enoch-islam.html (863 words)
```

---

### 1.10 Magic & Spiritual Practice Content (14 files)

**WHY:** Instructional content for practices, not mythology entities.

```
magic/energy/chakra-work.html (2,300 words)
magic/energy/qigong.html (2,660 words)
magic/energy/kundalini.html (2,528 words)
magic/energy/middle-pillar.html (2,496 words)
magic/divination/oracle-bones.html (2,246 words)
magic/divination/astrology.html (2,373 words)
magic/divination/geomancy.html (2,366 words)
magic/practical/knot-magic.html (3,184 words)
magic/practical/sigil-magic.html (2,466 words)
magic/ritual/chaos-magic.html (2,807 words)
magic/texts/picatrix.html (2,263 words)
```

**Action:** Keep as educational resources or create `practices` collection.

---

### 1.11 Spiritual Items (7 files)

**WHY:** Already in `spiritual-items/` directory which should have its own migration strategy.

```
spiritual-items/relics/shroud-of-turin.html
spiritual-items/relics/seal-of-solomon.html
spiritual-items/relics/tarnhelm.html
spiritual-items/relics/urim-and-thummim.html
spiritual-items/ritual/shofar.html (2,715 words)
spiritual-items/ritual/singing-bowl.html (2,161 words)
```

---

### 1.12 Herbalism Content (1 file)

```
herbalism/traditions/norse/barley-hops.html (1,767 words)
```

---

### 1.13 Theology Pages (3 files)

```
mythos/christian/theology/apokatastasis.html (924 words)
mythos/christian/theology/harrowing-of-hell.html (1,072 words)
mythos/christian/theology/universal-salvation.html (603 words)
```

---

### 1.14 Apocryphal Content (1 file)

```
mythos/apocryphal/cosmology-map.html (1,077 words)
```

---

### 1.15 Specialized Texts (1 file)

```
mythos/jewish/texts/genesis/parallels/flood-myths-ane.html (2,575 words)
```

---

## Category 2: NEEDS REVIEW (38 files)

These files require manual inspection to determine if content should be extracted.

### 2.1 Deity Pages with Possible Content Overlap (15 files)

**Investigation Required:** Check if HTML content exists in Firebase. If yes, compare for gaps.

| File | Firebase Match | Migration % | Action |
|------|---------------|-------------|--------|
| mythos/hindu/deities/shiva.html | hindu mythology | 16.7% | Check Firebase `hindu_shiva` |
| mythos/islamic/deities/muhammad.html | black-stone (WRONG) | 16.7% | Find correct deity doc |
| mythos/roman/deities/pluto.html | hermes-caduceus (WRONG) | 16.89% | Check `roman_pluto` |
| mythos/roman/deities/vesta.html | eye-of-horus (WRONG) | 16.92% | Check `roman_vesta` |
| mythos/tarot/deities/fool.html | egyptian_sobek (WRONG) | 16.71% | Already Firebase-enabled? |
| mythos/roman/deities/juno.html | eye-of-horus (WRONG) | 17.7% | Already Firebase-enabled? |
| mythos/roman/deities/minerva.html | athena-aegis (WRONG) | 17.55% | Already Firebase-enabled? |
| mythos/roman/deities/vulcan.html | draupnir (WRONG) | 17.65% | Check `roman_vulcan` |
| mythos/roman/deities/proserpina.html | pomegranate | 18.46% | Check `roman_proserpina` |
| mythos/roman/deities/ceres.html | ceres | 18.73% | Check `ceres` doc |
| mythos/roman/deities/janus.html | eye-of-horus (WRONG) | 18.12% | Check `roman_janus` |
| mythos/roman/deities/apollo.html | eye-of-horus (WRONG) | 19.59% | Check `roman_apollo` |
| mythos/roman/deities/neptune.html | kusanagi (WRONG) | 19.97% | Check `roman_neptune` |
| mythos/roman/deities/jupiter.html | roman mythology | 19.48% | Check `roman_jupiter` |
| mythos/roman/deities/mars.html | ceres (WRONG) | 19.79% | Check `roman_mars` |

**Manual Process:**
```javascript
// For each file:
1. Read HTML file content
2. Query Firebase: db.collection('deities').doc('roman_[deity-name]').get()
3. Compare wordCount, descriptions, symbols, powers
4. If Firebase has ALL content → deprecate HTML
5. If HTML has unique content → extract to Firebase, then deprecate
6. If no Firebase doc exists → create new doc from HTML
```

---

### 2.2 Greek Deity Pages (3 files)

| File | Check Firebase Doc |
|------|-------------------|
| mythos/greek/deities/hephaestus.html | `greek_hephaestus` |
| mythos/greek/deities/eros.html | `greek_eros` |
| mythos/greek/deities/poseidon.html | `greek_poseidon` |

---

### 2.3 Hindu Deity Pages (8 files)

| File | Check Firebase Doc |
|------|-------------------|
| mythos/hindu/deities/lakshmi.html | `hindu_lakshmi` |
| mythos/hindu/deities/parvati.html | `hindu_parvati` |
| mythos/hindu/deities/kali.html | `hindu_kali` |
| mythos/hindu/deities/rati.html | `hindu_rati` |
| mythos/hindu/deities/indra.html | `hindu_indra` |
| mythos/hindu/deities/ganesha.html | `hindu_ganesha` |
| mythos/hindu/deities/saraswati.html | `hindu_saraswati` |
| mythos/hindu/deities/yami.html | `hindu_yami` |

---

### 2.4 Other Deity Pages (6 files)

| File | Mythology | Check Firebase Doc |
|------|-----------|-------------------|
| mythos/norse/deities/frigg.html | Norse | `norse_frigg` |
| mythos/japanese/deities/okuninushi.html | Japanese | `japanese_okuninushi` |
| mythos/chinese/deities/jade-emperor.html | Chinese | `chinese_jade-emperor` |
| mythos/chinese/deities/erlang-shen.html | Chinese | `chinese_erlang-shen` |
| mythos/celtic/deities/lugh.html | Celtic | `celtic_lugh` |
| mythos/celtic/deities/morrigan.html | Celtic | `celtic_morrigan` |

---

### 2.5 Yoruba Deities (4 files)

**Special Case:** Yoruba may not have full Firebase implementation yet.

```
mythos/yoruba/deities/yemoja.html (1,479 words)
mythos/yoruba/deities/ogun.html (1,244 words)
mythos/yoruba/deities/shango.html (1,446 words)
mythos/yoruba/deities/oshun.html (1,657 words)
```

**Action:** Check if `yoruba_*` docs exist. If not, create Firebase docs from these HTML files.

---

### 2.6 Native American Spirits (4 files)

```
mythos/native_american/spirits/coyote.html (1,248 words)
mythos/native_american/spirits/thunderbird.html (1,214 words)
mythos/native_american/spirits/raven.html (1,589 words)
```

**Action:** Check Firebase implementation status for Native American mythology.

---

### 2.7 Misc Pages Needing Review (6 files)

| File | Reason for Review |
|------|------------------|
| mythos/greek/myths/judgment-of-paris.html | Story/myth page - check if `myths` collection exists |
| mythos/norse/realms/helheim.html | Realm description - check `norse_helheim` |
| mythos/norse/cosmology/creation.html | Mapped to Chinese creation (WRONG) - check `norse_creation` |
| mythos/persian/cosmology/creation.html | Check `persian_creation` |
| mythos/persian/heroes/zoroaster.html | Check `persian_zoroaster` |
| mythos/mayan/deities/chaac.html | Check `mayan_chaac` |

---

## Category 3: SAFE TO MIGRATE (14 files)

These files are **already Firebase-enabled** and can be deprecated after verification.

### Process:
1. Verify Firebase document exists and has complete data
2. Compare HTML boilerplate vs Firebase content
3. If Firebase has all content, deprecate HTML file
4. Move to `_deprecated/` directory with timestamp

### Files Ready for Deprecation:

```javascript
// All have data-entity attributes and load from Firebase
{
  file: "mythos/babylonian/creatures/mushussu.html",
  entity: "mushussu",
  collection: "creatures",
  verify: "db.collection('creatures').doc('babylonian_mushussu').get()"
},
{
  file: "mythos/sumerian/cosmology/anunnaki.html",
  entity: "anunnaki",
  collection: "cosmology",
  verify: "db.collection('cosmology').doc('sumerian_anunnaki').get()"
},
{
  file: "mythos/tarot/deities/high-priestess.html",
  entity: "high-priestess",
  collection: "deities",
  verify: "db.collection('deities').doc('tarot_high-priestess').get()"
},
{
  file: "mythos/babylonian/cosmology/apsu.html",
  entity: "apsu",
  collection: "cosmology",
  verify: "db.collection('cosmology').doc('babylonian_apsu').get()"
},
{
  file: "mythos/buddhist/cosmology/samsara.html",
  entity: "samsara",
  collection: "cosmology",
  verify: "db.collection('cosmology').doc('buddhist_samsara').get()"
},
{
  file: "mythos/hindu/deities/shiva.html",
  entity: "shiva",
  collection: "deities",
  verify: "db.collection('deities').doc('hindu_shiva').get()"
},
{
  file: "mythos/tarot/deities/fool.html",
  entity: "fool",
  collection: "deities",
  verify: "db.collection('deities').doc('tarot_fool').get()"
},
{
  file: "mythos/tarot/deities/lovers.html",
  entity: "lovers",
  collection: "deities",
  verify: "db.collection('deities').doc('tarot_lovers').get()"
},
{
  file: "mythos/buddhist/creatures/nagas.html",
  entity: "nagas",
  collection: "creatures",
  verify: "db.collection('creatures').doc('buddhist_nagas').get()"
},
{
  file: "mythos/chinese/deities/zao-jun.html",
  entity: "zao-jun",
  collection: "deities",
  verify: "db.collection('deities').doc('chinese_zao-jun').get()"
},
{
  file: "mythos/chinese/deities/dragon-kings.html",
  entity: "dragon-kings",
  collection: "deities",
  verify: "db.collection('deities').doc('chinese_dragon-kings').get()"
},
{
  file: "mythos/roman/deities/minerva.html",
  entity: "minerva",
  collection: "deities",
  verify: "db.collection('deities').doc('roman_minerva').get()"
},
{
  file: "mythos/roman/deities/juno.html",
  entity: "juno",
  collection: "deities",
  verify: "db.collection('deities').doc('roman_juno').get()"
},
{
  file: "mythos/buddhist/concepts/compassion.html",
  entity: "compassion",
  collection: "concepts",
  verify: "db.collection('concepts').doc('buddhist_compassion').get()"
}
```

### Deprecation Script:

```bash
#!/bin/bash
# migrate_firebase_enabled.sh

DEPRECATED_DIR="_deprecated/batch-1-2-firebase-enabled"
mkdir -p "$DEPRECATED_DIR"

# List of Firebase-enabled files
files=(
  "mythos/babylonian/creatures/mushussu.html"
  "mythos/sumerian/cosmology/anunnaki.html"
  "mythos/tarot/deities/high-priestess.html"
  "mythos/babylonian/cosmology/apsu.html"
  "mythos/buddhist/cosmology/samsara.html"
  "mythos/hindu/deities/shiva.html"
  "mythos/tarot/deities/fool.html"
  "mythos/tarot/deities/lovers.html"
  "mythos/buddhist/creatures/nagas.html"
  "mythos/chinese/deities/zao-jun.html"
  "mythos/chinese/deities/dragon-kings.html"
  "mythos/roman/deities/minerva.html"
  "mythos/roman/deities/juno.html"
  "mythos/buddhist/concepts/compassion.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Moving $file to $DEPRECATED_DIR/"
    mv "$file" "$DEPRECATED_DIR/$(basename $file)"
  fi
done

echo "Complete. Moved ${#files[@]} files to $DEPRECATED_DIR/"
```

---

## Migration Examples

### Example 1: Deity with Content Gap

**File:** `mythos/hindu/deities/lakshmi.html`
**Firebase Doc:** `deities/hindu_lakshmi`

**Step 1:** Read HTML content
```bash
# Extract word count and unique content
grep -o '\w\+' mythos/hindu/deities/lakshmi.html | wc -l
# Result: 1,602 words
```

**Step 2:** Query Firebase
```javascript
const lakshmiDoc = await db.collection('deities').doc('hindu_lakshmi').get();
const firebaseData = lakshmiDoc.data();

console.log('Firebase word count:',
  JSON.stringify(firebaseData).split(' ').length);
// If significantly less than 1,602, there's a gap
```

**Step 3:** Compare Content
```javascript
// Extract HTML main content (skip boilerplate)
const htmlContent = extractMainContent('mythos/hindu/deities/lakshmi.html');

// Check what's in Firebase
const firebaseContent = {
  name: firebaseData.name,
  description: firebaseData.description,
  symbolism: firebaseData.symbolism,
  powers: firebaseData.powers
};

// Identify gaps
const gaps = findContentGaps(htmlContent, firebaseContent);
```

**Step 4:** Merge Content
```javascript
// If gaps exist, update Firebase
await db.collection('deities').doc('hindu_lakshmi').update({
  extendedDescription: gaps.uniqueContent,
  sources: ['HTML migration', ...firebaseData.sources],
  migrationDate: new Date()
});
```

**Step 5:** Verify and Deprecate
```javascript
// Re-read Firebase
const updatedDoc = await db.collection('deities').doc('hindu_lakshmi').get();

// Verify completeness
if (hasAllContent(updatedDoc.data(), htmlContent)) {
  // Move HTML to deprecated
  moveToDeprecated('mythos/hindu/deities/lakshmi.html');
}
```

---

### Example 2: Creating New Firebase Document

**File:** `mythos/yoruba/deities/oshun.html` (1,657 words)
**Firebase Doc:** Doesn't exist yet

**Step 1:** Extract Structured Data
```javascript
const htmlData = parseDeityHTML('mythos/yoruba/deities/oshun.html');

const newDoc = {
  id: 'yoruba_oshun',
  name: 'Oshun',
  alternateNames: htmlData.alternateNames || [],
  mythology: 'yoruba',
  type: 'deity',
  role: htmlData.role || 'Goddess of Love and Rivers',
  description: htmlData.description,
  symbolism: htmlData.symbolism,
  powers: htmlData.powers,
  relatedEntities: htmlData.relatedEntities,
  myths: htmlData.myths,
  sources: ['HTML migration'],
  created: new Date(),
  wordCount: 1657
};
```

**Step 2:** Create Firebase Document
```javascript
await db.collection('deities').doc('yoruba_oshun').set(newDoc);
console.log('Created yoruba_oshun in Firebase');
```

**Step 3:** Update HTML to Firebase-Enabled
```html
<!-- Replace static content with Firebase loader -->
<div class="entity-detail"
     data-entity="yoruba_oshun"
     data-collection="deities">
  <!-- Content loads from Firebase -->
</div>

<script src="/js/entity-renderer-firebase.js"></script>
```

**Step 4:** Test and Verify
```javascript
// Load page and verify Firebase content displays
// If successful, consider HTML "migrated"
```

---

## Filtering Rules for Future Batches

To prevent these files from appearing in future migration batches:

### Path-Based Exclusions

```javascript
const excludePaths = [
  'admin/**/*',
  'visualizations/**/*',
  'theories/**/*',
  'magic/**/*',
  'spiritual-items/**/*',
  'herbalism/**/*',
  'mythos/jewish/kabbalah/**/*',
  'mythos/christian/gnostic/**/*',
  'mythos/christian/teachings/**/*',
  'mythos/christian/texts/revelation/**/*',
  'mythos/christian/lineage/**/*',
  'mythos/christian/theology/**/*',
  'mythos/comparative/**/*',
  'mythos/jewish/heroes/enoch/**/*',
  'mythos/jewish/texts/**/*',
  'mythos/apocryphal/**/*'
];
```

### Filename Pattern Exclusions

```javascript
const excludePatterns = [
  '*-template.html',
  '*-backup.html',
  'index-*.html',
  'edit.html',
  'create-wizard.html',
  'auth-modal-*.html'
];
```

### Firebase-Enabled Detection

```javascript
function isFirebaseEnabled(htmlContent) {
  return htmlContent.includes('data-entity=') &&
         htmlContent.includes('entity-renderer-firebase.js');
}

// Exclude files that are already Firebase-enabled
if (isFirebaseEnabled(fileContent)) {
  skipFile = true;
}
```

### Content Type Detection

```javascript
function getContentType(filePath, wordCount) {
  // Theoretical/analytical content
  if (wordCount > 1500 &&
      (filePath.includes('theories/') ||
       filePath.includes('comparative/') ||
       filePath.includes('gnostic/'))) {
    return 'ANALYTICAL_ESSAY';
  }

  // Framework/overview content
  if (filePath.includes('overview.html') ||
      filePath.includes('structure.html') ||
      filePath.includes('-integration.html')) {
    return 'FRAMEWORK';
  }

  // Standard entity page
  return 'ENTITY';
}

// Only migrate ENTITY type
if (getContentType(file.path, file.wordCount) !== 'ENTITY') {
  skipFile = true;
}
```

---

## Migration Workflow

### Phase 1: Deprecate Firebase-Enabled Files (14 files)

**Timeline:** 1 hour
**Risk:** Very Low

```bash
# Run deprecation script
./scripts/migrate_firebase_enabled.sh

# Verify all files moved
ls _deprecated/batch-1-2-firebase-enabled/ | wc -l
# Should show: 14
```

---

### Phase 2: Review Deity Pages (38 files)

**Timeline:** 2-4 hours (manual)
**Risk:** Medium

For each file in NEEDS REVIEW category:
1. Open HTML file
2. Query Firebase for corresponding document
3. Compare content
4. Take action:
   - **Firebase complete:** Deprecate HTML
   - **Firebase missing content:** Extract and merge
   - **No Firebase doc:** Create new document

**Tool:** Create review dashboard
```html
<!-- review-dashboard.html -->
<script>
async function reviewDeity(htmlFile, expectedFirebaseDoc) {
  const htmlContent = await fetch(htmlFile).then(r => r.text());
  const firebaseDoc = await db.collection('deities').doc(expectedFirebaseDoc).get();

  return {
    htmlWordCount: countWords(htmlContent),
    firebaseExists: firebaseDoc.exists,
    firebaseWordCount: firebaseDoc.exists ? countWords(JSON.stringify(firebaseDoc.data())) : 0,
    recommendation: getRecommendation(htmlContent, firebaseDoc)
  };
}
</script>
```

---

### Phase 3: Update Exclusion Filters

**Timeline:** 30 minutes
**Risk:** Low

Update batch generation script:
```javascript
// In batch-generator.js
const EXCLUDE_PATHS = [
  'admin/**/*',
  'visualizations/**/*',
  // ... add all paths from filtering rules
];

const EXCLUDE_PATTERNS = [
  '*-template.html',
  '*-backup.html',
  // ... add all patterns
];

function shouldExclude(file) {
  return EXCLUDE_PATHS.some(pattern => minimatch(file, pattern)) ||
         EXCLUDE_PATTERNS.some(pattern => minimatch(file, pattern)) ||
         isFirebaseEnabled(file);
}
```

---

## Summary Statistics

| Category | Files | % of Total | Action |
|----------|-------|-----------|--------|
| DO NOT MIGRATE | 156 | 75% | Preserve as-is |
| NEEDS REVIEW | 38 | 18% | Manual verification |
| SAFE TO MIGRATE | 14 | 7% | Deprecate after verification |
| **TOTAL** | **208** | **100%** | |

### Breakdown by Content Type:

| Type | Count | Future Strategy |
|------|-------|----------------|
| System files | 13 | Permanent exclusion |
| Theoretical essays | 24 | Create `theories` collection |
| Kabbalah framework | 27 | Create `kabbalah` collection |
| Gnostic theology | 18 | Create `gnostic_texts` collection |
| Sermon on Mount | 9 | Keep as educational HTML |
| Revelation analysis | 26 | Keep as educational HTML |
| Lineage pages | 6 | Keep as framework |
| Comparative studies | 15 | Create `comparative_studies` collection |
| Magic practices | 14 | Create `practices` collection |
| Spiritual items | 7 | Separate migration strategy |
| Deity pages needing review | 38 | Manual Firebase verification |
| Firebase-enabled pages | 14 | Deprecate after verification |

---

## Recommendations

### Immediate Actions (This Week)

1. Run deprecation script for 14 Firebase-enabled files
2. Update batch generation filters to exclude DO NOT MIGRATE paths
3. Start manual review of 38 deity pages (prioritize major mythologies)

### Short Term (Next 2 Weeks)

1. Create new Firebase collections:
   - `theories` for analytical content
   - `comparative_studies` for cross-mythology analysis
   - `practices` for magic/meditation instructions
   - `kabbalah` for Jewish mysticism framework

2. Review and migrate high-value deity pages (Hindu, Roman, Yoruba)

### Long Term (Next Month)

1. Develop strategy for educational framework content (Sermon on Mount, Revelation)
2. Consider creating `educational_series` collection for multi-page frameworks
3. Review whether Gnostic content should stay as HTML or migrate to specialized collection

---

## Contact & Questions

If unclear about any file's categorization:
1. Check the `batches_1_2_categorized.json` file for detailed mapping
2. Review the original batch reports for context
3. Use Firebase console to verify document existence
4. When in doubt, DO NOT migrate - preserve original content

---

**Document Version:** 1.0
**Last Updated:** 2025-12-27
**Prepared by:** Claude Sonnet 4.5

# Display Mode Quick Reference

Quick guide for using the Universal Display Renderer and ensuring entity compatibility.

## Table of Contents
- [Display Modes](#display-modes)
- [Required Fields](#required-fields)
- [Usage Examples](#usage-examples)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Display Modes

### 1️⃣ Page Mode
Full entity page with complete information
```javascript
renderer.render(entities, 'page', '#container');
```

### 2️⃣ Panel Mode
Detailed card with sections
```javascript
renderer.render(entities, 'panel', '#container');
```

### 3️⃣ Grid/Card Mode
2-wide mobile, 4-wide desktop cards
```javascript
renderer.render(entities, 'grid', '#container');
```

### 4️⃣ Table Mode
Sortable table rows
```javascript
renderer.render(entities, 'table', '#container');
```

### 5️⃣ List Mode
Vertical expandable list
```javascript
renderer.render(entities, 'list', '#container');
```

### 6️⃣ Inline Mode
Mini badges in text
```javascript
renderer.render(entities, 'inline');
```

---

## Required Fields

### ✅ All Modes (Minimum)
```json
{
  "id": "entity-id",
  "name": "Entity Name"
}
```

### ✅ Page & Panel Modes
```json
{
  "id": "entity-id",
  "name": "Entity Name",
  "type": "deity",
  "primaryMythology": "greek",
  "fullDescription": "At least 100 characters..."
}
```

### ✅ Card/Grid Mode
```json
{
  "id": "entity-id",
  "name": "Entity Name",
  "icon": "⚡",
  "type": "deity"
}
```

### ✅ Short Description Mode
```json
{
  "id": "entity-id",
  "name": "Entity Name",
  "shortDescription": "At least 50 characters of description..."
}
```

---

## Usage Examples

### Example 1: Render Entity Grid
```javascript
// Load entities from Firebase
const deities = await firebase.collection('entities')
  .where('type', '==', 'deity')
  .where('mythology', '==', 'greek')
  .get();

// Render as grid
const renderer = new UniversalDisplayRenderer({
  defaultDisplayMode: 'grid',
  enableHover: true,
  enableCorpusLinks: true
});

renderer.render(deities, 'grid', 'deity-grid');
```

### Example 2: Render Entity Panel
```javascript
// Load single entity
const zeus = await loadEntity('zeus');

// Render detailed panel
renderer.render([zeus], 'panel', 'entity-details');
```

### Example 3: Render Sortable Table
```javascript
// Load all heroes
const heroes = await firebase.collection('entities')
  .where('type', '==', 'hero')
  .get();

// Render table
renderer.render(heroes, 'table', 'heroes-table');
```

### Example 4: Inline Entity Links
```javascript
// Render entity mentions in text
const relatedEntities = [zeus, hera, athena];
const links = renderer.render(relatedEntities, 'inline');

// Insert into text
document.getElementById('description').innerHTML =
  `Related deities: ${links}`;
```

---

## Verification

### Run Verification Script
```bash
# Check all entities
node scripts/verify-display-modes.js

# Output shows compliance by mode and type
```

### Expected Output
```
📊 SUMMARY
Total Entities:     454
Fully Compliant:    454 (100.00%)

📋 BY DISPLAY MODE
page                 Pass: 1816 | Rate: 100.00%
panel                Pass: 1816 | Rate: 100.00%
card                 Pass: 1362 | Rate: 100.00%
...
```

### Apply Fixes (if needed)
```bash
# Apply automated fixes
node scripts/apply-display-mode-fixes.js scripts/reports/display-mode-fixes-[date].json

# Re-verify
node scripts/verify-display-modes.js
```

---

## Troubleshooting

### ❌ Entity Not Rendering

**Problem:** Entity displays as empty or broken

**Solution:** Check required fields
```javascript
// Minimum for all modes
const hasBasicFields = entity.id && entity.name;

// For grid/card mode
const hasCardFields = hasBasicFields && entity.icon && entity.type;

// For page/panel mode
const hasPageFields = hasBasicFields &&
  entity.fullDescription?.length >= 100 &&
  entity.type &&
  entity.primaryMythology;
```

### ❌ Icon Missing

**Problem:** Entity shows default icon instead of specific icon

**Solution:** Add icon field
```json
{
  "icon": "⚡"  // Single emoji or unicode character
}
```

**Auto-generated icons by type:**
- deity: ✨
- hero: ⚔️
- creature: 🐉
- place: 🏛️
- item: ⚡
- concept: 💭
- magic: 🔮

### ❌ Description Too Short

**Problem:** Entity fails validation for page/panel mode

**Solution:** Ensure descriptions meet minimum length
```json
{
  "shortDescription": "At least 50 characters...",
  "fullDescription": "At least 100 characters..."
}
```

**Auto-fix:** Run verification script to generate descriptions

### ❌ Table Not Sortable

**Problem:** Table headers not clickable

**Solution:** Ensure entities have required fields
```json
{
  "name": "Entity Name",
  "type": "deity",
  "primaryMythology": "greek"
}
```

### ❌ Hover Preview Not Showing

**Problem:** Hover state doesn't show description

**Solution:** Add shortDescription
```json
{
  "shortDescription": "Brief 50+ character description of entity..."
}
```

---

## Field Length Requirements

| Field | Minimum | Recommended | Auto-Generated |
|-------|---------|-------------|----------------|
| `id` | 1 char | kebab-case | ❌ |
| `name` | 1 char | Full name | ❌ |
| `icon` | 1 char | Single emoji | ✅ |
| `type` | 1 char | Valid type | ❌ |
| `shortDescription` | 50 chars | 100-150 chars | ✅ |
| `fullDescription` | 100 chars | 500+ chars | ✅ |
| `primaryMythology` | 1 char | Valid mythology | ✅ |

---

## Adding New Entities

### Template
```json
{
  "id": "entity-id",
  "type": "deity|hero|creature|place|item|concept|magic",
  "name": "Entity Name",
  "icon": "emoji",
  "mythologies": ["greek"],
  "primaryMythology": "greek",
  "shortDescription": "At least 50 characters describing the entity...",
  "fullDescription": "At least 100 characters with comprehensive information about the entity...",
  "tags": ["tag1", "tag2"],
  "relatedEntities": {
    "deities": [],
    "heroes": [],
    "creatures": [],
    "places": [],
    "items": []
  },
  "metadata": {
    "created": "2025-12-27T00:00:00.000Z",
    "version": "2.0"
  }
}
```

### Validation Checklist
- [ ] Unique `id` (kebab-case)
- [ ] Valid `type` (deity, hero, creature, place, item, concept, magic)
- [ ] Clear `name`
- [ ] Appropriate `icon` emoji
- [ ] `shortDescription` ≥ 50 characters
- [ ] `fullDescription` ≥ 100 characters
- [ ] Valid `primaryMythology`
- [ ] Run verification script
- [ ] Test rendering in all modes

---

## Performance Tips

### ⚡ Lazy Loading
```javascript
// Load entities on demand
const loadMore = async (offset, limit) => {
  const entities = await firebase.collection('entities')
    .orderBy('name')
    .startAfter(offset)
    .limit(limit)
    .get();

  renderer.render(entities, 'grid', 'container');
};
```

### ⚡ Caching
```javascript
// Cache rendered HTML
const cache = new Map();

const renderCached = (entities, mode) => {
  const key = `${mode}-${entities.map(e => e.id).join(',')}`;

  if (!cache.has(key)) {
    cache.set(key, renderer.render(entities, mode));
  }

  return cache.get(key);
};
```

### ⚡ Virtual Scrolling
```javascript
// Only render visible entities
const visibleEntities = allEntities.slice(
  scrollPosition,
  scrollPosition + pageSize
);

renderer.render(visibleEntities, 'grid', 'container');
```

---

## Related Files

- **Renderer:** `js/components/universal-display-renderer.js`
- **Verification:** `scripts/verify-display-modes.js`
- **Fix Application:** `scripts/apply-display-mode-fixes.js`
- **Schema:** `data/schemas/entity-schema-v2.json`
- **Full Report:** `DISPLAY_MODE_VERIFICATION_REPORT.md`

---

## Support

For issues or questions:
1. Run verification script
2. Check this quick reference
3. Review full report
4. Check entity schema
5. Test in browser console

**Last Updated:** 2025-12-27

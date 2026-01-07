# Cosmology Enrichment - Quick Start Guide

## What Was Done

26 cosmology entities have been enriched with rich metadata including:
- Structural organization details
- Lists of inhabitants/beings
- Connections to other realms
- Spiritual/philosophical significance
- Cross-cultural parallels
- Primary source citations

## Files Created

### Scripts
- **`scripts/enrich-cosmology-metadata.js`** - Main enrichment processor
- **`scripts/firebase-cosmology-update.js`** - Firebase batch updater (auto-generated)

### Documentation
- **`COSMOLOGY_ENRICHMENT.md`** - Complete technical documentation
- **`ENRICHMENT_SUMMARY.md`** - Detailed statistics and results
- **`COSMOLOGY_QUICKSTART.md`** - This file

### Updated Data
- 26 JSON files in `firebase-assets-downloaded/cosmology/` with new `richMetadata` fields

## Quick Deploy to Firebase

### 1. Setup Firebase Admin SDK

```bash
npm install firebase-admin
```

### 2. Get Service Account Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file to your project

### 3. Configure Update Script

Edit `scripts/firebase-cosmology-update.js`:

```javascript
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-firebase-project.firebaseio.com"
});
```

### 4. Run the Update

```bash
node scripts/firebase-cosmology-update.js
```

You'll see output like:
```
Updating 26 cosmology entities...

✓ Updated: greek_underworld
✓ Updated: egyptian_duat
✓ Updated: norse_yggdrasil
...

============================================================
Firebase Update Complete
============================================================
Success: 26
Failed: 0
Total: 26
```

## Using the Enriched Data

### In Frontend Code

```javascript
// Get enriched cosmology entity
const cosmology = await firebase.firestore()
  .collection('cosmology')
  .doc('greek_underworld')
  .get();

const data = cosmology.data();

// Access rich metadata
console.log(data.richMetadata.structure);      // How it's organized
console.log(data.richMetadata.inhabitants);    // Who lives there
console.log(data.richMetadata.connections);    // Connected realms
console.log(data.richMetadata.significance);   // Why it matters
console.log(data.richMetadata.parallels);      // Similar concepts
console.log(data.richMetadata.sources);        // Primary texts
```

### Display in UI

```javascript
function displayCosmologyCard(entity) {
  const meta = entity.richMetadata;

  return `
    <div class="cosmology-card">
      <h1>${entity.displayName}</h1>
      <p>${entity.description}</p>

      <section class="structure">
        <h3>Structure</h3>
        <p>${meta.structure}</p>
      </section>

      <section class="inhabitants">
        <h3>Inhabitants</h3>
        <ul>
          ${meta.inhabitants.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </section>

      <section class="connections">
        <h3>Connected Realms</h3>
        <ul>
          ${meta.connections.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </section>

      <section class="significance">
        <h3>Significance</h3>
        <p>${meta.significance}</p>
      </section>

      <section class="parallels">
        <h3>Cross-Cultural Parallels</h3>
        <ul>
          ${meta.parallels.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </section>

      <section class="sources">
        <h3>Primary Sources</h3>
        <ul>
          ${meta.sources.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </section>
    </div>
  `;
}
```

## What's Enriched

### Fully Enriched Entities (26)

**Egyptian (3)**
- egyptian_duat - The 12-hour underworld journey
- egyptian_nun - Primordial waters
- egyptian - Category page

**Greek (2)**
- greek_mount-olympus - Home of the 12 Olympians
- greek_underworld - Domain of Hades

**Norse (3)**
- norse_asgard - Realm of the Aesir
- norse_yggdrasil - The World Tree
- norse - Category page

**Buddhist (2)**
- buddhist_realms - The Six Realms
- buddhist_karma - Law of cause and effect

**Christian (3)**
- christian_heaven - Eternal divine dwelling
- christian_trinity - God as three in one
- christian - Category page

**Hindu (2)**
- hindu_karma - Cosmic law of consequence
- hindu - Category page

**Sumerian (2)**
- sumerian_anunnaki - Divine bureaucracy
- sumerian_me - Divine principles

**Tarot/Hermetic (1)**
- tarot_tree-of-life - Map of consciousness

**Other Traditions (8)**
- babylonian, celtic, chinese, creation-amp-origins
- death-amp-the-afterlife, islamic, persian, roman

## Data Structure

Each enriched entity has this structure:

```json
{
  "id": "greek_underworld",
  "displayName": "💀 The Greek Underworld",
  "description": "...",
  "mythology": "greek",
  "inhabitants": ["Hades", "Persephone", ...],
  "connections": ["Mount Olympus", "Earth", ...],

  "richMetadata": {
    "structure": "The Greek Underworld is divided into distinct regions...",
    "inhabitants": ["Hades - king", "Persephone - queen", ...],
    "connections": ["Mount Olympus - entry point", ...],
    "significance": "The Greek Underworld represents the inevitable fate...",
    "parallels": [
      "Egyptian Duat - underworld journey",
      "Mesopotamian Irkalla - land of the dead",
      ...
    ],
    "sources": [
      "Homer's Odyssey (Book 11)",
      "Virgil's Aeneid (Book 6)",
      ...
    ],
    "enrichedAt": "2026-01-01T03:34:52.027Z",
    "enrichmentVersion": "2.0"
  }
}
```

## Adding More Enrichments

To add enrichment for a new entity:

### 1. Edit `scripts/enrich-cosmology-metadata.js`

Add a new template in the `cosmologyEnrichment` object:

```javascript
greek_creation: {
  structure: "Description of how creation unfolds...",
  inhabitants: ["Titan 1", "Titan 2", ...],
  connections: ["Tartarus", "Chaos", ...],
  significance: "Why this creation matters...",
  parallels: ["Similar creation in Tradition X", ...],
  sources: ["Hesiod's Theogony", ...]
}
```

### 2. Run Enrichment

```bash
node scripts/enrich-cosmology-metadata.js
```

### 3. Deploy to Firebase

```bash
node scripts/firebase-cosmology-update.js
```

## Checking Your Work

### Verify in Firebase Console

1. Navigate to Firestore
2. Go to `cosmology` collection
3. Open any enriched document
4. Look for `richMetadata` field with nested structure

### Verify in Local Files

Check the JSON files in `firebase-assets-downloaded/cosmology/`:

```bash
# Show enriched cosmology entity
cat firebase-assets-downloaded/cosmology/greek_underworld.json | jq '.richMetadata'
```

## Troubleshooting

### Firebase Update Fails

**Problem:** "admin.firestore() not initialized"

**Solution:** Make sure you configured service account credentials:
```javascript
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

### Permission Denied

**Problem:** "Permission denied on 'cosmology' collection"

**Solution:** Check Firebase Firestore rules:
```firestore
match /cosmology/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == '<admin-uid>';
}
```

### Missing Rich Metadata

**Problem:** Entity exists but has no `richMetadata`

**Solution:**
1. Add enrichment template
2. Re-run `enrich-cosmology-metadata.js`
3. Check output matches entity ID
4. Re-deploy to Firebase

## Next Steps

### Short Term
1. Deploy enriched data to Firebase (see Quick Deploy section)
2. Update UI components to display richMetadata fields
3. Create interconnected realm navigation

### Medium Term
1. Add enrichment for remaining 54 cosmology entities
2. Create visual diagrams of realm connections
3. Implement comparative mythology browser

### Long Term
1. Add multilingual enrichment support
2. Integrate multimedia sources
3. Develop AI-assisted enrichment suggestions

## Reference

- **Full Documentation:** See `COSMOLOGY_ENRICHMENT.md`
- **Statistics:** See `ENRICHMENT_SUMMARY.md`
- **Enrichment Script:** `scripts/enrich-cosmology-metadata.js`
- **Update Script:** `scripts/firebase-cosmology-update.js`

## Contact & Support

For issues with:
- **Enrichment scripts:** Check `scripts/enrich-cosmology-metadata.js` logs
- **Firebase deployment:** Review service account credentials
- **Data accuracy:** Consult COSMOLOGY_ENRICHMENT.md sources section
- **Project architecture:** See CLAUDE.md

---

**Ready to deploy?** Jump to [Quick Deploy to Firebase](#quick-deploy-to-firebase)

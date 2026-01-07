# Hero Metadata Enrichment Guide

## Overview

This guide explains the hero metadata enrichment system for the Eyes of Azrael mythology encyclopedia. The enrichment scripts automatically populate rich, historically-accurate metadata for hero entities across all mythologies.

## What Gets Enriched

Each hero entity receives the following metadata fields:

### 1. Quests (Adventures)
Famous adventures, journeys, and achievements the hero undertook.

**Example - Achilles:**
- Trojan War - Led the Myrmidons against Troy
- Defense of Greek honor - Avenged Patroclus' death
- The Funeral Games - Honored fallen heroes

### 2. Allies (Companions)
Associated companions, supporters, and divine patrons who aided the hero.

**Example - Heracles:**
- Zeus - Divine father
- Athena - Goddess of wisdom and battle strategy
- Iolaus - Cousin and companion, helped with Hydra
- Jason - Led the Argonauts
- Theseus - Fellow hero

### 3. Enemies (Antagonists)
Adversaries, monsters, and opposing forces the hero faced.

**Example - Perseus:**
- Medusa - The Gorgon with serpent hair
- Polydectes - King seeking to seduce Danaë
- Cetus - Sea monster threatening Andromeda
- Acrisius - His grandfather (indirect antagonist)

### 4. Weapons (Signature Items)
Distinctive weapons, artifacts, and tools used by the hero.

**Example - Heracles:**
- Adamantine Club (Olive Wood) - Signature weapon
- Bow and Arrows - Tipped with Hydra venom
- Sword - Bronze blade
- Lion Skin - Wore Nemean lion as armor

### 5. Abilities (Powers & Skills)
Special skills, supernatural powers, and exceptional talents.

**Example - Odysseus:**
- Strategic cunning - Master tactician
- Oratory skill - Persuasive speaker
- Resourcefulness - Problem solver
- Endurance - Survived 20 years away from home
- Disguise mastery - Changed appearance with Athena
- Leadership - Commanded respect of men

### 6. Parentage (Ancestry)
Divine or notable ancestry, divine heritage, and family lineage.

**Example - Krishna:**
```json
{
  "divine": "Vishnu - Preserver god, eighth avatar",
  "mortal": "Devaki - Mother; Vasudeva - Father",
  "heritage": "Divine incarnation, supreme lord"
}
```

## Covered Mythologies

The enrichment script includes detailed metadata for heroes from:

- **Greek Mythology**: Achilles, Heracles, Odysseus, Perseus, Theseus, Jason, Orpheus
- **Norse Mythology**: Sigurd the Dragon-Slayer
- **Hindu Mythology**: Krishna, Rama
- **Sumerian Mythology**: Gilgamesh
- **Islamic Tradition**: Abraham (Ibrahim)
- **Jewish Tradition**: Moses (Musa)
- **Christian Tradition**: Jesus Christ

Additional heroes in the system receive basic enrichment with available data.

## Usage

### Step 1: Preview Changes (Dry Run)

First, preview what will be enriched without making changes:

```bash
cd h:\Github\EyesOfAzrael
node scripts/enrich-hero-metadata.js --dry-run
```

**Output:**
```
Loading hero data...
Found 116 heroes to process

================================================================================
ENRICHMENT RESULTS
================================================================================

Achilles (greek_achilles)
  Quests: 3
  Allies: 5
  Enemies: 4
  Weapons: 4
  Abilities: 5
  ✓ Parentage data included
```

### Step 2: Apply Enrichment to Local Files

Apply the enrichment to local JSON files:

```bash
node scripts/enrich-hero-metadata.js
```

This updates the hero JSON files in `firebase-assets-downloaded/heroes/` with the enriched metadata.

### Step 3: Update Firebase (Optional)

To push the enriched data to Firebase:

```bash
# First, preview what would be updated
node scripts/update-heroes-firebase.js --dry-run

# Then apply the updates
node scripts/update-heroes-firebase.js
```

**Prerequisites for Firebase update:**
1. Install Firebase Admin SDK: `npm install firebase-admin`
2. Set environment variable: `export FIREBASE_PROJECT_ID=your-project-id`
3. Ensure Firebase credentials are available (via ADC, service account file, etc.)

## Enrichment Data Format

### Quests Array
```json
"quests": [
  "Quest name - Brief description of what happened",
  "Another quest - What the hero accomplished"
]
```

### Allies Array
```json
"allies": [
  "Name - Role and relationship",
  "Companion - What they contributed"
]
```

### Enemies Array
```json
"enemies": [
  "Antagonist - What role they played",
  "Monster - What they represented"
]
```

### Weapons Array
```json
"weapons": [
  "Weapon name - Its properties and origin",
  "Item - How it was used"
]
```

### Abilities Array
```json
"abilities": [
  "Ability name - Description of the power",
  "Skill - How it was utilized"
]
```

### Parentage Object
```json
"parentage": {
  "divine": "Divine parent (if applicable)",
  "mortal": "Mortal parent(s)",
  "heritage": "Overall heritage description"
}
```

## Data Sources

The enrichment data is derived from:

1. **Classic Mythology Texts**
   - Homer's *Iliad* and *Odyssey*
   - Hesiod's *Theogony* and *Works and Days*
   - Ovid's *Metamorphoses*
   - Apollonius's *Argonautica*

2. **Sacred Texts**
   - The Rigveda and Mahabharata (Hindu)
   - The Epic of Gilgamesh (Sumerian)
   - The Bible (Christian, Jewish, Islamic)
   - The Quran (Islamic)
   - Norse Sagas and Eddas

3. **Scholarly Works**
   - Modern mythological encyclopedias
   - Academic comparative mythology studies
   - Cultural and historical analyses

## Script Options

### enrich-hero-metadata.js

```bash
# Dry run - preview only
node scripts/enrich-hero-metadata.js --dry-run

# Enrich specific hero
node scripts/enrich-hero-metadata.js --hero-id=greek_achilles

# Enrich all heroes
node scripts/enrich-hero-metadata.js
```

### update-heroes-firebase.js

```bash
# Preview Firebase updates
node scripts/update-heroes-firebase.js --dry-run

# Update with custom batch size
node scripts/update-heroes-firebase.js --batch-size=50

# Apply updates
node scripts/update-heroes-firebase.js
```

## Metadata Tracking

When heroes are enriched, the script adds metadata tracking:

```json
"metadata": {
  "enrichedBy": "hero-metadata-enricher",
  "enrichedAt": "2026-01-01T12:00:00.000Z",
  "metadataVersion": "1.0",
  "fieldsEnriched": [
    "quests",
    "allies",
    "enemies",
    "weapons",
    "abilities",
    "parentage"
  ]
}
```

This allows you to:
- Track when enrichment occurred
- Identify which fields were enriched
- Distinguish between original and enriched data
- Plan future updates

## Extending the Enrichment

To add enrichment data for additional heroes:

1. **Add to heroMetadata object** in `scripts/enrich-hero-metadata.js`:

```javascript
const heroMetadata = {
  // ... existing entries ...

  new_hero_id: {
    quests: [
      'Quest 1 - Description',
      'Quest 2 - Description'
    ],
    allies: [
      'Ally name - Relationship'
    ],
    enemies: [
      'Enemy - Role'
    ],
    weapons: [
      'Weapon - Description'
    ],
    abilities: [
      'Ability - What it does'
    ],
    parentage: {
      divine: 'Divine parent',
      mortal: 'Mortal parent',
      heritage: 'Heritage description'
    }
  }
};
```

2. **Run the enrichment** for that specific hero:

```bash
node scripts/enrich-hero-metadata.js --hero-id=new_hero_id
```

## Validation

To validate enriched data:

```javascript
// Check that enriched fields have proper structure
const heroFile = require('./firebase-assets-downloaded/heroes/greek_achilles.json');

console.log('Quests:', Array.isArray(heroFile.quests)); // true
console.log('Allies count:', heroFile.allies.length); // > 0
console.log('Has parentage:', !!heroFile.parentage); // true
```

## Troubleshooting

### Issue: "Hero directory not found"
**Solution:** Ensure you're running from the project root directory:
```bash
cd h:\Github\EyesOfAzrael
node scripts/enrich-hero-metadata.js
```

### Issue: Firebase update fails with credentials error
**Solution:** Set up Firebase credentials:
```bash
# Option 1: Use Application Default Credentials (ADC)
gcloud auth application-default login

# Option 2: Point to service account file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### Issue: Some heroes aren't enriched
**Solution:** Not all heroes have predefined enrichment data. The script enriches:
- Heroes with data in the `heroMetadata` object
- Heroes with existing ally/enemy data in relationships

To add enrichment, follow the "Extending the Enrichment" section above.

## Performance Considerations

- **Local enrichment**: ~5-10 seconds for 116 heroes
- **Firebase batch updates**: ~30 seconds for 116 heroes (with default batch size of 25)
- **Rate limiting**: Automatic 1-second delays between batches to avoid Firebase throttling

## Next Steps

1. Run `node scripts/enrich-hero-metadata.js --dry-run` to preview
2. Run `node scripts/enrich-hero-metadata.js` to apply locally
3. Commit changes to git: `git add firebase-assets-downloaded/heroes/`
4. Run `node scripts/update-heroes-firebase.js` to sync to Firebase
5. Verify in the application that heroes display enriched metadata

## Related Files

- `/scripts/enrich-hero-metadata.js` - Main enrichment script
- `/scripts/update-heroes-firebase.js` - Firebase sync script
- `/firebase-assets-downloaded/heroes/` - Hero data files
- `/js/components/universal-display-renderer.js` - Displays hero metadata
- `/js/universal-entity-renderer.js` - Entity card rendering

## Support

For issues or to add enrichment data for additional heroes, refer to the script documentation in the respective files or consult the project's CLAUDE.md for architecture details.

# Creature Metadata Enrichment Guide

## Overview

This guide explains how to populate rich metadata for creature entities in the Eyes of Azrael database. The enrichment process adds essential creature attributes including abilities, weaknesses, habitat, behavior, classification, and physical descriptions.

## What Gets Enriched

Each creature entity is enriched with the following metadata fields:

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `abilities` | Array<string> | Powers and supernatural skills the creature possesses |
| `weaknesses` | Array<string> | Vulnerabilities and exploitable traits |
| `habitat` | String | Where and how the creature dwells |
| `behavior` | String | Typical actions, temperament, and behavioral patterns |
| `classification` | String | Type of creature (dragon, spirit, beast, celestial, etc.) |
| `physicalDescription` | String | Appearance and physical characteristics |

### Enrichment Metadata

```json
{
  "metadata": {
    "creaturesMetadataEnriched": true,
    "enrichedAt": "2026-01-01T03:34:58.442Z",
    "enrichmentSource": "enrich-creatures-metadata.js",
    "uploadedAt": "2026-01-01T03:35:00.000Z",
    "uploadedVia": "upload-creatures-enriched-to-firebase.js"
  }
}
```

## Scripts

### 1. Enrich Creatures Metadata

**File:** `scripts/enrich-creatures-metadata.js`

Enriches creature JSON files with rich metadata based on predefined enrichment data.

#### Basic Usage

```bash
# Preview changes (dry-run)
node scripts/enrich-creatures-metadata.js --dry-run

# Update local JSON files
node scripts/enrich-creatures-metadata.js

# Upload to Firebase directly (optional)
node scripts/enrich-creatures-metadata.js --upload
```

#### Features

- **Predefined Enrichment Data**: 10+ creatures have carefully crafted abilities, weaknesses, habitats, and behaviors
- **Automatic Fallback**: For creatures without explicit enrichment, extracts data from existing fields
- **Pattern Matching**: Attempts to match creatures by ID patterns for related creatures
- **Validation**: Ensures all required fields are populated
- **Reporting**: Generates detailed JSON report of enrichment results

#### Example Enrichment

**Before:**
```json
{
  "id": "babylonian_mushussu",
  "name": "Babylonian Mythology",
  "type": "creature",
  "mythology": "babylonian"
}
```

**After:**
```json
{
  "id": "babylonian_mushussu",
  "name": "Babylonian Mythology",
  "type": "creature",
  "mythology": "babylonian",
  "abilities": [
    "Venomous Bite: Fangs dripping with lethal poison, killing with a single strike",
    "Impenetrable Scales: Armor-like hide that deflects weapons and spells",
    "Divine Radiance: Surrounded by a terrifying aura that causes enemies to collapse in fear",
    "Hybrid Strength: Combining lion's power, serpent's flexibility, and eagle's speed",
    "Sacred Authority: As Marduk's mount, commands respect from lesser spirits and demons",
    "Guardian Magic: Presence wards off evil and protects sacred spaces"
  ],
  "weaknesses": [
    "Sacred Weapons: Only weapons blessed by Marduk can truly harm it",
    "Counter-Magic: Divine magic opposing Marduk's authority can bind it",
    "Spiritual Exhaustion: Can be weakened by prolonged exposure to chaotic forces"
  ],
  "habitat": "Temples of Babylon, sacred grounds of Marduk",
  "behavior": "Guardian and protector, loyal to Marduk, stands vigilant against chaos",
  "classification": "Dragon",
  "metadata": {
    "creaturesMetadataEnriched": true,
    "enrichedAt": "2026-01-01T03:34:58.442Z",
    "enrichmentSource": "enrich-creatures-metadata.js"
  }
}
```

#### Output

The script generates:
1. **Updated JSON Files**: All creature files in `firebase-assets-downloaded/creatures/`
2. **Enrichment Report**: `CREATURES_ENRICHMENT_REPORT.json` with detailed statistics

### 2. Upload Enriched Creatures to Firebase

**File:** `scripts/upload-creatures-enriched-to-firebase.js`

Uploads enriched creature data from local JSON files to Firebase Firestore.

#### Basic Usage

```bash
# Preview uploads (dry-run)
node scripts/upload-creatures-enriched-to-firebase.js --dry-run

# Upload all creatures
node scripts/upload-creatures-enriched-to-firebase.js

# Upload only creatures matching a pattern
node scripts/upload-creatures-enriched-to-firebase.js --filter=greek

# Adjust batch size (default: 100, max: 500)
node scripts/upload-creatures-enriched-to-firebase.js --batch-size=200
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Preview changes without modifying Firebase | `--dry-run` |
| `--filter=pattern` | Only upload creatures matching the pattern | `--filter=greek` |
| `--batch-size=N` | Set Firestore batch size (default: 100) | `--batch-size=200` |

#### Requirements

- Valid Firebase service account JSON file
- Firebase project with `creatures` collection
- Enriched JSON files from Step 1

#### Output

The script generates:
1. **Firebase Updates**: All creature documents in the `creatures` collection
2. **Upload Report**: `CREATURES_UPLOAD_REPORT.json` with upload statistics

## Enrichment Data

### Predefined Creatures (Detailed Enrichment)

The script includes predefined enrichment data for 12+ creatures:

#### Babylonian Mythology
- **Mushussu**: Dragon guardian of Marduk
- **Scorpion-Men**: Hybrid sentinels

#### Greek Mythology
- **Medusa**: Gorgon with petrifying gaze
- **Hydra**: Multi-headed serpent with regeneration
- **Pegasus**: Divine winged steed
- **Minotaur**: Bull-human hybrid in the labyrinth

#### Buddhist/Hindu Mythology
- **Nagas**: Serpent deities with weather control
- **Garuda**: Divine eagle
- **Makara**: Composite aquatic beast

#### Islamic Mythology
- **Jinn**: Spirits created from smokeless fire

#### Norse Mythology
- **Jotnar**: Giants of Jotunheim

#### Egyptian Mythology
- **Sphinx**: Riddling guardian

#### Christian Mythology
- **Seraphim**: Celestial beings

### Adding New Creature Enrichment

To add enrichment for new creatures, edit the `CREATURE_METADATA` object in `enrich-creatures-metadata.js`:

```javascript
const CREATURE_METADATA = {
  'new_creature_id': {
    classification: 'Creature Type',
    habitat: 'Where it dwells...',
    behavior: 'How it acts...',
    abilities: [
      'Ability 1: Description',
      'Ability 2: Description'
    ],
    weaknesses: [
      'Weakness 1: Description',
      'Weakness 2: Description'
    ]
  }
};
```

## Workflow

### Complete Enrichment & Upload

1. **Enrich Local Files**
   ```bash
   node scripts/enrich-creatures-metadata.js --dry-run
   # Review changes
   node scripts/enrich-creatures-metadata.js
   ```

2. **Upload to Firebase**
   ```bash
   node scripts/upload-creatures-enriched-to-firebase.js --dry-run
   # Review uploads
   node scripts/upload-creatures-enriched-to-firebase.js
   ```

3. **Verify in Firebase**
   - Check Firebase Console for updated creature documents
   - Verify metadata fields are populated
   - Test on staging environment

### Partial Updates

```bash
# Enrich only Greek creatures
node scripts/enrich-creatures-metadata.js

# Upload only Greek creatures
node scripts/upload-creatures-enriched-to-firebase.js --filter=greek
```

## Statistics

### Enrichment Coverage

Based on latest enrichment run:

- **Total Creatures**: 75
- **With Abilities**: 57 (76%)
- **With Weaknesses**: 57 (76%)
- **With Habitat**: 56 (75%)
- **With Behavior**: 75 (100%)
- **Successfully Enriched**: 75 (100%)

### Sample Enriched Creatures

| Creature | Classification | Abilities | Weaknesses |
|----------|---|---|---|
| Babylonian Mushussu | Dragon | 6 | 3 |
| Greek Medusa | Gorgon | 4 | 4 |
| Greek Hydra | Hydra | 5 | 4 |
| Buddhist Nagas | Dragon Deity | 7 | 4 |
| Islamic Jinn | Spirit Entity | 5 | 5 |

## Reports Generated

### CREATURES_ENRICHMENT_REPORT.json

Contains:
- Timestamp of enrichment
- Mode (dry-run or update)
- Detailed statistics
- Sample creatures with their enrichment data

### CREATURES_UPLOAD_REPORT.json

Contains:
- Timestamp of upload
- Mode (dry-run or live)
- Upload statistics
- Details of any failures or validation issues

## Troubleshooting

### Script fails to load creatures

**Error**: "Creatures directory not found"

**Solution**: Ensure you're running from the project root:
```bash
cd /path/to/EyesOfAzrael
node scripts/enrich-creatures-metadata.js
```

### Firebase upload fails

**Error**: "Service account file not found"

**Solution**: Ensure the Firebase credentials file exists:
```bash
ls eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json
```

### Some creatures not enriched

**Reason**: Creatures without predefined enrichment data use automatic extraction

**Solution**: Add manual enrichment data in `CREATURE_METADATA` object

## Best Practices

1. **Always test with --dry-run first**
   ```bash
   node scripts/enrich-creatures-metadata.js --dry-run
   node scripts/upload-creatures-enriched-to-firebase.js --dry-run
   ```

2. **Review generated reports**
   - Check `CREATURES_ENRICHMENT_REPORT.json`
   - Check `CREATURES_UPLOAD_REPORT.json`

3. **Verify in Firebase Console**
   - Spot-check updated creatures
   - Verify all fields are populated
   - Test on staging before production

4. **Keep enrichment data up-to-date**
   - Update `CREATURE_METADATA` when adding new creatures
   - Maintain consistent formatting

5. **Use filters for large updates**
   ```bash
   # Upload by mythology
   node scripts/upload-creatures-enriched-to-firebase.js --filter=greek
   node scripts/upload-creatures-enriched-to-firebase.js --filter=buddhist
   ```

## Related Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Data Migration Guide](./DATA_MIGRATION.md)
- [Entity Types Reference](./ENTITY_TYPES.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review script output and generated reports
3. Check Firebase Console for errors
4. Consult project maintainers

---

**Last Updated**: 2026-01-01
**Script Version**: 1.0

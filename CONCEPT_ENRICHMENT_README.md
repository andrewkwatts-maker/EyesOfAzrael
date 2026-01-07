# Concept Entity Metadata Enrichment

This document describes the process of enriching concept entities in the Eyes of Azrael Firebase database with comprehensive metadata.

## Overview

The concept enrichment script automatically populates rich metadata for concept entities with six key fields:

1. **definition** - Clear, comprehensive explanation of the concept
2. **examples** - Concrete instances and manifestations
3. **practitioners** - Who follows, uses, or practices this concept
4. **texts** - Source materials, scriptures, and key references
5. **applications** - How the concept is applied in practice
6. **relatedConcepts** - Connected ideas and parallel concepts across cultures

## Enriched Concepts

The following 14 concepts have been enriched with complete metadata:

### Buddhist Concepts
- `buddhist_bodhisattva` - Enlightened being postponing Nirvana to help others
- `buddhist_compassion` - Karuna virtue of wishing beings freedom from suffering

### Christian Concepts
- `christian_demiurge-vs-monad` - Gnostic distinction between false and true divinity

### Egyptian Concepts
- `egyptian_maat` - Cosmic order, truth, justice, and balance

### Greek Concepts
- `greek_judgment-of-paris` - Beauty contest triggering the Trojan War
- `greek_orpheus` - Legendary musician and his underworld journey
- `greek_persephone` - Goddess of spring and Queen of the Underworld

### Japanese Concepts
- `japanese_amaterasu-cave` - Sun goddess's withdrawal and restoration
- `japanese_creation-of-japan` - Shinto creation myth of Japan
- `japanese_izanagi-yomi` - Creator god's journey to the underworld
- `japanese_susanoo-orochi` - Hero slaying the eight-headed dragon

### Norse Concepts
- `norse_aesir` - Primary pantheon of Norse gods
- `norse_ragnarok` - Prophesied apocalyptic end and rebirth

### Sumerian Concepts
- `sumerian_gilgamesh` - Epic of Gilgamesh, world's oldest literature
- `sumerian_inanna-descent` - Goddess's descent to the underworld

## Enrichment Data Structure

Each enriched concept includes:

### Definition
A comprehensive 1-3 sentence explanation of the concept, its significance, and cultural context.

Example:
```json
"definition": "An enlightened being in Mahayana Buddhism who postpones final Nirvana to help all sentient beings achieve liberation, embodying the ideal of compassionate self-sacrifice and unlimited service."
```

### Examples
4-5 concrete instances, manifestations, or illustrations of the concept in practice.

Example:
```json
"examples": [
  "Avalokiteshvara (Goddess of Compassion)",
  "Manjushri (Embodiment of Wisdom)",
  "Ksitigarbha (Guardian of Hell Realms)",
  "Samantabhadra (Universal Virtue)"
]
```

### Practitioners
4-5 groups or types of people who practice, follow, or engage with this concept.

Example:
```json
"practitioners": [
  "Mahayana Buddhist monks and nuns",
  "Tibetan Buddhist practitioners",
  "Chinese and Japanese Buddhism traditions",
  "All followers of the Bodhisattva path"
]
```

### Texts
4-5 primary sources, scriptures, sacred texts, or key references for this concept.

Example:
```json
"texts": [
  "Bodhisattva Vow (core scriptural commitment)",
  "Lotus Sutra (Saddharmapundarika Sutra)",
  "Jataka Tales (Bodhisattva birth stories)",
  "Shantideva's Bodhisattva Way of Life (Bodhicharyavatara)",
  "Tibetan Buddhist canonical texts"
]
```

### Applications
4-5 practical applications or how the concept is used in spiritual practice, philosophy, art, or society.

Example:
```json
"applications": [
  "Spiritual development through compassion",
  "Meditation on universal suffering and its cessation",
  "Ethical cultivation and moral perfection",
  "Service-oriented practice and teaching",
  "Transformation of enlightenment for communal benefit"
]
```

### Related Concepts
Cross-cultural parallels and connected ideas. Automatically merged with existing relationships in the concept document.

Example:
```json
"relatedConcepts": [
  "Compassion (Karuna)",
  "Enlightenment (Bodhi)",
  "Nirvana",
  "Mahayana Buddhism",
  "Avalokiteshvara"
]
```

## Usage

### Installation

The enrichment script requires Node.js and the following dependencies (already in package.json):
- `firebase-admin` (for Firebase uploads)

### Basic Usage

**Preview changes (dry-run mode):**
```bash
npm run enrich-concepts:dry-run
# or
node scripts/enrich-concept-metadata.js --dry-run
```

**Apply enrichment to all concepts:**
```bash
npm run enrich-concepts:apply
# or
node scripts/enrich-concept-metadata.js --apply
```

**Enrich a specific concept:**
```bash
node scripts/enrich-concept-metadata.js --concept buddhist_bodhisattva --apply
```

**Get help and list available concepts:**
```bash
node scripts/enrich-concept-metadata.js
```

### Command-Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without applying (default if no option specified) |
| `--apply` | Apply enrichment to local files and Firebase |
| `--concept NAME` | Enrich specific concept by filename |

## Implementation Details

### Enrichment Data Source

Enrichment data is defined in two locations:

1. **`scripts/concept-enrichment-data.json`** - Complete enrichment data for all concepts
2. **`scripts/enrich-concept-metadata.js`** - Script that applies the enrichment

### Local File Updates

When applying enrichment, the script:

1. Loads the concept from `firebase-assets-downloaded/concepts/{filename}.json`
2. Merges enrichment data with existing fields
3. Updates metadata with enrichment timestamp and version
4. Preserves all existing data while adding new fields
5. Writes updated JSON back to the same location

### Firebase Synchronization

The script attempts to upload enriched data to Firebase (requires `GOOGLE_APPLICATION_CREDENTIALS` environment variable). If Firebase credentials are not available, enrichment still proceeds on local files.

### Metadata Tracking

Each enriched concept gets updated metadata:
```json
"metadata": {
  "enrichedAt": "2026-01-01T03:39:48.995Z",
  "enrichedBy": "concept-enrichment-script",
  "enrichmentVersion": "1.0"
}
```

## Verification

After enrichment, you can verify the changes:

1. **Check local files:**
   ```bash
   cat firebase-assets-downloaded/concepts/buddhist_bodhisattva.json | jq '.definition'
   ```

2. **Verify in Firebase:**
   - Go to Firebase Console → Firestore → concepts collection
   - Search for concept ID and check the new fields

3. **Check for completeness:**
   ```bash
   node scripts/validate-concept-enrichment.js
   ```

## Maintenance

### Adding New Concepts

To enrich additional concepts:

1. Add enrichment data to `scripts/concept-enrichment-data.json`:
   ```json
   "your_new_concept": {
     "definition": "...",
     "examples": [...],
     "practitioners": [...],
     "texts": [...],
     "applications": [...],
     "relatedConcepts": [...]
   }
   ```

2. Run enrichment:
   ```bash
   node scripts/enrich-concept-metadata.js --concept your_new_concept --apply
   ```

### Updating Existing Enrichments

1. Modify the enrichment data in `scripts/concept-enrichment-data.json`
2. Re-run the script with `--apply`
3. The script will merge new data with existing fields

## Data Format

All enrichment metadata follows these conventions:

### Definition
- Single comprehensive sentence or two closely related sentences
- 150-250 characters
- Includes essential context and significance
- Uses plain language with some technical terms where appropriate

### Examples
- 4-5 items (bullets in JSON array)
- Each 30-80 characters
- Concrete, specific instances (not abstract)
- Relevant to the concept and its practice

### Practitioners
- 4-5 groups or types
- 30-80 characters each
- Specific enough to be meaningful
- Include both historical and contemporary practitioners where applicable

### Texts
- 4-5 key sources
- 40-100 characters each
- Include both primary sources and important modern interpretations
- Format: "Title (Context)" or "Title - Description"

### Applications
- 4-5 distinct applications
- 40-80 characters each
- Focus on practical, real-world use
- Cover spiritual, philosophical, artistic, and social dimensions

### Related Concepts
- 10-20 related concepts
- Cross-cultural parallels where applicable
- Include both specific entities (gods, deities) and abstract concepts
- Automatically merge with existing relationships

## Technical Notes

### Script Architecture

The enrichment script uses the `ConceptEnricher` class with methods:

- `loadLocalConcept(filename)` - Load from local JSON file
- `enrichConcept(concept, enrichment)` - Merge enrichment data
- `processConcept(filename, enrichment)` - Process single concept
- `enrichAll()` - Process all concepts
- `enrichOne(filename)` - Process specific concept
- `printStats()` - Display results

### Error Handling

The script handles:
- Missing concept files (skipped with warning)
- Firebase upload failures (logged but continues)
- JSON parsing errors (caught and reported)
- File system errors (caught and reported)

### Performance

- Dry-run mode: < 1 second for all 14 concepts
- Apply mode: < 2 seconds for all 14 concepts
- Firebase uploads: 5-10 seconds depending on network (not blocking)

## Database Schema

After enrichment, each concept document includes:

```json
{
  "id": "concept_id",
  "type": "concept",
  "mythology": "greek",
  "displayName": "Concept Display Name",
  "name": "Mythology Name",
  "description": "Original description",

  "definition": "Enriched definition",
  "examples": ["Example 1", "Example 2", ...],
  "practitioners": ["Practitioner group 1", ...],
  "texts": ["Text 1", "Text 2", ...],
  "applications": ["Application 1", ...],
  "relatedConcepts": ["Related 1", "Related 2", ...],

  "metadata": {
    "createdAt": "...",
    "enrichedAt": "2026-01-01T03:39:48.995Z",
    "enrichedBy": "concept-enrichment-script",
    "enrichmentVersion": "1.0"
  },

  "isEnriched": true
}
```

## Future Enhancements

Possible improvements:

1. **Auto-generation**: Use Claude API to automatically generate enrichment data
2. **Validation**: Add schema validation for enrichment data
3. **Translation**: Auto-translate enrichment data to multiple languages
4. **Relationships**: Automatically detect and create bidirectional relationships
5. **Enrichment scoring**: Calculate metadata completeness scores
6. **Batch updates**: Support CSV/JSON import for bulk enrichments

## Support and Troubleshooting

### Issue: Firebase credentials not found
**Solution**: Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable or use local-only mode

### Issue: Concept file not found
**Solution**: Verify filename in `scripts/concept-enrichment-data.json` matches actual file in `firebase-assets-downloaded/concepts/`

### Issue: Script not found
**Solution**: Ensure you're running from project root: `node scripts/enrich-concept-metadata.js`

### Issue: Partial enrichment (some concepts skipped)
**Solution**: Check console output for specific error messages and filenames

## References

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Eyes of Azrael Architecture](./CLAUDE.md)
- [Entity Structure Documentation](./docs/entity-structure.md)

## License

This enrichment script is part of Eyes of Azrael and is subject to the project's MIT license.

## Version History

- **v1.0** (2026-01-01) - Initial enrichment of 14 core concepts
  - Buddhist: Bodhisattva, Compassion
  - Christian: Demiurge vs. Monad
  - Egyptian: Ma'at
  - Greek: Judgment of Paris, Orpheus, Persephone
  - Japanese: Amaterasu's Cave, Creation of Japan, Izanagi's Journey, Susanoo & Orochi
  - Norse: Aesir, Ragnarok
  - Sumerian: Gilgamesh, Inanna's Descent

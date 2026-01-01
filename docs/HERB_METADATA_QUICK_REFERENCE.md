# Herb Metadata Quick Reference

## Metadata Structure at a Glance

```json
{
  // Base Fields (Required)
  "id": "herb_id",
  "type": "herb",
  "name": "Herb Name",
  "primaryMythology": "tradition",

  // 7 Rich Metadata Sections (All Required)
  "properties": { magical, medicinal, spiritual },
  "preparations": { primary, alternative, dosage },
  "associations": { deities, concepts, elements, chakras },
  "harvesting": { season, method, conditions },
  "dangers": { toxicity, warnings, contraindications },
  "substitutes": [{ name, reason, tradition }],
  "botanicalInfo": { scientificName, family, nativeRegion, commonNames }
}
```

## Properties Reference

### Magical Properties (Spiritual/Mystical)

**Buddhist**: enlightenment, purity, compassion, wisdom, awakening, rebirth, divine beauty
**Hindu**: devotion, protection, prosperity, divine grace, spiritual elevation
**Islamic**: blessing, healing, mercy, divine remedy, barakah
**Greek**: victory, prophecy, protection, poetic inspiration
**Norse**: protection, journeying, healing, divination

### Medicinal Properties (Health Benefits)

**Universal**: adaptogenic, immune support, anti-inflammatory, digestive support
**Specific**: calming, sedative, stimulating, astringent, tonic, rejuvenating

### Spiritual Properties (Ritual/Practice)

**Buddhist**: meditation, chakra work, dharma practice, Buddha nature
**Hindu**: puja offering, daily worship, mantra practice
**Islamic**: Sunnah practice, ruqyah, spiritual healing
**All traditions**: altar decoration, incense, sacred offering

## Elements Reference

- **Fire**: Warming, stimulating, purification, protection
- **Water**: Calming, purifying, emotional, intuitive
- **Earth**: Grounding, nourishing, stability, fertility
- **Air**: Mental, communication, clarity, purification
- **Space**: Transcendent, void, potential, meditation

## Chakras Reference

1. **Root** (Muladhara) - Red, grounding, earth
2. **Sacral** (Svadhisthana) - Orange, sexuality, creativity
3. **Solar Plexus** (Manipura) - Yellow, power, will
4. **Heart** (Anahata) - Green/Pink, love, compassion
5. **Throat** (Vishuddha) - Blue, communication, truth
6. **Third Eye** (Ajna) - Indigo, intuition, wisdom
7. **Crown** (Sahasrara) - Violet/White, spirituality, enlightenment

## Preparation Methods Template

```json
"preparations": {
  "primary": [
    "METHOD_NAME: specific instructions",
    "ANOTHER_METHOD: step by step"
  ],
  "alternative": [
    "Less common method 1",
    "Less common method 2"
  ],
  "dosage": "Specific amount, frequency, and duration"
}
```

### Common Preparation Types

- **Tea/Infusion**: Steep dried leaves/flowers in hot water (5-15 min)
- **Decoction**: Simmer roots/bark in water (15-30 min)
- **Oil**: Infuse in carrier oil (2-6 weeks)
- **Powder/Churna**: Dry and grind to fine powder
- **Fresh**: Use immediately, no processing
- **Tincture**: Extract in alcohol (2-6 weeks)
- **Paste**: Mix powder with water or oil
- **Incense**: Burn as smoke for ritual

## Harvesting Guidelines

### Seasons
- **Spring**: New growth, leaves
- **Summer**: Flowers, fruits, seeds
- **Autumn**: Mature leaves, seeds, roots
- **Winter**: Dormant period or roots (if applicable)

### Methods
- **Sustainable**: Never harvest entire plant
- **Respectful**: Ask permission, leave offerings
- **Timing**: Harvest at optimal potency (often morning)
- **Processing**: Dry quickly or use fresh immediately

## Danger/Toxicity Levels

| Level | Definition | Examples |
|-------|-----------|----------|
| **Non-toxic** | Safe for all | Lotus, Tulsi |
| **Low toxicity** | Generally safe, minor warnings | Black Seed, Laurel |
| **Moderate** | Use caution, guidance needed | Powerful herbs |
| **High toxicity** | Expert only, dangerous | Yohimbe, Digitalis |

## Deity ID Format

Use exact format from database:
- Buddhist: `gautama_buddha`, `avalokiteshvara`, `tara`, `manjushri`
- Hindu: `vishnu`, `krishna`, `lakshmi`, `shiva`, `brahma`
- Islamic: `allah`, `muhammad`
- Greek: `apollo`, `athena`, `artemis`, `ares`
- Norse: `odin`, `freyja`, `thor`, `frigg`

## Scientific Names (Binomial Format)

```
Genus species
Examples:
- Nelumbo nucifera (Lotus)
- Ocimum sanctum (Tulsi)
- Nigella sativa (Black Seed)
- Laurus nobilis (Laurel)
```

## Substitutes Field

```json
"substitutes": [
  {
    "name": "Alternative Herb Name",
    "reason": "Why this works as substitute - functional similarity",
    "tradition": "tradition_name"
  }
]
```

**Tradition values**: buddhist, hindu, islamic, greek, norse, egyptian, universal

## Validation Checklist

- [ ] All 7 sections present
- [ ] No empty arrays
- [ ] Properties has 3-7 items per category
- [ ] Preparations includes dosage
- [ ] Deities use correct IDs
- [ ] Harvesting season specified
- [ ] Toxicity level stated
- [ ] At least one warning or contraindication
- [ ] Substitutes have reasoning
- [ ] Scientific name is binomial
- [ ] Common names in original language

## Completeness Scoring

**100%** - All fields filled, comprehensive
**80-99%** - Minor gaps, mostly complete
**60-79%** - Significant gaps, needs work
**40-59%** - Sparse data, incomplete
**<40%** - Minimal metadata, needs major work

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Empty arrays | Remove or populate with 2+ items |
| Typos in deity IDs | Use exact IDs from database |
| Vague properties | Use specific, measurable terms |
| Missing dosage | Always include amount and frequency |
| No toxicity level | State toxicity clearly |
| Incomplete harvesting | Include season, method, conditions |
| Wrong chakra names | Use official chakra names |
| No substitutes reasoning | Explain why it works as alternative |

## Entity Linking Example

```json
"associations": {
  "deities": ["avalokiteshvara", "manjushri", "tara"],
  "concepts": ["enlightenment", "compassion", "wisdom"],
  "elements": ["water"],
  "chakras": ["heart", "crown"]
}
```

## Formatting Standards

- **Arrays**: Use lowercase, simple terms
- **Strings**: Full sentences with proper grammar
- **Numbers**: Specific amounts with units (g, ml, tsp, etc.)
- **Names**: Proper case for entities, lowercase for properties
- **Punctuation**: Use in descriptions, not in list items

## Script Commands

```bash
# Validate all herbs
node scripts/validate-herb-metadata.js

# Validate one herb
node scripts/validate-herb-metadata.js herb_id

# Enrich in Firebase
node scripts/enrich-herbs-metadata.js

# Check Firebase (manual)
# Browse to firestore.com → herbs collection
```

## Firebase Fields to Check

After enrichment, verify these fields exist:
- `properties.magical` ✓
- `properties.medicinal` ✓
- `properties.spiritual` ✓
- `preparations.primary` ✓
- `preparations.dosage` ✓
- `associations.deities` ✓
- `harvesting.season` ✓
- `dangers.toxicity` ✓
- `substitutes` ✓
- `botanicalInfo.scientificName` ✓
- `metadata.enrichedWithMetadata` = true ✓

## Adding New Herb Enrichment

1. Open `scripts/enrich-herbs-metadata.js`
2. Find `HERB_ENRICHMENT_DATA`
3. Add new entry:
   ```javascript
   tradition_herbname: {
     properties: { magical: [], medicinal: [], spiritual: [] },
     preparations: { primary: [], alternative: [], dosage: "" },
     // ... complete all 7 sections
   }
   ```
4. Run validation: `node scripts/validate-herb-metadata.js tradition_herbname`
5. Run enrichment: `node scripts/enrich-herbs-metadata.js`

## Common Sections by Tradition

### Buddhist Herbs
- Meditation focus
- Chakra alignment
- Dharma practice
- Buddha/Bodhisattva association
- Sutra references

### Hindu Herbs
- Puja (worship) use
- Deity association
- Dosha balance (Ayurveda)
- Festival use
- Ayurvedic classification

### Islamic Herbs
- Sunnah (Prophet's practice)
- Quranic reference
- Healing emphasis
- Barakah (blessing)
- Prophetic wisdom

### Greek Herbs
- Deity patronage
- Mythological story
- Olympic/athletic use
- Prophecy/divination
- Poetic inspiration

### Norse Herbs
- Rune association
- Warrior/healing use
- Yggdrasil connection
- Seasonal significance
- Magical practice

## Metadata Version

**Current Version**: 2.0
**Released**: 2026-01-01
**Status**: Active

## Need Help?

1. **Schema details**: See `HERB_METADATA_SCHEMA.md`
2. **Full guide**: See `HERB_ENRICHMENT_GUIDE.md`
3. **Validation**: Run `validate-herb-metadata.js`
4. **Examples**: Check completed herbs in Firebase
5. **Errors**: Check validation report

---

**Quick Links**
- Full Schema: [HERB_METADATA_SCHEMA.md](HERB_METADATA_SCHEMA.md)
- Implementation Guide: [HERB_ENRICHMENT_GUIDE.md](HERB_ENRICHMENT_GUIDE.md)
- Enrichment Script: [enrich-herbs-metadata.js](../scripts/enrich-herbs-metadata.js)
- Validation Script: [validate-herb-metadata.js](../scripts/validate-herb-metadata.js)

# Magic Section Entity Migration Report

## Migration Summary

**Date:** 2025-12-06
**Task:** Migrate 42 magical practices from magic/ HTML files to data/entities/magic/ JSON files

## Current State Analysis

### Existing Entities (8)
Already in unified system - these are ritual/festival entities, NOT the magic practice files:
1. `blot.json` - Norse ritual
2. `dionysian-rites.json` - Greek mystery cult
3. `diwali.json` - Hindu festival
4. `eleusinian-mysteries.json` - Greek mystery cult
5. `greek-offerings.json` - Greek ritual practice
6. `mummification.json` - Egyptian ritual
7. `olympic-games.json` - Greek festival
8. `opet-festival.json` - Egyptian festival

**NOTE:** These 8 existing entities are festival/ritual practices, NOT the magic/ HTML practice files. There is NO overlap - all 42 magic practice files need migration.

### HTML Files to Migrate (42 practice files)

#### Divination (6 practices)
1. `astrology.html` - Celestial divination system
2. `geomancy.html` - Earth divination
3. `i-ching.html` - Chinese hexagram divination
4. `oracle-bones.html` - Chinese bone divination
5. `runes.html` - Germanic alphabet divination
6. `tarot.html` - Card-based divination system

#### Energy Work (6 practices)
7. `breathwork.html` - Pranayama breathing techniques
8. `chakra-work.html` - Hindu energy center work
9. `kundalini.html` - Serpent energy awakening
10. `middle-pillar.html` - Kabbalistic energy practice
11. `qigong.html` - Chinese energy cultivation
12. `reiki.html` - Japanese energy healing

#### Practical Magic (6 practices)
13. `candle-magic.html` - Candle spell work
14. `herbalism.html` - Magical plant use
15. `knot-magic.html` - Cord and knot spells
16. `sigil-magic.html` - Symbol magic
17. `spirit-work.html` - Spirit communication
18. `talismans.html` - Charged object creation

#### Ritual Magic (7 practices)
19. `alchemy.html` - Spiritual transformation
20. `ceremonial-magic.html` - Western ritual magic
21. `chaos-magic.html` - Modern paradigm-shifting magic
22. `hoodoo.html` - African-American folk magic
23. `shamanism.html` - Ecstatic journey practice
24. `tantra.html` - Hindu/Buddhist sacred sexuality
25. Note: There's overlap between ritual/ and traditions/ for some (alchemy, shamanism, tantra appear in both)

#### Magical Texts (6 grimoires/texts)
26. `book-of-thoth.html` - Tarot and Egyptian wisdom
27. `corpus-hermeticum.html` - Hermetic philosophy
28. `emerald-tablet.html` - Alchemical text
29. `key-of-solomon.html` - Medieval grimoire
30. `picatrix.html` - Astrological magic grimoire
31. `sefer-yetzirah.html` - Kabbalistic creation text

#### Magical Traditions (12 traditions)
32. `traditions/alchemy.html` - Alchemical tradition
33. `traditions/enochian.html` - Dee's angel magic
34. `traditions/goetia.html` - Demonic evocation
35. `traditions/heka.html` - Egyptian magic
36. `traditions/necromancy.html` - Death magic
37. `traditions/practical-kabbalah.html` - Jewish mysticism
38. `traditions/seidr.html` - Norse sorcery
39. `traditions/shamanism.html` - Global shamanic traditions
40. `traditions/tantra.html` - Tantric magic
41. `traditions/theurgy.html` - Divine magic
42. `traditions/vedic-magic.html` - Vedic magical practices
43. `traditions/voodoo.html` - Haitian Vodou

### Total Count
- **Total HTML files:** 49 (42 practices + 7 index pages)
- **Entity files to create:** 42 (all new)
- **Existing entities:** 8 (different category - festivals/rituals)
- **No duplicates found**

## Migration Categories

### 1. Divination Systems (6)
- **Methodology:** Card/symbol interpretation, casting, pattern reading
- **Mythologies:** Multiple (Babylonian, Greek, Chinese, Norse, Egyptian)
- **Common features:** Tools, spreads/methods, interpretation systems
- **Schema additions:** divination methods, oracle tools, reading techniques

### 2. Energy Work (6)
- **Methodology:** Energy cultivation, chakra balancing, breath control
- **Mythologies:** Hindu, Chinese, Japanese, Kabbalistic
- **Common features:** Energy centers, breathing, meditation, healing
- **Schema additions:** energy channels, chakras/dan tians, techniques

### 3. Practical Magic (6)
- **Methodology:** Spellcraft, object enchantment, folk practices
- **Mythologies:** Universal, European, African diaspora
- **Common features:** Materials, timing, simple rituals
- **Schema additions:** spell components, timing correspondences

### 4. Ritual Magic (7)
- **Methodology:** Ceremonial operations, invocations, transformations
- **Mythologies:** Western esoteric, African diaspora, Global shamanic
- **Common features:** Complex procedures, spirit work, initiations
- **Schema additions:** ritual structure, initiatory stages

### 5. Magical Texts (6)
- **Type:** Grimoires, philosophical treatises, sacred texts
- **Mythologies:** Egyptian, Greek/Hermetic, Jewish, Islamic/Arabic
- **Common features:** Historical texts, translations, magical knowledge
- **Schema additions:** text metadata, historical context, editions

### 6. Magical Traditions (12)
- **Type:** Complete magical systems and lineages
- **Mythologies:** Egyptian, Jewish, Norse, Greek, Haitian, etc.
- **Common features:** Historical development, practitioners, techniques
- **Schema additions:** lineage information, regional variations

## Metadata v2.0 Schema Compliance

Each JSON entity will include:

### Core Fields
- `id`: kebab-case identifier
- `type`: "magic"
- `name`: Practice name
- `icon`: Appropriate emoji
- `slug`: URL-friendly identifier
- `mythologies`: Array of associated mythological traditions
- `primaryMythology`: Main tradition (if applicable)

### Descriptions
- `shortDescription`: 1-2 sentence summary
- `fullDescription`: Comprehensive explanation (3-5 paragraphs)

### Classification
- `category`: "divination", "energy", "practical", "ritual", "text", "tradition"
- `subCategory`: More specific categorization
- `method`: Primary methodology
- `colors`: Primary/secondary colors with RGB values

### Content
- `tags`: Keyword array
- `requirements`: Location, timing, practitioner, preparation, items
- `steps`: Ordered procedure array
- `effects`: Expected results/outcomes
- `warnings`: Precautions and considerations

### Relationships
- `mythologyContexts`: Usage in specific traditions
- `relatedEntities`: Cross-references to deities, places, items, concepts
- `archetypes`: Universal patterns
- `sources`: Primary texts and modern works

### Linguistics
- `linguistic`: Original names, etymology, cognates, scripts

### Geographic & Temporal
- `geographical`: Region, cultural area, origin point
- `temporal`: Timeline position, historical dates, first attestation

## Migration Approach

### Phase 1: Core Divination (6 entities)
Extract from comprehensive HTML:
- Historical origins
- System structure (zodiac, cards, runes, etc.)
- Practice methods
- Cultural variations
- Primary sources

### Phase 2: Energy Work (6 entities)
Focus on:
- Energy anatomy (chakras, meridians, dan tians)
- Breathing/meditation techniques
- Safety warnings
- Lineages and schools
- Benefits and effects

### Phase 3: Practical Magic (6 entities)
Emphasize:
- Materials and correspondences
- Step-by-step procedures
- Timing (lunar, planetary)
- Practical applications
- Modern adaptations

### Phase 4: Ritual Magic (7 entities)
Highlight:
- Ceremonial structure
- Initiatory stages
- Spirit work protocols
- Historical development
- Contemporary practice

### Phase 5: Magical Texts (6 entities)
Document:
- Historical context
- Author/date
- Key contents
- Translations/editions
- Influence on magic

### Phase 6: Magical Traditions (12 entities)
Capture:
- Cultural origins
- Historical development
- Key practitioners
- Core techniques
- Regional variations

## Quality Assurance Checklist

- [ ] All 42 entities created
- [ ] No duplicates with existing 8 entities (verified - different categories)
- [ ] Complete metadata v2.0 compliance
- [ ] Mythology attributions accurate
- [ ] Cross-references validated
- [ ] Sources properly cited
- [ ] Linguistic data complete where available
- [ ] Temporal data with proper date formatting
- [ ] Related entities linked correctly
- [ ] Icons appropriate and consistent

## Statistics Summary

| Category | Count | Status |
|----------|-------|--------|
| Divination | 6 | To migrate |
| Energy Work | 6 | To migrate |
| Practical Magic | 6 | To migrate |
| Ritual Magic | 7 | To migrate |
| Magical Texts | 6 | To migrate |
| Magical Traditions | 12 | To migrate |
| **Total** | **43** | **In progress** |
| Existing (different) | 8 | Complete |
| **Grand Total** | **51** | **Combined** |

## Mythology Distribution

Based on HTML content analysis:

- **Universal/Multiple:** Tarot, Sigil Magic, Candle Magic, Talismans (4)
- **Hindu/Vedic:** Chakra Work, Kundalini, Tantra, Vedic Magic (4)
- **Chinese:** I Ching, Oracle Bones, Qigong (3)
- **Western Esoteric:** Alchemy, Ceremonial Magic, Chaos Magic, Enochian (4)
- **Egyptian:** Heka, Book of Thoth (2)
- **Greek/Hermetic:** Corpus Hermeticum, Emerald Tablet, Theurgy (3)
- **Jewish/Kabbalistic:** Sefer Yetzirah, Practical Kabbalah, Middle Pillar (3)
- **Norse/Germanic:** Runes, Seidr (2)
- **Arabic/Islamic:** Picatrix (1)
- **African Diaspora:** Hoodoo, Voodoo (2)
- **Japanese:** Reiki (1)
- **Medieval European:** Key of Solomon, Goetia, Necromancy (3)
- **Mesopotamian:** Astrology (1)
- **Multiple (Divination):** Geomancy, Astrology (2)
- **Global:** Shamanism, Herbalism, Spirit Work, Knot Magic, Breathwork (5)

## Next Steps

1. Create sample JSON entities demonstrating the pattern
2. Systematically migrate all 42 entities
3. Validate cross-references between entities
4. Update mythology pages to reference new magic entities
5. Create index pages listing practices by category and mythology
6. Generate visualization of practice relationships

## Notes

- HTML files are very comprehensive (1000+ lines each)
- Rich cross-reference network already exists in HTML
- Many practices span multiple mythologies
- Some practices appear in multiple categories (alchemy in both ritual/ and traditions/)
- Modern adaptations well-documented
- Safety warnings important for energy work
- Historical scholarship thorough

## Estimated Completion

- **Per entity:** 15-20 minutes of careful extraction
- **Total time:** 10-14 hours for all 42
- **Recommended approach:** Batch by category for consistency
- **Priority order:** Divination → Practical → Energy → Ritual → Texts → Traditions

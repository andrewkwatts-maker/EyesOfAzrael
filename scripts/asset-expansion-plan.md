# Asset Expansion Plan: 10,000 New Mythology Assets

## Current State
- **Existing Assets**: ~803
- **Target**: 10,000 total assets
- **New Assets Needed**: ~9,200

## Asset Distribution Plan

### 1. Deities (3,500 new assets)

| Mythology | Current | Target | New |
|-----------|---------|--------|-----|
| Greek | ~50 | 150 | 100 |
| Roman | ~30 | 150 | 120 |
| Norse | ~30 | 120 | 90 |
| Egyptian | ~40 | 150 | 110 |
| Hindu | ~40 | 300 | 260 |
| Buddhist | ~20 | 150 | 130 |
| Chinese | ~30 | 200 | 170 |
| Japanese | ~20 | 200 | 180 |
| Celtic | ~20 | 100 | 80 |
| Mesopotamian | ~20 | 150 | 130 |
| Aztec/Mayan | ~15 | 100 | 85 |
| African | ~10 | 200 | 190 |
| Native American | ~5 | 200 | 195 |
| Polynesian | ~5 | 100 | 95 |
| Slavic | ~5 | 100 | 95 |
| Finnish | ~5 | 80 | 75 |
| Korean | ~5 | 100 | 95 |
| Vietnamese | ~2 | 80 | 78 |
| Persian/Zoroastrian | ~20 | 100 | 80 |
| Abrahamic (Angels/Demons) | ~30 | 200 | 170 |
| Other Minor | ~10 | 500 | 490 |

### 2. Creatures (2,000 new assets)

| Category | Examples | Target |
|----------|----------|--------|
| Dragons | Eastern, Western, Wyrms, Sea serpents | 200 |
| Giants | Titans, Jotun, Cyclopes, Oni | 150 |
| Undead | Vampires, Ghosts, Revenants | 150 |
| Shapeshifters | Werewolves, Kitsune, Selkies | 150 |
| Chimeras | Griffin, Manticore, Sphinx | 150 |
| Water creatures | Mermaids, Kappa, Kraken | 200 |
| Flying creatures | Phoenix, Roc, Thunderbird | 150 |
| Fey/Nature spirits | Fairies, Dryads, Leshy | 200 |
| Demons/Devils | Various mythological demons | 300 |
| Guardians | Cerberus, Lamassu, Temple guardians | 150 |
| Cultural specific | Yokai, Jiangshi, Wendigo | 200 |

### 3. Heroes (1,200 new assets)

| Mythology | Examples | Target |
|----------|----------|--------|
| Greek | Jason, Theseus, Achilles, Ajax | 150 |
| Roman | Aeneas, Romulus, Remus | 80 |
| Norse | Sigurd, Ragnar, Beowulf | 100 |
| Celtic | Cu Chulainn, Finn MacCool | 100 |
| Hindu | Arjuna, Bhima, Rama, Hanuman | 150 |
| Chinese | Sun Wukong, Guan Yu, Mulan | 150 |
| Japanese | Momotaro, Yamato Takeru | 100 |
| Mesopotamian | Gilgamesh, Enkidu | 80 |
| Persian | Rostam, Sohrab | 80 |
| African | Sundiata, Anansi | 100 |
| Native American | Various culture heroes | 100 |
| Other | Saints, legendary kings, warriors | 100 |

### 4. Sacred Items (1,000 new assets)

| Category | Examples | Target |
|----------|----------|--------|
| Weapons | Excalibur, Mjolnir, Kusanagi | 300 |
| Armor/Protection | Aegis, Golden Fleece | 150 |
| Vessels | Holy Grail, Cauldron of Dagda | 100 |
| Jewelry | Ring of Gyges, Draupnir | 150 |
| Musical instruments | Orpheus's lyre, Apollo's lyre | 100 |
| Sacred texts/scrolls | Various | 100 |
| Tools/Objects | Pandora's Box, Sampo | 100 |

### 5. Sacred Places (800 new assets)

| Category | Examples | Target |
|----------|----------|--------|
| Mountains | Olympus, Meru, Kunlun | 150 |
| Underworlds | Hades, Helheim, Diyu | 100 |
| Heavens/Paradises | Valhalla, Elysium, Tian | 100 |
| Sacred groves/forests | Dodona, Broceliande | 100 |
| Islands | Avalon, Hy-Brasil, Lemuria | 100 |
| Cities | Troy, Atlantis, Shambhala | 100 |
| Temples/Shrines | Delphi, Karnak, Ise | 150 |

### 6. Archetypes (300 new assets)

| Category | Target |
|----------|--------|
| Character archetypes | 100 |
| Journey archetypes | 50 |
| Transformation archetypes | 50 |
| Cosmic archetypes | 50 |
| Shadow archetypes | 50 |

### 7. Cosmology (300 new assets)

| Category | Target |
|----------|--------|
| Creation myths | 50 |
| World structures | 50 |
| Cosmic cycles | 50 |
| Apocalypse narratives | 50 |
| Afterlife concepts | 50 |
| Time concepts | 50 |

### 8. Sacred Texts (200 new assets)

| Category | Target |
|----------|--------|
| Ancient epics | 50 |
| Religious scriptures | 50 |
| Oral traditions | 50 |
| Mythological compilations | 50 |

### 9. Rituals (300 new assets)

| Category | Target |
|----------|--------|
| Initiation rites | 60 |
| Seasonal festivals | 80 |
| Sacrifice practices | 40 |
| Oracle/Divination | 60 |
| Funerary rites | 60 |

### 10. Symbols (200 new assets)

| Category | Target |
|----------|--------|
| Religious symbols | 80 |
| Cosmic symbols | 40 |
| Animal symbols | 40 |
| Geometric symbols | 40 |

### 11. Sacred Herbs (200 new assets)

| Category | Target |
|----------|--------|
| Magical plants | 80 |
| Healing herbs | 60 |
| Sacred trees | 60 |

### 12. Magic Systems (200 new assets)

| Category | Target |
|----------|--------|
| Elemental magic | 50 |
| Divination types | 50 |
| Necromancy/Spirit work | 50 |
| Transformation magic | 50 |

---

## Implementation Strategy

### Phase 1: Asset List Generation
1. Create comprehensive lists for each mythology/category
2. Cross-reference with existing assets to avoid duplicates
3. Validate entity names against academic sources
4. Output as JSON manifest files

### Phase 2: Schema Templates
Create per-type generation prompts with:
- Required fields (name, description, mythology, type)
- Type-specific fields (domains for deities, labors for heroes)
- Relationship mapping (family, allies, enemies)
- Minimum content requirements (word counts, array lengths)

### Phase 3: Batch Generation
- Generate in batches of 100 per mythology/type
- Use checkpoint/resume for reliability
- Validate each generated asset against schema
- Track generation progress

### Phase 4: Relationship Building
- Cross-link related entities (Zeus -> Athena, Hera, etc.)
- Build family trees
- Connect to places, items, events
- Validate all links exist

### Phase 5: Quality Assurance
- Run validation scripts
- Check for duplicate names
- Verify minimum content requirements
- Fix broken links via re-generation

---

## Generation Script Requirements

```javascript
// scripts/generate-new-assets.js

const GENERATION_MANIFEST = {
  deities: {
    greek: ['Hecate', 'Pan', 'Eris', 'Nemesis', 'Tyche', ...],
    norse: ['Baldur', 'Freya', 'Heimdall', 'Tyr', 'Bragi', ...],
    // ... etc
  },
  creatures: {
    dragons: ['Fafnir', 'Ladon', 'Nidhogg', 'Yamata no Orochi', ...],
    // ... etc
  },
  // ... etc
};
```

## Estimated API Costs
- ~9,200 new assets
- ~500 tokens per asset generation
- Total: ~4.6M tokens
- Cost: ~$0.075/1M input, ~$0.30/1M output for Gemini Flash
- **Estimated total: ~$2-5 using free tier**

## Timeline
- Phase 1 (Lists): 2-4 hours
- Phase 2 (Templates): 1-2 hours
- Phase 3 (Generation): 8-12 hours (rate limited)
- Phase 4 (Links): 2-4 hours
- Phase 5 (QA): 2-4 hours
- **Total: ~15-26 hours of processing**

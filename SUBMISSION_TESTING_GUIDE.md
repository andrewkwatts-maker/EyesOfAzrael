# User Submission Testing Guide

## Overview
This guide walks through testing all 17 content types in the user submission system to verify:
1. Form displays correct fields for each content type
2. Data validation works properly
3. Submissions save to Firestore with correct structure
4. Firebase Authentication integration works

## Prerequisites
- ✅ Firebase project configured (eyesofazrael)
- ✅ Firestore indexes deployed (59 indexes)
- ✅ HTTP server running on http://localhost:8000
- ✅ User authenticated with Google Sign-In

## Testing URLs
- **Submission Form**: http://localhost:8000/theories/user-submissions/submit.html
- **Browse Submissions**: http://localhost:8000/theories/user-submissions/browse.html
- **Firebase Console**: https://console.firebase.google.com/project/eyesofazrael/firestore

---

## Content Type Testing Checklist

### 1. Theory / Analysis 💡
**Content Type**: `theory`

**Test Data**:
```
Title: The Hidden Mathematics of Norse Runes
Page: mythos/norse/index.html
Section: symbols
Topic: Runic Mathematics
Summary: An analysis of mathematical patterns in the Elder Futhark
Content: [Detailed theory about mathematical encodings in runic symbols]
Tags: mathematics, runes, norse, symbols
Related Mythologies: Norse, Germanic
Themes: Knowledge, Symbols, Mathematics
```

**Expected Fields**:
- Basic fields (title, page, section, topic, summary, content)
- Tags, Related Mythologies, Themes
- No asset-specific fields

**Verification**:
- Check Firestore `theories` collection for new document
- Verify `contributionType: "theory"`
- Verify all theory fields captured correctly

---

### 2. Deity / God ⚡
**Content Type**: `deity`

**Test Data**:
```
Title: Thunor - Anglo-Saxon Thunder God
Page: mythos/norse/deities/index.html
Section: deities
Asset Name: Thunor
Mythology: Germanic
Summary: Anglo-Saxon interpretation of Thor
Domains: Thunder, Protection, Strength
Symbols: Hammer, Oak Tree
Associated Myths: Similar to Thor's myths
Content: [Detailed deity description]
```

**Expected Fields**:
- Basic fields + Asset fields
- Deity-specific: Domains, Symbols, Associated Myths
- `assetMetadata.deity` should contain deity-specific data

**Verification**:
- Check `theories` collection (asset contributions still use theories collection)
- Verify `contributionType: "deity"`
- Verify `assetMetadata.deity` contains domains, symbols, associatedMyths

---

### 3. Hero / Legendary Figure 🦸
**Content Type**: `hero`

**Test Data**:
```
Asset Name: Beowulf
Mythology: Germanic
Summary: Legendary Geatish hero
Lineage: House of Geats
Deeds: Slew Grendel, Killed Dragon
Weapons: Naegling (sword), Hrunting (borrowed sword)
Content: [Hero's story and achievements]
```

**Expected Fields**:
- Hero-specific: Lineage, Deeds, Weapons
- `assetMetadata.hero` should contain hero data

**Verification**:
- Verify `contributionType: "hero"`
- Check lineage, deeds, weapons captured correctly

---

### 4. Creature / Monster 🐉
**Content Type**: `creature`

**Test Data**:
```
Asset Name: Jörmungandr
Mythology: Norse
Summary: World Serpent, child of Loki
Habitat: The ocean surrounding Midgard
Abilities: Massive size, poison breath, world-encircling
Weaknesses: Thor's hammer Mjölnir
Content: [Creature description and myths]
```

**Expected Fields**:
- Creature-specific: Habitat, Abilities, Weaknesses
- `assetMetadata.creature`

**Verification**:
- Verify `contributionType: "creature"`
- Check habitat, abilities, weaknesses fields

---

### 5. Place / Location 🏛️
**Content Type**: `place`

**Test Data**:
```
Asset Name: Bifröst
Mythology: Norse
Summary: Rainbow bridge connecting Midgard and Asgard
Location: Between realms
Significance: Gateway to Asgard, guarded by Heimdall
Associated Figures: Heimdall (guardian)
Content: [Description of the bridge and its role]
```

**Expected Fields**:
- Place-specific: Location, Significance, Associated Figures
- `assetMetadata.place`

**Verification**:
- Verify `contributionType: "place"`
- Check all place fields captured

---

### 6. Concept / Principle 💭
**Content Type**: `concept`

**Test Data**:
```
Asset Name: Wyrd
Mythology: Anglo-Saxon
Summary: The concept of fate and destiny
Description: Personal fate woven into the cosmic web
Related Concepts: Norns, Orlog, Fate
Applications: Understanding personal destiny within cosmic order
Content: [Philosophical exploration of wyrd]
```

**Expected Fields**:
- Concept-specific: Description, Related Concepts, Applications
- `assetMetadata.concept`

**Verification**:
- Verify `contributionType: "concept"`
- Check concept fields

---

### 7. Ritual / Ceremony 🕯️
**Content Type**: `ritual`

**Test Data**:
```
Asset Name: Blót
Mythology: Norse
Summary: Norse sacrificial ritual
Purpose: Honor gods, seek favor, community bonding
Participants: Chieftain, priest, community
Materials: Animal sacrifice, mead, sacred space
Timing: Seasonal festivals (Winter Nights, Midsummer, etc.)
Content: [Ritual procedures and significance]
```

**Expected Fields**:
- Ritual-specific: Purpose, Participants, Materials, Timing
- `assetMetadata.ritual`

**Verification**:
- Verify `contributionType: "ritual"`
- Check all ritual fields

---

### 8. Magic / Spell / Practice ✨
**Content Type**: `magic`

**Test Data**:
```
Asset Name: Seiðr
Mythology: Norse
Summary: Norse shamanic magic practice
Type: Shamanic trance, divination, fate manipulation
Practitioners: Völva (seeress), occasionally male practitioners
Components: Staff, ritual garments, songs (galdr)
Effects: Prophecy, shape-shifting, weather control
Content: [Detailed magic system description]
```

**Expected Fields**:
- Magic-specific: Type, Practitioners, Components, Effects
- `assetMetadata.magic`

**Verification**:
- Verify `contributionType: "magic"`
- Check magic system fields

---

### 9. Sacred Plant / Herb 🌿
**Content Type**: `herb`

**Test Data**:
```
Asset Name: Yggdrasil Ash
Mythology: Norse
Summary: Sacred ash tree at the center of cosmos
Properties: Immortal, connects nine realms, source of life
Uses: World tree, cosmic axis, shelter for gods
Associations: Norns, Odin's sacrifice, cosmic order
Content: [Botanical and mythological significance]
```

**Expected Fields**:
- Herb-specific: Properties, Uses, Associations
- `assetMetadata.herb`

**Verification**:
- Verify `contributionType: "herb"`
- Check plant-specific fields

---

### 10. Symbol / Emblem ☥
**Content Type**: `symbol`

**Test Data**:
```
Asset Name: Valknut
Mythology: Norse
Summary: Three interlocking triangles symbol
Meaning: Connection to Odin, warrior death, afterlife
Visual Description: Three triangles interlocked in various patterns
Usage: Burial sites, memorial stones, warrior marks
Content: [Symbol interpretation and archaeological evidence]
```

**Expected Fields**:
- Symbol-specific: Meaning, Visual Description, Usage
- `assetMetadata.symbol`

**Verification**:
- Verify `contributionType: "symbol"`
- Check symbol fields

---

### 11. Sacred Text / Scripture 📜
**Content Type**: `text`

**Test Data**:
```
Asset Name: Hávamál
Mythology: Norse
Summary: "Words of the High One" - Odin's wisdom poetry
Author/Source: Poetic Edda, attributed to Odin
Date/Period: 10th-13th century CE (written), older oral tradition
Key Teachings: Wisdom sayings, rune discovery, social ethics
Content: [Overview of the text's structure and themes]
```

**Expected Fields**:
- Text-specific: Author/Source, Date/Period, Key Teachings
- `assetMetadata.text`

**Verification**:
- Verify `contributionType: "text"`
- Check sacred text fields

---

### 12. Archetype / Pattern 🔮
**Content Type**: `archetype`

**Test Data**:
```
Asset Name: The Trickster
Mythology: Universal (Norse example: Loki)
Summary: The divine trickster archetype
Characteristics: Shape-shifting, boundary-crossing, chaos-bringing
Manifestations: Loki (Norse), Coyote (Native American), Anansi (African)
Psychological Meaning: Integration of shadow, creative disruption
Content: [Jungian and mythological analysis]
```

**Expected Fields**:
- Archetype-specific: Characteristics, Manifestations, Psychological Meaning
- `assetMetadata.archetype`

**Verification**:
- Verify `contributionType: "archetype"`
- Check archetype fields

---

### 13. Sacred Item / Artifact ⚔️
**Content Type**: `item`

**Test Data**:
```
Asset Name: Mjölnir
Mythology: Norse
Summary: Thor's legendary hammer
Type: Weapon, Sacred Tool
Properties: Returns when thrown, only liftable by Thor, thunder powers
Creator: Dwarven smiths Brokkr and Sindri
Associated Figure: Thor
Content: [Hammer's creation myth and significance]
```

**Expected Fields**:
- Item-specific: Type, Properties, Creator, Associated Figure
- `assetMetadata.item`

**Verification**:
- Verify `contributionType: "item"`
- Check artifact fields

---

### 14. Cosmological Structure 🌌
**Content Type**: `cosmology`

**Test Data**:
```
Asset Name: The Nine Realms
Mythology: Norse
Summary: The nine worlds of Norse cosmology
Structure: Three levels on Yggdrasil - Asgard/Vanaheim/Alfheim (top), Midgard/Jotunheim/Svartalfheim/Nidavellir (middle), Niflheim/Muspelheim (bottom)
Inhabitants: Gods, humans, giants, elves, dwarves, dead
Connections: Bifröst bridge, Yggdrasil roots and branches
Content: [Detailed cosmological map and relationships]
```

**Expected Fields**:
- Cosmology-specific: Structure, Inhabitants, Connections
- `assetMetadata.cosmology`

**Verification**:
- Verify `contributionType: "cosmology"`
- Check cosmology fields

---

### 15. Genealogy / Family Line 👥
**Content Type**: `lineage`

**Test Data**:
```
Asset Name: House of Odin
Mythology: Norse
Summary: The lineage of the Allfather
Progenitor: Odin (son of Borr and Bestla)
Descendants: Thor, Baldr, Höðr, Hermóðr, Bragi, Tyr (contested), Viðarr, Váli
Significance: Royal divine lineage, Aesir leadership
Key Events: Baldr's death, Thor's adventures, Ragnarök prophecies
Content: [Family tree and dynastic history]
```

**Expected Fields**:
- Lineage-specific: Progenitor, Descendants, Significance, Key Events
- `assetMetadata.lineage`

**Verification**:
- Verify `contributionType: "lineage"`
- Check genealogy fields

---

### 16. Mythological Event ⚔️
**Content Type**: `event`

**Test Data**:
```
Asset Name: Ragnarök
Mythology: Norse
Summary: The prophesied end of the world
Date/Time: Prophesied future event
Participants: All gods, giants, and cosmic forces
Location: Vigrid plain (final battle)
Outcome: Death of gods, world destruction, rebirth
Content: [Detailed prophecy and symbolism]
```

**Expected Fields**:
- Event-specific: Date/Time, Participants, Location, Outcome
- `assetMetadata.event`

**Verification**:
- Verify `contributionType: "event"`
- Check event fields

---

### 17. New Mythology / Tradition 🌍
**Content Type**: `mythology`

**Test Data**:
```
Asset Name: Modern Asatru
Mythology: Contemporary Norse Reconstruction
Summary: Modern revival of Norse paganism
Origin/Region: Modern revival (1970s+), worldwide
Primary Texts: Eddas, sagas, modern liturgy
Key Figures: Contemporary gothar (priests/priestesses)
Core Beliefs: Animism, ancestor veneration, nine virtues
Content: [Contemporary practice and theology]
```

**Expected Fields**:
- Mythology-specific: Origin/Region, Primary Texts, Key Figures, Core Beliefs
- `assetMetadata.mythology`

**Verification**:
- Verify `contributionType: "mythology"`
- Check mythology establishment fields

---

## Firestore Verification Steps

### For Each Submission:

1. **Open Firebase Console**
   ```
   https://console.firebase.google.com/project/eyesofazrael/firestore/data
   ```

2. **Navigate to `theories` Collection**
   - All user submissions currently go to `theories` collection
   - Look for newest document (sorted by `createdAt`)

3. **Verify Document Structure**
   ```javascript
   {
     id: "user_[timestamp]_[random]",
     contributionType: "[content-type]",
     title: "[title]",
     summary: "[summary]",
     content: "[content]",
     page: "[page-path]",
     section: "[section]",
     topic: "[topic]",
     authorId: "[firebase-uid]",
     authorName: "[display-name]",
     authorEmail: "[email]",
     status: "draft" or "published",
     createdAt: [Timestamp],
     updatedAt: [Timestamp],
     votes: {
       score: 0,
       upvotes: 0,
       downvotes: 0
     },
     tags: [...],
     relatedMythologies: [...],
     themes: [...],

     // Asset-specific metadata (only for non-theory types)
     assetMetadata: {
       [contentType]: {
         // Content-type-specific fields
       }
     }
   }
   ```

4. **Check Indexes Are Ready**
   - Go to: Firestore > Indexes tab
   - Verify all indexes show "Enabled" status (not "Building")
   - If still building, wait a few more minutes

---

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"
**Solution**: Verify you're signed in with Google and have write permissions in firestore.rules

### Issue: Form fields not appearing
**Solution**: Check browser console for JavaScript errors, verify firebase-config.js is loaded

### Issue: Submission fails silently
**Solution**:
1. Open browser DevTools > Console
2. Check for Firebase errors
3. Verify network tab shows Firestore write attempt
4. Check Firestore rules allow writes for authenticated users

### Issue: Data missing from Firestore
**Solution**:
1. Verify form's JavaScript is collecting all field data
2. Check `getFormData()` function in submit.html
3. Verify `assetMetadata` structure matches expected format

### Issue: Indexes still building
**Solution**:
- Wait 5-30 minutes for all indexes to complete
- Large index sets take longer
- Check Firebase Console > Firestore > Indexes for progress

---

## Success Criteria

✅ **All 17 content types tested**
✅ **Each submission creates Firestore document**
✅ **Content-type-specific fields captured in assetMetadata**
✅ **Proper document structure with all required fields**
✅ **Author information correctly recorded**
✅ **Timestamps and vote structures initialized**
✅ **Status field set correctly (draft/published)**
✅ **No JavaScript errors in browser console**
✅ **All Firestore indexes show "Enabled" status**

---

## Next Steps After Testing

1. **Fix any discovered issues**
2. **Update form validation if needed**
3. **Implement content reading/display system**
4. **Create browse/search functionality**
5. **Add moderation tools**
6. **Implement voting system**
7. **Add comments and discussions**

---

## Testing Log Template

```
Date: [date]
Tester: [name]
Browser: [browser + version]

Content Type | Tested | Success | Issues Found
-------------|--------|---------|-------------
Theory       | [ ]    | [ ]     |
Deity        | [ ]    | [ ]     |
Hero         | [ ]    | [ ]     |
Creature     | [ ]    | [ ]     |
Place        | [ ]    | [ ]     |
Concept      | [ ]    | [ ]     |
Ritual       | [ ]    | [ ]     |
Magic        | [ ]    | [ ]     |
Herb         | [ ]    | [ ]     |
Symbol       | [ ]    | [ ]     |
Text         | [ ]    | [ ]     |
Archetype    | [ ]    | [ ]     |
Item         | [ ]    | [ ]     |
Cosmology    | [ ]    | [ ]     |
Lineage      | [ ]    | [ ]     |
Event        | [ ]    | [ ]     |
Mythology    | [ ]    | [ ]     |

Notes:
[Any observations, issues, or recommendations]
```

# Eyes of Azrael - Contributor Guide

**Welcome, Contributor!** This guide will help you add high-quality content to Eyes of Azrael, whether you're adding new mythologies, deities, theories, or enriching existing content.

---

## Table of Contents

1. [Contributing Philosophy](#contributing-philosophy)
2. [Types of Contributions](#types-of-contributions)
3. [Quality Standards](#quality-standards)
4. [Adding Entities to Firebase](#adding-entities-to-firebase)
5. [Entity Types & Schemas](#entity-types--schemas)
6. [Content Guidelines](#content-guidelines)
7. [Image Guidelines](#image-guidelines)
8. [Cross-References & Relationships](#cross-references--relationships)
9. [Adding New Mythologies](#adding-new-mythologies)
10. [Theory Contribution Best Practices](#theory-contribution-best-practices)
11. [Review Process](#review-process)
12. [Contributor Recognition](#contributor-recognition)

---

## Contributing Philosophy

Eyes of Azrael strives to be:

✅ **Academically Grounded** - Content based on scholarly research and primary sources
✅ **Culturally Respectful** - Represent traditions authentically and sensitively
✅ **Cross-Referenced** - Connect related entities across mythologies
✅ **Accessible** - Present complex concepts in understandable language
✅ **Inclusive** - Welcome diverse interpretations and perspectives
✅ **Source-Attributed** - Always cite sources and acknowledge origins

---

## Types of Contributions

### 1. Entity Additions
Add new deities, heroes, creatures, places, texts, rituals, symbols, herbs, cosmology concepts, or events to the database.

**Requirements**:
- Primary source citations
- Accurate metadata (domains, symbols, relationships)
- Cross-cultural equivalents (if applicable)
- High-quality images (properly licensed)

### 2. Entity Enhancements
Improve existing entities with:
- Additional primary source references
- More detailed descriptions
- Better cross-references
- Improved images or icons
- Language data (original scripts, transliterations)

### 3. Theory Submissions
Share insights via the theory system:
- Comparative analysis across mythologies
- Modern interpretations of ancient wisdom
- Symbolic analysis
- Research findings
- Philosophical connections

### 4. New Mythology Coverage
Propose adding entirely new mythological traditions:
- Research and compile comprehensive entity lists
- Provide scholarly sources
- Create cultural context documentation
- Submit detailed proposal

### 5. Technical Contributions
Improve site functionality (requires developer access):
- Bug fixes
- Performance improvements
- New features
- Documentation updates

---

## Quality Standards

All contributions must meet these standards:

### Research Quality

**✅ Required**:
- At least 2 credible sources for new content
- Primary sources preferred (ancient texts, archaeological evidence)
- Secondary sources from academic publications
- Clear distinction between historical fact and interpretation

**✅ Preferred Sources**:
- Peer-reviewed academic journals
- University press publications
- Museum collections and exhibitions
- Archaeological reports
- Primary texts in translation

**❌ Avoid**:
- Wikipedia as sole source (use its sources instead)
- Personal blogs without credentials
- New Age websites without citations
- Popularized mythology without scholarly backing
- Unverified online encyclopedias

### Content Accuracy

- **Verify Names**: Include original language names and transliterations
- **Check Dates**: Use scholarly consensus for dating myths and texts
- **Cultural Context**: Explain the cultural and historical setting
- **Attribution**: Always cite specific texts, translations, and authors
- **Uncertainty**: Acknowledge scholarly debates and multiple interpretations

### Writing Quality

- **Clarity**: Write clearly for educated non-experts
- **Conciseness**: Avoid unnecessary verbosity
- **Neutrality**: Present information objectively
- **Grammar**: Proper spelling, grammar, and punctuation
- **Structure**: Organize information logically

### Respectful Representation

- **Use Proper Names**: Use accepted names for deities and concepts
- **Avoid Stereotypes**: Don't reduce rich traditions to oversimplifications
- **Cultural Sensitivity**: Respect living religious traditions
- **Acknowledge Diversity**: Many traditions have regional variations
- **Avoid Appropriation**: Don't claim closed/sacred practices as general knowledge

---

## Adding Entities to Firebase

### Prerequisites

1. **Firebase Access**: Contact AndrewKWatts@Gmail.com for contributor credentials
2. **Google Account**: Required for Firebase authentication
3. **Understanding**: Familiarity with JSON data structures (basic)

### Firebase Collections Structure

```
firestore/
├── deities/           # Gods and goddesses
├── heroes/            # Legendary mortals and demigods
├── creatures/         # Mythical beasts and monsters
├── cosmology/         # Universe structure and creation
├── places/            # Sacred locations and otherworlds
├── texts/             # Scriptures and primary sources
├── rituals/           # Ceremonies and practices
├── symbols/           # Sacred emblems and iconography
├── herbs/             # Sacred plants and botanicals
├── concepts/          # Abstract ideas (karma, maat, etc.)
├── events/            # Mythological events (Ragnarök, etc.)
└── items/             # Magical objects and artifacts
```

### Adding an Entity (Step-by-Step)

#### Step 1: Research Your Entity

Gather comprehensive information:
- Primary name and alternate names
- Mythology and cultural origin
- Category (deity, hero, creature, etc.)
- Domains/attributes
- Symbols and sacred objects
- Family relationships
- Key myths and stories
- Primary source references

#### Step 2: Prepare Entity Data

Create a JSON object following the schema (see [Entity Schemas](#entity-types--schemas)):

```json
{
  "id": "zeus",
  "name": "Zeus",
  "alternateNames": ["Jupiter (Roman)", "Ζεύς (Greek)"],
  "mythology": "greek",
  "category": "deities",
  "domains": ["sky", "thunder", "lightning", "law", "order"],
  "symbols": ["thunderbolt", "eagle", "oak tree", "scepter"],
  "description": "Supreme ruler of the Olympian gods...",
  "pantheonRole": "King of the Gods",
  "family": {
    "parents": ["Cronus", "Rhea"],
    "siblings": ["Hera", "Poseidon", "Hades", "Demeter", "Hestia"],
    "consorts": ["Hera", "Leto", "Maia", "Semele"],
    "children": ["Athena", "Apollo", "Artemis", "Hermes", "Dionysus"]
  },
  "primarySources": [
    "Homer, Iliad",
    "Hesiod, Theogony",
    "Homeric Hymns"
  ],
  "crossCulturalEquivalents": {
    "roman": "Jupiter",
    "norse": "Odin",
    "egyptian": "Amun-Ra"
  },
  "imageUrl": "/assets/deities/greek/zeus.jpg",
  "iconUrl": "/assets/icons/greek/zeus-icon.svg"
}
```

#### Step 3: Validate Your Data

Before submission, verify:
- All required fields present (name, mythology, category, description)
- Proper JSON formatting (use JSONLint or VS Code)
- Image URLs point to valid, accessible images
- Cross-references use correct entity IDs
- Spelling and grammar checked

#### Step 4: Submit to Firebase

**Option A: Firebase Console (Web Interface)**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the Eyes of Azrael project
3. Navigate to Firestore Database
4. Choose the appropriate collection (e.g., `deities`)
5. Click "Add Document"
6. Set Document ID to entity `id` (e.g., "zeus")
7. Add fields from your JSON
8. Click "Save"

**Option B: Bulk Import Script (For Multiple Entities)**
1. Create a JSON file with all entities:
```json
{
  "deities": [
    { "id": "zeus", "name": "Zeus", ... },
    { "id": "hera", "name": "Hera", ... }
  ]
}
```
2. Contact administrators to run import script
3. Or use Firebase Admin SDK (requires developer access)

#### Step 5: Add Images

Upload images to Firebase Storage:
1. Navigate to Firebase Storage in console
2. Go to `assets/{category}/{mythology}/`
3. Upload images (JPG, PNG, WebP)
4. Make image publicly accessible (set to "public read")
5. Copy the download URL
6. Update entity's `imageUrl` field

#### Step 6: Verify Display

1. Wait 5-10 minutes for cache refresh
2. Visit the entity page: `#/mythology/{mythology}/{category}/{id}`
3. Check all fields display correctly
4. Test cross-references and links
5. Report any issues to administrators

---

## Entity Types & Schemas

### Deities

**Required Fields**:
```json
{
  "id": "unique-lowercase-id",
  "name": "Display Name",
  "mythology": "greek|norse|egyptian|etc",
  "category": "deities",
  "description": "Detailed description (500-2000 words)"
}
```

**Recommended Fields**:
```json
{
  "alternateNames": ["Other Name 1", "Original Language Name"],
  "domains": ["domain1", "domain2"],
  "symbols": ["symbol1", "symbol2"],
  "epithets": ["The Wise", "Sky Father"],
  "pantheonRole": "King of Gods",
  "gender": "male|female|other|none",
  "family": {
    "parents": ["parent1", "parent2"],
    "siblings": ["sibling1"],
    "consorts": ["spouse1"],
    "children": ["child1", "child2"]
  },
  "primarySources": [
    "Book Title, Chapter",
    "Text Name, Section"
  ],
  "relatedEntities": {
    "associated_with": ["entity-id-1"],
    "opposed_to": ["entity-id-2"],
    "created_by": ["creator-entity-id"]
  },
  "crossCulturalEquivalents": {
    "mythology-name": "deity-id",
    "roman": "jupiter"
  },
  "tarotAssociations": ["the-emperor", "ace-of-wands"],
  "kabbalaPosition": ["chesed", "chokmah"],
  "sacredPlaces": ["mount-olympus", "dodona"],
  "festivals": ["Olympic Games", "Diasia"],
  "imageUrl": "/assets/deities/greek/deity.jpg",
  "iconUrl": "/assets/icons/greek/deity.svg"
}
```

### Heroes

Similar to deities but with:
```json
{
  "category": "heroes",
  "mortalParent": "parent-name",
  "divineParent": "deity-id",
  "quests": ["quest1", "quest2"],
  "companions": ["companion-id-1"],
  "weapons": ["weapon-id-1"]
}
```

### Creatures

```json
{
  "category": "creatures",
  "creatureType": "dragon|monster|spirit|hybrid",
  "slainBy": ["hero-id"],
  "abilities": ["flight", "fire-breathing"],
  "habitat": "underworld|ocean|mountain"
}
```

### Cosmology

```json
{
  "category": "cosmology",
  "cosmologyType": "realm|concept|afterlife|creation",
  "location": "upper|middle|lower|outside",
  "inhabitants": ["entity-id-1"],
  "ruledBy": ["deity-id"]
}
```

### Places

```json
{
  "category": "places",
  "placeType": "temple|mountain|island|city",
  "location": "modern-day-location",
  "coordinates": "lat,lon",
  "guardedBy": ["entity-id"],
  "events": ["event-id"]
}
```

### Texts

```json
{
  "category": "texts",
  "textType": "scripture|epic|hymn|chronicle",
  "author": "author-name",
  "dateWritten": "circa 800 BCE",
  "language": "original-language",
  "translations": ["translator-name (year)"],
  "keyEntities": ["entity-id-1", "entity-id-2"]
}
```

### Rituals

```json
{
  "category": "rituals",
  "ritualType": "festival|ceremony|offering|initiation",
  "performedBy": "priests|public|initiates",
  "timing": "annual|seasonal|life-event",
  "honouring": ["deity-id"],
  "offerings": ["item1", "item2"],
  "steps": ["step1", "step2", "step3"]
}
```

### Symbols

```json
{
  "category": "symbols",
  "symbolType": "emblem|sigil|sacred-object",
  "representedBy": ["deity-id"],
  "meanings": ["meaning1", "meaning2"],
  "usedIn": ["ritual-id"]
}
```

### Herbs

```json
{
  "category": "herbs",
  "botanicalName": "Scientific name",
  "commonNames": ["name1", "name2"],
  "associatedDeities": ["deity-id"],
  "magicalProperties": ["healing", "protection"],
  "preparations": ["tea", "incense", "oil"],
  "uses": ["ritual-id", "ceremony-name"]
}
```

### Concepts

```json
{
  "category": "concepts",
  "conceptType": "philosophical|ethical|metaphysical",
  "relatedConcepts": ["concept-id"],
  "embodiedBy": ["deity-id"],
  "opposedBy": ["concept-id"]
}
```

### Events

```json
{
  "category": "events",
  "eventType": "apocalypse|war|creation|transformation",
  "participants": ["entity-id-1"],
  "outcome": "description-of-result",
  "prophecies": ["prophecy-text"],
  "timeline": "before-creation|historical|end-times"
}
```

### Items (Magical Objects)

```json
{
  "category": "items",
  "itemType": "weapon|artifact|treasure",
  "wielders": ["hero-id"],
  "createdBy": ["deity-id"],
  "powers": ["power1", "power2"],
  "currentLocation": "place-id"
}
```

---

## Content Guidelines

### Description Writing

**Structure**: Follow this format for deity descriptions:

1. **Introduction** (1 paragraph)
   - Who the deity is
   - Primary role and importance
   - Cultural significance

2. **Origins & Family** (1-2 paragraphs)
   - Birth or creation story
   - Family relationships
   - Genealogy

3. **Domains & Powers** (1-2 paragraphs)
   - Areas of influence
   - Abilities and powers
   - Sacred symbols and objects

4. **Key Myths** (2-4 paragraphs)
   - Major stories involving the deity
   - Important deeds or events
   - Cultural context

5. **Worship & Cult** (1-2 paragraphs)
   - How the deity was worshipped
   - Temples and sacred sites
   - Festivals and rituals

6. **Modern Interpretation** (1 paragraph, optional)
   - Contemporary relevance
   - Symbolic meaning
   - Influence on culture

**Example Opening**:
> Zeus is the supreme ruler of the Olympian gods and the god of sky, thunder, lightning, law, and order in Greek mythology. As the king of Mount Olympus, he wielded the thunderbolt and was revered as the upholder of justice and the patron of kings. Zeus played a central role in Greek religion and was worshipped throughout the Greek world from the Mycenaean period through the Roman era.

### Alternate Names

Include all known names:
- Original language (with script): "Ζεύς (Greek)"
- Transliterations: "Dias"
- Epithets: "Zeus Olympios", "Zeus Pater"
- Regional variants: "Zeus Ammon" (Libyan)
- Cross-cultural equivalents: "Jupiter (Roman)"

### Domains & Symbols

**Domains**: Abstract concepts or areas of influence
- Examples: thunder, sky, justice, law, hospitality

**Symbols**: Physical objects or animals
- Examples: thunderbolt, eagle, oak tree, scepter

### Family Relationships

Use entity IDs for cross-referencing:
```json
"family": {
  "parents": ["cronus", "rhea"],
  "siblings": ["hera", "poseidon", "hades"],
  "consorts": ["hera", "leto"],
  "children": ["athena", "apollo", "artemis"]
}
```

### Primary Sources

Format: "Author/Text, Specific Location"
- "Homer, Iliad, Book 1"
- "Hesiod, Theogony, Lines 453-506"
- "Homeric Hymn to Zeus"
- "Pausanias, Description of Greece, Book 5.11.1"

**Translation Note**: Mention translator for modern readers:
- "Homer, Iliad, trans. Robert Fagles, Book 1"

---

## Image Guidelines

### Image Requirements

**Technical Specs**:
- **Format**: JPG (photos), PNG (graphics), WebP (optimized), SVG (icons)
- **Resolution**: Minimum 800×600px, Recommended 1920×1080px
- **File Size**: Maximum 2MB (compress larger images)
- **Aspect Ratio**: 16:9 or 4:3 preferred (flexible)

**Content Requirements**:
- **Relevant**: Directly related to the entity
- **Quality**: Clear, well-composed, professional
- **Appropriate**: No copyrighted modern art (unless licensed)
- **Cultural**: Respectful representation

### Image Sources

**✅ Acceptable Sources**:
- Public domain artwork (pre-1928 in most cases)
- Creative Commons licensed images (CC0, CC-BY)
- Museum collections (many offer CC licenses)
- Your own original photography
- Commissioned artwork (with artist permission)

**✅ Recommended Sources**:
- Wikimedia Commons (check individual licenses)
- Metropolitan Museum of Art (Open Access)
- British Museum (CC licensed items)
- Rijksmuseum (public domain)
- Internet Archive (public domain scans)

**❌ Prohibited Sources**:
- Google Images without verification
- Copyrighted modern artwork without permission
- Stock photos without proper license
- Other mythology websites (likely copyrighted)
- AI-generated art claiming to be ancient

### Image Attribution

Always provide attribution in the entity metadata:
```json
"imageAttribution": {
  "source": "Metropolitan Museum of Art",
  "title": "Zeus Enthroned",
  "artist": "Unknown (Attic Red-Figure)",
  "date": "circa 480 BCE",
  "license": "CC0 1.0",
  "url": "https://www.metmuseum.org/art/..."
}
```

### Icon Creation

For entity icons (used in grids and lists):
- **Size**: 512×512px minimum
- **Style**: Simple, recognizable silhouettes
- **Format**: SVG preferred (vector graphics)
- **Background**: Transparent
- **Colors**: 1-3 colors maximum

**Tools**:
- Adobe Illustrator (professional)
- Inkscape (free, open-source)
- Figma (free web-based)
- SVG Editor (built into Eyes of Azrael)

---

## Cross-References & Relationships

### Relationship Types

```json
"relatedEntities": {
  "parent_of": ["child-id"],
  "child_of": ["parent-id"],
  "sibling_of": ["sibling-id"],
  "spouse_of": ["spouse-id"],
  "created_by": ["creator-id"],
  "created": ["creation-id"],
  "slain_by": ["slayer-id"],
  "slew": ["victim-id"],
  "associated_with": ["associate-id"],
  "opposed_to": ["opponent-id"],
  "served_by": ["servant-id"],
  "serves": ["master-id"],
  "guards": ["guarded-place-id"],
  "resides_in": ["place-id"]
}
```

### Cross-Cultural Mapping

Map equivalent deities across mythologies:
```json
"crossCulturalEquivalents": {
  "roman": "jupiter",
  "norse": "odin",
  "egyptian": "amun-ra",
  "hindu": "indra"
}
```

**Criteria for Equivalence**:
- **Functional**: Similar roles (sky father, trickster, etc.)
- **Symbolic**: Shared symbols or attributes
- **Historical**: Known syncretism or cultural borrowing
- **Archetypal**: Embody same universal pattern

**Avoid False Equivalences**:
- Not all thunder gods are equivalent
- Consider cultural context
- Note partial vs. full equivalence in descriptions

### Tarot Associations

Link deities to Major and Minor Arcana:
```json
"tarotAssociations": [
  "the-emperor",      // Major Arcana
  "ace-of-wands",     // Minor Arcana
  "king-of-swords"    // Court Cards
]
```

**Criteria**:
- Symbolic alignment
- Traditional correspondences (Golden Dawn, etc.)
- Domain overlap
- Archetypal similarity

### Kabbalah Positions

Map to Tree of Life spheres:
```json
"kabbalaPosition": [
  "chesed",       // Sphere name
  "chokmah"       // Can map to multiple
]
```

**Ten Sephiroth**:
1. Keter (Crown)
2. Chokmah (Wisdom)
3. Binah (Understanding)
4. Chesed (Mercy)
5. Gevurah (Severity)
6. Tiferet (Beauty)
7. Netzach (Victory)
8. Hod (Glory)
9. Yesod (Foundation)
10. Malkhut (Kingdom)

---

## Adding New Mythologies

### Proposal Process

To add a new mythological tradition:

1. **Research Phase**
   - Compile list of major deities (minimum 10)
   - Identify primary source texts
   - Research scholarly consensus
   - Understand cultural context

2. **Proposal Submission**
   Email AndrewKWatts@Gmail.com with:
   - Mythology name and cultural origin
   - Historical period(s) of active worship
   - Geographic region
   - List of 20-50 proposed entities
   - Primary source texts
   - Scholarly references (3-5 books/articles)
   - Your qualifications or expertise

3. **Review**
   - Administrators evaluate proposal
   - Assess academic rigor
   - Check for duplication
   - Verify cultural sensitivity
   - Response within 2 weeks

4. **Implementation**
   - Create mythology directory structure
   - Add core entities (deities, cosmology)
   - Establish cross-references
   - Add category index pages
   - Create cultural context page

### Mythology Directory Structure

```
mythos/{mythology}/
├── index.html                 # Overview page
├── deities/
│   ├── index.html            # Deity index
│   └── {deity-id}.html       # Individual deities (optional static pages)
├── heroes/
├── creatures/
├── cosmology/
├── places/
├── texts/
├── rituals/
├── symbols/
├── herbs/
└── path/                     # Spiritual path/practice info
```

### Essential Content for New Mythology

**Minimum Requirements**:
- 10+ deities (major gods/goddesses)
- 3+ cosmology pages (creation, afterlife, universe structure)
- 2+ primary text entries
- 5+ cross-cultural equivalents
- Cultural context overview
- Primary source bibliography

**Recommended Additions**:
- 5+ heroes or legendary figures
- 3+ mythical creatures
- 5+ sacred places
- 3+ major rituals or festivals
- 10+ symbols with meanings
- Sacred herbs/plants
- Philosophical concepts

---

## Theory Contribution Best Practices

### Choosing a Topic

Select a topic that:
- You're knowledgeable and passionate about
- Fills a gap in existing content
- Offers original insights or connections
- Is relevant to the entity/page you're posting on

### Research Before Writing

1. **Read Existing Content**: Don't duplicate what's already on the entity page
2. **Check Existing Theories**: Avoid repeating others' insights
3. **Consult Sources**: Cite primary and secondary sources
4. **Verify Facts**: Double-check names, dates, and claims

### Theory Structure

**Strong Opening**:
- State your thesis clearly
- Explain why it matters
- Preview your main points

**Body**:
- Present evidence systematically
- Compare and contrast
- Acknowledge counterarguments
- Use examples and quotations

**Conclusion**:
- Summarize key insights
- Explain broader implications
- Suggest further research

**Citations**:
- List all sources at the end
- Use consistent citation format
- Link to online resources when available

### Using Panels Effectively

**Text Panels**: Main content, arguments, analysis
**Image Panels**: Visual evidence, artwork, diagrams, maps
**Cross-Reference Panels**: Link to related entities you discuss
**Source Citation Panels**: Quote primary texts, cite scholars

**Panel Order Tips**:
- Start with context-setting text
- Add images to illustrate points
- Cross-reference entities as you mention them
- End with comprehensive source citations

### Engaging with the Community

**Responding to Comments**:
- Thank constructive feedback
- Address questions thoughtfully
- Acknowledge valid criticisms
- Clarify misunderstandings

**Updating Your Theories**:
- Incorporate new information
- Correct errors promptly
- Note major revisions in theory
- Thank contributors who helped improve it

---

## Review Process

### Entity Review

Submitted entities undergo review:

1. **Technical Validation** (Automated)
   - JSON schema validation
   - Required fields check
   - Image URL verification
   - Cross-reference integrity

2. **Content Review** (Manual)
   - Accuracy verification
   - Source checking
   - Cultural sensitivity review
   - Writing quality assessment

3. **Feedback & Revision**
   - Issues reported to contributor
   - Revision period: 1-2 weeks
   - Re-review if changes made

4. **Approval & Publication**
   - Entity added to Firebase
   - Appears on site (5-10 min delay)
   - Contributor notified

### Theory Review

User theories have minimal pre-publication review:

**Auto-Approval**: Theories publish immediately if:
- User account in good standing
- No spam trigger words
- Images pass automated filters
- Word count reasonable (100-10,000 words)

**Community Moderation**:
- Users can report inappropriate content
- Moderators review reported theories
- Violations result in removal
- Repeat offenders may be banned

**Quality Indicators**:
- Upvotes/downvotes from community
- Comment engagement
- View count
- "Featured Theory" designation (editor's choice)

---

## Contributor Recognition

### Contribution Tracking

Your contributions are tracked and credited:
- **Theory Count**: Number of theories submitted
- **Upvotes**: Community approval of your work
- **Featured Theories**: Editor-selected highlights
- **Entity Contributions**: Credited in entity metadata

### Contributor Levels

Achieve levels based on contributions:

**🌱 Seeker** (0-4 theories)
- New contributor
- Learning the system

**🔥 Scholar** (5-19 theories)
- Regular contributor
- Trusted community member

**⭐ Sage** (20-49 theories)
- Frequent contributor
- High-quality content

**👑 Oracle** (50+ theories OR major entity contributions)
- Expert contributor
- Mentor to others
- May be invited to administrative roles

### Attribution

**Theory Attribution**:
- Your name/username on every theory
- Link to your profile
- Revision history preserved

**Entity Attribution**:
- Listed in entity metadata
- "Contributed by" section on page
- Recognition in changelog

### Permissions

Higher-level contributors may receive:
- Direct Firebase access for entities
- Moderator privileges
- Early access to new features
- Invitation to contributor Discord/community

---

## Getting Help

### Resources

- **[USER_GUIDE.md](./USER_GUIDE.md)** - How to use the site
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Technical documentation
- **[FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)** - Firebase details
- **Entity Examples**: Browse existing entities for formatting examples

### Support Channels

**Email**: AndrewKWatts@Gmail.com
- General questions
- Contribution proposals
- Technical issues

**Theory System**: Post questions as theories with "Meta" topic
- Get community help
- Share best practices

### Mentorship

Experienced contributors can mentor new ones:
- Request a mentor via email
- Ask questions about process
- Get feedback on draft entities
- Learn best practices

---

## Final Checklist

Before submitting an entity, verify:

- [ ] Name spelled correctly (checked against primary sources)
- [ ] Mythology field set correctly
- [ ] Category appropriate
- [ ] Description 500+ words, well-written
- [ ] At least 2 primary sources cited
- [ ] Domains and symbols accurate
- [ ] Family relationships use correct entity IDs
- [ ] Cross-cultural equivalents justified
- [ ] Images properly licensed
- [ ] Image attribution included
- [ ] JSON validates (no syntax errors)
- [ ] Cross-references point to existing entities
- [ ] Alternate names include original language
- [ ] Cultural context accurate and respectful

Before submitting a theory, verify:

- [ ] Original content (not plagiarized)
- [ ] Sources cited
- [ ] Relevant to entity page
- [ ] Well-written (grammar, spelling checked)
- [ ] Respectful of traditions
- [ ] Topic and subtopic selected
- [ ] Images properly licensed (if used)
- [ ] Cross-references correct
- [ ] Preview checked before publishing

---

**Thank you for contributing to Eyes of Azrael!**

Your work helps preserve and share humanity's mythological heritage with the world.

For questions, suggestions, or to get started: **AndrewKWatts@Gmail.com**

# Firebase Mythology Index Pages

This directory contains comprehensive overview pages for 22 world mythology traditions. These JSON files serve as landing pages when users navigate to specific mythologies from the "World Mythologies" menu.

## Purpose

When users click **"World Mythologies" → "Greek"**, they should see:
- An engaging mythology overview page (NOT just a grid of deities)
- Cultural context and historical background
- Statistics on entity collections (deities, heroes, creatures, etc.)
- Browse buttons linking to filtered entity collections
- Key concepts, sacred texts, and cross-cultural parallels

## File Structure

Each JSON file follows a consistent schema:

```
{mythology_id}.json
├── Basic Info (id, name, icon, tagline, description)
├── Overview (comprehensive introduction)
├── Cultural Context (period, region, language, sources)
├── Statistics (entity counts by type)
├── Sections (multiple content types)
│   ├── Category Grid (browse entities)
│   ├── Content Sections (narrative text)
│   ├── Lists (sacred texts, sources)
│   └── Parallels (cross-cultural connections)
├── Related Mythologies
└── Metadata (version, dates, author)
```

## Available Mythologies

### Major Traditions (Featured)
- `greek.json` - Greek Mythology (⚡)
- `norse.json` - Norse Mythology (⚔️)
- `egyptian.json` - Egyptian Mythology (𓂀)
- `hindu.json` - Hindu Mythology (🕉️)
- `buddhist.json` - Buddhist Mythology (☸️)
- `chinese.json` - Chinese Mythology (🐉)
- `japanese.json` - Japanese Mythology (⛩️)
- `celtic.json` - Celtic Mythology (🍀)
- `roman.json` - Roman Mythology (🏛️)
- `christian.json` - Christian Mythology (✝️)

### Abrahamic Traditions
- `jewish.json` - Jewish Mythology (✡️)
- `islamic.json` - Islamic Mythology (☪️)

### Ancient Near Eastern
- `babylonian.json` - Babylonian Mythology (🏺)
- `sumerian.json` - Sumerian Mythology (📜)
- `persian.json` - Persian Mythology (🔥)

### Mesoamerican
- `aztec.json` - Aztec Mythology (🌞)
- `mayan.json` - Mayan Mythology (🗿)

### African & Diaspora
- `yoruba.json` - Yoruba Mythology (🌿)

### Indigenous Americas
- `native_american.json` - Native American Mythology (🦅)

### Esoteric & Comparative
- `tarot.json` - Tarot Mythology (🔮)
- `apocryphal.json` - Apocryphal Traditions (📜)
- `comparative.json` - Comparative Mythology (🌍)

## Section Types

### 1. Category Grid
Displays browsable entity categories:

```json
{
  "id": "browse-entities",
  "type": "category-grid",
  "categories": [
    {
      "type": "deities",
      "icon": "⚡",
      "label": "Deities",
      "count": 42,
      "route": "#/browse/deities/greek",
      "description": "The Olympians, Titans, and primordial gods"
    }
  ]
}
```

### 2. Content
Rich narrative text:

```json
{
  "id": "key-concepts",
  "type": "content",
  "title": "Key Concepts",
  "body": "The Greek pantheon operated on principles of..."
}
```

### 3. List
Structured lists (e.g., sacred texts):

```json
{
  "id": "sacred-texts",
  "type": "list",
  "items": [
    "Homer's Iliad & Odyssey (c. 8th century BCE)",
    "Hesiod's Theogony (c. 700 BCE)"
  ]
}
```

### 4. Parallels
Cross-cultural connections:

```json
{
  "id": "cross-cultural-parallels",
  "type": "parallels",
  "parallels": [
    {
      "mythology": "roman",
      "connection": "Direct correspondence - Roman gods adapted from Greek",
      "strength": "primary"
    }
  ]
}
```

## Integration

### Firebase Firestore
Upload to `/mythologies` collection:
```javascript
const mythology = require('./greek.json');
db.collection('mythologies').doc('greek').set(mythology);
```

### React Component
```javascript
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

function MythologyPage() {
  const { mythologyId } = useParams();
  const [mythology, setMythology] = useState(null);

  useEffect(() => {
    const loadMythology = async () => {
      const docRef = doc(db, 'mythologies', mythologyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMythology(docSnap.data());
      }
    };
    loadMythology();
  }, [mythologyId]);

  return (
    <div>
      <HeroSection icon={mythology.icon} name={mythology.name} />
      <Overview text={mythology.overview} />
      {mythology.sections.map(section => (
        <Section key={section.id} {...section} />
      ))}
    </div>
  );
}
```

### Routing
```javascript
<Route path="/mythologies/:mythologyId" component={MythologyPage} />
```

## Entity Count Statistics

Statistics reflect Firebase collection counts:

```json
"statistics": {
  "deities": 42,    // From deities collection WHERE mythology=greek
  "heroes": 18,     // From heroes collection WHERE mythology=greek
  "creatures": 31,  // From creatures collection WHERE mythology=greek
  "places": 12,
  "items": 15,
  "concepts": 8
}
```

Update these when collections change.

## Content Guidelines

### Overview
- 200-300 words
- Comprehensive introduction to mythology
- Key themes, deities, narratives
- Historical/cultural significance
- What makes this tradition unique

### Sections
- **Browse Grid**: Always first section, links to entity collections
- **Content Sections**: 3-6 narrative sections covering major themes
- **Sacred Texts**: List of primary sources
- **Parallels**: Cross-cultural connections

### Tone
- Educational but engaging
- Respectful of living traditions
- Academically informed
- Accessible to general audience

## Cross-References

Use `relatedMythologies` array to connect similar traditions:
- Greek ↔ Roman (direct correspondence)
- Hindu ↔ Buddhist (historical connection)
- Jewish ↔ Christian ↔ Islamic (Abrahamic family)
- Norse ↔ Greek (Indo-European roots)

## Maintenance

### Adding New Mythology
1. Create `{mythology_id}.json` following schema
2. Write comprehensive overview (200-300 words)
3. Include cultural context metadata
4. Add statistics from Firebase collections
5. Create browse grid linking to filtered collections
6. Add 3-6 content sections
7. List sacred texts and primary sources
8. Add cross-cultural parallels
9. Upload to Firestore `/mythologies` collection

### Updating Statistics
Query Firebase collections and update counts:
```javascript
const count = await db.collection('deities')
  .where('mythology', '==', 'greek')
  .count()
  .get();
```

### Version Control
Update `metadata.updatedAt` when modifying:
```json
"metadata": {
  "createdAt": "2025-12-28T00:00:00Z",
  "updatedAt": "2025-12-28T00:00:00Z",
  "version": "1.0",
  "author": "EyesOfAzrael Content Team"
}
```

## Quality Checklist

- [ ] Comprehensive overview (200-300 words)
- [ ] Cultural context included
- [ ] Statistics match Firebase collections
- [ ] Browse grid links to filtered collections
- [ ] 3+ content sections
- [ ] Sacred texts listed
- [ ] Cross-cultural parallels documented
- [ ] Related mythologies linked
- [ ] Consistent JSON schema
- [ ] No spelling/grammar errors
- [ ] Appropriate tone and respect

## Contact

For questions or contributions to mythology content:
- GitHub: EyesOfAzrael Repository
- Created: December 28, 2025
- Version: 1.0

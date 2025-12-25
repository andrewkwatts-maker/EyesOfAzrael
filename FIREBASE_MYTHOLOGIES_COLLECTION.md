# Firebase Mythologies Collection Structure

This document describes the Firebase collection structure for the mythologies data that powers the home page.

## Collection: `mythologies`

Each document represents a mythology tradition with its metadata and navigation structure.

### Document Structure

```javascript
{
  // Document ID (e.g., 'greek', 'norse', 'egyptian')
  id: string,

  // Display name
  name: string,

  // Icon/emoji for the mythology
  icon: string,

  // Short description
  description: string,

  // Theme color (CSS color value)
  color: string,

  // Sort order on home page
  order: number,

  // Categories available in this mythology
  categories: {
    deities: { enabled: true, count: number },
    heroes: { enabled: true, count: number },
    creatures: { enabled: true, count: number },
    texts: { enabled: true, count: number },
    cosmology: { enabled: true, count: number },
    rituals: { enabled: true, count: number },
    herbs: { enabled: true, count: number },
    magic: { enabled: true, count: number },
    places: { enabled: false, count: 0 },
    items: { enabled: false, count: 0 }
  },

  // Metadata
  status: 'active' | 'draft' | 'archived',
  featured: boolean,
  lastUpdated: timestamp,
  createdAt: timestamp
}
```

## Example Documents

### Greek Mythology
```json
{
  "id": "greek",
  "name": "Greek Mythology",
  "icon": "🏛️",
  "description": "Gods of Olympus and heroes of ancient Greece",
  "color": "#8b7fff",
  "order": 1,
  "categories": {
    "deities": { "enabled": true, "count": 45 },
    "heroes": { "enabled": true, "count": 28 },
    "creatures": { "enabled": true, "count": 32 },
    "texts": { "enabled": true, "count": 12 },
    "cosmology": { "enabled": true, "count": 8 },
    "rituals": { "enabled": true, "count": 15 },
    "herbs": { "enabled": true, "count": 10 },
    "magic": { "enabled": true, "count": 6 },
    "places": { "enabled": true, "count": 5 },
    "items": { "enabled": false, "count": 0 }
  },
  "status": "active",
  "featured": true,
  "lastUpdated": "2025-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Norse Mythology
```json
{
  "id": "norse",
  "name": "Norse Mythology",
  "icon": "⚔️",
  "description": "Warriors of Asgard and the Nine Realms",
  "color": "#4a9eff",
  "order": 2,
  "categories": {
    "deities": { "enabled": true, "count": 38 },
    "heroes": { "enabled": true, "count": 15 },
    "creatures": { "enabled": true, "count": 22 },
    "texts": { "enabled": true, "count": 8 },
    "cosmology": { "enabled": true, "count": 12 },
    "rituals": { "enabled": true, "count": 10 },
    "herbs": { "enabled": true, "count": 8 },
    "magic": { "enabled": true, "count": 7 },
    "places": { "enabled": true, "count": 9 },
    "items": { "enabled": false, "count": 0 }
  },
  "status": "active",
  "featured": true,
  "lastUpdated": "2025-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Egyptian Mythology
```json
{
  "id": "egyptian",
  "name": "Egyptian Mythology",
  "icon": "𓂀",
  "description": "Keepers of the Nile and guardians of Ma'at",
  "color": "#ffd93d",
  "order": 3,
  "categories": {
    "deities": { "enabled": true, "count": 52 },
    "heroes": { "enabled": true, "count": 8 },
    "creatures": { "enabled": true, "count": 18 },
    "texts": { "enabled": true, "count": 10 },
    "cosmology": { "enabled": true, "count": 15 },
    "rituals": { "enabled": true, "count": 12 },
    "herbs": { "enabled": true, "count": 6 },
    "magic": { "enabled": true, "count": 8 },
    "places": { "enabled": true, "count": 4 },
    "items": { "enabled": false, "count": 0 }
  },
  "status": "active",
  "featured": true,
  "lastUpdated": "2025-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## How to Create Collection

### Using Firebase Console:

1. Go to Firebase Console → Firestore Database
2. Create a new collection called `mythologies`
3. Add documents with the structure above
4. Use the mythology ID as the document ID (e.g., `greek`, `norse`)

### Using Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

const mythologies = [
  {
    id: 'greek',
    name: 'Greek Mythology',
    icon: '🏛️',
    description: 'Gods of Olympus and heroes of ancient Greece',
    color: '#8b7fff',
    order: 1,
    categories: {
      deities: { enabled: true, count: 45 },
      heroes: { enabled: true, count: 28 },
      creatures: { enabled: true, count: 32 },
      texts: { enabled: true, count: 12 },
      cosmology: { enabled: true, count: 8 },
      rituals: { enabled: true, count: 15 },
      herbs: { enabled: true, count: 10 },
      magic: { enabled: true, count: 6 }
    },
    status: 'active',
    featured: true,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  // ... more mythologies
];

async function createMythologies() {
  const batch = db.batch();

  mythologies.forEach(myth => {
    const docRef = db.collection('mythologies').doc(myth.id);
    batch.set(docRef, myth);
  });

  await batch.commit();
  console.log('Mythologies created successfully!');
}

createMythologies();
```

## Fallback Behavior

If the `mythologies` collection is empty or fails to load, the HomeView will use a hardcoded fallback list defined in `js/views/home-view.js` → `getFallbackMythologies()` method.

## Benefits of Firebase Structure

1. **Dynamic Content**: Edit mythology descriptions without code changes
2. **Easy Management**: Add/remove mythologies via Firebase Console
3. **Counts**: Track number of entities in each category
4. **Ordering**: Control display order with `order` field
5. **Status**: Enable draft mode for mythologies in development
6. **Featured**: Mark important mythologies for special treatment
7. **Scalability**: Add new mythologies without deploying code

## Next Steps

1. Create the `mythologies` collection in Firebase
2. Add documents for each mythology tradition
3. Update entity counts as you add content
4. Consider creating a script to auto-calculate counts from existing collections

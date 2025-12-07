copyright (c) 2025 Andrew Keith Watts. All rights reserved.

This is the intellectual property of Andrew Keith Watts. Unauthorized
reproduction, distribution, or modification of this material, in whole or in part,
without the express written permission of Andrew Keith Watts is strictly prohibited.

For inquiries, please contact AndrewKWatts@Gmail.com


# Eyes of Azrael
**Explore the Interconnected Realms of Mythology, Magic, and Mysticism**

A comprehensive digital encyclopedia featuring:
- **500+ Mythological Deities** from 12+ pantheons
- **Cloud-Powered User Theory System** with Firebase backend
- **Rich Content Editor** with image uploads and cross-referencing
- **Metadata-Enhanced Corpus Search** with alternate names and cross-cultural equivalents
- **Tarot System** with Major and Minor Arcana interpretations
- **Kabbalah Integration** with Tree of Life mappings
- **Magic and Archetypes** exploration

---

## Quick Start

### For Users

1. **Browse Mythology:**
   - Explore deities from Greek, Norse, Egyptian, and more
   - Read traditional lore and modern interpretations
   - Discover connections between pantheons

2. **Submit Theories:**
   - Sign in with Google (one-click authentication)
   - Create rich theories with images and cross-references
   - Vote and comment on community theories
   - Access your theories from any device

3. **Explore Connections:**
   - Follow cross-references between deities
   - Discover Tarot card associations
   - Explore Kabbalah Tree of Life mappings

### For Developers

**Local Development:**
```bash
# Clone repository
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael

# Set up Firebase (see FIREBASE_SETUP_GUIDE.md)
cp firebase-config.template.js firebase-config.js
# Edit firebase-config.js with your Firebase credentials

# Serve locally (Python)
python -m http.server 8000

# Or use Node.js
npx http-server
```

**Open:** `http://localhost:8000`

---

## Corpus Search

The enhanced corpus search system allows searching across mythological texts with automatic name expansion and cross-cultural equivalents.

### Features

- **Alternate Name Expansion:** Search "Enki" and find "Ea" references
- **Cross-Cultural Search:** Search "Zeus" and find "Jupiter" in Roman texts
- **Entity Metadata:** Results enriched with deity information and mythology context
- **Smart Suggestions:** Get alternate search terms when no results found

### Quick Start

```javascript
// Search with metadata enhancement
const results = await corpusSearch.search('Enki', { useMetadata: true });
// Automatically searches for: Enki, Ea, Nudimmud
```

**Demo:** Open `test-metadata-search.html` to try it out

**Full Documentation:** See [METADATA_SEARCH_GUIDE.md](./METADATA_SEARCH_GUIDE.md)

---

## Firebase Setup

The user theory system is powered by Firebase, providing cloud storage, authentication, and image hosting.

### Prerequisites

- Google account (free)
- Node.js (for Firebase CLI - optional)

### Quick Setup

1. **Create Firebase Project:**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Create new project: "Eyes of Azrael"

2. **Enable Services:**
   - Authentication → Google Sign-In
   - Firestore Database (production mode)
   - Firebase Storage

3. **Configure Application:**
   - Copy Firebase config from console
   - Paste into `firebase-config.js`

4. **Deploy Security Rules:**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

**Detailed Instructions:** See [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)

### Free Tier Limits

Firebase provides generous free tier:

| Service | Free Limit | Estimated Capacity |
|---------|-----------|-------------------|
| Firestore | 50K reads/day | ~2,500 page views/day |
| Firestore | 20K writes/day | ~800 theories/day |
| Storage | 5GB total | ~1,000 high-quality images |
| Storage | 1GB/day downloads | ~200 image loads/day |
| Authentication | Unlimited | Always free |

**For most websites, free tier is sufficient for months of growth.**

---

## Documentation

### Setup & Deployment
- **[FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)** - Complete Firebase setup instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deploy to Firebase Hosting, GitHub Pages, Netlify, or custom server
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migrate from localStorage to Firebase

### Development
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Firebase integration API documentation
- **[USER_THEORY_SYSTEM_README.md](./USER_THEORY_SYSTEM_README.md)** - Theory system implementation guide
- **[ENTITY_SYSTEM_README.md](./ENTITY_SYSTEM_README.md)** - Entity/deity system architecture
- **[METADATA_SEARCH_GUIDE.md](./METADATA_SEARCH_GUIDE.md)** - Metadata-enhanced corpus search with alternate names

### Maintenance
- **[MONITORING_GUIDE.md](./MONITORING_GUIDE.md)** - Monitor usage, optimize performance, set up alerts
- **[BACKEND_MIGRATION_PLAN.md](./BACKEND_MIGRATION_PLAN.md)** - Firebase migration architecture

---

## Features

### Cloud-Powered Theory System

**Authentication:**
- One-click Google sign-in
- Secure, no password management
- Cross-device session sync

**Theory Creation:**
- Rich content editor with panels
- Drag-and-drop image uploads (up to 5MB)
- Cross-reference other entities
- Corpus search integration
- Topic/subtopic taxonomy (12 topics, 100+ subtopics)

**Community Features:**
- Vote on theories (upvote/downvote)
- Comment and discuss
- Filter by topic, author, or popularity
- Real-time updates

**Data Persistence:**
- Cloud storage (Firestore)
- Access from any device
- Automatic backups
- Never lose your work

### Mythology Database

- **500+ Deities** from 12+ pantheons
- **Cross-references** between related entities
- **Tarot associations** for each deity
- **Kabbalah mappings** to Tree of Life
- **Rich metadata** with symbols, domains, relationships

### Tarot System

- **Major Arcana** (22 cards) with deity associations
- **Minor Arcana** (56 cards) complete interpretations
- **Cross-referenced** to mythology and Kabbalah

### Kabbalah Integration

- **Tree of Life** with 10 Sephiroth
- **22 Paths** connecting spheres
- **Deity associations** at each sphere
- **Principia Metaphysica** framework

---

## Architecture

### Frontend
- **Pure HTML/CSS/JavaScript** (no build system required)
- **Modular components** (theory editor, widgets, cards)
- **Responsive design** (mobile-friendly)
- **Progressive enhancement**

### Backend
- **Firebase Authentication** (Google OAuth)
- **Cloud Firestore** (NoSQL database)
- **Firebase Storage** (image/file hosting)
- **Security Rules** (server-side access control)

### Data Flow
```
User Browser
    ↓
Firebase SDK (JavaScript)
    ↓
Firebase Services (Cloud)
    ├─→ Authentication (Google)
    ├─→ Firestore (Theories, Comments, Votes)
    └─→ Storage (Images)
```

---

## Project Structure

```
EyesOfAzrael/
├── mythos/                      # Mythology pages
│   ├── greek/                   # Greek pantheon
│   ├── norse/                   # Norse pantheon
│   ├── egyptian/                # Egyptian pantheon
│   └── ...                      # Other pantheons
├── theories/
│   └── user-submissions/        # Theory system pages
│       ├── submit.html          # Create theory
│       ├── browse.html          # Browse theories
│       └── view.html            # View theory
├── js/
│   ├── firebase-init.js         # Firebase initialization
│   ├── firebase-auth.js         # Authentication API
│   ├── firebase-db.js           # Firestore API
│   ├── firebase-storage.js      # Storage API
│   ├── user-theories.js         # Theory management (legacy)
│   ├── theory-taxonomy.js       # Topic/subtopic system
│   └── components/
│       ├── theory-editor.js     # Rich content editor
│       └── theory-widget.js     # Embeddable widget
├── css/
│   └── user-auth.css            # Theory system styles
├── firebase-config.js           # Firebase credentials (not committed)
├── firestore.rules              # Database security rules
├── storage.rules                # Storage security rules
├── firebase.json                # Firebase hosting config
└── .firebaserc                  # Firebase project settings
```

---

## Contributing

This is a personal project by Andrew Keith Watts. While the code is visible for educational purposes, contributions are not currently accepted.

For questions or permissions: AndrewKWatts@Gmail.com

---

## License

Copyright (c) 2025 Andrew Keith Watts. All rights reserved.

This is proprietary software. Unauthorized reproduction, distribution, or modification is strictly prohibited.

---

## Support

**For technical issues:**
- Check [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) troubleshooting section
- Review [API_REFERENCE.md](./API_REFERENCE.md) for API usage
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) FAQ

**For questions:**
- Email: AndrewKWatts@Gmail.com

---

## Acknowledgments

- **Mythology Data:** Compiled from public domain sources and scholarly research
- **Tarot Interpretations:** Traditional Rider-Waite-Smith symbolism
- **Kabbalah Framework:** Based on traditional Tree of Life teachings
- **Firebase:** Google Cloud Platform for backend services

---

**Built with passion for mythology, mysticism, and knowledge sharing.**

# Eyes of Azrael 👁️

**Explore the Interconnected Realms of Mythology, Magic, and Mysticism**

A comprehensive digital encyclopedia connecting ancient wisdom across 12+ world mythological traditions.

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Powered-orange.svg)](https://firebase.google.com)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen.svg)](https://eyesofazrael.web.app)

---

## ✨ Features

### 🏛️ Comprehensive Mythology Database
- **500+ Deities** from Greek, Norse, Egyptian, Hindu, Buddhist, Celtic, and more
- **Cross-Cultural Connections** linking equivalent deities across pantheons
- **Rich Metadata** including symbols, domains, family relationships, and sacred texts
- **12+ Mythologies** with thousands of interconnected entities

### 🔍 Advanced Search System
- **Multi-Mode Search** (Generic, Language, Source, Term, Advanced)
- **Metadata Enhancement** with alternate names and cross-cultural equivalents
- **Real-Time Autocomplete** with keyboard navigation
- **Multiple Display Modes** (Grid, Table, List, Panel, Inline)

### 🎨 Immersive Experience
- **WebGL Shader Backgrounds** that change based on mythology
- **10 Custom Shaders** (Water, Fire, Stars, Earth, etc.)
- **Responsive Design** optimized for desktop and mobile
- **Dark Mode** with multiple theme options

### 💬 User Contribution System
- **Cloud-Powered Theories** stored in Firebase
- **Google Sign-In** for seamless authentication
- **Rich Content Editor** with images, panels, and cross-references
- **Community Voting** and discussion
- **Personal Dashboard** to manage your contributions

### 🧩 Cross-Mythology Exploration
- **Archetype Explorer** (Sky Father, Trickster, Divine Twins, etc.)
- **Comparison Tool** for side-by-side mythology analysis
- **Tarot Associations** linking deities to Major and Minor Arcana
- **Kabbalah Integration** with Tree of Life mappings

### ⚡ Performance Optimized
- **Smart Caching** with IndexedDB (7-day TTL)
- **Lazy Loading** for images and heavy components
- **Progressive Enhancement** for graceful degradation
- **Offline Support** for previously visited content

---

## 🚀 Quick Start

### For Users

**Browse and Explore**:
1. Visit the live site: [https://eyesofazrael.web.app](https://eyesofazrael.web.app)
2. Browse mythologies from the home page
3. Use search to find specific deities or concepts
4. Compare across mythologies with the comparison tool

**Contribute Theories**:
1. Sign in with Google (one-click, secure)
2. Navigate to any entity page
3. Click "Share Your Theory"
4. Use the rich editor to create your content
5. Submit and engage with the community

📖 **[Read the User Guide](./USER_GUIDE.md)** for detailed instructions.

### For Contributors

**Add Content**:
1. Request Firebase contributor access (email below)
2. Add entities following the schema guidelines
3. Submit theories via the web interface
4. Help build cross-mythology connections

📝 **[Read the Contributor Guide](./docs/systems/CONTRIBUTOR_GUIDE.md)** for content standards and workflows.

### For Developers

**Local Development**:
```bash
# Clone repository
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael

# Install dependencies
npm install

# Configure Firebase
cp firebase-config.template.js firebase-config.js
# Edit firebase-config.js with your credentials

# Start local server
python -m http.server 8000
# Or: npx http-server -p 8000

# Open browser
# http://localhost:8000
```

💻 **[Read the Developer Onboarding Guide](./docs/systems/DEVELOPER_ONBOARDING.md)** for architecture and technical details.

---

## 📚 Documentation

### Complete Documentation Index
- **[docs/INDEX.md](./docs/INDEX.md)** - Complete documentation index with links to all guides, systems, and references

### User Documentation
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete guide for site visitors
  - Navigation and search
  - Using comparison features
  - Contributing theories
  - Accessibility features

- **[PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)** - Performance optimization
  - Why the site is fast
  - Browser requirements
  - Troubleshooting slow loads
  - Offline capabilities

### Contributor Documentation
- **[CONTRIBUTOR_GUIDE.md](./docs/systems/CONTRIBUTOR_GUIDE.md)** - Content contribution guide
  - Adding new mythologies
  - Adding deities/items/places
  - Firebase content structure
  - Quality standards

### Developer Documentation
- **[DEVELOPER_ONBOARDING.md](./docs/systems/DEVELOPER_ONBOARDING.md)** - Developer quick start
  - Architecture overview
  - Key files and their purposes
  - Running locally
  - Building features

- **[API_REFERENCE.md](./docs/systems/API_REFERENCE.md)** - Firebase API documentation
  - Authentication API
  - Database operations
  - Storage API
  - Code examples

### Setup & Deployment
- **[FIREBASE_SETUP_GUIDE.md](./docs/systems/FIREBASE_SETUP_GUIDE.md)** - Complete Firebase setup
  - Creating a Firebase project
  - Enabling services
  - Deploying security rules
  - Configuration

- **[DEPLOYMENT_GUIDE.md](./docs/systems/DEPLOYMENT_GUIDE.md)** - Deployment options
  - Firebase Hosting
  - GitHub Pages
  - Netlify
  - Custom servers

### Reference
- **[METADATA_SEARCH_GUIDE.md](./docs/systems/METADATA_SEARCH_GUIDE.md)** - Advanced search features
- **[MONITORING_GUIDE.md](./docs/systems/MONITORING_GUIDE.md)** - Usage monitoring and optimization
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migrating from localStorage to Firebase

---

## 🏗️ Architecture

### Technology Stack

**Frontend**:
- Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
- No build step required (no Webpack/Vite)
- WebGL shaders for visual effects
- Progressive Web App (PWA) ready

**Backend**:
- Firebase Authentication (Google OAuth)
- Cloud Firestore (NoSQL database)
- Firebase Storage (image hosting)
- Firebase Hosting (CDN delivery)

**Philosophy**:
- Mobile-first responsive design
- Accessibility (WCAG AA compliant)
- Performance-focused (< 3s page load)
- Progressive enhancement

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  SPA Router│  │  Renderer  │  │  Search    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Auth      │  │  Cache Mgr │  │  Shaders   │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Firebase Cloud Services                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Firestore  │  │   Auth     │  │  Storage   │        │
│  │   (Data)   │  │  (Users)   │  │  (Images)  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Key Components

**SPA Navigation** (`js/spa-navigation.js`):
- Hash-based routing
- Dynamic content loading
- Breadcrumb generation

**Entity Renderer** (`js/entity-renderer-firebase.js`):
- Fetches from Firebase
- Renders to HTML
- Handles all entity types

**Search Engine** (`js/components/corpus-search.js`):
- Multi-mode search
- Metadata enhancement
- Real-time autocomplete

**Cache Manager** (`js/firebase-cache-manager.js`):
- IndexedDB caching
- Smart invalidation
- Offline support

**Shader System** (`js/shaders/shader-themes.js`):
- WebGL shader loading
- Auto-theme selection
- Performance optimization

---

## 🎯 Project Structure

```
EyesOfAzrael/
├── index.html                # SPA entry point
├── package.json              # Dependencies and scripts
│
├── css/                      # Stylesheets
│   ├── styles.css            # Global styles
│   ├── universal-grid.css    # Entity grid system
│   └── ...                   # Component styles
│
├── js/                       # JavaScript modules
│   ├── app-init-simple.js    # App initialization
│   ├── spa-navigation.js     # Router
│   ├── auth-manager.js       # Authentication
│   ├── entity-renderer-firebase.js  # Entity display
│   ├── firebase-cache-manager.js    # Caching
│   │
│   ├── components/           # UI components
│   │   ├── corpus-search.js
│   │   ├── entity-form.js
│   │   └── universal-display-renderer.js
│   │
│   ├── views/                # Page views
│   │   ├── home-view.js
│   │   ├── search-view.js
│   │   └── compare-view.js
│   │
│   └── shaders/              # WebGL shaders
│       ├── water-shader.glsl
│       ├── fire-shader.glsl
│       └── ...
│
├── data/                     # Static data
│   ├── entities/             # Entity JSON (optional local cache)
│   ├── indices/              # Search indices
│   └── cross-cultural-mapping.json
│
├── mythos/                   # Static mythology pages (legacy)
│   ├── greek/
│   ├── norse/
│   └── ...
│
├── docs/                     # Documentation
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_ONBOARDING.md
│   └── ...
│
├── scripts/                  # Build scripts
│   ├── generate-entity-indices.js
│   ├── migrate-to-firebase-assets.js
│   └── ...
│
├── firebase-config.js        # Firebase credentials (gitignored)
├── firestore.rules           # Database security rules
└── storage.rules             # Storage security rules
```

---

## 🛠️ Development

### NPM Scripts

```bash
# Generate search indices
npm run generate-indices

# Migrate content to Firebase
npm run migrate

# Validate Firebase assets
npm run validate-firebase

# Enhance Firebase metadata
npm run enhance-firebase

# Add submission cards to grids
npm run add-submission-cards
```

### Key Technologies

- **No Build Step**: Pure JavaScript, no transpilation
- **ES6 Modules**: Modern JavaScript with imports
- **Firebase SDK**: v9 (compat mode)
- **WebGL**: GLSL shaders for backgrounds
- **IndexedDB**: Client-side caching

### Code Quality

- **Modular Architecture**: Reusable components
- **Async/Await**: Clean asynchronous code
- **Error Handling**: Consistent error patterns
- **Performance**: Lazy loading, caching, optimization
- **Accessibility**: WCAG AA compliance

---

## 🌍 Mythologies Covered

1. **Greek** - Olympian gods, Titans, heroes
2. **Norse** - Aesir, Vanir, Ragnarök
3. **Egyptian** - Pharaonic deities, Book of the Dead
4. **Hindu** - Trimurti, avatars, cosmic order
5. **Buddhist** - Bodhisattvas, enlightenment realms
6. **Celtic** - Tuatha Dé Danann, druidic wisdom
7. **Christian** - Biblical figures, angels, theology
8. **Jewish** - Patriarchs, prophets, Kabbalah
9. **Islamic** - Prophets, angels, divine names
10. **Babylonian** - Ancient Mesopotamian pantheon
11. **Chinese** - Celestial bureaucracy, immortals
12. **Japanese** - Shinto kami, Buddhist integration

**Plus**: Aztec, Mayan, Persian/Zoroastrian, Roman, Sumerian, Yoruba, Native American, and more.

---

## 📊 Statistics

### Content
- **500+ Deities** across 12+ pantheons
- **595 Validated Entities** in Firebase
- **100+ Cross-Cultural Equivalents** mapped
- **50+ Tarot Associations** documented
- **10 Custom Shaders** for immersive backgrounds

### Performance
- **< 1s** page load (cached)
- **< 3s** page load (uncached)
- **90+** Lighthouse performance score
- **90%+** cache hit rate (reduces Firebase reads)

### Coverage
- **Greek**: 113 entities
- **Christian**: 68 entities
- **Egyptian**: 60 entities
- **Hindu**: 55 entities
- **Norse**: 51 entities
- **Buddhist**: 48 entities
- **Jewish**: 42 entities
- More mythologies in progress

---

## 🤝 Contributing

### Content Contributions

**Theories** (Anyone):
- Sign in with Google
- Submit theories via web interface
- Follow community guidelines
- Engage with feedback

**Entities** (Contributors):
- Request Firebase access
- Follow entity schemas
- Provide source citations
- Maintain quality standards

📝 See [CONTRIBUTOR_GUIDE.md](./docs/systems/CONTRIBUTOR_GUIDE.md) for details.

### Code Contributions

**Currently Not Accepting**:
This is a personal project by Andrew Keith Watts. While the code is visible for educational purposes, external code contributions are not currently accepted.

**Bug Reports & Feature Requests**:
- Email: AndrewKWatts@Gmail.com
- Include detailed description
- Provide steps to reproduce (bugs)
- Explain use case (features)

💻 See [DEVELOPER_ONBOARDING.md](./docs/systems/DEVELOPER_ONBOARDING.md) for technical details.

---

## 📖 Firebase Free Tier

Eyes of Azrael operates within Firebase's generous free tier:

| Service | Free Limit | Estimated Capacity |
|---------|-----------|-------------------|
| **Firestore Reads** | 50K/day | ~2,500 page views/day |
| **Firestore Writes** | 20K/day | ~800 theories/day |
| **Storage** | 5GB total | ~1,000 high-res images |
| **Storage Downloads** | 1GB/day | ~200 image loads/day |
| **Authentication** | Unlimited | Always free |

**Optimization**:
- IndexedDB caching reduces reads by 90%+
- Image lazy loading reduces bandwidth
- Smart query design minimizes writes

For most sites, the free tier is sufficient for months of growth.

---

## 🔒 Security & Privacy

### Security Rules

**Firestore** (`firestore.rules`):
- Users can read all public data
- Users can only write their own theories
- Server-side validation of all writes
- Rate limiting on sensitive operations

**Storage** (`storage.rules`):
- Public read for entity images
- Authenticated write for theory images
- File size limits (5MB max)
- Type validation (images only)

### Privacy

**Data Collection**:
- Name, email, photo (from Google)
- Theories and comments
- Anonymous usage analytics

**Data Not Collected**:
- Passwords (OAuth only)
- Personal Google data
- Browsing history
- Location data

**User Rights**:
- View your data anytime
- Edit or delete theories
- Request account deletion
- Export your data

Email AndrewKWatts@Gmail.com for privacy requests.

---

## 📜 License

**Copyright © 2025 Andrew Keith Watts. All rights reserved.**

This is proprietary software. The code is visible for educational purposes, but unauthorized reproduction, distribution, or modification is strictly prohibited.

### What You CAN Do:
- Browse and use the website
- Submit theories (under site license)
- Learn from the codebase
- Reference in academic work (with citation)

### What You CANNOT Do:
- Clone and deploy your own version
- Redistribute the code
- Use commercially without permission
- Remove copyright notices

For licensing inquiries: **AndrewKWatts@Gmail.com**

---

## 🙏 Acknowledgments

### Data Sources
- **Mythology Content**: Compiled from public domain sources and scholarly research
- **Tarot Interpretations**: Traditional Rider-Waite-Smith symbolism
- **Kabbalah Framework**: Based on traditional Tree of Life teachings
- **Primary Texts**: Ancient texts in modern translation (cited per entity)

### Technologies
- **Firebase**: Google Cloud Platform for backend services
- **WebGL**: Khronos Group for shader standards
- **IndexedDB**: W3C standard for client-side storage

### Inspiration
- The rich tapestry of human mythology across cultures
- Scholars and researchers who preserve ancient wisdom
- The open-source community for web technologies

---

## 📞 Contact & Support

### General Inquiries
**Email**: AndrewKWatts@Gmail.com

### Support
- **User Questions**: See [USER_GUIDE.md](./USER_GUIDE.md)
- **Technical Issues**: See [DEVELOPER_ONBOARDING.md](./docs/systems/DEVELOPER_ONBOARDING.md)
- **Performance**: See [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)
- **Bug Reports**: Email with details and screenshots

### Social
- **Website**: [https://eyesofazrael.web.app](https://eyesofazrael.web.app)
- **GitHub**: This repository

---

## 🗺️ Roadmap

### Completed ✅
- Firebase migration (Firestore + Storage)
- Google authentication
- User theory system
- Advanced search with metadata
- WebGL shader backgrounds
- Cross-mythology comparisons
- Mobile optimization
- Accessibility enhancements

### In Progress 🚧
- Service Worker for full PWA
- Enhanced image optimization
- Expanded mythology coverage
- Community moderation tools

### Planned 📅
- Mobile apps (iOS/Android)
- Advanced visualization tools
- Contributor recognition system
- API for external integrations
- Multi-language support

---

**Built with passion for mythology, mysticism, and knowledge sharing.**

👁️ **Eyes of Azrael** - Where ancient wisdom meets modern exploration.

*"As above, so below; as within, so without; as the universe, so the soul."*

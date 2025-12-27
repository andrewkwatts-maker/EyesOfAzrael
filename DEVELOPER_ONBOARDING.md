# Eyes of Azrael - Developer Onboarding Guide

**Welcome, Developer!** This guide will get you up and running with the Eyes of Azrael codebase, from local setup to deployment.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Directory Structure](#directory-structure)
6. [Key Files & Their Purpose](#key-files--their-purpose)
7. [Development Environment Setup](#development-environment-setup)
8. [Firebase Configuration](#firebase-configuration)
9. [Running Locally](#running-locally)
10. [Code Organization](#code-organization)
11. [Core Systems](#core-systems)
12. [Working with Firebase](#working-with-firebase)
13. [Building New Features](#building-new-features)
14. [Testing](#testing)
15. [Deployment](#deployment)
16. [Performance Optimization](#performance-optimization)
17. [Troubleshooting](#troubleshooting)
18. [Contributing](#contributing)

---

## Quick Start

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael

# 2. Install dependencies
npm install

# 3. Set up Firebase config
cp firebase-config.template.js firebase-config.js
# Edit firebase-config.js with your Firebase credentials

# 4. Start local server
python -m http.server 8000
# Or: npx http-server -p 8000

# 5. Open browser
# Navigate to: http://localhost:8000
```

**That's it!** You should see the Eyes of Azrael home page.

---

## Project Overview

### What is Eyes of Azrael?

Eyes of Azrael is a **comprehensive world mythology encyclopedia** featuring:
- **500+ deities** from 12+ mythologies
- **Firebase-powered** cloud backend
- **Single Page Application** (SPA) with hash routing
- **WebGL shader backgrounds** for immersive theming
- **User contribution system** for theories and insights
- **Advanced search** with metadata enhancement
- **Cross-mythology comparisons** and equivalents

### Technology Philosophy

- **No Build Step**: Pure HTML/CSS/JavaScript (no Webpack/Vite/etc.)
- **Progressive Enhancement**: Works without JavaScript (basic functionality)
- **Mobile-First**: Responsive design for all screen sizes
- **Performance-Focused**: Lazy loading, caching, optimization
- **Firebase-First**: Cloud backend for data, auth, and storage
- **Modular Architecture**: Reusable components and services

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
├─────────────────────────────────────────────────────────────┤
│  SPA Router (Hash-based)  │  WebGL Shaders  │  Auth Guard   │
├─────────────────────────────────────────────────────────────┤
│            Entity Renderer  │  Search Engine  │  CRUD        │
├─────────────────────────────────────────────────────────────┤
│                    Firebase SDK (Client)                     │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Services                        │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Firestore DB  │  Cloud Storage          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User navigates** → SPA Router intercepts hash change
2. **Router parses route** → Determines page type (home, entity, search, etc.)
3. **Content loader** → Fetches entity data from Firebase
4. **Renderer** → Builds HTML from entity JSON
5. **Display** → Injects into DOM, applies theme
6. **User interacts** → Events trigger updates (voting, commenting, etc.)
7. **Firebase updates** → Real-time sync across clients

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App Init                             │
│         (Initializes Firebase, Auth, Router, Themes)         │
└─────────────────────────────────────────────────────────────┘
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Manager │  │  SPA Router  │  │ Theme Manager│
└──────────────┘  └──────────────┘  └──────────────┘
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Entity Loader│  │ Search Engine│  │ Shader System│
└──────────────┘  └──────────────┘  └──────────────┘
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Renderer   │  │  CRUD Forms  │  │  UI Widgets  │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Tech Stack

### Frontend

- **HTML5**: Semantic markup, accessibility features
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript**: ES6+ (modules, async/await, classes)
- **WebGL**: GLSL shaders for animated backgrounds

### Backend

- **Firebase Authentication**: Google OAuth sign-in
- **Cloud Firestore**: NoSQL document database
- **Firebase Storage**: Image and file hosting
- **Firebase Hosting**: Static site hosting (optional)

### Development Tools

- **Node.js**: Build scripts and Firebase CLI
- **Python**: Local development server
- **Git**: Version control
- **VS Code**: Recommended editor

### Libraries (Minimal Dependencies)

- **Firebase SDK**: Client-side Firebase integration (CDN)
- **Cheerio**: HTML parsing (Node scripts only)
- **JSDOM**: DOM manipulation (Node scripts only)
- **No jQuery, React, Vue, or other frameworks**

---

## Directory Structure

```
EyesOfAzrael/
├── index.html                    # Main entry point (SPA shell)
├── firebase-config.js            # Firebase credentials (gitignored)
├── firebase-config.template.js   # Template for firebase-config.js
├── package.json                  # NPM dependencies and scripts
├── firestore.rules               # Database security rules
├── storage.rules                 # Storage security rules
├── firebase.json                 # Firebase deployment config
│
├── css/                          # Stylesheets
│   ├── styles.css                # Global styles
│   ├── universal-grid.css        # Grid system for entity displays
│   ├── shader-backgrounds.css    # WebGL canvas styles
│   ├── accessibility.css         # A11y enhancements
│   ├── ui-components.css         # Reusable UI components
│   └── ...                       # More specific stylesheets
│
├── js/                           # JavaScript modules
│   ├── app-init-simple.js        # Main app initialization
│   ├── spa-navigation.js         # SPA router
│   ├── auth-manager.js           # Authentication
│   ├── firebase-cache-manager.js # Firebase caching layer
│   ├── entity-renderer-firebase.js # Entity display rendering
│   ├── lazy-loader.js            # Progressive loading
│   ├── performance-monitor.js    # Performance tracking
│   │
│   ├── components/               # Reusable UI components
│   │   ├── entity-form.js        # Entity CRUD forms
│   │   ├── user-dashboard.js     # User contribution dashboard
│   │   ├── corpus-search.js      # Search engine
│   │   └── universal-display-renderer.js # Multi-mode renderer
│   │
│   ├── views/                    # Page views
│   │   ├── home-view.js          # Home page
│   │   ├── search-view.js        # Search page
│   │   └── compare-view.js       # Comparison tool
│   │
│   ├── shaders/                  # WebGL shader system
│   │   ├── shader-themes.js      # Shader manager
│   │   ├── water-shader.glsl     # Water theme
│   │   ├── fire-shader.glsl      # Fire theme
│   │   └── ...                   # More shaders
│   │
│   └── utils/                    # Utility functions
│       ├── loading-spinner.js    # Loading UI
│       ├── error-handler.js      # Error handling
│       └── ...
│
├── data/                         # Static data files
│   ├── entities/                 # JSON entity definitions (optional local cache)
│   ├── indices/                  # Generated search indices
│   ├── schemas/                  # JSON schemas for validation
│   └── cross-cultural-mapping.json # Deity equivalents
│
├── scripts/                      # Build and maintenance scripts
│   ├── generate-entity-indices.js # Create search indices
│   ├── migrate-to-firebase-assets.js # Migrate HTML to Firebase
│   ├── validate-all-firebase-assets.js # Data validation
│   └── ...
│
├── mythos/                       # Static mythology pages (legacy/fallback)
│   ├── greek/
│   ├── norse/
│   ├── egyptian/
│   └── ...
│
├── theories/                     # Theory system pages
│   └── user-submissions/
│       ├── submit.html           # Theory creation form
│       ├── browse.html           # Browse all theories
│       └── view.html             # Single theory view
│
├── assets/                       # Images and media
│   ├── deities/                  # Deity images (by mythology)
│   ├── icons/                    # Entity icons
│   ├── symbols/                  # Symbol graphics
│   └── ...
│
├── docs/                         # Documentation
│   ├── USER_GUIDE.md             # User-facing guide
│   ├── CONTRIBUTOR_GUIDE.md      # Content contributor guide
│   ├── DEVELOPER_ONBOARDING.md   # This file
│   ├── API_REFERENCE.md          # Firebase API docs
│   └── ...
│
└── tests/                        # Test files (optional)
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Key Files & Their Purpose

### Entry Point

**`index.html`**
- SPA shell with single `<main>` container
- Loads Firebase SDK, stylesheets, and scripts
- Header, footer, and navigation chrome
- Critical CSS inlined for instant rendering

### App Initialization

**`js/app-init-simple.js`**
- Initializes Firebase app
- Sets up authentication listener
- Starts SPA router
- Loads theme system
- Configures error handling

**Key function**: `initializeApp()`

### Routing

**`js/spa-navigation.js`**
- Hash-based routing (`#/path/to/page`)
- Route pattern matching
- Content loading and rendering
- Breadcrumb generation
- History management

**Key class**: `SPANavigation`

**Routes**:
- `#/` → Home view
- `#/mythology/{myth}` → Mythology overview
- `#/mythology/{myth}/{category}` → Category grid (deities, heroes, etc.)
- `#/mythology/{myth}/{category}/{id}` → Entity detail page
- `#/search` → Search interface
- `#/compare` → Comparison tool
- `#/dashboard` → User dashboard

### Authentication

**`js/auth-manager.js`**
- Google OAuth sign-in/sign-out
- Session management
- User profile creation in Firestore
- Protected route enforcement

**Key class**: `AuthManager`

**Methods**:
- `signInWithGoogle()` - Open Google OAuth popup
- `signOut()` - Log out current user
- `getCurrentUser()` - Get current user object
- `onAuthStateChanged(callback)` - Listen for auth changes

### Firebase Caching

**`js/firebase-cache-manager.js`**
- IndexedDB caching layer for Firestore data
- Reduces Firebase reads (saves quota)
- Offline support
- Smart cache invalidation

**Key class**: `FirebaseCacheManager`

**Methods**:
- `get(collection, docId)` - Get document (cached)
- `set(collection, docId, data)` - Set and cache
- `invalidate(collection, docId)` - Force refresh
- `clearAll()` - Clear entire cache

### Entity Rendering

**`js/entity-renderer-firebase.js`**
- Fetches entity data from Firebase
- Renders entity to HTML
- Handles all entity types (deities, heroes, etc.)
- Builds cross-reference links
- Embeds theory widgets

**Key class**: `EntityRendererFirebase`

**Methods**:
- `renderEntity(mythology, category, id)` - Main render function
- `buildEntityHTML(entityData)` - Generate HTML from JSON
- `renderAttributes(entity)` - Render domains, symbols, etc.
- `renderRelationships(entity)` - Family tree, associations

### Search

**`js/components/corpus-search.js`**
- Full-text search across all entities
- Metadata enhancement (alternate names, cross-cultural)
- Multiple search modes (generic, language, source, term)
- Real-time autocomplete
- Keyboard navigation

**Key class**: `CorpusSearch`

**Methods**:
- `search(query, options)` - Perform search
- `enhanceWithMetadata(results)` - Add deity metadata
- `buildIndex()` - Create search index
- `exportResults(format)` - Export to JSON/CSV

### Display Modes

**`js/components/universal-display-renderer.js`**
- Multi-mode entity rendering
- Grid, Table, List, Panel, Inline views
- Responsive layouts
- Sortable tables
- Expandable list items

**Key class**: `UniversalDisplayRenderer`

**Methods**:
- `renderGrid(entities)` - Card grid (default)
- `renderTable(entities)` - Sortable table
- `renderList(entities)` - Expandable list
- `renderPanel(entities)` - Detailed panels
- `renderInline(entities)` - Compact badges

### Theme System

**`js/shaders/shader-themes.js`**
- WebGL shader management
- Dynamic shader loading
- Auto-theme based on mythology
- Time-based themes (day/night)
- Manual theme selection

**Key class**: `ShaderThemeManager`

**Shaders**: Water, Fire, Night, Day, Earth, Air, Light, Dark, Chaos, Order

### CRUD System

**`js/firebase-crud-manager.js`**
- Create, Read, Update, Delete entities
- Form validation
- Image upload handling
- Permission checking

**`js/components/entity-form.js`**
- Dynamic form generation based on category
- Field validation
- Cross-reference selection
- Icon picker integration

### Performance

**`js/lazy-loader.js`**
- Progressive lazy loading
- Skeleton screens during load
- Image lazy loading
- Defer non-critical resources

**`js/performance-monitor.js`**
- Track page load times
- Monitor Firebase read counts
- Memory usage tracking
- Export performance reports

---

## Development Environment Setup

### Prerequisites

1. **Node.js** (v16+): https://nodejs.org
2. **Git**: https://git-scm.com
3. **Modern Browser**: Chrome, Firefox, Safari, or Edge
4. **Code Editor**: VS Code recommended
5. **Firebase Account**: https://firebase.google.com (free)

### Installation Steps

```bash
# Clone repository
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael

# Install dependencies
npm install

# Install Firebase CLI (optional, for deployment)
npm install -g firebase-tools
firebase login
```

### VS Code Setup

**Recommended Extensions**:
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Live Server**: Local development server with hot reload
- **GitLens**: Enhanced Git integration
- **Firebase**: Firebase snippets and tools

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "javascript.suggest.autoImports": true,
  "files.associations": {
    "*.glsl": "glsl"
  },
  "liveServer.settings.port": 8000,
  "liveServer.settings.root": "/"
}
```

### Git Configuration

```bash
# Set up your identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Create feature branch
git checkout -b feature/your-feature-name
```

---

## Firebase Configuration

### Creating a Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "Eyes of Azrael" (or your preference)
4. Disable Google Analytics (optional)
5. Create project

### Enabling Services

**Authentication**:
1. Firebase Console → Authentication → Get Started
2. Sign-in method → Google → Enable
3. Set project support email

**Firestore Database**:
1. Firebase Console → Firestore Database → Create database
2. Start in **production mode** (we'll deploy security rules)
3. Choose location (closest to users)

**Cloud Storage**:
1. Firebase Console → Storage → Get Started
2. Start in **production mode**
3. Default bucket is fine

### Getting Firebase Config

1. Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" → Web app
3. Click "Add app" (if none exist)
4. Register app name: "Eyes of Azrael Web"
5. Copy the `firebaseConfig` object

### Adding Config to Project

```bash
# Copy template
cp firebase-config.template.js firebase-config.js
```

Edit `firebase-config.js`:
```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
```

**Security Note**: `firebase-config.js` is in `.gitignore` — never commit it!

### Deploying Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Or deploy all at once
firebase deploy --only firestore:rules,storage
```

See [`firestore.rules`](./firestore.rules) and [`storage.rules`](./storage.rules) for rule definitions.

---

## Running Locally

### Option 1: Python HTTP Server (Simplest)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Open: http://localhost:8000

### Option 2: Node.js HTTP Server

```bash
# Install globally (one-time)
npm install -g http-server

# Run
http-server -p 8000
```

Open: http://localhost:8000

### Option 3: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Auto-opens in browser with hot reload

### Option 4: Firebase Emulators (Advanced)

```bash
# Install emulators (one-time)
firebase init emulators

# Start all emulators
firebase emulators:start

# Or just hosting
firebase serve
```

### Testing Firebase Connection

Once server is running:
1. Open browser dev console (F12)
2. Go to http://localhost:8000
3. Check console for "Firebase initialized successfully"
4. Try signing in with Google
5. Check Firestore in Firebase Console for user document creation

---

## Code Organization

### Module Pattern

Each JavaScript file exports a class or object:

```javascript
// auth-manager.js
class AuthManager {
  constructor(app) {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
  }

  async signInWithGoogle() {
    // Implementation
  }
}

// Make globally available
window.AuthManager = AuthManager;
```

**Usage**:
```javascript
// In another file (loaded after auth-manager.js)
const authManager = new AuthManager(firebase.app());
```

### Async/Await

All Firebase operations use async/await:

```javascript
async function loadEntity(id) {
  try {
    const doc = await firebase.firestore()
      .collection('deities')
      .doc(id)
      .get();

    if (doc.exists) {
      return doc.data();
    } else {
      throw new Error('Entity not found');
    }
  } catch (error) {
    console.error('Error loading entity:', error);
    throw error;
  }
}
```

### Error Handling

Consistent error handling pattern:

```javascript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return {
    success: false,
    error: error.message
  };
}
```

### Event-Driven Architecture

Custom events for component communication:

```javascript
// Dispatch event
window.dispatchEvent(new CustomEvent('entityLoaded', {
  detail: { id: 'zeus', data: entityData }
}));

// Listen for event
window.addEventListener('entityLoaded', (e) => {
  console.log('Entity loaded:', e.detail.id);
});
```

---

## Core Systems

### 1. SPA Navigation System

**File**: `js/spa-navigation.js`

**How it works**:
1. Listen for `hashchange` events
2. Parse hash into route components
3. Match route to handler function
4. Load content (from Firebase or static)
5. Render into `<main>` container
6. Update breadcrumbs and page title

**Adding a new route**:
```javascript
// In spa-navigation.js
class SPANavigation {
  constructor() {
    this.routes = {
      '/your-route': this.handleYourRoute.bind(this),
      // ... existing routes
    };
  }

  async handleYourRoute(params) {
    const container = document.querySelector('#main-content');
    container.innerHTML = '<h1>Your Route</h1>';
    // Fetch data, render content, etc.
  }
}
```

### 2. Entity System

**File**: `js/entity-renderer-firebase.js`

**Entity lifecycle**:
1. Router calls `renderEntity(mythology, category, id)`
2. Renderer fetches from Firebase (with caching)
3. JSON entity data passed to template builder
4. HTML generated dynamically
5. Cross-references resolved and linked
6. Injected into DOM
7. Event listeners attached

**Entity JSON structure**:
```json
{
  "id": "zeus",
  "name": "Zeus",
  "mythology": "greek",
  "category": "deities",
  "description": "...",
  "domains": ["sky", "thunder"],
  "symbols": ["thunderbolt", "eagle"],
  "family": {
    "parents": ["cronus", "rhea"],
    "children": ["athena", "apollo"]
  },
  "crossCulturalEquivalents": {
    "roman": "jupiter"
  },
  "imageUrl": "/assets/deities/greek/zeus.jpg"
}
```

### 3. Search System

**File**: `js/components/corpus-search.js`

**Search flow**:
1. User types query
2. Debounced search function triggered
3. Query parsed and normalized
4. Index searched (in-memory or IndexedDB)
5. Results ranked by relevance
6. Metadata enhancement (alternate names, equivalents)
7. Results rendered in chosen display mode

**Search index structure**:
```javascript
{
  "zeus": {
    "name": "Zeus",
    "alternateNames": ["Jupiter", "Ζεύς"],
    "description": "...",
    "searchableText": "zeus jupiter sky thunder...",
    "mythology": "greek",
    "category": "deities"
  }
}
```

### 4. Theme System

**File**: `js/shaders/shader-themes.js`

**Shader loading**:
1. Detect mythology from current route
2. Map mythology to shader theme
3. Load `.glsl` file via fetch
4. Compile vertex and fragment shaders
5. Create WebGL program
6. Render to canvas (looping animation)

**Adding a new shader**:
1. Create `js/shaders/your-shader.glsl`
2. Add theme mapping in `shader-themes.js`
3. Test shader performance
4. Update theme picker UI

---

## Working with Firebase

### Reading Data

```javascript
// Get single document
const doc = await firebase.firestore()
  .collection('deities')
  .doc('zeus')
  .get();

if (doc.exists) {
  const data = doc.data();
  console.log(data.name); // "Zeus"
}

// Get all documents in collection
const snapshot = await firebase.firestore()
  .collection('deities')
  .where('mythology', '==', 'greek')
  .get();

snapshot.forEach(doc => {
  console.log(doc.id, doc.data());
});
```

### Writing Data

```javascript
// Create new document with auto-generated ID
await firebase.firestore()
  .collection('deities')
  .add({
    name: 'New Deity',
    mythology: 'greek',
    category: 'deities'
  });

// Set document with specific ID (overwrites)
await firebase.firestore()
  .collection('deities')
  .doc('new-deity')
  .set({
    name: 'New Deity',
    mythology: 'greek'
  });

// Update specific fields (merges)
await firebase.firestore()
  .collection('deities')
  .doc('zeus')
  .update({
    domains: firebase.firestore.FieldValue.arrayUnion('kingship')
  });
```

### Uploading Images

```javascript
// Upload to Firebase Storage
const file = inputElement.files[0];
const storageRef = firebase.storage()
  .ref(`assets/deities/greek/${file.name}`);

const uploadTask = await storageRef.put(file);
const downloadURL = await uploadTask.ref.getDownloadURL();

// Save URL to Firestore
await firebase.firestore()
  .collection('deities')
  .doc('zeus')
  .update({ imageUrl: downloadURL });
```

### Real-Time Listeners

```javascript
// Listen for changes to a document
firebase.firestore()
  .collection('deities')
  .doc('zeus')
  .onSnapshot(doc => {
    if (doc.exists) {
      console.log('Updated data:', doc.data());
      // Re-render entity
    }
  });

// Listen for changes to a collection
firebase.firestore()
  .collection('theories')
  .where('entityId', '==', 'zeus')
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        console.log('New theory:', change.doc.data());
      }
    });
  });
```

---

## Building New Features

### Step-by-Step Feature Development

1. **Plan the Feature**
   - Define user story
   - Sketch UI mockup
   - Identify data requirements
   - List Firebase collections/fields needed

2. **Create Data Schema**
   - Add to `data/schemas/`
   - Define required and optional fields
   - Plan indexes for queries

3. **Build Backend**
   - Update Firestore security rules
   - Add Cloud Functions if needed
   - Test with Firebase Emulator

4. **Build UI Components**
   - Create HTML template
   - Add CSS styles
   - Write JavaScript logic
   - Make it responsive

5. **Integrate with App**
   - Add route to SPA router
   - Connect to existing systems
   - Add navigation links
   - Update breadcrumbs

6. **Test Thoroughly**
   - Unit test functions
   - Integration test with Firebase
   - Cross-browser testing
   - Mobile testing

7. **Deploy**
   - Update Firestore rules
   - Deploy to Firebase Hosting
   - Monitor for errors
   - Gather user feedback

### Example: Adding a New Category

Let's add a "Festivals" category:

**1. Data Schema** (`data/schemas/festival-schema.json`):
```json
{
  "type": "object",
  "required": ["id", "name", "mythology", "category"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "mythology": { "type": "string" },
    "category": { "type": "string", "enum": ["festivals"] },
    "date": { "type": "string" },
    "honouring": { "type": "array", "items": { "type": "string" } },
    "rituals": { "type": "array" },
    "description": { "type": "string" }
  }
}
```

**2. Add to Entity Renderer** (`js/entity-renderer-firebase.js`):
```javascript
renderFestival(entity) {
  return `
    <div class="entity-card">
      <h1>${entity.name}</h1>
      <p><strong>Date:</strong> ${entity.date}</p>
      <p><strong>Honouring:</strong> ${entity.honouring.join(', ')}</p>
      <div class="description">${entity.description}</div>
      ${this.renderRituals(entity.rituals)}
    </div>
  `;
}
```

**3. Add Form Fields** (`js/components/entity-form.js`):
```javascript
getFestivalFields() {
  return [
    { name: 'name', type: 'text', required: true },
    { name: 'date', type: 'text', placeholder: 'e.g., March 15' },
    { name: 'honouring', type: 'entity-multi-select', category: 'deities' },
    { name: 'rituals', type: 'array', subtype: 'text' },
    { name: 'description', type: 'textarea', required: true }
  ];
}
```

**4. Update Navigation**:
- Add "Festivals" link to category lists
- Update breadcrumb generator
- Add to mythology overview pages

**5. Test & Deploy**:
```bash
# Add test data
npm run migrate -- --category festivals

# Deploy
firebase deploy
```

---

## Testing

### Manual Testing

**Browser DevTools**:
1. Console: Check for errors and logs
2. Network: Monitor Firebase requests
3. Application: Inspect IndexedDB cache, localStorage
4. Performance: Lighthouse audits

**Cross-Browser Testing**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Testing Checklist

- [ ] Sign in with Google works
- [ ] Entity pages load correctly
- [ ] Search returns expected results
- [ ] Images display properly
- [ ] Cross-references link correctly
- [ ] Shaders render smoothly (no lag)
- [ ] Mobile responsive layout
- [ ] Accessibility (keyboard navigation, screen reader)
- [ ] Performance (< 3s page load)

### Automated Testing (Optional)

**Unit Tests** (Jest):
```javascript
// tests/unit/corpus-search.test.js
import { CorpusSearch } from '../../js/components/corpus-search.js';

test('search returns relevant results', async () => {
  const search = new CorpusSearch();
  const results = await search.search('zeus');
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].name).toBe('Zeus');
});
```

**E2E Tests** (Playwright):
```javascript
// tests/e2e/navigation.spec.js
test('navigate to deity page', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.click('text=Greek Mythology');
  await page.click('text=Deities');
  await page.click('text=Zeus');
  await expect(page.locator('h1')).toContainText('Zeus');
});
```

---

## Deployment

### Deploy to Firebase Hosting

```bash
# First time setup
firebase init hosting

# Build (if you add a build step later)
# npm run build

# Deploy
firebase deploy --only hosting

# Your site is live at:
# https://your-project.web.app
```

### Deploy to GitHub Pages

```bash
# Build (ensure firebase-config.js is set for production)
# git add .
# git commit -m "Deploy to GitHub Pages"

# Push to gh-pages branch
git subtree push --prefix . origin gh-pages

# Or use the deploy script
npm run deploy:gh-pages
```

### Deploy to Netlify

1. Connect GitHub repo to Netlify
2. Build settings:
   - Build command: (none)
   - Publish directory: `/`
3. Add environment variables (if any)
4. Deploy!

### Continuous Deployment

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## Performance Optimization

### Caching Strategy

1. **Firebase Cache Manager**: IndexedDB cache for Firestore docs (7-day TTL)
2. **Browser Cache**: Service Worker for offline support (future enhancement)
3. **CDN Caching**: Firebase Hosting CDN for static assets

### Image Optimization

```javascript
// Lazy load images
<img data-src="/assets/deity.jpg" class="lazy" alt="Zeus">

// In lazy-loader.js
const images = document.querySelectorAll('img.lazy');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      imageObserver.unobserve(img);
    }
  });
});

images.forEach(img => imageObserver.observe(img));
```

### Code Splitting

- Load non-critical JavaScript after page load
- Use dynamic imports for heavy components
- Defer shader loading until needed

```javascript
// Lazy load shader system
async function loadShaders() {
  const { ShaderThemeManager } = await import('./shaders/shader-themes.js');
  const shaderManager = new ShaderThemeManager();
  return shaderManager;
}

// Call when needed
const shaders = await loadShaders();
```

### Firebase Query Optimization

```javascript
// ❌ Bad: Fetches entire collection
const allDeities = await firebase.firestore().collection('deities').get();

// ✅ Good: Limit results, use indexes
const greekDeities = await firebase.firestore()
  .collection('deities')
  .where('mythology', '==', 'greek')
  .limit(20)
  .get();
```

### Performance Monitoring

```javascript
// Track page load time
const perfMonitor = new PerformanceMonitor();
perfMonitor.startMeasure('pageLoad');

// ... page load logic ...

perfMonitor.endMeasure('pageLoad');
console.log('Page loaded in:', perfMonitor.getMeasure('pageLoad'), 'ms');
```

---

## Troubleshooting

### Common Issues

**Problem**: Firebase not initialized
```
Error: Firebase: Firebase App named '[DEFAULT]' already exists
```
**Solution**: Check that `firebase-config.js` exists and is loaded before other Firebase scripts.

**Problem**: Authentication popup blocked
```
Error: auth/popup-blocked
```
**Solution**: Allow popups in browser settings, or use redirect sign-in.

**Problem**: Entity not found in Firebase
```
Error: Entity 'zeus' not found in collection 'deities'
```
**Solution**: Verify entity exists in Firestore console. Check spelling and case sensitivity.

**Problem**: Shader not rendering
```
Error: WebGL: CONTEXT_LOST_WEBGL
```
**Solution**: Your GPU may not support WebGL. Update graphics drivers or disable shaders.

**Problem**: Slow Firebase reads
**Solution**: Enable Firebase Cache Manager. Check Firestore indexes.

### Debugging Tips

**Console Logging**:
```javascript
console.log('Entity loaded:', entity);
console.error('Error loading entity:', error);
console.warn('Cache miss for:', entityId);
```

**Firebase Debugging**:
```javascript
// Enable Firestore debug logging
firebase.firestore.setLogLevel('debug');
```

**Performance Profiling**:
```javascript
// Chrome DevTools → Performance tab
// Record page load and analyze waterfall
```

**Network Inspection**:
```javascript
// Chrome DevTools → Network tab
// Filter by "firestore" to see all database requests
// Check for excessive reads
```

---

## Contributing

### Branching Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/festival-category`)
- **bugfix/**: Bug fixes (`bugfix/auth-popup-blocked`)
- **hotfix/**: Urgent production fixes

### Commit Messages

Follow conventional commits:
```
feat: add festivals category
fix: resolve authentication popup blocking
docs: update developer onboarding guide
style: format entity-renderer code
refactor: optimize Firebase cache manager
test: add unit tests for search engine
perf: lazy load shader system
```

### Pull Request Process

1. Create feature branch from `develop`
2. Write code and tests
3. Update documentation
4. Run linter: `npm run lint`
5. Test locally
6. Push to GitHub
7. Open PR against `develop`
8. Request review
9. Address feedback
10. Merge when approved

### Code Review Checklist

- [ ] Code follows project style
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)
- [ ] Firebase security rules updated (if needed)
- [ ] Documentation updated
- [ ] No performance regressions

---

## Additional Resources

### Documentation

- [USER_GUIDE.md](./USER_GUIDE.md) - User-facing guide
- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) - Content contribution
- [API_REFERENCE.md](./API_REFERENCE.md) - Firebase API docs
- [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) - Detailed Firebase setup

### External Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [MDN Web Docs](https://developer.mozilla.org/)

### Community

- **Email**: AndrewKWatts@Gmail.com
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas

---

**Welcome to the Eyes of Azrael development team!**

Questions? Email **AndrewKWatts@Gmail.com**

Happy coding! 👁️✨

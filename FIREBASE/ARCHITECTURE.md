# Firebase Architecture - Eyes of Azrael

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              index_firebase.html                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Hero     │  │   Stats    │  │   Search   │         │  │
│  │  │  Widget    │  │  Widget    │  │   Widget   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │        Mythology Grid Widget                     │    │  │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │    │  │
│  │  │  │Greek │ │Hindu │ │Norse │ │Egypt │ │ ...  │ │    │  │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Firebase SDK                      │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      FIREBASE CLOUD                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                 Firebase Authentication                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │  Google  │  │  Email   │  │ Anonymous│            │    │
│  │  │  OAuth   │  │ Password │  │   Auth   │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │              Cloud Firestore Database                    │   │
│  │                                                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │  mythologies    │  │    deities      │               │   │
│  │  │  Collection     │  │   Collection    │               │   │
│  │  ├─────────────────┤  ├─────────────────┤               │   │
│  │  │ - greek         │  │ - zeus          │               │   │
│  │  │ - hindu         │  │ - shiva         │               │   │
│  │  │ - norse         │  │ - thor          │               │   │
│  │  │ - egyptian      │  │ - ra            │               │   │
│  │  │ - jewish        │  │ - yahweh        │               │   │
│  │  │ - ...           │  │ - ...           │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │  archetypes     │  │     herbs       │               │   │
│  │  │  Collection     │  │   Collection    │               │   │
│  │  ├─────────────────┤  ├─────────────────┤               │   │
│  │  │ - sky-father    │  │ - sage          │               │   │
│  │  │ - trickster     │  │ - ayahuasca     │               │   │
│  │  │ - earth-mother  │  │ - lotus         │               │   │
│  │  │ - ...           │  │ - ...           │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │    theories     │  │ user_submissions│               │   │
│  │  │   Collection    │  │   Collection    │               │   │
│  │  ├─────────────────┤  ├─────────────────┤               │   │
│  │  │ - theory_001    │  │ - submission_01 │               │   │
│  │  │ - theory_002    │  │ - submission_02 │               │   │
│  │  │ - ...           │  │ - ...           │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           Firestore Security Rules              │    │   │
│  │  │  - Public read on all collections               │    │   │
│  │  │  - Authenticated write on submissions           │    │   │
│  │  │  - Admin-only write on core content             │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           Firestore Indexes                      │    │   │
│  │  │  - mythology + archetypes                        │    │   │
│  │  │  - status + submittedAt                          │    │   │
│  │  │  - completed + displayName                       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Firebase Hosting (CDN)                     │    │
│  │  ┌──────────────────────────────────────────────┐      │    │
│  │  │  Static Files:                                │      │    │
│  │  │  - index.html, styles.css, scripts.js        │      │    │
│  │  │  - All mythology HTML pages                  │      │    │
│  │  │  - Images, fonts, assets                     │      │    │
│  │  └──────────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Firebase Storage                           │    │
│  │  ┌──────────────────────────────────────────────┐      │    │
│  │  │  User Uploads:                                │      │    │
│  │  │  - Deity images                               │      │    │
│  │  │  - User avatars                               │      │    │
│  │  │  - Theory diagrams                            │      │    │
│  │  └──────────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Page Load
```
User visits index_firebase.html
    ↓
Firebase SDK initializes
    ↓
Authentication state checked
    ↓
Firestore queries:
    - getMythologies()
    - getStats()
    - getArchetypes()
    ↓
Data renders in widgets
    ↓
Real-time listeners established
```

### 2. Search & Filter
```
User types in search box
    ↓
UIController.filterMythologies()
    ↓
Filter applied to cached data
    ↓
Grid re-rendered with results
```

### 3. User Submission
```
User fills submission form
    ↓
Firebase Auth verification
    ↓
Data sent to Firestore:
    collection('user_submissions').add({...})
    ↓
Submission appears in admin dashboard
    ↓
Admin approves/rejects
    ↓
If approved: moved to main collection
```

### 4. Real-Time Updates
```
Admin updates deity in Firestore
    ↓
Firestore triggers snapshot listener
    ↓
All connected clients receive update
    ↓
UI automatically re-renders
```

## Component Architecture

### Frontend Components

```
index_firebase.html
├── Firebase SDK Initialization
├── MythologyDatabase Class
│   ├── getMythologies()
│   ├── getStats()
│   ├── subscribeMythologies()
│   └── cache management
│
├── UIController Class
│   ├── loadStats()
│   ├── loadMythologies()
│   ├── renderMythologies()
│   ├── createMythologyCard()
│   ├── filterMythologies()
│   └── setupEventListeners()
│
└── Widgets
    ├── Hero Section
    ├── Stats Grid
    ├── Search Widget
    ├── Mythology Grid
    └── Navigation Links
```

### Backend Collections

```
Firestore
├── mythologies/
│   └── {mythologyId}/
│       ├── displayName
│       ├── icon
│       ├── description
│       ├── era
│       ├── regions[]
│       ├── coreConcepts[]
│       └── metadata{}
│
├── deities/
│   └── {deityId}/
│       ├── name
│       ├── mythology (ref)
│       ├── archetypes[]
│       ├── domains[]
│       ├── symbols[]
│       ├── relationships{}
│       └── metadata{}
│
├── archetypes/
│   └── {archetypeId}/
│       ├── name
│       ├── icon
│       ├── description
│       ├── characteristics[]
│       ├── occurrences{}
│       └── relatedArchetypes[]
│
├── user_submissions/
│   └── {submissionId}/
│       ├── type
│       ├── mythology
│       ├── data{}
│       ├── status
│       ├── submittedBy (ref)
│       └── submittedAt
│
└── content_widgets/
    └── {widgetId}/
        ├── type
        ├── template
        ├── config{}
        └── htmlTemplate
```

## Migration Architecture

### Phase 1: Static Files (Completed)
```
Original Website Files
    ↓
migrate-to-firebase-folder.js
    ↓
FIREBASE/ folder
```

### Phase 2: Data Migration (Ready)
```
mythos_data.js
    ↓
migrate-data-to-firebase.js
    ↓
Firestore Collections:
    - mythologies
    - deities (samples)
    - archetypes (samples)
    - content_widgets
```

### Phase 3: Full Content Migration (Future)
```
HTML Deity Pages
    ↓
parse-deity-html.js (to be created)
    ↓
Extract structured data
    ↓
Firestore deities collection
```

### Phase 4: Frontend Updates (Future)
```
Static HTML pages
    ↓
Replace with Firebase-integrated versions
    ↓
Dynamic data loading
    ↓
Real-time updates
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Firestore Security Rules                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Public Collections (Read-only):                        │
│  ├── mythologies     ← All users can read              │
│  ├── deities         ← All users can read              │
│  ├── archetypes      ← All users can read              │
│  └── herbs           ← All users can read              │
│                                                          │
│  User Collections (Authenticated write):                │
│  ├── user_submissions ← Logged-in users can create     │
│  ├── theories         ← Logged-in users can create     │
│  └── reviews          ← Logged-in users can create     │
│                                                          │
│  Admin Collections (Admin-only write):                  │
│  ├── mythologies     ← Only admins can modify          │
│  ├── deities         ← Only admins can modify          │
│  ├── archetypes      ← Only admins can modify          │
│  └── content_widgets ← Only admins can modify          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Scalability Architecture

```
Traffic Growth
    ↓
Firebase Hosting (Global CDN)
├── Edge Locations Worldwide
├── Automatic Scaling
└── HTTPS + HTTP/2
    ↓
Cloud Firestore
├── Automatic Scaling
├── Multi-region Replication
├── Query Optimization
└── Caching
    ↓
Users get fast responses globally
```

## Development Workflow

```
1. Local Development
   ├── Edit FIREBASE/index_firebase.html
   ├── Test with Firebase Emulator
   └── Verify in browser

2. Testing
   ├── Firebase Emulator Suite
   ├── Local Firestore instance
   └── Local Authentication

3. Staging
   ├── Deploy to staging project
   ├── Test with real Firebase
   └── Review before production

4. Production
   ├── Deploy to main project
   ├── Monitor with Firebase Console
   └── Analytics & Performance
```

## Widget Rendering Flow

```
Page loads
    ↓
Widget container found: <div id="mythologyGrid">
    ↓
Widget controller initialized
    ↓
Data fetched from Firestore
    ↓
Widget template loaded
    ↓
Template populated with data
    ↓
Rendered to DOM
    ↓
Event listeners attached
    ↓
Real-time listener established
    ↓
Updates trigger re-render
```

## Benefits of This Architecture

### Performance
- ✅ CDN edge caching
- ✅ Firestore query optimization
- ✅ Client-side caching
- ✅ Lazy loading
- ✅ Real-time updates (no polling)

### Scalability
- ✅ Automatic infrastructure scaling
- ✅ No server management
- ✅ Global distribution
- ✅ Pay-per-use pricing

### Developer Experience
- ✅ Simple SDK
- ✅ Real-time debugging
- ✅ Local emulation
- ✅ Automated backups

### User Experience
- ✅ Fast page loads
- ✅ Instant updates
- ✅ Offline support (future)
- ✅ Global accessibility

---

This architecture provides a solid foundation for a scalable, maintainable, and performant mythology database website.

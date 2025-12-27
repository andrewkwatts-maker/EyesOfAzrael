# Editable Panel System - Developer Guide

**Eyes of Azrael - Technical Integration Documentation**

## Architecture Overview

The Editable Panel System is a modular, framework-agnostic solution for enabling user-generated content on static or Firebase-powered websites.

### Components

```
editable-panel-system/
├── js/
│   └── editable-panel-system.js    # Core functionality
├── css/
│   └── editable-panels.css         # Frosted glass theme
└── docs/
    ├── EDITABLE_PANELS_USER_GUIDE.md
    ├── EDITABLE_PANELS_ADMIN_GUIDE.md
    └── EDITABLE_PANELS_DEVELOPER_GUIDE.md
```

### Dependencies

- **Firebase SDK 10.7.1+**
  - `firebase-app-compat.js`
  - `firebase-firestore-compat.js`
  - `firebase-auth-compat.js`
- **No jQuery or other frameworks required**
- **Pure vanilla JavaScript**

---

## Installation

### 1. Add CSS to Page

```html
<head>
  <link rel="stylesheet" href="/css/editable-panels.css">
</head>
```

### 2. Add JavaScript Before `</body>`

```html
<script src="/js/editable-panel-system.js"></script>
```

### 3. Initialize After Firebase Loads

```html
<script>
  window.addEventListener('load', () => {
    // Wait for Firebase to initialize
    if (!window.firebaseApp) {
      console.error('Firebase not initialized');
      return;
    }

    // Create system instance
    const editableSystem = new EditablePanelSystem(window.firebaseApp);

    // Store globally
    window.editableSystem = editableSystem;
  });
</script>
```

---

## API Reference

### Class: `EditablePanelSystem`

Main class for managing editable panels.

#### Constructor

```javascript
const editableSystem = new EditablePanelSystem(firebaseApp);
```

**Parameters:**
- `firebaseApp` (Object): Firebase app instance

**Returns:** `EditablePanelSystem` instance

#### Methods

##### `initEditablePanel(panel, config)`

Initialize editable functionality on a panel element.

```javascript
editableSystem.initEditablePanel(panelElement, {
  contentType: 'deity',
  documentId: 'greek_zeus',
  collection: 'deities',
  canEdit: true,
  canSubmitAppendment: true
});
```

**Parameters:**
- `panel` (HTMLElement): The DOM element to make editable
- `config` (Object):
  - `contentType` (string): Type of content (deity, hero, creature, etc.)
  - `documentId` (string): Firestore document ID
  - `collection` (string): Firestore collection name
  - `canEdit` (boolean): Whether user can edit (checks ownership)
  - `canSubmitAppendment` (boolean): Whether submissions are allowed

**Returns:** `void`

##### `addEditIcon(panel, config)`

Add edit icon to panel (top-right corner).

```javascript
editableSystem.addEditIcon(panelElement, config);
```

##### `addSubmissionButton(panel, config)`

Add submission button (+ icon) to panel.

```javascript
editableSystem.addSubmissionButton(panelElement, config);
```

##### `loadSubmissions(panel, config)`

Load and display approved submissions for a panel.

```javascript
await editableSystem.loadSubmissions(panelElement, config);
```

##### `enterEditMode(panel, config)`

Enter edit mode for a panel (shows modal).

```javascript
await editableSystem.enterEditMode(panelElement, config);
```

##### `openSubmissionModal(panel, config)`

Open submission modal for new content.

```javascript
editableSystem.openSubmissionModal(panelElement, config);
```

---

## Integration Patterns

### Pattern 1: Static HTML Panel

For manually created panels in HTML:

```html
<div id="zeus-panel" class="deity-card">
  <h2>Zeus</h2>
  <p>King of the Gods</p>
</div>

<script>
  const panel = document.getElementById('zeus-panel');
  editableSystem.initEditablePanel(panel, {
    contentType: 'deity',
    documentId: 'greek_zeus',
    collection: 'deities',
    canEdit: false,
    canSubmitAppendment: true
  });
</script>
```

### Pattern 2: Dynamically Rendered Cards

For cards created by Firebase Content Loader:

```javascript
// After Firebase Content Loader renders cards
const contentCards = document.querySelectorAll('.content-card[data-id]');

contentCards.forEach(card => {
  const documentId = card.getAttribute('data-id');

  // Determine collection from parent
  const parentSection = card.closest('.firebase-section');
  let collection = 'deities';

  if (parentSection) {
    const containerId = parentSection.querySelector('[id$="-container"]')?.id;
    if (containerId) {
      collection = containerId.replace('-container', '');
    }
  }

  editableSystem.initEditablePanel(card, {
    contentType: collection.slice(0, -1), // Remove plural 's'
    documentId: documentId,
    collection: collection,
    canEdit: false, // Determined by ownership check
    canSubmitAppendment: true
  });
});
```

### Pattern 3: User-Created Content

For content with user ownership:

```javascript
// Load deity from Firestore
const doc = await firebase.firestore()
  .collection('deities')
  .doc('greek_zeus')
  .get();

const data = doc.data();
const currentUser = firebase.auth().currentUser;

// Check if current user owns this content
const canEdit = currentUser && data.createdBy === currentUser.uid;

editableSystem.initEditablePanel(panel, {
  contentType: 'deity',
  documentId: doc.id,
  collection: 'deities',
  canEdit: canEdit,
  canSubmitAppendment: true
});
```

---

## Content Type Configuration

### Built-in Content Types

The system supports these content types out of the box:

```javascript
contentTypes = {
  deity: ['name', 'mythology', 'domain', 'description', 'attributes'],
  hero: ['name', 'mythology', 'legend', 'description', 'achievements'],
  creature: ['name', 'mythology', 'type', 'description', 'abilities'],
  cosmology: ['name', 'mythology', 'realm', 'description', 'significance'],
  herb: ['name', 'mythology', 'uses', 'description', 'properties'],
  ritual: ['name', 'mythology', 'purpose', 'description', 'steps'],
  text: ['name', 'mythology', 'type', 'description', 'significance'],
  myth: ['name', 'mythology', 'summary', 'description', 'characters'],
  concept: ['name', 'mythology', 'category', 'description', 'examples'],
  symbol: ['name', 'mythology', 'meaning', 'description', 'usage']
};
```

### Adding Custom Content Types

Extend the system by modifying `getFieldsForContentType()`:

```javascript
// In editable-panel-system.js
getFieldsForContentType(contentType) {
  const fields = {
    deity: [...],
    // Add your custom type
    artifact: [
      { key: 'displayName', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'powers', label: 'Powers', type: 'array' },
      { key: 'history', label: 'History', type: 'textarea' }
    ]
  };

  return fields[contentType] || defaultFields;
}
```

---

## Styling & Theming

### CSS Variables

Customize colors and spacing:

```css
:root {
  --editable-primary: #9370DB;      /* Purple accent */
  --editable-secondary: #7B68EE;    /* Lighter purple */
  --editable-success: #22C55E;      /* Green */
  --editable-error: #EF4444;        /* Red */
  --editable-surface: rgba(26, 26, 46, 0.95);
  --editable-border: rgba(147, 112, 219, 0.3);
  --editable-radius: 16px;
  --editable-blur: 20px;
}
```

### Dark/Light Theme Support

The system automatically adapts to theme attribute:

```html
<!-- Dark theme (default) -->
<body data-theme="dark">

<!-- Light theme -->
<body data-theme="light">
```

Light theme overrides in CSS:

```css
[data-theme="light"] .editable-panel-modal {
  background: rgba(255, 255, 255, 0.7);
}

[data-theme="light"] .modal-content {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
}
```

### Custom Button Styles

Override default button styles:

```css
/* Custom edit icon */
.panel-edit-icon {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  border: 2px solid #FF6B6B;
}

/* Custom submission button */
.panel-submission-btn {
  background: linear-gradient(135deg, #4ECDC4, #44A08D);
  border: 2px solid #4ECDC4;
}
```

---

## Events & Hooks

### Authentication Events

Listen for auth state changes:

```javascript
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in:', user.uid);
    // Refresh edit icons
    editableSystem.updateEditIcons();
  } else {
    console.log('User logged out');
  }
});
```

### Submission Events

Track submission lifecycle:

```javascript
// Override saveSubmission to add custom logic
const originalSaveSubmission = editableSystem.saveSubmission;

editableSystem.saveSubmission = async function(form, config, modal) {
  console.log('Submission starting...');

  await originalSaveSubmission.call(this, form, config, modal);

  console.log('Submission completed!');

  // Custom logic (analytics, notifications, etc.)
  gtag('event', 'submission', {
    content_type: config.contentType,
    document_id: config.documentId
  });
};
```

### Edit Events

Track edit actions:

```javascript
// Override saveEdit
const originalSaveEdit = editableSystem.saveEdit;

editableSystem.saveEdit = async function(form, config, modal) {
  console.log('Edit starting...');

  await originalSaveEdit.call(this, form, config, modal);

  console.log('Edit completed!');
};
```

---

## Error Handling

### Network Errors

Handle Firebase connectivity issues:

```javascript
try {
  await editableSystem.loadSubmissions(panel, config);
} catch (error) {
  if (error.code === 'unavailable') {
    console.error('Firebase offline');
    showOfflineMessage();
  } else if (error.code === 'permission-denied') {
    console.error('Permission denied');
    showPermissionError();
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Validation Errors

Validate form input before submission:

```javascript
// Add custom validation
function validateSubmission(formData) {
  const title = formData.get('title');
  const content = formData.get('content');

  if (title.length < 5) {
    throw new Error('Title must be at least 5 characters');
  }

  if (content.length < 20) {
    throw new Error('Content must be at least 20 characters');
  }

  // Check for profanity
  const profanityList = ['badword1', 'badword2'];
  const hasProfanity = profanityList.some(word =>
    content.toLowerCase().includes(word)
  );

  if (hasProfanity) {
    throw new Error('Content contains inappropriate language');
  }

  return true;
}
```

---

## Performance Optimization

### Lazy Loading Submissions

Don't load submissions until panel is visible:

```javascript
// Use Intersection Observer
const observer = new IntersectionObserver(async (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const panel = entry.target;
      const config = {
        documentId: panel.dataset.documentId,
        collection: panel.dataset.collection,
        contentType: panel.dataset.contentType
      };

      editableSystem.loadSubmissions(panel, config);
      observer.unobserve(panel);
    }
  });
});

// Observe all panels
document.querySelectorAll('.editable-panel').forEach(panel => {
  observer.observe(panel);
});
```

### Debouncing Search

For filtering submissions:

```javascript
let searchTimeout;

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    filterSubmissions(e.target.value);
  }, 300); // Wait 300ms after user stops typing
});
```

### Caching Firestore Queries

Use Firestore's built-in cache:

```javascript
const query = firebase.firestore()
  .collection('submissions')
  .where('parentDocumentId', '==', documentId);

// Get from cache first, then network
query.get({ source: 'cache' })
  .then(snapshot => {
    renderSubmissions(snapshot);
  })
  .catch(() => {
    // Cache miss, get from server
    return query.get({ source: 'server' });
  });
```

---

## Testing

### Unit Tests

Example using Jest:

```javascript
// editable-panel-system.test.js
import { EditablePanelSystem } from './editable-panel-system.js';

describe('EditablePanelSystem', () => {
  let system;
  let mockFirebaseApp;

  beforeEach(() => {
    mockFirebaseApp = {
      firestore: () => ({
        collection: jest.fn()
      }),
      auth: () => ({
        onAuthStateChanged: jest.fn()
      })
    };

    system = new EditablePanelSystem(mockFirebaseApp);
  });

  test('should initialize with Firebase app', () => {
    expect(system.app).toBe(mockFirebaseApp);
    expect(system.currentUser).toBe(null);
  });

  test('should add edit icon to panel', () => {
    const panel = document.createElement('div');
    const config = {
      contentType: 'deity',
      documentId: 'test-id',
      collection: 'deities'
    };

    system.addEditIcon(panel, config);

    expect(panel.querySelector('.panel-edit-icon')).toBeTruthy();
  });
});
```

### Integration Tests

Test with Firebase Emulator:

```javascript
// integration.test.js
const firebase = require('@firebase/testing');

describe('Editable Panel Integration', () => {
  let db;

  beforeAll(async () => {
    const projectId = 'test-project';
    const app = firebase.initializeTestApp({ projectId });
    db = app.firestore();
  });

  afterAll(async () => {
    await firebase.clearFirestoreData({ projectId: 'test-project' });
  });

  test('should create submission', async () => {
    const submission = {
      title: 'Test Submission',
      content: 'Test content',
      status: 'pending'
    };

    const ref = await db.collection('submissions').add(submission);
    const doc = await ref.get();

    expect(doc.data()).toMatchObject(submission);
  });
});
```

### E2E Tests

Using Playwright or Cypress:

```javascript
// e2e/editable-panels.spec.js
describe('Editable Panel System', () => {
  beforeEach(() => {
    cy.visit('/mythos/greek/index.html');
  });

  it('should show submission button', () => {
    cy.get('.panel-submission-btn').should('be.visible');
  });

  it('should open submission modal on click', () => {
    cy.get('.panel-submission-btn').first().click();
    cy.get('.editable-panel-modal').should('be.visible');
  });

  it('should require login for submission', () => {
    cy.get('.panel-submission-btn').first().click();
    cy.contains('Login Required').should('be.visible');
  });
});
```

---

## Deployment

### Production Checklist

- [ ] Minify JavaScript (`editable-panel-system.min.js`)
- [ ] Minify CSS (`editable-panels.min.css`)
- [ ] Enable Firebase offline persistence
- [ ] Set up Firestore indexes
- [ ] Configure security rules
- [ ] Test on multiple browsers
- [ ] Enable HTTPS
- [ ] Set up error logging (Sentry, etc.)
- [ ] Configure CSP headers

### Build Script

```javascript
// build.js
const { minify } = require('terser');
const fs = require('fs');

async function build() {
  // Minify JS
  const jsCode = fs.readFileSync('js/editable-panel-system.js', 'utf8');
  const minifiedJs = await minify(jsCode);
  fs.writeFileSync('js/editable-panel-system.min.js', minifiedJs.code);

  // Minify CSS (using cssnano or similar)
  const cssCode = fs.readFileSync('css/editable-panels.css', 'utf8');
  // ... minify CSS
  fs.writeFileSync('css/editable-panels.min.css', minifiedCss);

  console.log('Build complete!');
}

build();
```

### CDN Hosting

Host on Firebase Hosting or CDN:

```html
<!-- Production -->
<link rel="stylesheet" href="https://cdn.eyesofazrael.com/css/editable-panels.min.css">
<script src="https://cdn.eyesofazrael.com/js/editable-panel-system.min.js"></script>
```

---

## Security Best Practices

### Input Sanitization

Sanitize user input to prevent XSS:

```javascript
function sanitizeInput(input) {
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
}

// Use when rendering user content
submissionCard.innerHTML = `
  <h5>${sanitizeInput(data.title)}</h5>
  <p>${sanitizeInput(data.content)}</p>
`;
```

### Content Security Policy

Add CSP headers:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://www.gstatic.com;
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://*.googleapis.com;">
```

### Rate Limiting

Implement client-side rate limiting:

```javascript
const submissionCooldown = 60000; // 1 minute
let lastSubmission = 0;

function canSubmit() {
  const now = Date.now();
  if (now - lastSubmission < submissionCooldown) {
    const remaining = Math.ceil((submissionCooldown - (now - lastSubmission)) / 1000);
    throw new Error(`Please wait ${remaining} seconds before submitting again`);
  }
  lastSubmission = now;
  return true;
}
```

---

## Troubleshooting

### Debug Mode

Enable verbose logging:

```javascript
// In constructor
this.debugMode = localStorage.getItem('editablePanels_debug') === 'true';

// In methods
if (this.debugMode) {
  console.log('[EditablePanels]', ...args);
}
```

### Common Issues

**Issue**: Edit icon not appearing
```javascript
// Check ownership
const doc = await db.collection('deities').doc('greek_zeus').get();
console.log('createdBy:', doc.data().createdBy);
console.log('currentUser:', firebase.auth().currentUser.uid);
```

**Issue**: Submissions not loading
```javascript
// Check query
const query = db.collection('submissions')
  .where('parentDocumentId', '==', documentId)
  .where('status', '==', 'approved');

const snapshot = await query.get();
console.log('Found submissions:', snapshot.size);
```

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/eyes-of-azrael.git

# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test
```

### Code Style

Follow Airbnb JavaScript Style Guide:

```javascript
// Good
const editableSystem = new EditablePanelSystem(firebaseApp);

// Bad
var editable_system = new EditablePanelSystem(firebaseApp)
```

### Pull Request Guidelines

1. Create feature branch from `main`
2. Write tests for new features
3. Update documentation
4. Run linter: `npm run lint`
5. Submit PR with description

---

## Changelog

See `CHANGELOG.md` for version history.

## License

MIT License - See `LICENSE` file

---

**Maintained by:** Eyes of Azrael Development Team
**Last Updated:** 2025-12-13

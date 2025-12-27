# Modular Template Architecture Plan
## EyesOfAzrael - Unified Content System

**Date:** December 4, 2025
**Status:** Architectural Design Phase

---

## Executive Summary

This document outlines a comprehensive modular template system for the EyesOfAzrael project that will:

1. **Centralize shared content** (items, places, magic systems) into dedicated directories
2. **Create reusable templates** for consistent presentation across mythologies
3. **Implement panel/card components** for cross-referencing related content
4. **Enable community contributions** through user authentication and comment systems
5. **Maintain mythology-specific content** while linking to shared resources
6. **Support all existing features** (corpus search, diagrams, user theories, smart links)

---

## Current State Analysis

### Existing Structure
```
EyesOfAzrael/
├── mythos/
│   ├── greek/
│   │   ├── deities/
│   │   ├── heroes/
│   │   ├── creatures/
│   │   ├── herbs/
│   │   ├── rituals/
│   │   ├── magic/
│   │   └── ...
│   ├── norse/
│   ├── egyptian/
│   ├── jewish/
│   ├── hindu/
│   ├── chinese/
│   ├── celtic/
│   └── japanese/
├── themes/
│   ├── theme-base.css
│   ├── theme-picker.js
│   ├── smart-links.js
│   └── corpus-links.css
└── styles.css
```

### Current Features ✅
- **Glass morphism design** with theme picker
- **Corpus search integration** with ancient texts
- **Smart links system** for cross-references
- **Breadcrumb navigation**
- **Cross-mythology parallels**
- **Modern responsive layouts**

### Pain Points ⚠️
- **Content duplication** (same herbs/items appear in multiple mythologies)
- **Inconsistent presentation** (different styling approaches per section)
- **No unified item/place pages** (scattered information)
- **No community system** (no user comments/contributions)
- **No centralized resource linking** (hard to find all references to an item)

---

## Proposed Architecture

### Phase 1: Core Template System

#### 1.1 Directory Structure
```
EyesOfAzrael/
├── shared/
│   ├── items/              # Centralized items database
│   │   ├── index.html      # Browse all items
│   │   ├── search.html     # Item search interface
│   │   └── data/
│   │       ├── herbs/
│   │       │   ├── mugwort.html
│   │       │   ├── frankincense.html
│   │       │   └── ...
│   │       ├── artifacts/
│   │       │   ├── mjolnir.html
│   │       │   ├── aegis.html
│   │       │   └── ...
│   │       ├── materials/
│   │       │   ├── gold.html
│   │       │   ├── jade.html
│   │       │   └── ...
│   │       └── categories.json
│   │
│   ├── places/             # Centralized places database
│   │   ├── index.html
│   │   ├── search.html
│   │   └── data/
│   │       ├── realms/
│   │       │   ├── underworld.html
│   │       │   ├── heaven.html
│   │       │   └── ...
│   │       ├── temples/
│   │       ├── mountains/
│   │       └── categories.json
│   │
│   ├── magic/              # Centralized magic systems
│   │   ├── index.html
│   │   ├── divination.html
│   │   ├── invocation.html
│   │   ├── alchemy.html
│   │   └── ...
│   │
│   └── concepts/           # Universal concepts (justice, fate, etc.)
│       ├── index.html
│       └── data/
│
├── templates/              # Reusable HTML templates
│   ├── item-template.html
│   ├── place-template.html
│   ├── deity-template.html
│   ├── concept-template.html
│   └── components/
│       ├── info-panel.html
│       ├── reference-card.html
│       ├── mythology-badge.html
│       ├── user-theory-section.html
│       └── comment-section.html
│
├── components/             # JavaScript components
│   ├── panels/
│   │   ├── item-panel.js
│   │   ├── place-panel.js
│   │   ├── deity-panel.js
│   │   └── reference-panel.js
│   ├── auth/
│   │   ├── auth-manager.js
│   │   ├── login-modal.js
│   │   └── user-profile.js
│   ├── comments/
│   │   ├── comment-system.js
│   │   ├── comment-form.js
│   │   └── comment-thread.js
│   └── search/
│       ├── unified-search.js
│       └── filters.js
│
├── data/                   # JSON data files
│   ├── items.json          # All items with metadata
│   ├── places.json         # All places with metadata
│   ├── cross-references.json
│   ├── mythology-mappings.json
│   └── user-theories.json
│
└── api/                    # Backend API endpoints
    ├── items/
    ├── places/
    ├── comments/
    ├── auth/
    └── search/
```

#### 1.2 Template Features Matrix

| Feature | Item Template | Place Template | Deity Template | Concept Template |
|---------|---------------|----------------|----------------|------------------|
| Hero Section | ✅ | ✅ | ✅ | ✅ |
| Attributes Grid | ✅ | ✅ | ✅ | ✅ |
| Corpus Search | ✅ | ✅ | ✅ | ✅ |
| Smart Links | ✅ | ✅ | ✅ | ✅ |
| Cross-References | ✅ | ✅ | ✅ | ✅ |
| Mythology Badges | ✅ | ✅ | N/A | ✅ |
| Diagrams/SVG | ✅ | ✅ | ✅ | ✅ |
| User Theories | ✅ | ✅ | ✅ | ✅ |
| Comments | ✅ | ✅ | ✅ | ✅ |
| Related Items | ✅ | ✅ | ✅ | ✅ |
| Gallery | ✅ | ✅ | Optional | Optional |
| Timeline | Optional | ✅ | ✅ | Optional |

---

## Phase 2: Template Specifications

### 2.1 Item Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ITEM_NAME}} - Sacred Items</title>

    <!-- Core Styles -->
    <link rel="stylesheet" href="../../themes/theme-base.css">
    <link rel="stylesheet" href="../../styles.css">
    <link rel="stylesheet" href="../../themes/corpus-links.css">
    <link rel="stylesheet" href="../../themes/smart-links.css">
    <link rel="stylesheet" href="../../components/panels/panels.css">

    <!-- Component Scripts -->
    <script defer src="../../themes/theme-animations.js"></script>
    <script defer src="../../themes/smart-links.js"></script>
    <script defer src="../../themes/theme-picker.js"></script>
    <script defer src="../../components/panels/item-panel.js"></script>
    <script defer src="../../components/auth/auth-manager.js"></script>
    <script defer src="../../components/comments/comment-system.js"></script>

    <style>
        :root {
            --item-primary: {{ITEM_COLOR_PRIMARY}};
            --item-secondary: {{ITEM_COLOR_SECONDARY}};
        }
    </style>
</head>
<body>
    <!-- Theme Picker -->
    <div id="theme-picker-container"></div>

    <!-- Header -->
    <header>
        <div class="header-content">
            <h1>{{ITEM_ICON}} {{ITEM_NAME}}</h1>
            <nav class="header-nav">
                <a href="../../index.html">Home</a>
                <a href="../index.html">Items</a>
                <a href="../../mythos/index.html">Mythologies</a>
            </nav>
        </div>
    </header>

    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../../index.html">Home</a> →
        <a href="../index.html">Items</a> →
        <a href="../data/{{CATEGORY}}/index.html">{{CATEGORY_NAME}}</a> →
        <span>{{ITEM_NAME}}</span>
    </nav>

    <main>
        <!-- Hero Section -->
        <section class="item-hero" style="background: linear-gradient(135deg, var(--item-primary), var(--item-secondary));">
            <div class="hero-icon">{{ITEM_ICON}}</div>
            <h1>{{ITEM_NAME}}</h1>
            <p class="subtitle">{{ITEM_SUBTITLE}}</p>
            <div class="mythology-badges">
                <!-- Dynamic: One badge per mythology where this item appears -->
                <span class="myth-badge" data-mythology="greek">Greek</span>
                <span class="myth-badge" data-mythology="norse">Norse</span>
            </div>
        </section>

        <!-- Quick Info Panel -->
        <section class="info-panel glass-card">
            <div class="attribute-grid">
                <div class="attribute-card">
                    <div class="attribute-label">Category</div>
                    <div class="attribute-value">{{CATEGORY}}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Type</div>
                    <div class="attribute-value">{{TYPE}}</div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Associated Deities</div>
                    <div class="attribute-value">
                        <!-- Dynamic deity links -->
                        <a href="#" data-deity="{{DEITY_ID}}">{{DEITY_NAME}}</a>
                    </div>
                </div>
                <div class="attribute-card">
                    <div class="attribute-label">Mythologies</div>
                    <div class="attribute-value">
                        <span class="myth-badge mini">Greek</span>
                        <span class="myth-badge mini">Norse</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Description -->
        <section class="content-section glass-card">
            <h2>Overview</h2>
            <p>{{ITEM_DESCRIPTION}}</p>

            <!-- Corpus Link -->
            <div class="corpus-integration">
                <a class="corpus-link" href="../../corpus-search.html?term={{ITEM_NAME}}"
                   title="Search ancient texts for '{{ITEM_NAME}}'">
                    📜 View in Ancient Texts
                </a>
            </div>
        </section>

        <!-- Properties & Attributes -->
        <section class="content-section glass-card">
            <h2>Properties & Attributes</h2>
            <ul class="property-list">
                {{#PROPERTIES}}
                <li><strong>{{PROPERTY_NAME}}:</strong> {{PROPERTY_VALUE}}</li>
                {{/PROPERTIES}}
            </ul>
        </section>

        <!-- Mythology-Specific Uses -->
        <section class="content-section glass-card">
            <h2>Uses Across Mythologies</h2>

            {{#MYTHOLOGIES}}
            <div class="mythology-section" data-mythology="{{MYTHOLOGY_ID}}">
                <h3>
                    <span class="myth-badge">{{MYTHOLOGY_NAME}}</span>
                    {{MYTHOLOGY_NAME}} Tradition
                </h3>
                <p>{{USAGE_DESCRIPTION}}</p>

                <!-- Related Deities in this mythology -->
                <div class="related-deities">
                    <h4>Associated Deities:</h4>
                    <div class="deity-cards">
                        {{#DEITIES}}
                        <div class="mini-card deity-card" data-deity-id="{{DEITY_ID}}">
                            <span class="deity-icon">{{DEITY_ICON}}</span>
                            <span class="deity-name">{{DEITY_NAME}}</span>
                        </div>
                        {{/DEITIES}}
                    </div>
                </div>

                <!-- Related Rituals -->
                <div class="related-rituals">
                    <h4>Related Rituals:</h4>
                    <ul>
                        {{#RITUALS}}
                        <li><a href="{{RITUAL_URL}}">{{RITUAL_NAME}}</a> - {{RITUAL_DESC}}</li>
                        {{/RITUALS}}
                    </ul>
                </div>

                <!-- Ancient Text References -->
                <div class="text-references">
                    <h4>Ancient Text References:</h4>
                    <ul class="reference-list">
                        {{#REFERENCES}}
                        <li>
                            <a class="corpus-link" href="{{CORPUS_URL}}">
                                {{TEXT_NAME}}
                            </a> - {{REFERENCE_CONTEXT}}
                        </li>
                        {{/REFERENCES}}
                    </ul>
                </div>
            </div>
            {{/MYTHOLOGIES}}
        </section>

        <!-- Visualization Section -->
        <section class="content-section glass-card">
            <h2>Visual Representation</h2>
            <div class="diagram-container">
                <!-- SVG or Image -->
                {{DIAGRAM_SVG}}
            </div>
        </section>

        <!-- Related Items Panel -->
        <section class="content-section glass-card">
            <h2>Related Items</h2>
            <div class="related-items-grid">
                {{#RELATED_ITEMS}}
                <div class="item-mini-card" data-item-id="{{ITEM_ID}}">
                    <span class="item-icon">{{ITEM_ICON}}</span>
                    <span class="item-name">{{ITEM_NAME}}</span>
                    <span class="item-category">{{ITEM_CATEGORY}}</span>
                </div>
                {{/RELATED_ITEMS}}
            </div>
        </section>

        <!-- User Theory Section -->
        <section class="content-section glass-card user-theory-section">
            <h2>User Theories & Interpretations</h2>
            <p class="section-intro">
                Community members can share modern interpretations, personal insights,
                and theoretical connections. All user content is clearly marked as
                contemporary commentary, not traditional scholarship.
            </p>

            <!-- Auth Required Notice -->
            <div class="auth-notice" data-auth-required="true">
                <p>🔒 <a href="#" class="login-link">Log in</a> to submit your theory</p>
            </div>

            <!-- Theory Submission Form (authenticated users only) -->
            <div class="theory-form" data-auth-required="true" style="display: none;">
                <h3>Submit Your Theory</h3>
                <form id="theory-form">
                    <input type="hidden" name="item_id" value="{{ITEM_ID}}">
                    <input type="hidden" name="user_id" value="">

                    <label for="theory-title">Theory Title</label>
                    <input type="text" id="theory-title" name="title" required
                           placeholder="e.g., 'Connection to Quantum Physics'">

                    <label for="theory-category">Category</label>
                    <select id="theory-category" name="category">
                        <option value="interpretation">Modern Interpretation</option>
                        <option value="physics">Physics Connection</option>
                        <option value="symbolism">Symbolic Analysis</option>
                        <option value="comparison">Cross-Cultural Comparison</option>
                        <option value="personal">Personal Experience</option>
                    </select>

                    <label for="theory-content">Theory Content (Markdown supported)</label>
                    <textarea id="theory-content" name="content" rows="10" required
                              placeholder="Share your insights..."></textarea>

                    <label for="theory-tags">Tags (comma-separated)</label>
                    <input type="text" id="theory-tags" name="tags"
                           placeholder="e.g., physics, kabbalah, dimensions">

                    <button type="submit" class="btn-primary">Submit Theory</button>
                </form>
            </div>

            <!-- Existing Theories -->
            <div class="theories-list">
                <h3>Community Theories</h3>

                <!-- Filter/Sort Controls -->
                <div class="theory-controls">
                    <select id="theory-filter">
                        <option value="all">All Categories</option>
                        <option value="interpretation">Modern Interpretation</option>
                        <option value="physics">Physics Connection</option>
                        <option value="symbolism">Symbolic Analysis</option>
                    </select>

                    <select id="theory-sort">
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="discussed">Most Discussed</option>
                    </select>
                </div>

                <!-- Theory Cards (loaded dynamically) -->
                <div id="theories-container">
                    {{#USER_THEORIES}}
                    <div class="theory-card glass-card" data-theory-id="{{THEORY_ID}}">
                        <div class="theory-header">
                            <div class="theory-meta">
                                <span class="theory-category badge">{{CATEGORY}}</span>
                                <span class="theory-author">by {{AUTHOR_NAME}}</span>
                                <span class="theory-date">{{DATE}}</span>
                            </div>
                            <div class="theory-votes">
                                <button class="vote-btn upvote" data-theory-id="{{THEORY_ID}}">▲</button>
                                <span class="vote-count">{{VOTE_COUNT}}</span>
                                <button class="vote-btn downvote" data-theory-id="{{THEORY_ID}}">▼</button>
                            </div>
                        </div>

                        <h4 class="theory-title">{{THEORY_TITLE}}</h4>

                        <div class="theory-content">
                            {{THEORY_CONTENT_PREVIEW}}
                        </div>

                        <button class="expand-theory" data-theory-id="{{THEORY_ID}}">
                            Read More
                        </button>

                        <div class="theory-tags">
                            {{#TAGS}}
                            <span class="tag">{{TAG_NAME}}</span>
                            {{/TAGS}}
                        </div>

                        <div class="theory-actions">
                            <button class="comment-btn" data-theory-id="{{THEORY_ID}}">
                                💬 {{COMMENT_COUNT}} Comments
                            </button>
                            <button class="share-btn" data-theory-id="{{THEORY_ID}}">
                                🔗 Share
                            </button>
                        </div>

                        <!-- Expandable Full Content -->
                        <div class="theory-full-content" style="display: none;">
                            {{THEORY_FULL_CONTENT}}
                        </div>

                        <!-- Comments Section (expandable) -->
                        <div class="theory-comments" style="display: none;">
                            <!-- Comments loaded dynamically -->
                        </div>
                    </div>
                    {{/USER_THEORIES}}
                </div>
            </div>
        </section>

        <!-- Comments Section -->
        <section class="content-section glass-card comments-section">
            <h2>Discussion & Comments</h2>

            <!-- Auth Required Notice -->
            <div class="auth-notice" data-auth-required="true">
                <p>🔒 <a href="#" class="login-link">Log in</a> to join the discussion</p>
            </div>

            <!-- Comment Form (authenticated users only) -->
            <div class="comment-form" data-auth-required="true" style="display: none;">
                <form id="new-comment-form">
                    <textarea id="comment-text" placeholder="Share your thoughts..."
                              rows="4" required></textarea>
                    <button type="submit" class="btn-primary">Post Comment</button>
                </form>
            </div>

            <!-- Comments List -->
            <div id="comments-container">
                <!-- Comments loaded dynamically via comment-system.js -->
            </div>
        </section>

        <!-- See Also / Cross References -->
        <section class="content-section glass-card">
            <h2>See Also</h2>
            <div class="cross-references">
                <div class="ref-category">
                    <h3>Related Deities</h3>
                    <div class="ref-grid">
                        {{#RELATED_DEITIES}}
                        <a href="{{DEITY_URL}}" class="ref-card">
                            <span class="ref-icon">{{DEITY_ICON}}</span>
                            <span class="ref-name">{{DEITY_NAME}}</span>
                            <span class="ref-tradition">{{MYTHOLOGY}}</span>
                        </a>
                        {{/RELATED_DEITIES}}
                    </div>
                </div>

                <div class="ref-category">
                    <h3>Related Places</h3>
                    <div class="ref-grid">
                        {{#RELATED_PLACES}}
                        <a href="{{PLACE_URL}}" class="ref-card">
                            <span class="ref-icon">{{PLACE_ICON}}</span>
                            <span class="ref-name">{{PLACE_NAME}}</span>
                            <span class="ref-type">{{PLACE_TYPE}}</span>
                        </a>
                        {{/RELATED_PLACES}}
                    </div>
                </div>

                <div class="ref-category">
                    <h3>Related Concepts</h3>
                    <div class="ref-grid">
                        {{#RELATED_CONCEPTS}}
                        <a href="{{CONCEPT_URL}}" class="ref-card">
                            <span class="ref-icon">{{CONCEPT_ICON}}</span>
                            <span class="ref-name">{{CONCEPT_NAME}}</span>
                        </a>
                        {{/RELATED_CONCEPTS}}
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer>
        <p>&copy; 2025 Eyes of Azrael. Content is a mix of traditional scholarship and community contributions.</p>
    </footer>
</body>
</html>
```

### 2.2 Place Template Structure

*(Similar structure to Item Template with place-specific sections)*

**Key Sections:**
- Hero section with map integration
- Location attributes (realm, geography, accessibility)
- Mythology-specific significance
- Associated deities/events
- Pilgrimage/visitation info
- User experiences section
- Comments

### 2.3 Panel/Card Components

#### Mini Reference Card Component
```html
<!-- components/panels/reference-card.html -->
<div class="reference-card" data-type="{{TYPE}}" data-id="{{ID}}">
    <div class="ref-card-icon">{{ICON}}</div>
    <div class="ref-card-content">
        <h4 class="ref-card-title">{{TITLE}}</h4>
        <p class="ref-card-desc">{{SHORT_DESC}}</p>
        <div class="ref-card-badges">
            {{#MYTHOLOGIES}}
            <span class="myth-badge mini">{{MYTHOLOGY}}</span>
            {{/MYTHOLOGIES}}
        </div>
    </div>
    <button class="ref-card-expand" data-id="{{ID}}">View Details</button>
</div>
```

#### Expandable Info Panel
```html
<!-- components/panels/info-panel.html -->
<div class="info-panel glass-card expandable" data-panel-id="{{PANEL_ID}}">
    <div class="panel-header" onclick="togglePanel('{{PANEL_ID}}')">
        <h3>{{PANEL_TITLE}}</h3>
        <span class="panel-toggle">▼</span>
    </div>
    <div class="panel-content" style="display: none;">
        {{PANEL_CONTENT}}
    </div>
</div>
```

---

## Phase 3: User Authentication System

### 3.1 Authentication Architecture

**Frontend (Client-side):**
```javascript
// components/auth/auth-manager.js

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.init();
    }

    init() {
        // Check for existing session
        this.authToken = localStorage.getItem('auth_token');
        if (this.authToken) {
            this.validateSession();
        }
        this.setupAuthUI();
    }

    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            this.authToken = data.token;
            this.currentUser = data.user;
            localStorage.setItem('auth_token', data.token);
            this.updateUIForAuth();
            return true;
        }
        return false;
    }

    async register(email, username, password) {
        // Implementation
    }

    async logout() {
        localStorage.removeItem('auth_token');
        this.authToken = null;
        this.currentUser = null;
        this.updateUIForNoAuth();
    }

    setupAuthUI() {
        // Show/hide auth-required elements
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            if (this.currentUser) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
    }
}
```

**Backend Options:**

**Option A: Firebase Authentication** (Recommended for MVP)
- Pros: Free tier, no backend code, easy integration
- Cons: Vendor lock-in, limited customization

**Option B: Custom Node.js + JWT**
- Pros: Full control, can integrate with existing backend
- Cons: More complex setup, security responsibility

**Option C: Auth0 / Clerk**
- Pros: Professional auth, good free tier, modern UX
- Cons: Dependency on third party

### 3.2 User Profile Schema

```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "timestamp",
  "profile": {
    "display_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "favorite_mythologies": ["greek", "norse"],
    "expertise_tags": ["kabbalah", "physics", "alchemy"]
  },
  "reputation": {
    "points": 0,
    "level": "Novice",
    "badges": []
  },
  "contributions": {
    "theories_count": 0,
    "comments_count": 0,
    "votes_received": 0
  }
}
```

---

## Phase 4: Comment System

### 4.1 Comment Component

```javascript
// components/comments/comment-system.js

class CommentSystem {
    constructor(entityType, entityId) {
        this.entityType = entityType; // 'item', 'place', 'deity', etc.
        this.entityId = entityId;
        this.comments = [];
        this.loadComments();
    }

    async loadComments() {
        const response = await fetch(
            `/api/comments/${this.entityType}/${this.entityId}`
        );
        this.comments = await response.json();
        this.render();
    }

    async postComment(content, parentId = null) {
        const authManager = window.authManager;
        if (!authManager.currentUser) {
            alert('Please log in to comment');
            return;
        }

        const response = await fetch('/api/comments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authManager.authToken}`
            },
            body: JSON.stringify({
                entity_type: this.entityType,
                entity_id: this.entityId,
                content: content,
                parent_id: parentId
            })
        });

        if (response.ok) {
            await this.loadComments(); // Refresh
        }
    }

    render() {
        const container = document.getElementById('comments-container');
        container.innerHTML = this.comments.map(comment =>
            this.renderComment(comment)
        ).join('');
    }

    renderComment(comment) {
        return `
            <div class="comment glass-card" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <img src="${comment.author.avatar}" class="comment-avatar">
                    <div class="comment-meta">
                        <span class="comment-author">${comment.author.username}</span>
                        <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-actions">
                        <button class="vote-btn upvote" data-comment-id="${comment.id}">
                            ▲ ${comment.upvotes}
                        </button>
                        <button class="vote-btn downvote" data-comment-id="${comment.id}">
                            ▼ ${comment.downvotes}
                        </button>
                    </div>
                </div>
                <div class="comment-content">
                    ${comment.content}
                </div>
                <div class="comment-footer">
                    <button class="reply-btn" data-comment-id="${comment.id}">
                        Reply
                    </button>
                    ${comment.author.id === window.authManager.currentUser?.id ? `
                        <button class="edit-btn" data-comment-id="${comment.id}">Edit</button>
                        <button class="delete-btn" data-comment-id="${comment.id}">Delete</button>
                    ` : ''}
                </div>
                ${comment.replies?.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => this.renderComment(reply)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
}
```

### 4.2 Comment Database Schema

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,  -- 'item', 'place', 'deity', 'theory'
    entity_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES comments(id),  -- For threaded replies
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- Soft delete
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id)
);
```

---

## Phase 5: Data Migration Strategy

### 5.1 Content Inventory

**Items to Migrate:**
- Herbs (appears in Greek, Norse, Egyptian, Celtic, etc.)
- Sacred objects (Mjolnir, Aegis, Ark, etc.)
- Materials (gold, jade, frankincense, myrrh)

**Places to Migrate:**
- Underworld (appears in all mythologies)
- Mountains (Olympus, Sinai, Kailash, etc.)
- Temples (appears across mythologies)

**Magic Systems:**
- Divination (appears in all)
- Invocation/Prayer (universal)
- Alchemy (appears in multiple)

### 5.2 Migration Process

**Step 1: Audit & Catalog**
- Run scripts to identify duplicate content across mythologies
- Create master inventory with cross-references

**Step 2: Create Centralized Pages**
- Build item/place pages in `shared/` directory
- Include ALL mythology references on single page
- Add mythology badges for quick identification

**Step 3: Update Mythology Pages**
- Replace full content with panel references
- Keep mythology-specific context
- Add links to centralized pages

**Example Migration:**

**Before (Greek herbs/mugwort.html):**
```html
<h1>Mugwort</h1>
<p>Full content about mugwort in Greek tradition...</p>
```

**After (Greek herbs/mugwort.html):**
```html
<h1>Mugwort</h1>
<div class="centralized-item-reference">
    <p>Mugwort is a sacred herb used across many traditions.</p>
    <a href="../../../shared/items/data/herbs/mugwort.html" class="btn-primary">
        View Complete Mugwort Information →
    </a>
</div>

<h2>Use in Greek Tradition</h2>
<p>Greek-specific usage details...</p>
```

---

## Phase 6: Implementation Roadmap

### Week 1-2: Foundation
- [ ] Create directory structure
- [ ] Design template HTML/CSS
- [ ] Build panel components
- [ ] Set up auth system (Firebase for MVP)

### Week 3-4: Core Templates
- [ ] Implement Item Template
- [ ] Implement Place Template
- [ ] Implement panel components
- [ ] Create CSS for all components

### Week 5-6: User System
- [ ] Integrate Firebase Auth
- [ ] Build user profile pages
- [ ] Implement comment system
- [ ] Create user theory submission form

### Week 7-8: Data Migration
- [ ] Audit all content for duplicates
- [ ] Create centralized item pages (top 20 items)
- [ ] Create centralized place pages (top 10 places)
- [ ] Update mythology pages with references

### Week 9-10: Testing & Polish
- [ ] Cross-browser testing
- [ ] Mobile responsiveness check
- [ ] Performance optimization
- [ ] Security audit

### Week 11-12: Launch & Iteration
- [ ] Deploy to production
- [ ] Monitor user feedback
- [ ] Fix bugs
- [ ] Plan Phase 2 features

---

## Phase 7: Technical Specifications

### 7.1 Component API

**Panel Component Interface:**
```javascript
// Usage in any page:
<div data-reference-panel
     data-type="item"
     data-id="mugwort"
     data-compact="true"></div>

// JavaScript automatically loads and renders the panel
```

### 7.2 Data Format

**items.json:**
```json
{
  "items": [
    {
      "id": "mugwort",
      "name": "Mugwort",
      "category": "herb",
      "icon": "🌿",
      "color_primary": "#4a7c59",
      "color_secondary": "#7ba591",
      "short_description": "Sacred herb for protection and divination",
      "mythologies": [
        {
          "tradition": "greek",
          "usage": "Used in Eleusinian mysteries...",
          "deities": ["artemis", "hecate"],
          "rituals": ["divination", "protection"],
          "references": [
            {
              "text": "Orphic Hymns",
              "passage": "Hymn to Artemis, Line 15",
              "url": "/corpus/greek/orphic-hymns/artemis"
            }
          ]
        },
        {
          "tradition": "norse",
          "usage": "Sacred to Odin for wisdom...",
          "deities": ["odin", "freya"],
          "rituals": ["seidr", "rune-casting"]
        }
      ],
      "properties": [
        { "name": "Element", "value": "Earth" },
        { "name": "Planet", "value": "Moon" },
        { "name": "Chakra", "value": "Third Eye" }
      ],
      "related_items": ["wormwood", "vervain", "yarrow"],
      "related_places": ["delphi", "dodona"],
      "related_concepts": ["divination", "protection"]
    }
  ]
}
```

---

## Phase 8: Success Metrics

**Technical Metrics:**
- Page load time < 2 seconds
- Zero broken internal links
- 100% mobile responsive
- Accessibility score > 90 (WCAG AA)

**Content Metrics:**
- Centralize top 50 items within 3 months
- Centralize top 20 places within 3 months
- Achieve 80% reduction in content duplication

**Community Metrics:**
- 100+ user registrations in first month
- 50+ user theories submitted in first quarter
- 500+ comments in first quarter
- Average user session > 5 minutes

---

## Phase 9: Future Enhancements

### Phase 2 Features (Months 4-6)
- Advanced search with filters
- User reputation/badge system
- Theory voting/ranking system
- Mobile app (Progressive Web App)
- Offline mode

### Phase 3 Features (Months 7-12)
- AI-powered cross-reference suggestions
- Interactive mythology maps
- Timeline visualization tool
- Comparative mythology explorer
- API for external integrations

---

## Conclusion

This modular template architecture will:

1. ✅ **Unify content** across mythologies
2. ✅ **Eliminate duplication** through centralization
3. ✅ **Enable community** contributions via auth + comments
4. ✅ **Maintain quality** through user theory disclaimers
5. ✅ **Support all features** (corpus, diagrams, smart links)
6. ✅ **Scale easily** as content grows
7. ✅ **Provide consistency** through reusable templates

The system is designed to be implemented incrementally, allowing the site to remain functional throughout the migration process.

---

**Next Steps:**
1. Review and approve architecture
2. Set up development environment
3. Begin Phase 1 implementation
4. Create first template prototypes
5. Test with sample content

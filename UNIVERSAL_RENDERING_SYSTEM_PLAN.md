# Universal Asset Rendering & Submission System - Master Plan

## Overview
Transform the Eyes of Azrael platform into a fully flexible, user-driven content system where every asset can be displayed in multiple formats and users can contribute content that matches all existing display capabilities.

## Core Requirements

### 1. Multi-Format Display System
Every entity type must support:
- **Grid View** (2-wide mobile, 4-wide desktop, 4-wide horizontal mobile)
- **List View** (vertical stacked, detailed rows)
- **Table View** (sortable columns, filterable)
- **Panel View** (detailed cards with expand/collapse)
- **Inline References** (mini badges, tooltips)

### 2. Responsive Grid Standards
```css
/* Mobile Portrait */
.entity-grid { grid-template-columns: repeat(2, 1fr); }

/* Mobile Landscape */
@media (orientation: landscape) {
    .entity-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Tablet */
@media (min-width: 768px) {
    .entity-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
    .entity-grid { grid-template-columns: repeat(4, 1fr); }
}
```

### 3. User Submission System
- **Form parity**: User submission forms must generate data compatible with ALL display methods
- **Preview modes**: Real-time preview in grid/list/table/panel before submission
- **Icon generation**: AI-powered SVG icon creation based on entity content
- **Display options**: Users can add display options for nested entities (grids, tables, lists, panels)

### 4. Nested Mythology System
Structure:
```
/mythos/jewish/                    (Base Level - General Judaism)
  ├─ deities/
  ├─ heroes/
  ├─ cosmology/
  └─ /kabbalah/                   (Advanced Level - Esoteric Judaism)
      ├─ sefirot/
      ├─ worlds/
      ├─ physics/
      └─ sparks/

/mythos/christian/                 (Base Level - General Christianity)
  ├─ deities/
  ├─ heroes/
  └─ /gnostic/                    (Advanced Level - Gnostic Christianity)
      ├─ aeons/
      ├─ texts/
      └─ concepts/
```

### 5. Asset-in-Asset Rendering
Pages can contain other assets rendered as:
- Grids (with + card for submission)
- Tables (sortable, filterable)
- Lists (ordered, categorized)
- Panels (collapsible sections)
- Links (inline references)

---

## Implementation Tasks

### Phase 1: Core Rendering Infrastructure
**Agent: rendering-infrastructure**

1. Create `UniversalEntityRenderer` class
   - Supports all entity types (deity, hero, creature, cosmology, ritual, herb, etc.)
   - Implements all display modes (grid, list, table, panel, inline)
   - Responsive grid logic (2/4/3/4 columns)

2. Update existing renderers
   - Refactor `attribute-grid-renderer.js`
   - Refactor `entity-card.js`
   - Consolidate into unified system

3. Create CSS framework
   - `universal-grid.css` - Responsive grid system
   - `universal-table.css` - Sortable tables
   - `universal-list.css` - List layouts
   - `universal-panel.css` - Panel/card layouts

### Phase 2: User Submission Enhancement
**Agent: submission-system**

1. Enhanced submission form (`theories/user-submissions/submit.html`)
   - Add display mode previews (grid/list/table/panel switcher)
   - Real-time preview of how submission will render
   - Icon auto-generation with edit capability

2. Display options editor
   - Allow users to specify how nested entities display
   - Grid size configuration (2-wide, 3-wide, 4-wide)
   - Table column selection
   - List categorization

3. Data schema updates
   - Add `displayOptions` field to submissions
   - Add `icon` field with SVG support
   - Add `nestedEntities` with render preferences

### Phase 3: AI Icon Generation
**Agent: icon-generation**

1. Extend SVG editor modal
   - Add AI generation endpoint
   - Generate icons from entity description
   - Allow user refinement

2. Auto-generate icons for existing entities
   - Batch generate icons for entities missing them
   - Store in Firebase with entity metadata

3. Integration with submission form
   - Auto-propose icon during submission
   - Show before/after preview
   - Allow manual override

### Phase 4: Nested Mythology Structure
**Agent: nested-mythology**

1. Create mythology hierarchy system
   - Base level: General mythology
   - Advanced level: Esoteric/specialized branches
   - Navigation breadcrumbs
   - Cross-linking

2. Implement for Jewish/Kabbalah
   - Separate base Jewish content
   - Advanced Kabbalistic content in subdirectory
   - Clear navigation between levels

3. Implement for Christian/Gnostic
   - Separate base Christian content
   - Advanced Gnostic content in subdirectory
   - Clear navigation between levels

4. Template for other mythologies
   - Identify candidates (Hindu/Vedanta, Buddhism/Tantra, etc.)
   - Create reusable structure

### Phase 5: Grid System with Submission Cards
**Agent: grid-submission-integration**

1. Add "+ Add Entity" cards to all grids
   - Detects context (mythology, entity type, parent)
   - Opens submission form with pre-filled metadata
   - Position at end of grid

2. Smart submission linking
   - Track parent-child relationships
   - Auto-populate related entities
   - Suggest similar entities

3. Permission system
   - Authenticated users see + cards
   - Guests see "Sign in to contribute" placeholder
   - Admin approval workflow

### Phase 6: Asset Display Options
**Agent: asset-display-options**

1. Create `DisplayOptionsEditor` component
   - Visual editor for specifying how nested entities render
   - Drag-and-drop grid builder
   - Table column selector
   - List categorization builder

2. Integrate with submission form
   - Add section for "Related Entities Display"
   - Preview how related entities will appear
   - Save preferences with submission

3. Rendering engine updates
   - Read `displayOptions` from entity data
   - Dynamically render nested entities per preferences
   - Fallback to defaults if not specified

### Phase 7: Full Website Rendering Pass
**Agent: full-site-audit**

1. Audit all mythology index pages
   - Ensure all use universal rendering
   - Check responsive behavior
   - Verify + cards appear

2. Audit all entity detail pages
   - Ensure multi-format display support
   - Check nested entity rendering
   - Verify submission integration

3. Audit all index/category pages
   - Standardize grid layouts
   - Add filtering controls
   - Ensure pagination

---

## Agent Deployment Strategy

### Agent 1: `rendering-infrastructure`
**Scope**: Create universal rendering system
**Deliverables**:
- `js/universal-entity-renderer.js`
- `css/universal-grid.css`
- `css/universal-table.css`
- `css/universal-list.css`
- `css/universal-panel.css`

### Agent 2: `submission-system`
**Scope**: Enhance user submission forms
**Deliverables**:
- Updated `theories/user-submissions/submit.html`
- `js/components/display-preview.js`
- `js/components/display-options-editor.js`

### Agent 3: `icon-generation`
**Scope**: AI icon generation system
**Deliverables**:
- `js/ai-icon-generator.js`
- Integration with SVG editor
- Batch icon generation script

### Agent 4: `nested-mythology`
**Scope**: Implement hierarchical mythology structure
**Deliverables**:
- Refactored Jewish/Kabbalah structure
- Refactored Christian/Gnostic structure
- Navigation system between levels

### Agent 5: `grid-submission-integration`
**Scope**: Add submission cards to all grids
**Deliverables**:
- Updated `add-entity-card.js` component
- Grid-level permission checking
- Context-aware submission forms

### Agent 6: `asset-display-options`
**Scope**: Allow users to specify nested entity display
**Deliverables**:
- `js/components/display-options-editor.js`
- Updated rendering engine
- Documentation

### Agent 7: `full-site-audit`
**Scope**: Complete pass on all pages
**Deliverables**:
- Updated all mythology index pages
- Updated all entity detail pages
- Audit report with screenshots

---

## Data Schema Extensions

### Entity Schema
```json
{
  "id": "zeus",
  "name": "Zeus",
  "entityType": "deity",
  "mythology": "greek",
  "icon": "<svg>...</svg>",
  "displayOptions": {
    "relatedDeities": {
      "mode": "grid",
      "columns": 4,
      "sort": "name"
    },
    "relatedHeroes": {
      "mode": "list",
      "categorize": "by_quest"
    },
    "relatedMyths": {
      "mode": "table",
      "columns": ["title", "theme", "source"]
    }
  },
  "nestedEntities": {
    "children": ["ares", "athena", "apollo"],
    "siblings": ["poseidon", "hades"],
    "consorts": ["hera", "leto", "semele"]
  }
}
```

### Submission Schema
```json
{
  "entityType": "deity",
  "mythology": "norse",
  "parentPath": "/mythos/norse/deities",
  "icon": {
    "type": "svg",
    "generated": true,
    "source": "ai",
    "svg": "<svg>...</svg>"
  },
  "displayOptions": {
    "defaultView": "grid",
    "gridColumns": 4,
    "allowedViews": ["grid", "list", "panel"]
  }
}
```

---

## Success Criteria

1. ✅ All entity types render in grid/list/table/panel modes
2. ✅ Grids are responsive (2-wide mobile, 4-wide desktop)
3. ✅ All grids have + submission cards
4. ✅ User submissions generate data compatible with all display modes
5. ✅ Nested mythology structure implemented for Jewish/Kabbalah and Christian/Gnostic
6. ✅ AI icon generation functional
7. ✅ Users can specify display options for nested entities
8. ✅ Full site audit completed with 100% compliance

---

## Timeline

- **Phase 1**: 2 hours (infrastructure)
- **Phase 2**: 2 hours (submission system)
- **Phase 3**: 1 hour (icon generation)
- **Phase 4**: 2 hours (nested mythology)
- **Phase 5**: 1 hour (grid submission cards)
- **Phase 6**: 2 hours (display options)
- **Phase 7**: 3 hours (full audit)

**Total**: ~13 hours with 7 parallel agents
**Actual**: ~2-3 hours with concurrent execution

# Sacred Places Metadata Integration Guide

## Overview

This guide explains how to integrate the enriched sacred place metadata into the Eyes of Azrael application frontend and Firebase.

## Metadata Field Descriptions

### 1. inhabitants (Array of Strings)
Divine beings, mythological figures, and spiritual entities associated with the place.

**Usage in UI**: Display as a list of residents or inhabitants
```javascript
// Display as a grid or list
if (place.inhabitants && place.inhabitants.length > 0) {
  displaySection('Inhabitants', place.inhabitants);
}
```

**Example**: Mount Olympus
```json
["Zeus", "Hera", "Poseidon", "Athena", "Apollo", "Artemis", ...]
```

### 2. guardians (Array of Strings)
Protective deities, guardians, and forces that protect or maintain the sacred place.

**Usage in UI**: Display as protector deities with descriptions
```javascript
// Create guardian cards with icons
if (place.guardians && place.guardians.length > 0) {
  displayGuardianCards(place.guardians);
}
```

**Example**: Asgard
```json
["Heimdall (guardian of Bifrost)", "The Aesir collective", "Garmr (watchdog of Ragnarok)"]
```

### 3. significance (String)
Religious, cultural, and spiritual importance of the place. Rich paragraph text explaining why the place is sacred.

**Usage in UI**: Display as a highlighted section with rich formatting
```javascript
// Rich text section
if (place.significance) {
  displayHighlightedSection('Significance', place.significance, {
    backgroundColor: 'var(--color-sacred)',
    padding: '1.5rem',
    borderLeft: '4px solid var(--color-primary)'
  });
}
```

**Example**: Mecca
```
"The holiest city in Islam; birthplace of Prophet Muhammad; center of Islamic faith
and practice; destination of the Hajj pilgrimage (one of Five Pillars); the Kaaba is
the qibla (direction of prayer) for all Muslims worldwide"
```

### 4. geography (String)
Physical location, elevation, distinctive geographical features, and architectural elements.

**Usage in UI**: Display in location info panel with coordinates if available
```javascript
// Geography with location data
if (place.geography) {
  displayLocationPanel({
    description: place.geography,
    coordinates: place.geographical?.primaryLocation?.coordinates,
    region: place.geographical?.region
  });
}
```

**Example**: Mount Kailash
```
"Located in Ngari Prefecture, Tibet Autonomous Region, China. Elevation: 6,638 meters
(21,778 feet). Four-sided pyramid shape with snow-covered peaks; considered the most
sacred mountain in multiple Asian traditions. Lake Manasarovar at its base."
```

### 5. relatedEvents (Array of Strings)
Mythological, historical, or spiritual events associated with the place.

**Usage in UI**: Display as a timeline or bullet list
```javascript
// Timeline of events
if (place.relatedEvents && place.relatedEvents.length > 0) {
  displayTimeline(place.relatedEvents);
}
```

**Example**: Lourdes
```json
[
  "Marian apparitions to Bernadette (1858)",
  "Discovery of healing spring water",
  "Canonization of Bernadette Soubirous",
  "Recognition of medical miracles by Church",
  "Annual International Pilgrimages and processions",
  "Night vigils with thousands of candles"
]
```

### 6. accessibility (String)
How to reach or access the place - either physical travel information or mythological/spiritual requirements.

**Usage in UI**: Display in practical information section
```javascript
// Accessibility info
if (place.accessibility) {
  displayPracticalInfo('Accessibility', place.accessibility, {
    icon: getAccessibilityIcon(place.accessibility),
    className: place.accessibility.includes('mythical') ? 'mythical' : 'physical'
  });
}
```

**Example**: Mount Fuji
```
"Climbing season: July-September; multiple ascent trails with varying difficulty;
mountain huts provide accommodation; requires physical fitness"
```

## Renderer Integration Points

### universal-display-renderer.js

Add metadata display sections:

```javascript
// In PlaceDetailRenderer
renderMetadata(place) {
  const sections = [];

  // Inhabitants section
  if (place.inhabitants?.length > 0) {
    sections.push({
      title: 'Inhabitants',
      type: 'entity-list',
      content: place.inhabitants,
      icon: '👥'
    });
  }

  // Guardians section
  if (place.guardians?.length > 0) {
    sections.push({
      title: 'Guardians',
      type: 'entity-list',
      content: place.guardians,
      icon: '⚔️'
    });
  }

  // Significance section
  if (place.significance) {
    sections.push({
      title: 'Significance',
      type: 'rich-text',
      content: place.significance,
      icon: '✨',
      class: 'highlight-box'
    });
  }

  // Geography section
  if (place.geography) {
    sections.push({
      title: 'Geography',
      type: 'text',
      content: place.geography,
      icon: '🌍'
    });
  }

  // Related Events section
  if (place.relatedEvents?.length > 0) {
    sections.push({
      title: 'Related Events',
      type: 'timeline',
      content: place.relatedEvents,
      icon: '📜'
    });
  }

  // Accessibility section
  if (place.accessibility) {
    sections.push({
      title: 'Accessibility',
      type: 'info-box',
      content: place.accessibility,
      icon: place.accessibility.includes('mythical') ? '✨' : '🚶'
    });
  }

  return sections;
}
```

### entity-detail-view.js

Update place detail view template:

```javascript
// In entity-detail-view.js - renderPlace() method
renderPlace(place) {
  return `
    <div class="place-detail">
      <header class="place-header">
        <h1>${place.name}</h1>
        <p class="place-type">${place.placeType}</p>
      </header>

      <main class="place-content">
        <!-- Existing description -->
        <section class="description">
          ${place.longDescription || place.shortDescription}
        </section>

        <!-- NEW: Significance -->
        ${place.significance ? `
          <section class="significance highlight-section">
            <h2>Spiritual Significance</h2>
            <p>${place.significance}</p>
          </section>
        ` : ''}

        <!-- NEW: Inhabitants -->
        ${place.inhabitants?.length > 0 ? `
          <section class="inhabitants">
            <h2>Inhabitants & Residents</h2>
            <ul class="entity-list">
              ${place.inhabitants.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </section>
        ` : ''}

        <!-- NEW: Guardians -->
        ${place.guardians?.length > 0 ? `
          <section class="guardians">
            <h2>Divine Guardians</h2>
            <ul class="guardian-list">
              ${place.guardians.map(g => `<li>${g}</li>`).join('')}
            </ul>
          </section>
        ` : ''}

        <!-- NEW: Geography -->
        ${place.geography ? `
          <section class="geography">
            <h2>Geography & Location</h2>
            <p>${place.geography}</p>
            ${place.geographical?.primaryLocation ? `
              <div class="coordinates">
                <p>Coordinates: ${place.geographical.primaryLocation.coordinates.latitude.toFixed(4)},
                   ${place.geographical.primaryLocation.coordinates.longitude.toFixed(4)}</p>
              </div>
            ` : ''}
          </section>
        ` : ''}

        <!-- NEW: Related Events -->
        ${place.relatedEvents?.length > 0 ? `
          <section class="related-events">
            <h2>Related Events & History</h2>
            <ul class="events-timeline">
              ${place.relatedEvents.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </section>
        ` : ''}

        <!-- NEW: Accessibility -->
        ${place.accessibility ? `
          <section class="accessibility">
            <h2>How to Visit</h2>
            <div class="accessibility-info">
              <p>${place.accessibility}</p>
            </div>
          </section>
        ` : ''}
      </main>
    </div>
  `;
}
```

## CSS Styling

Add styles for new sections:

```css
/* Places Detail Enriched Metadata Styling */

.place-detail .significance {
  background: linear-gradient(135deg, var(--color-sacred-light) 0%, transparent 100%);
  border-left: 4px solid var(--color-sacred);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.place-detail .inhabitants,
.place-detail .guardians {
  background: var(--color-background-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.place-detail .entity-list,
.place-detail .guardian-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
}

.place-detail .entity-list li,
.place-detail .guardian-list li {
  background: var(--color-card-background);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  text-align: center;
}

.place-detail .geography {
  background: var(--color-background-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.place-detail .coordinates {
  background: var(--color-background-tertiary);
  padding: 0.75rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.place-detail .related-events {
  padding: 1.5rem;
  margin: 2rem 0;
}

.place-detail .events-timeline {
  list-style: none;
  padding: 0;
  border-left: 3px solid var(--color-primary);
  padding-left: 1.5rem;
}

.place-detail .events-timeline li {
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.place-detail .events-timeline li:before {
  content: '';
  position: absolute;
  left: -9px;
  top: 1rem;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  border: 2px solid var(--color-background);
}

.place-detail .accessibility {
  background: var(--color-info-light);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
  border-left: 4px solid var(--color-info);
}

.place-detail .accessibility-info {
  background: var(--color-background);
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}
```

## Firebase Schema Update

No schema changes required - new fields are additive. Example document:

```json
{
  "id": "mount-olympus",
  "name": "Mount Olympus",
  "type": "place",
  "placeType": "mountain",
  "primaryMythology": "greek",
  "mythologies": ["greek"],

  // Existing fields
  "longDescription": "...",
  "shortDescription": "...",
  "description": "...",
  "accessibility": "physical",
  "visibility": "public",
  "status": "published",

  // NEW ENRICHED FIELDS
  "inhabitants": ["Zeus", "Hera", "Poseidon", ...],
  "guardians": ["The Titans", "Nike (Victory)", ...],
  "significance": "Home of the twelve Olympian gods...",
  "geography": "Located in Thessaly & Macedonia, Greece...",
  "relatedEvents": ["Titanomachy - War between Titans...", ...],

  // Enrichment metadata
  "_metadata": {
    "enriched": true,
    "enrichedAt": "2026-01-01T00:00:00Z",
    "enrichmentSource": "knowledge-base"
  }
}
```

## Query Examples

### Firestore Queries

```javascript
// Get all places with full enrichment
db.collection('places')
  .where('_metadata.enriched', '==', true)
  .where('_metadata.enrichmentSource', '==', 'knowledge-base')
  .get();

// Get places by mythology with significance
db.collection('places')
  .where('primaryMythology', '==', 'greek')
  .where('significance', '!=', null)
  .get();

// Get all places with specific events
db.collection('places')
  .where('relatedEvents', 'array-contains', 'Pilgrimage')
  .get();

// Get accessible places
db.collection('places')
  .where('accessibility', '!=', null)
  .get();
```

### Frontend Data Loading

```javascript
// Load enriched place data
async function loadEnrichedPlace(placeId) {
  const doc = await db.collection('places').doc(placeId).get();

  if (!doc.exists) return null;

  const place = doc.data();

  // Ensure all enrichment fields exist
  return {
    ...place,
    inhabitants: place.inhabitants || [],
    guardians: place.guardians || [],
    significance: place.significance || '',
    geography: place.geography || '',
    relatedEvents: place.relatedEvents || [],
    accessibility: place.accessibility || ''
  };
}
```

## Performance Considerations

### Index Creation
Recommended Firestore indexes:
```
Collection: places
Fields:
  - primaryMythology (Ascending)
  - significance (Ascending)
  - _metadata.enriched (Ascending)
  - _metadata.enrichmentSource (Ascending)
```

### Caching Strategy
```javascript
// Cache enriched place data locally
const placeCache = new Map();

async function getCachedPlace(placeId) {
  if (placeCache.has(placeId)) {
    return placeCache.get(placeId);
  }

  const place = await loadEnrichedPlace(placeId);
  placeCache.set(placeId, place);
  return place;
}
```

## Testing

### Unit Tests

```javascript
// Test metadata presence
describe('Place Enrichment', () => {
  it('should have all required metadata fields', () => {
    const place = loadPlace('mount-olympus');
    expect(place.inhabitants).toBeDefined();
    expect(place.guardians).toBeDefined();
    expect(place.significance).toBeDefined();
    expect(place.geography).toBeDefined();
    expect(place.relatedEvents).toBeDefined();
    expect(place.accessibility).toBeDefined();
  });

  it('should have non-empty arrays for inhabitants and guardians', () => {
    const place = loadPlace('mount-olympus');
    expect(place.inhabitants.length).toBeGreaterThan(0);
    expect(place.guardians.length).toBeGreaterThan(0);
  });

  it('should have meaningful significance and geography text', () => {
    const place = loadPlace('mount-olympus');
    expect(place.significance.length).toBeGreaterThan(50);
    expect(place.geography.length).toBeGreaterThan(50);
  });
});
```

## Deployment Checklist

- [ ] Review and validate all enriched metadata
- [ ] Test renderer integration locally
- [ ] Verify Firestore schema compatibility
- [ ] Create Firestore indexes if needed
- [ ] Upload enriched documents to Firebase
- [ ] Test queries against live Firebase
- [ ] Deploy frontend changes
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Document any adjustments made

## Additional Resources

- Knowledge base: `/scripts/enrich-places-metadata.js`
- Documentation: `/PLACES_METADATA_ENRICHMENT.md`
- Quick reference: `/PLACES_ENRICHMENT_QUICK_REFERENCE.md`

---

**Version**: 1.0
**Last Updated**: 2026-01-01
**Total Places Enriched**: 61/61

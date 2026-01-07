# Historical Enrichment - Usage Examples

## Quick Reference Guide

This document shows how to access and use the historical enrichment data in applications.

---

## Data Access Patterns

### 1. Reading Historical Periods

**Use Case**: Display how deity worship changed over time

```javascript
const deity = await getDeity('greek_deity_zeus');

// Show evolution across time
console.log('WORSHIP EVOLUTION OF ZEUS');
console.log('='.repeat(50));

deity.historical.periods.forEach(period => {
  console.log(`\n${period.name} (${period.dates})`);
  console.log('-'.repeat(40));
  console.log(period.description);
  console.log('Sources:', period.sources.join(', '));
});
```

**Output Example**:
```
WORSHIP EVOLUTION OF ZEUS
==================================================

Bronze Age / Mycenaean Period (1600-1100 BCE)
----------------------------------------
Worship of sky god Dyeus (Proto-Indo-European), evidenced in Linear B
tablets mentioning "di-we" (Zeus). Early form associated with weather
phenomena and kingly authority in Mycenaean palaces.
Sources: Linear B tablets from Knossos and Pylos

Archaic Period (800-480 BCE)
----------------------------------------
Zeus cult crystallizes with Homeric epics. Becomes supreme deity of
Olympian pantheon. Establishment of major sanctuaries at Olympia
(Olympic Games) and Dodona.
Sources: Homer's Iliad and Odyssey, Hesiod's Theogony

[... continuing through Classical, Hellenistic, and Roman periods ...]
```

---

### 2. Building a Timeline View

**Use Case**: Create interactive timeline showing deity transformation

```javascript
function createTimeline(deity) {
  const timeline = {
    title: `${deity.name} Through History`,
    periods: deity.historical.periods.map(p => ({
      label: p.name,
      date: p.dates,
      description: p.description,
      evidence: p.sources
    }))
  };

  return timeline;
}

// Usage
const zeusTimeline = createTimeline(zeusEntity);
renderTimelineUI(zeusTimeline);
```

---

### 3. Accessing Primary Sources

**Use Case**: Show what ancient texts say about deity

```javascript
function getPrimarySources(deity) {
  return deity.historical.primarySources.map(source => ({
    citation: `${source.work} by ${source.author} (${source.period})`,
    significance: source.significance,
    link: `/library/${slugify(source.work)}` // Link to text
  }));
}

// Usage - Display sources for Apollo
const apolloSources = getPrimarySources(apolloEntity);

console.log('PRIMARY SOURCES MENTIONING APOLLO');
apolloSources.forEach(source => {
  console.log(`\n• ${source.citation}`);
  console.log(`  Why it matters: ${source.significance}`);
  console.log(`  Read: ${source.link}`);
});
```

**Output**:
```
PRIMARY SOURCES MENTIONING APOLLO

• Homeric Hymn to Apollo by Unknown (7th century BCE)
  Why it matters: Detailed narrative of Apollo's birth and founding of
  Delphi sanctuary; describes slaying of serpent Python
  Read: /library/homeric-hymn-to-apollo

• Iliad by Homer (8th century BCE)
  Why it matters: Apollo as archer god, plague bringer, and healer;
  his role in Trojan War from divine perspective
  Read: /library/homeric-iliad

• Pythian Odes by Pindar (5th century BCE)
  Why it matters: Praise of Apollo; celebration of Pythian Games
  dedicated to god; theological interpretations
  Read: /library/pythian-odes
```

---

### 4. Archaeological Sites

**Use Case**: Show physical evidence and suggest site visits

```javascript
function getArchaeologicalSites(deity) {
  return deity.historical.archaeologicalEvidence.map(site => ({
    name: site.site,
    location: site.location,
    findings: site.finds,
    culturalSignificance: site.significance,
    mapCoordinates: getCoordinates(site.location),
    visitInfo: `/archaeology/${slugify(site.site)}`
  }));
}

// Usage - Show where to see evidence of Poseidon worship
const poseidonSites = getArchaeologicalSites(poseidonEntity);

console.log('WHERE WAS POSEIDON WORSHIPPED?');
poseidonSites.forEach(site => {
  console.log(`\n📍 ${site.name}`);
  console.log(`   Location: ${site.location}`);
  console.log(`   Discoveries: ${site.findings}`);
  console.log(`   Why important: ${site.culturalSignificance}`);
  console.log(`   Learn more: ${site.visitInfo}`);
});
```

---

### 5. Historiographic Context

**Use Case**: Show how scholarly understanding has evolved

```javascript
function displayScholarshipEvolution(deity) {
  console.log(`EVOLVING UNDERSTANDING OF ${deity.name.toUpperCase()}`);
  console.log('='.repeat(60));

  deity.historical.historiographicNotes.forEach((note, index) => {
    const period = ['19th Century', 'Early 20th Century', 'Mid-20th Century',
                    'Late 20th Century', 'Contemporary'][index];

    console.log(`\n${period}:`);
    console.log(`  "${note}"`);
  });
}

// Usage
displayScholarshipEvolution(aphroditeEntity);
```

**Output**:
```
EVOLVING UNDERSTANDING OF APHRODITE
============================================================

19th Century:
  "Scholars viewed Aphrodite as 'primitive' fertility goddess,
  emphasizing sacred prostitution aspect"

Early 20th Century:
  "Discovery and excavation of temples began but Linear B still
  undeciphered; limited Bronze Age understanding"

Mid-20th Century:
  "Discovery of Cypriot sanctuary evidence suggested Near Eastern
  syncretism (Astarte/Inanna); feminist scholars began reexamining
  sexual aspects of worship"

Late 20th Century:
  "Archaeological evidence from Acropolis and temples revealed
  religious continuity from LBA through Classical period; emphasis
  on Athena's multiple, non-contradictory roles"

Contemporary:
  "Scholars emphasize syncretism of Mediterranean traditions; economic
  analysis of temple institutions; gender studies examining priestess
  roles and sacred sexuality"
```

---

### 6. Period-Specific Lookup

**Use Case**: What was the deity like in a specific historical period?

```javascript
function getDeityInPeriod(deity, periodName) {
  const period = deity.historical.periods.find(p =>
    p.name.toLowerCase().includes(periodName.toLowerCase())
  );

  if (!period) return null;

  return {
    period: period.name,
    dates: period.dates,
    description: period.description,
    sources: period.sources,
    historicalContext: getHistoricalContext(period.dates)
  };
}

// Usage
const hestiaClassical = getDeityInPeriod(hestiaEntity, 'classical');
console.log(`Hestia in the ${hestiaClassical.period}`);
console.log(`Time: ${hestiaClassical.dates}`);
console.log(`Description: ${hestiaClassical.description}`);
console.log(`Historical context: ${hestiaClassical.historicalContext}`);
```

---

### 7. Comparative Analysis

**Use Case**: Compare how different deities transformed across same period

```javascript
function compareDeities(deityList, period) {
  const comparison = deityList.map(deity => {
    const p = deity.historical.periods.find(p =>
      p.name.includes(period)
    );
    return {
      deity: deity.name,
      description: p.description,
      sources: p.sources
    };
  });

  return comparison;
}

// Usage - Compare Olympian gods during Classical Period
const comparison = compareDeities(
  [zeusEntity, aphroditeEntity, apolloEntity, athenaEntity],
  'Classical'
);

console.log('CLASSICAL PERIOD (480-323 BCE) - OLYMPIAN TRANSFORMATION');
comparison.forEach(item => {
  console.log(`\n${item.deity.toUpperCase()}`);
  console.log(`${item.description}`);
});
```

---

### 8. Source-Based Learning

**Use Case**: Create reading lists from primary sources

```javascript
function createReadingList(deities, period) {
  const sources = new Set();

  deities.forEach(deity => {
    deity.historical.primarySources
      .filter(s => s.period.includes(period.slice(0, 4)))
      .forEach(s => {
        sources.add({
          work: s.work,
          author: s.author,
          period: s.period,
          relevance: [
            ...deities.filter(d =>
              d.historical.primarySources.find(p => p.work === s.work)
            ).map(d => d.name)
          ]
        });
      });
  });

  return Array.from(sources);
}

// Usage - Reading list for understanding Classical Greek religion
const classicalReadingList = createReadingList(
  greekDeities,
  '5th-4th century BCE'
);

console.log('CLASSICAL GREEK RELIGION READING LIST');
classicalReadingList
  .sort((a, b) => new Date(a.period) - new Date(b.period))
  .forEach(source => {
    console.log(`\n📚 ${source.work}`);
    console.log(`   Author: ${source.author}`);
    console.log(`   Period: ${source.period}`);
    console.log(`   Mentioned in context of: ${source.relevance.join(', ')}`);
  });
```

---

### 9. Syncretism Tracking

**Use Case**: Understand how deities merged with foreign traditions

```javascript
function trackSyncretism(deity) {
  const syncretic = deity.historical.periods
    .filter(p => p.description.toLowerCase().includes('syncret'))
    .map(p => ({
      period: p.name,
      dates: p.dates,
      description: p.description,
      sources: p.sources
    }));

  return syncretic;
}

// Usage - See how Zeus merged with other gods
const zeusSyncretism = trackSyncretism(zeusEntity);
console.log('ZEUS SYNCRETISM HISTORY');
zeusSyncretism.forEach(sync => {
  console.log(`\n${sync.period} (${sync.dates})`);
  console.log(`${sync.description}`);
});

// Output:
// Hellenistic Period (323-31 BCE)
// Syncretism with Near Eastern deities. Zeus Ammon fusion in Egypt.
// Continued philosophical discourse on Zeus as cosmic principle. Decline
// in traditional sacrificial practices.
```

---

### 10. Archaeological Tourism

**Use Case**: Plan visits to important mythological sites

```javascript
function generateTourGuide(deity) {
  const sites = deity.historical.archaeologicalEvidence;

  return {
    deityName: deity.name,
    title: `Following ${deity.name}'s Trail Through Greece`,
    sites: sites.map(s => ({
      name: s.site,
      location: s.location,
      description: s.finds,
      historicalSignificance: s.significance,
      accessInfo: getAccessInfo(s.site),
      hours: getHours(s.site),
      admission: getAdmission(s.site),
      bestTimeToVisit: getBestSeason(s.site),
      nearbyHotels: findNearby(s.location, 'hotel'),
      relatedArtifacts: getMuseumExhibits(s.site)
    }))
  };
}

// Usage
const apolloTour = generateTourGuide(apolloEntity);
console.log(`${apolloTour.title}`);
apolloTour.sites.forEach(site => {
  console.log(`\n📍 ${site.name} (${site.location})`);
  console.log(`   What to see: ${site.description}`);
  console.log(`   Why important: ${site.historicalSignificance}`);
  console.log(`   Hours: ${site.hours}`);
  console.log(`   Admission: ${site.admission}`);
});
```

---

## Advanced Queries

### Query 1: Which deities appear in most ancient texts?

```javascript
function getMostDocumented(deities) {
  return deities
    .map(deity => ({
      name: deity.name,
      sourceCount: deity.historical.primarySources.length,
      sources: deity.historical.primarySources.map(s => s.work)
    }))
    .sort((a, b) => b.sourceCount - a.sourceCount);
}

// Output might show Zeus with 5 sources, Apollo with 5, Hermes with 4, etc.
```

### Query 2: Which periods have most archaeological evidence?

```javascript
function getArchiologicallyRichPeriods(deities) {
  const periodCounts = {};

  deities.forEach(deity => {
    deity.historical.archaeologicalEvidence.forEach(site => {
      // Extract period from site description
      const periods = ['Bronze Age', 'Archaic', 'Classical', 'Hellenistic', 'Roman'];
      periods.forEach(period => {
        if (site.finds.includes(period) || site.significance.includes(period)) {
          periodCounts[period] = (periodCounts[period] || 0) + 1;
        }
      });
    });
  });

  return Object.entries(periodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([period, count]) => ({ period, count }));
}

// Result: Classical and Hellenistic periods likely have most sites
```

### Query 3: Track scholarly opinion shifts

```javascript
function trackOpinionShift(deity) {
  const shifts = [];
  const notes = deity.historical.historiographicNotes;

  for (let i = 0; i < notes.length - 1; i++) {
    shifts.push({
      from: notes[i],
      to: notes[i + 1],
      change: analyzeChange(notes[i], notes[i + 1])
    });
  }

  return shifts;
}

// Result: Shows how understanding of each deity changed generation to generation
```

---

## UI Component Examples

### Timeline Component

```jsx
function DeityTimeline({ deity }) {
  return (
    <div className="timeline">
      <h2>{deity.name} Through History</h2>

      {deity.historical.periods.map((period, idx) => (
        <div key={idx} className="timeline-item">
          <div className="timeline-date">{period.dates}</div>
          <div className="timeline-period">{period.name}</div>
          <p className="timeline-description">{period.description}</p>
          <div className="timeline-sources">
            Sources: {period.sources.join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Source Citation Component

```jsx
function SourceCitation({ source }) {
  return (
    <div className="source-citation">
      <h4>{source.work}</h4>
      <p className="source-author">by {source.author}</p>
      <p className="source-period">{source.period}</p>
      <p className="source-significance">
        <strong>Significance:</strong> {source.significance}
      </p>
    </div>
  );
}
```

### Archaeological Site Card

```jsx
function ArchaeologicalSiteCard({ site, deity }) {
  return (
    <div className="site-card">
      <h3>{site.site}</h3>
      <p className="location">📍 {site.location}</p>
      <div className="findings">
        <h4>Discoveries:</h4>
        <p>{site.finds}</p>
      </div>
      <div className="significance">
        <h4>Why Important:</h4>
        <p>{site.significance}</p>
      </div>
      <button onClick={() => openMap(site.location)}>
        View on Map
      </button>
      <button onClick={() => visitMuseum(site.site)}>
        See Artifacts
      </button>
    </div>
  );
}
```

---

## Database Query Examples

### SQL Query Example

```sql
-- Find all deities with Bronze Age evidence
SELECT
  d.name,
  COUNT(h.archaeologicalEvidence) as sites
FROM deities d
JOIN historical h ON d.id = h.deity_id
WHERE h.periods LIKE '%Bronze Age%'
GROUP BY d.name
ORDER BY sites DESC;

-- Find primary sources by period
SELECT
  p.work,
  p.author,
  p.period,
  COUNT(DISTINCT d.name) as deities_mentioned
FROM primary_sources p
JOIN deities d ON p.deity_id = d.id
WHERE p.period LIKE '%8th%'
GROUP BY p.work
ORDER BY deities_mentioned DESC;
```

### Elasticsearch Example

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "mythology": "greek" } },
        { "nested": {
          "path": "historical.periods",
          "query": {
            "match": { "historical.periods.name": "Classical" }
          }
        }}
      ]
    }
  }
}
```

---

## Integration Examples

### With Entity Display View

```javascript
// In entity detail view, add historical section
function renderEntityDetail(entity) {
  return (
    <EntityDetail>
      <EntityBasicInfo entity={entity} />
      <EntityDomains entity={entity} />
      <EntitySymbols entity={entity} />

      {/* NEW: Historical section */}
      <HistoricalContext deity={entity} />

      <EntityRelationships entity={entity} />
    </EntityDetail>
  );
}
```

### With Search Results

```javascript
// Enhance search results with historical context
function enhanceSearchResult(entity) {
  return {
    ...entity,
    searchContext: {
      firstMentioned: entity.historical.primarySources[0],
      earliestWorship: entity.historical.periods[0],
      majorSanctuary: entity.historical.archaeologicalEvidence[0]
    }
  };
}
```

### With Browse Views

```javascript
// Add timeline filter to deity browse
function getDeitiesByPeriod(period) {
  return allDeities.filter(deity =>
    deity.historical.periods.some(p => p.name.includes(period))
  );
}

// Add source filter to browse
function getDeitiesInWork(workTitle) {
  return allDeities.filter(deity =>
    deity.historical.primarySources.some(s => s.work === workTitle)
  );
}
```

---

## Performance Considerations

### Lazy Loading

```javascript
// Load historical data on demand
async function getDeityHistory(deityId) {
  const basic = await getDeity(deityId); // Basic data cached
  const historical = await fetchHistoricalData(deityId); // On demand
  return { ...basic, historical };
}
```

### Caching Strategy

```javascript
// Cache historical queries
const historicalCache = new Map();

function getCachedHistory(deityId) {
  if (!historicalCache.has(deityId)) {
    historicalCache.set(deityId, fetchHistory(deityId));
  }
  return historicalCache.get(deityId);
}
```

---

## Conclusion

The historical enrichment data enables rich, multi-layered exploration of Greek mythology. These examples show how to:

1. Display deity evolution over time
2. Connect myths to primary sources
3. Show archaeological evidence
4. Track scholarly interpretation changes
5. Create comparative analyses
6. Build educational interfaces
7. Understand cultural syncretism

For complete details, see `GREEK_MYTHOLOGY_HISTORICAL_ANALYSIS.md`.

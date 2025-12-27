# Shader & Search System Validation Guide

**Date:** December 25, 2025
**Status:** Ready for Testing
**Firebase Server:** http://localhost:5003

---

## Quick Test URLs

- **Shader Demo:** http://localhost:5003/shader-demo.html
- **Search Test:** http://localhost:5003/search-test.html
- **Main Site:** http://localhost:5003/index.html

---

## ✅ Shader System Validation

### All 6 Shaders Enhanced (Production Quality)

#### 1. Water Shader (6.4KB)
**Features:**
- Voronoi-based caustics (3-layer)
- Domain-warped realistic waves at top edge
- 8 rising bubbles with refraction effects
- Underwater god rays (subtle)
- Rich depth gradient (#001428 → #1e3a5f)

**Test:** http://localhost:5003/shader-demo.html → Select "Water"
- ✓ Check waves appear only at top 12% of screen
- ✓ Verify bubbles rise smoothly with lateral drift
- ✓ Confirm caustic patterns are visible and flowing
- ✓ Ensure god rays visible near top
- ✓ Performance: Should maintain 60 FPS

#### 2. Fire Shader (5.6KB)
**Features:**
- Multi-layer domain warping for flames
- Edge-only flames (5-10% from borders)
- 12 rising embers with natural drift
- Heat shimmer distortion effect
- Temperature gradient (#0a0500 → #ff6b1a)

**Test:** http://localhost:5003/shader-demo.html → Select "Fire"
- ✓ Flames visible only at edges
- ✓ Embers rise and fade naturally
- ✓ Flickering effect active
- ✓ Heat distortion subtle but present
- ✓ Performance: Should maintain 60 FPS

#### 3. Night Shader (7.4KB)
**Features:**
- 100+ stars in 4 parallax layers
- Twinkling stars with diffraction spikes
- Flowing aurora borealis (green/purple/blue)
- Subtle nebula clouds
- Shooting stars every ~13 seconds

**Test:** http://localhost:5003/shader-demo.html → Select "Night"
- ✓ Multiple star layers visible
- ✓ Stars twinkling at varied speeds
- ✓ Aurora visible in upper 45% of screen
- ✓ Nebula provides subtle color variation
- ✓ Wait 15 seconds to see shooting star
- ✓ Performance: Should maintain 60 FPS

#### 4. Earth Shader (6.0KB)
**Features:**
- Animated Voronoi cells
- Plant-like growth patterns
- 18 particles following natural paths
- Multi-octave noise texture
- Earthy palette (#0f0a05 → #3a5f35)

**Test:** http://localhost:5003/shader-demo.html → Select "Earth"
- ✓ Organic cell patterns visible
- ✓ Particles move smoothly
- ✓ Growth animation flows naturally
- ✓ Earthy green-brown colors present
- ✓ Performance: Should maintain 60 FPS

#### 5. Light Shader (6.0KB)
**Features:**
- 25 bokeh particles with hexagonal shape
- Rotating light rays from center
- Lens flare with ghost reflections
- Atmospheric warm glow
- Golden palette (#f5f3f0 → #ffda80)

**Test:** http://localhost:5003/shader-demo.html → Select "Light"
- ✓ Bokeh particles floating gently
- ✓ Light rays rotating slowly
- ✓ Lens flare visible at center
- ✓ Warm golden atmosphere
- ✓ Performance: Should maintain 60 FPS

#### 6. Dark Shader (6.3KB)
**Features:**
- Domain-warped flowing shadows
- 15 wispy particles with tails
- 3 parallax shadow layers
- Sparse dimmed stars
- Dark purple void (#05050a → #1f1426)

**Test:** http://localhost:5003/shader-demo.html → Select "Dark"
- ✓ Shadow patterns flowing smoothly
- ✓ Wispy particles visible with elongated tails
- ✓ Depth perception from parallax
- ✓ Very sparse background stars
- ✓ Performance: Should maintain 60 FPS

### Shader System Features

**Controls to Test:**
- Intensity slider (0-100%)
- Speed control (0.5x - 2.0x)
- Pause/Resume button
- Quality selector (Low/Medium/High)
- FPS counter
- Theme switcher

**Expected Behavior:**
- Shaders should be SUBTLE but visually pleasing
- All animations smooth with no jarring movements
- Performance metrics updating in real-time
- Mobile devices auto-reduce quality
- Respects `prefers-reduced-motion` setting

---

## ✅ Search System Validation

### Core Features to Test

#### 1. Generic Search
http://localhost:5003/search-test.html

**Test Queries:**
```javascript
// In browser console:
await testSearch.generic("zeus")
await testSearch.generic("thunder")
await testSearch.generic("creation")
```

**Expected Results:**
- Relevance-sorted results
- Name matches score highest (50 points)
- Description matches included (30 points)
- Search terms array utilized (40 points)
- Results displayed in grid format

#### 2. Language Search
**Test Queries:**
```javascript
await testSearch.language("Ζεύς")  // Greek script
await testSearch.language("zeus")
```

**Expected Results:**
- Original name matches prioritized (100 points)
- Transliteration matches (80 points)
- Alternate names found
- Language-specific highlighting

#### 3. Source Search
**Test Queries:**
```javascript
await testSearch.source("homer")
await testSearch.source("iliad")
```

**Expected Results:**
- Primary texts matched
- Citations included
- Archaeological evidence listed
- Source metadata displayed

#### 4. Corpus Term Search
**Test Queries:**
```javascript
await testSearch.term("thunder")
await testSearch.term("sky god")
```

**Expected Results:**
- Epithets matched
- Domains found
- Symbols identified
- Related concepts listed

#### 5. Display Modes
**Test All Modes:**
```javascript
// Get some results first
const results = await testSearch.generic("apollo");

// Test each display mode
testSearch.renderGrid(results.items);
testSearch.renderTable(results.items);
testSearch.renderList(results.items);
testSearch.renderPanel(results.items);
```

**Expected Results:**
- Grid: 2-wide mobile, 4-wide desktop responsive cards
- Table: Sortable columns, clean layout
- List: Expandable items with metadata
- Panel: Detailed multi-section cards

#### 6. Search Suggestions
**Test:**
- Type "ze" in search box
- Type "th" in search box
- Use arrow keys to navigate suggestions
- Press Enter to select

**Expected Results:**
- Autocomplete appears after 300ms
- Suggestions highlighted on hover
- Arrow keys navigate list
- Enter selects highlighted item
- Escape closes suggestions

#### 7. Filters
**Test:**
- Select "Greek" mythology
- Choose "Deities" entity type
- Set importance range 80-100
- Check "Has Image"
- Apply filters

**Expected Results:**
- Results filtered correctly
- Filter count badge updates
- Clear filters resets all
- Filtered results maintain sort order

#### 8. Export Functionality
**Test:**
```javascript
// Perform a search first
searchUI.exportResults('json');
searchUI.exportResults('csv');
```

**Expected Results:**
- JSON file downloads with complete data
- CSV file downloads with formatted columns
- Filenames include timestamp

### Performance Validation

**Test Metrics:**
```javascript
// In console
corpusSearch.getMetrics()
```

**Expected Output:**
```javascript
{
  searches: 15,
  cacheHits: 6,
  cacheHitRate: "40.00%",
  averageTime: "85.32ms"
}
```

**Performance Targets:**
- Search time: < 100ms for typical queries
- Cache hit rate: 30-60% with normal usage
- Memory usage: < 20 MB with full cache
- No memory leaks after 100+ searches

---

## 🔧 Integration Testing

### Test Shader + Search Together

**Scenario 1:** Search with Water Theme
```javascript
// Activate water shader
shaderManager.activate('water');

// Perform search
await corpusSearch.search('poseidon', { mode: 'generic' });
```

**Expected:** Water shader runs in background, search results display correctly on top.

**Scenario 2:** Display Mode Switching with Night Theme
```javascript
// Activate night shader
shaderManager.activate('night');

// Search and switch display modes
const results = await corpusSearch.search('stars');
renderer.render(results.items, 'grid');
renderer.render(results.items, 'list');
renderer.render(results.items, 'panel');
```

**Expected:** Night shader continues running smoothly, display modes switch without shader interference.

**Scenario 3:** Heavy Load Test
```javascript
// Max intensity shader
shaderManager.setIntensity(1.0);

// Rapid searches
for(let i = 0; i < 10; i++) {
  await corpusSearch.search(`test${i}`);
}
```

**Expected:** System remains responsive, FPS stays above 30, searches complete quickly.

---

## 📱 Mobile Testing

### Responsive Design
- Open http://localhost:5003/shader-demo.html on mobile
- Open http://localhost:5003/search-test.html on mobile

**Expected:**
- Shaders auto-reduce quality on mobile
- Grid switches to 2-column layout
- Search UI remains fully functional
- Touch controls work properly
- Performance acceptable (30+ FPS)

### Accessibility
**Test prefers-reduced-motion:**
```css
/* Simulate in DevTools */
@media (prefers-reduced-motion: reduce) {
  /* Shaders should pause */
}
```

**Expected:**
- Shaders pause automatically
- Fallback gradient backgrounds shown
- Search system fully functional
- No accessibility warnings

---

## 🐛 Known Limitations

### Shaders
1. **WebGL Required:** Falls back to CSS gradients if WebGL unavailable
2. **Mobile Performance:** Auto-reduces quality, may not achieve 60 FPS on low-end devices
3. **Browser Support:** Chrome 56+, Firefox 51+, Safari 11+, Edge 79+

### Search System
4. **Firestore Queries:** Limited to 500 documents per batch
5. **Cache Duration:** 5 minutes for memory cache, persistent for IndexedDB
6. **Suggestions:** Debounced 300ms, may feel slightly delayed

---

## ✅ Validation Checklist

### Shaders
- [ ] All 6 shaders render correctly
- [ ] Animations smooth at 60 FPS (desktop)
- [ ] Effects subtle and not distracting
- [ ] Controls functional (intensity, speed, quality)
- [ ] Performance metrics accurate
- [ ] Mobile auto-quality works
- [ ] Fallback to CSS gradients functional
- [ ] Respects prefers-reduced-motion

### Search System
- [ ] All 5 search modes functional
- [ ] Suggestions appear and navigate correctly
- [ ] All 4 display modes render properly
- [ ] Filters apply correctly
- [ ] Export to JSON/CSV works
- [ ] Performance within targets
- [ ] Cache system functional
- [ ] Search history tracked
- [ ] Mobile responsive
- [ ] Keyboard shortcuts work

### Integration
- [ ] Shaders + search work together
- [ ] No performance degradation
- [ ] UI remains responsive
- [ ] No visual conflicts
- [ ] Memory usage stable

---

## 📊 Success Criteria

### Shader System
✅ **Visual Quality:** Effects visible but subtle, professional appearance
✅ **Performance:** 60 FPS on desktop, 30+ FPS on mobile
✅ **Accessibility:** Fully accessible, respects user preferences
✅ **Browser Support:** Works on all modern browsers

### Search System
✅ **Functionality:** All search modes produce accurate results
✅ **Performance:** < 100ms average search time
✅ **UX:** Intuitive interface, smooth interactions
✅ **Data Quality:** 776 entities with complete v2.0 metadata

### Combined System
✅ **Integration:** Both systems work seamlessly together
✅ **Stability:** No crashes, leaks, or errors
✅ **Responsiveness:** UI remains responsive under load
✅ **Polish:** Production-ready quality throughout

---

## 🚀 Next Steps After Validation

1. **Fix any issues found during testing**
2. **Optimize performance bottlenecks**
3. **Integrate into main site (index.html)**
4. **Deploy to Firebase Hosting**
5. **Monitor production metrics**
6. **Gather user feedback**
7. **Iterate based on usage data**

---

## 📝 Test Results Template

```markdown
## Test Session: [Date/Time]
**Tester:** [Name]
**Browser:** [Browser + Version]
**Device:** [Desktop/Mobile]

### Shaders
- Water: ✓/✗ [Notes]
- Fire: ✓/✗ [Notes]
- Night: ✓/✗ [Notes]
- Earth: ✓/✗ [Notes]
- Light: ✓/✗ [Notes]
- Dark: ✓/✗ [Notes]

### Search
- Generic: ✓/✗ [Notes]
- Language: ✓/✗ [Notes]
- Source: ✓/✗ [Notes]
- Term: ✓/✗ [Notes]
- Display: ✓/✗ [Notes]

### Performance
- Shader FPS: [number]
- Search Time: [ms]
- Cache Hit Rate: [%]

### Issues Found
1. [Description]
2. [Description]

### Overall Status: ✓ PASS / ✗ FAIL
```

---

**Ready to begin validation testing at http://localhost:5003**

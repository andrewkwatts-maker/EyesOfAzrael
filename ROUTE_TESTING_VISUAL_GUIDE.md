# Visual Route Testing Guide

## Quick Visual Reference

This guide provides screenshots and examples of what each route should look like when working correctly.

---

## 🏠 Home Route (`#/`)

### Expected View
```
┌─────────────────────────────────────────┐
│             👁️                         │
│        Eyes of Azrael                   │
│   Explore World Mythologies             │
│                                         │
│  Journey through 6000+ years...         │
│                                         │
│  [🏛️ Explore] [🔍 Search]             │
└─────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│ 🏛️     │ ⚡     │ 🗡️    │ 🐉     │
│ World  │ Deities│ Heroes │Creature│
│Mytholog│ & Gods │&Legends│   s    │
└────────┴────────┴────────┴────────┘
│ 💎     │ 🏔️    │ 🎭     │ ✨     │
│ Sacred │ Sacred │Archety-│ Magic  │
│ Items  │ Places │  pes   │Systems │
└────────┴────────┴────────┴────────┘
│ 🌿     │ 🕯️    │ 📜     │ ☯️     │
│ Sacred │Rituals │ Sacred │ Sacred │
│Herbalis│&Practic│ Texts  │Symbols │
└────────┴────────┴────────┴────────┘
```

### Key Elements
- ✅ Hero section with eye icon
- ✅ "Eyes of Azrael" title
- ✅ 12 asset type cards in grid
- ✅ Responsive layout
- ✅ Hover effects working

### What Success Looks Like
- Page loads in < 200ms
- All 12 cards visible
- Icons display correctly
- Links are clickable
- No console errors

---

## 🏛️ Mythologies Grid (`#/mythologies`)

### Expected View
```
┌─────────────────────────────────────────┐
│        World Mythologies                │
│  Explore traditions from around         │
│         the globe                       │
└─────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│ 🏛️     │ ⚔️     │ 🔺     │ 🕉️     │
│ Greek  │ Norse  │Egyptian│ Hindu  │
│40 enti-│25 enti-│30 enti-│35 enti-│
│  ties  │  ties  │  ties  │  ties  │
└────────┴────────┴────────┴────────┘
```

### Key Elements
- ✅ Grid of mythology cards
- ✅ Entity counts per mythology
- ✅ Icons and colors
- ✅ Clickable cards

---

## 📚 Browse Deities (`#/browse/deities`)

### Expected View
```
┌─────────────────────────────────────────┐
│           ⚡                            │
│      Deities & Gods                     │
│  Divine beings and pantheons            │
│                                         │
│  📊 40 deities  🌍 12 mythologies      │
└─────────────────────────────────────────┘

┌───────────────────────────────────────┐
│ 🌍 Mythology: [All ▼]  ⚡ Sort: [A-Z ▼]│
│ 🔍 Search: [____________]              │
│                                        │
│ View: [⊞ Grid] [☰ List]               │
└───────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│   ⚡   │   🌊   │   🏛️   │   ☀️   │
│  Zeus  │Poseidon│ Athena │   Ra   │
│ Greek  │ Greek  │ Greek  │Egyptian│
│                                    │
│ King...│ God of │Goddess │ Sun god│
└────────┴────────┴────────┴────────┘
```

### Key Elements
- ✅ Category header with icon
- ✅ Statistics (count, mythologies)
- ✅ Filters (mythology, sort, search)
- ✅ View toggle (grid/list)
- ✅ Entity cards with:
  - Icon
  - Name
  - Mythology badge
  - Description (3 lines max)
  - Domain/attribute tags

### Interaction Tests
- [ ] Mythology filter works
- [ ] Search filters results
- [ ] Sort order changes
- [ ] Grid/List toggle works
- [ ] Cards are clickable

---

## 👤 Entity Page - Zeus (`#/entity/deities/greek/zeus`)

### Expected View
```
┌─────────────────────────────────────────┐
│                                         │
│              ⚡⚡⚡                      │
│              Zeus                       │
│      King of the Gods                   │
│                                         │
│  King of the Olympian gods, god of     │
│  the sky, thunder, and justice...       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Attributes & Domains                   │
│                                         │
│  Titles        Domains        Symbols   │
│  • King of Gods• Sky         • Thunder  │
│  • Cloud-Gather• Thunder     • Eagle    │
│  • Father      • Justice     • Oak      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Mythology & Stories                    │
│                                         │
│  Key Myths:                             │
│  • Titanomachy - Zeus leads...          │
│  • Birth of Athena - Zeus swallows...   │
│  • Europa and the Bull - Zeus...        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Family                                 │
│  • Parents: Cronus, Rhea                │
│  • Consort: Hera                        │
│  • Children: Athena, Apollo, Artemis... │
└─────────────────────────────────────────┘
```

### Key Elements
- ✅ Hero section with large icon
- ✅ Name and subtitle
- ✅ Description paragraph
- ✅ Attributes grid
- ✅ Mythology section
- ✅ Family relationships
- ✅ Related entities
- ✅ Sacred texts (collapsible)

### What Should Work
- [ ] Icon displays (large, centered)
- [ ] All sections render
- [ ] Related entities clickable
- [ ] Sacred texts expand/collapse
- [ ] Edit icon (if user created)
- [ ] No "Coming soon" message

---

## 🏺 Mythology Page - Greek (`#/mythology/greek`)

### Expected View
```
┌─────────────────────────────────────────┐
│                                         │
│              🏛️                        │
│         Greek Mythology                 │
│                                         │
│  Explore 40 entities from the Greek    │
│         tradition                       │
└─────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│ Deities│ Heroes │Creature│ Texts  │
│ 15     │ 8      │ 6      │ 4      │
└────────┴────────┴────────┴────────┘
│Cosmolog│ Rituals│ Herbs  │ Magic  │
│ 3      │ 2      │ 1      │ 1      │
└────────┴────────┴────────┴────────┘
```

### Key Elements
- ✅ Mythology icon (large)
- ✅ Mythology name
- ✅ Total entity count
- ✅ Category cards with counts
- ✅ Links to browse each category

### Should Show
- [ ] Correct icon for mythology
- [ ] Accurate entity counts
- [ ] Only categories with data
- [ ] Empty state if no data
- [ ] Clean, organized layout

---

## 🔍 Search Page (`#/search`)

### Expected View
```
┌─────────────────────────────────────────┐
│         Search Mythology Database       │
└─────────────────────────────────────────┘

┌───────────────────────────────────────┐
│ [________________] [🔍 Search]         │
│                                        │
│ Type: [All ▼] Mythology: [All ▼]      │
│ Tags: [____________________]           │
│                                        │
│ Advanced Options ▼                     │
└───────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Results (15)                           │
│                                         │
│  ⚡ Zeus - Greek deity                 │
│  King of the gods, ruler of Olympus...  │
│                                         │
│  🌊 Poseidon - Greek deity             │
│  God of the sea, earthquakes...         │
└─────────────────────────────────────────┘
```

### Key Elements
- ✅ Search input (prominent)
- ✅ Filters (type, mythology, tags)
- ✅ Advanced options (collapsible)
- ✅ Results list
- ✅ Result cards with:
  - Icon
  - Name
  - Type/mythology
  - Description snippet
  - Click to view

### Functionality
- [ ] Search as you type
- [ ] Filters apply immediately
- [ ] Results clickable
- [ ] Pagination (if many results)
- [ ] Empty state for no results

---

## ⚖️ Compare Page (`#/compare`)

### Expected View
```
┌─────────────────────────────────────────┐
│      Compare Mythological Entities      │
└─────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────┐
│ Select Entity│ Select Entity│  Select  │
│      1       │      2       │Entity 3  │
│              │              │          │
│ [Search...]  │ [Search...]  │[Search..]│
└──────────────┴──────────────┴──────────┘

After selection:

┌──────────────┬──────────────┬──────────┐
│     ⚡      │      🌊      │    🔺   │
│    Zeus      │   Poseidon   │    Ra    │
│    Greek     │    Greek     │ Egyptian │
│              │              │          │
│ Domain: Sky  │ Domain: Sea  │Domain:Sun│
│ Role: King   │ Role: Brother│Role: King│
│ Weapon: Bolt │ Weapon:Tride.│Weapon:..│
└──────────────┴──────────────┴──────────┘

Similarities: Sky gods, kings...
Differences: Greek vs Egyptian...
```

### Key Elements
- ✅ 2-3 entity selection boxes
- ✅ Search/autocomplete
- ✅ Side-by-side comparison
- ✅ Attribute comparison
- ✅ Similarities/differences

---

## 🎨 Dashboard (`#/dashboard`)

### Expected View
```
┌─────────────────────────────────────────┐
│  Welcome back, [Username]!              │
│  📊 Your Statistics                     │
└─────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│   5    │   12   │   3    │   2    │
│Entities│ Edits  │ Saved  │Pending │
└────────┴────────┴────────┴────────┘

┌─────────────────────────────────────────┐
│  Your Contributions                     │
│                                         │
│  ⚡ Zeus (deity) - Approved             │
│     [Edit] [Delete]                     │
│                                         │
│  🐉 Dragon (creature) - Pending         │
│     [Edit] [Delete]                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  [+ Submit New Entity]                  │
└─────────────────────────────────────────┘
```

### Key Elements
- ✅ User greeting
- ✅ Statistics cards
- ✅ Contribution list
- ✅ Edit/delete buttons
- ✅ Submit button
- ✅ Status indicators

---

## 404 Page (`#/any-invalid-route`)

### Expected View
```
┌─────────────────────────────────────────┐
│                                         │
│              404                        │
│                                         │
│         Page not found                  │
│                                         │
│  The page you're looking for doesn't   │
│         exist or has moved.             │
│                                         │
│        [← Return Home]                  │
└─────────────────────────────────────────┘
```

### Key Elements
- ✅ Large 404 text
- ✅ "Page not found" message
- ✅ Helpful description
- ✅ Return home button
- ✅ Clean, minimal design

---

## Common Visual Issues & Fixes

### Issue: Blank Page
**Looks Like:**
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│          (nothing here)                 │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Fix:**
1. Check browser console (F12)
2. Look for JavaScript errors
3. Verify all scripts loaded
4. Clear cache and reload

---

### Issue: "Coming Soon" Message
**Looks Like:**
```
┌─────────────────────────────────────────┐
│                                         │
│           Coming soon...                │
│                                         │
└─────────────────────────────────────────┘
```

**Fix:**
- Route handler not fully implemented
- Check `spa-navigation.js` for placeholder code
- Should now be fixed in latest version

---

### Issue: Error Page
**Looks Like:**
```
┌─────────────────────────────────────────┐
│             ⚠️                         │
│                                         │
│     Failed to Load Content              │
│                                         │
│  Component not loaded. Please refresh.  │
│                                         │
│        [Retry] [Go Back]                │
└─────────────────────────────────────────┘
```

**Common Causes:**
- View component not loaded
- Firebase connection failed
- User not authenticated

**Fix:**
- Check that component script is loaded
- Verify Firebase config
- Ensure user is logged in

---

## Mobile View Expectations

### Home Page (Mobile)
```
┌───────────────┐
│      👁️      │
│ Eyes of Azrael│
│   Explore...  │
│               │
│  [Explore]    │
│  [Search]     │
└───────────────┘
┌───────────────┐
│  🏛️          │
│  World        │
│  Mythologies  │
└───────────────┘
┌───────────────┐
│  ⚡           │
│  Deities      │
│  & Gods       │
└───────────────┘
```

### Key Mobile Features
- ✅ Single column layout
- ✅ Full-width buttons
- ✅ Larger touch targets
- ✅ Responsive typography
- ✅ Collapsible sections

---

## Color & Theme Expectations

### Light Mode (if implemented)
- Background: Light gray/white
- Text: Dark gray/black
- Primary: Blue/purple
- Cards: White with subtle shadows

### Dark Mode (default)
- Background: Dark navy/black (#0f1419)
- Text: Light gray (#e5e7eb)
- Primary: Purple (#8b7fff)
- Secondary: Gold (#fbbf24)
- Cards: Semi-transparent white (rgba)

---

## Animation & Transitions

### What Should Animate
- ✅ Card hover (lift + shadow)
- ✅ Button hover (color change)
- ✅ Page transitions (fade in)
- ✅ Loading spinners (rotate)
- ✅ Skeleton screens (pulse)

### What Should NOT Animate (if user prefers reduced motion)
- All animations disabled
- Instant state changes
- Respects `prefers-reduced-motion: reduce`

---

## Accessibility Checks

### Visual Indicators
- ✅ Focus outlines visible
- ✅ Color contrast 4.5:1 minimum
- ✅ Icons have text labels
- ✅ Links clearly distinguished
- ✅ Buttons look clickable

### Screen Reader Support
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Alt text on images
- ✅ Proper heading hierarchy
- ✅ Skip links (if implemented)

---

## Performance Indicators

### Good Performance
- ✅ Initial load < 1 second
- ✅ Route change < 500ms
- ✅ Smooth scrolling
- ✅ No layout shift
- ✅ Images load progressively

### Warning Signs
- ⚠️ Blank screen > 2 seconds
- ⚠️ Janky scrolling
- ⚠️ Layout jumping
- ⚠️ Delayed interactions

---

## Testing Checklist (Visual)

### Desktop (1920x1080)
- [ ] Home page looks correct
- [ ] All 12 asset cards visible
- [ ] Browse pages show grid properly
- [ ] Entity pages formatted well
- [ ] No horizontal scrolling
- [ ] Images load correctly

### Tablet (768x1024)
- [ ] 2-column grid
- [ ] Touch targets adequate
- [ ] Navigation accessible
- [ ] Content readable

### Mobile (375x667)
- [ ] Single column layout
- [ ] Full-width cards
- [ ] Buttons large enough
- [ ] Text readable
- [ ] No pinch-zoom needed

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Screenshot Comparison

### Before Fix (Entity Page)
```
┌─────────────────────────────────────────┐
│                                         │
│              zeus                       │
│                                         │
│          Coming soon...                 │
│                                         │
└─────────────────────────────────────────┘
```

### After Fix (Entity Page)
```
┌─────────────────────────────────────────┐
│              ⚡⚡⚡                      │
│              Zeus                       │
│      King of the Gods                   │
│                                         │
│  Full entity content with attributes,   │
│  mythology, family, and related...      │
└─────────────────────────────────────────┘
```

**Improvement:** ✅ Complete, functional entity pages

---

## Print View Considerations

If printing pages:
- ✅ Remove navigation
- ✅ Expand all sections
- ✅ Black text on white background
- ✅ Page breaks between sections
- ✅ Footer with URL

---

## Conclusion

This visual guide shows what each route should look like when working correctly. Use it to:

1. **Verify routes are working** - Compare actual vs expected
2. **Identify issues quickly** - Visual differences are obvious
3. **Test new features** - Ensure they match design
4. **Guide new developers** - Show how routes should look

---

**Last Updated:** 2025-12-28

**For detailed testing:** See `ROUTE_TESTING_REPORT.md`

**For fixing issues:** See `ROUTE_FIX_INSTRUCTIONS.md`

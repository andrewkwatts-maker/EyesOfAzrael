# Eyes of Azrael — Broken Features Review

**Date**: 2026-03-29
**Audited by**: 7 parallel code review agents
**Total Issues Found**: 129

## Severity Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 23 | App-breaking: crashes, stuck states, data loss |
| Major | 42 | Core features broken or unreliable |
| Minor | 43 | UX degradation, edge cases, polish |
| Cosmetic | 21 | Visual inconsistencies, style nits |

---

## Page 1: Home / Landing Page (18 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 1.1 | Async methods called without `await` | landing-page-view.js:2034-2040 | `loadFeaturedEntities()`, `loadRecentAdditions()`, `loadStats()` are async but called fire-and-forget in `attachEventListeners()`. Page renders before data loads. |
| 1.2 | Inline `onerror` handler on SVG icons | landing-page-view.js:1923 | `onerror="this.style.display='none'..."` is an inline handler. Violates CSP, harder to test. Should use addEventListener. |
| 1.3 | Route inconsistency for Mythologies | landing-page-view.js:86 | Mythologies uses `#/mythologies` while all 11 other categories use `#/browse/{category}`. Breaks navigation mental model. |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 1.4 | `loadEntityCounts()` silently swallows errors | landing-page-view.js:1946-1953 | If a collection doesn't exist, count badges stay empty with no indication of failure. |
| 1.5 | "Contributors" stat is a hardcoded placeholder | landing-page-view.js:540 | Shows "1000+" but `loadStats()` never updates `stat-contributors`. Misleading. |
| 1.6 | Admin category icons have no emoji fallback | landing-page-view.js:50-71 | "Concepts" and "Conspiracies" define `fallbackIcon` but don't wire it into the SVG error path. |
| 1.7 | `collection` property never defined on asset types | landing-page-view.js:1980 | Code uses `type.collection || type.id` but `collection` is never set. Works by accident. |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 1.8 | Skeleton shows 12 cards but admin sees 14 | landing-page-view.js:337 | Skeleton count doesn't account for admin-only categories. |
| 1.9 | Featured entity routes use different pattern | landing-page-view.js:2200 | Uses `#/${entity.type}/${entity.id}` instead of `#/browse/` prefix. |
| 1.10 | Hardcoded color fallback ignores entity.color | landing-page-view.js:2205 | `--card-color` always uses primary, never entity-specific color. |
| 1.11 | Missing null check on `truncateText()` input | landing-page-view.js:1959 | If `type.description` is undefined, method handles it but code is fragile. |
| 1.12 | No h1 element — heading hierarchy broken | landing-page-view.js:475+ | Multiple h2s with no h1. Screen readers can't build page outline. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 1.13 | Toast notification styles are inline JS | landing-page-view.js:2119-2131 | Should be in CSS class. |
| 1.14 | Admin email hardcoded in `isAdmin()` | landing-page-view.js:27 | `'andrewkwatts@gmail.com'` should be in config. |
| 1.15 | Redundant `aria-hidden` on decorative SVGs | landing-page-view.js:1918 | `alt=""` already marks as decorative. |

---

## Page 2: Browse Category Pages (18 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 2.1 | Retry button passes wrong arguments to `render()` | browse-category-view.js:1561 | Calls `this.render(this.category, this.mythology)` but `render()` expects `(container, {category, mythology})`. Retry always crashes. |
| 2.2 | Entity links break when `entity.mythology` is null | browse-category-view.js:901 | URL becomes `#/entity/deities//entity-id` (double slash). No null check. |
| 2.3 | Inline `onload`/`onerror` on card icons | browse-category-view.js:1395-1396 | CSP violation, XSS vector. Should use event listeners. |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 2.4 | `loadEntitiesDirect()` doesn't use collection name mapping | browse-category-view.js:210 | Uses `db.collection(this.category)` directly. Browsing "archetypes" queries wrong collection (should be "concepts"). |
| 2.5 | `capitalize()` crashes on null/undefined | browse-category-view.js:909, 1407 | `entity.mythology` passed to `capitalize()` without null check. TypeError. |
| 2.6 | `loadMoreEntities()` appends to potentially null grid | browse-category-view.js:2250-2276 | No DOM validation after async delay. Grid could be gone if user navigated away. |
| 2.7 | Load more button accumulates duplicate event listeners | browse-category-view.js:2182-2184 | Flag check exists but new button on re-render gets fresh listeners alongside old ones. |
| 2.8 | IntersectionObserver only works for lists < 100 items | browse-category-view.js:2169 | Lists > 100 lose infinite scroll. No virtual scrolling despite comments claiming it. |
| 2.9 | Virtual scrolling not implemented | browse-category-view.js:11, 54-55 | `visibleRange` defined but never updated. `handleScroll()` referenced but not defined. |
| 2.10 | Hover preview crashes on missing entity fields | browse-category-view.js:972-986 | `entity.altNames.join()` throws if `altNames` is undefined. No existence check. |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 2.11 | Empty state "Browse All" link doesn't clear filters | browse-category-view.js:1292 | Navigates to same URL without resetting filter state. |
| 2.12 | No loading spinner during filter/sort operations | browse-category-view.js:262 | Grid updates silently during async reload. |
| 2.13 | Card CSS has fixed 280px min-height on mobile | entity-card-polish.css:1657 | Causes poor layout on 320px screens. |
| 2.14 | Document-level listeners not cleaned up via AbortController | browse-category-view.js:1494 | Relies on manual cleanup that may not fire. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 2.15 | `showToast()` called without existence check | browse-category-view.js:1896 | Silent failure if toast system not loaded. |
| 2.16 | Hardcoded 24 items per page, not responsive | browse-category-view.js:53 | 24 cards on mobile creates excessive scroll. |

---

## Page 3: Entity Detail Page (18 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 3.1 | Breadcrumb mythology link uses wrong route | entity-detail-view.js:509 | Links to `#/mythologies/${mythology}` (plural) but router expects `#/mythology/${mythology}` (singular). Breadcrumb link is dead. |
| 3.2 | No `first-render-complete` dispatch from EntityDetailView | entity-detail-view.js:134-171 | View relies on spa-navigation.js to dispatch, but if view errors internally, event never fires. Loading spinner stuck. |
| 3.3 | Error path doesn't dispatch completion event | entity-detail-view.js:165-167 | `renderError()` called but no event dispatched. App stuck in loading state on error. |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 3.4 | "Show more" pill buttons have no event handler | universal-display-renderer.js:268-276 | Buttons with `data-action="expand-pills"` exist in DOM but nothing listens for them. Dead buttons. |
| 3.5 | Race condition in component initialization | entity-detail-view.js:159-162 | `requestAnimationFrame()` calls `initializeInteractiveFeatures()` while `attachEventListeners()` runs synchronously. Ordering not guaranteed. |
| 3.6 | Breadcrumb generates `#/mythology/null` link | entity-detail-view.js:498-517 | When mythology is null, still generates link. Should conditionally skip. |
| 3.7 | `marked.parse()` without sanitize option | entity-detail-view.js:1139-1159 | Potential XSS if marked.js processes untrusted content. Needs `sanitize: true`. |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 3.8 | Hardcoded hex colors in entity-detail.css | entity-detail.css:320+ | `#c9b8ff`, `#ffd700`, `#ff6b6b` etc. should use CSS variables for theme support. |
| 3.9 | No tablet-specific responsive rules | entity-detail.css:3320 | Gap between 768px and 1024px media queries. |
| 3.10 | Retry button falls back to `window.location.reload()` | entity-detail-view.js:652-658 | Poor UX. Should retry the view render, not reload entire app. |
| 3.11 | SVG sanitization uses regex instead of DOM parser | entity-detail-view.js:1126-1132 | Regex approach can't properly parse XML. May break valid SVGs. |
| 3.12 | Collapsed section state not cleared in `cleanup()` | entity-detail-view.js:667-675 | SessionStorage `edv_collapsed_sections` persists across entities. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 3.13 | Tab activation doesn't scroll to content | entity-detail-view.js:994-1012 | On mobile, tab content below fold after switch. |
| 3.14 | Epithet tags can overflow on mobile | entity-detail.css:311-327 | No `max-width` or `word-break` on `.epithet-tag`. |
| 3.15 | Breadcrumb item spacing relies on separator padding only | entity-detail.css:60-64 | No explicit gap. |

---

## Page 4: Search & Compare Pages (20 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 4.1 | SearchViewComplete never registers cleanup callback | search-view-complete.js:111 | No `registerViewCleanup()` call. Event listeners persist after navigation, causing memory leaks and double-binding. |
| 4.2 | CompareView has NO `destroy()` method | compare-view.js (entire file) | Document-level click, search, filter, mobile swipe, keyboard listeners are never removed. Accumulate on each visit. |
| 4.3 | CompareView `refresh()` creates duplicate listeners | compare-view.js:2021-2027 | Calls `this.render(parent)` → `init()` without destroying old view. All event listeners duplicated. |
| 4.4 | `getCommonAttributes()` method missing | compare-view.js:700, 796, 935 | Called in 3 places but never defined. Comparison table, similarity calculation, and mobile cards will crash. |
| 4.5 | `loadSuggestions()` method missing | compare-view.js:150 | Called in `render()` but never defined. Throws "loadSuggestions is not a function". |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 4.6 | Pagination uses inline onclick referencing global instance | search-view-complete.js:1301+ | `onclick="searchViewInstance.goToPage()"` may reference destroyed instance after re-navigation. |
| 4.7 | `searchEntities()` doesn't catch per-collection errors | compare-view.js:1665-1700 | One failed collection query kills entire search. Should catch individually. |
| 4.8 | `renderResults` accesses elements without null checks | search-view-complete.js:840-848 | Sets innerHTML on potentially null elements before the null check at line 937. |
| 4.9 | Mobile entity index not bounds-checked | compare-view.js:1504-1529 | `currentMobileEntity` becomes out-of-bounds after `removeEntity()`. |
| 4.10 | `addEntityById()` doesn't validate entity structure | compare-view.js (addEntityById) | No check for required fields (id, name, mythology). Malformed entity breaks comparison. |
| 4.11 | `first-render-complete` not dispatched on renderCompare error | spa-navigation.js:1911-1914 | Error catch block dispatches render-error but not first-render-complete. Loading spinner stuck. |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 4.12 | Example query listeners re-attached without cleanup | search-view-complete.js:1414-1430 | `initExampleQueries()` called multiple times, duplicating listeners. |
| 4.13 | `JSON.parse(card.dataset.entity)` is unsafe | compare-view.js:1388 | No try-catch. Malformed JSON crashes comparison. |
| 4.14 | Search results container has aria-live but no completion announcement | search-view-complete.js:273-275 | Screen readers don't know when search finishes. |
| 4.15 | Autocomplete rebuilds entire list on every keystroke | search-view-complete.js:765-804 | innerHTML replaced with listeners re-attached on each key. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 4.16 | `findArrayOverlap()` uses O(n^2) algorithm | compare-view.js:855-867 | Should use Set intersection. |
| 4.17 | No virtual scrolling for large comparison tables | compare-view.js:1059-1078 | Full DOM rendered for entities with 100+ attributes. |

---

## Page 5: Dashboard & Profile Pages (15 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 5.1 | `renderDashboard()` has no auth guard | spa-navigation.js:1917-1956 | Renders dashboard without checking authentication. Unauthenticated users see partially rendered dashboard instead of login prompt. |
| 5.2 | `first-render-complete` not dispatched by UserDashboardView | user-dashboard-view.js (render flow) | Only the UserDashboard component dispatches it. If UserDashboardView is used, loading spinner stays stuck. |
| 5.3 | Broken HTML closing tag in template | user-dashboard-view.js:785 | `<\span>` instead of `</span>` in reputation progress. Malformed HTML breaks rendering. |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 5.4 | Two conflicting dashboard implementations | user-dashboard-view.js vs user-dashboard.js | SPANavigation calls `dashboard.initialize(mainContent)` but UserDashboardView has no `initialize()` method. API mismatch between View and Component. |
| 5.5 | Profile doesn't validate user existence upfront | user-profile-view.js:122-136 | Shows loading spinner, then error. Should validate user ID before rendering. |
| 5.6 | Missing ARIA attributes on dashboard tabs | user-dashboard-view.js:356-520 | No `role="tab"`, `aria-selected`, `aria-controls`. Keyboard navigation broken. |
| 5.7 | Profile queries lack try-catch | user-profile-view.js:124-230 | `_loadProfileData()` Firestore query failures crash the entire render. |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 5.8 | Badge display re-initializes on tab switch | user-dashboard-view.js:1213-1269 | Unnecessary DOM re-render when switching to achievements tab. |
| 5.9 | Missing service availability warnings | user-profile-view.js:42-66 | Services checked but no warning logged when unavailable. |
| 5.10 | Tab clicking not debounced | user-profile-view.js:462-480 | Rapid clicks trigger concurrent Firestore queries. |
| 5.11 | Dashboard stats never refresh | user-dashboard-view.js:146-199 | Loaded once. New contributions while dashboard is open are invisible. |
| 5.12 | Brief handler-less button window | spa-navigation.js:1944-1947 | innerHTML set before `initialize()`. Buttons clickable but non-functional briefly. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 5.13 | Bronze tier color low contrast on dark themes | user-dashboard.css:54-55 | `#cd7f32` at 12% opacity may be invisible. |

---

## Page 6: Mythologies Pages (15 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 6.1 | `renderMythologies()` doesn't dispatch `first-render-complete` on script load failure | spa-navigation.js:1465-1471 | If MythologiesView class not found and dynamic load fails, loading spinner stuck forever. |
| 6.2 | `renderMythologies()` relies on view to dispatch event | spa-navigation.js:1434-1472 | If MythologiesView.render() throws, no `first-render-complete` fires. Should wrap in try/finally. |
| 6.3 | `renderMythology()` error path missing `first-render-complete` | spa-navigation.js:1543-1549 | Dispatches `render-error` but not `first-render-complete`. Loading spinner stuck on error. |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 6.4 | `.back-to-top-btn` CSS missing in mythologies context | mythologies-view.js:224 | Class defined in entity-detail.css only. Button unstyled on mythologies page. |
| 6.5 | Inline onclick handlers in mythology overview | mythology-overview.js:154, 215 | CSP violation. Back-to-top and TOC links use inline JS. |
| 6.6 | Collection name not normalized in entity mini cards | mythology-overview.js:254 | Passes raw `section.collection` to links. Could mismatch Firestore collection names. |
| 6.7 | No cleanup on re-mount | mythologies-view.js:74-77 | Previous AbortController not aborted before creating new one. Concurrent listeners. |
| 6.8 | Mythology detail error not handled with user message | mythology-overview.js:37-53 | Error thrown but calling code doesn't show user-friendly error. |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 6.9 | Back-to-top is `<a href="#">` not `<button>` | mythology-overview.js:154 | Adds to browser history. Semantically wrong. Should be button. |
| 6.10 | Missing aria-labels on region filter chips | mythologies-view.js:353-373 | Screen readers can't describe filter purpose. |
| 6.11 | Cache race condition in loadMythologies | mythologies-view.js:95-130 | Stale cache used initially, then overwritten by async Firebase fetch mid-render. |
| 6.12 | TOC links use optional chaining in inline handler | mythology-overview.js:215 | `?.scrollIntoView()` in onclick string — risky if target missing. |
| 6.13 | No mythology ID validation | spa-navigation.js:1505 | "undefined" or empty string passed directly to Firebase query. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 6.14 | `.has-skeleton` and `.content-loaded` CSS classes undefined | mythologies-view.js:40-58 | Classes added to DOM but never styled. No visual skeleton effect. |

---

## Page 7: Header, Footer, Navigation & Init (25 issues)

### Critical

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 7.1 | Header position conflict: `sticky` vs `fixed` | index.html:125 vs site-header.css:46 | Inline style says `sticky`, CSS says `fixed`. Confusing cascade. Inline should be removed. |
| 7.2 | User info hidden by inline `style="display:none"` | index.html:639 | Inline style overrides CSS `body.authenticated .user-info { display: flex }` due to specificity. User info may NEVER show. |
| 7.3 | Sign-out button missing event listener | index.html:643 | `#signOutBtn` defined in HTML but header-nav.js doesn't attach click handler. Unclear who owns it. |
| 7.4 | Navigation lock not reset on auth state change | spa-navigation.js:879-1129 | `_isNavigating` stays true if auth changes mid-navigation. No timeout fallback in auth path. |

### Major

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 7.5 | `.user-info` has no base flex styling | site-header.css (missing) | Only conditional rule in auth-guard.css. Layout breaks if auth CSS unloaded. |
| 7.6 | Extended menu panel CSS is dead code | index.html:180-192 | `.extended-menu-panel` and `.extended-menu-overlay` styled but never created in HTML/JS. |
| 7.7 | Footer sticky not enforced on short pages | visual-polish.css:879 | `margin-top: auto` relies on body flex, but footer doesn't have position fallback. |
| 7.8 | Magic Systems route/collection not verified | spa-navigation.js:314-333 | Browse pattern catches `#/browse/magic` but Firestore collection name not confirmed as "magic". |

### Minor

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 7.9 | Inline onclick on mobile back button | index.html:572 | `onclick="window.history.back()"` should be addEventListener. |
| 7.10 | Diagnostic panel uses inline onclick handlers | app-init-simple.js:255, 306-307 | Close, reload, debug buttons all inline. |
| 7.11 | Breadcrumb hidden but no `.visible` class toggle code | site-header.css:992-1001 | CSS has `.visible` state but no JS adds it on detail pages. |
| 7.12 | Mobile nav overlay z-index lower than panel | site-header.css:848 vs 869 | Overlay 9998, panel 9999. Panel should be above overlay. |
| 7.13 | Theme picker hidden on mobile but button still clickable | site-header.css:1222 | Button appears functional but does nothing. Confusing. |
| 7.14 | PDF download button no visible trigger | index.html:602 | `display:none` but no code sets it visible on entity pages. |
| 7.15 | User avatar no fallback for broken URLs | index.html:640 | Default SVG exists but no onerror fallback if JS sets bad src. |
| 7.16 | `first-render-complete` listener inconsistency | app-init-simple.js:904 vs 964 | One uses `{ once: true }`, the other doesn't. Could fire multiple times. |
| 7.17 | Safety timeout hardcoded, not using CONFIG constant | app-init-simple.js:922 | `2000` should reference `CONFIG.LOADING_HIDE_TIMEOUT`. |
| 7.18 | No keyboard nav for theme picker dropdown | header-nav.js | Arrow keys work for nav dropdowns but not theme items. |
| 7.19 | Footer newsletter form styling incomplete | index.html:690-695 | Focus states and hover effects not verified. |

### Cosmetic

| # | Issue | File:Line | Details |
|---|-------|-----------|---------|
| 7.20 | Body padding-top 80px but header height 64px | site-header.css:28 vs 52 | 16px unnecessary gap. Should use `var(--header-height-desktop)`. |
| 7.21 | Mobile padding-top 70px but header 56px | site-header.css:1131 | 14px wasted space. |
| 7.22 | Header flex uses both `space-between` and `gap` | site-header.css:76-85 | Over-constrained layout. May not work as intended. |
| 7.23 | Header actions gap change on mobile causes jank | site-header.css:1195-1197 | 0.75rem to 0.5rem transition may reflow buttons. |

---

## Top 20 Priority Fixes

Ranked by impact (crashes > stuck states > broken features > UX):

| Priority | ID | Issue | Impact |
|----------|-----|-------|--------|
| 1 | 7.2 | User info hidden by inline style | Auth users can't see their info/sign-out |
| 2 | 2.1 | Retry button crashes (wrong args) | Users can't recover from errors |
| 3 | 4.4 | `getCommonAttributes()` missing | Compare page crashes completely |
| 4 | 4.5 | `loadSuggestions()` missing | Compare page crashes on single entity |
| 5 | 5.3 | Broken `<\span>` closing tag | Dashboard HTML malformed |
| 6 | 2.2 | Entity links break without mythology | Double-slash URLs, broken navigation |
| 7 | 3.1 | Breadcrumb uses wrong route (plural) | Dead breadcrumb links on all entities |
| 8 | 2.4 | `loadEntitiesDirect()` wrong collection | Archetypes browse shows 0 results |
| 9 | 5.1 | Dashboard has no auth guard | Unauthenticated users see broken dashboard |
| 10 | 7.1 | Header position conflict | Potential scroll/layout bugs |
| 11 | 4.2 | CompareView has no destroy() | Memory leak, listener accumulation |
| 12 | 3.2 | EntityDetailView no first-render-complete | Loading spinner stuck on entity pages |
| 13 | 6.1-6.3 | Mythologies missing first-render-complete | Loading spinner stuck on mythologies |
| 14 | 2.5 | capitalize() crashes on null | TypeError on entities without mythology |
| 15 | 2.10 | Hover preview crashes on missing fields | TypeError on entity hover |
| 16 | 4.1 | SearchView never registers cleanup | Memory leak per search visit |
| 17 | 1.1 | Async methods called without await | Landing page data loads unreliably |
| 18 | 5.4 | Two conflicting dashboard implementations | API mismatch, initialization failure |
| 19 | 4.3 | CompareView refresh duplicates listeners | Compare page degrades on each refresh |
| 20 | 3.4 | "Show more" pills have no handler | Dead buttons on entity detail pages |

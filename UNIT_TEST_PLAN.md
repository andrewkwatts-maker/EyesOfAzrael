# Unit Test Implementation Plan
## Eyes of Azrael - Production Features Testing

**Created:** 2024-12-28
**Status:** Ready for Implementation
**Testing Framework:** Jest with Firebase Testing Utilities

---

## Overview

This plan outlines the comprehensive unit testing strategy for the 8 production features implemented in the previous phase. Each test agent will create a complete test suite for their assigned feature with 80%+ code coverage.

### Testing Stack
- **Framework:** Jest 29.x
- **Firebase Testing:** @firebase/rules-unit-testing
- **DOM Testing:** @testing-library/dom
- **Mocking:** Jest mocks + Firebase emulators
- **Coverage Target:** 80%+ per module
- **CI/CD:** GitHub Actions integration

---

## Agent 1: Compare View Tests

**Target File:** `js/components/compare-view.js`
**Test File:** `__tests__/components/compare-view.test.js`
**Coverage Target:** 85%

### Test Categories

#### 1. Core Functionality (15 tests)
- ✓ Initialize with Firestore instance
- ✓ Add entity to comparison (2-6 entities)
- ✓ Remove entity from comparison
- ✓ Clear all entities
- ✓ Prevent adding more than 6 entities
- ✓ Handle duplicate entity addition
- ✓ Render empty state correctly
- ✓ Render comparison table with 2 entities
- ✓ Render comparison table with 6 entities
- ✓ Calculate attribute differences
- ✓ Highlight unique attributes
- ✓ Handle missing attributes gracefully
- ✓ Export comparison to PDF
- ✓ Generate shareable URL
- ✓ Load comparison from URL parameters

#### 2. Entity Selection (8 tests)
- ✓ Render entity search interface
- ✓ Search entities by name (debounced)
- ✓ Filter entities by mythology
- ✓ Filter entities by type
- ✓ Select entity from search results
- ✓ Show selected entity count
- ✓ Disable search when max entities reached
- ✓ Enable removal of selected entities

#### 3. Comparison Display (10 tests)
- ✓ Render side-by-side layout for 2 entities
- ✓ Render grid layout for 3+ entities
- ✓ Display entity names and icons
- ✓ Display common attributes
- ✓ Display unique attributes (highlighted)
- ✓ Show attribute value differences
- ✓ Render nested attributes (e.g., powers.offensive)
- ✓ Handle array attributes (e.g., symbols)
- ✓ Format attribute values correctly
- ✓ Responsive layout (mobile/tablet/desktop)

#### 4. Export & Share (6 tests)
- ✓ Export to PDF with correct formatting
- ✓ Export filename includes entity names
- ✓ Share URL includes entity IDs
- ✓ Share URL includes collection types
- ✓ Load comparison from shared URL
- ✓ Handle invalid share URLs

#### 5. Error Handling (5 tests)
- ✓ Handle Firestore fetch errors
- ✓ Handle missing entities gracefully
- ✓ Show error message for network failures
- ✓ Recover from PDF export errors
- ✓ Handle malformed URL parameters

**Total Tests:** 44 tests

---

## Agent 2: User Dashboard Tests

**Target File:** `js/components/user-dashboard.js`
**Test File:** `__tests__/components/user-dashboard.test.js`
**Coverage Target:** 85%

### Test Categories

#### 1. Dashboard Initialization (6 tests)
- ✓ Initialize with user ID
- ✓ Fetch user contributions from Firestore
- ✓ Fetch user favorites from Firestore
- ✓ Calculate contribution statistics
- ✓ Render loading state
- ✓ Require authentication

#### 2. Contribution Tracking (10 tests)
- ✓ Display total contribution count
- ✓ Display contributions by type (deities, heroes, etc.)
- ✓ Display recent contributions (last 10)
- ✓ Show contribution timestamps
- ✓ Show contribution status (pending/approved/rejected)
- ✓ Link to contribution entities
- ✓ Filter contributions by status
- ✓ Sort contributions by date
- ✓ Paginate contributions (>10)
- ✓ Handle zero contributions gracefully

#### 3. Statistics Display (8 tests)
- ✓ Calculate total views across contributions
- ✓ Display most viewed contribution
- ✓ Calculate contribution streak
- ✓ Display contribution badges
- ✓ Show contribution ranking
- ✓ Display contribution timeline chart
- ✓ Show mythology distribution chart
- ✓ Calculate average contribution quality score

#### 4. Favorites Management (7 tests)
- ✓ Display favorite entities
- ✓ Add entity to favorites
- ✓ Remove entity from favorites
- ✓ Organize favorites by collection
- ✓ Search favorites
- ✓ Export favorites list
- ✓ Handle favorite count limit

#### 5. User Profile (6 tests)
- ✓ Display user profile information
- ✓ Show user avatar
- ✓ Display user level/XP
- ✓ Show account creation date
- ✓ Display user bio
- ✓ Allow profile editing

#### 6. Error Handling (5 tests)
- ✓ Handle Firestore fetch errors
- ✓ Handle missing user data
- ✓ Show error for unauthenticated access
- ✓ Handle network failures gracefully
- ✓ Recover from partial data load

**Total Tests:** 42 tests

---

## Agent 3: Search Functionality Tests

**Target File:** `js/components/search-view-complete.js`
**Test File:** `__tests__/components/search-view.test.js`
**Coverage Target:** 85%

### Test Categories

#### 1. Search Interface (8 tests)
- ✓ Render search input field
- ✓ Render filter controls
- ✓ Render display mode selector
- ✓ Render sort controls
- ✓ Initialize with empty state
- ✓ Show recent searches (from localStorage)
- ✓ Clear recent searches
- ✓ Responsive layout (mobile/desktop)

#### 2. Real-time Search (12 tests)
- ✓ Debounce search input (300ms)
- ✓ Search by entity name
- ✓ Search by entity description
- ✓ Search by tags/keywords
- ✓ Case-insensitive search
- ✓ Partial match search
- ✓ Highlight search terms in results
- ✓ Show search result count
- ✓ Handle empty search query
- ✓ Show "no results" message
- ✓ Clear search results
- ✓ Track search query in analytics

#### 3. Autocomplete (6 tests)
- ✓ Show autocomplete suggestions
- ✓ Limit suggestions to 10
- ✓ Navigate suggestions with keyboard (↑↓)
- ✓ Select suggestion with Enter
- ✓ Dismiss suggestions with Esc
- ✓ Close suggestions on outside click

#### 4. Filtering (10 tests)
- ✓ Filter by mythology (single)
- ✓ Filter by mythology (multiple)
- ✓ Filter by entity type (single)
- ✓ Filter by entity type (multiple)
- ✓ Filter by importance range (1-5)
- ✓ Combine multiple filters (AND logic)
- ✓ Show active filter count
- ✓ Clear individual filters
- ✓ Clear all filters
- ✓ Persist filters in URL params

#### 5. Display Modes (9 tests)
- ✓ Render grid view (default)
- ✓ Render list view
- ✓ Render detailed view
- ✓ Switch between display modes
- ✓ Persist display mode preference
- ✓ Show entity cards in grid
- ✓ Show entity rows in list
- ✓ Show expanded entities in detailed
- ✓ Responsive grid columns

#### 6. Sorting & Pagination (8 tests)
- ✓ Sort by name (A-Z)
- ✓ Sort by name (Z-A)
- ✓ Sort by importance (high-low)
- ✓ Sort by date added (newest)
- ✓ Paginate results (24 per page)
- ✓ Navigate pages (prev/next)
- ✓ Jump to specific page
- ✓ Show total page count

#### 7. Search History (5 tests)
- ✓ Save search to history (localStorage)
- ✓ Display recent searches (last 10)
- ✓ Click recent search to re-execute
- ✓ Clear search history
- ✓ Limit history to 10 items

#### 8. Error Handling (4 tests)
- ✓ Handle Firestore query errors
- ✓ Handle network failures
- ✓ Show error message
- ✓ Retry failed searches

**Total Tests:** 62 tests

---

## Agent 4: Footer Pages Tests

**Target Files:**
- `js/components/about-page.js`
- `js/components/privacy-page.js`
- `js/components/terms-page.js`

**Test Files:**
- `__tests__/components/about-page.test.js`
- `__tests__/components/privacy-page.test.js`
- `__tests__/components/terms-page.test.js`

**Coverage Target:** 90%

### Test Categories

#### About Page (8 tests)
- ✓ Render about page container
- ✓ Display project title
- ✓ Display project description
- ✓ Display mission statement
- ✓ Display team information
- ✓ Display contact information
- ✓ Render responsive layout
- ✓ Include links to social media

#### Privacy Page (12 tests)
- ✓ Render privacy policy container
- ✓ Display GDPR compliance notice
- ✓ List data collection practices
- ✓ Explain data usage
- ✓ Describe data storage
- ✓ Explain cookie usage
- ✓ List third-party services
- ✓ Describe user rights (GDPR)
- ✓ Provide contact for privacy inquiries
- ✓ Display last updated date
- ✓ Render table of contents
- ✓ Render responsive layout

#### Terms Page (12 tests)
- ✓ Render terms of service container
- ✓ Display acceptance notice
- ✓ Describe user accounts
- ✓ Explain contribution guidelines
- ✓ List prohibited uses
- ✓ Describe CC BY-SA 4.0 license
- ✓ Explain intellectual property
- ✓ Display disclaimer of warranties
- ✓ Describe limitation of liability
- ✓ Explain termination policy
- ✓ Display last updated date
- ✓ Render responsive layout

#### Navigation & Links (6 tests)
- ✓ Navigate to about page from footer
- ✓ Navigate to privacy page from footer
- ✓ Navigate to terms page from footer
- ✓ Update page title on navigation
- ✓ Track page view in analytics
- ✓ Scroll to top on page load

**Total Tests:** 38 tests

---

## Agent 5: Theme Toggle Tests

**Target File:** `js/simple-theme-toggle.js`
**Test File:** `__tests__/simple-theme-toggle.test.js`
**Coverage Target:** 90%

### Test Categories

#### 1. Initialization (6 tests)
- ✓ Initialize with default theme (night)
- ✓ Load saved theme from localStorage
- ✓ Find theme toggle button (#themeToggle)
- ✓ Attach click event listener
- ✓ Apply theme on initialization
- ✓ Update button icon on initialization

#### 2. Theme Switching (10 tests)
- ✓ Toggle from night to day theme
- ✓ Toggle from day to night theme
- ✓ Update body class on toggle
- ✓ Update button icon on toggle (🌙 ↔ ☀️)
- ✓ Save theme to localStorage
- ✓ Dispatch theme change event
- ✓ Integrate with shader system
- ✓ Smooth transition animation
- ✓ Multiple rapid toggles (debounce)
- ✓ Keyboard accessibility (Enter/Space)

#### 3. Theme Application (8 tests)
- ✓ Apply night theme CSS variables
- ✓ Apply day theme CSS variables
- ✓ Update background colors
- ✓ Update text colors
- ✓ Update border colors
- ✓ Update shader colors
- ✓ Apply to all themed elements
- ✓ Handle theme inheritance

#### 4. Persistence (6 tests)
- ✓ Save theme to localStorage
- ✓ Load theme from localStorage
- ✓ Handle missing localStorage
- ✓ Handle localStorage errors
- ✓ Clear theme from localStorage
- ✓ Persist across page reloads

#### 5. Shader Integration (5 tests)
- ✓ Activate night shader
- ✓ Activate day shader
- ✓ Handle missing shader system
- ✓ Sync shader with theme
- ✓ Update shader parameters

#### 6. Accessibility (6 tests)
- ✓ ARIA label on button
- ✓ Keyboard navigation support
- ✓ Focus visible outline
- ✓ High contrast mode support
- ✓ Reduced motion support
- ✓ Screen reader announcements

**Total Tests:** 41 tests

---

## Agent 6: Edit Modal Tests

**Target File:** `js/components/edit-entity-modal.js`
**Test File:** `__tests__/components/edit-entity-modal.test.js`
**Coverage Target:** 85%

### Test Categories

#### 1. Modal Lifecycle (8 tests)
- ✓ Open modal with entity ID
- ✓ Load entity data from Firestore
- ✓ Render modal container
- ✓ Render modal backdrop
- ✓ Close modal on backdrop click
- ✓ Close modal on Esc key
- ✓ Close modal on close button
- ✓ Destroy modal on close

#### 2. Form Rendering (10 tests)
- ✓ Render entity form (EntityForm integration)
- ✓ Pre-fill form with entity data
- ✓ Render all required fields
- ✓ Render optional fields
- ✓ Render array fields (tags, symbols)
- ✓ Render nested fields (powers.offensive)
- ✓ Render image upload field
- ✓ Render mythology selector
- ✓ Render type selector
- ✓ Render importance slider

#### 3. Form Validation (12 tests)
- ✓ Validate required fields
- ✓ Validate name (min 2 chars)
- ✓ Validate description (min 10 chars)
- ✓ Validate mythology selection
- ✓ Validate type selection
- ✓ Validate importance range (1-5)
- ✓ Validate URL format (image, sources)
- ✓ Validate array fields (min 1 item)
- ✓ Show validation errors
- ✓ Clear validation errors on fix
- ✓ Disable submit on validation errors
- ✓ Enable submit when valid

#### 4. Edit Functionality (10 tests)
- ✓ Submit form with valid data
- ✓ Call CRUD manager updateEntity
- ✓ Show loading state on submit
- ✓ Show success message on save
- ✓ Close modal on success
- ✓ Refresh entity display on save
- ✓ Track edit in analytics
- ✓ Handle submit errors gracefully
- ✓ Show error message on failure
- ✓ Keep modal open on error

#### 5. Permission Checks (6 tests)
- ✓ Allow edit for entity creator
- ✓ Allow edit for admin users
- ✓ Deny edit for other users
- ✓ Show permission error message
- ✓ Hide edit button for unauthorized
- ✓ Verify user authentication

#### 6. Image Upload (7 tests)
- ✓ Select image file
- ✓ Preview selected image
- ✓ Validate image format (jpg, png, webp)
- ✓ Validate image size (<5MB)
- ✓ Upload to Firebase Storage
- ✓ Update entity with image URL
- ✓ Handle upload errors

#### 7. Auto-save (5 tests)
- ✓ Auto-save draft every 2 seconds
- ✓ Save draft to localStorage
- ✓ Load draft on modal open
- ✓ Clear draft on submit
- ✓ Debounce auto-save

#### 8. Accessibility (6 tests)
- ✓ Trap focus within modal
- ✓ Focus first input on open
- ✓ Return focus on close
- ✓ ARIA labels on form fields
- ✓ Keyboard navigation support
- ✓ Screen reader announcements

**Total Tests:** 64 tests

---

## Agent 7: Quick View Modal Tests

**Target Files:**
- `js/components/entity-quick-view-modal.js`
- `js/components/entity-card-quick-view.js`

**Test Files:**
- `__tests__/components/entity-quick-view-modal.test.js`
- `__tests__/components/entity-card-quick-view.test.js`

**Coverage Target:** 85%

### Test Categories

#### Modal Lifecycle (8 tests)
- ✓ Open modal with entity ID
- ✓ Load entity from Firestore
- ✓ Render modal container
- ✓ Render modal backdrop
- ✓ Close modal on backdrop click
- ✓ Close modal on Esc key
- ✓ Close modal on close button (×)
- ✓ Destroy modal on close

#### Entity Display (12 tests)
- ✓ Display entity name
- ✓ Display entity icon/image
- ✓ Display entity mythology
- ✓ Display entity type
- ✓ Display entity description
- ✓ Display entity attributes
- ✓ Display entity powers
- ✓ Display entity symbols
- ✓ Display entity sources
- ✓ Render nested attributes
- ✓ Render array attributes
- ✓ Handle missing attributes

#### Related Entities (10 tests)
- ✓ Load related entities from crossReferences
- ✓ Display related deities
- ✓ Display related heroes
- ✓ Display related creatures
- ✓ Display related items
- ✓ Limit to 5 per type
- ✓ Render related entity cards
- ✓ Click related entity to navigate
- ✓ Handle missing related entities
- ✓ Load related entities asynchronously

#### Actions (8 tests)
- ✓ Render "View Full Page" button
- ✓ Navigate to full page on click
- ✓ Render "Add to Favorites" button
- ✓ Add to favorites on click
- ✓ Render "Compare" button
- ✓ Add to comparison on click
- ✓ Track actions in analytics
- ✓ Show loading state during actions

#### Event Delegation (8 tests)
- ✓ Attach global click listener
- ✓ Detect click on quick-view icon
- ✓ Extract entity ID from data attribute
- ✓ Extract collection from data attribute
- ✓ Extract mythology from data attribute
- ✓ Open modal with extracted data
- ✓ Handle multiple quick-view icons
- ✓ Remove listener on cleanup

#### Animations (6 tests)
- ✓ Fade in backdrop on open
- ✓ Slide in modal on open
- ✓ Fade out backdrop on close
- ✓ Slide out modal on close
- ✓ Complete animations before destroy
- ✓ Reduced motion support

#### Keyboard Navigation (7 tests)
- ✓ Close on Esc key
- ✓ Navigate actions with Tab
- ✓ Activate action with Enter
- ✓ Activate action with Space
- ✓ Trap focus within modal
- ✓ Return focus to trigger on close
- ✓ Focus first action on open

#### Error Handling (5 tests)
- ✓ Handle missing entity
- ✓ Handle Firestore fetch errors
- ✓ Show error message
- ✓ Close modal on error
- ✓ Track errors in analytics

**Total Tests:** 64 tests

---

## Agent 8: Analytics Tests

**Target File:** `js/analytics.js`
**Test File:** `__tests__/analytics.test.js`
**Coverage Target:** 90%

### Test Categories

#### 1. Initialization (6 tests)
- ✓ Initialize Google Analytics 4
- ✓ Load gtag script
- ✓ Configure with tracking ID
- ✓ Set anonymize_ip: true
- ✓ Set cookie_flags: SameSite=None;Secure
- ✓ Handle initialization errors

#### 2. Page View Tracking (8 tests)
- ✓ Track page view with path
- ✓ Track page view with title
- ✓ Track page view with metadata
- ✓ Track SPA navigation
- ✓ Update document.title
- ✓ Send to Google Analytics
- ✓ Debounce rapid page views
- ✓ Track page load time

#### 3. Entity View Tracking (10 tests)
- ✓ Track entity view with ID
- ✓ Track entity view with name
- ✓ Track entity view with collection
- ✓ Track entity view with mythology
- ✓ Send as 'view_item' event
- ✓ Include all entity metadata
- ✓ Track view duration
- ✓ Track scroll depth on entity page
- ✓ Handle missing entity data
- ✓ Batch entity view events

#### 4. Search Tracking (8 tests)
- ✓ Track search query
- ✓ Track search result count
- ✓ Track search filters applied
- ✓ Track search result clicks
- ✓ Track search session time
- ✓ Track "no results" searches
- ✓ Send as 'search' event
- ✓ Include search metadata

#### 5. Comparison Tracking (6 tests)
- ✓ Track comparison created
- ✓ Track entities compared (IDs)
- ✓ Track comparison export
- ✓ Track comparison share
- ✓ Send as 'compare' event
- ✓ Include comparison metadata

#### 6. Contribution Tracking (8 tests)
- ✓ Track entity creation
- ✓ Track entity edit
- ✓ Track entity deletion
- ✓ Track contribution status
- ✓ Track user ID (hashed)
- ✓ Send as 'contribute' event
- ✓ Include contribution metadata
- ✓ Track contribution time

#### 7. Navigation Tracking (8 tests)
- ✓ Track navigation events
- ✓ Track source page
- ✓ Track destination page
- ✓ Track navigation method (link/button)
- ✓ Track external link clicks
- ✓ Send as 'navigate' event
- ✓ Include referrer information
- ✓ Track navigation time

#### 8. Error Tracking (10 tests)
- ✓ Track JavaScript errors
- ✓ Track error message
- ✓ Track error stack trace
- ✓ Track error location (file:line)
- ✓ Track user context
- ✓ Send as 'exception' event
- ✓ Track Firebase errors
- ✓ Track network errors
- ✓ Sanitize error data (no PII)
- ✓ Batch error events

#### 9. Performance Tracking (10 tests)
- ✓ Track page load time
- ✓ Track Time to First Byte (TTFB)
- ✓ Track First Contentful Paint (FCP)
- ✓ Track Largest Contentful Paint (LCP)
- ✓ Track First Input Delay (FID)
- ✓ Track Cumulative Layout Shift (CLS)
- ✓ Track Firebase query time
- ✓ Send as 'timing' events
- ✓ Use Performance API
- ✓ Track Core Web Vitals

#### 10. Privacy & Consent (6 tests)
- ✓ Check user consent before tracking
- ✓ Respect Do Not Track (DNT)
- ✓ Anonymize IP addresses
- ✓ Hash user IDs
- ✓ Allow opt-out
- ✓ Clear analytics cookies on opt-out

**Total Tests:** 80 tests

---

## Testing Infrastructure Setup

### 1. Package.json Configuration

```json
{
  "devDependencies": {
    "@firebase/rules-unit-testing": "^3.0.0",
    "@testing-library/dom": "^9.3.3",
    "@testing-library/jest-dom": "^6.1.5",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### 2. Jest Configuration (jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.min.js',
    '!js/vendor/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};
```

### 3. Test Setup (__tests__/setup.js)

```javascript
import '@testing-library/jest-dom';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Mock Firebase
global.firebase = {
  firestore: jest.fn(),
  auth: jest.fn(),
  storage: jest.fn()
};

// Mock window objects
global.gtag = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Setup test environment
beforeAll(async () => {
  await initializeTestEnvironment({
    projectId: 'test-project'
  });
});
```

---

## Success Criteria

### Coverage Requirements
- ✅ Overall coverage ≥ 80%
- ✅ Branch coverage ≥ 75%
- ✅ Function coverage ≥ 85%
- ✅ Line coverage ≥ 80%

### Test Quality Standards
- ✅ All tests pass on first run
- ✅ No flaky tests (run 10x without failure)
- ✅ Tests complete in < 30 seconds total
- ✅ Each test has descriptive name
- ✅ Each test follows AAA pattern (Arrange, Act, Assert)
- ✅ Mocks are properly cleaned up
- ✅ No console errors during tests

### Documentation
- ✅ Each test file has header comment
- ✅ Complex tests have explanatory comments
- ✅ Test categories clearly organized
- ✅ Coverage report generated
- ✅ README.md with test instructions

---

## Agent Task Summary

| Agent | Target | Tests | Priority |
|-------|--------|-------|----------|
| Test Agent 1 | Compare View | 44 | High |
| Test Agent 2 | User Dashboard | 42 | High |
| Test Agent 3 | Search Functionality | 62 | High |
| Test Agent 4 | Footer Pages | 38 | Medium |
| Test Agent 5 | Theme Toggle | 41 | Medium |
| Test Agent 6 | Edit Modal | 64 | High |
| Test Agent 7 | Quick View Modal | 64 | High |
| Test Agent 8 | Analytics | 80 | Medium |

**Total Tests:** 435 tests
**Estimated Coverage:** 85%+ overall

---

## Next Steps

1. ✅ Deploy 8 test agents in parallel
2. ⏳ Validate all tests pass
3. ⏳ Generate coverage report
4. ⏳ Polish test suite based on results
5. ⏳ Integrate with CI/CD (GitHub Actions)

---

**Ready for Agent Deployment** 🚀

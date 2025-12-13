# Content Management Implementation Checklist

**Project:** Eyes of Azrael - User Content Management System
**Date Created:** 2025-12-13
**Current Status:** 30% Complete

---

## Critical Path (Must Have for Launch)

### 1. Universal Submission Form
**File:** `/submit/universal-form.html`
**Priority:** 🔴 CRITICAL

- [ ] Create base HTML structure
- [ ] Add content type selector dropdown
- [ ] Implement dynamic field generation
  - [ ] Deities: domains, titles, symbols, sacred animals/plants
  - [ ] Heroes: parentage, deeds, weapons, companions
  - [ ] Creatures: abilities, weaknesses, habitat
  - [ ] Places: type, coordinates, accessibility
  - [ ] Items: itemType, powers, wielders
  - [ ] Herbs: botanicalName, properties, uses
  - [ ] Magic: category, tradition, techniques
  - [ ] Cosmology: principles, applications
  - [ ] Myths: characters, moral, variants
  - [ ] Theories: hypothesis, evidence (already working)
- [ ] Integrate image upload component
- [ ] Add rich text editor for long descriptions
- [ ] Implement linguistic data fields (originalName, pronunciation, etymology)
- [ ] Implement geographical data fields (location, coordinates)
- [ ] Implement temporal data fields (dates, periods)
- [ ] Add validation for required fields
- [ ] Create preview mode
- [ ] Implement draft save functionality
- [ ] Submit to `/submissions` collection with status: "pending"
- [ ] Test on mobile devices
- [ ] Add accessibility labels (ARIA)

**Dependencies:**
- `entity-schema-v2.json` (exists)
- `firebase-content-db.js` (exists)
- `submission-context.js` (exists - for auto-filling mythology)

**Test Cases:**
- [ ] Submit deity (Egyptian: Sekhmet)
- [ ] Submit hero (Greek: Perseus)
- [ ] Submit creature (Norse: Fenrir)
- [ ] Submit place (Japanese: Mount Fuji)
- [ ] Submit item (Japanese: Kusanagi)
- [ ] Submit herb (Hindu: Ashwagandha)
- [ ] Submit magic (Celtic: Ogham divination)
- [ ] Submit cosmology (Japanese: Wa)
- [ ] Submit myth (Japanese: White Hare of Inaba)
- [ ] Submit theory (already working)

---

### 2. Admin Review Queue
**File:** `/admin/review-queue.html`
**Priority:** 🔴 CRITICAL

- [ ] Create admin dashboard layout
- [ ] Query `/submissions` collection (status: "pending")
- [ ] Display submission cards with metadata
  - [ ] Title, content type, mythology
  - [ ] Submitter name, date
  - [ ] Preview button
  - [ ] Edit button
  - [ ] Approve button
  - [ ] Reject button
- [ ] Implement filter controls
  - [ ] Filter by content type
  - [ ] Filter by mythology
  - [ ] Filter by submission date
  - [ ] Search by title
- [ ] Create preview modal
  - [ ] Render submission as it will appear publicly
  - [ ] Show all entity-schema-v2.0 fields
- [ ] Implement approve workflow
  - [ ] Move document from `/submissions/{id}` to `/[type]/{id}`
  - [ ] Update status to "published"
  - [ ] Set visibility to "public"
  - [ ] Populate reviewedBy, reviewedAt, publishedAt
  - [ ] Update search index
  - [ ] (Future) Send notification to user
- [ ] Implement reject workflow
  - [ ] Update status to "rejected"
  - [ ] Add rejection reason (optional)
  - [ ] (Future) Send notification to user
- [ ] Implement edit before approval
  - [ ] Admin can modify submission
  - [ ] Track admin edits in audit log
  - [ ] Preserve original submitter
- [ ] Add admin authentication check
  - [ ] Only show page if email == andrewkwatts@gmail.com
  - [ ] Redirect non-admins to homepage
- [ ] Create audit log viewer
  - [ ] Who reviewed what, when
  - [ ] Approval/rejection history

**Dependencies:**
- `firestore.rules` (already configured)
- `firebase-auth.js` (exists)

**Test Cases:**
- [ ] Admin sees pending submissions
- [ ] Admin can filter by type
- [ ] Admin can preview submission
- [ ] Admin can approve submission
  - [ ] Verify moved to main collection
  - [ ] Verify status changed to "published"
  - [ ] Verify appears on public page
- [ ] Admin can reject submission
  - [ ] Verify status changed to "rejected"
  - [ ] Verify does not appear publicly
- [ ] Admin can edit before approval
  - [ ] Verify changes saved
  - [ ] Verify edited version published
- [ ] Non-admin cannot access review queue
  - [ ] Verify redirect or 403 error

---

### 3. Dynamic Detail Page Loader
**File:** `/js/detail-loader.js`
**Priority:** 🔴 CRITICAL

- [ ] Create JavaScript module
- [ ] Detect content type and ID from URL
  - [ ] `/mythos/detail?type=deity&id=sekhmet`
  - [ ] `/mythos/egyptian/deities/sekhmet.html` (fallback to query param)
- [ ] Query Firestore collection based on type
  - [ ] `/deities/{id}`
  - [ ] `/heroes/{id}`
  - [ ] `/creatures/{id}`
  - [ ] etc.
- [ ] Render content dynamically
  - [ ] Parse entity-schema-v2.0 fields
  - [ ] Generate HTML panels
  - [ ] Handle missing optional fields gracefully
- [ ] Render rich content panels
  - [ ] Overview panel
  - [ ] Attributes panel (type-specific)
  - [ ] Linguistic data panel (if present)
  - [ ] Geographical data panel (if present)
  - [ ] Temporal data panel (if present)
  - [ ] Related entities panel
  - [ ] Sources panel
  - [ ] Media panel (images, diagrams)
- [ ] Show attribution
  - [ ] Display "Contributed by: [Name]" for user submissions
  - [ ] Link to user profile
- [ ] Add conditional edit button
  - [ ] Show only if:
    - [ ] User is logged in
    - [ ] User owns content (submittedBy == current user)
    - [ ] OR user is admin
  - [ ] Link to edit form with pre-filled data
- [ ] Handle errors
  - [ ] Content not found → Show 404 page
  - [ ] Network error → Show retry button
  - [ ] Permission denied → Show login prompt
- [ ] Implement caching
  - [ ] Use Firestore offline persistence
  - [ ] Cache rendered HTML (optional)
- [ ] Add breadcrumb navigation
  - [ ] Home → Mythology → Section → Entity
- [ ] Implement cross-reference links
  - [ ] Related deities clickable
  - [ ] Related places clickable
  - [ ] etc.

**Dependencies:**
- `firebase-content-loader.js` (exists)
- `entity-schema-v2.json` (exists)

**Test Cases:**
- [ ] Load deity detail page (official content)
- [ ] Load deity detail page (user submission)
- [ ] Load hero detail page
- [ ] Load creature detail page
- [ ] Edit button shows for content owner
- [ ] Edit button shows for admin
- [ ] Edit button hidden for others
- [ ] Handle missing content (404)
- [ ] Handle network errors gracefully
- [ ] Cross-reference links work
- [ ] Breadcrumb navigation works
- [ ] Mobile responsive

---

### 4. Add Cards to Grid Pages
**File:** All `/mythos/[mythology]/[section]/index.html` pages
**Priority:** 🟠 HIGH

For each mythology section page:
- [ ] Egyptian → Deities
- [ ] Egyptian → Heroes
- [ ] Egyptian → Creatures
- [ ] Greek → Deities
- [ ] Greek → Heroes
- [ ] Greek → Creatures
- [ ] Norse → Deities
- [ ] (etc. for all mythology/section combinations)

**Per page:**
- [ ] Add "+" card to grid
- [ ] Set `data-auth-show="loggedIn"` attribute
- [ ] Link to submission form
  - [ ] Pre-fill mythology from page context
  - [ ] Pre-fill content type from section
  - [ ] Example: `/submit?type=deity&mythology=egyptian`
- [ ] Style to match existing cards
  - [ ] Same size, border, hover effects
  - [ ] Plus icon prominent
  - [ ] "Add [Type]" text
  - [ ] "Submit your knowledge" subtext
- [ ] Test visibility
  - [ ] Hidden when logged out
  - [ ] Visible when logged in
  - [ ] Toggle instantly on login/logout

**Template:**
```html
<div class="mythology-card mythology-card-add"
     data-auth-show="loggedIn"
     onclick="window.location.href='/submit?type=deity&mythology=egyptian'">
    <div class="card-icon">➕</div>
    <h3>Add Deity</h3>
    <p>Submit your knowledge</p>
</div>
```

**Test Cases:**
- [ ] Card hidden when logged out
- [ ] Card appears when logged in
- [ ] Card links to correct submission form
- [ ] Mythology pre-filled in form
- [ ] Content type pre-filled in form

---

### 5. User Dashboard
**File:** `/my-submissions.html`
**Priority:** 🟠 HIGH

- [ ] Create dashboard layout
- [ ] Query user's submissions
  - [ ] `/submissions` where `submittedBy == currentUser.uid`
- [ ] Display submission cards grouped by status
  - [ ] Pending (awaiting review)
  - [ ] Approved (published)
  - [ ] Rejected (with reason)
  - [ ] Drafts (status: "draft")
- [ ] Show submission metadata
  - [ ] Title, type, mythology
  - [ ] Submission date
  - [ ] Last updated date
  - [ ] Status badge (color-coded)
- [ ] Add actions per submission
  - [ ] [Edit Draft] - for pending/draft submissions
  - [ ] [Delete] - for pending/draft submissions
  - [ ] [View Public Page] - for approved submissions
  - [ ] [View Rejection Reason] - for rejected submissions
- [ ] Show statistics
  - [ ] Total submissions
  - [ ] Approved count
  - [ ] Pending count
  - [ ] Views (for approved submissions)
  - [ ] Votes (for approved submissions)
- [ ] Add contributor badge
  - [ ] 🥉 Bronze: 1 approved
  - [ ] 🥈 Silver: 5 approved
  - [ ] 🥇 Gold: 25 approved
  - [ ] 👑 Platinum: 100 approved
- [ ] Implement pagination
  - [ ] Show 20 per page
  - [ ] Load more button
- [ ] Add filter controls
  - [ ] Filter by status
  - [ ] Filter by content type
  - [ ] Filter by mythology
  - [ ] Sort by date (newest/oldest)

**Test Cases:**
- [ ] Dashboard shows user's submissions only
- [ ] Pending submissions displayed correctly
- [ ] Approved submissions displayed correctly
- [ ] Rejected submissions displayed correctly
- [ ] Edit button works for pending
- [ ] Delete button works for drafts
- [ ] View public page link works
- [ ] Statistics accurate
- [ ] Contributor badge shows
- [ ] Pagination works
- [ ] Filters work

---

## Important (Should Have)

### 6. Edit Functionality
**File:** `/edit.html` or integrate into submission form
**Priority:** 🟠 MEDIUM

- [ ] Create edit mode for submission form
- [ ] Detect edit mode from URL parameter
  - [ ] `/submit?edit=true&id=[submissionId]`
- [ ] Load existing submission data
  - [ ] Query `/submissions/{id}` or `/[type]/{id}`
- [ ] Pre-fill all form fields
  - [ ] Basic fields
  - [ ] Type-specific attributes
  - [ ] Linguistic data
  - [ ] Geographical data
  - [ ] etc.
- [ ] Validate ownership
  - [ ] User owns submission OR user is admin
  - [ ] Redirect if not authorized
- [ ] Implement update workflow
  - [ ] Save changes to Firestore
  - [ ] Update `updatedAt` timestamp
  - [ ] Preserve original `submittedBy` and `createdAt`
  - [ ] (Future) Track edit history
- [ ] Show version history (future)
  - [ ] List previous versions
  - [ ] Diff view (changes highlighted)
  - [ ] Rollback option

**Test Cases:**
- [ ] User can edit own pending submission
- [ ] User can edit own approved submission (as admin)
- [ ] User cannot edit others' submissions
- [ ] Admin can edit any submission
- [ ] Changes save correctly
- [ ] Version tracked in audit log

---

### 7. Global Search
**File:** `/search.html`
**Priority:** 🟡 MEDIUM

- [ ] Create search page UI
- [ ] Add search bar to navbar (all pages)
- [ ] Implement search query
  - [ ] Query `/search_index` collection
  - [ ] Full-text search on title, description, tags
  - [ ] Support multiple content types
- [ ] Display search results
  - [ ] Group by content type
  - [ ] Show title, type, mythology, excerpt
  - [ ] Highlight matching terms
  - [ ] Link to detail page
- [ ] Add filters
  - [ ] Filter by content type
  - [ ] Filter by mythology
  - [ ] Sort by relevance/date
- [ ] Implement autocomplete (future)
  - [ ] Suggest entities as user types
  - [ ] Show recent searches
- [ ] Add search analytics (future)
  - [ ] Track popular searches
  - [ ] Improve search index based on usage

**Test Cases:**
- [ ] Search for "Zeus" returns deity, items, places, myths
- [ ] Search for "sun god" returns Ra, Helios, Amaterasu
- [ ] Filter by mythology works
- [ ] Filter by type works
- [ ] Highlighting works
- [ ] Links to detail pages work

---

### 8. Notification System
**File:** `/notifications.html` or integrate into navbar
**Priority:** 🟡 LOW

- [ ] Create notification bell icon in navbar
- [ ] Query `/notifications` collection
  - [ ] Where `userId == currentUser.uid`
  - [ ] Where `read == false` (for badge count)
- [ ] Display notification dropdown
  - [ ] Unread notifications first
  - [ ] Grouped by type (approval, rejection, comment, vote)
  - [ ] Link to related content
- [ ] Implement notification actions
  - [ ] Mark as read
  - [ ] Mark all as read
  - [ ] Delete notification
- [ ] Add notification triggers (via Cloud Functions - future)
  - [ ] Submission approved → Notify user
  - [ ] Submission rejected → Notify user
  - [ ] Comment on user's content → Notify user
  - [ ] Vote on user's content → Notify user (optional)
- [ ] Email notifications (future)
  - [ ] Send email on important events
  - [ ] User can opt out in settings

**Test Cases:**
- [ ] Notification appears when submission approved
- [ ] Notification badge shows unread count
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] Link to content works

---

## Nice to Have (Future Enhancements)

### 9. Collaborative Editing
**Priority:** 🟢 FUTURE

- [ ] Allow multiple users to suggest edits
- [ ] Show pending edit suggestions
- [ ] Approve/reject edit suggestions
- [ ] Track contributors (co-authors)

### 10. Version History
**Priority:** 🟢 FUTURE

- [ ] Store previous versions in `/[type]/{id}/versions/{versionId}`
- [ ] Display version timeline
- [ ] Diff view (show changes)
- [ ] Rollback to previous version

### 11. AI-Assisted Completion
**Priority:** 🟢 FUTURE

- [ ] Suggest related entities
- [ ] Auto-complete attributes based on mythology
- [ ] Generate initial description from key facts
- [ ] Check for duplicates before submission

### 12. Bulk Operations
**Priority:** 🟢 FUTURE

- [ ] Bulk import from CSV/JSON
- [ ] Bulk export user submissions
- [ ] Bulk approve/reject (admin)
- [ ] Bulk edit (change mythology, add tags, etc.)

### 13. Analytics Dashboard
**Priority:** 🟢 FUTURE

- [ ] User stats (submissions, approvals, views, votes)
- [ ] Content stats (most viewed, most voted, trending)
- [ ] Contribution leaderboard
- [ ] Activity timeline

### 14. Mobile App (PWA)
**Priority:** 🟢 FUTURE

- [ ] Convert to Progressive Web App
- [ ] Offline submission drafts
- [ ] Push notifications
- [ ] Home screen installation

---

## Testing Checklist (Pre-Launch)

### Authentication
- [ ] Google sign-in works
- [ ] User profile created in Firestore
- [ ] Session persists after browser restart
- [ ] Sign out works
- [ ] Auth state updates across tabs

### Security
- [ ] User can only edit own submissions
- [ ] Admin can edit any content
- [ ] Anonymous users cannot submit
- [ ] Firestore rules enforced (try in console)
- [ ] File upload size limits work
- [ ] Rate limiting works (if implemented)

### Submission Workflow
- [ ] All 10 content types have forms
- [ ] Forms validate required fields
- [ ] Forms save drafts
- [ ] Submissions go to `/submissions` collection
- [ ] Status set to "pending"

### Admin Workflow
- [ ] Admin can see pending submissions
- [ ] Admin can filter submissions
- [ ] Admin can preview
- [ ] Admin can approve (moves to main collection)
- [ ] Admin can reject (sets status)
- [ ] Admin can edit before approval
- [ ] Audit log tracks actions

### Public Visibility
- [ ] Approved submissions appear on public pages
- [ ] Detail pages load dynamically
- [ ] Edit buttons show for owner + admin
- [ ] "+" add cards show when authenticated
- [ ] Search finds user submissions
- [ ] Cross-references work

### User Experience
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Forms work on slow connections
- [ ] Error messages helpful
- [ ] Loading states clear
- [ ] Success confirmations visible

### Performance
- [ ] Page load time < 3 seconds
- [ ] Search results load quickly
- [ ] Image uploads process fast
- [ ] Firestore queries optimized
- [ ] Offline mode works

---

## Sign-Off

**Phase 1 Complete When:**
- [ ] All 10 content types have submission forms
- [ ] Admin review queue functional
- [ ] Dynamic detail pages load from Firestore
- [ ] "+" add cards on all grid pages
- [ ] User dashboard shows submissions
- [ ] End-to-end workflow tested

**Phase 2 Complete When:**
- [ ] Global search works
- [ ] Type/mythology filters work
- [ ] Mobile optimization complete
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met

**Phase 3 Complete When:**
- [ ] Notification system working
- [ ] Version history implemented
- [ ] Collaborative editing enabled
- [ ] Analytics dashboard live

---

**Created:** 2025-12-13
**Last Updated:** 2025-12-13
**Next Review:** After Phase 1 implementation

**Contact:** andrewkwatts@gmail.com

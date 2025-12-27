# Firebase Integration Testing Checklist

**Version:** 1.0
**Last Updated:** 2025-12-06
**Purpose:** Manual testing checklist for Firebase integration in Eyes of Azrael

---

## 🎯 Testing Overview

This checklist covers all aspects of the Firebase integration, including authentication, database operations, storage, security rules, and migration. Complete each section thoroughly before deploying to production.

**Test Environments:**
- ✅ Desktop (Chrome, Firefox, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Incognito/Private Mode (for public access testing)
- ✅ Multiple tabs/windows (for real-time sync)

---

## 1. Firebase Setup Verification

### Initial Configuration
- [ ] Firebase project created in Firebase Console
- [ ] Web app registered in Firebase project
- [ ] `firebase-config.js` file exists with correct credentials
- [ ] Firebase SDK scripts load without errors (check browser console)
- [ ] Firebase app initializes successfully
- [ ] No CORS errors in console

### Services Enabled
- [ ] Firebase Authentication enabled
- [ ] Google Sign-In provider enabled in Authentication
- [ ] Firestore Database created (in production mode)
- [ ] Firebase Storage enabled
- [ ] Security rules deployed for Firestore
- [ ] Security rules deployed for Storage

### Security Rules Deployed
- [ ] Run `firebase deploy --only firestore:rules`
- [ ] Run `firebase deploy --only storage:rules`
- [ ] Verify rules in Firebase Console
- [ ] Rules version matches local files

---

## 2. Authentication Tests

### Google Sign-In Flow
- [ ] Click "Sign in with Google" button
- [ ] Google OAuth popup appears
- [ ] Can select Google account
- [ ] Successfully redirected after authentication
- [ ] User profile data loaded (name, email, photo)
- [ ] User UID generated and consistent
- [ ] Auth state persists after page reload
- [ ] User document created in Firestore `users` collection

### Sign-Out Flow
- [ ] Click "Sign Out" button
- [ ] User logged out successfully
- [ ] UI updates to logged-out state
- [ ] Protected features disabled (submit, vote, comment)
- [ ] Auth state clears from session

### Session Persistence
- [ ] Log in and reload page → Still logged in
- [ ] Open in new tab → Already logged in
- [ ] Close and reopen browser → Still logged in (if "Remember Me")
- [ ] Open in incognito → Not logged in (as expected)

### Multi-Tab Synchronization
- [ ] Open site in two tabs
- [ ] Log in on Tab 1 → Tab 2 updates (after refresh)
- [ ] Log out on Tab 1 → Tab 2 updates (after refresh)
- [ ] Auth state syncs across tabs

### Profile Display
- [ ] User display name shows correctly
- [ ] User email shows correctly
- [ ] Google profile photo displays
- [ ] Default avatar shows if no photo
- [ ] Profile info updates after account changes

### Error Handling
- [ ] Cancel sign-in → Error handled gracefully
- [ ] Network error during sign-in → User notified
- [ ] Already signed in → No duplicate popups
- [ ] Invalid credentials → Clear error message

---

## 3. Theory Submission Tests

### Form Validation
- [ ] Cannot submit without logging in
- [ ] Title field required (minimum 5 characters)
- [ ] Topic selection required
- [ ] At least one panel required
- [ ] Empty fields show validation errors
- [ ] Form data persists on validation error

### Basic Theory Submission
- [ ] Fill all required fields
- [ ] Select topic from dropdown
- [ ] Select subtopic from dropdown
- [ ] Add 2-3 panels with content
- [ ] Submit theory successfully
- [ ] Confirmation message shown
- [ ] Redirected to browse/view page
- [ ] Theory appears in browse page immediately

### Custom Topics/Subtopics
- [ ] Create custom topic
- [ ] Custom topic saved to Firestore
- [ ] Custom topic appears in dropdown for future use
- [ ] Create custom subtopic
- [ ] Custom subtopic linked to topic correctly

### Rich Content Editor
- [ ] Add panel → Panel appears with editor
- [ ] Remove panel → Panel deleted
- [ ] Reorder panels → Order saved correctly
- [ ] Panel content supports line breaks
- [ ] Panel content escapes HTML correctly (no XSS)

### Image Upload (if implemented)
- [ ] Click "Upload Image" button
- [ ] File picker opens
- [ ] Select valid image (PNG, JPG, GIF)
- [ ] Upload progress bar shows
- [ ] Upload completes successfully
- [ ] Image preview appears
- [ ] Image URL saved to theory
- [ ] Can upload multiple images
- [ ] Can remove uploaded image before submit

### Image Upload Validation
- [ ] Reject files > 5MB (show error)
- [ ] Reject non-image files (show error)
- [ ] Reject invalid file types (show error)
- [ ] Upload progress shows for large files
- [ ] Handle upload failure gracefully

### External Links
- [ ] Add external link with title and URL
- [ ] Link validates as proper URL
- [ ] Can add multiple links
- [ ] Can remove links
- [ ] Links saved with theory

### Corpus Searches
- [ ] Add corpus search with query
- [ ] Select corpus from dropdown
- [ ] Add description
- [ ] Can add multiple searches
- [ ] Can remove searches

### Related Information
- [ ] Add related mythologies (comma-separated)
- [ ] Add tags (comma-separated)
- [ ] Add sources (comma-separated)
- [ ] Data saved with theory

### Submission Confirmation
- [ ] "Theory submitted successfully" message
- [ ] New theory appears at top of browse page
- [ ] Can view submitted theory immediately
- [ ] Theory has correct author information
- [ ] Timestamp shows current time

---

## 4. Browse Page Tests

### Public Access (Logged Out)
- [ ] Open browse page in incognito mode
- [ ] Page loads without requiring login
- [ ] Theories display correctly
- [ ] Can view theory details
- [ ] Vote buttons disabled with tooltip
- [ ] Comment form hidden
- [ ] "Login to interact" message shown

### Theory List Display
- [ ] All published theories show
- [ ] Theories grouped by topic (default)
- [ ] Topic groups collapsible
- [ ] Theory cards show title, author, summary
- [ ] Vote count, view count, comment count display
- [ ] Author avatar and name display
- [ ] Created date displays correctly

### Filtering
- [ ] **Search bar**: Type keyword → Real-time filtering works
- [ ] **Topic filter**: Select topic → Only matching theories show
- [ ] **Subtopic filter**: After topic selection → Further filtering works
- [ ] **Author filter**: Select author → Only their theories show
- [ ] **Clear filters**: All theories return
- [ ] Filter combinations work together

### Sorting
- [ ] Sort by "Newest" → Most recent first
- [ ] Sort by "Oldest" → Oldest first
- [ ] Sort by "Popular" → Most votes first
- [ ] Sort by "Most Viewed" → Highest views first
- [ ] Sorting persists on page reload

### Grouping
- [ ] Group by "Topic" → Theories grouped by topic
- [ ] Group by "Subtopic" → Theories grouped by subtopic
- [ ] Group by "Author" → Theories grouped by author
- [ ] Group by "None" → Flat list
- [ ] Grouping persists on page reload

### Pagination (if implemented)
- [ ] Initial load shows 20 theories
- [ ] "Load More" button appears
- [ ] Click "Load More" → Next 20 load
- [ ] Loading indicator shown during load
- [ ] No duplicate theories
- [ ] "No more theories" when all loaded

### Real-Time Updates
- [ ] Open browse in Tab 1
- [ ] Submit new theory in Tab 2
- [ ] Refresh Tab 1 → New theory appears
- [ ] Vote on theory in Tab 2
- [ ] Refresh Tab 1 → Vote count updates

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Filtering is responsive (< 500ms)
- [ ] Grouping is smooth
- [ ] No lag when scrolling
- [ ] Images load progressively

---

## 5. View Page Tests

### Public Access (Logged Out)
- [ ] Open theory in incognito mode
- [ ] Theory displays without login
- [ ] All content visible
- [ ] Vote button disabled
- [ ] Comment form hidden
- [ ] "Login to vote" tooltip shown
- [ ] "Login to comment" message shown

### Theory Display
- [ ] Title displays correctly
- [ ] Summary displays (if present)
- [ ] Author name and avatar show
- [ ] Topic and subtopic badges show
- [ ] View count increments on load
- [ ] Vote count displays
- [ ] Comment count displays
- [ ] Created date displays
- [ ] Updated date displays (if edited)

### Rich Content Rendering
- [ ] All panels render in order
- [ ] Panel titles display
- [ ] Panel content formatted correctly
- [ ] Line breaks preserved
- [ ] HTML escaped (no script execution)
- [ ] Images display with captions
- [ ] Image alt text present
- [ ] External links clickable
- [ ] Links open in new tab
- [ ] Corpus searches display correctly
- [ ] Related info section displays

### Voting (Logged In)
- [ ] "Upvote" button enabled when logged in
- [ ] Click upvote → Vote count increases
- [ ] Button shows "voted" state
- [ ] Click again → Vote removed (toggle)
- [ ] Vote count decreases
- [ ] Vote persists after page reload
- [ ] Cannot vote on own theory (or can, depends on rules)
- [ ] Only one vote per user

### Commenting (Logged In)
- [ ] Comment form visible when logged in
- [ ] Text area accepts input
- [ ] Cannot submit empty comment
- [ ] Submit comment → Appears in list immediately
- [ ] Comment shows author name and avatar
- [ ] Comment shows timestamp
- [ ] Multiple comments allowed
- [ ] Comments persist after reload
- [ ] Can see all comments on theory

### Delete Own Comment
- [ ] Delete button shows on own comments only
- [ ] Click delete → Confirmation prompt
- [ ] Confirm → Comment removed
- [ ] Comment count decrements
- [ ] Cannot delete other users' comments

### Edit/Delete Theory Buttons (Author Only)
- [ ] "Edit" button shows only for theory author
- [ ] "Delete" button shows only for theory author
- [ ] Buttons hidden for other users
- [ ] Buttons hidden when logged out

### Navigation
- [ ] "Back to Browse" button works
- [ ] Breadcrumb navigation works
- [ ] Direct URL access works
- [ ] Shareable URL includes theory ID

---

## 6. Edit Theory Tests

### Access Control
- [ ] Only theory author can access edit page
- [ ] Direct URL access blocked for non-authors
- [ ] Error message if unauthorized
- [ ] Redirect to browse or login

### Edit Form Pre-Population
- [ ] Title pre-filled with current value
- [ ] Summary pre-filled
- [ ] Topic and subtopic selected
- [ ] All panels loaded with content
- [ ] Images loaded
- [ ] External links loaded
- [ ] Corpus searches loaded
- [ ] Related info loaded

### Editing Content
- [ ] Can modify title
- [ ] Can modify summary
- [ ] Can change topic/subtopic
- [ ] Can edit panel content
- [ ] Can add new panels
- [ ] Can remove panels
- [ ] Can add new images
- [ ] Can remove images
- [ ] Can edit links and searches

### Save Changes
- [ ] Click "Save Changes" button
- [ ] Changes saved to Firestore
- [ ] "Updated successfully" message
- [ ] Redirect to view page
- [ ] Updated content displays
- [ ] `updatedAt` timestamp updates
- [ ] Author info unchanged

### Cancel/Discard Changes
- [ ] "Cancel" button available
- [ ] Click cancel → Redirect without saving
- [ ] Changes discarded
- [ ] Original content intact

---

## 7. Delete Theory Tests

### Delete Confirmation
- [ ] Click "Delete" button
- [ ] Confirmation modal appears
- [ ] Modal explains consequences
- [ ] "Cancel" option available
- [ ] "Confirm Delete" button present

### Successful Deletion
- [ ] Click "Confirm Delete"
- [ ] Theory removed from Firestore
- [ ] Redirect to browse page
- [ ] "Theory deleted" message shown
- [ ] Theory no longer in browse list
- [ ] Direct URL shows "Theory not found"

### Associated Data Cleanup
- [ ] Comments deleted (if implemented)
- [ ] Votes deleted (if implemented)
- [ ] Images deleted from Storage (if implemented)
- [ ] Theory removed from all collections

### Security
- [ ] Cannot delete other users' theories
- [ ] Cannot delete via direct API call
- [ ] Firestore rules enforce ownership

---

## 8. Image Upload & Storage Tests

### Upload Interface
- [ ] "Upload Image" button visible
- [ ] Click opens file picker
- [ ] Drag-and-drop works
- [ ] Upload progress indicator shows
- [ ] Multiple files can be selected
- [ ] Cancel upload works

### File Validation
- [ ] Accept PNG files
- [ ] Accept JPG/JPEG files
- [ ] Accept GIF files
- [ ] Accept WebP files
- [ ] Reject PDF files (error shown)
- [ ] Reject text files (error shown)
- [ ] Reject files > 5MB (error shown)
- [ ] Error messages clear and helpful

### Upload Process
- [ ] Upload progress bar accurate
- [ ] Can upload multiple images sequentially
- [ ] Upload completes successfully
- [ ] Download URL retrieved
- [ ] URL saved to theory data
- [ ] Image preview appears after upload

### Storage Organization
- [ ] Images saved to `theory-images/{userId}/{theoryId}/`
- [ ] File names preserved or sanitized
- [ ] No name conflicts
- [ ] Folder structure correct in Storage console

### Image Display
- [ ] Uploaded images display in theory
- [ ] Images load from CDN
- [ ] Captions display correctly
- [ ] Alt text present for accessibility
- [ ] Images responsive on mobile
- [ ] Broken image handling (if URL invalid)

### Image Deletion
- [ ] Can delete uploaded image
- [ ] Image removed from Storage
- [ ] URL removed from theory data
- [ ] No orphaned files in Storage

---

## 9. Security Tests

### Authentication Security
- [ ] Cannot access submit page without login
- [ ] Cannot submit theory without login
- [ ] Cannot vote without login
- [ ] Cannot comment without login
- [ ] Session token secure (HTTPS only in production)

### Theory Ownership
- [ ] Cannot edit other users' theories
- [ ] Cannot delete other users' theories
- [ ] Edit page blocks unauthorized access
- [ ] Firestore rules enforce ownership

### Firestore Security Rules
- [ ] Attempt to read unpublished theory (should fail)
- [ ] Attempt to create theory with wrong authorId (should fail)
- [ ] Attempt to update other user's theory (should fail)
- [ ] Attempt to delete other user's theory (should fail)
- [ ] Public can read published theories (should succeed)

### Storage Security Rules
- [ ] Attempt to upload to other user's folder (should fail)
- [ ] Attempt to delete other user's images (should fail)
- [ ] Attempt to upload file > 5MB (should fail)
- [ ] Attempt to upload non-image file (should fail)
- [ ] Public can read images (should succeed)

### XSS Prevention
- [ ] Enter `<script>alert('XSS')</script>` in title → Escaped
- [ ] Enter HTML tags in content → Escaped
- [ ] Enter JavaScript in links → Sanitized
- [ ] No script execution from user input

### SQL Injection Prevention
- [ ] N/A (Firestore is NoSQL, but test query injection)
- [ ] Enter special characters in search → No errors
- [ ] Enter Firestore query syntax → Escaped

### CORS & API Security
- [ ] Firebase config keys are public (OK for web)
- [ ] Security rules enforce permissions
- [ ] No direct database access without rules
- [ ] API keys restricted in Firebase Console (recommended)

---

## 10. Migration Tests

### LocalStorage Detection
- [ ] Migration tool detects existing localStorage data
- [ ] Banner shows "Migrate your theories to cloud"
- [ ] "Migrate Now" button appears
- [ ] No banner if localStorage empty

### Migration Process
- [ ] Click "Migrate Now"
- [ ] Prompts Google Sign-In if not logged in
- [ ] After sign-in, migration starts automatically
- [ ] Progress indicator shows
- [ ] Each theory migrated individually

### Data Preservation
- [ ] All theory titles preserved
- [ ] All content preserved (panels, links, etc.)
- [ ] Votes migrated correctly
- [ ] Comments migrated correctly
- [ ] Timestamps preserved
- [ ] Author info set to current user

### Image Migration
- [ ] LocalStorage image URLs migrated
- [ ] Placeholder images added if needed
- [ ] Images re-uploaded to Firebase Storage (if implemented)
- [ ] Download URLs updated in theories

### Migration Completion
- [ ] Success message shows count of migrated theories
- [ ] All theories appear in browse page
- [ ] LocalStorage data preserved as backup
- [ ] Can still access localStorage backup (for 30 days)
- [ ] Migration report generated

### Error Handling
- [ ] Handle network errors during migration
- [ ] Handle quota exceeded errors
- [ ] Handle duplicate theories
- [ ] Partial migration recovery (resume from failure)
- [ ] Clear error messages for users

---

## 11. Performance Tests

### Page Load Times
- [ ] Initial page load < 2 seconds
- [ ] Browse page (20 theories) < 2 seconds
- [ ] View page (single theory) < 1 second
- [ ] Submit page < 1 second
- [ ] No blocking JavaScript

### Query Performance
- [ ] Filter by topic < 500ms
- [ ] Search by keyword < 1 second
- [ ] Sort theories < 500ms
- [ ] Load more (pagination) < 1 second

### Image Performance
- [ ] Images load progressively
- [ ] Average image load < 3 seconds
- [ ] Lazy loading works (if implemented)
- [ ] Thumbnails used for previews (if implemented)

### Network Efficiency
- [ ] Minimal Firestore reads on page load
- [ ] Queries optimized (use indexes)
- [ ] Caching used where possible
- [ ] No redundant API calls
- [ ] Bundle size reasonable (check DevTools)

### Mobile Performance
- [ ] Fast on 3G network
- [ ] Responsive on mobile devices
- [ ] Touch interactions smooth
- [ ] No layout shifts
- [ ] Optimized for mobile bandwidth

### Quota Monitoring
- [ ] Monitor Firestore reads in Firebase Console
- [ ] Monitor Firestore writes
- [ ] Monitor Storage downloads
- [ ] Set up quota alerts
- [ ] Estimate daily usage within free tier

---

## 12. Cross-Browser & Device Tests

### Desktop Browsers
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Edge (latest version)
- [ ] Safari (latest version, macOS)
- [ ] All features work consistently

### Mobile Browsers
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Firefox (Android)
- [ ] Samsung Internet (Android)
- [ ] All features work on mobile

### Responsive Design
- [ ] Layout adapts to mobile screens
- [ ] Touch targets large enough (44x44px min)
- [ ] Text readable without zoom
- [ ] Forms usable on mobile
- [ ] No horizontal scrolling

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Alt text on images
- [ ] Focus indicators visible
- [ ] Color contrast sufficient (WCAG AA)

---

## 13. Edge Cases & Error Handling

### Network Issues
- [ ] Offline mode handling (show message)
- [ ] Slow network (loading indicators)
- [ ] Network timeout (retry logic)
- [ ] Firestore offline persistence (if enabled)

### Data Edge Cases
- [ ] Empty theory list (show message)
- [ ] Theory with no panels (validation prevents)
- [ ] Very long title (truncate or allow)
- [ ] Very long content (handle gracefully)
- [ ] Special characters in content
- [ ] Emoji in content ✅

### User Edge Cases
- [ ] New user (no theories yet)
- [ ] User with 100+ theories
- [ ] Multiple users with same name
- [ ] User with no profile photo
- [ ] User deletes Google account (handle gracefully)

### Concurrent Actions
- [ ] Two users vote on same theory
- [ ] Two users comment simultaneously
- [ ] User edits theory in two tabs
- [ ] User deletes theory while viewing in another tab

---

## 14. Production Readiness

### Final Checks Before Launch
- [ ] All tests above passed
- [ ] Firebase project in production mode
- [ ] Security rules deployed
- [ ] Environment variables configured
- [ ] API keys restricted (in Firebase Console)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS)
- [ ] Analytics enabled (Firebase Analytics)
- [ ] Error tracking enabled (optional: Sentry)

### Monitoring Setup
- [ ] Firebase Console access
- [ ] Quota alerts configured
- [ ] Performance monitoring enabled
- [ ] Crashlytics enabled (optional)
- [ ] Daily usage reports

### Documentation
- [ ] User guide created (how to use site)
- [ ] Admin guide created (how to manage)
- [ ] Firebase setup guide complete
- [ ] Migration guide complete
- [ ] Troubleshooting guide created

### Backup & Recovery
- [ ] Firestore backup strategy
- [ ] Storage backup strategy
- [ ] Recovery procedure documented
- [ ] Test data restoration

---

## 15. User Acceptance Testing (UAT)

### Real User Testing
- [ ] Invite 5-10 beta testers
- [ ] Provide testing scenarios
- [ ] Collect feedback
- [ ] Observe actual usage patterns
- [ ] Identify usability issues

### Feedback Collection
- [ ] Ease of use (1-10 rating)
- [ ] Feature completeness
- [ ] Performance satisfaction
- [ ] Mobile experience
- [ ] Suggestions for improvement

### Issue Resolution
- [ ] Document all reported issues
- [ ] Prioritize bugs and features
- [ ] Fix critical issues
- [ ] Re-test after fixes
- [ ] Get final approval from testers

---

## ✅ Success Criteria

The Firebase integration is ready for production when:

1. ✅ All authentication flows work perfectly
2. ✅ Theory submission works end-to-end
3. ✅ Browse and view pages fully functional
4. ✅ Edit and delete work with proper security
5. ✅ Image upload and storage operational
6. ✅ Security rules enforced correctly
7. ✅ Migration tool works reliably
8. ✅ Performance meets targets (< 2s page load)
9. ✅ Mobile experience smooth
10. ✅ No critical bugs or errors
11. ✅ Quota usage within free tier limits
12. ✅ Beta testers approve

---

## 🐛 Known Issues & Limitations

### Current Limitations
- [ ] LocalStorage size limit (5-10MB)
- [ ] Firebase free tier limits (50K reads/day)
- [ ] No offline editing support
- [ ] No real-time collaborative editing
- [ ] No theory versioning/history
- [ ] No moderation tools

### Planned Enhancements
- [ ] Rich text editor (Markdown or WYSIWYG)
- [ ] Image editing/cropping
- [ ] Theory templates
- [ ] Advanced search
- [ ] User profiles page
- [ ] Notification system

---

## 📞 Support & Resources

### Troubleshooting
- **Issue**: User not staying logged in
  **Solution**: Check Firebase Auth persistence settings

- **Issue**: Theories not appearing
  **Solution**: Check Firestore security rules, verify status='published'

- **Issue**: Images not uploading
  **Solution**: Check Storage rules, verify file size < 5MB, check file type

- **Issue**: Quota exceeded
  **Solution**: Check Firebase Console usage, optimize queries, implement caching

### Documentation Links
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Console](https://console.firebase.google.com)

---

**Testing Completed By:** _________________
**Date:** _________________
**Notes:** _________________


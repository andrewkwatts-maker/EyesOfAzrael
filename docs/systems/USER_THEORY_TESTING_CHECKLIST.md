# User Theory System - Testing Checklist

## Test Environment Setup

### Required Files
All files should be in place:
- ✅ `js/user-auth.js` - Authentication system
- ✅ `js/user-theories.js` - Theory management
- ✅ `js/theory-taxonomy.js` - Topic/subtopic taxonomy
- ✅ `js/components/theory-widget.js` - Embeddable widget
- ✅ `js/components/theory-editor.js` - Rich content editor
- ✅ `css/user-auth.css` - Complete styling
- ✅ `auth-modal-template.html` - Auth modal template
- ✅ `theories/user-submissions/submit.html` - Submission page
- ✅ `theories/user-submissions/browse.html` - Browse page
- ✅ `theories/user-submissions/view.html` - View page
- ✅ `test-user-theories.html` - Test/demo page

### Test Pages to Open
1. **Test Page**: `test-user-theories.html`
2. **Submit Page**: `theories/user-submissions/submit.html`
3. **Browse Page**: `theories/user-submissions/browse.html`

---

## Phase 1: Authentication Tests

### Signup Flow
- [ ] Open `test-user-theories.html`
- [ ] Click "Login / Sign Up" in top-right corner
- [ ] Switch to "Sign Up" tab
- [ ] Try to submit with empty fields → Should show validation errors
- [ ] Fill in all fields:
  - Username: `testuser1`
  - Email: `test1@example.com`
  - Password: `password123`
- [ ] Click "Sign Up" → Should show success message
- [ ] Modal should close and user should be logged in
- [ ] Top-right should show avatar and username
- [ ] Open browser DevTools → Console → Type `localStorage.getItem('users')` → Should see user data

### Login Flow
- [ ] Click "Logout" button
- [ ] Click "Login / Sign Up"
- [ ] Try to login with wrong password → Should show error
- [ ] Login with correct credentials:
  - Username: `testuser1`
  - Password: `password123`
- [ ] Should login successfully
- [ ] User info should appear in top-right

### Session Persistence
- [ ] Reload the page
- [ ] User should still be logged in (session persists)
- [ ] Open in new tab → User should be logged in there too
- [ ] Logout in one tab → Other tab should also logout (multi-tab sync)

### Profile Management
- [ ] Click on user avatar in top-right
- [ ] Click "View Profile"
- [ ] Should see profile information
- [ ] Try editing bio
- [ ] Changes should save and persist after reload

---

## Phase 2: Theory Submission Tests

### Navigation to Submit Page
- [ ] From test page, click "✨ Submit Theory" button
- [ ] Should navigate to `theories/user-submissions/submit.html`
- [ ] If not logged in → Should show "Login Required" message
- [ ] Click "Login or Sign Up" button → Should open auth modal
- [ ] After logging in → Form should appear

### Basic Information Section
- [ ] Title field should require minimum 5 characters
- [ ] Try to submit with title "Test" → Should show validation error
- [ ] Enter valid title: "The Universal Flood Myth: A Cross-Cultural Analysis"
- [ ] Enter summary (optional): "An examination of flood myths across multiple cultures"

### Topic & Subtopic Selection
- [ ] Topic dropdown should show all 12 default topics with icons
- [ ] Select topic: "Mythologies 🌍"
- [ ] Subtopic dropdown should populate with 15 mythology subtopics
- [ ] Select subtopic: "Greek Mythology"

### Custom Topic/Subtopic Creation
- [ ] Change topic to "➕ Create New Topic"
- [ ] Custom topic input fields should appear
- [ ] Enter custom topic name: "Astrology"
- [ ] Enter icon: "♈"
- [ ] Subtopic dropdown should hide
- [ ] Save this for later testing

### Rich Content Editor - Panels
- [ ] Click "+ Add Panel" button
- [ ] First panel should appear with number "#1"
- [ ] Enter panel title: "Introduction"
- [ ] Enter panel content: "Flood myths appear in nearly every ancient culture..."
- [ ] Click "+ Add Panel" again
- [ ] Second panel "#2" should appear
- [ ] Add content to second panel
- [ ] Click "×" on first panel → Panel should be removed
- [ ] Re-add a panel

### Rich Content Editor - Images
- [ ] Click "+ Add Image" button
- [ ] Image item should appear
- [ ] Enter image URL: `https://via.placeholder.com/400x300`
- [ ] Image preview should load
- [ ] Enter caption: "Depiction of the Great Flood"
- [ ] Enter alt text: "Ancient flood artwork"
- [ ] Click "+ Add Image" again → Second image should appear
- [ ] Click "Remove" on first image → Should be removed

### Rich Content Editor - External Links
- [ ] Click "+ Add Link" button
- [ ] Enter link title: "Wikipedia: Flood Myth"
- [ ] Enter URL: `https://en.wikipedia.org/wiki/Flood_myth`
- [ ] Enter description: "Comprehensive overview of flood myths"
- [ ] Add another link
- [ ] Remove the second link

### Rich Content Editor - Corpus Searches
- [ ] Click "+ Add Search" button
- [ ] Enter query: "flood mythology"
- [ ] Select corpus: "Greek Texts"
- [ ] Enter description: "References to floods in Greek mythology"
- [ ] Add another corpus search
- [ ] Try different corpus selection

### Related Information Section
- [ ] Enter related mythologies: "Greek, Norse, Mesopotamian"
- [ ] Enter tags: "flood myth, creation, deluge"
- [ ] Enter sources: "Ovid's Metamorphoses, Epic of Gilgamesh"

### Form Validation
- [ ] Try to submit without panels → Should show error
- [ ] Add at least one panel with content
- [ ] Try to submit without topic/subtopic → Should show error
- [ ] Fill all required fields
- [ ] Click "🚀 Submit Theory"
- [ ] Should show success message
- [ ] Should redirect to browse page with highlight

---

## Phase 3: Browse Page Tests

### Initial Load
- [ ] Browse page should load at `theories/user-submissions/browse.html`
- [ ] If coming from submit, newly created theory should be highlighted (pulsing border)
- [ ] Statistics bar should show correct counts
- [ ] Theories should be grouped by topic by default

### Filtering Tests
- [ ] **Search**: Enter text in search box → Results should filter in real-time
- [ ] **Topic Filter**: Select "Mythologies" → Should show only mythology theories
- [ ] **Subtopic Filter**: After selecting topic, select subtopic → Should filter further
- [ ] **Author Filter**: Select your username → Should show only your theories
- [ ] **Sort**: Change sorting:
  - Newest → Most recent first
  - Oldest → Oldest first
  - Popular → Highest votes first
  - Views → Most viewed first

### Grouping Tests
- [ ] Click "By Topic" → Theories grouped by topic
- [ ] Click "By Subtopic" → Theories grouped by subtopic
- [ ] Click "By Author" → Theories grouped by author
- [ ] Click "None" → All theories in flat list
- [ ] Groups should be collapsible (click header to collapse/expand)

### Navigation
- [ ] Click "✨ Submit Your Theory" button → Should navigate to submit page
- [ ] Click on any theory card → Should navigate to view page

---

## Phase 4: View Page Tests

### Theory Display
- [ ] Theory title should display correctly
- [ ] Author avatar and name should show
- [ ] View count, vote count, comment count should display
- [ ] Topic and subtopic badge should show (if applicable)
- [ ] Summary should display (if provided)

### Rich Content Rendering
- [ ] All panels should render with titles and content
- [ ] Images should display correctly with captions
- [ ] External links should be clickable and open in new tab
- [ ] Corpus searches should display with query and corpus info
- [ ] Sources section should display (if provided)

### Voting
- [ ] If not logged in → Vote button should be disabled with "Login to vote" tooltip
- [ ] Login if needed
- [ ] Click "👍 Upvote" → Vote count should increase
- [ ] Click again → Vote should be removed (toggle)
- [ ] Vote count should persist after page reload
- [ ] Button should show "voted" state when active

### Commenting
- [ ] If not logged in → Should show "Login to add a comment" message
- [ ] Login if needed
- [ ] "Add a Comment" section should appear
- [ ] Try to post empty comment → Should show error
- [ ] Enter comment: "Great analysis of flood myths!"
- [ ] Click "Post Comment"
- [ ] Comment should appear in list
- [ ] Comment should show your avatar and username
- [ ] Comment should persist after reload

### Navigation
- [ ] Click "← Back to Browse" → Should return to browse page
- [ ] Use breadcrumb navigation → Should work correctly

---

## Phase 5: Widget Integration Tests

### Test on Sample Page
- [ ] Open `test-user-theories.html`
- [ ] Scroll to "Button Mode Widget" section
- [ ] Click "💭 View Community Theories" button
- [ ] Modal should open showing theories for this page
- [ ] Should be able to submit theory directly from modal
- [ ] Close modal

### Inline Mode Widget
- [ ] Scroll to "Inline Mode Widget" section
- [ ] Widget should display inline on page
- [ ] Theories should be visible without clicking
- [ ] Should show submit button
- [ ] Should link to full browse page

---

## Phase 6: Cross-Page Tests

### Multi-Tab Synchronization
- [ ] Open browse page in Tab 1
- [ ] Open view page in Tab 2
- [ ] Vote on theory in Tab 2
- [ ] Refresh Tab 1 → Vote should be updated
- [ ] Post comment in Tab 2
- [ ] Refresh Tab 1 → Comment should appear

### Login/Logout Sync
- [ ] Login in Tab 1
- [ ] Tab 2 should reflect logged-in state (after refresh or event)
- [ ] Logout in Tab 1
- [ ] Tab 2 should reflect logged-out state

---

## Phase 7: Data Persistence Tests

### LocalStorage Inspection
- [ ] Open DevTools → Application → Local Storage
- [ ] Check `users` key → Should contain all registered users
- [ ] Check `userTheories` key → Should contain all theories
- [ ] Check `customTheoryTopics` key → Should contain custom topics
- [ ] Check `currentUser` key → Should contain logged-in user session

### Data Survival
- [ ] Close all browser tabs
- [ ] Reopen browser
- [ ] Navigate to browse page
- [ ] All theories should still be there
- [ ] User should still be logged in (session persists)

### Clear Data Test
- [ ] In DevTools Console: `localStorage.clear()`
- [ ] Reload page
- [ ] Should start fresh (no theories, no users)
- [ ] Re-test signup and submission flow

---

## Phase 8: Edge Cases & Error Handling

### Form Validation Edge Cases
- [ ] Submit theory with only whitespace in fields → Should be rejected
- [ ] Submit with very long title (500+ chars) → Should accept (no max limit currently)
- [ ] Submit with special characters in title → Should escape HTML properly
- [ ] Try XSS attack: `<script>alert('XSS')</script>` → Should be escaped and safe

### Network/Asset Errors
- [ ] Submit theory with broken image URL → Should show broken image placeholder
- [ ] Test with external link that 404s → Link should still display
- [ ] Test corpus search with unusual characters

### Concurrent Actions
- [ ] Open theory in two tabs
- [ ] Vote in both tabs rapidly → Vote should be consistent
- [ ] Post comment in both tabs → Both comments should appear

---

## Phase 9: Deployment Script Tests

### Auto-Widget Deployment (Optional)
- [ ] Run deployment script: `node scripts/add-theory-widgets.js --dry-run --verbose`
- [ ] Review output → Should list all pages that would be modified
- [ ] Run without --dry-run: `node scripts/add-theory-widgets.js`
- [ ] Check modified pages → Should have theory widgets added
- [ ] Test widgets on deployed pages

---

## Phase 10: Performance Tests

### Large Dataset
- [ ] Create 20+ theories with different topics/subtopics
- [ ] Browse page should load quickly
- [ ] Filtering should be responsive
- [ ] Grouping should work smoothly
- [ ] Search should filter in real-time

### Rich Content Load
- [ ] Create theory with 10 panels
- [ ] Add 5 images
- [ ] Add 10 external links
- [ ] View page should load all content smoothly
- [ ] Scrolling should be smooth

---

## Expected Results Summary

### ✅ All Tests Passing Means:
1. **Authentication works**: Signup, login, logout, session persistence
2. **Theory submission works**: Rich editor, validation, topic selection
3. **Browse page works**: Filtering, grouping, sorting, search
4. **View page works**: Display, voting, commenting
5. **Widgets work**: Button and inline modes
6. **Data persists**: LocalStorage maintains state across sessions
7. **Multi-tab sync works**: Changes reflect across tabs
8. **Security works**: HTML escaping prevents XSS
9. **Error handling works**: Validation and user feedback

---

## Known Limitations (Current MVP)

1. **LocalStorage only**: No backend/database (data is browser-specific)
2. **No image upload**: Users must provide URLs
3. **No rich text editing**: Plain text only in panels
4. **No theory editing**: Edit functionality UI not implemented yet
5. **No theory deletion UI**: Deletion method exists but no UI
6. **No pagination**: All theories load at once
7. **No user profiles page**: Profile data exists but no dedicated view
8. **No notifications**: No system to notify users of comments/votes
9. **No moderation**: No admin tools or content moderation
10. **No search highlighting**: Search results don't highlight matched text

---

## Future Enhancements

### High Priority
- [ ] Add edit theory functionality (UI)
- [ ] Add delete theory button (UI)
- [ ] Add pagination for browse page
- [ ] Add rich text editor (Markdown or WYSIWYG)
- [ ] Add image upload functionality

### Medium Priority
- [ ] Add user profile pages
- [ ] Add theory draft/save functionality
- [ ] Add notification system
- [ ] Add sharing features (social media)
- [ ] Add theory bookmarking/favorites

### Low Priority
- [ ] Add theory version history
- [ ] Add collaborative editing
- [ ] Add theory templates
- [ ] Add export functionality (PDF, Markdown)
- [ ] Add advanced search filters

---

## Troubleshooting

### Issue: User not staying logged in
**Solution**: Check browser's localStorage permissions. Clear localStorage and try again.

### Issue: Theories not appearing
**Solution**: Check DevTools Console for errors. Verify `userTheories` in localStorage.

### Issue: Vote/Comment not saving
**Solution**: Ensure user is logged in. Check localStorage quota (5-10MB limit).

### Issue: Widget not loading
**Solution**: Verify all script tags are included. Check for JavaScript errors in console.

### Issue: Theme not loading
**Solution**: Ensure `theme-base.css` and `theme-picker.js` are loaded correctly.

### Issue: Auth modal not appearing
**Solution**: Verify `auth-modal-template.html` is loaded. Check for fetch errors.

---

## Success Criteria

The system is working correctly if:
1. ✅ Users can signup/login/logout
2. ✅ Users can create theories with rich content
3. ✅ Theories can be browsed, filtered, grouped, sorted
4. ✅ Theories can be viewed, voted on, commented on
5. ✅ Data persists across browser sessions
6. ✅ Widgets can be embedded on any page
7. ✅ Multi-tab synchronization works
8. ✅ No JavaScript errors in console
9. ✅ Mobile responsive design works
10. ✅ All user flows complete successfully

---

**Last Updated**: 2025-12-06
**Version**: 2.0 (Rich Content + Taxonomy System)

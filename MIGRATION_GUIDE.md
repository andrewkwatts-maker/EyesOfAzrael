# User Data Migration Guide
## From localStorage to Firebase Cloud

## Overview

This guide explains the migration process for users who have existing theories stored in localStorage. The migration moves your data from browser-based storage to Firebase cloud storage, enabling:

- **Cross-device access** - Access your theories from any device
- **Data persistence** - Never lose your theories again
- **Image hosting** - Upload and host images in the cloud
- **Real-time sync** - See updates instantly
- **Public sharing** - Share your theories with the world

**Migration is automatic, safe, and preserves all your existing data.**

---

## Table of Contents

1. [Who Needs to Migrate?](#who-needs-to-migrate)
2. [What Gets Migrated?](#what-gets-migrated)
3. [Migration Process](#migration-process)
4. [What to Expect](#what-to-expect)
5. [After Migration](#after-migration)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Who Needs to Migrate?

### You need to migrate if:

- ✅ You created theories BEFORE the Firebase update
- ✅ You see a "Migrate to Cloud" banner or button
- ✅ You have theories stored in localStorage (visible when logged out)
- ✅ Your theories are only accessible on one device/browser

### You DON'T need to migrate if:

- ❌ You created your account AFTER the Firebase update
- ❌ You've already completed migration
- ❌ You never created any theories
- ❌ You're a new user

**Check if you need migration:**
1. Open the website
2. Look for a migration banner at the top
3. Or check browser console: `localStorage.getItem('userTheories')`
   - If you see data, you need to migrate
   - If `null`, no migration needed

---

## What Gets Migrated?

### User Account

**Old (localStorage):**
```javascript
{
  username: "john_doe",
  email: "john@example.com",
  password: "hashed_password",
  avatar: "dicebear_avatar_url",
  bio: "Mythology enthusiast"
}
```

**New (Firebase):**
```javascript
{
  uid: "google_user_id",
  email: "john@gmail.com",        // From Google account
  displayName: "John Doe",         // From Google account
  photoURL: "google_photo_url",    // From Google profile
  bio: "Mythology enthusiast"      // Preserved from old account
}
```

**Notes:**
- Username is replaced by Google display name
- Password is no longer needed (Google handles authentication)
- Avatar is replaced by Google profile picture
- Bio is preserved if it existed

### Theories

**Old (localStorage):**
```javascript
{
  id: "local_id_123",
  title: "Theory about Zeus",
  summary: "An interesting theory...",
  content: "Full content here...",
  category: "Greek Mythology",
  author: "john_doe",
  votes: 5,
  comments: [...],
  createdAt: "2024-01-15T10:30:00Z"
}
```

**New (Firebase Firestore):**
```javascript
{
  id: "firebase_doc_id",           // New Firebase ID
  title: "Theory about Zeus",      // Preserved
  summary: "An interesting theory...",  // Preserved
  content: "Full content here...", // Preserved
  topic: "Mythologies",            // Mapped from category
  subtopic: "Greek Mythology",     // Mapped from category
  authorId: "google_user_id",      // Your Google UID
  authorName: "John Doe",          // Your Google name
  authorAvatar: "google_photo",    // Your Google photo
  votes: 5,                        // Preserved
  views: 0,                        // Reset (localStorage didn't track)
  commentCount: 2,                 // From comments array
  status: "published",             // All migrated theories are published
  createdAt: Timestamp,            // Preserved (converted to Firebase Timestamp)
  updatedAt: Timestamp             // Set to migration time
}
```

**What's preserved:**
- ✅ Title, summary, content
- ✅ Category (mapped to topic/subtopic)
- ✅ Vote count
- ✅ Comment count
- ✅ Creation date
- ✅ Images (URLs preserved, or re-uploaded if needed)

**What changes:**
- 🔄 Theory ID (new Firebase ID assigned)
- 🔄 Author info (linked to Google account)
- 🔄 Comments (migrated to Firestore subcollection)
- 🔄 Votes (migrated to Firestore subcollection)

### Comments

**Old (localStorage - nested in theory):**
```javascript
theory.comments = [
  {
    author: "jane_doe",
    content: "Great theory!",
    timestamp: "2024-01-16T12:00:00Z"
  }
]
```

**New (Firebase Firestore subcollection):**
```javascript
/theories/{theoryId}/comments/{commentId}
{
  id: "comment_doc_id",
  theoryId: "theory_id",
  content: "Great theory!",
  authorId: "commenter_google_uid",
  authorName: "Jane Doe",
  authorAvatar: "commenter_google_photo",
  createdAt: Timestamp
}
```

**Notes:**
- Comments are moved to their own subcollection
- Comment authors are matched to Google accounts if they've signed in
- Orphaned comments (author never migrated) show as "Anonymous User"

### Votes

**Old (localStorage - nested in theory):**
```javascript
theory.votes = 5  // Just a number
```

**New (Firebase Firestore subcollection):**
```javascript
/theories/{theoryId}/votes/{userId}
{
  userId: "voter_google_uid",
  theoryId: "theory_id",
  direction: 1,  // 1 for upvote, -1 for downvote
  createdAt: Timestamp
}
```

**Notes:**
- Individual votes are tracked (who voted, when, direction)
- Net vote count is calculated from individual votes
- Old vote count is used as starting point

### Images

**Old (localStorage):**
```javascript
// URLs only (external hosting or data URLs)
theory.images = [
  "https://example.com/image1.jpg",
  "data:image/png;base64,..."
]
```

**New (Firebase Storage):**
```javascript
// Uploaded to Firebase Storage
theory.richContent.images = [
  "https://firebasestorage.googleapis.com/.../image1.jpg"
]
```

**Migration options:**

1. **External URLs** (already hosted elsewhere):
   - Preserved as-is
   - No re-upload needed

2. **Data URLs** (embedded in localStorage):
   - Automatically uploaded to Firebase Storage
   - Converted to proper hosted URLs

3. **Broken URLs**:
   - Marked for user review
   - User can re-upload images after migration

---

## Migration Process

### Step 1: Sign In with Google

When you visit the site after the Firebase update:

1. You'll see a banner: **"Migrate your theories to the cloud"**
2. Click **"Migrate Now"** button
3. You'll be prompted to **"Sign in with Google"**
4. Select your Google account
5. Grant permissions to Eyes of Azrael

**Why Google sign-in?**
- Simpler than username/password
- More secure (Google handles authentication)
- Enables cross-device sync
- Profile picture included

**What if I used a different email?**
- Your old email is preserved in your Firebase profile
- You can add it to your Google account or use a different one
- Theories will be linked to your Google account

### Step 2: Automatic Migration

After signing in, migration happens automatically:

**Progress indicator shows:**
```
Migrating your data to the cloud...

✓ User profile created
✓ Migrating theories (1/5)...
✓ Migrating theories (2/5)...
✓ Migrating theories (3/5)...
✓ Migrating theories (4/5)...
✓ Migrating theories (5/5)...
✓ Uploading images...
✓ Migration complete!

5 theories migrated successfully
```

**What happens:**
1. Your Google profile is created in Firebase
2. Each theory is uploaded to Firestore
3. Comments are migrated to subcollections
4. Votes are migrated to subcollections
5. Images are uploaded to Firebase Storage (if needed)
6. localStorage data is backed up (not deleted immediately)

**Time required:**
- 0 theories: Instant
- 1-10 theories: 5-30 seconds
- 10-50 theories: 30-90 seconds
- 50+ theories: 1-5 minutes

### Step 3: Verification

After migration:

1. **Summary screen shows:**
   ```
   ✓ Migration Complete!

   5 theories migrated
   12 comments preserved
   3 images uploaded
   45 votes transferred

   [View My Theories]  [Browse All Theories]
   ```

2. **Verify your data:**
   - Click **"View My Theories"**
   - Check that all theories are listed
   - Open a theory to verify content
   - Check images loaded correctly

3. **If issues found:**
   - Click **"Report Migration Issue"**
   - Or contact support with theory IDs

### Step 4: localStorage Cleanup (Optional)

**Migration keeps your localStorage data for 30 days as a safety backup.**

**Options:**

1. **Keep backup** (recommended for 30 days):
   - localStorage data stays
   - No action needed

2. **Clear backup manually**:
   - Go to Account Settings
   - Click **"Clear localStorage Backup"**
   - Confirm deletion

3. **Automatic cleanup**:
   - After 30 days, automatic prompt: "Delete localStorage backup?"
   - Click **"Yes, delete"** to clear

**Why keep backup?**
- Safety net in case of migration issues
- Can compare old vs new data
- Easy rollback if needed (contact support)

---

## What to Expect

### During Migration

**You CAN:**
- ✅ Watch migration progress
- ✅ Cancel migration (before it completes)
- ✅ Browse the site in read-only mode

**You CANNOT:**
- ❌ Create new theories (wait for migration to finish)
- ❌ Edit existing theories (in migration process)
- ❌ Vote or comment (data is being migrated)
- ❌ Close browser (migration will pause and resume later)

**If you close browser during migration:**
- Progress is saved
- Migration resumes when you return
- No data loss

### After Migration

**You CAN:**
- ✅ Create new theories with cloud storage
- ✅ Upload images directly to Firebase
- ✅ Access theories from any device
- ✅ Edit and delete your theories
- ✅ See real-time updates
- ✅ Vote and comment on theories

**Changes you'll notice:**

1. **Sign in changed:**
   - Old: Username + password
   - New: Google sign-in button

2. **Profile:**
   - Old: Custom username
   - New: Google display name and photo

3. **Images:**
   - Old: URL input only
   - New: File upload + drag-and-drop

4. **Sync:**
   - Old: Only on one device
   - New: Available everywhere

5. **Speed:**
   - Initial load may be slightly slower (cloud fetch)
   - Subsequent loads faster (caching)

### Compatibility

**Browser compatibility:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (not supported)

**Device compatibility:**
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Mobile (iOS, Android)
- ✅ Tablet
- ✅ Multiple devices simultaneously

---

## After Migration

### Verify Your Data

**Checklist:**

- [ ] All theories visible in "My Theories"
- [ ] Theory content intact (title, summary, content)
- [ ] Images display correctly
- [ ] Comments preserved
- [ ] Vote counts accurate
- [ ] Creation dates correct

**If something's wrong:**
1. Check the specific theory
2. Note the theory ID (in URL or console)
3. Take screenshots
4. Contact support: support@eyesofazrael.com

### Access from Other Devices

**To access on another device:**

1. Open Eyes of Azrael on new device
2. Click **"Sign in with Google"**
3. Use the SAME Google account
4. Your theories appear automatically

**No migration needed on other devices!**

### Update Your Workflow

**Old workflow (localStorage):**
```
1. Open site
2. Create theory
3. Save (localStorage)
4. Only accessible on this browser
```

**New workflow (Firebase):**
```
1. Sign in with Google (once)
2. Create theory
3. Upload images (drag and drop)
4. Submit (auto-saves to cloud)
5. Access from any device
```

**New features available:**

- **Image uploads:** Drag and drop images directly
- **Rich content:** Panels, links, corpus searches
- **Real-time updates:** See new comments instantly
- **Public sharing:** Share theory URL with anyone
- **Edit anytime:** Edit from any device
- **Delete anytime:** Remove theories you no longer want

---

## Troubleshooting

### Migration Failed

**Error: "Migration failed. Please try again."**

**Causes:**
- No internet connection
- Firebase quota exceeded
- Browser blocked third-party cookies

**Solutions:**

1. **Check internet connection:**
   - Ensure stable connection
   - Try refreshing page

2. **Enable third-party cookies:**
   - Chrome: Settings → Privacy → Cookies → Allow all cookies
   - Firefox: Settings → Privacy → Custom → Cookies → Accept cookies

3. **Try again:**
   - Click **"Retry Migration"**
   - Or sign out and sign in again

4. **Contact support** if problem persists

### Some Theories Missing

**Error: "5 theories migrated, but I had 8"**

**Causes:**
- Theories stored in different browser profile
- localStorage data corrupted
- Browser cache cleared before migration

**Solutions:**

1. **Check original browser/profile:**
   - Open original browser where you created theories
   - Check if theories are still in localStorage
   - Run migration again from that browser

2. **Check browser console:**
   ```javascript
   // In original browser
   localStorage.getItem('userTheories')
   ```
   - If data exists, migration didn't run
   - If `null`, data was cleared

3. **Contact support** with:
   - Number of theories expected
   - Browser and device used
   - Approximate creation dates

### Images Not Displaying

**Error: "Theory migrated but images are broken"**

**Causes:**
- Original image URLs are broken
- Data URLs too large to migrate
- Upload failed

**Solutions:**

1. **Re-upload images:**
   - Go to theory
   - Click **"Edit"**
   - Remove broken image links
   - Upload images using file picker
   - Save theory

2. **Use external hosting:**
   - Upload images to Imgur, Cloudinary, etc.
   - Copy public URL
   - Add to theory

3. **Check image size:**
   - Firebase Storage limit: 5MB per image
   - Compress large images before upload

### Vote/Comment Counts Wrong

**Error: "My theory had 10 votes, now shows 5"**

**Causes:**
- Votes from users who haven't migrated yet
- localStorage data inconsistency
- Migration script error

**Solutions:**

1. **Wait for other users to migrate:**
   - Votes from non-migrated users may not transfer
   - As users migrate, their votes will appear

2. **Check individual votes:**
   - In Firebase Console → Firestore
   - Navigate to `/theories/{theoryId}/votes`
   - Count documents

3. **Contact support** if count is significantly off

### Can't Sign In with Google

**Error: "Google sign-in popup blocked" or "Sign-in failed"**

**Causes:**
- Browser blocked popup
- Third-party cookies disabled
- Firewall blocking Google

**Solutions:**

1. **Allow popups:**
   - Look for popup blocker icon in address bar
   - Click and allow popups for this site

2. **Enable third-party cookies:**
   - Required for Google OAuth
   - Chrome: Settings → Privacy → Cookies → Allow all

3. **Try redirect method:**
   - Instead of popup, redirects to Google
   - Contact support to enable

4. **Check firewall:**
   - Ensure Google domains not blocked
   - Try different network

### localStorage Backup Missing

**Error: "Want to verify migration but localStorage was cleared"**

**Causes:**
- Browser cache/data cleared manually
- Incognito/private mode (doesn't persist data)
- 30-day auto-cleanup passed

**Solutions:**

1. **Check if migration was successful:**
   - Sign in to Firebase account
   - View "My Theories"
   - If theories are there, migration worked

2. **Restore from different device:**
   - If you used multiple devices
   - Check other browsers/computers
   - Run migration from device that still has data

3. **Accept migration as final:**
   - If theories are in Firebase, you're good
   - localStorage backup no longer needed

---

## FAQ

### Do I have to migrate?

**No, but highly recommended.**

Without migration:
- ❌ Theories only on one device
- ❌ Data lost if browser cache cleared
- ❌ Can't upload images
- ❌ Can't access new features
- ❌ Can't share theories publicly

With migration:
- ✅ Access from anywhere
- ✅ Data safe in cloud
- ✅ Image uploads
- ✅ Real-time updates
- ✅ Public sharing

### Will my username change?

**Yes, to your Google display name.**

- Old: Custom username (e.g., "mythology_fan_42")
- New: Google name (e.g., "John Doe")

You can change your Google display name:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Personal info → Name
3. Edit name
4. Change reflects in Eyes of Azrael

### What if I don't have a Google account?

**You'll need to create one (free).**

1. Go to [accounts.google.com/signup](https://accounts.google.com/signup)
2. Create account with any email
3. Or use existing Gmail
4. Then sign in to Eyes of Azrael

### Can I migrate without Google?

**Not currently.**

Firebase Authentication requires a provider:
- Google (current)
- Facebook (could add)
- Email/password (could add)

Contact support if you absolutely cannot use Google sign-in.

### Will migration delete my localStorage data?

**No, it's kept for 30 days as backup.**

- Migration creates a backup
- Original data stays in localStorage
- After 30 days, you're prompted to delete
- You can manually delete anytime

### What if I used multiple browsers?

**Migrate from each browser separately.**

Example:
- Chrome: 5 theories → Migrate
- Firefox: 3 theories → Migrate
- Result: 8 theories total in Firebase

Use the SAME Google account for all migrations.

### Can I undo migration?

**Not easily, but possible with support help.**

If you absolutely need to revert:
1. Contact support within 30 days
2. Provide localStorage backup
3. We can roll back your account

**But:** You'll lose cloud benefits.

### Will migration affect other users' data?

**No, each user migrates independently.**

- Your migration only affects your account
- Other users' theories unaffected
- Votes/comments from other users preserved

### How long until I can delete localStorage?

**Recommended: 30 days.**

This gives you time to:
- Verify all data migrated
- Check images working
- Ensure vote/comment counts correct
- Test on multiple devices

After 30 days, safe to delete.

### What happens to my old password?

**It's no longer needed.**

- Firebase uses Google authentication
- No password stored in Eyes of Azrael
- Google handles password security
- More secure than custom passwords

### Can I still use the old localStorage version?

**No, it's deprecated.**

- New features require Firebase
- localStorage version no longer maintained
- Security risks with localStorage approach
- Migration is one-way

---

## Migration Support

### Need Help?

**Contact support:**
- Email: support@eyesofazrael.com
- Subject: "Migration Issue - [Your Google email]"
- Include:
  - Description of problem
  - Screenshots
  - Theory IDs (if applicable)
  - Browser and device info

**Response time:** 24-48 hours

### Reporting Bugs

**Found a migration bug?**

1. Check [Known Issues](#known-issues) below
2. If not listed, report:
   - Bug description
   - Steps to reproduce
   - Expected vs actual result
   - Browser console errors

### Known Issues

**Current known issues:**

1. **Large image data URLs may fail to upload**
   - Workaround: Re-upload images after migration
   - Fix: In progress

2. **Vote counts may be off by 1-2**
   - Cause: Rounding in migration script
   - Impact: Minimal
   - Fix: Planned

3. **Comment timestamps may shift by timezone**
   - Cause: localStorage used local time, Firebase uses UTC
   - Impact: Display only
   - Fix: Planned

---

## Summary

**Migration is:**
- ✅ Automatic
- ✅ Safe
- ✅ Preserves all data
- ✅ Keeps localStorage backup
- ✅ Enables cloud features
- ✅ Reversible (with support help)

**After migration:**
- ✅ Access from any device
- ✅ Never lose data
- ✅ Upload images
- ✅ Real-time sync
- ✅ Public sharing
- ✅ Better security

**Next steps:**
1. Sign in with Google
2. Run migration
3. Verify data
4. Enjoy cloud features!

---

**Welcome to the cloud!** Your theories are now safe, accessible, and ready to share with the world.

For more information:
- `FIREBASE_SETUP_GUIDE.md` - Firebase setup
- `API_REFERENCE.md` - Developer API docs
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `MONITORING_GUIDE.md` - Usage monitoring

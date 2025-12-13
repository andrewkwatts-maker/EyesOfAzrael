# Editable Panel System - Admin Guide

**Eyes of Azrael - Administrator & Moderator Documentation**

## Overview

This guide covers administrative tasks for managing the Editable Panel System, including:
- Moderating user submissions
- Managing content ownership
- Firestore security rules
- Troubleshooting issues
- Performance monitoring

---

## Quick Start

### Accessing Firebase Console

1. **Navigate to Firebase Console**
   - URL: https://console.firebase.google.com/
   - Select your Eyes of Azrael project

2. **Open Firestore Database**
   - Left sidebar → Build → Firestore Database
   - Navigate to `submissions` collection

3. **Filter pending submissions**
   - Use Firestore query builder
   - Filter: `status == 'pending'`

---

## Moderating Submissions

### Approval Workflow

#### Step 1: Review Submission

```javascript
// Example submission document
{
  id: "ABC123",
  title: "Additional Zeus Information",
  content: "Zeus was also known as the protector of guests...",
  sources: "Homer, Iliad Book 13",
  parentCollection: "deities",
  parentDocumentId: "greek_zeus",
  contentType: "deity",
  submittedBy: "user-uid-12345",
  submittedByEmail: "user@example.com",
  submittedAt: Timestamp(2025-12-13),
  status: "pending"
}
```

**Review Checklist:**
- [ ] Content is accurate and well-sourced
- [ ] No spam, profanity, or inappropriate content
- [ ] Relates to the parent document
- [ ] Sources are credible (if provided)
- [ ] Grammar and spelling are acceptable
- [ ] No duplicate information

#### Step 2: Approve Submission

**Firebase Console Method:**
1. Click the submission document
2. Click "Edit Document"
3. Change `status` field from `"pending"` to `"approved"`
4. Click "Update"

**Firestore REST API Method:**
```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');
const db = admin.firestore();

await db.collection('submissions').doc('ABC123').update({
  status: 'approved',
  approvedAt: admin.firestore.FieldValue.serverTimestamp(),
  approvedBy: 'admin-uid'
});
```

#### Step 3: Reject Submission

**Option 1: Delete Document**
- Permanent removal
- No record kept

**Option 2: Set Status to Rejected**
```javascript
await db.collection('submissions').doc('ABC123').update({
  status: 'rejected',
  rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
  rejectedBy: 'admin-uid',
  rejectionReason: 'Lacks credible sources'
});
```

**Option 3: Archive**
```javascript
// Move to archive collection
const doc = await db.collection('submissions').doc('ABC123').get();
await db.collection('submissions_archive').doc('ABC123').set(doc.data());
await db.collection('submissions').doc('ABC123').delete();
```

---

## Bulk Operations

### Approve Multiple Submissions

```javascript
// Firestore batch operations
const batch = db.batch();

const submissionsToApprove = [
  'ABC123',
  'DEF456',
  'GHI789'
];

submissionsToApprove.forEach(id => {
  const ref = db.collection('submissions').doc(id);
  batch.update(ref, {
    status: 'approved',
    approvedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

await batch.commit();
```

### Delete All Spam Submissions

```javascript
// Query and delete
const spamQuery = db.collection('submissions')
  .where('submittedByEmail', '==', 'spammer@example.com');

const snapshot = await spamQuery.get();
const batch = db.batch();

snapshot.docs.forEach(doc => {
  batch.delete(doc.ref);
});

await batch.commit();
```

---

## Content Management

### Making Content User-Editable

To allow a user to edit a deity/hero/creature:

1. **Add `createdBy` field** to the document
```javascript
await db.collection('deities').doc('greek_zeus').update({
  createdBy: 'user-uid-here',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

2. **User will now see edit icon (✎)** on that card

### Transferring Content Ownership

```javascript
// Transfer Zeus from old owner to new owner
await db.collection('deities').doc('greek_zeus').update({
  createdBy: 'new-user-uid',
  transferredAt: admin.firestore.FieldValue.serverTimestamp(),
  transferredBy: 'admin-uid',
  previousOwner: 'old-user-uid'
});
```

### Removing User Edit Access

```javascript
// Remove createdBy field to prevent editing
await db.collection('deities').doc('greek_zeus').update({
  createdBy: admin.firestore.FieldValue.delete()
});
```

---

## User Management

### Ban User from Submitting

Update security rules to check banned users:

```javascript
// In firestore.rules
function isNotBanned() {
  return !exists(/databases/$(database)/documents/banned_users/$(request.auth.uid));
}

match /submissions/{submissionId} {
  allow create: if request.auth != null &&
                   isNotBanned() &&
                   request.resource.data.submittedBy == request.auth.uid;
}
```

Then ban a user:
```javascript
await db.collection('banned_users').doc('user-uid-to-ban').set({
  bannedAt: admin.firestore.FieldValue.serverTimestamp(),
  bannedBy: 'admin-uid',
  reason: 'Repeated spam submissions',
  email: 'user@example.com'
});
```

### Unban User

```javascript
await db.collection('banned_users').doc('user-uid').delete();
```

### View User's Submissions

```javascript
const userSubmissions = await db.collection('submissions')
  .where('submittedBy', '==', 'user-uid')
  .orderBy('submittedAt', 'desc')
  .get();

userSubmissions.forEach(doc => {
  console.log(doc.id, doc.data());
});
```

---

## Firestore Security Rules

### Current Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Submissions collection
    match /submissions/{submissionId} {
      // Public read for approved submissions
      allow read: if resource.data.status == 'approved';

      // Users can read their own submissions (any status)
      allow read: if request.auth != null &&
                     resource.data.submittedBy == request.auth.uid;

      // Users can create new submissions
      allow create: if request.auth != null &&
                       request.resource.data.submittedBy == request.auth.uid &&
                       request.resource.data.status == 'pending';

      // Users can update their own submissions
      allow update: if request.auth != null &&
                       resource.data.submittedBy == request.auth.uid;

      // Admins can do anything
      allow read, write: if isAdmin();
    }

    // Content collections (deities, heroes, etc.)
    match /{collection}/{document} {
      // Public read
      allow read: if true;

      // Users can edit their own content
      allow write: if request.auth != null &&
                      resource.data.createdBy == request.auth.uid;

      // Admins can do anything
      allow write: if isAdmin();
    }

    // Admins collection (protected)
    match /admins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only via Firebase Admin SDK
    }

    // Banned users collection
    match /banned_users/{userId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

### Adding Admin Users

Admins are managed via a Firestore collection:

```javascript
// Add admin via Firebase Admin SDK or Console
await db.collection('admins').doc('user-uid').set({
  email: 'admin@example.com',
  role: 'moderator', // 'admin' | 'moderator' | 'super_admin'
  grantedAt: admin.firestore.FieldValue.serverTimestamp(),
  grantedBy: 'super-admin-uid'
});
```

### Testing Security Rules

Use Firebase Emulator Suite:

```bash
# Install emulators
firebase init emulators

# Start Firestore emulator
firebase emulators:start --only firestore

# Run tests
firebase emulators:exec "npm test"
```

---

## Monitoring & Analytics

### Submission Statistics

```javascript
// Count pending submissions
const pendingCount = (await db.collection('submissions')
  .where('status', '==', 'pending')
  .count()
  .get()).data().count;

// Count approved submissions
const approvedCount = (await db.collection('submissions')
  .where('status', '==', 'approved')
  .count()
  .get()).data().count;

console.log(`Pending: ${pendingCount}, Approved: ${approvedCount}`);
```

### Most Active Submitters

```javascript
// Using Firestore aggregation (requires composite index)
const submitters = {};

const snapshot = await db.collection('submissions')
  .where('status', '==', 'approved')
  .get();

snapshot.forEach(doc => {
  const email = doc.data().submittedByEmail;
  submitters[email] = (submitters[email] || 0) + 1;
});

// Sort by count
const sorted = Object.entries(submitters)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('Top 10 Contributors:', sorted);
```

### Submission Timeline

```javascript
// Get submissions by date
const startDate = new Date('2025-01-01');
const endDate = new Date('2025-12-31');

const snapshot = await db.collection('submissions')
  .where('submittedAt', '>=', startDate)
  .where('submittedAt', '<=', endDate)
  .orderBy('submittedAt', 'desc')
  .get();

console.log(`${snapshot.size} submissions in 2025`);
```

---

## Performance Optimization

### Indexing

Create composite indexes for common queries:

**Firebase Console → Firestore → Indexes**

Recommended indexes:
1. `submissions` collection:
   - `status` (Ascending) + `submittedAt` (Descending)
   - `parentDocumentId` (Ascending) + `status` (Ascending)
   - `submittedBy` (Ascending) + `submittedAt` (Descending)

2. `deities`, `heroes`, etc. collections:
   - `mythology` (Ascending) + `name` (Ascending)
   - `createdBy` (Ascending) + `createdAt` (Descending)

### Caching Strategy

The Editable Panel System uses Firebase's built-in caching:

```javascript
// Enable offline persistence
firebase.firestore().enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open
    } else if (err.code == 'unimplemented') {
      // Browser doesn't support
    }
  });
```

### Rate Limiting

Prevent abuse with Firestore security rules:

```javascript
// Limit submissions per day
function dailySubmissionLimit() {
  let submissions = query(
    /databases/$(database)/documents/submissions,
    {
      filter: {
        submittedBy: request.auth.uid,
        submittedAt: request.time - duration.value(1, 'd')
      }
    }
  );
  return submissions.size < 10; // Max 10 per day
}

match /submissions/{submissionId} {
  allow create: if dailySubmissionLimit() && ...;
}
```

---

## Troubleshooting

### Common Issues

#### 1. Submissions Not Appearing
**Problem**: Approved submissions don't show up on page

**Solutions:**
- Verify `status == 'approved'` in Firestore
- Check browser cache (hard refresh: Ctrl+Shift+R)
- Verify security rules allow read access
- Check browser console for errors

#### 2. Edit Icon Not Showing
**Problem**: User can't edit their own content

**Solutions:**
- Verify `createdBy` field matches user's UID
- Check user is logged in (Firebase Auth)
- Verify EditablePanelSystem is initialized
- Check `canEdit` parameter in `initEditablePanel()`

#### 3. Submission Form Won't Submit
**Problem**: Form submission fails

**Solutions:**
- Check user authentication status
- Verify Firestore security rules allow create
- Check network tab for API errors
- Verify all required fields are filled

#### 4. Performance Issues
**Problem**: Page loads slowly

**Solutions:**
- Add composite indexes for queries
- Enable Firestore offline persistence
- Reduce timeout in initialization (lower 2000ms)
- Lazy load submissions panel

### Debug Mode

Enable verbose logging:

```javascript
// In browser console
localStorage.setItem('editablePanels_debug', 'true');
window.location.reload();
```

View logs:
```javascript
// Check initialization
console.log(window.editableSystem);

// Check cards detected
console.log(document.querySelectorAll('.content-card[data-id]').length);

// Check Firebase connection
console.log(window.firebaseApp);
```

---

## Backup & Recovery

### Exporting Submissions

```bash
# Export submissions collection
firebase firestore:export gs://your-bucket/backups/submissions-$(date +%Y%m%d)

# Export all data
firebase firestore:export gs://your-bucket/backups/full-$(date +%Y%m%d)
```

### Importing Submissions

```bash
# Import from backup
firebase firestore:import gs://your-bucket/backups/submissions-20251213
```

### Manual Backup Script

```javascript
const fs = require('fs');
const admin = require('firebase-admin');

async function backupSubmissions() {
  const snapshot = await admin.firestore()
    .collection('submissions')
    .get();

  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  fs.writeFileSync(
    `backups/submissions-${Date.now()}.json`,
    JSON.stringify(data, null, 2)
  );

  console.log(`Backed up ${data.length} submissions`);
}

backupSubmissions();
```

---

## Advanced Administration

### Creating Admin Dashboard

Sample admin dashboard structure:

```html
<!-- admin-dashboard.html -->
<div id="admin-dashboard">
  <h1>Moderation Dashboard</h1>

  <div class="stats">
    <div class="stat">Pending: <span id="pending-count">0</span></div>
    <div class="stat">Approved Today: <span id="approved-today">0</span></div>
  </div>

  <div id="pending-queue"></div>
</div>

<script>
  // Load pending submissions
  async function loadPendingQueue() {
    const snapshot = await firebase.firestore()
      .collection('submissions')
      .where('status', '==', 'pending')
      .orderBy('submittedAt', 'desc')
      .get();

    const queue = document.getElementById('pending-queue');

    snapshot.forEach(doc => {
      const submission = doc.data();
      const card = createSubmissionCard(doc.id, submission);
      queue.appendChild(card);
    });
  }
</script>
```

### Automated Moderation

Basic spam detection:

```javascript
// Cloud Function for automatic spam detection
exports.checkSubmission = functions.firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // Spam keywords
    const spamKeywords = ['viagra', 'casino', 'free money'];
    const hasSpam = spamKeywords.some(word =>
      data.content.toLowerCase().includes(word)
    );

    if (hasSpam) {
      await snap.ref.update({
        status: 'rejected',
        rejectionReason: 'Automatic spam detection',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
```

---

## Support & Resources

### Documentation Links
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)

### Community
- GitHub Issues: Report bugs
- Discord: Get help from other admins
- Email: Contact development team

---

## Changelog

### v1.0 (2025-12-13)
- Initial release
- Basic submission system
- Manual approval workflow
- Firestore integration
- User authentication

### Planned Features
- Automated admin dashboard
- Email notifications
- Bulk operations UI
- AI-powered moderation
- User reputation system
- Voting on submissions

---

**Last Updated:** 2025-12-13
**Maintained By:** Eyes of Azrael Development Team

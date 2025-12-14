# User Submission Workflow - Technical Documentation

Complete documentation for the Eyes of Azrael user submission and approval system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Flow](#user-flow)
4. [Admin Flow](#admin-flow)
5. [Database Schema](#database-schema)
6. [Security Rules](#security-rules)
7. [API Reference](#api-reference)
8. [UI Components](#ui-components)
9. [Notifications System](#notifications-system)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

The User Submission Workflow allows authenticated users to submit new mythological entities (deities, heroes, creatures, etc.) for admin review and approval. The system includes:

- **User Submission Form**: Create new entity submissions
- **User Dashboard**: Track submission status and notifications
- **Admin Review Queue**: Review, approve, or reject submissions
- **Notification System**: Notify users of submission status changes
- **Duplicate Detection**: Prevent duplicate submissions

### Key Features

✅ Full CRUD operations for submissions
✅ Status tracking (pending → approved/rejected)
✅ Admin approval workflow
✅ User notifications
✅ Duplicate detection
✅ Bulk operations (approve/reject multiple)
✅ Edit & resubmit rejected submissions
✅ Real-time statistics
✅ Firestore security rules enforcement

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface Layer                   │
├──────────────┬──────────────┬──────────────┬────────────┤
│ Submit Form  │  Dashboard   │ Browse Page  │ Admin Queue│
│ submit.html  │dashboard.html│ browse.html  │review-queue│
└──────────────┴──────────────┴──────────────┴────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  JavaScript Layer                        │
├──────────────────────────────────────────────────────────┤
│  submission-workflow.js  (Core submission logic)         │
│  user-theories.js        (Theory submissions)            │
│  auth-guard.js           (Authentication)                │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Firebase Layer                          │
├──────────────┬──────────────┬───────────────────────────┤
│  Firestore   │    Auth      │   Security Rules          │
│  (Database)  │ (Users)      │   (Access Control)        │
└──────────────┴──────────────┴───────────────────────────┘
```

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Auth)
- **Security**: Firestore Security Rules
- **Authentication**: Firebase Auth (Google Sign-In)
- **Hosting**: Firebase Hosting / GitHub Pages

---

## User Flow

### 1. Submit New Entity

```
User                    System                   Database
│                         │                         │
├─(1) Sign In            │                         │
│   with Google          │                         │
│                         │                         │
├─(2) Navigate to        │                         │
│   Submit Form          │                         │
│                         │                         │
├─(3) Fill Entity        │                         │
│   Details              │                         │
│                         │                         │
├─(4) Click Submit ──────▶ Validate Data           │
│                         │                         │
│                         ├─(5) Check Duplicates ─▶│
│                         │                         │
│                         │◀────── Results ─────────┤
│                         │                         │
│                         ├─(6) Create Submission ─▶│
│                         │                         │
│                         ├─(7) Create Notification▶│
│                         │                         │
│◀────── Success ─────────┤                         │
│                         │                         │
├─(8) View Dashboard     │                         │
│   (Pending Status)      │                         │
```

### 2. Track Submission Status

```
User                    System                   Database
│                         │                         │
├─(1) Open Dashboard     │                         │
│                         │                         │
│                         ├─ Load Submissions ─────▶│
│                         │                         │
│                         │◀──── Data ──────────────┤
│                         │                         │
│◀──── Display Status ────┤                         │
│   • Pending             │                         │
│   • Approved            │                         │
│   • Rejected            │                         │
│                         │                         │
├─(2) Check Notifications│                         │
│                         │                         │
│                         ├─ Load Notifications ───▶│
│                         │                         │
│                         │◀──── Notifications ─────┤
│                         │                         │
│◀──── Display Alerts ────┤                         │
```

### 3. Edit & Resubmit (Rejected)

```
User                    System                   Database
│                         │                         │
├─(1) View Rejected      │                         │
│   Submission            │                         │
│                         │                         │
├─(2) Read Feedback      │                         │
│                         │                         │
├─(3) Click Edit &       │                         │
│   Resubmit              │                         │
│                         │                         │
├─(4) Modify Content     │                         │
│                         │                         │
├─(5) Submit Changes ────▶ Validate                │
│                         │                         │
│                         ├─ Update Submission ────▶│
│                         │ (Status: rejected → pending)
│                         │                         │
│                         ├─ Create Notification ──▶│
│                         │                         │
│◀────── Success ─────────┤                         │
```

---

## Admin Flow

### 1. Review Pending Submissions

```
Admin                   System                   Database
│                         │                         │
├─(1) Access Review      │                         │
│   Queue                 │                         │
│                         │                         │
│                         ├─ Verify Admin Role ────▶│
│                         │                         │
│                         │◀──── Authorized ────────┤
│                         │                         │
│                         ├─ Load Pending ─────────▶│
│                         │   Submissions           │
│                         │                         │
│                         │◀──── List ──────────────┤
│                         │                         │
│◀──── Display Queue ─────┤                         │
│   • Filter by type      │                         │
│   • Filter by mythology │                         │
│   • Sort by date        │                         │
```

### 2. Approve Submission

```
Admin                   System                   Database
│                         │                         │
├─(1) Review Submission  │                         │
│                         │                         │
├─(2) Check for          │                         │
│   Duplicates            │                         │
│                         │                         │
├─(3) Click Approve ─────▶ Validate                │
│                         │                         │
│                         ├─ Create Entity in ─────▶│
│                         │   Target Collection     │
│                         │   (deities, heroes, etc)│
│                         │                         │
│                         ├─ Update Submission ────▶│
│                         │   Status: approved      │
│                         │                         │
│                         ├─ Notify Submitter ─────▶│
│                         │                         │
│◀────── Success ─────────┤                         │
```

### 3. Reject Submission

```
Admin                   System                   Database
│                         │                         │
├─(1) Review Submission  │                         │
│                         │                         │
├─(2) Click Reject ──────▶ Show Reason Modal       │
│                         │                         │
│◀──── Prompt ────────────┤                         │
│                         │                         │
├─(3) Enter Reason       │                         │
│                         │                         │
├─(4) Confirm ───────────▶ Validate                │
│                         │                         │
│                         ├─ Update Submission ────▶│
│                         │   Status: rejected      │
│                         │   Add reason            │
│                         │                         │
│                         ├─ Notify Submitter ─────▶│
│                         │                         │
│◀────── Success ─────────┤                         │
```

### 4. Bulk Operations

```
Admin                   System                   Database
│                         │                         │
├─(1) Enable Bulk Mode   │                         │
│                         │                         │
├─(2) Select Multiple    │                         │
│   Submissions           │                         │
│                         │                         │
├─(3) Click Bulk         │                         │
│   Approve/Reject ───────▶ Confirm Action         │
│                         │                         │
│◀──── Confirmation ──────┤                         │
│                         │                         │
├─(4) Confirm ───────────▶ Loop Through IDs        │
│                         │                         │
│                         ├─ For Each: ────────────▶│
│                         │   • Update status       │
│                         │   • Create entity (approve)│
│                         │   • Notify user         │
│                         │                         │
│◀──── Results ───────────┤                         │
│   Success: X            │                         │
│   Failed: Y             │                         │
```

---

## Database Schema

### Submissions Collection

**Path:** `/submissions/{submissionId}`

```typescript
interface Submission {
  // Primary Keys
  id: string;                    // Unique submission ID
  type: EntityType;              // 'deity' | 'hero' | 'creature' | etc.

  // Submission Data
  data: EntityData;              // Full entity data (varies by type)
  entityName: string;            // Name of entity (for display)
  mythology: string | null;      // Mythology category

  // Status
  status: SubmissionStatus;      // 'pending' | 'approved' | 'rejected'

  // Author Info
  submittedBy: string;           // User UID
  submittedByName: string;       // Display name
  submittedByEmail: string;      // Email
  submittedByAvatar: string | null;

  // Timestamps
  submittedAt: Timestamp;
  updatedAt: Timestamp;

  // Review Info
  reviewedBy: string | null;     // Admin UID
  reviewedByName: string | null; // Admin name
  reviewedAt: Timestamp | null;
  reviewNotes: string | null;    // Optional admin notes
  rejectionReason: string | null; // Required for rejections

  // Approved Entity Reference
  approvedEntityId: string | null;
  approvedEntityCollection: string | null;

  // Metadata
  views: number;
  flags: number;                 // User flags for inappropriate content
}

type EntityType =
  | 'deity'
  | 'hero'
  | 'creature'
  | 'place'
  | 'item'
  | 'text'
  | 'concept'
  | 'event';

type SubmissionStatus =
  | 'pending'
  | 'approved'
  | 'rejected';
```

### Notifications Collection

**Path:** `/notifications/{notificationId}`

```typescript
interface Notification {
  id: string;
  userId: string;               // Recipient UID
  type: NotificationType;
  title: string;                // Short title
  message: string;              // Full message
  link: string | null;          // Optional link to related page
  data: object | null;          // Additional data
  read: boolean;
  createdAt: Timestamp;
  readAt: Timestamp | null;
}

type NotificationType =
  | 'submission_created'
  | 'submission_approved'
  | 'submission_rejected';
```

### Entity Collections

After approval, submissions are moved to appropriate collections:

- `/deities/{deityId}` - Gods and goddesses
- `/heroes/{heroId}` - Heroes and mortals
- `/creatures/{creatureId}` - Mythical creatures
- `/places/{placeId}` - Sacred locations
- `/spiritual-items/{itemId}` - Sacred items
- `/texts/{textId}` - Sacred texts
- `/concepts/{conceptId}` - Mythological concepts
- `/events/{eventId}` - Mythological events

All approved entities include:
```typescript
{
  ...entityData,
  contributedBy: string;        // Original submitter UID
  contributorName: string;      // Submitter name
  contributedAt: Timestamp;     // Original submission date
  approvedBy: string;           // Admin who approved
  approvedByName: string;       // Admin name
  approvedAt: Timestamp;        // Approval date
  status: 'approved';
  isUserContributed: true;
}
```

---

## Security Rules

### Submissions Collection Rules

```javascript
match /submissions/{submissionId} {
  // Validation function
  function isValidSubmission() {
    return request.resource.data.keys().hasAll([
      'id', 'type', 'status', 'data', 'submittedBy', 'entityName'
    ])
    && request.resource.data.type in [
      'deity', 'hero', 'creature', 'place',
      'item', 'text', 'concept', 'event'
    ]
    && request.resource.data.status in ['pending', 'approved', 'rejected']
    && request.resource.data.submittedBy == request.auth.uid;
  }

  // Read rules
  allow get: if resource.data.status == 'approved';
  allow read: if isAuthenticated()
              && resource.data.submittedBy == request.auth.uid;
  allow read: if isAdminEmail();

  // Write rules
  allow create: if isAuthenticated()
                && isValidSubmission()
                && request.resource.data.status == 'pending';

  allow update: if (isAuthenticated()
                   && resource.data.submittedBy == request.auth.uid
                   && resource.data.status in ['pending', 'rejected'])
                || isAdminEmail();

  allow delete: if (isAuthenticated()
                   && resource.data.submittedBy == request.auth.uid
                   && resource.data.status in ['pending', 'rejected'])
                || isAdminEmail();
}
```

### Notifications Collection Rules

```javascript
match /notifications/{notificationId} {
  // Users can read their own notifications
  allow read: if isAuthenticated()
              && resource.data.userId == request.auth.uid;

  // Only system/Cloud Functions can create notifications
  allow create: if false;

  // Users can mark as read
  allow update: if isAuthenticated()
                && resource.data.userId == request.auth.uid
                && request.resource.data.keys().hasOnly(['read', 'readAt']);

  // Users can delete their own notifications
  allow delete: if isAuthenticated()
                && resource.data.userId == request.auth.uid;
}
```

---

## API Reference

### SubmissionWorkflow Class

Located in: `js/submission-workflow.js`

#### Methods

**`createSubmission(submissionData, submissionType)`**
```javascript
// Create a new submission
const result = await window.submissionWorkflow.createSubmission({
  name: 'Zeus',
  mythology: 'greek',
  domains: ['sky', 'thunder', 'king of gods'],
  description: '...'
}, 'deity');

// Returns: { success: true, submissionId: string, submission: object }
```

**`getUserSubmissions(options)`**
```javascript
// Get current user's submissions
const submissions = await window.submissionWorkflow.getUserSubmissions({
  status: 'pending',  // optional filter
  type: 'deity',      // optional filter
  limit: 20           // optional limit
});

// Returns: Array<Submission>
```

**`updateSubmission(submissionId, updates)`**
```javascript
// Update a pending/rejected submission
await window.submissionWorkflow.updateSubmission(submissionId, {
  name: 'Updated Name',
  description: 'Updated description'
});

// Returns: { success: true, submissionId: string }
```

**`deleteSubmission(submissionId)`**
```javascript
// Delete a pending/rejected submission
await window.submissionWorkflow.deleteSubmission(submissionId);

// Returns: { success: true }
```

**`getUserStats()`**
```javascript
// Get statistics for current user
const stats = await window.submissionWorkflow.getUserStats();

// Returns: {
//   total: number,
//   pending: number,
//   approved: number,
//   rejected: number,
//   approvalRate: string (percentage)
// }
```

**`getUserNotifications(options)`**
```javascript
// Get user's notifications
const notifications = await window.submissionWorkflow.getUserNotifications({
  unreadOnly: true,  // optional
  limit: 10          // optional
});

// Returns: Array<Notification>
```

**`markNotificationAsRead(notificationId)`**
```javascript
// Mark a notification as read
await window.submissionWorkflow.markNotificationAsRead(notificationId);
```

**`markAllNotificationsAsRead()`**
```javascript
// Mark all notifications as read
await window.submissionWorkflow.markAllNotificationsAsRead();
```

#### Admin Methods

**`getPendingSubmissions(options)`**
```javascript
// Get pending submissions (admin only)
const result = await window.submissionWorkflow.getPendingSubmissions({
  status: 'pending',      // optional
  type: 'deity',          // optional
  mythology: 'greek',     // optional
  sortOrder: 'desc',      // 'asc' or 'desc'
  limit: 50,
  startAfter: lastDoc     // for pagination
});

// Returns: {
//   submissions: Array<Submission>,
//   lastDoc: DocumentSnapshot,
//   hasMore: boolean
// }
```

**`approveSubmission(submissionId, options)`**
```javascript
// Approve a submission (admin only)
const result = await window.submissionWorkflow.approveSubmission(submissionId, {
  modifications: {      // optional edits before approval
    description: 'Admin-edited description'
  },
  notes: 'Approved with minor edits',  // optional
  entityId: 'custom-id'                 // optional custom ID
});

// Returns: {
//   success: true,
//   entityId: string,
//   entityCollection: string
// }
```

**`rejectSubmission(submissionId, reason)`**
```javascript
// Reject a submission (admin only)
await window.submissionWorkflow.rejectSubmission(
  submissionId,
  'Please add more detail to the description and provide citations.'
);

// Returns: { success: true }
```

**`bulkApprove(submissionIds)`**
```javascript
// Approve multiple submissions (admin only)
const results = await window.submissionWorkflow.bulkApprove([
  'sub_123', 'sub_456', 'sub_789'
]);

// Returns: {
//   success: Array<string>,  // IDs of successful approvals
//   failed: Array<{id: string, error: string}>
// }
```

**`bulkReject(submissionIds, reason)`**
```javascript
// Reject multiple submissions (admin only)
const results = await window.submissionWorkflow.bulkReject(
  ['sub_123', 'sub_456'],
  'Insufficient detail and missing citations.'
);

// Returns: {
//   success: Array<string>,
//   failed: Array<{id: string, error: string}>
// }
```

**`checkDuplicates(entityName, mythology, type)`**
```javascript
// Check for duplicate entities
const duplicates = await window.submissionWorkflow.checkDuplicates(
  'Zeus',
  'greek',
  'deity'
);

// Returns: Array<{
//   type: 'existing' | 'pending',
//   id: string,
//   data: object
// }>
```

---

## UI Components

### Files Structure

```
├── submit.html              # User submission form
├── dashboard.html           # User dashboard
├── admin/
│   └── review-queue.html    # Admin review interface
├── js/
│   ├── submission-workflow.js    # Core workflow logic
│   ├── user-theories.js         # Theory submissions
│   └── auth-guard.js            # Authentication
├── css/
│   └── submission-workflow.css  # Submission styles
└── SUBMISSION_GUIDELINES.md     # User guidelines
```

### Submit Form (submit.html)

**Features:**
- Dynamic form based on entity type
- Field validation
- Duplicate checking
- Autosave (optional)
- Rich text editing
- Image upload support

**Usage:**
```html
<a href="theories/user-submissions/submit.html">Submit Entity</a>
```

### Dashboard (dashboard.html)

**Sections:**
- User statistics (total, pending, approved, rejected, approval rate)
- Notifications feed
- Submissions list with tabs (All, Pending, Approved, Rejected)
- Quick actions (edit, delete, view)

**Usage:**
```html
<a href="dashboard.html">My Dashboard</a>
```

### Admin Review Queue (admin/review-queue.html)

**Features:**
- Filter by status, type, mythology
- Sort by date
- Bulk selection
- Approve/reject actions
- Duplicate detection
- Statistics dashboard

**Access:**
```html
<!-- Only accessible to admin users -->
<a href="admin/review-queue.html">Review Queue</a>
```

---

## Notifications System

### Notification Types

1. **submission_created**
   - Triggered when: User creates a submission
   - Recipient: Submitter
   - Message: "Your {type} submission "{name}" has been submitted for review."

2. **submission_approved**
   - Triggered when: Admin approves submission
   - Recipient: Submitter
   - Message: "Your {type} submission "{name}" has been approved and published."
   - Link: Published entity page

3. **submission_rejected**
   - Triggered when: Admin rejects submission
   - Recipient: Submitter
   - Message: "Your {type} submission "{name}" needs revision. Reason: {reason}"
   - Link: Dashboard with submission highlighted

### Creating Notifications

Notifications are created automatically by the workflow, but can also be created manually:

```javascript
await window.submissionWorkflow.createNotification({
  userId: 'user-uid',
  type: 'submission_approved',
  title: 'Submission Approved!',
  message: 'Your deity submission "Zeus" has been approved.',
  link: '/deities/zeus.html',
  data: { submissionId: 'sub_123', entityId: 'zeus' }
});
```

### Email Notifications (Optional)

To enable email notifications, you'll need to set up Cloud Functions:

1. Create a Cloud Function that triggers on notification creation
2. Use a service like SendGrid or Firebase Email Extension
3. Send templated emails based on notification type

**Example Cloud Function:**
```javascript
exports.sendNotificationEmail = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(notification.userId)
      .get();

    const email = userDoc.data().email;

    // Send email using your preferred service
    await sendEmail({
      to: email,
      subject: notification.title,
      body: notification.message
    });
  });
```

---

## Deployment

### Prerequisites

- Firebase project configured
- Firebase CLI installed
- Admin user account created

### Steps

1. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Files to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

   Or for GitHub Pages:
   ```bash
   git add .
   git commit -m "Add submission workflow"
   git push origin main
   ```

3. **Create Admin User**
   ```javascript
   // In Firebase Console or via script
   await firebase.firestore().collection('users').doc(adminUid).set({
     email: 'admin@example.com',
     role: 'admin',
     displayName: 'Admin User'
   });
   ```

4. **Test the System**
   - Create a test submission as a regular user
   - Approve/reject from admin panel
   - Verify notifications work
   - Check entity appears in target collection

---

## Testing

### Manual Testing Checklist

#### User Flow
- [ ] User can sign in with Google
- [ ] User can access submission form
- [ ] User can fill and submit entity data
- [ ] Duplicate detection works
- [ ] Submission appears in user dashboard
- [ ] Submission status is "pending"
- [ ] User receives notification

#### Admin Flow
- [ ] Admin can access review queue
- [ ] Filter/sort functions work
- [ ] Admin can view submission details
- [ ] Admin can approve submission
- [ ] Entity appears in target collection
- [ ] User receives approval notification
- [ ] Admin can reject with reason
- [ ] User receives rejection notification with reason
- [ ] Bulk operations work

#### Edit & Resubmit
- [ ] User can edit rejected submission
- [ ] Status changes from rejected to pending
- [ ] Updated submission appears in admin queue

#### Notifications
- [ ] Notifications appear on dashboard
- [ ] Unread notifications are highlighted
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Notification links work

### Automated Testing

Create tests using Jest or similar:

```javascript
describe('SubmissionWorkflow', () => {
  test('creates submission', async () => {
    const result = await submissionWorkflow.createSubmission({
      name: 'Test Deity',
      mythology: 'test'
    }, 'deity');

    expect(result.success).toBe(true);
    expect(result.submissionId).toBeDefined();
  });

  test('prevents non-admin approval', async () => {
    await expect(
      submissionWorkflow.approveSubmission('sub_123')
    ).rejects.toThrow('Admin access required');
  });
});
```

---

## Troubleshooting

### Common Issues

#### Submission Creation Fails

**Error:** "User must be authenticated"
**Solution:** Ensure user is signed in with Firebase Auth

**Error:** "Validation failed"
**Solution:** Check that all required fields are filled and match the schema

**Error:** "Permission denied"
**Solution:** Verify Firestore security rules are deployed correctly

#### Admin Cannot Access Review Queue

**Error:** "Admin access required"
**Solution:** Verify user document has `role: 'admin'` in Firestore

#### Notifications Not Appearing

**Issue:** User doesn't receive notifications
**Solutions:**
1. Check that notifications are being created in Firestore
2. Verify notification query in dashboard.html
3. Check user UID matches notification.userId

#### Approved Entity Not Appearing

**Issue:** Approved submission doesn't show in target collection
**Solutions:**
1. Check admin approval completed successfully
2. Verify target collection name is correct
3. Check Firestore security rules allow write to target collection
4. Verify admin has write permissions

### Debug Mode

Enable debug logging:

```javascript
// In submission-workflow.js
const DEBUG = true;

if (DEBUG) {
  console.log('Submission data:', submissionData);
  console.log('User:', currentUser);
  console.log('Result:', result);
}
```

### Support

For additional help:
- Check browser console for errors
- Review Firestore rules errors in Firebase Console
- Test with Firebase Emulator Suite
- Contact development team

---

## Future Enhancements

Potential improvements:

1. **Email Notifications**: Implement Cloud Functions for email alerts
2. **Collaborative Editing**: Allow multiple users to contribute to one submission
3. **Version History**: Track changes to submissions over time
4. **Advanced Search**: Full-text search in admin queue
5. **Analytics**: Track submission metrics and user engagement
6. **Automated Moderation**: AI-assisted content review
7. **Translation Support**: Multi-language submissions
8. **API Access**: RESTful API for third-party integrations
9. **Mobile App**: Native mobile submission interface
10. **Reputation System**: User reputation based on approval rate

---

## Changelog

### v1.0.0 (Current)
- Initial release
- User submission form
- Admin review queue
- User dashboard
- Notifications system
- Firestore security rules
- Duplicate detection
- Bulk operations

---

## License

This submission workflow is part of the Eyes of Azrael project. All rights reserved.

---

## Credits

Developed by: Andrew Watts
Contributors: Claude (AI Assistant)
Documentation: 2024

---

**Last Updated:** December 2024

# User Workflow Testing Guide
## Step-by-Step Manual Testing Instructions

This guide provides detailed instructions for manually testing the Eyes of Azrael user contribution workflow.

---

## Prerequisites

1. **Firebase Project Access**
   - Project ID from `firebase-config.js`
   - Firestore database enabled
   - Authentication enabled (Google provider)

2. **Test Accounts**
   - Regular user account (any Google account)
   - Admin account (requires `role: 'admin'` in `users` collection)

3. **Local Setup**
   - Local web server running (e.g., `python -m http.server` or `npx serve`)
   - Browser with DevTools open
   - Firebase emulators (optional, for testing without production data)

---

## Test Suite 1: Upload Workflow

### Test 1.1: Create Entity via Standard Editor

**Steps:**
1. Navigate to `http://localhost:8000/edit.html?type=deity`
2. Sign in with Google account
3. Fill in the form:
   ```
   Name: Test Deity - Morpheus
   Icon: 😴
   Primary Mythology: greek
   Short Description: Greek god of dreams
   Long Description: Morpheus is the god of dreams...
   ```
4. Click Save

**Expected Results:**
- ✅ Form saves without errors
- ✅ Firestore `submissions` collection has new document
- ✅ Document has `status: 'pending'`
- ✅ Notification created in `notifications` collection
- ✅ User sees confirmation (check console if no UI feedback)

**Verify in Firestore Console:**
```
Collection: submissions
Document ID: sub_[timestamp]_[random]
Fields:
  - type: "deity"
  - status: "pending"
  - submittedBy: [your-uid]
  - entityName: "Test Deity - Morpheus"
  - data: { ... entity data ... }
```

---

### Test 1.2: Create Entity via Wizard

⚠️ **WARNING:** This test currently fails due to BUG-001

**Steps:**
1. Navigate to `http://localhost:8000/create-wizard.html`
2. Sign in
3. Step 1: Select "Deity"
4. Step 2: Enter name, icon, mythology
5. Step 3: Enter descriptions
6. Step 4: Skip type-specific fields
7. Step 5: Skip metadata
8. Step 6: Review and click "Submit for Review"

**Current Behavior (INCORRECT):**
- 🔴 Saves directly to `deities` collection
- 🔴 Bypasses admin approval queue
- 🔴 No notification created

**Expected Behavior (AFTER FIX):**
- ✅ Should save to `submissions` collection
- ✅ Should create notification
- ✅ Should redirect to dashboard

**Fix Required:** See BUG-001 in test report

---

### Test 1.3-1.11: All Entity Types

Repeat Test 1.1 for each entity type:

| Test | Type | URL | Sample Name |
|------|------|-----|-------------|
| 1.3 | Deity | `/edit.html?type=deity` | "Test Deity - Apollo" |
| 1.4 | Hero | `/edit.html?type=hero` | "Test Hero - Hercules" |
| 1.5 | Creature | `/edit.html?type=creature` | "Test Creature - Phoenix" |
| 1.6 | Item | `/edit.html?type=item` | "Test Item - Excalibur" |
| 1.7 | Place | `/edit.html?type=place` | "Test Place - Olympus" |
| 1.8 | Concept | `/edit.html?type=concept` | "Test Concept - Karma" |
| 1.9 | Magic | `/edit.html?type=magic` | "Test Magic - Alchemy" |
| 1.10 | Theory | `/edit.html?type=theory` | "Test Theory - Flood Myths" |
| 1.11 | Mythology | `/edit.html?type=mythology` | "Test Mythology - Celtic" |

**Verify:** Each creates submission in correct format

---

## Test Suite 2: Edit Workflow

### Test 2.1: Edit Own Pending Submission

**Setup:**
1. Create a submission using Test 1.1
2. Note the submission ID

**Steps:**
1. Navigate to `http://localhost:8000/dashboard.html`
2. Find your pending submission
3. Click "Edit" or navigate to `/edit.html?id=[submission-id]`
4. Modify the description
5. Click Save

**Expected Results:**
- ✅ Changes saved successfully
- ✅ `updatedAt` timestamp updated
- ✅ Status remains `pending`
- ✅ No new notification created

**Verify in Firestore:**
```
Collection: submissions
Document: [submission-id]
  - data.longDescription: [updated text]
  - updatedAt: [new timestamp]
  - status: "pending" (unchanged)
```

---

### Test 2.2: Edit Rejected Submission (Resubmit)

**Setup:**
1. Have admin reject a submission (see Test 3.3)
2. Note the rejection reason

**Steps:**
1. Go to dashboard
2. View rejected submission (should show feedback)
3. Click "Edit & Resubmit"
4. Make requested changes
5. Save

**Expected Results:**
- ✅ Status changes from `rejected` to `pending`
- ✅ `rejectionReason` field cleared
- ✅ Changes saved
- ✅ Ready for re-review

**Verify in Firestore:**
```
Collection: submissions
Document: [submission-id]
  - status: "pending" (was "rejected")
  - rejectionReason: null (was "feedback text")
  - updatedAt: [new timestamp]
```

---

### Test 2.3: Cannot Edit Approved Submission

**Setup:**
1. Have admin approve a submission

**Steps:**
1. Try to navigate to `/edit.html?id=[approved-submission-id]`
2. Or try to call `updateSubmission()` in console

**Expected Results:**
- ✅ Error thrown: "Cannot update approved or processing submissions"
- ✅ Edit blocked
- ✅ No changes saved

**Console Test:**
```javascript
const submissionId = 'sub_[approved-id]';
try {
    await window.submissionWorkflow.updateSubmission(submissionId, {
        data: { name: 'Hacked' }
    });
    console.error('BUG: Should have thrown error');
} catch (error) {
    console.log('✅ Correctly blocked:', error.message);
}
```

---

### Test 2.4: Cannot Edit Other Users' Submissions

**Setup:**
1. Create submission with User A
2. Sign in as User B

**Steps:**
1. Try to edit User A's submission
2. Navigate to `/edit.html?id=[user-a-submission]`

**Expected Results:**
- ✅ Error thrown: "You can only update your own submissions"
- ✅ Access denied

**Console Test:**
```javascript
const otherUserSubmissionId = 'sub_[other-user-id]';
try {
    await window.submissionWorkflow.updateSubmission(otherUserSubmissionId, {
        data: { name: 'Hacked' }
    });
    console.error('SECURITY BUG: Should have thrown error');
} catch (error) {
    console.log('✅ Correctly blocked:', error.message);
}
```

---

## Test Suite 3: Admin Approval Workflow

### Test 3.1: Admin View Queue

**Setup:**
1. Sign in with admin account
2. Ensure `users/[admin-uid]` has `role: 'admin'`

**Steps:**
1. Open browser console
2. Run:
```javascript
const queue = await window.submissionWorkflow.getPendingSubmissions({
    status: 'pending',
    limit: 20
});
console.table(queue.submissions);
```

**Expected Results:**
- ✅ Returns array of pending submissions
- ✅ Each has `status: 'pending'`
- ✅ Includes submission metadata (author, date, etc.)
- ✅ Respects limit parameter

**Non-Admin Test:**
```javascript
// Should fail if not admin
try {
    const queue = await window.submissionWorkflow.getPendingSubmissions();
    console.error('BUG: Non-admin accessed queue');
} catch (error) {
    console.log('✅ Correctly blocked non-admin:', error.message);
}
```

---

### Test 3.2: Approve Submission

**Setup:**
1. Sign in as admin
2. Have pending submission ready

**Steps:**
1. In console, run:
```javascript
const submissionId = 'sub_[pending-id]';
const result = await window.submissionWorkflow.approveSubmission(submissionId, {
    notes: 'Great submission, approved!'
});
console.log('Approved:', result);
```

**Expected Results:**
- ✅ Returns `{ success: true, entityId, entityCollection }`
- ✅ Entity created in main collection (e.g., `deities/[entity-id]`)
- ✅ Submission status updated to `approved`
- ✅ Notification sent to original submitter
- ✅ `approvedEntityId` and `approvedEntityCollection` recorded

**Verify in Firestore:**
```
Collection: [entityCollection] (e.g., deities)
Document: [entityId]
  - All entity data present
  - contributedBy: [original-submitter-uid]
  - approvedBy: [admin-uid]
  - approvedAt: [timestamp]

Collection: submissions
Document: [submissionId]
  - status: "approved"
  - reviewedBy: [admin-uid]
  - approvedEntityId: [entityId]

Collection: notifications
Document: [notif-id]
  - userId: [original-submitter-uid]
  - type: "submission_approved"
  - message: "Your [type] submission has been approved..."
```

---

### Test 3.3: Reject Submission

**Steps:**
1. In console:
```javascript
const submissionId = 'sub_[pending-id]';
const result = await window.submissionWorkflow.rejectSubmission(
    submissionId,
    'Please add more detail and provide sources.'
);
console.log('Rejected:', result);
```

**Expected Results:**
- ✅ Returns `{ success: true }`
- ✅ Submission status = `rejected`
- ✅ `rejectionReason` field populated
- ✅ Notification sent to submitter

**Verify in Firestore:**
```
Collection: submissions
Document: [submissionId]
  - status: "rejected"
  - reviewedBy: [admin-uid]
  - rejectionReason: "Please add more detail..."
  - reviewedAt: [timestamp]

Collection: notifications
  - type: "submission_rejected"
  - message includes rejection reason
```

---

### Test 3.4: Bulk Approve

**Steps:**
```javascript
const ids = ['sub_001', 'sub_002', 'sub_003'];
const results = await window.submissionWorkflow.bulkApprove(ids);
console.log('Bulk approve results:', results);
```

**Expected Results:**
- ✅ Returns `{ success: [...], failed: [...] }`
- ✅ Successful IDs appear in `success` array
- ✅ Failed IDs appear in `failed` array with error messages
- ✅ All successful submissions approved
- ✅ Notifications sent for each

**Performance Note:**
- ⚠️ Currently processes sequentially (slow for large batches)
- ⚠️ See ISSUE-004 in test report

---

## Test Suite 4: User Dashboard

### Test 4.1: View Own Submissions

**Steps:**
1. Navigate to `http://localhost:8000/dashboard.html`
2. Sign in
3. Wait for page to load

**Expected Results:**
- ✅ User info displayed (name, email, avatar)
- ✅ Statistics accurate:
  - Total contributions
  - Pending count
  - Approved count
  - Approval rate percentage
- ✅ Submissions list populated
- ✅ Each submission shows:
  - Entity name
  - Type badge
  - Mythology badge
  - Date
  - Status badge (colored)

---

### Test 4.2: Filter by Status

**Steps:**
1. On dashboard, click tabs:
   - "All"
   - "Pending"
   - "Approved"
   - "Needs Revision"

**Expected Results:**
- ✅ List filters correctly for each tab
- ✅ Tab shows count in parentheses
- ✅ Active tab highlighted
- ✅ Empty state shown if no items in category

---

### Test 4.3: View Notifications

**Steps:**
1. Scroll to "Notifications" section on dashboard
2. Check recent notifications

**Expected Results:**
- ✅ Shows 10 most recent notifications
- ✅ Unread notifications highlighted
- ✅ Relative timestamps ("2 hours ago")
- ✅ Click notification to mark as read and navigate
- ✅ "Mark All Read" button works

**Test Mark as Read:**
```javascript
const notifId = 'notif_[id]';
await window.submissionWorkflow.markNotificationAsRead(notifId);
// Verify notification.read = true in Firestore
```

---

### Test 4.4: Edit Rejected Submission from Dashboard

**Steps:**
1. Find rejected submission in dashboard
2. Click "Edit & Resubmit" button
3. Verify navigation to edit page

**Expected Results:**
- ✅ Navigates to `/theories/user-submissions/edit.html?id=[submission-id]`
- ✅ Form pre-filled with existing data
- ✅ Rejection feedback visible
- ✅ Can save changes

---

### Test 4.5: View Published Entity

**Steps:**
1. Find approved submission in dashboard
2. Click "View Published" button

**Expected Results:**
- ✅ Navigates to entity page: `/[collection]/[entity-id].html`
- ✅ Entity displays correctly
- ✅ Shows contributor attribution (if implemented)

---

### Test 4.6: Statistics Accuracy

**Manual Verification:**
1. Count submissions in Firestore manually:
   ```
   Pending: X
   Approved: Y
   Rejected: Z
   Total: X + Y + Z
   Approval Rate: (Y / Total) * 100
   ```
2. Compare with dashboard stats

**Console Verification:**
```javascript
const stats = await window.submissionWorkflow.getUserStats();
console.log('Stats:', stats);
// Verify against Firestore queries
```

**Expected Results:**
- ✅ All stats match Firestore counts
- ✅ Real-time updates (refresh after actions)

---

## Test Suite 5: Security Tests

### Test 5.1: Authentication Required

**Steps:**
1. Sign out
2. Try to create submission:
```javascript
try {
    await window.submissionWorkflow.createSubmission({...}, 'deity');
    console.error('SECURITY BUG: Unauthenticated user created submission');
} catch (error) {
    console.log('✅ Correctly blocked:', error.message);
}
```

**Expected:** Error thrown

---

### Test 5.2: Non-Admin Cannot Approve

**Steps:**
1. Sign in as regular user (not admin)
2. Try to approve:
```javascript
try {
    await window.submissionWorkflow.approveSubmission('sub_123');
    console.error('SECURITY BUG: Non-admin approved submission');
} catch (error) {
    console.log('✅ Correctly blocked:', error.message);
}
```

**Expected:** "Admin access required" error

---

### Test 5.3: Cannot Modify Other Users' Data

**Steps:**
1. Sign in as User A
2. Create submission
3. Sign in as User B
4. Try to modify User A's submission

**Expected:** "You can only update your own submissions" error

---

## Troubleshooting

### Issue: "Firebase not initialized"
**Solution:** Wait for Firebase auth to complete
```javascript
await new Promise(resolve => {
    firebase.auth().onAuthStateChanged(() => resolve());
});
```

### Issue: "Collection not found"
**Solution:** Check collection name mapping in `entity-loader.js`

### Issue: "Permission denied"
**Solution:**
1. Check Firestore security rules
2. Verify user is authenticated
3. Verify admin role in `users` collection

### Issue: Submissions not appearing
**Solution:**
1. Check Firestore console for data
2. Verify `submittedBy` matches current user UID
3. Check browser console for errors

---

## Test Data Cleanup

After testing, clean up test data:

```javascript
// Delete test submissions
const testSubmissions = await firebase.firestore()
    .collection('submissions')
    .where('entityName', '>=', 'Test')
    .where('entityName', '<=', 'Test\uf8ff')
    .get();

const batch = firebase.firestore().batch();
testSubmissions.docs.forEach(doc => {
    batch.delete(doc.ref);
});
await batch.commit();

console.log(`Deleted ${testSubmissions.size} test submissions`);
```

---

## Automated Testing (Future)

Recommended test framework: Jest + Firebase Testing Library

Sample unit test:
```javascript
describe('SubmissionWorkflow', () => {
    beforeEach(async () => {
        await loadFirebaseEmulators();
    });

    test('creates submission with correct structure', async () => {
        const workflow = new SubmissionWorkflow();
        await workflow.init();

        const result = await workflow.createSubmission(mockData, 'deity');

        expect(result.success).toBe(true);
        expect(result.submission.status).toBe('pending');
        expect(result.submission.type).toBe('deity');
    });
});
```

---

## Contact & Support

- Full Test Report: [USER_WORKFLOW_TEST_REPORT.md](../USER_WORKFLOW_TEST_REPORT.md)
- Quick Summary: [USER_WORKFLOW_TEST_SUMMARY.md](../USER_WORKFLOW_TEST_SUMMARY.md)
- Test Data: `tests/test-data/`

**Happy Testing!**

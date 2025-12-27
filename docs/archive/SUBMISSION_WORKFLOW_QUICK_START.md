# User Submission Workflow - Quick Start Guide

## For Users: How to Contribute Content

### 1. Sign In
- Go to https://eyesofazrael.com
- Click "Sign in with Google"
- Authorize with your Google account

### 2. Create a Submission
- Click "Submit Your Theory" or navigate to `theories/user-submissions/submit.html`
- Choose your entity type:
  - Deity
  - Hero
  - Creature
  - Place
  - Sacred Item
  - Sacred Text
  - Concept
  - Event

### 3. Fill Required Fields
**All Submissions Need:**
- Name
- Mythology (Greek, Norse, Egyptian, etc.)
- Description (at least 150 words)
- Sources/Citations (minimum 2-3)

**Entity-Specific Fields:**
- **Deity:** Domains, symbols, family relationships
- **Hero:** Major deeds, lineage
- **Creature:** Physical description, abilities
- **Place:** Location type, significance
- **Item:** Powers, associated figures
- **Text:** Author, date, summary
- **Concept:** Cultural significance
- **Event:** Participants, consequences

### 4. Submit and Track
- Click "Submit for Review"
- Your submission enters "Pending" status
- Track progress at `/dashboard.html`
- Receive notifications when reviewed

### 5. If Rejected
- Read admin feedback carefully
- Click "Edit & Resubmit"
- Address all concerns mentioned
- Resubmit for second review

### 6. If Approved
- Receive notification with link to published entity
- Entity appears in main database
- You're credited as contributor
- Builds your approval rate and reputation

---

## For Admins: How to Review Submissions

### 1. Access Review Queue
- Navigate to `/admin/review-queue.html`
- Admin role required (verify in Firestore: `users/{uid}` has `role: 'admin'`)

### 2. View Submissions
Dashboard shows:
- Pending Review count
- Submitted Today
- Approved (All Time)
- Rejected (All Time)

### 3. Filter and Sort
**Filters:**
- Status (Pending, Approved, Rejected, All)
- Entity Type (8 types)
- Mythology (12+ options)
- Sort by date (Newest/Oldest)

### 4. Review Individual Submission
**Check:**
- [ ] Description is comprehensive (150+ words)
- [ ] Citations provided (minimum 2-3 sources)
- [ ] Grammar and spelling correct
- [ ] Facts are accurate
- [ ] No plagiarism
- [ ] No duplicates exist
- [ ] Appropriate mythology selected

### 5. Approve or Reject

**To Approve:**
1. Click "Approve"
2. Confirm action
3. Entity is created in target collection
4. User is notified
5. Submission moves to "Approved" status

**To Reject:**
1. Click "Reject"
2. Enter detailed feedback explaining issues
3. Confirm rejection
4. User receives notification with feedback
5. Submission moves to "Rejected" status (user can edit and resubmit)

### 6. Bulk Operations
1. Click "Bulk Mode"
2. Select multiple submissions (checkboxes)
3. Click "Bulk Approve" or "Bulk Reject"
4. Confirm action
5. System processes each submission
6. Results displayed (success/failed counts)

---

## Common Issues and Solutions

### User Issues

**Problem:** Can't access submission form
**Solution:** Ensure you're signed in with Google

**Problem:** Form validation errors
**Solution:** Check all required fields are filled, description is long enough, citations provided

**Problem:** Submission not appearing in dashboard
**Solution:** Refresh page, check that you're signed in with correct account

**Problem:** Can't edit approved submission
**Solution:** Once approved, submissions cannot be edited. Contact admin if changes needed.

### Admin Issues

**Problem:** Can't access review queue
**Solution:** Verify your user document in Firestore has `role: 'admin'`

**Problem:** Bulk approve not working
**Solution:** Ensure all selected submissions are in "pending" status

**Problem:** Approved entity not appearing
**Solution:** Check target collection, verify Firestore rules allow write access

---

## File Locations

### User Files
- **Submit Form:** `/theories/user-submissions/submit.html`
- **Dashboard:** `/dashboard.html`
- **Browse Submissions:** `/theories/user-submissions/browse.html`
- **Guidelines:** `/SUBMISSION_GUIDELINES.md`

### Admin Files
- **Review Queue:** `/admin/review-queue.html`

### Developer Files
- **Workflow JS:** `/js/submission-workflow.js`
- **CSS:** `/css/submission-workflow.css`
- **Security Rules:** `/firestore.rules`
- **Technical Docs:** `/USER_SUBMISSION_WORKFLOW.md`

---

## Key Functions

### User Functions
```javascript
// Create submission
await window.submissionWorkflow.createSubmission(data, type);

// Get my submissions
await window.submissionWorkflow.getUserSubmissions({ status: 'pending' });

// Update submission
await window.submissionWorkflow.updateSubmission(id, newData);

// Delete submission
await window.submissionWorkflow.deleteSubmission(id);

// Get my stats
await window.submissionWorkflow.getUserStats();
```

### Admin Functions
```javascript
// Get pending submissions
await window.submissionWorkflow.getPendingSubmissions({
  type: 'deity',
  mythology: 'greek',
  limit: 50
});

// Approve submission
await window.submissionWorkflow.approveSubmission(id);

// Reject submission
await window.submissionWorkflow.rejectSubmission(id, reason);

// Bulk approve
await window.submissionWorkflow.bulkApprove([id1, id2, id3]);

// Check duplicates
await window.submissionWorkflow.checkDuplicates(name, mythology, type);
```

---

## Status Flow

```
User Submits
    ↓
[PENDING] ────────────→ [APPROVED] → Published in Main Collection
    ↓                         ↑
    ↓                         |
[REJECTED] ─── Edit ─────────┘
```

---

## Notification Types

1. **Submission Created**
   - When: User submits
   - Message: "Your submission has been submitted for review"

2. **Submission Approved**
   - When: Admin approves
   - Message: "Your submission has been approved and published"
   - Includes link to published entity

3. **Submission Rejected**
   - When: Admin rejects
   - Message: "Your submission needs revision"
   - Includes rejection reason and edit link

---

## Entity Types and Collections

| Entity Type | Target Collection        |
|-------------|--------------------------|
| Deity       | `/deities/`              |
| Hero        | `/heroes/`               |
| Creature    | `/creatures/`            |
| Place       | `/places/`               |
| Item        | `/spiritual-items/`      |
| Text        | `/texts/`                |
| Concept     | `/concepts/`             |
| Event       | `/events/`               |

---

## Quality Checklist

### Before Submitting
- [ ] All required fields filled
- [ ] Description is 150+ words
- [ ] At least 2-3 citations provided
- [ ] Spell-checked and proofread
- [ ] Checked for duplicates
- [ ] Facts verified against sources
- [ ] Appropriate mythology selected

### Before Approving (Admin)
- [ ] Review all fields
- [ ] Verify citations
- [ ] Check for duplicates
- [ ] Confirm accuracy
- [ ] Ensure quality standards met
- [ ] No plagiarism
- [ ] Grammar and spelling correct

---

## Support

### Need Help?
- **Users:** Check `SUBMISSION_GUIDELINES.md`
- **Admins:** Review `USER_SUBMISSION_WORKFLOW.md`
- **Developers:** See API reference in technical docs

### Report Issues
- Check browser console for errors
- Verify Firebase configuration
- Test with Firebase Emulator
- Contact development team

---

## Quick Links

- Submit Form: `/theories/user-submissions/submit.html`
- Dashboard: `/dashboard.html`
- Admin Queue: `/admin/review-queue.html`
- Guidelines: `/SUBMISSION_GUIDELINES.md`
- Technical Docs: `/USER_SUBMISSION_WORKFLOW.md`

---

**Last Updated:** December 2024

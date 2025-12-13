# Editable Panel System - User Guide

**Eyes of Azrael - Community Knowledge Contribution System**

## Overview

The Editable Panel System allows users to contribute to the Eyes of Azrael mythology database by:
- **Submitting new information** to existing entries
- **Editing their own submissions**
- **Viewing community-approved contributions**

All submissions are reviewed by moderators before becoming visible to ensure quality and accuracy.

---

## For Regular Users

### Submitting Additional Information

1. **Navigate to any mythology page**
   - Example: `/mythos/greek/index.html`

2. **Find a deity, hero, or creature card**
   - Look for the **+ Add Submission** button in the top-right corner of each card

3. **Click the + button**
   - If not logged in, you'll be prompted to sign in with Google
   - After login, a submission form will appear

4. **Fill out the submission form**
   - **Title**: Brief descriptive title (e.g., "Additional Zeus Mythology")
   - **Content**: Your information, insights, or corrections
   - **Sources** (optional): Citations or references

5. **Submit**
   - Your submission is saved with status: `pending`
   - A moderator will review it
   - If approved, it will appear in the "Community Submissions" section

### Viewing Community Submissions

- Approved submissions appear in an expandable panel below the main content
- Click the "Community Submissions" header to expand/collapse
- Each submission shows:
  - Title and content
  - Submitter's email
  - Submission date
  - Sources (if provided)

---

## For Content Creators

### Creating Your Own Content

When you create original deity/hero/creature entries in Firebase:

1. **Add the `createdBy` field** to your document
   - Set it to your Firebase Auth UID
   - This enables the edit icon on your content

2. **The edit icon (✎) will appear** in the top-right corner
   - Only visible to you (the creator)
   - Allows inline editing of your content

### Editing Your Content

1. **Click the edit icon (✎)** on your own card

2. **Edit form appears** with current values pre-filled
   - Modify any field
   - Changes are immediate in the form

3. **Save changes**
   - Updates are saved to Firebase
   - Page reloads to show updated content

### Editing Your Submissions

1. **Find your approved submission** in the Community Submissions panel

2. **Click the edit button (✎)** next to your submission
   - Only visible on your own submissions

3. **Modify and save**
   - Updates are immediate
   - No re-approval needed for minor edits

---

## For Administrators

### Reviewing Submissions

All user submissions start with `status: 'pending'` and require approval.

#### Firebase Console Method

1. **Open Firebase Console**
   - Navigate to Firestore Database
   - Go to `submissions` collection

2. **Find pending submissions**
   - Filter where `status == 'pending'`
   - Review content, sources, and submitter

3. **Approve or reject**
   - **Approve**: Set `status: 'approved'`
   - **Reject**: Delete the document or set `status: 'rejected'`

4. **Submission becomes visible**
   - Appears in Community Submissions panel
   - Users can see it immediately upon page reload

#### Admin Dashboard (Future Feature)

An admin dashboard is planned with:
- Moderation queue
- Bulk approval/rejection
- User notifications
- Content quality metrics

### Managing Content

Admins can edit any content directly in Firestore:

1. **Navigate to the collection** (e.g., `deities`, `heroes`)
2. **Find the document** by ID
3. **Edit fields** directly
4. **Save changes** - updates are immediate

### Removing Content

To remove user-created content:

1. **Delete from Firestore** - removes from database
2. **Set `isPublished: false`** - hides without deleting
3. **Move to archive collection** - soft delete

---

## Technical Details

### Data Structure

#### Main Content Document
```javascript
{
  id: 'greek_zeus',
  name: 'Zeus',
  mythology: 'greek',
  description: '...',
  domains: ['sky', 'thunder', 'justice'],
  createdBy: 'user-uid-here', // Firebase Auth UID
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedBy: 'user-uid-here'
}
```

#### Submission Document
```javascript
{
  id: 'auto-generated',
  title: 'Additional Zeus Mythology',
  content: '...',
  sources: 'Hesiod Theogony, Homer Iliad',
  parentCollection: 'deities',
  parentDocumentId: 'greek_zeus',
  contentType: 'deity',
  submittedBy: 'user-uid',
  submittedByEmail: 'user@example.com',
  submittedAt: Timestamp,
  status: 'pending', // 'pending' | 'approved' | 'rejected'
  upvotes: 0,
  downvotes: 0
}
```

### Security Rules

Firestore security rules ensure:
- Users can only edit their own submissions
- All new submissions require approval
- Public read access for approved content
- Admin override for all operations

```javascript
// Submissions collection rules
match /submissions/{submissionId} {
  // Anyone can read approved submissions
  allow read: if resource.data.status == 'approved';

  // Users can create submissions
  allow create: if request.auth != null &&
                   request.resource.data.submittedBy == request.auth.uid &&
                   request.resource.data.status == 'pending';

  // Users can update their own submissions
  allow update: if request.auth != null &&
                   resource.data.submittedBy == request.auth.uid;

  // Admins can do anything
  allow read, write: if isAdmin();
}
```

---

## Frosted Glass Theme

The editable panel system uses a consistent frosted glass design:

- **Modals**: Translucent background with blur effect
- **Forms**: Dark glass inputs with purple accents
- **Buttons**: Gradient purple submit, transparent cancel
- **Panels**: Expandable with smooth animations
- **Toast Notifications**: Success (green), Error (red), Info (blue)

All UI elements automatically adapt to dark/light theme preferences.

---

## Keyboard Shortcuts

- **Escape**: Close modal
- **Enter**: Submit form (when in text input)
- **Tab**: Navigate form fields

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with `-webkit-` prefixes)
- Mobile: Responsive design, touch-friendly

---

## Troubleshooting

### + Button doesn't appear
- Check that Firebase is loaded (`window.firebaseApp` exists)
- Check that `editable-panel-system.js` is loaded
- Check browser console for errors

### Edit icon doesn't appear
- Verify you're logged in
- Verify the content has `createdBy: your-uid`
- Check that your Firebase Auth session is active

### Submission doesn't save
- Check that you're logged in
- Check Firebase Console for errors
- Verify Firestore security rules allow create

### Approved submission not visible
- Clear browser cache
- Check that `status == 'approved'` in Firestore
- Reload the page

### Modal won't close
- Click outside the modal
- Press Escape key
- Click the X button in top-right

---

## Best Practices

### For Submitters
1. **Be specific** - Use descriptive titles
2. **Cite sources** - Add references when possible
3. **Stay on topic** - Only add relevant information
4. **Be respectful** - Follow community guidelines
5. **Check for duplicates** - See if info already exists

### For Creators
1. **Add `createdBy`** - Always include your UID
2. **Fill all fields** - Complete descriptions are better
3. **Use consistent naming** - Follow established patterns
4. **Include metadata** - Add mythology, type, etc.
5. **Test your content** - Verify it displays correctly

### For Admins
1. **Review promptly** - Don't let queue grow too large
2. **Be consistent** - Apply same standards to all
3. **Provide feedback** - Let users know why rejected
4. **Monitor quality** - Watch for spam or low-effort posts
5. **Update rules** - Adjust security rules as needed

---

## Future Enhancements

### Planned Features
- Voting system (upvote/downvote submissions)
- User reputation/karma system
- Email notifications on approval/rejection
- Rich text editor for submissions
- Image/media upload support
- Comment threads on submissions
- Version history and rollback
- Suggested edits (like Wikipedia)
- AI-powered fact checking
- Cross-mythology linking

### Admin Dashboard
- Real-time moderation queue
- Bulk approval/rejection
- User management
- Content analytics
- Submission statistics
- Quality metrics
- Ban/mute users
- Automated spam detection

---

## Support

For issues or questions:
- **GitHub Issues**: Report bugs or request features
- **Discord**: Join the community (coming soon)
- **Email**: Contact the development team

---

## Credits

**Editable Panel System v1.0**
- Design: Frosted glass theme with purple accents
- Framework: Firebase Firestore + Firebase Auth
- UI: Vanilla JavaScript, no dependencies
- Styling: Pure CSS with glassmorphism effects

Built with love for the Eyes of Azrael community.

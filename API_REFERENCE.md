# Firebase Integration API Reference

## Overview

This document provides complete API documentation for the Firebase-integrated user theory system in Eyes of Azrael. The system consists of four main modules:

1. **firebase-auth.js** - Google authentication
2. **firebase-db.js** - Firestore database operations
3. **firebase-storage.js** - Firebase Storage for images
4. **firebase-init.js** - Firebase initialization and configuration

---

## Table of Contents

- [Authentication API](#authentication-api)
- [Database API](#database-api)
- [Storage API](#storage-api)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Code Examples](#code-examples)

---

## Authentication API

**Module:** `firebase-auth.js`

**Global namespace:** `window.firebaseAuth`

### signInWithGoogle()

Sign in using Google OAuth popup.

**Signature:**
```javascript
async signInWithGoogle(): Promise<{success: boolean, user?: Object, error?: string}>
```

**Returns:**
```javascript
{
  success: true,
  user: {
    uid: "firebase-user-id",
    email: "user@gmail.com",
    displayName: "John Doe",
    photoURL: "https://lh3.googleusercontent.com/...",
    emailVerified: true
  }
}
```

**Example:**
```javascript
const result = await window.firebaseAuth.signInWithGoogle();

if (result.success) {
  console.log('Signed in:', result.user.email);
  // User profile automatically created in Firestore
} else {
  console.error('Sign-in failed:', result.error);
}
```

**Errors:**
- `auth/popup-blocked` - Browser blocked popup
- `auth/popup-closed-by-user` - User closed popup
- `auth/cancelled-popup-request` - Another popup already open
- `auth/network-request-failed` - No internet connection

**See also:** [signInWithRedirect()](#signinwithredirect)

---

### signInWithRedirect()

Sign in using Google OAuth redirect (alternative to popup).

**Signature:**
```javascript
async signInWithRedirect(): Promise<void>
```

**Usage:**
```javascript
// Redirect to Google sign-in
await window.firebaseAuth.signInWithRedirect();

// User is redirected away, then back to your site
// On return, use getRedirectResult()
```

**When to use:**
- Mobile browsers (popups often blocked)
- When popup is blocked by browser settings
- Better UX on mobile devices

---

### getRedirectResult()

Get result after redirect sign-in.

**Signature:**
```javascript
async getRedirectResult(): Promise<{success: boolean, user?: Object, error?: string}>
```

**Example:**
```javascript
// Call on page load
window.addEventListener('DOMContentLoaded', async () => {
  const result = await window.firebaseAuth.getRedirectResult();

  if (result.success && result.user) {
    console.log('Redirect sign-in successful:', result.user.email);
  }
});
```

---

### signOut()

Sign out current user.

**Signature:**
```javascript
async signOut(): Promise<{success: boolean, error?: string}>
```

**Example:**
```javascript
const result = await window.firebaseAuth.signOut();

if (result.success) {
  console.log('Signed out successfully');
  // UI updates automatically via onAuthStateChanged
} else {
  console.error('Sign-out failed:', result.error);
}
```

---

### getCurrentUser()

Get current authenticated user (synchronous).

**Signature:**
```javascript
getCurrentUser(): Object | null
```

**Returns:**
```javascript
{
  uid: "firebase-user-id",
  email: "user@gmail.com",
  displayName: "John Doe",
  photoURL: "https://lh3.googleusercontent.com/...",
  emailVerified: true
}
```

**Example:**
```javascript
const user = window.firebaseAuth.getCurrentUser();

if (user) {
  console.log('Current user:', user.displayName);
} else {
  console.log('No user signed in');
}
```

**Note:** Returns immediately with cached user. For async, use `onAuthStateChanged()`.

---

### onAuthStateChanged(callback)

Listen for authentication state changes.

**Signature:**
```javascript
onAuthStateChanged(callback: (user: Object | null) => void): Function
```

**Returns:** Unsubscribe function

**Example:**
```javascript
const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User signed in:', user.email);
    // Update UI for authenticated state
    showUserProfile(user);
  } else {
    console.log('User signed out');
    // Update UI for unauthenticated state
    showLoginButton();
  }
});

// Later, stop listening
unsubscribe();
```

**Use cases:**
- Update UI when user signs in/out
- Sync user state across tabs
- Load user-specific data after auth

---

### isLoggedIn()

Check if user is currently logged in (synchronous).

**Signature:**
```javascript
isLoggedIn(): boolean
```

**Example:**
```javascript
if (window.firebaseAuth.isLoggedIn()) {
  // Show authenticated content
} else {
  // Show login prompt
}
```

---

## Database API

**Module:** `firebase-db.js`

**Global namespace:** `window.firebaseDB`

### createTheory(data)

Create a new theory in Firestore.

**Signature:**
```javascript
async createTheory(data: TheoryData): Promise<{success: boolean, theory?: Theory, error?: string}>
```

**Parameters:**
```javascript
{
  title: string,              // Required, 3-200 chars
  summary: string,            // Required, 10-500 chars
  content: string,            // Required, 50+ chars
  topic: string,              // Required, from taxonomy
  subtopic: string,           // Required, from taxonomy
  richContent: {              // Optional
    panels: Array,            // Rich content panels
    images: Array,            // Image URLs
    links: Array,             // External links
    corpusSearches: Array     // Corpus search terms
  },
  relatedPage: string,        // Optional, page ID
  sources: string,            // Optional, references
  relatedMythologies: Array   // Optional, mythology tags
}
```

**Returns:**
```javascript
{
  success: true,
  theory: {
    id: "auto-generated-id",
    title: "Theory Title",
    summary: "Theory summary...",
    content: "Full content...",
    topic: "Mythologies",
    subtopic: "Greek Mythology",
    authorId: "firebase-user-id",
    authorName: "John Doe",
    authorAvatar: "https://...",
    votes: 0,
    views: 0,
    commentCount: 0,
    status: "published",
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

**Example:**
```javascript
const theoryData = {
  title: "Zeus and the Titans",
  summary: "An analysis of Zeus's role in the Titanomachy",
  content: "Long form content here...",
  topic: "Mythologies",
  subtopic: "Greek Mythology",
  richContent: {
    panels: [
      { type: 'text', content: 'Panel 1 content...' },
      { type: 'image', url: 'https://...', caption: 'Zeus statue' }
    ],
    links: [
      { title: 'Theogony', url: 'https://...' }
    ],
    corpusSearches: ['Zeus', 'Titans', 'Olympus']
  },
  relatedPage: 'deity/zeus',
  sources: 'Hesiod\'s Theogony, Homer\'s Iliad',
  relatedMythologies: ['Greek', 'Roman']
};

const result = await window.firebaseDB.createTheory(theoryData);

if (result.success) {
  console.log('Theory created:', result.theory.id);
  // Redirect to view page
  window.location.href = `/theories/user-submissions/view.html?id=${result.theory.id}`;
} else {
  console.error('Failed to create theory:', result.error);
}
```

**Errors:**
- `auth/unauthenticated` - User not signed in
- `validation/missing-field` - Required field missing
- `validation/invalid-length` - Field length invalid
- `firestore/permission-denied` - Security rules rejected write

---

### getTheory(id)

Get a single theory by ID.

**Signature:**
```javascript
async getTheory(id: string): Promise<{success: boolean, theory?: Theory, error?: string}>
```

**Example:**
```javascript
const result = await window.firebaseDB.getTheory('theory-id-123');

if (result.success) {
  console.log('Theory:', result.theory.title);
  displayTheory(result.theory);
} else {
  console.error('Theory not found:', result.error);
}
```

**Errors:**
- `firestore/not-found` - Theory doesn't exist
- `firestore/permission-denied` - Theory is not published

---

### updateTheory(id, updates)

Update an existing theory (author only).

**Signature:**
```javascript
async updateTheory(id: string, updates: Partial<TheoryData>): Promise<{success: boolean, theory?: Theory, error?: string}>
```

**Example:**
```javascript
const updates = {
  title: "Updated Theory Title",
  summary: "Updated summary...",
  richContent: {
    panels: [...], // Updated panels
  }
};

const result = await window.firebaseDB.updateTheory('theory-id-123', updates);

if (result.success) {
  console.log('Theory updated');
} else {
  console.error('Update failed:', result.error);
}
```

**Errors:**
- `auth/unauthenticated` - User not signed in
- `firestore/permission-denied` - User is not the author
- `firestore/not-found` - Theory doesn't exist

**Note:** `updatedAt` timestamp is automatically set.

---

### deleteTheory(id)

Delete a theory (author only). Performs soft delete (sets status to 'deleted').

**Signature:**
```javascript
async deleteTheory(id: string): Promise<{success: boolean, message?: string, error?: string}>
```

**Example:**
```javascript
const confirmed = confirm('Are you sure you want to delete this theory?');

if (confirmed) {
  const result = await window.firebaseDB.deleteTheory('theory-id-123');

  if (result.success) {
    console.log('Theory deleted');
    window.location.href = '/theories/user-submissions/browse.html';
  } else {
    console.error('Delete failed:', result.error);
  }
}
```

**Errors:**
- `auth/unauthenticated` - User not signed in
- `firestore/permission-denied` - User is not the author

**Note:** Theory is not permanently deleted, just marked as deleted. To permanently delete, modify security rules.

---

### getAllTheories(filters)

Get theories with filtering, sorting, and pagination.

**Signature:**
```javascript
async getAllTheories(filters?: TheoryFilters): Promise<{success: boolean, theories?: Array<Theory>, error?: string}>
```

**Parameters:**
```javascript
{
  status: 'published' | 'draft' | 'deleted',  // Default: 'published'
  topic: string,                               // Filter by topic
  subtopic: string,                            // Filter by subtopic
  authorId: string,                            // Filter by author
  relatedPage: string,                         // Filter by page
  sortBy: 'newest' | 'oldest' | 'popular' | 'views',  // Default: 'newest'
  limit: number,                               // Max results (default: 20)
  startAfter: DocumentSnapshot                 // For pagination
}
```

**Returns:**
```javascript
{
  success: true,
  theories: [
    { id: '...', title: '...', ... },
    { id: '...', title: '...', ... }
  ],
  lastDoc: DocumentSnapshot  // For pagination
}
```

**Example - Basic:**
```javascript
// Get all published theories
const result = await window.firebaseDB.getAllTheories();

if (result.success) {
  result.theories.forEach(theory => {
    console.log(theory.title);
  });
}
```

**Example - Filtered:**
```javascript
// Get Greek mythology theories, sorted by popularity
const result = await window.firebaseDB.getAllTheories({
  topic: 'Mythologies',
  subtopic: 'Greek Mythology',
  sortBy: 'popular',
  limit: 10
});
```

**Example - Pagination:**
```javascript
// Get first page
const page1 = await window.firebaseDB.getAllTheories({ limit: 20 });

// Get next page
const page2 = await window.firebaseDB.getAllTheories({
  limit: 20,
  startAfter: page1.lastDoc
});
```

**Example - User's theories:**
```javascript
const user = window.firebaseAuth.getCurrentUser();

const result = await window.firebaseDB.getAllTheories({
  authorId: user.uid,
  sortBy: 'newest'
});

console.log(`You have ${result.theories.length} theories`);
```

---

### voteTheory(theoryId, direction)

Vote on a theory (upvote or downvote).

**Signature:**
```javascript
async voteTheory(theoryId: string, direction: 1 | -1): Promise<{success: boolean, votes?: number, error?: string}>
```

**Parameters:**
- `direction`: `1` for upvote, `-1` for downvote

**Returns:**
```javascript
{
  success: true,
  votes: 42,  // New vote count
  userVote: 1 // User's current vote (1, -1, or 0)
}
```

**Example:**
```javascript
// Upvote
const result = await window.firebaseDB.voteTheory('theory-id-123', 1);

if (result.success) {
  console.log('New vote count:', result.votes);
  updateVoteButton(result.userVote);
} else {
  console.error('Vote failed:', result.error);
}

// Remove vote (click same button again)
if (currentVote === 1) {
  // Clicking upvote again removes vote
  const result = await window.firebaseDB.voteTheory('theory-id-123', 0);
}
```

**Behavior:**
- First vote: Adds vote
- Same direction: Removes vote (toggle off)
- Opposite direction: Changes vote
- User can only vote once per theory

**Errors:**
- `auth/unauthenticated` - User not signed in
- `firestore/permission-denied` - Security rules rejected

**Note:** Vote counts are stored in `/theories/{theoryId}/votes/{userId}` subcollection.

---

### addComment(theoryId, content)

Add a comment to a theory.

**Signature:**
```javascript
async addComment(theoryId: string, content: string): Promise<{success: boolean, comment?: Comment, error?: string}>
```

**Parameters:**
- `content`: Comment text (1-1000 chars)

**Returns:**
```javascript
{
  success: true,
  comment: {
    id: "auto-generated-id",
    theoryId: "theory-id-123",
    content: "Great theory!",
    authorId: "user-id",
    authorName: "John Doe",
    authorAvatar: "https://...",
    createdAt: Timestamp
  }
}
```

**Example:**
```javascript
const commentText = document.getElementById('comment-input').value;

const result = await window.firebaseDB.addComment('theory-id-123', commentText);

if (result.success) {
  console.log('Comment added');
  displayComment(result.comment);
  document.getElementById('comment-input').value = ''; // Clear input
} else {
  console.error('Comment failed:', result.error);
}
```

**Errors:**
- `auth/unauthenticated` - User not signed in
- `validation/empty-content` - Comment is empty
- `validation/too-long` - Comment exceeds 1000 chars

---

### getComments(theoryId)

Get all comments for a theory.

**Signature:**
```javascript
async getComments(theoryId: string): Promise<{success: boolean, comments?: Array<Comment>, error?: string}>
```

**Example:**
```javascript
const result = await window.firebaseDB.getComments('theory-id-123');

if (result.success) {
  result.comments.forEach(comment => {
    console.log(`${comment.authorName}: ${comment.content}`);
  });
}
```

**Returns:** Comments sorted by creation time (newest first).

---

### incrementViewCount(theoryId)

Increment view count for a theory.

**Signature:**
```javascript
async incrementViewCount(theoryId: string): Promise<{success: boolean, views?: number, error?: string}>
```

**Example:**
```javascript
// Call when user views theory
const result = await window.firebaseDB.incrementViewCount('theory-id-123');

if (result.success) {
  console.log('View count:', result.views);
}
```

**Note:** Uses Firestore `FieldValue.increment()` for atomic updates.

---

## Storage API

**Module:** `firebase-storage.js`

**Global namespace:** `window.firebaseStorage`

### uploadImage(file, theoryId, onProgress)

Upload an image to Firebase Storage.

**Signature:**
```javascript
async uploadImage(
  file: File,
  theoryId: string,
  onProgress?: (progress: number) => void
): Promise<{success: boolean, url?: string, path?: string, error?: string}>
```

**Parameters:**
- `file`: Image file object from `<input type="file">`
- `theoryId`: Theory ID (for organizing uploads)
- `onProgress`: Optional callback for upload progress (0-100)

**Returns:**
```javascript
{
  success: true,
  url: "https://firebasestorage.googleapis.com/v0/b/.../o/...",  // Public download URL
  path: "theory-images/user-id/theory-id/image.jpg"              // Storage path
}
```

**Example:**
```javascript
const fileInput = document.getElementById('image-upload');
const file = fileInput.files[0];

// Validate file
if (!file) {
  alert('Please select an image');
  return;
}

if (file.size > 5 * 1024 * 1024) {
  alert('Image must be under 5MB');
  return;
}

if (!file.type.startsWith('image/')) {
  alert('File must be an image');
  return;
}

// Upload with progress
const result = await window.firebaseStorage.uploadImage(
  file,
  'theory-id-123',
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
    updateProgressBar(progress);
  }
);

if (result.success) {
  console.log('Image uploaded:', result.url);
  // Add URL to theory's richContent
  addImageToTheory(result.url);
} else {
  console.error('Upload failed:', result.error);
}
```

**Errors:**
- `auth/unauthenticated` - User not signed in
- `storage/unauthorized` - Security rules rejected
- `storage/quota-exceeded` - Storage quota exceeded
- `storage/retry-limit-exceeded` - Upload failed after retries
- `validation/file-too-large` - File exceeds 5MB

**Image limits:**
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Path: `theory-images/{userId}/{theoryId}/{filename}`

---

### deleteImage(path)

Delete an image from Firebase Storage.

**Signature:**
```javascript
async deleteImage(path: string): Promise<{success: boolean, message?: string, error?: string}>
```

**Parameters:**
- `path`: Storage path (from `uploadImage()` response)

**Example:**
```javascript
const imagePath = 'theory-images/user-id/theory-id/image.jpg';

const result = await window.firebaseStorage.deleteImage(imagePath);

if (result.success) {
  console.log('Image deleted');
} else {
  console.error('Delete failed:', result.error);
}
```

**Errors:**
- `auth/unauthenticated` - User not signed in
- `storage/unauthorized` - User doesn't own image
- `storage/object-not-found` - Image doesn't exist

---

### getDownloadURL(path)

Get public download URL for an image.

**Signature:**
```javascript
async getDownloadURL(path: string): Promise<{success: boolean, url?: string, error?: string}>
```

**Example:**
```javascript
const path = 'theory-images/user-id/theory-id/image.jpg';

const result = await window.firebaseStorage.getDownloadURL(path);

if (result.success) {
  console.log('Download URL:', result.url);
  displayImage(result.url);
} else {
  console.error('Failed to get URL:', result.error);
}
```

**Note:** Usually not needed since `uploadImage()` returns URL directly.

---

## Data Models

### User Model

**Firestore path:** `/users/{userId}`

```typescript
interface User {
  uid: string;              // Firebase user ID (document ID)
  email: string;            // Google account email
  displayName: string;      // Google account name
  photoURL: string;         // Google profile picture
  bio?: string;             // Optional user bio
  createdAt: Timestamp;     // Account creation time
  updatedAt: Timestamp;     // Last update time
}
```

**Example:**
```javascript
{
  uid: "abc123xyz789",
  email: "john.doe@gmail.com",
  displayName: "John Doe",
  photoURL: "https://lh3.googleusercontent.com/...",
  bio: "Mythology enthusiast and researcher",
  createdAt: Timestamp(2024-01-15T10:30:00Z),
  updatedAt: Timestamp(2024-01-15T10:30:00Z)
}
```

---

### Theory Model

**Firestore path:** `/theories/{theoryId}`

```typescript
interface Theory {
  id: string;                    // Auto-generated document ID
  title: string;                 // Theory title (3-200 chars)
  summary: string;               // Short summary (10-500 chars)
  content: string;               // Full content (50+ chars)
  topic: string;                 // Primary topic (from taxonomy)
  subtopic: string;              // Subtopic (from taxonomy)

  richContent?: {                // Optional rich content
    panels: Panel[];             // Content panels
    images: string[];            // Image URLs
    links: Link[];               // External links
    corpusSearches: string[];    // Corpus search terms
  };

  authorId: string;              // User ID of author
  authorName: string;            // Author display name
  authorAvatar: string;          // Author profile picture

  votes: number;                 // Net vote count
  views: number;                 // View count
  commentCount: number;          // Number of comments

  status: 'published' | 'draft' | 'deleted';

  relatedPage?: string;          // Related page ID
  sources?: string;              // Source references
  relatedMythologies?: string[]; // Mythology tags

  createdAt: Timestamp;          // Creation time
  updatedAt: Timestamp;          // Last update time
}
```

---

### Comment Model

**Firestore path:** `/theories/{theoryId}/comments/{commentId}`

```typescript
interface Comment {
  id: string;              // Auto-generated document ID
  theoryId: string;        // Parent theory ID
  content: string;         // Comment text (1-1000 chars)
  authorId: string;        // User ID of commenter
  authorName: string;      // Commenter display name
  authorAvatar: string;    // Commenter profile picture
  createdAt: Timestamp;    // Comment time
}
```

---

### Vote Model

**Firestore path:** `/theories/{theoryId}/votes/{userId}`

```typescript
interface Vote {
  userId: string;          // User ID (document ID)
  theoryId: string;        // Parent theory ID
  direction: 1 | -1;       // 1 for upvote, -1 for downvote
  createdAt: Timestamp;    // Vote time
}
```

---

## Error Handling

### Error Types

All API methods return consistent error objects:

```javascript
{
  success: false,
  error: "error-code/error-message"
}
```

### Common Error Codes

**Authentication errors:**
- `auth/unauthenticated` - User not signed in
- `auth/popup-blocked` - Browser blocked popup
- `auth/popup-closed-by-user` - User closed popup
- `auth/network-request-failed` - No internet

**Firestore errors:**
- `firestore/permission-denied` - Security rules rejected
- `firestore/not-found` - Document doesn't exist
- `firestore/unavailable` - Firestore temporarily unavailable

**Storage errors:**
- `storage/unauthorized` - Security rules rejected
- `storage/quota-exceeded` - Storage limit exceeded
- `storage/object-not-found` - File doesn't exist
- `storage/retry-limit-exceeded` - Upload failed

**Validation errors:**
- `validation/missing-field` - Required field missing
- `validation/invalid-length` - Field length invalid
- `validation/file-too-large` - File exceeds size limit

### Error Handling Pattern

```javascript
try {
  const result = await window.firebaseDB.createTheory(data);

  if (result.success) {
    // Success path
    console.log('Theory created:', result.theory.id);
  } else {
    // Error path
    handleError(result.error);
  }
} catch (error) {
  // Unexpected error
  console.error('Unexpected error:', error);
  showErrorMessage('An unexpected error occurred. Please try again.');
}

function handleError(error) {
  switch (error) {
    case 'auth/unauthenticated':
      showLoginPrompt();
      break;
    case 'firestore/permission-denied':
      showErrorMessage('You do not have permission to perform this action.');
      break;
    case 'validation/missing-field':
      showErrorMessage('Please fill in all required fields.');
      break;
    default:
      showErrorMessage('An error occurred: ' + error);
  }
}
```

---

## Best Practices

### 1. Authentication

**Always check auth before protected actions:**
```javascript
if (!window.firebaseAuth.isLoggedIn()) {
  window.firebaseAuth.showLoginModal();
  return;
}

// Proceed with action
await window.firebaseDB.createTheory(data);
```

**Listen for auth state changes:**
```javascript
window.firebaseAuth.onAuthStateChanged((user) => {
  updateUI(user);
});
```

### 2. Database Reads

**Use pagination to reduce reads:**
```javascript
// Good: Load 20 at a time
const result = await window.firebaseDB.getAllTheories({ limit: 20 });

// Bad: Load all theories
const result = await window.firebaseDB.getAllTheories({ limit: 10000 });
```

**Cache results when possible:**
```javascript
let cachedTheories = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getTheories() {
  if (cachedTheories && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedTheories;
  }

  const result = await window.firebaseDB.getAllTheories();
  cachedTheories = result.theories;
  cacheTime = Date.now();

  return cachedTheories;
}
```

### 3. Image Uploads

**Validate before upload:**
```javascript
function validateImage(file) {
  // Check file exists
  if (!file) {
    return 'Please select an image';
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return 'Image must be under 5MB';
  }

  return null; // Valid
}

const error = validateImage(file);
if (error) {
  showErrorMessage(error);
  return;
}

// Proceed with upload
await window.firebaseStorage.uploadImage(file, theoryId);
```

**Show upload progress:**
```javascript
const progressBar = document.getElementById('upload-progress');

await window.firebaseStorage.uploadImage(file, theoryId, (progress) => {
  progressBar.value = progress;
  progressBar.textContent = `${progress}%`;
});
```

### 4. Error Handling

**Always handle errors gracefully:**
```javascript
const result = await window.firebaseDB.createTheory(data);

if (!result.success) {
  console.error('Error:', result.error);
  showUserFriendlyError(result.error);
  return;
}

// Success
```

### 5. Real-Time Updates

**Use Firestore listeners for real-time data:**
```javascript
// Listen for new comments
const unsubscribe = firebase.firestore()
  .collection('theories')
  .doc(theoryId)
  .collection('comments')
  .orderBy('createdAt', 'desc')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        displayComment(change.doc.data());
      }
    });
  });

// Clean up listener when done
unsubscribe();
```

---

## Code Examples

### Complete Theory Submission Flow

```javascript
// 1. Check authentication
if (!window.firebaseAuth.isLoggedIn()) {
  alert('Please sign in to submit a theory');
  window.firebaseAuth.signInWithGoogle();
  return;
}

// 2. Get form data
const formData = {
  title: document.getElementById('title').value,
  summary: document.getElementById('summary').value,
  content: document.getElementById('content').value,
  topic: document.getElementById('topic').value,
  subtopic: document.getElementById('subtopic').value,
  sources: document.getElementById('sources').value
};

// 3. Validate
if (!formData.title || !formData.summary || !formData.content) {
  alert('Please fill in all required fields');
  return;
}

// 4. Upload images (if any)
const imageUrls = [];
const imageInputs = document.querySelectorAll('.image-upload');

for (const input of imageInputs) {
  if (input.files[0]) {
    const result = await window.firebaseStorage.uploadImage(
      input.files[0],
      'temp-id', // Will update with real ID after creation
      (progress) => console.log(`Uploading: ${progress}%`)
    );

    if (result.success) {
      imageUrls.push(result.url);
    }
  }
}

// 5. Add images to rich content
formData.richContent = {
  images: imageUrls
};

// 6. Submit theory
const result = await window.firebaseDB.createTheory(formData);

if (result.success) {
  // 7. Redirect to view page
  window.location.href = `/theories/user-submissions/view.html?id=${result.theory.id}`;
} else {
  alert('Failed to create theory: ' + result.error);
}
```

### Browse Page with Filtering

```javascript
// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const topic = urlParams.get('topic');
const sortBy = urlParams.get('sort') || 'newest';

// Build filters
const filters = {
  sortBy: sortBy,
  limit: 20
};

if (topic) {
  filters.topic = topic;
}

// Load theories
const result = await window.firebaseDB.getAllTheories(filters);

if (result.success) {
  const container = document.getElementById('theories-container');

  result.theories.forEach(theory => {
    const card = createTheoryCard(theory);
    container.appendChild(card);
  });

  // Add "Load More" button if there are more results
  if (result.lastDoc) {
    addLoadMoreButton(result.lastDoc);
  }
} else {
  console.error('Failed to load theories:', result.error);
}

function createTheoryCard(theory) {
  const card = document.createElement('div');
  card.className = 'theory-card';
  card.innerHTML = `
    <h3>${escapeHtml(theory.title)}</h3>
    <p>${escapeHtml(theory.summary)}</p>
    <div class="theory-meta">
      <span>By ${escapeHtml(theory.authorName)}</span>
      <span>👍 ${theory.votes}</span>
      <span>👁️ ${theory.views}</span>
    </div>
  `;
  card.onclick = () => {
    window.location.href = `/theories/user-submissions/view.html?id=${theory.id}`;
  };
  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### View Page with Voting

```javascript
// Get theory ID from URL
const urlParams = new URLSearchParams(window.location.search);
const theoryId = urlParams.get('id');

// Load theory
const result = await window.firebaseDB.getTheory(theoryId);

if (result.success) {
  displayTheory(result.theory);

  // Increment view count
  await window.firebaseDB.incrementViewCount(theoryId);

  // Load comments
  loadComments(theoryId);

  // Check user's vote
  const user = window.firebaseAuth.getCurrentUser();
  if (user) {
    updateVoteButtons(result.theory.userVote);
  }
} else {
  document.getElementById('content').innerHTML = '<p>Theory not found</p>';
}

// Handle upvote
document.getElementById('upvote-btn').onclick = async () => {
  if (!window.firebaseAuth.isLoggedIn()) {
    alert('Please sign in to vote');
    return;
  }

  const result = await window.firebaseDB.voteTheory(theoryId, 1);

  if (result.success) {
    document.getElementById('vote-count').textContent = result.votes;
    updateVoteButtons(result.userVote);
  }
};

function updateVoteButtons(userVote) {
  document.getElementById('upvote-btn').classList.toggle('active', userVote === 1);
  document.getElementById('downvote-btn').classList.toggle('active', userVote === -1);
}
```

---

## Migration from localStorage

If migrating from the localStorage-based system, here's a comparison:

| localStorage API | Firebase API | Notes |
|-----------------|--------------|-------|
| `window.userAuth.signup()` | `window.firebaseAuth.signInWithGoogle()` | Google OAuth only |
| `window.userAuth.login()` | `window.firebaseAuth.signInWithGoogle()` | Same method |
| `window.userAuth.logout()` | `window.firebaseAuth.signOut()` | Similar |
| `window.userTheories.submitTheory()` | `window.firebaseDB.createTheory()` | Similar API |
| `window.userTheories.getAllTheories()` | `window.firebaseDB.getAllTheories()` | Now async |
| `window.userTheories.voteTheory()` | `window.firebaseDB.voteTheory()` | Similar |
| `localStorage.getItem('currentUser')` | `window.firebaseAuth.getCurrentUser()` | No localStorage |

**Key differences:**
- All Firebase methods are async (return Promises)
- No password management (handled by Google)
- Real-time updates available
- Data syncs across devices
- Requires internet connection

---

## Performance Optimization

### 1. Reduce Firestore Reads

**Use caching:**
```javascript
// Cache theories for 5 minutes
const cache = new Map();

async function getCachedTheory(id) {
  if (cache.has(id)) {
    const { theory, timestamp } = cache.get(id);
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return theory;
    }
  }

  const result = await window.firebaseDB.getTheory(id);
  cache.set(id, { theory: result.theory, timestamp: Date.now() });
  return result.theory;
}
```

### 2. Optimize Images

**Compress before upload:**
```javascript
async function compressImage(file, maxSizeMB = 1) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      const ratio = Math.min(1, Math.sqrt(maxSizeMB * 1024 * 1024 / file.size));
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Use before upload
const compressedFile = await compressImage(originalFile);
await window.firebaseStorage.uploadImage(compressedFile, theoryId);
```

### 3. Lazy Load Images

```javascript
// Use Intersection Observer for lazy loading
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

---

**API Reference Complete!** For setup instructions, see `FIREBASE_SETUP_GUIDE.md`. For deployment, see `DEPLOYMENT_GUIDE.md`.

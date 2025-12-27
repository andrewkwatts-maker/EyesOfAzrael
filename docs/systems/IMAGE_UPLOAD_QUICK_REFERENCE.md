# Image Upload - Quick Reference Guide

## Files Created

### Core Modules
- **`h:\Github\EyesOfAzrael\js\firebase-storage.js`** - Firebase Storage operations
- **`h:\Github\EyesOfAzrael\js\components\image-uploader.js`** - Drag-drop UI component
- **`h:\Github\EyesOfAzrael\css\image-uploader.css`** - Component styling

### Updated Files
- **`h:\Github\EyesOfAzrael\js\components\theory-editor.js`** - Integrated image uploader
- **`h:\Github\EyesOfAzrael\theories\user-submissions\submit.html`** - Added scripts and CSS

### Documentation
- **`h:\Github\EyesOfAzrael\IMAGE_UPLOAD_IMPLEMENTATION.md`** - Complete implementation guide
- **`h:\Github\EyesOfAzrael\UPLOAD_FLOW_DIAGRAM.md`** - Visual flow diagrams
- **`h:\Github\EyesOfAzrael\IMAGE_UPLOAD_QUICK_REFERENCE.md`** - This file

## Quick Start

### 1. Include Required Files

```html
<!-- CSS -->
<link rel="stylesheet" href="css/image-uploader.css">

<!-- Firebase SDK (when ready) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
<script src="js/firebase-config.js"></script>

<!-- Image Upload System -->
<script src="js/firebase-storage.js"></script>
<script src="js/components/image-uploader.js"></script>
<script src="js/components/theory-editor.js"></script>
```

### 2. Initialize Theory Editor

```javascript
// Get current user
const currentUser = window.userAuth?.getCurrentUser();

// Create editor with image uploader
const editor = new TheoryEditor(
    document.getElementById('editor-container'),
    null,  // initialData
    {
        userId: currentUser?.username,
        theoryId: null,
        useImageUploader: true  // Enable Firebase upload
    }
);
```

### 3. Handle Form Submission

```javascript
async function handleSubmit(e) {
    e.preventDefault();

    // Wait for pending uploads
    if (editor.hasPendingUploads()) {
        showMessage('Waiting for images to upload...');
        await editor.waitForUploads();
    }

    // Get data (includes uploaded Firebase URLs)
    const data = editor.getData();

    // Submit theory
    submitTheory(data);
}
```

## API Reference

### FirebaseStorage

```javascript
// Upload image
const result = await FirebaseStorage.uploadImage(file, {
    userId: 'user123',
    theoryId: 'theory456',
    onProgress: (percent) => console.log(`${percent}%`)
});
// Returns: { success: true, url: "...", path: "...", filename: "..." }

// Delete image
await FirebaseStorage.deleteImage(urlOrPath);

// Validate file
const valid = FirebaseStorage.validateFile(file);
// Returns: { valid: true } or { valid: false, error: "..." }

// Compress image
const blob = await FirebaseStorage.compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85
});

// Constants
FirebaseStorage.MAX_FILE_SIZE;    // 5242880 (5MB)
FirebaseStorage.ALLOWED_TYPES;    // ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
```

### ImageUploader

```javascript
// Create uploader
const uploader = new ImageUploader(container, {
    userId: 'user123',
    theoryId: null,
    multiple: true,
    maxFiles: 10,
    compress: true,
    onUploadComplete: (data) => {},
    onUploadError: (error) => {},
    onRemove: (id) => {}
});

// Get uploaded images
const images = uploader.getImages();
// Returns: [{ url, caption, alt, path }, ...]

// Check pending uploads
uploader.hasPendingUploads();  // boolean

// Wait for uploads
await uploader.waitForUploads();

// Load existing images
uploader.loadExistingImages([
    { url: '...', caption: '...', alt: '...' }
]);

// Reset
uploader.reset();
```

### TheoryEditor (Updated)

```javascript
// Constructor with options
new TheoryEditor(container, initialData, {
    userId: 'user123',
    theoryId: null,
    useImageUploader: true  // Default true
});

// Check for pending uploads
editor.hasPendingUploads();  // boolean

// Wait for uploads
await editor.waitForUploads();

// Get data (images from uploader)
const data = editor.getData();
// data.images contains Firebase URLs
```

## Storage Structure

```
Firebase Storage
└── theory-images/
    └── {userId}/
        ├── draft/
        │   ├── {timestamp}_{random}.jpg
        │   └── {timestamp}_{random}.png
        └── {theoryId}/
            ├── {timestamp}_{random}.jpg
            └── {timestamp}_{random}.png
```

## Image Data Format

### During Upload
```javascript
{
    id: "upload_1638461234567_abc123",
    url: "https://firebasestorage.googleapis.com/...",
    path: "theory-images/user123/draft/1638461234567_abc123.jpg",
    filename: "1638461234567_abc123.jpg",
    caption: "User-entered caption",
    alt: "User-entered alt text"
}
```

### In Theory Document
```javascript
{
    richContent: {
        images: [
            {
                url: "https://firebasestorage.googleapis.com/...",
                caption: "User-entered caption",
                alt: "User-entered alt text"
                // path is optional, stored for deletion
            }
        ]
    }
}
```

## Common Tasks

### Upload Single Image

```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await FirebaseStorage.uploadImage(file, {
    userId: getCurrentUserId(),
    theoryId: null,
    onProgress: (p) => updateProgressBar(p)
});

if (result.success) {
    console.log('URL:', result.url);
} else {
    console.error('Error:', result.error);
}
```

### Validate Before Upload

```javascript
const file = fileInput.files[0];
const validation = FirebaseStorage.validateFile(file);

if (!validation.valid) {
    alert(validation.error);
    return;
}

// Proceed with upload
```

### Wait for All Uploads Before Submit

```javascript
document.getElementById('submit-btn').addEventListener('click', async (e) => {
    e.preventDefault();

    if (editor.hasPendingUploads()) {
        const confirmWait = confirm('Images are still uploading. Wait for them to finish?');
        if (confirmWait) {
            await editor.waitForUploads();
        } else {
            return;
        }
    }

    submitForm();
});
```

### Remove Image from Storage

```javascript
const imageUrl = "https://firebasestorage.googleapis.com/...";

const result = await FirebaseStorage.deleteImage(imageUrl);

if (result.success) {
    console.log('Image deleted');
} else {
    console.error('Delete failed:', result.error);
}
```

### Compress Before Upload

```javascript
const file = fileInput.files[0];

// Compress
const compressed = await FirebaseStorage.compressImage(file);

// Upload compressed version
const result = await FirebaseStorage.uploadImage(
    new File([compressed], file.name, { type: file.type }),
    { userId: 'user123' }
);
```

## Error Handling

### Validation Errors

```javascript
// File too large
{ valid: false, error: "File too large. Maximum size: 5.0MB" }

// Invalid type
{ valid: false, error: "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/gif, image/webp" }

// No file
{ valid: false, error: "No file provided" }
```

### Upload Errors

```javascript
// Unauthorized
{ success: false, error: "You do not have permission to upload images" }

// Network error
{ success: false, error: "Network error occurred" }

// Quota exceeded
{ success: false, error: "Storage quota exceeded" }

// Not logged in
{ success: false, error: "User must be logged in to upload images" }
```

### Delete Errors

```javascript
// Not found
{ success: false, error: "Image not found" }

// Unauthorized
{ success: false, error: "You do not have permission to delete this image" }
```

## Validation Rules

### File Size
- **Maximum**: 5MB (5,242,880 bytes)
- **Compressed**: Automatically reduced if larger than 1920x1080
- **Quality**: 85% JPEG quality for compression

### File Types
- ✅ JPEG (image/jpeg, image/jpg)
- ✅ PNG (image/png)
- ✅ GIF (image/gif)
- ✅ WebP (image/webp)
- ❌ SVG, BMP, TIFF, etc.

### Upload Limits
- **Max files per theory**: 10 images
- **Concurrent uploads**: Unlimited (all parallel)
- **File naming**: Auto-generated (timestamp + random string)

## Firebase Storage Rules

```javascript
// Deployed to Firebase Storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /theory-images/{userId}/{theoryId}/{filename} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null
                    && request.auth.uid == userId;
    }
  }
}
```

## Styling Classes

### Dropzone States
```css
.image-uploader-dropzone          /* Default state */
.image-uploader-dropzone:hover    /* Hover state */
.image-uploader-dropzone.dragover /* Dragging file over */
```

### Preview Components
```css
.image-preview                /* Preview container */
.preview-image-container      /* Image wrapper */
.preview-image               /* Actual image */
.preview-overlay             /* Progress/error overlay */
.preview-progress            /* Progress container */
.progress-bar                /* Progress bar background */
.progress-fill              /* Progress bar fill */
.preview-fields             /* Caption/alt inputs */
.preview-input              /* Input fields */
.preview-remove-btn         /* Remove button */
```

### Error States
```css
.uploader-error             /* Error banner */
.preview-error              /* Error in preview */
.error-icon                 /* Error icon */
.error-text                 /* Error message */
```

## Debugging

### Check Firebase Initialization

```javascript
if (!window.firebase || !window.firebase.storage) {
    console.error('Firebase Storage not initialized');
}
```

### Check User Authentication

```javascript
if (!options.userId) {
    console.error('User ID required for uploads');
}
```

### Monitor Upload Progress

```javascript
FirebaseStorage.uploadImage(file, {
    userId: 'user123',
    onProgress: (percent) => {
        console.log(`Upload: ${Math.round(percent)}%`);
    }
});
```

### View Upload Metadata

```javascript
const metadata = await FirebaseStorage.getMetadata(downloadUrl);
console.log(metadata);
```

## Browser Console Helpers

```javascript
// Get uploader instance
const uploader = editor.imageUploader;

// Get all uploaded images
uploader.getImages();

// Check pending uploads
uploader.hasPendingUploads();

// Reset uploader
uploader.reset();

// Manual upload
const file = document.querySelector('input[type="file"]').files[0];
await uploader.uploadFile(file);
```

## Testing Checklist

- [ ] Upload JPG, PNG, GIF, WebP
- [ ] Drag and drop files
- [ ] Click to browse
- [ ] Multiple file upload
- [ ] File size validation (try > 5MB)
- [ ] File type validation (try PDF)
- [ ] Max files limit (try > 10)
- [ ] Progress bar shows correctly
- [ ] Caption and alt text save
- [ ] Remove button works
- [ ] Wait for uploads before submit
- [ ] Compress large images
- [ ] Error messages display
- [ ] Mobile responsive
- [ ] Slow network handling
- [ ] Network disconnect handling

## Next Steps

1. **Configure Firebase**
   - Create Firebase project
   - Enable Firebase Storage
   - Deploy storage rules

2. **Update submit.html**
   - Uncomment Firebase SDK script tags
   - Add firebase-config.js with credentials

3. **Test Upload Flow**
   - Upload test images
   - Verify storage structure
   - Test permissions

4. **Deploy**
   - Push to production
   - Monitor storage usage
   - Set up quota alerts

---

**Status**: Implementation Complete ✅
**Ready for**: Firebase Configuration & Testing
**Agent**: Agent 3 - Firebase Storage Image Upload

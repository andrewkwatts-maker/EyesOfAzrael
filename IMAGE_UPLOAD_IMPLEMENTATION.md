# Firebase Storage Image Upload Implementation

## Overview

This implementation provides a complete Firebase Storage-based image upload system for the Eyes of Azrael theory submission platform. It replaces the previous external URL input method with a robust drag-and-drop file upload interface.

## Architecture

### Component Structure

```
Firebase Storage Image Upload System
│
├── js/firebase-storage.js          - Core storage operations
├── js/components/image-uploader.js - UI component with drag-drop
├── css/image-uploader.css          - Component styling
├── js/components/theory-editor.js  - Integration with editor (updated)
└── theories/user-submissions/submit.html - Form page (updated)
```

### Data Flow

```
User Action
    │
    ├─> Drop/Select Image File
    │       │
    │       ├─> Client-side Validation (type, size)
    │       │       │
    │       │       ├─> Image Compression (optional)
    │       │       │       │
    │       │       │       └─> Firebase Storage Upload
    │       │       │               │
    │       │       │               ├─> Progress Tracking (0-100%)
    │       │       │               │
    │       │       │               └─> Get Download URL
    │       │       │                       │
    │       │       │                       └─> Store in Theory Data
    │       │       │
    │       │       └─> Show Error if Invalid
    │       │
    │       └─> Show Preview with Metadata Fields
    │
    └─> Submit Theory
            │
            ├─> Wait for Pending Uploads
            │
            └─> Submit with Firebase URLs
```

## Implementation Details

### 1. Firebase Storage Module (firebase-storage.js)

**Key Features:**
- Upload images to `/theory-images/{userId}/{theoryId}/{filename}`
- Client-side validation (max 5MB, images only)
- Automatic filename generation (timestamp + random string)
- Progress tracking with callbacks
- Image compression before upload
- Error handling with user-friendly messages
- Delete images from storage
- Get download URLs and metadata

**Storage Path Structure:**
```
theory-images/
├── {userId}/
│   ├── draft/
│   │   ├── 1638461234567_abc123.jpg
│   │   └── 1638461234568_def456.png
│   └── {theoryId}/
│       ├── 1638461234569_ghi789.jpg
│       └── 1638461234570_jkl012.png
```

**API:**
```javascript
// Upload image
const result = await FirebaseStorage.uploadImage(file, {
    userId: 'user123',
    theoryId: 'theory456',
    onProgress: (percent) => console.log(`${percent}% uploaded`)
});
// Returns: { success: true, url: "https://...", path: "...", filename: "..." }

// Delete image
await FirebaseStorage.deleteImage(downloadURL);

// Get download URL from path
const urlResult = await FirebaseStorage.getImageUrl(storagePath);

// Validate file
const validation = FirebaseStorage.validateFile(file);
// Returns: { valid: true } or { valid: false, error: "..." }

// Compress image
const compressed = await FirebaseStorage.compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85
});
```

### 2. Image Uploader Component (image-uploader.js)

**Key Features:**
- Drag-and-drop interface with visual feedback
- Click-to-browse fallback
- Multiple file upload support
- Real-time upload progress bars
- Image preview with caption/alt text fields
- Remove uploaded images
- Client-side image compression
- Automatic upload on file selection
- Pending upload tracking

**Usage:**
```javascript
// Initialize uploader
const uploader = new ImageUploader(containerElement, {
    userId: 'user123',
    theoryId: 'theory456',
    multiple: true,
    maxFiles: 10,
    compress: true,
    onUploadComplete: (imageData) => {
        console.log('Upload complete:', imageData);
    },
    onUploadError: (error) => {
        console.error('Upload error:', error);
    },
    onRemove: (uploadId) => {
        console.log('Image removed:', uploadId);
    }
});

// Get uploaded images
const images = uploader.getImages();
// Returns: [{ url, caption, alt, path }, ...]

// Check for pending uploads
if (uploader.hasPendingUploads()) {
    await uploader.waitForUploads();
}

// Load existing images (for editing)
uploader.loadExistingImages([
    { url: '...', caption: '...', alt: '...' }
]);

// Reset uploader
uploader.reset();
```

**HTML Attributes:**
```html
<!-- Auto-initialize on page load -->
<div data-image-uploader
     data-user-id="user123"
     data-theory-id="theory456"
     data-multiple="true"
     data-max-files="10"></div>
```

### 3. Theory Editor Integration (theory-editor.js)

**Updated Constructor:**
```javascript
const editor = new TheoryEditor(container, initialData, {
    userId: 'user123',
    theoryId: null,
    useImageUploader: true  // Enable Firebase upload (default: true)
});
```

**New Methods:**
```javascript
// Check for pending uploads
editor.hasPendingUploads();  // Returns boolean

// Wait for all uploads to complete
await editor.waitForUploads();  // Returns Promise

// Get data (images from uploader)
const data = editor.getData();
// images array now contains Firebase Storage URLs
```

### 4. Submission Flow (submit.html)

**Updated Submission Handler:**
```javascript
async function handleSubmit(e) {
    e.preventDefault();

    // Wait for pending uploads
    if (editor.hasPendingUploads()) {
        showError('Please wait for all images to finish uploading...');
        await editor.waitForUploads();
        showSuccess('All images uploaded. Submitting theory...');
    }

    // Get data (includes uploaded image URLs)
    const richContent = editor.getData();

    // Submit theory with Firebase Storage URLs
    const theoryData = {
        title,
        summary,
        richContent: {
            panels: richContent.panels,
            images: richContent.images,  // Contains Firebase URLs
            links: richContent.links,
            corpusSearches: richContent.corpusSearches
        },
        // ... other fields
    };

    const result = window.userTheories.submitTheory(theoryData);
}
```

## Upload Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Adds Image                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ImageUploader: Validate File                               │
│  - Check file type (JPG, PNG, GIF, WebP)                    │
│  - Check file size (max 5MB)                                │
│  - Check max files limit                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ImageUploader: Create Preview                              │
│  - Generate preview image                                   │
│  - Show progress bar (0%)                                   │
│  - Disable caption/alt inputs                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  FirebaseStorage: Compress Image (optional)                 │
│  - Resize to max 1920x1080                                  │
│  - Quality: 85%                                             │
│  - Only use if smaller than original                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  FirebaseStorage: Upload to Storage                         │
│  - Path: /theory-images/{userId}/{theoryId}/{filename}      │
│  - Track progress (update progress bar)                     │
│  - Handle errors (quota, network, permissions)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  FirebaseStorage: Get Download URL                          │
│  - Retrieve public HTTPS URL                                │
│  - Return to ImageUploader                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ImageUploader: Update Preview                              │
│  - Remove progress overlay                                  │
│  - Enable caption/alt inputs                                │
│  - Enable remove button                                     │
│  - Store URL in uploadedImages array                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                User Can Add More Images                      │
│                  or Submit Theory                            │
└─────────────────────────────────────────────────────────────┘
```

## Example Usage Code

### Basic Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="css/image-uploader.css">
</head>
<body>
    <div id="uploader-container"></div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
    <script src="js/firebase-config.js"></script>

    <!-- Image Upload Components -->
    <script src="js/firebase-storage.js"></script>
    <script src="js/components/image-uploader.js"></script>

    <script>
        const uploader = new ImageUploader(
            document.getElementById('uploader-container'),
            {
                userId: 'currentUser123',
                theoryId: null,
                multiple: true,
                maxFiles: 10,
                onUploadComplete: (data) => {
                    console.log('Uploaded:', data.url);
                }
            }
        );

        // Get uploaded images
        function getImages() {
            return uploader.getImages();
        }

        // Wait for uploads before submit
        async function submit() {
            if (uploader.hasPendingUploads()) {
                await uploader.waitForUploads();
            }
            const images = uploader.getImages();
            console.log('All images:', images);
        }
    </script>
</body>
</html>
```

### Integration with Theory Editor

```javascript
// Initialize editor with image uploader
const editor = new TheoryEditor(
    document.getElementById('editor-container'),
    null,
    {
        userId: currentUser.id,
        theoryId: null,
        useImageUploader: true
    }
);

// On form submit
async function handleSubmit(e) {
    e.preventDefault();

    // Wait for pending uploads
    if (editor.hasPendingUploads()) {
        alert('Waiting for image uploads to complete...');
        await editor.waitForUploads();
    }

    // Get all data including uploaded images
    const data = editor.getData();

    // data.images will contain:
    // [
    //   {
    //     url: "https://firebasestorage.googleapis.com/...",
    //     caption: "Optional caption",
    //     alt: "Alt text for accessibility",
    //     path: "theory-images/user123/theory456/timestamp_random.jpg"
    //   }
    // ]

    // Submit to your backend or Firestore
    submitTheory(data);
}
```

### Manual Upload (Without Component)

```javascript
// Select file
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

// Validate
const validation = FirebaseStorage.validateFile(file);
if (!validation.valid) {
    alert(validation.error);
    return;
}

// Upload with progress tracking
const result = await FirebaseStorage.uploadImage(file, {
    userId: 'user123',
    theoryId: 'theory456',
    onProgress: (percent) => {
        console.log(`Upload: ${Math.round(percent)}%`);
    }
});

if (result.success) {
    console.log('Download URL:', result.url);
    console.log('Storage path:', result.path);
} else {
    console.error('Error:', result.error);
}

// Delete later if needed
await FirebaseStorage.deleteImage(result.url);
```

## Security Rules

**Firebase Storage Rules (storage.rules):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Theory images
    match /theory-images/{userId}/{theoryId}/{filename} {
      // Anyone can read
      allow read: if true;

      // Only authenticated user can upload to their own folder
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                    && request.resource.contentType.matches('image/.*');

      // Only owner can delete
      allow delete: if request.auth != null
                    && request.auth.uid == userId;
    }
  }
}
```

## File Size Limits

- **Maximum file size**: 5MB per image
- **Recommended**: Images are automatically compressed to reduce size
- **Compression settings**:
  - Max width: 1920px
  - Max height: 1080px
  - JPEG quality: 85%
- **Supported formats**: JPEG, JPG, PNG, GIF, WebP

## Error Handling

The system handles various error scenarios:

### Validation Errors
- File too large (> 5MB)
- Invalid file type (not an image)
- Too many files (> max limit)

### Upload Errors
- Network errors
- Firebase quota exceeded
- Unauthorized (not logged in or wrong user)
- Storage permission denied

### User Feedback
All errors display user-friendly messages:
```javascript
{
  'storage/unauthorized': 'You do not have permission to upload images',
  'storage/canceled': 'Upload canceled',
  'storage/quota-exceeded': 'Storage quota exceeded',
  'storage/unknown': 'Network error occurred'
}
```

## Features Summary

### Completed Features
- ✅ Drag-and-drop image upload
- ✅ Click-to-browse fallback
- ✅ Multiple file support (up to 10 images)
- ✅ Real-time upload progress bars
- ✅ Client-side file validation (type, size)
- ✅ Automatic image compression
- ✅ Image preview before upload
- ✅ Caption and alt text fields
- ✅ Remove uploaded images
- ✅ Firebase Storage integration
- ✅ Unique filename generation
- ✅ Download URL management
- ✅ Error handling with user feedback
- ✅ Pending upload tracking
- ✅ Wait for uploads before submit
- ✅ Responsive design
- ✅ Theory editor integration
- ✅ Load existing images (for editing)

### Optional Enhancements (Not Implemented)
- Image cropping/editing before upload
- Thumbnail generation
- Image galleries with lightbox
- Batch upload with folder selection
- Paste image from clipboard
- Image URL fallback option

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (with touch gestures)

## Dependencies

- Firebase SDK (v10.7.1 or later)
  - firebase-app-compat.js
  - firebase-storage-compat.js
- Modern browser with:
  - File API
  - Canvas API (for compression)
  - FileReader API
  - Drag and Drop API

## Migration Path

To migrate from URL input to Firebase upload:

1. **Include Firebase SDK** in HTML
2. **Add CSS** for image uploader
3. **Include JavaScript modules** (firebase-storage.js, image-uploader.js)
4. **Update TheoryEditor** initialization with userId and useImageUploader: true
5. **Update form submission** to wait for pending uploads
6. **Deploy Firebase Storage rules** to allow authenticated uploads

## Performance Considerations

- Images are compressed client-side before upload (reduces bandwidth)
- Uploads happen immediately when file is selected (parallel to form filling)
- Progress tracking provides user feedback
- Pending uploads are tracked to prevent premature submission
- Download URLs are stored directly (no additional lookup needed)

## Testing Checklist

- [ ] Upload single image (various formats: JPG, PNG, GIF, WebP)
- [ ] Upload multiple images (2-10 images)
- [ ] Drag and drop image files
- [ ] Click to browse and select files
- [ ] Test file size validation (try > 5MB)
- [ ] Test file type validation (try PDF, TXT, etc.)
- [ ] Test max files limit (try > 10 images)
- [ ] Add caption and alt text to images
- [ ] Remove uploaded images
- [ ] Submit form with uploaded images
- [ ] Test pending upload warning
- [ ] Test upload progress bars
- [ ] Test compression (compare original vs uploaded size)
- [ ] Test on mobile devices
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test error handling (disconnect network during upload)
- [ ] Test Firebase permission rules
- [ ] Load existing images in edit mode

## Troubleshooting

### Images not uploading
- Check Firebase configuration is correct
- Verify user is logged in
- Check Firebase Storage rules are deployed
- Check browser console for errors
- Verify file size < 5MB and is valid image type

### Progress bar stuck at 0%
- Check network connection
- Verify Firebase Storage is enabled in Firebase Console
- Check browser console for permission errors

### Download URLs not working
- Verify Firebase Storage rules allow public read access
- Check if Firebase Storage bucket is configured correctly
- Ensure CORS is configured if accessing from different domain

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Firebase configuration
3. Check Firebase Storage rules
4. Review implementation documentation
5. Test with sample files

---

**Implementation Status**: Complete ✅
**Last Updated**: 2025-12-06
**Agent**: Agent 3 - Firebase Storage Image Upload

# Image Upload Flow Diagrams

## Complete Upload Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                            │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ├─────────────────┬──────────────────┐
                         ▼                 ▼                  ▼
              ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
              │  Drag & Drop     │ │ Click Zone   │ │  File Input      │
              │  Files on Zone   │ │ to Browse    │ │  (Auto-detect)   │
              └──────────┬───────┘ └──────┬───────┘ └──────┬───────────┘
                         │                 │                │
                         └─────────────────┴────────────────┘
                                           │
                                           ▼
                         ┌─────────────────────────────────────┐
                         │   ImageUploader.handleFiles()       │
                         └──────────────┬──────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────────────┐
                         │   FirebaseStorage.validateFile()    │
                         │   - Check file type                 │
                         │   - Check file size (< 5MB)         │
                         │   - Check max files limit           │
                         └──────────┬──────────────┬───────────┘
                                    │              │
                              VALID │              │ INVALID
                                    │              │
                                    ▼              ▼
                    ┌───────────────────┐    ┌──────────────────┐
                    │  Create Preview   │    │  Show Error      │
                    │  - Generate ID    │    │  - File too large│
                    │  - Show image     │    │  - Wrong type    │
                    │  - Progress: 0%   │    │  - Too many files│
                    │  - Disable inputs │    └──────────────────┘
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │  Optional: Compress     │
                    │  - Resize to 1920x1080  │
                    │  - Quality: 85%         │
                    │  - Use if smaller       │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────────────────────┐
                    │  FirebaseStorage.uploadImage()          │
                    │  - Generate unique filename             │
                    │  - Path: /theory-images/{user}/{theory}/│
                    │  - Upload with metadata                 │
                    └─────────┬───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐    ┌──────────────────┐
        │  Upload Progress │    │  Upload Error    │
        │  - Update bar    │    │  - Network fail  │
        │  - Show percent  │    │  - Unauthorized  │
        │  - onProgress()  │    │  - Quota exceeded│
        └─────────┬────────┘    └────────┬─────────┘
                  │                      │
                  │                      ▼
                  │            ┌──────────────────┐
                  │            │ Show Error in    │
                  │            │ Preview Overlay  │
                  │            └──────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │  Get Download URL       │
        │  - Public HTTPS URL     │
        │  - Return to uploader   │
        └─────────┬───────────────┘
                  │
                  ▼
        ┌─────────────────────────────┐
        │  Update Preview             │
        │  - Remove progress overlay  │
        │  - Enable caption input     │
        │  - Enable alt text input    │
        │  - Enable remove button     │
        │  - Store URL in array       │
        │  - onUploadComplete()       │
        └─────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────────┐
        │  User Can:                  │
        │  - Add caption/alt text     │
        │  - Remove image             │
        │  - Upload more images       │
        │  - Submit form              │
        └─────────────────────────────┘
```

## Form Submission Flow

```
┌────────────────────────────────────────┐
│  User Clicks "Submit Theory"           │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  handleSubmit(e)                                    │
│  - Prevent default                                  │
│  - Check editor.hasPendingUploads()                 │
└─────────────┬───────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌──────────┐      ┌──────────────────────┐
│ No       │      │ Yes - Pending Uploads│
│ Pending  │      └──────────┬───────────┘
│ Uploads  │                 │
└────┬─────┘                 ▼
     │            ┌──────────────────────────────┐
     │            │ Show Warning Message         │
     │            │ "Waiting for uploads..."     │
     │            └──────────┬───────────────────┘
     │                       │
     │                       ▼
     │            ┌──────────────────────────────┐
     │            │ await editor.waitForUploads()│
     │            │ - Poll every 100ms           │
     │            │ - Wait for all to complete   │
     │            └──────────┬───────────────────┘
     │                       │
     │                       ▼
     │            ┌──────────────────────────────┐
     │            │ Show Success Message         │
     │            │ "All images uploaded!"       │
     │            └──────────┬───────────────────┘
     │                       │
     └───────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Get Form Data                                      │
│  - Title, summary, sources                          │
│  - Related mythologies, tags                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Validate Editor                                    │
│  - editor.validate()                                │
└─────────────┬───────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌──────────┐      ┌──────────────┐
│ Invalid  │      │ Valid        │
│ - Show   │      └──────┬───────┘
│   Error  │             │
└──────────┘             ▼
              ┌──────────────────────────────┐
              │  Get Rich Content            │
              │  - editor.getData()          │
              │  - Includes uploaded images  │
              └──────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────────────┐
              │  Get Taxonomy Data           │
              │  - Topic, subtopic           │
              └──────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────────────┐
              │  Prepare Theory Data         │
              │  {                           │
              │    title,                    │
              │    summary,                  │
              │    richContent: {            │
              │      panels,                 │
              │      images: [               │
              │        {                     │
              │          url: "firebase...", │
              │          caption,            │
              │          alt                 │
              │        }                     │
              │      ],                      │
              │      links,                  │
              │      corpusSearches          │
              │    },                        │
              │    topic, subtopic,          │
              │    sources, tags             │
              │  }                           │
              └──────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────────────┐
              │  Submit Theory               │
              │  - userTheories.submitTheory │
              │  - Save to localStorage      │
              │    (or Firestore when ready) │
              └──────────┬───────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
    ┌──────────────┐      ┌──────────────────┐
    │ Success      │      │ Error            │
    │ - Show msg   │      │ - Show error msg │
    │ - Redirect   │      └──────────────────┘
    │   to browse  │
    └──────────────┘
```

## Component Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│                    PAGE LOAD                               │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│  Check Authentication                                      │
│  - Is user logged in?                                      │
└──────────────┬───────────────────────────────────┬─────────┘
               │                                   │
         NO    │                                   │ YES
               │                                   │
               ▼                                   ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│  Show Login Required     │      │  Initialize Form         │
│  - Hide submission form  │      │  - Get current user ID   │
│  - Show login button     │      └──────────┬───────────────┘
└──────────────────────────┘                 │
                                             ▼
                              ┌──────────────────────────────┐
                              │  Create TheoryEditor         │
                              │  new TheoryEditor(container, │
                              │    null,                     │
                              │    {                         │
                              │      userId: currentUserId,  │
                              │      theoryId: null,         │
                              │      useImageUploader: true  │
                              │    }                         │
                              │  )                           │
                              └──────────┬───────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────────┐
                              │  editor.init()               │
                              │  1. render()                 │
                              │  2. attachEventListeners()   │
                              │  3. initializeImageUploader()│
                              └──────────┬───────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────────┐
                              │  new ImageUploader()         │
                              │  - Create dropzone           │
                              │  - Attach drag/drop events   │
                              │  - Initialize arrays         │
                              │  - Load existing images      │
                              └──────────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────────┐
                              │  Ready for User Input        │
                              │  - Upload images             │
                              │  - Fill form fields          │
                              │  - Submit theory             │
                              └──────────────────────────────┘
```

## Image Removal Flow

```
┌────────────────────────────────┐
│  User Clicks "Remove" Button   │
└────────────────┬───────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  Confirm Removal                       │
│  "Remove this image? It will be        │
│   deleted from storage."               │
└─────────┬──────────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌──────────────────────┐
│ Cancel │  │ Confirm              │
└────────┘  └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │  Get Image Data              │
            │  - Find by upload ID         │
            │  - Get download URL          │
            └──────────┬───────────────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │  FirebaseStorage.deleteImage │
            │  - Delete from Firebase      │
            │  - Handle permissions        │
            └──────────┬───────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
┌─────────────────┐    ┌──────────────────┐
│ Success         │    │ Error            │
│ - Remove from   │    │ - Show error     │
│   array         │    │ - Keep in UI     │
│ - Remove DOM    │    └──────────────────┘
│ - Call onRemove │
│   callback      │
└─────────────────┘
```

## Data Structure Flow

```
┌────────────────────────────────────────────────────────────┐
│                   FILE OBJECT                              │
│  {                                                         │
│    name: "vacation-photo.jpg",                             │
│    type: "image/jpeg",                                     │
│    size: 3145728,  // 3MB                                  │
│    lastModified: 1638461234567                             │
│  }                                                         │
└──────────────────────┬─────────────────────────────────────┘
                       │ uploadImage()
                       ▼
┌────────────────────────────────────────────────────────────┐
│              FIREBASE STORAGE FILE                         │
│  Path: theory-images/user123/draft/1638461234567_abc.jpg  │
│  Metadata: {                                               │
│    contentType: "image/jpeg",                              │
│    customMetadata: {                                       │
│      originalName: "vacation-photo.jpg",                   │
│      uploadedBy: "user123",                                │
│      uploadedAt: "2025-12-06T10:30:00.000Z"                │
│    }                                                       │
│  }                                                         │
└──────────────────────┬─────────────────────────────────────┘
                       │ getDownloadURL()
                       ▼
┌────────────────────────────────────────────────────────────┐
│                 DOWNLOAD URL                               │
│  https://firebasestorage.googleapis.com/v0/b/...          │
│  /o/theory-images%2Fuser123%2Fdraft%2F...jpg?alt=media    │
└──────────────────────┬─────────────────────────────────────┘
                       │ Store in theory
                       ▼
┌────────────────────────────────────────────────────────────┐
│              IMAGE DATA IN THEORY                          │
│  {                                                         │
│    url: "https://firebasestorage.googleapis.com/...",     │
│    caption: "Our family vacation",                         │
│    alt: "Family at the beach",                             │
│    path: "theory-images/user123/draft/1638461234567..."   │
│  }                                                         │
└──────────────────────┬─────────────────────────────────────┘
                       │ Save theory
                       ▼
┌────────────────────────────────────────────────────────────┐
│              THEORY DOCUMENT                               │
│  {                                                         │
│    id: "theory-456",                                       │
│    title: "My Theory",                                     │
│    richContent: {                                          │
│      panels: [...],                                        │
│      images: [                                             │
│        {                                                   │
│          url: "https://firebasestorage...",                │
│          caption: "Our family vacation",                   │
│          alt: "Family at the beach"                        │
│        }                                                   │
│      ],                                                    │
│      links: [...],                                         │
│      corpusSearches: [...]                                 │
│    }                                                       │
│  }                                                         │
└────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────────────────────────┐
│          ERROR OCCURS                  │
└───────────────┬────────────────────────┘
                │
    ┌───────────┼───────────┬────────────┬────────────┐
    │           │           │            │            │
    ▼           ▼           ▼            ▼            ▼
┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│File    │ │Upload   │ │Network │ │Firebase  │ │Permission│
│Invalid │ │Too Large│ │Error   │ │Quota     │ │Denied    │
└───┬────┘ └────┬────┘ └───┬────┘ └────┬─────┘ └────┬─────┘
    │           │           │           │            │
    └───────────┴───────────┴───────────┴────────────┘
                            │
                            ▼
                ┌──────────────────────────┐
                │  Map to User Message     │
                │  - Friendly error text   │
                │  - Actionable feedback   │
                └──────────┬───────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
    ┌──────────────────┐  ┌──────────────────────┐
    │ Validation Error │  │  Upload Error        │
    │ - Show in banner │  │  - Show in preview   │
    │ - Auto-dismiss   │  │  - Allow retry/close │
    │   after 5s       │  │  - Keep preview      │
    └──────────────────┘  └──────────────────────┘
                │                     │
                └──────────┬──────────┘
                           │
                           ▼
                ┌──────────────────────────┐
                │  Log to Console          │
                │  - Full error details    │
                │  - Stack trace           │
                │  - Debug information     │
                └──────────────────────────┘
                           │
                           ▼
                ┌──────────────────────────┐
                │  Call Error Callback     │
                │  - onUploadError(error)  │
                │  - Allow custom handling │
                └──────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────┐
│      ImageUploader Component State      │
├─────────────────────────────────────────┤
│  uploadedImages: [                      │
│    {                                    │
│      id: "upload_123_abc",              │
│      url: "https://...",                │
│      path: "theory-images/...",         │
│      filename: "123_abc.jpg",           │
│      caption: "My caption",             │
│      alt: "Alt text"                    │
│    }                                    │
│  ]                                      │
│                                         │
│  pendingUploads: Map {                  │
│    "upload_456_def" => {                │
│      file: File {...},                  │
│      originalName: "image.jpg"          │
│    }                                    │
│  }                                      │
│                                         │
│  options: {                             │
│    userId: "user123",                   │
│    theoryId: null,                      │
│    multiple: true,                      │
│    maxFiles: 10,                        │
│    compress: true,                      │
│    onUploadComplete: Function,          │
│    onUploadError: Function,             │
│    onRemove: Function                   │
│  }                                      │
└─────────────────────────────────────────┘

State Transitions:
1. File Selected → Add to pendingUploads
2. Upload Started → Create preview with progress
3. Upload Progress → Update progress bar
4. Upload Complete → Remove from pendingUploads, Add to uploadedImages
5. Upload Error → Remove from pendingUploads, Show error in preview
6. Image Removed → Remove from uploadedImages, Delete from storage
```

---

These diagrams illustrate the complete flow of the image upload system, from user interaction through Firebase Storage to theory submission.

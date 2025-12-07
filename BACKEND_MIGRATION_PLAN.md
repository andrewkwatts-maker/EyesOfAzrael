# Backend Migration Plan - Firebase Integration

## 🎯 Objectives

1. **Move from localStorage to cloud database** (Firebase Firestore)
2. **Google Account Authentication** (Firebase Auth)
3. **Image/File Hosting** (Firebase Storage - 5GB free tier)
4. **Public viewing** (anyone can browse without login)
5. **Authenticated editing** (login required to submit/edit own theories)
6. **Ownership enforcement** (users can only edit their own theories)

## 🔧 Technology Stack

### Firebase (Google Cloud Platform)
**Why Firebase?**
- ✅ Free tier: 5GB storage, 1GB/day downloads, 20K/day writes
- ✅ Google OAuth built-in
- ✅ Real-time database (Firestore)
- ✅ CDN for images (Firebase Storage)
- ✅ Easy integration with Google Account
- ✅ No backend server code needed
- ✅ Automatic scaling
- ✅ Security rules for access control

**Free Tier Limits:**
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day, 20K deletes/day
- **Storage**: 5GB total, 1GB/day downloads, 20K/day uploads
- **Authentication**: Unlimited (free)
- **Hosting**: 10GB/month bandwidth

### Alternative Considered
- **Supabase**: Similar but smaller free tier (500MB storage)
- **AWS Amplify**: More complex setup
- **Google Drive API**: Not designed for this use case
- **Cloudinary**: Good for images but no database

**Winner: Firebase** - Best free tier, easiest Google integration, complete solution

## 📊 Architecture

### Current (localStorage)
```
Browser → localStorage
          ├── users (JSON)
          ├── userTheories (JSON)
          └── currentUser (JSON)
```

### New (Firebase)
```
Browser → Firebase Auth (Google OAuth)
          ├── User Authentication
          └── User Profile

        → Firestore Database
          ├── users/{userId}
          │   ├── username
          │   ├── email
          │   ├── avatar (Google photo)
          │   └── bio
          │
          └── theories/{theoryId}
              ├── title, summary, content
              ├── richContent (panels, links, corpus)
              ├── images (array of Storage URLs)
              ├── topic, subtopic
              ├── authorId, authorName, authorAvatar
              ├── votes, views, comments
              ├── createdAt, updatedAt
              └── status (draft, published)

        → Firebase Storage
          └── theory-images/{userId}/{theoryId}/{filename}
              (uploaded images, max 5MB each)
```

## 🔐 Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles
      allow read: if true;

      // Only authenticated user can create/update their own profile
      allow create, update: if request.auth != null
                            && request.auth.uid == userId;

      // Users cannot delete profiles
      allow delete: if false;
    }

    // Theories collection
    match /theories/{theoryId} {
      // Anyone can read published theories
      allow read: if resource.data.status == 'published';

      // Authenticated users can create theories
      allow create: if request.auth != null
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.status == 'published';

      // Only theory author can update their own theory
      allow update: if request.auth != null
                    && resource.data.authorId == request.auth.uid;

      // Only theory author can delete their own theory
      allow delete: if request.auth != null
                    && resource.data.authorId == request.auth.uid;
    }

    // Comments subcollection
    match /theories/{theoryId}/comments/{commentId} {
      // Anyone can read comments on published theories
      allow read: if true;

      // Authenticated users can create comments
      allow create: if request.auth != null
                    && request.resource.data.authorId == request.auth.uid;

      // Only comment author can delete their own comment
      allow delete: if request.auth != null
                    && resource.data.authorId == request.auth.uid;
    }

    // Votes subcollection
    match /theories/{theoryId}/votes/{userId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules
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

## 📝 Implementation Plan

### Phase 1: Firebase Setup
**Agent 1: Firebase Configuration**
- Create Firebase project at console.firebase.google.com
- Enable Google Authentication
- Set up Firestore database
- Enable Firebase Storage
- Configure security rules
- Create `firebase-config.js` with project credentials

### Phase 2: Authentication Migration
**Agent 2: Google OAuth Integration**
- Replace `user-auth.js` localStorage with Firebase Auth
- Implement Google Sign-In button
- Create user profile in Firestore on first login
- Sync user session across tabs using Firebase Auth state
- Add sign-out functionality
- Update auth modal to use Firebase

### Phase 3: Image Upload System
**Agent 3: Image Upload Component**
- Create `image-uploader.js` component
- Replace URL input with file upload in theory editor
- Upload images to Firebase Storage
- Get public download URLs
- Add upload progress indicator
- Handle errors (file too large, wrong type, etc.)
- Add image preview before upload

### Phase 4: Database Migration
**Agent 4: Firestore Integration**
- Replace `user-theories.js` localStorage with Firestore
- Migrate CRUD operations to Firestore
- Implement real-time listeners for theories
- Handle votes and comments as subcollections
- Add pagination for browse page (load 20 at a time)
- Implement search using Firestore queries

### Phase 5: Public Viewing
**Agent 5: Public Access Implementation**
- Update browse page to load theories without login
- Update view page for public viewing
- Hide vote/comment buttons if not logged in
- Show "Login to interact" messages
- Keep submission page login-protected

### Phase 6: Edit Restrictions
**Agent 6: Ownership Enforcement**
- Add "Edit" button on view page (only for author)
- Create edit page (duplicate of submit page)
- Load existing theory data into editor
- Verify ownership before saving
- Add "Delete" button with confirmation
- Implement soft delete (status = 'deleted')

### Phase 7: UI Updates
**Agent 7: Frontend Updates**
- Update all pages to use Firebase SDK
- Add loading states for async operations
- Add error handling and user feedback
- Update widgets to use Firestore
- Add "Sign in with Google" button
- Display Google profile pictures

### Phase 8: Migration Tool
**Agent 8: LocalStorage to Firebase Migration**
- Create migration script to import existing data
- Read localStorage theories
- Upload to Firestore with current user as author
- Upload placeholder images
- Preserve votes, comments, metadata
- Generate migration report

### Phase 9: Testing
**Agent 9: Integration Testing**
- Test Google sign-in flow
- Test image upload (various sizes, types)
- Test theory submission end-to-end
- Test public viewing (incognito mode)
- Test edit restrictions (try editing other user's theory)
- Test real-time updates (multiple tabs)
- Load testing (100+ theories)

### Phase 10: Documentation & Deployment
**Agent 10: Deployment Setup**
- Create Firebase deployment guide
- Update README with Firebase setup instructions
- Create environment variable template
- Document free tier limitations
- Create monitoring dashboard
- Set up Firebase Hosting (optional)

## 🗂️ Files to Create

### Configuration
- `firebase-config.js` - Firebase project configuration
- `.firebaserc` - Firebase project settings
- `firebase.json` - Firebase hosting/rules config
- `firestore.rules` - Database security rules
- `storage.rules` - Storage security rules
- `.env.template` - Environment variables template

### JavaScript Modules
- `js/firebase-init.js` - Firebase initialization
- `js/firebase-auth.js` - Authentication with Google OAuth
- `js/firebase-db.js` - Firestore database operations
- `js/firebase-storage.js` - Storage operations
- `js/components/image-uploader.js` - Image upload component
- `js/components/google-signin-button.js` - Google sign-in UI

### Updated Files
- `js/user-theories.js` → Use Firestore instead of localStorage
- `js/user-auth.js` → Use Firebase Auth instead of localStorage
- `theories/user-submissions/submit.html` → Add image uploader
- `theories/user-submissions/browse.html` → Public access, pagination
- `theories/user-submissions/view.html` → Edit/delete buttons
- `theories/user-submissions/edit.html` → New edit page

### Documentation
- `FIREBASE_SETUP_GUIDE.md` - Step-by-step Firebase setup
- `MIGRATION_GUIDE.md` - How to migrate from localStorage
- `API_REFERENCE.md` - Firebase integration API docs

## 📦 NPM Packages (if using build system)

If using a build system:
```json
{
  "dependencies": {
    "firebase": "^10.7.1"
  }
}
```

For CDN (no build system):
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
```

## 🚀 Deployment Checklist

### Before Going Live
- [ ] Firebase project created
- [ ] Google OAuth enabled
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] Test Google sign-in
- [ ] Test image upload (max 5MB)
- [ ] Test theory submission
- [ ] Test public viewing (incognito)
- [ ] Test edit restrictions
- [ ] Migrate existing localStorage data
- [ ] Update all hardcoded URLs
- [ ] Test on mobile devices
- [ ] Set up Firebase Analytics (optional)
- [ ] Configure custom domain (optional)

### Free Tier Monitoring
- Monitor daily read/write quotas in Firebase Console
- Set up quota alerts
- Optimize queries to reduce reads
- Implement caching where possible
- Add pagination to reduce data transfer

## ⚠️ Limitations & Considerations

### Free Tier Limits
- **Max 5GB total images**: ~1000 high-quality images or ~5000 thumbnails
- **Max 20K writes/day**: ~833 theories/day or ~20K comments/day
- **Max 50K reads/day**: ~2500 unique visitors/day viewing 20 theories each

### If Limits Exceeded
- Upgrade to Blaze plan (pay-as-you-go)
- Optimize image sizes (compress, thumbnails)
- Implement aggressive caching
- Use pagination everywhere
- Consider CDN for images

### User Quota Management (Optional)
- Limit users to 10 theories each
- Limit images to 10 per theory
- Limit image size to 2MB (instead of 5MB)
- Implement rate limiting (1 theory/hour per user)

## 🔄 Migration Path

### For Existing Users
1. Users with localStorage data see banner: "Migrate your theories to cloud"
2. Click "Migrate Now" → Prompts Google sign-in
3. After sign-in, migration script runs automatically
4. All theories uploaded to Firestore under their Google account
5. localStorage data preserved as backup for 30 days
6. Success message: "X theories migrated successfully"

### For New Users
- Clean slate - only Firebase, no localStorage
- Sign in with Google to start
- No migration needed

## 📈 Success Metrics

### Technical
- [ ] 100% of features work with Firebase
- [ ] Page load time < 2s
- [ ] Image upload time < 3s per image
- [ ] Real-time updates work across tabs
- [ ] No Firebase quota errors

### User Experience
- [ ] One-click Google sign-in
- [ ] Drag-and-drop image upload
- [ ] Instant theory publishing
- [ ] Public browsing works without login
- [ ] Edit own theories seamlessly

## 🎯 Next Steps

1. **User confirms plan** ✋ (YOU ARE HERE)
2. **Create Firebase project** (manual setup in console)
3. **Spin off 10 agents** to implement phases 1-10
4. **Test integration** thoroughly
5. **Migrate existing data**
6. **Deploy to production**

---

**Estimated Time**: 10 agents working in parallel, ~2-3 hours total
**Free Tier**: Should support 100s of users and 1000s of theories
**Scalability**: Easy upgrade path to paid tier if needed

Ready to proceed? I'll spin off the agents to implement this complete migration.

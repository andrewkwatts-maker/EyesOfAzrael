# Firebase Deployment Checklist
## Eyes of Azrael User Theories System

This checklist provides step-by-step deployment instructions for the Eyes of Azrael Firebase backend. Follow these steps in order to ensure a smooth deployment.

---

## Pre-Deployment Checklist

Before you begin deploying, ensure you've completed these prerequisites:

### Configuration

- [ ] **Firebase project created** in Firebase Console
- [ ] **Firebase CLI installed**: `npm install -g firebase-tools`
- [ ] **Logged in to Firebase CLI**: `firebase login`
- [ ] **firebase-config.js updated** with your project credentials
- [ ] **.firebaserc updated** with your project ID
- [ ] **All placeholder values replaced** in configuration files

### Local Testing

- [ ] **Authentication tested** locally (Google sign-in works)
- [ ] **Theory creation tested** locally (theories save to Firestore)
- [ ] **Image upload tested** locally (images save to Storage)
- [ ] **Browse & view tested** locally (theories display correctly)
- [ ] **No console errors** when running locally

### Security

- [ ] **firebase-config.js added to .gitignore** (NOT committed to Git)
- [ ] **Security rules reviewed** (firestore.rules and storage.rules)
- [ ] **Test mode disabled** (using production security rules)

---

## Deployment Steps

### Step 1: Deploy Firestore Security Rules

Deploy your database security rules to protect user data.

#### Command:

```bash
firebase deploy --only firestore:rules
```

#### Expected Output:

```
=== Deploying to 'your-project-id'...

i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to cloud.firestore

✔  Deploy complete!
```

#### Verification:

1. Go to Firebase Console > Firestore Database > Rules
2. Verify the rules match your local `firestore.rules` file
3. Check that the publish date is recent

#### Common Issues:

- **Error: "Resource not found"**
  - Solution: Make sure Firestore database is created in Firebase Console

- **Error: "Permission denied"**
  - Solution: Run `firebase login` and ensure you have project access

---

### Step 2: Deploy Storage Security Rules

Deploy your cloud storage security rules to protect uploaded images.

#### Command:

```bash
firebase deploy --only storage:rules
```

#### Expected Output:

```
=== Deploying to 'your-project-id'...

i  deploying storage
i  storage: checking storage.rules for compilation errors...
✔  storage: rules file storage.rules compiled successfully
i  storage: uploading rules storage.rules...
✔  storage: released rules storage.rules

✔  Deploy complete!
```

#### Verification:

1. Go to Firebase Console > Storage > Rules
2. Verify the rules match your local `storage.rules` file
3. Check that the publish date is recent

#### Common Issues:

- **Error: "Storage bucket not found"**
  - Solution: Make sure Storage is set up in Firebase Console

---

### Step 3: Deploy Firestore Indexes (Optional)

If you have complex queries, deploy custom indexes.

#### Command:

```bash
firebase deploy --only firestore:indexes
```

#### Expected Output:

```
=== Deploying to 'your-project-id'...

i  deploying firestore
i  firestore: checking firestore.indexes.json for compilation errors...
✔  firestore: compiled firestore.indexes.json successfully
i  firestore: uploading indexes...
✔  firestore: deployed indexes to cloud.firestore

✔  Deploy complete!
```

#### Verification:

1. Go to Firebase Console > Firestore Database > Indexes
2. Wait for indexes to finish building (can take several minutes)
3. Check that all indexes show "Enabled" status

#### When to Use:

- You have queries with multiple `where` clauses
- You're using `orderBy` with `where`
- Firebase Console shows "index required" errors

---

### Step 4: Deploy to Firebase Hosting

Deploy your website to Firebase's global CDN.

#### Command:

```bash
firebase deploy --only hosting
```

#### Expected Output:

```
=== Deploying to 'your-project-id'...

i  deploying hosting
i  hosting[your-project-id]: beginning deploy...
i  hosting[your-project-id]: found 150 files in .
✔  hosting[your-project-id]: file upload complete
i  hosting[your-project-id]: finalizing version...
✔  hosting[your-project-id]: version finalized
i  hosting[your-project-id]: releasing new version...
✔  hosting[your-project-id]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

#### Verification:

1. Visit your hosting URL: `https://your-project-id.web.app`
2. Test authentication (Google sign-in)
3. Test theory creation
4. Test image upload
5. Test browse & view pages

#### Common Issues:

- **Error: "firebase.json not found"**
  - Solution: Make sure you're in the project root directory

- **Files not updating:**
  - Solution: Clear browser cache or use incognito mode
  - Solution: Wait 5-10 minutes for CDN propagation

---

### Step 5: Deploy Everything (Full Deployment)

Deploy all Firebase services at once.

#### Command:

```bash
firebase deploy
```

#### What Gets Deployed:

- Firestore security rules
- Firestore indexes
- Storage security rules
- Hosting files

#### Expected Output:

```
=== Deploying to 'your-project-id'...

i  deploying firestore, storage, hosting
[... deployment progress ...]
✔  firestore: deployed rules
✔  firestore: deployed indexes
✔  storage: deployed rules
✔  hosting: deployed files

✔  Deploy complete!
```

#### When to Use:

- First-time deployment
- Major updates affecting multiple services
- After making changes to rules, indexes, and code

---

## Post-Deployment Testing

After deployment, thoroughly test all features on your live site.

### Test Authentication

- [ ] **Open your live site** (`https://your-project-id.web.app`)
- [ ] **Click "Sign in with Google"**
- [ ] **Verify successful login** (profile picture appears)
- [ ] **Check browser console** for errors (should be none)
- [ ] **Test logout** (profile disappears)

### Test Theory Creation

- [ ] **Navigate to submit page** (`/theories/user-submissions/submit.html`)
- [ ] **Fill out theory form** with sample data
- [ ] **Add an image** (test image upload)
- [ ] **Submit theory**
- [ ] **Verify success message** appears
- [ ] **Check Firestore** in Firebase Console for new theory document
- [ ] **Check Storage** in Firebase Console for uploaded image

### Test Theory Browsing

- [ ] **Navigate to browse page** (`/theories/user-submissions/browse.html`)
- [ ] **Verify theories display** in the list
- [ ] **Test filtering** (by topic, author, etc.)
- [ ] **Test sorting** (newest, popular, etc.)
- [ ] **Click on a theory** to view details

### Test Theory Viewing

- [ ] **Theory details page loads** correctly
- [ ] **All content displays** (title, summary, panels, images)
- [ ] **Images load** from Firebase Storage
- [ ] **Vote buttons work** (if logged in)
- [ ] **Comments section** displays correctly
- [ ] **Add a comment** (test comment creation)

### Test Theory Editing (Owner Only)

- [ ] **Navigate to a theory you own**
- [ ] **Click "Edit Theory"**
- [ ] **Make changes** to content
- [ ] **Save changes**
- [ ] **Verify updates** appear on view page
- [ ] **Check Firestore** for updated data

### Test Theory Deletion (Owner Only)

- [ ] **Create a test theory**
- [ ] **Click "Delete Theory"**
- [ ] **Confirm deletion** in modal
- [ ] **Verify theory removed** from Firestore
- [ ] **Verify images deleted** from Storage (if applicable)

---

## Performance Optimization

After deployment, optimize your site for better performance.

### Enable Firestore Offline Persistence

Already enabled in `firebase-config.js`:

```javascript
db.enablePersistence({ synchronizeTabs: true })
```

This allows users to:
- Browse theories offline
- Make changes while offline
- Sync automatically when back online

### Set Up Firestore Indexes

Monitor Firebase Console for "Index Required" warnings:

1. Go to Firestore Database > Indexes
2. Click "Create Index" for any recommended indexes
3. Or manually add to `firestore.indexes.json` and redeploy

### Optimize Image Storage

**Compress images before upload:**
- Use browser-side compression (already implemented)
- Limit image size to 5MB (enforced in storage rules)

**Consider image optimization:**
- Generate thumbnails for browse view
- Use WebP format for better compression
- Implement lazy loading

### Monitor Performance

1. Go to Firebase Console > Performance Monitoring
2. Set up performance monitoring (optional):
   ```bash
   firebase deploy --only hosting
   ```
3. Monitor page load times and network requests

---

## Monitoring & Maintenance

### Set Up Usage Alerts

1. Go to Firebase Console > Usage and Billing
2. Click "Details & Settings"
3. Set budget alerts:
   - **Firestore reads:** Alert at 80% of daily limit
   - **Storage downloads:** Alert at 80% of daily limit
   - **Authentication:** Alert at 2,000 phone auths/month

### Monitor Quotas

Check daily usage:
- Firebase Console > Firestore Database > Usage
- Firebase Console > Storage > Usage
- Firebase Console > Authentication > Users

**Free Tier Limits:**
- Firestore: 50K reads/day, 20K writes/day
- Storage: 1GB downloads/day
- Authentication: Unlimited users

### Review Security Rules

Regularly review and update security rules:

```bash
# Test rules locally
firebase emulators:start --only firestore,storage

# Deploy updated rules
firebase deploy --only firestore:rules,storage:rules
```

### Backup Your Data

**Manual Backup (Firestore):**
1. Firebase Console > Firestore Database
2. Click "Import/Export"
3. Export to Cloud Storage bucket

**Automated Backup:**
- Set up scheduled exports (Blaze plan required)
- Use Cloud Functions to trigger exports

---

## Rollback Procedures

If something goes wrong after deployment:

### Rollback Firestore Rules

1. Go to Firebase Console > Firestore Database > Rules
2. Click "History" tab
3. Select a previous version
4. Click "Publish"

### Rollback Storage Rules

1. Go to Firebase Console > Storage > Rules
2. Click "Edit rules"
3. Copy previous version from Git history
4. Publish

### Rollback Hosting

```bash
# View deployment history
firebase hosting:channel:list

# Deploy previous version
firebase hosting:channel:deploy <channel-id>
```

Or use Firebase Console:
1. Hosting > Release History
2. Click "..." on previous release
3. Select "Restore"

---

## Troubleshooting Common Issues

### Issue: "Failed to get document because the client is offline"

**Cause:** Firestore offline persistence issue

**Solution:**
1. Clear browser cache and cookies
2. Disable browser extensions
3. Check network connection
4. Verify Firestore rules allow reads

### Issue: "storage/unauthorized" when uploading images

**Cause:** Storage rules not deployed or incorrect

**Solution:**
1. Run: `firebase deploy --only storage:rules`
2. Verify rules in Firebase Console > Storage > Rules
3. Check that user is authenticated

### Issue: Theories not appearing in browse page

**Cause:** Firestore rules blocking reads or no published theories

**Solution:**
1. Check Firestore Console > Data for theories
2. Verify theory `status` is "published"
3. Check browser console for permission errors
4. Redeploy Firestore rules

### Issue: Authentication popup blocked

**Cause:** Browser blocking popups

**Solution:**
1. Allow popups for your domain
2. Add domain to Firebase Console > Authentication > Authorized domains
3. Use redirect method instead of popup (code change required)

---

## Custom Domain Setup (Optional)

### Prerequisites

- Own a domain name
- Access to domain DNS settings

### Steps

1. **Add Custom Domain:**
   ```bash
   firebase hosting:channel:deploy production --only hosting
   ```

2. **Firebase Console Setup:**
   - Go to Hosting > Advanced
   - Click "Add custom domain"
   - Enter your domain (e.g., `eyesofazrael.com`)
   - Follow DNS verification steps

3. **Update DNS Records:**
   - Add A records provided by Firebase
   - Wait for DNS propagation (up to 24 hours)

4. **Update Authorized Domains:**
   - Firebase Console > Authentication > Settings
   - Add your custom domain to authorized domains

5. **Test:**
   - Visit `https://your-domain.com`
   - Verify SSL certificate is active
   - Test all functionality

---

## Continuous Deployment (Optional)

### Set Up GitHub Actions

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### Set Up Service Account

1. Firebase Console > Project Settings > Service Accounts
2. Generate new private key
3. Add to GitHub repository secrets as `FIREBASE_SERVICE_ACCOUNT`

---

## Final Checklist

Before marking deployment as complete:

- [ ] All security rules deployed and verified
- [ ] Hosting deployed to Firebase
- [ ] Authentication tested on live site
- [ ] Theory CRUD operations tested
- [ ] Image uploads tested
- [ ] Comments tested
- [ ] No console errors on live site
- [ ] Usage alerts configured
- [ ] Backup strategy in place
- [ ] Custom domain configured (if applicable)
- [ ] Team members notified of deployment
- [ ] Documentation updated

---

## Need Help?

**Firebase Support:**
- Documentation: https://firebase.google.com/docs
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase
- Firebase Community: https://firebase.google.com/community

**Project-Specific:**
- Review `FIREBASE_SETUP_INSTRUCTIONS.md`
- Check `FIREBASE_TESTING_CHECKLIST.md`
- Review browser console errors
- Check Firebase Console logs

---

**Congratulations!** Your Eyes of Azrael user theories system is now live on Firebase!

---

*Last updated: 2025-12-07*
*Firebase Hosting URL: https://your-project-id.web.app*

# Deployment Quick Start Guide

Get up and running with deployments in 5 minutes.

## Prerequisites

```bash
# Install Node.js (v18+)
node --version

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login
```

## First-Time Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael
npm install
```

### 2. Firebase Configuration

```bash
# Initialize Firebase
firebase init

# Select:
# - Hosting
# - Firestore
# - Storage
# - Functions (optional)

# Link to your project
firebase use --add
```

### 3. Make Scripts Executable

```bash
# On Linux/Mac
chmod +x build.sh test.sh deploy.sh rollback.sh

# On Windows (use Git Bash or WSL)
# Or just run: bash build.sh
```

## Quick Deployment

### Option 1: Full Automated Deployment

```bash
./deploy.sh
```

This will:
1. Run all tests
2. Build for production
3. Deploy to Firebase
4. Create backup

### Option 2: Manual Step-by-Step

```bash
# Step 1: Build
./build.sh

# Step 2: Test
./test.sh

# Step 3: Deploy
firebase deploy
```

### Option 3: Staging Deployment

```bash
./deploy.sh staging
```

## Common Commands

```bash
# Build only
./build.sh

# Test only
./test.sh

# Deploy to production
./deploy.sh

# Deploy to staging
./deploy.sh staging

# Skip tests (use with caution)
./deploy.sh production true

# Rollback deployment
./rollback.sh

# Test locally
firebase serve

# View deployment history
firebase hosting:releases:list
```

## GitHub Actions (CI/CD)

### Setup

1. **Add Firebase Service Account to GitHub Secrets**

   ```bash
   # Generate service account key
   # Firebase Console → Project Settings → Service Accounts → Generate Key

   # Add to GitHub:
   # Settings → Secrets → New repository secret
   # Name: FIREBASE_SERVICE_ACCOUNT
   # Value: [paste entire JSON]
   ```

2. **Add Project ID**

   ```bash
   # Settings → Secrets → New repository secret
   # Name: FIREBASE_PROJECT_ID
   # Value: your-project-id
   ```

3. **Push to Trigger Deployment**

   ```bash
   git push origin main
   # Automatically deploys to production

   # Or create PR to deploy preview
   git checkout -b feature/my-feature
   git push origin feature/my-feature
   # Create PR → preview deployed
   ```

## Monitoring

### View Logs

```bash
# Firebase Functions logs
firebase functions:log

# Hosting deployments
firebase hosting:releases:list
```

### Check Status

1. **Firebase Console**: https://console.firebase.google.com
2. **Google Analytics**: https://analytics.google.com
3. **Sentry** (if configured): https://sentry.io

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
./build.sh
```

### Tests Fail

```bash
# Run tests with verbose output
npm run generate-indices
./test.sh
```

### Deployment Fails

```bash
# Check Firebase login
firebase login --reauth

# Verify project
firebase projects:list
firebase use your-project-id

# Try deploying specific components
firebase deploy --only hosting
```

### Need to Rollback

```bash
./rollback.sh
# Choose option 1 for quick rollback
```

## File Structure

```
EyesOfAzrael/
├── build.sh              # Build script
├── test.sh               # Test script
├── deploy.sh             # Deployment script
├── rollback.sh           # Rollback script
├── .github/
│   └── workflows/
│       ├── deploy.yml    # CI/CD workflow
│       └── tests.yml     # Test workflow
├── firebase.json         # Firebase config
├── firestore.rules       # Firestore security
├── storage.rules         # Storage security
└── DEPLOYMENT.md         # Full deployment guide
```

## Next Steps

1. ✅ Read full [DEPLOYMENT.md](DEPLOYMENT.md)
2. ✅ Set up [monitoring-setup.md](monitoring-setup.md)
3. ✅ Review [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)
4. ✅ Test deployment to staging
5. ✅ Deploy to production

## Support

- **Documentation**: See DEPLOYMENT.md
- **Issues**: Create GitHub issue
- **Firebase**: https://firebase.google.com/support

---

**Version:** 1.0.0
**Last Updated:** 2025-12-27

# Firebase Migration Quick Start

**5-minute guide to migrating mythology content to Firebase.**

## Prerequisites Checklist

- [ ] Node.js 16+ installed
- [ ] Firebase project created
- [ ] Service account key downloaded
- [ ] Dependencies installed

## Setup (First Time Only)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Download your service account key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Settings (⚙️) → Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save as `firebase-service-account.json` in project root

### 3. Verify Setup
```bash
npm run migrate:verify
```

If all checks pass ✅, you're ready!

## Quick Commands

### Test Single Page
```bash
npm run migrate:test
```
Preview Zeus page migration without writing to database.

### Test One Mythology (Dry Run)
```bash
node scripts/migrate-to-firebase-assets.js --mythology greek --dry-run
```

### Migrate One Mythology (Live)
```bash
node scripts/migrate-to-firebase-assets.js --mythology greek
```

### Migrate Everything (Dry Run)
```bash
npm run migrate:dry-run
```

### Migrate Everything (Live)
```bash
npm run migrate
```

## Recommended Workflow

### Phase 1: Testing (Day 1)
```bash
# 1. Verify setup
npm run migrate:verify

# 2. Test single page
npm run migrate:test

# 3. Review output in console

# 4. Test one mythology (dry run)
node scripts/migrate-to-firebase-assets.js --mythology mayan --dry-run

# 5. Review migration-report-*.html
```

### Phase 2: Small Migration (Day 2)
```bash
# 1. Migrate smallest mythology (live)
node scripts/migrate-to-firebase-assets.js --mythology mayan

# 2. Check Firestore console
# - Verify assets collection
# - Check document structure
# - Validate richContent panels

# 3. Review migration report

# 4. If issues found:
#    - Update migration-config.js
#    - Delete test documents
#    - Re-run migration
```

### Phase 3: Incremental Migration (Week 1)
```bash
# Migrate one mythology per day:

# Monday
node scripts/migrate-to-firebase-assets.js --mythology greek

# Tuesday
node scripts/migrate-to-firebase-assets.js --mythology norse

# Wednesday
node scripts/migrate-to-firebase-assets.js --mythology egyptian

# Thursday
node scripts/migrate-to-firebase-assets.js --mythology babylonian

# Friday
node scripts/migrate-to-firebase-assets.js --mythology celtic
```

### Phase 4: Full Migration (Week 2)
```bash
# Migrate remaining mythologies
node scripts/migrate-to-firebase-assets.js --mythology hindu
node scripts/migrate-to-firebase-assets.js --mythology buddhist
node scripts/migrate-to-firebase-assets.js --mythology jewish
node scripts/migrate-to-firebase-assets.js --mythology christian
# etc.

# Or migrate all at once:
npm run migrate
```

## Common Issues & Fixes

### Issue: Firebase Connection Error
```
Error: Failed to initialize Firebase
```
**Fix**: Ensure `firebase-service-account.json` is in project root.

### Issue: Permission Denied
```
Error: Missing or insufficient permissions
```
**Fix**: Update Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /assets/{assetId} {
      allow read: if true;
      allow write: if true; // Temporarily allow for migration
    }
  }
}
```

### Issue: Could Not Detect Mythology
```
Error: Could not detect mythology from path
```
**Fix**: File is in wrong location or path doesn't match patterns.
- Check file is in `/mythos/{mythology}/` structure
- Verify mythology name matches config patterns

### Issue: Validation Failed - Summary Too Short
```
Error: Summary too short (12 chars, min 50)
```
**Fix**: Page doesn't have enough content.
- Add more content to HTML page
- Or manually create asset for this page

## Monitoring Migration

### Real-Time Progress
The script shows:
- Progress bar with current file
- Running count of successful/failed
- Immediate errors in console

### Post-Migration Reports

**HTML Report** (`migration-report-*.html`):
- Visual summary with statistics
- List of all errors
- Easy to share with team

**Error Log** (`migration-errors.log`):
- Detailed error messages
- File paths for all failures
- Stack traces where available

**Progress File** (`migration-progress.json`):
- List of successfully processed files
- Used for resume capability
- Can delete to start fresh

## Verification After Migration

### 1. Check Firestore Console
```
Firebase Console → Firestore Database → assets collection
```
Verify:
- [ ] Total document count matches expected
- [ ] Documents have correct structure
- [ ] richContent.panels array exists
- [ ] metadata fields populated

### 2. Query Sample Documents
```javascript
// Get random deity
db.collection('assets')
  .where('assetType', '==', 'deity')
  .where('mythology', '==', 'greek')
  .limit(1)
  .get()
```

### 3. Test Frontend Integration
Load assets in your app to ensure:
- [ ] Panels render correctly
- [ ] Icons display
- [ ] Links work
- [ ] Grid layouts proper

## Rollback Strategy

If migration has issues:

### Option 1: Delete and Re-Run
```javascript
// In Firebase Console or via script
db.collection('assets')
  .where('migratedAt', '>', startTime)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => doc.ref.delete());
  });
```

### Option 2: Resume from Last Good Point
```bash
# Edit migration-progress.json
# Remove files you want to re-process
# Then run:
node scripts/migrate-to-firebase-assets.js --all --resume
```

## Performance Tips

### Speed Up Migration
- Use `--mythology` flag to process in parallel:
  ```bash
  # Terminal 1
  node scripts/migrate-to-firebase-assets.js --mythology greek

  # Terminal 2
  node scripts/migrate-to-firebase-assets.js --mythology norse
  ```

### Reduce Errors
- Run dry-run first
- Fix HTML issues before migrating
- Update config patterns for edge cases

## Getting Help

1. **Check logs**: Review `migration-errors.log`
2. **Run verbose**: Add `--verbose` flag for details
3. **Read README**: See `MIGRATION_README.md` for full docs
4. **Verify setup**: Run `npm run migrate:verify`

## Next Steps After Migration

Once migration is complete:

1. **Update Security Rules**: Remove temp write access
2. **Set up Indexes**: Create indexes for common queries
3. **Add Functions**: Create Cloud Functions for advanced features
4. **Test Frontend**: Ensure all assets load correctly
5. **Monitor Usage**: Track read/write quotas
6. **Backup Data**: Export Firestore data regularly

## Useful Commands Reference

```bash
# Verification
npm run migrate:verify                     # Check setup

# Testing
npm run migrate:test                       # Single page dry run
npm run migrate:dry-run                    # All files dry run

# Migration
npm run migrate                            # Migrate everything
node scripts/migrate-to-firebase-assets.js --mythology greek        # One mythology
node scripts/migrate-to-firebase-assets.js --page path/to/file.html # One page

# Resume
node scripts/migrate-to-firebase-assets.js --all --resume          # Continue after interrupt

# Debugging
node scripts/migrate-to-firebase-assets.js --mythology greek -v    # Verbose output
```

## Success Metrics

After successful migration, you should see:

- ✅ **802 assets** in Firestore (or close to it)
- ✅ **Zero or minimal errors** in migration report
- ✅ **All mythologies** represented
- ✅ **Rich content panels** properly formatted
- ✅ **Metadata** extracted correctly
- ✅ **Relationships** preserved
- ✅ **Frontend** displaying assets

## Questions?

- Review `MIGRATION_README.md` for detailed documentation
- Check `migration-config.js` for configuration options
- Examine migration report HTML for specific errors
- Run with `--verbose` flag for debugging

---

**Ready to migrate? Start with: `npm run migrate:verify`**

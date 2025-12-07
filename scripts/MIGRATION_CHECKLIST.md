# Firebase Migration Pre-Flight Checklist

Complete this checklist before running the migration to ensure a smooth process.

## Phase 1: Setup Verification

### Environment
- [ ] Node.js version 16 or higher installed
- [ ] npm version 7 or higher
- [ ] Git installed and configured
- [ ] Terminal/command line access

### Dependencies
- [ ] Run `npm install` successfully
- [ ] All packages installed without errors
- [ ] `node_modules` directory exists
- [ ] Check with `npm run migrate:verify`

### Firebase Configuration
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Service account key downloaded
- [ ] `firebase-service-account.json` in project root
- [ ] File is in `.gitignore`
- [ ] Firebase Admin SDK initialized successfully

### Security
- [ ] `.gitignore` includes migration files
- [ ] `.gitignore` includes service account key
- [ ] No secrets committed to Git
- [ ] Firebase rules configured (temp write access OK for migration)

## Phase 2: Content Verification

### File Structure
- [ ] `mythos/` directory exists
- [ ] At least one mythology folder present
- [ ] HTML files found in mythology folders
- [ ] Total count approximately 802 files
- [ ] Run: `npm run migrate:verify`

### Sample Pages
- [ ] Open `mythos/greek/deities/zeus.html`
- [ ] Verify it has standard structure
- [ ] Check for `deity-header`, `attribute-grid`, sections
- [ ] Confirm metadata is present
- [ ] Links are properly formatted

### Test Files
- [ ] Select 3-5 representative pages
- [ ] Include different asset types (deity, hero, creature)
- [ ] Include different mythologies
- [ ] Check each has sufficient content
- [ ] Note any unusual structures

## Phase 3: Configuration Review

### migration-config.js
- [ ] Review asset type patterns
- [ ] Check mythology patterns
- [ ] Verify icon keyword mappings
- [ ] Confirm validation rules
- [ ] Review exclusion patterns
- [ ] Check defaults are appropriate

### Custom Configuration
- [ ] Add any missing mythologies
- [ ] Add custom asset types if needed
- [ ] Adjust validation thresholds if necessary
- [ ] Configure mythology-specific overrides

## Phase 4: Dry Run Testing

### Single Page Test
```bash
npm run migrate:test
```
- [ ] Script runs without errors
- [ ] Asset structure looks correct
- [ ] Panels are generated properly
- [ ] Metadata is extracted
- [ ] No validation errors
- [ ] Console output is clear

### Single Mythology Test
```bash
node scripts/migrate-to-firebase-assets.js --mythology mayan --dry-run
```
- [ ] All files processed
- [ ] Success rate > 95%
- [ ] Errors are understandable
- [ ] Report generated successfully
- [ ] Review `migration-report-*.html`

### Error Review
- [ ] Open HTML report
- [ ] Check error patterns
- [ ] Identify common issues
- [ ] Plan fixes if needed
- [ ] Update config if necessary

## Phase 5: Small Live Migration

### Prepare
- [ ] Select smallest mythology (Mayan recommended)
- [ ] Backup existing Firestore data (if any)
- [ ] Ensure Firebase rules allow writes
- [ ] Close unnecessary applications
- [ ] Open Firestore console in browser

### Execute
```bash
node scripts/migrate-to-firebase-assets.js --mythology mayan
```
- [ ] Migration starts successfully
- [ ] Progress bar displays
- [ ] Files process without crashes
- [ ] Error count is acceptable
- [ ] Migration completes

### Verify
- [ ] Open Firestore console
- [ ] Check `assets` collection exists
- [ ] Count documents matches expected
- [ ] Open sample documents
- [ ] Verify structure is correct
- [ ] Check `richContent.panels` array
- [ ] Confirm metadata fields present
- [ ] Validate panel types (panel, grid)

## Phase 6: Quality Check

### Data Validation
- [ ] Pick 5 random assets
- [ ] Compare with original HTML
- [ ] Verify name is correct
- [ ] Check summary is appropriate
- [ ] Confirm panels match content
- [ ] Validate metadata accuracy
- [ ] Check relationships preserved

### Report Review
- [ ] Open migration report HTML
- [ ] Review success statistics
- [ ] Check error list
- [ ] Identify patterns
- [ ] Document any recurring issues
- [ ] Plan remediation if needed

### Frontend Test (if applicable)
- [ ] Load asset in your app
- [ ] Verify panels render
- [ ] Check icons display
- [ ] Test grid layouts
- [ ] Confirm links work
- [ ] Validate responsive design

## Phase 7: Incremental Migration

### Plan
- [ ] List mythologies in order
- [ ] Estimate time per mythology
- [ ] Schedule migration sessions
- [ ] Prepare rollback plan
- [ ] Set up monitoring

### Execute (one mythology at a time)
For each mythology:
- [ ] Run migration command
- [ ] Monitor progress
- [ ] Review report
- [ ] Check Firestore
- [ ] Test random samples
- [ ] Document issues
- [ ] Fix errors if needed
- [ ] Move to next mythology

### Track Progress
- [ ] ✅ Mayan (test)
- [ ] ⬜ Greek
- [ ] ⬜ Norse
- [ ] ⬜ Egyptian
- [ ] ⬜ Babylonian
- [ ] ⬜ Sumerian
- [ ] ⬜ Celtic
- [ ] ⬜ Hindu
- [ ] ⬜ Buddhist
- [ ] ⬜ Jewish
- [ ] ⬜ Christian
- [ ] ⬜ Islamic
- [ ] ⬜ Chinese
- [ ] ⬜ Japanese
- [ ] ⬜ Aztec
- [ ] ⬜ Apocryphal

## Phase 8: Full Migration

### Prepare
- [ ] All incremental migrations complete OR
- [ ] Decision to run full migration at once
- [ ] Database backed up
- [ ] Error log cleared
- [ ] Progress file deleted (fresh start)
- [ ] Time allocated (30+ minutes)

### Execute
```bash
npm run migrate
```
- [ ] Migration started
- [ ] Progress monitoring
- [ ] No crashes
- [ ] Acceptable error rate
- [ ] Completion successful

### Verify
- [ ] Total documents ≈ 802
- [ ] All mythologies represented
- [ ] Success rate > 95%
- [ ] Error patterns documented
- [ ] Reports saved
- [ ] Logs archived

## Phase 9: Post-Migration

### Database Optimization
- [ ] Create composite indexes
- [ ] Update security rules (remove temp access)
- [ ] Set up backup schedule
- [ ] Configure monitoring
- [ ] Test query performance

### Documentation
- [ ] Save migration reports
- [ ] Document any issues encountered
- [ ] Record lessons learned
- [ ] Update config as needed
- [ ] Share results with team

### Frontend Integration
- [ ] Test asset loading
- [ ] Verify panel rendering
- [ ] Check search functionality
- [ ] Test filters by mythology/type
- [ ] Validate pagination
- [ ] Test on mobile devices

### Cleanup
- [ ] Archive migration logs
- [ ] Delete progress file (or keep for reference)
- [ ] Clean up test documents (if any)
- [ ] Remove temporary Firebase rules
- [ ] Update .gitignore if needed

## Phase 10: Ongoing Maintenance

### Regular Tasks
- [ ] Monitor Firestore usage
- [ ] Check error logs periodically
- [ ] Update config for new content
- [ ] Re-run migration for updates
- [ ] Track content changes

### Future Migrations
- [ ] Document process improvements
- [ ] Update scripts for new patterns
- [ ] Add new mythologies as needed
- [ ] Enhance metadata extraction
- [ ] Improve validation rules

## Troubleshooting Checklist

If issues arise:

### Script Won't Run
- [ ] Check Node.js version
- [ ] Verify npm packages installed
- [ ] Check file permissions
- [ ] Review error message
- [ ] Try with `--verbose` flag

### Firebase Connection Issues
- [ ] Verify service account key exists
- [ ] Check file path is correct
- [ ] Validate JSON syntax
- [ ] Ensure Firebase project is active
- [ ] Check internet connection

### High Error Rate
- [ ] Run with `--verbose`
- [ ] Review error log
- [ ] Check HTML structure
- [ ] Validate config patterns
- [ ] Test single file in isolation

### Validation Failures
- [ ] Review validation rules
- [ ] Check content quality
- [ ] Adjust thresholds if appropriate
- [ ] Flag for manual review
- [ ] Update HTML if needed

### Performance Issues
- [ ] Close other applications
- [ ] Check system resources
- [ ] Process smaller batches
- [ ] Use mythology-specific migration
- [ ] Monitor memory usage

## Success Criteria

Migration is complete when:

✅ All checkboxes above are checked
✅ ~802 assets in Firestore
✅ All 17+ mythologies present
✅ Success rate > 95%
✅ Error log reviewed and documented
✅ Frontend successfully loads assets
✅ Sample verification passed
✅ Reports archived
✅ Security rules updated
✅ Indexes created
✅ Team notified

## Sign-Off

- [ ] **Technical Lead**: Migration verified
- [ ] **QA**: Sample testing complete
- [ ] **Frontend**: Integration successful
- [ ] **DevOps**: Monitoring configured
- [ ] **Documentation**: Process documented

---

**Date Started**: _______________
**Date Completed**: _______________
**Total Assets Migrated**: _______________
**Success Rate**: _______________%
**Issues Encountered**: _______________

**Notes**:
```
[Space for additional notes, observations, or lessons learned]
```

---

**Next Steps**: Update this checklist based on lessons learned and prepare for future migrations.

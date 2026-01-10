# Schema Compliance Plan - 100% Target

## Current State
- Total Assets: 803
- Compliant: 555 (69.12%)
- Non-Compliant: 248 (missing relatedEntities)
- Broken Links: 0
- Warnings: 0
- Errors: 0

## Goals
1. 100% schema compliance (all assets have relatedEntities)
2. Comprehensive validation in push script
3. Error reporting to Firebase for user submissions
4. Wiki-style content enrichment for all assets
5. Clean, polished bat files for all operations

## Phase 1: Validation Infrastructure

### 1.1 Update validate-connections.js
- Add corpus search validation
- Add content completeness checks
- Add wiki-style section validation

### 1.2 Create error-reporter.js
- Log validation errors to Firebase
- Track unique error types with counts
- Allow periodic error pulling in validation scripts

### 1.3 Update push-to-firebase.js
- Integrate all validation checks before upload
- Block on errors, warn on warnings
- Generate detailed upload reports

## Phase 2: Fix Non-Compliant Assets

### 2.1 Assets by Mythology (248 total)
Deploy agents per mythology to:
- Add relatedEntities connections
- Ensure family structure is complete
- Add wiki-style sections (description, keyMyths, etc.)

### 2.2 Asset Categories
- deity: 156 assets need connections
- hero: 18 assets
- creature: 14 assets
- item: 12 assets
- text: 20 assets
- cosmology: 6 assets
- ritual: 3 assets
- symbol: 4 assets
- event: 1 asset
- concept: 8 assets
- archetype: 4 assets
- magic: 2 assets

## Phase 3: Content Enrichment

For each asset, ensure:
- Detailed description (2+ paragraphs)
- Key myths/stories with sources
- Domains and symbols
- Family relationships
- Related entities across categories
- Comparative notes to other mythologies
- Sources and scholarship references

## Phase 4: Script Packaging

### 4.1 Master Validation Bat
- run-all-validations.bat (modernized)
- Calls all current scripts
- Generates comprehensive reports

### 4.2 Individual Operation Bats
- validate-only.bat - Quick validation
- fix-and-validate.bat - Auto-fix then validate
- push-validated.bat - Validate and push to Firebase
- backup-and-sync.bat - Backup and sync from Firebase

### 4.3 Cleanup
- Archive old/unused scripts
- Remove deprecated scripts
- Update documentation

## Execution Order
1. Update validation infrastructure
2. Create error reporting system
3. Deploy mythology agents to fix assets
4. Run validation after each wave
5. Package scripts
6. Final validation and push

/**
 * Rollout Script: Editable Panel System
 *
 * This script updates all mythology index pages to include the editable panel system.
 *
 * Actions performed:
 * 1. Adds CSS link for editable-panels.css to <head>
 * 2. Adds script tag for editable-panel-system.js before </body>
 * 3. Adds initialization code after Firebase loads
 * 4. Creates backup of each file before modifying
 * 5. Generates detailed report
 *
 * Usage: node scripts/rollout-editable-panels.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MYTHOLOGIES = [
  'aztec', 'apocryphal', 'babylonian', 'buddhist', 'chinese', 'celtic',
  'comparative', 'christian', 'greek', 'freemasons', 'egyptian', 'islamic',
  'hindu', 'japanese', 'mayan', 'jewish', 'persian', 'norse', 'native_american',
  'yoruba', 'roman', 'tarot', 'sumerian'
];

const PROJECT_ROOT = path.join(__dirname, '..');
const MYTHOS_DIR = path.join(PROJECT_ROOT, 'mythos');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups', 'editable-panels-rollout');
const REPORT_FILE = path.join(PROJECT_ROOT, 'EDITABLE_PANELS_ROLLOUT_REPORT.md');

// CSS link to add
const CSS_LINK = '    <link rel="stylesheet" href="/css/editable-panels.css">';

// Script tag to add
const SCRIPT_TAG = '    <script src="/js/editable-panel-system.js"></script>';

// Initialization code to add
const INIT_CODE = `
    <!-- Initialize Editable Panel System -->
    <script>
        // Wait for Firebase and content to load
        window.addEventListener('load', () => {
            // Give Firebase content loader time to render cards
            setTimeout(() => {
                if (typeof EditablePanelSystem === 'undefined') {
                    console.warn('[EditablePanels] EditablePanelSystem not loaded');
                    return;
                }

                if (!window.firebaseApp) {
                    console.warn('[EditablePanels] Firebase not initialized');
                    return;
                }

                console.log('[EditablePanels] Initializing editable panel system...');

                // Initialize the system
                const editableSystem = new EditablePanelSystem(window.firebaseApp);

                // Store globally for access
                window.editableSystem = editableSystem;

                // Initialize all rendered content cards
                const contentCards = document.querySelectorAll('.content-card[data-id]');

                contentCards.forEach(card => {
                    const documentId = card.getAttribute('data-id');

                    // Determine collection type from parent section
                    let collection = 'deities';
                    let contentType = 'deity';

                    const parentSection = card.closest('.firebase-section');
                    if (parentSection) {
                        const containerId = parentSection.querySelector('[id$="-container"]')?.id;
                        if (containerId) {
                            const type = containerId.replace('-container', '');
                            collection = type;
                            contentType = type.slice(0, -1); // Remove plural 's'
                        }
                    }

                    // Initialize editable panel
                    editableSystem.initEditablePanel(card, {
                        contentType: contentType,
                        documentId: documentId,
                        collection: collection,
                        canEdit: false, // Will be determined by checking user ownership
                        canSubmitAppendment: true
                    });
                });

                console.log(\`[EditablePanels] Initialized \${contentCards.length} editable panels\`);
            }, 2000); // Wait 2 seconds for content to load
        });
    </script>`;

// Statistics
let stats = {
  total: 0,
  updated: 0,
  alreadyHave: 0,
  errors: 0,
  backups: 0
};

let detailedReport = [];

/**
 * Create backup directory if it doesn't exist
 */
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✓ Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Backup a file before modifying
 */
function backupFile(filePath, mythology) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = path.join(BACKUP_DIR, `${mythology}_index_${timestamp}.html`);

  fs.copyFileSync(filePath, backupPath);
  stats.backups++;

  return backupPath;
}

/**
 * Check if file already has editable panel integration
 */
function hasEditablePanelIntegration(content) {
  return content.includes('editable-panels.css') ||
         content.includes('editable-panel-system.js') ||
         content.includes('EditablePanelSystem');
}

/**
 * Add CSS link to head section
 */
function addCSSLink(content) {
  // Find the last stylesheet link in head
  const headEndIndex = content.indexOf('</head>');
  if (headEndIndex === -1) {
    throw new Error('No </head> tag found');
  }

  // Insert before </head>
  const before = content.substring(0, headEndIndex);
  const after = content.substring(headEndIndex);

  return before + '\n' + CSS_LINK + '\n' + after;
}

/**
 * Add script tag before closing body
 */
function addScriptTag(content) {
  // Find the closing </body> tag
  const bodyEndIndex = content.indexOf('</body>');
  if (bodyEndIndex === -1) {
    throw new Error('No </body> tag found');
  }

  // Insert before </body>
  const before = content.substring(0, bodyEndIndex);
  const after = content.substring(bodyEndIndex);

  return before + '\n' + SCRIPT_TAG + '\n' + after;
}

/**
 * Add initialization code before closing body
 */
function addInitCode(content) {
  // Find the closing </body> tag
  const bodyEndIndex = content.indexOf('</body>');
  if (bodyEndIndex === -1) {
    throw new Error('No </body> tag found');
  }

  // Insert before </body>
  const before = content.substring(0, bodyEndIndex);
  const after = content.substring(bodyEndIndex);

  return before + '\n' + INIT_CODE + '\n' + after;
}

/**
 * Process a single mythology index file
 */
function processMythologyFile(mythology) {
  const filePath = path.join(MYTHOS_DIR, mythology, 'index.html');

  stats.total++;

  console.log(`\n[${stats.total}/${MYTHOLOGIES.length}] Processing: ${mythology}/index.html`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ File not found: ${filePath}`);
    stats.errors++;
    detailedReport.push({
      mythology,
      status: 'ERROR',
      message: 'File not found'
    });
    return;
  }

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has integration
  if (hasEditablePanelIntegration(content)) {
    console.log(`  → Already has editable panel integration`);
    stats.alreadyHave++;
    detailedReport.push({
      mythology,
      status: 'SKIPPED',
      message: 'Already has editable panel integration'
    });
    return;
  }

  try {
    // Create backup
    const backupPath = backupFile(filePath, mythology);
    console.log(`  ✓ Backed up to: ${path.basename(backupPath)}`);

    // Add CSS link
    content = addCSSLink(content);
    console.log(`  ✓ Added CSS link`);

    // Add script tag
    content = addScriptTag(content);
    console.log(`  ✓ Added script tag`);

    // Add initialization code
    content = addInitCode(content);
    console.log(`  ✓ Added initialization code`);

    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated successfully`);

    stats.updated++;
    detailedReport.push({
      mythology,
      status: 'SUCCESS',
      message: 'Updated with editable panel system',
      backup: path.basename(backupPath)
    });

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    stats.errors++;
    detailedReport.push({
      mythology,
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * Generate markdown report
 */
function generateReport() {
  const report = `# Editable Panel System Rollout Report

**Date:** ${new Date().toISOString()}

## Summary

- **Total Files Processed:** ${stats.total}
- **Successfully Updated:** ${stats.updated}
- **Already Had Integration:** ${stats.alreadyHave}
- **Errors:** ${stats.errors}
- **Backups Created:** ${stats.backups}

## Changes Made

Each updated file received:

1. **CSS Integration**
   - Added \`<link rel="stylesheet" href="/css/editable-panels.css">\` to \`<head>\`

2. **JavaScript Integration**
   - Added \`<script src="/js/editable-panel-system.js"></script>\` before \`</body>\`

3. **Initialization Code**
   - Auto-initialization after Firebase loads
   - Detects all rendered \`.content-card\` elements
   - Applies editable panel functionality to each card
   - Shows edit icon for user-owned content
   - Shows + button for submissions on all content

## Detailed Results

| Mythology | Status | Details | Backup |
|-----------|--------|---------|--------|
${detailedReport.map(r =>
  `| ${r.mythology} | ${r.status} | ${r.message} | ${r.backup || 'N/A'} |`
).join('\n')}

## What Users Will See

### For Regular Users
- **+ Button** on all deity/hero/creature cards
- Click to submit additional information
- Submissions go to pending queue for admin approval

### For Content Creators
- **Edit Icon (✎)** in top-right of their own submissions
- Click to edit their content inline
- Changes saved to Firebase immediately

### For Admins
- Can approve/reject submissions via Firebase Console
- Set submission \`status: 'approved'\` to make visible
- Can edit any content directly in Firestore

## File Structure

\`\`\`
mythos/
├── aztec/index.html
├── apocryphal/index.html
├── babylonian/index.html
├── buddhist/index.html
├── celtic/index.html
├── chinese/index.html
├── christian/index.html
├── comparative/index.html
├── egyptian/index.html
├── freemasons/index.html
├── greek/index.html
├── hindu/index.html
├── islamic/index.html
├── japanese/index.html
├── jewish/index.html
├── mayan/index.html
├── native_american/index.html
├── norse/index.html
├── persian/index.html
├── roman/index.html
├── sumerian/index.html
├── tarot/index.html
└── yoruba/index.html
\`\`\`

## Integration Points

### Card Rendering Flow

1. **Firebase Content Loader** renders cards
   - Creates \`.content-card\` elements
   - Sets \`data-id\` attribute with document ID
   - Inserts into mythology page grid

2. **Editable Panel System** initializes
   - Waits 2 seconds for content to load
   - Finds all \`.content-card[data-id]\` elements
   - Calls \`initEditablePanel()\` on each

3. **User Interaction**
   - Edit icon shows if user owns content
   - + button shows for all content
   - Modals open for editing/submitting

### Firebase Collections

- **Primary Collections:** \`deities\`, \`heroes\`, \`creatures\`, \`cosmology\`, \`texts\`, \`herbs\`, \`rituals\`, \`symbols\`, \`concepts\`, \`myths\`
- **Submissions Collection:** \`submissions\`
  - Links to parent via \`parentCollection\` and \`parentDocumentId\`
  - Requires admin approval (\`status: 'pending'\` → \`status: 'approved'\`)

## Testing Checklist

- [ ] Visit a mythology page (e.g., /mythos/greek/index.html)
- [ ] Verify cards load from Firebase
- [ ] Verify + button appears on cards
- [ ] Click + button (should show login if not authenticated)
- [ ] Login with Google
- [ ] Submit test information
- [ ] Check Firebase Console for submission
- [ ] Approve submission in Firebase
- [ ] Reload page to see approved submission
- [ ] Test edit icon on own content

## Rollback Instructions

If issues occur, restore from backup:

\`\`\`bash
# Restore a specific mythology
cp backups/editable-panels-rollout/greek_index_*.html mythos/greek/index.html

# Restore all mythologies
for backup in backups/editable-panels-rollout/*_index_*.html; do
  mythology=\$(basename \$backup | cut -d_ -f1)
  cp \$backup mythos/\$mythology/index.html
done
\`\`\`

## Next Steps

1. **Test on staging** - Verify functionality on one mythology page
2. **Monitor Firebase** - Watch for submission activity
3. **Admin Dashboard** - Create interface for managing submissions
4. **User Notifications** - Notify users when submissions are approved
5. **Moderation Queue** - Build UI for reviewing pending submissions

## Known Issues

None currently. Report issues to the development team.

---

**Generated by:** Editable Panel Rollout Script v1.0
**Backups stored in:** \`${BACKUP_DIR}\`
`;

  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`\n✅ Report generated: ${REPORT_FILE}`);
}

/**
 * Main execution
 */
function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  EDITABLE PANEL SYSTEM ROLLOUT');
  console.log('═══════════════════════════════════════════════════════\n');

  // Create backup directory
  createBackupDir();

  // Process each mythology
  for (const mythology of MYTHOLOGIES) {
    processMythologyFile(mythology);
  }

  // Generate report
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ROLLOUT COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total: ${stats.total} | Updated: ${stats.updated} | Skipped: ${stats.alreadyHave} | Errors: ${stats.errors}`);

  generateReport();

  console.log('\n✨ Done! Check the report for details.\n');
}

// Run the script
main();

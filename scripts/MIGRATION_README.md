# Firebase Asset Migration System

Comprehensive migration tool to import 802+ HTML mythology pages into Firebase assets collection.

## Overview

This migration system transforms static HTML mythology pages into structured Firebase asset documents with rich content panels. It intelligently parses HTML, detects asset types, extracts metadata, and generates properly formatted content panels.

## Features

- **Intelligent HTML Parsing**: Uses Cheerio to parse and extract structured data from HTML pages
- **Asset Type Detection**: Automatically detects deity, hero, creature, place, item, text, or concept
- **Mythology Detection**: Identifies mythology from URL path (Greek, Norse, Egyptian, etc.)
- **Rich Content Generation**: Converts HTML sections into structured panel format
- **Icon Auto-Assignment**: Assigns appropriate icons based on section title keywords
- **Metadata Extraction**: Extracts domains, symbols, relationships, and other metadata
- **Validation**: Ensures all assets meet quality standards before writing
- **Progress Tracking**: Saves progress for resume capability
- **Dry-Run Mode**: Preview migration without writing to database
- **Error Logging**: Comprehensive error tracking and reporting
- **HTML Report**: Generates visual migration report

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase Admin SDK:
   - Download service account key from Firebase Console
   - Save as `firebase-service-account.json` in project root
   - Make sure it's in .gitignore (already configured)

## Usage

### Test Single Page (Dry Run)
```bash
npm run migrate:test
# or
node scripts/migrate-to-firebase-assets.js --page mythos/greek/deities/zeus.html --dry-run
```

### Dry Run All Files
```bash
npm run migrate:dry-run
# or
node scripts/migrate-to-firebase-assets.js --all --dry-run
```

### Migrate Single Page (Live)
```bash
node scripts/migrate-to-firebase-assets.js --page mythos/greek/deities/zeus.html
```

### Migrate by Mythology
```bash
node scripts/migrate-to-firebase-assets.js --mythology greek
node scripts/migrate-to-firebase-assets.js --mythology norse
node scripts/migrate-to-firebase-assets.js --mythology christian
```

### Migrate Everything
```bash
npm run migrate
# or
node scripts/migrate-to-firebase-assets.js --all
```

### Resume After Interruption
```bash
node scripts/migrate-to-firebase-assets.js --all --resume
```

### Verbose Output
```bash
node scripts/migrate-to-firebase-assets.js --all --verbose
```

## Command-Line Flags

- `--dry-run`: Preview without writing to database
- `--page <path>`: Migrate single page
- `--mythology <name>`: Migrate single mythology
- `--all`: Migrate all files
- `--resume`: Skip already processed files
- `--verbose` or `-v`: Show detailed output

## How It Works

### 1. Asset Type Detection

The script analyzes the URL path to determine asset type:

- **Deity**: `/deities/`, `/gods/`, `/goddesses/`
- **Hero**: `/heroes/`, `/figures/`, `/saints/`
- **Creature**: `/creatures/`, `/beings/`, `/angels/`, `/demons/`
- **Place**: `/places/`, `/locations/`, `/realms/`, `/cosmology/`
- **Item**: `/items/`, `/artifacts/`, `/relics/`, `/weapons/`
- **Text**: `/texts/`, `/scriptures/`, `/books/`
- **Concept**: `/concepts/`, `/teachings/`, `/theology/`, `/practices/`

### 2. Mythology Detection

Identifies mythology from URL path pattern:

- `/mythos/greek/` → mythology: 'greek'
- `/mythos/norse/` → mythology: 'norse'
- `/mythos/christian/` → mythology: 'christian'
- etc.

### 3. Content Parsing

Extracts structured content:

1. **Title & Summary**: From page title, h1, and first paragraph
2. **Metadata**: From attribute cards (domains, symbols, titles)
3. **Relationships**: Parents, consorts, children, siblings
4. **Sections**: Converts HTML sections into panels
5. **Grids**: Preserves grid layouts with proper width detection

### 4. Icon Assignment

Automatically assigns icons based on section title keywords:

- "Overview" → 📋
- "Mythology" → 📖
- "Symbols" → ⚡
- "Powers" → 💫
- "Family" → 👨‍👩‍👧‍👦
- "Related" → 🔗
- "Worship" → ⛪
- "Sources" → 📚

### 5. Rich Content Transformation

Each HTML section becomes a structured panel:

**Text Panel**:
```javascript
{
  type: 'panel',
  title: 'Mythology & Stories',
  titleIcon: '📖',
  content: 'Zeus led his siblings in a ten-year war...',
  order: 0
}
```

**Grid Panel**:
```javascript
{
  type: 'grid',
  title: 'The Holy Trinity',
  titleIcon: '👑',
  gridWidth: 3,
  children: [
    {
      type: 'link',
      title: 'God the Father',
      url: '/mythos/christian/deities/god-father.html',
      description: 'The first person of the Trinity...'
    }
  ],
  order: 1
}
```

### 6. Asset Document Structure

Generated Firestore document:

```javascript
{
  id: 'greek-zeus',
  assetType: 'deity',
  mythology: 'greek',
  name: 'Zeus',
  alternateNames: ['Jupiter', 'Jove'],
  summary: 'Supreme ruler of Mount Olympus...',

  richContent: {
    panels: [/* structured panels */]
  },

  deityData: {
    pantheon: 'Greek Olympians',
    domain: ['sky', 'thunder', 'kingship'],
    symbols: ['lightning bolt', 'eagle', 'oak'],
    epithets: ['Sky Father', 'Cloud Gatherer']
  },

  relationships: {
    parents: 'Kronos and Rhea',
    consorts: 'Hera (official wife)...',
    children: 'By Hera: Ares, Hebe...'
  },

  isOfficial: true,
  status: 'published',
  contributedBy: null,
  sourcePath: 'mythos/greek/deities/zeus.html',
  createdAt: Timestamp,
  migratedAt: Timestamp
}
```

## Configuration

All configuration is in `migration-config.js`:

### Asset Type Patterns
Customize URL patterns for asset type detection.

### Icon Keywords
Add/modify icon assignments for section titles.

### Metadata Patterns
Configure which HTML elements map to metadata fields.

### Validation Rules
Set minimum/maximum values for content validation.

### Mythology-Specific Overrides
Special rules for specific mythologies (e.g., Christian theology as concept).

## Output Files

### Migration Report
HTML report with statistics and error list:
- `migration-report-[timestamp].html`

### Error Log
Text file with detailed error information:
- `migration-errors.log`

### Progress File
JSON file tracking processed files for resume:
- `migration-progress.json`

## Error Handling

The script handles errors gracefully:

1. **File-Level Errors**: Logs error and continues with next file
2. **Validation Errors**: Lists all validation failures
3. **Parse Errors**: Catches HTML parsing issues
4. **Firebase Errors**: Handles write failures

All errors are:
- Displayed in console
- Saved to error log
- Included in HTML report
- Tracked in statistics

## Validation

Assets are validated before writing:

### Required Fields
- name (all types)
- mythology (all types)
- summary (all types, min 50 chars)

### Content Validation
- Minimum 1 panel per asset
- Maximum 50 panels per asset
- Summary length: 50-1000 characters
- Name length: max 200 characters

### Type-Specific Validation
Different requirements for deities, heroes, creatures, etc.

## Edge Cases & Limitations

### Known Edge Cases

1. **Index Pages**: Automatically skipped (browse.html, index.html, etc.)
2. **Complex Grids**: Nested grids are flattened to single level
3. **Images**: Image URLs are preserved but not uploaded to storage
4. **External Links**: Preserved as-is
5. **Special Characters**: HTML entities are decoded
6. **Multiple Sections**: All sections combined if similar titles

### Limitations

1. **No Image Upload**: Images referenced but not migrated to Firebase Storage
2. **No SVG Parsing**: SVG content in HTML not extracted
3. **Single Level Grids**: Nested grid structures are simplified
4. **Link Validation**: Links not validated, only preserved
5. **Content Format**: Some complex HTML formatting may be lost

### Files Excluded

- `index.html` (navigation pages)
- `corpus-search.html` (search interfaces)
- `browse.html`, `submit.html`, `view.html`, `edit.html` (user theory pages)

## Troubleshooting

### Firebase Connection Error
```
Error: Failed to initialize Firebase
```
**Solution**: Make sure `firebase-service-account.json` exists in project root.

### Permission Denied
```
Error: Missing or insufficient permissions
```
**Solution**: Check Firebase security rules allow write access.

### Parsing Error
```
Error: Failed to parse [...]: Could not detect mythology
```
**Solution**: File path doesn't match mythology patterns. Check URL structure.

### Validation Failed
```
Error: Validation failed: Summary too short
```
**Solution**: Page doesn't have enough content. May need manual review.

## Best Practices

### Testing Workflow

1. **Test Single Page**: Start with one well-formed page
```bash
npm run migrate:test
```

2. **Test One Mythology**: Migrate a small mythology first
```bash
node scripts/migrate-to-firebase-assets.js --mythology mayan --dry-run
```

3. **Review Report**: Check HTML report for issues

4. **Fix Errors**: Update config or HTML as needed

5. **Live Migration**: Run on small set without --dry-run

6. **Verify Firebase**: Check Firestore console

7. **Full Migration**: Run on all files

### Iterative Approach

Don't migrate everything at once:

1. Start with Greek mythology (well-structured)
2. Review and refine
3. Add Norse, Egyptian
4. Continue mythology by mythology
5. Save Christian/Gnostic for last (most complex)

### Resume Capability

Use `--resume` for large migrations:

```bash
# Start migration
node scripts/migrate-to-firebase-assets.js --all

# If interrupted, resume with:
node scripts/migrate-to-firebase-assets.js --all --resume
```

## Advanced Usage

### Custom Configuration

Edit `migration-config.js` to customize:

```javascript
// Add new asset type
assetTypePatterns: {
  ritual: ['/rituals/', '/ceremonies/'],
  // ...
}

// Add new icon mapping
iconKeywords: {
  '🔥': ['fire', 'flame', 'heat'],
  // ...
}

// Mythology-specific rules
mythologyConfigs: {
  custom: {
    assetTypePatterns: {
      concept: ['/special-path/']
    }
  }
}
```

### Parallel Processing

The script processes files sequentially for safety. For faster processing, you could:

1. Run multiple instances on different mythologies:
```bash
# Terminal 1
node scripts/migrate-to-firebase-assets.js --mythology greek

# Terminal 2
node scripts/migrate-to-firebase-assets.js --mythology norse
```

2. Monitor progress in each terminal

## Performance

### Expected Times

- Single page: ~100-500ms
- Mythology (50 pages): ~1-3 minutes
- Full migration (802 pages): ~10-30 minutes

### Optimization Tips

1. Use `--resume` for interrupted runs
2. Process by mythology for better error isolation
3. Run dry-run first to catch issues
4. Use verbose mode only when debugging

## Contributing

To improve the migration:

1. Test with diverse page structures
2. Add new asset type patterns as needed
3. Improve icon keyword matching
4. Enhance metadata extraction
5. Add validation rules
6. Update documentation

## Support

For issues or questions:

1. Check this README
2. Review `migration-config.js` comments
3. Examine sample output with `--dry-run --verbose`
4. Check error log for details
5. Review HTML report for patterns

## License

Part of Eyes of Azrael project. See main LICENSE file.

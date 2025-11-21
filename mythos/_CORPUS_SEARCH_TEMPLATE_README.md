# Corpus Search Template System v2.0

**A comprehensive, GitHub-based corpus search system for ancient texts across all mythologies**

## Overview

This template provides a flexible, extensible corpus search system that:
- Loads texts directly from GitHub repositories
- Supports multiple file formats (JSON, XML/TEI, plain text)
- Provides category-based organization
- Implements session-based caching for performance
- Offers custom parsers for mythology-specific formats
- Includes progressive loading with visual feedback

## File Structure

```
mythos/
├── _corpus-search-template.html          # Template HTML (not used directly)
├── {mythology}/
│   ├── corpus-search.html                # Main search interface
│   ├── corpus-config.json                # Repository configuration
│   └── corpus-parsers.js                 # (Optional) Custom parsers
├── corpus-search-core.js                 # Core search engine
├── corpus-search-ui.js                   # UI controller
└── themes/
    └── corpus-github.css                 # Styling
```

## Implementation Guide

### 1. Create corpus-search.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{Mythology} Corpus Search</title>
    <link rel="stylesheet" href="../../themes/theme-base.css">
    <link rel="stylesheet" href="../../themes/corpus-github.css">
    <script defer src="../../themes/theme-picker.js"></script>
    <script defer src="../../corpus-search-core.js"></script>
    <script defer src="corpus-parsers.js"></script> <!-- If using custom parsers -->
</head>
<body>
    <div id="theme-picker-container"></div>

    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
        <header style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 2.5rem; color: var(--color-primary); margin-bottom: 1rem;">
                📜 {Mythology} Corpus Search
            </h1>
            <p style="color: var(--color-text-secondary); font-size: 1.1rem;">
                Search across {description of corpus}
            </p>
            <nav class="breadcrumb" style="margin-top: 1rem;">
                <a href="../../mythos-index.html">Home</a> →
                <a href="index.html">{Mythology}</a> →
                <span>Corpus Search</span>
            </nav>
        </header>

        <div id="error-container"></div>

        <div class="corpus-repo-selector">
            <h3>📚 Step 1: Select Texts</h3>
            <p style="color: var(--color-text-secondary); text-align: center; margin-bottom: 1rem;">
                Choose which texts to load from GitHub
            </p>
            <div class="repo-list" id="repo-list"></div>
            <div class="repo-actions">
                <button class="select-all-btn" id="select-all-btn">Select All</button>
                <button class="clear-selection-btn" id="clear-selection-btn">Clear Selection</button>
                <button class="load-repos-btn" id="load-repos-btn" disabled>Load Selected Texts</button>
            </div>
            <div id="loading-status" class="hidden">
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-text" id="progress-text">0%</div>
                </div>
                <div class="status-text" id="status-text">Preparing to load...</div>
            </div>
        </div>

        <div id="search-interface" class="hidden">
            <h3>🔍 Step 2: Search Loaded Texts</h3>
            <div class="search-controls">
                <input type="text" id="search-term" placeholder="Enter search term..." autocomplete="off">
                <button id="search-btn">Search</button>
            </div>
            <div class="search-options">
                <label class="search-option">
                    <input type="checkbox" id="case-sensitive">
                    Case Sensitive
                </label>
                <label class="search-option">
                    <input type="number" id="max-results" value="100" min="1" max="500" style="width: 80px; padding: 0.25rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border-primary); border-radius: 4px; color: var(--color-text-primary);">
                    Max Results
                </label>
            </div>
            <div class="results-summary hidden" id="results-summary"></div>
            <div id="search-results"></div>
            <div class="corpus-stats">
                <div class="stat-item">
                    <span class="stat-value" id="stat-loaded-texts">0</span>
                    <span class="stat-label">Loaded Texts</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-cache-size">0 KB</span>
                    <span class="stat-label">Cache Size</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-last-search">—</span>
                    <span class="stat-label">Results Found</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Set custom parsers before corpus-search-ui.js initializes (if applicable)
        if (window.{Mythology}CustomParsers) {
            window.CUSTOM_CORPUS_PARSERS = window.{Mythology}CustomParsers;
        }
    </script>
    <script src="../../corpus-search-ui.js"></script>
</body>
</html>
```

### 2. Create corpus-config.json

```json
{
  "metadata": {
    "corpus_name": "{Mythology} Text Corpus",
    "version": "1.0",
    "description": "Description of your corpus",
    "last_updated": "2025-01-20"
  },
  "repositories": [
    {
      "id": "unique-repo-id",
      "name": "Repository Display Name",
      "category": "Text Category (optional)",
      "owner": "github-username",
      "repo": "repository-name",
      "branch": "master",
      "path": "path/to/files",
      "files": [
        {
          "name": "filename.json",
          "display": "Display Name for User",
          "language": "language-code",
          "format": "json|xml|txt",
          "description": "Brief description",
          "size_mb": 1.5,
          "parser": "custom-parser-name"
        }
      ],
      "enabled_by_default": true
    }
  ],
  "cache_duration_minutes": 60,
  "max_concurrent_fetches": 3,
  "api_settings": {
    "use_raw_github": true,
    "github_token": null,
    "timeout_seconds": 45
  }
}
```

#### Configuration Fields

**Metadata:**
- `corpus_name`: Display name for your corpus
- `version`: Version number
- `description`: Brief description
- `last_updated`: Last update date (YYYY-MM-DD)

**Repository Fields:**
- `id` (required): Unique identifier for this repository
- `name` (required): Display name
- `category` (optional): Category for grouping (e.g., "Religious Texts", "Wisdom Literature")
- `owner` (required): GitHub username/organization
- `repo` (required): Repository name
- `branch` (required): Branch name (usually "master" or "main")
- `path` (optional): Path to files within repo (empty string if in root)
- `enabled_by_default` (required): Whether to pre-select this repository

**File Fields:**
- `name` (required): Actual filename in repository
- `display` (required): User-friendly display name
- `language` (required): Language code (e.g., "en", "grc", "egy")
- `format` (required): File format ("json", "xml", "txt")
- `description` (required): Brief description for users
- `size_mb` (optional): File size in MB (for user reference)
- `parser` (optional): Custom parser name (if not using standard parsers)

### 3. Create Custom Parsers (Optional)

If your text format requires special handling, create `corpus-parsers.js`:

```javascript
/**
 * Custom parsers for {Mythology} corpus formats
 */

class CustomParser extends BaseParser {
  search(content, searchTerms, options) {
    const data = JSON.parse(content);
    const results = [];

    // Your parsing logic here
    // Iterate through your data structure
    // Match against searchTerms
    // Build result objects

    for (const item of data.items) {
      const searchableText = item.text + ' ' + item.translation;

      if (this.matches(searchableText, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(searchableText, searchTerms, options.caseSensitive);

        results.push({
          corpus_name: options.corpusName || 'Corpus Name',
          text_id: item.id,
          text_name: item.title,
          matched_term: matchedTerm,
          context: this.extractContext(searchableText, matchedTerm, options.contextWords),
          full_verse: item.text,
          translation: item.translation,
          book: item.book,
          chapter: item.chapter,
          verse: item.verse,
          language: options.metadata.language,
          metadata: {
            ...options.metadata,
            custom_field: item.custom
          },
          url: `https://example.com/text/${item.id}`
        });

        if (results.length >= options.maxResults) {
          break;
        }
      }
    }

    return results;
  }
}

// Register parsers
if (typeof window !== 'undefined') {
  window.{Mythology}CustomParsers = {
    'custom-parser-name': new CustomParser()
  };
}
```

#### Standard Parsers Available

The system includes three standard parsers:
1. **JSONBibleParser**: For Bible-style JSON (book/chapter/verse hierarchy)
2. **XMLParser**: For generic TEI XML documents
3. **PlainTextParser**: For plain text files (line-by-line)

## Features

### Category Organization

Repositories can be grouped by category for better organization:

```json
{
  "id": "pyramid-texts",
  "category": "Religious Texts"
}
```

Categories are automatically sorted and displayed as collapsible sections.

### Session Caching

- Texts are cached in `sessionStorage` for the duration specified in `cache_duration_minutes`
- Reduces GitHub API calls
- Improves search performance
- Cache automatically expires after specified time

### Progress Indicators

- Shows real-time loading progress (percentage, file name)
- Displays cache size and loaded text count
- Visual progress bar during repository loading

### Search Options

- **Case Sensitive**: Toggle case-sensitive matching
- **Max Results**: Limit number of results (1-500)
- **Result Highlighting**: Matched terms are highlighted in results

### Deep Linking

Support URL parameters for direct access:
```
corpus-search.html?repo=repo-id&term=search-term
```

## Egyptian Mythology Example

The Egyptian corpus search demonstrates all features:

**Features:**
- 13 repositories across 6 categories
- 3 custom parsers (AES, AED-TEI, ORAEC)
- Support for hieroglyphic transcription
- Date ranges in BCE format
- Links to TLA database

**Categories:**
- Complete Texts (ORAEC)
- Sentence Corpus (AES)
- Religious Texts (AED & ORAEC)
- Wisdom Texts (ORAEC)
- Scientific Texts (ORAEC)
- Mythological Texts (ORAEC)
- Reference (AED)

## Customization

### CSS Variables

Customize appearance using CSS variables in your theme:

```css
--color-primary: #4a9eff;
--color-secondary: #6a4aff;
--color-bg-secondary: rgba(0, 0, 0, 0.2);
--color-surface: rgba(255, 255, 255, 0.05);
--color-text-primary: #ffffff;
--color-text-secondary: rgba(255, 255, 255, 0.7);
```

### Custom Result Display

Modify `createResultElement()` in `corpus-search-ui.js` to customize result appearance.

## Best Practices

1. **File Sizes**: Keep individual files under 5MB for best performance
2. **Batching**: Split large corpora into multiple batches
3. **Categories**: Use categories to organize more than 5 repositories
4. **Descriptions**: Write clear, concise descriptions for user guidance
5. **Default Selection**: Only enable 1-2 repositories by default
6. **Parser Naming**: Use descriptive parser names (e.g., "aes-json", not "parser1")

## Troubleshooting

### Files Not Loading
- Verify GitHub repository is public
- Check file path and filename match exactly (case-sensitive)
- Ensure branch name is correct
- Check browser console for CORS errors

### Search Not Working
- Verify custom parser is registered correctly
- Check parser returns proper result format
- Ensure `window.CUSTOM_CORPUS_PARSERS` is set before `corpus-search-ui.js` loads

### Categories Not Showing
- Ensure `category` field is present in repository config
- Check spelling consistency across repositories

## Migration from Old System

To migrate from the old `corpus-index.json` system:

1. Backup old `corpus-search.html`
2. Create new `corpus-config.json` from old index data
3. Create custom parser if format is non-standard
4. Update `corpus-search.html` using template
5. Test with one repository before adding all

## Version History

**v2.0 (2025-01-20)**
- Added category support
- Enhanced metadata in config
- Improved custom parser system
- Added ORAEC parser
- Better progress indicators

**v1.0 (2025-01-15)**
- Initial release
- Basic GitHub integration
- Standard parsers (JSON, XML, TXT)

---

**Template Maintainer**: EOAPlot Documentation Team
**Last Updated**: 2025-01-20
**License**: Same as project

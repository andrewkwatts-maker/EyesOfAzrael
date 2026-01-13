# Enhancement Scripts Guide

## Quick Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `enhance-with-gemini.js` | Full asset enhancement via Gemini | Primary tool for bulk enhancements |
| `enhance-description-only.js` | Description-only enhancement | When full enhancement fails |
| `enhance-all-collections.js` | Batch enhance all collections | Initial setup or major refresh |

## Primary Enhancement Scripts

### enhance-with-gemini.js
The main enhancement script using Gemini API for content generation.

```bash
# Dry run (preview changes)
node scripts/enhance-with-gemini.js --dry-run

# Apply changes
node scripts/enhance-with-gemini.js --apply
```

**Features:**
- Enhances descriptions to 4500+ characters
- Adds missing metadata (domains, epithets, symbols)
- Validates JSON output
- Rate limiting to avoid API limits

### enhance-description-only.js
Fallback script for assets that fail full JSON enhancement.

```bash
# Dry run
node scripts/enhance-description-only.js

# Apply changes
node scripts/enhance-description-only.js --apply
```

**Use when:**
- Full enhancement returns malformed JSON
- Only description needs updating
- Quick fix for specific assets

## Collection-Specific Scripts (Legacy)

These scripts target specific entity types. Generally use `enhance-with-gemini.js` instead.

- `enhance-deity-metadata.js` - Deity enhancements
- `enhance-creatures-metadata.js` - Creature enhancements
- `enhance-heroes-metadata.js` - Hero enhancements
- `enhance-items-metadata.js` - Item enhancements
- `enhance-places-metadata.js` - Place enhancements
- `enhance-herbs-metadata.js` - Herb enhancements
- `enhance-rituals-metadata.js` - Ritual enhancements
- `enhance-texts-metadata.js` - Text enhancements
- `enhance-symbols-metadata.js` - Symbol enhancements

## Configuration

All scripts require `GEMINI_API_KEY` in `.env`:

```
GEMINI_API_KEY=your_api_key_here
```

## Best Practices

1. **Always dry-run first** - Preview changes before applying
2. **Check API limits** - Gemini has rate limits, scripts include delays
3. **Validate output** - Run validation scripts after enhancement
4. **Backup data** - Keep backups before bulk operations

## Related Scripts

- `gemini-advisor.js` - Ask Gemini for project advice
- `gemini-project-review.js` - Get project status review

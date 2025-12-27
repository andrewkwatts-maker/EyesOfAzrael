# Eyes of Azrael - Quick Start Guide 🚀

## Start the Server
```bash
cd h:/Github/EyesOfAzrael
firebase serve --only hosting --port 5003
```

## Access the Site
- **Main Site**: http://localhost:5003
- **Shader Demo**: http://localhost:5003/shader-demo.html

## Test Key Routes
```
Home:    /#/
Greek:   /#/mythology/greek
Zeus:    /#/mythology/greek/deity/zeus
Search:  /#/search
Compare: /#/compare
```

## Run Integration Tests
Open browser console at http://localhost:5003 and paste:
```javascript
await import('./scripts/test-integration.js');
```

## System Status
- ✅ 776 entities in Firebase
- ✅ 10 shader themes active
- ✅ SPA navigation working
- ✅ Search system ready
- ✅ Authentication optional

## Key Files
- **Main Page**: `index.html`
- **Navigation**: `js/spa-navigation.js`
- **Auth**: `js/auth-manager.js`
- **Search**: `js/components/corpus-search-enhanced.js`
- **Shaders**: `js/shaders/*.glsl`
- **Init**: `js/app-init.js`

## Common Tasks

### Add New Entity
1. Create JSON in `firebase-assets-enhanced/{type}/`
2. Run `node scripts/validate-and-upload-fixed.js --upload`

### Change Shader Theme
```javascript
window.EyesOfAzrael.shaders.activateTheme('water');
```

### Search Entities
```javascript
const results = await window.EyesOfAzrael.search.search('zeus', {
    mode: 'generic',
    limit: 10
});
```

### Navigate Programmatically
```javascript
window.EyesOfAzrael.navigation.navigate('#/mythology/greek/deity/zeus');
```

## Documentation
- **Integration Status**: `SYSTEM_INTEGRATION_STATUS.md`
- **Session Complete**: `POLISH_SESSION_COMPLETE.md`
- **Search API**: `CORPUS_SEARCH_IMPLEMENTATION.md`
- **Migration Tracker**: `MIGRATION_TRACKER.json`

## Troubleshooting

**Issue**: White screen on load
- Check browser console for errors
- Verify Firebase config in `firebase-config.js`
- Check server is running on port 5003

**Issue**: Shader not loading
- Check WebGL support in browser
- Verify shader file exists in `js/shaders/`
- Check console for shader compilation errors

**Issue**: Entity not found
- Verify entity exists in Firebase
- Check entity ID matches route
- Check Firestore console for data

**Issue**: Search returns nothing
- Wait for indexing to complete
- Check IndexedDB cache
- Verify search mode is correct

## Quick Commands

### Validate Assets
```bash
node scripts/download-and-validate-assets.js
```

### Fix Metadata
```bash
node scripts/fix-all-metadata-issues.js
```

### Upload to Firebase
```bash
node scripts/validate-and-upload-fixed.js --upload
```

### Upload Python Script
```bash
python upload-enhanced-to-firebase.py
```

## Browser Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- WebGL support for shaders
- JavaScript enabled
- IndexedDB for search cache

---

**Ready to explore!** 🎉

The Eyes of Azrael mythology encyclopedia is now running with:
- Firebase-powered content
- Beautiful WebGL shaders
- Fast entity search
- Smooth SPA navigation

Open http://localhost:5003 to begin!

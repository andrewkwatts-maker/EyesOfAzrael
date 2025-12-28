# Production Deployment Guide

## Build for Production

### 1. Run the build command:
```bash
npm run build:prod
```

This will create a `dist/` directory with:
- **Minified JavaScript** (60-70% smaller)
- **Minified CSS** (40-50% smaller)
- **Optimized HTML** (20-30% smaller)
- **Source maps** for debugging (`.map` files)

### 2. Build Process Details

The build script performs the following optimizations:

**JavaScript Minification:**
- Dead code elimination
- Console statement removal (console.log, console.debug, etc.)
- Variable name mangling
- Whitespace removal
- 2-pass compression for maximum size reduction

**CSS Minification:**
- Whitespace removal
- Comment removal
- Redundant rule elimination
- Property optimization
- Level 2 optimizations (structural optimizations)

**HTML Minification:**
- Whitespace collapse
- Comment removal
- Attribute quote removal
- Redundant attribute removal
- Inline CSS/JS minification

**Asset Management:**
- Copies static assets (images, fonts, icons, mythos data)
- Generates build report with size metrics
- Creates source maps for debugging

## Deploy to Firebase Hosting

### 1. Update `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 2. Deploy to Firebase:

**Production deployment:**
```bash
npm run build:prod
firebase deploy --only hosting
```

**Staging deployment:**
```bash
npm run build:prod
firebase deploy --only hosting:staging
```

### 3. Rollback if needed:
```bash
firebase hosting:rollback
```

## Verify Production Build

### 1. Test locally:
```bash
npm run serve:prod
```

Open http://localhost:8080 and verify:
- [ ] All pages load correctly
- [ ] JavaScript is minified (check Network tab)
- [ ] CSS is minified (check Network tab)
- [ ] Source maps work (can debug in DevTools)
- [ ] Console is clean (no errors)
- [ ] All Firebase assets load correctly
- [ ] Navigation works properly
- [ ] Search functionality works

### 2. Check build report:
The build generates `dist/build-report.json` with:
```json
{
  "buildDate": "2025-12-28T...",
  "sizes": {
    "js": 1234567,
    "css": 123456,
    "total": 12345678
  },
  "files": {
    "js": 50,
    "css": 20,
    "html": 500
  }
}
```

### 3. Verify minification:
```bash
# Check JS file sizes
ls -lh dist/js/

# Check CSS file sizes
ls -lh dist/css/

# Verify source maps exist
ls dist/js/*.map
ls dist/css/*.map
```

## Performance Checklist

Before deploying to production:

- [ ] Run build script successfully
- [ ] Check build-report.json for size metrics
- [ ] Test locally with `npm run serve:prod`
- [ ] Verify all pages load without errors
- [ ] Check Network tab for minified resources
- [ ] Confirm source maps work in DevTools
- [ ] Test on multiple browsers
- [ ] Verify Firebase Database connection
- [ ] Test user submissions
- [ ] Check search functionality
- [ ] Verify image loading
- [ ] Test mobile responsiveness

## Expected Size Reductions

Based on typical minification results:

| Asset Type | Original Size | Minified Size | Reduction |
|------------|--------------|---------------|-----------|
| JavaScript | 100KB        | 30-40KB       | 60-70%    |
| CSS        | 50KB         | 25-30KB       | 40-50%    |
| HTML       | 500KB        | 350-400KB     | 20-30%    |

**Total expected savings:** 40-50% reduction in total asset size

## Source Maps

Source maps are automatically generated for:
- All JavaScript files (`.js.map`)
- All CSS files (`.css.map`)

These allow debugging minified code in browser DevTools:
1. Open DevTools
2. Go to Sources tab
3. Original source files appear in the file tree
4. Set breakpoints and debug as normal

## Troubleshooting

### Build fails with minification errors:
```bash
# Check for syntax errors in source files
npm run test

# Run with verbose output
node scripts/build-production.js
```

### Source maps not working:
1. Check that `.map` files exist in dist/
2. Verify source map URLs in minified files
3. Ensure DevTools has source maps enabled

### Assets not loading:
1. Check that asset directories were copied to dist/
2. Verify file paths in HTML are correct
3. Check browser console for 404 errors

### Firebase deployment issues:
```bash
# Verify Firebase configuration
firebase projects:list

# Check hosting settings
firebase hosting:channel:list

# Clear cache and redeploy
firebase hosting:channel:delete preview
npm run build:prod
firebase deploy --only hosting
```

## Advanced: Bundle Analysis

To analyze bundle size and composition:

```bash
npm run build:analyze
```

This will:
1. Build the production bundle
2. Analyze JavaScript bundle composition
3. Generate a detailed report
4. Identify large dependencies
5. Suggest optimization opportunities

## CI/CD Integration

### GitHub Actions example:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:prod
      - run: npm run test
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: eyes-of-azrael
```

## Monitoring

After deployment, monitor:
- Firebase Hosting metrics
- Page load times (< 3 seconds)
- Asset load times
- Error rates in Firebase Console
- User feedback

## Security

Production builds automatically:
- Remove console statements
- Remove debugger statements
- Remove source code comments
- Generate obfuscated variable names

For additional security:
- Enable Firebase Security Rules
- Set up HTTPS only
- Configure CORS policies
- Enable rate limiting

## Support

For issues or questions:
1. Check this deployment guide
2. Review build-report.json
3. Check Firebase Console logs
4. Review GitHub Issues

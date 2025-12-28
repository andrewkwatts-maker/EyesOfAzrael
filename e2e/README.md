# End-to-End Testing with Playwright

This directory contains comprehensive E2E tests for the EyesOfAzrael mythology platform.

## Test Structure

```
e2e/
├── helpers/              # Test utilities and helpers
│   ├── auth-helper.js    # Authentication mocking
│   └── test-data.js      # Test data and utilities
├── user-flows.spec.js    # Critical user flow tests
├── accessibility.spec.js # Accessibility and a11y tests
├── visual.spec.js        # Visual regression tests
├── performance.spec.js   # Performance benchmarks
└── firebase.spec.js      # Firebase integration tests
```

## Test Suites

### 1. User Flows (`user-flows.spec.js`)
Tests critical user journeys:
- Homepage loading
- Search functionality
- Navigation between pages
- Firebase data integration
- Responsive design (mobile/tablet)
- Compare functionality
- Advanced search
- Entity detail pages
- Archetype system
- Page performance

### 2. Accessibility (`accessibility.spec.js`)
Ensures the site is accessible to all users:
- axe-core automated accessibility checks
- Keyboard navigation (Tab order)
- Enter key activation
- ARIA labels and roles
- Semantic HTML structure
- Image alt text
- Form labels
- Color contrast
- Skip links
- Focus indicators

### 3. Visual Regression (`visual.spec.js`)
Prevents UI regressions:
- Homepage appearance
- Navigation bar
- Search results
- Compare page layout
- Entity cards
- Modals
- Mobile responsive views
- Tablet views
- Dark mode (if available)
- Footer

### 4. Performance (`performance.spec.js`)
Monitors performance metrics:
- Page load times
- JavaScript bundle impact
- CSS resource loading
- Firebase initialization
- Search responsiveness
- Image loading optimization
- Memory usage
- Time to Interactive (TTI)
- Render blocking resources
- API response times

### 5. Firebase Integration (`firebase.spec.js`)
Tests Firebase functionality:
- Firebase initialization
- Firestore data fetching
- Entity renderer
- Search integration
- Authentication state
- Security rules
- Real-time updates
- Caching behavior
- Offline mode
- Config security

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Mobile Testing
```bash
npm run test:e2e:mobile
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### View Report
```bash
npm run test:e2e:report
```

## Test Configuration

Configuration is in `playwright.config.js`:
- Base URL: `http://localhost:8080`
- Browsers: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- Retries: 2 in CI, 0 locally
- Screenshots: On failure only
- Videos: On failure only
- Traces: On first retry

## Writing New Tests

### Basic Test Structure
```javascript
const { test, expect } = require('@playwright/test');

test('My test description', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Using Helpers
```javascript
const { mockAuth } = require('./helpers/auth-helper');
const { waitForPageLoad } = require('./helpers/test-data');

test('Authenticated flow', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/');
  await waitForPageLoad(page);
  // Your test logic
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` or `develop`
- Push to `main`
- Daily at midnight UTC
- Manual workflow dispatch

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`

## Best Practices

1. **Use Data Attributes**: Prefer `data-testid` for selectors
2. **Wait for Elements**: Use `waitFor` instead of `waitForTimeout`
3. **Clean Up**: Reset state between tests
4. **Isolate Tests**: Each test should be independent
5. **Descriptive Names**: Use clear test descriptions
6. **Check Visibility**: Verify elements exist before interacting
7. **Handle Failures**: Use `.catch()` for conditional checks
8. **Mock External Deps**: Mock Firebase auth and external APIs

## Debugging

### View Test in Browser
```bash
npm run test:e2e:headed
```

### Pause Execution
```javascript
await page.pause();
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Interactive UI
```bash
npm run test:e2e:ui
```

### View Traces
After a test failure, open Playwright Report to see traces, screenshots, and videos.

## Visual Regression Testing

### First Run
Visual tests will fail on the first run. This is expected - they generate baseline screenshots.

### Update Snapshots
```bash
npm run test:e2e:update-snapshots
```

### Review Differences
When visual tests fail, check the HTML report to see visual diffs side-by-side.

## Accessibility Testing

We use `axe-playwright` for automated accessibility testing. This checks for:
- WCAG 2.1 compliance
- Color contrast
- ARIA usage
- Semantic HTML
- Keyboard accessibility

## Performance Benchmarks

Performance tests measure:
- Page load time (< 5s)
- DOM Content Loaded (< 3s)
- Time to Interactive (< 4s)
- Firebase init (< 5s)
- Search response (< 3s)

## Known Issues

1. Visual tests may fail in CI due to font rendering differences
2. Firebase tests require valid Firebase config
3. Some tests may timeout on slow networks

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Web Vitals](https://web.dev/vitals/)

## Support

For issues with tests:
1. Check test output and screenshots
2. Review Playwright trace viewer
3. Run in headed mode to see browser
4. Check CI logs for environment differences

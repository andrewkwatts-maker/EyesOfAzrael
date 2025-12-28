# E2E Testing Quick Start Guide

## Installation (One-Time Setup)

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Most Common Commands

```bash
# Run all tests (recommended first time)
npm run test:e2e

# Run with UI (best for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# View test report
npm run test:e2e:report
```

### Debug Mode

```bash
# Debug all tests
npm run test:e2e:debug

# Debug specific file
npx playwright test e2e/user-flows.spec.js --debug

# Pause on failure
npx playwright test --headed --pause-on-failure
```

## Test Suites

| Suite | File | Tests | Purpose |
|-------|------|-------|---------|
| User Flows | `user-flows.spec.js` | 10 | Critical user journeys |
| Accessibility | `accessibility.spec.js` | 11 | WCAG compliance |
| Visual | `visual.spec.js` | 10 | UI consistency |
| Performance | `performance.spec.js` | 10 | Speed benchmarks |
| Firebase | `firebase.spec.js` | 10 | Backend integration |

## Common Tasks

### Update Visual Baselines

```bash
# When you intentionally change UI
npm run test:e2e:update-snapshots
```

### Run Specific Test

```bash
# Run one test file
npx playwright test e2e/user-flows.spec.js

# Run one test by name
npx playwright test --grep "Homepage loads"
```

### Check Accessibility

```bash
npx playwright test e2e/accessibility.spec.js
```

### Performance Check

```bash
npx playwright test e2e/performance.spec.js
```

## Understanding Results

### ✅ Pass
Test completed successfully - no action needed

### ⚠️ Flaky
Test passed but was slow or inconsistent - may need optimization

### ❌ Fail
Test failed - check:
1. Screenshots in `test-results/`
2. Video recordings (if enabled)
3. Error messages in terminal
4. HTML report: `npm run test:e2e:report`

## Troubleshooting

### Tests Failing Locally?

1. **Clear cache and restart**
   ```bash
   npx playwright install --force
   ```

2. **Update dependencies**
   ```bash
   npm install
   ```

3. **Check if site is running**
   - Playwright auto-starts server on port 8080
   - Make sure port is available

### Visual Tests Failing?

- **First run?** Normal - baselines are being created
- **Intentional change?** Update snapshots:
  ```bash
  npm run test:e2e:update-snapshots
  ```
- **Unintentional?** Check HTML report for visual diffs

### Performance Tests Failing?

- Normal on first run (cold start)
- Run again to check if consistent
- May need to adjust targets in test files

## CI/CD

Tests run automatically on:
- Pull requests to `main`/`develop`
- Push to `main`
- Daily at midnight UTC
- Manual workflow trigger

View results in GitHub Actions tab

## File Locations

```
e2e/
├── helpers/              # Test utilities
├── user-flows.spec.js    # User journeys
├── accessibility.spec.js # A11y tests
├── visual.spec.js        # Visual tests
├── performance.spec.js   # Performance
└── firebase.spec.js      # Firebase tests

test-results/             # Test artifacts (gitignored)
playwright-report/        # HTML reports (gitignored)
playwright.config.js      # Configuration
```

## Tips

### Best Practices
1. ✅ Run in UI mode during development
2. ✅ Update visual baselines after UI changes
3. ✅ Check HTML report for detailed failures
4. ✅ Use `--headed` to see what's happening
5. ✅ Run full suite before committing

### Performance
- Tests run in parallel by default
- Limit workers for debugging: `--workers=1`
- Skip slow tests: `--grep-invert "performance"`

### Writing New Tests
See `e2e/README.md` for detailed guide

## Help & Resources

- **Test Documentation:** `e2e/README.md`
- **Full Report:** `PLAYWRIGHT_E2E_TESTING_REPORT.md`
- **Playwright Docs:** https://playwright.dev
- **Config File:** `playwright.config.js`

## Quick Test Examples

### Test a Specific Flow
```bash
npx playwright test --grep "Search flow"
```

### Test Mobile Only
```bash
npm run test:e2e:mobile
```

### Generate Fresh Report
```bash
npm run test:e2e && npm run test:e2e:report
```

### Debug Failing Test
```bash
npx playwright test --debug --grep "failing-test-name"
```

---

**Need help?** Check the full documentation in `e2e/README.md` or the detailed report in `PLAYWRIGHT_E2E_TESTING_REPORT.md`

# NPM Scripts Reference - Testing

Quick reference for all testing-related npm scripts.

## Core Testing Commands

### Run Tests

```bash
# Run all tests (default)
npm test

# Run tests in watch mode (best for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (for continuous integration)
npm run test:ci
```

## Targeted Testing

### By Category

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only performance tests
npm run test:performance

# Watch performance tests
npm run test:performance:watch
```

### By Change Status

```bash
# Run tests for changed files only
npm run test:changed

# Run tests related to specific files
npm run test:related <file>
```

## Test Modes

### Debugging

```bash
# Debug tests (opens Node debugger)
npm run test:debug

# Run tests with verbose output
npm run test:verbose

# Run tests silently (minimal output)
npm run test:silent

# Stop on first failure
npm run test:bail
```

### Snapshots

```bash
# Update snapshots
npm run test:update
```

## Coverage Reporting

### Generate Reports

```bash
# Generate markdown coverage report
npm run coverage:report

# Generate coverage summary (text only)
npm run coverage:summary

# Run tests with coverage (HTML + JSON)
npm run test:coverage
```

### View Reports

```bash
# Open HTML coverage report in browser
npm run coverage:open
```

## Metrics & Dashboards

```bash
# Open interactive metrics dashboard
npm run metrics:dashboard
```

## Performance Testing

```bash
# Run all performance tests
npm run test:performance

# Run performance benchmarks
npm run test:performance:benchmarks

# Run memory leak tests
npm run test:performance:memory

# Run bundle size tests
npm run test:performance:bundle
```

## Common Workflows

### Development Workflow

```bash
# 1. Start watch mode
npm run test:watch

# 2. Make changes
# 3. Tests auto-run
# 4. Fix issues
# 5. Repeat
```

### Coverage Workflow

```bash
# 1. Run tests with coverage
npm run test:coverage

# 2. Generate report
npm run coverage:report

# 3. View in browser
npm run coverage:open

# 4. Add tests for uncovered code
# 5. Repeat
```

### CI/CD Workflow

```bash
# Run in CI mode (used by GitHub Actions)
npm run test:ci

# This runs:
# - All tests
# - With coverage
# - With 2 workers
# - In non-interactive mode
```

### Pre-Commit Workflow

```bash
# 1. Run changed tests
npm run test:changed

# 2. If passing, commit
git commit -m "Your message"

# 3. CI runs full test suite
```

## Quick Reference Table

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm test` | Run all tests | Quick check |
| `npm run test:watch` | Watch mode | Development |
| `npm run test:coverage` | Coverage | Pre-commit |
| `npm run test:ci` | CI mode | Automation |
| `npm run test:unit` | Unit tests | Component work |
| `npm run test:integration` | Integration tests | Feature work |
| `npm run test:debug` | Debug mode | Troubleshooting |
| `npm run test:changed` | Changed files | Quick validation |
| `npm run test:bail` | Stop on failure | Find first error |
| `npm run coverage:report` | Generate report | Coverage analysis |
| `npm run coverage:open` | View coverage | Coverage review |
| `npm run metrics:dashboard` | View dashboard | Team meetings |

## Advanced Usage

### Run Specific Test File

```bash
npm test -- path/to/test.js
```

### Run Specific Test

```bash
npm test -- -t "test name pattern"
```

### Run Tests with Options

```bash
# Run with coverage and update snapshots
npm run test:coverage -- --updateSnapshot

# Run unit tests in watch mode
npm run test:unit -- --watch

# Run with verbose output
npm test -- --verbose
```

### Debug Specific Test

```bash
npm run test:debug -- path/to/test.js
```

## Environment Variables

```bash
# Set Node options
NODE_OPTIONS="--max-old-space-size=4096" npm test

# Set Jest options
JEST_JUNIT_OUTPUT_DIR=./reports npm run test:ci
```

## Tips & Tricks

### Faster Tests

```bash
# Run only changed tests
npm run test:changed

# Run with max workers
npm test -- --maxWorkers=4

# Skip coverage (faster)
npm test -- --coverage=false
```

### Better Output

```bash
# Verbose mode for debugging
npm run test:verbose

# Silent mode for scripts
npm run test:silent

# Minimal summary
npm run coverage:summary
```

### Troubleshooting

```bash
# Clear cache
npx jest --clearCache

# List all tests
npx jest --listTests

# Show configuration
npx jest --showConfig
```

## Integration with Other Tools

### With Git Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:changed",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

### With VS Code

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Tests",
      "type": "npm",
      "script": "test:watch",
      "problemMatcher": []
    }
  ]
}
```

### With Lint-Staged

```json
// package.json
{
  "lint-staged": {
    "*.js": [
      "npm run test:related --",
      "git add"
    ]
  }
}
```

## Performance Optimization

### Parallel Execution

```bash
# Use all CPU cores
npm test -- --maxWorkers=100%

# Use specific number of workers
npm test -- --maxWorkers=4
```

### Test Isolation

```bash
# Run in band (sequential, good for debugging)
npm test -- --runInBand
```

## Continuous Integration

### GitHub Actions

The `test:ci` script is optimized for CI:

```yaml
- name: Run tests
  run: npm run test:ci
```

### Coverage Upload

```bash
# Generate coverage
npm run test:coverage

# Upload to Codecov (done by CI)
# Coverage files in: coverage/
```

## Documentation

For more details, see:

- [Testing Guide](./TESTING_GUIDE.md) - Comprehensive guide
- [Component Checklist](./COMPONENT_TEST_CHECKLIST.md) - What to test
- [Quick Start](./QUICK_START_TESTING.md) - Get started fast

---

**Last Updated:** 2025-12-28
**Total Scripts:** 19 test-related commands

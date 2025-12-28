# Test Execution Report

**Date:** {{date}}
**Branch:** {{branch}}
**Commit:** {{commit}}
**Build:** {{buildNumber}}
**Environment:** {{environment}}

---

## Executive Summary

- **Total Tests:** {{totalTests}}
- **Passed:** {{passedTests}} ({{passRate}}%)
- **Failed:** {{failedTests}}
- **Skipped:** {{skippedTests}}
- **Duration:** {{duration}}s
- **Status:** {{overallStatus}}

---

## Coverage Metrics

| Metric | Coverage | Change | Status |
|--------|----------|--------|--------|
| Statements | {{statementCoverage}}% | {{statementChange}} | {{statementStatus}} |
| Branches | {{branchCoverage}}% | {{branchChange}} | {{branchStatus}} |
| Functions | {{functionCoverage}}% | {{functionChange}} | {{functionStatus}} |
| Lines | {{lineCoverage}}% | {{lineChange}} | {{lineStatus}} |

### Coverage Threshold Compliance

- Statements: {{statementThresholdMet}} (Threshold: 80%)
- Branches: {{branchThresholdMet}} (Threshold: 80%)
- Functions: {{functionThresholdMet}} (Threshold: 85%)
- Lines: {{lineThresholdMet}} (Threshold: 80%)

---

## Test Results by Suite

### Unit Tests

| Suite | Tests | Passed | Failed | Skipped | Duration |
|-------|-------|--------|--------|---------|----------|
{{#each unitTestSuites}}
| {{this.name}} | {{this.total}} | {{this.passed}} | {{this.failed}} | {{this.skipped}} | {{this.duration}}s |
{{/each}}

### Integration Tests

| Suite | Tests | Passed | Failed | Skipped | Duration |
|-------|-------|--------|--------|---------|----------|
{{#each integrationTestSuites}}
| {{this.name}} | {{this.total}} | {{this.passed}} | {{this.failed}} | {{this.skipped}} | {{this.duration}}s |
{{/each}}

---

## Failed Tests

{{#if failedTests}}
{{#each failedTests}}
### {{this.suite}} - {{this.test}}

**Error:** {{this.error}}
**Location:** {{this.location}}
**Duration:** {{this.duration}}ms

```
{{this.stackTrace}}
```

**Recommendation:** {{this.recommendation}}

---

{{/each}}
{{else}}
✅ **All tests passed!**
{{/if}}

---

## Skipped Tests

{{#if skippedTests}}
{{#each skippedTests}}
- **{{this.suite}}** - {{this.test}}
  - Reason: {{this.reason}}
  - TODO: {{this.todo}}
{{/each}}
{{else}}
✅ **No skipped tests**
{{/if}}

---

## Performance Metrics

### Test Execution Performance

- **Total Duration:** {{totalDuration}}s
- **Average Test Duration:** {{avgTestDuration}}ms
- **Slowest Test:** {{slowestTest}} ({{slowestDuration}}ms)
- **Fastest Test:** {{fastestTest}} ({{fastestDuration}}ms)

### Slowest Tests (Top 10)

| Test | Suite | Duration |
|------|-------|----------|
{{#each slowestTests}}
| {{this.name}} | {{this.suite}} | {{this.duration}}ms |
{{/each}}

### Performance Flags

{{#if performanceIssues}}
⚠️ **Performance Issues Detected:**

{{#each performanceIssues}}
- {{this.test}}: {{this.duration}}ms (Expected: <{{this.threshold}}ms)
{{/each}}
{{else}}
✅ **All tests completed within acceptable time**
{{/if}}

---

## Code Quality Metrics

### Complexity

- **Average Cyclomatic Complexity:** {{avgComplexity}}
- **Files with High Complexity:** {{highComplexityFiles}}

### Maintainability

- **Maintainability Index:** {{maintainabilityIndex}}
- **Technical Debt Ratio:** {{technicalDebtRatio}}%

---

## Coverage by Component

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
{{#each componentCoverage}}
| {{this.name}} | {{this.statements}}% | {{this.branches}}% | {{this.functions}}% | {{this.lines}}% |
{{/each}}

---

## New Tests Added

{{#if newTests}}
{{#each newTests}}
- **{{this.file}}**: {{this.count}} new tests
  {{#each this.tests}}
  - {{this}}
  {{/each}}
{{/each}}
{{else}}
No new tests added in this run.
{{/if}}

---

## Tests Modified

{{#if modifiedTests}}
{{#each modifiedTests}}
- **{{this.file}}**: {{this.changes}} changes
{{/each}}
{{else}}
No tests modified in this run.
{{/if}}

---

## Trends (Last 7 Runs)

### Test Count Trend
```
{{testCountTrend}}
```

### Coverage Trend
```
{{coverageTrend}}
```

### Pass Rate Trend
```
{{passRateTrend}}
```

---

## Recommendations

{{#if recommendations}}
{{#each recommendations}}
### {{this.priority}} Priority: {{this.title}}

{{this.description}}

**Action Items:**
{{#each this.actionItems}}
- [ ] {{this}}
{{/each}}

{{/each}}
{{else}}
✅ **No recommendations at this time**
{{/if}}

---

## Action Items

### High Priority

{{#each highPriorityActions}}
- [ ] {{this}}
{{/each}}

### Medium Priority

{{#each mediumPriorityActions}}
- [ ] {{this}}
{{/each}}

### Low Priority

{{#each lowPriorityActions}}
- [ ] {{this}}
{{/each}}

---

## Environment Details

- **Node Version:** {{nodeVersion}}
- **Jest Version:** {{jestVersion}}
- **OS:** {{os}}
- **CI/CD:** {{cicd}}
- **Test Workers:** {{workers}}

---

## Files Changed Since Last Run

{{#if changedFiles}}
{{#each changedFiles}}
- {{this.file}} ({{this.additions}} additions, {{this.deletions}} deletions)
{{/each}}
{{else}}
No files changed since last run.
{{/if}}

---

## Next Steps

1. {{#if failedTests}}Fix {{failedTestCount}} failing tests{{else}}✓ All tests passing{{/if}}
2. {{#if coverageBelowThreshold}}Improve coverage in {{lowCoverageFiles}} files{{else}}✓ Coverage meets thresholds{{/if}}
3. {{#if performanceIssues}}Optimize {{slowTestCount}} slow tests{{else}}✓ Performance acceptable{{/if}}
4. {{#if skippedTests}}Review and enable {{skippedTestCount}} skipped tests{{else}}✓ No skipped tests{{/if}}

---

## Appendix

### Test Configuration

```json
{{testConfig}}
```

### Coverage Configuration

```json
{{coverageConfig}}
```

---

**Generated by:** Eyes of Azrael Test Suite
**Report Version:** 1.0.0
**Report Type:** {{reportType}}

---

*This is an automated report. For questions or issues, contact the development team.*

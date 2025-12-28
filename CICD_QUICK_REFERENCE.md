# CI/CD Quick Reference Guide

## Quick Start Checklist

### 1. Configure Secrets ⚙️
```
Settings → Secrets and variables → Actions → New repository secret
```

**Required:**
- [ ] `FIREBASE_SERVICE_ACCOUNT` (from Firebase Console)
- [ ] `FIREBASE_PROJECT_ID` (value: `eyes-of-azrael`)

**Optional:**
- [ ] `CODECOV_TOKEN` (from codecov.io)
- [ ] `SNYK_TOKEN` (from snyk.io)

📖 [Full Setup Guide](./SECRETS_SETUP_GUIDE.md)

---

### 2. Enable Branch Protection 🛡️
```
Settings → Branches → Add rule
```

- [ ] Branch name: `main`
- [ ] Require pull request reviews
- [ ] Require status checks to pass
- [ ] Require branches to be up to date

---

### 3. Add Badges to README 📛

```markdown
[![CI](https://github.com/andrewkwatts-maker/EyesOfAzrael/workflows/CI%20Pipeline/badge.svg)](https://github.com/andrewkwatts-maker/EyesOfAzrael/actions)
[![Tests](https://github.com/andrewkwatts-maker/EyesOfAzrael/workflows/Tests/badge.svg)](https://github.com/andrewkwatts-maker/EyesOfAzrael/actions)
[![Deploy](https://github.com/andrewkwatts-maker/EyesOfAzrael/workflows/Deploy%20to%20Firebase/badge.svg)](https://github.com/andrewkwatts-maker/EyesOfAzrael/actions)
[![codecov](https://codecov.io/gh/andrewkwatts-maker/EyesOfAzrael/branch/main/graph/badge.svg)](https://codecov.io/gh/andrewkwatts-maker/EyesOfAzrael)
```

---

## Workflows Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI Pipeline** | Push/PR to main | Unit tests, coverage |
| **Tests** | Push/PR, Daily | Full test suite |
| **Deploy** | Push to main, PR | Deploy to Firebase |
| **Lighthouse** | PR to main | Performance audit |
| **Security** | Weekly, Deps change | Security scanning |
| **Performance** | PR to main | Performance tests |
| **Code Quality** | PR/Push | Code quality checks |

---

## Common Commands

### Local Development
```bash
# Install dependencies
npm ci

# Run tests
npm test
npm run test:ci
npm run test:coverage

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Build
npm run build:prod
npm run build:analyze
```

### GitHub Actions
```bash
# Trigger workflow manually
Actions → Select workflow → Run workflow

# View workflow logs
Actions → Select run → Click job → Expand step

# Cancel running workflow
Actions → Select run → Cancel workflow
```

---

## Deployment Process

### Production Deployment
```bash
# 1. Merge PR to main
git checkout main
git pull origin main

# 2. Workflow automatically:
#    - Runs tests
#    - Builds project
#    - Deploys to Firebase
#    - Monitors deployment

# 3. Verify at:
https://eyesofazrael.web.app
```

### Preview Deployment
```bash
# 1. Create PR
git checkout -b feature/my-feature
git push origin feature/my-feature

# 2. Workflow automatically:
#    - Creates preview URL
#    - Comments on PR
#    - Runs Lighthouse audit

# 3. Review preview deployment
# Check PR comments for URL
```

---

## Troubleshooting

### Tests Failing
```bash
# Run locally first
npm test

# Check specific test
npm test -- path/to/test.js

# Update snapshots
npm run test:update

# Debug
npm run test:debug
```

### Deployment Failing
```bash
# Check secrets are set
Settings → Secrets and variables → Actions

# Verify Firebase credentials
firebase projects:list

# Check build locally
npm run build:prod
```

### Coverage Not Uploading
```bash
# Verify coverage file exists
ls -la coverage/

# Check Codecov token
Settings → Secrets → CODECOV_TOKEN

# Test coverage generation
npm run test:coverage
```

---

## Performance Budgets

| Metric | Budget |
|--------|--------|
| First Contentful Paint | 2000ms |
| Interactive | 3500ms |
| Largest Contentful Paint | 2500ms |
| Cumulative Layout Shift | 0.1 |
| Total Bundle | 1000KB |
| JavaScript | 500KB |
| CSS | 100KB |
| Images | 300KB |

---

## Security

### Check for Vulnerabilities
```bash
# Run audit locally
npm audit

# Fix automatically
npm audit fix

# Check for critical only
npm audit --audit-level=critical
```

### Weekly Scans
- Runs every Sunday at midnight
- Creates GitHub issue if vulnerabilities found
- Check: Issues → Labels: security, automated

---

## Monitoring

### Where to Check

**Actions Tab:**
- Workflow runs
- Build logs
- Deployment status

**Pull Requests:**
- Test results comments
- Coverage reports
- Performance metrics
- Lighthouse scores

**Issues:**
- Security alerts
- Failed workflow notifications

---

## Best Practices

### Before Committing
```bash
# 1. Run tests
npm test

# 2. Check linting
npm run lint

# 3. Format code
npm run format

# 4. Build locally
npm run build:prod
```

### Creating PRs
- [ ] Write descriptive title
- [ ] Add description of changes
- [ ] Link related issues
- [ ] Wait for all checks to pass
- [ ] Review preview deployment
- [ ] Get code review
- [ ] Resolve conversations
- [ ] Merge when ready

### After Merging
- [ ] Verify deployment succeeded
- [ ] Check production site
- [ ] Monitor for errors
- [ ] Review metrics

---

## File Locations

### Workflows
```
.github/workflows/
├── ci.yml                 # CI pipeline
├── deploy.yml             # Firebase deployment
├── tests.yml              # Test suite
├── lighthouse.yml         # Performance
├── security-scan.yml      # Security
├── performance.yml        # Benchmarks
└── code-quality.yml       # Quality checks
```

### Configuration
```
.github/
├── lighthouserc.json      # Lighthouse config
├── lighthouse-budget.json # Performance budgets
└── dependabot.yml         # Dependency updates

Root:
├── .eslintrc.json         # ESLint rules
├── .prettierrc.json       # Prettier config
└── .prettierignore        # Prettier ignore
```

### Documentation
```
├── .github/workflows/README.md    # Full workflow docs
├── SECRETS_SETUP_GUIDE.md         # Secret configuration
├── CICD_BADGES.md                 # Status badges
├── CICD_QUICK_REFERENCE.md        # This file
└── AGENT_13_CICD_PIPELINE_REPORT.md  # Complete report
```

---

## Quick Links

- [Actions Dashboard](https://github.com/andrewkwatts-maker/EyesOfAzrael/actions)
- [Secrets Configuration](https://github.com/andrewkwatts-maker/EyesOfAzrael/settings/secrets/actions)
- [Branch Protection](https://github.com/andrewkwatts-maker/EyesOfAzrael/settings/branches)
- [Firebase Console](https://console.firebase.google.com/)
- [Codecov Dashboard](https://codecov.io/gh/andrewkwatts-maker/EyesOfAzrael)

---

## Support

**Documentation:**
- Full Workflow Guide: `.github/workflows/README.md`
- Secret Setup: `SECRETS_SETUP_GUIDE.md`
- Complete Report: `AGENT_13_CICD_PIPELINE_REPORT.md`

**Issues:**
- Email: AndrewKWatts@Gmail.com
- GitHub: Create an issue with `ci/cd` label

---

## Version History

- **v1.0** (2025-12-28): Initial CI/CD pipeline setup
  - 7 workflows configured
  - 6 configuration files
  - 3 documentation guides
  - Complete automation

---

**Last Updated:** 2025-12-28
**Agent:** Final Polish Agent 13

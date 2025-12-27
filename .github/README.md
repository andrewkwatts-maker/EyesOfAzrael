# GitHub Configuration Documentation

This directory contains GitHub-specific configuration and documentation for the EyesOfAzrael project.

---

## 📁 Directory Structure

```
.github/
├── README.md                          (This file)
├── PAT_QUICK_REFERENCE.md            (Quick setup card)
├── PAT_VISUAL_GUIDE.md               (Visual diagrams and flowcharts)
│
└── workflows/
    ├── README.md                      (Workflow documentation)
    ├── deploy.yml                     (Deployment workflow)
    ├── tests.yml                      (Testing workflow)
    └── lighthouse.yml                 (Performance audit workflow)
```

---

## 🚀 Quick Start

### New to GitHub Actions?

**Start Here**: [PAT_VISUAL_GUIDE.md](PAT_VISUAL_GUIDE.md)
- Visual flowcharts and diagrams
- Step-by-step screenshots descriptions
- Decision trees for troubleshooting

### Need Quick Setup?

**Start Here**: [PAT_QUICK_REFERENCE.md](PAT_QUICK_REFERENCE.md)
- 5-minute setup guide
- Essential steps only
- Quick troubleshooting

### Setting Up Workflows?

**Start Here**: [workflows/README.md](workflows/README.md)
- Complete workflow documentation
- All required secrets
- Testing and monitoring

### Need Complete Guide?

**Start Here**: [../PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md)
- Comprehensive documentation
- Security best practices
- Detailed troubleshooting
- Alternative solutions

---

## 📚 Documentation Guide

| Document | Purpose | Length | Audience |
|----------|---------|--------|----------|
| [PAT_QUICK_REFERENCE.md](PAT_QUICK_REFERENCE.md) | Quick setup | 2 min | Experienced users |
| [PAT_VISUAL_GUIDE.md](PAT_VISUAL_GUIDE.md) | Visual guide | 10 min | Visual learners |
| [workflows/README.md](workflows/README.md) | Workflow docs | 15 min | DevOps/Maintainers |
| [../PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md) | Complete guide | 30 min | All users |

---

## 🔑 Essential Tasks

### First-Time Setup

1. **Generate PAT**: [PAT_QUICK_REFERENCE.md](PAT_QUICK_REFERENCE.md)
2. **Configure Secrets**: [workflows/README.md](workflows/README.md#required-secrets-setup)
3. **Test Workflows**: [workflows/README.md](workflows/README.md#testing-checklist)

### Regular Maintenance

- **Every 90 Days**: Rotate GitHub PAT ([PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md#token-rotation))
- **Monthly**: Review workflow runs ([workflows/README.md](workflows/README.md#monitoring-and-logs))
- **As Needed**: Troubleshoot issues ([PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md#troubleshooting))

---

## 🛡️ Security

### Required Scopes
- `repo` - Full repository access
- `workflow` - Deploy workflows and create deployments

### Best Practices
- ✅ Use 90-day token expiration
- ✅ Store tokens in GitHub Secrets only
- ✅ Rotate tokens regularly
- ✅ Use minimum required scopes

**Details**: [PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md#security-best-practices)

---

## 🔧 Workflows

### Deploy to Firebase
**File**: [workflows/deploy.yml](workflows/deploy.yml)
**Purpose**: Automated deployment to Firebase Hosting
**Trigger**: Push to main, PR to main, Manual

### Tests
**File**: [workflows/tests.yml](workflows/tests.yml)
**Purpose**: Comprehensive test suite
**Trigger**: Push, PR, Daily at 2 AM UTC

### Lighthouse CI
**File**: [workflows/lighthouse.yml](workflows/lighthouse.yml)
**Purpose**: Performance and accessibility audits
**Trigger**: Push to main, PR to main

**Details**: [workflows/README.md](workflows/README.md)

---

## 🆘 Troubleshooting

### Common Issues

| Error | Guide | Section |
|-------|-------|---------|
| "Resource not accessible" | [PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md) | Troubleshooting |
| Workflow not triggering | [workflows/README.md](workflows/README.md) | Troubleshooting |
| Firebase deployment fails | [workflows/README.md](workflows/README.md) | Troubleshooting |

### Quick Decision Tree

```
Issue with deployment?
    │
    ├─► "Resource not accessible" → PAT needs workflow scope
    ├─► "Bad credentials" → Token expired/invalid
    ├─► Firebase errors → Check service account secret
    └─► Other → Check workflow logs
```

**Full Troubleshooting**: [PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md#troubleshooting)

---

## 📞 Support

1. **Self-Service**: Read relevant documentation above
2. **Visual Help**: [PAT_VISUAL_GUIDE.md](PAT_VISUAL_GUIDE.md)
3. **GitHub Community**: https://github.community/
4. **File Issue**: Include workflow run URL and error messages

---

## 📊 Quick Reference Links

### Documentation
- [Complete PAT Guide](../PAT_UPDATE_GUIDE.md)
- [Quick Reference](PAT_QUICK_REFERENCE.md)
- [Visual Guide](PAT_VISUAL_GUIDE.md)
- [Workflow Docs](workflows/README.md)
- [Summary](../GITHUB_ACTIONS_DOCUMENTATION_SUMMARY.md)

### GitHub Resources
- [Actions Documentation](https://docs.github.com/en/actions)
- [Personal Access Tokens](https://github.com/settings/tokens)
- [Repository Secrets](../../settings/secrets/actions)
- [Workflow Runs](../../actions)

### Workflow Files
- [deploy.yml](workflows/deploy.yml)
- [tests.yml](workflows/tests.yml)
- [lighthouse.yml](workflows/lighthouse.yml)

---

**Last Updated**: 2024-12-27
**Maintainer**: EyesOfAzrael Development Team

---

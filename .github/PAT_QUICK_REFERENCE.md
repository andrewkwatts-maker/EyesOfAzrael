# GitHub PAT Quick Reference Card

## 🚀 Quick Setup (5 Minutes)

### Step 1: Generate Token
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `EyesOfAzrael-Workflow-2024-12`
4. Expiration: **90 days**
5. Scopes: ✅ `repo` + ✅ `workflow`
6. Click **"Generate token"**
7. **Copy token immediately** (shown only once)

### Step 2: Update Secret
1. Go to: https://github.com/yourusername/EyesOfAzrael/settings/secrets/actions
2. Update **GITHUB_TOKEN** secret
3. Paste token → **Update secret**

### Step 3: Test
```bash
# Via GitHub CLI
gh workflow run deploy.yml

# Check status
gh run list --workflow=deploy.yml --limit 1
```

✅ **Done!** If workflow runs without errors, you're all set.

---

## 🔑 Required Scopes

| Scope | Required | Why |
|-------|----------|-----|
| `repo` | ✅ Yes | Full repository access |
| `workflow` | ✅ Yes | **Deploy workflows & create deployments** |

---

## ⚠️ Common Errors

### "Resource not accessible by integration"
**Fix**: Token missing `workflow` scope → Regenerate with workflow scope

### "Bad credentials"
**Fix**: Token expired/invalid → Generate new token

### Workflow still fails after update
**Check**: Secret name is exactly `GITHUB_TOKEN` (case-sensitive)

---

## 🔒 Security Checklist

- [ ] Token expiration: 90 days ✅
- [ ] Stored in GitHub Secrets (encrypted) ✅
- [ ] Not committed to git ✅
- [ ] Calendar reminder for rotation ✅

---

## 📅 Rotation Reminder

**Set Reminder**: 80 days from now

**Rotation Steps**:
1. Generate new token (same scopes)
2. Update GITHUB_TOKEN secret
3. Test workflow
4. Revoke old token

---

## 📚 Full Documentation

For detailed instructions, troubleshooting, and alternatives:

**See**: [PAT_UPDATE_GUIDE.md](../PAT_UPDATE_GUIDE.md)

---

**Last Updated**: 2024-12-27

# Personal Access Token (PAT) Update Guide

## Overview

This guide provides step-by-step instructions for updating your GitHub Personal Access Token (PAT) with the `workflow` scope, which is required for GitHub Actions to deploy workflow files and create deployments programmatically.

---

## Table of Contents

1. [Why Workflow Scope is Needed](#why-workflow-scope-is-needed)
2. [Security Best Practices](#security-best-practices)
3. [Creating a New PAT with Workflow Scope](#creating-a-new-pat-with-workflow-scope)
4. [Updating Repository Secrets](#updating-repository-secrets)
5. [Testing the New PAT](#testing-the-new-pat)
6. [Alternative Solutions](#alternative-solutions)
7. [Troubleshooting](#troubleshooting)

---

## Why Workflow Scope is Needed

The `workflow` scope is required for the following operations in this repository:

### Current Use Cases

1. **Automated GitHub Deployments** (`deploy.yml`)
   - Creates deployment records via GitHub API
   - Enables deployment tracking and rollback functionality
   - Line 300-310 in `.github/workflows/deploy.yml`

2. **PR Comments from Workflows** (`deploy.yml`, `lighthouse.yml`)
   - Posts preview deployment URLs to pull requests
   - Shares Lighthouse performance reports
   - Uses `actions/github-script@v7` for GitHub API access

3. **Workflow Management**
   - Deploy new workflow files
   - Update existing workflow configurations
   - Manage workflow permissions and triggers

### What GITHUB_TOKEN Cannot Do

The default `GITHUB_TOKEN` has limited permissions and **cannot**:
- Create deployments via the GitHub REST API
- Trigger other workflows
- Modify workflow files programmatically
- Access certain repository settings

---

## Security Best Practices

### Token Expiration

**Recommended**: Set token expiration to **90 days** or less

- Reduces risk window if token is compromised
- Forces regular security reviews
- GitHub will email you before expiration

**Avoid**: "No expiration" tokens
- Higher security risk
- Violates principle of least privilege
- May not comply with organizational security policies

### Least Privilege Principle

**Only grant the scopes you need**:

| Scope | Needed? | Reason |
|-------|---------|--------|
| `workflow` | ✅ Yes | Deploy workflows and create deployments |
| `repo` | ✅ Yes | Full repository access (already required) |
| `read:org` | ❌ No | Not needed for this repository |
| `admin:repo_hook` | ❌ No | Not needed for this repository |
| `delete_repo` | ❌ No | Never needed for CI/CD |

### Secure Storage

**DO**:
- Store tokens in GitHub Secrets (encrypted at rest)
- Use environment-specific secrets (production, staging)
- Rotate tokens regularly (every 90 days)
- Audit token usage in Settings → Developer settings → Personal access tokens

**DON'T**:
- Commit tokens to version control
- Share tokens via email or chat
- Use the same token across multiple repositories
- Store tokens in plain text files

### Access Control

- **Review**: Regularly check which repositories have access to your PAT
- **Limit**: Use fine-grained PATs (if available) to scope to specific repositories
- **Monitor**: Check GitHub's security log for unexpected token usage
- **Revoke**: Immediately revoke tokens if compromised

---

## Creating a New PAT with Workflow Scope

### Step 1: Navigate to GitHub Token Settings

1. **Click your profile picture** in the top-right corner of GitHub
2. Select **Settings** from the dropdown menu
3. Scroll down to **Developer settings** in the left sidebar
4. Click **Personal access tokens**
5. Choose **Tokens (classic)** or **Fine-grained tokens**

**Screenshot Description**: You'll see the developer settings menu with options for OAuth Apps, GitHub Apps, and Personal access tokens.

### Step 2: Generate New Token

#### Option A: Classic Token (Recommended for this guide)

1. Click **Generate new token** → **Generate new token (classic)**
2. Enter your password if prompted
3. You may need to complete 2FA verification

#### Option B: Fine-Grained Token (Beta)

1. Click **Generate new token** → **Generate new token (fine-grained)**
2. More granular control but requires additional configuration

### Step 3: Configure Token Settings

**Token Name**: `EyesOfAzrael-GitHub-Actions-Workflow`
- Use descriptive names to identify purpose
- Include date for easier tracking (e.g., `EyesOfAzrael-Workflow-2024-12`)

**Expiration**: Select **90 days**
- Balances security with convenience
- Set calendar reminder to regenerate token

**Description** (Optional):
```
Workflow deployment token for EyesOfAzrael repository.
Used by GitHub Actions for deployment automation.
Created: 2024-12-27
```

### Step 4: Select Scopes

**Required Scopes**:

- [x] **repo** (Full control of private repositories)
  - [x] repo:status (Access commit status)
  - [x] repo_deployment (Access deployment status)
  - [x] public_repo (Access public repositories)
  - [x] repo:invite (Access repository invitations)
  - [x] security_events (Read and write security events)

- [x] **workflow** (Update GitHub Action workflows)
  - This is the **critical new scope** needed

**Optional Scopes** (Only if needed):
- [ ] admin:org (Only if managing organization settings)
- [ ] notifications (For notification management)

### Step 5: Generate and Copy Token

1. Click **Generate token** at the bottom
2. **CRITICAL**: Copy the token immediately
   - It will only be shown once
   - Store it temporarily in a secure password manager
3. **Do NOT close the page** until you've stored the token

**Token Format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Updating Repository Secrets

### Method 1: Via GitHub Web Interface (Recommended)

#### Step 1: Navigate to Repository Secrets

1. Go to your repository: `https://github.com/yourusername/EyesOfAzrael`
2. Click **Settings** tab
3. In left sidebar, click **Secrets and variables** → **Actions**
4. You'll see existing secrets (names only, not values)

#### Step 2: Update or Create Secret

**If GITHUB_TOKEN secret exists**:
1. Click the **Update** button next to `GITHUB_TOKEN`
2. Paste your new token
3. Click **Update secret**

**If creating new secret**:
1. Click **New repository secret**
2. Name: `GITHUB_TOKEN` (must match workflow files)
3. Secret: Paste your token
4. Click **Add secret**

**Screenshot Description**: The Secrets page shows a list of environment secrets with Update and Remove buttons, plus a "New repository secret" button.

### Method 2: Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# See: https://cli.github.com/

# Authenticate
gh auth login

# Set the secret
gh secret set GITHUB_TOKEN -b "ghp_your_token_here" -R yourusername/EyesOfAzrael

# Verify it was set
gh secret list -R yourusername/EyesOfAzrael
```

### Method 3: Via API (Advanced)

```bash
# Requires libsodium for encryption
# Install: apt-get install libsodium-dev (Linux) or brew install libsodium (Mac)

# Get repository public key
curl -H "Authorization: token YOUR_PERSONAL_TOKEN" \
     https://api.github.com/repos/yourusername/EyesOfAzrael/actions/secrets/public-key

# Encrypt and upload secret (requires additional scripting)
# See: https://docs.github.com/en/rest/actions/secrets
```

---

## Testing the New PAT

### Test 1: Trigger Manual Workflow

1. Go to **Actions** tab in your repository
2. Select **Deploy to Firebase** workflow
3. Click **Run workflow** → **Run workflow**
4. Monitor the workflow run

**Expected Result**: Workflow starts successfully without authentication errors

### Test 2: Create a Test Pull Request

```bash
# Create a test branch
git checkout -b test-pat-workflow

# Make a minor change
echo "# PAT Test" >> PAT_UPDATE_GUIDE.md
git add PAT_UPDATE_GUIDE.md
git commit -m "Test: Verify workflow PAT permissions"
git push -u origin test-pat-workflow

# Create PR via GitHub CLI
gh pr create --title "Test: PAT Workflow Permissions" --body "Testing new PAT with workflow scope"
```

**Expected Results**:
1. ✅ All workflow jobs execute successfully
2. ✅ PR receives automated comments (Lighthouse results, preview URL)
3. ✅ No authentication or permission errors in logs

### Test 3: Check Deployment Creation

After a successful merge to `main`:

```bash
# View deployments via GitHub CLI
gh api repos/yourusername/EyesOfAzrael/deployments

# Or check in GitHub UI
# Go to: https://github.com/yourusername/EyesOfAzrael/deployments
```

**Expected Result**: Deployment records are created successfully

### Test 4: Verify Workflow Permissions

Check workflow run logs for permission errors:

1. Go to **Actions** tab
2. Click on the most recent workflow run
3. Expand **deploy-production** or **monitor** job
4. Check **Create GitHub deployment** step

**Look for**:
- ✅ `Status: 201 Created` (success)
- ❌ `Status: 403 Forbidden` (permission denied - PAT needs workflow scope)
- ❌ `Status: 404 Not Found` (endpoint not available - check PAT scopes)

---

## Alternative Solutions

If you cannot update the PAT with workflow scope, consider these alternatives:

### Alternative 1: Use GITHUB_TOKEN (Limited Functionality)

**Pros**:
- Automatically available in all workflows
- No manual token management
- More secure (scoped to single workflow run)

**Cons**:
- Cannot create deployments via API
- Cannot trigger other workflows
- Cannot comment on PRs from forks

**Implementation**:
```yaml
# In .github/workflows/deploy.yml
# Replace lines that use github-script for deployments
# Remove the "Create GitHub deployment" step (lines 299-310)

# Keep GITHUB_TOKEN for basic operations
- name: Comment PR with preview URL
  uses: actions/github-script@v7
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}  # Works for basic PR comments
    script: |
      github.rest.issues.createComment({...})
```

### Alternative 2: GitHub App (Recommended for Organizations)

**Pros**:
- Fine-grained permissions
- Better audit logging
- Can be scoped to specific repositories
- Automatic token rotation

**Cons**:
- More complex setup
- Requires organization admin access

**Setup**:
1. Create GitHub App in organization settings
2. Grant `deployments:write` and `contents:write` permissions
3. Install app on repository
4. Use app credentials in workflows

**Documentation**: https://docs.github.com/en/apps/creating-github-apps

### Alternative 3: Manual Workflow Upload

**Pros**:
- No token required
- Simple and direct
- Full control over workflow files

**Cons**:
- Manual process
- No automation
- Requires direct repository access

**Process**:
1. Clone repository locally
2. Edit workflow files in `.github/workflows/`
3. Commit and push changes
4. Workflows automatically update on push

```bash
# Clone repository
git clone https://github.com/yourusername/EyesOfAzrael.git
cd EyesOfAzrael

# Edit workflow files
nano .github/workflows/deploy.yml

# Commit changes
git add .github/workflows/deploy.yml
git commit -m "Update deployment workflow"
git push origin main
```

### Alternative 4: Simplify Deployment Tracking

**Remove deployment API calls** if not critical:

```yaml
# In .github/workflows/deploy.yml
# Comment out or remove lines 299-310 (Create GitHub deployment step)

# Replace with simple logging
- name: Log deployment
  run: |
    echo "Deployed to production at $(date)"
    echo "Commit: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
    echo "View at: https://your-firebase-app.web.app" >> $GITHUB_STEP_SUMMARY
```

**Pros**:
- No special token required
- Still tracks deployments (in workflow logs)
- Simpler configuration

**Cons**:
- No GitHub deployment environment tracking
- Cannot use GitHub's deployment history features

---

## Troubleshooting

### Issue: "Resource not accessible by integration"

**Error Message**:
```
Error: Resource not accessible by integration
HttpError: Resource not accessible by integration
```

**Cause**: Token lacks required permissions (likely missing `workflow` scope)

**Solution**:
1. Verify token has `workflow` scope selected
2. Regenerate token with correct scopes
3. Update repository secret with new token
4. Re-run workflow

### Issue: Token Not Working After Update

**Checklist**:
- [ ] Token copied completely (starts with `ghp_`)
- [ ] No extra spaces in secret value
- [ ] Secret name matches workflow file exactly (`GITHUB_TOKEN`)
- [ ] Token hasn't expired
- [ ] Repository has access to the token (check token settings)

**Debug Steps**:
```bash
# Verify secret exists
gh secret list -R yourusername/EyesOfAzrael

# Check token scopes (using the token)
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Look at X-OAuth-Scopes header in response
```

### Issue: "Bad credentials" Error

**Cause**: Token is invalid, revoked, or expired

**Solution**:
1. Check token status in GitHub Settings → Developer settings
2. Generate new token
3. Update repository secret
4. Ensure token hasn't been accidentally revoked

### Issue: Workflow Still Fails After Token Update

**Check**:
1. **Secret Name**: Must be exactly `GITHUB_TOKEN` (case-sensitive)
2. **Workflow Reference**: Check workflow files use `${{ secrets.GITHUB_TOKEN }}`
3. **Token Format**: Should start with `ghp_` (classic) or `github_pat_` (fine-grained)
4. **Repository Access**: Token must have access to this repository

**Verify in Workflow**:
```yaml
# Add debug step to check token format (DO NOT LOG FULL TOKEN)
- name: Debug token
  run: |
    echo "Token starts with: ${GITHUB_TOKEN:0:4}"
    echo "Token length: ${#GITHUB_TOKEN}"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Issue: Permission Denied for Deployment

**Workflow Log Shows**:
```
Error: HttpError: You don't have permission to create deployments
```

**Solutions**:
1. Ensure `repo` scope is selected (includes `repo_deployment`)
2. Check repository isn't archived
3. Verify you have admin/write access to repository
4. For organization repos: check organization SSO requirements

### Issue: Token Expiration Reminder

**Setup Expiration Alerts**:

1. **GitHub Email**: GitHub sends reminder 1 week before expiration
2. **Calendar Reminder**: Add to calendar when creating token
3. **Documentation**: Record expiration date in team docs

**Rotation Checklist**:
```markdown
- [ ] Generate new token with same scopes
- [ ] Update GITHUB_TOKEN repository secret
- [ ] Test workflow execution
- [ ] Revoke old token
- [ ] Update documentation with new expiration date
```

---

## Security Incident Response

### If Token is Compromised

**Immediate Actions** (within 5 minutes):

1. **Revoke Token**:
   - Go to Settings → Developer settings → Personal access tokens
   - Click "Revoke" next to the compromised token
   - Confirm revocation

2. **Generate New Token**:
   - Follow [Creating a New PAT](#creating-a-new-pat-with-workflow-scope)
   - Use different name to track generation

3. **Update Secrets**:
   - Update `GITHUB_TOKEN` repository secret
   - Update any other locations where token is stored

4. **Audit Access**:
   - Check repository audit log for suspicious activity
   - Review recent workflow runs
   - Check for unauthorized deployments

**Follow-up Actions** (within 24 hours):

- [ ] Review security logs for unauthorized access
- [ ] Scan repository history for accidentally committed tokens
- [ ] Update security documentation
- [ ] Notify team if organizational repository
- [ ] Consider enabling GitHub Advanced Security features

### Prevention Checklist

- [ ] Never commit tokens to version control
- [ ] Use `.gitignore` for local credential files
- [ ] Enable secret scanning in repository settings
- [ ] Use environment-specific tokens
- [ ] Regular token rotation (90 days)
- [ ] Document token purpose and ownership
- [ ] Use GitHub CLI for secure token management

---

## Additional Resources

### Official Documentation

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [GitHub Deployment API](https://docs.github.com/en/rest/deployments/deployments)
- [Workflow Scope Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes)

### This Repository

- Workflow files: `.github/workflows/`
- Deployment workflow: `.github/workflows/deploy.yml`
- Test workflow: `.github/workflows/tests.yml`
- Lighthouse workflow: `.github/workflows/lighthouse.yml`

### GitHub CLI

- [Installation Guide](https://cli.github.com/manual/installation)
- [Authentication](https://cli.github.com/manual/gh_auth_login)
- [Secret Management](https://cli.github.com/manual/gh_secret)

---

## Quick Reference

### Token Creation Checklist

- [ ] Navigate to Settings → Developer settings → Personal access tokens
- [ ] Click "Generate new token (classic)"
- [ ] Name: `EyesOfAzrael-Workflow-YYYY-MM`
- [ ] Expiration: 90 days
- [ ] Select scopes: `repo` + `workflow`
- [ ] Click "Generate token"
- [ ] Copy token immediately
- [ ] Store in password manager

### Secret Update Checklist

- [ ] Go to repository Settings → Secrets and variables → Actions
- [ ] Update `GITHUB_TOKEN` secret
- [ ] Paste new token value
- [ ] Click "Update secret"
- [ ] Test with manual workflow run
- [ ] Verify in workflow logs

### Testing Checklist

- [ ] Manual workflow trigger succeeds
- [ ] Pull request workflows execute
- [ ] PR comments are posted
- [ ] Deployments are created
- [ ] No permission errors in logs

---

## Support

If you encounter issues not covered in this guide:

1. **Check Workflow Logs**: Most errors are clearly described in workflow run logs
2. **GitHub Community**: [GitHub Community Forum](https://github.community/)
3. **GitHub Support**: [Contact GitHub Support](https://support.github.com/)
4. **Repository Issues**: File an issue in this repository with:
   - Workflow run URL
   - Error messages (redact sensitive information)
   - Steps to reproduce

---

**Last Updated**: 2024-12-27
**Version**: 1.0.0
**Maintainer**: EyesOfAzrael Development Team

---

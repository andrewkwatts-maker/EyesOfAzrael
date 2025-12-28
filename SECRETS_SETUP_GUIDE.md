# GitHub Secrets Setup Guide

This guide walks you through setting up the required secrets for the Eyes of Azrael CI/CD pipeline.

## Required Secrets

### 1. FIREBASE_SERVICE_ACCOUNT

**Purpose:** Allows GitHub Actions to deploy to Firebase Hosting

**Setup Steps:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`eyes-of-azrael`)
3. Click the gear icon → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the confirmation dialog
7. A JSON file will download - **keep this secure!**

8. In GitHub:
   - Go to your repository
   - Navigate to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire contents of the downloaded JSON file
   - Click **Add secret**

**Security Note:** Never commit this file to your repository!

---

### 2. FIREBASE_PROJECT_ID

**Purpose:** Identifies which Firebase project to deploy to

**Setup Steps:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project Settings**
4. Copy the **Project ID** (under "General" tab)
   - Should be: `eyes-of-azrael`

5. In GitHub:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_PROJECT_ID`
   - Value: `eyes-of-azrael`
   - Click **Add secret**

---

## Optional Secrets

### 3. CODECOV_TOKEN (Optional)

**Purpose:** Enables code coverage tracking and reporting

**Setup Steps:**

1. Go to [Codecov](https://codecov.io/)
2. Sign in with GitHub
3. Add your repository to Codecov
4. Click on the repository
5. Navigate to **Settings**
6. Copy the **Upload Token**

7. In GitHub:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: Paste the upload token
   - Click **Add secret**

**Note:** Codecov works for public repositories without a token, but having one improves reliability.

---

### 4. SNYK_TOKEN (Optional)

**Purpose:** Enables advanced security vulnerability scanning

**Setup Steps:**

1. Go to [Snyk](https://snyk.io/)
2. Sign up or sign in
3. Click on your profile icon → **Account Settings**
4. Navigate to **API Token** section
5. Click **Show** and copy your token

6. In GitHub:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `SNYK_TOKEN`
   - Value: Paste the API token
   - Click **Add secret**

**Note:** This is optional - the workflow will skip Snyk scanning if the token is not present.

---

## Verifying Secrets

After adding secrets, verify they're set correctly:

1. Go to **Settings → Secrets and variables → Actions**
2. You should see:
   - ✅ `FIREBASE_SERVICE_ACCOUNT`
   - ✅ `FIREBASE_PROJECT_ID`
   - ✅ `CODECOV_TOKEN` (optional)
   - ✅ `SNYK_TOKEN` (optional)

3. Test by running a workflow:
   - Go to **Actions** tab
   - Select "Deploy to Firebase" workflow
   - Click **Run workflow**
   - Select `main` branch
   - Click **Run workflow**

4. Monitor the workflow run:
   - If secrets are correct, deployment should succeed
   - If there are errors, check the logs for authentication issues

---

## Default Secrets

GitHub automatically provides these secrets (no setup needed):

- `GITHUB_TOKEN`: Used for PR comments, creating deployments, etc.
- `GITHUB_ACTOR`: GitHub username triggering the workflow
- `GITHUB_SHA`: Commit hash
- `GITHUB_REF`: Branch or tag ref

---

## Security Best Practices

### ✅ DO

- Store sensitive credentials only in GitHub Secrets
- Use service accounts with minimal required permissions
- Rotate secrets periodically (every 90 days)
- Delete secrets that are no longer needed
- Use different service accounts for staging/production

### ❌ DON'T

- Never commit secrets to your repository
- Don't share secrets via email or messaging apps
- Don't use personal credentials in workflows
- Don't print secrets in workflow logs
- Don't store secrets in code comments

---

## Troubleshooting

### Issue: "FIREBASE_SERVICE_ACCOUNT not found"

**Solution:**
1. Verify the secret name is exactly `FIREBASE_SERVICE_ACCOUNT` (case-sensitive)
2. Re-generate and re-add the service account JSON
3. Ensure you copied the entire JSON file contents

### Issue: "Permission denied" during deployment

**Solution:**
1. Verify the service account has "Firebase Hosting Admin" role
2. In Firebase Console → Project Settings → Service Accounts
3. Check IAM permissions for the service account
4. Add "Firebase Hosting Admin" role if missing

### Issue: "Invalid project ID"

**Solution:**
1. Verify `FIREBASE_PROJECT_ID` matches your Firebase project
2. Check for typos or extra spaces
3. Confirm project exists in Firebase Console

### Issue: Codecov upload fails

**Solution:**
1. Verify `CODECOV_TOKEN` is set correctly
2. Check that repository is added to Codecov
3. For public repos, token is optional - workflow will continue without it

---

## Updating Secrets

To update an existing secret:

1. Go to **Settings → Secrets and variables → Actions**
2. Click on the secret name
3. Click **Update secret**
4. Enter new value
5. Click **Update secret**

**Note:** You cannot view existing secret values. To verify, you must update them.

---

## Removing Secrets

To remove a secret:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **Remove** next to the secret
3. Confirm removal

**Warning:** Workflows using this secret will fail after removal.

---

## Secret Scope

Secrets are available to:
- All workflows in the repository
- All branches
- Forked repositories (only `GITHUB_TOKEN`, not custom secrets)

**Security Note:** Secrets are not exposed to pull requests from forks for security reasons.

---

## Environment-Specific Secrets

For multiple environments (staging/production):

### Option 1: Use GitHub Environments

1. Go to **Settings → Environments**
2. Create environments: `staging`, `production`
3. Add environment-specific secrets:
   - `staging`: `FIREBASE_SERVICE_ACCOUNT_STAGING`
   - `production`: `FIREBASE_SERVICE_ACCOUNT_PRODUCTION`

4. Update workflow to use environments:
```yaml
jobs:
  deploy:
    environment: production
    steps:
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
```

### Option 2: Use Separate Projects

1. Create separate Firebase projects
2. Create separate service accounts
3. Add project-specific secrets:
   - `FIREBASE_SERVICE_ACCOUNT_STAGING`
   - `FIREBASE_SERVICE_ACCOUNT_PRODUCTION`

---

## Quick Reference

| Secret | Required | Where to Get |
|--------|----------|--------------|
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Yes | Firebase Console → Service Accounts |
| `FIREBASE_PROJECT_ID` | ✅ Yes | Firebase Console → Project Settings |
| `CODECOV_TOKEN` | ❌ Optional | Codecov Dashboard |
| `SNYK_TOKEN` | ❌ Optional | Snyk Account Settings |

---

## Next Steps

After setting up secrets:

1. ✅ Test deployment workflow
2. ✅ Set up branch protection rules
3. ✅ Configure Codecov (optional)
4. ✅ Configure Snyk (optional)
5. ✅ Create your first pull request
6. ✅ Monitor workflow runs

---

## Support

If you encounter issues:

1. Check workflow logs in Actions tab
2. Review Firebase Console for deployment errors
3. Verify service account permissions
4. Consult [Firebase Hosting GitHub Action docs](https://github.com/FirebaseExtended/action-hosting-deploy)
5. Create an issue in the repository

---

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Service Accounts](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [Codecov GitHub Integration](https://docs.codecov.io/docs/github-integration)
- [Snyk GitHub Integration](https://docs.snyk.io/integrations/git-repository-scm-integrations/github-integration)

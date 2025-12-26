#!/usr/bin/env python3
"""
AUTOMATED RENDERING FIXES
Applies fixes to non-compliant pages based on audit results
"""

import os
import re
from pathlib import Path
import json

BASE_DIR = Path(r'H:\Github\EyesOfAzrael')

# Load audit results
with open(BASE_DIR / 'site-audit-results.json', 'r') as f:
    audit_data = json.load(f)

fixes_applied = {
    'firebase_auth_added': 0,
    'submission_system_added': 0,
    'files_modified': []
}


def add_firebase_auth_to_file(file_path):
    """Add Firebase auth system to a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already has Firebase auth
        if 'firebase-auth.js' in content or 'user-auth.css' in content:
            return False

        # Find the </head> tag and insert before it
        auth_snippet = '''    <!-- Firebase Auth System -->
    <link rel="stylesheet" href="../../../css/user-auth.css">
    <script src="../../../js/firebase-auth.js"></script>
    <script src="../../../js/auth-guard.js"></script>
    <script src="../../../js/components/google-signin-button.js"></script>
'''

        # Check depth to adjust path
        depth = str(file_path.relative_to(BASE_DIR / 'mythos')).count(os.sep)
        if depth == 1:  # Main index (mythos/greek/index.html)
            auth_snippet = auth_snippet.replace('../../../', '../../')
        elif depth == 2:  # Category index (mythos/greek/deities/index.html)
            pass  # Already correct
        else:
            return False

        # Insert before </head>
        if '</head>' in content:
            content = content.replace('</head>', auth_snippet + '</head>')

            # Also add to header if missing
            if 'user-auth-nav' not in content:
                header_auth = '''        <div id="user-auth-nav"></div>'''
                # Find header and add
                if '<h1>' in content and '</h1>' in content:
                    # Add auth nav in header
                    if '<div class="header-content">' in content:
                        content = re.sub(
                            r'(<h1>.*?</h1>)',
                            r'\1\n' + header_auth,
                            content,
                            count=1
                        )

            # Add initialization script before </body>
            if '</body>' in content and 'GoogleSignInButton' not in content:
                init_script = '''
    <!-- Initialize Auth UI -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Google Sign-In button in header
            if (window.GoogleSignInButton) {
                const authNav = document.getElementById('user-auth-nav');
                if (authNav) {
                    window.GoogleSignInButton.injectIntoElement(authNav, {
                        showUserInfo: true,
                        showAvatar: true,
                        compact: true
                    });
                }
            }
        });
    </script>
'''
                content = content.replace('</body>', init_script + '</body>')

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return True

    except Exception as e:
        print(f"Error adding Firebase auth to {file_path}: {e}")
        return False


def add_submission_system_to_file(file_path):
    """Add submission system to a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already has submission system
        if 'submission-context.js' in content or 'submission-link.js' in content:
            return False

        # Check depth to adjust path
        depth = str(file_path.relative_to(BASE_DIR / 'mythos')).count(os.sep)
        if depth == 1:  # Main index
            prefix = '../../'
        elif depth == 2:  # Category index
            prefix = '../../../'
        else:
            return False

        # Add submission system scripts before </head>
        submission_snippet = f'''<!-- Submission Link System -->
<script src="{prefix}js/submission-context.js"></script>
<script src="{prefix}js/components/submission-link.js"></script>
<link rel="stylesheet" href="{prefix}css/submission-link.css">

'''

        if '</head>' in content:
            content = content.replace('</head>', submission_snippet + '</head>')

            # Add auto-inject script before </body>
            if '</body>' in content and 'SubmissionLink.autoInject' not in content:
                auto_inject = '''
<!-- Auto-inject submission button -->
<script>
    if (window.SubmissionLink) {
        window.SubmissionLink.autoInject();
    }
</script>

'''
                content = content.replace('</body>', auto_inject + '</body>')

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return True

    except Exception as e:
        print(f"Error adding submission system to {file_path}: {e}")
        return False


def process_issues():
    """Process all issues from audit"""
    total_issues = len(audit_data['issues_found'])
    processed = 0

    for issue in audit_data['issues_found']:
        file_path = BASE_DIR / issue['file']

        if not file_path.exists():
            continue

        modified = False

        # Check what fixes are needed
        if 'Missing Firebase auth system' in issue['issues']:
            if add_firebase_auth_to_file(file_path):
                fixes_applied['firebase_auth_added'] += 1
                modified = True

        if 'Missing submission system integration' in issue['issues']:
            if add_submission_system_to_file(file_path):
                fixes_applied['submission_system_added'] += 1
                modified = True

        if modified:
            fixes_applied['files_modified'].append(str(file_path.relative_to(BASE_DIR)))

        processed += 1
        if processed % 10 == 0:
            print(f"Processed {processed}/{total_issues} issues...")

    print(f"\nCompleted processing {processed} issues")


def generate_fixes_report():
    """Generate report of fixes applied"""
    report = f"""# RENDERING FIXES APPLIED

## Summary

- **Files Modified**: {len(fixes_applied['files_modified'])}
- **Firebase Auth Added**: {fixes_applied['firebase_auth_added']}
- **Submission System Added**: {fixes_applied['submission_system_added']}

## Files Modified

"""

    for file_path in sorted(fixes_applied['files_modified']):
        report += f"- {file_path}\n"

    report += f"""

## Next Steps

1. **Re-run audit** to verify fixes:
   ```bash
   python scripts/audit-site-rendering.py
   ```

2. **Test pages** in browser:
   - Verify Firebase auth appears in header
   - Check submission button appears
   - Test responsive layouts

3. **Address remaining issues**:
   - Add responsive grids to pages still missing them
   - Ensure Firebase content loader on main indices
   - Verify all pages render correctly

## Manual Fixes Still Needed

The following issues require manual attention:
- **Responsive Grid Layouts**: Some pages need grid CSS added
- **Firebase Content Loader**: Main index pages need content loading logic
- **Custom Styling**: Some pages may have unique layout requirements

"""

    return report


def main():
    """Main execution"""
    print("Starting automated rendering fixes...\n")
    print(f"Found {len(audit_data['issues_found'])} issues to process\n")

    # Process all issues
    process_issues()

    # Generate report
    print("\nGenerating fixes report...")
    report = generate_fixes_report()

    report_path = BASE_DIR / 'FIXES_APPLIED.md'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\nFixes applied successfully!")
    print(f"Report saved to: {report_path}")
    print(f"\nSummary:")
    print(f"  Files Modified: {len(fixes_applied['files_modified'])}")
    print(f"  Firebase Auth Added: {fixes_applied['firebase_auth_added']}")
    print(f"  Submission System Added: {fixes_applied['submission_system_added']}")


if __name__ == '__main__':
    main()

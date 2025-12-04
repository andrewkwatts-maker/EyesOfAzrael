#!/usr/bin/env python3
"""
Master audit script - runs all Norse mythology section audits.
"""
import os
import subprocess
import sys

def run_script(script_name, description):
    """Run a Python script and capture results."""
    print("=" * 80)
    print(f"RUNNING: {description}")
    print("=" * 80)

    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        return result.returncode
    except Exception as e:
        print(f"ERROR running {script_name}: {e}")
        return 1

def main():
    print("\n" + "=" * 80)
    print("NORSE MYTHOLOGY SECTION - COMPREHENSIVE AUDIT SUITE")
    print("=" * 80)
    print()

    scripts = [
        ('audit_broken_links.py', 'Broken Links Check'),
        ('audit_missing_styles.py', 'Styles.css Import Check'),
        ('audit_ascii_art.py', 'ASCII Art Detection'),
        ('audit_modern_styling.py', 'Modern Styling Validation'),
        ('audit_content_completeness.py', 'Content Completeness Analysis'),
        ('audit_missing_entities.py', 'Missing Entity Detection'),
        ('audit_cross_mythology_links.py', 'Cross-Mythology Interlinking'),
    ]

    results = {}

    for script_name, description in scripts:
        returncode = run_script(script_name, description)
        results[description] = returncode
        print()

    # Final summary
    print("=" * 80)
    print("AUDIT SUMMARY")
    print("=" * 80)
    print()

    passed = sum(1 for code in results.values() if code == 0)
    failed = sum(1 for code in results.values() if code != 0)

    for description, returncode in results.items():
        status = "[PASS]" if returncode == 0 else "[FAIL]"
        print(f"  {status} - {description}")

    print()
    print(f"Total: {passed} passed, {failed} failed out of {len(results)} checks")
    print()

    if failed == 0:
        print("*** ALL AUDITS PASSED! Norse section is in excellent condition. ***")
    else:
        print("*** SOME AUDITS FAILED. Review output above for details. ***")

    print()
    print("For detailed analysis, see: AUDIT_REPORT.md")
    print("=" * 80)

    return 0 if failed == 0 else 1

if __name__ == '__main__':
    exit(main())

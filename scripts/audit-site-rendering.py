#!/usr/bin/env python3
"""
COMPREHENSIVE SITE RENDERING AUDIT
Audits all mythology pages for rendering compliance
"""

import os
import re
from pathlib import Path
from collections import defaultdict
import json

# Define base path
BASE_DIR = Path(r'H:\Github\EyesOfAzrael')
MYTHOS_DIR = BASE_DIR / 'mythos'

# Mythologies to audit
MYTHOLOGIES = [
    'greek', 'egyptian', 'norse', 'hindu', 'buddhist', 'christian', 'jewish', 'islamic',
    'celtic', 'roman', 'persian', 'chinese', 'japanese', 'babylonian', 'sumerian',
    'aztec', 'mayan', 'yoruba'
]

# Categories to check
CATEGORIES = [
    'deities', 'heroes', 'creatures', 'cosmology', 'symbols', 'texts',
    'rituals', 'herbs', 'path', 'magic'
]

# Audit results
audit_results = {
    'total_pages': 0,
    'compliant_pages': 0,
    'issues_found': [],
    'by_mythology': {},
    'by_page_type': defaultdict(lambda: {'total': 0, 'compliant': 0, 'issues': []}),
    'missing_features': defaultdict(int)
}


def check_file_exists(file_path):
    """Check if a file exists"""
    return file_path.exists() and file_path.is_file()


def audit_html_file(file_path, page_type, mythology=None):
    """Audit a single HTML file for compliance"""
    global audit_results

    if not check_file_exists(file_path):
        return None

    audit_results['total_pages'] += 1
    audit_results['by_page_type'][page_type]['total'] += 1

    issues = []
    compliant = True

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check 1: Has breadcrumb navigation
        if '<nav' not in content or 'breadcrumb' not in content.lower():
            issues.append('Missing breadcrumb navigation')
            audit_results['missing_features']['breadcrumb'] += 1
            compliant = False

        # Check 2: Has theme system
        if 'theme-base.css' not in content and 'theme-picker' not in content:
            issues.append('Missing theme system')
            audit_results['missing_features']['theme_system'] += 1
            compliant = False

        # Check 3: Has Firebase auth
        if 'firebase-auth.js' not in content and 'user-auth' not in content:
            issues.append('Missing Firebase auth system')
            audit_results['missing_features']['firebase_auth'] += 1
            compliant = False

        # Check 4: For index pages - has responsive grid
        if 'index.html' in str(file_path):
            has_grid = any(x in content for x in [
                'grid-template-columns',
                'display: grid',
                'class="entity-grid"',
                'class="deity-grid"',
                'class="pantheon-grid"',
                'class="content-grid"'
            ])

            if not has_grid:
                issues.append('Missing responsive grid layout')
                audit_results['missing_features']['responsive_grid'] += 1
                compliant = False

        # Check 5: Has submission system integration
        if 'submission' not in content.lower():
            issues.append('Missing submission system integration')
            audit_results['missing_features']['submission_system'] += 1
            compliant = False

        # Check 6: Has proper header structure
        if '<header>' not in content or '<h1>' not in content:
            issues.append('Missing proper header structure')
            audit_results['missing_features']['header'] += 1
            compliant = False

        # Check 7: Has footer
        if '<footer>' not in content:
            issues.append('Missing footer')
            audit_results['missing_features']['footer'] += 1
            compliant = False

        # Check 8: For entity pages - check for Firebase content loader
        if page_type == 'main_index':
            if 'firebase-content-loader' not in content.lower():
                issues.append('Missing Firebase content loader')
                audit_results['missing_features']['firebase_loader'] += 1
                compliant = False

        # Check 9: Has responsive viewport meta
        if 'viewport' not in content:
            issues.append('Missing viewport meta tag')
            audit_results['missing_features']['viewport'] += 1
            compliant = False

        # Check 10: Has smart links or corpus links
        if 'smart-links' not in content and 'corpus-links' not in content:
            issues.append('Missing smart links system')
            audit_results['missing_features']['smart_links'] += 1
            compliant = False

        if compliant:
            audit_results['compliant_pages'] += 1
            audit_results['by_page_type'][page_type]['compliant'] += 1
        else:
            audit_results['issues_found'].append({
                'file': str(file_path.relative_to(BASE_DIR)),
                'page_type': page_type,
                'mythology': mythology,
                'issues': issues
            })
            audit_results['by_page_type'][page_type]['issues'].append({
                'file': str(file_path.relative_to(BASE_DIR)),
                'issues': issues
            })

        return {
            'file': str(file_path.relative_to(BASE_DIR)),
            'compliant': compliant,
            'issues': issues
        }

    except Exception as e:
        issues.append(f'Error reading file: {str(e)}')
        audit_results['issues_found'].append({
            'file': str(file_path.relative_to(BASE_DIR)),
            'page_type': page_type,
            'mythology': mythology,
            'issues': issues
        })
        return None


def audit_mythology(mythology_name):
    """Audit all pages for a specific mythology"""
    mythology_path = MYTHOS_DIR / mythology_name

    if not mythology_path.exists():
        return

    mythology_results = {
        'main_index': None,
        'categories': {}
    }

    # Audit main index
    main_index = mythology_path / 'index.html'
    if main_index.exists():
        mythology_results['main_index'] = audit_html_file(main_index, 'main_index', mythology_name)

    # Audit category index pages
    for category in CATEGORIES:
        category_index = mythology_path / category / 'index.html'
        if category_index.exists():
            result = audit_html_file(category_index, f'{category}_index', mythology_name)
            mythology_results['categories'][category] = result

    audit_results['by_mythology'][mythology_name] = mythology_results
    return mythology_results


def generate_report():
    """Generate comprehensive audit report"""
    compliance_rate = (audit_results['compliant_pages'] / audit_results['total_pages'] * 100) if audit_results['total_pages'] > 0 else 0

    report = f"""# SITE RENDERING AUDIT REPORT
Generated: {Path(__file__).name}

## EXECUTIVE SUMMARY

- **Total Pages Audited**: {audit_results['total_pages']}
- **Compliant Pages**: {audit_results['compliant_pages']}
- **Non-Compliant Pages**: {audit_results['total_pages'] - audit_results['compliant_pages']}
- **Overall Compliance Rate**: {compliance_rate:.1f}%

## COMPLIANCE BY PAGE TYPE

"""

    for page_type, stats in sorted(audit_results['by_page_type'].items()):
        type_compliance = (stats['compliant'] / stats['total'] * 100) if stats['total'] > 0 else 0
        report += f"### {page_type.replace('_', ' ').title()}\n"
        report += f"- Total: {stats['total']}\n"
        report += f"- Compliant: {stats['compliant']}\n"
        report += f"- Compliance Rate: {type_compliance:.1f}%\n\n"

    report += "\n## MOST COMMON MISSING FEATURES\n\n"
    for feature, count in sorted(audit_results['missing_features'].items(), key=lambda x: x[1], reverse=True):
        report += f"- **{feature.replace('_', ' ').title()}**: {count} pages\n"

    report += "\n## COMPLIANCE BY MYTHOLOGY\n\n"
    for mythology in MYTHOLOGIES:
        if mythology in audit_results['by_mythology']:
            myth_data = audit_results['by_mythology'][mythology]
            report += f"### {mythology.title()}\n"

            # Count total and compliant for this mythology
            myth_total = 0
            myth_compliant = 0

            if myth_data['main_index']:
                myth_total += 1
                if myth_data['main_index']['compliant']:
                    myth_compliant += 1

            for cat_result in myth_data['categories'].values():
                if cat_result:
                    myth_total += 1
                    if cat_result['compliant']:
                        myth_compliant += 1

            myth_compliance = (myth_compliant / myth_total * 100) if myth_total > 0 else 0
            report += f"- Pages: {myth_total}\n"
            report += f"- Compliant: {myth_compliant}\n"
            report += f"- Compliance: {myth_compliance:.1f}%\n\n"

    report += "\n## DETAILED ISSUES\n\n"

    # Group issues by mythology
    issues_by_mythology = defaultdict(list)
    for issue in audit_results['issues_found']:
        mythology = issue.get('mythology', 'unknown')
        issues_by_mythology[mythology].append(issue)

    for mythology in MYTHOLOGIES:
        if mythology in issues_by_mythology:
            report += f"### {mythology.title()}\n\n"
            for issue in issues_by_mythology[mythology]:
                report += f"**{issue['file']}** ({issue['page_type']})\n"
                for problem in issue['issues']:
                    report += f"  - {problem}\n"
                report += "\n"

    report += "\n## RECOMMENDATIONS\n\n"
    report += "1. **Priority 1 - Critical Issues**:\n"
    report += "   - Add missing breadcrumb navigation to all pages\n"
    report += "   - Implement Firebase auth system across all pages\n"
    report += "   - Add submission system integration\n\n"

    report += "2. **Priority 2 - Important Features**:\n"
    report += "   - Ensure all index pages have responsive grid layouts\n"
    report += "   - Add Firebase content loader to main mythology index pages\n"
    report += "   - Implement theme system consistently\n\n"

    report += "3. **Priority 3 - Polish**:\n"
    report += "   - Verify smart links/corpus links on all pages\n"
    report += "   - Ensure proper header and footer on all pages\n"
    report += "   - Add viewport meta tags where missing\n\n"

    return report


def main():
    """Main audit function"""
    print("Starting comprehensive site audit...\n")

    # Audit each mythology
    for mythology in MYTHOLOGIES:
        print(f"Auditing {mythology}...")
        audit_mythology(mythology)

    # Generate report
    print("\nGenerating audit report...")
    report = generate_report()

    # Save report
    report_path = BASE_DIR / 'SITE_AUDIT_REPORT.md'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    # Save detailed JSON
    json_path = BASE_DIR / 'site-audit-results.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        # Convert defaultdict to dict for JSON serialization
        json_data = {
            'total_pages': audit_results['total_pages'],
            'compliant_pages': audit_results['compliant_pages'],
            'issues_found': audit_results['issues_found'],
            'by_mythology': audit_results['by_mythology'],
            'by_page_type': dict(audit_results['by_page_type']),
            'missing_features': dict(audit_results['missing_features'])
        }
        json.dump(json_data, f, indent=2)

    print(f"\nAudit complete!")
    print(f"Report saved to: {report_path}")
    print(f"Detailed results saved to: {json_path}")
    print(f"\nSUMMARY:")
    print(f"   Total Pages: {audit_results['total_pages']}")
    print(f"   Compliant: {audit_results['compliant_pages']}")
    print(f"   Issues: {audit_results['total_pages'] - audit_results['compliant_pages']}")

    compliance_rate = (audit_results['compliant_pages'] / audit_results['total_pages'] * 100) if audit_results['total_pages'] > 0 else 0
    print(f"   Compliance Rate: {compliance_rate:.1f}%")


if __name__ == '__main__':
    main()

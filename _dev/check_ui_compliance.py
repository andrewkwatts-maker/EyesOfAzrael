#!/usr/bin/env python3
"""
UI Compliance Checker
Identifies HTML files missing modern UI styling, theme selectors, and proper structure
"""

import re
from pathlib import Path
import json

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

class UIComplianceChecker:
    def __init__(self):
        self.results = {
            'compliant': [],
            'non_compliant': []
        }

    def check_file(self, file_path):
        """Check a single file for UI compliance"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            return None

        # Skip redirect pages
        if re.search(r'<meta[^>]*http-equiv=["\']refresh["\']', content, re.IGNORECASE):
            return None

        # Skip template files
        if '_template' in str(file_path).lower() or '_backup' in str(file_path).lower():
            return None

        issues = []

        # 1. Check for theme-base.css
        if not re.search(r'<link[^>]*theme-base\.css', content):
            issues.append('Missing theme-base.css')

        # 2. Check for theme-picker.js
        if not re.search(r'<script[^>]*theme-picker\.js', content):
            issues.append('Missing theme-picker.js')

        # 3. Check for theme selector in header
        if not re.search(r'theme-selector|theme-toggle|id=["\']theme', content, re.IGNORECASE):
            issues.append('Missing theme selector in UI')

        # 4. Check for proper header structure
        has_header = bool(re.search(r'<header[^>]*>', content))
        if not has_header:
            issues.append('Missing <header> element')
        else:
            # Check header has content wrapper
            header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL)
            if header_match:
                header_content = header_match.group(1)
                if not re.search(r'header-content|header-wrapper', header_content):
                    issues.append('Header missing content wrapper class')
                if not re.search(r'<h1[^>]*>', header_content):
                    issues.append('Header missing <h1> title')

        # 5. Check for breadcrumb navigation
        if not re.search(r'breadcrumb|aria-label=["\']Breadcrumb', content, re.IGNORECASE):
            issues.append('Missing breadcrumb navigation')

        # 6. Check for glass-card or modern card styling
        has_modern_cards = bool(re.search(r'glass-card|card-container|nav-card', content))
        if not has_modern_cards:
            issues.append('Missing modern card styling (glass-card)')

        # 7. Check for CSS variables usage
        css_var_count = len(re.findall(r'var\(--', content))
        if css_var_count < 5:
            issues.append(f'Low CSS variable usage ({css_var_count} found)')

        # 8. Check for hero section
        has_hero = bool(re.search(r'hero-section|hero-content', content))
        if not has_hero:
            issues.append('Missing hero section')

        # 9. Check for hardcoded background colors in style tags
        style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL)
        for style in style_blocks:
            if re.search(r'background:\s*#[0-9a-fA-F]{3,8}(?!\s*;?\s*/\*)', style):
                issues.append('Hardcoded background colors in <style>')
                break

        # 10. Check for responsive design
        if not re.search(r'@media|viewport|responsive', content):
            issues.append('Missing responsive design indicators')

        rel_path = str(file_path.relative_to(ROOT_DIR))

        return {
            'path': rel_path,
            'issues': issues,
            'compliant': len(issues) == 0,
            'issue_count': len(issues)
        }

    def scan_all_files(self):
        """Scan all HTML files in the project"""
        html_files = []

        for html_file in ROOT_DIR.rglob('*.html'):
            # Skip excluded directories
            if any(excl in html_file.parts for excl in EXCLUDE_DIRS):
                continue
            html_files.append(html_file)

        print(f"Scanning {len(html_files)} HTML files...\n")

        for file_path in sorted(html_files):
            result = self.check_file(file_path)
            if result:
                if result['compliant']:
                    self.results['compliant'].append(result)
                else:
                    self.results['non_compliant'].append(result)

    def print_report(self):
        """Print compliance report"""
        total = len(self.results['compliant']) + len(self.results['non_compliant'])
        compliant_count = len(self.results['compliant'])

        print("=" * 80)
        print("UI COMPLIANCE REPORT")
        print("=" * 80)
        print()
        print(f"Total files scanned: {total}")
        print(f"Fully compliant: {compliant_count} ({compliant_count/total*100:.1f}%)")
        print(f"Non-compliant: {len(self.results['non_compliant'])} ({len(self.results['non_compliant'])/total*100:.1f}%)")
        print()

        # Group issues by type
        issue_counts = {}
        for result in self.results['non_compliant']:
            for issue in result['issues']:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1

        print("ISSUES BY TYPE:")
        print("-" * 80)
        for issue, count in sorted(issue_counts.items(), key=lambda x: -x[1]):
            print(f"  {issue}: {count} files")
        print()

        # Show worst offenders
        print("TOP 20 FILES NEEDING ATTENTION (most issues):")
        print("-" * 80)
        worst = sorted(self.results['non_compliant'], key=lambda x: -x['issue_count'])[:20]
        for result in worst:
            print(f"\n{result['path']} ({result['issue_count']} issues)")
            for issue in result['issues']:
                print(f"  - {issue}")
        print()

        # Save detailed report
        report_path = ROOT_DIR / '_dev' / 'ui_compliance_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump({
                'stats': {
                    'total': total,
                    'compliant': compliant_count,
                    'non_compliant': len(self.results['non_compliant'])
                },
                'issue_counts': issue_counts,
                'non_compliant_files': self.results['non_compliant'],
                'compliant_files': [r['path'] for r in self.results['compliant']]
            }, f, indent=2)
        print(f"Detailed report saved to: {report_path}")

        return self.results


if __name__ == '__main__':
    checker = UIComplianceChecker()
    checker.scan_all_files()
    checker.print_report()

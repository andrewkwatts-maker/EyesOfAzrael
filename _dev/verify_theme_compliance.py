#!/usr/bin/env python3
"""
Theme Compliance Verification Script
Checks all HTML files for proper theme system integration
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# Configuration
ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

# Required elements for theme compliance
REQUIRED_ELEMENTS = {
    'theme_base_css': r'<link[^>]*href="[^"]*themes/theme-base\.css"',
    'theme_picker_js': r'<script[^>]*src="[^"]*themes/theme-picker\.js"',
    'theme_animations_js': r'<script[^>]*src="[^"]*themes/theme-animations\.js"',
}

# Recommended elements
RECOMMENDED_ELEMENTS = {
    'corpus_links_css': r'<link[^>]*href="[^"]*themes/corpus-links\.css"',
    'defer_attribute': r'<script[^>]*defer[^>]*theme-picker\.js',
}

# CSS variable usage patterns
CSS_VAR_PATTERNS = [
    r'var\(--color-',
    r'var\(--font-',
    r'var\(--spacing-',
    r'var\(--radius-',
]

class ThemeComplianceChecker:
    def __init__(self):
        self.results = {
            'compliant': [],
            'partial': [],
            'missing': [],
            'errors': [],
        }
        self.stats = defaultdict(int)

    def check_file(self, file_path):
        """Check a single HTML file for theme compliance"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            rel_path = file_path.relative_to(ROOT_DIR)

            # Check required elements
            has_required = {}
            for name, pattern in REQUIRED_ELEMENTS.items():
                has_required[name] = bool(re.search(pattern, content, re.IGNORECASE))

            # Check recommended elements
            has_recommended = {}
            for name, pattern in RECOMMENDED_ELEMENTS.items():
                has_recommended[name] = bool(re.search(pattern, content, re.IGNORECASE))

            # Check CSS variable usage
            uses_css_vars = any(re.search(pattern, content) for pattern in CSS_VAR_PATTERNS)

            # Classify compliance level
            required_count = sum(has_required.values())

            if required_count == len(REQUIRED_ELEMENTS):
                self.results['compliant'].append({
                    'path': str(rel_path),
                    'has_recommended': has_recommended,
                    'uses_css_vars': uses_css_vars
                })
                self.stats['compliant'] += 1
            elif required_count > 0:
                self.results['partial'].append({
                    'path': str(rel_path),
                    'missing': [k for k, v in has_required.items() if not v],
                    'has': [k for k, v in has_required.items() if v]
                })
                self.stats['partial'] += 1
            else:
                self.results['missing'].append(str(rel_path))
                self.stats['missing'] += 1

        except Exception as e:
            self.results['errors'].append({
                'path': str(file_path.relative_to(ROOT_DIR)),
                'error': str(e)
            })
            self.stats['errors'] += 1

    def scan_directory(self):
        """Scan all HTML files in the project"""
        for file_path in ROOT_DIR.rglob('*.html'):
            # Skip excluded directories
            if any(excluded in file_path.parts for excluded in EXCLUDE_DIRS):
                continue

            self.stats['total'] += 1
            self.check_file(file_path)

    def print_report(self):
        """Print detailed compliance report"""
        print("=" * 80)
        print("THEME COMPLIANCE VERIFICATION REPORT")
        print("=" * 80)
        print()

        # Summary statistics
        print("SUMMARY")
        print("-" * 80)
        print(f"Total HTML files scanned: {self.stats['total']}")
        print(f"[OK] Fully compliant:       {self.stats['compliant']} ({self.stats['compliant']/max(self.stats['total'],1)*100:.1f}%)")
        print(f"[!!]  Partially compliant:   {self.stats['partial']} ({self.stats['partial']/max(self.stats['total'],1)*100:.1f}%)")
        print(f"[XX] Missing theme system:  {self.stats['missing']} ({self.stats['missing']/max(self.stats['total'],1)*100:.1f}%)")
        print(f"[!!]  Errors:                {self.stats['errors']}")
        print()

        # Partially compliant files (show first 20)
        if self.results['partial']:
            print("PARTIALLY COMPLIANT FILES (showing first 20)")
            print("-" * 80)
            for item in self.results['partial'][:20]:
                print(f"\n[FILE] {item['path']}")
                if item['missing']:
                    print(f"   Missing: {', '.join(item['missing'])}")
                if item['has']:
                    print(f"   Has: {', '.join(item['has'])}")
            if len(self.results['partial']) > 20:
                print(f"\n... and {len(self.results['partial']) - 20} more")
            print()

        # Missing theme system (show first 30)
        if self.results['missing']:
            print("FILES MISSING THEME SYSTEM (showing first 30)")
            print("-" * 80)
            for path in self.results['missing'][:30]:
                print(f"[XX] {path}")
            if len(self.results['missing']) > 30:
                print(f"\n... and {len(self.results['missing']) - 30} more")
            print()

        # Errors
        if self.results['errors']:
            print("ERRORS")
            print("-" * 80)
            for item in self.results['errors']:
                print(f"[!!]  {item['path']}: {item['error']}")
            print()

        # Recommendations
        print("RECOMMENDATIONS")
        print("-" * 80)
        if self.stats['missing'] > 0:
            print("[FILE] Add theme system to files missing it")
            print("  Required: theme-base.css, theme-picker.js, theme-animations.js")
        if self.stats['partial'] > 0:
            print("[FILE] Complete theme integration for partially compliant files")

        css_var_count = sum(1 for f in self.results['compliant'] if f['uses_css_vars'])
        print(f"[FILE] {self.stats['compliant'] - css_var_count} compliant files not using CSS variables")
        print("  Consider replacing hardcoded colors with var(--color-*) variables")

        print()
        print("=" * 80)

def main():
    checker = ThemeComplianceChecker()
    print("Scanning HTML files...")
    checker.scan_directory()
    checker.print_report()

    # Save detailed results to JSON
    import json
    output_file = ROOT_DIR / '_dev' / 'theme_compliance_report.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(checker.results, f, indent=2)
    print(f"\nDetailed results saved to: {output_file}")

if __name__ == '__main__':
    main()

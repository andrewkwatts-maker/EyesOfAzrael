#!/usr/bin/env python3
"""
Replace Hardcoded Colors with CSS Variables
Automatically converts common hardcoded color patterns to theme variables
"""

import re
from pathlib import Path
import json

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

# Color mapping: hardcoded value -> CSS variable
COLOR_MAPPINGS = {
    # Common dark backgrounds
    r'#0a0e27|#0A0E27': 'var(--color-bg-primary)',
    r'#151a35|#151A35': 'var(--color-bg-secondary)',
    r'#1a1f3a|#1A1F3A': 'var(--color-bg-card)',

    # Primary colors (purple/blue)
    r'#8b7fff|#8B7FFF': 'var(--color-primary)',
    r'#7c3aed|#7C3AED': 'var(--color-primary)',

    # Secondary colors (pink)
    r'#ff7eb6|#FF7EB6': 'var(--color-secondary)',

    # Accent colors (yellow/gold)
    r'#ffd93d|#FFD93D': 'var(--color-accent)',
    r'#fbbf24|#FBBF24': 'var(--color-accent)',

    # Text colors
    r'#f8f9fa|#F8F9FA': 'var(--color-text-primary)',
    r'#e5e7eb|#E5E7EB': 'var(--color-text-primary)',
    r'#adb5bd|#ADB5BD': 'var(--color-text-secondary)',
    r'#9ca3af|#9CA3AF': 'var(--color-text-secondary)',
    r'#6c757d|#6C757D': 'var(--color-text-muted)',

    # Border colors
    r'#2a2f4a|#2A2F4A': 'var(--color-border-primary)',
    r'#4a4f6a|#4A4F6A': 'var(--color-border-accent)',

    # Common whites/blacks
    r'#ffffff|#FFFFFF|#fff|#FFF': '#ffffff',  # Keep white as is
    r'#000000|#000|#000000': '#000000',  # Keep black as is
}

# RGBA mappings
RGBA_MAPPINGS = {
    r'rgba?\(139,\s*127,\s*255': 'rgba(var(--color-primary-rgb)',
    r'rgba?\(255,\s*126,\s*182': 'rgba(var(--color-secondary-rgb)',
    r'rgba?\(10,\s*14,\s*39': 'rgba(var(--color-bg-primary-rgb)',
    r'rgba?\(26,\s*31,\s*58': 'rgba(var(--color-bg-card-rgb)',
    r'rgba?\(21,\s*26,\s*53': 'rgba(var(--color-bg-secondary-rgb)',
}

class ColorFixer:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'files_modified': 0,
            'colors_replaced': 0
        }

    def replace_colors_in_content(self, content):
        """Replace hardcoded colors with CSS variables"""
        original_content = content
        replacements_made = 0

        # Replace hex colors
        for pattern, replacement in COLOR_MAPPINGS.items():
            # Match in CSS declarations
            # color: #xxx, background: #xxx, etc.
            content, count = re.subn(
                rf'((?:color|background|border-color|fill|stroke)\s*:\s*){pattern}\b',
                rf'\1{replacement}',
                content,
                flags=re.IGNORECASE
            )
            replacements_made += count

        # Replace RGBA values
        for pattern, replacement in RGBA_MAPPINGS.items():
            content, count = re.subn(
                pattern,
                replacement,
                content,
                flags=re.IGNORECASE
            )
            replacements_made += count

        return content, replacements_made

    def fix_file(self, file_path):
        """Fix colors in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            new_content, replacements = self.replace_colors_in_content(content)

            if replacements > 0:
                rel_path = file_path.relative_to(ROOT_DIR)
                print(f"  [{'DRY-RUN' if self.dry_run else 'FIXED'}] {rel_path}")
                print(f"            {replacements} color replacements")

                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
                        f.write(new_content)

                self.stats['files_modified'] += 1
                self.stats['colors_replaced'] += replacements

            self.stats['files_processed'] += 1

        except Exception as e:
            print(f"  [ERROR] {file_path.relative_to(ROOT_DIR)}: {e}")

    def process_files_from_report(self, issue_types):
        """Process files from audit report with specific issues"""
        report_file = ROOT_DIR / '_dev' / 'comprehensive_audit_report.json'

        if not report_file.exists():
            print("Error: Run comprehensive_theme_audit.py first")
            return

        with open(report_file, 'r') as f:
            report = json.load(f)

        # Get files that need improvement
        files_to_fix = set()

        for item in report['results'].get('needs_improvement', []):
            issues = item.get('issues', [])
            for issue in issues:
                if any(issue_type in issue for issue_type in issue_types):
                    files_to_fix.add(item['path'])
                    break

        print(f"Found {len(files_to_fix)} files with color issues")
        print()

        for file_path_str in sorted(files_to_fix):
            file_path = ROOT_DIR / file_path_str
            if file_path.exists():
                self.fix_file(file_path)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Replace hardcoded colors with CSS variables')
    parser.add_argument('--apply', action='store_true', help='Actually modify files')
    parser.add_argument('--all', action='store_true', help='Process all files, not just ones with issues')
    args = parser.parse_args()

    fixer = ColorFixer(dry_run=not args.apply)

    print("=" * 80)
    print("HARDCODED COLOR REPLACEMENT")
    print("=" * 80)
    print(f"Mode: {'APPLYING CHANGES' if args.apply else 'DRY-RUN'}")
    print()

    if args.all:
        print("Processing ALL HTML files...")
        for file_path in ROOT_DIR.rglob('*.html'):
            if any(excluded in file_path.parts for excluded in EXCLUDE_DIRS):
                continue
            fixer.fix_file(file_path)
    else:
        print("Processing files with color issues from audit report...")
        fixer.process_files_from_report([
            'Many hardcoded colors',
            'High hardcoded hex usage',
            'Hardcoded backgrounds'
        ])

    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Files processed: {fixer.stats['files_processed']}")
    print(f"Files modified:  {fixer.stats['files_modified']}")
    print(f"Colors replaced: {fixer.stats['colors_replaced']}")

    if fixer.dry_run:
        print()
        print("This was a DRY-RUN. Use --apply to make actual changes.")

    print("=" * 80)

if __name__ == '__main__':
    main()

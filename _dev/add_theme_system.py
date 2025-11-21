#!/usr/bin/env python3
"""
Add Theme System to HTML Files
Adds theme-base.css, theme-picker.js, and theme-animations.js to HTML files that are missing them
"""

import os
import re
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

def count_parent_dirs(file_path, root_dir):
    """Count how many '../' needed to reach root from file"""
    rel_path = file_path.relative_to(root_dir)
    return len(rel_path.parts) - 1

def add_theme_system(file_path, dry_run=True):
    """Add theme system to a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Calculate relative path to themes folder
        depth = count_parent_dirs(file_path, ROOT_DIR)
        theme_path = '../' * depth if depth > 0 else ''

        # Check what's already present
        has_theme_base = bool(re.search(r'<link[^>]*href="[^"]*themes/theme-base\.css"', content, re.IGNORECASE))
        has_theme_picker = bool(re.search(r'<script[^>]*src="[^"]*themes/theme-picker\.js"', content, re.IGNORECASE))
        has_theme_animations = bool(re.search(r'<script[^>]*src="[^"]*themes/theme-animations\.js"', content, re.IGNORECASE))

        modified = False
        changes = []

        # Find <head> section
        head_match = re.search(r'(<head[^>]*>)', content, re.IGNORECASE)
        if not head_match:
            print(f"  [SKIP] No <head> tag found")
            return False

        insert_pos = head_match.end()

        # Build what needs to be added
        additions = []

        if not has_theme_base:
            additions.append(f'\n    <link rel="stylesheet" href="{theme_path}themes/theme-base.css">')
            changes.append('+ theme-base.css')

        # Check if there's already a styles.css link to insert after
        styles_match = re.search(r'<link[^>]*href="[^"]*styles\.css"[^>]*>', content, re.IGNORECASE)
        corpus_match = re.search(r'<link[^>]*href="[^"]*corpus-links\.css"[^>]*>', content, re.IGNORECASE)

        if corpus_match:
            insert_pos = corpus_match.end()
        elif styles_match:
            insert_pos = styles_match.end()

        if not has_theme_picker:
            additions.append(f'\n    <script defer src="{theme_path}themes/theme-picker.js"></script>')
            changes.append('+ theme-picker.js')

        if not has_theme_animations:
            additions.append(f'\n    <script defer src="{theme_path}themes/theme-animations.js"></script>')
            changes.append('+ theme-animations.js')

        if additions:
            # Insert the additions
            new_content = content[:insert_pos] + ''.join(additions) + content[insert_pos:]

            if not dry_run:
                with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
                    f.write(new_content)

            modified = True
            rel_path = file_path.relative_to(ROOT_DIR)
            print(f"  [{'DRY-RUN' if dry_run else 'FIXED'}] {rel_path}")
            print(f"            {', '.join(changes)}")

        return modified

    except Exception as e:
        print(f"  [ERROR] {file_path.relative_to(ROOT_DIR)}: {e}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Add theme system to HTML files')
    parser.add_argument('--apply', action='store_true', help='Actually modify files (default is dry-run)')
    parser.add_argument('--filter', choices=['missing', 'partial', 'all'], default='all',
                      help='Which files to fix: missing (no theme), partial (incomplete), all')
    args = parser.parse_args()

    dry_run = not args.apply

    print("="  * 80)
    print("THEME SYSTEM AUTO-FIX")
    print("=" * 80)
    print(f"Mode: {'DRY-RUN (use --apply to make changes)' if dry_run else 'APPLYING CHANGES'}")
    print(f"Filter: {args.filter}")
    print()

    # Load the compliance report
    report_file = ROOT_DIR / '_dev' / 'theme_compliance_report.json'
    if not report_file.exists():
        print("Error: Run verify_theme_compliance.py first to generate report")
        return

    import json
    with open(report_file, 'r') as f:
        report = json.load(f)

    # Determine which files to process
    files_to_fix = []

    if args.filter in ['missing', 'all']:
        files_to_fix.extend([ROOT_DIR / p for p in report['missing']])

    if args.filter in ['partial', 'all']:
        files_to_fix.extend([ROOT_DIR / item['path'] for item in report['partial']])

    print(f"Processing {len(files_to_fix)} files...")
    print()

    fixed_count = 0
    for file_path in files_to_fix:
        if file_path.exists():
            if add_theme_system(file_path, dry_run=dry_run):
                fixed_count += 1

    print()
    print("=" * 80)
    print(f"{'DRY-RUN ' if dry_run else ''}SUMMARY")
    print("=" * 80)
    print(f"Files processed: {len(files_to_fix)}")
    print(f"Files modified: {fixed_count}")

    if dry_run:
        print()
        print("This was a DRY-RUN. Use --apply to actually make changes.")
        print("Example: python add_theme_system.py --apply --filter=all")

    print("=" * 80)

if __name__ == '__main__':
    main()

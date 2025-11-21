#!/usr/bin/env python3
"""
Comprehensive link verification and repair script for EOAPlot mythology pages.
Fixes path issues, malformed links, and identifies truly missing files.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict

# Root directory
DOCS_ROOT = Path("docs")

# Valid link patterns that should not be flagged as broken
VALID_PATTERNS = [
    r'^javascript:',
    r'^\?term=',
    r'^#',  # Anchor links
    r'^http',  # External links
]

def is_valid_pattern(href: str) -> bool:
    """Check if href matches valid patterns that should not be checked."""
    for pattern in VALID_PATTERNS:
        if re.match(pattern, href):
            return True
    return False

def calculate_depth(file_path: Path) -> int:
    """Calculate how deep a file is relative to docs/."""
    rel_path = file_path.relative_to(DOCS_ROOT)
    return len(rel_path.parts) - 1  # Subtract 1 for the file itself

def get_correct_relative_path(from_file: Path, target: str) -> str:
    """
    Calculate the correct relative path from from_file to target.
    Handles mythos-index.html, themes/, and styles.css specially.
    """
    depth = calculate_depth(from_file)

    # Special handling for common targets
    if 'mythos-index.html' in target:
        return '../' * depth + 'mythos-index.html'
    elif 'theme-base.css' in target:
        return '../' * depth + 'themes/theme-base.css'
    elif 'corpus-links.css' in target:
        return '../' * depth + 'themes/corpus-links.css'
    elif 'theme-picker.js' in target:
        return '../' * depth + 'themes/theme-picker.js'
    elif target.startswith('../../styles.css'):
        return '../' * depth + 'styles.css'

    return target

def extract_links_from_file(file_path: Path) -> List[Tuple[str, int]]:
    """Extract all href and src links from HTML file with line numbers."""
    links = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                # Find href links
                for match in re.finditer(r'href=["\']([^"\']+)["\']', line):
                    links.append((match.group(1), line_num))
                # Find src links
                for match in re.finditer(r'src=["\']([^"\']+)["\']', line):
                    links.append((match.group(1), line_num))
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return links

def find_malformed_corpus_links(file_path: Path) -> List[Tuple[int, str]]:
    """Find corpus-results links with HTML code in href attribute."""
    malformed = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                # Look for malformed corpus-results links
                if 'corpus-results/' in line and '<a class=' in line:
                    # Check if <a class= appears inside an href attribute
                    if re.search(r'href=["\'][^"\']*<a\s+class=', line):
                        malformed.append((line_num, line.strip()))
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return malformed

def fix_path_issues(file_path: Path, dry_run: bool = True) -> int:
    """Fix incorrect relative paths in file."""
    fixes_made = 0

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        depth = calculate_depth(file_path)
        correct_prefix = '../' * depth

        # Fix mythos-index.html paths (2-level deep should be ../../, 3-level should be ../../../)
        if depth == 2:
            content = re.sub(r'href=["\']../../mythos-index\.html["\']',
                           f'href="{correct_prefix}mythos-index.html"', content)
        elif depth == 3:
            # Files at 3-level depth currently using ../../ (wrong)
            content = re.sub(r'href=["\']../../mythos-index\.html["\']',
                           f'href="{correct_prefix}mythos-index.html"', content)

        # Fix theme and style paths
        if depth == 3:
            # Fix theme-base.css
            content = re.sub(r'href=["\']../../themes/theme-base\.css["\']',
                           f'href="{correct_prefix}themes/theme-base.css"', content)
            # Fix corpus-links.css
            content = re.sub(r'href=["\']../../themes/corpus-links\.css["\']',
                           f'href="{correct_prefix}themes/corpus-links.css"', content)
            # Fix theme-picker.js
            content = re.sub(r'src=["\']../../themes/theme-picker\.js["\']',
                           f'src="{correct_prefix}themes/theme-picker.js"', content)
            # Fix styles.css
            content = re.sub(r'href=["\']../../styles\.css["\']',
                           f'href="{correct_prefix}styles.css"', content)

        if content != original_content:
            fixes_made = content.count(correct_prefix) - original_content.count(correct_prefix)
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  Fixed {fixes_made} path issues in {file_path.relative_to(DOCS_ROOT)}")
            else:
                print(f"  Would fix {fixes_made} path issues in {file_path.relative_to(DOCS_ROOT)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

    return fixes_made

def fix_malformed_corpus_links_in_file(file_path: Path, dry_run: bool = True) -> int:
    """Fix malformed corpus-results links with HTML in href."""
    fixes_made = 0

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        original_lines = lines.copy()

        for i, line in enumerate(lines):
            if 'corpus-results/' in line and '<a class=' in line:
                # Pattern: href="../../../corpus-results/TRADITION/<a class="...
                # Should be: href="../../../corpus-results/TRADITION/TERM.html"

                # Try to extract the corpus link pattern
                match = re.search(r'href=["\']([^"\']*corpus-results/[^/]+)/<a\s+class=', line)
                if match:
                    # This is malformed - the href contains HTML code
                    # We need to extract just the corpus-results path and close it properly
                    base_path = match.group(1)

                    # Try to find what term this should be
                    # Look for data-term attribute or corpus-link pattern
                    term_match = re.search(r'data-term=["\']([^"\']+)["\']', line)
                    if term_match:
                        term = term_match.group(1).lower().replace(' ', '-')
                        corrected_href = f'{base_path}/{term}.html'

                        # Replace the malformed href
                        lines[i] = re.sub(
                            r'href=["\'][^"\']*corpus-results/[^/]+/<a\s+class=[^>]*>',
                            f'href="{corrected_href}">',
                            line
                        )

                        if lines[i] != line:
                            fixes_made += 1

        if lines != original_lines:
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                print(f"  Fixed {fixes_made} malformed corpus links in {file_path.relative_to(DOCS_ROOT)}")
            else:
                print(f"  Would fix {fixes_made} malformed corpus links in {file_path.relative_to(DOCS_ROOT)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

    return fixes_made

def find_missing_files(docs_root: Path) -> Dict[str, List[Path]]:
    """Find all truly missing files (not query params or valid patterns)."""
    missing_files = defaultdict(list)

    for html_file in docs_root.rglob("*.html"):
        links = extract_links_from_file(html_file)

        for href, line_num in links:
            # Skip valid patterns
            if is_valid_pattern(href):
                continue

            # Skip external links
            if href.startswith('http'):
                continue

            # Skip anchors
            if href.startswith('#'):
                continue

            # Resolve relative path
            target_path = (html_file.parent / href).resolve()

            # Check if target exists
            if not target_path.exists():
                missing_files[href].append(html_file)

    return missing_files

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Fix broken links in mythology HTML files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be fixed without making changes')
    parser.add_argument('--fix-paths', action='store_true', help='Fix incorrect relative paths')
    parser.add_argument('--fix-malformed', action='store_true', help='Fix malformed corpus links')
    parser.add_argument('--find-missing', action='store_true', help='Find truly missing files')
    parser.add_argument('--all', action='store_true', help='Run all fixes')

    args = parser.parse_args()

    if not any([args.fix_paths, args.fix_malformed, args.find_missing, args.all]):
        parser.print_help()
        return

    print("=" * 80)
    print("BROKEN LINK REPAIR SCRIPT")
    print("=" * 80)

    if args.dry_run:
        print("\n[DRY RUN MODE - No changes will be made]\n")

    total_fixes = 0

    # Fix path issues
    if args.fix_paths or args.all:
        print("\n" + "=" * 80)
        print("FIXING PATH ISSUES")
        print("=" * 80)

        for html_file in DOCS_ROOT.rglob("*.html"):
            depth = calculate_depth(html_file)
            if depth >= 2:  # Only check files 2+ levels deep
                fixes = fix_path_issues(html_file, dry_run=args.dry_run)
                total_fixes += fixes

        print(f"\nTotal path fixes: {total_fixes}")

    # Fix malformed corpus links
    if args.fix_malformed or args.all:
        print("\n" + "=" * 80)
        print("FIXING MALFORMED CORPUS LINKS")
        print("=" * 80)

        malformed_count = 0
        for html_file in DOCS_ROOT.rglob("*.html"):
            malformed = find_malformed_corpus_links(html_file)
            if malformed:
                print(f"\n{html_file.relative_to(DOCS_ROOT)}:")
                for line_num, line in malformed:
                    print(f"  Line {line_num}: {line[:100]}...")
                    malformed_count += 1

                fixes = fix_malformed_corpus_links_in_file(html_file, dry_run=args.dry_run)
                total_fixes += fixes

        print(f"\nTotal malformed links found: {malformed_count}")

    # Find missing files
    if args.find_missing or args.all:
        print("\n" + "=" * 80)
        print("MISSING FILES (excluding query params and valid patterns)")
        print("=" * 80)

        missing = find_missing_files(DOCS_ROOT)

        if missing:
            for href, referrers in sorted(missing.items()):
                print(f"\n{href}")
                print(f"  Referenced by {len(referrers)} file(s):")
                for ref in referrers[:5]:  # Show first 5
                    print(f"    - {ref.relative_to(DOCS_ROOT)}")
                if len(referrers) > 5:
                    print(f"    ... and {len(referrers) - 5} more")
        else:
            print("\nNo missing files found!")

    print("\n" + "=" * 80)
    print(f"COMPLETE - Total fixes made: {total_fixes}")
    print("=" * 80)

if __name__ == "__main__":
    main()

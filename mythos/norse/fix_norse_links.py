#!/usr/bin/env python3
"""
Script to fix broken links in Norse mythology HTML files.

This script:
1. Fixes corpus-results links to point to corpus-search.html
2. Ensures all files have proper theme includes
3. Ensures theme-picker container is present
4. Tracks all modifications for reporting
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set

class NorseLinkFixer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.modifications: Dict[str, List[str]] = {}
        self.files_processed = 0
        self.links_fixed = 0

    def log_modification(self, file_path: str, modification: str):
        """Log a modification made to a file"""
        rel_path = str(Path(file_path).relative_to(self.base_path))
        if rel_path not in self.modifications:
            self.modifications[rel_path] = []
        self.modifications[rel_path].append(modification)

    def calculate_relative_path(self, from_file: Path, to_file: str) -> str:
        """Calculate relative path from one file to another"""
        from_dir = from_file.parent

        # Count directory depth
        depth = len(from_dir.relative_to(self.base_path).parts)

        # Build relative path
        prefix = '../' * depth
        return prefix + to_file

    def fix_corpus_results_links(self, file_path: Path, content: str) -> str:
        """
        Fix corpus-results links to point to corpus-search.html with query parameters

        Pattern: ../corpus-results/norse/term.html or ../../corpus-results/norse/term.html
        Becomes: corpus-search.html?tradition=norse&term=term (with correct relative path)
        """
        def replace_corpus_link(match):
            # Extract the full link (group 2)
            full_link = match.group(2)
            attr_name = match.group(1)

            # Pattern: (../)*/corpus-results/norse/TERM.html
            corpus_match = re.search(r'((?:\.\./)+)corpus-results/norse/([^"\']+)\.html', full_link)
            if corpus_match:
                term = corpus_match.group(2)

                # Calculate correct relative path to corpus-search.html
                depth = len(file_path.parent.relative_to(self.base_path).parts)
                if depth == 0:
                    new_link = f'corpus-search.html?tradition=norse&term={term}'
                else:
                    new_link = f'{"../" * depth}corpus-search.html?tradition=norse&term={term}'

                self.links_fixed += 1
                return f'{attr_name}="{new_link}"'

            return match.group(0)

        # Match href="(../)*/corpus-results/norse/..." and data-href="(../)*/corpus-results/norse/..."
        pattern = r'(href|data-href)="(((?:\.\./)+)corpus-results/norse/[^"]+)"'
        original_content = content
        content = re.sub(pattern, replace_corpus_link, content)

        if content != original_content:
            self.log_modification(file_path, f"Fixed corpus-results links")

        return content

    def ensure_theme_includes(self, file_path: Path, content: str) -> str:
        """Ensure proper theme CSS and JS includes with correct relative paths"""
        depth = len(file_path.parent.relative_to(self.base_path).parts)
        prefix = '../' * depth

        # Check for theme-base.css
        if 'themes/theme-base.css' not in content:
            # Find the </head> tag and insert before it
            theme_includes = f'''    <link rel="stylesheet" href="{prefix}../../themes/theme-base.css">
    <link rel="stylesheet" href="{prefix}../../themes/corpus-links.css">
    <link rel="stylesheet" href="{prefix}../../styles.css">
    <script src="{prefix}../../themes/theme-picker.js" defer></script>
'''
            content = content.replace('</head>', f'{theme_includes}</head>')
            self.log_modification(file_path, "Added theme includes")
        else:
            # Verify paths are correct
            wrong_patterns = [
                (r'href="\.\./.*/themes/theme-base\.css"', f'href="{prefix}../../themes/theme-base.css"'),
                (r'href="\.\./.*/themes/corpus-links\.css"', f'href="{prefix}../../themes/corpus-links.css"'),
                (r'href="\.\./.*/styles\.css"', f'href="{prefix}../../styles.css"'),
                (r'src="\.\./.*/themes/theme-picker\.js"', f'src="{prefix}../../themes/theme-picker.js"'),
            ]

            for pattern, replacement in wrong_patterns:
                if re.search(pattern, content):
                    content = re.sub(pattern, replacement, content)
                    self.log_modification(file_path, "Fixed theme include paths")

        return content

    def ensure_theme_picker_container(self, file_path: Path, content: str) -> str:
        """Ensure theme-picker container div is present after <body> tag"""
        if '<div id="theme-picker-container"></div>' not in content:
            # Add after <body> tag
            content = re.sub(
                r'(<body[^>]*>)',
                r'\1\n<div id="theme-picker-container"></div>',
                content
            )
            self.log_modification(file_path, "Added theme-picker container")

        return content

    def process_file(self, file_path: Path):
        """Process a single HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # Apply all fixes
            content = self.fix_corpus_results_links(file_path, content)
            content = self.ensure_theme_includes(file_path, content)
            content = self.ensure_theme_picker_container(file_path, content)

            # Write back if modified
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.files_processed += 1

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    def process_all_files(self):
        """Process all HTML files in the Norse directory"""
        for html_file in self.base_path.rglob('*.html'):
            # Skip the fix script itself and analysis files
            if 'fix_norse' not in str(html_file):
                self.process_file(html_file)

    def generate_report(self) -> dict:
        """Generate a summary report of all modifications"""
        return {
            'summary': {
                'files_processed': self.files_processed,
                'links_fixed': self.links_fixed,
                'total_modifications': sum(len(mods) for mods in self.modifications.values())
            },
            'modifications_by_file': self.modifications
        }

if __name__ == '__main__':
    # Set the base path to the Norse mythology directory
    base_path = Path(__file__).parent

    print("=" * 60)
    print("Norse Mythology Link Fixer")
    print("=" * 60)
    print(f"Base path: {base_path}")
    print()

    fixer = NorseLinkFixer(base_path)
    fixer.process_all_files()

    report = fixer.generate_report()

    # Save report
    report_path = base_path / 'link_fix_report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Files processed: {report['summary']['files_processed']}")
    print(f"Links fixed: {report['summary']['links_fixed']}")
    print(f"Total modifications: {report['summary']['total_modifications']}")
    print()
    print(f"Detailed report saved to: {report_path}")
    print()

    # Print summary of modifications
    if report['modifications_by_file']:
        print("Modified files:")
        for file, mods in sorted(report['modifications_by_file'].items()):
            print(f"  {file}")
            for mod in mods:
                print(f"    - {mod}")

#!/usr/bin/env python3
"""
Fix Buddhist Mythology Files - Version 2 (Improved HTML Cleaning)
- Remove broken corpus-results links (replace with corpus-search.html?term=)
- Fix corrupted/recursive HTML in titles and text
- Ensure theme system consistency
- Add theme-picker container where missing
"""

import re
from pathlib import Path
from typing import List, Tuple
import html as html_module

class BuddhistFileFixer:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.files_processed = 0
        self.links_fixed = 0
        self.html_corruptions_fixed = 0
        self.theme_fixes = 0
        self.report = []

    def find_buddhist_html_files(self) -> List[Path]:
        """Find all HTML files in Buddhist mythology directory"""
        return list(self.base_dir.rglob("*.html"))

    def extract_clean_title(self, title_content: str) -> str:
        """Extract clean title text from corrupted HTML"""
        # Remove all HTML tags
        clean = re.sub(r'<[^>]+>', '', title_content)
        # Decode HTML entities
        clean = html_module.unescape(clean)
        # Remove excessive whitespace
        clean = ' '.join(clean.split())
        # Extract meaningful title (before " - Buddhist")
        if ' - Buddhist' in clean:
            clean = clean.split(' - Buddhist')[0]
        # Remove common corruption patterns
        clean = re.sub(r'\.html["\']?\s*title=.*', '', clean)
        clean = re.sub(r'data-term=.*', '', clean)
        clean = re.sub(r'data-tradition=.*', '', clean)
        clean = re.sub(r'href=.*', '', clean)
        # Clean up again
        clean = ' '.join(clean.split())
        return clean.strip()

    def fix_corrupted_html(self, content: str) -> Tuple[str, int]:
        """Fix recursively nested/corrupted HTML tags"""
        fixes = 0
        original = content

        # Fix corrupted <title> tags
        title_pattern = r'<title>(.+?)</title>'
        def clean_title(match):
            nonlocal fixes
            title_content = match.group(1)
            clean_text = self.extract_clean_title(title_content)
            if not clean_text or len(clean_text) > 200:
                # Fallback - extract first reasonable text
                words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', title_content)
                clean_text = words[0] if words else "Buddhist Mythology"

            fixes += 1
            return f'<title>{clean_text} - Buddhist Mythology</title>'

        content = re.sub(title_pattern, clean_title, content, flags=re.DOTALL)

        # Fix corrupted text in headers - remove corpus-link artifacts
        header_patterns = [
            (r'<h1[^>]*>([^<]*)<a[^>]*class="corpus-link"[^>]*>([^<]+)</a>.*?</h1>', r'<h1>\1\2</h1>'),
            (r'<h2[^>]*>([^<]*)<a[^>]*class="corpus-link"[^>]*>([^<]+)</a>.*?</h2>', r'<h2>\1\2</h2>'),
        ]

        for pattern, replacement in header_patterns:
            new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            if new_content != content:
                fixes += 1
                content = new_content

        return content, fixes

    def fix_corpus_links(self, content: str, file_path: Path) -> Tuple[str, int]:
        """Replace broken corpus-results links with corpus-search.html?term="""
        fixes = 0

        # Calculate relative path to corpus-search.html
        depth = len(file_path.relative_to(self.base_dir).parts) - 1
        relative_prefix = '../' * depth if depth > 0 else ''
        corpus_search_path = f'{relative_prefix}corpus-search.html'

        # Pattern: href="../corpus-results/buddhist/TERM.html"
        # Replace with: href="../corpus-search.html?term=TERM"
        pattern = r'href="(?:\.\./)*(corpus-results/buddhist/([^"]+)\.html)"'

        def replace_link(match):
            nonlocal fixes
            term = match.group(2)
            # Clean term
            term = term.replace('_', ' ').replace('-', ' ').title()
            fixes += 1
            return f'href="{corpus_search_path}?term={term}"'

        content = re.sub(pattern, replace_link, content)

        return content, fixes

    def ensure_theme_system(self, content: str) -> Tuple[str, int]:
        """Ensure theme CSS and JS are properly included"""
        fixes = 0

        # Check if theme-base.css is included
        if 'theme-base.css' not in content:
            # Find the </head> tag and insert before it
            head_end = content.find('</head>')
            if head_end != -1:
                theme_link = '\n<link rel="stylesheet" href="../../themes/theme-base.css"/>'
                content = content[:head_end] + theme_link + '\n' + content[head_end:]
                fixes += 1

        # Check if theme-picker.js is included
        if 'theme-picker.js' not in content:
            head_end = content.find('</head>')
            if head_end != -1:
                theme_script = '\n<script defer src="../../themes/theme-picker.js"></script>'
                content = content[:head_end] + theme_script + '\n' + content[head_end:]
                fixes += 1

        # Check if theme-picker container exists in body
        if '<div id="theme-picker"' not in content and '<div class="theme-picker"' not in content:
            # Insert after <body> tag
            body_start = content.find('<body')
            if body_start != -1:
                body_end = content.find('>', body_start)
                if body_end != -1:
                    theme_picker_html = '''
<!-- Theme Picker Container -->
<div id="theme-picker"></div>
'''
                    content = content[:body_end+1] + theme_picker_html + content[body_end+1:]
                    fixes += 1

        return content, fixes

    def process_file(self, file_path: Path) -> dict:
        """Process a single HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            file_fixes = {
                'path': str(file_path.relative_to(self.base_dir)),
                'corpus_links': 0,
                'html_corruptions': 0,
                'theme_fixes': 0,
                'modified': False
            }

            # Fix broken corpus links
            content, links_fixed = self.fix_corpus_links(content, file_path)
            file_fixes['corpus_links'] = links_fixed
            self.links_fixed += links_fixed

            # Fix corrupted HTML
            content, html_fixed = self.fix_corrupted_html(content)
            file_fixes['html_corruptions'] = html_fixed
            self.html_corruptions_fixed += html_fixed

            # Ensure theme system
            content, theme_fixed = self.ensure_theme_system(content)
            file_fixes['theme_fixes'] = theme_fixed
            self.theme_fixes += theme_fixed

            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                file_fixes['modified'] = True
                self.files_processed += 1

            if file_fixes['modified']:
                self.report.append(file_fixes)

            return file_fixes

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return {'path': str(file_path), 'error': str(e)}

    def run(self):
        """Run the fixer on all Buddhist HTML files"""
        print("Finding Buddhist HTML files...")
        html_files = self.find_buddhist_html_files()
        print(f"Found {len(html_files)} HTML files\n")

        print("Processing files...")
        for file_path in html_files:
            result = self.process_file(file_path)
            if result.get('modified'):
                print(f"  Fixed: {result['path']}")
                if result['corpus_links'] > 0:
                    print(f"    - {result['corpus_links']} corpus links")
                if result['html_corruptions'] > 0:
                    print(f"    - {result['html_corruptions']} HTML corruptions")
                if result['theme_fixes'] > 0:
                    print(f"    - {result['theme_fixes']} theme system fixes")

        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Files processed: {self.files_processed}")
        print(f"Corpus links fixed: {self.links_fixed}")
        print(f"HTML corruptions fixed: {self.html_corruptions_fixed}")
        print(f"Theme system fixes: {self.theme_fixes}")
        print(f"{'='*60}\n")

        return self.report

if __name__ == "__main__":
    import sys

    base_dir = r"H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\buddhist"

    fixer = BuddhistFileFixer(base_dir)
    report = fixer.run()

    # Save detailed report
    report_path = Path(base_dir) / "fix_report_v2.txt"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("Buddhist Files Fix Report (Version 2)\n")
        f.write("="*60 + "\n\n")
        for item in report:
            f.write(f"File: {item['path']}\n")
            f.write(f"  Corpus links fixed: {item.get('corpus_links', 0)}\n")
            f.write(f"  HTML corruptions fixed: {item.get('html_corruptions', 0)}\n")
            f.write(f"  Theme system fixes: {item.get('theme_fixes', 0)}\n")
            f.write("\n")

    print(f"Detailed report saved to: {report_path}")

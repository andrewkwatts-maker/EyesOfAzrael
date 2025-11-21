#!/usr/bin/env python3
"""
UI Compliance Fixer
Fixes common UI compliance issues:
1. Adds theme selector script if missing
2. Standardizes header structure with content wrapper
3. Adds breadcrumb navigation
"""

import re
import sys
from pathlib import Path
import json

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

class UIComplianceFixer:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'files_modified': 0,
            'theme_picker_added': 0,
            'headers_fixed': 0,
            'breadcrumbs_added': 0
        }

    def count_depth(self, file_path):
        """Calculate directory depth from root"""
        rel_path = file_path.relative_to(ROOT_DIR)
        return len(rel_path.parts) - 1

    def get_theme_path(self, depth):
        """Get relative path to themes folder"""
        if depth == 0:
            return ''
        return '../' * depth

    def generate_breadcrumb(self, file_path):
        """Generate breadcrumb HTML based on file path"""
        rel_path = file_path.relative_to(ROOT_DIR)
        parts = list(rel_path.parts[:-1])  # Exclude filename
        filename = rel_path.parts[-1]
        depth = len(parts)

        if depth == 0:
            return '<a href="index.html">Home</a>'

        breadcrumb_parts = []
        root_prefix = '../' * depth

        # Add home link
        breadcrumb_parts.append(f'<a href="{root_prefix}index.html">Home</a>')

        # Build path
        for i, part in enumerate(parts):
            link_depth = depth - i - 1
            link_prefix = '../' * link_depth if link_depth > 0 else ''
            display_name = part.replace('-', ' ').replace('_', ' ').title()
            breadcrumb_parts.append(f'<a href="{link_prefix}index.html">{display_name}</a>')

        return ' → '.join(breadcrumb_parts)

    def fix_theme_picker(self, content, depth):
        """Add theme-picker.js if missing"""
        if re.search(r'<script[^>]*theme-picker\.js', content):
            return content, False

        theme_path = self.get_theme_path(depth)
        script_tag = f'\n    <script defer src="{theme_path}themes/theme-picker.js"></script>'

        # Insert before </head>
        if '</head>' in content:
            content = content.replace('</head>', f'{script_tag}\n</head>')
            return content, True

        return content, False

    def fix_header_structure(self, content, file_path):
        """Fix header to have proper structure with content wrapper"""
        # Find existing header
        header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL)

        if not header_match:
            return content, False

        header_content = header_match.group(1)

        # Check if already has content wrapper
        if re.search(r'header-content|header-wrapper', header_content):
            return content, False

        # Extract components
        breadcrumb_match = re.search(r'(<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>.*?</nav>)', header_content, re.DOTALL)
        h1_match = re.search(r'(<h1[^>]*>.*?</h1>)', header_content, re.DOTALL)

        breadcrumb = breadcrumb_match.group(1) if breadcrumb_match else None
        h1 = h1_match.group(1) if h1_match else None

        # Build new header
        new_header_parts = ['<header>', '    <div class="header-content">']

        if h1:
            new_header_parts.append(f'        {h1}')

        if breadcrumb:
            new_header_parts.append(f'        {breadcrumb}')
        elif not breadcrumb:
            # Add breadcrumb if missing
            bc = self.generate_breadcrumb(file_path)
            new_header_parts.append(f'        <nav class="breadcrumb" aria-label="Breadcrumb">')
            new_header_parts.append(f'            {bc}')
            new_header_parts.append(f'        </nav>')

        new_header_parts.append('    </div>')
        new_header_parts.append('</header>')

        new_header = '\n'.join(new_header_parts)

        # Replace old header
        content = re.sub(r'<header[^>]*>.*?</header>', new_header, content, flags=re.DOTALL)
        return content, True

    def add_missing_breadcrumb(self, content, file_path):
        """Add breadcrumb if missing"""
        if re.search(r'breadcrumb', content, re.IGNORECASE):
            return content, False

        # Find header
        header_match = re.search(r'(<header[^>]*>)(.*?)(</header>)', content, re.DOTALL)
        if not header_match:
            return content, False

        bc = self.generate_breadcrumb(file_path)
        breadcrumb_html = f'\n    <nav class="breadcrumb" aria-label="Breadcrumb">\n        {bc}\n    </nav>\n'

        # Insert at end of header
        new_header = f'{header_match.group(1)}{header_match.group(2)}{breadcrumb_html}{header_match.group(3)}'
        content = content[:header_match.start()] + new_header + content[header_match.end():]

        return content, True

    def fix_file(self, file_path):
        """Fix a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            return False

        original_content = content
        depth = self.count_depth(file_path)
        modifications = []

        # Fix theme picker
        content, changed = self.fix_theme_picker(content, depth)
        if changed:
            modifications.append('Added theme-picker.js')
            self.stats['theme_picker_added'] += 1

        # Fix header structure
        content, changed = self.fix_header_structure(content, file_path)
        if changed:
            modifications.append('Fixed header structure')
            self.stats['headers_fixed'] += 1

        # Add breadcrumb if still missing
        content, changed = self.add_missing_breadcrumb(content, file_path)
        if changed:
            modifications.append('Added breadcrumb')
            self.stats['breadcrumbs_added'] += 1

        if content != original_content:
            rel_path = str(file_path.relative_to(ROOT_DIR))

            if self.dry_run:
                print(f"  [DRY-RUN] {rel_path}")
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  [FIXED] {rel_path}")

            for mod in modifications:
                print(f"           - {mod}")

            self.stats['files_modified'] += 1
            return True

        return False

    def run(self):
        """Process all HTML files"""
        print("=" * 80)
        print("UI COMPLIANCE FIXER")
        print("=" * 80)
        print(f"Mode: {'DRY-RUN (no changes)' if self.dry_run else 'APPLYING CHANGES'}")
        print()

        # Load compliance report to target specific files
        report_path = ROOT_DIR / '_dev' / 'ui_compliance_report.json'
        if report_path.exists():
            with open(report_path, 'r', encoding='utf-8') as f:
                report = json.load(f)
            target_files = [f['path'] for f in report.get('non_compliant_files', [])]
            print(f"Processing {len(target_files)} non-compliant files from report...\n")
        else:
            # Process all HTML files
            target_files = []
            for html_file in ROOT_DIR.rglob('*.html'):
                if any(excl in html_file.parts for excl in EXCLUDE_DIRS):
                    continue
                target_files.append(str(html_file.relative_to(ROOT_DIR)))
            print(f"Processing {len(target_files)} HTML files...\n")

        for rel_path in sorted(target_files):
            file_path = ROOT_DIR / rel_path
            if file_path.exists():
                self.stats['files_processed'] += 1
                self.fix_file(file_path)

        print()
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Files modified:  {self.stats['files_modified']}")
        print(f"Theme pickers added: {self.stats['theme_picker_added']}")
        print(f"Headers fixed: {self.stats['headers_fixed']}")
        print(f"Breadcrumbs added: {self.stats['breadcrumbs_added']}")
        print("=" * 80)


if __name__ == '__main__':
    dry_run = '--apply' not in sys.argv
    fixer = UIComplianceFixer(dry_run=dry_run)
    fixer.run()

    if dry_run:
        print("\nRun with --apply to make actual changes")

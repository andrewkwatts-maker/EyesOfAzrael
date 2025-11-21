#!/usr/bin/env python3
"""
Add Breadcrumb Navigation to Headers
Automatically adds proper breadcrumb navigation based on file path
"""

import re
from pathlib import Path
import json

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

class BreadcrumbAdder:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'files_modified': 0
        }

    def generate_breadcrumb(self, file_path):
        """Generate breadcrumb HTML based on file path"""
        rel_path = file_path.relative_to(ROOT_DIR)
        parts = rel_path.parts

        # Calculate depth for relative links
        depth = len(parts) - 1
        root_prefix = '../' * depth if depth > 0 else ''

        breadcrumb_parts = []

        # Always start with Home
        breadcrumb_parts.append(f'<a href="{root_prefix}mythos/index.html">Home</a>')

        # Build breadcrumb from path
        current_path = ''
        for i, part in enumerate(parts[:-1]):  # Exclude the filename
            current_path += '../' * (depth - i - 1) if depth > i + 1 else ''

            # Clean up part name for display
            display_name = part.replace('-', ' ').replace('_', ' ').title()

            # Special cases
            if part == 'mythos':
                display_name = 'Mythologies'
            elif part in ['deities', 'heroes', 'creatures', 'cosmology', 'herbs', 'magic', 'rituals', 'texts', 'symbols']:
                display_name = display_name

            # Build link
            if i < len(parts) - 1:
                link_path = current_path + part + '/index.html' if part not in ['mythos'] else current_path + 'index.html'
                breadcrumb_parts.append(f'<a href="{link_path}">{display_name}</a>')

        # Add current page name (no link)
        page_name = parts[-1].replace('.html', '').replace('-', ' ').replace('_', ' ').title()
        if page_name.lower() != 'index':
            breadcrumb_parts.append(f'<span>{page_name}</span>')

        return ' → '.join(breadcrumb_parts)

    def add_breadcrumb_to_header(self, content, file_path):
        """Add breadcrumb navigation to header"""

        # Check if breadcrumb already exists
        if re.search(r'class="breadcrumb"|breadcrumb|<nav[^>]*>.*?→', content, re.DOTALL):
            return content, False

        # Find header
        header_match = re.search(r'(<header[^>]*>)(.*?)(</header>)', content, re.DOTALL | re.IGNORECASE)

        if not header_match:
            return content, False

        header_start = header_match.group(1)
        header_content = header_match.group(2)
        header_end = header_match.group(3)

        # Generate breadcrumb
        breadcrumb = self.generate_breadcrumb(file_path)

        # Check if there's an h1 to insert after
        h1_match = re.search(r'(<h1[^>]*>.*?</h1>)', header_content, re.DOTALL | re.IGNORECASE)

        if h1_match:
            # Insert after h1
            h1_text = h1_match.group(1)
            new_header_content = header_content.replace(
                h1_text,
                f'{h1_text}\n        <nav class="breadcrumb">\n            {breadcrumb}\n        </nav>'
            )
        else:
            # Add at the end of header content
            new_header_content = header_content + f'\n        <nav class="breadcrumb">\n            {breadcrumb}\n        </nav>\n    '

        new_content = content.replace(
            header_match.group(0),
            header_start + new_header_content + header_end
        )

        return new_content, True

    def fix_file(self, file_path):
        """Add breadcrumb to a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            new_content, modified = self.add_breadcrumb_to_header(content, file_path)

            if modified:
                rel_path = file_path.relative_to(ROOT_DIR)
                print(f"  [{'DRY-RUN' if self.dry_run else 'FIXED'}] {rel_path}")
                print(f"            Added breadcrumb navigation")

                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
                        f.write(new_content)

                self.stats['files_modified'] += 1

            self.stats['files_processed'] += 1

        except Exception as e:
            print(f"  [ERROR] {file_path.relative_to(ROOT_DIR)}: {e}")

    def process_files_from_report(self):
        """Process files from audit report missing breadcrumbs"""
        report_file = ROOT_DIR / '_dev' / 'comprehensive_audit_report.json'

        if not report_file.exists():
            print("Error: Run comprehensive_theme_audit.py first")
            return

        with open(report_file, 'r') as f:
            report = json.load(f)

        # Get files missing breadcrumbs
        files_to_fix = set()

        for item in report['results'].get('needs_improvement', []):
            issues = item.get('issues', [])
            if any('breadcrumb' in issue.lower() for issue in issues):
                files_to_fix.add(item['path'])

        print(f"Found {len(files_to_fix)} files missing breadcrumb navigation")
        print()

        for file_path_str in sorted(files_to_fix):
            file_path = ROOT_DIR / file_path_str
            if file_path.exists():
                self.fix_file(file_path)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Add breadcrumb navigation to headers')
    parser.add_argument('--apply', action='store_true', help='Actually modify files')
    args = parser.parse_args()

    adder = BreadcrumbAdder(dry_run=not args.apply)

    print("=" * 80)
    print("BREADCRUMB NAVIGATION ADDITION")
    print("=" * 80)
    print(f"Mode: {'APPLYING CHANGES' if args.apply else 'DRY-RUN'}")
    print()

    adder.process_files_from_report()

    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Files processed: {adder.stats['files_processed']}")
    print(f"Files modified:  {adder.stats['files_modified']}")

    if adder.dry_run:
        print()
        print("This was a DRY-RUN. Use --apply to make actual changes.")

    print("=" * 80)

if __name__ == '__main__':
    main()

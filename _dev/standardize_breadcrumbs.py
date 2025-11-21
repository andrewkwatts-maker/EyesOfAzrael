#!/usr/bin/env python3
"""
Standardize Breadcrumb Placement
Moves breadcrumbs to be UNDER the header (outside), left-aligned.

Standard structure:
<header>
    <div class="header-content">
        <h1>Page Title</h1>
        <p class="subtitle">Optional subtitle</p>
    </div>
</header>
<nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="...">Home</a> → <a href="...">Section</a> → <span>Current</span>
</nav>
"""

import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

class BreadcrumbStandardizer:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'files_modified': 0,
            'breadcrumbs_moved': 0,
            'headers_cleaned': 0
        }

    def count_depth(self, file_path):
        """Calculate directory depth from root"""
        rel_path = file_path.relative_to(ROOT_DIR)
        return len(rel_path.parts) - 1

    def generate_breadcrumb(self, file_path):
        """Generate breadcrumb HTML based on file path"""
        rel_path = file_path.relative_to(ROOT_DIR)
        parts = list(rel_path.parts[:-1])
        depth = len(parts)

        if depth == 0:
            return '<a href="index.html">Home</a>'

        breadcrumb_parts = []
        root_prefix = '../' * depth

        breadcrumb_parts.append(f'<a href="{root_prefix}index.html">Home</a>')

        for i, part in enumerate(parts):
            link_depth = depth - i - 1
            link_prefix = '../' * link_depth if link_depth > 0 else ''
            display_name = part.replace('-', ' ').replace('_', ' ').title()
            breadcrumb_parts.append(f'<a href="{link_prefix}index.html">{display_name}</a>')

        return ' → '.join(breadcrumb_parts)

    def extract_breadcrumb_content(self, breadcrumb_html):
        """Extract the inner content of a breadcrumb nav"""
        # Remove the nav tags and get content
        match = re.search(r'<nav[^>]*>(.*?)</nav>', breadcrumb_html, re.DOTALL)
        if match:
            return match.group(1).strip()
        return breadcrumb_html.strip()

    def standardize_file(self, file_path):
        """Standardize breadcrumb placement in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            return False

        # Skip redirect pages
        if re.search(r'<meta[^>]*http-equiv=["\']refresh["\']', content, re.IGNORECASE):
            return False

        original_content = content
        modifications = []

        # Find header
        header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL)
        if not header_match:
            return False

        header_content = header_match.group(1)
        header_start = header_match.start()
        header_end = header_match.end()

        # Check if breadcrumb is inside header
        breadcrumb_in_header = re.search(
            r'<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>.*?</nav>',
            header_content,
            re.DOTALL
        )

        # Check if breadcrumb already exists after header
        after_header = content[header_end:header_end + 500]
        breadcrumb_after_header = re.search(
            r'^\s*<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>',
            after_header
        )

        if breadcrumb_after_header and not breadcrumb_in_header:
            # Already in correct position
            return False

        # Extract existing breadcrumb content
        existing_bc_content = None
        if breadcrumb_in_header:
            existing_bc_content = self.extract_breadcrumb_content(breadcrumb_in_header.group(0))

        # Remove breadcrumb from inside header
        if breadcrumb_in_header:
            new_header_content = re.sub(
                r'\s*<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>.*?</nav>\s*',
                '',
                header_content,
                flags=re.DOTALL
            )
            modifications.append('Removed breadcrumb from header')
        else:
            new_header_content = header_content

        # Clean up header - ensure it has h1 and proper structure
        has_h1 = bool(re.search(r'<h1[^>]*>', new_header_content))
        has_wrapper = bool(re.search(r'header-content', new_header_content))

        # Extract h1 if exists
        h1_match = re.search(r'<h1[^>]*>.*?</h1>', new_header_content, re.DOTALL)
        h1_content = h1_match.group(0) if h1_match else None

        # Extract subtitle/description if exists
        subtitle_match = re.search(r'<p[^>]*class="[^"]*subtitle[^"]*"[^>]*>.*?</p>', new_header_content, re.DOTALL)
        subtitle_content = subtitle_match.group(0) if subtitle_match else None

        # Build clean header
        if h1_content:
            clean_header_parts = ['<header>', '    <div class="header-content">']
            clean_header_parts.append(f'        {h1_content}')
            if subtitle_content:
                clean_header_parts.append(f'        {subtitle_content}')
            clean_header_parts.append('    </div>')
            clean_header_parts.append('</header>')
            new_header = '\n'.join(clean_header_parts)
            if new_header_content != header_content or not has_wrapper:
                modifications.append('Cleaned header structure')
        else:
            # Keep existing header but remove breadcrumb
            new_header = f'<header>{new_header_content}</header>'

        # Generate breadcrumb to place after header
        if existing_bc_content:
            bc_inner = existing_bc_content
        else:
            bc_inner = self.generate_breadcrumb(file_path)

        new_breadcrumb = f'\n<nav class="breadcrumb" aria-label="Breadcrumb">\n    {bc_inner}\n</nav>'

        # Build new content
        # Remove existing breadcrumb after header if any (we'll add fresh one)
        rest_of_content = content[header_end:]
        rest_of_content = re.sub(
            r'^\s*<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>.*?</nav>',
            '',
            rest_of_content,
            flags=re.DOTALL
        )

        new_content = content[:header_start] + new_header + new_breadcrumb + rest_of_content

        if new_content != original_content:
            rel_path = str(file_path.relative_to(ROOT_DIR))

            if self.dry_run:
                print(f"  [DRY-RUN] {rel_path}")
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  [FIXED] {rel_path}")

            for mod in modifications:
                print(f"           - {mod}")
            print(f"           - Breadcrumb placed under header")

            self.stats['files_modified'] += 1
            self.stats['breadcrumbs_moved'] += 1
            return True

        return False

    def run(self):
        """Process all HTML files"""
        print("=" * 80)
        print("BREADCRUMB STANDARDIZATION")
        print("=" * 80)
        print(f"Mode: {'DRY-RUN (no changes)' if self.dry_run else 'APPLYING CHANGES'}")
        print()
        print("Standard: Breadcrumb nav placed UNDER header, left-aligned")
        print()

        html_files = []
        for html_file in ROOT_DIR.rglob('*.html'):
            if any(excl in html_file.parts for excl in EXCLUDE_DIRS):
                continue
            html_files.append(html_file)

        print(f"Processing {len(html_files)} HTML files...\n")

        for file_path in sorted(html_files):
            self.stats['files_processed'] += 1
            self.standardize_file(file_path)

        print()
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Files modified:  {self.stats['files_modified']}")
        print(f"Breadcrumbs standardized: {self.stats['breadcrumbs_moved']}")
        print("=" * 80)


if __name__ == '__main__':
    dry_run = '--apply' not in sys.argv
    fixer = BreadcrumbStandardizer(dry_run=dry_run)
    fixer.run()

    if dry_run:
        print("\nRun with --apply to make actual changes")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert Deity HTML Pages to Firebase-Driven Architecture

Replaces hardcoded content with data-auto-populate components
that load content dynamically from Firebase.

Usage:
    python convert-deity-to-firebase.py --file ../mythos/greek/deities/zeus.html
    python convert-deity-to-firebase.py --mythology greek
    python convert-deity-to-firebase.py --all --dry-run
"""

import os
import re
import argparse
import sys
from bs4 import BeautifulSoup
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class DeityHTMLConverter:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.stats = {
            'total': 0,
            'converted': 0,
            'skipped': 0,
            'errors': 0
        }

    def convert_file(self, file_path):
        """Convert a single HTML file to Firebase architecture"""
        try:
            print(f"\n{'[DRY RUN] ' if self.dry_run else ''}Processing: {file_path}")

            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                html = f.read()

            soup = BeautifulSoup(html, 'html.parser')

            # Extract metadata
            mythology = self.get_meta_content(soup, 'mythology')
            entity_id = self.get_meta_content(soup, 'entity-id')

            if not mythology or not entity_id:
                print(f"  ⚠️  Skipping: Missing metadata (mythology or entity-id)")
                self.stats['skipped'] += 1
                return

            print(f"  Mythology: {mythology}, Entity: {entity_id}")

            # Track changes
            changes_made = []

            # 1. Replace hardcoded attribute grid
            if self.replace_attribute_grid(soup, mythology, entity_id):
                changes_made.append("attribute grid")

            # 2. Replace hardcoded myths
            if self.replace_myths_section(soup, mythology, entity_id):
                changes_made.append("myths section")

            # 3. Add Firebase rendering scripts if not present
            if self.add_firebase_scripts(soup):
                changes_made.append("Firebase scripts")

            # 4. Update head with component scripts
            if self.add_component_scripts(soup):
                changes_made.append("component scripts")

            if changes_made:
                print(f"  ✓ Changes: {', '.join(changes_made)}")

                # Save converted HTML
                if not self.dry_run:
                    converted_html = soup.prettify()
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(converted_html)
                    print(f"  ✓ Saved changes to {file_path}")
                else:
                    print(f"  [DRY RUN] Would save changes to {file_path}")

                self.stats['converted'] += 1
            else:
                print(f"  → No changes needed")
                self.stats['skipped'] += 1

        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.stats['errors'] += 1

    def get_meta_content(self, soup, name):
        """Extract content from meta tag"""
        meta = soup.find('meta', {'name': name})
        return meta.get('content') if meta else None

    def replace_attribute_grid(self, soup, mythology, entity_id):
        """Replace hardcoded attribute grid with Firebase component"""
        # Find existing attribute grid
        attr_grid = soup.find('div', class_='attribute-grid')

        if not attr_grid:
            return False

        # Check if already converted
        if attr_grid.get('data-attribute-grid') is not None:
            return False

        # Create new Firebase-driven component
        new_component = soup.new_tag('div')
        new_component['data-attribute-grid'] = ''
        new_component['data-mythology'] = mythology
        new_component['data-entity'] = entity_id
        new_component['data-allow-edit'] = 'true'
        new_component['class'] = 'attribute-grid'

        # Add loading placeholder
        loading_div = soup.new_tag('div', **{'class': 'loading-placeholder'})
        loading_div.string = 'Loading attributes from Firebase...'
        new_component.append(loading_div)

        # Replace old grid with new component
        attr_grid.replace_with(new_component)

        return True

    def replace_myths_section(self, soup, mythology, entity_id):
        """Replace hardcoded myths list with Firebase component"""
        # Find sections containing mythology
        converted = False

        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'Mythology' in h2.get_text():
                # Find h3 with "Key Myths" or similar
                for h3 in section.find_all('h3'):
                    if 'Myths' in h3.get_text() or 'Stories' in h3.get_text():
                        # Find the following ul
                        myth_ul = h3.find_next_sibling('ul')

                        if myth_ul:
                            # Check if already converted
                            if myth_ul.get('data-myth-list') is not None:
                                continue

                            # Create new Firebase-driven component
                            new_component = soup.new_tag('div')
                            new_component['data-myth-list'] = ''
                            new_component['data-mythology'] = mythology
                            new_component['data-entity'] = entity_id
                            new_component['data-allow-submissions'] = 'true'

                            # Add loading placeholder
                            loading_div = soup.new_tag('div', **{'class': 'loading-placeholder'})
                            loading_div.string = 'Loading myths from Firebase...'
                            new_component.append(loading_div)

                            # Replace old ul with new component
                            myth_ul.replace_with(new_component)
                            converted = True

        return converted

    def add_firebase_scripts(self, soup):
        """Add Firebase SDK scripts if not present"""
        head = soup.find('head')
        if not head:
            return False

        # Check if Firebase is already included
        existing_firebase = head.find('script', src=re.compile(r'firebase'))
        if existing_firebase:
            return False

        # Add Firebase scripts
        firebase_scripts = [
            'https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore-compat.js',
            'https://www.gstatic.com/firebasejs/9.17.1/firebase-auth-compat.js'
        ]

        for script_src in firebase_scripts:
            script_tag = soup.new_tag('script', src=script_src)
            head.append(script_tag)

        # Add Firebase config
        config_script = soup.new_tag('script', src='/firebase-config.js')
        head.append(config_script)

        return True

    def add_component_scripts(self, soup):
        """Add rendering component scripts if not present"""
        head = soup.find('head')
        if not head:
            return False

        # Check if components are already included
        existing_components = head.find('script', src=re.compile(r'attribute-grid-renderer'))
        if existing_components:
            return False

        # Add component scripts
        component_scripts = [
            '/js/components/attribute-grid-renderer.js',
            '/js/components/myth-list-renderer.js'
        ]

        for script_src in component_scripts:
            script_tag = soup.new_tag('script', defer=True, src=script_src)
            head.append(script_tag)

        return True

    def convert_mythology(self, mythology_name):
        """Convert all deity files for a specific mythology"""
        mythos_dir = Path('../mythos')
        mythology_dir = mythos_dir / mythology_name / 'deities'

        if not mythology_dir.exists():
            print(f"❌ Directory not found: {mythology_dir}")
            return

        html_files = list(mythology_dir.glob('*.html'))
        html_files = [f for f in html_files if f.name != 'index.html']

        print(f"\nFound {len(html_files)} deity files in {mythology_name}")
        self.stats['total'] += len(html_files)

        for html_file in html_files:
            self.convert_file(html_file)

    def convert_all(self):
        """Convert all deity files across all mythologies"""
        mythos_dir = Path('../mythos')

        if not mythos_dir.exists():
            print(f"❌ Mythos directory not found: {mythos_dir}")
            return

        # Find all mythology directories with deity subdirectories
        for mythology_dir in mythos_dir.iterdir():
            if mythology_dir.is_dir():
                deities_dir = mythology_dir / 'deities'
                if deities_dir.exists():
                    mythology_name = mythology_dir.name
                    self.convert_mythology(mythology_name)

    def print_summary(self):
        """Print conversion summary"""
        print('\n' + '═' * 70)
        print('📊 CONVERSION SUMMARY')
        print('═' * 70)
        print(f"Total files processed:  {self.stats['total']}")
        print(f"Successfully converted: {self.stats['converted']}")
        print(f"Skipped (no changes):   {self.stats['skipped']}")
        print(f"Errors:                 {self.stats['errors']}")
        print('═' * 70)

        if self.dry_run:
            print('\n💡 This was a DRY RUN. No files were modified.')
            print('   Remove --dry-run flag to apply changes.\n')
        else:
            print('\n✅ Conversion complete!\n')


def main():
    parser = argparse.ArgumentParser(description='Convert deity HTML to Firebase architecture')
    parser.add_argument('--file', help='Convert a specific file')
    parser.add_argument('--mythology', help='Convert all files in a mythology (e.g., greek)')
    parser.add_argument('--all', action='store_true', help='Convert all deity files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without modifying files')

    args = parser.parse_args()

    converter = DeityHTMLConverter(dry_run=args.dry_run)

    if args.file:
        converter.stats['total'] = 1
        converter.convert_file(Path(args.file))
    elif args.mythology:
        converter.convert_mythology(args.mythology)
    elif args.all:
        converter.convert_all()
    else:
        print('❌ Please specify --file, --mythology, or --all')
        parser.print_help()
        return

    converter.print_summary()


if __name__ == '__main__':
    main()

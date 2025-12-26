#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Universal HTML to Firebase Converter

Converts HTML pages to use Firebase rendering components
for any entity type (deity, cosmology, hero, creature, ritual, etc.)

Usage:
    python convert-to-firebase.py --type cosmology --all
    python convert-to-firebase.py --type cosmology --mythology greek
    python convert-to-firebase.py --file ../mythos/greek/cosmology/creation.html
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

class FirebaseConverter:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.stats = {
            'total': 0,
            'converted': 0,
            'skipped': 0,
            'errors': 0
        }

        # Component mappings
        self.component_map = {
            'deity': 'attribute-grid-renderer.js',
            'cosmology': 'cosmology-renderer.js',
            'hero': 'hero-renderer.js',
            'creature': 'creature-renderer.js',
            'ritual': 'ritual-renderer.js',
            'herb': 'generic-renderer.js',
            'symbol': 'generic-renderer.js',
            'concept': 'generic-renderer.js',
            'figure': 'generic-renderer.js',
            'text': 'generic-renderer.js',
            'location': 'generic-renderer.js',
            'magic': 'generic-renderer.js',
            'path': 'generic-renderer.js'
        }

    def convert_file(self, file_path, entity_type=None):
        """Convert a single HTML file to use Firebase components"""
        try:
            print(f"\n{'[DRY RUN] ' if self.dry_run else ''}Processing: {file_path}")
            self.stats['total'] += 1

            with open(file_path, 'r', encoding='utf-8') as f:
                html = f.read()

            soup = BeautifulSoup(html, 'html.parser')

            # Determine entity type if not provided
            if not entity_type:
                entity_type = self.determine_entity_type(file_path)

            # Extract metadata
            mythology = self.get_mythology_from_path(file_path)
            entity_id = Path(file_path).stem

            print(f"  Type: {entity_type}, Mythology: {mythology}, Entity: {entity_id}")

            # Track changes
            changes_made = []

            # Add Firebase scripts if not present
            if self.add_firebase_scripts(soup):
                changes_made.append("Firebase SDK")

            # Add entity-specific component
            if self.add_component_script(soup, entity_type):
                changes_made.append(f"{entity_type} component")

            # Replace main content with Firebase component
            if self.replace_with_component(soup, entity_type, mythology, entity_id):
                changes_made.append(f"{entity_type} content")

            if changes_made:
                print(f"  ✓ Changes: {', '.join(changes_made)}")

                if not self.dry_run:
                    # Save converted HTML
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(str(soup))
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

    def determine_entity_type(self, file_path):
        """Determine entity type from file path"""
        parts = Path(file_path).parts
        for i, part in enumerate(parts):
            if part in ['deities', 'cosmology', 'heroes', 'creatures', 'rituals', 'texts', 'beings',
                       'herbs', 'symbols', 'concepts', 'figures', 'locations', 'magic', 'path']:
                # Map plural to singular
                type_map = {
                    'deities': 'deity',
                    'cosmology': 'cosmology',
                    'heroes': 'hero',
                    'creatures': 'creature',
                    'rituals': 'ritual',
                    'texts': 'text',
                    'beings': 'creature',
                    'herbs': 'herb',
                    'symbols': 'symbol',
                    'concepts': 'concept',
                    'figures': 'figure',
                    'locations': 'location',
                    'magic': 'magic',
                    'path': 'path'
                }
                return type_map.get(part, 'unknown')
        return 'unknown'

    def get_mythology_from_path(self, file_path):
        """Extract mythology from file path"""
        parts = Path(file_path).parts
        for i, part in enumerate(parts):
            if part == 'mythos' and i + 1 < len(parts):
                return parts[i + 1]
        return 'unknown'

    def add_firebase_scripts(self, soup):
        """Add Firebase SDK scripts if not present"""
        head = soup.find('head')
        if not head:
            return False

        # Check if Firebase is already included
        existing_firebase = head.find('script', src=re.compile(r'firebase'))
        if existing_firebase:
            return False

        # Add Firebase scripts before closing head tag
        firebase_scripts = [
            'https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore-compat.js',
            'https://www.gstatic.com/firebasejs/9.17.1/firebase-auth-compat.js',
            '/firebase-config.js'
        ]

        for script_src in firebase_scripts:
            script_tag = soup.new_tag('script', src=script_src)
            head.append(script_tag)
            head.append('\n')

        return True

    def add_component_script(self, soup, entity_type):
        """Add entity-specific component script"""
        head = soup.find('head')
        if not head:
            return False

        component_file = self.component_map.get(entity_type)
        if not component_file:
            return False

        # Check if already included
        existing = head.find('script', src=re.compile(component_file))
        if existing:
            return False

        # Add component script
        script_tag = soup.new_tag('script', defer=True, src=f'/js/components/{component_file}')
        head.append(script_tag)
        head.append('\n')

        return True

    def replace_with_component(self, soup, entity_type, mythology, entity_id):
        """Replace hardcoded content with Firebase component"""
        main = soup.find('main')
        if not main:
            return False

        # Check if already converted
        existing_component = main.find(attrs={'data-cosmology-content': True}) or \
                           main.find(attrs={'data-attribute-grid': True})
        if existing_component:
            return False

        # Find the main content sections to replace
        sections = main.find_all('section', recursive=False)
        if not sections:
            return False

        # Create Firebase component div
        component_div = soup.new_tag('div')
        # Use generic data-content for new entity types
        if entity_type in ['herb', 'symbol', 'concept', 'figure', 'text', 'location', 'magic', 'path']:
            component_div['data-content'] = ''
            component_div['data-type'] = entity_type
        else:
            component_div['data-{}-content'.format(entity_type)] = ''
        component_div['data-mythology'] = mythology
        component_div['data-entity'] = entity_id
        component_div['data-allow-edit'] = 'true'

        # Add loading placeholder
        loading_div = soup.new_tag('div', **{'class': 'loading-placeholder'})
        loading_div.string = f'Loading {entity_type} data from Firebase...'
        component_div.append(loading_div)

        # Keep the hero/header section, replace content sections
        hero_section = main.find(['section', 'div'], class_=['hero-section', 'being-header', 'hero-header'])

        if hero_section:
            # Insert component after hero section
            hero_section.insert_after(component_div)
            # Remove old content sections (keep hero)
            for section in sections:
                if section != hero_section and 'hero' not in section.get('class', []):
                    section.decompose()
        else:
            # Replace all sections
            if sections:
                sections[0].replace_with(component_div)
                for section in sections[1:]:
                    section.decompose()

        return True

    def convert_directory(self, directory, entity_type):
        """Convert all files in a directory"""
        dir_path = Path(directory)
        if not dir_path.exists():
            print(f"❌ Directory not found: {directory}")
            return

        html_files = list(dir_path.glob('*.html'))
        html_files = [f for f in html_files if f.name != 'index.html']

        print(f"\nFound {len(html_files)} files in {directory}")

        for html_file in html_files:
            self.convert_file(html_file, entity_type)

    def convert_all_by_type(self, entity_type):
        """Convert all files of a specific entity type across all mythologies"""
        # Map singular to plural directory name
        dir_map = {
            'deity': 'deities',
            'cosmology': 'cosmology',
            'hero': 'heroes',
            'creature': 'creatures',
            'ritual': 'rituals',
            'text': 'texts',
            'herb': 'herbs',
            'symbol': 'symbols',
            'concept': 'concepts',
            'figure': 'figures',
            'location': 'locations',
            'magic': 'magic',
            'path': 'path'
        }

        dir_name = dir_map.get(entity_type, entity_type)
        mythos_dir = Path('../mythos')

        if not mythos_dir.exists():
            print(f"❌ Mythos directory not found: {mythos_dir}")
            return

        total_files = 0
        for mythology_dir in mythos_dir.iterdir():
            if mythology_dir.is_dir():
                entity_dir = mythology_dir / dir_name
                if entity_dir.exists():
                    html_files = [f for f in entity_dir.glob('*.html') if f.name != 'index.html']
                    total_files += len(html_files)
                    print(f"\nProcessing {len(html_files)} {entity_type} files from {mythology_dir.name}")
                    for html_file in html_files:
                        self.convert_file(html_file, entity_type)

        print(f"\n✅ Processed {total_files} {entity_type} files total")

    def print_summary(self):
        """Print conversion summary"""
        print('\n' + '=' * 70)
        print('📊 CONVERSION SUMMARY')
        print('=' * 70)
        print(f"Total files processed:  {self.stats['total']}")
        print(f"Successfully converted: {self.stats['converted']}")
        print(f"Skipped (no changes):   {self.stats['skipped']}")
        print(f"Errors:                 {self.stats['errors']}")
        print('=' * 70)

        if self.dry_run:
            print('\n💡 This was a DRY RUN. No files were modified.')
            print('   Remove --dry-run flag to apply changes.\n')
        else:
            print('\n✅ Conversion complete!\n')


def main():
    parser = argparse.ArgumentParser(description='Convert HTML to use Firebase components')
    parser.add_argument('--file', help='Convert a specific file')
    parser.add_argument('--mythology', help='Convert all files for a mythology and type')
    parser.add_argument('--type', help='Entity type (deity, cosmology, hero, creature, ritual)')
    parser.add_argument('--all', action='store_true', help='Convert all files of specified type')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed')

    args = parser.parse_args()

    converter = FirebaseConverter(dry_run=args.dry_run)

    if args.file:
        converter.convert_file(Path(args.file), args.type)
    elif args.mythology and args.type:
        # Convert specific mythology + type
        dir_map = {
            'deity': 'deities',
            'cosmology': 'cosmology',
            'hero': 'heroes',
            'creature': 'creatures',
            'ritual': 'rituals'
        }
        dir_name = dir_map.get(args.type, args.type)
        directory = Path(f'../mythos/{args.mythology}/{dir_name}')
        converter.convert_directory(directory, args.type)
    elif args.all and args.type:
        converter.convert_all_by_type(args.type)
    else:
        print('❌ Please specify --file, --mythology + --type, or --all + --type')
        parser.print_help()
        return

    converter.print_summary()


if __name__ == '__main__':
    main()

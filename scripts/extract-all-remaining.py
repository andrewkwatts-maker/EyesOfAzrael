#!/usr/bin/env python3
"""
Universal Content Extractor for Remaining Entity Types
Extracts herbs, concepts, figures, symbols, texts, locations, magic
Follows Unified Schema v1.1
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

# Ensure UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class UniversalExtractor:
    def __init__(self, base_dir='h:/Github/EyesOfAzrael'):
        self.base_dir = Path(base_dir)
        self.mythos_dir = self.base_dir / 'mythos'

    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ''
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_section_text(self, section):
        """Extract all paragraphs from a section"""
        paragraphs = section.find_all('p')
        return [self.clean_text(p.get_text()) for p in paragraphs if p.get_text().strip()]

    def extract_list_items(self, soup, keywords):
        """Extract list items related to keywords"""
        items = []
        for keyword in keywords:
            sections = soup.find_all(['section', 'div', 'ul'], class_=re.compile(keyword, re.I))
            for section in sections:
                list_items = section.find_all('li')
                for li in list_items:
                    text = self.clean_text(li.get_text())
                    if text and text not in items:
                        items.append(text)
        return items

    def determine_entity_type(self, file_path):
        """Determine entity type from file path"""
        parts = Path(file_path).parts

        if 'herbs' in parts:
            return 'herb'
        elif 'concepts' in parts:
            return 'concept'
        elif 'figures' in parts:
            return 'figure'
        elif 'symbols' in parts:
            return 'symbol'
        elif 'texts' in parts:
            return 'text'
        elif 'locations' in parts:
            return 'location'
        elif 'magic' in parts:
            return 'magic'
        else:
            return 'content'

    def extract_from_file(self, file_path):
        """Universal extraction from HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            soup = BeautifulSoup(content, 'html.parser')

            # Get entity ID from filename
            entity_id = Path(file_path).stem

            # Get mythology from path
            path_parts = Path(file_path).parts
            mythology_index = path_parts.index('mythos') + 1 if 'mythos' in path_parts else -1
            mythology = path_parts[mythology_index] if mythology_index > 0 else 'unknown'

            # Determine entity type
            entity_type = self.determine_entity_type(file_path)

            # Extract title
            title_tag = soup.find('h1')
            title = self.clean_text(title_tag.get_text()) if title_tag else entity_id.replace('-', ' ').title()

            # Extract description from first paragraph
            first_p = soup.find('p')
            short_description = self.clean_text(first_p.get_text()) if first_p else ''

            # Extract all content sections
            sections = []
            content_sections = soup.find_all(['section', 'div'], class_=re.compile('content|section'))

            for section in content_sections:
                heading = section.find(['h2', 'h3'])
                if heading:
                    section_data = {
                        'title': self.clean_text(heading.get_text()),
                        'content': self.extract_section_text(section),
                        'type': 'text'
                    }
                    sections.append(section_data)

            # If no sections found, extract from all paragraphs
            if not sections:
                all_paragraphs = soup.find_all('p')
                if all_paragraphs:
                    sections.append({
                        'title': 'Description',
                        'content': [self.clean_text(p.get_text()) for p in all_paragraphs if p.get_text().strip()],
                        'type': 'text'
                    })

            # Type-specific extraction
            type_specific_data = self.extract_type_specific(soup, entity_type)

            # Build entity following Unified Schema v1.1
            entity = {
                # === CORE IDENTITY ===
                'id': entity_id,
                'entityType': entity_type,
                'name': title,
                'mythology': mythology,
                'mythologies': [mythology],
                'primaryMythology': mythology,

                # === DESCRIPTIONS ===
                'shortDescription': short_description[:200] if short_description else '',
                'longDescription': short_description,

                # === CONTENT SECTIONS ===
                'sections': sections,

                # === TYPE-SPECIFIC DATA ===
                **type_specific_data,

                # === METADATA ===
                'tags': [entity_type, mythology],
                'status': 'published',
                'visibility': 'public',

                # === MEDIA ===
                'media': [],
                'featuredImage': '',

                # === EXTENDED METADATA ===
                'timeperiod': {
                    'era': '',
                    'startDate': '',
                    'endDate': '',
                    'modernRelevance': False
                },
                'geography': {
                    'regions': [],
                    'modernCountries': [],
                    'coordinates': None,
                    'climate': ''
                },
                'cultural': {
                    'cultures': [mythology],
                    'languages': [],
                    'practices': []
                },

                # === SYSTEM ===
                'metadata': {
                    'created': datetime.now().isoformat(),
                    'lastModified': datetime.now().isoformat(),
                    'version': '1.1',
                    'source': str(file_path)
                }
            }

            return entity

        except Exception as e:
            print(f"❌ Error extracting {file_path}: {str(e)}")
            return None

    def extract_type_specific(self, soup, entity_type):
        """Extract type-specific fields"""
        data = {}

        if entity_type == 'herb':
            data['herbType'] = 'plant'
            data['uses'] = self.extract_list_items(soup, ['use', 'application', 'benefit'])
            data['properties'] = self.extract_list_items(soup, ['property', 'attribute', 'quality'])
            data['preparation'] = self.extract_list_items(soup, ['preparation', 'method'])

        elif entity_type == 'concept':
            data['conceptType'] = 'philosophical'
            data['principles'] = self.extract_list_items(soup, ['principle', 'tenet', 'teaching'])
            data['applications'] = self.extract_list_items(soup, ['application', 'practice'])

        elif entity_type == 'figure':
            data['figureType'] = 'historical'
            data['achievements'] = self.extract_list_items(soup, ['achievement', 'accomplishment'])
            data['significance'] = ''

        elif entity_type == 'symbol':
            data['symbolType'] = 'sacred'
            data['meanings'] = self.extract_list_items(soup, ['meaning', 'significance', 'represents'])
            data['representations'] = []

        elif entity_type == 'text':
            data['textType'] = 'scripture'
            data['chapters'] = []
            data['themes'] = self.extract_list_items(soup, ['theme', 'teaching', 'topic'])

        elif entity_type == 'location':
            data['locationType'] = 'sacred_site'
            data['coordinates'] = None
            data['significance' ] = ''

        elif entity_type == 'magic':
            data['magicType'] = 'spell'
            data['purpose'] = ''
            data['components'] = self.extract_list_items(soup, ['component', 'ingredient', 'material'])

        return data

    def find_files(self, content_type=None):
        """Find all remaining content files"""
        files = []

        content_types = ['herbs', 'concepts', 'figures', 'symbols', 'texts', 'locations', 'magic']

        if content_type:
            content_types = [content_type]

        for content_dir in content_types:
            for myth_dir in self.mythos_dir.glob(f'*/{content_dir}'):
                files.extend([f for f in myth_dir.glob('*.html') if f.name != 'index.html'])

        return sorted(files)

    def extract_all(self, content_type=None, output_file=None):
        """Extract all remaining content"""
        files = self.find_files(content_type)

        print(f"\n{'='*60}")
        print(f"UNIVERSAL CONTENT EXTRACTION")
        print(f"{'='*60}")
        print(f"Found {len(files)} files")
        if content_type:
            print(f"Content type filter: {content_type}")
        print(f"{'='*60}\n")

        entities = []
        success_count = 0
        error_count = 0
        by_type = {}

        for file_path in files:
            entity_type = self.determine_entity_type(file_path)
            print(f"Extracting [{entity_type}]: {file_path.name}...", end=' ')

            entity = self.extract_from_file(file_path)

            if entity:
                entities.append(entity)
                success_count += 1
                by_type[entity_type] = by_type.get(entity_type, 0) + 1
                print(f"✅ {entity['name']}")
            else:
                error_count += 1
                print(f"❌ Failed")

        print(f"\n{'='*60}")
        print(f"EXTRACTION COMPLETE")
        print(f"{'='*60}")
        print(f"✅ Success: {success_count}")
        print(f"❌ Errors: {error_count}")
        print(f"\nBy Type:")
        for entity_type, count in sorted(by_type.items()):
            print(f"  {entity_type}: {count}")
        print(f"\n📊 Total: {len(entities)} entities extracted")
        print(f"{'='*60}\n")

        # Save to file
        if output_file:
            output_path = Path(output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(entities, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved to: {output_path}\n")

        return entities


def main():
    parser = argparse.ArgumentParser(description='Extract all remaining content from HTML files')
    parser.add_argument('--all', action='store_true', help='Extract all remaining content')
    parser.add_argument('--type', type=str, help='Extract specific content type')
    parser.add_argument('--output', type=str, default='remaining_extraction.json', help='Output JSON file')

    args = parser.parse_args()

    extractor = UniversalExtractor()

    if args.all or args.type:
        extractor.extract_all(content_type=args.type, output_file=args.output)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()

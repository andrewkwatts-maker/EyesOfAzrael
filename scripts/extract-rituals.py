#!/usr/bin/env python3
"""
Ritual Extraction Script
Extracts ritual/ceremony data from HTML files and converts to Firebase-ready JSON
Following the Unified Schema v1.1

Usage:
    python extract-rituals.py --all --output rituals_extraction.json
    python extract-rituals.py --mythology egyptian
    python extract-rituals.py --file mythos/egyptian/rituals/mummification.html
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

class RitualExtractor:
    def __init__(self, base_dir='h:/Github/EyesOfAzrael'):
        self.base_dir = Path(base_dir)
        self.mythos_dir = self.base_dir / 'mythos'

    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ''
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_section_text(self, section):
        """Extract all paragraphs from a section"""
        paragraphs = section.find_all('p')
        return [self.clean_text(p.get_text()) for p in paragraphs if p.get_text().strip()]

    def extract_ritual_steps(self, soup):
        """Extract ordered ritual steps/procedures"""
        steps = []

        # Look for ordered lists
        ordered_lists = soup.find_all('ol')
        for ol in ordered_lists:
            items = ol.find_all('li')
            for i, item in enumerate(items):
                step = {
                    'step': i + 1,
                    'instruction': self.clean_text(item.get_text()),
                    'details': ''
                }
                steps.append(step)

        # Look for h3 headings that indicate steps
        if not steps:
            h3_tags = soup.find_all('h3')
            for i, h3 in enumerate(h3_tags):
                step_text = self.clean_text(h3.get_text())
                if any(keyword in step_text.lower() for keyword in ['step', 'stage', 'phase', 'procedure']):
                    # Get following content
                    content = []
                    for sibling in h3.find_next_siblings():
                        if sibling.name == 'h3':
                            break
                        if sibling.name == 'p':
                            content.append(self.clean_text(sibling.get_text()))

                    step = {
                        'step': i + 1,
                        'instruction': step_text,
                        'details': ' '.join(content)
                    }
                    steps.append(step)

        return steps

    def extract_participants(self, soup):
        """Extract ritual participants/roles"""
        participants = []

        # Look for sections about priests, participants, roles
        participant_keywords = ['priest', 'participant', 'officiant', 'celebrant', 'role']

        for keyword in participant_keywords:
            sections = soup.find_all(['section', 'div'], class_=re.compile(keyword, re.I))
            for section in sections:
                paragraphs = section.find_all('p')
                for p in paragraphs:
                    text = self.clean_text(p.get_text())
                    if text:
                        participants.append(text)

        return participants

    def extract_materials(self, soup):
        """Extract required materials/offerings"""
        materials = []

        # Look for lists of materials/offerings
        material_keywords = ['material', 'offering', 'item', 'require', 'ingredient']

        for keyword in material_keywords:
            sections = soup.find_all(['section', 'div'], class_=re.compile(keyword, re.I))
            for section in sections:
                items = section.find_all('li')
                for item in items:
                    text = self.clean_text(item.get_text())
                    if text:
                        materials.append(text)

        return materials

    def extract_timing(self, soup):
        """Extract timing/occasion information"""
        timing = {
            'occasions': [],
            'frequency': '',
            'duration': '',
            'seasonalTiming': ''
        }

        # Look for timing-related content
        timing_keywords = ['when', 'timing', 'occasion', 'frequency', 'season', 'calendar']

        for keyword in timing_keywords:
            sections = soup.find_all(['section', 'div', 'p'], text=re.compile(keyword, re.I))
            for section in sections:
                text = self.clean_text(section.get_text())

                if 'season' in text.lower():
                    timing['seasonalTiming'] = text
                elif 'frequen' in text.lower():
                    timing['frequency'] = text
                elif 'duration' in text.lower():
                    timing['duration'] = text
                else:
                    timing['occasions'].append(text)

        return timing

    def determine_ritual_type(self, entity_id, soup):
        """Determine ritual type based on content"""
        content_lower = soup.get_text().lower()

        if any(keyword in content_lower for keyword in ['festival', 'celebration', 'feast']):
            return 'festival'
        elif any(keyword in content_lower for keyword in ['initiation', 'rite of passage']):
            return 'initiation'
        elif any(keyword in content_lower for keyword in ['offering', 'sacrifice']):
            return 'offering'
        elif any(keyword in content_lower for keyword in ['purification', 'cleansing']):
            return 'purification'
        elif any(keyword in content_lower for keyword in ['worship', 'prayer', 'devotion']):
            return 'worship'
        elif any(keyword in content_lower for keyword in ['funeral', 'burial', 'death']):
            return 'funeral'
        else:
            return 'ceremony'

    def extract_from_file(self, file_path):
        """Extract ritual data from HTML file"""
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

            # Extract ritual-specific data
            ritual_steps = self.extract_ritual_steps(soup)
            participants = self.extract_participants(soup)
            materials = self.extract_materials(soup)
            timing = self.extract_timing(soup)
            ritual_type = self.determine_ritual_type(entity_id, soup)

            # Build entity following Unified Schema v1.1
            entity = {
                # === CORE IDENTITY ===
                'id': entity_id,
                'entityType': 'ritual',
                'name': title,
                'mythology': mythology,  # Required for upload script
                'mythologies': [mythology],
                'primaryMythology': mythology,

                # === DESCRIPTIONS ===
                'shortDescription': short_description[:200] if short_description else '',
                'longDescription': short_description,

                # === CONTENT SECTIONS ===
                'sections': sections,

                # === TYPE-SPECIFIC: RITUAL ===
                'ritualType': ritual_type,  # festival | initiation | offering | purification | worship | funeral
                'procedure': {
                    'steps': ritual_steps,
                    'duration': timing.get('duration', ''),
                    'participants': participants,
                    'materials': materials
                },
                'timing': {
                    'occasions': timing.get('occasions', []),
                    'frequency': timing.get('frequency', ''),
                    'seasonalTiming': timing.get('seasonalTiming', '')
                },

                # === METADATA ===
                'tags': [ritual_type, mythology, 'ritual'],
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
                    'practices': [ritual_type]
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

    def find_ritual_files(self, mythology=None):
        """Find all ritual HTML files"""
        files = []

        if mythology:
            # Search specific mythology
            myth_dir = self.mythos_dir / mythology / 'rituals'
            if myth_dir.exists():
                files.extend(myth_dir.glob('*.html'))
        else:
            # Search all mythologies
            for myth_dir in self.mythos_dir.glob('*/rituals'):
                files.extend(myth_dir.glob('*.html'))

        # Exclude index.html
        files = [f for f in files if f.name != 'index.html']

        return sorted(files)

    def extract_all(self, mythology=None, output_file=None):
        """Extract all rituals"""
        files = self.find_ritual_files(mythology)

        print(f"\n{'='*60}")
        print(f"RITUAL EXTRACTION")
        print(f"{'='*60}")
        print(f"Found {len(files)} ritual files")
        if mythology:
            print(f"Mythology filter: {mythology}")
        print(f"{'='*60}\n")

        entities = []
        success_count = 0
        error_count = 0

        for file_path in files:
            print(f"Extracting: {file_path.name}...", end=' ')

            entity = self.extract_from_file(file_path)

            if entity:
                entities.append(entity)
                success_count += 1
                print(f"✅ {entity['name']}")
            else:
                error_count += 1
                print(f"❌ Failed")

        print(f"\n{'='*60}")
        print(f"EXTRACTION COMPLETE")
        print(f"{'='*60}")
        print(f"✅ Success: {success_count}")
        print(f"❌ Errors: {error_count}")
        print(f"📊 Total: {len(entities)} entities extracted")
        print(f"{'='*60}\n")

        # Save to file
        if output_file:
            output_path = Path(output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(entities, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved to: {output_path}\n")

        return entities


def main():
    parser = argparse.ArgumentParser(description='Extract ritual data from HTML files')
    parser.add_argument('--all', action='store_true', help='Extract all rituals')
    parser.add_argument('--mythology', type=str, help='Extract from specific mythology')
    parser.add_argument('--file', type=str, help='Extract single file')
    parser.add_argument('--output', type=str, default='rituals_extraction.json', help='Output JSON file')

    args = parser.parse_args()

    extractor = RitualExtractor()

    if args.file:
        # Extract single file
        entity = extractor.extract_from_file(args.file)
        if entity:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump([entity], f, indent=2, ensure_ascii=False)
            print(f"✅ Extracted: {entity['name']}")

    elif args.all or args.mythology:
        # Extract all or filtered
        extractor.extract_all(mythology=args.mythology, output_file=args.output)

    else:
        parser.print_help()


if __name__ == '__main__':
    main()

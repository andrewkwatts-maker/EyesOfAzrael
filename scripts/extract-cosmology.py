#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract Cosmology Content from HTML to Firebase-ready JSON

Extracts cosmological concepts including:
- Creation myths
- Afterlife concepts
- Realms and cosmic structure
- Fundamental principles

Usage:
    python extract-cosmology.py --all
    python extract-cosmology.py --mythology greek
    python extract-cosmology.py --file ../mythos/greek/cosmology/creation.html
"""

import os
import re
import json
import argparse
import sys
from bs4 import BeautifulSoup
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class CosmologyExtractor:
    def __init__(self):
        self.stats = {
            'total': 0,
            'extracted': 0,
            'errors': 0
        }
        self.extracted_data = []

    def extract_from_file(self, file_path):
        """Extract cosmology data from a single HTML file"""
        try:
            print(f"Processing: {file_path}")
            self.stats['total'] += 1

            with open(file_path, 'r', encoding='utf-8') as f:
                html = f.read()

            soup = BeautifulSoup(html, 'html.parser')

            # Determine mythology from path
            mythology = self.get_mythology_from_path(file_path)

            # Determine entity ID from filename
            entity_id = Path(file_path).stem

            # Extract basic info
            data = {
                'id': entity_id,
                'entityType': 'cosmology',
                'mythology': mythology,
                'mythologies': [mythology],

                # Basic display info
                'name': self.extract_name(soup),
                'icon': self.extract_icon(soup),
                'title': self.extract_title(soup),
                'subtitle': self.extract_subtitle(soup),
                'shortDescription': self.extract_short_description(soup),
                'longDescription': self.extract_long_description(soup),

                # Metadata
                'slug': entity_id,
                'filePath': str(file_path),
                'status': 'published',
                'visibility': 'public',

                # Cosmology type
                'cosmologyType': self.determine_cosmology_type(entity_id, soup),

                # Content sections
                'sections': self.extract_sections(soup),
                'timeline': self.extract_timeline(soup),
                'structure': self.extract_structure(soup),
                'principles': self.extract_principles(soup),

                # Relationships
                'relatedDeities': self.extract_related_deities(soup),
                'relatedConcepts': self.extract_related_concepts(soup),

                # Sources
                'sources': self.extract_sources(soup),

                # Search terms
                'tags': self.extract_tags(entity_id),
                'searchTerms': [],  # Will be generated later

                # User interaction
                'allowUserEdits': True,
                'allowUserContent': True,
                'moderationRequired': True
            }

            self.extracted_data.append(data)
            self.stats['extracted'] += 1
            print(f"  ✓ Extracted: {data['name']}")

        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.stats['errors'] += 1

    def get_mythology_from_path(self, file_path):
        """Extract mythology from file path"""
        parts = Path(file_path).parts
        for i, part in enumerate(parts):
            if part == 'mythos' and i + 1 < len(parts):
                return parts[i + 1]
        return 'unknown'

    def extract_name(self, soup):
        """Extract the cosmology concept name"""
        # Try h1 in header
        header = soup.find('header')
        if header:
            h1 = header.find('h1')
            if h1:
                return self.clean_text(h1.get_text())

        # Try title
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text()
            # Remove " - Greek Mythology" etc
            title = re.sub(r'\s*-\s*.*$', '', title)
            return title.strip()

        return 'Unknown'

    def extract_icon(self, soup):
        """Extract emoji icon"""
        # Look for icon in header h1
        header = soup.find('header')
        if header:
            h1 = header.find('h1')
            if h1:
                text = h1.get_text()
                # Extract emoji (usually at the start)
                emoji_match = re.match(r'^([^\w\s]+)\s', text)
                if emoji_match:
                    return emoji_match.group(1).strip()

        # Default icons based on type
        return '🌌'

    def extract_title(self, soup):
        """Extract full title"""
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()
        return self.extract_name(soup)

    def extract_subtitle(self, soup):
        """Extract subtitle/tagline"""
        # Look for h2 in hero-section
        hero = soup.find('div', class_='hero-section')
        if hero:
            h2 = hero.find('h2')
            if h2:
                return self.clean_text(h2.get_text())
        return ''

    def extract_short_description(self, soup):
        """Extract short description (first paragraph)"""
        # Look in hero-section
        hero = soup.find('div', class_='hero-section')
        if hero:
            p = hero.find('p')
            if p:
                text = self.clean_text(p.get_text())
                # Limit to ~300 chars
                if len(text) > 300:
                    text = text[:297] + '...'
                return text

        # Try first main paragraph
        main = soup.find('main')
        if main:
            p = main.find('p')
            if p:
                text = self.clean_text(p.get_text())
                if len(text) > 300:
                    text = text[:297] + '...'
                return text

        return ''

    def extract_long_description(self, soup):
        """Extract full description"""
        # Collect first few paragraphs
        main = soup.find('main')
        if main:
            paragraphs = main.find_all('p', limit=3)
            text = ' '.join([self.clean_text(p.get_text()) for p in paragraphs])
            if len(text) > 2000:
                text = text[:1997] + '...'
            return text
        return self.extract_short_description(soup)

    def determine_cosmology_type(self, entity_id, soup):
        """Determine the type of cosmological concept"""
        entity_id_lower = entity_id.lower()

        if 'creation' in entity_id_lower:
            return 'creation'
        elif 'afterlife' in entity_id_lower or 'death' in entity_id_lower:
            return 'afterlife'
        elif 'realm' in entity_id_lower or 'world' in entity_id_lower:
            return 'realm'
        else:
            return 'concept'

    def extract_sections(self, soup):
        """Extract main content sections"""
        sections = []
        main = soup.find('main')
        if not main:
            return sections

        # Find all major sections
        for i, section_tag in enumerate(main.find_all('section', recursive=False)):
            h2 = section_tag.find('h2')
            if h2:
                section_data = {
                    'id': f'section-{i}',
                    'title': self.clean_text(h2.get_text()),
                    'order': i,
                    'type': 'text',
                    'content': self.extract_section_content(section_tag)
                }
                sections.append(section_data)

        return sections

    def extract_section_content(self, section_tag):
        """Extract content from a section"""
        content = []

        # Get all direct children after h2
        for child in section_tag.children:
            if child.name == 'p':
                content.append({
                    'type': 'paragraph',
                    'text': self.clean_text(child.get_text())
                })
            elif child.name == 'ul':
                items = [self.clean_text(li.get_text()) for li in child.find_all('li')]
                content.append({
                    'type': 'list',
                    'items': items
                })
            elif child.name == 'h3':
                content.append({
                    'type': 'heading',
                    'level': 3,
                    'text': self.clean_text(child.get_text())
                })

        return content

    def extract_timeline(self, soup):
        """Extract timeline/stages for creation myths"""
        timeline = []

        # Look for timeline elements
        timeline_div = soup.find('div', class_='timeline')
        if timeline_div:
            events = timeline_div.find_all('div', class_='timeline-event')
            for i, event in enumerate(events):
                h3 = event.find('h3')
                event_data = {
                    'stage': i + 1,
                    'title': self.clean_text(h3.get_text()) if h3 else f'Stage {i+1}',
                    'description': self.extract_section_content(event),
                    'order': i
                }
                timeline.append(event_data)

        return timeline

    def extract_structure(self, soup):
        """Extract cosmological structure (realms, layers, etc.)"""
        structure = {
            'realms': [],
            'layers': []
        }

        # This would be customized based on specific patterns
        # For now, extract from sections

        return structure

    def extract_principles(self, soup):
        """Extract fundamental principles/concepts"""
        principles = []

        # Look for sections about principles
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and ('principle' in h2.get_text().lower() or 'concept' in h2.get_text().lower()):
                principle_data = {
                    'name': self.clean_text(h2.get_text()),
                    'description': self.extract_section_content(section)
                }
                principles.append(principle_data)

        return principles

    def extract_related_deities(self, soup):
        """Extract mentions of deities"""
        related = []
        # Look for links to deity pages
        for link in soup.find_all('a', href=True):
            if '/deities/' in link['href']:
                deity_name = self.clean_text(link.get_text())
                if deity_name and deity_name not in [r['name'] for r in related]:
                    related.append({
                        'name': deity_name,
                        'relationship': 'mentioned'
                    })
        return related

    def extract_related_concepts(self, soup):
        """Extract related cosmological concepts"""
        related = []
        # Look for links to other cosmology pages
        for link in soup.find_all('a', href=True):
            if '/cosmology/' in link['href']:
                concept_name = self.clean_text(link.get_text())
                if concept_name and concept_name not in [r['name'] for r in related]:
                    related.append({
                        'name': concept_name,
                        'relationship': 'related'
                    })
        return related

    def extract_sources(self, soup):
        """Extract source references"""
        sources = []
        # Look for source sections or citations
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'source' in h2.get_text().lower():
                for li in section.find_all('li'):
                    source_text = self.clean_text(li.get_text())
                    if source_text:
                        sources.append(source_text)
        return sources

    def extract_tags(self, entity_id):
        """Generate tags based on entity ID"""
        tags = [entity_id]

        # Add common cosmology tags
        if 'creation' in entity_id:
            tags.extend(['creation', 'origin', 'genesis'])
        if 'afterlife' in entity_id:
            tags.extend(['afterlife', 'death', 'underworld'])
        if 'realm' in entity_id:
            tags.extend(['realm', 'world', 'plane'])

        return tags

    def clean_text(self, text):
        """Clean extracted text"""
        if not text:
            return ''
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special formatting
        text = text.strip()
        return text

    def save_to_json(self, output_file):
        """Save extracted data to JSON file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.extracted_data, f, ensure_ascii=False, indent=2)

        print(f"\n✅ Saved {len(self.extracted_data)} cosmology entities to {output_file}")

    def print_summary(self):
        """Print extraction summary"""
        print('\n' + '=' * 70)
        print('📊 EXTRACTION SUMMARY')
        print('=' * 70)
        print(f"Total files processed: {self.stats['total']}")
        print(f"Successfully extracted: {self.stats['extracted']}")
        print(f"Errors: {self.stats['errors']}")
        print('=' * 70)


def main():
    parser = argparse.ArgumentParser(description='Extract cosmology content from HTML')
    parser.add_argument('--file', help='Extract a specific file')
    parser.add_argument('--mythology', help='Extract all files for a mythology')
    parser.add_argument('--all', action='store_true', help='Extract all cosmology files')
    parser.add_argument('--output', default='cosmology_extraction.json', help='Output JSON file')

    args = parser.parse_args()

    extractor = CosmologyExtractor()

    if args.file:
        extractor.extract_from_file(Path(args.file))
    elif args.mythology:
        # Find all cosmology files for this mythology
        cosmology_dir = Path(f'../mythos/{args.mythology}/cosmology')
        if cosmology_dir.exists():
            for file in cosmology_dir.glob('*.html'):
                if file.name != 'index.html':
                    extractor.extract_from_file(file)
    elif args.all:
        # Find all cosmology files
        mythos_dir = Path('../mythos')
        for mythology_dir in mythos_dir.iterdir():
            if mythology_dir.is_dir():
                cosmology_dir = mythology_dir / 'cosmology'
                if cosmology_dir.exists():
                    for file in cosmology_dir.glob('*.html'):
                        if file.name != 'index.html':
                            extractor.extract_from_file(file)
    else:
        print('❌ Please specify --file, --mythology, or --all')
        parser.print_help()
        return

    extractor.print_summary()
    extractor.save_to_json(args.output)


if __name__ == '__main__':
    main()

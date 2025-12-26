#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract Hero Content from HTML to Firebase-ready JSON

Usage:
    python extract-heroes.py --all
    python extract-heroes.py --mythology greek
"""

import os
import re
import json
import argparse
import sys
from bs4 import BeautifulSoup
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class HeroExtractor:
    def __init__(self):
        self.stats = {'total': 0, 'extracted': 0, 'errors': 0}
        self.extracted_data = []

    def extract_from_file(self, file_path):
        try:
            print(f"Processing: {file_path}")
            self.stats['total'] += 1

            with open(file_path, 'r', encoding='utf-8') as f:
                html = f.read()

            soup = BeautifulSoup(html, 'html.parser')
            mythology = self.get_mythology_from_path(file_path)
            entity_id = Path(file_path).stem

            data = {
                'id': entity_id,
                'entityType': 'hero',
                'mythology': mythology,
                'mythologies': [mythology],
                'name': self.extract_name(soup),
                'icon': self.extract_icon(soup),
                'title': self.extract_title(soup),
                'subtitle': self.extract_subtitle(soup),
                'shortDescription': self.extract_short_description(soup),
                'longDescription': self.extract_long_description(soup),
                'slug': entity_id,
                'filePath': str(file_path),
                'status': 'published',
                'visibility': 'public',
                'attributes': self.extract_attributes(soup),
                'biography': self.extract_biography(soup),
                'deeds': self.extract_deeds(soup),
                'relationships': self.extract_relationships(soup),
                'powers': self.extract_powers(soup),
                'sections': self.extract_sections(soup),
                'relatedDeities': self.extract_related_deities(soup),
                'sources': self.extract_sources(soup),
                'tags': self.extract_tags(entity_id),
                'searchTerms': [],
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
        parts = Path(file_path).parts
        for i, part in enumerate(parts):
            if part == 'mythos' and i + 1 < len(parts):
                return parts[i + 1]
        return 'unknown'

    def extract_name(self, soup):
        header = soup.find('header')
        if header:
            h1 = header.find('h1')
            if h1:
                return self.clean_text(h1.get_text())
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text()
            title = re.sub(r'\s*-\s*.*$', '', title)
            return title.strip()
        return 'Unknown'

    def extract_icon(self, soup):
        header = soup.find(['section', 'div'], class_=['hero-header', 'being-header'])
        if header:
            icon_div = header.find('div', class_=['hero-icon', 'being-icon'])
            if icon_div:
                return icon_div.get_text().strip()
        return '🦸'

    def extract_title(self, soup):
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()
        return self.extract_name(soup)

    def extract_subtitle(self, soup):
        header = soup.find(['section', 'div'], class_=['hero-header', 'being-header'])
        if header:
            subtitle = header.find('p', class_='subtitle')
            if subtitle:
                return self.clean_text(subtitle.get_text())
        return ''

    def extract_short_description(self, soup):
        header = soup.find(['section', 'div'], class_=['hero-header', 'being-header'])
        if header:
            paragraphs = header.find_all('p')
            for p in paragraphs:
                if 'subtitle' not in p.get('class', []):
                    text = self.clean_text(p.get_text())
                    if len(text) > 300:
                        text = text[:297] + '...'
                    return text
        return ''

    def extract_long_description(self, soup):
        main = soup.find('main')
        if main:
            paragraphs = main.find_all('p', limit=3)
            text = ' '.join([self.clean_text(p.get_text()) for p in paragraphs])
            if len(text) > 2000:
                text = text[:1997] + '...'
            return text
        return self.extract_short_description(soup)

    def extract_attributes(self, soup):
        attributes = {}
        attr_grid = soup.find('div', class_='attribute-grid')
        if attr_grid:
            cards = attr_grid.find_all('div', class_='subsection-card')
            for card in cards:
                label_div = card.find('div', class_='attribute-label')
                value_div = card.find('div', class_='attribute-value')
                if label_div and value_div:
                    label = self.clean_text(label_div.get_text())
                    value = self.clean_text(value_div.get_text())
                    attributes[label] = value
        return attributes

    def extract_biography(self, soup):
        biography = {}
        main = soup.find('main')
        if main:
            for section in main.find_all('section'):
                h2 = section.find('h2')
                if h2:
                    section_title = h2.get_text().lower()
                    if 'birth' in section_title or 'early life' in section_title:
                        biography['birth'] = self.extract_section_text(section)
                    elif 'death' in section_title:
                        biography['death'] = self.extract_section_text(section)
                    elif 'legacy' in section_title:
                        biography['legacy'] = self.extract_section_text(section)
        return biography

    def extract_deeds(self, soup):
        deeds = []
        main = soup.find('main')
        if main:
            for section in main.find_all('section'):
                h2 = section.find('h2')
                if h2 and any(keyword in h2.get_text().lower() for keyword in ['labor', 'quest', 'deed', 'achievement']):
                    h3_tags = section.find_all('h3')
                    for i, h3 in enumerate(h3_tags):
                        deed = {
                            'title': self.clean_text(h3.get_text()),
                            'order': i + 1,
                            'description': ''
                        }
                        next_p = h3.find_next_sibling('p')
                        if next_p:
                            deed['description'] = self.clean_text(next_p.get_text())
                        deeds.append(deed)
        return deeds

    def extract_relationships(self, soup):
        relationships = {'family': {}, 'connections': []}
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'relationship' in h2.get_text().lower():
                text = self.extract_section_text(section)
                relationships['family']['description'] = text
        return relationships

    def extract_powers(self, soup):
        powers = []
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and any(keyword in h2.get_text().lower() for keyword in ['power', 'ability', 'skill']):
                ul = section.find('ul')
                if ul:
                    for li in ul.find_all('li'):
                        powers.append(self.clean_text(li.get_text()))
        return powers

    def extract_sections(self, soup):
        sections = []
        main = soup.find('main')
        if main:
            for i, section_tag in enumerate(main.find_all('section', recursive=False)):
                h2 = section_tag.find('h2')
                if h2:
                    sections.append({
                        'id': f'section-{i}',
                        'title': self.clean_text(h2.get_text()),
                        'order': i,
                        'type': 'text',
                        'content': self.extract_section_text(section_tag)
                    })
        return sections

    def extract_section_text(self, section):
        paragraphs = section.find_all('p')
        return ' '.join([self.clean_text(p.get_text()) for p in paragraphs])

    def extract_related_deities(self, soup):
        related = []
        for link in soup.find_all('a', href=True):
            if '/deities/' in link['href']:
                deity_name = self.clean_text(link.get_text())
                if deity_name and deity_name not in [r['name'] for r in related]:
                    related.append({'name': deity_name, 'relationship': 'mentioned'})
        return related

    def extract_sources(self, soup):
        sources = []
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'source' in h2.get_text().lower():
                for li in section.find_all('li'):
                    sources.append(self.clean_text(li.get_text()))
        return sources

    def extract_tags(self, entity_id):
        tags = [entity_id, 'hero', 'mortal', 'demigod']
        if 'heracles' in entity_id or 'hercules' in entity_id:
            tags.extend(['strength', 'labors'])
        return tags

    def clean_text(self, text):
        if not text:
            return ''
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def save_to_json(self, output_file):
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.extracted_data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Saved {len(self.extracted_data)} hero entities to {output_file}")

    def print_summary(self):
        print('\n' + '=' * 70)
        print('📊 EXTRACTION SUMMARY')
        print('=' * 70)
        print(f"Total files processed: {self.stats['total']}")
        print(f"Successfully extracted: {self.stats['extracted']}")
        print(f"Errors: {self.stats['errors']}")
        print('=' * 70)


def main():
    parser = argparse.ArgumentParser(description='Extract hero content from HTML')
    parser.add_argument('--file', help='Extract a specific file')
    parser.add_argument('--mythology', help='Extract all files for a mythology')
    parser.add_argument('--all', action='store_true', help='Extract all hero files')
    parser.add_argument('--output', default='heroes_extraction.json', help='Output JSON file')

    args = parser.parse_args()
    extractor = HeroExtractor()

    if args.file:
        extractor.extract_from_file(Path(args.file))
    elif args.mythology:
        heroes_dir = Path(f'../mythos/{args.mythology}/heroes')
        if heroes_dir.exists():
            for file in heroes_dir.glob('*.html'):
                if file.name != 'index.html':
                    extractor.extract_from_file(file)
    elif args.all:
        mythos_dir = Path('../mythos')
        for mythology_dir in mythos_dir.iterdir():
            if mythology_dir.is_dir():
                heroes_dir = mythology_dir / 'heroes'
                if heroes_dir.exists():
                    for file in heroes_dir.glob('*.html'):
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

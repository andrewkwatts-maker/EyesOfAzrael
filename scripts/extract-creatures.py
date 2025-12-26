#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract Creature Content from HTML to Firebase-ready JSON
Handles both /creatures/ and /beings/ directories

Usage:
    python extract-creatures.py --all
"""

import os, re, json, argparse, sys
from bs4 import BeautifulSoup
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class CreatureExtractor:
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
                'id': entity_id, 'entityType': 'creature', 'mythology': mythology,
                'mythologies': [mythology], 'name': self.extract_name(soup),
                'icon': self.extract_icon(soup), 'title': self.extract_title(soup),
                'subtitle': self.extract_subtitle(soup),
                'shortDescription': self.extract_short_description(soup),
                'longDescription': self.extract_long_description(soup),
                'slug': entity_id, 'filePath': str(file_path),
                'status': 'published', 'visibility': 'public',
                'creatureType': self.determine_creature_type(entity_id, soup),
                'attributes': self.extract_attributes(soup),
                'physicalDescription': self.extract_physical_description(soup),
                'sections': self.extract_sections(soup),
                'relatedDeities': self.extract_related_deities(soup),
                'sources': self.extract_sources(soup),
                'tags': [entity_id, 'creature', 'monster', 'being'],
                'searchTerms': [], 'allowUserEdits': True,
                'allowUserContent': True, 'moderationRequired': True
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
            if h1: return self.clean_text(h1.get_text())
        title_tag = soup.find('title')
        if title_tag:
            return re.sub(r'\s*-\s*.*$', '', title_tag.get_text()).strip()
        return 'Unknown'

    def extract_icon(self, soup):
        header = soup.find(['section', 'div'], class_=['being-header', 'hero-header'])
        if header:
            icon_div = header.find('div', class_=['being-icon', 'hero-icon'])
            if icon_div: return icon_div.get_text().strip()
        return '🐉'

    def extract_title(self, soup):
        title_tag = soup.find('title')
        return title_tag.get_text().strip() if title_tag else self.extract_name(soup)

    def extract_subtitle(self, soup):
        header = soup.find(['section', 'div'], class_=['being-header', 'hero-header'])
        if header:
            subtitle = header.find('p', class_='subtitle')
            if subtitle: return self.clean_text(subtitle.get_text())
        return ''

    def extract_short_description(self, soup):
        header = soup.find(['section', 'div'], class_=['being-header', 'hero-header'])
        if header:
            for p in header.find_all('p'):
                if 'subtitle' not in p.get('class', []):
                    text = self.clean_text(p.get_text())
                    return text[:297] + '...' if len(text) > 300 else text
        return ''

    def extract_long_description(self, soup):
        main = soup.find('main')
        if main:
            paragraphs = main.find_all('p', limit=3)
            text = ' '.join([self.clean_text(p.get_text()) for p in paragraphs])
            return text[:1997] + '...' if len(text) > 2000 else text
        return self.extract_short_description(soup)

    def determine_creature_type(self, entity_id, soup):
        text = entity_id.lower()
        if 'dragon' in text: return 'dragon'
        if 'serpent' in text or 'snake' in text: return 'serpent'
        if 'beast' in text: return 'beast'
        return 'monster'

    def extract_attributes(self, soup):
        attributes = {}
        attr_grid = soup.find('div', class_='attribute-grid')
        if attr_grid:
            for card in attr_grid.find_all('div', class_='subsection-card'):
                label_div = card.find('div', class_='attribute-label')
                value_div = card.find('div', class_='attribute-value')
                if label_div and value_div:
                    attributes[self.clean_text(label_div.get_text())] = self.clean_text(value_div.get_text())
        return attributes

    def extract_physical_description(self, soup):
        desc = {}
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'appearance' in h2.get_text().lower():
                desc['description'] = self.extract_section_text(section)
        return desc

    def extract_sections(self, soup):
        sections = []
        main = soup.find('main')
        if main:
            for i, section_tag in enumerate(main.find_all('section', recursive=False)):
                h2 = section_tag.find('h2')
                if h2:
                    sections.append({
                        'id': f'section-{i}', 'title': self.clean_text(h2.get_text()),
                        'order': i, 'type': 'text',
                        'content': self.extract_section_text(section_tag)
                    })
        return sections

    def extract_section_text(self, section):
        return ' '.join([self.clean_text(p.get_text()) for p in section.find_all('p')])

    def extract_related_deities(self, soup):
        related = []
        for link in soup.find_all('a', href=True):
            if '/deities/' in link['href']:
                name = self.clean_text(link.get_text())
                if name and name not in [r['name'] for r in related]:
                    related.append({'name': name, 'relationship': 'mentioned'})
        return related

    def extract_sources(self, soup):
        return [self.clean_text(li.get_text()) for section in soup.find_all('section')
                for li in section.find_all('li')
                if section.find('h2') and 'source' in section.find('h2').get_text().lower()]

    def clean_text(self, text):
        return re.sub(r'\s+', ' ', text).strip() if text else ''

    def save_to_json(self, output_file):
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.extracted_data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Saved {len(self.extracted_data)} creature entities to {output_file}")

    def print_summary(self):
        print('\n' + '=' * 70)
        print('📊 EXTRACTION SUMMARY')
        print('=' * 70)
        print(f"Total files processed: {self.stats['total']}")
        print(f"Successfully extracted: {self.stats['extracted']}")
        print(f"Errors: {self.stats['errors']}")
        print('=' * 70)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--output', default='creatures_extraction.json')
    args = parser.parse_args()

    extractor = CreatureExtractor()

    if args.all:
        for mythology_dir in Path('../mythos').iterdir():
            if mythology_dir.is_dir():
                for subdir in ['creatures', 'beings']:
                    entity_dir = mythology_dir / subdir
                    if entity_dir.exists():
                        for file in entity_dir.glob('*.html'):
                            if file.name != 'index.html':
                                extractor.extract_from_file(file)

    extractor.print_summary()
    extractor.save_to_json(args.output)

if __name__ == '__main__':
    main()

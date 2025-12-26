#!/usr/bin/env python3
"""
Extract Deity Content from HTML to Firebase JSON
Parses hardcoded deity pages and extracts structured data
"""

import os
import json
import re
from bs4 import BeautifulSoup
from pathlib import Path
import argparse

class DeityContentExtractor:
    def __init__(self):
        self.extracted_data = {}
        self.errors = []

    def extract_from_file(self, file_path):
        """Extract deity data from a single HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html = f.read()

            soup = BeautifulSoup(html, 'html.parser')

            # Extract metadata from meta tags
            mythology = self.get_meta_content(soup, 'mythology')
            entity_type = self.get_meta_content(soup, 'entity-type')
            entity_id = self.get_meta_content(soup, 'entity-id')

            if not mythology or not entity_id:
                self.errors.append(f"Missing metadata in {file_path}")
                return None

            # Extract structured content
            data = {
                'mythology': mythology,
                'entityType': entity_type or 'deity',
                'entityId': entity_id,
                'filePath': str(file_path),
                'name': self.extract_name(soup),
                'icon': self.extract_icon(soup),
                'subtitle': self.extract_subtitle(soup),
                'description': self.extract_description(soup),
                'attributes': self.extract_attributes(soup),
                'myths': self.extract_myths(soup),
                'relationships': self.extract_relationships(soup),
                'worship': self.extract_worship(soup),
                'sources': self.extract_sources(soup)
            }

            return data

        except Exception as e:
            self.errors.append(f"Error processing {file_path}: {str(e)}")
            return None

    def get_meta_content(self, soup, name):
        """Extract content from meta tag"""
        meta = soup.find('meta', {'name': name})
        return meta.get('content') if meta else None

    def extract_name(self, soup):
        """Extract deity name from h1 or h2"""
        # Try hero-section h2 first
        hero_h2 = soup.find('section', class_='hero-section')
        if hero_h2:
            h2 = hero_h2.find('h2')
            if h2:
                # Remove emoji and extract text
                name = re.sub(r'[^\w\s-]', '', h2.get_text()).strip()
                return name

        # Fallback to header h1
        header_h1 = soup.find('header')
        if header_h1:
            h1 = header_h1.find('h1')
            if h1:
                name = re.sub(r'[^\w\s-]', '', h1.get_text()).strip()
                return name

        return "Unknown"

    def extract_icon(self, soup):
        """Extract emoji icon"""
        icon_div = soup.find('div', class_='hero-icon-display')
        if icon_div:
            return icon_div.get_text().strip()
        return "⭐"

    def extract_subtitle(self, soup):
        """Extract subtitle from hero section"""
        subtitle = soup.find('p', class_='subtitle')
        if subtitle:
            return subtitle.get_text().strip()
        return ""

    def extract_description(self, soup):
        """Extract main description"""
        hero = soup.find('section', class_='hero-section')
        if hero:
            # Get the last p tag in hero section
            paragraphs = hero.find_all('p')
            if paragraphs:
                return paragraphs[-1].get_text().strip()
        return ""

    def extract_attributes(self, soup):
        """Extract attribute grid data"""
        attributes = {}

        # Find attribute grid
        attr_grid = soup.find('div', class_='attribute-grid')
        if not attr_grid:
            return attributes

        # Find all subsection cards
        cards = attr_grid.find_all('div', class_='subsection-card')

        for card in cards:
            label_div = card.find('div', class_='attribute-label')
            value_div = card.find('div', class_='attribute-value')

            if label_div and value_div:
                label = label_div.get_text().strip()
                value = value_div.get_text().strip()
                attributes[label] = value

        return attributes

    def extract_myths(self, soup):
        """Extract myths/stories from bullet lists"""
        myths = []

        # Find section containing mythology
        myth_section = None
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'Mythology' in h2.get_text():
                myth_section = section
                break

        if not myth_section:
            return myths

        # Find h3 with "Key Myths"
        key_myths_h3 = None
        for h3 in myth_section.find_all('h3'):
            if 'Key Myths' in h3.get_text() or 'Myths' in h3.get_text():
                key_myths_h3 = h3
                break

        if not key_myths_h3:
            return myths

        # Get the following ul
        myth_ul = key_myths_h3.find_next_sibling('ul')
        if not myth_ul:
            return myths

        # Extract each myth
        for li in myth_ul.find_all('li', recursive=False):
            text = li.get_text().strip()

            # Try to split into title and content
            if ':' in text:
                parts = text.split(':', 1)
                title = parts[0].replace('**', '').replace('*', '').strip()
                content = parts[1].strip()

                myths.append({
                    'title': title,
                    'content': content
                })
            else:
                myths.append({
                    'title': 'Unnamed Myth',
                    'content': text
                })

        return myths

    def extract_relationships(self, soup):
        """Extract family relationships"""
        relationships = {
            'family': {},
            'connections': []
        }

        # Find relationships section
        rel_section = None
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'Relationship' in h2.get_text():
                rel_section = section
                break

        if not rel_section:
            return relationships

        # Find Family h3
        family_h3 = rel_section.find('h3', string=re.compile('Family'))
        if family_h3:
            family_ul = family_h3.find_next_sibling('ul')
            if family_ul:
                for li in family_ul.find_all('li', recursive=False):
                    text = li.get_text().strip()
                    if ':' in text:
                        parts = text.split(':', 1)
                        rel_type = parts[0].replace('**', '').strip()
                        rel_names = parts[1].strip()
                        relationships['family'][rel_type] = rel_names

        return relationships

    def extract_worship(self, soup):
        """Extract worship/ritual information"""
        worship = {
            'sacredSites': '',
            'festivals': [],
            'offerings': '',
            'prayers': ''
        }

        # Find worship section
        worship_section = None
        for section in soup.find_all('section'):
            h2 = section.find('h2')
            if h2 and 'Worship' in h2.get_text():
                worship_section = section
                break

        if not worship_section:
            return worship

        # Extract sacred sites
        sites_h3 = worship_section.find('h3', string=re.compile('Sacred Sites'))
        if sites_h3:
            sites_p = sites_h3.find_next_sibling('p')
            if sites_p:
                worship['sacredSites'] = sites_p.get_text().strip()

        # Extract festivals
        festivals_h3 = worship_section.find('h3', string=re.compile('Festivals'))
        if festivals_h3:
            festivals_ul = festivals_h3.find_next_sibling('ul')
            if festivals_ul:
                for li in festivals_ul.find_all('li', recursive=False):
                    worship['festivals'].append(li.get_text().strip())

        # Extract offerings
        offerings_h3 = worship_section.find('h3', string=re.compile('Offerings'))
        if offerings_h3:
            offerings_p = offerings_h3.find_next_sibling('p')
            if offerings_p:
                worship['offerings'] = offerings_p.get_text().strip()

        return worship

    def extract_sources(self, soup):
        """Extract source citations"""
        sources = []

        citation_div = soup.find('div', class_='citation')
        if citation_div:
            text = citation_div.get_text()
            # Extract source text after "Sources:"
            if 'Sources:' in text:
                sources_text = text.split('Sources:')[1].strip()
                sources.append(sources_text)

        return sources

    def extract_all_deities(self, directory):
        """Extract data from all deity HTML files in directory"""
        deity_dir = Path(directory)
        results = []

        # Find all deity HTML files
        for mythology_dir in deity_dir.glob('*/deities'):
            for html_file in mythology_dir.glob('*.html'):
                if html_file.name == 'index.html':
                    continue

                print(f"Processing: {html_file}")
                data = self.extract_from_file(html_file)
                if data:
                    results.append(data)

        return results

    def save_to_json(self, data, output_file):
        """Save extracted data to JSON file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"\nSaved {len(data)} deity entries to {output_file}")

    def generate_firebase_structure(self, data):
        """Convert extracted data to Firebase structure"""
        firebase_data = {}

        for entry in data:
            mythology = entry['mythology']
            entity_id = entry['entityId']

            if mythology not in firebase_data:
                firebase_data[mythology] = {}

            firebase_data[mythology][entity_id] = {
                'name': entry['name'],
                'icon': entry['icon'],
                'subtitle': entry['subtitle'],
                'description': entry['description'],
                'attributes': entry['attributes'],
                'myths': entry['myths'],
                'relationships': entry['relationships'],
                'worship': entry['worship'],
                'sources': entry['sources'],
                'lastUpdated': 'auto-extracted-2025-12-18'
            }

        return firebase_data


def main():
    parser = argparse.ArgumentParser(description='Extract deity content from HTML files')
    parser.add_argument('--directory', default='../mythos', help='Directory containing mythology folders')
    parser.add_argument('--output', default='extracted_deity_data.json', help='Output JSON file')
    parser.add_argument('--firebase', action='store_true', help='Generate Firebase-ready structure')

    args = parser.parse_args()

    extractor = DeityContentExtractor()

    print("Extracting deity content...")
    data = extractor.extract_all_deities(args.directory)

    if args.firebase:
        print("\nGenerating Firebase structure...")
        firebase_data = extractor.generate_firebase_structure(data)
        output_file = 'firebase_deity_data.json'
        extractor.save_to_json(firebase_data, output_file)
    else:
        extractor.save_to_json(data, args.output)

    if extractor.errors:
        print(f"\n{len(extractor.errors)} errors encountered:")
        for error in extractor.errors[:10]:  # Show first 10 errors
            print(f"  - {error}")

    print(f"\nExtraction complete!")
    print(f"Total deities processed: {len(data)}")


if __name__ == '__main__':
    main()

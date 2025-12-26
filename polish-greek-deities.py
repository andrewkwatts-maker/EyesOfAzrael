#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Greek Deity Firebase Asset Polisher
Compares Firebase assets with HTML pages and extracts missing content
"""

import json
import os
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Any

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class GreekDeityPolisher:
    def __init__(self):
        self.base_path = Path(r"H:\Github\EyesOfAzrael")
        self.firebase_json = self.base_path / "firebase-assets-downloaded" / "deities" / "greek.json"
        self.html_dir = self.base_path / "mythos" / "greek" / "deities"
        self.output_dir = self.base_path / "firebase-assets-enhanced" / "deities" / "greek"

        self.stats = {
            "total_processed": 0,
            "deities_enhanced": 0,
            "fields_added": 0,
            "content_extracted": {
                "descriptions": 0,
                "myths": 0,
                "family_details": 0,
                "worship_info": 0,
                "sacred_sites": 0,
                "festivals": 0,
                "sources": 0,
                "allies": 0,
                "enemies": 0
            }
        }

    def load_firebase_data(self) -> List[Dict]:
        """Load Firebase JSON data"""
        print(f"Loading Firebase data from {self.firebase_json}...")
        with open(self.firebase_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Loaded {len(data)} Greek deities")
        return data

    def extract_text_from_element(self, element) -> str:
        """Extract clean text from BeautifulSoup element"""
        if not element:
            return ""
        # Get text and clean it
        text = element.get_text(separator=" ", strip=True)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_list_items(self, ul_element) -> List[str]:
        """Extract list items from a ul element"""
        if not ul_element:
            return []
        items = []
        for li in ul_element.find_all('li', recursive=False):
            text = self.extract_text_from_element(li)
            if text:
                items.append(text)
        return items

    def parse_html_page(self, html_path: Path) -> Dict[str, Any]:
        """Parse deity HTML page and extract all content"""
        if not html_path.exists():
            return {}

        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        extracted = {}

        # Extract subtitle/role
        subtitle = soup.find('p', class_='subtitle')
        if subtitle:
            extracted['subtitle'] = self.extract_text_from_element(subtitle)

        # Extract main description from hero section
        hero_section = soup.find('section', class_='hero-section')
        if hero_section:
            desc_p = hero_section.find_all('p')
            if len(desc_p) > 1:  # Skip subtitle
                extracted['description'] = self.extract_text_from_element(desc_p[-1])

        # Extract mythology content
        mythology_sections = soup.find_all('section')
        for section in mythology_sections:
            h2 = section.find('h2')
            if h2 and 'Mythology' in self.extract_text_from_element(h2):
                # Get all paragraphs in mythology section
                myth_texts = []
                for p in section.find_all('p'):
                    text = self.extract_text_from_element(p)
                    if text and 'Sources:' not in text:
                        myth_texts.append(text)
                if myth_texts:
                    extracted['mythology_details'] = myth_texts

                # Extract sources
                citation = section.find('div', class_='citation')
                if citation:
                    extracted['sources'] = self.extract_text_from_element(citation)

        # Extract family relationships
        for section in mythology_sections:
            h2 = section.find('h2')
            if h2 and 'Relationships' in self.extract_text_from_element(h2):
                # Parents
                parents_li = section.find('strong', string='Parents:')
                if parents_li and parents_li.parent:
                    extracted['parents'] = self.extract_text_from_element(parents_li.parent).replace('Parents:', '').strip()

                # Consorts
                consorts_li = section.find('strong', string=re.compile(r'Consort'))
                if consorts_li and consorts_li.parent:
                    text = self.extract_text_from_element(consorts_li.parent)
                    text = re.sub(r'Consort\(s\):', '', text).strip()
                    extracted['consorts'] = text

                # Children
                children_li = section.find('strong', string='Children:')
                if children_li and children_li.parent:
                    extracted['children'] = self.extract_text_from_element(children_li.parent).replace('Children:', '').strip()

                # Siblings
                siblings_li = section.find('strong', string='Siblings:')
                if siblings_li and siblings_li.parent:
                    extracted['siblings'] = self.extract_text_from_element(siblings_li.parent).replace('Siblings:', '').strip()

                # Allies
                allies_li = section.find('strong', string='Allies:')
                if allies_li and allies_li.parent:
                    extracted['allies'] = self.extract_text_from_element(allies_li.parent).replace('Allies:', '').strip()

                # Enemies
                enemies_strong = section.find('strong', string=re.compile(r'Enemies'))
                if enemies_strong and enemies_strong.parent:
                    text = self.extract_text_from_element(enemies_strong.parent)
                    text = re.sub(r'Enemies.*?:', '', text).strip()
                    extracted['enemies'] = text

        # Extract worship information
        for section in mythology_sections:
            h2 = section.find('h2')
            if h2 and 'Worship' in self.extract_text_from_element(h2):
                # Sacred Sites
                h3_sites = section.find('h3', string=re.compile(r'Sacred Sites'))
                if h3_sites:
                    next_p = h3_sites.find_next('p')
                    if next_p:
                        extracted['sacred_sites'] = self.extract_text_from_element(next_p)

                # Festivals
                h3_festivals = section.find('h3', string=re.compile(r'Festivals'))
                if h3_festivals:
                    festival_list = h3_festivals.find_next('ul')
                    if festival_list:
                        extracted['festivals'] = self.extract_list_items(festival_list)

                # Offerings
                h3_offerings = section.find('h3', string=re.compile(r'Offerings'))
                if h3_offerings:
                    next_p = h3_offerings.find_next('p')
                    if next_p:
                        extracted['offerings'] = self.extract_text_from_element(next_p)

                # Prayers & Invocations
                h3_prayers = section.find('h3', string=re.compile(r'Prayers'))
                if h3_prayers:
                    next_p = h3_prayers.find_next('p')
                    if next_p:
                        extracted['prayers'] = self.extract_text_from_element(next_p)

        # Extract archetype info
        archetype_section = soup.find('div', class_='interlink-section')
        if archetype_section:
            archetype_title = archetype_section.find('div', class_='interlink-section-title')
            if archetype_title and 'Archetype' in self.extract_text_from_element(archetype_title):
                archetype_badge = archetype_section.find('div', class_='archetype-badge')
                if archetype_badge:
                    extracted['archetype'] = self.extract_text_from_element(archetype_badge)
                archetype_context = archetype_section.find('p', class_='archetype-context')
                if archetype_context:
                    extracted['archetype_description'] = self.extract_text_from_element(archetype_context)

        # Extract cross-cultural parallels
        parallel_grid = soup.find('div', class_='parallel-grid')
        if parallel_grid:
            parallels = []
            for card in parallel_grid.find_all('a', class_='parallel-card'):
                name_span = card.find('span', class_='parallel-name')
                tradition_span = card.find('span', class_='tradition-label')
                if name_span and tradition_span:
                    parallels.append({
                        'name': self.extract_text_from_element(name_span),
                        'tradition': self.extract_text_from_element(tradition_span)
                    })
            if parallels:
                extracted['cross_cultural_parallels'] = parallels

        return extracted

    def enhance_deity(self, deity: Dict, html_data: Dict) -> Dict:
        """Enhance deity Firebase data with HTML content"""
        enhanced = deity.copy()
        fields_added = 0

        # Add subtitle/role
        if html_data.get('subtitle') and not enhanced.get('role'):
            enhanced['role'] = html_data['subtitle']
            fields_added += 1
            self.stats['content_extracted']['descriptions'] += 1

        # Add or enhance description
        if html_data.get('description'):
            if not enhanced.get('description') or len(html_data['description']) > len(enhanced.get('description', '')):
                enhanced['description'] = html_data['description']
                fields_added += 1
                self.stats['content_extracted']['descriptions'] += 1

        # Add mythology details
        if html_data.get('mythology_details'):
            if not enhanced.get('mythology'):
                enhanced['mythology'] = {}
            elif isinstance(enhanced['mythology'], str):
                # Convert string to dict, preserving old content
                enhanced['mythology'] = {'summary': enhanced['mythology']}
            enhanced['mythology']['details'] = html_data['mythology_details']
            fields_added += 1
            self.stats['content_extracted']['myths'] += 1

        # Add sources
        if html_data.get('sources'):
            if not enhanced.get('mythology'):
                enhanced['mythology'] = {}
            elif isinstance(enhanced['mythology'], str):
                # Convert string to dict, preserving old content
                enhanced['mythology'] = {'summary': enhanced['mythology']}
            enhanced['mythology']['sources'] = html_data['sources']
            fields_added += 1
            self.stats['content_extracted']['sources'] += 1

        # Enhance relationships
        if not enhanced.get('relationships'):
            enhanced['relationships'] = {}

        if html_data.get('parents'):
            enhanced['relationships']['parents'] = html_data['parents']
            fields_added += 1
            self.stats['content_extracted']['family_details'] += 1

        if html_data.get('siblings'):
            enhanced['relationships']['siblings'] = html_data['siblings']
            fields_added += 1
            self.stats['content_extracted']['family_details'] += 1

        if html_data.get('consorts') and not enhanced['relationships'].get('consort'):
            enhanced['relationships']['consort'] = html_data['consorts']
            fields_added += 1
            self.stats['content_extracted']['family_details'] += 1

        if html_data.get('children') and not enhanced['relationships'].get('children'):
            enhanced['relationships']['children'] = html_data['children']
            fields_added += 1
            self.stats['content_extracted']['family_details'] += 1

        if html_data.get('allies'):
            enhanced['relationships']['allies'] = html_data['allies']
            fields_added += 1
            self.stats['content_extracted']['allies'] += 1

        if html_data.get('enemies'):
            enhanced['relationships']['enemies'] = html_data['enemies']
            fields_added += 1
            self.stats['content_extracted']['enemies'] += 1

        # Add worship information
        if not enhanced.get('worship'):
            enhanced['worship'] = {}

        if html_data.get('sacred_sites'):
            enhanced['worship']['sacred_sites'] = html_data['sacred_sites']
            fields_added += 1
            self.stats['content_extracted']['sacred_sites'] += 1

        if html_data.get('festivals'):
            enhanced['worship']['festivals'] = html_data['festivals']
            fields_added += 1
            self.stats['content_extracted']['festivals'] += 1

        if html_data.get('offerings'):
            enhanced['worship']['offerings'] = html_data['offerings']
            fields_added += 1
            self.stats['content_extracted']['worship_info'] += 1

        if html_data.get('prayers'):
            enhanced['worship']['prayers'] = html_data['prayers']
            fields_added += 1
            self.stats['content_extracted']['worship_info'] += 1

        # Add archetype information
        if html_data.get('archetype'):
            if not enhanced.get('archetypes'):
                enhanced['archetypes'] = []
            archetype_name = html_data['archetype']
            if archetype_name not in enhanced['archetypes']:
                enhanced['archetypes'].append(archetype_name)
                fields_added += 1

        if html_data.get('archetype_description'):
            enhanced['archetype_description'] = html_data['archetype_description']
            fields_added += 1

        # Add cross-cultural parallels
        if html_data.get('cross_cultural_parallels'):
            enhanced['cross_cultural_parallels'] = html_data['cross_cultural_parallels']
            fields_added += 1

        self.stats['fields_added'] += fields_added
        if fields_added > 0:
            self.stats['deities_enhanced'] += 1

        return enhanced

    def process_all_deities(self):
        """Main processing function"""
        print("=" * 80)
        print("GREEK DEITY FIREBASE ASSET POLISHER")
        print("=" * 80)

        # Load Firebase data
        deities = self.load_firebase_data()

        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

        enhanced_deities = []

        print("\nProcessing deities...")
        print("-" * 80)

        for deity in deities:
            deity_id = deity.get('id')
            deity_name = deity.get('name')

            if not deity_id:
                continue

            self.stats['total_processed'] += 1

            # Find corresponding HTML file
            html_path = self.html_dir / f"{deity_id}.html"

            if not html_path.exists():
                print(f"[!] {deity_name}: No HTML file found at {html_path}")
                enhanced_deities.append(deity)
                continue

            print(f"\n[*] Processing: {deity_name} ({deity_id})")

            # Parse HTML
            html_data = self.parse_html_page(html_path)

            # Enhance deity data
            before_fields = self.stats['fields_added']
            enhanced = self.enhance_deity(deity, html_data)
            after_fields = self.stats['fields_added']

            fields_this_deity = after_fields - before_fields

            if fields_this_deity > 0:
                print(f"   [+] Enhanced with {fields_this_deity} new fields")
            else:
                print(f"   [i] No new content extracted (already complete)")

            enhanced_deities.append(enhanced)

        # Save enhanced data
        print("\n" + "=" * 80)
        print("Saving enhanced deities...")

        # Save as single JSON file
        output_file = self.output_dir / "enhanced-greek-deities.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(enhanced_deities, f, indent=2, ensure_ascii=False)
        print(f"[+] Saved to: {output_file}")

        # Also save individual files
        individual_dir = self.output_dir / "individual"
        individual_dir.mkdir(exist_ok=True)

        for deity in enhanced_deities:
            deity_id = deity.get('id')
            if deity_id:
                deity_file = individual_dir / f"{deity_id}.json"
                with open(deity_file, 'w', encoding='utf-8') as f:
                    json.dump(deity, f, indent=2, ensure_ascii=False)

        print(f"[+] Saved {len(enhanced_deities)} individual deity files to: {individual_dir}")

        # Print statistics
        self.print_statistics()

    def print_statistics(self):
        """Print processing statistics"""
        print("\n" + "=" * 80)
        print("PROCESSING STATISTICS")
        print("=" * 80)
        print(f"Total deities processed:    {self.stats['total_processed']}")
        print(f"Deities enhanced:           {self.stats['deities_enhanced']}")
        print(f"Total fields added:         {self.stats['fields_added']}")
        print()
        print("Content Extracted by Type:")
        print("-" * 80)
        for content_type, count in self.stats['content_extracted'].items():
            print(f"  {content_type.replace('_', ' ').title():<25} {count:>5}")
        print("=" * 80)

if __name__ == "__main__":
    polisher = GreekDeityPolisher()
    polisher.process_all_deities()

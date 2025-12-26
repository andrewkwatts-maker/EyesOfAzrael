#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract and enhance deity assets for Roman, Celtic, and Persian mythologies.

Agent 6 Task:
- Roman deities: Extract Greek equivalents, temples, festivals, epithets
- Celtic deities: Extract Gaelic/Welsh names, tribes, sacred sites, Ogham
- Persian deities: Extract Avestan names, Yasna references, Amesha Spentas connections
"""

import os
import sys
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Optional

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

class DeityExtractor:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.output_dir = self.base_path / "firebase-assets-enhanced" / "deities"

    def extract_text_content(self, element) -> str:
        """Extract clean text from HTML element."""
        if element is None:
            return ""
        return element.get_text(strip=True)

    def extract_list_items(self, section) -> List[str]:
        """Extract list items from a section."""
        items = []
        if section:
            for li in section.find_all('li'):
                text = self.extract_text_content(li)
                if text:
                    items.append(text)
        return items

    def extract_attribute_grid(self, soup) -> Dict[str, str]:
        """Extract attributes from attribute grid."""
        attributes = {}
        grid = soup.find('div', class_='attribute-grid')
        if grid:
            for card in grid.find_all('div', class_='attribute-card'):
                label_elem = card.find('div', class_='attribute-label')
                value_elem = card.find('div', class_='attribute-value')
                if label_elem and value_elem:
                    label = self.extract_text_content(label_elem)
                    value = self.extract_text_content(value_elem)
                    attributes[label.lower()] = value
        return attributes

    def extract_roman_deity(self, html_path: Path) -> Dict:
        """Extract Roman deity with Greek equivalents, temples, festivals, epithets."""
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        entity_id = html_path.stem

        # Basic info
        title_elem = soup.find('h1') or soup.find('h2')
        name = self.extract_text_content(title_elem).replace('⚡', '').replace('⚔️', '').strip()

        subtitle_elem = soup.find('p', class_='subtitle')
        subtitle = self.extract_text_content(subtitle_elem) if subtitle_elem else ""

        # Extract attributes
        attributes = self.extract_attribute_grid(soup)

        # Extract Greek equivalent
        greek_equiv = None
        greek_section = soup.find('h2', string=re.compile(r'Roman vs.*Greek|Greek.*equivalent', re.I))
        if greek_section:
            next_p = greek_section.find_next('p')
            if next_p:
                greek_link = next_p.find('a', href=re.compile(r'greek/deities'))
                if greek_link:
                    greek_equiv = self.extract_text_content(greek_link)

        # If not found, look in text
        if not greek_equiv:
            text_content = soup.get_text()
            greek_patterns = [
                r'Greek (?:counterpart|equivalent)[:\s]+([A-Z][a-z]+)',
                r'identified with Greek ([A-Z][a-z]+)',
                r'equivalent to (?:Greek )?([A-Z][a-z]+)',
            ]
            for pattern in greek_patterns:
                match = re.search(pattern, text_content)
                if match:
                    greek_equiv = match.group(1)
                    break

        # Extract temples and sacred sites
        temples = []
        sacred_section = soup.find('h3', string=re.compile(r'Sacred Sites', re.I))
        if sacred_section:
            next_elem = sacred_section.find_next(['p', 'ul'])
            if next_elem:
                if next_elem.name == 'p':
                    text = self.extract_text_content(next_elem)
                    temple_matches = re.findall(r'Temple of ([^,\.]+)', text)
                    temples.extend(temple_matches)
                elif next_elem.name == 'ul':
                    temples.extend(self.extract_list_items(next_elem))

        # Extract festivals
        festivals = []
        festival_section = soup.find('h3', string=re.compile(r'Festivals', re.I))
        if festival_section:
            next_ul = festival_section.find_next('ul')
            if next_ul:
                for li in next_ul.find_all('li'):
                    strong = li.find('strong')
                    if strong:
                        festival_name = self.extract_text_content(strong).rstrip(':')
                        festivals.append(festival_name)

        # Extract epithets from titles
        epithets = []
        if 'titles' in attributes:
            epithets = [e.strip() for e in attributes['titles'].split(',')]

        # Family relationships
        family_section = soup.find('h3', string=re.compile(r'Family', re.I))
        family = {}
        if family_section:
            family_ul = family_section.find_next('ul')
            if family_ul:
                for li in family_ul.find_all('li'):
                    text = self.extract_text_content(li)
                    if 'Parents:' in text or 'Parent:' in text:
                        family['parents'] = text.split(':', 1)[1].strip()
                    elif 'Consort' in text:
                        family['consorts'] = text.split(':', 1)[1].strip()
                    elif 'Children:' in text:
                        family['children'] = text.split(':', 1)[1].strip()
                    elif 'Siblings:' in text:
                        family['siblings'] = text.split(':', 1)[1].strip()

        # Compile deity data
        deity_data = {
            "id": entity_id,
            "name": name,
            "mythology": "roman",
            "type": "deity",
            "subtitle": subtitle,
            "attributes": attributes,
            "greek_equivalent": greek_equiv,
            "epithets": epithets,
            "temples": temples,
            "festivals": festivals,
            "family": family,
            "extracted_from": str(html_path.name),
            "extraction_date": "2025-12-25"
        }

        return deity_data

    def extract_celtic_deity(self, html_path: Path) -> Dict:
        """Extract Celtic deity with Gaelic/Welsh names, tribes, sacred sites, Ogham."""
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        entity_id = html_path.stem

        # Basic info
        title_elem = soup.find('h1') or soup.find('h2')
        name_text = self.extract_text_content(title_elem).replace('⚡', '').replace('🔥', '').strip()

        # Extract alternate names (Gaelic/Welsh)
        alternate_names = []
        name_match = re.search(r'([A-Z][a-z]+)\s*\(([^)]+)\)', name_text)
        if name_match:
            primary_name = name_match.group(1)
            alternates = name_match.group(2)
            alternate_names = [n.strip() for n in alternates.split(',')]
        else:
            primary_name = name_text

        subtitle_elem = soup.find('p', class_='subtitle')
        subtitle = self.extract_text_content(subtitle_elem) if subtitle_elem else ""

        # Extract attributes
        attributes = self.extract_attribute_grid(soup)

        # Extract Gaelic/Welsh names from text
        gaelic_names = alternate_names.copy()
        text_content = soup.get_text()

        # Look for "also known as" patterns
        aka_patterns = [
            r'also (?:known|called) as ([A-Z][a-z\u00C0-\u017F]+)',
            r'Gaelic[:\s]+([A-Z][a-z\u00C0-\u017F]+)',
            r'Welsh[:\s]+([A-Z][a-z\u00C0-\u017F]+)',
        ]
        for pattern in aka_patterns:
            try:
                matches = re.findall(pattern, text_content)
                gaelic_names.extend(matches)
            except re.error as e:
                pass  # Skip invalid patterns

        # Extract sacred sites
        sacred_sites = []
        sacred_section = soup.find('h3', string=re.compile(r'Sacred Sites', re.I))
        if sacred_section:
            next_elem = sacred_section.find_next(['p', 'ul'])
            if next_elem:
                if next_elem.name == 'p':
                    text = self.extract_text_content(next_elem)
                    # Extract place names
                    places = re.findall(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\([^)]+\)', text)
                    sacred_sites.extend(places)
                    # Also look for standalone mentions
                    standalone = re.findall(r'(Newgrange|Tara|Kildare|Brú na Bóinne)', text)
                    sacred_sites.extend(standalone)

        # Extract associated tribes
        tribes = []
        tribe_patterns = [
            r'associated with the ([A-Z][a-z]+) tribe',
            r'worshipped by the ([A-Z][a-z]+)',
            r'patron of the ([A-Z][a-z]+) people',
        ]
        for pattern in tribe_patterns:
            matches = re.findall(pattern, text_content)
            tribes.extend(matches)

        # Extract Tuatha Dé Danann membership
        tuatha_member = 'Tuatha Dé Danann' in text_content or 'Tuatha Dé' in text_content

        # Extract festivals
        festivals = []
        festival_section = soup.find('h3', string=re.compile(r'Festivals', re.I))
        if festival_section:
            next_ul = festival_section.find_next('ul')
            if next_ul:
                for li in next_ul.find_all('li'):
                    strong = li.find('strong')
                    if strong:
                        festival_name = self.extract_text_content(strong).rstrip(':')
                        festivals.append(festival_name)

        # Family relationships
        family_section = soup.find('h3', string=re.compile(r'Family', re.I))
        family = {}
        if family_section:
            family_ul = family_section.find_next('ul')
            if family_ul:
                for li in family_ul.find_all('li'):
                    text = self.extract_text_content(li)
                    if 'Parents:' in text or 'Parent:' in text:
                        family['parents'] = text.split(':', 1)[1].strip()
                    elif 'Consort' in text:
                        family['consorts'] = text.split(':', 1)[1].strip()
                    elif 'Children:' in text:
                        family['children'] = text.split(':', 1)[1].strip()
                    elif 'Siblings:' in text:
                        family['siblings'] = text.split(':', 1)[1].strip()

        # Compile deity data
        deity_data = {
            "id": entity_id,
            "name": primary_name,
            "mythology": "celtic",
            "type": "deity",
            "subtitle": subtitle,
            "alternate_names": list(set(gaelic_names)),
            "attributes": attributes,
            "sacred_sites": list(set(sacred_sites)),
            "associated_tribes": list(set(tribes)),
            "tuatha_de_danann": tuatha_member,
            "festivals": festivals,
            "family": family,
            "extracted_from": str(html_path.name),
            "extraction_date": "2025-12-25"
        }

        return deity_data

    def extract_persian_deity(self, html_path: Path) -> Dict:
        """Extract Persian deity with Avestan names, Yasna references, Amesha Spentas."""
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        entity_id = html_path.stem

        # Basic info
        title_elem = soup.find('h1') or soup.find('h2')
        name_text = self.extract_text_content(title_elem).replace('⚡', '').replace('☀️', '').strip()

        # Extract alternate names (Avestan)
        alternate_names = []
        name_match = re.search(r'([A-Z][a-z\s]+)\s*\(([^)]+)\)', name_text)
        if name_match:
            primary_name = name_match.group(1).strip()
            alternates = name_match.group(2)
            alternate_names = [n.strip() for n in alternates.split(',')]
        else:
            primary_name = name_text

        subtitle_elem = soup.find('p', class_='subtitle')
        subtitle = self.extract_text_content(subtitle_elem) if subtitle_elem else ""

        # Extract attributes
        attributes = self.extract_attribute_grid(soup)

        # Extract Avestan name
        avestan_name = None
        text_content = soup.get_text()
        avestan_patterns = [
            r'Avestan[:\s]+([A-Z][a-z\s]+)',
            r'Old Persian[:\s]+([A-Z][a-z\s]+)',
        ]
        for pattern in avestan_patterns:
            match = re.search(pattern, text_content)
            if match:
                avestan_name = match.group(1).strip()
                break

        # Extract Yasna references
        yasna_refs = []
        yasna_pattern = r'Yasna\s+(\d+)(?::(\d+))?(?:-(\d+))?'
        yasna_matches = re.findall(yasna_pattern, text_content)
        for match in yasna_matches:
            chapter = match[0]
            verse_start = match[1] if match[1] else None
            verse_end = match[2] if match[2] else None

            if verse_start and verse_end:
                ref = f"Yasna {chapter}:{verse_start}-{verse_end}"
            elif verse_start:
                ref = f"Yasna {chapter}:{verse_start}"
            else:
                ref = f"Yasna {chapter}"
            yasna_refs.append(ref)

        # Check if Amesha Spenta
        is_amesha_spenta = 'Amesha Spenta' in text_content or entity_id == 'amesha-spentas'
        amesha_spentas_list = []

        if is_amesha_spenta:
            # Extract individual Amesha Spentas
            as_patterns = [
                'Vohu Manah', 'Asha Vahishta', 'Khshathra Vairya',
                'Spenta Armaiti', 'Haurvatat', 'Ameretat'
            ]
            for as_name in as_patterns:
                if as_name in text_content:
                    amesha_spentas_list.append(as_name)

        # Extract relationship to Ahura Mazda
        ahura_mazda_relation = None
        if 'created by Ahura Mazda' in text_content:
            ahura_mazda_relation = 'created_by'
        elif 'emanation' in text_content and 'Ahura Mazda' in text_content:
            ahura_mazda_relation = 'emanation_of'
        elif 'serves Ahura Mazda' in text_content:
            ahura_mazda_relation = 'serves'
        elif entity_id == 'ahura-mazda':
            ahura_mazda_relation = 'supreme_deity'

        # Extract yazata status
        is_yazata = 'yazata' in text_content.lower()

        # Family relationships
        family_section = soup.find('h3', string=re.compile(r'Family', re.I))
        family = {}
        if family_section:
            family_ul = family_section.find_next('ul')
            if family_ul:
                for li in family_ul.find_all('li'):
                    text = self.extract_text_content(li)
                    if 'Parents:' in text or 'Parent:' in text:
                        family['parents'] = text.split(':', 1)[1].strip()
                    elif 'Consort' in text:
                        family['consorts'] = text.split(':', 1)[1].strip()
                    elif 'Children:' in text:
                        family['children'] = text.split(':', 1)[1].strip()

        # Festivals
        festivals = []
        festival_section = soup.find('h3', string=re.compile(r'Festivals', re.I))
        if festival_section:
            next_ul = festival_section.find_next('ul')
            if next_ul:
                for li in next_ul.find_all('li'):
                    strong = li.find('strong')
                    if strong:
                        festival_name = self.extract_text_content(strong).rstrip(':')
                        festivals.append(festival_name)

        # Compile deity data
        deity_data = {
            "id": entity_id,
            "name": primary_name,
            "mythology": "persian",
            "type": "deity",
            "subtitle": subtitle,
            "avestan_name": avestan_name,
            "alternate_names": list(set(alternate_names)),
            "attributes": attributes,
            "yasna_references": list(set(yasna_refs)),
            "is_amesha_spenta": is_amesha_spenta,
            "amesha_spentas": amesha_spentas_list if is_amesha_spenta else None,
            "is_yazata": is_yazata,
            "ahura_mazda_relation": ahura_mazda_relation,
            "festivals": festivals,
            "family": family,
            "extracted_from": str(html_path.name),
            "extraction_date": "2025-12-25"
        }

        return deity_data

    def process_mythology(self, mythology: str):
        """Process all deities for a given mythology."""
        print(f"\n{'='*60}")
        print(f"Processing {mythology.upper()} deities...")
        print(f"{'='*60}\n")

        deity_dir = self.base_path / "mythos" / mythology / "deities"
        output_dir = self.output_dir / mythology
        output_dir.mkdir(parents=True, exist_ok=True)

        # Get all HTML files
        html_files = sorted([f for f in deity_dir.glob("*.html") if f.stem != "index"])

        processed_count = 0
        failed_count = 0

        for html_file in html_files:
            try:
                # Extract deity data based on mythology
                if mythology == "roman":
                    deity_data = self.extract_roman_deity(html_file)
                elif mythology == "celtic":
                    deity_data = self.extract_celtic_deity(html_file)
                elif mythology == "persian":
                    deity_data = self.extract_persian_deity(html_file)
                else:
                    print(f"Unknown mythology: {mythology}")
                    continue

                # Save to JSON
                output_file = output_dir / f"{deity_data['id']}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(deity_data, f, indent=2, ensure_ascii=False)

                print(f"[OK] Processed: {deity_data['name']} ({deity_data['id']})")
                processed_count += 1

            except Exception as e:
                print(f"[FAIL] Failed to process {html_file.name}: {str(e)}")
                failed_count += 1

        print(f"\n{mythology.upper()} Summary:")
        print(f"  Successfully processed: {processed_count}")
        print(f"  Failed: {failed_count}")
        print(f"  Output directory: {output_dir}")

        return processed_count, failed_count

def main():
    base_path = Path(__file__).parent.parent
    extractor = DeityExtractor(str(base_path))

    total_processed = 0
    total_failed = 0

    # Process all three mythologies
    for mythology in ["roman", "celtic", "persian"]:
        processed, failed = extractor.process_mythology(mythology)
        total_processed += processed
        total_failed += failed

    # Final summary
    print(f"\n{'='*60}")
    print(f"FINAL SUMMARY - Agent 6 Task Complete")
    print(f"{'='*60}")
    print(f"Total deities processed: {total_processed}")
    print(f"Total failures: {total_failed}")
    print(f"\nEnhanced assets saved to: firebase-assets-enhanced/deities/")
    print(f"  - roman/")
    print(f"  - celtic/")
    print(f"  - persian/")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Hindu Mythology HTML to JSON Extractor
Phase 2.4: Extract Hindu mythology entities from HTML to JSON

Special attention:
- Sanskrit terms: Preserve diacritics (ā, ī, ū, ṛ, ṣ, ṅ, etc.)
- Avatars: Extract to forms array (Vishnu's 10 avatars, etc.)
- Mantras: Preserve exact Sanskrit text
- Karma concepts: Extract philosophical context
- Sacred texts: Note Vedas, Puranas, etc. in sources
"""

import os
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Any
import html


class HinduExtractor:
    """Extracts Hindu mythology entities from HTML files to JSON format"""

    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.output_dir = Path("h:/Github/EyesOfAzrael/data/extracted/hindu")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.stats = {
            'total_files': 0,
            'successful': 0,
            'failed': 0,
            'sanskrit_terms': 0,
            'mantras_found': 0,
            'avatars_found': 0,
            'errors': []
        }

    def clean_text(self, text: str) -> str:
        """Clean text while preserving Sanskrit diacritics and special characters"""
        if not text:
            return ""

        # Decode HTML entities but preserve diacritics
        text = html.unescape(text)

        # Remove extra whitespace but preserve Sanskrit characters
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def extract_sanskrit_info(self, soup: BeautifulSoup) -> Optional[Dict[str, str]]:
        """Extract Sanskrit linguistic information"""
        linguistic = {}

        # Look for Sanskrit script (Devanagari)
        devanagari = soup.find(string=re.compile(r'[\u0900-\u097F]+'))
        if devanagari:
            linguistic['sanskrit'] = self.clean_text(str(devanagari.strip()))
            self.stats['sanskrit_terms'] += 1

        # Look for transliteration (with diacritics)
        # Common patterns: Śiva, Viṣṇu, Kṛṣṇa, etc.
        transliteration_patterns = [
            r'[A-ZĀĪŪṚṢṄŚa-zāīūṛṣṅśḍṭṇḷ]+',  # Sanskrit with diacritics
        ]

        for pattern in transliteration_patterns:
            trans_match = soup.find(string=re.compile(pattern))
            if trans_match and any(c in str(trans_match) for c in 'āīūṛṣṅśḍṭṇḷĀĪŪṚṢṄŚḌṬṆḶ'):
                linguistic['transliteration'] = self.clean_text(str(trans_match))
                break

        # Look for meaning/etymology
        meaning_section = soup.find(string=re.compile(r'meaning:|etymology:', re.I))
        if meaning_section:
            parent = meaning_section.find_parent()
            if parent:
                linguistic['meaning'] = self.clean_text(parent.get_text())

        return linguistic if linguistic else None

    def extract_mantras(self, soup: BeautifulSoup) -> List[str]:
        """Extract mantras and sacred chants"""
        mantras = []

        # Look for mantra sections
        mantra_keywords = ['mantra', 'prayer', 'invocation', 'chant']

        for keyword in mantra_keywords:
            sections = soup.find_all(string=re.compile(keyword, re.I))
            for section in sections:
                parent = section.find_parent()
                if parent:
                    # Look for quoted text or specific mantra patterns
                    text = parent.get_text()

                    # Find Om-based mantras
                    om_mantras = re.findall(r'(?:Om|ॐ)[^.!?]*?(?:[Nn]amah|[Ss]vaha|[Nn]amo)[^.!?]*', text)
                    mantras.extend(om_mantras)

                    # Find quoted mantras
                    quoted = re.findall(r'"([^"]*(?:Om|Namah|Svaha|Namo)[^"]*)"', text)
                    mantras.extend(quoted)

                    # Find strong/bold mantras
                    strong_tags = parent.find_all(['strong', 'b'])
                    for tag in strong_tags:
                        mantra_text = self.clean_text(tag.get_text())
                        if any(word in mantra_text for word in ['Om', 'Namah', 'Svaha', 'Namo']):
                            mantras.append(mantra_text)

        # Clean and deduplicate
        mantras = [self.clean_text(m) for m in mantras if m]
        mantras = list(dict.fromkeys(mantras))  # Preserve order while removing duplicates

        if mantras:
            self.stats['mantras_found'] += len(mantras)

        return mantras

    def extract_forms_avatars(self, soup: BeautifulSoup, entity_name: str) -> List[Dict[str, str]]:
        """Extract forms, avatars, and manifestations"""
        forms = []

        # Look for forms/avatars sections
        form_sections = soup.find_all(['h2', 'h3'], string=re.compile(r'forms?|avatars?|manifestations?', re.I))

        for section in form_sections:
            # Find sibling content
            current = section.find_next_sibling()

            while current and current.name not in ['h1', 'h2']:
                if current.name == 'h3':
                    # Form name
                    form_name = self.clean_text(current.get_text())

                    # Get description
                    desc_elem = current.find_next_sibling()
                    description = ""

                    if desc_elem and desc_elem.name in ['p', 'div']:
                        description = self.clean_text(desc_elem.get_text())

                    if form_name:
                        forms.append({
                            'name': form_name,
                            'description': description
                        })
                        self.stats['avatars_found'] += 1

                elif current.name in ['div', 'ul']:
                    # Check for list items describing forms
                    items = current.find_all('li')
                    for item in items:
                        text = self.clean_text(item.get_text())
                        # Look for pattern: Name - Description or Name: Description
                        match = re.match(r'^([^:-]+)[:-]\s*(.+)$', text)
                        if match:
                            forms.append({
                                'name': self.clean_text(match.group(1)),
                                'description': self.clean_text(match.group(2))
                            })
                            self.stats['avatars_found'] += 1

                current = current.find_next_sibling()

        # Special case: Dashavatara (10 avatars of Vishnu)
        if 'vishnu' in entity_name.lower():
            dashavatara_section = soup.find(string=re.compile(r'dashavatara|ten.*avatars', re.I))
            if dashavatara_section:
                parent = dashavatara_section.find_parent()
                # Look for numbered or glass-card sections
                cards = soup.find_all(class_='glass-card')
                for card in cards:
                    h3 = card.find('h3')
                    if h3:
                        form_name = self.clean_text(h3.get_text())
                        paragraphs = card.find_all('p')
                        description = ' '.join([self.clean_text(p.get_text()) for p in paragraphs])

                        if form_name and description:
                            forms.append({
                                'name': form_name,
                                'description': description
                            })

        return forms

    def extract_sacred_texts(self, soup: BeautifulSoup) -> List[str]:
        """Extract references to sacred texts (Vedas, Puranas, etc.)"""
        texts = set()

        # Sacred text patterns
        sacred_texts = [
            'Rigveda', 'Rig Veda', 'Yajurveda', 'Samaveda', 'Atharvaveda',
            'Vedas', 'Upanishads', 'Bhagavad Gita', 'Gita',
            'Mahabharata', 'Ramayana',
            'Vishnu Purana', 'Shiva Purana', 'Bhagavata Purana', 'Brahma Purana',
            'Linga Purana', 'Skanda Purana', 'Garuda Purana',
            'Puranas', 'Agamas', 'Tantras'
        ]

        # Look in sources section
        sources_section = soup.find(string=re.compile(r'sources?:', re.I))
        if sources_section:
            parent = sources_section.find_parent()
            if parent:
                text = parent.get_text()
                for sacred_text in sacred_texts:
                    if sacred_text in text:
                        texts.add(sacred_text)

        # Look throughout the document
        for sacred_text in sacred_texts:
            if soup.find(string=re.compile(re.escape(sacred_text), re.I)):
                texts.add(sacred_text)

        return sorted(list(texts))

    def extract_attributes(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract attributes from attribute grid"""
        attributes = {}

        # Find attribute grid
        attr_grid = soup.find(class_='attribute-grid')
        if not attr_grid:
            return attributes

        # Extract each attribute card
        cards = attr_grid.find_all(class_='attribute-card')
        for card in cards:
            label_elem = card.find(class_='attribute-label')
            value_elem = card.find(class_='attribute-value')

            if label_elem and value_elem:
                label = self.clean_text(label_elem.get_text())
                value = self.clean_text(value_elem.get_text())

                # Convert to appropriate format
                if label.lower() in ['titles', 'domains', 'symbols']:
                    # Split by comma
                    attributes[label.lower()] = [v.strip() for v in value.split(',') if v.strip()]
                else:
                    attributes[label.lower()] = value

        return attributes

    def extract_relationships(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract family relationships and connections"""
        relationships = {}

        # Find relationships section
        rel_section = soup.find('h2', string=re.compile(r'relationships?', re.I))
        if not rel_section:
            return relationships

        # Get the next sibling sections
        current = rel_section.find_next_sibling()

        while current and current.name != 'section':
            if current.name == 'h3':
                category = self.clean_text(current.get_text()).lower()

                # Get the list
                list_elem = current.find_next_sibling(['ul', 'p'])
                if list_elem:
                    if list_elem.name == 'ul':
                        items = []
                        for li in list_elem.find_all('li'):
                            text = self.clean_text(li.get_text())
                            items.append(text)
                        relationships[category] = items
                    else:
                        relationships[category] = self.clean_text(list_elem.get_text())

            current = current.find_next_sibling()
            if current and current.name in ['h1', 'h2', 'section']:
                break

        return relationships

    def extract_worship_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract worship practices, festivals, offerings"""
        worship = {}

        # Find worship section
        worship_section = soup.find('h2', string=re.compile(r'worship.*rituals?', re.I))
        if not worship_section:
            return worship

        current = worship_section.find_next_sibling()

        while current and current.name != 'section':
            if current.name == 'h3':
                subsection = self.clean_text(current.get_text()).lower()

                # Get content
                content_elem = current.find_next_sibling()

                if content_elem:
                    if content_elem.name == 'ul':
                        items = [self.clean_text(li.get_text()) for li in content_elem.find_all('li')]
                        worship[subsection] = items
                    elif content_elem.name == 'p':
                        worship[subsection] = self.clean_text(content_elem.get_text())

            current = current.find_next_sibling()
            if current and current.name in ['h1', 'h2', 'section']:
                break

        return worship

    def extract_myths_stories(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract key myths and stories"""
        stories = []

        # Find mythology section
        myth_section = soup.find('h2', string=re.compile(r'mythology.*stories?', re.I))
        if not myth_section:
            return stories

        # Look for key myths subsection
        key_myths = myth_section.find_next('h3', string=re.compile(r'key.*myths?', re.I))
        if key_myths:
            myth_list = key_myths.find_next('ul')
            if myth_list:
                for li in myth_list.find_all('li', recursive=False):
                    # Extract title and description
                    strong = li.find('strong')
                    if strong:
                        title = self.clean_text(strong.get_text())
                        # Get remaining text
                        full_text = self.clean_text(li.get_text())
                        description = full_text.replace(title, '').strip(':').strip()

                        stories.append({
                            'title': title,
                            'description': description
                        })

        return stories

    def extract_entity(self, html_file: Path) -> Optional[Dict[str, Any]]:
        """Extract a single entity from HTML file"""
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()

            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract basic info
            title_elem = soup.find('title')
            if not title_elem:
                return None

            title_text = title_elem.get_text()

            # Parse title: "Hindu - EntityName"
            match = re.search(r'Hindu\s*-\s*(.+)', title_text)
            if not match:
                return None

            entity_name = match.group(1).strip()

            # Generate ID from filename
            entity_id = html_file.stem

            # Extract hero description
            hero_desc = soup.find(class_='hero-description')
            description = self.clean_text(hero_desc.get_text()) if hero_desc else ""

            # Build entity data
            entity = {
                'id': entity_id,
                'name': entity_name,
                'mythology': 'hindu',
                'description': description,
            }

            # Extract Sanskrit linguistic info
            linguistic = self.extract_sanskrit_info(soup)
            if linguistic:
                entity['linguistic'] = linguistic

            # Extract attributes
            attributes = self.extract_attributes(soup)
            if attributes:
                entity.update(attributes)

            # Extract forms/avatars
            forms = self.extract_forms_avatars(soup, entity_name)
            if forms:
                entity['forms'] = forms

            # Extract mantras
            mantras = self.extract_mantras(soup)
            if mantras:
                entity['mantras'] = mantras

            # Extract myths/stories
            stories = self.extract_myths_stories(soup)
            if stories:
                entity['myths'] = stories

            # Extract relationships
            relationships = self.extract_relationships(soup)
            if relationships:
                entity['relationships'] = relationships

            # Extract worship info
            worship = self.extract_worship_info(soup)
            if worship:
                entity['worship'] = worship

            # Extract sacred texts references
            sacred_texts = self.extract_sacred_texts(soup)
            if sacred_texts:
                entity['sacred_texts'] = sacred_texts

            # Extract category from file path
            relative_path = html_file.relative_to(self.base_dir)
            if len(relative_path.parts) > 1:
                entity['category'] = relative_path.parts[0]

            return entity

        except Exception as e:
            self.stats['errors'].append({
                'file': str(html_file),
                'error': str(e)
            })
            return None

    def process_all_files(self):
        """Process all HTML files in the Hindu mythology directory"""
        html_files = list(self.base_dir.rglob('*.html'))

        # Filter out index and utility files
        html_files = [
            f for f in html_files
            if f.stem not in ['index', 'corpus-search']
        ]

        self.stats['total_files'] = len(html_files)

        print(f"Found {len(html_files)} HTML files to process")
        print(f"Output directory: {self.output_dir}")
        print("-" * 80)

        for html_file in html_files:
            try:
                entity = self.extract_entity(html_file)

                if entity:
                    # Save to JSON
                    output_file = self.output_dir / f"{entity['id']}.json"

                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(entity, f, indent=2, ensure_ascii=False)

                    self.stats['successful'] += 1
                    print(f"[OK] {entity['name']} -> {output_file.name}")
                else:
                    self.stats['failed'] += 1
                    print(f"[FAIL] Failed to extract: {html_file.name}")

            except Exception as e:
                self.stats['failed'] += 1
                self.stats['errors'].append({
                    'file': str(html_file),
                    'error': str(e)
                })
                print(f"[ERROR] Error processing {html_file.name}: {e}")

        print("-" * 80)
        self.print_summary()

    def print_summary(self):
        """Print extraction summary"""
        print("\n" + "=" * 80)
        print("HINDU MYTHOLOGY EXTRACTION SUMMARY")
        print("=" * 80)
        print(f"Total files processed: {self.stats['total_files']}")
        print(f"Successful extractions: {self.stats['successful']}")
        print(f"Failed extractions: {self.stats['failed']}")
        print(f"\nSanskrit terms found: {self.stats['sanskrit_terms']}")
        print(f"Mantras extracted: {self.stats['mantras_found']}")
        print(f"Forms/Avatars extracted: {self.stats['avatars_found']}")

        if self.stats['errors']:
            print(f"\nErrors encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors'][:5]:  # Show first 5 errors
                print(f"  - {error['file']}: {error['error']}")

        print(f"\nOutput directory: {self.output_dir}")
        print("=" * 80)

        # Save summary to file
        summary_file = self.output_dir / '_extraction_summary.json'
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, indent=2, ensure_ascii=False)

        print(f"\nSummary saved to: {summary_file}")


def main():
    base_dir = "h:/Github/EyesOfAzrael/mythos/hindu"

    extractor = HinduExtractor(base_dir)
    extractor.process_all_files()


if __name__ == "__main__":
    main()

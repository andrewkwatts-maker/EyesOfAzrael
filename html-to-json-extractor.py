#!/usr/bin/env python3
"""
PHASE 2.1: HTML TO JSON EXTRACTOR
Extracts entity data from HTML files and converts to JSON format.
Supports deities, heroes, creatures, and other entity types.
"""

import os
import re
import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, List, Optional, Any

# Project root
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")


class HTMLToJSONExtractor:
    """Extract entity data from HTML to JSON"""

    def __init__(self, mythology: str, entity_type: str):
        self.mythology = mythology
        self.entity_type = entity_type
        self.extraction_log = []
        self.errors = []

    def extract_text(self, element) -> str:
        """Extract and clean text from HTML element"""
        if not element:
            return ""
        text = element.get_text().strip()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text

    def extract_icon(self, soup: BeautifulSoup) -> str:
        """Extract icon/emoji from deity/hero header"""
        # Try deity-icon or hero-icon
        icon_div = soup.find('div', class_=['deity-icon', 'hero-icon', 'creature-icon'])
        if icon_div:
            return self.extract_text(icon_div)

        # Try h1 or h2 for emoji
        h1 = soup.find('h1')
        if h1:
            text = h1.get_text()
            # Extract emoji at the start
            emoji_match = re.match(r'^([^\w\s]+)\s*', text)
            if emoji_match:
                return emoji_match.group(1).strip()

        return ""

    def extract_title(self, soup: BeautifulSoup) -> str:
        """Extract main title/name"""
        # Try h1 first
        h1 = soup.find('h1')
        if h1:
            # Extract text, removing emoji and link markup
            links = h1.find_all('a')
            if links:
                return self.extract_text(links[0])
            text = self.extract_text(h1)
            # Remove leading emoji
            text = re.sub(r'^[^\w\s]+\s*', '', text)
            return text

        # Try header h2
        header_section = soup.find('section', class_=['deity-header', 'hero-header', 'creature-header'])
        if header_section:
            h2 = header_section.find('h2')
            if h2:
                links = h2.find_all('a')
                if links:
                    return self.extract_text(links[0])
                return self.extract_text(h2)

        # Fallback to title tag
        title_tag = soup.find('title')
        if title_tag:
            text = self.extract_text(title_tag)
            # Remove " - Eyes of Azrael" or " | Eyes of Azrael"
            text = re.sub(r'\s*[-|]\s*Eyes of Azrael.*$', '', text, flags=re.IGNORECASE)
            # Remove mythology prefix like "Greek - "
            text = re.sub(r'^[A-Za-z]+\s*-\s*', '', text)
            return text

        return ""

    def extract_subtitle(self, soup: BeautifulSoup) -> str:
        """Extract subtitle/descriptor"""
        header_section = soup.find('section', class_=['deity-header', 'hero-header', 'creature-header'])
        if header_section:
            subtitle = header_section.find('p', class_='subtitle')
            if subtitle:
                return self.extract_text(subtitle)

            # Try first p tag after h2
            h2 = header_section.find('h2')
            if h2:
                next_p = h2.find_next('p')
                if next_p and 'subtitle' in next_p.get('class', []):
                    return self.extract_text(next_p)

        return ""

    def extract_description(self, soup: BeautifulSoup) -> str:
        """Extract main description"""
        header_section = soup.find('section', class_=['deity-header', 'hero-header', 'creature-header'])
        if header_section:
            # Get all paragraphs except subtitle
            paragraphs = header_section.find_all('p')
            descriptions = []
            for p in paragraphs:
                if 'subtitle' not in p.get('class', []):
                    text = self.extract_text(p)
                    if text:
                        descriptions.append(text)
            if descriptions:
                return ' '.join(descriptions)

        return ""

    def extract_attribute_cards(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract attributes from attribute-card elements"""
        attributes = {}

        cards = soup.find_all('div', class_='attribute-card')
        for card in cards:
            label_elem = card.find('div', class_='attribute-label')
            value_elem = card.find('div', class_='attribute-value')

            if label_elem and value_elem:
                label = self.extract_text(label_elem).lower()
                value = self.extract_text(value_elem)

                # Parse value into list if comma-separated
                if ',' in value:
                    value = [v.strip() for v in value.split(',')]

                # Map label to standard field
                if 'title' in label:
                    attributes['titles'] = value if isinstance(value, list) else [value]
                elif 'domain' in label:
                    attributes['domains'] = value if isinstance(value, list) else [value]
                elif 'symbol' in label:
                    attributes['symbols'] = value if isinstance(value, list) else [value]
                elif 'sacred animal' in label:
                    attributes['sacredAnimals'] = value if isinstance(value, list) else [value]
                elif 'sacred plant' in label or 'sacred tree' in label:
                    attributes['sacredPlants'] = value if isinstance(value, list) else [value]
                elif 'weapon' in label:
                    attributes['weapons'] = value if isinstance(value, list) else [value]
                elif 'alias' in label or 'also known' in label:
                    attributes['aliases'] = value if isinstance(value, list) else [value]
                elif 'roman' in label:
                    attributes['romanName'] = value if isinstance(value, str) else value[0]
                elif 'quest' in label:
                    attributes['quest'] = value
                elif 'abilities' in label or 'powers' in label:
                    attributes['abilities'] = value if isinstance(value, list) else [value]
                else:
                    # Generic attribute
                    key = label.replace(' ', '_')
                    attributes[key] = value

        return attributes

    def extract_family(self, soup: BeautifulSoup) -> Dict[str, List[str]]:
        """Extract family relationships"""
        family = {}

        # Find family section
        family_section = None
        for h2 in soup.find_all('h2'):
            if 'family' in self.extract_text(h2).lower() or 'genealogy' in self.extract_text(h2).lower():
                family_section = h2.find_next('div', class_='attribute-grid')
                break

        if family_section:
            cards = family_section.find_all('div', class_='attribute-card')
            for card in cards:
                label_elem = card.find('div', class_='attribute-label')
                value_elem = card.find('div', class_='attribute-value')

                if label_elem and value_elem:
                    label = self.extract_text(label_elem).lower()
                    value = self.extract_text(value_elem)

                    # Parse into list
                    if ',' in value:
                        value_list = [v.strip() for v in value.split(',')]
                    else:
                        value_list = [value] if value else []

                    # Map to standard fields
                    if 'parent' in label:
                        family['parents'] = value_list
                    elif 'consort' in label or 'spouse' in label:
                        family['consorts'] = value_list
                    elif 'child' in label or 'offspring' in label:
                        family['children'] = value_list
                    elif 'sibling' in label:
                        family['siblings'] = value_list

        return family

    def extract_myths(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract myths and legends"""
        myths = []

        # Find myths section
        for h2 in soup.find_all('h2'):
            h2_text = self.extract_text(h2).lower()
            if 'myth' in h2_text or 'legend' in h2_text or 'stories' in h2_text:
                # Get next section content
                section = h2.find_next('section')
                if not section:
                    section = h2.parent

                # Find all h3 (sub-stories)
                h3_elements = section.find_all('h3') if section else []
                for h3 in h3_elements:
                    title = self.extract_text(h3)
                    # Get paragraphs until next h3
                    content = []
                    for elem in h3.find_next_siblings():
                        if elem.name == 'h3':
                            break
                        if elem.name == 'p':
                            content.append(self.extract_text(elem))

                    if title and content:
                        myths.append({
                            'title': title,
                            'summary': ' '.join(content)
                        })
                break

        return myths

    def extract_labors(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract labors grid (for heroes like Heracles)"""
        labors = []

        # Find labors grid
        labors_grid = soup.find('div', class_='labors-grid')
        if not labors_grid:
            return labors

        labor_cards = labors_grid.find_all('div', class_='labor-card')
        for card in labor_cards:
            labor = {}

            # Extract number
            number_elem = card.find(class_='labor-number')
            if number_elem:
                labor['number'] = int(self.extract_text(number_elem))

            # Extract title
            title_elem = card.find(class_='labor-title')
            if title_elem:
                labor['title'] = self.extract_text(title_elem)

            # Extract description
            desc_elem = card.find(class_='labor-description')
            if desc_elem:
                labor['description'] = self.extract_text(desc_elem)

            if labor:
                labors.append(labor)

        return labors

    def extract_sources(self, soup: BeautifulSoup) -> List[str]:
        """Extract source citations"""
        sources = []

        # Find sources section
        for h2 in soup.find_all('h2'):
            if 'source' in self.extract_text(h2).lower() or 'reference' in self.extract_text(h2).lower():
                # Get next ul/ol
                list_elem = h2.find_next(['ul', 'ol'])
                if list_elem:
                    for li in list_elem.find_all('li'):
                        source_text = self.extract_text(li)
                        if source_text:
                            sources.append(source_text)
                break

        return sources

    def extract_entity(self, html_path: Path) -> Optional[Dict[str, Any]]:
        """Extract complete entity from HTML file"""
        try:
            with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            soup = BeautifulSoup(content, 'html.parser')

            # Generate entity ID from filename
            entity_id = f"{self.mythology}_{self.entity_type}_{html_path.stem}"

            # Extract all components
            entity = {
                'id': entity_id,
                'name': self.extract_title(soup),
                'icon': self.extract_icon(soup),
                'subtitle': self.extract_subtitle(soup),
                'description': self.extract_description(soup),
                'mythology': self.mythology,
                'type': self.entity_type,
                'status': 'published',
                'authorId': 'official',
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat(),
            }

            # Add attributes
            attributes = self.extract_attribute_cards(soup)
            entity.update(attributes)

            # Add family
            family = self.extract_family(soup)
            if family:
                entity['family'] = family

            # Add myths
            myths = self.extract_myths(soup)
            if myths:
                entity['mythsAndLegends'] = myths

            # Add labors (heroes)
            if self.entity_type == 'hero':
                labors = self.extract_labors(soup)
                if labors:
                    entity['labors'] = labors

            # Add sources
            sources = self.extract_sources(soup)
            if sources:
                entity['sources'] = sources

            # Remove empty fields
            entity = {k: v for k, v in entity.items() if v}

            self.extraction_log.append({
                'file': str(html_path),
                'entity_id': entity_id,
                'status': 'success',
                'fields_extracted': len(entity)
            })

            return entity

        except Exception as e:
            self.errors.append({
                'file': str(html_path),
                'error': str(e)
            })
            return None

    def calculate_completeness(self, entity: Dict[str, Any]) -> float:
        """Calculate entity completeness score (0-100)"""
        score = 0
        total = 0

        # Required fields
        required_fields = ['name', 'description', 'mythology', 'type']
        for field in required_fields:
            total += 10
            if field in entity and entity[field]:
                score += 10

        # Type-specific requirements
        if self.entity_type == 'deity':
            deity_fields = ['domains', 'symbols', 'family']
            for field in deity_fields:
                total += 10
                if field in entity and entity[field]:
                    score += 10

        elif self.entity_type == 'hero':
            hero_fields = ['quest', 'weapons', 'accomplishments']
            for field in hero_fields:
                total += 10
                if field in entity and entity.get(field):
                    score += 10

        elif self.entity_type == 'creature':
            creature_fields = ['description', 'abilities']
            for field in creature_fields:
                total += 10
                if field in entity and entity.get(field):
                    score += 10

        # Bonus for rich content
        if 'mythsAndLegends' in entity and entity['mythsAndLegends']:
            total += 10
            score += 10

        if 'sources' in entity and entity['sources']:
            total += 10
            score += 10

        return round((score / total * 100) if total > 0 else 0, 1)


def extract_directory(mythology: str, entity_type: str, input_dir: Path, output_dir: Path) -> Dict[str, Any]:
    """Extract all HTML files from a directory"""

    print(f"\n{'='*80}")
    print(f"EXTRACTING: {mythology.upper()} {entity_type.upper()}S")
    print(f"{'='*80}")
    print(f"Input: {input_dir}")
    print(f"Output: {output_dir}")
    print()

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Find all HTML files (excluding index.html)
    html_files = [f for f in input_dir.glob("*.html") if f.name != 'index.html']

    print(f"Found {len(html_files)} HTML files to extract")
    print()

    # Initialize extractor
    extractor = HTMLToJSONExtractor(mythology, entity_type)

    # Extract each file
    extracted_count = 0
    failed_count = 0
    completeness_scores = []

    for html_file in html_files:
        print(f"Extracting: {html_file.name}...", end=' ')

        entity = extractor.extract_entity(html_file)

        if entity:
            # Calculate completeness
            completeness = extractor.calculate_completeness(entity)
            completeness_scores.append(completeness)
            entity['completeness'] = completeness

            # Save to JSON
            json_path = output_dir / f"{html_file.stem}.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=2, ensure_ascii=False)

            extracted_count += 1
            print(f"OK ({completeness}% complete)")
        else:
            failed_count += 1
            print(f"FAILED")

    # Calculate stats
    avg_completeness = sum(completeness_scores) / len(completeness_scores) if completeness_scores else 0
    success_rate = (extracted_count / len(html_files) * 100) if html_files else 0

    print()
    print(f"{'='*80}")
    print(f"EXTRACTION COMPLETE")
    print(f"{'='*80}")
    print(f"Total files: {len(html_files)}")
    print(f"Extracted: {extracted_count}")
    print(f"Failed: {failed_count}")
    print(f"Success rate: {success_rate:.1f}%")
    print(f"Avg completeness: {avg_completeness:.1f}%")
    print()

    return {
        'mythology': mythology,
        'entity_type': entity_type,
        'total_files': len(html_files),
        'extracted': extracted_count,
        'failed': failed_count,
        'success_rate': success_rate,
        'avg_completeness': avg_completeness,
        'extraction_log': extractor.extraction_log,
        'errors': extractor.errors
    }


def main():
    """Main extraction process for Greek mythology"""

    print("\n" + "="*80)
    print("PHASE 2.1: EXTRACT GREEK MYTHOLOGY ENTITIES")
    print("HTML to JSON Extraction System")
    print("="*80)
    print()

    mythology = "greek"
    base_input_dir = PROJECT_ROOT / "mythos" / mythology
    base_output_dir = PROJECT_ROOT / "data" / "extracted" / mythology

    # Track all results
    all_results = []

    # 1. Extract deities
    deities_input = base_input_dir / "deities"
    deities_output = base_output_dir / "deities"
    if deities_input.exists():
        result = extract_directory(mythology, "deity", deities_input, deities_output)
        all_results.append(result)

    # 2. Extract heroes
    heroes_input = base_input_dir / "heroes"
    heroes_output = base_output_dir / "heroes"
    if heroes_input.exists():
        result = extract_directory(mythology, "hero", heroes_input, heroes_output)
        all_results.append(result)

    # 3. Extract creatures
    creatures_input = base_input_dir / "creatures"
    creatures_output = base_output_dir / "creatures"
    if creatures_input.exists():
        result = extract_directory(mythology, "creature", creatures_input, creatures_output)
        all_results.append(result)

    # Generate summary report
    print("\n" + "="*80)
    print("GREEK EXTRACTION SUMMARY")
    print("="*80)
    print()

    total_files = sum(r['total_files'] for r in all_results)
    total_extracted = sum(r['extracted'] for r in all_results)
    total_failed = sum(r['failed'] for r in all_results)
    overall_success_rate = (total_extracted / total_files * 100) if total_files > 0 else 0

    print(f"Total files processed: {total_files}")
    print(f"Successfully extracted: {total_extracted}")
    print(f"Failed: {total_failed}")
    print(f"Overall success rate: {overall_success_rate:.1f}%")
    print()

    print("BY ENTITY TYPE:")
    print("-" * 80)
    for result in all_results:
        print(f"  {result['entity_type'].title():15} {result['extracted']:3}/{result['total_files']:3} "
              f"({result['success_rate']:5.1f}% success, {result['avg_completeness']:5.1f}% complete)")
    print()

    # Save results to JSON
    results_file = PROJECT_ROOT / "greek_extraction_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump({
            'mythology': mythology,
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_files': total_files,
                'total_extracted': total_extracted,
                'total_failed': total_failed,
                'success_rate': overall_success_rate
            },
            'results': all_results
        }, f, indent=2)

    print(f"Results saved to: {results_file}")
    print()
    print("="*80)

    return all_results


if __name__ == "__main__":
    main()

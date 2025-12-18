#!/usr/bin/env python3
"""
HTML to JSON Extractor for Eyes of Azrael Entity Pages
Version: 1.0.0
Date: 2025-12-15

This script extracts structured entity data from HTML files and converts them
to JSON format matching the universal entity schema v2.0.

Usage:
    python scripts/html-to-json-extractor.py input.html output.json
    python scripts/html-to-json-extractor.py --dir mythos/greek/deities/ --output extracted/greek/
    python scripts/html-to-json-extractor.py --mythology greek --all
"""

import sys
import os
import json
import re
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup, Tag
import html as html_lib

# Configuration
SCRIPT_VERSION = "1.0.0"
VALID_MYTHOLOGIES = [
    "egyptian", "greek", "roman", "norse", "celtic", "hindu", "buddhist",
    "babylonian", "sumerian", "persian", "aztec", "mayan", "chinese",
    "japanese", "christian", "jewish", "islamic", "apocryphal"
]
VALID_ENTITY_TYPES = [
    "deity", "hero", "creature", "being", "concept", "location",
    "ritual", "text", "symbol", "item", "place", "magic", "archetype"
]

class HTMLToJSONExtractor:
    """Main extraction class for HTML entity pages"""

    def __init__(self, extraction_templates_path: str = "extraction-templates.json"):
        """Initialize extractor with templates"""
        self.version = SCRIPT_VERSION
        self.warnings = []
        self.templates = self._load_templates(extraction_templates_path)

    def _load_templates(self, path: str) -> Dict:
        """Load extraction templates"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load templates from {path}: {e}")
            return {}

    def extract_from_file(self, html_path: str) -> Dict[str, Any]:
        """Extract entity data from HTML file"""
        try:
            # Read HTML file with encoding detection
            html_content = self._read_file_robust(html_path)
            soup = BeautifulSoup(html_content, 'html.parser')

            # Detect page type
            page_type = self._detect_page_type(soup, html_path)

            if page_type not in ['deity', 'hero', 'creature', 'entity']:
                return {
                    'status': 'skipped',
                    'page_type': page_type,
                    'reason': f'Not an entity detail page (type: {page_type})'
                }

            # Extract all sections
            entity_data = {
                'extraction_metadata': self._create_metadata(html_path),
                **self._extract_core_fields(soup),
                **self._extract_header_section(soup),
                **self._extract_attributes(soup),
                **self._extract_mythology_section(soup),
                **self._extract_relationships(soup),
                **self._extract_entity_specific_sections(soup),
                **self._extract_interlinks(soup),
                **self._extract_see_also(soup),
                **self._extract_all_links(soup),
            }

            # Calculate completeness score
            entity_data['extraction_metadata']['completeness_score'] = self._calculate_completeness(entity_data)
            entity_data['extraction_metadata']['warnings'] = self.warnings

            return entity_data

        except Exception as e:
            return {
                'status': 'extraction_failed',
                'error': str(e),
                'file': html_path,
                'warnings': self.warnings
            }

    def _read_file_robust(self, file_path: str) -> str:
        """Read file with multiple encoding attempts"""
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']

        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue

        raise Exception(f"Cannot decode file: {file_path}")

    def _create_metadata(self, html_path: str) -> Dict:
        """Create extraction metadata"""
        return {
            'source_file': html_path,
            'extracted_at': datetime.utcnow().isoformat() + 'Z',
            'extractor_version': self.version,
            'completeness_score': 0,
            'warnings': []
        }

    def _detect_page_type(self, soup: BeautifulSoup, file_path: str) -> str:
        """Detect the type of HTML page"""
        # Check if it's an index/list page
        if file_path.endswith('/index.html') or file_path.endswith('\\index.html'):
            return 'index'

        # Check for redirect
        if soup.find('meta', {'http-equiv': 'refresh'}):
            return 'redirect'

        # Check for corpus search page
        if 'corpus-search' in file_path:
            return 'corpus_search'

        # Check for interactive/visualization
        if soup.find('canvas'):
            return 'interactive'

        # Check for entity headers
        if soup.find('section', class_='deity-header'):
            return 'deity'
        if soup.find('section', class_='hero-header'):
            return 'hero'
        if soup.find('section', class_='hero-section'):
            return 'creature'

        # Generic entity page
        main = soup.find('main')
        if main and main.find('section'):
            return 'entity'

        return 'unknown'

    def _extract_core_fields(self, soup: BeautifulSoup) -> Dict:
        """Extract core entity fields from breadcrumb and meta"""
        data = {}

        # Extract from breadcrumb
        breadcrumb = soup.find('nav', class_='breadcrumb')
        if breadcrumb:
            links = breadcrumb.find_all('a')
            if len(links) >= 2:
                mythology = links[1].get_text(strip=True).lower()
                data['mythology'] = mythology if mythology in VALID_MYTHOLOGIES else 'unknown'

            if len(links) >= 3:
                entity_type_text = links[2].get_text(strip=True).lower()
                # Handle plural forms
                entity_type = entity_type_text.rstrip('s') if entity_type_text.endswith('s') else entity_type_text
                # Map common variations
                type_mapping = {'deitie': 'deity', 'heroe': 'hero', 'creature': 'creature'}
                entity_type = type_mapping.get(entity_type, entity_type)
                data['type'] = entity_type if entity_type in VALID_ENTITY_TYPES else 'unknown'

        # Extract from meta title
        title_tag = soup.find('title')
        if title_tag:
            data['page_title'] = title_tag.get_text(strip=True)

        # Extract CSS colors
        data['colors'] = self._extract_css_colors(soup)

        return data

    def _extract_css_colors(self, soup: BeautifulSoup) -> Dict:
        """Extract mythology-specific CSS color variables"""
        colors = {}

        style_tags = soup.find_all('style')
        for style in style_tags:
            content = style.string
            if content:
                # Extract --mythos-primary
                primary_match = re.search(r'--mythos-primary:\s*([^;]+)', content)
                if primary_match:
                    colors['primary'] = primary_match.group(1).strip()

                # Extract --mythos-secondary
                secondary_match = re.search(r'--mythos-secondary:\s*([^;]+)', content)
                if secondary_match:
                    colors['secondary'] = secondary_match.group(1).strip()

        return colors

    def _extract_header_section(self, soup: BeautifulSoup) -> Dict:
        """Extract entity header information"""
        data = {}

        # Find header section
        header = (soup.find('section', class_='deity-header') or
                 soup.find('section', class_='hero-header') or
                 soup.find('section', class_='hero-section'))

        if not header:
            if "No header section found" not in self.warnings:
                self.warnings.append("No header section found")
            return data

        # Extract icon/emoji
        icon_div = header.find('div', class_=lambda c: c and 'icon' in c)
        if icon_div:
            icon_text = icon_div.get_text(strip=True)
            # Check for hieroglyphs
            if icon_div.find('span', style=re.compile(r'Segoe UI Historic|Noto Sans Egyptian')):
                data['icon'] = {
                    'display': icon_text,
                    'type': 'hieroglyph',
                    'font_required': 'Noto Sans Egyptian Hieroglyphs'
                }
            else:
                data['icon'] = icon_text

        # Extract name
        h2 = header.find('h2')
        if h2:
            # Remove corpus links but keep text
            name_text = self._clean_text_preserve_structure(h2)

            # Extract transliteration if present
            transliteration = h2.find('span', style=re.compile(r'font-style:\s*italic'))
            if transliteration:
                data['transliteration'] = transliteration.get_text(strip=True).replace('–', '').strip()
                name_text = name_text.replace(transliteration.get_text(), '').strip()

            # Extract alternate names from parentheses
            name_match = re.match(r'^([^(]+)(?:\(([^)]+)\))?', name_text)
            if name_match:
                data['name'] = name_match.group(1).strip()
                if name_match.group(2):
                    data['alternate_names'] = [n.strip() for n in name_match.group(2).split(',')]

        # Extract subtitle
        subtitle = header.find('p', class_='subtitle')
        if not subtitle:
            subtitle = header.find('p', style=re.compile(r'font-size:\s*1\.5rem'))
        if subtitle:
            data['subtitle'] = self._clean_text(subtitle)

        # Extract description (first main paragraph)
        description_p = header.find('p', style=re.compile(r'font-size:\s*1\.1rem'))
        if description_p:
            data['description'] = self._extract_html_content(description_p)

        # Generate ID from name
        if 'name' in data:
            data['id'] = self._generate_id(data['name'])

        return data

    def _generate_id(self, name: str) -> str:
        """Generate kebab-case ID from entity name"""
        # Remove special characters and convert to lowercase
        id_str = re.sub(r'[^\w\s-]', '', name.lower())
        # Replace spaces with hyphens
        id_str = re.sub(r'[\s_]+', '-', id_str)
        return id_str.strip('-')

    def _extract_attributes(self, soup: BeautifulSoup) -> Dict:
        """Extract attributes section with label-value pairs"""
        attributes = {}

        # Find attributes section
        attr_section = soup.find('section', id='attributes')
        if not attr_section:
            # Try to find by heading
            h2 = soup.find('h2', string=re.compile(r'Attributes', re.I))
            if h2:
                attr_section = h2.find_parent('section')

        if not attr_section:
            if "No attributes section found" not in self.warnings:
                self.warnings.append("No attributes section found")
            return {'attributes': attributes}

        # Find all attribute cards
        cards = attr_section.find_all('div', class_='attribute-card')

        for card in cards:
            label_div = card.find('div', class_='attribute-label')
            value_div = card.find('div', class_='attribute-value')

            if label_div and value_div:
                label = self._clean_text(label_div)
                value = self._extract_html_content(value_div)

                # Normalize label to camelCase key
                key = self._normalize_attribute_key(label)
                attributes[key] = value

        return {'attributes': attributes}

    def _normalize_attribute_key(self, label: str) -> str:
        """Normalize attribute label to camelCase key"""
        # Remove special characters
        label = re.sub(r'[^\w\s]', '', label)
        # Split into words
        words = label.split()
        if not words:
            return label.lower()
        # camelCase: first word lowercase, rest capitalized
        return words[0].lower() + ''.join(w.capitalize() for w in words[1:])

    def _extract_mythology_section(self, soup: BeautifulSoup) -> Dict:
        """Extract mythology & stories section"""
        data = {'mythology_stories': {}}

        # Find mythology section
        myth_section = soup.find('section', id='mythology')
        if not myth_section:
            h2 = soup.find('h2', string=re.compile(r'Mythology\s*&\s*Stories', re.I))
            if h2:
                myth_section = h2.find_parent('section')

        if not myth_section:
            if "No mythology section found" not in self.warnings:
                self.warnings.append("No mythology section found")
            return data

        # Extract intro paragraph
        first_p = myth_section.find('p', style=re.compile(r'font-size:\s*1\.1rem'))
        if first_p:
            data['mythology_stories']['intro'] = self._extract_html_content(first_p)

        # Extract key myths list
        key_myths = []
        h3 = myth_section.find('h3', string=re.compile(r'Key Myths', re.I))
        if h3:
            ul = h3.find_next_sibling('ul')
            if ul:
                for li in ul.find_all('li', recursive=False):
                    # Extract myth name and description
                    strong = li.find('strong')
                    if strong:
                        myth_name = self._clean_text(strong)
                        # Remove the strong tag and get remaining text
                        strong.extract()
                        myth_desc = self._extract_html_content(li)
                        key_myths.append({
                            'title': myth_name.rstrip(':'),
                            'summary': myth_desc
                        })

        if key_myths:
            data['mythology_stories']['key_myths'] = key_myths

        # Extract narrative sections (for heroes)
        narrative = self._extract_narrative_structure(myth_section)
        if narrative:
            data['mythology_stories']['narrative'] = narrative

        # Extract citation
        citation = myth_section.find('div', class_='citation')
        if citation:
            data['mythology_stories']['sources'] = self._clean_text(citation)

        # Check for labors grid (Greek heroes)
        labors = self._extract_labors_grid(myth_section)
        if labors:
            data['labors'] = labors

        return data

    def _extract_narrative_structure(self, section: Tag) -> List[Dict]:
        """Extract h3 headings with following paragraphs as narrative"""
        narrative = []

        for h3 in section.find_all('h3'):
            # Skip "Key Myths" heading
            if 'Key Myths' in h3.get_text():
                continue

            section_title = self._clean_text(h3)
            content_parts = []

            # Get all siblings until next h2/h3
            for sibling in h3.find_next_siblings():
                if sibling.name in ['h2', 'h3']:
                    break
                if sibling.name == 'p':
                    content_parts.append(self._extract_html_content(sibling))

            if content_parts:
                narrative.append({
                    'section': section_title,
                    'content': '\n\n'.join(content_parts)
                })

        return narrative

    def _extract_labors_grid(self, section: Tag) -> Optional[List[Dict]]:
        """Extract Greek hero labor cards"""
        labors_grid = section.find('div', class_='labors-grid')
        if not labors_grid:
            return None

        labors = []
        for card in labors_grid.find_all('div', class_='labor-card'):
            number_span = card.find('span', class_='labor-number')
            title_span = card.find('span', class_='labor-title')
            desc_p = card.find('p', class_='labor-desc')

            if number_span and title_span:
                labors.append({
                    'number': int(self._clean_text(number_span)),
                    'title': self._clean_text(title_span),
                    'description': self._clean_text(desc_p) if desc_p else ''
                })

        return labors if labors else None

    def _extract_relationships(self, soup: BeautifulSoup) -> Dict:
        """Extract relationships section"""
        data = {'relationships': {}}

        rel_section = soup.find('section', id='relationships')
        if not rel_section:
            h2 = soup.find('h2', string=re.compile(r'Relationships', re.I))
            if h2:
                rel_section = h2.find_parent('section')

        if not rel_section:
            return data

        # Extract family
        family_h3 = rel_section.find('h3', string=re.compile(r'Family', re.I))
        if family_h3:
            family_data = {}
            ul = family_h3.find_next_sibling('ul')
            if ul:
                for li in ul.find_all('li', recursive=False):
                    strong = li.find('strong')
                    if strong:
                        label = self._clean_text(strong).rstrip(':').lower()
                        strong.extract()
                        value = self._extract_html_content(li)
                        family_data[label] = value

            data['relationships']['family'] = family_data

        # Extract allies & enemies
        allies_h3 = rel_section.find('h3', string=re.compile(r'Allies.*Enemies|Allies.*Dynamics', re.I))
        if allies_h3:
            allies_data = {}
            ul = allies_h3.find_next_sibling('ul')
            if ul:
                for li in ul.find_all('li', recursive=False):
                    strong = li.find('strong')
                    if strong:
                        label = self._clean_text(strong).rstrip(':').lower()
                        strong.extract()
                        value = self._extract_html_content(li)
                        allies_data[label] = value

            data['relationships']['allies_enemies'] = allies_data

        return data

    def _extract_entity_specific_sections(self, soup: BeautifulSoup) -> Dict:
        """Extract deity/hero/creature specific sections"""
        data = {}

        # Worship section (deities)
        worship_section = soup.find('section', id='worship')
        if worship_section:
            data['worship'] = self._extract_worship_section(worship_section)

        # Forms section (Egyptian deities)
        forms_section = soup.find('section', id='forms')
        if forms_section:
            data['forms'] = self._extract_forms_section(forms_section)

        # Theory sections
        theories = self._extract_theory_sections(soup)
        if theories:
            data['alternative_theories'] = theories

        return data

    def _extract_worship_section(self, section: Tag) -> Dict:
        """Extract worship & rituals subsections"""
        worship = {}

        for h3 in section.find_all('h3'):
            subsection_title = self._clean_text(h3).lower()

            # Get content after h3
            content_parts = []
            for sibling in h3.find_next_siblings():
                if sibling.name == 'h3':
                    break
                if sibling.name == 'p':
                    content_parts.append(self._extract_html_content(sibling))
                elif sibling.name == 'ul':
                    items = [self._extract_html_content(li) for li in sibling.find_all('li')]
                    content_parts.extend(items)

            if content_parts:
                key = subsection_title.replace(' ', '_').replace('&', 'and')
                worship[key] = '\n'.join(content_parts)

        return worship

    def _extract_forms_section(self, section: Tag) -> List[Dict]:
        """Extract forms and manifestations (Egyptian)"""
        forms = []

        # Find form cards
        for div in section.find_all('div', style=re.compile(r'border-left')):
            strong = div.find('strong')
            if strong:
                form_name = self._clean_text(strong)
                strong.extract()
                description = self._extract_html_content(div)

                forms.append({
                    'name': form_name,
                    'description': description
                })

        return forms

    def _extract_theory_sections(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract author's theories and extra theories"""
        theories = []

        # Author's theories (expandable details)
        details = soup.find('details', style=re.compile(r'purple|147.*51.*234'))
        if details:
            summary = details.find('summary')
            div = details.find('div')
            if summary and div:
                theories.append({
                    'type': 'author_theory',
                    'title': self._clean_text(summary),
                    'content': self._extract_html_content(div),
                    'note': 'Speculative personal theory'
                })

        # Extra theories section (Babylonian)
        extra_theories = soup.find('section', class_='extra-theories')
        if extra_theories:
            for theory_card in extra_theories.find_all('div', class_='theory-card'):
                h3 = theory_card.find('h3')
                if h3:
                    theory_data = {
                        'type': 'alternative_theory',
                        'title': self._clean_text(h3)
                    }

                    # Extract proponent
                    proponent = theory_card.find('p', string=re.compile(r'Primary Proponent'))
                    if proponent:
                        theory_data['proponent'] = self._clean_text(proponent).replace('Primary Proponent:', '').strip()

                    # Extract content
                    theory_data['content'] = self._extract_html_content(theory_card)
                    theories.append(theory_data)

        return theories

    def _extract_interlinks(self, soup: BeautifulSoup) -> Dict:
        """Extract interlink panel data"""
        data = {'interlinks': {}}

        interlink_panel = soup.find('section', class_='interlink-panel')
        if not interlink_panel:
            return data

        # Extract archetype
        archetype_card = interlink_panel.find('a', class_='archetype-link-card')
        if archetype_card:
            badge = archetype_card.find('div', class_='archetype-badge')
            context = archetype_card.find('p', class_='archetype-context')
            parallels = archetype_card.find('span', class_='see-parallels')

            data['interlinks']['archetype'] = {
                'name': self._clean_text(badge) if badge else '',
                'description': self._clean_text(context) if context else '',
                'url': archetype_card.get('href', '')
            }

            if parallels:
                data['interlinks']['archetype']['parallels'] = self._clean_text(parallels)

        # Extract cross-cultural parallels
        parallels = []
        parallel_cards = interlink_panel.find_all('a', class_='parallel-card')
        for card in parallel_cards:
            name_span = card.find('span', class_='parallel-name')
            label_span = card.find('span', class_='tradition-label')
            flag_span = card.find('span', class_='tradition-flag')

            if name_span:
                parallels.append({
                    'name': self._clean_text(name_span),
                    'mythology': self._clean_text(label_span) if label_span else '',
                    'flag': self._clean_text(flag_span) if flag_span else '',
                    'url': card.get('href', '')
                })

        if parallels:
            data['interlinks']['cross_cultural_parallels'] = parallels

        return data

    def _extract_see_also(self, soup: BeautifulSoup) -> Dict:
        """Extract see also links"""
        data = {'see_also': []}

        see_also = soup.find('div', class_='see-also-section')
        if not see_also:
            return data

        links = see_also.find_all('a', class_='see-also-link')
        for link in links:
            icon_span = link.find('span')
            icon = self._clean_text(icon_span) if icon_span else ''
            if icon_span:
                icon_span.extract()

            name = self._clean_text(link)
            href = link.get('href', '')

            data['see_also'].append({
                'icon': icon,
                'name': name,
                'url': href
            })

        return data

    def _extract_all_links(self, soup: BeautifulSoup) -> Dict:
        """Extract and categorize all links"""
        data = {'links': {'internal': [], 'external': [], 'corpus': []}}

        # Extract corpus links
        corpus_links = soup.find_all('a', class_='corpus-link')
        for link in corpus_links:
            data['links']['corpus'].append({
                'term': link.get('data-term', ''),
                'tradition': link.get('data-tradition', ''),
                'href': link.get('href', ''),
                'text': self._clean_text(link)
            })

        # Extract other internal links
        main = soup.find('main')
        if main:
            for link in main.find_all('a'):
                if 'corpus-link' in link.get('class', []):
                    continue

                href = link.get('href', '')
                if not href or href.startswith('#'):
                    continue

                if href.startswith('http'):
                    data['links']['external'].append({
                        'text': self._clean_text(link),
                        'href': href
                    })
                else:
                    data['links']['internal'].append({
                        'text': self._clean_text(link),
                        'href': href
                    })

        return data

    def _clean_text(self, element: Tag) -> str:
        """Extract plain text from element"""
        if element is None:
            return ''
        return element.get_text(strip=True)

    def _clean_text_preserve_structure(self, element: Tag) -> str:
        """Extract text but preserve basic structure"""
        if element is None:
            return ''

        # Clone element to avoid modifying original
        element_copy = element

        # Remove script and style tags
        for script in element_copy(['script', 'style']):
            script.decompose()

        return element_copy.get_text(separator=' ', strip=True)

    def _extract_html_content(self, element: Tag) -> str:
        """Extract HTML content preserving links and basic formatting"""
        if element is None:
            return ''

        # Clone to avoid modifying original
        html_str = str(element)

        # Clean up excessive whitespace
        html_str = re.sub(r'\s+', ' ', html_str)

        # Unescape HTML entities
        html_str = html_lib.unescape(html_str)

        return html_str.strip()

    def _calculate_completeness(self, data: Dict) -> int:
        """Calculate completeness score (0-100)"""
        score = 0

        # Required fields (40 points)
        if data.get('name'):
            score += 10
        if data.get('type'):
            score += 10
        if data.get('mythology'):
            score += 10
        if data.get('description'):
            score += 10

        # Attributes (20 points)
        attributes = data.get('attributes', {})
        if attributes:
            score += min(20, len(attributes) * 3)

        # Mythology section (25 points)
        mythology = data.get('mythology_stories', {})
        if mythology.get('intro'):
            score += 10
        if mythology.get('key_myths'):
            score += 15

        # Relationships (15 points)
        relationships = data.get('relationships', {})
        if relationships.get('family'):
            score += 10
        if relationships.get('allies_enemies'):
            score += 5

        return min(100, score)


def extract_single_file(input_file: str, output_file: str, templates_path: str = "extraction-templates.json"):
    """Extract single HTML file to JSON"""
    print(f"Extracting: {input_file}")

    extractor = HTMLToJSONExtractor(templates_path)
    result = extractor.extract_from_file(input_file)

    # Write output
    os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else '.', exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Output: {output_file}")

    if result.get('status') == 'extraction_failed':
        print(f"ERROR: {result.get('error')}")
        return False
    elif result.get('status') == 'skipped':
        print(f"SKIPPED: {result.get('reason')}")
        return False
    else:
        score = result.get('extraction_metadata', {}).get('completeness_score', 0)
        warnings = result.get('extraction_metadata', {}).get('warnings', [])
        print(f"Completeness: {score}%")
        if warnings:
            print(f"Warnings: {len(warnings)}")
            for w in warnings[:3]:
                print(f"  - {w}")
        return True


def extract_directory(input_dir: str, output_dir: str, templates_path: str = "extraction-templates.json"):
    """Extract all HTML files in directory"""
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    html_files = list(input_path.rglob('*.html'))
    print(f"Found {len(html_files)} HTML files in {input_dir}")

    os.makedirs(output_dir, exist_ok=True)

    stats = {'success': 0, 'failed': 0, 'skipped': 0}

    for html_file in html_files:
        # Generate output path
        relative_path = html_file.relative_to(input_path)
        output_file = output_path / relative_path.with_suffix('.json')

        # Create subdirectories
        os.makedirs(output_file.parent, exist_ok=True)

        # Extract
        try:
            success = extract_single_file(str(html_file), str(output_file), templates_path)
            if success:
                stats['success'] += 1
            else:
                stats['skipped'] += 1
        except Exception as e:
            print(f"FAILED: {html_file} - {e}")
            stats['failed'] += 1

        print()

    print(f"\nExtraction complete!")
    print(f"Success: {stats['success']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Failed: {stats['failed']}")


def extract_by_mythology(mythology: str, base_dir: str = "mythos", output_dir: str = "extracted",
                        templates_path: str = "extraction-templates.json"):
    """Extract all entities for a specific mythology"""
    mythology_dir = os.path.join(base_dir, mythology)

    if not os.path.exists(mythology_dir):
        print(f"ERROR: Mythology directory not found: {mythology_dir}")
        return

    output_mythology_dir = os.path.join(output_dir, mythology)
    extract_directory(mythology_dir, output_mythology_dir, templates_path)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Extract entity data from HTML files to JSON format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract single file
  python html-to-json-extractor.py mythos/greek/deities/zeus.html extracted/zeus.json

  # Extract directory
  python html-to-json-extractor.py --dir mythos/greek/deities/ --output extracted/greek/

  # Extract by mythology
  python html-to-json-extractor.py --mythology egyptian --output extracted/
        """
    )

    parser.add_argument('input', nargs='?', help='Input HTML file')
    parser.add_argument('output', nargs='?', help='Output JSON file')
    parser.add_argument('--dir', dest='input_dir', help='Input directory')
    parser.add_argument('--output', dest='output_dir', help='Output directory')
    parser.add_argument('--mythology', help='Extract specific mythology')
    parser.add_argument('--templates', default='extraction-templates.json', help='Templates file path')
    parser.add_argument('--all', action='store_true', help='Extract all mythologies')

    args = parser.parse_args()

    # Validate arguments
    if args.all:
        print("Extracting all mythologies...")
        for mythology in VALID_MYTHOLOGIES[:5]:  # Limit for safety
            print(f"\n{'='*60}")
            print(f"Processing {mythology.upper()}")
            print('='*60)
            extract_by_mythology(mythology, output_dir=args.output_dir or 'extracted', templates_path=args.templates)

    elif args.mythology:
        extract_by_mythology(args.mythology, output_dir=args.output_dir or 'extracted', templates_path=args.templates)

    elif args.input_dir:
        if not args.output_dir:
            print("ERROR: --output required when using --dir")
            sys.exit(1)
        extract_directory(args.input_dir, args.output_dir, args.templates)

    elif args.input and args.output:
        extract_single_file(args.input, args.output, args.templates)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()

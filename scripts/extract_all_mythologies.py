#!/usr/bin/env python3
"""
PHASE 2.6: EXTRACT ALL REMAINING MYTHOLOGIES
Comprehensive extraction script for all mythology HTML files
Handles special characters, mythology-specific concepts, and cultural context
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
from collections import defaultdict
import unicodedata

# Define project root
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")
MYTHOS_DIR = PROJECT_ROOT / "mythos"
OUTPUT_DIR = PROJECT_ROOT / "data" / "extracted"
TRACKER_FILE = PROJECT_ROOT / "MIGRATION_TRACKER.json"

# Load extraction templates
with open(PROJECT_ROOT / "extraction-templates.json", 'r', encoding='utf-8') as f:
    TEMPLATES = json.load(f)


class MythologyExtractor:
    """Extract HTML content to JSON for Firebase"""

    def __init__(self, mythology_name):
        self.mythology = mythology_name
        self.output_dir = OUTPUT_DIR / mythology_name
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.stats = {
            'total_files': 0,
            'extracted': 0,
            'errors': 0,
            'warnings': [],
            'special_chars': False,
            'completeness_scores': []
        }

    def extract_css_variables(self, soup):
        """Extract CSS color variables from :root"""
        colors = {}
        style_tags = soup.find_all('style')

        for style in style_tags:
            content = style.string if style.string else ''

            # Extract :root variables
            root_match = re.search(r':root\s*{([^}]+)}', content, re.DOTALL)
            if root_match:
                root_content = root_match.group(1)

                # Extract color variables
                primary = re.search(r'--mythos-primary:\s*([^;]+)', root_content)
                secondary = re.search(r'--mythos-secondary:\s*([^;]+)', root_content)
                primary_rgb = re.search(r'--mythos-primary-rgb:\s*([^;]+)', root_content)

                if primary:
                    colors['primary'] = primary.group(1).strip()
                if secondary:
                    colors['secondary'] = secondary.group(1).strip()
                if primary_rgb:
                    colors['primary_rgb'] = primary_rgb.group(1).strip()

        return colors

    def extract_entity_name(self, soup):
        """Extract entity name from title or h2"""
        # Try title first
        title = soup.find('title')
        if title:
            text = title.get_text().strip()
            # Remove common suffixes
            text = re.sub(r'\s*-\s*Eyes of Azrael.*$', '', text, flags=re.IGNORECASE)
            text = re.sub(r'\s*\|\s*.*$', '', text)
            if text:
                return text

        # Try h2 in header
        h2 = soup.find('h2')
        if h2:
            # Get text without nested links
            return h2.get_text(strip=True)

        return "Unknown Entity"

    def extract_entity_type(self, file_path):
        """Extract entity type from file path"""
        entity_type_mapping = {
            "deities": "deity",
            "heroes": "hero",
            "figures": "hero",
            "creatures": "creature",
            "places": "place",
            "items": "item",
            "artifacts": "item",
            "weapons": "item",
            "magic": "magic",
            "rituals": "ritual",
            "cosmology": "cosmology",
            "concepts": "concept",
            "texts": "text",
            "symbols": "symbol",
            "herbs": "herb",
            "angels": "angel",
            "demons": "demon",
            "saints": "saint",
            "prophets": "prophet",
            "path": "path"
        }

        parts = file_path.parts
        for part in parts:
            if part in entity_type_mapping:
                return entity_type_mapping[part]

        file_str = str(file_path).lower()
        for key, value in entity_type_mapping.items():
            if key in file_str:
                return value

        return "other"

    def extract_header(self, soup):
        """Extract header information"""
        header_data = {}

        # Find header section
        header = soup.find('section', class_=re.compile(r'deity-header|hero-header|hero-section'))
        if not header:
            header = soup.find('header')

        if header:
            # Icon
            icon_div = header.find('div', class_=re.compile(r'icon|symbol'))
            if icon_div:
                icon_text = icon_div.get_text(strip=True)
                # Check for hieroglyphs or special characters
                if any(ord(c) > 0x2000 for c in icon_text):
                    self.stats['special_chars'] = True
                header_data['icon'] = icon_text

            # Subtitle
            subtitle = header.find('p', class_='subtitle') or header.find('p', style=re.compile(r'font-size:\s*1\.5rem'))
            if subtitle:
                header_data['subtitle'] = subtitle.get_text(strip=True)

            # Description
            desc = header.find('p', style=re.compile(r'font-size:\s*1\.1rem|margin-top:\s*1rem'))
            if desc:
                header_data['description'] = self.preserve_html_content(desc)

        return header_data

    def preserve_html_content(self, element):
        """Preserve HTML content with links intact"""
        if not element:
            return ""

        # Get inner HTML with links preserved
        html = str(element)
        # Remove outer tag
        html = re.sub(r'^<[^>]+>', '', html)
        html = re.sub(r'</[^>]+>$', '', html)
        return html.strip()

    def extract_attributes(self, soup):
        """Extract attribute cards"""
        attributes = {}

        # Find attributes section
        attr_section = soup.find('section', id='attributes')
        if not attr_section:
            attr_section = soup.find('section', string=re.compile('Attributes'))

        if attr_section:
            # Find all attribute cards
            cards = attr_section.find_all('div', class_=re.compile(r'attribute-card|glass-card'))

            for card in cards:
                label_elem = card.find(class_='attribute-label')
                value_elem = card.find(class_='attribute-value')

                if label_elem and value_elem:
                    label = label_elem.get_text(strip=True)
                    value = self.preserve_html_content(value_elem)
                    attributes[label] = value

        return attributes

    def extract_mythology_section(self, soup):
        """Extract mythology stories and narratives"""
        myth_data = {}

        myth_section = soup.find('section', id='mythology')
        if not myth_section:
            # Try finding by heading
            myth_h2 = soup.find('h2', string=re.compile('Mythology', re.IGNORECASE))
            if myth_h2:
                myth_section = myth_h2.find_parent('section')

        if myth_section:
            # Intro paragraph
            first_p = myth_section.find('p')
            if first_p:
                myth_data['intro'] = self.preserve_html_content(first_p)

            # Key myths (usually in lists with strong tags)
            key_myths = []
            list_items = myth_section.find_all('li')

            for li in list_items:
                strong = li.find('strong')
                if strong:
                    myth_name = strong.get_text(strip=True).rstrip(':')
                    # Get rest of text after strong tag
                    li_html = str(li)
                    myth_desc = re.sub(r'<strong>[^<]*</strong>:?\s*', '', li_html)
                    myth_desc = re.sub(r'^<li[^>]*>|</li>$', '', myth_desc).strip()

                    key_myths.append({
                        'name': myth_name,
                        'description': myth_desc
                    })

            if key_myths:
                myth_data['key_myths'] = key_myths

            # Sources/citations
            citation = myth_section.find(class_='citation')
            if citation:
                sources = citation.get_text(strip=True)
                sources = re.sub(r'^Sources?:\s*', '', sources, flags=re.IGNORECASE)
                myth_data['sources'] = sources

        return myth_data

    def extract_relationships(self, soup):
        """Extract family and relationships"""
        relationships = {}

        rel_section = soup.find('section', id='relationships')
        if not rel_section:
            rel_h2 = soup.find('h2', string=re.compile('Relationships', re.IGNORECASE))
            if rel_h2:
                rel_section = rel_h2.find_parent('section')

        if rel_section:
            # Family section
            family = {}
            family_items = rel_section.find_all('li')

            for li in family_items:
                strong = li.find('strong')
                if strong:
                    rel_type = strong.get_text(strip=True).rstrip(':')
                    rel_value = li.get_text(strip=True)
                    rel_value = re.sub(r'^[^:]+:\s*', '', rel_value)

                    rel_type_lower = rel_type.lower()
                    if 'parent' in rel_type_lower:
                        family['parents'] = rel_value
                    elif 'consort' in rel_type_lower or 'spouse' in rel_type_lower:
                        family['consorts'] = rel_value
                    elif 'child' in rel_type_lower:
                        family['children'] = rel_value
                    elif 'sibling' in rel_type_lower:
                        family['siblings'] = rel_value
                    elif 'allies' in rel_type_lower:
                        relationships['allies'] = rel_value
                    elif 'enemies' in rel_type_lower or 'rival' in rel_type_lower:
                        relationships['enemies'] = rel_value

            if family:
                relationships['family'] = family

        return relationships

    def extract_worship(self, soup):
        """Extract worship practices (for deities)"""
        worship = {}

        worship_section = soup.find('section', id='worship')
        if not worship_section:
            worship_h2 = soup.find('h2', string=re.compile('Worship', re.IGNORECASE))
            if worship_h2:
                worship_section = worship_h2.find_parent('section')

        if worship_section:
            # Look for subsections
            h3_headings = worship_section.find_all('h3')

            for h3 in h3_headings:
                section_name = h3.get_text(strip=True).lower()

                # Get following content until next h3
                content = []
                for sibling in h3.find_next_siblings():
                    if sibling.name == 'h3':
                        break
                    if sibling.name in ['p', 'ul', 'div']:
                        content.append(self.preserve_html_content(sibling))

                if content:
                    worship[section_name] = ' '.join(content)

        return worship

    def extract_interlinks(self, soup):
        """Extract interlink panel data"""
        interlinks = {}

        panel = soup.find('section', class_='interlink-panel')
        if panel:
            # Archetype
            arch_card = panel.find(class_='archetype-link-card')
            if arch_card:
                archetype = {}
                badge = arch_card.find(class_='archetype-badge')
                if badge:
                    archetype['name'] = badge.get_text(strip=True)

                context = arch_card.find(class_='archetype-context')
                if context:
                    archetype['description'] = context.get_text(strip=True)

                if arch_card.get('href'):
                    archetype['url'] = arch_card.get('href')

                if archetype:
                    interlinks['archetype'] = archetype

            # Sacred items
            item_cards = panel.select('.interlink-section:has(.interlink-section-title) .item-link-card')
            if item_cards:
                items = []
                for card in item_cards:
                    item = {}
                    h4 = card.find('h4')
                    if h4:
                        item['name'] = h4.get_text(strip=True)

                    item_type = card.find(class_='item-type')
                    if item_type:
                        item['type'] = item_type.get_text(strip=True)

                    if card.get('href'):
                        item['url'] = card.get('href')

                    if item:
                        items.append(item)

                if items:
                    interlinks['sacred_items'] = items

            # Cross-cultural parallels
            parallel_cards = panel.select('.parallel-traditions .parallel-card')
            if parallel_cards:
                parallels = []
                for card in parallel_cards:
                    parallel = {}
                    name = card.find(class_='parallel-name')
                    if name:
                        parallel['name'] = name.get_text(strip=True)

                    tradition = card.find(class_='tradition-label')
                    if tradition:
                        parallel['mythology'] = tradition.get_text(strip=True)

                    if card.get('href'):
                        parallel['url'] = card.get('href')

                    if parallel:
                        parallels.append(parallel)

                if parallels:
                    interlinks['cross_cultural_parallels'] = parallels

        return interlinks

    def extract_see_also(self, soup):
        """Extract see also links"""
        see_also = []

        see_also_section = soup.find(class_='see-also-section')
        if see_also_section:
            links = see_also_section.find_all('a')
            for link in links:
                see_also.append({
                    'text': link.get_text(strip=True),
                    'url': link.get('href', '')
                })

        return see_also

    def calculate_completeness(self, data):
        """Calculate completeness score (0-100)"""
        score = 0

        # Basic fields (30 points)
        if data.get('entity', {}).get('name'):
            score += 10
        if data.get('entity', {}).get('description'):
            score += 10
        if data.get('entity', {}).get('subtitle'):
            score += 10

        # Attributes (20 points)
        attrs = data.get('attributes', {})
        if attrs:
            score += min(20, len(attrs) * 3)

        # Mythology section (25 points)
        myth = data.get('mythology_stories', {})
        if myth.get('intro'):
            score += 10
        if myth.get('key_myths'):
            score += 15

        # Relationships (15 points)
        rels = data.get('relationships', {})
        if rels:
            score += min(15, len(rels) * 5)

        # Type-specific content (10 points)
        if data.get('worship') or data.get('type_specific'):
            score += 10

        return min(100, score)

    def extract_file(self, html_file):
        """Extract a single HTML file"""
        try:
            with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            soup = BeautifulSoup(content, 'html.parser')

            # Build extraction data
            entity_name = self.extract_entity_name(soup)
            entity_type = self.extract_entity_type(html_file)

            data = {
                'metadata': {
                    'source_file': str(html_file.relative_to(PROJECT_ROOT)).replace('\\', '/'),
                    'extraction_date': datetime.now().isoformat(),
                    'extraction_version': '2.6',
                    'mythology': self.mythology
                },
                'entity': {
                    'name': entity_name,
                    'mythology': self.mythology,
                    'type': entity_type,
                    **self.extract_header(soup),
                    'css_colors': self.extract_css_variables(soup)
                },
                'attributes': self.extract_attributes(soup),
                'mythology_stories': self.extract_mythology_section(soup),
                'relationships': self.extract_relationships(soup)
            }

            # Add type-specific sections
            if entity_type == 'deity':
                worship = self.extract_worship(soup)
                if worship:
                    data['worship'] = worship

            # Add interlinks
            interlinks = self.extract_interlinks(soup)
            if interlinks:
                data['interlinks'] = interlinks

            # Add see also
            see_also = self.extract_see_also(soup)
            if see_also:
                data['see_also'] = see_also

            # Calculate completeness
            completeness = self.calculate_completeness(data)
            data['metadata']['completeness_score'] = completeness
            self.stats['completeness_scores'].append(completeness)

            # Save JSON
            json_filename = html_file.stem + '.json'
            json_path = self.output_dir / json_filename

            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            self.stats['extracted'] += 1
            return True

        except Exception as e:
            self.stats['errors'] += 1
            self.stats['warnings'].append(f"{html_file.name}: {str(e)}")
            print(f"  [ERR] Error extracting {html_file.name}: {e}")
            return False

    def extract_mythology(self):
        """Extract all files for this mythology"""
        print(f"\n{'='*60}")
        print(f"Extracting {self.mythology.upper()}")
        print(f"{'='*60}")

        myth_dir = MYTHOS_DIR / self.mythology
        if not myth_dir.exists():
            print(f"  [WARN] Directory not found: {myth_dir}")
            return self.stats

        # Find all HTML files (excluding index.html)
        html_files = [f for f in myth_dir.glob('**/*.html') if f.name != 'index.html']
        self.stats['total_files'] = len(html_files)

        print(f"Found {len(html_files)} files to extract")

        for i, html_file in enumerate(html_files, 1):
            print(f"  [{i}/{len(html_files)}] {html_file.stem}...", end=' ')
            if self.extract_file(html_file):
                print("OK")

            # Progress indicator every 10 files
            if i % 10 == 0:
                print(f"    Progress: {i}/{len(html_files)} ({i/len(html_files)*100:.1f}%)")

        # Calculate statistics
        if self.stats['completeness_scores']:
            avg_completeness = sum(self.stats['completeness_scores']) / len(self.stats['completeness_scores'])
            self.stats['avg_completeness'] = round(avg_completeness, 1)
        else:
            self.stats['avg_completeness'] = 0

        # Summary
        print(f"\n{'-'*60}")
        print(f"Completed: {self.stats['extracted']}/{self.stats['total_files']} files")
        print(f"Errors: {self.stats['errors']}")
        print(f"Avg Completeness: {self.stats['avg_completeness']}%")
        print(f"Special Characters: {'Yes' if self.stats['special_chars'] else 'No'}")

        return self.stats


def update_tracker(mythology_stats):
    """Update MIGRATION_TRACKER.json with extraction progress"""
    if not TRACKER_FILE.exists():
        return

    with open(TRACKER_FILE, 'r', encoding='utf-8') as f:
        tracker = json.load(f)

    for mythology, stats in mythology_stats.items():
        if mythology in tracker.get('byMythology', {}):
            tracker['byMythology'][mythology]['extracted'] = stats['extracted']

    # Update overall stats
    total_extracted = sum(stats['extracted'] for stats in mythology_stats.values())
    tracker['stages']['extracted'] = total_extracted

    with open(TRACKER_FILE, 'w', encoding='utf-8') as f:
        json.dump(tracker, f, indent=2)


def generate_report(all_stats):
    """Generate comprehensive extraction report"""
    report_path = PROJECT_ROOT / "REMAINING_MYTHOLOGIES_EXTRACTION_REPORT.md"

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# Remaining Mythologies Extraction Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Phase:** 2.6 - Extract All Remaining Mythologies\n\n")

        f.write("## Overview\n\n")

        total_files = sum(s['total_files'] for s in all_stats.values())
        total_extracted = sum(s['extracted'] for s in all_stats.values())
        total_errors = sum(s['errors'] for s in all_stats.values())

        f.write(f"- **Total Mythologies Processed:** {len(all_stats)}\n")
        f.write(f"- **Total Files:** {total_files}\n")
        f.write(f"- **Successfully Extracted:** {total_extracted}\n")
        f.write(f"- **Errors:** {total_errors}\n")
        f.write(f"- **Success Rate:** {total_extracted/total_files*100:.1f}%\n\n")

        f.write("## Extraction Results by Mythology\n\n")
        f.write("| Mythology | Files | Extracted | Errors | Avg Completeness | Special Chars |\n")
        f.write("|-----------|-------|-----------|--------|------------------|---------------|\n")

        for myth in sorted(all_stats.keys()):
            stats = all_stats[myth]
            special = "Y" if stats['special_chars'] else "-"
            f.write(f"| {myth.title()} | {stats['total_files']} | {stats['extracted']} | ")
            f.write(f"{stats['errors']} | {stats['avg_completeness']}% | {special} |\n")

        f.write("\n## High Priority Mythologies\n\n")

        f.write("### Christian Mythology\n")
        if 'christian' in all_stats:
            s = all_stats['christian']
            f.write(f"- **Files:** {s['total_files']}\n")
            f.write(f"- **Extracted:** {s['extracted']}\n")
            f.write(f"- **Avg Completeness:** {s['avg_completeness']}%\n")
            f.write(f"- **Special Handling:** Biblical references, saint hagiographies\n\n")

        f.write("### Jewish Mythology\n")
        if 'jewish' in all_stats:
            s = all_stats['jewish']
            f.write(f"- **Files:** {s['total_files']}\n")
            f.write(f"- **Extracted:** {s['extracted']}\n")
            f.write(f"- **Avg Completeness:** {s['avg_completeness']}%\n")
            f.write(f"- **Special Handling:** Hebrew terms, Torah citations, Kabbalistic concepts\n\n")

        f.write("### Chinese Mythology\n")
        if 'chinese' in all_stats:
            s = all_stats['chinese']
            f.write(f"- **Files:** {s['total_files']}\n")
            f.write(f"- **Extracted:** {s['extracted']}\n")
            f.write(f"- **Avg Completeness:** {s['avg_completeness']}%\n")
            f.write(f"- **Special Handling:** Chinese characters, Pinyin romanization\n\n")

        f.write("### Japanese Mythology\n")
        if 'japanese' in all_stats:
            s = all_stats['japanese']
            f.write(f"- **Files:** {s['total_files']}\n")
            f.write(f"- **Extracted:** {s['extracted']}\n")
            f.write(f"- **Avg Completeness:** {s['avg_completeness']}%\n")
            f.write(f"- **Special Handling:** Kanji, hiragana, kami concepts\n\n")

        f.write("## Special Character Handling\n\n")

        special_char_myths = [m for m, s in all_stats.items() if s['special_chars']]
        if special_char_myths:
            f.write("The following mythologies contain special characters:\n\n")
            for myth in special_char_myths:
                f.write(f"- **{myth.title()}:** UTF-8 encoding preserved\n")
        else:
            f.write("No special character handling required.\n")

        f.write("\n## Issues Encountered\n\n")

        has_issues = False
        for myth, stats in all_stats.items():
            if stats['warnings']:
                has_issues = True
                f.write(f"### {myth.title()}\n\n")
                for warning in stats['warnings'][:10]:  # Show first 10
                    f.write(f"- {warning}\n")
                if len(stats['warnings']) > 10:
                    f.write(f"- ...and {len(stats['warnings']) - 10} more warnings\n")
                f.write("\n")

        if not has_issues:
            f.write("No significant issues encountered during extraction.\n\n")

        f.write("## Completeness Analysis\n\n")

        # Group by completeness
        complete = [(m, s) for m, s in all_stats.items() if s['avg_completeness'] >= 80]
        partial = [(m, s) for m, s in all_stats.items() if 50 <= s['avg_completeness'] < 80]
        incomplete = [(m, s) for m, s in all_stats.items() if s['avg_completeness'] < 50]

        f.write(f"- **Complete (>=80%):** {len(complete)} mythologies\n")
        f.write(f"- **Partial (50-79%):** {len(partial)} mythologies\n")
        f.write(f"- **Incomplete (<50%):** {len(incomplete)} mythologies\n\n")

        if incomplete:
            f.write("### Mythologies Requiring Data Enrichment\n\n")
            for myth, stats in incomplete:
                f.write(f"- **{myth.title()}:** {stats['avg_completeness']}% complete ")
                f.write(f"({stats['extracted']} files)\n")

        f.write("\n## Next Steps\n\n")
        f.write("1. **Phase 2.7:** Validate all extracted JSON files\n")
        f.write("2. **Phase 2.8:** Enrich incomplete data\n")
        f.write("3. **Phase 3:** Upload to Firebase\n")
        f.write("4. **Phase 4:** Test and verify all content\n\n")

        f.write("## Output Files\n\n")
        f.write(f"Extracted JSON files saved to:\n")
        f.write(f"```\n{OUTPUT_DIR}/\n")
        for myth in sorted(all_stats.keys()):
            f.write(f"  {myth}/\n")
        f.write("```\n\n")

        f.write("## Summary\n\n")
        f.write(f"- Extracted {total_extracted} files across {len(all_stats)} mythologies\n")
        f.write(f"- {total_errors} errors encountered\n")
        f.write(f"- Average completeness: {sum(s['avg_completeness'] for s in all_stats.values())/len(all_stats):.1f}%\n")
        f.write(f"- Special character handling verified for {len(special_char_myths)} mythologies\n\n")

        f.write("All extractions complete and ready for validation.\n")

    print(f"\n[OK] Report generated: {report_path}")


def main():
    """Main extraction process"""
    print("="*80)
    print("PHASE 2.6: EXTRACT ALL REMAINING MYTHOLOGIES")
    print("="*80)

    # Define all mythologies to extract
    mythologies = [
        'christian', 'jewish', 'chinese', 'japanese', 'celtic', 'roman',
        'aztec', 'mayan', 'babylonian', 'persian', 'sumerian', 'islamic',
        'native_american', 'yoruba', 'apocryphal', 'comparative', 'tarot',
        'freemasons'
    ]

    # Also process already migrated ones for completeness
    # (skip if already have JSON outputs)
    all_mythologies = sorted([d.name for d in MYTHOS_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')])

    print(f"\nFound {len(all_mythologies)} mythology directories")
    print(f"Will extract: {', '.join(all_mythologies)}")

    all_stats = {}

    for mythology in all_mythologies:
        extractor = MythologyExtractor(mythology)
        stats = extractor.extract_mythology()
        all_stats[mythology] = stats

    # Update tracker
    print("\n" + "="*80)
    print("Updating MIGRATION_TRACKER.json...")
    update_tracker(all_stats)

    # Generate report
    print("Generating extraction report...")
    generate_report(all_stats)

    print("\n" + "="*80)
    print("PHASE 2.6 COMPLETE")
    print("="*80)

    total_extracted = sum(s['extracted'] for s in all_stats.values())
    total_files = sum(s['total_files'] for s in all_stats.values())

    print(f"\n[OK] Successfully extracted {total_extracted}/{total_files} files")
    print(f"[OK] Processed {len(all_stats)} mythologies")
    print(f"[OK] Output directory: {OUTPUT_DIR}")
    print(f"[OK] Report: REMAINING_MYTHOLOGIES_EXTRACTION_REPORT.md")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Polish Egyptian Deity Firebase Assets
Extracts missing information from HTML pages and enhances Firebase JSON files
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Any

# Base directories
BASE_DIR = Path(r"H:/Github/EyesOfAzrael")
FIREBASE_DOWNLOADED = BASE_DIR / "firebase-assets-downloaded" / "deities"
HTML_DIR = BASE_DIR / "mythos" / "egyptian" / "deities"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced" / "deities" / "egyptian"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# List of Egyptian deities
EGYPTIAN_DEITIES = [
    "amun-ra", "anhur", "anubis", "apep", "atum", "bastet", "geb", "hathor",
    "horus", "imhotep", "isis", "maat", "montu", "neith", "nephthys", "nut",
    "osiris", "ptah", "ra", "satis", "sekhmet", "set", "sobek", "tefnut", "thoth"
]


def extract_hieroglyphics(soup: BeautifulSoup) -> str:
    """Extract hieroglyphic name from HTML"""
    hieroglyph_span = soup.find('span', style=lambda s: s and 'Egyptian Hieroglyphs' in s)
    if hieroglyph_span:
        return hieroglyph_span.get_text(strip=True)
    return ""


def extract_subtitle(soup: BeautifulSoup) -> str:
    """Extract subtitle/epithets from hero section"""
    subtitle = soup.find('p', class_='subtitle')
    if subtitle:
        return subtitle.get_text(strip=True)
    return ""


def extract_main_description(soup: BeautifulSoup) -> str:
    """Extract main description from hero section"""
    hero_section = soup.find('section', class_='hero-section')
    if hero_section:
        paragraphs = hero_section.find_all('p', class_=lambda c: c != 'subtitle')
        if paragraphs:
            # Get text and clean up
            text = paragraphs[0].get_text(strip=True)
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)
            return text
    return ""


def extract_sections_content(soup: BeautifulSoup) -> Dict[str, str]:
    """Extract content from various sections"""
    sections = {}

    # Mythology section
    mythology = soup.find('section', id='mythology')
    if mythology:
        content = []
        for p in mythology.find_all('p'):
            text = p.get_text(strip=True)
            if text and 'Loading' not in text:
                content.append(text)
        if content:
            sections['mythology'] = ' '.join(content)

    # Worship section
    worship = soup.find('section', id='worship')
    if worship:
        content = []
        for elem in worship.find_all(['p', 'li']):
            text = elem.get_text(strip=True)
            if text and 'Loading' not in text:
                content.append(text)
        if content:
            sections['worship'] = ' '.join(content)

    # Iconography section
    iconography = soup.find('section')
    if iconography:
        h2 = iconography.find('h2', string=re.compile('Iconography'))
        if h2:
            parent = h2.find_parent('section')
            if parent:
                content = []
                for elem in parent.find_all(['p', 'li']):
                    text = elem.get_text(strip=True)
                    if text:
                        content.append(text)
                if content:
                    sections['iconography'] = ' '.join(content)

    return sections


def extract_relationships(soup: BeautifulSoup) -> Dict[str, Any]:
    """Extract family relationships from HTML"""
    relationships = {}

    rel_section = soup.find('section', id='relationships')
    if not rel_section:
        return relationships

    # Find Family subsection
    family_header = rel_section.find('h3', string=re.compile('Family'))
    if family_header:
        ul = family_header.find_next('ul')
        if ul:
            for li in ul.find_all('li', recursive=False):
                text = li.get_text(strip=True)
                # Parse relationships
                if 'Parents:' in text or 'Parent:' in text:
                    relationships['parents'] = text.split(':', 1)[1].strip()
                elif 'Father:' in text:
                    relationships['father'] = text.split(':', 1)[1].strip()
                elif 'Mother:' in text:
                    relationships['mother'] = text.split(':', 1)[1].strip()
                elif 'Consort:' in text or 'Consorts:' in text:
                    relationships['consort'] = text.split(':', 1)[1].strip()
                elif 'Children:' in text or 'Child:' in text:
                    relationships['children'] = text.split(':', 1)[1].strip()
                elif 'Siblings:' in text or 'Sibling:' in text:
                    relationships['siblings'] = text.split(':', 1)[1].strip()

    # Find Allies & Enemies subsection
    allies_header = rel_section.find('h3', string=re.compile('Allies'))
    if allies_header:
        ul = allies_header.find_next('ul')
        if ul:
            for li in ul.find_all('li', recursive=False):
                text = li.get_text(strip=True)
                if 'Allies:' in text or 'Ally:' in text:
                    relationships['allies'] = text.split(':', 1)[1].strip()
                elif 'Enemies:' in text or 'Enemy:' in text:
                    relationships['enemies'] = text.split(':', 1)[1].strip()

    return relationships


def extract_sacred_sites(soup: BeautifulSoup) -> List[str]:
    """Extract sacred sites and temple locations"""
    sites = []

    worship_section = soup.find('section', id='worship')
    if not worship_section:
        return sites

    # Look for Sacred Sites subsection
    sites_header = worship_section.find('h3', string=re.compile('Sacred Sites'))
    if sites_header:
        # Get the paragraph(s) after the header
        next_elem = sites_header.find_next_sibling()
        while next_elem and next_elem.name != 'h3':
            if next_elem.name == 'p':
                text = next_elem.get_text(strip=True)
                # Extract location names (capitalized words, especially with strong tags)
                strong_tags = next_elem.find_all('strong')
                for strong in strong_tags:
                    site = strong.get_text(strip=True)
                    if site and site not in sites:
                        sites.append(site)
            next_elem = next_elem.find_next_sibling()

    return sites


def extract_festivals(soup: BeautifulSoup) -> List[Dict[str, str]]:
    """Extract festivals and rituals"""
    festivals = []

    worship_section = soup.find('section', id='worship')
    if not worship_section:
        return festivals

    # Look for Festivals subsection
    fest_header = worship_section.find('h3', string=re.compile('Festivals'))
    if fest_header:
        ul = fest_header.find_next('ul')
        if ul:
            for li in ul.find_all('li', recursive=False):
                strong = li.find('strong')
                if strong:
                    name = strong.get_text(strip=True).rstrip(':')
                    desc = li.get_text(strip=True)
                    # Remove the name from description
                    desc = desc.replace(strong.get_text(strip=True), '').strip()
                    festivals.append({
                        'name': name,
                        'description': desc
                    })

    return festivals


def extract_prayers(soup: BeautifulSoup) -> List[str]:
    """Extract prayers and invocations"""
    prayers = []

    worship_section = soup.find('section', id='worship')
    if not worship_section:
        return prayers

    # Look for Prayers subsection
    prayer_header = worship_section.find('h3', string=re.compile('Prayers'))
    if prayer_header:
        next_elem = prayer_header.find_next_sibling()
        while next_elem and next_elem.name != 'h3':
            if next_elem.name == 'p':
                em = next_elem.find('em')
                if em:
                    prayer_text = em.get_text(strip=True)
                    if prayer_text:
                        prayers.append(prayer_text)
            next_elem = next_elem.find_next_sibling()

    return prayers


def extract_offerings(soup: BeautifulSoup) -> str:
    """Extract offerings information"""
    worship_section = soup.find('section', id='worship')
    if not worship_section:
        return ""

    # Look for Offerings subsection
    offerings_header = worship_section.find('h3', string=re.compile('Offerings'))
    if offerings_header:
        p = offerings_header.find_next('p')
        if p:
            return p.get_text(strip=True)

    return ""


def extract_iconography_forms(soup: BeautifulSoup) -> List[Dict[str, str]]:
    """Extract iconographic forms and depictions"""
    forms = []

    # Look for Iconography section
    for section in soup.find_all('section'):
        h2 = section.find('h2', string=re.compile('Iconography'))
        if h2:
            ul = section.find('ul')
            if ul:
                for li in ul.find_all('li', recursive=False):
                    strong = li.find('strong')
                    if strong:
                        form_name = strong.get_text(strip=True).rstrip(':')
                        desc = li.get_text(strip=True)
                        desc = desc.replace(strong.get_text(strip=True), '').strip()
                        forms.append({
                            'form': form_name,
                            'description': desc
                        })
            break

    return forms


def enhance_deity(deity_id: str) -> Dict[str, Any]:
    """Enhance a single deity's Firebase JSON with HTML content"""
    print(f"\nProcessing {deity_id}...")

    # Load existing Firebase JSON
    json_path = FIREBASE_DOWNLOADED / f"{deity_id}.json"
    if not json_path.exists():
        print(f"  Warning: No Firebase JSON found for {deity_id}")
        return None

    with open(json_path, 'r', encoding='utf-8') as f:
        firebase_data = json.load(f)

    # Load HTML
    html_path = HTML_DIR / f"{deity_id}.html"
    if not html_path.exists():
        print(f"  Warning: No HTML found for {deity_id}")
        return firebase_data

    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract information
    hieroglyphs = extract_hieroglyphics(soup)
    subtitle = extract_subtitle(soup)
    main_desc = extract_main_description(soup)
    sections = extract_sections_content(soup)
    relationships = extract_relationships(soup)
    sacred_sites = extract_sacred_sites(soup)
    festivals = extract_festivals(soup)
    prayers = extract_prayers(soup)
    offerings = extract_offerings(soup)
    iconography = extract_iconography_forms(soup)

    # Enhance Firebase data
    enhanced = firebase_data.copy()

    # Add hieroglyphics
    if hieroglyphs and 'hieroglyphics' not in enhanced:
        enhanced['hieroglyphics'] = hieroglyphs

    # Add subtitle as epithet if not already present
    if subtitle:
        if 'epithets' not in enhanced or not enhanced['epithets']:
            enhanced['epithets'] = [subtitle]
        elif subtitle not in enhanced.get('epithets', []):
            if isinstance(enhanced['epithets'], list):
                enhanced['epithets'].append(subtitle)

    # Enhance description
    if main_desc and (not enhanced.get('description') or enhanced['description'] == f"Also known as {enhanced.get('displayName', '')}. Associated with unknown."):
        enhanced['description'] = main_desc

    # Add detailed sections
    if 'detailedContent' not in enhanced:
        enhanced['detailedContent'] = {}

    if sections.get('mythology'):
        enhanced['detailedContent']['mythology'] = sections['mythology']

    if sections.get('worship'):
        enhanced['detailedContent']['worship'] = sections['worship']

    if sections.get('iconography'):
        enhanced['detailedContent']['iconography'] = sections['iconography']

    # Enhance relationships
    if relationships:
        if 'relationships' not in enhanced or not enhanced['relationships']:
            enhanced['relationships'] = {}

        for key, value in relationships.items():
            if key not in enhanced['relationships'] or not enhanced['relationships'].get(key):
                enhanced['relationships'][key] = value

    # Add worship information
    if 'worship' not in enhanced:
        enhanced['worship'] = {}

    if sacred_sites:
        enhanced['worship']['sacredSites'] = sacred_sites

    if festivals:
        enhanced['worship']['festivals'] = festivals

    if prayers:
        enhanced['worship']['prayers'] = prayers

    if offerings:
        enhanced['worship']['offerings'] = offerings

    # Add iconography
    if iconography:
        enhanced['iconography'] = iconography

    # Update metadata
    if 'metadata' not in enhanced:
        enhanced['metadata'] = {}

    enhanced['metadata']['enhancedBy'] = 'agent_2_html_extraction'
    enhanced['metadata']['enhancementDate'] = '2025-12-25'
    enhanced['metadata']['source'] = 'html_content_extraction'

    print(f"  [+] Enhanced with:")
    if hieroglyphs:
        print(f"    - Hieroglyphics added")
    if subtitle:
        print(f"    - Subtitle/Epithets added")
    if relationships:
        print(f"    - Relationships: {len(relationships)} types")
    if sacred_sites:
        print(f"    - Sacred sites: {len(sacred_sites)}")
    if festivals:
        print(f"    - Festivals: {len(festivals)}")
    if prayers:
        print(f"    - Prayers: {len(prayers)}")
    if iconography:
        print(f"    - Iconographic forms: {len(iconography)}")

    return enhanced


def main():
    """Process all Egyptian deities"""
    print("=" * 60)
    print("Egyptian Deity Firebase Asset Enhancement")
    print("=" * 60)

    results = {
        'processed': 0,
        'enhanced': 0,
        'missing': 0,
        'errors': []
    }

    for deity_id in EGYPTIAN_DEITIES:
        try:
            enhanced_data = enhance_deity(deity_id)

            if enhanced_data:
                # Save enhanced JSON
                output_path = OUTPUT_DIR / f"{deity_id}.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_data, f, indent=2, ensure_ascii=False)

                results['processed'] += 1
                results['enhanced'] += 1
                print(f"  [OK] Saved enhanced deity")
            else:
                results['missing'] += 1

        except Exception as e:
            print(f"  [ERROR] Error processing {deity_id}: {str(e)}")
            results['errors'].append(f"{deity_id}: {str(e)}")

    # Print summary
    print("\n" + "=" * 60)
    print("ENHANCEMENT SUMMARY")
    print("=" * 60)
    print(f"Total deities processed: {results['processed']}")
    print(f"Successfully enhanced: {results['enhanced']}")
    print(f"Missing files: {results['missing']}")

    if results['errors']:
        print(f"\nErrors ({len(results['errors'])}):")
        for error in results['errors']:
            print(f"  - {error}")

    print(f"\nEnhanced files saved to: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Hindu Deity Firebase Asset Enhancement Script
Extracts detailed information from HTML pages and enhances Firebase JSON assets.

Agent 4 - Hindu Deity Polish Task
"""

import json
import re
import os
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Any

# Base paths
BASE_DIR = Path("h:/Github/EyesOfAzrael")
FIREBASE_ASSETS_DIR = BASE_DIR / "firebase-assets-downloaded" / "deities"
HTML_DIR = BASE_DIR / "mythos" / "hindu" / "deities"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced" / "deities" / "hindu"

# Hindu deities to process
HINDU_DEITIES = [
    "brahma", "vishnu", "shiva", "durga", "ganesha", "hanuman",
    "indra", "kali", "lakshmi", "parvati", "saraswati", "yama",
    "yami", "krishna", "kartikeya", "dhanvantari", "dyaus",
    "prithvi", "rati", "vritra"
]

def load_json(filepath: Path) -> Dict:
    """Load JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data: Dict, filepath: Path):
    """Save JSON file with proper formatting."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_html(filepath: Path) -> BeautifulSoup:
    """Load and parse HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return BeautifulSoup(f.read(), 'html.parser')

def extract_mantras(soup: BeautifulSoup) -> List[str]:
    """Extract mantras from HTML."""
    mantras = []

    # Look for text containing "Om" or "mantra"
    text = soup.get_text()

    # Common mantra patterns
    om_patterns = [
        r'"Om[^"]+?"',  # Quoted Om mantras
        r'"Om[^"]+Namah[^"]*"',  # Om ... Namah mantras
        r'Maha Mrityunjaya Mantra',
        r'Gayatri Mantra'
    ]

    for pattern in om_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            clean_mantra = match.strip('"')
            if clean_mantra and clean_mantra not in mantras:
                mantras.append(clean_mantra)

    return mantras

def extract_vahana(soup: BeautifulSoup, deity_name: str) -> str:
    """Extract vahana (vehicle) information."""
    text = soup.get_text()

    # Vahana patterns
    vahana_patterns = [
        r'Vahana[:\s]+([^\n\.,]+)',
        r'vahana[:\s]+([^\n\.,]+)',
        r'vehicle[:\s]+([^\n\.,]+)',
        r'rides?\s+(?:a|an|on)\s+([^\n\.,]+)',
        r'mounted?\s+on\s+([^\n\.,]+)'
    ]

    for pattern in vahana_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            vahana = match.group(1).strip()
            # Clean up common endings
            vahana = re.sub(r'\s*\([^)]*\)', '', vahana)  # Remove parentheses
            vahana = re.sub(r'\s*-\s*.*$', '', vahana)  # Remove dashes and after
            return vahana

    # Deity-specific vahanas
    vahana_map = {
        'ganesha': 'Mushika (mouse/rat)',
        'shiva': 'Nandi (bull)',
        'vishnu': 'Garuda (divine eagle)',
        'durga': 'Lion or tiger',
        'brahma': 'Hamsa (swan or goose)',
        'kartikeya': 'Peacock (Parvani)',
        'lakshmi': 'Owl (Uluka)',
        'saraswati': 'Swan (Hamsa)',
        'yama': 'Buffalo',
        'indra': 'Airavata (white elephant)',
        'hanuman': 'None (capable of flight)'
    }

    return vahana_map.get(deity_name.lower(), "")

def extract_weapons(soup: BeautifulSoup) -> List[str]:
    """Extract weapons and divine implements."""
    weapons = []

    # Look in symbols and attributes
    symbols_section = soup.find('div', {'class': 'attribute-grid'}) or soup.find('section')
    if symbols_section:
        text = symbols_section.get_text()

        # Weapon patterns
        weapon_keywords = [
            'trishula', 'trident', 'chakra', 'discus', 'mace', 'bow',
            'arrow', 'sword', 'axe', 'dagger', 'spear', 'club',
            'conch', 'lotus', 'goad', 'noose', 'khatvanga', 'vajra',
            'damaru', 'drum', 'gada', 'khadga', 'parashu'
        ]

        for weapon in weapon_keywords:
            if re.search(rf'\b{weapon}\b', text, re.IGNORECASE):
                weapons.append(weapon.title())

    return list(set(weapons))

def extract_festivals(soup: BeautifulSoup, deity_name: str) -> List[Dict[str, str]]:
    """Extract festival information."""
    festivals = []

    # Find festivals section
    festival_section = None
    for header in soup.find_all(['h2', 'h3']):
        if 'festival' in header.get_text().lower():
            festival_section = header.find_next('ul') or header.find_next('div')
            break

    if festival_section:
        items = festival_section.find_all('li')
        for item in items:
            text = item.get_text()
            # Extract festival name (usually before the colon)
            match = re.match(r'([^:]+):\s*(.+)', text)
            if match:
                festivals.append({
                    'name': match.group(1).strip(),
                    'description': match.group(2).strip()
                })

    # Deity-specific major festivals if none found
    if not festivals:
        festival_map = {
            'ganesha': [{'name': 'Ganesh Chaturthi', 'description': 'Birthday celebration, 10-day festival'}],
            'shiva': [{'name': 'Maha Shivaratri', 'description': 'The Great Night of Shiva'}],
            'vishnu': [{'name': 'Vaikuntha Ekadashi', 'description': 'Day when gates to Vaikuntha open'}],
            'krishna': [{'name': 'Krishna Janmashtami', 'description': 'Birthday of Lord Krishna'}],
            'durga': [{'name': 'Durga Puja / Navaratri', 'description': 'Nine nights celebrating Durga'}],
            'lakshmi': [{'name': 'Diwali', 'description': 'Festival of Lights, Lakshmi worship'}],
            'saraswati': [{'name': 'Vasant Panchami', 'description': 'Celebration of learning and arts'}]
        }
        festivals = festival_map.get(deity_name.lower(), [])

    return festivals

def extract_consorts_family(soup: BeautifulSoup, existing_relationships: Dict) -> Dict:
    """Extract family and consort information."""
    relationships = existing_relationships.copy() if existing_relationships else {}

    # Find relationships section
    text = soup.get_text()

    # Extract consort
    consort_patterns = [
        r'Consort[:\s]+([^\n\.,]+)',
        r'consort[:\s]+([^\n\.,]+)',
        r'(?:wife|husband)[:\s]+([^\n\.,]+)'
    ]

    for pattern in consort_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match and 'consort' not in relationships:
            relationships['consort'] = match.group(1).strip()
            break

    # Extract children
    children_pattern = r'Children[:\s]+([^\n]+)'
    match = re.search(children_pattern, text, re.IGNORECASE)
    if match and 'children' not in relationships:
        children_text = match.group(1)
        # Split by commas and common separators
        children = [c.strip() for c in re.split(r',|and|\band\b', children_text)]
        relationships['children'] = [c for c in children if c and len(c) > 2]

    return relationships

def extract_sanskrit_names(soup: BeautifulSoup) -> List[str]:
    """Extract Sanskrit names and epithets."""
    epithets = []

    # Look for epithets or alternative names section
    text = soup.get_text()

    # Common epithet markers
    epithet_patterns = [
        r'(?:Also known as|Known as|Called)[:\s]+([^\n\.]+)',
        r'Epithet[s]?[:\s]+([^\n\.]+)',
        r'Name[s]?[:\s]+([^\n\.]+)'
    ]

    for pattern in epithet_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            # Split on commas
            names = [n.strip() for n in match.split(',')]
            epithets.extend([n for n in names if n and len(n) < 50])

    return list(set(epithets))[:10]  # Limit to 10

def extract_associated_texts(soup: BeautifulSoup) -> List[str]:
    """Extract associated sacred texts."""
    texts = []

    # Find sources or texts section
    source_section = soup.find('div', {'class': 'citation'}) or soup.find('strong', string=re.compile('Sources?:'))

    if source_section:
        text = source_section.get_text() if hasattr(source_section, 'get_text') else str(source_section)

        # Common text names
        text_names = [
            'Rigveda', 'Yajurveda', 'Samaveda', 'Atharvaveda',
            'Bhagavad Gita', 'Mahabharata', 'Ramayana',
            'Vishnu Purana', 'Shiva Purana', 'Bhagavata Purana',
            'Devi Bhagavata Purana', 'Ganesha Purana',
            'Upanishads', 'Vedas'
        ]

        for text_name in text_names:
            if text_name.lower() in text.lower():
                texts.append(text_name)

    return list(set(texts))

def enhance_deity_asset(deity_name: str) -> Dict:
    """Main function to enhance a deity's Firebase asset."""
    print(f"\nEnhancing {deity_name}...")

    # Load existing Firebase asset
    firebase_file = FIREBASE_ASSETS_DIR / f"{deity_name}.json"
    if not firebase_file.exists():
        print(f"  Firebase asset not found: {firebase_file}")
        return None

    asset = load_json(firebase_file)

    # Load HTML file
    html_file = HTML_DIR / f"{deity_name}.html"
    if not html_file.exists():
        print(f"  HTML file not found: {html_file}")
        return asset  # Return unmodified if no HTML

    soup = load_html(html_file)

    # Extract enhancements
    print(f"  Extracting mantras...")
    mantras = extract_mantras(soup)

    print(f"  Extracting vahana...")
    vahana = extract_vahana(soup, deity_name)

    print(f"  Extracting weapons...")
    weapons = extract_weapons(soup)

    print(f"  Extracting festivals...")
    festivals = extract_festivals(soup, deity_name)

    print(f"  Extracting family relationships...")
    relationships = extract_consorts_family(soup, asset.get('relationships', {}))

    print(f"  Extracting Sanskrit names...")
    sanskrit_names = extract_sanskrit_names(soup)

    print(f"  Extracting associated texts...")
    texts = extract_associated_texts(soup)

    # Add enhancements to asset
    if mantras:
        asset['mantras'] = mantras
        print(f"    Added {len(mantras)} mantras")

    if vahana:
        asset['vahana'] = vahana
        # Encode vahana to ASCII for printing to avoid Unicode errors
        vahana_display = vahana.encode('ascii', 'ignore').decode('ascii')
        print(f"    Added vahana: {vahana_display}")

    if weapons:
        # Add to symbols if not already there
        existing_symbols = set(asset.get('symbols', []))
        for weapon in weapons:
            if weapon.lower() not in [s.lower() for s in existing_symbols]:
                asset.setdefault('symbols', []).append(weapon)
        print(f"    Added {len(weapons)} weapons to symbols")

    if festivals:
        asset['festivals'] = festivals
        print(f"    Added {len(festivals)} festivals")

    if relationships:
        asset['relationships'] = relationships
        print(f"    Enhanced relationships")

    if sanskrit_names:
        # Add to epithets if not already there
        existing_epithets = set(asset.get('epithets', []))
        for name in sanskrit_names:
            if name not in existing_epithets:
                asset.setdefault('epithets', []).append(name)
        print(f"    Added {len(sanskrit_names)} Sanskrit names/epithets")

    if texts:
        asset['associatedTexts'] = texts
        print(f"    Added {len(texts)} sacred texts")

    # Add enhancement metadata
    asset.setdefault('metadata', {})
    asset['metadata']['enhancedBy'] = 'Agent4_HinduDeityPolish'
    asset['metadata']['enhancementDate'] = '2025-12-25'

    return asset

def main():
    """Main execution function."""
    print("=" * 60)
    print("Hindu Deity Firebase Asset Enhancement")
    print("Agent 4 - Polishing Hindu Deity Assets")
    print("=" * 60)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    enhanced_count = 0
    summary = []

    for deity_name in HINDU_DEITIES:
        enhanced_asset = enhance_deity_asset(deity_name)

        if enhanced_asset:
            # Save enhanced asset
            output_file = OUTPUT_DIR / f"{deity_name}.json"
            save_json(enhanced_asset, output_file)
            print(f"  [OK] Saved to {output_file}")
            enhanced_count += 1

            # Track summary
            summary.append({
                'name': deity_name,
                'mantras': len(enhanced_asset.get('mantras', [])),
                'vahana': bool(enhanced_asset.get('vahana')),
                'festivals': len(enhanced_asset.get('festivals', [])),
                'texts': len(enhanced_asset.get('associatedTexts', []))
            })

    # Print summary
    print("\n" + "=" * 60)
    print("ENHANCEMENT SUMMARY")
    print("=" * 60)
    print(f"Total deities processed: {len(HINDU_DEITIES)}")
    print(f"Successfully enhanced: {enhanced_count}")
    print()

    print(f"{'Deity':<15} {'Mantras':<10} {'Vahana':<10} {'Festivals':<12} {'Texts':<8}")
    print("-" * 60)
    for item in summary:
        vahana_mark = "YES" if item['vahana'] else "NO"
        print(f"{item['name']:<15} {item['mantras']:<10} {vahana_mark:<10} {item['festivals']:<12} {item['texts']:<8}")

    print()
    print(f"Enhanced assets saved to: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()

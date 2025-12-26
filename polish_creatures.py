#!/usr/bin/env python3
"""
Creature Asset Polish Script
Extracts rich content from HTML files and enhances Firebase creature assets
Agent 11 - Creature Polish Task
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Any

# Base directories
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
FIREBASE_HTML_DIR = BASE_DIR / "FIREBASE" / "mythos"
FIREBASE_ASSETS = BASE_DIR / "firebase-assets-downloaded" / "creatures" / "_all.json"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced" / "creatures"

def load_existing_creatures() -> List[Dict]:
    """Load existing creature data from Firebase"""
    with open(FIREBASE_ASSETS, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_text_clean(element) -> str:
    """Extract and clean text from HTML element"""
    if not element:
        return ""
    text = element.get_text(separator=" ", strip=True)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_list_items(soup, section_heading: str) -> List[str]:
    """Extract list items from a section"""
    items = []
    # Find section by heading
    heading = soup.find(lambda tag: tag.name in ['h2', 'h3', 'h4'] and section_heading.lower() in tag.get_text().lower())
    if heading:
        # Find next ul or ol
        ul = heading.find_next(['ul', 'ol'])
        if ul:
            for li in ul.find_all('li', recursive=False):
                text = extract_text_clean(li)
                if text:
                    items.append(text)
    return items

def extract_from_attribute_grid(soup) -> Dict[str, str]:
    """Extract attributes from attribute-grid divs"""
    attributes = {}
    grid = soup.find('div', class_='attribute-grid')
    if grid:
        for card in grid.find_all('div', class_='attribute-card'):
            label_elem = card.find('div', class_='attribute-label')
            value_elem = card.find('div', class_='attribute-value')
            if label_elem and value_elem:
                label = extract_text_clean(label_elem)
                value = extract_text_clean(value_elem)
                attributes[label.lower()] = value
    return attributes

def extract_physical_description(soup) -> str:
    """Extract physical description from HTML"""
    # Look for Physical Description section
    descriptions = []

    # Check hero-description class
    hero_desc = soup.find(class_='hero-description')
    if hero_desc:
        descriptions.append(extract_text_clean(hero_desc))

    # Check subtitle
    subtitle = soup.find(class_='subtitle')
    if subtitle:
        descriptions.append(extract_text_clean(subtitle))

    # Check for specific sections
    phys_section = soup.find(lambda tag: tag.name in ['h2', 'h3'] and 'physical' in tag.get_text().lower())
    if phys_section:
        next_content = phys_section.find_next(['p', 'div'])
        if next_content:
            descriptions.append(extract_text_clean(next_content))

    return " ".join(descriptions) if descriptions else ""

def extract_origins_and_mythology(soup) -> str:
    """Extract origin stories and mythology"""
    stories = []

    # Find mythology sections
    sections = soup.find_all(lambda tag: tag.name in ['h2', 'h3'] and
                             any(keyword in tag.get_text().lower() for keyword in
                                 ['origin', 'mythology', 'birth', 'creation', 'quest', 'story', 'stories']))

    for section in sections:
        # Get paragraphs following the heading
        sibling = section.find_next_sibling()
        count = 0
        while sibling and count < 5:  # Limit to 5 siblings
            if sibling.name in ['h2', 'h3', 'h4']:
                break
            if sibling.name == 'p':
                text = extract_text_clean(sibling)
                if text and len(text) > 50:  # Only meaningful paragraphs
                    stories.append(text)
            sibling = sibling.find_next_sibling()
            count += 1

    return " ".join(stories[:3]) if stories else ""  # Limit to first 3 paragraphs

def extract_abilities_and_powers(soup) -> List[str]:
    """Extract abilities and powers"""
    abilities = []

    # Check attribute grid first
    attrs = extract_from_attribute_grid(soup)
    if 'powers' in attrs:
        abilities.append(attrs['powers'])

    # Look for abilities/powers sections
    abilities.extend(extract_list_items(soup, 'abilities'))
    abilities.extend(extract_list_items(soup, 'powers'))
    abilities.extend(extract_list_items(soup, 'attributes'))

    # Also check glass-cards with Abilities/Powers headers
    for card in soup.find_all('div', class_='glass-card'):
        h3 = card.find('h3')
        if h3 and any(word in h3.get_text().lower() for word in ['power', 'abilit', 'attribute']):
            ul = card.find(['ul', 'ol'])
            if ul:
                for li in ul.find_all('li', recursive=False):
                    text = extract_text_clean(li)
                    if text:
                        abilities.append(text)

    return list(dict.fromkeys(abilities))  # Remove duplicates while preserving order

def extract_weaknesses(soup) -> List[str]:
    """Extract weaknesses"""
    return extract_list_items(soup, 'weakness')

def extract_habitat(soup) -> List[str]:
    """Extract habitat/dwelling information"""
    habitats = []

    attrs = extract_from_attribute_grid(soup)
    if 'dwelling' in attrs:
        habitats.append(attrs['dwelling'])
    if 'lair' in attrs:
        habitats.append(attrs['lair'])

    # Look for habitat sections
    habitats.extend(extract_list_items(soup, 'habitat'))
    habitats.extend(extract_list_items(soup, 'dwelling'))

    return habitats

def extract_symbolism(soup) -> str:
    """Extract symbolic meaning and cultural significance"""
    symbolism = []

    # Find symbolism sections
    sections = soup.find_all(lambda tag: tag.name in ['h2', 'h3'] and
                             any(keyword in tag.get_text().lower() for keyword in
                                 ['symbol', 'interpret', 'significance', 'meaning', 'cultural']))

    for section in sections:
        sibling = section.find_next_sibling()
        count = 0
        while sibling and count < 3:
            if sibling.name in ['h2', 'h3']:
                break
            if sibling.name == 'p':
                text = extract_text_clean(sibling)
                if text and len(text) > 50:
                    symbolism.append(text)
            sibling = sibling.find_next_sibling()
            count += 1

    return " ".join(symbolism[:2]) if symbolism else ""

def extract_primary_sources(soup) -> List[str]:
    """Extract primary sources"""
    sources = []

    # Look for source cards
    for card in soup.find_all('div', class_='source-card'):
        title_elem = card.find('div', class_='source-title')
        author_elem = card.find('div', class_='source-author')
        if title_elem:
            title = extract_text_clean(title_elem)
            author = extract_text_clean(author_elem) if author_elem else ""
            source = f"{title}"
            if author:
                source += f" by {author}"
            sources.append(source)

    return sources

def find_creature_html(mythology: str, filename: str) -> Path:
    """Find the HTML file for a creature"""
    html_path = FIREBASE_HTML_DIR / mythology / "creatures" / f"{filename}.html"
    if html_path.exists():
        return html_path
    return None

def enhance_creature(creature: Dict) -> Dict:
    """Enhance a single creature with extracted HTML content"""
    mythology = creature.get('mythology', '')
    filename = creature.get('filename', creature.get('id', '').split('_')[-1])

    html_path = find_creature_html(mythology, filename)
    if not html_path or not html_path.exists():
        print(f"  No HTML found for {mythology}/{filename}")
        return creature

    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        # Extract content
        physical_desc = extract_physical_description(soup)
        origins = extract_origins_and_mythology(soup)
        abilities = extract_abilities_and_powers(soup)
        weaknesses = extract_weaknesses(soup)
        habitats = extract_habitat(soup)
        symbolism = extract_symbolism(soup)
        sources = extract_primary_sources(soup)
        attrs = extract_from_attribute_grid(soup)

        # Enhance creature data
        enhanced = creature.copy()

        # Add physical description
        if physical_desc and not enhanced.get('physicalDescription'):
            enhanced['physicalDescription'] = physical_desc

        # Add origins/mythology
        if origins and not enhanced.get('mythology_story'):
            enhanced['mythology_story'] = origins

        # Add/merge abilities
        if abilities:
            existing_abilities = enhanced.get('abilities', [])
            # Merge and deduplicate
            all_abilities = existing_abilities + abilities
            enhanced['abilities'] = list(dict.fromkeys(all_abilities))

        # Add weaknesses
        if weaknesses and not enhanced.get('weaknesses'):
            enhanced['weaknesses'] = weaknesses

        # Add habitats
        if habitats:
            existing_habitats = enhanced.get('habitats', [])
            all_habitats = existing_habitats + habitats
            enhanced['habitats'] = list(dict.fromkeys(all_habitats))

        # Add symbolism
        if symbolism and not enhanced.get('symbolism'):
            enhanced['symbolism'] = symbolism

        # Add primary sources
        if sources:
            existing_sources = enhanced.get('primarySources', [])
            all_sources = existing_sources + sources
            enhanced['primarySources'] = list(dict.fromkeys(all_sources))

        # Add attributes from grid
        if attrs.get('nature'):
            enhanced['nature'] = attrs['nature']
        if attrs.get('origin'):
            enhanced['origin'] = attrs['origin']
        if attrs.get('domains'):
            enhanced['domains'] = attrs['domains']
        if attrs.get('symbols'):
            enhanced['symbols'] = attrs['symbols']

        # Calculate completeness score
        fields_filled = sum([
            bool(enhanced.get('physicalDescription')),
            bool(enhanced.get('mythology_story')),
            bool(enhanced.get('abilities')),
            bool(enhanced.get('weaknesses')),
            bool(enhanced.get('habitats')),
            bool(enhanced.get('symbolism')),
            bool(enhanced.get('primarySources')),
            bool(enhanced.get('nature')),
            bool(enhanced.get('origin'))
        ])
        enhanced['completeness'] = int((fields_filled / 9) * 100)

        # Update metadata
        if 'metadata' not in enhanced:
            enhanced['metadata'] = {}
        enhanced['metadata']['polished'] = True
        enhanced['metadata']['polishedBy'] = 'Agent_11'
        enhanced['metadata']['htmlExtracted'] = True

        return enhanced

    except Exception as e:
        print(f"  Error processing {mythology}/{filename}: {e}")
        return creature

def main():
    """Main execution function"""
    import sys
    # Set UTF-8 encoding for Windows console
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

    print("=== Creature Asset Polish Tool ===")
    print(f"Agent 11 - Polishing creature assets\n")

    # Load existing creatures
    print("Loading existing creature data...")
    creatures = load_existing_creatures()
    print(f"Loaded {len(creatures)} creatures\n")

    # Enhance creatures
    enhanced_creatures = []
    by_mythology = {}

    print("Processing creatures...")
    for creature in creatures:
        mythology = creature.get('mythology', 'unknown')
        name = creature.get('displayName', creature.get('name', 'Unknown'))

        print(f"Processing: {mythology} - {name}")
        enhanced = enhance_creature(creature)
        enhanced_creatures.append(enhanced)

        # Group by mythology
        if mythology not in by_mythology:
            by_mythology[mythology] = []
        by_mythology[mythology].append(enhanced)

    # Save by mythology
    print(f"\nSaving enhanced creatures...")
    for mythology, creatures_list in by_mythology.items():
        mythology_dir = OUTPUT_DIR / mythology
        mythology_dir.mkdir(parents=True, exist_ok=True)

        output_file = mythology_dir / f"{mythology}_creatures_enhanced.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(creatures_list, f, indent=2, ensure_ascii=False)
        print(f"  Saved {len(creatures_list)} {mythology} creatures")

    # Save combined file
    all_file = OUTPUT_DIR / "all_creatures_enhanced.json"
    with open(all_file, 'w', encoding='utf-8') as f:
        json.dump(enhanced_creatures, f, indent=2, ensure_ascii=False)
    print(f"\nSaved all {len(enhanced_creatures)} enhanced creatures to {all_file}")

    # Generate summary report
    print("\n=== Enhancement Summary ===")
    total_enhanced = sum(1 for c in enhanced_creatures if c.get('metadata', {}).get('polished'))
    print(f"Total creatures processed: {len(enhanced_creatures)}")
    print(f"Successfully enhanced: {total_enhanced}")
    print(f"Average completeness: {sum(c.get('completeness', 0) for c in enhanced_creatures) // len(enhanced_creatures)}%")

    print("\nBy Mythology:")
    for mythology in sorted(by_mythology.keys()):
        count = len(by_mythology[mythology])
        avg_complete = sum(c.get('completeness', 0) for c in by_mythology[mythology]) // max(count, 1)
        print(f"  {mythology:15s}: {count:2d} creatures ({avg_complete}% complete)")

    print("\n=== Polish Complete! ===")

if __name__ == "__main__":
    main()

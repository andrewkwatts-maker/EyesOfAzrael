#!/usr/bin/env python3
"""
Migrate spiritual-items HTML files to unified entity JSON format.
Extracts content from HTML and creates metadata v2.0 compliant JSON files.
"""

import os
import json
import re
from bs4 import BeautifulSoup
from pathlib import Path

# Items that need migration (not already in data/entities/item/)
ITEMS_TO_MIGRATE = [
    'aarons-rod', 'ame-no-murakumo', 'amenonuhoko', 'apollo-bow', 'artemis-bow',
    'ascalon', 'athame', 'athena-aegis', 'bell-and-dorje', 'black-stone',
    'book-of-thoth', 'brahmastra', 'caladbolg', 'cauldron-of-rebirth',
    'claiomh-solais', 'cloak-of-invisibility', 'conch-shell', 'cornucopia',
    'cronos-scythe', 'crown-of-thorns', 'cup-of-jamshid', 'dainsleif',
    'durandal', 'emerald-tablet', 'excalibur', 'eye-of-horus', 'fragarach',
    'gae-bolg', 'gram', 'green-dragon-crescent-blade', 'hades-helm',
    'hand-of-glory', 'harpe', 'hermes-caduceus', 'hofud', 'holy-grail',
    'hrunting', 'laevateinn', 'megingjord', 'mezuzah', 'necklace-of-harmonia',
    'pandoras-box', 'pashupatastra', 'philosophers-stone', 'poseidon-trident',
    'prayer-wheel', 'ring-of-gyges', 'rosary', 'sampo', 'seal-of-solomon',
    'sharur', 'shiva-lingam', 'shofar', 'shroud-of-turin', 'singing-bowl',
    'sistrum', 'skidbladnir', 'spear-of-longinus', 'spear-of-lugh',
    'stone-of-destiny', 'sword-of-nuada', 'tarnhelm', 'tefillin', 'thurible',
    'tooth-relic', 'totsuka-no-tsurugi', 'true-cross', 'tyet', 'tyrfing',
    'urim-and-thummim', 'vijaya', 'zeus-lightning', 'zulfiqar'
]

def extract_tradition_tags(soup):
    """Extract tradition/mythology tags from HTML."""
    traditions = []
    tag_elements = soup.find_all('span', class_='tradition-tag')
    for tag in tag_elements:
        text = tag.get_text(strip=True)
        traditions.append(text.lower())
    return traditions

def extract_text_content(soup, selector):
    """Extract text content from HTML element."""
    element = soup.select_one(selector)
    if element:
        # Get text and clean up whitespace
        text = element.get_text(strip=True, separator=' ')
        text = re.sub(r'\s+', ' ', text)
        return text
    return ""

def extract_info_grid(soup):
    """Extract key-value pairs from info-grid."""
    info = {}
    grid = soup.find('div', class_='info-grid')
    if grid:
        items = grid.find_all('div', class_='info-item')
        for item in items:
            label_elem = item.find('div', class_='info-label')
            value_elem = item.find('div', class_='info-value')
            if label_elem and value_elem:
                label = label_elem.get_text(strip=True)
                value = value_elem.get_text(strip=True)
                info[label] = value
    return info

def extract_description(soup):
    """Extract main description from various sections."""
    descriptions = []

    # Try hero subtitle
    subtitle = soup.find('p', class_='hero-subtitle')
    if subtitle:
        descriptions.append(subtitle.get_text(strip=True))

    # Try content-text paragraphs
    content_sections = soup.find_all('div', class_='content-text')
    for section in content_sections:
        paragraphs = section.find_all('p')
        for p in paragraphs[:2]:  # First 2 paragraphs
            text = p.get_text(strip=True)
            if len(text) > 50:  # Meaningful paragraph
                descriptions.append(text)
                break
        if descriptions:
            break

    # Try description section
    if not descriptions:
        desc_section = soup.find('section', class_='description')
        if desc_section:
            paragraphs = desc_section.find_all('p')
            for p in paragraphs[:1]:
                descriptions.append(p.get_text(strip=True))

    return ' '.join(descriptions[:2])  # Max 2 paragraphs

def map_tradition_to_mythology(tradition):
    """Map tradition tags to mythology identifiers."""
    mapping = {
        'norse': 'norse',
        'germanic': 'norse',
        'viking': 'norse',
        'greek': 'greek',
        'roman': 'greek',
        'hindu': 'hindu',
        'buddhist': 'buddhist',
        'tibetan': 'buddhist',
        'tibetan buddhist': 'buddhist',
        'jewish': 'jewish',
        'hebrew': 'jewish',
        'christian': 'christian',
        'catholic': 'christian',
        'celtic': 'celtic',
        'irish': 'celtic',
        'scottish': 'celtic',
        'welsh': 'celtic',
        'arthurian': 'celtic',
        'egyptian': 'egyptian',
        'japanese': 'shinto',
        'shinto': 'shinto',
        'chinese': 'chinese',
        'taoist': 'chinese',
        'confucian': 'chinese',
        'islamic': 'islamic',
        'muslim': 'islamic',
        'persian': 'persian',
        'zoroastrian': 'persian',
        'sumerian': 'mesopotamian',
        'babylonian': 'mesopotamian',
        'mesopotamian': 'mesopotamian',
        'finnish': 'finnish',
        'slavic': 'slavic'
    }

    tradition_lower = tradition.lower().strip()
    return mapping.get(tradition_lower, tradition_lower)

def determine_category(html_path, item_name):
    """Determine item category from file path and content."""
    path_str = str(html_path).lower()

    if 'relics' in path_str:
        return 'relic', 'sacred-object'
    elif 'weapons' in path_str:
        return 'weapon', 'divine-weapon'
    elif 'ritual' in path_str:
        return 'ritual-object', 'ceremonial'

    # Fallback to item name analysis
    weapon_keywords = ['sword', 'spear', 'bow', 'hammer', 'axe', 'blade', 'scythe']
    ritual_keywords = ['bell', 'bowl', 'wheel', 'shofar', 'rosary', 'thurible']

    for keyword in weapon_keywords:
        if keyword in item_name.lower():
            return 'weapon', 'divine-weapon'

    for keyword in ritual_keywords:
        if keyword in item_name.lower():
            return 'ritual-object', 'ceremonial'

    return 'artifact', 'sacred-object'

def create_entity_json(item_id, html_path):
    """Create entity JSON from HTML file."""

    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract basic info
    title_elem = soup.find('h1') or soup.find('h2', class_='hero-title')
    name = title_elem.get_text(strip=True) if title_elem else item_id.replace('-', ' ').title()

    traditions = extract_tradition_tags(soup)
    mythologies = list(set([map_tradition_to_mythology(t) for t in traditions]))

    # Get description
    subtitle = soup.find('p', class_='hero-subtitle')
    short_desc = subtitle.get_text(strip=True) if subtitle else ""

    full_desc = extract_description(soup)

    # Get category
    category, sub_category = determine_category(html_path, name)

    # Extract properties
    info_grid = extract_info_grid(soup)

    # Build entity
    entity = {
        "id": item_id,
        "type": "item",
        "name": name,
        "icon": "⚔️",  # Default icon
        "slug": item_id,
        "mythologies": mythologies if mythologies else ["unknown"],
        "primaryMythology": mythologies[0] if mythologies else "unknown",
        "shortDescription": short_desc if short_desc else name,
        "fullDescription": full_desc if full_desc else short_desc,
        "category": category,
        "subCategory": sub_category,
        "tags": traditions + [category, item_id],
        "properties": []
    }

    # Add properties from info grid
    for label, value in info_grid.items():
        entity["properties"].append({
            "name": label,
            "value": value
        })

    return entity

def migrate_items():
    """Main migration function."""
    base_dir = Path("h:/Github/EyesOfAzrael")
    spiritual_items_dir = base_dir / "spiritual-items"
    output_dir = base_dir / "data" / "entities" / "item"

    output_dir.mkdir(parents=True, exist_ok=True)

    migrated = []
    not_found = []
    errors = []

    for item_id in ITEMS_TO_MIGRATE:
        # Find HTML file
        html_file = None
        for subdir in ['relics', 'ritual', 'weapons']:
            potential_path = spiritual_items_dir / subdir / f"{item_id}.html"
            if potential_path.exists():
                html_file = potential_path
                break

        if not html_file:
            not_found.append(item_id)
            continue

        try:
            entity = create_entity_json(item_id, html_file)

            # Write JSON file
            output_path = output_dir / f"{item_id}.json"
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=2, ensure_ascii=False)

            migrated.append(item_id)
            print(f"[OK] Migrated: {item_id}")

        except Exception as e:
            errors.append((item_id, str(e)))
            print(f"[ERROR] Error migrating {item_id}: {e}")

    # Report
    print(f"\n=== Migration Complete ===")
    print(f"Successfully migrated: {len(migrated)}")
    print(f"Not found: {len(not_found)}")
    print(f"Errors: {len(errors)}")

    if not_found:
        print(f"\nNot found: {', '.join(not_found)}")

    if errors:
        print(f"\nErrors:")
        for item_id, error in errors:
            print(f"  {item_id}: {error}")

    return {
        'migrated': migrated,
        'not_found': not_found,
        'errors': errors
    }

if __name__ == "__main__":
    result = migrate_items()

#!/usr/bin/env python3
"""
PHASE 2.2: EXTRACT NORSE MYTHOLOGY ENTITIES

Extracts all Norse mythology entities from HTML to structured JSON format.
Special attention to:
- Rune associations (symbols field)
- Ragnarok prophecies (mythology section)
- Kennings/poetic names (epithets)
- Old Norse names (linguistic.originalName)
- Pronunciation guides (linguistic.pronunciation)
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
from collections import defaultdict

# Define project paths
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")
NORSE_DIR = PROJECT_ROOT / "mythos" / "norse"
OUTPUT_DIR = PROJECT_ROOT / "data" / "extracted" / "norse"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(text):
    """Clean and normalize text content"""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


def extract_old_norse_name(soup, entity_name):
    """Extract Old Norse name - look for patterns like (Óðinn), (Þórr), etc."""
    old_norse_names = []

    # Look in the deity header
    header = soup.find('section', class_='deity-header')
    if header:
        # Find h2 with Old Norse name in parentheses
        h2 = header.find('h2')
        if h2:
            text = h2.get_text()
            # Match patterns like (Óðinn) or (Þórr)
            matches = re.findall(r'\(([^)]+)\)', text)
            for match in matches:
                # Filter out English translations
                if any(c in match for c in ['ð', 'þ', 'ö', 'á', 'é', 'í', 'ó', 'ú', 'ý', 'æ', 'ø']):
                    old_norse_names.append(match)

    # Also check corpus links with data-term attribute
    corpus_links = soup.find_all('a', class_='corpus-link', attrs={'data-term': True})
    for link in corpus_links:
        term = link.get('data-term', '')
        if any(c in term for c in ['ð', 'þ', 'ö', 'á', 'é', 'í', 'ó', 'ú', 'ý', 'æ', 'ø']):
            if term not in old_norse_names:
                old_norse_names.append(term)

    return old_norse_names[0] if old_norse_names else None


def extract_titles_epithets(soup):
    """Extract titles, epithets, and kennings"""
    titles = []
    epithets = []

    # Look for Titles attribute card
    attr_cards = soup.find_all('div', class_='attribute-card')
    for card in attr_cards:
        label = card.find('div', class_='attribute-label')
        if label and 'title' in label.get_text().lower():
            value = card.find('div', class_='attribute-value')
            if value:
                text = value.get_text()
                # Split by commas
                parts = [clean_text(p) for p in text.split(',')]
                titles.extend(parts)

    # Look in subtitle for epithets
    subtitle = soup.find('p', class_='subtitle')
    if subtitle:
        text = subtitle.get_text()
        # Remove "God of", "The", etc.
        text = re.sub(r'^(The|God of|Goddess of)\s+', '', text, flags=re.IGNORECASE)
        if text:
            epithets.append(clean_text(text))

    return list(set(titles)), list(set(epithets))


def extract_domains(soup):
    """Extract domains/spheres of influence"""
    domains = []

    # Look for Domains attribute card
    attr_cards = soup.find_all('div', class_='attribute-card')
    for card in attr_cards:
        label = card.find('div', class_='attribute-label')
        if label and 'domain' in label.get_text().lower():
            value = card.find('div', class_='attribute-value')
            if value:
                text = value.get_text()
                # Split by commas
                domains = [clean_text(d) for d in text.split(',')]
                break

    return domains


def extract_symbols(soup):
    """Extract symbols and rune associations"""
    symbols = []
    runes = []

    # Look for Symbols attribute card
    attr_cards = soup.find_all('div', class_='attribute-card')
    for card in attr_cards:
        label = card.find('div', class_='attribute-label')
        if label and 'symbol' in label.get_text().lower():
            value = card.find('div', class_='attribute-value')
            if value:
                text = value.get_text()
                # Split by commas
                symbols = [clean_text(s) for s in text.split(',')]
                break

    # Look for rune symbols in text (ᚱ, ᚦ, ᚠ, etc.)
    all_text = soup.get_text()
    rune_matches = re.findall(r'[ᚠ-ᛪ]+', all_text)
    if rune_matches:
        runes = list(set(rune_matches))

    return symbols, runes


def extract_sacred_items(soup):
    """Extract sacred animals, plants, colors"""
    animals = []
    plants = []
    colors = []

    attr_cards = soup.find_all('div', class_='attribute-card')
    for card in attr_cards:
        label = card.find('div', class_='attribute-label')
        if not label:
            continue

        label_text = label.get_text().lower()
        value = card.find('div', class_='attribute-value')
        if not value:
            continue

        text = value.get_text()
        items = [clean_text(item) for item in text.split(',')]

        if 'animal' in label_text:
            animals = items
        elif 'plant' in label_text:
            plants = items
        elif 'color' in label_text:
            colors = items

    return animals, plants, colors


def extract_mythology_stories(soup):
    """Extract mythology and key stories, including Ragnarok prophecies"""
    mythology = {}

    # Find the Mythology section
    sections = soup.find_all('section')
    for section in sections:
        h2 = section.find('h2')
        if h2 and 'mythology' in h2.get_text().lower():
            # Extract overview paragraph
            overview_p = section.find('p')
            if overview_p:
                mythology['overview'] = clean_text(overview_p.get_text())

            # Extract key myths
            key_myths = []
            h3 = section.find('h3')
            if h3 and 'key' in h3.get_text().lower():
                ul = section.find('ul')
                if ul:
                    for li in ul.find_all('li', recursive=False):
                        # Extract title and description
                        strong = li.find('strong')
                        if strong:
                            title = clean_text(strong.get_text().replace(':', ''))
                            # Get text after the strong tag
                            desc = clean_text(li.get_text().replace(strong.get_text(), ''))
                            key_myths.append({
                                'title': title,
                                'description': desc
                            })

            if key_myths:
                mythology['keyMyths'] = key_myths

            # Look for sources citation
            citation = section.find('div', class_='citation')
            if citation:
                sources_text = citation.get_text()
                sources_match = re.search(r'Sources?:\s*(.+)', sources_text)
                if sources_match:
                    sources = [clean_text(s) for s in sources_match.group(1).split(',')]
                    mythology['sources'] = sources

            break

    # Look for Ragnarok section (special for Norse)
    for section in sections:
        h2 = section.find('h2')
        if h2 and 'ragnarok' in h2.get_text().lower():
            ragnarok_text = []
            for p in section.find_all('p'):
                ragnarok_text.append(clean_text(p.get_text()))
            if ragnarok_text:
                mythology['ragnarokProphecy'] = ' '.join(ragnarok_text)
            break

    return mythology


def extract_relationships(soup):
    """Extract family and relationship information"""
    relationships = {}

    # Find Relationships section
    sections = soup.find_all('section')
    for section in sections:
        h2 = section.find('h2')
        if h2 and 'relationship' in h2.get_text().lower():
            # Look for Family h3
            family_h3 = section.find('h3', string=re.compile('Family', re.IGNORECASE))
            if family_h3:
                ul = family_h3.find_next('ul')
                if ul:
                    for li in ul.find_all('li'):
                        text = li.get_text()
                        # Parse "Parents:", "Consort(s):", etc.
                        match = re.match(r'([^:]+):\s*(.+)', text)
                        if match:
                            rel_type = match.group(1).strip().lower()
                            rel_value = clean_text(match.group(2))
                            relationships[rel_type] = rel_value

            # Look for Allies & Enemies
            allies_h3 = section.find('h3', string=re.compile('Allies|Enemies', re.IGNORECASE))
            if allies_h3:
                ul = allies_h3.find_next('ul')
                if ul:
                    for li in ul.find_all('li'):
                        text = li.get_text()
                        match = re.match(r'([^:]+):\s*(.+)', text)
                        if match:
                            rel_type = match.group(1).strip().lower()
                            rel_value = clean_text(match.group(2))
                            relationships[rel_type] = rel_value

            break

    return relationships


def extract_worship_practices(soup):
    """Extract worship and ritual information"""
    worship = {}

    sections = soup.find_all('section')
    for section in sections:
        h2 = section.find('h2')
        if h2 and 'worship' in h2.get_text().lower():
            # Sacred Sites
            sacred_h3 = section.find('h3', string=re.compile('Sacred Sites', re.IGNORECASE))
            if sacred_h3:
                p = sacred_h3.find_next('p')
                if p:
                    worship['sacredSites'] = clean_text(p.get_text())

            # Festivals
            fest_h3 = section.find('h3', string=re.compile('Festivals', re.IGNORECASE))
            if fest_h3:
                festivals = []
                ul = fest_h3.find_next('ul')
                if ul:
                    for li in ul.find_all('li'):
                        strong = li.find('strong')
                        if strong:
                            name = clean_text(strong.get_text().replace(':', ''))
                            desc = clean_text(li.get_text().replace(strong.get_text(), ''))
                            festivals.append({'name': name, 'description': desc})
                if festivals:
                    worship['festivals'] = festivals

            # Offerings
            offer_h3 = section.find('h3', string=re.compile('Offerings', re.IGNORECASE))
            if offer_h3:
                p = offer_h3.find_next('p')
                if p:
                    worship['offerings'] = clean_text(p.get_text())

            # Prayers & Invocations
            prayer_h3 = section.find('h3', string=re.compile('Prayer|Invocation', re.IGNORECASE))
            if prayer_h3:
                p = prayer_h3.find_next('p')
                if p:
                    worship['prayers'] = clean_text(p.get_text())

            break

    return worship


def extract_cross_cultural_parallels(soup):
    """Extract cross-cultural deity parallels"""
    parallels = []

    # Look for parallel traditions section
    parallel_div = soup.find('div', class_='parallel-traditions')
    if parallel_div:
        parallel_cards = parallel_div.find_all('a', class_='parallel-card')
        for card in parallel_cards:
            name_span = card.find('span', class_='parallel-name')
            label_span = card.find('span', class_='tradition-label')
            if name_span and label_span:
                parallels.append({
                    'name': clean_text(name_span.get_text()),
                    'tradition': clean_text(label_span.get_text())
                })

    return parallels


def determine_entity_type(file_path):
    """Determine entity type from file path"""
    path_str = str(file_path).lower()

    type_mapping = {
        'deities': 'deity',
        'heroes': 'hero',
        'creatures': 'creature',
        'beings': 'being',
        'places': 'place',
        'realms': 'realm',
        'cosmology': 'cosmological-concept',
        'concepts': 'concept',
        'events': 'event',
        'symbols': 'symbol',
        'rituals': 'ritual',
        'texts': 'text',
        'herbs': 'herb',
        'magic': 'magic'
    }

    for key, value in type_mapping.items():
        if f'/{key}/' in path_str or f'\\{key}\\' in path_str:
            return value

    return 'other'


def extract_entity(file_path):
    """Extract complete entity data from HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        soup = BeautifulSoup(content, 'html.parser')

        # Extract entity name
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text()
            # Remove "Norse - " prefix
            entity_name = re.sub(r'^Norse\s*-\s*', '', title, flags=re.IGNORECASE).strip()
        else:
            entity_name = file_path.stem.replace('-', ' ').replace('_', ' ').title()

        # Determine entity type
        entity_type = determine_entity_type(file_path)

        # Build the entity object
        entity = {
            'id': file_path.stem,
            'name': entity_name,
            'type': entity_type,
            'tradition': 'norse',
            'extractedFrom': str(file_path.relative_to(PROJECT_ROOT)).replace('\\', '/'),
            'extractedAt': datetime.now().isoformat()
        }

        # Extract Old Norse linguistic data
        old_norse_name = extract_old_norse_name(soup, entity_name)
        if old_norse_name:
            entity['linguistic'] = {
                'originalName': old_norse_name,
                'language': 'Old Norse'
            }

        # Extract titles and epithets (kennings)
        titles, epithets = extract_titles_epithets(soup)
        if titles:
            entity['titles'] = titles
        if epithets:
            entity['epithets'] = epithets

        # Extract domains
        domains = extract_domains(soup)
        if domains:
            entity['domains'] = domains

        # Extract symbols and runes
        symbols, runes = extract_symbols(soup)
        if symbols:
            entity['symbols'] = symbols
        if runes:
            entity['runes'] = runes  # Special Norse field

        # Extract sacred associations
        animals, plants, colors = extract_sacred_items(soup)
        if animals or plants or colors:
            entity['sacred'] = {}
            if animals:
                entity['sacred']['animals'] = animals
            if plants:
                entity['sacred']['plants'] = plants
            if colors:
                entity['sacred']['colors'] = colors

        # Extract mythology (including Ragnarok prophecies)
        mythology = extract_mythology_stories(soup)
        if mythology:
            entity['mythology'] = mythology

        # Extract relationships
        relationships = extract_relationships(soup)
        if relationships:
            entity['relationships'] = relationships

        # Extract worship practices
        worship = extract_worship_practices(soup)
        if worship:
            entity['worship'] = worship

        # Extract cross-cultural parallels
        parallels = extract_cross_cultural_parallels(soup)
        if parallels:
            entity['crossCulturalParallels'] = parallels

        return entity

    except Exception as e:
        print(f"Error extracting {file_path}: {e}")
        return None


def calculate_completeness_score(entity):
    """Calculate completeness score for an entity (0-100)"""
    score = 0
    max_score = 0

    # Core fields (10 points each)
    core_fields = ['name', 'type', 'tradition']
    for field in core_fields:
        max_score += 10
        if field in entity and entity[field]:
            score += 10

    # Important fields (8 points each)
    important_fields = ['linguistic', 'titles', 'domains', 'symbols', 'mythology']
    for field in important_fields:
        max_score += 8
        if field in entity and entity[field]:
            if isinstance(entity[field], (list, dict)):
                if len(entity[field]) > 0:
                    score += 8
            else:
                score += 8

    # Optional fields (5 points each)
    optional_fields = ['epithets', 'runes', 'sacred', 'relationships', 'worship', 'crossCulturalParallels']
    for field in optional_fields:
        max_score += 5
        if field in entity and entity[field]:
            if isinstance(entity[field], (list, dict)):
                if len(entity[field]) > 0:
                    score += 5
            else:
                score += 5

    # Calculate percentage
    percentage = round((score / max_score) * 100) if max_score > 0 else 0
    return percentage


def main():
    """Main extraction process - PHASE 2.2"""
    print("=" * 80)
    print("PHASE 2.2: EXTRACT NORSE MYTHOLOGY ENTITIES")
    print("Converting HTML to JSON with special Norse features")
    print("=" * 80)
    print()

    # Find all HTML files in Norse directory (exclude index.html)
    print("Step 1: Scanning Norse mythology directory...")
    all_files = list(NORSE_DIR.glob("**/*.html"))
    html_files = [f for f in all_files if f.name != 'index.html' and 'corpus-search' not in f.name]
    print(f"Found {len(html_files)} entity files to process")
    print()

    # Extract each entity
    print("Step 2: Extracting entity data...")
    extracted_entities = []
    failed_files = []

    for i, file_path in enumerate(html_files, 1):
        if i % 10 == 0:
            print(f"  Processed {i}/{len(html_files)} files...")

        entity = extract_entity(file_path)
        if entity:
            extracted_entities.append(entity)

            # Save individual JSON file
            output_file = OUTPUT_DIR / f"{entity['id']}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=2, ensure_ascii=False)
        else:
            failed_files.append(str(file_path.relative_to(PROJECT_ROOT)))

    print(f"Successfully extracted {len(extracted_entities)} entities")
    print()

    # Generate statistics
    print("Step 3: Calculating completeness scores...")

    stats = {
        'totalFiles': len(html_files),
        'successfulExtractions': len(extracted_entities),
        'failedExtractions': len(failed_files),
        'successRate': round((len(extracted_entities) / len(html_files) * 100), 2) if html_files else 0,
        'byType': defaultdict(int),
        'completenessScores': [],
        'averageCompleteness': 0,
        'specialFeatures': {
            'withOldNorseName': 0,
            'withRunes': 0,
            'withRagnarokProphecy': 0,
            'withKennings': 0,
            'withCrossParallels': 0
        }
    }

    completeness_scores = []

    for entity in extracted_entities:
        # Count by type
        stats['byType'][entity['type']] += 1

        # Calculate completeness
        score = calculate_completeness_score(entity)
        completeness_scores.append(score)
        stats['completenessScores'].append({
            'name': entity['name'],
            'score': score
        })

        # Special Norse features
        if 'linguistic' in entity and 'originalName' in entity['linguistic']:
            stats['specialFeatures']['withOldNorseName'] += 1
        if 'runes' in entity and entity['runes']:
            stats['specialFeatures']['withRunes'] += 1
        if 'mythology' in entity and 'ragnarokProphecy' in entity['mythology']:
            stats['specialFeatures']['withRagnarokProphecy'] += 1
        if 'epithets' in entity and entity['epithets']:
            stats['specialFeatures']['withKennings'] += 1
        if 'crossCulturalParallels' in entity and entity['crossCulturalParallels']:
            stats['specialFeatures']['withCrossParallels'] += 1

    stats['averageCompleteness'] = round(sum(completeness_scores) / len(completeness_scores), 2) if completeness_scores else 0

    # Sort completeness scores
    stats['completenessScores'].sort(key=lambda x: x['score'], reverse=True)

    # Save summary JSON
    summary_file = OUTPUT_DIR / "_extraction_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    # Save index of all entities
    index_file = OUTPUT_DIR / "_entity_index.json"
    entity_index = {
        'tradition': 'norse',
        'extractedAt': datetime.now().isoformat(),
        'totalEntities': len(extracted_entities),
        'entities': [
            {
                'id': e['id'],
                'name': e['name'],
                'type': e['type'],
                'file': f"{e['id']}.json"
            }
            for e in sorted(extracted_entities, key=lambda x: x['name'])
        ]
    }

    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(entity_index, f, indent=2, ensure_ascii=False)

    # Print detailed summary
    print()
    print("=" * 80)
    print("PHASE 2.2 EXTRACTION COMPLETE")
    print("=" * 80)
    print()
    print(f"Total Files Processed: {stats['totalFiles']}")
    print(f"Successful Extractions: {stats['successfulExtractions']}")
    print(f"Failed Extractions: {stats['failedExtractions']}")
    print(f"Success Rate: {stats['successRate']}%")
    print()

    print("EXTRACTION BY TYPE:")
    print("-" * 50)
    for entity_type in sorted(stats['byType'].keys()):
        count = stats['byType'][entity_type]
        print(f"  {entity_type:25} {count:3} entities")
    print()

    print("COMPLETENESS ANALYSIS:")
    print("-" * 50)
    print(f"  Average Completeness: {stats['averageCompleteness']}%")
    print()
    print("  Top 10 Most Complete:")
    for item in stats['completenessScores'][:10]:
        print(f"    {item['name']:30} {item['score']:3}%")
    print()
    print("  Bottom 5 Least Complete:")
    for item in stats['completenessScores'][-5:]:
        print(f"    {item['name']:30} {item['score']:3}%")
    print()

    print("SPECIAL NORSE FEATURES:")
    print("-" * 50)
    print(f"  Entities with Old Norse names: {stats['specialFeatures']['withOldNorseName']}")
    print(f"  Entities with rune associations: {stats['specialFeatures']['withRunes']}")
    print(f"  Entities with Ragnarok prophecies: {stats['specialFeatures']['withRagnarokProphecy']}")
    print(f"  Entities with kennings/epithets: {stats['specialFeatures']['withKennings']}")
    print(f"  Entities with cross-cultural parallels: {stats['specialFeatures']['withCrossParallels']}")
    print()

    if failed_files:
        print("FAILED EXTRACTIONS:")
        print("-" * 50)
        for failed in failed_files:
            print(f"  - {failed}")
        print()

    print("=" * 80)
    print()
    print("OUTPUT LOCATION:")
    print(f"  {OUTPUT_DIR}")
    print()
    print("FILES CREATED:")
    print(f"  - {len(extracted_entities)} individual entity JSON files")
    print(f"  - _entity_index.json (master index)")
    print(f"  - _extraction_summary.json (statistics)")
    print()
    print("=" * 80)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
PHASE 2.5: EXTRACT BUDDHIST MYTHOLOGY
Specialized extraction for Buddhist HTML content to JSON format.
Preserves Pali/Sanskrit terms, diacritics, Bodhisattva attributes, Dharma concepts,
meditation practices, and Sutra references.
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
from collections import defaultdict

# Define paths
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")
BUDDHIST_DIR = PROJECT_ROOT / "mythos" / "buddhist"
OUTPUT_DIR = PROJECT_ROOT / "data" / "extracted" / "buddhist"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def extract_pali_sanskrit_terms(soup, content):
    """Extract Pali/Sanskrit terms with diacritics"""
    terms = []

    # Look for text in parentheses with diacritics or special characters
    patterns = [
        r'\(([^\)]*[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+[^\)]*)\)',  # Devanagari diacritics
        r'\(Sanskrit:\s*([^\)]+)\)',
        r'\(Pali:\s*([^\)]+)\)',
        r'\(Tibetan:\s*([^\)]+)\)',
        r'\(Chinese:\s*([^\)]+)\)',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        terms.extend(matches)

    # Look for specific attribute sections with names
    for label in soup.find_all(class_='attribute-label'):
        if 'Sanskrit' in label.get_text() or 'Tibetan' in label.get_text() or 'Pali' in label.get_text():
            value_div = label.find_next_sibling(class_='attribute-value')
            if value_div:
                terms.append(value_div.get_text().strip())

    return list(set(terms))  # Remove duplicates


def extract_mantras(soup, content):
    """Extract sacred mantras"""
    mantras = []

    # Look for mantra sections
    for elem in soup.find_all(['p', 'div', 'li']):
        text = elem.get_text()
        if 'mantra' in text.lower() or 'Om' in text or 'Hum' in text:
            # Extract mantra patterns
            mantra_patterns = [
                r'(Om\s+[^.!?\n]+)',
                r'(ॐ[^.!?\n]+)',
                r'(ཨོཾ[^.!?\n]+)',
            ]
            for pattern in mantra_patterns:
                matches = re.findall(pattern, text)
                mantras.extend(matches)

    # Check attribute cards for mantra
    for label in soup.find_all(class_='attribute-label'):
        if 'mantra' in label.get_text().lower():
            value_div = label.find_next_sibling(class_='attribute-value')
            if value_div:
                mantras.append(value_div.get_text().strip())

    return list(set(mantras))


def extract_sutra_references(soup):
    """Extract Sutra references from codex search sections"""
    sutras = []

    # Find all citation divs
    for citation in soup.find_all(class_='citation'):
        citation_text = citation.get_text().strip()
        if citation_text:
            sutras.append({
                'reference': citation_text,
                'text': None
            })

            # Get the verse text if available
            verse_div = citation.find_next_sibling(class_='verse-text')
            if verse_div:
                sutras[-1]['text'] = verse_div.get_text().strip()

    # Also look for sutra names in headers
    for h4 in soup.find_all('h4'):
        text = h4.get_text().strip()
        if 'sutra' in text.lower() or 'dharani' in text.lower():
            if not any(s['reference'] == text for s in sutras):
                sutras.append({
                    'reference': text,
                    'text': None
                })

    return sutras


def extract_bodhisattva_attributes(soup):
    """Extract Bodhisattva-specific attributes"""
    attributes = {}

    # Extract from attribute cards
    for card in soup.find_all(class_='attribute-card'):
        label_elem = card.find(class_='attribute-label')
        value_elem = card.find(class_='attribute-value')

        if label_elem and value_elem:
            label = label_elem.get_text().strip()
            value = value_elem.get_text().strip()
            attributes[label] = value

    return attributes


def extract_dharma_concepts(soup, content):
    """Extract key Dharma concepts mentioned"""
    concepts = []

    # Key Buddhist terms to look for
    dharma_terms = [
        'bodhisattva', 'nirvana', 'samsara', 'karma', 'dharma', 'sangha',
        'buddha', 'enlightenment', 'compassion', 'karuna', 'metta', 'mudita',
        'upekkha', 'prajna', 'upaya', 'sunyata', 'emptiness', 'dependent origination',
        'four noble truths', 'eightfold path', 'six perfections', 'paramita',
        'skandhas', 'klesha', 'meditation', 'samadhi', 'vipassana', 'shamatha',
        'bodhi', 'bodhicitta', 'tathagata', 'arhat', 'pratyekabuddha',
        'mahayana', 'theravada', 'vajrayana', 'tantra', 'mandala'
    ]

    text_lower = content.lower()
    for term in dharma_terms:
        if term in text_lower:
            # Find context around the term
            pattern = r'([^.!?]*' + re.escape(term) + r'[^.!?]*[.!?])'
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                concepts.append({
                    'term': term,
                    'mentions': len(matches),
                    'context': matches[0][:200] if matches else None
                })

    return concepts


def extract_meditation_practices(soup):
    """Extract meditation practices mentioned"""
    practices = []

    # Look for practice sections
    for elem in soup.find_all(['h3', 'h4', 'li', 'p']):
        text = elem.get_text()
        practice_keywords = ['meditation', 'sadhana', 'practice', 'visualization', 'contemplation', 'retreat']

        if any(keyword in text.lower() for keyword in practice_keywords):
            # Check if it's a practice description
            if elem.name in ['h3', 'h4']:
                # Get the following content
                next_elem = elem.find_next(['p', 'ul'])
                if next_elem:
                    practices.append({
                        'name': text.strip(),
                        'description': next_elem.get_text().strip()[:500]
                    })
            elif elem.name == 'li':
                practices.append({
                    'name': text.strip()[:100],
                    'description': text.strip()
                })

    return practices


def extract_related_figures(soup):
    """Extract related figures and deities"""
    figures = []

    # Look in related figures section
    related_section = soup.find('h2', string=re.compile(r'Related.*Figures', re.IGNORECASE))
    if related_section:
        # Find the attribute grid after this section
        grid = related_section.find_next(class_='attribute-grid')
        if grid:
            for card in grid.find_all(class_='attribute-card'):
                label_elem = card.find(class_='attribute-label')
                value_elem = card.find(class_='attribute-value')

                if label_elem and value_elem:
                    relationship = label_elem.get_text().strip()
                    names = value_elem.get_text().strip()
                    figures.append({
                        'relationship': relationship,
                        'names': names
                    })

    return figures


def extract_symbols(soup):
    """Extract symbols and their meanings"""
    symbols = []

    # Look for symbols in attribute cards
    for card in soup.find_all(class_='attribute-card'):
        label_elem = card.find(class_='attribute-label')
        if label_elem and 'symbol' in label_elem.get_text().lower():
            value_elem = card.find(class_='attribute-value')
            if value_elem:
                symbols.append(value_elem.get_text().strip())

    return symbols


def extract_entity_metadata(soup, file_path):
    """Extract basic entity metadata"""
    metadata = {}

    # Entity name from title or h1
    title = soup.find('title')
    if title:
        text = title.get_text().strip()
        text = re.sub(r'\s*-\s*Buddhist Mythology.*$', '', text, flags=re.IGNORECASE)
        metadata['name'] = text.strip('"')

    h1 = soup.find('h1')
    if h1:
        metadata['display_name'] = h1.get_text().strip()

    # Entity type from path
    parts = file_path.parts
    for part in parts:
        if part in ['deities', 'heroes', 'creatures', 'cosmology', 'concepts', 'herbs', 'rituals', 'texts']:
            metadata['type'] = part.rstrip('s')  # singular form
            break

    # Subtitle
    subtitle = soup.find(class_='subtitle')
    if subtitle:
        metadata['subtitle'] = subtitle.get_text().strip()

    return metadata


def extract_main_content(soup):
    """Extract main content sections"""
    sections = []

    main = soup.find('main')
    if not main:
        return sections

    current_section = None

    for elem in main.find_all(['h2', 'h3', 'p', 'ul', 'ol', 'div']):
        # Skip certain sections
        if elem.has_attr('class'):
            classes = elem.get('class', [])
            if any(c in classes for c in ['codex-search-section', 'breadcrumb', 'interlink-panel']):
                continue

        if elem.name == 'h2':
            # New major section
            if current_section:
                sections.append(current_section)
            current_section = {
                'title': elem.get_text().strip(),
                'level': 2,
                'content': []
            }
        elif elem.name == 'h3' and current_section:
            # Subsection
            current_section['content'].append({
                'subtitle': elem.get_text().strip(),
                'level': 3,
                'text': []
            })
        elif current_section:
            # Content
            text = elem.get_text().strip()
            if text and len(text) > 20:  # Filter out very short content
                if current_section['content'] and isinstance(current_section['content'][-1], dict):
                    current_section['content'][-1]['text'].append(text)
                else:
                    current_section['content'].append(text)

    if current_section:
        sections.append(current_section)

    return sections


def extract_links(soup):
    """Extract internal links"""
    links = []

    for link in soup.find_all('a', href=True, class_='inline-search-link'):
        href = link.get('href')
        text = link.get_text().strip()
        if href and text:
            links.append({
                'text': text,
                'href': href
            })

    return links


def extract_buddhist_file(file_path):
    """Extract all data from a Buddhist mythology HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        soup = BeautifulSoup(content, 'html.parser')

        # Get relative path for reference
        rel_path = file_path.relative_to(BUDDHIST_DIR)

        print(f"  Extracting: {rel_path}")

        # Build the complete data structure
        data = {
            'metadata': {
                'source_file': str(rel_path).replace('\\', '/'),
                'extracted_date': datetime.now().isoformat(),
                'mythology': 'buddhist'
            },
            'entity': extract_entity_metadata(soup, file_path),
            'pali_sanskrit_terms': extract_pali_sanskrit_terms(soup, content),
            'mantras': extract_mantras(soup, content),
            'attributes': extract_bodhisattva_attributes(soup),
            'dharma_concepts': extract_dharma_concepts(soup, content),
            'meditation_practices': extract_meditation_practices(soup),
            'sutra_references': extract_sutra_references(soup),
            'symbols': extract_symbols(soup),
            'related_figures': extract_related_figures(soup),
            'content_sections': extract_main_content(soup),
            'internal_links': extract_links(soup)
        }

        return data

    except Exception as e:
        print(f"  ERROR processing {file_path}: {e}")
        return None


def generate_extraction_summary(extracted_files):
    """Generate summary of extraction process"""
    summary = {
        'total_files': len(extracted_files),
        'extraction_date': datetime.now().isoformat(),
        'by_entity_type': defaultdict(int),
        'total_sutras': 0,
        'total_mantras': 0,
        'total_concepts': 0,
        'total_practices': 0,
        'special_features': {
            'files_with_mantras': 0,
            'files_with_sutras': 0,
            'files_with_practices': 0,
            'files_with_diacritics': 0
        }
    }

    for file_data in extracted_files:
        if not file_data:
            continue

        entity_type = file_data.get('entity', {}).get('type', 'unknown')
        summary['by_entity_type'][entity_type] += 1

        if file_data.get('mantras'):
            summary['total_mantras'] += len(file_data['mantras'])
            summary['special_features']['files_with_mantras'] += 1

        if file_data.get('sutra_references'):
            summary['total_sutras'] += len(file_data['sutra_references'])
            summary['special_features']['files_with_sutras'] += 1

        if file_data.get('meditation_practices'):
            summary['total_practices'] += len(file_data['meditation_practices'])
            summary['special_features']['files_with_practices'] += 1

        if file_data.get('dharma_concepts'):
            summary['total_concepts'] += len(file_data['dharma_concepts'])

        if file_data.get('pali_sanskrit_terms'):
            summary['special_features']['files_with_diacritics'] += 1

    return summary


def main():
    """Main extraction process for Buddhist mythology"""
    print("=" * 80)
    print("PHASE 2.5: EXTRACT BUDDHIST MYTHOLOGY")
    print("Specialized extraction preserving Pali/Sanskrit terms, mantras, and sutras")
    print("=" * 80)
    print()

    # Find all content HTML files (exclude index.html)
    print("Step 1: Scanning Buddhist directory...")
    all_html = list(BUDDHIST_DIR.glob("**/*.html"))
    html_files = [f for f in all_html if f.name != 'index.html' and 'corpus-search' not in f.name]

    print(f"Found {len(html_files)} content files to extract")
    print()

    # Extract each file
    print("Step 2: Extracting content from each file...")
    extracted_data = []

    for file_path in sorted(html_files):
        data = extract_buddhist_file(file_path)
        if data:
            extracted_data.append(data)

            # Save individual JSON file
            entity_name = data['entity'].get('name', file_path.stem)
            # Clean filename
            safe_name = re.sub(r'[^\w\s-]', '', entity_name).strip().replace(' ', '_')
            safe_name = safe_name.lower()[:100]  # Limit length

            json_filename = f"{safe_name}.json"
            json_path = OUTPUT_DIR / json_filename

            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully extracted {len(extracted_data)} files")
    print()

    # Generate summary
    print("Step 3: Generating extraction summary...")
    summary = generate_extraction_summary(extracted_data)

    # Save summary
    summary_path = OUTPUT_DIR / "_extraction_summary.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"Summary saved to: {summary_path}")
    print()

    # Print summary to console
    print("=" * 80)
    print("EXTRACTION SUMMARY")
    print("=" * 80)
    print()
    print(f"Total Files Extracted: {summary['total_files']}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print()
    print("BY ENTITY TYPE:")
    print("-" * 50)
    for etype, count in sorted(summary['by_entity_type'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {etype.title():20} {count:4} files")
    print()
    print("SPECIAL CONTENT:")
    print("-" * 50)
    print(f"  Total Mantras Found:          {summary['total_mantras']}")
    print(f"  Total Sutra References:       {summary['total_sutras']}")
    print(f"  Total Dharma Concepts:        {summary['total_concepts']}")
    print(f"  Total Meditation Practices:   {summary['total_practices']}")
    print()
    print("SPECIAL FEATURES:")
    print("-" * 50)
    print(f"  Files with Mantras:           {summary['special_features']['files_with_mantras']}")
    print(f"  Files with Sutra References:  {summary['special_features']['files_with_sutras']}")
    print(f"  Files with Practices:         {summary['special_features']['files_with_practices']}")
    print(f"  Files with Diacritics:        {summary['special_features']['files_with_diacritics']}")
    print()
    print("=" * 80)
    print()
    print("EXTRACTION COMPLETE!")
    print(f"All JSON files saved to: {OUTPUT_DIR}")
    print("=" * 80)


if __name__ == "__main__":
    main()

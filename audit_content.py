#!/usr/bin/env python3
"""
PHASE 1.1: COMPLETE CONTENT AUDIT
Comprehensive inventory of all HTML content for migration to Firebase.
Catalogs all HTML files in mythos/ directory with complete metadata.
"""

import os
import re
import csv
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
from collections import defaultdict

# Define project root
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")
MYTHOS_DIR = PROJECT_ROOT / "mythos"


def extract_mythology(file_path):
    """Extract mythology from file path"""
    parts = file_path.parts
    try:
        mythos_index = parts.index("mythos")
        if mythos_index + 1 < len(parts):
            mythology = parts[mythos_index + 1]
            if mythology == "index.html":
                return "index"
            return mythology
    except (ValueError, IndexError):
        pass
    return "unknown"


def extract_entity_type(file_path):
    """Extract entity type from file path"""
    parts = file_path.parts

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
        "path": "path"
    }

    for part in parts:
        if part in entity_type_mapping:
            return entity_type_mapping[part]

    file_str = str(file_path).lower()
    for key, value in entity_type_mapping.items():
        if key in file_str:
            return value

    return "other"


def extract_entity_name(soup, file_path):
    """Extract entity name from HTML"""
    # Try title first
    title = soup.find('title')
    if title:
        text = title.get_text().strip()
        # Remove common suffixes
        text = re.sub(r'\s*-\s*Eyes of Azrael.*$', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s*\|\s*.*$', '', text)
        if text:
            return text

    # Try h1
    h1 = soup.find('h1')
    if h1:
        return h1.get_text().strip()

    # Try h2
    h2 = soup.find('h2')
    if h2:
        return h2.get_text().strip()

    # Fall back to filename
    return file_path.stem.replace('-', ' ').replace('_', ' ').title()


def count_words(soup):
    """Count word count from text content only"""
    # Get all text content
    text = soup.get_text()
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Count words
    words = text.split()
    return len(words)


def check_complete_data(soup, content):
    """Check if the page has complete data with key sections"""
    score = 0

    # Check for key sections (h2 or h3 headings)
    headings = soup.find_all(['h2', 'h3'])
    heading_texts = [h.get_text().lower() for h in headings]

    key_sections = ['overview', 'attributes', 'mythology', 'symbols', 'story',
                   'description', 'powers', 'domains', 'history', 'worship']

    for section in key_sections:
        if any(section in h for h in heading_texts):
            score += 1

    # Check for substantial content
    paragraphs = soup.find_all('p')
    word_count = len(' '.join([p.get_text() for p in paragraphs]).split())

    if word_count > 200:
        score += 2
    elif word_count > 100:
        score += 1

    # Check for images
    if soup.find('img'):
        score += 1

    # Check for lists
    if soup.find_all(['ul', 'ol', 'dl']):
        score += 1

    # Scoring: 6+ = complete, 3-5 = partial, <3 = incomplete
    if score >= 6:
        return "complete"
    elif score >= 3:
        return "partial"
    else:
        return "incomplete"


def detect_styling_type(content):
    """Detect CSS styling approach"""
    styles = []

    # Check for :root variables
    if ':root' in content and '{' in content:
        styles.append("root-vars")

    # Check for CSS custom properties usage
    if 'var(--color-primary)' in content or 'var(--' in content:
        styles.append("css-vars")

    # Check for hardcoded colors
    if re.search(r'(color|background):\s*#[0-9a-fA-F]{3,6}', content) or \
       re.search(r'(color|background):\s*rgb', content):
        styles.append("hardcoded")

    # Check for inline styles
    if 'style="' in content:
        styles.append("inline")

    # Check for external stylesheets
    if '<link' in content and 'stylesheet' in content:
        styles.append("external")

    return '|'.join(styles) if styles else "none"


def detect_special_features(soup, content):
    """Detect special features: hieroglyphs, special fonts, etc."""
    features = []

    # Check for hieroglyphs (Egyptian unicode range)
    if any(ord(c) >= 0x13000 and ord(c) <= 0x1342F for c in content):
        features.append("hieroglyphs")
    elif 'hieroglyph' in content.lower():
        features.append("hieroglyphs-ref")

    # Check for custom fonts
    if '@font-face' in content:
        features.append("custom-fonts")

    # Check for special font families
    font_families = re.findall(r'font-family:\s*["\']?([^;"\']+)', content)
    special_fonts = ['Noto', 'Papyrus', 'Cinzel', 'UnifrakturMaguntia', 'IM Fell']
    for font in font_families:
        if any(sf.lower() in font.lower() for sf in special_fonts):
            features.append("special-fonts")
            break

    # Check for interactive elements
    if 'addEventListener' in content or 'onclick=' in content:
        features.append("interactive")

    # Check for canvas
    if '<canvas' in content:
        features.append("canvas")

    # Check for SVG
    if '<svg' in content:
        features.append("svg")

    # Check for animations
    if '@keyframes' in content or 'animation:' in content:
        features.append("animations")

    # Check for special unicode symbols
    if any(ord(c) > 0x2000 and ord(c) < 0x2BFF for c in content):
        features.append("special-symbols")

    return '|'.join(features) if features else "none"


def count_links(soup):
    """Count number of internal links"""
    links = soup.find_all('a', href=True)
    return len(links)


def audit_file(file_path):
    """Audit a single HTML file and extract all required metadata"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        soup = BeautifulSoup(content, 'html.parser')

        # Extract relative path from project root
        rel_path = file_path.relative_to(PROJECT_ROOT)

        # Extract all metadata as per requirements
        entity_name = extract_entity_name(soup, file_path)
        entity_type = extract_entity_type(rel_path)
        mythology = extract_mythology(rel_path)
        file_size = os.path.getsize(file_path)  # bytes
        word_count = count_words(soup)
        completeness = check_complete_data(soup, content)
        styling_type = detect_styling_type(content)
        special_features = detect_special_features(soup, content)
        last_modified = datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d')
        has_images = 'Y' if soup.find('img') else 'N'
        link_count = count_links(soup)

        return {
            'filepath': str(rel_path).replace('\\', '/'),
            'entity_name': entity_name,
            'entity_type': entity_type,
            'mythology': mythology,
            'file_size': file_size,
            'word_count': word_count,
            'complete_data': completeness,
            'styling_type': styling_type,
            'special_features': special_features,
            'last_modified': last_modified,
            'has_images': has_images,
            'link_count': link_count
        }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None


def generate_statistics(data):
    """Generate comprehensive summary statistics"""
    stats = {
        'total_files': len(data),
        'by_mythology': defaultdict(int),
        'by_entity_type': defaultdict(int),
        'by_completeness': defaultdict(int),
        'total_words': 0,
        'avg_word_count': 0,
        'word_count_by_mythology': defaultdict(int),
        'total_size_bytes': 0,
        'avg_file_size': 0,
        'files_with_images': 0,
        'files_with_special_features': 0,
        'total_links': 0,
        'special_features_breakdown': defaultdict(int)
    }

    for row in data:
        stats['by_mythology'][row['mythology']] += 1
        stats['by_entity_type'][row['entity_type']] += 1
        stats['by_completeness'][row['complete_data']] += 1
        stats['total_words'] += row['word_count']
        stats['word_count_by_mythology'][row['mythology']] += row['word_count']
        stats['total_size_bytes'] += row['file_size']
        stats['total_links'] += row['link_count']

        if row['has_images'] == 'Y':
            stats['files_with_images'] += 1

        if row['special_features'] != 'none':
            stats['files_with_special_features'] += 1
            # Count each feature type
            for feature in row['special_features'].split('|'):
                stats['special_features_breakdown'][feature] += 1

    if stats['total_files'] > 0:
        stats['avg_word_count'] = round(stats['total_words'] / stats['total_files'])
        stats['avg_file_size'] = round(stats['total_size_bytes'] / stats['total_files'])

    return stats


def main():
    """Main audit process - PHASE 1.1"""
    print("=" * 80)
    print("PHASE 1.1: COMPLETE CONTENT AUDIT")
    print("Eyes of Azrael - Comprehensive HTML Inventory")
    print("=" * 80)
    print()

    # Find all HTML files
    print("Step 1: Scanning mythos directory for HTML files...")
    all_html_files = list(MYTHOS_DIR.glob("**/*.html"))
    print(f"Found {len(all_html_files)} total HTML files")

    # Exclude index.html files (hub pages)
    html_files = [f for f in all_html_files if f.name != 'index.html']
    excluded = len(all_html_files) - len(html_files)
    print(f"Excluding {excluded} index.html files (hub pages)")
    print(f"Analyzing {len(html_files)} content files")
    print()

    # Audit each file
    print("Step 2: Extracting metadata from each file...")
    audit_data = []
    for i, file_path in enumerate(html_files, 1):
        if i % 50 == 0:
            print(f"  Processed {i}/{len(html_files)} files...")

        result = audit_file(file_path)
        if result:
            audit_data.append(result)

    print(f"Successfully audited {len(audit_data)} files")
    print()

    # Sort by mythology and entity type
    audit_data.sort(key=lambda x: (x['mythology'], x['entity_type'], x['entity_name']))

    # Write CSV
    csv_path = PROJECT_ROOT / "CONTENT_INVENTORY.csv"
    print(f"Step 3: Writing inventory to {csv_path}...")

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['filepath', 'entity_name', 'entity_type', 'mythology',
                     'file_size', 'word_count', 'complete_data', 'styling_type',
                     'special_features', 'last_modified', 'has_images', 'link_count']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(audit_data)

    print(f"Inventory written: {len(audit_data)} entries")
    print()

    # Generate statistics
    print("Step 4: Generating summary statistics...")
    stats = generate_statistics(audit_data)

    # Write summary markdown
    summary_path = PROJECT_ROOT / "CONTENT_AUDIT_SUMMARY.md"
    print(f"Writing summary to {summary_path}...")

    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("# Content Audit Summary\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Audit Phase:** 1.1 - Complete Content Inventory\n\n")

        f.write("## Overview Statistics\n\n")
        f.write(f"- **Total Content Files:** {stats['total_files']:,}\n")
        f.write(f"- **Total Word Count:** {stats['total_words']:,}\n")
        f.write(f"- **Average Word Count:** {stats['avg_word_count']:,} words/file\n")
        f.write(f"- **Total Size:** {stats['total_size_bytes']:,} bytes ({stats['total_size_bytes']/(1024*1024):.2f} MB)\n")
        f.write(f"- **Average File Size:** {stats['avg_file_size']:,} bytes\n")
        f.write(f"- **Files with Images:** {stats['files_with_images']} ({stats['files_with_images']/stats['total_files']*100:.1f}%)\n")
        f.write(f"- **Files with Special Features:** {stats['files_with_special_features']} ({stats['files_with_special_features']/stats['total_files']*100:.1f}%)\n")
        f.write(f"- **Total Internal Links:** {stats['total_links']:,}\n\n")

        f.write("## Breakdown by Mythology\n\n")
        f.write("| Mythology | Files | Total Words | Avg Words |\n")
        f.write("|-----------|-------|-------------|----------|\n")
        for myth in sorted(stats['by_mythology'].keys(), key=lambda x: stats['by_mythology'][x], reverse=True):
            count = stats['by_mythology'][myth]
            total_words = stats['word_count_by_mythology'][myth]
            avg_words = total_words // count if count > 0 else 0
            f.write(f"| {myth.title()} | {count} | {total_words:,} | {avg_words:,} |\n")
        f.write(f"| **TOTAL** | **{stats['total_files']}** | **{stats['total_words']:,}** | **{stats['avg_word_count']:,}** |\n\n")

        f.write("## Breakdown by Entity Type\n\n")
        f.write("| Entity Type | Count | Percentage |\n")
        f.write("|-------------|-------|------------|\n")
        for etype in sorted(stats['by_entity_type'].keys(), key=lambda x: stats['by_entity_type'][x], reverse=True):
            count = stats['by_entity_type'][etype]
            pct = (count / stats['total_files'] * 100) if stats['total_files'] > 0 else 0
            f.write(f"| {etype.title()} | {count} | {pct:.1f}% |\n")
        f.write("\n")

        f.write("## Content Completeness\n\n")
        f.write("| Status | Count | Percentage |\n")
        f.write("|--------|-------|------------|\n")
        for status in ['complete', 'partial', 'incomplete']:
            count = stats['by_completeness'].get(status, 0)
            pct = (count / stats['total_files'] * 100) if stats['total_files'] > 0 else 0
            f.write(f"| {status.title()} | {count} | {pct:.1f}% |\n")
        f.write("\n")

        f.write("## Special Features Breakdown\n\n")
        if stats['special_features_breakdown']:
            f.write("| Feature | Count |\n")
            f.write("|---------|-------|\n")
            for feature in sorted(stats['special_features_breakdown'].keys(),
                                key=lambda x: stats['special_features_breakdown'][x], reverse=True):
                count = stats['special_features_breakdown'][feature]
                f.write(f"| {feature} | {count} |\n")
            f.write("\n")

        f.write("## Files Requiring Special Attention\n\n")

        # Files with special features
        special_files = [item for item in audit_data if item['special_features'] != 'none']
        f.write(f"### Files with Special Features ({len(special_files)})\n\n")
        if special_files:
            f.write("Top files requiring special migration handling:\n\n")
            for item in special_files[:30]:
                f.write(f"- **{item['entity_name']}** ({item['mythology']})\n")
                f.write(f"  - Features: `{item['special_features']}`\n")
                f.write(f"  - Path: `{item['filepath']}`\n")
                f.write(f"  - {item['word_count']} words, {item['complete_data']}\n\n")
            if len(special_files) > 30:
                f.write(f"\n*...and {len(special_files) - 30} more files with special features*\n\n")

        # Incomplete files
        incomplete = [item for item in audit_data if item['complete_data'] == 'incomplete']
        f.write(f"### Files with Incomplete Data ({len(incomplete)})\n\n")
        if incomplete:
            f.write("These files may need data enrichment:\n\n")
            for item in incomplete[:20]:
                f.write(f"- **{item['entity_name']}** ({item['mythology']}) - {item['word_count']} words\n")
            if len(incomplete) > 20:
                f.write(f"\n*...and {len(incomplete) - 20} more incomplete files*\n\n")

        f.write("## Extraction Complexity Assessment\n\n")

        easy = len([i for i in audit_data if i['special_features'] == 'none' and i['complete_data'] == 'complete'])
        medium = len([i for i in audit_data if i['special_features'] != 'none' or i['complete_data'] == 'partial'])
        hard = len([i for i in audit_data if i['complete_data'] == 'incomplete' or
                   ('hieroglyphs' in i['special_features'] or 'custom-fonts' in i['special_features'])])

        f.write("Migration complexity categorization:\n\n")
        f.write(f"- **Easy ({easy} files):** Standard structure, complete data, no special features\n")
        f.write(f"  - Can use automated extraction with minimal manual review\n")
        f.write(f"  - Estimated effort: 5-10 minutes per file\n\n")

        f.write(f"- **Medium ({medium} files):** Special features OR partial data\n")
        f.write(f"  - Requires custom handling for features or data enrichment\n")
        f.write(f"  - Estimated effort: 15-20 minutes per file\n\n")

        f.write(f"- **Hard ({hard} files):** Incomplete data WITH special features\n")
        f.write(f"  - Requires significant manual work and feature migration\n")
        f.write(f"  - Estimated effort: 30-60 minutes per file\n\n")

        f.write("## Next Steps\n\n")
        f.write("1. **Phase 1.2:** Create detailed extraction templates for each entity type\n")
        f.write("2. **Phase 1.3:** Develop handling strategies for special features\n")
        f.write("3. **Phase 2:** Begin automated extraction starting with 'easy' files\n")
        f.write("4. **Phase 3:** Manual enrichment of incomplete content\n")
        f.write("5. **Phase 4:** Special feature migration (hieroglyphs, fonts, etc.)\n")

    print(f"Summary written successfully")
    print()

    # Print summary to console
    print("=" * 80)
    print("PHASE 1.1 AUDIT COMPLETE")
    print("=" * 80)
    print()
    print(f"Total Files Analyzed: {stats['total_files']:,}")
    print(f"Total Word Count: {stats['total_words']:,}")
    print(f"Average Words/File: {stats['avg_word_count']:,}")
    print()
    print("BY MYTHOLOGY:")
    print("-" * 50)
    for myth in sorted(stats['by_mythology'].keys(), key=lambda x: stats['by_mythology'][x], reverse=True):
        count = stats['by_mythology'][myth]
        words = stats['word_count_by_mythology'][myth]
        avg = words // count if count > 0 else 0
        print(f"  {myth.title():20} {count:4} files | {words:7,} words | {avg:5,} avg")
    print()
    print("BY ENTITY TYPE:")
    print("-" * 50)
    for etype in sorted(stats['by_entity_type'].keys(), key=lambda x: stats['by_entity_type'][x], reverse=True):
        count = stats['by_entity_type'][etype]
        pct = (count / stats['total_files'] * 100) if stats['total_files'] > 0 else 0
        print(f"  {etype.title():20} {count:4} files ({pct:5.1f}%)")
    print()
    print("COMPLETENESS:")
    print("-" * 50)
    for status in ['complete', 'partial', 'incomplete']:
        count = stats['by_completeness'].get(status, 0)
        pct = (count / stats['total_files'] * 100) if stats['total_files'] > 0 else 0
        print(f"  {status.title():20} {count:4} files ({pct:5.1f}%)")
    print()
    print("SPECIAL FEATURES:")
    print("-" * 50)
    print(f"  Files with images:   {stats['files_with_images']}")
    print(f"  Files with features: {stats['files_with_special_features']}")
    print()
    print("=" * 80)
    print()
    print("DELIVERABLES CREATED:")
    print(f"  1. {csv_path}")
    print(f"  2. {summary_path}")
    print()
    print("=" * 80)


if __name__ == "__main__":
    main()

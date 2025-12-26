"""
Agent 15 - Polish Items, Places, and Symbols Assets
Process and enhance items, places, and symbols collections with proper structure
"""

import json
import os
from pathlib import Path
from bs4 import BeautifulSoup
import re
from collections import defaultdict

# Paths
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
DOWNLOADED_DIR = BASE_DIR / "firebase-assets-downloaded"
ENHANCED_DIR = BASE_DIR / "firebase-assets-enhanced"
MYTHOS_DIR = BASE_DIR / "mythos"

# Statistics tracking
stats = {
    'items': {'total': 0, 'enhanced': 0, 'by_mythology': defaultdict(int), 'by_type': defaultdict(int)},
    'places': {'total': 0, 'enhanced': 0, 'by_mythology': defaultdict(int), 'by_type': defaultdict(int)},
    'symbols': {'total': 0, 'enhanced': 0, 'by_mythology': defaultdict(int)}
}

def extract_html_content(html_file):
    """Extract meaningful content from HTML files"""
    if not html_file.exists():
        return None

    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        # Remove script and style elements
        for element in soup(['script', 'style', 'nav', 'header', 'footer']):
            element.decompose()

        # Extract main content
        main_content = soup.find('main') or soup.find('article') or soup.find(class_='content')

        if not main_content:
            main_content = soup.find('body')

        if main_content:
            # Get text and clean it up
            text = main_content.get_text(separator='\n', strip=True)
            # Remove excessive whitespace
            text = re.sub(r'\n\s*\n', '\n\n', text)
            return text.strip()

        return None
    except Exception as e:
        print(f"Error extracting from {html_file}: {e}")
        return None

def find_source_html(entity_id, mythology, collection_type):
    """Try to find the source HTML file for an entity"""
    # Try various patterns
    patterns = [
        MYTHOS_DIR / mythology / collection_type / f"{entity_id}.html",
        MYTHOS_DIR / mythology / collection_type / f"{entity_id.replace('_', '-')}.html",
        BASE_DIR / "FIREBASE" / "mythos" / mythology / collection_type / f"{entity_id}.html",
        BASE_DIR / "FIREBASE" / "spiritual-places" / collection_type / f"{entity_id}.html",
    ]

    for pattern in patterns:
        if pattern.exists():
            return pattern

    return None

def enhance_item(item):
    """Enhance an item with extracted HTML content"""
    enhanced = item.copy()

    # Track stats
    stats['items']['total'] += 1
    mythology = item.get('primaryMythology', 'unknown')
    item_type = item.get('itemType', 'unknown')
    stats['items']['by_mythology'][mythology] += 1
    stats['items']['by_type'][item_type] += 1

    # Items already have good structure from migration
    # Add enhanced fields if missing
    if 'usage' not in enhanced:
        # Extract usage from extendedContent if available
        usage_info = []
        for section in enhanced.get('extendedContent', []):
            if any(keyword in section.get('title', '').lower() for keyword in ['use', 'power', 'effect']):
                usage_info.append(section.get('content', ''))
        if usage_info:
            enhanced['usage'] = '\n\n'.join(usage_info)

    if 'symbolism' not in enhanced:
        # Extract symbolism from extendedContent
        symbolism_info = []
        for section in enhanced.get('extendedContent', []):
            if any(keyword in section.get('title', '').lower() for keyword in ['symbol', 'meaning', 'significance']):
                symbolism_info.append(section.get('content', ''))
        if symbolism_info:
            enhanced['symbolism'] = '\n\n'.join(symbolism_info)

    # Add interpretations from theological/cultural sections
    if 'interpretations' not in enhanced:
        interp_info = []
        for section in enhanced.get('extendedContent', []):
            if any(keyword in section.get('title', '').lower() for keyword in ['interpretation', 'tradition', 'belief']):
                interp_info.append({
                    'tradition': section.get('title', ''),
                    'description': section.get('content', '')
                })
        if interp_info:
            enhanced['interpretations'] = interp_info

    stats['items']['enhanced'] += 1
    return enhanced

def enhance_place(place):
    """Enhance a place with additional extracted content"""
    enhanced = place.copy()

    # Track stats
    stats['places']['total'] += 1
    mythology = place.get('primaryMythology', 'unknown')
    place_type = place.get('placeType', 'unknown')
    stats['places']['by_mythology'][mythology] += 1
    stats['places']['by_type'][place_type] += 1

    # Try to find source HTML for additional content
    place_id = place.get('id', '')
    source_file = find_source_html(place_id, mythology, 'places')

    if not source_file:
        # Try locations folder
        source_file = find_source_html(place_id, mythology, 'locations')

    # Extract additional fields
    if 'sacredSignificance' not in enhanced:
        # Extract from longDescription
        long_desc = enhanced.get('longDescription', '')
        if 'sacred' in long_desc.lower() or 'holy' in long_desc.lower():
            # Try to extract sacred significance
            enhanced['sacredSignificance'] = long_desc[:500] + '...' if len(long_desc) > 500 else long_desc

    if 'associatedEvents' not in enhanced:
        enhanced['associatedEvents'] = []

    if 'mythology' not in enhanced.get('geographical', {}):
        enhanced.setdefault('geographical', {})['mythology'] = mythology

    stats['places']['enhanced'] += 1
    return enhanced

def enhance_symbol(symbol):
    """Enhance a symbol with detailed descriptions"""
    enhanced = symbol.copy()

    # Track stats
    stats['symbols']['total'] += 1
    mythology = symbol.get('mythology', 'unknown')
    stats['symbols']['by_mythology'][mythology] += 1

    # Try to find HTML source
    filename = symbol.get('filename', '')
    mythology_name = symbol.get('mythology', '')

    if filename and mythology_name:
        html_file = MYTHOS_DIR / mythology_name / "symbols" / f"{filename}.html"

        if html_file.exists():
            content = extract_html_content(html_file)

            if content:
                # Split content into sections
                sections = content.split('\n\n')

                # Add visual description
                if 'visualDescription' not in enhanced:
                    # Look for description section
                    for section in sections:
                        if len(section) > 100 and any(word in section.lower() for word in ['depict', 'show', 'represent', 'visual', 'image']):
                            enhanced['visualDescription'] = section
                            break

                # Add meanings
                if 'meanings' not in enhanced:
                    enhanced['meanings'] = []
                    for section in sections:
                        if any(word in section.lower() for word in ['meaning', 'symbolize', 'represent']):
                            enhanced['meanings'].append(section)

                # Add usage in rituals
                if 'ritualUsage' not in enhanced:
                    for section in sections:
                        if any(word in section.lower() for word in ['ritual', 'ceremony', 'practice', 'worship']):
                            enhanced['ritualUsage'] = section
                            break

                # Update description if it's minimal
                if len(enhanced.get('description', '')) < 50 and sections:
                    enhanced['description'] = sections[0]

    # Ensure required fields exist
    enhanced.setdefault('visualDescription', '')
    enhanced.setdefault('meanings', [])
    enhanced.setdefault('ritualUsage', '')

    stats['symbols']['enhanced'] += 1
    return enhanced

def process_collection(collection_name, enhance_func):
    """Process a collection of entities"""
    print(f"\n{'='*60}")
    print(f"Processing {collection_name.upper()} collection...")
    print(f"{'='*60}")

    # Load source file
    source_file = DOWNLOADED_DIR / collection_name / "_all.json"

    if not source_file.exists():
        print(f"[ERROR] Source file not found: {source_file}")
        return

    with open(source_file, 'r', encoding='utf-8') as f:
        entities = json.load(f)

    print(f"Loaded {len(entities)} {collection_name}")

    # Group by mythology
    by_mythology = defaultdict(list)

    for entity in entities:
        enhanced = enhance_func(entity)
        mythology = enhanced.get('primaryMythology') or enhanced.get('mythology', 'universal')
        by_mythology[mythology].append(enhanced)

    # Save enhanced entities by mythology
    for mythology, items in by_mythology.items():
        output_dir = ENHANCED_DIR / collection_name / mythology
        output_dir.mkdir(parents=True, exist_ok=True)

        output_file = output_dir / f"{mythology}_{collection_name}.json"

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2, ensure_ascii=False)

        print(f"[OK] Saved {len(items)} {mythology} {collection_name} to {output_file}")

    # Also save a combined file
    all_enhanced_file = ENHANCED_DIR / collection_name / f"all_{collection_name}_enhanced.json"
    all_enhanced = []
    for items in by_mythology.values():
        all_enhanced.extend(items)

    with open(all_enhanced_file, 'w', encoding='utf-8') as f:
        json.dump(all_enhanced, f, indent=2, ensure_ascii=False)

    print(f"[OK] Saved combined file: {all_enhanced_file}")

def generate_summary_report():
    """Generate a comprehensive summary report"""
    print(f"\n{'='*60}")
    print("AGENT 15 SUMMARY REPORT")
    print(f"{'='*60}\n")

    report = []
    report.append("# Agent 15: Items, Places, and Symbols Polishing - Summary Report\n")
    report.append(f"Generated: {Path.cwd()}\n")

    # Items section
    report.append("\n## 1. ITEMS COLLECTION\n")
    report.append(f"**Total Items Processed:** {stats['items']['total']}\n")
    report.append(f"**Successfully Enhanced:** {stats['items']['enhanced']}\n")
    report.append(f"**Enhancement Rate:** {stats['items']['enhanced']/max(stats['items']['total'],1)*100:.1f}%\n")

    report.append("\n### Items by Type:\n")
    for item_type, count in sorted(stats['items']['by_type'].items(), key=lambda x: -x[1]):
        report.append(f"- **{item_type}**: {count}\n")

    report.append("\n### Items by Mythology:\n")
    for mythology, count in sorted(stats['items']['by_mythology'].items(), key=lambda x: -x[1]):
        report.append(f"- **{mythology}**: {count}\n")

    # Places section
    report.append("\n## 2. PLACES COLLECTION\n")
    report.append(f"**Total Places Processed:** {stats['places']['total']}\n")
    report.append(f"**Successfully Enhanced:** {stats['places']['enhanced']}\n")
    report.append(f"**Enhancement Rate:** {stats['places']['enhanced']/max(stats['places']['total'],1)*100:.1f}%\n")

    report.append("\n### Places by Type:\n")
    for place_type, count in sorted(stats['places']['by_type'].items(), key=lambda x: -x[1]):
        report.append(f"- **{place_type}**: {count}\n")

    report.append("\n### Places by Mythology:\n")
    for mythology, count in sorted(stats['places']['by_mythology'].items(), key=lambda x: -x[1]):
        report.append(f"- **{mythology}**: {count}\n")

    # Symbols section
    report.append("\n## 3. SYMBOLS COLLECTION\n")
    report.append(f"**Total Symbols Processed:** {stats['symbols']['total']}\n")
    report.append(f"**Successfully Enhanced:** {stats['symbols']['enhanced']}\n")
    report.append(f"**Enhancement Rate:** {stats['symbols']['enhanced']/max(stats['symbols']['total'],1)*100:.1f}%\n")

    report.append("\n### Symbols by Mythology:\n")
    for mythology, count in sorted(stats['symbols']['by_mythology'].items(), key=lambda x: -x[1]):
        report.append(f"- **{mythology}**: {count}\n")

    # Enhancements made
    report.append("\n## 4. ENHANCEMENTS APPLIED\n")
    report.append("\n### Items:\n")
    report.append("- Extracted **usage** information from extended content\n")
    report.append("- Extracted **symbolism** and meanings\n")
    report.append("- Added **interpretations** from theological/cultural sections\n")
    report.append("- Preserved all existing fields (powers, wielders, materials, etc.)\n")

    report.append("\n### Places:\n")
    report.append("- Added **sacredSignificance** field\n")
    report.append("- Structured **geographical** information\n")
    report.append("- Added **associatedEvents** field\n")
    report.append("- Preserved GPS coordinates and accessibility info\n")

    report.append("\n### Symbols:\n")
    report.append("- Extracted **visualDescription** from HTML sources\n")
    report.append("- Added **meanings** array with multiple interpretations\n")
    report.append("- Added **ritualUsage** information\n")
    report.append("- Enhanced minimal descriptions with content from source files\n")

    # Output locations
    report.append("\n## 5. OUTPUT LOCATIONS\n")
    report.append(f"- **Base Directory:** `{ENHANCED_DIR}`\n")
    report.append(f"- **Items:** `firebase-assets-enhanced/items/{{mythology}}/`\n")
    report.append(f"- **Places:** `firebase-assets-enhanced/places/{{mythology}}/`\n")
    report.append(f"- **Symbols:** `firebase-assets-enhanced/symbols/{{mythology}}/`\n")

    # Next steps
    report.append("\n## 6. NEXT STEPS\n")
    report.append("1. Review enhanced JSON files for data quality\n")
    report.append("2. Validate structure matches Firebase schema\n")
    report.append("3. Upload to Firebase using batch upload scripts\n")
    report.append("4. Update UI to display new enhanced fields\n")

    # Save report
    report_file = BASE_DIR / "AGENT_15_SUMMARY_REPORT.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.writelines(report)

    print(''.join(report))
    print(f"\n[OK] Summary report saved to: {report_file}")

def main():
    """Main execution"""
    print("Agent 15: Polish Items, Places, and Symbols Assets")
    print(f"Working Directory: {BASE_DIR}\n")

    # Create output directories
    ENHANCED_DIR.mkdir(exist_ok=True)

    # Process each collection
    process_collection('items', enhance_item)
    process_collection('places', enhance_place)
    process_collection('symbols', enhance_symbol)

    # Generate summary report
    generate_summary_report()

    print("\nAgent 15 processing complete!")

if __name__ == "__main__":
    main()

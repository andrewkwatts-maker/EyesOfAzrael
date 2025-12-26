#!/usr/bin/env python3
"""
Sacred Texts Enhancement Script
Agent 13 - Text Asset Polish

Extracts detailed content from HTML files and enhances text/scripture assets
with rich contextual information.
"""

import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

# Define paths
BASE_DIR = Path(r"h:/Github/EyesOfAzrael")
INPUT_FILE = BASE_DIR / "firebase-assets-downloaded/texts/_all.json"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced/texts"
MYTHOS_DIR = BASE_DIR / "mythos"

def extract_text_content(soup):
    """Extract main textual content from HTML"""
    content = {
        "sections": [],
        "themes": [],
        "passages": [],
        "historical_context": None,
        "structure": None,
        "parallels": [],
        "significance": None
    }

    # Extract sections
    for section in soup.find_all(['div', 'section'], class_=lambda x: x and 'section' in x.lower() if x else False):
        h2 = section.find(['h2', 'h3'])
        if h2:
            section_title = h2.get_text(strip=True)
            section_text = []
            for p in section.find_all('p'):
                text = p.get_text(strip=True)
                if text and len(text) > 20:
                    section_text.append(text)

            if section_text:
                content["sections"].append({
                    "title": section_title,
                    "content": " ".join(section_text)
                })

    # Extract scripture verses/passages
    for verse in soup.find_all(['div', 'p'], class_=lambda x: x and 'verse' in x.lower() if x else False):
        verse_text = verse.get_text(strip=True)
        verse_ref = None

        # Look for verse reference
        ref_elem = verse.find(class_=lambda x: x and 'ref' in x.lower() if x else False)
        if ref_elem:
            verse_ref = ref_elem.get_text(strip=True)

        if verse_text:
            content["passages"].append({
                "text": verse_text,
                "reference": verse_ref
            })

    # Extract comparison tables
    for table in soup.find_all('table'):
        rows = []
        headers = []

        # Get headers
        for th in table.find_all('th'):
            headers.append(th.get_text(strip=True))

        # Get rows
        for tr in table.find_all('tr'):
            cells = []
            for td in tr.find_all('td'):
                cells.append(td.get_text(strip=True))
            if cells:
                rows.append(cells)

        if headers and rows:
            content["parallels"].append({
                "type": "comparison_table",
                "headers": headers,
                "rows": rows[:10]  # Limit to first 10 rows
            })

    # Extract key themes from highlight boxes
    for highlight in soup.find_all('div', class_=lambda x: x and 'highlight' in x.lower() if x else False):
        h4 = highlight.find(['h4', 'h3'])
        if h4:
            theme_title = h4.get_text(strip=True)
            theme_content = []
            for p in highlight.find_all('p'):
                text = p.get_text(strip=True)
                if text:
                    theme_content.append(text)

            if theme_content:
                content["themes"].append({
                    "theme": theme_title,
                    "description": " ".join(theme_content)
                })

    # Extract lists (teachings, key points)
    for ul in soup.find_all('ul'):
        items = []
        for li in ul.find_all('li', recursive=False):
            text = li.get_text(strip=True)
            if text and len(text) > 10:
                items.append(text)

        if len(items) >= 3:  # Only include substantial lists
            # Try to find context
            prev_h = ul.find_previous(['h2', 'h3', 'h4'])
            context = prev_h.get_text(strip=True) if prev_h else "Key Points"

            content["themes"].append({
                "theme": context,
                "points": items[:15]  # Limit to 15 items
            })

    return content

def extract_metadata_from_html(soup, file_path):
    """Extract metadata from HTML structure"""
    metadata = {
        "title": None,
        "subtitle": None,
        "tradition": None,
        "testament": None,
        "book": None,
        "chapter": None
    }

    # Extract title
    title_elem = soup.find('title')
    if title_elem:
        metadata["title"] = title_elem.get_text(strip=True)

    h1 = soup.find('h1')
    if h1:
        metadata["title"] = h1.get_text(strip=True)

    # Extract subtitle
    subtitle = soup.find(class_=lambda x: x and 'subtitle' in x.lower() if x else False)
    if subtitle:
        metadata["subtitle"] = subtitle.get_text(strip=True)

    # Try to extract from breadcrumb
    breadcrumb = soup.find(class_='breadcrumb')
    if breadcrumb:
        links = breadcrumb.find_all('a')
        if len(links) >= 2:
            metadata["tradition"] = links[1].get_text(strip=True).lower()

    # Parse file path for structure
    path_parts = str(file_path).split(os.sep)
    for i, part in enumerate(path_parts):
        if part == 'mythos' and i + 1 < len(path_parts):
            metadata["tradition"] = path_parts[i + 1]
        if part == 'revelation' or part == 'genesis':
            metadata["book"] = part

    return metadata

def enhance_text_asset(text_data, html_path):
    """Enhance a single text asset with HTML content"""
    enhanced = text_data.copy()

    if not html_path.exists():
        print(f"  HTML not found: {html_path}")
        return enhanced

    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        # Extract metadata
        html_metadata = extract_metadata_from_html(soup, html_path)

        # Extract content
        content = extract_text_content(soup)

        # Enhance the asset
        if content["sections"]:
            enhanced["structure"] = {
                "sections": [s["title"] for s in content["sections"]],
                "section_count": len(content["sections"])
            }

            # Add detailed sections
            enhanced["detailed_sections"] = content["sections"][:5]  # First 5 sections

        if content["themes"]:
            enhanced["key_themes"] = content["themes"][:10]  # Top 10 themes

        if content["passages"]:
            enhanced["famous_passages"] = content["passages"][:15]  # Top 15 passages

        if content["parallels"]:
            enhanced["textual_parallels"] = content["parallels"][:5]  # First 5 parallels

        # Extract historical context from intro sections
        for section in content["sections"][:3]:
            if any(keyword in section["title"].lower() for keyword in ['context', 'background', 'introduction', 'history']):
                enhanced["historical_context"] = section["content"][:500]
                break

        # Extract theological significance
        for section in content["sections"]:
            if any(keyword in section["title"].lower() for keyword in ['significance', 'theological', 'meaning', 'conclusion']):
                enhanced["theological_significance"] = section["content"][:500]
                break

        # Infer authorship and dating from content
        full_text = str(soup.get_text())

        # Look for dating information
        date_patterns = [
            r'(\d{3,4})\s*BCE',
            r'(\d{3,4})\s*CE',
            r'c\.\s*(\d{3,4})',
            r'circa\s*(\d{3,4})'
        ]

        dates_found = []
        for pattern in date_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            dates_found.extend(matches)

        if dates_found:
            enhanced["approximate_dating"] = list(set(dates_found))[:5]

        # Look for authorship mentions
        author_patterns = [
            r'author(?:ed)?\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'written\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'attributed\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'
        ]

        authors_found = []
        for pattern in author_patterns:
            matches = re.findall(pattern, full_text)
            authors_found.extend(matches)

        if authors_found:
            enhanced["possible_authorship"] = list(set(authors_found))[:3]

        # Add HTML metadata
        if html_metadata["title"]:
            enhanced["displayName"] = html_metadata["title"]

        if html_metadata["subtitle"]:
            enhanced["subtitle"] = html_metadata["subtitle"]

        # Update metadata
        enhanced["metadata"]["enrichedBy"] = "agent_13_text_enhancer"
        enhanced["metadata"]["enrichedAt"] = datetime.now().isoformat() + "Z"
        enhanced["metadata"]["htmlSource"] = str(html_path.relative_to(BASE_DIR))

        print(f"  [OK] Enhanced with {len(content['sections'])} sections, {len(content['themes'])} themes, {len(content['passages'])} passages")

    except Exception as e:
        print(f"  [ERROR] Error processing {html_path}: {e}")

    return enhanced

def find_html_file(text_data):
    """Find the HTML file for a text asset"""
    mythology = text_data.get("mythology", "")
    filename = text_data.get("filename", "")

    if not mythology or not filename:
        return None

    # Try source file path first
    source_file = text_data.get("metadata", {}).get("sourceFile")
    if source_file:
        html_path = BASE_DIR / source_file
        if html_path.exists():
            return html_path

    # Search patterns for different mythologies
    search_patterns = [
        MYTHOS_DIR / mythology / "texts" / f"{filename}.html",
        MYTHOS_DIR / mythology / "texts" / "revelation" / f"{filename}.html",
        MYTHOS_DIR / mythology / "texts" / "revelation" / "parallels" / f"{filename}.html",
        MYTHOS_DIR / mythology / "texts" / "genesis" / "parallels" / f"{filename}.html",
    ]

    for pattern in search_patterns:
        if pattern.exists():
            return pattern

    # Try to find by pattern
    try:
        for html_file in (MYTHOS_DIR / mythology / "texts").rglob(f"{filename}.html"):
            return html_file
    except:
        pass

    return None

def main():
    print("Sacred Texts Enhancement Script - Agent 13")
    print("=" * 60)

    # Load input data
    if not INPUT_FILE.exists():
        print(f"Error: Input file not found: {INPUT_FILE}")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        texts = json.load(f)

    print(f"\nLoaded {len(texts)} text assets")

    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Group by mythology
    by_mythology = {}
    for text in texts:
        mythology = text.get("mythology", "unknown")
        if mythology not in by_mythology:
            by_mythology[mythology] = []
        by_mythology[mythology].append(text)

    print(f"Mythologies: {', '.join(by_mythology.keys())}")
    print()

    # Process each mythology
    summary = {
        "total_texts": len(texts),
        "enhanced": 0,
        "no_html": 0,
        "errors": 0,
        "by_mythology": {}
    }

    for mythology, mythology_texts in by_mythology.items():
        print(f"\n{mythology.upper()} - {len(mythology_texts)} texts")
        print("-" * 60)

        enhanced_texts = []
        mythology_stats = {"enhanced": 0, "no_html": 0, "errors": 0}

        for text_data in mythology_texts:
            text_id = text_data.get("id", "unknown")
            display_name = text_data.get("displayName", "Unknown")

            print(f"\n{display_name} ({text_id})")

            # Find HTML file
            html_path = find_html_file(text_data)

            if not html_path:
                print(f"  [SKIP] No HTML file found")
                enhanced_texts.append(text_data)
                mythology_stats["no_html"] += 1
                summary["no_html"] += 1
                continue

            try:
                enhanced = enhance_text_asset(text_data, html_path)
                enhanced_texts.append(enhanced)
                mythology_stats["enhanced"] += 1
                summary["enhanced"] += 1
            except Exception as e:
                print(f"  [ERROR] Error: {e}")
                enhanced_texts.append(text_data)
                mythology_stats["errors"] += 1
                summary["errors"] += 1

        # Save mythology-specific file
        mythology_output = OUTPUT_DIR / mythology
        mythology_output.mkdir(parents=True, exist_ok=True)

        output_file = mythology_output / "_all.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(enhanced_texts, f, indent=2, ensure_ascii=False)

        print(f"\n[SAVED] {len(enhanced_texts)} enhanced texts to {output_file}")
        summary["by_mythology"][mythology] = mythology_stats

    # Save combined file
    all_enhanced = []
    for mythology_texts in by_mythology.values():
        all_enhanced.extend(mythology_texts)

    combined_output = OUTPUT_DIR / "_all_enhanced.json"
    with open(combined_output, 'w', encoding='utf-8') as f:
        json.dump(all_enhanced, f, indent=2, ensure_ascii=False)

    # Save summary report
    summary_file = OUTPUT_DIR / "_enhancement_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    # Print summary
    print("\n" + "=" * 60)
    print("ENHANCEMENT SUMMARY")
    print("=" * 60)
    print(f"Total texts: {summary['total_texts']}")
    print(f"Enhanced: {summary['enhanced']}")
    print(f"No HTML found: {summary['no_html']}")
    print(f"Errors: {summary['errors']}")
    print(f"\nSuccess rate: {summary['enhanced'] / summary['total_texts'] * 100:.1f}%")

    print("\nBy Mythology:")
    for mythology, stats in summary["by_mythology"].items():
        print(f"  {mythology}: {stats['enhanced']} enhanced, {stats['no_html']} no HTML, {stats['errors']} errors")

    print(f"\nOutput saved to: {OUTPUT_DIR}")
    print(f"Summary saved to: {summary_file}")

if __name__ == "__main__":
    main()

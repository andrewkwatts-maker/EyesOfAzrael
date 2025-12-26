#!/usr/bin/env python3
"""
Wrapper script to run text enhancement without Unicode printing issues
"""

import sys
import os

# Set UTF-8 encoding for stdout/stderr
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'replace')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'replace')

# Now run the enhancement
from pathlib import Path
import json
import re
from bs4 import BeautifulSoup
from datetime import datetime

BASE_DIR = Path(r"h:/Github/EyesOfAzrael")
INPUT_FILE = BASE_DIR / "firebase-assets-downloaded/texts/_all.json"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced/texts"
MYTHOS_DIR = BASE_DIR / "mythos"

def sanitize_for_print(text):
    """Remove emojis and special unicode for printing"""
    import unicodedata
    return ''.join(c for c in text if unicodedata.category(c)[0] not in ['C', 'So'])

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

        for th in table.find_all('th'):
            headers.append(th.get_text(strip=True))

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
                "rows": rows[:10]
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

    # Extract lists
    for ul in soup.find_all('ul'):
        items = []
        for li in ul.find_all('li', recursive=False):
            text = li.get_text(strip=True)
            if text and len(text) > 10:
                items.append(text)

        if len(items) >= 3:
            prev_h = ul.find_previous(['h2', 'h3', 'h4'])
            context = prev_h.get_text(strip=True) if prev_h else "Key Points"

            content["themes"].append({
                "theme": context,
                "points": items[:15]
            })

    return content

def extract_metadata_from_html(soup, file_path):
    """Extract metadata from HTML structure"""
    metadata = {
        "title": None,
        "subtitle": None,
        "tradition": None
    }

    title_elem = soup.find('title')
    if title_elem:
        metadata["title"] = title_elem.get_text(strip=True)

    h1 = soup.find('h1')
    if h1:
        metadata["title"] = h1.get_text(strip=True)

    subtitle = soup.find(class_=lambda x: x and 'subtitle' in x.lower() if x else False)
    if subtitle:
        metadata["subtitle"] = subtitle.get_text(strip=True)

    return metadata

def enhance_text_asset(text_data, html_path):
    """Enhance a single text asset with HTML content"""
    enhanced = text_data.copy()

    if not html_path.exists():
        return enhanced

    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        html_metadata = extract_metadata_from_html(soup, html_path)
        content = extract_text_content(soup)

        if content["sections"]:
            enhanced["structure"] = {
                "sections": [s["title"] for s in content["sections"]],
                "section_count": len(content["sections"])
            }
            enhanced["detailed_sections"] = content["sections"][:5]

        if content["themes"]:
            enhanced["key_themes"] = content["themes"][:10]

        if content["passages"]:
            enhanced["famous_passages"] = content["passages"][:15]

        if content["parallels"]:
            enhanced["textual_parallels"] = content["parallels"][:5]

        # Extract historical context
        for section in content["sections"][:3]:
            if any(keyword in section["title"].lower() for keyword in ['context', 'background', 'introduction', 'history']):
                enhanced["historical_context"] = section["content"][:500]
                break

        # Extract theological significance
        for section in content["sections"]:
            if any(keyword in section["title"].lower() for keyword in ['significance', 'theological', 'meaning', 'conclusion']):
                enhanced["theological_significance"] = section["content"][:500]
                break

        # Look for dating
        full_text = str(soup.get_text())
        date_patterns = [r'(\d{3,4})\s*BCE', r'(\d{3,4})\s*CE', r'c\.\s*(\d{3,4})', r'circa\s*(\d{3,4})']
        dates_found = []
        for pattern in date_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            dates_found.extend(matches)

        if dates_found:
            enhanced["approximate_dating"] = list(set(dates_found))[:5]

        # Look for authorship
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

        if html_metadata["title"]:
            enhanced["displayName"] = html_metadata["title"]

        if html_metadata["subtitle"]:
            enhanced["subtitle"] = html_metadata["subtitle"]

        enhanced["metadata"]["enrichedBy"] = "agent_13_text_enhancer"
        enhanced["metadata"]["enrichedAt"] = datetime.now().isoformat() + "Z"
        enhanced["metadata"]["htmlSource"] = str(html_path.relative_to(BASE_DIR))

    except Exception as e:
        pass  # Silent fail, keep original

    return enhanced

def find_html_file(text_data):
    """Find the HTML file for a text asset"""
    mythology = text_data.get("mythology", "")
    filename = text_data.get("filename", "")

    if not mythology or not filename:
        return None

    source_file = text_data.get("metadata", {}).get("sourceFile")
    if source_file:
        html_path = BASE_DIR / source_file
        if html_path.exists():
            return html_path

    search_patterns = [
        MYTHOS_DIR / mythology / "texts" / f"{filename}.html",
        MYTHOS_DIR / mythology / "texts" / "revelation" / f"{filename}.html",
        MYTHOS_DIR / mythology / "texts" / "revelation" / "parallels" / f"{filename}.html",
        MYTHOS_DIR / mythology / "texts" / "genesis" / "parallels" / f"{filename}.html",
    ]

    for pattern in search_patterns:
        if pattern.exists():
            return pattern

    try:
        for html_file in (MYTHOS_DIR / mythology / "texts").rglob(f"{filename}.html"):
            return html_file
    except:
        pass

    return None

def main():
    print("Text Enhancement - Agent 13")
    print("="*60)

    if not INPUT_FILE.exists():
        print(f"Error: Input file not found: {INPUT_FILE}")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        texts = json.load(f)

    print(f"Loaded {len(texts)} text assets\n")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    by_mythology = {}
    for text in texts:
        mythology = text.get("mythology", "unknown")
        if mythology not in by_mythology:
            by_mythology[mythology] = []
        by_mythology[mythology].append(text)

    summary = {
        "total_texts": len(texts),
        "enhanced": 0,
        "no_html": 0,
        "by_mythology": {}
    }

    for mythology, mythology_texts in by_mythology.items():
        print(f"{mythology.upper()} - {len(mythology_texts)} texts")

        enhanced_texts = []
        stats = {"enhanced": 0, "no_html": 0}

        for text_data in mythology_texts:
            html_path = find_html_file(text_data)

            if not html_path:
                enhanced_texts.append(text_data)
                stats["no_html"] += 1
                summary["no_html"] += 1
                continue

            enhanced = enhance_text_asset(text_data, html_path)
            enhanced_texts.append(enhanced)
            stats["enhanced"] += 1
            summary["enhanced"] += 1

        # Save
        mythology_output = OUTPUT_DIR / mythology
        mythology_output.mkdir(parents=True, exist_ok=True)

        output_file = mythology_output / "_all.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(enhanced_texts, f, indent=2, ensure_ascii=False)

        print(f"  Saved {len(enhanced_texts)} texts ({stats['enhanced']} enhanced)")
        summary["by_mythology"][mythology] = stats

    # Save combined
    all_enhanced = []
    for texts in by_mythology.values():
        all_enhanced.extend(texts)

    combined_output = OUTPUT_DIR / "_all_enhanced.json"
    with open(combined_output, 'w', encoding='utf-8') as f:
        json.dump(all_enhanced, f, indent=2, ensure_ascii=False)

    # Save summary
    summary_file = OUTPUT_DIR / "_enhancement_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total: {summary['total_texts']}")
    print(f"Enhanced: {summary['enhanced']}")
    print(f"No HTML: {summary['no_html']}")
    print(f"Success: {summary['enhanced'] / summary['total_texts'] * 100:.1f}%\n")

    for mythology, stats in summary["by_mythology"].items():
        print(f"{mythology}: {stats['enhanced']} enhanced, {stats['no_html']} skipped")

    print(f"\nOutput: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

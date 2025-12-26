#!/usr/bin/env python3
"""
Agent 8: Polish Chinese, Japanese, Aztec, and Mayan deity assets
Extracts culture-specific data from HTML and enhances JSON files
"""

import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

# Define base paths
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
EXTRACTED_DIR = BASE_DIR / "data" / "extracted"
FIREBASE_ASSETS_DIR = BASE_DIR / "firebase-assets-enhanced" / "deities"
MYTHOS_DIR = BASE_DIR / "mythos"

# Mythology configurations
MYTHOLOGIES = {
    "chinese": {
        "specific_fields": ["chinese_characters", "pinyin", "associations", "temples", "legends", "festivals"],
        "character_scripts": ["simplified", "traditional"],
    },
    "japanese": {
        "specific_fields": ["kanji", "romanization", "shrines", "kojiki_references", "nihon_shoki_references"],
        "sacred_texts": ["Kojiki", "Nihon Shoki", "Engishiki"],
    },
    "aztec": {
        "specific_fields": ["nahuatl_name", "calendar_day", "cardinal_direction", "festivals", "sacrifices", "associated_dates"],
        "calendar_system": True,
    },
    "mayan": {
        "specific_fields": ["mayan_name", "popol_vuh_references", "calendar_associations", "sacred_sites"],
        "sacred_texts": ["Popol Vuh", "Chilam Balam"],
    }
}


def extract_chinese_characters(soup):
    """Extract Chinese characters from HTML"""
    chinese_data = {
        "characters": {},
        "corpus_terms": [],
        "temples": [],
        "associations": {}
    }

    # Find subtitle with Chinese characters
    subtitle = soup.find("p", class_="subtitle")
    if subtitle:
        text = subtitle.get_text(strip=True)
        # Extract Chinese characters (simplified/traditional)
        chars = re.findall(r'[\u4e00-\u9fff]+', text)
        if chars:
            chinese_data["characters"]["chinese"] = " / ".join(chars)

        # Extract pinyin
        pinyin_match = re.search(r'\(([^)]+)\)', text)
        if pinyin_match:
            chinese_data["characters"]["pinyin"] = pinyin_match.group(1)

    # Extract corpus search terms
    corpus_links = soup.find_all("a", {"href": re.compile(r"corpus-search\.html\?term=")})
    for link in corpus_links:
        term = link.get_text(strip=True)
        if re.search(r'[\u4e00-\u9fff]', term):  # Contains Chinese characters
            chinese_data["corpus_terms"].append(term)

    # Look for Buddhist/Daoist associations
    text_content = soup.get_text()
    if "Buddhist" in text_content or "Buddhism" in text_content:
        chinese_data["associations"]["buddhist"] = True
    if "Daoist" in text_content or "Taoism" in text_content or "Taoist" in text_content:
        chinese_data["associations"]["daoist"] = True

    # Extract temples and sacred sites
    for strong in soup.find_all("strong"):
        text = strong.get_text()
        if "Temple" in text or "Shrine" in text:
            parent = strong.parent
            if parent:
                chinese_data["temples"].append(parent.get_text(strip=True))

    return chinese_data


def extract_japanese_kanji(soup):
    """Extract Japanese kanji and shrine data from HTML"""
    japanese_data = {
        "kanji": {},
        "shrines": [],
        "sacred_texts": [],
        "festivals": []
    }

    # Find kanji in title or subtitle
    subtitle = soup.find("p", class_="subtitle")
    if not subtitle:
        subtitle = soup.find("h2", class_="card-title-large")

    if subtitle:
        text = subtitle.get_text(strip=True)
        # Extract kanji
        kanji = re.findall(r'[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]+', text)
        if kanji:
            japanese_data["kanji"]["kanji"] = kanji[0]

        # Extract romanization (text in parentheses)
        romanization = re.search(r'\(([^)]+)\)', text)
        if romanization:
            japanese_data["kanji"]["romanization"] = romanization.group(1)

    # Extract shrines
    shrine_keywords = ["Shrine", "Jingu", "Taisha", "Jinja"]
    for keyword in shrine_keywords:
        shrines = soup.find_all(text=re.compile(keyword))
        for shrine in shrines:
            parent = shrine.parent
            if parent and parent.name in ['strong', 'h3', 'h4', 'li']:
                shrine_text = parent.get_text(strip=True)
                if shrine_text and len(shrine_text) < 200:
                    japanese_data["shrines"].append(shrine_text)

    # Look for sacred text references
    text_content = soup.get_text()
    if "Kojiki" in text_content:
        japanese_data["sacred_texts"].append("Kojiki (712 CE)")
    if "Nihon Shoki" in text_content:
        japanese_data["sacred_texts"].append("Nihon Shoki (720 CE)")
    if "Engishiki" in text_content:
        japanese_data["sacred_texts"].append("Engishiki")

    # Extract festivals
    festival_keywords = ["Festival", "Matsuri", "祭"]
    for keyword in festival_keywords:
        festivals = soup.find_all(text=re.compile(keyword))
        for fest in festivals:
            parent = fest.parent
            if parent and parent.name in ['strong', 'li']:
                fest_text = parent.get_text(strip=True)
                if fest_text and len(fest_text) < 300:
                    japanese_data["festivals"].append(fest_text)

    return japanese_data


def extract_aztec_nahuatl(soup):
    """Extract Aztec Nahuatl names and calendar data from HTML"""
    aztec_data = {
        "nahuatl": {},
        "calendar": {},
        "festivals": [],
        "sacrifices": [],
        "directions": {}
    }

    # Find Nahuatl terms
    nahuatl_spans = soup.find_all("span", class_="nahuatl-term")
    if nahuatl_spans:
        aztec_data["nahuatl"]["primary_name"] = nahuatl_spans[0].get_text(strip=True)
        aztec_data["nahuatl"]["alternate_names"] = [
            span.get_text(strip=True) for span in nahuatl_spans[1:4]
        ]

    # Extract subtitle for name meaning
    subtitle = soup.find("p", class_="subtitle")
    if subtitle:
        text = subtitle.get_text(strip=True)
        # Look for meaning in quotes
        meaning = re.search(r'"([^"]+)"', text)
        if meaning:
            aztec_data["nahuatl"]["meaning"] = meaning.group(1)

    # Extract calendar day
    calendar_day = soup.find(text=re.compile(r"Calendar Day|Day Sign"))
    if calendar_day:
        parent = calendar_day.find_parent(['div', 'p', 'li'])
        if parent:
            day_text = parent.get_text(strip=True)
            aztec_data["calendar"]["day_sign"] = day_text

    # Extract cardinal direction
    direction = soup.find(text=re.compile(r"Cardinal Direction|Direction"))
    if direction:
        parent = direction.find_parent(['div', 'p', 'li'])
        if parent:
            dir_text = parent.get_text(strip=True)
            aztec_data["directions"]["cardinal"] = dir_text

    # Extract festivals and ceremonies
    festival_section = soup.find(text=re.compile(r"Festival|Ceremony|Celebration"))
    if festival_section:
        # Find nearby list items
        parent = festival_section.find_parent(['section', 'div'])
        if parent:
            festivals = parent.find_all('li')
            aztec_data["festivals"] = [f.get_text(strip=True) for f in festivals[:5]]

    # Look for sacrifice mentions
    sacrifice_text = soup.find_all(text=re.compile(r"sacrifice|offering|ritual"))
    for s in sacrifice_text[:3]:
        parent = s.find_parent(['p', 'li'])
        if parent:
            sac_text = parent.get_text(strip=True)
            if len(sac_text) < 300:
                aztec_data["sacrifices"].append(sac_text)

    return aztec_data


def extract_mayan_data(soup):
    """Extract Mayan names and Popol Vuh references from HTML"""
    mayan_data = {
        "mayan_names": {},
        "popol_vuh": [],
        "calendar": {},
        "sacred_sites": []
    }

    # Find Mayan terms
    mayan_spans = soup.find_all("span", class_="mayan-term")
    if mayan_spans:
        mayan_data["mayan_names"]["primary_name"] = mayan_spans[0].get_text(strip=True)
        mayan_data["mayan_names"]["alternate_names"] = [
            span.get_text(strip=True) for span in mayan_spans[1:4]
        ]

    # Extract subtitle for name meaning
    subtitle = soup.find("p", class_="subtitle")
    if subtitle:
        text = subtitle.get_text(strip=True)
        # Look for meaning in quotes
        meaning = re.search(r'"([^"]+)"', text)
        if meaning:
            mayan_data["mayan_names"]["meaning"] = meaning.group(1)

    # Extract Popol Vuh references
    popol_vuh_mentions = soup.find_all(text=re.compile(r"Popol Vuh|Popol Wuj"))
    for mention in popol_vuh_mentions[:5]:
        parent = mention.find_parent(['p', 'li', 'div'])
        if parent:
            context = parent.get_text(strip=True)
            if len(context) < 500:
                mayan_data["popol_vuh"].append(context)

    # Extract sacred sites
    site_keywords = ["Chichen Itza", "Tikal", "Palenque", "Uxmal", "Copan", "Cenote"]
    for keyword in site_keywords:
        sites = soup.find_all(text=re.compile(keyword))
        for site in sites:
            parent = site.find_parent(['p', 'li', 'strong'])
            if parent:
                site_text = parent.get_text(strip=True)
                if site_text and len(site_text) < 300:
                    mayan_data["sacred_sites"].append(site_text)

    # Extract celestial associations
    celestial = soup.find(text=re.compile(r"Celestial Association|Venus|Morning Star"))
    if celestial:
        parent = celestial.find_parent(['div', 'p', 'li'])
        if parent:
            cel_text = parent.get_text(strip=True)
            mayan_data["calendar"]["celestial"] = cel_text

    return mayan_data


def enhance_deity(mythology, deity_file):
    """Enhance a single deity JSON file with culture-specific data"""
    # Read existing JSON
    json_path = EXTRACTED_DIR / mythology / deity_file
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Read corresponding HTML
    deity_name = deity_file.replace('.json', '')
    html_path = MYTHOS_DIR / mythology / "deities" / f"{deity_name}.html"

    if not html_path.exists():
        print(f"  WARNING: HTML not found: {html_path}")
        return None

    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # Extract culture-specific data based on mythology
    if mythology == "chinese":
        cultural_data = extract_chinese_characters(soup)
        data["chinese_specific"] = cultural_data
    elif mythology == "japanese":
        cultural_data = extract_japanese_kanji(soup)
        data["japanese_specific"] = cultural_data
    elif mythology == "aztec":
        cultural_data = extract_aztec_nahuatl(soup)
        data["aztec_specific"] = cultural_data
    elif mythology == "mayan":
        cultural_data = extract_mayan_data(soup)
        data["mayan_specific"] = cultural_data

    # Add enhancement metadata
    if "metadata" not in data:
        data["metadata"] = {}

    data["metadata"]["enhanced_date"] = datetime.now().isoformat()
    data["metadata"]["enhanced_by"] = "Agent 8 - Cultural Enhancement"
    data["metadata"]["enhancement_version"] = "1.0"

    return data


def process_mythology(mythology):
    """Process all deities for a mythology"""
    print(f"\n{'='*60}")
    print(f"Processing {mythology.upper()} deities...")
    print(f"{'='*60}")

    source_dir = EXTRACTED_DIR / mythology
    if not source_dir.exists():
        print(f"  ERROR: Source directory not found: {source_dir}")
        return {"processed": 0, "failed": 0, "deities": []}

    # Create output directory
    output_dir = FIREBASE_ASSETS_DIR / mythology
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get all JSON files (deities only, skip index/cosmology)
    deity_files = [f for f in os.listdir(source_dir) if f.endswith('.json') and f not in ['index.json', 'corpus-search.json']]

    stats = {
        "processed": 0,
        "failed": 0,
        "deities": []
    }

    for deity_file in sorted(deity_files):
        deity_name = deity_file.replace('.json', '')

        # Skip cosmology/non-deity files
        if deity_name in ['afterlife', 'creation', 'index']:
            continue

        print(f"\n  Processing: {deity_name}")

        try:
            enhanced_data = enhance_deity(mythology, deity_file)

            if enhanced_data:
                # Save enhanced JSON
                output_path = output_dir / deity_file
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_data, f, indent=2, ensure_ascii=False)

                stats["processed"] += 1
                stats["deities"].append(deity_name)
                print(f"    SUCCESS: Enhanced and saved to {output_path}")
            else:
                stats["failed"] += 1
                print(f"    WARNING: Enhancement failed (missing HTML)")

        except Exception as e:
            stats["failed"] += 1
            print(f"    ERROR: {str(e)}")

    return stats


def main():
    """Main execution"""
    print("="*60)
    print("AGENT 8: CULTURAL ENHANCEMENT OF DEITY ASSETS")
    print("="*60)
    print("Processing: Chinese, Japanese, Aztec, Mayan")
    print()

    all_stats = {}

    for mythology in ["chinese", "japanese", "aztec", "mayan"]:
        stats = process_mythology(mythology)
        all_stats[mythology] = stats

    # Print summary
    print("\n" + "="*60)
    print("ENHANCEMENT SUMMARY")
    print("="*60)

    total_processed = 0
    total_failed = 0

    for mythology, stats in all_stats.items():
        print(f"\n{mythology.upper()}:")
        print(f"  SUCCESS Processed: {stats['processed']}")
        print(f"  FAILED: {stats['failed']}")
        print(f"  Deities: {', '.join(stats['deities'])}")

        total_processed += stats['processed']
        total_failed += stats['failed']

    print(f"\n{'='*60}")
    print(f"TOTAL:")
    print(f"  SUCCESS Processed: {total_processed}")
    print(f"  FAILED: {total_failed}")
    print(f"{'='*60}")

    # Save summary report
    report_path = FIREBASE_ASSETS_DIR / "enhancement-report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "agent": "Agent 8",
            "mythologies": all_stats,
            "total_processed": total_processed,
            "total_failed": total_failed
        }, f, indent=2)

    print(f"\nReport saved to: {report_path}")


if __name__ == "__main__":
    main()

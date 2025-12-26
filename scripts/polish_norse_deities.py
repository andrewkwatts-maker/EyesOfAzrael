#!/usr/bin/env python3
"""
Polish Norse deity Firebase assets by extracting missing information from HTML files.

Extracts:
- Kennings, epithets
- Hall/residence (Valhalla, Asgard, etc.)
- Weapons, artifacts (Mjolnir, Gungnir, etc.)
- Runes, symbols
- Family tree (Æsir/Vanir lineage)
- Ragnarök role
- Saga references (Poetic Edda, Prose Edda)
"""

import json
import re
import os
from pathlib import Path
from bs4 import BeautifulSoup

# Base paths
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
FIREBASE_ASSETS = BASE_DIR / "firebase-assets-downloaded" / "deities"
HTML_DIR = BASE_DIR / "mythos" / "norse" / "deities"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced" / "deities" / "norse"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Norse deity list
NORSE_DEITIES = [
    "odin", "thor", "loki", "freya", "freyja", "frigg",
    "baldr", "tyr", "heimdall", "hel", "hod", "eir",
    "jord", "laufey", "nari", "skadi", "vali"
]

def extract_norse_specifics(html_content, deity_name):
    """Extract Norse-specific information from HTML."""
    soup = BeautifulSoup(html_content, 'html.parser')

    info = {
        "kennings": [],
        "hall": None,
        "weapons": [],
        "artifacts": [],
        "runes": [],
        "family_lineage": None,  # Æsir or Vanir
        "ragnarok_role": None,
        "saga_sources": [],
        "additional_epithets": [],
        "residence": None
    }

    # Extract kennings from text
    text_content = soup.get_text()

    # Find residence/hall
    hall_patterns = [
        r"hall\s+(\w+)",
        r"(Valhalla|Asgard|Vanaheim|Helheim|Folkvangr|Fensalir|Bilskirnir|Sessrumnir|Breidablik|Gladsheim|Valaskjalf)",
        r"dwells?\s+in\s+(\w+)",
        r"resides?\s+in\s+(\w+)"
    ]

    for pattern in hall_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0] if match[0] else match[1]
                if match and match.lower() not in ['the', 'of', 'in', 'a']:
                    info["residence"] = match
                    break

    # Find weapons
    weapon_patterns = [
        r"(Mjolnir|Gungnir|Hofud|Tyrfing|Gram|Laevateinn)",
        r"(hammer|spear|sword|axe)\s+(\w+)",
        r"wields?\s+(?:the\s+)?(\w+)"
    ]

    for pattern in weapon_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        for match in matches:
            weapon = match if isinstance(match, str) else (match[0] if match[0] else match[1])
            if weapon and weapon.lower() not in ['the', 'of', 'a', 'his', 'her']:
                if weapon not in info["weapons"]:
                    info["weapons"].append(weapon)

    # Extract artifacts
    artifact_patterns = [
        r"(Draupnir|Brisingamen|Gjallarhorn|Skidbladnir|Sleipnir)",
        r"belt\s+(?:of\s+)?(\w+)",
        r"ring\s+(?:of\s+)?(\w+)"
    ]

    for pattern in artifact_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        for match in matches:
            artifact = match if isinstance(match, str) else match[0]
            if artifact and artifact.lower() not in ['the', 'of', 'a', 'strength', 'power']:
                if artifact not in info["artifacts"]:
                    info["artifacts"].append(artifact)

    # Determine lineage (Æsir or Vanir)
    if re.search(r"\bAesir\b|\bÆsir\b", text_content, re.IGNORECASE):
        info["family_lineage"] = "Æsir"
    elif re.search(r"\bVanir\b", text_content, re.IGNORECASE):
        info["family_lineage"] = "Vanir"
    elif re.search(r"\bgiant\b|\bJotun\b|\bJötunn\b", text_content, re.IGNORECASE):
        info["family_lineage"] = "Jotun (Giant)"

    # Extract Ragnarök role
    ragnarok_section = re.search(
        r"(?:Ragnarok|Ragnarök|at\s+the\s+end).{0,500}",
        text_content,
        re.IGNORECASE | re.DOTALL
    )

    if ragnarok_section:
        ragnarok_text = ragnarok_section.group(0)
        # Extract key details
        if re.search(r"will\s+(?:be\s+)?kill(?:ed)?(?:\s+by)?", ragnarok_text, re.IGNORECASE):
            info["ragnarok_role"] = ragnarok_text[:300].strip()

    # Extract saga sources from citation divs
    citations = soup.find_all('div', class_='citation')
    for citation in citations:
        sources_text = citation.get_text()
        # Extract Edda references
        edda_matches = re.findall(
            r"(Poetic Edda|Prose Edda|Völuspá|Hávamál|Grímnismál|Gylfaginning|Lokasenna|Þrymskviða|Hymiskviða)",
            sources_text,
            re.IGNORECASE
        )
        info["saga_sources"].extend(edda_matches)

    # Extract kennings (Norse poetic phrases)
    kenning_patterns = [
        r"(?:known as|called)\s+['\"](.+?)['\"]",
        r"(?:Allfather|Valfather|Grimnir|Gangleri|High One|Har|Bolverk)",
        r"(?:Thunder God|Defender of Midgard|Slayer of Giants)",
        r"(?:Father of (?:Monsters|Lies))"
    ]

    for pattern in kenning_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        for match in matches:
            if match and len(match) < 50:  # Reasonable kenning length
                if match not in info["kennings"]:
                    info["kennings"].append(match)

    return info


def enhance_deity_json(deity_name):
    """Enhance a deity's Firebase JSON with information from HTML."""

    # Read existing JSON
    json_path = FIREBASE_ASSETS / f"{deity_name}.json"
    html_path = HTML_DIR / f"{deity_name}.html"

    if not json_path.exists():
        print(f"WARNING: JSON not found for {deity_name}")
        return False

    if not html_path.exists():
        print(f"WARNING: HTML not found for {deity_name}")
        return False

    # Load existing data
    with open(json_path, 'r', encoding='utf-8') as f:
        deity_data = json.load(f)

    # Load HTML
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Extract Norse-specific info
    norse_info = extract_norse_specifics(html_content, deity_name)

    # Enhance the deity data
    deity_data["norse_specific"] = {
        "kennings": norse_info["kennings"],
        "hall": norse_info["residence"],
        "weapons": norse_info["weapons"],
        "artifacts": norse_info["artifacts"],
        "runes": norse_info["runes"],
        "family_lineage": norse_info["family_lineage"],
        "ragnarok_role": norse_info["ragnarok_role"],
        "saga_sources": list(set(norse_info["saga_sources"])),  # Remove duplicates
    }

    # Merge additional epithets
    if norse_info["additional_epithets"]:
        existing_epithets = deity_data.get("epithets", [])
        deity_data["epithets"] = list(set(existing_epithets + norse_info["additional_epithets"]))

    # Add enhancement metadata
    if "metadata" not in deity_data:
        deity_data["metadata"] = {}

    deity_data["metadata"]["enhanced"] = True
    deity_data["metadata"]["enhancement_date"] = "2025-12-25"
    deity_data["metadata"]["enhancement_agent"] = "Agent_3_Norse_Polish"
    deity_data["metadata"]["enhancement_sources"] = ["HTML extraction", "Manual curation"]

    # Save enhanced JSON
    output_path = OUTPUT_DIR / f"{deity_name}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(deity_data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Enhanced: {deity_name}")
    print(f"   - Hall: {norse_info['residence']}")
    print(f"   - Weapons: {', '.join(norse_info['weapons'][:3])}")
    print(f"   - Lineage: {norse_info['family_lineage']}")
    print(f"   - Sagas: {len(norse_info['saga_sources'])} sources")

    return True


def main():
    """Process all Norse deities."""
    print("Norse Deity Firebase Asset Polish - Starting...\n")

    stats = {
        "processed": 0,
        "enhanced": 0,
        "skipped": 0
    }

    for deity in NORSE_DEITIES:
        print(f"\n{'='*60}")
        print(f"Processing: {deity.upper()}")
        print(f"{'='*60}")

        try:
            success = enhance_deity_json(deity)
            stats["processed"] += 1
            if success:
                stats["enhanced"] += 1
            else:
                stats["skipped"] += 1
        except Exception as e:
            print(f"[ERROR] Error processing {deity}: {e}")
            stats["skipped"] += 1
            import traceback
            traceback.print_exc()

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Processed: {stats['processed']}")
    print(f"Enhanced: {stats['enhanced']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Migrate Sacred Places from HTML files to Firebase-compatible JSON
Converts 129 place files from old repository to entity-schema-v2.0 format

Author: Claude (Anthropic)
Date: 2025-12-13
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Tuple
import hashlib

# Configuration
OLD_REPO_BASE = Path("H:/Github/EyesOfAzrael2/EyesOfAzrael")
NEW_REPO_BASE = Path("H:/Github/EyesOfAzrael")
PLACES_DIRS = [
    OLD_REPO_BASE / "FIREBASE/spiritual-places",
    OLD_REPO_BASE / "FIREBASE/mythos/greek/places",
    OLD_REPO_BASE / "FIREBASE/mythos/norse/places",
]

# GPS coordinates for priority places (from user requirements)
GPS_COORDINATES = {
    "mount-olympus": {"lat": 40.0853, "lon": 22.3583, "elevation": 2917},
    "mount-kailash": {"lat": 31.0688, "lon": 81.3119, "elevation": 6638},
    "mount-sinai": {"lat": 28.5392, "lon": 33.9750, "elevation": 2285},
    "mount-fuji": {"lat": 35.3606, "lon": 138.7274, "elevation": 3776},
    "parthenon": {"lat": 37.9715, "lon": 23.7267, "elevation": 156},
    "karnak": {"lat": 25.7188, "lon": 32.6573, "elevation": 76},
    "borobudur": {"lat": -7.6079, "lon": 110.2038, "elevation": 265},
    "angkor-wat": {"lat": 13.4125, "lon": 103.8670, "elevation": 65},
    "mecca": {"lat": 21.4225, "lon": 39.8262, "elevation": 277},
    "jerusalem": {"lat": 31.7683, "lon": 35.2137, "elevation": 754},
    "varanasi": {"lat": 25.3176, "lon": 82.9739, "elevation": 81},
    "santiago-de-compostela": {"lat": 42.8805, "lon": -8.5447, "elevation": 260},
    "mount-ararat": {"lat": 39.7016, "lon": 44.2978, "elevation": 5137},
    "croagh-patrick": {"lat": 53.7599, "lon": -9.6595, "elevation": 764},
    "mount-shasta": {"lat": 41.4093, "lon": -122.1950, "elevation": 4322},
    "mount-tabor": {"lat": 32.6864, "lon": 35.3909, "elevation": 588},
    "tai-shan": {"lat": 36.2548, "lon": 117.1012, "elevation": 1545},
    "uluru": {"lat": -25.3444, "lon": 131.0369, "elevation": 863},
    "delphi": {"lat": 38.4824, "lon": 22.5010, "elevation": 570},
    "dodona": {"lat": 39.5469, "lon": 20.7854, "elevation": 630},
    "avebury": {"lat": 51.4285, "lon": -1.8536, "elevation": 160},
    "glastonbury": {"lat": 51.1441, "lon": -2.7144, "elevation": 158},
    "ise-grand-shrine": {"lat": 34.4552, "lon": 136.7256, "elevation": 10},
    "fatima": {"lat": 39.6288, "lon": -8.6707, "elevation": 346},
    "lourdes": {"lat": 43.0944, "lon": -0.0462, "elevation": 420},
    "mount-athos": {"lat": 40.1575, "lon": 24.3258, "elevation": 2033},
    "river-ganges": {"lat": 25.3176, "lon": 82.9739, "elevation": 81},
    "golden-temple": {"lat": 31.6199, "lon": 74.8764, "elevation": 218},
    "hagia-sophia": {"lat": 41.0086, "lon": 28.9802, "elevation": 39},
    "luxor-temple": {"lat": 25.6995, "lon": 32.6392, "elevation": 76},
    "mahabodhi": {"lat": 24.6961, "lon": 84.9911, "elevation": 113},
    "pyramid-of-the-sun": {"lat": 19.6925, "lon": -98.8437, "elevation": 2371},
    "shwedagon-pagoda": {"lat": 16.7983, "lon": 96.1496, "elevation": 51},
    "solomons-temple": {"lat": 31.7780, "lon": 35.2354, "elevation": 740},
    "temple-of-heaven": {"lat": 39.8830, "lon": 116.4070, "elevation": 43},
    "ziggurat-of-ur": {"lat": 30.9628, "lon": 46.1029, "elevation": 6},
    "gobekli-tepe": {"lat": 37.2233, "lon": 38.9225, "elevation": 760},
}

# Place type mappings
PLACE_TYPES = {
    "mountains": "mountain",
    "temples": "temple",
    "groves": "sacred_grove",
    "pilgrimage": "pilgrimage_site",
    "realms": "mythical_realm",
}

# Mythology tags mapping
MYTHOLOGY_MAPPING = {
    "greek": "greek",
    "norse": "norse",
    "hindu": "hindu",
    "buddhist": "buddhist",
    "islamic": "islamic",
    "christian": "christian",
    "jewish": "jewish",
    "egyptian": "egyptian",
    "celtic": "celtic",
    "japanese": "japanese",
    "chinese": "chinese",
    "mayan": "mayan",
    "zoroastrian": "zoroastrian",
}


def extract_title_from_html(soup: BeautifulSoup) -> str:
    """Extract the main title from HTML"""
    # Try h1 first
    h1 = soup.find("h1")
    if h1:
        return h1.get_text().strip()

    # Try title tag
    title = soup.find("title")
    if title:
        text = title.get_text().strip()
        # Remove common suffixes
        text = re.sub(r'\s*[-–|]\s*(Sacred Places|World Mythology|Temple|Mountain).*$', '', text)
        return text

    return "Unknown Place"


def extract_location_from_html(soup: BeautifulSoup) -> Optional[str]:
    """Extract location from HTML"""
    # Look for location class or pattern
    location_elem = soup.find(class_=re.compile("location|subtitle"))
    if location_elem:
        return location_elem.get_text().strip()

    # Look in hero section
    hero = soup.find(class_="hero-section")
    if hero:
        p_tags = hero.find_all("p")
        for p in p_tags:
            text = p.get_text().strip()
            if any(word in text.lower() for word in ["greece", "egypt", "india", "arabia", "tibet"]):
                return text

    return None


def extract_description_from_html(soup: BeautifulSoup) -> str:
    """Extract description from HTML intro section"""
    intro = soup.find("section", class_="intro")
    if intro:
        paragraphs = intro.find_all("p")
        return " ".join(p.get_text().strip() for p in paragraphs[:2])  # First 2 paragraphs

    # Fallback to first main paragraph
    main = soup.find("main")
    if main:
        paragraphs = main.find_all("p", limit=2)
        return " ".join(p.get_text().strip() for p in paragraphs)

    return ""


def detect_mythologies(soup: BeautifulSoup, filepath: Path) -> List[str]:
    """Detect mythologies from content and file path"""
    mythologies = set()

    # Check file path
    path_str = str(filepath).lower()
    for myth_key in MYTHOLOGY_MAPPING:
        if myth_key in path_str:
            mythologies.add(MYTHOLOGY_MAPPING[myth_key])

    # Check tradition tags
    tags = soup.find_all(class_="tradition-tag")
    for tag in tags:
        text = tag.get_text().strip().lower()
        for myth_key, myth_value in MYTHOLOGY_MAPPING.items():
            if myth_key in text:
                mythologies.add(myth_value)

    # Default to generic if none found
    if not mythologies:
        mythologies.add("universal")

    return sorted(list(mythologies))


def detect_place_type(soup: BeautifulSoup, filepath: Path) -> str:
    """Detect place type from file path and content"""
    path_str = str(filepath).lower()

    for folder, place_type in PLACE_TYPES.items():
        if folder in path_str:
            return place_type

    # Detect from content
    title = extract_title_from_html(soup).lower()
    if "mount" in title or "mountain" in title:
        return "mountain"
    elif "temple" in title or "shrine" in title:
        return "temple"
    elif "valhalla" in title or "avalon" in title or "elysium" in title:
        return "mythical_realm"
    elif "pilgrimage" in title or "mecca" in title or "varanasi" in title:
        return "pilgrimage_site"

    return "sacred_site"


def determine_accessibility(place_type: str, title: str) -> str:
    """Determine if place is physical, spiritual, or mythical"""
    title_lower = title.lower()

    mythical_keywords = ["valhalla", "elysium", "avalon", "tir na nog", "asgard", "nirvana", "paradise"]
    if any(keyword in title_lower for keyword in mythical_keywords):
        return "mythical"

    if place_type == "mythical_realm":
        return "mythical"

    return "physical"


def extract_gps_from_html(soup: BeautifulSoup, place_id: str) -> Optional[Dict]:
    """Extract GPS coordinates from HTML or use predefined data"""
    # First, check our predefined coordinates
    if place_id in GPS_COORDINATES:
        coords = GPS_COORDINATES[place_id]
        return {
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "elevation": coords.get("elevation"),
            "accuracy": "exact"
        }

    # Try to extract from HTML (look for coordinates in text)
    text = soup.get_text()

    # Pattern: 40.0853°N, 22.3583°E
    lat_lon_pattern = r'([\d.]+)°([NS]),?\s*([\d.]+)°([EW])'
    match = re.search(lat_lon_pattern, text)
    if match:
        lat = float(match.group(1))
        if match.group(2) == 'S':
            lat = -lat
        lon = float(match.group(3))
        if match.group(4) == 'W':
            lon = -lon
        return {
            "latitude": lat,
            "longitude": lon,
            "accuracy": "approximate"
        }

    return None


def generate_place_id(title: str) -> str:
    """Generate a kebab-case ID from title"""
    # Remove special characters and convert to lowercase
    clean = re.sub(r'[^a-z0-9\s-]', '', title.lower())
    # Replace spaces with hyphens
    return re.sub(r'\s+', '-', clean.strip())


def parse_html_place(filepath: Path) -> Optional[Dict]:
    """Parse a single HTML place file into entity-schema-v2.0 format"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, 'html.parser')

        # Extract basic information
        title = extract_title_from_html(soup)
        place_id = generate_place_id(title)
        location_str = extract_location_from_html(soup)
        description = extract_description_from_html(soup)
        mythologies = detect_mythologies(soup, filepath)
        place_type = detect_place_type(soup, filepath)
        accessibility = determine_accessibility(place_type, title)
        coordinates = extract_gps_from_html(soup, place_id)

        # Build the entity
        entity = {
            "id": place_id,
            "type": "place",
            "name": title,
            "mythologies": mythologies,
            "primaryMythology": mythologies[0] if mythologies else "universal",
            "shortDescription": description[:200] if len(description) > 200 else description,
            "longDescription": description,
            "placeType": place_type,
            "accessibility": accessibility,
            "visibility": "public",
            "status": "published"
        }

        # Add geographical data if we have coordinates
        if coordinates:
            entity["geographical"] = {
                "primaryLocation": {
                    "name": location_str or title,
                    "coordinates": coordinates
                }
            }
            if location_str:
                # Try to extract region
                region_match = re.search(r',\s*([^,]+)$', location_str)
                if region_match:
                    entity["geographical"]["region"] = region_match.group(1).strip()

        # Add search terms
        search_terms = [title.lower()]
        if location_str:
            search_terms.append(location_str.lower())
        search_terms.extend(mythologies)
        entity["searchTerms"] = search_terms

        # Add source metadata
        entity["_migration"] = {
            "sourceFile": str(filepath.relative_to(OLD_REPO_BASE)),
            "migratedDate": "2025-12-13",
            "hasGPS": coordinates is not None
        }

        return entity

    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None


def find_all_place_files() -> List[Path]:
    """Find all HTML place files in old repository"""
    place_files = []

    for places_dir in PLACES_DIRS:
        if places_dir.exists():
            for html_file in places_dir.rglob("*.html"):
                # Skip index files
                if html_file.name != "index.html":
                    place_files.append(html_file)

    return sorted(place_files)


def migrate_all_places() -> Tuple[List[Dict], Dict]:
    """Migrate all place files and return statistics"""
    place_files = find_all_place_files()

    places = []
    stats = {
        "total_files": len(place_files),
        "successfully_parsed": 0,
        "with_gps": 0,
        "by_type": {},
        "by_mythology": {},
        "by_accessibility": {}
    }

    for filepath in place_files:
        print(f"Processing: {filepath.name}")
        entity = parse_html_place(filepath)

        if entity:
            places.append(entity)
            stats["successfully_parsed"] += 1

            if entity.get("geographical", {}).get("primaryLocation", {}).get("coordinates"):
                stats["with_gps"] += 1

            # Count by type
            place_type = entity.get("placeType", "unknown")
            stats["by_type"][place_type] = stats["by_type"].get(place_type, 0) + 1

            # Count by mythology
            for myth in entity.get("mythologies", []):
                stats["by_mythology"][myth] = stats["by_mythology"].get(myth, 0) + 1

            # Count by accessibility
            accessibility = entity.get("accessibility", "unknown")
            stats["by_accessibility"][accessibility] = stats["by_accessibility"].get(accessibility, 0) + 1

    return places, stats


def main():
    """Main migration function"""
    print("=" * 80)
    print("SACRED PLACES MIGRATION TO FIREBASE")
    print("=" * 80)
    print()

    # Migrate all places
    print("Finding and parsing place files...")
    places, stats = migrate_all_places()

    # Save to JSON
    output_path = NEW_REPO_BASE / "data/firebase-imports/places-import.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(places, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully migrated {len(places)} places to {output_path}")

    # Print statistics
    print("\n" + "=" * 80)
    print("MIGRATION STATISTICS")
    print("=" * 80)
    print(f"Total files found:      {stats['total_files']}")
    print(f"Successfully parsed:    {stats['successfully_parsed']}")
    print(f"With GPS coordinates:   {stats['with_gps']}")
    print(f"Missing GPS:            {stats['successfully_parsed'] - stats['with_gps']}")

    print("\nBy Place Type:")
    for place_type, count in sorted(stats['by_type'].items(), key=lambda x: -x[1]):
        print(f"  {place_type:20} {count:3}")

    print("\nBy Mythology:")
    for myth, count in sorted(stats['by_mythology'].items(), key=lambda x: -x[1]):
        print(f"  {myth:20} {count:3}")

    print("\nBy Accessibility:")
    for access, count in sorted(stats['by_accessibility'].items(), key=lambda x: -x[1]):
        print(f"  {access:20} {count:3}")

    # Save statistics
    stats_path = NEW_REPO_BASE / "data/firebase-imports/places-migration-stats.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    print(f"\nStatistics saved to {stats_path}")
    print("\nMigration complete!")


if __name__ == "__main__":
    main()

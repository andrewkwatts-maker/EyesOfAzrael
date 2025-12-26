#!/usr/bin/env python3
"""
Agent 5: Polish Christian, Buddhist, and Islamic deity/figure assets
Extracts specialized attributes from HTML pages and enhances JSON data
"""

import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional

# Define base paths
BASE_DIR = Path("H:/Github/EyesOfAzrael")
FIREBASE_ASSETS = BASE_DIR / "firebase-assets-downloaded" / "deities"
MYTHOS_DIR = BASE_DIR / "mythos"
OUTPUT_DIR = BASE_DIR / "firebase-assets-enhanced" / "deities"

# Ensure output directories exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
for mythology in ["christian", "buddhist", "islamic"]:
    (OUTPUT_DIR / mythology).mkdir(parents=True, exist_ok=True)


class EntityPolisher:
    """Extracts and enhances entity data from HTML pages"""

    def __init__(self, mythology: str):
        self.mythology = mythology
        self.processed = 0
        self.enhanced = 0

    def extract_christian_specifics(self, soup: BeautifulSoup, entity: Dict) -> Dict:
        """Extract Christian-specific attributes"""
        enhanced = entity.copy()

        # Extract biblical references
        biblical_refs = []
        for link in soup.find_all('a', href=re.compile(r'corpus-search.*translation=KJV')):
            text = link.get_text(strip=True)
            if text and 'Search' not in text:
                biblical_refs.append(text)

        # Look for feast days
        feast_days = []
        content = soup.get_text()
        feast_patterns = [
            r'(Christmas|Easter|Good Friday|Epiphany|Ascension Day|Pentecost)',
            r'Feast of.*?(?=\n|<)',
            r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+'
        ]
        for pattern in feast_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            feast_days.extend(matches)

        # Extract patronage (looking for patron saint info)
        patronage = []
        if 'patron' in content.lower():
            patron_section = re.search(r'patron.*?(?:of|for)(.*?)(?:\.|<br|</)', content, re.IGNORECASE | re.DOTALL)
            if patron_section:
                patronage.append(patron_section.group(1).strip())

        # Extract prayers
        prayers = []
        prayer_sections = soup.find_all(['div', 'p'], class_=re.compile('prayer|devotion'))
        for section in prayer_sections:
            prayer_text = section.get_text(strip=True)
            if prayer_text and len(prayer_text) > 20:
                prayers.append(prayer_text)

        # Extract roles/offices
        roles = []
        role_labels = soup.find_all(['div', 'h3'], string=re.compile(r'(Office|Role|Function)', re.I))
        for label in role_labels:
            next_elem = label.find_next(['ul', 'p', 'div'])
            if next_elem:
                role_text = next_elem.get_text(strip=True)
                if role_text:
                    roles.append(role_text)

        # Add to enhanced data
        if biblical_refs:
            enhanced['biblical_references'] = list(set(biblical_refs))[:10]
        if feast_days:
            enhanced['feast_days'] = list(set(feast_days))[:5]
        if patronage:
            enhanced['patronage'] = patronage
        if prayers:
            enhanced['prayers'] = prayers[:3]
        if roles:
            enhanced['roles'] = roles

        return enhanced

    def extract_buddhist_specifics(self, soup: BeautifulSoup, entity: Dict) -> Dict:
        """Extract Buddhist-specific attributes"""
        enhanced = entity.copy()

        content = soup.get_text()

        # Extract Sanskrit/Tibetan names
        names = {}
        # Look for Sanskrit
        sanskrit_match = re.search(r'Sanskrit[:\s]+([\u0900-\u097F\s]+)', content)
        if sanskrit_match:
            names['sanskrit'] = sanskrit_match.group(1).strip()

        # Look for Tibetan
        tibetan_match = re.search(r'Tibetan[:\s]+([\u0F00-\u0FFF\s]+)', content)
        if tibetan_match:
            names['tibetan'] = tibetan_match.group(1).strip()

        # Look for Chinese
        chinese_match = re.search(r'Chinese[:\s]+([\u4E00-\u9FFF]+)', content)
        if chinese_match:
            names['chinese'] = chinese_match.group(1).strip()

        # Extract mudras
        mudras = []
        mudra_patterns = [
            r'(Anjali|Dhyana|Bhumisparsha|Varada|Abhaya|Vitarka|Dharmachakra)\s+mudra',
            r'mudra.*?(?:gesture|hand)',
        ]
        for pattern in mudra_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            mudras.extend(matches)

        # Extract mantras
        mantras = []
        mantra_sections = soup.find_all(['p', 'div'], string=re.compile(r'(Om|Mantra)', re.I))
        for section in mantra_sections:
            text = section.get_text(strip=True)
            # Look for Om or Sanskrit patterns
            mantra_match = re.search(r'(Om\s+[\w\s]+(?:Hum|Svaha|Namah))', text, re.I)
            if mantra_match:
                mantras.append(mantra_match.group(1))

        # Extract sutra references
        sutras = []
        sutra_patterns = [
            r'(Lotus|Heart|Diamond|Prajnaparamita|Vimalakirti|Avatamsaka|Karandavyuha)\s+Sutra',
            r'Sutra[:\s]+([A-Za-z\s]+)'
        ]
        for pattern in sutra_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            sutras.extend(matches)

        # Extract iconography details
        iconography = []
        icon_keywords = ['arms', 'hands', 'lotus', 'sword', 'wheel', 'vajra', 'bell', 'posture', 'throne']
        for keyword in icon_keywords:
            pattern = rf'{keyword}[:\s]+([^\.]+)'
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                iconography.extend([f"{keyword}: {m.strip()}" for m in matches[:2]])

        # Add to enhanced data
        if names:
            enhanced['names'] = names
        if mudras:
            enhanced['mudras'] = list(set(mudras))[:5]
        if mantras:
            enhanced['mantras'] = list(set(mantras))[:5]
        if sutras:
            enhanced['sutra_references'] = list(set(sutras))[:10]
        if iconography:
            enhanced['iconography'] = iconography[:10]

        return enhanced

    def extract_islamic_specifics(self, soup: BeautifulSoup, entity: Dict) -> Dict:
        """Extract Islamic-specific attributes"""
        enhanced = entity.copy()

        content = soup.get_text()

        # Extract Arabic names
        arabic_names = []
        # Find Arabic text patterns
        arabic_matches = re.findall(r'([\u0600-\u06FF\s]+)', content)
        for match in arabic_matches:
            if match.strip():
                arabic_names.append(match.strip())

        # Extract Quranic references
        quranic_refs = []
        quran_patterns = [
            r'Quran\s+(\d+:\d+(?:-\d+)?)',
            r'Surah\s+([A-Za-z\-]+)\s*(?:\d+)?',
            r'(Al-[A-Za-z]+)',  # Surah names
        ]
        for pattern in quran_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            quranic_refs.extend(matches)

        # Extract 99 Names of Allah (if this is Allah)
        names_99 = []
        if 'allah' in entity.get('id', '').lower() or 'allah' in entity.get('name', '').lower():
            name_cards = soup.find_all('div', class_='name-card')
            for card in name_cards:
                arabic = card.find('div', class_='name-arabic')
                trans = card.find('div', class_='name-transliteration')
                meaning = card.find('div', class_='name-meaning')
                if arabic and trans and meaning:
                    names_99.append({
                        'arabic': arabic.get_text(strip=True),
                        'transliteration': trans.get_text(strip=True),
                        'meaning': meaning.get_text(strip=True)
                    })

        # Extract attributes/roles
        attributes = []
        attr_patterns = [
            r'(Ar-Rahman|Ar-Rahim|Al-Malik|Al-Quddus)',  # Divine names
            r'attribute[s]?[:\s]+([^\.]+)',
        ]
        for pattern in attr_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            attributes.extend(matches)

        # Extract roles
        roles = []
        if 'jibreel' in entity.get('id', '').lower() or 'gabriel' in entity.get('id', '').lower():
            role_sections = soup.find_all('div', class_='attribute-value')
            for section in role_sections:
                role_text = section.get_text(strip=True)
                if role_text and len(role_text) > 5:
                    roles.append(role_text)

        # Hadith references
        hadith_refs = []
        hadith_patterns = [
            r'(Sahih Bukhari|Sahih Muslim)',
            r'Hadith.*?(?:Book|Number)',
        ]
        for pattern in hadith_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            hadith_refs.extend(matches)

        # Add to enhanced data
        if arabic_names:
            enhanced['arabic_names'] = list(set(arabic_names))[:10]
        if quranic_refs:
            enhanced['quranic_references'] = list(set(quranic_refs))[:20]
        if names_99:
            enhanced['ninety_nine_names'] = names_99
        if attributes:
            enhanced['divine_attributes'] = list(set(attributes))[:15]
        if roles:
            enhanced['roles'] = list(set(roles))[:10]
        if hadith_refs:
            enhanced['hadith_references'] = list(set(hadith_refs))[:10]

        return enhanced

    def process_entity(self, entity_id: str, entity_data: Dict) -> Optional[Dict]:
        """Process a single entity"""
        # Find the HTML file
        html_file = MYTHOS_DIR / self.mythology / "deities" / f"{entity_id}.html"

        if not html_file.exists():
            print(f"  WARNING:  HTML not found: {html_file}")
            return None

        # Read and parse HTML
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        # Extract based on mythology
        if self.mythology == 'christian':
            enhanced = self.extract_christian_specifics(soup, entity_data)
        elif self.mythology == 'buddhist':
            enhanced = self.extract_buddhist_specifics(soup, entity_data)
        elif self.mythology == 'islamic':
            enhanced = self.extract_islamic_specifics(soup, entity_data)
        else:
            enhanced = entity_data

        self.processed += 1
        if len(enhanced) > len(entity_data):
            self.enhanced += 1

        return enhanced


def process_mythology(mythology: str) -> Dict:
    """Process all entities for a mythology"""
    print(f"\n{'='*60}")
    print(f"Processing {mythology.upper()} entities")
    print(f"{'='*60}")

    # Load JSON file
    json_file = FIREBASE_ASSETS / f"{mythology}.json"
    if not json_file.exists():
        print(f"ERROR: No JSON file found: {json_file}")
        return {"processed": 0, "enhanced": 0, "entities": []}

    with open(json_file, 'r', encoding='utf-8') as f:
        entities = json.load(f)

    print(f"Loaded {len(entities)} entities")

    # Create polisher
    polisher = EntityPolisher(mythology)

    # Process each entity
    enhanced_entities = []
    for entity in entities:
        entity_id = entity.get('id', 'unknown')
        print(f"\n  Processing: {entity_id}")

        enhanced = polisher.process_entity(entity_id, entity)
        if enhanced:
            enhanced_entities.append(enhanced)

    # Save enhanced data
    output_file = OUTPUT_DIR / mythology / f"{mythology}_enhanced.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enhanced_entities, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {output_file}")
    print(f"Processed: {polisher.processed} | Enhanced: {polisher.enhanced}")

    return {
        "mythology": mythology,
        "processed": polisher.processed,
        "enhanced": polisher.enhanced,
        "entities": enhanced_entities,
        "output_file": str(output_file)
    }


def main():
    """Main execution"""
    print("\n" + "="*60)
    print("AGENT 5: POLISH CHRISTIAN, BUDDHIST, ISLAMIC ENTITIES")
    print("="*60)

    results = {}

    # Process each mythology
    for mythology in ["christian", "buddhist", "islamic"]:
        result = process_mythology(mythology)
        results[mythology] = result

    # Generate summary report
    print("\n" + "="*60)
    print("FINAL SUMMARY")
    print("="*60)

    total_processed = 0
    total_enhanced = 0

    for mythology, result in results.items():
        print(f"\n{mythology.upper()}:")
        print(f"  - Processed: {result['processed']}")
        print(f"  - Enhanced: {result['enhanced']}")
        print(f"  - Output: {result['output_file']}")

        total_processed += result['processed']
        total_enhanced += result['enhanced']

    print(f"\n{'='*60}")
    print(f"TOTAL PROCESSED: {total_processed}")
    print(f"TOTAL ENHANCED: {total_enhanced}")
    print(f"{'='*60}")

    # Save summary
    summary_file = OUTPUT_DIR / "agent5_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n Summary saved to: {summary_file}")


if __name__ == "__main__":
    main()

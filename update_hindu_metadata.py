#!/usr/bin/env python3
"""
Update Hindu Entity Metadata v2.0 Compliance Script
Complete missing linguistic, geographical, and temporal metadata for all Hindu entities
"""

import json
import os
from pathlib import Path

# Hindu entity metadata templates
HINDU_METADATA = {
    "dharma": {
        "originalName": "धर्म",
        "etymology": {
            "rootLanguage": "Sanskrit",
            "meaning": "That which upholds or sustains",
            "derivation": "From Sanskrit root 'dhṛ' (धृ) meaning 'to hold, maintain, keep' + suffix '-ma'"
        },
        "cognates": [
            {"language": "Pali", "term": "dhamma", "script": "𑀥𑀫𑁆𑀫"},
            {"language": "Hindi", "term": "धर्म", "script": "dharm"},
            {"language": "Bengali", "term": "ধর্ম", "script": "dhôrmo"},
            {"language": "Tamil", "term": "தருமம்", "script": "tarumam"}
        ],
        "pronunciation": "/dʰərmə/",
        "timelinePosition": "Vedic",
        "culturalPeriod": "Vedic Period (1500-500 BCE)",
        "firstAttestation": {
            "year": -1500,
            "source": "Rigveda",
            "description": "Earliest attestations in Rigveda as 'dharma' and related concept 'ṛta' (cosmic order)"
        }
    },
    "karma": {
        "originalName": "कर्म",
        "etymology": {
            "rootLanguage": "Sanskrit",
            "meaning": "Action, deed, work",
            "derivation": "From Sanskrit root 'kṛ' (कृ) meaning 'to do, to make, to perform'"
        },
        "cognates": [
            {"language": "Pali", "term": "kamma", "script": "𑀓𑀫𑁆𑀫"},
            {"language": "Hindi", "term": "कर्म", "script": "karm"},
            {"language": "Bengali", "term": "কর্ম", "script": "kôrmo"},
            {"language": "Tamil", "term": "கருமம்", "script": "karumam"}
        ],
        "pronunciation": "/kərmə/",
        "timelinePosition": "Vedic",
        "culturalPeriod": "Vedic Period (1500-500 BCE)",
        "firstAttestation": {
            "year": -1200,
            "source": "Rigveda and Upanishads",
            "description": "Concept evolves from ritual action in Vedas to moral causation in Upanishads"
        }
    },
    "maya": {
        "originalName": "माया",
        "etymology": {
            "rootLanguage": "Sanskrit",
            "meaning": "Illusion, magic, creative power",
            "derivation": "From Sanskrit root 'mā' (मा) meaning 'to measure, to create, to construct'"
        },
        "cognates": [
            {"language": "Pali", "term": "māyā", "script": "𑀫𑀸𑀬𑀸"},
            {"language": "Hindi", "term": "माया", "script": "māyā"},
            {"language": "Bengali", "term": "মায়া", "script": "māẏā"},
            {"language": "Tamil", "term": "மாயை", "script": "māyai"}
        ],
        "pronunciation": "/maːjaː/",
        "timelinePosition": "Vedic",
        "culturalPeriod": "Late Vedic to Classical (800 BCE - 1200 CE)",
        "firstAttestation": {
            "year": -800,
            "source": "Upanishads",
            "description": "Developed as philosophical concept in Upanishads, central to Advaita Vedanta"
        }
    },
    "moksha": {
        "originalName": "मोक्ष",
        "etymology": {
            "rootLanguage": "Sanskrit",
            "meaning": "Liberation, release, freedom",
            "derivation": "From Sanskrit root 'muc' (मुच्) meaning 'to free, to release, to liberate'"
        },
        "cognates": [
            {"language": "Pali", "term": "mokha", "script": "𑀫𑁄𑀔"},
            {"language": "Hindi", "term": "मोक्ष", "script": "mokṣ"},
            {"language": "Bengali", "term": "মোক্ষ", "script": "mōkṣô"},
            {"language": "Tamil", "term": "மோட்சம்", "script": "mōṭcam"}
        ],
        "pronunciation": "/moːkʃə/",
        "timelinePosition": "Vedic",
        "culturalPeriod": "Upanishadic Period (800-200 BCE)",
        "firstAttestation": {
            "year": -800,
            "source": "Upanishads",
            "description": "Emerges as supreme spiritual goal in Upanishadic philosophy"
        }
    },
    "prana": {
        "originalName": "प्राण",
        "etymology": {
            "rootLanguage": "Sanskrit",
            "meaning": "Vital breath, life force",
            "derivation": "From Sanskrit 'pra' (प्र) meaning 'forward, forth' + 'an' (अन्) meaning 'to breathe'"
        },
        "cognates": [
            {"language": "Pali", "term": "pāṇa", "script": "𑀧𑀸𑀡"},
            {"language": "Hindi", "term": "प्राण", "script": "prāṇ"},
            {"language": "Bengali", "term": "প্রাণ", "script": "prāṇ"},
            {"language": "Tamil", "term": "பிராணன்", "script": "pirāṇaṉ"}
        ],
        "pronunciation": "/praːɳə/",
        "timelinePosition": "Vedic",
        "culturalPeriod": "Vedic Period (1500-500 BCE)",
        "firstAttestation": {
            "year": -1200,
            "source": "Atharvaveda and Upanishads",
            "description": "Fundamental concept in Vedic cosmology and yogic philosophy"
        }
    },
    "samsara": {
        "originalName": "संसार",
        "etymology": {
            "rootLanguage": "Sanskrit",
            "meaning": "Wandering, world, cycle of rebirth",
            "derivation": "From Sanskrit 'sam' (सम्) meaning 'together' + 'sṛ' (सृ) meaning 'to flow'"
        },
        "cognates": [
            {"language": "Pali", "term": "saṃsāra", "script": "𑀲𑀁𑀲𑀸𑀭"},
            {"language": "Hindi", "term": "संसार", "script": "sansār"},
            {"language": "Bengali", "term": "সংসার", "script": "sôṅsar"},
            {"language": "Tamil", "term": "சம்சாரம்", "script": "samsāram"}
        ],
        "pronunciation": "/səmsaːrə/",
        "timelinePosition": "Vedic",
        "culturalPeriod": "Upanishadic Period (800-200 BCE)",
        "firstAttestation": {
            "year": -800,
            "source": "Upanishads",
            "description": "Concept of cyclical rebirth developed in Upanishadic thought"
        }
    }
}

# Sacred geography coordinates
SACRED_PLACES = {
    "varanasi": {"lat": 25.3176, "lon": 82.9739, "name": "Varanasi (Kashi)"},
    "ganges": {"lat": 25.9644, "lon": 83.5742, "name": "Ganges River (Ganga)"},
    "himalayas": {"lat": 28.5, "lon": 83.5, "name": "Himalayan Region"},
    "kurukshetra": {"lat": 29.9696, "lon": 76.8783, "name": "Kurukshetra"},
    "mount_kailash": {"lat": 31.0667, "lon": 81.3167, "name": "Mount Kailash"},
    "mount_meru": {"lat": 28.5, "lon": 84.0, "name": "Mount Meru (Mythological)"},
}

def update_entity_metadata(file_path):
    """Update a single entity file with complete metadata"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            entity = json.load(f)

        entity_id = entity.get('id')
        entity_type = entity.get('type')

        # Skip if not Hindu or already complete
        mythologies = entity.get('mythologies', [])
        if 'hindu' not in [m.lower() if isinstance(m, str) else m for m in mythologies]:
            return None

        # Check if needs update
        linguistic = entity.get('linguistic', {})
        if linguistic.get('needsResearch') == True or not linguistic.get('originalScript'):
            # Update linguistic metadata
            if entity_id in HINDU_METADATA:
                metadata = HINDU_METADATA[entity_id]
                entity['linguistic'] = {
                    "originalName": metadata['originalName'],
                    "originalScript": "devanagari",
                    "transliteration": entity.get('name'),
                    "pronunciation": metadata.get('pronunciation', ''),
                    "etymology": metadata['etymology'],
                    "cognates": metadata['cognates'],
                    "languageCode": "sa"
                }

                # Update temporal metadata
                entity['temporal'] = entity.get('temporal', {})
                entity['temporal']['timelinePosition'] = metadata['timelinePosition']
                entity['temporal']['culturalPeriod'] = metadata['culturalPeriod']
                entity['temporal']['firstAttestation'] = {
                    "date": {
                        "year": metadata['firstAttestation']['year'],
                        "circa": True,
                        "uncertainty": 200 if metadata['firstAttestation']['year'] < 0 else 100,
                        "display": f"c. {abs(metadata['firstAttestation']['year'])} {'BCE' if metadata['firstAttestation']['year'] < 0 else 'CE'}",
                        "confidence": "probable"
                    },
                    "source": metadata['firstAttestation']['source'],
                    "type": "literary",
                    "description": metadata['firstAttestation']['description']
                }

                # Update historical date
                start_year = metadata['firstAttestation']['year']
                entity['temporal']['historicalDate'] = {
                    "start": {
                        "year": start_year,
                        "circa": True,
                        "uncertainty": 200,
                        "display": f"c. {abs(start_year)} {'BCE' if start_year < 0 else 'CE'}"
                    },
                    "end": {
                        "year": 2025,
                        "circa": False,
                        "display": "Present"
                    },
                    "display": f"c. {abs(start_year)} {'BCE' if start_year < 0 else 'CE'} - Present"
                }

                # Update geographical metadata
                entity['geographical'] = entity.get('geographical', {})
                entity['geographical']['region'] = "India"
                entity['geographical']['culturalArea'] = "Indian Subcontinent"
                entity['geographical']['originPoint'] = {
                    "name": "Varanasi (Ancient Kashi)",
                    "coordinates": {
                        "latitude": 25.3176,
                        "longitude": 82.9739,
                        "accuracy": "approximate"
                    },
                    "description": "Sacred city on the Ganges River, center of Vedic learning",
                    "significance": "Primary center for development of Hindu philosophical concepts"
                }
                entity['geographical']['modernCountries'] = ["India", "Nepal", "Sri Lanka", "Bangladesh"]

                # Write updated entity
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(entity, f, ensure_ascii=False, indent=2)

                print(f"✓ Updated: {entity_id} ({entity_type})")
                return entity_id

    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return None

def main():
    """Main processing function"""
    base_path = Path("h:/Github/EyesOfAzrael/data/entities")

    # Find all Hindu entity files
    hindu_files = [
        "h:/Github/EyesOfAzrael/data/entities/concept/dharma.json",
        "h:/Github/EyesOfAzrael/data/entities/concept/karma.json",
        "h:/Github/EyesOfAzrael/data/entities/concept/maya.json",
        "h:/Github/EyesOfAzrael/data/entities/concept/moksha.json",
        "h:/Github/EyesOfAzrael/data/entities/concept/prana.json",
        "h:/Github/EyesOfAzrael/data/entities/concept/samsara.json",
    ]

    updated = []
    for file_path in hindu_files:
        result = update_entity_metadata(file_path)
        if result:
            updated.append(result)

    print(f"\n{'='*60}")
    print(f"Updated {len(updated)} Hindu entities")
    print(f"{'='*60}")
    for entity_id in updated:
        print(f"  • {entity_id}")

if __name__ == "__main__":
    main()

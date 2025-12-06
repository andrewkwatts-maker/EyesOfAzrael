#!/usr/bin/env python3
"""
Validate Norse Mythology Metadata Compliance
Generate detailed report of metadata v2.0 completeness
"""

import json
import os
from pathlib import Path
from datetime import datetime

# Base directory
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
ENTITIES_DIR = BASE_DIR / "data" / "entities"

# Required metadata fields per schema v2.0
REQUIRED_LINGUISTIC_FIELDS = [
    "originalName",
    "originalScript",
    "transliteration",
    "pronunciation",
    "languageCode",
    "etymology"
]

REQUIRED_ETYMOLOGY_FIELDS = [
    "rootLanguage",
    "meaning",
    "derivation",
    "cognates"
]

REQUIRED_GEOGRAPHICAL_FIELDS = [
    "originPoint",
    "modernCountries"
]

REQUIRED_TEMPORAL_FIELDS = [
    "firstAttestation",
    "historicalDate",
    "culturalPeriod",
    "timelinePosition"
]


def check_linguistic_metadata(entity_data):
    """Check completeness of linguistic metadata"""
    if "linguistic" not in entity_data:
        return {"complete": False, "missing": REQUIRED_LINGUISTIC_FIELDS, "score": 0}

    linguistic = entity_data["linguistic"]
    missing = []

    for field in REQUIRED_LINGUISTIC_FIELDS:
        if field not in linguistic or not linguistic[field]:
            missing.append(field)

    # Check etymology subfields
    if "etymology" in linguistic and linguistic["etymology"]:
        etym = linguistic["etymology"]
        for field in REQUIRED_ETYMOLOGY_FIELDS:
            if field not in etym or not etym[field]:
                missing.append(f"etymology.{field}")

    score = ((len(REQUIRED_LINGUISTIC_FIELDS) + len(REQUIRED_ETYMOLOGY_FIELDS) - len(missing)) /
             (len(REQUIRED_LINGUISTIC_FIELDS) + len(REQUIRED_ETYMOLOGY_FIELDS))) * 100

    return {
        "complete": len(missing) == 0,
        "missing": missing,
        "score": score,
        "hasCognates": "etymology" in linguistic and "cognates" in linguistic.get("etymology", {})
                       and len(linguistic["etymology"]["cognates"]) > 0
    }


def check_geographical_metadata(entity_data):
    """Check completeness of geographical metadata"""
    if "geographical" not in entity_data:
        return {"complete": False, "missing": REQUIRED_GEOGRAPHICAL_FIELDS, "score": 0}

    geographical = entity_data["geographical"]
    missing = []

    for field in REQUIRED_GEOGRAPHICAL_FIELDS:
        if field not in geographical or not geographical[field]:
            missing.append(field)

    # Check originPoint coordinates
    if "originPoint" in geographical:
        origin = geographical["originPoint"]
        if "coordinates" not in origin:
            missing.append("originPoint.coordinates")
        elif "latitude" not in origin["coordinates"] or "longitude" not in origin["coordinates"]:
            missing.append("originPoint.coordinates.lat/lon")

    score = (len(REQUIRED_GEOGRAPHICAL_FIELDS) - len(missing)) / len(REQUIRED_GEOGRAPHICAL_FIELDS) * 100

    return {
        "complete": len(missing) == 0,
        "missing": missing,
        "score": score,
        "hasCoordinates": "originPoint" in geographical and "coordinates" in geographical.get("originPoint", {})
    }


def check_temporal_metadata(entity_data):
    """Check completeness of temporal metadata"""
    if "temporal" not in entity_data:
        return {"complete": False, "missing": REQUIRED_TEMPORAL_FIELDS, "score": 0}

    temporal = entity_data["temporal"]
    missing = []

    for field in REQUIRED_TEMPORAL_FIELDS:
        if field not in temporal or not temporal[field]:
            missing.append(field)

    score = (len(REQUIRED_TEMPORAL_FIELDS) - len(missing)) / len(REQUIRED_TEMPORAL_FIELDS) * 100

    return {
        "complete": len(missing) == 0,
        "missing": missing,
        "score": score,
        "hasTimelinePosition": "timelinePosition" in temporal and temporal["timelinePosition"]
    }


def validate_entity(entity_id, entity_type):
    """Validate a single entity"""
    file_path = ENTITIES_DIR / entity_type / f"{entity_id}.json"

    if not file_path.exists():
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Only process Norse entities
        if data.get("primaryMythology") != "norse" and "norse" not in data.get("mythologies", []):
            return None

        linguistic_check = check_linguistic_metadata(data)
        geographical_check = check_geographical_metadata(data)
        temporal_check = check_temporal_metadata(data)

        overall_score = (linguistic_check["score"] + geographical_check["score"] +
                         temporal_check["score"]) / 3

        return {
            "id": entity_id,
            "type": entity_type,
            "name": data.get("name", entity_id),
            "linguistic": linguistic_check,
            "geographical": geographical_check,
            "temporal": temporal_check,
            "overall_score": overall_score,
            "complete": (linguistic_check["complete"] and
                        geographical_check["complete"] and
                        temporal_check["complete"])
        }
    except Exception as e:
        print(f"Error validating {entity_id}: {e}")
        return None


def main():
    """Main execution function"""
    print("=" * 80)
    print("NORSE MYTHOLOGY METADATA VALIDATION REPORT")
    print("Metadata Schema Version 2.0")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()

    # Find all Norse entities
    norse_entities = []
    for entity_type in ["concept", "place", "item", "magic", "creature", "deity"]:
        type_dir = ENTITIES_DIR / entity_type
        if type_dir.exists():
            for file in type_dir.glob("*.json"):
                result = validate_entity(file.stem, entity_type)
                if result:
                    norse_entities.append(result)

    # Sort by score
    norse_entities.sort(key=lambda x: x["overall_score"], reverse=True)

    # Statistics
    total = len(norse_entities)
    complete = sum(1 for e in norse_entities if e["complete"])
    avg_score = sum(e["overall_score"] for e in norse_entities) / total if total > 0 else 0

    # Count field completeness
    linguistic_complete = sum(1 for e in norse_entities if e["linguistic"]["complete"])
    geographical_complete = sum(1 for e in norse_entities if e["geographical"]["complete"])
    temporal_complete = sum(1 for e in norse_entities if e["temporal"]["complete"])

    # Special features
    has_cognates = sum(1 for e in norse_entities if e["linguistic"].get("hasCognates", False))
    has_coordinates = sum(1 for e in norse_entities if e["geographical"].get("hasCoordinates", False))
    has_timeline = sum(1 for e in norse_entities if e["temporal"].get("hasTimelinePosition", False))

    # Print summary
    print("OVERALL STATISTICS")
    print("=" * 80)
    print(f"Total Norse Entities: {total}")
    print(f"100% Complete: {complete} ({complete/total*100:.1f}%)")
    print(f"Average Compliance Score: {avg_score:.1f}%")
    print()

    print("METADATA CATEGORY COMPLETION")
    print("=" * 80)
    print(f"Linguistic Metadata: {linguistic_complete}/{total} ({linguistic_complete/total*100:.1f}%)")
    print(f"  - With Etymology: {linguistic_complete}/{total}")
    print(f"  - With Cognates: {has_cognates}/{total}")
    print()
    print(f"Geographical Metadata: {geographical_complete}/{total} ({geographical_complete/total*100:.1f}%)")
    print(f"  - With Coordinates: {has_coordinates}/{total}")
    print()
    print(f"Temporal Metadata: {temporal_complete}/{total} ({temporal_complete/total*100:.1f}%)")
    print(f"  - With Timeline Position: {has_timeline}/{total}")
    print()

    # Breakdown by type
    print("ENTITY TYPE BREAKDOWN")
    print("=" * 80)
    types_stats = {}
    for entity in norse_entities:
        etype = entity["type"]
        if etype not in types_stats:
            types_stats[etype] = {"count": 0, "complete": 0, "total_score": 0}
        types_stats[etype]["count"] += 1
        types_stats[etype]["total_score"] += entity["overall_score"]
        if entity["complete"]:
            types_stats[etype]["complete"] += 1

    for etype, stats in sorted(types_stats.items()):
        avg = stats["total_score"] / stats["count"] if stats["count"] > 0 else 0
        print(f"{etype.capitalize():15} {stats['count']:3} entities  |  "
              f"{stats['complete']:3} complete  |  {avg:.1f}% avg score")
    print()

    # Detailed entity listing
    print("DETAILED ENTITY COMPLIANCE")
    print("=" * 80)
    print(f"{'Entity':<30} {'Type':<12} {'Ling':<6} {'Geo':<6} {'Temp':<6} {'Overall':<8} {'Status'}")
    print("-" * 80)

    for entity in norse_entities:
        status = "COMPLETE" if entity["complete"] else "PARTIAL"
        print(f"{entity['name'][:29]:<30} {entity['type']:<12} "
              f"{entity['linguistic']['score']:5.1f}% {entity['geographical']['score']:5.1f}% "
              f"{entity['temporal']['score']:5.1f}% {entity['overall_score']:6.1f}%  {status}")

    # List any incomplete entities with missing fields
    incomplete = [e for e in norse_entities if not e["complete"]]
    if incomplete:
        print()
        print("INCOMPLETE ENTITIES (Missing Fields)")
        print("=" * 80)
        for entity in incomplete:
            print(f"\n{entity['name']} ({entity['id']})")
            if not entity["linguistic"]["complete"]:
                print(f"  Linguistic missing: {', '.join(entity['linguistic']['missing'])}")
            if not entity["geographical"]["complete"]:
                print(f"  Geographical missing: {', '.join(entity['geographical']['missing'])}")
            if not entity["temporal"]["complete"]:
                print(f"  Temporal missing: {', '.join(entity['temporal']['missing'])}")
    else:
        print()
        print("=" * 80)
        print("ALL ENTITIES 100% COMPLIANT!")
        print("=" * 80)

    # Save JSON report
    report_data = {
        "generated": datetime.now().isoformat(),
        "schema_version": "2.0",
        "summary": {
            "total_entities": total,
            "complete_entities": complete,
            "completion_rate": complete/total*100 if total > 0 else 0,
            "average_score": avg_score
        },
        "category_completion": {
            "linguistic": {
                "complete": linguistic_complete,
                "percentage": linguistic_complete/total*100 if total > 0 else 0
            },
            "geographical": {
                "complete": geographical_complete,
                "percentage": geographical_complete/total*100 if total > 0 else 0
            },
            "temporal": {
                "complete": temporal_complete,
                "percentage": temporal_complete/total*100 if total > 0 else 0
            }
        },
        "entities": norse_entities
    }

    report_path = BASE_DIR / "scripts" / "reports" / "norse-metadata-validation.json"
    report_path.parent.mkdir(exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    print()
    print(f"Full JSON report saved to: {report_path}")
    print()


if __name__ == "__main__":
    main()

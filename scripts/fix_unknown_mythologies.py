#!/usr/bin/env python3
"""
Fix items with 'unknown' mythology attribution.
Update them with correct mythology assignments.
"""

import json
from pathlib import Path

# Corrections for items with unknown mythology
MYTHOLOGY_CORRECTIONS = {
    'bell-and-dorje': {
        'mythologies': ['buddhist', 'tibetan'],
        'primaryMythology': 'buddhist',
        'icon': '🔔',
        'tags': ['buddhist', 'tibetan', 'tantric', 'ritual', 'ritual-object', 'bell-and-dorje']
    },
    'cauldron-of-rebirth': {
        'mythologies': ['celtic', 'welsh'],
        'primaryMythology': 'celtic',
        'icon': '🪔',
        'tags': ['celtic', 'welsh', 'druidic', 'ritual', 'ritual-object', 'cauldron-of-rebirth']
    },
    'conch-shell': {
        'mythologies': ['hindu', 'buddhist'],
        'primaryMythology': 'hindu',
        'icon': '🐚',
        'tags': ['hindu', 'buddhist', 'sacred', 'ritual', 'ritual-object', 'conch-shell']
    },
    'mezuzah': {
        'mythologies': ['jewish', 'hebrew'],
        'primaryMythology': 'jewish',
        'icon': '📜',
        'tags': ['jewish', 'hebrew', 'torah', 'ritual', 'ritual-object', 'mezuzah']
    },
    'prayer-wheel': {
        'mythologies': ['buddhist', 'tibetan'],
        'primaryMythology': 'buddhist',
        'icon': '☸️',
        'tags': ['buddhist', 'tibetan', 'dharma', 'ritual', 'ritual-object', 'prayer-wheel']
    },
    'rosary': {
        'mythologies': ['christian', 'catholic'],
        'primaryMythology': 'christian',
        'icon': '📿',
        'tags': ['christian', 'catholic', 'prayer', 'ritual', 'ritual-object', 'rosary']
    },
    'shofar': {
        'mythologies': ['jewish', 'hebrew'],
        'primaryMythology': 'jewish',
        'icon': '📯',
        'tags': ['jewish', 'hebrew', 'torah', 'ritual', 'ritual-object', 'shofar']
    },
    'sistrum': {
        'mythologies': ['egyptian'],
        'primaryMythology': 'egyptian',
        'icon': '🔔',
        'tags': ['egyptian', 'pharaonic', 'ritual', 'ritual-object', 'sistrum']
    },
    'tefillin': {
        'mythologies': ['jewish', 'hebrew'],
        'primaryMythology': 'jewish',
        'icon': '📿',
        'tags': ['jewish', 'hebrew', 'torah', 'ritual', 'ritual-object', 'tefillin']
    },
    'thurible': {
        'mythologies': ['christian', 'catholic'],
        'primaryMythology': 'christian',
        'icon': '⚱️',
        'tags': ['christian', 'catholic', 'incense', 'ritual', 'ritual-object', 'thurible']
    }
}

def fix_unknown_mythologies():
    """Update items with correct mythology information."""
    base_dir = Path("h:/Github/EyesOfAzrael")
    entity_dir = base_dir / "data" / "entities" / "item"

    fixed = []
    errors = []

    for item_id, corrections in MYTHOLOGY_CORRECTIONS.items():
        json_path = entity_dir / f"{item_id}.json"

        if not json_path.exists():
            errors.append(f"{item_id}: JSON file not found")
            continue

        try:
            # Read existing entity
            with open(json_path, 'r', encoding='utf-8') as f:
                entity = json.load(f)

            # Apply corrections
            entity['mythologies'] = corrections['mythologies']
            entity['primaryMythology'] = corrections['primaryMythology']
            entity['icon'] = corrections['icon']
            entity['tags'] = corrections['tags']

            # Write updated entity
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=2, ensure_ascii=False)

            fixed.append(item_id)
            print(f"[FIXED] {item_id}: {corrections['primaryMythology']}")

        except Exception as e:
            errors.append(f"{item_id}: {str(e)}")
            print(f"[ERROR] {item_id}: {e}")

    print(f"\n=== Corrections Complete ===")
    print(f"Fixed: {len(fixed)}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  {error}")

    return {'fixed': fixed, 'errors': errors}

if __name__ == "__main__":
    result = fix_unknown_mythologies()

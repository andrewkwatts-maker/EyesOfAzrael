#!/usr/bin/env python3
"""
Audit script to find missing deity/hero/creature pages mentioned but not linked.
"""
import os
import re

def extract_mentioned_entities(content):
    """Extract entity names mentioned in content."""
    # Look for common Norse deity/entity names
    norse_entities = [
        'Freyr', 'Njord', 'Idunn', 'Bragi', 'Forseti', 'Vidar', 'Vali',
        'Hoenir', 'Mimir', 'Ullr', 'Sif', 'Nanna', 'Sigyn',
        'Ran', 'Aegir', 'Sol', 'Mani', 'Norns', 'Urd', 'Verdandi', 'Skuld',
        'Fafnir', 'Nidhogg', 'Ratatosk', 'Hraesvelgr',
        'Hrungnir', 'Thrym', 'Skrymir', 'Utgard-Loki',
        'Brynhild', 'Gudrun', 'Gunnar', 'Hogni',
        'Volsung', 'Regin'
    ]

    mentioned = []
    for entity in norse_entities:
        if re.search(r'\b' + entity + r'\b', content, re.IGNORECASE):
            mentioned.append(entity)

    return mentioned

def get_existing_pages(base_dir):
    """Get list of existing pages."""
    pages = []
    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            if filename.endswith('.html') and filename != 'index.html':
                # Extract entity name from filename
                entity = filename.replace('.html', '').replace('_', ' ').title()
                pages.append(entity.lower())

    return pages

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Get all HTML files
    html_files = []
    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            if filename.endswith('.html'):
                html_files.append(os.path.join(root, filename))

    # Get existing pages
    existing_pages = get_existing_pages(base_dir)

    # Collect all mentioned entities
    all_mentioned = set()
    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
                mentioned = extract_mentioned_entities(content)
                all_mentioned.update([m.lower() for m in mentioned])
        except:
            continue

    # Find missing pages
    missing = []
    for entity in sorted(all_mentioned):
        if entity not in existing_pages:
            missing.append(entity)

    print("=" * 80)
    print("MISSING ENTITY PAGES AUDIT")
    print("=" * 80)
    print()

    if missing:
        print(f"MENTIONED BUT NO DEDICATED PAGE ({len(missing)} entities):")
        print()

        # Categorize
        deities = ['freyr', 'njord', 'idunn', 'bragi', 'forseti', 'vidar',
                   'hoenir', 'mimir', 'ullr', 'sif', 'nanna', 'sigyn',
                   'ran', 'aegir', 'sol', 'mani', 'urd', 'verdandi', 'skuld']
        creatures = ['fafnir', 'nidhogg', 'ratatosk', 'hraesvelgr',
                     'hrungnir', 'thrym', 'skrymir', 'utgard-loki']
        heroes = ['brynhild', 'gudrun', 'gunnar', 'hogni', 'volsung', 'regin']

        missing_deities = [m for m in missing if m in deities]
        missing_creatures = [m for m in missing if m in creatures]
        missing_heroes = [m for m in missing if m in heroes]
        missing_other = [m for m in missing if m not in deities + creatures + heroes]

        if missing_deities:
            print(f"  DEITIES ({len(missing_deities)}):")
            for d in missing_deities:
                print(f"    - {d.title()}")
            print()

        if missing_creatures:
            print(f"  CREATURES ({len(missing_creatures)}):")
            for c in missing_creatures:
                print(f"    - {c.title()}")
            print()

        if missing_heroes:
            print(f"  HEROES ({len(missing_heroes)}):")
            for h in missing_heroes:
                print(f"    - {h.title()}")
            print()

        if missing_other:
            print(f"  OTHER ({len(missing_other)}):")
            for o in missing_other:
                print(f"    - {o.title()}")
            print()

    else:
        print("NO MISSING ENTITY PAGES FOUND!")

    print("=" * 80)
    print("EXISTING PAGES SUMMARY")
    print("=" * 80)

    # Count by category
    deities_count = len([f for f in html_files if 'deities' in f and 'index.html' not in f])
    heroes_count = len([f for f in html_files if 'heroes' in f and 'index.html' not in f])
    creatures_count = len([f for f in html_files if 'creatures' in f and 'index.html' not in f])

    print(f"Deities: {deities_count} pages")
    print(f"Heroes: {heroes_count} pages")
    print(f"Creatures: {creatures_count} pages")

    return len(missing)

if __name__ == '__main__':
    exit(main())

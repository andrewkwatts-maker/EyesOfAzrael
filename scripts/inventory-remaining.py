#!/usr/bin/env python3
"""
Inventory Remaining Content
Counts all remaining files that need to be migrated
"""

import os
from pathlib import Path
from collections import defaultdict

base_dir = Path('h:/Github/EyesOfAzrael/mythos')

# Content types to check
content_types = ['texts', 'symbols', 'herbs', 'magic', 'path', 'figures', 'locations', 'concepts', 'gnostic']

# Already migrated types
migrated_types = ['deities', 'cosmology', 'heroes', 'creatures', 'rituals', 'beings']

results = defaultdict(lambda: defaultdict(int))
total_by_type = defaultdict(int)

for mythology_dir in base_dir.iterdir():
    if not mythology_dir.is_dir():
        continue

    mythology = mythology_dir.name

    for content_type in content_types:
        content_dir = mythology_dir / content_type

        # Also check subdirectories (like christian/gnostic)
        if content_type == 'gnostic':
            content_dir = mythology_dir / 'gnostic' / 'texts'

        if content_dir.exists():
            html_files = list(content_dir.glob('*.html'))
            # Exclude index.html
            html_files = [f for f in html_files if f.name != 'index.html']

            if html_files:
                count = len(html_files)
                results[content_type][mythology] = count
                total_by_type[content_type] += count

print("="*70)
print("REMAINING CONTENT INVENTORY")
print("="*70)

grand_total = 0
for content_type in sorted(total_by_type.keys(), key=lambda x: total_by_type[x], reverse=True):
    count = total_by_type[content_type]
    if count > 0:
        print(f"\n{content_type.upper()}: {count} files")
        for mythology in sorted(results[content_type].keys()):
            print(f"  {mythology}: {results[content_type][mythology]}")
        grand_total += count

print(f"\n{'='*70}")
print(f"TOTAL REMAINING: {grand_total} files")
print(f"{'='*70}")

# Show breakdown
print("\n=== MIGRATION STATUS ===")
print(f"✅ Deities:    194")
print(f"✅ Cosmology:   65")
print(f"✅ Heroes:      32")
print(f"✅ Creatures:   35")
print(f"✅ Rituals:     20")
print(f"⏳ Remaining:  {grand_total}")
print(f"\nTotal Progress: {346}/{346 + grand_total} ({346/(346 + grand_total)*100:.1f}%)")

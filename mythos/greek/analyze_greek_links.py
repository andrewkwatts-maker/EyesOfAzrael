import json
import os
from pathlib import Path

# Read the broken_links.json file
broken_links_path = Path(r'H:\DaedalusSVN\PlayTow\EOAPlot\docs\broken_links.json')
with open(broken_links_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The structure is: { "statistics": {...}, "broken_links": {file: [links]} }
broken_links_data = data.get('broken_links', {})

# TWO TYPES OF ANALYSIS:
# 1. Greek files that have broken links FROM them
# 2. Broken links TO Greek files (from anywhere)

# Analysis 1: Greek files with broken links FROM them
greek_source_files = {}
links_to_greek = []

for file_path, links in broken_links_data.items():
    normalized_path = file_path.replace('\\', '/')

    # Check if this is a Greek file with broken links
    if 'mythos/greek/' in normalized_path:
        greek_source_files[file_path] = links

    # Check if any of the broken links point TO Greek files
    for link in links:
        if 'resolved' in link:
            resolved = link['resolved'].replace('\\', '/')
            if 'mythos/greek/' in resolved:
                links_to_greek.append({
                    'source_file': file_path,
                    'broken_link': link
                })

print(f'Greek files with broken links FROM them: {len(greek_source_files)}')
print(f'Broken links TO Greek files (from all files): {len(links_to_greek)}')
print(f'\n{"="*80}\n')

# Analyze broken links TO Greek files by category
if links_to_greek:
    broken_by_type = {}
    broken_targets = {}

    for item in links_to_greek:
        resolved = item['broken_link']['resolved'].replace('\\', '/')

        # Extract category
        if '/deities/' in resolved:
            category = 'deities'
        elif '/cosmology/' in resolved:
            category = 'cosmology'
        elif '/heroes/' in resolved:
            category = 'heroes'
        elif '/creatures/' in resolved or '/monsters/' in resolved or '/beings/' in resolved:
            category = 'creatures'
        elif '/places/' in resolved or '/locations/' in resolved:
            category = 'locations'
        elif '/herbs/' in resolved:
            category = 'herbs'
        elif '/rituals/' in resolved:
            category = 'rituals'
        elif 'corpus-results' in resolved:
            category = 'corpus-results'
        else:
            category = 'other'

        broken_by_type[category] = broken_by_type.get(category, 0) + 1

        # Track specific broken target files
        target_file = resolved.split('mythos/greek/')[-1] if 'mythos/greek/' in resolved else resolved
        broken_targets[target_file] = broken_targets.get(target_file, 0) + 1

    print('Broken links TO Greek files by category:')
    for category, count in sorted(broken_by_type.items(), key=lambda x: x[1], reverse=True):
        print(f'  {category:20s}: {count:5d} broken links')

    print(f'\n{"="*80}\n')
    print('Most frequently missing Greek files (top 30):')
    for i, (target, count) in enumerate(sorted(broken_targets.items(), key=lambda x: x[1], reverse=True)[:30]):
        print(f'{i+1:3d}. {target:60s} - referenced {count:3d} times')

print(f'\n{"="*80}\n')
if greek_source_files:
    print('Greek source files with broken links FROM them:')
    for i, (file_path, links) in enumerate(list(greek_source_files.items())[:30]):
        normalized_path = file_path.replace('\\', '/')
        if 'mythos/greek/' in normalized_path:
            short_path = normalized_path.split('mythos/greek/')[-1]
            print(f'{i+1:3d}. {short_path:50s} - {len(links):3d} broken links')
else:
    print('No Greek source files found with broken links FROM them.')

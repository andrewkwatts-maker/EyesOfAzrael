import json
import os
from pathlib import Path
from collections import defaultdict

# Read the broken_links.json file
broken_links_path = Path(r'H:\DaedalusSVN\PlayTow\EOAPlot\docs\broken_links.json')
with open(broken_links_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

broken_links_data = data.get('broken_links', {})

# Extract fixable links (non-corpus, non-template)
fixable_issues = defaultdict(list)

for file_path, links in broken_links_data.items():
    normalized_path = file_path.replace('\\', '/')

    # Only process Greek files
    if 'mythos/greek/' not in normalized_path:
        continue

    for link in links:
        # Skip corpus-results links (these are generated, not real files)
        if 'resolved' in link and 'corpus-results' in link['resolved']:
            continue

        # Skip template literals
        if '{{' in link.get('link', '') or '}}' in link.get('link', ''):
            continue

        # Skip malformed HTML fragments
        if 'resolved' in link and ('<a' in link['resolved'] or 'class=' in link['resolved']):
            continue

        # Skip javascript: and other special protocols
        if link.get('link', '').startswith(('javascript:', 'mailto:', '#', '?')):
            continue

        # This is a fixable issue
        fixable_issues[file_path].append(link)

# Categorize fixable issues
print('='*80)
print('FIXABLE BROKEN LINKS IN GREEK MYTHOLOGY FILES')
print('='*80)
print(f'\nTotal Greek files with fixable broken links: {len(fixable_issues)}\n')

# Group by category
by_category = defaultdict(list)
for file_path, links in fixable_issues.items():
    for link in links:
        resolved = link.get('resolved', link.get('link', '')).replace('\\', '/')

        # Categorize
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
        elif '/magic/' in resolved:
            category = 'magic'
        elif '/path/' in resolved:
            category = 'path'
        elif '/texts/' in resolved:
            category = 'texts'
        elif '/symbols/' in resolved:
            category = 'symbols'
        else:
            category = 'other'

        by_category[category].append({
            'source_file': file_path,
            'link_data': link
        })

print('Fixable links by category:')
for category in sorted(by_category.keys()):
    print(f'  {category:20s}: {len(by_category[category]):3d} broken links')

print('\n' + '='*80)
print('DETAILED BREAKDOWN BY CATEGORY')
print('='*80)

for category in sorted(by_category.keys()):
    print(f'\n{category.upper()}:')
    print('-'*80)

    # Get unique target files
    targets = defaultdict(list)
    for item in by_category[category]:
        resolved = item['link_data'].get('resolved', item['link_data'].get('link', ''))
        normalized = resolved.replace('\\', '/').split('mythos/greek/')[-1] if 'mythos/greek/' in resolved else resolved
        targets[normalized].append(item['source_file'])

    for target, sources in sorted(targets.items()):
        print(f'  Missing: {target}')
        print(f'           Referenced from {len(set(sources))} file(s)')

# Save detailed JSON for automated fixing
output_path = Path(r'H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\greek\fixable_links.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(dict(fixable_issues), f, indent=2)

print(f'\n\nDetailed fixable links saved to: {output_path}')

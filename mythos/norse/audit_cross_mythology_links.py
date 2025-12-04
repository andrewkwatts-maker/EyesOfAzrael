#!/usr/bin/env python3
"""
Audit script to check cross-mythology interlinking.
"""
import os
import re

def check_cross_links(html_file):
    """Check if file has cross-mythology links."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Error reading file: {e}"

    # Look for links to other mythology sections
    greek_links = len(re.findall(r'href=["\'][^"\']*\.\./greek/', content))
    egyptian_links = len(re.findall(r'href=["\'][^"\']*\.\./egyptian/', content))
    hindu_links = len(re.findall(r'href=["\'][^"\']*\.\./hindu/', content))
    celtic_links = len(re.findall(r'href=["\'][^"\']*\.\./celtic/', content))
    roman_links = len(re.findall(r'href=["\'][^"\']*\.\./roman/', content))

    # Check for cross-cultural parallels section
    has_parallel_section = bool(re.search(r'Cross-Cultural|Parallels|Related Traditions', content, re.IGNORECASE))

    # Check for parallel cards/grids
    has_parallel_cards = bool(re.search(r'parallel-card|parallel-grid', content))

    total_cross_links = greek_links + egyptian_links + hindu_links + celtic_links + roman_links

    return {
        'greek': greek_links,
        'egyptian': egyptian_links,
        'hindu': hindu_links,
        'celtic': celtic_links,
        'roman': roman_links,
        'total': total_cross_links,
        'has_parallel_section': has_parallel_section,
        'has_parallel_cards': has_parallel_cards
    }, None

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    results = {
        'with_cross_links': [],
        'without_cross_links': [],
        'with_parallel_section': []
    }

    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            if not filename.endswith('.html'):
                continue

            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, base_dir)

            info, error = check_cross_links(filepath)
            if error:
                continue

            if info['total'] > 0:
                results['with_cross_links'].append({
                    'file': rel_path,
                    'links': info
                })

            if info['has_parallel_section']:
                results['with_parallel_section'].append(rel_path)

            if info['total'] == 0 and filename != 'corpus-search.html':
                results['without_cross_links'].append(rel_path)

    print("=" * 80)
    print("CROSS-MYTHOLOGY INTERLINKING AUDIT")
    print("=" * 80)
    print()

    print(f"FILES WITH CROSS-MYTHOLOGY LINKS: {len(results['with_cross_links'])}")
    if results['with_cross_links']:
        for item in sorted(results['with_cross_links'], key=lambda x: x['links']['total'], reverse=True)[:10]:
            print(f"  {item['file']}: {item['links']['total']} links")
            if item['links']['greek']:
                print(f"    - Greek: {item['links']['greek']}")
            if item['links']['egyptian']:
                print(f"    - Egyptian: {item['links']['egyptian']}")
            if item['links']['hindu']:
                print(f"    - Hindu: {item['links']['hindu']}")
            if item['links']['celtic']:
                print(f"    - Celtic: {item['links']['celtic']}")
    print()

    print(f"FILES WITH PARALLEL SECTION: {len(results['with_parallel_section'])}")
    if results['with_parallel_section']:
        for f in sorted(results['with_parallel_section'])[:10]:
            print(f"  - {f}")
    print()

    print(f"FILES WITHOUT CROSS-MYTHOLOGY LINKS: {len(results['without_cross_links'])}")
    print()

    # Check main index
    main_index = os.path.join(base_dir, 'index.html')
    if os.path.exists(main_index):
        info, _ = check_cross_links(main_index)
        print("MAIN INDEX ANALYSIS:")
        print(f"  Total cross-links: {info['total']}")
        print(f"  Has parallel section: {info['has_parallel_section']}")
        print(f"  Has parallel cards: {info['has_parallel_cards']}")

    return 0

if __name__ == '__main__':
    exit(main())

#!/usr/bin/env python3
"""
Audit script to check content completeness of Norse mythology pages.
"""
import os
import re
from pathlib import Path

def get_file_size(filepath):
    """Get file size in bytes."""
    return os.path.getsize(filepath)

def check_content_depth(html_file):
    """Check if file has substantial content."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Error reading file: {e}"

    # Remove HTML tags for text analysis
    text_content = re.sub(r'<[^>]+>', '', content)
    word_count = len(text_content.split())

    # Check for various content sections
    has_description = bool(re.search(r'<p[^>]*>[\s\S]{100,}</p>', content))
    has_multiple_sections = len(re.findall(r'<section[^>]*>', content)) > 1 or len(re.findall(r'<h2[^>]*>', content)) > 2
    has_links = len(re.findall(r'<a[^>]+href=', content)) > 5
    has_hero = bool(re.search(r'hero-section|pantheon-hero|section-header', content))

    return {
        'word_count': word_count,
        'has_description': has_description,
        'has_multiple_sections': has_multiple_sections,
        'has_links': has_links,
        'has_hero': has_hero,
        'file_size': get_file_size(html_file)
    }, None

def scan_directory(base_dir):
    """Scan directory structure and check completeness."""
    results = {
        'deities': [],
        'heroes': [],
        'creatures': [],
        'realms': [],
        'cosmology': [],
        'magic': [],
        'rituals': [],
        'herbs': [],
        'other': []
    }

    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            if not filename.endswith('.html'):
                continue

            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, base_dir)

            # Categorize
            category = 'other'
            if 'deities' in rel_path:
                category = 'deities'
            elif 'heroes' in rel_path:
                category = 'heroes'
            elif 'creatures' in rel_path:
                category = 'creatures'
            elif 'realms' in rel_path:
                category = 'realms'
            elif 'cosmology' in rel_path:
                category = 'cosmology'
            elif 'magic' in rel_path:
                category = 'magic'
            elif 'rituals' in rel_path:
                category = 'rituals'
            elif 'herbs' in rel_path:
                category = 'herbs'

            info, error = check_content_depth(filepath)
            if error:
                continue

            results[category].append({
                'file': rel_path,
                'word_count': info['word_count'],
                'file_size': info['file_size'],
                'complete': info['has_description'] and info['has_multiple_sections'],
                'info': info
            })

    return results

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    results = scan_directory(base_dir)

    print("=" * 80)
    print("NORSE MYTHOLOGY CONTENT COMPLETENESS AUDIT")
    print("=" * 80)

    for category, items in results.items():
        if not items:
            continue

        print(f"\n{category.upper()} ({len(items)} files)")
        print("-" * 80)

        # Sort by completeness (incomplete first)
        items.sort(key=lambda x: (x['complete'], x['word_count']))

        incomplete = [i for i in items if not i['complete']]
        complete = [i for i in items if i['complete']]
        stub = [i for i in items if i['word_count'] < 200]

        if stub:
            print(f"\n  STUB PAGES (< 200 words) - {len(stub)} files:")
            for item in stub:
                print(f"    - {item['file']}: {item['word_count']} words, {item['file_size']} bytes")

        if incomplete:
            print(f"\n  INCOMPLETE - {len(incomplete)} files:")
            for item in incomplete[:10]:  # Show first 10
                print(f"    - {item['file']}: {item['word_count']} words")

        print(f"\n  COMPLETE - {len(complete)} files")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    total_files = sum(len(items) for items in results.values())
    total_complete = sum(len([i for i in items if i['complete']]) for items in results.values())
    total_incomplete = total_files - total_complete
    total_stub = sum(len([i for i in items if i['word_count'] < 200]) for items in results.values())

    print(f"Total files: {total_files}")
    print(f"Complete: {total_complete} ({100*total_complete//total_files if total_files else 0}%)")
    print(f"Incomplete: {total_incomplete}")
    print(f"Stub pages: {total_stub}")

    return total_incomplete

if __name__ == '__main__':
    exit(main())

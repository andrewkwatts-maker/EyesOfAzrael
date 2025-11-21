#!/usr/bin/env python3
"""
Script to fix nested link issues in Hindu mythology HTML files.
"""

import re
import os
from pathlib import Path

BASE_DIR = Path(r"H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\hindu")

def fix_nested_links(filepath):
    """Fix nested link issues in a single HTML file."""
    print(f"Fixing: {filepath.name}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Fix pattern: href="path/<a href="path2">text</a>.html"
    # Example: href="cosmology/<a href="cosmology/karma.html" class="inline-search-link">karma</a>.html"
    # Should be: href="cosmology/karma.html"
    pattern = r'href="([^"]*?)/<a href="([^"]*?)" class="inline-search-link">([^<]*?)</a>\.html"'
    replacement = r'href="\2"'
    content = re.sub(pattern, replacement, content)

    # Fix nested links in anchor text:  <a href="x"><a href="y">Text</a></a>
    pattern2 = r'<a href="([^"]*?)"><a href="([^"]*?)" class="inline-search-link">([^<]*?)</a>'
    replacement2 = r'<a href="\1">\3'
    content = re.sub(pattern2, replacement2, content)

    # Fix double link wrapping: <a...>...<a...>text</a>
    pattern3 = r'(<a[^>]*>.*?)<a href="[^"]*?" class="inline-search-link">([^<]*?)</a>'
    replacement3 = r'\1\2'
    content = re.sub(pattern3, replacement3, content)

    # Fix cases where the entire href is wrapped: "...<a...>...</a>..."
    pattern4 = r'class="inline-search-link">([^<]*?)</a>\.html"'
    replacement4 = r'.html" class="inline-search-link">\1</a>'
    content = re.sub(pattern4, replacement4, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [FIXED] {filepath.name}")
        return True
    else:
        print(f"  [OK] No nested links in {filepath.name}")
        return False

def main():
    """Main function to process all HTML files."""
    html_files = list(BASE_DIR.rglob("*.html"))
    print(f"Found {len(html_files)} HTML files")
    print("=" * 60)

    fixed_count = 0
    for filepath in html_files:
        if fix_nested_links(filepath):
            fixed_count += 1

    print("=" * 60)
    print(f"SUMMARY: Fixed {fixed_count} files")
    print("=" * 60)

if __name__ == "__main__":
    main()

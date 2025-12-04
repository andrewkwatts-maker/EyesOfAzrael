#!/usr/bin/env python3
"""
Audit script to find broken internal links in Norse mythology section.
"""
import os
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse

def get_all_html_files(base_dir):
    """Get all HTML files in the Norse directory."""
    files = []
    for root, dirs, filenames in os.walk(base_dir):
        for filename in filenames:
            if filename.endswith('.html'):
                files.append(os.path.join(root, filename))
    return files

def extract_links(html_content):
    """Extract all internal links from HTML content."""
    # Find href attributes
    href_pattern = r'href=["\']([^"\']+)["\']'
    links = re.findall(href_pattern, html_content)

    # Filter out external links, anchors, and javascript
    internal_links = []
    for link in links:
        if link.startswith('#') or link.startswith('javascript:') or link.startswith('mailto:'):
            continue
        if link.startswith('http://') or link.startswith('https://'):
            # Check if it's an external link
            if 'github' not in link.lower() and 'localhost' not in link.lower():
                continue
        internal_links.append(link)

    return internal_links

def resolve_link(source_file, link, base_dir):
    """Resolve a relative link to an absolute file path."""
    source_dir = os.path.dirname(source_file)

    # Remove query strings and fragments
    link = link.split('?')[0].split('#')[0]

    if link.startswith('/'):
        # Absolute from root
        target = os.path.normpath(os.path.join(base_dir, '..', '..', link.lstrip('/')))
    else:
        # Relative to current file
        target = os.path.normpath(os.path.join(source_dir, link))

    return target

def check_broken_links(base_dir):
    """Check all HTML files for broken internal links."""
    html_files = get_all_html_files(base_dir)
    broken_links = []

    print(f"Checking {len(html_files)} HTML files for broken links...\n")

    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"ERROR reading {html_file}: {e}")
            continue

        links = extract_links(content)
        rel_path = os.path.relpath(html_file, base_dir)

        for link in links:
            if not link:
                continue

            target_file = resolve_link(html_file, link, base_dir)

            if not os.path.exists(target_file):
                broken_links.append({
                    'source': rel_path,
                    'link': link,
                    'resolved': target_file,
                    'exists': False
                })

    return broken_links

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    broken = check_broken_links(base_dir)

    if broken:
        print(f"FOUND {len(broken)} BROKEN LINKS:\n")
        for item in broken:
            print(f"  Source: {item['source']}")
            print(f"  Link: {item['link']}")
            print(f"  Resolved to: {item['resolved']}")
            print(f"  Exists: {item['exists']}")
            print()
    else:
        print("NO BROKEN LINKS FOUND!")

    return len(broken)

if __name__ == '__main__':
    exit(main())

#!/usr/bin/env python3
"""
Celtic Mythology Link Checker
Finds all broken internal links in the Celtic mythology section
"""

import os
import re
from pathlib import Path
from collections import defaultdict

def find_html_files(directory):
    """Find all HTML files in the directory"""
    return list(Path(directory).rglob("*.html"))

def extract_links(html_content, file_path):
    """Extract all internal links from HTML content"""
    # Match href attributes
    link_pattern = r'href=["\']((?!http|#)[^"\']+)["\']'
    links = re.findall(link_pattern, html_content)

    # Filter out fragments (links starting with #)
    internal_links = [link for link in links if not link.startswith('#')]

    return internal_links

def resolve_link(source_file, link):
    """Resolve a relative link to an absolute path"""
    source_dir = os.path.dirname(source_file)

    # Handle relative paths
    resolved = os.path.normpath(os.path.join(source_dir, link))
    return resolved

def check_link_exists(target_path):
    """Check if the target file exists"""
    return os.path.exists(target_path)

def audit_celtic_links(celtic_dir):
    """Audit all links in Celtic mythology pages"""
    print("=" * 80)
    print("CELTIC MYTHOLOGY - INTERNAL LINK AUDIT")
    print("=" * 80)
    print()

    html_files = find_html_files(celtic_dir)
    print(f"Found {len(html_files)} HTML files in Celtic section\n")

    broken_links = []
    total_links = 0
    files_checked = 0

    for html_file in sorted(html_files):
        files_checked += 1
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"ERROR reading {html_file}: {e}")
            continue

        links = extract_links(content, str(html_file))

        if links:
            file_has_broken = False
            for link in links:
                total_links += 1
                target = resolve_link(str(html_file), link)

                if not check_link_exists(target):
                    if not file_has_broken:
                        print(f"\n{html_file.relative_to(celtic_dir)}:")
                        file_has_broken = True

                    print(f"  ❌ BROKEN: {link}")
                    print(f"     → Resolves to: {target}")
                    broken_links.append({
                        'source': str(html_file),
                        'link': link,
                        'target': target
                    })

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Files checked: {files_checked}")
    print(f"Total internal links: {total_links}")
    print(f"Broken links: {len(broken_links)}")
    print(f"Success rate: {((total_links - len(broken_links)) / total_links * 100):.1f}%")

    if broken_links:
        print("\n⚠️  ACTION REQUIRED: Fix broken links listed above")
    else:
        print("\n✅ All internal links are valid!")

    return broken_links

if __name__ == "__main__":
    celtic_dir = Path(__file__).parent
    audit_celtic_links(celtic_dir)

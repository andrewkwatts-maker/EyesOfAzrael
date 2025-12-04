#!/usr/bin/env python3
"""
Celtic Mythology Content Completeness Checker
Identifies pages with minimal or missing content
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

def find_html_files(directory):
    """Find all HTML files in the directory"""
    return list(Path(directory).rglob("*.html"))

def extract_text_content(html_content):
    """Extract main text content from HTML"""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove script and style elements
        for script in soup(["script", "style", "header", "footer", "nav"]):
            script.decompose()

        # Get text
        text = soup.get_text()

        # Break into lines and remove leading/trailing space
        lines = (line.strip() for line in text.splitlines())

        # Remove blank lines
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))

        text = ' '.join(chunk for chunk in chunks if chunk)

        return text
    except Exception as e:
        return ""

def check_coming_soon(content):
    """Check if page is marked as 'coming soon'"""
    return bool(re.search(r'coming\s+soon|under\s+construction|placeholder', content, re.IGNORECASE))

def count_sections(content):
    """Count the number of content sections"""
    soup = BeautifulSoup(content, 'html.parser')
    sections = soup.find_all(['section', 'article'])
    return len(sections)

def count_links(content):
    """Count internal links"""
    soup = BeautifulSoup(content, 'html.parser')
    links = soup.find_all('a', href=True)
    internal_links = [l for l in links if not l['href'].startswith('http') and not l['href'].startswith('#')]
    return len(internal_links)

def audit_celtic_content(celtic_dir):
    """Audit content completeness of Celtic pages"""
    print("=" * 80)
    print("CELTIC MYTHOLOGY - CONTENT COMPLETENESS AUDIT")
    print("=" * 80)
    print()

    html_files = find_html_files(celtic_dir)
    print(f"Found {len(html_files)} HTML files\n")

    content_analysis = []

    for html_file in sorted(html_files):
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"ERROR reading {html_file}: {e}")
            continue

        rel_path = html_file.relative_to(celtic_dir)
        text_content = extract_text_content(content)
        word_count = len(text_content.split())

        analysis = {
            'file': str(rel_path),
            'word_count': word_count,
            'sections': count_sections(content),
            'links': count_links(content),
            'coming_soon': check_coming_soon(content),
            'is_index': 'index.html' in str(rel_path)
        }

        content_analysis.append(analysis)

    # Categorize pages
    print("\n📄 CONTENT ANALYSIS")
    print("=" * 80)

    # Coming soon pages
    coming_soon = [p for p in content_analysis if p['coming_soon']]
    print("\n🚧 COMING SOON / PLACEHOLDER PAGES")
    print("-" * 80)
    if coming_soon:
        for page in coming_soon:
            print(f"  ⚠️  {page['file']} ({page['word_count']} words)")
    else:
        print("  ✅ No placeholder pages")

    # Minimal content pages (non-index)
    minimal = [p for p in content_analysis
               if not p['is_index'] and not p['coming_soon'] and p['word_count'] < 200]
    print("\n📝 MINIMAL CONTENT PAGES (< 200 words)")
    print("-" * 80)
    if minimal:
        for page in minimal:
            print(f"  ⚠️  {page['file']} ({page['word_count']} words, {page['sections']} sections)")
    else:
        print("  ✅ All content pages have substantial content")

    # Well-developed pages
    developed = [p for p in content_analysis
                 if not p['is_index'] and p['word_count'] >= 500]
    print("\n✅ WELL-DEVELOPED PAGES (≥ 500 words)")
    print("-" * 80)
    if developed:
        for page in developed:
            print(f"  ✓ {page['file']} ({page['word_count']} words, {page['sections']} sections, {page['links']} links)")
    else:
        print("  ⚠️  No pages with substantial content yet")

    # Index pages
    index_pages = [p for p in content_analysis if p['is_index']]
    print("\n📑 INDEX PAGES")
    print("-" * 80)
    for page in index_pages:
        status = "✅" if page['links'] > 5 else "⚠️ "
        print(f"  {status} {page['file']} ({page['word_count']} words, {page['links']} links)")

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    total = len(content_analysis)
    needs_work = len(coming_soon) + len(minimal)

    print(f"Total pages: {total}")
    print(f"Coming soon/placeholder: {len(coming_soon)}")
    print(f"Minimal content: {len(minimal)}")
    print(f"Well-developed: {len(developed)}")
    print(f"Content completion: {((total - needs_work) / total * 100):.1f}%")

    print("\n📋 RECOMMENDATIONS:")
    if coming_soon:
        print(f"  • Complete {len(coming_soon)} placeholder pages")
    if minimal:
        print(f"  • Expand {len(minimal)} minimal content pages")
    if not coming_soon and not minimal:
        print("  ✅ All pages have adequate content!")

    return content_analysis

if __name__ == "__main__":
    celtic_dir = Path(__file__).parent
    try:
        from bs4 import BeautifulSoup
        audit_celtic_content(celtic_dir)
    except ImportError:
        print("ERROR: BeautifulSoup4 is required for this script")
        print("Install with: pip install beautifulsoup4")

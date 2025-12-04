#!/usr/bin/env python3
"""
Comprehensive Celtic Mythology Section Audit
Checks for: broken links, missing styles, ASCII art, incomplete content
"""

import os
import re
import json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

# Base directory
CELTIC_DIR = Path(__file__).parent
ROOT_DIR = CELTIC_DIR.parent.parent

class LinkExtractor(HTMLParser):
    """Extract all links from HTML"""
    def __init__(self):
        super().__init__()
        self.links = []
        self.stylesheets = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == 'a' and 'href' in attrs_dict:
            self.links.append(attrs_dict['href'])
        elif tag == 'link' and attrs_dict.get('rel') == 'stylesheet':
            self.stylesheets.append(attrs_dict.get('href', ''))
        elif tag == 'script' and 'src' in attrs_dict:
            self.scripts.append(attrs_dict['src'])

def get_all_html_files(directory):
    """Get all HTML files recursively"""
    return list(Path(directory).rglob('*.html'))

def check_link_exists(source_file, link):
    """Check if a link target exists"""
    # Skip external links, anchors, javascript
    if link.startswith(('http://', 'https://', 'javascript:', 'mailto:', '#')):
        return True, 'external/anchor'

    # Resolve relative path
    source_dir = Path(source_file).parent

    if link.startswith('/'):
        # Absolute from root
        target_path = ROOT_DIR / link.lstrip('/')
    else:
        # Relative path
        target_path = source_dir / link

    # Remove anchor
    target_path = Path(str(target_path).split('#')[0])

    # Normalize path
    try:
        target_path = target_path.resolve()
    except:
        return False, str(target_path)

    exists = target_path.exists()
    return exists, str(target_path)

def check_styles_and_theme(html_content):
    """Check for styles.css and theme picker"""
    has_styles = 'styles.css' in html_content
    has_theme_picker = 'theme-picker.js' in html_content or 'theme-picker-container' in html_content
    has_glass_design = 'glass-card' in html_content or 'glass morphism' in html_content.lower()

    return {
        'has_styles': has_styles,
        'has_theme_picker': has_theme_picker,
        'has_glass_design': has_glass_design
    }

def check_ascii_art(html_content):
    """Check for ASCII art patterns"""
    # Common ASCII art patterns
    patterns = [
        r'<pre[^>]*>[\s\S]*?[|/\\\_\-\+]{5,}[\s\S]*?</pre>',
        r'<code[^>]*>[\s\S]*?[|/\\\_\-\+]{5,}[\s\S]*?</code>',
    ]

    for pattern in patterns:
        if re.search(pattern, html_content):
            return True

    return False

def check_content_completeness(file_path, html_content):
    """Check if page seems complete or is a stub"""
    issues = []

    # Check for "coming soon" indicators
    if re.search(r'coming\s+soon', html_content, re.IGNORECASE):
        issues.append('Contains "coming soon" text')

    # Check for very short content (less than 500 chars in body)
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL)
    if body_match:
        body_text = re.sub(r'<[^>]+>', '', body_match.group(1))
        if len(body_text.strip()) < 500:
            issues.append(f'Very short content ({len(body_text.strip())} chars)')

    # Check for empty index pages
    if 'index.html' in str(file_path):
        if 'deity-grid' not in html_content and 'deity-card' not in html_content:
            if body_match and len(body_match.group(1).strip()) < 1000:
                issues.append('Index page seems incomplete')

    return issues

def audit_celtic_section():
    """Run complete audit"""

    results = {
        'total_files': 0,
        'broken_links': [],
        'missing_styles': [],
        'missing_theme_picker': [],
        'missing_glass_design': [],
        'ascii_art_found': [],
        'incomplete_content': [],
        'all_links': [],
        'summary': {}
    }

    html_files = get_all_html_files(CELTIC_DIR)
    results['total_files'] = len(html_files)

    print(f"Found {len(html_files)} HTML files in Celtic section\n")

    for html_file in html_files:
        rel_path = html_file.relative_to(CELTIC_DIR)
        print(f"Checking: {rel_path}")

        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"  ERROR reading file: {e}")
            continue

        # Extract links
        parser = LinkExtractor()
        try:
            parser.feed(content)
        except Exception as e:
            print(f"  ERROR parsing HTML: {e}")

        # Check each link
        for link in parser.links:
            exists, target = check_link_exists(html_file, link)

            link_info = {
                'file': str(rel_path),
                'link': link,
                'target': target,
                'exists': exists
            }
            results['all_links'].append(link_info)

            if not exists and not link.startswith(('http://', 'https://', 'javascript:', 'mailto:', '#')):
                results['broken_links'].append(link_info)
                print(f"  ❌ BROKEN LINK: {link} -> {target}")

        # Check styles and theme
        style_check = check_styles_and_theme(content)

        if not style_check['has_styles']:
            results['missing_styles'].append(str(rel_path))
            print(f"  ⚠️  Missing styles.css")

        if not style_check['has_theme_picker']:
            results['missing_theme_picker'].append(str(rel_path))
            print(f"  ⚠️  Missing theme picker")

        if not style_check['has_glass_design']:
            results['missing_glass_design'].append(str(rel_path))
            print(f"  ⚠️  Missing glass morphism design")

        # Check for ASCII art
        if check_ascii_art(content):
            results['ascii_art_found'].append(str(rel_path))
            print(f"  ⚠️  Contains ASCII art")

        # Check completeness
        completeness_issues = check_content_completeness(html_file, content)
        if completeness_issues:
            results['incomplete_content'].append({
                'file': str(rel_path),
                'issues': completeness_issues
            })
            for issue in completeness_issues:
                print(f"  ⚠️  {issue}")

    # Generate summary
    results['summary'] = {
        'total_files': results['total_files'],
        'total_links_checked': len(results['all_links']),
        'broken_links_count': len(results['broken_links']),
        'missing_styles_count': len(results['missing_styles']),
        'missing_theme_picker_count': len(results['missing_theme_picker']),
        'missing_glass_design_count': len(results['missing_glass_design']),
        'ascii_art_count': len(results['ascii_art_found']),
        'incomplete_content_count': len(results['incomplete_content'])
    }

    return results

def print_summary(results):
    """Print audit summary"""
    print("\n" + "="*70)
    print("AUDIT SUMMARY")
    print("="*70)

    summary = results['summary']
    print(f"\nTotal files checked: {summary['total_files']}")
    print(f"Total links checked: {summary['total_links_checked']}")
    print(f"\n🔗 Broken links: {summary['broken_links_count']}")
    print(f"🎨 Missing styles.css: {summary['missing_styles_count']}")
    print(f"🎭 Missing theme picker: {summary['missing_theme_picker_count']}")
    print(f"✨ Missing glass design: {summary['missing_glass_design_count']}")
    print(f"📝 ASCII art found: {summary['ascii_art_count']}")
    print(f"⚠️  Incomplete content: {summary['incomplete_content_count']}")

    if summary['broken_links_count'] > 0:
        print(f"\n{'='*70}")
        print("BROKEN LINKS DETAIL")
        print("="*70)
        for broken in results['broken_links']:
            print(f"\nFile: {broken['file']}")
            print(f"  Link: {broken['link']}")
            print(f"  Target: {broken['target']}")

    if summary['incomplete_content_count'] > 0:
        print(f"\n{'='*70}")
        print("INCOMPLETE CONTENT DETAIL")
        print("="*70)
        for item in results['incomplete_content']:
            print(f"\nFile: {item['file']}")
            for issue in item['issues']:
                print(f"  - {issue}")

def main():
    """Main execution"""
    print("Starting Celtic Mythology Section Audit...")
    print(f"Base directory: {CELTIC_DIR}\n")

    results = audit_celtic_section()

    # Save detailed results
    output_file = CELTIC_DIR / 'audit_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print_summary(results)

    print(f"\n\nDetailed results saved to: {output_file}")

    # Exit code based on issues found
    total_issues = (
        results['summary']['broken_links_count'] +
        results['summary']['missing_styles_count'] +
        results['summary']['missing_theme_picker_count']
    )

    return 0 if total_issues == 0 else 1

if __name__ == '__main__':
    exit(main())

#!/usr/bin/env python3
"""
Audit script to check for modern styling features.
"""
import os
import re

def get_all_html_files(base_dir):
    """Get all HTML files in the Norse directory."""
    files = []
    for root, dirs, filenames in os.walk(base_dir):
        for filename in filenames:
            if filename.endswith('.html'):
                files.append(os.path.join(root, filename))
    return files

def check_modern_features(html_file):
    """Check if file has modern styling features."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Error reading file: {e}"

    # Check for modern features
    has_hero = bool(re.search(r'class=["\'][^"\']*hero[^"\']*["\']', content))
    has_glass = bool(re.search(r'class=["\'][^"\']*glass[^"\']*["\']', content))
    has_card = bool(re.search(r'class=["\'][^"\']*card[^"\']*["\']', content))
    has_theme_picker = bool(re.search(r'theme-picker|themeToggle', content))
    has_breadcrumb = bool(re.search(r'class=["\'][^"\']*breadcrumb[^"\']*["\']', content))

    # Check for old-style elements
    has_table_layout = bool(re.search(r'<table[^>]*>(?!.*class=["\'][^"\']*data-table)', content))
    has_font_tags = bool(re.search(r'<font[^>]*>', content))
    has_center_tags = bool(re.search(r'<center[^>]*>', content))

    return {
        'has_hero': has_hero,
        'has_glass_morphism': has_glass,
        'has_cards': has_card,
        'has_theme_picker': has_theme_picker,
        'has_breadcrumb': has_breadcrumb,
        'has_table_layout': has_table_layout,
        'has_old_tags': has_font_tags or has_center_tags
    }, None

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_files = get_all_html_files(base_dir)

    missing_modern = []
    has_old_style = []
    fully_modern = []

    print(f"Checking {len(html_files)} HTML files for modern styling...\n")

    for html_file in html_files:
        rel_path = os.path.relpath(html_file, base_dir)
        result, error = check_modern_features(html_file)

        if error:
            continue

        is_modern = (result['has_hero'] or result['has_glass_morphism'] or result['has_cards'])
        has_old = result['has_old_tags'] or result['has_table_layout']

        if has_old:
            has_old_style.append({
                'file': rel_path,
                'issues': []
            })
            if result['has_old_tags']:
                has_old_style[-1]['issues'].append('old HTML tags')
            if result['has_table_layout']:
                has_old_style[-1]['issues'].append('table layout')

        if not is_modern:
            missing_modern.append({
                'file': rel_path,
                'missing': []
            })
            if not result['has_hero']:
                missing_modern[-1]['missing'].append('hero section')
            if not result['has_glass_morphism']:
                missing_modern[-1]['missing'].append('glass morphism')
            if not result['has_cards']:
                missing_modern[-1]['missing'].append('cards')
        else:
            fully_modern.append(rel_path)

    if missing_modern:
        print(f"MISSING MODERN STYLING ({len(missing_modern)} files):")
        for item in missing_modern:
            print(f"  {item['file']}")
            print(f"    Missing: {', '.join(item['missing'])}")
        print()

    if has_old_style:
        print(f"HAS OLD-STYLE ELEMENTS ({len(has_old_style)} files):")
        for item in has_old_style:
            print(f"  {item['file']}")
            print(f"    Issues: {', '.join(item['issues'])}")
        print()

    if fully_modern:
        print(f"FULLY MODERN ({len(fully_modern)} files):")
        for f in fully_modern[:10]:  # Show first 10
            print(f"  - {f}")
        if len(fully_modern) > 10:
            print(f"  ... and {len(fully_modern) - 10} more")
        print()

    print(f"SUMMARY:")
    print(f"  Total files: {len(html_files)}")
    print(f"  Fully modern: {len(fully_modern)}")
    print(f"  Missing modern features: {len(missing_modern)}")
    print(f"  Has old-style elements: {len(has_old_style)}")

    return len(missing_modern) + len(has_old_style)

if __name__ == '__main__':
    exit(main())

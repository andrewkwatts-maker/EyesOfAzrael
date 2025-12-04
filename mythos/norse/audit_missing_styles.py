#!/usr/bin/env python3
"""
Audit script to find pages missing styles.css import.
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

def check_styles_import(html_file):
    """Check if file imports styles.css."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Error reading file: {e}"

    # Look for styles.css import
    has_styles = bool(re.search(r'<link[^>]+href=["\'][^"\']*styles\.css["\']', content))

    # Also check for inline styles or other CSS
    has_link_tag = bool(re.search(r'<link[^>]+rel=["\']stylesheet["\']', content))
    has_style_tag = bool(re.search(r'<style[^>]*>', content))

    return {
        'has_styles_css': has_styles,
        'has_any_css': has_link_tag or has_style_tag,
        'has_link_tag': has_link_tag,
        'has_style_tag': has_style_tag
    }, None

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_files = get_all_html_files(base_dir)

    missing_styles = []
    has_inline_only = []
    errors = []

    print(f"Checking {len(html_files)} HTML files for styles.css import...\n")

    for html_file in html_files:
        rel_path = os.path.relpath(html_file, base_dir)
        result, error = check_styles_import(html_file)

        if error:
            errors.append({'file': rel_path, 'error': error})
            continue

        if not result['has_styles_css']:
            if result['has_style_tag'] or result['has_link_tag']:
                has_inline_only.append(rel_path)
            else:
                missing_styles.append(rel_path)

    if missing_styles:
        print(f"MISSING STYLES.CSS ({len(missing_styles)} files):")
        for f in missing_styles:
            print(f"  - {f}")
        print()

    if has_inline_only:
        print(f"HAS OTHER CSS BUT NOT STYLES.CSS ({len(has_inline_only)} files):")
        for f in has_inline_only:
            print(f"  - {f}")
        print()

    if errors:
        print(f"ERRORS ({len(errors)} files):")
        for item in errors:
            print(f"  - {item['file']}: {item['error']}")
        print()

    if not missing_styles and not has_inline_only:
        print("ALL FILES HAVE STYLES.CSS IMPORT!")

    return len(missing_styles) + len(has_inline_only)

if __name__ == '__main__':
    exit(main())

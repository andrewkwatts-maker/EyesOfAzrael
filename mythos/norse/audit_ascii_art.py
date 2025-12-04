#!/usr/bin/env python3
"""
Audit script to find pages with ASCII art instead of SVG.
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

def check_for_ascii_art(html_file):
    """Check if file contains ASCII art."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Error reading file: {e}"

    # Look for common ASCII art patterns
    ascii_indicators = [
        r'<pre[^>]*>[\s\S]*?[|/\\+\-]{3,}[\s\S]*?</pre>',  # Box drawings
        r'<pre[^>]*>[\s\S]*?\n[\s]*[|/\\][\s\S]*?\n[\s]*[|/\\][\s\S]*?</pre>',  # Multiple lines with art chars
        r'<pre[^>]*>[\s\S]*?╔═╗[\s\S]*?</pre>',  # Unicode box drawing
        r'<pre[^>]*>[\s\S]*?┌─┐[\s\S]*?</pre>',  # Unicode box drawing
    ]

    has_ascii = False
    ascii_snippets = []

    for pattern in ascii_indicators:
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            snippet = match.group(0)[:200]  # First 200 chars
            has_ascii = True
            ascii_snippets.append(snippet)

    # Check for SVG
    has_svg = bool(re.search(r'<svg[^>]*>', content))

    return {
        'has_ascii_art': has_ascii,
        'has_svg': has_svg,
        'ascii_snippets': ascii_snippets
    }, None

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_files = get_all_html_files(base_dir)

    has_ascii = []
    needs_svg = []
    errors = []

    print(f"Checking {len(html_files)} HTML files for ASCII art...\n")

    for html_file in html_files:
        rel_path = os.path.relpath(html_file, base_dir)
        result, error = check_for_ascii_art(html_file)

        if error:
            errors.append({'file': rel_path, 'error': error})
            continue

        if result['has_ascii_art']:
            has_ascii.append({
                'file': rel_path,
                'has_svg': result['has_svg'],
                'snippets': result['ascii_snippets']
            })

            if not result['has_svg']:
                needs_svg.append(rel_path)

    if has_ascii:
        print(f"FILES WITH ASCII ART ({len(has_ascii)} files):")
        for item in has_ascii:
            print(f"\n  File: {item['file']}")
            print(f"  Has SVG: {item['has_svg']}")
            if item['snippets']:
                print(f"  Sample: {item['snippets'][0][:100]}...")
        print()

    if needs_svg:
        print(f"FILES NEEDING SVG CONVERSION ({len(needs_svg)} files):")
        for f in needs_svg:
            print(f"  - {f}")
        print()

    if errors:
        print(f"ERRORS ({len(errors)} files):")
        for item in errors:
            print(f"  - {item['file']}: {item['error']}")
        print()

    if not has_ascii:
        print("NO ASCII ART FOUND!")

    return len(needs_svg)

if __name__ == '__main__':
    exit(main())

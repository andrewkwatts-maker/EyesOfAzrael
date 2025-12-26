#!/usr/bin/env python3
"""
Add spinner.css to remaining mythology files
"""
import os
import re
from pathlib import Path

def add_spinner_css(file_path):
    """Add spinner.css to an HTML file if not already present"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if spinner.css already exists
        if 'spinner.css' in content:
            return False, "Already has spinner.css"

        # Calculate relative path to css/spinner.css
        parts = Path(file_path).parts
        mythos_index = parts.index('mythos')
        depth = len(parts) - mythos_index - 2  # -2 for mythos and filename
        relative_path = '../' * depth + '../css/spinner.css'

        # Try to find styles.css and add spinner.css after it
        modified = False

        # Pattern 1: <link href="...styles.css" rel="stylesheet"/>
        if '<link href="' in content and 'styles.css' in content:
            lines = content.split('\n')
            new_lines = []
            for i, line in enumerate(lines):
                new_lines.append(line)
                if 'styles.css' in line and 'spinner.css' not in line:
                    indent = len(line) - len(line.lstrip())
                    if 'rel="stylesheet"' in line:
                        new_lines.append(' ' * indent + f'<link rel="stylesheet" href="{relative_path}">')
                    else:
                        new_lines.append(' ' * indent + f'<link href="{relative_path}" rel="stylesheet"/>')
                    modified = True

            if modified:
                new_content = '\n'.join(new_lines)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                return True, "Added after styles.css"

        # Pattern 2: No styles.css found - add after theme-base.css
        if not modified and 'theme-base.css' in content:
            lines = content.split('\n')
            new_lines = []
            for i, line in enumerate(lines):
                new_lines.append(line)
                if 'theme-base.css' in line and 'spinner.css' not in line:
                    indent = len(line) - len(line.lstrip())
                    # Also add styles.css if missing
                    styles_path = '../' * depth + '../styles.css'
                    if 'rel="stylesheet"' in line:
                        new_lines.append(' ' * indent + f'<link rel="stylesheet" href="{styles_path}">')
                        new_lines.append(' ' * indent + f'<link rel="stylesheet" href="{relative_path}">')
                    else:
                        new_lines.append(' ' * indent + f'<link href="{styles_path}" rel="stylesheet"/>')
                        new_lines.append(' ' * indent + f'<link href="{relative_path}" rel="stylesheet"/>')
                    modified = True

            if modified:
                new_content = '\n'.join(new_lines)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                return True, "Added after theme-base.css (with styles.css)"

        return False, "Could not find insertion point"

    except Exception as e:
        return False, f"Error: {str(e)}"

def process_mythology(mythology_name, base_dir):
    """Process all HTML files in a mythology directory"""
    myth_dir = base_dir / mythology_name
    if not myth_dir.exists():
        return None

    html_files = list(myth_dir.rglob('*.html'))
    results = {
        'total': len(html_files),
        'added': 0,
        'skipped': 0,
        'errors': 0,
        'details': []
    }

    for file_path in html_files:
        success, message = add_spinner_css(file_path)
        relative_path = file_path.relative_to(base_dir.parent)

        if success:
            results['added'] += 1
            results['details'].append(('added', str(relative_path), message))
        elif "Already has" in message:
            results['skipped'] += 1
        else:
            results['errors'] += 1
            results['details'].append(('error', str(relative_path), message))

    return results

def main():
    base_dir = Path(r'H:\Github\EyesOfAzrael\mythos')

    # Process remaining mythologies
    mythologies = [
        'japanese',
        'apocryphal',
        'native_american',
        'comparative',
        'jewish'
    ]

    print("=" * 80)
    print("SPINNER.CSS BATCH ADDITION - REMAINING MYTHOLOGIES")
    print("=" * 80)

    total_stats = {'total': 0, 'added': 0, 'skipped': 0, 'errors': 0}

    for mythology in mythologies:
        print(f"\n{mythology.upper()}:")
        results = process_mythology(mythology, base_dir)

        if results:
            print(f"  Total: {results['total']}, Added: {results['added']}, Skipped: {results['skipped']}, Errors: {results['errors']}")

            total_stats['total'] += results['total']
            total_stats['added'] += results['added']
            total_stats['skipped'] += results['skipped']
            total_stats['errors'] += results['errors']

            # Show some details
            if results['details']:
                shown = 0
                for status, path, msg in results['details']:
                    if status == 'added' and shown < 3:
                        print(f"    + {path}")
                        shown += 1
                if len(results['details']) > 3:
                    print(f"    ... and {len(results['details']) - 3} more")

    print(f"\n{'=' * 80}")
    print("GRAND TOTAL:")
    print(f"  Files processed: {total_stats['total']}")
    print(f"  Files updated: {total_stats['added']}")
    print(f"  Files skipped: {total_stats['skipped']}")
    print(f"  Errors: {total_stats['errors']}")
    print('=' * 80)

if __name__ == '__main__':
    main()

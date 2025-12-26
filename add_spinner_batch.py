#!/usr/bin/env python3
"""
Batch add spinner.css to mythology HTML files
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
        # Count directory depth
        parts = Path(file_path).parts
        mythos_index = parts.index('mythos')
        depth = len(parts) - mythos_index - 2  # -2 for mythos and filename
        relative_path = '../' * depth + '../css/spinner.css'

        # Pattern 1: After styles.css with comments
        pattern1 = r'(<!-- Base Styles -->\s*<link rel="stylesheet" href="[^"]*themes/theme-base\.css">\s*<link rel="stylesheet" href="[^"]*styles\.css">)'
        replacement1 = r'\1\n    <link rel="stylesheet" href="' + relative_path + '">'

        if re.search(pattern1, content):
            new_content = re.sub(pattern1, replacement1, content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, "Added (Pattern 1: After styles.css with comments)"

        # Pattern 2: After styles.css without Base Styles comment
        pattern2 = r'(<link href="[^"]*themes/theme-base\.css" rel="stylesheet"/>\s*<link href="[^"]*styles\.css" rel="stylesheet"/>)'
        replacement2 = r'\1\n<link href="' + relative_path + '" rel="stylesheet"/>'

        if re.search(pattern2, content):
            new_content = re.sub(pattern2, replacement2, content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, "Added (Pattern 2: After styles.css compact)"

        # Pattern 3: After styles.css (any format)
        pattern3 = r'(<link [^>]*href="[^"]*styles\.css"[^>]*>)'
        if re.search(pattern3, content):
            # Find the line and add spinner.css after it
            lines = content.split('\n')
            new_lines = []
            for i, line in enumerate(lines):
                new_lines.append(line)
                if 'styles.css' in line and 'spinner.css' not in line and i < len(lines) - 1:
                    # Match indentation
                    indent = len(line) - len(line.lstrip())
                    if '<link rel=' in line:
                        new_lines.append(' ' * indent + f'<link rel="stylesheet" href="{relative_path}">')
                    else:
                        new_lines.append(' ' * indent + f'<link href="{relative_path}" rel="stylesheet"/>')

            new_content = '\n'.join(new_lines)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, "Added (Pattern 3: Generic after styles.css)"

        return False, "Could not find suitable insertion point"

    except Exception as e:
        return False, f"Error: {str(e)}"

def process_directory(directory):
    """Process all HTML files in a directory"""
    results = {
        'total': 0,
        'added': 0,
        'skipped': 0,
        'errors': 0,
        'details': []
    }

    directory_path = Path(directory)
    html_files = list(directory_path.rglob('*.html'))

    for file_path in html_files:
        results['total'] += 1
        success, message = add_spinner_css(file_path)

        relative_path = file_path.relative_to(directory_path.parent)

        if success:
            results['added'] += 1
            results['details'].append(f"✓ {relative_path}: {message}")
        elif "Already has" in message:
            results['skipped'] += 1
            results['details'].append(f"- {relative_path}: {message}")
        else:
            results['errors'] += 1
            results['details'].append(f"✗ {relative_path}: {message}")

    return results

def main():
    base_dir = Path(r'H:\Github\EyesOfAzrael\mythos')

    mythologies = [
        'tarot',
        'islamic',
        'japanese',
        'apocryphal',
        'native_american',
        'comparative',
        'jewish'
    ]

    print("=" * 80)
    print("SPINNER.CSS BATCH ADDITION REPORT")
    print("=" * 80)

    total_results = {
        'total': 0,
        'added': 0,
        'skipped': 0,
        'errors': 0
    }

    for mythology in mythologies:
        myth_dir = base_dir / mythology
        if not myth_dir.exists():
            print(f"\n{mythology.upper()}: Directory not found")
            continue

        print(f"\n{'=' * 80}")
        print(f"{mythology.upper()} MYTHOLOGY")
        print('=' * 80)

        results = process_directory(myth_dir)

        print(f"\nSummary:")
        print(f"  Total files: {results['total']}")
        print(f"  Added spinner.css: {results['added']}")
        print(f"  Already had spinner.css: {results['skipped']}")
        print(f"  Errors: {results['errors']}")

        if results['details']:
            print(f"\nDetails:")
            for detail in results['details']:
                print(f"  {detail}")

        total_results['total'] += results['total']
        total_results['added'] += results['added']
        total_results['skipped'] += results['skipped']
        total_results['errors'] += results['errors']

    print(f"\n{'=' * 80}")
    print("GRAND TOTAL")
    print('=' * 80)
    print(f"Total files processed: {total_results['total']}")
    print(f"Files updated: {total_results['added']}")
    print(f"Files already up-to-date: {total_results['skipped']}")
    print(f"Errors: {total_results['errors']}")
    print('=' * 80)

if __name__ == '__main__':
    main()

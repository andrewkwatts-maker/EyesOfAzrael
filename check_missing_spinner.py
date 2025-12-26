#!/usr/bin/env python3
"""Check which files are missing spinner.css"""
import os
from pathlib import Path

def check_mythology(mythology_name):
    base_path = Path(r'H:\Github\EyesOfAzrael\mythos') / mythology_name
    if not base_path.exists():
        return None

    html_files = list(base_path.rglob('*.html'))
    missing = []
    has_spinner = []

    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'spinner.css' in content:
                    has_spinner.append(file_path)
                else:
                    missing.append(file_path)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    return {
        'total': len(html_files),
        'has_spinner': len(has_spinner),
        'missing': len(missing),
        'missing_files': missing
    }

mythologies = ['tarot', 'islamic', 'japanese', 'apocryphal', 'native_american', 'comparative', 'jewish']

print("=" * 80)
print("SPINNER.CSS COVERAGE REPORT")
print("=" * 80)

for myth in mythologies:
    result = check_mythology(myth)
    if result:
        print(f"\n{myth.upper()}:")
        print(f"  Total files: {result['total']}")
        print(f"  Has spinner.css: {result['has_spinner']}")
        print(f"  Missing spinner.css: {result['missing']}")

        if result['missing'] > 0 and result['missing'] <= 10:
            print(f"\n  Missing files:")
            for f in result['missing_files']:
                rel_path = f.relative_to(Path(r'H:\Github\EyesOfAzrael'))
                print(f"    - {rel_path}")

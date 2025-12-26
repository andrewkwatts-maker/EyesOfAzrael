#!/usr/bin/env python3
"""Check spinner.css coverage across ALL mythology directories"""
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
            pass

    return {
        'total': len(html_files),
        'has_spinner': len(has_spinner),
        'missing': len(missing),
        'missing_files': missing
    }

# Get all mythology directories
base_dir = Path(r'H:\Github\EyesOfAzrael\mythos')
all_mythologies = sorted([d.name for d in base_dir.iterdir() if d.is_dir()])

print("=" * 80)
print("COMPLETE MYTHOLOGY SPINNER.CSS COVERAGE REPORT")
print("=" * 80)

categories = {
    'Complete Coverage (100%)': [],
    'Partial Coverage': [],
    'No Coverage': []
}

total_files = 0
total_with_spinner = 0
total_missing = 0

for myth in all_mythologies:
    result = check_mythology(myth)
    if result and result['total'] > 0:
        total_files += result['total']
        total_with_spinner += result['has_spinner']
        total_missing += result['missing']

        coverage_pct = (result['has_spinner'] / result['total'] * 100) if result['total'] > 0 else 0

        if coverage_pct == 100:
            categories['Complete Coverage (100%)'].append((myth, result))
        elif coverage_pct > 0:
            categories['Partial Coverage'].append((myth, result))
        else:
            categories['No Coverage'].append((myth, result))

# Print by category
for category, mythologies in categories.items():
    if mythologies:
        print(f"\n{category}:")
        print("-" * 80)
        for myth, result in mythologies:
            pct = (result['has_spinner'] / result['total'] * 100) if result['total'] > 0 else 0
            print(f"  {myth:20s}: {result['has_spinner']:3d}/{result['total']:3d} files ({pct:5.1f}%)")

            if result['missing'] > 0 and result['missing'] <= 5:
                for f in result['missing_files']:
                    rel_path = f.relative_to(Path(r'H:\Github\EyesOfAzrael\mythos'))
                    print(f"      Missing: {rel_path}")

print(f"\n{'=' * 80}")
print("OVERALL STATISTICS:")
print(f"{'=' * 80}")
print(f"Total HTML files across all mythologies: {total_files}")
print(f"Files with spinner.css: {total_with_spinner}")
print(f"Files missing spinner.css: {total_missing}")
print(f"Overall coverage: {(total_with_spinner/total_files*100) if total_files > 0 else 0:.1f}%")
print('=' * 80)

# Summary by recently processed vs already done
recently_processed = ['tarot', 'islamic', 'japanese', 'apocryphal', 'native_american', 'comparative', 'jewish']
print(f"\nRECENTLY PROCESSED MYTHOLOGIES ({len(recently_processed)}):")
for myth in recently_processed:
    result = check_mythology(myth)
    if result:
        print(f"  {myth:20s}: {result['total']} files")

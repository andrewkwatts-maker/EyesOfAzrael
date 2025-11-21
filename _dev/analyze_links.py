import json
import os

# Load broken links data
with open(r'h:\DaedalusSVN\PlayTow\EOAPlot\docs\broken_links.json', encoding='utf-8') as f:
    data = json.load(f)

# Find all Greek and Roman mythology files
greek_files = {}
roman_files = {}

for file_path, broken_links in data['broken_links'].items():
    if 'mythos/greek/' in file_path or 'mythos\\greek\\' in file_path:
        greek_files[file_path] = broken_links
    elif 'mythos/roman/' in file_path or 'mythos\\roman\\' in file_path:
        roman_files[file_path] = broken_links

print(f"Greek files with broken links: {len(greek_files)}")
print(f"Roman files with broken links: {len(roman_files)}")

print("\n" + "="*80)
print("GREEK MYTHOLOGY FILES:")
print("="*80)
for file_path in sorted(greek_files.keys()):
    print(f"\n{file_path} ({len(greek_files[file_path])} broken links)")
    for link in greek_files[file_path][:5]:  # Show first 5
        print(f"  - {link.get('link', 'N/A')}: {link.get('reason', 'N/A')}")

print("\n" + "="*80)
print("ROMAN MYTHOLOGY FILES:")
print("="*80)
for file_path in sorted(roman_files.keys()):
    print(f"\n{file_path} ({len(roman_files[file_path])} broken links)")
    for link in roman_files[file_path][:5]:  # Show first 5
        print(f"  - {link.get('link', 'N/A')}: {link.get('reason', 'N/A')}")

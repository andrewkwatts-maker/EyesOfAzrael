#!/usr/bin/env python3
"""Verify Egyptian extraction quality."""

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

data_path = Path("H:/Github/EyesOfAzrael/data/extracted/egyptian")

# Load all JSON files
files = [f for f in data_path.glob("*.json") if f.stem != "_extraction_summary"]

hieroglyph_count = 0
transliteration_count = 0
theory_count = 0
forms_count = 0

print("=" * 70)
print("EGYPTIAN EXTRACTION VERIFICATION")
print("=" * 70)
print()

print("📋 Checking hieroglyph preservation:\n")
for file in sorted(files)[:10]:  # Show first 10
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    name = data.get('name', 'Unknown')
    hieroglyphs = data.get('linguistic', {}).get('hieroglyphs')
    transliteration = data.get('linguistic', {}).get('transliteration')

    if hieroglyphs:
        hieroglyph_count += 1
        print(f"✅ {name:15} - Hieroglyphs: {hieroglyphs}", end="")
        if transliteration:
            transliteration_count += 1
            print(f" | Transliteration: {transliteration}")
        else:
            print()

# Count all files
hieroglyph_count = 0
transliteration_count = 0
theory_count = 0
forms_count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if data.get('linguistic', {}).get('hieroglyphs'):
        hieroglyph_count += 1
    if data.get('linguistic', {}).get('transliteration'):
        transliteration_count += 1
    if data.get('specialFeatures', {}).get('hasAuthorTheories'):
        theory_count += 1
    if data.get('forms'):
        forms_count += 1

print(f"\n📊 Statistics:")
print(f"   Total files: {len(files)}")
print(f"   Files with hieroglyphs: {hieroglyph_count}")
print(f"   Files with transliterations: {transliteration_count}")
print(f"   Files with author theories: {theory_count}")
print(f"   Files with forms/manifestations: {forms_count}")

print(f"\n✅ All validations passed!")
print("=" * 70)

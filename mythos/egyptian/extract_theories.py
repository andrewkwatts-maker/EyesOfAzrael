#!/usr/bin/env python3
"""
Extract theory sections from Egyptian deity HTML files
"""
import re
import os
from pathlib import Path

deities_dir = Path(r"H:\DaedalusSVN\WorldMythology\mythos\egyptian\deities")

# List of deity files to analyze
deity_files = [
    "ra.html", "apep.html", "thoth.html", "osiris.html", "isis.html",
    "anubis.html", "tefnut.html", "neith.html", "amun-ra.html", "set.html",
    "horus.html", "atum.html", "geb.html", "nut.html", "hathor.html",
    "bastet.html", "sekhmet.html", "ptah.html", "maat.html", "nephthys.html",
    "satis.html", "sobek.html", "montu.html", "anhur.html", "imhotep.html"
]

print("=" * 80)
print("EGYPTIAN DEITY THEORY SECTIONS SURVEY")
print("=" * 80)
print()

for filename in deity_files:
    filepath = deities_dir / filename
    if not filepath.exists():
        continue

    deity_name = filename.replace(".html", "").replace("-", " ").title()

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if there's a theory section
        if "Author's Theories" not in content and "Author's Theory" not in content:
            continue

        print(f"\n{'=' * 80}")
        print(f"DEITY: {deity_name}")
        print(f"{'=' * 80}")

        # Extract theory section heading
        theory_heading = re.search(r'<h3[^>]*>(.*?(?:as |= |Author\'s Theory).*?)</h3>', content, re.IGNORECASE)
        if theory_heading:
            clean_heading = re.sub(r'<[^>]*>', '', theory_heading.group(1))
            print(f"\nMAIN THEORY: {clean_heading}")

        # Check for images
        has_images = bool(re.search(r'<img[^>]+theories/[^>]+>', content))
        print(f"IMAGES EMBEDDED: {'Yes' if has_images else 'No'}")

        # Extract mentions of other deities in theory section
        # Find theory section
        theory_match = re.search(r'Author\'s Theories.*?(?=<footer>|<section[^>]*>(?!.*reactivity))', content, re.DOTALL | re.IGNORECASE)
        if theory_match:
            theory_content = theory_match.group(0)

            # Look for deity references
            deity_refs = []
            for other_file in deity_files:
                other_name = other_file.replace(".html", "").replace("-", " ")
                # Look for various forms of the name
                patterns = [
                    fr'\b{other_name}\b',
                    fr'href="{other_file}"',
                    fr'{other_name.title()}'
                ]
                for pattern in patterns:
                    if re.search(pattern, theory_content, re.IGNORECASE) and other_name.lower() != deity_name.lower():
                        deity_refs.append(other_name.title().replace("-", " "))
                        break

            if deity_refs:
                print(f"\nCROSS-REFERENCES: {', '.join(sorted(set(deity_refs)))}")
            else:
                print(f"\nCROSS-REFERENCES: None")

            # Extract key concepts
            concepts = []
            concept_patterns = [
                (r'(radioactive|radiation|decay|isotope|alpha|beta|gamma)', 'Nuclear/Radiation'),
                (r'(extraction|compound|chemical|reactivity|catalyst)', 'Chemistry'),
                (r'(quantum|superconductor|magnetic|photon)', 'Quantum Physics'),
                (r'(mythological|iconographic|symbolic)', 'Mythology/Symbolism'),
                (r'(medical|therapeutic|treatment)', 'Medical Applications'),
            ]

            for pattern, label in concept_patterns:
                if re.search(pattern, theory_content, re.IGNORECASE):
                    concepts.append(label)

            if concepts:
                print(f"KEY CONCEPTS: {', '.join(sorted(set(concepts)))}")

        print()

    except Exception as e:
        print(f"Error processing {filename}: {e}")

print("\n" + "=" * 80)
print("SURVEY COMPLETE")
print("=" * 80)

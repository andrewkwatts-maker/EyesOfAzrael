#!/usr/bin/env python3
"""
Script to apply complete theme compliance to Hindu mythology HTML files.
Converts inline styles to CSS variables and adds hyperlinks to deity/concept names.
"""

import re
import os
from pathlib import Path

# Define the base directory
BASE_DIR = Path(r"H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\hindu")

# Style replacements - remove inline style blocks
STYLE_PATTERNS_TO_REMOVE = [
    r'<style>.*?</style>',
]

# Inline style conversions
INLINE_STYLE_REPLACEMENTS = {
    r'style="font-size: 1\.2rem;': 'class="hero-description" style="',
    r'style="font-size: 1\.1rem;': 'class="hero-description" style="',
    r'style="font-size: 1\.5rem;': 'class="hero-description" style="',
    r'style="margin-top: 3rem;': 'style="margin-top: var(--space-12);',
    r'style="margin-top: 2rem;': 'style="margin-top: var(--space-8);',
    r'style="margin-top: 1\.5rem;': 'style="margin-top: var(--space-6);',
    r'style="margin-top: 1rem;': 'style="margin-top: var(--space-4);',
    r'style="margin: 1rem 0;': 'style="margin: var(--space-4) 0;',
    r'style="margin: 1rem auto;': 'style="margin: var(--space-4) auto;',
    r'padding: 4rem 2rem': 'padding: var(--space-16) var(--space-8)',
    r'padding: 3rem 2rem': 'padding: var(--space-12) var(--space-8)',
    r'padding: 1\.5rem': 'padding: var(--space-6)',
    r'gap: 0\.75rem': 'gap: var(--space-3)',
    r'margin: 0 0 1rem 0': 'margin: 0 0 var(--space-4) 0',
    r'margin: 0 0 0\.75rem 0': 'margin: 0 0 var(--space-3) 0',
}

# Class replacements
CLASS_REPLACEMENTS = {
    'subsection-card': 'glass-card',
    'deity-header': 'hero-section',
    'creation-stage': 'glass-card',
    'quote-box': 'glass-card',
    'avatar-section': 'glass-card',
}

# Deity and concept names to hyperlink
DEITY_LINKS = {
    r'\bBrahma\b(?!</a>)': '<a href="deities/brahma.html" class="inline-search-link">Brahma</a>',
    r'\bVishnu\b(?!</a>)': '<a href="deities/vishnu.html" class="inline-search-link">Vishnu</a>',
    r'\bShiva\b(?!</a>)': '<a href="deities/shiva.html" class="inline-search-link">Shiva</a>',
    r'\bDurga\b(?!</a>)': '<a href="deities/durga.html" class="inline-search-link">Durga</a>',
    r'\bLakshmi\b(?!</a>)': '<a href="deities/index.html" class="inline-search-link">Lakshmi</a>',
    r'\bGanesha\b(?!</a>)': '<a href="deities/index.html" class="inline-search-link">Ganesha</a>',
    r'\bHanuman\b(?!</a>)': '<a href="creatures/index.html" class="inline-search-link">Hanuman</a>',
    r'\bGaruda\b(?!</a>)': '<a href="creatures/garuda.html" class="inline-search-link">Garuda</a>',
    r'\bRama\b(?!</a>)': '<a href="heroes/rama.html" class="inline-search-link">Rama</a>',
    r'\bKrishna\b(?!</a>)': '<a href="deities/vishnu.html#krishna" class="inline-search-link">Krishna</a>',
}

CONCEPT_LINKS = {
    r'\bdharma\b(?!</a>)': '<a href="cosmology/karma.html" class="inline-search-link">dharma</a>',
    r'\bkarma\b(?!</a>)': '<a href="cosmology/karma.html" class="inline-search-link">karma</a>',
    r'\bmoksha\b(?!</a>)': '<a href="cosmology/afterlife.html" class="inline-search-link">moksha</a>',
    r'\bsamsara\b(?!</a>)': '<a href="cosmology/afterlife.html" class="inline-search-link">samsara</a>',
    r'\bTrimurti\b(?!</a>)': '<a href="deities/index.html" class="inline-search-link">Trimurti</a>',
    r'\bVedas\b(?!</a>)': '<a href="texts/index.html" class="inline-search-link">Vedas</a>',
    r'\bUpanishads\b(?!</a>)': '<a href="texts/index.html" class="inline-search-link">Upanishads</a>',
    r'\bBhagavad Gita\b(?!</a>)': '<a href="texts/index.html" class="inline-search-link">Bhagavad Gita</a>',
    r'\bRamayana\b(?!</a>)': '<a href="texts/index.html" class="inline-search-link">Ramayana</a>',
    r'\bMahabharata\b(?!</a>)': '<a href="texts/index.html" class="inline-search-link">Mahabharata</a>',
    r'\bPuranas\b(?!</a>)': '<a href="texts/index.html" class="inline-search-link">Puranas</a>',
}

def process_html_file(filepath):
    """Process a single HTML file for theme compliance."""
    print(f"Processing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes_made = []

    # Remove style blocks
    for pattern in STYLE_PATTERNS_TO_REMOVE:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, '', content, flags=re.DOTALL)
            changes_made.append("Removed inline style block")

    # Replace inline styles with CSS variables
    for old_style, new_style in INLINE_STYLE_REPLACEMENTS.items():
        if re.search(old_style, content):
            content = re.sub(old_style, new_style, content)
            changes_made.append(f"Replaced style: {old_style[:30]}...")

    # Replace class names
    for old_class, new_class in CLASS_REPLACEMENTS.items():
        pattern = f'class="{old_class}"'
        replacement = f'class="{new_class}"'
        if pattern in content:
            content = content.replace(pattern, replacement)
            changes_made.append(f"Replaced class: {old_class} -> {new_class}")

    # Add hyperlinks to deities (only within paragraph text, not in headers)
    for pattern, replacement in DEITY_LINKS.items():
        matches = re.findall(pattern, content)
        if matches:
            # Only replace within <p> tags to avoid header duplication
            content = re.sub(f'(<p[^>]*>.*?){pattern}(.*?</p>)',
                           f'\\1{replacement}\\2', content, flags=re.DOTALL)
            changes_made.append(f"Added links for deity: {pattern}")

    # Add hyperlinks to concepts
    for pattern, replacement in CONCEPT_LINKS.items():
        if re.search(pattern, content):
            content = re.sub(f'(<p[^>]*>.*?){pattern}(.*?</p>)',
                           f'\\1{replacement}\\2', content, flags=re.DOTALL)
            changes_made.append(f"Added links for concept: {pattern}")

    # Only write if changes were made
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [OK] Updated {filepath.name} - {len(changes_made)} types of changes")
        return len(changes_made)
    else:
        print(f"  [-] No changes needed for {filepath.name}")
        return 0

def main():
    """Main function to process all HTML files."""
    html_files = list(BASE_DIR.rglob("*.html"))
    print(f"Found {len(html_files)} HTML files in {BASE_DIR}")
    print("=" * 60)

    total_changes = 0
    files_modified = 0

    for filepath in html_files:
        changes = process_html_file(filepath)
        if changes > 0:
            files_modified += 1
            total_changes += changes
        print()

    print("=" * 60)
    print(f"SUMMARY:")
    print(f"  Total files processed: {len(html_files)}")
    print(f"  Files modified: {files_modified}")
    print(f"  Total change types applied: {total_changes}")
    print("=" * 60)

if __name__ == "__main__":
    main()

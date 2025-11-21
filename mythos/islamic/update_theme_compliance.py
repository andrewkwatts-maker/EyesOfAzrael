#!/usr/bin/env python3
"""
Batch update Islamic mythology HTML files for complete theme compliance.
Replaces hardcoded CSS values with CSS variables from the theme system.
"""

import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(r"H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\islamic")

# CSS replacement patterns
CSS_REPLACEMENTS = [
    # Colors
    (r'background:\s*rgba\(0,\s*128,\s*0,\s*0\.0[35]\)', 'background: var(--color-surface); backdrop-filter: blur(10px)'),
    (r'border:\s*1px\s+solid\s+rgba\(0,\s*128,\s*0,\s*0\.[23]\)', 'border: 2px solid var(--color-border)'),
    (r'border:\s*2px\s+solid\s+rgba\(0,\s*128,\s*0,\s*0\.[23]\)', 'border: 2px solid var(--color-border)'),
    (r'color:\s*#666', 'color: var(--color-text-secondary)'),
    (r'color:\s*white(?![a-z])', 'color: var(--color-text-primary)'),

    # Spacing
    (r'padding:\s*1rem', 'padding: var(--space-4)'),
    (r'padding:\s*1\.5rem', 'padding: var(--space-6)'),
    (r'padding:\s*2rem', 'padding: var(--space-8)'),
    (r'padding:\s*3rem\s+2rem', 'padding: var(--space-12) var(--space-8)'),
    (r'margin:\s*1rem\s+0', 'margin: var(--space-4) 0'),
    (r'margin:\s*1\.5rem\s+0', 'margin: var(--space-6) 0'),
    (r'margin:\s*2rem\s+0', 'margin: var(--space-8) 0'),
    (r'margin-bottom:\s*1rem', 'margin-bottom: var(--space-4)'),
    (r'margin-bottom:\s*2rem', 'margin-bottom: var(--space-8)'),
    (r'margin-top:\s*1rem', 'margin-top: var(--space-4)'),
    (r'margin-top:\s*1\.5rem', 'margin-top: var(--space-6)'),
    (r'margin-top:\s*2rem', 'margin-top: var(--space-8)'),
    (r'margin-top:\s*3rem', 'margin-top: var(--space-12)'),
    (r'gap:\s*0\.5rem', 'gap: var(--space-2)'),
    (r'gap:\s*0\.75rem', 'gap: var(--space-3)'),
    (r'gap:\s*1rem', 'gap: var(--space-4)'),

    # Border radius
    (r'border-radius:\s*6px', 'border-radius: var(--radius-md)'),
    (r'border-radius:\s*8px', 'border-radius: var(--radius-lg)'),
    (r'border-radius:\s*10px', 'border-radius: var(--radius-xl)'),
    (r'border-radius:\s*15px', 'border-radius: var(--radius-2xl)'),
    (r'border-radius:\s*20px', 'border-radius: var(--radius-full)'),

    # Typography
    (r'font-size:\s*0\.85rem', 'font-size: var(--text-sm)'),
    (r'font-size:\s*0\.9rem', 'font-size: var(--text-sm)'),
    (r'font-size:\s*0\.95rem', 'font-size: var(--text-base)'),
    (r'font-size:\s*1\.1rem', 'font-size: var(--text-lg)'),
    (r'font-size:\s*1\.2rem', 'font-size: var(--text-xl)'),
    (r'font-size:\s*1\.3rem', 'font-size: var(--text-2xl)'),
    (r'font-size:\s*1\.5rem', 'font-size: var(--text-2xl)'),
    (r'font-size:\s*4rem', 'font-size: var(--text-5xl)'),
    (r'font-weight:\s*bold', 'font-weight: var(--font-bold)'),
    (r'line-height:\s*1\.8', 'line-height: var(--leading-relaxed)'),
    (r'line-height:\s*2', 'line-height: var(--leading-loose)'),
]

# HTML content replacements for linking
CONTENT_LINK_PATTERNS = [
    # Link deity names
    (r'\bAllah\b(?!<)', r'<a href="deities/allah.html" style="color: var(--color-accent); text-decoration: none;">Allah</a>'),
    (r'\bTawhid\b(?!<)', r'<a href="cosmology/tawhid.html" style="color: var(--color-accent); text-decoration: none;">Tawhid</a>'),
    (r'\bMuhammad\b(?!<)', r'<a href="deities/muhammad.html" style="color: var(--color-accent); text-decoration: none;">Muhammad</a>'),
]

def update_file(filepath):
    """Update a single HTML file with theme compliance changes."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes_made = 0

        # Apply CSS replacements
        for pattern, replacement in CSS_REPLACEMENTS:
            new_content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
            if new_content != content:
                changes_made += content.count(pattern)
                content = new_content

        # Write back if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes_made

        return 0

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    """Process all HTML files in the Islamic mythology directory."""
    html_files = list(BASE_DIR.rglob("*.html"))

    total_files = 0
    total_changes = 0
    files_modified = []

    for filepath in html_files:
        changes = update_file(filepath)
        if changes > 0:
            total_files += 1
            total_changes += changes
            files_modified.append(str(filepath.relative_to(BASE_DIR)))
            print(f"Updated: {filepath.relative_to(BASE_DIR)} ({changes} replacements)")

    print(f"\n=== Summary ===")
    print(f"Total files modified: {total_files}")
    print(f"Total CSS replacements: {total_changes}")
    print(f"\nModified files:")
    for f in sorted(files_modified):
        print(f"  - {f}")

if __name__ == "__main__":
    main()

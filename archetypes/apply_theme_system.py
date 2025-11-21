#!/usr/bin/env python3
"""
Apply theme system to archetype HTML files
"""
import re
from pathlib import Path

# Define the theme system header to insert
THEME_HEADER = """
    <!-- Theme System -->
    <link rel="stylesheet" href="../../themes/theme-base.css">
    <link rel="stylesheet" href="../../themes/themes/day.css" id="theme-stylesheet">
    <script src="../../themes/theme-picker.js" defer></script>
"""

# Define the theme picker UI to insert
THEME_PICKER = """
    <!-- Theme Picker UI -->
    <div id="theme-picker-container"></div>
"""

def apply_theme_system(file_path):
    """Apply theme system to a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if theme system already applied
        if '<!-- Theme System -->' in content:
            print(f"  Theme system already applied to {file_path.name}")
            return False

        # Insert theme system header after title tag
        content = re.sub(
            r'(<title>.*?</title>)',
            r'\1' + THEME_HEADER,
            content,
            count=1
        )

        # Insert theme picker before closing body tag
        content = re.sub(
            r'(</body>)',
            THEME_PICKER + r'\1',
            content,
            count=1
        )

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  [OK] Applied theme system to {file_path.name}")
        return True

    except Exception as e:
        print(f"  [ERROR] Error processing {file_path.name}: {e}")
        return False

def main():
    # List of files to process
    base_path = Path(__file__).parent

    files_to_process = [
        base_path / 'earth-mother/index.html',
        base_path / 'trickster/index.html',
        base_path / 'wisdom/wisdom-goddess.html',
        base_path / 'death/index.html',
        base_path / 'love/index.html',
        base_path / 'war/index.html',
        base_path / 'healing/index.html',
        base_path / 'cosmic-creator/index.html',
        base_path / 'celestial/index.html',
    ]

    print("Applying theme system to archetype files...")
    print("=" * 60)

    success_count = 0
    for file_path in files_to_process:
        if file_path.exists():
            if apply_theme_system(file_path):
                success_count += 1
        else:
            print(f"  [NOT FOUND] File not found: {file_path}")

    print("=" * 60)
    print(f"Completed: {success_count}/{len(files_to_process)} files updated")

if __name__ == '__main__':
    main()

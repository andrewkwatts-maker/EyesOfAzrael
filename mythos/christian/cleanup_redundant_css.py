#!/usr/bin/env python3
"""
Clean up redundant CSS variable declarations in Christian mythology HTML files.
"""

import re
from pathlib import Path

def cleanup_redundant_css(file_path: Path) -> bool:
    """Remove redundant :root CSS variable declarations."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Remove redundant :root blocks that just repeat variables
        pattern = r'\s*:root\s*\{\s*--color-primary:\s*var\(--color-primary\);\s*--color-secondary:\s*var\(--color-secondary\);\s*\}\s*'
        content = re.sub(pattern, '\n', content)

        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    base_dir = Path(r'H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\christian')
    html_files = list(base_dir.rglob('*.html'))

    print(f"Cleaning up {len(html_files)} HTML files...")

    cleaned = 0
    for html_file in html_files:
        if cleanup_redundant_css(html_file):
            print(f"  Cleaned: {html_file.relative_to(base_dir)}")
            cleaned += 1

    print(f"\nCleaned {cleaned} files")

if __name__ == '__main__':
    main()

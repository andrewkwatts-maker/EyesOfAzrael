#!/usr/bin/env python3
"""
Phase 14: Complete Mythos Directory Modernization
Batch add spinner.css to all remaining mythos HTML files
"""

import os
import re
from pathlib import Path

def calculate_relative_path(file_path):
    """Calculate the correct relative path to css/spinner.css"""
    # Convert to Path object
    path = Path(file_path)

    # Count depth from mythos directory
    parts = path.parts
    mythos_index = parts.index('mythos')
    depth = len(parts) - mythos_index - 1  # -1 because we don't count the file itself

    # Generate relative path
    if depth == 0:
        # mythos/index.html
        return '../css/spinner.css'
    elif depth == 1:
        # mythos/mythology/index.html
        return '../../css/spinner.css'
    elif depth == 2:
        # mythos/mythology/category/file.html
        return '../../../css/spinner.css'
    elif depth == 3:
        # mythos/mythology/category/subcategory/file.html
        return '../../../../css/spinner.css'
    else:
        # Deeper nesting (unlikely)
        return '../' * (depth + 1) + 'css/spinner.css'

def add_spinner_css(file_path):
    """Add spinner.css link to an HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if spinner.css is already present
        if 'spinner.css' in content:
            return False, "Already has spinner.css"

        # Calculate correct relative path
        spinner_path = calculate_relative_path(file_path)
        spinner_link = f'    <link rel="stylesheet" href="{spinner_path}">'

        # Find insertion point - after theme-base.css or mythology-colors.css
        # Pattern 1: After theme-base.css
        pattern1 = r'(<link rel="stylesheet" href="[^"]*theme-base\.css">)'
        match1 = re.search(pattern1, content)

        # Pattern 2: After mythology-colors.css
        pattern2 = r'(<link rel="stylesheet" href="[^"]*mythology-colors\.css">)'
        match2 = re.search(pattern2, content)

        # Pattern 3: After any common.css
        pattern3 = r'(<link rel="stylesheet" href="[^"]*common\.css">)'
        match3 = re.search(pattern3, content)

        if match1:
            # Insert after theme-base.css
            new_content = re.sub(
                pattern1,
                r'\1\n' + spinner_link,
                content,
                count=1
            )
        elif match2:
            # Insert after mythology-colors.css
            new_content = re.sub(
                pattern2,
                r'\1\n' + spinner_link,
                content,
                count=1
            )
        elif match3:
            # Insert after common.css
            new_content = re.sub(
                pattern3,
                r'\1\n' + spinner_link,
                content,
                count=1
            )
        else:
            # Try to find any stylesheet link and insert after it
            pattern_any = r'(<link rel="stylesheet" href="[^"]*\.css">)(?!\s*<link rel="stylesheet")'
            match_any = re.search(pattern_any, content)
            if match_any:
                new_content = re.sub(
                    pattern_any,
                    r'\1\n' + spinner_link,
                    content,
                    count=1
                )
            else:
                return False, "No suitable insertion point found"

        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return True, spinner_path

    except Exception as e:
        return False, str(e)

def main():
    """Process all files from the list"""
    # Read the list of files
    with open('h:/Github/EyesOfAzrael/remaining_files.txt', 'r') as f:
        files = [line.strip() for line in f if line.strip()]

    print(f"Processing {len(files)} files...\n")

    # Track statistics
    stats = {
        'success': 0,
        'already_has': 0,
        'failed': 0,
        'by_depth': {},
        'by_mythology': {}
    }

    failed_files = []

    for file_path in files:
        success, message = add_spinner_css(file_path)

        if success:
            stats['success'] += 1

            # Track by depth
            depth = len(Path(file_path).parts) - Path(file_path).parts.index('mythos') - 1
            stats['by_depth'][depth] = stats['by_depth'].get(depth, 0) + 1

            # Track by mythology
            parts = Path(file_path).parts
            mythos_index = parts.index('mythos')
            if mythos_index + 1 < len(parts):
                mythology = parts[mythos_index + 1]
                stats['by_mythology'][mythology] = stats['by_mythology'].get(mythology, 0) + 1

            print(f"[OK] {file_path}")
            print(f"  Added: {message}")
        elif "Already has" in message:
            stats['already_has'] += 1
            print(f"[SKIP] {file_path} - {message}")
        else:
            stats['failed'] += 1
            failed_files.append((file_path, message))
            print(f"[FAIL] {file_path} - {message}")

    # Print summary
    print("\n" + "="*80)
    print("PHASE 14 COMPLETION SUMMARY")
    print("="*80)
    print(f"\nTotal files processed: {len(files)}")
    print(f"Successfully updated: {stats['success']}")
    print(f"Already had spinner.css: {stats['already_has']}")
    print(f"Failed: {stats['failed']}")

    print("\n--- Breakdown by Depth ---")
    for depth in sorted(stats['by_depth'].keys()):
        print(f"Depth {depth}: {stats['by_depth'][depth]} files")

    print("\n--- Breakdown by Mythology ---")
    for mythology in sorted(stats['by_mythology'].keys()):
        print(f"{mythology}: {stats['by_mythology'][mythology]} files")

    if failed_files:
        print("\n--- Failed Files ---")
        for file_path, error in failed_files:
            print(f"{file_path}: {error}")

    print("\n" + "="*80)

if __name__ == "__main__":
    main()

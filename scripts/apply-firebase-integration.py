#!/usr/bin/env python3
"""
Apply Firebase entity-display integration to all deity/entity pages.
Based on the zeus.html template pattern.
"""

import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
MYTHOS_DIR = BASE_DIR / "mythos"

# Firebase integration components
META_TAGS_TEMPLATE = """
<!-- Entity Metadata for Dynamic Loading -->
<meta name="mythology" content="{mythology}">
<meta name="entity-type" content="deity">
<meta name="entity-id" content="{entity_id}">
"""

FIREBASE_CSS = '<link rel="stylesheet" href="../../../css/user-auth.css">'

FIREBASE_JS = """<script src="../../../js/firebase-auth.js"></script>
<script src="../../../js/auth-guard.js"></script>
<script src="../../../js/components/google-signin-button.js"></script>"""

DYNAMIC_REDIRECT = '<script src="../../../js/dynamic-redirect.js"></script>'

USER_AUTH_NAV = '<div id="user-auth-nav"></div>'

def extract_mythology_and_entity(file_path):
    """Extract mythology name and entity ID from file path."""
    parts = file_path.parts

    # Find 'mythos' index
    mythos_idx = parts.index('mythos')
    mythology = parts[mythos_idx + 1]

    # Handle nested paths like christian/gnostic
    if parts[mythos_idx + 2] != 'deities':
        mythology = f"{parts[mythos_idx + 1]}-{parts[mythos_idx + 2]}"

    # Entity ID is filename without .html
    entity_id = parts[-1].replace('.html', '')

    return mythology, entity_id

def has_firebase_integration(content):
    """Check if file already has Firebase integration."""
    return 'meta name="entity-id"' in content and 'dynamic-redirect.js' in content

def find_head_close(content):
    """Find the </head> tag position."""
    match = re.search(r'</head>', content, re.IGNORECASE)
    return match.start() if match else -1

def find_header_content_div(content):
    """Find the header-content div to add user-auth-nav."""
    # Look for <div class="header-content">
    pattern = r'<div\s+class="header-content">(.*?)</div>'
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    return match if match else None

def find_h1_in_header(content):
    """Find h1 in header to add user-auth-nav after it."""
    # Look for <header> then find <h1>...</h1>
    header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL | re.IGNORECASE)
    if header_match:
        h1_match = re.search(r'<h1[^>]*>.*?</h1>', header_match.group(1), re.DOTALL | re.IGNORECASE)
        if h1_match:
            return header_match.start(1) + h1_match.end()
    return None

def apply_firebase_integration(file_path):
    """Apply Firebase integration to a single deity file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already has integration
        if has_firebase_integration(content):
            return 'already_integrated', None

        # Extract mythology and entity ID
        mythology, entity_id = extract_mythology_and_entity(file_path)

        original_content = content
        changes_made = []

        # 1. Add meta tags after <title> or in <head>
        if '<meta name="mythology"' not in content:
            # Find position after title or viewport meta
            title_match = re.search(r'<title>.*?</title>', content, re.IGNORECASE | re.DOTALL)
            viewport_match = re.search(r'<meta[^>]*viewport[^>]*>', content, re.IGNORECASE)

            if title_match:
                insert_pos = title_match.end()
            elif viewport_match:
                insert_pos = viewport_match.end()
            else:
                # Just after <head>
                head_match = re.search(r'<head[^>]*>', content, re.IGNORECASE)
                insert_pos = head_match.end() if head_match else -1

            if insert_pos > 0:
                meta_tags = META_TAGS_TEMPLATE.format(
                    mythology=mythology,
                    entity_id=entity_id
                )
                content = content[:insert_pos] + '\n' + meta_tags + content[insert_pos:]
                changes_made.append('meta_tags')

        # 2. Add Firebase CSS before </head> if not present
        if 'user-auth.css' not in content:
            head_close = find_head_close(content)
            if head_close > 0:
                # Find a good position - after other stylesheets or before </head>
                # Look for last stylesheet
                last_css = None
                for match in re.finditer(r'<link[^>]*\.css[^>]*>', content[:head_close], re.IGNORECASE):
                    last_css = match

                if last_css:
                    insert_pos = last_css.end()
                else:
                    insert_pos = head_close

                content = content[:insert_pos] + '\n\n<!-- Firebase Auth System -->\n' + FIREBASE_CSS + '\n' + FIREBASE_JS + '\n' + content[insert_pos:]
                changes_made.append('firebase_css_js')

        # 3. Add dynamic redirect before </head>
        if 'dynamic-redirect.js' not in content:
            head_close = find_head_close(content)
            if head_close > 0:
                content = content[:head_close] + '\n<!-- Dynamic Redirect System (PHASE 4) -->\n' + DYNAMIC_REDIRECT + '\n' + content[head_close:]
                changes_made.append('dynamic_redirect')

        # 4. Add user-auth-nav div in header
        if 'user-auth-nav' not in content:
            # Strategy 1: Find <div class="header-content">
            header_content = find_header_content_div(content)
            if header_content:
                # Add before closing </div>
                insert_pos = header_content.end() - 6  # Before </div>
                content = content[:insert_pos] + '\n        ' + USER_AUTH_NAV + '\n    ' + content[insert_pos:]
                changes_made.append('user_auth_nav')
            else:
                # Strategy 2: Add after h1 in header
                h1_end = find_h1_in_header(content)
                if h1_end:
                    content = content[:h1_end] + '\n        ' + USER_AUTH_NAV + content[h1_end:]
                    changes_made.append('user_auth_nav')

        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return 'updated', changes_made
        else:
            return 'no_changes', []

    except Exception as e:
        return 'error', str(e)

def main():
    """Main function to process all deity files."""
    print("Firebase Entity-Display Integration Tool")
    print("=" * 60)

    # Find all deity HTML files
    deity_files = []
    for mythology_dir in MYTHOS_DIR.iterdir():
        if mythology_dir.is_dir():
            deities_dir = mythology_dir / "deities"
            if deities_dir.exists():
                for html_file in deities_dir.glob("*.html"):
                    if html_file.name != "index.html":
                        deity_files.append(html_file)

            # Check for nested deities (like christian/gnostic/deities)
            for subdir in mythology_dir.iterdir():
                if subdir.is_dir():
                    nested_deities = subdir / "deities"
                    if nested_deities.exists():
                        for html_file in nested_deities.glob("*.html"):
                            if html_file.name != "index.html":
                                deity_files.append(html_file)

    deity_files.sort()

    print(f"\nFound {len(deity_files)} deity HTML files")
    print("-" * 60)

    # Statistics
    stats = {
        'already_integrated': [],
        'updated': [],
        'no_changes': [],
        'error': []
    }

    # Process each file
    for i, file_path in enumerate(deity_files, 1):
        relative_path = file_path.relative_to(BASE_DIR)
        status, details = apply_firebase_integration(file_path)
        stats[status].append((relative_path, details))

        # Progress indicator
        if i % 10 == 0:
            print(f"Processed {i}/{len(deity_files)} files...")

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total files processed: {len(deity_files)}")
    print(f"Already integrated: {len(stats['already_integrated'])}")
    print(f"Successfully updated: {len(stats['updated'])}")
    print(f"No changes needed: {len(stats['no_changes'])}")
    print(f"Errors: {len(stats['error'])}")

    if stats['updated']:
        print(f"\n✓ Updated {len(stats['updated'])} files with Firebase integration")

        # Show sample of updated files
        print("\nSample of updated files:")
        for path, changes in stats['updated'][:10]:
            print(f"  - {path}")
            print(f"    Changes: {', '.join(changes)}")

    if stats['error']:
        print(f"\n✗ Errors encountered in {len(stats['error'])} files:")
        for path, error in stats['error'][:10]:
            print(f"  - {path}: {error}")

    # Generate detailed report
    report_path = BASE_DIR / "FIREBASE_INTEGRATION_REPORT.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# Firebase Entity-Display Integration Report\n\n")
        f.write(f"**Date:** {os.popen('date /t').read().strip()}\n\n")
        f.write(f"## Summary\n\n")
        f.write(f"- Total files: {len(deity_files)}\n")
        f.write(f"- Already integrated: {len(stats['already_integrated'])}\n")
        f.write(f"- Updated: {len(stats['updated'])}\n")
        f.write(f"- No changes: {len(stats['no_changes'])}\n")
        f.write(f"- Errors: {len(stats['error'])}\n\n")

        if stats['updated']:
            f.write(f"## Updated Files ({len(stats['updated'])})\n\n")
            for path, changes in sorted(stats['updated']):
                f.write(f"- `{path}`\n")
                f.write(f"  - Changes: {', '.join(changes)}\n")

        if stats['error']:
            f.write(f"\n## Errors ({len(stats['error'])})\n\n")
            for path, error in sorted(stats['error']):
                f.write(f"- `{path}`\n")
                f.write(f"  - Error: {error}\n")

    print(f"\nDetailed report saved to: {report_path}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrate Deity Index Pages to Dynamic Firebase System
Converts hardcoded deity cards to use universal-entity-renderer.js

Author: Agent 2
Date: 2025-12-25
"""

import os
import re
import json
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
BASE_DIR = Path(r'H:\Github\EyesOfAzrael')
VALIDATION_FILE = BASE_DIR / 'DYNAMIC_SYSTEM_VALIDATION.json'

# Mythology to collection mapping
MYTHOLOGY_MAP = {
    'aztec': 'deities',
    'babylonian': 'deities',
    'buddhist': 'deities',
    'celtic': 'deities',
    'chinese': 'deities',
    'christian': 'deities',
    'egyptian': 'deities',
    'greek': 'deities',
    'hindu': 'deities',
    'islamic': 'deities',
    'mayan': 'deities',
    'norse': 'deities',
    'roman': 'deities',
    'sumerian': 'deities',
    'yoruba': 'deities',
    'persian': 'deities'
}

def load_validation_data():
    """Load the validation JSON to get pages needing migration."""
    with open(VALIDATION_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Filter for deity index pages only
    deity_pages = []
    for page in data.get('needsMigration', []):
        path = page.get('path', '')
        if 'deities' in path.lower() and 'index.html' in path:
            deity_pages.append(page)

    return deity_pages

def extract_mythology_from_path(path):
    """Extract mythology name from file path."""
    parts = path.split(os.sep)
    for i, part in enumerate(parts):
        if part == 'mythos' and i + 1 < len(parts):
            return parts[i + 1]
    return None

def backup_file(file_path):
    """Create a backup of the original file."""
    backup_path = str(file_path) + '.backup'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return backup_path

def has_universal_renderer(content):
    """Check if page already has universal-entity-renderer.js."""
    return 'universal-entity-renderer.js' in content

def has_firebase_sdk(content):
    """Check if page has Firebase SDK."""
    return 'firebase-app-compat.js' in content or 'firebase.js' in content

def find_deity_grid_section(content):
    """Find the main deity grid section in the HTML."""
    # Look for pantheon-grid or deity-grid class
    pattern = r'<div\s+class="(?:pantheon-grid|deity-grid)"[^>]*>(.*?)</div>\s*</section>'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(0), match.start(), match.end()
    return None, None, None

def count_deity_cards(content):
    """Count the number of hardcoded deity cards."""
    pattern = r'<div\s+class="deity-card"'
    return len(re.findall(pattern, content))

def create_dynamic_section(mythology):
    """Create the dynamic entity loading section."""
    return f'''
<!-- Dynamic Entity Grid (Firebase-Powered) -->
<div id="entity-grid" class="pantheon-grid" data-mythology="{mythology}" data-entity-type="deity">
    <!-- Entities will be loaded dynamically from Firebase -->
    <div class="loading-placeholder">
        <div class="spinner"></div>
        <p>Loading deities...</p>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {{
    // Check if Firebase and renderer are available
    if (typeof firebase === 'undefined' || !firebase.firestore) {{
        console.error('Firebase not initialized');
        return;
    }}

    if (typeof UniversalEntityRenderer === 'undefined') {{
        console.error('UniversalEntityRenderer not loaded');
        return;
    }}

    const renderer = new UniversalEntityRenderer();
    const db = firebase.firestore();
    const gridElement = document.getElementById('entity-grid');

    // Query Firebase for {mythology} deities
    db.collection('deities')
        .where('mythology', '==', '{mythology}')
        .orderBy('name')
        .get()
        .then(snapshot => {{
            if (snapshot.empty) {{
                gridElement.innerHTML = '<p class="no-results">No deities found in database. Check back soon!</p>';
                return;
            }}

            const entities = snapshot.docs.map(doc => ({{
                id: doc.id,
                ...doc.data()
            }}));

            // Render the entities using the universal renderer
            gridElement.innerHTML = renderer.renderGrid(entities, {{
                entityType: 'deity',
                mythology: '{mythology}',
                showIcons: true,
                enableClick: true
            }});

            console.log(`Loaded ${{entities.length}} {mythology} deities from Firebase`);
        }})
        .catch(error => {{
            console.error('Error loading deities:', error);
            gridElement.innerHTML = '<p class="error-message">Error loading deities. Please try again later.</p>';
        }});
}});
</script>'''

def add_universal_renderer_script(content):
    """Add the universal-entity-renderer.js script if missing."""
    # Find the closing head tag
    head_close = content.find('</head>')
    if head_close == -1:
        return content

    # Check if already included
    if 'universal-entity-renderer.js' in content:
        return content

    # Add the script before </head>
    script_tag = '\n<!-- Universal Entity Renderer -->\n<script defer src="../../../js/universal-entity-renderer.js"></script>\n<link rel="stylesheet" href="../../../css/entity-renderer.css">\n'

    return content[:head_close] + script_tag + content[head_close:]

def wrap_hardcoded_cards_as_fallback(deity_grid_html):
    """Wrap existing deity cards in a noscript/fallback section."""
    fallback = f'''
<!-- Fallback: Static deity cards (shown if JavaScript disabled or Firebase unavailable) -->
<noscript>
{deity_grid_html}
</noscript>
<div class="static-fallback" style="display: none;">
{deity_grid_html}
</div>'''
    return fallback

def migrate_deity_index_page(page_info):
    """Migrate a single deity index page."""
    file_path = BASE_DIR / page_info['path']

    if not file_path.exists():
        return {
            'success': False,
            'path': str(file_path),
            'error': 'File not found'
        }

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract mythology
    mythology = extract_mythology_from_path(page_info['path'])
    if not mythology:
        return {
            'success': False,
            'path': str(file_path),
            'error': 'Could not extract mythology from path'
        }

    # Count existing deity cards
    card_count = count_deity_cards(content)

    # Create backup
    backup_path = backup_file(file_path)

    try:
        # Add universal renderer if missing
        modified_content = add_universal_renderer_script(content)

        # Find the main deity grid section
        grid_section, start_pos, end_pos = find_deity_grid_section(modified_content)

        if grid_section is None:
            # If we can't find a grid section, look for any section with deity cards
            # This is a fallback approach
            section_pattern = r'<section[^>]*>(.*?)<div\s+class="(?:pantheon-grid|deity-grid)"[^>]*>.*?</div>\s*</section>'
            match = re.search(section_pattern, modified_content, re.DOTALL)

            if match:
                start_pos = match.start()
                end_pos = match.end()
                grid_section = match.group(0)

        if grid_section:
            # Create dynamic section
            dynamic_section = create_dynamic_section(mythology)

            # Extract just the grid div for fallback
            grid_div_pattern = r'<div\s+class="(?:pantheon-grid|deity-grid)"[^>]*>.*?</div>'
            grid_match = re.search(grid_div_pattern, grid_section, re.DOTALL)

            if grid_match:
                grid_html = grid_match.group(0)
                fallback_html = wrap_hardcoded_cards_as_fallback(grid_html)

                # Replace the grid section with dynamic version + fallback
                # Keep the section opening and closing, just replace the grid
                section_start = grid_section.find('<div class="')
                section_before = grid_section[:section_start]

                # Find the closing </section>
                section_end_match = re.search(r'</div>\s*</section>', grid_section)
                if section_end_match:
                    new_section = section_before + dynamic_section + '\n' + fallback_html + '\n</section>'
                    modified_content = modified_content[:start_pos] + new_section + modified_content[end_pos:]

        # Write the modified content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified_content)

        return {
            'success': True,
            'path': str(file_path),
            'mythology': mythology,
            'cards_migrated': card_count,
            'backup_path': backup_path
        }

    except Exception as e:
        # Restore backup on error
        with open(backup_path, 'r', encoding='utf-8') as f:
            original = f.read()
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(original)

        return {
            'success': False,
            'path': str(file_path),
            'error': str(e)
        }

def main():
    """Main migration function."""
    print("=" * 80)
    print("DEITY INDEX PAGE MIGRATION TO DYNAMIC FIREBASE SYSTEM")
    print("=" * 80)
    print()

    # Load validation data
    print("Loading validation data...")
    deity_pages = load_validation_data()
    print(f"Found {len(deity_pages)} deity index pages to migrate\n")

    # Migrate each page
    results = []
    for i, page in enumerate(deity_pages, 1):
        print(f"[{i}/{len(deity_pages)}] Migrating: {page['path']}")
        result = migrate_deity_index_page(page)
        results.append(result)

        if result['success']:
            print(f"  ✓ SUCCESS: Migrated {result.get('cards_migrated', 0)} deity cards")
            print(f"  Backup: {result['backup_path']}")
        else:
            print(f"  ✗ FAILED: {result.get('error', 'Unknown error')}")
        print()

    # Generate summary
    print("\n" + "=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)

    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]

    print(f"\nTotal Pages: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")

    total_cards = sum(r.get('cards_migrated', 0) for r in successful)
    print(f"\nTotal Deity Cards Migrated: {total_cards}")

    if failed:
        print("\n\nFailed Migrations:")
        for r in failed:
            print(f"  - {r['path']}: {r.get('error', 'Unknown error')}")

    # Save detailed results
    report_file = BASE_DIR / 'DEITY_INDEX_MIGRATION_REPORT.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': '2025-12-25',
            'total_pages': len(results),
            'successful': len(successful),
            'failed': len(failed),
            'total_cards_migrated': total_cards,
            'results': results
        }, f, indent=2)

    print(f"\n\nDetailed report saved to: {report_file}")
    print("\n" + "=" * 80)

if __name__ == '__main__':
    main()

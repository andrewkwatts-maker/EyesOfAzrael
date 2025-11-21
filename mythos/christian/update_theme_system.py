# ====== Playtow/EOAPlot/docs/mythos/christian/update_theme_system.py ======
# copyright (c) 2025 Andrew Keith Watts. All rights reserved.
#
# This is the intellectual property of Andrew Keith Watts. Unauthorized
# reproduction, distribution, or modification of this code, in whole or in part,
# without the express written permission of Andrew Keith Watts is strictly prohibited.
#
# For inquiries, please contact AndrewKWatts@Gmail.com

import os
import re
from pathlib import Path

def calculate_depth(file_path, base_dir):
    """Calculate depth from file to base directory"""
    rel_path = os.path.relpath(file_path, base_dir)
    depth = len(Path(rel_path).parts) - 1
    return depth

def add_theme_system(file_path, base_dir):
    """Add theme system to HTML file"""
    depth = calculate_depth(file_path, base_dir)
    prefix = '../' * (depth + 2)  # +2 for mythos/christian

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False

    # Check if already has theme system
    if 'theme-base.css' in content:
        print(f"Skipping {file_path} - already has theme system")
        return False

    # Pattern 1: Find <link rel="stylesheet" href="../../../styles.css">
    old_pattern = r'(<title>.*?</title>)\s*<link rel="stylesheet" href="[^"]*styles\.css">'

    theme_links = f'''$1

    <!-- Theme System -->
    <link rel="stylesheet" href="{prefix}themes/theme-base.css">
    <link rel="stylesheet" href="{prefix[:-3]}styles.css">
    <script src="{prefix}themes/theme-picker.js"></script>'''

    new_content = re.sub(old_pattern, theme_links, content)

    # Pattern 2: Update hardcoded color variables
    new_content = re.sub(
        r'--mythos-primary:\s*#[0-9A-Fa-f]+;',
        '--mythos-primary: var(--color-primary);',
        new_content
    )
    new_content = re.sub(
        r'--mythos-secondary:\s*#[0-9A-Fa-f]+;',
        '--mythos-secondary: var(--color-secondary);',
        new_content
    )

    # Pattern 3: Update hardcoded backgrounds with glass-morphism
    new_content = re.sub(
        r'background:\s*linear-gradient\(135deg,\s*var\(--mythos-primary\),\s*var\(--mythos-secondary\)\);',
        '''background: linear-gradient(135deg,
                rgba(var(--color-primary-rgb), 0.3),
                rgba(var(--color-secondary-rgb), 0.3));
            backdrop-filter: blur(10px);
            border: 2px solid var(--color-primary);''',
        new_content
    )

    # Pattern 4: Update colors
    new_content = re.sub(r'color:\s*white;', 'color: var(--color-text-primary);', new_content)
    new_content = re.sub(r'background:\s*rgba\(65,\s*105,\s*225,\s*0\.\d+\);',
                        'background: var(--color-bg-card);\n            backdrop-filter: blur(10px);',
                        new_content)

    # Pattern 5: Update borders and padding with CSS variables
    new_content = re.sub(r'padding:\s*3rem\s+2rem;', 'padding: var(--spacing-2xl) var(--spacing-xl);', new_content)
    new_content = re.sub(r'border-radius:\s*15px;', 'border-radius: var(--radius-lg);', new_content)
    new_content = re.sub(r'border-radius:\s*10px;', 'border-radius: var(--radius-md);', new_content)
    new_content = re.sub(r'margin-bottom:\s*2rem;', 'margin-bottom: var(--spacing-xl);', new_content)
    new_content = re.sub(r'font-size:\s*4rem;', 'font-size: var(--font-size-4xl);', new_content)
    new_content = re.sub(r'margin-bottom:\s*1rem;', 'margin-bottom: var(--spacing-md);', new_content)
    new_content = re.sub(r'gap:\s*1rem;', 'gap: var(--spacing-md);', new_content)
    new_content = re.sub(r'margin:\s*1\.5rem\s+0;', 'margin: var(--spacing-lg) 0;', new_content)

    # Add responsive design if not present
    if '@media' not in new_content and '.deity-header' in new_content:
        responsive_css = '''

        @media (max-width: 768px) {
            .deity-header {
                padding: var(--spacing-xl) var(--spacing-md);
            }

            .attribute-grid {
                grid-template-columns: 1fr;
            }
        }'''
        # Find last closing brace before </style>
        new_content = re.sub(r'(\s+)(</style>)', responsive_css + r'\1\2', new_content)

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    updated_files = []
    skipped_files = []

    # Find all HTML files
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                result = add_theme_system(file_path, base_dir)
                if result:
                    updated_files.append(file_path)
                else:
                    skipped_files.append(file_path)

    print(f"\n=== Theme System Update Complete ===")
    print(f"Updated: {len(updated_files)} files")
    print(f"Skipped: {len(skipped_files)} files")
    print(f"\nUpdated files:")
    for f in updated_files:
        print(f"  - {os.path.relpath(f, base_dir)}")

if __name__ == '__main__':
    main()

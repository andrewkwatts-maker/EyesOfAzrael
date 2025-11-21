import re
from pathlib import Path
from collections import defaultdict

# Base directory for Greek mythology
greek_dir = Path(r'H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\greek')

# Find all HTML files recursively
html_files = list(greek_dir.rglob('*.html'))

print(f'Found {len(html_files)} HTML files in Greek mythology section')
print('='*80)

# Statistics
fixes_applied = defaultdict(int)
files_modified = []
files_with_issues = []

# Correct theme include patterns based on file depth
def get_correct_theme_paths(file_path):
    """Calculate correct relative paths to theme files based on file depth"""
    # Calculate depth from docs/ directory
    relative_to_docs = file_path.relative_to(greek_dir.parent.parent)
    depth = len(relative_to_docs.parts) - 1  # -1 because we count from docs/

    # Build correct path
    prefix = '../' * depth

    return {
        'theme-base': f'{prefix}themes/theme-base.css',
        'day-theme': f'{prefix}themes/themes/day.css',
        'corpus-links': f'{prefix}themes/corpus-links.css',
        'theme-picker-js': f'{prefix}themes/theme-picker.js',
        'styles': f'{prefix}styles.css',
        'mythos-index': f'{prefix}mythos-index.html'
    }

for html_file in html_files:
    try:
        # Read file
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        file_modified = False

        # Get correct paths for this file
        correct_paths = get_correct_theme_paths(html_file)

        # Fix 1: Incorrect mythos/themes paths (should be ../../themes or similar)
        patterns_to_fix = [
            (r'href=["\']mythos/themes/theme-base\.css["\']',
             f'href="{correct_paths["theme-base"]}"'),
            (r'href=["\']mythos/themes/themes/day\.css["\']',
             f'href="{correct_paths["day-theme"]}"'),
            (r'href=["\']mythos/themes/corpus-links\.css["\']',
             f'href="{correct_paths["corpus-links"]}"'),
            (r'src=["\']mythos/themes/theme-picker\.js["\']',
             f'src="{correct_paths["theme-picker-js"]}"'),
            (r'href=["\']mythos/styles\.css["\']',
             f'href="{correct_paths["styles"]}"'),
            (r'href=["\']mythos/mythos-index\.html["\']',
             f'href="{correct_paths["mythos-index"]}"'),
        ]

        for pattern, replacement in patterns_to_fix:
            new_content, count = re.subn(pattern, replacement, content)
            if count > 0:
                content = new_content
                file_modified = True
                fixes_applied[f'Fixed {pattern.split("/")[-1].split(".")[0]} path'] += count

        # Fix 2: Ensure theme-picker container exists
        if '<div id="theme-picker-container"></div>' not in content:
            # Add it after <body> tag
            if '<body>' in content:
                content = content.replace('<body>', '<body>\n<div id="theme-picker-container"></div>')
                file_modified = True
                fixes_applied['Added theme-picker container'] += 1

        # Fix 3: Ensure proper CSS variable usage (check for inline styles)
        # Look for common Greek goldenrod color and suggest CSS variable
        if '#DAA520' in content or '#FFD700' in content:
            # This is OK - Greek uses custom colors defined in :root
            pass

        # Save if modified
        if file_modified:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)
            files_modified.append(str(html_file.relative_to(greek_dir)))

    except Exception as e:
        files_with_issues.append((str(html_file.relative_to(greek_dir)), str(e)))

print('\nFIXES APPLIED:')
print('-'*80)
for fix_type, count in sorted(fixes_applied.items()):
    print(f'  {fix_type:50s}: {count:4d} occurrences')

print(f'\n\nFILES MODIFIED: {len(files_modified)}')
print('-'*80)
for file_path in sorted(files_modified):
    print(f'  ✓ {file_path}')

if files_with_issues:
    print(f'\n\nFILES WITH ISSUES: {len(files_with_issues)}')
    print('-'*80)
    for file_path, error in files_with_issues:
        print(f'  ✗ {file_path}: {error}')

print('\n' + '='*80)
print('Theme include fixes completed!')

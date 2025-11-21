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

# Calculate correct paths based on depth
def get_correct_paths(file_path):
    """Calculate correct relative paths based on file depth from docs/"""
    try:
        # Get relative path from docs directory
        docs_dir = greek_dir.parent.parent
        relative_path = file_path.relative_to(docs_dir)
        depth = len(relative_path.parts) - 1

        prefix = '../' * depth

        return {
            'theme-base': f'{prefix}themes/theme-base.css',
            'corpus-links': f'{prefix}themes/corpus-links.css',
            'theme-picker-js': f'{prefix}themes/theme-picker.js',
            'mythos-index': f'{prefix}mythos-index.html'
        }
    except Exception as e:
        return None

for html_file in html_files:
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        file_modified = False

        correct_paths = get_correct_paths(html_file)
        if not correct_paths:
            continue

        # Fix 1: Remove individual theme CSS references (e.g., themes/day.css)
        # The theme-picker.js handles themes dynamically via theme-config.json
        pattern_day_css = r'<link[^>]*href=["\'][^"\']*themes/themes/day\.css["\'][^>]*/?>\s*\n?'
        pattern_night_css = r'<link[^>]*href=["\'][^"\']*themes/themes/night\.css["\'][^>]*/?>\s*\n?'

        if re.search(pattern_day_css, content):
            content = re.sub(pattern_day_css, '', content)
            file_modified = True
            fixes_applied['Removed day.css reference (theme-picker handles themes)'] += 1

        if re.search(pattern_night_css, content):
            content = re.sub(pattern_night_css, '', content)
            file_modified = True
            fixes_applied['Removed night.css reference'] += 1

        # Fix 2: Ensure theme-base.css is included with correct path
        has_theme_base = bool(re.search(r'<link[^>]*theme-base\.css', content))

        if not has_theme_base:
            # Add it in <head> after viewport meta
            viewport_pattern = r'(<meta[^>]*viewport[^>]*>)'
            replacement = rf'\1\n<link rel="stylesheet" href="{correct_paths["theme-base"]}"/>'
            content = re.sub(viewport_pattern, replacement, content)
            file_modified = True
            fixes_applied['Added missing theme-base.css'] += 1

        # Fix 3: Ensure corpus-links.css is included
        has_corpus_links = bool(re.search(r'<link[^>]*corpus-links\.css', content))

        if not has_corpus_links:
            # Add it after theme-base
            theme_base_pattern = r'(<link[^>]*theme-base\.css[^>]*/?>)'
            replacement = rf'\1\n<link rel="stylesheet" href="{correct_paths["corpus-links"]}"/>'
            content = re.sub(theme_base_pattern, replacement, content)
            file_modified = True
            fixes_applied['Added missing corpus-links.css'] += 1

        # Fix 4: Ensure theme-picker.js is included
        has_theme_picker = bool(re.search(r'<script[^>]*theme-picker\.js', content))

        if not has_theme_picker:
            # Add it at end of <head>
            head_close_pattern = r'(</head>)'
            replacement = rf'<script src="{correct_paths["theme-picker-js"]}"></script>\n\1'
            content = re.sub(head_close_pattern, replacement, content)
            file_modified = True
            fixes_applied['Added missing theme-picker.js'] += 1

        # Fix 5: Ensure theme-picker container exists
        has_container = '<div id="theme-picker-container"></div>' in content

        if not has_container:
            # Add after <body>
            body_pattern = r'(<body[^>]*>)'
            replacement = r'\1\n<div id="theme-picker-container"></div>'
            content = re.sub(body_pattern, replacement, content)
            file_modified = True
            fixes_applied['Added theme-picker container'] += 1

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
    print(f'  {fix_type:60s}: {count:4d}')

print(f'\n\nFILES MODIFIED: {len(files_modified)}')
print('-'*80)
for i, file_path in enumerate(sorted(files_modified), 1):
    print(f'  {i:3d}. ✓ {file_path}')

if files_with_issues:
    print(f'\n\nFILES WITH ISSUES: {len(files_with_issues)}')
    print('-'*80)
    for file_path, error in files_with_issues:
        print(f'  ✗ {file_path}: {error}')

print('\n' + '='*80)
print('Theme system fixes completed!')
print('\nNOTE: The theme-picker.js loads themes dynamically from theme-config.json.')
print('Individual theme CSS files (day.css, night.css) are not needed.')

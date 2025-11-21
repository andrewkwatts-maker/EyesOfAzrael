# Simple script to add theme system links to HTML files

import os
import re

files_to_update = [
    './cosmology/trinity.html',
    './creatures/seraphim.html',
    './deities/jesus_christ.html',
    './deities/michael.html',
    './deities/raphael.html',
    './deities/virgin_mary.html',
    './heroes/moses.html',
    './rituals/baptism.html'
]

for file_path in files_to_update:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Calculate depth
        depth = file_path.count('/')
        prefix = '../' * (depth + 2)

        # Find title tag and add theme links after it
        pattern = r'(<title>.*?</title>)\s*(<style>|<link)'
        replacement = r'''\1

    <!-- Theme System -->
    <link rel="stylesheet" href="''' + prefix + '''themes/theme-base.css">
    <link rel="stylesheet" href="''' + prefix[:-3] + '''styles.css">
    <script src="''' + prefix + '''themes/theme-picker.js"></script>

    \2'''

        new_content = re.sub(pattern, replacement, content, count=1)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"Updated: {file_path}")
    except Exception as e:
        print(f"Error with {file_path}: {e}")

print("\nDone!")

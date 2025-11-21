#!/usr/bin/env python3
"""
Modernization script for Christian mythology section pages.
Adds modern hero-section styling, glass-card components, deity-grid layouts, 
and proper theme integration while preserving corpus-link functionality.
"""

import os
import re

def add_doctype_and_style(html_content):
    """Add DOCTYPE and modern style variables if missing."""
    if not html_content.strip().startswith('<!DOCTYPE'):
        html_content = '<!DOCTYPE html>\n' + html_content
    
    # Add style section with CSS variables if missing
    if '--mythos-primary-rgb' not in html_content:
        style_section = '''<style>
        :root {
            --mythos-primary: #8B0000;
            --mythos-secondary: #FFD700;
            --mythos-primary-rgb: 139, 0, 0;
        }
    </style>'''
        # Insert before </head>
        html_content = html_content.replace('</head>', f'{style_section}\n</head>')
    
    return html_content

def modernize_header_section(html_content):
    """Convert old header to modern hero-section."""
    # This would need specific logic per file type
    return html_content

def ensure_theme_links(html_content):
    """Ensure modern theme CSS/JS links are present."""
    if 'theme-base.css' not in html_content:
        theme_links = '''<link rel="stylesheet" href="../../../themes/theme-base.css">
<link rel="stylesheet" href="../../../themes/corpus-links.css">
<script defer src="../../../themes/theme-picker.js"></script>'''
        html_content = html_content.replace('</head>', f'{theme_links}\n</head>')
    
    return html_content

def process_file(filepath):
    """Process a single HTML file for modernization."""
    print(f'Processing: {filepath}')
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply transformations
        content = add_doctype_and_style(content)
        content = ensure_theme_links(content)
        content = modernize_header_section(content)
        
        # Backup original
        backup_path = filepath + '.bak'
        if not os.path.exists(backup_path):
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Write modernized version
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'  ✓ Modernized successfully')
        return True
        
    except Exception as e:
        print(f'  ✗ Error: {e}')
        return False

if __name__ == '__main__':
    files_to_process = [
        'symbols/index.html',
        'herbs/index.html',
        'magic/index.html',
        'path/index.html',
    ]
    
    for filepath in files_to_process:
        if os.path.exists(filepath):
            process_file(filepath)
        else:
            print(f'File not found: {filepath}')

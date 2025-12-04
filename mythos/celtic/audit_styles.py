#!/usr/bin/env python3
"""
Celtic Mythology Style Checker
Identifies pages missing styles.css import or using outdated styling
"""

import os
import re
from pathlib import Path

def find_html_files(directory):
    """Find all HTML files in the directory"""
    return list(Path(directory).rglob("*.html"))

def check_styles_import(content):
    """Check if styles.css is imported"""
    patterns = [
        r'<link[^>]*href=["\'][^"\']*styles\.css["\']',
        r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\'][^"\']*styles\.css["\']'
    ]
    for pattern in patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False

def check_theme_imports(content):
    """Check for modern theme system imports"""
    imports = {
        'theme-base.css': bool(re.search(r'theme-base\.css', content)),
        'theme-picker.js': bool(re.search(r'theme-picker\.js', content)),
        'corpus-links.css': bool(re.search(r'corpus-links\.css', content)),
        'smart-links.css': bool(re.search(r'smart-links\.css', content)),
        'smart-links.js': bool(re.search(r'smart-links\.js', content))
    }
    return imports

def check_glass_morphism(content):
    """Check if page uses modern glass morphism cards"""
    return bool(re.search(r'glass-card|backdrop-filter|glass morphism', content, re.IGNORECASE))

def check_ascii_art(content):
    """Check for old ASCII art that should be replaced with SVG"""
    # Look for ASCII art patterns (multiple lines of symbols/decorative characters)
    ascii_patterns = [
        r'<pre[^>]*>[\s\S]*?[┌┐└┘│─├┤┬┴┼╔╗╚╝║═╠╣╦╩╬]+[\s\S]*?</pre>',
        r'<pre[^>]*>[\s\S]*?[▲△▼▽◆◇○●◎◉]+[\s\S]*?</pre>',
        r'<pre[^>]*>[\s\S]*?[░▒▓█▄▀]+[\s\S]*?</pre>'
    ]
    for pattern in ascii_patterns:
        if re.search(pattern, content):
            return True
    return False

def check_hero_section(content):
    """Check if page has modern hero section"""
    return bool(re.search(r'class=["\'][^"\']*hero[^"\']*["\']', content, re.IGNORECASE))

def audit_celtic_styles(celtic_dir):
    """Audit all Celtic pages for styling issues"""
    print("=" * 80)
    print("CELTIC MYTHOLOGY - STYLE & MODERNIZATION AUDIT")
    print("=" * 80)
    print()

    html_files = find_html_files(celtic_dir)
    print(f"Found {len(html_files)} HTML files\n")

    issues = {
        'missing_styles_css': [],
        'missing_theme_imports': [],
        'no_glass_morphism': [],
        'has_ascii_art': [],
        'no_hero_section': []
    }

    for html_file in sorted(html_files):
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"ERROR reading {html_file}: {e}")
            continue

        rel_path = html_file.relative_to(celtic_dir)

        # Check styles.css
        if not check_styles_import(content):
            issues['missing_styles_css'].append(str(rel_path))

        # Check theme system
        theme_imports = check_theme_imports(content)
        missing_themes = [k for k, v in theme_imports.items() if not v]
        if missing_themes:
            issues['missing_theme_imports'].append({
                'file': str(rel_path),
                'missing': missing_themes
            })

        # Check glass morphism
        if not check_glass_morphism(content):
            issues['no_glass_morphism'].append(str(rel_path))

        # Check for ASCII art
        if check_ascii_art(content):
            issues['has_ascii_art'].append(str(rel_path))

        # Check hero section
        if not check_hero_section(content):
            issues['no_hero_section'].append(str(rel_path))

    # Report findings
    print("\n📊 MISSING styles.css IMPORT")
    print("-" * 80)
    if issues['missing_styles_css']:
        for file in issues['missing_styles_css']:
            print(f"  ❌ {file}")
    else:
        print("  ✅ All pages have styles.css")

    print("\n🎨 MISSING THEME SYSTEM COMPONENTS")
    print("-" * 80)
    if issues['missing_theme_imports']:
        for item in issues['missing_theme_imports']:
            print(f"  ⚠️  {item['file']}")
            for missing in item['missing']:
                print(f"      - Missing: {missing}")
    else:
        print("  ✅ All pages have complete theme imports")

    print("\n💎 MISSING GLASS MORPHISM STYLING")
    print("-" * 80)
    if issues['no_glass_morphism']:
        for file in issues['no_glass_morphism']:
            print(f"  ⚠️  {file}")
    else:
        print("  ✅ All pages use glass morphism")

    print("\n🎨 PAGES WITH OLD ASCII ART")
    print("-" * 80)
    if issues['has_ascii_art']:
        for file in issues['has_ascii_art']:
            print(f"  ⚠️  {file} - Should replace with SVG")
    else:
        print("  ✅ No ASCII art found")

    print("\n🦸 MISSING HERO SECTIONS")
    print("-" * 80)
    if issues['no_hero_section']:
        for file in issues['no_hero_section']:
            print(f"  ⚠️  {file}")
    else:
        print("  ✅ All pages have hero sections")

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    total_issues = (len(issues['missing_styles_css']) +
                   len(issues['missing_theme_imports']) +
                   len(issues['no_glass_morphism']) +
                   len(issues['has_ascii_art']) +
                   len(issues['no_hero_section']))

    print(f"Total files: {len(html_files)}")
    print(f"Files with issues: {total_issues}")
    print(f"Health score: {((len(html_files) * 5 - total_issues) / (len(html_files) * 5) * 100):.1f}%")

    return issues

if __name__ == "__main__":
    celtic_dir = Path(__file__).parent
    audit_celtic_styles(celtic_dir)

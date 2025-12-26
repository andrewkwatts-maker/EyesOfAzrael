#!/usr/bin/env python3
"""
Modernize all Kabbalah pages with:
- spinner.css
- user-auth system (CSS + JS)
- user-theories system
- theory-widget component
- Community discussion section
- Auth modal container

Preserves glass-morphism styling and existing content.
"""

import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(r"H:\Github\EyesOfAzrael")
KABBALAH_DIR = BASE_DIR / "mythos" / "jewish" / "kabbalah"

# Track changes
changes_log = []
errors_log = []

def calculate_relative_path(file_path, depth):
    """Calculate correct relative paths based on directory depth from base."""
    return "../" * depth

def get_depth_from_kabbalah_root(file_path):
    """Get depth relative to kabbalah root directory."""
    rel_path = file_path.relative_to(KABBALAH_DIR)
    return len(rel_path.parts) - 1  # Subtract 1 for the file itself

def has_css_link(content, css_file):
    """Check if CSS file is already linked."""
    pattern = rf'<link[^>]*href="[^"]*{re.escape(css_file)}"[^>]*>'
    return bool(re.search(pattern, content))

def has_script_tag(content, js_file):
    """Check if JavaScript file is already linked."""
    pattern = rf'<script[^>]*src="[^"]*{re.escape(js_file)}"[^>]*>'
    return bool(re.search(pattern, content))

def has_theory_widget(content):
    """Check if page already has theory widget."""
    return 'data-theory-widget' in content

def has_auth_modal(content):
    """Check if page already has auth modal container."""
    return 'auth-modal-container' in content

def modernize_file(file_path):
    """Modernize a single HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        modifications = []

        # Calculate depth and relative path prefix
        depth = get_depth_from_kabbalah_root(file_path)
        rel_prefix = calculate_relative_path(file_path, depth + 3)  # +3 for mythos/jewish/kabbalah

        # 1. Add spinner.css if missing
        if not has_css_link(content, 'spinner.css'):
            # Find the styles.css link and add spinner.css after it
            pattern = r'(<link href="[^"]*styles\.css" rel="stylesheet"/>)'
            replacement = rf'\1\n<link href="{rel_prefix}css/spinner.css" rel="stylesheet"/>'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modifications.append("Added spinner.css")

        # 2. Add user-auth.css if missing
        if not has_css_link(content, 'user-auth.css'):
            # Add before theme-picker.js script or at end of stylesheet links
            pattern = r'(<link rel="stylesheet" href="[^"]*smart-links\.css">)'
            replacement = rf'\1\n<link rel="stylesheet" href="{rel_prefix}css/user-auth.css">'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modifications.append("Added user-auth.css")

        # 3. Add user-auth.js if missing
        if not has_script_tag(content, 'user-auth.js'):
            pattern = r'(<script defer src="[^"]*theme-picker\.js"></script>)'
            replacement = rf'\1\n<script defer src="{rel_prefix}js/user-auth.js"></script>'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modifications.append("Added user-auth.js")

        # 4. Add user-theories.js if missing
        if not has_script_tag(content, 'user-theories.js'):
            pattern = r'(<script defer src="[^"]*user-auth\.js"></script>)'
            replacement = rf'\1\n<script defer src="{rel_prefix}js/user-theories.js"></script>'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modifications.append("Added user-theories.js")

        # 5. Add theory-widget.js if missing
        if not has_script_tag(content, 'theory-widget.js'):
            pattern = r'(<script defer src="[^"]*user-theories\.js"></script>)'
            replacement = rf'\1\n<script defer src="{rel_prefix}js/components/theory-widget.js"></script>'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                modifications.append("Added theory-widget.js")

        # 6. Add Community Discussion section if missing (for physics pages and theory pages)
        is_physics_page = '/physics/' in str(file_path)
        is_concepts_page = 'concepts' in file_path.name or 'integration' in file_path.name

        if (is_physics_page or is_concepts_page) and not has_theory_widget(content):
            # Extract page path and title for widget
            rel_page_path = str(file_path.relative_to(BASE_DIR / "mythos")).replace('\\', '/')
            rel_page_path = rel_page_path.replace('.html', '')

            # Try to extract title from <title> tag
            title_match = re.search(r'<title>([^<]+)</title>', content)
            page_title = title_match.group(1) if title_match else "Discussion"
            # Remove " - Kabbalah Physics Integration" suffix if present
            page_title = re.sub(r'\s*-\s*Kabbalah.*$', '', page_title)

            theory_widget_section = f'''
<!-- Community Discussion Section -->
<section class="theory-widget-container" style="margin-top: 3rem;">
    <h2 style="color: var(--color-primary);">Community Discussion</h2>
    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
        Share your thoughts on this theoretical integration. All perspectives welcome!
    </p>
    <div data-theory-widget
         data-page="{rel_page_path}"
         data-title="{page_title}"
         data-mode="inline"></div>
</section>

'''

            # Insert before closing </main> or before Author's Theory section if exists
            if "<!-- Author's Theory Section -->" in content:
                pattern = r"(<!-- Author's Theory Section -->)"
                content = re.sub(pattern, theory_widget_section + r'\1', content)
                modifications.append("Added theory widget section")
            elif '</main>' in content:
                pattern = r'(</main>)'
                content = re.sub(pattern, theory_widget_section + r'\1', content)
                modifications.append("Added theory widget section")

        # 7. Add auth modal container if missing
        if not has_auth_modal(content):
            auth_modal_section = f'''
<!-- Auth Modal Container -->
<div id="auth-modal-container"></div>
<script>
    fetch('{rel_prefix}auth-modal-firebase.html')
        .then(response => response.text())
        .then(html => {{
            document.getElementById('auth-modal-container').innerHTML = html;
        }})
        .catch(error => console.error('Error loading auth modal:', error));
</script>

'''
            # Insert before </body>
            pattern = r'(</body>)'
            content = re.sub(pattern, auth_modal_section + r'\1', content)
            modifications.append("Added auth modal container")

        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            changes_log.append({
                'file': str(file_path.relative_to(BASE_DIR)),
                'modifications': modifications
            })
            return True
        else:
            return False

    except Exception as e:
        errors_log.append({
            'file': str(file_path.relative_to(BASE_DIR)),
            'error': str(e)
        })
        return False

def main():
    """Main execution function."""
    print("=" * 80)
    print("MODERNIZING KABBALAH PAGES")
    print("=" * 80)
    print()

    # Find all HTML files in kabbalah directory
    html_files = list(KABBALAH_DIR.rglob("*.html"))
    print(f"Found {len(html_files)} HTML files in {KABBALAH_DIR}")
    print()

    # Process each file
    updated_count = 0
    skipped_count = 0

    for file_path in sorted(html_files):
        rel_path = file_path.relative_to(BASE_DIR)
        print(f"Processing: {rel_path}")

        if modernize_file(file_path):
            updated_count += 1
            print(f"  [OK] Updated")
        else:
            skipped_count += 1
            print(f"  [SKIP] No changes needed")
        print()

    # Print summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total files processed: {len(html_files)}")
    print(f"Files updated: {updated_count}")
    print(f"Files skipped: {skipped_count}")
    print(f"Errors: {len(errors_log)}")
    print()

    # Print detailed changes
    if changes_log:
        print("=" * 80)
        print("DETAILED CHANGES")
        print("=" * 80)
        for entry in changes_log:
            print(f"\n{entry['file']}:")
            for mod in entry['modifications']:
                print(f"  - {mod}")

    # Print errors if any
    if errors_log:
        print()
        print("=" * 80)
        print("ERRORS")
        print("=" * 80)
        for entry in errors_log:
            print(f"\n{entry['file']}:")
            print(f"  ERROR: {entry['error']}")

    print()
    print("=" * 80)
    print("MODERNIZATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()

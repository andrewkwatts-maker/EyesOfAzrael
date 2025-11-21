#!/usr/bin/env python3
"""
Apply template improvements to all Egyptian deity HTML files:
1. Add section navigation
2. Add section ID anchors
3. Move safety warnings to before theory section (only for radioisotope deities)
4. Improve theory section styling with panels
"""
import re
import os
from pathlib import Path

deities_dir = Path(r"H:\DaedalusSVN\WorldMythology\mythos\egyptian\deities")

# Deities that discuss radioisotopes and need safety warnings
RADIOISOTOPE_DEITIES = [
    "ra.html", "apep.html", "thoth.html", "amun-ra.html",
    "neith.html", "tefnut.html", "isis.html", "osiris.html",
    "anubis.html", "satis.html", "bastet.html", "maat.html"
]

def has_section(content, section_name):
    """Check if a section exists in the content"""
    patterns = [
        rf'<h2[^>]*>\s*.*?{section_name}.*?</h2>',
        rf'<h2[^>]*>\s*<a[^>]*>.*?{section_name}.*?</a>.*?</h2>'
    ]
    for pattern in patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False

def get_section_links(content, deity_name):
    """Generate navigation links based on sections present"""
    sections = []

    section_map = {
        'attributes': ('Attributes', '#attributes'),
        'mythology': ('Mythology & Stories', '#mythology'),
        'relationships': ('Relationships', '#relationships'),
        'worship': ('Worship & Rituals', '#worship'),
        'forms': ('Forms', '#forms'),
        'theories': ("Author's Theories", '#theories'),
    }

    for key, (name, anchor) in section_map.items():
        if has_section(content, name.split('&')[0].strip()):
            sections.append((name, anchor))

    if not sections:
        return ""

    # Generate navigation HTML
    nav_html = '''
<!-- Quick Navigation -->
<nav style="margin-top: 2rem; padding: 1.5rem; background: rgba(0,0,0,0.3); border-radius: var(--radius-lg); border: 1px solid var(--color-border);">
    <h3 style="margin: 0 0 1rem 0; font-size: 1rem; text-transform: uppercase; color: var(--mythos-secondary);">📑 Page Sections</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">'''

    for name, anchor in sections:
        nav_html += f'''
        <a href="{anchor}" style="color: var(--color-text-primary); text-decoration: none; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: var(--radius-md); transition: all 0.2s;">→ {name}</a>'''

    nav_html += '''
    </div>
</nav>'''

    return nav_html

def add_section_navigation(content, deity_name):
    """Add navigation after deity header intro paragraph"""
    # Find the closing </section> of deity-header
    pattern = r'(<section class="deity-header">.*?</p>)(</section>)'

    nav_links = get_section_links(content, deity_name)
    if not nav_links:
        return content

    # Check if navigation already exists
    if '<!-- Quick Navigation -->' in content:
        return content

    replacement = r'\1' + nav_links + r'\n\2'
    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

    return content

def add_section_ids(content):
    """Add ID anchors to major sections"""
    section_ids = {
        r'<section>\s*<h2[^>]*>.*?Attributes.*?</h2>': '<section id="attributes">',
        r'<section[^>]*>\s*<h2[^>]*>.*?Mythology.*?</h2>': lambda m: m.group(0).replace('<section', '<section id="mythology"').replace('<section style=', '<section id="mythology" style='),
        r'<section[^>]*>\s*<h2[^>]*>.*?Relationships.*?</h2>': lambda m: m.group(0).replace('<section', '<section id="relationships"').replace('<section style=', '<section id="relationships" style='),
        r'<section[^>]*>\s*<h2[^>]*>.*?Worship.*?</h2>': lambda m: m.group(0).replace('<section', '<section id="worship"').replace('<section style=', '<section id="worship" style='),
        r'<section[^>]*>\s*<h2[^>]*>.*?Forms.*?</h2>': lambda m: m.group(0).replace('<section', '<section id="forms"').replace('<section style=', '<section id="forms" style='),
        r'<section[^>]*>\s*<h2[^>]*>.*?Author\'s Theories.*?</h2>': lambda m: m.group(0).replace('<section', '<section id="theories"').replace('<section style=', '<section id="theories" style='),
    }

    for pattern, replacement in section_ids.items():
        if callable(replacement):
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        else:
            # For simple string replacement
            matches = list(re.finditer(pattern, content, re.IGNORECASE))
            for match in reversed(matches):
                # Check if id already exists
                if 'id=' not in match.group(0):
                    content = content[:match.start()] + replacement + content[match.start() + len('<section>'):]

    return content

def get_safety_warning_html():
    """Return the safety warning HTML"""
    return '''
<!-- Safety Warning - Positioned Before Theory Section -->
<div class="warning-box" style="background: linear-gradient(135deg, rgba(255, 69, 0, 0.1), rgba(139, 0, 0, 0.1)); border: 2px solid #ff4500; border-radius: 10px; padding: 2rem; margin: 2rem 0;">
    <h2 style="color: #ff4500; margin-top: 0;">⚠️ Safety & Legal Notice</h2>
    <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">
        <strong>IMPORTANT:</strong> The following theoretical section discusses radioactive materials and hazardous chemical compounds. These materials are:
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
        <div style="background: rgba(0, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #ff4500;">
            <h3 style="color: #ff6347; margin-top: 0; font-size: 1.1rem;">☢️ Extremely Radioactive</h3>
            <p style="margin: 0; line-height: 1.6;">Radium-228, Radium-224, Thorium-232, and their decay products emit dangerous alpha, beta, and gamma radiation. Exposure causes radiation poisoning, cancer, and death.</p>
        </div>

        <div style="background: rgba(0, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #ff4500;">
            <h3 style="color: #ff6347; margin-top: 0; font-size: 1.1rem;">⚖️ Strictly Regulated</h3>
            <p style="margin: 0; line-height: 1.6;">Possession, extraction, or processing of radioactive materials is illegal without specific licenses from nuclear regulatory agencies (NRC in US, equivalent worldwide).</p>
        </div>

        <div style="background: rgba(0, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #ff4500;">
            <h3 style="color: #ff6347; margin-top: 0; font-size: 1.1rem;">🔬 Hazardous Chemistry</h3>
            <p style="margin: 0; line-height: 1.6;">The Ne<sub>x</sub>I<sub>4</sub>Th compound and extraction processes involve toxic rare earth elements, corrosive iodine compounds, and dangerous chemical reactions.</p>
        </div>

        <div style="background: rgba(0, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #ff4500;">
            <h3 style="color: #ff6347; margin-top: 0; font-size: 1.1rem;">🏛️ Environmental Hazard</h3>
            <p style="margin: 0; line-height: 1.6;">Radiochemical contamination persists for thousands to millions of years. Improper handling creates permanent environmental damage and threatens public health.</p>
        </div>
    </div>

    <div style="background: rgba(139, 0, 0, 0.3); padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; border: 2px solid #8b0000;">
        <h3 style="color: #ff6347; margin-top: 0;">🚫 DO NOT ATTEMPT</h3>
        <p style="margin: 0; line-height: 1.8; font-size: 1.05rem;">
            <strong>Do not attempt to:</strong> Extract, isolate, concentrate, or handle any radioactive isotopes described in these theories. Do not synthesize the Ne<sub>x</sub>I<sub>4</sub>Th compound. Do not replicate any extraction procedures. Specific technical details have been deliberately withheld to prevent dangerous experimentation.
        </p>
    </div>

    <p style="margin-top: 1.5rem; font-size: 1.1rem; text-align: center; font-weight: bold;">
        📚 This document is for <strong>academic study, historical analysis, and theoretical discussion ONLY.</strong>
    </p>
</div>
'''

def move_safety_warning(content, filename):
    """Move safety warning to before theory section (only for radioisotope deities)"""
    if filename not in RADIOISOTOPE_DEITIES:
        # Remove any existing safety warnings for non-radioisotope deities
        content = re.sub(r'<div class="warning-box".*?</div>\s*(?=<section)', '', content, flags=re.DOTALL)
        return content

    # Check if theory section exists
    if not re.search(r'Author\'s Theories', content, re.IGNORECASE):
        return content

    # Remove any existing warning boxes
    content = re.sub(r'<div class="warning-box".*?</div>\s*', '', content, flags=re.DOTALL)

    # Add warning before theory section
    warning_html = get_safety_warning_html()

    # Find the </main> tag and theory section
    pattern = r'(</main>)\s*(<section[^>]*>?\s*<h2[^>]*>.*?Author\'s Theories.*?</h2>)'
    replacement = r'\1\n' + warning_html + r'\n\2'

    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL | re.IGNORECASE)

    return content

def process_deity_file(filepath):
    """Process a single deity HTML file"""
    filename = filepath.name
    deity_name = filename.replace(".html", "").replace("-", " ").title()

    print(f"Processing {deity_name}...")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Apply improvements
        content = add_section_navigation(content, deity_name)
        content = add_section_ids(content)
        content = move_safety_warning(content, filename)

        # Only write if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [OK] Updated {filename}")
            return True
        else:
            print(f"  [-] No changes needed for {filename}")
            return False

    except Exception as e:
        print(f"  [ERROR] Error processing {filename}: {e}")
        return False

def main():
    print("=" * 80)
    print("APPLYING TEMPLATE IMPROVEMENTS TO EGYPTIAN DEITY FILES")
    print("=" * 80)
    print()

    # Skip index.html and only process deity files
    deity_files = [f for f in deities_dir.glob("*.html") if f.name != "index.html"]

    updated_count = 0
    for filepath in sorted(deity_files):
        if process_deity_file(filepath):
            updated_count += 1

    print()
    print("=" * 80)
    print(f"COMPLETE: Updated {updated_count} of {len(deity_files)} files")
    print("=" * 80)

if __name__ == "__main__":
    main()

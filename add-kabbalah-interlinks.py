#!/usr/bin/env python3
"""
Script to add Kabbalah interlinking across the Eyes of Azrael website.
Phase 1: Kabbalah Integration - adds bidirectional links between
practical magic pages and mythological source content.
"""

import os
import re
from pathlib import Path

# Define the interlinking mappings
KABBALAH_LINKS = {
    # Link from practical-kabbalah.html to Jewish Kabbalah pages
    'magic/traditions/practical-kabbalah.html': {
        'find': r'href="../../mythos/jewish/index\.html"([^>]*>.*?<strong[^>]*>)Jewish Mysticism',
        'replace': r'href="../../mythos/jewish/kabbalah/index.html"\1Kabbalah - Jewish Mysticism',
        'add_after_source_tradition': '''
                        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3);">
                            <a href="../../mythos/jewish/kabbalah/sefirot_overview.html" class="cross-ref-link" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: rgba(var(--color-primary-rgb), 0.05); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-decoration: none;">
                                <span style="font-size: 1.5rem;">🌳</span>
                                <div>
                                    <strong style="color: var(--color-primary);">The Ten Sefirot</strong>
                                    <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Divine emanations & Tree of Life</div>
                                </div>
                            </a>
                            <a href="../../mythos/jewish/kabbalah/names_overview.html" class="cross-ref-link" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: rgba(var(--color-primary-rgb), 0.05); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-decoration: none;">
                                <span style="font-size: 1.5rem;">✨</span>
                                <div>
                                    <strong style="color: var(--color-primary);">72 Names of God</strong>
                                    <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Divine names & practical applications</div>
                                </div>
                            </a>
                            <a href="../../mythos/jewish/kabbalah/worlds_overview.html" class="cross-ref-link" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: rgba(var(--color-primary-rgb), 0.05); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-decoration: none;">
                                <span style="font-size: 1.5rem;">🌌</span>
                                <div>
                                    <strong style="color: var(--color-primary);">Four Worlds</strong>
                                    <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Atziluth, Beriah, Yetzirah, Assiah</div>
                                </div>
                            </a>
                        </div>'''
    },

    # Link from Middle Pillar to specific Kabbalah pages
    'magic/energy/middle-pillar.html': {
        'add_section_if_missing': '''
    <div class="interlink-panel" style="background: var(--color-surface); border: 2px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-8); margin: var(--space-10) 0;">
        <h3 style="color: var(--color-primary); margin-bottom: var(--space-6);">🔗 Kabbalistic Sources</h3>
        <div class="interlink-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4);">
            <a href="../../mythos/jewish/kabbalah/sefirot_overview.html" class="interlink-card" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: rgba(var(--color-primary-rgb), 0.1); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-decoration: none;">
                <span style="font-size: 2rem;">🌳</span>
                <div>
                    <h4 style="color: var(--color-text-primary); margin: 0;">The Ten Sefirot</h4>
                    <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">Kabbalistic Tree of Life emanations</p>
                </div>
            </a>
            <a href="../../mythos/jewish/kabbalah/names_overview.html" class="interlink-card" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: rgba(var(--color-primary-rgb), 0.1); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-decoration: none;">
                <span style="font-size: 2rem;">✨</span>
                <div>
                    <h4 style="color: var(--color-text-primary); margin: 0;">Divine Names</h4>
                    <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">Hebrew names used in the ritual</p>
                </div>
            </a>
            <a href="../../mythos/jewish/kabbalah/index.html" class="interlink-card" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: rgba(var(--color-primary-rgb), 0.1); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-decoration: none;">
                <span style="font-size: 2rem;">✡️</span>
                <div>
                    <h4 style="color: var(--color-text-primary); margin: 0;">Kabbalah Overview</h4>
                    <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">Complete Jewish mystical system</p>
                </div>
            </a>
        </div>
    </div>'''
    }
}

# Links to add back from Kabbalah pages to practical magic
REVERSE_LINKS = {
    'mythos/jewish/kabbalah/index.html': {
        'add_modern_practice_section': '''
    <div class="glass-card" style="background: rgba(var(--color-surface-rgb), 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(var(--color-primary-rgb), 0.2); border-radius: var(--radius-lg); padding: var(--spacing-xl); margin: 2rem 0;">
        <h2 style="color: var(--color-primary); margin-bottom: 1.5rem;">🔮 Modern Practical Applications</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">
            While Kabbalah is primarily a mystical and contemplative tradition, some practitioners engage in practical applications:
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <a href="../../magic/traditions/practical-kabbalah.html" class="deity-card" style="display: block; padding: 1.5rem; background: rgba(var(--color-primary-rgb), 0.05); border: 2px solid rgba(var(--color-primary-rgb), 0.2); border-radius: var(--radius-md); text-decoration: none;">
                <div style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">📜</div>
                <h3 style="color: var(--color-primary); margin-top: 0.5rem;">Practical Kabbalah</h3>
                <p style="color: var(--color-text-secondary);">Magical applications of divine names and amulets</p>
            </a>
            <a href="../../magic/energy/middle-pillar.html" class="deity-card" style="display: block; padding: 1.5rem; background: rgba(var(--color-primary-rgb), 0.05); border: 2px solid rgba(var(--color-primary-rgb), 0.2); border-radius: var(--radius-md); text-decoration: none;">
                <div style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">⚡</div>
                <h3 style="color: var(--color-primary); margin-top: 0.5rem;">Middle Pillar Ritual</h3>
                <p style="color: var(--color-text-secondary);">Energy work using the Sephiroth</p>
            </a>
            <a href="../../mythos/tarot/cosmology/tree-of-life.html" class="deity-card" style="display: block; padding: 1.5rem; background: rgba(var(--color-primary-rgb), 0.05); border: 2px solid rgba(var(--color-primary-rgb), 0.2); border-radius: var(--radius-md); text-decoration: none;">
                <div style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">🃏</div>
                <h3 style="color: var(--color-primary); margin-top: 0.5rem;">Tarot & Tree of Life</h3>
                <p style="color: var(--color-text-secondary);">Mapping the Major Arcana to Kabbalistic paths</p>
            </a>
        </div>
    </div>'''
    }
}

def add_interlinks():
    """Main function to add Kabbalah interlinks."""
    base_path = Path(__file__).parent
    changes_made = []

    print("Adding Kabbalah interlinking...")
    print("=" * 60)

    # Process forward links (magic → mythology)
    for file_path, operations in KABBALAH_LINKS.items():
        full_path = base_path / file_path
        if not full_path.exists():
            print(f"⚠️  File not found: {file_path}")
            continue

        print(f"\n📝 Processing: {file_path}")

        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Apply regex replacements
        if 'find' in operations and 'replace' in operations:
            content = re.sub(operations['find'], operations['replace'], content, flags=re.DOTALL)

        # Add sections after markers
        if 'add_after_source_tradition' in operations:
            # Find the closing </a> tag of the source tradition link
            pattern = r'(href="../../mythos/jewish/kabbalah/index\.html"[^>]*>.*?</a>)'
            if re.search(pattern, content, re.DOTALL):
                content = re.sub(
                    pattern,
                    r'\1' + operations['add_after_source_tradition'],
                    content,
                    flags=re.DOTALL,
                    count=1
                )

        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            changes_made.append(file_path)
            print(f"✅ Updated {file_path}")
        else:
            print(f"ℹ️  No changes needed for {file_path}")

    # Process reverse links (mythology → magic)
    for file_path, operations in REVERSE_LINKS.items():
        full_path = base_path / file_path
        if not full_path.exists():
            print(f"⚠️  File not found: {file_path}")
            continue

        print(f"\n📝 Processing: {file_path}")

        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Add modern practice section if missing
        if 'add_modern_practice_section' in operations:
            if 'Modern Practical Applications' not in content:
                # Insert before footer or at end of main content
                footer_pattern = r'(<footer|</main>)'
                if re.search(footer_pattern, content):
                    content = re.sub(
                        footer_pattern,
                        operations['add_modern_practice_section'] + r'\n\1',
                        content,
                        count=1
                    )

        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            changes_made.append(file_path)
            print(f"✅ Updated {file_path}")
        else:
            print(f"ℹ️  No changes needed for {file_path}")

    print("\n" + "=" * 60)
    print(f"✨ Complete! Modified {len(changes_made)} files")
    if changes_made:
        print("\nFiles changed:")
        for f in changes_made:
            print(f"  - {f}")

    return len(changes_made)

if __name__ == '__main__':
    changes = add_interlinks()
    exit(0 if changes >= 0 else 1)

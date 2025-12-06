#!/usr/bin/env python3
"""
Script to remove inline theory sections from deity pages and replace with collapsed links
"""

import re
from pathlib import Path

EGYPTIAN_THEORY_REPLACEMENT = '''
<!-- Author's Theory Section -->
<section style="margin-top: 2rem; padding: 0 2rem;">
    <details style="background: rgba(147, 51, 234, 0.1); border: 2px solid var(--mythos-primary); border-radius: var(--radius-lg); padding: 1.5rem; margin: 1rem 0;">
        <summary style="cursor: pointer; font-size: 1.2rem; font-weight: bold; color: var(--mythos-primary);">
            💡 Author's Theories & Extended Analysis
        </summary>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
            <p style="line-height: 1.8;">
                The author has developed extensive theories connecting Egyptian deity mythology to scientific concepts,
                particularly <strong>radioactive isotopes, chemical compounds, and physical processes</strong>. These interpretations
                explore potential encoding of advanced knowledge in ancient Egyptian religious symbolism.
            </p>
            <p style="margin-top: 1rem; line-height: 1.8;">
                <strong>⚠️ Please Note:</strong> These are <em>speculative personal theories</em>, not established Egyptology.
                They include detailed technical discussions of radioactive materials and chemical processes.
            </p>
            <div style="margin-top: 1.5rem; text-align: center;">
                <a href="../../../theories/user-submissions/egyptian-scientific-encoding.html"
                   style="display: inline-block; background: linear-gradient(135deg, var(--mythos-primary), var(--mythos-secondary));
                          color: white; padding: 0.75rem 2rem; border-radius: var(--radius-md); text-decoration: none;
                          font-weight: bold; transition: transform 0.2s;">
                    📖 Read Full Theory & Analysis →
                </a>
            </div>
        </div>
    </details>
</section>

'''

KABBALAH_THEORY_REPLACEMENT = '''
<!-- Author's Theory Section -->
<section style="margin-top: 2rem; padding: 0 2rem;">
    <details style="background: rgba(147, 51, 234, 0.1); border: 2px solid var(--color-primary); border-radius: var(--radius-lg); padding: 1.5rem; margin: 1rem 0;">
        <summary style="cursor: pointer; font-size: 1.2rem; font-weight: bold; color: var(--color-primary);">
            💡 Author's Theories: Kabbalah-Physics Integration
        </summary>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
            <p style="line-height: 1.8;">
                The author has developed theories connecting Kabbalistic concepts to modern theoretical physics,
                including <strong>string theory, M-theory, Calabi-Yau manifolds, and dimensional hierarchies</strong>.
                These interpretations explore potential structural correspondences between ancient mystical frameworks
                and contemporary scientific models.
            </p>
            <p style="margin-top: 1rem; line-height: 1.8;">
                <strong>⚠️ Please Note:</strong> These are <em>speculative personal theories</em>, not established physics
                or Kabbalistic scholarship. The physics models referenced (string theory, M-theory) are themselves
                highly speculative and unproven.
            </p>
            <div style="margin-top: 1.5rem; text-align: center;">
                <a href="../../../../theories/user-submissions/kabbalah-physics-integration.html"
                   style="display: inline-block; background: linear-gradient(135deg, var(--color-primary), #FFD700);
                          color: white; padding: 0.75rem 2rem; border-radius: var(--radius-md); text-decoration: none;
                          font-weight: bold; transition: transform 0.2s;">
                    📖 Read Full Theory & Analysis →
                </a>
            </div>
        </div>
    </details>
</section>

'''

def clean_egyptian_deities():
    """Remove theory sections from Egyptian deity pages"""
    deity_dir = Path("mythos/egyptian/deities")

    for html_file in deity_dir.glob("*.html"):
        if html_file.name == "ra.html":
            print(f"Skipping {html_file.name} (already updated manually)")
            continue

        content = html_file.read_text(encoding='utf-8')

        # Check if this file has a theory section
        if "Author's Theories" not in content:
            print(f"Skipping {html_file.name} (no theory section found)")
            continue

        # Find the </main> tag and <footer> tag
        main_end = content.find('</main>')
        footer_start = content.find('<footer>')

        if main_end == -1 or footer_start == -1:
            print(f"Warning: Could not find boundaries in {html_file.name}")
            continue

        # Extract everything before </main> and after <footer> start
        before = content[:main_end + len('</main>')]
        after = content[footer_start:]

        # Combine with new theory replacement
        new_content = before + EGYPTIAN_THEORY_REPLACEMENT + after

        # Write back
        html_file.write_text(new_content, encoding='utf-8')
        print(f"[OK] Updated {html_file.name}")

def clean_kabbalah_physics():
    """Remove theory disclaimers from Kabbalah physics pages"""
    kabbalah_files = [
        "mythos/jewish/kabbalah/physics-integration.html",
        "mythos/jewish/kabbalah/physics/72-names.html",
        "mythos/jewish/kabbalah/physics/10-sefirot.html",
        "mythos/jewish/kabbalah/physics/4-worlds.html",
        "mythos/jewish/kabbalah/physics/288-sparks.html",
        "mythos/jewish/kabbalah/sefirot/physics-integration.html",
        "mythos/jewish/kabbalah/worlds/physics-integration.html",
        "mythos/jewish/kabbalah/concepts-physics-integration.html",
    ]

    for file_path in kabbalah_files:
        path = Path(file_path)
        if not path.exists():
            print(f"Skipping {file_path} (not found)")
            continue

        content = path.read_text(encoding='utf-8')

        # Check if there's a user theory warning/disclaimer
        if "user theory" not in content.lower() and "disclaimer" not in content.lower():
            print(f"Skipping {path.name} (no user theory section found)")
            continue

        # For Kabbalah pages, we'll add the collapsed section at the end of main, before footer
        main_end = content.find('</main>')
        footer_start = content.find('<footer>')

        if main_end == -1:
            print(f"Warning: No </main> found in {path.name}, skipping")
            continue

        # Remove any existing disclaimer sections (look for common patterns)
        # This is a simplified approach - may need manual review
        patterns_to_remove = [
            r'<div[^>]*class="user-theory-warning".*?</div>',
            r'<section[^>]*>.*?user theory.*?</section>',
            r'<div[^>]*>.*?⚠️.*?[Uu]ser.*?[Tt]heory.*?</div>',
        ]

        for pattern in patterns_to_remove:
            content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)

        # Insert new collapsed section before </main>
        new_content = content[:main_end] + KABBALAH_THEORY_REPLACEMENT + content[main_end:]

        path.write_text(new_content, encoding='utf-8')
        print(f"[OK] Updated {path.name}")

if __name__ == "__main__":
    print("=== Cleaning Egyptian Deity Pages ===")
    clean_egyptian_deities()

    print("\n=== Cleaning Kabbalah Physics Pages ===")
    clean_kabbalah_physics()

    print("\n[DONE] All pages updated!")

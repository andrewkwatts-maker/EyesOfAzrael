#!/usr/bin/env python3
"""
Enhance theory sections for major deities with improved panel styling and cross-references.
Based on Ra's template design.
"""
import re
from pathlib import Path

deities_dir = Path(r"H:\DaedalusSVN\WorldMythology\mythos\egyptian\deities")

# Cross-reference data for major deities
CROSS_REFERENCES = {
    "apep.html": {
        "main_theory": "Apep as Alpha Particles: 'He Who Was Spat Out'",
        "chemical_formula": "α (He⁴⁺⁺)",
        "icon": "🐍",
        "properties": [
            ("Particle Type", "Alpha (He-4 nucleus)"),
            ("Charge", "+2 (doubly ionized helium)"),
            ("Mass", "4 atomic mass units"),
            ("Key Property", "High ionization, short range")
        ],
        "related": [
            {
                "deity": "Ra",
                "icon": "☀️",
                "formula": "Radium-228 (²²⁸Ra)",
                "description": "The sun god represents the radioactive source that continuously emits Apep (alpha particles) during decay.",
                "link_text": "→ Source of alpha emission"
            },
            {
                "deity": "Neith",
                "icon": "🕸️",
                "formula": "Ne(x)I₄Th Compound",
                "description": "The weaving goddess extracts radioisotopes from the decay chain, enabling the 12-state transformation sequence.",
                "link_text": "→ Extraction framework"
            },
            {
                "deity": "Thoth",
                "icon": "📜",
                "formula": "Thorium-228 (ThO₂)",
                "description": "The scribe god represents Thorium-228 at Hour 4 of the decay chain, documenting the transformation sequence.",
                "link_text": "→ Hour 4 in the decay chain"
            },
            {
                "deity": "Set",
                "icon": "⚡",
                "formula": "Chaos/Shielding",
                "description": "The storm god 'spears Apep nightly' = radiation shielding and containment of dangerous alpha particles.",
                "link_text": "→ Containment of radiation"
            }
        ],
        "decay_chain": """<strong>12-Hour Journey (Decay Chain):</strong><br>
Hour 1: Th-232 → Hour 2: <span style="color: var(--mythos-primary);">⬤ Ra-228</span> → Hour 3: Ac-228 →<br>
Hour 4: Th-228 (Thoth) → Hour 5: Ra-224 (Amun-Ra) → Hour 6: Rn-220 →<br>
Hours 7-10: Po-216 → Pb-212 → Bi-212 → Pb-208 (stable)<br>
<span style="color: #FFA500;">⬤ = Alpha emission points (Apep manifests)</span>"""
    },

    "neith.html": {
        "main_theory": "Neith as Ne(x)I₄Th: The Extraction Compound",
        "chemical_formula": "Ne(x)I₄Th",
        "icon": "🕸️",
        "properties": [
            ("Formula", "Neodymium/Neon-Iodine-Thorium complex"),
            ("Function", "Radioisotope extraction/separation"),
            ("Symbolism", "Weaving = chemical separation"),
            ("Key Property", "Enables Ra isolation from waters")
        ],
        "related": [
            {
                "deity": "Ra",
                "icon": "☀️",
                "formula": "Radium-228",
                "description": "Neith 'births' Ra by extracting Radium-228 from thorium-bearing minerals and waters using her chemical compound.",
                "link_text": "→ Product of extraction"
            },
            {
                "deity": "Apep",
                "icon": "🐍",
                "formula": "Alpha Particles",
                "description": "The extraction process separates isotopes along the decay chain where Apep (alpha emission) occurs.",
                "link_text": "→ Decay chain context"
            },
            {
                "deity": "Thoth",
                "icon": "📜",
                "formula": "Thorium-228",
                "description": "Thorium compounds are the starting material from which Neith extracts Ra and other isotopes.",
                "link_text": "→ Source material (parent isotope)"
            },
            {
                "deity": "Amun-Ra",
                "icon": "👁️",
                "formula": "Radium-224",
                "description": "Second extraction point in the decay chain, 'hidden' isotope with shorter half-life (3.6 days).",
                "link_text": "→ Second extraction point"
            }
        ],
        "decay_chain": """<strong>5 Extraction Points in Decay Chain:</strong><br>
1. <span style="color: var(--mythos-primary);">⬤ Ra-228</span> (5.75y) - Neith extracts Ra<br>
2. Th-228 (1.9y) - Thoth, intermediate stage<br>
3. <span style="color: var(--mythos-primary);">⬤ Ra-224</span> (3.6d) - Amun-Ra, hidden Ra<br>
4. Rn-220 (55s) - Gaseous emanation<br>
5. Pb-212/Bi-212 - Medical isotopes"""
    },

    "thoth.html": {
        "main_theory": "Thoth as Thorium-228: ThO₂ and Nuclear Wisdom",
        "chemical_formula": "ThO₂, ²²⁸Th",
        "icon": "📜",
        "properties": [
            ("Chemical Formula", "ThO₂ (Thorium dioxide)"),
            ("Isotope", "²²⁸Th (Thorium-228)"),
            ("Half-Life", "1.9 years"),
            ("Key Property", "Parent of Radium-224, gas mantle illumination")
        ],
        "related": [
            {
                "deity": "Ra",
                "icon": "☀️",
                "formula": "Radium-228",
                "description": "Ra is derived from Thoth in the decay chain: Thorium-228 decays into Radium-224 (Amun-Ra).",
                "link_text": "→ Decay relationship"
            },
            {
                "deity": "Amun-Ra",
                "icon": "👁️",
                "formula": "Radium-224",
                "description": "Thoth (Th-228) directly decays into Amun-Ra (Ra-224) through alpha emission at Hour 4.",
                "link_text": "→ Direct daughter isotope"
            },
            {
                "deity": "Tefnut",
                "icon": "💧",
                "formula": "UF₆",
                "description": "Tefnut's uranium hexafluoride reacts with Thoth to form ThF₄ (thorium tetrafluoride) for fiber optics.",
                "link_text": "→ ThF₄ formation reaction"
            },
            {
                "deity": "Apep",
                "icon": "🐍",
                "formula": "Alpha Particles",
                "description": "Thoth appears at Hour 4 of Apep's 12-hour journey, emitting alpha particles during decay.",
                "link_text": "→ Hour 4 in decay chain"
            }
        ],
        "decay_chain": """<strong>Thoth's Position (Hour 4):</strong><br>
Hour 1: Th-232 → Hour 2: Ra-228 → Hour 3: Ac-228 →<br>
Hour 4: <span style="color: var(--mythos-primary);">⬤ Th-228 (Thoth)</span> → Hour 5: Ra-224 (Amun-Ra) →<br>
Hour 6: Rn-220 → ... → Pb-208<br>
<em>ThO₂ Etymology: Th-O-Th = Thorium-Oxygen-Thorium</em>"""
    }
}

def create_core_theory_panel(deity_file):
    """Generate core theory overview panel"""
    if deity_file not in CROSS_REFERENCES:
        return ""

    data = CROSS_REFERENCES[deity_file]
    props_html = ""
    for label, value in data["properties"]:
        props_html += f"""
            <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-md); border-left: 3px solid var(--mythos-secondary);">
                <strong style="color: var(--mythos-secondary);">{label}:</strong><br>
                {value}
            </div>"""

    panel = f"""
    <!-- Theory Overview Panel -->
    <div style="background: linear-gradient(135deg, rgba(205, 133, 63, 0.15), rgba(218, 165, 32, 0.15)); border: 2px solid var(--mythos-primary); border-radius: var(--radius-lg); padding: 2rem; margin-bottom: 2rem;">
        <h3 style="color: var(--mythos-primary); margin-top: 0; font-size: 1.8rem;">⚛️ Core Theory: {data["main_theory"]}</h3>
        <p style="font-size: 1.15rem; line-height: 1.8; margin: 1rem 0;">
            <strong>{data["chemical_formula"]}</strong>
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1.5rem;">{props_html}
        </div>
    </div>
"""
    return panel

def create_cross_reference_panel(deity_file):
    """Generate cross-reference panel for a deity"""
    if deity_file not in CROSS_REFERENCES:
        return ""

    data = CROSS_REFERENCES[deity_file]

    # Create deity cards
    cards_html = ""
    for related in data["related"]:
        deity_lower = related["deity"].lower().replace(" ", "-").replace("'", "")
        cards_html += f"""
            <!-- {related["deity"]} -->
            <a href="{deity_lower}.html#theories" style="text-decoration: none; color: inherit;">
                <div style="background: var(--color-surface); border: 2px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; transition: all 0.3s; cursor: pointer;" onmouseover="this.style.borderColor='var(--mythos-primary)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)';" onmouseout="this.style.borderColor='var(--color-border)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">{related["icon"]}</div>
                    <h5 style="color: var(--mythos-primary); margin: 0.5rem 0; font-size: 1.2rem;">{related["deity"]}</h5>
                    <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: var(--color-text-secondary);">
                        <strong>{related["formula"]}</strong><br>
                        {related["description"]}
                    </p>
                    <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--mythos-secondary);">
                        {related["link_text"]}
                    </p>
                </div>
            </a>
"""

    panel = f"""
    <!-- Cross-Reference Panel -->
    <div style="background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(205, 133, 63, 0.1)); border: 2px solid var(--mythos-secondary); border-radius: var(--radius-lg); padding: 2rem; margin-top: 3rem;">
        <h4 style="color: var(--mythos-secondary); margin-top: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🔗</span> Related Deity Theories
        </h4>
        <p style="margin-bottom: 1.5rem; line-height: 1.8;">
            {data["main_theory"].split(':')[0]}'s theory is interconnected with several other deities in the thorium-232 decay chain and extraction framework:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
{cards_html}
        </div>

        <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); border-left: 4px solid var(--mythos-secondary);">
            <h5 style="color: var(--mythos-secondary); margin: 0 0 1rem 0;">Decay Chain Position:</h5>
            <div style="font-family: monospace; font-size: 0.9rem; line-height: 1.8; overflow-x: auto;">
                {data["decay_chain"]}
            </div>
        </div>
    </div>
"""
    return panel

def enhance_deity_file(filepath):
    """Enhance a deity file with improved styling"""
    filename = filepath.name

    if filename not in CROSS_REFERENCES:
        return False

    deity_name = filename.replace(".html", "").replace("-", " ").title()
    print(f"Enhancing {deity_name}...")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Add core theory panel after the italic intro paragraph if not already present
        if '<!-- Theory Overview Panel -->' not in content:
            core_panel = create_core_theory_panel(filename)
            # Find the intro paragraph in theory section
            pattern = r'(This section contains original research.*?</p>)\s*(<h3)'
            if re.search(pattern, content, re.DOTALL):
                content = re.sub(pattern, r'\1\n\n' + core_panel + r'\n    \2', content, flags=re.DOTALL)

        # Add cross-reference panel before closing theory section if not already present
        if '<!-- Cross-Reference Panel -->' not in content:
            cross_ref_panel = create_cross_reference_panel(filename)
            # Find the end of theory section (before </div>\n</section> that closes theories)
            pattern = r'(</ul>|</p>|</div>)\s*(</div>\s*</section>\s*<footer>)'
            if re.search(pattern, content, re.DOTALL):
                # Insert before the closing divs
                content = re.sub(
                    r'(</div>\s*</section>\s*<footer>)',
                    cross_ref_panel + r'\n</div>\n</section>\n<footer>',
                    content,
                    count=1
                )

        # Write if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [OK] Enhanced {filename}")
            return True
        else:
            print(f"  [-] No changes needed for {filename}")
            return False

    except Exception as e:
        print(f"  [ERROR] Error enhancing {filename}: {e}")
        return False

def main():
    print("=" * 80)
    print("ENHANCING MAJOR DEITY THEORY SECTIONS")
    print("=" * 80)
    print()

    enhanced_count = 0
    for filename in CROSS_REFERENCES.keys():
        filepath = deities_dir / filename
        if filepath.exists():
            if enhance_deity_file(filepath):
                enhanced_count += 1

    print()
    print("=" * 80)
    print(f"COMPLETE: Enhanced {enhanced_count} of {len(CROSS_REFERENCES)} major deity files")
    print("=" * 80)

if __name__ == "__main__":
    main()

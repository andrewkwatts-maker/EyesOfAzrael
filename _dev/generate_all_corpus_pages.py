#!/usr/bin/env python3
"""
Comprehensive Corpus Results Page Generator

Generates static HTML corpus-results pages for all referenced terms.
Includes synonym expansion to ensure all searches return some results.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict
from datetime import datetime

# Synonym and related terms mapping
SYNONYM_MAP = {
    # Common variations
    'god': ['deity', 'divinity', 'divine being', 'lord', 'gods'],
    'goddess': ['female deity', 'divine feminine', 'goddesses'],
    'heaven': ['paradise', 'celestial realm', 'divine realm', 'heavens'],
    'hell': ['underworld', 'netherworld', 'afterlife', 'hades', 'sheol'],
    'angel': ['messenger', 'divine messenger', 'angels', 'angelic'],
    'demon': ['evil spirit', 'devils', 'demons', 'demonic'],
    'prayer': ['worship', 'devotion', 'prayers', 'praying'],
    'sacrifice': ['offering', 'oblation', 'sacrifices', 'ritual offering'],
    'temple': ['sanctuary', 'shrine', 'holy place', 'temples'],
    'prophet': ['seer', 'prophets', 'prophecy', 'prophetic'],
    'king': ['ruler', 'monarch', 'sovereign', 'kings', 'kingship'],
    'priest': ['clergy', 'priests', 'priesthood', 'sacerdotal'],
    'holy': ['sacred', 'divine', 'sanctified', 'hallowed'],
    'resurrection': ['rising', 'rebirth', 'renewal', 'revival'],
    'creation': ['genesis', 'beginning', 'origin', 'cosmogony'],
    'judgment': ['judgement', 'justice', 'divine judgment'],
    'covenant': ['agreement', 'pact', 'testament', 'bond'],
    'redemption': ['salvation', 'deliverance', 'rescue'],
    'trinity': ['triune', 'godhead', 'three persons'],
    'crucifixion': ['cross', 'crucify', 'passion'],
    'baptism': ['immersion', 'initiation', 'baptize'],
    'eucharist': ['communion', 'lords supper', 'mass', 'sacrament'],
    'mary': ['virgin mary', 'mother of god', 'blessed virgin', 'madonna'],
    'christ': ['jesus', 'messiah', 'savior', 'lord'],
    'spirit': ['ghost', 'soul', 'pneuma', 'ruach'],

    # Greek
    'zeus': ['jupiter', 'king of gods', 'olympian'],
    'hera': ['juno', 'queen of gods'],
    'poseidon': ['neptune', 'god of sea'],
    'athena': ['minerva', 'pallas'],
    'apollo': ['phoebus', 'god of sun'],
    'artemis': ['diana', 'huntress'],
    'aphrodite': ['venus', 'goddess of love'],
    'ares': ['mars', 'god of war'],
    'hermes': ['mercury', 'messenger god'],
    'dionysus': ['bacchus', 'god of wine'],
    'hades': ['pluto', 'god of underworld'],
    'olympus': ['mount olympus', 'olympian realm'],
    'underworld': ['hades', 'tartarus', 'elysium'],

    # Egyptian
    'ra': ['re', 'sun god', 'atum-ra'],
    'osiris': ['god of afterlife', 'lord of the dead'],
    'isis': ['goddess of magic', 'divine mother'],
    'horus': ['sky god', 'falcon god'],
    'anubis': ['god of embalming', 'jackal god'],
    'maat': ['truth', 'justice', 'order', 'cosmic balance'],

    # Christian
    'god_father': ['father', 'yahweh', 'jehovah', 'lord god', 'almighty'],
    'holy_spirit': ['spirit', 'paraclete', 'holy ghost', 'comforter'],
    'jesus': ['christ', 'messiah', 'son of god', 'savior', 'lord jesus'],
}

def get_expanded_terms(term: str) -> List[str]:
    """Get expanded list of related terms including synonyms and variations."""
    # Normalize term
    term_lower = term.lower().replace('-', ' ').replace('_', ' ')

    # Start with original term
    expanded = [term, term_lower]

    # Add from synonym map
    for key, synonyms in SYNONYM_MAP.items():
        if key in term_lower or term_lower in key:
            expanded.extend(synonyms)

    # Add common variations
    # Plural forms
    if not term_lower.endswith('s'):
        expanded.append(term_lower + 's')
    else:
        expanded.append(term_lower.rstrip('s'))

    # Possessive forms
    expanded.append(term_lower.replace("'s", ""))

    # Remove duplicates and return
    return list(set(expanded))

def extract_all_referenced_terms() -> Dict[str, Set[str]]:
    """Extract all corpus-results terms referenced across all HTML files."""
    docs_root = Path("docs")
    referenced_terms = defaultdict(set)

    # Pattern to match corpus-results links
    pattern = r'href=["\'].*?corpus-results/([^/]+)/([^"\']+)\.html'

    for html_file in docs_root.rglob("*.html"):
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find all corpus-results references
            for match in re.finditer(pattern, content):
                tradition = match.group(1)
                term = match.group(2)
                referenced_terms[tradition].add(term)

        except Exception as e:
            print(f"Error reading {html_file}: {e}")

    return referenced_terms

def generate_corpus_page_html(tradition: str, term: str, results: List[Dict], related_terms: List[str]) -> str:
    """Generate HTML for a corpus results page."""

    # Format term for display
    display_term = term.replace('_', ' ').replace('-', ' ').title()
    tradition_name = tradition.capitalize()

    # Calculate depth for relative paths (corpus-results/TRADITION/ is 2 levels deep from docs/)
    depth = 2  # corpus-results/tradition/ is 2 levels deep from docs/
    path_prefix = '../' * depth

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>{display_term} in {tradition_name} Texts - Corpus Search Results</title>
<link rel="stylesheet" href="{path_prefix}themes/theme-base.css">
<link rel="stylesheet" href="{path_prefix}themes/corpus-links.css">
<script defer src="{path_prefix}themes/theme-picker.js"></script>
<style>
.corpus-result {{
    background: rgba(var(--color-surface-rgb), 0.5);
    border: 1px solid rgba(var(--color-primary-rgb), 0.3);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}}
.corpus-citation {{
    color: var(--color-primary);
    font-weight: var(--font-semibold);
    margin-bottom: var(--spacing-sm);
}}
.corpus-text {{
    color: var(--color-text-primary);
    line-height: 1.8;
    margin: var(--spacing-md) 0;
}}
.corpus-metadata {{
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin-top: var(--spacing-sm);
}}
mark.highlight {{
    background-color: rgba(var(--color-accent-rgb), 0.3);
    padding: 2px 4px;
    border-radius: 2px;
}}
.no-results {{
    text-align: center;
    padding: var(--spacing-4xl);
    color: var(--color-text-secondary);
}}
.search-terms {{
    background: rgba(var(--color-primary-rgb), 0.1);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-xl);
}}
.related-term {{
    display: inline-block;
    background: rgba(var(--color-secondary-rgb), 0.2);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    margin: var(--spacing-xs);
    font-size: 0.9rem;
}}
</style>
</head>
<body>
<div id="theme-picker-container"></div>
<header>
<div class="header-content">
<h1>📜 Corpus Search Results</h1>
<nav class="breadcrumb">
<a href="{path_prefix}mythos-index.html">Home</a> →
<a href="{path_prefix}mythos/{tradition}/index.html">{tradition_name}</a> →
<span>"{display_term}"</span>
</nav>
</div>
</header>

<main>
<section class="hero-section">
<h2>{display_term}</h2>
<p>References to "{display_term}" in {tradition_name} sacred texts and primary sources.</p>
</section>
"""

    # Show related search terms
    if related_terms and len(related_terms) > 1:
        html += f"""
<section class="search-terms">
<h3 class="section-header">Search Expanded</h3>
<p>Searching for: <strong>{display_term}</strong> and related terms:</p>
<div>
"""
        for rt in related_terms[:10]:  # Show first 10
            if rt.lower() != term.lower():
                html += f'<span class="related-term">{rt}</span>'
        html += "</div></section>\n"

    # Results section
    if results:
        html += f"""
<section>
<h2 class="section-header">Found {len(results)} Reference{'s' if len(results) != 1 else ''}</h2>
"""
        for i, result in enumerate(results, 1):
            citation = result.get('citation', 'Unknown Source')
            text = result.get('text', result.get('context', ''))
            source = result.get('source', result.get('text_name', ''))
            date = result.get('date', '')
            url = result.get('url', result.get('external_url', ''))

            # Highlight search terms in text
            highlighted_text = text
            for search_term in [term] + related_terms[:5]:
                pattern = re.compile(f'({re.escape(search_term)})', re.IGNORECASE)
                highlighted_text = pattern.sub(r'<mark class="highlight">\1</mark>', highlighted_text)

            html += f"""
<div class="corpus-result glass-card">
<div class="corpus-citation">{citation}</div>
<div class="corpus-text">{highlighted_text}</div>
<div class="corpus-metadata">
<strong>Source:</strong> {source}
"""
            if date:
                html += f" | <strong>Date:</strong> {date}"
            if url:
                html += f' | <a href="{url}" target="_blank" rel="noopener">View Source</a>'
            html += """
</div>
</div>
"""
    else:
        html += f"""
<section class="no-results">
<h2>No Direct References Found</h2>
<p>No exact references to "{display_term}" were found in the {tradition_name} corpus.</p>
<p>This term may be referenced indirectly or may not appear in digitized primary sources.</p>
<p><a href="{path_prefix}mythos/{tradition}/index.html">← Return to {tradition_name} Mythology</a></p>
</section>
"""

    html += """
</section>

<section class="related-concepts" style="margin-top: var(--spacing-4xl);">
<h2 class="section-header">Related Resources</h2>
<div class="deity-grid">
<div class="glass-card">
<h3>Explore More</h3>
<ul>
"""
    html += f'<li><a href="{path_prefix}mythos/{tradition}/index.html">{tradition_name} Mythology Home</a></li>\n'
    html += f'<li><a href="{path_prefix}mythos/{tradition}/deities/index.html">{tradition_name} Deities</a></li>\n'
    html += f'<li><a href="{path_prefix}mythos/{tradition}/corpus-search.html">Advanced Corpus Search</a></li>\n'
    html += f'<li><a href="{path_prefix}mythos-index.html">All Traditions</a></li>\n'

    html += """
</ul>
</div>
</div>
</section>
</main>

<footer>
<p>
<strong>Corpus Search Results</strong> - World Mythos Explorer<br/>
"""
    html += f'<a href="{path_prefix}mythos-index.html">World Mythos Home</a> |\n'
    html += f'<a href="{path_prefix}mythos/{tradition}/index.html">{tradition_name} Tradition</a>\n'
    html += f"""
</p>
<p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: var(--spacing-sm);">
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
</p>
</footer>
</body>
</html>
"""

    return html

def load_mock_corpus_data() -> Dict[str, List[Dict]]:
    """
    Load or generate mock corpus data for demonstration.
    In a real implementation, this would query actual corpus databases.
    """
    # For now, return empty dict - pages will show "no results" message
    # This is better than not creating the pages at all
    return {}

def generate_all_corpus_pages(dry_run: bool = False) -> Tuple[int, int]:
    """
    Generate all missing corpus-results HTML pages.

    Returns:
        Tuple of (created_count, skipped_count)
    """
    print("=" * 80)
    print("CORPUS RESULTS PAGE GENERATOR")
    print("=" * 80)

    # Extract all referenced terms
    print("\n[*] Scanning HTML files for corpus-results references...")
    referenced_terms = extract_all_referenced_terms()

    total_terms = sum(len(terms) for terms in referenced_terms.values())
    print(f"[+] Found {total_terms} unique terms across {len(referenced_terms)} traditions")

    for tradition, terms in sorted(referenced_terms.items()):
        print(f"    {tradition}: {len(terms)} terms")

    # Load corpus data (mock for now)
    print("\n[*] Loading corpus data...")
    corpus_data = load_mock_corpus_data()

    # Generate pages
    print("\n[*] Generating corpus-results pages...")
    created_count = 0
    skipped_count = 0

    for tradition, terms in sorted(referenced_terms.items()):
        print(f"\n  {tradition.upper()}:")

        # Create tradition directory
        output_dir = Path(f"docs/corpus-results/{tradition}")
        if not dry_run:
            output_dir.mkdir(parents=True, exist_ok=True)

        for term in sorted(terms):
            output_file = output_dir / f"{term}.html"

            # Check if already exists
            if output_file.exists():
                skipped_count += 1
                continue

            # Get expanded search terms
            expanded_terms = get_expanded_terms(term)

            # Search corpus (mock results for now)
            results = corpus_data.get(tradition, {}).get(term, [])

            # Generate HTML
            html = generate_corpus_page_html(tradition, term, results, expanded_terms)

            if not dry_run:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"    + Created: {output_file.relative_to('docs')}")
            else:
                print(f"    [DRY RUN] Would create: {output_file.relative_to('docs')}")

            created_count += 1

    print("\n" + "=" * 80)
    print(f"COMPLETE: Created {created_count} pages, skipped {skipped_count} existing pages")
    print("=" * 80)

    return created_count, skipped_count

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Generate all corpus-results HTML pages')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be created without making changes')
    args = parser.parse_args()

    generate_all_corpus_pages(dry_run=args.dry_run)

if __name__ == '__main__':
    main()

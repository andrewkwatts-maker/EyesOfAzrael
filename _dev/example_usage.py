"""
Example usage of the EBL API Interface
Demonstrates how to search Babylonian/Sumerian cuneiform texts
"""

import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'corpus-search-interface'))

from EblApiInterface import EblApiInterface
from CorpusSearchInterface import SearchLanguage


def main():
    print("=" * 70)
    print("EBL API Interface - Example Usage")
    print("=" * 70)

    # Initialize the interface
    print("\n1. Initializing interface...")
    ebl = EblApiInterface("../ebl-api")
    print(f"   Loaded {ebl.get_fragment_count()} cuneiform fragments")

    # Example 1: Search for a Sumerian deity
    print("\n2. Searching for Inanna (Sumerian goddess)...")
    inanna_results = ebl.search_by_deity("Inanna", max_results=3)
    print(f"   Found {len(inanna_results)} fragments mentioning Inanna")

    for i, result in enumerate(inanna_results, 1):
        print(f"\n   Fragment {i}:")
        print(f"   - Tablet: {result.metadata['tablet_reference']}")
        print(f"   - Type: {result.metadata['text_type']}")
        print(f"   - Museum: {result.metadata['museum']}")
        print(f"   - URL: {result.url}")
        print(f"   - Content: {result.context[:100]}...")

    # Example 2: Search for hymns
    print("\n3. Searching for hymns...")
    hymns = ebl.search("hymn", max_results=5)
    print(f"   Found {len(hymns)} hymn fragments")

    hymn_types = {}
    for hymn in hymns:
        text_type = hymn.metadata['text_type']
        hymn_types[text_type] = hymn_types.get(text_type, 0) + 1

    print("   Text types found:")
    for type_name, count in hymn_types.items():
        print(f"   - {type_name}: {count}")

    # Example 3: Multi-term AND search
    print("\n4. Searching for fragments with both 'hymn' AND 'Inanna'...")
    combined = ebl.search_multiple(['hymn', 'Inanna'], match_all=True, max_results=10)
    print(f"   Found {len(combined)} fragments with both terms")

    if combined:
        print(f"\n   Example: {combined[0].text_name}")
        print(f"   {combined[0].context[:150]}...")

    # Example 4: Multi-term OR search
    print("\n5. Searching for any Mesopotamian deity...")
    deities = ebl.search_multiple(
        ['Inanna', 'Marduk', 'Enlil', 'Enki'],
        match_all=False,
        max_results=10
    )
    print(f"   Found {len(deities)} fragments mentioning deities")

    deity_mentions = {}
    for result in deities:
        matched = result.matched_term
        deity_mentions[matched] = deity_mentions.get(matched, 0) + 1

    print("   Deity mentions:")
    for deity, count in sorted(deity_mentions.items(), key=lambda x: x[1], reverse=True):
        print(f"   - {deity}: {count}")

    # Example 5: Get specific fragment
    print("\n6. Retrieving specific fragment by ID...")
    if inanna_results:
        fragment_id = inanna_results[0].text_id
        full_text = ebl.get_text_by_id(fragment_id)
        print(f"   Fragment {fragment_id}:")
        print(f"   {full_text[:200]}...")

    # Example 6: HTML generation
    print("\n7. Generating HTML for web display...")
    if inanna_results:
        result = inanna_results[0]

        print("\n   Tooltip HTML:")
        tooltip = result.to_html_tooltip()
        print(f"   {tooltip[:150]}...")

        print("\n   Expandable section HTML:")
        section = result.to_expandable_section()
        print(f"   {section[:150]}...")

    # Example 7: Supported languages
    print("\n8. Supported languages:")
    languages = ebl.get_supported_languages()
    for lang in languages:
        print(f"   - {lang.name}: {lang.value}")

    print("\n" + "=" * 70)
    print("Example usage complete!")
    print("=" * 70)
    print("\nFor more examples, see README.md")
    print("For testing, run: python test_ebl_api_interface.py")


if __name__ == '__main__':
    main()

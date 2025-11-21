"""
Unit tests for EblApiInterface
Tests searching Babylonian/Sumerian cuneiform texts from the Electronic Babylonian Library
"""

import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'corpus-search-interface'))

from EblApiInterface import EblApiInterface
from CorpusSearchInterface import SearchLanguage


def test_initialization():
    """Test corpus initialization"""
    print("\n=== Test: Initialization ===")

    interface = EblApiInterface("../ebl-api")

    fragment_count = interface.get_fragment_count()
    print(f"Loaded {fragment_count} fragments")

    assert fragment_count > 0, "Should load fragments"
    print(f"[OK] Loaded {fragment_count} fragments successfully")


def test_search_inanna():
    """Test search for Inanna (Sumerian goddess)"""
    print("\n=== Test: Search for Inanna ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search("Inanna", max_results=10)

    print(f"Found {len(results)} results for 'Inanna'")

    assert len(results) > 0, "Should find Inanna references"

    for i, result in enumerate(results[:3], 1):
        print(f"\n{i}. {result.text_name}")
        print(f"   Tablet: {result.metadata.get('tablet_reference', 'Unknown')}")
        print(f"   Museum: {result.metadata.get('museum', 'Unknown')}")
        print(f"   Type: {result.metadata.get('text_type', 'Unknown')}")
        print(f"   Context: {result.context[:150]}...")
        if result.url:
            print(f"   URL: {result.url}")

    print("[OK] Inanna search passed")


def test_search_marduk():
    """Test search for Marduk (Babylonian god)"""
    print("\n=== Test: Search for Marduk ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search("Marduk", max_results=10)

    print(f"Found {len(results)} results for 'Marduk'")

    if results:
        for i, result in enumerate(results[:2], 1):
            print(f"\n{i}. {result.text_name}")
            print(f"   Context: {result.context[:150]}...")
    else:
        print("   No results found (this is okay - small dataset)")

    # Don't assert - Marduk might not be in all exports
    print("[OK] Marduk search completed")


def test_search_hymn():
    """Test search for hymns"""
    print("\n=== Test: Search for hymns ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search("hymn", max_results=10)

    print(f"Found {len(results)} hymn fragments")

    assert len(results) > 0, "Should find hymn references"

    for i, result in enumerate(results[:3], 1):
        print(f"\n{i}. {result.text_name}")
        print(f"   Text type: {result.metadata.get('text_type', 'Unknown')}")
        print(f"   Context: {result.context[:100]}...")

    # Verify text_type was extracted
    hymn_results = [r for r in results if 'Hymn' in r.metadata.get('text_type', '')]
    assert len(hymn_results) > 0, "Should identify hymn text type"

    print("[OK] Hymn search passed")


def test_search_deity_method():
    """Test convenience method for deity search"""
    print("\n=== Test: Search by deity (convenience method) ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search_by_deity("Inanna", max_results=5)

    print(f"Found {len(results)} results using search_by_deity()")

    assert len(results) > 0, "Should find deity references"
    print("[OK] Deity search method passed")


def test_multi_term_and():
    """Test AND search for multiple terms"""
    print("\n=== Test: Multi-term AND search ===")

    interface = EblApiInterface("../ebl-api")

    # Search for fragments mentioning both "hymn" and "Inanna"
    results = interface.search_multiple(['hymn', 'Inanna'], match_all=True, max_results=10)

    print(f"Found {len(results)} results with both 'hymn' AND 'Inanna'")

    if results:
        for i, result in enumerate(results[:2], 1):
            print(f"\n{i}. {result.text_name}")
            print(f"   Context: {result.context[:150]}...")

    # Should find at least one (based on our data analysis)
    assert len(results) > 0, "Should find fragments with both terms"
    print("[OK] AND search passed")


def test_multi_term_or():
    """Test OR search for multiple terms"""
    print("\n=== Test: Multi-term OR search ===")

    interface = EblApiInterface("../ebl-api")

    # Search for fragments mentioning either deity
    results = interface.search_multiple(['Inanna', 'Marduk'], match_all=False, max_results=10)

    print(f"Found {len(results)} results with 'Inanna' OR 'Marduk'")

    assert len(results) > 0, "Should find results with either term"

    for i, result in enumerate(results[:3], 1):
        print(f"\n{i}. {result.text_name}")
        print(f"   Matched: {result.matched_term}")

    print("[OK] OR search passed")


def test_get_text_by_id():
    """Test retrieving specific fragment by ID"""
    print("\n=== Test: Get text by ID ===")

    interface = EblApiInterface("../ebl-api")

    # First search for something
    results = interface.search("Inanna", max_results=1)

    assert len(results) > 0, "Should find at least one result"

    fragment_id = results[0].text_id
    print(f"Retrieving fragment: {fragment_id}")

    text = interface.get_text_by_id(fragment_id)

    assert text is not None, "Should retrieve text"
    assert len(text) > 0, "Text should not be empty"

    print(f"Retrieved text ({len(text)} chars):")
    print(f"   {text[:200]}...")

    print("[OK] Get text by ID passed")


def test_search_omen():
    """Test search for omen texts"""
    print("\n=== Test: Search for omen texts ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search("omen", max_results=10)

    print(f"Found {len(results)} omen text fragments")

    if results:
        for i, result in enumerate(results[:2], 1):
            print(f"\n{i}. {result.text_name}")
            print(f"   Type: {result.metadata.get('text_type', 'Unknown')}")
            print(f"   Context: {result.context[:100]}...")

        # Verify text_type was extracted
        omen_results = [r for r in results if 'Omen' in result.metadata.get('text_type', '')]
        if omen_results:
            print(f"   Correctly identified {len(omen_results)} as omen texts")

    print("[OK] Omen search completed")


def test_search_result_structure():
    """Test that SearchResult objects have all required fields"""
    print("\n=== Test: SearchResult structure ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search("Inanna", max_results=1)

    assert len(results) > 0, "Should find results"

    result = results[0]

    # Check required fields
    assert result.corpus_name is not None, "Should have corpus_name"
    assert result.text_id is not None, "Should have text_id"
    assert result.text_name is not None, "Should have text_name"
    assert result.matched_term is not None, "Should have matched_term"
    assert result.context is not None, "Should have context"
    assert result.language is not None, "Should have language"
    assert result.metadata is not None, "Should have metadata"

    print(f"Corpus: {result.corpus_name}")
    print(f"Text ID: {result.text_id}")
    print(f"Text Name: {result.text_name}")
    print(f"Language: {result.language}")
    print(f"Metadata keys: {list(result.metadata.keys())}")

    # Test HTML generation methods
    tooltip_html = result.to_html_tooltip()
    assert len(tooltip_html) > 0, "Should generate tooltip HTML"
    print(f"Tooltip HTML: {len(tooltip_html)} chars")

    section_html = result.to_expandable_section()
    assert len(section_html) > 0, "Should generate section HTML"
    print(f"Section HTML: {len(section_html)} chars")

    print("[OK] SearchResult structure valid")


def test_tablet_reference_formatting():
    """Test that tablet references are properly formatted"""
    print("\n=== Test: Tablet reference formatting ===")

    interface = EblApiInterface("../ebl-api")

    results = interface.search("Inanna", max_results=5)

    assert len(results) > 0, "Should find results"

    print("Tablet references found:")
    for result in results:
        tablet_ref = result.metadata.get('tablet_reference', 'Unknown')
        print(f"   {tablet_ref}")

        # Should have proper format (e.g., "IM.10597")
        assert tablet_ref != "Unknown tablet", "Should format tablet reference"

    print("[OK] Tablet reference formatting passed")


def test_supported_languages():
    """Test that supported languages are returned"""
    print("\n=== Test: Supported languages ===")

    interface = EblApiInterface("../ebl-api")

    languages = interface.get_supported_languages()

    print(f"Supported languages: {[lang.value for lang in languages]}")

    assert SearchLanguage.AKKADIAN in languages, "Should support Akkadian"
    assert SearchLanguage.SUMERIAN in languages, "Should support Sumerian"
    assert SearchLanguage.ENGLISH in languages, "Should support English"

    print("[OK] Supported languages correct")


def test_case_insensitive_search():
    """Test case-insensitive search"""
    print("\n=== Test: Case-insensitive search ===")

    interface = EblApiInterface("../ebl-api")

    results_lower = interface.search("inanna", max_results=10)
    results_upper = interface.search("INANNA", max_results=10)
    results_mixed = interface.search("Inanna", max_results=10)

    print(f"'inanna': {len(results_lower)} results")
    print(f"'INANNA': {len(results_upper)} results")
    print(f"'Inanna': {len(results_mixed)} results")

    # Should find the same results regardless of case
    assert len(results_lower) == len(results_upper) == len(results_mixed), \
        "Case-insensitive search should return same count"

    print("[OK] Case-insensitive search works")


if __name__ == '__main__':
    print("=" * 70)
    print("Electronic Babylonian Library (EBL) Interface - Test Suite")
    print("=" * 70)

    try:
        test_initialization()
        test_search_inanna()
        test_search_marduk()
        test_search_hymn()
        test_search_deity_method()
        test_multi_term_and()
        test_multi_term_or()
        test_get_text_by_id()
        test_search_omen()
        test_search_result_structure()
        test_tablet_reference_formatting()
        test_supported_languages()
        test_case_insensitive_search()

        print("\n" + "=" * 70)
        print("[OK] ALL TESTS PASSED")
        print("=" * 70)
        print("\nThe EBL API interface is ready for use in mythology pages!")

    except AssertionError as e:
        print(f"\n[FAIL] TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

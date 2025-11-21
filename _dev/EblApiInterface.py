"""
Electronic Babylonian Library (EBL) API Corpus Search Interface
Implements standardized search for Babylonian and Sumerian cuneiform texts from the eBL fragmentarium.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'corpus-search-interface'))

from CorpusSearchInterface import CorpusSearchInterface, SearchResult, SearchLanguage
import json
import re
from typing import List, Optional, Dict, Any
from pathlib import Path


class EblApiInterface(CorpusSearchInterface):
    """
    Search interface for Electronic Babylonian Library (eBL) API corpus.

    Contains: Cuneiform tablet fragments from Babylonian and Sumerian sources
    Languages: Akkadian, Sumerian (transliterated)
    Time period: ~3000 BCE - ~100 CE

    The eBL contains fragmentary cuneiform texts including:
    - Mythological texts (Enuma Elish, Gilgamesh, hymns to deities)
    - Omen texts and divination
    - Letters and administrative documents
    - Lexical lists and school exercises
    - Religious and ritual texts

    Data structure:
    - Fragment metadata with museum numbers (e.g., "IM.10597")
    - Notes describing content with deity/text references
    - Transliterated cuneiform text (when available)
    - References to publications and tablets
    """

    def _initialize_corpus(self) -> None:
        """Load EBL fragment data from output.json"""
        self.fragments = []

        # Load main fragment data
        json_path = Path(self.corpus_path) / "output.json"
        if json_path.exists():
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    self.fragments = json.load(f)
                print(f"Loaded {len(self.fragments)} EBL fragments")
            except Exception as e:
                print(f"Error loading EBL data: {e}")
                self.fragments = []
        else:
            print(f"Warning: {json_path} not found")
            self.fragments = []

        # Build search index for faster lookups
        self._build_index()

    def _build_index(self) -> None:
        """Build an index for faster text searches"""
        self.fragment_index = {}

        for fragment in self.fragments:
            fragment_id = fragment.get('_id', '')

            # Index notes text
            notes_text = fragment.get('notes', {}).get('text', '')

            # Index description
            description = fragment.get('description', '')

            # Combine searchable text
            searchable_text = f"{notes_text} {description}".lower()

            self.fragment_index[fragment_id] = {
                'fragment': fragment,
                'searchable_text': searchable_text
            }

    def search(
        self,
        term: str,
        language: SearchLanguage = SearchLanguage.AKKADIAN,
        context_words: int = 10,
        max_results: int = 100,
        case_sensitive: bool = False
    ) -> List[SearchResult]:
        """
        Search EBL corpus for a term.

        Searches through:
        - Fragment notes (descriptions of content)
        - Fragment descriptions
        - Transliterated text (when available)

        Args:
            term: Search term (deity name, text title, keyword)
            language: Language (AKKADIAN, SUMERIAN, or ENGLISH for notes)
            context_words: Words before/after match
            max_results: Maximum results to return
            case_sensitive: Case-sensitive search

        Returns:
            List of SearchResult objects
        """
        results = []
        search_term = term if case_sensitive else term.lower()

        for fragment_id, index_data in self.fragment_index.items():
            fragment = index_data['fragment']
            searchable_text = index_data['searchable_text'] if not case_sensitive else \
                             f"{fragment.get('notes', {}).get('text', '')} {fragment.get('description', '')}"

            # Check if term appears in searchable text
            if search_term in searchable_text:
                # Extract context from notes
                notes_text = fragment.get('notes', {}).get('text', '')
                context = self._extract_context(notes_text, term, context_words, case_sensitive)

                # Get museum number for display
                museum_num = fragment.get('museumNumber', {})
                tablet_ref = self._format_museum_number(museum_num)

                # Determine text type from notes
                text_type = self._extract_text_type(notes_text)

                # Build metadata
                metadata = {
                    'museum': fragment.get('museum', 'Unknown'),
                    'tablet_reference': tablet_ref,
                    'text_type': text_type,
                    'script_period': fragment.get('script', {}).get('period', 'Unknown'),
                    'collection': fragment.get('collection', ''),
                    'projects': fragment.get('projects', [])
                }

                # Add references if available
                references = fragment.get('references', [])
                if references:
                    ref = references[0]
                    metadata['publication'] = ref.get('id', '')
                    metadata['publication_pages'] = ref.get('pages', '')

                # Construct URL (if fragment has external numbers)
                url = self._construct_url(fragment)

                result = SearchResult(
                    corpus_name="EBL (Electronic Babylonian Library)",
                    text_id=fragment_id,
                    text_name=f"{tablet_ref} - {text_type}",
                    matched_term=term,
                    context=context,
                    full_verse=notes_text,  # Use notes as "verse"
                    language=self._detect_language(notes_text),
                    translation=None,  # Notes are already in English
                    book=text_type,  # Use text type as "book"
                    chapter=tablet_ref,  # Use tablet ref as "chapter"
                    verse=None,
                    metadata=metadata,
                    url=url
                )

                results.append(result)

                if len(results) >= max_results:
                    return results

        return results

    def _format_museum_number(self, museum_num: Dict[str, str]) -> str:
        """Format museum number for display"""
        if not museum_num:
            return "Unknown tablet"

        prefix = museum_num.get('prefix', '')
        number = museum_num.get('number', '')
        suffix = museum_num.get('suffix', '')

        parts = [p for p in [prefix, number, suffix] if p]
        return '.'.join(parts) if parts else "Unknown tablet"

    def _extract_text_type(self, notes: str) -> str:
        """Extract text type from notes (e.g., 'hymn', 'omen', 'letter')"""
        if not notes:
            return "Fragment"

        notes_lower = notes.lower()

        # Check for specific text types
        if 'hymn' in notes_lower:
            return "Hymn"
        elif 'omen' in notes_lower or 'extispicy' in notes_lower:
            return "Omen text"
        elif 'letter' in notes_lower:
            return "Letter"
        elif 'lexical' in notes_lower:
            return "Lexical list"
        elif 'ritual' in notes_lower:
            return "Ritual text"
        elif 'prayer' in notes_lower:
            return "Prayer"
        elif 'incantation' in notes_lower:
            return "Incantation"
        elif 'myth' in notes_lower or 'epic' in notes_lower:
            return "Mythological text"
        elif 'school exercise' in notes_lower:
            return "School exercise"
        else:
            return "Fragment"

    def _detect_language(self, text: str) -> SearchLanguage:
        """Detect language from text content"""
        # Notes are in English, but describe Akkadian/Sumerian texts
        # For now, return AKKADIAN as primary language of the corpus
        return SearchLanguage.AKKADIAN

    def _extract_context(self, text: str, term: str, context_words: int, case_sensitive: bool) -> str:
        """Extract context around the matched term"""
        if not text:
            return ""

        if not case_sensitive:
            match_pos = text.lower().find(term.lower())
        else:
            match_pos = text.find(term)

        if match_pos == -1:
            # Return beginning of text if no match (shouldn't happen)
            return text[:200] if len(text) > 200 else text

        # Split into words
        words = text.split()

        # If text is short, return full text
        if len(words) <= context_words * 2:
            return text

        # Find which word contains the match
        char_count = 0
        match_word_idx = 0
        for i, word in enumerate(words):
            if char_count <= match_pos < char_count + len(word):
                match_word_idx = i
                break
            char_count += len(word) + 1  # +1 for space

        # Extract context window
        start_idx = max(0, match_word_idx - context_words)
        end_idx = min(len(words), match_word_idx + context_words + 1)

        context = ' '.join(words[start_idx:end_idx])

        # Add ellipsis if truncated
        if start_idx > 0:
            context = '...' + context
        if end_idx < len(words):
            context = context + '...'

        return context

    def search_multiple(
        self,
        terms: List[str],
        language: SearchLanguage = SearchLanguage.AKKADIAN,
        context_words: int = 10,
        max_results: int = 100,
        match_all: bool = False
    ) -> List[SearchResult]:
        """
        Search for multiple terms (OR or AND logic).

        Args:
            terms: List of search terms
            language: Language
            context_words: Words before/after match
            max_results: Maximum results
            match_all: If True, require ALL terms; if False, ANY term

        Returns:
            List of SearchResult objects
        """
        if match_all:
            # AND logic - all terms must be present
            results = []

            for fragment_id, index_data in self.fragment_index.items():
                fragment = index_data['fragment']
                searchable_text = index_data['searchable_text']

                # Check if ALL terms are in searchable text
                if all(term.lower() in searchable_text for term in terms):
                    notes_text = fragment.get('notes', {}).get('text', '')
                    museum_num = fragment.get('museumNumber', {})
                    tablet_ref = self._format_museum_number(museum_num)
                    text_type = self._extract_text_type(notes_text)

                    metadata = {
                        'museum': fragment.get('museum', 'Unknown'),
                        'tablet_reference': tablet_ref,
                        'text_type': text_type,
                        'script_period': fragment.get('script', {}).get('period', 'Unknown'),
                        'matched_terms': terms
                    }

                    url = self._construct_url(fragment)

                    result = SearchResult(
                        corpus_name="EBL (Electronic Babylonian Library)",
                        text_id=fragment_id,
                        text_name=f"{tablet_ref} - {text_type}",
                        matched_term=', '.join(terms),
                        context=notes_text,
                        full_verse=notes_text,
                        language=SearchLanguage.AKKADIAN,
                        translation=None,
                        book=text_type,
                        chapter=tablet_ref,
                        verse=None,
                        metadata=metadata,
                        url=url
                    )

                    results.append(result)

                    if len(results) >= max_results:
                        return results

            return results
        else:
            # OR logic - any term matches
            all_results = []
            seen_ids = set()

            for term in terms:
                term_results = self.search(term, language, context_words, max_results, case_sensitive=False)

                for result in term_results:
                    if result.text_id not in seen_ids:
                        seen_ids.add(result.text_id)
                        all_results.append(result)

                        if len(all_results) >= max_results:
                            return all_results

            return all_results

    def get_text_by_id(self, text_id: str) -> Optional[str]:
        """
        Retrieve fragment by ID.

        Args:
            text_id: Fragment ID (e.g., "IM.10597")

        Returns:
            Fragment notes text or None
        """
        if text_id in self.fragment_index:
            fragment = self.fragment_index[text_id]['fragment']
            notes = fragment.get('notes', {}).get('text', '')
            description = fragment.get('description', '')

            # Combine notes and description
            full_text = notes
            if description:
                full_text += f"\n\nDescription: {description}"

            return full_text if full_text else None

        return None

    def _construct_url(self, fragment: Dict[str, Any]) -> Optional[str]:
        """Construct URL to fragment if possible"""
        # The EBL has a web interface at https://www.ebl.lmu.de/
        # Fragment URLs follow pattern: https://www.ebl.lmu.de/fragmentarium/{fragment_id}
        fragment_id = fragment.get('_id', '')
        if fragment_id:
            return f"https://www.ebl.lmu.de/fragmentarium/{fragment_id}"
        return None

    def get_supported_languages(self) -> List[SearchLanguage]:
        """Languages in the EBL corpus"""
        return [SearchLanguage.AKKADIAN, SearchLanguage.SUMERIAN, SearchLanguage.ENGLISH]

    def get_fragment_count(self) -> int:
        """Get total number of fragments"""
        return len(self.fragments)

    def search_by_deity(self, deity_name: str, max_results: int = 50) -> List[SearchResult]:
        """
        Convenience method to search for deity mentions.

        Args:
            deity_name: Name of deity (e.g., "Marduk", "Ishtar", "Inanna")
            max_results: Maximum results

        Returns:
            List of SearchResult objects
        """
        return self.search(deity_name, language=SearchLanguage.ENGLISH, max_results=max_results)

    def search_by_text_name(self, text_name: str, max_results: int = 50) -> List[SearchResult]:
        """
        Search for specific text titles.

        Args:
            text_name: Text name (e.g., "Enuma Elish", "Gilgamesh")
            max_results: Maximum results

        Returns:
            List of SearchResult objects
        """
        return self.search(text_name, language=SearchLanguage.ENGLISH, max_results=max_results)

/**
 * Sefaria-specific JSON Parser
 * Handles the Sefaria Export JSON format
 */
class SefariaJSONParser {
    search(jsonContent, searchTerms, options) {
        const data = JSON.parse(jsonContent);
        const results = [];

        if (!data.text || !Array.isArray(data.text)) {
            console.warn('Invalid Sefaria JSON format:', data);
            return results;
        }

        const title = data.title || options.corpusName || 'Unknown Text';
        const textArray = data.text;

        // Iterate through chapters (outer array)
        textArray.forEach((chapter, chapterIndex) => {
            if (!Array.isArray(chapter)) return;

            // Iterate through verses (inner array)
            chapter.forEach((verse, verseIndex) => {
                if (typeof verse !== 'string') return;

                // Clean HTML tags from verse
                const cleanVerse = this.cleanHTML(verse);

                if (this.matches(cleanVerse, searchTerms, options.caseSensitive, options.matchAll)) {
                    const matchedTerm = this.findMatchedTerm(cleanVerse, searchTerms, options.caseSensitive);
                    const chapterNum = chapterIndex + 1;
                    const verseNum = verseIndex + 1;

                    results.push({
                        corpus_name: options.corpusName || title,
                        text_id: `${title}:${chapterNum}:${verseNum}`,
                        text_name: `${title} ${chapterNum}:${verseNum}`,
                        matched_term: matchedTerm,
                        context: this.extractContext(cleanVerse, matchedTerm, options.contextWords),
                        full_verse: cleanVerse,
                        book: title,
                        chapter: String(chapterNum),
                        verse: String(verseNum),
                        language: data.language || options.metadata.language || 'en',
                        translation: data.versionTitle || null,
                        metadata: options.metadata,
                        url: `https://www.sefaria.org/${title}.${chapterNum}.${verseNum}`
                    });

                    if (results.length >= options.maxResults) {
                        return;
                    }
                }
            });

            if (results.length >= options.maxResults) {
                return;
            }
        });

        return results;
    }

    cleanHTML(text) {
        // Remove HTML tags but preserve content
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || text;
    }

    matches(text, searchTerms, caseSensitive, matchAll) {
        const textToSearch = caseSensitive ? text : text.toLowerCase();
        const terms = searchTerms.map(t => caseSensitive ? t : t.toLowerCase());

        if (matchAll) {
            return terms.every(term => textToSearch.includes(term));
        } else {
            return terms.some(term => textToSearch.includes(term));
        }
    }

    extractContext(text, searchTerm, contextWords) {
        const words = text.split(/\s+/);
        const searchLower = searchTerm.toLowerCase();

        for (let i = 0; i < words.length; i++) {
            if (words[i].toLowerCase().includes(searchLower)) {
                const start = Math.max(0, i - contextWords);
                const end = Math.min(words.length, i + contextWords + 1);
                let context = words.slice(start, end).join(' ');

                if (start > 0) context = '...' + context;
                if (end < words.length) context = context + '...';

                return context;
            }
        }

        return text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }

    findMatchedTerm(text, searchTerms, caseSensitive) {
        const textToSearch = caseSensitive ? text : text.toLowerCase();

        for (const term of searchTerms) {
            const searchTerm = caseSensitive ? term : term.toLowerCase();
            if (textToSearch.includes(searchTerm)) {
                return term;
            }
        }

        return searchTerms[0];
    }
}

// Register custom parser before CorpusSearch initializes
document.addEventListener('DOMContentLoaded', () => {
    // Inject custom parser into CorpusSearch when it's created
    const originalInit = window.corpusSearch ? window.corpusSearch.init : null;
    
    // Override parser selection in corpus-search-core.js
    if (typeof CorpusSearch !== 'undefined') {
        const originalGetParser = CorpusSearch.prototype.getParser;
        CorpusSearch.prototype.getParser = function(format, repoId) {
            if (format === 'sefaria-json') {
                return new SefariaJSONParser();
            }
            return originalGetParser.call(this, format, repoId);
        };
    }
});

/**
 * Custom parsers for Ancient Egyptian corpus formats
 * Extends the base corpus-search-core.js parsers
 */

// AES (Ancient Egyptian Sentences) JSON Parser
class AESJSONParser extends BaseParser {
  search(jsonContent, searchTerms, options) {
    const data = JSON.parse(jsonContent);
    const results = [];

    // AES format: array of sentence objects
    const sentences = Array.isArray(data) ? data : [data];

    for (const sentence of sentences) {
      if (!sentence) continue;

      // Search in translation, transcription, and transliteration
      const searchableText = [
        sentence.translation || '',
        sentence.transcription || '',
        sentence.transliteration || '',
        sentence.german_translation || ''
      ].join(' ');

      if (this.matches(searchableText, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(searchableText, searchTerms, options.caseSensitive);

        // Extract metadata
        const textId = sentence.text_id || sentence.textId || 'Unknown';
        const corpus = sentence.corpus || 'Egyptian Texts';
        const dateEarliest = sentence.date_earliest || sentence.dateEarliest || '';
        const dateLatest = sentence.date_latest || sentence.dateLatest || '';
        const findspot = sentence.findspot || '';

        // Format date range
        let dateRange = '';
        if (dateEarliest || dateLatest) {
          const earliest = dateEarliest ? Math.abs(parseInt(dateEarliest)) : null;
          const latest = dateLatest ? Math.abs(parseInt(dateLatest)) : null;
          if (earliest && latest) {
            dateRange = `${earliest} - ${latest} BCE`;
          } else if (earliest) {
            dateRange = `${earliest} BCE`;
          } else if (latest) {
            dateRange = `${latest} BCE`;
          }
        }

        results.push({
          corpus_name: options.corpusName || 'AES Corpus',
          text_id: textId,
          text_name: `${corpus} - ${textId}`,
          matched_term: matchedTerm,
          context: this.extractContext(searchableText, matchedTerm, options.contextWords),
          full_verse: sentence.translation || sentence.transcription || '',
          translation: sentence.german_translation || null,
          book: corpus,
          chapter: null,
          verse: sentence.sentence_id || null,
          language: 'egy',
          metadata: {
            ...options.metadata,
            date_range: dateRange,
            findspot: findspot,
            transcription: sentence.transcription || '',
            transliteration: sentence.transliteration || '',
            hieroglyphic: sentence.hieroglyphic || ''
          },
          url: sentence.url || `https://aaew.bbaw.de/tla/servlet/GetTextDetails?u=guest&f=0&l=0&tc=${textId}`
        });

        if (results.length >= options.maxResults) {
          break;
        }
      }
    }

    return results;
  }
}

// AED-TEI XML Parser
class AEDTEIParser extends BaseParser {
  search(xmlContent, searchTerms, options) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    const results = [];

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }

    // Extract sentences from TEI format
    const sentences = doc.querySelectorAll('s, p, ab, l');

    sentences.forEach((sentenceNode, index) => {
      const text = sentenceNode.textContent.trim();
      if (!text) return;

      if (this.matches(text, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(text, searchTerms, options.caseSensitive);

        // Extract metadata from TEI structure
        const textId = this.getAttributeFromAncestors(sentenceNode, 'xml:id') || `sentence_${index}`;
        const textTitle = this.getTextTitle(doc) || 'Egyptian Text';
        const dateInfo = this.getDateInfo(doc);

        results.push({
          corpus_name: options.corpusName || 'AED-TEI Corpus',
          text_id: textId,
          text_name: `${textTitle} - ${textId}`,
          matched_term: matchedTerm,
          context: this.extractContext(text, matchedTerm, options.contextWords),
          full_verse: text,
          translation: null,
          book: textTitle,
          chapter: null,
          verse: String(index + 1),
          language: 'egy',
          metadata: {
            ...options.metadata,
            ...dateInfo,
            index: index
          },
          url: `https://aaew.bbaw.de/tla/servlet/GetTextDetails?u=guest&f=0&l=0&tc=${textId}`
        });

        if (results.length >= options.maxResults) {
          return;
        }
      }
    });

    return results;
  }

  getAttributeFromAncestors(node, attrName) {
    let current = node;
    while (current && current.getAttribute) {
      const attr = current.getAttribute(attrName);
      if (attr) return attr;
      current = current.parentElement;
    }
    return null;
  }

  getTextTitle(doc) {
    const title = doc.querySelector('title, titleStmt title');
    return title ? title.textContent.trim() : null;
  }

  getDateInfo(doc) {
    const dateNode = doc.querySelector('date, origDate');
    if (!dateNode) return {};

    const notBefore = dateNode.getAttribute('notBefore') || dateNode.getAttribute('notBefore-custom');
    const notAfter = dateNode.getAttribute('notAfter') || dateNode.getAttribute('notAfter-custom');

    let dateRange = '';
    if (notBefore || notAfter) {
      const earliest = notBefore ? Math.abs(parseInt(notBefore)) : null;
      const latest = notAfter ? Math.abs(parseInt(notAfter)) : null;
      if (earliest && latest) {
        dateRange = `${earliest} - ${latest} BCE`;
      } else if (earliest) {
        dateRange = `${earliest} BCE`;
      } else if (latest) {
        dateRange = `${latest} BCE`;
      }
    }

    return { date_range: dateRange };
  }
}

// AED Dictionary XML Parser
class AEDDictionaryParser extends BaseParser {
  search(xmlContent, searchTerms, options) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    const results = [];

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }

    // Extract dictionary entries
    const entries = doc.querySelectorAll('entry, lemma');

    entries.forEach((entryNode, index) => {
      // Search in lemma, translation, and definition
      const lemma = entryNode.querySelector('form, orth')?.textContent || '';
      const translation = entryNode.querySelector('translation, gloss, def')?.textContent || '';
      const definition = entryNode.querySelector('definition, sense')?.textContent || '';

      const searchableText = `${lemma} ${translation} ${definition}`;

      if (this.matches(searchableText, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(searchableText, searchTerms, options.caseSensitive);

        const entryId = entryNode.getAttribute('xml:id') || entryNode.getAttribute('n') || `entry_${index}`;

        results.push({
          corpus_name: options.corpusName || 'Egyptian Dictionary',
          text_id: entryId,
          text_name: `${lemma} (${translation})`,
          matched_term: matchedTerm,
          context: `${lemma} - ${translation}`,
          full_verse: definition || translation || lemma,
          translation: translation,
          book: 'Egyptian Dictionary',
          chapter: null,
          verse: null,
          language: 'egy',
          metadata: {
            ...options.metadata,
            lemma: lemma,
            part_of_speech: entryNode.querySelector('pos, gramGrp')?.textContent || ''
          },
          url: `https://aaew.bbaw.de/tla/servlet/GetWcnDetails?u=guest&f=0&l=0&wn=${entryId}`
        });

        if (results.length >= options.maxResults) {
          return;
        }
      }
    });

    return results;
  }
}

// ORAEC (Open Richly Annotated Egyptian Corpus) JSON Parser
class ORAECJSONParser extends BaseParser {
  search(jsonContent, searchTerms, options) {
    const data = JSON.parse(jsonContent);
    const results = [];

    // ORAEC format: contains sentences array and metadata
    const sentences = data.sentences || [];
    const textMetadata = {
      title: data.title || data.name || 'Egyptian Text',
      textId: data.oraec_id || data.id || 'Unknown',
      dating: data.dating || {},
      provenance: data.provenance || '',
      textType: data.text_type || data.type || ''
    };

    for (const sentence of sentences) {
      if (!sentence) continue;

      // Search in translation and transcription
      const searchableText = [
        sentence.translation || '',
        sentence.transcription || '',
        sentence.transliteration || '',
        sentence.german || ''
      ].join(' ');

      if (this.matches(searchableText, searchTerms, options.caseSensitive, options.matchAll)) {
        const matchedTerm = this.findMatchedTerm(searchableText, searchTerms, options.caseSensitive);

        // Format date range from ORAEC dating object
        let dateRange = '';
        if (textMetadata.dating) {
          const notBefore = textMetadata.dating.notBefore || textMetadata.dating.earliest;
          const notAfter = textMetadata.dating.notAfter || textMetadata.dating.latest;

          if (notBefore || notAfter) {
            const earliest = notBefore ? Math.abs(parseInt(notBefore)) : null;
            const latest = notAfter ? Math.abs(parseInt(notAfter)) : null;
            if (earliest && latest) {
              dateRange = `${earliest} - ${latest} BCE`;
            } else if (earliest) {
              dateRange = `c. ${earliest} BCE`;
            } else if (latest) {
              dateRange = `c. ${latest} BCE`;
            }
          }
        }

        results.push({
          corpus_name: options.corpusName || 'ORAEC Corpus',
          text_id: `${textMetadata.textId}:${sentence.id || sentence.sentence_id || ''}`,
          text_name: `${textMetadata.title} (ORAEC ${textMetadata.textId})`,
          matched_term: matchedTerm,
          context: this.extractContext(searchableText, matchedTerm, options.contextWords),
          full_verse: sentence.translation || sentence.transcription || '',
          translation: sentence.german || null,
          book: textMetadata.title,
          chapter: null,
          verse: sentence.id || sentence.sentence_id || null,
          language: 'egy',
          metadata: {
            ...options.metadata,
            date_range: dateRange,
            provenance: textMetadata.provenance,
            text_type: textMetadata.textType,
            transcription: sentence.transcription || '',
            transliteration: sentence.transliteration || '',
            hieroglyphic: sentence.hieroglyphic || sentence.hieroglyphs || ''
          },
          url: `https://oraec.github.io/corpus/oraec${textMetadata.textId}.html`
        });

        if (results.length >= options.maxResults) {
          break;
        }
      }
    }

    return results;
  }
}

// Register custom parsers
if (typeof window !== 'undefined') {
  window.EgyptianCustomParsers = {
    'aes-json': new AESJSONParser(),
    'aed-tei': new AEDTEIParser(),
    'aed-dictionary': new AEDDictionaryParser(),
    'oraec-json': new ORAECJSONParser()
  };
}

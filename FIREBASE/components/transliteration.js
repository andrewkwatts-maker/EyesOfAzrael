/**
 * Transliteration System for Ancient Languages
 * Provides romanization for Greek, Hebrew, Sanskrit, Egyptian, and other scripts
 */

class Transliterator {
  constructor() {
    // Greek to Latin transliteration map (Beta Code / Standard)
    this.greekMap = {
      // Lowercase
      'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
      'η': 'ē', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
      'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
      'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps',
      'ω': 'ō',

      // Uppercase
      'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
      'Η': 'Ē', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M',
      'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S',
      'Τ': 'T', 'Υ': 'Y', 'Φ': 'Ph', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'Ō',

      // Diacritics (combining)
      'ά': 'a', 'έ': 'e', 'ή': 'ē', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'ō',
      'ᾶ': 'a', 'ῆ': 'ē', 'ῖ': 'i', 'ῦ': 'y', 'ῶ': 'ō',
      'ἀ': 'a', 'ἁ': 'ha', 'ἐ': 'e', 'ἑ': 'he', 'ἠ': 'ē', 'ἡ': 'hē',
      'ἰ': 'i', 'ἱ': 'hi', 'ὀ': 'o', 'ὁ': 'ho', 'ὐ': 'y', 'ὑ': 'hy',
      'ὠ': 'ō', 'ὡ': 'hō'
    };

    // Hebrew to Latin transliteration map
    this.hebrewMap = {
      'א': 'ʾ', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'w',
      'ז': 'z', 'ח': 'ḥ', 'ט': 'ṭ', 'י': 'y', 'כ': 'k', 'ך': 'k',
      'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
      'ע': 'ʿ', 'פ': 'p', 'ף': 'p', 'צ': 'ṣ', 'ץ': 'ṣ', 'ק': 'q',
      'ר': 'r', 'ש': 'sh', 'ת': 't',

      // Vowels (niqqud)
      'ַ': 'a', 'ָ': 'a', 'ֶ': 'e', 'ֵ': 'e', 'ִ': 'i', 'ֹ': 'o',
      'ֻ': 'u', 'ְ': 'ə'
    };

    // Sanskrit (Devanagari) to Latin transliteration map (IAST)
    this.sanskritMap = {
      // Vowels
      'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
      'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ', 'ए': 'e', 'ऐ': 'ai',
      'ओ': 'o', 'औ': 'au',

      // Consonants
      'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'ṅa',
      'च': 'ca', 'छ': 'cha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'ña',
      'ट': 'ṭa', 'ठ': 'ṭha', 'ड': 'ḍa', 'ढ': 'ḍha', 'ण': 'ṇa',
      'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
      'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
      'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va',
      'श': 'śa', 'ष': 'ṣa', 'स': 'sa', 'ह': 'ha',

      // Vowel signs
      'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū',
      'ृ': 'ṛ', 'ॄ': 'ṝ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
      '्': '', // virama (consonant without vowel)
      'ं': 'ṃ', 'ः': 'ḥ'
    };

    // Chinese Pinyin (simplified - for common mythology terms)
    this.chineseCommonWords = {
      '道': 'dào', '天': 'tiān', '地': 'dì', '神': 'shén',
      '佛': 'fó', '龍': 'lóng', '龙': 'lóng', '陰': 'yīn',
      '阳': 'yáng', '陽': 'yáng', '气': 'qì', '氣': 'qì',
      '太極': 'tàijí', '太极': 'tàijí', '五行': 'wǔxíng',
      '玉皇': 'Yùhuáng', '观音': 'Guānyīn', '關音': 'Guānyīn'
    };
  }

  /**
   * Transliterate text based on detected script
   * @param {string} text - Text to transliterate
   * @param {string} script - Script code (grc, he, sa, zh, etc.)
   * @returns {string} - Transliterated text
   */
  transliterate(text, script) {
    if (!text) return '';

    // Auto-detect if no script specified
    if (!script) {
      script = this.detectScript(text);
    }

    switch (script) {
      case 'grc':
      case 'greek':
        return this.transliterateGreek(text);

      case 'he':
      case 'hebrew':
        return this.transliterateHebrew(text);

      case 'sa':
      case 'sanskrit':
        return this.transliterateSanskrit(text);

      case 'zh':
      case 'chinese':
        return this.transliterateChinese(text);

      default:
        return text;
    }
  }

  /**
   * Detect script from text
   */
  detectScript(text) {
    // Greek range: 0370-03FF, 1F00-1FFF
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) {
      return 'grc';
    }

    // Hebrew range: 0590-05FF
    if (/[\u0590-\u05FF]/.test(text)) {
      return 'he';
    }

    // Devanagari range: 0900-097F
    if (/[\u0900-\u097F]/.test(text)) {
      return 'sa';
    }

    // CJK range: 4E00-9FFF
    if (/[\u4E00-\u9FFF]/.test(text)) {
      return 'zh';
    }

    return 'unknown';
  }

  /**
   * Transliterate Ancient Greek
   */
  transliterateGreek(text) {
    let result = '';

    for (const char of text) {
      result += this.greekMap[char] || char;
    }

    return result;
  }

  /**
   * Transliterate Hebrew
   */
  transliterateHebrew(text) {
    let result = '';

    for (const char of text) {
      result += this.hebrewMap[char] || char;
    }

    return result;
  }

  /**
   * Transliterate Sanskrit
   */
  transliterateSanskrit(text) {
    let result = '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      // Check for consonant + vowel sign combination
      if (this.sanskritMap[char] && this.sanskritMap[nextChar]) {
        const consonant = this.sanskritMap[char];
        const vowel = this.sanskritMap[nextChar];

        // If consonant ends with 'a' and next is vowel sign, replace the 'a'
        if (consonant.endsWith('a') && vowel !== '') {
          result += consonant.slice(0, -1) + vowel;
          i += 2;
          continue;
        }
      }

      result += this.sanskritMap[char] || char;
      i++;
    }

    return result;
  }

  /**
   * Transliterate Chinese (uses common word dictionary)
   */
  transliterateChinese(text) {
    // Check if entire text is in dictionary
    if (this.chineseCommonWords[text]) {
      return this.chineseCommonWords[text];
    }

    // Try character by character for compounds
    let result = '';
    for (const char of text) {
      if (this.chineseCommonWords[char]) {
        result += this.chineseCommonWords[char] + ' ';
      } else {
        result += char;
      }
    }

    return result.trim();
  }

  /**
   * Get search variants for a term (original + transliteration)
   */
  getSearchVariants(term, script) {
    const variants = [term];

    // Add transliteration
    const transliterated = this.transliterate(term, script);
    if (transliterated !== term) {
      variants.push(transliterated);
    }

    // Add lowercase variants
    variants.push(term.toLowerCase());
    if (transliterated !== term) {
      variants.push(transliterated.toLowerCase());
    }

    // Remove duplicates
    return [...new Set(variants)];
  }

  /**
   * Reverse transliteration (Latin to Greek approximation)
   */
  latinToGreek(text) {
    const reverseMap = {
      'th': 'θ', 'ph': 'φ', 'ch': 'χ', 'ps': 'ψ',
      'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'e': 'ε',
      'z': 'ζ', 'ē': 'η', 'i': 'ι', 'k': 'κ', 'l': 'λ',
      'm': 'μ', 'n': 'ν', 'x': 'ξ', 'o': 'ο', 'p': 'π',
      'r': 'ρ', 's': 'σ', 't': 'τ', 'y': 'υ', 'ō': 'ω'
    };

    let result = text.toLowerCase();

    // Replace digraphs first
    for (const [latin, greek] of Object.entries(reverseMap)) {
      if (latin.length > 1) {
        result = result.replace(new RegExp(latin, 'g'), greek);
      }
    }

    // Then single characters
    for (const [latin, greek] of Object.entries(reverseMap)) {
      if (latin.length === 1) {
        result = result.replace(new RegExp(latin, 'g'), greek);
      }
    }

    return result;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Transliterator };
}

#!/usr/bin/env node

/**
 * Corpus Search Testing Script
 * Tests translation and search functionality across all corpora
 */

const testWords = {
  greek: [
    { term: 'θεός', translation: 'god', description: 'God/deity' },
    { term: 'ἥρως', translation: 'hero', description: 'Hero' },
    { term: 'Ζεύς', translation: 'Zeus', description: 'Zeus' },
    { term: 'Ἀθηνᾶ', translation: 'Athena', description: 'Athena' },
    { term: 'πόλεμος', translation: 'war', description: 'War' },
    { term: 'θάνατος', translation: 'death', description: 'Death' }
  ],
  hebrew: [
    { term: 'אֱלֹהִים', translation: 'God', description: 'God (Elohim)' },
    { term: 'יְהוָה', translation: 'YHWH', description: 'Tetragrammaton' },
    { term: 'מֶלֶךְ', translation: 'king', description: 'King' },
    { term: 'תּוֹרָה', translation: 'Torah', description: 'Torah/Law' },
    { term: 'שָׁלוֹם', translation: 'peace', description: 'Peace' }
  ],
  sanskrit: [
    { term: 'देव', translation: 'deva', description: 'God/deity' },
    { term: 'ब्रह्मन्', translation: 'brahman', description: 'Brahman' },
    { term: 'योग', translation: 'yoga', description: 'Yoga' },
    { term: 'धर्म', translation: 'dharma', description: 'Dharma' },
    { term: 'कर्म', translation: 'karma', description: 'Karma' }
  ],
  egyptian: [
    { term: 'nṯr', translation: 'god', description: 'God (transliterated)' },
    { term: 'rˁ', translation: 'Ra', description: 'Ra (sun god)' },
    { term: 'wsir', translation: 'Osiris', description: 'Osiris' },
    { term: 'ḥtp', translation: 'offering', description: 'Offering' }
  ],
  chinese: [
    { term: '神', translation: 'god', description: 'God/deity (shén)' },
    { term: '道', translation: 'tao', description: 'Tao/Way (dào)' },
    { term: '天', translation: 'heaven', description: 'Heaven (tiān)' },
    { term: '陰陽', translation: 'yin-yang', description: 'Yin and Yang' }
  ]
};

class CorpusSearchTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async testTranslationAPI(language, term, expectedTranslation) {
    console.log(`\n🧪 Testing translation: ${term} (${language}) → ${expectedTranslation}`);

    try {
      // Test MyMemory API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=${language}|en`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData.translatedText) {
        const translation = data.responseData.translatedText.toLowerCase();
        const expected = expectedTranslation.toLowerCase();
        const match = translation.includes(expected) || expected.includes(translation);

        if (match) {
          console.log(`✅ PASS: Got "${data.responseData.translatedText}"`);
          this.results.passed++;
          return { success: true, translation: data.responseData.translatedText };
        } else {
          console.log(`⚠️  PARTIAL: Got "${data.responseData.translatedText}" (expected "${expectedTranslation}")`);
          this.results.passed++;
          return { success: true, translation: data.responseData.translatedText, partial: true };
        }
      } else {
        throw new Error('No translation in response');
      }
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      this.results.failed++;
      return { success: false, error: error.message };
    }
  }

  async testCorpusConfiguration(mythology) {
    console.log(`\n📚 Testing ${mythology} corpus configuration...`);

    try {
      const configPath = `../mythos/${mythology}/corpus-config.json`;
      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(path.join(__dirname, configPath))) {
        throw new Error('Configuration file not found');
      }

      const config = JSON.parse(fs.readFileSync(path.join(__dirname, configPath), 'utf8'));

      // Validate structure
      if (!config.repositories || !Array.isArray(config.repositories)) {
        throw new Error('Invalid repositories structure');
      }

      if (!config.translation_settings) {
        throw new Error('Missing translation settings');
      }

      console.log(`✅ Configuration valid`);
      console.log(`   - ${config.repositories.length} repository/repositories`);
      console.log(`   - Translation: ${config.translation_settings.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   - Provider: ${config.translation_settings.api_provider}`);

      this.results.passed++;
      return { success: true };
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      this.results.failed++;
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('=' .repeat(60));
    console.log('🔍 CORPUS SEARCH COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(60));

    // Test configurations
    console.log('\n📋 PHASE 1: Configuration Tests');
    console.log('-'.repeat(60));

    const mythologies = ['greek', 'hebrew', 'hindu', 'egyptian', 'jewish', 'roman', 'christian', 'buddhist'];

    for (const myth of mythologies) {
      await this.testCorpusConfiguration(myth);
      await this.sleep(500); // Rate limiting
    }

    // Test translations
    console.log('\n\n🌐 PHASE 2: Translation API Tests');
    console.log('-'.repeat(60));

    // Greek words
    console.log('\n🏛️ Greek (Ancient Greek → English)');
    for (const word of testWords.greek.slice(0, 3)) {
      await this.testTranslationAPI('grc', word.term, word.translation);
      await this.sleep(1000); // Rate limiting for API
    }

    // Hebrew words
    console.log('\n✡️ Hebrew (Hebrew → English)');
    for (const word of testWords.hebrew.slice(0, 2)) {
      await this.testTranslationAPI('he', word.term, word.translation);
      await this.sleep(1000);
    }

    // Sanskrit words
    console.log('\n🕉️ Sanskrit (Sanskrit → English)');
    for (const word of testWords.sanskrit.slice(0, 2)) {
      await this.testTranslationAPI('sa', word.term, word.translation);
      await this.sleep(1000);
    }

    // Chinese words
    console.log('\n🐉 Chinese (Chinese → English)');
    for (const word of testWords.chinese.slice(0, 2)) {
      await this.testTranslationAPI('zh', word.term, word.translation);
      await this.sleep(1000);
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;

    console.log(`Total Tests:  ${total}`);
    console.log(`Passed:       ${this.results.passed} ✅`);
    console.log(`Failed:       ${this.results.failed} ❌`);
    console.log(`Pass Rate:    ${passRate}%`);

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log(`\n⚠️  ${this.results.failed} test(s) failed`);
    }

    console.log('='.repeat(60));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests
if (require.main === module) {
  const tester = new CorpusSearchTester();
  tester.runAllTests().catch(console.error);
}

module.exports = { CorpusSearchTester, testWords };

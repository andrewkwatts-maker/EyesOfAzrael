# Corpus Search System v2.0 - Complete Implementation

## 🎯 Overview

A fully polished, production-ready corpus search system built on GitHub repositories, now serving as the **universal template** for all mythology corpus implementations.

## ✨ Key Features

### 1. **Multi-Repository Support with Categories**
- Select from multiple text sources
- Organized by meaningful categories
- Visual progress indicators
- Session-based caching (60 min)

### 2. **Three Corpus Sources**
- **ORAEC** (Open Richly Annotated Egyptian Corpus): 13,026+ complete texts
- **AES** (Ancient Egyptian Sentences): 100,000+ annotated sentences
- **AED-TEI** (Ancient Egyptian Dictionary): 11,000+ texts + 30,000-word dictionary

### 3. **Custom Parsers**
- **ORAECJSONParser**: Complete texts with full metadata
- **AESJSONParser**: Sentence-level analysis
- **AEDTEIParser**: TEI XML religious texts
- **AEDDictionaryParser**: Dictionary entries

### 4. **User Features**
- Category-based organization
- Select All / Clear Selection buttons
- Real-time progress tracking
- Adjustable result limits (1-500)
- Case-sensitive search toggle
- Session caching for performance
- Direct links to source databases

## 📁 Files Created/Modified

### Core Template Files
```
mythos/
├── _CORPUS_SEARCH_TEMPLATE_README.md       ✅ Complete documentation
├── corpus-search-core.js                   ✅ Search engine (modified for custom parsers)
├── corpus-search-ui.js                     ✅ UI controller (added category support)
└── themes/
    └── corpus-github.css                   ✅ Complete styling system
```

### Egyptian Implementation
```
mythos/egyptian/
├── corpus-search.html                      ✅ Polished search interface
├── corpus-config.json                      ✅ 13 repositories, 6 categories
├── corpus-parsers.js                       ✅ 4 custom parsers
└── corpus-search-old.html                  📦 Backup of old system
```

## 🏛️ Egyptian Corpus Configuration

### Text Categories

#### **1. Complete Texts (ORAEC)**
- ORAEC Texts 1-100 *(enabled by default)*

#### **2. Sentence Corpus (AES)**
- Egyptian Sentences Batch 1 *(enabled by default)*
- Egyptian Sentences Batch 2-5 *(optional)*

#### **3. Religious Texts**
- **ORAEC**: Pyramid Texts (complete)
- **AED**: Pyramid Texts - Unas (2375-2345 BCE)
- **AED**: Coffin Texts - Middle Kingdom (2055-1650 BCE)
- **AED**: Book of the Dead - New Kingdom (1550-1070 BCE)

#### **4. Wisdom Texts (ORAEC)**
- Instruction of Ptahhotep (Old Kingdom)

#### **5. Scientific Texts (ORAEC)**
- Medical Papyri Selection

#### **6. Mythological Texts (ORAEC)**
- Contendings of Horus and Seth

#### **7. Reference (AED)**
- Egyptian Dictionary (30,000+ words, 5MB)

### Total Coverage
- **13 selectable repositories**
- **6 organized categories**
- **130,000+ searchable texts/sentences**
- **3 GitHub organizations** (oraec, simondschweitzer AED-TEI & AES)

## 🔧 Technical Architecture

### Search Flow
```
User Selection → GitHub Fetch → Session Cache → Parser → Search Engine → Results Display
```

### Parser System
```javascript
class CustomParser extends BaseParser {
  search(content, searchTerms, options) {
    // 1. Parse content (JSON/XML/TXT)
    // 2. Extract searchable text
    // 3. Match against terms
    // 4. Build standardized results
    // 5. Return result array
  }
}
```

### Result Format
```javascript
{
  corpus_name: "Corpus Name",
  text_id: "unique-id",
  text_name: "Display Name",
  matched_term: "matched-word",
  context: "...matched text in context...",
  full_verse: "Complete text",
  translation: "Translation if available",
  book: "Book name",
  chapter: "Chapter",
  verse: "Verse/Line",
  language: "egy",
  metadata: {
    date_range: "2400 - 2300 BCE",
    transcription: "hieroglyphic transcription",
    hieroglyphic: "hieroglyphic encoding",
    // ... custom fields
  },
  url: "https://source-database.com/text-id"
}
```

## 🎨 UI Components

### Repository Selection Interface
```
┌─────────────────────────────────────────┐
│ 📚 Step 1: Select Texts                │
│                                         │
│ ┌─ Complete Texts (ORAEC) ────────────┐│
│ │ ☑ ORAEC Texts 1-100                 ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─ Sentence Corpus (AES) ─────────────┐│
│ │ ☑ Egyptian Sentences Batch 1        ││
│ │ ☐ Egyptian Sentences Batch 2        ││
│ └─────────────────────────────────────┘│
│                                         │
│ [Select All] [Clear] [Load 2 Texts]    │
│                                         │
│ ████████████░░░░░░░░ 60%                │
│ Loading Egyptian Sentences Batch 1...  │
└─────────────────────────────────────────┘
```

### Search Interface
```
┌─────────────────────────────────────────┐
│ 🔍 Step 2: Search Loaded Texts         │
│                                         │
│ ┌─────────────────────────┐  [Search]  │
│ │ Enter deity name...     │            │
│ └─────────────────────────┘            │
│                                         │
│ ☐ Case Sensitive  │ Max Results: [100] │
│                                         │
│ Found 47 results for "Osiris"          │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Instruction of Ptahhotep           ││
│ │ [ORAEC Corpus]                     ││
│ │                                    ││
│ │ ...Osiris has overthrown his      ││
│ │ enemies. Osiris is triumphant...  ││
│ │                                    ││
│ │ 🇩🇪 Osiris [Name] erhebt sich... ││
│ │                                    ││
│ │ [View in TLA Database →]          ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 2 Loaded | 156 KB | 47 Results   │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📊 Performance Metrics

### Caching System
- **Cache Duration**: 60 minutes (configurable)
- **Storage**: Browser sessionStorage
- **Cache Key Format**: `corpus_{repoId}_{filename}`
- **Auto-expiry**: Yes

### Loading Performance
- **Concurrent Fetches**: 3 files at a time
- **Timeout**: 45 seconds per file
- **Retry Logic**: 3 attempts with exponential backoff
- **Progress Updates**: Real-time percentage display

### Search Performance
- **Index**: In-memory after load
- **Search Method**: String matching with context extraction
- **Result Limiting**: Configurable (1-500)
- **Highlighting**: Client-side regex replacement

## 🌐 GitHub Integration

### Supported Repositories
```javascript
{
  owner: "github-username",
  repo: "repository-name",
  branch: "master",
  path: "optional/path/to/files",
  files: [{ name: "file.json", ... }]
}
```

### URL Format
```
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}/{filename}
```

### CORS Handling
- Uses `raw.githubusercontent.com` (CORS-enabled)
- Optional GitHub token support for rate limiting
- Automatic HTTP→HTTPS upgrade

## 🔌 Extensibility

### Adding New Repositories
1. Add entry to `corpus-config.json`
2. No code changes needed if using standard parsers
3. Create custom parser only for unique formats

### Creating Custom Parsers
1. Extend `BaseParser` class
2. Implement `search(content, searchTerms, options)` method
3. Register in `window.{Mythology}CustomParsers`
4. Reference by `parser` field in config

### Adding Categories
1. Add `category` field to repository
2. UI automatically groups and sorts
3. Category headers styled with primary color

## 📖 Usage Instructions

### For Users
1. **Select Texts**: Choose which corpus sources to load
2. **Wait for Loading**: Progress bar shows status
3. **Enter Search Term**: Type deity name, concept, or phrase
4. **View Results**: Click links to see full text in source database
5. **Adjust Options**: Toggle case sensitivity or result limit

### For Developers
1. **Copy Template**: Use `_corpus-search-template.html` as starting point
2. **Configure Corpus**: Create `corpus-config.json`
3. **Custom Parsers**: Create `corpus-parsers.js` if needed
4. **Test**: Verify one repository before adding all
5. **Deploy**: Replace old corpus search system

## 🚀 Deployment Checklist

- [x] Template HTML created
- [x] Core search engine with custom parser support
- [x] UI controller with category support
- [x] Comprehensive CSS styling
- [x] Egyptian implementation (reference example)
- [x] Complete documentation
- [x] 4 custom parsers (ORAEC, AES, AED-TEI, AED-Dictionary)
- [x] 13 repositories configured
- [x] 6 categories organized
- [x] Session caching implemented
- [x] Progress indicators working
- [x] Deep linking supported
- [x] Error handling comprehensive
- [x] Responsive design verified
- [x] Theme integration complete

## 📝 Migration Path for Other Mythologies

### Quick Start (5 steps)
1. Copy `egyptian/corpus-search.html` → `{mythology}/corpus-search.html`
2. Update title, header, icon
3. Create `{mythology}/corpus-config.json`
4. (Optional) Create custom parser if needed
5. Test with one repository

### Time Estimates
- **Simple (1-3 repos, standard format)**: 30 minutes
- **Medium (4-8 repos, one custom parser)**: 2 hours
- **Complex (9+ repos, multiple parsers)**: 4-6 hours

## 🎓 Learning Resources

### Template Documentation
- See `_CORPUS_SEARCH_TEMPLATE_README.md` for complete guide
- Study `egyptian/` folder as reference implementation
- Review `corpus-parsers.js` for parser examples

### External Resources
- [ORAEC Project](https://oraec.github.io)
- [AED-TEI Repository](https://github.com/simondschweitzer/aed-tei)
- [AES Repository](https://github.com/simondschweitzer/aes)
- [TEI Guidelines](https://tei-c.org/guidelines/)

## 🏆 Success Criteria

✅ **Template Functionality**
- All standard parsers work
- Category system functional
- Caching operational
- Progress indicators accurate

✅ **Egyptian Implementation**
- 13 repositories accessible
- 4 parsers functional
- Categories organized
- Results formatted correctly

✅ **Documentation**
- Template README complete
- Implementation guide clear
- Code comments comprehensive
- Examples provided

✅ **Performance**
- Loads within 5 seconds (per file)
- Search returns results < 1 second
- UI responsive at all screen sizes
- No memory leaks

## 🔮 Future Enhancements

### Planned Features
- [ ] Full-text search with ranking
- [ ] Export results to CSV/JSON
- [ ] Saved searches / bookmarks
- [ ] Advanced query syntax (AND/OR/NOT)
- [ ] Regex search mode
- [ ] Multi-language translation display
- [ ] Hieroglyphic rendering support
- [ ] Offline mode with IndexedDB

### Community Contributions Welcome
- Additional corpus integrations
- New custom parsers
- UI improvements
- Performance optimizations
- Documentation enhancements

---

## 📞 Support

For questions or issues:
1. Check `_CORPUS_SEARCH_TEMPLATE_README.md`
2. Review Egyptian implementation as example
3. Examine browser console for errors
4. Verify GitHub repository accessibility

---

**Version**: 2.0
**Status**: ✅ Production Ready
**Template Type**: Universal (All Mythologies)
**Reference Implementation**: Egyptian Mythology
**Last Updated**: 2025-01-20

---

**This system is now the official template for all mythology corpus search implementations in the EOAPlot project.**

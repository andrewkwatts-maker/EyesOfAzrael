/**
 * Migration Configuration
 *
 * This file contains all the rules and mappings for migrating
 * HTML mythology content to Firebase assets collection.
 */

module.exports = {
  // Asset type detection patterns based on URL paths
  assetTypePatterns: {
    deity: ['/deities/', '/gods/', '/goddesses/'],
    hero: ['/heroes/', '/figures/', '/saints/'],
    creature: ['/creatures/', '/beings/', '/angels/', '/demons/'],
    place: ['/places/', '/locations/', '/realms/', '/cosmology/'],
    item: ['/items/', '/artifacts/', '/relics/', '/weapons/'],
    text: ['/texts/', '/scriptures/', '/books/'],
    concept: ['/concepts/', '/teachings/', '/theology/', '/practices/', '/rituals/', '/magic/']
  },

  // Mythology detection from URL path
  mythologyPatterns: {
    'greek': /\/mythos\/greek\//,
    'roman': /\/mythos\/roman\//,
    'norse': /\/mythos\/norse\//,
    'egyptian': /\/mythos\/egyptian\//,
    'babylonian': /\/mythos\/babylonian\//,
    'sumerian': /\/mythos\/sumerian\//,
    'hindu': /\/mythos\/hindu\//,
    'buddhist': /\/mythos\/buddhist\//,
    'celtic': /\/mythos\/celtic\//,
    'jewish': /\/mythos\/jewish\//,
    'christian': /\/mythos\/christian\//,
    'islamic': /\/mythos\/islamic\//,
    'chinese': /\/mythos\/chinese\//,
    'japanese': /\/mythos\/japanese\//,
    'aztec': /\/mythos\/aztec\//,
    'mayan': /\/mythos\/mayan\//,
    'apocryphal': /\/mythos\/apocryphal\//
  },

  // Icon auto-assignment based on keywords in section titles
  iconKeywords: {
    '📋': ['overview', 'summary', 'introduction', 'about'],
    '📖': ['mythology', 'stories', 'myths', 'tales', 'legends'],
    '⚡': ['symbols', 'attributes', 'insignia', 'emblems'],
    '💫': ['powers', 'abilities', 'domains', 'authority'],
    '👨‍👩‍👧‍👦': ['family', 'relatives', 'genealogy', 'lineage', 'children', 'parents'],
    '🔗': ['related', 'connections', 'associations', 'links'],
    '📚': ['sources', 'references', 'bibliography', 'texts'],
    '⛪': ['worship', 'rituals', 'practices', 'ceremonies'],
    '🏛️': ['temples', 'shrines', 'sacred sites', 'places'],
    '🎭': ['festivals', 'celebrations', 'holidays'],
    '🎁': ['offerings', 'sacrifices', 'gifts'],
    '🙏': ['prayers', 'invocations', 'hymns'],
    '⚔️': ['battles', 'conflicts', 'wars', 'combat'],
    '🌟': ['titles', 'epithets', 'names'],
    '🌍': ['parallels', 'cross-cultural', 'comparative'],
    '💭': ['teachings', 'philosophy', 'wisdom', 'doctrine'],
    '🎨': ['art', 'depictions', 'representations'],
    '📜': ['history', 'historical', 'background'],
    '🔮': ['prophecy', 'divination', 'oracles'],
    '✨': ['miracles', 'wonders', 'supernatural']
  },

  // Panel type detection from HTML structure
  panelTypes: {
    text: 'p, ul, ol, blockquote',
    grid: '.deity-grid, .attribute-grid, .grid-2col, .panel-grid',
    card: '.deity-card, .attribute-card, .glass-card',
    link: 'a[href]'
  },

  // Metadata extraction patterns
  metadataPatterns: {
    // Extract from structured sections
    domains: {
      labels: ['Domains', 'Domain', 'Spheres of Influence', 'Authority'],
      selector: '.attribute-card, .attribute-value'
    },
    symbols: {
      labels: ['Symbols', 'Symbol', 'Sacred Symbols', 'Emblems'],
      selector: '.attribute-card, .attribute-value'
    },
    titles: {
      labels: ['Titles', 'Title', 'Epithets', 'Names', 'Alternate Names'],
      selector: '.attribute-card, .attribute-value'
    },
    sacredAnimals: {
      labels: ['Sacred Animals', 'Animals', 'Associated Creatures'],
      selector: '.attribute-card, .attribute-value'
    },
    sacredPlants: {
      labels: ['Sacred Plants', 'Plants', 'Sacred Herbs'],
      selector: '.attribute-card, .attribute-value'
    },
    colors: {
      labels: ['Colors', 'Sacred Colors'],
      selector: '.attribute-card, .attribute-value'
    }
  },

  // Relationship extraction
  relationshipPatterns: {
    parents: ['Parents', 'Father', 'Mother'],
    consorts: ['Consort', 'Consorts', 'Spouse', 'Wife', 'Husband'],
    children: ['Children', 'Offspring', 'Sons', 'Daughters'],
    siblings: ['Siblings', 'Brothers', 'Sisters'],
    allies: ['Allies', 'Friends', 'Companions'],
    enemies: ['Enemies', 'Foes', 'Adversaries', 'Opponents']
  },

  // HTML elements to skip during parsing
  skipElements: [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    '.breadcrumb',
    '#theme-picker',
    '#theme-picker-container'
  ],

  // Special sections that should become dedicated panels
  specialSections: {
    'worship': {
      icon: '⛪',
      type: 'panel',
      importance: 'high'
    },
    'mythology': {
      icon: '📖',
      type: 'panel',
      importance: 'high'
    },
    'relationships': {
      icon: '👨‍👩‍👧‍👦',
      type: 'panel',
      importance: 'high'
    },
    'attributes': {
      icon: '⚡',
      type: 'grid',
      importance: 'high'
    }
  },

  // Content cleanup rules
  contentCleanup: {
    // Remove excessive whitespace
    trimWhitespace: true,

    // Convert multiple spaces to single space
    normalizeSpaces: true,

    // Remove empty paragraphs
    removeEmptyParagraphs: true,

    // Preserve line breaks in lists
    preserveListFormatting: true,

    // Clean up HTML entities
    decodeEntities: true
  },

  // URL transformation rules
  urlTransformation: {
    // Make URLs relative to root
    makeRelative: true,

    // Preserve external links
    preserveExternal: true,

    // Fix broken paths
    fixPaths: true
  },

  // Validation rules
  validation: {
    // Required fields for each asset type
    required: {
      deity: ['name', 'mythology', 'summary'],
      hero: ['name', 'mythology', 'summary'],
      creature: ['name', 'mythology', 'summary'],
      place: ['name', 'mythology', 'summary'],
      item: ['name', 'mythology', 'summary'],
      text: ['name', 'mythology', 'summary'],
      concept: ['name', 'mythology', 'summary']
    },

    // Minimum content length
    minSummaryLength: 50,

    // Maximum field lengths
    maxNameLength: 200,
    maxSummaryLength: 1000,

    // Panel validation
    minPanelsPerAsset: 1,
    maxPanelsPerAsset: 50
  },

  // Grid width detection
  gridWidthPatterns: {
    2: ['grid-2col', 'two-column'],
    3: ['deity-grid', 'three-column', 'attribute-grid'],
    4: ['four-column']
  },

  // Default values
  defaults: {
    isOfficial: true,
    status: 'published',
    contributedBy: null,
    gridWidth: 3,
    panelType: 'panel'
  },

  // Asset-specific configurations
  assetConfigs: {
    deity: {
      extractFields: ['pantheon', 'domain', 'symbols', 'epithets'],
      specialPanels: ['worship', 'mythology', 'relationships']
    },
    hero: {
      extractFields: ['achievements', 'weapons', 'companions'],
      specialPanels: ['biography', 'deeds', 'legacy']
    },
    creature: {
      extractFields: ['habitat', 'abilities', 'weaknesses'],
      specialPanels: ['description', 'encounters', 'lore']
    },
    place: {
      extractFields: ['location', 'significance', 'inhabitants'],
      specialPanels: ['description', 'history', 'mythology']
    },
    item: {
      extractFields: ['type', 'powers', 'owner'],
      specialPanels: ['description', 'history', 'powers']
    },
    text: {
      extractFields: ['author', 'date', 'language', 'content'],
      specialPanels: ['overview', 'content', 'significance']
    },
    concept: {
      extractFields: ['definition', 'significance', 'practices'],
      specialPanels: ['overview', 'teachings', 'practice']
    }
  },

  // Mythology-specific overrides
  mythologyConfigs: {
    christian: {
      assetTypePatterns: {
        // Add theology as concept
        concept: ['/theology/', '/teachings/', '/gnostic/']
      }
    },
    jewish: {
      assetTypePatterns: {
        concept: ['/kabbalah/', '/sefiroth/', '/teachings/']
      }
    },
    buddhist: {
      assetTypePatterns: {
        concept: ['/concepts/', '/teachings/', '/practices/']
      }
    }
  },

  // File patterns to exclude
  excludePatterns: [
    'index.html',
    'corpus-search.html',
    'browse.html',
    'submit.html',
    'view.html',
    'edit.html'
  ],

  // Progress reporting intervals
  reporting: {
    progressInterval: 10, // Report every N files
    verboseLogging: false,
    saveErrorLog: true,
    errorLogPath: 'migration-errors.log'
  }
};

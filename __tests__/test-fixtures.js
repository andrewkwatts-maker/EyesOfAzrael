/**
 * Test Fixtures
 * Comprehensive mock data sets and realistic test data for Eyes of Azrael
 *
 * @module test-fixtures
 */

// ============================================================================
// ENTITY FIXTURES
// ============================================================================

export const GREEK_DEITIES = {
    zeus: {
        id: 'zeus-123',
        name: 'Zeus',
        mythology: 'greek',
        collection: 'deities',
        icon: '⚡',
        importance: 5,
        fullDescription: 'King of the Greek gods, ruler of Mount Olympus, and god of the sky and thunder.',
        alternateNames: ['Jupiter', 'Dias'],
        domains: ['Sky', 'Thunder', 'Lightning', 'Justice'],
        symbols: ['Thunderbolt', 'Eagle', 'Oak Tree'],
        element: 'Air',
        gender: 'Male',
        linguistic: { originalName: 'Ζεύς' },
        status: 'active'
    },
    hera: {
        id: 'hera-456',
        name: 'Hera',
        mythology: 'greek',
        collection: 'deities',
        icon: '👑',
        importance: 5,
        fullDescription: 'Queen of the Greek gods and goddess of marriage and family.',
        alternateNames: ['Juno'],
        domains: ['Marriage', 'Family', 'Childbirth'],
        symbols: ['Peacock', 'Cow', 'Diadem'],
        element: 'Earth',
        gender: 'Female',
        linguistic: { originalName: 'Ἥρα' },
        status: 'active'
    },
    athena: {
        id: 'athena-789',
        name: 'Athena',
        mythology: 'greek',
        collection: 'deities',
        icon: '🦉',
        importance: 5,
        fullDescription: 'Goddess of wisdom, warfare, and crafts.',
        alternateNames: ['Minerva', 'Pallas Athena'],
        domains: ['Wisdom', 'War', 'Crafts', 'Strategy'],
        symbols: ['Owl', 'Olive Tree', 'Aegis'],
        element: 'Air',
        gender: 'Female',
        linguistic: { originalName: 'Ἀθηνᾶ' },
        status: 'active'
    }
};

export const NORSE_DEITIES = {
    odin: {
        id: 'odin-123',
        name: 'Odin',
        mythology: 'norse',
        collection: 'deities',
        icon: '🔱',
        importance: 5,
        fullDescription: 'The Allfather, chief of the Aesir gods, associated with wisdom, war, and death.',
        alternateNames: ['Woden', 'Wotan'],
        domains: ['Wisdom', 'War', 'Death', 'Magic'],
        symbols: ['Spear Gungnir', 'Ravens', 'Eight-legged horse'],
        element: 'Air',
        gender: 'Male',
        status: 'active'
    },
    thor: {
        id: 'thor-456',
        name: 'Thor',
        mythology: 'norse',
        collection: 'deities',
        icon: '🔨',
        importance: 5,
        fullDescription: 'God of thunder, lightning, storms, and strength.',
        alternateNames: ['Donar'],
        domains: ['Thunder', 'Lightning', 'Storms', 'Strength'],
        symbols: ['Hammer Mjolnir', 'Goats', 'Belt of Strength'],
        element: 'Air',
        gender: 'Male',
        status: 'active'
    }
};

export const EGYPTIAN_DEITIES = {
    ra: {
        id: 'ra-123',
        name: 'Ra',
        mythology: 'egyptian',
        collection: 'deities',
        icon: '☀️',
        importance: 5,
        fullDescription: 'The sun god and creator deity, king of the gods.',
        alternateNames: ['Re', 'Amun-Ra'],
        domains: ['Sun', 'Creation', 'Kings'],
        symbols: ['Sun Disk', 'Falcon', 'Cobra'],
        element: 'Fire',
        gender: 'Male',
        status: 'active'
    }
};

// ============================================================================
// HEROES FIXTURES
// ============================================================================

export const GREEK_HEROES = {
    heracles: {
        id: 'heracles-123',
        name: 'Heracles',
        mythology: 'greek',
        collection: 'heroes',
        icon: '💪',
        importance: 5,
        fullDescription: 'Greatest of Greek heroes, known for his twelve labors.',
        alternateNames: ['Hercules'],
        domains: ['Strength', 'Courage'],
        symbols: ['Lion Skin', 'Club'],
        status: 'active'
    }
};

// ============================================================================
// CREATURES FIXTURES
// ============================================================================

export const GREEK_CREATURES = {
    medusa: {
        id: 'medusa-123',
        name: 'Medusa',
        mythology: 'greek',
        collection: 'creatures',
        icon: '🐍',
        importance: 4,
        fullDescription: 'One of the three Gorgons, with snakes for hair and a petrifying gaze.',
        domains: ['Monsters', 'Transformation'],
        symbols: ['Snake Hair', 'Petrifying Gaze'],
        status: 'active'
    }
};

// ============================================================================
// EDGE CASE FIXTURES
// ============================================================================

export const EDGE_CASES = {
    minimal: {
        id: 'minimal-123',
        name: 'Minimal Entity',
        mythology: 'greek',
        collection: 'deities',
        status: 'active'
    },
    empty_strings: {
        id: 'empty-123',
        name: '',
        mythology: '',
        collection: 'deities',
        description: '',
        status: 'active'
    },
    null_values: {
        id: 'null-123',
        name: 'Entity with Nulls',
        mythology: 'greek',
        collection: 'deities',
        description: null,
        icon: null,
        domains: null,
        symbols: null,
        status: 'active'
    },
    very_long_strings: {
        id: 'long-123',
        name: 'A'.repeat(500),
        mythology: 'greek',
        collection: 'deities',
        fullDescription: 'Lorem ipsum dolor sit amet, '.repeat(100),
        status: 'active'
    },
    special_characters: {
        id: 'special-123',
        name: '<script>alert("XSS")</script>',
        mythology: 'greek',
        collection: 'deities',
        description: 'Test & "quotes" and \'apostrophes\'',
        status: 'active'
    }
};

// ============================================================================
// USER FIXTURES
// ============================================================================

export const USERS = {
    standard: {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true
    },
    admin: {
        uid: 'admin-123',
        email: 'admin@eyesofazrael.com',
        displayName: 'Admin User',
        photoURL: 'https://example.com/admin.jpg',
        emailVerified: true,
        customClaims: { admin: true }
    },
    unverified: {
        uid: 'unverified-123',
        email: 'unverified@example.com',
        displayName: 'Unverified User',
        photoURL: null,
        emailVerified: false
    },
    no_photo: {
        uid: 'nophoto-123',
        email: 'nophoto@example.com',
        displayName: 'No Photo User',
        photoURL: null,
        emailVerified: true
    }
};

// ============================================================================
// SEARCH RESULT FIXTURES
// ============================================================================

export const SEARCH_RESULTS = {
    empty: {
        results: [],
        totalResults: 0,
        query: 'nonexistent'
    },
    single: {
        results: [GREEK_DEITIES.zeus],
        totalResults: 1,
        query: 'zeus'
    },
    multiple: {
        results: Object.values(GREEK_DEITIES),
        totalResults: 3,
        query: 'greek gods'
    },
    paginated: {
        results: Object.values(GREEK_DEITIES).slice(0, 2),
        totalResults: 10,
        currentPage: 1,
        totalPages: 5,
        query: 'deities'
    }
};

// ============================================================================
// FIRESTORE RESPONSE FIXTURES
// ============================================================================

export const FIRESTORE_RESPONSES = {
    success: {
        exists: true,
        id: 'doc-123',
        data: () => GREEK_DEITIES.zeus
    },
    not_found: {
        exists: false,
        id: null,
        data: () => null
    },
    error: {
        code: 'permission-denied',
        message: 'Missing or insufficient permissions'
    },
    network_error: {
        code: 'unavailable',
        message: 'Network request failed'
    }
};

// ============================================================================
// CRUD OPERATION FIXTURES
// ============================================================================

export const CRUD_RESPONSES = {
    create_success: {
        success: true,
        id: 'new-entity-123',
        message: 'Entity created successfully'
    },
    create_error: {
        success: false,
        error: 'Failed to create entity: Validation error'
    },
    read_success: {
        success: true,
        data: GREEK_DEITIES.zeus
    },
    read_not_found: {
        success: false,
        error: 'Entity not found'
    },
    update_success: {
        success: true,
        id: 'entity-123',
        message: 'Entity updated successfully'
    },
    update_error: {
        success: false,
        error: 'Failed to update entity: Permission denied'
    },
    delete_success: {
        success: true,
        id: 'entity-123',
        message: 'Entity deleted successfully'
    },
    delete_error: {
        success: false,
        error: 'Failed to delete entity'
    }
};

// ============================================================================
// ANALYTICS EVENT FIXTURES
// ============================================================================

export const ANALYTICS_EVENTS = {
    page_view: {
        event: 'page_view',
        page_title: 'Greek Deities',
        page_path: '/mythology/greek/deities'
    },
    search: {
        event: 'search',
        search_term: 'zeus',
        results_count: 5
    },
    entity_view: {
        event: 'entity_view',
        entity_id: 'zeus-123',
        entity_type: 'deity',
        mythology: 'greek'
    },
    contribution: {
        event: 'contribution',
        action: 'create',
        entity_type: 'deity',
        mythology: 'greek'
    }
};

// ============================================================================
// FORM DATA FIXTURES
// ============================================================================

export const FORM_DATA = {
    valid_deity: {
        name: 'New Deity',
        mythology: 'greek',
        collection: 'deities',
        description: 'A new deity for testing',
        icon: '⚡',
        importance: 3,
        domains: ['Test Domain'],
        symbols: ['Test Symbol']
    },
    invalid_empty: {
        name: '',
        mythology: '',
        collection: '',
        description: ''
    },
    invalid_types: {
        name: 123,
        mythology: null,
        collection: undefined,
        description: ['array', 'not', 'string']
    }
};

// ============================================================================
// RELATED ENTITIES FIXTURES
// ============================================================================

export const RELATED_ENTITIES = {
    zeus_family: {
        entity: GREEK_DEITIES.zeus,
        related: [
            GREEK_DEITIES.hera,
            GREEK_DEITIES.athena,
            GREEK_HEROES.heracles
        ]
    },
    cross_mythology: {
        entity: GREEK_DEITIES.zeus,
        related: [
            NORSE_DEITIES.odin,
            EGYPTIAN_DEITIES.ra
        ]
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all entities across all mythologies
 * @returns {Array<Object>} All entity fixtures
 */
export function getAllEntities() {
    return [
        ...Object.values(GREEK_DEITIES),
        ...Object.values(NORSE_DEITIES),
        ...Object.values(EGYPTIAN_DEITIES),
        ...Object.values(GREEK_HEROES),
        ...Object.values(GREEK_CREATURES)
    ];
}

/**
 * Get entities by mythology
 * @param {string} mythology - Mythology name
 * @returns {Array<Object>} Entities for that mythology
 */
export function getEntitiesByMythology(mythology) {
    return getAllEntities().filter(e => e.mythology === mythology);
}

/**
 * Get entities by collection
 * @param {string} collection - Collection name
 * @returns {Array<Object>} Entities for that collection
 */
export function getEntitiesByCollection(collection) {
    return getAllEntities().filter(e => e.collection === collection);
}

/**
 * Create a mock Firestore snapshot
 * @param {Array<Object>} entities - Entities to include
 * @returns {Object} Mock snapshot
 */
export function createMockSnapshot(entities) {
    return {
        docs: entities.map(entity => ({
            id: entity.id,
            exists: true,
            data: () => entity
        })),
        forEach: function(callback) {
            this.docs.forEach(callback);
        },
        size: entities.length,
        empty: entities.length === 0
    };
}

# Failed Assets Fixed - Summary Report

**Date:** 28/12/2025, 10:45:41 pm

## Summary

- **Total Assets Fixed:** 12
- **Successful Fixes:** 11
- **Failed Fixes:** 1
- **Validation Passed:** 11
- **Validation Failed:** 1

---

## Fixes Applied

### Archetypes Collection

#### archetypes
- **Fields Added:** 

#### hermetic
- **Fields Added:** 

#### related-mythological-figures
- **Fields Added:** 

#### world
- **Fields Added:** 

### Pages Collection

#### archetypes
- **Fields Added:** name, mythology, created_at, createdBy

#### home
- **Fields Added:** name, mythology, created_at, createdBy

#### items
- **Fields Added:** name, mythology, created_at, createdBy

#### mythologies
- **Fields Added:** name, mythology, created_at, createdBy

#### places
- **Fields Added:** name, mythology, created_at, createdBy

#### submissions
- **Fields Added:** name, mythology, created_at, createdBy

#### theories
- **Fields Added:** name, mythology, created_at, createdBy

---

## Validation Issues

- **archetypes/universal-symbols:** Document not found

---

## Next Steps

1. Run full validation: `node scripts/validate-firebase-assets.js`
2. Verify 0 failed assets in validation report
3. Check rendering in production
4. Monitor for any issues

---

## Detailed Changes


### archetypes/archetypes

**Fields Added:** 

**Before:**
```json
{
  "totalOccurrences": 6,
  "occurrences": {
    "tarot": [
      {
        "deity": "empress",
        "name": "The Great Mother"
      },
      {
        "deity": "fool",
        "name": "The Innocent Seeker"
      },
      {
        "deity": "high-priestess",
        "name": "Guardian of Hidden Knowledge"
      },
      {
        "deity": "lovers",
        "name": "Sacred Union"
      },
      {
        "deity": "magician",
        "name": "As Above, So Below"
      },
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Archetypes",
  "id": "archetypes",
  "mythology": "global",
  "icon": "🎭",
  "description": "Universal patterns and themes that appear across world mythologies, representing fundamental human experiences and cosmic principles. These archetypal forms transcend individual cultures, revealing shared human narratives.",
  "type": "archetype-index"
}
```

**After:**
```json
{
  "totalOccurrences": 6,
  "occurrences": {
    "tarot": [
      {
        "deity": "empress",
        "name": "The Great Mother"
      },
      {
        "deity": "fool",
        "name": "The Innocent Seeker"
      },
      {
        "deity": "high-priestess",
        "name": "Guardian of Hidden Knowledge"
      },
      {
        "deity": "lovers",
        "name": "Sacred Union"
      },
      {
        "deity": "magician",
        "name": "As Above, So Below"
      },
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Archetypes",
  "id": "archetypes",
  "mythology": "global",
  "icon": "🎭",
  "description": "Universal patterns and themes that appear across world mythologies, representing fundamental human experiences and cosmic principles. These archetypal forms transcend individual cultures, revealing shared human narratives.",
  "type": "archetype-index"
}
```

---

### archetypes/hermetic

**Fields Added:** 

**Before:**
```json
{
  "totalOccurrences": 1,
  "occurrences": {
    "tarot": [
      {
        "deity": "magician",
        "name": "As Above, So Below"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Hermetic",
  "id": "hermetic",
  "mythology": "global",
  "icon": "⚗️",
  "description": "The Hermetic principle \"As Above, So Below\" teaches that patterns repeat at every scale of existence, from the microcosm to the macrocosm. This fundamental teaching of Hermeticism appears in mystical traditions worldwide.",
  "type": "philosophical-archetype"
}
```

**After:**
```json
{
  "totalOccurrences": 1,
  "occurrences": {
    "tarot": [
      {
        "deity": "magician",
        "name": "As Above, So Below"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Hermetic",
  "id": "hermetic",
  "mythology": "global",
  "icon": "⚗️",
  "description": "The Hermetic principle \"As Above, So Below\" teaches that patterns repeat at every scale of existence, from the microcosm to the macrocosm. This fundamental teaching of Hermeticism appears in mystical traditions worldwide.",
  "type": "philosophical-archetype"
}
```

---

### archetypes/related-mythological-figures

**Fields Added:** 

**Before:**
```json
{
  "totalOccurrences": 6,
  "occurrences": {
    "tarot": [
      {
        "deity": "empress",
        "name": "The Great Mother"
      },
      {
        "deity": "fool",
        "name": "The Innocent Seeker"
      },
      {
        "deity": "high-priestess",
        "name": "Guardian of Hidden Knowledge"
      },
      {
        "deity": "lovers",
        "name": "Sacred Union"
      },
      {
        "deity": "magician",
        "name": "As Above, So Below"
      },
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Related Mythological Figures",
  "id": "related-mythological-figures",
  "mythology": "global",
  "icon": "🔗",
  "description": "Deities and figures from different mythological traditions that embody similar archetypal patterns, revealing universal themes across cultures. These connections demonstrate the shared human experience expressed through diverse mythological narratives.",
  "type": "cross-reference"
}
```

**After:**
```json
{
  "totalOccurrences": 6,
  "occurrences": {
    "tarot": [
      {
        "deity": "empress",
        "name": "The Great Mother"
      },
      {
        "deity": "fool",
        "name": "The Innocent Seeker"
      },
      {
        "deity": "high-priestess",
        "name": "Guardian of Hidden Knowledge"
      },
      {
        "deity": "lovers",
        "name": "Sacred Union"
      },
      {
        "deity": "magician",
        "name": "As Above, So Below"
      },
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Related Mythological Figures",
  "id": "related-mythological-figures",
  "mythology": "global",
  "icon": "🔗",
  "description": "Deities and figures from different mythological traditions that embody similar archetypal patterns, revealing universal themes across cultures. These connections demonstrate the shared human experience expressed through diverse mythological narratives.",
  "type": "cross-reference"
}
```

---

### archetypes/world

**Fields Added:** 

**Before:**
```json
{
  "totalOccurrences": 1,
  "occurrences": {
    "tarot": [
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "world",
  "id": "world",
  "mythology": "global",
  "icon": "🌍",
  "description": "The World card represents cosmic completion, the achievement of unity with all existence, and the fulfillment of the soul's journey. It embodies the sacred dance at the center of creation where all opposites unite.",
  "type": "tarot-archetype"
}
```

**After:**
```json
{
  "totalOccurrences": 1,
  "occurrences": {
    "tarot": [
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "world",
  "id": "world",
  "mythology": "global",
  "icon": "🌍",
  "description": "The World card represents cosmic completion, the achievement of unity with all existence, and the fulfillment of the soul's journey. It embodies the sacred dance at the center of creation where all opposites unite.",
  "type": "tarot-archetype"
}
```

---

### pages/archetypes

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "id": "archetypes",
  "sections": [
    {
      "id": "all-archetypes",
      "sortBy": "name",
      "collection": "archetypes",
      "title": "All Archetypes",
      "type": "panel-cards"
    }
  ],
  "title": "Mythological Archetypes",
  "type": "category",
  "layout": "grid",
  "subtitle": "Universal patterns in world mythology",
  "description": "Discover recurring themes, characters, and patterns that appear across cultures",
  "icon": "🎭",
  "metadata": {
    "status": "active",
    "version": "1.0",
    "author": "system",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "id": "archetypes",
  "sections": [
    {
      "id": "all-archetypes",
      "sortBy": "name",
      "collection": "archetypes",
      "title": "All Archetypes",
      "type": "panel-cards"
    }
  ],
  "title": "Mythological Archetypes",
  "type": "category",
  "layout": "grid",
  "subtitle": "Universal patterns in world mythology",
  "description": "Discover recurring themes, characters, and patterns that appear across cultures",
  "icon": "🎭",
  "metadata": {
    "status": "active",
    "version": "1.0",
    "author": "system",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "Mythological Archetypes",
  "created_at": "2025-12-28T12:45:39.029Z",
  "mythology": "global"
}
```

---

### pages/home

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "sections": [
    {
      "displayCount": 12,
      "type": "panel-cards",
      "collection": "mythologies",
      "icon": "🏛️",
      "featured": true,
      "link": "#/mythologies",
      "title": "World Mythologies",
      "sortBy": "order",
      "description": "Explore gods, heroes, and legends from cultures around the world",
      "id": "mythologies"
    },
    {
      "featured": true,
      "id": "places",
      "displayCount": 6,
      "collection": "places",
      "icon": "🗺️",
      "title": "Sacred Places",
      "sortBy": "importance",
      "description": "Discover mythical locations and sacred sites",
      "link": "#/places",
      "type": "panel-cards"
    },
    {
      "link": "#/items",
      "featured": true,
      "collection": "items",
      "title": "Legendary Items",
      "type": "panel-cards",
      "icon": "⚔️",
      "description": "Artifacts of power from myth and legend",
      "id": "items",
      "sortBy": "importance",
      "displayCount": 6
    },
    {
      "link": "#/archetypes",
      "sortBy": "name",
      "icon": "🎭",
      "featured": true,
      "description": "Universal patterns across world mythologies",
      "displayCount": 6,
      "type": "panel-cards",
      "collection": "archetypes",
      "title": "Mythological Archetypes",
      "id": "archetypes"
    },
    {
      "displayCount": 4,
      "title": "Theories & Analysis",
      "id": "theories",
      "featured": false,
      "collection": "theories",
      "icon": "🧠",
      "sortBy": "created",
      "type": "panel-cards",
      "link": "#/theories",
      "description": "Scholarly interpretations and comparative mythology"
    },
    {
      "icon": "📝",
      "description": "User-submitted content and research",
      "title": "Community Contributions",
      "id": "submissions",
      "sortBy": "created",
      "type": "panel-cards",
      "link": "#/submissions",
      "collection": "submissions",
      "featured": false,
      "displayCount": 4
    }
  ],
  "hero": {
    "cta": [
      {
        "primary": true,
        "text": "Explore Mythologies",
        "link": "#/mythologies",
        "icon": "🏛️"
      },
      {
        "icon": "📚",
        "text": "Browse All Content",
        "link": "#/browse",
        "primary": false
      }
    ],
    "subtitle": "Explore the myths, legends, and sacred traditions of humanity",
    "background": "cosmic",
    "title": "Eyes of Azrael"
  },
  "subtitle": "World Mythos Explorer",
  "panelCards": [],
  "layout": "grid",
  "icon": "👁️",
  "type": "landing",
  "title": "Eyes of Azrael",
  "description": "A comprehensive encyclopedia of world mythologies, magical systems, sacred herbalism, and spiritual traditions spanning 6000+ years of human history",
  "id": "home",
  "metadata": {
    "featured": true,
    "status": "active",
    "author": "system",
    "version": "1.0",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "sections": [
    {
      "displayCount": 12,
      "type": "panel-cards",
      "collection": "mythologies",
      "icon": "🏛️",
      "featured": true,
      "link": "#/mythologies",
      "title": "World Mythologies",
      "sortBy": "order",
      "description": "Explore gods, heroes, and legends from cultures around the world",
      "id": "mythologies"
    },
    {
      "featured": true,
      "id": "places",
      "displayCount": 6,
      "collection": "places",
      "icon": "🗺️",
      "title": "Sacred Places",
      "sortBy": "importance",
      "description": "Discover mythical locations and sacred sites",
      "link": "#/places",
      "type": "panel-cards"
    },
    {
      "link": "#/items",
      "featured": true,
      "collection": "items",
      "title": "Legendary Items",
      "type": "panel-cards",
      "icon": "⚔️",
      "description": "Artifacts of power from myth and legend",
      "id": "items",
      "sortBy": "importance",
      "displayCount": 6
    },
    {
      "link": "#/archetypes",
      "sortBy": "name",
      "icon": "🎭",
      "featured": true,
      "description": "Universal patterns across world mythologies",
      "displayCount": 6,
      "type": "panel-cards",
      "collection": "archetypes",
      "title": "Mythological Archetypes",
      "id": "archetypes"
    },
    {
      "displayCount": 4,
      "title": "Theories & Analysis",
      "id": "theories",
      "featured": false,
      "collection": "theories",
      "icon": "🧠",
      "sortBy": "created",
      "type": "panel-cards",
      "link": "#/theories",
      "description": "Scholarly interpretations and comparative mythology"
    },
    {
      "icon": "📝",
      "description": "User-submitted content and research",
      "title": "Community Contributions",
      "id": "submissions",
      "sortBy": "created",
      "type": "panel-cards",
      "link": "#/submissions",
      "collection": "submissions",
      "featured": false,
      "displayCount": 4
    }
  ],
  "hero": {
    "cta": [
      {
        "primary": true,
        "text": "Explore Mythologies",
        "link": "#/mythologies",
        "icon": "🏛️"
      },
      {
        "icon": "📚",
        "text": "Browse All Content",
        "link": "#/browse",
        "primary": false
      }
    ],
    "subtitle": "Explore the myths, legends, and sacred traditions of humanity",
    "background": "cosmic",
    "title": "Eyes of Azrael"
  },
  "subtitle": "World Mythos Explorer",
  "panelCards": [],
  "layout": "grid",
  "icon": "👁️",
  "type": "landing",
  "title": "Eyes of Azrael",
  "description": "A comprehensive encyclopedia of world mythologies, magical systems, sacred herbalism, and spiritual traditions spanning 6000+ years of human history",
  "id": "home",
  "metadata": {
    "featured": true,
    "status": "active",
    "author": "system",
    "version": "1.0",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "Eyes of Azrael",
  "created_at": "2025-12-28T12:45:39.029Z",
  "mythology": "global"
}
```

---

### pages/items

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "description": "Weapons, artifacts, and magical objects from myth and legend",
  "sections": [
    {
      "collection": "items",
      "id": "all-items",
      "title": "All Items",
      "sortBy": "importance",
      "type": "panel-cards"
    }
  ],
  "title": "Legendary Items",
  "layout": "grid",
  "type": "category",
  "id": "items",
  "icon": "⚔️",
  "subtitle": "Artifacts of power and significance",
  "metadata": {
    "status": "active",
    "author": "system",
    "version": "1.0",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "description": "Weapons, artifacts, and magical objects from myth and legend",
  "sections": [
    {
      "collection": "items",
      "id": "all-items",
      "title": "All Items",
      "sortBy": "importance",
      "type": "panel-cards"
    }
  ],
  "title": "Legendary Items",
  "layout": "grid",
  "type": "category",
  "id": "items",
  "icon": "⚔️",
  "subtitle": "Artifacts of power and significance",
  "metadata": {
    "status": "active",
    "author": "system",
    "version": "1.0",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "Legendary Items",
  "created_at": "2025-12-28T12:45:39.029Z",
  "mythology": "global"
}
```

---

### pages/mythologies

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "title": "World Mythologies",
  "description": "Browse mythological traditions from around the world, each with their pantheons, heroes, creatures, and sacred texts",
  "id": "mythologies",
  "type": "category",
  "hero": {
    "background": "mythology-mosaic",
    "subtitle": "Gods, heroes, and legends from every culture",
    "title": "World Mythologies"
  },
  "icon": "🏛️",
  "layout": "grid",
  "subtitle": "Explore the sacred traditions of humanity",
  "sections": [
    {
      "displayCount": 0,
      "sortBy": "order",
      "type": "panel-cards",
      "id": "all-mythologies",
      "filters": {
        "status": "active"
      },
      "collection": "mythologies",
      "description": "Browse all mythological traditions",
      "title": "All Traditions"
    }
  ],
  "metadata": {
    "version": "1.0",
    "author": "system",
    "status": "active",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "title": "World Mythologies",
  "description": "Browse mythological traditions from around the world, each with their pantheons, heroes, creatures, and sacred texts",
  "id": "mythologies",
  "type": "category",
  "hero": {
    "background": "mythology-mosaic",
    "subtitle": "Gods, heroes, and legends from every culture",
    "title": "World Mythologies"
  },
  "icon": "🏛️",
  "layout": "grid",
  "subtitle": "Explore the sacred traditions of humanity",
  "sections": [
    {
      "displayCount": 0,
      "sortBy": "order",
      "type": "panel-cards",
      "id": "all-mythologies",
      "filters": {
        "status": "active"
      },
      "collection": "mythologies",
      "description": "Browse all mythological traditions",
      "title": "All Traditions"
    }
  ],
  "metadata": {
    "version": "1.0",
    "author": "system",
    "status": "active",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "World Mythologies",
  "created_at": "2025-12-28T12:45:39.029Z",
  "mythology": "global"
}
```

---

### pages/places

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "sections": [
    {
      "collection": "places",
      "id": "all-places",
      "sortBy": "importance",
      "title": "All Places",
      "type": "panel-cards"
    }
  ],
  "icon": "🗺️",
  "id": "places",
  "layout": "grid",
  "type": "category",
  "subtitle": "Mythical locations and sacred sites",
  "title": "Sacred Places",
  "description": "Explore sacred mountains, mystical realms, and legendary locations from world mythology",
  "metadata": {
    "status": "active",
    "version": "1.0",
    "author": "system",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "sections": [
    {
      "collection": "places",
      "id": "all-places",
      "sortBy": "importance",
      "title": "All Places",
      "type": "panel-cards"
    }
  ],
  "icon": "🗺️",
  "id": "places",
  "layout": "grid",
  "type": "category",
  "subtitle": "Mythical locations and sacred sites",
  "title": "Sacred Places",
  "description": "Explore sacred mountains, mystical realms, and legendary locations from world mythology",
  "metadata": {
    "status": "active",
    "version": "1.0",
    "author": "system",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "Sacred Places",
  "created_at": "2025-12-28T12:45:39.029Z",
  "mythology": "global"
}
```

---

### pages/submissions

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "id": "submissions",
  "type": "category",
  "layout": "list",
  "sections": [
    {
      "title": "Recent Submissions",
      "sortBy": "created",
      "collection": "submissions",
      "type": "panel-cards",
      "displayCount": 20,
      "id": "recent-submissions"
    }
  ],
  "description": "Contributions from the Eyes of Azrael community",
  "title": "Community Contributions",
  "icon": "📝",
  "subtitle": "User-submitted research and content",
  "metadata": {
    "status": "active",
    "version": "1.0",
    "author": "system",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "id": "submissions",
  "type": "category",
  "layout": "list",
  "sections": [
    {
      "title": "Recent Submissions",
      "sortBy": "created",
      "collection": "submissions",
      "type": "panel-cards",
      "displayCount": 20,
      "id": "recent-submissions"
    }
  ],
  "title": "Community Contributions",
  "icon": "📝",
  "subtitle": "User-submitted research and content",
  "metadata": {
    "status": "active",
    "version": "1.0",
    "author": "system",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "Community Contributions",
  "created_at": "2025-12-28T12:45:39.029Z",
  "description": "Contributions from the Eyes of Azrael community. Share your research, insights, and discoveries about world mythology, magical traditions, and spiritual practices.",
  "mythology": "global"
}
```

---

### pages/theories

**Fields Added:** name, mythology, created_at, createdBy

**Before:**
```json
{
  "title": "Theories & Analysis",
  "id": "theories",
  "type": "category",
  "icon": "🧠",
  "subtitle": "Scholarly interpretations of myth",
  "description": "Comparative mythology, academic theories, and interpretive frameworks",
  "sections": [
    {
      "title": "All Theories",
      "type": "panel-cards",
      "sortBy": "created",
      "collection": "theories",
      "id": "all-theories"
    }
  ],
  "layout": "list",
  "metadata": {
    "author": "system",
    "version": "1.0",
    "status": "active",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  }
}
```

**After:**
```json
{
  "title": "Theories & Analysis",
  "id": "theories",
  "type": "category",
  "icon": "🧠",
  "subtitle": "Scholarly interpretations of myth",
  "description": "Comparative mythology, academic theories, and interpretive frameworks",
  "sections": [
    {
      "title": "All Theories",
      "type": "panel-cards",
      "sortBy": "created",
      "collection": "theories",
      "id": "all-theories"
    }
  ],
  "layout": "list",
  "metadata": {
    "author": "system",
    "version": "1.0",
    "status": "active",
    "created": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    },
    "updated": {
      "_seconds": 1766715746,
      "_nanoseconds": 663000000
    }
  },
  "createdBy": "system",
  "name": "Theories & Analysis",
  "created_at": "2025-12-28T12:45:39.029Z",
  "mythology": "global"
}
```


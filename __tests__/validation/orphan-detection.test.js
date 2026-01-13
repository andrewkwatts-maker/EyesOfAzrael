/**
 * Orphan Detection Tests
 *
 * Tests for detecting orphaned assets (no inbound links):
 * - Asset with no inbound links detected
 * - Hub assets are not flagged
 * - Navigation assets are not flagged
 * - Root entries are properly identified
 */

describe('Orphan Detection', () => {
  // Orphan detection logic
  function detectOrphans(assets, options = {}) {
    const { excludeHubs = true, excludeNavigation = true } = options;

    const assetIds = new Set(assets.map(a => a.id));
    const inboundLinks = new Map();

    // Initialize all assets with 0 inbound links
    for (const asset of assets) {
      inboundLinks.set(asset.id, 0);
    }

    // Count inbound links from relatedEntities
    for (const asset of assets) {
      const related = asset.relatedEntities || {};
      for (const [category, entities] of Object.entries(related)) {
        if (!Array.isArray(entities)) continue;

        for (const entity of entities) {
          const targetId = typeof entity === 'string' ? entity : entity?.id;
          if (targetId && assetIds.has(targetId)) {
            inboundLinks.set(targetId, inboundLinks.get(targetId) + 1);
          }
        }
      }

      // Also count family links
      const family = asset.family || {};
      for (const [relation, members] of Object.entries(family)) {
        const memberList = Array.isArray(members) ? members : [members];
        for (const member of memberList) {
          const targetId = typeof member === 'string' ? member : member?.id;
          if (targetId && assetIds.has(targetId)) {
            inboundLinks.set(targetId, inboundLinks.get(targetId) + 1);
          }
        }
      }
    }

    // Identify orphans
    const orphans = [];
    for (const asset of assets) {
      const count = inboundLinks.get(asset.id) || 0;

      if (count === 0) {
        // Check exclusions
        if (excludeHubs && asset.metadata?.isHub) continue;
        if (excludeNavigation && asset.type === 'navigation') continue;
        if (asset.metadata?.isRootHub) continue;

        orphans.push({
          id: asset.id,
          name: asset.name,
          category: asset.category || 'unknown',
          inboundLinks: 0
        });
      }
    }

    return orphans;
  }

  describe('Basic orphan detection', () => {
    test('detects asset with no inbound links', () => {
      const assets = [
        { id: 'zeus', relatedEntities: { children: [{ id: 'athena' }] } },
        { id: 'athena', relatedEntities: {} },
        { id: 'hades', relatedEntities: {} }  // No one links to hades
      ];

      const orphans = detectOrphans(assets);

      expect(orphans).toHaveLength(2);  // zeus and hades
      expect(orphans.map(o => o.id)).toContain('hades');
      expect(orphans.map(o => o.id)).toContain('zeus');
    });

    test('connected asset is not orphan', () => {
      const assets = [
        { id: 'zeus', relatedEntities: { children: [{ id: 'athena' }] } },
        { id: 'athena', relatedEntities: { parents: [{ id: 'zeus' }] } }
      ];

      const orphans = detectOrphans(assets);

      // Neither is orphan since they link to each other
      expect(orphans.map(o => o.id)).not.toContain('athena');
    });

    test('family links count as inbound links', () => {
      const assets = [
        { id: 'zeus', family: { children: [{ id: 'athena' }] } },
        { id: 'athena', family: { father: { id: 'zeus' } } }
      ];

      const orphans = detectOrphans(assets);

      // Both have inbound family links
      expect(orphans).toHaveLength(0);
    });
  });

  describe('Hub and navigation exclusions', () => {
    test('hub assets are not flagged as orphans', () => {
      const assets = [
        { id: 'zeus', relatedEntities: {} },
        {
          id: 'greek-hub',
          metadata: { isHub: true },
          relatedEntities: { deities: [{ id: 'zeus' }] }
        }
      ];

      const orphans = detectOrphans(assets, { excludeHubs: true });

      expect(orphans.map(o => o.id)).not.toContain('greek-hub');
    });

    test('navigation assets are not flagged', () => {
      const assets = [
        { id: 'zeus', relatedEntities: {} },
        {
          id: 'world-mythologies',
          type: 'navigation',
          relatedEntities: { mythologies: [{ id: 'greek-hub' }] }
        }
      ];

      const orphans = detectOrphans(assets, { excludeNavigation: true });

      expect(orphans.map(o => o.id)).not.toContain('world-mythologies');
    });

    test('root hub is never flagged', () => {
      const assets = [
        {
          id: 'master-navigation-index',
          metadata: { isRootHub: true },
          relatedEntities: {}
        }
      ];

      const orphans = detectOrphans(assets);

      expect(orphans).toHaveLength(0);
    });

    test('can include hubs when option disabled', () => {
      const assets = [
        {
          id: 'greek-hub',
          metadata: { isHub: true },
          relatedEntities: {}
        }
      ];

      const orphans = detectOrphans(assets, { excludeHubs: false });

      expect(orphans.map(o => o.id)).toContain('greek-hub');
    });
  });

  describe('String ID handling', () => {
    test('handles string IDs in relatedEntities', () => {
      const assets = [
        { id: 'zeus', relatedEntities: { children: ['athena'] } },
        { id: 'athena', relatedEntities: {} }
      ];

      const orphans = detectOrphans(assets);

      // athena has inbound from zeus
      expect(orphans.map(o => o.id)).not.toContain('athena');
    });

    test('handles string IDs in family', () => {
      const assets = [
        { id: 'zeus', family: { children: ['athena', 'apollo'] } },
        { id: 'athena', family: {} },
        { id: 'apollo', family: {} }
      ];

      const orphans = detectOrphans(assets);

      expect(orphans.map(o => o.id)).not.toContain('athena');
      expect(orphans.map(o => o.id)).not.toContain('apollo');
    });
  });
});

describe('Orphan Statistics', () => {
  function getOrphanStats(assets, orphans) {
    const byCategory = {};
    const byMythology = {};

    for (const orphan of orphans) {
      // Count by category
      byCategory[orphan.category] = (byCategory[orphan.category] || 0) + 1;
    }

    // Get mythology from asset
    for (const orphan of orphans) {
      const asset = assets.find(a => a.id === orphan.id);
      const mythology = asset?.mythology || 'unknown';
      byMythology[mythology] = (byMythology[mythology] || 0) + 1;
    }

    return {
      total: orphans.length,
      percentage: assets.length > 0 ? (orphans.length / assets.length * 100).toFixed(1) : '0.0',
      byCategory,
      byMythology
    };
  }

  test('calculates orphan statistics correctly', () => {
    const assets = [
      { id: 'zeus', mythology: 'greek', category: 'deities', relatedEntities: {} },
      { id: 'athena', mythology: 'greek', category: 'deities', relatedEntities: {} },
      { id: 'odin', mythology: 'norse', category: 'deities', relatedEntities: {} }
    ];

    const orphans = [
      { id: 'zeus', category: 'deities' },
      { id: 'athena', category: 'deities' },
      { id: 'odin', category: 'deities' }
    ];

    const stats = getOrphanStats(assets, orphans);

    expect(stats.total).toBe(3);
    expect(stats.percentage).toBe('100.0');
    expect(stats.byCategory.deities).toBe(3);
    expect(stats.byMythology.greek).toBe(2);
    expect(stats.byMythology.norse).toBe(1);
  });

  test('handles zero orphans', () => {
    const assets = [{ id: 'zeus', mythology: 'greek', category: 'deities' }];
    const orphans = [];

    const stats = getOrphanStats(assets, orphans);

    expect(stats.total).toBe(0);
    expect(stats.percentage).toBe('0.0');
  });
});

describe('Orphan Resolution', () => {
  function suggestHubForOrphan(orphan, existingHubs) {
    const { category, mythology } = orphan;

    // Try mythology-specific hub first
    const mythologyHub = `mythology-hub-${mythology}`;
    if (existingHubs.includes(mythologyHub)) {
      return mythologyHub;
    }

    // Try category hub
    const categoryHub = `${category}-collection`;
    if (existingHubs.includes(categoryHub)) {
      return categoryHub;
    }

    // Fall back to catch-all
    return 'miscellaneous-hub';
  }

  test('suggests mythology hub when available', () => {
    const orphan = { id: 'zeus', category: 'deities', mythology: 'greek' };
    const hubs = ['mythology-hub-greek', 'mythology-hub-norse'];

    const suggestion = suggestHubForOrphan(orphan, hubs);
    expect(suggestion).toBe('mythology-hub-greek');
  });

  test('falls back to category hub', () => {
    const orphan = { id: 'zeus', category: 'deities', mythology: 'obscure' };
    const hubs = ['deities-collection', 'creatures-collection'];

    const suggestion = suggestHubForOrphan(orphan, hubs);
    expect(suggestion).toBe('deities-collection');
  });

  test('falls back to miscellaneous hub', () => {
    const orphan = { id: 'unknown', category: 'misc', mythology: 'unknown' };
    const hubs = ['mythology-hub-greek'];

    const suggestion = suggestHubForOrphan(orphan, hubs);
    expect(suggestion).toBe('miscellaneous-hub');
  });
});

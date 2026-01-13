/**
 * Cross-Link Validation Tests
 *
 * Tests for validating entity cross-references:
 * - Valid link passes
 * - Broken link detected
 * - Bidirectional check works
 * - Link resolution with prefixes
 */

describe('Cross-Link Validation', () => {
  // Mock asset database
  const assetDatabase = new Map([
    ['zeus', { id: 'zeus', name: 'Zeus', mythology: 'greek' }],
    ['greek_zeus', { id: 'greek_zeus', name: 'Zeus', mythology: 'greek' }],
    ['athena', { id: 'athena', name: 'Athena', mythology: 'greek' }],
    ['odin', { id: 'odin', name: 'Odin', mythology: 'norse' }],
    ['norse_odin', { id: 'norse_odin', name: 'Odin', mythology: 'norse' }],
    ['persian_asha', { id: 'persian_asha', name: 'Asha', mythology: 'persian' }]
  ]);

  // Validation function
  function validateLink(targetId, assetDatabase) {
    if (assetDatabase.has(targetId)) {
      return { valid: true, resolvedId: targetId };
    }

    // Check case-insensitive
    const lowerTarget = targetId.toLowerCase();
    for (const [id] of assetDatabase) {
      if (id.toLowerCase() === lowerTarget) {
        return { valid: true, resolvedId: id };
      }
    }

    return { valid: false, error: `Target entity '${targetId}' not found` };
  }

  // Link resolution with mythology prefix
  function resolveLink(targetId, sourceMythology, assetDatabase) {
    // Direct match
    if (assetDatabase.has(targetId)) {
      return { resolved: true, id: targetId };
    }

    // Try with mythology prefix
    if (sourceMythology) {
      const prefixedId = `${sourceMythology}_${targetId}`;
      if (assetDatabase.has(prefixedId)) {
        return { resolved: true, id: prefixedId, wasFixed: true };
      }
    }

    // Try without prefix
    const parts = targetId.split(/[_-]/);
    if (parts.length > 1) {
      const withoutPrefix = parts.slice(1).join('-');
      for (const [id] of assetDatabase) {
        if (id.endsWith(withoutPrefix) || id.endsWith(`_${withoutPrefix}`)) {
          return { resolved: true, id, wasFixed: true };
        }
      }
    }

    return { resolved: false };
  }

  describe('Link validation', () => {
    test('valid exact link passes', () => {
      const result = validateLink('zeus', assetDatabase);
      expect(result.valid).toBe(true);
      expect(result.resolvedId).toBe('zeus');
    });

    test('valid prefixed link passes', () => {
      const result = validateLink('greek_zeus', assetDatabase);
      expect(result.valid).toBe(true);
      expect(result.resolvedId).toBe('greek_zeus');
    });

    test('broken link detected', () => {
      const result = validateLink('poseidon', assetDatabase);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('poseidon');
    });

    test('case-insensitive match works', () => {
      const result = validateLink('ZEUS', assetDatabase);
      expect(result.valid).toBe(true);
      expect(result.resolvedId).toBe('zeus');
    });
  });

  describe('Link resolution', () => {
    test('resolves direct match', () => {
      const result = resolveLink('zeus', 'greek', assetDatabase);
      expect(result.resolved).toBe(true);
      expect(result.id).toBe('zeus');
      expect(result.wasFixed).toBeUndefined();
    });

    test('resolves with mythology prefix', () => {
      const result = resolveLink('asha', 'persian', assetDatabase);
      expect(result.resolved).toBe(true);
      expect(result.id).toBe('persian_asha');
      expect(result.wasFixed).toBe(true);
    });

    test('fails for non-existent entity', () => {
      const result = resolveLink('nonexistent', 'greek', assetDatabase);
      expect(result.resolved).toBe(false);
    });

    test('handles underscore in target ID', () => {
      const result = resolveLink('norse_odin', null, assetDatabase);
      expect(result.resolved).toBe(true);
      expect(result.id).toBe('norse_odin');
    });
  });

  describe('Bidirectional link checking', () => {
    // Mock assets with relationships
    const assetsWithLinks = new Map([
      ['zeus', {
        id: 'zeus',
        relatedEntities: {
          children: [{ id: 'athena' }]
        }
      }],
      ['athena', {
        id: 'athena',
        relatedEntities: {
          parents: [{ id: 'zeus' }]
        }
      }],
      ['odin', {
        id: 'odin',
        relatedEntities: {
          children: [{ id: 'thor' }]  // Thor doesn't have back-link
        }
      }]
    ]);

    function checkBidirectional(sourceId, targetId, relationship, assets) {
      const source = assets.get(sourceId);
      const target = assets.get(targetId);

      if (!source || !target) {
        return { bidirectional: false, reason: 'Missing asset' };
      }

      // Define reverse relationships
      const reverseMap = {
        children: 'parents',
        parents: 'children',
        siblings: 'siblings',
        consorts: 'consorts',
        allies: 'allies',
        enemies: 'enemies'
      };

      const reverseRelationship = reverseMap[relationship];
      if (!reverseRelationship) {
        return { bidirectional: null, reason: 'No reverse relationship defined' };
      }

      const targetRelated = target.relatedEntities?.[reverseRelationship] || [];
      const hasBackLink = targetRelated.some(r =>
        r.id === sourceId || r === sourceId
      );

      return { bidirectional: hasBackLink };
    }

    test('detects bidirectional link', () => {
      const result = checkBidirectional('zeus', 'athena', 'children', assetsWithLinks);
      expect(result.bidirectional).toBe(true);
    });

    test('detects missing back-link', () => {
      const result = checkBidirectional('odin', 'thor', 'children', assetsWithLinks);
      expect(result.bidirectional).toBe(false);
    });

    test('handles missing assets', () => {
      const result = checkBidirectional('zeus', 'nonexistent', 'children', assetsWithLinks);
      expect(result.bidirectional).toBe(false);
      expect(result.reason).toBe('Missing asset');
    });
  });
});

describe('Cross-Link Statistics', () => {
  function calculateLinkStats(assets) {
    let totalLinks = 0;
    let brokenLinks = 0;
    let bidirectionalLinks = 0;
    let orphanedAssets = 0;

    const assetIds = new Set(assets.map(a => a.id));
    const inboundLinks = new Map();

    // Initialize inbound link counts
    for (const asset of assets) {
      inboundLinks.set(asset.id, 0);
    }

    // Count links
    for (const asset of assets) {
      const related = asset.relatedEntities || {};
      for (const [category, entities] of Object.entries(related)) {
        if (!Array.isArray(entities)) continue;

        for (const entity of entities) {
          const targetId = typeof entity === 'string' ? entity : entity.id;
          totalLinks++;

          if (!assetIds.has(targetId)) {
            brokenLinks++;
          } else {
            // Count inbound link
            inboundLinks.set(targetId, (inboundLinks.get(targetId) || 0) + 1);
          }
        }
      }
    }

    // Count orphans (no inbound links)
    for (const [id, count] of inboundLinks) {
      if (count === 0) {
        orphanedAssets++;
      }
    }

    return {
      totalLinks,
      brokenLinks,
      validLinks: totalLinks - brokenLinks,
      orphanedAssets,
      linkIntegrity: totalLinks > 0 ? ((totalLinks - brokenLinks) / totalLinks * 100).toFixed(1) : '100.0'
    };
  }

  test('calculates correct statistics', () => {
    const assets = [
      {
        id: 'zeus',
        relatedEntities: {
          children: [{ id: 'athena' }, { id: 'apollo' }]
        }
      },
      {
        id: 'athena',
        relatedEntities: {
          parents: [{ id: 'zeus' }]
        }
      },
      {
        id: 'hades',
        relatedEntities: {}
      }
    ];

    const stats = calculateLinkStats(assets);

    expect(stats.totalLinks).toBe(3);
    expect(stats.brokenLinks).toBe(1);  // apollo doesn't exist
    expect(stats.validLinks).toBe(2);
    expect(stats.orphanedAssets).toBe(1);  // hades has no inbound links
  });

  test('handles empty assets', () => {
    const stats = calculateLinkStats([]);
    expect(stats.totalLinks).toBe(0);
    expect(stats.brokenLinks).toBe(0);
    expect(stats.linkIntegrity).toBe('100.0');
  });

  test('handles string IDs in links', () => {
    const assets = [
      {
        id: 'zeus',
        relatedEntities: {
          children: ['athena']  // String instead of object
        }
      },
      { id: 'athena', relatedEntities: {} }
    ];

    const stats = calculateLinkStats(assets);
    expect(stats.validLinks).toBe(1);
  });
});

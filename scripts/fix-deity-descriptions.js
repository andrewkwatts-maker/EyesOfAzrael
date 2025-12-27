const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eyesofazrael.firebaseio.com"
});

const db = admin.firestore();

// Read deity issues
const deityIssues = JSON.parse(fs.readFileSync('deity_issues.json', 'utf8'));

// Track stats
const stats = {
  total: deityIssues.length,
  fixed: 0,
  skipped: 0,
  errors: 0,
  fromHTML: 0,
  generated: 0
};

const fixes = [];

// Helper: Extract description from HTML file
function extractDescriptionFromHTML(htmlPath) {
  if (!fs.existsSync(htmlPath)) {
    return null;
  }

  const content = fs.readFileSync(htmlPath, 'utf8');

  // Try to find description in various formats
  // Look for meta description
  let match = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Look for first paragraph after h1 or h2
  match = content.match(/<h[12][^>]*>.*?<\/h[12]>\s*<p[^>]*>([^<]+)<\/p>/is);
  if (match && match[1]) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length >= 50 && text.length <= 500) {
      return text.substring(0, 300);
    }
  }

  // Look for any paragraph with substantial content
  const paragraphs = content.match(/<p[^>]*>([^<]+)<\/p>/gi);
  if (paragraphs) {
    for (let p of paragraphs) {
      const text = p.replace(/<[^>]+>/g, '').trim();
      if (text.length >= 100 && text.length <= 500) {
        return text.substring(0, 300);
      }
    }
  }

  return null;
}

// Helper: Extract domains from deity data
function extractDomainsFromData(deity) {
  const domains = new Set();

  // Check attributes.domains
  if (deity.data.attributes && deity.data.attributes.domains) {
    const domainStr = deity.data.attributes.domains;
    const parts = domainStr.split(/,|and|\(|\)/);
    parts.forEach(part => {
      const cleaned = part.trim().replace(/\s+/g, '-').toLowerCase();
      if (cleaned && cleaned.length > 2 && cleaned.length < 20) {
        domains.add(cleaned);
      }
    });
  }

  // Check subtitle for domains
  if (deity.data.subtitle) {
    const subtitle = deity.data.subtitle.toLowerCase();

    // Common domain patterns
    const domainPatterns = [
      'god of', 'goddess of', 'deity of', 'spirit of',
      'lord of', 'lady of', 'master of', 'mistress of'
    ];

    for (let pattern of domainPatterns) {
      if (subtitle.includes(pattern)) {
        const afterPattern = subtitle.split(pattern)[1];
        if (afterPattern) {
          const parts = afterPattern.split(/,|and/);
          parts.forEach(part => {
            const cleaned = part.trim().replace(/\s+/g, '-').toLowerCase();
            if (cleaned && cleaned.length > 2 && cleaned.length < 20) {
              domains.add(cleaned);
            }
          });
        }
      }
    }
  }

  // Check searchTerms for domain-like words
  if (deity.data.searchTerms) {
    const domainWords = ['war', 'love', 'death', 'wisdom', 'healing', 'fertility',
                         'sky', 'sun', 'moon', 'sea', 'earth', 'fire', 'water',
                         'thunder', 'lightning', 'storm', 'wind', 'chaos', 'order',
                         'creation', 'destruction', 'magic', 'prophecy', 'justice'];

    deity.data.searchTerms.forEach(term => {
      const lower = term.toLowerCase();
      domainWords.forEach(word => {
        if (lower.includes(word)) {
          domains.add(word);
        }
      });
    });
  }

  return Array.from(domains).slice(0, 5); // Max 5 domains
}

// Helper: Generate description from deity data
function generateDescription(deity) {
  const name = deity.data.name || deity.id;
  const subtitle = deity.data.subtitle || '';
  const mythology = deity.data.mythology || 'unknown';

  // Use subtitle as base if available
  if (subtitle) {
    return `${name} is ${subtitle.toLowerCase()} in ${mythology} mythology.`;
  }

  // Try to construct from attributes
  if (deity.data.attributes && deity.data.attributes.titles) {
    const titles = deity.data.attributes.titles.split(',')[0].trim();
    return `${name}, known as ${titles}, is a significant deity in ${mythology} mythology.`;
  }

  // Fallback
  return `${name} is a deity in ${mythology} mythology.`;
}

// Helper: Generate default domains if none found
function generateDefaultDomains(deity) {
  const mythology = deity.data.mythology || '';
  const name = (deity.data.name || deity.id).toLowerCase();

  // Try to infer from name patterns
  const domains = [];

  if (name.includes('sun') || name.includes('ra') || name.includes('apollo')) {
    domains.push('sun', 'light');
  } else if (name.includes('moon') || name.includes('luna')) {
    domains.push('moon', 'night');
  } else if (name.includes('war') || name.includes('ares') || name.includes('mars')) {
    domains.push('war', 'battle');
  } else if (name.includes('love') || name.includes('aphrodite') || name.includes('venus')) {
    domains.push('love', 'beauty');
  } else if (name.includes('death') || name.includes('hades') || name.includes('hel')) {
    domains.push('death', 'underworld');
  } else if (name.includes('wisdom') || name.includes('athena')) {
    domains.push('wisdom', 'knowledge');
  } else if (name.includes('sea') || name.includes('poseidon') || name.includes('neptune')) {
    domains.push('sea', 'water');
  } else if (name.includes('sky') || name.includes('zeus') || name.includes('jupiter')) {
    domains.push('sky', 'thunder');
  } else {
    // Generic default
    domains.push('divine-power');
  }

  return domains;
}

// Process each deity
async function processDeity(deity, dryRun = true) {
  const { id, data, issues } = deity;

  const needsDescription = issues.some(i => i.field === 'description');
  const needsDomains = issues.some(i => i.field === 'domains');

  // Skip if already has both
  if (!needsDescription && !needsDomains) {
    stats.skipped++;
    return;
  }

  const updates = {};
  let source = 'generated';

  // Try to get data from HTML file
  if (data.mythology && data.extracted_from) {
    const htmlPath = path.join('h:', 'Github', 'EyesOfAzrael', 'mythos',
                               data.mythology, 'deities', data.extracted_from);

    if (needsDescription) {
      const extractedDesc = extractDescriptionFromHTML(htmlPath);
      if (extractedDesc) {
        updates.description = extractedDesc;
        source = 'html';
        stats.fromHTML++;
      } else {
        updates.description = generateDescription(deity);
        stats.generated++;
      }
    }
  } else if (needsDescription) {
    updates.description = generateDescription(deity);
    stats.generated++;
  }

  // Extract or generate domains
  if (needsDomains) {
    let domains = extractDomainsFromData(deity);
    if (domains.length === 0) {
      domains = generateDefaultDomains(deity);
    }
    updates.domains = domains;
  }

  // Ensure description length is appropriate
  if (updates.description) {
    if (updates.description.length < 50) {
      updates.description = generateDescription(deity);
    }
    if (updates.description.length > 300) {
      updates.description = updates.description.substring(0, 297) + '...';
    }
  }

  fixes.push({
    id,
    name: data.name || id,
    mythology: data.mythology || 'unknown',
    updates,
    source
  });

  if (!dryRun) {
    try {
      await db.collection('deities').doc(id).update(updates);
      stats.fixed++;
      console.log(`✓ Fixed ${id} (${source})`);
    } catch (error) {
      stats.errors++;
      console.error(`✗ Error fixing ${id}:`, error.message);
    }
  } else {
    console.log(`[DRY RUN] Would update ${id}:`, updates);
  }
}

// Main execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DEITY DESCRIPTION & DOMAIN FIX SCRIPT`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`Total deities to process: ${stats.total}\n`);

  for (const deity of deityIssues) {
    await processDeity(deity, dryRun);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total: ${stats.total}`);
  console.log(`Fixed: ${stats.fixed}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`From HTML: ${stats.fromHTML}`);
  console.log(`Generated: ${stats.generated}`);
  console.log(`${'='.repeat(60)}\n`);

  // Save fixes report
  const report = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'live',
    stats,
    fixes
  };

  fs.writeFileSync('deity-fixes-report.json', JSON.stringify(report, null, 2));
  console.log('Report saved to deity-fixes-report.json\n');

  // Create markdown report
  const mdReport = generateMarkdownReport(report);
  fs.writeFileSync('AGENT_1_DEITY_FIX_REPORT.md', mdReport);
  console.log('Markdown report saved to AGENT_1_DEITY_FIX_REPORT.md\n');

  await admin.app().delete();
}

function generateMarkdownReport(report) {
  const { stats, fixes, mode, timestamp } = report;

  let md = `# AGENT 1: DEITY DESCRIPTION & DOMAIN FIX REPORT

**Generated:** ${timestamp}
**Mode:** ${mode.toUpperCase()}

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Deities Processed | ${stats.total} |
| Successfully Fixed | ${stats.fixed} |
| Skipped | ${stats.skipped} |
| Errors | ${stats.errors} |
| Extracted from HTML | ${stats.fromHTML} |
| AI Generated | ${stats.generated} |

## Success Rate

- **Fix Rate:** ${((stats.fixed / stats.total) * 100).toFixed(1)}%
- **HTML Extraction Rate:** ${((stats.fromHTML / stats.total) * 100).toFixed(1)}%
- **Generation Rate:** ${((stats.generated / stats.total) * 100).toFixed(1)}%

## Fixes by Mythology

`;

  // Group by mythology
  const byMythology = {};
  fixes.forEach(fix => {
    if (!byMythology[fix.mythology]) {
      byMythology[fix.mythology] = [];
    }
    byMythology[fix.mythology].push(fix);
  });

  Object.keys(byMythology).sort().forEach(myth => {
    const deities = byMythology[myth];
    md += `\n### ${myth.toUpperCase()} (${deities.length} deities)\n\n`;

    deities.forEach(fix => {
      md += `#### ${fix.name} (\`${fix.id}\`)\n`;
      md += `**Source:** ${fix.source}\n\n`;

      if (fix.updates.description) {
        md += `**Description:**\n> ${fix.updates.description}\n\n`;
      }

      if (fix.updates.domains) {
        md += `**Domains:** ${fix.updates.domains.join(', ')}\n\n`;
      }

      md += '---\n\n';
    });
  });

  md += `## Next Steps

${mode === 'dry-run' ? `
1. Review the fixes above
2. If satisfied, run: \`node scripts/fix-deity-descriptions.js\` (without --dry-run)
3. Verify changes in Firebase console
` : `
1. ✅ Changes have been applied to Firebase
2. Verify in Firebase console
3. Run validation script to confirm all issues resolved
`}

## Technical Details

- **Script:** \`scripts/fix-deity-descriptions.js\`
- **Input:** \`deity_issues.json\`
- **Firebase Collection:** \`deities\`
- **Timestamp:** ${timestamp}
`;

  return md;
}

// Run the script
main().catch(console.error);

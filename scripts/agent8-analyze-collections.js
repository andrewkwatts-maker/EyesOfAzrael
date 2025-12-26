/**
 * AGENT 8: Comprehensive Collection Analysis
 * Analyzes all Firebase collections to identify incomplete data
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to analyze
const COLLECTIONS = [
  'texts',
  'herbs',
  'concepts',
  'events',
  'items',
  'places',
  'theories',
  'myths',
  'symbols',
  'rituals',
  'magic_systems',
  'entities' // For angels, beings, etc.
];

// Template requirements by collection
const TEMPLATE_REQUIREMENTS = {
  texts: {
    required: ['id', 'name', 'mythology', 'type', 'content'],
    recommended: ['summary', 'themes', 'historicalContext', 'influence', 'primarySources', 'relatedTexts', 'keyPassages']
  },
  herbs: {
    required: ['id', 'name', 'mythology', 'latinName'],
    recommended: ['uses', 'symbolism', 'rituals', 'preparation', 'deities', 'relatedHerbs', 'primarySources']
  },
  concepts: {
    required: ['id', 'name', 'mythology', 'description'],
    recommended: ['philosophicalMeaning', 'theologicalSignificance', 'practicalApplications', 'relatedConcepts', 'primarySources']
  },
  events: {
    required: ['id', 'name', 'mythology', 'description'],
    recommended: ['participants', 'sequence', 'significance', 'relatedEvents', 'primarySources']
  },
  items: {
    required: ['id', 'name', 'mythology', 'type'],
    recommended: ['description', 'powers', 'owner', 'origin', 'relatedItems', 'primarySources']
  },
  places: {
    required: ['id', 'name', 'mythology', 'type'],
    recommended: ['description', 'significance', 'inhabitants', 'relatedPlaces', 'primarySources']
  },
  theories: {
    required: ['id', 'name', 'type', 'description'],
    recommended: ['evidence', 'counterEvidence', 'scholars', 'relatedTheories', 'primarySources']
  },
  myths: {
    required: ['id', 'name', 'mythology', 'summary'],
    recommended: ['narrative', 'themes', 'characters', 'symbolism', 'relatedMyths', 'primarySources']
  },
  symbols: {
    required: ['id', 'name', 'mythology', 'description'],
    recommended: ['meaning', 'usage', 'variations', 'relatedSymbols', 'primarySources']
  },
  rituals: {
    required: ['id', 'name', 'mythology', 'description'],
    recommended: ['purpose', 'procedure', 'timing', 'participants', 'relatedRituals', 'primarySources']
  },
  magic_systems: {
    required: ['id', 'name', 'mythology', 'description'],
    recommended: ['practitioners', 'methods', 'purposes', 'relatedSystems', 'primarySources']
  },
  entities: {
    required: ['id', 'name', 'type'],
    recommended: ['mythology', 'description', 'role', 'attributes', 'relatedEntities', 'primarySources']
  }
};

const analysis = {
  timestamp: new Date().toISOString(),
  collections: {},
  issues: [],
  recommendations: [],
  summary: {
    totalCollections: 0,
    totalDocuments: 0,
    completeDocuments: 0,
    incompleteDocuments: 0,
    missingCrossLinks: 0
  }
};

/**
 * Analyze a single document for completeness
 */
function analyzeDocument(collectionName, doc, requirements) {
  const data = doc.data();
  const issues = [];
  let completeness = 0;
  const totalFields = requirements.required.length + requirements.recommended.length;

  // Check required fields
  const missingRequired = [];
  for (const field of requirements.required) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missingRequired.push(field);
    } else {
      completeness++;
    }
  }

  // Check recommended fields
  const missingRecommended = [];
  for (const field of requirements.recommended) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missingRecommended.push(field);
    } else {
      completeness++;
    }
  }

  const completenessPercent = Math.round((completeness / totalFields) * 100);

  if (missingRequired.length > 0) {
    issues.push(`Missing required fields: ${missingRequired.join(', ')}`);
  }

  if (missingRecommended.length > 0) {
    issues.push(`Missing recommended fields: ${missingRecommended.join(', ')}`);
  }

  // Check for cross-references
  const crossRefFields = ['relatedTexts', 'relatedHerbs', 'relatedConcepts', 'relatedEvents',
                          'relatedItems', 'relatedPlaces', 'relatedTheories', 'relatedMyths',
                          'relatedSymbols', 'relatedRituals', 'relatedSystems', 'relatedEntities',
                          'deities', 'heroes', 'creatures', 'participants'];

  const hasCrossRefs = crossRefFields.some(field =>
    data[field] && Array.isArray(data[field]) && data[field].length > 0
  );

  if (!hasCrossRefs) {
    issues.push('No cross-references found');
  }

  return {
    id: doc.id,
    completeness: completenessPercent,
    issues,
    data: {
      name: data.name,
      mythology: data.mythology,
      type: data.type,
      hasDescription: !!data.description,
      hasPrimarySources: !!(data.primarySources && data.primarySources.length > 0),
      hasCrossRefs
    }
  };
}

/**
 * Analyze a collection
 */
async function analyzeCollection(collectionName) {
  console.log(`\nAnalyzing ${collectionName} collection...`);

  const requirements = TEMPLATE_REQUIREMENTS[collectionName];
  if (!requirements) {
    console.log(`  ⚠️ No template requirements defined for ${collectionName}`);
    return null;
  }

  const snapshot = await db.collection(collectionName).get();
  const docs = snapshot.docs;

  console.log(`  Found ${docs.length} documents`);

  const collectionAnalysis = {
    name: collectionName,
    count: docs.length,
    documents: [],
    stats: {
      complete: 0,
      incomplete: 0,
      avgCompleteness: 0,
      missingCrossLinks: 0
    }
  };

  for (const doc of docs) {
    const docAnalysis = analyzeDocument(collectionName, doc, requirements);
    collectionAnalysis.documents.push(docAnalysis);

    if (docAnalysis.completeness >= 80) {
      collectionAnalysis.stats.complete++;
    } else {
      collectionAnalysis.stats.incomplete++;
    }

    if (!docAnalysis.data.hasCrossRefs) {
      collectionAnalysis.stats.missingCrossLinks++;
    }
  }

  // Calculate average completeness
  if (docs.length > 0) {
    const totalCompleteness = collectionAnalysis.documents.reduce(
      (sum, doc) => sum + doc.completeness, 0
    );
    collectionAnalysis.stats.avgCompleteness = Math.round(totalCompleteness / docs.length);
  }

  console.log(`  ✓ Complete (≥80%): ${collectionAnalysis.stats.complete}`);
  console.log(`  ⚠️ Incomplete (<80%): ${collectionAnalysis.stats.incomplete}`);
  console.log(`  📊 Average completeness: ${collectionAnalysis.stats.avgCompleteness}%`);
  console.log(`  🔗 Missing cross-links: ${collectionAnalysis.stats.missingCrossLinks}`);

  return collectionAnalysis;
}

/**
 * Main analysis function
 */
async function analyzeAllCollections() {
  console.log('====================================');
  console.log('AGENT 8: COLLECTION ANALYSIS');
  console.log('====================================');

  for (const collectionName of COLLECTIONS) {
    try {
      const result = await analyzeCollection(collectionName);
      if (result) {
        analysis.collections[collectionName] = result;
        analysis.summary.totalCollections++;
        analysis.summary.totalDocuments += result.count;
        analysis.summary.completeDocuments += result.stats.complete;
        analysis.summary.incompleteDocuments += result.stats.incomplete;
        analysis.summary.missingCrossLinks += result.stats.missingCrossLinks;
      }
    } catch (error) {
      console.error(`  ❌ Error analyzing ${collectionName}:`, error.message);
      analysis.issues.push({
        collection: collectionName,
        error: error.message
      });
    }
  }

  // Generate recommendations
  generateRecommendations();

  // Save analysis
  const outputPath = path.join(__dirname, '..', 'AGENT8_COLLECTION_ANALYSIS.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log('\n====================================');
  console.log('ANALYSIS COMPLETE');
  console.log('====================================');
  console.log(`📊 Total Collections: ${analysis.summary.totalCollections}`);
  console.log(`📄 Total Documents: ${analysis.summary.totalDocuments}`);
  console.log(`✅ Complete: ${analysis.summary.completeDocuments}`);
  console.log(`⚠️ Incomplete: ${analysis.summary.incompleteDocuments}`);
  console.log(`🔗 Missing Cross-Links: ${analysis.summary.missingCrossLinks}`);
  console.log(`\n📁 Report saved to: ${outputPath}`);

  return analysis;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations() {
  for (const [collectionName, data] of Object.entries(analysis.collections)) {
    if (data.stats.incomplete > 0) {
      analysis.recommendations.push({
        collection: collectionName,
        priority: data.stats.avgCompleteness < 50 ? 'HIGH' : 'MEDIUM',
        action: `Fix ${data.stats.incomplete} incomplete documents (avg ${data.stats.avgCompleteness}% complete)`,
        documents: data.documents
          .filter(doc => doc.completeness < 80)
          .map(doc => ({ id: doc.id, completeness: doc.completeness, issues: doc.issues }))
      });
    }

    if (data.stats.missingCrossLinks > 0) {
      analysis.recommendations.push({
        collection: collectionName,
        priority: 'MEDIUM',
        action: `Add cross-references to ${data.stats.missingCrossLinks} documents`,
        documents: data.documents
          .filter(doc => !doc.data.hasCrossRefs)
          .map(doc => ({ id: doc.id, name: doc.data.name }))
      });
    }
  }

  // Sort recommendations by priority
  analysis.recommendations.sort((a, b) => {
    const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

// Run analysis
analyzeAllCollections()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });

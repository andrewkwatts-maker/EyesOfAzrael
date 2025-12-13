const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../FIREBASE/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

async function analyzeFirestoreStructure() {
  console.log('Starting Firebase Firestore structure analysis...\n');

  const analysis = {
    collections: {},
    documentsMissingMythology: [],
    schemaInconsistencies: [],
    assetsByMythology: {},
    summary: {
      totalCollections: 0,
      totalDocuments: 0,
      documentsMissingMythologyCount: 0
    }
  };

  try {
    // Get all collections
    const collections = await db.listCollections();
    analysis.summary.totalCollections = collections.length;

    console.log(`Found ${collections.length} collections\n`);

    // Analyze each collection
    for (const collectionRef of collections) {
      const collectionName = collectionRef.id;
      console.log(`Analyzing collection: ${collectionName}`);

      analysis.collections[collectionName] = {
        name: collectionName,
        documentCount: 0,
        schemas: [],
        sampleDocuments: [],
        uniqueFields: new Set(),
        mythologies: new Set(),
        assetTypes: new Set()
      };

      // Get all documents in this collection
      const snapshot = await collectionRef.get();
      analysis.collections[collectionName].documentCount = snapshot.size;
      analysis.summary.totalDocuments += snapshot.size;

      console.log(`  Found ${snapshot.size} documents`);

      // Analyze each document
      snapshot.forEach((doc) => {
        const data = doc.data();
        const docId = doc.id;

        // Track all fields
        Object.keys(data).forEach(field => {
          analysis.collections[collectionName].uniqueFields.add(field);
        });

        // Check for mythology field
        if (!data.mythology && !data.mythologyId) {
          analysis.documentsMissingMythology.push({
            collection: collectionName,
            documentId: docId,
            fields: Object.keys(data)
          });
          analysis.summary.documentsMissingMythologyCount++;
        } else {
          const mythology = data.mythology || data.mythologyId;
          analysis.collections[collectionName].mythologies.add(mythology);

          // Track assets by mythology
          if (!analysis.assetsByMythology[mythology]) {
            analysis.assetsByMythology[mythology] = {};
          }
          if (!analysis.assetsByMythology[mythology][collectionName]) {
            analysis.assetsByMythology[mythology][collectionName] = [];
          }
          analysis.assetsByMythology[mythology][collectionName].push(docId);
        }

        // Track asset types
        if (data.type) {
          analysis.collections[collectionName].assetTypes.add(data.type);
        }

        // Store sample documents (first 5)
        if (analysis.collections[collectionName].sampleDocuments.length < 5) {
          analysis.collections[collectionName].sampleDocuments.push({
            id: docId,
            data: data
          });
        }

        // Detect schema variations
        const schema = {
          fields: Object.keys(data).sort(),
          fieldTypes: {}
        };

        Object.keys(data).forEach(field => {
          schema.fieldTypes[field] = typeof data[field];
          if (Array.isArray(data[field])) {
            schema.fieldTypes[field] = 'array';
          } else if (data[field] === null) {
            schema.fieldTypes[field] = 'null';
          } else if (typeof data[field] === 'object') {
            schema.fieldTypes[field] = 'object';
          }
        });

        // Check if this schema already exists
        const schemaExists = analysis.collections[collectionName].schemas.some(s =>
          JSON.stringify(s.fields) === JSON.stringify(schema.fields)
        );

        if (!schemaExists) {
          analysis.collections[collectionName].schemas.push(schema);
        }
      });

      // Convert Sets to Arrays for JSON serialization
      analysis.collections[collectionName].uniqueFields = Array.from(analysis.collections[collectionName].uniqueFields);
      analysis.collections[collectionName].mythologies = Array.from(analysis.collections[collectionName].mythologies);
      analysis.collections[collectionName].assetTypes = Array.from(analysis.collections[collectionName].assetTypes);

      // Detect schema inconsistencies
      if (analysis.collections[collectionName].schemas.length > 1) {
        analysis.schemaInconsistencies.push({
          collection: collectionName,
          schemaCount: analysis.collections[collectionName].schemas.length,
          schemas: analysis.collections[collectionName].schemas
        });
      }

      console.log(`  Unique fields: ${analysis.collections[collectionName].uniqueFields.join(', ')}`);
      console.log(`  Mythologies: ${analysis.collections[collectionName].mythologies.join(', ') || 'None'}`);
      console.log(`  Asset types: ${analysis.collections[collectionName].assetTypes.join(', ') || 'None'}`);
      console.log(`  Schema variations: ${analysis.collections[collectionName].schemas.length}\n`);
    }

    // Generate markdown report
    const report = generateMarkdownReport(analysis);

    // Write report to file
    const reportPath = path.join(__dirname, '../FIREBASE/STRUCTURE_ANALYSIS.md');
    fs.writeFileSync(reportPath, report);

    console.log(`\nAnalysis complete! Report saved to: ${reportPath}`);
    console.log(`\nSummary:`);
    console.log(`  Total Collections: ${analysis.summary.totalCollections}`);
    console.log(`  Total Documents: ${analysis.summary.totalDocuments}`);
    console.log(`  Documents Missing Mythology: ${analysis.summary.documentsMissingMythologyCount}`);
    console.log(`  Collections with Schema Inconsistencies: ${analysis.schemaInconsistencies.length}`);

  } catch (error) {
    console.error('Error analyzing Firestore structure:', error);
    throw error;
  }
}

function generateMarkdownReport(analysis) {
  let report = `# Firebase Firestore Structure Analysis\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `## Executive Summary\n\n`;
  report += `- **Total Collections:** ${analysis.summary.totalCollections}\n`;
  report += `- **Total Documents:** ${analysis.summary.totalDocuments}\n`;
  report += `- **Documents Missing Mythology Field:** ${analysis.summary.documentsMissingMythologyCount}\n`;
  report += `- **Collections with Schema Inconsistencies:** ${analysis.schemaInconsistencies.length}\n\n`;

  report += `---\n\n`;

  // Collection Inventory
  report += `## 1. Complete Collection Inventory\n\n`;
  Object.values(analysis.collections).forEach(collection => {
    report += `### Collection: \`${collection.name}\`\n\n`;
    report += `- **Document Count:** ${collection.documentCount}\n`;
    report += `- **Mythologies:** ${collection.mythologies.length > 0 ? collection.mythologies.join(', ') : 'None/Not Organized'}\n`;
    report += `- **Asset Types:** ${collection.assetTypes.length > 0 ? collection.assetTypes.join(', ') : 'Not Specified'}\n`;
    report += `- **Unique Fields:** ${collection.uniqueFields.join(', ')}\n`;
    report += `- **Schema Variations:** ${collection.schemas.length}\n\n`;
  });

  report += `---\n\n`;

  // Schema Details
  report += `## 2. Schema Analysis by Collection\n\n`;
  Object.values(analysis.collections).forEach(collection => {
    report += `### \`${collection.name}\` Schema\n\n`;

    collection.schemas.forEach((schema, index) => {
      report += `#### Schema Variation ${index + 1}\n\n`;
      report += `**Fields:**\n`;
      schema.fields.forEach(field => {
        report += `- \`${field}\` (${schema.fieldTypes[field]})\n`;
      });
      report += `\n`;
    });

    // Sample Documents
    if (collection.sampleDocuments.length > 0) {
      report += `**Sample Documents:**\n\n`;
      collection.sampleDocuments.forEach((doc, index) => {
        report += `<details>\n<summary>Document ${index + 1}: ${doc.id}</summary>\n\n`;
        report += `\`\`\`json\n${JSON.stringify(doc.data, null, 2)}\n\`\`\`\n\n`;
        report += `</details>\n\n`;
      });
    }

    report += `---\n\n`;
  });

  // Documents Missing Mythology
  report += `## 3. Documents Missing Mythology Organization\n\n`;
  if (analysis.documentsMissingMythology.length > 0) {
    report += `**Total:** ${analysis.documentsMissingMythology.length} documents\n\n`;

    // Group by collection
    const byCollection = {};
    analysis.documentsMissingMythology.forEach(doc => {
      if (!byCollection[doc.collection]) {
        byCollection[doc.collection] = [];
      }
      byCollection[doc.collection].push(doc);
    });

    Object.keys(byCollection).forEach(collectionName => {
      report += `### Collection: \`${collectionName}\`\n\n`;
      report += `${byCollection[collectionName].length} documents missing mythology field:\n\n`;
      byCollection[collectionName].forEach(doc => {
        report += `- **Document ID:** \`${doc.documentId}\`\n`;
        report += `  - Fields: ${doc.fields.join(', ')}\n`;
      });
      report += `\n`;
    });
  } else {
    report += `No documents missing mythology organization. All documents are properly organized!\n\n`;
  }

  report += `---\n\n`;

  // Schema Inconsistencies
  report += `## 4. Schema Inconsistencies\n\n`;
  if (analysis.schemaInconsistencies.length > 0) {
    report += `Found schema inconsistencies in ${analysis.schemaInconsistencies.length} collection(s):\n\n`;

    analysis.schemaInconsistencies.forEach(inconsistency => {
      report += `### Collection: \`${inconsistency.collection}\`\n\n`;
      report += `**${inconsistency.schemaCount}** different schema variations found:\n\n`;

      inconsistency.schemas.forEach((schema, index) => {
        report += `#### Variation ${index + 1}\n`;
        report += `Fields: ${schema.fields.join(', ')}\n\n`;
      });
    });
  } else {
    report += `No schema inconsistencies found. All documents within each collection share the same schema!\n\n`;
  }

  report += `---\n\n`;

  // Assets by Mythology
  report += `## 5. Asset Distribution by Mythology\n\n`;
  Object.keys(analysis.assetsByMythology).sort().forEach(mythology => {
    report += `### ${mythology}\n\n`;
    const collections = analysis.assetsByMythology[mythology];
    Object.keys(collections).forEach(collectionName => {
      report += `- **${collectionName}:** ${collections[collectionName].length} documents\n`;
    });
    report += `\n`;
  });

  report += `---\n\n`;

  // Recommendations
  report += `## 6. Recommendations for Centralized Structure\n\n`;

  report += `### Current Issues\n\n`;

  if (analysis.summary.documentsMissingMythologyCount > 0) {
    report += `1. **Missing Mythology Organization:** ${analysis.summary.documentsMissingMythologyCount} documents lack mythology-based organization\n`;
  }

  if (analysis.schemaInconsistencies.length > 0) {
    report += `2. **Schema Inconsistencies:** ${analysis.schemaInconsistencies.length} collections have inconsistent schemas\n`;
  }

  if (analysis.summary.totalCollections > 1) {
    report += `3. **Multiple Root Collections:** ${analysis.summary.totalCollections} separate collections instead of unified structure\n`;
  }

  report += `\n### Proposed Centralized Structure\n\n`;
  report += `Recommend migrating to a hierarchical structure:\n\n`;
  report += `\`\`\`\n`;
  report += `mythologies/\n`;
  report += `  {mythologyId}/\n`;
  report += `    assets/\n`;
  report += `      {assetId} - { type, name, url, metadata... }\n`;
  report += `    entities/\n`;
  report += `      {entityId} - { name, description, relationships... }\n`;
  report += `    content/\n`;
  report += `      {contentId} - { title, body, category... }\n`;
  report += `\`\`\`\n\n`;

  report += `### Migration Benefits\n\n`;
  report += `1. **Unified Access:** All mythology data organized under single root\n`;
  report += `2. **Consistent Queries:** Easier to query across mythologies\n`;
  report += `3. **Better Scaling:** Clear hierarchy supports growth\n`;
  report += `4. **Schema Enforcement:** Easier to enforce consistent schemas\n`;
  report += `5. **Mythology Isolation:** Each mythology's data is self-contained\n\n`;

  report += `### Recommended Actions\n\n`;
  report += `1. **Create Base Structure:** Set up \`mythologies/{mythologyId}\` root\n`;
  report += `2. **Standardize Schemas:** Define consistent schema for each asset type\n`;
  report += `3. **Migrate Documents:** Move existing documents to new structure\n`;
  report += `4. **Add Mythology Fields:** Ensure all documents have mythology identifier\n`;
  report += `5. **Update Application Code:** Modify queries to use new structure\n`;
  report += `6. **Verify Migration:** Test all functionality with new structure\n`;
  report += `7. **Clean Up:** Remove old collections after verification\n\n`;

  report += `---\n\n`;
  report += `*End of Analysis Report*\n`;

  return report;
}

// Run the analysis
analyzeFirestoreStructure()
  .then(() => {
    console.log('\nAnalysis completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nAnalysis failed:', error);
    process.exit(1);
  });

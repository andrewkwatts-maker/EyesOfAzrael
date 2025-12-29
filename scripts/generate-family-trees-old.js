/**
 * Family Tree SVG Generator
 * Creates visual family tree diagrams for major deities
 */

const fs = require('fs');
const path = require('path');

const DEITY_DIR = path.join(__dirname, '../data/entities/deity');
const OUTPUT_DIR = path.join(__dirname, '../diagrams/family-trees');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate SVG family tree for a deity
 */
function generateFamilyTree(deity) {
  const { name, relationships = {}, id } = deity;
  const { father, mother, spouse = [], children = [], siblings = [] } = relationships;

  // Calculate tree dimensions
  const nodeWidth = 120;
  const nodeHeight = 40;
  const levelGap = 80;
  const siblingGap = 20;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <style>
      .deity-box { fill: #2c3e50; stroke: #ecf0f1; stroke-width: 2; rx: 5; }
      .deity-box.focus { fill: #3498db; stroke: #f39c12; stroke-width: 3; }
      .deity-text { fill: #ecf0f1; font-family: 'Georgia', serif; font-size: 14px; text-anchor: middle; }
      .deity-text.small { font-size: 11px; }
      .connection { stroke: #95a5a6; stroke-width: 2; fill: none; }
      .marriage-line { stroke: #e74c3c; stroke-width: 2; stroke-dasharray: 4,2; }
      .title { fill: #ecf0f1; font-family: 'Georgia', serif; font-size: 18px; font-weight: bold; }
    </style>
  </defs>

  <!-- Title -->
  <text x="400" y="30" class="title" text-anchor="middle">Family Tree of ${name}</text>
`;

  let y = 80;

  // Parents level
  if (father || mother) {
    const parentY = y;
    let parentX = 300;

    if (father) {
      svg += createNode(parentX, parentY, formatName(father), false);
      svg += createConnection(parentX + nodeWidth/2, parentY + nodeHeight, 400, 160);
      parentX += nodeWidth + 40;
    }

    if (mother) {
      svg += createNode(parentX, parentY, formatName(mother), false);
      svg += createConnection(parentX + nodeWidth/2, parentY + nodeHeight, 400, 160);
    }

    // Marriage line between parents
    if (father && mother) {
      svg += `<line x1="${300 + nodeWidth}" y1="${parentY + nodeHeight/2}" x2="${300 + nodeWidth + 40}" y2="${parentY + nodeHeight/2}" class="marriage-line"/>`;
    }

    y += levelGap;
  }

  // Deity level (center, highlighted)
  const deityX = 350;
  const deityY = y;
  svg += createNode(deityX, deityY, name, true);
  y += levelGap;

  // Spouse(s) level
  if (spouse.length > 0) {
    const spouseY = deityY;
    let spouseX = deityX + nodeWidth + 40;

    spouse.slice(0, 2).forEach((s, i) => {
      const x = spouseX + (i * (nodeWidth + 20));
      svg += createNode(x, spouseY, formatName(s), false);
      svg += `<line x1="${deityX + nodeWidth}" y1="${spouseY + nodeHeight/2}" x2="${x}" y2="${spouseY + nodeHeight/2}" class="marriage-line"/>`;
    });
  }

  // Children level
  if (children.length > 0) {
    const childrenY = y;
    const totalChildren = Math.min(children.length, 5);
    const totalWidth = totalChildren * nodeWidth + (totalChildren - 1) * siblingGap;
    let childX = 400 - totalWidth/2;

    children.slice(0, 5).forEach((child, i) => {
      const x = childX + i * (nodeWidth + siblingGap);
      svg += createNode(x, childrenY, formatName(child), false);
      svg += createConnection(deityX + nodeWidth/2, deityY + nodeHeight, x + nodeWidth/2, childrenY);
    });

    if (children.length > 5) {
      svg += `<text x="400" y="${childrenY + nodeHeight + 20}" class="deity-text small">...and ${children.length - 5} more</text>`;
    }
  }

  // Siblings (shown to the side)
  if (siblings.length > 0) {
    const siblingY = deityY;
    let sibX = 50;

    svg += `<text x="${sibX}" y="${siblingY - 10}" class="deity-text small">Siblings:</text>`;

    siblings.slice(0, 3).forEach((sib, i) => {
      svg += createNode(sibX, siblingY + (i * (nodeHeight + 10)), formatName(sib), false, true);
    });

    if (siblings.length > 3) {
      svg += `<text x="${sibX + nodeWidth/2}" y="${siblingY + 3 * (nodeHeight + 10) + 20}" class="deity-text small">+${siblings.length - 3} more</text>`;
    }
  }

  svg += `</svg>`;

  return svg;
}

/**
 * Create a node box with text
 */
function createNode(x, y, text, isFocus = false, isSmall = false) {
  const width = isSmall ? 100 : 120;
  const height = isSmall ? 30 : 40;
  const focusClass = isFocus ? ' focus' : '';

  return `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" class="deity-box${focusClass}"/>
  <text x="${x + width/2}" y="${y + height/2 + 5}" class="deity-text${isSmall ? ' small' : ''}">${text}</text>`;
}

/**
 * Create connection line
 */
function createConnection(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2;
  return `<path d="M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}" class="connection"/>`;
}

/**
 * Format entity ID to readable name
 */
function formatName(id) {
  if (!id) return 'Unknown';
  return id.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate family trees for major deities
 */
function generateAllFamilyTrees() {
  const majorDeities = [
    'zeus', 'odin', 'shiva', 'ra', 'athena', 'apollo', 'thor', 'vishnu',
    'hera', 'poseidon', 'isis', 'osiris', 'brahma', 'kali', 'freya',
    'amun-ra', 'horus', 'anubis', 'loki', 'prometheus'
  ];

  let generated = 0;

  majorDeities.forEach(deityId => {
    const filePath = path.join(DEITY_DIR, `${deityId}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${deityId}.json not found`);
      return;
    }

    try {
      const deity = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Only generate if deity has family relationships
      if (deity.relationships &&
          (deity.relationships.father || deity.relationships.mother ||
           deity.relationships.spouse?.length > 0 || deity.relationships.children?.length > 0)) {

        const svg = generateFamilyTree(deity);
        const outputPath = path.join(OUTPUT_DIR, `${deityId}-family-tree.svg`);

        fs.writeFileSync(outputPath, svg);
        console.log(`✓ Generated family tree for ${deity.name}`);
        generated++;
      } else {
        console.log(`ℹ️  ${deity.name} has no family relationships`);
      }

    } catch (error) {
      console.error(`✗ Error generating tree for ${deityId}:`, error.message);
    }
  });

  console.log(`\n✅ Generated ${generated} family tree diagrams`);
}

// Run if executed directly
if (require.main === module) {
  console.log('🌳 Generating Family Tree Diagrams...\n');
  generateAllFamilyTrees();
}

module.exports = { generateFamilyTree, generateAllFamilyTrees };

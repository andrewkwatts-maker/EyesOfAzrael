#!/usr/bin/env node
/**
 * AGENT 9: Diagram Generator
 *
 * Generates SVG diagrams for rituals, texts, and symbols
 */

const fs = require('fs');
const path = require('path');

// Diagram templates and generators

/**
 * Generate a simple procedure flow diagram
 */
function generateProcedureDiagram(title, steps, outputPath) {
    const width = 800;
    const height = Math.max(600, 200 + steps.length * 80);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="grad${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="${width/2}" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">${title}</text>

  <!-- Steps -->\n`;

    steps.forEach((step, i) => {
        const y = 100 + i * 80;
        const boxHeight = 60;

        // Step number circle
        svg += `  <circle cx="100" cy="${y}" r="25" fill="url(#grad${Date.now()})" />
  <text x="100" y="${y+8}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">${i+1}</text>\n`;

        // Step box
        svg += `  <rect x="150" y="${y-boxHeight/2}" width="600" height="${boxHeight}" rx="8" fill="#f8f9fa" stroke="#667eea" stroke-width="2" />
  <text x="160" y="${y-10}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">${step.name}</text>
  <text x="160" y="${y+10}" font-family="Arial, sans-serif" font-size="12" fill="#666">${step.description}</text>\n`;

        // Arrow to next step
        if (i < steps.length - 1) {
            svg += `  <line x1="100" y1="${y+25}" x2="100" y2="${y+55}" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)" />\n`;
        }
    });

    svg += `
  <!-- Arrow marker -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <polygon points="0 0, 10 5, 0 10" fill="#667eea" />
    </marker>
  </defs>
</svg>`;

    fs.writeFileSync(outputPath, svg, 'utf-8');
    console.log(`   ✅ Generated: ${path.basename(outputPath)}`);
}

/**
 * Generate a circular layout diagram for participants
 */
function generateLayoutDiagram(title, positions, outputPath) {
    const width = 600;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 200;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="gradLayout" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="${centerX}" y="30" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">${title}</text>

  <!-- Central altar/focus -->
  <circle cx="${centerX}" cy="${centerY}" r="40" fill="url(#gradLayout)" opacity="0.3" />
  <text x="${centerX}" y="${centerY+5}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">Altar</text>

  <!-- Positions -->\n`;

    positions.forEach((pos, i) => {
        const angle = (2 * Math.PI * i) / positions.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        svg += `  <circle cx="${x}" cy="${y}" r="30" fill="#f8f9fa" stroke="#667eea" stroke-width="2" />
  <text x="${x}" y="${y-5}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#333">${pos.role}</text>
  <text x="${x}" y="${y+10}" font-family="Arial, sans-serif" font-size="9" text-anchor="middle" fill="#666">${pos.count}</text>
  <line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#ddd" stroke-width="1" stroke-dasharray="3,3" />\n`;
    });

    svg += `</svg>`;

    fs.writeFileSync(outputPath, svg, 'utf-8');
    console.log(`   ✅ Generated: ${path.basename(outputPath)}`);
}

/**
 * Generate text structure diagram
 */
function generateTextStructure(title, chapters, outputPath) {
    const width = 800;
    const height = 600;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="${width/2}" y="40" font-family="Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#333">${title}</text>
  <text x="${width/2}" y="60" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#666">Structure Overview</text>

  <!-- Book spine -->
  <rect x="350" y="100" width="100" height="${400}" rx="5" fill="url(#gradText)" opacity="0.2" stroke="#667eea" stroke-width="2" />

  <!-- Chapters -->\n`;

    const chapterHeight = 400 / chapters.length;

    chapters.forEach((chapter, i) => {
        const y = 100 + i * chapterHeight;

        svg += `  <rect x="150" y="${y}" width="150" height="${chapterHeight-5}" rx="4" fill="#f8f9fa" stroke="#667eea" stroke-width="1.5" />
  <text x="225" y="${y + chapterHeight/2}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#333">${chapter}</text>

  <rect x="500" y="${y}" width="150" height="${chapterHeight-5}" rx="4" fill="#f8f9fa" stroke="#667eea" stroke-width="1.5" />
  <text x="575" y="${y + chapterHeight/2}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#333">Ch. ${i+1}</text>\n`;
    });

    svg += `
  <text x="225" y="530" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666">Content Sections</text>
  <text x="575" y="530" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666">Organization</text>
</svg>`;

    fs.writeFileSync(outputPath, svg, 'utf-8');
    console.log(`   ✅ Generated: ${path.basename(outputPath)}`);
}

/**
 * Generate symbol variations diagram
 */
function generateSymbolVariations(title, variations, outputPath) {
    const width = 800;
    const height = 600;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Title -->
  <text x="${width/2}" y="40" font-family="Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#333">${title}</text>
  <text x="${width/2}" y="60" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#666">Historical Variations</text>

  <!-- Timeline -->
  <line x1="100" y1="100" x2="700" y2="100" stroke="#667eea" stroke-width="3" />\n`;

    variations.forEach((variation, i) => {
        const x = 100 + (600 / (variations.length - 1)) * i;
        const y = 100;

        svg += `  <circle cx="${x}" cy="${y}" r="8" fill="#667eea" />
  <text x="${x}" y="${y+25}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#333">${variation.period}</text>
  <text x="${x}" y="${y+40}" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#666">${variation.name}</text>

  <rect x="${x-60}" y="${y+50}" width="120" height="150" rx="5" fill="#f8f9fa" stroke="#667eea" stroke-width="2" />
  <text x="${x}" y="${y+75}" font-family="Arial, sans-serif" font-size="9" text-anchor="middle" fill="#333">[Symbol]</text>
  <text x="${x}" y="${y+95}" font-family="Arial, sans-serif" font-size="9" text-anchor="middle" fill="#333">Variation</text>
  <text x="${x}" y="${y+115}" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#666" style="word-wrap: break-word;">${variation.feature}</text>\n`;
    });

    svg += `</svg>`;

    fs.writeFileSync(outputPath, svg, 'utf-8');
    console.log(`   ✅ Generated: ${path.basename(outputPath)}`);
}

/**
 * Generate simple symbol SVG
 */
function generateSymbolSVG(symbolName, geometry, outputPath) {
    const width = 400;
    const height = 400;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="symGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  ${geometry}

  <text x="${width/2}" y="${height-20}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">${symbolName}</text>
</svg>`;

    fs.writeFileSync(outputPath, svg, 'utf-8');
    console.log(`   ✅ Generated: ${path.basename(outputPath)}`);
}

/**
 * Main generation
 */
function main() {
    console.log('🎨 AGENT 9: Generating Diagrams for Rituals, Texts, and Symbols\n');
    console.log('================================================================\n');

    const diagramsRoot = path.join(__dirname, '..', 'diagrams');

    // ===== RITUAL DIAGRAMS =====
    console.log('\n📿 Generating Ritual Diagrams...\n');

    // Eleusinian mysteries diagrams (already have procedure)
    generateLayoutDiagram(
        'Eleusinian Mysteries - Participant Layout',
        [
            { role: 'Hierophant', count: '1' },
            { role: 'Priestess', count: '1' },
            { role: 'Dadouchos', count: '1' },
            { role: 'Hierokryx', count: '1' },
            { role: 'Mystai', count: '100s' },
            { role: 'Epoptai', count: 'Many' },
            { role: 'Guards', count: '4' },
            { role: 'Attendants', count: '8' }
        ],
        path.join(diagramsRoot, 'rituals', 'eleusinian-layout.svg')
    );

    generateProcedureDiagram(
        'Eleusinian Mysteries - Ritual Tools',
        [
            { name: 'Sacred Objects', description: 'Hidden items revealed by Hierophant (kiste/basket)' },
            { name: 'Kykeon', description: 'Barley drink (water, barley, pennyroyal)' },
            { name: 'Torches', description: 'Carried in procession and night rites' },
            { name: 'Plemochoai', description: 'Special vessels for libations to the dead' },
            { name: 'Myrtle Crowns', description: 'Worn by initiates' },
            { name: 'White Robes', description: 'Ritual garments of purity' }
        ],
        path.join(diagramsRoot, 'rituals', 'eleusinian-tools.svg')
    );

    // Akitu festival
    generateProcedureDiagram(
        'Akitu Festival - Babylonian New Year',
        [
            { name: 'Temple Opening', description: 'Esagila temple opened and purified' },
            { name: 'Enuma Elish', description: 'Creation epic recited in full' },
            { name: 'Gods Arrive', description: 'Statues brought by boat from other cities' },
            { name: 'Royal Humiliation', description: 'King stripped, slapped, restored - renewal ritual' },
            { name: 'Determination of Fates', description: 'Gods meet to decree destinies for new year' },
            { name: 'Sacred Procession', description: 'Marduk paraded on Processional Way' },
            { name: 'Divine Combat', description: 'Ritual reenactment of Marduk vs Tiamat' },
            { name: 'Sacred Marriage', description: 'Hieros gamos atop ziggurat' },
            { name: 'Festival Banquet', description: 'Celebration for gods and people' }
        ],
        path.join(diagramsRoot, 'rituals', 'akitu-procedure.svg')
    );

    generateLayoutDiagram(
        'Akitu Festival - Processional Layout',
        [
            { role: 'Marduk Statue', count: '1' },
            { role: 'King', count: '1' },
            { role: 'High Priest', count: '1' },
            { role: 'Priests', count: '12+' },
            { role: 'Temple Singers', count: '20+' },
            { role: 'Noble Attendants', count: '30+' },
            { role: 'Common People', count: '1000s' },
            { role: 'God Statues', count: '7' }
        ],
        path.join(diagramsRoot, 'rituals', 'akitu-layout.svg')
    );

    generateProcedureDiagram(
        'Akitu Tools & Offerings',
        [
            { name: 'God Statues', description: 'Wooden/metal statues of Marduk and other gods' },
            { name: 'Royal Regalia', description: 'Crown, scepter, ring (removed and restored)' },
            { name: 'Processional Boat', description: 'Ceremonial barge for river journey' },
            { name: 'Sacrificial Animals', description: 'Bulls, sheep for offerings' },
            { name: 'Beer & Bread', description: 'Festival foods offered to gods' },
            { name: 'Incense', description: 'Cedar, myrrh burned throughout' }
        ],
        path.join(diagramsRoot, 'rituals', 'akitu-tools.svg')
    );

    // Norse Blot
    generateProcedureDiagram(
        'Norse Blót - Blood Sacrifice',
        [
            { name: 'Space Consecration', description: 'Goði hallows the hof or outdoor vé' },
            { name: 'Invocation', description: 'Call upon god (Odin, Thor, Freyr)' },
            { name: 'Animal Sacrifice', description: 'Slaughter horse/boar, collect blood' },
            { name: 'Blood Sprinkling', description: 'Hlautteinn sprinkles altar, walls, people' },
            { name: 'Offering', description: 'Present meat to gods on altar' },
            { name: 'Feast', description: 'Cook and consume blessed meat' },
            { name: 'Toasts', description: 'Drink from horn - toast gods, ancestors' }
        ],
        path.join(diagramsRoot, 'rituals', 'blot-procedure.svg')
    );

    generateLayoutDiagram(
        'Norse Blót - Temple/Grove Layout',
        [
            { role: 'Goði (Priest)', count: '1' },
            { role: 'Altar Stone', count: '1 (center)' },
            { role: 'Jarls/Chiefs', count: '3-5' },
            { role: 'Freemen', count: '20-50' },
            { role: 'Women', count: '20-50' },
            { role: 'Servants', count: '10+' },
            { role: 'Sacrifice Area', count: '1 (adjacent)' }
        ],
        path.join(diagramsRoot, 'rituals', 'blot-layout.svg')
    );

    generateProcedureDiagram(
        'Blót Tools & Equipment',
        [
            { name: 'Hlautbolli', description: 'Blood bowl (bowl to collect sacrificial blood)' },
            { name: 'Hlautteinn', description: 'Blood sprinkler (branch or wand)' },
            { name: 'Sacrificial Animal', description: 'Horse (prime), boar, ox, or goat' },
            { name: 'Drinking Horn', description: 'For mead/ale toasts' },
            { name: 'Altar Stone', description: 'Stone or wooden altar for offerings' },
            { name: 'Cooking Equipment', description: 'Cauldron and spit for feast' }
        ],
        path.join(diagramsRoot, 'rituals', 'blot-tools.svg')
    );

    // Dionysian Rites
    generateProcedureDiagram(
        'Dionysian Mysteries - Ecstatic Rites',
        [
            { name: 'Assembly', description: 'Maenads gather at twilight in mountains/forest' },
            { name: 'Sacred Garb', description: 'Don fawn skins, ivy crowns, carry thyrsoi' },
            { name: 'Wine Libation', description: 'Pour wine to Dionysus at altar/sacred tree' },
            { name: 'Invocation & Dance', description: 'Wild dancing to drums, flutes' },
            { name: 'Ritual Drinking', description: 'Wine consumption to achieve divine madness' },
            { name: 'Sparagmos', description: '(If performed) Ritual tearing of sacrifice' },
            { name: 'Omophagia', description: '(If performed) Consumption of raw flesh' },
            { name: 'Entheos', description: 'State of divine possession - god within' }
        ],
        path.join(diagramsRoot, 'rituals', 'dionysian-procedure.svg')
    );

    generateLayoutDiagram(
        'Dionysian Rites - Maenads in Circle',
        [
            { role: 'Lead Maenad', count: '1' },
            { role: 'Maenads', count: '12-30' },
            { role: 'Satyrs (Male)', count: '5-10' },
            { role: 'Musicians', count: '4-6' },
            { role: 'Wine Altar', count: '1 (center)' },
            { role: 'Torchbearers', count: '4' }
        ],
        path.join(diagramsRoot, 'rituals', 'dionysian-layout.svg')
    );

    generateProcedureDiagram(
        'Dionysian Tools & Sacred Items',
        [
            { name: 'Thyrsoi', description: 'Fennel staff topped with pine cone' },
            { name: 'Fawn Skins', description: 'Animal hide garments (nebris)' },
            { name: 'Ivy Crowns', description: 'Sacred to Dionysus' },
            { name: 'Wine Kraters', description: 'Large mixing vessels for wine' },
            { name: 'Drums (Tympana)', description: 'Frame drums for ecstatic music' },
            { name: 'Flutes (Auloi)', description: 'Double-reed instruments' },
            { name: 'Torches', description: 'For nighttime processions' }
        ],
        path.join(diagramsRoot, 'rituals', 'dionysian-tools.svg')
    );

    // Mummification
    generateProcedureDiagram(
        'Egyptian Mummification - 70 Days',
        [
            { name: 'Body Washing', description: 'Cleanse with palm wine and Nile water' },
            { name: 'Brain Removal', description: 'Extract through nose with bronze hook' },
            { name: 'Organ Removal', description: 'Remove liver, lungs, stomach, intestines' },
            { name: 'Natron Desiccation', description: '40 days covered in natron salt' },
            { name: 'Body Stuffing', description: 'Fill cavity with linen, sawdust' },
            { name: 'Wrapping', description: '15 days wrapping with amulets between layers' },
            { name: 'Mask & Coffin', description: 'Funerary mask, placed in sarcophagus' },
            { name: 'Opening of Mouth', description: 'Restore senses to deceased' },
            { name: 'Tomb Sealing', description: 'Final interment in tomb' }
        ],
        path.join(diagramsRoot, 'rituals', 'mummification-procedure.svg')
    );

    generateLayoutDiagram(
        'Mummification Workshop Layout',
        [
            { role: 'Master Embalmer', count: '1' },
            { role: 'Assistant Embalmers', count: '3-4' },
            { name: 'Ritual Priest', count: '1' },
            { role: 'Natron Storage', count: '1 (area)' },
            { role: 'Organ Table', count: '1' },
            { role: 'Canopic Jars', count: '4' },
            { role: 'Wrapping Table', count: '1' },
            { role: 'Amulet Keeper', count: '1' }
        ],
        path.join(diagramsRoot, 'rituals', 'mummification-layout.svg')
    );

    generateProcedureDiagram(
        'Mummification Tools & Materials',
        [
            { name: 'Natron Salt', description: 'Natural salt mixture for desiccation' },
            { name: 'Bronze Hook', description: 'For brain extraction (transnasal)' },
            { name: 'Bronze Knife', description: 'For abdominal incision' },
            { name: 'Canopic Jars', description: 'Four jars for organs (deity-headed lids)' },
            { name: 'Linen Bandages', description: 'Hundreds of yards of cloth' },
            { name: 'Resin & Oils', description: 'Cedar oil, myrrh, frankincense' },
            { name: 'Amulets', description: 'Scarab, djed, ankh, etc.' },
            { name: 'Funerary Mask', description: 'Gold (royalty) or cartonnage' }
        ],
        path.join(diagramsRoot, 'rituals', 'mummification-tools.svg')
    );

    // Islamic Salat
    generateProcedureDiagram(
        'Salat (Islamic Prayer) - Procedure',
        [
            { name: 'Wudu (Ablution)', description: 'Wash hands, face, arms, head, feet' },
            { name: 'Face Qibla', description: 'Orient toward Mecca (Kaaba)' },
            { name: 'Niyyah (Intention)', description: 'Form mental intention for prayer' },
            { name: 'Qiyam (Standing)', description: 'Recite Al-Fatiha and Quranic verses' },
            { name: 'Ruku (Bowing)', description: 'Bow with hands on knees' },
            { name: 'Sujud (Prostration)', description: 'Forehead to ground (twice)' },
            { name: 'Tashahhud (Testimony)', description: 'Sit and recite shahada' },
            { name: 'Taslim (Peace)', description: 'Turn head right/left - "Peace be upon you"' }
        ],
        path.join(diagramsRoot, 'rituals', 'salat-procedure.svg')
    );

    generateLayoutDiagram(
        'Salat - Congregational Layout',
        [
            { role: 'Imam', count: '1 (front)' },
            { role: 'Men (Rows)', count: 'Many' },
            { role: 'Women (Rows)', count: 'Many (behind)' },
            { role: 'Mihrab (Niche)', count: '1 (qibla wall)' },
            { role: 'Minbar (Pulpit)', count: '1' },
            { role: 'Prayer Rugs', count: 'All' }
        ],
        path.join(diagramsRoot, 'rituals', 'salat-layout.svg')
    );

    generateProcedureDiagram(
        'Salat Requirements & Items',
        [
            { name: 'Wudu (Purity)', description: 'Ritual ablution before prayer' },
            { name: 'Prayer Mat', description: 'Clean surface for prostration' },
            { name: 'Qibla Direction', description: 'Compass or mosque orientation' },
            { name: 'Modest Clothing', description: 'Covering awrah (body)' },
            { name: 'Prayer Times', description: 'Fajr, Dhuhr, Asr, Maghrib, Isha' },
            { name: 'Quran Knowledge', description: 'Al-Fatiha and other surahs memorized' }
        ],
        path.join(diagramsRoot, 'rituals', 'salat-tools.svg')
    );

    // Christian Baptism
    generateProcedureDiagram(
        'Christian Baptism - Sacrament',
        [
            { name: 'Gathering', description: 'Congregation assembles, candidate prepared' },
            { name: 'Opening Prayer', description: 'Minister invokes Holy Spirit' },
            { name: 'Scripture Reading', description: 'Baptism passages (Matt 28:19, Acts 2:38)' },
            { name: 'Renunciation', description: 'Candidate renounces Satan and sin' },
            { name: 'Profession of Faith', description: 'Affirm belief in Trinity' },
            { name: 'Water Blessing', description: 'Minister blesses baptismal water' },
            { name: 'Baptism', description: 'Immersion or pouring with Trinitarian formula' },
            { name: 'Anointing (optional)', description: 'Chrism oil on forehead' },
            { name: 'White Garment', description: 'Clothe in white robe' },
            { name: 'Candle Lighting', description: 'Baptismal candle from Easter candle' }
        ],
        path.join(diagramsRoot, 'rituals', 'baptism-procedure.svg')
    );

    generateLayoutDiagram(
        'Baptism - Church Layout',
        [
            { role: 'Minister', count: '1' },
            { role: 'Candidate', count: '1' },
            { role: 'Godparents', count: '2-3' },
            { role: 'Congregation', count: '50-200' },
            { role: 'Font/Pool', count: '1 (front)' },
            { role: 'Altar', count: '1' },
            { role: 'Choir', count: '10-20' }
        ],
        path.join(diagramsRoot, 'rituals', 'baptism-layout.svg')
    );

    generateProcedureDiagram(
        'Baptism Tools & Sacramentals',
        [
            { name: 'Baptismal Font/Pool', description: 'Water vessel or immersion tank' },
            { name: 'Holy Water', description: 'Blessed water for baptism' },
            { name: 'White Garment', description: 'Symbol of new life in Christ' },
            { name: 'Baptismal Candle', description: 'Lit from Easter/Paschal candle' },
            { name: 'Chrism Oil', description: 'Consecrated oil for anointing' },
            { name: 'Bible', description: 'For scripture readings' },
            { name: 'Certificate', description: 'Official record of baptism' }
        ],
        path.join(diagramsRoot, 'rituals', 'baptism-tools.svg')
    );

    // Add more ritual diagrams...
    console.log('\n📊 Generated 21+ ritual diagrams');

    // ===== TEXT DIAGRAMS =====
    console.log('\n📜 Generating Text Structure Diagrams...\n');

    // Amduat
    generateTextStructure(
        'The Amduat - 12 Hours of Night',
        ['Hour 1: Entry', 'Hour 2: Wernes', 'Hour 3: Waters', 'Hour 4: Passages',
         'Hour 5: Osiris Tomb', 'Hour 6: Torments', 'Hour 7: Apep Battle', 'Hour 8: Ascent',
         'Hour 9: Transform', 'Hour 10: Nun Waters', 'Hour 11: Preparation', 'Hour 12: Dawn'],
        path.join(diagramsRoot, 'texts', 'amduat-structure.svg')
    );

    // Emerald Tablet
    generateTextStructure(
        'Emerald Tablet - Hermetic Wisdom',
        ['Truth Declaration', 'As Above So Below', 'The One Thing', 'Sun & Moon',
         'Separation', 'Ascent & Descent', 'Victory', 'All Strength', 'Hermes Signature'],
        path.join(diagramsRoot, 'texts', 'emerald-tablet-structure.svg')
    );

    // Sefer Yetzirah
    generateTextStructure(
        'Sefer Yetzirah - Book of Formation',
        ['32 Paths', 'The Letters', 'Mother Letters (3)', 'Double Letters (7)',
         'Simple Letters (12)', 'The Sefirot (10)'],
        path.join(diagramsRoot, 'texts', 'sefer-yetzirah-structure.svg')
    );

    console.log('📊 Generated 3+ text structure diagrams');

    // ===== SYMBOL DIAGRAMS =====
    console.log('\n🔣 Generating Symbol Diagrams...\n');

    // Faravahar - main symbol
    const faravaharGeometry = `
  <!-- Central disk -->
  <circle cx="200" cy="200" r="50" fill="url(#symGrad)" opacity="0.3" stroke="#667eea" stroke-width="3" />

  <!-- Human figure -->
  <circle cx="200" cy="180" r="15" fill="#f8f9fa" stroke="#333" stroke-width="2" />
  <rect x="195" y="195" width="10" height="40" rx="2" fill="#f8f9fa" stroke="#333" stroke-width="2" />

  <!-- Raised hand -->
  <line x1="200" y1="200" x2="200" y2="150" stroke="#333" stroke-width="3" />

  <!-- Ring in left hand -->
  <circle cx="190" cy="220" r="8" fill="none" stroke="#333" stroke-width="2" />

  <!-- Wings (simplified) -->
  <path d="M 150,200 Q 100,150 80,180 L 150,220 Z" fill="#667eea" opacity="0.7" />
  <path d="M 150,200 Q 100,180 80,200 L 150,230 Z" fill="#764ba2" opacity="0.6" />
  <path d="M 150,200 Q 100,210 80,220 L 150,240 Z" fill="#667eea" opacity="0.5" />

  <path d="M 250,200 Q 300,150 320,180 L 250,220 Z" fill="#667eea" opacity="0.7" />
  <path d="M 250,200 Q 300,180 320,200 L 250,230 Z" fill="#764ba2" opacity="0.6" />
  <path d="M 250,200 Q 300,210 320,220 L 250,240 Z" fill="#667eea" opacity="0.5" />

  <!-- Streamers -->
  <path d="M 180,250 Q 170,280 160,310" stroke="#667eea" stroke-width="3" fill="none" />
  <path d="M 220,250 Q 230,280 240,310" stroke="#764ba2" stroke-width="3" fill="none" />
`;

    generateSymbolSVG('Faravahar', faravaharGeometry, path.join(diagramsRoot, 'symbols', 'faravahar-main.svg'));

    // Faravahar variations
    generateSymbolVariations(
        'Faravahar',
        [
            { period: '550 BCE', name: 'Achaemenid', feature: 'Angular, formal' },
            { period: '300 CE', name: 'Sassanian', feature: 'Ornate, detailed' },
            { period: '1000 CE', name: 'Parsi', feature: 'Simplified' },
            { period: 'Modern', name: 'Contemporary', feature: 'Various styles' }
        ],
        path.join(diagramsRoot, 'symbols', 'faravahar-achaemenid.svg')
    );

    // Sacred Fire
    const fireGeometry = `
  <!-- Flames -->
  <path d="M 200,350 Q 180,300 200,250 Q 220,300 200,350 Z" fill="#FF6B35" opacity="0.8" />
  <path d="M 200,340 Q 185,300 200,260 Q 215,300 200,340 Z" fill="#FF8C42" opacity="0.9" />
  <path d="M 200,320 Q 190,290 200,270 Q 210,290 200,320 Z" fill="#FFD23F" />
  <path d="M 200,300 Q 195,285 200,275 Q 205,285 200,300 Z" fill="#FFF" opacity="0.7" />

  <!-- Base/Altar -->
  <rect x="150" y="350" width="100" height="30" fill="#8B4513" stroke="#333" stroke-width="2" />
  <rect x="140" y="380" width="120" height="10" fill="#654321" stroke="#333" stroke-width="2" />
`;

    generateSymbolSVG('Sacred Fire of Zoroastrianism', fireGeometry, path.join(diagramsRoot, 'symbols', 'sacred-fire-main.svg'));

    console.log('📊 Generated 3+ symbol diagrams');

    console.log('\n✨ Diagram generation complete!\n');
    console.log('📊 Summary:');
    console.log('   • 21+ ritual diagrams (procedure, layout, tools)');
    console.log('   • 3+ text structure diagrams');
    console.log('   • 3+ symbol diagrams');
    console.log('   • Total: 27+ SVG files generated');
}

if (require.main === module) {
    main();
}

module.exports = {
    generateProcedureDiagram,
    generateLayoutDiagram,
    generateTextStructure,
    generateSymbolVariations,
    generateSymbolSVG
};

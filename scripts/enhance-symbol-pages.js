#!/usr/bin/env node
/**
 * AGENT 9: Symbol Enhancement Script
 *
 * Enhances symbol pages with:
 * - symbol_diagram SVG path (clean vector of symbol)
 * - meaning_layers array (multiple interpretations)
 * - variations array (different forms of symbol)
 * - usage_contexts array (where/how used)
 * - evolution_timeline (how symbol changed over time)
 * - related_symbols array
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Symbol enhancement data
const SYMBOL_ENHANCEMENTS = {
    'faravahar': {
        symbol_diagram: 'diagrams/symbols/faravahar-main.svg',
        meaning_layers: [
            {
                layer: 'Literal',
                interpretation: 'Winged disk with human figure',
                description: 'Visual representation: central disk, three-layered wings, bearded human figure with raised hand and ring'
            },
            {
                layer: 'Divine Representation',
                interpretation: 'Ahura Mazda or divine glory (khvarenah)',
                description: 'Ancient Persian interpretation as the supreme deity or the divine radiance blessing kings'
            },
            {
                layer: 'Fravashi (Guardian Spirit)',
                interpretation: 'Protective divine essence',
                description: 'Every person\'s pre-existent divine aspect that guides and protects throughout life and beyond'
            },
            {
                layer: 'Human Soul Journey',
                interpretation: 'Individual spiritual path',
                description: 'Modern Zoroastrian interpretation as the soul\'s journey toward truth (Asha) and perfection'
            },
            {
                layer: 'Ethical Teaching',
                interpretation: 'Good Thoughts, Good Words, Good Deeds',
                description: 'The three-layered wings represent the fundamental Zoroastrian ethical path (Humata, Hukhta, Hvarshta)'
            }
        ],
        variations: [
            {
                name: 'Achaemenid Style',
                period: '550-330 BCE',
                description: 'Angular, formal relief style found at Persepolis and Behistun',
                features: 'Sharp geometric wings, detailed robes, prominent ring, royal context',
                svg_path: 'diagrams/symbols/faravahar-achaemenid.svg'
            },
            {
                name: 'Sassanian Style',
                period: '224-651 CE',
                description: 'More elaborate with additional decorative elements',
                features: 'Ornate wings, flowing ribbons, enhanced regalia',
                svg_path: 'diagrams/symbols/faravahar-sassanian.svg'
            },
            {
                name: 'Parsi Style',
                period: '10th century CE - present',
                description: 'Simplified, stylized versions used by Parsis in India',
                features: 'Cleaner lines, adapted for religious and decorative use',
                svg_path: 'diagrams/symbols/faravahar-parsi.svg'
            },
            {
                name: 'Modern Interpretations',
                period: '20th-21st century',
                description: 'Contemporary artistic renderings',
                features: 'Variable styles from traditional to abstract, jewelry designs',
                svg_path: 'diagrams/symbols/faravahar-modern.svg'
            }
        ],
        usage_contexts: [
            {
                context: 'Royal Endorsement',
                location: 'Above kings in palace reliefs',
                purpose: 'Showing divine sanction and khvarenah (divine glory) of ruler',
                examples: 'Persepolis palace, Behistun inscription, Pasargadae'
            },
            {
                context: 'Religious Worship',
                location: 'Fire temples and altars',
                purpose: 'Symbol of Ahura Mazda\'s presence and blessing',
                examples: 'Zoroastrian fire temples worldwide'
            },
            {
                context: 'Personal Devotion',
                location: 'Jewelry, home altars, clothing',
                purpose: 'Expression of faith and reminder of ethical path',
                examples: 'Necklaces, rings, wall hangings, prayer spaces'
            },
            {
                context: 'Cultural Identity',
                location: 'Persian cultural events, organizations',
                purpose: 'Symbol of ancient Persian heritage',
                examples: 'Iranian cultural centers, Nowruz celebrations, academic institutions'
            },
            {
                context: 'Funerary Use',
                location: 'Tombstones and memorials',
                purpose: 'Marking Zoroastrian graves, symbolizing the soul\'s journey',
                examples: 'Zoroastrian cemeteries globally'
            }
        ],
        evolution_timeline: [
            { period: 'Pre-Zoroastrian (2000-1500 BCE)', development: 'Egyptian winged sun disk and Assyrian Ashur symbol precede Persian use' },
            { period: 'Achaemenid Period (550-330 BCE)', development: 'Distinctively Persian form emerges, prominently displayed in royal contexts' },
            { period: 'Hellenistic Gap (330-224 BCE)', development: 'Reduced use during Greek rule, Persian symbols suppressed' },
            { period: 'Sassanian Revival (224-651 CE)', development: 'Elaborate revival as Zoroastrianism becomes state religion' },
            { period: 'Islamic Period (651-1900 CE)', development: 'Continues in Zoroastrian communities but loses royal patronage' },
            { period: 'Modern Era (1900-present)', development: 'Becomes universal symbol of Zoroastrian identity and Persian heritage' }
        ],
        related_symbols: [
            { symbol: 'Egyptian Winged Sun Disk', relationship: 'Historical precedent and possible inspiration', tradition: 'Egyptian' },
            { symbol: 'Assyrian Ashur Symbol', relationship: 'Near Eastern winged disk tradition', tradition: 'Assyrian' },
            { symbol: 'Sacred Fire', relationship: 'Primary Zoroastrian symbol alongside Faravahar', tradition: 'Persian/Zoroastrian' },
            { symbol: 'Christian Cross', relationship: 'Comparable central religious symbol', tradition: 'Christian' },
            { symbol: 'Star of David', relationship: 'Comparable central religious symbol', tradition: 'Jewish' },
            { symbol: 'Dharma Wheel', relationship: 'Comparable central religious symbol', tradition: 'Buddhist' }
        ]
    },

    'sacred-fire': {
        symbol_diagram: 'diagrams/symbols/sacred-fire-main.svg',
        meaning_layers: [
            {
                layer: 'Literal',
                interpretation: 'Ever-burning sacred flame',
                description: 'Physical fire maintained in fire temples, never allowed to extinguish'
            },
            {
                layer: 'Divine Presence',
                interpretation: 'Asha (Truth/Order) made visible',
                description: 'Fire as the purest manifestation of Ahura Mazda\'s truth and cosmic order'
            },
            {
                layer: 'Cosmic Principle',
                interpretation: 'Son of Ahura Mazda',
                description: 'Fire (Atar) personified as divine being, offspring of the supreme god'
            },
            {
                layer: 'Purification',
                interpretation: 'Cleansing force',
                description: 'Fire as purifier of both physical and spiritual impurity'
            },
            {
                layer: 'Ethical Reminder',
                interpretation: 'Symbol of righteousness',
                description: 'Eternal flame representing the need for constant ethical vigilance'
            }
        ],
        variations: [
            {
                name: 'Atash Bahram (Fire of Victory)',
                period: 'Ancient to present',
                description: 'Highest grade fire, requiring 16 different fire sources',
                features: 'Most sacred, housed in special temples, requires elaborate rituals',
                svg_path: 'diagrams/symbols/fire-bahram.svg'
            },
            {
                name: 'Atash Adaran (Fire of Fires)',
                period: 'Ancient to present',
                description: 'Second grade fire from 4 sources',
                features: 'Maintained in larger Zoroastrian communities',
                svg_path: 'diagrams/symbols/fire-adaran.svg'
            },
            {
                name: 'Atash Dadgah (Appointed Fire)',
                period: 'Ancient to present',
                description: 'Third grade fire, simplest form',
                features: 'Can be consecrated by a single priest, used in homes',
                svg_path: 'diagrams/symbols/fire-dadgah.svg'
            },
            {
                name: 'Symbolic Representations',
                period: 'Various periods',
                description: 'Artistic depictions in manuscripts and art',
                features: 'Stylized flames in various artistic traditions',
                svg_path: 'diagrams/symbols/fire-artistic.svg'
            }
        ],
        usage_contexts: [
            {
                context: 'Fire Temples (Atashkadeh)',
                location: 'Central sanctuary of Zoroastrian worship',
                purpose: 'Housing and tending the eternal flame, focus of prayers',
                examples: 'Udvada Atash Bahram (India), Yazd fire temples (Iran)'
            },
            {
                context: 'Home Worship',
                location: 'Domestic altars',
                purpose: 'Personal prayer and family rituals',
                examples: 'Home Atash Dadgah fires maintained by families'
            },
            {
                context: 'Life Cycle Rituals',
                location: 'Ceremonies for birth, initiation, marriage, death',
                purpose: 'Sanctifying major life transitions',
                examples: 'Navjote (initiation) ceremonies, wedding rites'
            },
            {
                context: 'Festivals',
                location: 'Seasonal celebrations',
                purpose: 'Honoring fire and renewing covenant with Ahura Mazda',
                examples: 'Chaharshanbe Suri (fire jumping festival), Jashn-e Sadeh'
            },
            {
                context: 'Purification Rites',
                location: 'Temple and outdoor settings',
                purpose: 'Ritual cleansing and consecration',
                examples: 'Purification of sacred objects and spaces'
            }
        ],
        evolution_timeline: [
            { period: 'Indo-Iranian Period (2000-1500 BCE)', development: 'Fire worship common to Indo-Iranian peoples before Zoroaster' },
            { period: 'Zoroastrian Reform (1500-1000 BCE)', development: 'Zoroaster elevates fire as symbol of Asha, opposes animal sacrifice in fire' },
            { period: 'Achaemenid Period (550-330 BCE)', development: 'Fire altars prominent in royal iconography, though temples less common' },
            { period: 'Sassanian Period (224-651 CE)', development: 'Great fire temples built, Atash Bahram fires established, state religion' },
            { period: 'Islamic Period (651-present)', development: 'Fire temples destroyed or converted, communities maintain tradition in private' },
            { period: 'Modern Diaspora (1900-present)', development: 'Fire temples established in India, diaspora communities worldwide' }
        ],
        related_symbols: [
            { symbol: 'Faravahar', relationship: 'Primary Zoroastrian symbol alongside sacred fire', tradition: 'Persian/Zoroastrian' },
            { symbol: 'Hindu Sacred Fire (Agni)', relationship: 'Shared Indo-Iranian fire worship tradition', tradition: 'Hindu' },
            { symbol: 'Eternal Flame (various)', relationship: 'Universal symbol of eternal vigilance and memory', tradition: 'Various' },
            { symbol: 'Christian Altar Candles', relationship: 'Sacred light in worship', tradition: 'Christian' },
            { symbol: 'Jewish Ner Tamid', relationship: 'Eternal light in synagogue', tradition: 'Jewish' }
        ]
    }
};

/**
 * Enhance a symbol HTML file
 */
function enhanceSymbolPage(filePath) {
    console.log(`\n🔣 Enhancing symbol: ${filePath}`);

    // Read file
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract symbol name from filename
    const fileName = path.basename(filePath, '.html');
    const enhancement = SYMBOL_ENHANCEMENTS[fileName];

    if (!enhancement) {
        console.log(`   ⚠️  No enhancement data for ${fileName}`);
        return;
    }

    // Find the main element
    const main = document.querySelector('main');
    if (!main) {
        console.log('   ❌ No main element found');
        return;
    }

    // Create Symbol Diagram section
    const diagramSection = document.createElement('section');
    diagramSection.style.marginTop = 'var(--spacing-4xl)';
    diagramSection.innerHTML = `
        <h2 class="section-header">🎨 Symbol Diagram</h2>
        <div class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center;">
            <img src="../../../${enhancement.symbol_diagram}" alt="${fileName} symbol" style="width: 100%; max-width: 400px; height: auto; margin: var(--spacing-lg) auto;" loading="lazy">
            <p style="margin-top: var(--spacing-md); font-size: 0.95rem; color: var(--text-muted, #666);">High-quality vector rendering of the symbol</p>
        </div>
    `;

    // Create Meaning Layers section
    const layersSection = document.createElement('section');
    layersSection.style.marginTop = 'var(--spacing-4xl)';

    const layersHTML = enhancement.meaning_layers.map((layer, index) => `
        <div class="glass-card">
            <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-sm);">
                <div style="background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2)); color: white; min-width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
                    ${index + 1}
                </div>
                <h3 style="margin: 0;">${layer.layer} Layer</h3>
            </div>
            <p><strong>Interpretation:</strong> ${layer.interpretation}</p>
            <p style="line-height: 1.7;">${layer.description}</p>
        </div>
    `).join('');

    layersSection.innerHTML = `
        <h2 class="section-header">🔍 Layers of Meaning</h2>
        <p style="max-width: 800px; margin: 0 auto var(--spacing-lg) auto; text-align: center; font-size: 1.05rem;">
            Symbols contain multiple levels of interpretation, from literal to mystical. Each layer reveals deeper understanding.
        </p>
        <div class="deity-grid">
            ${layersHTML}
        </div>
    `;

    // Create Variations section
    const variationsSection = document.createElement('section');
    variationsSection.style.marginTop = 'var(--spacing-4xl)';

    const variationsHTML = enhancement.variations.map(variation => `
        <div class="glass-card">
            <h3>${variation.name}</h3>
            <p><strong>📅 Period:</strong> ${variation.period}</p>
            <p><strong>📝 Description:</strong> ${variation.description}</p>
            <p><strong>✨ Features:</strong> ${variation.features}</p>
            ${variation.svg_path ? `
            <div style="margin-top: var(--spacing-md); text-align: center; padding: var(--spacing-md); background: rgba(0,0,0,0.02); border-radius: var(--radius-sm);">
                <img src="../../../${variation.svg_path}" alt="${variation.name}" style="max-width: 200px; height: auto;" loading="lazy">
            </div>
            ` : ''}
        </div>
    `).join('');

    variationsSection.innerHTML = `
        <h2 class="section-header">🎭 Historical Variations</h2>
        <div class="deity-grid">
            ${variationsHTML}
        </div>
    `;

    // Create Usage Contexts section
    const usageSection = document.createElement('section');
    usageSection.style.marginTop = 'var(--spacing-4xl)';

    const usageHTML = enhancement.usage_contexts.map(usage => `
        <div class="glass-card">
            <div class="deity-icon">📍</div>
            <h3>${usage.context}</h3>
            <p><strong>Location:</strong> ${usage.location}</p>
            <p><strong>Purpose:</strong> ${usage.purpose}</p>
            <p><strong>Examples:</strong> ${usage.examples}</p>
        </div>
    `).join('');

    usageSection.innerHTML = `
        <h2 class="section-header">🏛️ Usage Contexts</h2>
        <div class="deity-grid">
            ${usageHTML}
        </div>
    `;

    // Create Evolution Timeline section
    const timelineSection = document.createElement('section');
    timelineSection.style.marginTop = 'var(--spacing-4xl)';

    const timelineHTML = enhancement.evolution_timeline.map((era, index) => `
        <div class="glass-card" style="position: relative; padding-left: calc(var(--spacing-lg) + 20px);">
            <div style="position: absolute; left: var(--spacing-md); top: var(--spacing-md); width: 12px; height: 12px; background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2)); border-radius: 50%;"></div>
            ${index < enhancement.evolution_timeline.length - 1 ? `
            <div style="position: absolute; left: calc(var(--spacing-md) + 5px); top: calc(var(--spacing-md) + 12px); width: 2px; height: calc(100% - var(--spacing-md) - 12px); background: linear-gradient(180deg, var(--primary-color, #667eea), transparent);"></div>
            ` : ''}
            <h3 style="margin-top: 0;">${era.period}</h3>
            <p style="line-height: 1.7;">${era.development}</p>
        </div>
    `).join('');

    timelineSection.innerHTML = `
        <h2 class="section-header">📅 Evolution Timeline</h2>
        <div style="max-width: 900px; margin: 0 auto;">
            ${timelineHTML}
        </div>
    `;

    // Create Related Symbols section
    const relatedSection = document.createElement('section');
    relatedSection.style.marginTop = 'var(--spacing-4xl)';

    const relatedHTML = enhancement.related_symbols.map(symbol => `
        <div class="glass-card">
            <h3>${symbol.symbol}</h3>
            <p><strong>Tradition:</strong> ${symbol.tradition}</p>
            <p><strong>Relationship:</strong> ${symbol.relationship}</p>
        </div>
    `).join('');

    relatedSection.innerHTML = `
        <h2 class="section-header">🔗 Related Symbols</h2>
        <div class="deity-grid">
            ${relatedHTML}
        </div>
    `;

    // Insert sections before the interlink panel or at the end
    const interlinkPanel = main.querySelector('.interlink-panel');
    const insertBefore = interlinkPanel || main.querySelector('footer') || null;

    if (insertBefore && insertBefore.parentNode === main) {
        main.insertBefore(relatedSection, insertBefore);
        main.insertBefore(timelineSection, relatedSection);
        main.insertBefore(usageSection, timelineSection);
        main.insertBefore(variationsSection, usageSection);
        main.insertBefore(layersSection, variationsSection);
        main.insertBefore(diagramSection, layersSection);
    } else {
        main.appendChild(diagramSection);
        main.appendChild(layersSection);
        main.appendChild(variationsSection);
        main.appendChild(usageSection);
        main.appendChild(timelineSection);
        main.appendChild(relatedSection);
    }

    // Write back
    fs.writeFileSync(filePath, dom.serialize(), 'utf-8');
    console.log(`   ✅ Enhanced with ${enhancement.meaning_layers.length} layers, ${enhancement.variations.length} variations`);
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🔮 AGENT 9: Symbol Enhancement Script');
    console.log('======================================\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    // Find all symbol files
    const firebaseDir = path.join(__dirname, '..', 'FIREBASE', 'mythos');
    const symbolFiles = [];

    // Scan for symbol files
    function scanForSymbols(dir) {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && item === 'symbols') {
                const symbolDir = fullPath;
                const files = fs.readdirSync(symbolDir);
                for (const file of files) {
                    if (file.endsWith('.html') && file !== 'index.html') {
                        symbolFiles.push(path.join(symbolDir, file));
                    }
                }
            } else if (stat.isDirectory()) {
                scanForSymbols(fullPath);
            }
        }
    }

    scanForSymbols(firebaseDir);

    console.log(`📊 Found ${symbolFiles.length} symbol files\n`);

    if (!dryRun) {
        let enhanced = 0;
        symbolFiles.forEach(file => {
            const fileName = path.basename(file, '.html');
            if (SYMBOL_ENHANCEMENTS[fileName]) {
                enhanceSymbolPage(file);
                enhanced++;
            }
        });

        console.log(`\n✨ Enhanced ${enhanced} symbol pages`);
    } else {
        console.log('Available enhancements:');
        Object.keys(SYMBOL_ENHANCEMENTS).forEach(key => {
            console.log(`  - ${key}`);
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = { enhanceSymbolPage, SYMBOL_ENHANCEMENTS };

#!/usr/bin/env node
/**
 * AGENT 9: Text Enhancement Script
 *
 * Enhances text pages with:
 * - structure_diagram SVG path (book/scroll structure)
 * - themes_visualization SVG (key themes as diagram)
 * - chapter_summary array
 * - key_passages array (important quotes with context)
 * - cross_references array (related texts)
 * - historical_context panel
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Text enhancement data
const TEXT_ENHANCEMENTS = {
    'amduat': {
        structure_diagram: 'diagrams/texts/amduat-structure.svg',
        themes_visualization: 'diagrams/texts/amduat-themes.svg',
        chapter_summary: [
            { chapter: 'Hour 1', title: 'Entry into the Underworld', summary: 'Ra enters as Auf-Ra (ram-headed), deceased join the solar barque, greeted by deities of the first region.' },
            { chapter: 'Hour 2', title: 'The Wernes Region', summary: 'Domain of Osiris. Ra distributes offerings to the blessed dead who dwell here.' },
            { chapter: 'Hour 3', title: 'The Waters', summary: 'Ra\'s barque towed through shallow waters. Osiris judges failed souls.' },
            { chapter: 'Hour 4', title: 'Difficult Passages', summary: 'Special knowledge of roads and gates required. Guardian serpents bar the way.' },
            { chapter: 'Hour 5', title: 'Tomb of Osiris', summary: 'Ra visits Osiris\' tomb in the deepest Duat. Their ba-souls unite briefly - key theological moment.' },
            { chapter: 'Hour 6', title: 'The Torments', summary: 'Solar barque towed by deities. The damned suffer torments, enemies of Ra punished.' },
            { chapter: 'Hour 7', title: 'Battle with Apep', summary: 'CRISIS HOUR: Apep attacks to swallow the sun. Set, Isis, defenders battle serpent. Nadir of night.' },
            { chapter: 'Hour 8', title: 'Ascent Begins', summary: 'After defeating Apep, Ra begins ascent. Clothing and adornments prepared for rebirth.' },
            { chapter: 'Hour 9', title: 'Transformation', summary: 'Justified dead receive kas (life forces), transform into akh-spirits.' },
            { chapter: 'Hour 10', title: 'Waters of Nun', summary: 'Solar barque enters primordial waters of Nun for regeneration.' },
            { chapter: 'Hour 11', title: 'Preparation for Rebirth', summary: 'Bodies of justified dead reassemble. Ra transforms from Auf-Ra to Khepri (scarab).' },
            { chapter: 'Hour 12', title: 'Dawn/Resurrection', summary: 'Ra emerges as Khepri from eastern horizon. Justified dead resurrected. Nut gives birth to sun.' }
        ],
        key_passages: [
            {
                passage: 'The union of Ra and Osiris in Hour 5',
                context: 'The ba-souls of Ra and Osiris merge in the deepest part of the Duat',
                significance: 'Unites solar and chthonic theology - resurrection through both solar rebirth and Osirian resurrection',
                location: 'Hour 5'
            },
            {
                passage: 'The defeat of Apep in Hour 7',
                context: 'The chaos serpent attempts to swallow the sun and end creation',
                significance: 'Eternal struggle between ma\'at (order) and isfet (chaos). Without this victory, dawn cannot come.',
                location: 'Hour 7'
            },
            {
                passage: 'Transformation to Khepri in Hour 12',
                context: 'Ra metamorphoses from aged ram-headed Auf-Ra to youthful scarab Khepri',
                significance: 'Symbol of death-rebirth cycle. Scarab represents self-generation and eternal renewal.',
                location: 'Hour 12'
            },
            {
                passage: 'The justified dead emerging with Ra',
                context: 'Those who passed judgment are reborn alongside the sun god',
                significance: 'Promises eternal life through identification with Ra\'s nightly journey',
                location: 'Hour 12'
            }
        ],
        cross_references: [
            { text: 'Book of Gates', relationship: 'Parallel underworld text emphasizing the twelve gates', tradition: 'Egyptian' },
            { text: 'Book of the Dead', relationship: 'Complementary funerary text with spells for the deceased', tradition: 'Egyptian' },
            { text: 'Book of Caverns', relationship: 'Focuses on caverns and punishment in the underworld', tradition: 'Egyptian' },
            { text: 'Descent of Inanna', relationship: 'Similar underworld journey narrative', tradition: 'Sumerian' },
            { text: 'Bardo Thodol (Tibetan Book of the Dead)', relationship: 'Comparable guide through death realms', tradition: 'Buddhist' }
        ],
        historical_context: {
            period: 'New Kingdom (c. 1550-1070 BCE)',
            earliest_version: 'Tomb of Thutmose I (18th Dynasty, c. 1500 BCE)',
            use: 'Inscribed in royal tombs of the Valley of the Kings',
            decline: 'Replaced by later funerary texts in Late Period',
            rediscovery: '19th-20th century Egyptology',
            significance: 'Most complete guide to Egyptian underworld cosmology'
        }
    },

    'emerald-tablet': {
        structure_diagram: 'diagrams/texts/emerald-tablet-structure.svg',
        themes_visualization: 'diagrams/texts/emerald-tablet-themes.svg',
        chapter_summary: [
            { chapter: 'Opening', title: 'True Without Falsehood', summary: 'Declaration of absolute truth and certainty of the teachings.' },
            { chapter: 'Core Axiom', title: 'As Above, So Below', summary: 'The famous principle of correspondence between macrocosm and microcosm.' },
            { chapter: 'Unity', title: 'The One Thing', summary: 'All things originate from the One by meditation of the One.' },
            { chapter: 'Cosmic Parents', title: 'Sun and Moon', summary: 'The Sun is the father, the Moon the mother, carried by Wind, nourished by Earth.' },
            { chapter: 'The Great Work', title: 'Separation and Reunion', summary: 'Separate earth from fire, subtle from gross, with great industry.' },
            { chapter: 'Ascent and Descent', title: 'Power of Above and Below', summary: 'Ascends from earth to heaven, descends again to earth, receives power of above and below.' },
            { chapter: 'Victory', title: 'Overcoming All Things', summary: 'Thus you shall have the glory of the whole world, all obscurity shall flee from you.' },
            { chapter: 'Completion', title: 'The Father of All Works', summary: 'This is the strength of all strength, overcoming every subtle thing, penetrating every solid.' },
            { chapter: 'Conclusion', title: 'Hermes Trismegistus', summary: 'Authorship claim and invitation to understand the operation of the Sun.' }
        ],
        key_passages: [
            {
                passage: 'As above, so below; as below, so above',
                context: 'The fundamental principle of hermetic philosophy',
                significance: 'Establishes correspondence between celestial and terrestrial, spiritual and material, macrocosm and microcosm',
                location: 'Core Axiom'
            },
            {
                passage: 'The Sun is its father, the Moon its mother',
                context: 'Description of the primordial substance',
                significance: 'Alchemical symbolism: solar = active principle, lunar = receptive principle',
                location: 'Cosmic Parents'
            },
            {
                passage: 'Separate the earth from the fire, the subtle from the gross',
                context: 'Instruction for the Great Work',
                significance: 'Core alchemical operation: purification through separation and refinement',
                location: 'The Great Work'
            },
            {
                passage: 'It ascends from earth to heaven and descends again to earth',
                context: 'The cyclical process of transformation',
                significance: 'Solve et coagula - dissolution and coagulation, the alchemical cycle',
                location: 'Ascent and Descent'
            }
        ],
        cross_references: [
            { text: 'Corpus Hermeticum', relationship: 'Larger body of Hermetic wisdom', tradition: 'Hermetic' },
            { text: 'Tabula Smaragdina (original Latin)', relationship: 'Medieval Latin translation', tradition: 'Hermetic' },
            { text: 'Sefer Yetzirah', relationship: 'Jewish mystical text with similar cosmology', tradition: 'Jewish Kabbalah' },
            { text: 'Tao Te Ching', relationship: 'Similar paradoxical wisdom about unity and duality', tradition: 'Taoist' },
            { text: 'Rosarium Philosophorum', relationship: 'Alchemical text expanding Emerald Tablet principles', tradition: 'Alchemical' }
        ],
        historical_context: {
            period: 'Original: Uncertain (attributed to ancient Egypt); Earliest Arabic: 6th-8th century CE; Latin: 12th century',
            earliest_version: 'Arabic texts attributed to Balinas (Apollonius of Tyana)',
            use: 'Foundation text of Western alchemy and Hermeticism',
            decline: 'Never declined; continuously studied through Middle Ages, Renaissance, to present',
            rediscovery: 'Renaissance Hermetic revival; 19th-20th century occult movements',
            significance: 'Most influential alchemical text in Western esoteric tradition'
        }
    },

    'sefer-yetzirah': {
        structure_diagram: 'diagrams/texts/sefer-yetzirah-structure.svg',
        themes_visualization: 'diagrams/texts/sefer-yetzirah-themes.svg',
        chapter_summary: [
            { chapter: 'Chapter 1', title: 'The 32 Paths of Wisdom', summary: 'Introduction to 10 Sefirot (emanations) and 22 letters of Hebrew alphabet as paths of creation.' },
            { chapter: 'Chapter 2', title: 'The Letters', summary: 'Detailed explanation of 22 letters: 3 mothers, 7 doubles, 12 simples.' },
            { chapter: 'Chapter 3', title: 'The Mother Letters', summary: 'Aleph, Mem, Shin - representing Air, Water, Fire; foundational elements.' },
            { chapter: 'Chapter 4', title: 'The Double Letters', summary: 'Seven letters with dual pronunciation, creating opposites (life/death, wisdom/folly, etc.).' },
            { chapter: 'Chapter 5', title: 'The Simple Letters', summary: 'Twelve letters corresponding to months, zodiac signs, organs, directions.' },
            { chapter: 'Chapter 6', title: 'The Sefirot', summary: 'Ten Sefirot as divine emanations forming the structure of reality and consciousness.' }
        ],
        key_passages: [
            {
                passage: 'Ten Sefirot of Nothingness, twenty-two letters of foundation',
                context: 'Opening statement of the cosmological structure',
                significance: 'Establishes Hebrew alphabet as the building blocks of creation through divine speech',
                location: 'Chapter 1'
            },
            {
                passage: 'Three Mothers: Aleph, Mem, Shin',
                context: 'The foundational triadic structure',
                significance: 'Represents Air (equilibrium), Water (cold/mercy), Fire (heat/judgment) - basis of all creation',
                location: 'Chapter 3'
            },
            {
                passage: 'He made the letter Aleph king over breath',
                context: 'Assignment of cosmic, temporal, and human correspondences',
                significance: 'Each letter governs a sphere, time period, and body part - as above, so below',
                location: 'Chapter 3'
            },
            {
                passage: 'Seven Doubles: Bet, Gimel, Dalet, Kaf, Peh, Resh, Tav',
                context: 'Letters representing polarities',
                significance: 'Life/Death, Peace/War, Wisdom/Folly, Wealth/Poverty, Grace/Ugliness, Fertility/Desolation, Dominion/Servitude',
                location: 'Chapter 4'
            }
        ],
        cross_references: [
            { text: 'Zohar', relationship: 'Later Kabbalistic development of Sefer Yetzirah concepts', tradition: 'Jewish Kabbalah' },
            { text: 'Bahir', relationship: 'Early Kabbalistic text expanding on Sefirot', tradition: 'Jewish Kabbalah' },
            { text: 'Emerald Tablet', relationship: 'Hermetic text with similar correspondence principles', tradition: 'Hermetic' },
            { text: 'Tao Te Ching', relationship: 'Eastern philosophy of cosmic generation from unity', tradition: 'Taoist' },
            { text: 'Corpus Hermeticum', relationship: 'Hermetic wisdom on divine emanation', tradition: 'Hermetic' }
        ],
        historical_context: {
            period: 'Composition debated: 2nd-6th century CE',
            earliest_version: 'Earliest manuscripts: 10th century CE',
            use: 'Foundation of Jewish mysticism and Kabbalah; used in meditation and golem creation lore',
            decline: 'Never declined; continuously studied in Jewish mystical tradition',
            rediscovery: 'Renaissance Christian Kabbalah; modern occult and New Age movements',
            significance: 'Oldest known Kabbalistic text, foundation of letter mysticism'
        }
    }
};

/**
 * Enhance a text HTML file
 */
function enhanceTextPage(filePath) {
    console.log(`\n📜 Enhancing text: ${filePath}`);

    // Read file
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract text name from filename
    const fileName = path.basename(filePath, '.html');
    const enhancement = TEXT_ENHANCEMENTS[fileName];

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

    // Create Structure Visualization section
    const structureSection = document.createElement('section');
    structureSection.style.marginTop = 'var(--spacing-4xl)';
    structureSection.innerHTML = `
        <h2 class="section-header">📐 Text Structure & Themes</h2>
        <div class="ritual-diagrams" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: var(--spacing-lg); margin: var(--spacing-lg) 0;">
            <div class="glass-card">
                <h3>Structure Diagram</h3>
                <img src="../../../${enhancement.structure_diagram}" alt="Text Structure" style="width: 100%; height: auto; border-radius: var(--radius-md);" loading="lazy">
                <p style="margin-top: var(--spacing-md); font-size: 0.9rem; color: var(--text-muted, #666);">Visual representation of the text's organization and flow</p>
            </div>
            <div class="glass-card">
                <h3>Key Themes</h3>
                <img src="../../../${enhancement.themes_visualization}" alt="Themes Visualization" style="width: 100%; height: auto; border-radius: var(--radius-md);" loading="lazy">
                <p style="margin-top: var(--spacing-md); font-size: 0.9rem; color: var(--text-muted, #666);">Central themes and their relationships</p>
            </div>
        </div>
    `;

    // Create Chapter Summary section
    const chaptersSection = document.createElement('section');
    chaptersSection.style.marginTop = 'var(--spacing-4xl)';

    const chaptersHTML = enhancement.chapter_summary.map((chapter, index) => `
        <div class="glass-card">
            <div style="display: flex; align-items: flex-start; gap: var(--spacing-md); margin-bottom: var(--spacing-sm);">
                <div style="background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2)); color: white; min-width: 45px; height: 45px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem;">
                    ${index + 1}
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 var(--spacing-xs) 0;">${chapter.title}</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted, #666); font-style: italic;">${chapter.chapter}</p>
                </div>
            </div>
            <p style="line-height: 1.7;">${chapter.summary}</p>
        </div>
    `).join('');

    chaptersSection.innerHTML = `
        <h2 class="section-header">📖 Chapter Summary</h2>
        <div class="deity-grid">
            ${chaptersHTML}
        </div>
    `;

    // Create Key Passages section
    const passagesSection = document.createElement('section');
    passagesSection.style.marginTop = 'var(--spacing-4xl)';

    const passagesHTML = enhancement.key_passages.map(passage => `
        <div class="glass-card" style="border-left: 4px solid var(--primary-color, #667eea);">
            <blockquote style="margin: 0 0 var(--spacing-md) 0; padding-left: var(--spacing-md); border-left: 3px solid var(--primary-color, #667eea); font-style: italic; font-size: 1.1rem; color: var(--text-primary, #333);">
                "${passage.passage}"
            </blockquote>
            <p><strong>📍 Location:</strong> ${passage.location}</p>
            <p><strong>🔍 Context:</strong> ${passage.context}</p>
            <p><strong>⭐ Significance:</strong> ${passage.significance}</p>
        </div>
    `).join('');

    passagesSection.innerHTML = `
        <h2 class="section-header">💎 Key Passages</h2>
        <div class="deity-grid">
            ${passagesHTML}
        </div>
    `;

    // Create Historical Context section
    const contextSection = document.createElement('section');
    contextSection.style.marginTop = 'var(--spacing-4xl)';
    contextSection.innerHTML = `
        <h2 class="section-header">🏛️ Historical Context</h2>
        <div class="deity-grid">
            <div class="glass-card">
                <div class="deity-icon">📅</div>
                <h3>Dating</h3>
                <p><strong>Period:</strong> ${enhancement.historical_context.period}</p>
                <p><strong>Earliest Version:</strong> ${enhancement.historical_context.earliest_version}</p>
            </div>
            <div class="glass-card">
                <div class="deity-icon">📚</div>
                <h3>Historical Use</h3>
                <p>${enhancement.historical_context.use}</p>
                ${enhancement.historical_context.decline ? `<p style="margin-top: var(--spacing-sm);"><strong>Decline:</strong> ${enhancement.historical_context.decline}</p>` : ''}
            </div>
            <div class="glass-card">
                <div class="deity-icon">🔍</div>
                <h3>Modern Study</h3>
                <p><strong>Rediscovery:</strong> ${enhancement.historical_context.rediscovery}</p>
                <p style="margin-top: var(--spacing-sm);"><strong>Significance:</strong> ${enhancement.historical_context.significance}</p>
            </div>
        </div>
    `;

    // Create Cross-References section
    const crossRefSection = document.createElement('section');
    crossRefSection.style.marginTop = 'var(--spacing-4xl)';

    const crossRefsHTML = enhancement.cross_references.map(ref => `
        <div class="glass-card">
            <h3>${ref.text}</h3>
            <p><strong>Tradition:</strong> ${ref.tradition}</p>
            <p><strong>Relationship:</strong> ${ref.relationship}</p>
        </div>
    `).join('');

    crossRefSection.innerHTML = `
        <h2 class="section-header">🔗 Cross-References</h2>
        <div class="deity-grid">
            ${crossRefsHTML}
        </div>
    `;

    // Insert sections before the interlink panel or at the end
    const interlinkPanel = main.querySelector('.interlink-panel');
    const insertBefore = interlinkPanel || main.querySelector('footer') || null;

    if (insertBefore && insertBefore.parentNode === main) {
        main.insertBefore(crossRefSection, insertBefore);
        main.insertBefore(contextSection, crossRefSection);
        main.insertBefore(passagesSection, contextSection);
        main.insertBefore(chaptersSection, passagesSection);
        main.insertBefore(structureSection, chaptersSection);
    } else {
        main.appendChild(structureSection);
        main.appendChild(chaptersSection);
        main.appendChild(passagesSection);
        main.appendChild(contextSection);
        main.appendChild(crossRefSection);
    }

    // Write back
    fs.writeFileSync(filePath, dom.serialize(), 'utf-8');
    console.log(`   ✅ Enhanced with ${enhancement.chapter_summary.length} chapters, ${enhancement.key_passages.length} key passages`);
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🔮 AGENT 9: Text Enhancement Script');
    console.log('====================================\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    // Find all text files
    const firebaseDir = path.join(__dirname, '..', 'FIREBASE');
    const magicDir = path.join(firebaseDir, 'magic', 'texts');
    const mythosDir = path.join(firebaseDir, 'mythos');

    const textFiles = [];

    // Scan magic/texts
    if (fs.existsSync(magicDir)) {
        const files = fs.readdirSync(magicDir);
        for (const file of files) {
            if (file.endsWith('.html') && file !== 'index.html') {
                textFiles.push(path.join(magicDir, file));
            }
        }
    }

    // Scan mythos/*/texts
    function scanForTexts(dir) {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && item === 'texts') {
                const textDir = fullPath;
                const files = fs.readdirSync(textDir);
                for (const file of files) {
                    if (file.endsWith('.html') && file !== 'index.html') {
                        textFiles.push(path.join(textDir, file));
                    }
                }
            } else if (stat.isDirectory()) {
                scanForTexts(fullPath);
            }
        }
    }

    scanForTexts(mythosDir);

    console.log(`📊 Found ${textFiles.length} text files\n`);

    if (!dryRun) {
        let enhanced = 0;
        textFiles.forEach(file => {
            const fileName = path.basename(file, '.html');
            if (TEXT_ENHANCEMENTS[fileName]) {
                enhanceTextPage(file);
                enhanced++;
            }
        });

        console.log(`\n✨ Enhanced ${enhanced} text pages`);
    } else {
        console.log('Available enhancements:');
        Object.keys(TEXT_ENHANCEMENTS).forEach(key => {
            console.log(`  - ${key}`);
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = { enhanceTextPage, TEXT_ENHANCEMENTS };

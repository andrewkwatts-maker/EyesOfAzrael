#!/usr/bin/env node
/**
 * AGENT 9: Ritual Enhancement Script
 *
 * Enhances ritual pages with:
 * - procedure_diagram SVG path (step-by-step visual)
 * - participant_layout SVG (where people stand/sit)
 * - tool_arrangement SVG (ritual tools placement)
 * - steps array (detailed step-by-step instructions)
 * - timing_info (when performed, duration)
 * - preparation_requirements array
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Ritual enhancement data
const RITUAL_ENHANCEMENTS = {
    'eleusinian-mysteries': {
        procedure_diagram: 'diagrams/rituals/eleusinian-procedure.svg',
        participant_layout: 'diagrams/rituals/eleusinian-layout.svg',
        tool_arrangement: 'diagrams/rituals/eleusinian-tools.svg',
        steps: [
            { step: 1, name: 'Proclamation', action: 'Hierophant announces opening at Painted Stoa', duration: '1 day', location: 'Athens' },
            { step: 2, name: 'Sea Purification', action: 'Initiates bathe in sea with piglets', duration: '1 day', location: 'Phaleron Bay' },
            { step: 3, name: 'Sacrifice Day', action: 'Sacrifice pigs, offer prayers', duration: '1 day', location: 'Athens' },
            { step: 4, name: 'Rest Day', action: 'Late arrivals join, preparations', duration: '1 day', location: 'Athens' },
            { step: 5, name: 'Great Procession', action: 'Sacred Way march from Athens to Eleusis', duration: '1 day', location: 'Sacred Way (14 miles)' },
            { step: 6, name: 'Fasting', action: 'Fast in imitation of Demeter, drink kykeon', duration: '1 day', location: 'Eleusis' },
            { step: 7, name: 'Secret Rites', action: 'All-night initiation in Telesterion', duration: '1 night', location: 'Telesterion Hall' },
            { step: 8, name: 'Libations', action: 'Pour water vessels to east and west', duration: '1 day', location: 'Eleusis' },
            { step: 9, name: 'Dismissal', action: 'Return to Athens as transformed initiates', duration: '1 day', location: 'Athens' }
        ],
        timing_info: {
            season: 'Early Fall',
            month: 'Boedromion (September-October)',
            dates: '15th-23rd of month',
            duration: '9 days total',
            frequency: 'Annual',
            astronomical: 'Harvest season, after autumn equinox'
        },
        preparation_requirements: [
            'Must have completed Lesser Mysteries in spring',
            'Ritual purity (no murder, ritual cleanliness)',
            'Greek language proficiency',
            'Sacrificial piglet',
            'White robes and myrtle crown',
            'Torch for procession',
            'Kykeon ingredients (barley, water, pennyroyal)',
            'Oath of secrecy'
        ]
    },

    'akitu': {
        procedure_diagram: 'diagrams/rituals/akitu-procedure.svg',
        participant_layout: 'diagrams/rituals/akitu-layout.svg',
        tool_arrangement: 'diagrams/rituals/akitu-tools.svg',
        steps: [
            { step: 1, name: 'Temple Opening', action: 'Esagila temple opened, priests purify', duration: '1 day', location: 'Esagila Temple' },
            { step: 2, name: 'Enuma Elish Recitation', action: 'Creation epic recited in full', duration: '1 day', location: 'Temple inner sanctum' },
            { step: 3, name: 'Gods Arrive', action: 'Statues of gods arrive by boat', duration: '1 day', location: 'Euphrates River docks' },
            { step: 4, name: 'Royal Humiliation', action: 'King stripped of regalia, slapped by priest', duration: 'Morning', location: 'Before Marduk statue' },
            { step: 5, name: 'King Reinstated', action: 'King receives symbols of power back', duration: 'Afternoon', location: 'Throne room' },
            { step: 6, name: 'Determination of Fates', action: 'Gods meet to decree destinies for new year', duration: '1 day', location: 'Chamber of Fates' },
            { step: 7, name: 'Sacred Procession', action: 'Marduk statue paraded on Processional Way', duration: '1 day', location: 'Processional Way to Bit Akitu' },
            { step: 8, name: 'Divine Combat Reenactment', action: 'Ritual battle of Marduk vs Tiamat performed', duration: '1 day', location: 'Bit Akitu shrine' },
            { step: 9, name: 'Sacred Marriage', action: 'King performs hieros gamos with high priestess', duration: '1 night', location: 'Temple ziggurat summit' },
            { step: 10, name: 'Return Procession', action: 'Gods return to Esagila', duration: '1 day', location: 'Back to Babylon' },
            { step: 11, name: 'Festival Banquet', action: 'Royal feast for gods and people', duration: '1 day', location: 'Palace and city' }
        ],
        timing_info: {
            season: 'Spring',
            month: 'Nisanu (March-April)',
            dates: '1st-11th of month',
            duration: '11 days',
            frequency: 'Annual',
            astronomical: 'Spring equinox, new year'
        },
        preparation_requirements: [
            'Purification of temples for one month prior',
            'Preparation of god statues and regalia',
            'Brewing of festival beer',
            'Baking of ritual bread',
            'Royal garments and crown',
            'Sacrificial animals (bulls, sheep)',
            'Incense and offerings',
            'Musicians and chanters',
            'Boats for river procession'
        ]
    },

    'blot': {
        procedure_diagram: 'diagrams/rituals/blot-procedure.svg',
        participant_layout: 'diagrams/rituals/blot-layout.svg',
        tool_arrangement: 'diagrams/rituals/blot-tools.svg',
        steps: [
            { step: 1, name: 'Sacred Space Preparation', action: 'Consecrate the hof (temple) or outdoor vé', duration: '30 minutes', location: 'Hof or sacred grove' },
            { step: 2, name: 'Hallowing', action: 'Goði hallows space with hammer sign', duration: '10 minutes', location: 'Altar area' },
            { step: 3, name: 'Animal Selection', action: 'Choose sacrifice (horse, boar, ox)', duration: '15 minutes', location: 'Pen area' },
            { step: 4, name: 'Invocation', action: 'Invoke the god (Odin, Thor, Freyr)', duration: '20 minutes', location: 'Before altar' },
            { step: 5, name: 'Sacrifice', action: 'Slaughter animal, collect blood in hlautbolli', duration: '30 minutes', location: 'Sacrifice stone' },
            { step: 6, name: 'Blood Sprinkling', action: 'Sprinkle blood on altar, walls, participants using hlautteinn', duration: '20 minutes', location: 'Throughout space' },
            { step: 7, name: 'Offering', action: 'Present meat and organs to gods', duration: '15 minutes', location: 'Altar' },
            { step: 8, name: 'Communal Feast', action: 'Cook and consume blessed meat', duration: '2-3 hours', location: 'Feast hall' },
            { step: 9, name: 'Toasts', action: 'Drink from horn with toasts to gods, ancestors', duration: '1 hour', location: 'Feast hall' },
            { step: 10, name: 'Closing', action: 'Thank gods, close sacred space', duration: '10 minutes', location: 'Altar' }
        ],
        timing_info: {
            season: 'Multiple throughout year',
            month: 'Three major blóts: Winter (Yule), Spring (Summer finding), Fall (Winter nights)',
            dates: 'Seasonal transitions',
            duration: '4-6 hours per ritual',
            frequency: 'At least 3 times yearly, plus special occasions',
            astronomical: 'Solstices, equinoxes, seasonal markers'
        },
        preparation_requirements: [
            'Consecrated space (hof or vé)',
            'Sacrificial animal (horse, boar, ox, goat)',
            'Hlautbolli (blood bowl)',
            'Hlautteinn (blood sprinkler - branch or special wand)',
            'Altar stone or wooden altar',
            'Mead or ale for toasts',
            'Drinking horn',
            'Cooking equipment for feast',
            'Ritual cleanliness'
        ]
    },

    'dionysian-rites': {
        procedure_diagram: 'diagrams/rituals/dionysian-procedure.svg',
        participant_layout: 'diagrams/rituals/dionysian-layout.svg',
        tool_arrangement: 'diagrams/rituals/dionysian-tools.svg',
        steps: [
            { step: 1, name: 'Assembly', action: 'Maenads and followers gather at twilight', duration: '30 minutes', location: 'Mountain slope or forest' },
            { step: 2, name: 'Donning Sacred Garb', action: 'Wear fawn skins, ivy crowns, carry thyrsoi', duration: '20 minutes', location: 'Preparation area' },
            { step: 3, name: 'Wine Libation', action: 'Pour wine offerings to Dionysus', duration: '15 minutes', location: 'Altar or sacred tree' },
            { step: 4, name: 'Invocation', action: 'Call upon Dionysus with hymns and cries', duration: '20 minutes', location: 'Circle around altar' },
            { step: 5, name: 'Ecstatic Dance', action: 'Wild dancing to drums and flutes', duration: '1-2 hours', location: 'Sacred clearing' },
            { step: 6, name: 'Wine Consumption', action: 'Ritual drinking to achieve divine madness', duration: '30 minutes', location: 'Throughout dancing' },
            { step: 7, name: 'Sparagmos (if performed)', action: 'Ritual tearing of sacrifice (goat or bull)', duration: '30 minutes', location: 'Sacrifice area' },
            { step: 8, name: 'Omophagia (if performed)', action: 'Consumption of raw flesh', duration: '20 minutes', location: 'Immediately after sparagmos' },
            { step: 9, name: 'Divine Possession', action: 'Achieve entheos - god within', duration: 'Variable', location: 'Throughout ritual' },
            { step: 10, name: 'Return', action: 'Gradual return to normal consciousness', duration: '1 hour', location: 'Sacred space' }
        ],
        timing_info: {
            season: 'Winter',
            month: 'Primarily winter months, especially during Lenaia festival',
            dates: 'New moon nights preferred',
            duration: '4-8 hours (dusk to dawn)',
            frequency: 'Monthly or seasonal',
            astronomical: 'Night rituals, new moon'
        },
        preparation_requirements: [
            'Fawn skin or animal hide garments',
            'Ivy crowns and garlands',
            'Thyrsoi (fennel staffs topped with pine cones)',
            'Wine in kraters',
            'Drums (tympana)',
            'Flutes (auloi)',
            'Torches for night procession',
            'Sacrificial animal (goat or bull) if performing sparagmos',
            'Ritual purity and fasting beforehand'
        ]
    },

    'mummification': {
        procedure_diagram: 'diagrams/rituals/mummification-procedure.svg',
        participant_layout: 'diagrams/rituals/mummification-layout.svg',
        tool_arrangement: 'diagrams/rituals/mummification-tools.svg',
        steps: [
            { step: 1, name: 'Body Washing', action: 'Wash corpse with palm wine and Nile water', duration: '1 hour', location: 'Ibu (purification tent)' },
            { step: 2, name: 'Brain Removal', action: 'Extract brain through nose with hook', duration: '2 hours', location: 'Wabet (place of embalming)' },
            { step: 3, name: 'Organ Removal', action: 'Make incision, remove liver, lungs, stomach, intestines', duration: '3 hours', location: 'Wabet' },
            { step: 4, name: 'Organ Preservation', action: 'Dry and store organs in canopic jars', duration: '1 hour', location: 'Wabet' },
            { step: 5, name: 'Desiccation', action: 'Cover body in natron salt', duration: '40 days', location: 'Wabet' },
            { step: 6, name: 'Body Stuffing', action: 'Fill cavity with linen, sawdust, sand', duration: '2 hours', location: 'Wabet' },
            { step: 7, name: 'Wrapping Begins', action: 'Wrap fingers, toes, limbs individually', duration: '3 days', location: 'Wabet' },
            { step: 8, name: 'Amulet Placement', action: 'Place protective amulets between linen layers', duration: '2 days', location: 'Wabet' },
            { step: 9, name: 'Final Wrapping', action: 'Complete body wrapping with resin-soaked linen', duration: '10 days', location: 'Wabet' },
            { step: 10, name: 'Mask Application', action: 'Place funerary mask over head', duration: '1 hour', location: 'Wabet' },
            { step: 11, name: 'Opening of the Mouth', action: 'Ritual to restore senses to deceased', duration: '2 hours', location: 'Tomb entrance' },
            { step: 12, name: 'Funeral Procession', action: 'Transport to tomb with mourners', duration: '4 hours', location: 'City to necropolis' },
            { step: 13, name: 'Tomb Sealing', action: 'Place in sarcophagus, seal tomb', duration: '2 hours', location: 'Tomb chamber' }
        ],
        timing_info: {
            season: 'Any time (upon death)',
            month: 'N/A',
            dates: 'Begins immediately after death',
            duration: '70 days total',
            frequency: 'Once per person',
            astronomical: 'No specific astronomical timing'
        },
        preparation_requirements: [
            'Natron salt (large quantities)',
            'Palm wine for washing',
            'Nile water for purification',
            'Bronze hook for brain extraction',
            'Bronze knife for incision',
            'Four canopic jars with deity-headed lids',
            'Linen bandages (hundreds of yards)',
            'Resin and oils',
            'Protective amulets (scarab, ankh, djed, etc.)',
            'Funerary mask (gold for royalty)',
            'Sawdust, sand, linen for stuffing',
            'Trained embalmers (priests)',
            'Ritual tools for Opening of the Mouth ceremony'
        ]
    },

    'salat': {
        procedure_diagram: 'diagrams/rituals/salat-procedure.svg',
        participant_layout: 'diagrams/rituals/salat-layout.svg',
        tool_arrangement: 'diagrams/rituals/salat-tools.svg',
        steps: [
            { step: 1, name: 'Wudu (Ablution)', action: 'Wash hands, mouth, nose, face, arms, head, feet', duration: '5 minutes', location: 'Water source' },
            { step: 2, name: 'Face Qibla', action: 'Orient toward Mecca (Kaaba)', duration: '1 minute', location: 'Prayer space' },
            { step: 3, name: 'Intention (Niyyah)', action: 'Form mental intention for specific prayer', duration: '10 seconds', location: 'Prayer position' },
            { step: 4, name: 'Takbir', action: 'Raise hands, say "Allahu Akbar"', duration: '5 seconds', location: 'Standing (Qiyam)' },
            { step: 5, name: 'Recite Al-Fatiha', action: 'Recite opening chapter of Quran', duration: '30 seconds', location: 'Standing (Qiyam)' },
            { step: 6, name: 'Recite Additional Verses', action: 'Recite additional Quranic passages', duration: '30 seconds', location: 'Standing (Qiyam)' },
            { step: 7, name: 'Ruku (Bowing)', action: 'Bow with hands on knees, glorify Allah', duration: '10 seconds', location: 'Bowing position' },
            { step: 8, name: 'Standing After Bow', action: 'Return to standing, praise Allah', duration: '5 seconds', location: 'Standing (Qiyam)' },
            { step: 9, name: 'Sujud (Prostration)', action: 'Prostrate with forehead, nose, hands, knees, toes on ground', duration: '10 seconds', location: 'Prostration' },
            { step: 10, name: 'Sitting Between Prostrations', action: 'Sit briefly between two prostrations', duration: '5 seconds', location: 'Sitting (Jalsa)' },
            { step: 11, name: 'Second Sujud', action: 'Second prostration, glorify Allah', duration: '10 seconds', location: 'Prostration' },
            { step: 12, name: 'Tashahhud', action: 'Sit and recite testimony of faith', duration: '30 seconds', location: 'Sitting (Qa\'dah)' },
            { step: 13, name: 'Taslim', action: 'Turn head right and left, saying "Peace be upon you"', duration: '5 seconds', location: 'Sitting (Qa\'dah)' }
        ],
        timing_info: {
            season: 'Year-round',
            month: 'Every day',
            dates: 'Five daily prayers',
            duration: '5-10 minutes per prayer',
            frequency: 'Five times daily: Fajr (dawn), Dhuhr (noon), Asr (afternoon), Maghrib (sunset), Isha (night)',
            astronomical: 'Tied to solar positions'
        },
        preparation_requirements: [
            'Ritual purity (wudu ablution)',
            'Clean prayer space',
            'Prayer mat (recommended)',
            'Modest clothing covering awrah',
            'Knowledge of Qibla direction (compass or mosque orientation)',
            'Memorization of Al-Fatiha and other verses',
            'Awareness of prayer times',
            'Removal of distractions'
        ]
    },

    'baptism': {
        procedure_diagram: 'diagrams/rituals/baptism-procedure.svg',
        participant_layout: 'diagrams/rituals/baptism-layout.svg',
        tool_arrangement: 'diagrams/rituals/baptism-tools.svg',
        steps: [
            { step: 1, name: 'Gathering', action: 'Congregation assembles, candidate prepared', duration: '10 minutes', location: 'Church sanctuary' },
            { step: 2, name: 'Opening Prayer', action: 'Minister invokes Holy Spirit', duration: '5 minutes', location: 'Baptismal font or pool' },
            { step: 3, name: 'Scripture Reading', action: 'Read baptism passages (Matthew 28:19, Acts 2:38)', duration: '5 minutes', location: 'Before congregation' },
            { step: 4, name: 'Renunciation of Evil', action: 'Candidate renounces Satan and sin', duration: '2 minutes', location: 'Before font' },
            { step: 5, name: 'Profession of Faith', action: 'Candidate affirms belief in Trinity', duration: '3 minutes', location: 'Before font' },
            { step: 6, name: 'Blessing of Water', action: 'Minister blesses baptismal water', duration: '2 minutes', location: 'Over font/pool' },
            { step: 7, name: 'Baptism Proper', action: 'Immersion or pouring of water with Trinitarian formula', duration: '2 minutes', location: 'In font/pool' },
            { step: 8, name: 'Anointing (optional)', action: 'Anoint with chrism oil', duration: '1 minute', location: 'Forehead' },
            { step: 9, name: 'White Garment (optional)', action: 'Clothe in white robe', duration: '1 minute', location: 'Beside font' },
            { step: 10, name: 'Candle Lighting (optional)', action: 'Light baptismal candle from Easter candle', duration: '1 minute', location: 'Altar area' },
            { step: 11, name: 'Welcome', action: 'Congregation welcomes new member', duration: '5 minutes', location: 'Sanctuary' },
            { step: 12, name: 'Closing Prayer', action: 'Blessing and dismissal', duration: '3 minutes', location: 'Sanctuary' }
        ],
        timing_info: {
            season: 'Any time (traditionally Easter Vigil preferred)',
            month: 'Any',
            dates: 'Easter Vigil, Pentecost, Epiphany, or any Sunday',
            duration: '30-45 minutes',
            frequency: 'Once per person',
            astronomical: 'Easter Vigil (night before Easter Sunday) is most traditional'
        },
        preparation_requirements: [
            'Baptismal font or pool with clean water',
            'White baptismal garment (for infant or adult)',
            'Baptismal candle',
            'Chrism oil (for anointing)',
            'Bible for scripture reading',
            'Towels for drying',
            'Catechetical preparation (for adults)',
            'Godparents/sponsors (traditionally)',
            'Minister authorized to perform sacrament',
            'Baptismal certificate'
        ]
    }
};

/**
 * Enhance a ritual HTML file
 */
function enhanceRitualPage(filePath) {
    console.log(`\n📿 Enhancing ritual: ${filePath}`);

    // Read file
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract ritual name from filename
    const fileName = path.basename(filePath, '.html');
    const enhancement = RITUAL_ENHANCEMENTS[fileName];

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

    // Create Ritual Procedure section
    const procedureSection = document.createElement('section');
    procedureSection.style.marginTop = 'var(--spacing-4xl)';
    procedureSection.innerHTML = `
        <h2 class="section-header">📋 Ritual Procedure</h2>
        <div class="ritual-diagrams" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg); margin: var(--spacing-lg) 0;">
            <div class="glass-card">
                <h3>Step-by-Step Diagram</h3>
                <img src="../../../${enhancement.procedure_diagram}" alt="Ritual Procedure Diagram" style="width: 100%; height: auto; border-radius: var(--radius-md);" loading="lazy">
            </div>
            ${enhancement.participant_layout ? `
            <div class="glass-card">
                <h3>Participant Layout</h3>
                <img src="../../../${enhancement.participant_layout}" alt="Participant Layout" style="width: 100%; height: auto; border-radius: var(--radius-md);" loading="lazy">
            </div>
            ` : ''}
            ${enhancement.tool_arrangement ? `
            <div class="glass-card">
                <h3>Tool Arrangement</h3>
                <img src="../../../${enhancement.tool_arrangement}" alt="Ritual Tools" style="width: 100%; height: auto; border-radius: var(--radius-md);" loading="lazy">
            </div>
            ` : ''}
        </div>
    `;

    // Create Steps section
    const stepsSection = document.createElement('section');
    stepsSection.style.marginTop = 'var(--spacing-4xl)';

    const stepsHTML = enhancement.steps.map(step => `
        <div class="glass-card">
            <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-sm);">
                <div style="background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2)); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
                    ${step.step}
                </div>
                <h3 style="margin: 0;">${step.name}</h3>
            </div>
            <p><strong>Action:</strong> ${step.action}</p>
            <p><strong>Duration:</strong> ${step.duration}</p>
            <p><strong>Location:</strong> ${step.location}</p>
        </div>
    `).join('');

    stepsSection.innerHTML = `
        <h2 class="section-header">🔢 Step-by-Step Instructions</h2>
        <div class="deity-grid">
            ${stepsHTML}
        </div>
    `;

    // Create Timing section
    const timingSection = document.createElement('section');
    timingSection.style.marginTop = 'var(--spacing-4xl)';
    timingSection.innerHTML = `
        <h2 class="section-header">⏰ Timing & Schedule</h2>
        <div class="deity-grid">
            <div class="glass-card">
                <div class="deity-icon">🌍</div>
                <h3>Season & Time</h3>
                <p><strong>Season:</strong> ${enhancement.timing_info.season}</p>
                <p><strong>Month:</strong> ${enhancement.timing_info.month}</p>
                <p><strong>Dates:</strong> ${enhancement.timing_info.dates}</p>
            </div>
            <div class="glass-card">
                <div class="deity-icon">⏳</div>
                <h3>Duration</h3>
                <p><strong>Total Duration:</strong> ${enhancement.timing_info.duration}</p>
                <p><strong>Frequency:</strong> ${enhancement.timing_info.frequency}</p>
            </div>
            <div class="glass-card">
                <div class="deity-icon">✨</div>
                <h3>Astronomical Timing</h3>
                <p>${enhancement.timing_info.astronomical}</p>
            </div>
        </div>
    `;

    // Create Preparation section
    const prepSection = document.createElement('section');
    prepSection.style.marginTop = 'var(--spacing-4xl)';

    const prepItems = enhancement.preparation_requirements.map(req =>
        `<li>${req}</li>`
    ).join('');

    prepSection.innerHTML = `
        <h2 class="section-header">🎒 Preparation Requirements</h2>
        <div class="glass-card" style="max-width: 900px; margin: 0 auto;">
            <ul style="margin: var(--spacing-md) 0 0 var(--spacing-xl); line-height: 2;">
                ${prepItems}
            </ul>
        </div>
    `;

    // Insert sections before the interlink panel or at the end
    const interlinkPanel = main.querySelector('.interlink-panel');
    const insertBefore = interlinkPanel || main.querySelector('footer') || null;

    if (insertBefore && insertBefore.parentNode === main) {
        main.insertBefore(prepSection, insertBefore);
        main.insertBefore(timingSection, prepSection);
        main.insertBefore(stepsSection, timingSection);
        main.insertBefore(procedureSection, stepsSection);
    } else {
        main.appendChild(procedureSection);
        main.appendChild(stepsSection);
        main.appendChild(timingSection);
        main.appendChild(prepSection);
    }

    // Write back
    fs.writeFileSync(filePath, dom.serialize(), 'utf-8');
    console.log(`   ✅ Enhanced with ${enhancement.steps.length} steps`);
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🔮 AGENT 9: Ritual Enhancement Script');
    console.log('=====================================\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    // Find all ritual files in FIREBASE
    const firebaseDir = path.join(__dirname, '..', 'FIREBASE', 'mythos');
    const ritualFiles = [];

    // Scan for ritual files
    function scanForRituals(dir) {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && item === 'rituals') {
                const ritualDir = fullPath;
                const files = fs.readdirSync(ritualDir);
                for (const file of files) {
                    if (file.endsWith('.html') && file !== 'index.html') {
                        ritualFiles.push(path.join(ritualDir, file));
                    }
                }
            } else if (stat.isDirectory()) {
                scanForRituals(fullPath);
            }
        }
    }

    scanForRituals(firebaseDir);

    console.log(`📊 Found ${ritualFiles.length} ritual files\n`);

    if (!dryRun) {
        let enhanced = 0;
        ritualFiles.forEach(file => {
            const fileName = path.basename(file, '.html');
            if (RITUAL_ENHANCEMENTS[fileName]) {
                enhanceRitualPage(file);
                enhanced++;
            }
        });

        console.log(`\n✨ Enhanced ${enhanced} ritual pages`);
    } else {
        console.log('Available enhancements:');
        Object.keys(RITUAL_ENHANCEMENTS).forEach(key => {
            console.log(`  - ${key}`);
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = { enhanceRitualPage, RITUAL_ENHANCEMENTS };

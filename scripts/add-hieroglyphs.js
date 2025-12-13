const fs = require('fs');
const path = require('path');

// Hieroglyph mapping from task description
const HIEROGLYPH_DATA = {
  'Anubis': {glyph: '𓇋𓈖𓊪𓅱𓃣', transliteration: 'jnpw'},
  'Thoth': {glyph: '𓅤𓀭', transliteration: 'ḏḥwtj'},
  'Horus': {glyph: '𓅃𓀭', transliteration: 'ḥrw'},
  'Set': {glyph: '𓃩𓁣', transliteration: 'stẖ'},
  'Bastet': {glyph: '𓎟𓏏𓏤', transliteration: 'bꜣstt'},
  'Hathor': {glyph: '𓉡𓏏𓂋', transliteration: 'ḥwt-ḥr'},
  'Maat': {glyph: '𓐙𓏏𓁐', transliteration: 'mꜣꜥt'},
  'Neith': {glyph: '𓏏𓈖𓏏𓁐', transliteration: 'nt'},
  'Nephthys': {glyph: '𓉠𓏏𓆇', transliteration: 'nbt-ḥwt'},
  'Nut': {glyph: '𓏌𓏏𓇯', transliteration: 'nwt'},
  'Geb': {glyph: '𓎼𓃀𓃀', transliteration: 'gb'},
  'Ptah': {glyph: '𓊪𓏏𓎛', transliteration: 'ptḥ'},
  'Sekhmet': {glyph: '𓌂𓐍𓏏𓏯', transliteration: 'sḫmt'},
  'Sobek': {glyph: '𓋴𓃀𓎡', transliteration: 'sbk'},
  'Amun': {glyph: '𓇋𓏠𓈖', transliteration: 'jmn'},
  'Atum': {glyph: '𓇋𓏏𓅓', transliteration: 'jtm'},
  'Tefnut': {glyph: '𓏏𓆑𓈖𓏏', transliteration: 'tfnt'},
  'Satis': {glyph: '𓌂𓏏', transliteration: 'sṯt'},
  'Montu': {glyph: '𓏥𓈖𓏏𓅱', transliteration: 'mntw'},
  'Anhur': {glyph: '𓋴𓈖𓉔𓂋', transliteration: 'ꜥnḥr'},
  'Apep': {glyph: '𓆓𓊪𓊪', transliteration: 'ꜥpp'}
};

// Map filename to deity name
const FILE_TO_DEITY = {
  'anubis.html': 'Anubis',
  'thoth.html': 'Thoth',
  'horus.html': 'Horus',
  'set.html': 'Set',
  'bastet.html': 'Bastet',
  'hathor.html': 'Hathor',
  'maat.html': 'Maat',
  'neith.html': 'Neith',
  'nephthys.html': 'Nephthys',
  'nut.html': 'Nut',
  'geb.html': 'Geb',
  'ptah.html': 'Ptah',
  'sekhmet.html': 'Sekhmet',
  'sobek.html': 'Sobek',
  'amun-ra.html': 'Amun', // Amun-Ra uses Amun hieroglyphs
  'atum.html': 'Atum',
  'tefnut.html': 'Tefnut',
  'satis.html': 'Satis',
  'montu.html': 'Montu',
  'anhur.html': 'Anhur',
  'apep.html': 'Apep'
};

const deitiesPath = 'H:/Github/EyesOfAzrael/mythos/egyptian/deities';

// Process each deity file
Object.entries(FILE_TO_DEITY).forEach(([filename, deityName]) => {
  const filePath = path.join(deitiesPath, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filename} - file not found`);
    return;
  }

  const hieroglyphData = HIEROGLYPH_DATA[deityName];
  if (!hieroglyphData) {
    console.log(`Skipping ${filename} - no hieroglyph data for ${deityName}`);
    return;
  }

  console.log(`Processing ${filename} (${deityName})...`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has hieroglyphs
  if (content.includes(hieroglyphData.glyph)) {
    console.log(`  ✓ Already has hieroglyphs - skipping`);
    return;
  }

  // Pattern 1: Update header h1 (add hieroglyph before emoji/title)
  // Match: <h1>EMOJI <a class="corpus-link"...>DeityName</a></h1>
  const headerPattern = /(<h1>)([^<]*?)(<a class="corpus-link"[^>]*data-term="[^"]*"[^>]*>)/;
  if (headerPattern.test(content)) {
    content = content.replace(
      headerPattern,
      `$1<span style="font-family: 'Segoe UI Historic', 'Noto Sans Egyptian Hieroglyphs', serif; font-size: 1.2em;">${hieroglyphData.glyph}</span> $2$3`
    );
    console.log(`  ✓ Added hieroglyph to header`);
  }

  // Pattern 2: Update deity header section - add hieroglyph icon and transliteration
  // Find: <div class="deity-icon">EMOJI</div>
  // Add hieroglyph div before it and transliteration to h2
  const iconPattern = /(<section class="deity-header">[\s\S]*?)(<div class="deity-icon">)([^<]+)(<\/div>\s*<h2[^>]*>[^<]*<a[^>]*>[^<]+<\/a>)([^<]*?)(<\/h2>)/;

  if (iconPattern.test(content)) {
    content = content.replace(
      iconPattern,
      (match, before, iconStart, emoji, afterIcon, betweenTitleAndClose, h2Close) => {
        // Add hieroglyph div
        const hieroglyphDiv = `<div class="deity-icon" style="font-family: 'Segoe UI Historic', 'Noto Sans Egyptian Hieroglyphs', serif; font-size: 6rem; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));">${hieroglyphData.glyph}</div>\n`;

        // Add transliteration to h2 title
        const transliteration = ` <span style="font-size: 1.2rem; opacity: 0.8; font-style: italic;">– ${hieroglyphData.transliteration}</span>`;

        return before + hieroglyphDiv + iconStart + emoji + afterIcon + betweenTitleAndClose + transliteration + h2Close;
      }
    );
    console.log(`  ✓ Added hieroglyph icon and transliteration`);
  }

  // Write updated content
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✅ Completed ${filename}\n`);
});

console.log('\n✅ All deity files processed!');

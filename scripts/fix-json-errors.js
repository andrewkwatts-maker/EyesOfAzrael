#!/usr/bin/env node

/**
 * Fix JSON errors in enhanced assets
 */

const fs = require('fs');
const path = require('path');

const ERRORS = [
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\herbs\\persian\\haoma.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\herbs\\norse\\yarrow.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\herbs\\norse\\ash.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\herbs\\hindu\\soma.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\herbs\\greek\\olive.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\herbs\\greek\\laurel.json"
];

// Fix herb JSON files with missing commas
ERRORS.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Fix the common pattern: ] } where it should be ] },
    const fixed = content.replace(/]\s*}/g, '],\n  }');
    fs.writeFileSync(file, fixed, 'utf8');
    console.log(`Fixed: ${path.basename(file)}`);
  } catch (err) {
    console.error(`Error fixing ${file}: ${err.message}`);
  }
});

// Fix Greek deity files with mythology object instead of string
const greekIndividualFiles = [
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\zeus.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\prometheus.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\poseidon.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\persephone.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\hermes.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\hera.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\hephaestus.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\hades.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\dionysus.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\demeter.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\athena.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\artemis.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\ares.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\apollo.json",
  "H:\\Github\\EyesOfAzrael\\firebase-assets-enhanced\\deities\\greek\\individual\\aphrodite.json"
];

greekIndividualFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(content);

    // Fix mythology if it's an object
    if (data.mythology && typeof data.mythology === 'object') {
      data.mythology = 'greek';
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Fixed mythology: ${path.basename(file)}`);
  } catch (err) {
    console.error(`Error fixing ${file}: ${err.message}`);
  }
});

console.log('\nAll errors fixed!');

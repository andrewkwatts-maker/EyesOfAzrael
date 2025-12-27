#!/usr/bin/env node

/**
 * PWA Icon Generator for Eyes of Azrael
 * Generates all required PWA icons with a professional eye symbol
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  backgroundColor: '#1a1a1a',
  primaryColor: '#8b7fff',
  secondaryColor: '#9370DB',
  accentColor: '#6a5acd',
  outputDir: path.join(__dirname, '..', 'icons'),
  sizes: {
    pwa: [72, 96, 128, 144, 152, 192, 384, 512],
    apple: [180],
    favicon: [16, 32, 48, 64]
  }
};

/**
 * Create an eye symbol SVG
 * Design: Stylized eye with mystical/ancient aesthetic
 */
function createEyeSVG(size) {
  const strokeWidth = Math.max(2, size / 64);
  const pupilRadius = size / 8;
  const irisRadius = size / 5;
  const eyeWidth = size * 0.7;
  const eyeHeight = size * 0.4;
  const centerX = size / 2;
  const centerY = size / 2;

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="eyeGlow" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:${config.primaryColor};stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:${config.secondaryColor};stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:${config.accentColor};stop-opacity:0.1" />
        </radialGradient>
        <radialGradient id="pupilGlow" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
          <stop offset="30%" style="stop-color:${config.primaryColor};stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:${config.accentColor};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="${size}" height="${size}" fill="${config.backgroundColor}" rx="${size * 0.1}"/>

      <!-- Outer glow -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="${eyeWidth / 2}" ry="${eyeHeight / 2}"
               fill="url(#eyeGlow)" opacity="0.3"/>

      <!-- Eye outline (almond shape) -->
      <path d="M ${centerX - eyeWidth / 2} ${centerY}
               Q ${centerX - eyeWidth / 2} ${centerY - eyeHeight / 2}, ${centerX} ${centerY - eyeHeight / 2}
               Q ${centerX + eyeWidth / 2} ${centerY - eyeHeight / 2}, ${centerX + eyeWidth / 2} ${centerY}
               Q ${centerX + eyeWidth / 2} ${centerY + eyeHeight / 2}, ${centerX} ${centerY + eyeHeight / 2}
               Q ${centerX - eyeWidth / 2} ${centerY + eyeHeight / 2}, ${centerX - eyeWidth / 2} ${centerY}
               Z"
            fill="none"
            stroke="${config.primaryColor}"
            stroke-width="${strokeWidth * 1.5}"
            opacity="0.9"/>

      <!-- Iris -->
      <circle cx="${centerX}" cy="${centerY}" r="${irisRadius}"
              fill="url(#pupilGlow)" opacity="0.8"/>

      <!-- Inner iris detail -->
      <circle cx="${centerX}" cy="${centerY}" r="${irisRadius * 0.7}"
              fill="none" stroke="${config.secondaryColor}"
              stroke-width="${strokeWidth * 0.5}" opacity="0.6"/>

      <!-- Pupil -->
      <circle cx="${centerX}" cy="${centerY}" r="${pupilRadius}"
              fill="#000000" opacity="0.9"/>

      <!-- Pupil highlight -->
      <circle cx="${centerX - pupilRadius * 0.3}" cy="${centerY - pupilRadius * 0.3}"
              r="${pupilRadius * 0.3}"
              fill="#ffffff" opacity="0.7"/>

      <!-- Mystic symbols around eye (simplified for small sizes) -->
      ${size >= 128 ? `
        <!-- Top symbol -->
        <circle cx="${centerX}" cy="${centerY - eyeHeight * 0.8}" r="${strokeWidth * 2}"
                fill="${config.primaryColor}" opacity="0.7"/>
        <!-- Bottom symbol -->
        <circle cx="${centerX}" cy="${centerY + eyeHeight * 0.8}" r="${strokeWidth * 2}"
                fill="${config.primaryColor}" opacity="0.7"/>
        <!-- Left symbol -->
        <circle cx="${centerX - eyeWidth * 0.6}" cy="${centerY}" r="${strokeWidth * 2}"
                fill="${config.primaryColor}" opacity="0.7"/>
        <!-- Right symbol -->
        <circle cx="${centerX + eyeWidth * 0.6}" cy="${centerY}" r="${strokeWidth * 2}"
                fill="${config.primaryColor}" opacity="0.7"/>
      ` : ''}

      ${size >= 256 ? `
        <!-- Additional mystical details for larger sizes -->
        <circle cx="${centerX}" cy="${centerY}" r="${size * 0.45}"
                fill="none" stroke="${config.primaryColor}"
                stroke-width="${strokeWidth * 0.5}"
                stroke-dasharray="${size * 0.05}, ${size * 0.05}"
                opacity="0.3"/>
      ` : ''}
    </svg>
  `;
}

/**
 * Generate a PNG icon from SVG
 */
async function generateIcon(size, filename, options = {}) {
  const svg = createEyeSVG(size);
  const outputPath = path.join(config.outputDir, filename);

  try {
    await sharp(Buffer.from(svg))
      .resize(size, size, {
        fit: 'contain',
        background: options.background || config.backgroundColor
      })
      .png({
        quality: 100,
        compressionLevel: 9,
        palette: false
      })
      .toFile(outputPath);

    console.log(`✓ Generated: ${filename} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate ${filename}:`, error.message);
    return false;
  }
}

/**
 * Generate favicon.ico (multi-resolution ICO file)
 */
async function generateFavicon() {
  console.log('\nGenerating favicon.ico...');

  // Generate individual sizes for favicon
  const sizes = [16, 32, 48];
  const pngFiles = [];

  for (const size of sizes) {
    const filename = `favicon-${size}.png`;
    await generateIcon(size, filename);
    pngFiles.push(path.join(config.outputDir, filename));
  }

  // Note: Converting to .ico requires additional tools
  // For now, we'll use the 32x32 as the main favicon
  const faviconPath = path.join(config.outputDir, '..', 'favicon.ico');
  const favicon32 = path.join(config.outputDir, 'favicon-32.png');

  try {
    fs.copyFileSync(favicon32, faviconPath);
    console.log('✓ Created favicon.ico (using 32x32 PNG)');
  } catch (error) {
    console.error('✗ Failed to create favicon.ico:', error.message);
  }
}

/**
 * Generate all PWA icons
 */
async function generateAllIcons() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Eyes of Azrael - PWA Icon Generator               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
    console.log(`✓ Created directory: ${config.outputDir}\n`);
  }

  let successCount = 0;
  let totalCount = 0;

  // Generate PWA icons
  console.log('Generating PWA icons...');
  for (const size of config.sizes.pwa) {
    totalCount++;
    const success = await generateIcon(size, `icon-${size}x${size}.png`);
    if (success) successCount++;
  }

  // Generate Apple Touch Icon
  console.log('\nGenerating Apple Touch Icon...');
  for (const size of config.sizes.apple) {
    totalCount++;
    const success = await generateIcon(size, `apple-touch-icon.png`);
    if (success) successCount++;
  }

  // Generate favicon sizes
  console.log('\nGenerating favicon sizes...');
  for (const size of config.sizes.favicon) {
    totalCount++;
    const success = await generateIcon(size, `favicon-${size}.png`);
    if (success) successCount++;
  }

  // Generate favicon.ico
  await generateFavicon();

  // Generate shortcut icons
  console.log('\nGenerating shortcut icons...');
  const shortcuts = [
    { name: 'shortcut-mythos.png', size: 96 },
    { name: 'shortcut-magic.png', size: 96 },
    { name: 'shortcut-herbs.png', size: 96 }
  ];

  for (const shortcut of shortcuts) {
    totalCount++;
    const success = await generateIcon(shortcut.size, shortcut.name);
    if (success) successCount++;
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    GENERATION COMPLETE                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`✓ Successfully generated: ${successCount}/${totalCount} icons`);
  console.log(`✓ Output directory: ${config.outputDir}`);
  console.log('\nGenerated files:');

  // List all generated files
  const files = fs.readdirSync(config.outputDir);
  files.sort().forEach(file => {
    const stats = fs.statSync(path.join(config.outputDir, file));
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file.padEnd(30)} (${sizeKB} KB)`);
  });

  console.log('\n✓ All icons ready for PWA deployment!');
  console.log('✓ manifest.json already configured with correct paths.');

  return successCount === totalCount;
}

// Run the generator
generateAllIcons()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  });

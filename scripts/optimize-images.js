#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts images to WebP format and generates responsive sizes
 * Reduces image sizes by 50-70% on average
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');

// Configuration
const CONFIG = {
  imageDirs: ['icons', 'dist/icons', 'assets', 'images'],
  responsiveSizes: [320, 640, 960, 1280, 1920],
  webpQuality: 85,
  jpegQuality: 85,
  pngCompressionLevel: 9,
  webpEffort: 6, // 0-6, higher = better compression but slower
  skipPatterns: ['**/*.webp', '**/*-optimized.*', '**/*-320w.*', '**/*-640w.*', '**/*-960w.*', '**/*-1280w.*', '**/*-1920w.*'],
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose')
};

// Statistics tracking
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  errorFiles: 0,
  originalSize: 0,
  optimizedSize: 0,
  webpGenerated: 0,
  responsiveGenerated: 0
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Log with optional verbose flag
 */
function log(message, isVerbose = false) {
  if (!isVerbose || CONFIG.verbose) {
    console.log(message);
  }
}

/**
 * Generate WebP version of image
 */
async function generateWebP(imagePath) {
  const ext = path.extname(imagePath);
  const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  // Skip if WebP already exists
  if (fs.existsSync(webpPath)) {
    log(`  ⏭️  WebP already exists: ${webpPath}`, true);
    return null;
  }

  if (CONFIG.dryRun) {
    log(`  [DRY RUN] Would create WebP: ${webpPath}`, true);
    return { saved: 0 };
  }

  try {
    const originalSize = fs.statSync(imagePath).size;

    await sharp(imagePath)
      .webp({
        quality: CONFIG.webpQuality,
        effort: CONFIG.webpEffort
      })
      .toFile(webpPath);

    const webpSize = fs.statSync(webpPath).size;
    const saved = originalSize - webpSize;
    const percent = ((saved / originalSize) * 100).toFixed(1);

    log(`  ✓ WebP: ${formatBytes(originalSize)} → ${formatBytes(webpSize)} (-${percent}%)`, true);

    stats.webpGenerated++;
    return { saved, originalSize, webpSize };
  } catch (error) {
    log(`  ✗ WebP generation failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate responsive versions of image
 */
async function generateResponsiveSizes(imagePath) {
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  const dirname = path.dirname(imagePath);

  let generated = 0;

  try {
    const metadata = await sharp(imagePath).metadata();
    const originalWidth = metadata.width;

    for (const size of CONFIG.responsiveSizes) {
      // Skip if image is smaller than target size
      if (originalWidth <= size) {
        log(`  ⏭️  Skipping ${size}w (original is ${originalWidth}w)`, true);
        continue;
      }

      // Check if responsive versions already exist
      const resizedPath = path.join(dirname, `${basename}-${size}w${ext}`);
      const resizedWebpPath = path.join(dirname, `${basename}-${size}w.webp`);

      if (fs.existsSync(resizedPath) && fs.existsSync(resizedWebpPath)) {
        log(`  ⏭️  ${size}w versions already exist`, true);
        continue;
      }

      if (CONFIG.dryRun) {
        log(`  [DRY RUN] Would create ${size}w versions`, true);
        generated += 2;
        continue;
      }

      // Generate regular format (optimized)
      if (!fs.existsSync(resizedPath)) {
        const sharpInstance = sharp(imagePath).resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside'
        });

        if (ext.match(/\.jpe?g$/i)) {
          await sharpInstance
            .jpeg({ quality: CONFIG.jpegQuality, progressive: true })
            .toFile(resizedPath);
        } else if (ext.match(/\.png$/i)) {
          await sharpInstance
            .png({ compressionLevel: CONFIG.pngCompressionLevel })
            .toFile(resizedPath);
        }

        log(`  ✓ Generated ${size}w${ext}`, true);
        generated++;
      }

      // Generate WebP format
      if (!fs.existsSync(resizedWebpPath)) {
        await sharp(imagePath)
          .resize(size, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: CONFIG.webpQuality, effort: CONFIG.webpEffort })
          .toFile(resizedWebpPath);

        log(`  ✓ Generated ${size}w.webp`, true);
        generated++;
      }
    }

    stats.responsiveGenerated += generated;
    return generated;
  } catch (error) {
    log(`  ✗ Responsive generation failed: ${error.message}`);
    return 0;
  }
}

/**
 * Process a single image file
 */
async function processImage(imagePath) {
  log(`\n📷 Processing: ${imagePath}`);

  try {
    const originalSize = fs.statSync(imagePath).size;
    stats.originalSize += originalSize;

    // Generate WebP version
    const webpResult = await generateWebP(imagePath);
    if (webpResult) {
      stats.optimizedSize += webpResult.webpSize || 0;
    }

    // Generate responsive sizes
    const responsiveCount = await generateResponsiveSizes(imagePath);

    stats.processedFiles++;
    log(`  ✅ Complete (${responsiveCount} responsive versions generated)`, true);
  } catch (error) {
    log(`  ✗ Error processing ${imagePath}: ${error.message}`);
    stats.errorFiles++;
  }
}

/**
 * Find all images to process
 */
async function findImages() {
  const allImages = [];

  for (const dir of CONFIG.imageDirs) {
    const dirPath = path.join(process.cwd(), dir);

    if (!fs.existsSync(dirPath)) {
      log(`⏭️  Directory not found: ${dirPath}`, true);
      continue;
    }

    const pattern = `${dir}/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}`;
    const images = await glob(pattern, {
      ignore: CONFIG.skipPatterns,
      nodir: true
    });

    log(`📁 Found ${images.length} images in ${dir}`, true);
    allImages.push(...images);
  }

  return allImages;
}

/**
 * Display final statistics
 */
function displayStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n📈 Statistics:`);
  console.log(`  Total images found:      ${stats.totalFiles}`);
  console.log(`  Successfully processed:  ${stats.processedFiles}`);
  console.log(`  Skipped:                 ${stats.skippedFiles}`);
  console.log(`  Errors:                  ${stats.errorFiles}`);

  console.log(`\n🖼️  Generated:`);
  console.log(`  WebP versions:           ${stats.webpGenerated}`);
  console.log(`  Responsive versions:     ${stats.responsiveGenerated}`);

  if (stats.optimizedSize > 0) {
    const totalSavings = stats.originalSize - stats.optimizedSize;
    const percentSaved = ((totalSavings / stats.originalSize) * 100).toFixed(1);

    console.log(`\n💾 Size Savings:`);
    console.log(`  Original size:           ${formatBytes(stats.originalSize)}`);
    console.log(`  Optimized size:          ${formatBytes(stats.optimizedSize)}`);
    console.log(`  Total savings:           ${formatBytes(totalSavings)} (${percentSaved}%)`);
  }

  if (CONFIG.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No files were modified');
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  IMAGE OPTIMIZATION TOOL');
  console.log('='.repeat(60));

  if (CONFIG.dryRun) {
    console.log('⚠️  Running in DRY RUN mode - no files will be modified\n');
  }

  const startTime = Date.now();

  try {
    // Find all images
    const images = await findImages();
    stats.totalFiles = images.length;

    if (images.length === 0) {
      console.log('\n⚠️  No images found to process');
      return;
    }

    console.log(`\n🎯 Found ${images.length} images to process\n`);

    // Process each image
    for (const imagePath of images) {
      await processImage(imagePath);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Display final statistics
    displayStats();
    console.log(`⏱️  Completed in ${duration} seconds\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { optimizeImages: main };

#!/bin/bash

###
# PWA Icon Generator
# Generates all required PWA icon sizes from a source image
# Requires ImageMagick: sudo apt-get install imagemagick (Linux)
#                      brew install imagemagick (macOS)
###

set -e

echo "======================================"
echo "  PWA Icon Generator"
echo "======================================"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed"
    echo ""
    echo "Install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Source image (should be at least 512x512)
SOURCE="icons/icon-source.png"

# Check if source exists
if [ ! -f "$SOURCE" ]; then
    echo "⚠️  Source image not found: $SOURCE"
    echo "   Creating a placeholder icon..."

    # Create icons directory
    mkdir -p icons

    # Generate a simple placeholder icon (purple eye emoji on dark background)
    convert -size 512x512 \
        xc:"#1a1a1a" \
        -font "Arial-Unicode-MS" \
        -pointsize 350 \
        -fill "#8b7fff" \
        -gravity center \
        -annotate +0+0 "👁️" \
        "$SOURCE"

    echo "✅ Created placeholder icon: $SOURCE"
fi

# Required PWA icon sizes
SIZES=(72 96 128 144 152 192 384 512)

echo "📱 Generating PWA icons..."
echo ""

for SIZE in "${SIZES[@]}"; do
    OUTPUT="icons/icon-${SIZE}x${SIZE}.png"

    echo "   Generating ${SIZE}x${SIZE}..."

    convert "$SOURCE" \
        -resize "${SIZE}x${SIZE}" \
        -quality 95 \
        "$OUTPUT"

    # Verify file was created
    if [ -f "$OUTPUT" ]; then
        FILE_SIZE=$(du -h "$OUTPUT" | cut -f1)
        echo "   ✅ Created: $OUTPUT ($FILE_SIZE)"
    else
        echo "   ❌ Failed to create: $OUTPUT"
        exit 1
    fi
done

# Generate Apple Touch Icon (180x180)
echo ""
echo "   Generating Apple Touch Icon (180x180)..."
convert "$SOURCE" \
    -resize "180x180" \
    -quality 95 \
    "icons/apple-touch-icon.png"

echo "   ✅ Created: icons/apple-touch-icon.png"

# Generate favicon.ico (multi-size)
echo ""
echo "   Generating favicon.ico (16, 32, 48)..."
convert "$SOURCE" \
    -define icon:auto-resize=48,32,16 \
    "favicon.ico"

echo "   ✅ Created: favicon.ico"

# Update manifest.json
echo ""
echo "📄 Updating manifest.json..."

cat > manifest.json << 'EOF'
{
  "name": "Eyes of Azrael",
  "short_name": "Eyes of Azrael",
  "description": "Explore world mythologies - deities, heroes, creatures, and sacred texts from cultures across the globe",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#8b7fff",
  "orientation": "any",
  "icons": [
    {
      "src": "icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "screenshots/mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
EOF

echo "✅ Updated manifest.json"

echo ""
echo "======================================"
echo "✅ PWA icons generated successfully!"
echo "======================================"
echo ""
echo "Generated files:"
echo "  • icons/icon-72x72.png through icon-512x512.png"
echo "  • icons/apple-touch-icon.png"
echo "  • favicon.ico"
echo "  • manifest.json (updated)"
echo ""
echo "Next steps:"
echo "  1. Update index.html to reference manifest.json"
echo "  2. Add <link rel=\"manifest\" href=\"/manifest.json\">"
echo "  3. Deploy to Firebase Hosting"
echo ""

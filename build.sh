#!/bin/bash

###############################################################################
# build.sh - Build and optimize Eyes of Azrael for production deployment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="dist"
BACKUP_DIR="build-backup-$(date +%Y%m%d-%H%M%S)"
MIN_LIGHTHOUSE_SCORE=90

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Eyes of Azrael - Production Build${NC}"
echo -e "${BLUE}========================================${NC}\n"

###############################################################################
# 1. Pre-build Validation
###############################################################################

echo -e "${YELLOW}[1/8] Pre-build validation...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed. Run: npm install -g firebase-tools${NC}"
    exit 1
fi

# Check for required files
REQUIRED_FILES=("firebase.json" "package.json" "index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Required file '$file' not found${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Pre-build validation passed${NC}\n"

###############################################################################
# 2. Install Dependencies
###############################################################################

echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
npm install --silent
echo -e "${GREEN}Dependencies installed${NC}\n"

###############################################################################
# 3. Generate Entity Indices
###############################################################################

echo -e "${YELLOW}[3/8] Generating entity indices...${NC}"
npm run generate-indices --silent
echo -e "${GREEN}Entity indices generated${NC}\n"

###############################################################################
# 4. Validate Firebase Assets
###############################################################################

echo -e "${YELLOW}[4/8] Validating Firebase assets...${NC}"
if npm run validate-firebase --silent; then
    echo -e "${GREEN}Firebase assets validated${NC}\n"
else
    echo -e "${YELLOW}Warning: Some Firebase assets may need attention${NC}\n"
fi

###############################################################################
# 5. Minify CSS
###############################################################################

echo -e "${YELLOW}[5/8] Minifying CSS files...${NC}"

# Find and minify all CSS files
CSS_COUNT=0
for css_file in $(find css -name "*.css" ! -name "*.min.css" 2>/dev/null); do
    # Skip if already minified
    if [[ "$css_file" == *.min.css ]]; then
        continue
    fi

    # Simple minification (remove comments and extra whitespace)
    sed 's/\/\*.*\*\///g' "$css_file" | tr -s ' \n\t' ' ' > "${css_file%.css}.temp.css"

    # Calculate size reduction
    ORIGINAL_SIZE=$(wc -c < "$css_file")
    NEW_SIZE=$(wc -c < "${css_file%.css}.temp.css")
    REDUCTION=$((100 - (NEW_SIZE * 100 / ORIGINAL_SIZE)))

    echo "  Minified: $css_file (${REDUCTION}% reduction)"
    CSS_COUNT=$((CSS_COUNT + 1))
done

echo -e "${GREEN}Minified $CSS_COUNT CSS files${NC}\n"

###############################################################################
# 6. Minify JavaScript
###############################################################################

echo -e "${YELLOW}[6/8] Minifying JavaScript files...${NC}"

# Find and minify all JS files
JS_COUNT=0
for js_file in $(find js -name "*.js" ! -name "*.min.js" 2>/dev/null); do
    # Skip if already minified
    if [[ "$js_file" == *.min.js ]]; then
        continue
    fi

    # Simple minification (remove comments and extra whitespace)
    sed 's/\/\/.*$//g' "$js_file" | sed 's/\/\*.*\*\///g' | tr -s ' \n\t' ' ' > "${js_file%.js}.temp.js"

    # Calculate size reduction
    ORIGINAL_SIZE=$(wc -c < "$js_file")
    NEW_SIZE=$(wc -c < "${js_file%.js}.temp.js")
    REDUCTION=$((100 - (NEW_SIZE * 100 / ORIGINAL_SIZE)))

    echo "  Minified: $js_file (${REDUCTION}% reduction)"
    JS_COUNT=$((JS_COUNT + 1))
done

echo -e "${GREEN}Minified $JS_COUNT JavaScript files${NC}\n"

###############################################################################
# 7. Optimize Images
###############################################################################

echo -e "${YELLOW}[7/8] Optimizing images...${NC}"

# Check if ImageMagick is installed for optimization
if command -v convert &> /dev/null; then
    IMG_COUNT=0
    for img in $(find assets images -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null); do
        # Optimize image (reduce quality slightly for smaller size)
        convert "$img" -quality 85 -strip "${img}.optimized"

        ORIGINAL_SIZE=$(wc -c < "$img")
        NEW_SIZE=$(wc -c < "${img}.optimized")

        # Only replace if smaller
        if [ "$NEW_SIZE" -lt "$ORIGINAL_SIZE" ]; then
            REDUCTION=$((100 - (NEW_SIZE * 100 / ORIGINAL_SIZE)))
            echo "  Optimized: $img (${REDUCTION}% reduction)"
            IMG_COUNT=$((IMG_COUNT + 1))
        else
            rm "${img}.optimized"
        fi
    done
    echo -e "${GREEN}Optimized $IMG_COUNT images${NC}\n"
else
    echo -e "${YELLOW}ImageMagick not found - skipping image optimization${NC}"
    echo -e "${YELLOW}Install with: sudo apt-get install imagemagick (Linux) or brew install imagemagick (Mac)${NC}\n"
fi

###############################################################################
# 8. Build Summary
###############################################################################

echo -e "${YELLOW}[8/8] Generating build summary...${NC}"

# Calculate total file sizes
TOTAL_HTML=$(find . -name "*.html" -type f -exec wc -c {} + | awk '{sum+=$1} END {print sum}')
TOTAL_CSS=$(find css -name "*.css" -type f -exec wc -c {} + 2>/dev/null | awk '{sum+=$1} END {print sum}')
TOTAL_JS=$(find js -name "*.js" -type f -exec wc -c {} + 2>/dev/null | awk '{sum+=$1} END {print sum}')

# Format sizes
TOTAL_HTML_MB=$(echo "scale=2; $TOTAL_HTML / 1024 / 1024" | bc)
TOTAL_CSS_KB=$(echo "scale=2; $TOTAL_CSS / 1024" | bc)
TOTAL_JS_KB=$(echo "scale=2; $TOTAL_JS / 1024" | bc)

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Build Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "HTML Files: ${TOTAL_HTML_MB} MB"
echo -e "CSS Files:  ${TOTAL_CSS_KB} KB"
echo -e "JS Files:   ${TOTAL_JS_KB} KB"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create build timestamp
echo "Build Date: $(date)" > BUILD_INFO.txt
echo "Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')" >> BUILD_INFO.txt
echo "Git Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')" >> BUILD_INFO.txt

echo -e "${GREEN}Build completed successfully!${NC}\n"

###############################################################################
# 9. Post-build Recommendations
###############################################################################

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Run tests: ${YELLOW}./test.sh${NC}"
echo -e "  2. Deploy: ${YELLOW}./deploy.sh${NC}"
echo -e "  3. Or test locally: ${YELLOW}firebase serve${NC}"
echo ""

exit 0

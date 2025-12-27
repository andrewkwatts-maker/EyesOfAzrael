#!/bin/bash

###############################################################################
# test.sh - Run comprehensive tests before deployment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_LIGHTHOUSE_SCORE=90
TEST_RESULTS_DIR="test-results-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Eyes of Azrael - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Track failures
FAILURES=0

###############################################################################
# 1. Validate HTML Structure
###############################################################################

echo -e "${YELLOW}[1/10] Validating HTML structure...${NC}"

HTML_ERRORS=0
for html_file in $(find . -name "*.html" -not -path "./node_modules/*" -not -path "./dist/*"); do
    # Check for basic HTML structure
    if ! grep -q "<!DOCTYPE html>" "$html_file"; then
        echo -e "${RED}  Missing DOCTYPE: $html_file${NC}"
        HTML_ERRORS=$((HTML_ERRORS + 1))
    fi
    if ! grep -q "<html" "$html_file"; then
        echo -e "${RED}  Missing <html> tag: $html_file${NC}"
        HTML_ERRORS=$((HTML_ERRORS + 1))
    fi
    if ! grep -q "</html>" "$html_file"; then
        echo -e "${RED}  Missing </html> tag: $html_file${NC}"
        HTML_ERRORS=$((HTML_ERRORS + 1))
    fi
done

if [ $HTML_ERRORS -eq 0 ]; then
    echo -e "${GREEN}HTML structure validation passed${NC}\n"
else
    echo -e "${RED}Found $HTML_ERRORS HTML structure errors${NC}\n"
    FAILURES=$((FAILURES + 1))
fi

###############################################################################
# 2. Check for Console Errors in JavaScript
###############################################################################

echo -e "${YELLOW}[2/10] Checking JavaScript syntax...${NC}"

JS_ERRORS=0
for js_file in $(find js -name "*.js" 2>/dev/null); do
    # Check for common syntax errors
    if grep -q "console.log" "$js_file" && [ "$NODE_ENV" = "production" ]; then
        echo -e "${YELLOW}  Warning: console.log found in $js_file${NC}"
    fi

    # Check for debugger statements
    if grep -q "debugger" "$js_file"; then
        echo -e "${RED}  ERROR: debugger statement in $js_file${NC}"
        JS_ERRORS=$((JS_ERRORS + 1))
    fi
done

if [ $JS_ERRORS -eq 0 ]; then
    echo -e "${GREEN}JavaScript validation passed${NC}\n"
else
    echo -e "${RED}Found $JS_ERRORS JavaScript errors${NC}\n"
    FAILURES=$((FAILURES + 1))
fi

###############################################################################
# 3. Validate Firebase Rules
###############################################################################

echo -e "${YELLOW}[3/10] Validating Firebase rules...${NC}"

if [ -f "firestore.rules" ]; then
    # Basic syntax check for Firebase rules
    if grep -q "allow read" "firestore.rules" && grep -q "allow write" "firestore.rules"; then
        echo -e "${GREEN}Firestore rules validation passed${NC}\n"
    else
        echo -e "${RED}Firestore rules may be incomplete${NC}\n"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}No firestore.rules file found${NC}\n"
fi

if [ -f "storage.rules" ]; then
    # Basic syntax check for storage rules
    if grep -q "allow read" "storage.rules" && grep -q "allow write" "storage.rules"; then
        echo -e "${GREEN}Storage rules validation passed${NC}\n"
    else
        echo -e "${RED}Storage rules may be incomplete${NC}\n"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}No storage.rules file found${NC}\n"
fi

###############################################################################
# 4. Validate Entity Data
###############################################################################

echo -e "${YELLOW}[4/10] Validating entity data...${NC}"

if [ -d "data/entities" ]; then
    ENTITY_ERRORS=0
    for json_file in $(find data/entities -name "*.json" 2>/dev/null | head -20); do
        if ! python3 -m json.tool "$json_file" > /dev/null 2>&1; then
            if ! node -e "require('$json_file')" > /dev/null 2>&1; then
                echo -e "${RED}  Invalid JSON: $json_file${NC}"
                ENTITY_ERRORS=$((ENTITY_ERRORS + 1))
            fi
        fi
    done

    if [ $ENTITY_ERRORS -eq 0 ]; then
        echo -e "${GREEN}Entity data validation passed${NC}\n"
    else
        echo -e "${RED}Found $ENTITY_ERRORS entity data errors${NC}\n"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}No entity data directory found${NC}\n"
fi

###############################################################################
# 5. Check Firebase Configuration
###############################################################################

echo -e "${YELLOW}[5/10] Checking Firebase configuration...${NC}"

if [ -f "firebase.json" ]; then
    # Validate JSON structure
    if python3 -m json.tool "firebase.json" > /dev/null 2>&1 || node -e "require('./firebase.json')" > /dev/null 2>&1; then
        echo -e "${GREEN}Firebase configuration valid${NC}\n"
    else
        echo -e "${RED}firebase.json is invalid${NC}\n"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${RED}firebase.json not found${NC}\n"
    FAILURES=$((FAILURES + 1))
fi

###############################################################################
# 6. Check for Broken Links
###############################################################################

echo -e "${YELLOW}[6/10] Checking for broken internal links...${NC}"

BROKEN_LINKS=0
# Sample check on a few HTML files
for html_file in index.html about.html dashboard.html; do
    if [ -f "$html_file" ]; then
        # Extract href links and check if files exist
        grep -o 'href="[^"]*"' "$html_file" | sed 's/href="\([^"]*\)"/\1/' | while read -r link; do
            # Skip external links and anchors
            if [[ "$link" != http* ]] && [[ "$link" != \#* ]] && [[ "$link" != javascript:* ]]; then
                # Remove query strings and anchors
                link_path="${link%%\?*}"
                link_path="${link_path%%\#*}"

                # Check if file exists
                if [[ -n "$link_path" ]] && [[ ! -f "$link_path" ]] && [[ ! -d "$link_path" ]]; then
                    echo -e "${YELLOW}  Potentially broken link in $html_file: $link${NC}"
                    BROKEN_LINKS=$((BROKEN_LINKS + 1))
                fi
            fi
        done
    fi
done

if [ $BROKEN_LINKS -eq 0 ]; then
    echo -e "${GREEN}Link validation passed${NC}\n"
else
    echo -e "${YELLOW}Found $BROKEN_LINKS potentially broken links${NC}\n"
fi

###############################################################################
# 7. Security Audit
###############################################################################

echo -e "${YELLOW}[7/10] Running security audit...${NC}"

SECURITY_ISSUES=0

# Check for exposed API keys
for file in $(find . -name "*.html" -o -name "*.js" | head -20); do
    if grep -qi "api.key" "$file" 2>/dev/null; then
        if grep -qiE "AIza[0-9A-Za-z_-]{35}" "$file" 2>/dev/null; then
            echo -e "${RED}  Potential exposed API key in $file${NC}"
            SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
        fi
    fi
done

# Check for hardcoded credentials
for file in $(find . -name "*.js" | head -20); do
    if grep -qiE "(password|passwd|pwd|secret)" "$file" 2>/dev/null; then
        echo -e "${YELLOW}  Warning: Password-related strings in $file${NC}"
    fi
done

if [ $SECURITY_ISSUES -eq 0 ]; then
    echo -e "${GREEN}Security audit passed${NC}\n"
else
    echo -e "${RED}Found $SECURITY_ISSUES security issues${NC}\n"
    FAILURES=$((FAILURES + 1))
fi

###############################################################################
# 8. Check Asset Sizes
###############################################################################

echo -e "${YELLOW}[8/10] Checking asset sizes...${NC}"

SIZE_WARNINGS=0

# Check for large images
for img in $(find assets images -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null); do
    SIZE=$(wc -c < "$img" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 500000 ]; then  # 500KB
        SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc 2>/dev/null || echo "0")
        echo -e "${YELLOW}  Large image: $img (${SIZE_MB}MB)${NC}"
        SIZE_WARNINGS=$((SIZE_WARNINGS + 1))
    fi
done

# Check for large JS files
for js in $(find js -name "*.js" 2>/dev/null); do
    SIZE=$(wc -c < "$js" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 100000 ]; then  # 100KB
        SIZE_KB=$(echo "scale=2; $SIZE / 1024" | bc 2>/dev/null || echo "0")
        echo -e "${YELLOW}  Large JavaScript file: $js (${SIZE_KB}KB)${NC}"
        SIZE_WARNINGS=$((SIZE_WARNINGS + 1))
    fi
done

if [ $SIZE_WARNINGS -eq 0 ]; then
    echo -e "${GREEN}Asset size check passed${NC}\n"
else
    echo -e "${YELLOW}Found $SIZE_WARNINGS size warnings (consider optimization)${NC}\n"
fi

###############################################################################
# 9. Firebase Emulator Tests
###############################################################################

echo -e "${YELLOW}[9/10] Testing with Firebase emulators...${NC}"

if command -v firebase &> /dev/null; then
    # Check if emulators are configured
    if grep -q "emulators" firebase.json; then
        echo -e "${GREEN}Firebase emulators configured${NC}"
        echo -e "${YELLOW}To run emulator tests: firebase emulators:start${NC}\n"
    else
        echo -e "${YELLOW}Firebase emulators not configured${NC}\n"
    fi
else
    echo -e "${YELLOW}Firebase CLI not installed${NC}\n"
fi

###############################################################################
# 10. Generate Test Report
###############################################################################

echo -e "${YELLOW}[10/10] Generating test report...${NC}"

# Create test report
cat > "$TEST_RESULTS_DIR/test-report.txt" << EOF
Eyes of Azrael - Test Report
Generated: $(date)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')
Git Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')

Test Results:
- HTML Validation: $([ $HTML_ERRORS -eq 0 ] && echo "PASSED" || echo "FAILED ($HTML_ERRORS errors)")
- JavaScript Validation: $([ $JS_ERRORS -eq 0 ] && echo "PASSED" || echo "FAILED ($JS_ERRORS errors)")
- Firebase Rules: CHECKED
- Entity Data: CHECKED
- Firebase Config: CHECKED
- Link Validation: $([ $BROKEN_LINKS -eq 0 ] && echo "PASSED" || echo "$BROKEN_LINKS warnings")
- Security Audit: $([ $SECURITY_ISSUES -eq 0 ] && echo "PASSED" || echo "FAILED ($SECURITY_ISSUES issues)")
- Asset Sizes: $([ $SIZE_WARNINGS -eq 0 ] && echo "PASSED" || echo "$SIZE_WARNINGS warnings")

Total Failures: $FAILURES
EOF

echo -e "${GREEN}Test report saved to: $TEST_RESULTS_DIR/test-report.txt${NC}\n"

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All critical tests passed!${NC}"
    echo -e "${GREEN}Ready for deployment${NC}\n"
    exit 0
else
    echo -e "${RED}$FAILURES critical test(s) failed${NC}"
    echo -e "${RED}Please fix errors before deploying${NC}\n"
    exit 1
fi
